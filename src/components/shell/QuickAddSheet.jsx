// Középső "+" gomb: alulról felcsúszó lap a leggyakoribb rögzítésekkel. A "Megcsúsztam" itt és az Idővonalon is elérhető.
import { useRef } from 'react';
import { QUICK_ADD, T } from '../../content/hu.js';
import { useModalDialog } from '../../hooks/useModalDialog.js';
import { Icon } from '../icons/Icon.jsx';

const TONES = ['tone-lavender', 'tone-peach', 'tone-mint', 'tone-sky'];

export function QuickAddSheet({ onClose, onPick, onSlip }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="qa-h" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="sheet-handle" aria-hidden="true" />
      <h2 id="qa-h">{QUICK_ADD.title}</h2>
      <div className="sheet-grid">
        {QUICK_ADD.items.map((it, i) => (
          <button key={it.id} type="button" className={`sheet-action tone ${TONES[i % TONES.length]}`} onClick={() => onPick(it.hash)}>
            <Icon name={it.icon} size={26} />{it.label}
          </button>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={onSlip}>{T.actionSlip}</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{QUICK_ADD.close}</button>
      </div>
    </dialog>
  );
}
