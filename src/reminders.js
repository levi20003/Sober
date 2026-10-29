// Gentle daily reminders without any server.
//
// - Where supported (installed PWA on Chromium), Periodic Background Sync wakes
//   the service worker, which shows a neutral notification after the chosen time.
// - Everywhere else the app itself shows the check-in prompt when opened.
// - The preference lives in plaintext 'meta' (not the vault) because the
//   service worker cannot decrypt; it reveals only "reminders on, at HH:MM".

export const SYNC_TAG = 'gentle-checkin';

export function remindersSupported() {
  return 'Notification' in globalThis && 'serviceWorker' in navigator;
}

export async function enableReminders(store, time) {
  if (!remindersSupported()) throw new Error('Ez a böngésző nem támogatja az értesítéseket.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { enabled: false, denied: true };
  await store.setMeta({ reminders: { enabled: true, time } });
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
