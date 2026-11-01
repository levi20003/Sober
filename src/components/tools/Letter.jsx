// Levél önmagadnak: titkosított esemény. Nehéz pillanatban vagy mérföldkőnél előbukkan.
import { TOOLS } from '../../content/index.js';
import { Actions } from '../../domain/timelineReducer.js';
import { formatDateHu } from '../../domain/dates.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field } from '../ui.jsx';
import { TitleWithInfo } from '../Info.jsx';
import { Page } from '../shell/Page.jsx';

/** A legutóbbi levél a megadott alkalomra, vagy null. */
export function pickLetter(events, when) {
  const list = events.filter((e) => e.type === 'letter' && e.when === when);
  return list.at(-1) ?? null;
}

export function LetterCard({ events, when }) {
  const l = pickLetter(events, when);
  if (!l) return null;
  return (
    <section className="card tone tone-pink" aria-labelledby="letter-h">
      <h2 id="letter-h">{TOOLS.letterOpen}</h2>
      <p className="hint">{formatDateHu(l.date)}</p>
      <p className="entry-note">{l.note}</p>
    </section>
  );
}

export function Letter() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const letters = snapshot.data.events.filter((e) => e.type === 'letter').reverse();
  const save = useFormAction(async (fd, form) => {
    const note = String(fd.get('note') ?? '').trim();
    if (!note) return;
    await dispatch({ type: Actions.LOG_LETTER, payload: { note, when: fd.get('when') === 'milestone' ? 'milestone' : 'hard' } });
    form.reset();
    toast(TOOLS.letterSaved);
  });
  return (
    <Page title={TOOLS.letterTitle}>
      <section className="card tone tone-pink">
        <TitleWithInfo title={TOOLS.letterTitle} info={<p>{TOOLS.letterText}</p>} />
        <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined}>
          <Field label={TOOLS.letterLabel}><textarea name="note" className="input" rows={6} maxLength={2000} required /></Field>
          <fieldset className="chips">
            <legend>{TOOLS.letterWhen}</legend>
            <label className="check"><input type="radio" name="when" value="hard" defaultChecked /><span>{TOOLS.letterWhenHard}</span></label>
            <label className="check"><input type="radio" name="when" value="milestone" /><span>{TOOLS.letterWhenMilestone}</span></label>
          </fieldset>
          <button type="submit" className="btn btn-primary" disabled={save.busy}>{TOOLS.letterSave}</button>
        </form>
      </section>
      {letters.length === 0 ? <p className="card card-soft">{TOOLS.letterEmpty}</p> : letters.map((l) => (
        <article key={l.id} className="card"><p className="hint">{formatDateHu(l.date)} · {l.when === 'milestone' ? TOOLS.letterWhenMilestone : TOOLS.letterWhenHard}</p><p className="entry-note">{l.note}</p></article>
      ))}
    </Page>
  );
}
