// Guards the tone and legal boundaries of every user-facing string.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as content from '../src/content/hu.js';

// Stems, matched case-insensitively anywhere in a word.
const BANNED = [
  ['kudarc', 'failure framing'],
  ['bukás', 'failure framing'], ['elbuk', 'failure framing'], ['elbaszt', 'failure framing'],
  ['nulláz', 'reset framing'], ['újraindul a számláló', 'reset framing'], ['elveszett napok', 'reset framing'],
  ['szégyen', 'shame'], ['gyenge', 'blame'], ['hibáztál', 'blame'], ['csalódás vagy', 'blame'],
  ['büntet', 'punishment'],
  ['alkoholista', 'identity label'], ['drogos', 'identity label'], ['iszákos', 'identity label'],
  ['visszaes', 'prefer "megcsúszás" (pending clinical review)'],
  ['gyógyít', 'medical claim'], ['meggyógy', 'medical claim'], ['kigyógy', 'medical claim'], ['garantál', 'medical claim'],
  ['üveg', 'alcohol imagery'], ['pohár', 'alcohol imagery'], ['palack', 'alcohol imagery'], ['koccint', 'alcohol imagery'],
  ['ittál ma', 'guilt-tripping check-in'],
];

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (typeof value === 'function') out.push(value.toString());
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? sourceFiles(join(dir, d.name)) : /\.(jsx?|html|webmanifest)$/.test(d.name) ? [join(dir, d.name)] : []);
}

test('content contains no stigmatizing, punishing or medical-claim wording', () => {
  const text = collectStrings(content).join('\n').toLowerCase();
  for (const [stem, why] of BANNED) assert.ok(!text.includes(stem), `"${stem}" found in content (${why})`);
});

test('no source file or page contains banned wording', () => {
  const files = [...sourceFiles('src'), 'index.html', 'public/manifest.webmanifest'];
  assert.ok(files.some((f) => f.endsWith('.jsx')), 'React components are scanned');
  for (const f of files) {
    const text = readFileSync(f, 'utf8').toLowerCase();
    for (const [stem, why] of BANNED) assert.ok(!text.includes(stem), `"${stem}" in ${f} (${why})`);
  }
});

test('disclaimer states support, not cure', () => {
  assert.match(content.T.disclaimer, /segít követni és támogatni/);
  assert.match(content.T.disclaimer, /nem helyettesíti/);
});

test('helplines are complete and dialable', () => {
  assert.ok(content.HELPLINES.some((h) => h.tel === '112'));
  assert.ok(content.HELPLINES.some((h) => h.tel === '116123'));
  for (const h of content.HELPLINES) {
    assert.match(h.tel, /^\+?\d{3,15}$/);
    assert.ok(h.name && h.hours && h.when && h.verified, `incomplete helpline ${h.id}`);
  }
});

test('notification text reveals nothing about recovery on a lock screen', () => {
  const t = (content.NOTIFICATION.title + ' ' + content.NOTIFICATION.body).toLowerCase();
  for (const w of ['józan', 'alkohol', 'ital', 'drog', 'sóvár', 'megcsúsz', 'függ']) assert.ok(!t.includes(w), w);
});
