// @vitest-environment jsdom
import { test, afterEach } from 'vitest';
import assert from 'node:assert/strict';
import { render, cleanup, screen } from '@testing-library/react';
import { MoodFigure, MOOD_IDS } from '../../src/components/mood/MoodFigures.jsx';
import { Mascot } from '../../src/components/mood/Mascot.jsx';
import { Icon, ICON_NAMES } from '../../src/components/icons/Icon.jsx';
import { MOODS } from '../../src/domain/presets.js';
import { readFileSync, readdirSync } from 'node:fs';

afterEach(cleanup);

test('12 original mood figures, each an inline SVG named in text for screen readers', () => {
  assert.equal(MOOD_IDS.length, 12);
  for (const m of MOODS) {
    const { container, unmount } = render(<MoodFigure mood={m.id} />);
    const svg = container.querySelector('svg');
    assert.equal(svg.getAttribute('role'), 'img');
    assert.equal(svg.getAttribute('aria-label'), m.label);
    assert.ok(svg.querySelector('path, circle, polygon, rect, ellipse'));
    unmount();
  }
});

test('decorative figures (label=null) are hidden from assistive tech; the mascot and icons render', () => {
  const { container } = render(<><MoodFigure mood="hurt" label={null} /><Mascot look="celebrate" /><Icon name="home" /></>);
  assert.equal(container.querySelectorAll('svg[aria-hidden="true"]').length, 3);
  for (const n of ICON_NAMES) assert.ok(render(<Icon name={n} />).container.querySelector('svg'), n);
});

test('the only network code is the Android release check, and it talks to api.github.com alone', () => {
  const t = readFileSync('src/lib/apkUpdate.js', 'utf8');
  assert.deepEqual([...new Set([...t.matchAll(/https:\/\/[a-z.]+/g)].map((m) => m[0]))].sort(), ['https://api.github.com', 'https://github.com']);
  assert.match(t, /RELEASE_API = 'https:\/\/api\.github\.com\//);
});

test('no new runtime dependency, no network or external assets in the UI sources', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['react', 'react-dom']);
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of walk('src').filter((x) => /\.(jsx?|css)$/.test(x) && !x.includes('/sw/') && !x.endsWith('lib/apkUpdate.js'))) {
    const t = readFileSync(f, 'utf8');
    assert.ok(!/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|@font-face|fonts\.googleapis/.test(t), `network/webfont in ${f}`);
  }
});
