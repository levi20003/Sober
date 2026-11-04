// @vitest-environment jsdom
// P2 – Kísérők: három választható karakter + „Kísérő nélkül”; visszafogott megjelenés (spec 4.4).
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData, validateProfile } from '../../src/domain/schema.js';
import * as hu from '../../src/content/locales/hu.js';
import * as en from '../../src/content/locales/en.js';
import { Companion, COMPANION_IDS } from '../../src/components/companions/Companion.jsx';
import { markNoticesSeen, daysAgo, PIN } from './setup.jsx';
import { resetPrefsCache } from '../../src/hooks/usePrefs.js';

afterEach(() => { cleanup(); resetPrefsCache(); });
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; localStorage.clear(); markNoticesSeen(); });

async function boot(extra = {}) {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(PIN, createInitialData({ journeyStart: daysAgo(10), dailyCostHuf: 0, lastCelebration: 365, ...extra }));
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  return { auth };
}

test('three companions plus "none"; the choice lives in the encrypted profile and survives validation', () => {
  assert.deepEqual(COMPANION_IDS, ['potty', 'mira', 'kavics', 'none']);
  for (const id of COMPANION_IDS) assert.equal(validateProfile({ journeyStart: '2026-01-01', companion: id }).companion, id);
  assert.equal(validateProfile({ journeyStart: '2026-01-01', companion: 'hacker' }).companion, undefined);
});

test('each companion has its own voice but the same safety content (HU and EN)', () => {
  for (const L of [hu, en]) {
    for (const id of ['potty', 'mira', 'kavics']) {
      const c = L.COMPANIONS[id];
      assert.ok(c.name && c.desc && c.hello && c.react, id);
      assert.deepEqual(Object.keys(c.react).sort(), ['hard', 'neutral', 'positive', 'slip']);
      assert.match(c.react.hard, /sárga gomb|yellow button/i, `${id}: hard moments point to help`);
      assert.doesNotMatch(c.react.slip, /!/, `${id}: no celebrating a slip`);
      assert.doesNotMatch(c.react.slip, /haha|vicc|joke|😂/i);
    }
    assert.ok(L.COMPANIONS.none.name);
  }
  assert.notEqual(hu.COMPANIONS.potty.hello(''), hu.COMPANIONS.mira.hello(''), 'different personalities');
});

test('no guilt-tripping or emotional pressure anywhere in the copy', () => {
  const all = JSON.stringify([hu, en], (k, v) => (typeof v === 'function' ? v('X', false) : v)).toLowerCase();
  for (const w of ['hiányoztál', 'hol voltál', 'csalódott vagyok', 'csalódtam benned', 'missed you', 'where were you', 'disappointed in you']) {
    assert.ok(!all.includes(w), w);
  }
});

test('companion SVGs render for each kind; "none" renders nothing', () => {
  for (const id of ['potty', 'mira', 'kavics']) {
    const { container, unmount } = render(<Companion kind={id} look="happy" size={40} />);
    assert.ok(container.querySelector(`svg[data-companion="${id}"]`), id);
    unmount();
  }
  const { container } = render(<Companion kind="none" look="happy" />);
  assert.equal(container.innerHTML, '');
});

test('home: at most one speech bubble, the greeting only once a day, and nothing at all with "Kísérő nélkül"', async () => {
  await boot();
  assert.ok(document.querySelectorAll('.bubble').length <= 1);
  assert.equal(document.querySelectorAll('.bubble').length, 1, 'first open of the day: one greeting');
  cleanup(); resetPrefsCache(); document.body.innerHTML = '<div id="toast"></div>';
  await boot();
  assert.equal(document.querySelectorAll('.bubble').length, 0, 'same day again: no repeated greeting');
  cleanup(); resetPrefsCache(); localStorage.clear(); markNoticesSeen(); document.body.innerHTML = '<div id="toast"></div>';
  await boot({ companion: 'none' });
  assert.equal(document.querySelectorAll('main .bubble, main svg.mascot').length, 0, 'no companion, no bubble');
});

test('home figure never loops an animation; the chosen companion appears', async () => {
  await boot({ companion: 'mira' });
  const fig = document.querySelector('.hello svg[data-companion]');
  assert.equal(fig.getAttribute('data-companion'), 'mira');
  assert.ok(!fig.classList.contains('mascot-live'), 'no idle loop on the home screen');
  const css = readFileSync('src/styles/figures.css', 'utf8');
  const mascotRules = css.split('\n').filter((l) => /\.mascot/.test(l) && /animation:/.test(l));
  for (const r of mascotRules) assert.doesNotMatch(r, /infinite/, r);
});

test('lock screen and crisis screen stay companion-free', async () => {
  const { auth } = await boot({ companion: 'kavics' });
  fireEvent.click(within(document.querySelector('.appbar')).getByRole('link', { name: /segítségre/ }));
  const crisis = await screen.findByRole('dialog', { name: /Itt vagyunk/ });
  assert.equal(crisis.querySelectorAll('svg.mascot, svg[data-companion]').length, 0);
  await act(async () => { auth.lock('manual'); });
  await screen.findByRole('heading', { name: 'Üdv újra' });
  assert.equal(document.querySelectorAll('svg.mascot, svg[data-companion]').length, 0);
});

test('settings: the companion can be chosen or switched off at any time', async () => {
  const { auth } = await boot();
  window.location.hash = '#/beallitasok';
  const picker = await screen.findByRole('radiogroup', { name: 'Kísérő' });
  const options = within(picker).getAllByRole('radio');
  assert.equal(options.length, 4);
  await act(async () => { fireEvent.click(within(picker).getByRole('radio', { name: /Kísérő nélkül/ })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  assert.equal(auth.store.data.profile.companion, 'none');
});
