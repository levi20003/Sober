# Teendők és fejlesztési tippek (állapot: 2026-11-01)

## A. Amit neked kell megtenned (sorrendben)

1. **A [#4 PR](https://github.com/levi20003/Sober/pull/4) összefésülése** (a CI zöld). Utána a `main` új, állandó kulccsal aláírt APK-t épít, és a telefonon az app percenként jelzi az újat.
2. **Az APK telepítése telefonra** (régi app törlése előtt: titkosított mentés; lásd README). A kulcsmappa (`KULCS-NE-COMMITOLD`) biztonsági másolata jelszókezelőbe vagy pendrive-ra. Ha a kulcs elvész, nem adható ki frissítés a telepített appokhoz.
3. **Név kiválasztása** (javaslatok: `nevek/`), majd elérhetőség-ellenőrzés: Google Play, App Store, domain (`.com`, `.app`, `.hu`), védjegy (TMview, SZTNH), közösségi fiókok. Ha megvan, jelezd: lecserélem az appban.
4. **Segélyvonalak próbahívása**: Drog Stop (06-80-505-678), Samaritans, FRANK, Drinkline, 988, SAMHSA. Utána az `verification` mezőt `official`-ra állítani (`src/content/helplines.js`, `docs/SAFETY.md`).
5. **Szakmai lektorálás**: addiktológus vagy klinikai szakpszichológus nézze át a magyar és az angol szöveget (`docs/CLINICAL-REVIEW.md` aláírási táblázat). Nyilvános kiadás előtt kötelező.
6. **3–5 ismerős tesztje** a webes linken (https://levi20003.github.io/Sober/), strukturált kérdésekkel (`docs/USER-TESTING.md`).
7. **Reddit**: a subreddit szabályainak elolvasása, moderátori engedély, poszt (`docs/REDDIT-POST.md`). Ne posztolj krízis-támogató közösségekben reklámként.
8. **Jogi átnézés** az adatvédelmi tájékoztatóra (egészségügyi adat, GDPR 9. cikk), mielőtt nyilvánosan hirdeted.

## B. Fejlesztési tippek (fontossági sorrendben)

**1. Megbízhatóság és adatbiztonság**
- **Fájlletöltés az APK-ban**: a titkosított mentés és a CSV/JSON export az APK-ban valószínűleg nem tölt le (WebView). Megoldás: natív letöltéskezelő vagy a Capacitor Share/Filesystem; erre külön döntés kell, mert natív bővítmény.
- **Mentés-emlékeztető**: havonta egy gyengéd jelzés, hogy készíts titkosított mentést. Ez védi a felhasználót az elveszett telefontól.
- **Importteszt az emulátoron** (a fájlválasztós visszaállítást az automatikus próba nem fedi).

**2. Diszkréció (sokaknál ez a döntő)**
- **Semleges ikon és név** választható (pl. „Napló" vagy „Számláló"), hogy a telefon képernyőjén ne látsszon, miről van szó.
- **Képernyőkép-védelem** (Android `FLAG_SECURE`) opcióként, és az utolsó alkalmazások listájában elmosott előnézet.
- **Biometrikus feloldás** (ujjlenyomat) a PIN mellett, a titkosítás megtartásával.

**3. Termékötletek**
- **Android kezdőképernyő-widget** a napszámmal.
- **„Segítség most" a kezdőképernyőről** egy koppintással (ikon-gyorsmenü már van a webes változatnál, Androidra is érdemes).
- **Megbízható személy**: egy mentett név és szám, akit a krízisoldalról egy koppintással lehet hívni.
- **Hetente rövid visszatekintés** („Mi segített a héten?").

**4. Akadálymentesség és minőség**
- **TalkBack-teszt valódi telefonon**, 200%-os betűméret, kontraszt (a kontrasztteszt a tokenekre már van).
- **Automatikus akadálymentességi teszt** (pl. axe-core fejlesztői függőségként) és **vizuális regressziós képernyőképek**.
- **Angol e2e és angol emulátoros próba** (most csak a magyar fut a böngészőben).
- **Teljesítmény**: induláskor mérés valódi, közepes Androidon (cél < 1 mp).

**5. Kiadás és nyilvánosság**
- **Google Play zárt teszt**, később **F-Droid** (nyílt forrású, adatvédelmi közönségnek ideális).
- **Áruházi anyagok**: alcím mindkét nyelven, képernyőképek, adatvédelmi URL (GitHub Pages), kiadási jegyzet (changelog).
- **Verziócímkék** (`v0.8.0` stb.) és kiadási jegyzet minden `main` buildhez.

**6. Technikai adósság**
- A séma mezői „…Huf" nevűek, pedig már pénznemfüggők; átnevezés migrációval.
- A nyelv indításkor dől el (váltáskor újratölt); ha lesz harmadik nyelv, érdemes a kiválasztást egy helyre vonni.
- A `Settings.jsx` és a `hu.js`/`en.js` nagy fájlok; érdemes témánként szétbontani.

## C. Ha csak egy dolgot csinálsz a következő héten

Telepítsd a telefonodra az APK-t, használd 3 napig, és írd fel, mi zavart. Az első valódi használat mindig többet árul el, mint bármelyik terv.
