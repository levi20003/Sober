// Diagramok és bontások adatai: józan napok / hangulat az időben, havi megtakarítás.
// Minden szám a fázisokból és az eseményekből számolódik (nincs tárolt számláló).

import { pick } from '../i18n/locale.js';
import { addDays, addMonths, diffDays, monthNameHu, startOfMonth } from './dates.js';
import { savingsBetween } from './savings.js';
import { valenceBetween } from './moods.js';

/** Completed sober days of [from, toExclusive) – today itself is still in progress. */
export function soberDaysIn(phases, from, toExclusive, today) {
  let n = 0;
  for (const p of phases) {
    const a = p.start > from ? p.start : from;
    const end = p.end ?? today;
    const b = (end < toExclusive ? end : toExclusive);
    if (b > a) n += diffDays(a, b);
  }
  return n;
}

const DOW_HU = pick(['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'], ['S', 'M', 'T', 'W', 'T', 'F', 'S']);

/**
 * Buckets for the Idővonal chart.
 *  'week'  – the last 7 days, one bar each
 *  'month' – the last 30 days, one bar each
 *  'year'  – the last 12 months, one bar each
 * Each: { key, label, from, to (exclusive), days, soberDays, valence (-1..1 | null), partial }
 */
export function timelineSeries(events, phases, today, range = 'week') {
  const tomorrow = addDays(today, 1);
  if (range === 'year') {
    const thisMonth = startOfMonth(today);
    return Array.from({ length: 12 }, (_, i) => {
      const from = addMonths(thisMonth, i - 11);
      const to = addMonths(from, 1);
      const last = addDays(to, -1);
      return {
        key: from, label: monthNameHu(from).slice(0, 3), from, to,
        days: Math.min(diffDays(from, to), Math.max(0, diffDays(from, tomorrow))),
        soberDays: soberDaysIn(phases, from, to, today),
        valence: valenceBetween(events, from, last),
        partial: from === thisMonth,
      };
    });
  }
  const n = range === 'month' ? 30 : 7;
  return Array.from({ length: n }, (_, i) => {
    const from = addDays(today, i - (n - 1));
    const to = addDays(from, 1);
    const dow = new Date(`${from}T12:00:00Z`).getUTCDay();
    return {
      key: from, label: range === 'week' ? DOW_HU[dow] : String(Number(from.slice(8))), from, to, days: 1,
      soberDays: soberDaysIn(phases, from, to, today),
      valence: valenceBetween(events, from, from),
      partial: from === today,
    };
  });
}

/** Money saved per calendar month (newest first), each day valued at its own day's cost. */
export function savingsByMonth(costHistory, phases, today, months = 12) {
  const thisMonth = startOfMonth(today);
  const out = [];
  for (let i = 0; i < months; i++) {
    const from = addMonths(thisMonth, -i);
    const to = addMonths(from, 1);
    let total = 0;
    let days = 0;
    for (const p of phases) {
      const a = p.start > from ? p.start : from;
      const end = p.end ?? today;
      const b = end < to ? end : to;
      if (b > a) { total += savingsBetween(costHistory, a, b); days += diffDays(a, b); }
    }
    out.push({ month: from, label: monthNameHu(from, { year: true }), days, amountHuf: total });
  }
  return out;
}
