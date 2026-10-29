import { T } from '../../content/hu.js';
import { formatHuf } from '../../domain/savings.js';
import { Progress } from '../ui.jsx';

export function SavingsWidget({ savings: s, onSetup }) {
  if (!s.configured) {
    return (
      <section className="card savings">
        <h2>{T.saved}</h2>
        <p className="hint">{T.savedSetup}</p>
        <button type="button" className="btn btn-ghost" onClick={onSetup}>{T.costTitle}</button>
      </section>
    );
  }
  const m = s.milestones;
  return (
    <section className="card savings" aria-labelledby="savings-h">
      <h2 id="savings-h" className="stat-label">{T.saved}</h2>
      <p className="savings-total">{formatHuf(s.total)}</p>
      {/* Like the phase cards: never greet someone right after a slip with a bare "0 Ft". */}
      {s.currentPhase > 0 && s.currentPhase < s.total && <p className="hint">{T.savingsCurrentPhase(formatHuf(s.currentPhase))}</p>}
      {s.daily > 0 && <p className="hint">{T.savingsPerMonth(formatHuf(s.perMonth))}</p>}
      {s.goal && (
        <div className="savings-goal">
          <p><strong>{`${T.savingsGoal}: ${s.goal.label}`}</strong>{` (${formatHuf(s.goal.amountHuf)})`}</p>
          <Progress value={s.goal.progress} label={s.goal.label} />
          <p className="hint">{s.goal.reached ? T.savingsGoalReached : T.savingsGoalRemaining(formatHuf(s.goal.remaining))}</p>
        </div>
      )}
      {m.achieved.length > 0 && <p className="savings-achieved">{`${T.savingsAchieved} `}<strong>{m.achieved.at(-1).label}</strong></p>}
      {m.next ? (
        <div>
          <Progress value={m.progress} label={m.next.label} />
          <p className="hint">{T.savingsNext(m.next.label, formatHuf(m.remaining))}</p>
        </div>
      ) : <p className="hint">{T.savingsAllMilestones}</p>}
      {s.changedOverTime && <p className="hint">{T.savingsChanged}</p>}
      <p className="hint savings-estimate">{T.savingsEstimate}</p>
    </section>
  );
}
