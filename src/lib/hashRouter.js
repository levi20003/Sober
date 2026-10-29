// Minimal hash router as an external store. Tracks the last non-crisis route so
// the crisis overlay can sit ON TOP of the current screen (its state is kept)
// and closing it returns exactly there.

export const CRISIS_HASH = '#/segitseg';

export function createHashRouter(win = globalThis.window) {
  const listeners = new Set();
  const read = () => win.location.hash || '#/';
  let hash = read();
  let base = hash === CRISIS_HASH ? '#/' : hash;
  let openedInApp = false; // true when the crisis overlay was opened by navigating within this page
  let snapshot = { hash, base };

  const onChange = () => {
    const next = read();
    if (next === CRISIS_HASH && hash !== CRISIS_HASH) openedInApp = true;
    if (next !== CRISIS_HASH) { base = next; openedInApp = false; }
    hash = next;
    snapshot = { hash, base };
    for (const fn of listeners) fn();
  };
  win.addEventListener('hashchange', onChange);

  return {
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    navigate(to) {
      if (read() === to) onChange();
      else win.location.hash = to;
    },
    /** Leave the crisis overlay: back to where the user was, or home after a deep link. */
    closeCrisis() {
      if (openedInApp) win.history.back();
      else win.location.replace(`${win.location.pathname}${win.location.search}${base}`);
    },
    destroy: () => win.removeEventListener('hashchange', onChange),
  };
}
