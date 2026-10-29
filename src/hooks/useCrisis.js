// useCrisis: open/close state of the crisis overlay, synced with the URL (#/segitseg).
// URL-driven on purpose: the trigger is a plain link (works before JS has loaded),
// the manifest shortcut and notifications can deep-link to it, and Back closes it.

import { useHashRoute } from './useHashRoute.js';
import { CRISIS_HASH } from '../lib/hashRouter.js';

export function useCrisis() {
  const { hash, navigate, closeCrisis } = useHashRoute();
  return {
    isOpen: hash === CRISIS_HASH,
    href: CRISIS_HASH,
    open: () => navigate(CRISIS_HASH),
    close: closeCrisis,
  };
}
