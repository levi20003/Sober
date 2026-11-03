// CHANGELOG.md → dist/valtozasok.html (a build része, így a GitHub Pages minden main-frissítéskor az aktuálisat mutatja).
// Szándékosan kicsi Markdown-átalakító (címsor, lista, félkövér, link, kód), minden szöveg HTML-escape-elve.
// Külső erőforrás, szkript nincs: a telepites.css stílusát használja, a CSP-vel összhangban.
import { readFileSync, writeFileSync } from 'node:fs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function inline(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  return s;
}

export function renderChangelog(md) {
  const out = [];
  let list = false;
  let para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const closeList = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    let m;
    if ((m = /^(#{1,3}) (.*)$/.exec(line))) {
      flushPara(); closeList();
      const level = m[1].length;
      out.push(level === 2 ? `<section><h2>${inline(m[2])}</h2>` : `<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = /^- (.*)$/.exec(line))) {
      flushPara();
      if (!list) { out.push('<ul>'); list = true; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if (!line.trim()) {
      flushPara(); closeList();
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flushPara(); closeList();
  // A h2-k szekciót nyitnak: zárjuk le őket a következő h2 előtt és a végén.
  let html = '';
  let open = false;
  for (const part of out) {
    if (part.startsWith('<section>')) { if (open) html += '</section>\n'; open = true; }
    html += `${part}\n`;
  }
  if (open) html += '</section>\n';
  return html;
}

export function changelogPage(md) {
  return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <meta name="color-scheme" content="dark">
  <title>Józanság-számláló – változások</title>
  <link rel="stylesheet" href="telepites.css">
</head>
<body>
<main>
<p><a class="btn" href="https://github.com/levi20003/Sober/releases/download/android-latest/jozansag-szamlalo.apk">Legfrissebb APK letöltése</a></p>
${renderChangelog(md)}
<p class="hint">A Józanság-számláló segít követni és támogatni a józanságod útját. Nem orvosi eszköz, és nem helyettesíti a szakember segítségét.</p>
</main>
</body>
</html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [src = 'CHANGELOG.md', dest = 'dist/valtozasok.html'] = process.argv.slice(2);
  writeFileSync(dest, changelogPage(readFileSync(src, 'utf8')));
  console.log(`${src} → ${dest}`);
}
