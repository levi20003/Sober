// Segélyvonalak országonként. `tel:` hivatkozások (internet nélkül is működnek, a hívásról semmi sem kerül rögzítésre);
// a nemzetközi listában egy weboldal is van (`url`), ami természetesen internetet kér.
// `source`: a hivatalos (vagy az ellenőrzéshez használt) oldal; `verifiedBy`: ki ellenőrizte (lásd WEB_CHECK).
// `verification`: 'official' = hivatalos forrás megerősítette; 'multiple-secondary' = több független másodlagos forrás;
//                 'unverified' = emlékezetből/általános ismeretből, KIADÁS ELŐTT próbahívás és hivatalos forrás kell
//                 (lásd docs/SAFETY.md). A sorrend számít: az első beszélgetős vonal az elsődleges (kiemelt).

import { COUNTRY_IDS, pick } from '../i18n/locale.js';

const L = pick;

// Ki/mi ellenőrizte. Eddig csak fejlesztői, webes forrásellenőrzés történt (a szám szerepel-e a `source` oldalon);
// próbahívás és szakmai megerősítés: [EMBERI TEENDŐ], lásd docs/SAFETY.md 4.1. Ezt a mezőt csak az írja át
// valódi névre/szerepre, aki a próbahívást ténylegesen elvégezte.
const WEB_CHECK = 'webes forrásellenőrzés (fejlesztői eszköz), próbahívás nélkül';

const HU = [
  {
    id: 'emergency', role: 'emergency', number: '112', tel: '112',
    name: L('Általános segélyhívó', 'Emergency services'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell (pl. súlyos elvonási tünetek, görcsroham, zavartság).',
      'If you or someone else is in immediate danger, or medical help is needed (e.g. severe withdrawal symptoms, a seizure, confusion).'),
    verified: '2026-10-26', verification: 'official',
    source: 'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm', verifiedBy: WEB_CHECK,
  },
  {
    id: 'lesz', role: 'talk', number: '116-123', tel: '116123',
    name: L('S.O.S. Lelki Elsősegély Telefonszolgálat', 'S.O.S. Emotional First Aid Line (LESZ)'),
    hours: L('Éjjel-nappal, belföldről ingyenes, névtelenül hívható', 'Around the clock, free from within Hungary, anonymous'),
    when: L('Ha beszélgetni szeretnél valakivel, aki meghallgat, bármilyen nehéz pillanatban.', 'If you want to talk to someone who will listen, in any difficult moment. (Hungarian-speaking line.)'),
    verified: '2026-10-29', verification: 'official',
    source: 'https://www.sos116-123.hu', verifiedBy: WEB_CHECK,
  },
  {
    id: 'drog-stop', role: 'talk', number: '06-80-505-678', tel: '0680505678',
    name: L('Drog Stop segélyvonal', 'Drog Stop helpline'),
    hours: L('Ingyenesen hívható', 'Free to call'),
    when: L('Ha szerhasználattal kapcsolatban szeretnél beszélni valakivel – magad vagy egy hozzátartozód miatt.', 'If you want to talk to someone about substance use, for yourself or a relative. (Hungarian-speaking line.)'),
    verified: '2026-10-29', verification: 'multiple-secondary',
    source: 'https://drogstoponline.hu/telefonsegely/', verifiedBy: WEB_CHECK,
    // 2026-11-01: a szervezet oldala elérhető, de a szám a lap szövegében nem szerepel → marad 'multiple-secondary'.
    // Próbahívás + hivatalos megerősítés nélkül nem lehet 'official' (tests/clinical.test.js).
  },
  {
    id: 'kek-vonal', role: 'talk', number: '116-111', tel: '116111',
    name: L('Kék Vonal (gyerekeknek és fiataloknak)', 'Kék Vonal (children and young people)'),
    hours: L('Ingyenes, nem kell megmondanod a neved', 'Free, you do not have to give your name'),
    when: L('Ha fiatal vagy (24 év alatt), és jól jönne egy beszélgetés.', 'If you are young (under 24) and would like to talk. (Hungarian-speaking line.)'),
    verified: '2026-10-26', verification: 'official',
    source: 'https://kek-vonal.hu', verifiedBy: WEB_CHECK,
  },
];

const UK = [
  {
    id: 'uk-emergency', role: 'emergency', number: '999', tel: '999',
    name: L('Segélyhívó (Egyesült Királyság)', 'Emergency services (UK)'),
    hours: L('Éjjel-nappal, ingyenes (a 112 is működik)', 'Around the clock, free (112 also works)'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell.', 'If you or someone else is in immediate danger, or medical help is needed.'),
    verified: '2026-11-01', verification: 'official',
    source: 'https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/', verifiedBy: WEB_CHECK,
  },
  {
    id: 'samaritans', role: 'talk', number: '116 123', tel: '116123',
    name: 'Samaritans',
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha beszélgetni szeretnél valakivel, aki meghallgat. (Angol nyelvű vonal.)', 'If you want to talk to someone who will listen, about anything that is troubling you.'),
    verified: '2026-11-01', verification: 'multiple-secondary',
    source: 'https://www.samaritans.org', verifiedBy: WEB_CHECK,
  },
  {
    id: 'frank', role: 'talk', number: '0300 123 6600', tel: '03001236600',
    name: 'FRANK',
    hours: L('Éjjel-nappal', 'Around the clock'),
    when: L('Információ és tanács drogokkal kapcsolatban. (Angol nyelvű vonal.)', 'Friendly, confidential advice about drugs.'),
    verified: '2026-11-01', verification: 'multiple-secondary',
    source: 'https://www.talktofrank.com', verifiedBy: WEB_CHECK,
  },
  {
    id: 'drinkline', role: 'talk', number: '0300 123 1110', tel: '03001231110',
    name: 'Drinkline',
    hours: L('Munkanapokon 9–20, hétvégén 11–16 (Anglia)', 'Weekdays 9am–8pm, weekends 11am–4pm (England)'),
    when: L('Ha az alkoholfogyasztásod miatt aggódsz, magad vagy más miatt. (Angol nyelvű vonal.)', 'If you are worried about your own or someone else\'s drinking.'),
    verified: '2026-11-01', verification: 'multiple-secondary',
    source: 'https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/', verifiedBy: WEB_CHECK,
  },
];

const US = [
  {
    id: 'us-emergency', role: 'emergency', number: '911', tel: '911',
    name: L('Segélyhívó (USA)', 'Emergency services (US)'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell.', 'If you or someone else is in immediate danger, or medical help is needed.'),
    verified: '2026-11-01', verification: 'official',
    source: 'https://www.911.gov', verifiedBy: WEB_CHECK,
  },
  {
    id: 'lifeline-988', role: 'talk', number: '988', tel: '988',
    name: '988 Suicide & Crisis Lifeline',
    hours: L('Éjjel-nappal, ingyenes; hívás vagy SMS', 'Around the clock, free; call or text'),
    when: L('Ha lelki válságban vagy, vagy mélyen elkeseredtél. (Angol nyelvű vonal.)', 'If you are in emotional distress or crisis, or worried about someone else.'),
    verified: '2026-11-01', verification: 'multiple-secondary',
    source: 'https://988lifeline.org', verifiedBy: WEB_CHECK,
  },
  {
    id: 'samhsa', role: 'talk', number: '1-800-662-4357', tel: '18006624357',
    name: 'SAMHSA National Helpline',
    hours: L('Éjjel-nappal, ingyenes, bizalmas', 'Around the clock, free, confidential'),
    when: L('Segítség és tájékoztatás szerhasználattal és függőséggel kapcsolatban. (Angol nyelvű vonal.)', 'Treatment referrals and information about substance use and addiction.'),
    verified: '2026-11-01', verification: 'multiple-secondary',
    source: 'https://www.samhsa.gov/find-help/helplines/national-helpline', verifiedBy: WEB_CHECK,
  },
];

const INT = [
  {
    id: 'int-emergency', role: 'emergency', number: '112', tel: '112',
    name: L('Általános segélyhívó (EU és sok más ország)', 'Emergency number (EU and many other countries)'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más. Ha nem tudod, melyik szám működik a környéken, a 112 sok helyen továbbít a helyi segélyhívóhoz.',
      'If you or someone else is in immediate danger. If you are unsure which number works where you are, 112 is forwarded to the local emergency service in many places.'),
    verified: '2026-11-01', verification: 'official',
    source: 'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm', verifiedBy: WEB_CHECK,
  },
  {
    id: 'findahelpline', role: 'talk', number: 'findahelpline.com', url: 'https://findahelpline.com',
    name: L('Find a Helpline: segélyvonalak szerte a világon', 'Find a Helpline: free, confidential helplines around the world'),
    hours: L('Internetkapcsolat kell hozzá', 'Needs an internet connection'),
    when: L('Válaszd ki az országodat, és megmutatja a közeli segélyvonalakat.', 'Choose your country to see helplines near you.'),
    // Weboldal, nem telefonszám: próbahívás helyett az oldal elérhetőségét és tartalmát ellenőriztük.
    verified: '2026-11-01', verification: 'unverified',
    source: 'https://findahelpline.com', verifiedBy: WEB_CHECK,
  },
];

export const HELPLINES_BY_COUNTRY = { HU, UK, US, INT };
export const COUNTRIES = COUNTRY_IDS.map((id) => ({ id, label: { HU: L('Magyarország', 'Hungary'), UK: L('Egyesült Királyság', 'United Kingdom'), US: L('USA', 'United States'), INT: L('Egyéb ország', 'Other country') }[id] }));

/** Az adott ország vonalai; ismeretlen országnál a nemzetközi lista. */
export const helplinesFor = (country) => HELPLINES_BY_COUNTRY[country] ?? INT;

/** Visszafelé kompatibilitás és a statikus (JS nélküli) tartalék: a magyar lista. */
export const HELPLINES = HU;
