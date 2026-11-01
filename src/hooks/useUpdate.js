import { createContext, useContext, useSyncExternalStore } from 'react';

export const UpdateContext = createContext(null);

const IDLE = Object.freeze({ supported: false, native: false, status: 'idle', ready: false });
const NOOP = { getState: () => IDLE, subscribe: () => () => {}, apply() {}, check: async () => IDLE };

/** { ...state, check, apply } – a frissítéskezelő állapota (src/lib/updateManager.js). */
export function useUpdate() {
  const m = useContext(UpdateContext) ?? NOOP;
  const state = useSyncExternalStore(m.subscribe, m.getState);
  return { ...state, check: m.check, apply: m.apply };
}
