# Android biztonsági értékelés

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**
> Valódi telefonon nem vizsgáltam. Az emulátoros eredmények a CI-ből származnak (API 35, `sdk_gphone64_x86_64`).

## Manifest és konfiguráció

| Pont | Állapot | Bizonyíték | Értékelés |
|---|---|---|---|
| Biztonsági mentés | `allowBackup="false"`, `fullBackupContent="false"`, `dataExtractionRules` | `AndroidManifest.xml:5-7` | megfelelő |
| Adatkivonási szabályok | `cloud-backup` és `device-transfer`: root, file, database, sharedpref, external mind kizárva | `res/xml/data_extraction_rules.xml` | megfelelő |
| Engedélyek | `INTERNET`, `REQUEST_INSTALL_PACKAGES`; tárhely-engedély nincs | `AndroidManifest.xml:42-44` | a `REQUEST_INSTALL_PACKAGES` indokolt (frissítő), de ezzel az app telepítési jogot kér; a Play áruház ezt szigorúan kezeli (INFO) |
| Exportált komponensek | csak a `MainActivity` (LAUNCHER); a FileProvider `exported=false` | `AndroidManifest.xml:14-37` | megfelelő |
| Deep linkek / intent-filterek | csak a MAIN/LAUNCHER | `AndroidManifest.xml:22-25` | nincs külső belépési pont |
| FileProvider útvonalak | csak `cache/backups/` és `cache/updates/` | `res/xml/file_paths.xml` | megfelelő (korábban: teljes külső tárhely, javítva) |
| WebView | `webContentsDebuggingEnabled: false`, `allowMixedContent: false`, origin `https://localhost` | `capacitor.config.json` | a kiadott APK-ban kikapcsolva; a CI-próbában bekapcsolva (SEC-15) |
| CSP (APK) | `connect-src https://api.github.com`; Trusted Types kivéve | `scripts/android-csp.mjs:6,13` | indokolt, de az APK-ban így nincs Trusted Types-védelem (INFO) |
| `configChanges` | forgatás, téma, nyelv: nincs Activity-újraindítás | `AndroidManifest.xml:15` | az emulátoron elforgatással és témaváltással tesztelve |
| Aláírás | a CI-titokból; main-en kulcs nélkül `exit 1`; ujjlenyomat-egyezés kötelező | `.github/workflows/android.yml:49-62,80-91`; `android/signing-fingerprint.txt` | megfelelő; a kulcs és a CI védelme: SEC-02, SEC-15 |
| Debug vs. release | csak `assembleRelease` készül; `minifyEnabled false`; `versionName` elavult | `android/app/build.gradle:14,36-41` | SEC-16 |

## Kérdés: megkerülheti-e az Android biztonsági mentése az app védelmét?

**A statikus konfiguráció alapján nem. VERIFIED:**
- `allowBackup=false` → nincs `adb backup` és nincs Auto Backup;
- `dataExtractionRules` → Android 12+ alatt a felhő- és az eszközről eszközre mentésből is ki van zárva minden domain.

Ha egy út mégis megkerülné, akkor is **csak titkosított rekord és a nyílt `meta`** jutna ki (`SECURITY-AUDIT.md` táblázat). Ezért a megkerülés kockázata a SEC-01-re vezethető vissza.
**NOT VERIFIED:** gyártói (OEM) mentőeszközök (pl. Samsung Smart Switch, Xiaomi), amelyek rendszerjogosultsággal futnak; valódi eszközös `bmgr` próba.

## Natív bővítmények

**`JszFilesPlugin`** (`android/.../JszFilesPlugin.java`)
- **`save`:** SAF `ACTION_CREATE_DOCUMENT` (`:50`), a hely a felhasználó választása, tárhely-engedély nélkül. A `call.getString("text")` tartalom kerül a fájlba (`:66-71`). Mentésnél ez a titkosított mentés, nyílt exportnál a nyílt fájl, figyelmeztetéssel.
- **`share`:** `cache/backups/`, a korábbi fájlok törlésével (`:96-104`), majd `ACTION_SEND`, csak olvasási joggal (`:109-115`). A megosztott fájl a következő megosztásig a cache-ben marad (titkosított; INFO).
- **`setSecure`:** FLAG_SECURE ki/be (`:124-133`); alapból ki (SEC-06).
- **`signingInfo`:** a tanúsítvány SHA-256-ja; ezzel jelzi az app a debug-telepítést.
- **`handleOnPause`:** `pause` DOM-esemény (`:161-164`) → zárolás (`src/auth/appAuth.js:224`).
- Naplózás nincs (statikus teszt: `tests/android.test.js`).

**`JszUpdaterPlugin`** (`android/.../JszUpdaterPlugin.java`)
- **Rögzített URL** (`:44`); JS-ből nem adható meg (teszt: `tests/apkUpdater.test.js` U5).
- **Ellenőrzés:**
  - SHA-256 a `.sha256` ellen (`:62-83`);
  - a csomagnév egyezik (`:86-90`);
  - az aláíró egyezik a telepítettel (`:91-98`);
  - a verziókód nagyobb (`:99-104`).
  Hiba esetén a fájl törlődik.
- Átirányítás: HTTPS → HTTPS (`:156-162`); méretkorlát 100 MB (`:45`).
- **Telepítés:** a felhasználó jóváhagyásával (ACTION_VIEW); szükség esetén a rendszer engedélyképernyője nyílik meg (`:125-132`).
- A CI-emulátoron valódi hálózaton a SHA-256 egyezett, és az eltérő kulcs miatt `SIGNATURE` elutasítás történt (PR #10 CI).
- **Korlát:** az integritás végső soron a kiadási kulcson és a `main` védelmén múlik (SEC-02).

## Háttér, képernyőzár, képernyőkép
- **Zárolás:** azonnal `pause` és `visibilitychange: hidden` eseményre az APK-ban (`appAuth.js:204-224`); inaktivitás után alapból 5 perccel (`appAuth.js:29`).
- **FLAG_SECURE alapból ki:** a feladatváltó-előnézet és a képernyőkép tartalmazhat napló-tartalmat (SEC-06, NOT VERIFIED eszközön).

## Root és kártevő
Rootolt eszközön (vagy root-joggal futó kártevőnél) a WebView-adatkönyvtár (IndexedDB) kiolvasható. A titkosítás a PIN erősségéig véd (SEC-01). Feloldott állapotban a memória is olvasható (SEC-11). Root-detektálást nem javaslok elsődleges védelemnek; a valódi ellenintézkedés az erősebb titok.

## Emulátoros bizonyítékok (CI)
- **PR #9 és #10:** telepítés, PIN, krízisképernyő és `tel:`, újraindítás repülőgép-módban, frissítés (1001 → 1002), idegen kulcs elutasítása, régi formátumú napló, elforgatás és téma, frissítés a kiadott `android-latest` fölé, frissítő `SIGNATURE` elutasítás: **zöld**.
- **HEAD (`220c066`), 41417600126-os futás:** **piros** a tesztkeret `localStorage`-hibája miatt (SEC-04); a 133-as kiadás ennek ellenére kiment (SEC-03).
