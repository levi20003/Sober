// Segélyvonal-elévülés ellenőrzése. A CI minden futáskor meghívja; ha egy vonal utolsó ellenőrzése
// 90 napnál régebbi, GitHub `::warning::` sort ír (a build nem bukik el, de látható figyelmeztetés marad).
// Használat: node scripts/check-helplines.mjs [--today YYYY-MM-DD] [--max-days 90]
import { HELPLINES_BY_COUNTRY } from '../src/content/helplines.js';
import { staleHelplines } from '../src/domain/helplines.js';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const today = arg('--today', new Date().toISOString().slice(0, 10));
const maxDays = Number(arg('--max-days', 90));

let stale = 0;
for (const [country, lines] of Object.entries(HELPLINES_BY_COUNTRY)) {
  for (const l of staleHelplines(lines, today, maxDays)) {
    stale += 1;
    console.log(`::warning::Segélyvonal ellenőrzése elévült (${maxDays} nap): ${country}/${l.id} ${l.number}, utoljára ${l.verified ?? 'soha'}. Lásd docs/SAFETY.md 4.1 (negyedéves ellenőrzés).`);
  }
}
console.log(stale ? `${stale} segélyvonal ellenőrzése elévült.` : `Minden segélyvonal ellenőrzése ${maxDays} napon belüli (${today}).`);
