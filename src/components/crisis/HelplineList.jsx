// Helplines as real tel: links (work offline, need no JS to dial, never logged).
// On devices that cannot call (desktop), a copy button appears via CSS media query.

import { useRef, useState } from 'react';
import { T } from '../../content/hu.js';
import { telHref, copyNumber } from '../../domain/helplines.js';
import { useToast } from '../../hooks/useToast.jsx';

function CallLink({ line, primary }) {
  return (
    <a className={`btn btn-call${primary ? ' btn-primary' : ''}`} href={telHref(line)}>
      <span className="call-number">{line.number}</span>
      <span>{line.name}</span>
    </a>
  );
}

function CopyButton({ line, copy }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const ref = useRef(null);
  const onClick = async () => {
    if ((await copy(line)) === 'copied') return setCopied(true);
    // Clipboard blocked/unavailable: select the number for manual copying.
    const numberEl = ref.current?.closest('li')?.querySelector('.call-number');
    if (numberEl) {
      const range = document.createRange();
      range.selectNodeContents(numberEl);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }
    toast(T.crisisCopyManual);
  };
  return <button ref={ref} type="button" className="btn-link copy-number" onClick={onClick}>{copied ? T.crisisCopied : T.crisisCopy}</button>;
}

/** Shown first and separately: the emergency number is not "one option among many". */
export function EmergencyBanner({ line }) {
  return (
    <section className="card card-emergency" aria-labelledby="emergency-h">
      <p id="emergency-h" className="emergency-lead">{T.crisisEmergencyLead}</p>
      <CallLink line={line} />
      <p className="hint">{line.when}</p>
    </section>
  );
}

export function HelplineList({ lines, copy = copyNumber }) {
  return (
    <section className="card" aria-labelledby="call-h">
      <h2 id="call-h">{T.crisisCallTitle}</h2>
      <ul className="helplines">
        {lines.map((line, i) => (
          <li key={line.id}>
            <CallLink line={line} primary={i === 0} />
            <p className="hint">{`${line.hours}. ${line.when} `}<CopyButton line={line} copy={copy} /></p>
          </li>
        ))}
      </ul>
    </section>
  );
}
