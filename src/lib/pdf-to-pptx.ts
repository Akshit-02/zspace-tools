/**
 * PDF → PowerPoint (PPTX) with pptxgenjs, in the browser.
 *
 * "Layout" mode: each page is rendered with pdf.js to a high-resolution image
 * and placed on its own slide — looks exactly like the PDF, not editable.
 *
 * "Editable" mode: text is rebuilt as PowerPoint text boxes (paragraphs,
 * headings, bold/italic, alignment, simple tables) using the same layout
 * analysis as PDF to Word. The page's graphics can be kept as a background
 * picture rendered *without* its text, so the slide still looks right while
 * the text stays editable. Scanned pages become picture slides; with OCR their
 * recognised text is added to the speaker notes.
 */
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { analyzePage, type Run } from "./pdf-layout";
import { readImages, readItems } from "./pdf-to-docx";
import type { LangCode } from "./ocr";

export type SlideSize = "match" | "16:9" | "4:3";
export interface PptOptions {
  mode: "layout" | "editable";
  size: SlideSize;
  dpi: number;
  background: boolean;
  ocr: boolean;
  langs: LangCode[];
  onProgress?: (done: number, total: number, label: string) => void;
  signal?: { cancelled: boolean };
}
export interface PptResult {
  bytes: Uint8Array;
  slides: number;
  scanned: number[];
  ocrPages: number[];
  textBoxes: number;
  previews: string[]; // data URLs of rendered slide images (layout mode, first few)
  slideW: number;
  slideH: number;
}

export class PptCancelled extends Error {}

type M = [number, number, number, number, number, number];
const MAX_IN = 56;

export function slideSize(size: SlideSize, firstW: number, firstH: number) {
  if (size === "16:9") return { w: 13.333, h: 7.5 };
  if (size === "4:3") return { w: 10, h: 7.5 };
  // Match the first page's shape, at its real size (clamped to PowerPoint's 1–56 inch limits).
  let w = firstW / 72;
  let h = firstH / 72;
  const k = Math.min(1, MAX_IN / Math.max(w, h));
  w *= k;
  h *= k;
  const up = Math.max(1, 1 / Math.min(w, h));
  return { w: Math.round(w * up * 1000) / 1000, h: Math.round(h * up * 1000) / 1000 };
}

/** Fits a page (pt) inside the slide (inches) without stretching; returns scale (in/pt) and offsets. */
export function fit(pageW: number, pageH: number, slideW: number, slideH: number) {
  const k = Math.min(slideW / pageW, slideH / pageH);
  return { k, ox: (slideW - pageW * k) / 2, oy: (slideH - pageH * k) / 2 };
}

async function render(page: PDFPageProxy, dpi: number, withText: boolean) {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(dpi / 72, Math.sqrt(16_000_000 / (base.width * base.height)));
  const vp = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.floor(vp.width);
  c.height = Math.floor(vp.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  if (!withText) {
    // Draw the page's graphics but not its text (the text becomes editable boxes).
    ctx.fillText = () => undefined;
    ctx.strokeText = () => undefined;
  }
  await page.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;
  const url = c.toDataURL("image/jpeg", 0.9);
  c.width = c.height = 0;
  return url;
}

const runOpts = (r: Run, k: number) => ({ text: r.text, options: { bold: r.bold, italic: r.italic, fontSize: Math.max(4, Math.round(r.size * k * 72 * 10) / 10), fontFace: r.font, color: "1F1F1F" } });

export async function pdfToPptx(doc: PDFDocumentProxy, lib: typeof import("pdfjs-dist"), pages: number[], o: PptOptions): Promise<PptResult> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  const first = await doc.getPage(pages[0]);
  const fv = first.getViewport({ scale: 1 });
  const S = slideSize(o.size, fv.width, fv.height);
  first.cleanup();
  pptx.defineLayout({ name: "ZSPACE", width: S.w, height: S.h });
  pptx.layout = "ZSPACE";
  pptx.author = "ZSpace Tools";
  pptx.company = "";
  pptx.title = "Converted from PDF";
  const res: PptResult = { bytes: new Uint8Array(), slides: 0, scanned: [], ocrPages: [], textBoxes: 0, previews: [], slideW: S.w, slideH: S.h };
  let ocr: typeof import("./ocr") | null = null;

  for (let i = 0; i < pages.length; i++) {
    if (o.signal?.cancelled) throw new PptCancelled();
    const n = pages[i];
    o.onProgress?.(i, pages.length, `Converting page ${n}…`);
    const page = await doc.getPage(n);
    const vp = page.getViewport({ scale: 1 });
    const { k, ox, oy } = fit(vp.width, vp.height, S.w, S.h);
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    const box = { x: ox, y: oy, w: vp.width * k, h: vp.height * k };

    if (o.mode === "layout") {
      const img = await render(page, o.dpi, true);
      slide.addImage({ data: img, ...box });
      if (res.previews.length < 12) res.previews.push(img);
    } else {
      const vt = vp.transform as M;
      const items = await readItems(page, lib, vt);
      const chars = items.reduce((a, it) => a + it.str.trim().length, 0);
      if (chars < 20) {
        // Scanned (or no text layer): keep the page as a picture; OCR text goes into the notes.
        res.scanned.push(n);
        slide.addImage({ data: await render(page, o.dpi, true), ...box });
        if (o.ocr) {
          o.onProgress?.(i, pages.length, `Recognising text on page ${n} (OCR)…`);
          ocr ??= await import("./ocr");
          const scale = Math.min(3, 3000 / Math.max(vp.width, vp.height));
          const v2 = page.getViewport({ scale });
          const c = document.createElement("canvas");
          c.width = Math.floor(v2.width);
          c.height = Math.floor(v2.height);
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          await page.render({ canvas: c, canvasContext: ctx, viewport: v2 }).promise;
          try {
            const r = await ocr.recognize(c, o.langs, "auto");
            if (r.text.trim()) slide.addNotes(`Text recognised on this page (check it before use):\n\n${r.text}`);
            res.ocrPages.push(n);
          } finally {
            c.width = c.height = 0;
          }
        }
      } else {
        const { images } = await readImages(page, lib, vt, 0);
        if (o.background) slide.addImage({ data: await render(page, o.dpi, false), ...box });
        else
          for (const im of images) {
            const b64 = btoa(Array.from(im.bytes, (b) => String.fromCharCode(b)).join(""));
            slide.addImage({ data: `image/${im.type === "jpg" ? "jpeg" : "png"};base64,${b64}`, x: ox + im.ref.x * k, y: oy + im.ref.top * k, w: im.ref.w * k, h: im.ref.h * k });
          }
        const { blocks } = analyzePage(items, o.background ? [] : images.map((x) => x.ref), vp.width, vp.height);
        for (const b of blocks) {
          if (b.kind === "para") {
            if (!b.runs.length) continue;
            const left = b.left + b.indent;
            const width = Math.max(20, b.right - left + b.size);
            slide.addText(
              b.runs.map((r) => runOpts(r, k)),
              { x: ox + left * k, y: oy + (b.top - b.size * 0.25) * k, w: width * k, h: Math.max(b.bottom - b.top + b.size * 0.6, b.size * 1.3) * k, align: b.align === "justify" ? "justify" : b.align, valign: "top", margin: 0, fit: "none", wrap: true, lineSpacingMultiple: 1.0 },
            );
            res.textBoxes++;
          } else if (b.kind === "table") {
            slide.addTable(
              b.rows.map((row) => row.map((cell) => ({ text: cell.map((r) => r.text).join(" ").trim(), options: { bold: cell.some((r) => r.bold), fontSize: Math.max(4, Math.round((cell[0]?.size ?? 10) * k * 72 * 10) / 10), fontFace: cell[0]?.font ?? "Arial" } }))),
              { x: ox + b.left * k, y: oy + b.top * k, colW: b.widths.map((w) => w * k), border: { type: "solid", pt: 0.5, color: "BFBFBF" }, margin: 0.03 },
            );
            res.textBoxes++;
          }
        }
        // Image blocks are skipped: images are already on the slide (as pictures, or in the background).
      }
    }
    page.cleanup();
    res.slides++;
    await new Promise((r) => setTimeout(r, 0));
  }
  o.onProgress?.(pages.length, pages.length, "Writing the PowerPoint file…");
  const out = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  res.bytes = out;
  return res;
}
