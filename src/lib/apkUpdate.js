// Android-app frissítésfigyelő. A webes változat frissítését a service worker intézi (updateManager.js);
// az APK-ban nincs service worker, ezért itt percenként egyetlen, adatot nem küldő GET kérés megy a
// GitHub kiadási oldalára, és a kiadás leírásában szereplő "Verziókód: N" számot hasonlítja az app saját
// verziókódjához. A kérés semmilyen személyes adatot nem tartalmaz (csak a szokásos IP-cím látszik a GitHubnak).
// Telepíteni az Android nem engedi csendben: az "Frissítés" gomb a letöltési hivatkozást nyitja, a telepítést
// a felhasználó hagyja jóvá, és az új APK a régi fölé települ (az adat megmarad).
//
// A hálózati engedélyt csak az APK kapja (scripts/android-csp.mjs); a webes változat CSP-je változatlanul 'none'.

export const RELEASE_API = 'https://api.github.com/repos/levi20003/Sober/releases/tags/android-latest';
export const APK_URL = 'https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk';

export function parseVersionCode(body) {
  const m = /Verziókód:\s*(\d+)/.exec(String(body ?? ''));
  return m ? Number(m[1]) : null;
}

export function createApkUpdateManager({
  current = 0,
  enabled = () => true,
  fetchFn = (...a) => globalThis.fetch(...a),
  online = () => globalThis.navigator?.onLine !== false,
  open = (url) => globalThis.open?.(url, '_blank', 'noopener'),
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
  everyMs = 60_000,
} = {}) {
  const listeners = new Set();
  let state = { supported: true, native: true, status: 'idle', ready: false, latest: null };
  const set = (patch) => { state = { ...state, ...patch }; for (const fn of listeners) fn(); };
  let timer = null;

  const api = {
    getState: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** manual: a Beállítások gombja akkor is keres, ha a háttérkeresés ki van kapcsolva. */
    async check({ silent = false, manual = false } = {}) {
      if (!current) return state; // helyi build: nincs verziókód, nincs mivel összevetni
      if (!manual && !enabled()) return state;
      if (!online()) return state;
      if (!silent) set({ status: 'checking' });
      try {
        const r = await fetchFn(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const latest = parseVersionCode((await r.json()).body);
        const ready = latest !== null && latest > current;
        set({ latest, ready, status: ready ? 'ready' : silent ? state.status : 'uptodate' });
      } catch {
        if (!silent) set({ status: 'error' });
      }
      return state;
    },

    async start() {
      api.check({ silent: true });
      timer = setTimer(() => api.check({ silent: true }), everyMs);
    },

    apply() { open(APK_URL); },
    stop() { if (timer !== null) clearTimer(timer); timer = null; },
  };
  return api;
}
