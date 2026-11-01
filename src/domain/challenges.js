// Napi kis kihívások: a sorozat sosem vész el. A "láng" azt mutatja, az elmúlt 7 napból hány
// napon teljesítettél valamit, a teljes szám pedig csak nő.

import { addDays } from './dates.js';
import { pickDaily } from './daily.js';

/** The day's challenges (3 by default), personalised by the user's tags. */
export const challengesOfDay = (catalog, date, tags = [], count = 3) => pickDaily(catalog, { date, tags, count });

const done = (events) => events.filter((e) => e.type === 'challenge');

export function challengeStats(events, today) {
  const all = done(events);
  const days = new Set(all.map((e) => e.date));
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).filter((d) => days.has(d)).length;
  return {
    doneToday: all.filter((e) => e.date === today).map((e) => ({ id: e.challengeId, eventId: e.id })),
    totalDays: days.size,
    totalDone: all.length,
    last7,
    // 0 = nincs láng, 1–3 kis/közepes/nagy láng
    flame: last7 === 0 ? 0 : last7 <= 2 ? 1 : last7 <= 5 ? 2 : 3,
  };
}
