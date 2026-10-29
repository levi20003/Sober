import { test } from 'vitest';
import assert from 'node:assert/strict';
import { makeStore, initial, withCost, costOf } from './helpers.js';
import { MemoryBackend } from '../src/storage/backends.js';
import { VaultStore, throttleDelay, FREE_ATTEMPTS } from '../src/storage/store.js';
import { makeEvent, addEvent } from '../src/domain/timeline.js';

const PIN = 'csend-2026';

test('create → lock → unlock round-trip', async () => {
  const { store } = makeStore();
  assert.equal(await store.exists(), false);
  const { recoveryCode } = await store.create(PIN, initial());
  assert.ok(recoveryCode);
  assert.equal(store.isUnlocked, true);
  store.lock();
  assert.equal(store.isUnlocked, false);
  assert.throws(() => store.data);
  await store.unlock(PIN);
  assert.equal(store.data.profile.journeyStart, '2026-01-01');
});

test('nothing sensitive is stored in plaintext', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  await store.save(addEvent(store.data, makeEvent('note', { note: 'NAGYON_SZEMELYES', date: '2026-01-02' })));
  const dump = JSON.stringify([...backend.map]);
  assert.ok(!dump.includes('NAGYON_SZEMELYES'));
  assert.ok(!dump.includes('2026-01-01'));
  assert.ok(!dump.includes('2500'));
});

test('wrong PIN is distinguished from corruption', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  store.lock();
  await assert.rejects(store.unlock('rossz-pin-1'), { code: 'WRONG_SECRET' });

  const rec = await backend.get('vault');
  rec.payload.ct = rec.payload.ct.slice(0, -8) + 'AAAAAAAA';
  await backend.putMany({ vault: rec });
  await assert.rejects(store.unlock(PIN), { code: 'CORRUPTED' });
});

test('corrupted current record can be restored from previous copy', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  await store.save(withCost(store.data, 3000));
  await store.save(withCost(store.data, 4000));
  store.lock();
  const rec = await backend.get('vault');
  rec.payload.iv = 'AAAAAAAAAAAAAAAA';
  await backend.putMany({ vault: rec });
  await assert.rejects(store.unlock(PIN), { code: 'CORRUPTED' });
  assert.equal(await store.hasPrevious(), true);
  await store.restorePrevious(PIN);
  assert.equal(costOf(store.data), 3000);
});

test('failed save (quota) keeps previous state intact', async () => {
  const backend = new MemoryBackend({ quotaBytes: 6000 });
  const { store } = makeStore({ backend });
  await store.create(PIN, initial());
  const big = { ...store.data, events: Array.from({ length: 50 }, (_, i) => makeEvent('note', { note: 'x'.repeat(200) + i, date: '2026-01-02' })) };
  await assert.rejects(store.save(big), { code: 'QUOTA' });
  assert.equal(store.data.events.length, 0);
  store.lock();
  await store.unlock(PIN);
  assert.equal(store.data.events.length, 0);
});

test('invalid data is rejected before anything is written', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  const before = JSON.stringify(await backend.get('vault'));
  await assert.rejects(store.save({ ...store.data, settings: { dailyCostHuf: -5 } }), { name: 'SchemaError' });
  assert.equal(JSON.stringify(await backend.get('vault')), before);
});

test('unlock attempts are throttled with exponential back-off', async () => {
  const { store, clock } = makeStore();
  await store.create(PIN, initial());
  store.lock();
  for (let i = 0; i < FREE_ATTEMPTS; i++) {
    await assert.rejects(store.unlock('rossz-' + i + 'xx'), { code: 'WRONG_SECRET' });
  }
  const err = await store.unlock(PIN).catch((e) => e);
  assert.ok(err.retryAfterMs > 0, 'correct PIN must also wait during lockout');
  clock.advance(err.retryAfterMs);
  await store.unlock(PIN);
  assert.equal((await store.getMeta()).failedAttempts, 0);
  assert.equal(throttleDelay(FREE_ATTEMPTS - 1), 0);
  assert.ok(throttleDelay(30) <= 5 * 60_000);
});

test('forgot PIN: recovery code sets a new PIN and keeps all data', async () => {
  const { store } = makeStore();
  const { recoveryCode } = await store.create(PIN, initial());
  await store.save(addEvent(store.data, makeEvent('note', { note: 'megmarad', date: '2026-01-03' })));
  store.lock();
  await store.recover(recoveryCode.toLowerCase(), 'uj-pin-777');
  assert.equal(store.data.events[0].note, 'megmarad');
  store.lock();
  await assert.rejects(store.unlock(PIN), { code: 'WRONG_SECRET' });
  await store.unlock('uj-pin-777');
});

test('change PIN', async () => {
  const { store } = makeStore();
  await store.create(PIN, initial());
  await store.changePin(PIN, 'masik-pin-88');
  store.lock();
  await assert.rejects(store.unlock(PIN));
  await store.unlock('masik-pin-88');
});

test('regenerating recovery code revokes the old one (also in previous copy)', async () => {
  const { store } = makeStore();
  const { recoveryCode: old } = await store.create(PIN, initial());
  const { recoveryCode: fresh } = await store.regenerateRecoveryCode(PIN);
  store.lock();
  await assert.rejects(store.recover(old, 'barmi-1234'), { code: 'WRONG_SECRET' });
  await store.recover(fresh, 'barmi-1234');
});

test('encrypted backup restores on a new device only with the PIN', async () => {
  const a = makeStore();
  await a.store.create(PIN, initial({ dailyCostHuf: 1234 }));
  const backup = JSON.parse(JSON.stringify(await a.store.exportEncryptedBackup()));
  assert.ok(!JSON.stringify(backup).includes('1234'));

  const b = makeStore();
  await assert.rejects(b.store.importEncryptedBackup(backup, 'rossz-pin-9'), { code: 'WRONG_SECRET' });
  assert.equal(await b.store.exists(), false, 'failed import must not touch the device');
  await b.store.importEncryptedBackup(backup, PIN);
  assert.equal(costOf(b.store.data), 1234);
});

test('wipe removes every key and locks', async () => {
  const { store, backend } = makeStore();
  await store.create(PIN, initial());
  await store.save({ ...store.data });
  await store.wipe();
  assert.equal(backend.map.size, 0);
  assert.equal(store.isUnlocked, false);
  assert.equal(await store.exists(), false);
});

test('newer vault format is reported as UNSUPPORTED, not corrupted', async () => {
  const backend = new MemoryBackend();
  await backend.putMany({ vault: { format: 99 } });
  const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await assert.rejects(store.unlock(PIN), { code: 'UNSUPPORTED' });
});
