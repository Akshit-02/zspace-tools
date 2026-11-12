/**
 * Base64 with correct UTF-8 handling (TextEncoder/TextDecoder), strict
 * validation and chunked processing for files. Base64 is an encoding, not
 * encryption — the UI says so.
 */

const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(bin);
}

export function toUrlSafe(b64: string) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function wrap76(b64: string) {
  return b64.replace(/(.{76})(?=.)/g, "$1\n");
}

export function encodeText(text: string, opts: { urlSafe?: boolean; wrap?: boolean } = {}) {
  let out = bytesToBase64(new TextEncoder().encode(text));
  if (opts.urlSafe) out = toUrlSafe(out);
  else if (opts.wrap) out = wrap76(out);
  return out;
}

export type B64Error = { ok: false; message: string; index?: number };

/** Normalises and validates Base64 (standard or URL-safe; whitespace and missing padding tolerated). */
export function normaliseBase64(input: string, ignoreWhitespace = true): { ok: true; b64: string; urlSafe: boolean } | B64Error {
  if (!ignoreWhitespace) {
    const ws = input.trim().search(/\s/);
    if (ws >= 0) return { ok: false, message: "The input contains spaces or line breaks. Turn on “Ignore whitespace” to strip them before decoding.", index: ws };
  }
  const compact = input.replace(/\s+/g, "");
  if (!compact) return { ok: false, message: "Enter Base64 to decode." };
  const dataUrl = /^data:[^;,]*(;[^,]*)?;base64,/i.exec(compact);
  const body = dataUrl ? compact.slice(dataUrl[0].length) : compact;
  const badChar = body.search(/[^A-Za-z0-9+/\-_=]/);
  if (badChar >= 0) {
    const ch = body[badChar];
    return { ok: false, message: `"${ch}" isn't a Base64 character. Base64 uses only A–Z, a–z, 0–9, + and / (or - and _ in the URL-safe variant), with = padding at the end.`, index: badChar };
  }
  const pad = body.indexOf("=");
  if (pad >= 0 && !/^=+$/.test(body.slice(pad))) return { ok: false, message: "Padding (=) can only appear at the very end.", index: pad };
  const urlSafe = /[-_]/.test(body);
  if (urlSafe && /[+/]/.test(body)) return { ok: false, message: "This mixes standard (+ /) and URL-safe (- _) Base64 characters." };
  let std = body.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  if (std.length % 4 === 1) return { ok: false, message: "The Base64 length is invalid — it looks truncated or has an extra character." };
  if ((body.match(/=+$/)?.[0].length ?? 0) > 2) return { ok: false, message: "Too much padding — Base64 ends with at most two = signs." };
  std += "=".repeat((4 - (std.length % 4)) % 4);
  return { ok: true, b64: std, urlSafe };
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodeText(input: string, ignoreWhitespace = true): { ok: true; text: string; bytes: number; urlSafe: boolean } | B64Error {
  const n = normaliseBase64(input, ignoreWhitespace);
  if (!n.ok) return n;
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(n.b64);
  } catch {
    return { ok: false, message: "This isn't valid Base64." };
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, text, bytes: bytes.length, urlSafe: n.urlSafe };
  } catch {
    const kind = sniffType(bytes);
    return {
      ok: false,
      message: `This Base64 is valid, but it decodes to binary data${kind ? ` (it looks like ${kind.label})` : ""}, not UTF-8 text. Switch to File mode to download it.`,
    };
  }
}

/** Identifies common file types from their first bytes. */
export function sniffType(b: Uint8Array): { mime: string; ext: string; label: string } | null {
  const starts = (...sig: number[]) => sig.every((v, i) => b[i] === v);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { mime: "image/png", ext: "png", label: "a PNG image" };
  if (starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg", label: "a JPEG image" };
  if (starts(0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif", label: "a GIF image" };
  if (starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45) return { mime: "image/webp", ext: "webp", label: "a WebP image" };
  if (starts(0x25, 0x50, 0x44, 0x46)) return { mime: "application/pdf", ext: "pdf", label: "a PDF" };
  if (starts(0x50, 0x4b, 0x03, 0x04)) return { mime: "application/zip", ext: "zip", label: "a ZIP archive (or Office document)" };
  if (starts(0x1f, 0x8b)) return { mime: "application/gzip", ext: "gz", label: "a gzip archive" };
  return null;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/** Encodes a file in chunks (multiples of 3 bytes) so the UI never freezes. */
export async function encodeFile(file: Blob, onProgress?: (p: number) => void): Promise<string> {
  const step = 3 * 256 * 1024; // 768 KB, divisible by 3 → no padding mid-stream
  const parts: string[] = [];
  for (let off = 0; off < file.size; off += step) {
    const buf = new Uint8Array(await file.slice(off, off + step).arrayBuffer());
    parts.push(bytesToBase64(buf));
    onProgress?.(Math.min(1, (off + step) / file.size));
    await tick();
  }
  return parts.join("");
}

/** Decodes Base64 to bytes in chunks (multiples of 4 chars). */
export async function decodeToBytes(b64: string, onProgress?: (p: number) => void): Promise<Uint8Array> {
  const step = 4 * 256 * 1024;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let off = 0; off < b64.length; off += step) {
    const part = base64ToBytes(b64.slice(off, off + step));
    chunks.push(part);
    total += part.length;
    onProgress?.(Math.min(1, (off + step) / b64.length));
    await tick();
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

export const BASE64_SAMPLE = "Hello, world! 👋\nनमस्ते · مرحبا · こんにちは\nLess effort. More done.";
