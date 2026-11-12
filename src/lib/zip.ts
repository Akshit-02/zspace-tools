import { downloadBlob } from "./format";

/** Ensures unique names inside an archive: "a.pdf", "a-1.pdf", … */
export function uniqueNames(names: string[]) {
  const used = new Map<string, number>();
  return names.map((name) => {
    const n = used.get(name) ?? 0;
    used.set(name, n + 1);
    return n === 0 ? name : name.replace(/(\.[^.]+)?$/, `-${n}$1`);
  });
}

/** Builds a ZIP in the browser (stored, not re-deflated — inputs are already compressed). */
export async function zipBlobs(files: { name: string; blob: Blob }[]) {
  const { zipSync } = await import("fflate");
  const names = uniqueNames(files.map((f) => f.name));
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (let i = 0; i < files.length; i++) entries[names[i]] = [new Uint8Array(await files[i].blob.arrayBuffer()), { level: 0 }];
  return new Blob([zipSync(entries) as BlobPart], { type: "application/zip" });
}

export async function downloadZip(files: { name: string; blob: Blob }[], zipName: string) {
  downloadBlob(await zipBlobs(files), zipName);
}
