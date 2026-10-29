// Key-value persistence backends. All values are structured-cloneable JSON objects.
// Interface: get(key), putMany(entries: Record<string, any>) [atomic], delete(keys[]), destroy()

export class StorageError extends Error {
  /** @param {'UNAVAILABLE'|'QUOTA'|'WRITE_FAILED'|'READ_FAILED'} code */
  constructor(code, message, options) {
    super(message, options);
    this.name = 'StorageError';
    this.code = code;
  }
}

const MESSAGES = {
  UNAVAILABLE: 'A böngésző nem engedi a helyi tárolást (pl. privát mód). Az adataid csak ebben a munkamenetben maradnak meg.',
  QUOTA: 'Betelt az eszköz tárhelye, ezért a mentés nem sikerült. Szabadíts fel helyet, vagy készíts exportot.',
  WRITE_FAILED: 'A mentés nem sikerült. Az előző mentett állapot megmaradt.',
  READ_FAILED: 'A tárolt adat olvasása nem sikerült.',
};

export function storageError(code, cause) {
  return new StorageError(code, MESSAGES[code], { cause });
}

function isQuotaError(err) {
  return err?.name === 'QuotaExceededError' || err?.code === 22 || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

export class MemoryBackend {
  constructor({ quotaBytes = Infinity } = {}) {
    this.map = new Map();
    this.quotaBytes = quotaBytes;
    this.persistent = false;
    this.kind = 'memory';
  }
  async get(key) {
    return this.map.has(key) ? structuredClone(this.map.get(key)) : undefined;
  }
  async putMany(entries) {
    const next = new Map(this.map);
    for (const [k, v] of Object.entries(entries)) next.set(k, structuredClone(v));
    const size = [...next.values()].reduce((n, v) => n + JSON.stringify(v).length, 0);
    if (size > this.quotaBytes) throw storageError('QUOTA');
    this.map = next; // all-or-nothing
  }
  async delete(keys) {
    for (const k of keys) this.map.delete(k);
  }
  async destroy() {
    this.map.clear();
  }
}

const DB_NAME = 'jozansag-szamlalo';
const STORE = 'kv';

export class IndexedDBBackend {
  constructor(db) {
    this.db = db;
    this.persistent = true;
    this.kind = 'indexeddb';
  }

  /**
   * Opens the database. Times out instead of hanging forever when a pending
   * deleteDatabase() is blocked by another connection (e.g. a second tab).
   */
  static open(idb = globalThis.indexedDB, { timeoutMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
      if (!idb) return reject(storageError('UNAVAILABLE'));
      let req;
      try {
        req = idb.open(DB_NAME, 1);
      } catch (cause) {
        return reject(storageError('UNAVAILABLE', cause));
      }
      const timer = setTimeout(() => reject(storageError('UNAVAILABLE')), timeoutMs);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => {
        clearTimeout(timer);
        const db = req.result;
        const backend = new IndexedDBBackend(db);
        // Another tab (or our own wipe) wants to delete/upgrade the DB: release it.
        db.onversionchange = () => { db.close(); backend.closed = true; };
        resolve(backend);
      };
      req.onerror = () => { clearTimeout(timer); reject(storageError('UNAVAILABLE', req.error)); };
    });
  }

  #tx(mode, fn) {
    return new Promise((resolve, reject) => {
      if (this.closed) return reject(storageError('UNAVAILABLE'));
      let tx, result;
      try {
        tx = this.db.transaction(STORE, mode);
        result = fn(tx.objectStore(STORE));
      } catch (cause) {
        return reject(storageError(isQuotaError(cause) ? 'QUOTA' : mode === 'readonly' ? 'READ_FAILED' : 'WRITE_FAILED', cause));
      }
      tx.oncomplete = () => resolve(result?.result);
      const onFail = () => {
        const err = tx.error;
        reject(storageError(isQuotaError(err) ? 'QUOTA' : mode === 'readonly' ? 'READ_FAILED' : 'WRITE_FAILED', err));
      };
      tx.onerror = onFail;
      tx.onabort = onFail;
    });
  }

  get(key) {
    return this.#tx('readonly', (s) => s.get(key));
  }
  async putMany(entries) {
    // One readwrite transaction → IndexedDB commits all entries or none.
    await this.#tx('readwrite', (s) => {
      for (const [k, v] of Object.entries(entries)) s.put(v, k);
    });
  }
  async delete(keys) {
    await this.#tx('readwrite', (s) => {
      for (const k of keys) s.delete(k);
    });
  }
  async destroy() {
    this.closed = true;
    this.db.close();
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  }
}

const LS_PREFIX = 'jozansag-szamlalo:';

/** Value returned for an entry that exists but cannot be parsed. The store reports it as CORRUPTED. */
export const UNREADABLE = Object.freeze({ format: -1, unreadable: true });

/**
 * Fallback for browsers/modes where IndexedDB is unavailable. Values are JSON
 * strings (only ever ciphertext records and non-sensitive meta).
 * localStorage has no transactions, so putMany() rolls back on failure to
 * keep multi-key writes all-or-nothing.
 */
export class LocalStorageBackend {
  constructor(storage) {
    this.storage = storage;
    this.persistent = true;
    this.kind = 'localstorage';
  }

  async get(key) {
    let raw;
    try {
      raw = this.storage.getItem(LS_PREFIX + key);
    } catch (cause) {
      throw storageError('READ_FAILED', cause);
    }
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      // Never report "missing": that would send the user to first-time setup over their data.
      return UNREADABLE;
    }
  }

  async putMany(entries) {
    const serialized = Object.entries(entries).map(([k, v]) => [LS_PREFIX + k, JSON.stringify(v)]);
    const previous = serialized.map(([k]) => [k, this.storage.getItem(k)]);
    try {
      for (const [k, v] of serialized) this.storage.setItem(k, v);
    } catch (cause) {
      for (const [k, old] of previous) {
        try {
          if (old === null) this.storage.removeItem(k);
          else this.storage.setItem(k, old);
        } catch { /* restoring a value that previously fit; nothing more we can do */ }
      }
      throw storageError(isQuotaError(cause) ? 'QUOTA' : 'WRITE_FAILED', cause);
    }
  }

  async delete(keys) {
    for (const k of keys) this.storage.removeItem(LS_PREFIX + k);
  }

  async destroy() {
    const ours = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k?.startsWith(LS_PREFIX)) ours.push(k);
    }
    for (const k of ours) this.storage.removeItem(k);
  }
}

/** Accessing window.localStorage itself can throw (SecurityError) when storage is blocked. */
function probeLocalStorage(getStorage) {
  try {
    const ls = getStorage();
    if (!ls) return null;
    const probe = `${LS_PREFIX}__probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

/**
 * Picks the most durable working backend:
 *   1. IndexedDB  – large quota, atomic transactions, readable by the service worker (reminders)
 *   2. localStorage – ~5 MB, synchronous; used when IndexedDB is missing or blocked
 *   3. memory     – nothing persists; `persistent: false` lets the UI warn the user
 * If a journal already lives in localStorage (from an earlier fallback) and IndexedDB is
 * empty, localStorage wins so the user never "loses" their journal to a backend switch.
 */
export async function openBestBackend({
  openIndexedDB = () => IndexedDBBackend.open(),
  getLocalStorage = () => globalThis.localStorage,
} = {}) {
  const ls = probeLocalStorage(getLocalStorage);
  const lsBackend = ls ? new LocalStorageBackend(ls) : null;

  try {
    const idb = await openIndexedDB();
    await idb.putMany({ '__probe': 1 });
    await idb.delete(['__probe']);
    if (lsBackend && (await idb.get('vault')) === undefined && (await lsBackend.get('vault')) !== undefined) {
      return lsBackend;
    }
    return idb;
  } catch (err) {
    console.warn('IndexedDB nem érhető el.', err);
  }
  if (lsBackend) return lsBackend;
  console.warn('A localStorage sem érhető el, memóriában tárolunk.');
  return new MemoryBackend();
}
