# Klinikai biztonsági előaudit

> **Audit dátuma:** 2026-11-02 · **Vizsgált commit:** `220c066c283c22dbf3a5b16c9d1616d33a33d34c` · read-only előaudit · **nem független**
> **Nem klinikai értékelés.** A szerző nem addiktológus és nem klinikai szakpszichológus. Klinikai bizonyítékot vagy
> jóváhagyást nem állítok és nem szimulálok. A `docs/CLINICAL-REVIEW.md` aláírási táblázata **üres**, a tartalom állapota
> „Szakmai lektorálásra vár” (`src/content/locales/hu.js:13`).

## 1. Krízisfunkció

| Kérdés | Állapot | Bizonyíték |
|---|---|---|
| Elérhető zárolt állapotban? | igen | `src/App.jsx:179` |
| Bevezetőben, tárolóhibánál, betöltés közben? | igen | `App.jsx:171,188`; `Onboarding.jsx` (fejléc) |
| Modális ablakokban és rétegekben? | igen (saját link) | `src/components/crisis/CrisisButton.jsx:20-29`; `tests/components/HelpEverywhere.test.jsx` |
| Offline? | igen (`tel:` és SW-cache) | e2e „offline: crisis screen…” (HEAD, 2026-11-02 ✓); emulátoron repülőgép-mód |
| JS nélkül, vagy ha a bundle hibás? | igen, statikus tartalék | `index.html:28-33`; e2e |
| 112 az első, 200%-os nagyításnál is? | igen | `CrisisOverlay.jsx` (a 112 a cím alatt); e2e (195×422) |
| Rögzít-e bármit? | nem | `PRIVACY.md:62`; kódolvasás |
| Mikor kell sürgősségi ellátás? | a 112-es sor szövegében: „súlyos elvonási tünetek, görcsroham, zavartság” | `src/content/helplines.js:22` |
| Mikor kell szakember (nem akut)? | határ-mondat: „nem helyettesíti a szakember segítségét” | `hu.js:119`; `tests/clinical.test.js` K3 |
| Hibás krízisfelület (rossz szám)? | a kijelzett és a tárcsázott szám egyezését teszt őrzi; forrás és dátum minden vonalnál; 90 napos CI-figyelmeztetés | `tests/crisis.test.js`; `scripts/check-helplines.mjs` |
| Segélyvonalak pontossága | **csak webes forrásellenőrzés, próbahívás nincs**; a Drog Stop másodlagos; a 911 forrása nem töltött be (CLIN-05) | `helplines.js:15,40,96` |

## 2. Visszaesés (megcsúszás)
- **Nem büntető, nem megszégyenítő:** a tiltott szavakat (kudarc, nullázás, szégyen, identitáscímkék) teszt őrzi (`tests/copy.test.js:9-20`). Szöveg: „Nem törli az eddigi utadat” (`hu.js:248`), „Légy kedves magadhoz ma” (`:263`).
- **A korábbi fejlődés nem vész el:** az összes józan nap megmarad, és a lezárt szakasz „növekedési blokk” (`src/domain/timeline.js`; e2e „total (30) never resets”). Kivétel: egy utólag rögzített megcsúszás azt az egy napot kiveszi, ezt az app közli (`hu.js:260`).
- **Segítség felajánlása:** felajánlja, de nem kényszeríti (`hu.js:266`; `FreshStartModal.jsx`).
- **Elérhetőség:** a korábbi szakaszok az idővonalon maradnak.

## 3. Egészségügyi és klinikai állítások katalógusa
Kategóriák: **1** motivációs · **2** egészségügyi információ · **3** klinikai/terápiás tanács · **4** potenciálisan veszélyes (vagy veszélyes hiány)

| # | Szöveg (rövidítve) | Hely | Kat. |
|---|---|---|---|
| 1 | „Büszke vagyok minden napodra.” | `hu.js:486` | 1 |
| 2 | „Megcsináltad! A hullám elmúlt…” | `hu.js:557` | 1 |
| 3 | „A nehéz érzések hullámok: jönnek, és el is mennek.” | `hu.js:480` | 1–2 |
| 4 | „Ez megtörténik sokakkal a felépülés során.” | `hu.js:248` | 2 |
| 5 | „Sokszor 15–30 perc alatt alábbhagy” (sóvárgás) | `hu.js:66` | **2** (ellentmondásos, CLIN-03) |
| 6 | „A vágy 10–20 perc alatt tetőzik, aztán lecseng.” | `hu.js:490` | **2** (CLIN-03) |
| 7 | „Tíz perc, én végigviszlek.” (sóvárgás-időzítő) | `hu.js:541` | 2–3 |
| 8 | „A fáradtság felerősíti a sóvárgást.” | `hu.js:83` | **2** (CLIN-04) |
| 9 | „Tíz perc séta lecsökkenti a feszültséget…” | `hu.js:493` | **2** (CLIN-04) |
| 10 | „Ha kimondod vagy leírod, mit érzel, kisebbnek tűnik.” | `hu.js:494` | 2 |
| 11 | Légzés: „Ez segíthet lecsendesíteni a testet.” | `hu.js:21` | 2–3 |
| 12 | 4-7-8 légzés, 7 mp benntartás | `hu.js:40-50` | **3** (CLIN-06) |
| 13 | „Halaszd el a döntést 20 percre.” / „Igyál egy kis vizet, vagy egyél valamit.” | `hu.js:70-73` | 3 |
| 14 | 5-4-3-2-1 földelés | `hu.js:54-60` | 3 |
| 15 | „Ilyenkor gyakrabban jönnek nehéz pillanatok” (személyes mintázat) | `hu.js:79`; `src/domain/risk.js` | 2–3 (CLIN-07) |
| 16 | „Hétköznap gyakrabban érzed magad nehéznek. Lehet, hogy a munka…” | `hu.js:522` | 2 |
| 17 | 112: „súlyos elvonási tünetek, görcsroham, zavartság” | `helplines.js:22` | 2–3 |
| 18 | Elvonási kártya (tünetek, 112, „beszélj orvossal”) – **kikapcsolva** | `hu.js` `WITHDRAWAL`; `src/lib/features.js:5` | 3 (jóváhagyásra vár) |
| 19 | **Hiány:** „Ma kezdem” + alkohol/gyógyszer → nincs orvosi figyelmeztetés a hirtelen elhagyásról | `presets.js:43,47`; `hu.js:387-389` | **4** (CLIN-01) |
| 20 | „Nem orvosi eszköz, és nem helyettesíti a szakember segítségét.” | `hu.js:119` | határ-mondat |

**Nem találtam** gyógyulási ígéretet, sikerességi arányt, diagnózist, gyógyszeres vagy adagolási tanácsot. Ezeket teszt is tiltja (`tests/clinical.test.js` K6, `tests/copy.test.js`).

### Szakértői ellenőrzőlista a 2–4. kategóriához
- [ ] **CLIN-01:** kell-e kötelező figyelmeztetés alkohol- vagy benzodiazepin-használóknak a bevezetőben (orvosi konzultáció a hirtelen elhagyás előtt)? Pontos szöveg?
- [ ] Az elvonási kártya (`WITHDRAWAL`) tünetlistája és teendői helyesek-e; kell-e a 104 (mentők) külön?
- [ ] Egységes, forrással alátámasztott megfogalmazás a sóvárgás időtartamáról (5–7. sor).
- [ ] 8–10. sor: feltételes megfogalmazás kell-e, vagy elfogadható így?
- [ ] 4-7-8 légzés: maradjon, figyelmeztetéssel, vagy kerüljön ki?
- [ ] A 13–14. sor tanácsai biztonságosak-e krízisben?
- [ ] A személyes mintázat üzenete támogató vagy megfigyelő hatású?
- [ ] Az első napi „0 NAP” megjelenítés elfogadható-e (CLIN-10)?

## 4. Megbízható személy
| Kérdés | Állapot | Bizonyíték |
|---|---|---|
| Önkéntes? | igen, a Beállításokban; nem kötelező | `Settings.jsx:84-97` |
| Visszavonható? | igen (üres mezőkkel menthető → törlődik) | `Settings.jsx:88` |
| Hozzájárulás (a kapcsolattartóé)? | **nincs rá utalás** | PRIV-02 |
| A kontaktadat védelme | titkosítva | `schema.js:216-223` |
| Értesítés valós működése | **nincs értesítés**; csak egy `tel:` gomb a krízisoldalon, feloldott állapotban | `CrisisOverlay.jsx:68-73`; `App.jsx:163` |
| Hamis biztonságérzet? | Az app nem állítja, hogy értesít; zárolt állapotban a gomb nem látszik, ezt a felhasználó nem feltétlenül tudja | CLIN-08 |

## 5. Megállapítások
CLIN-01 (HIGH); CLIN-02, CLIN-03, CLIN-05 (MEDIUM); CLIN-04, CLIN-06, CLIN-07 (LOW); CLIN-08–11 (INFO). Részletek: `RISK-REGISTER.md`; kérdések a szakértőknek: `CLINICAL-EXPERT-QUESTIONNAIRE.md`.
