// Plaintext exports (user-initiated, with warning in UI) and JSON import.

import { labelOf } from './presets.js';
import { MISC } from '../content/index.js';
import { intlTag } from '../i18n/locale.js';
import { safeJsonParse } from '../lib/safeJson.js';
import { validateData } from './schema.js';

export const CSV_BOM = '﻿';
const SEP = ';'; // Hungarian Excel uses ';' as list separator (decimal comma locale)

const TYPE_LABELS = MISC.export.types;

/** Type-specific content of the newer event kinds, in one human-readable cell. */
function details(e) {
  switch (e.type) {
    case 'gratitude': return e.items.join(', ');
    case 'urge': return MISC.export.urge(Math.round(e.seconds / 60), e.outcome === 'passed');
    case 'challenge': return e.challengeId;
    case 'letter': return e.when === 'milestone' ? MISC.export.letterMilestone(e.milestoneDays) : MISC.export.letterHard;
    default: return '';
  }
}

export function toJsonExport(data, now = new Date()) {
  return JSON.stringify({ app: 'jozansag-szamlalo', kind: 'plain-export', exportedAt: now.toISOString(), data }, null, 2);
}

/** Escapes a CSV cell and neutralizes spreadsheet formula injection. */
export function csvCell(value) {
  if (value === undefined || value === null) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsvExport(data) {
  const header = MISC.export.header;
  const rows = data.events.map((e) => [
    e.date,
    new Date(e.at).toLocaleTimeString(intlTag, { hour: '2-digit', minute: '2-digit' }),
    TYPE_LABELS[e.type],
    e.mood && labelOf('mood', e.mood),
    e.sleep && labelOf('sleep', e.sleep),
    e.craving !== undefined ? labelOf('craving', e.craving) : '',
    (e.triggers ?? []).map((t) => labelOf('trigger', t)).join(', '),
    e.intensity,
    (e.coping ?? []).map((c) => labelOf('coping', c)).join(', '),
    e.outcome && labelOf('outcome', e.outcome),
    e.lesson,
    e.note,
    details(e),
  ]);
  return CSV_BOM + [header, ...rows].map((r) => r.map(csvCell).join(SEP)).join('\r\n') + '\r\n';
}

/** Parses a plain JSON export (ours) and returns validated data. Throws on anything else. */
export function parseJsonImport(text) {
  let obj;
  try {
    obj = safeJsonParse(text);
  } catch (err) {
    if (err?.name === 'ImportError') throw err;
    throw new Error('A fájl nem érvényes JSON.');
  }
  if (obj?.app !== 'jozansag-szamlalo' || obj?.kind !== 'plain-export') {
    throw new Error('Ez a fájl nem Józanság-számláló export.');
  }
  return validateData(obj.data);
}
