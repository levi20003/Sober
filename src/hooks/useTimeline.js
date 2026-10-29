// useTimeline: the event-driven timeline as a React hook.
//
//   const { snapshot, dispatch } = useTimeline();
//   const effects = await dispatch({ type: Actions.FRESH_START, payload: { lesson } });
//
// dispatch runs the pure reducer (src/domain/timelineReducer.js), encrypts and
// stores the result, and only then publishes the new snapshot (persist-then-commit,
// src/state/timelineStore.js). snapshot = { data, today, stats, phases, savings }.

import { createContext, createElement, useContext, useMemo, useSyncExternalStore } from 'react';
import { createTimelineStore } from '../state/timelineStore.js';

const TimelineContext = createContext(null);

/** Binds a timeline store to the unlocked VaultStore. Render only while UNLOCKED. */
export function TimelineProvider({ vault, now, children }) {
  const store = useMemo(() => createTimelineStore(vault, now ? { now } : undefined), [vault, now]);
  return createElement(TimelineContext.Provider, { value: store }, children);
}

export function useTimeline() {
  const store = useContext(TimelineContext);
  if (!store) throw new Error('useTimeline must be used inside <TimelineProvider>');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { snapshot, dispatch: store.dispatch, refresh: store.refresh, vault: store.vault };
}
