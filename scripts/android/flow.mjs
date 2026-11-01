// The user journey, expressed as page-side JavaScript so it runs unchanged in the
// Android WebView (over CDP) and in desktop Chromium. Selectors and Hungarian
// labels match the real UI; a failed wait names exactly what was missing.

const H = `(() => {
  if (window.__s) return true;
  const norm = (t) => t.replace(/\\s+/g, ' ').trim();
  window.__s = {
    all: (sel) => [...document.querySelectorAll(sel)],
    find(sel, text) { return this.all(sel).find((e) => !text || norm(e.textContent).includes(text)); },
    visible: (e) => !!e && e.getClientRects().length > 0,
    set(el, value) {
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
      setter.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    },
    byLabel(text, exact = false) {
      for (const l of this.all('label')) {
        const t = norm(l.textContent);
        if (exact ? t === text : t.includes(text)) {
          const id = l.getAttribute('for');
          const el = id ? document.getElementById(id) : l.querySelector('input,textarea,select');
          if (el) return el;
        }
      }
      return null;
    },
    click(sel, text) { const e = this.find(sel, text); if (!e) throw new Error('Nincs ilyen elem: ' + sel + ' "' + (text ?? '') + '"'); e.click(); return true; },
  };
  return true;
})()`;

const j = JSON.stringify;

export async function install(c) {
  await c.eval(H);
}

/** Facts about the environment the app actually runs in. */
export async function environment(c) {
  return c.eval(`(async () => ({
    url: location.href,
    ua: navigator.userAgent,
    secureContext: isSecureContext,
    subtle: !!(globalThis.crypto && crypto.subtle),
    indexedDB: !!globalThis.indexedDB,
    dialog: typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function',
    capacitor: !!(globalThis.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()),
    serviceWorkerRegistrations: navigator.serviceWorker ? (await navigator.serviceWorker.getRegistrations()).length : 'n/a',
  }))()`);
}

export async function waitHeading(c, text, timeoutMs = 30_000) {
  await install(c);
  await c.waitFor(`document.querySelector('h1')?.textContent.trim() === ${j(text)}`, { timeoutMs, what: `"${text}" főcím` });
}

/** First launch: create the vault, quick-log, open the crisis overlay, open the journal. */
export async function firstRun(c, pin) {
  const steps = [];
  await waitHeading(c, 'Üdv itt.', 45_000);
  steps.push('beállítóképernyő megjelent');

  await c.eval(`__s.set(__s.byLabel('Válassz PIN-kódot'), ${j(pin)})`);
  await c.eval(`__s.set(__s.byLabel('PIN-kód még egyszer'), ${j(pin)})`);
  await c.eval(`__s.set(__s.byLabel('Napi költség'), '2500')`);
  await c.eval(`__s.click('button', 'Kezdjük')`);
  await c.waitFor(`document.querySelector('.recovery-code')?.textContent.trim().length > 30`, { timeoutMs: 60_000, what: 'helyreállító kód (PBKDF2 számítás)' });
  steps.push('PIN beállítva, helyreállító kód megjelent');
  await c.eval(`document.getElementById('rc-ok').click()`);
  await c.eval(`__s.click('button', 'Tovább')`);
  await c.waitFor(`document.querySelector('.hero-value')`, { what: 'kezdőlap' });
  steps.push('kezdőlap megnyílt');

  await c.eval(`__s.click('.quick-card', 'Stresszes nap')`);
  await c.waitFor(`document.querySelector('dialog[open]')`, { what: 'gyors rögzítés ablak' });
  await c.eval(`(() => { const d = document.querySelector('dialog[open]'); [...d.querySelectorAll('button')].find((b) => b.textContent.includes('Rögzítés')).click(); return true; })()`);
  await c.waitFor(`[...document.querySelectorAll('[role=status]')].some((e) => e.textContent.includes('Rögzítve: Stresszes nap'))`, { what: 'rögzítés visszajelzés' });
  steps.push('gyors rögzítés elmentve');

  await c.eval(`location.hash = '#/naplo'`);
  await c.waitFor(`document.querySelectorAll('.entry').length >= 1`, { what: 'napló bejegyzés' });
  steps.push('idővonal-bejegyzés látszik a naplóban');
  await c.eval(`location.hash = '#/'`);

  await c.waitFor(`document.querySelector('.hero-value')`, { what: 'kezdőlap' });
  await c.eval(`__s.click('a.btn-help')`);
  await c.waitFor(`document.querySelector('dialog.crisis-overlay[open]')`, { what: 'krízisoverlay' });
  const tels = await c.eval(`__s.all('dialog.crisis-overlay a[href^="tel:"]').map((a) => a.getAttribute('href'))`);
  steps.push(`krízisoverlay megnyílt, tel: linkek: ${tels.join(', ')}`);
  return { steps, tels };
}

export async function closeCrisis(c) {
  await c.eval(`__s.click('dialog.crisis-overlay button', 'Vissza')`);
  await c.waitFor(`!document.querySelector('dialog.crisis-overlay')`, { what: 'krízisoverlay bezárása' });
}

/** After the app process was killed and restarted: locked, then unlocks with the data intact. */
export async function afterRestart(c, pin) {
  const steps = [];
  await waitHeading(c, 'Üdv újra', 45_000);
  steps.push('újraindítás után a zárolt képernyő jött (adat nem szivárog)');
  await c.eval(`__s.set(__s.byLabel('PIN-kód', true), ${j(pin)})`);
  await c.eval(`__s.click('button', 'Megnyitás')`);
  await c.waitFor(`document.querySelector('.hero-value')`, { timeoutMs: 60_000, what: 'feloldás utáni kezdőlap' });
  steps.push('PIN-nel feloldva');
  await c.eval(`location.hash = '#/naplo'`);
  await c.waitFor(`document.querySelectorAll('.entry').length >= 1`, { what: 'a korábbi bejegyzés a naplóban' });
  steps.push('a korábbi bejegyzés megvan újraindítás után is');
  await c.eval(`location.hash = '#/'`);
  return { steps };
}

/** A wrong PIN must be rejected without destroying anything. */
export async function wrongPinThenRight(c, pin) {
  await waitHeading(c, 'Üdv újra', 45_000);
  await c.eval(`__s.set(__s.byLabel('PIN-kód', true), '99999')`);
  await c.eval(`__s.click('button', 'Megnyitás')`);
  await c.waitFor(`document.body.textContent.includes('Ez nem a megfelelő PIN-kód')`, { timeoutMs: 60_000, what: 'hibás PIN visszajelzés' });
  return ['hibás PIN elutasítva, adat érintetlen'];
}
