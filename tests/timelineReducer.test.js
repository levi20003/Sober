import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initial, makeStore, FakeStorage } from './helpers.js';
import { timelineReducer, Actions, deepFreeze } from '../src/domain/timelineReducer.js';
import { derivePhases, computeStats, phaseSummaries } from '../src/domain/timeline.js';
import { createTimelineStore } from '../src/state/timelineStore.js';
import { addDays, diffDays } from '../src/domain/dates.js';
import { LocalStorageBackend } from '../src/storage/backends.js';
import { VaultStore } from '../src/storage/store.js';

const at = (date, hm = '12:00') => new Date(`${date}T${hm}:00`);
const start = () => deepFreeze(initial()); // journeyStart 2026-01-01, 2500 Ft/day

/** Applies actions in order; each as [action, nowDate]. */
function run(data, steps) {
  const effects = [];
  for (const [action, date] of steps) {
    const r = timelineReducer(data, action, { now: at(date) });
    data = r.data;
    effects.push(r.effects);
  }
  return { data, effects };
}

// --- Logging -----------------------------------------------------------------------

test('logging appends; earlier events keep identity, stay frozen and unchanged', () => {
  const { data: d1 } = run(start(), [[{ type: Actions.LOG_CHECKIN, payload: { mood: 'calm', sleep: 4, triggers: ['fatigue'] } }, '2026-01-05']]);
  const first = d1.events[0];
  const snapshot = JSON.stringify(d1);
  const { data: d2 } = run(d1, [
    [{ type: Actions.LOG_TRIGGER, payload: { triggers: ['social-pressure', 'routine'], intensity: 3, coping: ['left'], outcome: 'coped', note: 'Munka után.' } }, '2026-01-06'],
    [{ type: Actions.LOG_NOTE, payload: { note: 'Jó nap volt.' } }, '2026-01-07'],
  ]);
  assert.equal(JSON.stringify(d1), snapshot, 'previous state object untouched');
  assert.equal(d2.events[0], first, 'structural sharing: same object');
  assert.ok(Object.isFrozen(d2) && Object.isFrozen(d2.events) && Object.isFrozen(d2.events[0]));
  assert.throws(() => { d2.events[0].note = 'átírva'; }, TypeError);
  assert.throws(() => { d2.events.push({}); }, TypeError);
  assert.deepEqual(d2.events.map((e) => e.type), ['checkin', 'trigger', 'note']);
  assert.deepEqual(d2.events[0].triggers, ['fatigue']);
});

test('invalid entries are rejected and nothing changes', () => {
  const d = start();
  assert.throws(() => timelineReducer(d, { type: Actions.LOG_TRIGGER, payload: { triggers: ['nincs-ilyen'], intensity: 3 } }), { name: 'SchemaError' });
  assert.throws(() => timelineReducer(d, { type: Actions.LOG_CHECKIN, payload: { date: '2026-02-01' } }, { now: at('2026-01-10') }), { code: 'TIMELINE' });
  assert.throws(() => timelineReducer(d, { type: Actions.LOG_NOTE, payload: { note: '   ' } }), { name: 'SchemaError' });
  assert.throws(() => timelineReducer(d, { type: 'RESET_EVERYTHING' }), { code: 'TIMELINE' });
  assert.equal(d.events.length, 0);
});

// --- Fresh start --------------------------------------------------------------------

test('fresh start closes the current phase as a growth block and opens a new one', () => {
  const { data, effects: [fx] } = run(start(), [[
    { type: Actions.FRESH_START, payload: { lesson: 'A pénteki fáradtság a nehéz pontom.', intention: 'Pénteken korán hazamegyek.', triggers: ['fatigue'] } },
    '2026-01-21',
  ]]);
  assert.equal(fx.type, 'fresh-start');
  assert.equal(fx.newPhase, true);
  assert.equal(fx.retroactive, false);
  assert.deepEqual(fx.closedPhase, { index: 0, start: '2026-01-01', end: '2026-01-21', days: 20, lessons: ['A pénteki fáradtság a nehéz pontom.'] });
  assert.deepEqual(fx.openedPhase, { index: 1, start: '2026-01-22', current: true, intentions: ['Pénteken korán hazamegyek.'] });
  assert.equal(fx.totalBefore, 20);
  assert.equal(fx.totalAfter, 20, 'same-day slip: nothing already counted is removed');

  const s = computeStats(data, '2026-01-31');
  assert.deepEqual([s.currentPhaseDays, s.totalSoberDays, s.longestPhaseDays, s.phaseCount], [9, 29, 20, 2]);
});

test('closed phases are archived: they never change as time passes, only the current one grows', () => {
  const { data } = run(start(), [
    [{ type: Actions.FRESH_START, payload: {} }, '2026-01-11'],
    [{ type: Actions.FRESH_START, payload: {} }, '2026-02-01'],
  ]);
  const closedAt = (today) => derivePhases(data, today).filter((p) => !p.current);
  const early = closedAt('2026-02-02');
  for (const later of ['2026-03-01', '2026-12-31', '2028-06-15']) assert.deepEqual(closedAt(later), early);
  assert.deepEqual(early.map((p) => p.days), [10, 20]);
  assert.equal(derivePhases(data, '2026-03-01').at(-1).days, 27);
});

test('late-logged slip: removes exactly that one day, keeps every other sober day', () => {
  const d0 = start();
  const before = computeStats(d0, '2026-01-29').totalSoberDays; // 28
  const { data, effects: [fx] } = run(d0, [[{ type: Actions.FRESH_START, payload: { date: '2026-01-28' } }, '2026-01-29']]);
  assert.equal(fx.retroactive, true);
  assert.equal(fx.totalBefore, before);
  assert.equal(fx.totalAfter, before - 1, 'only the slip day itself stops counting');
  assert.equal(computeStats(data, '2026-01-29').totalSoberDays, 27);
  assert.equal(fx.closedPhase.days, 27);
});

test('late-logged slip inside an already closed phase splits it (reported to the UI)', () => {
  const { effects } = run(start(), [
    [{ type: Actions.FRESH_START, payload: { date: '2026-01-20' } }, '2026-01-20'],
    [{ type: Actions.FRESH_START, payload: { date: '2026-01-10' } }, '2026-01-25'],
  ]);
  const fx = effects[1];
  assert.equal(fx.splitEarlierPhase, true);
  assert.deepEqual([fx.closedPhase.start, fx.closedPhase.days], ['2026-01-01', 9]);
  assert.deepEqual([fx.openedPhase.start, fx.openedPhase.current], ['2026-01-11', false]);
});

test('second slip on the same day: recorded, but no extra phase', () => {
  const { data, effects } = run(start(), [
    [{ type: Actions.FRESH_START, payload: { lesson: 'első' } }, '2026-01-15'],
    [{ type: Actions.FRESH_START, payload: { lesson: 'második' } }, '2026-01-15'],
  ]);
  assert.equal(effects[1].newPhase, false);
  assert.equal(derivePhases(data, '2026-01-20').length, 2);
  assert.deepEqual(derivePhases(data, '2026-01-20')[0].lessons, ['első', 'második']);
});

test('fresh start guards: no future dates, nothing before the journey start', () => {
  assert.throws(() => timelineReducer(start(), { type: Actions.FRESH_START, payload: { date: '2026-02-01' } }, { now: at('2026-01-15') }), { code: 'TIMELINE' });
  assert.throws(() => timelineReducer(start(), { type: Actions.FRESH_START, payload: { date: '2025-12-31' } }, { now: at('2026-01-15') }), { code: 'TIMELINE' });
});

test('deleting a mistaken slip merges the phases back; no other entry is touched', () => {
  const { data, effects } = run(start(), [
    [{ type: Actions.LOG_NOTE, payload: { note: 'marad' } }, '2026-01-03'],
    [{ type: Actions.FRESH_START, payload: {} }, '2026-01-05'],
  ]);
  const note = data.events[0];
  const r = timelineReducer(data, { type: Actions.DELETE_ENTRY, payload: { id: effects[1].event.id } }, { now: at('2026-01-10') });
  assert.equal(r.effects.phasesMerged, true);
  assert.equal(r.data.events[0], note);
  assert.equal(computeStats(r.data, '2026-01-10').currentPhaseDays, 9);
  assert.throws(() => timelineReducer(r.data, { type: Actions.DELETE_ENTRY, payload: { id: 'nincs-ilyen' } }), { code: 'TIMELINE' });
});

test('entries are grouped into the phase they belong to (slip day → closing phase)', () => {
  const { data } = run(start(), [
    [{ type: Actions.LOG_CHECKIN, payload: { mood: 'calm' } }, '2026-01-03'],
    [{ type: Actions.LOG_NOTE, payload: { note: 'nehéz nap' } }, '2026-01-05'],
    [{ type: Actions.FRESH_START, payload: {} }, '2026-01-05'],
    [{ type: Actions.LOG_TRIGGER, payload: { intensity: 2, outcome: 'coped' } }, '2026-01-07'],
  ]);
  const [p1, p2] = phaseSummaries(data, '2026-01-08');
  assert.deepEqual(p1.entries.map((e) => e.type), ['slip', 'note', 'checkin']);
  assert.deepEqual(p2.entries.map((e) => e.type), ['trigger']);
  assert.deepEqual([p1.checkins, p2.coped], [1, 1]);
});

// --- Properties over many random journeys ----------------------------------------------

function prng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

test('property: for 300 random journeys the accounting is exact and history is preserved', () => {
  const rand = prng(20261029);
  for (let n = 0; n < 300; n++) {
    let data = start();
    const horizon = 5 + Math.floor(rand() * 120);
    const today = addDays('2026-01-01', horizon);
    const slipDays = new Set();
    for (let k = Math.floor(rand() * 8); k > 0; k--) {
      const date = addDays('2026-01-01', Math.floor(rand() * (horizon + 1)));
      const prevEvents = data.events;
      const prevTotal = computeStats(data, today).totalSoberDays;
      const { data: next, effects } = timelineReducer(data, { type: Actions.FRESH_START, payload: { date } }, { now: at(today) });
      // 1. Nothing earlier is mutated.
      for (const e of prevEvents) assert.ok(next.events.includes(e));
      // 2. A slip removes at most its own day from the total, and only if that day had counted.
      const lost = date < today && !slipDays.has(date) ? 1 : 0;
      assert.equal(effects.totalAfter, prevTotal - lost, `seed run ${n}: slip ${date}, today ${today}`);
      slipDays.add(date);
      data = next;
    }
    // 3. Phases + slip days account for every day of the journey, exactly once.
    const phases = derivePhases(data, today);
    const pastSlips = [...slipDays].filter((d) => d < today).length;
    assert.equal(phases.reduce((a, p) => a + p.days, 0) + pastSlips, diffDays('2026-01-01', today), `run ${n}`);
    // 4. Phases are contiguous and ordered; exactly one current phase.
    for (let i = 1; i < phases.length; i++) assert.equal(phases[i].start, addDays(phases[i - 1].end, 1));
    assert.equal(phases.filter((p) => p.current).length, 1);
    // 5. Closed phases do not change later.
    assert.deepEqual(derivePhases(data, addDays(today, 365)).slice(0, -1), phases.slice(0, -1));
  }
});

// --- Store: integration with the encrypted vault --------------------------------------------

test('store: dispatch persists encrypted; a new session sees identical phases', async () => {
  const { store, backend } = makeStore();
  await store.create('2581', initial());
  const tl = createTimelineStore(store, { now: () => at('2026-01-21') });
  const seen = [];
  tl.subscribe((s) => seen.push(s.stats.totalSoberDays));
  await tl.dispatch({ type: Actions.LOG_CHECKIN, payload: { mood: 'tired', note: 'TITKOS_REFLEXIO' } });
  const fx = await tl.dispatch({ type: Actions.FRESH_START, payload: { lesson: 'TITKOS_TANULSAG', intention: 'Holnap sétálok.' } });
  assert.equal(fx.closedPhase.days, 20);
  assert.deepEqual(seen, [20, 20]);

  const dump = JSON.stringify([...backend.map]);
  for (const secret of ['TITKOS_REFLEXIO', 'TITKOS_TANULSAG', 'Holnap', 'tired', 'slip']) assert.ok(!dump.includes(secret), secret);

  store.lock();
  await store.unlock('2581');
  const again = createTimelineStore(store, { now: () => at('2026-01-21') }).getSnapshot();
  assert.deepEqual(again.phases.map((p) => [p.start, p.end, p.days]), tl.getSnapshot().phases.map((p) => [p.start, p.end, p.days]));
  assert.equal(again.phases[1].intentions[0], 'Holnap sétálok.');
});

test('store: works on the localStorage backend too', async () => {
  const ls = new FakeStorage();
  const store = new VaultStore(new LocalStorageBackend(ls), { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await store.create('2581', initial());
  const tl = createTimelineStore(store, { now: () => at('2026-01-21') });
  await tl.dispatch({ type: Actions.FRESH_START, payload: { lesson: 'LS_LECKE' } });
  assert.ok(!ls.dump().includes('LS_LECKE'));
  assert.equal(tl.getSnapshot().stats.phaseCount, 2);
});

test('store: failed encrypted save leaves the snapshot and subscribers untouched', async () => {
  const { store } = makeStore();
  await store.create('2581', initial());
  const tl = createTimelineStore(store, { now: () => at('2026-01-21') });
  const before = tl.getSnapshot();
  let notified = 0;
  tl.subscribe(() => notified++);
  store.save = async () => { throw Object.assign(new Error('quota'), { code: 'QUOTA' }); };
  await assert.rejects(tl.dispatch({ type: Actions.FRESH_START, payload: {} }), { code: 'QUOTA' });
  assert.equal(tl.getSnapshot(), before);
  assert.equal(notified, 0);
});

test('store: rapid dispatches are serialized and none is lost', async () => {
  const { store } = makeStore();
  await store.create('2581', initial());
  const tl = createTimelineStore(store, { now: () => at('2026-01-21') });
  await Promise.all(Array.from({ length: 5 }, (_, i) => tl.dispatch({ type: Actions.LOG_NOTE, payload: { note: `jegyzet ${i}` } })));
  assert.deepEqual(tl.getSnapshot().data.events.map((e) => e.note), ['jegyzet 0', 'jegyzet 1', 'jegyzet 2', 'jegyzet 3', 'jegyzet 4']);
});

test('store: locked vault rejects dispatches (no writes without the key)', async () => {
  const { store } = makeStore();
  await store.create('2581', initial());
  const tl = createTimelineStore(store);
  store.lock();
  await assert.rejects(tl.dispatch({ type: Actions.LOG_NOTE, payload: { note: 'x' } }));
});
