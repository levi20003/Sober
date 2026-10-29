import { MemoryBackend } from '../src/storage/backends.js';
import { VaultStore } from '../src/storage/store.js';
import { createInitialData } from '../src/domain/schema.js';

// Low iterations keep the suite fast; production defaults are asserted separately.
export function makeStore(opts = {}) {
  const backend = opts.backend ?? new MemoryBackend();
  let t = opts.start ?? 1_700_000_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000, now: clock.now });
  return { store, backend, clock };
}

export const initial = (over = {}) => createInitialData({ journeyStart: '2026-01-01', dailyCostHuf: 2500, ...over });

/** Map-backed Web Storage fake with an optional byte quota (UTF-16: 2 bytes/char, like browsers). */
export class FakeStorage {
  constructor({ quotaBytes = Infinity, blocked = false } = {}) {
    this.items = new Map();
    this.quotaBytes = quotaBytes;
    this.blocked = blocked;
  }
  #check() {
    if (this.blocked) throw Object.assign(new Error('The operation is insecure.'), { name: 'SecurityError' });
  }
  get length() { return this.items.size; }
  key(i) { return [...this.items.keys()][i] ?? null; }
  getItem(k) { this.#check(); return this.items.has(k) ? this.items.get(k) : null; }
  setItem(k, v) {
    this.#check();
    const next = new Map(this.items).set(k, String(v));
    const bytes = [...next].reduce((n, [a, b]) => n + 2 * (a.length + b.length), 0);
    if (bytes > this.quotaBytes) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
    this.items = next;
  }
  removeItem(k) { this.#check(); this.items.delete(k); }
  dump() { return JSON.stringify([...this.items]); }
}

/** Test helpers for the v2 effective-dated cost model. */
export const withCost = (data, dailyCostHuf) => ({
  ...data, settings: { ...data.settings, costHistory: [{ from: data.profile.journeyStart, dailyCostHuf }] },
});
export const costOf = (data) => data.settings.costHistory.at(-1).dailyCostHuf;
