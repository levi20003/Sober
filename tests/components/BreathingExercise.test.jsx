// @vitest-environment jsdom
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { BreathingExercise } from '../../src/components/crisis/BreathingExercise.jsx';
import { fakeClock } from './setup.jsx';

afterEach(cleanup);

function setup() {
  const clock = fakeClock();
  render(<BreathingExercise clock={clock} />);
  const label = () => document.querySelector('.breath-label').textContent;
  const count = () => document.querySelector('.breath-count').textContent;
  const circle = () => document.querySelector('.breath-circle');
  const tick = (ms) => act(() => clock.advance(ms));
  return { clock, label, count, circle, tick };
}

test('4-7-8: inhale 4 → hold 7 → exhale 8, with countdown and rounds', () => {
  const { label, count, circle, tick } = setup();
  fireEvent.click(screen.getByLabelText('4-7-8 légzés'));
  assert.match(label(), /belégzés 4, benntartás 7, kilégzés 8 ütemre/i, 'pattern description shown before starting');
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  assert.equal(label(), 'Belégzés az orron');
  assert.equal(count(), '4');
  assert.equal(circle().dataset.kind, 'in');
  assert.ok(screen.getByText('1. kör / 4'));
  tick(4000);
  assert.deepEqual([label(), count(), circle().dataset.kind], ['Benntartás', '7', 'hold']);
  tick(7000);
  assert.deepEqual([label(), count(), circle().dataset.kind], ['Lassú kilégzés a szádon', '8', 'out']);
  tick(8000);
  assert.ok(screen.getByText('2. kör / 4'));
});

test('the circle animates via CSSOM (allowed by the CSP) toward the step\'s end size', () => {
  const { circle } = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  assert.equal(circle().style.transform, 'scale(1)'); // inhale → full size
  assert.equal(circle().style.transitionDuration, '4000ms');
  assert.equal(circle().getAttribute('style').includes('scale'), true);
});

test('pause freezes the countdown; resume continues in the same phase', () => {
  const { label, count, tick } = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  tick(1500);
  fireEvent.click(screen.getByRole('button', { name: 'Szüneteltetés' }));
  const frozen = count();
  assert.equal(label(), 'Megállítva. Bármikor folytathatod.');
  tick(60_000);
  assert.equal(count(), frozen, 'time does not pass while paused');
  fireEvent.click(screen.getByRole('button', { name: 'Folytatás' }));
  assert.equal(label(), 'Belégzés az orron');
});

test('finishes kindly and can be restarted', () => {
  const { label, tick } = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  tick(10 * 60_000);
  assert.equal(label(), 'Szépen csináltad. Hogy érzed magad most?');
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  assert.ok(screen.getByText('1. kör / 6'));
});

test('switching pattern resets the exercise', () => {
  const { label, tick } = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Indítás' }));
  tick(2000);
  fireEvent.click(screen.getByLabelText('Négyzetlégzés'));
  assert.match(label(), /Négy egyforma szakasz/);
  assert.ok(screen.getByRole('button', { name: 'Indítás' }));
});
