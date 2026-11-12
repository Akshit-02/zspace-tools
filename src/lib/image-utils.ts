/** Shared browser-side image helpers used by every image tool. */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
/** Browsers cap canvas area; stay well inside every engine's limit. */
export const MAX_CANVAS_PIXELS = 50_000_000;
export const MAX_SIDE = 16_384;

export function normaliseType(file: File): string | null {
  const t = file.type.toLowerCase();
  if (t === "image/jpg" || t === "image/pjpeg") return "image/jpeg";
  if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(t)) return t;
  // Some systems report an empty MIME type; fall back to the extension.
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!t && ext) {
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
  }
  return null;
}

export function extensionFor(type: string) {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

export function formatLabel(type: string) {
  return type === "image/jpeg" ? "JPG" : type === "image/png" ? "PNG" : "WebP";
}

export type Decoded = ImageBitmap | HTMLImageElement;

export function dims(src: Decoded) {
  return "naturalWidth" in src ? { width: src.naturalWidth, height: src.naturalHeight } : { width: src.width, height: src.height };
}

/** Decodes with EXIF orientation applied, so phone photos stay upright. */
export async function decodeImage(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img> decoding (older Safari rejects the options bag).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode(); // modern browsers apply EXIF orientation to <img>
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function releaseImage(src: Decoded) {
  if ("close" in src) src.close();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), type, quality),
  );
}

/** Encodes and verifies the browser actually produced the requested format. */
export async function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality?: number) {
  const blob = await canvasToBlob(canvas, type, quality);
  if (blob.type !== type) {
    throw new Error(`Your browser can't create ${formatLabel(type)} files. Choose a different output format.`);
  }
  return blob;
}

/** Reads EXIF orientation (1–8) from a JPEG's APP1 segment; 1 if absent. */
export function jpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 2;
  while (off + 4 < view.byteLength) {
    const marker = view.getUint16(off);
    const len = view.getUint16(off + 2);
    if (marker === 0xffe1 && view.getUint32(off + 4) === 0x45786966) {
      const tiff = off + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const ifd = tiff + view.getUint32(tiff + 4, little);
      const count = view.getUint16(ifd, little);
      for (let i = 0; i < count; i++) {
        const e = ifd + 2 + i * 12;
        if (e + 10 > view.byteLength) break;
        if (view.getUint16(e, little) === 0x0112) return view.getUint16(e + 8, little) || 1;
      }
      return 1;
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break;
    off += 2 + len;
  }
  return 1;
}
