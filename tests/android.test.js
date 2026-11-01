// 3. fázis: Android-héj (statikus ellenőrzések) és a natív fájlkezelés JS-oldala.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { saveTextFile, shareTextFile, nativeShell } from '../src/lib/nativeFiles.js';
import { createAppAuth } from '../src/auth/appAuth.js';

const MANIFEST = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const RULES = readFileSync('android/app/src/main/res/xml/data_extraction_rules.xml', 'utf8');
const PATHS = readFileSync('android/app/src/main/res/xml/file_paths.xml', 'utf8');
const CI = readFileSync('.github/workflows/android.yml', 'utf8');
const JAVA_DIR = 'android/app/src/main/java/io/github/levi20003/sober';

// --- A1: adatkivonás tiltva, nincs tárhely-engedély, a FileProvider csak a mentési gyorsítótárat osztja ---------
test('A1: no cloud backup or device transfer of the journal; no storage permission', () => {
  assert.match(MANIFEST, /android:allowBackup="false"/);
  assert.match(MANIFEST, /android:fullBackupContent="false"/);
  assert.match(MANIFEST, /android:dataExtractionRules="@xml\/data_extraction_rules"/);
  for (const section of ['cloud-backup', 'device-transfer']) {
    const block = RULES.split(`<${section}>`)[1].split(`</${section}>`)[0];
    for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) assert.match(block, new RegExp(`<exclude domain="${domain}" />`), `${section}/${domain}`);
  }
  assert.doesNotMatch(MANIFEST, /WRITE_EXTERNAL_STORAGE|READ_EXTERNAL_STORAGE|MANAGE_EXTERNAL_STORAGE|READ_MEDIA/);
});

test('A1: the FileProvider exposes only the backup share cache (and the verified update APK), not the whole external storage', () => {
  assert.doesNotMatch(PATHS, /<external-path|<files-path|<root-path|<external-cache-path/);
  assert.match(PATHS, /<cache-path name="backups" path="backups\/" \/>/);
  // A frissítő modul (2026-11) óta pontosan két, az app gyorsítótárán belüli mappa: backups/ és updates/.
  assert.deepEqual([...PATHS.matchAll(/<(\w+-path) name="(\w+)" path="([^"]*)"/g)].map((m) => m.slice(1).join(':')), ['cache-path:backups:backups/', 'cache-path:updates:updates/']);
});

// --- A2: natív mentés (Storage Access Framework) és megosztás, vágólap nélkül ------------------------
test('A2: the native plugin saves via ACTION_CREATE_DOCUMENT and shares via FileProvider, and is registered', () => {
  const plugin = readFileSync(`${JAVA_DIR}/JszFilesPlugin.java`, 'utf8');
  assert.match(plugin, /@CapacitorPlugin\(name = "JszFiles"\)/);
  assert.match(plugin, /Intent\.ACTION_CREATE_DOCUMENT/);
  assert.match(plugin, /Intent\.ACTION_SEND/);
  assert.match(plugin, /FileProvider\.getUriForFile/);
  assert.match(plugin, /FLAG_GRANT_READ_URI_PERMISSION/);
  assert.match(plugin, /WindowManager\.LayoutParams\.FLAG_SECURE/);
  assert.doesNotMatch(plugin, /Log\.[dviwe]\(/, 'no logging from the native side');
  const main = readFileSync(`${JAVA_DIR}/MainActivity.java`, 'utf8');
  assert.match(main, /registerPlugin\(JszFilesPlugin\.class\)/);
});

test('A2: in the APK a backup is saved to a user-chosen place, never copied to the clipboard', async () => {
  const calls = [];
  const g = { Capacitor: { isNativePlatform: () => true, Plugins: { JszFiles: {
    save: async (o) => { calls.push(['save', o]); return { saved: true, name: 'jozansag-mentes.json' }; },
    share: async (o) => { calls.push(['share', o]); return { shared: true }; },
  } } } };
  assert.ok(nativeShell(g));
  const r = await saveTextFile({ filename: 'jozansag-mentes.json', text: '{"a":1}', mime: 'application/json' }, g);
  assert.deepEqual(r, { where: 'device', name: 'jozansag-mentes.json' });
  assert.deepEqual(calls[0], ['save', { filename: 'jozansag-mentes.json', text: '{"a":1}', mime: 'application/json' }]);
  assert.deepEqual(await saveTextFile({ filename: 'x.json', text: '1', mime: 'application/json' }, { Capacitor: { isNativePlatform: () => true, Plugins: { JszFiles: { save: async () => ({ cancelled: true }) } } } }), { where: 'cancelled' });
  assert.deepEqual(await shareTextFile({ filename: 'm.json', text: 'x', mime: 'application/json' }, g), { shared: true });
  const settings = readFileSync('src/components/screens/Settings.jsx', 'utf8');
  assert.doesNotMatch(settings, /clipboard\.writeText\([^)]*exportEncryptedBackup/, 'no backup to clipboard');
});

test('A2: in a browser the backup is downloaded; Web Share with files is used when available', async () => {
  const downloads = [];
  const g = { document: { createElement: () => ({ click() { downloads.push(this.download); }, set href(v) {}, remove() {} }), body: { append() {} } },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} }, Blob, setTimeout: (f) => f() };
  assert.deepEqual(await saveTextFile({ filename: 'm.json', text: 'x', mime: 'application/json' }, g), { where: 'download', name: 'm.json' });
  assert.deepEqual(downloads, ['m.json']);
  const shared = [];
  const g2 = { navigator: { canShare: () => true, share: async (d) => shared.push(d.files[0].name) }, File };
  assert.deepEqual(await shareTextFile({ filename: 'm.json', text: 'x', mime: 'application/json' }, g2), { shared: true });
  assert.deepEqual(shared, ['m.json']);
  assert.deepEqual(await shareTextFile({ filename: 'm.json', text: 'x', mime: 'application/json' }, {}), { shared: false, unsupported: true });
});

// --- A3: importáláskor a letöltött JSON is választható (sok fájlkezelő application/octet-stream-ként adja) -------
test('A3: the import file pickers accept JSON saved as octet-stream or text', () => {
  for (const f of ['src/components/screens/Settings.jsx', 'src/components/onboarding/Onboarding.jsx']) {
    const src = readFileSync(f, 'utf8');
    assert.match(src, /accept=\{BACKUP_ACCEPT\}/, f);
  }
  const { BACKUP_ACCEPT } = { BACKUP_ACCEPT: readFileSync('src/lib/nativeFiles.js', 'utf8').match(/BACKUP_ACCEPT = '([^']+)'/)[1] };
  for (const t of ['application/json', 'application/octet-stream', 'text/plain', '.json']) assert.ok(BACKUP_ACCEPT.split(',').includes(t), t);
});

// --- A4: kiadási aláírás: main-en kötelező a kiadási kulcs, és az ujjlenyomat egyezik --------------------------
test('A4: on main the build fails without the release keystore, and the certificate must match the pinned fingerprint', () => {
  assert.ok(existsSync('android/signing-fingerprint.txt'));
  const fp = readFileSync('android/signing-fingerprint.txt', 'utf8').split('\n').find((l) => /^[0-9a-f]{64}$/.test(l.trim()));
  assert.equal(fp, '3f822994ee7b45bb95905b47abedff75a39341244dcb4b410d6648d38ba66ccc');
  assert.match(CI, /"\$GITHUB_REF" = "refs\/heads\/main"[\s\S]{0,800}?exit 1/, 'missing keystore on main → exit 1');
  assert.match(CI, /signing-fingerprint\.txt/);
  const ignore = readFileSync('.gitignore', 'utf8').split('\n');
  assert.ok(ignore.includes('*.jks') && ignore.includes('*.keystore'), '.gitignore keeps keystores out of the repo');
});

// --- A5: zárolás, amikor az app a háttérbe kerül --------------------------------------------------------------
test('A5: in the APK the journal locks as soon as the app is paused or hidden; on the web after a short grace', () => {
  const mk = () => {
    const ev = {};
    const target = { addEventListener: (n, f) => { ev[n] = f; }, removeEventListener() {} };
    const doc = { visibilityState: 'visible', addEventListener: (n, f) => { ev[`doc:${n}`] = f; }, removeEventListener() {} };
    return { ev, target, doc };
  };
  for (const native of [true, false]) {
    let t = 0;
    const auth = createAppAuth({ openBackend: async () => null, now: () => t });
    const locks = [];
    auth.lock = (why) => locks.push(why);
    const { ev, target, doc } = mk();
    auth.attachLifecycle({ target, doc, native, setIntervalFn: () => 0, clearIntervalFn() {}, now: () => t });
    if (native) {
      ev['doc:pause']();
      assert.deepEqual(locks, ['pause']);
      doc.visibilityState = 'hidden'; ev['doc:visibilitychange']();
      assert.deepEqual(locks, ['pause', 'hidden']);
    } else {
      doc.visibilityState = 'hidden'; ev['doc:visibilitychange']();
      assert.deepEqual(locks, [], 'a quick tab switch does not lock');
      t += 61_000; doc.visibilityState = 'visible'; ev['doc:visibilitychange']();
      assert.deepEqual(locks, ['hidden'], 'longer than the grace → locked when coming back');
    }
  }
});
