// Megosztás lap: előbb mindig az előnézet és a választható beállítások, a kép csak a „Megosztom ezt a képet”
// (vagy „Kép mentése”) gombra készül el és megy tovább. Alapból csak a napok száma és egy semleges üzenet látszik;
// a következő mérföldkő és a kísérő csak kifejezett bekapcsolásra kerül rá.
import { useRef, useState } from 'react';
import { COMPANIONS, SHARE as S } from '../../content/index.js';
import { CARD_SIZE, SHARE_LAYOUTS, SHARE_MESSAGES, SHARE_SHAPES, SHARE_THEMES, shareModel, shareText } from '../../domain/share.js';
import { copyText, renderCardPng, saveCardImage, shareCardImage } from '../../lib/shareImage.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { Sheet } from '../Info.jsx';
import { ShareCard } from './ShareCard.jsx';

const systemDark = () => { try { return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches === true; } catch { return false; } };

function Choice({ legend, name, options, labels, value, onChange }) {
  return (
    <fieldset className="chips"><legend>{legend}</legend><div className="chip-row">
      {options.map((id) => (
        <label className="chip" key={id}><input type="radio" name={name} value={id} checked={value === id} onChange={() => onChange(id)} /><span>{labels[id]}</span></label>
      ))}
    </div></fieldset>
  );
}

/**
 * @param {{ days: number, companion?: string, variant?: 'milestone'|'widget', onClose: () => void, g?: object }} props
 *   days és companion: az egyetlen adat, amit a lap a naplóból kap.
 */
export function ShareSheet({ days, companion = 'none', variant = 'milestone', onClose, g = globalThis }) {
  const [prefs] = usePrefs();
  const [layout, setLayout] = useState('minimal');
  const [theme, setTheme] = useState(prefs.theme === 'dark' || (prefs.theme === 'system' && systemDark()) ? 'dark' : 'light');
  const [shape, setShape] = useState(SHARE_SHAPES[variant][0]);
  const [message, setMessage] = useState('step');
  const [includeNext, setIncludeNext] = useState(false);
  const [includeCompanion, setIncludeCompanion] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const card = useRef(null);
  const hasCompanion = companion && companion !== 'none' && COMPANIONS[companion];

  const model = shareModel({ days, companion: hasCompanion ? companion : undefined }, { message, includeNext, includeCompanion: includeCompanion && layout === 'illustrated' });
  const text = shareText(model, S);
  const filename = S.file(model.days);

  const run = async (fn) => {
    if (busy || !card.current) return;
    setBusy(true);
    setStatus(S.busy);
    try {
      const [w, h] = CARD_SIZE[shape];
      const png = await renderCardPng(card.current, w, h, g);
      setStatus(await fn(png));
    } catch {
      setStatus(S.error);
    } finally {
      setBusy(false);
    }
  };
  const share = () => run(async (png) => {
    const r = await shareCardImage({ png, filename, text }, g);
    return { native: S.shared, webshare: S.shared, download: S.fallback, copied: S.copied, cancelled: '', none: S.error }[r.how] ?? '';
  });
  const save = () => run(async (png) => {
    const r = await saveCardImage({ png, filename }, g);
    return { saved: S.saved, download: S.downloaded, cancelled: '' }[r.how] ?? '';
  });
  const copy = async () => setStatus((await copyText(text, g)) ? S.copied : `${S.copyUnsupported}${text}`);

  return (
    <Sheet title={variant === 'widget' ? S.widgetTitle : S.title} onClose={onClose}
      actions={<button type="button" className="btn btn-primary" onClick={share} disabled={busy}>{S.confirm}</button>}>
      <figure className={`share-preview share-${shape}`}>
        <figcaption className="stat-label">{S.preview}</figcaption>
        <ShareCard ref={card} model={model} variant={variant} layout={layout} theme={theme} shape={shape} S={S} label={S.previewAlt(model.days)} />
      </figure>
      <p className="hint">{S.privacy}</p>
      <Choice legend={S.layout} name="share-layout" options={SHARE_LAYOUTS} labels={S.layouts} value={layout} onChange={setLayout} />
      <Choice legend={S.theme} name="share-theme" options={SHARE_THEMES} labels={S.themes} value={theme} onChange={setTheme} />
      <Choice legend={S.shape} name="share-shape" options={SHARE_SHAPES[variant]} labels={S.shapes} value={shape} onChange={setShape} />
      <Choice legend={S.message} name="share-message" options={SHARE_MESSAGES} labels={S.messages} value={message} onChange={setMessage} />
      <fieldset className="chips stack"><legend>{S.extras}</legend>
        <div className="check">
          <input type="checkbox" id="share-next" checked={includeNext} onChange={(e) => setIncludeNext(e.target.checked)} />
          <label htmlFor="share-next">{S.includeNext}</label>
        </div>
        {hasCompanion && layout === 'illustrated' && (
          <div className="check">
            <input type="checkbox" id="share-companion" checked={includeCompanion} onChange={(e) => setIncludeCompanion(e.target.checked)} />
            <label htmlFor="share-companion">{S.includeCompanion(COMPANIONS[companion].name)}</label>
          </div>
        )}
      </fieldset>
      <div className="actions">
        <button type="button" className="btn" onClick={save} disabled={busy}>{S.save}</button>
        <button type="button" className="btn btn-ghost" onClick={copy}>{S.copy}</button>
      </div>
      <p className="hint" role="status" aria-live="polite">{status}</p>
    </Sheet>
  );
}
