// Bevezető: 10 lépés, egy kérdés egy képernyőn. Az útvonalak (#/bevezeto/N) miatt az Android "vissza" gomb az előző lépésre lép.
//
// Adatvédelem: a válaszok a 8. lépésig csak a memóriában (a `draft` állapotban) élnek. A PIN megadása után egyetlen
// lépésben, titkosítva kerülnek a tárolóba (auth.setup). Titkosítatlanul semmilyen személyes adat nem íródik ki.
// Ha a felhasználó közben kilép, a következő megnyitáskor az 1. lépéstől indul, és nem maradt utána semmi.

import { useEffect, useMemo, useRef, useState } from 'react';
import { MISC, ONB, PREVIEW, T } from '../../content/index.js';
import { LOCALES } from '../../i18n/locale.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { feedbackUrl } from '../../lib/feedback.js';
import { MAX_GOAL_DAYS, MAX_NICKNAME, createInitialData } from '../../domain/schema.js';
import { GOAL_OPTIONS } from '../../domain/milestones.js';
import { LABELS, ONBOARDING_TRIGGERS, SUBSTANCES } from '../../domain/presets.js';
import { toDateKey } from '../../domain/dates.js';
import { formatHuf, parseHufInput } from '../../domain/savings.js';
import { userError } from '../../lib/errors.js';
import { withTransition } from '../../lib/transition.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { CrisisButton } from '../crisis/CrisisButton.jsx';
import { Mascot } from '../mood/Mascot.jsx';
import { Confetti } from '../Confetti.jsx';
import { Icon } from '../icons/Icon.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';
import { Field } from '../ui.jsx';

export const TOTAL_STEPS = 10;
export const STEP_PATH = '#/bevezeto/';
const OPTIONAL = new Set([2, 6, 7]);
const LOOKS = { 1: 'wave', 2: 'happy', 3: 'happy', 4: 'cheer', 5: 'cheer', 6: 'happy', 7: 'comfort', 8: 'happy', 9: 'happy', 10: 'celebrate' };

const EMPTY = {
  nickname: '', substances: [], otherSubstance: '', startMode: 'today', startDate: '', goal: null, customGoal: '',
  cost: '', triggers: [], customTriggers: [],
};

export function stepFromHash(hash) {
  const m = /^#\/bevezeto\/(\d+)$/.exec(hash || '');
  const n = m ? Number(m[1]) : 1;
  return Math.min(TOTAL_STEPS, Math.max(1, n));
}

/** Az adott lépés kitöltése érvényes-e (a "Tovább" gomb ettől aktív). A hibaszöveg a lépés alatt jelenik meg. */
export function stepProblem(step, d, today = toDateKey()) {
  switch (step) {
    case 3: return d.substances.length === 0 ? 'select' : null;
    case 4:
      if (d.startMode === 'earlier') {
        if (!d.startDate) return 'select';
        if (d.startDate > today) return ONB.startFuture;
      }
      return null;
    case 5: {
      if (d.goal === 'custom') {
        const n = Number(d.customGoal);
        return Number.isInteger(n) && n >= 1 && n <= MAX_GOAL_DAYS ? null : (d.customGoal === '' ? 'select' : ONB.goalInvalid);
      }
      return d.goal ? null : 'select';
    }
    case 6: return d.cost.trim() !== '' && Number.isNaN(parseHufInput(d.cost)) ? ONB.costInvalid : null;
    default: return null;
  }
}

export function draftToProfile(d, today = toDateKey()) {
  const cost = d.cost.trim() === '' ? 0 : parseHufInput(d.cost);
  const goalDays = d.goal === 'custom' ? Number(d.customGoal) : d.goal;
  const profile = {
    journeyStart: d.startMode === 'earlier' && d.startDate ? d.startDate : today,
    dailyCostHuf: cost,
  };
  if (d.nickname.trim()) profile.nickname = d.nickname.trim();
  if (d.substances.length) profile.substances = d.substances;
  if (d.substances.includes('other') && d.otherSubstance.trim()) profile.otherSubstance = d.otherSubstance.trim();
  if (goalDays) profile.goalDays = goalDays;
  if (d.triggers.length) profile.triggers = d.triggers;
  if (d.customTriggers.length) profile.customTriggers = d.customTriggers;
  return profile;
}

function ChoiceGrid({ legend, options, selected, onToggle, multiple = true, name }) {
  return (
    <fieldset className="chips">
      <legend className="visually-hidden">{legend}</legend>
      <div className="choice-grid">
        {options.map((o) => (
          <label className="choice" key={o.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={String(o.id)} checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Welcome({ onRestore }) {
  const [prefs, setPrefs] = usePrefs();
  return (
    <>
      <div className="chip-row" role="group" aria-label={ONB.languageLabel}>
        {LOCALES.map((id) => (
          <button key={id} type="button" className={`btn${prefs.lang === id ? ' btn-primary' : ''}`} aria-pressed={prefs.lang === id}
            onClick={() => { if (prefs.lang !== id) { setPrefs({ lang: id }); location.reload(); } }}>{id === 'hu' ? 'Magyar' : 'English'}</button>
        ))}
      </div>
      <h1>{ONB.welcomeTitle}</h1>
      <p className="lead">{ONB.welcomeText}</p>
      <p className="card card-soft">{T.privacyPromise}</p>
      <p className="card card-soft"><span className="pill">{PREVIEW.badge}</span> {PREVIEW.text} <a href={feedbackUrl()} target="_blank" rel="noopener noreferrer">{PREVIEW.feedback}</a></p>
      <details className="card">
        <summary>{ONB.welcomeRestore}</summary>
        <RestoreForm onRestored={onRestore} />
      </details>
    </>
  );
}

function RestoreForm({ onRestored }) {
  const { auth } = useAuth();
  const restore = useFormAction(async (fd) => {
    const backup = JSON.parse(await fd.get('file').text());
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

function Pin({ onCreate, busy }) {
  const submit = useFormAction(async (fd) => {
    if (fd.get('pin') !== fd.get('pin2')) throw userError(T.pinMismatch);
    await onCreate(String(fd.get('pin')));
  });
  return (
    <>
      <h1>{ONB.pinTitle}</h1>
      <p className="lead">{ONB.pinText}</p>
      <form id="onb-pin" className="stack" onSubmit={submit.onSubmit} aria-busy={submit.busy || busy || undefined}>
        <NewPinField label={T.pinLabel} />
        <Field label={T.pinConfirmLabel}><PinInput name="pin2" /></Field>
        <p className="hint">{T.pinHint}</p>
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
  const [custom, setCustom] = useState('');
  const maxReached = useRef(1);
  const headingRef = useRef(null);
  const today = toDateKey();
  const step = stepFromHash(hash);
  const created = recoveryCode !== null;

  // Elölről indítás: ha az útvonal előbbre mutat, mint ameddig a felhasználó eljutott (pl. újraindítás után), az 1. lépésre állunk.
  // A vault létrehozása után nincs visszaút a PIN-lépésre: a 9–10. lépés marad.
  useEffect(() => {
    if (created && step < 9) replace(`${STEP_PATH}9`);
    else if (!created && step > maxReached.current) replace(`${STEP_PATH}1`);
  }, [step, created, replace]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); scrollTo(0, 0); }, [step]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggle = (key, id) => setDraft((d) => ({ ...d, [key]: d[key].includes(id) ? d[key].filter((x) => x !== id) : [...d[key], id] }));
  const go = (n) => { maxReached.current = Math.max(maxReached.current, n); withTransition(() => navigate(`${STEP_PATH}${n}`)); };
  const problem = useMemo(() => stepProblem(step, draft, today), [step, draft, today]);
  const blocked = problem !== null;

  const create = async (pin) => {
    const { recoveryCode: code } = await auth.setup(pin, createInitialData(draftToProfile(draft, today)));
    setRecoveryCode(code);
    navigator.storage?.persist?.().catch(() => {});
    maxReached.current = 9;
    withTransition(() => navigate(`${STEP_PATH}9`));
  };

  const copy = async () => { try { await navigator.clipboard.writeText(recoveryCode); setCopied(true); } catch { toast(ONB.recoveryText); } };
  const addCustom = () => {
    const t = custom.trim().slice(0, 30);
    if (!t || draft.customTriggers.includes(t) || draft.customTriggers.length >= 10) return;
    set({ customTriggers: [...draft.customTriggers, t] });
    setCustom('');
  };
  const name = draft.nickname.trim();
  const costNum = draft.cost.trim() === '' ? NaN : parseHufInput(draft.cost);

  let body;
  switch (step) {
    case 1: body = <Welcome onRestore={() => onFinish({ restored: true })} />; break;
    case 2:
      body = (
        <>
          <h1>{ONB.nickTitle}</h1>
          <p className="lead">{ONB.nickText}</p>
          <Field label={ONB.nickLabel}>
            <input className="input big-input" name="nickname" value={draft.nickname} maxLength={MAX_NICKNAME} placeholder={ONB.nickPlaceholder}
              autoComplete="off" onChange={(e) => set({ nickname: e.target.value })} />
          </Field>
        </>
      );
      break;
    case 3:
      body = (
        <>
          <h1>{ONB.substancesTitle}</h1>
          <p className="lead">{ONB.substancesText}</p>
          <ChoiceGrid legend={ONB.substancesTitle} name="substances" options={SUBSTANCES} selected={draft.substances} onToggle={(id) => toggle('substances', id)} />
          {draft.substances.includes('other') && (
            <Field label={ONB.otherLabel}><input className="input" value={draft.otherSubstance} maxLength={40} onChange={(e) => set({ otherSubstance: e.target.value })} /></Field>
          )}
        </>
      );
      break;
    case 4:
      body = (
        <>
          <h1>{ONB.startTitle}</h1>
          <div className="choice-grid" role="radiogroup" aria-label={ONB.startTitle}>
            {[['today', ONB.startToday], ['earlier', ONB.startEarlier]].map(([id, label]) => (
              <label className="choice" key={id}>
                <input type="radio" name="startMode" value={id} checked={draft.startMode === id} onChange={() => set({ startMode: id })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {draft.startMode === 'earlier' && (
            <Field label={ONB.startDateLabel}>
              <input type="date" className="input big-input" name="startDate" max={today} value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            </Field>
          )}
          {typeof problem === 'string' && problem !== 'select' && <p className="card card-warn" role="alert">{problem}</p>}
        </>
      );
      break;
    case 5:
      body = (
        <>
          <h1>{ONB.goalTitle}</h1>
          <p className="lead">{ONB.goalText}</p>
          <div className="choice-grid" role="radiogroup" aria-label={ONB.goalTitle}>
            {[...GOAL_OPTIONS.map((n) => [n, ONB.goalOption(n)]), ['custom', ONB.goalCustom]].map(([id, label]) => (
              <label className="choice" key={id}>
                <input type="radio" name="goal" value={String(id)} checked={draft.goal === id} onChange={() => set({ goal: id })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {draft.goal === 'custom' && (
            <Field label={ONB.goalCustomLabel}>
              <input className="input big-input" inputMode="numeric" name="customGoal" value={draft.customGoal} onChange={(e) => set({ customGoal: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
            </Field>
          )}
          {typeof problem === 'string' && problem !== 'select' && <p className="card card-warn" role="alert">{problem}</p>}
        </>
      );
      break;
    case 6:
      body = (
        <>
          <h1>{ONB.costTitle}</h1>
          <p className="lead">{ONB.costText}</p>
          <Field label={ONB.costLabel}>
            <input className="input big-input" name="cost" inputMode="numeric" placeholder="pl. 3 500" value={draft.cost} onChange={(e) => set({ cost: e.target.value })} />
          </Field>
          {Number.isFinite(costNum) && costNum > 0 && <p className="card tone tone-mint cost-note" aria-live="polite">{ONB.costMonthly(formatHuf(costNum * 30))}</p>}
          {typeof problem === 'string' && <p className="card card-warn" role="alert">{problem}</p>}
        </>
      );
      break;
    case 7:
      body = (
        <>
          <h1>{ONB.triggersTitle}</h1>
          <p className="lead">{ONB.triggersText}</p>
          <ChoiceGrid legend={ONB.triggersTitle} name="triggers" options={ONBOARDING_TRIGGERS.map((id) => ({ id, label: ONB.triggerShort[id] ?? LABELS.trigger.get(id) }))}
            selected={draft.triggers} onToggle={(id) => toggle('triggers', id)} />
          <div className="row">
            <input className="input" aria-label={ONB.triggersCustomLabel} placeholder={ONB.triggersCustomLabel} value={custom} maxLength={30}
              onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
            <button type="button" className="btn" onClick={addCustom}>{ONB.triggersCustomAdd}</button>
          </div>
          {draft.customTriggers.length > 0 && (
            <ul className="legend" aria-label={ONB.triggersCustomLabel}>
              {draft.customTriggers.map((t) => (
                <li key={t}><span className="pill">{t}
                  <button type="button" className="btn-link" aria-label={ONB.triggerRemove(t)} onClick={() => set({ customTriggers: draft.customTriggers.filter((x) => x !== t) })}><Icon name="close" size={16} /></button>
                </span></li>
              ))}
            </ul>
          )}
        </>
      );
      break;
    case 8: body = <Pin onCreate={create} />; break;
    case 9:
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
      break;
    default:
      body = (
        <>
          <h1>{ONB.doneTitle(name)}</h1>
          <p className="lead">{ONB.doneText}</p>
          <Confetti />
        </>
      );
  }

  const showBack = step > 1 && step < 9;
  const hasOwnSubmit = step === 8;
  const canSkip = OPTIONAL.has(step);
  const nextLabel = step === 1 ? ONB.start : step === 10 ? ONB.finish : ONB.next;
  const onNext = () => {
    if (step === 10) onFinish({ restored: false });
    else go(step + 1);
  };
  const nextDisabled = blocked || (step === 9 && !saved);

  return (
    <div className="onb">
      <div className="onb-top">
        {showBack
          ? <button type="button" className="btn btn-ghost" aria-label={ONB.back} onClick={() => history.back()}><Icon name="back" size={22} /></button>
          : <span style={{ width: 48 }} />}
        <div className="onb-progress" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label={ONB.progressLabel(step, TOTAL_STEPS)}>
          <p className="onb-count">{ONB.step(step, TOTAL_STEPS)}</p>
          <div className="dots" aria-hidden="true">{Array.from({ length: TOTAL_STEPS }, (_, i) => <i key={i} className={i < step ? 'on' : ''} />)}</div>
        </div>
        <CrisisButton />
      </div>
      <div className="onb-body step-enter" key={step}>
        <div className="onb-mascot"><Mascot look={LOOKS[step]} size={step === 1 || step === 10 ? 132 : 84} label={null} /></div>
        <div ref={headingRef} tabIndex={-1} style={{ outline: 'none' }} className="stack">{body}</div>
      </div>
      <div className="onb-nav">
        {hasOwnSubmit
          ? <button type="submit" form="onb-pin" className="btn btn-primary btn-big">{nextLabel}</button>
          : <button type="button" className="btn btn-primary btn-big" disabled={nextDisabled} onClick={onNext}>{nextLabel}</button>}
      </div>
      {canSkip && <button type="button" className="btn-link onb-skip" onClick={() => go(step + 1)}>{ONB.skip}</button>}
      {step === 1 && <p className="hint center">{ONB.restartNote}</p>}
      {step === 1 && <p className="hint center">{T.disclaimer}</p>}
    </div>
  );
}
