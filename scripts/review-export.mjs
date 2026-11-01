// Szakmai lektoráláshoz: az összes felhasználói szöveg kigyűjtése egy táblázatba.
// Kimenet: docs/review/szoveg-lektoralas-<CONTENT_VERSION>.md és .csv
//   Oszlopok: Kulcs, Szöveg, Képernyő, Kontextus, + üres lektori oszlopok (Rendben, Módosítandó, Javasolt szöveg, Megjegyzés).
// A lektori oszlopokat ez a szkript SOHA nem tölti ki: azokat a valódi lektor tölti ki (docs/review/LEKTOR-TAJEKOZTATO.md).
//
// Használat: node scripts/review-export.mjs [--lang hu|en] [--out docs/review]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const lang = arg('--lang', 'hu');
const outDir = arg('--out', 'docs/review');

// A nyelv a modulok betöltésekor dől el (src/i18n/locale.js): a beállítást a betöltés előtt adjuk meg.
globalThis.localStorage = { getItem: () => JSON.stringify({ lang }), setItem() {}, removeItem() {} };
const L = await import(`../src/content/locales/${lang}.js`);
const presets = await import('../src/domain/presets.js');
const { HELPLINES_BY_COUNTRY } = await import('../src/content/helplines.js');
const { FEATURES } = await import('../src/lib/features.js');

// Felső szintű export → képernyő. A sorrend a dokumentum sorrendje: a biztonságkritikus részek elöl.
const SCREENS = [
  ['Krízisképernyő', ['CRISIS_STEPS', 'URGE_WAVE', 'GROUNDING', 'HELPLINES']],
  ['Krízisképernyő – légzőgyakorlat', ['BREATHING']],
  ['Krízisképernyő – kockázati üzenetek', ['RISK_MESSAGES']],
  ['Krízisképernyő – elvonási tünetek kártya (KIKAPCSOLVA, jóváhagyásra vár)', ['WITHDRAWAL']],
  ['Megcsúszás és új szakasz', []],
  ['Értesítés (zárolt képernyőn is látszik)', ['NOTIFICATION']],
  ['Bevezető', ['ONB', 'SETUP']],
  ['Főoldal', ['HOME', 'ENCOURAGEMENTS', 'TIPS', 'GREETINGS']],
  ['Ünneplés (mérföldkő)', ['CELEBRATE']],
  ['Gyors rögzítés', ['QUICK_ADD']],
  ['Idővonal', ['TIMELINE_PAGE']],
  ['Megtakarítás', ['SAVINGS_PAGE', 'SAVINGS_MILESTONES', 'FUN_ITEMS']],
  ['Eszközök', ['TOOLS', 'CHALLENGE_CATALOG']],
  ['Beállítások', ['SETTINGS_PAGE']],
  ['Zárolás és helyreállítás', []],
  ['Előzetes verzió tájékoztató', ['PREVIEW']],
  ['Frissítés', ['UPDATE']],
  ['Választható listák (hangulat, helyzet, megküzdés)', ['PRESETS']],
  ['Képernyőolvasó-szövegek', ['A11Y']],
  ['Általános felület', ['T', 'UX', 'MISC', 'NAV_TABS']],
];
const screenOfTop = Object.fromEntries(SCREENS.flatMap(([s, tops]) => tops.map((t) => [t, s])));

// T.* kulcsok, amelyek egy konkrét képernyőhöz tartoznak.
function screenOfT(key) {
  if (/^(crisis|help)/.test(key)) return 'Krízisképernyő';
  if (/^(slip|fresh)/.test(key)) return 'Megcsúszás és új szakasz';
  if (key === 'disclaimer' || key === 'privacyPromise') return 'Bevezető, Krízisképernyő, Beállítások → Névjegy';
  if (/^(onboarding)/.test(key)) return 'Bevezető';
  if (/^(pin|lock|unlock|recovery|forgot|wrong|attempt)/i.test(key)) return 'Zárolás és helyreállítás';
  if (/^(export|import|backup|delete|storage)/i.test(key)) return 'Beállítások';
  if (/^(phase|hero|total|streak|timeline|type)/i.test(key)) return 'Idővonal';
  if (/^(quick|checkin|trigger|note|mood|sleep|craving|coping)/i.test(key)) return 'Gyors rögzítés';
  return null;
}

const CONTEXT = {
  'T.disclaimer': 'Határ-mondat: megjelenik a bevezetőben, a krízisképernyőn, a Névjegyben, a README-ben és az APK kiadási jegyzetében.',
  'T.slipIntro': 'A megcsúszás rögzítésekor, az űrlap tetején.',
  'T.freshKind': 'A megcsúszás után, az összegző képernyőn.',
  'T.freshOfferHelp': 'A megcsúszás után: felajánlja (nem nyitja meg magától) a krízisképernyőt.',
  'RISK_MESSAGES.personal.text': 'Akkor jelenik meg, ha ebben az órában korábban legalább két különböző napon nehéz pillanatot vagy megcsúszást rögzített.',
  'RISK_MESSAGES.lateNight.text': '22:00–05:00 között.',
  'RISK_MESSAGES.weekend.text': 'Péntek 17:00-tól vasárnap éjfélig.',
};

const SAMPLE_ARGS = [7, '2026. október 1.', 3, 2];
const sample = (fn) => { try { return String(fn(...SAMPLE_ARGS)); } catch { return ''; } };

const rows = [];
function add(key, text, screen, context = '') {
  if (typeof text !== 'string' || !text.trim()) return;
  rows.push({ key, text, screen, context: CONTEXT[key] ?? context });
}
function walk(prefix, value, screen, context = '') {
  if (typeof value === 'string') add(prefix, value, screen, context);
  else if (typeof value === 'function') add(prefix, sample(value), screen, `Változó szöveg; minta (${SAMPLE_ARGS.join(', ')}) értékekkel. ${context}`.trim());
  else if (Array.isArray(value)) value.forEach((v, i) => walk(`${prefix}.${v?.id ?? i}`, v, screen, context));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (['id', 'kind', 'seconds', 'rounds', 'icon', 'hash', 'tel', 'role', 'verified', 'verification', 'source', 'verifiedBy', 'amountHuf', 'priceHuf', 'days', 'url', 'number'].includes(k)) continue;
      walk(`${prefix}.${k}`, v, screen, context);
    }
  }
}

for (const [top, value] of Object.entries(L)) {
  if (['CONTENT_VERSION', 'REVIEW_STATUS'].includes(top)) continue;
  if (top === 'T') {
    for (const [k, v] of Object.entries(value)) walk(`T.${k}`, v, screenOfT(k) ?? screenOfTop.T);
  } else {
    const ctx = top === 'WITHDRAWAL' ? `Kikapcsolva (src/lib/features.js withdrawalCard=${FEATURES.withdrawalCard}); bekapcsolás csak szakmai jóváhagyással.` : '';
    walk(top, value, screenOfTop[top] ?? 'Általános felület', ctx);
  }
}
for (const [country, lines] of Object.entries(HELPLINES_BY_COUNTRY)) {
  for (const l of lines) {
    walk(`HELPLINES.${country}.${l.id}`, { name: l.name, hours: l.hours, when: l.when }, 'Krízisképernyő',
      `Szám: ${l.number}; ellenőrzés: ${l.verification}, ${l.verified}; forrás: ${l.source}`);
  }
}
for (const name of ['TRIGGERS', 'COPING', 'OUTCOMES', 'MOODS', 'SUBSTANCES', 'SLEEP_LEVELS', 'CRAVING_LEVELS', 'QUICK_TEMPLATES']) {
  for (const o of presets[name] ?? []) {
    const id = o.id ?? o.value;
    walk(`PRESETS.${name}.${id}`, o.label, screenOfTop.PRESETS);
    if (o.hint) walk(`PRESETS.${name}.${id}.hint`, o.hint, screenOfTop.PRESETS);
  }
}

const order = SCREENS.map(([s]) => s);
const rank = (s) => { const i = order.findIndex((o) => s.startsWith(o)); return i < 0 ? order.length : i; };
rows.sort((a, b) => rank(a.screen) - rank(b.screen));

// --- CSV (UTF-8 BOM, vessző; Excel és Google Táblázatok is helyesen nyitja) ---
const REVIEW_COLS = ['Rendben', 'Módosítandó', 'Javasolt szöveg', 'Megjegyzés'];
const cell = (s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const csv = ['Kulcs,Szöveg,Képernyő,Kontextus,' + REVIEW_COLS.join(',')]
  .concat(rows.map((r) => [r.key, r.text, r.screen, r.context].map(cell).join(',') + ',,,,'))
  .join('\n') + '\n';

// --- Markdown ---
const md = [];
md.push(`# Szövegek szakmai lektorálásra (${L.CONTENT_VERSION}, ${lang})`, '');
md.push('Generálta: `node scripts/review-export.mjs` – ne szerkeszd kézzel, a forrás a `src/content/` mappa.', '');
md.push(`Állapot: **${L.REVIEW_STATUS}**. Tájékoztató a lektornak: [LEKTOR-TAJEKOZTATO.md](LEKTOR-TAJEKOZTATO.md). ` +
  'A visszajelzést a CSV-fájl üres oszlopaiban kérjük (Rendben / Módosítandó / Javasolt szöveg / Megjegyzés).', '');
md.push(`Összesen ${rows.length} szöveg. A biztonságkritikus részek (krízisképernyő, megcsúszás, értesítés) vannak elöl.`, '');
const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
let current = null;
for (const r of rows) {
  if (r.screen !== current) {
    current = r.screen;
    md.push('', `## ${current}`, '', '| Kulcs | Szöveg | Kontextus |', '|---|---|---|');
  }
  md.push(`| \`${r.key}\` | ${esc(r.text)} | ${esc(r.context)} |`);
}
md.push('');

mkdirSync(outDir, { recursive: true });
const base = `szoveg-lektoralas-${L.CONTENT_VERSION}${lang === 'hu' ? '' : `-${lang}`}`;
writeFileSync(join(outDir, `${base}.csv`), '﻿' + csv);
writeFileSync(join(outDir, `${base}.md`), md.join('\n'));
console.log(`${rows.length} szöveg → ${join(outDir, base)}.{csv,md}`);
