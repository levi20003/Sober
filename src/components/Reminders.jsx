import { useEffect, useState } from 'react';
import { T, MISC } from '../content/index.js';
import { enableReminders, disableReminders, remindersSupported, REMINDER_EVERY } from '../reminders.js';
import { useToast } from '../hooks/useToast.jsx';
import { Field } from './ui.jsx';
import { TitleWithInfo } from './Info.jsx';

export function Reminders({ store }) {
  const toast = useToast();
  const [rem, setRem] = useState(null);
  useEffect(() => { store.getMeta().then((m) => setRem(m.reminders)); }, [store]);
  if (!rem) return null;

  const apply = async (enabled, time, everyDays = rem.everyDays ?? 1) => {
    try {
      if (enabled) {
        const r = await enableReminders(store, time || '20:00', everyDays);
        if (r.denied) { toast(T.remindersDenied, 'error'); return setRem({ ...rem, enabled: false, time }); }
        toast(MISC.remindersOn);
      } else {
        await disableReminders(store);
        toast(MISC.remindersOff);
      }
      setRem({ ...rem, enabled, time, everyDays });
    } catch (err) {
      toast(err.message, 'error');
      setRem({ ...rem, enabled: false });
    }
  };
  return (
    <section className="card">
      <TitleWithInfo title={T.remindersSection} info={<p>{T.remindersInfo}</p>} />
      <div className="check">
        <input type="checkbox" id="rem-on" role="switch" checked={rem.enabled} disabled={!remindersSupported()} onChange={(e) => apply(e.target.checked, rem.time)} />
        <label htmlFor="rem-on">{T.remindersLabel}</label>
      </div>
      <fieldset className="chips"><legend>{T.remindersEvery}</legend><div className="chip-row">
        {REMINDER_EVERY.map((n) => (
          <label className="chip" key={n}><input type="radio" name="rem-every" value={n} checked={(rem.everyDays ?? 1) === n}
            onChange={() => { setRem({ ...rem, everyDays: n }); if (rem.enabled) apply(true, rem.time, n); else store.setMeta({ reminders: { ...rem, everyDays: n } }).catch(() => {}); }} />
            <span>{T.remindersEveryOptions[n]}</span></label>
        ))}
      </div></fieldset>
      <Field label={T.remindersTimeLabel}>
        <input type="time" className="input" value={rem.time} onChange={(e) => { setRem({ ...rem, time: e.target.value }); if (rem.enabled) apply(true, e.target.value); }} />
      </Field>
    </section>
  );
}
