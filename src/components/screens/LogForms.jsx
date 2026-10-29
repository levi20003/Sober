// Full logging forms (the quick-log cards on Home cover the 2-tap path).

import { T } from '../../content/hu.js';
import { MOODS, TRIGGERS, COPING, OUTCOMES, SLEEP_LEVELS, CRAVING_LEVELS } from '../../domain/presets.js';
import { Actions } from '../../domain/timelineReducer.js';
import { userError } from '../../lib/errors.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Chips, Field, Screen } from '../ui.jsx';

function useLogAction(build) {
  const { dispatch } = useTimeline();
  const { navigate } = useHashRoute();
  const toast = useToast();
  return useFormAction(async (fd) => {
    await dispatch(build(fd));
    toast(T.saved_ok);
    navigate('#/');
  });
}

function FormButtons({ busy }) {
  const { navigate } = useHashRoute();
  return (
    <div className="actions">
      <button type="submit" className="btn btn-primary" disabled={busy}>{T.save}</button>
      <button type="button" className="btn btn-ghost" onClick={() => navigate('#/')}>{T.cancel}</button>
    </div>
  );
}

const num = (fd, k) => (fd.get(k) === null ? undefined : Number(fd.get(k)));

export function CheckinForm() {
  const { onSubmit, busy } = useLogAction((fd) => ({
    type: Actions.LOG_CHECKIN,
    payload: { mood: fd.get('mood') ?? undefined, sleep: num(fd, 'sleep'), craving: num(fd, 'craving'), triggers: fd.getAll('triggers'), note: fd.get('note') },
  }));
  return (
    <Screen>
      <h1>{T.actionCheckin}</h1>
      <section className="card">
        <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
          <Chips legend={T.moodLabel} name="mood" options={MOODS} />
          <Chips legend={T.sleepLabel} name="sleep" options={SLEEP_LEVELS} />
          <Chips legend={T.cravingLabel} name="craving" options={CRAVING_LEVELS} />
          <Chips legend={T.checkinTriggersLabel} name="triggers" options={TRIGGERS} multiple />
          <Field label={T.noteLabel}><textarea name="note" className="input" rows={3} maxLength={2000} /></Field>
          <FormButtons busy={busy} />
        </form>
      </section>
    </Screen>
  );
}

export function TriggerForm() {
  const { onSubmit, busy } = useLogAction((fd) => ({
    type: Actions.LOG_TRIGGER,
    payload: {
      triggers: fd.getAll('triggers'), coping: fd.getAll('coping'),
      intensity: Number(fd.get('intensity') ?? 3), outcome: fd.get('outcome') ?? undefined, note: fd.get('note'),
    },
  }));
  return (
    <Screen>
      <h1>{T.triggerTitle}</h1>
      <p className="lead">{T.triggerIntro}</p>
      <section className="card">
        <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
          <Chips legend={T.triggersLabel} name="triggers" options={TRIGGERS} multiple />
          <Chips legend={T.intensityLabel} name="intensity" options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: String(n) }))} defaultSelected={[3]} />
          <Chips legend={T.copingLabel} name="coping" options={COPING} multiple />
          <Chips legend={T.outcomeLabel} name="outcome" options={OUTCOMES} />
          <Field label={T.noteLabel}><textarea name="note" className="input" rows={3} maxLength={2000} /></Field>
          <FormButtons busy={busy} />
        </form>
      </section>
    </Screen>
  );
}

export function NoteForm() {
  const { onSubmit, busy } = useLogAction((fd) => {
    if (!String(fd.get('note')).trim()) throw userError(T.noteEmpty);
    return { type: Actions.LOG_NOTE, payload: { note: fd.get('note') } };
  });
  return (
    <Screen>
      <h1>{T.noteTitle}</h1>
      <section className="card">
        <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
          <Field label={T.noteTitle}><textarea name="note" className="input" rows={6} maxLength={2000} required /></Field>
          <FormButtons busy={busy} />
        </form>
      </section>
    </Screen>
  );
}
