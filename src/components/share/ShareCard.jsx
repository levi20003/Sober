// A megosztható kártya rajza: tiszta SVG, külső betűtípus, kép és hálózat nélkül. Ugyanez az elem az előnézet ÉS a
// kép forrása (src/lib/shareImage.js), így a felhasználó pontosan azt látja, ami megosztásra kerül.
import { forwardRef } from 'react';
import { CARD_SIZE, CARD_THEMES, SHARE_MESSAGES, progressToNext } from '../../domain/share.js';
import { Mascot } from '../mood/Mascot.jsx';

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function Sparkle({ x, y, r, fill, opacity = 1 }) {
  const d = `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;
  return <path d={d} fill={fill} opacity={opacity} />;
}

function Brand({ x, y, c, size = 40 }) {
  return (
    <g>
      <Sparkle x={x + size * 0.4} y={y - size * 0.34} r={size * 0.4} fill={c.warm} />
      <text x={x + size * 1.05} y={y} fontFamily={FONT} fontSize={size} fontWeight="800" fill={c.accent} letterSpacing="1">Sober</text>
    </g>
  );
}

function Decor({ w, h, c }) {
  return (
    <g aria-hidden="true">
      <circle cx={w * 0.92} cy={h * 0.1} r={w * 0.22} fill={c.soft} opacity="0.55" />
      <circle cx={w * 0.05} cy={h * 0.9} r={w * 0.26} fill={c.soft} opacity="0.45" />
      <Sparkle x={w * 0.5} y={h * 0.16} r={Math.min(w, h) * 0.03} fill={c.warm} opacity="0.9" />
      <Sparkle x={w * 0.86} y={h * 0.7} r={w * 0.016} fill={c.accent} opacity="0.55" />
      <Sparkle x={w * 0.78} y={h * 0.32} r={w * 0.01} fill={c.warm} opacity="0.8" />
    </g>
  );
}

function Background({ w, h, c, layout, rounded, id }) {
  const rx = rounded ? Math.round(Math.min(w, h) * 0.08) : 0;
  return (
    <>
      {layout === 'illustrated' && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c.bg} /><stop offset="1" stopColor={c.bg2} />
          </linearGradient>
          <clipPath id={`${id}-clip`}><rect width={w} height={h} rx={rx} /></clipPath>
        </defs>
      )}
      <rect width={w} height={h} rx={rx} fill={layout === 'illustrated' ? `url(#${id})` : c.bg} />
      {layout === 'illustrated' && <g clipPath={`url(#${id}-clip)`}><Decor w={w} h={h} c={c} /></g>}
    </>
  );
}

const numberSize = (days, max) => Math.min(max, Math.round((max * 3.2) / Math.max(3.2, String(days).length * 1.0)));

function MilestoneBody({ model, layout, w, h, c, S }) {
  const portrait = h > w;
  const cy = portrait ? h * 0.46 : h * 0.47;
  const size = numberSize(model.days, portrait ? 340 : 300);
  const withCompanion = layout === 'illustrated' && model.companion;
  return (
    <>
      <Brand x={80} y={portrait ? 130 : 120} c={c} size={42} />
      {layout === 'illustrated' && (
        <circle cx={w / 2} cy={cy - size * 0.06} r={size * 0.86} fill="none" stroke={c.accent} strokeOpacity="0.22" strokeWidth="14" />
      )}
      <text x={w / 2} y={cy + size * 0.3} textAnchor="middle" fontFamily={FONT} fontSize={size} fontWeight="800" fill={c.text} letterSpacing="-4">{model.days}</text>
      <text x={w / 2} y={cy + size * 0.3 + 96} textAnchor="middle" fontFamily={FONT} fontSize="62" fontWeight="700" fill={c.muted}>{S.daysUnit(model.days)}</text>
      <text x={w / 2} y={portrait ? h * 0.8 : h * 0.83} textAnchor="middle" fontFamily={FONT} fontSize="54" fontWeight="700" fill={c.text}>{S.messages[model.message]}</text>
      {model.next && (
        <text x={w / 2} y={(portrait ? h * 0.8 : h * 0.83) + 70} textAnchor="middle" fontFamily={FONT} fontSize="40" fontWeight="600" fill={c.muted}>{S.next(model.next)}</text>
      )}
      {withCompanion && (
        <g transform={`translate(${w - 300} ${portrait ? 70 : 60})`}><Mascot kind={model.companion} look="cheer" size={230} animate={false} /></g>
      )}
    </>
  );
}

function WidgetBody({ model, layout, w, h, c, S }) {
  const wide = w > h;
  const p = progressToNext(model);
  const ringR = wide ? h * 0.3 : w * 0.17;
  const ringX = wide ? w * 0.74 : w * 0.76;
  const ringY = wide ? h * 0.5 : h * 0.24;
  const size = numberSize(model.days, wide ? 230 : 300);
  const nx = wide ? 80 : 90;
  const ny = wide ? h * 0.6 : h * 0.72;
  const circ = 2 * Math.PI * ringR;
  return (
    <>
      <Brand x={nx} y={wide ? 108 : 120} c={c} size={38} />
      <text x={nx - 6} y={ny} fontFamily={FONT} fontSize={size} fontWeight="800" fill={c.text} letterSpacing="-3">{model.days}</text>
      <text x={nx} y={ny + 78} fontFamily={FONT} fontSize="54" fontWeight="700" fill={c.muted}>{S.daysUnit(model.days)}</text>
      {!wide && <text x={nx} y={h - 90} fontFamily={FONT} fontSize="46" fontWeight="700" fill={c.text}>{S.messages[model.message]}</text>}
      {wide && p === null && !(layout === 'illustrated' && model.companion) && (
        <text x={w - 80} y={h - 84} textAnchor="end" fontFamily={FONT} fontSize="44" fontWeight="700" fill={c.text}>{S.messages[model.message]}</text>
      )}
      {p !== null && (
        <g>
          <circle cx={ringX} cy={ringY} r={ringR} fill="none" stroke={c.soft} strokeWidth={ringR * 0.22} />
          <circle cx={ringX} cy={ringY} r={ringR} fill="none" stroke={c.accent} strokeWidth={ringR * 0.22} strokeLinecap="round"
            strokeDasharray={`${(circ * p).toFixed(1)} ${circ.toFixed(1)}`} transform={`rotate(-90 ${ringX} ${ringY})`} />
          <text x={ringX} y={ringY + ringR * 0.16} textAnchor="middle" fontFamily={FONT} fontSize={ringR * 0.42} fontWeight="800" fill={c.text}>{model.next}</text>
          <text x={ringX} y={ringY + ringR + (wide ? 62 : 70)} textAnchor="middle" fontFamily={FONT} fontSize={wide ? 34 : 40} fontWeight="600" fill={c.muted}>{S.next(model.next)}</text>
        </g>
      )}
      {layout === 'illustrated' && model.companion && (
        <g transform={p !== null ? `translate(${wide ? 450 : w - 260} ${wide ? h * 0.3 : h * 0.62})` : `translate(${wide ? w * 0.6 : w * 0.56} ${wide ? h * 0.18 : h * 0.06})`}>
          <Mascot kind={model.companion} look="happy" size={p !== null ? 200 : (wide ? 380 : 420)} animate={false} />
        </g>
      )}
    </>
  );
}

/**
 * @param {{ model: ReturnType<import('../../domain/share.js').shareModel>, variant: 'milestone'|'widget',
 *   layout: 'minimal'|'illustrated', theme: 'light'|'dark', shape: 'square'|'portrait'|'wide', S: object, label?: string }} props
 */
export const ShareCard = forwardRef(function ShareCard({ model, variant = 'milestone', layout = 'minimal', theme = 'light', shape = 'square', S, label }, ref) {
  const [w, h] = CARD_SIZE[shape] ?? CARD_SIZE.square;
  const c = CARD_THEMES[theme] ?? CARD_THEMES.light;
  const safe = { ...model, message: SHARE_MESSAGES.includes(model.message) ? model.message : 'step' };
  const Body = variant === 'widget' ? WidgetBody : MilestoneBody;
  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} className="share-card" data-variant={variant} data-layout={layout}
      data-theme-card={theme} data-shape={shape} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <Background w={w} h={h} c={c} layout={layout} rounded={variant === 'widget'} id={`sc-${variant}-${shape}-${theme}`} />
      <Body model={safe} layout={layout} w={w} h={h} c={c} S={S} />
    </svg>
  );
});
