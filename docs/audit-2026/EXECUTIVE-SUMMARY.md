# Vezetői összefoglaló – Sober (Józanság-számláló) read-only előaudit

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` (`main`, a 133-as APK forrása)
> **Típus:** read-only biztonsági, adatvédelmi és klinikai előaudit. Alkalmazáskódot nem módosítottam, csomagot nem frissítettem, adatot nem írtam.
> **Függetlenség: NEM független.** A vizsgálatot ugyanaz az AI-asszisztens végezte, amely a kód és a korábbi belső auditok
> nagy részét írta. Az eredmény ezért előszűrés, nem független audit. Klinikai, jogi vagy biztonsági megfelelést nem igazol.

## Mit vizsgáltam és hogyan
- **Kódolvasás:** kripto, tárolás, állapotgép, export/import, service worker, krízismodul, megbízható személy, i18n, Android-héj és natív bővítmények, CI.
- **Dokumentáció:** a `README.md`, `PRIVACY.md`, `SECURITY.md`, `docs/SECURITY-MODEL.md` és a korábbi auditok állításait a kóddal vetettem össze.
- **Futtatás a HEAD-en:**
  - `npm test` → **345/345 zöld**;
  - `npm run e2e` (valódi Chromium) → **25 lépés zöld**;
  - `npm audit` → 6 moderate (csak fejlesztői eszközökben), futásidőben 0.
- **GitHub API (read-only):** a `main` **védelem nélküli**; a privát sebezhetőség-bejelentés **ki van kapcsolva**; a HEAD emulátoros próbája **piros**.
- **Nem végeztem:** valódi eszközös vizsgálatot, külső hálózati tesztet az éles URL-en, klinikai értékelést.

## Fő eredmény
- **Az adat valóban titkosított.** A PIN nem csak a felületet zárja, hanem kulcsot képez:
  - AES-256-GCM, borítékos titkosítás, PBKDF2 600k (`src/crypto/vault.js:115-207`);
  - a tárolóban nincs nyílt napló-tartalom (kódolvasás és e2e);
  - az Android-mentés statikusan kizárva (`AndroidManifest.xml:5-7`).
- A krízisfunkció minden állapotban elérhető (zárolva, offline, JS nélkül), és a megcsúszás kezelése nem büntető. Mindkettőt teszt igazolja.
- **CRITICAL szintű hibát nem találtam.**
- **3 HIGH:**
  - gyenge PIN-nel offline törhető mentés (SEC-01);
  - védelem nélküli `main` → automatikusan aláírt és az appon belül terjesztett frissítés (SEC-02);
  - hiányzó elvonási figyelmeztetés (CLIN-01).
- **9 MEDIUM**, 12 LOW, 10 INFO. Teljes lista: `RISK-REGISTER.md`.

## Dokumentumok
`THREAT-MODEL.md` · `CRYPTOGRAPHY-REVIEW.md` · `SECURITY-AUDIT.md` · `ANDROID-SECURITY-REVIEW.md` · `PRIVACY-GDPR-REVIEW.md` ·
`CLINICAL-SAFETY-REVIEW.md` · `RISK-REGISTER.md` · `EXTERNAL-AUDIT-CHECKLIST.md` · `CLINICAL-EXPERT-QUESTIONNAIRE.md` · `REMEDIATION-ROADMAP.md`

## Egyértelműen kimondva
- **Bizonyítatlan:** az, hogy az app klinikailag biztonságos. A tartalom lektorálatlan (`hu.js:13`), mégis nyilvánosan elérhető.
- **Veszélyes hiány:** alkohol vagy gyógyszer + „Ma kezdem” esetén nincs orvosi figyelmeztetés a hirtelen abbahagyásról (CLIN-01).
- **Hibás folyamat:**
  - a 133-as kiadás úgy ment ki, hogy ugyanennek a commitnak az emulátoros próbája piros (SEC-03, SEC-04);
  - a PR-okat egy AI-munkamenet olvasztotta be, emberi review nélkül (SEC-02).
- **Túlzó dokumentáció:**
  - a `PRIVACY.md` szerint egyetlen hálózati kivétel van (valójában több, PRIV-01);
  - a `DEPLOYMENT.md` és a `_headers` olyan fejléceket sugall, amelyek a GitHub Pagesen élesben nem érvényesek (SEC-17);
  - a „segélyvonalak ellenőrizve” felirat próbahívás nélküli ellenőrzésre épül (CLIN-05).
- **Kódhiba:** a `backends.js:143` a `localStorage`-ot a `try` blokkon kívül olvassa (SEC-05).

## Záró kérdések

**1. Az öt legnagyobb jelenlegi kockázat**
1. **SEC-02 – kiadási lánc:** védelem nélküli `main` → automatikus aláírás → appon belüli frissítés minden felhasználónak.
2. **CLIN-01 – elvonás:** nincs orvosi figyelmeztetés a hirtelen abbahagyásról alkohol vagy nyugtató esetén.
3. **SEC-01 – gyenge PIN:** 4 jegyű PIN-nel a mentésfájl vagy a kinyert adat offline percek alatt törhető (a pontos idő NOT VERIFIED).
4. **CLIN-02 – lektorálatlan egészségügyi tartalom nyilvánosan terjesztve**, ellentmondásos állításokkal (CLIN-03).
5. **SEC-03/04 – a kiadás nincs a tesztekhez kötve**, és a CI-jelzés ingadozik; ehhez jön a webes változat közös originje és hiányzó fejlécei (SEC-17, SEC-18).

**2. Mi blokkolja a nyilvános kiadást?**
- a klinikai lektorálás és aláírás (P1-1), benne az elvonási figyelmeztetés (P1-2);
- ágvédelem és kiadási jóváhagyás (P0-1, P0-2);
- döntés a minimális PIN-erősségről (P1-3);
- jogi döntések és a kiegészített adatvédelmi tájékoztató (P1-6);
- próbahívás minden segélyvonalon (P1-5);
- független biztonsági audit (P1-9).

**3. Mit kell azonnal javítani?** P0-1…P0-4: ágvédelem; a kiadás a próbákhoz és emberi jóváhagyáshoz kötve; a tesztkeret hibája; a privát bejelentés bekapcsolása. Amíg ezek nincsenek meg, **ne olvasszunk be review nélkül, és ne adjunk ki újabb APK-t.**

**4. Hol kell külső szakértő?**
- Addiktológus és klinikai szakpszichológus: az összes 2–4. kategóriás szöveg, az elvonás, a légzés és a krízissorrend (`CLINICAL-EXPERT-QUESTIONNAIRE.md`).
- DPO/jogász: adatkezelői szerep, 9. cikk, DPIA, kiskorúak, harmadik fél adatai, MDR.
- Független biztonsági auditor: offline törés mérése, valódi eszköz, CI és kiadás, frissítő.

**5. Milyen bizonyíték hiányzik a biztonsági állításokhoz?**
- Mért offline törési idő PIN-hosszanként.
- Valódi eszközös próba: feladatváltó-előnézet, képernyőkép, `bmgr`/OEM-mentés, WebView-adatkönyvtár.
- Az éles webes fejlécek és a közös origin tényleges kitettsége.
- Független review a kriptó-használatról és a frissítőről.
- A segélyvonalak próbahívása.
- A belső auditok (`docs/audit/2026-11-*.md`) állításainak független megerősítése; ezeket és ezt a dokumentumot ugyanaz a szerző írta.

**6. Javasolt sorrend**
1. P0 (folyamat és CI).
2. Kódfagyasztás a nyilvános terjesztésben, vagy zárt tesztelői kör.
3. Klinikai lektorálás (P1-1/P1-2) és jogi review (P1-6) párhuzamosan.
4. PIN- és FLAG_SECURE-döntés, majd megvalósítás (P1-3/P1-4).
5. Webes hosting (P1-7) és a kisebb kódhiba (P1-8).
6. Független biztonsági audit (P1-9).
7. P2, majd P3.

Minden javítás külön feladat, bukó teszttel kezdve és regresszióellenőrzéssel.
