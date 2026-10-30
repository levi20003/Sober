import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App.jsx';
import { createAppAuth } from './auth/appAuth.js';
import { openBestBackend } from './storage/backends.js';
import { createHashRouter } from './lib/hashRouter.js';
import { isNativeShell } from './lib/platform.js';

const auth = createAppAuth({ openBackend: openBestBackend });
const router = createHashRouter(window);

// Replaces the static crisis fallback in #app. The crisis overlay works before
// storage has even opened (INITIALIZING), so it is rendered first.
createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App auth={auth} router={router} />
  </StrictMode>,
);

auth.init().catch((err) => console.error(err));

addEventListener('unhandledrejection', (e) => console.error(e.reason));

// Not in the Android shell: its files are bundled in the APK, and the service
// worker could never install there (the build ignores dotfiles such as .nojekyll).
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isNativeShell()) {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e));
}
