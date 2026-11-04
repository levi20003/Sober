// Lebegő alsó navigáció (R4): tinta „pill”, 4 fül és középen kiemelt, kerek „+” (gyors rögzítés).
// A Beállítások a fejléc avatarjáról érhető el (a NAV_TABS-ban megmarad: útvonal és oldalcím innen jön).
// Min. 48×48 px érintési felület, aria-current, safe-area. Ikonok: saját inline SVG.
import { A11Y, NAV_TABS } from '../../content/index.js';
import { Icon } from '../icons/Icon.jsx';
import { tabOf } from '../../lib/hashRouter.js';
import { withTransition } from '../../lib/transition.js';

const IN_BAR = NAV_TABS.filter((t) => t.id !== 'settings');

export function TabBar({ route, goTab, onPlus }) {
  const current = tabOf(route);
  const link = (t) => (
    <a key={t.id} href={t.hash} className="tab" aria-current={current === t.hash ? 'page' : undefined} data-tab={t.id}
      onClick={(e) => { e.preventDefault(); withTransition(() => goTab(t.hash)); }}>
      <span className="tab-bubble"><Icon name={t.icon} size={22} /></span>
      <span className="tab-label">{t.label}</span>
    </a>
  );
  const half = Math.ceil(IN_BAR.length / 2);
  return (
    <nav className="tabbar" aria-label={A11Y.mainNav}>
      {IN_BAR.slice(0, half).map(link)}
      {onPlus && (
        <span className="tab tab-center">
          <button type="button" className="fab" onClick={onPlus} aria-label={A11Y.quickAdd}><Icon name="plus" size={28} /></button>
        </span>
      )}
      {IN_BAR.slice(half).map(link)}
    </nav>
  );
}
