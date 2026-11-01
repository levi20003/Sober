// Nyelv (magyar / angol). A nyelv az alkalmazás indulásakor dől el, és a szövegek ennek megfelelően töltődnek be:
//   1. VITE_LOCALE (csak tesztekhez és fejlesztéshez)
//   2. a Beállításokban választott nyelv (localStorage "jsz-ui", nem személyes adat)
//   3. a telefon/böngésző nyelve (magyar → hu, minden más → en)
// A váltás után az oldal újratölt, így a modulszintű szövegek nem kell, hogy "élők" legyenek.

export const LOCALES = ['hu', 'en'];
const KEY = 'jsz-ui';

export function readUiPref(key) {
  try { return JSON.parse(globalThis.localStorage?.getItem(KEY) || '{}')[key]; } catch { return undefined; }
}

const navLang = () => String(globalThis.navigator?.languages?.[0] ?? globalThis.navigator?.language ?? 'hu').toLowerCase();

export function detectLocale() {
  const forced = import.meta.env?.VITE_LOCALE;
  if (LOCALES.includes(forced)) return forced;
  const pref = readUiPref('lang');
  if (LOCALES.includes(pref)) return pref;
  return navLang().startsWith('hu') ? 'hu' : 'en';
}

export const locale = detectLocale();

/** BCP-47 címke a dátum- és számformázáshoz. */
export const intlTag = locale === 'hu' ? 'hu-HU' : (/^en-[a-z]{2}$/.test(navLang()) ? navLang().replace(/-([a-z]{2})$/, (_, r) => `-${r.toUpperCase()}`) : 'en-GB');

export const pick = (hu, en) => (locale === 'hu' ? hu : en);

export const COUNTRY_IDS = ['HU', 'UK', 'US', 'INT'];

/** Alapértelmezett ország a nyelvből és a régióból (a Beállításokban és a krízisoldalon átállítható). */
export function detectCountry() {
  const pref = readUiPref('country');
  if (COUNTRY_IDS.includes(pref)) return pref;
  if (locale === 'hu') return 'HU';
  const region = /-([a-z]{2})$/.exec(navLang())?.[1];
  if (region === 'gb') return 'UK';
  if (region === 'us') return 'US';
  return 'INT';
}
