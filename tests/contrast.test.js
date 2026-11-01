// WCAG AA: a tokens.css színpárjait számolja ki és ellenőrzi (szöveg ≥ 4.5:1, ábra/vonás ≥ 3:1).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(header) {
  const i = css.indexOf(header);
  assert.ok(i >= 0, header);
  const open = css.indexOf('{', i);
  let depth = 1; let j = open + 1;
  while (depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
  return css.slice(open + 1, j - 1);
}
const vars = (body) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = vars(block(':root {'));
const dark = { ...light, ...vars(block(':root[data-theme="dark"] {')) };
const crisis = { ...dark, ...vars(block('.crisis-overlay {')) };

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const TONES = ['peach', 'lavender', 'mint', 'pink', 'butter', 'sky'];
const MOODS = ['excited', 'cheerful', 'grateful', 'energetic', 'sensitive', 'confused', 'bored', 'stressed', 'angry', 'unsure', 'hurt', 'guilty'];

for (const [name, v] of [['light', light], ['dark', dark], ['crisis', crisis]]) {
  test(`contrast (${name}): text pairs ≥ 4.5:1`, () => {
    const pairs = [['text', 'bg'], ['text', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['accent-ink', 'accent'], ['text', 'surface-2'], ['muted', 'surface-2']];
    if (name !== 'crisis') {
      pairs.push(['help-ink', 'help-bg'], ['text', 'warn-bg'], ['good', 'surface'], ['nav-active-ink', 'nav-active-bubble']);
      for (const t of TONES) { pairs.push(['card-ink', `tone-${t}`]); pairs.push(['card-muted', `tone-${t}`]); }
    }
    for (const [fg, bg] of pairs) {
      const r = ratio(v[fg], v[bg]);
      assert.ok(r >= 4.5, `${name}: --${fg} on --${bg} = ${r.toFixed(2)}`);
    }
  });
}

test('contrast: the help button is the same warm yellow in light and dark', () => {
  assert.equal(light['help-bg'], dark['help-bg']);
  assert.equal(light['help-ink'], dark['help-ink']);
});

test('contrast: figure features (dark ink) are readable on every mood colour', () => {
  for (const m of MOODS) {
    const r = ratio(light['fig-ink'], light[`mood-${m}`]);
    assert.ok(r >= 3, `mood-${m}: ${r.toFixed(2)}`);
  }
});

test('contrast: nav text on the floating bar', () => {
  assert.ok(ratio(light['nav-fg'], light['nav-bg']) >= 4.5);
  assert.ok(ratio(dark['nav-fg'], dark['nav-bg']) >= 4.5);
});
