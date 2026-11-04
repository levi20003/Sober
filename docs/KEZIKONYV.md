# Józanság-számláló (Sober) – Kézikönyv

Ez a kézikönyv a felhasználói működést írja le, különös tekintettel a kísérőkre, a megosztható kártyákra és arra, hogy
mi kerülhet ki a telefonról. A változások listája: [CHANGELOG.md](../CHANGELOG.md). Biztonsági modell:
[SECURITY-MODEL.md](SECURITY-MODEL.md), adatséma: [DATA-SCHEMA.md](DATA-SCHEMA.md), krízis és biztonság: [SAFETY.md](SAFETY.md).

## 1. Alapelvek (minden funkcióra érvényes)

- **Offline-first, szerver nélkül.** Nincs regisztráció, nincs fiók, nincs adatgyűjtés, analitika vagy telemetria.
- **Minden személyes adat titkosítva** (Web Crypto API, AES-256-GCM, PIN-ből származtatott kulcs). Android: `allowBackup="false"`.
- **A „Segítség most” gomb minden képernyőn ott van**, PIN nélkül is működik; a 112, 116-123, Drog Stop (06-80-505-678) és Kék Vonal (116-111) mindig elérhető.
- A felhasználó dönt mindenről, ami kifelé megy (mentés, megosztás). Felhőbe semmi nem kerül magától.

## 1b. Navigáció

Az alsó tinta sávban négy fül van (Főoldal, Idővonal, Megtakarítás, Eszközök), középen a kiemelt **+** a gyors rögzítéshez. A **Beállítások** a jobb felső sarokban lévő avatarról (kísérő vagy a mai hangulat) nyílik. A sárga **Segítség most** minden képernyő fejlécében ott van.

## 2. Kísérők

Beállítások → Megjelenés → **Kísérő**. Négy választás:

| Kísérő | Jelleg | Hangnem |
|---|---|---|
| **Pötty** (alapértelmezett) | puha, sárga csillag | vidám, bátorító |
| **Mira** | csendes, lila holdacska | nyugodt, lassú, lélegzetre hív |
| **Kavics** | higgadt, homokszínű kavics | kevés szó, kitartó |
| **Kísérő nélkül** | – | nincs figura, nincs buborék sehol |

Viselkedési szabályok (tesztek őrzik: `tests/components/Companions.test.jsx`):

- Egy képernyőn **legfeljebb egy buborék**. A főoldalon a kísérő **naponta egyszer** köszön; ugyanazon a napon újranyitva
  nem ismétel. Ezen kívül csak akkor szól, ha épp rögzítettél valamit (hangulat), vagy fontos pillanatban (mérföldkő,
  sóvárgás-gyakorlat vége).
- **Nincs folyamatosan ismétlődő animáció**: a mozgás legfeljebb néhány ismétlés, a főoldali figura mozdulatlan.
- **Megcsúszás után** visszafogott: nem ünnepel, nem viccelődik, nem kérdez rá.
- Soha nem mond bűntudatkeltő mondatot („Hiányoztál”, „Hol voltál?”, „Csalódott vagyok benned” és társai tiltottak).
- Nehéz hangulatnál mindhárom kísérő ugyanarra a biztonsági tartalomra mutat: a sárga „Segítség most” gombra.
- **A krízis- és a zárolóképernyőn nincs kísérő.**
- A választás a titkosított profilban van (`profile.companion`, opcionális mező); a mentéssel együtt visszaáll. A régi
  mentésekben nincs ilyen mező, ott Pötty jelenik meg. A v2 mentésformátum és a v3 séma nem változott.
- A napi köszönés napja (csak egy dátum, tartalom nélkül) a böngésző `jsz-greet` kulcsában van, hogy zárolt naplónál
  se kelljen visszafejteni.

## 3. Megosztható mérföldkő

**Hol:** az ünneplő képernyőn („Megosztom”, visszafogott második gomb), és az Idővonal **Mérföldkövek** kártyáján
bármelyik elért jelvényre koppintva.

**Menete:**

1. Megnyílik a **Megosztás** lap, rajta az **előnézet** – pontosan az a kép, ami továbbmegy.
2. Választható: **stílus** (Letisztult / Illusztrált), **színek** (Világos / Sötét), **forma** (Négyzet 1080×1080 /
   Álló 1080×1350), **üzenet** (három semleges mondat: „Egy nap egyszerre.”, „Minden nap számít.”, „A magam tempójában.”).
3. „Ha szeretnéd”: **a következő mérföldkő** és – illusztrált stílusnál, ha van kísérőd – **a kísérő** is rákerülhet.
   Mindkettő alapból kikapcsolva.
4. Csak a **„Megosztom ezt a képet”** gombra készül el a kép és nyílik meg a megosztás. Mellette: **Kép mentése**,
   **Szöveg másolása** (pl. „30 nap. Egy nap egyszerre. – Sober”).

**Megosztási lánc** (`src/lib/shareImage.js`):

| Környezet | Megosztás | Kép mentése |
|---|---|---|
| Android-app | a rendszer megosztó ablaka (JszFiles bővítmény, ideiglenes fájl az app gyorsítótárában) | a rendszer „Mentés ide” ablaka |
| Böngésző Web Share fájltámogatással | Web Share API (kép + rövid szöveg) | letöltés |
| Böngésző Web Share nélkül | automatikus letöltés (Blob), és erről üzenet | letöltés |
| Letöltés sem lehetséges | a rövid szöveg a vágólapra | – |

A megszakított megosztás (Mégse) csendben zárul, hibaüzenet nélkül.

## 4. Widgetkártya

Az Idővonalon a **Widgetkártya** egy kicsi, önálló kártya (nem képernyőkép) a napjaid számával. Formák: **Széles**
(1200×600, mint egy 4×2-es kezdőképernyő-widget) és **Négyzet**; stílus Letisztult vagy Illusztrált. Kérésre mutathatja a
következő mérföldkő felé haladást egy gyűrűvel, illusztrált stílusban a kísérőt. Képként menthető vagy megosztható,
ugyanazzal az előnézettel és ugyanazokkal az adatvédelmi szabályokkal, mint a mérföldkő-kártya.

Ez **alkalmazáson belüli képes widget**. Valódi Android kezdőképernyő-widget nincs (lásd 7. pont).

## 5. Mi kerülhet a megosztott képre? (adatvédelmi alapértékek)

**Alapból csak:** a napok száma, egy semleges, támogató üzenet és egy diszkrét „Sober” felirat.

**Csak a te kifejezett választásodra:** a következő mérföldkő; a kísérő (ha nem „Kísérő nélkül”).

**Soha, semmilyen beállítással:** a neved vagy beceneved; a szer vagy függőség típusa; a megcsúszás részletei; a
naplóbejegyzések; a hangulatnapló; a sóvárgással kapcsolatos adatok; a pontos kezdődátum; a megtakarítás vagy bármilyen
pénzügyi adat; a segélyvonalakkal vagy krízishelyzettel kapcsolatos információ.

Ezt a felépítés biztosítja: a kártya modellje (`src/domain/share.js → shareModel`) **csak a napok számát** és a kísérő
azonosítóját kapja meg, a napló többi része el sem jut hozzá. A tesztek valós, titkos adatokkal teli naplóval
ellenőrzik, hogy ezek egyike sem kerül a képre vagy a szövegbe (`tests/components/Share.test.jsx`).

**Helyi képkészítés:** az előnézet SVG-jét a telefon saját Canvas API-ja alakítja PNG-vé (SVG data-URL-ből). Nincs külső
könyvtár, nincs hálózati kérés, nincs külső képszolgáltatás, nincs analitika. Internet nélkül is működik (e2e teszt:
offline előnézet és valódi 1200×600-as PNG, CSP-sértés és hálózati kérés nélkül). A kártyák színei WCAG 2.1 AA
kontrasztúak világos és sötét változatban is.

## 6. Emlékeztetők

Alapból **kikapcsolva**. Bekapcsolva te választod az időpontot és a gyakoriságot (**naponta, 2 naponta, 3 naponta,
hetente**). Az értesítés szövege semleges („Egy perc magadra”), nem sürget, nem szégyenít, a zárolt képernyőn sem árul
el semmit, és egy koppintással kikapcsolható.

## 7. Megjegyzés a jövőbeli natív Android-widgethez (még nincs megvalósítva)

Egy valódi kezdőképernyő-widgethez szükséges lenne: egy `AppWidgetProvider` és widget-elrendezés az Android-projektben;
egy **titkosítatlan, minimális** érték (csak a napok száma, vagy csak a kezdőnap) tárolása, amit a widget zárolt napló
mellett is olvashat – ez **termékdöntést igényel**, mert a mai modellben minden a titkosított tárolóban van; frissítés
éjfélkor (`AlarmManager`/`WorkManager`); kikapcsolhatóság és a megjelenített adat választhatósága. Új natív modul és
architektúra-változás csak jóváhagyással.

## 8. Valódi eszközön még ellenőrizendő

A gépi tesztek (Vitest, Playwright Chromiumban, Android-emulátoros próba a CI-ban) lefutnak, de az alábbiakat **valódi
telefonon még senki nem ellenőrizte** – ezek nincsenek késznek jelölve:

- Android-app: „Megosztom ezt a képet” → a rendszer megosztó ablaka megjelenik, a kép átmegy (pl. üzenetküldőbe), a
  rövid szöveg kísérőszövegként megérkezik.
- Android-app: „Kép mentése” → „Mentés ide” ablak, a PNG megnyílik a Galériában / Fájlokban.
- Android-app: a megosztás megszakítása (vissza gomb) nem hagy hibaüzenetet.
- A kártya betűtípusa a gyártói rendszerbetűkkel (Samsung, Xiaomi stb.) is olvasható és nem lóg ki.
- Kísérők megjelenése kis kijelzőn és 200% betűméretnél; a buborék nem takarja a számlálót.
- Emlékeztető gyakorisága telepített PWA-n (Periodic Background Sync), illetve az Android-app viselkedése.
