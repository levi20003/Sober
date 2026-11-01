import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApkUpdateManager, parseVersionCode, RELEASE_API, APK_URL, DAY_MS } from '../src/lib/apkUpdate.js';
import { patchCsp, ALLOWED } from '../scripts/android-csp.mjs';

const resp = (body, ok = true) => ({ ok, status: ok ? 200 : 403, json: async () => ({ body }) });
const mgr = (over = {}) => createApkUpdateManager({ current: 110, setTimer: () => 1, clearTimer: () => {}, ...over });

test('release notes: the version code is read from the "Verziókód:" line', () => {
  assert.equal(parseVersionCode('- Verziókód: 123\n- Aláírás'), 123);
  assert.equal(parseVersionCode('nincs'), null);
});

test('a newer release version code marks the update ready; the download opens the APK', async () => {
  const calls = [];
  const opened = [];
  const m = mgr({ fetchFn: async (url, init) => { calls.push([url, init]); return resp('- Verziókód: 111'); }, open: (u) => opened.push(u) });
  await m.check({ silent: true });
  assert.equal(m.getState().ready, true);
  assert.equal(calls[0][0], RELEASE_API);
  assert.equal(calls[0][1].credentials, 'omit', 'no cookies or identifiers are sent');
  m.apply();
  assert.deepEqual(opened, [APK_URL]);
});

test('same or older version → up to date; failures and offline are quiet', async () => {
  const same = mgr({ fetchFn: async () => resp('Verziókód: 110') });
  await same.check();
  assert.deepEqual([same.getState().ready, same.getState().status], [false, 'uptodate']);
  let called = 0;
  const off = mgr({ online: () => false, fetchFn: async () => { called++; return resp('Verziókód: 999'); } });
  await off.check({ silent: true });
  assert.equal(called, 0, 'no request while offline');
  const bad = mgr({ fetchFn: async () => { throw new Error('x'); } });
  await bad.check({ silent: true });
  assert.equal(bad.getState().ready, false);
});

test('the opt-out stops background requests; a manual check still works; local builds never check', async () => {
  let called = 0;
  const fetchFn = async () => { called++; return resp('Verziókód: 200'); };
  const m = mgr({ enabled: () => false, fetchFn });
  await m.check({ silent: true });
  assert.equal(called, 0);
  await m.check({ manual: true });
  assert.equal(called, 1);
  const local = mgr({ current: 0, fetchFn });
  await local.check({ manual: true });
  assert.equal(called, 1);
});

test('privacy (audit F10): checks run at start and at most once a day, with no identifying headers', async () => {
  const t = [];
  let last = 0;
  let clock = 10 * DAY_MS; // valós időbélyeg-szerű érték
  const calls = [];
  const m = mgr({
    setTimer: (fn, ms) => { t.push(ms); return 1; },
    fetchFn: async (url, init) => { calls.push(init); return resp(''); },
    lastCheck: { get: () => last, set: (v) => { last = v; } },
    now: () => clock,
  });
  await m.start();
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(t, [DAY_MS]);
  await m.check({ silent: true });
  assert.equal(calls.length, 1, 'a second background check within a day sends nothing');
  clock += DAY_MS + 1;
  await m.check({ silent: true });
  assert.equal(calls.length, 2);
  await m.check({ manual: true });
  assert.equal(calls.length, 3, 'the button always checks');
  for (const init of calls) {
    assert.equal(init.headers, undefined, 'no custom headers');
    assert.equal(init.credentials, 'omit');
  }
});

test('only the APK build is allowed to connect, and only to GitHub; the web CSP stays closed', () => {
  const html = readFileSync('index.html', 'utf8');
  const patched = patchCsp(html);
  assert.match(patched, /connect-src https:\/\/api\.github\.com;/);
  assert.doesNotMatch(patched, /require-trusted-types-for/, 'the APK drops Trusted Types (Capacitor bridge)');
  assert.equal(ALLOWED, 'https://api.github.com');
  assert.match(html, /connect-src 'none'/, 'source/web index.html unchanged');
  assert.throws(() => patchCsp(patched), /connect-src 'none'/);
});
