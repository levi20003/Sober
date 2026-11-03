// @vitest-environment jsdom
import { test, afterEach, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeToggle } from '../../src/components/ThemeToggle.jsx';
import { resetPrefsCache, getPrefs } from '../../src/hooks/usePrefs.js';

afterEach(() => { cleanup(); document.documentElement.removeAttribute('data-theme'); });
beforeEach(() => { localStorage.clear(); resetPrefsCache(); });

test('one tap switches between light and dark, remembers it and applies it to <html>', () => {
  render(<ThemeToggle />);
  const btn = screen.getByRole('button', { name: /Sötét mód|Világos mód/ });
  const before = btn.getAttribute('aria-label');
  fireEvent.click(btn);
  const after = screen.getByRole('button', { name: /Sötét mód|Világos mód/ }).getAttribute('aria-label');
  assert.notEqual(after, before);
  const theme = getPrefs().theme;
  assert.ok(['light', 'dark'].includes(theme));
  assert.equal(document.documentElement.getAttribute('data-theme'), theme);
  fireEvent.click(screen.getByRole('button', { name: /Sötét mód|Világos mód/ }));
  assert.notEqual(getPrefs().theme, theme, 'toggles back');
});
