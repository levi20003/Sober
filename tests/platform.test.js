import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isNativeShell } from '../src/lib/platform.js';

const at = (protocol, hostname, extra = {}) => ({ location: { protocol, hostname }, ...extra });

test('Capacitor shell: the origin is https://localhost (works without the JS bridge)', () => {
  assert.equal(isNativeShell(at('https:', 'localhost')), true);
});

test('Capacitor shell: the bridge flag is honoured too', () => {
  assert.equal(isNativeShell(at('http:', 'example.org', { Capacitor: { isNativePlatform: () => true } })), true);
  assert.equal(isNativeShell(at('https:', 'example.org', { Capacitor: { isNativePlatform: () => false } })), false);
});

test('web PWA, dev server and e2e server are NOT the native shell', () => {
  for (const [p, h] of [['https:', 'levi20003.github.io'], ['http:', 'localhost'], ['http:', '127.0.0.1'], ['https:', 'localhost.evil.example']]) {
    assert.equal(isNativeShell(at(p, h)), false, `${p}//${h}`);
  }
});

test('never throws on a hostile or missing environment', () => {
  assert.equal(isNativeShell({}), false);
  assert.equal(isNativeShell({ get location() { throw new Error('boom'); } }), false);
  assert.equal(isNativeShell({ location: null }), false);
});

test('the app entry point skips the service worker in the native shell', () => {
  const main = readFileSync('src/main.jsx', 'utf8');
  assert.match(main, /import\.meta\.env\.PROD && 'serviceWorker' in navigator && !isNativeShell\(\)/);
});
