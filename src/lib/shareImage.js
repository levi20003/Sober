// A megosztható kártya képpé alakítása és továbbadása – teljesen helyben, hálózat és új függőség nélkül.
//  1. Kép: az előnézetben látható SVG klónja → (a stílusok attribútumként beégetve) → SVG data-URL → natív Canvas → PNG.
//  2. Megosztás, ebben a sorrendben:
//     Android-app: a saját JszFiles bővítmény (ACTION_SEND, ideiglenes fájl az app gyorsítótárában);
//     böngésző: Web Share API fájllal, ha támogatott; különben a kép letöltése (Blob), és ha az sem megy, a szöveg vágólapra.
// Semmi nem megy szerverre; nincs analitika, nincs külső képszolgáltatás.
import { nativeShell } from './nativeFiles.js';

const STYLE_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity', 'stroke-opacity'];

/** Az osztályokkal (CSS-ből) színezett elemek stílusát attribútumként a klónba írja, hogy a különálló képben is megmaradjon. */
function inlineStyles(source, clone, g) {
  const src = [source, ...source.querySelectorAll('*')];
  const dst = [clone, ...clone.querySelectorAll('*')];
  src.forEach((el, i) => {
    const out = dst[i];
    if (!out || !el.getAttribute('class')) return;
    const cs = g.getComputedStyle?.(el);
    if (!cs) return;
    for (const p of STYLE_PROPS) {
      const v = cs.getPropertyValue(p);
      if (v && !out.hasAttribute(p)) out.setAttribute(p, v);
    }
    out.removeAttribute('class');
  });
  dst.forEach((el) => el.removeAttribute('style'));
}

/** @returns {string} önálló SVG-dokumentum szövege (pontosan az előnézet tartalma) */
export function cardMarkup(svgEl, width, height, g = globalThis) {
  const clone = svgEl.cloneNode(true);
  inlineStyles(svgEl, clone, g);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.removeAttribute('role');
  clone.removeAttribute('aria-label');
  return new g.XMLSerializer().serializeToString(clone);
}

export const svgDataUrl = (markup) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

/** @returns {Promise<{ blob: Blob, base64: string, width: number, height: number }>} */
export async function renderCardPng(svgEl, width, height, g = globalThis) {
  const url = svgDataUrl(cardMarkup(svgEl, width, height, g));
  const img = new g.Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('render'));
    img.src = url;
  });
  const canvas = g.document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/png'));
  return { blob, base64: dataUrl.slice(dataUrl.indexOf(',') + 1), width, height };
}

function download(blob, filename, g) {
  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement('a');
  a.href = url;
  a.download = filename;
  g.document.body.append(a);
  a.click();
  a.remove();
  g.setTimeout(() => g.URL.revokeObjectURL(url), 1000);
}

/** Szöveg a vágólapra. @returns {Promise<boolean>} */
export async function copyText(text, g = globalThis) {
  try {
    if (!g.navigator?.clipboard?.writeText) return false;
    await g.navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Megosztás a fenti sorrendben.
 * @returns {Promise<{ how: 'native'|'webshare'|'download'|'copied'|'cancelled'|'none' }>}
 */
export async function shareCardImage({ png, filename, text }, g = globalThis) {
  const plugin = nativeShell(g);
  if (plugin?.share) {
    const r = await plugin.share({ filename, base64: png.base64, mime: 'image/png', caption: text });
    return { how: r?.shared ? 'native' : 'cancelled' };
  }
  const nav = g.navigator;
  if (nav?.share && g.File) {
    const file = new g.File([png.blob], filename, { type: 'image/png' });
    let ok = false;
    try { ok = !nav.canShare || nav.canShare({ files: [file] }); } catch { ok = false; }
    if (ok) {
      try {
        await nav.share({ files: [file], text });
        return { how: 'webshare' };
      } catch (err) {
        if (err?.name === 'AbortError') return { how: 'cancelled' };
        // Más hiba (pl. a böngésző mégsem engedi): tovább a letöltésre.
      }
    }
  }
  if (g.URL?.createObjectURL) {
    download(png.blob, filename, g);
    return { how: 'download' };
  }
  return (await copyText(text, g)) ? { how: 'copied' } : { how: 'none' };
}

/** Kép mentése: az appban a rendszer „Mentés ide” ablaka, böngészőben letöltés. */
export async function saveCardImage({ png, filename }, g = globalThis) {
  const plugin = nativeShell(g);
  if (plugin?.save) {
    const r = await plugin.save({ filename, base64: png.base64, mime: 'image/png' });
    return { how: r?.saved ? 'saved' : 'cancelled' };
  }
  download(png.blob, filename, g);
  return { how: 'download' };
}
