// HUF savings.
//
// Money saved = Σ over every sober day of the daily cost *in effect on that day*.
// The cost is an effective-dated history (settings.costHistory), so updating it
// never re-values days already lived unless the user explicitly says their
// earlier estimate was wrong ("correct all").
//
// Sober days come from the derived phases (see domain/timeline.js): a slip never
// erases money already saved, except that a late-logged slip removes its own day.
//
// All amounts are integer forints; sums stay exact far beyond any realistic range
// (1 000 000 Ft/day × 100 years ≈ 3.7·10¹⁰ < 2⁵³).

import { diffDays } from './dates.js';
import { validateCostHistory } from './schema.js';

const fmt = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });

export function formatHuf(amount) {
  // Normalize narrow/no-break spaces so output is stable across ICU versions.
  return fmt.format(Math.round(amount)).replace(/[  ]/g, ' ');
}

/** Accepts "2 500", "2500 Ft", "2.500", "2,5e3"-free plain input. Returns integer HUF, 0 for empty, NaN if invalid. */
export function parseHufInput(text, max = 1_000_000) {
  if (text === '' || text === null || text === undefined) return 0;
  let t = String(text).replace(/[\s  ]|Ft|HUF/gi, '');
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ''); // "2.500" = Hungarian thousands separator
  t = t.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
  const n = Math.round(Number(t));
  return n <= max ? n : NaN;
}

/** Daily cost in effect on `day`. Days before the first entry use the first entry. */
export function costOn(history, day) {
  let cost = history[0].dailyCostHuf;
  for (const e of history) {
    if (e.from > day) break;
    cost = e.dailyCostHuf;
  }
  return cost;
}

export const currentDailyCost = (data, today) => costOn(data.settings.costHistory, today);

/** Exact HUF value of the days in [start, endExclusive), each at its own day's cost. */
export function savingsBetween(history, start, endExclusive) {
  if (!start || !endExclusive || endExclusive <= start) return 0;
  let total = 0;
  for (let i = 0; i < history.length; i++) {
    const segStart = i === 0 ? start : history[i].from;          // first segment extends backwards
    const segEnd = i + 1 < history.length ? history[i + 1].from : endExclusive;
    const from = segStart > start ? segStart : start;
    const to = segEnd < endExclusive ? segEnd : endExclusive;
    if (to > from) total += diffDays(from, to) * history[i].dailyCostHuf;
  }
  return total;
}

/**
 * Changes the daily cost.
 *  mode 'from' (default): prices changed – the new amount applies from `from` onward;
 *                         days before keep their old value; later entries are replaced.
 *  mode 'all':            the earlier estimate was wrong – re-value the whole period.
 * Redundant entries are compacted so the history stays minimal.
 */
export function updateCostHistory(history, { amountHuf, mode = 'from', from }) {
  let next;
  if (mode === 'all') {
    next = [{ from: history[0].from, dailyCostHuf: amountHuf }];
  } else {
    if (!from) throw new TypeError('`from` date required');
    next = [...history.filter((e) => e.from < from), { from, dailyCostHuf: amountHuf }];
  }
  const compact = next.filter((e, i) => i === 0 || e.dailyCostHuf !== next[i - 1].dailyCostHuf);
  return validateCostHistory(compact);
}

/**
 * Tangible milestones (from content). Returns achieved ones and the next target.
 * @param {{id,label,amountHuf}[]} milestones ascending by amount
 */
export function milestoneProgress(total, milestones) {
  const achieved = milestones.filter((m) => total >= m.amountHuf);
  const next = milestones.find((m) => total < m.amountHuf) ?? null;
  const prevAmount = achieved.at(-1)?.amountHuf ?? 0;
  return {
    achieved,
    next,
    remaining: next ? next.amountHuf - total : 0,
    // progress within the current step, 0..1
    progress: next ? (total - prevAmount) / (next.amountHuf - prevAmount) : 1,
  };
}

export function goalProgress(total, goal) {
  if (!goal) return null;
  return {
    ...goal,
    reached: total >= goal.amountHuf,
    remaining: Math.max(0, goal.amountHuf - total),
    progress: Math.min(1, total / goal.amountHuf),
  };
}

/**
 * Full savings view for the UI.
 * @param {object}   data        validated payload
 * @param {object[]} phases      from derivePhases(data, today)
 * @param {string}   today
 * @param {object[]} milestones  content list (ascending)
 */
export function computeSavings(data, phases, today, milestones = []) {
  const history = data.settings.costHistory;
  const perPhase = phases.map((p) => savingsBetween(history, p.start, p.end ?? today));
  const total = perPhase.reduce((a, b) => a + b, 0);
  const daily = costOn(history, today);
  return {
    configured: history.some((e) => e.dailyCostHuf > 0),
    daily,
    total,
    currentPhase: perPhase.at(-1),
    perPhase,
    perMonth: Math.round(daily * 30.44),
    perYear: daily * 365,
    history,
    changedOverTime: history.length > 1,
    milestones: milestoneProgress(total, milestones),
    goal: goalProgress(total, data.settings.savingsGoal),
  };
}
