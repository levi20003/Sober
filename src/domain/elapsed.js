// Élő számláló a főoldalon. Tiszta függvények (az időt kívülről kapják), helyi idő szerint.
//  - elapsedParts: a jelenlegi szakasz kezdete óta eltelt idő naptár szerint: év, hónap (a hónap végét levágva:
//    jan. 31 + 1 hónap = febr. vége), majd hét, nap, óra, perc, másodperc; és hogy az egyes egységek mennyire
//    teltek meg a következőig (csíkok).
//  - dayProgress: a mai nap éjféltől éjfélig (a kör). Éjfélkor betelik, újraindul, és a józan napok száma eggyel nő
//    (ugyanaz a naptári szabály, mint a domain/timeline.js számolása).

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;

const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

/** `start` + n hónap, a nap a hónap végére vágva, az időpont megmarad. */
export function addMonths(start, n) {
  const y = start.getFullYear();
  const m = start.getMonth() + n;
  const ty = y + Math.floor(m / 12);
  const tm = ((m % 12) + 12) % 12;
  const day = Math.min(start.getDate(), daysInMonth(ty, tm));
  return new Date(ty, tm, day, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
}

function addDays(date, n) {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

/** @returns {null | {years, months, weeks, days, hours, minutes, seconds, totalDays, progress}} */
export function elapsedParts(start, now) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime()) || now < start) return null;
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  while (months > 0 && addMonths(start, months) > now) months -= 1;
  const monthAnchor = addMonths(start, months);
  const nextMonth = addMonths(start, months + 1);
  let days = 0;
  while (addDays(monthAnchor, days + 1) <= now) days += 1;
  const dayAnchor = addDays(monthAnchor, days);
  const rest = now - dayAnchor;
  const hours = Math.floor(rest / HOUR);
  const minutes = Math.floor((rest % HOUR) / MIN);
  const seconds = Math.floor((rest % MIN) / SEC);
  let totalDays = 0;
  while (addDays(start, totalDays + 1) <= now) totalDays += 1;
  const dayFrac = rest / (addDays(dayAnchor, 1) - dayAnchor);
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    weeks: Math.floor(days / 7),
    days: days % 7,
    hours,
    minutes,
    seconds,
    totalDays,
    progress: {
      seconds: seconds / 60,
      minutes: (minutes + seconds / 60) / 60,
      hours: rest / (addDays(dayAnchor, 1) - dayAnchor),
      days: dayFrac,
      weeks: ((days % 7) + dayFrac) / 7,
      months: (now - monthAnchor) / (nextMonth - monthAnchor),
      years: ((months % 12) + (now - monthAnchor) / (nextMonth - monthAnchor)) / 12,
    },
  };
}

/** A mai nap haladása éjféltől (0) éjfélig (→1). */
export function dayProgress(now) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = addDays(midnight, 1);
  return (now - midnight) / (next - midnight);
}

/**
 * A jelenlegi szakasz kezdő pillanata: a kezdőnap éjfele, vagy ha a napló aznap indult és tudjuk a pontos időt
 * (profile.journeyStartAt), akkor az.
 */
export function phaseStartInstant(dateKey, exactIso) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const midnight = new Date(y, m - 1, d);
  if (exactIso) {
    const exact = new Date(exactIso);
    if (!Number.isNaN(exact.getTime()) && exact.getFullYear() === y && exact.getMonth() === m - 1 && exact.getDate() === d) return exact;
  }
  return midnight;
}
