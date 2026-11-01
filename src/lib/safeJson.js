// Importált fájlok biztonságos beolvasása: méretkorlát, mélységkorlát, tiltott kulcsok (prototípus-szennyezés ellen).
// A JSON.parse önmagában nem szennyezi a prototípust, de a "__proto__" kulcsú objektum később Object.assign / spread
// útján igen; ezért az ilyen fájlt egyszerűen elutasítjuk. A tartalmat utána a validateData szigorúan ellenőrzi.

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10 MB: egy évtizednyi napló is bőven belefér
export const MAX_DEPTH = 32;
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

export class ImportError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ImportError';
    this.code = code;
  }
}

export function safeJsonParse(text, { maxBytes = MAX_IMPORT_BYTES } = {}) {
  const s = String(text ?? '');
  if (s.length > maxBytes) throw new ImportError('TOO_LARGE', 'A fájl túl nagy (legfeljebb 10 MB).');
  const value = JSON.parse(s.replace(/^﻿/, ''), (key, v) => {
    if (FORBIDDEN.has(key)) throw new ImportError('FORBIDDEN_KEY', 'A fájl nem megengedett mezőt tartalmaz.');
    return v;
  });
  checkDepth(value, 0);
  return value;
}

function checkDepth(v, depth) {
  if (depth > MAX_DEPTH) throw new ImportError('TOO_DEEP', 'A fájl szerkezete túl mélyen egymásba ágyazott.');
  if (v && typeof v === 'object') for (const x of Object.values(v)) checkDepth(x, depth + 1);
}

/**
 * Fájl szövege a méret ELLENŐRZÉSE UTÁN (egy 2 GB-os fájlt be sem olvasunk). A kódolást a bájtsorrend-jelből
 * (BOM) ismeri fel: UTF-8 (BOM-mal vagy anélkül), UTF-16 LE/BE (pl. a Jegyzettömb „Unicode” mentése).
 */
export async function readImportText(file) {
  if (!file || !file.size) throw new ImportError('EMPTY', 'A fájl üres.');
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('TOO_LARGE', 'A fájl túl nagy (legfeljebb 10 MB).');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const enc = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  // A TextDecoder alapból elhagyja a BOM-ot.
  return new TextDecoder(enc).decode(bytes);
}

/** Fájl beolvasása és biztonságos JSON-értelmezése. */
export async function readImportFile(file, opts) {
  return safeJsonParse(await readImportText(file), opts);
}
