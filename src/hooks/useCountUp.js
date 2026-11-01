import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/** 0-ról a célig számol (ease-out). Kevesebb mozgásnál azonnal a végérték. */
export function useCountUp(target, ms = 900) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced || target <= 0) { setV(target); return undefined; }
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);
  return reduced ? target : v;
}
