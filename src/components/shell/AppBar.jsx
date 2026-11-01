// Fejléc: oldalcím (a főoldalon köszönés + dátum), "Segítség most" és avatar. A segítség gomb minden oldalon, PIN nélkül elérhető.
import { A11Y, HOME, NAV_TABS, T } from '../../content/hu.js';
import { CrisisButton } from '../crisis/CrisisButton.jsx';
import { MoodFigure } from '../mood/MoodFigures.jsx';
import { Mascot } from '../mood/Mascot.jsx';

export function AppBar({ title, subtitle, mood, onAvatar, onLock, avatar = true }) {
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <div className="appbar-text">
          <h1 className="appbar-title">{title}</h1>
          {subtitle && <p className="appbar-sub">{subtitle}</p>}
        </div>
        <div className="appbar-actions">
          {onLock && <button type="button" className="btn-link" onClick={onLock}>{T.lockNow}</button>}
          <CrisisButton />
          {avatar && (
            <button type="button" className="avatar" onClick={onAvatar} aria-label={A11Y.avatar}>
              {mood ? <MoodFigure mood={mood} size={38} label={null} animate={false} /> : <Mascot size={40} animate={false} />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export { HOME, NAV_TABS };
