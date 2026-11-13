/**
 * Image format conversion in the browser. Formats are identified by their file
 * signature (not the extension). JPG/PNG/WebP/GIF/BMP and (in most browsers)
 * AVIF are decoded natively; HEIC/HEIF always, and AVIF as a fallback, are
 * decoded in a Web Worker. JPG/PNG/WebP are encoded with canvas; AVIF with the
 * browser if it can, otherwise libavif in the worker.
 */

export type InKind = "jpeg" | "png" | "webp" | "gif" | "bmp" | "heic" | "avif" | "tiff";
export type OutFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export const OUTPUTS: { value: OutFormat; label: string; ext: string; lossy: boolean; alpha: boolean }[] = [
  { value: "image/jpeg", label: "JPG", ext: "jpg", lossy: true, alpha: false },
  { value: "image/png", label: "PNG", ext: "png", lossy: false, alpha: true },
  { value: "image/webp", label: "WebP", ext: "webp", lossy: true, alpha: true },
  { value: "image/avif", label: "AVIF", ext: "avif", lossy: true, alpha: true },
];

export const INPUT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/bmp,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.heic,.heif,.avif";
export const INPUT_LABELS = ["JPG", "PNG", "WebP", "HEIC", "AVIF", "BMP", "GIF"];

export const KIND_LABEL: Record<InKind, string> = { jpeg: "JPG", png: "PNG", webp: "WebP", gif: "GIF", bmp: "BMP", heic: "HEIC", avif: "AVIF", tiff: "TIFF" };

/** Identifies an image by its first bytes. */
export function sniff(b: Uint8Array): InKind | null {
  const at = (o: number, s: string) => [...s].every((c, i) => b[o + i] === c.charCodeAt(0));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && at(1, "PNG\r\n\x1a\n")) return "png";
  if (at(0, "GIF87a") || at(0, "GIF89a")) return "gif";
  if (at(0, "RIFF") && at(8, "WEBP")) return "webp";
  if (at(0, "BM") && b.length > 26) return "bmp";
  if (at(0, "II*\0") || at(0, "MM\0*")) return "tiff";
  if (at(4, "ftyp")) {
    // ISO-BMFF: check the major brand and compatible brands.
    const size = Math.min(b.length, ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0 || 32);
    const brands: string[] = [];
    for (let o = 8; o + 4 <= size; o += 4) if (o !== 12) brands.push(String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]));
    if (brands.some((x) => x === "avif" || x === "avis")) return "avif";
    if (brands.some((x) => ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(x))) return "heic";
  }
  return null;
}

/** True if a GIF contains more than one frame (animation). */
export function isAnimatedGif(b: Uint8Array) {
  let frames = 0;
  for (let i = 0; i < b.length - 9 && frames < 2; i++) {
    // Graphic Control Extension followed by an image descriptor marks a frame.
    if (b[i] === 0x21 && b[i + 1] === 0xf9 && b[i + 2] === 0x04 && b[i + 7] === 0x00 && b[i + 8] === 0x2c) frames++;
  }
  return frames > 1;
}

/** Output filename from a pattern: {name} = original name without extension, {n} = position. */
export function renameOutput(pattern: string, original: string, n: number, ext: string) {
  const base = original.replace(/\.[^.]+$/, "") || "image";
  const p = (pattern.trim() || "{name}").replace(/\{name\}/g, base).replace(/\{n\}/g, String(n));
  const safe = p.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/^[.\-\s]+/, "").slice(0, 120) || base;
  return `${safe}.${ext}`;
}

/** Target size for a resize request, keeping aspect ratio when only one side is set or when locked. */
export function targetSize(w: number, h: number, rw: number | null, rh: number | null, keepRatio: boolean) {
  if (!rw && !rh) return { width: w, height: h };
  if (keepRatio) {
    if (rw && rh) {
      const k = Math.min(rw / w, rh / h);
      return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
    }
    if (rw) return { width: rw, height: Math.max(1, Math.round((h * rw) / w)) };
    return { width: Math.max(1, Math.round((w * rh!) / h)), height: rh! };
  }
  return { width: rw ?? w, height: rh ?? h };
}

/* ---------------- Browser capability checks ---------------- */

export async function canEncode(type: string) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 2;
    c.getContext("2d")!.fillRect(0, 0, 1, 1);
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, type, 0.8));
    return b?.type === type;
  } catch {
    return false;
  }
}

/* ---------------- Worker bridge ---------------- */

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: Record<string, unknown>) => void; reject: (e: Error) => void }>();

function codec(msg: Record<string, unknown>, transfer: Transferable[] = []) {
  if (!worker) {
    worker = new Worker(new URL("./workers/codec.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data);
      else p.reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      pending.forEach((p) => p.reject(new Error("codec-crashed")));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  const id = ++seq;
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ ...msg, id }, transfer);
  });
}

export class ConvertError extends Error {}

/* ---------------- Decode ---------------- */

export interface Source {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  hasAlpha: boolean;
  animated: boolean;
}

const MAX_PIXELS = 50_000_000;

function pixelsToCanvas(width: number, height: number, pixels: ArrayBuffer) {
  if (width * height > MAX_PIXELS) throw new ConvertError(`At ${width} × ${height} px, this image is too large to convert in the browser.`);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
  return canvas;
}

function detectAlpha(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  return false;
}

export async function decode(file: Blob, kind: InKind): Promise<Source> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let canvas: HTMLCanvasElement | null = null;
  if (kind === "heic") {
    try {
      const r = await codec({ op: "heic-decode", buffer: bytes.buffer }, [bytes.buffer]);
      canvas = pixelsToCanvas(r.width as number, r.height as number, r.pixels as ArrayBuffer);
    } catch (e) {
      if (e instanceof ConvertError) throw e;
      throw new ConvertError("This HEIC file couldn't be decoded. It may be damaged, or use a HEIF feature that isn't supported.");
    }
  } else {
    try {
      const bmp = await createImageBitmap(new Blob([bytes]), { imageOrientation: "from-image" });
      if (bmp.width * bmp.height > MAX_PIXELS) throw new ConvertError(`At ${bmp.width} × ${bmp.height} px, this image is too large to convert in the browser.`);
      canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0);
      bmp.close();
    } catch (e) {
      if (e instanceof ConvertError) throw e;
      if (kind === "avif") {
        try {
          const r = await codec({ op: "avif-decode", buffer: bytes.buffer, wasm: "/wasm/avif_dec.wasm" }, [bytes.buffer]);
          canvas = pixelsToCanvas(r.width as number, r.height as number, r.pixels as ArrayBuffer);
        } catch (e2) {
          if (e2 instanceof ConvertError) throw e2;
          throw new ConvertError("This AVIF file couldn't be decoded. It may be damaged.");
        }
      } else if (kind === "tiff") {
        throw new ConvertError("TIFF images aren't supported here. Try converting it to JPG or PNG first.");
      } else {
        throw new ConvertError(`This ${KIND_LABEL[kind]} file couldn't be read. It may be damaged or incomplete.`);
      }
    }
  }
  return { canvas: canvas!, width: canvas!.width, height: canvas!.height, hasAlpha: detectAlpha(canvas!), animated: kind === "gif" && isAnimatedGif(bytes) };
}

/* ---------------- Encode ---------------- */

export interface EncodeOptions {
  format: OutFormat;
  quality: number; // 1–100
  width: number;
  height: number;
  /** Fill for formats without alpha, or when flattening is requested. */
  background: string;
  flatten: boolean;
  /** Use the browser's AVIF encoder if available. */
  nativeAvif: boolean;
}

export async function encode(src: Source, o: EncodeOptions): Promise<Blob> {
  const out = document.createElement("canvas");
  out.width = o.width;
  out.height = o.height;
  const ctx = out.getContext("2d", { willReadFrequently: o.format === "image/avif" && !o.nativeAvif })!;
  const noAlpha = o.format === "image/jpeg";
  if (noAlpha || o.flatten) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, o.width, o.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src.canvas, 0, 0, o.width, o.height);
  try {
    if (o.format === "image/avif" && !o.nativeAvif) {
      const img = ctx.getImageData(0, 0, o.width, o.height);
      const buf = img.data.buffer as ArrayBuffer;
      try {
        const r = await codec({ op: "avif-encode", width: o.width, height: o.height, pixels: buf, quality: o.quality, wasm: "/wasm/avif_enc.wasm" }, [buf]);
        return new Blob([r.bytes as ArrayBuffer], { type: "image/avif" });
      } catch {
        throw new ConvertError("AVIF encoding failed in this browser. Try WebP instead — it's also small and widely supported.");
      }
    }
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, o.format, OUTPUTS.find((f) => f.value === o.format)!.lossy ? o.quality / 100 : undefined));
    if (!blob) throw new ConvertError("The image couldn't be encoded — it may be too large for this browser.");
    if (blob.type !== o.format) throw new ConvertError(`Your browser can't create ${OUTPUTS.find((f) => f.value === o.format)!.label} files. Choose another output format.`);
    return blob;
  } finally {
    out.width = out.height = 0;
  }
}
