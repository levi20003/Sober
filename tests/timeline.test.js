import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initial } from './helpers.js';
import { addEvent, computeStats, derivePhases, makeEvent, removeEvent } from '../src/domain/timeline.js';
import { validateData } from '../src/domain/schema.js';
import { diffDays, addDays, isValidDateKey } from '../src/domain/dates.js';

const at = (d) => new Date(`${d}T12:00:00`);
const ev = (type, date, extra = {}) => makeEvent(type, { date, ...extra }, at(date));

test('date helpers handle month/year/leap boundaries', () => {
  assert.equal(diffDays('2026-01-01', '2026-01-31'), 30);
  assert.equal(diffDays('2024-02-28', '2024-03-01'), 2);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(diffDays('2026-03-28', '2026-03-30'), 2); // EU DST switch weekend
  assert.equal(isValidDateKey('2026-02-30'), false);
});

test('no slips: one phase, days count completed days', () => {
  const s = computeStats(initial(), '2026-01-11');
  assert.equal(s.currentPhaseDays, 10);
  assert.equal(s.totalSoberDays, 10);
  assert.equal(s.phaseCount, 1);
});

test('a slip opens a new phase but never erases history', () => {
  let d = initial(); // journey starts 2026-01-01
  d = addEvent(d, ev('slip', '2026-01-21', { lesson: 'Péntek esténként előre tervezek.' }));
  const s = computeStats(validateData(d), '2026-01-31');
  // phase 1: Jan 1..20 (20 days), slip day Jan 21 not counted, phase 2: Jan 22..30 (9 days)
  assert.equal(s.phaseCount, 2);
  assert.equal(s.currentPhaseDays, 9);
  assert.equal(s.longestPhaseDays, 20);
  assert.equal(s.totalSoberDays, 29);
  assert.equal(s.lessons[0].lesson, 'Péntek esténként előre tervezek.');
});

test('on the day of a slip the current phase shows 0 and total is preserved', () => {
  const d = validateData(addEvent(initial(), ev('slip', '2026-01-21')));
  const s = computeStats(d, '2026-01-21');
  assert.equal(s.currentPhaseDays, 0);
  assert.equal(s.totalSoberDays, 20);
});

test('a same-day slip removes nothing already counted (late-logged slips: see timelineReducer.test.js)', () => {
  const before = computeStats(initial(), '2026-02-01').totalSoberDays;
  const after = computeStats(validateData(addEvent(initial(), ev('slip', '2026-02-01'))), '2026-02-01').totalSoberDays;
  assert.equal(after, before);
});

test('multiple slips on one day open only one new phase; consecutive days are handled', () => {
  let d = initial();
  d = addEvent(d, ev('slip', '2026-01-05'));
  d = addEvent(d, ev('slip', '2026-01-05'));
  d = addEvent(d, ev('slip', '2026-01-06'));
  const phases = derivePhases(validateData(d), '2026-01-10');
  assert.deepEqual(phases.map((p) => p.days), [4, 0, 3]);
  assert.equal(computeStats(validateData(d), '2026-01-10').totalSoberDays, 7);
});

test('removing a mistaken slip restores the merged phase', () => {
  const slip = ev('slip', '2026-01-05');
  const d = validateData(removeEvent(addEvent(initial(), slip), slip.id));
  assert.equal(computeStats(d, '2026-01-10').currentPhaseDays, 9);
});

test('slip before journey start is rejected', () => {
  assert.throws(() => validateData(addEvent(initial(), ev('slip', '2025-12-31'))), { name: 'SchemaError' });
});

test('future-dated slips do not affect today', () => {
  const d = validateData(addEvent(initial(), ev('slip', '2026-03-01')));
  assert.equal(computeStats(d, '2026-01-11').currentPhaseDays, 10);
});

test('coping and sleep metrics', () => {
  let d = initial();
  d = addEvent(d, ev('trigger', '2026-01-03', { triggers: ['stress'], intensity: 4, coping: ['walk'], outcome: 'coped' }));
  d = addEvent(d, ev('trigger', '2026-01-04', { triggers: ['social'], intensity: 3, outcome: 'ongoing' }));
  for (let i = 1; i <= 14; i++) {
    const date = addDays('2026-01-01', i);
    d = addEvent(d, ev('checkin', date, { sleep: i <= 7 ? 2 : 4 }));
  }
  const s = computeStats(validateData(d), '2026-01-15');
  assert.equal(s.copedCount, 1);
  assert.equal(s.sleep.recent, 4);
  assert.equal(s.sleep.previous, 2);
  assert.equal(s.sleep.delta, 2);
  assert.equal(s.checkedInToday, true);
});

test('schema rejects unknown presets and out-of-range values', () => {
  assert.throws(() => makeEvent('trigger', { date: '2026-01-02', triggers: ['nope'], intensity: 3 }));
  assert.throws(() => makeEvent('trigger', { date: '2026-01-02', intensity: 9 }));
  assert.throws(() => makeEvent('checkin', { date: '2026-01-02', sleep: 0 }));
  assert.throws(() => makeEvent('note', { date: '2026-01-02', note: '   ' }));
});
