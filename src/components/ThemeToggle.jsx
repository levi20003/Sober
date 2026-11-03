// Világos / sötét mód kapcsoló (nap/hold ikon) a fejlécekben. Egy koppintás: a most látott téma ellenkezőjére vált,
// és megjegyzi (localStorage "jsz-ui", nem személyes adat). A rendszer szerinti beállítás a Beállításokban választható.
// Rövid színátmenet; kevesebb mozgásnál azonnal vált.
import { A11Y } from '../content/index.js';
import { usePrefs } from '../hooks/usePrefs.js';
import { Icon } from './icons/Icon.jsx';

function effectiveTheme(prefs) {
  if (prefs.theme !== 'system') return prefs.theme;
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [prefs, setPrefs] = usePrefs();
  const dark = effectiveTheme(prefs) === 'dark';
  const toggle = () => {
    const root = document.documentElement;
    const reduced = prefs.motion === 'reduced' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
    setPrefs({ theme: dark ? 'light' : 'dark' });
  };
  const label = dark ? A11Y.themeToLight : A11Y.themeToDark;
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <Icon name={dark ? 'sun' : 'moon'} size={20} />
    </button>
  );
}
