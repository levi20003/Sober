// @vitest-environment jsdom
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, cleanup, waitFor, render, act, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth, AuthStatus } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { toDateKey, addDays } from '../../src/domain/dates.js';
import { markNoticesSeen } from './setup.jsx';

afterEach(cleanup);
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; markNoticesSeen(); });

async function boot() {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  const router = createHashRouter(window);
  const utils = render(<App auth={auth} router={router} />, { container: document.body.appendChild(document.createElement('div')) });
  await act(async () => { await auth.init(); });
  await screen.findByRole('heading', { name: /csendes, privát helyed/ });
  return { auth, router, backend, ...utils };
}
const next = () => fireEvent.click(screen.getByRole('button', { name: /^(Tovább|Kezdjük)$/ }));
const step = async (n) => waitFor(() => assert.equal(screen.getByRole('progressbar').getAttribute('aria-valuenow'), String(n)));

test('onboarding: 5 short steps, help button and progress on every step; only "what to avoid" is required', async () => {
  await boot();
  assert.ok(screen.getByText('1 / 5'));
  assert.ok(screen.getByRole('link', { name: 'Most segítségre van szükségem' }));
  assert.ok(screen.getByLabelText(/Hogy szólíthatlak/), 'the nickname is an optional field on the first screen');
  next(); await step(2);
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, true, 'substances are required');
  fireEvent.click(screen.getByLabelText('Alkohol'));
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false);
  assert.ok(screen.getByRole('link', { name: 'Most segítségre van szükségem' }));
  next(); await step(3);
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false, '"I start today" is the default');
  assert.ok(screen.getByRole('link', { name: 'Most segítségre van szükségem' }));
});

test('onboarding: a future start date is blocked', async () => {
  await boot();
  next(); await step(2);
  fireEvent.click(screen.getByLabelText('Alkohol')); next(); await step(3);
  fireEvent.click(screen.getByLabelText('Korábban kezdtem'));
  const input = document.querySelector('input[type=date]');
  assert.equal(input.max, toDateKey());
  fireEvent.change(input, { target: { value: addDays(toDateKey(), 3) } });
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, true);
  assert.ok(screen.getByRole('alert').textContent.includes('Jövőbeli dátumot'));
  fireEvent.change(input, { target: { value: addDays(toDateKey(), -5) } });
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false);
});

test('onboarding: everything is saved encrypted only after the PIN, the recovery checkbox is required', async () => {
  const { auth, backend } = await boot();
  fireEvent.change(document.querySelector('input[name=nickname]'), { target: { value: 'Dani' } });
  next(); await step(2);
  fireEvent.click(screen.getByLabelText('Alkohol')); next(); await step(3);
  fireEvent.click(screen.getByLabelText('Korábban kezdtem'));
  fireEvent.change(document.querySelector('input[type=date]'), { target: { value: addDays(toDateKey(), -10) } });
  next(); await step(4);
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP, 'nothing is created before the PIN step');
  assert.ok(!JSON.stringify([...backend.map]).includes('Dani'), 'no personal data stored before the PIN');
  fireEvent.change(document.querySelector('input[name=pin]'), { target: { value: 'korte-alma-fa-2581' } });
  fireEvent.change(document.querySelector('input[name=pin2]'), { target: { value: 'korte-alma-fa-0000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
  await screen.findByRole('alert');
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP, 'mismatch creates nothing');
  fireEvent.change(document.querySelector('input[name=pin2]'), { target: { value: 'korte-alma-fa-2581' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
  await step(5);
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.ok(screen.getByTestId('recovery-code').textContent.length > 10);
  assert.equal(screen.getByRole('button', { name: 'Irány a főoldal' }).disabled, true, 'needs the "Elmentettem" checkbox');
  fireEvent.click(screen.getByLabelText('Elmentettem biztonságos helyre'));
  const p = auth.store.data.profile;
  assert.deepEqual([p.nickname, p.substances, p.journeyStart], ['Dani', ['alcohol'], addDays(toDateKey(), -10)]);
  assert.ok(!JSON.stringify([...backend.map]).includes('Dani'), 'encrypted at rest');
  fireEvent.click(screen.getByRole('button', { name: 'Irány a főoldal' }));
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  assert.ok(screen.getByRole('heading', { name: /Szia, Dani/ }));
  assert.ok(document.querySelector('.setup-card'), 'goal, cost and hard situations are offered on the home screen instead');
});
