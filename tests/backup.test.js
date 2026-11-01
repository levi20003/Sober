// 3. fázis: mentés és visszaállítás (docs/audit/2026-11-mentes-audit.md). A javítás előtt ezek a tesztek buktak.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeStore, initial } from './helpers.js';
import { MemoryBackend } from '../src/storage/backends.js';
import { VaultStore } from '../src/storage/store.js';
import { generateDek, createKeySlot, encryptPayload } from '../src/crypto/vault.js';
import { makeEvent, addEvent } from '../src/domain/timeline.js';
import { BACKUP_FORMAT, parseBackupText, inspectBackup, BackupError } from '../src/domain/backupFile.js';
import { readImportText, MAX_IMPORT_BYTES } from '../src/lib/safeJson.js';

const PIN = 'csend-2026';
const NEW_PIN = 'uj-tavasz-77';
const fixture = (name) => JSON.parse(readFileSync(`tests/fixtures/${name}`, 'utf8'));
const DAMAGED = /A mentésfájl sérült vagy hiányos/;

async function storeWithJournal() {
  const { store, backend } = makeStore();
  const { recoveryCode } = await store.create(PIN, initial({ nickname: 'Mentő' }));
  await store.save(addEvent(store.data, makeEvent('note', { note: 'első jegyzet', date: '2026-01-02' })));
  return { store, backend, recoveryCode };
}
/** Egy másik, üres "telefon". */
function otherDevice() {
  const backend = new MemoryBackend();
  return { backend, store: new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 }) };
}
const fileOf = (text, type = 'application/json') => new File([text], 'mentes.json', { type });

// --- M3: v2 mentésformátum --------------------------------------------------------------------
test('M3: an encrypted backup is format v2 with app/schema version, timestamp and a SHA-256 checksum of the record', async () => {
  const { store } = await storeWithJournal();
  const b = await store.exportEncryptedBackup();
  assert.equal(b.app, 'jozansag-szamlalo');
  assert.equal(b.kind, 'encrypted-backup');
  assert.equal(b.formatVersion, BACKUP_FORMAT);
  assert.equal(BACKUP_FORMAT, 2);
  assert.equal(b.schemaVersion, 3);
  assert.equal(typeof b.appVersion, 'string');
  assert.ok(!Number.isNaN(Date.parse(b.exportedAt)));
  assert.match(b.checksum, /^sha256:[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(b).includes('első jegyzet'), 'still encrypted');
});

test('M3: a v2 backup restores on another device with the PIN', async () => {
  const { store } = await storeWithJournal();
  const text = JSON.stringify(await store.exportEncryptedBackup());
  const other = otherDevice();
  await other.store.importEncryptedBackup(parseBackupText(text), PIN);
  assert.equal(other.store.data.profile.nickname, 'Mentő');
  assert.ok(other.store.data.events.some((e) => e.note === 'első jegyzet'));
});

// --- M2: visszaállítás helyreállító kóddal --------------------------------------------------
test('M2: a backup can be restored with the recovery code (forgotten PIN), setting a new PIN', async () => {
  const { store, recoveryCode } = await storeWithJournal();
  const backup = await store.exportEncryptedBackup();
  const other = otherDevice();
  await other.store.importEncryptedBackup(backup, recoveryCode.toLowerCase().replace(/-/g, ' '), { newPin: NEW_PIN });
  assert.equal(other.store.data.profile.nickname, 'Mentő');
  other.store.lock();
  await other.store.unlock(NEW_PIN);
  other.store.lock();
  await assert.rejects(other.store.unlock(PIN), { code: 'WRONG_SECRET' }, 'the old PIN no longer opens the restored copy');
});

// --- M4: sérült fájl ≠ rossz PIN; semmi nem íródik felül -------------------------------------
test('M4: byte flips in ciphertext, wrapped key or IV are reported as a damaged file, not a wrong PIN', async () => {
  const { store } = await storeWithJournal();
  const good = await store.exportEncryptedBackup();
  const flip = (b64) => { const c = b64[5] === 'A' ? 'B' : 'A'; return b64.slice(0, 5) + c + b64.slice(6); };
  const mutations = [
    (b) => { b.record.payload.ct = flip(b.record.payload.ct); },
    (b) => { b.record.payload.iv = flip(b.record.payload.iv); },
    (b) => { b.record.slots.pin.wrapped = flip(b.record.slots.pin.wrapped); },
    (b) => { b.record.slots.pin.iv = flip(b.record.slots.pin.iv); },
    (b) => { b.record.slots.pin.kdf.salt = flip(b.record.slots.pin.kdf.salt); },
  ];
  for (const mutate of mutations) {
    const b = structuredClone(good);
    mutate(b);
    const other = otherDevice();
    const before = await other.store.exists();
    await assert.rejects(other.store.importEncryptedBackup(b, PIN), (err) => err.code === 'DAMAGED' && DAMAGED.test(err.message), mutate.toString());
    assert.equal(await other.store.exists(), before, 'nothing written');
  }
  // A helyes fájl rossz PIN-nel: ez valóban rossz PIN.
  await assert.rejects(otherDevice().store.importEncryptedBackup(structuredClone(good), 'rossz-pin-99'), { code: 'WRONG_SECRET' });
});

test('M4: a failed import leaves the existing journal on this device untouched', async () => {
  const { store, backend } = await storeWithJournal();
  const snapshot = JSON.stringify([...backend.map]);
  const b = await store.exportEncryptedBackup();
  b.record.payload.ct = b.record.payload.ct.slice(0, -8);
  await assert.rejects(store.importEncryptedBackup(b, PIN), { code: 'DAMAGED' });
  assert.equal(JSON.stringify([...backend.map]), snapshot);
});

test('M4: fault injection on the file itself', async () => {
  const { store } = await storeWithJournal();
  const text = JSON.stringify(await store.exportEncryptedBackup());
  // csonka fájl (pl. megszakadt letöltés)
  assert.throws(() => parseBackupText(text.slice(0, Math.floor(text.length * 0.6))), (e) => e.code === 'DAMAGED' && DAMAGED.test(e.message));
  // hiányzó mező
  const missing = JSON.parse(text); delete missing.record.payload;
  await assert.rejects(inspectBackup(missing), { code: 'DAMAGED' });
  const noSum = JSON.parse(text); delete noSum.checksum;
  await assert.rejects(inspectBackup(noSum), { code: 'DAMAGED' }, 'a v2 file without its checksum is damaged, not silently accepted as v1');
  // más alkalmazás JSON-ja
  assert.throws(() => parseBackupText('{"name":"package","version":"1.0.0"}'), (e) => e.code === 'NOT_OURS');
  await assert.rejects(inspectBackup({ app: 'mas-app', kind: 'encrypted-backup', record: {} }), { code: 'NOT_OURS' });
  // üres
  assert.throws(() => parseBackupText(''), { code: 'EMPTY' });
  assert.throws(() => parseBackupText('   \n'), { code: 'EMPTY' });
  // nem JSON (pl. egy kép)
  assert.throws(() => parseBackupText('\u0089PNG\r\n\u001a\n...'), (e) => e.code === 'NOT_OURS');
  // UTF-8 BOM
  assert.equal(parseBackupText('﻿' + text).app, 'jozansag-szamlalo');
});

test('M4: file reading: 50 MB rejected before reading, UTF-16 (Notepad "Unicode") and UTF-8 BOM decoded', async () => {
  const huge = { size: 50 * 1024 * 1024, text: () => { throw new Error('must not read'); }, arrayBuffer: () => { throw new Error('must not read'); } };
  await assert.rejects(readImportText(huge), { code: 'TOO_LARGE' });
  assert.ok(MAX_IMPORT_BYTES < 50 * 1024 * 1024);
  await assert.rejects(readImportText(fileOf('')), { code: 'EMPTY' });
  const json = '{"app":"jozansag-szamlalo","x":"áéő"}';
  const utf16le = new Uint8Array([0xff, 0xfe, ...[...json].flatMap((c) => { const n = c.charCodeAt(0); return [n & 255, n >> 8]; })]);
  assert.equal(await readImportText(new File([utf16le], 'm.json', { type: 'application/octet-stream' })), json);
  const utf16be = new Uint8Array([0xfe, 0xff, ...[...json].flatMap((c) => { const n = c.charCodeAt(0); return [n >> 8, n & 255]; })]);
  assert.equal(await readImportText(new File([utf16be], 'm.json')), json);
  assert.equal(await readImportText(fileOf('﻿' + json)), json);
});

// --- M5: frissebb formátum → UNSUPPORTED (nem "sérült"), és nem ír felül semmit --------------------
test('M5: a backup from a newer app version is UNSUPPORTED (update the app), not "damaged"', async () => {
  const { store } = await storeWithJournal();
  const b = await store.exportEncryptedBackup();
  await assert.rejects(inspectBackup({ ...b, formatVersion: 3 }), (e) => e.code === 'UNSUPPORTED' && /frissítsd/.test(e.message));
  const futureRecord = structuredClone(b);
  futureRecord.record.format = 2;
  delete futureRecord.checksum; futureRecord.formatVersion = 1;
  await assert.rejects(otherDevice().store.importEncryptedBackup(futureRecord, PIN), { code: 'UNSUPPORTED' });
});

test('M5: a journal written by a newer schema (downgrade) is UNSUPPORTED and stays untouched', async () => {
  const backend = new MemoryBackend();
  const dek = await generateDek();
  const record = { format: 1, revision: 3, slots: { pin: await createKeySlot(dek, PIN, 1000), recovery: await createKeySlot(dek, 'AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-GGGG-HHHH', 1000) },
    payload: await encryptPayload(dek, { ...initial(), schemaVersion: 4, futureField: true }) };
  await backend.putMany({ vault: record });
  const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await assert.rejects(store.unlock(PIN), (e) => e.code === 'UNSUPPORTED' && /újabb verzió/.test(e.message));
  assert.deepEqual(await backend.get('vault'), record, 'never rewritten or "repaired"');
});

// --- M6: ellenőrzött mentés ---------------------------------------------------------------
test('M6: an export is verified (re-read, checksum, decrypt) before the user is told it is safe', async () => {
  const { store } = await storeWithJournal();
  const b = await store.exportEncryptedBackup();
  assert.equal(await store.verifyBackup(JSON.stringify(b)), true);
  const bad = structuredClone(b); bad.record.payload.ct = bad.record.payload.ct.replace(/^./, (c) => (c === 'A' ? 'B' : 'A'));
  await assert.rejects(store.verifyBackup(JSON.stringify(bad)), { code: 'DAMAGED' });
});

// --- M7: fagyasztott régi formátumok -----------------------------------------------------------
for (const v of [1, 2, 3]) {
  test(`M7: a frozen schema v${v} journal (as stored on older phones) opens with the PIN and the recovery code`, async () => {
    const f = fixture(`vault-format1-schema${v}.json`);
    for (const secret of ['pin', 'recovery']) {
      const backend = new MemoryBackend();
      await backend.putMany({ vault: structuredClone(f.record) });
      const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
      if (secret === 'pin') await store.unlock(f.pin); else await store.recover(f.recoveryCode, NEW_PIN);
      const d = store.data;
      assert.equal(d.schemaVersion, 3);
      assert.equal(d.profile.journeyStart, '2025-03-01');
      assert.equal(d.settings.costHistory[0].dailyCostHuf, 2500, 'savings history preserved');
      assert.ok(d.events.some((e) => e.type === 'slip' && e.lesson === 'Péntek este nehéz.'));
    }
  });
}

test('M7: the frozen v1 backup file (no formatVersion, no checksum) still restores, with PIN and with recovery code', async () => {
  const f = fixture('backup-v1.json');
  const pinFix = fixture('vault-format1-schema3.json');
  const a = otherDevice();
  await a.store.importEncryptedBackup(parseBackupText(JSON.stringify(f)), pinFix.pin);
  assert.equal(a.store.data.profile.nickname, 'Teszt Elek');
  const b = otherDevice();
  await b.store.importEncryptedBackup(structuredClone(f), pinFix.recoveryCode, { newPin: NEW_PIN });
  assert.equal(b.store.data.events.length, 4);
});

test('M7: fixtures are frozen: present, valid JSON, never regenerated by tests', () => {
  const names = readdirSync('tests/fixtures').sort();
  assert.deepEqual(names, ['backup-v1.json', 'vault-format1-schema1.json', 'vault-format1-schema2.json', 'vault-format1-schema3.json']);
  for (const n of names) assert.doesNotThrow(() => JSON.parse(readFileSync(join('tests/fixtures', n), 'utf8')));
});

// --- M8: migráció atomikus -------------------------------------------------------------------
test('M8: migrating an old journal is atomic: the original stays until a save succeeds, then it is kept as vault.prev', async () => {
  const f = fixture('vault-format1-schema1.json');
  const backend = new MemoryBackend();
  await backend.putMany({ vault: structuredClone(f.record) });
  const store = new VaultStore(backend, { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 });
  await store.unlock(f.pin);
  assert.deepEqual(await backend.get('vault'), f.record, 'opening does not rewrite the old record');
  // A mentés közben elszáll az írás: az eredeti v1 rekord marad.
  const putMany = backend.putMany.bind(backend);
  backend.putMany = async () => { throw Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' }); };
  await assert.rejects(store.save(addEvent(store.data, makeEvent('note', { note: 'x', date: '2025-03-03' }))));
  assert.deepEqual(await backend.get('vault'), f.record);
  backend.putMany = putMany;
  await store.save(addEvent(store.data, makeEvent('note', { note: 'y', date: '2025-03-03' })));
  assert.deepEqual(await backend.get('vault.prev'), f.record, 'the pre-migration record is kept as the previous state');
});

// --- M11: érzékeny adat nem kerül a konzolra ---------------------------------------------------
test('M11: only src/lib/log.js may call console.*, and it never prints message text of foreign errors', async () => {
  const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name)) : /\.jsx?$/.test(d.name) ? [join(dir, d.name)] : []));
  for (const f of files('src')) {
    if (f.endsWith(join('lib', 'log.js'))) continue;
    assert.doesNotMatch(readFileSync(f, 'utf8'), /\bconsole\.(log|info|debug|warn|error|trace|dir)\b/, f);
  }
  const { logError } = await import('../src/lib/log.js');
  const out = [];
  const err = new SyntaxError('Unexpected token \'T\', "TITKOS NAPLÓ: ittam" is not valid JSON');
  logError(err, (...a) => out.push(a.map(String).join(' ')));
  assert.equal(out.length, 1);
  assert.doesNotMatch(out[0], /TITKOS|ittam/);
  assert.match(out[0], /SyntaxError/);
});
