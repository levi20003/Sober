// A 12 hangulatfigura: saját, eredeti, egyszerű geometriai formákból (csillagrobbanás, nap, virág,
// hatszög, csepp, billenő négyzet, ovális, háromszög, negyedkör, rombusz, felhő, ötszög).
// Mindegyik más színű és más alakú, így nem csak a szín különbözteti meg őket; a címke mindig
// ott van mellettük. Inline SVG, külső kép nincs.
//
// Élet: lassú lélegzés (skála) és pislogás (scaleY) CSS-ből, csak transform/opacity. Érintésre
// megugrik; a kiválasztott figura integet. Mozgáscsökkentésnél minden mozgás kikapcsol.

import { useId } from 'react';
import { MOODS } from '../../domain/presets.js';
import { figureOf } from '../../domain/moods.js';

const LABEL = Object.fromEntries(MOODS.map((m) => [m.id, m.label]));

/** Szabályos sokszög/csillag pontjai ("x,y x,y ..."), felülről indulva. */
function ring(cx, cy, rOuter, rInner, n) {
  const pts = [];
  for (let i = 0; i < (rInner ? n * 2 : n); i++) {
    const r = rInner ? (i % 2 === 0 ? rOuter : rInner) : rOuter;
    const a = -Math.PI / 2 + (i * Math.PI) / (rInner ? n : n / 2);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// --- vonások -----------------------------------------------------------------------------------
const Dot = ({ cx, cy, r = 4.6 }) => (
  <g><circle className="fig-ink" cx={cx} cy={cy} r={r} /><circle className="fig-shine" cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.32} /></g>
);
const Wide = ({ cx, cy }) => (<g><circle className="fig-white" cx={cx} cy={cy} r="7.2" /><circle className="fig-ink" cx={cx} cy={cy} r="3.4" /></g>);
const Arc = ({ cx, cy, up = true }) => (<path className="fig-line" d={up ? `M${cx - 5.5} ${cy + 2} Q${cx} ${cy - 6} ${cx + 5.5} ${cy + 2}` : `M${cx - 5.5} ${cy - 2} Q${cx} ${cy + 6} ${cx + 5.5} ${cy - 2}`} />);
const Lid = ({ cx, cy }) => (<g><circle className="fig-ink" cx={cx} cy={cy + 1} r="4.4" /><path className="fig-lid" d={`M${cx - 6} ${cy - 1.2} H${cx + 6}`} /></g>);
const Brow = ({ x1, y1, x2, y2 }) => <path className="fig-line" d={`M${x1} ${y1} L${x2} ${y2}`} />;
const Blush = ({ cx, cy }) => <ellipse className="fig-blush" cx={cx} cy={cy} rx="6.5" ry="4" />;
const Tear = ({ x, y }) => <path className="fig-tear" d={`M${x} ${y - 7} C${x - 4} ${y - 1}, ${x - 4.5} ${y + 3}, ${x} ${y + 4.5} C${x + 4.5} ${y + 3}, ${x + 4} ${y - 1}, ${x} ${y - 7}Z`} />;

const Smile = ({ y = 62, w = 11 }) => <path className="fig-line" d={`M${50 - w} ${y} Q50 ${y + 11} ${50 + w} ${y}`} />;
const Grin = ({ y = 60 }) => (<g><path className="fig-ink" d={`M36 ${y} Q50 ${y + 20} 64 ${y} Z`} /><path className="fig-tongue" d={`M43 ${y + 9} Q50 ${y + 5} 57 ${y + 9} Q50 ${y + 16} 43 ${y + 9}Z`} /></g>);
const Flat = ({ y = 64, w = 8 }) => <path className="fig-line" d={`M${50 - w} ${y} H${50 + w}`} />;
const Wavy = ({ y = 64, w = 12 }) => <path className="fig-line" d={`M${50 - w} ${y} q${w / 3} -5 ${w / 1.5} 0 t${w / 1.5} 0 t${w / 1.5} 0`} />;
const Frown = ({ y = 68, w = 10 }) => <path className="fig-line" d={`M${50 - w} ${y} Q50 ${y - 10} ${50 + w} ${y}`} />;

/** A figurák testei + arcai. Mind 100×100-as vászonra készül. */
const BODY = {
  excited: (
    <>
      <polygon className="fig-body" points={ring(50, 52, 44, 33, 10)} strokeLinejoin="round" strokeWidth="7" />
      <Wide cx={38} cy={48} /><Wide cx={62} cy={48} /><Grin y={60} />
    </>
  ),
  cheerful: (
    <>
      <g className="fig-rays">{Array.from({ length: 10 }, (_, i) => { const a = (i * 2 * Math.PI) / 10; return <path key={i} className="fig-ray" d={`M${50 + 40 * Math.cos(a)} ${52 + 40 * Math.sin(a)} L${50 + 47 * Math.cos(a)} ${52 + 47 * Math.sin(a)}`} />; })}</g>
      <circle className="fig-body" cx="50" cy="52" r="34" />
      <Dot cx={39} cy={47} /><Dot cx={61} cy={47} /><Blush cx={30} cy={58} /><Blush cx={70} cy={58} /><Smile y={58} w={13} />
    </>
  ),
  grateful: (
    <>
      {Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3 - Math.PI / 2; return <circle key={i} className="fig-body" cx={50 + 27 * Math.cos(a)} cy={52 + 27 * Math.sin(a)} r="17" />; })}
      <circle className="fig-face" cx="50" cy="52" r="26" />
      <Arc cx={40} cy={49} /><Arc cx={60} cy={49} /><Blush cx={32} cy={59} /><Blush cx={68} cy={59} /><Smile y={59} w={9} />
    </>
  ),
  energetic: (
    <>
      <polygon className="fig-body" points={ring(50, 53, 41, 0, 6)} strokeLinejoin="round" strokeWidth="10" />
      <Brow x1={32} y1={39} x2={44} y2={44} /><Brow x1={68} y1={39} x2={56} y2={44} />
      <Dot cx={39} cy={50} r={5} /><Dot cx={61} cy={50} r={5} /><Grin y={61} />
      <path className="fig-bolt" d="M76 14 L66 30 H74 L68 44 L84 25 H75 Z" />
    </>
  ),
  sensitive: (
    <>
      <path className="fig-body" d="M50 8 C50 8 16 46 16 66 a34 34 0 0 0 68 0 C84 46 50 8 50 8Z" />
      <Dot cx={39} cy={62} /><Dot cx={61} cy={62} /><Blush cx={29} cy={72} /><Blush cx={71} cy={72} />
      <path className="fig-line" d="M44 74 Q50 79 56 74" />
    </>
  ),
  confused: (
    <>
      <rect className="fig-body" x="14" y="14" width="72" height="72" rx="22" transform="rotate(9 50 50)" />
      <circle className="fig-white" cx="38" cy="45" r="8" /><circle className="fig-ink" cx="40" cy="47" r="3.6" />
      <circle className="fig-white" cx="62" cy="47" r="5.2" /><circle className="fig-ink" cx="61" cy="46" r="2.4" />
      <Brow x1={30} y1={32} x2={46} y2={35} /><Wavy y={67} w={14} />
    </>
  ),
  bored: (
    <>
      <ellipse className="fig-body" cx="50" cy="54" rx="42" ry="33" />
      <Lid cx={36} cy={50} /><Lid cx={64} cy={50} /><Flat y={68} w={9} />
      <path className="fig-line" d="M74 22 h8 l-8 8 h8" />
    </>
  ),
  stressed: (
    <>
      <polygon className="fig-body" points="50,11 88,80 12,80" strokeLinejoin="round" strokeWidth="12" />
      <Wide cx={40} cy={55} /><Wide cx={60} cy={55} /><path className="fig-line" d="M40 72 l5 -4 l5 4 l5 -4 l5 4" />
      <path className="fig-tear" d="M76 24 C72 31 71 34 76 37 C81 34 80 31 76 24Z" />
    </>
  ),
  angry: (
    <>
      <path className="fig-body" d="M14 88 V16 A74 74 0 0 1 88 88 Z" strokeLinejoin="round" strokeWidth="9" />
      <Dot cx={34} cy={62} r={4.8} /><Dot cx={58} cy={62} r={4.8} />
      <Brow x1={26} y1={49} x2={40} y2={55} /><Brow x1={66} y1={49} x2={52} y2={55} /><Frown y={80} w={10} />
      <circle className="fig-steam" cx="78" cy="22" r="5" /><circle className="fig-steam" cx="87" cy="12" r="3.4" />
    </>
  ),
  unsure: (
    <>
      <polygon className="fig-body" points="50,8 92,50 50,92 8,50" strokeLinejoin="round" strokeWidth="9" />
      <circle className="fig-white" cx="40" cy="46" r="7" /><circle className="fig-ink" cx="43" cy="46" r="3.2" />
      <circle className="fig-white" cx="60" cy="46" r="7" /><circle className="fig-ink" cx="63" cy="46" r="3.2" />
      <Brow x1={55} y1={34} x2={66} y2={32} /><path className="fig-line" d="M42 64 q4 -4 8 0 t8 0" />
    </>
  ),
  hurt: (
    <>
      <g className="fig-body"><circle cx="30" cy="58" r="20" /><circle cx="52" cy="44" r="25" /><circle cx="72" cy="58" r="19" /><rect x="22" y="56" width="58" height="22" rx="11" /></g>
      <Dot cx={42} cy={58} /><Dot cx={62} cy={58} /><Brow x1={35} y1={49} x2={46} y2={52} /><Brow x1={69} y1={49} x2={58} y2={52} />
      <Frown y={74} w={7} /><Tear x={70} y={68} />
    </>
  ),
  guilty: (
    <>
      <polygon className="fig-body" points={ring(50, 54, 41, 0, 5)} strokeLinejoin="round" strokeWidth="10" />
      <Arc cx={39} cy={53} up={false} /><Arc cx={61} cy={53} up={false} /><Blush cx={31} cy={64} /><Blush cx={69} cy={64} />
      <path className="fig-line" d="M43 73 Q50 68 57 73" />
    </>
  ),
};

/**
 * @param {string}  mood      egy a 12 azonosító közül (vagy régi hangulat: arra átképezzük)
 * @param {number}  size      px
 * @param {boolean} animate   lélegzés + pislogás
 * @param {boolean} selected  integet
 * @param {string}  label     felülírja az aria-label-t; null = díszítő (a szomszédos szöveg nevezi meg)
 */
export function MoodFigure({ mood, size = 64, animate = true, selected = false, label, delay = 0 }) {
  const f = figureOf(mood);
  const id = f?.id;
  const uid = useId();
  if (!id) return null;
  const decorative = label === null;
  return (
    <svg className={`fig${animate ? ' fig-live' : ''}${selected ? ' fig-selected' : ''}`} data-mood={id} width={size} height={size} viewBox="0 0 100 100"
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : (label ?? LABEL[id])} aria-hidden={decorative ? 'true' : undefined}
      focusable="false" style={{ '--d': `${delay}s` }} data-uid={uid}>
      <g className="fig-anim">{BODY[id]}</g>
      {selected && <g className="fig-wave"><circle className="fig-body" cx="88" cy="56" r="7" /></g>}
    </svg>
  );
}

export const MOOD_IDS = MOODS.map((m) => m.id);
