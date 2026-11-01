# Tájékoztató a szakmai lektornak

Köszönjük, hogy elvállalod a Józanság-számláló szövegeinek szakmai lektorálását. Ez a dokumentum leírja, mit kérünk,
mit kapsz, és hogyan kerül be a véleményed az alkalmazásba.

## Az alkalmazásról röviden

- Ingyenes, offline működő, regisztráció nélküli napló- és támogató alkalmazás (PWA és Android) szerhasználattól józan
  életet élni szándékozó felnőtteknek. Nincs szerver, nincs adatgyűjtés; minden adat titkosítva a telefonon marad.
- **Határ:** az alkalmazás *segít követni és támogatni* a józanság útját. **Nem orvosi eszköz, és nem helyettesíti a szakember
  segítségét.** Nem diagnosztizál, nem kezel, nem ad gyógyszer- vagy adagolási tanácsot, és nem ígér eredményt.
- Állapot: **előzetes verzió, szakmailag nem lektorált.** A nyilvános indítás a lektorálásig blokkolva van.

## Kiket kérünk fel

Legalább egy **addiktológus** és egy **klinikai szakpszichológus**, és ha lehet, egy **tapasztalati szakértő**
(felépülésben lévő ember, aki segítőként is dolgozik). Mindhárom nézőpont más hibát vesz észre.

## Mit kapsz

| Fájl | Tartalom |
|---|---|
| `szoveg-lektoralas-<verzió>.csv` | Minden felhasználói szöveg egy sorban: **Kulcs, Szöveg, Képernyő, Kontextus**, és négy üres oszlop neked: **Rendben, Módosítandó, Javasolt szöveg, Megjegyzés**. Excelben vagy Google Táblázatokban nyitható. |
| `szoveg-lektoralas-<verzió>.md` | Ugyanez olvasható formában, képernyők szerint csoportosítva; a biztonságkritikus részek elöl. |
| `screenshots/<verzió>/` | Képernyőképek világos és sötét témában: bevezető, krízisképernyő, légzőgyakorlat, kockázati üzenet, megcsúszás (űrlap és összegzés), főoldal megcsúszás után, értesítés-beállítás, névjegy. |
| `../SAFETY.md` | A krízismodul működése és a nyitott szakmai kérdések (6. pont). |
| `../CLINICAL-REVIEW.md` | A lektorálási terület-lista és az aláírási táblázat (4. pont). |

A fájlokat a fejlesztő generálja: `node scripts/review-export.mjs` és `node scripts/review-screenshots.mjs`.

## Mit kérünk — fontossági sorrendben

1. **Krízisképernyő:** a sorrend (112 → beszélgetős vonalak → légzés → lecsendesítés) megfelelő-e? Biztonságos-e a 4-7-8 légzés
   elvonás vagy pánik idején? Elég hangsúlyos-e a 112 az elvonási tüneteknél?
2. **Elvonási tünetek kártya** (`WITHDRAWAL.*`, jelenleg **kikapcsolva**): helyesek és teljesek-e a tünetek, jó-e a teendő
   (112), kell-e a 104 (mentők) külön? A kártya csak a te írásos jóváhagyásod után kapcsolható be.
3. **Megcsúszás-folyamat** (`T.slip*`, `T.fresh*`): jó-e a „megcsúszás” szó; nem túl sok-e a kérdés közvetlenül utána
   (mind elhagyható); a felajánlott segítség (`T.freshOfferHelp`) hangneme.
4. **Kockázati üzenetek** (`RISK_MESSAGES.*`): támogató vagy megfigyelésnek hat a „ez az időszak korábban nehéz volt neked”?
5. **Értesítés** (`NOTIFICATION`): semleges-e, gyakoriság.
6. **Minden más szöveg:** hangnem, stigmatizáló vagy hibáztató kifejezések, félreérthető megfogalmazás.

## Hogyan töltsd ki

- **Rendben:** `x`, ha a szöveg maradhat.
- **Módosítandó:** `x`, ha változtatni kell.
- **Javasolt szöveg:** a javasolt új szöveg (ha van).
- **Megjegyzés:** indoklás, kérdés, forrás.
- Ha egy egész területről (pl. légzőgyakorlatok) általános véleményed van, írd az első sorához.

## Hogyan kerül be a véleményed

1. A fejlesztő átvezeti a javasolt szövegeket a `src/content/locales/` fájlokba, és újragenerálja a csomagot.
2. Te átnézed a módosított változatot.
3. **Az aláírási táblázatot (`docs/CLINICAL-REVIEW.md` 4. pont) te töltöd ki**, a saját neveddel, végzettségeddel,
   dátummal és döntéseddel. Ezt sem a fejlesztő, sem automatikus eszköz nem töltheti ki helyetted.
4. Csak ezután változik az alkalmazásban a `REVIEW_STATUS` („Szakmai lektorálásra vár”) és a `CONTENT_VERSION`.

## Amit nem kérünk

Gyógyszer-, adagolási vagy leépítési tartalmat az alkalmazás akkor sem tartalmazhat, ha szakmailag helyes lenne:
ez a jogi határ része (`docs/CLINICAL-REVIEW.md` 5. pont).

## Kapcsolat

A visszajelzést a kitöltött CSV-fájllal, e-mailben vagy a GitHub-on kérjük (a termékgazda adja meg a címet).
