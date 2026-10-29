// Decrypted vault payload schema, validation and migration.
//
// Payload shape (schemaVersion 2):
// {
//   schemaVersion: 1,
//   profile:  { journeyStart: 'YYYY-MM-DD' },
//   settings: {
//     costHistory: [{ from: 'YYYY-MM-DD', dailyCostHuf: int }],  // effective-dated, ascending
//     savingsGoal?: { label: string, amountHuf: int },
//     autoLockMinutes: number,
//   },
//   events:   Event[]          // append-mostly journal, the single source of truth
// }
//
// Event (common): { id, type, date: 'YYYY-MM-DD', at: ISO-8601, note?: string }
//   checkin: { mood?, sleep?: 1..5, craving?: 0..3, triggers?: id[] }
//   trigger: { triggers: id[], intensity?: 1..5, coping: id[], outcome?: id }
//   slip:    { lesson?, intention?, triggers?: id[] } – closes the current phase (lesson) and
//            opens a new one (intention); never deletes history
//   note:    {}

import { isValidDateKey } from './dates.js';
import { LABELS } from './presets.js';

export const SCHEMA_VERSION = 2;
export const MAX_DAILY_COST = 1_000_000;
export const MAX_GOAL = 100_000_000;
export const MAX_COST_ENTRIES = 500;
export const EVENT_TYPES = ['checkin', 'trigger', 'slip', 'note'];
export const MAX_NOTE_LENGTH = 2000;
export const MAX_EVENTS = 50_000;

export class SchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SchemaError';
  }
}

export function newId() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export function createInitialData({ journeyStart, dailyCostHuf = 0 }) {
  return validateData({
    schemaVersion: SCHEMA_VERSION,
    profile: { journeyStart },
    settings: { costHistory: [{ from: journeyStart, dailyCostHuf }], autoLockMinutes: 5 },
    events: [],
  });
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const fail = (msg) => { throw new SchemaError(msg); };

function cleanText(v, field) {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string') fail(`${field}: szöveg szükséges`);
  const t = v.trim();
  if (t.length > MAX_NOTE_LENGTH) fail(`${field}: legfeljebb ${MAX_NOTE_LENGTH} karakter`);
  return t || undefined;
}

function cleanIds(v, kind, field) {
  if (v === undefined) return [];
  if (!Array.isArray(v)) fail(`${field}: lista szükséges`);
  const out = [...new Set(v)];
  for (const id of out) if (!LABELS[kind].has(id)) fail(`${field}: ismeretlen érték (${id})`);
  return out;
}

function cleanInt(v, min, max, field, optional = true) {
  if (v === undefined || v === null) {
    if (optional) return undefined;
    fail(`${field}: kötelező`);
  }
  if (!Number.isInteger(v) || v < min || v > max) fail(`${field}: ${min} és ${max} közötti egész szám`);
  return v;
}

export function validateEvent(e) {
  if (!isObj(e)) fail('Esemény: objektum szükséges');
  if (typeof e.id !== 'string' || !/^[0-9a-zA-Z_-]{6,64}$/.test(e.id)) fail('Esemény: érvénytelen azonosító');
  if (!EVENT_TYPES.includes(e.type)) fail(`Esemény: ismeretlen típus (${e.type})`);
  if (!isValidDateKey(e.date)) fail('Esemény: érvénytelen dátum');
  if (typeof e.at !== 'string' || Number.isNaN(Date.parse(e.at))) fail('Esemény: érvénytelen időpont');

  const base = { id: e.id, type: e.type, date: e.date, at: e.at };
  const note = cleanText(e.note, 'Jegyzet');
  if (note) base.note = note;

  switch (e.type) {
    case 'checkin': {
      if (e.mood !== undefined && !LABELS.mood.has(e.mood)) fail('Hangulat: ismeretlen érték');
      if (e.mood !== undefined) base.mood = e.mood;
      const sleep = cleanInt(e.sleep, 1, 5, 'Alvás');
      const craving = cleanInt(e.craving, 0, 3, 'Sóvárgás');
      if (sleep !== undefined) base.sleep = sleep;
      if (craving !== undefined) base.craving = craving;
      const triggers = cleanIds(e.triggers, 'trigger', 'Nehezebb helyzetek');
      if (triggers.length) base.triggers = triggers;
      break;
    }
    case 'trigger': {
      base.triggers = cleanIds(e.triggers, 'trigger', 'Kiváltó helyzetek');
      base.coping = cleanIds(e.coping, 'coping', 'Megküzdés');
      const intensity = cleanInt(e.intensity, 1, 5, 'Erősség');
      if (intensity !== undefined) base.intensity = intensity;
      if (e.outcome !== undefined) {
        if (!LABELS.outcome.has(e.outcome)) fail('Kimenet: ismeretlen érték');
        base.outcome = e.outcome;
      }
      break;
    }
    case 'slip': {
      const lesson = cleanText(e.lesson, 'Tanulság');
      if (lesson) base.lesson = lesson;
      const intention = cleanText(e.intention, 'Szándék');
      if (intention) base.intention = intention;
      const triggers = cleanIds(e.triggers, 'trigger', 'Kiváltó helyzetek');
      if (triggers.length) base.triggers = triggers;
      break;
    }
    case 'note':
      if (!note) fail('Jegyzet: üres bejegyzés');
      break;
  }
  return base;
}

/** Validates and normalizes a payload; returns a fresh object. Throws SchemaError. */
export function validateData(input) {
  const d = migrate(input);
  if (!isObj(d.profile) || !isValidDateKey(d.profile.journeyStart)) fail('Profil: érvénytelen kezdődátum');
  if (!isObj(d.settings)) fail('Beállítások hiányoznak');
  const costHistory = validateCostHistory(d.settings.costHistory);
  const savingsGoal = validateGoal(d.settings.savingsGoal);
  const autoLock = cleanInt(d.settings.autoLockMinutes ?? 5, 1, 120, 'Automatikus zárolás', false);
  if (!Array.isArray(d.events)) fail('Események: lista szükséges');
  if (d.events.length > MAX_EVENTS) fail('Túl sok esemény');

  const seen = new Set();
  const events = d.events.map((e) => {
    const v = validateEvent(e);
    if (seen.has(v.id)) fail('Esemény: duplikált azonosító');
    seen.add(v.id);
    return v;
  });
  for (const e of events) {
    if (e.type === 'slip' && e.date < d.profile.journeyStart) {
      fail('Megcsúszás dátuma nem lehet korábbi, mint az út kezdete');
    }
  }
  events.sort((a, b) => (a.date === b.date ? a.at.localeCompare(b.at) : a.date < b.date ? -1 : 1));

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { journeyStart: d.profile.journeyStart },
    settings: { costHistory, ...(savingsGoal ? { savingsGoal } : {}), autoLockMinutes: autoLock },
    events,
  };
}

function isValidCost(v) {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_DAILY_COST;
}

/** Effective-dated daily cost: non-empty, strictly ascending `from`, integer HUF. */
export function validateCostHistory(h) {
  if (!Array.isArray(h) || h.length === 0 || h.length > MAX_COST_ENTRIES) fail('Napi költség: érvénytelen előzmény');
  return h.map((e, i) => {
    if (!isObj(e) || !isValidDateKey(e.from)) fail('Napi költség: érvénytelen dátum');
    if (!isValidCost(e.dailyCostHuf)) fail(`Napi költség: 0 és ${MAX_DAILY_COST.toLocaleString('hu-HU')} Ft közötti egész szám`);
    if (i > 0 && e.from <= h[i - 1].from) fail('Napi költség: a dátumoknak növekvő sorrendben kell lenniük');
    return { from: e.from, dailyCostHuf: e.dailyCostHuf };
  });
}

function validateGoal(g) {
  if (g === undefined || g === null) return undefined;
  if (!isObj(g)) fail('Megtakarítási cél: érvénytelen');
  const label = cleanText(g.label, 'Cél neve');
  if (!label || label.length > 60) fail('Megtakarítási cél: a név 1–60 karakter');
  if (!Number.isInteger(g.amountHuf) || g.amountHuf < 1 || g.amountHuf > MAX_GOAL) fail('Megtakarítási cél: érvénytelen összeg');
  return { label, amountHuf: g.amountHuf };
}

/**
 * Upgrades older payloads step by step. Add one step per version; never edit a
 * shipped step (old backups must keep migrating identically).
 */
const MIGRATIONS = {
  // v1 → v2: single dailyCostHuf → effective-dated costHistory starting at journeyStart.
  // Preserves every past savings figure exactly (one segment, same cost for all days).
  1: (d) => {
    const { dailyCostHuf, ...rest } = isObj(d.settings) ? d.settings : {};
    const cost = typeof dailyCostHuf === 'number' && Number.isFinite(dailyCostHuf) ? Math.round(dailyCostHuf) : dailyCostHuf;
    return {
      ...d,
      schemaVersion: 2,
      settings: { ...rest, costHistory: [{ from: d.profile?.journeyStart, dailyCostHuf: cost ?? 0 }] },
    };
  },
};

export function migrate(input) {
  if (!isObj(input)) fail('Az adat nem objektum');
  let d = input;
  if (typeof d.schemaVersion === 'number' && d.schemaVersion > SCHEMA_VERSION) {
    fail('Az adatot az alkalmazás újabb verziója hozta létre. Kérlek, frissítsd az alkalmazást.');
  }
  while (d.schemaVersion !== SCHEMA_VERSION) {
    const step = MIGRATIONS[d.schemaVersion];
    if (!step) fail('Ismeretlen adatverzió');
    d = step(d);
  }
  return d;
}
