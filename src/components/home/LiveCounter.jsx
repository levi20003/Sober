// Élő számláló: a jelenlegi szakasz kezdete óta eltelt idő naptár szerint (év, hó, hét, nap, óra, perc, mp),
// mindegyik alatt egy csík, ami a következő egységig telik. Másodpercenként frissül (rejtett lapon nem fut).
// A nagy szám (összes józan nap) és a kör a Hero-ban van; ez a részletes, „ketyegő” nézet.
import { useEffect, useState } from 'react';
import { HOME } from '../../content/index.js';
import { elapsedParts } from '../../domain/elapsed.js';

const defaultClock = {
  now: () => Date.now(),
  every(fn) {
    const id = setInterval(() => { if (document.visibilityState !== 'hidden') fn(); }, 1000);
    const vis = () => { if (document.visibilityState === 'visible') fn(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  },
};

export function useNow(clock = defaultClock) {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => clock.every(() => setNow(clock.now())), [clock]);
  return now;
}

const ORDER = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
const ALWAYS = new Set(['days', 'hours', 'minutes', 'seconds']);

export function LiveCounter({ start, clock = defaultClock }) {
  const now = useNow(clock);
  const p = elapsedParts(start, new Date(now));
  if (!p) return <p className="hero-sub">{HOME.liveStartsTomorrow}</p>;
  // Az üres vezető egységeket (pl. 0 év, 0 hó) nem mutatjuk; nap, óra, perc, mp mindig látszik.
  const first = ORDER.findIndex((u) => p[u] > 0 || ALWAYS.has(u));
  const units = ORDER.slice(first);
  return (
    <section className="live-counter" aria-label={HOME.liveTitle}>
      <p className="eyebrow">{HOME.liveTitle}</p>
      <div className="lc-grid" role="timer" aria-live="off">
        {units.map((u) => (
          <div key={u} className={`lc-cell lc-${u}`}>
            <span className="lc-value">{p[u]}</span>
            <span className="lc-label">{HOME.liveUnits[u]}</span>
            <span className="lc-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, Math.max(0, p.progress[u]))})` }} /></span>
          </div>
        ))}
      </div>
    </section>
  );
}
