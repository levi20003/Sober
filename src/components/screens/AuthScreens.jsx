// One-time recovery code, and the lock screen (number pad or passphrase / help: recover, repair, zero-knowledge reset).
// Every transition goes through the auth state machine (src/auth/appAuth.js).

import { useEffect, useRef, useState } from 'react';
import { T, MISC, ONB, UX } from '../../content/index.js';
import { friendlyError, userError } from '../../lib/errors.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field, Screen } from '../ui.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';
import { Sheet } from '../Info.jsx';
import { Icon } from '../icons/Icon.jsx';

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
      <button type="button" className="btn btn-primary" disabled={!ok} onClick={onDone}>{ONB.next}</button>
    </Screen>
  );
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Számbillentyűzet + pontok: az utolsó számjegy után magától nyit. */
function PinPad({ length, onComplete, status, busy, shake }) {
  const [digits, setDigitsState] = useState('');
  const digitsRef = useRef('');
  const working = useRef(false);
  const setDigits = (v) => { digitsRef.current = v; setDigitsState(v); };
  const press = (d) => {
    if (busy || working.current) return;
    globalThis.navigator?.vibrate?.(8);
    const next = (digitsRef.current + d).slice(0, length);
    setDigits(next);
    if (next.length === length) {
      working.current = true;
      Promise.resolve(onComplete(next)).finally(() => { working.current = false; setDigits(''); });
    }
  };
  const back = () => { if (!busy && !working.current) setDigits(digitsRef.current.slice(0, -1)); };
  useEffect(() => {
    const on = (e) => {
      if (e.target.closest?.('dialog')) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') back();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });
  return (
    <>
      <div className={`pin-dots${shake ? ' shake' : ''}`} role="img" aria-label={`${digits.length} / ${length}`}>
        {Array.from({ length }, (_, i) => <i key={i} className={i < digits.length ? 'on' : ''} />)}
      </div>
      <p className="lock-status" role="status" aria-live="polite">{status}</p>
      <div className="keypad" role="group" aria-label={UX.pinPad}>
        {DIGITS.map((d) => <button key={d} type="button" className="key" onClick={() => press(d)}>{d}</button>)}
        <span />
        <button type="button" className="key" onClick={() => press('0')}>0</button>
        <button type="button" className="key quiet" aria-label={UX.erase} onClick={back}><Icon name="backspace" size={28} /></button>
      </div>
    </>
  );
}

/** Jelszó/hosszú PIN: egy nagy mező, megjeleníthető. */
function SecretForm({ onSubmit, busy, status }) {
  const [show, setShow] = useState(false);
  return (
    <form className="stack" style={{ width: '100%' }} onSubmit={onSubmit} aria-busy={busy || undefined}>
      <div className="secret-row">
        <input type={show ? 'text' : 'password'} name="pin" className="input" aria-label={MISC.pinField} autoComplete="current-password" autoFocus required />
        <button type="button" className="key quiet" style={{ width: 52, height: 52 }} aria-label={show ? UX.hideSecret : UX.showSecret} aria-pressed={show} onClick={() => setShow((v) => !v)}><Icon name={show ? 'eyeoff' : 'eye'} size={24} /></button>
      </div>
      <p className="lock-status" role="status" aria-live="polite">{status}</p>
      <button type="submit" className="btn btn-primary btn-big" disabled={busy}>{T.unlockButton}</button>
    </form>
  );
}

export function LockScreen({ onReset }) {
  const { auth, state } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [lastPin, setLastPin] = useState('');
  const [hint, setHint] = useState(undefined); // undefined: még töltődik, null: nincs gyors billentyűzet
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.resolve(auth.store?.getMeta?.()).then((m) => { if (alive) setHint(m && m.quickPin !== false && m.pinHint ? m.pinHint : null); }).catch(() => alive && setHint(null));
    return () => { alive = false; };
  }, [auth, state.status]);

  const tryUnlock = async (pin) => {
    setStatus('');
    setBusy(true);
    try {
      await auth.unlock(pin);
    } catch (err) {
      setLastPin(pin);
      // Világos, tartós visszajelzés. Hibás PIN-nél soha nem törlődik semmi.
      if (err.code === 'WRONG_SECRET') { setStatus(err.retryAfterMs ? friendlyError(err) : T.errWrongPin); setShake((n) => n + 1); } else toast(friendlyError(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const unlockForm = (e) => { e.preventDefault(); tryUnlock(String(new FormData(e.currentTarget).get('pin'))); };

  const recover = useFormAction(async (fd) => {
    await auth.recover(fd.get('code'), fd.get('pin'));
    setHelp(false);
    toast(MISC.pinChangedKept);
  });
  const repair = useFormAction(async () => {
    await auth.restorePrevious(lastPin);
    toast(MISC.previousRestored);
  });
  // Zero-knowledge reset: the only way forward without PIN and recovery code.
  const reset = useFormAction(async (fd) => {
    if (String(fd.get('word')).trim() !== T.resetWord) throw userError(T.resetWordMismatch);
    await onReset();
  });

  return (
    <Screen className="lock">
      <h1>{T.lockTitle}</h1>
      {hint === undefined ? null : hint
        ? <PinPad key={shake} length={hint} onComplete={tryUnlock} status={status} busy={busy} shake={shake > 0} />
        : <SecretForm onSubmit={unlockForm} busy={busy} status={status} />}
      {state.canRestorePrevious && (
        <form className="card card-warn stack" onSubmit={repair.onSubmit}>
          <p>{T.corruptedText}</p>
          <button type="submit" className="btn" disabled={repair.busy}>{T.restorePrevious}</button>
        </form>
      )}
      <button type="button" className="btn-link" onClick={() => setHelp(true)}>{UX.helpLogin}</button>
      {help && (
        <Sheet title={UX.helpLogin} closeLabel={UX.close} onClose={() => setHelp(false)}>
          <details>
            <summary>{T.forgotPin}</summary>
            <form className="stack" onSubmit={recover.onSubmit} aria-busy={recover.busy || undefined}>
              <Field label={T.recoveryCodeLabel}>
                <input type="text" name="code" className="input mono" autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
              </Field>
              <NewPinField label={T.newPinLabel} />
              <button type="submit" className="btn" disabled={recover.busy}>{T.recoverButton}</button>
            </form>
          </details>
          <details>
            <summary>{T.resetTitle}</summary>
            <form className="stack" onSubmit={reset.onSubmit} aria-busy={reset.busy || undefined}>
              <p>{T.resetInfo}</p>
              <Field label={T.resetConfirmLabel}>
                <input type="text" name="word" className="input" autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
              </Field>
              <button type="submit" className="btn btn-danger" disabled={reset.busy}>{T.resetButton}</button>
            </form>
          </details>
        </Sheet>
      )}
    </Screen>
  );
}
