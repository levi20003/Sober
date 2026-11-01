// Titkosított mentésfájl (a "vault" rekord becsomagolva), v2 formátum.
//
//   { app: 'jozansag-szamlalo', kind: 'encrypted-backup', formatVersion: 2,
//     appVersion, schemaVersion, exportedAt, checksum: 'sha256:<hex>', record }
//
// A checksum a `record` JSON-szövegének SHA-256 lenyomata. Nem titkosítási védelem (azt az AES-GCM adja),
// hanem arra való, hogy egy sérült vagy csonka fájlt meg tudjunk különböztetni a rossz PIN-kódtól.
// Az 1-es formátum (2026. októberig: nincs formatVersion és checksum) továbbra is visszaállítható.
// Új formátum = új szám; a régi ágakat soha ne töröld (docs/DATA-SCHEMA.md).

import { safeJsonParse } from '../lib/safeJson.js';

export const BACKUP_FORMAT = 2;
const APP = 'jozansag-szamlalo';
const KIND = 'encrypted-backup';

export const BACKUP_MESSAGES = {
  DAMAGED: 'A mentésfájl sérült vagy hiányos. Próbáld egy korábbi mentéssel, vagy készíts újat a másik eszközön.',
  NOT_OURS: 'Ez a fájl nem Józanság-számláló titkosított mentés.',
  UNSUPPORTED: 'Ezt a mentést az alkalmazás újabb verziója készítette. Kérlek, előbb frissítsd az alkalmazást.',
  EMPTY: 'A fájl üres.',
};

export class BackupError extends Error {
  constructor(code, message = BACKUP_MESSAGES[code], options) {
    super(message, options);
    this.name = 'BackupError';
    this.code = code;
  }
}

const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

/** A rekord lenyomata. A JSON.parse megőrzi a kulcsok sorrendjét, így a beolvasott rekord ugyanazt adja. */
export async function recordChecksum(record) {
  const bytes = new TextEncoder().encode(JSON.stringify(record));
  return `sha256:${hex(await crypto.subtle.digest('SHA-256', bytes))}`;
}

export async function createBackup(record, { appVersion = 'unknown', schemaVersion, now = new Date() } = {}) {
  return {
    app: APP, kind: KIND, formatVersion: BACKUP_FORMAT,
    appVersion: String(appVersion), schemaVersion, exportedAt: new Date(now).toISOString(),
    checksum: await recordChecksum(record),
    record,
  };
}

/** Szövegből objektum. Csonka JSON → DAMAGED (ha a mi fájlunknak látszik), bármi más → NOT_OURS. */
export function parseBackupText(text) {
  const s = String(text ?? '').replace(/^﻿/, '');
  if (!s.trim()) throw new BackupError('EMPTY');
  let obj;
  try {
    obj = safeJsonParse(s);
  } catch (err) {
    if (err?.name === 'ImportError') throw err;
    const looksOurs = s.includes(`"${APP}"`) || s.includes(`"${KIND}"`);
    throw new BackupError(looksOurs ? 'DAMAGED' : 'NOT_OURS', undefined, { cause: err });
  }
  // Más alkalmazás (vagy bármilyen más) JSON-ja: nem a miénk. A nyílt (plain-export) mentés is a miénk.
  if (!isObj(obj) || obj.app !== APP) throw new BackupError('NOT_OURS');
  return obj;
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isB64 = (v) => typeof v === 'string' && v.length > 0 && /^[A-Za-z0-9+/]+=*$/.test(v);
const slotOk = (s) => isObj(s) && isObj(s.kdf) && isB64(s.kdf.salt) && Number.isInteger(s.kdf.iterations) && isB64(s.iv) && isB64(s.wrapped);

/**
 * Szerkezet, verzió és (v2-től) ellenőrzőösszeg vizsgálata, MIELŐTT bármit visszafejtenénk vagy felülírnánk.
 * @returns {Promise<{formatVersion: number, record: object}>}
 */
export async function inspectBackup(obj) {
  if (!isObj(obj) || obj.app !== APP || obj.kind !== KIND) throw new BackupError('NOT_OURS');
  const formatVersion = obj.formatVersion ?? 1;
  if (!Number.isInteger(formatVersion) || formatVersion < 1) throw new BackupError('DAMAGED');
  if (formatVersion > BACKUP_FORMAT) throw new BackupError('UNSUPPORTED');
  const { record } = obj;
  if (!isObj(record)) throw new BackupError('DAMAGED');
  if (typeof record.format === 'number' && record.format > 1) throw new BackupError('UNSUPPORTED');
  if (formatVersion >= 2 && (typeof obj.checksum !== 'string' || obj.checksum !== await recordChecksum(record))) {
    throw new BackupError('DAMAGED');
  }
  if (record.format !== 1 || !isObj(record.slots) || !slotOk(record.slots.pin) || !slotOk(record.slots.recovery)
    || !isObj(record.payload) || !isB64(record.payload.iv) || !isB64(record.payload.ct)) {
    throw new BackupError('DAMAGED');
  }
  return { formatVersion, record };
}
