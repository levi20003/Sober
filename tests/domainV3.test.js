import { test } from 'vitest';
import assert from 'node:assert/strict';
import { MOOD_FIGURES, figureOf, scoreCheckin, moodOnDay, weekDigest, weekMoods, energyStress, moodPatterns, valenceBetween } from '../src/domain/moods.js';
import { MILESTONE_DAYS, GOAL_OPTIONS, milestoneStatus, uncelebratedMilestone, goalProgress } from '../src/domain/milestones.js';
import { dayPart, formatDayHu } from '../src/domain/greeting.js';
import { hash, pickDaily, pickOne } from '../src/domain/daily.js';
import { challengesOfDay, challengeStats } from '../src/domain/challenges.js';
import { createCountdown, countdownStateAt, urgeLevel, formatClock, URGE_DURATION_MS } from '../src/domain/countdown.js';
import { soberDaysIn, timelineSeries, savingsByMonth } from '../src/domain/series.js';
import { funConversion } from '../src/domain/fun.js';
import { addMonths, startOfMonth, monthNameHu, addDays } from '../src/domain/dates.js';
import { derivePhases } from '../src/domain/timeline.js';
import { computeSavings } from '../src/domain/savings.js';
import { timelineReducer, Actions } from '../src/domain/timelineReducer.js';
import { initial } from './helpers.js';
import { MOODS } from '../src/domain/presets.js';

let n = 0;
const ev = (type, date, extra = {}) => ({ id: `ev${String(++n).padStart(8, '0')}`, type, date, at: `${date}T10:00:00.000Z`, ...extra });
const ci = (date, mood, intensity) => ev('checkin', date, { mood, ...(intensity ? { intensity } : {}) });

// --- Hangulatok --------------------------------------------------------------------------

test('every one of the 12 figures has a definition; legacy moods map onto a figure', () => {
  assert.deepEqual(MOOD_FIGURES.map((f) => f.id), MOODS.map((m) => m.id));
  for (const f of MOOD_FIGURES) {
    assert.ok(f.energy >= 0 && f.energy <= 100 && f.stress >= 0 && f.stress <= 100, f.id);
    assert.ok([-1, 0, 1].includes(f.valence));
  }
  assert.equal(figureOf('calm').id, 'cheerful');
  assert.equal(figureOf('anxious').id, 'stressed');
  assert.equal(figureOf('nincs'), null);
  assert.equal(figureOf(undefined), null);
});

test('scoreCheckin: intensity 3 keeps the base value, 5 raises and 1 lowers it, always within 0–100', () => {
  const base = scoreCheckin({ mood: 'stressed', intensity: 3 });
  assert.deepEqual([base.energy, base.stress], [60, 92]);
  assert.equal(scoreCheckin({ mood: 'stressed' }).stress, 92, 'no intensity = 3');
  assert.ok(scoreCheckin({ mood: 'stressed', intensity: 5 }).stress > 92 - 1);
  assert.equal(scoreCheckin({ mood: 'stressed', intensity: 5 }).stress, 100, 'clamped');
  assert.ok(scoreCheckin({ mood: 'stressed', intensity: 1 }).stress < 92);
  for (const f of MOOD_FIGURES) for (let i = 1; i <= 5; i++) {
    const s = scoreCheckin({ mood: f.id, intensity: i });
    assert.ok(s.energy >= 0 && s.energy <= 100 && s.stress >= 0 && s.stress <= 100);
  }
  assert.equal(scoreCheckin({ mood: 'nincs' }), null);
});

test('moodOnDay: the last check-in of the day counts (a later correction wins)', () => {
  const events = [ci('2026-03-02', 'angry'), ci('2026-03-02', 'cheerful')];
  assert.equal(moodOnDay(events, '2026-03-02').mood, 'cheerful');
  assert.equal(moodOnDay(events, '2026-03-03'), null);
});

test('weekDigest: Monday-first week, future days empty, today marked', () => {
  const today = '2026-10-29'; // csütörtök
  const events = [ci('2026-10-26', 'excited'), ci('2026-10-28', 'hurt'), ci('2026-10-29', 'grateful'), ci('2026-10-25', 'angry')];
  const w = weekDigest(events, today);
  assert.deepEqual(w.map((d) => d.label), ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']);
  assert.deepEqual(w.map((d) => d.date), ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
  assert.deepEqual(w.map((d) => d.figure), ['excited', null, 'hurt', 'grateful', null, null, null]);
  assert.deepEqual(w.map((d) => d.isToday), [false, false, false, true, false, false, false]);
  assert.deepEqual(w.map((d) => d.isFuture), [false, false, false, false, true, true, true]);
  assert.equal(weekDigest(events, '2026-11-01').at(-1).isToday, true, 'Sunday closes the week');
});

test('weekMoods: counts, fractions that add to 1, dominant mood, ties broken stably', () => {
  const t = '2026-10-29';
  const events = [ci('2026-10-23', 'cheerful'), ci('2026-10-24', 'cheerful'), ci('2026-10-27', 'stressed'), ci('2026-10-29', 'cheerful'), ci('2026-10-22', 'angry')];
  const w = weekMoods(events, t);
  assert.equal(w.total, 4, 'only the last 7 days (23rd–29th)');
  assert.equal(w.dominant, 'cheerful');
  assert.deepEqual(w.segments.map((s) => [s.mood, s.count]), [['cheerful', 3], ['stressed', 1]]);
  assert.ok(Math.abs(w.segments.reduce((a, s) => a + s.fraction, 0) - 1) < 1e-9);
  assert.deepEqual(weekMoods([], t), { total: 0, segments: [], dominant: null });
  const tie = weekMoods([ci('2026-10-28', 'hurt'), ci('2026-10-29', 'excited')], t);
  assert.deepEqual(tie.segments.map((s) => s.mood), ['excited', 'hurt'], 'ties follow the figure order');
});

test('energyStress: 7-day averages from the check-ins, a null day has no value', () => {
  const t = '2026-10-29';
  const events = [ci('2026-10-29', 'energetic', 3), ci('2026-10-28', 'stressed', 3), ci('2026-10-28', 'cheerful', 3)];
  const r = energyStress(events, t);
  assert.equal(r.series.length, 7);
  assert.equal(r.series.at(-1).energy, 92);
  assert.equal(r.series.at(-2).stress, Math.round((92 + 15) / 2));
  assert.equal(r.series[0].energy, null);
  assert.equal(r.hasData, true);
  assert.equal(r.energy, Math.round((92 + (60 + 70) / 2) / 2));
  const empty = energyStress([], t);
  assert.deepEqual([empty.energy, empty.stress, empty.hasData], [null, null, false]);
});

test('valenceBetween averages -1..1 over a range', () => {
  const events = [ci('2026-10-01', 'cheerful'), ci('2026-10-02', 'hurt'), ci('2026-10-03', 'bored')];
  assert.equal(valenceBetween(events, '2026-10-01', '2026-10-03'), 0);
  assert.equal(valenceBetween(events, '2026-11-01', '2026-11-03'), null);
});

test('moodPatterns: weekend stress is found only with enough data', () => {
  const today = '2026-10-29';
  const events = [];
  // 6 hétvégi nehéz, 6 hétköznapi könnyű hangulat a 90 napban
  const weekends = []; const weekdays = [];
  for (let i = 0; i < 80; i++) {
    const d = addDays(today, -i);
    const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
    ([0, 6].includes(dow) ? weekends : weekdays).push(d);
  }
  weekends.slice(0, 6).forEach((d) => events.push(ci(d, 'stressed')));
  weekdays.slice(0, 6).forEach((d) => events.push(ci(d, 'cheerful')));
  const p = moodPatterns(events, today);
  assert.equal(p[0].id, 'weekend-stress');
  assert.ok(p[0].rate > p[0].weekdayRate);
  assert.deepEqual(moodPatterns(events.slice(0, 5), today), [], 'too little data = no claim');
  const flipped = moodPatterns([...weekends.slice(0, 6).map((d) => ci(d, 'cheerful')), ...weekdays.slice(0, 6).map((d) => ci(d, 'stressed'))], today);
  assert.equal(flipped[0].id, 'weekday-stress');
  const even = moodPatterns([...weekends.slice(0, 6), ...weekdays.slice(0, 6)].map((d) => ci(d, 'stressed')), today);
  assert.ok(!even.some((x) => x.id.endsWith('-stress')), 'no weekend/weekday claim when both are equally hard');
});

// --- Mérföldkövek és cél ------------------------------------------------------------------

test('milestoneStatus: achieved badges, the next one, days remaining', () => {
  assert.deepEqual(MILESTONE_DAYS, [1, 3, 7, 14, 30, 90, 180, 365]);
  const s = milestoneStatus(10);
  assert.deepEqual(s.badges.filter((b) => b.achieved).map((b) => b.days), [1, 3, 7]);
  assert.deepEqual([s.latest, s.next, s.remaining], [7, 14, 4]);
  assert.ok(Math.abs(s.progressToNext - 3 / 7) < 1e-9);
  assert.deepEqual([milestoneStatus(0).latest, milestoneStatus(0).next, milestoneStatus(0).remaining], [null, 1, 1]);
  const all = milestoneStatus(400);
  assert.deepEqual([all.next, all.remaining, all.progressToNext], [null, 0, 1]);
});

test('uncelebratedMilestone: highest reached, never twice, never replayed', () => {
  assert.equal(uncelebratedMilestone(0, 0), null);
  assert.equal(uncelebratedMilestone(1, 0), 1);
  assert.equal(uncelebratedMilestone(8, 3), 7);
  assert.equal(uncelebratedMilestone(8, 7), null);
  assert.equal(uncelebratedMilestone(100, 0), 90, 'a long gap celebrates the highest only');
  assert.equal(uncelebratedMilestone(100, 90), null);
});

test('goalProgress: 12 / 30, reached state and a next-goal suggestion', () => {
  assert.equal(goalProgress(12, null), null);
  const g = goalProgress(12, 30);
  assert.deepEqual([g.shown, g.goal, g.remaining, g.reached, g.nextSuggestion], [12, 30, 18, false, null]);
  assert.equal(g.ratio, 0.4);
  const done = goalProgress(31, 30);
  assert.deepEqual([done.reached, done.shown, done.ratio, done.nextSuggestion], [true, 30, 1, 60]);
  assert.equal(goalProgress(40, 7).nextSuggestion, 60);
  assert.equal(goalProgress(2000, 365).nextSuggestion, 2365, 'beyond the ladder still suggests something');
  assert.deepEqual(GOAL_OPTIONS, [7, 30, 90, 365]);
});

test('the total never drops after a slip, so milestones and goal progress do not either', () => {
  let d = initial();
  const before = derivePhases(d, '2026-01-21').reduce((a, p) => a + p.days, 0);
  d = timelineReducer(d, { type: Actions.FRESH_START, payload: { date: '2026-01-21' } }, { now: new Date('2026-01-21T12:00:00') }).data;
  const after = derivePhases(d, '2026-01-21').reduce((a, p) => a + p.days, 0);
  assert.equal(after, before);
  assert.deepEqual(milestoneStatus(after).badges.filter((b) => b.achieved).map((b) => b.days), [1, 3, 7, 14]);
  assert.equal(goalProgress(after, 30).shown, 20);
});

// --- Köszönés, napi váltogatás -------------------------------------------------------------

test('dayPart and Hungarian date', () => {
  const at = (h) => new Date(2026, 10, 1, h);
  assert.deepEqual([4, 5, 9, 10, 17, 18, 21, 22, 23, 0].map((h) => dayPart(at(h))), ['ejszaka', 'reggel', 'reggel', 'nap', 'nap', 'este', 'este', 'ejszaka', 'ejszaka', 'ejszaka']);
  assert.equal(formatDayHu(new Date(2026, 10, 1)), 'vasárnap, november 1.');
});

test('pickDaily: stable within a day, rotates across days, relevant items first', () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, tags: i < 3 ? ['stress'] : [] }));
  const a = pickDaily(items, { date: '2026-11-01', tags: ['stress'], count: 3 });
  assert.deepEqual(a, pickDaily(items, { date: '2026-11-01', tags: ['stress'], count: 3 }), 'same day, same picks');
  assert.deepEqual(a.map((x) => x.id).sort(), ['t0', 't1', 't2'], 'all relevant ones come first');
  const noTags = (d) => pickDaily(items, { date: d, count: 3 }).map((x) => x.id).join();
  const days = new Set(Array.from({ length: 10 }, (_, i) => noTags(addDays('2026-11-01', i))));
  assert.ok(days.size > 3, 'the selection changes over the days');
  assert.equal(pickOne([], { date: '2026-11-01' }), null);
  assert.equal(hash('a'), hash('a'));
  assert.notEqual(hash('a'), hash('b'));
});

// --- Kihívások -----------------------------------------------------------------------------

test('challenge stats: totals only grow, a skipped day does not reset anything', () => {
  const t = '2026-11-01';
  const catalog = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, tags: [] }));
  assert.equal(challengesOfDay(catalog, t).length, 3);
  const events = [ev('challenge', '2026-10-25', { challengeId: 'c1' }), ev('challenge', '2026-10-26', { challengeId: 'c2' }), ev('challenge', '2026-10-26', { challengeId: 'c3' }), ev('challenge', '2026-11-01', { challengeId: 'c1' })];
  const s = challengeStats(events, t);
  // a 7 napos ablak 10-26 … 11-01: két aktív nap (10-26 és 11-01), a 10-25 már kívül van
  assert.deepEqual([s.totalDays, s.totalDone, s.last7, s.flame], [3, 4, 2, 1]);
  assert.deepEqual(s.doneToday.map((x) => x.id), ['c1']);
  const later = challengeStats(events, '2026-12-24');
  assert.equal(later.totalDays, 3, 'nothing is lost over a long break');
  assert.deepEqual([later.last7, later.flame], [0, 0]);
  assert.equal(challengeStats([], t).flame, 0);
  assert.equal(challengeStats(Array.from({ length: 7 }, (_, i) => ev('challenge', addDays(t, -i), { challengeId: 'c1' })), t).flame, 3);
});

// --- Sóvárgás-időzítő -----------------------------------------------------------------------

test('urgeLevel: a wave that rises, peaks around a third in, and fades', () => {
  assert.ok(urgeLevel(0) < urgeLevel(0.35));
  assert.ok(urgeLevel(0.35) > urgeLevel(0.7));
  assert.ok(urgeLevel(1) < 0.3);
  assert.equal(urgeLevel(0.35), 1);
  assert.equal(urgeLevel(-5), urgeLevel(0));
  assert.equal(urgeLevel(9), urgeLevel(1));
});

test('countdown state is computed from elapsed time and formatted as mm:ss', () => {
  assert.equal(URGE_DURATION_MS, 600_000);
  const at = (ms) => countdownStateAt(URGE_DURATION_MS, ms);
  assert.deepEqual([at(0).secondsLeft, at(0).done, at(0).progress], [600, false, 0]);
  assert.deepEqual([at(1).secondsLeft, at(299_500).secondsLeft], [600, 301]);
  assert.deepEqual([at(600_000).done, at(600_000).secondsLeft, at(9e9).progress], [true, 0, 1]);
  assert.equal(formatClock(600), '10:00');
  assert.equal(formatClock(61), '01:01');
  assert.equal(formatClock(0), '00:00');
});

function clock() {
  let t = 1000; let fn = null;
  return { now: () => t, setTimer: (f) => { fn = f; return 1; }, clearTimer: () => { fn = null; }, advance(ms) { t += ms; fn?.(); }, get ticking() { return fn !== null; } };
}

test('countdown controller: start, pause freezes time, resume, finish releases the timer', () => {
  const c = clock();
  const seen = [];
  const cd = createCountdown({ durationMs: 10_000, onChange: (s) => seen.push(s.status), ...c });
  cd.start();
  c.advance(4000);
  assert.equal(cd.getState().secondsLeft, 6);
  cd.pause();
  assert.equal(c.ticking, false);
  c.advance(60_000);
  cd.toggle();
  assert.equal(cd.getState().secondsLeft, 6, 'paused time does not count');
  c.advance(7000);
  assert.deepEqual([cd.getState().status, cd.getState().done, c.ticking], ['done', true, false]);
  assert.ok(seen.includes('paused') && seen.includes('done'));
  cd.start();
  assert.deepEqual([cd.getState().status, cd.getState().secondsLeft], ['running', 10], 'restart begins again');
  cd.reset();
  assert.equal(cd.getState().status, 'idle');
  cd.destroy();
});

test('countdown controller: a throttled background timer still shows the true time', () => {
  const c = clock();
  const cd = createCountdown({ durationMs: URGE_DURATION_MS, ...c });
  cd.start();
  c.advance(7 * 60_000 + 30_000); // one late tick after 7.5 minutes
  assert.equal(cd.getState().secondsLeft, 150);
});

// --- Diagramok ------------------------------------------------------------------------------

test('dates: month helpers', () => {
  assert.equal(startOfMonth('2026-11-17'), '2026-11-01');
  assert.equal(addMonths('2026-11-17', 1), '2026-12-01');
  assert.equal(addMonths('2026-11-17', 2), '2027-01-01');
  assert.equal(addMonths('2026-01-31', -1), '2025-12-01');
  assert.equal(addMonths('2026-03-01', -14), '2025-01-01');
  assert.equal(monthNameHu('2026-11-01'), 'november');
  assert.equal(monthNameHu('2026-11-01', { year: true }), '2026. november');
});

test('soberDaysIn: only completed days, clipped to the phases', () => {
  const d = initial(); // 2026-01-01
  const phases = derivePhases(timelineReducer(d, { type: Actions.FRESH_START, payload: { date: '2026-01-11' } }, { now: new Date('2026-01-20T12:00:00') }).data, '2026-01-20');
  // 1. szakasz: jan 1–10 (10 nap), jan 11 a megcsúszás napja, 2. szakasz: jan 12-től
  assert.equal(soberDaysIn(phases, '2026-01-01', '2026-02-01', '2026-01-20'), 10 + 8);
  assert.equal(soberDaysIn(phases, '2026-01-10', '2026-01-13', '2026-01-20'), 2, 'jan 10 and 12 (jan 11 was the slip)');
  assert.equal(soberDaysIn(phases, '2026-01-20', '2026-01-21', '2026-01-20'), 0, 'today is still in progress');
});

test('timelineSeries: week, month and year buckets add up to the phase totals', () => {
  const today = '2026-03-20';
  const data = initial({ dailyCostHuf: 1000 }); // journey from 2026-01-01
  const phases = derivePhases(data, today);
  const events = [ci('2026-03-19', 'cheerful'), ci('2026-03-20', 'hurt')];
  const week = timelineSeries(events, phases, today, 'week');
  assert.equal(week.length, 7);
  assert.deepEqual(week.map((b) => b.soberDays), [1, 1, 1, 1, 1, 1, 0], 'today is partial');
  assert.equal(week.at(-1).partial, true);
  assert.equal(week.at(-2).valence, 1);
  assert.equal(week.at(-1).valence, -1);
  assert.equal(week[0].valence, null);
  const month = timelineSeries(events, phases, today, 'month');
  assert.equal(month.length, 30);
  assert.equal(month.reduce((a, b) => a + b.soberDays, 0), 29);
  const year = timelineSeries(events, phases, today, 'year');
  assert.equal(year.length, 12);
  assert.equal(year.reduce((a, b) => a + b.soberDays, 0), phases.reduce((a, p) => a + p.days, 0), 'the year view accounts for every sober day');
  assert.equal(year.at(-1).key, '2026-03-01');
  assert.equal(year.at(-1).partial, true);
  assert.deepEqual(year.slice(-3).map((b) => b.soberDays), [31, 28, 19]);
});

test('savingsByMonth: month by month at each day\'s own cost; the months add up to the total', () => {
  const today = '2026-03-20';
  let data = initial({ dailyCostHuf: 1000 });
  data = timelineReducer(data, { type: Actions.SET_DAILY_COST, payload: { amountHuf: 2000, from: '2026-02-01' } }, { now: new Date('2026-03-20T12:00:00') }).data;
  const phases = derivePhases(data, today);
  const m = savingsByMonth(data.settings.costHistory, phases, today, 12);
  assert.deepEqual(m.slice(0, 3).map((x) => [x.month, x.days, x.amountHuf]), [['2026-03-01', 19, 38_000], ['2026-02-01', 28, 56_000], ['2026-01-01', 31, 31_000]]);
  assert.equal(m[0].label, '2026. március');
  assert.equal(m.reduce((a, x) => a + x.amountHuf, 0), computeSavings(data, phases, today, []).total);
});

test('funConversion: only items you can afford, stable within a day', () => {
  const items = [{ id: 'pizza', priceHuf: 3000 }, { id: 'mozi', priceHuf: 3500 }, { id: 'konyv', priceHuf: 6000 }];
  assert.equal(funConversion(2000, items, '2026-11-01'), null);
  const r = funConversion(37_500, items, '2026-11-01');
  assert.equal(r.count, Math.floor(37_500 / r.item.priceHuf));
  assert.deepEqual(funConversion(37_500, items, '2026-11-01'), r);
  assert.equal(funConversion(3_100, items, '2026-11-01').item.id, 'pizza', 'only the affordable one');
  assert.ok(new Set(Array.from({ length: 12 }, (_, i) => funConversion(37_500, items, addDays('2026-11-01', i)).item.id)).size > 1);
});

// --- Reducer: új műveletek ---------------------------------------------------------------------

const run = (data, action, date = '2026-02-10') => timelineReducer(data, action, { now: new Date(`${date}T12:00:00`) });

test('reducer: urge, gratitude, letter and challenge events are validated and appended', () => {
  let d = initial();
  d = run(d, { type: Actions.LOG_URGE, payload: { seconds: 600, outcome: 'passed' } }).data;
  d = run(d, { type: Actions.LOG_GRATITUDE, payload: { items: ['A napfény'] } }).data;
  d = run(d, { type: Actions.LOG_LETTER, payload: { note: 'Büszke vagyok rád.', when: 'hard' } }).data;
  d = run(d, { type: Actions.LOG_CHALLENGE, payload: { challengeId: 'water' } }).data;
  assert.deepEqual(d.events.map((e) => e.type), ['urge', 'gratitude', 'letter', 'challenge']);
  assert.throws(() => run(d, { type: Actions.LOG_URGE, payload: { seconds: 5, outcome: 'nyert' } }), { name: 'SchemaError' });
  assert.throws(() => run(d, { type: Actions.LOG_GRATITUDE, payload: { items: [] } }), { name: 'SchemaError' });
  assert.throws(() => run(d, { type: Actions.LOG_CHALLENGE, payload: { challengeId: 'X' } }), { name: 'SchemaError' });
});

test('reducer: UPDATE_PROFILE changes only what is given, clears empties, never touches events or journeyStart', () => {
  let d = initial();
  d = run(d, { type: Actions.LOG_NOTE, payload: { note: 'marad' } }).data;
  const note = d.events[0];
  d = run(d, { type: Actions.UPDATE_PROFILE, payload: { nickname: 'Panni', goalDays: 30, reasons: ['A gyerekeim'], journeyStart: '2020-01-01' } }).data;
  assert.deepEqual(d.profile, { journeyStart: '2026-01-01', nickname: 'Panni', goalDays: 30, reasons: ['A gyerekeim'] });
  assert.equal(d.events[0], note, 'events keep their identity');
  d = run(d, { type: Actions.UPDATE_PROFILE, payload: { nickname: '', reasons: [] } }).data;
  assert.deepEqual(d.profile, { journeyStart: '2026-01-01', goalDays: 30 });
  assert.throws(() => run(d, { type: Actions.UPDATE_PROFILE, payload: { goalDays: 99999 } }), { name: 'SchemaError' });
});

test('reducer: a slip never lowers the profile data or the celebrated milestone', () => {
  let d = run(initial(), { type: Actions.UPDATE_PROFILE, payload: { lastCelebration: 30, nickname: 'Ági' } }).data;
  d = run(d, { type: Actions.FRESH_START, payload: {} }, '2026-02-10').data;
  assert.deepEqual([d.profile.lastCelebration, d.profile.nickname], [30, 'Ági']);
});
