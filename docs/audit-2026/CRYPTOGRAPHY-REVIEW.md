# Kriptográfiai értékelés

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**

## Fő kérdés: valóban titkosítja-e a PIN az adatot, vagy csak a felületet zárja?

**Valóban titkosítja. VERIFIED.**
- A napló-tartalom kizárólag AES-256-GCM-mel titkosítva kerül a tárolóba (`src/crypto/vault.js:176-184`; `src/storage/store.js:148,238`).
- A DEK csak becsomagolva (wrap) tárolódik; csomagolója a PIN-ből PBKDF2-vel képzett KEK (`vault.js:135-147`).
- Zárolt állapotban a memóriában nincs se DEK, se adat (`store.js:341-344`).
- Az adatok olvasása zárolt állapotban kivételt dob (`store.js:102-105`).
- A meglévő teszt szerint a tárolt rekordban nem szerepelnek személyes szövegek (`tests/store.test.js` „nothing sensitive is stored in plaintext”).
- A HEAD-en futtatott e2e szerint az IndexedDB csak titkosított szöveget tartalmaz (`scripts/e2e.mjs`, „IndexedDB holds only ciphertext”, 2026-11-02: E2E OK).

**Kivétel: ami szándékosan nyílt** (`store.js:46-49`): sikertelen próbálkozások, várakozás, `pinHint` (a PIN hossza), emlékeztető-beállítás, utolsó mentés napja, az értesítés szövege. A `localStorage`-ban: nyelv, ország, téma stb. (PRIV-03).

## Paraméterek

| Elem | Érték | Bizonyíték | Értékelés |
|---|---|---|---|
| Szimmetrikus titkosítás | AES-256-GCM (Web Crypto) | `vault.js:131,176-184` | megfelelő |
| IV | 96 bit, minden titkosításnál `crypto.getRandomValues` | `vault.js:43,137,177` | megfelelő. Ütközés véletlen IV-nél ~2³² titkosítás után válik kockázatossá; itt egy kulccsal mentésenként 1 titkosítás történik, ez nagyságrendekkel kevesebb |
| AAD | `jozansag-szamlalo\|dek\|v1`, `\|payload\|v1` | `vault.js:19-20,140,179` | elválasztja a két szerepet; **nem köti** a revíziót (SEC-09) |
| KDF (PIN) | PBKDF2-HMAC-SHA-256, 600 000 iteráció, 128 bites véletlen só slotonként | `vault.js:13,115-127,136` | az OWASP 2023-as ajánlásnak megfelel; GPU-val gyorsítható (nem memóriaigényes) |
| KDF (helyreállító kód) | PBKDF2 100 000; a kód 160 bit entrópia (20 bájt, Crockford base32) | `vault.js:14,209-224` | megfelelő |
| Iterációs korlátok | min 100 000, max 5 000 000 nyitáskor | `vault.js:16-17,157-163` | véd a leminősített és a túlzó (DoS) rekord ellen |
| DEK | 256 bit, `generateKey`; létrehozás után nem kinyerhetőként importálva újra; a nyers bájtok nullázva | `vault.js:130-132`; `store.js:151,363-370` | a JS-memória nullázása nem garantált (INFO) |
| KEK | nem kinyerhető, csak `wrapKey`/`unwrapKey` | `vault.js:120-126` | megfelelő |
| Normalizálás | NFKC a titkokon | `vault.js:65-67` | konzisztens; ékezetes jelszavakra teszt van (`tests/security.test.js`) |
| Hibakezelés | rossz kulcs → `WRONG_SECRET`; sérült payload → `CORRUPTED`; az üzenetek nem szivárogtatnak kulcsanyagot | `vault.js:171-173,198-206` | megfelelő |
| Verziózás | `format: 1`, `schemaVersion: 3`; újabb verzió → UNSUPPORTED | `store.js:197-200,211-221` | megfelelő; a kulcsrotáció a PIN-cserénél slotszintű, a DEK nem rotálódik |
| Brute-force | 5 szabad próbálkozás, utána exponenciális várakozás, max. 5 perc; óra-visszaállításra védett | `store.js:22-44,77-93` | **csak a felületen** véd (SEC-10). Offline: SEC-01 |
| Gyenge PIN szűrés | ismétlődő, sorozatos és gyakori PIN-ek tiltva | `vault.js:69-91` | a 4 jegyű keresési tér így is 10⁴ (SEC-01) |

## Kulcs életciklusa
1. **Létrehozás:** DEK generálása → két slot (PIN, helyreállító kód) → a payload titkosítása → írás → a DEK nem kinyerhetőként a memóriába (`store.js:135-154`).
2. **Feloldás:** a slot kicsomagolása nem kinyerhető DEK-ként → visszafejtés → validálás (`store.js:179-186`).
3. **PIN-csere, új helyreállító kód:** a DEK ideiglenesen kinyerhetően nyílik, új slot jön létre, a régi slot a `vault.prev`-ből is eltűnik (`store.js:266-284,244-251`).
4. **Zárolás:** a hivatkozások eldobása (`store.js:341-344`).
5. **Törlés:** felülírás véletlen adattal, törlés, az adatbázis megsemmisítése, „crypto-shredding” (`store.js:352-360`).

## Megállapítások
SEC-01 (HIGH), SEC-07, SEC-08, SEC-09 (LOW), SEC-10, SEC-11 (INFO). Részletek: `RISK-REGISTER.md`.

**Saját kriptográfiát nem javaslok.** Az erősítés módja: termékdöntés a minimális titokerősségről, és szükség esetén egy auditált Argon2id-implementáció (`docs/audit/ARGON2-DONTES.md`).

## Ami nem ellenőrizhető (NOT VERIFIED)
- A WebView és a böngésző Web Crypto implementációjának helyessége (platformbizalom).
- A memóriából való törlés tényleges hatása.
- A tényleges offline törési idő a mai GPU-kon.
