// Nézetátmenet (View Transitions API), ahol van; máshol a .page-enter CSS-halványítás adja a mozgást.
// A callback szinkron frissíti a React-állapotot (flushSync), hogy a böngésző a régi és az új képet össze tudja vetni.

import { flushSync } from 'react-dom';

export function motionReduced(doc = globalThis.document, win = globalThis) {
  return doc?.documentElement?.getAttribute('data-motion') === 'reduced' || Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export function withTransition(update, { doc = globalThis.document, win = globalThis } = {}) {
  if (!doc?.startViewTransition || motionReduced(doc, win)) { update(); return; }
  const t = doc.startViewTransition(() => { flushSync(update); });
  // A megszakadt átmenet (pl. forgatás közben) nem hiba: a tartalom ilyenkor is frissül.
  for (const p of [t?.ready, t?.finished, t?.updateCallbackDone]) p?.catch?.(() => {});
}
