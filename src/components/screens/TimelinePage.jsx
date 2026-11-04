import { useState } from 'react';
import { TIMELINE_PAGE as TP, T } from '../../content/index.js';
import { MOODS } from '../../domain/presets.js';
import { moodPatterns } from '../../domain/moods.js';
import { timelineSeries } from '../../domain/series.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { BarChart, Sparkline } from '../charts/Charts.jsx';
import { QuickLog } from '../QuickLog.jsx';
import { FreshStartModal } from '../timeline/FreshStartModal.jsx';
import { TimelineBody } from '../timeline/TimelineView.jsx';
import { Page } from '../shell/Page.jsx';
import { Badges, EnergyStress, WeekMoods } from '../home/Widgets.jsx';
import { SETUP, SHARE } from '../../content/index.js';
import { shareModel } from '../../domain/share.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { companionOf } from '../companions/Companion.jsx';
import { ShareCard } from '../share/ShareCard.jsx';
import { ShareSheet } from '../share/ShareSheet.jsx';

/** Widgetkártya: kicsi, önálló kártya a napok számával (nem képernyőkép). Koppintásra előnézet, mentés, megosztás. */
function WidgetCard({ days, onOpen }) {
  const [prefs] = usePrefs();
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
  return (
    <section className="card widget-slot" aria-labelledby="widget-h">
      <h2 id="widget-h">{SHARE.widgetTitle}</h2>
      <p className="hint">{SHARE.widgetIntro}</p>
      <ShareCard model={shareModel({ days })} variant="widget" shape="wide" theme={dark ? 'dark' : 'light'} S={SHARE} label={SHARE.previewAlt(days)} />
      <button type="button" className="btn" onClick={onOpen}>{SHARE.widgetOpen}</button>
    </section>
  );
}

const NAMES = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));

export function TimelinePage() {
  const { snapshot } = useTimeline();
  const { data, phases, today } = snapshot;
  const [range, setRange] = useState('week');
  const [picked, setPicked] = useState(null);
  const [fresh, setFresh] = useState(false);
  const [share, setShare] = useState(null); // { days, variant }
  const series = timelineSeries(data.events, phases, today, range);
  const max = Math.max(1, ...series.map((s) => s.soberDays));
  const sel = picked !== null ? series[picked] : null;
  const patterns = moodPatterns(data.events, today);
  const valence = series.map((s) => (s.valence === null ? null : Math.round(((s.valence + 1) / 2) * 100)));

  return (
    <Page title={TP.title}>
      <section className="card tone tone-sky" aria-labelledby="chart-h">
        <div className="row-between">
          <h2 id="chart-h">{TP.chartTitle}</h2>
          <div className="seg-tabs" role="group" aria-label={TP.chartDesc(range)}>
            {Object.entries(TP.ranges).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={range === id} onClick={() => { setRange(id); setPicked(null); }}>{label}</button>
            ))}
          </div>
        </div>
        {series.some((s) => s.soberDays > 0) ? (
          <>
            <BarChart items={series.map((s) => ({ key: s.key, label: s.label, value: s.soberDays }))} max={max} picked={picked} onPick={setPicked} />
            <p className="chart-tip" aria-live="polite">{sel ? TP.tooltip(sel.label, sel.soberDays) : ''}</p>
          </>
        ) : <p className="hint empty-state">{TP.chartEmpty}</p>}
        {valence.some((v) => v !== null) && (
          <>
            <p className="stat-label">{TP.moodTrend}</p>
            <Sparkline values={valence} color="#6b3fe0" label={TP.moodTrend} />
          </>
        )}
      </section>

      {patterns.length > 0 && (
        <section className="card tone tone-butter" aria-labelledby="pat-h">
          <h2 id="pat-h">{TP.patternsTitle}</h2>
          <ul className="reason-list">
            {patterns.map((p) => <li key={p.id}>{p.id === 'most-common' ? TP.patterns[p.id](NAMES[p.mood] ?? '') : TP.patterns[p.id]}</li>)}
          </ul>
        </section>
      )}

      <h2 className="section-title">{SETUP.stats}</h2>
      <WeekMoods events={data.events} today={today} />
      <EnergyStress events={data.events} today={today} />
      <Badges total={snapshot.stats.totalSoberDays} onShare={(days) => setShare({ days, variant: 'milestone' })} />
      <WidgetCard days={snapshot.stats.totalSoberDays} onOpen={() => setShare({ days: snapshot.stats.totalSoberDays, variant: 'widget' })} />

      <QuickLog />
      <div className="actions"><button type="button" className="btn btn-ghost" onClick={() => setFresh(true)}>{T.actionSlip}</button></div>
      <h2 className="section-title">{TP.logTitle}</h2>
      <TimelineBody />
      {fresh && <FreshStartModal onClose={() => setFresh(false)} />}
      {share && <ShareSheet days={share.days} variant={share.variant} companion={companionOf(data.profile)} onClose={() => setShare(null)} />}
    </Page>
  );
}
