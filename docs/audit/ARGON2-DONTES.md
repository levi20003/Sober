# Döntési javaslat: Argon2id, minimális PIN-hossz, FLAG_SECURE

**Státusz: döntésre vár – [EMBERI TEENDŐ: termékgazda].** Ez a dokumentum nem dönt, csak előkészít.

## 1. PBKDF2 → Argon2id

| | PBKDF2-SHA-256 (jelenlegi, 600 000) | Argon2id (WASM) |
|---|---|---|
| GPU-s offline támadás ellen | gyenge: a GPU-k nagyon gyorsan számolják | erős: memóriaigényes, a GPU-előny jórészt elvész |
| Futásidejű függőség | nincs (Web Crypto) | kell egy WASM-modul (≈ 30–60 kB), ami új, auditálandó kód |
| CSP | változatlan | `script-src 'wasm-unsafe-eval'` kell |
| Teljesítmény | ≈ 0,3–1 s mobilon | a memóriaparaméter (pl. 64 MB) régi telefonon lassú vagy elfogyhat |
| Átállás | – | a slot `kdf.name` mezője már támogatja: új slot Argon2id-vel, a régi PBKDF2 slot a következő sikeres feloldáskor cserélhető |

**Javaslat:** az első független audit után, ha az auditor is javasolja. Addig a hosszabb jelszó ajánlása (a felület már mondja) a legnagyobb nyereség.

## 2. Minimális PIN-hossz
- **Jelenleg:** 4 karakter (termékdöntés), a legkönnyebb PIN-ek tiltva, a gyenge PIN-ről őszinte figyelmeztetés.
- **Lehetőségek:** (a) marad 4, (b) 6 számjegy minimum, (c) 4 számjegy csak akkor, ha nincs titkosított mentés kint (nem ellenőrizhető), (d) mentésfájlhoz külön, hosszabb jelszó.
- **Javaslat:** (b) 6 számjegy minimum új beállításnál; a meglévő 4 jegyű PIN-ek működnek tovább, és a Beállításokban egy kedves javaslat kéri a cserét. Indok: 10⁴ helyett 10⁶ próbálkozás egy ellopott fájlon (percek helyett órák), miközben a használhatóság alig romlik.

## 3. FLAG_SECURE (Android)
- **Előny:** a feloldott napló nem látszik a legutóbbi alkalmazások előnézetében és képernyőképen.
- **Hátrány:** a felhasználó saját magának sem tud képernyőképet készíteni (pl. a helyreállító kódról – ezt viszont épp nem is szeretnénk); a krízisképernyő képét sem tudja megosztani.
- **Lehetőségek:** (a) mindig be, (b) mindig ki, (c) a Beállításokban kapcsoló, alapból be.
- **Javaslat:** (c). Megvalósítás: a 3. fázisban a `MainActivity` egy kis natív hídon kapja a kapcsoló állapotát.
