// Visszaállítás elfelejtett PIN-kóddal (helyreállító kód + új PIN). A Beállítások és a bevezető is használja.
import { T, UX } from '../content/index.js';
import { Field } from './ui.jsx';
import { PinInput } from './PinFields.jsx';

/** Helyreállító kódos visszaállítás mezői (elfelejtett PIN, M2): a kód és az új PIN kétszer. */
export function RecoveryRestoreFields() {
  return (
    <details className="quiet-details">
      <summary>{UX.restoreForgotPin}</summary>
      <div className="stack">
        <Field label={T.recoveryCodeLabel}><input name="code" className="input mono" autoComplete="off" autoCapitalize="characters" spellCheck={false} /></Field>
        <Field label={UX.restoreNewPin}><PinInput name="newpin" required={false} /></Field>
        <Field label={UX.restoreNewPin2}><PinInput name="newpin2" required={false} /></Field>
      </div>
    </details>
  );
}

