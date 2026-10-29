import { useState } from 'react';
import { T, RISK_MESSAGES } from '../../content/hu.js';
import { riskContexts } from '../../domain/risk.js';
import { formatDateHu } from '../../domain/dates.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { Screen } from '../ui.jsx';
import { TimelineBar } from '../timeline/TimelineBar.jsx';
import { FreshStartModal } from '../timeline/FreshStartModal.jsx';
import { SavingsWidget } from '../savings/SavingsWidget.jsx';
import { QuickLog } from '../QuickLog.jsx';

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Home() {
  const { snapshot } = useTimeline();
  const { navigate } = useHashRoute();
  const [freshStart, setFreshStart] = useState(false);
  const { data, stats: s, phases, savings } = snapshot;
  const risk = riskContexts(new Date(), data.events)[0];
  const sleepText = s.sleep.delta === null ? null : s.sleep.delta > 0.2 ? T.sleepBetter : s.sleep.delta < -0.2 ? T.sleepWorse : T.sleepSame;
  const freshToday = s.currentPhaseDays === 0 && s.phaseCount > 1;

  return (
    <Screen>
      <h1 className="visually-hidden">{T.navHome}</h1>
      {risk && (
        <a className="card card-soft risk-banner" href={CRISIS_HASH}>
          <strong>{RISK_MESSAGES[risk].title}</strong><span>{RISK_MESSAGES[risk].text}</span>
        </a>
      )}

      {/* Hero: the accumulated total leads; the current phase sits beside it, never alone. */}
      <section className="card hero" aria-label={T.totalSober}>
        <p className="stat-label">{T.totalSober}</p>
        <p className="hero-value">{T.days(s.totalSoberDays)}</p>
        <p className="hero-sub">{freshToday ? T.phaseZero : T.heroCurrent(s.currentPhaseDays, formatDateHu(s.currentPhaseStart))}</p>
        {s.phaseCount > 1 && <TimelineBar phases={phases} totalSoberDays={s.totalSoberDays} />}
        <p className="hint">{T.totalSoberHint}</p>
      </section>

      <QuickLog />
      <SavingsWidget savings={savings} onSetup={() => navigate('#/beallitasok')} />

      <section className="stats">
        {s.phaseCount > 1 && <Stat label={T.longestPhase} value={T.days(s.longestPhaseDays)} />}
        <Stat label={T.coped} value={String(s.copedCount)} />
        {s.sleep.recent !== null && <Stat label={T.sleepTrend} value={`${s.sleep.recent.toFixed(1)} / 5`} hint={sleepText} />}
      </section>

      <section className="card">
        <h2>{T.checkinPrompt}</h2>
        {s.checkedInToday && <p>{T.checkinDone}</p>}
        <div className="actions">
          {!s.checkedInToday && <button type="button" className="btn btn-primary" onClick={() => navigate('#/rogzites/bejelentkezes')}>{T.actionCheckin}</button>}
          <button type="button" className="btn" onClick={() => navigate('#/rogzites/nehez-pillanat')}>{T.actionTrigger}</button>
          <button type="button" className="btn" onClick={() => navigate('#/rogzites/jegyzet')}>{T.actionNote}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setFreshStart(true)}>{T.actionSlip}</button>
        </div>
      </section>
      {freshStart && <FreshStartModal onClose={() => setFreshStart(false)} />}
    </Screen>
  );
}
