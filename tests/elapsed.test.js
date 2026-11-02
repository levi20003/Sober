// Élő számláló: naptár szerinti bontás (év, hó, hét, nap, óra, perc, mp) és a mai nap haladása.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { elapsedParts, dayProgress, phaseStartInstant } from '../src/domain/elapsed.js';

const d = (s) => new Date(s);

test('breakdown is calendar-aware: years, months, then weeks, days, hours, minutes, seconds', () => {
  const p = elapsedParts(d('2026-01-01T00:00:00'), d('2027-03-15T10:20:30'));
  assert.deepEqual([p.years, p.months, p.weeks, p.days, p.hours, p.minutes, p.seconds], [1, 2, 2, 0, 10, 20, 30]);
  assert.equal(p.totalDays, 438);
});

test('month ends are clamped (Jan 31 + 1 month = end of February)', () => {
  const p = elapsedParts(d('2026-01-31T00:00:00'), d('2026-03-01T00:00:00'));
  assert.deepEqual([p.years, p.months, p.weeks, p.days], [0, 1, 0, 1]);
});

test('start of today: only hours/minutes/seconds; before the start: null', () => {
  const p = elapsedParts(d('2026-11-02T09:00:00'), d('2026-11-02T09:26:05'));
  assert.deepEqual([p.years, p.months, p.weeks, p.days, p.hours, p.minutes, p.seconds], [0, 0, 0, 0, 0, 26, 5]);
  assert.equal(elapsedParts(d('2026-11-03T00:00:00'), d('2026-11-02T23:00:00')), null);
});

test('progress bars fill towards the next unit', () => {
  const p = elapsedParts(d('2026-11-01T00:00:00'), d('2026-11-02T12:00:30'));
  assert.equal(p.progress.seconds, 30 / 60);
  assert.ok(Math.abs(p.progress.hours - (12 + 30 / 3600) / 24) < 1e-9);
  assert.ok(Math.abs(p.progress.weeks - (1 + (12 * 3600 + 30) / 86400) / 7) < 1e-9);
});

test('the day ring fills from midnight to midnight, then starts again', () => {
  assert.equal(dayProgress(d('2026-11-02T00:00:00')), 0);
  assert.equal(dayProgress(d('2026-11-02T12:00:00')), 0.5);
  assert.ok(dayProgress(d('2026-11-02T23:59:59')) > 0.999);
  assert.equal(dayProgress(d('2026-11-03T00:00:00')), 0);
});

test('phase start: midnight of the start date, or the exact moment it was set up "today"', () => {
  assert.equal(phaseStartInstant('2026-11-02', null).getTime(), d('2026-11-02T00:00:00').getTime());
  assert.equal(phaseStartInstant('2026-11-02', '2026-11-02T08:24:00.000Z').toISOString(), '2026-11-02T08:24:00.000Z');
  assert.equal(phaseStartInstant('2026-11-05', '2026-11-02T08:24:00.000Z').getTime(), d('2026-11-05T00:00:00').getTime(), 'a later phase starts at its own midnight');
});

test('profile keeps the exact start time only when it falls on the start date', async () => {
  const { validateProfile } = await import('../src/domain/schema.js');
  const at = new Date(2026, 10, 2, 9, 24).toISOString();
  assert.equal(validateProfile({ journeyStart: '2026-11-02', journeyStartAt: at }).journeyStartAt, at);
  assert.equal(validateProfile({ journeyStart: '2026-10-20', journeyStartAt: at }).journeyStartAt, undefined, 'start date changed later → dropped');
  assert.equal(validateProfile({ journeyStart: '2026-11-02', journeyStartAt: 'nem dátum' }).journeyStartAt, undefined);
});
