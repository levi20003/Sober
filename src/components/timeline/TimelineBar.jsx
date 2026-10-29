import { T } from '../../content/hu.js';

/**
 * Proportional bar: one segment per phase (width ∝ days, min. visible), slip days
 * as small neutral markers (never red). Decorative summary; phase cards carry the content.
 */
export function TimelineBar({ phases, totalSoberDays }) {
  return (
    <div className="timeline-bar" role="img" aria-label={T.timelineAria(phases.length, totalSoberDays)}>
      {phases.map((p, i) => [
        i > 0 && <span key={`g${i}`} className="tl-gap" />,
        <span key={`s${i}`} className={`tl-seg${p.current ? ' tl-current' : ''}`} style={{ flexGrow: Math.max(p.days, 1) }} />,
      ])}
    </div>
  );
}
