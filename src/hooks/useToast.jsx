import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(() => {});

/** Polite (status) or assertive (alert) announcements, rendered into #toast when present. */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const toast = useCallback((message, kind = 'info') => {
    setMsg({ message, kind, key: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 6000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const region = typeof document !== 'undefined' ? document.getElementById('toast') : null;
  const node = msg && (
    <div key={msg.key} className={`toast toast-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.message}</div>
  );
  return (
    <ToastContext.Provider value={toast}>
      {children}
      {region ? createPortal(node, region) : <div className="toast-region">{node}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
