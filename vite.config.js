import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, precacheList, contentVersion, renderServiceWorker } from './scripts/precache.js';

const CSP_META = /\s*<meta http-equiv="Content-Security-Policy"[^>]*>/;

/** The dev server injects an inline React-refresh preamble, which the strict CSP forbids.
 *  The CSP is therefore removed ONLY when serving in development; builds keep it. */
function devOnlyRelaxCsp() {
  return { name: 'jsz-dev-csp', apply: 'serve', transformIndexHtml: (html) => html.replace(CSP_META, '') };
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
  plugins: [react(), devOnlyRelaxCsp(), serviceWorker()],
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
    restoreMocks: true,
  },
});
