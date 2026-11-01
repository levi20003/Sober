// Csak az APK-hoz: a dist/index.html CSP-jében a connect-src 'none' helyett pontosan egy címet engedünk,
// a GitHub kiadási API-t (az APK frissítésfigyelőjéhez, src/lib/apkUpdate.js). A webes build nem érintett.
import { readFileSync, writeFileSync } from 'node:fs';

export const ALLOWED = 'https://api.github.com';

export function patchCsp(html) {
  const meta = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/.exec(html);
  if (!meta || !meta[0].includes("connect-src 'none'")) throw new Error("A dist/index.html CSP-jében nincs connect-src 'none'");
  // A Trusted Types-t az APK-ban kivesszük: a Capacitor natív hídja a WebView-ba injektált szkripttel dolgozik, amit
  // nem tudunk Trusted Types-szal ellátni (a webes változatban marad, ott az e2e méri, hogy nincs CSP-sértés).
  return html.replace(meta[0], meta[0].replace("connect-src 'none'", `connect-src ${ALLOWED}`).replace("; require-trusted-types-for 'script'", ''));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] ?? 'dist/index.html';
  writeFileSync(file, patchCsp(readFileSync(file, 'utf8')));
  console.log(`APK CSP: connect-src ${ALLOWED} (${file})`);
}
