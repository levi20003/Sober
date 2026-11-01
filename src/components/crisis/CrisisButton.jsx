// The always-visible one-tap trigger. A plain link to #/segitseg: it works before
// the app has finished loading and needs no state.

import { T } from '../../content/index.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';

export function CrisisButton() {
  return (
    <a className="btn btn-help" href={CRISIS_HASH} aria-label={T.helpButton}>
      <span className="help-long">{T.helpButton}</span>
      <span className="help-short" aria-hidden="true">{T.helpButtonShort}</span>
    </a>
  );
}

/**
 * Krízislink modális ablakokba és teljes képernyős rétegekbe. Egy nyitott modális <dialog> alatt a fejléc gombja
 * inert (nem érhető el), ezért minden ilyen rétegnek saját linkje van (docs/audit/2026-11-krizis-audit.md, K1).
 */
export function DialogHelp() {
  return (
    <div className="dialog-help-row">
      <a className="btn btn-help btn-help-small" href={CRISIS_HASH}>{T.helpButtonShort}</a>
    </div>
  );
}
