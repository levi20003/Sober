# Biztonsági audit (web, tárolás, ellátási lánc)

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**

Kapcsolódó dokumentumok:
- kriptográfia: `CRYPTOGRAPHY-REVIEW.md`
- Android: `ANDROID-SECURITY-REVIEW.md`
- minden megállapítás teljes sablonnal: `RISK-REGISTER.md`

## Módszer és futtatott ellenőrzések
- Kódolvasás: `src/`, `scripts/`, `android/`, `.github/`, dokumentáció. Minden dokumentációs állítást a kóddal vetettem össze.
- `npm test` a HEAD-en: **345/345 teszt, 38 fájl, zöld** (2026-11-02).
- `npm run e2e` (Chromium, valódi IndexedDB, PBKDF2 600k, service worker, CSP) a HEAD-en: **25 lépés, E2E OK** (2026-11-02).
- `npm audit`: 6 moderate (csak fejlesztői eszközök), `npm audit --omit=dev`: 0.
- GitHub API (read-only): ágvédelem, privát sebezhetőség-bejelentés, nyitott PR-ok, a HEAD CI-futása.
- **Nem futtattam:** külső hálózati teszteket az éles URL-en, valódi eszközös vizsgálatot, dinamikus fuzzingot.

## Tárolás – van-e titkosítatlan érzékeny adat?

| Hely | Tartalom | Titkosított? | Bizonyíték |
|---|---|---|---|
| IndexedDB `kv/vault`, `kv/vault.prev` | napló, profil, megbízható személy | **igen** (AES-GCM) | `store.js:141-149,238` |
| IndexedDB `kv/meta` | próbálkozás, várakozás, `pinHint`, emlékeztető (be/ki, idő, utolsó megjelenés), utolsó mentés, értesítés szövege | nem | `store.js:46-49`; `src/reminders.js:21` |
| localStorage `jozansag-szamlalo:*` | tartalék tároló (titkosított rekord), `has-idb-vault` jelző | a rekord igen, a jelző nem | `backends.js:139-200` |
| localStorage `jsz-ui`, `jsz-apk-last-check` | nyelv, ország, pénznem, téma, látott tudnivalók, `apkCheck`, `secureScreen`; az utolsó frissítéskeresés ideje | nem (nem tartalom) | `usePrefs.js:16-28`; `apkUpdate.js:14-16` |
| sessionStorage | nincs használatban | – | keresés: 0 találat |
| Cache Storage | csak a build fájljai | nem érzékeny | `sw.template.js:20-44` |
| Android `cache/backups/` | az utoljára megosztott **titkosított** mentés (a következő megosztásig) | igen | `JszFilesPlugin.java:96-104` |
| Android `cache/updates/` | a letöltött APK | nem érzékeny | `JszUpdaterPlugin.java:47-49` |
| Nyílt CSV/JSON export | a teljes napló | **nem**: felhasználói döntés, figyelmeztetéssel | `Settings.jsx:241-247`; `hu.js:312` |
| Vágólap | helyreállító kód (koppintásra) | nem | `RecoveryCodeCard.jsx:15` (figyelmeztetéssel) |
| Konzol / logcat | csak a hiba neve és kódja, idegen hibaüzenet nélkül; a natív kód nem naplóz | – | `src/lib/log.js:1-22`; `tests/backup.test.js` M11; `tests/android.test.js` |
| Capacitor Preferences | nincs használatban | – | keresés: 0 találat |

Titkosítatlan **napló-tartalom** egyik tárolási helyen sem található. A titkosítatlan metaadatok listáját lásd fent; a hiányos dokumentálásukról: PRIV-03.

## Web (OWASP Top 10, a releváns pontok)

| Terület | Állapot | Bizonyíték |
|---|---|---|
| A01 Hozzáférés-szabályozás | Kliensoldali állapotgép; az adat csak feloldva olvasható | `appAuth.js`; `store.js:102-105` |
| A02 Kriptográfia | lásd `CRYPTOGRAPHY-REVIEW.md` | SEC-01 |
| A03 Injektálás / XSS | Nincs `dangerouslySetInnerHTML`, `innerHTML`, `eval` vagy `new Function` a `src/`-ben (keresés: 0 találat). A linkek sémája ellenőrzött (`tel:` validálás: `src/domain/helplines.js:9-12`; `tests/xss.test.js`). CSV-képletinjektálás semlegesítve (`src/domain/export.js:30-37`). | alacsony kockázat |
| A04 Tervezés | Zero-knowledge, offline-first | – |
| A05 Konfiguráció | Weben: CSP meta (`index.html:7`), `connect-src 'none'`, Trusted Types. **Az éles GitHub Pages nem alkalmazza a `_headers`-t** | **SEC-17** |
| A06 Sérülékeny komponensek | Futásidőben csak a `react` és a `react-dom`; fejlesztői eszközökben 6 moderate | SEC-13 |
| A07 Azonosítás | Lokális PIN; korlát a felületen | SEC-01, SEC-10 |
| A08 Integritás (szoftver, adat) | Mentés: SHA-256 + AES-GCM. **Kiadás: védelem nélküli `main` → automatikus aláírás** | **SEC-02**, SEC-03 |
| A09 Naplózás | Szándékosan minimális; nincs telemetria | `src/lib/log.js` |
| A10 SSRF | n/a (nincs szerver) | – |

További ellenőrzött pontok:
- **Külső linkek:** `target="_blank" rel="noopener noreferrer"` (`Settings.jsx:159,171`; `HelplineList.jsx:11`; `Notices.jsx:19`).
- **Prod és dev:** a dev-CSP lazítás csak a fejlesztői szerverre vonatkozik (`vite.config.js`, `devOnlyRelaxCsp`). A bundle-ben csak engedélyezett csomagok vannak (`scripts/check-bundle.mjs`).
- **Origin-megosztás a GitHub Pagesen:** SEC-18.

## Ellátási lánc
- **Függőségek:** a verziók rögzítettek (`package.json`), a lockfile megvan. Elavult: `@capacitor/*` 8.5.3 → 8.6.0, `vite` 8.3.4 → 8.3.5, `@vitejs/plugin-react` 6.1.2 → 6.2.1 (`npm outdated`, 2026-11-02).
- **Actions:**
  - mind SHA-ra rögzítve (`android.yml`, `pages.yml`);
  - a workflow-szintű jogosultság az `android.yml`-ben `contents: write` (`android.yml:9-10`), ami a PR-buildekre is vonatkozik: elég lenne job-szinten, csak a kiadó lépésnek;
  - harmadik féltől származó Action: `reactivecircus/android-emulator-runner@e89f39f…` (rögzítve).
- **CI-titkok:** a kiadási kulcs négy titokban van; az `apk` és az `emulator-smoke` job is megkapja (`android.yml:51-72,185-205`). Lásd SEC-15.
- **Folyamat:**
  - ágvédelem nincs (SEC-02);
  - a privát sebezhetőség-bejelentés ki van kapcsolva (SEC-14);
  - az npm-függőségeket nem figyeli a Dependabot (SEC-14);
  - a HEAD emulátoros próbája piros, ennek ellenére kiadás történt (SEC-03, SEC-04).
- **Git-történet:** keresés `*.jks`/`*.keystore` fájlokra és nyílt jelszó-mintákra → nincs találat (2026-11-02).

## Ismert hibák a vizsgálat idején
1. **SEC-04:** a `main` emulátoros próbája piros (a tesztkeret hibája).
2. **SEC-05:** kódhiba a `setIdbHint` default paraméterében.

Mindkettő javítása külön feladat, teszteléssel és regresszióellenőrzéssel.
