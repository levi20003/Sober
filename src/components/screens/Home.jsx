// Főoldal: egyértelmű hierarchia. Fent a legfontosabb szám (összes józan nap a cél felé), alatta egy gyors hangulat-rögzítés,
// két kis csempe (megtakarítás, következő mérföldkő), a hét, és egy napi gondolat. A részletes statisztika az Idővonalon van.
import { useState } from 'react';
import { RISK_MESSAGES, HOME, T } from '../../content/index.js';
import { riskContexts } from '../../domain/risk.js';
import { formatDateHu } from '../../domain/dates.js';
import { phaseStartInstant } from '../../domain/elapsed.js';
import { figureOf, moodOnDay } from '../../domain/moods.js';
import { uncelebratedMilestone } from '../../domain/milestones.js';
import { Actions } from '../../domain/timelineReducer.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { Mascot } from '../mood/Mascot.jsx';
import { BackupNotice } from '../home/Notices.jsx';
import { MoodCheckin } from '../home/MoodCheckin.jsx';
import { SetupCard } from '../home/SetupCard.jsx';
import { Celebration } from '../home/Celebration.jsx';
import { DailyThought, Hero, Tiles, WeekGlance } from '../home/Widgets.jsx';
import { Page } from '../shell/Page.jsx';

const reactionFor = (figId) => {
  const v = figureOf(figId)?.valence ?? 0;
  return v > 0 ? 'positive' : v < 0 ? 'hard' : 'neutral';
};

export function Home() {
  const { snapshot, dispatch } = useTimeline();
  const [reaction, setReaction] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const { data, stats: s, phases, savings, today } = snapshot;
  const profile = data.profile;
  const risk = riskContexts(new Date(), data.events)[0];
  const freshToday = s.currentPhaseDays === 0 && s.phaseCount > 1;
  const todayMood = moodOnDay(data.events, today);
  const milestone = celebrated ? null : uncelebratedMilestone(s.totalSoberDays, profile.lastCelebration ?? 0);

  const mood = reaction ?? (todayMood && reactionFor(todayMood.mood));
  const bubble = freshToday ? HOME.pottyReact.slip : mood ? HOME.pottyReact[mood] : HOME.helloBubble(profile.nickname, false);
  const look = freshToday || mood === 'hard' ? 'comfort' : mood ? 'cheer' : 'wave';

  return (
    <Page title={T.navHome}>
      {risk && (
        <a className="card risk-banner" href={CRISIS_HASH}>
          <strong>{RISK_MESSAGES[risk].title}</strong><span>{RISK_MESSAGES[risk].text}</span>
        </a>
      )}
      <div className="hello rise-in">
        <Mascot look={look} size={48} label={null} />
        <p className="bubble" aria-live="polite">{bubble}</p>
      </div>
      <div className="rise-in" style={{ '--d': '40ms' }}>
        <Hero stats={{ ...s, today }} phases={phases} goalDays={profile.goalDays} freshToday={freshToday} currentSince={formatDateHu(s.currentPhaseStart)}
          liveStart={phaseStartInstant(s.currentPhaseStart, s.phaseCount > 1 ? null : profile.journeyStartAt)} />
      </div>
      <div className="rise-in" style={{ '--d': '80ms' }}>
        <SetupCard profile={profile} savingsConfigured={savings.configured} />
        <MoodCheckin onSaved={(fig) => setReaction(reactionFor(fig))} />
      </div>
      <div className="rise-in" style={{ '--d': '120ms' }}>
        <Tiles savings={savings} total={s.totalSoberDays} today={today} />
        <WeekGlance events={data.events} today={today} journeyStart={profile.journeyStart} />
        <DailyThought today={today} tags={profile.triggers ?? []} />
      </div>
      {milestone && (
        <Celebration days={milestone} onClose={async () => { setCelebrated(true); await dispatch({ type: Actions.UPDATE_PROFILE, payload: { lastCelebration: milestone } }).catch(() => {}); }} />
      )}
      <BackupNotice data={data} suppressed={Boolean(milestone)} />
    </Page>
  );
}
