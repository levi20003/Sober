// @vitest-environment jsdom
// P3 – Megosztható mérföldkő- és widgetkártya (spec 4.1–4.3, 5.3): adatvédelmi alapértékek, előnézet a megosztás
// előtt, Web Share / letöltés / vágólap tartalék, nincs hálózati kérés, HU/EN szöveg, AA kontraszt.
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { CARD_THEMES, shareModel, shareText, progressToNext } from '../../src/domain/share.js';
import { shareCardImage, saveCardImage, copyText } from '../../src/lib/shareImage.js';
import { ShareCard } from '../../src/components/share/ShareCard.jsx';
import * as hu from '../../src/content/locales/hu.js';
import * as en from '../../src/content/locales/en.js';
import { markNoticesSeen, daysAgo, PIN } from './setup.jsx';
import { resetPrefsCache } from '../../src/hooks/usePrefs.js';

const SECRETS = ['Dani', 'Alkohol', 'alcohol', 'TITKOS_OK', 'NAPLO_TITOK', 'Anya', '+36301234567', '2500', '112', '116-123', '06-80'];

let restore = [];
const stub = (obj, key, value) => { const had = Object.prototype.hasOwnProperty.call(obj, key); const old = obj[key]; restore.push(() => { if (had) obj[key] = old; else delete obj[key]; }); obj[key] = value; };

/** jsdom-ban nincs vászon és képbetöltés: minimális, determinisztikus helyettesítők. */
function fakeRendering() {
  stub(HTMLCanvasElement.prototype, 'getContext', function getContext() { return { drawImage() {} }; });
  stub(HTMLCanvasElement.prototype, 'toDataURL', function toDataURL() { return 'data:image/png;base64,iVBORw0KGgo='; });
  stub(HTMLCanvasElement.prototype, 'toBlob', function toBlob(cb) { cb(new Blob(['png'], { type: 'image/png' })); });
  stub(window, 'Image', class { set src(v) { this._src = v; queueMicrotask(() => this.onload?.()); } get src() { return this._src; } });
}
/** Minden hálózati kapu figyelve: a megosztás egyiket sem használhatja. */
function watchNetwork() {
  const hits = [];
  stub(globalThis, 'fetch', (...a) => { hits.push(['fetch', a[0]]); return Promise.reject(new Error('no network')); });
  stub(XMLHttpRequest.prototype, 'open', function open(...a) { hits.push(['xhr', a[1]]); });
  stub(navigator, 'sendBeacon', (...a) => { hits.push(['beacon', a[0]]); return false; });
  stub(globalThis, 'WebSocket', class { constructor(u) { hits.push(['ws', u]); } });
  return hits;
}

afterEach(() => { cleanup(); resetPrefsCache(); for (const r of restore.reverse()) r(); restore = []; });
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; localStorage.clear(); markNoticesSeen(); });

async function boot(profile = {}) {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  const base = createInitialData({ journeyStart: daysAgo(40), dailyCostHuf: 2500, lastCelebration: 365, nickname: 'Dani', substances: ['alcohol'],
    reasons: ['TITKOS_OK'], trustedContact: { name: 'Anya', phone: '+36301234567' }, ...profile });
  const data = { ...base, events: [
    { id: 'evt-note01', type: 'note', date: daysAgo(2), at: new Date().toISOString(), note: 'NAPLO_TITOK' },
    { id: 'evt-chk001', type: 'checkin', date: daysAgo(1), at: new Date().toISOString(), mood: 'stressed', craving: 3, note: 'NAPLO_TITOK' },
  ] };
  await auth.setup(PIN, data);
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  return { auth };
}

async function openWidgetShare() {
  window.location.hash = '#/idovonal';
  fireEvent.click(await screen.findByRole('button', { name: 'Widgetkártya megnyitása' }));
  return screen.findByRole('dialog', { name: 'Widgetkártya' });
}

// --- 4.3 adatvédelem -------------------------------------------------------------------------------
test('the share model only ever holds days, a message id and – on explicit choice – next milestone and companion', () => {
  const leaky = { days: 40, companion: 'mira', nickname: 'Dani', journeyStart: '2026-01-01', notes: ['NAPLO_TITOK'] };
  assert.deepEqual(shareModel(leaky), { days: 40, message: 'step' });
  assert.deepEqual(shareModel(leaky, { includeNext: true, includeCompanion: true, message: 'pace' }), { days: 40, message: 'pace', next: 90, companion: 'mira' });
  assert.deepEqual(shareModel({ days: 40, companion: 'none' }, { includeCompanion: true }), { days: 40, message: 'step' }, '"Kísérő nélkül": no companion');
  assert.deepEqual(shareModel({ days: 3 }, { message: '<script>' }), { days: 3, message: 'step' });
  assert.equal(progressToNext({ days: 10, next: 14 }), 3 / 7);
  assert.equal(progressToNext({ days: 10 }), null);
});

test('by default the card and the text contain no name, substance, start date, journal, mood, money or crisis data', async () => {
  await boot({ companion: 'kavics' });
  const dlg = await openWidgetShare();
  const svg = dlg.querySelector('svg.share-card');
  const shown = svg.outerHTML + dlg.textContent;
  const card = svg.outerHTML;
  // Számjegyes titkok (összeg, telefonszámok) a látható szövegben; a betűs titkok a teljes jelölésben sem szerepelhetnek
  // (a rajz koordinátái között véletlenül előfordulhat pl. „112”, ez nem adat).
  for (const s of SECRETS) {
    if (/^[\d+-]+$/.test(s)) assert.ok(!svg.textContent.includes(s), `card text leaks ${s}`);
    else assert.ok(!card.includes(s), `card leaks ${s}`);
  }
  for (const s of ['Dani', 'NAPLO_TITOK', 'TITKOS_OK', 'Anya']) assert.ok(!shown.includes(s), `sheet leaks ${s}`);
  assert.ok(!card.includes(daysAgo(40)), 'no start date');
  assert.ok(!/Stressz|stressed|Következő/.test(card), 'no mood, no next milestone by default');
  assert.equal(svg.querySelectorAll('[data-companion]').length, 0, 'no companion by default');
  assert.match(card, />40</);
  assert.match(card, /Sober/, 'discreet branding');
});

test('next milestone and companion appear only after the user switches them on; "Kísérő nélkül" never offers a character', async () => {
  await boot({ companion: 'mira' });
  const dlg = await openWidgetShare();
  fireEvent.click(within(dlg).getByRole('checkbox', { name: /következő mérföldkő/i }));
  assert.match(dlg.querySelector('svg.share-card').outerHTML, /Következő: 90 nap/);
  assert.equal(within(dlg).queryByRole('checkbox', { name: /Mira/ }), null, 'companion only offered on the illustrated style');
  fireEvent.click(within(dlg).getByRole('radio', { name: 'Illusztrált' }));
  fireEvent.click(within(dlg).getByRole('checkbox', { name: /Mira is legyen/ }));
  assert.ok(dlg.querySelector('svg.share-card [data-companion="mira"]'));
  cleanup(); resetPrefsCache(); localStorage.clear(); markNoticesSeen(); document.body.innerHTML = '<div id="toast"></div>';
  await boot({ companion: 'none' });
  const d2 = await openWidgetShare();
  fireEvent.click(within(d2).getByRole('radio', { name: 'Illusztrált' }));
  assert.equal(within(d2).queryByRole('checkbox', { name: /legyen a képen/ }), null);
  assert.equal(d2.querySelectorAll('[data-companion]').length, 0);
});

test('layouts, themes and shapes all render (minimal/illustrated × light/dark × square/portrait, widget wide/square)', () => {
  for (const variant of ['milestone', 'widget']) {
    for (const layout of ['minimal', 'illustrated']) {
      for (const theme of ['light', 'dark']) {
        for (const shape of variant === 'widget' ? ['wide', 'square'] : ['square', 'portrait']) {
          const { container, unmount } = render(<ShareCard model={{ days: 1234, message: 'counts', next: 1460 }} variant={variant} layout={layout} theme={theme} shape={shape} S={hu.SHARE} />);
          const svg = container.querySelector('svg.share-card');
          assert.ok(svg, `${variant}/${layout}/${theme}/${shape}`);
          assert.match(svg.textContent, /1234/);
          unmount();
        }
      }
    }
  }
});

// --- előnézet és megerősítés ----------------------------------------------------------------------
test('preview first: opening the sheet shares nothing; only the explicit button does', async () => {
  fakeRendering();
  const hits = watchNetwork();
  const shared = [];
  stub(navigator, 'canShare', () => true);
  stub(navigator, 'share', async (d) => { shared.push(d); });
  await boot();
  window.location.hash = '#/idovonal';
  fireEvent.click(await screen.findByRole('button', { name: 'Megosztom: 30 nap' }));
  const dlg = await screen.findByRole('dialog', { name: 'Megosztás' });
  assert.ok(within(dlg).getByRole('img', { name: /előnézete: 30 nap/ }), 'preview is shown');
  assert.equal(shared.length, 0, 'nothing shared on open');
  await act(async () => { fireEvent.click(within(dlg).getByRole('button', { name: 'Megosztom ezt a képet' })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.equal(shared.length, 1);
  assert.equal(shared[0].files[0].type, 'image/png');
  assert.equal(shared[0].files[0].name, 'sober-30-nap.png');
  assert.equal(shared[0].text, '30 nap. Egy nap egyszerre. – Sober');
  assert.deepEqual(hits, [], 'no network request at any point');
});

test('without Web Share the image is downloaded automatically (Blob), and the user is told', async () => {
  fakeRendering();
  const hits = watchNetwork();
  stub(navigator, 'share', undefined);
  const urls = [];
  stub(URL, 'createObjectURL', (b) => { urls.push(b); return 'blob:local'; });
  stub(URL, 'revokeObjectURL', () => {});
  const clicks = [];
  stub(HTMLAnchorElement.prototype, 'click', function click() { clicks.push(this.download); });
  await boot();
  const dlg = await openWidgetShare();
  await act(async () => { fireEvent.click(within(dlg).getByRole('button', { name: 'Megosztom ezt a képet' })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  assert.deepEqual(clicks, ['sober-40-nap.png']);
  assert.equal(urls[0].type, 'image/png');
  assert.match(within(dlg).getByRole('status').textContent, /letöltöttem a képet/);
  assert.deepEqual(hits, []);
});

test('share chain: native app plugin first, then Web Share, then download, then clipboard; cancel is quiet', async () => {
  const png = { blob: new Blob(['x'], { type: 'image/png' }), base64: 'iVBORw0KGgo=' };
  const calls = [];
  const native = { Capacitor: { isNativePlatform: () => true, Plugins: { JszFiles: {
    share: async (o) => { calls.push(['share', o]); return { shared: true }; },
    save: async (o) => { calls.push(['save', o]); return { saved: true }; },
  } } } };
  assert.deepEqual(await shareCardImage({ png, filename: 'a.png', text: 'T' }, native), { how: 'native' });
  assert.deepEqual(calls[0][1], { filename: 'a.png', base64: 'iVBORw0KGgo=', mime: 'image/png', caption: 'T' });
  assert.deepEqual(await saveCardImage({ png, filename: 'a.png' }, native), { how: 'saved' });
  assert.equal(calls[1][1].mime, 'image/png');

  const abort = { File, navigator: { canShare: () => true, share: async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); } } };
  assert.deepEqual(await shareCardImage({ png, filename: 'a.png', text: 'T' }, abort), { how: 'cancelled' });

  const copied = [];
  const clipOnly = { navigator: { clipboard: { writeText: async (t) => { copied.push(t); } } }, URL: {} };
  assert.deepEqual(await shareCardImage({ png, filename: 'a.png', text: 'T' }, clipOnly), { how: 'copied' });
  assert.deepEqual(copied, ['T']);
  assert.equal(await copyText('T', { navigator: {} }), false, 'missing clipboard is handled');
  assert.deepEqual(await shareCardImage({ png, filename: 'a.png', text: 'T' }, { navigator: {}, URL: {} }), { how: 'none' });
});

// --- szövegek ------------------------------------------------------------------------------------
test('HU and EN share texts exist with the same keys and stay neutral', () => {
  const keys = (o) => Object.keys(o).sort();
  assert.deepEqual(keys(hu.SHARE), keys(en.SHARE));
  assert.deepEqual(keys(hu.SHARE.messages), keys(en.SHARE.messages));
  assert.equal(shareText({ days: 7, message: 'counts' }, hu.SHARE), '7 nap. Minden nap számít. – Sober');
  assert.equal(shareText({ days: 1, message: 'step', next: 3 }, en.SHARE), '1 day. One day at a time. Next: 3 days. – Sober');
  const all = JSON.stringify([hu.SHARE, en.SHARE], (k, v) => (typeof v === 'function' ? v(5, 'M', 7) : v)).toLowerCase();
  for (const w of ['józan', 'sober days', 'alkohol', 'alcohol', 'drog', 'drug', 'függő', 'addict', 'megcsúsz', 'slip']) assert.ok(!all.replace(/– sober/g, '').includes(w), w);
});

// --- akadálymentesség ----------------------------------------------------------------------------
test('card colours meet WCAG 2.1 AA in light and dark, on both ends of the gradient', () => {
  const lum = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  for (const [name, c] of Object.entries(CARD_THEMES)) {
    for (const bg of [c.bg, c.bg2]) {
      for (const fg of ['text', 'muted', 'accent']) assert.ok(ratio(c[fg], bg) >= 4.5, `${name} ${fg} on ${bg}: ${ratio(c[fg], bg).toFixed(2)}`);
    }
  }
});

// --- statikus garanciák ---------------------------------------------------------------------------
test('local generation only: no network API, no external image service, no new runtime dependency', () => {
  for (const f of ['src/lib/shareImage.js', 'src/domain/share.js', 'src/components/share/ShareCard.jsx', 'src/components/share/ShareSheet.jsx']) {
    const src = readFileSync(f, 'utf8');
    // Az SVG névtér-azonosítója (http://www.w3.org/2000/svg) nem hálózati cím; minden más URL tilos.
    assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|https?:\/\/(?!www\.w3\.org\/2000\/svg["'])/, f);
  }
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(!Object.keys(pkg.dependencies ?? {}).some((d) => /html2canvas|dom-to-image|canvg|satori|resvg/.test(d)));
  const java = readFileSync('android/app/src/main/java/io/github/levi20003/sober/JszFilesPlugin.java', 'utf8');
  assert.match(java, /"image\/png"\.equals\(call\.getString\("mime"\)\)/, 'binary content only as PNG');
  assert.match(java, /MAX_IMAGE_BYTES/);
});
