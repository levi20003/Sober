// Mentés-emlékeztető: mikor érdemes gyengéden szólni, hogy készüljön titkosított mentés.
// Tiszta függvény (az időt kívülről kapja); a "lastBackup" és a halasztás a nem titkosított meta rekordban van (nem személyes).

import { diffDays, toDateKey } from './dates.js';

export const BACKUP_EVERY_DAYS = 30;
export const SNOOZE_DAYS = 7;

/**
 * @param {{lastBackup: string|null, backupSnoozeUntil: string|null}} meta
 * @param {{profile: {journeyStart: string}, events: object[]}} data
 */
export function backupDue(meta, data, now = new Date()) {
  const today = toDateKey(now);
  // Van mit menteni: néhány bejegyzés, vagy már hosszabb ideje használja.
  const worthSaving = data.events.length >= 5 || diffDays(data.profile.journeyStart, today) >= 14;
  if (!worthSaving) return false;
  if (meta.backupSnoozeUntil && today < meta.backupSnoozeUntil) return false;
  if (!meta.lastBackup) return true;
  return diffDays(toDateKey(new Date(meta.lastBackup)), today) >= BACKUP_EVERY_DAYS;
}

export const snoozeUntil = (now = new Date(), days = SNOOZE_DAYS) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
};
