// Saját, eredeti inline SVG-ikonok (24×24, vonalas). Nincs külső ikonkönyvtár.
// Az ikon díszítő: a gomb/link szövege adja a nevet (aria-hidden), kivéve ha `title` van megadva.

const P = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  timeline: 'M3 12h4l3-8 4 16 3-8h4',
  savings: ['circle:12,12,9', 'M9.2 10.6c0-1 1.2-1.7 2.8-1.7s2.8.7 2.8 1.7-1.2 1.6-2.8 1.6-2.8.7-2.8 1.7 1.2 1.7 2.8 1.7 2.8-.7 2.8-1.7', 'M12 6.8v2.1M12 15.1v2.1'],
  tools: ['rect:3,8,18,12,2', 'M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M3 13.5h18', 'M11 13v2.5h2V13'],
  settings: ['M4 7h9M17 7h3M4 17h3M11 17h9', 'circle:15,7,2', 'circle:9,17,2'],
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  copy: ['rect:8,8,12,12,2', 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'],
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z',
  flame: 'M12 3c.8 3.2 4.5 5 4.5 9.4a4.5 4.5 0 0 1-9 0c0-2 .9-3.3 2-4.4.1 1.6.8 2.4 1.8 2.6C10.7 8.4 10.9 5.6 12 3z',
  sun: ['circle:12,12,4', 'M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4'],
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5z',
  bell: ['M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
  lock: ['rect:5,11,14,10,2.5', 'M8 11V8a4 4 0 0 1 8 0v3', 'M12 15v2.5'],
  shield: 'M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z',
  wind: 'M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 14h14a2.5 2.5 0 1 1-2.5 2.5M3 19h6',
  note: ['rect:5,3.5,14,17,2.5', 'M8.5 8.5h7M8.5 12h7M8.5 15.5h4'],
  mail: ['rect:3,5.5,18,13,2.5', 'M3.5 7.5 12 13.5l8.5-6'],
  star: 'M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.7 6.8 19.4l1-5.9-4.3-4.1 5.9-.8z',
  drop: 'M12 3.5S5.5 10.2 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10.2 12 3.5 12 3.5z',
  wave: 'M2.5 12c2-4 3.8-4 5.7 0s3.8 4 5.7 0 3.8-4 5.7 0',
  phone: 'M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  trash: ['M4 7h16', 'M9 7V5h6v2', 'M6.5 7l1 13h9l1-13'],
  refresh: 'M20 11a8 8 0 1 0-1.9 5.6M20 4v7h-7',
  target: ['circle:12,12,9', 'circle:12,12,5', 'circle:12,12,1'],
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  clock: ['circle:12,12,9', 'M12 7v5l3.5 2'],
  leaf: 'M5 19C5 10 10 5 20 4c0 10-4.5 15-13 15M5 19c2-4 5-7 9-9',
  pencil: 'M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z',
  user: ['circle:12,8,4', 'M4.5 20a7.5 7.5 0 0 1 15 0'],
  info: ['circle:12,12,9', 'M12 11v5.5', 'M12 7.6v.2'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'circle:12,12,3'],
  eyeoff: ['M3 3l18 18', 'M10.6 6a9.6 9.6 0 0 1 1.4-.1C18 5.9 21.5 12 21.5 12a17 17 0 0 1-3.3 4.1M6.3 7.7A16 16 0 0 0 2.5 12S6 18.1 12 18.1a9.4 9.4 0 0 0 3-.5'],
  backspace: ['M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z', 'M13 9.5l5 5M18 9.5l-5 5'],
};

export function Icon({ name, size = 24, title, className }) {
  const spec = P[name];
  if (!spec) return null;
  const parts = Array.isArray(spec) ? spec : [spec];
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'} focusable="false">
      {parts.map((p, i) => {
        if (p.startsWith('circle:')) { const [cx, cy, r] = p.slice(7).split(','); return <circle key={i} cx={cx} cy={cy} r={r} />; }
        if (p.startsWith('rect:')) { const [x, y, w, h, rx] = p.slice(5).split(','); return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />; }
        return <path key={i} d={p} />;
      })}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
