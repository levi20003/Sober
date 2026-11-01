// Automatikus frissítés (PWA). Nincs saját hálózati hívás: a böngésző a service worker fájlját kéri le
// a saját forrásáról (ugyanígy, ahogy az első telepítéskor), a CSP connect-src 'none' érintetlen marad.
//
// Percenként (és indításkor, előtérbe kerüléskor) keres újat.
// Folyamat: a böngésző észleli az új sw.js-t → az telepíti és aktiválja magát (skipWaiting) →
// ez a kezelő "ready" állapotot jelez → a héj akkor tölti újra az oldalt, amikor ez nem veszít el semmit
// (zárolt képernyő), vagy amikor a felhasználó a "Frissítés" gombot nyomja.
// Az adatok a titkosított tárolóban vannak, az újratöltés őket nem érinti.
//
// Az Android-appban nincs service worker (a fájlok az APK-ban vannak): ott csak a verzió látszik, és a
// letöltési oldalra mutató hivatkozás.

const CHECK_EVERY_MS = 60_000; // percenként

export function createUpdateManager({
  sw = globalThis.navigator?.serviceWorker,
  reload = () => globalThis.location?.reload(),
  native = false,
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
} = {}) {
  const listeners = new Set();
  let reg = null;
  let state = { supported: Boolean(sw) && !native, native, status: 'idle', ready: false };
  const set = (patch) => {
    state = { ...state, ...patch };
    for (const fn of listeners) fn();
  };

  function watch(worker) {
    if (!worker) return;
    const onState = () => {
      // Csak akkor frissítés, ha már volt egy irányító worker: az első telepítés nem az.
      if ((worker.state === 'installed' || worker.state === 'activated') && sw.controller) set({ ready: true, status: 'ready' });
    };
    worker.addEventListener('statechange', onState);
    onState();
  }

  let timer = null;
  const api = {
    getState: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /** A service worker regisztrálása és a figyelés elindítása. */
    async start(url = './sw.js') {
      if (!state.supported) return null;
      try {
        reg = await sw.register(url);
      } catch (e) {
        set({ status: 'error' });
        return null;
      }
      if (!reg) { set({ status: 'error' }); return null; } // blokkolt service worker (pl. privát mód): nincs mit figyelni
      if (reg.waiting && sw.controller) set({ ready: true, status: 'ready' });
      watch(reg.installing);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      sw.addEventListener('controllerchange', () => { if (state.status !== 'idle') set({ ready: true, status: 'ready' }); });
      timer = setTimer(() => api.check({ silent: true }), CHECK_EVERY_MS);
      return reg;
    },

    /** Frissítés keresése. Offline állapotban csendben hibával tér vissza, nem dob. */
    async check({ silent = false } = {}) {
      if (!reg) return state;
      if (!silent) set({ status: 'checking' });
      try {
        await reg.update();
        // Ha közben talált újat, a watch() már "ready"-re állította.
        if (!state.ready) set({ status: silent ? state.status : 'uptodate' });
      } catch {
        if (!state.ready) set({ status: silent ? state.status : 'uptodate' });
      }
      return state;
    },

    /** Az új verzió használatba vétele. */
    apply() { reload(); },

    stop() { if (timer !== null) clearTimer(timer); timer = null; },
  };
  return api;
}
