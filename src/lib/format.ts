export function formatBytes(bytes: number, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const v = bytes / 1024 ** i;
  return `${v.toFixed(i === 0 ? 0 : v >= 100 ? 0 : decimals)} ${units[i]}`;
}

/** Percentage saved going from `before` to `after` (positive = smaller). */
export function percentSaved(before: number, after: number) {
  if (before <= 0) return 0;
  return ((before - after) / before) * 100;
}

export function formatPercent(p: number) {
  const r = Math.round(p * 10) / 10;
  return `${r > 0 ? "−" : r < 0 ? "+" : ""}${Math.abs(r).toFixed(Math.abs(r) >= 10 ? 0 : 1)}%`;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function baseName(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Opens a local file (e.g. a PDF) in a new tab; the temporary URL is released after a minute. */
export function openBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
