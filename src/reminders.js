// Gentle daily reminders without any server.
//
// - Where supported (installed PWA on Chromium), Periodic Background Sync wakes
//   the service worker, which shows a neutral notification after the chosen time.
// - Everywhere else the app itself shows the check-in prompt when opened.
// - The preference lives in plaintext 'meta' (not the vault) because the
//   service worker cannot decrypt; it reveals only "reminders on, at HH:MM".

import { MISC, NOTIFICATION } from './content/index.js';

export const SYNC_TAG = 'gentle-checkin';

export function remindersSupported() {
  return 'Notification' in globalThis && 'serviceWorker' in navigator;
}

export const REMINDER_EVERY = [1, 2, 3, 7];

export async function enableReminders(store, time, everyDays = 1) {
  if (!remindersSupported()) throw new Error(MISC.notSupportedNotifications);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { enabled: false, denied: true };
  const m = await store.getMeta();
  const every = REMINDER_EVERY.includes(everyDays) ? everyDays : 1;
  await store.setMeta({ reminders: { ...m.reminders, enabled: true, time, everyDays: every }, notification: NOTIFICATION });
  let scheduled = false;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      await reg.periodicSync.register(SYNC_TAG, { minInterval: 6 * 60 * 60 * 1000 });
      scheduled = true;
    }
  } catch { /* not installed / not permitted – in-app fallback still works */ }
  return { enabled: true, scheduled };
}

export async function disableReminders(store) {
  const m = await store.getMeta();
  await store.setMeta({ reminders: { ...m.reminders, enabled: false } });
  try {
    const reg = await navigator.serviceWorker?.ready;
    await reg?.periodicSync?.unregister(SYNC_TAG);
  } catch { /* nothing scheduled */ }
}
