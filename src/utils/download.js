// Small, dependency-free download helpers shared by every export path.

export function slugify(name, fallback = 'colorway') {
  const slug = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

export function dateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  // Embedded browsers may hand the download off asynchronously. Keep the blob
  // alive until that handoff has had a chance to consume it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text, filename, type = 'text/plain') {
  downloadBlob(new Blob([text], { type }), filename);
}
