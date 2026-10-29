// Detects commonly high-risk moments so the UI can surface gentle, tailored support.
// Pure functions: pass a Date for testability.

export function isLateNight(date) {
  const h = date.getHours();
  return h >= 22 || h < 5;
}

/** Friday 17:00 → Sunday 23:59 */
export function isWeekend(date) {
  const d = date.getDay();
  return (d === 5 && date.getHours() >= 17) || d === 6 || d === 0;
}

/**
 * Hours of day in which difficult moments or slips were logged on at least
 * `minDays` *different* days – one hard evening is not yet a pattern.
 */
export function personalRiskHours(events, minDays = 2) {
  const days = new Map();
  for (const e of events) {
    if (e.type !== 'trigger' && e.type !== 'slip') continue;
    const h = new Date(e.at).getHours();
    if (!days.has(h)) days.set(h, new Set());
    days.get(h).add(e.date);
  }
  return new Set([...days].filter(([, d]) => d.size >= minDays).map(([h]) => h));
}

/** Returns active risk contexts, most specific first: 'personal' | 'lateNight' | 'weekend'. */
export function riskContexts(date = new Date(), events = []) {
  const out = [];
  if (events.length && personalRiskHours(events).has(date.getHours())) out.push('personal');
  if (isLateNight(date)) out.push('lateNight');
  if (isWeekend(date)) out.push('weekend');
  return out;
}
