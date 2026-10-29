// Onboarding (create vault / restore backup), one-time recovery code, and the
// lock screen (unlock / recover / repair / zero-knowledge reset).
// Every transition goes through the auth state machine (src/auth/appAuth.js).

import { useState } from 'react';
import { T } from '../../content/hu.js';
import { createInitialData } from '../../domain/schema.js';
import { toDateKey } from '../../domain/dates.js';
import { parseHufInput } from '../../domain/savings.js';
import { userError } from '../../lib/errors.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field, Screen } from '../ui.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';

export function Onboarding({ onCreated, onRestored }) {
  const { auth } = useAuth();
  const create = useFormAction(async (fd) => {
    if (fd.get('pin') !== fd.get('pin2')) throw userError(T.pinMismatch);
    const cost = parseHufInput(fd.get('cost'));
    if (Number.isNaN(cost)) throw userError('A napi költség 0 és 1 000 000 Ft közötti szám legyen.');
    const { recoveryCode } = await auth.setup(fd.get('pin'), createInitialData({ journeyStart: fd.get('start'), dailyCostHuf: cost }));
    onCreated(recoveryCode);
  });
  const restore = useFormAction(async (fd) => {
    const backup = JSON.parse(await fd.get('file').text());
    await auth.restoreBackup(backup, fd.get('pin'));
    onRestored();
  });
  const today = toDateKey();
  return (
    <Screen>
      <h1>{T.onboardingTitle}</h1>
      <p className="lead">{T.onboardingIntro}</p>
      <p className="card card-soft">{T.privacyPromise}</p>
      <section className="card">
        <form className="stack" onSubmit={create.onSubmit} aria-busy={create.busy || undefined}>
          <NewPinField label={T.pinLabel} />
          <p className="hint">{T.pinHint}</p>
          <Field label={T.pinConfirmLabel}><PinInput name="pin2" /></Field>
          <Field label={T.startDateLabel}><input type="date" name="start" className="input" defaultValue={today} max={today} required /></Field>
          <Field label={T.dailyCostLabel} hint={T.dailyCostHint}><input type="text" name="cost" className="input" inputMode="numeric" placeholder="pl. 2500" /></Field>
          <button type="submit" className="btn btn-primary" disabled={create.busy}>{T.createButton}</button>
        </form>
      </section>
      <details className="card">
        <summary>Van már mentésem másik eszközről</summary>
        <form className="stack" onSubmit={restore.onSubmit} aria-busy={restore.busy || undefined}>
          <Field label="Mentésfájl"><input type="file" name="file" accept=".json,application/json" required className="input" /></Field>
          <Field label="A mentés PIN-kódja"><PinInput name="pin" autoComplete="current-password" /></Field>
          <button type="submit" className="btn" disabled={restore.busy}>{T.importEncrypted}</button>
        </form>
      </details>
      <p className="hint">{T.disclaimer}</p>
    </Screen>
  );
}

export function RecoveryCode({ code, onDone }) {
  const [ok, setOk] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); } catch { /* manual copy */ } };
  return (
    <Screen>
      <h1>{T.recoveryTitle}</h1>
      <p>{T.recoveryIntro}</p>
      <p className="recovery-code" translate="no">{code}</p>
      <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? T.copied : T.copy}</button>
      <div className="check">
        <input type="checkbox" id="rc-ok" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <label htmlFor="rc-ok">{T.recoveryConfirm}</label>
      </div>
      <button type="button" className="btn btn-primary" disabled={!ok} onClick={onDone}>Tovább</button>
    </Screen>
  );
}

export function LockScreen({ onReset }) {
  const { auth, state } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [lastPin, setLastPin] = useState('');

  const unlock = useFormAction(async (fd) => {
    setStatus('');
    try {
      await auth.unlock(fd.get('pin'));
    } catch (err) {
      setLastPin(fd.get('pin'));
      // Clear, persistent feedback in addition to the toast. Nothing is ever deleted on a wrong PIN.
      if (err.code === 'WRONG_SECRET') setStatus(err.retryAfterMs ? err.message : T.errWrongPin);
      throw err;
    }
  });
  const recover = useFormAction(async (fd) => {
    await auth.recover(fd.get('code'), fd.get('pin'));
    toast('A PIN-kód módosult. A naplód megmaradt.');
  });
  const repair = useFormAction(async () => {
    await auth.restorePrevious(lastPin);
    toast('A korábbi mentés visszaállítva.');
  });
  // Zero-knowledge reset: the only way forward without PIN and recovery code.
  const reset = useFormAction(async (fd) => {
    if (String(fd.get('word')).trim() !== T.resetWord) throw userError(T.resetWordMismatch);
    await onReset();
  });

  return (
    <Screen>
      <h1>{T.lockTitle}</h1>
      <section className="card">
        <form className="stack" onSubmit={unlock.onSubmit} aria-busy={unlock.busy || undefined}>
          <Field label="PIN-kód"><PinInput name="pin" autoComplete="current-password" /></Field>
          <button type="submit" className="btn btn-primary" disabled={unlock.busy}>{T.unlockButton}</button>
          <p className="hint" aria-live="polite">{status}</p>
        </form>
      </section>
      <form className="card card-warn stack" hidden={!state.canRestorePrevious} onSubmit={repair.onSubmit}>
        <p>{T.corruptedText}</p>
        <button type="submit" className="btn" disabled={repair.busy}>{T.restorePrevious}</button>
      </form>
      <details className="card">
        <summary>{T.forgotPin}</summary>
        <form className="stack" onSubmit={recover.onSubmit} aria-busy={recover.busy || undefined}>
          <Field label={T.recoveryCodeLabel}>
            <input type="text" name="code" className="input mono" autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
          </Field>
          <NewPinField label={T.newPinLabel} />
          <button type="submit" className="btn" disabled={recover.busy}>{T.recoverButton}</button>
        </form>
      </details>
      <details className="card card-warn">
        <summary>{T.resetTitle}</summary>
        <form className="stack" onSubmit={reset.onSubmit} aria-busy={reset.busy || undefined}>
          <p>{T.resetInfo}</p>
          <p className="hint">{T.resetBackupHint}</p>
          <Field label={T.resetConfirmLabel}>
            <input type="text" name="word" className="input" autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
          </Field>
          <button type="submit" className="btn btn-danger" disabled={reset.busy}>{T.resetButton}</button>
        </form>
      </details>
      <p className="hint">{T.privacyPromise}</p>
    </Screen>
  );
}
