import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App.jsx';
import { createAppAuth } from './auth/appAuth.js';
import { openBestBackend } from './storage/backends.js';
import { createHashRouter } from './lib/hashRouter.js';
import { createUpdateManager } from './lib/updateManager.js';
import { createApkUpdateManager } from './lib/apkUpdate.js';
import { applyPrefs, getPrefs } from './hooks/usePrefs.js';
import { A11Y, T } from './content/index.js';
import { isNativeShell } from './lib/platform.js';

document.title = T.appName;
document.querySelector('.skip')?.replaceChildren(A11Y.skipLink);
applyPrefs(); // téma és "kevesebb mozgás" még az első kirajzolás előtt

const auth = createAppAuth({ openBackend: openBestBackend });
const router = createHashRouter(window);
const native = isNativeShell();
// Webes változat: service worker. Android-app: percenkénti kiadás-ellenőrzés (src/lib/apkUpdate.js).
const updates = native
  ? createApkUpdateManager({ current: __BUILD_NUMBER__, enabled: () => getPrefs().apkCheck })
  : createUpdateManager({ native });

// Replaces the static crisis fallback in #app. The crisis overlay works before
// storage has even opened (INITIALIZING), so it is rendered first.
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App auth={auth} router={router} updates={updates} />
  </StrictMode>,
);

auth.init().catch((err) => console.error(err));
if (native) {
  updates.start();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updates.check({ silent: true }); });
}

addEventListener('unhandledrejection', (e) => console.error(e.reason));

// Not in the Android shell: its files are bundled in the APK, and the service
// worker could never install there (the build ignores dotfiles such as .nojekyll).
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isNativeShell()) {
  updates.start('./sw.js');
  // Visszatéréskor (app előtérbe kerül) azonnal keresünk frissítést.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') updates.check({ silent: true }); });
}
