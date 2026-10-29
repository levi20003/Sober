// @vitest-environment jsdom
import { test, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert/strict';
import { render, screen, fireEvent, within, act, cleanup } from '@testing-library/react';
import { CrisisOverlay } from '../../src/components/crisis/CrisisOverlay.jsx';
import { CrisisButton } from '../../src/components/crisis/CrisisButton.jsx';
import { ToastProvider } from '../../src/hooks/useToast.jsx';
import { HELPLINES } from '../../src/content/hu.js';
import './setup.jsx';

// Offline: the browser reports offline and every network API fails loudly.
let networkCalls;
beforeEach(() => {
  networkCalls = [];
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket']) {
    vi.stubGlobal(name, function offline(...a) { networkCalls.push(name); throw new TypeError('offline'); });
  }
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  assert.deepEqual(networkCalls, [], 'crisis UI must never touch the network');
});

const renderOverlay = (props = {}) => render(<ToastProvider><CrisisOverlay onClose={() => {}} {...props} /></ToastProvider>);

test('renders standalone: no auth, storage or journal needed', () => {
  renderOverlay();
  assert.ok(screen.getByRole('heading', { level: 1, name: 'Itt vagyunk. Lépésről lépésre.' }));
  assert.ok(screen.getByText(/Nem orvosi eszköz, és nem helyettesíti/));
});

test('offline: every helpline is an accessible tel: link whose name includes the number', () => {
  renderOverlay();
  for (const line of HELPLINES) {
    const link = screen.getByRole('link', { name: new RegExp(line.number.replace(/[-]/g, '\\-')) });
    assert.equal(link.getAttribute('href'), `tel:${line.tel}`);
    assert.ok(link.textContent.includes(line.name));
  }
});

test('offline: tapping a helpline is NOT intercepted – the dialer handles it, no network', () => {
  renderOverlay();
  const outcomes = [];
  const record = (e) => { outcomes.push(e.defaultPrevented); e.preventDefault(); }; // stop jsdom's navigation
  window.addEventListener('click', record);
  for (const line of HELPLINES) fireEvent.click(screen.getByRole('link', { name: new RegExp(line.number.replace(/-/g, '\\-')) }));
  window.removeEventListener('click', record);
  assert.deepEqual(outcomes, HELPLINES.map(() => false), 'default action of every tel: link left intact');
});

test('112 is shown first and separately; S.O.S. 116-123 is the primary talk line', () => {
  renderOverlay();
  const banner = document.querySelector('.card-emergency');
  assert.equal(within(banner).getByRole('link').getAttribute('href'), 'tel:112');
  assert.equal(document.querySelector('.helplines .btn-primary').getAttribute('href'), 'tel:116123');
});

test('copy fallback: copies the number, or selects it and explains when the clipboard is blocked', async () => {
  const writes = [];
  vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { clipboard: { writeText: async (t) => writes.push(t) } }));
  renderOverlay();
  const [first] = screen.getAllByRole('button', { name: 'Szám másolása' });
  await act(async () => { fireEvent.click(first); });
  assert.deepEqual(writes, ['116-123']);
  assert.ok(screen.getByRole('button', { name: 'Kimásolva' }));

  vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { clipboard: undefined }));
  // The first button now reads "Kimásolva"; the next uncopied one is Drog Stop.
  const [drogStop] = screen.getAllByRole('button', { name: 'Szám másolása' });
  await act(async () => { fireEvent.click(drogStop); });
  assert.ok(screen.getByRole('status').textContent.includes('Jelöld ki'));
  assert.equal(getSelection().toString(), '06-80-505-678');
});

test('Esc (dialog cancel) and both "Vissza" buttons close the overlay', () => {
  const onClose = vi.fn();
  renderOverlay({ onClose });
  fireEvent(document.querySelector('dialog.crisis-overlay'), new Event('cancel', { cancelable: true }));
  for (const b of screen.getAllByRole('button', { name: 'Vissza' })) fireEvent.click(b);
  assert.equal(onClose.mock.calls.length, 3);
});

test('late night: a tailored, gentle note appears', () => {
  renderOverlay({ now: new Date('2026-10-28T23:30:00') });
  assert.ok(screen.getByRole('complementary', { name: 'Késő van' }));
});

test('the trigger is a plain link (works before JS state exists) with the full label', () => {
  render(<CrisisButton />);
  const link = screen.getByRole('link', { name: 'Most segítségre van szükségem' });
  assert.equal(link.getAttribute('href'), '#/segitseg');
});
