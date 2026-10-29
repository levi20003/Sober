// Envelope encryption on top of the Web Crypto API.
//
//   secret (PIN / passphrase / recovery code)
//     └─ PBKDF2-SHA-256 (per-slot random salt) ─► KEK (AES-256-GCM, non-extractable)
//          └─ AES-KW-style wrap via AES-GCM ─► wrapped DEK  (one "key slot" per secret)
//   DEK (random AES-256-GCM key)
//     └─ AES-GCM (random 96-bit IV, AAD-bound) ─► encrypted payload
//
// The DEK never touches storage in plaintext. During a session only a
// non-extractable copy of it lives in memory. See docs/SECURITY-MODEL.md.

export const VAULT_FORMAT = 1;
export const PIN_ITERATIONS = 600_000; // OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
export const RECOVERY_ITERATIONS = 100_000; // recovery code already carries 160 bits of entropy
export const MIN_SECRET_LENGTH = 4; // 4-digit PINs are allowed by product decision; see assessSecret()
export const MIN_ITERATIONS = 100_000; // floor accepted when *opening* a slot (defends against downgraded records)

const AAD_DEK = 'jozansag-szamlalo|dek|v1';
const AAD_PAYLOAD = 'jozansag-szamlalo|payload|v1';
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

export class VaultError extends Error {
  /** @param {'NO_CRYPTO'|'WRONG_SECRET'|'CORRUPTED'|'WEAK_SECRET'|'UNSUPPORTED'} code */
  constructor(code, message, options) {
    super(message, options);
    this.name = 'VaultError';
    this.code = code;
  }
}

function subtle() {
  const s = globalThis.crypto?.subtle;
  if (!s) {
    throw new VaultError('NO_CRYPTO',
      'A böngésző nem támogatja a biztonságos titkosítást (Web Crypto). Biztonságos (https) kapcsolat szükséges.');
  }
  return s;
}

export function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function toB64(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromB64(b64) {
  if (typeof b64 !== 'string') throw new VaultError('CORRUPTED', 'Sérült adat (base64).');
  try {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  } catch (cause) {
    throw new VaultError('CORRUPTED', 'Sérült adat (base64).', { cause });
  }
}

export function normalizeSecret(secret) {
  return String(secret).normalize('NFKC');
}

const COMMON_PINS = new Set([
  '1234', '4321', '1122', '1212', '2580', '0852', '1004', '2000', '6969', '1379', '9731',
  '12345', '54321', '123456', '654321', '123123', '121212', '112233', '159753', '147258', '1234567', '12345678', '123456789',
]);

function isSequentialDigits(s) {
  if (!/^\d{4,}$/.test(s)) return false;
  const step = s.charCodeAt(1) - s.charCodeAt(0);
  if (Math.abs(step) !== 1) return false;
  for (let i = 2; i < s.length; i++) if (s.charCodeAt(i) - s.charCodeAt(i - 1) !== step) return false;
  return true;
}

/** Rejects secrets that are too short or among the first guesses any attacker tries. */
export function assertSecretStrength(secret) {
  const s = normalizeSecret(secret);
  if (s.length < MIN_SECRET_LENGTH) {
    throw new VaultError('WEAK_SECRET', `A PIN-kódnak legalább ${MIN_SECRET_LENGTH} karakterből kell állnia.`);
  }
  if (/^(.)\1+$/.test(s) || isSequentialDigits(s) || COMMON_PINS.has(s)) {
    throw new VaultError('WEAK_SECRET', 'Ez a PIN-kód túl könnyen kitalálható. Válassz másikat.');
  }
}

/**
 * Rough resistance to an OFFLINE attack (someone who copied the device storage).
 * The UI shows this honestly; the throttle only protects the on-screen PIN pad.
 *   weak   – ≤ 5 digits: 10^5 guesses, seconds to minutes on one GPU
 *   fair   – 6–9 digits or a short mixed password: minutes to weeks
 *   strong – ≥ 12 characters, or ≥ 10 with letters and digits/symbols, or 3+ words
 */
export function assessSecret(secret) {
  const s = normalizeSecret(secret ?? '');
  const digitsOnly = /^\d+$/.test(s);
  if (digitsOnly && s.length <= 5) return 'weak';
  if (digitsOnly) return 'fair';
  const words = s.trim().split(/[\s\-_.]+/).filter((w) => w.length >= 3);
  const classes = [/[a-zá-űäöüß]/i, /\d/, /[^\p{L}\d]/u].filter((r) => r.test(s)).length;
  if (s.length >= 12 || words.length >= 3 || (s.length >= 10 && classes >= 2)) return 'strong';
  return s.length >= MIN_SECRET_LENGTH ? 'fair' : 'weak';
}

/**
 * PBKDF2-HMAC-SHA-256 → non-extractable AES-256-GCM key usable only to wrap/unwrap the DEK.
 * Exported for tests; the raw key material can never be read back out.
 */
export async function deriveKek(secret, salt, iterations) {
  if (!(salt instanceof Uint8Array) || salt.length < 16) throw new VaultError('CORRUPTED', 'Érvénytelen só (salt).');
  if (!Number.isInteger(iterations) || iterations < 1) throw new VaultError('CORRUPTED', 'Érvénytelen iterációszám.');
  const s = subtle();
  const base = await s.importKey('raw', enc.encode(normalizeSecret(secret)), 'PBKDF2', false, ['deriveKey']);
  return s.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

/** Creates a fresh, extractable DEK. Only used transiently while creating key slots. */
export async function generateDek() {
  return subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** Wraps `dek` under a KEK derived from `secret`; returns a serializable key slot. */
export async function createKeySlot(dek, secret, iterations) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const kek = await deriveKek(secret, salt, iterations);
  const wrapped = await subtle().wrapKey('raw', dek, kek, {
    name: 'AES-GCM', iv, additionalData: enc.encode(AAD_DEK),
  });
  return {
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toB64(salt) },
    iv: toB64(iv),
    wrapped: toB64(wrapped),
  };
}

/**
 * Unwraps the DEK from a key slot. A failed GCM tag check here means the secret
 * is wrong (or the slot itself is damaged) – reported as WRONG_SECRET.
 */
export async function openKeySlot(slot, secret, { extractable = false, minIterations = MIN_ITERATIONS } = {}) {
  if (!slot?.kdf || slot.kdf.name !== 'PBKDF2' || slot.kdf.hash !== 'SHA-256' || !Number.isInteger(slot.kdf.iterations)) {
    throw new VaultError('CORRUPTED', 'A kulcstároló sérült vagy ismeretlen formátumú.');
  }
  if (slot.kdf.iterations < minIterations) {
    // A record with a lowered cost would make brute force cheaper; never accept it silently.
    throw new VaultError('CORRUPTED', 'A kulcstároló biztonsági paraméterei a megengedettnél gyengébbek.');
  }
  const kek = await deriveKek(secret, fromB64(slot.kdf.salt), slot.kdf.iterations);
  try {
    return await subtle().unwrapKey(
      'raw', fromB64(slot.wrapped), kek,
      { name: 'AES-GCM', iv: fromB64(slot.iv), additionalData: enc.encode(AAD_DEK) },
      { name: 'AES-GCM', length: 256 }, extractable, ['encrypt', 'decrypt'],
    );
  } catch (cause) {
    throw new VaultError('WRONG_SECRET', 'Hibás PIN-kód vagy helyreállító kód.', { cause });
  }
}

export async function encryptPayload(dek, obj) {
  const iv = randomBytes(12);
  const ct = await subtle().encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(AAD_PAYLOAD) },
    dek,
    enc.encode(JSON.stringify(obj)),
  );
  return { iv: toB64(iv), ct: toB64(ct) };
}

/** A failed tag check with a *correct* DEK means the ciphertext was altered or damaged. */
export async function decryptPayload(dek, payload) {
  if (!payload || typeof payload.iv !== 'string' || typeof payload.ct !== 'string') {
    throw new VaultError('CORRUPTED', 'A titkosított adat hiányos.');
  }
  let plain;
  try {
    plain = await subtle().decrypt(
      { name: 'AES-GCM', iv: fromB64(payload.iv), additionalData: enc.encode(AAD_PAYLOAD) },
      dek,
      fromB64(payload.ct),
    );
  } catch (cause) {
    if (cause instanceof VaultError) throw cause;
    throw new VaultError('CORRUPTED', 'A titkosított adat sérült, nem fejthető vissza.', { cause });
  }
  try {
    return JSON.parse(dec.decode(plain));
  } catch (cause) {
    throw new VaultError('CORRUPTED', 'A visszafejtett adat sérült.', { cause });
  }
}

// Recovery codes: 20 random bytes → 32 Crockford base32 chars, shown as 8 groups of 4.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateRecoveryCode() {
  const bytes = randomBytes(20);
  let bits = 0, value = 0, out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out.match(/.{4}/g).join('-');
}

/** Accepts user-typed codes: case-insensitive, ignores spaces/dashes, maps O→0, I/L→1. */
export function normalizeRecoveryCode(input) {
  const s = String(input).toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (!/^[0-9A-HJKMNP-TV-Z]{32}$/.test(s)) {
    throw new VaultError('WRONG_SECRET', 'A helyreállító kód formátuma nem megfelelő (32 karakter).');
  }
  return s.match(/.{4}/g).join('-');
}
