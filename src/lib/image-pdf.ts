/** Image → PDF: page layout (pure) and PDF assembly with pdf-lib. */
import { clip, endPath, popGraphicsState, pushGraphicsState, rectangle } from "pdf-lib";
import { decodeImage, dims, encodeCanvas, jpegOrientation, normaliseType, releaseImage } from "./image-utils";
import { setProducer, tick } from "./pdf-utils";

export type PageSize = "a4" | "letter" | "fit" | "custom";
export type Orientation = "auto" | "portrait" | "landscape";
export type Placement = "fit" | "fill" | "original";

export interface PdfPageSettings {
  size: PageSize;
  customW: number; // mm
  customH: number; // mm
  orientation: Orientation;
  margin: number; // mm
  placement: Placement;
}

const MM = 72 / 25.4; // points per millimetre
const PX = 0.75; // points per CSS pixel (96 dpi)

export const PAGE_SIZES: Record<"a4" | "letter", { w: number; h: number; label: string }> = {
  a4: { w: 595.28, h: 841.89, label: "A4" },
  letter: { w: 612, h: 792, label: "Letter" },
};

export interface Layout {
  pageW: number;
  pageH: number;
  /** Image rectangle in PDF points (origin bottom-left). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Content box (inside margins); used to clip "fill". */
  box: { x: number; y: number; w: number; h: number };
}

export function layoutPage(imgW: number, imgH: number, s: PdfPageSettings): Layout {
  const m = Math.max(0, s.margin) * MM;
  let pageW: number;
  let pageH: number;
  if (s.size === "fit") {
    pageW = imgW * PX + 2 * m;
    pageH = imgH * PX + 2 * m;
  } else {
    const base = s.size === "custom" ? { w: s.customW * MM, h: s.customH * MM } : PAGE_SIZES[s.size];
    const short = Math.min(base.w, base.h);
    const long = Math.max(base.w, base.h);
    const landscape = s.orientation === "landscape" || (s.orientation === "auto" && imgW > imgH);
    if (s.size === "custom" && s.orientation === "auto") {
      pageW = base.w;
      pageH = base.h;
    } else {
      pageW = landscape ? long : short;
      pageH = landscape ? short : long;
    }
  }
  const box = { x: m, y: m, w: Math.max(1, pageW - 2 * m), h: Math.max(1, pageH - 2 * m) };
  let scale: number;
  if (s.size === "fit") scale = PX;
  else if (s.placement === "fill") scale = Math.max(box.w / imgW, box.h / imgH);
  else if (s.placement === "original") scale = Math.min(PX, box.w / imgW, box.h / imgH);
  else scale = Math.min(box.w / imgW, box.h / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { pageW, pageH, w, h, x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, box };
}

export interface Prepared {
  kind: "jpg" | "png";
  bytes: Uint8Array;
  width: number;
  height: number;
  reencoded: boolean;
}

/** Converts an input image into bytes pdf-lib can embed, re-encoding only when necessary. */
export async function prepareImage(file: File): Promise<Prepared> {
  const type = normaliseType(file);
  if (!type) throw new Error("Unsupported format. Use JPG, PNG or WebP.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let src;
  try {
    src = await decodeImage(file);
  } catch {
    throw new Error("This image couldn't be read. It may be damaged or not a real image file.");
  }
  try {
    const { width, height } = dims(src);
    if (type === "image/jpeg" && jpegOrientation(bytes) === 1) return { kind: "jpg", bytes, width, height, reencoded: false };
    if (type === "image/png") return { kind: "png", bytes, width, height, reencoded: false };
    // WebP (not supported inside PDF) or a rotated JPEG: draw upright and re-encode.
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    let alpha = false;
    if (type === "image/webp") {
      const data = ctx.getImageData(0, 0, width, height).data;
      for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 255) { alpha = true; break; }
    }
    const blob = alpha ? await encodeCanvas(canvas, "image/png") : await encodeCanvas(canvas, "image/jpeg", 0.92);
    canvas.width = canvas.height = 0;
    return { kind: alpha ? "png" : "jpg", bytes: new Uint8Array(await blob.arrayBuffer()), width, height, reencoded: true };
  } finally {
    releaseImage(src);
  }
}

export async function buildPdf(files: File[], s: PdfPageSettings, title: string, onProgress?: (done: number) => void) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  setProducer(doc, title);
  for (let i = 0; i < files.length; i++) {
    const img = await prepareImage(files[i]);
    const embedded = img.kind === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    const l = layoutPage(img.width, img.height, s);
    const page = doc.addPage([l.pageW, l.pageH]);
    const needsClip = l.w > l.box.w + 0.01 || l.h > l.box.h + 0.01;
    if (needsClip) page.pushOperators(pushGraphicsState(), rectangle(l.box.x, l.box.y, l.box.w, l.box.h), clip(), endPath());
    page.drawImage(embedded, { x: l.x, y: l.y, width: l.w, height: l.h });
    if (needsClip) page.pushOperators(popGraphicsState());
    onProgress?.(i + 1);
    await tick();
  }
  const bytes = await doc.save({ useObjectStreams: true });
  const check = await PDFDocument.load(bytes);
  if (check.getPageCount() !== files.length) throw new Error("The PDF was created with the wrong number of pages.");
  return bytes;
}
