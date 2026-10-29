// Quick log: preset cards on the home screen. Two taps: card → "Rögzítés".
// The confirmation step guards against accidental taps; everything in it is
// optional (intensity for difficult moments, an encrypted note).

import { useRef, useState } from 'react';
import { T } from '../content/hu.js';
import { QUICK_TEMPLATES, quickLogAction } from '../domain/presets.js';
import { useTimeline } from '../hooks/useTimeline.js';
import { useToast } from '../hooks/useToast.jsx';
import { useFormAction } from '../hooks/useFormAction.js';
import { useModalDialog } from '../hooks/useModalDialog.js';
import { Chips, Field } from './ui.jsx';

function QuickLogDialog({ template, onClose }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  const { dispatch } = useTimeline();
  const toast = useToast();
  const { onSubmit, busy } = useFormAction(async (fd) => {
    await dispatch(quickLogAction(template, { intensity: fd.get('intensity'), note: fd.get('note') }));
    toast(T.quickLogged(template.label));
    onClose();
  });
  return (
    <dialog ref={ref} className="quick-dialog" aria-labelledby="quick-title">
      <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
        <h2 id="quick-title">{template.label}</h2>
        {template.kind === 'trigger' && (
          <Chips legend={T.quickIntensityLabel} name="intensity" options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: String(n) }))} />
        )}
        <Field label={T.quickNoteLabel}><textarea name="note" className="input" rows={2} maxLength={2000} /></Field>
        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={busy} autoFocus>{T.quickSave}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{T.cancel}</button>
        </div>
      </form>
    </dialog>
  );
}

export function QuickLog() {
  const [template, setTemplate] = useState(null);
  const card = (t) => (
    <button key={t.id} type="button" className={`quick-card quick-${t.kind}`} data-template={t.id} onClick={() => setTemplate(t)}>{t.label}</button>
  );
  return (
    <section className="card quick-log" aria-labelledby="quick-h">
      <h2 id="quick-h">{T.quickTitle}</h2>
      <p className="hint">{T.quickHint}</p>
      <p className="stat-label">{T.quickTriggerGroup}</p>
      <div className="quick-grid">{QUICK_TEMPLATES.filter((t) => t.kind === 'trigger').map(card)}</div>
      <p className="stat-label">{T.quickMoodGroup}</p>
      <div className="quick-grid">{QUICK_TEMPLATES.filter((t) => t.kind === 'mood').map(card)}</div>
      {template && <QuickLogDialog key={template.id} template={template} onClose={() => setTemplate(null)} />}
    </section>
  );
}
