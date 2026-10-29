// Breathing exercise engine. Pure and clock-driven: the state is *computed* from
// elapsed time, never accumulated from timer ticks. Browsers throttle timers when
// the screen dims or the tab is in the background; a tick counter would drift or
// stall, while this always shows the correct phase as soon as it runs again.

export const STEP_KINDS = ['in', 'hold', 'out'];
export const MIN_SCALE = 0.55;
export const MAX_SCALE = 1;

export function validatePattern(p) {
  if (!p || typeof p.id !== 'string' || !Array.isArray(p.steps) || p.steps.length === 0) {
    throw new TypeError('Invalid breathing pattern');
  }
  if (!Number.isInteger(p.rounds) || p.rounds < 1 || p.rounds > 20) throw new RangeError(`${p.id}: rounds 1–20`);
  for (const s of p.steps) {
    if (!STEP_KINDS.includes(s.kind)) throw new TypeError(`${p.id}: unknown step kind "${s.kind}"`);
    if (!Number.isInteger(s.seconds) || s.seconds < 1 || s.seconds > 15) throw new RangeError(`${p.id}: step seconds 1–15`);
    if (typeof s.label !== 'string' || !s.label) throw new TypeError(`${p.id}: step label required`);
  }
  return p;
}

export const cycleMs = (p) => p.steps.reduce((n, s) => n + s.seconds * 1000, 0);
export const totalMs = (p) => cycleMs(p) * p.rounds;

/** Circle size at the END of step i (holds keep whatever the previous breath left). */
function endScale(p, i) {
  for (let k = 0; k < p.steps.length; k++) {
    const step = p.steps[(i - k + p.steps.length) % p.steps.length];
    if (step.kind === 'in') return MAX_SCALE;
    if (step.kind === 'out') return MIN_SCALE;
  }
  return MIN_SCALE;
}

/**
 * State of `pattern` after `elapsedMs`.
 * @returns {{done, round, rounds, stepIndex, kind, label, secondsLeft, stepProgress,
 *            stepRemainingMs, totalProgress, scale, targetScale}}
 */
export function breathingStateAt(pattern, elapsedMs) {
  const cycle = cycleMs(pattern);
  const total = cycle * pattern.rounds;
  const t = Math.max(0, elapsedMs);
  if (t >= total) {
    const last = pattern.steps.length - 1;
    return {
      done: true, round: pattern.rounds, rounds: pattern.rounds, stepIndex: last,
      kind: pattern.steps[last].kind, label: pattern.steps[last].label, secondsLeft: 0,
      stepProgress: 1, stepRemainingMs: 0, totalProgress: 1,
      scale: endScale(pattern, last), targetScale: endScale(pattern, last),
    };
  }
  const round = Math.floor(t / cycle) + 1;
  let within = t % cycle;
  let stepIndex = 0;
  for (; stepIndex < pattern.steps.length; stepIndex++) {
    const d = pattern.steps[stepIndex].seconds * 1000;
    if (within < d) break;
    within -= d;
  }
  const step = pattern.steps[stepIndex];
  const durationMs = step.seconds * 1000;
  const stepProgress = within / durationMs;
  const from = endScale(pattern, stepIndex - 1);
  const to = endScale(pattern, stepIndex);
  return {
    done: false,
    round,
    rounds: pattern.rounds,
    stepIndex,
    kind: step.kind,
    label: step.label,
    secondsLeft: Math.ceil((durationMs - within) / 1000),
    stepProgress,
    stepRemainingMs: durationMs - within,
    totalProgress: t / total,
    scale: from + (to - from) * stepProgress,
    targetScale: to,
  };
}

/**
 * Stateful controller around breathingStateAt. Status: idle → running ⇄ paused → done.
 * onChange fires only when something visible changes (step, round, second, status).
 */
export function createBreathingController({
  pattern,
  onChange = () => {},
  now = () => performance.now(),
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
  tickMs = 200,
}) {
  let current = validatePattern(pattern);
  let status = 'idle';
  let startedAt = 0;
  let pausedElapsed = 0;
  let timer = null;
  let lastKey = '';
  let snapshot = { ...breathingStateAt(current, 0), status };

  const elapsed = () => (status === 'running' ? now() - startedAt : pausedElapsed);

  function emit(force = false) {
    const s = breathingStateAt(current, elapsed());
    if (s.done && status === 'running') {
      status = 'done';
      stopTimer();
    }
    snapshot = { ...s, status };
    const key = `${status}|${s.round}|${s.stepIndex}|${s.secondsLeft}`;
    if (force || key !== lastKey) {
      lastKey = key;
      onChange(snapshot);
    }
  }

  function stopTimer() {
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  const api = {
    getState: () => snapshot,
    get pattern() { return current; },

    start() {
      if (status === 'running') return;
      if (status === 'done' || status === 'idle') pausedElapsed = 0;
      startedAt = now() - pausedElapsed;
      status = 'running';
      timer = setTimer(() => emit(), tickMs);
      emit(true);
    },

    pause() {
      if (status !== 'running') return;
      pausedElapsed = now() - startedAt;
      status = 'paused';
      stopTimer();
      emit(true);
    },

    /** Start ↔ pause ↔ resume with a single button. */
    toggle() {
      if (status === 'running') api.pause();
      else api.start();
    },

    reset() {
      stopTimer();
      status = 'idle';
      pausedElapsed = 0;
      emit(true);
    },

    setPattern(next) {
      current = validatePattern(next);
      api.reset();
    },

    /** Re-sync immediately, e.g. when the page becomes visible again. */
    sync: () => emit(),

    destroy() {
      stopTimer();
      status = 'idle';
    },
  };
  return api;
}
