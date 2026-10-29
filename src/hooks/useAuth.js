import { createContext, useContext, useSyncExternalStore } from 'react';

/** Holds the auth state machine (src/auth/appAuth.js). */
export const AuthContext = createContext(null);

/** { auth, state } – state: { status: FIRST_TIME_SETUP|LOCKED|UNLOCKED|…, error, … } */
export function useAuth() {
  const auth = useContext(AuthContext);
  const state = useSyncExternalStore(auth.subscribe, auth.getState);
  return { auth, state };
}
