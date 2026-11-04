// Fejléc: oldalcím (a főoldalon köszönés + dátum), "Segítség most" és avatar. A segítség gomb minden oldalon, PIN nélkül elérhető.
import { A11Y, HOME, NAV_TABS, T } from '../../content/index.js';
import { CrisisButton } from '../crisis/CrisisButton.jsx';
import { ThemeToggle } from '../ThemeToggle.jsx';
import { MoodFigure } from '../mood/MoodFigures.jsx';
import { Companion } from '../companions/Companion.jsx';
import { Icon } from '../icons/Icon.jsx';

export function AppBar({ title, subtitle, mood, companion = 'potty', onAvatar, onLock, avatar = true }) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <div className="appbar-text">
          <h1 className="appbar-title">{title}</h1>
          {subtitle && <p className="appbar-sub">{subtitle}</p>}
        </div>
        <div className="appbar-actions">
          {onLock && <button type="button" className="btn-link" onClick={onLock}>{T.lockNow}</button>}
          <ThemeToggle />
          <CrisisButton />
          {avatar && (
            <button type="button" className="avatar" onClick={onAvatar} aria-label={A11Y.avatar}>
              {mood ? <MoodFigure mood={mood} size={38} label={null} animate={false} />
                : companion === 'none' ? <Icon name="user" size={22} /> : <Companion kind={companion} size={40} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export { HOME, NAV_TABS };
