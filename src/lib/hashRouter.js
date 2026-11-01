// Minimal hash router as an external store. Tracks the last non-crisis route so
// the crisis overlay can sit ON TOP of the current screen (its state is kept)
// and closing it returns exactly there.
//
// Fülek (alsó navigáció) előzményszabálya, hogy az Android "vissza" gomb természetes legyen:
//   Főoldal → másik fül: új előzményelem (push)
//   másik fül → másik fül: csere (replace), így a vissza egyetlen lépés a főoldalra
//   másik fül → Főoldal: vissza a főoldalra (history.back), ha onnan érkeztünk
//   Főoldalról a vissza gomb kilép az alkalmazásból.

export const CRISIS_HASH = '#/segitseg';
export const HOME_HASH = '#/';
export const TAB_HASHES = ['#/', '#/idovonal', '#/megtakaritas', '#/eszkozok', '#/beallitasok'];

/** Melyik fülhöz tartozik egy útvonal (az almenük a szülő fülhöz). */
export function tabOf(hash) {
  const h = hash || HOME_HASH;
  for (const t of TAB_HASHES.slice(1)) if (h === t || h.startsWith(`${t}/`)) return t;
  return HOME_HASH;
}

export function createHashRouter(win = globalThis.window) {
  const listeners = new Set();
  const read = () => win.location.hash || HOME_HASH;
  let hash = read();
  let base = hash === CRISIS_HASH ? HOME_HASH : hash;
  let openedInApp = false; // true when the crisis overlay was opened by navigating within this page
  let pushedFromHome = false; // a tab entry was pushed on top of the home entry (so "back" returns home)
  let snapshot = { hash, base };

  const onChange = (force = false) => {
    const next = read();
    if (next === hash && !force) return;
    if (next === CRISIS_HASH && hash !== CRISIS_HASH) openedInApp = true;
    if (next !== CRISIS_HASH) { base = next; openedInApp = false; }
    if (next === HOME_HASH) pushedFromHome = false;
    hash = next;
    snapshot = { hash, base };
    for (const fn of listeners) fn();
  };
  const onHashChange = () => onChange();
  win.addEventListener('hashchange', onHashChange);

  // Hideg indítás egy másik fülön (pl. a közvetlen hivatkozás): alá teszünk egy főoldal-bejegyzést, hogy a vissza gomb a főoldalra vigyen.
  if (hash !== CRISIS_HASH && tabOf(hash) !== HOME_HASH) {
    const target = hash;
    win.history.replaceState(null, '', `${win.location.pathname}${win.location.search}${HOME_HASH}`);
    win.location.hash = target;
    pushedFromHome = true;
    hash = read();
    base = hash;
    snapshot = { hash, base };
  }

  const api = {
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Új előzményelem. Szinkron: az értesítés azonnal megtörténik (a nézetátmenethez ez kell). */
    navigate(to) {
      if (read() === to) { onChange(true); return; }
      win.location.hash = to;
      onChange();
    },
    /** Csere az előzményben (nem ad új "vissza" lépést). */
    replace(to) {
      if (read() !== to) win.location.replace(`${win.location.pathname}${win.location.search}${to}`);
      onChange();
    },
    /** Fülváltás az előzményszabály szerint. */
    goTab(to) {
      const cur = tabOf(read());
      if (tabOf(to) === cur && read() === to) { onChange(true); return; }
      if (to === HOME_HASH) {
        if (pushedFromHome && read() !== HOME_HASH) { pushedFromHome = false; win.history.back(); return; }
        api.replace(HOME_HASH);
      } else if (cur === HOME_HASH && read() === HOME_HASH) {
        pushedFromHome = true;
        api.navigate(to);
      } else {
        api.replace(to);
      }
    },
    /** Leave the crisis overlay: back to where the user was, or home after a deep link. */
    closeCrisis() {
      if (openedInApp) win.history.back();
      else win.location.replace(`${win.location.pathname}${win.location.search}${base}`);
    },
    destroy: () => win.removeEventListener('hashchange', onHashChange),
  };
  return api;
}
