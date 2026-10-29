import { useEffect, useState } from 'react';
import { T, CONTENT_VERSION, REVIEW_STATUS } from '../../content/hu.js';
import { toCsvExport, toJsonExport, parseJsonImport } from '../../domain/export.js';
import { toDateKey } from '../../domain/dates.js';
import { enableReminders, disableReminders, remindersSupported } from '../../reminders.js';
import { download } from '../../lib/format.js';
import { userError } from '../../lib/errors.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field, Screen } from '../ui.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';
import { CostEditor, GoalEditor } from '../savings/CostEditor.jsx';

function Reminders({ store }) {
  const toast = useToast();
  const [rem, setRem] = useState(null);
  useEffect(() => { store.getMeta().then((m) => setRem(m.reminders)); }, [store]);
  if (!rem) return null;

  const apply = async (enabled, time) => {
    try {
      if (enabled) {
        const r = await enableReminders(store, time || '20:00');
        if (r.denied) { toast(T.remindersDenied, 'error'); return setRem({ ...rem, enabled: false, time }); }
        toast('Emlékeztető bekapcsolva.');
      } else {
        await disableReminders(store);
        toast('Emlékeztető kikapcsolva.');
      }
      setRem({ ...rem, enabled, time });
    } catch (err) {
      toast(err.message, 'error');
      setRem({ ...rem, enabled: false });
    }
  };
  return (
    <section className="card">
      <h2>{T.remindersSection}</h2>
      <div className="check">
        <input type="checkbox" id="rem-on" role="switch" checked={rem.enabled} disabled={!remindersSupported()} onChange={(e) => apply(e.target.checked, rem.time)} />
        <label htmlFor="rem-on">{T.remindersLabel}</label>
      </div>
      <Field label={T.remindersTimeLabel}>
        <input type="time" className="input" value={rem.time} onChange={(e) => { setRem({ ...rem, time: e.target.value }); if (rem.enabled) apply(true, e.target.value); }} />
      </Field>
      <p className="hint">{T.remindersInfo}</p>
    </section>
  );
}

export function Settings({ onWipe, showRecoveryCode }) {
  const { auth } = useAuth();
  const store = auth.store;
  const { snapshot, refresh } = useTimeline();
  const { navigate } = useHashRoute();
  const toast = useToast();
  const { data } = snapshot;
  const stamp = toDateKey();

  const prefs = useFormAction(async (fd) => {
    const next = store.data;
    next.settings.autoLockMinutes = Number(fd.get('autolock'));
    next.profile.journeyStart = fd.get('start');
    await store.save(next);
    auth.refreshSettings();
    refresh();
    toast(T.saved_ok);
  });
  const pin = useFormAction(async (fd, form) => {
    if (fd.get('pin') !== fd.get('pin2')) throw userError(T.pinMismatch);
    await store.changePin(fd.get('old'), fd.get('pin'));
    form.reset();
    toast('A PIN-kód módosult.');
  });
  const recovery = useFormAction(async (fd) => {
    const { recoveryCode } = await store.regenerateRecoveryCode(fd.get('pin'));
    showRecoveryCode(recoveryCode);
  });
  const importer = useFormAction(async (fd) => {
    const text = await fd.get('file').text();
    const obj = JSON.parse(text.replace(/^﻿/, ''));
    if (!confirm('A jelenlegi napló helyére a mentés kerül. Folytatod?')) return;
    if (obj?.kind === 'encrypted-backup') await store.importEncryptedBackup(obj, fd.get('pin'));
    else await store.save(parseJsonImport(text));
    refresh();
    toast('A mentés visszaállítva.');
    navigate('#/');
  });
  const plain = (fn) => () => { if (confirm(T.exportPlainWarning)) fn(); };

  return (
    <Screen>
      <h1>{T.settingsTitle}</h1>
      <section className="card">
        <h2>{T.savingsSection}</h2>
        <CostEditor />
        <GoalEditor />
      </section>
      <section className="card">
        <h2>{T.journeySection}</h2>
        <form className="stack" onSubmit={prefs.onSubmit} aria-busy={prefs.busy || undefined}>
          <Field label={T.journeyStartLabel}><input type="date" name="start" className="input" defaultValue={data.profile.journeyStart} max={toDateKey()} required /></Field>
          <Field label={T.autoLockLabel}><input type="number" name="autolock" className="input" min="1" max="120" defaultValue={String(data.settings.autoLockMinutes)} /></Field>
          <button type="submit" className="btn btn-primary" disabled={prefs.busy}>{T.save}</button>
        </form>
      </section>

      <Reminders store={store} />

      <section className="card">
        <h2>{T.securitySection}</h2>
        <details>
          <summary>{T.changePin}</summary>
          <form className="stack" onSubmit={pin.onSubmit} aria-busy={pin.busy || undefined}>
            <Field label={T.oldPinLabel}><PinInput name="old" autoComplete="current-password" /></Field>
            <NewPinField label={T.newPinLabel} />
            <Field label={T.pinConfirmLabel}><PinInput name="pin2" /></Field>
            <button type="submit" className="btn" disabled={pin.busy}>{T.changePin}</button>
          </form>
        </details>
        <details>
          <summary>{T.newRecovery}</summary>
          <form className="stack" onSubmit={recovery.onSubmit} aria-busy={recovery.busy || undefined}>
            <p className="hint">{T.newRecoveryInfo}</p>
            <Field label="PIN-kód"><PinInput name="pin" autoComplete="current-password" /></Field>
            <button type="submit" className="btn" disabled={recovery.busy}>{T.newRecovery}</button>
          </form>
        </details>
      </section>

      <section className="card">
        <h2>{T.dataSection}</h2>
        <div className="stack">
          <button type="button" className="btn btn-primary"
            onClick={async () => download(`jozansag-mentes-${stamp}.json`, JSON.stringify(await store.exportEncryptedBackup()), 'application/json')}>
            {T.exportEncrypted}
          </button>
          <p className="hint">{T.exportEncryptedInfo}</p>
          <button type="button" className="btn" onClick={plain(() => download(`jozansag-naplo-${stamp}.csv`, toCsvExport(store.data), 'text/csv;charset=utf-8'))}>{T.exportCsv}</button>
          <button type="button" className="btn" onClick={plain(() => download(`jozansag-naplo-${stamp}.json`, toJsonExport(store.data), 'application/json;charset=utf-8'))}>{T.exportJson}</button>
          <details>
            <summary>{T.importEncrypted}</summary>
            <form className="stack" onSubmit={importer.onSubmit} aria-busy={importer.busy || undefined}>
              <p className="hint">{T.importEncryptedInfo}</p>
              <Field label="Mentésfájl (titkosított mentés vagy JSON-export)"><input type="file" name="file" accept=".json,application/json" required className="input" /></Field>
              <Field label="A mentés PIN-kódja (titkosított mentésnél)"><input type="password" name="pin" className="input" autoComplete="off" /></Field>
              <button type="submit" className="btn" disabled={importer.busy}>{T.importEncrypted}</button>
            </form>
          </details>
        </div>
      </section>

      <section className="card card-warn">
        <h2>{T.deleteAll}</h2>
        <p>{T.deleteAllInfo}</p>
        <button type="button" className="btn btn-danger" onClick={async () => { if (confirm(T.deleteAllConfirm)) await onWipe(); }}>{T.deleteAll}</button>
      </section>

      <section className="card">
        <h2>{T.aboutSection}</h2>
        <p>{T.disclaimer}</p>
        <p>{T.privacyPromise}</p>
        <p className="hint">{`Tartalom verziója: ${CONTENT_VERSION} · ${REVIEW_STATUS}`}</p>
      </section>
    </Screen>
  );
}
