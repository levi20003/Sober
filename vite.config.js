import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, precacheList, contentVersion, renderServiceWorker } from './scripts/precache.js';

const APP_VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version;
// A kiadási aláíró tanúsítvány lenyomata (nyilvános): az app ezzel ismeri fel a debug kulccsal aláírt telepítést.
const RELEASE_CERT_SHA256 = readFileSync('android/signing-fingerprint.txt', 'utf8').split('\n').find((l) => /^[0-9a-f]{64}$/.test(l.trim())).trim();
const CSP_META = /\s*<meta http-equiv="Content-Security-Policy"[^>]*>/;

/** The dev server injects an inline React-refresh preamble, which the strict CSP forbids.
 *  The CSP is therefore removed ONLY when serving in development; builds keep it. */
function devOnlyRelaxCsp() {
  return { name: 'jsz-dev-csp', apply: 'serve', transformIndexHtml: (html) => html.replace(CSP_META, '') };
}

/** Supply chain (audit 1.4): lists every module that ended up in the bundle (build-report/modules.json, NOT shipped). */
function bundleReport() {
  return {
    name: 'jsz-bundle-report',
    apply: 'build',
    generateBundle(_, bundle) {
      const modules = new Set();
      for (const chunk of Object.values(bundle)) if (chunk.type === 'chunk') for (const id of Object.keys(chunk.modules)) modules.add(id);
      mkdirSync('build-report', { recursive: true });
      writeFileSync('build-report/modules.json', JSON.stringify([...modules].sort(), null, 2));
    },
  };
}

/** Writes dist/sw.js with the full precache list and a content-hash version. */
function serviceWorker() {
  let outDir;
  return {
    name: 'jsz-service-worker',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir; },
    closeBundle() {
      const files = listFiles(outDir).filter((f) => f !== 'sw.js');
      const sw = renderServiceWorker(readFileSync('src/sw/sw.template.js', 'utf8'), {
        shell: precacheList(files),
        version: contentVersion(outDir, files),
      });
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION), __BUILD_NUMBER__: JSON.stringify(Number(process.env.ANDROID_VERSION_CODE) || 0), __RELEASE_CERT_SHA256__: JSON.stringify(RELEASE_CERT_SHA256) },
  plugins: [react(), devOnlyRelaxCsp(), serviceWorker(), bundleReport()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,          // no data: URIs; every asset is a plain file the SW can cache
    modulePreload: { polyfill: false }, // the polyfill would be an inline script under some setups
  },
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
    env: { VITE_LOCALE: 'hu' }, // a tesztek magyar felületet várnak; az angolt külön tesztek töltik be
    restoreMocks: true,
  },
});
