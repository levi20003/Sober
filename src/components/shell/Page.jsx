import { useEffect, useRef } from 'react';

/** Egy oldal: fókuszt kap navigációkor, és puha belépő mozgást (a .page-enter a nézetátmenet tartaléka). */
export function Page({ children, className = '', title }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return (
    <main className={`screen page-enter ${className}`.trim()} id="main" tabIndex={-1} ref={ref} aria-label={title}>
      {children}
    </main>
  );
}
