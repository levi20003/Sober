// @vitest-environment jsdom
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, cleanup, render } from '@testing-library/react';
import { backupDue, snoozeUntil } from '../src/domain/backup.js';
import { validateProfile } from '../src/domain/schema.js';
import { PreviewNotice } from '../src/components/home/Notices.jsx';
import { InfoButton } from '../src/components/Info.jsx';
import { hasSeen, resetPrefsCache } from '../src/hooks/usePrefs.js';
import { CrisisOverlay } from '../src/components/crisis/CrisisOverlay.jsx';
import { RouterContext } from '../src/hooks/useHashRoute.js';
import { ToastProvider } from '../src/hooks/useToast.jsx';
import { createHashRouter } from '../src/lib/hashRouter.js';

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); resetPrefsCache(); });

const data = (days, events = 0) => ({ profile: { journeyStart: new Date(Date.now() - days * 864e5).toLocaleDateString('sv-SE') }, events: Array.from({ length: events }, () => ({})) });

test('backup reminder: only when there is something to save, never saved or long ago, and not while snoozed', () => {
  const none = { lastBackup: null, backupSnoozeUntil: null };
  assert.equal(backupDue(none, data(2, 1)), false, 'a brand new journal is not worth nagging about');
  assert.equal(backupDue(none, data(20)), true);
  assert.equal(backupDue(none, data(1, 6)), true);
  assert.equal(backupDue({ lastBackup: new Date().toISOString(), backupSnoozeUntil: null }, data(60)), false, 'saved today');
  assert.equal(backupDue({ lastBackup: new Date(Date.now() - 40 * 864e5).toISOString(), backupSnoozeUntil: null }, data(60)), true, 'saved 40 days ago');
  assert.equal(backupDue({ lastBackup: null, backupSnoozeUntil: snoozeUntil(new Date(), 7) }, data(60)), false, 'snoozed');
});

test('the preview notice pops up once and is remembered', () => {
  const { unmount } = render(<ToastProvider><RouterContext.Provider value={createHashRouter(window)}><PreviewNotice /></RouterContext.Provider></ToastProvider>);
  assert.ok(screen.getByRole('heading', { name: 'Előzetes verzió' }));
  assert.ok(screen.getByRole('link', { name: /Most segítségre van szükségem/ }), 'help stays reachable inside the notice');
  fireEvent.click(screen.getByRole('button', { name: 'Értem' }));
  assert.ok(hasSeen('preview'));
  unmount();
  resetPrefsCache();
  render(<ToastProvider><RouterContext.Provider value={createHashRouter(window)}><PreviewNotice /></RouterContext.Provider></ToastProvider>);
  assert.equal(screen.queryByRole('heading', { name: 'Előzetes verzió' }), null);
});

test('info button: the explanation is hidden until asked for', () => {
  render(<InfoButton title="Cím"><p>A hosszú magyarázat</p></InfoButton>);
  assert.equal(screen.queryByText('A hosszú magyarázat'), null);
  fireEvent.click(screen.getByRole('button', { name: /Tudnivalók: Cím/ }));
  assert.ok(screen.getByText('A hosszú magyarázat'));
  fireEvent.click(screen.getByRole('button', { name: 'Értem' }));
  assert.equal(screen.queryByText('A hosszú magyarázat'), null);
});

test('trusted person: validated, and shown on the crisis page as a tel: link next to (not instead of) the helplines', () => {
  assert.deepEqual(validateProfile({ journeyStart: '2026-01-01', trustedContact: { name: ' Anna ', phone: '+36 30 123 4567' } }).trustedContact, { name: 'Anna', phone: '+36 30 123 4567' });
  assert.throws(() => validateProfile({ journeyStart: '2026-01-01', trustedContact: { name: 'Anna', phone: 'abc' } }));
  assert.throws(() => validateProfile({ journeyStart: '2026-01-01', trustedContact: { name: '', phone: '123456' } }));
  render(<ToastProvider><CrisisOverlay onClose={() => {}} trusted={{ name: 'Anna', phone: '+36 30 123 4567' }} /></ToastProvider>);
  assert.equal(screen.getByRole('link', { name: /Anna/ }).getAttribute('href'), 'tel:+36301234567');
  assert.equal(document.querySelector('a[href="tel:112"]') !== null, true, 'helplines untouched');
  assert.equal(document.querySelector('a[href="tel:116123"]') !== null, true);
});
