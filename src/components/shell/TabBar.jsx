// Lebegő alsó navigáció: 5 fül, min. 48×48 px érintési felület, aria-current, safe-area. Ikonok: saját inline SVG.
import { A11Y, NAV_TABS } from '../../content/hu.js';
import { Icon } from '../icons/Icon.jsx';
import { tabOf } from '../../lib/hashRouter.js';
import { withTransition } from '../../lib/transition.js';

export function TabBar({ route, goTab, onPlus }) {
  const current = tabOf(route);
  return (
    <>
      <nav className="tabbar" aria-label={A11Y.mainNav}>
        {NAV_TABS.map((t) => (
          <a key={t.id} href={t.hash} className="tab" aria-current={current === t.hash ? 'page' : undefined} data-tab={t.id}
            onClick={(e) => { e.preventDefault(); withTransition(() => goTab(t.hash)); }}>
            <span className="tab-bubble"><Icon name={t.icon} size={22} /></span>
            <span className="tab-label">{t.label}</span>
          </a>
        ))}
      </nav>
      {onPlus && <button type="button" className="fab" onClick={onPlus} aria-label={A11Y.quickAdd}><Icon name="plus" size={28} /></button>}
    </>
  );
}
