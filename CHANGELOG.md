# Változásnapló

Minden felhasználót érintő változás ide kerül, a legújabb van legfelül. A CI nem enged beolvasztani olyan PR-t, amely
az alkalmazás kódját módosítja, de ezt a fájlt nem (`scripts/check-changelog.mjs`). Ebből készül a
[változások oldal](https://levi20003.github.io/Sober/valtozasok.html) minden `main`-frissítéskor.

**Legfrissebb Android-alkalmazás:** [APK letöltése](https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk) ·
[Telepítési útmutató](https://levi20003.github.io/Sober/telepites.html) · [Webes változat](https://levi20003.github.io/Sober/)

## 0.13.0 – 2026-11-04
- **Új megjelenés a referenciaképek hangulatában** (saját rajzzal, a meglévő palettára építve):
  - Főoldal: színátmenetes (lila → barack) fejléc, benne a kísérő és a számláló; „Hogy vagy ma?” 4×3-as rácsban; heti hangulat, energia és feszültség nagy, vékony számmal.
  - Alsó sáv: tinta „pill”, 4 fül és középen kiemelt kerek **+** (gyors rögzítés). A **Beállítások** a jobb felső avatarról nyílik.
  - Idővonal: színes fejlécblokk a jelenlegi szakasszal (nap + óra), három statisztika-pirula (összes józan nap, átvészelt sóvárgás, leghosszabb szakasz), sima hangulat-görbe buborékcímkével, amely mindig a diagramon belül marad.
  - Eszközök: kétoszlopos pasztell csempék rövid leírással és „Megnézem →” sorral (sóvárgás, légzés, kihívások, hála, levél, okaim).
  - Megtakarítás: nagy összeg kis pénznemmel, hullámos haladás-sáv.
  - Bevezető: lépésenként más színű háttér, nagy címek, tinta „Tovább →” gomb.
  - Beállítások: kisbetűs-nagybetűs szakaszcímek, átláthatóbb lista.
- A sötét téma pasztell kártyái mélyebb, telítettebb színt kaptak; minden új színpár megfelel a WCAG AA kontrasztnak.
- 200%-os nagyításnál és 360 px szélességen sehol nincs vízszintes görgetés (a fejléc gombjai a cím alá törnek).
- A krízisképernyő tartalma, sorrendje és színei változatlanok.

## 0.12.0 – 2026-11-04
- **Új számláló (stopper):** a kör és a nagy középső szám helyett az élő nap, óra, perc, másodperc csíkokkal; fent kicsiben az összes józan nap. A „nap” csík a kezdés pillanatától telik (nem a napszaktól), így induláskor üres.
- **Percre pontos kezdés:** a Beállítások → Biztonság részben a kezdés napja mellett az óra és a perc is megadható; a bevezetőben a „Korábban kezdtem” mellé is. Pontos kezdésnél a napok száma pontosan 24 óránként nő, nem éjfélkor.
- **Kísérők:** Pötty (vidám csillag), Mira (csendes holdacska) és Kavics (higgadt kavics) közül választhatsz, vagy kérheted a **Kísérő nélkül** módot (Beállítások → Megjelenés → Kísérő). A választás a titkosított naplóban marad.
- A kísérő naponta egyszer köszön, egy képernyőn legfeljebb egy buborékkal; ezen túl csak akkor szól, ha épp rögzítettél valamit. Megcsúszás után visszafogott, nem sürget és nem hibáztat. Nincs folyamatosan ismétlődő animáció; a krízis- és a zárolóképernyőn nem jelenik meg.
- **Megosztható mérföldkő:** az ünneplésnél és az Idővonal elért jelvényeinél „Megosztom”. Előbb mindig előnézet, a kép csak a gombra készül el. Letisztult vagy illusztrált stílus, világos vagy sötét, négyzet vagy álló forma, három semleges üzenet.
- **Widgetkártya** az Idővonalon: kicsi, önálló kártya a napjaid számával, széles vagy négyzet formában; képként menthető vagy megosztható.
- **Adatvédelem megosztáskor:** alapból csak a napok száma és egy semleges üzenet kerül a képre; a következő mérföldkő és a kísérő csak a te bekapcsolásodra. Név, dátum, napló, hangulat, sóvárgás, pénz és krízisadat soha. A kép a telefonon készül, hálózat nélkül.
- Megosztás Androidon a rendszer megosztó ablakával, böngészőben a Web Share-rel; ahol ez nem megy, a kép letöltődik, és a rövid szöveg a vágólapra másolható.
- **Emlékeztető gyakorisága:** naponta, 2 vagy 3 naponta, vagy hetente (alapból kikapcsolva).
- Az Idővonal üres grafikon helyett barátságos üzenetet mutat az első teljes nap előtt.

## 0.11.0 – 2026-11-03
- **Egységes színvilág:** a logótervek palettája (lila, meleg sárga, korall, krém, tinta) mindenhol: belépés, bevezető, főoldal, krízisképernyő, sötét és világos módban is. A korábbi zöldes sötét téma helyett tinta-lila.
- **Világos/sötét mód gomb** (nap/hold) minden fejlécben, a belépésnél és a bevezetőben is; rövid, egységes színátmenettel.
- Új alkalmazásikon és indítókép ugyanebben a palettában.
- Változásnapló és automatikusan frissülő változások oldal az APK-linkkel.

## 0.10.x – 2026-11-02
- **Kiadás védelme:** az APK csak zöld build és zöld emulátoros próba után, jóváhagyással kerül ki.
- **Élő számláló:** a kör a mai napot mutatja (éjfélkor nő a napok száma); alatta év, hó, hét, nap, óra, perc, másodperc csíkokkal.
- Koppintásra másolható helyreállító kód; a heti sávban a mai nap üres karika, amíg tart.
- **Alkalmazáson belüli frissítés:** letöltés, ellenőrzés (ellenőrzőösszeg, aláíró kulcs), majd az Android telepítője.
- **Mentés és visszaállítás:** a rendszer „Mentés ide” ablaka és megosztás (vágólap helyett); ellenőrzött v2 mentés; visszaállítás a helyreállító kóddal is; régi mentések továbbra is megnyílnak.
- **Krízis:** a „Segítség most” minden ablakból elérhető; a 112 nagyításnál is elöl; megcsúszás után felajánlott segítség.
- **Biztonság:** próbálkozás-korlát minden PIN-ellenőrzésnél, nem kinyerhető kulcs, biztonságos import.
- Magyar és angol nyelv, országfüggő segélyvonalak, egyszerűbb, prémium felület.
