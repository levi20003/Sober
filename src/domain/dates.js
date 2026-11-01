// Calendar-day arithmetic on local "YYYY-MM-DD" keys.
// Days are compared as calendar dates (not 24h spans) so DST changes and
// late-night entries never shift a count by one.

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isValidDateKey(key) {
  if (typeof key !== 'string') return false;
  const m = KEY_RE.exec(key);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function keyToUtcMs(key) {
  if (!isValidDateKey(key)) throw new RangeError(`Érvénytelen dátum: ${key}`);
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function diffDays(from, to) {
  return Math.round((keyToUtcMs(to) - keyToUtcMs(from)) / DAY_MS);
}

export function addDays(key, n) {
  const dt = new Date(keyToUtcMs(key) + n * DAY_MS);
  return dt.toISOString().slice(0, 10);
}

export function compareKeys(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatDateHu(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
}

/** 'YYYY-MM-01' of the month containing `key`. */
export const startOfMonth = (key) => `${key.slice(0, 7)}-01`;

/** First day of the month `n` months after (or before, n < 0) the month of `key`. */
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}-01`;
}

/** "november", "2026. november" – for chart axes and month lists. */
export function monthNameHu(key, { year = false } = {}) {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('hu-HU', year ? { year: 'numeric', month: 'long', timeZone: 'UTC' } : { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
}
