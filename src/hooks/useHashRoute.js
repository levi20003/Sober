import { createContext, useContext, useSyncExternalStore } from 'react';

export const RouterContext = createContext(null);

/** { hash, base, navigate, closeCrisis } – base is the screen beneath the crisis overlay. */
export function useHashRoute() {
  const router = useContext(RouterContext);
  const { hash, base } = useSyncExternalStore(router.subscribe, router.getSnapshot);
  return { hash, base, navigate: router.navigate, closeCrisis: router.closeCrisis };
}
