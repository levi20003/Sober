import { CHALLENGE_CATALOG, TOOLS } from '../../content/hu.js';
import { challengeStats, challengesOfDay } from '../../domain/challenges.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Icon } from '../icons/Icon.jsx';

export function Challenges() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const { data, today } = snapshot;
  const tags = data.profile.triggers ?? [];
  const list = challengesOfDay(CHALLENGE_CATALOG, today, tags, 3);
  const stats = challengeStats(data.events, today);
  const done = new Set(stats.doneToday.map((d) => d.id));
  const complete = async (id) => { try { await dispatch({ type: Actions.LOG_CHALLENGE, payload: { challengeId: id } }); } catch (e) { toast(e.message, 'error'); } };
  return (
    <section className="card tone tone-mint" aria-labelledby="ch-h">
      <div className="row-between">
        <h2 id="ch-h">{TOOLS.challengesTitle}</h2>
        <span className="flame" data-flame={stats.flame} aria-label={TOOLS.challengeStreak(stats.last7)}>
          <Icon name="flame" size={26} />{stats.last7}
        </span>
      </div>
      {list.map((c) => {
        const isDone = done.has(c.id);
        return (
          <div key={c.id} className={`challenge tone tone-lavender${isDone ? ' done' : ''}`}>
            <p>{c.text}</p>
            {isDone ? <span className="pill"><Icon name="check" size={16} />{TOOLS.challengeDone}</span>
              : <button type="button" className="btn btn-primary" onClick={() => complete(c.id)}>{TOOLS.challengeDo}</button>}
          </div>
        );
      })}
      <p className="hint">{TOOLS.challengeTotal(stats.totalDays)}</p>
      <p className="hint">{TOOLS.challengeSkipNote}</p>
    </section>
  );
}
