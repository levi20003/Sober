// VaultStore: the only module that reads/writes user data.
//
// Stored keys (all in one KV store):
//   'vault'      – current encrypted record (see VaultRecord below)
//   'vault.prev' – previous good record, written atomically with 'vault'
//   'meta'       – NON-sensitive plaintext: unlock throttling, reminder preference
//
// VaultRecord = { format, revision, slots: { pin, recovery }, payload: { iv, ct } }

import {
  VAULT_FORMAT, PIN_ITERATIONS, RECOVERY_ITERATIONS, MIN_ITERATIONS, VaultError,
  assertSecretStrength, createKeySlot, decryptPayload, encryptPayload, generateDek,
  generateRecoveryCode, normalizeRecoveryCode, openKeySlot, randomBytes, toB64,
} from '../crypto/vault.js';
import { validateData, SchemaError, SCHEMA_VERSION } from '../domain/schema.js';
import { createBackup, inspectBackup, parseBackupText, BackupError } from '../domain/backupFile.js';

const K_VAULT = 'vault';
const K_PREV = 'vault.prev';
const K_META = 'meta';

export const FREE_ATTEMPTS = 5;
export const MAX_DELAY_MS = 5 * 60_000;

/**
 * Remaining wait, robust against clock changes (F6): the wait is measured from `lockedAt` and can never exceed the
 * delay that was set. If the clock went BACKWARDS (now < lockedAt), the full delay applies again, but never more.
 * A clock moved forward does end the wait early; an attacker who controls the clock also controls the storage,
 * so this throttle only protects the on-screen PIN pad (see docs/SECURITY-MODEL.md).
 */
export function remainingWait(meta, now) {
  const delay = Math.min(MAX_DELAY_MS, Math.max(0, meta.lockDelay ?? Math.max(0, (meta.lockedUntil ?? 0) - now)));
  if (!delay) return 0;
  const at = Number.isFinite(meta.lockedAt) ? meta.lockedAt : (meta.lockedUntil ?? 0) - delay;
  const elapsed = now - at;
  if (elapsed < 0) return delay;
  return Math.max(0, Math.min(delay, delay - elapsed));
}

/** Delay before the next unlock attempt is allowed, given consecutive failures. */
export function throttleDelay(failures) {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(MAX_DELAY_MS, 2 ** (failures - FREE_ATTEMPTS) * 15_000);
}

// A meta rekord NEM titkosított (a zárolóképernyőnek és a háttérfolyamatnak olvasnia kell). Személyes tartalom nincs benne:
//  pinHint: egy csak számjegyes PIN hossza (a gyors billentyűzethez; a Beállításokban kikapcsolható: quickPin=false)
//  lastBackup / backupSnoozeUntil: a mentés-emlékeztető időpontjai.
const DEFAULT_META = { failedAttempts: 0, lockedUntil: 0, lockedAt: 0, lockDelay: 0, reminders: { enabled: false, time: '20:00' }, pinHint: null, quickPin: true, lastBackup: null, backupSnoozeUntil: null };

export class VaultStore {
  #dek = null;
  #data = null;
  #revision = 0;

  constructor(backend, {
    pinIterations = PIN_ITERATIONS, recoveryIterations = RECOVERY_ITERATIONS,
    minIterations = MIN_ITERATIONS, now = () => Date.now(),
    appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
  } = {}) {
    this.appVersion = String(appVersion);
    if (pinIterations < minIterations || recoveryIterations < minIterations) {
      throw new RangeError('Iteration count below the configured minimum.');
    }
    this.backend = backend;
    this.pinIterations = pinIterations;
    this.recoveryIterations = recoveryIterations;
    this.minIterations = minIterations;
    this.now = now;
  }

  #open(slot, secret, extractable = false) {
    return openKeySlot(slot, secret, { extractable, minIterations: this.minIterations });
  }

  /** Every PIN check (unlock, change PIN, new recovery code, restore previous) goes through the throttle (F2). */
  async #guardedOpen(slot, secret, extractable = false) {
    const wait = await this.attemptWaitMs();
    if (wait > 0) {
      const err = new VaultError('WRONG_SECRET', `Túl sok sikertelen próbálkozás. Próbáld újra ${Math.ceil(wait / 1000)} másodperc múlva.`);
      err.retryAfterMs = wait;
      throw err;
    }
    try {
      const dek = await this.#open(slot, secret, extractable);
      const m = await this.getMeta();
      if (m.failedAttempts || m.lockDelay || m.lockedUntil) await this.setMeta({ failedAttempts: 0, lockedUntil: 0, lockedAt: 0, lockDelay: 0 });
      return dek;
    } catch (err) {
      if (err.code === 'WRONG_SECRET') await this.#registerFailure();
      throw err;
    }
  }

  /** For tests (F5): the session key must never be exportable. */
  get keyIsExtractable() { return this.#dek ? this.#dek.extractable : null; }

  get isUnlocked() { return this.#dek !== null; }
  get isPersistent() { return this.backend.persistent !== false; }

  /** Returns a deep copy; mutate it and pass it to save(). */
  get data() {
    if (!this.#data) throw new VaultError('UNSUPPORTED', 'A napló zárolva van.');
    return structuredClone(this.#data);
  }

  /** Cheap copy of settings only (avoids cloning the whole journal, e.g. for auto-lock checks). */
  get settings() {
    if (!this.#data) throw new VaultError('UNSUPPORTED', 'A napló zárolva van.');
    return { ...this.#data.settings };
  }

  async exists() {
    return (await this.backend.get(K_VAULT)) !== undefined;
  }

  async getMeta() {
    const m = await this.backend.get(K_META);
    return { ...DEFAULT_META, ...m, reminders: { ...DEFAULT_META.reminders, ...m?.reminders } };
  }

  /** A gyors PIN-billentyűzethez: csak számjegyes PIN hosszát jegyezzük meg (ha a felhasználó nem kapcsolta ki). */
  async #rememberPinShape(pin) {
    const m = await this.getMeta();
    const hint = m.quickPin !== false && /^\d{4,12}$/.test(String(pin)) ? String(pin).length : null;
    if (m.pinHint !== hint) await this.setMeta({ pinHint: hint });
  }

  async setMeta(patch) {
    const m = await this.getMeta();
    await this.backend.putMany({ [K_META]: { ...m, ...patch } });
  }

  /** Creates a new vault. Returns the one-time recovery code to show the user. */
  async create(pin, initialData) {
    assertSecretStrength(pin);
    if (await this.exists()) throw new VaultError('UNSUPPORTED', 'Már létezik napló ezen az eszközön.');
    const data = validateData(initialData);
    const dek = await generateDek();
    const recoveryCode = generateRecoveryCode();
    const record = {
      format: VAULT_FORMAT,
      revision: 1,
      slots: {
        pin: await createKeySlot(dek, pin, this.pinIterations),
        recovery: await createKeySlot(dek, recoveryCode, this.recoveryIterations),
      },
      payload: await encryptPayload(dek, data),
    };
    await this.backend.putMany({ [K_VAULT]: record, [K_META]: { ...DEFAULT_META } });
    await this.#adopt(record, await reimportNonExtractable(dek), data);
    await this.#rememberPinShape(pin);
    return { recoveryCode };
  }

  /** Remaining wait in ms before another attempt is allowed (0 = may try now). */
  async attemptWaitMs() {
    return remainingWait(await this.getMeta(), this.now());
  }

  async unlock(pin) {
    const record = await this.#unlockWith('pin', pin);
    await this.#rememberPinShape(pin);
    return record;
  }

  /** Forgot-PIN path: opens the vault with the recovery code and sets a new PIN. */
  async recover(recoveryCode, newPin) {
    assertSecretStrength(newPin);
    const code = normalizeRecoveryCode(recoveryCode);
    const record = await this.#unlockWith('recovery', code, { extractable: true });
    const dek = record.extractableDek;
    record.slots = { ...record.slots, pin: await createKeySlot(dek, newPin, this.pinIterations) };
    record.revision += 1;
    await this.#writeRecord(record, null, { revokePrevious: true });
    await this.#rememberPinShape(newPin);
  }

  async #unlockWith(slotName, secret, { extractable = false } = {}) {
    const record = await this.#readRecord(K_VAULT);
    const dek = await this.#guardedOpen(record.slots?.[slotName], secret, extractable);
    const data = await this.#decryptAndValidate(dek, record.payload);
    await this.#adopt(record, extractable ? await reimportNonExtractable(dek) : dek, data);
    if (extractable) record.extractableDek = dek;
    return record;
  }

  async #registerFailure() {
    const m = await this.getMeta();
    const failedAttempts = m.failedAttempts + 1;
    const delay = throttleDelay(failedAttempts);
    await this.setMeta({ failedAttempts, lockedUntil: this.now() + delay, lockedAt: this.now(), lockDelay: delay });
  }

  async #decryptAndValidate(dek, payload) {
    const raw = await decryptPayload(dek, payload);
    if (typeof raw?.schemaVersion === 'number' && raw.schemaVersion > SCHEMA_VERSION) {
      // Visszalépés régebbi verzióra (M5): az adat ép, csak ez az app még nem ismeri. Soha ne „javítsuk” vagy írjuk felül.
      throw new VaultError('UNSUPPORTED', 'A naplót az alkalmazás újabb verziója hozta létre. Kérlek, frissítsd az alkalmazást; az adataid épek.');
    }
    try {
      return validateData(raw);
    } catch (err) {
      if (err instanceof SchemaError) {
        throw new VaultError('CORRUPTED', `A napló szerkezete sérült: ${err.message}`, { cause: err });
      }
      throw err;
    }
  }

  async #readRecord(key) {
    const record = await this.backend.get(key);
    if (record === undefined) throw new VaultError('CORRUPTED', 'Nem található mentett napló.');
    if (record?.format !== VAULT_FORMAT) {
      throw new VaultError(record?.format > VAULT_FORMAT ? 'UNSUPPORTED' : 'CORRUPTED',
        record?.format > VAULT_FORMAT
          ? 'A napló az alkalmazás újabb verziójával készült. Frissítsd az alkalmazást.'
          : 'A mentett napló formátuma ismeretlen vagy sérült.');
    }
    return record;
  }

  async #adopt(record, dek, data) {
    this.#dek = dek;
    this.#data = data;
    this.#revision = record.revision;
  }

  /** Validates, encrypts and atomically persists. In-memory state only changes on success. */
  async save(nextData) {
    if (!this.#dek) throw new VaultError('UNSUPPORTED', 'A napló zárolva van.');
    const data = validateData(nextData);
    const current = await this.#readRecord(K_VAULT);
    if (current.revision !== this.#revision) {
      // Another tab/window saved in the meantime (F4): never overwrite its changes silently.
      throw new VaultError('CONFLICT', 'A naplót közben egy másik ablakban módosítottad. Töltsd újra az oldalt, hogy a legfrissebb állapotot lásd.');
    }
    const record = { ...current, revision: this.#revision + 1, payload: await encryptPayload(this.#dek, data) };
    await this.#writeRecord(record, current);
    this.#data = data;
    return this.data;
  }

  async #writeRecord(record, previous, { revokePrevious = false } = {}) {
    const { extractableDek, ...clean } = record;
    const prev = revokePrevious ? clean : (previous ?? (await this.backend.get(K_VAULT)));
    const entries = { [K_VAULT]: clean };
    if (prev) entries[K_PREV] = prev; // revokePrevious: the old secret's slot must not survive in vault.prev (F1)
    await this.backend.putMany(entries);
    this.#revision = clean.revision;
  }

  /** Called when the current record is CORRUPTED but the previous copy is fine. */
  async restorePrevious(pin) {
    const prev = await this.#readRecord(K_PREV);
    const dek = await this.#guardedOpen(prev.slots.pin, pin);
    const data = await this.#decryptAndValidate(dek, prev.payload);
    await this.backend.putMany({ [K_VAULT]: prev });
    await this.#adopt(prev, dek, data);
  }

  async hasPrevious() {
    return (await this.backend.get(K_PREV)) !== undefined;
  }

  async changePin(oldPin, newPin) {
    assertSecretStrength(newPin);
    const record = await this.#readRecord(K_VAULT);
    const dek = await this.#guardedOpen(record.slots.pin, oldPin, true);
    await this.#writeRecord({ ...record, revision: record.revision + 1, slots: { ...record.slots, pin: await createKeySlot(dek, newPin, this.pinIterations) } }, null, { revokePrevious: true });
    await this.#rememberPinShape(newPin);
  }

  /** Invalidates the old recovery code and returns a new one. */
  async regenerateRecoveryCode(pin) {
    const record = await this.#readRecord(K_VAULT);
    const dek = await this.#guardedOpen(record.slots.pin, pin, true);
    const recoveryCode = generateRecoveryCode();
    const next = { ...record, revision: record.revision + 1, slots: { ...record.slots, recovery: await createKeySlot(dek, recoveryCode, this.recoveryIterations) } };
    // The previous copy still holds the OLD recovery slot – drop it so the old code is truly revoked.
    await this.backend.putMany({ [K_VAULT]: next, [K_PREV]: next });
    this.#revision = next.revision;
    return { recoveryCode };
  }

  /**
   * Titkosított mentés (v2): a vault rekord + verziók + SHA-256 ellenőrzőösszeg (src/domain/backupFile.js).
   * Csak PIN-kóddal vagy helyreállító kóddal nyitható.
   */
  async exportEncryptedBackup() {
    const record = await this.#readRecord(K_VAULT);
    return createBackup(record, { appVersion: this.appVersion, schemaVersion: this.#data?.schemaVersion ?? SCHEMA_VERSION, now: this.now() });
  }

  /**
   * A kész mentésfájl ellenőrzése (M6): újraolvasás, ellenőrzőösszeg, visszafejtés a jelenlegi kulccsal, séma.
   * Csak ezután mondjuk a felhasználónak, hogy „A mentés elkészült és ellenőrizve”.
   */
  async verifyBackup(text) {
    if (!this.#dek) throw new VaultError('UNSUPPORTED', 'A napló zárolva van.');
    const { record } = await inspectBackup(parseBackupText(text));
    try {
      await this.#decryptAndValidate(this.#dek, record.payload);
    } catch (err) {
      throw new BackupError('DAMAGED', undefined, { cause: err });
    }
    return true;
  }

  /**
   * Visszaállítás mentésből. Mindent ellenőriz, MIELŐTT bármit felülírna ezen az eszközön.
   * @param {object} backup   a beolvasott mentésfájl (v1 vagy v2)
   * @param {string} secret   PIN-kód, vagy (ha `newPin` meg van adva) a helyreállító kód
   * @param {{newPin?: string}} [opts] helyreállító kódos visszaállításnál az új PIN-kód (M2)
   */
  async importEncryptedBackup(backup, secret, { newPin } = {}) {
    const { record } = await inspectBackup(backup);
    if (newPin !== undefined) assertSecretStrength(newPin);
    const viaRecovery = newPin !== undefined;
    let dek = viaRecovery
      ? await this.#open(record.slots.recovery, normalizeRecoveryCode(secret), true)
      : await this.#open(record.slots.pin, secret);
    let data;
    try {
      data = await this.#decryptAndValidate(dek, record.payload);
    } catch (err) {
      if (err?.code === 'UNSUPPORTED') throw err;
      throw new BackupError('DAMAGED', undefined, { cause: err });
    }
    let next = record;
    if (viaRecovery) {
      next = { ...record, revision: record.revision + 1, slots: { ...record.slots, pin: await createKeySlot(dek, newPin, this.pinIterations) } };
      dek = await reimportNonExtractable(dek);
    }
    const current = await this.backend.get(K_VAULT);
    await this.backend.putMany({ [K_VAULT]: next, ...(current ? { [K_PREV]: current } : {}) });
    await this.#adopt(next, dek, data);
    await this.#rememberPinShape(viaRecovery ? newPin : secret);
  }

  lock() {
    this.#dek = null;
    this.#data = null;
  }

  /**
   * Single-step deletion. Overwrites the stored records with random bytes first
   * (best effort – browsers do not guarantee physical erasure), then removes
   * the whole database. Destroying the wrapped keys makes any remnant ciphertext
   * undecryptable ("crypto-shredding").
   */
  async wipe() {
    this.lock();
    const junk = { format: 0, junk: toB64(randomBytes(4096)) };
    try {
      await this.backend.putMany({ [K_VAULT]: junk, [K_PREV]: junk, [K_META]: junk });
    } catch { /* quota/corruption must never block deletion */ }
    await this.backend.delete([K_VAULT, K_PREV, K_META]);
    await this.backend.destroy();
  }
}

async function reimportNonExtractable(dek) {
  const raw = await crypto.subtle.exportKey('raw', dek);
  try {
    return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  } finally {
    new Uint8Array(raw).fill(0);
  }
}
