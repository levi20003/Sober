// Shared render helpers for component tests (jsdom).
import { render } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { AuthContext } from '../../src/hooks/useAuth.js';
import { RouterContext } from '../../src/hooks/useHashRoute.js';
import { TimelineProvider } from '../../src/hooks/useTimeline.js';
import { ToastProvider } from '../../src/hooks/useToast.jsx';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { VaultStore } from '../../src/storage/store.js';
import { createInitialData } from '../../src/domain/schema.js';
import { addDays, toDateKey } from '../../src/domain/dates.js';

// jsdom's window.crypto may lack SubtleCrypto; the vault needs the real Web Crypto.
if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

export const PIN = '2581';
export const daysAgo = (n) => addDays(toDateKey(), -n);

/** A real, unlocked, encrypted vault (low KDF cost for speed). */
export async function makeVault({ startDaysAgo = 30, dailyCostHuf = 2500 } = {}) {
  const backend = new MemoryBackend();
  const vault = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await vault.create(PIN, createInitialData({ journeyStart: daysAgo(startDaysAgo), dailyCostHuf }));
  return { vault, backend };
}

export function renderWithApp(ui, { vault, auth = { subscribe: () => () => {}, getState: () => ({}) } } = {}) {
  window.location.hash = '';
  const router = createHashRouter(window);
  const tree = (
    <AuthContext.Provider value={auth}>
      <RouterContext.Provider value={router}>
        <ToastProvider>
          {vault ? <TimelineProvider vault={vault}>{ui}</TimelineProvider> : ui}
        </ToastProvider>
      </RouterContext.Provider>
    </AuthContext.Provider>
  );
  return { router, ...render(tree) };
}

export function fakeClock() {
  let t = 1_000;
  let fn = null;
  return {
    now: () => t,
    setTimer: (f) => { fn = f; return 1; },
    clearTimer: () => { fn = null; },
    advance(ms) { t += ms; fn?.(); },
  };
}
