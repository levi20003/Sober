// Pötty, a kabala: egy puha kis csillag. Saját rajz, inline SVG. Az arckifejezés a helyzethez igazodik;
// a krízisoldalon nem szerepel (ott nincs játékos elem).

const ring = (cx, cy, ro, ri, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const STAR = ring(50, 56, 37, 27, 5);

const EYES_OPEN = (
  <g><circle className="mascot-ink" cx="41" cy="55" r="3.6" /><circle className="mascot-ink" cx="59" cy="55" r="3.6" /></g>
);
const EYES_HAPPY = (
  <g><path className="mascot-line" d="M36 57 Q41 50 46 57" /><path className="mascot-line" d="M54 57 Q59 50 64 57" /></g>
);
const EYES_SLEEPY = (
  <g><path className="mascot-line" d="M36 55 Q41 59 46 55" /><path className="mascot-line" d="M54 55 Q59 59 64 55" /></g>
);

const FACES = {
  happy: { eyes: EYES_OPEN, mouth: <path className="mascot-line" d="M42 64 Q50 72 58 64" /> },
  wave: { eyes: EYES_OPEN, mouth: <path className="mascot-line" d="M42 64 Q50 72 58 64" /> },
  cheer: { eyes: EYES_HAPPY, mouth: <path className="mascot-ink" d="M42 63 Q50 78 58 63 Z" /> },
  celebrate: { eyes: EYES_HAPPY, mouth: <path className="mascot-ink" d="M41 62 Q50 80 59 62 Z" /> },
  comfort: {
    eyes: (<g><circle className="mascot-ink" cx="41" cy="56" r="3.6" /><circle className="mascot-ink" cx="59" cy="56" r="3.6" />
      <path className="mascot-line" d="M35 51 L45 47" /><path className="mascot-line" d="M65 51 L55 47" /></g>),
    mouth: <path className="mascot-line" d="M45 66 Q50 69 55 66" />,
  },
  sleepy: { eyes: EYES_SLEEPY, mouth: <path className="mascot-line" d="M46 66 H54" /> },
};

/** @param {'happy'|'cheer'|'comfort'|'celebrate'|'sleepy'|'wave'} look */
export function Mascot({ look = 'happy', size = 96, animate = true, label = null, color }) {
  const face = FACES[look] ?? FACES.happy;
  const decorative = label === null;
  return (
    <svg className={`mascot${animate ? ' mascot-live' : ''}${look === 'celebrate' ? ' mascot-celebrate' : ''}`} width={size} height={size} viewBox="0 0 100 100"
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined} focusable="false"
      style={color ? { '--mascot': color } : undefined} data-look={look}>
      <g className="mascot-anim">
        {(look === 'cheer' || look === 'celebrate') && (<g><path className="mascot-arm" d="M22 62 Q12 48 16 36" /><path className="mascot-arm" d="M78 62 Q88 48 84 36" /></g>)}
        {look === 'wave' && <path className="mascot-arm" d="M78 62 Q90 52 86 38" />}
        {look === 'comfort' && <path className="mascot-arm" d="M30 78 Q50 90 70 78" />}
        <polygon className="mascot-body" points={STAR} strokeWidth="13" />
        <circle className="mascot-spark" cx="38" cy="38" r="3" />
        <ellipse className="mascot-cheek" cx="35" cy="64" rx="5.5" ry="3.6" />
        <ellipse className="mascot-cheek" cx="65" cy="64" rx="5.5" ry="3.6" />
        {face.eyes}
        {face.mouth}
        {look === 'sleepy' && <text x="70" y="34" fontSize="14" fontWeight="800" fill="currentColor" opacity="0.6">z</text>}
        {look === 'celebrate' && (<g className="mascot-spark"><path d="M14 20 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><path d="M84 14 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" /></g>)}
      </g>
    </svg>
  );
}
