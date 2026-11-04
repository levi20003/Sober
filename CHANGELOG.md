# Változásnapló

Minden felhasználót érintő változás ide kerül, a legújabb van legfelül. A CI nem enged beolvasztani olyan PR-t, amely
az alkalmazás kódját módosítja, de ezt a fájlt nem (`scripts/check-changelog.mjs`). Ebből készül a
[változások oldal](https://levi20003.github.io/Sober/valtozasok.html) minden `main`-frissítéskor.

**Legfrissebb Android-alkalmazás:** [APK letöltése](https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk) ·
[Telepítési útmutató](https://levi20003.github.io/Sober/telepites.html) · [Webes változat](https://levi20003.github.io/Sober/)

## 0.12.0 – 2026-11-04
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
