# Belső biztonsági audit – 2026. november

**Hatókör:** `src/crypto`, `src/storage`, `src/auth`, importálás, CSP, service worker, APK-hálózat, supply chain, CI.
**Kiinduló állapot:** `premium-felulet` ág (v0.10.0). **Módszer:** kódolvasás, majd minden megállapításhoz egy teszt, ami a javítás előtt elbukott (`tests/security.test.js`, `tests/xss.test.js`, `tests/components/Lock.test.jsx`, `tests/apkUpdate.test.js`). A javítás előtti futás: 14 új tesztből 9 bukott (F1×2, F2–F8); a javítás után mind zöld.

> Ez **belső** audit. Nem helyettesíti a független kriptográfiai és alkalmazásbiztonsági auditot (lásd `AUDIT-SCOPE.md`, **[EMBERI TEENDŐ]**).

## Összefoglaló

| # | Súlyosság | Megállapítás | Állapot |
|---|---|---|---|
| F1 | **Magas** | PIN-csere / helyreállítás után a régi PIN megnyitja a `vault.prev` másolatot | javítva |
| F2 | **Magas** | A PIN-csere, az új helyreállító kód és a „korábbi mentés visszaállítása" megkerüli a próbálkozás-korlátot | javítva |
| F3 | **Magas** | IndexedDB-időtúllépésnél az app üres új naplót kínál a meglévő fölé (párhuzamos napló) | javítva |
| F4 | Közepes | Két nyitott fül csendben felülírja egymás mentését | javítva |
| F5 | Közepes | Az első munkamenetben (beállítás után) a memóriában lévő adatkulcs exportálható | javítva |
| F6 | Közepes | Az óra visszaállítása korlátlanul (napokra) meghosszabbíthatja a zárolást | javítva |
| F7 | Közepes | Manipulált mentésfájl extrém iterációszámmal órákra lefagyaszthatja az appot | javítva |
| F8 | Közepes | Import: nincs méret-, mélység- és kulcskorlát | javítva |
| F9 | Közepes | Nincs Trusted Types a CSP-ben | javítva (web), APK-ban indokoltan kihagyva |
| F10 | Alacsony | APK-frissítésfigyelő percenként kérdez a GitHubtól (IP + időpont) | javítva: indításkor és naponta egyszer, kapcsolható |
| F11 | Alacsony | Az AAD nem köti a `revision`/`format` mezőt (visszagörgetés tárhely-hozzáféréssel) | elfogadott kockázat, dokumentálva |
| F12 | Alacsony | Helyreállító kód a vágólapon marad; a gyenge PIN figyelmeztetése nem mondja ki az offline kockázatot | javítva |
| F13 | Alacsony | Zárolás után a látható értesítés (toast) még mutathat naplóból származó szöveget | javítva |
| F14 | Info | Supply chain: nincs bundle-ellenőrzés, `npm audit`, SHA-ra rögzített Actions | javítva (Dependabot-riasztás: **[EMBERI TEENDŐ]**) |
| F15 | Info | Argon2id, minimális PIN-hossz, `FLAG_SECURE` | **termékdöntés**, lásd `ARGON2-DONTES.md` |

## Részletek

### F1 (Magas) – A régi PIN a `vault.prev` másolatot továbbra is nyitja
- **Hely:** `src/storage/store.js` `changePin()` (javítás előtt 231–237. sor), `recover()` (129–138.), `#writeRecord()` (209–216.).
- **Forgatókönyv:** valaki megtudja a PIN-t, a felhasználó ezért lecseréli. A `#writeRecord` a régi rekordot (régi PIN-slottal) a `vault.prev` kulcsra írta. A régi PIN-nel a `restorePrevious()` megnyitja és vissza is állítja a másolatot, vagyis a csere hatástalan; a teljes, csak egy mentéssel régebbi napló olvasható.
- **Javítás:** PIN-cserénél és helyreállításnál a `vault.prev` is az új rekordot kapja (`revokePrevious`), ahogy a helyreállító kód újragenerálásánál eddig is.
- **Teszt:** `F1: after a PIN change…`, `F1: the same holds after "forgot PIN"…`

### F2 (Magas) – Próbálkozás-korlát megkerülése
- **Hely:** `store.js` `changePin()`, `regenerateRecoveryCode()`, `restorePrevious()` – a `#open()` közvetlenül hívódott, a számláló nélkül.
- **Forgatókönyv:** a zárolóképernyőn (sérült rekord esetén a „Korábbi mentés visszaállítása" űrlapon) vagy a feloldott appban a „PIN-kód módosítása" űrlapon korlátlanul próbálgatható a PIN.
- **Javítás:** minden PIN-ellenőrzés a közös `#guardedOpen()`-en megy át (várakozás, hibaszámláló, siker után nullázás). Zárolás alatt a helyes PIN is vár.
- **Teszt:** `F2: wrong PINs in "change PIN"…`

### F3 (Magas) – Üres új napló a meglévő fölé
- **Hely:** `src/storage/backends.js` `openBestBackend()` (220–241.), `src/auth/appAuth.js` `init()`.
- **Forgatókönyv:** az IndexedDB egy indításkor 5 mp-en belül nem válaszol (lassú telefon, másik fül tartja). A fallback localStorage üres, ezért az app az első indítás képernyőjét mutatja; a felhasználó új naplót kezd. A következő indításkor az IndexedDB-s napló nyer, az új „eltűnik"; a felhasználó két naplót kever, adat vész el.
- **Javítás:** nem érzékeny jelző (`jozansag-szamlalo:has-idb-vault`) a localStorage-ban, ha az IndexedDB-ben napló van. Ha ilyenkor az IndexedDB nem érhető el, `UNAVAILABLE` hiba és új `STORAGE_ERROR` állapot jön („A napló most nem érhető el", „Újrapróbálom"), sosem az első indítás képernyője. A krízisgomb ott is elérhető.
- **Teszt:** `F3: if IndexedDB held the journal…`

### F4 (Közepes) – Többfüles felülírás
- **Hely:** `store.js` `save()` (199–207.): az új revízió a saját memóriabeli számból jött, nem a tárolt rekordból.
- **Forgatókönyv:** két fülben nyitott PWA; az egyikben rögzített bejegyzést a másik következő mentése csendben eltünteti.
- **Javítás:** optimista zár: ha a tárolt `revision` eltér a betöltöttől, `CONFLICT` hiba és érthető üzenet („…másik ablakban módosítottad. Töltsd újra"). Maradék kockázat: az olvasás és az írás nem egy tranzakció, egy ezredmásodperces versenyablak marad.
- **Teszt:** `F4: two tabs saving…`

### F5 (Közepes) – Exportálható adatkulcs az első munkamenetben
- **Hely:** `store.js` `create()`: a `generateDek()` kivehető (extractable) kulcsát vette át munkamenet-kulcsnak.
- **Forgatókönyv:** egy (CSP ellenére) bejutó szkript az első munkamenetben `exportKey`-jel kiolvashatta volna a DEK-et, és vele bármely későbbi mentést.
- **Javítás:** `reimportNonExtractable()` a beállítás után is. **Teszt:** `F5: the DEK held in memory…`

### F6 (Közepes) – Óra-manipuláció
- **Hely:** `store.js` `attemptWaitMs()`, `#registerFailure()`.
- **Forgatókönyv:** a `lockedUntil - now` képlet miatt az óra visszaállítása után a várakozás napokra nő (a felhasználó kizárja magát), előreállítva nullázódik.
- **Javítás:** `lockedAt` + `lockDelay` alapú, korlátos számítás (`remainingWait`): a várakozás sosem haladja meg az 5 percet; visszaállított óránál a teljes (de korlátos) késleltetés érvényes. Előreállított óra lerövidíti – ez elfogadott: aki az órát állítja, a tárolót is törölheti, a korlát csak a képernyős PIN-billentyűzetet védi (ezt a felület és a `PRIVACY.md` is kimondja).
- **Teszt:** `F6: setting the clock back…`

### F7 (Közepes) – Iterációs DoS
- **Hely:** `src/crypto/vault.js` `openKeySlot()` (152–170.): csak alsó határ volt.
- **Forgatókönyv:** egy manipulált mentésfájl `iterations: 2 000 000 000` értékkel importáláskor órákra lefagyasztja a WebView-t.
- **Javítás:** `MAX_ITERATIONS = 5 000 000`, felette `CORRUPTED`. **Teszt:** `F7`.

### F8 (Közepes) – Import korlátok
- **Hely:** `src/domain/export.js` `parseJsonImport()` (59–70.), Beállítások és bevezető import (`JSON.parse(await file.text())`).
- **Forgatókönyv:** több száz MB-os fájl memóriába olvasása; mélyen egymásba ágyazott JSON; `__proto__` kulcsok, amelyek később objektum-összefésüléskor prototípust szennyezhetnek.
- **Javítás:** `src/lib/safeJson.js`: 10 MB-os korlát (a fájlt be sem olvassuk, ha nagyobb), mélységkorlát (32), tiltott kulcsok (`__proto__`, `constructor`, `prototype`), BOM tűrése; utána a meglévő szigorú `validateData`. **Teszt:** `F8`.

### F9 (Közepes) – Trusted Types
- A meta CSP és a `public/_headers` kiegészült: `require-trusted-types-for 'script'`. A kód nem használ HTML-sinket (`tests/xss.test.js` ezt tiltja), így a felület változatlan; az e2e nulla CSP-sértést mér.
- Az APK-ban a `scripts/android-csp.mjs` kiveszi: a Capacitor natív hídja injektált szkripttel dolgozik, ezt nem tudjuk Trusted Types-szal ellátni.
- A `frame-ancestors 'none'` csak HTTP-fejlécben érvényes (meta-ban a böngésző figyelmen kívül hagyja), a `_headers` tartalmazza.

### F10 (Alacsony) – APK-frissítésfigyelő gyakorisága
- **Hely:** `src/lib/apkUpdate.js`. Korábban percenként (a felhasználó kérésére); ez a GitHubnak percre pontos használati mintát mutat (IP + időpont).
- **Javítás:** indításkor és legfeljebb naponta egyszer (a kézi gomb mindig kérdez); a kérés egyedi fejléc és süti nélküli; a kapcsoló megmaradt. A webes service worker ellenőrzése óránként (saját origin). **Teszt:** `privacy (audit F10)…`

### F11 (Alacsony, elfogadva) – AAD és visszagörgetés
- Az AAD (`…|dek|v1`, `…|payload|v1`) a kontextust köti, a `revision`-t és a `format`-ot nem. Aki a tárolóba írni tud, egy korábbi, ugyanazzal a DEK-kel titkosított payloadot visszatehet (visszagörgetés). Megbízható számláló nélkül ez a böngészőben nem védhető; a `format` AAD-be emelése a meglévő naplók újratitkosítását igényelné haszon nélkül. **Döntés:** nem változtatunk, dokumentálva (`docs/SECURITY-MODEL.md`).
- Ellenőrizve: minden `encryptPayload` és `createKeySlot` hívás friss 96 bites véletlen IV-t kap; az IV-ütközés valószínűsége 2³² mentésig elhanyagolható. A slotok közös AAD-je miatti „slot-csere" nem ad előnyt (mindkét slot ugyanazt a DEK-et védi).

### F12 (Alacsony) – Vágólap és őszinte figyelmeztetés
- A helyreállító kód másolása után figyelmeztetés: másoljon ki mást, hogy ne maradjon a vágólapon. A gyenge (4–5 jegyű) PIN jelzése kimondja: „egy ellopott mentésfájlból percek alatt kitalálható". A belépési segítség-lap és a PIN tudnivalói leírják, hogy a próbálkozás-korlát csak a képernyős PIN-t védi.

### F13 (Alacsony) – Értesítés zárolás után
- Zároláskor a látható toast is eltűnik. **Teszt:** `locking removes every piece of journal content…` (`tests/components/Lock.test.jsx`).

### F14 (Info) – Supply chain és CI
- `scripts/check-bundle.mjs` + Vite-jelentés: a bundle-ben csak `react`, `react-dom`, `scheduler`. CI: `npm audit --audit-level=high` és `npm run check:bundle`.
- Minden `actions/*` lépés commit SHA-ra rögzítve; `.github/dependabot.yml` csak az Actions-pinekre, 14 napos várakozással.
- `npm audit`: 0 sérülékenység a futásidejű függőségekben; 6 közepes a fejlesztői eszközökben (`@capacitor/cli` → `glob`, `minimatch`, `uuid`), ezek nem kerülnek a bundle-be.
- Titkok: a git-előzményben nincs `*.jks`/`*.keystore` és nincs a release-jelszó; a `.gitignore` kizárja őket.

## Ellenőrzött és rendben talált pontok
- A DEK csak a slot-létrehozás idejére kivehető (`changePin`, `regenerateRecoveryCode`, `recover`), a munkamenet-kulcs mindig nem kivehető (F5 után a beállításnál is).
- `MIN_ITERATIONS` minden megnyitási útvonalon érvényes (PIN, helyreállító kód, `vault.prev`, importált mentés), mert mind az `openKeySlot`-on megy át.
- `normalizeSecret` (NFKC): az összetett és felbontott ékezetes karakterek ugyanazt a kulcsot adják (teszt). `normalizeRecoveryCode`: az O→0, I/L→1 csere csak a Crockford-ábécén kívüli betűket érinti, entrópiát nem csökkent.
- Hibás PIN és sérült slot kívülről egyformán `WRONG_SECRET`; a payload sérülése `CORRUPTED`, és a „Korábbi mentés visszaállítása" felkínálódik (hibainjekciós teszt).
- Párhuzamos feloldás: az `appAuth` `run()` sorba állít; a számláló sikeres feloldáskor nullázódik.
- localStorage-ben csak titkosított rekord és nem érzékeny meta van (tárolópásztázó teszt a teljes életciklus után); törlés után semmi sem marad (teszt).
- A service worker csak a saját origin GET-kéréseit szolgálja ki gyorsítótárból, választ nem gyorsítótáraz, a cache-név a build tartalom-hashéből jön.
- XSS: nincs HTML-sink, nincs dinamikus kódfuttatás, minden dinamikus `href` átnézett és tesztben rögzített.

## Emberi teendők ebből a fázisból
1. **[EMBERI TEENDŐ]** Független kriptográfiai és alkalmazásbiztonsági audit (`AUDIT-SCOPE.md`); eredmény a `docs/SECURITY-MODEL.md` Launch checklistjében.
2. **[EMBERI TEENDŐ]** Döntés: Argon2id, minimális PIN-hossz, `FLAG_SECURE` (`ARGON2-DONTES.md`).
3. **[EMBERI TEENDŐ]** GitHub: Dependabot alerts, secret scanning, branch protection a `main`-re.
