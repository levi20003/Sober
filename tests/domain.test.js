import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initial } from './helpers.js';
import { riskContexts, isLateNight, isWeekend } from '../src/domain/risk.js';
import { CSV_BOM, csvCell, toCsvExport, toJsonExport, parseJsonImport } from '../src/domain/export.js';
import { addEvent, makeEvent } from '../src/domain/timeline.js';
import { validateData } from '../src/domain/schema.js';

test('risk contexts: late night, weekend, personal pattern', () => {
  assert.equal(isLateNight(new Date('2026-10-26T23:30:00')), true);
  assert.equal(isLateNight(new Date('2026-10-26T14:00:00')), false);
  assert.equal(isWeekend(new Date('2026-10-30T18:00:00')), true); // Friday evening
  assert.equal(isWeekend(new Date('2026-10-28T18:00:00')), false); // Wednesday
  const events = [
    { type: 'trigger', at: '2026-10-20T16:10:00' }, { type: 'trigger', at: '2026-10-21T16:40:00' },
  ].map((e) => ({ ...e, date: e.at.slice(0, 10), at: new Date(e.at).toISOString() }));
  assert.deepEqual(riskContexts(new Date('2026-10-28T16:20:00'), events), ['personal']);
  assert.deepEqual(riskContexts(new Date('2026-10-31T23:00:00')), ['lateNight', 'weekend']);
  const sameDay = events.map((e) => ({ ...e, date: '2026-10-20' }));
  assert.deepEqual(riskContexts(new Date('2026-10-28T16:20:00'), sameDay), [], 'one hard day is not a pattern');
});

test('CSV: UTF-8 BOM, semicolons, Hungarian text, escaping, formula injection guard', () => {
  let d = initial();
  d = addEvent(d, makeEvent('note', { date: '2026-01-02', note: '=HYPERLINK("x");"idézet"\nárvíztűrő' }));
  d = addEvent(d, makeEvent('trigger', { date: '2026-01-03', triggers: ['stress', 'loneliness'], intensity: 3, coping: ['walk'], outcome: 'coped' }));
  const csv = toCsvExport(validateData(d));
  assert.ok(csv.startsWith(CSV_BOM));
  assert.ok(csv.includes('Dátum;Időpont;Típus'));
  assert.ok(csv.includes('Stressz (munka, tanulás), Magány'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"");""idézet""\nárvíztűrő"`));
  assert.equal(csvCell('-1+2'), "'-1+2");
  assert.equal(csvCell('@SUM'), "'@SUM");
});

test('JSON export round-trips through import validation', () => {
  const d = validateData(addEvent(initial(), makeEvent('checkin', { date: '2026-01-02', mood: 'calm', sleep: 4, craving: 1 })));
  assert.deepEqual(parseJsonImport('﻿' + toJsonExport(d)), d);
  assert.throws(() => parseJsonImport('{"a":1}'));
  assert.throws(() => parseJsonImport('nem json'));
});
