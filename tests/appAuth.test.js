import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initial, withCost, costOf } from './helpers.js';
import { createAppAuth, AuthStatus } from '../src/auth/appAuth.js';
import { MemoryBackend } from '../src/storage/backends.js';
import { createKeySlot, encryptPayload, generateDek, VAULT_FORMAT } from '../src/crypto/vault.js';
import { FREE_ATTEMPTS } from '../src/storage/store.js';

const PIN = '2581';
const FAST = { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 };

function setup({ backend = new MemoryBackend() } = {}) {
  let t = 1_700_000_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const backends = [backend];
  const auth = createAppAuth({
    openBackend: async () => backends[backends.length - 1],
    storeOptions: FAST,
    now: clock.now,
  });
  const seen = [];
  auth.subscribe((s) => seen.push(s.status));
  return { auth, backend, clock, seen, nextBackend: (b) => backends.push(b) };
}

test('first launch → FIRST_TIME_SETUP → UNLOCKED, recovery code returned once', async () => {
  const { auth, seen } = setup();
  assert.equal(auth.getState().status, AuthStatus.INITIALIZING);
  await auth.init();
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP);
  const { recoveryCode } = await auth.setup(PIN, initial());
  assert.match(recoveryCode, /^[0-9A-Z-]{39}$/);
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.deepEqual(seen, ['FIRST_TIME_SETUP', 'UNLOCKED']);
});

test('later launch → LOCKED; correct PIN decrypts into memory', async () => {
  const backend = new MemoryBackend();
  await (async () => { const a = setup({ backend }).auth; await a.init(); await a.setup(PIN, initial({ dailyCostHuf: 777 })); })();

  const { auth } = setup({ backend });
  await auth.init();
  assert.equal(auth.getState().status, AuthStatus.LOCKED);
  assert.throws(() => auth.store.data, 'no data before unlock');
  await auth.unlock(PIN);
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.equal(costOf(auth.store.data), 777);
});

test('wrong PIN: stays LOCKED, clear error, data untouched, then throttled', async () => {
  const { auth, backend } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  auth.lock();
  const before = JSON.stringify([...backend.map].filter(([k]) => k !== 'meta'));

  await assert.rejects(auth.unlock('9999'), { code: 'WRONG_SECRET' });
  assert.equal(auth.getState().status, AuthStatus.LOCKED);
  assert.equal(auth.getState().error.code, 'WRONG_SECRET');
  assert.equal(JSON.stringify([...backend.map].filter(([k]) => k !== 'meta')), before, 'wrong PIN never modifies data');

  for (let i = 1; i < FREE_ATTEMPTS; i++) await auth.unlock('9999').catch(() => {});
  await assert.rejects(auth.unlock(PIN));
  assert.ok(auth.getState().error.retryAfterMs > 0, 'UI can show a countdown');
});

test('lock() drops the key and decrypted data from memory', async () => {
  const { auth } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  const store = auth.store;
  assert.equal(store.isUnlocked, true);
  auth.lock('manual');
  assert.equal(store.isUnlocked, false);
  assert.throws(() => store.data);
  assert.throws(() => store.settings);
  assert.equal(auth.getState().lockReason, 'manual');
  await assert.rejects(store.save(initial()), 'cannot write while locked');
});

test('auto-lock after the configured inactivity; activity postpones it', async () => {
  const { auth, clock } = setup();
  await auth.init();
  await auth.setup(PIN, initial()); // autoLockMinutes = 5
  clock.advance(4 * 60_000);
  assert.equal(auth.checkInactivity(), false);
  auth.touch();
  clock.advance(4 * 60_000);
  assert.equal(auth.checkInactivity(), false);
  clock.advance(60_000);
  assert.equal(auth.checkInactivity(), true);
  assert.equal(auth.getState().status, AuthStatus.LOCKED);
  assert.equal(auth.getState().lockReason, 'inactivity');
});

test('changed auto-lock setting takes effect after refreshSettings()', async () => {
  const { auth, clock } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  await auth.store.save({ ...auth.store.data, settings: { ...auth.store.data.settings, autoLockMinutes: 1 } });
  auth.refreshSettings();
  clock.advance(61_000);
  assert.equal(auth.checkInactivity(), true);
});

test('lifecycle: pagehide locks immediately (back/forward cache), visibility re-checks, detach cleans up', async () => {
  const { auth, clock } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  const target = new EventTarget();
  const doc = new EventTarget();
  let intervalCb = null;
  const detach = auth.attachLifecycle({ target, doc, setIntervalFn: (cb) => (intervalCb = cb), clearIntervalFn: () => (intervalCb = null) });

  clock.advance(6 * 60_000);
  target.dispatchEvent(new Event('pointerdown')); // activity resets the timer
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);

  clock.advance(6 * 60_000);
  intervalCb();
  assert.equal(auth.getState().status, AuthStatus.LOCKED);

  await auth.unlock(PIN);
  target.dispatchEvent(new Event('pagehide'));
  assert.equal(auth.getState().status, AuthStatus.LOCKED);
  assert.equal(auth.getState().lockReason, 'pagehide');

  detach();
  assert.equal(intervalCb, null);
  await auth.unlock(PIN);
  target.dispatchEvent(new Event('pagehide'));
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED, 'listeners removed');
});

test('forgot PIN, has recovery code → new PIN, all data kept', async () => {
  const { auth } = setup();
  await auth.init();
  const { recoveryCode } = await auth.setup(PIN, initial({ dailyCostHuf: 1500 }));
  auth.lock();
  await auth.recover(recoveryCode, '7302');
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.equal(costOf(auth.store.data), 1500);
});

test('forgot everything → resetAll wipes all data and returns to FIRST_TIME_SETUP', async () => {
  const { auth, backend, nextBackend } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  auth.lock();
  const fresh = new MemoryBackend();
  nextBackend(fresh); // a real wipe closes the IndexedDB connection; auth must reopen
  await auth.resetAll();
  assert.equal(backend.map.size, 0);
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP);
  assert.equal(auth.store.backend, fresh);
  await auth.setup('7302', initial()); // can start over immediately
});

test('actions are only allowed in the right state', async () => {
  const { auth } = setup();
  await assert.rejects(auth.unlock(PIN), { code: 'INVALID_STATE' });
  await auth.init();
  await assert.rejects(auth.unlock(PIN), { code: 'INVALID_STATE' }, 'nothing to unlock yet');
  await auth.setup(PIN, initial());
  await assert.rejects(auth.setup(PIN, initial()), { code: 'INVALID_STATE' }, 'cannot overwrite an existing vault');
  await auth.unlock(PIN); // already unlocked → no-op
});

test('concurrent actions are serialized (double tap cannot double-create)', async () => {
  const { auth } = setup();
  await auth.init();
  const results = await Promise.allSettled([auth.setup(PIN, initial()), auth.setup(PIN, initial())]);
  assert.deepEqual(results.map((r) => r.status), ['fulfilled', 'rejected']);
});

test('weak PIN at setup is rejected and the state stays FIRST_TIME_SETUP', async () => {
  const { auth } = setup();
  await auth.init();
  await assert.rejects(auth.setup('1234', initial()), { code: 'WEAK_SECRET' });
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP);
  assert.equal(auth.getState().error.code, 'WEAK_SECRET');
});

test('schema validation after decryption: valid ciphertext with invalid JSON is CORRUPTED, never loaded', async () => {
  // Build a vault whose crypto is perfectly valid but whose plaintext breaks the schema.
  const backend = new MemoryBackend();
  const dek = await generateDek();
  const badPayloads = [
    { schemaVersion: 1, profile: { journeyStart: 'tegnap' }, settings: { dailyCostHuf: 0 }, events: [] },
    { schemaVersion: 1, profile: { journeyStart: '2026-01-01' }, settings: { dailyCostHuf: -50 }, events: [] },
    { schemaVersion: 1, profile: { journeyStart: '2026-01-01' }, settings: { dailyCostHuf: 0 }, events: [{ id: 'x', type: 'hack' }] },
    { schemaVersion: 1, profile: { journeyStart: '2026-01-01' }, settings: { dailyCostHuf: 0 }, events: [{ id: 'abcdef12', type: 'note', date: '2026-01-02', at: '2026-01-02T10:00:00Z', note: '<img onerror=x>', extra: 'dropped' }] },
  ];
  for (const [i, payload] of badPayloads.entries()) {
    await backend.putMany({
      vault: { format: VAULT_FORMAT, revision: 1, slots: { pin: await createKeySlot(dek, PIN, 1000) }, payload: await encryptPayload(dek, payload) },
    });
    const { auth } = setup({ backend });
    await auth.init();
    if (i < 3) {
      await assert.rejects(auth.unlock(PIN), { code: 'CORRUPTED' }, `payload ${i}`);
      assert.equal(auth.getState().status, AuthStatus.LOCKED);
      assert.match(auth.getState().error.message, /szerkezete sérült/);
    } else {
      // Valid shape: unknown fields are stripped, text stays inert text.
      await auth.unlock(PIN);
      assert.deepEqual(Object.keys(auth.store.data.events[0]).sort(), ['at', 'date', 'id', 'note', 'type']);
    }
  }
});

test('corrupted current record offers restore of the previous copy', async () => {
  const { auth, backend } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  await auth.store.save(withCost(auth.store.data, 900));
  auth.lock();
  const rec = await backend.get('vault');
  await backend.putMany({ vault: { ...rec, payload: { ...rec.payload, ct: rec.payload.ct.slice(0, -4) + 'AAAA' } } });

  await assert.rejects(auth.unlock(PIN), { code: 'CORRUPTED' });
  assert.equal(auth.getState().canRestorePrevious, true);
  await auth.restorePrevious(PIN);
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.equal(auth.getState().canRestorePrevious, false);
});

test('nothing key-like is ever persisted; nothing survives a "browser restart" unlocked', async () => {
  const { auth, backend } = setup();
  await auth.init();
  await auth.setup(PIN, initial());
  await auth.store.save(auth.store.data);
  const dump = JSON.stringify([...backend.map]);
  assert.ok(!dump.includes(PIN));
  assert.ok(!/"(dek|key|rawKey|secret|pin)"\s*:\s*"/.test(dump.replace(/"pin":\{/g, '')), 'no plaintext key fields');

  // A new session over the same storage starts LOCKED – the key existed only in memory.
  const next = setup({ backend }).auth;
  await next.init();
  assert.equal(next.getState().status, AuthStatus.LOCKED);
});
