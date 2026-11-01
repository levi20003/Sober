// Fájlok mentése és megosztása, futásidejű npm-függőség nélkül.
//  - Android-app: a saját natív bővítményünk (android/.../JszFilesPlugin.java, a Capacitor hídon át):
//      save  → a rendszer „Mentés ide” ablaka (Storage Access Framework, ACTION_CREATE_DOCUMENT): a felhasználó
//              választja ki a helyet (Letöltések, Drive, pendrive...). Nem kell tárhely-engedély.
//      share → megosztás (ACTION_SEND) egy ideiglenes fájllal az app saját gyorsítótárából.
//  - Böngésző: letöltés; megosztás a Web Share API-val, ha a böngésző fájlt is tud megosztani.
// A mentés soha nem kerül a vágólapra (azt más alkalmazások is olvashatják).

/** Elfogadott típusok az importáló fájlválasztóban: sok fájlkezelő a letöltött JSON-t octet-streamként adja. */
export const BACKUP_ACCEPT = '.json,application/json,application/octet-stream,text/plain';

export function nativeShell(g = globalThis) {
  try {
    return g.Capacitor?.isNativePlatform?.() ? g.Capacitor.Plugins?.JszFiles ?? null : null;
  } catch {
    return null;
  }
}

function browserDownload({ filename, text, mime }, g) {
  const url = g.URL.createObjectURL(new g.Blob([text], { type: mime }));
  const a = g.document.createElement('a');
  a.href = url;
  a.download = filename;
  g.document.body.append(a);
  a.click();
  a.remove();
  g.setTimeout(() => g.URL.revokeObjectURL(url), 1000);
}

/**
 * @returns {Promise<{where: 'device'|'download'|'cancelled', name?: string}>}
 *   device: az Android-app a felhasználó által választott helyre mentette (name: a fájl neve ott)
 */
export async function saveTextFile({ filename, text, mime }, g = globalThis) {
  const plugin = nativeShell(g);
  if (plugin?.save) {
    const r = await plugin.save({ filename, text, mime });
    return r?.saved ? { where: 'device', name: r.name ?? filename } : { where: 'cancelled' };
  }
  browserDownload({ filename, text, mime }, g);
  return { where: 'download', name: filename };
}

/** @returns {Promise<{shared: boolean, unsupported?: boolean}>} */
export async function shareTextFile({ filename, text, mime }, g = globalThis) {
  const plugin = nativeShell(g);
  if (plugin?.share) {
    const r = await plugin.share({ filename, text, mime });
    return { shared: !!r?.shared };
  }
  const nav = g.navigator;
  if (nav?.share && g.File) {
    const file = new g.File([text], filename, { type: mime });
    if (!nav.canShare || nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        return { shared: true };
      } catch (err) {
        if (err?.name === 'AbortError') return { shared: false };
        throw err;
      }
    }
  }
  return { shared: false, unsupported: true };
}

/** Megosztás lehetséges-e (a gomb csak ekkor jelenik meg). */
export function canShareFiles(g = globalThis) {
  if (nativeShell(g)?.share) return true;
  try {
    return !!(g.navigator?.canShare && g.File && g.navigator.canShare({ files: [new g.File(['x'], 'x.json', { type: 'application/json' })] }));
  } catch {
    return false;
  }
}

/** Képernyőkép- és feladatváltó-előnézet-védelem (FLAG_SECURE) az Android-appban. Böngészőben nincs hatása. */
export async function setSecureScreen(on, g = globalThis) {
  const plugin = nativeShell(g);
  if (plugin?.setSecure) await plugin.setSecure({ on: !!on });
  return !!plugin?.setSecure;
}

/** Az APK aláíró tanúsítványának SHA-256 lenyomata (ha az app natív héjban fut), különben null. */
export async function signingFingerprint(g = globalThis) {
  const plugin = nativeShell(g);
  if (!plugin?.signingInfo) return null;
  try {
    return (await plugin.signingInfo())?.sha256 ?? null;
  } catch {
    return null;
  }
}
