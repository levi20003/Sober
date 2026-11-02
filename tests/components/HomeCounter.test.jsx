// @vitest-environment jsdom
// Főoldali élő számláló, heti sáv (a mai nap még nincs „kész”), koppintásra másolható helyreállító kód, bevezető.
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react';
import { WeekGlance } from '../../src/components/home/Widgets.jsx';
import { LiveCounter } from '../../src/components/home/LiveCounter.jsx';
import { RecoveryCodeCard } from '../../src/components/RecoveryCodeCard.jsx';
import { ToastProvider } from '../../src/hooks/useToast.jsx';
import { markNoticesSeen } from './setup.jsx';

afterEach(cleanup);
beforeEach(() => { document.body.innerHTML = '<div id="toast"></div>'; markNoticesSeen(); });

test('week: today is an empty ring (the day is not over yet), earlier sober days are ticked', () => {
  // 2026-11-02 hétfő: a hét első napja a mai nap.
  render(<WeekGlance events={[]} today="2026-11-03" journeyStart="2026-10-01" />);
  const days = [...document.querySelectorAll('.day-dot')];
  assert.ok(days[0].classList.contains('is-sober'), 'Monday (yesterday) is done');
  assert.ok(days[1].classList.contains('is-today'));
  assert.ok(!days[1].classList.contains('is-sober'), 'today is not ticked yet');
  assert.equal(days[1].querySelector('svg'), null, 'no check icon today');
});

test('live counter: years, months, weeks, days, hours, minutes, seconds with bars, ticking every second', () => {
  let t = new Date('2027-03-15T10:20:30').getTime();
  const ticks = [];
  const clock = { now: () => t, every: (fn) => { ticks.push(fn); return () => {}; } };
  render(<LiveCounter start={new Date('2026-01-01T00:00:00')} clock={clock} />);
  const cell = (label) => screen.getByText(label, { selector: '.lc-label' }).closest('.lc-cell').querySelector('.lc-value').textContent;
  assert.deepEqual(['év', 'hó', 'hét', 'nap', 'óra', 'perc', 'mp'].map(cell), ['1', '2', '2', '0', '10', '20', '30']);
  assert.ok(document.querySelectorAll('.lc-cell .lc-bar i').length >= 7, 'every unit has a bar');
  t += 1000;
  act(() => ticks.forEach((f) => f()));
  assert.equal(cell('mp'), '31');
});

test('live counter: hides empty leading units, and says when the phase starts tomorrow', () => {
  const clock = { now: () => new Date('2026-11-02T09:26:05').getTime(), every: () => () => {} };
  render(<LiveCounter start={new Date('2026-11-02T09:00:00')} clock={clock} />);
  assert.equal(screen.queryByText('év', { selector: '.lc-label' }), null);
  assert.ok(screen.getByText('perc', { selector: '.lc-label' }));
  cleanup();
  render(<LiveCounter start={new Date('2026-11-03T00:00:00')} clock={clock} />);
  assert.ok(screen.getByText(/Holnap kezdődik/));
});

test('recovery code: one tap on the code copies it; the plain code stays readable for tests and screen readers', async () => {
  const written = [];
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (s) => written.push(s) }, configurable: true });
  render(<ToastProvider><RecoveryCodeCard code="BDX9-69EA-RH1S-NW4B-HX3M-Q10G-NPX8-ZEME" /></ToastProvider>);
  assert.equal(screen.getByTestId('recovery-code').textContent, 'BDX9-69EA-RH1S-NW4B-HX3M-Q10G-NPX8-ZEME');
  assert.equal(document.querySelectorAll('.rc-group').length, 8);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Helyreállító kód másolása/ })); });
  assert.deepEqual(written, ['BDX9-69EA-RH1S-NW4B-HX3M-Q10G-NPX8-ZEME']);
  assert.ok(screen.getByText('Kimásolva'));
});
