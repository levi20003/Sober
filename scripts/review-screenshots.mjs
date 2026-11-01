// Képernyőképek a szakmai lektoráláshoz: a biztonságkritikus képernyők világos és sötét témában.
// Előtte: npm run build. Kimenet: docs/review/screenshots/<CONTENT_VERSION>/<név>-<téma>.png
// Használat: node scripts/review-screenshots.mjs [--out dir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './serve.js';

globalThis.localStorage = { getItem: () => JSON.stringify({ lang: 'hu' }), setItem() {}, removeItem() {} };
const { CONTENT_VERSION } = await import('../src/content/locales/hu.js');

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const OUT = arg('--out', join('docs/review/screenshots', CONTENT_VERSION));
mkdirSync(OUT, { recursive: true });

const server = await startServer(0);
const BASE = `http://127.0.0.1:${server.address().port}/`;
const PIN = 'lektor-minta-2581';
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };
const browser = await chromium.launch();
const shots = [];

async function capture(p, name, theme, { full = true, locator } = {}) {
  const path = join(OUT, `${name}-${theme}.png`);
  if (locator) await locator.screenshot({ path }); else await p.screenshot({ path, fullPage: full });
  shots.push(path);
}
/** Felugró lapok (előzetes verzió, ünneplés, mentés-emlékeztető) bezárása; ezek késleltetve, animálva jelennek meg. */
const closeSheets = async (p) => {
  for (let i = 0; i < 3; i++) {
    const open = p.locator('dialog.sheet[open], .celebrate');
    if (!(await open.first().isVisible({ timeout: 3000 }).catch(() => false))) return;
    await p.waitForTimeout(500); // a megjelenési animáció vége
    for (const name of ['Értem', 'Később', 'Köszönöm']) {
      const b = open.first().getByRole('button', { name, exact: true });
      if (await b.count()) { await b.click(); break; }
    }
    await p.waitForTimeout(400);
  }
};

for (const theme of ['light', 'dark']) {
  // Péntek késő este: a krízisképernyőn megjelenik a kockázati üzenet (késő éjszaka / hétvége).
  const ctx = await browser.newContext({ locale: 'hu-HU', colorScheme: theme, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date('2026-11-06T23:15:00'));
  await p.goto(BASE);

  // 1. Bevezető: első képernyő a határ-mondattal
  await p.getByRole('heading', { name: /csendes, privát helyed/ }).waitFor();
  await closeSheets(p);
  await capture(p, '01-bevezeto-figyelmeztetes', theme);

  // 2. Krízisképernyő (PIN nélkül, a bevezetőből), kockázati üzenettel
  await p.getByRole('link', { name: 'Most segítségre van szükségem' }).first().click();
  const crisis = p.locator('dialog.crisis-overlay[open]');
  await crisis.waitFor();
  await capture(p, '02-kriziskepernyo-teljes', theme, { locator: crisis.locator('main') });
  await capture(p, '03-kriziskepernyo-felso-resz', theme, { full: false });

  // 3. Légzőgyakorlat futás közben
  const start = crisis.getByRole('button', { name: /Indítás|Kezdés|Start/ }).first();
  await start.scrollIntoViewIfNeeded();
  await start.click();
  await p.waitForTimeout(1500);
  await capture(p, '04-legzogyakorlat', theme, { locator: crisis.locator('.breathing') });
  await crisis.getByRole('button', { name: 'Vissza' }).first().click();
  await crisis.waitFor({ state: 'detached' });

  // 4. Bevezető végig (valódi titkosítással), 20 napos múlttal
  const next = (name = 'Tovább') => p.getByRole('button', { name, exact: true }).click();
  await next('Kezdjük');
  await p.locator('label.choice', { hasText: 'Alkohol' }).click(); await next();
  await p.locator('label.choice', { hasText: 'Korábban kezdtem' }).click();
  await p.locator('input[type=date]').fill(daysAgo(20)); await next();
  await p.locator('input[name=pin]').fill(PIN); await p.locator('input[name=pin2]').fill(PIN); await next();
  await p.getByTestId('recovery-code').waitFor({ timeout: 30000 });
  await capture(p, '05-helyreallito-kod', theme);
  await p.getByLabel('Elmentettem biztonságos helyre').check();
  await next('Irány a főoldal');
  await p.locator('nav.tabbar').waitFor();
  await closeSheets(p);

  // 5. Megcsúszás: űrlap, majd összegzés a felajánlott segítséggel
  await p.getByRole('button', { name: 'Gyors rögzítés' }).click();
  await p.locator('dialog.sheet[open]').getByRole('button', { name: 'Megcsúsztam' }).click();
  const slip = p.locator('dialog.sheet-dialog[open]');
  await slip.waitFor();
  await capture(p, '06-megcsuszas-urlap', theme, { locator: slip.locator('.screen') });
  await slip.getByRole('button', { name: 'Új szakasz kezdése' }).click();
  await p.getByRole('heading', { name: 'Új szakasz kezdődik' }).waitFor();
  await capture(p, '07-megcsuszas-osszegzes', theme, { locator: slip.locator('.screen') });
  await p.getByRole('button', { name: 'Tovább a kezdőlapra' }).click();
  await closeSheets(p);
  await capture(p, '08-fooldal-megcsuszas-utan', theme);

  // 6. Krízisképernyő megnyitott naplóval (saját nehéz órák alapján is szólhat)
  await p.locator('.appbar').getByRole('link', { name: 'Most segítségre van szükségem' }).click();
  await p.locator('dialog.crisis-overlay[open]').waitFor();
  await capture(p, '09-kockazati-uzenet', theme, { locator: p.locator('dialog.crisis-overlay[open] aside').first() });
  await p.locator('dialog.crisis-overlay[open]').getByRole('button', { name: 'Vissza' }).first().click();

  // 7. Értesítések (Eszközök → Emlékeztetők): a kapcsoló és a „i” magyarázat a semleges értesítésszövegről
  await p.locator('nav.tabbar').getByRole('link', { name: 'Eszközök', exact: true }).click();
  const rem = p.locator('section', { has: p.getByRole('heading', { name: 'Emlékeztetők' }) }).last();
  await rem.scrollIntoViewIfNeeded();
  await capture(p, '10-ertesites-beallitas', theme, { locator: rem });
  await rem.getByRole('button', { name: /Tudnivalók/ }).click();
  await capture(p, '10b-ertesites-tudnivalo', theme, { locator: p.locator('dialog.sheet[open]') });
  await p.locator('dialog.sheet[open]').getByRole('button', { name: 'Értem' }).click();
  await p.locator('nav.tabbar').getByRole('link', { name: 'Beállítások', exact: true }).click();
  // 8. Névjegy: határ-mondat és az ellenőrzés dátuma
  const about = p.locator('details.group', { has: p.locator('summary', { hasText: 'Rólunk' }) }).first();
  if (!(await about.evaluate((e) => e.open))) await about.locator('> summary').click();
  await capture(p, '11-nevjegy', theme, { locator: about });
  await ctx.close();
}

await browser.close();
server.close();
console.log(`${shots.length} képernyőkép → ${OUT}`);
