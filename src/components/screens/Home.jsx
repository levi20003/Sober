// Főoldal: egyértelmű hierarchia. Fent a legfontosabb szám (összes józan nap a cél felé), alatta egy gyors hangulat-rögzítés,
// két kis csempe (megtakarítás, következő mérföldkő), a hét, és egy napi gondolat. A részletes statisztika az Idővonalon van.
import { useEffect, useState } from 'react';
import { RISK_MESSAGES, COMPANIONS, HOME, SHARE, T } from '../../content/index.js';
import { riskContexts } from '../../domain/risk.js';
import { formatDateHu } from '../../domain/dates.js';
import { phaseStartInstant } from '../../domain/elapsed.js';
import { figureOf, moodOnDay } from '../../domain/moods.js';
import { uncelebratedMilestone } from '../../domain/milestones.js';
import { Actions } from '../../domain/timelineReducer.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { Companion, companionOf } from '../companions/Companion.jsx';
import { greetedOn, markGreeted } from '../../hooks/usePrefs.js';
import { BackupNotice } from '../home/Notices.jsx';
import { MoodCheckin } from '../home/MoodCheckin.jsx';
import { SetupCard } from '../home/SetupCard.jsx';
import { Celebration } from '../home/Celebration.jsx';
import { ShareSheet } from '../share/ShareSheet.jsx';
import { DailyThought, EnergyStress, Hero, Tiles, WeekGlance, WeekMoods } from '../home/Widgets.jsx';
import { HeroHeader } from '../design/Design.jsx';
import { Page } from '../shell/Page.jsx';

const reactionFor = (figId) => {
  const v = figureOf(figId)?.valence ?? 0;
  return v > 0 ? 'positive' : v < 0 ? 'hard' : 'neutral';
};

export function Home() {
  const { snapshot, dispatch } = useTimeline();
  const [reaction, setReaction] = useState(null);
  const [celebrated, setCelebrated] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { data, stats: s, phases, savings, today } = snapshot;
  const profile = data.profile;
  const risk = riskContexts(new Date(), data.events)[0];
  const freshToday = s.currentPhaseDays === 0 && s.phaseCount > 1;
  const todayMood = moodOnDay(data.events, today);
  const milestone = celebrated ? null : uncelebratedMilestone(s.totalSoberDays, profile.lastCelebration ?? 0);

  // Kísérő: legfeljebb egy buborék. Magától naponta egyszer köszön (vagy megcsúszás napján csendesen bátorít);
  // ezen felül csak akkor szól, ha a felhasználó épp rögzített valamit. „Kísérő nélkül”: nincs figura, nincs buborék.
  const kind = companionOf(profile);
  const voice = COMPANIONS[kind];
  const [greet] = useState(() => !greetedOn(today));
  useEffect(() => { if (greet) markGreeted(today); }, [greet, today]);
  const mood = reaction ?? (todayMood && reactionFor(todayMood.mood));
  let bubble = null;
  if (kind !== 'none') {
    if (reaction) bubble = voice.react[reaction];
    else if (greet) bubble = freshToday ? voice.react.slip : mood ? voice.react[mood] : voice.hello(profile.nickname);
  }
  const look = freshToday || mood === 'hard' ? 'comfort' : mood ? 'cheer' : 'wave';

  return (
    <Page title={T.navHome}>
      {risk && (
        <a className="card risk-banner" href={CRISIS_HASH}>
          <strong>{RISK_MESSAGES[risk].title}</strong><span>{RISK_MESSAGES[risk].text}</span>
        </a>
      )}
      {/* R2: színátmenetes fejléc; a kísérő mellképként jobbra „kilóg”, a buborék (ha van) mellette; alatta a számláló. */}
      <HeroHeader className="rise-in">
        {(bubble || kind !== 'none') && (
          <div className={`hello${bubble ? '' : ' hello-quiet'}`}>
            {bubble ? <p className="bubble" aria-live="polite">{bubble}</p> : <span className="hello-spacer" />}
            <Companion kind={kind} look={look} size={84} />
          </div>
        )}
        <Hero stats={{ ...s, today }} phases={phases} goalDays={profile.goalDays} freshToday={freshToday} currentSince={formatDateHu(s.currentPhaseStart)}
          liveStart={phaseStartInstant(s.currentPhaseStart, s.phaseCount > 1 ? null : profile.journeyStartAt)} />
      </HeroHeader>
      <div className="rise-in" style={{ '--d': '80ms' }}>
        <SetupCard profile={profile} savingsConfigured={savings.configured} />
        <MoodCheckin onSaved={(fig) => setReaction(reactionFor(fig))} />
      </div>
      <div className="rise-in" style={{ '--d': '120ms' }}>
        <h2 className="section-title">{HOME.weekAtGlance}</h2>
        <WeekMoods events={data.events} today={today} />
        <EnergyStress events={data.events} today={today} />
        <Tiles savings={savings} total={s.totalSoberDays} today={today} />
        <WeekGlance events={data.events} today={today} journeyStart={profile.journeyStart} />
        <DailyThought today={today} tags={profile.triggers ?? []} />
      </div>
      {milestone && (
        <Celebration days={milestone} companion={kind} onClose={async () => { setCelebrated(true); await dispatch({ type: Actions.UPDATE_PROFILE, payload: { lastCelebration: milestone } }).catch(() => {}); }}>
          <button type="button" className="btn btn-ghost" onClick={() => setSharing(true)}>{SHARE.open}</button>
        </Celebration>
      )}
      {milestone && sharing && <ShareSheet days={milestone} companion={kind} onClose={() => setSharing(false)} />}
      <BackupNotice data={data} suppressed={Boolean(milestone)} />
    </Page>
  );
}
