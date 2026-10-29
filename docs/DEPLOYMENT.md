# Deployment

`npm run build` produces `dist/`, a folder of static files. Any static host works. HTTPS is **required**, because Web Crypto and service workers only run in secure contexts.

## Files to publish

Publish the contents of `dist/` only: `index.html`, `assets/` (hashed JS and CSS), `sw.js` (generated), `manifest.webmanifest`, `icons/`, `noscript.css`, and `_headers` if your host reads it.

## Headers

[`public/_headers`](../public/_headers) (Netlify / Cloudflare Pages syntax) sets CSP, `Referrer-Policy: no-referrer`, `nosniff`, `Permissions-Policy`, COOP, HSTS and `no-cache` on `index.html` and `sw.js`. For other hosts, copy the same values.

Note on CSP: the HTTP header allows `connect-src 'self'` because the **service worker** needs it to fetch its own files at install time. The page also carries a `<meta>` CSP with `connect-src 'none'`. Browsers enforce **both** policies, so the page itself still cannot make any request.

## Releasing an update

1. Bump `version` in `package.json`. The service worker's cache version and file list are generated automatically by the build: a content hash of every file in `dist/`.
2. Run `npm ci && npm test && npm run e2e`. The e2e runs against the production build.
3. Dependency updates: only exact versions published ≥ 14 days earlier; keep the `overrides` entry for `vite` in sync; review `npm audit`.
4. Deploy from a signed git tag. Publish SHA-256 hashes of the released files so the community can verify what is served.

## Local development

```bash
npm run dev       # Vite dev server (the CSP meta is stripped ONLY here, for React hot reload)
npm test          # Vitest
npm run build     # dist/
npm run serve     # serve dist/ with the production headers, http://127.0.0.1:8080
npm run e2e       # build + Playwright end-to-end in real Chromium
```
