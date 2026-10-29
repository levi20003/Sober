import { useState } from 'react';
import { T } from '../content/hu.js';
import { assessSecret, MIN_SECRET_LENGTH } from '../crypto/vault.js';
import { Field } from './ui.jsx';

export function PinInput({ name, autoComplete = 'new-password', ...props }) {
  return <input type="password" name={name} required minLength={MIN_SECRET_LENGTH} autoComplete={autoComplete} className="input" {...props} />;
}

/** New-PIN field with a live, honest strength note underneath. */
export function NewPinField({ label, name = 'pin' }) {
  const [level, setLevel] = useState(null);
  return (
    <Field label={label} after={<p className="hint strength" aria-live="polite" data-level={level ?? ''}>{level ? T.secretStrength[level] : ''}</p>}>
      <PinInput name={name} onInput={(e) => setLevel(e.currentTarget.value ? assessSecret(e.currentTarget.value) : null)} />
    </Field>
  );
}
