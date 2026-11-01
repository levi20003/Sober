import { useState } from 'react';
import { RISK_MESSAGES, HOME, T } from '../../content/hu.js';
import { riskContexts } from '../../domain/risk.js';
import { formatDateHu } from '../../domain/dates.js';
import { figureOf, moodOnDay } from '../../domain/moods.js';
import { uncelebratedMilestone } from '../../domain/milestones.js';
import { Actions } from '../../domain/timelineReducer.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useUpdate } from '../../hooks/useUpdate.js';
import { Mascot } from '../mood/Mascot.jsx';
import { FreshStartModal } from '../timeline/FreshStartModal.jsx';
import { MoodCheckin } from '../home/MoodCheckin.jsx';
import { Celebration } from '../home/Celebration.jsx';
import { Badges, DailyThoughts, DayCounter, EnergyStress, GoalCard, SavingsCard, WeekGlance, WeekMoods } from '../home/Widgets.jsx';
import { Page } from '../shell/Page.jsx';
import { UPDATE } from '../../content/hu.js';

const reactionFor = (figId) => {
  const v = figureOf(figId)?.valence ?? 0;
  return v > 0 ? 'positive' : v < 0 ? 'hard' : 'neutral';
};

export function Home() {
  const { snapshot, dispatch } = useTimeline();
  const update = useUpdate();
  const [freshStart, setFreshStart] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const { data, stats: s, phases, savings, today } = snapshot;
  const profile = data.profile;
  const risk = riskContexts(new Date(), data.events)[0];
  const freshToday = s.currentPhaseDays === 0 && s.phaseCount > 1;
  const todayMood = moodOnDay(data.events, today);
  const milestone = celebrated ? null : uncelebratedMilestone(s.totalSoberDays, profile.lastCelebration ?? 0);
  const goal = profile.goalDays ? { goal: profile.goalDays, shown: Math.min(s.totalSoberDays, profile.goalDays), ratio: Math.min(1, s.totalSoberDays / profile.goalDays) } : null;
  const tags = [...(profile.triggers ?? [])];

  const bubble = freshToday ? HOME.pottyReact.slip
    : reaction ? HOME.pottyReact[reaction]
    : todayMood ? HOME.pottyReact[reactionFor(todayMood.mood)]
    : HOME.helloBubble(profile.nickname, false);
  const look = freshToday ? 'comfort' : (reaction ?? (todayMood && reactionFor(todayMood.mood))) === 'hard' ? 'comfort' : (reaction || todayMood) ? 'cheer' : 'wave';

  return (
    <Page title={T.navHome}>
      {update.ready && (
        <div className="update-banner" role="status">
          <span>{UPDATE.banner}</span>
          <button type="button" className="btn btn-primary" onClick={update.apply}>{UPDATE.apply}</button>
        </div>
      )}
      {risk && (
        <a className="card risk-banner" href={CRISIS_HASH}>
          <strong>{RISK_MESSAGES[risk].title}</strong><span>{RISK_MESSAGES[risk].text}</span>
        </a>
      )}
      <div className="hello rise-in">
        <Mascot look={look} size={72} label={null} />
        <p className="bubble" aria-live="polite">{bubble}</p>
      </div>
      <div className="rise-in" style={{ '--d': '60ms' }}>
        <DayCounter stats={s} phases={phases} goal={goal} freshToday={freshToday} currentSince={formatDateHu(s.currentPhaseStart)} />
      </div>
      <GoalCard total={s.totalSoberDays} goalDays={profile.goalDays} />
      <SavingsCard savings={savings} today={today} />
      <MoodCheckin onSaved={(fig) => setReaction(reactionFor(fig))} />
      <WeekGlance events={data.events} today={today} journeyStart={profile.journeyStart} />
      <WeekMoods events={data.events} today={today} />
      <EnergyStress events={data.events} today={today} />
      <Badges total={s.totalSoberDays} />
      <DailyThoughts today={today} tags={tags} />
      {freshToday && <p className="card card-soft">{HOME.slipKind}</p>}
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => setFreshStart(true)}>{T.actionSlip}</button>
      </div>
      {freshStart && <FreshStartModal onClose={() => setFreshStart(false)} />}
      {milestone && (
        <Celebration days={milestone} onClose={async () => { setCelebrated(true); await dispatch({ type: Actions.UPDATE_PROFILE, payload: { lastCelebration: milestone } }).catch(() => {}); }} />
      )}
    </Page>
  );
}
