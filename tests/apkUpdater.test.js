// Alkalmazáson belüli frissítő modul (Android): letöltés → ellenőrzés → telepítő megnyitása.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApkUpdateManager, APK_URL } from '../src/lib/apkUpdate.js';

const JAVA = readFileSync('android/app/src/main/java/io/github/levi20003/sober/JszUpdaterPlugin.java', 'utf8');
const MANIFEST = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const PATHS = readFileSync('android/app/src/main/res/xml/file_paths.xml', 'utf8');

function fakeUpdater({ download = async () => ({ ok: true, versionCode: 205 }), install = async () => ({ started: true }) } = {}) {
  const calls = [];
  const listeners = {};
  return {
    calls,
    emit: (name, data) => listeners[name]?.(data),
    plugin: {
      addListener: async (name, fn) => { listeners[name] = fn; return { remove() {} }; },
      download: async (o) => { calls.push(['download', o]); return download(o); },
      install: async () => { calls.push(['install']); return install(); },
    },
  };
}
const manager = (u, extra = {}) => createApkUpdateManager({ current: 200, updater: () => u.plugin, open: () => { throw new Error('must not open the browser'); }, ...extra });

test('U1: "Frissítés" downloads inside the app, reports progress, verifies, then opens the Android installer', async () => {
  const u = fakeUpdater({ download: async () => { u.emit('progress', { percent: 40 }); u.emit('progress', { percent: 100 }); return { ok: true, versionCode: 205 }; } });
  const m = manager(u);
  const seen = [];
  m.subscribe(() => seen.push(`${m.getState().status}:${m.getState().progress ?? ''}`));
  await m.apply();
  assert.deepEqual(u.calls.map((c) => c[0]), ['download', 'install']);
  assert.ok(seen.includes('downloading:40'), seen.join(' '));
  assert.ok(seen.some((s) => s.startsWith('installing')), seen.join(' '));
  assert.equal(m.getState().status, 'installing');
});

test('U2: a failed verification never opens the installer and says why', async () => {
  for (const code of ['CHECKSUM', 'SIGNATURE', 'NOT_NEWER', 'PACKAGE', 'NETWORK']) {
    const u = fakeUpdater({ download: async () => { throw Object.assign(new Error(code), { code }); } });
    const m = manager(u);
    await m.apply();
    assert.deepEqual(u.calls.map((c) => c[0]), ['download'], code);
    assert.equal(m.getState().status, 'error');
    assert.equal(m.getState().errorCode, code);
  }
});

test('U3: if Android has not yet allowed installs from this app, the user is sent to that setting and can retry', async () => {
  let allowed = false;
  const u = fakeUpdater({ install: async () => (allowed ? { started: true } : { needsPermission: true }) });
  const m = manager(u);
  await m.apply();
  assert.equal(m.getState().status, 'permission');
  allowed = true;
  await m.apply(); // a letöltött, ellenőrzött fájl megvan: nem tölti le újra
  assert.deepEqual(u.calls.map((c) => c[0]), ['download', 'install', 'install']);
  assert.equal(m.getState().status, 'installing');
});

test('U4: without the native module (older shell) it falls back to the download page', async () => {
  const opened = [];
  const m = createApkUpdateManager({ current: 200, updater: () => null, open: (url) => opened.push(url) });
  await m.apply();
  assert.deepEqual(opened, [APK_URL]);
});

test('U5: the native updater only ever downloads our own release, checks SHA-256, package, signer and version', () => {
  assert.match(JAVA, /@CapacitorPlugin\(name = "JszUpdater"\)/);
  assert.match(JAVA, /APK_URL = "https:\/\/github\.com\/levi20003\/Sober\/releases\/download\/android-latest\/jozansag-szamlalo\.apk"/);
  assert.doesNotMatch(JAVA, /call\.getString\("url"/, 'the URL is not taken from JavaScript');
  assert.match(JAVA, /MessageDigest\.getInstance\("SHA-256"\)/);
  assert.match(JAVA, /\.sha256/);
  assert.match(JAVA, /getPackageArchiveInfo/);
  assert.match(JAVA, /"SIGNATURE"/);
  assert.match(JAVA, /"NOT_NEWER"/);
  assert.match(JAVA, /"PACKAGE"/);
  assert.match(JAVA, /canRequestPackageInstalls/);
  assert.match(JAVA, /ACTION_MANAGE_UNKNOWN_APP_SOURCES/);
  assert.match(JAVA, /application\/vnd\.android\.package-archive/);
  assert.doesNotMatch(JAVA, /Log\.[dviwe]\(/);
  assert.match(readFileSync('android/app/src/main/java/io/github/levi20003/sober/MainActivity.java', 'utf8'), /registerPlugin\(JszUpdaterPlugin\.class\)/);
  assert.match(MANIFEST, /android\.permission\.REQUEST_INSTALL_PACKAGES/);
  assert.match(PATHS, /<cache-path name="updates" path="updates\/" \/>/);
});

test('U6: the update is never started by itself on the lock screen in the APK (needs the user\'s tap)', () => {
  const app = readFileSync('src/App.jsx', 'utf8');
  assert.match(app, /update\.ready && !update\.native && state\.status === AuthStatus\.LOCKED/);
});
