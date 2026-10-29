export function formatTimeHu(iso) {
  return new Date(iso).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}

export function download(filename, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
