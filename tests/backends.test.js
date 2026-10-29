import { test } from 'vitest';
import assert from 'node:assert/strict';
import { FakeStorage, initial, withCost, costOf } from './helpers.js';
import { LocalStorageBackend, MemoryBackend, openBestBackend, UNREADABLE } from '../src/storage/backends.js';
import { VaultStore } from '../src/storage/store.js';
import { addEvent, makeEvent } from '../src/domain/timeline.js';

const FAST = { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 };
const PIN = '2581';

test('LocalStorage: full vault lifecycle; only salt/IV/ciphertext are stored', async () => {
  const ls = new FakeStorage();
  const store = new VaultStore(new LocalStorageBackend(ls), FAST);
  await store.create(PIN, initial({ dailyCostHuf: 4321 }));
  await store.save(addEvent(store.data, makeEvent('note', { date: '2026-01-02', note: 'NAGYON_SZEMELYES' })));
  store.lock();

  const dump = ls.dump();
  for (const secret of ['NAGYON_SZEMELYES', '4321', '2026-01-01', PIN]) assert.ok(!dump.includes(secret), secret);
  assert.deepEqual([...ls.items.keys()].sort(), ['jozansag-szamlalo:meta', 'jozansag-szamlalo:vault', 'jozansag-szamlalo:vault.prev']);

  const record = JSON.parse(ls.getItem('jozansag-szamlalo:vault'));
  assert.ok(record.slots.pin.kdf.salt && record.slots.pin.iv && record.payload.iv && record.payload.ct);
  assert.ok(!/"(key|dek|raw|secret|pin)"\s*:\s*"/i.test(JSON.stringify(record.payload)), 'no key material fields');

  await store.unlock(PIN);
  assert.equal(store.data.events[0].note, 'NAGYON_SZEMELYES');
});

test('LocalStorage: quota exceeded rolls back every key and keeps old state', async () => {
  const ls = new FakeStorage({ quotaBytes: 14_000 });
  const store = new VaultStore(new LocalStorageBackend(ls), FAST);
  await store.create(PIN, initial());
  const before = ls.dump();
  const big = { ...store.data, events: Array.from({ length: 40 }, (_, i) => makeEvent('note', { date: '2026-01-02', note: 'x'.repeat(150) + i })) };
  await assert.rejects(store.save(big), { code: 'QUOTA' });
  assert.equal(ls.dump(), before, 'all-or-nothing');
  store.lock();
  await store.unlock(PIN);
  assert.equal(store.data.events.length, 0);
});

test('LocalStorage: unparseable record is reported as CORRUPTED, never as "no journal"', async () => {
  const ls = new FakeStorage();
  const backend = new LocalStorageBackend(ls);
  const store = new VaultStore(backend, FAST);
  await store.create(PIN, initial());
  await store.save(withCost(store.data, 3000));
  store.lock();
  ls.setItem('jozansag-szamlalo:vault', '{"format":1,"slo');
  assert.equal(await backend.get('vault'), UNREADABLE);
  assert.equal(await store.exists(), true, 'must not fall through to first-time setup');
  await assert.rejects(store.unlock(PIN), { code: 'CORRUPTED' });
  await store.restorePrevious(PIN);
  assert.equal(costOf(store.data), 2500, 'previous copy = state before the last save');
});

test('LocalStorage: destroy removes only this app\'s keys', async () => {
  const ls = new FakeStorage();
  ls.setItem('other-app', 'keep');
  const store = new VaultStore(new LocalStorageBackend(ls), FAST);
  await store.create(PIN, initial());
  await store.wipe();
  assert.deepEqual([...ls.items.keys()], ['other-app']);
});

test('fallback chain: IndexedDB → localStorage → memory', async () => {
  const noIdb = () => Promise.reject(new Error('no idb'));
  assert.equal((await openBestBackend({ openIndexedDB: noIdb, getLocalStorage: () => new FakeStorage() })).kind, 'localstorage');
  assert.equal((await openBestBackend({ openIndexedDB: noIdb, getLocalStorage: () => new FakeStorage({ blocked: true }) })).kind, 'memory');
  assert.equal((await openBestBackend({ openIndexedDB: noIdb, getLocalStorage: () => { throw new Error('SecurityError'); } })).kind, 'memory');
  const mem = (await openBestBackend({ openIndexedDB: noIdb, getLocalStorage: () => undefined }));
  assert.equal(mem.persistent, false, 'UI must warn when nothing persists');

  const idb = new MemoryBackend();
  idb.kind = 'indexeddb';
  assert.equal((await openBestBackend({ openIndexedDB: async () => idb, getLocalStorage: () => new FakeStorage() })).kind, 'indexeddb');
});

test('fallback chain: an existing localStorage journal wins over an empty IndexedDB', async () => {
  const ls = new FakeStorage();
  await new VaultStore(new LocalStorageBackend(ls), FAST).create(PIN, initial());
  const idb = new MemoryBackend();
  idb.kind = 'indexeddb';
  const chosen = await openBestBackend({ openIndexedDB: async () => idb, getLocalStorage: () => ls });
  assert.equal(chosen.kind, 'localstorage');
});
