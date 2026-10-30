// Detects the Android app shell (Capacitor). Inside it the app runs from
// https://localhost in a WebView and every file is already inside the APK, so a
// service worker has nothing to add. The check works even when Capacitor's JS
// bridge did not load (strict CSP on an old WebView): the origin is the fallback.

export function isNativeShell(g = globalThis) {
  try {
    if (g.Capacitor?.isNativePlatform?.()) return true;
    const loc = g.location;
    return loc?.protocol === 'https:' && loc?.hostname === 'localhost';
  } catch {
    return false;
  }
}
