/**
 * In-browser PDF compression with pdf-lib.
 *
 * What it does (and only this — text and vector content are never rasterised):
 *  1. Finds raster image XObjects stored as JPEG (DCTDecode), Flate or raw,
 *     8 bits per component, in RGB or greyscale (incl. ICC-based RGB/grey).
 *  2. Decodes each, downsamples to the level's max dimension, re-encodes as
 *     JPEG, and swaps it in only if the new stream is meaningfully smaller.
 *  3. Deflates any uncompressed streams (e.g. content streams).
 *  4. Saves with object streams to shrink the document structure.
 * The caller compares the final size with the original before offering it.
 */

import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  EncryptedPDFError,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  type PDFObject,
} from "pdf-lib";

export type PdfLevel = "low" | "medium" | "high";

export const LEVELS: Record<PdfLevel, { maxDim: number; quality: number; label: string; hint: string }> = {
  low: { maxDim: 2400, quality: 0.8, label: "Low", hint: "Best quality" },
  medium: { maxDim: 1600, quality: 0.65, label: "Medium", hint: "Recommended" },
  high: { maxDim: 1100, quality: 0.45, label: "High", hint: "Smallest file" },
};

export interface PdfProgress {
  phase: "reading" | "images" | "saving";
  done: number;
  total: number;
}

export interface PdfResult {
  bytes: Uint8Array;
  pages: number;
  imagesFound: number;
  imagesOptimised: number;
}

export class PdfError extends Error {
  constructor(
    public code: "not-pdf" | "encrypted" | "damaged" | "memory",
    message: string,
  ) {
    super(message);
  }
}

const N = (s: string) => PDFName.of(s);

function nameList(obj: PDFObject | undefined): string[] {
  if (!obj) return [];
  if (obj instanceof PDFName) return [obj.decodeText()];
  if (obj instanceof PDFArray) return obj.asArray().flatMap((o) => (o instanceof PDFName ? [o.decodeText()] : ["?"]));
  return ["?"];
}

function num(doc: PDFDocument, obj: PDFObject | undefined): number | undefined {
  const v = obj instanceof PDFRef ? doc.context.lookup(obj) : obj;
  return v instanceof PDFNumber ? v.asNumber() : undefined;
}

/** Returns the number of colour components (1 or 3) if supported, otherwise null. */
function components(doc: PDFDocument, cs: PDFObject | undefined): 1 | 3 | null {
  const v = cs instanceof PDFRef ? doc.context.lookup(cs) : cs;
  if (v instanceof PDFName) {
    const n = v.decodeText();
    return n === "DeviceRGB" || n === "CalRGB" ? 3 : n === "DeviceGray" || n === "CalGray" ? 1 : null;
  }
  if (v instanceof PDFArray && v.size() >= 2) {
    const kind = v.get(0);
    if (!(kind instanceof PDFName)) return null;
    const k = kind.decodeText();
    if (k === "CalRGB") return 3;
    if (k === "CalGray") return 1;
    if (k === "ICCBased") {
      const stream = doc.context.lookup(v.get(1));
      const dict = stream instanceof PDFRawStream ? stream.dict : stream instanceof PDFDict ? stream : null;
      const n = dict ? num(doc, dict.get(N("N"))) : undefined;
      return n === 3 ? 3 : n === 1 ? 1 : null;
    }
  }
  return null;
}

/** Reverses PNG row predictors (Predictor ≥ 10) in place-ish. */
function unpredictPng(data: Uint8Array, columns: number, colors: number): Uint8Array | null {
  const bpp = colors; // 8 bits per component
  const rowLen = columns * bpp;
  const rows = Math.floor(data.length / (rowLen + 1));
  const out = new Uint8Array(rows * rowLen);
  for (let r = 0; r < rows; r++) {
    const type = data[r * (rowLen + 1)];
    const src = r * (rowLen + 1) + 1;
    const dst = r * rowLen;
    for (let i = 0; i < rowLen; i++) {
      const raw = data[src + i];
      const left = i >= bpp ? out[dst + i - bpp] : 0;
      const up = r > 0 ? out[dst - rowLen + i] : 0;
      const upLeft = r > 0 && i >= bpp ? out[dst - rowLen + i - bpp] : 0;
      let v: number;
      switch (type) {
        case 0: v = raw; break;
        case 1: v = raw + left; break;
        case 2: v = raw + up; break;
        case 3: v = raw + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          v = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          return null;
      }
      out[dst + i] = v & 0xff;
    }
  }
  return out;
}

async function decodeToCanvasSource(
  doc: PDFDocument,
  stream: PDFRawStream,
  filters: string[],
  width: number,
  height: number,
  comps: 1 | 3,
): Promise<ImageBitmap | null> {
  if (filters.length === 1 && filters[0] === "DCTDecode") {
    try {
      return await createImageBitmap(new Blob([stream.contents as BlobPart], { type: "image/jpeg" }));
    } catch {
      return null;
    }
  }
  let raw: Uint8Array = stream.contents;
  if (filters.length === 1 && filters[0] === "FlateDecode") {
    const { unzlibSync } = await import("fflate");
    try {
      raw = unzlibSync(stream.contents);
    } catch {
      return null;
    }
    const parms = stream.dict.get(N("DecodeParms"));
    const p = parms instanceof PDFRef ? doc.context.lookup(parms) : parms;
    if (p instanceof PDFDict) {
      const predictor = num(doc, p.get(N("Predictor"))) ?? 1;
      if (predictor >= 10) {
        const columns = num(doc, p.get(N("Columns"))) ?? width;
        const colors = num(doc, p.get(N("Colors"))) ?? comps;
        const bpc = num(doc, p.get(N("BitsPerComponent"))) ?? 8;
        if (columns !== width || colors !== comps || bpc !== 8) return null;
        const un = unpredictPng(raw, columns, colors);
        if (!un) return null;
        raw = un;
      } else if (predictor !== 1) {
        return null; // TIFF predictor — not supported, leave image untouched
      }
    }
  } else if (filters.length !== 0) {
    return null;
  }
  const expected = width * height * comps;
  if (raw.length < expected) return null;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += comps) {
    const o = i * 4;
    if (comps === 3) {
      rgba[o] = raw[j];
      rgba[o + 1] = raw[j + 1];
      rgba[o + 2] = raw[j + 2];
    } else {
      rgba[o] = rgba[o + 1] = rgba[o + 2] = raw[j];
    }
    rgba[o + 3] = 255;
  }
  return createImageBitmap(new ImageData(rgba, width, height));
}

async function encodeJpeg(src: ImageBitmap, maxDim: number, quality: number) {
  const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  canvas.width = canvas.height = 0;
  if (!blob) return null;
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

export async function compressPdf(
  input: ArrayBuffer,
  level: PdfLevel,
  onProgress?: (p: PdfProgress) => void,
): Promise<PdfResult> {
  const head = new TextDecoder("latin1").decode(new Uint8Array(input.slice(0, 1024)));
  if (!head.includes("%PDF-")) throw new PdfError("not-pdf", "This file isn't a PDF. Choose a file that ends in .pdf.");

  onProgress?.({ phase: "reading", done: 0, total: 1 });
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input, { updateMetadata: false, throwOnInvalidObject: false });
  } catch (e) {
    if (e instanceof EncryptedPDFError || (e instanceof Error && /encrypt/i.test(e.message))) {
      throw new PdfError("encrypted", "This PDF is password-protected or encrypted. Remove the protection in the app you used to create it, then try again.");
    }
    throw new PdfError("damaged", "This PDF couldn't be opened. It may be damaged or use a structure the browser can't read.");
  }

  const { maxDim, quality } = LEVELS[level];
  const ctx = doc.context;

  // Images referenced as soft masks/masks are left alone.
  const maskRefs = new Set<string>();
  const imageRefs: [PDFRef, PDFRawStream][] = [];
  const plainStreams: [PDFRef, PDFRawStream][] = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const d = obj.dict;
    const sub = d.get(N("Subtype"));
    const type = d.get(N("Type"));
    if (sub === N("Image")) {
      for (const key of ["SMask", "Mask"]) {
        const m = d.get(N(key));
        if (m instanceof PDFRef) maskRefs.add(m.toString());
      }
      imageRefs.push([ref, obj]);
    } else if (!d.has(N("Filter")) && type !== N("Metadata") && type !== N("XRef") && type !== N("ObjStm")) {
      plainStreams.push([ref, obj]);
    }
  }

  let optimised = 0;
  for (let i = 0; i < imageRefs.length; i++) {
    const [ref, stream] = imageRefs[i];
    onProgress?.({ phase: "images", done: i, total: imageRefs.length });
    await tick();
    if (maskRefs.has(ref.toString())) continue;
    const d = stream.dict;
    if (d.get(N("ImageMask")) === PDFBool.True || d.has(N("Decode"))) continue;
    const w = num(doc, d.get(N("Width")));
    const h = num(doc, d.get(N("Height")));
    const bpc = num(doc, d.get(N("BitsPerComponent")));
    if (!w || !h || bpc !== 8 || w * h < 96 * 96) continue;
    const comps = components(doc, d.get(N("ColorSpace")));
    if (!comps) continue;
    const filters = nameList(d.get(N("Filter")));
    if (filters.includes("?")) continue;

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await decodeToCanvasSource(doc, stream, filters, w, h, comps);
      if (!bitmap) continue;
      const enc = await encodeJpeg(bitmap, maxDim, quality);
      if (!enc) continue;
      // Replace only when it saves at least 5% — avoids needless generational loss.
      if (enc.bytes.length >= stream.contents.length * 0.95) continue;
      const dict: Record<string, PDFObject> = {
        Type: N("XObject"),
        Subtype: N("Image"),
        Width: PDFNumber.of(enc.w),
        Height: PDFNumber.of(enc.h),
        ColorSpace: N("DeviceRGB"),
        BitsPerComponent: PDFNumber.of(8),
        Filter: N("DCTDecode"),
      };
      // Keep transparency and metadata links that refer to this image.
      for (const key of ["SMask", "Mask", "Interpolate", "Intent", "OC", "Metadata", "StructParent"]) {
        const v = d.get(N(key));
        if (v) dict[key] = v;
      }
      ctx.assign(ref, ctx.stream(enc.bytes, dict));
      optimised++;
    } catch (e) {
      if (e instanceof RangeError) throw new PdfError("memory", "Your device ran out of memory processing this PDF. Try a smaller file or a computer.");
      // Any single image that can't be processed is left exactly as it was.
    } finally {
      bitmap?.close();
    }
  }

  // Deflate any uncompressed streams (commonly page content streams).
  if (plainStreams.length) {
    const { zlibSync } = await import("fflate");
    for (const [ref, stream] of plainStreams) {
      if (stream.contents.length < 256) continue;
      const packed = zlibSync(stream.contents, { level: 9 });
      if (packed.length >= stream.contents.length * 0.95) continue;
      const dict = stream.dict.clone(ctx);
      dict.set(N("Filter"), N("FlateDecode"));
      dict.delete(N("DecodeParms"));
      ctx.assign(ref, PDFRawStream.of(dict, packed));
    }
  }

  onProgress?.({ phase: "saving", done: imageRefs.length, total: imageRefs.length });
  await tick();
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
  return { bytes, pages: doc.getPageCount(), imagesFound: imageRefs.length, imagesOptimised: optimised };
}
