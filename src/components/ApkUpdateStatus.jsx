// A frissítő modul állapota (Android-app): letöltés %-kal, telepítő megnyitva, engedély kell, hiba okkal.
import { UPDATE } from '../content/index.js';

export function ApkUpdateStatus({ update }) {
  const { status, progress = 0, errorCode } = update;
  if (status === 'downloading') {
    return (
      <div className="stack" role="status">
        <p className="hint">{UPDATE.apkDownloading(progress)}</p>
        <progress max={100} value={progress} aria-label={UPDATE.apkDownloading(progress)} style={{ width: '100%' }} />
      </div>
    );
  }
  if (status === 'installing') return <p className="hint" role="status">{UPDATE.apkInstalling}</p>;
  if (status === 'permission') return <p className="hint" role="status">{UPDATE.apkPermission}</p>;
  if (status === 'error' && errorCode) return <p className="hint" role="alert">{UPDATE.apkErrors[errorCode] ?? UPDATE.apkErrors.UNKNOWN}</p>;
  return null;
}

export const apkBusy = (update) => update.status === 'downloading';
