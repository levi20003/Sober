# Javítási ütemterv

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c`
> Ez a terv **nem hajt végre** semmit. Minden tétel külön feladat, bukó teszttel kezdve, regresszióellenőrzéssel
> (`npm test`, `npm run e2e`, CI és emulátoros próba). A nehézségi becslések szándékosan konzervatívak.

Prioritások: **P0** azonnali, kritikus · **P1** a nyilvános kiadás előtt kötelező · **P2** fontos minőségi · **P3** későbbi

## P0 – azonnal

| # | Feladat | Kapcsolódó | Nehézség | Függőség | Érintett fájlok | Tesztkövetelmény | Definition of Done |
|---|---|---|---|---|---|---|---|
| P0-1 | `main` ágvédelem: kötelező review és kötelező státuszellenőrzések (apk, emulator-smoke, pages build); force-push tiltása | SEC-02 | kicsi (beállítás) **[EMBERI TEENDŐ]** | – | GitHub Settings | `gh api …/branches/main/protection` → 200 | review nélkül nem lehet a `main`-re írni |
| P0-2 | A kiadás gate-elése: külön `release` job (`needs: [apk, emulator-smoke]`), `environment: release` emberi jóváhagyással; a kiadási titkok csak ennek az environmentnek | SEC-02, SEC-03 | közepes | P0-1 | `.github/workflows/android.yml` | szándékosan bukó próbával nincs kiadás | a piros próba blokkol; a kiadás jóváhagyásra vár |
| P0-3 | Az emulátoros tesztkeret `localStorage`-hibájának javítása (`try` + várakozás a `https://localhost` originre) | SEC-04 | kicsi | – | `scripts/android/flow.mjs:39-44` | 3 egymás utáni zöld `main`-futás | a CI-jelzés stabil |
| P0-4 | Private vulnerability reporting bekapcsolása (a `SECURITY.md` erre hivatkozik) | SEC-14 | kicsi **[EMBERI TEENDŐ]** | – | GitHub Settings | API: `enabled: true` | a bejelentési út működik |

## P1 – a nyilvános kiadás előtt kötelező

| # | Feladat | Kapcsolódó | Nehézség | Függőség | Érintett fájlok | Tesztkövetelmény | Definition of Done |
|---|---|---|---|---|---|---|---|
| P1-1 | Klinikai lektorálás és aláírás (addiktológus + klinikai szakpszichológus) | CLIN-02…07 | nagy **[EMBERI TEENDŐ]** | – | `docs/CLINICAL-REVIEW.md`, `src/content/locales/*` | `tests/clinical.test.js` (a tábla csak emberi kitöltés után változik) | aláírt tábla; `REVIEW_STATUS` frissítve |
| P1-2 | Elvonási figyelmeztetés a bevezetőben és a kártya bekapcsolása, **csak jóváhagyott szöveggel** | CLIN-01 | közepes | P1-1 | `Onboarding.jsx`, `features.js`, locales | komponensteszt: az alkohol/gyógyszer + „ma” esetén megjelenik | jóváhagyott szöveg élesben |
| P1-3 | Termékdöntés a minimális PIN-erősségről / Argon2id-ről, majd a megvalósítás (auditált könyvtárral, migrációval) | SEC-01, SEC-07 | nagy | döntés **[EMBERI TEENDŐ]** | `vault.js`, `store.js`, `PinFields.jsx`, fixture-ök | régi formátumú fixture-ök továbbra is nyílnak; új minimum-teszt | dokumentált döntés és a mért offline idő |
| P1-4 | FLAG_SECURE alapértékének döntése (ajánlás: be) és eszközös ellenőrzés | SEC-06 | kicsi | döntés **[EMBERI TEENDŐ]** | `usePrefs.js`, `main.jsx` | valódi eszköz: feladatváltó-képernyőkép | eredmény dokumentálva |
| P1-5 | Segélyvonalak próbahívása; Drog Stop megerősítése vagy eltávolítása; a 911 forrásának pótlása; a „…ellenőrizve” felirat pontosítása | CLIN-05 | kicsi **[EMBERI TEENDŐ]** + kicsi kód | – | `helplines.js`, `Settings.jsx`, locales | `tests/clinical.test.js` K2 | `verifiedBy` valódi névvel/szereppel |
| P1-6 | Adatvédelmi tájékoztató kiegészítése (GitHub Pages, frissítő, visszajelzés, megbízható személy, localStorage-kulcsok); jogi döntések (9. cikk, DPIA, kiskorúak) | PRIV-01…03 | közepes **[EMBERI TEENDŐ: jogász]** | – | `PRIVACY.md`, `PRIVACY.en.md` | dokumentum-review | jogász által átnézett tájékoztató |
| P1-7 | A webes változat: fejléceket támogató hosting vagy saját (al)domain; frame-védelem | SEC-17, SEC-18 | közepes | – | hosting, `docs/DEPLOYMENT.md`, esetleg `index.html` | élő fejlécellenőrzés; iframe-próba | HSTS és frame-ancestors élesben; saját origin |
| P1-8 | `setIdbHint` default paraméter a `try` blokkba | SEC-05 | kicsi | – | `src/storage/backends.js:143-145` | egységteszt dobó `localStorage`-getterrel | a teszt zöld; a `create()` nem bukik az IDB-commit után |
| P1-9 | Független biztonsági audit (külső) | mind | nagy **[EMBERI TEENDŐ]** | P0, P1-3 | – | – | jelentés és javítások |

## P2 – fontos minőségi

| # | Feladat | Kapcsolódó | Nehézség | Érintett fájlok | Tesztkövetelmény / DoD |
|---|---|---|---|---|---|
| P2-1 | Külön tesztkulcs az emulátoros próbához (ne a kiadási kulccsal készüljön debuggolható build) | SEC-15 | kicsi | `android.yml` | a CI-ban a kiadási kulcs csak a release jobban érhető el |
| P2-2 | Revízió és formátum bekötése az AAD-be (formátumverzió-emeléssel, migrációval) | SEC-09 | közepes | `vault.js`, `store.js`, fixture-ök | rollback-teszt piros → zöld; régi rekordok nyílnak |
| P2-3 | Job-szintű `permissions`; `contents: write` csak a kiadó lépésnek | SEC-02 | kicsi | `android.yml` | workflow-review |
| P2-4 | `versionName` a package-verzióból; minify/R8 mérlegelése | SEC-16 | kicsi | `build.gradle` | a telepített verziónév egyezik |
| P2-5 | npm Dependabot-riasztások; Capacitor CLI frissítése; a nyitott Action-PR-ok (#11–#15) elbírálása | SEC-13, SEC-14 | kicsi–közepes | `package.json`, `dependabot.yml` | `npm audit` 0 moderate; zöld CI |
| P2-6 | Egységes, forrással alátámasztott sóvárgás-szövegek; feltételes egészségügyi állítások | CLIN-03, CLIN-04 | kicsi (szakértői szöveg után) | locales | `tests/clinical.test.js` |
| P2-7 | A törölt bejegyzés `vault.prev`-beli megmaradásának dokumentálása vagy kezelése | PRIV-04 | kicsi | `store.js`, `PRIVACY.md` | dokumentálva vagy teszt |
| P2-8 | Megbízható személy: tájékoztatás arról, hogy nincs értesítés, és zárolt állapotban nem látszik; javaslat a kapcsolattartó tájékoztatására | CLIN-08, PRIV-02 | kicsi | locales, `Settings.jsx` | szöveg jóváhagyva |

## P3 – később

| # | Feladat | Kapcsolódó |
|---|---|---|
| P3-1 | A lejárt `copyBackup` / `copyBackupDone` szövegek eltávolítása (a funkció megszűnt) | – |
| P3-2 | Az import korlátozása a mentésfájl-próbálkozásoknál (dokumentációs döntés) | SEC-08 |
| P3-3 | A megosztási és frissítési cache ürítése használat után | `JszFilesPlugin`, `JszUpdaterPlugin` |
| P3-4 | Reprodukálható build és SBOM a kiadásokhoz | SEC-02 |
