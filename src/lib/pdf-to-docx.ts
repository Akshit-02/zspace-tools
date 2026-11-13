/**
 * PDF → editable DOCX, entirely in the browser.
 * pdf.js supplies positioned text (with font names) and placed images; the
 * layout analyser (pdf-layout.ts) rebuilds lines, paragraphs, headings,
 * alignment, columns and simple tables; the `docx` library writes a real
 * Word document with one section per PDF page (same page size and margins).
 * Scanned pages (images without a text layer) are OCR'd on request, or kept
 * as a page image so nothing silently disappears.
 */
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { analyzePage, isBoldName, isItalicName, wordFont, type Block, type Item, type PageImageRef } from "./pdf-layout";
import type { LangCode } from "./ocr";

export interface ConvertOptions {
  ocr: boolean;
  ocrLangs: LangCode[];
  onProgress?: (done: number, total: number, label: string) => void;
  signal?: { cancelled: boolean };
}

export interface ConvertStats {
  pages: number;
  paragraphs: number;
  headings: number;
  tables: number;
  images: number;
  scannedPages: number[];
  ocrPages: number[];
  emptyPages: number[];
  chars: number;
}

type PdfjsLib = typeof import("pdfjs-dist");
type M = number[];

interface ExtractedImage {
  ref: PageImageRef;
  bytes: Uint8Array;
  type: "png" | "jpg";
}

export class CancelledError extends Error {}

/* ---------------- Page scan (text + images) ---------------- */

async function fontInfo(page: PDFPageProxy, name: string): Promise<{ name: string; bold: boolean; italic: boolean }> {
  try {
    const f = (await new Promise<unknown>((res) => {
      const t = setTimeout(() => res(null), 1500);
      page.commonObjs.get(name, (v: unknown) => {
        clearTimeout(t);
        res(v);
      });
    })) as { name?: string; bold?: boolean; italic?: boolean; black?: boolean } | null;
    const n = f?.name ?? "";
    return { name: n, bold: !!(f?.bold || f?.black) || isBoldName(n), italic: !!f?.italic || isItalicName(n) };
  } catch {
    return { name: "", bold: false, italic: false };
  }
}

export async function readItems(page: PDFPageProxy, lib: PdfjsLib, vt: M): Promise<Item[]> {
  const tc = await page.getTextContent();
  const fonts = new Map<string, { name: string; bold: boolean; italic: boolean }>();
  for (const k of Object.keys(tc.styles)) fonts.set(k, await fontInfo(page, k));
  const items: Item[] = [];
  for (const raw of tc.items) {
    // pdf.js inserts whitespace-only items to bridge gaps; real gaps carry the layout, so skip them.
    if (!("str" in raw) || !raw.str.trim()) continue;
    const t = lib.Util.transform(vt, raw.transform) as M;
    const size = Math.hypot(t[2], t[3]);
    if (size < 1) continue;
    const style = tc.styles[raw.fontName] ?? { fontFamily: "sans-serif", ascent: 0.8 };
    const f = fonts.get(raw.fontName) ?? { name: "", bold: false, italic: false };
    const asc = style.ascent && style.ascent > 0.3 && style.ascent < 1.3 ? style.ascent : 0.8;
    items.push({
      str: raw.str.replace(/\u0000/g, ""),
      x: t[4],
      base: t[5],
      top: t[5] - size * asc,
      w: Math.abs(raw.width) || raw.str.length * size * 0.5,
      size,
      font: wordFont(f.name, style.fontFamily),
      bold: f.bold,
      italic: f.italic,
    });
  }
  return items;
}

function multiply(a: M, b: M): M {
  return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
}

interface RawImage {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8ClampedArray | Uint8Array;
  bitmap?: ImageBitmap;
}

function rawToCanvas(img: RawImage): HTMLCanvasElement | null {
  const { width: w, height: h } = img;
  if (!w || !h || w * h > 40_000_000) return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
    return c;
  }
  if (!img.data) return null;
  const out = ctx.createImageData(w, h);
  const d = out.data;
  const src = img.data;
  if (img.kind === 3) d.set(src.subarray(0, w * h * 4));
  else if (img.kind === 2) {
    for (let i = 0, j = 0; i < w * h; i++, j += 3) {
      d[i * 4] = src[j];
      d[i * 4 + 1] = src[j + 1];
      d[i * 4 + 2] = src[j + 2];
      d[i * 4 + 3] = 255;
    }
  }
  else if (img.kind === 1) {
    const rowBytes = (w + 7) >> 3;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = src[y * rowBytes + (x >> 3)] & (128 >> (x & 7)) ? 255 : 0;
        const o = (y * w + x) * 4;
        d[o] = d[o + 1] = d[o + 2] = v;
        d[o + 3] = 255;
      }
  } else return null;
  ctx.putImageData(out, 0, 0);
  return c;
}

export async function encodeImage(c: HTMLCanvasElement): Promise<{ bytes: Uint8Array; type: "png" | "jpg" } | null> {
  const k = Math.min(1, 2400 / Math.max(c.width, c.height));
  let src = c;
  if (k < 1) {
    src = document.createElement("canvas");
    src.width = Math.round(c.width * k);
    src.height = Math.round(c.height * k);
    const ctx = src.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(c, 0, 0, src.width, src.height);
  }
  const data = src.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, src.width, src.height).data;
  let alpha = false;
  for (let i = 3; i < data.length; i += 16) if (data[i] < 250) {
    alpha = true;
    break;
  }
  const type = alpha ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((r) => src.toBlob(r, type, 0.9));
  if (src !== c) src.width = src.height = 0;
  return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), type: alpha ? "png" : "jpg" } : null;
}

export async function readImages(page: PDFPageProxy, lib: PdfjsLib, vt: M, startId: number): Promise<{ images: ExtractedImage[]; drawOps: number }> {
  const ops = await page.getOperatorList();
  const O = lib.OPS;
  let ctm: M = [1, 0, 0, 1, 0, 0];
  const stack: M[] = [];
  const found: { id: string | RawImage; m: M }[] = [];
  let drawOps = 0;
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === O.save) stack.push(ctm);
    else if (fn === O.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    else if (fn === O.transform) ctm = multiply(ctm, args as M);
    else if (fn === O.paintImageXObject) found.push({ id: args[0] as string, m: ctm });
    else if (fn === O.paintInlineImageXObject) found.push({ id: args[0] as RawImage, m: ctm });
    else if (fn === O.constructPath || fn === O.fill || fn === O.stroke || fn === O.eoFill) drawOps++;
  }
  const out: ExtractedImage[] = [];
  for (const f of found.slice(0, 60)) {
    const m = lib.Util.transform(vt, f.m) as M;
    const xs = [m[4], m[0] + m[4], m[2] + m[4], m[0] + m[2] + m[4]];
    const ys = [m[5], m[1] + m[5], m[3] + m[5], m[1] + m[3] + m[5]];
    const ref = { id: startId + out.length, x: Math.min(...xs), top: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    if (ref.w < 6 || ref.h < 6) continue;
    let raw: RawImage | null = null;
    if (typeof f.id === "string") {
      const id = f.id;
      const objs = id.startsWith("g_") ? page.commonObjs : page.objs;
      raw = (await new Promise<unknown>((res) => {
        const t = setTimeout(() => res(null), 3000);
        try {
          objs.get(id, (v: unknown) => {
            clearTimeout(t);
            res(v);
          });
        } catch {
          res(null);
        }
      })) as RawImage | null;
    } else raw = f.id;
    if (!raw) continue;
    const canvas = rawToCanvas(raw);
    if (!canvas) continue;
    const enc = await encodeImage(canvas);
    canvas.width = canvas.height = 0;
    if (enc) out.push({ ref, ...enc });
  }
  return { images: out, drawOps };
}

async function renderPage(page: PDFPageProxy, maxSide: number) {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(3, maxSide / Math.max(base.width, base.height));
  const vp = page.getViewport({ scale });
  const c = document.createElement("canvas");
  c.width = Math.floor(vp.width);
  c.height = Math.floor(vp.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;
  return c;
}

/** Quick check for scanned pages before converting (first N pages). */
export async function scanSummary(doc: PDFDocumentProxy, maxPages = 30) {
  let textPages = 0;
  let checked = 0;
  for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const chars = tc.items.reduce((a, i) => a + ("str" in i ? i.str.trim().length : 0), 0);
    if (chars >= 20) textPages++;
    checked++;
    page.cleanup();
  }
  return { checked, textPages, scanned: checked - textPages };
}

/* ---------------- DOCX ---------------- */

export async function pdfToDocx(doc: PDFDocumentProxy, lib: PdfjsLib, o: ConvertOptions): Promise<{ blob: Blob; stats: ConvertStats }> {
  const D = await import("docx");
  const stats: ConvertStats = { pages: doc.numPages, paragraphs: 0, headings: 0, tables: 0, images: 0, scannedPages: [], ocrPages: [], emptyPages: [], chars: 0 };
  const sections: import("docx").ISectionOptions[] = [];
  const tw = (pt: number) => Math.round(pt * 20);
  const px = (pt: number) => Math.round((pt * 96) / 72);
  const align = { left: D.AlignmentType.LEFT, center: D.AlignmentType.CENTER, right: D.AlignmentType.RIGHT, justify: D.AlignmentType.JUSTIFIED } as const;
  const heading = [undefined, D.HeadingLevel.HEADING_1, D.HeadingLevel.HEADING_2, D.HeadingLevel.HEADING_3] as const;
  let ocrMod: typeof import("./ocr") | null = null;
  let imgId = 0;

  for (let p = 1; p <= doc.numPages; p++) {
    if (o.signal?.cancelled) throw new CancelledError("cancelled");
    o.onProgress?.(p - 1, doc.numPages, `Reading page ${p} of ${doc.numPages}…`);
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const W = vp.width;
    const H = vp.height;
    const vt = vp.transform as M;
    const { images, drawOps } = await readImages(page, lib, vt, imgId);
    imgId += images.length;
    const items = await readItems(page, lib, vt);
    const chars = items.reduce((a, i) => a + i.str.trim().length, 0);
    stats.chars += chars;
    const children: (import("docx").Paragraph | import("docx").Table)[] = [];
    let margins = { top: 54, right: 54, bottom: 54, left: 54 };
    // A page with (almost) no text layer but with images or drawings is treated as scanned.
    const scanned = chars < 20 && (images.length > 0 || drawOps > 20);

    if (chars === 0 && !scanned) {
      stats.emptyPages.push(p);
    } else if (scanned) {
      stats.scannedPages.push(p);
      if (o.ocr) {
        o.onProgress?.(p - 1, doc.numPages, `Recognising text on page ${p} (OCR)…`);
        ocrMod ??= await import("./ocr");
        const canvas = await renderPage(page, 3000);
        try {
          const r = await ocrMod.recognize(canvas, o.ocrLangs, "auto");
          for (const block of r.text.split(/\n{2,}/).filter((b) => b.trim())) {
            children.push(new D.Paragraph({ spacing: { after: 160 }, children: [new D.TextRun({ text: block.replace(/\s*\n\s*/g, " ") })] }));
            stats.paragraphs++;
          }
          stats.chars += r.text.length;
          stats.ocrPages.push(p);
        } finally {
          canvas.width = canvas.height = 0;
        }
      } else {
        // Keep the page visible as an image so its content isn't lost.
        const canvas = await renderPage(page, 1600);
        const enc = await encodeImage(canvas);
        canvas.width = canvas.height = 0;
        if (enc) {
          const k = Math.min((W - 72) / W, (H - 72) / H);
          children.push(new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ type: enc.type, data: enc.bytes, transformation: { width: px(W * k), height: px(H * k) } })] }));
          stats.images++;
        }
      }
      margins = { top: 36, right: 36, bottom: 36, left: 36 };
    } else {
      const { blocks, box } = analyzePage(items, images.map((i) => i.ref), W, H);
      const clamp = (v: number) => Math.min(108, Math.max(18, v));
      margins = { top: clamp(box.top), left: clamp(box.left), right: clamp(W - box.right), bottom: clamp(H - box.bottom) };
      const contentW = W - margins.left - margins.right;
      const imgById = new Map(images.map((i) => [i.ref.id, i]));
      for (const b of blocks as Block[]) {
        if (b.kind === "para") {
          if (!b.runs.length) continue;
          stats.paragraphs++;
          if (b.heading) stats.headings++;
          const first = b.firstLine;
          children.push(
            new D.Paragraph({
              heading: heading[b.heading],
              alignment: align[b.align],
              spacing: { before: tw(b.spaceBefore), after: 0 },
              indent: { left: tw(b.indent), ...(first > 2 ? { firstLine: tw(first) } : first < -2 ? { hanging: tw(-first) } : {}) },
              children: b.runs.map((r) => new D.TextRun({ text: r.text, bold: r.bold, italics: r.italic, size: Math.round(r.size * 2), font: r.font })),
            }),
          );
        } else if (b.kind === "table") {
          stats.tables++;
          const total = b.widths.reduce((a, x) => a + x, 0);
          const k = Math.min(1, contentW / total);
          const widths = b.widths.map((w) => tw(w * k));
          children.push(
            new D.Table({
              width: { size: widths.reduce((a, x) => a + x, 0), type: D.WidthType.DXA },
              columnWidths: widths,
              rows: b.rows.map(
                (cells) =>
                  new D.TableRow({
                    children: cells.map(
                      (runs, ci) =>
                        new D.TableCell({
                          width: { size: widths[ci], type: D.WidthType.DXA },
                          margins: { top: 40, bottom: 40, left: 80, right: 80 },
                          children: [new D.Paragraph({ children: runs.map((r) => new D.TextRun({ text: r.text.trim(), bold: r.bold, italics: r.italic, size: Math.round(r.size * 2), font: r.font })) })],
                        }),
                    ),
                  }),
              ),
            }),
          );
          children.push(new D.Paragraph({ children: [] }));
        } else {
          const im = imgById.get(b.id);
          if (!im) continue;
          const k = Math.min(1, contentW / b.w);
          stats.images++;
          children.push(new D.Paragraph({ alignment: align[b.align], spacing: { before: tw(b.spaceBefore) }, children: [new D.ImageRun({ type: im.type, data: im.bytes, transformation: { width: px(b.w * k), height: px(b.h * k) } })] }));
        }
      }
    }
    page.cleanup();
    if (!children.length) children.push(new D.Paragraph({ children: [] }));
    const landscape = W > H;
    sections.push({
      properties: {
        type: D.SectionType.NEXT_PAGE,
        page: {
          size: { width: tw(landscape ? H : W), height: tw(landscape ? W : H), orientation: landscape ? D.PageOrientation.LANDSCAPE : D.PageOrientation.PORTRAIT },
          margin: { top: tw(margins.top), right: tw(margins.right), bottom: tw(margins.bottom), left: tw(margins.left) },
        },
      },
      children,
    });
    await new Promise((r) => setTimeout(r, 0));
  }
  o.onProgress?.(doc.numPages, doc.numPages, "Writing the Word document…");
  const black = { run: { color: "000000" } };
  const document = new D.Document({
    creator: "ZSpace Tools",
    description: "Converted from PDF with ZSpace Tools",
    styles: { default: { heading1: black, heading2: black, heading3: black, document: { run: { font: "Arial" } } } },
    sections,
  });
  return { blob: await D.Packer.toBlob(document), stats };
}
