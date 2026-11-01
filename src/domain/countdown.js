// Sóvárgás-túlélő időzítő ("urge surfing"). Az eltelt órajelből számol, nem tick-ek összegéből,
// ezért a háttérbe tett, lelassított telefonon is mindig a valódi idő látszik (lásd breathing.js).
// A sóvárgás hullámként viselkedik: felerősödik, tetőzik, majd elcsendesedik: urgeLevel().

export const URGE_DURATION_MS = 10 * 60_000;

/** 0..1 hullámmagasság a haladás (0..1) függvényében: harang alakú, kb. 35%-nál tetőzik. */
export function urgeLevel(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const peak = 0.35;
  const width = p < peak ? 0.22 : 0.4;
  return Math.exp(-((p - peak) ** 2) / (2 * width ** 2));
}

export function countdownStateAt(durationMs, elapsedMs) {
  const t = Math.max(0, elapsedMs);
  const done = t >= durationMs;
  const remainingMs = done ? 0 : durationMs - t;
  const progress = done ? 1 : t / durationMs;
  return { done, elapsedMs: Math.min(t, durationMs), remainingMs, progress, secondsLeft: Math.ceil(remainingMs / 1000), level: urgeLevel(progress) };
}

export const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/** idle → running ⇄ paused → done. */
export function createCountdown({
  durationMs = URGE_DURATION_MS,
  onChange = () => {},
  now = () => performance.now(),
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
  tickMs = 250,
} = {}) {
  let status = 'idle';
  let startedAt = 0;
  let pausedElapsed = 0;
  let timer = null;
  let lastKey = '';
  let snapshot = { ...countdownStateAt(durationMs, 0), status };

  const elapsed = () => (status === 'running' ? now() - startedAt : pausedElapsed);
  const stop = () => { if (timer !== null) clearTimer(timer); timer = null; };

  function emit(force = false) {
    const s = countdownStateAt(durationMs, elapsed());
    if (s.done && status === 'running') { status = 'done'; stop(); }
    snapshot = { ...s, status };
    const key = `${status}|${s.secondsLeft}`;
    if (force || key !== lastKey) { lastKey = key; onChange(snapshot); }
  }

  const api = {
    getState: () => snapshot,
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
      stop();
      emit(true);
    },
    toggle() { if (status === 'running') api.pause(); else api.start(); },
    reset() { stop(); status = 'idle'; pausedElapsed = 0; emit(true); },
    sync: () => emit(),
    destroy() { stop(); status = 'idle'; },
  };
  return api;
}
