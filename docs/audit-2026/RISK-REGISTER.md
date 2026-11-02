# Kockázati nyilvántartás (Risk Register)

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` (`main`) · **Típus:** read-only előaudit, kódmódosítás nélkül
> **Függetlenség: NEM független.** A vizsgálatot ugyanaz az AI-asszisztens (Claude Code) végezte, amely a kód és a korábbi
> auditok (`docs/audit/2026-11-*.md`) jelentős részét írta. Ez a dokumentum ezért nem helyettesíti a független
> biztonsági, klinikai és jogi felülvizsgálatot; „saját munka ellenőrzése” torzítással kell számolni.

Bizonyosság: **VERIFIED** = a kódból/futtatásból közvetlenül igazolt · **NOT VERIFIED** = nem ellenőrizhető ebben a
környezetben (pl. valódi eszköz, harmadik fél beállítása), vagy csak következtetés.

## Összesítés

| Szint | Darab | ID-k |
|---|---|---|
| CRITICAL | 0 | – |
| HIGH | 3 | SEC-01, SEC-02, CLIN-01 |
| MEDIUM | 9 | SEC-03, SEC-04, SEC-06, SEC-17, SEC-18, PRIV-01, CLIN-02, CLIN-03, CLIN-05 |
| LOW | 12 | SEC-05, SEC-07, SEC-08, SEC-09, SEC-13, SEC-14, SEC-15, PRIV-02, PRIV-04, CLIN-04, CLIN-06, CLIN-07 |
| INFO | 10 | SEC-10, SEC-11, SEC-12, SEC-16, PRIV-03, PRIV-05, CLIN-08, CLIN-09, CLIN-10, CLIN-11 |

CRITICAL szintű, azonnali adatfeltárást vagy közvetlen felhasználói veszélyt okozó hibát **nem találtam**. Ez nem jelenti,
hogy nincs: lásd a függetlenségi korlátot és a NOT VERIFIED pontokat.

## Megállapítások

Formátum: `ID | Súlyosság | fájl:sor | Leírás | Repro teszteset | Hatás | Valószínűség | Javítás | Ellenőrzés javítás után | Bizonyosság`

### Biztonság

**SEC-01 | HIGH | `src/crypto/vault.js:13,15,96-108`; `src/storage/store.js:22-44`**
- **Leírás:** A PIN legalább 4 karakter lehet, és 4–5 jegyű, csak számjegyes PIN is elfogadott (`MIN_SECRET_LENGTH = 4`). A kulcsképzés PBKDF2-SHA-256 600 000 iterációval. A próbálkozás-korlát (`throttleDelay`) csak a képernyőn beírt PIN-t védi. Aki megszerzi a titkosított rekordot (mentésfájl, rootolt telefon, WebView-adatkönyvtár), offline, korlát nélkül próbálgathat.
- **Repro teszteset:** Hozz létre egy naplót 4 jegyű PIN-nel (pl. `4826`), exportáld a titkosított mentést, majd Node-ban futtasd végig a 10⁴ jelöltet a `openKeySlot(slot, pin)` hívással, és mérd az időt. A teljes keresés ideje = 10⁴ × egy PBKDF2(600k) futás ideje.
- **Hatás:** A teljes napló (különleges kategóriájú egészségügyi adat) visszafejthető.
- **Valószínűség:** Közepes. Ehhez fizikai hozzáférés vagy egy mentésfájl kell, de a mentést a felhasználó maga osztja meg (Drive, e-mail).
- **Javítás:** Termékdöntés, nem saját kriptó: hosszabb minimum PIN vagy jelszó ajánlása/kötelezővé tétele, Argon2id (WASM, auditált implementáció) mérlegelése. Lásd `docs/audit/ARGON2-DONTES.md`.
- **Ellenőrzés javítás után:** Egységteszt a minimális hosszra; a mért offline idő dokumentálása.
- **Bizonyosság:** VERIFIED (kód). A törési idő hardverfüggő becslés: NOT VERIFIED.

**SEC-02 | HIGH | `.github/workflows/android.yml:9-10,107-135`; `android/.../JszUpdaterPlugin.java:44,62,90-104`; GitHub API: `branches/main/protection` → 404 „Branch not protected”**
- **Leírás:** A `main` ág védelem nélküli. Minden `main`-re kerülő commit után a CI a kiadási kulccsal aláír és kiad egy APK-t (`android-latest`), amit az appon belüli frissítő a felhasználók telefonjára juttat (a telepítést a felhasználó hagyja jóvá). Áttekintés nélküli beolvasztás ténylegesen előfordult: a #4–#10 és a #16 PR-t egy AI-munkamenet olvasztotta be, emberi code review nélkül.
- **Repro teszteset:** `gh api repos/levi20003/Sober/branches/main/protection` → 404. Egy `main`-re pusholt commit → a CI-futás `gh release create` lépése lefut.
- **Hatás:** Egy írási joggal rendelkező token vagy fiók (vagy egy hibás AI-módosítás) kompromittálódásakor rosszindulatú, de **érvényesen aláírt** frissítés jut el minden felhasználóhoz. A frissítő aláírás-ellenőrzése (`SIGNATURE`) ez ellen nem véd, mert a kulcs ugyanaz.
- **Valószínűség:** Alacsony–közepes.
- **Javítás:** Ágvédelem (kötelező review és kötelező státuszellenőrzések), a kiadás külön `environment`-be emberi jóváhagyással, a kiadási kulcs csak ehhez az environmenthez kötve, tag-alapú kiadás.
- **Ellenőrzés javítás után:** A `protection` API 200-at ad; review nélkül nem lehet a `main`-re írni; a kiadási job jóváhagyásra vár.
- **Bizonyosság:** VERIFIED.

**SEC-03 | MEDIUM | `.github/workflows/android.yml:107-135,140` (nincs `needs:`)**
- **Leírás:** Az APK kiadása az `apk` jobban történik. Az emulátoros próba (`emulator-smoke`) külön, utána futó job, és a kiadást nem blokkolja.
- **Repro teszteset:** A vizsgált HEAD-en (`220c066`) a 41417600126-os futásban az emulátoros próba **bukott**, a 133-as APK mégis kiment.
- **Hatás:** Olyan build is kiadásra kerülhet, amely valódi WebView-ban nem indul el rendesen.
- **Valószínűség:** Közepes. A vizsgált commitnál ténylegesen megtörtént.
- **Javítás:** Külön `release` job `needs: [apk, emulator-smoke]` feltétellel.
- **Ellenőrzés javítás után:** Bukó emulátoros próbánál nincs kiadás.
- **Bizonyosság:** VERIFIED.

**SEC-04 | MEDIUM | `scripts/android/flow.mjs:39-44`; `scripts/android/cdp.mjs:61-66`**
- **Leírás:** Az emulátoros próba a `main`-en piros: `Oldalhiba: DOMException: Failed to read the 'localStorage' property from 'Window': Access is denied for this document`. A hibát a tesztkeret saját `localStorage.setItem` hívása okozza (`flow.mjs:43`, `try` nélkül), feltehetően egy olyan dokumentumban, amely még nem a `https://localhost` origin (időzítési verseny). A PR-ágon ugyanez a próba zöld volt.
- **Repro teszteset:** A 41417600126-os CI-futás emulátoros jobjának naplója.
- **Hatás:** A CI-jelzés nem megbízható (ingadozik), a piros jelzést figyelmen kívül hagyták.
- **Valószínűség:** Ismétlődhet.
- **Javítás:** A tesztkeretben `try`, és a cél origin megvárása az írás előtt; a `main` piros CI-ját blokkolónak kell tekinteni.
- **Ellenőrzés javítás után:** Legalább három egymás utáni zöld `main`-futás.
- **Bizonyosság:** A hiba VERIFIED. Az okot csak következtetem (a tesztkeret, nem az app): NOT VERIFIED.

**SEC-05 | LOW | `src/storage/backends.js:143-145` (`setIdbHint(on, ls = globalThis.localStorage)`), hívás: `:120`, `:128`**
- **Leírás:** A default paraméter (`globalThis.localStorage`) a függvénytörzs `try` blokkja **előtt** értékelődik ki. Ha a `localStorage` getter kivételt dob, de az IndexedDB működik, a `putMany({vault})` a sikeres IndexedDB-commit **után** hibával tér vissza.
- **Repro teszteset:** jsdom-ban egy `localStorage` getter, ami SecurityError-t dob, valamint `fake-indexeddb` → `store.create(PIN, data)` → rejected. Ugyanakkor `backend.get('vault')` már létezik.
- **Hatás:** A létrehozás „sikertelen”, a helyreállító kód nem jelenik meg, az újrapróbálkozás „Már létezik napló” hibát ad. Ha a felhasználó elfelejti a PIN-t, nincs helyreállító kódja.
- **Valószínűség:** Alacsony. Ritka böngészőbeállítás kell hozzá (IndexedDB engedélyezve, localStorage tiltva).
- **Javítás:** A `globalThis.localStorage` olvasása a `try` blokkon belül.
- **Ellenőrzés javítás után:** A fenti egységteszt zöld.
- **Bizonyosság:** A kódhiba VERIFIED. Hogy valódi böngészőben előáll-e: NOT VERIFIED.

**SEC-06 | MEDIUM | `src/hooks/usePrefs.js:25` (FLAG_SECURE alapból ki); `android/.../JszFilesPlugin.java:161-164`; `src/auth/appAuth.js:204-224`**
- **Leírás:** A képernyőkép- és előnézet-védelem alapból ki van kapcsolva (termékdöntésre vár). Háttérbe kerüléskor a zárolás JS-eseményre történik, de az Android a feladatváltó előnézetét az `onPause` körül készíti, így elképzelhető, hogy a zárolt képernyő kirajzolása előtt.
- **Repro teszteset:** Valódi telefonon nyisd meg a naplót, nyomd meg a kezdőgombot, majd nézd meg a „Legutóbbi alkalmazások” listát.
- **Hatás:** Napló-tartalom (hangulat, megcsúszás) látszhat egy közös használatú telefonon.
- **Valószínűség:** Közepes.
- **Javítás:** FLAG_SECURE alapból bekapcsolva (ajánlás: `ARGON2-DONTES.md` 3. pont), vagy legalább `setRecentsScreenshotEnabled(false)` (API 33+).
- **Ellenőrzés javítás után:** Valódi eszközös próba (képernyőkép a feladatváltóról).
- **Bizonyosság:** NOT VERIFIED (eszköz nélkül).

**SEC-07 | LOW | `src/storage/store.js:46-49,122-127`**
- **Leírás:** Csak számjegyes PIN esetén annak hossza titkosítatlanul tárolódik (`pinHint`, a gyors billentyűzethez). Ez szűkíti az offline keresési teret. A felület ezt közli, és ki lehet kapcsolni.
- **Repro teszteset:** IndexedDB `kv/meta` → `pinHint: 4`.
- **Hatás:** Kis mértékben gyorsítja a SEC-01 szerinti támadást.
- **Valószínűség:** Csak SEC-01-gyel együtt releváns.
- **Javítás:** Alapból kikapcsolt gyors billentyűzet; ez termékdöntés.
- **Ellenőrzés javítás után:** –
- **Bizonyosság:** VERIFIED.

**SEC-08 | LOW | `src/storage/store.js:316-322`**
- **Leírás:** A mentésből történő visszaállítás a korlát nélküli `#open`-t használja, nem a `#guardedOpen`-t.
- **Repro teszteset:** Ugyanaz a mentésfájl tetszőleges számú rossz PIN-nel importálható várakozás nélkül.
- **Hatás:** Gyakorlatilag nincs: a fájl birtokosa offline is próbálgathat (lásd SEC-01). Az ok dokumentációs.
- **Valószínűség:** –
- **Javítás:** Kommentben rögzíteni a döntést, vagy a korlátot itt is alkalmazni.
- **Ellenőrzés javítás után:** –
- **Bizonyosság:** VERIFIED.

**SEC-09 | LOW | `src/crypto/vault.js:19-20`**
- **Leírás:** Az AAD statikus (`|dek|v1`, `|payload|v1`), nem köti a rekord `revision`-jét. A tárhelyre írni képes támadó egy régebbi érvényes rekordot visszajátszhat (rollback), például a `vault.prev`-et.
- **Repro teszteset:** A `vault` felülírása egy korábbi exportált rekorddal → a régi tartalom feloldható.
- **Hatás:** Integritás (a régi állapot visszaállítása), nem bizalmasság.
- **Valószínűség:** Alacsony (helyi írási hozzáférés kell).
- **Javítás:** Formátumverzió-emeléssel az AAD-be a `format` és a `revision` bekötése, migrációval.
- **Ellenőrzés javítás után:** A rollback-teszt piros.
- **Bizonyosság:** VERIFIED.

**SEC-10 | INFO | `src/storage/store.js:25-44,188-193`**
- **Leírás:** A próbálkozás-korlát állapota ugyanabban a tárhelyben van (`meta`), a tárhely felett rendelkező támadó nullázhatja. Ez dokumentált (`PRIVACY.md:49`).
- **Bizonyosság:** VERIFIED.

**SEC-11 | INFO | `src/storage/store.js:52-53,101-105,341-344`; `src/storage/store.js:363-370`**
- **Leírás:** Feloldott állapotban a napló nyílt szövegként él a JS-memóriában, és a `structuredClone` másolatok a React-állapotba is bekerülnek. A zárolás eldobja a hivatkozásokat, de a szemétgyűjtés időpontja nem garantált. A DEK nem kinyerhető; a nyers kulcsbájtokat a reimport után nullázza (`:368`).
- **Bizonyosság:** VERIFIED (kód). A memóriadump-kockázat NOT VERIFIED.

**SEC-12 | INFO | `android/.../JszUpdaterPlugin.java:62-104`**
- **Leírás:** A frissítő a `.sha256`-ot ugyanarról a forrásról tölti le (ez csak a sérülés ellen véd). A valódi védelmet az aláíró tanúsítvány egyezése adja (`:90-98`), amit az Android telepítéskor amúgy is kikényszerít. Ennek értéke a kulcs és a CI védelmén múlik (SEC-02).
- **Bizonyosság:** VERIFIED. Az emulátoron a `SIGNATURE` elutasítás valódi hálózaton lefutott (PR #10 CI).

**SEC-13 | LOW | `package.json:24-36`; `npm audit` (2026-11-02)**
- **Leírás:** `npm audit`: 6 moderate sebezhetőség (glob, minimatch, rimraf, uuid, xcode az `@capacitor/cli` láncában), mind fejlesztői eszközben. `npm audit --omit=dev`: 0. Futásidejű függőség csak a `react` és a `react-dom`.
- **Hatás:** A CI-build környezetét érinti, a felhasználót nem.
- **Javítás:** A Capacitor CLI frissítése (8.6.0 elérhető), ha a javítás bekerült.
- **Bizonyosság:** VERIFIED.

**SEC-14 | LOW | `.github/dependabot.yml:4-11`; GitHub API `private-vulnerability-reporting` → `{"enabled":false}`**
- **Leírás:** A Dependabot csak a GitHub Actions-t figyeli, az npm-et nem. 5 Dependabot PR nyitva (#11–#15, főverzió-ugrások). A `SECURITY.md` privát bejelentést ír elő, de a funkció **ki van kapcsolva**, tehát a bejelentési út most nem működik.
- **Javítás:** Private vulnerability reporting bekapcsolása; npm Dependabot-riasztások; a nyitott PR-ok elbírálása.
- **Bizonyosság:** VERIFIED.

**SEC-15 | LOW | `.github/workflows/android.yml:160-163,185-205`**
- **Leírás:** Az emulátoros próba egy **WebView-hibakereséssel fordított** APK-t ír alá a **kiadási kulccsal** (`release-new.apk`). Nem kerül fel artifactként, csak a runneren létezik. Ha kiszivárogna, frissítésként a valódi app fölé települne, és USB-n hozzáférhetővé tenné a WebView-adatokat.
- **Javítás:** Ehhez a próbához külön, csak teszteléshez használt kulcspár, vagy a kiadási kulccsal aláírt build hibakeresés nélkül.
- **Bizonyosság:** VERIFIED (workflow).

**SEC-16 | INFO | `android/app/build.gradle:14,39`**
- **Leírás:** A `versionName "0.6.0"` elavult (a package 0.10.0), és `minifyEnabled false`. A felhasználó és az auditor nem tudja azonosítani a buildet a verziónévből (csak a versionCode-ból).
- **Bizonyosság:** VERIFIED.

**SEC-17 | MEDIUM | `public/_headers:1-9`; `.github/workflows/pages.yml:1-40`; `index.html:7`**
- **Leírás:** A webes változatot a GitHub Pages szolgálja ki, amely **nem olvassa** a Netlify-formátumú `_headers` fájlt. Élesben így nincs HSTS, `frame-ancestors`, `X-Content-Type-Options` és `Permissions-Policy`; csak a `<meta>` CSP él, és abban a `frame-ancestors` hatástalan. Kódszintű frame-védelem sincs (keresés: `window.top` → nincs találat).
- **Repro teszteset:** `curl -I https://levi20003.github.io/Sober/` → a válaszfejlécek ellenőrzése (ebben a környezetben **nem futtattam**). Egy `<iframe src=".../Sober/">` próbaoldal.
- **Hatás:** A feloldott napló keretbe ágyazható (clickjacking); a dokumentáció (`docs/DEPLOYMENT.md`) erősebb védelmet sugall, mint ami élesben van.
- **Valószínűség:** Alacsony–közepes.
- **Javítás:** Fejléceket támogató hosting, vagy JS frame-busting és annak dokumentálása.
- **Ellenőrzés javítás után:** A fejlécek ellenőrzése az éles URL-en.
- **Bizonyosság:** A konfiguráció VERIFIED. Az éles fejléceket nem kértem le: NOT VERIFIED.

**SEC-18 | MEDIUM | architektúra: a webes változat originje `https://levi20003.github.io`**
- **Leírás:** A böngésző az IndexedDB-t és a localStorage-t originenként (séma+host+port) különíti el, nem útvonalanként. Ugyanannak a GitHub-fióknak bármely más Pages-oldala (`levi20003.github.io/<más-repó>`) ugyanabban az originben fut: olvashatja és törölheti a `jozansag-szamlalo` adatbázist (titkosított rekord és titkosítatlan meta), és megváltoztathatja a `jsz-ui` beállításokat.
- **Repro teszteset:** Egy másik repó Pages-oldala → `indexedDB.open('jozansag-szamlalo')` → `kv/vault` olvasása.
- **Hatás:** A titkosított napló kinyerhető (utána SEC-01 szerint törhető), és törölhető. Hogy van-e jelenleg más Pages-oldal a fiókon: NOT VERIFIED (az API ebből a munkamenetből nem érhető el).
- **Javítás:** Saját domain vagy aldomain a webes változatnak; addig dokumentálni.
- **Bizonyosság:** A mechanizmus VERIFIED (a web origin-modellje). A konkrét kitettség NOT VERIFIED.

### Adatvédelem

**PRIV-01 | MEDIUM | `PRIVACY.md:24,41-42`**
- **Leírás:** A tájékoztató szerint az egyetlen hálózati kérés az APK naponta egyszeri frissítéskeresése, a webes változat pedig „semmilyen ilyen kérést nem küld”. Ezek az adatáramlások hiányoznak belőle:
  - a webes változat letöltése a GitHub Pagesről (IP-cím a GitHubnál);
  - az appon belüli APK-letöltés (`JszUpdaterPlugin.java:44`, github.com és a CDN);
  - a visszajelző link (GitHub-fiók, `src/lib/feedback.js:5-9`);
  - a findahelpline.com link (`src/content/helplines.js:133`).
- **Hatás:** Átláthatósági hiány, ami a GDPR 13. cikke szempontjából kérdéses (jogászi kérdés).
- **Javítás:** A tájékoztató kiegészítése.
- **Bizonyosság:** VERIFIED.

**PRIV-02 | LOW | `src/domain/schema.js:216-223`; `PRIVACY.md:18`**
- **Leírás:** A megbízható személy neve és telefonszáma **harmadik fél személyes adata**: titkosítva tárolódik, de az adattáblában nem szerepel, és a hozzájárulásáról az app nem mond semmit.
- **Bizonyosság:** VERIFIED.

**PRIV-03 | INFO | `src/hooks/usePrefs.js:16-28`; `src/lib/apkUpdate.js:14-16`; `src/storage/backends.js:143`**
- **Leírás:** A titkosítatlan localStorage-kulcsok (`jsz-ui`: nyelv, ország, pénznem, téma, látott tudnivalók, `apkCheck`, `secureScreen`; `jsz-apk-last-check`; `jozansag-szamlalo:has-idb-vault`) nincsenek felsorolva. Az ország választása helyre utaló adat.
- **Bizonyosság:** VERIFIED.

**PRIV-04 | LOW | `src/storage/store.js:238-248`**
- **Leírás:** Ha a felhasználó töröl egy bejegyzést, az a `vault.prev`-ben (titkosítva) a következő mentésig megmarad. A törlés így nem azonnali; ez a „minden adat törlése” funkciót nem érinti (`:352-360`).
- **Bizonyosság:** VERIFIED.

**PRIV-05 | INFO | `src/components/RecoveryCodeCard.jsx:15-18`**
- **Leírás:** A helyreállító kód a vágólapra kerülhet. Az app erre figyelmeztet (`UX.clipboardWarning`). Az Android 13+ rendszerelőnézete is mutathatja a kódot.
- **Bizonyosság:** VERIFIED.

### Klinikai biztonság

**CLIN-01 | HIGH | `src/domain/presets.js:43,47`; `src/content/locales/hu.js:387-389`; `src/lib/features.js:5`; `src/content/helplines.js:22`**
- **Leírás:** A felhasználó kiválaszthatja az „Alkohol” vagy a „Gyógyszer-visszaélés” lehetőséget és a „Ma kezdem” indulást, de az app sehol nem figyelmeztet arra, hogy alkohol vagy benzodiazepin hirtelen elhagyása orvosi felügyeletet igényelhet. Az elvonási kártya kikapcsolva (`features.js:5`), az elvonásról csak a 112-es sor magyarázó szövege szól (`helplines.js:22`), és az is csak a krízisképernyőn.
- **Repro teszteset:** Végigmenni a bevezetőn „Alkohol” és „Ma kezdem” választásával, és megkeresni az orvosi figyelmeztetést.
- **Hatás:** Potenciálisan életveszélyes elvonási állapot (delirium, görcsroham) késői felismerése.
- **Valószínűség:** NOT VERIFIED; a célcsoportban releváns.
- **Javítás:** Addiktológus által jóváhagyott figyelmeztetés a bevezetőben és az elvonási kártya bekapcsolása. **Szöveget nem javaslok jóváhagyás nélkül.**
- **Ellenőrzés javítás után:** Klinikai aláírás a `docs/CLINICAL-REVIEW.md`-ben, és komponensteszt a megjelenésre.
- **Bizonyosság:** VERIFIED (a figyelmeztetés hiánya). A klinikai súlyt szakembernek kell megerősítenie.

**CLIN-02 | MEDIUM | `src/content/locales/hu.js:12-13,630`; release: `android-latest` v133**
- **Leírás:** A tartalom szakmailag lektorálatlan (`REVIEW_STATUS = 'Szakmai lektorálásra vár'`), mégis nyilvánosan letölthető (GitHub Pages és APK). Van „előzetes verzió” tájékoztató.
- **Hatás:** Lektorálatlan egészségügyi jellegű tartalom ér el sérülékeny felhasználókat.
- **Javítás:** A nyilvános terjesztés korlátozása a lektorálásig, vagy zárt tesztelői kör.
- **Bizonyosság:** VERIFIED.

**CLIN-03 | MEDIUM | `src/content/locales/hu.js:66,490,541`**
- **Leírás:** A sóvárgás időtartamáról ellentmondó, forrás nélküli állítások szerepelnek: „Sokszor 15–30 perc alatt alábbhagy” (`:66`), „10–20 perc alatt tetőzik” (`:490`), „Tíz perc, én végigviszlek” (`:541`).
- **Javítás:** Szakértő döntsön egy forrással alátámasztott, egységes megfogalmazásról.
- **Bizonyosság:** VERIFIED.

**CLIN-04 | LOW | `src/content/locales/hu.js:83,493`**
- **Leírás:** Kategorikus egészségügyi állítások: „A fáradtság felerősíti a sóvárgást” (`:83`), „Tíz perc séta lecsökkenti a feszültséget” (`:493`).
- **Javítás:** Feltételes megfogalmazás vagy forrás, szakmai jóváhagyással.
- **Bizonyosság:** VERIFIED.

**CLIN-05 | MEDIUM | `src/content/helplines.js:15,40-41,96-97,133`; `src/components/screens/Settings.jsx:136-140`**
- **Leírás:** A segélyvonalakat csak webes forrásellenőrzéssel nézték át, próbahívás nélkül.
  - A Beállításokban megjelenő „Elérhetőségek utoljára ellenőrizve: …” felirat ennél erősebb ellenőrzést sugallhat.
  - A Drog Stop besorolása másodlagos (`:40`).
  - A US 911 `official` besorolású (`:96`), pedig a forrásoldal (911.gov) az ellenőrzéskor 403-at adott: a forrás tényleges megerősítése hiányzik. Ez a korábbi munkamenet megfigyelése, a repóban nincs rögzítve.
- **Javítás:** Próbahívás (emberi teendő); a felirat pontosítása („webes forrás alapján”); a 911 forrásának pótlása.
- **Bizonyosság:** Kód: VERIFIED. A 403 a korábbi munkamenet megfigyelése: NOT VERIFIED a repóban.

**CLIN-06 | LOW | `src/content/locales/hu.js:40-50`**
- **Leírás:** A 4-7-8 légzés 7 másodperces benntartása pánik vagy elvonás alatt kérdéses. Figyelmeztetés van (`:43`). Szakmai döntés kell.
- **Bizonyosság:** VERIFIED (szöveg). A klinikai kockázat NOT VERIFIED.

**CLIN-07 | LOW | `src/content/locales/hu.js:79`; `src/domain/risk.js:20-30`**
- **Leírás:** A „személyes mintázat” üzenet a napló alapján szól („ilyenkor gyakrabban jönnek nehéz pillanatok”), ami megfigyelésnek hathat.
- **Bizonyosság:** VERIFIED (szöveg és logika). A hatást szakembernek kell megítélnie.

**CLIN-08 | INFO | `src/components/crisis/CrisisOverlay.jsx:68-73`; `src/App.jsx:163`**
- **Leírás:** A megbízható személy csak egy `tel:` gomb; értesítés nincs, így hamis „értesítettük” biztonságérzetet sem kelt. Zárolt állapotban nem jelenik meg (adatvédelmi kompromisszum). A kapcsolattartó hozzájárulására az app nem kérdez rá.
- **Bizonyosság:** VERIFIED.

**CLIN-09 | INFO | `src/content/locales/hu.js:248,260,263`; `tests/copy.test.js:9-20`**
- **Leírás:** A megcsúszás kezelése nem büntető: a tiltott szavakat teszt őrzi, és az összes józan nap megmarad. Kivétel: utólag rögzített megcsúszásnál az az egy nap kiesik; ezt az app őszintén közli (`:260`).
- **Bizonyosság:** VERIFIED.

**CLIN-10 | INFO | `src/components/home/Widgets.jsx` (Hero); `src/domain/elapsed.js`**
- **Leírás:** Az első napon a főszám „0 NAP”. Ez a valóság, de a korábbi tervezési elv kerülte a puszta 0-t. Klinikai megerősítés javasolt.
- **Bizonyosság:** VERIFIED (képernyőkép, 2026-11-02).

**CLIN-11 | INFO | `src/App.jsx:169-188`; `index.html:28-33`; `tests/components/HelpEverywhere.test.jsx`; `scripts/e2e.mjs`**
- **Leírás:** A krízisképernyő a következő állapotokban is elérhető: zárolt, tárolóhibás, bevezető, offline, JS nélkül. A modális ablakokban saját krízislink van. Ezt teszt és e2e igazolja.
- **Bizonyosság:** VERIFIED (kód és tesztek). Valódi eszközös offline próba: a CI-emulátoron repülőgép-módban lefutott.
