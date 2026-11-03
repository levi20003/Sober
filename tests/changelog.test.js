// Élő dokumentáció: CHANGELOG.md → valtozasok.html (Pages), és a CI kikényszeríti a frissítését.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderChangelog, changelogPage } from '../scripts/changelog-page.mjs';
import { needsChangelog } from '../scripts/check-changelog.mjs';

const md = readFileSync('CHANGELOG.md', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('the newest changelog section is the current app version', () => {
  const first = md.match(/^## (\S+)/m)[1];
  assert.equal(first, pkg.version);
});

test('the changelog links the always-latest APK', () => {
  assert.match(md, /https:\/\/github\.com\/levi20003\/Sober\/releases\/download\/android-latest\/jozansag-szamlalo\.apk/);
  assert.match(changelogPage(md), /href="https:\/\/github\.com\/levi20003\/Sober\/releases\/download\/android-latest\/jozansag-szamlalo\.apk"/);
});

test('rendering escapes HTML and only turns https links into anchors', () => {
  const html = renderChangelog('## 1.0\n- <script>x</script> **b** [ok](https://a.example) [bad](javascript:alert(1))\n');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<a href="https:\/\/a\.example">ok<\/a>/);
  assert.doesNotMatch(html, /href="javascript/);
  assert.match(html, /<section><h2>1\.0<\/h2>/);
});

test('the page is built with the app (so Pages always shows the current one) and has no script', () => {
  assert.match(readFileSync('vite.config.js', 'utf8'), /valtozasok\.html/);
  assert.doesNotMatch(changelogPage(md), /<script/i);
});

test('a PR that changes app code without CHANGELOG.md fails the check; docs-only or with changelog passes', () => {
  assert.equal(needsChangelog(['src/App.jsx']), true);
  assert.equal(needsChangelog(['android/app/src/main/AndroidManifest.xml', 'tests/x.test.js']), true);
  assert.equal(needsChangelog(['src/App.jsx', 'CHANGELOG.md']), false);
  assert.equal(needsChangelog(['docs/x.md', 'tests/y.test.js']), false);
  assert.match(readFileSync('.github/workflows/android.yml', 'utf8'), /node scripts\/check-changelog\.mjs/);
});
