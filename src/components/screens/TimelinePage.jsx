import { useState } from 'react';
import { TIMELINE_PAGE as TP, T } from '../../content/hu.js';
import { MOODS } from '../../domain/presets.js';
import { moodPatterns } from '../../domain/moods.js';
import { timelineSeries } from '../../domain/series.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { BarChart, Sparkline } from '../charts/Charts.jsx';
import { QuickLog } from '../QuickLog.jsx';
import { FreshStartModal } from '../timeline/FreshStartModal.jsx';
import { TimelineBody } from '../timeline/TimelineView.jsx';
import { Page } from '../shell/Page.jsx';

const NAMES = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));

export function TimelinePage() {
  const { snapshot } = useTimeline();
  const { data, phases, today } = snapshot;
  const [range, setRange] = useState('week');
  const [picked, setPicked] = useState(null);
  const [fresh, setFresh] = useState(false);
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
        <BarChart items={series.map((s) => ({ key: s.key, label: s.label, value: s.soberDays }))} max={max} picked={picked} onPick={setPicked} />
        <p className="chart-tip" aria-live="polite">{sel ? TP.tooltip(sel.label, sel.soberDays) : ''}</p>
        {valence.some((v) => v !== null) && (
          <>
            <p className="stat-label">{TP.moodTrend}</p>
            <Sparkline values={valence} color="#6b3fe0" label={TP.moodTrend} />
          </>
        )}
      </section>

      <section className="card tone tone-butter" aria-labelledby="pat-h">
        <h2 id="pat-h">{TP.patternsTitle}</h2>
        {patterns.length === 0 ? <p>{TP.patternNone}</p> : (
          <ul className="reason-list">
            {patterns.map((p) => <li key={p.id}>{p.id === 'most-common' ? TP.patterns[p.id](NAMES[p.mood] ?? '') : TP.patterns[p.id]}</li>)}
          </ul>
        )}
      </section>

      <QuickLog />
      <div className="actions"><button type="button" className="btn btn-ghost" onClick={() => setFresh(true)}>{T.actionSlip}</button></div>
      <h2 className="section-title">{TP.logTitle}</h2>
      <TimelineBody />
      {fresh && <FreshStartModal onClose={() => setFresh(false)} />}
    </Page>
  );
}
