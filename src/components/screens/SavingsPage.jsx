import { SAVINGS_PAGE as SP, T } from '../../content/index.js';
import { formatHuf } from '../../domain/savings.js';
import { savingsByMonth } from '../../domain/series.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { SavingsWidget } from '../savings/SavingsWidget.jsx';
import { CostEditor, GoalEditor } from '../savings/CostEditor.jsx';
import { ProgressRing } from '../charts/Charts.jsx';
import { Page } from '../shell/Page.jsx';
import { useHashRoute } from '../../hooks/useHashRoute.js';

export function SavingsPage() {
  const { snapshot } = useTimeline();
  const { navigate } = useHashRoute();
  const { data, phases, savings, today } = snapshot;
  const months = savingsByMonth(data.settings.costHistory, phases, today, 6).filter((m) => m.days > 0);
  return (
    <Page title={SP.title}>
      {savings.goal && (
        <section className="card tone tone-lavender" aria-labelledby="sg-h">
          <h2 id="sg-h">{SP.goalTitle}</h2>
          <div className="row">
            <ProgressRing ratio={savings.goal.progress} size={120} stroke={16} color="var(--accent)" label={SP.goalProgress(savings.goal.label, Math.round(savings.goal.progress * 100))}>
              <b>{Math.round(savings.goal.progress * 100)}%</b>
            </ProgressRing>
            <p style={{ flex: 1 }}><strong>{SP.goalProgress(savings.goal.label, Math.round(savings.goal.progress * 100))}</strong></p>
          </div>
        </section>
      )}
      <SavingsWidget savings={savings} onSetup={() => navigate('#/megtakaritas')} />
      {months.length > 0 && (
        <section className="card" aria-labelledby="mon-h">
          <h2 id="mon-h">{SP.perMonthTitle}</h2>
          <ul className="cost-history">{months.map((m) => <li key={m.month}>{SP.monthRow(m.label, m.days, formatHuf(m.amountHuf))}</li>)}</ul>
        </section>
      )}
      <details className="card group">
        <summary><h2>{T.savingsSection}</h2></summary>
        <div className="stack group-body">
          <CostEditor />
          <GoalEditor />
        </div>
      </details>
    </Page>
  );
}
