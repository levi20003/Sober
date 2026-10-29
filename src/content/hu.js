// All user-facing copy and crisis content in one place, so it can be reviewed
// and signed off by an addictologist/psychologist (see docs/CLINICAL-REVIEW.md).
//
// Language rules (enforced by tests/copy.test.js):
//  - no blame, shame or punishment words; a slip is "megcsúszás", followed by an "új szakasz"
//  - nothing is ever "reset" or "lost"
//  - never promise a cure: the app "segít követni és támogatni"
//  - no alcohol imagery (glass, bottle) and no identity labels

export const CONTENT_VERSION = '2026-10-26-draft';
export const REVIEW_STATUS = 'Szakmai lektorálásra vár'; // set to the reviewer + date after sign-off

// Helplines. `role: 'emergency'` is shown as a separate banner above the talk lines.
// `verification` records HOW each number was checked (see docs/SAFETY.md):
//   'official'          – confirmed on the operator's own or an official source
//   'multiple-secondary'– several independent secondary sources agree; a test call is
//                         REQUIRED before public launch (tracked in docs/CLINICAL-REVIEW.md)
// Order matters: the first talk line is the primary (highlighted) one.
export const HELPLINES = [
  {
    id: 'emergency',
    role: 'emergency',
    name: 'Általános segélyhívó',
    number: '112',
    tel: '112',
    hours: 'Éjjel-nappal, ingyenes',
    when: 'Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell (pl. súlyos elvonási tünetek, görcsroham, zavartság).',
    verified: '2026-10-26',
    verification: 'official',
  },
  {
    id: 'lesz',
    role: 'talk',
    name: 'S.O.S. Lelki Elsősegély Telefonszolgálat',
    number: '116-123',
    tel: '116123',
    hours: 'Éjjel-nappal, belföldről ingyenes, névtelenül hívható',
    when: 'Ha beszélgetni szeretnél valakivel, aki meghallgat, bármilyen nehéz pillanatban.',
    verified: '2026-10-29',
    verification: 'official',
  },
  {
    id: 'drog-stop',
    role: 'talk',
    name: 'Drog Stop segélyvonal',
    number: '06-80-505-678',
    tel: '0680505678',
    hours: 'Ingyenesen hívható',
    when: 'Ha szerhasználattal kapcsolatban szeretnél beszélni valakivel – magad vagy egy hozzátartozód miatt.',
    verified: '2026-10-29',
    verification: 'multiple-secondary',
  },
  {
    id: 'kek-vonal',
    role: 'talk',
    name: 'Kék Vonal (gyerekeknek és fiataloknak)',
    number: '116-111',
    tel: '116111',
    hours: 'Ingyenes, nem kell megmondanod a neved',
    when: 'Ha fiatal vagy (24 év alatt), és jól jönne egy beszélgetés.',
    verified: '2026-10-26',
    verification: 'official',
  },
];

// Breathing patterns. Each step has an explicit `kind` (in | hold | out) that drives
// the animation, so reviewers can reword labels freely without breaking anything.
export const BREATHING = [
  {
    id: 'slow-exhale',
    name: 'Hosszú kilégzés',
    description: 'A kilégzés legyen hosszabb, mint a belégzés. Ez segíthet lecsendesíteni a testet.',
    steps: [
      { kind: 'in', label: 'Belégzés az orron', seconds: 4 },
      { kind: 'out', label: 'Lassú kilégzés a szádon', seconds: 6 },
    ],
    rounds: 6,
  },
  {
    id: 'box',
    name: 'Négyzetlégzés',
    description: 'Négy egyforma szakasz. Ha szédülsz, lélegezz egyszerűen, természetesen.',
    steps: [
      { kind: 'in', label: 'Belégzés', seconds: 4 },
      { kind: 'hold', label: 'Benntartás', seconds: 4 },
      { kind: 'out', label: 'Kilégzés', seconds: 4 },
      { kind: 'hold', label: 'Szünet', seconds: 4 },
    ],
    rounds: 4,
  },
  {
    id: '4-7-8',
    name: '4-7-8 légzés',
    description: 'Belégzés 4, benntartás 7, kilégzés 8 ütemre. Ha a benntartás kellemetlen, vagy szédülsz, válts a „Hosszú kilégzés” gyakorlatra.',
    steps: [
      { kind: 'in', label: 'Belégzés az orron', seconds: 4 },
      { kind: 'hold', label: 'Benntartás', seconds: 7 },
      { kind: 'out', label: 'Lassú kilégzés a szádon', seconds: 8 },
    ],
    rounds: 4,
  },
];

export const GROUNDING = {
  title: '5-4-3-2-1 – visszatérés a jelenbe',
  steps: [
    'Nevezz meg 5 dolgot, amit látsz.',
    'Nevezz meg 4 dolgot, amit meg tudsz érinteni.',
    'Nevezz meg 3 hangot, amit hallasz.',
    'Nevezz meg 2 illatot, amit érzel (vagy szeretsz).',
    'Nevezz meg 1 dolgot, amiért most hálás lehetsz.',
  ],
};

export const URGE_WAVE = {
  title: 'A sóvárgás olyan, mint egy hullám',
  text: 'Felerősödik, tetőzik, majd elcsendesedik. Sokszor 15–30 perc alatt alábbhagy. Nem kell semmit tenned vele, csak kivárni. Figyeld meg, hol érzed a testedben, és lélegezz.',
};

export const CRISIS_STEPS = [
  'Ha teheted, menj egy biztonságosabb helyre, vagy távolodj el a helyzettől.',
  'Igyál egy kis vizet, vagy egyél valamit.',
  'Írj vagy telefonálj valakinek, akiben megbízol.',
  'Halaszd el a döntést 20 percre. Utána nézd meg újra, hogy vagy.',
];

export const RISK_MESSAGES = {
  personal: {
    title: 'Ez az időszak korábban nehéz volt neked',
    text: 'A naplód alapján ilyenkor gyakrabban jönnek nehéz pillanatok. Jó, hogy itt vagy. Van terved a következő órára?',
  },
  lateNight: {
    title: 'Késő van',
    text: 'Éjszaka minden nehezebbnek tűnhet. A fáradtság felerősíti a sóvárgást. A 116-123 most is hívható.',
  },
  weekend: {
    title: 'Hétvége',
    text: 'A hétvégék sokaknak próbára tevők. Segíthet egy előre megtervezett program vagy egy rövid séta.',
  },
};

// Tangible, alcohol-free ideas for what the saved money could become. Prices are
// rounded, approximate 2026 Hungarian figures and are shown with "kb." – they are
// ideas, not targets. Must stay ascending by amount (tested).
export const SAVINGS_MILESTONES = [
  { id: 'coffee', label: 'Egy kávé egy baráttal', amountHuf: 1_500 },
  { id: 'cinema', label: 'Egy mozijegy', amountHuf: 3_500 },
  { id: 'book', label: 'Egy jó könyv', amountHuf: 6_000 },
  { id: 'gym', label: 'Egy hónap edzőterem', amountHuf: 15_000 },
  { id: 'dinner', label: 'Egy vacsora kettesben', amountHuf: 25_000 },
  { id: 'shoes', label: 'Új futócipő', amountHuf: 45_000 },
  { id: 'trip', label: 'Egy hétvégi kirándulás', amountHuf: 90_000 },
  { id: 'wellness', label: 'Egy hosszú hétvége wellness szállodában', amountHuf: 180_000 },
  { id: 'holiday', label: 'Egy nyaralás', amountHuf: 400_000 },
  { id: 'million', label: 'Egymillió forint – te döntöd el, mire', amountHuf: 1_000_000 },
];

export const NOTIFICATION = {
  // Deliberately neutral: lock screens are visible to others.
  title: 'Egy perc magadra',
  body: 'Hogy telik a napod? Ha van kedved, nézz be.',
  actionOpen: 'Megnyitás',
  actionOff: 'Emlékeztetők kikapcsolása',
};

export const T = {
  appName: 'Józanság-számláló',
  helpButton: 'Most segítségre van szükségem',
  helpButtonShort: 'Segítség most',
  disclaimer: 'A Józanság-számláló segít követni és támogatni a józanságod útját. Nem orvosi eszköz, és nem helyettesíti a szakember segítségét.',
  privacyPromise: 'Minden adatod kizárólag ezen az eszközön marad, titkosítva. Nincs regisztráció, nincs felhő, nincs követés.',

  onboardingTitle: 'Üdv itt.',
  onboardingIntro: 'Ez egy csendes, privát hely a saját utadhoz. Ha egy nap nehezebb, az sem törli az eddigi utadat: minden megtett nap megmarad.',
  pinLabel: 'Válassz PIN-kódot (legalább 4 számjegy) vagy jelszót',
  pinConfirmLabel: 'PIN-kód még egyszer',
  pinHint: 'Ezzel titkosítjuk a naplódat. Egy hosszabb jelszó (pl. három szó) sokkal erősebb védelmet ad, mint egy rövid számsor. Mi sem tudjuk visszaállítani, ezért kapsz majd egy helyreállító kódot.',
  pinMismatch: 'A két PIN-kód nem egyezik.',
  secretStrength: {
    weak: 'Alapszintű védelem: egy 4–5 számjegyű PIN a kíváncsi szemek ellen elég, de aki az eszköz tárolt adataihoz hozzáfér, gyorsan kitalálhatja. Egy hosszabb jelszó (pl. három szó) sokkal biztonságosabb.',
    fair: 'Közepes védelem. Egy hosszabb jelszóval (pl. három szó) még erősebb lehet.',
    strong: 'Erős védelem.',
  },
  startDateLabel: 'Mikor kezdődött az utad?',
  dailyCostLabel: 'Napi költség, amit így megspórolsz (Ft, nem kötelező)',
  dailyCostHint: 'Becslés is elég. Bármikor módosíthatod.',
  createButton: 'Kezdjük',

  recoveryTitle: 'A helyreállító kódod',
  recoveryIntro: 'Ha elfelejted a PIN-kódodat, ezzel a kóddal érheted el újra a naplódat. Írd le, és tartsd biztonságos helyen. Csak most látod.',
  recoveryConfirm: 'Leírtam, biztonságban van',
  copy: 'Másolás',
  copied: 'Kimásolva',

  lockTitle: 'Üdv újra',
  unlockButton: 'Megnyitás',
  forgotPin: 'Elfelejtettem a PIN-kódot',
  recoveryCodeLabel: 'Helyreállító kód',
  newPinLabel: 'Új PIN-kód',
  recoverButton: 'Visszaállítás',
  resetTitle: 'Nincs meg sem a PIN-kód, sem a helyreállító kód',
  resetInfo: 'A naplód úgy van titkosítva, hogy rajtad kívül senki – mi sem – tudja kinyitni. Ezért PIN-kód és helyreállító kód nélkül a bejegyzések nem állíthatók vissza. Ha szeretnéd, újrakezdheted: ez végleg töröl mindent erről az eszközről.',
  resetBackupHint: 'Ha van titkosított mentésfájlod, és emlékszel a mentés PIN-kódjára, törlés után azt visszaállíthatod.',
  resetConfirmLabel: 'A megerősítéshez írd be nagybetűkkel: TÖRLÉS',
  resetWord: 'TÖRLÉS',
  resetButton: 'Minden adat végleges törlése és újrakezdés',
  resetWordMismatch: 'A megerősítő szó nem egyezik. Semmi sem törlődött.',
  corruptedText: 'A mentett napló sérültnek tűnik. Van egy korábbi, ép mentés. Visszaállítsuk? A legutóbbi módosítás elveszhet.',
  restorePrevious: 'Korábbi mentés visszaállítása',
  storageVolatile: 'Figyelem: a böngésző nem engedi a tartós tárolást (pl. privát mód), ezért az adataid a lap bezárásakor elvesznek. Készíts titkosított mentést.',

  navHome: 'Kezdőlap',
  navJournal: 'Napló',
  navLog: 'Rögzítés',
  navSettings: 'Beállítások',
  lockNow: 'Zárolás',

  currentPhase: 'Jelenlegi szakasz',
  currentPhaseSince: (date) => `${date} óta`,
  days: (n) => `${n} nap`,
  totalSober: 'Összes józan nap',
  // Must stay TRUE: a late-logged slip removes that one day (see domain/timeline.js), so never promise "never decreases".
  totalSoberHint: 'Egy megcsúszás sem törli: minden józan napod megmarad.',
  heroCurrent: (n, date) => `Jelenlegi szakasz: ${n} nap · ${date} óta`,
  longestPhase: 'Leghosszabb szakasz',
  saved: 'Megspórolt pénz',
  savingsCurrentPhase: (x) => `Ebben a szakaszban: ${x}`,
  savingsPerMonth: (x) => `Mostani ütemben havonta kb. ${x}`,
  savingsAchieved: 'Ebből már kijönne:',
  savingsNext: (label, rem) => `Következő ötlet: ${label} – még kb. ${rem}`,
  savingsAllMilestones: 'Minden ötletet túlléptél. Te döntöd el, mire fordítod.',
  savingsEstimate: 'Becslés a megadott napi költség alapján; az árak tájékoztató jellegűek.',
  savingsChanged: 'A napi költség időközben változott: minden napot az akkor érvényes összeggel számolunk.',
  savingsGoal: 'Saját célod',
  savingsGoalRemaining: (x) => `Még ${x}`,
  savingsGoalReached: 'Megvan rá a pénz. Megérdemled.',
  savingsPhase: (x) => `Megspórolva ebben a szakaszban: ${x}`,
  costTitle: 'Napi költség',
  costNow: (x) => `Jelenleg: ${x} / nap`,
  costNewLabel: 'Új napi összeg (Ft)',
  costModeLegend: 'Mire vonatkozik a változás?',
  costModeFrom: 'Mostantól változott – a korábbi napok a régi összeggel maradnak',
  costModeAll: 'Visszamenőleg javítom – eddig rosszul becsültem',
  costFromLabel: 'Ettől a naptól',
  costSave: 'Összeg mentése',
  costHistoryTitle: 'Összegek időrendben',
  costHistoryRow: (from, x) => `${from}: ${x} / nap`,
  costSavedFrom: 'Elmentve. A korábbi napok értéke nem változott.',
  costSavedAll: 'Elmentve. A teljes időszakot az új összeggel számoljuk.',
  goalTitle: 'Megtakarítási cél (nem kötelező)',
  goalLabelLabel: 'Mire gyűjtesz?',
  goalAmountLabel: 'Cél összege (Ft)',
  goalSave: 'Cél mentése',
  goalClear: 'Cél törlése',
  quickTitle: 'Gyors rögzítés',
  quickHint: 'Koppints, és rögzítsd. Jegyzetet csak ha szeretnél.',
  quickTriggerGroup: 'Nehéz helyzet',
  quickMoodGroup: 'Hangulat',
  quickIntensityLabel: 'Mennyire erős? (nem kötelező)',
  quickNoteLabel: 'Jegyzet (nem kötelező, titkosítva marad)',
  quickSave: 'Rögzítés',
  quickLogged: (label) => `Rögzítve: ${label}`,
  savedSetup: 'Add meg a napi költséget a beállításokban, és itt láthatod a megtakarításod.',
  coped: 'Megküzdött nehéz pillanatok',
  sleepTrend: 'Alvásminőség (7 nap)',
  sleepBetter: 'Jobb, mint az előző héten',
  sleepSame: 'Hasonló, mint az előző héten',
  sleepWorse: 'Kicsit rosszabb – ez is rendben van, figyelj magadra',
  phaseZero: 'Ma új szakasz kezdődött. Az eddigi utad megmaradt.',

  checkinPrompt: 'Hogy vagy ma?',
  checkinDone: 'Mára már beírtál. Köszönjük, hogy figyelsz magadra.',
  actionCheckin: 'Napi bejelentkezés',
  actionTrigger: 'Nehéz pillanat rögzítése',
  actionSlip: 'Megcsúsztam',
  actionNote: 'Jegyzet',

  moodLabel: 'Hangulat',
  sleepLabel: 'Hogyan aludtál?',
  cravingLabel: 'Sóvárgás ma',
  checkinTriggersLabel: 'Volt ma nehezebb helyzet? (nem kötelező)',
  noteLabel: 'Jegyzet (nem kötelező)',
  save: 'Mentés',
  cancel: 'Mégse',
  saved_ok: 'Elmentve.',

  triggerTitle: 'Nehéz pillanat',
  triggerIntro: 'Jó, hogy észrevetted. Ennek rögzítése önmagában is erősség.',
  triggersLabel: 'Mi váltotta ki?',
  intensityLabel: 'Mennyire volt erős? (1–5)',
  copingLabel: 'Mi segített?',
  outcomeLabel: 'Hogyan alakult?',

  slipTitle: 'Megcsúszás',
  slipIntro: 'Ez megtörténik sokakkal a felépülés során. Nem törli az eddigi utadat: minden megtett józan nap megmarad, és holnap új szakasz kezdődik.',
  slipDateLabel: 'Mikor történt?',
  slipWhatLabel: 'Mi vezetett hozzá? (nem kötelező)',
  slipLessonLabel: 'Mit vinnél magaddal ebből a következő szakaszba? (nem kötelező)',
  slipIntentionLabel: 'Mire figyelsz az új szakaszban? (nem kötelező)',
  slipConfirm: 'Új szakasz kezdése',
  freshTitle: 'Új szakasz kezdődik',
  freshClosedLabel: 'Lezárt szakasz',
  freshClosed: (n) => `${n} józan nap. Ez a tiéd marad.`,
  freshTotal: (n) => `Összes józan napod: ${n}`,
  freshLessonSaved: 'A tanulságodat elmentettük, ott lesz a naplódban.',
  freshIntention: 'Amire figyelsz:',
  freshRetro: 'Utólag rögzítetted, ezért az az egy nap már nem számít józan napnak. Minden más napod megmarad.',
  freshSameDay: 'Erre a napra már kezdtél új szakaszt. A mostani gondolataidat hozzáadtuk.',
  freshSplit: 'Ez egy korábbi szakaszt két részre bontott. A többi napod változatlan.',
  freshKind: 'Légy kedves magadhoz ma. Egy nehéz nap nem írja felül az eddigi utadat.',
  freshContinue: 'Tovább a kezdőlapra',
  slipSupport: 'Ha most nehéz, a „Segítség most” gomb mindig itt van.',

  noteTitle: 'Jegyzet',
  noteEmpty: 'Írj valamit a mentéshez.',

  journalTitle: 'Napló',
  journalEmpty: 'Még nincs bejegyzés. Az első napi bejelentkezéssel indul a naplód.',
  phaseLabel: (i) => `${i}. szakasz`,
  lessonsTitle: 'Amit magaddal viszel',
  timelineTitle: 'Az utad',
  timelineAria: (n, total) => `${n} szakasz, összesen ${total} józan nap`,
  phaseCardCurrent: 'Jelenlegi szakasz',
  phaseCardClosed: 'Lezárt szakasz',
  phaseLessons: 'Amit magaddal vittél',
  phaseIntentionsCurrent: 'Amire figyelsz',
  phaseIntentionsClosed: 'Amire figyeltél',
  phaseCounts: (c, k) => `${c} napi bejelentkezés · ${k} megküzdött nehéz pillanat`,
  phaseEntriesToggle: (n) => `Bejegyzések (${n})`,
  phaseStartsTomorrowBig: 'Holnap kezdődik',
  phaseStartedToday: 'Ma kezdődött',
  phaseDates: (from, to) => (to ? `${from} – ${to}` : `${from} óta`),
  deleteEntry: 'Bejegyzés törlése',
  deleteEntryConfirm: 'Biztosan törlöd ezt a bejegyzést?',
  typeLabels: { checkin: 'Napi bejelentkezés', trigger: 'Nehéz pillanat', slip: 'Megcsúszás – új szakasz', note: 'Jegyzet' },

  settingsTitle: 'Beállítások',
  savingsSection: 'Megtakarítás',
  journeySection: 'Az utad',
  journeyStartLabel: 'Az út kezdete',
  remindersSection: 'Emlékeztetők',
  remindersLabel: 'Napi, kíméletes emlékeztető',
  remindersTimeLabel: 'Időpont',
  remindersInfo: 'Az értesítés szövege semleges („Egy perc magadra”), így a zárolt képernyőn sem árul el semmit. Szerver nélkül működik, ezért nem minden böngésző támogatja a pontos időzítést; ilyenkor az alkalmazás megnyitásakor kapsz egy finom jelzést.',
  remindersDenied: 'A böngésző nem engedélyezte az értesítéseket. Ezt a böngésző beállításaiban módosíthatod.',
  securitySection: 'Biztonság',
  autoLockLabel: 'Automatikus zárolás ennyi perc inaktivitás után',
  changePin: 'PIN-kód módosítása',
  oldPinLabel: 'Jelenlegi PIN-kód',
  newRecovery: 'Új helyreállító kód készítése',
  newRecoveryInfo: 'A régi kód ezzel érvényét veszti.',
  dataSection: 'Adataid',
  exportEncrypted: 'Titkosított mentés letöltése',
  exportEncryptedInfo: 'Csak a PIN-kódoddal vagy a helyreállító kódoddal nyitható meg. Ezzel viheted át a naplódat másik eszközre.',
  exportJson: 'Export JSON-ként (nem titkosított)',
  exportCsv: 'Export CSV-ként (táblázatkezelőhöz, nem titkosított)',
  exportPlainWarning: 'Ez a fájl NEM titkosított: aki hozzáfér, elolvashatja. Biztosan letöltöd?',
  importEncrypted: 'Titkosított mentés visszaállítása',
  importEncryptedInfo: 'A jelenlegi napló helyére kerül. A mentés PIN-kódja szükséges.',
  deleteAll: 'Minden adat törlése',
  deleteAllInfo: 'Egy lépésben, véglegesen töröl mindent erről az eszközről. Nem visszavonható.',
  deleteAllConfirm: 'Biztosan törölsz minden adatot erről az eszközről? Ez nem visszavonható.',
  deleted: 'Minden adat törölve.',
  aboutSection: 'Rólunk és adatvédelem',

  crisisTitle: 'Itt vagyunk. Lépésről lépésre.',
  crisisIntro: 'Amit most érzel, el fog múlni. Válassz egyet az alábbiak közül.',
  crisisCallTitle: 'Beszélj valakivel most',
  crisisCall: (n) => `Hívás: ${n}`,
  crisisBreatheTitle: 'Lélegezz velem',
  crisisStart: 'Indítás',
  crisisStop: 'Leállítás',
  crisisPause: 'Szüneteltetés',
  crisisResume: 'Folytatás',
  crisisRound: (i, n) => `${i}. kör / ${n}`,
  crisisDone: 'Szépen csináltad. Hogy érzed magad most?',
  crisisNowSteps: 'Amit most megtehetsz',
  crisisBack: 'Vissza',
  crisisOffline: 'Ez az oldal internet nélkül is működik. A hívásokhoz nem kell internet, csak telefonos térerő.',
  crisisEmergencyLead: 'Közvetlen veszély esetén azonnal hívd:',
  crisisCopy: 'Szám másolása',
  crisisCopied: 'Kimásolva',
  crisisCopyManual: 'Jelöld ki és másold ki a számot',
  crisisPatternLabel: 'Légzésminta',
  crisisPaused: 'Megállítva. Bármikor folytathatod.',
  crisisEscHint: 'Az Esc billentyűvel is visszaléphetsz.',

  errGeneric: 'Valami nem sikerült. Az adataid biztonságban vannak; próbáld újra.',
  errWrongPin: 'Ez nem a megfelelő PIN-kód.',
};
