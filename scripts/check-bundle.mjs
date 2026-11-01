// Supply chain check (audit 1.4): the shipped JS bundle may contain only react, react-dom, scheduler and this repository's
// own code. Run after "npm run build" (vite writes build-report/modules.json). Exit code 1 on anything else.
import { readFileSync } from 'node:fs';

export const ALLOWED_PACKAGES = ['react', 'react-dom', 'scheduler'];

export function foreignPackages(moduleIds) {
  const pkgs = new Set();
  for (const id of moduleIds) {
    const m = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(id.replaceAll('\\', '/'));
    if (m) pkgs.add(m[1]);
  }
  return [...pkgs].filter((p) => !ALLOWED_PACKAGES.includes(p)).sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = JSON.parse(readFileSync('build-report/modules.json', 'utf8'));
  const bad = foreignPackages(ids);
  if (bad.length) {
    console.error(`::error::A bundle-ben nem engedélyezett csomag van: ${bad.join(', ')}`);
    process.exit(1);
  }
  console.log(`Bundle rendben: ${ids.length} modul, külső csomag csak: ${ALLOWED_PACKAGES.join(', ')}`);
}
