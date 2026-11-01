// Visszajelzés: egy előre kitöltött GitHub Issues űrlap hivatkozása. A kitöltött mezők: verzió és platform (nem személyes).
// A hivatkozás külső böngészőben nyílik; az app maga semmilyen adatot nem küld el.
import { isNativeShell } from './platform.js';

export const FEEDBACK_BASE = 'https://github.com/levi20003/Sober/issues/new';

export function feedbackUrl() {
  const q = new URLSearchParams({ template: 'feedback.yml', version: `${__APP_VERSION__}${isNativeShell() ? ' (APK)' : ' (web)'}` });
  return `${FEEDBACK_BASE}?${q}`;
}
