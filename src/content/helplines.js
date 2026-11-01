// Segélyvonalak országonként. `tel:` hivatkozások (internet nélkül is működnek, a hívásról semmi sem kerül rögzítésre);
// a nemzetközi listában egy weboldal is van (`url`), ami természetesen internetet kér.
// `verification`: 'official' = hivatalos forrás megerősítette; 'multiple-secondary' = több független másodlagos forrás;
//                 'unverified' = emlékezetből/általános ismeretből, KIADÁS ELŐTT próbahívás és hivatalos forrás kell
//                 (lásd docs/SAFETY.md). A sorrend számít: az első beszélgetős vonal az elsődleges (kiemelt).

import { COUNTRY_IDS, pick } from '../i18n/locale.js';

const L = pick;

const HU = [
  {
    id: 'emergency', role: 'emergency', number: '112', tel: '112',
    name: L('Általános segélyhívó', 'Emergency services'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell (pl. súlyos elvonási tünetek, görcsroham, zavartság).',
      'If you or someone else is in immediate danger, or medical help is needed (e.g. severe withdrawal symptoms, a seizure, confusion).'),
    verified: '2026-10-26', verification: 'official',
  },
  {
    id: 'lesz', role: 'talk', number: '116-123', tel: '116123',
    name: L('S.O.S. Lelki Elsősegély Telefonszolgálat', 'S.O.S. Emotional First Aid Line (LESZ)'),
    hours: L('Éjjel-nappal, belföldről ingyenes, névtelenül hívható', 'Around the clock, free from within Hungary, anonymous'),
    when: L('Ha beszélgetni szeretnél valakivel, aki meghallgat, bármilyen nehéz pillanatban.', 'If you want to talk to someone who will listen, in any difficult moment. (Hungarian-speaking line.)'),
    verified: '2026-10-29', verification: 'official',
  },
  {
    id: 'drog-stop', role: 'talk', number: '06-80-505-678', tel: '0680505678',
    name: L('Drog Stop segélyvonal', 'Drog Stop helpline'),
    hours: L('Ingyenesen hívható', 'Free to call'),
    when: L('Ha szerhasználattal kapcsolatban szeretnél beszélni valakivel – magad vagy egy hozzátartozód miatt.', 'If you want to talk to someone about substance use, for yourself or a relative. (Hungarian-speaking line.)'),
    verified: '2026-10-29', verification: 'multiple-secondary',
  },
  {
    id: 'kek-vonal', role: 'talk', number: '116-111', tel: '116111',
    name: L('Kék Vonal (gyerekeknek és fiataloknak)', 'Kék Vonal (children and young people)'),
    hours: L('Ingyenes, nem kell megmondanod a neved', 'Free, you do not have to give your name'),
    when: L('Ha fiatal vagy (24 év alatt), és jól jönne egy beszélgetés.', 'If you are young (under 24) and would like to talk. (Hungarian-speaking line.)'),
    verified: '2026-10-26', verification: 'official',
  },
];

const UK = [
  {
    id: 'uk-emergency', role: 'emergency', number: '999', tel: '999',
    name: L('Segélyhívó (Egyesült Királyság)', 'Emergency services (UK)'),
    hours: L('Éjjel-nappal, ingyenes (a 112 is működik)', 'Around the clock, free (112 also works)'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell.', 'If you or someone else is in immediate danger, or medical help is needed.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'samaritans', role: 'talk', number: '116 123', tel: '116123',
    name: 'Samaritans',
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha beszélgetni szeretnél valakivel, aki meghallgat. (Angol nyelvű vonal.)', 'If you want to talk to someone who will listen, about anything that is troubling you.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'frank', role: 'talk', number: '0300 123 6600', tel: '03001236600',
    name: 'FRANK',
    hours: L('Éjjel-nappal', 'Around the clock'),
    when: L('Információ és tanács drogokkal kapcsolatban. (Angol nyelvű vonal.)', 'Friendly, confidential advice about drugs.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'drinkline', role: 'talk', number: '0300 123 1110', tel: '03001231110',
    name: 'Drinkline',
    hours: L('Munkanapokon 9–20, hétvégén 11–16 (Anglia)', 'Weekdays 9am–8pm, weekends 11am–4pm (England)'),
    when: L('Ha az alkoholfogyasztásod miatt aggódsz, magad vagy más miatt. (Angol nyelvű vonal.)', 'If you are worried about your own or someone else\'s drinking.'),
    verified: null, verification: 'unverified',
  },
];

const US = [
  {
    id: 'us-emergency', role: 'emergency', number: '911', tel: '911',
    name: L('Segélyhívó (USA)', 'Emergency services (US)'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más, vagy orvosi segítség kell.', 'If you or someone else is in immediate danger, or medical help is needed.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'lifeline-988', role: 'talk', number: '988', tel: '988',
    name: '988 Suicide & Crisis Lifeline',
    hours: L('Éjjel-nappal, ingyenes; hívás vagy SMS', 'Around the clock, free; call or text'),
    when: L('Ha lelki válságban vagy, vagy mélyen elkeseredtél. (Angol nyelvű vonal.)', 'If you are in emotional distress or crisis, or worried about someone else.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'samhsa', role: 'talk', number: '1-800-662-4357', tel: '18006624357',
    name: 'SAMHSA National Helpline',
    hours: L('Éjjel-nappal, ingyenes, bizalmas', 'Around the clock, free, confidential'),
    when: L('Segítség és tájékoztatás szerhasználattal és függőséggel kapcsolatban. (Angol nyelvű vonal.)', 'Treatment referrals and information about substance use and addiction.'),
    verified: null, verification: 'unverified',
  },
];

const INT = [
  {
    id: 'int-emergency', role: 'emergency', number: '112', tel: '112',
    name: L('Általános segélyhívó (EU és sok más ország)', 'Emergency number (EU and many other countries)'),
    hours: L('Éjjel-nappal, ingyenes', 'Around the clock, free'),
    when: L('Ha közvetlen veszélyben vagy te vagy valaki más. Ha nem tudod, melyik szám működik a környéken, a 112 sok helyen továbbít a helyi segélyhívóhoz.',
      'If you or someone else is in immediate danger. If you are unsure which number works where you are, 112 is forwarded to the local emergency service in many places.'),
    verified: null, verification: 'unverified',
  },
  {
    id: 'findahelpline', role: 'talk', number: 'findahelpline.com', url: 'https://findahelpline.com',
    name: L('Find a Helpline: segélyvonalak szerte a világon', 'Find a Helpline: free, confidential helplines around the world'),
    hours: L('Internetkapcsolat kell hozzá', 'Needs an internet connection'),
    when: L('Válaszd ki az országodat, és megmutatja a közeli segélyvonalakat.', 'Choose your country to see helplines near you.'),
    verified: null, verification: 'unverified',
  },
];

export const HELPLINES_BY_COUNTRY = { HU, UK, US, INT };
export const COUNTRIES = COUNTRY_IDS.map((id) => ({ id, label: { HU: L('Magyarország', 'Hungary'), UK: L('Egyesült Királyság', 'United Kingdom'), US: L('USA', 'United States'), INT: L('Egyéb ország', 'Other country') }[id] }));

/** Az adott ország vonalai; ismeretlen országnál a nemzetközi lista. */
export const helplinesFor = (country) => HELPLINES_BY_COUNTRY[country] ?? INT;

/** Visszafelé kompatibilitás és a statikus (JS nélküli) tartalék: a magyar lista. */
export const HELPLINES = HU;
