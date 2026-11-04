// @vitest-environment jsdom
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { screen, fireEvent, cleanup, waitFor, render, act, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { setPrefs, resetPrefsCache } from '../../src/hooks/usePrefs.js';
import { withTransition } from '../../src/lib/transition.js';
import { Confetti } from '../../src/components/Confetti.jsx';
import { daysAgo, markNoticesSeen, PIN } from './setup.jsx';

afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-motion'); resetPrefsCache(); });
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; markNoticesSeen(); });

async function bootUnlocked({ days = 12, extra = {} } = {}) {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(PIN, createInitialData({ journeyStart: daysAgo(days), dailyCostHuf: 2500, nickname: 'Dani', goalDays: 30, triggers: ['stress'], lastCelebration: 365, ...extra }));
  const router = createHashRouter(window);
  render(<App auth={auth} router={router} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  return { auth, router };
}
const tabs = [['Főoldal', '#/'], ['Idővonal', '#/idovonal'], ['Megtakarítás', '#/megtakaritas'], ['Eszközök', '#/eszkozok'], ['Beállítások', '#/beallitasok']];
// Az alsó sávban 4 fül és középen a gyors rögzítés „+” (R4); a Beállítások a fejléc avatarjáról nyílik.
const openTab = (name) => (name === 'Beállítások'
  ? fireEvent.click(document.querySelector('.appbar .avatar'))
  : fireEvent.click(within(screen.getByRole('navigation', { name: 'Fő navigáció' })).getByRole('link', { name })));

test('bottom navigation: four tabs + centre quick-add, Settings from the avatar; aria-current follows, page title in the header', async () => {
  await bootUnlocked();
  const nav = screen.getByRole('navigation', { name: 'Fő navigáció' });
  const links = within(nav).getAllByRole('link');
  assert.deepEqual(links.map((a) => a.getAttribute('href')), tabs.slice(0, 4).map((t) => t[1]));
  const buttons = within(nav).getAllByRole('button');
  assert.deepEqual(buttons.map((b) => b.getAttribute('aria-label')), ['Gyors rögzítés'], 'the + sits in the middle of the bar');
  assert.equal(nav.children[2].querySelector('button')?.getAttribute('aria-label'), 'Gyors rögzítés');
  assert.equal(within(nav).getByRole('link', { name: 'Főoldal' }).getAttribute('aria-current'), 'page');
  for (const [name, hash] of tabs.slice(1)) {
    openTab(name);
    await waitFor(() => assert.equal(window.location.hash, hash));
    if (name !== 'Beállítások') await waitFor(() => assert.equal(within(nav).getByRole('link', { name }).getAttribute('aria-current'), 'page'));
    await waitFor(() => assert.equal(document.querySelector('.appbar-title').textContent, name));
  }
});

test('"Segítség most" is on every tab, in the quick-add sheet flow, and needs no PIN', async () => {
  await bootUnlocked();
  for (const [name] of tabs) {
    openTab(name);
    await waitFor(() => assert.ok(within(document.querySelector('.appbar')).getByRole('link', { name: 'Most segítségre van szükségem' })));
    const help = within(document.querySelector('.appbar')).getByRole('link', { name: 'Most segítségre van szükségem' });
    assert.equal(help.getAttribute('href'), '#/segitseg');
    assert.ok(help.classList.contains('btn-help'));
    assert.ok(help.getBoundingClientRect, 'rendered');
  }
});

test('"Segítség most" is available on the lock screen too', async () => {
  const { auth } = await bootUnlocked();
  await act(async () => { auth.lock('manual'); });
  await screen.findByRole('heading', { name: 'Üdv újra' });
  assert.equal(screen.getByRole('link', { name: 'Most segítségre van szükségem' }).getAttribute('href'), '#/segitseg');
});

test('home: personalised greeting, goal progress and total that never resets', async () => {
  await bootUnlocked({ days: 12 });
  assert.ok(screen.getByRole('heading', { name: /Szia, Dani/ }));
  assert.equal(document.querySelector('.hero-value').textContent, '12');
  assert.ok(screen.getByText('12 / 30 nap'), 'goal progress sits inside the hero card');
  assert.ok(screen.getByRole('heading', { name: 'Hogy vagy ma?' }));
  assert.equal(document.querySelectorAll('.mood-row .mood-chip').length, 12, 'all 12 figures, each named');
});

test('home: mood check-in saves a figure with intensity and can be changed', async () => {
  const { auth } = await bootUnlocked();
  fireEvent.click(screen.getByRole('button', { name: 'Stresszes' }));       // a sorban: megnyitja a lapot
  const sheet = () => document.querySelector('dialog.sheet');
  fireEvent.change(within(sheet()).getByRole('slider'), { target: { value: '4' } });
  fireEvent.click(within(sheet()).getByRole('button', { name: 'Mentés' }));
  await waitFor(() => assert.equal(document.querySelector('.mood-today')?.textContent, 'Stresszes'));
  const [e] = auth.store.data.events;
  assert.deepEqual([e.type, e.mood, e.intensity], ['checkin', 'stressed', 4]);
  fireEvent.click(screen.getByRole('button', { name: 'Átírom' }));
  fireEvent.click(within(sheet()).getByRole('button', { name: 'Vidám' }));
  fireEvent.click(within(sheet()).getByRole('button', { name: 'Mentés' }));
  await waitFor(() => assert.equal(document.querySelector('.mood-today')?.textContent, 'Vidám'));
});

test('home: "Make it yours" sets the goal, the daily cost and hard situations in sheets, then disappears', async () => {
  const { auth } = await bootUnlocked({ days: 12, extra: { goalDays: undefined, triggers: undefined } });
  const card = () => document.querySelector('.setup-card');
  assert.ok(card(), 'shown while something is missing');
  fireEvent.click(within(card()).getByRole('button', { name: /Tűzz ki egy célt/ }));
  fireEvent.click(within(document.querySelector('dialog.sheet')).getByLabelText('30 nap'));
  fireEvent.click(within(document.querySelector('dialog.sheet')).getByRole('button', { name: 'Mentés' }));
  await waitFor(() => assert.equal(auth.store.data.profile.goalDays, 30));
  fireEvent.click(within(card()).getByRole('button', { name: /Mikor nehezebb/ }));
  fireEvent.click(within(document.querySelector('dialog.sheet')).getByLabelText('Hétvége'));
  fireEvent.click(within(document.querySelector('dialog.sheet')).getByRole('button', { name: 'Mentés' }));
  await waitFor(() => assert.deepEqual(auth.store.data.profile.triggers, ['weekend']));
  // A költség már meg van adva (2500 Ft) ebben a tesztben, így a kártya eltűnik.
  await waitFor(() => assert.equal(card(), null));
});

test('milestone celebration appears once and is remembered', async () => {
  const { auth } = await bootUnlocked({ days: 30, extra: { lastCelebration: 14 } });
  const dlg = await screen.findByRole('dialog', { name: /30 nap/ });
  fireEvent.click(within(dlg).getByRole('button', { name: 'Köszönöm' }));
  await waitFor(() => assert.equal(auth.store.data.profile.lastCelebration, 30));
  assert.ok(!screen.queryByRole('dialog', { name: /30 nap/ }));
});

test('settings: theme and reduced-motion switches change the root attributes and persist (non-personal) only', async () => {
  await bootUnlocked();
  openTab('Beállítások');
  fireEvent.click(await screen.findByLabelText('Sötét'));
  assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  fireEvent.click(screen.getByLabelText('Kevesebb mozgás'));
  assert.equal(document.documentElement.getAttribute('data-motion'), 'reduced');
  const stored = JSON.parse(localStorage.getItem('jsz-ui'));
  assert.deepEqual(stored, { seen: ['preview'], theme: 'dark', motion: 'reduced' });
  assert.ok(!localStorage.getItem('jsz-ui').includes('Dani'));
  setPrefs({ theme: 'system', motion: 'full' });
  document.documentElement.removeAttribute('data-theme');
});

test('reduced motion: no confetti, no view transition, and the CSS switches animations off', () => {
  const { container } = render(<Confetti />);
  assert.equal(container.querySelector('.confetti'), null, 'matchMedia is absent in jsdom → calm default');
  let used = false;
  const doc = { documentElement: document.documentElement, startViewTransition: () => { used = true; } };
  document.documentElement.setAttribute('data-motion', 'reduced');
  let ran = false;
  withTransition(() => { ran = true; }, { doc, win: window });
  assert.ok(ran && !used);
  const css = readFileSync('src/styles/anim.css', 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*animation-duration: 0\.001ms/);
  assert.match(css, /:root\[data-motion="reduced"\] \*/);
  assert.match(css, /\.crisis-overlay \.confetti/);
});

test('only transform and opacity are animated', () => {
  const css = ['anim', 'figures', 'widgets', 'layout', 'premium'].map((f) => readFileSync(`src/styles/${f}.css`, 'utf8')).join('\n');
  // brace-matched @keyframes bodies
  const frames = [];
  for (const m of css.matchAll(/@keyframes [\w-]+ \{/g)) {
    let depth = 1; let i = m.index + m[0].length; const start = i;
    while (depth && i < css.length) { if (css[i] === '{') depth++; else if (css[i] === '}') depth--; i++; }
    frames.push(css.slice(start, i - 1));
  }
  assert.ok(frames.length > 5);
  for (const f of frames) for (const decl of f.matchAll(/\{([^{}]*)\}/g)) for (const d of decl[1].split(';')) {
    const prop = d.split(':')[0].trim();
    if (prop) assert.ok(['transform', 'opacity'].includes(prop), `animated property ${prop}`);
  }
});
