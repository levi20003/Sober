// A főoldal kártyái. Minden szám a titkosított napló eseményeiből és a fázisokból számolódik (src/domain/*).
import { useEffect, useRef, useState } from 'react';
import { CHALLENGE_CATALOG, ENCOURAGEMENTS, FUN_ITEMS, HOME, MISC, SETUP, SHARE, T, TIPS } from '../../content/index.js';
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
import { InfoButton } from '../Info.jsx';
import { Icon } from '../icons/Icon.jsx';
import { MoodFigure } from '../mood/MoodFigures.jsx';
import { Donut, MoodBar, ProgressRing, Sparkline } from '../charts/Charts.jsx';
import { TimelineBar } from '../timeline/TimelineBar.jsx';
import { LiveCounter, useNow } from './LiveCounter.jsx';
import { dayProgress } from '../../domain/elapsed.js';
import { toDateKey } from '../../domain/dates.js';

const MOOD_NAMES = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));
export const moodName = (id) => MOOD_NAMES[id] ?? '';

/** Hős-kártya: az összes józan nap (egy megcsúszás nem törli), körülötte a cél felé haladás gyűrűje. */
export function Hero({ stats, phases, goalDays, freshToday, currentSince, liveStart, clock }) {
  const { dispatch, refresh } = useTimeline();
  const toast = useToast();
  const total = stats.totalSoberDays;
  const shown = useCountUp(total);
  const prev = useRef(total);
  const [burst, setBurst] = useState(false);
  useEffect(() => {
    if (total > prev.current) { setBurst(true); const t = setTimeout(() => setBurst(false), 4000); prev.current = total; return () => clearTimeout(t); }
    prev.current = total;
    return undefined;
  }, [total]);
  const g = goalProgress(total, goalDays);
  // A kör a mai nap: éjfélig megtelik. Napváltáskor újraszámoljuk a statisztikát, így a szám eggyel nő, a kör újraindul.
  const now = useNow(clock);
  const dayRatio = dayProgress(new Date(now));
  const todayKey = toDateKey(new Date(now));
  useEffect(() => { if (todayKey !== stats.today && refresh) refresh(); }, [todayKey]);
  const setNext = async () => { await dispatch({ type: Actions.UPDATE_PROFILE, payload: { goalDays: g.nextSuggestion } }); toast(HOME.goalProgress(total, g.nextSuggestion)); };
  return (
    <section className="hero-card" aria-label={HOME.totalLabel}>
      {burst && <Confetti count={28} />}
      <div className="row-between">
        <p className="eyebrow">{HOME.totalLabel}</p>
        <InfoButton title={HOME.totalLabel}><p>{HOME.totalSub}</p><p>{HOME.ringInfo}</p></InfoButton>
      </div>
      <ProgressRing ratio={dayRatio} size={232} stroke={10} color="var(--accent)" label={HOME.ringAria(Math.floor(dayRatio * 100))}>
        <p className="hero-value" data-total={total}>{shown}</p>
        <p className="hero-unit">{MISC.dayWord}</p>
      </ProgressRing>
      <span className="visually-hidden">{`${HOME.totalLabel}: ${T.days(total)}`}</span>
      {liveStart && <LiveCounter start={liveStart} clock={clock} />}
      {g && <p className="hero-goal"><strong>{HOME.goalProgress(g.shown, g.goal)}</strong> · {SETUP.goalLine(g.remaining)}</p>}
      {g?.reached && (
        <div className="hero-reached">
          <p>{HOME.goalReached(g.goal)}</p>
          <button type="button" className="btn btn-primary" onClick={setNext}>{HOME.goalNext(g.nextSuggestion)}</button>
        </div>
      )}
      {(freshToday || stats.phaseCount > 1) && <p className="hero-sub">{freshToday ? HOME.newPhase : T.heroCurrent(stats.currentPhaseDays, currentSince)}</p>}
      {stats.phaseCount > 1 && <TimelineBar phases={phases} totalSoberDays={total} />}
    </section>
  );
}

/** Két kis csempe: megtakarítás és a következő mérföldkő. */
export function Tiles({ savings, total, today }) {
  const fun = savings.configured ? funConversion(savings.total, FUN_ITEMS, today) : null;
  const ms = milestoneStatus(total);
  return (
    <div className="tiles">
      <a className="tile press" href="#/megtakaritas">
        <span className="tile-icon"><Icon name="savings" size={20} /></span>
        <span className="eyebrow">{HOME.savingsLabel}</span>
        <span className="tile-value">{savings.configured ? formatHuf(savings.total) : '–'}</span>
        {fun && <span className="tile-sub">{HOME.savingsFun(fun.count, fun.item.label)}</span>}
      </a>
      <a className="tile press" href="#/idovonal">
        <span className="tile-icon"><Icon name="star" size={20} /></span>
        <span className="eyebrow">{SETUP.nextBadge}</span>
        <span className="tile-value">{ms.next ? T.days(ms.next) : SETUP.badgeDone}</span>
        {ms.next && <span className="tile-sub">{SETUP.badgeIn(ms.remaining)}</span>}
      </a>
    </div>
  );
}

/** Egyetlen napi gondolat (a célhoz és a nehéz helyzetekhez igazítva, naponta változik). */
export function DailyThought({ today, tags }) {
  const item = pickDaily([...ENCOURAGEMENTS, ...TIPS], { date: today, tags, count: 1 })[0];
  if (!item) return null;
  return (
    <section className="card thought" aria-label={SETUP.thought}>
      <p className="eyebrow">{item.title ?? SETUP.thought}</p>
      <p className="quote">{item.text}</p>
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
          // A mai nap még nincs „kész” (éjfélkor kerül be a józan napok közé): üres karika, nem pipa.
          const sober = !d.isFuture && !d.isToday && !slip && d.date >= journeyStart;
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
          <Sparkline values={es.series.map((d) => d[key])} color={color} label={MISC.trendAria(title)} />
        </>
      )}
    </div>
  );
  return <section className="stats" aria-label={`${HOME.energy}, ${HOME.stress}`}>{card('energy', HOME.energy, 'tone-mint', '#0e8f63')}{card('stress', HOME.stress, 'tone-pink', '#b4235a')}</section>;
}

/** @param {{ total: number, onShare?: (days: number) => void }} props  onShare: az elért jelvények megoszthatók */
export function Badges({ total, onShare }) {
  const ms = milestoneStatus(total);
  return (
    <section className="card tone tone-butter" aria-labelledby="badges-h">
      <h2 id="badges-h">{HOME.badgesTitle}</h2>
      <ul className="badges">
        {ms.badges.map((b) => (
          <li key={b.days} className={`badge${b.achieved ? '' : ' locked'}`} aria-label={`${HOME.badgeLabel(b.days)}${b.achieved ? '' : MISC.badgeLocked}`}>
            {b.achieved && onShare ? (
              <button type="button" className="badge-btn" onClick={() => onShare(b.days)} aria-label={SHARE.openBadge(b.days)}>
                <span className="medal" aria-hidden="true">{b.days}</span>
                <span aria-hidden="true">{b.days} {SHARE.daysUnit(b.days)}</span>
              </button>
            ) : (
              <>
                <span className="medal" aria-hidden="true">{b.achieved ? b.days : <Icon name="lock" size={18} />}</span>
                <span aria-hidden="true">{b.days} {SHARE.daysUnit(b.days)}</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="hint">{ms.next ? HOME.badgeNext(ms.remaining) : HOME.badgeAll}</p>
    </section>
  );
}


export { CHALLENGE_CATALOG };
