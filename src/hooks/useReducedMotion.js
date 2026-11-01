import { useEffect, useState } from 'react';
import { usePrefs } from './usePrefs.js';

const QUERY = '(prefers-reduced-motion: reduce)';

/** Igaz, ha a rendszer VAGY a Beállítások kapcsolója szerint kevesebb mozgás kell. matchMedia nélkül (teszt) is igaz: nyugodt a biztos alap. */
export function useReducedMotion() {
  const [prefs] = usePrefs();
  const [system, setSystem] = useState(() => (globalThis.matchMedia ? globalThis.matchMedia(QUERY).matches : true));
  useEffect(() => {
    if (!globalThis.matchMedia) return undefined;
    const mq = globalThis.matchMedia(QUERY);
    const on = () => setSystem(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return system || prefs.motion === 'reduced';
}
