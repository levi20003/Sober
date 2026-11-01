// A főoldal kártyái. Minden szám a titkosított napló eseményeiből és a fázisokból számolódik (src/domain/*).
import { useEffect, useRef, useState } from 'react';
import { CHALLENGE_CATALOG, ENCOURAGEMENTS, FUN_ITEMS, HOME, T, TIPS } from '../../content/index.js';
import { MOODS } from '../../domain/presets.js';
import { energyStress, weekDigest, weekMoods } from '../../domain/moods.js';
import { goalProgress, milestoneStatus } from '../../domain/milestones.js';
import { funConversion } from '../../domain/fun.js';
import { pickDaily } from '../../domain/daily.js';
import { formatHuf } from '../../domain/savings.js';
import { Actions } from '../../domain/timelineReducer.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Confetti } from '../Confetti.jsx';
import { Icon } from '../icons/Icon.jsx';
import { MoodFigure } from '../mood/MoodFigures.jsx';
import { Donut, MoodBar, ProgressRing, Sparkline } from '../charts/Charts.jsx';
import { TimelineBar } from '../timeline/TimelineBar.jsx';

const MOOD_NAMES = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));
export const moodName = (id) => MOOD_NAMES[id] ?? '';

/** Nagy napszámláló: az összes józan nap (sosem csökken egy megcsúszástól), gyűrű a cél felé, konfetti új napnál. */
export function DayCounter({ stats, phases, goal, freshToday, currentSince }) {
  const total = stats.totalSoberDays;
  const shown = useCountUp(total);
  const prev = useRef(total);
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    if (total > prev.current) { setBurst(true); const t = setTimeout(() => setBurst(false), 4000); prev.current = total; return () => clearTimeout(t); }
    prev.current = total;
    return undefined;
  }, [total]);
  const ms = milestoneStatus(total);
  const ratio = goal ? goal.ratio : ms.progressToNext;
  return (
    <section className="card hero tone tone-lavender card-rel" aria-label={HOME.totalLabel}>
      {burst && <Confetti count={28} />}
      <p className="stat-label">{HOME.totalLabel}</p>
      <ProgressRing ratio={ratio} size={250} stroke={14} color="var(--accent)" label={goal ? HOME.goalProgress(goal.shown, goal.goal) : `${total} nap`}>
        <p className="hero-value" data-total={total}>{shown}</p>
        <p className="stat-label">nap</p>
      </ProgressRing>
      <span className="visually-hidden">{`${HOME.totalLabel}: ${T.days(total)}`}</span>
      <p className="hero-sub">{freshToday ? HOME.newPhase : T.heroCurrent(stats.currentPhaseDays, currentSince)}</p>
      {stats.phaseCount > 1 && <TimelineBar phases={phases} totalSoberDays={total} />}
      <p className="hint">{HOME.totalSub}</p>
    </section>
  );
}

export function GoalCard({ total, goalDays }) {
  const { dispatch } = useTimeline();
  const toast = useToast();
  const g = goalProgress(total, goalDays);
  if (!g) {
    return (
      <section className="card tone tone-peach"><h2>{HOME.goalLabel}</h2><p>{HOME.goalNone}</p><a className="btn" href="#/beallitasok">{HOME.goalSet}</a></section>
    );
  }
  const setNext = async () => { await dispatch({ type: Actions.UPDATE_PROFILE, payload: { goalDays: g.nextSuggestion } }); toast(HOME.goalProgress(total, g.nextSuggestion)); };
  return (
    <section className="card tone tone-peach" aria-labelledby="goal-h">
      <h2 id="goal-h">{HOME.goalLabel}</h2>
      <p className="meter-num">{HOME.goalProgress(g.shown, g.goal)}</p>
      <progress className="savings-progress" max="1" value={g.ratio} aria-label={HOME.goalProgress(g.shown, g.goal)} />
      {g.reached && (
        <>
          <p><strong>{HOME.goalReached(g.goal)}</strong></p>
          <p>{HOME.goalNext(g.nextSuggestion)}</p>
          <button type="button" className="btn btn-primary" onClick={setNext}>{HOME.goalProgress(total, g.nextSuggestion)}</button>
        </>
      )}
    </section>
  );
}

export function SavingsCard({ savings, today }) {
  if (!savings.configured) {
    return <section className="card tone tone-mint"><h2>{HOME.savingsLabel}</h2><p>{HOME.savingsSetup}</p><a className="btn" href="#/megtakaritas">Megtakarítás</a></section>;
  }
  const fun = funConversion(savings.total, FUN_ITEMS, today);
  return (
    <section className="card tone tone-mint card-rel" aria-labelledby="sav-h">
      <p className="stat-label" id="sav-h">{HOME.savingsLabel}</p>
      <p className="meter-num" style={{ fontSize: 'clamp(2rem, 10vw, 3rem)' }}>{formatHuf(savings.total)}</p>
      {fun && <p><strong>{HOME.savingsFun(fun.count, fun.item.label)}</strong></p>}
      {savings.goal && <p>{`${savings.goal.label}: ${Math.round(savings.goal.progress * 100)}%`}</p>}
      <a className="btn" href="#/megtakaritas">{'Részletek'}</a>
    </section>
  );
}

export function WeekGlance({ events, today, journeyStart }) {
  const days = weekDigest(events, today);
  const slips = new Set(events.filter((e) => e.type === 'slip').map((e) => e.date));
  return (
    <section className="card tone tone-sky" aria-labelledby="week-h">
      <h2 id="week-h">{HOME.moodWeek}</h2>
      <div className="week" role="list">
        {days.map((d, i) => {
          const slip = slips.has(d.date);
          const sober = !d.isFuture && !slip && d.date >= journeyStart;
          const cls = `day-dot${d.isToday ? ' is-today' : ''}${slip ? ' is-slip' : sober ? ' is-sober' : ''}`;
          const status = slip ? HOME.weekSlip : sober ? HOME.weekSober : '';
          return (
            <div key={d.date} role="listitem" className={cls} aria-label={`${HOME.weekDays[i]}: ${[status, d.figure ? moodName(d.figure) : ''].filter(Boolean).join(', ')}`}>
              <span className="dot">{d.figure ? <MoodFigure mood={d.figure} size={32} label={null} animate={false} /> : sober ? <Icon name="check" size={18} /> : null}</span>
              <span aria-hidden="true">{HOME.weekDays[i]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function WeekMoods({ events, today }) {
  const w = weekMoods(events, today);
  return (
    <section className="card tone tone-butter" aria-labelledby="wm-h">
      <h2 id="wm-h">{HOME.moodDonut}</h2>
      {w.total === 0 ? <p>{HOME.moodNoData}</p> : (
        <>
          <div className="row">
            <Donut segments={w.segments} size={110} label={w.segments.map((s) => `${moodName(s.mood)}: ${s.count}`).join(', ')}>
              <MoodFigure mood={w.dominant} size={44} label={null} animate={false} />
            </Donut>
            <p style={{ flex: 1 }}><strong>{HOME.moodMostCommon(moodName(w.dominant))}</strong></p>
          </div>
          <MoodBar segments={w.segments} names={MOOD_NAMES} />
        </>
      )}
    </section>
  );
}

export function EnergyStress({ events, today }) {
  const es = energyStress(events, today);
  const card = (key, title, tone, color) => (
    <div className={`stat tone ${tone}`}>
      <p className="stat-label">{title}</p>
      {es[key] === null ? <p className="hint">{HOME.trendNone}</p> : (
        <>
          <p className="meter-num">{es[key]}<span className="stat-label"> {HOME.outOf100}</span></p>
          <Sparkline values={es.series.map((d) => d[key])} color={color} label={`${title}: 7 napos alakulás`} />
        </>
      )}
    </div>
  );
  return <section className="stats" aria-label={`${HOME.energy}, ${HOME.stress}`}>{card('energy', HOME.energy, 'tone-mint', '#0e8f63')}{card('stress', HOME.stress, 'tone-pink', '#b4235a')}</section>;
}

export function Badges({ total }) {
  const ms = milestoneStatus(total);
  return (
    <section className="card tone tone-butter" aria-labelledby="badges-h">
      <h2 id="badges-h">{HOME.badgesTitle}</h2>
      <ul className="badges">
        {ms.badges.map((b) => (
          <li key={b.days} className={`badge${b.achieved ? '' : ' locked'}`} aria-label={`${HOME.badgeLabel(b.days)}${b.achieved ? '' : ' (még nem érted el)'}`}>
            <span className="medal" aria-hidden="true">{b.achieved ? b.days : <Icon name="lock" size={18} />}</span>
            <span aria-hidden="true">{b.days} nap</span>
          </li>
        ))}
      </ul>
      <p className="hint">{ms.next ? HOME.badgeNext(ms.remaining) : HOME.badgeAll}</p>
    </section>
  );
}

/** Lapozható napi gondolatok: a célhoz és a megadott nehéz helyzetekhez igazítva, naponta változnak. */
export function DailyThoughts({ today, tags }) {
  const items = [
    ...pickDaily(ENCOURAGEMENTS, { date: today, tags, count: 1 }).map((e) => ({ id: e.id, title: null, text: e.text })),
    ...pickDaily(TIPS, { date: today, tags, count: 2 }),
  ];
  const [i, setI] = useState(0);
  return (
    <section className="card tone tone-sky" aria-labelledby="th-h">
      <h2 id="th-h">{HOME.thoughtsTitle}</h2>
      <div className="swipe" tabIndex={0} aria-label={HOME.thoughtsTitle}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}>
        {items.map((it) => (
          <article key={it.id}>
            {it.title && <p className="stat-label">{it.title}</p>}
            <p className="quote">{it.text}</p>
          </article>
        ))}
      </div>
      <div className="swipe-dots" aria-hidden="true">{items.map((it, k) => <i key={it.id} className={k === i ? 'on' : ''} />)}</div>
    </section>
  );
}

export { CHALLENGE_CATALOG };
