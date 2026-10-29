# Adatvédelmi tájékoztató – Józanság-számláló

*Tervezet, frissítve: 2026. október 29. Nyilvános indulás előtt jogi és szakmai átnézés szükséges (lásd [docs/CLINICAL-REVIEW.md](docs/CLINICAL-REVIEW.md)).*

## Röviden

- **Minden adatod csak a saját eszközödön van.** Nincs szerverünk, ahová bármi eljutna.
- **Nincs regisztráció**, fiók, e-mail-cím vagy telefonszám.
- **Nincs követés**: nincs analitika, reklám, süti, külső betűtípus vagy harmadik féltől származó kód.
- **A naplód titkosítva van** a PIN-kódoddal vagy jelszavaddal.
- **Bármikor törölheted** minden adatodat egyetlen lépésben, és **bármikor letöltheted** őket.

## Milyen adatokat tárol az alkalmazás?

Csak azt, amit te magad beírsz:

| Adat | Hol van? | Titkosítva? |
|---|---|---|
| Az út kezdőnapja, napi költség és annak változásai, megtakarítási cél, automatikus zárolás ideje | az eszközöd böngészőjében (IndexedDB, vagy ha az nem érhető el: localStorage) | **igen** |
| Napi bejelentkezések (hangulat, alvás, sóvárgás), nehéz pillanatok, megcsúszások, tanulságok, jegyzetek | ugyanott | **igen** |
| Sikertelen feloldási kísérletek száma és a várakozási idő vége | ugyanott | nem – ezek nem személyes tartalmak, de a zároláshoz olvashatónak kell lenniük |
| Emlékeztető be/ki, időpont, utolsó megjelenés napja | ugyanott | nem – az értesítést küldő háttérfolyamat nem tudja visszafejteni a naplót |

Amit **nem** tárolunk és nem gyűjtünk: nevet, e-mailt, telefonszámot, helyadatot, eszközazonosítót, IP-címet, használati statisztikát.

## Hogyan működik a titkosítás? („zero-knowledge”, azaz senki más nem tudja)

Minden a te eszközödön, a böngésző beépített titkosító moduljával (Web Crypto API) történik. Kulcs vagy PIN-kód soha, sehol nem kerül tárolásra.

1. **Kulcsképzés.** A PIN-kódodból vagy jelszavadból az alkalmazás egy titkosító kulcsot számol ki (PBKDF2-SHA-256, **600 000** ismétléssel és egy erre az eszközre véletlenszerűen generált „sóval”). Ez szándékosan lassú: így minden egyes próbálkozás drága annak, aki találgatni próbál.
2. **Adatkulcs.** A naplódat egy külön, véletlenszerű 256 bites kulcs titkosítja (AES-256-GCM). Ezt az adatkulcsot a PIN-kódodból képzett kulcs zárja le. A helyreállító kód egy második, független zár ugyanarra az adatkulcsra.
3. **Mentés.** Az eszközön csak ezek vannak: a só, az ismétlésszám, a véletlen inicializáló vektorok (IV) és a titkosított szöveg. Ezekből PIN-kód nélkül semmi sem olvasható ki. Minden mentés új, véletlen IV-t kap, és a titkosítás észleli, ha bárki egyetlen bájtot is megváltoztat.
4. **Feloldás.** A PIN-kód beírásakor a kulcs újra kiszámolódik, a napló visszafejtése a memóriában történik, és a program ellenőrzi az adatok szerkezetét is, mielőtt megjelenítené.
5. **Zárolás.** Zároláskor, inaktivitás után, a lap bezárásakor vagy elhagyásakor a kulcs és a visszafejtett adatok azonnal kikerülnek a memóriából. Ha visszalépsz a böngészőben, ismét a PIN-kód kérő képernyő fogad.

**Mit jelent ez a gyakorlatban?** Senki – mi sem, a tárhelyszolgáltató sem – tudja elolvasni a naplódat a PIN-kódod vagy a helyreállító kódod nélkül. Ennek ára, hogy ha mindkettőt elveszíted, **a napló nem állítható vissza** (lásd lent).

## Ki láthatja az adataimat?

- **Senki más, csak te**, a PIN-kóddal vagy a helyreállító kóddal.
- Mi, az alkalmazás készítői, **technikailag sem férünk hozzá**: nincs szerver, ahová adat érkezne. Az alkalmazás biztonsági szabálya (`connect-src 'none'`) a böngészőben **meg is tiltja**, hogy az oldal bármilyen hálózati kapcsolatot nyisson.
- **Fontos:** ha valaki hozzáfér a feloldott eszközödhöz, miközben a napló nyitva van, ő is láthatja. Ezért a napló inaktivitás után automatikusan zárolódik (alapértelmezés: 5 perc), és a „Zárolás” gombbal azonnal lezárhatod.

## Mennyire erős a védelem?

A napló AES-256-GCM titkosítással van mentve. A kulcsot a PIN-kódodból képezzük (PBKDF2, 600 000 ismétlés). Őszintén:

- Egy **4–6 számjegyű PIN** a hétköznapi kíváncsiskodás ellen véd: az alkalmazásban 5 sikertelen próbálkozás után egyre hosszabb várakozás következik, és hibás PIN-kód esetén semmi sem törlődik. Aki viszont **lemásolja az eszközöd tárolt adatait** és komoly számítógépes kapacitással rendelkezik, a várakozást megkerülheti, és egy 4 számjegyű PIN-t másodpercek, egy 6 számjegyűt percek alatt kitalálhat. A túl könnyen kitalálható PIN-kódokat (pl. 1234, 0000, 2580) az alkalmazás nem fogadja el, és beíráskor jelzi, mennyire erős a választott kód.
- Egy **hosszabb jelszó** (pl. három-négy szó) ezzel szemben gyakorlatilag feltörhetetlen.
- Részletek: [docs/SECURITY-MODEL.md](docs/SECURITY-MODEL.md).

## Ha elfelejted a PIN-kódot

A naplód létrehozásakor kapsz egy **helyreállító kódot**. Ezzel új PIN-kódot állíthatsz be, és minden adatod megmarad.

Ha a PIN-kód **és** a helyreállító kód is elveszett, **a napló nem állítható vissza**: a titkosítás épp azért erős, mert senki sem tudja megkerülni, mi sem. Ilyenkor a zárolt képernyőn a „Nincs meg sem a PIN-kód, sem a helyreállító kód” résznél újrakezdheted: a TÖRLÉS szó beírása után minden adat végleg törlődik erről az eszközről. Ha van titkosított mentésfájlod, és emlékszel annak PIN-kódjára, utána azt visszaállíthatod.

## Segítség most (krízisoldal)

A „Most segítségre van szükségem” oldal **semmit sem rögzít**: sem azt, hogy megnyitottad, sem azt, hogy kit hívtál, sem a légzőgyakorlatot. A hívás gombok egyszerű telefonos hivatkozások (`tel:`), amelyeket a telefonod tárcsázója kezel. Ezekhez nem kell internet, és az alkalmazás nem kap róluk semmilyen információt. Az oldal PIN-kód nélkül, zárolt naplóval és offline is elérhető. Részletek: [docs/SAFETY.md](docs/SAFETY.md).

## Értesítések

Az emlékeztetők **alapból ki vannak kapcsolva**. Ha bekapcsolod, a szöveg szándékosan semleges („Egy perc magadra”), hogy a zárolt képernyőn se áruljon el semmit. Az értesítésben egy koppintással kikapcsolhatod őket, és a Beállításokban is. Az emlékeztetők szerver nélkül, az eszközödön készülnek.

## Export, mentés, áthordozás

- **Titkosított mentés:** a teljes napló titkosítva, egy fájlban. Csak a PIN-kóddal vagy a helyreállító kóddal nyitható meg. Ezzel viheted át a naplód másik eszközre.
- **CSV / JSON export:** olvasható, **nem titkosított** fájl, pl. táblázatkezelőhöz vagy szakemberrel való megosztáshoz. Letöltés előtt az alkalmazás figyelmeztet. A letöltött fájl védelméről te gondoskodsz.

## Törlés

A *Beállítások → Minden adat törlése* gomb egyetlen megerősítés után:
1. véletlen adattal felülírja a titkosított naplót, a korábbi mentést és a beállításokat,
2. törli őket,
3. törli a teljes helyi adatbázist.

A titkosítási kulcsok megsemmisülnek, így az esetleg a háttértáron maradó töredékek a PIN nélkül olvashatatlanok. (Fizikai felülírást a böngészők nem garantálnak. Ez minden webes alkalmazásra igaz.)

Az alkalmazás fájljai (program, ikonok) offline használat céljából a böngésző gyorsítótárában maradhatnak. Ezek **nem tartalmaznak személyes adatot**. Az alkalmazás eltávolításával vagy a böngészőben a webhely adatainak törlésével ezek is törlődnek.

## Jogalap és jogok (GDPR)

Mivel semmilyen személyes adat nem jut el hozzánk, mi **nem kezeljük** az adataidat. Az adatkezelés kizárólag a saját eszközödön, a te irányításod alatt történik. A GDPR szerinti jogaidat (hozzáférés, hordozhatóság, törlés) az alkalmazás közvetlenül, regisztráció nélkül biztosítja: export és egylépéses törlés.

> A felépüléssel, szerhasználattal kapcsolatos adatok a GDPR 9. cikke szerint **különleges kategóriájú (egészségügyi) adatnak** minősülhetnek. Ha a jövőben bármilyen szerveroldali funkció (pl. szinkronizálás) készülne, az csak végpontok közötti titkosítással, külön adatvédelmi hatásvizsgálattal és kifejezett hozzájárulással kerülhet be.

## Az alkalmazás nem orvosi eszköz

A Józanság-számláló segít követni és támogatni a józanságod útját. Nem diagnosztizál, nem kezel, és nem helyettesíti az orvost, pszichológust vagy addiktológust. Közvetlen veszély esetén hívd a **112**-t. Lelki támogatásért éjjel-nappal ingyenesen hívható a **116-123**.
