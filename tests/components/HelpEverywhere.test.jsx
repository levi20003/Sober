// @vitest-environment jsdom
// K1: a „Segítség most” minden állapotban elérhető. Egy modális <dialog> megnyitásakor a háttér (a fejléc
// „Segítség most” gombja is) inertté válik, és a teljes képernyős rétegek (ünneplés, helyreállító kód) eltakarják.
// Ezért minden modális ablakban és rétegben magában is kell lennie egy krízislinknek.
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, cleanup, render, within, act } from '@testing-library/react';
import { Sheet } from '../../src/components/Info.jsx';
import { QuickAddSheet } from '../../src/components/shell/QuickAddSheet.jsx';
import { QuickLog } from '../../src/components/QuickLog.jsx';
import { FreshStartModal } from '../../src/components/timeline/FreshStartModal.jsx';
import { Celebration } from '../../src/components/home/Celebration.jsx';
import { App, RecoveryOverlay } from '../../src/App.jsx';
import { createAppAuth, AuthStatus } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { openBestBackend, MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { makeVault, renderWithApp, markNoticesSeen, daysAgo, PIN } from './setup.jsx';

afterEach(cleanup);
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; markNoticesSeen(); });

const noop = () => {};
/** A krízislink a megadott konténeren BELÜL legyen, ne csak a (most inert) háttérben. */
function assertHelpInside(container, what) {
  const links = within(container).queryAllByRole('link').filter((a) => a.getAttribute('href') === '#/segitseg');
  assert.ok(links.length > 0, `${what}: nincs „Segítség most” link a modális rétegen belül`);
}

test('K1: every bottom sheet (info, notices, mood, setup) carries its own help link', () => {
  renderWithApp(<Sheet title="Tudnivaló" onClose={noop}><p>x</p></Sheet>);
  assertHelpInside(document.querySelector('dialog.sheet'), 'Sheet');
});

test('K1: quick-add sheet carries its own help link', () => {
  renderWithApp(<QuickAddSheet onClose={noop} onPick={noop} onSlip={noop} />);
  assertHelpInside(document.querySelector('dialog.sheet'), 'QuickAddSheet');
});

test('K1: quick-log dialog carries its own help link', async () => {
  const { vault } = await makeVault();
  renderWithApp(<QuickLog />, { vault });
  fireEvent.click(document.querySelector('.quick-card'));
  assertHelpInside(document.querySelector('dialog.quick-dialog'), 'QuickLog');
});

test('K1: the slip form itself (not only the summary) carries a help link', async () => {
  const { vault } = await makeVault();
  renderWithApp(<FreshStartModal onClose={noop} />, { vault });
  assertHelpInside(document.querySelector('dialog.sheet-dialog'), 'FreshStartModal (form)');
});

test('K1: full-screen layers (celebration, recovery code) carry a help link', () => {
  renderWithApp(<Celebration days={30} onClose={noop} />);
  assertHelpInside(document.querySelector('.celebrate'), 'Celebration');
  cleanup();
  renderWithApp(<RecoveryOverlay code="ABCD-EFGH" onDone={noop} />);
  assertHelpInside(document.querySelector('.celebrate'), 'RecoveryOverlay');
});

test('K1: storage error screen and memory-only mode keep the help button', async () => {
  window.location.hash = '';
  localStorage.setItem('jozansag-szamlalo:has-idb-vault', '1');
  const auth = createAppAuth({ openBackend: () => openBestBackend({ openIndexedDB: async () => { throw new Error('x'); }, getLocalStorage: () => window.localStorage }) });
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await act(async () => { await auth.init().catch(() => {}); }); // az init szándékosan továbbdobja a hibát
  assert.equal(auth.getState().status, AuthStatus.STORAGE_ERROR);
  assert.equal(screen.getByRole('link', { name: 'Most segítségre van szükségem' }).getAttribute('href'), '#/segitseg');
  localStorage.removeItem('jozansag-szamlalo:has-idb-vault');
  cleanup();

  // Csak memóriában tárolt napló (privát mód): a figyelmeztető sáv mellett is ott a gomb.
  const backend = new MemoryBackend();
  const mem = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await mem.init();
  await mem.setup(PIN, createInitialData({ journeyStart: daysAgo(3), dailyCostHuf: 0 }));
  render(<App auth={mem} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  assert.ok(document.querySelector('.banner-warn'), 'memory-only warning is shown');
  assert.equal(within(document.querySelector('.appbar')).getByRole('link', { name: 'Most segítségre van szükségem' }).getAttribute('href'), '#/segitseg');
});

test('K7: right after a slip today, no screen shows a bare "0 nap" and help is offered, not forced', async () => {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(PIN, createInitialData({ journeyStart: daysAgo(20), dailyCostHuf: 2500, goalDays: 30, lastCelebration: 365 }));
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  fireEvent.click(screen.getByRole('button', { name: 'Gyors rögzítés' }));
  fireEvent.click(within([...document.querySelectorAll('dialog.sheet')].at(-1)).getByRole('button', { name: 'Megcsúsztam' })); // (a mentés-emlékeztető is nyitva lehet)
  const dlg = document.querySelector('dialog.sheet-dialog');
  assertHelpInside(dlg, 'slip form');
  fireEvent.click(within(dlg).getByRole('button', { name: 'Új szakasz kezdése' }));
  await screen.findByRole('heading', { name: 'Új szakasz kezdődik' });
  assert.equal(window.location.hash === '#/segitseg', false, 'the crisis screen is not opened by itself');
  const offer = within(document.querySelector('dialog.sheet-dialog')).getByRole('link', { name: 'Segélyvonalak megnyitása' });
  assert.equal(offer.getAttribute('href'), '#/segitseg');
  assert.ok(screen.getByText(/Légy kedves magadhoz/));
  fireEvent.click(screen.getByRole('button', { name: 'Tovább a kezdőlapra' }));
  for (const hash of ['#/', '#/idovonal']) {
    await act(async () => { window.location.hash = hash; await new Promise((r) => setTimeout(r, 30)); });
    assert.doesNotMatch(document.body.textContent, /(^|[^\d])0 nap(?!ot|ja)/, `bare "0 nap" on ${hash}`);
  }
});
