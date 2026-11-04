// Decrypted vault payload schema, validation and migration.
//
// Payload shape (schemaVersion 3):
// {
//   schemaVersion: 3,
//   profile:  {
//     journeyStart: 'YYYY-MM-DD',
//     nickname?: string (1..24), substances?: id[], otherSubstance?: string (1..40),
//     goalDays?: int (1..3650), triggers?: id[], customTriggers?: string[] (1..30 chars, max 10),
//     reasons?: string[] (1..140 chars, max 12), lastCelebration?: int (legnagyobb ünnepelt mérföldkő, nap),
//     companion?: 'potty'|'mira'|'kavics'|'none' (választott kísérő; hiányában Pötty),
//   },
//   settings: {
//     costHistory: [{ from: 'YYYY-MM-DD', dailyCostHuf: int }],  // effective-dated, ascending
//     savingsGoal?: { label: string, amountHuf: int },
//     autoLockMinutes: number,
//   },
//   events:   Event[]          // append-mostly journal, the single source of truth
// }
//
// Event (common): { id, type, date: 'YYYY-MM-DD', at: ISO-8601, note?: string }
//   checkin:   { mood?, intensity?: 1..5, sleep?: 1..5, craving?: 0..3, triggers?: id[] }
//   trigger:   { triggers: id[], intensity?: 1..5, coping: id[], outcome?: id }
//   slip:      { lesson?, intention?, triggers?: id[] } – closes the current phase (lesson) and
//              opens a new one (intention); never deletes history
//   note:      {}
//   urge:      { seconds: 0..86400, outcome: 'passed' | 'still' }       sóvárgás-túlélő
//   challenge: { challengeId: string }                                  napi kis kihívás
//   gratitude: { items: string[1..3] }                                  hálanapló
//   letter:    { note (a levél), when: 'hard' | 'milestone', milestoneDays?: int }

import { isValidDateKey } from './dates.js';
import { LABELS } from './presets.js';

export const SCHEMA_VERSION = 3;
export const MAX_DAILY_COST = 1_000_000;
export const MAX_GOAL = 100_000_000;
export const MAX_COST_ENTRIES = 500;
export const EVENT_TYPES = ['checkin', 'trigger', 'slip', 'note', 'urge', 'challenge', 'gratitude', 'letter'];
export const MAX_NICKNAME = 24;
export const MAX_GOAL_DAYS = 3650;
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

export function createInitialData({ journeyStart, dailyCostHuf = 0, ...profile }) {
  return validateData({
    schemaVersion: SCHEMA_VERSION,
    profile: { journeyStart, ...profile },
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
      const mintensity = cleanInt(e.intensity, 1, 5, 'Erősség');
      if (mintensity !== undefined) base.intensity = mintensity;
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
    case 'urge': {
      base.seconds = cleanInt(e.seconds, 0, 86_400, 'Időtartam', false);
      if (!['passed', 'still'].includes(e.outcome)) fail('Sóvárgás: ismeretlen kimenet');
      base.outcome = e.outcome;
      break;
    }
    case 'challenge': {
      if (typeof e.challengeId !== 'string' || !/^[a-z0-9-]{2,40}$/.test(e.challengeId)) fail('Kihívás: érvénytelen azonosító');
      base.challengeId = e.challengeId;
      break;
    }
    case 'gratitude': {
      base.items = cleanList(e.items, 1, 3, 140, 'Hála');
      break;
    }
    case 'letter': {
      if (!note) fail('Levél: üres levél');
      if (!['hard', 'milestone'].includes(e.when)) fail('Levél: ismeretlen időzítés');
      base.when = e.when;
      const md = cleanInt(e.milestoneDays, 1, MAX_GOAL_DAYS, 'Mérföldkő');
      if (md !== undefined) base.milestoneDays = md;
      break;
    }
  }
  return base;
}

/** List of short trimmed texts; empty entries are dropped. */
function cleanList(v, min, max, maxLen, field) {
  if (!Array.isArray(v)) fail(`${field}: lista szükséges`);
  const out = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
  if (out.length < min || out.length > max) fail(`${field}: ${min}–${max} elem szükséges`);
  for (const x of out) if (x.length > maxLen) fail(`${field}: legfeljebb ${maxLen} karakter`);
  return out;
}

/** Optional profile fields (onboarding answers and personal settings). Unknown keys are dropped. */
export const COMPANION_CHOICES = Object.freeze(['potty', 'mira', 'kavics', 'none']);

export function validateProfile(p) {
  if (!isObj(p) || !isValidDateKey(p.journeyStart)) fail('Profil: érvénytelen kezdődátum');
  const out = { journeyStart: p.journeyStart };

  if (p.nickname !== undefined && p.nickname !== null && String(p.nickname).trim() !== '') {
    if (typeof p.nickname !== 'string') fail('Becenév: szöveg szükséges');
    const n = p.nickname.trim();
    if (n.length > MAX_NICKNAME) fail(`Becenév: legfeljebb ${MAX_NICKNAME} karakter`);
    out.nickname = n;
  }
  if (p.substances !== undefined) {
    const list = cleanIds(p.substances, 'substance', 'Mitől maradnál távol');
    if (list.length) out.substances = list;
  }
  if (p.otherSubstance !== undefined && p.otherSubstance !== null && String(p.otherSubstance).trim() !== '') {
    const t = cleanList([p.otherSubstance], 1, 1, 40, 'Egyéb')[0];
    out.otherSubstance = t;
  }
  // A napló indulásának pontos ideje (csak ha ugyanarra a napra esik, mint a journeyStart; különben elhagyjuk,
  // pl. ha a kezdődátumot később átírták). Az élő számláló használja; a napok számolása ettől független.
  if (typeof p.journeyStartAt === 'string' && !Number.isNaN(Date.parse(p.journeyStartAt))) {
    const at = new Date(p.journeyStartAt);
    const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
    if (key === p.journeyStart) out.journeyStartAt = at.toISOString();
  }
  // Választott kísérő (opcionális; hiányában Pötty). Ismeretlen értéket elhagyunk, a régi mentések így is megnyílnak.
  if (COMPANION_CHOICES.includes(p.companion)) out.companion = p.companion;
  if (p.goalDays !== undefined && p.goalDays !== null) out.goalDays = cleanInt(p.goalDays, 1, MAX_GOAL_DAYS, 'Cél (nap)');
  if (p.triggers !== undefined) {
    const list = cleanIds(p.triggers, 'trigger', 'Nehéz helyzetek');
    if (list.length) out.triggers = list;
  }
  if (p.customTriggers !== undefined) {
    const list = cleanList(p.customTriggers, 0, 10, 30, 'Saját helyzetek');
    if (list.length) out.customTriggers = [...new Set(list)];
  }
  if (p.reasons !== undefined) {
    const list = cleanList(p.reasons, 0, 12, 140, 'Személyes okok');
    if (list.length) out.reasons = list;
  }
  if (p.trustedContact !== undefined && p.trustedContact !== null) {
    const c = p.trustedContact;
    if (!isObj(c)) fail('Megbízható személy: érvénytelen');
    const name = cleanText(c.name, 'Megbízható személy neve');
    const phone = typeof c.phone === 'string' ? c.phone.trim() : '';
    if (!name || name.length > 40) fail('Megbízható személy: a név 1–40 karakter');
    if (!/^\+?[\d ]{3,20}$/.test(phone) || phone.replace(/\D/g, '').length < 3) fail('Megbízható személy: érvénytelen telefonszám');
    out.trustedContact = { name, phone };
  }
  if (p.lastCelebration !== undefined && p.lastCelebration !== null) {
    out.lastCelebration = cleanInt(p.lastCelebration, 0, MAX_GOAL_DAYS, 'Ünnepelt mérföldkő');
  }
  return out;
}

/** Validates and normalizes a payload; returns a fresh object. Throws SchemaError. */
export function validateData(input) {
  const d = migrate(input);
  const profile = validateProfile(d.profile);
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
    if (e.type === 'slip' && e.date < profile.journeyStart) {
      fail('Megcsúszás dátuma nem lehet korábbi, mint az út kezdete');
    }
  }
  events.sort((a, b) => (a.date === b.date ? a.at.localeCompare(b.at) : a.date < b.date ? -1 : 1));

  return {
    schemaVersion: SCHEMA_VERSION,
    profile,
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
  // v2 → v3: új, mind opcionális profilmezők (becenév, cél, helyzetek...) és új eseménytípusok.
  // Semmi nem íródik át, ezért minden meglévő napló változtatás nélkül érvényes marad; a hiányzó
  // mezőket a Beállításokban lehet pótolni.
  2: (d) => ({ ...d, schemaVersion: 3 }),
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
