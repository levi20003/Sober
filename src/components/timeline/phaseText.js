import { T } from '../../content/hu.js';
import { formatDateHu, addDays } from '../../domain/dates.js';
import { labelOf } from '../../domain/presets.js';

export function phaseDatesText(p, today) {
  if ((p.current && p.start > today) || (p.days === 0 && !p.current)) return formatDateHu(p.start); // not started yet / consecutive slip days
  return T.phaseDates(formatDateHu(p.start), p.end && formatDateHu(addDays(p.end, -1)));
}

/** The big number on a card. A brand-new phase never shows a bare "0 nap". */
export function phaseHeadline(p, today) {
  if (p.current && p.start > today) return T.phaseStartsTomorrowBig;
  if (p.current && p.days === 0) return T.phaseStartedToday;
  return T.days(p.days);
}

export function eventDetails(e) {
  const lines = [];
  if (e.mood) lines.push(`${T.moodLabel}: ${labelOf('mood', e.mood)}`);
  if (e.sleep) lines.push(`Alvás: ${labelOf('sleep', e.sleep)}`);
  if (e.craving !== undefined) lines.push(`Sóvárgás: ${labelOf('craving', e.craving)}`);
  if (e.triggers?.length) lines.push(`Helyzet: ${e.triggers.map((t) => labelOf('trigger', t)).join(', ')}`);
  if (e.intensity) lines.push(`Erősség: ${e.intensity}/5`);
  if (e.coping?.length) lines.push(`Segített: ${e.coping.map((c) => labelOf('coping', c)).join(', ')}`);
  if (e.outcome) lines.push(labelOf('outcome', e.outcome));
  if (e.lesson) lines.push(`Tanulság: ${e.lesson}`);
  if (e.intention) lines.push(`Amire figyelek: ${e.intention}`);
  return lines;
}
