// Kísérő: a felhasználó választja a Beállításokban (titkosított profil, profile.companion). „Kísérő nélkül” esetén
// semmi nem jelenik meg. Hiányzó beállításnál Pötty (a korábbi verziók viselkedése).
import { Mascot } from '../mood/Mascot.jsx';
import { COMPANION_CHOICES } from '../../domain/schema.js';

export const COMPANION_IDS = [...COMPANION_CHOICES];

/** A profilban tárolt érték → érvényes kísérő-azonosító. */
export const companionOf = (profile) => (COMPANION_IDS.includes(profile?.companion) ? profile.companion : 'potty');

export function Companion({ kind = 'potty', look = 'happy', size = 96, animate = false, label = null }) {
  if (kind === 'none') return null;
  return <Mascot kind={kind} look={look} size={size} animate={animate} label={label} />;
}
