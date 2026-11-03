// Egységes színvilág (2026-11): a logótervek palettája – lila #6b3fe0, meleg sárga #ffc53d, korall, krém, tinta –
// világos ÉS sötét módban, a belépésnél, a bevezetőben, a krízisképernyőn, az ikonokon és az Android-indítóképen is.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OLD_GREENS = ['#0f1a19', '#14201f', '#172422', '#1c2b2a', '#1f2e2c', '#233534', '#2a3d3a', '#2f4543', '#7fb8a8', '#2a4a44', '#0e1716', '#a9bab5', '#e9efec', '#e8c27a'];
const files = (dir, re) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name), re) : re.test(d.name) ? [join(dir, d.name)] : []));

test('no leftover green-teal theme colours anywhere in the UI, icons or Android resources', () => {
  const targets = [...files('src', /\.(css|jsx?)$/), 'index.html', ...files('public', /\.(css|svg|webmanifest|html)$/),
    ...files('android/app/src/main/res', /\.xml$/)];
  for (const f of targets) {
    const text = readFileSync(f, 'utf8').toLowerCase();
    for (const c of OLD_GREENS) assert.ok(!text.includes(c), `${c} in ${f}`);
  }
});

const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const css = readFileSync('src/styles/tokens.css', 'utf8');
const varIn = (selector, name) => {
  const i = css.indexOf(selector); const body = css.slice(css.indexOf('{', i), css.indexOf('}', i));
  return body.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];
};

test('dark theme and crisis screen use the violet/ink family (not green)', () => {
  for (const sel of [':root[data-theme="dark"] {', '.crisis-overlay {']) {
    for (const name of ['accent', 'bg', 'surface']) {
      const h = hue(varIn(sel, name));
      assert.ok(h >= 240 && h <= 290, `${sel} --${name} hue ${h.toFixed(0)}° should be violet/ink`);
    }
  }
  assert.equal(varIn(':root {', 'accent').toLowerCase(), '#6b3fe0', 'light accent stays the logo violet');
  assert.equal(varIn(':root {', 'help-bg').toLowerCase(), '#ffc53d', 'help button stays warm yellow');
});

test('light/dark toggle button is in the app bar, onboarding and the lock/setup headers', () => {
  const src = (f) => readFileSync(f, 'utf8');
  assert.match(src('src/components/shell/AppBar.jsx'), /<ThemeToggle/);
  assert.match(src('src/components/onboarding/Onboarding.jsx'), /<ThemeToggle/);
  assert.ok((src('src/App.jsx').match(/<ThemeToggle/g) ?? []).length >= 3, 'lock, storage error and loading headers');
});
