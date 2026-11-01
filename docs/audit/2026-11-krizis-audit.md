# Kríziskezelés és szakmai hitelesség – audit (2. fázis)

Dátum: 2026-11-01 · Ág: `krizis-szakmai` · Előzmény: [1. fázis – biztonsági audit](2026-11-biztonsagi-audit.md)

Hatókör: a krízisképernyő és a „Segítség most” elérhetősége, a segélyvonalak adatainak hitelessége, a megcsúszás-folyamat,
a szakmai határ-mondatok, a lektorálás előkészítése. **Ez nem szakmai lektorálás**: a klinikai tartalom megítélése
addiktológus, klinikai szakpszichológus és tapasztalati szakértő feladata ([EMBERI TEENDŐ], `docs/CLINICAL-REVIEW.md`).

Minden javított hibához előbb bukó teszt készült (`tests/clinical.test.js`, `tests/components/HelpEverywhere.test.jsx`,
`scripts/e2e.mjs`); a javítás előtt 16 teszt + 1 e2e-lépés bukott, utána mind zöld.

## Összefoglaló

| # | Súlyosság | Megállapítás | Állapot |
|---|---|---|---|
| K1 | **Kritikus** | Nyitott modális ablakban (alsó lapok, gyors rögzítés, **megcsúszás-űrlap**, mentés-emlékeztető) és a teljes képernyős rétegeken (ünneplés, helyreállító kód) a „Segítség most” nem volt elérhető | Javítva |
| K10 | **Magas** | 200%-os nagyításnál a 112 csak görgetés után látszott (a bevezető szöveg és az országválasztó megelőzte) | Javítva |
| K2 | Magas | A segélyvonalaknál nem volt rögzítve a forrás és az ellenőrző; a findahelpline.com `verified: null`; nincs elévülés-figyelés | Javítva (próbahívás: emberi teendő) |
| K3 | Közepes | A határ-mondatok hiányoztak a bevezetőből, a README-ből és az APK kiadási jegyzetéből | Javítva |
| K7 | Közepes | Megcsúszás után a segítség csak egy kis „Segítség most” gomb volt; nem volt kedves felajánlás | Javítva |
| K5 | Közepes | Nincs elvonási tünetekre figyelmeztető tartalom (a SAFETY.md nyitott kérdése) | Vázlat kész, **kikapcsolva**, jóváhagyásra vár |
| K8 | Közepes | Nincs lektorálható szövegcsomag, a lektornak a forráskódot kellett volna olvasnia | Javítva |
| K6 | Alacsony | Diagnosztikai / sikerességi / gyógyulási állítások tilalma csak magyarul és részlegesen volt tesztelve | Javítva (teszt) |
| K4 | Alacsony | A krízisképernyő nyugalmát (nincs konfetti, kabala, rezgés, emoji, animáció) nem védte teszt | Javítva (teszt + e2e) |
| K9 | Info | Nincs leírt negyedéves segélyvonal-ellenőrzési eljárás | Javítva (`SAFETY.md` 4.1) |

## Részletek

### K1 – Kritikus: a „Segítség most” modális ablakokból nem volt elérhető

- **Hol:** `src/components/Info.jsx:14` (`Sheet`), `src/components/shell/QuickAddSheet.jsx:13`, `src/components/QuickLog.jsx:25`,
  `src/components/timeline/FreshStartModal.jsx:60`, `src/components/home/Celebration.jsx:17`, `src/App.jsx` (`RecoveryOverlay`).
- **Hiba-forgatókönyv:** a felhasználó megcsúszást rögzít, az űrlapon rosszul lesz, segítséget keresne. A `showModal()` miatt a
  fejléc „Segítség most” gombja inert (nem kattintható, a képernyőolvasó sem éri el); az űrlapon csak egy szöveges utalás volt
  („a gomb mindig itt van”), ami ekkor nem volt igaz. Ugyanez az első indításkor felugró és a mentés-emlékeztető lapnál, a
  mérföldkő-ünneplésnél és a helyreállító kód képernyőjén.
- **Javítás:** `DialogHelp` (`src/components/crisis/CrisisButton.jsx`) minden modális ablakban és rétegben; a krízisképernyő a
  modális ablak fölött nyílik (natív `<dialog>` egymásra rakás), bezárás után az űrlap tartalma megmarad.
- **Teszt:** `tests/components/HelpEverywhere.test.jsx` (minden réteg + tárolóhiba + csak-memória mód), e2e: a megcsúszás-űrlapon
  belül van link; az összegzésből koppintásra megnyílik a krízisképernyő.

### K10 – Magas: 112 nem látszott 200%-os nagyításnál

- **Hol:** `src/components/crisis/CrisisOverlay.jsx` (a sorrend: cím → bevezető → országválasztó → 112).
- **Hiba-forgatókönyv:** gyengénlátó felhasználó 200%-os nagyítással (195 CSS px széles nézet) nyitja meg; a 112 a 777. pixelen
  volt, a képernyő 422 px magas. Krízisben görgetni kellett a legfontosabb számig.
- Ugyanitt: a fejléc, a légzőkör és a hosszú szolgálatnevek (pl. „Telefonszolgálat”) 31 px-szel túllógtak, vízszintes görgetést okozva.
- **Javítás:** a 112-es sáv közvetlenül a cím alatt; 260 px alatt tömörebb krízis-elrendezés, magyar elválasztás a hívógombokban,
  a légzőkör a szélességhez igazodik. **Teszt:** e2e (195×422, deviceScaleFactor 2): az első `tel:` link a 112,
  görgetés nélkül látszik, nincs vízszintes görgetés, minden szám és név a saját gombján belül marad, nincs dekoratív animáció.

### K2 – Magas: segélyvonal-adatok hitelessége

- **Hol:** `src/content/helplines.js`.
- **Hiba-forgatókönyv:** egy szám megváltozik; senki sem veszi észre, mert nincs rögzítve, honnan származik és mikor ellenőrizték.
- **Javítás:** minden vonalhoz `source` (hivatalos oldal) és `verifiedBy`; a teszt elbukik, ha hiányzik. CI: `scripts/check-helplines.mjs`
  `::warning::`-ot ír 90 nap után. Beállítások → Rólunk: „Elérhetőségek utoljára ellenőrizve: …”.
- **Webes ellenőrzés (2026-11-01):** a 116-123 (sos116-123.hu), 116-111 (kek-vonal.hu), 112 (europa.eu), Samaritans, FRANK,
  Drinkline (nhs.uk), 988, SAMHSA száma szerepel a forrásoldalon. A **Drog Stop** oldala elérhető, de a szám a lap szövegében
  nem szerepel → `multiple-secondary` marad. A 911.gov nem volt elérhető az ellenőrző környezetből.
- **Számot nem módosítottunk.** `verifiedBy` mindenhol: „webes forrásellenőrzés (fejlesztői eszköz), próbahívás nélkül”.
- **[EMBERI TEENDŐ]:** próbahívás minden számra, negyedévente (`SAFETY.md` 4.1).

### K3 – Közepes: határ-mondatok

A három mondat („segít követni és támogatni”, „nem orvosi eszköz”, „nem helyettesíti a szakember segítségét”) eddig a
krízisképernyőn, a Névjegyben és az egyszeri előzetes-verzió közleményben volt. Most a bevezető első képernyőjén, a README-ben
és az APK kiadási jegyzetében is; a `tests/clinical.test.js` mindegyiket ellenőrzi (HU és EN).

### K7 – Közepes: segítség felajánlása megcsúszás után

`FreshStartSummary`: „Ha most nehéz, nem kell egyedül lenned vele. Szeretnél beszélni valakivel?” + „Segélyvonalak megnyitása”.
A krízisképernyő **nem nyílik meg magától** (teszt ellenőrzi). Az űrlap minden mezője a dátumon kívül elhagyható; a főoldalon és
az idővonalon megcsúszás után nem jelenik meg „0 nap” (komponensteszt a valódi appon).

### K5 – Közepes: elvonási tünetek kártya

Vázlat: `WITHDRAWAL` (hu/en), `WithdrawalCard` a krízisképernyőn, `FEATURES.withdrawalCard = false`. Nincs benne gyógyszer, adag,
leépítés; a teszt ezt ellenőrzi, és azt is, hogy a kapcsoló alapból ki van kapcsolva.
**[EMBERI TEENDŐ]:** addiktológus jóváhagyása (`CLINICAL-REVIEW.md` 4. pont), csak utána kapcsolható be.

### K8 – Közepes: lektorálási csomag

`scripts/review-export.mjs` → `docs/review/szoveg-lektoralas-<CONTENT_VERSION>.{md,csv}` (819 szöveg, képernyők szerint,
kontextussal, üres lektori oszlopokkal), `scripts/review-screenshots.mjs` → világos/sötét képernyőképek,
`docs/review/LEKTOR-TAJEKOZTATO.md`. A teszt ellenőrzi, hogy a `CLINICAL-REVIEW.md` aláírási táblázata üres, és a `REVIEW_STATUS`
változatlan („Szakmai lektorálásra vár”).

### K6, K4 – Alacsony

- K6: tiltott állítások HU+EN (diagnózis, sikerráta, bizonyítottan, klinikailag igazolt, guaranteed, cures…); a `risk.js`
  üzenetei pillanatot írnak le, nem a személyt, és nem jósolnak. Nem találtunk ilyen állítást; a teszt ezentúl őrzi.
- K4: a krízis-komponensek nem importálnak konfettit, kabalát, rezgést; a krízisszövegekben nincs emoji; e2e: nincs animáció a
  légzőkörön kívül.

## Nyitott emberi teendők

| # | Teendő | Felelős |
|---|---|---|
| 4 | Klinikai lektorálás (addiktológus + klinikai szakpszichológus + tapasztalati szakértő) a csomag alapján, aláírás a `CLINICAL-REVIEW.md` 4. pontjában | termékgazda szervezi |
| 5 | Elvonási tünetek kártya jóváhagyása, utána `FEATURES.withdrawalCard = true` | addiktológus |
| 6 | Segélyvonalak próbahívása negyedévente; Drog Stop megerősítése vagy eltávolítása | termékgazda |
| 7 | Jogi ellenőrzés: határ-mondatok, egészségügyi állítások, MDR-besorolás | jogász |
