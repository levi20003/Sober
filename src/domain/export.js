// Plaintext exports (user-initiated, with warning in UI) and JSON import.

import { labelOf } from './presets.js';
import { validateData } from './schema.js';

export const CSV_BOM = '﻿';
const SEP = ';'; // Hungarian Excel uses ';' as list separator (decimal comma locale)

const TYPE_LABELS = { checkin: 'Napi bejelentkezés', trigger: 'Nehéz pillanat', slip: 'Megcsúszás, új szakasz', note: 'Jegyzet' };

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
  const header = ['Dátum', 'Időpont', 'Típus', 'Hangulat', 'Alvás', 'Sóvárgás', 'Kiváltó helyzetek', 'Erősség', 'Megküzdés', 'Kimenet', 'Tanulság', 'Jegyzet'];
  const rows = data.events.map((e) => [
    e.date,
    new Date(e.at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }),
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
  ]);
  return CSV_BOM + [header, ...rows].map((r) => r.map(csvCell).join(SEP)).join('\r\n') + '\r\n';
}

/** Parses a plain JSON export (ours) and returns validated data. Throws on anything else. */
export function parseJsonImport(text) {
  let obj;
  try {
    obj = JSON.parse(String(text).replace(/^﻿/, ''));
  } catch {
    throw new Error('A fájl nem érvényes JSON.');
  }
  if (obj?.app !== 'jozansag-szamlalo' || obj?.kind !== 'plain-export') {
    throw new Error('Ez a fájl nem Józanság-számláló export.');
  }
  return validateData(obj.data);
}
