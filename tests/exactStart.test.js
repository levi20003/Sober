// Pontos kezdés (2026-11): a számláló stopperként fut a kezdés percétől; a napok száma 24 óránként nő, nem éjfélkor.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { computeStats, derivePhases, exactStartDays } from '../src/domain/timeline.js';
import { createInitialData } from '../src/domain/schema.js';
import { startInstant, draftToProfile } from '../src/components/onboarding/Onboarding.jsx';
import { createTimelineStore } from '../src/state/timelineStore.js';

const local = (y, m, d, hh = 0, mm = 0) => new Date(y, m - 1, d, hh, mm);
const data = (at) => createInitialData({ journeyStart: '2026-11-04', journeyStartAt: at.toISOString() });

test('started 9:31: still 0 days after midnight, 1 day exactly at 9:31 the next morning', () => {
  const d = data(local(2026, 11, 4, 9, 31));
  assert.equal(exactStartDays(d, local(2026, 11, 4, 23, 59)), 0);
  assert.equal(exactStartDays(d, local(2026, 11, 5, 0, 1)), 0, 'midnight does not add a day');
  assert.equal(exactStartDays(d, local(2026, 11, 5, 9, 30)), 0);
  assert.equal(exactStartDays(d, local(2026, 11, 5, 9, 31)), 1);
  assert.equal(computeStats(d, '2026-11-05', local(2026, 11, 5, 8, 0)).totalSoberDays, 0);
  assert.equal(computeStats(d, '2026-11-05', local(2026, 11, 5, 10, 0)).totalSoberDays, 1);
  assert.equal(computeStats(d, '2026-11-05').totalSoberDays, 1, 'without "now" the calendar rule is unchanged');
});

test('without an exact time, or after a slip, the calendar rule stays', () => {
  const d = createInitialData({ journeyStart: '2026-11-01' });
  assert.equal(exactStartDays(d, local(2026, 11, 4, 8)), null);
  assert.equal(computeStats(d, '2026-11-04', local(2026, 11, 4, 8)).totalSoberDays, 3);
  const withSlip = { ...data(local(2026, 11, 1, 20)), journeyStart: '2026-11-01', events: [{ id: 'evt-slip01', type: 'slip', date: '2026-11-02', at: '2026-11-02T10:00:00Z' }] };
  assert.equal(derivePhases(withSlip, '2026-11-04', local(2026, 11, 4, 8)).length, 2);
});

test('the snapshot refreshes when another full 24 hours has passed, not only at midnight', () => {
  let now = local(2026, 11, 5, 9, 0);
  const vault = { isUnlocked: true, data: data(local(2026, 11, 4, 9, 31)) };
  const tl = createTimelineStore(vault, { now: () => now });
  assert.equal(tl.getSnapshot().stats.totalSoberDays, 0);
  now = local(2026, 11, 5, 9, 32);
  assert.equal(tl.getSnapshot().stats.totalSoberDays, 1);
});

test('start date + time is set to the minute (onboarding "earlier" and Settings share the parser)', () => {
  assert.deepEqual(startInstant('2026-10-20', '21:45'), local(2026, 10, 20, 21, 45));
  assert.equal(startInstant('2026-10-20', ''), null);
  assert.equal(startInstant('2026-10-20', '25:00'), null);
  const p = draftToProfile({ nickname: '', substances: [], otherSubstance: '', startMode: 'earlier', startDate: '2026-10-20', startTime: '21:45' }, '2026-11-04');
  assert.equal(p.journeyStart, '2026-10-20');
  assert.equal(new Date(p.journeyStartAt).getTime(), local(2026, 10, 20, 21, 45).getTime());
  const q = draftToProfile({ nickname: '', substances: [], otherSubstance: '', startMode: 'earlier', startDate: '2026-10-20', startTime: '' }, '2026-11-04');
  assert.equal(q.journeyStartAt, undefined, 'no time: counted from the start of that day');
});
