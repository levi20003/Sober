import { T } from '../../content/hu.js';
import { formatDateHu } from '../../domain/dates.js';
import { formatHuf } from '../../domain/savings.js';
import { formatTimeHu } from '../../lib/format.js';
import { phaseDatesText, phaseHeadline, eventDetails } from './phaseText.js';

export function EntryItem({ event: e, onDelete }) {
  return (
    <li className={`entry entry-${e.type}`}>
      <div className="entry-head">
        <span className="entry-type">{T.typeLabels[e.type]}</span>
        <time dateTime={e.at} className="hint">{`${formatDateHu(e.date)} · ${formatTimeHu(e.at)}`}</time>
      </div>
      {eventDetails(e).map((l) => <p className="entry-line" key={l}>{l}</p>)}
      {e.note && <p className="entry-note">{e.note}</p>}
      {onDelete && <button type="button" className="btn-link" onClick={() => onDelete(e)}>{T.deleteEntry}</button>}
    </li>
  );
}

/** One phase as a growth block. Closed phases are archived: their numbers never change. */
export function PhaseCard({ phase: p, today, onDelete, open = false, savedHuf = 0 }) {
  return (
    <article className={`card phase-card${p.current ? ' phase-current' : ''}`}>
      <div className="phase-head">
        <h3>{T.phaseLabel(p.index + 1)}</h3>
        <span className={`phase-badge${p.current ? ' current' : ''}`}>{p.current ? T.phaseCardCurrent : T.phaseCardClosed}</span>
      </div>
      <p className="phase-days">{phaseHeadline(p, today)}</p>
      <p className="hint">{phaseDatesText(p, today)}</p>
      {p.intentions.length > 0 && (
        <div className="phase-note">
          <p className="stat-label">{p.current ? T.phaseIntentionsCurrent : T.phaseIntentionsClosed}</p>
          {p.intentions.map((t, i) => <p key={i}>{t}</p>)}
        </div>
      )}
      {p.lessons.length > 0 && (
        <div className="phase-note">
          <p className="stat-label">{T.phaseLessons}</p>
          {p.lessons.map((t, i) => <p key={i}>{t}</p>)}
        </div>
      )}
      {p.checkins + p.coped > 0 && <p className="hint">{T.phaseCounts(p.checkins, p.coped)}</p>}
      {savedHuf > 0 && <p className="hint phase-saved">{T.savingsPhase(formatHuf(savedHuf))}</p>}
      {p.entries.length > 0 && (
        <details open={open}>
          <summary>{T.phaseEntriesToggle(p.entries.length)}</summary>
          <ul className="entries">{p.entries.map((e) => <EntryItem key={e.id} event={e} onDelete={onDelete} />)}</ul>
        </details>
      )}
    </article>
  );
}
