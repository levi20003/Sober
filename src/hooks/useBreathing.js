// useBreathing: React binding for the clock-driven breathing controller
// (src/domain/breathing.js). The controller computes state from elapsed time, so a
// throttled or backgrounded tab always resumes in the correct phase.

import { useEffect, useRef, useState } from 'react';
import { createBreathingController } from '../domain/breathing.js';

export function useBreathing(patterns, { clock } = {}) {
  const ctlRef = useRef(null);
  const [state, setState] = useState(null);
  const [pattern, setPatternState] = useState(patterns[0]);

  if (!ctlRef.current) {
    ctlRef.current = createBreathingController({ pattern: patterns[0], onChange: setState, ...clock });
  }

  useEffect(() => {
    const ctl = ctlRef.current;
    const onVisible = () => { if (document.visibilityState === 'visible') ctl.sync(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      ctl.destroy();
    };
  }, []);

  const ctl = ctlRef.current;
  return {
    state: state ?? ctl.getState(),
    pattern,
    toggle: () => ctl.toggle(),
    setPattern: (p) => { setPatternState(p); ctl.setPattern(p); },
  };
}
