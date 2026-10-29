// Helpline helpers. Calls use plain `tel:` links: they are handled by the phone's
// dialer, need no internet connection, never touch the service worker, and keep
// working even if JavaScript fails. Nothing about a call is ever recorded.

const TEL_RE = /^\+?\d{3,15}$/;

export const digitsOf = (s) => String(s).replace(/[^\d+]/g, '');

export function telHref(line) {
  if (!TEL_RE.test(line?.tel ?? '')) throw new TypeError(`Invalid tel for helpline ${line?.id}`);
  return `tel:${line.tel}`;
}

/** Guards against the displayed number and the dialled number drifting apart. */
export function displayMatchesTel(line) {
  return digitsOf(line.number) === digitsOf(line.tel);
}

export function splitHelplines(lines) {
  return {
    emergency: lines.filter((l) => l.role === 'emergency'),
    talk: lines.filter((l) => l.role !== 'emergency'),
  };
}

/**
 * Copy fallback for devices that cannot place calls (desktop, tablet).
 * Resolves to 'copied', or 'manual' when the clipboard is unavailable/blocked
 * (insecure context, permissions, old browser) – the UI then selects the text.
 */
export async function copyNumber(line, { clipboard = globalThis.navigator?.clipboard } = {}) {
  try {
    if (!clipboard?.writeText) return 'manual';
    await clipboard.writeText(line.number);
    return 'copied';
  } catch {
    return 'manual';
  }
}
