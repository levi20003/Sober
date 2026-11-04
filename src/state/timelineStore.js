// Timeline store: connects the pure reducer to the encrypted vault.
//
//   dispatch(action) → reducer → VaultStore.save (validate → encrypt → atomic write) → notify
//
// Persist-then-commit: subscribers only see a new snapshot after the encrypted
// write succeeded. A failed save (quota, storage error, locked vault) leaves the
// snapshot untouched and rejects, so the UI never shows unsaved history.
//
// Framework-agnostic external store (subscribe + getSnapshot); in React it would be
// useSyncExternalStore(timeline.subscribe, timeline.getSnapshot) – see src/hooks/useTimeline.js.

import { timelineReducer } from '../domain/timelineReducer.js';
import { computeStats, exactStartDays, phaseSummaries } from '../domain/timeline.js';
import { computeSavings } from '../domain/savings.js';
import { SAVINGS_MILESTONES } from '../content/index.js';
import { toDateKey } from '../domain/dates.js';

export function createTimelineStore(vault, { now = () => new Date() } = {}) {
  const listeners = new Set();
  let queue = Promise.resolve();
  let cache = null;

  function build() {
    const data = vault.data;
    const at = now();
    const today = toDateKey(at);
    const phases = phaseSummaries(data, today, at);
    return Object.freeze({ data, today, exactDays: exactStartDays(data, at), stats: computeStats(data, today, at), phases, savings: computeSavings(data, phases, today, SAVINGS_MILESTONES) });
  }

  const api = {
    /** The VaultStore this timeline writes to. */
    vault,

    /** Current derived view. Recomputed when the data or the calendar day changes. */
    getSnapshot() {
      if (!vault.isUnlocked) return cache; // locked mid-render: keep the last view, never decrypt
      const at = now();
      const today = toDateKey(at);
      // Újraszámolás naptári napváltáskor, és pontos kezdésnél akkor is, amikor betelik egy újabb 24 óra.
      if (!cache || cache.today !== today || (cache.exactDays !== null && cache.exactDays !== exactStartDays(vault.data, at))) cache = build();
      return cache;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Resolves with the reducer's effects once the change is encrypted and stored. */
    dispatch(action) {
      const run = async () => {
        const { data, effects } = timelineReducer(vault.data, action, { now: now() });
        await vault.save(data);
        cache = build();
        for (const fn of listeners) fn(cache);
        return effects;
      };
      const p = queue.then(run, run); // serialized: two quick taps cannot interleave
      queue = p.catch(() => {});
      return p;
    },

    /** Drop the cached view (e.g. after settings such as journeyStart changed). */
    invalidate() {
      cache = null;
    },

    /** Rebuild and notify subscribers after a change made outside the reducer (vault.save). */
    refresh() {
      cache = build();
      for (const fn of listeners) fn(cache);
    },
  };
  return api;
}
