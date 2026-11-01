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

/** Fájl beolvasása a méret ELLENŐRZÉSE UTÁN (egy 2 GB-os fájlt be sem olvasunk). */
export async function readImportFile(file, opts) {
  if (!file || !file.size) throw new ImportError('EMPTY', 'A fájl üres.');
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('TOO_LARGE', 'A fájl túl nagy (legfeljebb 10 MB).');
  return safeJsonParse(await file.text(), opts);
}
