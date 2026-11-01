// Fagyasztott tesztadatok (tests/fixtures/): valódi, titkosított naplók és mentésfájlok a régebbi formátumokból.
// EGYSZER generáltuk, azóta változatlanok: a tesztek (tests/fixtures.test.js) azt bizonyítják, hogy a mai kód
// a régi telefonokon lévő naplókat és a régi mentésfájlokat is megnyitja. Ne generáld újra (a szkript nem ír felül).
//   node scripts/make-fixtures.mjs [--force]
import { existsSync, writeFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;
const { generateDek, createKeySlot, encryptPayload } = await import('../src/crypto/vault.js');

const PIN = '2581-tavasz';
const RECOVERY = 'K7M2-QW9D-3HXR-T5NB-8JCV-4PZF-6GYA-2EKS';
const IT = 100_000; // a MIN_ITERATIONS; a valódi PIN-kulcs 600k, de a tesztek így gyorsak
const force = process.argv.includes('--force');

const events = [
  { id: 'a1a1a1a1a1a1a1a1a1a1a1a1', type: 'checkin', date: '2025-03-02', at: '2025-03-02T19:00:00.000Z', mood: 'calm', note: 'Első este.' },
  { id: 'a2a2a2a2a2a2a2a2a2a2a2a2', type: 'trigger', date: '2025-03-05', at: '2025-03-05T21:10:00.000Z', triggers: ['stress'], intensity: 4, coping: ['walk'], outcome: 'coped' },
  { id: 'a3a3a3a3a3a3a3a3a3a3a3a3', type: 'slip', date: '2025-03-20', at: '2025-03-20T22:00:00.000Z', lesson: 'Péntek este nehéz.', intention: 'Előre tervezek.' },
];
const DATA = {
  1: { schemaVersion: 1, profile: { journeyStart: '2025-03-01' }, settings: { dailyCostHuf: 2500, autoLockMinutes: 5 }, events },
  2: { schemaVersion: 2, profile: { journeyStart: '2025-03-01' }, settings: { costHistory: [{ from: '2025-03-01', dailyCostHuf: 2500 }], autoLockMinutes: 5 }, events },
  3: { schemaVersion: 3, profile: { journeyStart: '2025-03-01', nickname: 'Teszt Elek', goalDays: 90, triggers: ['stress'], reasons: ['A családom'] },
    settings: { costHistory: [{ from: '2025-03-01', dailyCostHuf: 2500 }, { from: '2025-06-01', dailyCostHuf: 3000 }], autoLockMinutes: 5 },
    events: [...events, { id: 'a4a4a4a4a4a4a4a4a4a4a4a4', type: 'gratitude', date: '2025-06-02', at: '2025-06-02T08:00:00.000Z', items: ['napfény'] }] },
};

async function record(data) {
  const dek = await generateDek();
  return {
    format: 1, revision: 7,
    slots: { pin: await createKeySlot(dek, PIN, IT), recovery: await createKeySlot(dek, RECOVERY, IT) },
    payload: await encryptPayload(dek, data),
  };
}
function write(name, obj) {
  const path = `tests/fixtures/${name}`;
  if (existsSync(path) && !force) { console.log(`megvan, nem írom felül: ${path}`); return; }
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
  console.log(`írva: ${path}`);
}

for (const v of [1, 2, 3]) write(`vault-format1-schema${v}.json`, { pin: PIN, recoveryCode: RECOVERY, record: await record(DATA[v]) });
// v1 mentésfájl: így exportált az alkalmazás 2026 októberéig (nincs formatVersion, nincs ellenőrzőösszeg).
write('backup-v1.json', { app: 'jozansag-szamlalo', kind: 'encrypted-backup', exportedAt: '2026-10-20T18:00:00.000Z', record: await record(DATA[3]) });
