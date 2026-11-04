// @vitest-environment jsdom
// Design-referenciák (R1–R4): a közös elemek viselkedése és hozzáférhetősége.
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { TrendChart, bubbleLeft } from '../../src/components/charts/TrendChart.jsx';
import { Money, StatPill, Tile, WaveProgress } from '../../src/components/design/Design.jsx';

afterEach(cleanup);

test('trend bubble never leaves the chart: clamped to both edges, fixed max width (the old overlapping bubble)', () => {
  assert.equal(bubbleLeft(0), 0);
  assert.equal(bubbleLeft(100), 72);
  assert.equal(bubbleLeft(50), 36);
  for (let x = 0; x <= 100; x += 5) { const l = bubbleLeft(x); assert.ok(l >= 0 && l + 28 <= 100, `x=${x}`); }
  const { container, getByRole } = render(<TrendChart values={[10, null, 80, 95]} labels={['H', 'K', 'Sze', 'Cs']} format={(v) => `${v}%`} label="Hangulat" />);
  const bubble = container.querySelector('.trend-bubble');
  assert.match(bubble.textContent, /95%Cs/);
  assert.equal(bubble.style.left, '72%', 'last point at the right edge: bubble stays inside');
  fireEvent.click(getByRole('button', { name: 'H: 10%' }));
  assert.equal(container.querySelector('.trend-bubble').style.left, '0%');
  assert.ok(getByRole('button', { name: 'K' }).disabled, 'no value, no pick');
  const css = readFileSync('src/styles/design.css', 'utf8');
  assert.match(css, /\.trend-bubble \{[^}]*max-width: 28%/);
});

test('money keeps its text (screen readers, tests) while the number is big and the currency small', () => {
  for (const t of ['75 000 Ft', '$1,234', '1 234,50 €']) {
    const { container, unmount } = render(<Money text={t} />);
    assert.equal(container.textContent, t);
    assert.ok(container.querySelector('.money-num'));
    unmount();
  }
});

test('tiles, pills and the wave progress are accessible', () => {
  const { getByRole, container } = render(<>
    <Tile tone="mint" icon="wave" title="Most nagyon kívánom" desc="10 perc" cta="Megnézem" href="#/eszkozok/hullam" />
    <StatPill icon="star" value={30} label="józan nap összesen" />
    <WaveProgress value={0.4} label="Következő" />
  </>);
  const link = getByRole('link', { name: /Most nagyon kívánom/ });
  assert.equal(link.getAttribute('href'), '#/eszkozok/hullam');
  assert.match(container.querySelector('.stat-pill').textContent, /30józan nap összesen/);
  assert.equal(getByRole('progressbar', { name: 'Következő' }).getAttribute('aria-valuenow'), '40');
});

test('no raw colours in the new design layer, and every movement switches off with reduced motion', () => {
  const css = readFileSync('src/styles/design.css', 'utf8');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'tokens only');
  for (const f of ['src/components/design/Design.jsx', 'src/components/charts/TrendChart.jsx']) assert.doesNotMatch(readFileSync(f, 'utf8'), /#[0-9a-f]{6}\b/i, f);
  assert.match(css, /\[data-motion="reduced"\] \.stagger > \* \{ animation: none; \}/);
  assert.match(css, /\[data-motion="reduced"\] \.onb-stack i \{ transform: none !important; \}/);
  assert.match(css, /\.tile-grid \{ grid-template-columns: 1fr; \}/, 'narrow screens: one column');
});
