/**
 * Builds a new PDF from a list of page references (reordered, duplicated,
 * rotated, or a subset). Real pages are copied with pdf-lib — content, links
 * and annotations on each page are kept — and rotation is written to /Rotate.
 */
import { PdfError, loadPdf } from "./pdf-utils";

export interface PageItem {
  id: string;
  src: number; // 0-based index in the original
  rot: 0 | 90 | 180 | 270; // added rotation, clockwise
}

export async function buildOrganized(bytes: Uint8Array, items: PageItem[]) {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const src = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const copies = await out.copyPages(src, items.map((i) => i.src));
  copies.forEach((p, k) => {
    p.setRotation(degrees((((p.getRotation().angle + items[k].rot) % 360) + 360) % 360));
    out.addPage(p);
  });
  const title = src.getTitle();
  if (title) out.setTitle(title);
  out.setProducer("ZSpace Tools");
  return out.save({ useObjectStreams: true });
}

/* ---------------- Rotate PDF ---------------- */

export type QuarterTurn = 0 | 90 | 180 | 270;

/** Adds a turn (any multiple of 90°, negative = anticlockwise) and normalises to 0–270. */
export const addTurn = (current: number, delta: number) => ((((Math.round(current / 90) * 90 + delta) % 360) + 360) % 360) as QuarterTurn;

export type RotateScope = "all" | "odd" | "even" | "selected" | "landscape" | "portrait";

/**
 * 0-based page indexes for a rotate action. Odd/even are 1-based page numbers
 * (page 1 is odd). Landscape/portrait use the page as it will look after the
 * rotation already added, so "rotate landscape pages" can fix sideways scans.
 */
export function pagesFor(scope: RotateScope, sizes: { w: number; h: number }[], added: number[], selected: Iterable<number>): number[] {
  const all = sizes.map((_, i) => i);
  switch (scope) {
    case "all":
      return all;
    case "odd":
      return all.filter((i) => i % 2 === 0);
    case "even":
      return all.filter((i) => i % 2 === 1);
    case "selected":
      return [...new Set(selected)].filter((i) => i >= 0 && i < sizes.length).sort((a, b) => a - b);
    case "landscape":
    case "portrait":
      return all.filter((i) => {
        const turned = (added[i] ?? 0) % 180 !== 0;
        const w = turned ? sizes[i].h : sizes[i].w;
        const h = turned ? sizes[i].w : sizes[i].h;
        return scope === "landscape" ? w > h : h > w;
      });
  }
}

/**
 * Writes the added rotation (relative to each page's existing /Rotate) into the
 * original document in place. Page order, content, links, form fields,
 * bookmarks and document metadata are untouched; pages with no added rotation
 * are left exactly as they were. Rotation is never applied twice: `added` is
 * always relative to the file as it was opened.
 */
export async function rotatePages(bytes: Uint8Array, added: number[], name?: string) {
  const { degrees } = await import("pdf-lib");
  const doc = await loadPdf(bytes, name);
  let out: Uint8Array;
  try {
    doc.getPages().forEach((p, i) => {
      const a = added[i] ?? 0;
      if (a % 360 === 0) return;
      p.setRotation(degrees(addTurn(p.getRotation().angle, a)));
    });
    doc.setModificationDate(new Date());
    out = await doc.save({ useObjectStreams: true });
  } catch {
    // pdf-lib reads damaged files leniently and fails later with internal errors.
    throw new PdfError("damaged", `${name ?? "This file"} couldn't be opened. It may be damaged or use a structure the browser can't read.`);
  }
  // Re-open the result so a broken file is reported instead of downloaded.
  const check = await loadPdf(out, name);
  if (check.getPageCount() !== doc.getPageCount()) throw new Error("The rotated PDF didn't verify. Please try again.");
  return out;
}
