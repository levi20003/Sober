# Szövegek szakmai lektorálásra (2026-10-26-draft, hu)

Generálta: `node scripts/review-export.mjs` – ne szerkeszd kézzel, a forrás a `src/content/` mappa.

Állapot: **Szakmai lektorálásra vár**. Tájékoztató a lektornak: [LEKTOR-TAJEKOZTATO.md](LEKTOR-TAJEKOZTATO.md). A visszajelzést a CSV-fájl üres oszlopaiban kérjük (Rendben / Módosítandó / Javasolt szöveg / Megjegyzés).

Összesen 839 szöveg. A biztonságkritikus részek (krízisképernyő, megcsúszás, értesítés) vannak elöl.


## Krízisképernyő – légzőgyakorlat

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `BREATHING.slow-exhale.name` | Hosszú kilégzés |  |
| `BREATHING.slow-exhale.description` | A kilégzés legyen hosszabb, mint a belégzés. Ez segíthet lecsendesíteni a testet. |  |
| `BREATHING.slow-exhale.steps.0.label` | Belégzés az orron |  |
| `BREATHING.slow-exhale.steps.1.label` | Lassú kilégzés a szádon |  |
| `BREATHING.box.name` | Négyzetlégzés |  |
| `BREATHING.box.description` | Négy egyforma szakasz. Ha szédülsz, lélegezz egyszerűen, természetesen. |  |
| `BREATHING.box.steps.0.label` | Belégzés |  |
| `BREATHING.box.steps.1.label` | Benntartás |  |
| `BREATHING.box.steps.2.label` | Kilégzés |  |
| `BREATHING.box.steps.3.label` | Szünet |  |
| `BREATHING.4-7-8.name` | 4-7-8 légzés |  |
| `BREATHING.4-7-8.description` | Belégzés 4, benntartás 7, kilégzés 8 ütemre. Ha a benntartás kellemetlen, vagy szédülsz, válts a „Hosszú kilégzés” gyakorlatra. |  |
| `BREATHING.4-7-8.steps.0.label` | Belégzés az orron |  |
| `BREATHING.4-7-8.steps.1.label` | Benntartás |  |
| `BREATHING.4-7-8.steps.2.label` | Lassú kilégzés a szádon |  |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CRISIS_STEPS.0` | Ha teheted, menj egy biztonságosabb helyre, vagy távolodj el a helyzettől. |  |
| `CRISIS_STEPS.1` | Igyál egy kis vizet, vagy egyél valamit. |  |
| `CRISIS_STEPS.2` | Írj vagy telefonálj valakinek, akiben megbízol. |  |
| `CRISIS_STEPS.3` | Halaszd el a döntést 20 percre. Utána nézd meg újra, hogy vagy. |  |
| `GROUNDING.title` | 5-4-3-2-1 – visszatérés a jelenbe |  |
| `GROUNDING.steps.0` | Nevezz meg 5 dolgot, amit látsz. |  |
| `GROUNDING.steps.1` | Nevezz meg 4 dolgot, amit meg tudsz érinteni. |  |
| `GROUNDING.steps.2` | Nevezz meg 3 hangot, amit hallasz. |  |
| `GROUNDING.steps.3` | Nevezz meg 2 illatot, amit érzel (vagy szeretsz). |  |
| `GROUNDING.steps.4` | Nevezz meg 1 dolgot, amiért most hálás lehetsz. |  |

## Krízisképernyő – kockázati üzenetek

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `RISK_MESSAGES.personal.title` | Ez az időszak korábban nehéz volt neked |  |
| `RISK_MESSAGES.personal.text` | A naplód alapján ilyenkor gyakrabban jönnek nehéz pillanatok. Jó, hogy itt vagy. Van terved a következő órára? | Akkor jelenik meg, ha ebben az órában korábban legalább két különböző napon nehéz pillanatot vagy megcsúszást rögzített. |
| `RISK_MESSAGES.lateNight.title` | Késő van |  |
| `RISK_MESSAGES.lateNight.text` | Éjszaka minden nehezebbnek tűnhet. A fáradtság felerősíti a sóvárgást. A 116-123 most is hívható. | 22:00–05:00 között. |
| `RISK_MESSAGES.weekend.title` | Hétvége |  |
| `RISK_MESSAGES.weekend.text` | A hétvégék sokaknak próbára tevők. Segíthet egy előre megtervezett program vagy egy rövid séta. | Péntek 17:00-tól vasárnap éjfélig. |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.helpButton` | Most segítségre van szükségem |  |
| `T.helpButtonShort` | Segítség most |  |
| `T.crisisReasons` | Ezért csinálod |  |
| `T.crisisCountry` | Ország |  |
| `T.crisisCountryHint` | Válaszd ki, hol vagy: a segélyvonalak országonként mások. |  |
| `T.crisisNeedsInternet` | Ehhez internet kell |  |
| `T.crisisTitle` | Itt vagyunk. Lépésről lépésre. |  |
| `T.crisisIntro` | Amit most érzel, el fog múlni. Válassz egyet az alábbiak közül. |  |
| `T.crisisCallTitle` | Beszélj valakivel most |  |
| `T.crisisCall` | Hívás: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.crisisBreatheTitle` | Lélegezz velem |  |
| `T.crisisStart` | Indítás |  |
| `T.crisisStop` | Leállítás |  |
| `T.crisisPause` | Szüneteltetés |  |
| `T.crisisResume` | Folytatás |  |
| `T.crisisRound` | 7. kör / 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.crisisDone` | Szépen csináltad. Hogy érzed magad most? |  |
| `T.crisisNowSteps` | Amit most megtehetsz |  |
| `T.crisisBack` | Vissza |  |
| `T.crisisOffline` | Ez az oldal internet nélkül is működik. A hívásokhoz nem kell internet, csak telefonos térerő. |  |
| `T.crisisEmergencyLead` | Közvetlen veszély esetén azonnal hívd: |  |
| `T.crisisCopy` | Szám másolása |  |
| `T.crisisCopied` | Kimásolva |  |
| `T.crisisCopyManual` | Jelöld ki és másold ki a számot |  |
| `T.crisisPatternLabel` | Légzésminta |  |
| `T.crisisPaused` | Megállítva. Bármikor folytathatod. |  |
| `T.crisisEscHint` | Az Esc billentyűvel is visszaléphetsz. |  |
| `URGE_WAVE.title` | A sóvárgás olyan, mint egy hullám |  |
| `URGE_WAVE.text` | Felerősödik, tetőzik, majd elcsendesedik. Sokszor 15–30 perc alatt alábbhagy. Nem kell semmit tenned vele, csak kivárni. Figyeld meg, hol érzed a testedben, és lélegezz. |  |

## Krízisképernyő – elvonási tünetek kártya (KIKAPCSOLVA, jóváhagyásra vár)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `WITHDRAWAL.title` | Elvonási tünetek: mikor kell azonnal segítség? | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.intro` | Az alkohol vagy bizonyos nyugtatók (benzodiazepinek) hirtelen elhagyása veszélyes lehet. Ha az alábbiak bármelyikét tapasztalod magadon vagy valaki máson, ne várj. | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.0` | Görcsroham vagy rángatózás | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.1` | Zavartság, tájékozatlanság | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.2` | Olyan dolgok látása vagy hallása, amik nincsenek ott | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.3` | Erős remegés, nagyon szapora szívverés, magas láz | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.4` | Mellkasi fájdalom vagy nehézlégzés | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.action` | Hívd a 112-t, vagy kérj meg valakit, hogy hívja. | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.note` | Ha abbahagyást tervezel, előtte érdemes orvossal beszélned (például a háziorvosoddal vagy egy addiktológiai ambulanciával). | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `HELPLINES.HU.emergency.name` | Általános segélyhívó | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.emergency.hours` | Éjjel-nappal, ingyenes | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.emergency.when` | Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell (pl. súlyos elvonási tünetek, görcsroham, zavartság). | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.lesz.name` | S.O.S. Lelki Elsősegély Telefonszolgálat | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.lesz.hours` | Éjjel-nappal, belföldről ingyenes, névtelenül hívható | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.lesz.when` | Ha beszélgetni szeretnél valakivel, aki meghallgat, bármilyen nehéz pillanatban. | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.drog-stop.name` | Drog Stop segélyvonal | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.drog-stop.hours` | Ingyenesen hívható | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.drog-stop.when` | Ha szerhasználattal kapcsolatban szeretnél beszélni valakivel – magad vagy egy hozzátartozód miatt. | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.kek-vonal.name` | Kék Vonal (gyerekeknek és fiataloknak) | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.HU.kek-vonal.hours` | Ingyenes, nem kell megmondanod a neved | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.HU.kek-vonal.when` | Ha fiatal vagy (24 év alatt), és jól jönne egy beszélgetés. | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.UK.uk-emergency.name` | Segélyhívó (Egyesült Királyság) | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.uk-emergency.hours` | Éjjel-nappal, ingyenes (a 112 is működik) | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.uk-emergency.when` | Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell. | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.samaritans.name` | Samaritans | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.samaritans.hours` | Éjjel-nappal, ingyenes | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.samaritans.when` | Ha beszélgetni szeretnél valakivel, aki meghallgat. (Angol nyelvű vonal.) | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.frank.name` | FRANK | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.frank.hours` | Éjjel-nappal | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.frank.when` | Információ és tanács drogokkal kapcsolatban. (Angol nyelvű vonal.) | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.drinkline.name` | Drinkline | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.UK.drinkline.hours` | Munkanapokon 9–20, hétvégén 11–16 (Anglia) | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.UK.drinkline.when` | Ha az alkoholfogyasztásod miatt aggódsz, magad vagy más miatt. (Angol nyelvű vonal.) | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.US.us-emergency.name` | Segélyhívó (USA) | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.us-emergency.hours` | Éjjel-nappal, ingyenes | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.us-emergency.when` | Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell. | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.lifeline-988.name` | 988 Suicide & Crisis Lifeline | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.lifeline-988.hours` | Éjjel-nappal, ingyenes; hívás vagy SMS | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.lifeline-988.when` | Ha lelki válságban vagy, vagy mélyen elkeseredtél. (Angol nyelvű vonal.) | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.samhsa.name` | SAMHSA National Helpline | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.US.samhsa.hours` | Éjjel-nappal, ingyenes, bizalmas | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.US.samhsa.when` | Segítség és tájékoztatás szerhasználattal és függőséggel kapcsolatban. (Angol nyelvű vonal.) | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.INT.int-emergency.name` | Általános segélyhívó (EU és sok más ország) | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.int-emergency.hours` | Éjjel-nappal, ingyenes | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.int-emergency.when` | Ha közvetlen veszélyben vagy te vagy valaki más. Ha nem tudod, melyik szám működik a környéken, a 112 sok helyen továbbít a helyi segélyhívóhoz. | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.findahelpline.name` | Find a Helpline: segélyvonalak szerte a világon | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |
| `HELPLINES.INT.findahelpline.hours` | Internetkapcsolat kell hozzá | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |
| `HELPLINES.INT.findahelpline.when` | Válaszd ki az országodat, és megmutatja a közeli segélyvonalakat. | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |

## Megcsúszás és új szakasz

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.slipTitle` | Megcsúszás |  |
| `T.slipIntro` | Ez megtörténik sokakkal a felépülés során. Nem törli az eddigi utadat: minden megtett józan nap megmarad, és holnap új szakasz kezdődik. | A megcsúszás rögzítésekor, az űrlap tetején. |
| `T.slipDateLabel` | Mikor történt? |  |
| `T.slipWhatLabel` | Mi vezetett hozzá? (nem kötelező) |  |
| `T.slipLessonLabel` | Mit vinnél magaddal ebből a következő szakaszba? (nem kötelező) |  |
| `T.slipIntentionLabel` | Mire figyelsz az új szakaszban? (nem kötelező) |  |
| `T.slipConfirm` | Új szakasz kezdése |  |
| `T.freshTitle` | Új szakasz kezdődik |  |
| `T.freshClosedLabel` | Lezárt szakasz |  |
| `T.freshClosed` | 7 józan nap. Ez a tiéd marad. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.freshTotal` | Összes józan napod: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.freshLessonSaved` | A tanulságodat elmentettük, ott lesz a naplódban. |  |
| `T.freshIntention` | Amire figyelsz: |  |
| `T.freshRetro` | Utólag rögzítetted, ezért az az egy nap már nem számít józan napnak. Minden más napod megmarad. |  |
| `T.freshSameDay` | Erre a napra már kezdtél új szakaszt. A mostani gondolataidat hozzáadtuk. |  |
| `T.freshSplit` | Ez egy korábbi szakaszt két részre bontott. A többi napod változatlan. |  |
| `T.freshKind` | Légy kedves magadhoz ma. Egy nehéz nap nem írja felül az eddigi utadat. | A megcsúszás után, az összegző képernyőn. |
| `T.freshContinue` | Tovább a kezdőlapra |  |
| `T.slipSupport` | Ha most nehéz, a „Segítség most” gomb mindig itt van. |  |
| `T.freshOfferHelp` | Ha most nehéz, nem kell egyedül lenned vele. Szeretnél beszélni valakivel? | A megcsúszás után: felajánlja (nem nyitja meg magától) a krízisképernyőt. |
| `T.freshOfferHelpButton` | Segélyvonalak megnyitása |  |

## Értesítés (zárolt képernyőn is látszik)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `NOTIFICATION.title` | Egy perc magadra |  |
| `NOTIFICATION.body` | Hogy telik a napod? Ha van kedved, nézz be. |  |
| `NOTIFICATION.actionOpen` | Megnyitás |  |
| `NOTIFICATION.actionOff` | Emlékeztetők kikapcsolása |  |

## Bevezető

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `ONB.step` | 7 / 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.progressLabel` | 7. lépés 2026. október 1.-ból | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.next` | Tovább |  |
| `ONB.back` | Vissza |  |
| `ONB.skip` | Kihagyom |  |
| `ONB.start` | Kezdjük |  |
| `ONB.finish` | Irány a főoldal |  |
| `ONB.help` | Segítség most |  |
| `ONB.mascotLabel` | Pötty, a kabala |  |
| `ONB.welcomeTitle` | Szia! Ez a te csendes, privát helyed. |  |
| `ONB.welcomeText` | Pár kérdéssel összerakjuk, hogy neked szóljon. Bármikor kihagyhatsz egy kérdést, és később mindent átírhatsz. |  |
| `ONB.welcomeRestore` | Van már mentésem másik eszközről |  |
| `ONB.nickTitle` | Hogy hívhatlak? |  |
| `ONB.nickText` | Egy becenév elég. Csak ezen az eszközön marad, titkosítva. |  |
| `ONB.nickLabel` | Becenév |  |
| `ONB.nickPlaceholder` | pl. Dani |  |
| `ONB.substancesTitle` | Mitől szeretnél távol maradni? |  |
| `ONB.substancesText` | Többet is választhatsz. Ezt senki más nem látja. |  |
| `ONB.otherLabel` | Egyéb, saját szavaiddal |  |
| `ONB.startTitle` | Mióta tart az utad? |  |
| `ONB.startToday` | Ma kezdem |  |
| `ONB.startEarlier` | Korábban kezdtem |  |
| `ONB.startDateLabel` | Az utad kezdete |  |
| `ONB.startFuture` | Jövőbeli dátumot nem adhatsz meg. Válaszd a mai napot, vagy egy korábbit. |  |
| `ONB.goalTitle` | Mi lenne most egy jó cél? |  |
| `ONB.goalText` | Nem verseny: egy kis lépcsőfok, amit meg tudsz ugrani. |  |
| `ONB.goalOption` | 7 nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.goalCustom` | Saját cél |  |
| `ONB.goalCustomLabel` | Hány nap legyen a célod? |  |
| `ONB.goalInvalid` | A cél 1 és 3650 nap között lehet. |  |
| `ONB.costTitle` | Mennyit költöttél erre egy átlagos napon? |  |
| `ONB.costText` | Becslés is elég. Ebből számoljuk, mennyit tartasz meg. Nem kötelező. |  |
| `ONB.costLabel` | Napi költség (Ft) |  |
| `ONB.costMonthly` | Ez havonta kb. 7. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.costInvalid` | A napi költség 0 és 1 000 000 Ft közötti szám legyen. |  |
| `ONB.triggersTitle` | Melyik helyzetek a nehezebbek? |  |
| `ONB.triggersText` | Ha tudjuk, mikor vagy sebezhetőbb, jobb ötleteket tudunk adni. Többet is választhatsz. |  |
| `ONB.triggerShort.stress` | Stressz |  |
| `ONB.triggerShort.loneliness` | Magány |  |
| `ONB.triggerShort.weekend` | Hétvége |  |
| `ONB.triggerShort.social` | Buli |  |
| `ONB.triggerShort.fatigue` | Fáradtság |  |
| `ONB.triggerShort.boredom` | Unalom |  |
| `ONB.triggerShort.conflict` | Veszekedés |  |
| `ONB.triggersCustomLabel` | Saját helyzet |  |
| `ONB.triggerRemove` | 7 eltávolítása | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.triggersCustomAdd` | Hozzáadom |  |
| `ONB.pinTitle` | Zárd le egy PIN-kóddal vagy jelszóval |  |
| `ONB.pinText` | Ezzel titkosítjuk mindazt, amit most megadtál. Mi sem tudjuk visszaállítani, ezért kapsz majd egy helyreállító kódot. |  |
| `ONB.pinSaving` | Mentés… |  |
| `ONB.recoveryTitle` | A helyreállító kódod |  |
| `ONB.recoveryText` | Ezzel nyithatod meg újra az adataidat, ha elfelejted a PIN-t. Mentsd el, csak most látod. |  |
| `ONB.recoveryConfirm` | Elmentettem biztonságos helyre |  |
| `ONB.doneTitle` | Szép munka, 7! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.doneText` | Kész a saját helyed. Minden nap számít. |  |
| `ONB.languageLabel` | Nyelv / Language |  |
| `ONB.restartNote` | Ha kilépsz a kérdések közben, a következő megnyitáskor elölről kezdjük. Addig semmi sem mentődik el. |  |
| `ONB.noName` | Barátom |  |
| `SETUP.nickLabel` | Hogy szólíthatlak? (nem kötelező) |  |
| `SETUP.title` | Tedd a sajátoddá |  |
| `SETUP.progress` | 7 / 2026. október 1. kész | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.goal` | Tűzz ki egy célt |  |
| `SETUP.cost` | Mennyit költöttél rá naponta? |  |
| `SETUP.triggers` | Mikor nehezebb? |  |
| `SETUP.notNow` | Most nem |  |
| `SETUP.save` | Mentés |  |
| `SETUP.stats` | Statisztika |  |
| `SETUP.nextBadge` | Következő mérföldkő |  |
| `SETUP.badgeIn` | 7 nap múlva | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.badgeDone` | Minden megvan |  |
| `SETUP.goalLine` | még 7 nap a célig | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.thought` | Mai gondolat |  |
| `SETUP.moodLogged` | Mai hangulat |  |

## Bevezető, Krízisképernyő, Beállítások → Névjegy

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.disclaimer` | A Józanság-számláló segít követni és támogatni a józanságod útját. Nem orvosi eszköz, és nem helyettesíti a szakember segítségét. | Határ-mondat: megjelenik a bevezetőben, a krízisképernyőn, a Névjegyben, a README-ben és az APK kiadási jegyzetében. |
| `T.privacyPromise` | Minden adatod kizárólag ezen az eszközön marad, titkosítva. Nincs regisztráció, nincs felhő, nincs követés. |  |

## Bevezető

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.onboardingTitle` | Üdv itt. |  |
| `T.onboardingIntro` | Ez egy csendes, privát hely a saját utadhoz. Ha egy nap nehezebb, az sem törli az eddigi utadat: minden megtett nap megmarad. |  |

## Főoldal

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `ENCOURAGEMENTS.e1.text` | Ma is számít, hogy itt vagy. |  |
| `ENCOURAGEMENTS.e2.text` | Egy nap egyszerre. Pont ennyi a feladat. |  |
| `ENCOURAGEMENTS.e3.text` | Nem kell tökéletesnek lenned, elég, ha ma is próbálkozol. |  |
| `ENCOURAGEMENTS.e4.text` | A nehéz érzések hullámok: jönnek, és el is mennek. |  |
| `ENCOURAGEMENTS.e4.tags.0` | stress |  |
| `ENCOURAGEMENTS.e4.tags.1` | boredom |  |
| `ENCOURAGEMENTS.e5.text` | Aki kér segítséget, bátor. Ma is megteheted. |  |
| `ENCOURAGEMENTS.e5.tags.0` | loneliness |  |
| `ENCOURAGEMENTS.e6.text` | A hétvégén is veled vagyok. Tervezz be valami kellemeset. |  |
| `ENCOURAGEMENTS.e6.tags.0` | weekend |  |
| `ENCOURAGEMENTS.e6.tags.1` | social |  |
| `ENCOURAGEMENTS.e7.text` | Ma is jobban tudod, mi kell neked, mint tegnap. |  |
| `ENCOURAGEMENTS.e8.text` | A fáradtság is elmúlik. Aludj ma korán, ha tudsz. |  |
| `ENCOURAGEMENTS.e8.tags.0` | fatigue |  |
| `ENCOURAGEMENTS.e9.text` | Egy vita nem határoz meg. Vegyél három mély levegőt. |  |
| `ENCOURAGEMENTS.e9.tags.0` | conflict |  |
| `ENCOURAGEMENTS.e10.text` | Büszke vagyok minden napodra. |  |
| `GREETINGS.reggel` | Jó reggelt |  |
| `GREETINGS.nap` | Szia |  |
| `GREETINGS.este` | Jó estét |  |
| `GREETINGS.ejszaka` | Csendes éjszakát |  |
| `HOME.hello` | 7, 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.appbarHello` | Szia, 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.totalLabel` | Összes józan napod |  |
| `HOME.totalSub` | Egy megcsúszás sem törli: minden józan napod megmarad. |  |
| `HOME.newPhase` | Ma új szakasz kezdődött. Az eddigi utad megmaradt. |  |
| `HOME.goalLabel` | A célod |  |
| `HOME.goalProgress` | 7 / 2026. október 1. nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalReached` | Elérted a 7 napos célodat. Büszke lehetsz magadra! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalNext` | Mi lenne a következő? Javaslat: 7 nap. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalSet` | Új cél kitűzése |  |
| `HOME.goalNone` | Tűzz ki egy célt a Beállításokban. |  |
| `HOME.savingsLabel` | Eddig megtartottál |  |
| `HOME.savingsFun` | Ez 7 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.savingsSetup` | Add meg a napi költséget, és kiszámoljuk. |  |
| `HOME.moodTitle` | Hogy vagy ma? |  |
| `HOME.moodHint` | Koppints arra, amelyik most a legközelebb áll hozzád. |  |
| `HOME.moodSaved` | Elmentettem: 7. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodChange` | Átírom |  |
| `HOME.moodToday` | Ma ez van: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodIntensity` | Mennyire erős? |  |
| `HOME.moodNote` | Egy gondolat hozzá (nem kötelező) |  |
| `HOME.moodSave` | Mentés |  |
| `HOME.moodWeek` | A heted egy pillantással |  |
| `HOME.moodDonut` | A heted hangulatai |  |
| `HOME.moodMostCommon` | Leggyakoribb: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodNoData` | Még nincs hangulat erre a hétre. |  |
| `HOME.energy` | Energia |  |
| `HOME.stress` | Feszültség |  |
| `HOME.outOf100` | a 100-ból |  |
| `HOME.trendNone` | Még nincs elég adat. |  |
| `HOME.badgesTitle` | Mérföldkövek |  |
| `HOME.badgeLabel` | 7 napos jelvény | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.badgeNext` | Következő jelvény: 7 nap múlva | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.badgeAll` | Minden jelvényt megszereztél. Hihetetlen. |  |
| `HOME.thoughtsTitle` | A mai gondolatok |  |
| `HOME.weekDays.0` | H |  |
| `HOME.weekDays.1` | K |  |
| `HOME.weekDays.2` | Sze |  |
| `HOME.weekDays.3` | Cs |  |
| `HOME.weekDays.4` | P |  |
| `HOME.weekDays.5` | Szo |  |
| `HOME.weekDays.6` | V |  |
| `HOME.weekSober` | józan nap |  |
| `HOME.weekSlip` | megcsúszás |  |
| `HOME.helloBubble` | Köszönöm, hogy megosztottad. Itt vagyok. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.pottyReact.positive` | Ennek örülök! Élvezd ki a napot. |  |
| `HOME.pottyReact.neutral` | Rendben, így is jó. Egy lépés egyszerre. |  |
| `HOME.pottyReact.hard` | Köszönöm, hogy megmondtad. Nem kell egyedül végigcsinálni. Ha kell, a sárga gomb mindig itt van. |  |
| `HOME.pottyReact.slip` | Megtörtént, és ez nem töröl semmit. Minden megtett nap a tiéd marad. Holnap új szakasz. |  |
| `HOME.slipKind` | Nehéz nap volt. Nem kell magyarázkodnod: az eddigi utad megmaradt. |  |
| `TIPS.tip1.title` | Hullámlovaglás |  |
| `TIPS.tip1.text` | A vágy 10–20 perc alatt tetőzik, aztán lecseng. Nézd végig, mint egy hullámot. |  |
| `TIPS.tip1.tags.0` | stress |  |
| `TIPS.tip1.tags.1` | boredom |  |
| `TIPS.tip2.title` | Hívj valakit |  |
| `TIPS.tip2.text` | Egy rövid hívás egy barátoddal néha többet ér, mint bármilyen trükk. |  |
| `TIPS.tip2.tags.0` | loneliness |  |
| `TIPS.tip3.title` | Tervezz hétvégét |  |
| `TIPS.tip3.text` | Írj fel két dolgot péntekre és szombatra, amire várni lehet. |  |
| `TIPS.tip3.tags.0` | weekend |  |
| `TIPS.tip3.tags.1` | social |  |
| `TIPS.tip4.title` | Menj ki a friss levegőre |  |
| `TIPS.tip4.text` | Tíz perc séta lecsökkenti a feszültséget, és elvonja a figyelmet. |  |
| `TIPS.tip4.tags.0` | stress |  |
| `TIPS.tip4.tags.1` | fatigue |  |
| `TIPS.tip4.tags.2` | boredom |  |
| `TIPS.tip5.title` | Nevezd meg az érzést |  |
| `TIPS.tip5.text` | Ha kimondod vagy leírod, mit érzel, kisebbnek tűnik. |  |
| `TIPS.tip5.tags.0` | conflict |  |
| `TIPS.tip5.tags.1` | stress |  |
| `TIPS.tip6.title` | Készülj fel előre |  |
| `TIPS.tip6.text` | Gondold végig, mit mondasz, ha valaki kínál. Egy kész mondat segít. |  |
| `TIPS.tip6.tags.0` | social |  |
| `TIPS.tip7.title` | Pihenj ma többet |  |
| `TIPS.tip7.text` | A kialvatlanság erősíti a vágyat. A korai lefekvés is egy lépés. |  |
| `TIPS.tip7.tags.0` | fatigue |  |
| `TIPS.tip8.title` | Jutalmazd meg magad |  |
| `TIPS.tip8.text` | Amit megspóroltál, abból vegyél valami kicsi örömöt. |  |

## Ünneplés (mérföldkő)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CELEBRATE.title` | 7 nap! Ez hatalmas! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `CELEBRATE.text` | Minden egyes nap a te döntésed volt. Gratulálok! |  |
| `CELEBRATE.close` | Köszönöm |  |

## Gyors rögzítés

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `QUICK_ADD.title` | Mit rögzítesz? |  |
| `QUICK_ADD.items.checkin.label` | Hangulat |  |
| `QUICK_ADD.items.note.label` | Jegyzet |  |
| `QUICK_ADD.items.trigger.label` | Nehéz pillanat |  |
| `QUICK_ADD.items.urge.label` | Most kívánom |  |
| `QUICK_ADD.slip` | Megcsúsztam |  |
| `QUICK_ADD.close` | Bezár |  |
| `T.quickTitle` | Gyors rögzítés |  |
| `T.quickHint` | Koppints, és rögzítsd. Jegyzetet csak ha szeretnél. |  |
| `T.quickTriggerGroup` | Nehéz helyzet |  |
| `T.quickMoodGroup` | Hangulat |  |
| `T.quickIntensityLabel` | Mennyire erős? (nem kötelező) |  |
| `T.quickNoteLabel` | Jegyzet (nem kötelező, titkosítva marad) |  |
| `T.quickSave` | Rögzítés |  |
| `T.quickLogged` | Rögzítve: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.sleepTrend` | Alvásminőség (7 nap) |  |
| `T.sleepBetter` | Jobb, mint az előző héten |  |
| `T.sleepSame` | Hasonló, mint az előző héten |  |
| `T.sleepWorse` | Kicsit rosszabb – ez is rendben van, figyelj magadra |  |
| `T.checkinPrompt` | Hogy vagy ma? |  |
| `T.checkinDone` | Mára már beírtál. Köszönjük, hogy figyelsz magadra. |  |
| `T.moodLabel` | Hangulat |  |
| `T.sleepLabel` | Hogyan aludtál? |  |
| `T.cravingLabel` | Sóvárgás ma |  |
| `T.checkinTriggersLabel` | Volt ma nehezebb helyzet? (nem kötelező) |  |
| `T.noteLabel` | Jegyzet (nem kötelező) |  |
| `T.triggerTitle` | Nehéz pillanat |  |
| `T.triggerIntro` | Jó, hogy észrevetted. Ennek rögzítése önmagában is erősség. |  |
| `T.triggersLabel` | Mi váltotta ki? |  |
| `T.copingLabel` | Mi segített? |  |
| `T.noteTitle` | Jegyzet |  |
| `T.noteEmpty` | Írj valamit a mentéshez. |  |

## Idővonal

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.totalSober` | Összes józan nap |  |
| `T.totalSoberHint` | Egy megcsúszás sem törli: minden józan napod megmarad. |  |
| `T.heroCurrent` | Jelenlegi szakasz: 7 nap · 2026. október 1. óta | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseZero` | Ma új szakasz kezdődött. Az eddigi utad megmaradt. |  |
| `T.phaseLabel` | 7. szakasz | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.timelineTitle` | Az utad |  |
| `T.timelineAria` | 7 szakasz, összesen 2026. október 1. józan nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseCardCurrent` | Jelenlegi szakasz |  |
| `T.phaseCardClosed` | Lezárt szakasz |  |
| `T.phaseLessons` | Amit magaddal vittél |  |
| `T.phaseIntentionsCurrent` | Amire figyelsz |  |
| `T.phaseIntentionsClosed` | Amire figyeltél |  |
| `T.phaseCounts` | 7 napi bejelentkezés · 2026. október 1. megküzdött nehéz pillanat | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseEntriesToggle` | Bejegyzések (7) | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseStartsTomorrowBig` | Holnap kezdődik |  |
| `T.phaseStartedToday` | Ma kezdődött |  |
| `T.phaseDates` | 7 – 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.typeLabels.checkin` | Napi bejelentkezés |  |
| `T.typeLabels.trigger` | Nehéz pillanat |  |
| `T.typeLabels.slip` | Megcsúszás – új szakasz |  |
| `T.typeLabels.note` | Jegyzet |  |
| `TIMELINE_PAGE.title` | Idővonal |  |
| `TIMELINE_PAGE.ranges.week` | Hét |  |
| `TIMELINE_PAGE.ranges.month` | Hónap |  |
| `TIMELINE_PAGE.ranges.year` | Év |  |
| `TIMELINE_PAGE.chartTitle` | Józan napjaid |  |
| `TIMELINE_PAGE.chartDesc` | Józan napok naponta | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.soberDays` | 7 józan nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.tooltip` | 7: 2026. október 1. józan nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.moodTrend` | A hangulatod alakulása |  |
| `TIMELINE_PAGE.patternsTitle` | Amit észrevettünk |  |
| `TIMELINE_PAGE.patternNone` | Néhány bejegyzés után itt jelennek meg a mintázatok. Mindez csak ezen az eszközön számolódik. |  |
| `TIMELINE_PAGE.patterns.weekend-stress` | Hétvégén gyakrabban érzed magad nehéznek. Érdemes előre tervezni a hétvégét. |  |
| `TIMELINE_PAGE.patterns.weekday-stress` | Hétköznap gyakrabban érzed magad nehéznek. Lehet, hogy a munka vagy a rutin nyomja a válladat. |  |
| `TIMELINE_PAGE.patterns.most-common` | Az utóbbi időben a leggyakoribb hangulatod: 7. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.logTitle` | Bejegyzések |  |
| `TIMELINE_PAGE.addEntry` | Új bejegyzés |  |

## Megtakarítás

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `FUN_ITEMS.pizza.label` | pizza |  |
| `FUN_ITEMS.cinema.label` | mozijegy |  |
| `FUN_ITEMS.coffee.label` | kávé |  |
| `FUN_ITEMS.book.label` | jó könyv |  |
| `FUN_ITEMS.icecream.label` | fagyi |  |
| `FUN_ITEMS.bike.label` | városi bicikli-szerviz |  |
| `FUN_ITEMS.trip.label` | hétvégi kirándulás |  |
| `SAVINGS_MILESTONES.coffee.label` | Egy kávé egy baráttal |  |
| `SAVINGS_MILESTONES.cinema.label` | Egy mozijegy |  |
| `SAVINGS_MILESTONES.book.label` | Egy jó könyv |  |
| `SAVINGS_MILESTONES.gym.label` | Egy hónap edzőterem |  |
| `SAVINGS_MILESTONES.dinner.label` | Egy vacsora kettesben |  |
| `SAVINGS_MILESTONES.shoes.label` | Új futócipő |  |
| `SAVINGS_MILESTONES.trip.label` | Egy hétvégi kirándulás |  |
| `SAVINGS_MILESTONES.wellness.label` | Egy hosszú hétvége wellness szállodában |  |
| `SAVINGS_MILESTONES.holiday.label` | Egy nyaralás |  |
| `SAVINGS_MILESTONES.million.label` | Egy nagy, fontos cél – te döntöd el, mire |  |
| `SAVINGS_PAGE.title` | Megtakarítás |  |
| `SAVINGS_PAGE.perMonthTitle` | Havi bontás |  |
| `SAVINGS_PAGE.monthRow` | 7: 2026. október 1. nap, 3 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SAVINGS_PAGE.goalTitle` | Megtakarítási célod |  |
| `SAVINGS_PAGE.goalProgress` | 7: 2026. október 1.% | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SAVINGS_PAGE.goalSet` | Cél beállítása |  |

## Eszközök

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CHALLENGE_CATALOG.water.text` | Igyál ma legalább két liter vizet |  |
| `CHALLENGE_CATALOG.walk.text` | Sétálj tíz percet a szabadban |  |
| `CHALLENGE_CATALOG.walk.tags.0` | stress |  |
| `CHALLENGE_CATALOG.walk.tags.1` | boredom |  |
| `CHALLENGE_CATALOG.call.text` | Hívj fel valakit, akit szeretsz |  |
| `CHALLENGE_CATALOG.call.tags.0` | loneliness |  |
| `CHALLENGE_CATALOG.breathe.text` | Három mély lélegzet, lassan |  |
| `CHALLENGE_CATALOG.breathe.tags.0` | stress |  |
| `CHALLENGE_CATALOG.breathe.tags.1` | conflict |  |
| `CHALLENGE_CATALOG.sleep.text` | Feküdj le ma fél órával korábban |  |
| `CHALLENGE_CATALOG.sleep.tags.0` | fatigue |  |
| `CHALLENGE_CATALOG.plan.text` | Írj fel egy kellemes tervet a hétvégére |  |
| `CHALLENGE_CATALOG.plan.tags.0` | weekend |  |
| `CHALLENGE_CATALOG.plan.tags.1` | social |  |
| `CHALLENGE_CATALOG.tidy.text` | Rendezz el egy kis sarkot otthon |  |
| `CHALLENGE_CATALOG.tidy.tags.0` | boredom |  |
| `CHALLENGE_CATALOG.thanks.text` | Köszönj meg valamit valakinek |  |
| `CHALLENGE_CATALOG.thanks.tags.0` | loneliness |  |
| `CHALLENGE_CATALOG.thanks.tags.1` | conflict |  |
| `CHALLENGE_CATALOG.stretch.text` | Nyújtózz öt percet |  |
| `CHALLENGE_CATALOG.stretch.tags.0` | fatigue |  |
| `CHALLENGE_CATALOG.stretch.tags.1` | stress |  |
| `CHALLENGE_CATALOG.note.text` | Írd le, minek örülsz ma |  |
| `TOOLS.title` | Eszközök |  |
| `TOOLS.urgeTitle` | Most nagyon kívánom |  |
| `TOOLS.urgeText` | A vágy hullám: tetőzik, aztán elül. Tíz perc, én végigviszlek. |  |
| `TOOLS.urgeStart` | Elindítom |  |
| `TOOLS.urgePause` | Szünet |  |
| `TOOLS.urgeResume` | Folytatom |  |
| `TOOLS.urgeAgain` | Újra |  |
| `TOOLS.urgeBreathe` | Lélegezz velem: be 4, ki 6. |  |
| `TOOLS.urgeLevels.rising` | A hullám most emelkedik. Ez a legnehezebb rész. |  |
| `TOOLS.urgeLevels.peak` | Most van a csúcson. Maradj itt, mindjárt fordul. |  |
| `TOOLS.urgeLevels.falling` | Már csillapodik. Érzed? |  |
| `TOOLS.urgeLevels.done` | Letelt a tíz perc. |  |
| `TOOLS.urgeDistractions.0` | Igyál sok vizet |  |
| `TOOLS.urgeDistractions.1` | Menj ki a friss levegőre |  |
| `TOOLS.urgeDistractions.2` | Hívj fel valakit |  |
| `TOOLS.urgeDistractions.3` | Mosd meg az arcod hideg vízzel |  |
| `TOOLS.urgeDistractions.4` | Rakj rendet egy fiókban |  |
| `TOOLS.urgeDistractions.5` | Hallgass meg egy dalt, amit szeretsz |  |
| `TOOLS.urgeAsk` | Elmúlt? |  |
| `TOOLS.urgePassed` | Igen, elmúlt |  |
| `TOOLS.urgeStill` | Még tart |  |
| `TOOLS.urgeVictory` | Megcsináltad! A hullám elmúlt, te pedig itt vagy. |  |
| `TOOLS.urgeStillText` | Semmi gond. Indíthatsz újabb tíz percet, vagy kérhetsz segítséget a sárga gombbal. |  |
| `TOOLS.urgeReasons` | Ezért csinálod |  |
| `TOOLS.challengesTitle` | Mai mini-kihívások |  |
| `TOOLS.challengeDone` | Kész |  |
| `TOOLS.challengeDo` | Megcsináltam |  |
| `TOOLS.challengeStreak` | 7 nap a héten | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.challengeTotal` | Eddig 7 napon csináltál valamit magadért. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.challengeSkipNote` | Ha kihagysz egy napot, a sorozat nem törlődik. A lángot a következő kis lépés újra élesztheti. |  |
| `TOOLS.gratitudeTitle` | Hála-napló |  |
| `TOOLS.gratitudeText` | Írj fel egy-három dolgot, aminek ma örülsz. |  |
| `TOOLS.gratitudeLabel` | 7. dolog | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.gratitudeSave` | Felírom |  |
| `TOOLS.gratitudeEmpty` | Még üres a hála-faladat. |  |
| `TOOLS.letterTitle` | Levél önmagadnak |  |
| `TOOLS.letterText` | Írj magadnak egy levelet: a mostani önmagadtól a későbbi énednek. Titkosítva marad, és egy nehéz pillanatban vagy mérföldkőnél megjelenik. |  |
| `TOOLS.letterLabel` | A levél szövege |  |
| `TOOLS.letterWhen` | Mikor jelenjen meg? |  |
| `TOOLS.letterWhenHard` | Egy nehéz pillanatban |  |
| `TOOLS.letterWhenMilestone` | A következő mérföldkőnél |  |
| `TOOLS.letterSave` | Elteszem |  |
| `TOOLS.letterSaved` | A levelet elraktam. |  |
| `TOOLS.letterOpen` | Levél tőled |  |
| `TOOLS.letterEmpty` | Még nem írtál levelet. |  |
| `TOOLS.breatheTitle` | Lélegezz egyet |  |
| `TOOLS.breatheText` | Hagyd, hogy a folt vezessen: nőjön, ahogy belélegzel, és zsugorodjon, ahogy kifújod. |  |
| `TOOLS.reasonsTitle` | Az okaim |  |
| `TOOLS.reasonsText` | Miért csinálod? Ezek a krízisoldalon és a hullámlovaglásnál is megjelennek. |  |
| `TOOLS.reasonAdd` | Új ok |  |
| `TOOLS.reasonLabel` | Egy ok, ami fontos neked |  |
| `TOOLS.reasonsEmpty` | Még nincs felírva ok. Egy mondat is elég. |  |
| `TOOLS.reminderTitle` | Emlékeztető |  |

## Beállítások

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `SETTINGS_PAGE.title` | Beállítások |  |
| `SETTINGS_PAGE.profile` | Rólad |  |
| `SETTINGS_PAGE.nickname` | Becenév |  |
| `SETTINGS_PAGE.substances` | Mitől maradnál távol |  |
| `SETTINGS_PAGE.goal` | Célod (nap) |  |
| `SETTINGS_PAGE.triggers` | Nehéz helyzetek |  |
| `SETTINGS_PAGE.appearance` | Megjelenés |  |
| `SETTINGS_PAGE.theme` | Téma |  |
| `SETTINGS_PAGE.themeOptions.system` | Rendszer szerint |  |
| `SETTINGS_PAGE.themeOptions.light` | Világos |  |
| `SETTINGS_PAGE.themeOptions.dark` | Sötét |  |
| `SETTINGS_PAGE.motion` | Kevesebb mozgás |  |
| `SETTINGS_PAGE.motionHint` | Kikapcsolja az animációkat és a konfettit. |  |
| `SETTINGS_PAGE.update` | Frissítés |  |
| `SETTINGS_PAGE.version` | Verzió: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETTINGS_PAGE.updateCheck` | Frissítés keresése |  |
| `SETTINGS_PAGE.updateChecking` | Keresem… |  |
| `SETTINGS_PAGE.updateNone` | A legújabb verziót használod. |  |
| `SETTINGS_PAGE.updateReady` | Van új verzió. Alkalmazom, amint befejezted, amit épp csinálsz. |  |
| `SETTINGS_PAGE.updateApply` | Frissítés most |  |
| `SETTINGS_PAGE.updateApkText` | Az app indításkor és naponta legfeljebb egyszer megnézi a GitHubon, van-e újabb Android-verzió (egyetlen névtelen kérés; a GitHub csak az IP-címet és az időpontot látja, a naplódból semmi nem megy el). Ha van, értesítést kapsz; az Android a telepítést mindig tőled kéri jóvá, és az új verzió a régi fölé települ, az adataid megmaradnak. |  |
| `SETTINGS_PAGE.updateApkError` | Most nem sikerült megnézni (nincs hálózat?). Később újra megpróbálom. |  |
| `SETTINGS_PAGE.updateApkReady` | Új Android-verzió érhető el. |  |
| `SETTINGS_PAGE.updateApkDownload` | Új verzió letöltése |  |
| `SETTINGS_PAGE.updateApkAuto` | Új verzió keresése naponta egyszer az interneten |  |
| `SETTINGS_PAGE.updateApkAutoHint` | Kikapcsolva az app semmilyen hálózati kérést nem küld, és csak a gombbal keres. |  |
| `SETTINGS_PAGE.updateApkLink` | Letöltési oldal megnyitása |  |
| `SETTINGS_PAGE.updateUnsupported` | Ez a böngésző nem támogatja az automatikus frissítést. |  |
| `SETTINGS_PAGE.language` | Nyelv / Language |  |
| `SETTINGS_PAGE.languageHint` | Váltáskor az alkalmazás újratölt. Az adataid nem változnak. |  |
| `SETTINGS_PAGE.country` | Ország (segélyvonalak) |  |
| `SETTINGS_PAGE.currency` | Pénznem |  |
| `SETTINGS_PAGE.currencyHint` | Csak a kijelzést érinti, az összegeket nem váltja át. Váltáskor az alkalmazás újratölt. |  |
| `SETTINGS_PAGE.feedback` | Visszajelzés |  |
| `SETTINGS_PAGE.feedbackText` | Hibát találtál, vagy van ötleted? Egy előre kitöltött GitHub-űrlapot nyitunk meg. Az app magától semmit sem küld el, és ne írj bele személyes adatot. |  |
| `SETTINGS_PAGE.feedbackButton` | Visszajelzés küldése |  |
| `T.storageVolatile` | Figyelem: a böngésző nem engedi a tartós tárolást (pl. privát mód), ezért az adataid a lap bezárásakor elvesznek. Készíts titkosított mentést. |  |
| `T.deleteEntry` | Bejegyzés törlése |  |
| `T.deleteEntryConfirm` | Biztosan törlöd ezt a bejegyzést? |  |
| `T.exportEncrypted` | Titkosított mentés letöltése |  |
| `T.exportEncryptedInfo` | Csak a PIN-kódoddal vagy a helyreállító kódoddal nyitható meg. Ezzel viheted át a naplódat másik eszközre. |  |
| `T.exportJson` | Export JSON-ként (nem titkosított) |  |
| `T.exportCsv` | Export CSV-ként (táblázatkezelőhöz, nem titkosított) |  |
| `T.exportPlainWarning` | Ez a fájl NEM titkosított: aki hozzáfér, elolvashatja. Biztosan letöltöd? |  |
| `T.importEncrypted` | Titkosított mentés visszaállítása |  |
| `T.importEncryptedInfo` | A jelenlegi napló helyére kerül. A mentés PIN-kódja kell hozzá, vagy ha azt elfelejtetted, a helyreállító kódod (ekkor új PIN-kódot adsz meg). |  |
| `T.deleteAll` | Minden adat törlése |  |
| `T.deleteAllInfo` | Egy lépésben, véglegesen töröl mindent erről az eszközről. Nem visszavonható. |  |
| `T.deleteAllConfirm` | Biztosan törölsz minden adatot erről az eszközről? Ez nem visszavonható. |  |
| `T.deleted` | Minden adat törölve. |  |

## Zárolás és helyreállítás

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.pinLabel` | Válassz PIN-kódot (legalább 4 számjegy) vagy jelszót |  |
| `T.pinConfirmLabel` | PIN-kód még egyszer |  |
| `T.pinHint` | Ezzel titkosítjuk a naplódat. Egy hosszabb jelszó (pl. három szó) sokkal erősebb védelmet ad, mint egy rövid számsor. Mi sem tudjuk visszaállítani, ezért kapsz majd egy helyreállító kódot. |  |
| `T.pinMismatch` | A két PIN-kód nem egyezik. |  |
| `T.recoveryTitle` | A helyreállító kódod |  |
| `T.recoveryIntro` | Ha elfelejted a PIN-kódodat, ezzel a kóddal érheted el újra a naplódat. Írd le, és tartsd biztonságos helyen. Csak most látod. |  |
| `T.recoveryConfirm` | Leírtam, biztonságban van |  |
| `T.lockTitle` | Üdv újra |  |
| `T.unlockButton` | Megnyitás |  |
| `T.forgotPin` | Elfelejtettem a PIN-kódot |  |
| `T.recoveryCodeLabel` | Helyreállító kód |  |
| `T.lockNow` | Zárolás |  |

## Előzetes verzió tájékoztató

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `PREVIEW.badge` | Előzetes verzió |  |
| `PREVIEW.text` | Ez az alkalmazás még fejlesztés alatt áll, és a tartalmát szakember még nem lektorálta. Nem orvosi eszköz, és nem helyettesíti a szakember segítségét. Ha nehéz, a sárga gomb mindig elérhető. |  |
| `PREVIEW.feedback` | Visszajelzés küldése |  |

## Frissítés

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `UPDATE.apkBanner` | Új Android-verzió érhető el. |  |
| `UPDATE.apkApply` | Letöltés |  |
| `UPDATE.banner` | Új verzió érhető el. |  |
| `UPDATE.apply` | Frissítés |  |
| `UPDATE.later` | Később |  |
| `UPDATE.applied` | Frissítve. Jó látni újra! |  |
| `UPDATE.toast` | Új verzió töltődött le. A következő zároláskor automatikusan frissítek. |  |

## Választható listák (hangulat, helyzet, megküzdés)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `PRESETS.TRIGGERS.stress` | Stressz (munka, tanulás) |  |
| `PRESETS.TRIGGERS.weekend` | Hétvége |  |
| `PRESETS.TRIGGERS.loneliness` | Magány |  |
| `PRESETS.TRIGGERS.boredom` | Unalom |  |
| `PRESETS.TRIGGERS.conflict` | Konfliktus, vita |  |
| `PRESETS.TRIGGERS.social` | Társasági esemény, buli |  |
| `PRESETS.TRIGGERS.social-pressure` | Társas nyomás, kínálgatás |  |
| `PRESETS.TRIGGERS.routine` | Megszokás, rutin (pl. munka után) |  |
| `PRESETS.TRIGGERS.celebration` | Ünneplés, jó hír |  |
| `PRESETS.TRIGGERS.fatigue` | Fáradtság, kialvatlanság |  |
| `PRESETS.TRIGGERS.money` | Anyagi gondok |  |
| `PRESETS.TRIGGERS.place` | Ismerős hely |  |
| `PRESETS.TRIGGERS.people` | Bizonyos emberek |  |
| `PRESETS.TRIGGERS.anger` | Düh, csalódottság |  |
| `PRESETS.TRIGGERS.evening` | Esti, éjszakai órák |  |
| `PRESETS.COPING.walk` | Sétáltam, mozogtam |  |
| `PRESETS.COPING.called` | Felhívtam valakit |  |
| `PRESETS.COPING.breathing` | Légzőgyakorlat |  |
| `PRESETS.COPING.drink-other` | Ittam/ettem valami mást |  |
| `PRESETS.COPING.left` | Kiléptem a helyzetből |  |
| `PRESETS.COPING.waited` | Kivártam, amíg elmúlik |  |
| `PRESETS.COPING.wrote` | Leírtam, mit érzek |  |
| `PRESETS.COPING.shower` | Zuhany, hideg víz |  |
| `PRESETS.OUTCOMES.coped` | Megbirkóztam vele |  |
| `PRESETS.OUTCOMES.hard` | Nehéz volt, de túl vagyok rajta |  |
| `PRESETS.OUTCOMES.ongoing` | Még tart |  |
| `PRESETS.MOODS.excited` | Izgatott |  |
| `PRESETS.MOODS.cheerful` | Vidám |  |
| `PRESETS.MOODS.grateful` | Hálás |  |
| `PRESETS.MOODS.energetic` | Energikus |  |
| `PRESETS.MOODS.sensitive` | Érzékeny |  |
| `PRESETS.MOODS.confused` | Zavarodott |  |
| `PRESETS.MOODS.bored` | Unatkozó |  |
| `PRESETS.MOODS.stressed` | Stresszes |  |
| `PRESETS.MOODS.angry` | Dühös |  |
| `PRESETS.MOODS.unsure` | Bizonytalan |  |
| `PRESETS.MOODS.hurt` | Sérült |  |
| `PRESETS.MOODS.guilty` | Bűntudatos |  |
| `PRESETS.SUBSTANCES.alcohol` | Alkohol |  |
| `PRESETS.SUBSTANCES.tobacco` | Dohányzás |  |
| `PRESETS.SUBSTANCES.gambling` | Szerencsejáték |  |
| `PRESETS.SUBSTANCES.drugs` | Drog |  |
| `PRESETS.SUBSTANCES.pills` | Gyógyszer-visszaélés |  |
| `PRESETS.SUBSTANCES.other` | Egyéb |  |
| `PRESETS.SLEEP_LEVELS.1` | Nagyon rossz |  |
| `PRESETS.SLEEP_LEVELS.2` | Rossz |  |
| `PRESETS.SLEEP_LEVELS.3` | Közepes |  |
| `PRESETS.SLEEP_LEVELS.4` | Jó |  |
| `PRESETS.SLEEP_LEVELS.5` | Nagyon jó |  |
| `PRESETS.CRAVING_LEVELS.0` | Nincs |  |
| `PRESETS.CRAVING_LEVELS.1` | Enyhe |  |
| `PRESETS.CRAVING_LEVELS.2` | Közepes |  |
| `PRESETS.CRAVING_LEVELS.3` | Erős |  |
| `PRESETS.QUICK_TEMPLATES.q-tired` | Fáradtság / Kimerültség |  |
| `PRESETS.QUICK_TEMPLATES.q-stress` | Stresszes nap |  |
| `PRESETS.QUICK_TEMPLATES.q-social` | Társasági nyomás |  |
| `PRESETS.QUICK_TEMPLATES.q-evening` | Esti szokás |  |
| `PRESETS.QUICK_TEMPLATES.q-lonely` | Magány |  |
| `PRESETS.QUICK_TEMPLATES.q-calm` | Nyugodt / Kiegyensúlyozott |  |
| `PRESETS.QUICK_TEMPLATES.q-hopeful` | Reménykedő |  |
| `PRESETS.QUICK_TEMPLATES.q-anxious` | Szorongó |  |

## Képernyőolvasó-szövegek

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `A11Y.mainNav` | Fő navigáció |  |
| `A11Y.quickAdd` | Gyors rögzítés |  |
| `A11Y.avatar` | Hangulatod és a Beállítások |  |
| `A11Y.moodGroup` | Hogy vagy ma? |  |
| `A11Y.skipLink` | Ugrás a tartalomra |  |

## Általános felület

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `MISC.loading` | Betöltés… |  |
| `MISC.details` | Részletek |  |
| `MISC.savingsTab` | Megtakarítás |  |
| `MISC.remindersOn` | Emlékeztető bekapcsolva. |  |
| `MISC.remindersOff` | Emlékeztető kikapcsolva. |  |
| `MISC.entryDeleted` | Bejegyzés törölve. |  |
| `MISC.backupFile` | Mentésfájl |  |
| `MISC.backupPin` | A mentés PIN-kódja |  |
| `MISC.haveBackup` | Van már mentésem másik eszközről |  |
| `MISC.pinField` | PIN-kód |  |
| `MISC.pinChangedKept` | A PIN-kód módosult. A naplód megmaradt. |  |
| `MISC.pinChanged` | A PIN-kód módosult. |  |
| `MISC.previousRestored` | A korábbi mentés visszaállítva. |  |
| `MISC.backupRestored` | A mentés visszaállítva. |  |
| `MISC.importConfirm` | A jelenlegi napló helyére a mentés kerül. Folytatod? |  |
| `MISC.importFileLabel` | Mentésfájl (titkosított mentés vagy JSON-export) |  |
| `MISC.importPinLabel` | A mentés PIN-kódja (titkosított mentésnél) |  |
| `MISC.contentVersion` | Tartalom verziója: 7 · 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.goalPlaceholder` | pl. új bicikli |  |
| `MISC.goalAmountInvalid` | Adj meg egy pozitív összeget. |  |
| `MISC.costRangeInvalid` | A napi költség 0 és 1 000 000 Ft közötti szám legyen. |  |
| `MISC.entry.sleep` | Alvás |  |
| `MISC.entry.craving` | Sóvárgás |  |
| `MISC.entry.situation` | Helyzet |  |
| `MISC.entry.intensity` | Erősség |  |
| `MISC.entry.coping` | Segített |  |
| `MISC.entry.lesson` | Tanulság |  |
| `MISC.entry.intention` | Amire figyelek |  |
| `MISC.trendAria` | 7: 7 napos alakulás | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.badgeLocked` |  (még nem érted el) |  |
| `MISC.dayWord` | nap |  |
| `MISC.urgeTimer` | 7 másodperc van hátra | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.urgeTry` | Próbáld ki |  |
| `MISC.reasonDelete` | Törlés: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.notSupportedNotifications` | Ez a böngésző nem támogatja az értesítéseket. |  |
| `MISC.file.unreadable` | A fájl nem olvasható (sérült vagy nem megfelelő formátumú). |  |
| `MISC.export.types.checkin` | Napi bejelentkezés |  |
| `MISC.export.types.trigger` | Nehéz pillanat |  |
| `MISC.export.types.slip` | Megcsúszás, új szakasz |  |
| `MISC.export.types.note` | Jegyzet |  |
| `MISC.export.types.urge` | Sóvárgás-túlélő |  |
| `MISC.export.types.challenge` | Napi kihívás |  |
| `MISC.export.types.gratitude` | Hála |  |
| `MISC.export.types.letter` | Levél |  |
| `MISC.export.header.0` | Dátum |  |
| `MISC.export.header.1` | Időpont |  |
| `MISC.export.header.2` | Típus |  |
| `MISC.export.header.3` | Hangulat |  |
| `MISC.export.header.4` | Alvás |  |
| `MISC.export.header.5` | Sóvárgás |  |
| `MISC.export.header.6` | Kiváltó helyzetek |  |
| `MISC.export.header.7` | Erősség |  |
| `MISC.export.header.8` | Megküzdés |  |
| `MISC.export.header.9` | Kimenet |  |
| `MISC.export.header.10` | Tanulság |  |
| `MISC.export.header.11` | Jegyzet |  |
| `MISC.export.header.12` | Részletek |  |
| `MISC.export.urge` | 7 perc, elmúlt | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.export.letterMilestone` | mérföldkőnél (7 nap) | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.export.letterHard` | nehéz pillanatban |  |
| `NAV_TABS.home.label` | Főoldal |  |
| `NAV_TABS.home.title` | Főoldal |  |
| `NAV_TABS.timeline.label` | Idővonal |  |
| `NAV_TABS.timeline.title` | Idővonal |  |
| `NAV_TABS.savings.label` | Megtakarítás |  |
| `NAV_TABS.savings.title` | Megtakarítás |  |
| `NAV_TABS.tools.label` | Eszközök |  |
| `NAV_TABS.tools.title` | Eszközök |  |
| `NAV_TABS.settings.label` | Beállítások |  |
| `NAV_TABS.settings.title` | Beállítások |  |
| `T.appName` | Józanság-számláló |  |
| `T.secretStrength.weak` | Alapszintű védelem: egy ellopott mentésfájlból percek alatt kitalálható. Hosszabb jelszó ajánlott. |  |
| `T.secretStrength.fair` | Közepes védelem. |  |
| `T.secretStrength.strong` | Erős védelem. |  |
| `T.startDateLabel` | Mikor kezdődött az utad? |  |
| `T.dailyCostLabel` | Napi költség, amit így megspórolsz (Ft, nem kötelező) |  |
| `T.dailyCostHint` | Becslés is elég. Bármikor módosíthatod. |  |
| `T.createButton` | Kezdjük |  |
| `T.copy` | Másolás |  |
| `T.copied` | Kimásolva |  |
| `T.newPinLabel` | Új PIN-kód |  |
| `T.recoverButton` | Visszaállítás |  |
| `T.resetTitle` | Nincs meg sem a PIN-kód, sem a helyreállító kód |  |
| `T.resetInfo` | A naplód úgy van titkosítva, hogy rajtad kívül senki – mi sem – tudja kinyitni. Ezért PIN-kód és helyreállító kód nélkül a bejegyzések nem állíthatók vissza. Ha szeretnéd, újrakezdheted: ez végleg töröl mindent erről az eszközről. |  |
| `T.resetBackupHint` | Ha van titkosított mentésfájlod, és emlékszel a mentés PIN-kódjára, törlés után azt visszaállíthatod. |  |
| `T.resetConfirmLabel` | A megerősítéshez írd be nagybetűkkel: TÖRLÉS |  |
| `T.resetWord` | TÖRLÉS |  |
| `T.resetButton` | Minden adat végleges törlése és újrakezdés |  |
| `T.resetWordMismatch` | A megerősítő szó nem egyezik. Semmi sem törlődött. |  |
| `T.corruptedText` | A mentett napló sérültnek tűnik. Van egy korábbi, ép mentés. Visszaállítsuk? A legutóbbi módosítás elveszhet. |  |
| `T.restorePrevious` | Korábbi mentés visszaállítása |  |
| `T.navHome` | Kezdőlap |  |
| `T.navJournal` | Napló |  |
| `T.navLog` | Rögzítés |  |
| `T.navSettings` | Beállítások |  |
| `T.currentPhase` | Jelenlegi szakasz |  |
| `T.currentPhaseSince` | 7 óta | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.days` | 7 nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.longestPhase` | Leghosszabb szakasz |  |
| `T.saved` | Megspórolt pénz |  |
| `T.savingsCurrentPhase` | Ebben a szakaszban: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsPerMonth` | Mostani ütemben havonta kb. 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsAchieved` | Ebből már kijönne: |  |
| `T.savingsNext` | Következő ötlet: 7 – még kb. 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsAllMilestones` | Minden ötletet túlléptél. Te döntöd el, mire fordítod. |  |
| `T.savingsEstimate` | Becslés a megadott napi költség alapján; az árak tájékoztató jellegűek. |  |
| `T.savingsChanged` | A napi költség időközben változott: minden napot az akkor érvényes összeggel számolunk. |  |
| `T.savingsGoal` | Saját célod |  |
| `T.savingsGoalRemaining` | Még 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsGoalReached` | Megvan rá a pénz. Megérdemled. |  |
| `T.savingsPhase` | Megspórolva ebben a szakaszban: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costTitle` | Napi költség |  |
| `T.costNow` | Jelenleg: 7 / nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costNewLabel` | Új napi összeg (Ft) |  |
| `T.costModeLegend` | Mire vonatkozik a változás? |  |
| `T.costModeFrom` | Mostantól változott – a korábbi napok a régi összeggel maradnak |  |
| `T.costModeAll` | Visszamenőleg javítom – eddig rosszul becsültem |  |
| `T.costFromLabel` | Ettől a naptól |  |
| `T.costSave` | Összeg mentése |  |
| `T.costHistoryTitle` | Összegek időrendben |  |
| `T.costHistoryRow` | 7: 2026. október 1. / nap | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costSavedFrom` | Elmentve. A korábbi napok értéke nem változott. |  |
| `T.costSavedAll` | Elmentve. A teljes időszakot az új összeggel számoljuk. |  |
| `T.goalTitle` | Megtakarítási cél (nem kötelező) |  |
| `T.goalLabelLabel` | Mire gyűjtesz? |  |
| `T.goalAmountLabel` | Cél összege (Ft) |  |
| `T.goalSave` | Cél mentése |  |
| `T.goalClear` | Cél törlése |  |
| `T.savedSetup` | Add meg a napi költséget a beállításokban, és itt láthatod a megtakarításod. |  |
| `T.coped` | Megküzdött nehéz pillanatok |  |
| `T.actionCheckin` | Napi bejelentkezés |  |
| `T.actionTrigger` | Nehéz pillanat rögzítése |  |
| `T.actionSlip` | Megcsúsztam |  |
| `T.actionNote` | Jegyzet |  |
| `T.save` | Mentés |  |
| `T.cancel` | Mégse |  |
| `T.saved_ok` | Elmentve. |  |
| `T.intensityLabel` | Mennyire volt erős? (1–5) |  |
| `T.outcomeLabel` | Hogyan alakult? |  |
| `T.journalTitle` | Napló |  |
| `T.journalEmpty` | Még nincs bejegyzés. Az első napi bejelentkezéssel indul a naplód. |  |
| `T.lessonsTitle` | Amit magaddal viszel |  |
| `T.settingsTitle` | Beállítások |  |
| `T.savingsSection` | Megtakarítás |  |
| `T.journeySection` | Az utad |  |
| `T.journeyStartLabel` | Az út kezdete |  |
| `T.remindersSection` | Emlékeztetők |  |
| `T.remindersLabel` | Napi, kíméletes emlékeztető |  |
| `T.remindersTimeLabel` | Időpont |  |
| `T.remindersInfo` | Az értesítés szövege semleges („Egy perc magadra”), így a zárolt képernyőn sem árul el semmit. Szerver nélkül működik, ezért nem minden böngésző támogatja a pontos időzítést; ilyenkor az alkalmazás megnyitásakor kapsz egy finom jelzést. |  |
| `T.remindersDenied` | A böngésző nem engedélyezte az értesítéseket. Ezt a böngésző beállításaiban módosíthatod. |  |
| `T.securitySection` | Biztonság |  |
| `T.autoLockLabel` | Automatikus zárolás ennyi perc inaktivitás után |  |
| `T.changePin` | PIN-kód módosítása |  |
| `T.oldPinLabel` | Jelenlegi PIN-kód |  |
| `T.newRecovery` | Új helyreállító kód készítése |  |
| `T.newRecoveryInfo` | A régi kód ezzel érvényét veszti. |  |
| `T.dataSection` | Adataid |  |
| `T.aboutSection` | Rólunk és adatvédelem |  |
| `T.errGeneric` | Valami nem sikerült. Az adataid biztonságban vannak; próbáld újra. |  |
| `T.errWrongPin` | Ez nem a megfelelő PIN-kód. |  |
| `UX.info` | Tudnivalók |  |
| `UX.gotIt` | Értem |  |
| `UX.later` | Később |  |
| `UX.dontAsk` | Ne kérdezd újra |  |
| `UX.close` | Bezár |  |
| `UX.helpLogin` | Segítség a belépéshez |  |
| `UX.showSecret` | Megjelenítés |  |
| `UX.hideSecret` | Elrejtés |  |
| `UX.erase` | Törlés |  |
| `UX.pinPad` | PIN-billentyűzet |  |
| `UX.privacyTitle` | Adatvédelem |  |
| `UX.pinInfoTitle` | Mire jó a PIN-kód? |  |
| `UX.savingsInfoTitle` | A számítás |  |
| `UX.goalInfoTitle` | A cél |  |
| `UX.backupDueTitle` | Mentsd el a naplód |  |
| `UX.backupDueText` | Régen volt titkosított mentés. Ha elveszne vagy elromlana a telefon, a napló is odalenne. Egy mentés fél perc. |  |
| `UX.backupNow` | Mentés most |  |
| `UX.copyBackup` | Titkosított mentés másolása |  |
| `UX.copyBackupDone` | Kimásolva. Illeszd be egy biztonságos helyre (pl. jegyzet vagy e-mail magadnak). |  |
| `UX.pasteBackup` | Vagy illeszd be a mentés szövegét |  |
| `UX.pasteBackupPlaceholder` | A kimásolt mentés szövege |  |
| `UX.trustedTitle` | Megbízható személy |  |
| `UX.trustedName` | Név |  |
| `UX.trustedPhone` | Telefonszám |  |
| `UX.trustedSave` | Mentés |  |
| `UX.trustedClear` | Törlés |  |
| `UX.trustedCall` | Hívd: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.trustedInvalid` | Adj meg egy érvényes telefonszámot (csak számjegyek, + és szóköz). |  |
| `UX.trustedCrisis` | Valaki, akiben megbízol |  |
| `UX.quickPin` | Gyors PIN-billentyűzet |  |
| `UX.quickPinInfo` | A zárolóképernyő számbillentyűzetet mutat, és az utolsó számjegy után magától nyit. Ehhez az eszközön titkosítatlanul eltárolódik, hogy hány számjegyű a PIN-ed (maga a PIN nem). Kikapcsolva a hossza sem látszik. |  |
| `UX.moreSettings` | Továbbiak |  |
| `UX.storageErrorTitle` | A napló most nem érhető el |  |
| `UX.storageErrorText` | A telefon tárhelye most nem válaszol, ezért nem nyitjuk meg és nem is írjuk felül a naplódat. Próbáld újra egy kicsit később. A segélyvonalak addig is elérhetők. |  |
| `UX.retry` | Újrapróbálom |  |
| `UX.clipboardWarning` | Kimásolva. Ha elmentetted (pl. jelszókezelőbe), másolj ki valami mást, hogy a kód ne maradjon a vágólapon. |  |
| `UX.backupDoneTitle` | A mentés elkészült és ellenőrizve |  |
| `UX.backupSavedDevice` | Elmentve a választott helyre, „7” néven. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.backupSavedDownload` | Letöltve „7” néven (általában a Letöltések mappába). | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.backupEncryptedNote` | A fájl titkosított: csak a PIN-kódoddal vagy a helyreállító kódoddal nyitható meg. Visszaolvastuk és ellenőriztük, hogy ép. |  |
| `UX.backupElsewhere` | Tipp: tarts egy példányt egy másik helyen is (pl. saját e-mail vagy felhő), hogy a telefon elvesztése után is meglegyen. |  |
| `UX.backupShare` | Megosztás vagy küldés máshová |  |
| `UX.backupCancelled` | A mentés megszakadt, nem készült fájl. |  |
| `UX.plainSavedNote` | Figyelem: ez a fájl NEM titkosított. Bárki elolvashatja, aki hozzáfér; ne oszd meg, és töröld, ha már nem kell. |  |
| `UX.restoreForgotPin` | Elfelejtettem a PIN-kódot: visszaállítás helyreállító kóddal |  |
| `UX.restoreNewPin` | Új PIN-kód ehhez az eszközhöz |  |
| `UX.restoreNewPin2` | Új PIN-kód még egyszer |  |
| `UX.phoneChangeTitle` | Telefoncsere |  |
| `UX.phoneChangeSteps.0` | A régi telefonon: Beállítások → Adatok → „Titkosított mentés”. Válassz helyet (pl. Drive vagy e-mail magadnak), vagy oszd meg. |  |
| `UX.phoneChangeSteps.1` | Az új telefonra telepítsd az alkalmazást (ugyanarról a helyről), és nyisd meg. |  |
| `UX.phoneChangeSteps.2` | Az első képernyőn: „Van már mentésem másik eszközről” → válaszd ki a fájlt, és add meg a PIN-kódodat. |  |
| `UX.phoneChangeSteps.3` | Ha a PIN-kódot elfelejtetted, a helyreállító kóddal is visszaállíthatod; ekkor új PIN-kódot adsz meg. |  |
| `UX.phoneChangeSteps.4` | Ha minden megvan az új telefonon, a régin a Beállítások → „Minden adat törlése” gombbal törölheted a naplót. |  |
| `UX.secureScreen` | Képernyőkép-védelem |  |
| `UX.secureScreenInfo` | Bekapcsolva a telefon nem enged képernyőképet készíteni az alkalmazásról, és a legutóbbi alkalmazások listájában sem látszik a tartalma. Hátrány: képernyőképet sem tudsz küldeni magadnak vagy a segítődnek. |  |
| `UX.debugSignedWarning` | Ez a telepítés ideiglenes (fejlesztői) kulccsal készült. Egy későbbi kiadás nem települ fölé frissítésként: csere előtt készíts titkosított mentést, és a régi alkalmazás eltávolítása után azzal állítsd vissza a naplót. |  |
| `UX.helplinesVerified` | Elérhetőségek utoljára ellenőrizve: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.offlineNote` | A próbálkozás-korlát csak a képernyőn beírt PIN-t védi. Aki a telefon tárolt adatait vagy egy mentésfájlt megszerzi, gépi erővel próbálgathat, ezért egy hosszabb jelszó sokkal biztonságosabb. |  |
| `UX.welcomeInfo` | Mi ez az alkalmazás? |  |
| `UX.welcomeInfoText` | Pár kérdéssel összerakjuk, hogy neked szóljon. Bármikor kihagyhatsz egy kérdést, és később mindent átírhatsz. Ha kilépsz a kérdések közben, elölről kezdjük, és addig semmi sem mentődik el. |  |
