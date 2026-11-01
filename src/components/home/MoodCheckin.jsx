// "Hogy vagy ma?": 12 hangulatfigura. Egy koppintás kiválaszt, az erősség (1–5) és egy gondolat opcionális.
// Naponta egyszer kínáljuk fel, de később bármikor átírható (a nap utolsó bejegyzése számít).
import { useState } from 'react';
import { HOME, T } from '../../content/index.js';
import { MOODS } from '../../domain/presets.js';
import { figureOf, moodOnDay } from '../../domain/moods.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { MoodFigure } from '../mood/MoodFigures.jsx';

export function MoodStrip({ name = 'mood', value, onChange }) {
  return (
    <fieldset className="chips" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="visually-hidden">{HOME.moodTitle}</legend>
      <div className="mood-strip">
        {MOODS.map((m, i) => (
          <label className="mood-opt" key={m.id}>
            <input type="radio" name={name} value={m.id} checked={value === m.id} onChange={() => onChange(m.id)} />
            <span className="mood-card">
              <MoodFigure mood={m.id} size={52} label={null} selected={value === m.id} animate={value === m.id} delay={i * 0.15} />
              <span className="mood-name">{m.label}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** onSaved(figureId): a főoldal erre reagál (Pötty szavai). */
export function MoodCheckin({ onSaved }) {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const { data, today } = snapshot;
  const current = moodOnDay(data.events, today);
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState(null);
  const [intensity, setIntensity] = useState(3);

  const save = useFormAction(async (fd) => {
    await dispatch({ type: Actions.LOG_CHECKIN, payload: { mood, intensity, note: fd.get('note') } });
    const fig = figureOf(mood);
    toast(HOME.moodSaved(MOODS.find((m) => m.id === fig.id)?.label ?? ''));
    setEditing(false);
    setMood(null);
    onSaved?.(fig.id);
  });

  if (current && !editing) {
    const fig = figureOf(current.mood);
    const label = MOODS.find((m) => m.id === fig.id)?.label;
    return (
      <section className="card tone tone-pink" aria-labelledby="mood-h">
        <div className="row">
          <MoodFigure mood={fig.id} size={64} label={null} />
          <div style={{ flex: 1 }}>
            <h2 id="mood-h">{HOME.moodToday(label)}</h2>
          </div>
          <button type="button" className="btn" onClick={() => { setMood(fig.id); setEditing(true); }}>{HOME.moodChange}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card tone tone-pink" aria-labelledby="mood-h">
      <h2 id="mood-h">{HOME.moodTitle}</h2>
      <MoodStrip value={mood} onChange={setMood} />
      {mood && (
        <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined}>
          <label className="field">
            <span>{HOME.moodIntensity} <strong>{intensity} / 5</strong></span>
            <input type="range" className="slider" min="1" max="5" step="1" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} aria-label={HOME.moodIntensity} />
          </label>
          <label className="field">
            <span>{HOME.moodNote}</span>
            <textarea name="note" className="input" rows={2} maxLength={2000} />
          </label>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={save.busy}>{HOME.moodSave}</button>
            {editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setMood(null); }}>{T.cancel}</button>}
          </div>
        </form>
      )}
    </section>
  );
}
