// <TimelineView />: the journal as a continuous growth history – total sober days,
// a proportional timeline bar, and one card per phase (newest first).

import { T, MISC } from '../../content/index.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Screen } from '../ui.jsx';
import { TimelineBar } from './TimelineBar.jsx';
import { PhaseCard } from './PhaseCard.jsx';

export function TimelineBody() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const { phases, stats, today, savings } = snapshot;

  const onDelete = async (e) => {
    if (!confirm(T.deleteEntryConfirm)) return;
    await dispatch({ type: Actions.DELETE_ENTRY, payload: { id: e.id } });
    toast(MISC.entryDeleted);
  };

  const empty = phases.every((p) => p.entries.length === 0);
  return (
    <>
      <section className="card">
        <h2>{T.timelineTitle}</h2>
        <p className="hero-sub">{`${T.totalSober}: `}<strong>{T.days(stats.totalSoberDays)}</strong></p>
        <TimelineBar phases={phases} totalSoberDays={stats.totalSoberDays} />
      </section>
      {empty && <p className="card">{T.journalEmpty}</p>}
      {[...phases].reverse().map((p, i) => (
        <PhaseCard key={p.start} phase={p} today={today} onDelete={onDelete} open={i === 0} savedHuf={savings.perPhase[p.index]} />
      ))}
    </>
  );
}

export function TimelineView() {
  return (
    <Screen>
      <h1>{T.journalTitle}</h1>
      <TimelineBody />
    </Screen>
  );
}
