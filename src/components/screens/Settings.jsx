import { useEffect, useState } from 'react';
import { T, MISC, UX, CONTENT_VERSION, REVIEW_STATUS, SETTINGS_PAGE as SP, COMPANIONS, PREVIEW, COUNTRIES, ONB, helplinesFor } from '../../content/index.js';
import { lastVerified } from '../../domain/helplines.js';
import { LOCALES } from '../../i18n/locale.js';
import { CURRENCIES, CURRENCY_IDS } from '../../i18n/money.js';
import { feedbackUrl } from '../../lib/feedback.js';
import { readImportText } from '../../lib/safeJson.js';
import { parseBackupText } from '../../domain/backupFile.js';
import { BACKUP_ACCEPT, saveTextFile, shareTextFile, canShareFiles, setSecureScreen, signingFingerprint } from '../../lib/nativeFiles.js';
import { toCsvExport, toJsonExport, parseJsonImport } from '../../domain/export.js';
import { toDateKey } from '../../domain/dates.js';
import { userError, friendlyError } from '../../lib/errors.js';
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
import { InfoButton, Sheet } from '../Info.jsx';
import { RecoveryRestoreFields } from '../RestoreFields.jsx';
import { Companion, COMPANION_IDS, companionOf } from '../companions/Companion.jsx';
import { ApkUpdateStatus, apkBusy } from '../ApkUpdateStatus.jsx';


const APK_PAGE = 'https://levi20003.github.io/Sober/telepites.html';
const CHANGES_PAGE = 'https://levi20003.github.io/Sober/valtozasok.html';

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
    <>
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
    </>
  );
}

/** Összecsukható csoport: a Beállítások így átlátható marad. */
function Group({ id, title, open = false, children, tone }) {
  return (
    <details className={`card group${tone ? ` ${tone}` : ''}`} open={open} id={id}>
      <summary><h2>{title}</h2></summary>
      <div className="stack group-body">{children}</div>
    </details>
  );
}

const Legend = ({ children, info, infoTitle }) => (
  <legend className="legend-info">{children}{info && <InfoButton title={infoTitle ?? String(children)}>{info}</InfoButton>}</legend>
);

/** Megbízható személy: a krízisoldalról egy koppintással hívható (csak feloldott naplónál jelenik meg). Titkosítva tárolódik. */
function TrustedSection() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const c = snapshot.data.profile.trustedContact;
  const save = useFormAction(async (fd) => {
    const name = String(fd.get('name') ?? '').trim();
    const phone = String(fd.get('phone') ?? '').trim();
    if (!name && !phone) { await dispatch({ type: Actions.UPDATE_PROFILE, payload: { trustedContact: null } }); toast(T.saved_ok); return; }
    if (!name || !/^\+?[\d ]{3,20}$/.test(phone)) throw userError(UX.trustedInvalid);
    await dispatch({ type: Actions.UPDATE_PROFILE, payload: { trustedContact: { name, phone } } });
    toast(T.saved_ok);
  });
  return (
    <form className="stack" onSubmit={save.onSubmit} aria-busy={save.busy || undefined} key={c ? `${c.name}|${c.phone}` : 'none'}>
      <h3>{UX.trustedTitle}</h3>
      <Field label={UX.trustedName}><input name="name" className="input" maxLength={40} defaultValue={c?.name ?? ''} autoComplete="off" /></Field>
      <Field label={UX.trustedPhone}><input name="phone" className="input" type="tel" inputMode="tel" maxLength={20} defaultValue={c?.phone ?? ''} autoComplete="off" /></Field>
      <button type="submit" className="btn" disabled={save.busy}>{T.save}</button>
    </form>
  );
}

/** Kísérő választása: a titkosított profilba kerül (profile.companion). Bármikor kikapcsolható. */
function CompanionSection() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const current = companionOf(snapshot.data.profile);
  const pick = async (id) => {
    try { await dispatch({ type: Actions.UPDATE_PROFILE, payload: { companion: id } }); } catch (e) { toast(friendlyError(e), 'error'); }
  };
  return (
    <div className="stack">
      <h3 id="companion-h" className="legend-info">{SP.companion}<InfoButton title={SP.companion}><p>{SP.companionHint}</p></InfoButton></h3>
      <div role="radiogroup" aria-labelledby="companion-h" className="companion-pick">
        {COMPANION_IDS.map((id) => (
          <label className="companion-opt" key={id}>
            <input type="radio" name="companion" value={id} checked={current === id} onChange={() => pick(id)} />
            <span className="companion-card">
              {id === 'none' ? <span className="companion-none" aria-hidden="true" /> : <Companion kind={id} look="happy" size={44} />}
              <strong>{COMPANIONS[id].name}</strong>
              <small>{COMPANIONS[id].desc}</small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function AppearanceSection() {
  const [prefs, setPrefs] = usePrefs();
  return (
    <>
      <fieldset className="chips"><legend>{SP.theme}</legend><div className="chip-row">
        {Object.entries(SP.themeOptions).map(([id, label]) => (
          <label className="chip" key={id}><input type="radio" name="theme" value={id} checked={prefs.theme === id} onChange={() => setPrefs({ theme: id })} /><span>{label}</span></label>
        ))}
      </div></fieldset>
      <fieldset className="chips"><Legend info={<p>{SP.languageHint}</p>}>{SP.language}</Legend><div className="chip-row">
        {LOCALES.map((id) => (
          <label className="chip" key={id}><input type="radio" name="lang" value={id} checked={prefs.lang === id} onChange={() => { setPrefs({ lang: id }); location.reload(); }} /><span>{id === 'hu' ? 'Magyar' : 'English'}</span></label>
        ))}
      </div></fieldset>
      <fieldset className="chips"><legend>{SP.country}</legend><div className="chip-row">
        {COUNTRIES.map((c) => (
          <label className="chip" key={c.id}><input type="radio" name="country" value={c.id} checked={prefs.country === c.id} onChange={() => setPrefs({ country: c.id })} /><span>{c.label}</span></label>
        ))}
      </div></fieldset>
      <fieldset className="chips"><Legend info={<p>{SP.currencyHint}</p>}>{SP.currency}</Legend><div className="chip-row">
        {CURRENCY_IDS.map((id) => (
          <label className="chip" key={id}><input type="radio" name="currency" value={id} checked={prefs.currency === id} onChange={() => { setPrefs({ currency: id }); location.reload(); }} /><span>{CURRENCIES[id].symbol} {id}</span></label>
        ))}
      </div></fieldset>
      <div className="check">
        <input type="checkbox" id="motion-off" role="switch" checked={prefs.motion === 'reduced'} onChange={(e) => setPrefs({ motion: e.target.checked ? 'reduced' : 'full' })} />
        <label htmlFor="motion-off">{SP.motion}</label>
      </div>
    </>
  );
}

/** A kiválasztott ország segélyvonalainak legrégebbi ellenőrzési dátuma (K2). */
function HelplinesVerified() {
  const [prefs] = usePrefs();
  const d = lastVerified(helplinesFor(prefs.country));
  return d ? <p className="hint">{UX.helplinesVerified(d)}</p> : null;
}

/** Verzió és frissítés. PWA: automatikus (service worker); Android-app: indításkor és naponta egyszer ellenőriz, letöltés. */
function UpdateSection() {
  const u = useUpdate();
  const [prefs, setPrefs] = usePrefs();
  const native = isNativeShell();
  const status = u.ready ? (native ? SP.updateApkReady : SP.updateReady) : u.status === 'checking' ? SP.updateChecking : u.status === 'uptodate' ? SP.updateNone : u.status === 'error' ? SP.updateApkError : '';
  return (
    <>
      <p>{SP.version(__APP_VERSION__)}</p>
      {(native || u.supported) ? (
        <>
          {status && <p className="hint" role="status">{status}</p>}
          {native && <ApkUpdateStatus update={u} />}
          <div className="actions">
            {u.ready
              ? <button type="button" className="btn btn-primary" onClick={u.apply} disabled={native && apkBusy(u)}>{native ? SP.updateApkDownload : SP.updateApply}</button>
              : <button type="button" className="btn" onClick={() => u.check(native ? { manual: true } : undefined)} disabled={u.status === 'checking'}>{SP.updateCheck}</button>}
            {native && <a className="btn btn-ghost" href={APK_PAGE} target="_blank" rel="noopener noreferrer">{SP.updateApkLink}</a>}
            <a className="btn btn-ghost" href={CHANGES_PAGE} target="_blank" rel="noopener noreferrer">{SP.whatsNew}</a>
          </div>
          {native && (
            <div className="check">
              <input type="checkbox" id="apk-auto" role="switch" checked={prefs.apkCheck} onChange={(e) => setPrefs({ apkCheck: e.target.checked })} />
              <label htmlFor="apk-auto">{SP.updateApkAuto}</label>
              <InfoButton title={SP.update}><p>{SP.updateApkText}</p><p>{SP.updateApkAutoHint}</p></InfoButton>
            </div>
          )}
        </>
      ) : <p className="hint">{SP.updateUnsupported}</p>}
      <div className="row-between">
        <a className="btn btn-primary" href={feedbackUrl()} target="_blank" rel="noopener noreferrer">{SP.feedbackButton}</a>
        <InfoButton title={SP.feedback}><p>{PREVIEW.text}</p><p>{SP.feedbackText}</p></InfoButton>
      </div>
    </>
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
  const native = isNativeShell();
  const [meta, setMeta] = useState(null);
  const loadMeta = () => Promise.resolve(store.getMeta?.()).then(setMeta).catch(() => {});
  useEffect(() => { loadMeta(); }, [store]);

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
    toast(MISC.pinChanged);
    loadMeta();
  });
  const recovery = useFormAction(async (fd) => {
    const { recoveryCode } = await store.regenerateRecoveryCode(fd.get('pin'));
    showRecoveryCode(recoveryCode);
  });
  const importer = useFormAction(async (fd) => {
    const file = fd.get('file');
    const pasted = String(fd.get('paste') ?? '').trim();
    if (!pasted && !(file && file.size)) throw userError(MISC.backupFile);
    const obj = parseBackupText(pasted || await readImportText(file));
    const code = String(fd.get('code') ?? '').trim();
    if (code && fd.get('newpin') !== fd.get('newpin2')) throw userError(T.pinMismatch);
    if (!confirm(MISC.importConfirm)) return;
    if (obj?.kind === 'encrypted-backup') {
      await (code ? store.importEncryptedBackup(obj, code, { newPin: fd.get('newpin') }) : store.importEncryptedBackup(obj, fd.get('pin')));
    } else await store.save(parseJsonImport(JSON.stringify(obj)));
    refresh();
    toast(MISC.backupRestored);
    navigate('#/');
  });
  const markBackup = () => store.setMeta({ lastBackup: new Date().toISOString(), backupSnoozeUntil: null }).then(loadMeta).catch(() => {});
  // Titkosított mentés (M1, M6): elkészítjük, VISSZAOLVASVA ellenőrizzük, majd a felhasználó által választott helyre
  // mentjük (Android: a rendszer „Mentés ide” ablaka; böngésző: letöltés). Soha nem a vágólapra.
  const [backupDone, setBackupDone] = useState(null);
  const exportBackup = async () => {
    try {
      const text = JSON.stringify(await store.exportEncryptedBackup());
      await store.verifyBackup(text);
      const filename = `jozansag-mentes-${stamp}.json`;
      const r = await saveTextFile({ filename, text, mime: 'application/json' });
      if (r.where === 'cancelled') { toast(UX.backupCancelled); return; }
      await markBackup();
      setBackupDone({ ...r, filename, text });
    } catch (err) { toast(friendlyError(err), 'error'); }
  };
  const plainExport = (filename, make, mime) => async () => {
    if (!confirm(T.exportPlainWarning)) return;
    try {
      const r = await saveTextFile({ filename, text: make(), mime });
      if (r.where !== 'cancelled') toast(UX.plainSavedNote);
    } catch (err) { toast(friendlyError(err), 'error'); }
  };
  const setQuickPin = async (on) => {
    await store.setMeta(on ? { quickPin: true } : { quickPin: false, pinHint: null });
    loadMeta();
  };

  return (
    <Page title={SP.title}>
      <div className="actions"><button type="button" className="btn" onClick={() => auth.lock('manual')}>{T.lockNow}</button></div>

      <Group title={SP.profile}>
        <ProfileSection />
        <TrustedSection />
      </Group>

      <Group title={SP.appearance}><CompanionSection /><AppearanceSection /></Group>

      <Group title={T.securitySection}>
        <form className="stack" onSubmit={prefs.onSubmit} aria-busy={prefs.busy || undefined}>
          <Field label={T.journeyStartLabel}><input type="date" name="start" className="input" defaultValue={data.profile.journeyStart} max={toDateKey()} required /></Field>
          <Field label={T.autoLockLabel}><input type="number" name="autolock" className="input" min="1" max="120" defaultValue={String(data.settings.autoLockMinutes)} /></Field>
          <button type="submit" className="btn btn-primary" disabled={prefs.busy}>{T.save}</button>
        </form>
        {meta && (
          <div className="check">
            <input type="checkbox" id="quick-pin" role="switch" checked={meta.quickPin !== false} onChange={(e) => setQuickPin(e.target.checked)} />
            <label htmlFor="quick-pin">{UX.quickPin}</label>
            <InfoButton title={UX.quickPin}><p>{UX.quickPinInfo}</p></InfoButton>
          </div>
        )}
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
          <summary>{T.newRecovery}<InfoButton title={T.newRecovery}><p>{T.newRecoveryInfo}</p></InfoButton></summary>
          <form className="stack" onSubmit={recovery.onSubmit} aria-busy={recovery.busy || undefined}>
            <Field label={MISC.pinField}><PinInput name="pin" autoComplete="current-password" /></Field>
            <button type="submit" className="btn" disabled={recovery.busy}>{T.newRecovery}</button>
          </form>
        </details>
        {native && <NativeSecurity />}
      </Group>

      <Group title={T.dataSection}>
        <div className="row-between">
          <button type="button" className="btn btn-primary" onClick={exportBackup}>{T.exportEncrypted}</button>
          <InfoButton title={T.exportEncrypted}><p>{T.exportEncryptedInfo}</p></InfoButton>
        </div>
        <button type="button" className="btn" onClick={plainExport(`jozansag-naplo-${stamp}.csv`, () => toCsvExport(store.data), 'text/csv;charset=utf-8')}>{T.exportCsv}</button>
        <button type="button" className="btn" onClick={plainExport(`jozansag-naplo-${stamp}.json`, () => toJsonExport(store.data), 'application/json;charset=utf-8')}>{T.exportJson}</button>
        <details>
          <summary>{T.importEncrypted}<InfoButton title={T.importEncrypted}><p>{T.importEncryptedInfo}</p></InfoButton></summary>
          <form className="stack" onSubmit={importer.onSubmit} aria-busy={importer.busy || undefined}>
            <Field label={MISC.importFileLabel}><input type="file" name="file" accept={BACKUP_ACCEPT} className="input" /></Field>
            <Field label={UX.pasteBackup}><textarea name="paste" className="input" rows={3} placeholder={UX.pasteBackupPlaceholder} /></Field>
            <Field label={MISC.importPinLabel}><input type="password" name="pin" className="input" autoComplete="off" /></Field>
            <RecoveryRestoreFields />
            <button type="submit" className="btn" disabled={importer.busy}>{T.importEncrypted}</button>
          </form>
        </details>
        <PhoneChange />
        <button type="button" className="btn btn-danger" onClick={async () => { if (confirm(T.deleteAllConfirm)) await onWipe(); }}>{T.deleteAll}</button>
      </Group>

      {backupDone && <BackupDoneSheet done={backupDone} onClose={() => setBackupDone(null)} />}

      <Group title={SP.update}><UpdateSection /></Group>

      <Group title={T.aboutSection}>
        <p>{T.disclaimer}</p>
        <p>{T.privacyPromise}</p>
        <HelplinesVerified />
        <p className="hint">{MISC.contentVersion(CONTENT_VERSION, REVIEW_STATUS)}</p>
      </Group>
    </Page>
  );
}

/** A kész, ellenőrzött mentés: hová került, mi van benne, és továbbküldés máshová (M1). */
function BackupDoneSheet({ done, onClose }) {
  const toast = useToast();
  const share = async () => {
    try { await shareTextFile({ filename: done.filename, text: done.text, mime: 'application/json' }); } catch (err) { toast(friendlyError(err), 'error'); }
  };
  return (
    <Sheet title={UX.backupDoneTitle} closeLabel={UX.close} onClose={onClose}
      actions={canShareFiles() ? <button type="button" className="btn btn-primary" onClick={share}>{UX.backupShare}</button> : null}>
      <p>{done.where === 'device' ? UX.backupSavedDevice(done.name) : UX.backupSavedDownload(done.name)}</p>
      <p>{UX.backupEncryptedNote}</p>
      <p className="hint">{UX.backupElsewhere}</p>
    </Sheet>
  );
}

/** Telefoncsere-útmutató (README „Telefoncsere” fejezet is). */
function PhoneChange() {
  return (
    <details>
      <summary>{UX.phoneChangeTitle}</summary>
      <ol className="steps">{UX.phoneChangeSteps.map((s) => <li key={s}>{s}</li>)}</ol>
    </details>
  );
}

/** Csak az Android-appban: képernyőkép-védelem (FLAG_SECURE) és figyelmeztetés ideiglenes aláírókulcsnál. */
function NativeSecurity() {
  const [prefs, setPrefs] = usePrefs();
  const [debugSigned, setDebugSigned] = useState(false);
  useEffect(() => {
    signingFingerprint().then((fp) => setDebugSigned(!!fp && fp !== __RELEASE_CERT_SHA256__)).catch(() => {});
  }, []);
  return (
    <>
      <div className="check">
        <input type="checkbox" id="secure-screen" role="switch" checked={prefs.secureScreen}
          onChange={(e) => { setPrefs({ secureScreen: e.target.checked }); setSecureScreen(e.target.checked).catch(() => {}); }} />
        <label htmlFor="secure-screen">{UX.secureScreen}</label>
        <InfoButton title={UX.secureScreen}><p>{UX.secureScreenInfo}</p></InfoButton>
      </div>
      {debugSigned && <p className="banner-warn" role="status">{UX.debugSignedWarning}</p>}
    </>
  );
}
