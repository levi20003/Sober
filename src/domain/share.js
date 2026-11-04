// Megosztható kártya – adatmodell. Adatvédelem a felépítésből: a modell kizárólag a napok számát, a választott
// semleges üzenet azonosítóját, és CSAK a felhasználó kifejezett választására a következő mérföldkövet és a kísérőt
// tartalmazza. Név, becenév, szer, kezdődátum, napló, hangulat, sóvárgás, pénz és krízisadat nem is jut el ide.
import { MILESTONE_DAYS } from './milestones.js';

export const SHARE_LAYOUTS = ['minimal', 'illustrated'];
export const SHARE_THEMES = ['light', 'dark'];
export const SHARE_SHAPES = { milestone: ['square', 'portrait'], widget: ['wide', 'square'] };
export const SHARE_MESSAGES = ['step', 'counts', 'pace'];
export const CARD_SIZE = { square: [1080, 1080], portrait: [1080, 1350], wide: [1200, 600] };

/** A kártya színei (WCAG 2.1 AA: szöveg ≥ 4.5:1 a háttér mindkét végén; tests/share.test.js ellenőrzi). */
export const CARD_THEMES = {
  light: { bg: '#fbf7f2', bg2: '#efe6ff', text: '#1f1a2e', muted: '#574f6b', accent: '#6b3fe0', warm: '#ffc53d', soft: '#e3d6ff', ink: '#2b2540' },
  dark: { bg: '#14111f', bg2: '#262040', text: '#efebf8', muted: '#b6aecb', accent: '#b49bff', warm: '#ffc53d', soft: '#3a3060', ink: '#2b2540' },
};

/**
 * @param {{ days: number, companion?: string }} input  csak ennyi jöhet be
 * @param {{ message?: string, includeNext?: boolean, includeCompanion?: boolean }} choices  a felhasználó választásai
 */
export function shareModel({ days, companion } = {}, choices = {}) {
  const d = Math.max(0, Math.floor(Number(days) || 0));
  const next = MILESTONE_DAYS.find((m) => m > d) ?? null;
  return {
    days: d,
    message: SHARE_MESSAGES.includes(choices.message) ? choices.message : 'step',
    ...(choices.includeNext === true && next ? { next } : {}),
    ...(choices.includeCompanion === true && companion && companion !== 'none' ? { companion } : {}),
  };
}

/** Rövid, másolható szöveg ugyanabból a modellből. */
export const shareText = (model, S) => S.text(model.days, S.messages[model.message], model.next ?? null);

/** Haladás a következő mérföldkő felé (0..1) a widget gyűrűjéhez; csak ha a felhasználó kérte a következőt. */
export function progressToNext(model) {
  if (!model.next) return null;
  const prev = [0, ...MILESTONE_DAYS].filter((m) => m <= model.days).pop();
  return Math.min(1, Math.max(0, (model.days - prev) / (model.next - prev)));
}
