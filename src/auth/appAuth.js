// App lock state machine. The single owner of the VaultStore lifecycle.
//
//   INITIALIZING ──init()──► FIRST_TIME_SETUP ──setup()/restoreBackup()──► UNLOCKED
//                    └─────► LOCKED ──unlock()/recover()/restorePrevious()──► UNLOCKED
//   UNLOCKED ──lock(reason)──► LOCKED          (manual | inactivity | pagehide)
//   any ──resetAll()──► FIRST_TIME_SETUP        (zero-knowledge reset: wipes everything)
//
// Framework-agnostic: subscribe() + getState() follow the external-store contract,
// so a React wrapper would just be useSyncExternalStore(auth.subscribe, auth.getState).

import { VaultStore } from '../storage/store.js';

export const AuthStatus = Object.freeze({
  INITIALIZING: 'INITIALIZING',
  FIRST_TIME_SETUP: 'FIRST_TIME_SETUP',
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
});

export class AuthStateError extends Error {
  constructor(action, status) {
    super(`"${action}" nem lehetséges ebben az állapotban (${status}).`);
    this.name = 'AuthStateError';
    this.code = 'INVALID_STATE';
  }
}

const DEFAULT_AUTO_LOCK_MS = 5 * 60_000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart'];

/**
 * @param {object} opts
 * @param {() => Promise<object>} opts.openBackend  creates a fresh storage backend (also after a wipe)
 * @param {object} [opts.storeOptions]              forwarded to VaultStore (tests lower KDF cost here)
 * @param {() => number} [opts.now]
 */
export function createAppAuth({ openBackend, storeOptions = {}, now = () => Date.now() }) {
  let store = null;
  let lastActive = now();
  let autoLockMs = DEFAULT_AUTO_LOCK_MS;
  let state = {
    status: AuthStatus.INITIALIZING,
    error: null,               // { code, message, retryAfterMs? } of the last failed action
    canRestorePrevious: false, // set when the current record is corrupted but a previous copy exists
    lockReason: null,
    storageKind: null,         // 'indexeddb' | 'localstorage' | 'memory'
    persistent: true,
  };
  const listeners = new Set();
  let queue = Promise.resolve();

  function set(patch) {
    state = Object.freeze({ ...state, ...patch });
    for (const fn of listeners) fn(state);
  }

  // Serialize state-changing actions so a double tap cannot interleave unlock/reset.
  function run(fn) {
    const p = queue.then(fn, fn);
    queue = p.catch(() => {});
    return p;
  }

  function expectStatus(action, ...allowed) {
    if (!allowed.includes(state.status)) throw new AuthStateError(action, state.status);
  }

  async function attachStore() {
    const backend = await openBackend();
    store = new VaultStore(backend, { now, ...storeOptions });
    return { storageKind: backend.kind ?? 'unknown', persistent: store.isPersistent };
  }

  function enterUnlocked() {
    lastActive = now();
    autoLockMs = store.settings.autoLockMinutes * 60_000;
    set({ status: AuthStatus.UNLOCKED, error: null, canRestorePrevious: false, lockReason: null });
  }

  async function fail(err) {
    const error = { code: err?.code ?? 'UNKNOWN', message: err?.message ?? String(err) };
    if (err?.retryAfterMs) error.retryAfterMs = err.retryAfterMs;
    const canRestorePrevious = err?.code === 'CORRUPTED' && store ? await store.hasPrevious().catch(() => false) : false;
    set({ error, canRestorePrevious });
    throw err;
  }

  const api = {
    getState: () => state,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** The unlocked data store. Only valid while UNLOCKED (data access throws otherwise). */
    get store() {
      return store;
    },

    init: () => run(async () => {
      expectStatus('init', AuthStatus.INITIALIZING);
      const info = await attachStore();
      set({ ...info, status: (await store.exists()) ? AuthStatus.LOCKED : AuthStatus.FIRST_TIME_SETUP });
    }),

    /** Creates the vault. Returns the one-time recovery code. */
    setup: (pin, initialData) => run(async () => {
      expectStatus('setup', AuthStatus.FIRST_TIME_SETUP);
      try {
        const { recoveryCode } = await store.create(pin, initialData);
        enterUnlocked();
        return { recoveryCode };
      } catch (err) { return fail(err); }
    }),

    restoreBackup: (backup, pin) => run(async () => {
      expectStatus('restoreBackup', AuthStatus.FIRST_TIME_SETUP, AuthStatus.UNLOCKED);
      try {
        await store.importEncryptedBackup(backup, pin);
        enterUnlocked();
      } catch (err) { return fail(err); }
    }),

    unlock: (pin) => run(async () => {
      if (state.status === AuthStatus.UNLOCKED) return;
      expectStatus('unlock', AuthStatus.LOCKED);
      try {
        await store.unlock(pin);
        enterUnlocked();
      } catch (err) { return fail(err); }
    }),

    recover: (recoveryCode, newPin) => run(async () => {
      expectStatus('recover', AuthStatus.LOCKED);
      try {
        await store.recover(recoveryCode, newPin);
        enterUnlocked();
      } catch (err) { return fail(err); }
    }),

    restorePrevious: (pin) => run(async () => {
      expectStatus('restorePrevious', AuthStatus.LOCKED);
      try {
        await store.restorePrevious(pin);
        enterUnlocked();
      } catch (err) { return fail(err); }
    }),

    /**
     * Drops the in-memory key and decrypted data. Synchronous on purpose: it must
     * complete inside 'pagehide' before the page is frozen into the back/forward cache.
     */
    lock(reason = 'manual') {
      if (state.status !== AuthStatus.UNLOCKED) return;
      store.lock();
      set({ status: AuthStatus.LOCKED, lockReason: reason, error: null });
    },

    /**
     * Zero-knowledge reset for a forgotten PIN *and* recovery code: data cannot be
     * decrypted by anyone, so the only safe way forward is a full wipe.
     */
    resetAll: () => run(async () => {
      expectStatus('resetAll', AuthStatus.LOCKED, AuthStatus.UNLOCKED, AuthStatus.FIRST_TIME_SETUP);
      await store.wipe();
      const info = await attachStore(); // wipe() closed the old backend
      set({ ...info, status: AuthStatus.FIRST_TIME_SETUP, error: null, canRestorePrevious: false, lockReason: 'reset' });
    }),

    /** Call after the user changes the auto-lock setting. */
    refreshSettings() {
      if (state.status === AuthStatus.UNLOCKED) autoLockMs = store.settings.autoLockMinutes * 60_000;
    },

    touch() {
      lastActive = now();
    },

    /** Locks if the inactivity window has passed. Returns true if it locked. */
    checkInactivity() {
      if (state.status !== AuthStatus.UNLOCKED || now() - lastActive < autoLockMs) return false;
      api.lock('inactivity');
      return true;
    },

    /**
     * Wires browser lifecycle events. `target` is window-like, `doc` document-like.
     * Returns a detach function.
     */
    attachLifecycle({ target, doc, intervalMs = 15_000, setIntervalFn = setInterval, clearIntervalFn = clearInterval }) {
      const onActivity = () => api.touch();
      const onVisibility = () => api.checkInactivity();
      // pagehide fires on tab close, navigation away and before back/forward-cache freezing.
      // Locking here guarantees a restored page never shows decrypted data.
      const onPageHide = () => api.lock('pagehide');
      for (const ev of ACTIVITY_EVENTS) target.addEventListener(ev, onActivity, { passive: true });
      target.addEventListener('pagehide', onPageHide);
      doc.addEventListener('visibilitychange', onVisibility);
      const timer = setIntervalFn(() => api.checkInactivity(), intervalMs);
      return () => {
        for (const ev of ACTIVITY_EVENTS) target.removeEventListener(ev, onActivity);
        target.removeEventListener('pagehide', onPageHide);
        doc.removeEventListener('visibilitychange', onVisibility);
        clearIntervalFn(timer);
      };
    },
  };
  return api;
}
