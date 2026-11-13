/**
 * Renders a workbook model (xlsx-read.ts) to a real, text-selectable PDF with
 * pdf-lib: page size/orientation/margins, scaling (actual, fit width, fit page),
 * column bands printed "down, then over" like Excel, repeated header rows,
 * merged cells, fills, borders, wrapped/overflowing text, images and page numbers.
 */
import type { PDFDocument, PDFFont, PDFPage } from "pdf-lib";
import { key, type CellModel, type SheetModel, type WorkbookModel } from "./xlsx-read";
import { hexToRgb01, needsShaping, textToPng, wrap } from "./pdf-text";

export const PAPERS = { A4: [595.28, 841.89], A3: [841.89, 1190.55], Letter: [612, 792], Legal: [612, 1008] } as const;
export type Paper = keyof typeof PAPERS;
export type Fit = "actual" | "width" | "page";

export interface PdfOptions {
  paper: Paper;
  orientation: "portrait" | "landscape" | "auto";
  margin: number; // pt, all sides
  fit: Fit;
  repeatRows: number | "auto";
  pageNumbers: boolean;
  gridlines: boolean;
  sheets: number[]; // indexes to include
}

interface Fonts {
  reg: PDFFont;
  bold: PDFFont;
}

const visibleCols = (s: SheetModel) => Array.from({ length: s.cols }, (_, i) => i + 1).filter((c) => !s.hiddenCols.has(c));
const visibleRows = (s: SheetModel) => Array.from({ length: s.rows }, (_, i) => i + 1).filter((r) => !s.hiddenRows.has(r));

/** Splits columns into bands that fit the printable width (each band ≥ 1 column). */
export function bands(widths: number[], max: number): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  let w = 0;
  widths.forEach((cw, i) => {
    if (cur.length && w + cw > max + 0.01) {
      out.push(cur);
      cur = [];
      w = 0;
    }
    cur.push(i);
    w += cw;
  });
  if (cur.length) out.push(cur);
  return out;
}

/** Splits rows into pages; `repeat` leading rows are printed again at the top of each later page. */
export function paginate(heights: number[], max: number, repeat: number): number[][] {
  const head = heights.slice(0, repeat);
  const headH = head.reduce((a, h) => a + h, 0);
  const out: number[][] = [];
  let cur: number[] = [];
  let h = 0;
  heights.forEach((rh, i) => {
    const room = out.length && repeat ? max - headH : max;
    if (cur.length && h + rh > room + 0.01) {
      out.push(cur);
      cur = [];
      h = 0;
    }
    cur.push(i);
    h += rh;
  });
  if (cur.length) out.push(cur);
  if (repeat) for (let p = 1; p < out.length; p++) out[p] = [...Array.from({ length: repeat }, (_, i) => i).filter((i) => !out[p].includes(i)), ...out[p]];
  return out;
}

export interface Layout {
  sheet: number;
  pageW: number;
  pageH: number;
  scale: number;
  cols: number[]; // sheet column numbers
  rows: number[]; // sheet row numbers
}

export function layout(wbm: WorkbookModel, o: PdfOptions): Layout[] {
  const out: Layout[] = [];
  for (const si of o.sheets) {
    const s = wbm.sheets[si];
    if (!s || !s.rows || !s.cols) continue;
    const cols = visibleCols(s);
    const rows = visibleRows(s);
    const totalW = cols.reduce((a, c) => a + s.colW[c], 0);
    const totalH = rows.reduce((a, r) => a + s.rowH[r], 0);
    const [pw0, ph0] = PAPERS[o.paper];
    const land = o.orientation === "landscape" || (o.orientation === "auto" && (s.landscape ?? (totalW > totalH * 1.1 && totalW > pw0 - 2 * o.margin)));
    const [pageW, pageH] = land ? [ph0, pw0] : [pw0, ph0];
    const footer = o.pageNumbers ? 20 : 0;
    const availW = pageW - 2 * o.margin;
    const availH = pageH - 2 * o.margin - footer;
    const scale = o.fit === "actual" ? 1 : o.fit === "width" ? Math.min(1, availW / totalW) : Math.min(1, availW / totalW, availH / totalH);
    const repeat = o.repeatRows === "auto" ? s.titleRows : o.repeatRows;
    const repeatN = rows.filter((r) => r <= repeat).length;
    const colBands = bands(cols.map((c) => s.colW[c] * scale), availW);
    const rowPages = paginate(rows.map((r) => s.rowH[r] * scale), availH, repeatN);
    for (const b of colBands) for (const rp of rowPages) out.push({ sheet: si, pageW, pageH, scale, cols: b.map((i) => cols[i]), rows: rp.map((i) => rows[i]) });
  }
  return out;
}

function rgb(P: typeof import("pdf-lib"), hex: string) {
  const { r, g, b } = hexToRgb01(hex);
  return P.rgb(r, g, b);
}

async function drawPage(P: typeof import("pdf-lib"), doc: PDFDocument, page: PDFPage, s: SheetModel, L: Layout, o: PdfOptions, fonts: Fonts, images: Map<ImageKey, import("pdf-lib").PDFImage>) {
  const k = L.scale;
  const left = o.margin;
  const top = L.pageH - o.margin;
  // x/y of each visible column/row on this page (PDF coordinates, y = top edge)
  const xs = new Map<number, number>();
  let x = left;
  for (const c of L.cols) {
    xs.set(c, x);
    x += s.colW[c] * k;
  }
  const right = x;
  const ys = new Map<number, number>();
  let y = top;
  for (const r of L.rows) {
    ys.set(r, y);
    y -= s.rowH[r] * k;
  }
  const bottom = y;
  const colSet = new Set(L.cols);
  const rowSet = new Set(L.rows);
  const covered = new Set<string>();
  const mergeOf = new Map<string, SheetModel["merges"][number]>();
  for (const m of s.merges) {
    for (let r = m.r0; r <= m.r1; r++) for (let c = m.c0; c <= m.c1; c++) if (r !== m.r0 || c !== m.c0) covered.add(key(r, c));
    mergeOf.set(key(m.r0, m.c0), m);
  }
  // Rect of a cell (or merged range) clipped to this page.
  const rect = (r: number, c: number) => {
    const m = mergeOf.get(key(r, c));
    const cs = m ? L.cols.filter((cc) => cc >= m.c0 && cc <= m.c1) : [c];
    const rs = m ? L.rows.filter((rr) => rr >= m.r0 && rr <= m.r1) : [r];
    if (!cs.length || !rs.length) return null;
    const x0 = xs.get(cs[0])!;
    const x1 = xs.get(cs[cs.length - 1])! + s.colW[cs[cs.length - 1]] * k;
    const y0 = ys.get(rs[0])!;
    const y1 = ys.get(rs[rs.length - 1])! - s.rowH[rs[rs.length - 1]] * k;
    return { x: x0, y: y1, w: x1 - x0, h: y0 - y1 };
  };
  // Merged ranges whose anchor is off this page (e.g. on a previous column band) still draw their part.
  const anchors: [number, number][] = [];
  for (const r of L.rows) for (const c of L.cols) if (!covered.has(key(r, c))) anchors.push([r, c]);
  for (const m of s.merges) {
    if (rowSet.has(m.r0) && colSet.has(m.c0)) continue;
    const r = L.rows.find((rr) => rr >= m.r0 && rr <= m.r1);
    const c = L.cols.find((cc) => cc >= m.c0 && cc <= m.c1);
    if (r !== undefined && c !== undefined) {
      mergeOf.set(key(r, c), { ...m, r0: r, c0: c });
      anchors.push([r, c]);
    }
  }

  // 1. Fills
  for (const [r, c] of anchors) {
    const cm = s.cells.get(key(r, c)) ?? (mergeOf.has(key(r, c)) ? s.cells.get(key(mergeOf.get(key(r, c))!.r0, mergeOf.get(key(r, c))!.c0)) : undefined);
    if (!cm?.fill) continue;
    const b = rect(r, c);
    if (b) page.drawRectangle({ ...{ x: b.x, y: b.y, width: b.w, height: b.h }, color: rgb(P, cm.fill) });
  }
  // 2. Gridlines
  if (o.gridlines) {
    const g = rgb(P, "#D9D9D9");
    for (const c of [...L.cols, -1]) {
      const gx = c === -1 ? right : xs.get(c)!;
      page.drawLine({ start: { x: gx, y: top }, end: { x: gx, y: bottom }, thickness: 0.25, color: g });
    }
    for (const r of [...L.rows, -1]) {
      const gy = r === -1 ? bottom : ys.get(r)!;
      page.drawLine({ start: { x: left, y: gy }, end: { x: right, y: gy }, thickness: 0.25, color: g });
    }
  }
  // 3. Borders
  for (const [r, c] of anchors) {
    const m = mergeOf.get(key(r, c));
    const cm = s.cells.get(key(m ? m.r0 : r, m ? m.c0 : c));
    const b = rect(r, c);
    if (!b || !cm) continue;
    // For merged ranges Excel stores outer borders on the edge cells; use the far cells' sides too.
    const far = m ? s.cells.get(key(m.r1, m.c1)) : cm;
    const sides: [typeof cm.border.t, number, number, number, number][] = [
      [cm.border.t, b.x, b.y + b.h, b.x + b.w, b.y + b.h],
      [far?.border.b ?? cm.border.b, b.x, b.y, b.x + b.w, b.y],
      [cm.border.l, b.x, b.y, b.x, b.y + b.h],
      [far?.border.r ?? cm.border.r, b.x + b.w, b.y, b.x + b.w, b.y + b.h],
    ];
    for (const [bd, x1, y1, x2, y2] of sides) if (bd) page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: bd.w * Math.max(0.5, k), color: rgb(P, bd.color), dashArray: bd.dash });
  }
  // 4. Text
  for (const [r, c] of anchors) {
    const m = mergeOf.get(key(r, c));
    const cm = s.cells.get(key(m ? m.r0 : r, m ? m.c0 : c));
    if (!cm?.text) continue;
    let b = rect(r, c)!;
    if (!b) continue;
    await drawCellText(P, doc, page, cm, b, k, fonts, () => {
      // Non-wrapped text spills into empty neighbours, like Excel.
      if (cm.wrap || m || cm.isNum) return b;
      const align = cm.h === "general" ? "left" : cm.h;
      if (align !== "left") return b;
      let w = b.w;
      for (const cc of L.cols.filter((x) => x > c)) {
        if (s.cells.get(key(r, cc))?.text || covered.has(key(r, cc)) || mergeOf.has(key(r, cc))) break;
        w += s.colW[cc] * k;
      }
      b = { ...b, w };
      return b;
    });
  }
  // 5. Images
  for (const im of s.images) {
    const c0 = Math.floor(im.c);
    const r0 = Math.floor(im.r);
    if (!colSet.has(c0) || !rowSet.has(r0)) continue;
    const ix = xs.get(c0)! + s.colW[c0] * k * (im.c - c0);
    const iy = ys.get(r0)! - s.rowH[r0] * k * (im.r - r0);
    let img = images.get(im);
    if (!img) {
      try {
        img = im.ext === "png" ? await doc.embedPng(im.bytes) : await doc.embedJpg(im.bytes);
        images.set(im, img);
      } catch {
        continue;
      }
    }
    page.drawImage(img, { x: ix, y: iy - im.hPt * k, width: im.wPt * k, height: im.hPt * k });
  }
}
type ImageKey = SheetModel["images"][number];

async function drawCellText(P: typeof import("pdf-lib"), doc: PDFDocument, page: PDFPage, cm: CellModel, box0: { x: number; y: number; w: number; h: number }, k: number, fonts: Fonts, spill: () => { x: number; y: number; w: number; h: number }) {
  const size = cm.size * k;
  const pad = 2 * k + cm.indent * 9 * k;
  const box = spill();
  const font = cm.bold ? fonts.bold : fonts.reg;
  const color = rgb(P, cm.color);
  const align = cm.h === "general" ? (cm.isNum ? "right" : "left") : cm.h;
  const width = (t: string) => font.widthOfTextAtSize(t, size);
  const lines = cm.wrap ? wrap(cm.text, Math.max(4, box0.w - 2 * pad), width) : cm.text.split("\n").slice(0, 1);
  const lh = size * 1.2;
  const blockH = lines.length * lh;
  const yTop = cm.v === "top" ? box.y + box.h - 1.5 * k : cm.v === "middle" ? box.y + box.h / 2 + blockH / 2 : box.y + blockH + 1.5 * k;
  page.pushOperators(P.pushGraphicsState(), P.rectangle(box.x, box.y, box.w, box.h), P.clip(), P.endPath());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const baseline = yTop - i * lh - size * 0.95;
    const shaped = needsShaping(line);
    let w: number;
    try {
      w = shaped ? 0 : width(line);
    } catch {
      w = 0;
    }
    const tx = align === "right" ? box0.x + box0.w - pad - w : align === "center" ? box0.x + (box0.w - w) / 2 : box.x + pad;
    if (shaped) {
      const png = await textToPng([line], size, "sans", cm.bold, cm.color, Math.max(4, box0.w - 2 * pad));
      const img = await doc.embedPng(png.bytes);
      page.drawImage(img, { x: box.x + pad, y: baseline - size * 0.3, width: png.width, height: png.height });
      continue;
    }
    try {
      page.drawText(line, { x: tx, y: baseline, size, font, color, xSkew: cm.italic ? P.degrees(12) : undefined });
    } catch {
      continue; // character the font can't encode
    }
    if (cm.underline) page.drawLine({ start: { x: tx, y: baseline - size * 0.12 }, end: { x: tx + w, y: baseline - size * 0.12 }, thickness: Math.max(0.4, size / 16), color });
    if (cm.strike) page.drawLine({ start: { x: tx, y: baseline + size * 0.3 }, end: { x: tx + w, y: baseline + size * 0.3 }, thickness: Math.max(0.4, size / 16), color });
  }
  page.pushOperators(P.popGraphicsState());
}

export async function workbookToPdf(wbm: WorkbookModel, o: PdfOptions, fontBytes: { reg: Uint8Array; bold: Uint8Array }, onProgress?: (done: number, total: number) => void) {
  const P = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const doc = await P.PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = { reg: await doc.embedFont(fontBytes.reg, { subset: true }), bold: await doc.embedFont(fontBytes.bold, { subset: true }) };
  const pages = layout(wbm, o);
  const images = new Map();
  for (let i = 0; i < pages.length; i++) {
    const L = pages[i];
    const page = doc.addPage([L.pageW, L.pageH]);
    await drawPage(P, doc, page, wbm.sheets[L.sheet], L, o, fonts, images);
    if (o.pageNumbers) {
      const t = `Page ${i + 1} of ${pages.length}`;
      page.drawText(t, { x: (L.pageW - fonts.reg.widthOfTextAtSize(t, 8)) / 2, y: o.margin / 2, size: 8, font: fonts.reg, color: P.rgb(0.47, 0.44, 0.42) });
    }
    onProgress?.(i + 1, pages.length);
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
  }
  if (!pages.length) throw new Error("empty");
  doc.setProducer("ZSpace Tools");
  return { bytes: await doc.save(), pages: pages.length };
}
