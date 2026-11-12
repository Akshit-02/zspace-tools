/** Shared PDF helpers (pdf-lib) used by every PDF tool. */
import { EncryptedPDFError, PDFDocument } from "pdf-lib";

export class PdfError extends Error {
  constructor(
    public code: "not-pdf" | "encrypted" | "damaged" | "memory" | "empty",
    message: string,
  ) {
    super(message);
  }
}

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function hasPdfHeader(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes.subarray(0, 1024) : new Uint8Array(bytes, 0, Math.min(1024, bytes.byteLength));
  return new TextDecoder("latin1").decode(view).includes("%PDF-");
}

/** Loads a PDF and converts every failure into a clear, user-facing PdfError. */
export async function loadPdf(input: ArrayBuffer | Uint8Array, name = "This file"): Promise<PDFDocument> {
  if (!hasPdfHeader(input)) throw new PdfError("not-pdf", `${name} isn't a PDF. Choose a file that ends in .pdf.`);
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input, { updateMetadata: false, throwOnInvalidObject: false });
  } catch (e) {
    if (e instanceof EncryptedPDFError || (e instanceof Error && /encrypt/i.test(e.message))) {
      throw new PdfError(
        "encrypted",
        `${name} is password-protected or encrypted. Remove the protection in the app you used to create it, then try again.`,
      );
    }
    throw new PdfError("damaged", `${name} couldn't be opened. It may be damaged or use a structure the browser can't read.`);
  }
  if (doc.getPageCount() === 0) throw new PdfError("empty", `${name} has no pages.`);
  return doc;
}

export type PageRange = [start: number, end: number]; // 1-based, inclusive

/**
 * Parses "1, 3, 5-8" into ranges. Validates against the page count.
 * Accepts en/em dashes, spaces, and open ranges ("5-" = 5 to the end, "-3" = 1 to 3).
 */
export function parsePageRanges(input: string, pageCount: number): { ranges: PageRange[] } | { error: string } {
  const text = input.trim();
  if (!text) return { error: "Enter the pages to extract, for example 1, 3, 5-8." };
  const ranges: PageRange[] = [];
  for (const raw of text.split(/[,;]+/)) {
    const part = raw.trim().replace(/[–—]/g, "-").replace(/\s+/g, "");
    if (!part) continue;
    const m = part.match(/^(\d*)-(\d*)$|^(\d+)$/);
    if (!m || (m[1] === "" && m[2] === "")) return { error: `"${raw.trim()}" isn't a page number or range. Use numbers like 3 or 5-8.` };
    const start = m[3] ? Number(m[3]) : m[1] ? Number(m[1]) : 1;
    const end = m[3] ? Number(m[3]) : m[2] ? Number(m[2]) : pageCount;
    if (start < 1 || end < 1) return { error: "Page numbers start at 1." };
    if (start > pageCount || end > pageCount) {
      return { error: `Page ${Math.max(start, end)} doesn't exist — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.` };
    }
    if (start > end) return { error: `"${raw.trim()}" runs backwards. Write it as ${end}-${start}.` };
    ranges.push([start, end]);
  }
  if (!ranges.length) return { error: "Enter the pages to extract, for example 1, 3, 5-8." };
  return { ranges };
}

export function expandRanges(ranges: PageRange[]) {
  return ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i));
}

/** Compresses a sorted page list back into "1-3, 7, 9-10". */
export function formatPageList(pages: number[]) {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    out.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j;
  }
  return out.join(", ");
}

export function rangeLabel([a, b]: PageRange) {
  return a === b ? `page ${a}` : `pages ${a}-${b}`;
}

/** Builds a new PDF containing the given 1-based pages (in the given order). */
export async function extractPages(src: PDFDocument, pages: number[]) {
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pages.map((p) => p - 1));
  copied.forEach((p) => out.addPage(p));
  return out;
}

export function setProducer(doc: PDFDocument, title?: string) {
  doc.setProducer("ZSpace Tools (pdf-lib)");
  doc.setCreator("ZSpace Tools");
  if (title) doc.setTitle(title);
}

export const tick = () => new Promise((r) => setTimeout(r, 0));
