// Build-time service worker generation (used by vite.config.js, unit-tested).
// The SW precaches every emitted file, so the crisis screen and the whole app
// work offline. VERSION is a hash of all file contents: any change → new cache.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const EXCLUDE = /(^|\/)(sw\.js|_headers)$|\.map$/;

export function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** './' first (navigations), then every cacheable file, relative to the SW scope. */
export function precacheList(files) {
  return ['./', ...files.filter((f) => !EXCLUDE.test(f)).sort().map((f) => `./${f}`)];
}

export function contentVersion(dir, files) {
  const h = createHash('sha256');
  for (const f of files) h.update(f).update('\0').update(readFileSync(join(dir, f)));
  return h.digest('hex').slice(0, 16);
}

export function renderServiceWorker(template, { shell, version }) {
  if (!template.includes('__SW_PRECACHE__') || !template.includes('__SW_VERSION__')) {
    throw new Error('sw.template.js is missing its build placeholders');
  }
  return template.replace('__SW_PRECACHE__', JSON.stringify(shell, null, 2)).replace('__SW_VERSION__', version);
}
