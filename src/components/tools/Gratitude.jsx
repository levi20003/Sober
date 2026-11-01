import { TOOLS } from '../../content/index.js';
import { Actions } from '../../domain/timelineReducer.js';
import { hash } from '../../domain/daily.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field } from '../ui.jsx';
import { Page } from '../shell/Page.jsx';

const TONES = ['tone-peach', 'tone-lavender', 'tone-mint', 'tone-pink', 'tone-butter', 'tone-sky'];

export function Gratitude() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const notes = snapshot.data.events.filter((e) => e.type === 'gratitude').flatMap((e) => e.items.map((text, i) => ({ id: `${e.id}-${i}`, text }))).reverse();
  const save = useFormAction(async (fd, form) => {
    const items = [1, 2, 3].map((n) => String(fd.get(`g${n}`) ?? '').trim()).filter(Boolean);
    if (items.length === 0) return;
    await dispatch({ type: Actions.LOG_GRATITUDE, payload: { items } });
    form.reset();
    toast(TOOLS.gratitudeSave);
  });
  return (
    <Page title={TOOLS.gratitudeTitle}>
      <section className="card tone tone-butter">
        <h2>{TOOLS.gratitudeTitle}</h2>
        <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined}>
          {[1, 2, 3].map((n) => <Field key={n} label={TOOLS.gratitudeLabel(n)}><input name={`g${n}`} className="input" maxLength={140} autoComplete="off" /></Field>)}
          <button type="submit" className="btn btn-primary" disabled={save.busy}>{TOOLS.gratitudeSave}</button>
        </form>
      </section>
      {notes.length === 0 ? <p className="card card-soft">{TOOLS.gratitudeEmpty}</p> : (
        <div className="note-grid">
          {notes.map((n) => <p key={n.id} className={`sticky tone ${TONES[hash(n.id) % TONES.length]}`} style={{ '--rot': `${(hash(n.id) % 5) - 2}deg` }}>{n.text}</p>)}
        </div>
      )}
    </Page>
  );
}
