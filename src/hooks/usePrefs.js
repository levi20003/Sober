// Megjelenési beállítások (téma, kevesebb mozgás). NEM személyes adat: csak két kapcsoló, ezért
// titkosítatlanul, a böngészőben marad (localStorage "jsz-ui"), így a zárolóképernyő is jó színekkel jelenik meg.
// Személyes adat (név, célok, hangulatok) ide soha nem kerül, az a titkosított tárolóban él.

import { useSyncExternalStore } from 'react';

const KEY = 'jsz-ui';
const listeners = new Set();
let cache = null;

function read() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { theme: ['light', 'dark'].includes(o.theme) ? o.theme : 'system', motion: o.motion === 'reduced' ? 'reduced' : 'full' };
  } catch { return { theme: 'system', motion: 'full' }; }
}

export function applyPrefs(prefs = getPrefs(), root = document.documentElement) {
  if (prefs.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', prefs.theme);
  if (prefs.motion === 'reduced') root.setAttribute('data-motion', 'reduced'); else root.removeAttribute('data-motion');
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
  if (prefs.theme !== 'system') {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => { if (i) m.remove(); else { m.removeAttribute('media'); m.setAttribute('content', dark ? '#14201f' : '#fbf7f2'); } });
  }
}

export function getPrefs() { return (cache ??= read()); }

export function setPrefs(patch) {
  cache = { ...getPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* privát mód: a beállítás csak az oldal életére él */ }
  applyPrefs(cache);
  for (const fn of listeners) fn();
}

export function usePrefs() {
  const prefs = useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, getPrefs);
  return [prefs, setPrefs];
}

/** Tesztekhez: a gyorsítótár eldobása. */
export function resetPrefsCache() { cache = null; }
