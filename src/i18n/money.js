// Pénznem. A megtakarítás számai egyszerű egész számok a választott pénznemben (a sémában a mezők neve
// történeti okból "…Huf"); a pénznemváltás csak a kijelzést és az ötlet-tételek árait érinti, nem vált át összegeket.

import { detectCountry, intlTag, readUiPref } from './locale.js';

export const CURRENCIES = {
  HUF: { symbol: 'Ft', hufPer: 1 },
  GBP: { symbol: '£', hufPer: 450 },
  USD: { symbol: '$', hufPer: 350 },
  EUR: { symbol: '€', hufPer: 395 },
};
export const CURRENCY_IDS = Object.keys(CURRENCIES);
const BY_COUNTRY = { HU: 'HUF', UK: 'GBP', US: 'USD', INT: 'EUR' };

export function detectCurrency() {
  const pref = readUiPref('currency');
  return CURRENCY_IDS.includes(pref) ? pref : BY_COUNTRY[detectCountry()];
}

export const currency = detectCurrency();
export const currencySymbol = CURRENCIES[currency].symbol;

const fmt = new Intl.NumberFormat(intlTag, { style: 'currency', currency, maximumFractionDigits: 0 });
export const formatMoney = (n) => fmt.format(n).replace(/ /g, ' ');

const STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10];
/** Kerek, "emberi" szám a legközelebbi lépcsőre (pl. 7,8 → 8; 33 → 30). */
export function niceAmount(x) {
  if (x <= 1) return 1;
  const mag = 10 ** Math.floor(Math.log10(x));
  const m = x / mag;
  const best = STEPS.reduce((a, s) => (Math.abs(s - m) < Math.abs(a - m) ? s : a));
  return Math.round(best * mag * 100) / 100;
}

/** Forint-alapú ötlet-listák átszámítása a választott pénznemre (szigorúan növekvő marad). */
export function convertAmounts(items, field) {
  if (currency === 'HUF') return items;
  const rate = CURRENCIES[currency].hufPer;
  let prev = 0;
  return items.map((it) => {
    let v = niceAmount(it[field] / rate);
    if (v <= prev) v = niceAmount(prev * 1.25);
    prev = v;
    return { ...it, [field]: v };
  });
}
