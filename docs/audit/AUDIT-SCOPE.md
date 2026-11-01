# Független audit – hatókör és útmutató az auditor számára

**Státusz:** az audit megrendelése és elvégzése **[EMBERI TEENDŐ]**. A belső audit: `2026-11-biztonsagi-audit.md`.

## Az alkalmazás
Offline-first, szerver nélküli, regisztráció nélküli PWA és Android-app (Capacitor 8.5.3) józanság-követéshez. Érzékeny, egészségügyi jellegű személyes adatot kezel (GDPR 9. cikk). Minden adat a készüléken, Web Crypto-val titkosítva. Futásidejű függőség: `react`, `react-dom` (+ `scheduler`).

## Hatókör
| Terület | Fájlok | Kérdések |
|---|---|---|
| Kriptográfia | `src/crypto/vault.js` | borítéktitkosítás, PBKDF2-paraméterek, AAD, IV-kezelés, helyreállító kód, normalizálás |
| Tárolás | `src/storage/store.js`, `src/storage/backends.js` | atomicitás, `vault.prev`, meta (titkosítatlan), próbálkozás-korlát, törlés, fallback-sorrend |
| Hitelesítés | `src/auth/appAuth.js` | állapotgép, automatikus zárolás, párhuzamosság, hibakezelés |
| Import/export | `src/domain/export.js`, `src/lib/safeJson.js`, `src/domain/schema.js` | sémavalidálás, korlátok, CSV-képletinjekció |
| Böngésző-réteg | `index.html` (meta CSP), `public/_headers`, `src/sw/sw.template.js`, `scripts/precache.js` | CSP, Trusted Types, service worker gyorsítótár |
| Android | `android/app/src/main/AndroidManifest.xml`, `res/xml/data_extraction_rules.xml`, `MainActivity.java`, `scripts/android-csp.mjs`, `src/lib/apkUpdate.js` | mentéskizárás, WebView-beállítások, hálózat (egyetlen cím) |
| Supply chain | `package.json`, `package-lock.json`, `.github/workflows/*`, `scripts/check-bundle.mjs` | pontos verziók, bundle-tartalom, CI |

Nincs hatókörben: a szakmai (klinikai) tartalom, a jogi megfelelés (külön **[EMBERI TEENDŐ]**).

## Fenyegetésmodell
`docs/SECURITY-MODEL.md` (támadók: kíváncsi hozzátartozó a feloldott vagy zárolt telefonnal; tárolóhoz/mentésfájlhoz hozzáférő támadó; rosszindulatú fájl; supply chain).

## Build és tesztek
```bash
npm ci
npm test            # Vitest (egység, komponens, biztonsági tesztek)
npm run build && npm run check:bundle
npm run e2e         # valódi Chromium, offline, CSP-sértések
npm run android     # APK előkészítés (Android SDK + JDK 21 kell)
```

## Ismert, elfogadott kockázatok
- 4 számjegyű PIN engedett (termékdöntés): egy ellopott mentésfájl ellen percek alatt törhető; a felület ezt kimondja.
- A próbálkozás-korlát a titkosítatlan meta-ban van, csak a képernyős PIN-t védi; offline támadás ellen a PBKDF2-költség véd.
- Visszagörgetés a tárolóhoz írási hozzáféréssel (F11).
- Az APK-ban nincs Trusted Types (Capacitor-híd), és naponta egy névtelen GET megy az `api.github.com`-ra (kikapcsolható).
- Böngészőben a törlés nem garantál fizikai felülírást (crypto-shredding: a kulcsok megsemmisülnek).

## Kapcsolat
Lásd `SECURITY.md` (felelős közzététel).
