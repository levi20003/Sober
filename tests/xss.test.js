// XSS-felület (audit 1.4): veszélyes DOM-sinkek tiltása, és felhasználói adat soha nem kerülhet href/src attribútumba
// (kivétel a megbízható személy telefonszáma, amit tel: előtag mögé tisztítva teszünk).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(d, e.name)) : [join(d, e.name)]));
const SRC = files('src').filter((f) => /\.(jsx?|mjs)$/.test(f));

test('no dangerous DOM sinks or dynamic code evaluation anywhere in src/', () => {
  const BANNED = /dangerouslySetInnerHTML|\.innerHTML\s*=|outerHTML|insertAdjacentHTML|document\.write|\beval\s*\(|new\s+Function\s*\(|setTimeout\(\s*['"`]|setInterval\(\s*['"`]|javascript:/;
  for (const f of SRC) {
    const t = readFileSync(f, 'utf8');
    assert.ok(!BANNED.test(t), `dangerous sink in ${f}: ${t.match(BANNED)?.[0]}`);
  }
});

test('every dynamic href/src/xlink:href is one of the reviewed, safe expressions', () => {
  const ALLOWED = new Set([
    'CRISIS_HASH', 'line.url ?? telHref(line)', 'feedbackUrl()', 'APK_PAGE', 'CHANGES_PAGE', 'l.hash', 't.hash', 'safeHash(href)',
    "`tel:${trusted.phone.replace(/[^\\d+]/g, '')}`",
  ]);
  for (const f of SRC.filter((x) => x.endsWith('.jsx'))) {
    const t = readFileSync(f, 'utf8');
    for (const m of t.matchAll(/\b(?:href|src|xlinkHref)=\{/g)) {
      let depth = 1; let i = m.index + m[0].length; const start = i;
      while (depth && i < t.length) { if (t[i] === '{') depth++; else if (t[i] === '}') depth--; i++; }
      const expr = t.slice(start, i - 1).trim();
      assert.ok(ALLOWED.has(expr), `unreviewed dynamic URL in ${f}: ${expr}`);
    }
  }
});

test('helpline and trusted-person links can only ever be tel: or the vetted https helpline site', async () => {
  const { HELPLINES_BY_COUNTRY } = await import('../src/content/helplines.js');
  for (const l of Object.values(HELPLINES_BY_COUNTRY).flat()) {
    if (l.url) assert.match(l.url, /^https:\/\/findahelpline\.com$/);
    else assert.match(l.tel, /^\+?\d{3,15}$/);
  }
  // a megbízható személy számát a séma is korlátozza (csak +, számjegy, szóköz)
  const { validateProfile } = await import('../src/domain/schema.js');
  assert.throws(() => validateProfile({ journeyStart: '2026-01-01', trustedContact: { name: 'x', phone: 'javascript:alert(1)' } }));
});

test('tile links only ever point to in-app routes (safeHash)', async () => {
  const { safeHash } = await import('../src/components/design/Design.jsx');
  assert.equal(safeHash('#/eszkozok/hala'), '#/eszkozok/hala');
  for (const bad of ['javascript:alert(1)', 'https://x.example', '#/<x>', '//evil', undefined]) assert.equal(safeHash(bad), '#/', String(bad));
});
