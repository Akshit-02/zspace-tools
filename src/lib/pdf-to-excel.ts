/**
 * PDF → table data, in the browser: positioned text from pdf.js (or OCR word
 * boxes for scanned pages) → table detection (pdf-tables.ts).
 */
import type { PDFDocumentProxy } from "pdfjs-dist";
import { readItems } from "./pdf-to-docx";
import { extractTables, pageRows, type ExtractedTable, type PageText } from "./pdf-tables";
import type { LangCode } from "./ocr";

export interface ExcelExtraction {
  tables: ExtractedTable[];
  pages: { page: number; rows: string[][] }[];
  scanned: number[];
  ocrPages: number[];
}

export class Cancelled extends Error {}

export async function extractFromPdf(
  doc: PDFDocumentProxy,
  lib: typeof import("pdfjs-dist"),
  pageNumbers: number[],
  o: { ocr: boolean; langs: LangCode[]; onProgress?: (done: number, total: number, label: string) => void; signal?: { cancelled: boolean } },
): Promise<ExcelExtraction> {
  const texts: PageText[] = [];
  const scanned: number[] = [];
  const ocrPages: number[] = [];
  let ocr: typeof import("./ocr") | null = null;
  for (let i = 0; i < pageNumbers.length; i++) {
    if (o.signal?.cancelled) throw new Cancelled();
    const n = pageNumbers[i];
    o.onProgress?.(i, pageNumbers.length, `Reading page ${n}…`);
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale: 1 });
    let items = await readItems(page, lib, vp.transform as [number, number, number, number, number, number]);
    const chars = items.reduce((a, it) => a + it.str.trim().length, 0);
    if (chars < 20) {
      scanned.push(n);
      if (o.ocr) {
        o.onProgress?.(i, pageNumbers.length, `Recognising text on page ${n} (OCR)…`);
        ocr ??= await import("./ocr");
        const k = Math.min(3, 3500 / Math.max(vp.width, vp.height));
        const v2 = page.getViewport({ scale: k });
        const c = document.createElement("canvas");
        c.width = Math.floor(v2.width);
        c.height = Math.floor(v2.height);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvas: c, canvasContext: ctx, viewport: v2 }).promise;
        try {
          items = await ocr.recognizeItems(c, o.langs, k);
          ocrPages.push(n);
        } finally {
          c.width = c.height = 0;
        }
      }
    }
    page.cleanup();
    texts.push({ page: n, items, w: vp.width, h: vp.height });
    await new Promise((r) => setTimeout(r, 0));
  }
  return { tables: extractTables(texts), pages: texts.map((t) => ({ page: t.page, rows: pageRows(t.items) })).filter((p) => p.rows.length), scanned, ocrPages };
}
