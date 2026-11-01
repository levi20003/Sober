// 1. fázis (biztonsági audit, docs/audit/2026-11-biztonsagi-audit.md): minden megállapításhoz egy teszt, ami a javítás
// előtt elbukott. A megállapítás azonosítója (F1…) a teszt nevében szerepel.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { makeStore, initial, FakeStorage } from './helpers.js';
import { MemoryBackend, LocalStorageBackend, openBestBackend } from '../src/storage/backends.js';
import { VaultStore, MAX_DELAY_MS } from '../src/storage/store.js';
import { createAppAuth, AuthStatus } from '../src/auth/appAuth.js';
import { openKeySlot, createKeySlot, generateDek, normalizeSecret, MAX_ITERATIONS } from '../src/crypto/vault.js';
import { safeJsonParse, MAX_IMPORT_BYTES } from '../src/lib/safeJson.js';
import { parseJsonImport } from '../src/domain/export.js';

const PIN = 'regi-jelszo-7391';
const NEW_PIN = 'uj-jelszo-4402';

test('F1: after a PIN change the old PIN opens neither the current nor the previous copy', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  await store.save({ ...store.data, events: [] });
  await store.changePin(PIN, NEW_PIN);
  const prev = await backend.get('vault.prev');
  await assert.rejects(openKeySlot(prev.slots.pin, PIN, { minIterations: 1000 }), { code: 'WRONG_SECRET' }, 'old PIN must not open vault.prev');
  store.lock();
  await assert.rejects(store.restorePrevious(PIN), { code: 'WRONG_SECRET' });
  await store.unlock(NEW_PIN);
});

test('F1: the same holds after "forgot PIN" recovery', async () => {
  const { store, backend } = makeStore();
  const { recoveryCode } = await store.create(PIN, initial());
  store.lock();
  await store.recover(recoveryCode, NEW_PIN);
  const prev = await backend.get('vault.prev');
  if (prev) await assert.rejects(openKeySlot(prev.slots.pin, PIN, { minIterations: 1000 }), { code: 'WRONG_SECRET' });
});

test('F2: wrong PINs in "change PIN", "new recovery code" and "restore previous" count towards the throttle', async () => {
  const { store } = makeStore();
  await store.create(PIN, initial());
  await store.save({ ...store.data, events: [] }); // így van "vault.prev" is
  for (let i = 0; i < 5; i++) await assert.rejects(store.changePin('rossz-' + i + 'xx', NEW_PIN), { code: 'WRONG_SECRET' });
  await assert.rejects(store.changePin(PIN, NEW_PIN), (e) => e.code === 'WRONG_SECRET' && e.retryAfterMs > 0, 'even the right PIN waits during lockout');
  await assert.rejects(store.regenerateRecoveryCode(PIN), (e) => e.retryAfterMs > 0);
  store.lock();
  await assert.rejects(store.restorePrevious(PIN), (e) => e.retryAfterMs > 0);
});

test('F5: the DEK held in memory after setup is not extractable', async () => {
  const { store } = makeStore();
  await store.create(PIN, initial());
  assert.equal(store.keyIsExtractable, false);
});

test('F6: setting the clock back never extends the lockout beyond the maximum, and the wait still applies', async () => {
  const { store, clock } = makeStore();
  await store.create(PIN, initial());
  store.lock();
  for (let i = 0; i < 6; i++) await assert.rejects(store.unlock('rossz-' + i + 'xx'));
  const before = await store.attemptWaitMs();
  assert.ok(before > 0);
  clock.advance(-24 * 3600_000); // a felhasználó egy nappal visszaállítja az órát
  const after = await store.attemptWaitMs();
  assert.ok(after > 0 && after <= MAX_DELAY_MS, `wait stays bounded (${after} ms)`);
});

test('F4: two tabs saving the same journal: the stale one is refused instead of silently overwriting', async () => {
  const backend = new MemoryBackend();
  const a = makeStore({ backend }).store;
  await a.create(PIN, initial());
  const b = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await b.unlock(PIN);
  await b.save({ ...b.data, events: [{ id: 'evt-bbbbbb', type: 'note', date: '2026-01-02', at: '2026-01-02T10:00:00Z', note: 'B ablak' }] });
  await assert.rejects(a.save({ ...a.data, events: [] }), { code: 'CONFLICT' });
  await b.lock();
  const c = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await c.unlock(PIN);
  assert.equal(c.data.events.length, 1, 'tab B\'s entry survived');
});

test('F3: if IndexedDB held the journal but is unavailable now, no empty localStorage journal is offered', async () => {
  const ls = new FakeStorage();
  ls.setItem('jozansag-szamlalo:has-idb-vault', '1');
  await assert.rejects(openBestBackend({ openIndexedDB: async () => { throw new Error('timeout'); }, getLocalStorage: () => ls }), { code: 'UNAVAILABLE' });
  const auth = createAppAuth({ openBackend: () => openBestBackend({ openIndexedDB: async () => { throw new Error('timeout'); }, getLocalStorage: () => ls }) });
  await auth.init().catch(() => {});
  assert.equal(auth.getState().status, AuthStatus.STORAGE_ERROR, 'never FIRST_TIME_SETUP over an existing journal');
});

test('F7: a tampered slot with an absurd iteration count is refused instead of freezing the app', async () => {
  const dek = await generateDek();
  const slot = await createKeySlot(dek, PIN, 1000);
  slot.kdf.iterations = 2_000_000_000;
  await assert.rejects(openKeySlot(slot, PIN, { minIterations: 1000 }), { code: 'CORRUPTED' });
  assert.ok(MAX_ITERATIONS >= 600_000 && MAX_ITERATIONS <= 10_000_000);
});

test('F8: imports are size-, depth- and key-limited (no prototype keys, no huge files)', () => {
  assert.throws(() => safeJsonParse('x'.repeat(MAX_IMPORT_BYTES + 1)), { code: 'TOO_LARGE' });
  assert.throws(() => safeJsonParse('{"__proto__": {"polluted": 1}}'), { code: 'FORBIDDEN_KEY' });
  assert.throws(() => safeJsonParse('{"a": {"constructor": {"prototype": 1}}}'), { code: 'FORBIDDEN_KEY' });
  assert.throws(() => safeJsonParse('['.repeat(200) + ']'.repeat(200)), { code: 'TOO_DEEP' });
  assert.equal({}.polluted, undefined);
  assert.deepEqual(safeJsonParse('﻿{"a":1}'), { a: 1 }, 'a UTF-8 BOM is tolerated');
  assert.throws(() => parseJsonImport('{"app":"jozansag-szamlalo","kind":"plain-export","data":{"__proto__":{}}}'));
});

test('Unicode: the same passphrase typed with composed or decomposed accents opens the vault', async () => {
  const composed = 'kávé-erdő-ŐSZ'.normalize('NFC');
  const decomposed = composed.normalize('NFD');
  assert.notEqual(composed, decomposed);
  assert.equal(normalizeSecret(composed), normalizeSecret(decomposed));
  const { store } = makeStore();
  await store.create(composed, initial());
  store.lock();
  await store.unlock(decomposed);
  assert.ok(store.isUnlocked);
});

test('storage scan: after a full life cycle nothing readable leaks into any browser storage', async () => {
  const ls = new FakeStorage();
  const backend = new LocalStorageBackend(ls);
  const { store } = makeStore({ backend });
  const { recoveryCode } = await store.create(PIN, initial({ nickname: 'TITKOS_BECENEV' }));
  await store.save({ ...store.data, events: [{ id: 'evt-aaaaaa', type: 'note', date: '2026-01-02', at: '2026-01-02T10:00:00Z', note: 'TITKOS_JEGYZET' }] });
  await store.exportEncryptedBackup();
  store.lock();
  const everything = JSON.stringify([...ls.items]);
  for (const secret of ['TITKOS_BECENEV', 'TITKOS_JEGYZET', PIN, recoveryCode, recoveryCode.replace(/-/g, '')]) {
    assert.ok(!everything.includes(secret), `"${secret}" found in storage`);
  }
});

test('wipe leaves no record, key or hint behind', async () => {
  const ls = new FakeStorage();
  const { store } = makeStore({ backend: new LocalStorageBackend(ls) });
  await store.create(PIN, initial());
  ls.setItem('jozansag-szamlalo:has-idb-vault', '1');
  await store.wipe();
  assert.deepEqual([...ls.items.keys()].filter((k) => k.startsWith('jozansag-szamlalo:')), []);
});

test('fault injection: a failed write keeps the previous good state and in-memory data', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  const before = JSON.stringify(await backend.get('vault'));
  const orig = backend.putMany.bind(backend);
  backend.putMany = async () => { throw Object.assign(new Error('quota'), { code: 'QUOTA' }); };
  await assert.rejects(store.save({ ...store.data, events: [] }), { code: 'QUOTA' });
  backend.putMany = orig;
  assert.equal(JSON.stringify(await backend.get('vault')), before);
});

test('fault injection: a bit-flip in the payload is reported as damage (CORRUPTED), not as a wrong PIN', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  await store.save({ ...store.data, events: [] });
  store.lock();
  const rec = await backend.get('vault');
  const ct = rec.payload.ct;
  rec.payload.ct = (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1);
  await backend.putMany({ vault: rec });
  await assert.rejects(store.unlock(PIN), { code: 'CORRUPTED' });
  await store.restorePrevious(PIN);
  assert.ok(store.isUnlocked, 'the previous good copy is restorable');
});
