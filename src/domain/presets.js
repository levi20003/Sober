// Preset options for low-friction logging. IDs are stable and stored in the
// vault; labels can be revised (e.g. after clinical review) without migration.

// A 12 hangulatfigura (src/components/mood/MoodFigures.jsx). Az azonosítók ASCII-k, a címkék
// magyarul. A színt a CSS adja (--mood-<id>), a számértékek a src/domain/moods.js-ben vannak.
export const MOODS = [
  { id: 'excited', label: 'Izgatott' },
  { id: 'cheerful', label: 'Vidám' },
  { id: 'grateful', label: 'Hálás' },
  { id: 'energetic', label: 'Energikus' },
  { id: 'sensitive', label: 'Érzékeny' },
  { id: 'confused', label: 'Zavarodott' },
  { id: 'bored', label: 'Unatkozó' },
  { id: 'stressed', label: 'Stresszes' },
  { id: 'angry', label: 'Dühös' },
  { id: 'unsure', label: 'Bizonytalan' },
  { id: 'hurt', label: 'Sérült' },
  { id: 'guilty', label: 'Bűntudatos' },
];

// Az első verziók hangulatai: a már mentett naplókban és a gyors sablonokban érvényesek maradnak.
export const LEGACY_MOODS = [
  { id: 'calm', label: 'Nyugodt' },
  { id: 'hopeful', label: 'Reménykedő' },
  { id: 'content', label: 'Elégedett' },
  { id: 'tired', label: 'Fáradt' },
  { id: 'anxious', label: 'Szorongó' },
  { id: 'irritable', label: 'Ingerült' },
  { id: 'sad', label: 'Szomorú' },
  { id: 'lonely', label: 'Magányos' },
];

// Melyik figurával jelenítjük meg a régi hangulatot.
export const LEGACY_MOOD_FIGURE = {
  calm: 'cheerful', hopeful: 'excited', content: 'grateful', tired: 'bored',
  anxious: 'stressed', irritable: 'angry', sad: 'hurt', lonely: 'sensitive',
};

// Mitől szeretne távol maradni (bevezető 3. lépés).
export const SUBSTANCES = [
  { id: 'alcohol', label: 'Alkohol' },
  { id: 'tobacco', label: 'Dohányzás' },
  { id: 'gambling', label: 'Szerencsejáték' },
  { id: 'drugs', label: 'Drog' },
  { id: 'pills', label: 'Gyógyszer-visszaélés' },
  { id: 'other', label: 'Egyéb' },
];

// Bevezető 7. lépés: ezek a helyzetek jelennek meg először (a TRIGGERS-ből).
export const ONBOARDING_TRIGGERS = ['stress', 'loneliness', 'weekend', 'social', 'fatigue', 'boredom', 'conflict'];

export const TRIGGERS = [
  { id: 'stress', label: 'Stressz (munka, tanulás)' },
  { id: 'weekend', label: 'Hétvége' },
  { id: 'loneliness', label: 'Magány' },
  { id: 'boredom', label: 'Unalom' },
  { id: 'conflict', label: 'Konfliktus, vita' },
  { id: 'social', label: 'Társasági esemény, buli' },
  { id: 'social-pressure', label: 'Társas nyomás, kínálgatás' },
  { id: 'routine', label: 'Megszokás, rutin (pl. munka után)' },
  { id: 'celebration', label: 'Ünneplés, jó hír' },
  { id: 'fatigue', label: 'Fáradtság, kialvatlanság' },
  { id: 'money', label: 'Anyagi gondok' },
  { id: 'place', label: 'Ismerős hely' },
  { id: 'people', label: 'Bizonyos emberek' },
  { id: 'anger', label: 'Düh, csalódottság' },
  { id: 'evening', label: 'Esti, éjszakai órák' },
];

export const COPING = [
  { id: 'walk', label: 'Sétáltam, mozogtam' },
  { id: 'called', label: 'Felhívtam valakit' },
  { id: 'breathing', label: 'Légzőgyakorlat' },
  { id: 'drink-other', label: 'Ittam/ettem valami mást' },
  { id: 'left', label: 'Kiléptem a helyzetből' },
  { id: 'waited', label: 'Kivártam, amíg elmúlik' },
  { id: 'wrote', label: 'Leírtam, mit érzek' },
  { id: 'shower', label: 'Zuhany, hideg víz' },
];

export const OUTCOMES = [
  { id: 'coped', label: 'Megbirkóztam vele' },
  { id: 'hard', label: 'Nehéz volt, de túl vagyok rajta' },
  { id: 'ongoing', label: 'Még tart' },
];

export const SLEEP_LEVELS = [
  { id: 1, label: 'Nagyon rossz' },
  { id: 2, label: 'Rossz' },
  { id: 3, label: 'Közepes' },
  { id: 4, label: 'Jó' },
  { id: 5, label: 'Nagyon jó' },
];

export const CRAVING_LEVELS = [
  { id: 0, label: 'Nincs' },
  { id: 1, label: 'Enyhe' },
  { id: 2, label: 'Közepes' },
  { id: 3, label: 'Erős' },
];

const index = (list) => new Map(list.map((x) => [x.id, x.label]));
export const LABELS = {
  mood: index([...MOODS, ...LEGACY_MOODS]),
  substance: index(SUBSTANCES),
  trigger: index(TRIGGERS),
  coping: index(COPING),
  outcome: index(OUTCOMES),
  sleep: index(SLEEP_LEVELS),
  craving: index(CRAVING_LEVELS),
};

export function labelOf(kind, id) {
  return LABELS[kind]?.get(id) ?? String(id);
}

// One-tap quick-log templates (home screen). Each maps to existing preset ids,
// so a quick entry is an ordinary, fully validated timeline event.
export const QUICK_TEMPLATES = [
  { id: 'q-tired', kind: 'trigger', label: 'Fáradtság / Kimerültség', triggers: ['fatigue'] },
  { id: 'q-stress', kind: 'trigger', label: 'Stresszes nap', triggers: ['stress'] },
  { id: 'q-social', kind: 'trigger', label: 'Társasági nyomás', triggers: ['social-pressure'] },
  { id: 'q-evening', kind: 'trigger', label: 'Esti szokás', triggers: ['routine', 'evening'] },
  { id: 'q-lonely', kind: 'trigger', label: 'Magány', triggers: ['loneliness'] },
  { id: 'q-calm', kind: 'mood', label: 'Nyugodt / Kiegyensúlyozott', mood: 'calm' },
  { id: 'q-hopeful', kind: 'mood', label: 'Reménykedő', mood: 'hopeful' },
  { id: 'q-anxious', kind: 'mood', label: 'Szorongó', mood: 'anxious' },
];

/**
 * Turns a template (+ optional details) into a timeline action.
 * Nothing is invented: intensity and note are only set when the user gave them.
 */
export function quickLogAction(template, { intensity, note } = {}) {
  const extra = {};
  if (intensity !== undefined && intensity !== null && intensity !== '') extra.intensity = Number(intensity);
  if (note && String(note).trim()) extra.note = String(note);
  if (template.kind === 'trigger') {
    return { type: 'LOG_TRIGGER', payload: { triggers: [...template.triggers], ...extra } };
  }
  if (template.kind === 'mood') {
    const { intensity: _ignored, ...moodExtra } = extra;
    return { type: 'LOG_CHECKIN', payload: { mood: template.mood, ...moodExtra } };
  }
  throw new TypeError(`Unknown quick template kind: ${template.kind}`);
}
