// @vitest-environment jsdom
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, act, cleanup, within, renderHook, waitFor } from '@testing-library/react';
import { Home } from '../../src/components/screens/Home.jsx';
import { TimelineView } from '../../src/components/timeline/TimelineView.jsx';
import { TimelineProvider, useTimeline } from '../../src/hooks/useTimeline.js';
import { Actions } from '../../src/domain/timelineReducer.js';
import { makeVault, renderWithApp, PIN } from './setup.jsx';

afterEach(cleanup);

// Saving encrypts via Web Crypto (thread pool), which act() does not wait for:
// always wait for the visible OUTCOME, never for a fixed number of ticks.
const click = (button) => act(async () => { fireEvent.click(button); });
const gone = (selector) => waitFor(() => assert.ok(!document.querySelector(selector), `${selector} should be closed`));

test('useTimeline: dispatch persists encrypted, then publishes the new snapshot', async () => {
  const { vault, backend } = await makeVault();
  const wrapper = ({ children }) => <TimelineProvider vault={vault}>{children}</TimelineProvider>;
  const { result } = renderHook(() => useTimeline(), { wrapper });
  assert.equal(result.current.snapshot.stats.totalSoberDays, 30);
  await act(async () => { await result.current.dispatch({ type: Actions.LOG_NOTE, payload: { note: 'HOOK_TITOK' } }); });
  assert.equal(result.current.snapshot.data.events.length, 1);
  assert.ok(!JSON.stringify([...backend.map]).includes('HOOK_TITOK'), 'encrypted at rest');
});

test('useTimeline: a failed encrypted save leaves the UI state untouched', async () => {
  const { vault } = await makeVault();
  const wrapper = ({ children }) => <TimelineProvider vault={vault}>{children}</TimelineProvider>;
  const { result } = renderHook(() => useTimeline(), { wrapper });
  const before = result.current.snapshot;
  vault.save = async () => { throw Object.assign(new Error('quota'), { code: 'QUOTA' }); };
  await act(async () => { await assert.rejects(result.current.dispatch({ type: Actions.FRESH_START, payload: {} }), { code: 'QUOTA' }); });
  assert.equal(result.current.snapshot, before);
});

test('<FreshStartModal />: closes the phase as a growth block, keeps every sober day', async () => {
  const { vault, backend } = await makeVault({ startDaysAgo: 30 });
  renderWithApp(<Home />, { vault });
  assert.equal(document.querySelector('.hero-value').textContent, '30 nap');

  fireEvent.click(screen.getByRole('button', { name: 'Megcsúsztam' }));
  const dialog = document.querySelector('dialog.sheet-dialog');
  assert.ok(dialog.hasAttribute('open'), 'modal is open');
  assert.ok(within(dialog).getByText(/Nem törli az eddigi utadat/));
  fireEvent.change(within(dialog).getByLabelText(/Mit vinnél magaddal/), { target: { value: 'Este sétálok.' } });
  fireEvent.change(within(dialog).getByLabelText(/Mire figyelsz/), { target: { value: 'Korán lefekszem.' } });
  await click(within(dialog).getByRole('button', { name: 'Új szakasz kezdése' }));

  await within(dialog).findByRole('heading', { name: 'Új szakasz kezdődik' });
  assert.ok(within(dialog).getByText('30 józan nap. Ez a tiéd marad.'));
  assert.ok(within(dialog).getByText('Összes józan napod: 30'));
  assert.ok(within(dialog).getByText('Korán lefekszem.'));
  assert.equal(within(dialog).getByRole('link', { name: 'Segítség most' }).getAttribute('href'), '#/segitseg');

  fireEvent.click(within(dialog).getByRole('button', { name: 'Tovább a kezdőlapra' }));
  await gone('dialog.sheet-dialog');
  assert.equal(document.querySelector('.hero-value').textContent, '30 nap', 'total unchanged, never reset');
  assert.ok(screen.getByText('Ma új szakasz kezdődött. Az eddigi utad megmaradt.'));
  assert.equal(document.querySelectorAll('.hero .tl-seg').length, 2);

  // Persisted encrypted: a fresh unlock sees the same history.
  assert.ok(!JSON.stringify([...backend.map]).includes('Korán'));
  vault.lock();
  await vault.unlock(PIN);
  assert.equal(vault.data.events.filter((e) => e.type === 'slip').length, 1);
});

test('<FreshStartModal />: Esc cancels without logging anything', async () => {
  const { vault } = await makeVault();
  renderWithApp(<Home />, { vault });
  fireEvent.click(screen.getByRole('button', { name: 'Megcsúsztam' }));
  fireEvent(document.querySelector('dialog.sheet-dialog'), new Event('cancel', { cancelable: true }));
  await gone('dialog.sheet-dialog');
  assert.equal(vault.data.events.length, 0);
});

test('<TimelineView />: phase cards, lesson on the closed phase, never a bare "0 nap"', async () => {
  const { vault } = await makeVault({ startDaysAgo: 30 });
  const { result } = renderHook(() => useTimeline(), { wrapper: ({ children }) => <TimelineProvider vault={vault}>{children}</TimelineProvider> });
  await act(async () => { await result.current.dispatch({ type: Actions.FRESH_START, payload: { lesson: 'Pénteken figyelek.', intention: 'Sétálok.' } }); });
  cleanup();

  renderWithApp(<TimelineView />, { vault });
  const cards = document.querySelectorAll('.phase-card');
  assert.equal(cards.length, 2);
  const [current, closed] = cards;
  assert.ok(within(current).getByText('Holnap kezdődik').classList.contains('phase-days'));
  assert.ok(within(current).getByText('Sétálok.'));
  assert.ok(within(closed).getByText('30 nap').classList.contains('phase-days'));
  assert.ok(within(closed).getByText('Pénteken figyelek.'));
  assert.ok(within(closed).getByText('Megspórolva ebben a szakaszban: 75 000 Ft'));
  assert.ok(!screen.queryByText('0 nap'), 'no bare "0 nap" anywhere');
  assert.ok(screen.getByText('Egy megcsúszás sem törli: minden józan napod megmarad.'));
});

test('quick log: two taps (card → Rögzítés) store a full, encrypted entry', async () => {
  const { vault } = await makeVault();
  renderWithApp(<Home />, { vault });
  fireEvent.click(screen.getByRole('button', { name: 'Stresszes nap' }));          // tap 1
  await click(within(document.querySelector('dialog.quick-dialog')).getByRole('button', { name: 'Rögzítés' })); // tap 2
  await gone('dialog.quick-dialog');
  const [e] = vault.data.events;
  assert.deepEqual([e.type, e.triggers, e.intensity], ['trigger', ['stress'], undefined]);
  assert.ok(screen.getByRole('status').textContent.includes('Rögzítve: Stresszes nap'));
});
