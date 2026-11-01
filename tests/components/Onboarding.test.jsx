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

test('onboarding: 10 steps, help button and progress on every step, skippable only where optional', async () => {
  await boot();
  assert.ok(screen.getByText('1 / 10'));
  assert.ok(screen.getByRole('link', { name: 'Most segítségre van szükségem' }));
  assert.ok(!screen.queryByRole('button', { name: 'Kihagyom' }), 'welcome step has no skip');
  next(); await step(2);
  assert.ok(screen.getByRole('button', { name: 'Kihagyom' }), 'nickname is optional');
  fireEvent.click(screen.getByRole('button', { name: 'Kihagyom' })); await step(3);
  assert.ok(!screen.queryByRole('button', { name: 'Kihagyom' }));
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, true, 'substances are required');
  fireEvent.click(screen.getByLabelText('Alkohol'));
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false);
  assert.ok(screen.getByRole('link', { name: 'Most segítségre van szükségem' }));
});

test('onboarding: a future start date is blocked', async () => {
  await boot();
  next(); await step(2); next(); await step(3);
  fireEvent.click(screen.getByLabelText('Alkohol')); next(); await step(4);
  fireEvent.click(screen.getByLabelText('Korábban kezdtem'));
  const input = document.querySelector('input[type=date]');
  assert.equal(input.max, toDateKey());
  fireEvent.change(input, { target: { value: addDays(toDateKey(), 3) } });
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, true);
  assert.ok(screen.getByRole('alert').textContent.includes('Jövőbeli dátumot'));
  fireEvent.change(input, { target: { value: addDays(toDateKey(), -5) } });
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false);
});

test('onboarding: full run saves everything encrypted only after the PIN, recovery checkbox is required', async () => {
  const { auth, backend } = await boot();
  const before = JSON.stringify([...backend.map]);
  assert.ok(!before.includes('Dani'));
  next(); await step(2);
  fireEvent.change(document.querySelector('input[name=nickname]'), { target: { value: 'Dani' } });
  next(); await step(3);
  fireEvent.click(screen.getByLabelText('Alkohol')); next(); await step(4);
  fireEvent.click(screen.getByLabelText('Korábban kezdtem'));
  fireEvent.change(document.querySelector('input[type=date]'), { target: { value: addDays(toDateKey(), -10) } });
  next(); await step(5);
  fireEvent.click(screen.getByLabelText('30 nap')); next(); await step(6);
  fireEvent.change(document.querySelector('input[name=cost]'), { target: { value: '3500' } });
  assert.ok(screen.getByText(/Ez havonta kb\. 105.000 Ft\./));
  next(); await step(7);
  fireEvent.click(screen.getByLabelText('Stressz')); fireEvent.click(screen.getByLabelText('Hétvége'));
  next(); await step(8);
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP, 'nothing is created before the PIN step');
  assert.ok(!JSON.stringify([...backend.map]).includes('Dani'), 'no personal data stored before the PIN');
  fireEvent.change(document.querySelector('input[name=pin]'), { target: { value: 'korte-alma-fa-2581' } });
  fireEvent.change(document.querySelector('input[name=pin2]'), { target: { value: 'korte-alma-fa-0000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
  await screen.findByRole('alert');
  assert.equal(auth.getState().status, AuthStatus.FIRST_TIME_SETUP, 'mismatch creates nothing');
  fireEvent.change(document.querySelector('input[name=pin2]'), { target: { value: 'korte-alma-fa-2581' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' }));
  await step(9);
  assert.equal(auth.getState().status, AuthStatus.UNLOCKED);
  assert.ok(screen.getByTestId('recovery-code').textContent.length > 10);
  const cont = screen.getByRole('button', { name: 'Tovább' });
  assert.equal(cont.disabled, true, 'needs the "Elmentettem" checkbox');
  fireEvent.click(screen.getByLabelText('Elmentettem biztonságos helyre'));
  assert.equal(screen.getByRole('button', { name: 'Tovább' }).disabled, false);
  fireEvent.click(screen.getByRole('button', { name: 'Tovább' })); await step(10);
  assert.ok(screen.getByRole('heading', { name: 'Szép munka, Dani!' }));
  const p = auth.store.data.profile;
  assert.deepEqual([p.nickname, p.substances, p.goalDays, p.triggers], ['Dani', ['alcohol'], 30, ['stress', 'weekend']]);
  assert.equal(p.journeyStart, addDays(toDateKey(), -10));
  assert.ok(!JSON.stringify([...backend.map]).includes('Dani'), 'encrypted at rest');
  fireEvent.click(screen.getByRole('button', { name: 'Irány a főoldal' }));
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  assert.ok(screen.getByRole('heading', { name: /Szia, Dani/ }));
});
