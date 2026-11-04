// Sima trendgörbe buborékcímkével (R3 elve, saját rajz). A görbe Catmull–Rom-ból számolt köbös Bézier.
// A kiemelt pont (alapból az utolsó érték, koppintással bármelyik) fölött HTML-buborék áll; a vízszintes helyét a
// diagram széleihez szorítjuk, és max-width-et kap, így soha nem lóg ki és nem csúszik rá a szomszédos kártyára.
import { useState } from 'react';

const TOP = 58; // a buboréknak fenntartott sáv a görbe fölött (px)
const HEIGHT = 120; // a görbe magassága (px)

/** A buborék bal széle (%), a diagram szélein belül tartva. @param {number} x a pont helye 0..100 */
export function bubbleLeft(x, bubblePct = 28) {
  const half = bubblePct / 2;
  return Math.min(100 - bubblePct, Math.max(0, x - half));
}

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * @param {{ values: (number|null)[], labels: string[], format: (v: number) => string, label: string }} props  értékek 0..100
 */
export function TrendChart({ values, labels, format, label }) {
  const pts = values.map((v, i) => (v === null ? null : [(i / Math.max(1, values.length - 1)) * 100, 46 - (v / 100) * 38]));
  const known = pts.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
  const [picked, setPicked] = useState(null);
  if (!known.length) return null;
  const sel = picked !== null && pts[picked] ? picked : known[known.length - 1];
  const [x, y] = pts[sel];
  const py = TOP + (y / 52) * HEIGHT; // a pont helye pixelben a .trend tetejétől
  return (
    <div className="trend">
      <div className="trend-bubble" style={{ left: `${bubbleLeft(x)}%`, top: `${Math.max(0, py - 56)}px` }} aria-live="polite">
        <strong>{format(values[sel])}</strong><span>{labels[sel]}</span>
      </div>
      <svg className="trend-svg" viewBox="0 0 100 52" preserveAspectRatio="none" role="img" aria-label={label} focusable="false">
        <path className="trend-line" d={smoothPath(known.map((i) => pts[i]))} vectorEffect="non-scaling-stroke" />
        <line className="trend-guide" x1={x} x2={x} y1={y} y2="52" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="trend-dot" style={{ left: `${x}%`, top: `${py}px` }} aria-hidden="true" />
      <div className="trend-picks" role="group" aria-label={label}>
        {values.map((v, i) => (
          <button key={i} type="button" disabled={v === null} aria-pressed={i === sel} aria-label={v === null ? labels[i] : `${labels[i]}: ${format(v)}`}
            onClick={() => setPicked(i)}><span aria-hidden="true">{labels[i]}</span></button>
        ))}
      </div>
    </div>
  );
}
