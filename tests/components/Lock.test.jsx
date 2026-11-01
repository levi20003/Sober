// @vitest-environment jsdom
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, cleanup, waitFor, render, act, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth, AuthStatus } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { daysAgo, markNoticesSeen } from './setup.jsx';

afterEach(cleanup);
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; markNoticesSeen(); });

async function lockedApp(pin) {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(pin, createInitialData({ journeyStart: daysAgo(3) }));
  await act(async () => { auth.lock('manual'); });
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('heading', { name: 'Üdv újra' });
  return auth;
}
const tap = (digits) => { for (const d of digits) fireEvent.click(screen.getByRole('button', { name: d, exact: true })); };

test('lock screen: a digits-only PIN gets a keypad and opens by itself after the last digit', async () => {
  const auth = await lockedApp('2581');
  await screen.findByRole('group', { name: 'PIN-billentyűzet' });
  assert.equal(screen.queryByRole('button', { name: 'Megnyitás' }), null, 'no submit button is needed');
  assert.equal(document.querySelectorAll('.pin-dots i').length, 4);
  tap('258');
  assert.equal(auth.getState().status, AuthStatus.LOCKED, 'not before the last digit');
  tap('1');
  await waitFor(() => assert.equal(auth.getState().status, AuthStatus.UNLOCKED));
});

test('lock screen: a wrong PIN says so, clears the dots and deletes nothing; the right one still works', async () => {
  const auth = await lockedApp('2581');
  await screen.findByRole('group', { name: 'PIN-billentyűzet' });
  tap('0000');
  await screen.findByText('Ez nem a megfelelő PIN-kód.');
  await waitFor(() => assert.equal(document.querySelectorAll('.pin-dots i.on').length, 0));
  assert.equal(auth.getState().status, AuthStatus.LOCKED);
  assert.ok(await auth.store.exists(), 'nothing was erased');
});

test('lock screen: a passphrase gets one big field that can be shown, and a submit button', async () => {
  const auth = await lockedApp('korte-alma-fa-2581');
  const field = await screen.findByLabelText('PIN-kód');
  assert.equal(field.type, 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Megjelenítés' }));
  assert.equal(field.type, 'text');
  assert.equal(screen.queryByRole('group', { name: 'PIN-billentyűzet' }), null);
  fireEvent.change(field, { target: { value: 'korte-alma-fa-2581' } });
  fireEvent.click(screen.getByRole('button', { name: 'Megnyitás' }));
  await waitFor(() => assert.equal(auth.getState().status, AuthStatus.UNLOCKED));
});

test('lock screen: recovery and reset live behind "Segítség a belépéshez", not on the main screen', async () => {
  await lockedApp('2581');
  assert.equal(screen.queryByText('Elfelejtettem a PIN-kódot'), null);
  fireEvent.click(screen.getByRole('button', { name: 'Segítség a belépéshez' }));
  const dlg = await screen.findByRole('dialog', { hidden: true });
  assert.ok(within(dlg).getByText('Elfelejtettem a PIN-kódot'));
  assert.ok(within(dlg).getByText('Nincs meg sem a PIN-kód, sem a helyreállító kód'));
});

test('the quick keypad can be switched off: then the PIN length is not even stored', async () => {
  const auth = await lockedApp('2581');
  let meta = await auth.store.getMeta();
  assert.equal(meta.pinHint, 4, 'remembered after setup (unencrypted: only the length)');
  await auth.store.setMeta({ quickPin: false, pinHint: null });
  await act(async () => { await auth.unlock('2581'); auth.lock('manual'); });
  meta = await auth.store.getMeta();
  assert.equal(meta.pinHint, null, 'not written again once switched off');
});
