import { TOOLS } from '../../content/index.js';
import { Tile } from '../design/Design.jsx';
import { Reminders } from '../Reminders.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { Page } from '../shell/Page.jsx';
import { Challenges } from '../tools/Challenges.jsx';
import { Urge } from '../tools/Urge.jsx';
import { Gratitude } from '../tools/Gratitude.jsx';
import { Letter } from '../tools/Letter.jsx';
import { Reasons } from '../tools/Reasons.jsx';

// R4: 2 oszlopos pasztell csempe-rács; mindegyik saját tónussal, ikonnal, egy sor leírással és „Megnézem →” sorral.
// Az aloldalak útvonalak (#/eszkozok/…); a légzés és a kihívások ezen az oldalon vannak, oda görget.
const LINKS = [
  { hash: '#/eszkozok/hullam', title: TOOLS.urgeTitle, desc: TOOLS.tileDesc.urge, icon: 'wave', tone: 'lavender' },
  { scrollTo: 'bl-h', title: TOOLS.breatheTitle, desc: TOOLS.tileDesc.breathe, icon: 'wind', tone: 'sky' },
  { scrollTo: 'ch-h', title: TOOLS.challengesTitle, desc: TOOLS.tileDesc.challenges, icon: 'flame', tone: 'mint' },
  { hash: '#/eszkozok/hala', title: TOOLS.gratitudeTitle, desc: TOOLS.tileDesc.gratitude, icon: 'sparkle', tone: 'butter' },
  { hash: '#/eszkozok/level', title: TOOLS.letterTitle, desc: TOOLS.tileDesc.letter, icon: 'mail', tone: 'pink' },
  { hash: '#/eszkozok/okok', title: TOOLS.reasonsTitle, desc: TOOLS.tileDesc.reasons, icon: 'target', tone: 'coral' },
];
const scrollToId = (id) => {
  const el = document.getElementById(id);
  const reduced = document.documentElement.getAttribute('data-motion') === 'reduced' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
};

export function ToolsPage() {
  const { auth } = useAuth();
  const { navigate } = useHashRoute();
  return (
    <Page title={TOOLS.title}>
      <div className="tile-grid stagger">
        {LINKS.map((l, i) => (
          <div key={l.title} style={{ '--i': i }}>
            <Tile tone={l.tone} icon={l.icon} title={l.title} desc={l.desc} cta={TOOLS.open} href={l.hash}
              onClick={(e) => { e.preventDefault(); if (l.hash) navigate(l.hash); else scrollToId(l.scrollTo); }} />
          </div>
        ))}
      </div>
      <section className="card tone tone-sky" aria-labelledby="bl-h">
        <h2 id="bl-h">{TOOLS.breatheTitle}</h2>
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
