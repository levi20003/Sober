import { pick } from '../i18n/locale.js';

// Preset options for low-friction logging. IDs are stable and stored in the
// vault; labels can be revised (e.g. after clinical review) without migration.

// A 12 hangulatfigura (src/components/mood/MoodFigures.jsx). Az azonosítók ASCII-k, a címkék
// magyarul. A színt a CSS adja (--mood-<id>), a számértékek a src/domain/moods.js-ben vannak.
export const MOODS = [
  { id: 'excited', label: pick('Izgatott', 'Excited') },
  { id: 'cheerful', label: pick('Vidám', 'Cheerful') },
  { id: 'grateful', label: pick('Hálás', 'Grateful') },
  { id: 'energetic', label: pick('Energikus', 'Energetic') },
  { id: 'sensitive', label: pick('Érzékeny', 'Sensitive') },
  { id: 'confused', label: pick('Zavarodott', 'Confused') },
  { id: 'bored', label: pick('Unatkozó', 'Bored') },
  { id: 'stressed', label: pick('Stresszes', 'Stressed') },
  { id: 'angry', label: pick('Dühös', 'Angry') },
  { id: 'unsure', label: pick('Bizonytalan', 'Unsure') },
  { id: 'hurt', label: pick('Sérült', 'Hurt') },
  { id: 'guilty', label: pick('Bűntudatos', 'Guilty') },
];

// Az első verziók hangulatai: a már mentett naplókban és a gyors sablonokban érvényesek maradnak.
export const LEGACY_MOODS = [
  { id: 'calm', label: pick('Nyugodt', 'Calm') },
  { id: 'hopeful', label: pick('Reménykedő', 'Hopeful') },
  { id: 'content', label: pick('Elégedett', 'Content') },
  { id: 'tired', label: pick('Fáradt', 'Tired') },
  { id: 'anxious', label: pick('Szorongó', 'Anxious') },
  { id: 'irritable', label: pick('Ingerült', 'Irritable') },
  { id: 'sad', label: pick('Szomorú', 'Sad') },
  { id: 'lonely', label: pick('Magányos', 'Lonely') },
];

// Melyik figurával jelenítjük meg a régi hangulatot.
export const LEGACY_MOOD_FIGURE = {
  calm: 'cheerful', hopeful: 'excited', content: 'grateful', tired: 'bored',
  anxious: 'stressed', irritable: 'angry', sad: 'hurt', lonely: 'sensitive',
};

// Mitől szeretne távol maradni (bevezető 3. lépés).
export const SUBSTANCES = [
  { id: 'alcohol', label: pick('Alkohol', 'Alcohol') },
  { id: 'tobacco', label: pick('Dohányzás', 'Smoking') },
  { id: 'gambling', label: pick('Szerencsejáték', 'Gambling') },
  { id: 'drugs', label: pick('Drog', 'Drugs') },
  { id: 'pills', label: pick('Gyógyszer-visszaélés', 'Medication misuse') },
  { id: 'other', label: pick('Egyéb', 'Other') },
];

// Bevezető 7. lépés: ezek a helyzetek jelennek meg először (a TRIGGERS-ből).
export const ONBOARDING_TRIGGERS = ['stress', 'loneliness', 'weekend', 'social', 'fatigue', 'boredom', 'conflict'];

export const TRIGGERS = [
  { id: 'stress', label: pick('Stressz (munka, tanulás)', 'Stress (work, study)') },
  { id: 'weekend', label: pick('Hétvége', 'Weekend') },
  { id: 'loneliness', label: pick('Magány', 'Loneliness') },
  { id: 'boredom', label: pick('Unalom', 'Boredom') },
  { id: 'conflict', label: pick('Konfliktus, vita', 'Conflict, arguments') },
  { id: 'social', label: pick('Társasági esemény, buli', 'Social event, party') },
  { id: 'social-pressure', label: pick('Társas nyomás, kínálgatás', 'Peer pressure, being offered') },
  { id: 'routine', label: pick('Megszokás, rutin (pl. munka után)', 'Habit, routine (e.g. after work)') },
  { id: 'celebration', label: pick('Ünneplés, jó hír', 'Celebration, good news') },
  { id: 'fatigue', label: pick('Fáradtság, kialvatlanság', 'Tiredness, lack of sleep') },
  { id: 'money', label: pick('Anyagi gondok', 'Money worries') },
  { id: 'place', label: pick('Ismerős hely', 'A familiar place') },
  { id: 'people', label: pick('Bizonyos emberek', 'Certain people') },
  { id: 'anger', label: pick('Düh, csalódottság', 'Anger, disappointment') },
  { id: 'evening', label: pick('Esti, éjszakai órák', 'Evening, night-time hours') },
];

export const COPING = [
  { id: 'walk', label: pick('Sétáltam, mozogtam', 'I walked or exercised') },
  { id: 'called', label: pick('Felhívtam valakit', 'I called someone') },
  { id: 'breathing', label: pick('Légzőgyakorlat', 'Breathing exercise') },
  { id: 'drink-other', label: pick('Ittam/ettem valami mást', 'I had something else to eat or drink') },
  { id: 'left', label: pick('Kiléptem a helyzetből', 'I left the situation') },
  { id: 'waited', label: pick('Kivártam, amíg elmúlik', 'I waited for it to pass') },
  { id: 'wrote', label: pick('Leírtam, mit érzek', 'I wrote down what I feel') },
  { id: 'shower', label: pick('Zuhany, hideg víz', 'Shower, cold water') },
];

export const OUTCOMES = [
  { id: 'coped', label: pick('Megbirkóztam vele', 'I got through it') },
  { id: 'hard', label: pick('Nehéz volt, de túl vagyok rajta', 'It was hard, but I am past it') },
  { id: 'ongoing', label: pick('Még tart', 'Still going') },
];

export const SLEEP_LEVELS = [
  { id: 1, label: pick('Nagyon rossz', 'Very poor') },
  { id: 2, label: pick('Rossz', 'Poor') },
  { id: 3, label: pick('Közepes', 'Fair') },
  { id: 4, label: pick('Jó', 'Good') },
  { id: 5, label: pick('Nagyon jó', 'Very good') },
];

export const CRAVING_LEVELS = [
  { id: 0, label: pick('Nincs', 'None') },
  { id: 1, label: pick('Enyhe', 'Mild') },
  { id: 2, label: pick('Közepes', 'Fair') },
  { id: 3, label: pick('Erős', 'Strong') },
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
  { id: 'q-tired', kind: 'trigger', label: pick('Fáradtság / Kimerültség', 'Tiredness / Exhaustion'), triggers: ['fatigue'] },
  { id: 'q-stress', kind: 'trigger', label: pick('Stresszes nap', 'A stressful day'), triggers: ['stress'] },
  { id: 'q-social', kind: 'trigger', label: pick('Társasági nyomás', 'Peer pressure'), triggers: ['social-pressure'] },
  { id: 'q-evening', kind: 'trigger', label: pick('Esti szokás', 'An evening habit'), triggers: ['routine', 'evening'] },
  { id: 'q-lonely', kind: 'trigger', label: pick('Magány', 'Loneliness'), triggers: ['loneliness'] },
  { id: 'q-calm', kind: 'mood', label: pick('Nyugodt / Kiegyensúlyozott', 'Calm / Balanced'), mood: 'calm' },
  { id: 'q-hopeful', kind: 'mood', label: pick('Reménykedő', 'Hopeful'), mood: 'hopeful' },
  { id: 'q-anxious', kind: 'mood', label: pick('Szorongó', 'Anxious'), mood: 'anxious' },
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
