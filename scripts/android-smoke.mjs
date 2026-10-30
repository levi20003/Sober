#!/usr/bin/env node
// Android smoke test: installs the APK on a running emulator/device, starts it, drives
// the REAL WebView over Chrome DevTools (the APK is built with WebView debugging only
// for this test) and checks the journey that matters: PIN setup, timeline entry,
// crisis overlay + dialer, kill & restart (airplane mode), unlock with data intact,
// wrong PIN, and that nothing crashed.
//
//   node scripts/android-smoke.mjs <app.apk> [outdir] [--upgrade <újabb.apk>] [--foreign <idegen-kulcsos.apk>]
//
//   --upgrade  ugyanazzal a kulccsal aláírt, nagyobb verziókódú APK: a régi fölé kell települnie,
//              a napló pedig megmarad
//   --foreign  más kulccsal aláírt APK: a telepítésnek INSTALL_FAILED_UPDATE_INCOMPATIBLE
//              hibával el kell utasulnia (ez a telefonon az "Az alkalmazás nem települt")
//
// Exits 1 on any failure. In GitHub Actions the verdict is also written as annotations.

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { connect, findPageTarget, collectProblems, sleep } from './android/cdp.mjs';
import * as flow from './android/flow.mjs';

const PKG = 'io.github.levi20003.sober';
const PIN = '48271';
const PORT = 9222;
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
const upgradeApk = opt('--upgrade');
const foreignApk = opt('--foreign');
const [apk, outDir = 'smoke-out'] = argv;
if (!apk) {
  console.error('Használat: node scripts/android-smoke.mjs <app.apk> [kimeneti-mappa] [--upgrade <apk>] [--foreign <apk>]');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const report = [];
const say = (m) => { report.push(m); console.log(m); };
const adb = (...args) => {
  const r = spawnSync('adb', args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const sh = (cmd) => adb('shell', cmd).out.trim();

async function poll(fn, { timeoutMs, what }) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const v = fn();
    if (v) return v;
    await sleep(500);
  }
  throw new Error(`Időtúllépés: ${what}`);
}

function screenshot(name) {
  const r = spawnSync('adb', ['exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0 && r.stdout?.length > 1000) writeFileSync(`${outDir}/${name}.png`, r.stdout);
}

const CRASH = /FATAL EXCEPTION|AndroidRuntime.*io\.github\.levi20003|ANR in io\.github\.levi20003|Process io\.github\.levi20003\.sober .* has died|Force finishing activity io\.github/;
const crashLines = () => adb('logcat', '-d').out.split('\n').filter((l) => CRASH.test(l));
const interestingLog = (n = 60) => adb('logcat', '-d').out.split('\n').filter((l) => /chromium|Capacitor|AndroidRuntime|FATAL|io\.github\.levi20003/i.test(l)).slice(-n).join('\n');

const earlierCrashes = [];

async function launch() {
  sh(`am force-stop ${PKG}`);
  await sleep(500);
  earlierCrashes.push(...crashLines()); // logcat -c below would drop them
  adb('logcat', '-c');
  const r = adb('shell', 'am', 'start', '-W', '-n', `${PKG}/.MainActivity`);
  if (!/Status: ok/.test(r.out)) throw new Error(`Az app nem indult el: ${r.out.trim().slice(0, 400)}`);
  const pid = await poll(() => sh(`pidof ${PKG}`).split(/\s+/)[0], { timeoutMs: 30_000, what: 'az app folyamata' });
  const socket = `webview_devtools_remote_${pid}`;
  await poll(() => sh('cat /proc/net/unix').includes(socket), { timeoutMs: 60_000, what: 'WebView hibakereső csatorna (a WebView elindult?)' });
  adb('forward', `tcp:${PORT}`, `localabstract:${socket}`);
  const target = await findPageTarget(PORT, 'https://localhost', { timeoutMs: 60_000 });
  const c = await connect(target.webSocketDebuggerUrl);
  const problems = await collectProblems(c);
  await flow.install(c);
  return { c, problems, pid };
}

const allProblems = [];
let failure = null;

try {
  const dev = sh('getprop ro.product.model') + ' / Android ' + sh('getprop ro.build.version.release') + ' (API ' + sh('getprop ro.build.version.sdk') + ')';
  say(`Eszköz: ${dev}`);
  say('WebView: ' + sh('dumpsys webviewupdate').split('\n').find((l) => /Current WebView package/i.test(l))?.trim());

  // 1. Telepítés
  const inst = adb('install', '-r', apk);
  if (!/Success/.test(inst.out)) throw new Error(`Az APK telepítése nem sikerült: ${inst.out.trim().slice(0, 500)}`);
  const pkgInfo = sh(`dumpsys package ${PKG}`);
  const field = (re) => pkgInfo.match(re)?.[1];
  const installedCode = Number(field(/versionCode=(\d+)/));
  say(`✓ APK telepítve: verzió ${field(/versionName=(\S+)/)} (code ${installedCode}), minSdk ${field(/minSdk=(\d+)/)}, targetSdk ${field(/targetSdk=(\d+)/)}`);

  // 2. Első indítás
  let { c, problems } = await launch();
  allProblems.push(problems);
  const env = await flow.environment(c);
  say(`✓ elindult; WebView: ${env.ua.match(/Chrome\/[\d.]+/)?.[0]}; origin: ${new URL(env.url).origin}; capacitor híd: ${env.capacitor}; service worker regisztrációk: ${env.serviceWorkerRegistrations}`);
  for (const k of ['secureContext', 'subtle', 'indexedDB', 'dialog']) {
    if (!env[k]) throw new Error(`A WebView-ban hiányzik: ${k}`);
  }
  if (env.serviceWorkerRegistrations !== 0 && env.serviceWorkerRegistrations !== 'n/a') throw new Error('A natív appban nem szabadna service workernek lennie');

  const first = await flow.firstRun(c, PIN);
  first.steps.forEach((s) => say(`✓ ${s}`));
  if (first.tels.join() !== 'tel:112,tel:116123,tel:0680505678,tel:116111') throw new Error(`Váratlan segélyvonalak: ${first.tels}`);
  screenshot('1-krizis');

  // 3. tel: kattintás -> tárcsázó
  const resolved = sh('cmd package resolve-activity --brief -a android.intent.action.VIEW -d tel:116123').split('\n').pop();
  if (resolved.includes('/')) {
    await c.eval(`__s.click('dialog.crisis-overlay a[href="tel:116123"]')`, { userGesture: true });
    const top = await poll(() => {
      const t = sh('dumpsys activity activities').split('\n').find((l) => /topResumedActivity|mResumedActivity/.test(l)) ?? '';
      return t.includes(PKG) ? '' : t.trim();
    }, { timeoutMs: 15_000, what: `a 116-123 tárcsázása után a tárcsázó nem került előtérbe (feloldott: ${resolved})` });
    say(`✓ 116-123 koppintás: a tárcsázó megnyílt (${top.match(/[\w.]+\/[\w.$]+/)?.[0] ?? top})`);
    screenshot('2-tarcsazo');
  } else {
    say('⚠ ebben a rendszerképben nincs tárcsázó alkalmazás, a hívás-ellenőrzés kimaradt');
  }
  c.close();

  // 4. Újraindítás repülőgép-módban: zárolt képernyő, hibás PIN, helyes PIN, adat megvan
  const air = adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable');
  say(`  repülőgép-mód: ${sh('settings get global airplane_mode_on') === '1' ? 'bekapcsolva' : 'nem sikerült bekapcsolni (' + air.out.trim().slice(0, 80) + ')'}`);
  ({ c, problems } = await launch());
  allProblems.push(problems);
  (await flow.wrongPinThenRight(c, PIN)).forEach((s) => say(`✓ ${s}`));
  const after = await flow.afterRestart(c, PIN);
  after.steps.forEach((s) => say(`✓ ${s}`));
  screenshot('3-ujraindites-utan');
  c.close();
  adb('shell', 'cmd', 'connectivity', 'airplane-mode', 'disable');

  // 5. Frissítés: ugyanazzal a kulccsal, nagyobb verziókóddal a régi fölé települ, az adat megmarad
  if (upgradeApk) {
    const up = adb('install', '-r', upgradeApk);
    if (!/Success/.test(up.out)) throw new Error(`Az újabb APK nem települt a régi fölé: ${up.out.trim().slice(0, 500)}`);
    const newCode = Number(sh(`dumpsys package ${PKG}`).match(/versionCode=(\d+)/)?.[1]);
    if (!(newCode > installedCode)) throw new Error(`A frissítés után a verziókód nem nőtt: ${installedCode} -> ${newCode}`);
    say(`✓ frissítés a régi fölé települt (verziókód ${installedCode} → ${newCode})`);
    ({ c, problems } = await launch());
    allProblems.push(problems);
    await flow.afterRestart(c, PIN);
    say('✓ frissítés után a napló és a PIN megvan (az adat nem veszett el)');
    c.close();
  }

  // 6. Más kulccsal aláírt APK nem települhet: ez a telefonon az "Az alkalmazás nem települt"
  if (foreignApk) {
    const f = adb('install', '-r', foreignApk);
    if (!/INSTALL_FAILED_UPDATE_INCOMPATIBLE/.test(f.out)) {
      throw new Error(`A más kulccsal aláírt APK-t el kellett volna utasítani (INSTALL_FAILED_UPDATE_INCOMPATIBLE), de: ${f.out.trim().slice(0, 300)}`);
    }
    say('✓ más kulccsal aláírt APK elutasítva (INSTALL_FAILED_UPDATE_INCOMPATIBLE): ez okozza az "Az alkalmazás nem települt" hibát, ha minden build más kulcsot kap');
    ({ c, problems } = await launch());
    allProblems.push(problems);
    await flow.afterRestart(c, PIN);
    say('✓ az elutasított telepítés után az eredeti app és adata érintetlen');
    c.close();
  }

  // 7. Összeomlás / hiba a naplóban és a konzolon
  const crashes = [...earlierCrashes, ...crashLines()];
  if (crashes.length) throw new Error(`Összeomlás a naplóban:\n${crashes.slice(0, 8).join('\n')}`);
  say('✓ nincs összeomlás (FATAL EXCEPTION / ANR) a logcatben');
  // Ismert, ártalmatlan Capacitor-üzenet: a beépített SystemBars plugin evaluateJavascript-je
  // néha még az oldal felépülése előtt fut (document.documentElement == null), a plugin a saját
  // try/catch-ében naplózza, és a következő rendszersáv-változásnál újra beállítja. Az app nem
  // használja a --safe-area-inset-* változókat, ezért nincs hatása. Csak ez az egy üzenet
  // kivétel; minden más konzolhiba bukást okoz.
  const KNOWN_NOISE = /^console\.error: Error injecting safe area CSS: TypeError: Cannot read properties of null/;
  const flat = [...new Set(allProblems.flat())];
  const ignored = flat.filter((p) => KNOWN_NOISE.test(p));
  const real = flat.filter((p) => !KNOWN_NOISE.test(p));
  if (real.length) throw new Error(`Konzolhibák a WebView-ban:\n${real.slice(0, 10).join('\n')}`);
  say('✓ nincs konzolhiba a WebView-ban' + (ignored.length ? ' (kivéve a Capacitor SystemBars ismert, ártalmatlan "safe area CSS" üzenetét, amely az oldal felépülése előtti futásból ered)' : ''));
} catch (err) {
  failure = err;
  say(`✗ HIBA: ${err.message}`);
  try { screenshot('hiba'); } catch { /* best effort */ }
  say('--- logcat (chromium/Capacitor/AndroidRuntime) ---');
  say(interestingLog());
}

writeFileSync(`${outDir}/jelentes.txt`, report.join('\n'));
if (process.env.GITHUB_ACTIONS) {
  const enc = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  console.log(`::${failure ? 'error' : 'notice'} title=Android smoke teszt::${enc(report.join('\n').slice(0, 60_000))}`);
}
process.exit(failure ? 1 : 0);
