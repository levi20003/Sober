// <BreathingExercise />: interactive, clock-driven breathing guide (4-6, box, 4-7-8).
// Logic: src/domain/breathing.js via useBreathing. This component only renders.
// prefers-reduced-motion → static circle (CSS) while label + countdown keep guiding.
// Keeps the screen awake while running (Screen Wake Lock, where supported).

import { useEffect, useLayoutEffect, useRef } from 'react';
import { T, BREATHING } from '../../content/hu.js';
import { MIN_SCALE } from '../../domain/breathing.js';
import { useBreathing } from '../../hooks/useBreathing.js';
import { Chips } from '../ui.jsx';

function useWakeLock(active) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return undefined;
    let lock = null;
    let cancelled = false;
    navigator.wakeLock.request('screen').then((l) => { if (cancelled) l.release(); else lock = l; }).catch(() => {});
    return () => { cancelled = true; lock?.release().catch(() => {}); };
  }, [active]);
}

export function BreathingExercise({ patterns = BREATHING, clock }) {
  const { state: s, pattern, toggle, setPattern } = useBreathing(patterns, { clock });
  const circle = useRef(null);
  const stepKey = s.status === 'running' ? `${s.round}|${s.stepIndex}` : s.status;

  // Drive the CSS transition imperatively (CSSOM, allowed by the CSP): jump to the
  // current size, then glide to the step's end size over the remaining time.
  useLayoutEffect(() => {
    const el = circle.current;
    if (!el) return;
    const set = (scale, ms) => { el.style.transitionDuration = `${Math.max(0, ms)}ms`; el.style.transform = `scale(${scale})`; };
    if (s.status === 'running') {
      set(s.scale, 0);
      void el.offsetWidth; // commit the start size before animating
      set(s.targetScale, s.stepRemainingMs);
    } else if (s.status === 'paused') {
      set(s.scale, 0); // freeze exactly where it was
    } else {
      set(MIN_SCALE, 600);
    }
  }, [stepKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useWakeLock(s.status === 'running');

  const running = s.status === 'running';
  const label = running ? s.label
    : s.status === 'paused' ? T.crisisPaused
      : s.status === 'done' ? T.crisisDone
        : pattern.description;

  return (
    <div className="breathing">
      <Chips legend={T.crisisPatternLabel} legendHidden name="breath" options={patterns.map((p) => ({ id: p.id, label: p.name }))}
        defaultSelected={[patterns[0].id]} onChange={(o) => setPattern(patterns.find((p) => p.id === o.id))} />
      <div className="breath-stage">
        <div ref={circle} className="breath-circle" aria-hidden="true" data-kind={running ? s.kind : 'rest'} />
        <p className="breath-count" aria-hidden="true">{running || s.status === 'paused' ? s.secondsLeft : ''}</p>
      </div>
      <p className="breath-label" aria-live="polite">{label}</p>
      <p className="hint">{running || s.status === 'paused' ? T.crisisRound(s.round, s.rounds) : ''}</p>
      <button type="button" className="btn btn-primary" onClick={toggle}>
        {running ? T.crisisPause : s.status === 'paused' ? T.crisisResume : T.crisisStart}
      </button>
    </div>
  );
}
