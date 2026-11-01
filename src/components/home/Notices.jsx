// Felugró közlemények: csak akkor jelennek meg, amikor aktuálisak (egyszer, vagy amíg esedékesek).
import { useEffect, useState } from 'react';
import { PREVIEW, T, UX } from '../../content/index.js';
import { backupDue, snoozeUntil } from '../../domain/backup.js';
import { feedbackUrl } from '../../lib/feedback.js';
import { hasSeen, markSeen } from '../../hooks/usePrefs.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { CrisisButton } from '../crisis/CrisisButton.jsx';
import { Sheet } from '../Info.jsx';

/** Az előzetes verzió jelzése: egyszer, az első indításkor. A "Segítség most" gomb benne is elérhető. */
export function PreviewNotice() {
  const [open, setOpen] = useState(() => !hasSeen('preview'));
  if (!open) return null;
  const close = () => { markSeen('preview'); setOpen(false); };
  return (
    <Sheet title={PREVIEW.badge} onClose={close} help={false}
      actions={<><CrisisButton /><a className="btn" href={feedbackUrl()} target="_blank" rel="noopener noreferrer">{PREVIEW.feedback}</a></>}
      closeLabel={UX.gotIt}>
      <p>{PREVIEW.text}</p>
      <p className="hint">{T.disclaimer}</p>
    </Sheet>
  );
}

/** Mentés-emlékeztető: esedékes, ha régen volt titkosított mentés. Halasztható vagy kikapcsolható. */
export function BackupNotice({ data, suppressed }) {
  const { auth } = useAuth();
  const { navigate } = useHashRoute();
  const [due, setDue] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.resolve(auth.store?.getMeta?.()).then((m) => { if (alive && m) setDue(backupDue(m, data)); }).catch(() => {});
    return () => { alive = false; };
  }, [auth, data]);
  if (!due || suppressed) return null;
  const snooze = async (days) => { setDue(false); await auth.store.setMeta({ backupSnoozeUntil: snoozeUntil(new Date(), days) }).catch(() => {}); };
  return (
    <Sheet title={UX.backupDueTitle} closeLabel={UX.later} onClose={() => snooze(7)}
      actions={<><button type="button" className="btn btn-primary" onClick={() => { setDue(false); navigate('#/beallitasok'); }}>{UX.backupNow}</button>
        <button type="button" className="btn btn-ghost" onClick={() => snooze(3650)}>{UX.dontAsk}</button></>}>
      <p>{UX.backupDueText}</p>
    </Sheet>
  );
}
