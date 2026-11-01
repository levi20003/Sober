// Napszak szerinti köszönés és magyar dátumformátum. Tiszta függvények (az órát kívülről kapják).

/** 'reggel' (5–9), 'nap' (10–17), 'este' (18–21), 'ejszaka' (22–4). */
export function dayPart(date) {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'reggel';
  if (h >= 10 && h < 18) return 'nap';
  if (h >= 18 && h < 22) return 'este';
  return 'ejszaka';
}

/** "vasárnap, november 1." (az Intl alapértelmezett sorrendje "november 1., vasárnap" lenne) */
export function formatDayHu(date) {
  const part = (opts) => new Intl.DateTimeFormat('hu-HU', opts).format(date);
  return `${part({ weekday: 'long' })}, ${part({ month: 'long' })} ${part({ day: 'numeric' })}.`;
}

/** Hungarian-style pluralization of a count with a unit, e.g. 12 nap. */
export const countUnit = (n, unit) => `${n} ${unit}`;
