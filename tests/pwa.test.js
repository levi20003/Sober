import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { NOTIFICATION } from '../src/content/hu.js';
import { listFiles, precacheList, contentVersion, renderServiceWorker } from '../scripts/precache.js';

const template = readFileSync('src/sw/sw.template.js', 'utf8');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

test('service worker: precache list covers every emitted file (offline crisis screen)', () => {
  const list = precacheList(['index.html', 'assets/index-abc.js', 'assets/index-def.css', 'icons/icon.svg', 'sw.js', '_headers', 'assets/x.js.map']);
  assert.deepEqual(list, ['./', './assets/index-abc.js', './assets/index-def.css', './icons/icon.svg', './index.html']);
});

test('service worker: dotfiles are never precached (an APK build drops them, which would fail the install)', () => {
  const list = precacheList(['.nojekyll', 'index.html', 'assets/.hidden', 'assets/app.js']);
  assert.deepEqual(list, ['./', './assets/app.js', './index.html']);
});

test('service worker: version is a content hash – any changed byte means a new cache', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jsz-sw-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), 'a');
  writeFileSync(join(dir, 'assets/app.js'), 'b');
  const files = listFiles(dir);
  assert.deepEqual(files, ['assets/app.js', 'index.html']);
  const v1 = contentVersion(dir, files);
  writeFileSync(join(dir, 'assets/app.js'), 'c');
  assert.notEqual(contentVersion(dir, files), v1);
  assert.match(v1, /^[0-9a-f]{16}$/);
});

test('service worker template renders into valid JS with the list and version', () => {
  const sw = renderServiceWorker(template, { shell: ['./', './index.html'], version: 'abc123' });
  assert.ok(sw.includes(`const VERSION = 'abc123';`));
  assert.ok(sw.includes('"./index.html"'));
  assert.doesNotMatch(sw, /__SW_(PRECACHE|VERSION)__/);
  assert.doesNotThrow(() => new Function(sw.replace(/self\./g, 'globalThis.'))); // parses
  assert.throws(() => renderServiceWorker('const x = 1;', { shell: [], version: 'v' }), /placeholders/);
});

test('service worker notification copy matches content module', () => {
  for (const v of Object.values(NOTIFICATION)) assert.ok(template.includes(`'${v}'`), v);
});

test('page CSP forbids all network connections and inline script', () => {
  const html = readFileSync('index.html', 'utf8');
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/, 'no inline scripts');
  assert.doesNotMatch(html, /https?:\/\//, 'no third-party resources');
});

test('the dev-only CSP relaxation is never applied to builds', () => {
  const cfg = readFileSync('vite.config.js', 'utf8');
  assert.match(cfg, /name: 'jsz-dev-csp', apply: 'serve'/);
});

test('no raw HTML injection or eval anywhere in the app (React or not)', () => {
  for (const f of walk('src')) {
    const s = readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|eval\(|new Function/, f);
  }
});

test('manifest exposes a crisis shortcut', () => {
  const m = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
  assert.ok(m.shortcuts.some((s) => s.url.endsWith('#/segitseg')));
});
