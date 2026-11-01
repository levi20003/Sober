// "Hogy vagy ma?": egy sor a 12 figurával. Koppintásra alulról felugró lap: erősség (1–5) és egy gondolat, mindkettő opcionális.
// Naponta egyszer kínáljuk fel; mentés után a nap hangulata látszik, és bármikor átírható (a nap utolsó bejegyzése számít).
import { useState } from 'react';
import { HOME, SETUP, T, UX } from '../../content/index.js';
import { MOODS } from '../../domain/presets.js';
import { figureOf, moodOnDay } from '../../domain/moods.js';
import { Actions } from '../../domain/timelineReducer.js';
import { haptic } from '../../lib/haptics.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { MoodFigure } from '../mood/MoodFigures.jsx';
import { Sheet } from '../Info.jsx';

const nameOf = (id) => MOODS.find((m) => m.id === id)?.label ?? '';

/** Vízszintesen görgethető sor; minden figura gomb (név is látszik). */
export function MoodStrip({ selected, onPick }) {
  return (
    <div className="mood-row" role="group" aria-label={HOME.moodTitle}>
      {MOODS.map((m, i) => (
        <button key={m.id} type="button" className={`mood-chip press${selected === m.id ? ' on' : ''}`} aria-pressed={selected === m.id} onClick={() => onPick(m.id)}>
          <MoodFigure mood={m.id} size={48} label={null} animate={selected === m.id} selected={selected === m.id} delay={i * 0.15} />
          <span className="mood-name">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

function MoodSheet({ mood, onClose, onSaved }) {
  const { dispatch } = useTimeline();
  const toast = useToast();
  const [pick, setPick] = useState(mood);
  const [intensity, setIntensity] = useState(3);
  const save = useFormAction(async (fd) => {
    await dispatch({ type: Actions.LOG_CHECKIN, payload: { mood: pick, intensity, note: fd.get('note') } });
    haptic(12);
    toast(HOME.moodSaved(nameOf(pick)));
    onSaved(pick);
  });
  return (
    <Sheet title={HOME.moodTitle} closeLabel={UX.close} onClose={onClose}>
      <div className="mood-sheet-head">
        <MoodFigure mood={pick} size={88} label={null} selected />
        <p className="mood-sheet-name">{nameOf(pick)}</p>
      </div>
      <MoodStrip selected={pick} onPick={setPick} />
      <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined}>
        <label className="field">
          <span>{HOME.moodIntensity} <strong>{intensity} / 5</strong></span>
          <input type="range" className="slider" min="1" max="5" step="1" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} aria-label={HOME.moodIntensity} />
        </label>
        <label className="field">
          <span>{HOME.moodNote}</span>
          <textarea name="note" className="input" rows={2} maxLength={2000} />
        </label>
        <button type="submit" className="btn btn-primary btn-big" disabled={save.busy}>{HOME.moodSave}</button>
      </form>
    </Sheet>
  );
}

/** onSaved(figureId): a főoldal erre reagál (Pötty szavai). */
export function MoodCheckin({ onSaved }) {
  const { snapshot } = useTimeline();
  const { data, today } = snapshot;
  const current = moodOnDay(data.events, today);
  const [open, setOpen] = useState(null);
  const fig = current ? figureOf(current.mood) : null;
  return (
    <section className="card mood-card-home" aria-labelledby="mood-h">
      {fig ? (
        <div className="row">
          <MoodFigure mood={fig.id} size={56} label={null} />
          <div style={{ flex: 1 }}>
            <p className="eyebrow">{SETUP.moodLogged}</p>
            <h2 id="mood-h" className="mood-today">{nameOf(fig.id)}</h2>
          </div>
          <button type="button" className="btn btn-quiet" onClick={() => setOpen(fig.id)}>{HOME.moodChange}</button>
        </div>
      ) : (
        <>
          <h2 id="mood-h">{HOME.moodTitle}</h2>
          <MoodStrip selected={null} onPick={(id) => { haptic(6); setOpen(id); }} />
        </>
      )}
      {open && <MoodSheet mood={open} onClose={() => setOpen(null)} onSaved={(id) => { setOpen(null); onSaved?.(id); }} />}
      <span className="visually-hidden">{T.moodLabel}</span>
    </section>
  );
}
