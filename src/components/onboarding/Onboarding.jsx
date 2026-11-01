// Bevezető: 5 rövid lépés (üdvözlés és becenév, mitől maradsz távol, mióta, PIN, helyreállító kód).
// A célt, a napi költséget és a nehéz helyzeteket később, a főoldali "Tedd a sajátoddá" kártyán lehet megadni.
// Az útvonalak (#/bevezeto/N) miatt az Android "vissza" gomb az előző lépésre lép.
//
// Adatvédelem: a válaszok a PIN-lépésig csak a memóriában (a `draft` állapotban) élnek. A PIN megadása után egyetlen
// lépésben, titkosítva kerülnek a tárolóba (auth.setup). Titkosítatlanul semmilyen személyes adat nem íródik ki.
// Ha a felhasználó közben kilép, a következő megnyitáskor az 1. lépéstől indul, és nem maradt utána semmi.

import { useEffect, useMemo, useRef, useState } from 'react';
import { MISC, ONB, SETUP, T, UX } from '../../content/index.js';
import { TitleWithInfo } from '../Info.jsx';
import { LOCALES } from '../../i18n/locale.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { MAX_NICKNAME, createInitialData } from '../../domain/schema.js';
import { SUBSTANCES } from '../../domain/presets.js';
import { toDateKey } from '../../domain/dates.js';
import { userError } from '../../lib/errors.js';
import { withTransition } from '../../lib/transition.js';
import { readImportFile } from '../../lib/safeJson.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { CrisisButton } from '../crisis/CrisisButton.jsx';
import { Mascot } from '../mood/Mascot.jsx';
import { Icon } from '../icons/Icon.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';
import { Field } from '../ui.jsx';
import { ChoiceGrid } from './Pickers.jsx';

export const TOTAL_STEPS = 5;
export const STEP_PATH = '#/bevezeto/';
const PIN_STEP = 4;
const RECOVERY_STEP = 5;
const LOOKS = { 1: 'wave', 2: 'happy', 3: 'cheer', 4: 'happy', 5: 'celebrate' };

const EMPTY = { nickname: '', substances: [], otherSubstance: '', startMode: 'today', startDate: '' };

export function stepFromHash(hash) {
  const m = /^#\/bevezeto\/(\d+)$/.exec(hash || '');
  const n = m ? Number(m[1]) : 1;
  return Math.min(TOTAL_STEPS, Math.max(1, n));
}

/** Az adott lépés kitöltése érvényes-e (a "Tovább" gomb ettől aktív). A hibaszöveg a lépés alatt jelenik meg. */
export function stepProblem(step, d, today = toDateKey()) {
  switch (step) {
    case 2: return d.substances.length === 0 ? 'select' : null;
    case 3:
      if (d.startMode === 'earlier') {
        if (!d.startDate) return 'select';
        if (d.startDate > today) return ONB.startFuture;
      }
      return null;
    default: return null;
  }
}

export function draftToProfile(d, today = toDateKey()) {
  const profile = { journeyStart: d.startMode === 'earlier' && d.startDate ? d.startDate : today, dailyCostHuf: 0 };
  if (d.nickname.trim()) profile.nickname = d.nickname.trim();
  if (d.substances.length) profile.substances = d.substances;
  if (d.substances.includes('other') && d.otherSubstance.trim()) profile.otherSubstance = d.otherSubstance.trim();
  return profile;
}

function LanguageToggle() {
  const [prefs, setPrefs] = usePrefs();
  return (
    <div className="seg-tabs lang-toggle" role="group" aria-label={ONB.languageLabel}>
      {LOCALES.map((id) => (
        <button key={id} type="button" aria-pressed={prefs.lang === id}
          onClick={() => { if (prefs.lang !== id) { setPrefs({ lang: id }); location.reload(); } }}>{id === 'hu' ? 'Magyar' : 'English'}</button>
      ))}
    </div>
  );
}

function RestoreForm({ onRestored }) {
  const { auth } = useAuth();
  const restore = useFormAction(async (fd) => {
    const backup = await readImportFile(fd.get('file'));
    await auth.restoreBackup(backup, fd.get('pin'));
    onRestored();
  });
  return (
    <form className="stack" onSubmit={restore.onSubmit} aria-busy={restore.busy || undefined}>
      <Field label={MISC.backupFile}><input type="file" name="file" accept=".json,application/json" required className="input" /></Field>
      <Field label={MISC.backupPin}><PinInput name="pin" autoComplete="current-password" /></Field>
      <button type="submit" className="btn" disabled={restore.busy}>{T.importEncrypted}</button>
    </form>
  );
}

function Pin({ onCreate }) {
  const submit = useFormAction(async (fd) => {
    if (fd.get('pin') !== fd.get('pin2')) throw userError(T.pinMismatch);
    await onCreate(String(fd.get('pin')));
  });
  return (
    <>
      <TitleWithInfo as="h1" title={ONB.pinTitle} infoTitle={UX.pinInfoTitle} info={<><p>{ONB.pinText}</p><p>{T.pinHint}</p><p>{UX.offlineNote}</p></>} />
      <form id="onb-pin" className="stack" onSubmit={submit.onSubmit} aria-busy={submit.busy || undefined}>
        <NewPinField label={T.pinLabel} />
        <Field label={T.pinConfirmLabel}><PinInput name="pin2" /></Field>
      </form>
    </>
  );
}

export function Onboarding({ onFinish }) {
  const { auth } = useAuth();
  const { hash, navigate, replace } = useHashRoute();
  const toast = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [recoveryCode, setRecoveryCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const maxReached = useRef(1);
  const headingRef = useRef(null);
  const today = toDateKey();
  const step = stepFromHash(hash);
  const created = recoveryCode !== null;

  // Elölről indítás: ha az útvonal előbbre mutat, mint ameddig a felhasználó eljutott (pl. újraindítás után), az 1. lépésre állunk.
  // A tároló létrehozása után nincs visszaút a PIN-lépésre.
  useEffect(() => {
    if (created && step < RECOVERY_STEP) replace(`${STEP_PATH}${RECOVERY_STEP}`);
    else if (!created && step > maxReached.current) replace(`${STEP_PATH}1`);
  }, [step, created, replace]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); scrollTo(0, 0); }, [step]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = (key, id) => setDraft((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }));
  const go = (n) => { maxReached.current = Math.max(maxReached.current, n); withTransition(() => navigate(`${STEP_PATH}${n}`)); };
  const problem = useMemo(() => stepProblem(step, draft, today), [step, draft, today]);

  const create = async (pin) => {
    const { recoveryCode: code } = await auth.setup(pin, createInitialData(draftToProfile(draft, today)));
    setRecoveryCode(code);
    navigator.storage?.persist?.().catch(() => {});
    maxReached.current = RECOVERY_STEP;
    withTransition(() => navigate(`${STEP_PATH}${RECOVERY_STEP}`));
  };
  const copy = async () => { try { await navigator.clipboard.writeText(recoveryCode); setCopied(true); toast(UX.clipboardWarning); } catch { toast(ONB.recoveryText); } };

  let body;
  switch (step) {
    case 1:
      body = (
        <>
          <TitleWithInfo as="h1" title={ONB.welcomeTitle} infoTitle={UX.welcomeInfo} info={<><p>{UX.welcomeInfoText}</p><p>{T.privacyPromise}</p></>} />
          <Field label={SETUP.nickLabel}>
            <input className="input big-input" name="nickname" value={draft.nickname} maxLength={MAX_NICKNAME} placeholder={ONB.nickPlaceholder}
              autoComplete="off" onChange={(e) => set({ nickname: e.target.value })} />
          </Field>
          <details className="quiet-details">
            <summary>{ONB.welcomeRestore}</summary>
            <RestoreForm onRestored={() => onFinish({ restored: true })} />
          </details>
        </>
      );
      break;
    case 2:
      body = (
        <>
          <h1>{ONB.substancesTitle}</h1>
          <ChoiceGrid legend={ONB.substancesTitle} name="substances" options={SUBSTANCES} selected={draft.substances} onToggle={(id) => toggle('substances', id)} />
          {draft.substances.includes('other') && (
            <Field label={ONB.otherLabel}><input className="input" value={draft.otherSubstance} maxLength={40} onChange={(e) => set({ otherSubstance: e.target.value })} /></Field>
          )}
        </>
      );
      break;
    case 3:
      body = (
        <>
          <h1>{ONB.startTitle}</h1>
          <ChoiceGrid legend={ONB.startTitle} name="startMode" multiple={false} selected={[draft.startMode]} onToggle={(id) => set({ startMode: id })}
            options={[{ id: 'today', label: ONB.startToday }, { id: 'earlier', label: ONB.startEarlier }]} />
          {draft.startMode === 'earlier' && (
            <Field label={ONB.startDateLabel}>
              <input type="date" className="input big-input" name="startDate" max={today} value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            </Field>
          )}
          {typeof problem === 'string' && problem !== 'select' && <p className="card card-warn" role="alert">{problem}</p>}
        </>
      );
      break;
    case PIN_STEP: body = <Pin onCreate={create} />; break;
    default:
      body = (
        <>
          <h1>{ONB.recoveryTitle}</h1>
          <p className="lead">{ONB.recoveryText}</p>
          <p className="recovery-box mono" translate="no" data-testid="recovery-code">{recoveryCode}</p>
          <button type="button" className="btn" onClick={copy}><Icon name="copy" size={20} />{copied ? T.copied : T.copy}</button>
          <div className="check">
            <input type="checkbox" id="rc-ok" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <label htmlFor="rc-ok">{ONB.recoveryConfirm}</label>
          </div>
        </>
      );
  }

  const showBack = step > 1 && step < RECOVERY_STEP;
  const nextLabel = step === 1 ? ONB.start : step === RECOVERY_STEP ? ONB.finish : ONB.next;
  const nextDisabled = problem !== null || (step === RECOVERY_STEP && !saved);
  const onNext = () => (step === RECOVERY_STEP ? onFinish({ restored: false }) : go(step + 1));

  return (
    <div className="onb">
      <div className="onb-top">
        {showBack
          ? <button type="button" className="icon-btn" aria-label={ONB.back} onClick={() => history.back()}><Icon name="back" size={22} /></button>
          : <span className="icon-btn-space" />}
        <div className="onb-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label={ONB.progressLabel(step, TOTAL_STEPS)}>
          <div className="steps-bar" aria-hidden="true"><i style={{ transform: `scaleX(${step / TOTAL_STEPS})` }} /></div>
          <p className="onb-count">{ONB.step(step, TOTAL_STEPS)}</p>
        </div>
        <CrisisButton />
      </div>
      {step === 1 && <LanguageToggle />}
      <div className="onb-body step-enter" key={step}>
        <div className="onb-mascot"><Mascot look={LOOKS[step]} size={step === 1 ? 112 : 72} label={null} /></div>
        <div ref={headingRef} tabIndex={-1} style={{ outline: 'none' }} className="stack">{body}</div>
      </div>
      <div className="onb-nav">
        {step === PIN_STEP
          ? <button type="submit" form="onb-pin" className="btn btn-primary btn-big">{nextLabel}</button>
          : <button type="button" className="btn btn-primary btn-big" disabled={nextDisabled} onClick={onNext}>{nextLabel}</button>}
      </div>
    </div>
  );
}
