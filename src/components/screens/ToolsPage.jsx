import { TOOLS } from '../../content/hu.js';
import { Icon } from '../icons/Icon.jsx';
import { Reminders } from '../Reminders.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { Page } from '../shell/Page.jsx';
import { Challenges } from '../tools/Challenges.jsx';
import { Urge } from '../tools/Urge.jsx';
import { Gratitude } from '../tools/Gratitude.jsx';
import { Letter } from '../tools/Letter.jsx';
import { Reasons } from '../tools/Reasons.jsx';

const LINKS = [
  { hash: '#/eszkozok/hullam', title: TOOLS.urgeTitle, icon: 'wave', tone: 'tone-lavender' },
  { hash: '#/eszkozok/hala', title: TOOLS.gratitudeTitle, icon: 'sparkle', tone: 'tone-butter' },
  { hash: '#/eszkozok/level', title: TOOLS.letterTitle, icon: 'mail', tone: 'tone-pink' },
  { hash: '#/eszkozok/okok', title: TOOLS.reasonsTitle, icon: 'target', tone: 'tone-peach' },
];

export function ToolsPage() {
  const { auth } = useAuth();
  const { navigate } = useHashRoute();
  return (
    <Page title={TOOLS.title}>
      <div className="sheet-grid">
        {LINKS.map((l) => (
          <a key={l.hash} href={l.hash} className={`sheet-action tone ${l.tone}`} onClick={(e) => { e.preventDefault(); navigate(l.hash); }} style={{ textDecoration: 'none' }}>
            <Icon name={l.icon} size={28} />{l.title}
          </a>
        ))}
      </div>
      <section className="card tone tone-sky" aria-labelledby="bl-h">
        <h2 id="bl-h">{TOOLS.breatheTitle}</h2>
        <p>{TOOLS.breatheText}</p>
        <div className="breath-blob" aria-hidden="true" />
      </section>
      <Challenges />
      <Reminders store={auth.store} />
    </Page>
  );
}

/** Az Eszközök almenüi (#/eszkozok/...). */
export function ToolsRoute({ hash }) {
  switch (hash) {
    case '#/eszkozok/hullam': return <Urge />;
    case '#/eszkozok/hala': return <Gratitude />;
    case '#/eszkozok/level': return <Letter />;
    case '#/eszkozok/okok': return <Reasons />;
    default: return <ToolsPage />;
  }
}
