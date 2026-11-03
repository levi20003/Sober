import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HOME, MISC, NAV_TABS, ONB, TOOLS, UPDATE, UX, T } from './content/index.js';
import { AuthStatus } from './auth/appAuth.js';
import { disableReminders } from './reminders.js';
import { formatDayHu } from './domain/greeting.js';
import { moodOnDay, figureOf } from './domain/moods.js';
import { tabOf } from './lib/hashRouter.js';
import { AuthContext, useAuth } from './hooks/useAuth.js';
import { RouterContext, useHashRoute } from './hooks/useHashRoute.js';
import { TimelineProvider, useTimeline } from './hooks/useTimeline.js';
import { UpdateContext, useUpdate } from './hooks/useUpdate.js';
import { useCrisis } from './hooks/useCrisis.js';
import { ToastProvider, useToast } from './hooks/useToast.jsx';
import { CrisisButton, DialogHelp } from './components/crisis/CrisisButton.jsx';
import { CrisisOverlay } from './components/crisis/CrisisOverlay.jsx';
import { LockScreen } from './components/screens/AuthScreens.jsx';
import { Onboarding } from './components/onboarding/Onboarding.jsx';
import { Home } from './components/screens/Home.jsx';
import { CheckinForm, TriggerForm, NoteForm } from './components/screens/LogForms.jsx';
import { Settings } from './components/screens/Settings.jsx';
import { TimelinePage } from './components/screens/TimelinePage.jsx';
import { SavingsPage } from './components/screens/SavingsPage.jsx';
import { ToolsRoute } from './components/screens/ToolsPage.jsx';
import { AppBar } from './components/shell/AppBar.jsx';
import { TabBar } from './components/shell/TabBar.jsx';
import { QuickAddSheet } from './components/shell/QuickAddSheet.jsx';
import { FreshStartModal } from './components/timeline/FreshStartModal.jsx';
import { PreviewNotice } from './components/home/Notices.jsx';
import { isNativeShell } from './lib/platform.js';
import { ApkUpdateStatus, apkBusy } from './components/ApkUpdateStatus.jsx';
import { RecoveryCodeCard } from './components/RecoveryCodeCard.jsx';
import { ThemeToggle } from './components/ThemeToggle.jsx';

const SUBTITLES = { '#/eszkozok/hullam': TOOLS.urgeTitle, '#/eszkozok/hala': TOOLS.gratitudeTitle, '#/eszkozok/level': TOOLS.letterTitle, '#/eszkozok/okok': TOOLS.reasonsTitle,
  '#/rogzites/bejelentkezes': T.actionCheckin, '#/rogzites/nehez-pillanat': T.triggerTitle, '#/rogzites/jegyzet': T.noteTitle };

function pageTitle(route) {
  if (SUBTITLES[route]) return SUBTITLES[route];
  return NAV_TABS.find((t) => t.hash === tabOf(route))?.title ?? T.appName;
}

/** Az oldal tartalma az útvonal szerint. Csak feloldott (UNLOCKED) állapotban jön létre. */
function Routes({ route, onWipe, showRecoveryCode }) {
  const tab = tabOf(route);
  if (route.startsWith('#/rogzites/')) {
    if (route === '#/rogzites/bejelentkezes') return <CheckinForm />;
    if (route === '#/rogzites/nehez-pillanat') return <TriggerForm />;
    if (route === '#/rogzites/jegyzet') return <NoteForm />;
  }
  switch (tab) {
    case '#/idovonal': return <TimelinePage />;
    case '#/megtakaritas': return <SavingsPage />;
    case '#/eszkozok': return <ToolsRoute hash={route} />;
    case '#/beallitasok': return <Settings onWipe={onWipe} showRecoveryCode={showRecoveryCode} />;
    default: return <Home />;
  }
}

/** Minden oldalon látszik, amint új verzió van kész (a háttérben futó keresés találata). */
function UpdateBanner() {
  const update = useUpdate();
  const native = update?.native;
  if (!update?.ready && !(native && ['downloading', 'installing', 'permission', 'error'].includes(update?.status))) return null;
  if (native && update.status === 'error' && update.errorCode === 'NOT_NEWER') return null;
  return (
    <div className="update-banner" role="status" style={{ maxWidth: 528, margin: '8px auto' }}>
      <div className="stack" style={{ flex: 1 }}>
        <span>{native ? UPDATE.apkBanner : UPDATE.banner}</span>
        {native && <ApkUpdateStatus update={update} />}
      </div>
      <button type="button" className="btn btn-primary" onClick={update.apply} disabled={native && apkBusy(update)}>
        {native ? (update.status === 'error' ? UPDATE.apkRetry : UPDATE.apkApply) : UPDATE.apply}
      </button>
    </div>
  );
}

function UnlockedApp({ onWipe, showRecoveryCode }) {
  const { auth } = useAuth();
  const { base: route, navigate, goTab } = useHashRoute();
  const { snapshot } = useTimeline();
  const [sheet, setSheet] = useState(false);
  const [fresh, setFresh] = useState(false);
  const scrollY = useRef(new Map());
  const current = useRef(route);

  // Fülenként megőrzött görgetési pozíció.
  useEffect(() => {
    const on = () => scrollY.current.set(current.current, window.scrollY);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useLayoutEffect(() => {
    current.current = route;
    const isTab = tabOf(route) === route;
    window.scrollTo(0, isTab ? (scrollY.current.get(route) ?? 0) : 0);
  }, [route]);

  const { data, today } = snapshot;
  const nick = data.profile.nickname;
  const m = moodOnDay(data.events, today);
  const isHome = route === '#/';
  return (
    <>
      <AppBar title={isHome ? HOME.appbarHello(nick) : pageTitle(route)} subtitle={isHome ? formatDayHu(new Date()) : undefined}
        mood={m ? figureOf(m.mood)?.id : null} onAvatar={() => goTab('#/beallitasok')} />
      <UpdateBanner />
      <div key={route} className="route">
        <Routes route={route} onWipe={onWipe} showRecoveryCode={showRecoveryCode} />
      </div>
      <TabBar route={route} goTab={goTab} onPlus={() => setSheet(true)} />
      {sheet && <QuickAddSheet onClose={() => setSheet(false)} onPick={(h) => { setSheet(false); navigate(h); }} onSlip={() => { setSheet(false); setFresh(true); }} />}
      {fresh && <FreshStartModal onClose={() => setFresh(false)} />}
    </>
  );
}

function Shell() {
  const { auth, state } = useAuth();
  const { base: route, navigate, replace } = useHashRoute();
  const crisis = useCrisis();
  const toast = useToast();
  const update = useUpdate();
  const [onbOpen, setOnbOpen] = useState(false);
  const unlocked = state.status === AuthStatus.UNLOCKED;

  // A bevezető addig marad nyitva, amíg a 10. lépésen a "Irány a főoldal" gombot meg nem nyomják (a tároló már a 8. lépés után létrejön).
  useEffect(() => { if (state.status === AuthStatus.FIRST_TIME_SETUP) setOnbOpen(true); }, [state.status]);
  const finishOnboarding = () => { setOnbOpen(false); replace('#/'); };

  // Memória-tárolónál (pl. privát mód) a lap bezárása előtt a böngésző rákérdez: semmi sem mentődött el (audit 1.3).
  useEffect(() => {
    if (state.persistent || !unlocked) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [state.persistent, unlocked]);

  // Zároláskor ne maradjon kint értesítés naplóból származó szöveggel (F13).
  useEffect(() => { if (state.status === AuthStatus.LOCKED) toast.clear?.(); }, [state.status, toast]);

  // Auto-lock on inactivity, and immediately on pagehide (back/forward cache).
  useEffect(() => auth.attachLifecycle({ target: window, doc: document, native: isNativeShell() }), [auth]);

  // Automatikus frissítés: zárolt képernyőn (nincs elveszíthető félkész munka) azonnal, egyébként a felhasználó kérésére.
  useEffect(() => {
    // Csak a webes változat (service worker) frissül magától zárolt képernyőn; az APK-t a felhasználó indítja.
    if (update.ready && !update.native && state.status === AuthStatus.LOCKED && !onbOpen) update.apply();
  }, [update.ready, state.status, onbOpen]);
  const toasted = useRef(false);
  useEffect(() => { if (update.ready && !update.native && unlocked && !toasted.current) { toasted.current = true; toast(UPDATE.toast); } }, [update.ready, update.native, unlocked, toast]);

  const wipe = async () => {
    await disableReminders(auth.store).catch(() => {});
    await auth.resetAll();
    setRecoveryCode(null);
    navigate('#/');
    toast(T.deleted);
  };
  const [recoveryCode, setRecoveryCode] = useState(null);

  // The crisis overlay reads journal events only if the journal is ALREADY open.
  const crisisEvents = useMemo(() => (crisis.isOpen && unlocked ? auth.store.data.events : []), [crisis.isOpen, unlocked, auth.store]);
  const crisisTrusted = useMemo(() => (crisis.isOpen && unlocked ? auth.store.data.profile.trustedContact ?? null : null), [crisis.isOpen, unlocked, auth.store]);
  const crisisReasons = useMemo(() => (crisis.isOpen && unlocked ? auth.store.data.profile.reasons ?? [] : []), [crisis.isOpen, unlocked, auth.store]);

  let screen;
  if (onbOpen || state.status === AuthStatus.FIRST_TIME_SETUP) {
    screen = <Onboarding onFinish={finishOnboarding} />;
  } else if (state.status === AuthStatus.STORAGE_ERROR) {
    screen = (
      <><header className="topbar"><span className="brand">{T.appName}</span><div className="topbar-actions"><ThemeToggle /><CrisisButton /></div></header>
        <main className="screen screen-plain lock" id="main" tabIndex={-1}>
          <h1>{UX.storageErrorTitle}</h1>
          <p className="lead">{UX.storageErrorText}</p>
          <button type="button" className="btn btn-primary btn-big" onClick={() => location.reload()}>{UX.retry}</button>
        </main></>
    );
  } else if (state.status === AuthStatus.LOCKED) {
    screen = <><header className="topbar"><span className="brand">{T.appName}</span><div className="topbar-actions"><ThemeToggle /><CrisisButton /></div></header><LockScreen onReset={wipe} /></>;
  } else if (unlocked) {
    screen = (
      <TimelineProvider vault={auth.store}>
        <UnlockedApp onWipe={wipe} showRecoveryCode={setRecoveryCode} />
        {recoveryCode && <RecoveryOverlay code={recoveryCode} onDone={() => setRecoveryCode(null)} />}
      </TimelineProvider>
    );
  } else {
    screen = <><header className="topbar"><span className="brand">{T.appName}</span><div className="topbar-actions"><ThemeToggle /><CrisisButton /></div></header><main className="screen screen-plain" id="main" tabIndex={-1}><p>{MISC.loading}</p></main></>;
  }

  return (
    <>
      {state.status !== AuthStatus.INITIALIZING && !state.persistent && (
        <p className="banner-warn" role="status">{T.storageVolatile} {unlocked && <a href="#/beallitasok">{T.exportEncrypted}</a>}</p>
      )}
      {screen}
      {crisis.isOpen && <CrisisOverlay onClose={crisis.close} events={crisisEvents} reasons={crisisReasons} trusted={crisisTrusted} />}
      {state.status !== AuthStatus.INITIALIZING && !crisis.isOpen && <PreviewNotice />}
    </>
  );
}

/** Új helyreállító kód (Beállítások → "Új helyreállító kód"): teljes képernyős, egyszeri megjelenítés. */
export function RecoveryOverlay({ code, onDone }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="rc-h" style={{ background: 'var(--bg)' }}>
      <DialogHelp />
      <h2 id="rc-h">{T.recoveryTitle}</h2>
      <p>{T.recoveryIntro}</p>
      <RecoveryCodeCard code={code} />
      <div className="check check-card">
        <input type="checkbox" id="rc2-ok" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        <label htmlFor="rc2-ok">{T.recoveryConfirm}</label>
      </div>
      <button type="button" className="btn btn-primary btn-big" disabled={!ok} onClick={onDone}>{ONB.next}</button>
    </div>
  );
}

export function App({ auth, router, updates }) {
  return (
    <AuthContext.Provider value={auth}>
      <RouterContext.Provider value={router}>
        <UpdateContext.Provider value={updates ?? null}>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </UpdateContext.Provider>
      </RouterContext.Provider>
    </AuthContext.Provider>
  );
}
