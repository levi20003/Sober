// Design-képernyőképek (PR-hoz): bevezető lépései, főoldal, idővonal, megtakarítás, eszközök, beállítások, krízis,
// világos és sötét témában, 390 px szélességen. Előtte: npm run build.
// Használat: node scripts/design-screenshots.mjs [--out dir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './serve.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const OUT = arg('--out', 'docs/review/screenshots/design');
mkdirSync(OUT, { recursive: true });

const server = await startServer(0);
const BASE = `http://127.0.0.1:${server.address().port}/`;
const PIN = 'minta-design-2581';
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };
const browser = await chromium.launch();
let count = 0;

async function closeSheets(p) {
  for (let i = 0; i < 3; i++) {
    const open = p.locator('dialog.sheet[open], .celebrate');
    if (!(await open.first().isVisible({ timeout: 2500 }).catch(() => false))) return;
    await p.waitForTimeout(450);
    for (const name of ['Értem', 'Később', 'Köszönöm']) {
      const b = open.first().getByRole('button', { name, exact: true });
      if (await b.count()) { await b.click(); break; }
    }
    await p.waitForTimeout(350);
  }
}
const shot = async (p, name, theme, full = true) => { await p.waitForTimeout(700); await p.screenshot({ path: join(OUT, `${name}-${theme}.png`), fullPage: full }); count++; };

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ locale: 'hu-HU', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(BASE);
  const next = (name = 'Tovább') => p.getByRole('button', { name, exact: true }).click();
  await p.getByRole('heading', { name: 'Szia! Ez a te csendes, privát helyed.' }).waitFor();
  await closeSheets(p);
  await shot(p, '01-bevezeto-1', theme, false);
  await p.locator('input[name=nickname]').fill('Levi');
  await next('Kezdjük');
  await shot(p, '01-bevezeto-2', theme, false);
  await p.locator('label.choice', { hasText: 'Alkohol' }).click(); await next();
  await p.locator('label.choice', { hasText: 'Korábban kezdtem' }).click();
  await p.locator('input[type=date]').fill(daysAgo(30));
  await shot(p, '01-bevezeto-3', theme, false);
  await next();
  await p.locator('input[name=pin]').fill(PIN); await p.locator('input[name=pin2]').fill(PIN);
  await shot(p, '01-bevezeto-4', theme, false);
  await next();
  await p.getByTestId('recovery-code').waitFor({ timeout: 30000 });
  await shot(p, '01-bevezeto-5', theme, false);
  await p.getByLabel('Elmentettem biztonságos helyre').check();
  await next('Irány a főoldal');
  await p.locator('nav.tabbar').waitFor();
  await closeSheets(p);
  // néhány hangulat, hogy a csempék ne legyenek üresek
  await p.locator('.mood-picker button, .checkin button').first().click().catch(() => {});
  await closeSheets(p);
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, '02-fooldal', theme);
  for (const [tab, name] of [['Idővonal', '03-idovonal'], ['Megtakarítás', '04-megtakaritas'], ['Eszközök', '05-eszkozok'], ['Beállítások', '06-beallitasok']]) {
    if (tab === 'Beállítások') await p.locator('.appbar .avatar').click();
    else await p.locator('nav.tabbar').getByRole('link', { name: tab, exact: true }).click();
    await closeSheets(p);
    await shot(p, name, theme);
  }
  await p.locator('.appbar a.btn-help').click();
  await p.locator('dialog.crisis-overlay[open]').waitFor();
  await shot(p, '07-krizis', theme, false);
  await ctx.close();
}
await browser.close();
server.close();
console.log(`${count} képernyőkép → ${OUT}`);
