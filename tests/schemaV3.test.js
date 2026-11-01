import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createInitialData, validateData, validateEvent, validateProfile, migrate, SCHEMA_VERSION } from '../src/domain/schema.js';
import { initial } from './helpers.js';
import { toCsvExport, toJsonExport, parseJsonImport } from '../src/domain/export.js';
import { MOODS, LEGACY_MOODS, LEGACY_MOOD_FIGURE, SUBSTANCES, TRIGGERS, ONBOARDING_TRIGGERS, labelOf } from '../src/domain/presets.js';

const base = { id: 'abcdef12', date: '2026-01-05', at: '2026-01-05T10:00:00.000Z' };

// --- Migration ---------------------------------------------------------------------

const V2 = {
  schemaVersion: 2,
  profile: { journeyStart: '2026-01-01' },
  settings: { costHistory: [{ from: '2026-01-01', dailyCostHuf: 2500 }], savingsGoal: { label: 'Bicikli', amountHuf: 120000 }, autoLockMinutes: 9 },
  events: [
    { id: 'e0000001', type: 'checkin', date: '2026-01-03', at: '2026-01-03T08:00:00.000Z', mood: 'calm', sleep: 4, note: 'Jó reggel.' },
    { id: 'e0000002', type: 'slip', date: '2026-01-10', at: '2026-01-10T20:00:00.000Z', lesson: 'Tanulság', intention: 'Szándék' },
  ],
};

test('v2 → v3: every existing field and event survives unchanged', () => {
  const d = validateData(V2);
  assert.equal(d.schemaVersion, SCHEMA_VERSION);
  assert.equal(SCHEMA_VERSION, 3);
  assert.deepEqual(d.profile, { journeyStart: '2026-01-01' }, 'no invented profile fields');
  assert.deepEqual(d.settings, V2.settings);
  assert.deepEqual(d.events, V2.events);
  assert.equal(d.events[0].mood, 'calm', 'legacy mood ids stay valid');
});

test('v1 → v2 → v3 chain still works and the step is idempotent', () => {
  const v1 = { schemaVersion: 1, profile: { journeyStart: '2026-01-01' }, settings: { dailyCostHuf: 2500, autoLockMinutes: 5 }, events: [] };
  const d = validateData(v1);
  assert.equal(d.schemaVersion, 3);
  assert.deepEqual(d.settings.costHistory, [{ from: '2026-01-01', dailyCostHuf: 2500 }]);
  assert.deepEqual(validateData(d), d, 'validating a v3 payload changes nothing');
  assert.equal(migrate(migrate(V2)).schemaVersion, 3);
});

test('a newer payload version is refused, not misread', () => {
  assert.throws(() => validateData({ ...V2, schemaVersion: 4 }), /újabb verziója/);
});

test('a v2 JSON export from the previous app version still imports', () => {
  const d = parseJsonImport(JSON.stringify({ app: 'jozansag-szamlalo', kind: 'plain-export', data: V2 }));
  assert.equal(d.schemaVersion, 3);
  assert.equal(d.events.length, 2);
});

// --- Profile -----------------------------------------------------------------------

test('profile: onboarding answers are validated and normalized', () => {
  const d = createInitialData({
    journeyStart: '2026-02-01', dailyCostHuf: 3500, nickname: '  Panni  ', substances: ['alcohol', 'tobacco'],
    goalDays: 30, triggers: ['stress', 'weekend'], customTriggers: ['Meccs után', 'Meccs után', ' '], reasons: ['A gyerekeim'],
  });
  assert.deepEqual(d.profile, {
    journeyStart: '2026-02-01', nickname: 'Panni', substances: ['alcohol', 'tobacco'], goalDays: 30,
    triggers: ['stress', 'weekend'], customTriggers: ['Meccs után'], reasons: ['A gyerekeim'],
  });
});

test('profile: every field is optional and an empty nickname means "no nickname"', () => {
  const d = createInitialData({ journeyStart: '2026-02-01', nickname: '   ', substances: [], triggers: [] });
  assert.deepEqual(d.profile, { journeyStart: '2026-02-01' });
});

test('profile: invalid answers are rejected with a clear error', () => {
  const p = (over) => () => validateProfile({ journeyStart: '2026-02-01', ...over });
  assert.throws(p({ nickname: 'x'.repeat(25) }), /Becenév/);
  assert.throws(p({ substances: ['nincs-ilyen'] }), { name: 'SchemaError' });
  assert.throws(p({ goalDays: 0 }), /Cél/);
  assert.throws(p({ goalDays: 4000 }), /Cél/);
  assert.throws(p({ goalDays: 7.5 }), /Cél/);
  assert.throws(p({ triggers: ['nincs-ilyen'] }), { name: 'SchemaError' });
  assert.throws(p({ customTriggers: Array.from({ length: 11 }, (_, i) => `h${i}`) }), /Saját helyzetek/);
  assert.throws(p({ customTriggers: ['x'.repeat(31)] }), /Saját helyzetek/);
  assert.throws(p({ reasons: ['x'.repeat(141)] }), /Személyes okok/);
  assert.throws(() => validateProfile({ journeyStart: 'tegnap' }), /kezdődátum/);
});

test('profile: unknown keys are dropped (nothing unvalidated reaches the vault)', () => {
  const d = validateData({ ...initial(), profile: { journeyStart: '2026-01-01', hack: '<script>', nickname: 'Ági' } });
  assert.deepEqual(d.profile, { journeyStart: '2026-01-01', nickname: 'Ági' });
});

test('presets: 12 mood figures, legacy moods mapped to a figure, new trigger and substances', () => {
  assert.equal(MOODS.length, 12);
  assert.deepEqual(MOODS.map((m) => m.label), ['Izgatott', 'Vidám', 'Hálás', 'Energikus', 'Érzékeny', 'Zavarodott', 'Unatkozó', 'Stresszes', 'Dühös', 'Bizonytalan', 'Sérült', 'Bűntudatos']);
  for (const m of LEGACY_MOODS) assert.ok(MOODS.some((x) => x.id === LEGACY_MOOD_FIGURE[m.id]), m.id);
  assert.equal(labelOf('mood', 'calm'), 'Nyugodt');
  assert.equal(labelOf('mood', 'excited'), 'Izgatott');
  assert.ok(SUBSTANCES.some((s) => s.id === 'alcohol') && SUBSTANCES.some((s) => s.id === 'other'));
  for (const id of ONBOARDING_TRIGGERS) assert.ok(TRIGGERS.some((t) => t.id === id), id);
});

// --- New events --------------------------------------------------------------------

test('checkin: the 12 figures plus an optional 1–5 intensity', () => {
  for (const m of MOODS) assert.equal(validateEvent({ ...base, type: 'checkin', mood: m.id, intensity: 3 }).mood, m.id);
  assert.throws(() => validateEvent({ ...base, type: 'checkin', mood: 'excited', intensity: 6 }), /Erősség/);
  assert.throws(() => validateEvent({ ...base, type: 'checkin', mood: 'nincs' }), /Hangulat/);
});

test('urge: seconds and a passed/still outcome', () => {
  assert.deepEqual(validateEvent({ ...base, type: 'urge', seconds: 600, outcome: 'passed' }).outcome, 'passed');
  assert.throws(() => validateEvent({ ...base, type: 'urge', seconds: -1, outcome: 'passed' }), /Időtartam/);
  assert.throws(() => validateEvent({ ...base, type: 'urge', seconds: 10, outcome: 'win' }), /kimenet/);
  assert.throws(() => validateEvent({ ...base, type: 'urge', outcome: 'passed' }), /Időtartam/);
});

test('challenge: a slug id', () => {
  assert.equal(validateEvent({ ...base, type: 'challenge', challengeId: 'walk-10' }).challengeId, 'walk-10');
  assert.throws(() => validateEvent({ ...base, type: 'challenge', challengeId: 'Rossz Azonosító' }), /Kihívás/);
});

test('gratitude: 1–3 short items, blanks dropped', () => {
  assert.deepEqual(validateEvent({ ...base, type: 'gratitude', items: ['  A reggeli napfény ', '', 'Anya hívása'] }).items, ['A reggeli napfény', 'Anya hívása']);
  assert.throws(() => validateEvent({ ...base, type: 'gratitude', items: [] }), /Hála/);
  assert.throws(() => validateEvent({ ...base, type: 'gratitude', items: ['a', 'b', 'c', 'd'] }), /Hála/);
  assert.throws(() => validateEvent({ ...base, type: 'gratitude', items: ['x'.repeat(141)] }), /Hála/);
});

test('letter: a body and when it should appear', () => {
  const l = validateEvent({ ...base, type: 'letter', note: 'Büszke vagyok rád.', when: 'milestone', milestoneDays: 30 });
  assert.deepEqual([l.when, l.milestoneDays, l.note], ['milestone', 30, 'Büszke vagyok rád.']);
  assert.throws(() => validateEvent({ ...base, type: 'letter', when: 'hard' }), /üres/);
  assert.throws(() => validateEvent({ ...base, type: 'letter', note: 'x', when: 'mindig' }), /időzítés/);
});

// --- Export ------------------------------------------------------------------------

test('exports include the new profile fields and event types; CSV keeps its first columns', () => {
  let d = createInitialData({ journeyStart: '2026-01-01', nickname: 'Panni', goalDays: 90 });
  d = validateData({ ...d, events: [
    { ...base, type: 'gratitude', items: ['Napfény', 'Kávé'] },
    { ...base, id: 'abcdef13', type: 'urge', seconds: 600, outcome: 'passed' },
    { ...base, id: 'abcdef14', type: 'letter', note: 'Levél', when: 'hard' },
    { ...base, id: 'abcdef15', type: 'challenge', challengeId: 'water' },
  ] });
  const json = JSON.parse(toJsonExport(d));
  assert.equal(json.data.profile.nickname, 'Panni');
  assert.equal(json.data.events.length, 4);
  const csv = toCsvExport(d);
  assert.ok(csv.includes('Dátum;Időpont;Típus;Hangulat'), 'existing columns keep their order');
  assert.ok(csv.includes('Hála') && csv.includes('Napfény, Kávé'));
  assert.ok(csv.includes('Sóvárgás-túlélő') && csv.includes('10 perc'));
  assert.deepEqual(parseJsonImport(toJsonExport(d)), d, 'round trip');
});
