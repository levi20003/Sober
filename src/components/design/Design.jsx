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
