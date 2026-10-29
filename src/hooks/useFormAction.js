import { useState } from 'react';
import { useToast } from './useToast.jsx';
import { EXPECTED_CODES, friendlyError } from '../lib/errors.js';

/**
 * Async form submit: prevents default, exposes `busy`, passes FormData, and reports
 * errors kindly (expected user errors are toasted but not logged).
 */
export function useFormAction(fn) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await fn(new FormData(ev.currentTarget), ev.currentTarget);
    } catch (err) {
      if (!EXPECTED_CODES.has(err?.code)) console.error(err);
      toast(friendlyError(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  return { onSubmit, busy };
}
