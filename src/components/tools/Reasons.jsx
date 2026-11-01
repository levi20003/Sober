import { useState } from 'react';
import { TOOLS } from '../../content/index.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Icon } from '../icons/Icon.jsx';
import { Page } from '../shell/Page.jsx';

export function Reasons() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const reasons = snapshot.data.profile.reasons ?? [];
  const [text, setText] = useState('');
  const write = async (next) => { try { await dispatch({ type: Actions.UPDATE_PROFILE, payload: { reasons: next } }); } catch (e) { toast(e.message, 'error'); } };
  const add = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || reasons.includes(t) || reasons.length >= 12) return;
    await write([...reasons, t]);
    setText('');
  };
  return (
    <Page title={TOOLS.reasonsTitle}>
      <section className="card tone tone-butter">
        <h2>{TOOLS.reasonsTitle}</h2>
        <p>{TOOLS.reasonsText}</p>
        <form className="row" onSubmit={add}>
          <input className="input" aria-label={TOOLS.reasonLabel} placeholder={TOOLS.reasonLabel} value={text} maxLength={140} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-primary">{TOOLS.reasonAdd}</button>
        </form>
      </section>
      {reasons.length === 0 ? <p className="card card-soft">{TOOLS.reasonsEmpty}</p> : (
        <ul className="entries">
          {reasons.map((r) => (
            <li className="entry row-between" key={r}><span>{r}</span>
              <button type="button" className="btn-link" aria-label={`Törlés: ${r}`} onClick={() => write(reasons.filter((x) => x !== r))}><Icon name="trash" size={20} /></button>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
