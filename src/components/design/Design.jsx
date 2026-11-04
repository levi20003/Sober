// Közös vizuális elemek a design-referenciák (R1–R4) elvei szerint – saját rajz, csak SVG és CSS, kép nélkül.
//  - WaveEdge: hullámos vagy íves alsó él egy színblokkhoz (currentColor, így a színe tokenből jön).
//  - Grain: finom, mozdulatlan szemcsés textúra (SVG feTurbulence), dekoráció; a képernyőolvasó nem látja.
//  - HeroHeader: színátmenetes fejléc (--grad-hero) textúrával és hullámos alsó éllel.
//  - Tile: pasztell csempe ikonnal, címmel, egy sor leírással és „Megnézem →” sorral (R4).
//  - StatPill: lekerekített statisztika-kapszula ikon-jelvénnyel, nagy számmal, címkével (R3).
import { useId } from 'react';
import { Icon } from '../icons/Icon.jsx';

/** Csempe-hivatkozás csak az app saját útvonala lehet (#/…), soha külső cím vagy script. */
export const safeHash = (h) => (/^#\/[a-z0-9/-]*$/.test(h ?? '') ? h : '#/');

const WAVES = {
  wave: 'M0 0 H400 V14 C350 30 300 4 240 14 C180 24 130 2 70 12 C40 17 18 14 0 10 Z',
  arc: 'M0 0 H400 V6 Q200 40 0 6 Z',
};

/** @param {{ shape?: 'wave'|'arc', className?: string }} props  a színt a szülő `color`-ja adja */
export function WaveEdge({ shape = 'wave', className = '' }) {
  return (
    <svg className={`wave-edge ${className}`} viewBox="0 0 400 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={WAVES[shape] ?? WAVES.wave} fill="currentColor" />
    </svg>
  );
}

export function Grain() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="grain" aria-hidden="true" focusable="false">
      <filter id={`g${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter={`url(#g${id})`} />
    </svg>
  );
}

/** Színátmenetes fejléc; az alján hullám a lap háttérszínében, így a következő elem „ráfut”. */
export function HeroHeader({ children, className = '' }) {
  return (
    <div className={`hero-header ${className}`}>
      <Grain />
      <div className="hero-header-body">{children}</div>
      <WaveEdge className="hero-header-edge" />
    </div>
  );
}

/**
 * @param {{ tone: string, icon: string, title: string, desc?: string, cta: string, href?: string, onClick?: (e) => void }} props
 */
export function Tile({ tone, icon, title, desc, cta, href, onClick }) {
  const body = (
    <>
      <span className="tile-icon" aria-hidden="true"><Icon name={icon} size={22} /></span>
      <span className="tile-title">{title}</span>
      {desc && <span className="tile-desc">{desc}</span>}
      <span className="tile-cta" aria-hidden="true">{cta} <Icon name="next" size={16} /></span>
    </>
  );
  const cls = `tile tone tone-${tone} press`;
  return href
    ? <a className={cls} href={safeHash(href)} onClick={onClick}>{body}</a>
    : <button type="button" className={cls} onClick={onClick}>{body}</button>;
}

/** @param {{ icon: string, value: string|number, label: string, tone?: string, upcoming?: boolean }} props */
export function StatPill({ icon, value, label, tone = 'lavender', upcoming = false }) {
  return (
    <div className={`stat-pill tone tone-${tone}${upcoming ? ' upcoming' : ''}`}>
      <span className="stat-pill-icon" aria-hidden="true"><Icon name={icon} size={18} /></span>
      <span className="stat-pill-value">{value}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}

/** Összeg óriási számmal és kicsi pénznemmel (R2 „59 $” elve). A szöveg (textContent) változatlan marad. */
export function Money({ text, className = '' }) {
  const m = /^([^\d-]*)(-?[\d][\d\s.,\u00a0\u202f]*)(.*)$/.exec(text ?? '');
  if (!m) return <span className={className}>{text}</span>;
  const [, pre, num, post] = m;
  return (
    <span className={`money ${className}`}>
      {pre && <small className="money-cur">{pre}</small>}
      <span className="money-num">{num.trimEnd()}</span>
      {num !== num.trimEnd() ? ' ' : ''}
      {post && <small className="money-cur">{post.trim()}</small>}
    </span>
  );
}

/** Hullámos haladás-sáv (R2): a hullám mindig látszik, a kitöltés a `value` (0..1) arányában. */
export function WaveProgress({ value, label }) {
  const id = useId().replace(/:/g, '');
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const d = 'M4 12 C 16 2, 28 2, 40 12 S 64 22, 76 12 S 100 2, 112 12 S 136 22, 148 12 S 172 2, 184 12 S 208 22, 220 12 S 244 2, 256 12 S 280 22, 292 12 S 316 2, 316 12';
  return (
    <svg className="wave-progress" viewBox="0 0 320 24" preserveAspectRatio="none" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} focusable="false">
      <clipPath id={`w${id}`}><rect x="0" y="0" width={320 * v} height="24" /></clipPath>
      <path d={d} className="wave-track" vectorEffect="non-scaling-stroke" />
      <path d={d} className="wave-fill" clipPath={`url(#w${id})`} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
