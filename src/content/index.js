// A felület szövegeinek egyetlen belépési pontja: a kiválasztott nyelv (src/i18n/locale.js) szövegeit adja vissza.
// A komponensek és a logika innen importálnak; a szövegek a locales/hu.js és locales/en.js fájlokban vannak.

import * as hu from './locales/hu.js';
import * as en from './locales/en.js';
import { locale } from '../i18n/locale.js';
import { convertAmounts } from '../i18n/money.js';

const L = locale === 'hu' ? hu : en;

export const CONTENT_VERSION = L.CONTENT_VERSION;
export const REVIEW_STATUS = L.REVIEW_STATUS;
export const BREATHING = L.BREATHING;
export const GROUNDING = L.GROUNDING;
export const URGE_WAVE = L.URGE_WAVE;
export const CRISIS_STEPS = L.CRISIS_STEPS;
export const RISK_MESSAGES = L.RISK_MESSAGES;
export const NOTIFICATION = L.NOTIFICATION;
export const T = L.T;
export const NAV_TABS = L.NAV_TABS;
export const GREETINGS = L.GREETINGS;
export const ONB = L.ONB;
export const HOME = L.HOME;
export const ENCOURAGEMENTS = L.ENCOURAGEMENTS;
export const TIPS = L.TIPS;
export const TIMELINE_PAGE = L.TIMELINE_PAGE;
export const SAVINGS_PAGE = L.SAVINGS_PAGE;
export const TOOLS = L.TOOLS;
export const SETTINGS_PAGE = L.SETTINGS_PAGE;
export const PREVIEW = L.PREVIEW;
export const UPDATE = L.UPDATE;
export const CELEBRATE = L.CELEBRATE;
export const QUICK_ADD = L.QUICK_ADD;
export const CHALLENGE_CATALOG = L.CHALLENGE_CATALOG;
export const A11Y = L.A11Y;
export const MISC = L.MISC;

// Az ötlet-listák árai a választott pénznemben (forint-alapról átszámítva, kerekítve).
export const SAVINGS_MILESTONES = convertAmounts(L.SAVINGS_MILESTONES, 'amountHuf');
export const FUN_ITEMS = convertAmounts(L.FUN_ITEMS, 'priceHuf');

export { HELPLINES, helplinesFor, COUNTRIES, HELPLINES_BY_COUNTRY } from './helplines.js';
