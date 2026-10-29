// End-to-end smoke test in real Chromium (real IndexedDB, real PBKDF2 cost, service worker, CSP).
// Usage: npm run e2e   (SCREENSHOTS=dir to save screenshots)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startServer } from './serve.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = await startServer(0);
const BASE = `http://127.0.0.1:${server.address().port}/`;
const SHOTS = process.env.SCREENSHOTS;
const PIN = 'nyugodt-ut-73';
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'hu-HU', viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await context.newPage();
const problems = [];
page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
page.on('pageerror', (e) => problems.push(e.message));
page.on('dialog', (d) => d.accept());
const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
const step = (name) => console.log('✓', name);

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'Üdv itt.' }).waitFor();
  await shot('01-onboarding');

  // Crisis overlay: one tap from the very first screen, before any data exists.
  assert.equal(await page.locator('.boot-fallback').count(), 0, 'static fallback replaced once the app boots');
  await page.getByLabel(/Válassz PIN-kódot/).fill('félig-beírt'); // unfinished work underneath
  await page.getByRole('link', { name: 'Most segítségre van szükségem' }).click();
  const crisis = page.locator('dialog.crisis-overlay[open]');
  await crisis.getByRole('heading', { name: 'Itt vagyunk. Lépésről lépésre.' }).waitFor();
  assert.ok(await crisis.evaluate((d) => d.matches(':modal')), 'opened as a modal dialog (focus trapped, background inert)');
  assert.equal(await crisis.locator('.card-emergency a').getAttribute('href'), 'tel:112');
  assert.equal(await crisis.locator('.helplines .btn-primary').getAttribute('href'), 'tel:116123');
  assert.equal(await crisis.getByRole('link', { name: /06-80-505-678/ }).getAttribute('href'), 'tel:0680505678');
  assert.ok(await crisis.getByText(/Nem orvosi eszköz/).isVisible(), 'disclaimer on the crisis screen');
  const garbled = await crisis.locator('.btn-call').evaluateAll((links) => links.filter((a) => {
    const [num, name] = a.children;
    const r1 = num.getBoundingClientRect(), r2 = name.getBoundingClientRect();
    return (r1.left < r2.right && r2.left < r1.right && r1.top < r2.bottom && r2.top < r1.bottom) || a.scrollWidth > a.clientWidth + 1;
  }).map((a) => a.textContent));
  assert.deepEqual(garbled, [], 'no helpline number overlaps or overflows its label on a phone');

  // 4-7-8: real timing in the browser
  await crisis.locator('label.chip', { hasText: '4-7-8' }).click();
  await crisis.getByRole('button', { name: 'Indítás' }).click();
  await page.waitForTimeout(1200);
  assert.match(await crisis.locator('.breath-label').textContent(), /Belégzés/);
  await page.waitForTimeout(3300);
  assert.equal(await crisis.locator('.breath-label').textContent(), 'Benntartás');
  assert.equal(await crisis.locator('.breath-circle').getAttribute('data-kind'), 'hold');
  await shot('02-crisis');
  await crisis.getByRole('button', { name: 'Szüneteltetés' }).click();
  const frozen = await crisis.locator('.breath-count').textContent();
  await page.waitForTimeout(2200);
  assert.equal(await crisis.locator('.breath-count').textContent(), frozen, 'paused countdown does not move');
  await crisis.getByRole('button', { name: 'Folytatás' }).click();
  assert.equal(await crisis.locator('.breath-label').textContent(), 'Benntartás', 'resumes in the same phase');
  await page.keyboard.press('Escape');
  // The setup heading is visible underneath the whole time, so wait for the overlay itself to go.
  await page.locator('dialog.crisis-overlay').waitFor({ state: 'detached' });
  assert.equal(await page.getByLabel(/Válassz PIN-kódot/).inputValue(), 'félig-beírt', 'overlay kept the unfinished form intact');
  assert.equal(new URL(page.url()).hash, '', 'Esc went back in history (URL restored)');
  step('crisis overlay: one tap, modal, 112 banner, S.O.S. + addiction line, 4-7-8 timing, pause/resume, Esc keeps the form');

  // Onboarding: a 4-digit PIN is allowed, and its limits are stated honestly
  await page.getByLabel(/Válassz PIN-kódot/).fill('2581');
  await page.getByText(/Alapszintű védelem/).waitFor();
  await page.getByLabel(/Válassz PIN-kódot/).fill(PIN);
  await page.getByText('Erős védelem.').waitFor();
  await page.getByLabel('PIN-kód még egyszer').fill(PIN);
  await page.getByLabel('Mikor kezdődött az utad?').fill(daysAgo(30));
  await page.getByLabel(/Napi költség/).fill('2 500');
  await page.getByRole('button', { name: 'Kezdjük' }).click();
  const code = (await page.locator('.recovery-code').textContent({ timeout: 20000 })).trim();
  assert.match(code, /^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
  await shot('03-recovery');
  await page.getByLabel('Leírtam, biztonságban van').check();
  await page.getByRole('button', { name: 'Tovább' }).click();
  await page.locator('.hero-value', { hasText: '30 nap' }).waitFor();
  assert.equal(await page.locator('.savings-total').textContent(), '75 000 Ft');
  assert.ok(await page.getByText('Ebből már kijönne: Új futócipő').isVisible(), 'achieved milestone (45 000 Ft)');
  assert.ok(await page.getByText('Következő ötlet: Egy hétvégi kirándulás – még kb. 15 000 Ft').isVisible());
  step('vault created: 30 days, 75 000 Ft saved, HUF milestones');

  // Check-in with presets
  await page.getByRole('button', { name: 'Napi bejelentkezés' }).click();
  await page.locator('label.chip', { hasText: 'Nyugodt' }).click();
  await page.locator('label.chip', { hasText: 'Fáradtság, kialvatlanság' }).click();
  await page.locator('label.chip', { hasText: 'Jó' }).first().click();
  await page.getByLabel('Jegyzet (nem kötelező)').fill('TITKOS_TESZT_JEGYZET <script>alert(1)</script>');
  await page.getByRole('button', { name: 'Mentés' }).click();
  await page.getByText('Mára már beírtál').waitFor();
  step('check-in saved');

  // Quick log: exactly two taps from the home screen, no typing
  let taps = 0;
  const tap = async (locator) => { taps++; await locator.click(); };
  await tap(page.locator('.quick-card', { hasText: 'Stresszes nap' }));
  await tap(page.locator('dialog[open]').getByRole('button', { name: 'Rögzítés' }));
  await page.getByText('Rögzítve: Stresszes nap').waitFor();
  assert.equal(taps, 2);
  assert.equal(await page.locator('dialog[open]').count(), 0, 'dialog closed');
  await page.locator('.quick-card', { hasText: 'Esti szokás' }).click();
  await page.locator('dialog[open] label.chip', { hasText: '4' }).click();
  await page.locator('dialog[open]').getByLabel(/Jegyzet/).fill('QUICK_TITKOS munka után');
  await shot('04a-quick-log');
  await page.locator('dialog[open]').getByRole('button', { name: 'Rögzítés' }).click();
  await page.getByText('Rögzítve: Esti szokás').waitFor();
  await page.locator('.quick-card', { hasText: 'Nyugodt / Kiegyensúlyozott' }).click();
  await page.keyboard.press('Escape'); // cancel without saving
  assert.equal(await page.locator('dialog[open]').count(), 0);
  step('quick log: 2 taps (card → Rögzítés), optional intensity + encrypted note, Esc cancels');

  // Trigger log
  await page.getByRole('button', { name: 'Nehéz pillanat rögzítése' }).click();
  await page.locator('label.chip', { hasText: 'Magány' }).click();
  await page.locator('label.chip', { hasText: 'Sétáltam' }).click();
  await page.locator('label.chip', { hasText: 'Megbirkóztam vele' }).click();
  await page.getByRole('button', { name: 'Mentés' }).click();
  await page.locator('.stat', { hasText: 'Megküzdött' }).getByText('1', { exact: true }).waitFor();
  step('trigger logged and counted as coped');

  // Fresh start: a calm form, then a growth summary (never a bare toast, never a reset)
  await page.getByRole('button', { name: 'Megcsúsztam' }).click();
  await shot('04-slip');
  await page.getByLabel(/Mit vinnél magaddal/).fill('Este előre megtervezem a programot.');
  await page.getByLabel(/Mire figyelsz az új szakaszban/).fill('Esténként sétálok egyet.');
  await page.getByRole('button', { name: 'Új szakasz kezdése' }).click();
  await page.getByRole('heading', { name: 'Új szakasz kezdődik' }).waitFor();
  assert.ok(await page.getByText('30 józan nap. Ez a tiéd marad.').isVisible(), 'closed phase archived as a growth block');
  assert.ok(await page.getByText('Összes józan napod: 30').isVisible());
  assert.ok(await page.getByText('Esténként sétálok egyet.').isVisible());
  assert.ok(await page.getByRole('link', { name: 'Segítség most' }).last().isVisible(), 'support offered right after a slip');
  await shot('05a-fresh-start');
  await page.getByRole('button', { name: 'Tovább a kezdőlapra' }).click();
  await page.locator('.hero-value', { hasText: '30 nap' }).waitFor();
  assert.ok(await page.getByText('Ma új szakasz kezdődött. Az eddigi utad megmaradt.').isVisible());
  assert.equal(await page.locator('.hero .tl-seg').count(), 2, 'timeline bar shows both phases');
  assert.equal(await page.locator('.savings-total').textContent(), '75 000 Ft', 'savings must not drop after a same-day slip');
  for (const banned of ['sosem csökken', 'kudarc', 'nulláz']) assert.equal(await page.getByText(banned).count(), 0, banned);
  await shot('05-home-after-slip');
  step('fresh start: growth summary, total (30) leads the home screen, savings kept');

  // Journal: phase cards as growth blocks; user text rendered safely
  await page.getByRole('link', { name: 'Napló', exact: true }).click();
  await page.getByRole('heading', { name: '2. szakasz' }).waitFor();
  const closedCard = page.locator('.phase-card', { hasText: '1. szakasz' });
  assert.ok(await closedCard.getByText('Lezárt szakasz').isVisible());
  assert.ok(await closedCard.locator('.phase-note').getByText('Este előre megtervezem a programot.', { exact: true }).isVisible(), 'lesson on the phase it closed');
  assert.ok(await page.locator('.phase-current .phase-note').getByText('Esténként sétálok egyet.', { exact: true }).isVisible(), 'intention on the phase it opened');
  await closedCard.getByText(/Bejegyzések/).click();
  assert.ok(await closedCard.getByText(/Helyzet: .*Fáradtság/).isVisible(), 'check-in trigger preset stored and shown');
  assert.equal(await page.locator('.entry-note script').count(), 0);
  await shot('06-journal');
  step('journal: phase cards with lesson/intention on the right phase, presets shown, notes rendered as text');
  assert.ok(await closedCard.getByText('Megspórolva ebben a szakaszban: 75 000 Ft').isVisible(), 'per-phase savings');
  const phase1Entries = await closedCard.locator('.entry').allTextContents();
  assert.ok(phase1Entries.some((t) => /Esti szokás|Megszokás/.test(t) && t.includes('Erősség: 4/5')), 'quick log stored as a full entry');

  // Daily cost: "from now on" keeps the past; "correct everything" re-values on purpose
  await page.getByRole('link', { name: 'Beállítások', exact: true }).click();
  await page.getByLabel('Új napi összeg (Ft)').fill('3 000');
  await page.getByRole('button', { name: 'Összeg mentése' }).click();
  await page.getByText('A korábbi napok értéke nem változott.').waitFor();
  await page.getByRole('link', { name: 'Kezdőlap', exact: true }).click();
  assert.equal(await page.locator('.savings-total').textContent(), '75 000 Ft', 'price rise today: past days keep their value');
  await page.getByRole('link', { name: 'Beállítások', exact: true }).click();
  await page.getByLabel('Új napi összeg (Ft)').fill('3000');
  await page.getByText(/Visszamenőleg javítom/).click();
  assert.equal(await page.getByLabel('Ettől a naptól').isVisible(), false, 'date hidden for "correct all"');
  await page.getByRole('button', { name: 'Összeg mentése' }).click();
  await page.getByText('A teljes időszakot az új összeggel számoljuk.').waitFor();
  await page.getByText('Megtakarítási cél (nem kötelező)').click();
  await page.getByLabel('Mire gyűjtesz?').fill('Új bicikli');
  await page.getByLabel('Cél összege (Ft)').fill('150 000');
  await page.getByRole('button', { name: 'Cél mentése' }).click();
  await shot('07a-cost-settings');
  await page.getByRole('link', { name: 'Kezdőlap', exact: true }).click();
  assert.equal(await page.locator('.savings-total').textContent(), '90 000 Ft', 'correct-all: 30 days × 3000 Ft');
  assert.ok(await page.getByText('Saját célod: Új bicikli').isVisible());
  assert.ok(await page.getByText('Még 60 000 Ft').isVisible());
  assert.equal(await page.getByText('Ebben a szakaszban: 0 Ft').count(), 0, 'no bare 0 Ft after a slip');
  await shot('05b-home-savings');
  step('daily cost: "Mostantól" keeps 75 000 Ft, "Visszamenőleg" re-values to 90 000 Ft; personal goal progress');
  await page.getByRole('link', { name: 'Napló', exact: true }).click(); // next step locks from the journal

  // At-rest encryption in the real IndexedDB
  const dump = await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('jozansag-szamlalo', 1);
    r.onsuccess = () => {
      const all = r.result.transaction('kv').objectStore('kv').getAll();
      all.onsuccess = () => { r.result.close(); res(JSON.stringify(all.result)); };
    };
  }));
  assert.ok(dump.includes('"iterations":600000'));
  for (const secret of ['TITKOS_TESZT_JEGYZET', 'QUICK_TITKOS', 'megtervezem', 'lonely', 'loneliness', '2500', '3000', 'bicikli', 'costHistory']) assert.ok(!dump.includes(secret), secret);
  step('IndexedDB holds only ciphertext (PBKDF2 600k)');

  // Lock / wrong PIN / unlock
  await page.getByRole('button', { name: 'Zárolás' }).click();
  await page.getByLabel('PIN-kód', { exact: true }).fill('rossz-pin-00');
  await page.getByRole('button', { name: 'Megnyitás' }).click();
  await page.getByText('Hibás PIN-kód').waitFor({ timeout: 20000 });
  await page.getByLabel('PIN-kód', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'Megnyitás' }).click();
  await page.getByRole('heading', { name: 'Napló' }).waitFor({ timeout: 20000 }); // returns to where the user was
  assert.ok(await page.locator('.phase-current .phase-days').getByText('Holnap kezdődik').isVisible(), 'no bare "0 nap" on a brand-new phase');
  assert.equal(await page.locator('#app > :not(header):not(main):not(nav)').count(), 0, 'no stray nodes');
  step('lock, wrong PIN rejected, unlock returns to same view');

  // CSV export with BOM
  await page.getByRole('link', { name: 'Beállítások', exact: true }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export CSV/ }).click()]);
  const csv = await readFile(await dl.path(), 'utf8');
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('Dátum;Időpont;Típus'));
  assert.ok(csv.includes('Magány'));
  await shot('07-settings');
  step('CSV export has UTF-8 BOM and Hungarian headers');

  // Offline: service worker serves app shell; crisis screen still works
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.goto(BASE + '#/segitseg');
  const offlineCrisis = page.locator('dialog.crisis-overlay[open]');
  await offlineCrisis.getByRole('link', { name: /116-123/ }).waitFor();
  for (const tel of ['112', '116123', '0680505678', '116111']) {
    assert.equal(await offlineCrisis.locator(`a[href="tel:${tel}"]`).count(), 1, tel);
  }
  await offlineCrisis.getByRole('button', { name: 'Indítás' }).click();
  const t0 = await offlineCrisis.locator('.breath-circle').evaluate((e) => getComputedStyle(e).transform);
  await page.waitForTimeout(1500);
  const t1 = await offlineCrisis.locator('.breath-circle').evaluate((e) => getComputedStyle(e).transform);
  assert.notEqual(t0, t1, 'circle animates offline');
  await page.keyboard.press('Escape');
  await context.setOffline(false);
  step('offline: crisis screen, all four tel: links and the breathing animation work');

  // Single-step delete
  await page.goto(BASE + '#/');
  await page.getByLabel('PIN-kód', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'Megnyitás' }).click();
  await page.locator('.hero-value').waitFor({ timeout: 20000 });
  await page.getByRole('link', { name: 'Beállítások', exact: true }).click();
  const [bk] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Titkosított mentés letöltése' }).click()]);
  const backupPath = await bk.path();
  const backupText = await readFile(backupPath, 'utf8');
  assert.ok(!backupText.includes('megtervezem') && backupText.includes('encrypted-backup'));
  await page.locator('.card-warn').getByRole('button', { name: 'Minden adat törlése' }).click();
  await page.getByRole('heading', { name: 'Üdv itt.' }).waitFor({ timeout: 10000 });
  await page.getByText('Minden adat törölve.').waitFor();
  const left = await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('jozansag-szamlalo', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => { const c = r.result.transaction('kv').objectStore('kv').count(); c.onsuccess = () => { r.result.close(); res(c.result); }; };
  }));
  assert.equal(left, 0);
  step('delete-all wipes everything in one step');

  // Restore the encrypted backup as if on a new device
  await page.getByText('Van már mentésem másik eszközről').click();
  await page.getByLabel('Mentésfájl').setInputFiles(backupPath);
  await page.getByLabel('A mentés PIN-kódja').fill(PIN);
  await page.getByRole('button', { name: 'Titkosított mentés visszaállítása' }).click();
  await page.locator('.hero-value', { hasText: '30 nap' }).waitFor({ timeout: 20000 });
  step('encrypted backup restores all history after delete-all');

  // Forgot PIN *and* recovery code: zero-knowledge reset from the lock screen
  await page.getByRole('button', { name: 'Zárolás' }).click();
  assert.equal(await page.getByText('A mentett napló sérültnek tűnik').isVisible(), false, 'no false corruption warning');
  await page.getByText('Nincs meg sem a PIN-kód, sem a helyreállító kód').click();
  await page.getByLabel(/írd be nagybetűkkel/).fill('torles');
  await page.getByRole('button', { name: /végleges törlése és újrakezdés/ }).click();
  await page.getByText('A megerősítő szó nem egyezik').waitFor();
  assert.ok(await page.getByRole('heading', { name: 'Üdv újra' }).isVisible(), 'wrong word deletes nothing');
  await page.getByLabel(/írd be nagybetűkkel/).fill('TÖRLÉS');
  await page.getByRole('button', { name: /végleges törlése és újrakezdés/ }).click();
  await page.getByRole('heading', { name: 'Üdv itt.' }).waitFor({ timeout: 10000 });
  step('lock-screen reset requires typed confirmation, then wipes and returns to setup');

  // LocalStorage fallback in a browser where IndexedDB is unavailable
  const ctx2 = await browser.newContext({ locale: 'hu-HU', serviceWorkers: 'block' });
  await ctx2.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined }));
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => problems.push(e.message));
  await p2.goto(BASE);
  await p2.getByLabel(/Válassz PIN-kódot/).fill('7302');
  await p2.getByLabel('PIN-kód még egyszer').fill('7302');
  await p2.getByLabel(/Napi költség/).fill('3333');
  await p2.getByRole('button', { name: 'Kezdjük' }).click();
  await p2.getByLabel('Leírtam, biztonságban van').check({ timeout: 20000 });
  await p2.getByRole('button', { name: 'Tovább' }).click();
  await p2.getByRole('button', { name: 'Jegyzet' }).click();
  await p2.getByRole('textbox', { name: 'Jegyzet' }).fill('LS_TITOK');
  await p2.getByRole('button', { name: 'Mentés' }).click();
  await p2.getByText('Elmentve.').waitFor();
  const ls = await p2.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const lsVault = JSON.parse(await p2.evaluate(() => localStorage.getItem('jozansag-szamlalo:vault')));
  assert.ok(lsVault.slots.pin.kdf.salt && lsVault.slots.pin.kdf.iterations === 600000 && lsVault.payload.iv && lsVault.payload.ct);
  for (const secret of ['LS_TITOK', '3333', '7302']) assert.ok(!ls.includes(secret), secret);
  assert.equal(await p2.locator('.banner-warn').count(), 0, 'localStorage persists: no volatile warning');
  await p2.reload();
  await p2.getByLabel('PIN-kód', { exact: true }).fill('7302');
  await p2.getByRole('button', { name: 'Megnyitás' }).click();
  await p2.locator('.hero-value').waitFor({ timeout: 20000 });
  // Leaving and coming back (back/forward cache or reload) must never show decrypted data.
  await p2.goto('about:blank');
  await p2.goBack();
  await p2.getByLabel('PIN-kód', { exact: true }).waitFor();
  assert.equal(await p2.locator('.hero-value').count(), 0);
  await ctx2.close();
  step('IndexedDB unavailable → encrypted vault lives in localStorage and survives reload');
  step('navigating away and back shows the lock screen, never decrypted data');

  // prefers-reduced-motion: no scaling animation, guidance still advances
  const ctx3 = await browser.newContext({ locale: 'hu-HU', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE + '#/segitseg');
  await p3.getByRole('button', { name: 'Indítás' }).click();
  const r0 = await p3.locator('.breath-circle').evaluate((e) => getComputedStyle(e).transform);
  await p3.waitForTimeout(4300);
  const r1 = await p3.locator('.breath-circle').evaluate((e) => getComputedStyle(e).transform);
  assert.equal(r0, r1, 'circle stays still with reduced motion');
  assert.match(await p3.locator('.breath-label').textContent(), /kilégzés/i, 'text guidance still advances');
  await ctx3.close();
  step('prefers-reduced-motion: static circle, text and countdown still guide');

  // A broken module must not take the helplines down with it
  const ctx4 = await browser.newContext({ locale: 'hu-HU', serviceWorkers: 'block' });
  const p4 = await ctx4.newPage();
  await p4.route('**/assets/*.js', (r) => r.abort()); // the app bundle fails to load
  p4.on('pageerror', () => {}); // expected: the app module graph fails
  await p4.goto(BASE);
  await p4.locator('.boot-fallback').waitFor({ state: 'visible', timeout: 5000 });
  assert.equal(await p4.locator('.boot-fallback a[href="tel:116123"]').count(), 1);
  assert.equal(await p4.locator('.boot-fallback a[href="tel:0680505678"]').count(), 1);
  if (SHOTS) await p4.screenshot({ path: `${SHOTS}/08-fallback.png` });
  await ctx4.close();

  const ctx5 = await browser.newContext({ locale: 'hu-HU', javaScriptEnabled: false });
  const p5 = await ctx5.newPage();
  await p5.goto(BASE);
  assert.ok(await p5.locator('.boot-fallback a[href="tel:116123"]').isVisible(), 'no-JS: helplines visible immediately');
  await ctx5.close();
  step('helplines survive a failed JS module (after 2.5 s) and JS being disabled (immediately)');

  const real = problems.filter((p) => !/Failed to load resource|net::ERR_FAILED/.test(p));
  assert.deepEqual(real, [], 'console errors / CSP violations');
  step('no console errors or CSP violations');
  console.log('\nE2E OK');
} catch (err) {
  await shot('zz-failure');
  console.error('Console problems:', problems);
  throw err;
} finally {
  await browser.close();
  server.close();
}
