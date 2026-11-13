/**
 * Builds a new PDF from a list of page references (reordered, duplicated,
 * rotated, or a subset). Real pages are copied with pdf-lib — content, links
 * and annotations on each page are kept — and rotation is written to /Rotate.
 */
import { loadPdf } from "./pdf-utils";

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
