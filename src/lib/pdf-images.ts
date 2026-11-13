/**
 * PDF page → JPG/PNG rendering with pdf.js. Pages are rendered one at a time
 * onto a canvas sized for the chosen DPI, encoded, and the canvas is released
 * immediately so memory stays flat even for long documents.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

export type ImageFormat = "image/jpeg" | "image/png";
export const DPI_PRESETS = [72, 150, 300] as const;

/** Largest canvas we create: inside Safari/iOS's ~16.7 MP limit. */
export const MAX_PIXELS = 16_000_000;
export const MAX_SIDE = 16_384;

/** Pixel size for a page of `wPt × hPt` points at `dpi`, scaled down if it would exceed canvas limits. */
export function planSize(wPt: number, hPt: number, dpi: number) {
  let scale = dpi / 72;
  let w = Math.round(wPt * scale);
  let h = Math.round(hPt * scale);
  let capped = false;
  const k = Math.min(1, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_PIXELS / (w * h)));
  if (k < 1) {
    scale *= k;
    w = Math.floor(wPt * scale);
    h = Math.floor(hPt * scale);
    capped = true;
  }
  return { width: Math.max(1, w), height: Math.max(1, h), scale, dpi: Math.round(scale * 72), capped };
}

export interface RenderOptions {
  dpi: number;
  format: ImageFormat;
  quality: number; // 0–1, JPG only
  /** CSS colour, or "transparent" (PNG only). */
  background: string;
}

export interface PageImage {
  page: number;
  blob: Blob;
  width: number;
  height: number;
  dpi: number;
  capped: boolean;
}

export async function renderPage(doc: PDFDocumentProxy, pageNumber: number, o: RenderOptions): Promise<PageImage> {
  const page = await doc.getPage(pageNumber);
  try {
    const base = page.getViewport({ scale: 1 });
    const plan = planSize(base.width, base.height, o.dpi);
    const viewport = page.getViewport({ scale: plan.scale });
    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext("2d", { alpha: o.format === "image/png" && o.background === "transparent" });
    if (!ctx) throw new Error("Your browser couldn't create a drawing surface for this page.");
    const transparent = o.format === "image/png" && o.background === "transparent";
    if (!transparent) {
      ctx.fillStyle = o.background === "transparent" ? "#ffffff" : o.background; // JPG has no transparency
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    try {
      await page.render({ canvas, canvasContext: ctx, viewport, background: transparent ? "rgba(0,0,0,0)" : undefined }).promise;
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, o.format, o.format === "image/jpeg" ? o.quality : undefined));
      if (!blob) throw new Error(`Page ${pageNumber} couldn't be encoded — it may be too large for this browser.`);
      return { page: pageNumber, blob, width: plan.width, height: plan.height, dpi: plan.dpi, capped: plan.capped };
    } finally {
      canvas.width = canvas.height = 0; // release the bitmap now, not at GC time
    }
  } finally {
    page.cleanup();
  }
}

/** Small JPEG thumbnail (object URL) for the page grid. */
export async function renderThumb(doc: PDFDocumentProxy, pageNumber: number, cssWidth: number) {
  const page = await doc.getPage(pageNumber);
  try {
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, (cssWidth * 2) / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    canvas.width = canvas.height = 0;
    return blob ? URL.createObjectURL(blob) : null;
  } finally {
    page.cleanup();
  }
}

export const outName = (base: string, page: number, total: number, format: ImageFormat) =>
  `${base}-page-${String(page).padStart(String(total).length, "0")}.${format === "image/png" ? "png" : "jpg"}`;

/** Rough decoded-memory estimate, for large-job warnings (4 bytes/pixel while rendering). */
export const megapixels = (w: number, h: number) => (w * h) / 1e6;
