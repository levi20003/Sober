import { useState } from 'react';
import { T, CONTENT_VERSION, REVIEW_STATUS, SETTINGS_PAGE as SP, ONB } from '../../content/hu.js';
import { toCsvExport, toJsonExport, parseJsonImport } from '../../domain/export.js';
import { toDateKey } from '../../domain/dates.js';
import { download } from '../../lib/format.js';
import { userError } from '../../lib/errors.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useHashRoute } from '../../hooks/useHashRoute.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Field } from '../ui.jsx';
import { NewPinField, PinInput } from '../PinFields.jsx';
import { SUBSTANCES, ONBOARDING_TRIGGERS } from '../../domain/presets.js';
import { MAX_GOAL_DAYS, MAX_NICKNAME } from '../../domain/schema.js';
import { Actions } from '../../domain/timelineReducer.js';
import { isNativeShell } from '../../lib/platform.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { useUpdate } from '../../hooks/useUpdate.js';
import { Page } from '../shell/Page.jsx';


const APK_PAGE = 'https://levi20003.github.io/Sober/telepites.html';

/** Rólad: becenév, cél, mitől maradsz távol, nehéz helyzetek. Mind a titkosított tárolóba kerül. */
function ProfileSection() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const p = snapshot.data.profile;
  const [subs, setSubs] = useState(p.substances ?? []);
  const [trigs, setTrigs] = useState(p.triggers ?? []);
  const save = useFormAction(async (fd) => {
    const goal = String(fd.get('goal') ?? '').trim();
    const n = goal === '' ? null : Number(goal);
    if (n !== null && (!Number.isInteger(n) || n < 1 || n > MAX_GOAL_DAYS)) throw userError(ONB.goalInvalid);
    await dispatch({ type: Actions.UPDATE_PROFILE, payload: { nickname: String(fd.get('nick') ?? '').trim() || null, goalDays: n, substances: subs, triggers: trigs } });
    toast(T.saved_ok);
  });
  const flip = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <section className="card" aria-labelledby="prof-h">
      <h2 id="prof-h">{SP.profile}</h2>
      <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined}>
        <Field label={SP.nickname}><input name="nick" className="input" defaultValue={p.nickname ?? ''} maxLength={MAX_NICKNAME} autoComplete="off" /></Field>
        <Field label={SP.goal}><input name="goal" className="input" inputMode="numeric" defaultValue={p.goalDays ?? ''} /></Field>
        <fieldset className="chips"><legend>{SP.substances}</legend><div className="chip-row">
          {SUBSTANCES.map((o) => <label className="chip" key={o.id}><input type="checkbox" checked={subs.includes(o.id)} onChange={() => flip(subs, setSubs, o.id)} /><span>{o.label}</span></label>)}
        </div></fieldset>
        <fieldset className="chips"><legend>{SP.triggers}</legend><div className="chip-row">
          {ONBOARDING_TRIGGERS.map((id) => <label className="chip" key={id}><input type="checkbox" checked={trigs.includes(id)} onChange={() => flip(trigs, setTrigs, id)} /><span>{ONB.triggerShort[id]}</span></label>)}
        </div></fieldset>
        <button type="submit" className="btn btn-primary" disabled={save.busy}>{T.save}</button>
      </form>
    </section>
  );
}

function AppearanceSection() {
  const [prefs, setPrefs] = usePrefs();
  return (
    <section className="card" aria-labelledby="app-h">
      <h2 id="app-h">{SP.appearance}</h2>
      <fieldset className="chips"><legend>{SP.theme}</legend><div className="chip-row">
        {Object.entries(SP.themeOptions).map(([id, label]) => (
          <label className="chip" key={id}><input type="radio" name="theme" value={id} checked={prefs.theme === id} onChange={() => setPrefs({ theme: id })} /><span>{label}</span></label>
        ))}
      </div></fieldset>
      <div className="check">
        <input type="checkbox" id="motion-off" role="switch" checked={prefs.motion === 'reduced'} onChange={(e) => setPrefs({ motion: e.target.checked ? 'reduced' : 'full' })} />
        <label htmlFor="motion-off">{SP.motion}</label>
      </div>
      <p className="hint">{SP.motionHint}</p>
    </section>
  );
}

/** Verzió és frissítés. PWA: automatikus (service worker); Android-app: kézi, letöltési oldalról. */
function UpdateSection() {
  const u = useUpdate();
  const native = isNativeShell();
  return (
    <section className="card" aria-labelledby="upd-h">
      <h2 id="upd-h">{SP.update}</h2>
      <p>{SP.version(__APP_VERSION__)}</p>
      {native ? (
        <>
          <p className="hint">{SP.updateApkText}</p>
          <a className="btn" href={APK_PAGE} target="_blank" rel="noopener noreferrer">{SP.updateApkLink}</a>
        </>
      ) : u.supported ? (
        <>
          <p className="hint" role="status">{u.ready ? SP.updateReady : u.status === 'checking' ? SP.updateChecking : u.status === 'uptodate' ? SP.updateNone : ''}</p>
          <div className="actions">
            {u.ready
              ? <button type="button" className="btn btn-primary" onClick={u.apply}>{SP.updateApply}</button>
              : <button type="button" className="btn" onClick={() => u.check()} disabled={u.status === 'checking'}>{SP.updateCheck}</button>}
          </div>
        </>
      ) : <p className="hint">{SP.updateUnsupported}</p>}
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
    <Page title={SP.title}>
      <div className="actions"><button type="button" className="btn" onClick={() => auth.lock('manual')}>{T.lockNow}</button></div>
      <ProfileSection />
      <AppearanceSection />
      <UpdateSection />
      <section className="card">
        <h2>{T.journeySection}</h2>
        <form className="stack" onSubmit={prefs.onSubmit} aria-busy={prefs.busy || undefined}>
          <Field label={T.journeyStartLabel}><input type="date" name="start" className="input" defaultValue={data.profile.journeyStart} max={toDateKey()} required /></Field>
          <Field label={T.autoLockLabel}><input type="number" name="autolock" className="input" min="1" max="120" defaultValue={String(data.settings.autoLockMinutes)} /></Field>
          <button type="submit" className="btn btn-primary" disabled={prefs.busy}>{T.save}</button>
        </form>
      </section>

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
    </Page>
  );
}
