// Csak fejlesztéshez (npm run dev → /dev/playground.html): a figurák, a kabala és az ikonok szemrevételezéséhez.
// Nem része a buildnek (a Vite csak az index.html-t építi).
import { createRoot } from 'react-dom/client';
import '../src/styles.css';
import { MoodFigure, MOOD_IDS } from '../src/components/mood/MoodFigures.jsx';
import { Mascot } from '../src/components/mood/Mascot.jsx';
import { Icon, ICON_NAMES } from '../src/components/icons/Icon.jsx';
import { Sparkline, ProgressRing, Donut, BarChart, MoodBar } from '../src/components/charts/Charts.jsx';
import { MOODS } from '../src/domain/presets.js';

const sel = new URLSearchParams(location.search);
if (sel.get('theme')) document.documentElement.setAttribute('data-theme', sel.get('theme'));
const names = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));

createRoot(document.getElementById('app')).render(
  <main className="screen">
    <h1>Figurák</h1>
    <div className="mood-strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
      {MOOD_IDS.map((id, i) => <div key={id} className="mood-card" style={{ textAlign: 'center' }}><MoodFigure mood={id} size={72} label={null} delay={i * 0.2} selected={i === 2} /><div className="mood-name">{names[id]}</div></div>)}
    </div>
    <h1>Pötty</h1>
    <div className="row" style={{ flexWrap: 'wrap' }}>{['happy', 'cheer', 'comfort', 'celebrate', 'sleepy', 'wave'].map((l) => <Mascot key={l} look={l} size={88} />)}</div>
    <h1>Ikonok</h1>
    <div className="row" style={{ flexWrap: 'wrap' }}>{ICON_NAMES.map((n) => <span key={n} title={n}><Icon name={n} size={28} /></span>)}</div>
    <h1>Diagramok</h1>
    <div className="card tone tone-lavender"><ProgressRing ratio={0.4} size={160} label="40%"><b className="meter-num">12</b></ProgressRing></div>
    <div className="card tone tone-mint"><Sparkline values={[20, 40, null, 70, 60, 90, 50]} label="x" /></div>
    <div className="card"><Donut segments={[{ mood: 'stressed', fraction: .5, count: 3 }, { mood: 'cheerful', fraction: .5, count: 3 }]} label="d" />
      <MoodBar names={names} segments={[{ mood: 'stressed', fraction: .5, count: 3 }, { mood: 'cheerful', fraction: .5, count: 3 }]} /></div>
    <div className="card"><BarChart items={[3, 5, 2, 7, 0, 4, 6].map((v, i) => ({ key: i, label: 'HKSzCsPSzV'[i], value: v }))} max={7} /></div>
  </main>,
);
