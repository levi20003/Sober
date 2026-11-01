import { locale } from '../i18n/locale.js';
import { MISC, T } from '../content/index.js';

const OWN_ERRORS = new Set(['VaultError', 'StorageError', 'SchemaError', 'AuthStateError', 'TimelineError', 'Error']);

/** User-caused outcomes (wrong PIN, weak PIN, validation) are not bugs and are not logged. */
export const EXPECTED_CODES = new Set(['WRONG_SECRET', 'WEAK_SECRET', 'USER_INPUT', 'TIMELINE']);

// A belső hibaüzenetek magyarul készülnek. Angol felületen a gyakoribb, felhasználónak szóló üzeneteket lefordítjuk,
// a ritka belső ellenőrzési hibákra (séma, formátum) az általános angol szöveg kerül. Sorrend számít.
const EN = [
  [/Hibás PIN-kód vagy helyreállító kód/, 'Wrong PIN or recovery code.'],
  [/Túl sok sikertelen próbálkozás\. Próbáld újra (\d+) másodperc/, (m) => `Too many failed attempts. Try again in ${m[1]} seconds.`],
  [/A PIN-kódnak legalább (\d+) karakter/, (m) => `The PIN must be at least ${m[1]} characters long.`],
  [/túl könnyen kitalálható/, 'This PIN is too easy to guess. Please choose another one.'],
  [/A naplo zárolva|A napló zárolva van/, 'The journal is locked.'],
  [/Már létezik napló/, 'A journal already exists on this device.'],
  [/helyreállító kód formátuma/, 'The recovery code format is not right (32 characters).'],
  [/Web Crypto|biztonságos titkosítást/, 'This browser does not support secure encryption (Web Crypto). A secure (https) connection is required.'],
  [/újabb verziójával készült|újabb verziója hozta létre/, 'The data was created by a newer version of the app. Please update the app.'],
  [/nem Józanság-számláló/, 'This file is not a Sobriety Counter file.'],
  [/nem érvényes JSON/, 'The file is not valid JSON.'],
  [/Nem található mentett napló|sérült|ismeretlen formátum/i, 'The saved data looks damaged or is in an unknown format.'],
  [/Betelt az eszköz tárhelye/, 'The device storage is full, so saving failed. Free up some space or make an export.'],
  [/nem engedi a helyi tárolást/, 'The browser does not allow local storage (e.g. private mode). Your data only stays for this session.'],
  [/A mentés nem sikerült/, 'Saving failed. The previous saved state is kept.'],
  [/Jövőbeli napra nem lehet|Jövőbeli dátumtól/, 'A future date is not possible.'],
  [/nem lehet korábbi, mint az út kezdete/, 'The date cannot be earlier than the start of your journey.'],
  [/nem lehetséges ebben az állapotban/, 'That is not possible right now.'],
];

/** Our errors carry Hungarian messages; anything else (e.g. a JSON SyntaxError) gets a generic one. */
export function friendlyError(err) {
  if (err?.name === 'SyntaxError') return MISC.file.unreadable;
  if (OWN_ERRORS.has(err?.name) && err.message) {
    if (err.code === 'USER_INPUT' || locale === 'hu') return err.message;
    for (const [re, out] of EN) {
      const m = re.exec(err.message);
      if (m) return typeof out === 'function' ? out(m) : out;
    }
    return T.errGeneric;
  }
  return T.errGeneric;
}

/** A validation message for the user (not a bug): shown as a toast, never logged as an error. */
export function userError(message) {
  return Object.assign(new Error(message), { code: 'USER_INPUT' });
}
