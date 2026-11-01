// Saját konfetti: rögzített számú <i>, CSS-animáció (transform + opacity). Kevesebb mozgásnál nem jelenik meg.
import { useMemo } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

const COLORS = ['#ff6b5e', '#ffc53d', '#17a673', '#7a4dff', '#ff8fb8', '#4fb3ff'];

export function Confetti({ count = 36 }) {
  const reduced = useReducedMotion();
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: `${(i * 97) % 100}%`, c: COLORS[i % COLORS.length], t: `${1.8 + ((i * 37) % 14) / 10}s`, dl: `${((i * 53) % 60) / 100}s`,
    dx: `${((i * 41) % 120) - 60}px`, r: `${360 + ((i * 29) % 360)}deg`,
  })), [count]);
  if (reduced) return null;
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ '--x': b.x, '--c': b.c, '--t': b.t, '--dl': b.dl, '--dx': b.dx, '--r': b.r }} />)}
    </div>
  );
}
