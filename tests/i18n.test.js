import { test } from 'vitest';
import assert from 'node:assert/strict';
import * as hu from '../src/content/locales/hu.js';
import * as en from '../src/content/locales/en.js';

// A két nyelv ugyanazokat a kulcsokat és ugyanolyan alakú értékeket adja (függvény ↔ függvény, lista ↔ lista).
function shape(a, b, path) {
  assert.equal(typeof a, typeof b, `${path}: type`);
  if (typeof a === 'function') return assert.equal(a.length, b.length, `${path}: arity`);
  if (Array.isArray(a)) {
    assert.ok(Array.isArray(b) && a.length === b.length, `${path}: array length`);
    a.forEach((x, i) => shape(x, b[i], `${path}[${i}]`));
    return undefined;
  }
  if (a && typeof a === 'object') {
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), `${path}: keys`);
    for (const k of Object.keys(a)) shape(a[k], b[k], `${path}.${k}`);
  }
  return undefined;
}

test('Hungarian and English content have the same structure', () => {
  assert.deepEqual(Object.keys(hu).sort(), Object.keys(en).sort(), 'same exports');
  for (const k of Object.keys(hu)) shape(hu[k], en[k], k);
});

test('ids and routes are language-independent (data stays valid when the language is switched)', () => {
  for (const k of ['SAVINGS_MILESTONES', 'FUN_ITEMS', 'ENCOURAGEMENTS', 'TIPS', 'CHALLENGE_CATALOG']) {
    assert.deepEqual(hu[k].map((x) => x.id), en[k].map((x) => x.id), k);
  }
  assert.deepEqual(hu.NAV_TABS.map((t) => t.hash), en.NAV_TABS.map((t) => t.hash));
  assert.deepEqual(hu.QUICK_ADD.items.map((t) => t.hash), en.QUICK_ADD.items.map((t) => t.hash));
  assert.deepEqual(hu.BREATHING.map((b) => b.steps.map((s) => [s.kind, s.seconds])), en.BREATHING.map((b) => b.steps.map((s) => [s.kind, s.seconds])));
});

// Angol nyelvi védőkorlát (a magyar tests/copy.test.js párja): nincs hibáztatás, szégyen, "nullázás", címkézés, gyógyulás-ígéret.
const BANNED_EN = [
  [/\bfailure\b|\bfailed\b|\bloser\b/i, 'failure framing'], [/\bshame\b|\bashamed\b|\bblame\b|\bguilty of\b/i, 'shame / blame'],
  [/\bpunish/i, 'punishment'], [/\breset\b|\bstart from zero\b|\blost days\b|\bback to zero\b/i, 'reset framing'],
  [/\balcoholic\b|\baddict\b|\bjunkie\b|\bdrunk\b/i, 'identity label'], [/\bcure[sd]?\b|\bheal[s]? you\b|\bguarantee/i, 'medical claim'],
  [/\brelapse\b/i, 'prefer "slip" (pending review)'], [/\bbottle\b|\bcheers\b|\bbeer\b|\bwine\b|\bglass of\b/i, 'alcohol imagery'],
  [/\byou drank\b/i, 'guilt-tripping check-in'],
];
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (typeof v === 'function') out.push(v.toString().replace(/\$\{[^}]*\}/g, ''));
  else if (v && typeof v === 'object') for (const x of Object.values(v)) strings(x, out);
  return out;
}

test('English content contains no blaming, shaming, resetting or medical-claim wording', () => {
  const text = strings(en).join('\n');
  for (const [re, why] of BANNED_EN) assert.ok(!re.test(text), `${re} found in English content (${why})`);
});

test('English disclaimer states support, not cure', () => {
  assert.match(en.T.disclaimer, /helps you track and support/);
  assert.match(en.T.disclaimer, /not a medical device/);
  assert.match(en.T.disclaimer, /does not replace professional help/);
  assert.match(en.PREVIEW.text, /not yet been reviewed/);
});

test('money: amounts convert to nice, strictly ascending numbers in every currency', async () => {
  const { niceAmount, CURRENCIES } = await import('../src/i18n/money.js');
  assert.equal(niceAmount(7.8), 8);
  assert.equal(niceAmount(33), 30);
  for (const { hufPer } of Object.values(CURRENCIES)) {
    let prev = 0;
    for (const m of hu.SAVINGS_MILESTONES) {
      const v = niceAmount(m.amountHuf / hufPer);
      assert.ok(v >= prev, `${hufPer}: ${v} >= ${prev}`);
      prev = v;
    }
  }
});
