// @vitest-environment jsdom
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createHashRouter, tabOf } from '../src/lib/hashRouter.js';

const wait = () => new Promise((r) => setTimeout(r, 20));

test('tabOf maps sub-routes to their tab', () => {
  assert.equal(tabOf('#/eszkozok/hullam'), '#/eszkozok');
  assert.equal(tabOf('#/rogzites/jegyzet'), '#/');
  assert.equal(tabOf(''), '#/');
});

test('tab history: home → tab pushes, tab → tab replaces, back returns home, tab → home goes back', async () => {
  window.location.hash = '';
  const r = createHashRouter(window);
  const start = window.history.length;
  r.goTab('#/idovonal');
  assert.equal(r.getSnapshot().base, '#/idovonal');
  r.goTab('#/megtakaritas');
  r.goTab('#/eszkozok');
  assert.equal(window.history.length, start + 1, 'only one entry was pushed for three tab changes');
  window.history.back(); await wait();
  assert.equal(r.getSnapshot().base, '#/', 'one back press returns to the home screen');
  r.goTab('#/beallitasok');
  r.goTab('#/');
  await wait();
  assert.equal(r.getSnapshot().base, '#/');
  r.destroy();
});

test('a cold start on another tab gets a home entry beneath it', async () => {
  window.location.hash = '#/eszkozok';
  const r = createHashRouter(window);
  assert.equal(r.getSnapshot().base, '#/eszkozok');
  window.history.back(); await wait();
  assert.equal(r.getSnapshot().base, '#/');
  r.destroy();
});
