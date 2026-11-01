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


/** Végigmegy a 10 lépéses bevezetőn (a PIN-lépésig a válaszok csak memóriában vannak). */
async function onboard(p, { pin, days = 0, cost = '', nick = 'Dani', screenshots = null } = {}) {
  const next = (name = 'Tovább') => p.getByRole('button', { name, exact: true }).click();
  await p.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor();
  await dismissPreview(p);
  await next('Kezdjük');
  await p.locator('input[name=nickname]').fill(nick); await next();
  await p.locator('label.choice', { hasText: 'Alkohol' }).click(); await next();
  if (days > 0) { await p.locator('label.choice', { hasText: 'Korábban kezdtem' }).click(); await p.locator('input[type=date]').fill(daysAgo(days)); }
  await next();
  await p.locator('label.choice', { hasText: '90 nap' }).click(); await next();
  if (cost) await p.locator('input[name=cost]').fill(cost);
  await next();
  await p.locator('label.choice', { hasText: 'Hétvége' }).click(); await next();
  await p.locator('input[name=pin]').fill(pin);
  await p.locator('input[name=pin2]').fill(pin);
  await p.getByRole('button', { name: 'Tovább', exact: true }).click();
  const code = (await p.getByTestId('recovery-code').textContent({ timeout: 30000 })).trim();
  await p.getByLabel('Elmentettem biztonságos helyre').check();
  await next();
  await next('Irány a főoldal');
  await p.locator('nav.tabbar').waitFor();
  return code;
}
/** Összecsukható csoport kinyitása (Beállítások, Megtakarítás). */
const openGroup = async (p, title) => {
  const g = p.locator('details.group', { has: p.locator('summary', { hasText: title }) }).first();
  if (!(await g.evaluate((e) => e.open))) await g.locator('> summary').click();
};
/** Az első indításkor felugró "előzetes verzió" közlemény elfogadása. */
const dismissPreview = async (p) => {
  const b = p.locator('dialog.sheet[open]').getByRole('button', { name: 'Értem' });
  if (await b.isVisible({ timeout: 2500 }).catch(() => false)) await b.click();
};
const dismissCelebration = async (p) => {
  const b = p.getByRole('button', { name: 'Köszönöm' });
  if (await b.isVisible({ timeout: 1500 }).catch(() => false)) await b.click();
  // A régi napló mentés-emlékeztetője (esedékes, ha régen volt mentés): halasztás.
  const later = p.locator('dialog.sheet[open]').getByRole('button', { name: 'Később' });
  if (await later.isVisible({ timeout: 1500 }).catch(() => false)) await later.click();
};
const tab = (p, name) => p.locator('nav.tabbar').getByRole('link', { name, exact: true }).click();

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
  await page.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor();
  // Az előzetes verzió közleménye felugrik, és benne is ott a "Segítség most" gomb.
  const notice = page.locator('dialog.sheet[open]');
  await notice.getByRole('heading', { name: 'Előzetes verzió' }).waitFor();
  assert.ok(await notice.getByRole('link', { name: 'Most segítségre van szükségem' }).isVisible(), 'help is reachable inside the notice');
  await dismissPreview(page);
  await shot('01-onboarding');

  // Crisis overlay: one tap from the very first screen, before any data exists.
  assert.equal(await page.locator('.boot-fallback').count(), 0, 'static fallback replaced once the app boots');
  await page.getByRole('button', { name: 'Kezdjük' }).click();
  await page.locator('input[name=nickname]').fill('félig-beírt'); // unfinished work underneath
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
  await page.locator('dialog.crisis-overlay').waitFor({ state: 'detached' });
  assert.equal(await page.locator('input[name=nickname]').inputValue(), 'félig-beírt', 'overlay kept the unfinished form intact');
  assert.equal(new URL(page.url()).hash, '#/bevezeto/2', 'Esc went back in history (URL restored)');
  step('crisis overlay: one tap, modal, 112 banner, S.O.S. + addiction line, 4-7-8 timing, pause/resume, Esc keeps the form');

  // Onboarding: back button works, a 4-digit PIN is allowed, and its limits are stated honestly
  await page.goBack();
  await page.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor();
  await page.getByRole('button', { name: 'Kezdjük' }).click();
  await page.locator('input[name=nickname]').fill('Dani');
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('label.choice', { hasText: 'Alkohol' }).click();
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('label.choice', { hasText: 'Korábban kezdtem' }).click();
  await page.locator('input[type=date]').fill(daysAgo(30));
  await shot('01a-onboarding-start');
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('label.choice', { hasText: '90 nap' }).click();
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('input[name=cost]').fill('2 500');
  await page.getByText(/Ez havonta kb\. 75.000 Ft/).waitFor();
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('label.choice', { hasText: 'Hétvége' }).click();
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await page.locator('input[name=pin]').fill('2581');
  await page.getByText(/Alapszintű védelem/).waitFor();
  await page.locator('input[name=pin]').fill(PIN);
  await page.getByText('Erős védelem.').waitFor();
  await page.locator('input[name=pin2]').fill(PIN);
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  const code = (await page.getByTestId('recovery-code').textContent({ timeout: 20000 })).trim();
  assert.match(code, /^([0-9A-Z]{4}-){7}[0-9A-Z]{4}$/);
  await shot('03-recovery');
  assert.equal(await page.getByRole('button', { name: 'Tovább', exact: true }).isDisabled(), true, 'recovery checkbox required');
  await page.getByLabel('Elmentettem biztonságos helyre').check();
  await page.getByRole('button', { name: 'Tovább', exact: true }).click();
  await shot('03a-onboarding-done');
  await page.getByRole('button', { name: 'Irány a főoldal' }).click();
  await page.locator('nav.tabbar').waitFor();
  await page.locator('.hero-value', { hasText: '30' }).waitFor();
  await dismissCelebration(page);
  assert.equal(await page.locator('.savings-total').count(), 0);
  assert.ok(await page.getByText('75 000 Ft').first().isVisible(), '30 days × 2 500 Ft');
  assert.ok(await page.getByRole('heading', { name: /Szia, Dani/ }).isVisible(), 'personalised greeting');
  await shot('04-home');
  step('onboarding (10 steps) created the vault: 30 days, 75 000 Ft, personalised home');

  // Mood check-in
  await page.getByLabel(/^Stresszes/).check({ force: true });
  await page.getByLabel('Egy gondolat hozzá (nem kötelező)').fill('TITKOS_TESZT_JEGYZET <script>alert(1)</script>');
  await page.getByRole('button', { name: 'Mentés', exact: true }).click();
  await page.getByText('Ma ez van: Stresszes').waitFor();
  step('mood check-in with one of the 12 figures saved');

  // Quick log (on the Idővonal tab): exactly two taps, no typing
  await tab(page, 'Idővonal');
  let taps = 0;
  const tap = async (locator) => { taps++; await locator.click(); };
  await tap(page.locator('.quick-card', { hasText: 'Stresszes nap' }));
  await tap(page.locator('dialog[open]').getByRole('button', { name: 'Rögzítés' }));
  await page.getByText('Rögzítve: Stresszes nap').waitFor();
  assert.equal(taps, 2);
  await page.locator('.quick-card', { hasText: 'Esti szokás' }).click();
  await page.locator('dialog[open] label.chip', { hasText: '4' }).click();
  await page.locator('dialog[open]').getByLabel(/Jegyzet/).fill('QUICK_TITKOS munka után');
  await page.locator('dialog[open]').getByRole('button', { name: 'Rögzítés' }).click();
  await page.getByText('Rögzítve: Esti szokás').waitFor();
  step('quick log: 2 taps, optional intensity + encrypted note');

  // Fresh start from the quick-add sheet: a calm form, then a growth summary (never a reset)
  await page.getByRole('button', { name: 'Gyors rögzítés' }).click();
  await page.locator('dialog.sheet').getByRole('button', { name: 'Megcsúsztam' }).click();
  await shot('05-slip');
  await page.getByLabel(/Mit vinnél magaddal/).fill('Este előre megtervezem a programot.');
  await page.getByLabel(/Mire figyelsz az új szakaszban/).fill('Esténként sétálok egyet.');
  await page.getByRole('button', { name: 'Új szakasz kezdése' }).click();
  await page.getByRole('heading', { name: 'Új szakasz kezdődik' }).waitFor();
  assert.ok(await page.getByText('30 józan nap. Ez a tiéd marad.').isVisible(), 'closed phase archived as a growth block');
  assert.ok(await page.getByText('Összes józan napod: 30').isVisible());
  await page.getByRole('button', { name: 'Tovább a kezdőlapra' }).click();
  await tab(page, 'Főoldal');
  await page.locator('.hero-value', { hasText: '30' }).waitFor();
  assert.ok(await page.getByText('Ma új szakasz kezdődött. Az eddigi utad megmaradt.').first().isVisible());
  assert.equal(await page.locator('.hero .tl-seg').count(), 2, 'timeline bar shows both phases');
  for (const banned of ['kudarc', 'nulláz']) assert.equal(await page.getByText(banned).count(), 0, banned);
  await shot('05a-home-after-slip');
  step('fresh start: growth summary, total (30) never resets, Pötty is kind');

  // The five tabs
  await tab(page, 'Idővonal');
  await page.getByRole('heading', { name: '2. szakasz' }).waitFor();
  const closedCard = page.locator('.phase-card', { hasText: '1. szakasz' });
  assert.ok(await closedCard.locator('.phase-note').getByText('Este előre megtervezem a programot.', { exact: true }).isVisible(), 'lesson on the phase it closed');
  assert.equal(await page.locator('.entry-note script').count(), 0);
  await shot('06-timeline');
  await tab(page, 'Eszközök'); await shot('07-tools');
  await tab(page, 'Beállítások'); await shot('08-settings');
  // Android-back behaviour: tab → tab replaces, one back returns home, another leaves the app
  await tab(page, 'Megtakarítás');
  await page.goBack();
  assert.equal(new URL(page.url()).hash, '#/', 'one back press from any tab returns home');
  step('five tabs; phone back goes to home');

  // Daily cost: "from now on" keeps the past; "correct everything" re-values on purpose
  await tab(page, 'Megtakarítás');
  await openGroup(page, 'Megtakarítás');
  await page.getByLabel('Új napi összeg (Ft)').fill('3 000');
  await page.getByRole('button', { name: 'Összeg mentése' }).click();
  await page.getByText('A korábbi napok értéke nem változott.').waitFor();
  assert.equal(await page.locator('.savings-total').first().textContent(), '75 000 Ft', 'price rise today: past days keep their value');
  await page.getByLabel('Új napi összeg (Ft)').fill('3000');
  await page.getByText(/Visszamenőleg javítom/).click();
  await page.getByRole('button', { name: 'Összeg mentése' }).click();
  await page.getByText('A teljes időszakot az új összeggel számoljuk.').waitFor();
  await page.getByText('Megtakarítási cél (nem kötelező)').click();
  await page.getByLabel('Mire gyűjtesz?').fill('Új bicikli');
  await page.getByLabel('Cél összege (Ft)').fill('150 000');
  await page.getByRole('button', { name: 'Cél mentése' }).click();
  await page.locator('.savings-total').first().waitFor();
  assert.equal(await page.locator('.savings-total').first().textContent(), '90 000 Ft', 'correct-all: 30 days × 3000 Ft');
  await page.getByText('Új bicikli: 60%').first().waitFor();
  await shot('09-savings');
  step('daily cost: "Mostantól" keeps 75 000 Ft, "Visszamenőleg" re-values to 90 000 Ft; goal progress');
  await tab(page, 'Idővonal'); // next step locks from here

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
  await tab(page, 'Beállítások');
  await page.getByRole('button', { name: 'Zárolás' }).click();
  await page.getByLabel('PIN-kód', { exact: true }).fill('rossz-pin-00');
  await page.getByRole('button', { name: 'Megnyitás' }).click();
  await page.getByText('Ez nem a megfelelő PIN-kód.').waitFor({ timeout: 20000 });
  await page.getByLabel('PIN-kód', { exact: true }).fill(PIN);
  await page.getByRole('button', { name: 'Megnyitás' }).click();
  await page.getByRole('heading', { name: 'Beállítások' }).first().waitFor({ timeout: 20000 }); // returns to where the user was
  step('lock, wrong PIN rejected, unlock returns to same view');

  // CSV export with BOM
  await tab(page, 'Beállítások');
  await openGroup(page, 'Adataid');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export CSV/ }).click()]);
  const csv = await readFile(await dl.path(), 'utf8');
  assert.ok(csv.startsWith('﻿'));
  assert.ok(csv.includes('Dátum;Időpont;Típus'));
  assert.ok(csv.includes('Stressz'));
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
  await dismissCelebration(page);
  await tab(page, 'Beállítások');
  await openGroup(page, 'Adataid');
  const [bk] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Titkosított mentés letöltése', exact: true }).click()]);
  const backupPath = await bk.path();
  const backupText = await readFile(backupPath, 'utf8');
  assert.ok(!backupText.includes('megtervezem') && backupText.includes('encrypted-backup'));
  await page.getByRole('button', { name: 'Minden adat törlése' }).click();
  await page.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor({ timeout: 10000 });
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
  await page.locator('.hero-value', { hasText: '30' }).waitFor({ timeout: 20000 });
  await dismissCelebration(page);
  step('encrypted backup restores all history after delete-all');

  // Forgot PIN *and* recovery code: zero-knowledge reset from the lock screen
  await tab(page, 'Beállítások');
  await page.getByRole('button', { name: 'Zárolás' }).click();
  assert.equal(await page.getByText('A mentett napló sérültnek tűnik').isVisible(), false, 'no false corruption warning');
  await page.getByRole('button', { name: 'Segítség a belépéshez' }).click();
  await page.getByText('Nincs meg sem a PIN-kód, sem a helyreállító kód').click();
  await page.getByLabel(/írd be nagybetűkkel/).fill('torles');
  await page.getByRole('button', { name: /végleges törlése és újrakezdés/ }).click();
  await page.getByText('A megerősítő szó nem egyezik').waitFor();
  assert.ok(await page.getByRole('heading', { name: 'Üdv újra' }).isVisible(), 'wrong word deletes nothing');
  await page.getByLabel(/írd be nagybetűkkel/).fill('TÖRLÉS');
  await page.getByRole('button', { name: /végleges törlése és újrakezdés/ }).click();
  await page.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor({ timeout: 10000 });
  step('lock-screen reset requires typed confirmation, then wipes and returns to setup');

  // LocalStorage fallback in a browser where IndexedDB is unavailable
  const ctx2 = await browser.newContext({ locale: 'hu-HU', serviceWorkers: 'block' });
  await ctx2.addInitScript(() => Object.defineProperty(window, 'indexedDB', { value: undefined }));
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => problems.push(e.message));
  await p2.goto(BASE);
  await onboard(p2, { pin: '7302', cost: '3333' });
  await p2.getByRole('button', { name: 'Gyors rögzítés' }).click();
  await p2.locator('dialog.sheet').getByRole('button', { name: 'Jegyzet' }).click();
  await p2.getByRole('textbox', { name: 'Jegyzet' }).fill('LS_TITOK');
  await p2.getByRole('button', { name: 'Mentés' }).click();
  await p2.getByText('Elmentve.').waitFor();
  const ls = await p2.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  const lsVault = JSON.parse(await p2.evaluate(() => localStorage.getItem('jozansag-szamlalo:vault')));
  assert.ok(lsVault.slots.pin.kdf.salt && lsVault.slots.pin.kdf.iterations === 600000 && lsVault.payload.iv && lsVault.payload.ct);
  for (const secret of ['LS_TITOK', '3333', '7302']) assert.ok(!ls.includes(secret), secret);
  assert.equal(await p2.locator('.banner-warn').count(), 0, 'localStorage persists: no volatile warning');
  await p2.reload();
  await p2.locator('.keypad').waitFor();
  await p2.keyboard.type('7302'); // a számbillentyűzet az utolsó számjegy után magától nyit
  await p2.locator('.hero-value').waitFor({ timeout: 20000 });
  // Leaving and coming back (back/forward cache or reload) must never show decrypted data.
  await p2.goto('about:blank');
  await p2.goBack();
  await p2.locator('.keypad').waitFor();
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
