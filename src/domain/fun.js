// "Ez 12 pizza" – vicces, tárgyszerű átváltás a megspórolt pénzről. Napközben nem ugrál:
// ugyanazon a napon ugyanazt az átváltást kapja a felhasználó.

import { pickOne } from './daily.js';

/**
 * @param {number} totalHuf
 * @param {{id: string, priceHuf: number}[]} items
 * @returns {{item, count} | null}  null, ha még az egyik tételre sem elég
 */
export function funConversion(totalHuf, items, date) {
  const options = items.filter((it) => Math.floor(totalHuf / it.priceHuf) >= 1);
  const item = pickOne(options, { date });
  return item ? { item, count: Math.floor(totalHuf / item.priceHuf) } : null;
}
