// Az egyetlen hely, ahol az alkalmazás a konzolra írhat (tests/backup.test.js M11 őrzi).
// Idegen hibák (pl. a JSON.parse SyntaxError-ja) üzenete a beolvasott szöveg darabját is tartalmazhatja – akár
// naplótartalmat –, ezért azokból csak a hiba nevét és kódját írjuk ki. A saját hibaüzeneteink nem tartalmaznak
// felhasználói adatot, de rövidítve azok is.
const OWN = new Set(['VaultError', 'StorageError', 'SchemaError', 'AuthStateError', 'TimelineError', 'ImportError', 'BackupError']);

export function describeError(err) {
  const name = err?.name ?? typeof err;
  const code = err?.code ? `(${err.code})` : '';
  const msg = OWN.has(name) && typeof err.message === 'string' ? `: ${err.message.slice(0, 160)}` : '';
  return `${name}${code}${msg}`;
}

export function logError(err, out = (...a) => console.error(...a)) {
  out(`[jozansag] ${describeError(err)}`);
}

export function logWarn(text, out = (...a) => console.warn(...a)) {
  out(`[jozansag] ${String(text).slice(0, 160)}`);
}
