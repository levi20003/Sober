import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initial, makeStore } from './helpers.js';
import {
  formatHuf, parseHufInput, costOn, savingsBetween, updateCostHistory, computeSavings, milestoneProgress, goalProgress,
} from '../src/domain/savings.js';
import { timelineReducer, Actions, deepFreeze } from '../src/domain/timelineReducer.js';
import { derivePhases } from '../src/domain/timeline.js';
import { validateData, migrate, SCHEMA_VERSION } from '../src/domain/schema.js';
import { addDays } from '../src/domain/dates.js';
import { parseJsonImport } from '../src/domain/export.js';
import { SAVINGS_MILESTONES } from '../src/content/hu.js';
import { QUICK_TEMPLATES, quickLogAction } from '../src/domain/presets.js';
import { createTimelineStore } from '../src/state/timelineStore.js';
import { MemoryBackend } from '../src/storage/backends.js';
import { VaultStore } from '../src/storage/store.js';
import { createKeySlot, encryptPayload, generateDek, VAULT_FORMAT } from '../src/crypto/vault.js';

const at = (date) => new Date(`${date}T12:00:00`);
const reduce = (data, action, date) => timelineReducer(data, action, { now: at(date) }).data;
const savingsOn = (data, today) => computeSavings(data, derivePhases(data, today), today, SAVINGS_MILESTONES);

/** Obviously-correct oracle: value every sober day one by one. */
function bruteForce(data, today) {
  let total = 0;
  for (const p of derivePhases(data, today)) {
    for (let d = p.start; d < (p.end ?? today); d = addDays(d, 1)) total += costOn(data.settings.costHistory, d);
  }
  return total;
}

// --- Formatting & input ------------------------------------------------------------

test('HUF formatting follows Hungarian typography (groups only from 5 digits) and "Ft"', () => {
  assert.equal(formatHuf(0), '0 Ft');
  assert.equal(formatHuf(2500), '2500 Ft', 'CLDR hu: 4-digit numbers are not grouped');
  assert.equal(formatHuf(12500), '12 500 Ft');
  assert.equal(formatHuf(1234567), '1 234 567 Ft');
  assert.equal(formatHuf(999.6), '1000 Ft', 'rounded to whole forints');
});

test('HUF input parsing accepts what people actually type', () => {
  const cases = { '': 0, '2500': 2500, '2 500': 2500, '2 500 Ft': 2500, '2500Ft': 2500, '2.500': 2500, '1.250.000': NaN, '1 000 000': 1_000_000, '2,5': 3, '0': 0 };
  for (const [input, want] of Object.entries(cases)) {
    const got = parseHufInput(input);
    if (Number.isNaN(want)) assert.ok(Number.isNaN(got), input); else assert.equal(got, want, input);
  }
  for (const bad of ['-3', 'abc', '1e3', '1 000 001', '12,5,3']) assert.ok(Number.isNaN(parseHufInput(bad)), bad);
  assert.equal(parseHufInput('1.250.000', 100_000_000), 1_250_000, 'goal amounts allow a larger max');
});

// --- Core math ---------------------------------------------------------------------------

test('costOn: entry in effect on a day; days before the first entry use the first', () => {
  const h = [{ from: '2026-01-01', dailyCostHuf: 2000 }, { from: '2026-07-01', dailyCostHuf: 3000 }];
  assert.equal(costOn(h, '2025-12-31'), 2000);
  assert.equal(costOn(h, '2026-06-30'), 2000);
  assert.equal(costOn(h, '2026-07-01'), 3000);
  assert.equal(costOn(h, '2030-01-01'), 3000);
});

test('savingsBetween: exact across segments, months and leap days', () => {
  const h = [{ from: '2024-01-01', dailyCostHuf: 1000 }, { from: '2024-03-01', dailyCostHuf: 1500 }];
  assert.equal(savingsBetween(h, '2024-02-28', '2024-03-02'), 1000 + 1000 + 1500); // 28, 29 (leap), Mar 1
  assert.equal(savingsBetween(h, '2024-01-01', '2025-01-01'), 60 * 1000 + 306 * 1500);
  assert.equal(savingsBetween(h, '2024-05-01', '2024-05-01'), 0);
  assert.equal(savingsBetween(h, '2024-05-02', '2024-05-01'), 0);
});

test('REGRESSION: raising the cost "from today" never re-values days already lived', () => {
  let d = deepFreeze(initial({ dailyCostHuf: 2000 })); // journey from 2026-01-01
  assert.equal(savingsOn(d, '2026-07-01').total, 181 * 2000); // 362 000 Ft
  d = reduce(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000 } }, '2026-07-01');
  assert.equal(savingsOn(d, '2026-07-01').total, 362_000, 'no invented money');
  assert.equal(savingsOn(d, '2026-07-11').total, 362_000 + 10 * 3000);
  assert.equal(savingsOn(d, '2026-07-11').daily, 3000);
  assert.equal(savingsOn(d, '2026-07-11').changedOverTime, true);
});

test('"correct all" re-values the whole period on purpose', () => {
  const d = reduce(initial({ dailyCostHuf: 2000 }), { type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000, mode: 'all' } }, '2026-07-01');
  assert.deepEqual(d.settings.costHistory, [{ from: '2026-01-01', dailyCostHuf: 3000 }]);
  assert.equal(savingsOn(d, '2026-07-01').total, 181 * 3000);
});

test('lowering the cost never erases money already saved', () => {
  const d = reduce(initial({ dailyCostHuf: 3000 }), { type: Actions.SET_DAILY_COST, payload: { amountHuf: 1000 } }, '2026-02-01');
  assert.equal(savingsOn(d, '2026-02-01').total, 31 * 3000);
  assert.equal(savingsOn(d, '2026-02-11').total, 31 * 3000 + 10 * 1000);
});

test('setting the cost to 0 stops accrual from that day but keeps the past', () => {
  const d = reduce(initial({ dailyCostHuf: 2500 }), { type: Actions.SET_DAILY_COST, payload: { amountHuf: 0 } }, '2026-01-11');
  const s = savingsOn(d, '2026-03-01');
  assert.equal(s.total, 10 * 2500);
  assert.equal(s.configured, true, 'history shows money was saved');
  assert.equal(s.perMonth, 0);
});

test('cost from a past date: earlier days keep, later entries are replaced, history stays minimal', () => {
  let h = [{ from: '2026-01-01', dailyCostHuf: 2000 }];
  h = updateCostHistory(h, { amountHuf: 2500, from: '2026-03-01' });
  h = updateCostHistory(h, { amountHuf: 3000, from: '2026-05-01' });
  h = updateCostHistory(h, { amountHuf: 2800, from: '2026-04-01' }); // replaces the May entry
  assert.deepEqual(h.map((e) => [e.from, e.dailyCostHuf]), [['2026-01-01', 2000], ['2026-03-01', 2500], ['2026-04-01', 2800]]);
  h = updateCostHistory(h, { amountHuf: 2500, from: '2026-04-01' }); // same as the cost in effect → compacted away
  assert.deepEqual(h.map((e) => e.from), ['2026-01-01', '2026-03-01']);
  assert.throws(() => updateCostHistory(h, { amountHuf: 2000 }), TypeError);
});

test('reducer guards: no future cost changes, invalid amounts rejected, events untouched', () => {
  const d = deepFreeze(reduce(initial(), { type: Actions.LOG_NOTE, payload: { note: 'marad' } }, '2026-01-05'));
  assert.throws(() => timelineReducer(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000, from: '2026-02-01' } }, { now: at('2026-01-10') }), { code: 'TIMELINE' });
  for (const amountHuf of [-1, 1.5, 1_000_001, '3000']) {
    assert.throws(() => timelineReducer(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf } }, { now: at('2026-01-10') }), { name: 'SchemaError' }, String(amountHuf));
  }
  const next = reduce(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000 } }, '2026-01-10');
  assert.equal(next.events[0], d.events[0], 'cost change does not touch the journal');
});

// --- Interaction with phases and slips ------------------------------------------------------

test('slip days are not valued; per-phase amounts add up to the total', () => {
  let d = initial({ dailyCostHuf: 2000 });
  d = reduce(d, { type: Actions.FRESH_START, payload: {} }, '2026-01-11');            // phase 1: 10 days
  d = reduce(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000 } }, '2026-01-20');
  const s = savingsOn(d, '2026-01-31');                                                // phase 2: Jan 12–30
  assert.deepEqual(s.perPhase, [10 * 2000, 8 * 2000 + 11 * 3000]);
  assert.equal(s.total, s.perPhase[0] + s.perPhase[1]);
  assert.equal(s.currentPhase, s.perPhase[1]);
});

test('a late-logged slip removes exactly that day\'s cost (at that day\'s price)', () => {
  let d = initial({ dailyCostHuf: 2000 });
  d = reduce(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 5000 } }, '2026-01-20');
  const before = savingsOn(d, '2026-01-25').total;
  const after = savingsOn(reduce(d, { type: Actions.FRESH_START, payload: { date: '2026-01-10' } }, '2026-01-25'), '2026-01-25').total;
  assert.equal(before - after, 2000, 'Jan 10 was a 2000 Ft day');
});

test('moving the journey start earlier values the new days at the first known cost', () => {
  const d = validateData({ ...initial({ dailyCostHuf: 2000 }), profile: { journeyStart: '2025-12-22' } });
  assert.equal(savingsOn(d, '2026-01-01').total, 10 * 2000);
});

test('property: interval math equals the day-by-day oracle for 300 random histories', () => {
  let seed = 4242;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let n = 0; n < 300; n++) {
    let d = initial({ dailyCostHuf: Math.floor(rand() * 10_000) });
    const horizon = 1 + Math.floor(rand() * 400);
    const today = addDays('2026-01-01', horizon);
    for (let k = Math.floor(rand() * 10); k > 0; k--) {
      const day = addDays('2026-01-01', Math.floor(rand() * (horizon + 1)));
      d = rand() < 0.5
        ? reduce(d, { type: Actions.FRESH_START, payload: { date: day } }, today)
        : reduce(d, { type: Actions.SET_DAILY_COST, payload: { amountHuf: Math.floor(rand() * 10_000), mode: rand() < 0.1 ? 'all' : 'from', from: day } }, today);
    }
    const s = savingsOn(d, today);
    assert.equal(s.total, bruteForce(d, today), `run ${n}`);
    assert.equal(s.perPhase.reduce((a, b) => a + b, 0), s.total);
    assert.ok(Number.isSafeInteger(s.total));
  }
});

// --- Milestones and goal ---------------------------------------------------------------------

test('milestone content is ascending, unique and alcohol-free', () => {
  for (let i = 1; i < SAVINGS_MILESTONES.length; i++) assert.ok(SAVINGS_MILESTONES[i].amountHuf > SAVINGS_MILESTONES[i - 1].amountHuf);
  assert.equal(new Set(SAVINGS_MILESTONES.map((m) => m.id)).size, SAVINGS_MILESTONES.length);
  const text = SAVINGS_MILESTONES.map((m) => m.label).join(' ').toLowerCase();
  for (const w of ['bor', 'sör', 'pálinka', 'ital', 'kocsma', 'üveg', 'pohár']) assert.ok(!new RegExp(`\\b${w}`).test(text), w);
});

test('milestone progress: achieved, next, remaining, progress within the step', () => {
  const m = [{ id: 'a', label: 'A', amountHuf: 1000 }, { id: 'b', label: 'B', amountHuf: 5000 }];
  assert.deepEqual(milestoneProgress(0, m), { achieved: [], next: m[0], remaining: 1000, progress: 0 });
  const mid = milestoneProgress(3000, m);
  assert.deepEqual([mid.achieved.map((x) => x.id), mid.next.id, mid.remaining, mid.progress], [['a'], 'b', 2000, 0.5]);
  assert.deepEqual(milestoneProgress(5000, m), { achieved: m, next: null, remaining: 0, progress: 1 });
});

test('personal goal: set, progress, reached, cleared; invalid goals rejected', () => {
  let d = initial({ dailyCostHuf: 1000 });
  d = reduce(d, { type: Actions.SET_SAVINGS_GOAL, payload: { goal: { label: 'Új bicikli', amountHuf: 20_000 } } }, '2026-01-11');
  const g = savingsOn(d, '2026-01-11').goal;
  assert.deepEqual([g.label, g.remaining, g.progress, g.reached], ['Új bicikli', 10_000, 0.5, false]);
  assert.equal(savingsOn(d, '2026-01-21').goal.reached, true);
  assert.equal(savingsOn(d, '2026-03-01').goal.progress, 1, 'capped at 100 %');
  d = reduce(d, { type: Actions.SET_SAVINGS_GOAL, payload: { goal: null } }, '2026-01-21');
  assert.equal(savingsOn(d, '2026-01-21').goal, null);
  for (const goal of [{ label: '', amountHuf: 100 }, { label: 'x', amountHuf: 0 }, { label: 'x'.repeat(61), amountHuf: 100 }]) {
    assert.throws(() => reduce(d, { type: Actions.SET_SAVINGS_GOAL, payload: { goal } }, '2026-01-21'), { name: 'SchemaError' });
  }
});

// --- Migration v1 → v2 ---------------------------------------------------------------------------

const V1 = {
  schemaVersion: 1,
  profile: { journeyStart: '2026-01-01' },
  settings: { dailyCostHuf: 2500, autoLockMinutes: 7 },
  events: [{ id: 'slip0001', type: 'slip', date: '2026-01-11', at: '2026-01-11T20:00:00.000Z', lesson: 'régi tanulság' }],
};

test('migration v1 → v2 keeps every savings figure and all settings', () => {
  const d = validateData(V1);
  assert.equal(d.schemaVersion, SCHEMA_VERSION);
  assert.deepEqual(d.settings, { costHistory: [{ from: '2026-01-01', dailyCostHuf: 2500 }], autoLockMinutes: 7 });
  const s = savingsOn(d, '2026-02-01');
  assert.equal(s.total, (10 + 20) * 2500); // same as v1: totalSoberDays × dailyCost
  assert.equal(d.events[0].lesson, 'régi tanulság');
  assert.equal(migrate(migrate(V1)).schemaVersion, SCHEMA_VERSION, 'idempotent');
  assert.throws(() => validateData({ ...V1, settings: { dailyCostHuf: -1 } }), { name: 'SchemaError' });
  assert.throws(() => validateData({ ...V1, schemaVersion: 0 }), /Ismeretlen adatverzió/);
});

test('an existing encrypted v1 vault unlocks, migrates and re-saves as v2', async () => {
  const backend = new MemoryBackend();
  const dek = await generateDek();
  await backend.putMany({ vault: { format: VAULT_FORMAT, revision: 7, slots: { pin: await createKeySlot(dek, '2581', 1000) }, payload: await encryptPayload(dek, V1) } });
  const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await store.unlock('2581');
  assert.equal(store.data.schemaVersion, 2);
  const tl = createTimelineStore(store, { now: () => at('2026-02-01') });
  assert.equal(tl.getSnapshot().savings.total, 30 * 2500);
  await tl.dispatch({ type: Actions.SET_DAILY_COST, payload: { amountHuf: 3000 } });
  store.lock();
  await store.unlock('2581');
  assert.equal(store.data.settings.costHistory.length, 2);
});

test('a v1 plain JSON export still imports', () => {
  const d = parseJsonImport(JSON.stringify({ app: 'jozansag-szamlalo', kind: 'plain-export', data: V1 }));
  assert.equal(d.settings.costHistory[0].dailyCostHuf, 2500);
});

test('cost history and goal are encrypted at rest', async () => {
  const { store, backend } = makeStore();
  await store.create('2581', initial({ dailyCostHuf: 4321 }));
  const tl = createTimelineStore(store, { now: () => at('2026-02-01') });
  await tl.dispatch({ type: Actions.SET_DAILY_COST, payload: { amountHuf: 8765 } });
  await tl.dispatch({ type: Actions.SET_SAVINGS_GOAL, payload: { goal: { label: 'TITKOS_CEL', amountHuf: 55555 } } });
  const dump = JSON.stringify([...backend.map]);
  for (const s of ['4321', '8765', 'TITKOS_CEL', '55555', 'costHistory', 'savingsGoal']) assert.ok(!dump.includes(s), s);
});

// --- Quick-log templates -------------------------------------------------------------------------

test('every quick template produces a valid event without inventing details', () => {
  const ids = new Set();
  for (const t of QUICK_TEMPLATES) {
    ids.add(t.id);
    const d = reduce(initial(), quickLogAction(t), '2026-01-05');
    const e = d.events[0];
    assert.equal(e.type, t.kind === 'mood' ? 'checkin' : 'trigger', t.id);
    assert.equal(e.intensity, undefined, `${t.id}: no default intensity`);
    assert.equal(e.note, undefined);
    if (t.kind === 'trigger') assert.deepEqual(e.triggers, t.triggers);
    else assert.equal(e.mood, t.mood);
  }
  assert.equal(ids.size, QUICK_TEMPLATES.length);
  const labels = QUICK_TEMPLATES.map((t) => t.label);
  for (const want of ['Fáradtság / Kimerültség', 'Stresszes nap', 'Társasági nyomás', 'Esti szokás', 'Nyugodt / Kiegyensúlyozott']) assert.ok(labels.includes(want), want);
});

test('quick log optional details: intensity and encrypted note only when given', () => {
  const stress = QUICK_TEMPLATES.find((t) => t.id === 'q-stress');
  const calm = QUICK_TEMPLATES.find((t) => t.id === 'q-calm');
  const e1 = reduce(initial(), quickLogAction(stress, { intensity: '4', note: '  Hosszú meeting.  ' }), '2026-01-05').events[0];
  assert.deepEqual([e1.intensity, e1.note], [4, 'Hosszú meeting.']);
  const e2 = reduce(initial(), quickLogAction(calm, { intensity: 5, note: '' }), '2026-01-05').events[0];
  assert.deepEqual([e2.intensity, e2.note], [undefined, undefined], 'moods have no intensity; empty note dropped');
  assert.throws(() => reduce(initial(), quickLogAction(stress, { intensity: 9 }), '2026-01-05'), { name: 'SchemaError' });
});
