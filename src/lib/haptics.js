// Rövid rezgés visszajelzésnek. Csak valódi felhasználói érintés után próbálkozunk: e nélkül a böngésző letiltja,
// és figyelmeztetést ír a konzolra. Kevesebb mozgás beállításnál nincs rezgés.
export function haptic(ms = 8, { nav = globalThis.navigator, doc = globalThis.document } = {}) {
  if (!nav?.vibrate) return false;
  if (nav.userActivation && !nav.userActivation.hasBeenActive) return false;
  if (doc?.documentElement?.getAttribute('data-motion') === 'reduced') return false;
  try { return nav.vibrate(ms); } catch { return false; }
}
