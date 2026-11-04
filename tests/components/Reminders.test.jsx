// @vitest-environment jsdom
// 4.5: az emlékeztető alapból ki van kapcsolva, a gyakoriságot és az időpontot a felhasználó választja, a szöveg nem sürget.
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { Reminders } from '../../src/components/Reminders.jsx';
import { ToastProvider } from '../../src/hooks/useToast.jsx';
import { VaultStore } from '../../src/storage/store.js';
import { MemoryBackend } from '../../src/storage/backends.js';
import * as hu from '../../src/content/locales/hu.js';
import * as en from '../../src/content/locales/en.js';

afterEach(cleanup);

test('reminders are off by default and the frequency can be chosen without switching them on', async () => {
  const store = new VaultStore(new MemoryBackend());
  assert.deepEqual((await store.getMeta()).reminders, { enabled: false, time: '20:00', everyDays: 1 });
  document.body.innerHTML = '<div id="toast"></div>';
  render(<ToastProvider><Reminders store={store} /></ToastProvider>, { container: document.body.appendChild(document.createElement('div')) });
  const sw = await screen.findByRole('switch');
  assert.equal(sw.checked, false);
  assert.equal(screen.getAllByRole('radio').length, 4);
  await act(async () => { fireEvent.click(screen.getByRole('radio', { name: 'Hetente' })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
  const m = await store.getMeta();
  assert.equal(m.reminders.everyDays, 7);
  assert.equal(m.reminders.enabled, false, 'choosing a frequency never turns reminders on');
});

test('the service worker respects the chosen frequency and the notification text stays neutral', () => {
  const sw = readFileSync('src/sw/sw.template.js', 'utf8');
  assert.match(sw, /\[1, 2, 3, 7\]\.includes\(rem\.everyDays\)/);
  assert.match(sw, /if \(since < every\) return;/);
  for (const L of [hu, en]) {
    const text = JSON.stringify(L.NOTIFICATION).toLowerCase();
    for (const w of ['ne felejtsd', 'muszáj', 'kihagytad', 'hiányoztál', "don't forget", 'you missed', 'must', 'missed you']) assert.ok(!text.includes(w), w);
  }
});
