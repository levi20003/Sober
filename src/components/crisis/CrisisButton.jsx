// The always-visible one-tap trigger. A plain link to #/segitseg: it works before
// the app has finished loading and needs no state.

import { T } from '../../content/hu.js';
import { CRISIS_HASH } from '../../lib/hashRouter.js';

export function CrisisButton() {
  return (
    <a className="btn btn-help" href={CRISIS_HASH} aria-label={T.helpButton}>
      <span className="help-long">{T.helpButton}</span>
      <span className="help-short" aria-hidden="true">{T.helpButtonShort}</span>
    </a>
  );
}
