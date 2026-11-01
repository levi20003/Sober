// Saját, könnyű SVG-diagramok (nincs diagramkönyvtár). Minden szám szövegesen is elérhető.

import { MOOD_COLORS } from '../mood/colors.js';

/** Körgyűrű-haladás. A gyűrű statikus ív; a belépő mozgás transform + opacity (rotáció), nem a körvonal rajzolása. */
export function ProgressRing({ ratio = 0, size = 220, stroke = 18, color = 'var(--accent)', children, label }) {
  const r = (100 - stroke) / 2;
  const c = 2 * Math.PI * r;
  const k = Math.max(0, Math.min(1, ratio));
  return (
    <div className="hero-ring" style={{ width: size, maxWidth: '70vw' }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={label} focusable="false">
        <circle className="ring-track" cx="50" cy="50" r={r} strokeWidth={stroke} />
        <g transform="rotate(-90 50 50)">
          <g className="ring-spin"><circle className="ring-bar" cx="50" cy="50" r={r} strokeWidth={stroke} stroke={color} strokeDasharray={`${c * k} ${c}`} /></g>
        </g>
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

/** Kis vonaldiagram (hiányzó nap = megszakadó vonal). */
export function Sparkline({ values, color = 'currentColor', label }) {
  const pts = values.map((v, i) => (v === null ? null : [(i / Math.max(1, values.length - 1)) * 100, 40 - (v / 100) * 36]));
  let d = '';
  let pen = false;
  for (const p of pts) {
    if (!p) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    pen = true;
  }
  const single = pts.filter(Boolean);
  return (
    <svg className="spark" viewBox="0 0 100 44" preserveAspectRatio="none" role="img" aria-label={label} style={{ color }} focusable="false">
      {d && <path d={d} vectorEffect="non-scaling-stroke" />}
      {single.length === 1 && <circle cx={single[0][0]} cy={single[0][1]} r="2.5" fill="currentColor" />}
    </svg>
  );
}

/** Hangulat-eloszlás: színes sáv + jelmagyarázat (a színt a név is kíséri, nem csak a szín). */
export function MoodBar({ segments, names }) {
  return (
    <>
      <div className="colorbar" role="img" aria-label={segments.map((s) => `${names[s.mood]}: ${s.count}`).join(', ')}>
        {segments.map((s) => <i key={s.mood} style={{ width: `${s.fraction * 100}%`, background: MOOD_COLORS[s.mood] }} />)}
      </div>
      <ul className="legend">
        {segments.map((s) => <li key={s.mood}><span className="sw" style={{ background: MOOD_COLORS[s.mood] }} />{names[s.mood]} · {s.count}</li>)}
      </ul>
    </>
  );
}

/** Fánk-diagram a heti hangulatokról. */
export function Donut({ segments, size = 120, label, children }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} focusable="false">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(43,37,64,.1)" strokeWidth="16" />
        <g transform="rotate(-90 50 50)">
          {segments.map((s) => {
            const len = C * s.fraction;
            const el = <circle key={s.mood} cx="50" cy="50" r={R} fill="none" stroke={MOOD_COLORS[s.mood]} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
        </g>
      </svg>
      <div className="ring-center" style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  );
}

/** Oszlopdiagram érintésre/kattintásra megjelenő értékkel. */
export function BarChart({ items, max, onPick, picked, unit = '' }) {
  const W = 300;
  const H = 120;
  const gap = items.length > 12 ? 2 : 6;
  const bw = (W - gap * (items.length - 1)) / items.length;
  const top = max || 1;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 16}`} role="group" aria-label="Diagram" focusable="false">
      <line className="axis" x1="0" y1={H} x2={W} y2={H} />
      {items.map((it, i) => {
        const x = i * (bw + gap);
        const h = Math.max(it.value > 0 ? 4 : 0, (it.value / top) * (H - 8));
        const on = picked === i;
        return (
          <g key={it.key}>
            <rect className={`bar${it.value === 0 ? ' dim' : ''}`} x={x} y={H - h} width={bw} height={h} rx={Math.min(6, bw / 2)} opacity={picked === null || on ? 1 : 0.55} />
            {(items.length <= 12 || i % 5 === 0) && <text x={x + bw / 2} y={H + 12} textAnchor="middle">{it.label}</text>}
            <rect className="barhit" x={x - gap / 2} y="0" width={bw + gap} height={H + 16} onClick={() => onPick?.(i)}>
              <title>{`${it.label}: ${it.value}${unit}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
