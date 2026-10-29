// Service worker: offline app shell + gentle reminders. Never touches the
// network for anything except fetching its own files at install/update time.
'use strict';

// Filled in at build time by scripts/precache.js (vite.config.js): the content hash
// of the whole build and the list of every emitted file. Never edit by hand.
const VERSION = '__SW_VERSION__';
const CACHE = `jsz-shell-${VERSION}`;
const SHELL = __SW_PRECACHE__;

// Kept in sync with src/content/hu.js NOTIFICATION (classic SW cannot import ES modules everywhere).
const NOTE = {
  title: 'Egy perc magadra',
  body: 'Hogy telik a napod? Ha van kedved, nézz be.',
  actionOpen: 'Megnyitás',
  actionOff: 'Emlékeztetők kikapcsolása',
};
const SYNC_TAG = 'gentle-checkin';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Cache-first for our own GET requests; anything else is not handled.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await fetch(req);
    } catch {
      return (await caches.match('./index.html')) || Response.error();
    }
  })());
});

// --- Minimal access to the plaintext 'meta' record (same DB as the app) ---
function idb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('jozansag-szamlalo', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
// Every connection is closed after use, so it can never block the app's "delete all".
async function metaGet() {
  const db = await idb();
  return new Promise((resolve) => {
    const r = db.transaction('kv').objectStore('kv').get('meta');
    r.onsuccess = () => { db.close(); resolve(r.result); };
    r.onerror = () => { db.close(); resolve(undefined); };
  });
}
async function metaPatch(fn) {
  const db = await idb();
  return new Promise((resolve) => {
    const tx = db.transaction('kv', 'readwrite');
    const s = tx.objectStore('kv');
    const r = s.get('meta');
    r.onsuccess = () => { if (r.result) s.put(fn(r.result), 'meta'); };
    tx.oncomplete = tx.onerror = () => { db.close(); resolve(); };
  });
}
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function maybeRemind() {
  const meta = await metaGet();
  const rem = meta?.reminders;
  if (!rem?.enabled) return;
  const now = new Date();
  const [hh, mm] = String(rem.time || '20:00').split(':').map(Number);
  const due = now.getHours() > hh || (now.getHours() === hh && now.getMinutes() >= mm);
  if (!due || rem.lastShown === todayKey(now) || now.getHours() >= 23) return;
  await self.registration.showNotification(NOTE.title, {
    body: NOTE.body,
    icon: './icons/icon.svg',
    tag: 'gentle-checkin',
    silent: true,
    actions: [{ action: 'open', title: NOTE.actionOpen }, { action: 'off', title: NOTE.actionOff }],
  });
  await metaPatch((m) => ({ ...m, reminders: { ...m.reminders, lastShown: todayKey(now) } }));
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(maybeRemind());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    if (event.action === 'off') {
      // One-tap opt-out, straight from the notification.
      await metaPatch((m) => ({ ...m, reminders: { ...m.reminders, enabled: false } }));
      try { await self.registration.periodicSync?.unregister(SYNC_TAG); } catch { /* ignore */ }
      return;
    }
    const target = new URL('./#/rogzites/bejelentkezes', self.registration.scope).href;
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins[0]) { await wins[0].focus(); return wins[0].navigate(target); }
    return self.clients.openWindow(target);
  })());
});
