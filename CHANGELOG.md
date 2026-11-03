# Változásnapló

Minden felhasználót érintő változás ide kerül, a legújabb van legfelül. A CI nem enged beolvasztani olyan PR-t, amely
az alkalmazás kódját módosítja, de ezt a fájlt nem (`scripts/check-changelog.mjs`). Ebből készül a
[változások oldal](https://levi20003.github.io/Sober/valtozasok.html) minden `main`-frissítéskor.

**Legfrissebb Android-alkalmazás:** [APK letöltése](https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk) ·
[Telepítési útmutató](https://levi20003.github.io/Sober/telepites.html) · [Webes változat](https://levi20003.github.io/Sober/)

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
