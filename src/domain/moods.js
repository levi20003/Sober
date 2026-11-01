// A 12 hangulatfigura számértékei és a belőlük számolt összesítések (helyben, a titkosított
// napló eseményeiből). Tiszta függvények: nincs óra, nincs I/O.
//
// energy / stress: a figura alapértéke (0–100), az erősség (1–5) módosítja (3 = alapérték).
// valence: -1 nehéz, 0 semleges, +1 könnyű érzés. A minták és a diagramok ezt használják.

import { addDays } from './dates.js';
import { LEGACY_MOOD_FIGURE } from './presets.js';

export const MOOD_FIGURES = [
  { id: 'excited', energy: 85, stress: 40, valence: 1 },
  { id: 'cheerful', energy: 70, stress: 15, valence: 1 },
  { id: 'grateful', energy: 55, stress: 10, valence: 1 },
  { id: 'energetic', energy: 92, stress: 25, valence: 1 },
  { id: 'sensitive', energy: 40, stress: 55, valence: 0 },
  { id: 'confused', energy: 45, stress: 62, valence: -1 },
  { id: 'bored', energy: 22, stress: 28, valence: 0 },
  { id: 'stressed', energy: 60, stress: 92, valence: -1 },
  { id: 'angry', energy: 82, stress: 84, valence: -1 },
  { id: 'unsure', energy: 38, stress: 60, valence: -1 },
  { id: 'hurt', energy: 28, stress: 72, valence: -1 },
  { id: 'guilty', energy: 30, stress: 74, valence: -1 },
];

const BY_ID = new Map(MOOD_FIGURES.map((m) => [m.id, m]));
const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

/** The figure a (possibly legacy) mood id is shown with, or null for no/unknown mood. */
export function figureOf(moodId) {
  return BY_ID.get(moodId) ?? BY_ID.get(LEGACY_MOOD_FIGURE[moodId]) ?? null;
}

/** Energy and stress (0–100) of one check-in. Intensity 1–5 scales the figure's base value. */
export function scoreCheckin(e) {
  const f = figureOf(e.mood);
  if (!f) return null;
  const k = 0.6 + 0.1 * (e.intensity ?? 3); // 0.7 … 1.1, 3 → 0.9
  const scale = k / 0.9;
  return { energy: clamp(f.energy * scale), stress: clamp(f.stress * scale), valence: f.valence };
}

const checkins = (events) => events.filter((e) => e.type === 'checkin' && figureOf(e.mood));

/** Last mood of a day (check-ins can be corrected later the same day). */
export function moodOnDay(events, date) {
  const day = checkins(events).filter((e) => e.date === date);
  return day.length ? day[day.length - 1] : null;
}

/** Monday-first calendar week containing `today`: 7 bubbles for "A heted egy pillantással". */
export function weekDigest(events, today) {
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  const monday = addDays(today, -dow);
  return ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((label, i) => {
    const date = addDays(monday, i);
    const c = date <= today ? moodOnDay(events, date) : null;
    return { date, label, isToday: date === today, isFuture: date > today, mood: c?.mood ?? null, figure: c ? figureOf(c.mood)?.id : null };
  });
}

/** Mood counts of the last 7 days (today included): donut segments + the most frequent one. */
export function weekMoods(events, today) {
  const from = addDays(today, -6);
  const list = checkins(events).filter((e) => e.date >= from && e.date <= today);
  const counts = new Map();
  for (const e of list) {
    const id = figureOf(e.mood).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const total = list.length;
  const segments = [...counts.entries()]
    .map(([mood, count]) => ({ mood, count, fraction: count / total }))
    .sort((a, b) => b.count - a.count || MOOD_FIGURES.findIndex((m) => m.id === a.mood) - MOOD_FIGURES.findIndex((m) => m.id === b.mood));
  return { total, segments, dominant: segments[0]?.mood ?? null };
}

/** 7-day averages and a per-day series (null = no check-in) for the energy / stress cards. */
export function energyStress(events, today) {
  const series = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const scores = checkins(events).filter((e) => e.date === date).map(scoreCheckin);
    const avg = (k) => (scores.length ? Math.round(scores.reduce((a, s) => a + s[k], 0) / scores.length) : null);
    return { date, energy: avg('energy'), stress: avg('stress') };
  });
  const mean = (k) => {
    const xs = series.map((d) => d[k]).filter((v) => v !== null);
    return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  };
  return { energy: mean('energy'), stress: mean('stress'), series, hasData: series.some((d) => d.energy !== null) };
}

/** Average valence (-1..1) of a date range [from, to] inclusive; null without check-ins. */
export function valenceBetween(events, from, to) {
  const xs = checkins(events).filter((e) => e.date >= from && e.date <= to).map((e) => figureOf(e.mood).valence);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

const isWeekend = (date) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());

/**
 * Patterns found locally in the last 90 days. Returns neutral descriptors, the UI words them:
 *   { id: 'weekend-stress', rate, weekdayRate }  – hard moods are clearly more common at weekends
 *   { id: 'weekday-stress', ... }                – the other way round
 *   { id: 'most-common', mood }                  – the most frequent mood overall
 * A pattern needs enough data to mean anything (min. 3 hard moods and 8 check-ins in total).
 */
export function moodPatterns(events, today) {
  const from = addDays(today, -89);
  const list = checkins(events).filter((e) => e.date >= from && e.date <= today);
  const out = [];
  if (list.length < 8) return out;

  const hard = (e) => figureOf(e.mood).valence < 0;
  const we = list.filter((e) => isWeekend(e.date));
  const wd = list.filter((e) => !isWeekend(e.date));
  const rate = (xs) => (xs.length ? xs.filter(hard).length / xs.length : 0);
  const weHard = we.filter(hard).length;
  const wdHard = wd.filter(hard).length;
  if (we.length >= 3 && weHard >= 3 && rate(we) >= 1.5 * rate(wd) && rate(we) > rate(wd)) {
    out.push({ id: 'weekend-stress', rate: rate(we), weekdayRate: rate(wd) });
  } else if (wd.length >= 3 && wdHard >= 3 && rate(wd) >= 1.5 * rate(we) && rate(wd) > rate(we)) {
    out.push({ id: 'weekday-stress', rate: rate(wd), weekendRate: rate(we) });
  }
  const counts = new Map();
  for (const e of list) counts.set(figureOf(e.mood).id, (counts.get(figureOf(e.mood).id) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) out.push({ id: 'most-common', mood: top[0], count: top[1] });
  return out;
}

