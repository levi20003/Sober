import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  PIN_ITERATIONS, RECOVERY_ITERATIONS, MIN_ITERATIONS, assertSecretStrength, assessSecret, createKeySlot, decryptPayload,
  deriveKek, encryptPayload, fromB64, generateDek, generateRecoveryCode, normalizeRecoveryCode, openKeySlot, randomBytes, toB64,
} from '../src/crypto/vault.js';

// Low cost keeps the suite fast; the production values are asserted separately.
const FAST = { minIterations: 1000 };

test('production KDF cost: PIN ≥ 600k (OWASP 2023), every slot ≥ 100k floor', () => {
  assert.ok(PIN_ITERATIONS >= 600_000);
  assert.ok(RECOVERY_ITERATIONS >= MIN_ITERATIONS);
  assert.ok(MIN_ITERATIONS >= 100_000);
});

// --- Key derivation ---------------------------------------------------------

test('derivation is deterministic: same secret + salt → interchangeable key', async () => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const dek = await generateDek();
  const k1 = await deriveKek('2468', salt, 1000);
  const k2 = await deriveKek('2468', salt, 1000);
  const wrapped = await crypto.subtle.wrapKey('raw', dek, k1, { name: 'AES-GCM', iv });
  await crypto.subtle.unwrapKey('raw', wrapped, k2, { name: 'AES-GCM', iv }, 'AES-GCM', false, ['decrypt']);
});

test('derivation depends on salt, secret and iterations', async () => {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const dek = await generateDek();
  const k = await deriveKek('2468', salt, 1000);
  const wrapped = await crypto.subtle.wrapKey('raw', dek, k, { name: 'AES-GCM', iv });
  const unwrapWith = (key) => crypto.subtle.unwrapKey('raw', wrapped, key, { name: 'AES-GCM', iv }, 'AES-GCM', false, ['decrypt']);
  await assert.rejects(unwrapWith(await deriveKek('2468', randomBytes(16), 1000)), 'different salt');
  await assert.rejects(unwrapWith(await deriveKek('2469', salt, 1000)), 'different secret');
  await assert.rejects(unwrapWith(await deriveKek('2468', salt, 1001)), 'different iterations');
});

test('derived keys are non-extractable and limited to wrap/unwrap', async () => {
  const k = await deriveKek('2468', randomBytes(16), 1000);
  assert.equal(k.extractable, false);
  assert.deepEqual([...k.usages].sort(), ['unwrapKey', 'wrapKey']);
  await assert.rejects(crypto.subtle.exportKey('raw', k));
});

test('derivation rejects missing/short salt and bad iteration counts', async () => {
  await assert.rejects(deriveKek('2468', new Uint8Array(8), 1000), { code: 'CORRUPTED' });
  await assert.rejects(deriveKek('2468', randomBytes(16), 0), { code: 'CORRUPTED' });
});

test('every key slot gets its own random 128-bit salt and 96-bit IV', async () => {
  const dek = await generateDek();
  const a = await createKeySlot(dek, '2468', 1000);
  const b = await createKeySlot(dek, '2468', 1000);
  assert.equal(fromB64(a.kdf.salt).length, 16);
  assert.equal(fromB64(a.iv).length, 12);
  assert.notEqual(a.kdf.salt, b.kdf.salt);
  assert.notEqual(a.wrapped, b.wrapped);
});

test('secret is Unicode-normalized (NFC vs NFD accents)', async () => {
  const dek = await generateDek();
  const slot = await createKeySlot(dek, 'árvíztűrő'.normalize('NFC'), 1000);
  await openKeySlot(slot, 'árvíztűrő'.normalize('NFD'), FAST);
});

// --- Key slots ---------------------------------------------------------------

test('key slot opens with the right PIN, rejects a wrong one', async () => {
  const dek = await generateDek();
  const slot = await createKeySlot(dek, '2468', 1000);
  const opened = await openKeySlot(slot, '2468', FAST);
  assert.equal(opened.extractable, false);
  const payload = await encryptPayload(dek, { ok: true });
  assert.deepEqual(await decryptPayload(opened, payload), { ok: true });
  await assert.rejects(openKeySlot(slot, '2469', FAST), { code: 'WRONG_SECRET' });
});

test('a slot whose iteration count was lowered is refused (downgrade attack)', async () => {
  const dek = await generateDek();
  const slot = await createKeySlot(dek, '2468', 1000);
  await assert.rejects(openKeySlot(slot, '2468'), { code: 'CORRUPTED' }); // default floor 100k
  await assert.rejects(openKeySlot({ ...slot, kdf: { ...slot.kdf, hash: 'SHA-1' } }, '2468', FAST), { code: 'CORRUPTED' });
});

// --- JSON payload encryption --------------------------------------------------

test('JSON payload round-trips with Hungarian text, numbers and nesting', async () => {
  const dek = await generateDek();
  const value = { note: 'árvíztűrő tükörfúrógép 🌅', dailyCostHuf: 2500, events: [{ type: 'checkin', sleep: 4 }] };
  assert.deepEqual(await decryptPayload(dek, await encryptPayload(dek, value)), value);
});

test('fresh IV per encryption: same plaintext never yields the same ciphertext', async () => {
  const dek = await generateDek();
  const a = await encryptPayload(dek, { n: 1 });
  const b = await encryptPayload(dek, { n: 1 });
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ct, b.ct);
});

test('ciphertext contains no plaintext', async () => {
  const dek = await generateDek();
  const p = await encryptPayload(dek, { note: 'TITKOS_JEGYZET', dailyCostHuf: 98765 });
  const raw = Buffer.from(fromB64(p.ct)).toString('latin1');
  assert.ok(!raw.includes('TITKOS') && !raw.includes('98765'));
});

test('decrypting with a different key fails as CORRUPTED, never returns data', async () => {
  const p = await encryptPayload(await generateDek(), { x: 1 });
  await assert.rejects(decryptPayload(await generateDek(), p), { code: 'CORRUPTED' });
});

test('any tampering (ciphertext, IV, truncation) is detected', async () => {
  const dek = await generateDek();
  const p = await encryptPayload(dek, { x: 1 });
  const flip = (b64) => { const b = fromB64(b64); b[0] ^= 0xff; return toB64(b); };
  await assert.rejects(decryptPayload(dek, { ...p, ct: flip(p.ct) }), { code: 'CORRUPTED' });
  await assert.rejects(decryptPayload(dek, { ...p, iv: flip(p.iv) }), { code: 'CORRUPTED' });
  await assert.rejects(decryptPayload(dek, { ...p, ct: p.ct.slice(0, 8) }), { code: 'CORRUPTED' });
  await assert.rejects(decryptPayload(dek, { iv: p.iv }), { code: 'CORRUPTED' });
  await assert.rejects(decryptPayload(dek, { ...p, ct: '!!!' }), { code: 'CORRUPTED' });
});

// --- PIN policy ---------------------------------------------------------------

test('4-digit PINs are accepted; trivially guessable ones are not', () => {
  for (const ok of ['2581', '7302', '48291', '918273', 'nyugodt reggel']) assertSecretStrength(ok);
  for (const bad of ['123', '0000', '1111', '1234', '4321', '3456', '9876', '2580', '123456', '000000', 'aaaaaa']) {
    assert.throws(() => assertSecretStrength(bad), { code: 'WEAK_SECRET' }, bad);
  }
});

test('strength assessment is honest about offline brute force', () => {
  assert.equal(assessSecret('2581'), 'weak');
  assert.equal(assessSecret('48291'), 'weak');
  assert.equal(assessSecret('918273'), 'fair');
  assert.equal(assessSecret('kutya12'), 'fair');
  assert.equal(assessSecret('csendes-reggeli-séta'), 'strong');
  assert.equal(assessSecret('Napfeny2026!'), 'strong');
  assert.equal(assessSecret(''), 'weak');
});

// --- Recovery codes -----------------------------------------------------------

test('recovery codes: 160-bit, formatted, unique, forgiving input', () => {
  const c = generateRecoveryCode();
  assert.match(c, /^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/);
  assert.notEqual(c, generateRecoveryCode());
  assert.equal(normalizeRecoveryCode(c.toLowerCase().replace(/-/g, ' ')), c);
  assert.throws(() => normalizeRecoveryCode('ABC'), { code: 'WRONG_SECRET' });
});
