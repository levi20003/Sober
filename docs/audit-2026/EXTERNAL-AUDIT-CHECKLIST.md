# Külső audit csomagok

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**
> Ezek a csomagok egy **független** auditor munkáját segítik. Semmilyen jóváhagyást vagy megfelelést nem tartalmaznak.

## A) Biztonsági audit csomag

**Anyagok:** `THREAT-MODEL.md` (architektúra, adatfolyam, STRIDE), `CRYPTOGRAPHY-REVIEW.md`, `ANDROID-SECURITY-REVIEW.md`, `SECURITY-AUDIT.md`, `RISK-REGISTER.md`, korábbi belső auditok (`docs/audit/2026-11-*.md`), `docs/SECURITY-MODEL.md`, `docs/audit/AUDIT-SCOPE.md`.

**Hatókör:** `src/crypto/`, `src/storage/`, `src/auth/`, `src/domain/backupFile.js`, `src/lib/safeJson.js`, `src/sw/`, `android/app/src/main/**`, `.github/workflows/**`, `scripts/android-csp.mjs`.

**Függőségek:** futásidőben `react` és `react-dom` 19.3.1; build: `vite` 8.3.4, `@capacitor/*` 8.5.3 (`npm audit`: 6 moderate, csak fejlesztői eszközökben).

**Ismert hibák:** SEC-01…SEC-18 (lásd `RISK-REGISTER.md`), különösen SEC-01, SEC-02, SEC-03, SEC-17, SEC-18.

**Javasolt vizsgálatok:**
- [ ] Offline PIN-törés mérése 4, 6 és 8 jegyű PIN-re, valamint jelszóra (hashcat, PBKDF2-HMAC-SHA256, 600k).
- [ ] Valódi eszköz: WebView-adatkönyvtár, `adb backup` / `bmgr`, OEM-mentőeszközök, feladatváltó-előnézet, képernyőkép.
- [ ] Rosszindulatú mentésfájl fuzzolása (méret, mélység, kulcsok, base64, iterációk, verziók).
- [ ] Az éles webes URL fejlécei (HSTS, frame-ancestors) és clickjacking-próba.
- [ ] Közös origin a GitHub Pagesen: van-e más Pages-oldal `levi20003.github.io` alatt.
- [ ] A frissítő MITM-próbája (hamis CA nélkül és hamis CA-val), átirányításos trükkök.
- [ ] CI: jogosultságok, titkok kitettsége a PR-ekben, ágvédelem, release-folyamat.
- [ ] A Web Crypto használatának helyessége (IV, AAD, kulcshasználat, kinyerhetőség).

**Kérdések az auditornak:**
1. Elfogadható-e a 4 jegyű PIN egy különleges adatot tároló appnál, ha az app a gyengeségét őszintén közli?
2. Argon2id (WASM) vagy erősebb minimum-titok: melyik ad jobb kockázatcsökkentést a célcsoportnál?
3. Szükséges-e a revízió bekötése az AAD-be (rollback), tekintve a helyi támadói modellt?
4. Megfelelő-e a frissítő ellenőrzési lánca; kell-e független (nem GitHub-hosztolt) aláírás-ellenőrzés?
5. Mi a minimális elvárt CI/release-kontroll (környezeti jóváhagyás, aláírt tagek, reprodukálható build)?

## B) Klinikai audit csomag

**Anyagok:**
- `CLINICAL-SAFETY-REVIEW.md`
- `CLINICAL-EXPERT-QUESTIONNAIRE.md`
- `docs/CLINICAL-REVIEW.md` (aláírási tábla)
- `docs/SAFETY.md`
- `docs/review/` (az összes szöveg CSV és MD formátumban, képernyőképek, lektori tájékoztató)

**Cél:** önkövető és támogató alkalmazás felnőtteknek, akik szerhasználattól (vagy szerencsejátéktól) távol maradnának. **Nem orvosi eszköz** (`hu.js:119`).

**Célcsoport:** felnőttek. A Kék Vonal (24 év alatt) is szerepel; a korhatár nem rögzített.

**Funkciók:** napló, hangulat, sóvárgás-időzítő, légzőgyakorlat, földelés, megcsúszás és új szakasz, megtakarítás, emlékeztető, krízisképernyő, megbízható személy.

**Krízis- és visszaeséskezelés:** `CLINICAL-SAFETY-REVIEW.md` 1–2. pont.

**Állítások és figyelmeztetések:** `CLINICAL-SAFETY-REVIEW.md` 3. pont (katalógus és kategóriák).

**Nyitott, blokkoló:** CLIN-01 (elvonási figyelmeztetés), CLIN-02 (lektorálatlan tartalom nyilvánosan).

## C) Adatvédelmi audit csomag

**Anyagok:** `PRIVACY-GDPR-REVIEW.md` (adattérkép, célok, megőrzés, törlés, hordozhatóság, adatáramlás, 9. cikk és DPIA-kérdések), `PRIVACY.md`, `PRIVACY.en.md`.

**Teendők a DPO/jogász számára:**
- [ ] Döntés az adatkezelői szerepről és a 9. cikk alkalmazásáról.
- [ ] A DPIA szükségessége (javaslat: önkéntes DPIA).
- [ ] A tájékoztató kiegészítése: GitHub Pages, appon belüli frissítés, visszajelzés, megbízható személy, localStorage-kulcsok (PRIV-01–03).
- [ ] Korhatár és kiskorúak.
- [ ] A megbízható személy (harmadik fél) adatai.
- [ ] Az „orvosi eszköz” minősítés (MDR) kérdése, a klinikai csomaggal együtt.
