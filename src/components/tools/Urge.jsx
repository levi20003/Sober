// "Most nagyon kívánom": 10 perces hullám-időzítő, légzés, elterelések, saját okok. Az "Elmúlt?" válasz győzelemként kerül az idővonalra.
import { useEffect, useMemo, useRef, useState } from 'react';
import { TOOLS, T, MISC } from '../../content/index.js';
import { createCountdown, formatClock, URGE_DURATION_MS } from '../../domain/countdown.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Companion, companionOf } from '../companions/Companion.jsx';
import { Confetti } from '../Confetti.jsx';
import { Page } from '../shell/Page.jsx';
import { LetterCard } from './Letter.jsx';

export function Urge() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const { data } = snapshot;
  const [cd, setCd] = useState(null);
  const [result, setResult] = useState(null); // 'passed' | 'still'
  const [state, setState] = useState(() => ({ status: 'idle', secondsLeft: URGE_DURATION_MS / 1000, progress: 0, level: 'rising', elapsedMs: 0 }));
  useEffect(() => {
    const c = createCountdown({ onChange: setState });
    setCd(c);
    return () => c.reset?.();
  }, []);
  const tip = useMemo(() => TOOLS.urgeDistractions[Math.floor((state.elapsedMs ?? 0) / 90_000) % TOOLS.urgeDistractions.length], [state.elapsedMs]);
  const reasons = data.profile.reasons ?? [];

  const answer = async (outcome) => {
    const seconds = Math.min(86400, Math.round((state.elapsedMs ?? 0) / 1000));
    cd?.reset();
    try { await dispatch({ type: Actions.LOG_URGE, payload: { seconds, outcome } }); } catch (e) { toast(e.message, 'error'); return; }
    setResult(outcome);
  };

  if (result) {
    return (
      <Page title={TOOLS.urgeTitle}>
        <section className="card tone tone-mint urge">
          {result === 'passed' && <Confetti />}
          <Companion kind={companionOf(data.profile)} look={result === 'passed' ? 'celebrate' : 'comfort'} size={120} animate />
          <h2>{result === 'passed' ? TOOLS.urgeVictory : TOOLS.urgeStillText}</h2>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => setResult(null)}>{TOOLS.urgeAgain}</button>
          </div>
        </section>
        {result === 'still' && <LetterCard events={data.events} when="hard" />}
      </Page>
    );
  }

  const running = state.status === 'running';
  const started = state.status !== 'idle';
  return (
    <Page title={TOOLS.urgeTitle}>
      <section className="card tone tone-lavender urge" aria-labelledby="urge-h">
        <h2 id="urge-h">{TOOLS.urgeTitle}</h2>
        <p>{TOOLS.urgeText}</p>
        <p className="urge-clock" role="timer" aria-label={MISC.urgeTimer(state.secondsLeft)}>{formatClock(state.secondsLeft)}</p>
        <div className="wave-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0.02, state.progress ?? 0)})` }} /></div>
        {started && <p aria-live="polite"><strong>{TOOLS.urgeLevels[state.level] ?? ''}</strong></p>}
        <div className="breath-blob" aria-hidden="true" />
        <p>{TOOLS.urgeBreathe}</p>
        <div className="actions" style={{ justifyContent: 'center' }}>
          {state.status === 'done'
            ? <button type="button" className="btn btn-primary" onClick={() => cd.reset()}>{TOOLS.urgeAgain}</button>
            : <button type="button" className="btn btn-primary btn-big" onClick={() => cd?.toggle()}>{running ? TOOLS.urgePause : started ? TOOLS.urgeResume : TOOLS.urgeStart}</button>}
        </div>
      </section>
      {started && (
        <section className="card tone tone-peach"><p className="stat-label">{MISC.urgeTry}</p><p className="quote">{tip}</p></section>
      )}
      {reasons.length > 0 && (
        <section className="card tone tone-butter" aria-labelledby="why-h">
          <h2 id="why-h">{TOOLS.urgeReasons}</h2>
          <ul className="reason-list">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </section>
      )}
      <section className="card urge" aria-labelledby="ask-h">
        <h2 id="ask-h">{TOOLS.urgeAsk}</h2>
        <div className="actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-primary" onClick={() => answer('passed')}>{TOOLS.urgePassed}</button>
          <button type="button" className="btn" onClick={() => answer('still')}>{TOOLS.urgeStill}</button>
        </div>
      </section>
    </Page>
  );
}
