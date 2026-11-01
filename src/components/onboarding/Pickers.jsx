// Újrahasznosítható választók: a bevezetőben és a főoldali "Tedd a sajátoddá" lapokon is ezek jelennek meg.
import { ONB } from '../../content/index.js';
import { GOAL_OPTIONS } from '../../domain/milestones.js';
import { LABELS, ONBOARDING_TRIGGERS } from '../../domain/presets.js';
import { formatHuf, parseHufInput } from '../../domain/savings.js';
import { Field } from '../ui.jsx';

export function ChoiceGrid({ legend, options, selected, onToggle, multiple = true, name }) {
  return (
    <fieldset className="chips">
      <legend className="visually-hidden">{legend}</legend>
      <div className="choice-grid">
        {options.map((o) => (
          <label className="choice" key={o.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={String(o.id)} checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Cél: 7/30/90/365 nap vagy saját. value: szám | 'custom' | null */
export function GoalPicker({ value, custom, onChange, onCustom }) {
  return (
    <>
      <ChoiceGrid legend={ONB.goalTitle} name="goal" multiple={false}
        options={[...GOAL_OPTIONS.map((n) => ({ id: n, label: ONB.goalOption(n) })), { id: 'custom', label: ONB.goalCustom }]}
        selected={value === null ? [] : [value]} onToggle={onChange} />
      {value === 'custom' && (
        <Field label={ONB.goalCustomLabel}>
          <input className="input big-input" inputMode="numeric" name="customGoal" value={custom} onChange={(e) => onCustom(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </Field>
      )}
    </>
  );
}

export function CostInput({ value, onChange }) {
  const n = value.trim() === '' ? NaN : parseHufInput(value);
  return (
    <>
      <Field label={ONB.costLabel}>
        <input className="input big-input" name="cost" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} />
      </Field>
      {Number.isFinite(n) && n > 0 && <p className="cost-note" aria-live="polite">{ONB.costMonthly(formatHuf(n * 30))}</p>}
    </>
  );
}

export function TriggerPicker({ selected, onToggle }) {
  return (
    <ChoiceGrid legend={ONB.triggersTitle} name="triggers" selected={selected} onToggle={onToggle}
      options={ONBOARDING_TRIGGERS.map((id) => ({ id, label: ONB.triggerShort[id] ?? LABELS.trigger.get(id) }))} />
  );
}
