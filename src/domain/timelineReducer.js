// Timeline reducer: the ONLY way the journal changes.
//
//   (data, action) → { data, effects }
//
// - Pure: no I/O, no clock reads (pass `now`), so every transition is unit-testable.
// - Append-only: new events are appended; existing events keep their identity and
//   are deep-frozen, so nothing in the app can mutate history by accident.
// - The single removal path is DELETE_ENTRY, which only ever runs on an explicit
//   user request (mistaken entry, or the user's right to remove a private note).
// - FRESH_START (újrakezdés) closes the current phase and opens a new one; its
//   effects describe the archived phase so the UI can show a growth summary.

import { validateData, SchemaError } from './schema.js';
import { makeEvent, derivePhases, computeStats } from './timeline.js';
import { toDateKey } from './dates.js';
import { updateCostHistory } from './savings.js';

export const Actions = Object.freeze({
  LOG_CHECKIN: 'LOG_CHECKIN',
  LOG_TRIGGER: 'LOG_TRIGGER',
  LOG_NOTE: 'LOG_NOTE',
  FRESH_START: 'FRESH_START',
  DELETE_ENTRY: 'DELETE_ENTRY',
  SET_DAILY_COST: 'SET_DAILY_COST',
  SET_SAVINGS_GOAL: 'SET_SAVINGS_GOAL',
});

const EVENT_TYPE = {
  [Actions.LOG_CHECKIN]: 'checkin',
  [Actions.LOG_TRIGGER]: 'trigger',
  [Actions.LOG_NOTE]: 'note',
  [Actions.FRESH_START]: 'slip',
};

export class TimelineError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimelineError';
    this.code = 'TIMELINE';
  }
}

export function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

/** Re-applies validation but keeps the identity of events that did not change. */
function finalize(prev, events) {
  const validated = validateData({ ...prev, events });
  const byId = new Map(events.map((e) => [e.id, e]));
  validated.events = validated.events.map((e) => (byId.get(e.id) && JSON.stringify(byId.get(e.id)) === JSON.stringify(e) ? byId.get(e.id) : e));
  return deepFreeze(validated);
}

function freshStartEffects(before, after, slip, today) {
  const phasesBefore = derivePhases(before, today);
  const phasesAfter = derivePhases(after, today);
  const statsBefore = computeStats(before, today);
  const statsAfter = computeStats(after, today);
  const closed = phasesAfter.find((p) => p.end === slip.date);
  const opened = phasesAfter[phasesAfter.indexOf(closed) + 1];
  return {
    type: 'fresh-start',
    newPhase: phasesAfter.length > phasesBefore.length,  // false for a 2nd slip on the same day
    retroactive: slip.date < today,                     // logged later than it happened
    splitEarlierPhase: !opened.current,                 // a late-logged slip inside an already closed phase
    closedPhase: { index: closed.index, start: closed.start, end: closed.end, days: closed.days, lessons: closed.lessons },
    openedPhase: { index: opened.index, start: opened.start, current: opened.current, intentions: opened.intentions },
    totalBefore: statsBefore.totalSoberDays,
    totalAfter: statsAfter.totalSoberDays,
    phaseCount: phasesAfter.length,
  };
}

/**
 * @param {object} data   validated vault payload (may be frozen)
 * @param {{type: string, payload?: object}} action
 * @param {{now?: Date}} [ctx]
 */
export function timelineReducer(data, action, { now = new Date() } = {}) {
  const today = toDateKey(now);
  const payload = action?.payload ?? {};

  switch (action?.type) {
    case Actions.LOG_CHECKIN:
    case Actions.LOG_TRIGGER:
    case Actions.LOG_NOTE: {
      if (payload.date && payload.date > today) throw new TimelineError('Jövőbeli napra nem lehet bejegyzést írni.');
      const event = makeEvent(EVENT_TYPE[action.type], payload, now);
      return { data: finalize(data, [...data.events, event]), effects: { type: 'logged', event } };
    }

    case Actions.FRESH_START: {
      const date = payload.date ?? today;
      if (date > today) throw new TimelineError('Jövőbeli napra nem lehet megcsúszást rögzíteni.');
      if (date < data.profile.journeyStart) throw new TimelineError('A dátum nem lehet korábbi, mint az út kezdete.');
      const event = makeEvent('slip', { ...payload, date }, now);
      const next = finalize(data, [...data.events, event]);
      return { data: next, effects: { ...freshStartEffects(data, next, event, today), event } };
    }

    case Actions.DELETE_ENTRY: {
      const target = data.events.find((e) => e.id === payload.id);
      if (!target) throw new TimelineError('A bejegyzés nem található.');
      const next = finalize(data, data.events.filter((e) => e.id !== payload.id));
      const phasesMerged = target.type === 'slip' && derivePhases(next, today).length < derivePhases(data, today).length;
      return { data: next, effects: { type: 'deleted', event: target, phasesMerged } };
    }

    // Settings that drive derived values. Events are untouched (same identities).
    case Actions.SET_DAILY_COST: {
      const { amountHuf, mode = 'from' } = payload;
      const from = payload.from ?? today;
      if (mode === 'from' && from > today) throw new TimelineError('Jövőbeli dátumtól nem lehet költséget beállítani.');
      const costHistory = updateCostHistory(data.settings.costHistory, { amountHuf, mode, from });
      const next = finalize({ ...data, settings: { ...data.settings, costHistory } }, data.events);
      return { data: next, effects: { type: 'cost-updated', mode, costHistory } };
    }

    case Actions.SET_SAVINGS_GOAL: {
      const { savingsGoal, ...rest } = data.settings;
      const settings = payload.goal ? { ...rest, savingsGoal: payload.goal } : rest;
      return { data: finalize({ ...data, settings }, data.events), effects: { type: 'goal-updated', goal: payload.goal ?? null } };
    }

    default:
      throw new TimelineError(`Ismeretlen művelet: ${action?.type}`);
  }
}

export { SchemaError };
