// A helyreállító kód: 8 négyes csoport, az egész kártya egy gomb – koppintásra másol, és visszajelez.
// A data-testid elem szövege a teljes, kötőjeles kód (a kötőjelek csak vizuálisan rejtettek).
import { Fragment, useState } from 'react';
import { T, UX } from '../content/index.js';
import { useToast } from '../hooks/useToast.jsx';
import { haptic } from '../lib/haptics.js';
import { Icon } from './icons/Icon.jsx';

export function RecoveryCodeCard({ code, onCopied }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const groups = String(code).split('-');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      haptic(10);
      toast(UX.clipboardWarning);
      onCopied?.();
    } catch {
      // A vágólap tiltva: a kód kijelölhető, kézzel másolható.
      const el = document.querySelector('[data-testid=recovery-code]');
      if (el) getSelection()?.selectAllChildren(el);
    }
  };
  return (
    <button type="button" className={`rc-card press${copied ? ' is-copied' : ''}`} onClick={copy} aria-label={`${UX.copyCodeTap}: ${code}`}>
      <span className="rc-code mono" data-testid="recovery-code" translate="no">
        {groups.map((g, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="rc-sep" aria-hidden="true">-</span>}
            <span className="rc-group">{g}</span>
          </Fragment>
        ))}
      </span>
      <span className="rc-hint" aria-live="polite">
        <Icon name={copied ? 'check' : 'copy'} size={16} />
        {copied ? T.copied : UX.copyCodeHint}
      </span>
    </button>
  );
}
