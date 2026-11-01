import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createUpdateManager } from '../src/lib/updateManager.js';

function fakeSw({ controller = {} } = {}) {
  const swListeners = {};
  const regListeners = {};
  const worker = { state: 'installing', listeners: [], addEventListener(_, fn) { this.listeners.push(fn); }, set(s) { this.state = s; this.listeners.forEach((f) => f()); } };
  const reg = {
    installing: null, waiting: null, updates: 0,
    addEventListener: (t, fn) => { regListeners[t] = fn; },
    async update() { this.updates++; if (this.fail) throw new Error('offline'); },
  };
  const sw = { controller, register: async () => reg, addEventListener: (t, fn) => { swListeners[t] = fn; } };
  return { sw, reg, worker, regListeners, swListeners };
}

test('a new worker that installs while an old one controls the page marks the update ready; apply reloads', async () => {
  const f = fakeSw();
  let reloaded = 0;
  const m = createUpdateManager({ sw: f.sw, reload: () => reloaded++, setTimer: () => 1, clearTimer: () => {} });
  await m.start();
  assert.equal(m.getState().ready, false);
  f.reg.installing = f.worker;
  f.regListeners.updatefound();
  f.worker.set('installed');
  assert.equal(m.getState().ready, true);
  m.apply();
  assert.equal(reloaded, 1);
});

test('the very first install (no controller) is not an update', async () => {
  const f = fakeSw({ controller: null });
  const m = createUpdateManager({ sw: f.sw, setTimer: () => 1, clearTimer: () => {} });
  await m.start();
  f.reg.installing = f.worker;
  f.regListeners.updatefound();
  f.worker.set('activated');
  assert.equal(m.getState().ready, false);
});

test('check() asks the browser for a new worker; offline it fails quietly and reports "up to date" only when asked', async () => {
  const f = fakeSw();
  const m = createUpdateManager({ sw: f.sw, setTimer: () => 1, clearTimer: () => {} });
  await m.start();
  await m.check();
  assert.equal(f.reg.updates, 1);
  assert.equal(m.getState().status, 'uptodate');
  f.reg.fail = true;
  await m.check({ silent: true });
  assert.equal(m.getState().ready, false);
});

test('the Android shell has no service worker: unsupported, no network, only the version is shown', async () => {
  const m = createUpdateManager({ sw: {}, native: true });
  assert.equal(m.getState().supported, false);
  assert.equal(await m.start(), null);
});

test('a background check every minute is scheduled and can be stopped', async () => {
  const f = fakeSw();
  const timers = [];
  const m = createUpdateManager({ sw: f.sw, setTimer: (fn, ms) => { timers.push(ms); return 7; }, clearTimer: (id) => timers.push(`clear${id}`) });
  await m.start();
  m.stop();
  assert.deepEqual(timers, [60_000, 'clear7']);
});
