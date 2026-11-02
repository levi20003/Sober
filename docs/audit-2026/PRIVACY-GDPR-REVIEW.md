# Adatvédelmi (GDPR) előaudit

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**
> **Ez nem jogi vélemény és nem megfelelőségi igazolás.** A „⚖ DPO/jogász” jelölésű kérdéseket adatvédelmi szakembernek kell eldöntenie.

## Adattérkép

| Adattípus | Hol tárolódik | Titkosított? | Ki fér hozzá | Kockázat |
|---|---|---|---|---|
| Becenév, szerek („mitől maradsz távol”), kezdőnap, pontos kezdési idő (`journeyStartAt`), cél, okok, nehéz helyzetek | IndexedDB `vault` (vagy localStorage-tartalék) | igen (AES-GCM) | a PIN vagy a helyreállító kód birtokosa | magas érzékenység; offline törés (SEC-01) |
| Napló: hangulat, alvás, sóvárgás, nehéz pillanatok, **megcsúszások**, tanulság, jegyzet, hála, levél | ugyanott | igen | ugyanaz | **9. cikk szerinti egészségügyi adat lehet** |
| Megbízható személy (név, telefonszám) | ugyanott | igen | ugyanaz | **harmadik fél adata** (PRIV-02) |
| Napi költség, megtakarítás | ugyanott | igen | ugyanaz | közepes |
| Előző állapot (`vault.prev`) | ugyanott | igen | ugyanaz | a törölt bejegyzés egy revízióig megmarad (PRIV-04) |
| Próbálkozások, várakozás, PIN-hossz, utolsó mentés napja, emlékeztető (idő, utolsó megjelenés), értesítés szövege | IndexedDB `meta` | **nem** | bárki, aki a tárhelyhez hozzáfér; a service worker | alacsony; a használat ténye kiderül |
| Nyelv, ország, pénznem, téma, látott tudnivalók, kapcsolók, az utolsó frissítéskeresés ideje | localStorage | nem | ugyanaz | alacsony; az ország helyre utal (PRIV-03) |
| Titkosított mentésfájl | a felhasználó által választott hely (Drive, e-mail…) | igen | a fájl birtokosa | offline törés (SEC-01) |
| Nyílt CSV/JSON export | a felhasználó által választott hely | **nem** | a fájl birtokosa | **magas**; a felhasználó dönt, figyelmeztetéssel |
| Helyreállító kód | a felhasználónál; ideiglenesen a vágólapon | – | – | vágólap-szivárgás (PRIV-05) |
| IP-cím, időpont | a GitHub szerverein (Pages-letöltés; APK: napi frissítéskeresés, frissítés letöltése; visszajelzés) | – | GitHub | alacsony, de **nincs teljesen dokumentálva** (PRIV-01) |

## Szempontok

| Szempont | Megállapítás | Bizonyíték |
|---|---|---|
| Adatminimalizálás | Regisztráció, e-mail, analitika, telemetria nincs; minden mező elhagyható, kivéve a szert és a kezdőnapot | `src/components/onboarding/Onboarding.jsx`; `PRIVACY.md:24` |
| Beépített és alapértelmezett adatvédelem | Titkosítás az első naptól; emlékeztető alapból ki; semleges értesítésszöveg; a krízisoldal nem rögzít semmit | `sw.template.js:12-17`; `PRIVACY.md:62-66` |
| Célok | Önkövetés és támogatás, a felhasználó saját eszközén; a fejlesztő nem kezel adatot | `PRIVACY.md:86` |
| Megőrzés | A felhasználó törléséig; automatikus lejárat nincs | – (⚖ szükséges-e?) |
| Törlés | Egylépéses „minden adat törlése”: felülírás, törlés, az adatbázis megsemmisítése | `store.js:352-360`; e2e „delete-all wipes everything” |
| Hordozhatóság | Titkosított mentés, CSV (UTF-8 BOM) és JSON export | `src/domain/export.js`; `Settings.jsx` |
| Hozzáférés | Az app maga mutatja az összes adatot (idővonal, export) | – |
| Tájékoztató | `PRIVACY.md` / `PRIVACY.en.md`; az appban az „i” gombok mögött | **hiányos** (PRIV-01, PRIV-02, PRIV-03) |
| Külső adatáramlás | A webes CSP `connect-src 'none'`; az APK-ban csak az api.github.com (fetch); a natív letöltés a github.com-ról | `index.html:7`; `android-csp.mjs:6`; `JszUpdaterPlugin.java:44` |

## 9. cikk és DPIA – kérdések (⚖ DPO/jogász)
1. ⚖ Ki az adatkezelő? A fejlesztő a tartalomhoz nem fér hozzá; a feldolgozás a felhasználó eszközén történik. Ez a GDPR-ban önmagában nem dönti el a szerepet; az alkalmazás kialakítása (célok és eszközök meghatározása) releváns lehet.
2. ⚖ A szerhasználati és megcsúszás-adatok egészségügyi adatnak minősülnek-e (9. cikk)? A `PRIVACY.md:88` szerint „minősülhetnek”.
3. ⚖ Kell-e DPIA (35. cikk)? Szerveroldali kezelés nincs, de: különleges adat, sérülékeny érintettek, új technológia (helyi titkosítás). **Javaslat: önkéntes DPIA**, legalább a nyilvános terjesztés előtt.
4. ⚖ Az IP-cím GitHubnál történő kezelése (Pages, API, release): kinek a kezelése, és kell-e róla tájékoztatni a 13. cikk szerint?
5. ⚖ Megbízható személy: harmadik fél adata. Kell-e az ő tájékoztatása vagy hozzájárulása, ha a felhasználó csak a saját eszközén tárolja (háztartási kivétel?)?
6. ⚖ Kiskorúak: a Kék Vonal (24 év alattiak) szerepel. Van-e korhatár, és kell-e szülői hozzájárulás (8. cikk)?
7. ⚖ Nyílt export: elegendő-e a figyelmeztetés a felhasználói felelősséghez?
8. ⚖ Egészségügyi állítások és az MDR: lásd `CLINICAL-SAFETY-REVIEW.md`. Az app „nem orvosi eszköz” megjelölése (`hu.js:119`) a tényleges funkciókkal együtt értékelendő.

## Megállapítások
PRIV-01 (MEDIUM), PRIV-02, PRIV-04 (LOW), PRIV-03, PRIV-05 (INFO). Kapcsolódó: SEC-18 (közös origin a GitHub Pagesen). Részletek: `RISK-REGISTER.md`.

## Ami nem ellenőrizhető
- A GitHub tényleges naplózási és megőrzési gyakorlata.
- Hogy a felhasználók milyen felhőbe mentenek.
- Az Android-gyártók mentőeszközei.
