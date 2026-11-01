# Adatmentés, visszaállítás és Android stabilizálás – audit (3. fázis)

Dátum: 2026-11-01 · Ág: `mentes-android` · Előzmény: [2. fázis](2026-11-krizis-audit.md)

Minden javított hibához előbb bukó teszt készült (`tests/backup.test.js`, `tests/android.test.js`, e2e és emulátoros lépések).
A javítás előtt 15 (mentés) + 7 (Android) teszt bukott, utána mind zöld.

## Összefoglaló

| # | Súlyosság | Megállapítás | Állapot |
|---|---|---|---|
| M1 | **Kritikus** | Az Android-appban a titkosított mentés csak a **vágólapra** került (a WebView nem tölt le fájlt): más appok olvashatják, könnyen elvész, a felhasználó nem tudja, hol van | Javítva: natív „Mentés ide” (SAF) + megosztás |
| M2 | **Magas** | Mentésből csak a PIN-kóddal lehetett visszaállítani; elfelejtett PIN + új telefon = elveszett napló, pedig a helyreállító kód megvan | Javítva |
| M4 | **Magas** | Sérült / csonka mentésfájl „rossz PIN” üzenetet adott (a felhasználó feleslegesen próbálgat, vagy feladja) | Javítva: v2 formátum SHA-256 ellenőrzőösszeggel |
| M5 | **Magas** | Újabb sémájú napló (visszalépés régebbi appra) „A napló szerkezete sérült” hibát adott – a felhasználó ilyenkor törölhet vagy „előző állapotot” állíthat vissza | Javítva: UNSUPPORTED, „frissítsd az appot, az adataid épek”, semmi nem íródik |
| M12 | **Magas** | A main ágon kulcs nélkül is kiment volna egy debug kulccsal aláírt kiadás (nem települ a felhasználók appja fölé) | Javítva: main-en `exit 1`, rögzített ujjlenyomat |
| M6 | Közepes | A mentés után nem ellenőriztük, hogy a fájl ép és visszafejthető | Javítva: visszaolvasás + ellenőrzőösszeg + visszafejtés, „A mentés elkészült és ellenőrizve” |
| M3 | Közepes | A mentésfájlban nem volt formátum-, app- és sémaverzió | Javítva (v2, a v1 továbbra is visszaállítható) |
| M9 | Közepes | Háttérbe kerüléskor (Android pause) nem zárolt azonnal: a feladatváltó előnézetében a napló látszhatott | Javítva: APK azonnal, böngésző 60 s után |
| M14 | Közepes | Importnál a fájlválasztó csak `application/json`-t engedett: sok fájlkezelő a letöltött JSON-t octet-streamként adja, így a fájl ki sem választható | Javítva |
| M15 | Közepes | A Jegyzettömbben „Unicode”-ként (UTF-16) mentett fájl olvashatatlan volt | Javítva (BOM alapján) |
| M16 | Alacsony | A FileProvider a teljes külső tárhelyet megosztotta (Capacitor-sablon) | Javítva: csak `cache/backups/` |
| M11 | Alacsony | `console.error(err)`: egy JSON-hiba üzenete a beolvasott szöveg darabját (akár naplótartalmat) írta a konzolba / logcatbe | Javítva: `src/lib/log.js`, teszt tiltja a közvetlen `console.*`-t |
| M8 | Info | Migráció atomikussága | Rendben volt; most teszt is őrzi (megnyitás nem ír; sikertelen mentésnél az eredeti marad; utána `vault.prev`) |
| M7 | Info | Régi formátumok (séma v1–v3, mentés v1) megnyitását nem őrizte fagyasztott adat | Javítva: `tests/fixtures/` (valódi titkosított rekordok) + emulátoros próba régi naplóval |
| M10, M13 | Info | Nem volt két eszköz közötti és PWA-frissítési e2e | Javítva |

## Részletek (kiemelt)

### M1 – Mentés az Android-appban
- **Hol:** `src/components/screens/Settings.jsx` (`copyBackup`: `navigator.clipboard.writeText(JSON.stringify(backup))`).
- **Forgatókönyv:** a felhasználó „mentést” készít, a vágólapra kerül; egy billentyűzet- vagy vágólapkezelő app elmenti/szinkronizálja;
  a felhasználó elfelejti beilleszteni, a telefon elvész → nincs mentés.
- **Javítás:** `JszFilesPlugin.java` (saját Capacitor-bővítmény, npm-függőség nélkül): `ACTION_CREATE_DOCUMENT` (a felhasználó választ
  helyet, nincs tárhely-engedély), `ACTION_SEND` megosztás FileProvideren át csak a `cache/backups` mappából. Utána lap: hová került,
  titkosított-e, és „tarts egy példányt máshol is”. Nyílt (titkosítatlan) exportnál külön figyelmeztetés.

### M2/M4/M5 – Visszaállítás
- `src/domain/backupFile.js`: `parseBackupText` (üres, csonka, más app JSON-ja, nem JSON) → `inspectBackup` (verzió, ellenőrzőösszeg,
  szerkezet) → csak ezután visszafejtés (`VaultStore.importEncryptedBackup(backup, secret, { newPin })`). Hibakódok: `EMPTY`, `NOT_OURS`,
  `DAMAGED`, `UNSUPPORTED`, `WRONG_SECRET`; az eszközön lévő napló hiba esetén érintetlen.

### M12 – Kiadási aláírás
`.github/workflows/android.yml`: main ágon kulcs nélkül `exit 1`; a tanúsítvány SHA-256-ja egyezzen az `android/signing-fingerprint.txt`-vel.
Az emulátoros próba a jelenlegi `android-latest` fölé telepíti az új buildet (`adb install -r`, kiadási kulccsal újra aláírva).
Az app debug/idegen kulcsnál figyelmeztet a Beállításokban.

## Termékdöntésre váró pontok (nem döntöttem el)
- **FLAG_SECURE:** a kapcsoló elkészült (Beállítások → Biztonság, csak az Android-appban), **alapból kikapcsolva**. Javaslat és indoklás:
  `docs/audit/ARGON2-DONTES.md` 3. pont. [EMBERI TEENDŐ]: termékgazda döntése az alapértékről.
- `vault.prev` a mentésben: szándékosan nincs benne (`docs/DATA-SCHEMA.md`).

## Amit csak valódi eszközön lehet ellenőrizni – [EMBERI TEENDŐ]
- A „Mentés ide” ablak és a megosztás valódi telefonon (Drive, Gmail, Letöltések), visszaállítás egy másik telefonon PIN-nel és
  helyreállító kóddal, frissítés a telefonon lévő verzió fölé, telefoncsere végigjátszása.
- A fagyasztott fixture-ök a mai kóddal, de a régi formátumokban készültek; egy 2026 októberi valódi mentésfájl kipróbálása is javasolt.
