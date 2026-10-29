import { useEffect, useMemo, useState } from 'react';
import { T } from './content/hu.js';
import { AuthStatus } from './auth/appAuth.js';
import { disableReminders } from './reminders.js';
import { AuthContext, useAuth } from './hooks/useAuth.js';
import { RouterContext, useHashRoute } from './hooks/useHashRoute.js';
import { TimelineProvider } from './hooks/useTimeline.js';
import { useCrisis } from './hooks/useCrisis.js';
import { ToastProvider, useToast } from './hooks/useToast.jsx';
import { Screen } from './components/ui.jsx';
import { CrisisButton } from './components/crisis/CrisisButton.jsx';
import { CrisisOverlay } from './components/crisis/CrisisOverlay.jsx';
import { Onboarding, LockScreen, RecoveryCode } from './components/screens/AuthScreens.jsx';
import { Home } from './components/screens/Home.jsx';
import { CheckinForm, TriggerForm, NoteForm } from './components/screens/LogForms.jsx';
import { Settings } from './components/screens/Settings.jsx';
import { TimelineView } from './components/timeline/TimelineView.jsx';

const NAV = [['#/', T.navHome], ['#/naplo', T.navJournal], ['#/beallitasok', T.navSettings]];

function UnlockedRoutes({ route, onWipe, showRecoveryCode }) {
  switch (route) {
    case '#/naplo': return <TimelineView />;
    case '#/beallitasok': return <Settings onWipe={onWipe} showRecoveryCode={showRecoveryCode} />;
    case '#/rogzites/bejelentkezes': return <CheckinForm />;
    case '#/rogzites/nehez-pillanat': return <TriggerForm />;
    case '#/rogzites/jegyzet': return <NoteForm />;
    default: return <Home />;
  }
}

function Shell() {
  const { auth, state } = useAuth();
  const { base: route, navigate } = useHashRoute();
  const crisis = useCrisis();
  const toast = useToast();
  const [recoveryCode, setRecoveryCode] = useState(null);
  const unlocked = state.status === AuthStatus.UNLOCKED;

  // Auto-lock on inactivity, and immediately on pagehide (back/forward cache).
  useEffect(() => auth.attachLifecycle({ target: window, doc: document }), [auth]);

  // Move focus to the new screen on navigation (screen readers, keyboard users).
  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    scrollTo(0, 0);
  }, [route, state.status]);

  const requestPersistence = () => navigator.storage?.persist?.().catch(() => {});
  const wipe = async () => {
    await disableReminders(auth.store).catch(() => {});
    await auth.resetAll();
    setRecoveryCode(null);
    navigate('#/');
    toast(T.deleted);
  };

  // The crisis overlay reads journal events only if the journal is ALREADY open.
  const crisisEvents = useMemo(
    () => (crisis.isOpen && unlocked ? auth.store.data.events : []),
    [crisis.isOpen, unlocked, auth.store],
  );

  let screen;
  switch (state.status) {
    case AuthStatus.FIRST_TIME_SETUP:
      screen = <Onboarding onCreated={(code) => { setRecoveryCode(code); requestPersistence(); }} onRestored={requestPersistence} />;
      break;
    case AuthStatus.LOCKED:
      screen = <LockScreen onReset={wipe} />;
      break;
    case AuthStatus.UNLOCKED:
      screen = recoveryCode
        ? <RecoveryCode code={recoveryCode} onDone={() => { setRecoveryCode(null); navigate('#/'); }} />
        : (
          <TimelineProvider vault={auth.store}>
            <UnlockedRoutes route={route} onWipe={wipe} showRecoveryCode={setRecoveryCode} />
          </TimelineProvider>
        );
      break;
    default:
      screen = <Screen><p>Betöltés…</p></Screen>;
  }

  const showNav = unlocked && !recoveryCode;
  return (
    <>
      <header className="topbar">
        <span className="brand">{T.appName}</span>
        <div className="topbar-actions">
          {showNav && <button type="button" className="btn-link" onClick={() => auth.lock('manual')}>{T.lockNow}</button>}
          <CrisisButton />
        </div>
      </header>
      {state.status !== AuthStatus.INITIALIZING && !state.persistent && (
        <p className="banner-warn" role="status">{T.storageVolatile}</p>
      )}
      {screen}
      {showNav && (
        <nav className="bottomnav" aria-label="Fő navigáció">
          {NAV.map(([href, label]) => <a key={href} href={href} aria-current={route === href ? 'page' : undefined}>{label}</a>)}
        </nav>
      )}
      {crisis.isOpen && <CrisisOverlay onClose={crisis.close} events={crisisEvents} />}
    </>
  );
}

export function App({ auth, router }) {
  return (
    <AuthContext.Provider value={auth}>
      <RouterContext.Provider value={router}>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </RouterContext.Provider>
    </AuthContext.Provider>
  );
}
