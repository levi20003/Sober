// @vitest-environment jsdom
import { vi, test, afterEach, beforeEach } from 'vitest';

// Az angol felület külön fájlban fut: a nyelv a modulok betöltésekor dől el, ezért a betöltés ELŐTT állítjuk be.
vi.hoisted(() => { process.env.VITE_LOCALE = 'en'; import.meta.env.VITE_LOCALE = 'en'; });

import assert from 'node:assert/strict';
import { screen, fireEvent, cleanup, waitFor, render, within } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { daysAgo, markNoticesSeen, PIN } from './setup.jsx';

afterEach(cleanup);
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; localStorage.clear(); markNoticesSeen(); });

const HUNGARIAN = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/;

async function boot() {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(PIN, createInitialData({ journeyStart: daysAgo(12), dailyCostHuf: 12, nickname: 'Sam', goalDays: 30, lastCelebration: 365 }));
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Main navigation' });
  return auth;
}

test('English UI: every tab is in English, with dollars and the US helplines by default (en-US)', async () => {
  await boot();
  assert.ok(screen.getByRole('heading', { name: /Hi, Sam/ }));
  const nav = screen.getByRole('navigation', { name: 'Main navigation' });
  const seen = [];
  for (const name of ['Home', 'Timeline', 'Savings', 'Tools', 'Settings']) {
    fireEvent.click(within(nav).getByRole('link', { name }));
    if (name !== 'Home') await waitFor(() => assert.equal(document.querySelector('.appbar-title').textContent, name));
    const text = document.body.textContent.replace(/Pötty/g, '');
    seen.push(text);
    assert.ok(!HUNGARIAN.test(text), `Hungarian text on "${name}": ${text.match(/.{0,30}[áéíóöőúüűÁÉÍÓÖŐÚÜŰ].{0,30}/)?.[0]}`);
  }
  assert.ok(seen[2].includes('$'), 'savings are shown in dollars');
});

test('English UI: the crisis overlay shows the picked country\'s helplines and keeps the emergency line first', async () => {
  await boot();
  fireEvent.click(screen.getByRole('link', { name: 'I need help right now' }));
  const dlg = await screen.findByRole('dialog', { hidden: true });
  const hrefs = () => [...dlg.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href'));
  assert.deepEqual(hrefs()[0], 'tel:911', 'US default: 911 first');
  assert.ok(hrefs().includes('tel:988'));
  fireEvent.click(within(dlg).getByLabelText('United Kingdom'));
  await waitFor(() => assert.equal(hrefs()[0], 'tel:999'));
  assert.ok(hrefs().includes('tel:116123'));
  fireEvent.click(within(dlg).getByLabelText('Hungary'));
  await waitFor(() => assert.ok(hrefs().includes('tel:116123') && hrefs().includes('tel:0680505678')));
  fireEvent.click(within(dlg).getByLabelText('Other country'));
  await waitFor(() => assert.ok(dlg.querySelector('a[href="https://findahelpline.com"]')));
  assert.ok(within(dlg).getByText(/Needs an internet connection/));
  assert.ok(!HUNGARIAN.test(dlg.textContent.replace(/Kék Vonal|Pötty/g, '')), 'no stray Hungarian on the English crisis page');
});
