// 2. fázis: kríziskezelés és szakmai hitelesség. Minden teszt egy auditmegállapításhoz tartozik
// (docs/audit/2026-11-krizis-audit.md); a javítás előtt buktak.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import * as content from '../src/content/index.js';
import * as hu from '../src/content/locales/hu.js';
import * as en from '../src/content/locales/en.js';
import { HELPLINES_BY_COUNTRY } from '../src/content/helplines.js';

const BOUNDARY_HU = ['segít követni és támogatni', 'nem orvosi eszköz', 'nem helyettesíti a szakember segítségét'];
const BOUNDARY_EN = ['helps you track and support', 'not a medical device', 'does not replace professional help'];
const has = (text, phrases) => phrases.every((p) => text.toLowerCase().includes(p.toLowerCase()));

// --- K2: minden segélyvonal forrása és ellenőrzője rögzítve -------------------------------------
test('K2: every helpline in every country records verified date, official source URL and who verified it', () => {
  for (const [country, lines] of Object.entries(HELPLINES_BY_COUNTRY)) {
    for (const l of lines) {
      const id = `${country}/${l.id}`;
      assert.match(l.verified ?? '', /^\d{4}-\d{2}-\d{2}$/, `${id}: verified date missing`);
      assert.ok(!Number.isNaN(Date.parse(l.verified)), `${id}: verified is not a real date`);
      assert.match(l.source ?? '', /^https:\/\/[^\s]+$/, `${id}: source must be an https URL`);
      assert.ok(typeof l.verifiedBy === 'string' && l.verifiedBy.trim().length >= 3, `${id}: verifiedBy missing`);
      // Telefonvonal csak 'official' vagy 'multiple-secondary' lehet; egy weboldal (url) maradhat 'unverified'.
      assert.ok(['official', 'multiple-secondary', ...(l.url ? ['unverified'] : [])].includes(l.verification), `${id}: verification level`);
    }
  }
});

test('K2: the Drog Stop line stays secondary until a human confirms it (never silently upgraded)', () => {
  const drog = HELPLINES_BY_COUNTRY.HU.find((l) => l.id === 'drog-stop');
  assert.equal(drog.tel, '0680505678');
  assert.equal(drog.verification, 'multiple-secondary');
});

test('K2: the protected numbers are unchanged', () => {
  const tels = HELPLINES_BY_COUNTRY.HU.map((l) => l.tel);
  assert.deepEqual(tels, ['112', '116123', '0680505678', '116111']);
});

test('K2: staleness check warns (GitHub ::warning::) when a line was verified more than 90 days ago', () => {
  assert.ok(existsSync('scripts/check-helplines.mjs'), 'scripts/check-helplines.mjs exists');
  const ok = execFileSync('node', ['scripts/check-helplines.mjs', '--today', '2026-11-15'], { encoding: 'utf8' });
  assert.doesNotMatch(ok, /::warning::/);
  const late = execFileSync('node', ['scripts/check-helplines.mjs', '--today', '2027-06-01'], { encoding: 'utf8' });
  assert.match(late, /::warning::.*116-123/);
  const ci = readFileSync('.github/workflows/android.yml', 'utf8');
  assert.match(ci, /node scripts\/check-helplines\.mjs/, 'runs in CI');
});

test('K2: "last verified" date helper returns the oldest verification of the shown country', async () => {
  const { lastVerified } = await import('../src/domain/helplines.js');
  assert.equal(lastVerified(HELPLINES_BY_COUNTRY.HU), [...HELPLINES_BY_COUNTRY.HU.map((l) => l.verified)].sort()[0]);
  assert.match(content.UX.helplinesVerified('2026-10-26'), /Elérhetőségek utoljára ellenőrizve: 2026/);
});

// --- K3: határ-mondatok mindenhol, ahol a felhasználó találkozik az appal ----------------------
test('K3: the disclaimer contains all three boundary statements (HU and EN)', () => {
  assert.ok(has(hu.T.disclaimer, BOUNDARY_HU), hu.T.disclaimer);
  assert.ok(has(en.T.disclaimer, BOUNDARY_EN), en.T.disclaimer);
});

test('K3: onboarding, crisis screen and Settings "Névjegy" render the disclaimer', () => {
  for (const f of ['src/components/onboarding/Onboarding.jsx', 'src/components/crisis/CrisisOverlay.jsx', 'src/components/screens/Settings.jsx']) {
    assert.match(readFileSync(f, 'utf8'), /T\.disclaimer/, `${f} shows T.disclaimer`);
  }
});

test('K3: README (HU + EN) and the APK release notes carry the boundary statements', () => {
  assert.ok(has(readFileSync('README.md', 'utf8'), BOUNDARY_HU), 'README.md');
  if (existsSync('README.en.md')) assert.ok(has(readFileSync('README.en.md', 'utf8'), BOUNDARY_EN), 'README.en.md');
  const notes = readFileSync('.github/workflows/android.yml', 'utf8');
  assert.ok(has(notes, BOUNDARY_HU), 'APK release notes');
});

// --- K4: a krízisképernyő nyugodt: nincs konfetti, kabala, rezgés, emoji ------------------------
test('K4: crisis components import no confetti, mascot or haptics, and crisis copy contains no emoji', () => {
  for (const f of readdirSync('src/components/crisis')) {
    const src = readFileSync(join('src/components/crisis', f), 'utf8');
    assert.doesNotMatch(src, /Confetti|Mascot|haptic|celebrat/i, f);
  }
  const crisisCopy = JSON.stringify([content.T.crisisTitle, content.T.crisisIntro, content.CRISIS_STEPS, content.URGE_WAVE,
    content.GROUNDING, content.BREATHING, content.RISK_MESSAGES, HELPLINES_BY_COUNTRY]);
  assert.doesNotMatch(crisisCopy, /\p{Extended_Pictographic}/u);
});

// --- K5: elvonási tünetek kártya: alapból kikapcsolva, adagolási tartalom nélkül -----------------
test('K5: the withdrawal-symptoms card exists behind a feature flag that is OFF by default', async () => {
  const { FEATURES } = await import('../src/lib/features.js');
  assert.equal(FEATURES.withdrawalCard, false, 'needs clinical approval before it can be switched on');
  for (const W of [hu.WITHDRAWAL, en.WITHDRAWAL]) {
    assert.ok(W && W.title && W.signs.length >= 3, 'content is ready for review');
    assert.match(W.action, /112/);
    const text = JSON.stringify(W).toLowerCase();
    for (const w of ['mg', 'adag', 'tablett', 'gyógyszer', 'csökkents', 'dose', 'dosage', 'taper', 'pill', 'medication']) {
      assert.ok(!new RegExp(`\\b${w}`).test(text), `no dosage/medication content: "${w}"`);
    }
  }
});

// --- K6: nincs gyógyulási, sikerességi vagy diagnosztikai állítás -------------------------------
test('K6: no cure, success-rate or diagnostic claims in any language', () => {
  const text = [hu, en].map((m) => JSON.stringify(m, (k, v) => (typeof v === 'function' ? v.toString() : v))).join('\n').toLowerCase();
  const BANNED = ['diagnóz', 'diagnosztiz', 'sikerrát', 'bizonyítottan', 'klinikailag igazolt', 'tudományosan igazolt',
    'garantáltan', 'diagnos', 'success rate', 'proven to', 'clinically proven', 'guaranteed', 'cures', 'will cure', 'treats addiction'];
  // Szóhatárral: a „secureScreen” kulcs ne számítson „cures”-nek.
  for (const b of BANNED) assert.ok(!new RegExp(`(^|[^\\p{L}])${b}`, 'u').test(text), `"${b}" found`);
});

test('K6: risk messages describe moments, never the person, and promise nothing', () => {
  for (const m of Object.values(content.RISK_MESSAGES)) {
    const t = (m.title + ' ' + m.text).toLowerCase();
    for (const w of ['veszélyeztetett vagy', 'kockázatos vagy', 'biztosan', 'mindig visszaesel', 'meg fogsz']) assert.ok(!t.includes(w), w);
  }
});

// --- K7: a megcsúszás után a krízisképernyőt felajánljuk, nem erőltetjük -------------------------
test('K7: after a slip the crisis screen is offered with a kind message (not forced, not "0 nap")', () => {
  assert.ok(content.T.freshOfferHelp && content.T.freshOfferHelpButton, 'offer text exists');
  const src = readFileSync('src/components/timeline/FreshStartModal.jsx', 'utf8');
  assert.match(src, /T\.freshOfferHelp\b/);
  assert.doesNotMatch(src, /location\.hash\s*=|navigate\(CRISIS_HASH/, 'never navigates to the crisis screen by itself');
  // A „0 nap” tilalmát a valódi felületen ellenőrizzük: tests/components/HelpEverywhere.test.jsx (K7).
});

// --- K8: lektorálási csomag ----------------------------------------------------------------------
test('K8: review export produces Markdown + CSV with key, text, screen, context and empty reviewer columns', () => {
  const out = mkdtempSync(join(tmpdir(), 'review-'));
  execFileSync('node', ['scripts/review-export.mjs', '--out', out], { encoding: 'utf8' });
  const files = readdirSync(out);
  const csvName = files.find((f) => /^szoveg-lektoralas-.+\.csv$/.test(f));
  const mdName = files.find((f) => /^szoveg-lektoralas-.+\.md$/.test(f));
  assert.ok(csvName && mdName, files.join(','));
  assert.ok(csvName.includes(hu.CONTENT_VERSION));
  const csv = readFileSync(join(out, csvName), 'utf8').replace(/^﻿/, '');
  const header = csv.split('\n')[0];
  assert.equal(header, 'Kulcs,Szöveg,Képernyő,Kontextus,Rendben,Módosítandó,Javasolt szöveg,Megjegyzés');
  for (const key of ['T.disclaimer', 'T.crisisTitle', 'T.slipIntro', 'RISK_MESSAGES.lateNight.text', 'HELPLINES.HU.lesz.when', 'WITHDRAWAL.title', 'PRESETS.TRIGGERS.stress']) {
    assert.ok(csv.includes(`\n${key},`) || csv.includes(`\n"${key}",`), `row for ${key}`);
  }
  const md = readFileSync(join(out, mdName), 'utf8');
  assert.match(md, /Krízisképernyő/);
  assert.match(md, /\| Kulcs \| Szöveg \|/);
  // Nincs kitöltött jóváhagyás: az üres oszlopok üresek.
  const row = csv.split('\n').find((l) => l.startsWith('T.disclaimer,') || l.startsWith('"T.disclaimer",'));
  assert.match(row, /,,,,$/);
});

test('K8: reviewer briefing exists and the sign-off table stays empty (never filled by tooling)', () => {
  assert.ok(existsSync('docs/review/LEKTOR-TAJEKOZTATO.md'));
  const review = readFileSync('docs/CLINICAL-REVIEW.md', 'utf8');
  const table = review.split('## 4. Sign-off record')[1].split('\n## ')[0];
  for (const row of table.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !l.startsWith('| Item'))) {
    assert.match(row, /\|\s*\|\s*\|\s*\|$/, `sign-off row must stay empty until a real reviewer signs: ${row}`);
  }
  assert.match(hu.REVIEW_STATUS, /lektorálásra vár/i, 'REVIEW_STATUS unchanged until sign-off');
});

test('K9: SAFETY.md documents the quarterly helpline verification procedure', () => {
  const s = readFileSync('docs/SAFETY.md', 'utf8');
  assert.match(s, /negyedév|quarterly/i);
  assert.match(s, /próbahívás|test call/i);
  assert.match(s, /verifiedBy/);
});
