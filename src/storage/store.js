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
import { validateData, SchemaError } from '../domain/schema.js';

const K_VAULT = 'vault';
const K_PREV = 'vault.prev';
const K_META = 'meta';

export const FREE_ATTEMPTS = 5;
export const MAX_DELAY_MS = 5 * 60_000;

/** Delay before the next unlock attempt is allowed, given consecutive failures. */
export function throttleDelay(failures) {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(MAX_DELAY_MS, 2 ** (failures - FREE_ATTEMPTS) * 15_000);
}

const DEFAULT_META = { failedAttempts: 0, lockedUntil: 0, reminders: { enabled: false, time: '20:00' } };

export class VaultStore {
  #dek = null;
  #data = null;
  #revision = 0;

  constructor(backend, {
    pinIterations = PIN_ITERATIONS, recoveryIterations = RECOVERY_ITERATIONS,
    minIterations = MIN_ITERATIONS, now = () => Date.now(),
  } = {}) {
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
    await this.#adopt(record, dek, data);
    return { recoveryCode };
  }

  /** Remaining wait in ms before another attempt is allowed (0 = may try now). */
  async attemptWaitMs() {
    const m = await this.getMeta();
    return Math.max(0, m.lockedUntil - this.now());
  }

  async unlock(pin) {
    return this.#unlockWith('pin', pin);
  }

  /** Forgot-PIN path: opens the vault with the recovery code and sets a new PIN. */
  async recover(recoveryCode, newPin) {
    assertSecretStrength(newPin);
    const code = normalizeRecoveryCode(recoveryCode);
    const record = await this.#unlockWith('recovery', code, { extractable: true });
    const dek = record.extractableDek;
    record.slots = { ...record.slots, pin: await createKeySlot(dek, newPin, this.pinIterations) };
    record.revision += 1;
    await this.#writeRecord(record);
  }

  async #unlockWith(slotName, secret, { extractable = false } = {}) {
    const wait = await this.attemptWaitMs();
    if (wait > 0) {
      const err = new VaultError('WRONG_SECRET', `Túl sok sikertelen próbálkozás. Próbáld újra ${Math.ceil(wait / 1000)} másodperc múlva.`);
      err.retryAfterMs = wait;
      throw err;
    }
    const record = await this.#readRecord(K_VAULT);
    let dek;
    try {
      dek = await this.#open(record.slots?.[slotName], secret, extractable);
    } catch (err) {
      if (err.code === 'WRONG_SECRET') await this.#registerFailure();
      throw err;
    }
    await this.setMeta({ failedAttempts: 0, lockedUntil: 0 });
    const data = await this.#decryptAndValidate(dek, record.payload);
    await this.#adopt(record, extractable ? await reimportNonExtractable(dek) : dek, data);
    if (extractable) record.extractableDek = dek;
    return record;
  }

  async #registerFailure() {
    const m = await this.getMeta();
    const failedAttempts = m.failedAttempts + 1;
    await this.setMeta({ failedAttempts, lockedUntil: this.now() + throttleDelay(failedAttempts) });
  }

  async #decryptAndValidate(dek, payload) {
    const raw = await decryptPayload(dek, payload);
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
    const record = { ...current, revision: this.#revision + 1, payload: await encryptPayload(this.#dek, data) };
    await this.#writeRecord(record, current);
    this.#data = data;
    return this.data;
  }

  async #writeRecord(record, previous) {
    const { extractableDek, ...clean } = record;
    const prev = previous ?? (await this.backend.get(K_VAULT));
    const entries = { [K_VAULT]: clean };
    if (prev) entries[K_PREV] = prev;
    await this.backend.putMany(entries);
    this.#revision = clean.revision;
  }

  /** Called when the current record is CORRUPTED but the previous copy is fine. */
  async restorePrevious(pin) {
    const prev = await this.#readRecord(K_PREV);
    const dek = await this.#open(prev.slots.pin, pin);
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
    const dek = await this.#open(record.slots.pin, oldPin, true);
    await this.#writeRecord({ ...record, revision: record.revision + 1, slots: { ...record.slots, pin: await createKeySlot(dek, newPin, this.pinIterations) } });
  }

  /** Invalidates the old recovery code and returns a new one. */
  async regenerateRecoveryCode(pin) {
    const record = await this.#readRecord(K_VAULT);
    const dek = await this.#open(record.slots.pin, pin, true);
    const recoveryCode = generateRecoveryCode();
    const next = { ...record, revision: record.revision + 1, slots: { ...record.slots, recovery: await createKeySlot(dek, recoveryCode, this.recoveryIterations) } };
    // The previous copy still holds the OLD recovery slot – drop it so the old code is truly revoked.
    await this.backend.putMany({ [K_VAULT]: next, [K_PREV]: next });
    this.#revision = next.revision;
    return { recoveryCode };
  }

  /** Encrypted backup: the vault record itself. Restorable only with the PIN or recovery code. */
  async exportEncryptedBackup() {
    const record = await this.#readRecord(K_VAULT);
    return { app: 'jozansag-szamlalo', kind: 'encrypted-backup', exportedAt: new Date(this.now()).toISOString(), record };
  }

  /** Verifies the backup opens with `pin` BEFORE replacing anything on this device. */
  async importEncryptedBackup(backup, pin) {
    if (backup?.app !== 'jozansag-szamlalo' || backup?.kind !== 'encrypted-backup' || backup.record?.format !== VAULT_FORMAT) {
      throw new VaultError('CORRUPTED', 'Ez a fájl nem Józanság-számláló titkosított mentés.');
    }
    const dek = await this.#open(backup.record.slots?.pin, pin);
    const data = await this.#decryptAndValidate(dek, backup.record.payload);
    const current = await this.backend.get(K_VAULT);
    await this.backend.putMany({ [K_VAULT]: backup.record, ...(current ? { [K_PREV]: current } : {}) });
    await this.#adopt(backup.record, dek, data);
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
