import { useEffect, useRef } from 'react';

/**
 * Opens a native <dialog> as modal (focus trap, inert background, Esc → onCancel).
 * The callback lives in a ref so re-renders never close and reopen the dialog
 * (which would steal focus from a field the user is typing in).
 */
export function useModalDialog(ref, onCancel) {
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    if (!d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', ''); // jsdom / very old browsers
    }
    const cancel = (e) => { e.preventDefault(); cancelRef.current?.(); };
    d.addEventListener('cancel', cancel);
    return () => {
      d.removeEventListener('cancel', cancel);
      if (d.open && typeof d.close === 'function') d.close();
    };
  }, [ref]);
}
