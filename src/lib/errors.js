const OWN_ERRORS = new Set(['VaultError', 'StorageError', 'SchemaError', 'AuthStateError', 'TimelineError', 'Error']);

/** User-caused outcomes (wrong PIN, weak PIN, validation) are not bugs and are not logged. */
export const EXPECTED_CODES = new Set(['WRONG_SECRET', 'WEAK_SECRET', 'USER_INPUT', 'TIMELINE']);

/** Our errors carry Hungarian messages; anything else (e.g. a JSON SyntaxError) gets a generic one. */
export function friendlyError(err) {
  if (err?.name === 'SyntaxError') return 'A fájl nem olvasható (sérült vagy nem megfelelő formátumú).';
  if (OWN_ERRORS.has(err?.name) && err.message) return err.message;
  return 'Valami nem sikerült. Az adataid biztonságban vannak; próbáld újra.';
}

/** A validation message for the user (not a bug): shown as a toast, never logged as an error. */
export function userError(message) {
  return Object.assign(new Error(message), { code: 'USER_INPUT' });
}
