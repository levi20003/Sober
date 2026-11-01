// Napi váltogatás: ugyanazon a napon mindig ugyanazt kapja a felhasználó (nincs véletlen,
// ami minden megnyitáskor mást mutatna), másnap más jön.

/** Small stable string hash → non-negative int. */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Picks `count` items for a day. Items whose tags match the user's goal/triggers come first;
 * within equal relevance the order rotates with the date.
 * @param {{id: string, tags?: string[]}[]} items
 * @param {{date: string, tags?: string[], count?: number}} opts
 */
export function pickDaily(items, { date, tags = [], count = 3 }) {
  const want = new Set(tags);
  const scored = items.map((it, i) => ({
    it,
    relevance: (it.tags ?? []).filter((t) => want.has(t)).length,
    order: hash(`${date}|${it.id}`) + i * 0, // rotates daily
  }));
  scored.sort((a, b) => b.relevance - a.relevance || a.order - b.order);
  return scored.slice(0, count).map((s) => s.it);
}

/** One item for a day (e.g. the daily encouragement). */
export const pickOne = (items, opts) => pickDaily(items, { ...opts, count: 1 })[0] ?? null;
