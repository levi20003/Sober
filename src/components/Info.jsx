// Felugró lap (alulról) és "i" gomb. Az ritkán kellő magyarázatok ide kerülnek, hogy a képernyők átláthatók maradjanak,
// az éppen fontos közlemények pedig kérés nélkül is felugranak (NoticeSheet).

import { useRef } from 'react';
import { UX } from '../content/index.js';
import { useModalDialog } from '../hooks/useModalDialog.js';
import { Icon } from './icons/Icon.jsx';
import { DialogHelp } from './crisis/CrisisButton.jsx';
import { useState } from 'react';

/** @param {boolean} [help=true] saját krízislink a lapon (K1); csak akkor false, ha a lap tartalma már ad egyet. */
export function Sheet({ title, children, actions, closeLabel, onClose, help = true }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-h" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="sheet-handle" aria-hidden="true" />
      {help && <DialogHelp />}
      <h2 id="sheet-h">{title}</h2>
      <div className="sheet-body stack">{children}</div>
      <div className="actions">
        {actions}
        <button type="button" className={actions || closeLabel ? 'btn btn-ghost' : 'btn btn-primary'} onClick={onClose}>{closeLabel ?? (actions ? UX.close : UX.gotIt)}</button>
      </div>
    </dialog>
  );
}

/** Kis "i" gomb: koppintásra felugrik a magyarázat. */
export function InfoButton({ title, children, label = UX.info }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="info-btn" aria-label={`${label}: ${title}`} onClick={() => setOpen(true)}><Icon name="info" size={18} /></button>
      {open && <Sheet title={title} onClose={() => setOpen(false)}>{children}</Sheet>}
    </>
  );
}

/** Címsor + "i" gomb egy sorban. */
export function TitleWithInfo({ as: Tag = 'h2', id, title, info, infoTitle }) {
  return (
    <div className="title-info">
      <Tag id={id}>{title}</Tag>
      {info && <InfoButton title={infoTitle ?? title}>{info}</InfoButton>}
    </div>
  );
}
