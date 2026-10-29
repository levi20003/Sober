// Event-based recovery timeline with "fresh start" (újrakezdés) semantics.
//
// The event array is the single source of truth. Phases are DERIVED from it,
// never stored, so they can never contradict the journal:
//
//   journeyStart          slip D1                 slip D2            today
//        │── phase 1 ──────│✕│── phase 2 ───────────│✕│── phase 3 ─────│
//
// A slip closes the current phase on the slip day and opens the next phase the
// following day. Nothing is deleted or reset: earlier phases, total sober days,
// money saved and lessons are all kept.
//
// Day semantics: a day counts once it has been *completed*. Phase days =
// completed days in [phase.start, phase.end ?? today). The slip day itself is
// not a sober day. Consequence (deliberate and honest): logging an EARLIER
// day's slip later removes that one day from the total, because it had been
// counted as sober. Every other sober day is always kept. Copy must never
// promise "the total never decreases"; it promises "a slip never erases your
// sober days".

import { addDays, diffDays, toDateKey } from './dates.js';
import { newId, validateEvent } from './schema.js';

export function makeEvent(type, fields = {}, now = new Date()) {
  return validateEvent({
    id: newId(),
    type,
    date: fields.date ?? toDateKey(now),
    at: now.toISOString(),
    ...fields,
  });
}

export function addEvent(data, event) {
  return { ...data, events: [...data.events, event] };
}

export function removeEvent(data, id) {
  return { ...data, events: data.events.filter((e) => e.id !== id) };
}

export function slipDates(data) {
  return [...new Set(data.events.filter((e) => e.type === 'slip').map((e) => e.date))].sort();
}

/**
 * Derives phases from journeyStart + slip events.
 * Each phase: {
 *   index, start, end (exclusive = closing slip date) | null, endedBySlip, current, days,
 *   lessons[]    – from the slip(s) that closed it   ("what I take with me")
 *   intentions[] – from the slip(s) that opened it   ("what I focus on now")
 * }
 * Closed phases are stable over time: only the current phase grows.
 */
export function derivePhases(data, today = toDateKey()) {
  const slipsByDate = new Map();
  for (const e of data.events) {
    if (e.type !== 'slip' || e.date > today) continue;
    if (!slipsByDate.has(e.date)) slipsByDate.set(e.date, []);
    slipsByDate.get(e.date).push(e);
  }
  const phases = [];
  let start = data.profile.journeyStart;
  let opening = [];
  for (const date of [...slipsByDate.keys()].sort()) {
    const slips = slipsByDate.get(date);
    phases.push({ start, end: date, endedBySlip: true, opening, closing: slips });
    start = addDays(date, 1);
    opening = slips;
  }
  phases.push({ start, end: null, endedBySlip: false, opening, closing: [] });
  return phases.map(({ opening, closing, ...p }, index) => ({
    index,
    ...p,
    days: Math.max(0, diffDays(p.start, p.end ?? today)),
    current: p.end === null,
    lessons: closing.filter((e) => e.lesson).map((e) => e.lesson),
    intentions: opening.filter((e) => e.intention).map((e) => e.intention),
  }));
}

/**
 * Assigns every entry to the phase it belongs to. The slip day belongs to the
 * phase the slip closed; entries before journeyStart go to the first phase.
 * Returns an array parallel to `phases`, each a newest-first entry list.
 */
export function phaseEntries(data, phases) {
  const out = phases.map(() => []);
  for (const e of data.events) {
    let i = phases.findIndex((p) => p.end === null || e.date <= p.end);
    if (i === -1) i = phases.length - 1;
    if (e.date < phases[0].start) i = 0;
    out[i].push(e);
  }
  return out.map((list) => list.reverse());
}

/** Per-phase growth summary for phase cards. */
export function phaseSummaries(data, today = toDateKey()) {
  const phases = derivePhases(data, today);
  const entries = phaseEntries(data, phases);
  return phases.map((p, i) => ({
    ...p,
    entries: entries[i],
    checkins: entries[i].filter((e) => e.type === 'checkin').length,
    coped: entries[i].filter((e) => e.type === 'trigger' && (e.outcome === 'coped' || e.outcome === 'hard')).length,
  }));
}

export function computeStats(data, today = toDateKey()) {
  const phases = derivePhases(data, today);
  const current = phases[phases.length - 1];
  const totalSoberDays = phases.reduce((n, p) => n + p.days, 0);
  const events = data.events.filter((e) => e.date <= today);

  const checkins = events.filter((e) => e.type === 'checkin');
  const triggers = events.filter((e) => e.type === 'trigger');
  const copedCount = triggers.filter((e) => e.outcome === 'coped' || e.outcome === 'hard').length;

  return {
    journeyStart: data.profile.journeyStart,
    journeyDays: Math.max(0, diffDays(data.profile.journeyStart, today)),
    currentPhaseDays: current.days,
    currentPhaseStart: current.start,
    longestPhaseDays: Math.max(...phases.map((p) => p.days)),
    totalSoberDays,
    phaseCount: phases.length,
    checkinCount: checkins.length,
    checkedInToday: checkins.some((e) => e.date === today),
    copedCount,
    slipDays: phases.length - 1,
    lessons: events.filter((e) => e.type === 'slip' && e.lesson).map((e) => ({ date: e.date, lesson: e.lesson })),
    sleep: sleepTrend(checkins, today),
  };
}

/** Average sleep quality over the last 7 days vs. the 7 days before. */
export function sleepTrend(checkins, today = toDateKey()) {
  const avg = (from, to) => {
    const xs = checkins.filter((e) => e.sleep && e.date > addDays(today, -to) && e.date <= addDays(today, -from)).map((e) => e.sleep);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  };
  const recent = avg(0, 7);
  const previous = avg(7, 14);
  return {
    recent,
    previous,
    delta: recent !== null && previous !== null ? Math.round((recent - previous) * 10) / 10 : null,
  };
}
