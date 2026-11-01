// Mérföldkő-ünneplés: teljes képernyő, konfetti, táncoló Pötty és rövid rezgés (ha van és a mozgás nem csökkentett).
import { useEffect, useRef } from 'react';
import { CELEBRATE } from '../../content/index.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { Confetti } from '../Confetti.jsx';
import { Mascot } from '../mood/Mascot.jsx';
import { haptic } from '../../lib/haptics.js';
import { DialogHelp } from '../crisis/CrisisButton.jsx';

export function Celebration({ days, onClose }) {
  const reduced = useReducedMotion();
  const btn = useRef(null);
  useEffect(() => {
    btn.current?.focus();
    if (!reduced) haptic([30, 40, 30]);
  }, [reduced]);
  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="cel-h">
      <DialogHelp />
      <Confetti count={48} />
      <Mascot look="celebrate" size={140} label={null} />
      <p className="big" aria-hidden="true">{days}</p>
      <h2 id="cel-h">{CELEBRATE.title(days)}</h2>
      <p>{CELEBRATE.text}</p>
      <button type="button" ref={btn} className="btn btn-primary btn-big" onClick={onClose}>{CELEBRATE.close}</button>
    </div>
  );
}
