// @vitest-environment jsdom
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { ToolsPage, ToolsRoute } from '../../src/components/screens/ToolsPage.jsx';
import { AuthContext } from '../../src/hooks/useAuth.js';
import { makeVault, renderWithApp } from './setup.jsx';

afterEach(cleanup);
const STATE = Object.freeze({});
const auth = (vault) => ({ auth: { store: vault, subscribe: () => () => {}, getState: () => STATE } });
const click = (el) => act(async () => { fireEvent.click(el); });

test('urge surfing: the 10-minute wave is offered, "Elmúlt?" logs a victory event', async () => {
  const { vault } = await makeVault();
  renderWithApp(<ToolsRoute hash="#/eszkozok/hullam" />, { vault });
  assert.equal(screen.getByRole('timer').textContent, '10:00');
  await click(screen.getByRole('button', { name: 'Elindítom' }));
  await click(screen.getByRole('button', { name: 'Igen, elmúlt' }));
  await screen.findByText(/Megcsináltad!/);
  const [e] = vault.data.events;
  assert.deepEqual([e.type, e.outcome], ['urge', 'passed']);
});

test('gratitude journal and letter to self are stored as encrypted events', async () => {
  const { vault, backend } = await makeVault();
  const view = renderWithApp(<ToolsRoute hash="#/eszkozok/hala" />, { vault });
  fireEvent.change(screen.getByLabelText('1. dolog'), { target: { value: 'HALA_TITOK a napsütés' } });
  await click(screen.getByRole('button', { name: 'Felírom' }));
  await screen.findByText('HALA_TITOK a napsütés');
  view.unmount();
  renderWithApp(<ToolsRoute hash="#/eszkozok/level" />, { vault });
  fireEvent.change(screen.getByLabelText('A levél szövege'), { target: { value: 'LEVEL_TITOK kitartás' } });
  await click(screen.getByRole('button', { name: 'Elteszem' }));
  await waitFor(() => assert.equal(vault.data.events.filter((e) => e.type === 'letter').length, 1));
  assert.deepEqual(vault.data.events.map((e) => e.type), ['gratitude', 'letter']);
  assert.ok(!JSON.stringify([...backend.map]).includes('TITOK'), 'encrypted at rest');
});

test('personal reasons are saved in the profile', async () => {
  const { vault } = await makeVault();
  renderWithApp(<ToolsRoute hash="#/eszkozok/okok" />, { vault });
  fireEvent.change(screen.getByLabelText('Egy ok, ami fontos neked'), { target: { value: 'A családom' } });
  await click(screen.getByRole('button', { name: 'Új ok' }));
  await screen.findByText('A családom');
  assert.deepEqual(vault.data.profile.reasons, ['A családom']);
});

test('daily mini challenges: completing one does not reset or lose anything, the total only grows', async () => {
  const { vault } = await makeVault();
  const { container } = renderWithApp(<AuthContext.Provider value={auth(vault).auth}><ToolsPage /></AuthContext.Provider>, { vault });
  const buttons = screen.getAllByRole('button', { name: 'Megcsináltam' });
  assert.equal(buttons.length, 3);
  await click(buttons[0]);
  await waitFor(() => assert.equal(screen.getAllByRole('button', { name: 'Megcsináltam' }).length, 2));
  assert.equal(vault.data.events.filter((e) => e.type === 'challenge').length, 1);
  assert.ok(container.textContent.includes('Ha kihagysz egy napot, a sorozat nem törlődik'));
});
