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

## Android APK

The same `dist/` is packaged as a native Android app with [Capacitor](https://capacitorjs.com/) (`capacitor.config.json`, `android/`). The web files ship inside the APK and are served from the device, so the app works offline from the first launch. The Capacitor packages are **dev dependencies only**: nothing from them is imported by the web bundle.

- **CI:** [`.github/workflows/android.yml`](../.github/workflows/android.yml) runs the tests, builds `dist/`, runs `cap sync android` and `./gradlew assembleRelease`. Every push to `main` replaces the `android-latest` pre-release, so the newest APK is always at `https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk` (with a `.sha256` next to it). Pull requests build the APK as a workflow artifact only.
- **Signing:** set the repository secrets `ANDROID_KEYSTORE_BASE64` (base64 of a `.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD`. Without them the APK is signed with the runner's throwaway debug key: it installs, but the next build has a different key, so Android refuses to install it as an update (uninstalling deletes the local data; make an encrypted backup first). Never commit the keystore.
- **Privacy hardening:** `allowBackup="false"` plus `data_extraction_rules.xml` keep the vault out of Google cloud backup and device-to-device transfer.
- **Local build:** `npm run android` (build + sync), then open `android/` in Android Studio, or `cd android && ./gradlew assembleDebug` with an Android SDK installed.
- **Icons/splash:** the PNGs under `android/app/src/main/res/mipmap-*` and `drawable*/splash.png` were rendered from `public/icons/icon.svg` and `icon-maskable.svg`; re-render them if the icon changes.

## Local development

```bash
npm run dev       # Vite dev server (the CSP meta is stripped ONLY here, for React hot reload)
npm test          # Vitest
npm run build     # dist/
npm run serve     # serve dist/ with the production headers, http://127.0.0.1:8080
npm run e2e       # build + Playwright end-to-end in real Chromium
```

## Android: állandó aláírókulcs

Az APK frissítése csak akkor települ a telefonon lévő verzió fölé, ha **ugyanazzal a kulccsal** van aláírva, és a verziókódja nagyobb. A verziókódot a CI adja (`100 + a futás sorszáma`). A kulcsot egyszer kell létrehozni:

```bash
keytool -genkeypair -v -keystore release.jks -alias sober -keyalg RSA -keysize 4096 -validity 10000
base64 -w0 release.jks > release.jks.base64     # macOS: base64 -i release.jks | tr -d '\n'
```

Ezután a GitHubon (**Settings → Secrets and variables → Actions → New repository secret**) négy titkot kell megadni:

| Titok | Érték |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | a `release.jks.base64` fájl teljes tartalma |
| `ANDROID_KEYSTORE_PASSWORD` | a keystore jelszava |
| `ANDROID_KEY_ALIAS` | `sober` |
| `ANDROID_KEY_PASSWORD` | a kulcs jelszava |

- A keystore **soha nem kerülhet a repóba** (a `.gitignore` kizárja a `*.jks`, `*.keystore` fájlokat).
- **Őrizz meg egy biztonsági másolatot** (jelszókezelő vagy offline tároló). Ha a kulcs elvész, nem lehet többé frissítést kiadni a már telepített appokhoz: az újratelepítéssel a felhasználók naplója is elvész.
- A CI minden build után kiírja az aláíró tanúsítvány SHA-256 ujjlenyomatát (`apksigner verify --print-certs`) és a kiadás leírásába is beleteszi. Két build ujjlenyomata egyezik, ha a frissítés települni fog.
- Az első, állandó kulccsal aláírt APK telepítése előtt a telefonról **egyszer el kell távolítani** a korábbi, debug kulccsal aláírt változatot.

## Android: emulátoros próba

A `.github/workflows/android.yml` `emulator-smoke` jobja egy API 35-ös emulátorra telepíti az APK-t, és a `scripts/android-smoke.mjs` a valódi WebView-t a Chrome DevTools protokollal vezérli. A próbabuild WebView-hibakeresése csak ebben a jobban van bekapcsolva (a kiadott APK-ban `webContentsDebuggingEnabled: false`). Hiba esetén a futás annotációi tartalmazzák a lépéseket és a logcat releváns sorait, a képernyőképek az `android-smoke` artifactban vannak.
