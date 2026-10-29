// Shared form primitives. Uncontrolled inputs read via FormData: fewer re-renders,
// and the markup matches the accessible patterns of the original app.

import { cloneElement, useId } from 'react';

export function Screen({ children, className = '' }) {
  return <main className={`screen ${className}`.trim()} id="main" tabIndex={-1}>{children}</main>;
}

/** Label + control + optional hint, wired with id / aria-describedby. */
export function Field({ label, hint, children, after }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id, 'aria-describedby': hintId })}
      {hint && <p className="hint" id={hintId}>{hint}</p>}
      {after}
    </div>
  );
}

/** Chip group backed by real radio/checkbox inputs (keyboard + screen reader friendly). */
export function Chips({ legend, name, options, multiple = false, defaultSelected = [], legendHidden = false, onChange }) {
  const sel = new Set([].concat(defaultSelected));
  return (
    <fieldset className="chips">
      <legend className={legendHidden ? 'visually-hidden' : undefined}>{legend}</legend>
      <div className="chip-row">
        {options.map((o) => (
          <label className="chip" key={o.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={name} value={String(o.id)} defaultChecked={sel.has(o.id)} onChange={onChange ? () => onChange(o) : undefined} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Button({ children, className = 'btn', ...props }) {
  return <button type="button" className={className} {...props}>{children}</button>;
}

/** Native <progress>: accessible by default, no animation (calm, reduced-motion safe). */
export function Progress({ value, label }) {
  return <progress className="savings-progress" max="1" value={Math.max(0, Math.min(1, value))} aria-label={label} />;
}
