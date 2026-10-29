// <FreshStartModal />: the non-punitive slip-up ("újrakezdés") flow.
// Step 1: a calm form (date, what led to it, lesson, intention – all optional but the date).
// Step 2: a growth summary of the archived phase. Never a bare toast, never a reset.

import { useRef, useState } from 'react';
import { T } from '../../content/hu.js';
import { TRIGGERS } from '../../domain/presets.js';
import { Actions } from '../../domain/timelineReducer.js';
import { toDateKey } from '../../domain/dates.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useFormAction } from '../../hooks/useFormAction.js';
import { useModalDialog } from '../../hooks/useModalDialog.js';
import { Chips, Field } from '../ui.jsx';
import { phaseDatesText } from './phaseText.js';

export function FreshStartSummary({ effects, onDone }) {
  const { closedPhase, openedPhase, totalAfter, retroactive, newPhase, splitEarlierPhase } = effects;
  const note = !newPhase ? T.freshSameDay : splitEarlierPhase ? T.freshSplit : retroactive ? T.freshRetro : null;
  return (
    <>
      <h1 id="fresh-h">{T.freshTitle}</h1>
      <section className="card phase-card fresh-closed">
        <p className="stat-label">{`${T.freshClosedLabel} · ${T.phaseLabel(closedPhase.index + 1)}`}</p>
        <p className="phase-days">{T.freshClosed(closedPhase.days)}</p>
        <p className="hint">{phaseDatesText(closedPhase, '')}</p>
        <p className="hero-sub"><strong>{T.freshTotal(totalAfter)}</strong></p>
        <p className="hint">{T.totalSoberHint}</p>
      </section>
      {note && <p className="card card-soft">{note}</p>}
      {closedPhase.lessons.length > 0 && <p className="hint">{T.freshLessonSaved}</p>}
      {openedPhase.intentions.length > 0 && (
        <section className="card card-soft">
          <p className="stat-label">{T.freshIntention}</p>
          {openedPhase.intentions.map((t, i) => <p key={i}>{t}</p>)}
        </section>
      )}
      <p className="lead">{T.freshKind}</p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onDone}>{T.freshContinue}</button>
        <a className="btn btn-ghost" href={CRISIS_HASH}>{T.helpButtonShort}</a>
      </div>
    </>
  );
}

export function FreshStartModal({ onClose }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  const { snapshot, dispatch } = useTimeline();
  const [effects, setEffects] = useState(null);
  const today = toDateKey();

  const { onSubmit, busy } = useFormAction(async (fd) => {
    const fx = await dispatch({
      type: Actions.FRESH_START,
      payload: { date: fd.get('date'), triggers: fd.getAll('triggers'), lesson: fd.get('lesson'), intention: fd.get('intention'), note: fd.get('note') },
    });
    setEffects(fx);
    ref.current?.scrollTo?.(0, 0);
  });

  return (
    <dialog ref={ref} className="sheet-dialog" aria-labelledby="fresh-h">
      <div className="screen">
        {effects ? <FreshStartSummary effects={effects} onDone={onClose} /> : (
          <>
            <h1 id="fresh-h">{T.slipTitle}</h1>
            <p className="lead">{T.slipIntro}</p>
            <section className="card">
              <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
                <Field label={T.slipDateLabel}>
                  <input type="date" name="date" className="input" defaultValue={today} max={today} min={snapshot.data.profile.journeyStart} required />
                </Field>
                <Chips legend={T.slipWhatLabel} name="triggers" options={TRIGGERS} multiple />
                <Field label={T.slipLessonLabel}><textarea name="lesson" className="input" rows={3} maxLength={2000} /></Field>
                <Field label={T.slipIntentionLabel}><textarea name="intention" className="input" rows={2} maxLength={2000} /></Field>
                <Field label={T.noteLabel}><textarea name="note" className="input" rows={2} maxLength={2000} /></Field>
                <div className="actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>{T.slipConfirm}</button>
                  <button type="button" className="btn btn-ghost" onClick={onClose}>{T.cancel}</button>
                </div>
              </form>
            </section>
            <p className="hint">{T.slipSupport}</p>
          </>
        )}
      </div>
    </dialog>
  );
}
