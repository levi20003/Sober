// Crisis module: helplines, breathing engine and independence from storage/network.
import { test, beforeEach, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { HELPLINES, BREATHING } from '../src/content/hu.js';
import { telHref, displayMatchesTel, splitHelplines, copyNumber, digitsOf } from '../src/domain/helplines.js';
import {
  breathingStateAt, createBreathingController, validatePattern, cycleMs, totalMs, MIN_SCALE, MAX_SCALE,
} from '../src/domain/breathing.js';

// --- Simulated offline environment: any network attempt is recorded and fails. ---
const saved = {};
let networkCalls = [];
beforeEach(() => {
  networkCalls = [];
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket']) {
    saved[name] = globalThis[name];
    globalThis[name] = function offline(...args) {
      networkCalls.push([name, ...args]);
      throw new TypeError('Failed to fetch (offline)');
    };
  }
});
afterEach(() => {
  for (const [name, v] of Object.entries(saved)) globalThis[name] = v;
  assert.deepEqual(networkCalls, [], 'crisis code must never touch the network');
});

const BY_ID = Object.fromEntries(BREATHING.map((p) => [p.id, p]));

// --- Helplines ------------------------------------------------------------------

test('every helpline dials exactly the number it displays', () => {
  for (const l of HELPLINES) {
    assert.ok(displayMatchesTel(l), `${l.id}: shows ${l.number} but dials ${l.tel}`);
    assert.equal(telHref(l), `tel:${digitsOf(l.tel)}`);
  }
});

test('click-to-call uses tel: links, which need no internet and bypass the service worker', () => {
  for (const l of HELPLINES) {
    const href = new URL(telHref(l));
    assert.equal(href.protocol, 'tel:');
  }
  const sw = readFileSync('src/sw/sw.template.js', 'utf8');
  assert.match(sw, /new URL\(req\.url\)\.origin !== self\.location\.origin\) return;/, 'SW ignores non-same-origin requests');
});

test('invalid tel values are rejected', () => {
  for (const tel of ['', '12', '116 123', 'tel:116123', '116-123', '1'.repeat(16)]) {
    assert.throws(() => telHref({ id: 'x', tel }));
  }
});

test('emergency line is separated; S.O.S. 116-123 is the primary talk line', () => {
  const { emergency, talk } = splitHelplines(HELPLINES);
  assert.deepEqual(emergency.map((l) => l.tel), ['112']);
  assert.equal(talk[0].tel, '116123');
  assert.match(talk[0].name, /S\.O\.S\./);
  assert.ok(talk.some((l) => l.id === 'drog-stop'), 'an addiction-specific line is offered');
});

test('every helpline records how it was verified', () => {
  for (const l of HELPLINES) {
    assert.ok(['official', 'multiple-secondary'].includes(l.verification), l.id);
    assert.match(l.verified, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('copy fallback: copies when the clipboard works, degrades to manual offline/blocked', async () => {
  const written = [];
  const line = HELPLINES.find((l) => l.id === 'lesz');
  assert.equal(await copyNumber(line, { clipboard: { writeText: async (t) => written.push(t) } }), 'copied');
  assert.deepEqual(written, ['116-123']);
  assert.equal(await copyNumber(line, { clipboard: undefined }), 'manual');
  assert.equal(await copyNumber(line, { clipboard: { writeText: async () => { throw new Error('NotAllowedError'); } } }), 'manual');
});

// --- Breathing engine -------------------------------------------------------------

test('all shipped patterns are valid; 4-7-8 is available', () => {
  for (const p of BREATHING) validatePattern(p);
  assert.deepEqual(BY_ID['4-7-8'].steps.map((s) => [s.kind, s.seconds]), [['in', 4], ['hold', 7], ['out', 8]]);
  assert.equal(cycleMs(BY_ID['4-7-8']), 19_000);
  assert.equal(totalMs(BY_ID['4-7-8']), 76_000);
});

test('invalid patterns are rejected', () => {
  const base = { id: 't', rounds: 2, steps: [{ kind: 'in', label: 'Be', seconds: 4 }] };
  assert.throws(() => validatePattern({ ...base, steps: [] }));
  assert.throws(() => validatePattern({ ...base, rounds: 0 }));
  assert.throws(() => validatePattern({ ...base, steps: [{ kind: 'inhale', label: 'Be', seconds: 4 }] }));
  assert.throws(() => validatePattern({ ...base, steps: [{ kind: 'in', label: 'Be', seconds: 0 }] }));
});

test('4-7-8: phases, countdown, rounds at exact boundaries', () => {
  const p = BY_ID['4-7-8'];
  const at = (ms) => breathingStateAt(p, ms);
  assert.deepEqual([at(0).kind, at(0).secondsLeft, at(0).round], ['in', 4, 1]);
  assert.deepEqual([at(3_999).kind, at(3_999).secondsLeft], ['in', 1]);
  assert.deepEqual([at(4_000).kind, at(4_000).secondsLeft], ['hold', 7]);
  assert.deepEqual([at(11_000).kind, at(11_000).secondsLeft], ['out', 8]);
  assert.deepEqual([at(19_000).kind, at(19_000).round], ['in', 2]);
  assert.equal(at(75_999).done, false);
  assert.equal(at(76_000).done, true);
  assert.equal(at(999_999).done, true);
  assert.equal(at(-500).kind, 'in', 'negative elapsed clamps to start');
});

test('circle scale: grows on inhale, holds, shrinks on exhale', () => {
  const p = BY_ID['4-7-8'];
  const at = (ms) => breathingStateAt(p, ms).scale;
  assert.equal(at(0), MIN_SCALE);
  assert.ok(Math.abs(at(2_000) - (MIN_SCALE + MAX_SCALE) / 2) < 1e-9);
  assert.equal(at(4_000), MAX_SCALE);
  assert.equal(at(8_000), MAX_SCALE, 'hold after inhale stays large');
  assert.ok(Math.abs(at(15_000) - (MAX_SCALE + MIN_SCALE) / 2) < 1e-9);
  const box = BY_ID.box;
  assert.equal(breathingStateAt(box, 13_000).scale, MIN_SCALE, 'pause after exhale stays small');
  assert.equal(breathingStateAt(box, 13_000).targetScale, MIN_SCALE);
});

function fakeClock() {
  let t = 1000;
  let fn = null;
  return {
    now: () => t,
    setTimer: (f) => { fn = f; return 1; },
    clearTimer: () => { fn = null; },
    advance(ms) { t += ms; fn?.(); },
    get ticking() { return fn !== null; },
  };
}

test('controller: start, countdown, pause freezes time, resume continues, done stops', () => {
  const c = fakeClock();
  const seen = [];
  const ctl = createBreathingController({ pattern: BY_ID['4-7-8'], onChange: (s) => seen.push(s), ...c });
  assert.equal(ctl.getState().status, 'idle');

  ctl.start();
  assert.equal(ctl.getState().status, 'running');
  c.advance(4_500);
  assert.equal(ctl.getState().kind, 'hold');

  ctl.pause();
  assert.equal(c.ticking, false, 'no timer while paused');
  c.advance(60_000); // e.g. the person put the phone down
  ctl.toggle();      // resume
  assert.equal(ctl.getState().kind, 'hold', 'paused time does not count');
  assert.equal(ctl.getState().secondsLeft, 7);

  c.advance(80_000);
  assert.equal(ctl.getState().status, 'done');
  assert.equal(c.ticking, false, 'timer released when done');
  assert.ok(seen.some((s) => s.status === 'paused'));
});

test('controller: a throttled/backgrounded timer jumps to the correct phase instead of drifting', () => {
  const c = fakeClock();
  const ctl = createBreathingController({ pattern: BY_ID['slow-exhale'], ...c });
  ctl.start();
  c.advance(25_300); // one late tick after 25 s (cycle = 10 s)
  const s = ctl.getState();
  assert.deepEqual([s.round, s.kind, s.secondsLeft], [3, 'out', 5]); // 25.3 s = 2 cycles + 4 s in + 1.3 s out
});

test('controller: onChange fires only on visible changes, not on every tick', () => {
  const c = fakeClock();
  let calls = 0;
  const ctl = createBreathingController({ pattern: BY_ID.box, onChange: () => calls++, ...c });
  ctl.start();
  calls = 0;
  for (let i = 0; i < 5; i++) c.advance(200); // 1 s in 200 ms ticks
  assert.equal(calls, 1, 'one countdown change per second');
});

test('controller: changing pattern resets; restart after done begins at round 1', () => {
  const c = fakeClock();
  const ctl = createBreathingController({ pattern: BY_ID.box, ...c });
  ctl.start();
  c.advance(5_000);
  ctl.setPattern(BY_ID['4-7-8']);
  assert.equal(ctl.getState().status, 'idle');
  assert.equal(c.ticking, false);
  ctl.start();
  c.advance(100_000);
  assert.equal(ctl.getState().status, 'done');
  ctl.start();
  assert.deepEqual([ctl.getState().round, ctl.getState().kind, ctl.getState().status], [1, 'in', 'running']);
  ctl.destroy();
  assert.equal(c.ticking, false);
});

// --- Independence: the crisis screen must work when storage, crypto or network fail ---

function importGraph(entry, seen = new Set()) {
  const file = normalize(entry);
  if (seen.has(file)) return seen;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm)) importGraph(join(dirname(file), m[1]), seen);
  return seen;
}

test('crisis overlay imports nothing from storage, crypto or auth (works when they fail)', () => {
  const graph = [...importGraph('src/components/crisis/CrisisOverlay.jsx')];
  const forbidden = graph.filter((f) => /src\/(storage|crypto|auth)\//.test(f));
  assert.deepEqual(forbidden, []);
  assert.ok(graph.some((f) => f.endsWith('domain/breathing.js')));
});

test('static HTML fallback lists every helpline (works if a JS module fails to load)', () => {
  const html = readFileSync('index.html', 'utf8');
  for (const l of HELPLINES) {
    assert.ok(html.includes(`href="tel:${l.tel}"`), `${l.id} tel link missing from index.html fallback`);
    assert.ok(html.includes(l.number), `${l.id} number missing from index.html fallback`);
  }
});
