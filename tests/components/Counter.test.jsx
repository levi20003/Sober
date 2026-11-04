// @vitest-environment jsdom
// A számláló 2026-11-es kérése: nincs kör és nagy középső szám, nincs „Jelenlegi szakasz” felirat; a kezdés napja és
// órája a Beállításokban percre pontosan megadható.
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { App } from '../../src/App.jsx';
import { createAppAuth } from '../../src/auth/appAuth.js';
import { createHashRouter } from '../../src/lib/hashRouter.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import { createInitialData } from '../../src/domain/schema.js';
import { toDateKey } from '../../src/domain/dates.js';
import { markNoticesSeen, PIN } from './setup.jsx';
import { resetPrefsCache } from '../../src/hooks/usePrefs.js';

afterEach(() => { cleanup(); resetPrefsCache(); });
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; localStorage.clear(); markNoticesSeen(); });

async function boot(profile) {
  window.location.hash = '';
  const backend = new MemoryBackend();
  const auth = createAppAuth({ openBackend: async () => backend, storeOptions: { pinIterations: 1000, recoveryIterations: 1000, minIterations: 1000 } });
  await auth.init();
  await auth.setup(PIN, createInitialData({ dailyCostHuf: 0, lastCelebration: 365, ...profile }));
  render(<App auth={auth} router={createHashRouter(window)} />, { container: document.body.appendChild(document.createElement('div')) });
  await screen.findByRole('navigation', { name: 'Fő navigáció' });
  return { auth };
}

test('home counter: no ring, no day-of-clock percentage, no "Jelenlegi szakasz" label; a fresh start shows 0 days', async () => {
  const startedAt = new Date(Date.now() - 20_000);
  await boot({ journeyStart: toDateKey(startedAt), journeyStartAt: startedAt.toISOString() });
  const hero = document.querySelector('.hero-card');
  assert.equal(hero.querySelector('.hero-ring'), null, 'the ring is gone');
  assert.ok(!/A mai nap: \d+%/.test(hero.innerHTML));
  assert.ok(!/Jelenlegi szakasz/.test(hero.textContent));
  assert.equal(hero.querySelector('.hero-value').textContent, '0');
  const cells = [...hero.querySelectorAll('.lc-cell')].map((c) => c.querySelector('.lc-label').textContent);
  assert.deepEqual(cells, ['nap', 'óra', 'perc', 'mp']);
  const nap = hero.querySelector('.lc-days .lc-bar i').style.transform;
  assert.ok(Number(nap.match(/scaleX\(([\d.e-]+)\)/)[1]) < 0.01, `day bar starts empty, not at the time of day (${nap})`);
});

test('settings: the start can be set to the minute (date + hh:mm) and the counter follows', async () => {
  const { auth } = await boot({ journeyStart: toDateKey() });
  window.location.hash = '#/beallitasok';
  const time = await screen.findByLabelText('Időpont (óra:perc)');
  const y = new Date(Date.now() - 2 * 86400000);
  fireEvent.change(screen.getByLabelText('Az út kezdete'), { target: { value: toDateKey(y) } });
  fireEvent.change(time, { target: { value: '07:15' } });
  await act(async () => { fireEvent.submit(time.closest('form')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  const p = auth.store.data.profile;
  assert.equal(p.journeyStart, toDateKey(y));
  const at = new Date(p.journeyStartAt);
  assert.deepEqual([at.getHours(), at.getMinutes(), toDateKey(at)], [7, 15, toDateKey(y)]);
});

test('settings: a start in the future is refused', async () => {
  const { auth } = await boot({ journeyStart: toDateKey() });
  window.location.hash = '#/beallitasok';
  const time = await screen.findByLabelText('Időpont (óra:perc)');
  const later = new Date(Date.now() + 2 * 3600_000);
  if (toDateKey(later) !== toDateKey()) return; // késő este nem tesztelhető így
  fireEvent.change(time, { target: { value: `${String(later.getHours()).padStart(2, '0')}:${String(later.getMinutes()).padStart(2, '0')}` } });
  await act(async () => { fireEvent.submit(time.closest('form')); });
  await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  assert.equal(auth.store.data.profile.journeyStartAt, undefined);
  assert.ok(await screen.findByText(/Jövőbeli dátumot nem adhatsz meg/));
});
