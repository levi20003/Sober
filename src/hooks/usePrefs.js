// Megjelenési és nyelvi beállítások (téma, kevesebb mozgás, nyelv, ország, pénznem, frissítés-keresés). NEM személyes adat:
// csak néhány kapcsoló, ezért titkosítatlanul, a böngészőben marad (localStorage "jsz-ui"), így a zárolóképernyő is jó
// színekkel és nyelven jelenik meg. Személyes adat (név, célok, hangulatok) ide soha nem kerül, az a titkosított tárolóban él.
// Csak a kifejezetten megadott értékeket mentjük; ami hiányzik, az automatikusan (rendszernyelv, régió) dől el.

import { useSyncExternalStore } from 'react';
import { COUNTRY_IDS, LOCALES, detectCountry, locale } from '../i18n/locale.js';
import { CURRENCY_IDS, currency } from '../i18n/money.js';

const KEY = 'jsz-ui';
const listeners = new Set();
let raw = null;
let cache = null;

function readRaw() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') ?? {}; } catch { return {}; }
}

function derive(r) {
  return {
    theme: ['light', 'dark'].includes(r.theme) ? r.theme : 'system',
    motion: r.motion === 'reduced' ? 'reduced' : 'full',
    apkCheck: r.apkCheck !== false,
    // FLAG_SECURE (Android-app). Termékdöntésre vár (docs/audit/ARGON2-DONTES.md): addig alapból kikapcsolva.
    secureScreen: r.secureScreen === true,
    lang: LOCALES.includes(r.lang) ? r.lang : locale,
    country: COUNTRY_IDS.includes(r.country) ? r.country : detectCountry(),
    currency: CURRENCY_IDS.includes(r.currency) ? r.currency : currency,
    seen: Array.isArray(r.seen) ? r.seen.filter((x) => typeof x === 'string').slice(0, 50) : [],
  };
}

export function applyPrefs(prefs = getPrefs(), root = document.documentElement) {
  if (prefs.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', prefs.theme);
  if (prefs.motion === 'reduced') root.setAttribute('data-motion', 'reduced'); else root.removeAttribute('data-motion');
  root.setAttribute('lang', locale);
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
  if (prefs.theme !== 'system') {
    document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => { if (i) m.remove(); else { m.removeAttribute('media'); m.setAttribute('content', dark ? '#14111f' : '#fbf7f2'); } });
  }
}

export function getPrefs() {
  if (!cache) { raw = readRaw(); cache = derive(raw); }
  return cache;
}

export function setPrefs(patch) {
  getPrefs();
  raw = { ...raw, ...patch };
  cache = derive(raw);
  try { localStorage.setItem(KEY, JSON.stringify(raw)); } catch { /* privát mód: a beállítás csak az oldal életére él */ }
  applyPrefs(cache);
  for (const fn of listeners) fn();
}

export function usePrefs() {
  const prefs = useSyncExternalStore((fn) => { listeners.add(fn); return () => listeners.delete(fn); }, getPrefs);
  return [prefs, setPrefs];
}

/** Egyszeri tudnivalók (pl. az előzetes verzió jelzése): "már láttam" jelzők, nem személyes adat. */
export const hasSeen = (key) => getPrefs().seen.includes(key);
export const markSeen = (key) => { if (!hasSeen(key)) setPrefs({ seen: [...getPrefs().seen, key] }); };

/** Tesztekhez: a gyorsítótár eldobása. */
export function resetPrefsCache() { cache = null; raw = null; }
