// A kísérők rajza: Pötty (puha csillag), Mira (holdacska) és Kavics (sima kavics). Saját rajz, inline SVG.
// Az arckifejezés a helyzethez igazodik; a krízis- és a zárolóképernyőn nem szerepelnek (ott nincs játékos elem).
// Animáció legfeljebb néhány ismétlés: folyamatosan mozgó, figyelő figura nincs.

const ring = (cx, cy, ro, ri, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

const STAR = ring(50, 56, 37, 27, 5);

/** A test alakja kísérőnként. A szín a --mascot változóból jön, a sötét/világos témához igazodik. */
const BODIES = {
  potty: <polygon className="mascot-body" points={STAR} strokeWidth="13" />,
  mira: (
    <g>
      <circle className="mascot-body" cx="50" cy="57" r="33" strokeWidth="4" />
      <path className="mascot-shade" d="M66 30 A33 33 0 0 1 66 84 A40 40 0 0 0 66 30 Z" />
      <circle className="mascot-crater" cx="64" cy="44" r="3.4" />
      <circle className="mascot-crater" cx="70" cy="70" r="2.4" />
    </g>
  ),
  kavics: (
    <g>
      <path className="mascot-body" strokeWidth="4" d="M16 66 C14 44 32 28 54 28 C76 28 88 44 86 64 C84 82 66 90 48 89 C30 88 17 80 16 66 Z" />
      <path className="mascot-crater" d="M30 78 C40 84 56 85 68 80" fill="none" strokeWidth="2.4" />
    </g>
  ),
};
export const BODY_COLORS = { potty: '#ffd25e', mira: '#c6b6ff', kavics: '#d9c9b6' };

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

/**
 * @param {'happy'|'cheer'|'comfort'|'celebrate'|'sleepy'|'wave'} look
 * @param {'potty'|'mira'|'kavics'} kind
 */
export function Mascot({ look = 'happy', size = 96, animate = true, label = null, color, kind = 'potty' }) {
  const face = FACES[look] ?? FACES.happy;
  const k = BODIES[kind] ? kind : 'potty';
  const decorative = label === null;
  return (
    <svg className={`mascot${animate ? ' mascot-live' : ''}${look === 'celebrate' ? ' mascot-celebrate' : ''}`} width={size} height={size} viewBox="0 0 100 100"
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : label} aria-hidden={decorative ? 'true' : undefined} focusable="false"
      style={{ '--mascot': color ?? BODY_COLORS[k] }} data-look={look} data-companion={k}>
      <g className="mascot-anim">
        {(look === 'cheer' || look === 'celebrate') && (<g><path className="mascot-arm" d="M22 62 Q12 48 16 36" /><path className="mascot-arm" d="M78 62 Q88 48 84 36" /></g>)}
        {look === 'wave' && <path className="mascot-arm" d="M78 62 Q90 52 86 38" />}
        {look === 'comfort' && <path className="mascot-arm" d="M30 78 Q50 90 70 78" />}
        {BODIES[k]}
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
