/**
 * Reads a workbook into a print-ready model: displayed text (Excel number
 * formats via SSF), fonts, fills, borders, alignment, merges, column widths,
 * row heights, hidden rows/columns and images. Formulas are never evaluated —
 * the value Excel saved with the file is used.
 */
import SSF from "ssf";
import type { Workbook, Worksheet, Cell as XCell, Color } from "exceljs";

export interface Border {
  w: number;
  color: string;
  dash?: number[];
}
export interface CellModel {
  text: string;
  isNum: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  size: number;
  color: string;
  fill?: string;
  h: "left" | "center" | "right" | "general";
  v: "top" | "middle" | "bottom";
  wrap: boolean;
  indent: number;
  border: { t?: Border; r?: Border; b?: Border; l?: Border };
}
export interface ImageModel {
  c: number; // fractional column of top-left
  r: number; // fractional row of top-left
  wPt: number;
  hPt: number;
  bytes: Uint8Array;
  ext: "png" | "jpeg";
}
export interface SheetModel {
  name: string;
  hidden: boolean;
  rows: number;
  cols: number;
  colW: number[]; // pt
  rowH: number[]; // pt
  hiddenCols: Set<number>;
  hiddenRows: Set<number>;
  cells: Map<string, CellModel>;
  merges: { r0: number; c0: number; r1: number; c1: number }[];
  images: ImageModel[];
  titleRows: number; // rows repeated at the top of each printed page (from the workbook)
  landscape?: boolean;
  gridlines: boolean;
  missingResults: number;
  conditional: boolean;
}
export interface WorkbookModel {
  sheets: SheetModel[];
  charts: boolean;
  warnings: string[];
}

export const key = (r: number, c: number) => `${r},${c}`;

/* ---------------- Colours ---------------- */

// Office default theme: lt1, dk1, lt2, dk2, accent1–6
const THEME = ["FFFFFF", "000000", "E7E6E6", "44546A", "4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"];
// Legacy indexed palette (the common entries)
const INDEXED: Record<number, string> = { 0: "000000", 1: "FFFFFF", 2: "FF0000", 3: "00FF00", 4: "0000FF", 5: "FFFF00", 6: "FF00FF", 7: "00FFFF", 8: "000000", 9: "FFFFFF", 10: "FF0000", 11: "00FF00", 12: "0000FF", 13: "FFFF00", 14: "FF00FF", 15: "00FFFF", 16: "800000", 17: "008000", 18: "000080", 19: "808000", 20: "800080", 21: "008080", 22: "C0C0C0", 23: "808080", 64: "000000", 65: "FFFFFF" };

function tint(hex: string, t: number) {
  const n = parseInt(hex, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t));
  return ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
}

export function color(c: Partial<Color> | undefined, fallback?: string): string | undefined {
  if (!c) return fallback;
  const any = c as { argb?: string; theme?: number; tint?: number; indexed?: number };
  let hex: string | undefined;
  if (any.argb && /^[0-9a-f]{8}$/i.test(any.argb)) hex = any.argb.slice(2);
  else if (any.argb && /^[0-9a-f]{6}$/i.test(any.argb)) hex = any.argb;
  else if (typeof any.theme === "number") hex = THEME[any.theme];
  else if (typeof any.indexed === "number") hex = INDEXED[any.indexed];
  if (!hex) return fallback;
  if (any.tint) hex = tint(hex, any.tint);
  return `#${hex.toUpperCase()}`;
}

/* ---------------- Values ---------------- */

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const toSerial = (d: Date, d1904: boolean) => (d.getTime() - EXCEL_EPOCH) / 86400000 - (d1904 ? 1462 : 0);

function fmt(numFmt: string | undefined, v: number) {
  try {
    return SSF.format(numFmt || "General", v);
  } catch {
    return String(v);
  }
}

export function displayText(cell: XCell, d1904: boolean): { text: string; isNum: boolean; missing: boolean } {
  let v: unknown = cell.value;
  let missing = false;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o = v as Record<string, unknown>;
    if ("formula" in o || "sharedFormula" in o) {
      v = o.result;
      if (v === undefined || v === null) missing = true;
      if (v && typeof v === "object" && "error" in (v as object)) v = (v as { error: string }).error;
    } else if ("richText" in o) v = (o.richText as { text: string }[]).map((r) => r.text).join("");
    else if ("text" in o && "hyperlink" in o) v = (o.text as unknown as { richText?: { text: string }[] })?.richText ? (o.text as { richText: { text: string }[] }).richText.map((r) => r.text).join("") : o.text;
    else if ("error" in o) v = o.error;
  }
  if (v === null || v === undefined) return { text: "", isNum: false, missing };
  if (typeof v === "number") return { text: fmt(cell.numFmt, v), isNum: true, missing };
  if (v instanceof Date) return { text: fmt(cell.numFmt || "dd/mm/yyyy", toSerial(v, d1904)), isNum: true, missing };
  if (typeof v === "boolean") return { text: v ? "TRUE" : "FALSE", isNum: false, missing };
  return { text: String(v), isNum: false, missing };
}

/* ---------------- Sheets ---------------- */

const colPt = (chars: number) => (Math.trunc(chars * 7 + 5) * 72) / 96;
const BORDER_W: Record<string, number> = { thin: 0.5, hair: 0.25, dotted: 0.5, dashed: 0.5, dashDot: 0.5, dashDotDot: 0.5, medium: 1, mediumDashed: 1, mediumDashDot: 1, mediumDashDotDot: 1, slantDashDot: 1, thick: 1.5, double: 1.5 };
const DASH: Record<string, number[]> = { dotted: [0.5, 1.5], dashed: [3, 2], mediumDashed: [4, 2], dashDot: [3, 1.5, 0.5, 1.5], hair: [0.5, 0.5] };

function parseRange(ref: string) {
  const m = /^\$?([A-Z]+)\$?(\d+)(?::\$?([A-Z]+)\$?(\d+))?$/i.exec(ref.replace(/^.*!/, "").replace(/'/g, ""));
  if (!m) return null;
  const col = (s: string) => [...s.toUpperCase()].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
  return { c0: col(m[1]), r0: Number(m[2]), c1: col(m[3] ?? m[1]), r1: Number(m[4] ?? m[2]) };
}

function readSheet(wb: Workbook, ws: Worksheet, d1904: boolean): SheetModel {
  const cells = new Map<string, CellModel>();
  let maxR = 0;
  let maxC = 0;
  let missingResults = 0;
  const defaultSize = 11;
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      const { text, isNum, missing } = displayText(cell, d1904);
      if (missing) missingResults++;
      const s = cell.style ?? {};
      const fill = s.fill && s.fill.type === "pattern" && s.fill.pattern === "solid" ? color(s.fill.fgColor) : s.fill && s.fill.type === "pattern" && s.fill.pattern !== "none" ? color(s.fill.fgColor) : undefined;
      const b = s.border ?? {};
      const side = (x?: { style?: string; color?: Partial<Color> }): Border | undefined => (x?.style ? { w: BORDER_W[x.style] ?? 0.5, color: color(x.color, "#000000")!, dash: DASH[x.style] } : undefined);
      const border = { t: side(b.top), r: side(b.right), b: side(b.bottom), l: side(b.left) };
      const hasBorder = !!(border.t || border.r || border.b || border.l);
      if (!text && !fill && !hasBorder) return;
      const a = s.alignment ?? {};
      const f = s.font ?? {};
      cells.set(key(r, c), {
        text,
        isNum,
        bold: !!f.bold,
        italic: !!f.italic,
        underline: !!f.underline,
        strike: !!f.strike,
        size: f.size ?? defaultSize,
        color: color(f.color, "#000000")!,
        fill: fill === "#FFFFFF" && !text ? fill : fill,
        h: a.horizontal === "center" || a.horizontal === "centerContinuous" ? "center" : a.horizontal === "right" ? "right" : a.horizontal === "left" || a.horizontal === "justify" || a.horizontal === "fill" || a.horizontal === "distributed" ? "left" : "general",
        v: a.vertical === "top" ? "top" : a.vertical === "middle" || a.vertical === "distributed" || a.vertical === "justify" ? "middle" : "bottom",
        wrap: !!a.wrapText,
        indent: a.indent ?? 0,
        border,
      });
      if (r > maxR) maxR = r;
      if (c > maxC) maxC = c;
    });
  });
  const merges: SheetModel["merges"] = [];
  const mergeRefs = ((ws as unknown as { model: { merges?: string[] } }).model.merges ?? []) as string[];
  for (const m of mergeRefs) {
    const p = parseRange(m);
    if (p) {
      merges.push({ r0: p.r0, c0: p.c0, r1: p.r1, c1: p.c1 });
      maxR = Math.max(maxR, p.r1);
      maxC = Math.max(maxC, p.c1);
    }
  }
  // Images
  const images: ImageModel[] = [];
  for (const im of ws.getImages()) {
    const media = wb.getImage(Number(im.imageId)) as { buffer?: ArrayBuffer | Uint8Array; base64?: string; extension?: string };
    const ext = media.extension === "png" ? "png" : media.extension === "jpeg" || media.extension === "jpg" ? "jpeg" : null;
    if (!ext) continue;
    const bytes = media.buffer ? new Uint8Array(media.buffer as ArrayBuffer) : media.base64 ? Uint8Array.from(atob(media.base64.replace(/^data:.*?,/, "")), (ch) => ch.charCodeAt(0)) : null;
    if (!bytes) continue;
    const range = im.range as unknown as { tl: { nativeCol?: number; nativeRow?: number; col: number; row: number }; br?: { col: number; row: number }; ext?: { width: number; height: number } };
    images.push({ c: range.tl.col + 1, r: range.tl.row + 1, wPt: range.ext ? (range.ext.width * 72) / 96 : 0, hPt: range.ext ? (range.ext.height * 72) / 96 : 0, bytes, ext });
    const brc = range.br ? Math.ceil(range.br.col) : Math.ceil(range.tl.col + 2);
    const brr = range.br ? Math.ceil(range.br.row) : Math.ceil(range.tl.row + 2);
    maxC = Math.max(maxC, brc);
    maxR = Math.max(maxR, brr);
    // Size from the bottom-right anchor if there's no explicit extent (filled in after widths are known).
    if (!range.ext && range.br) (images[images.length - 1] as ImageModel & { br?: { col: number; row: number } }).br = { col: range.br.col + 1, row: range.br.row + 1 };
  }
  // Print area limits the range.
  const pa = ws.pageSetup?.printArea ? parseRange(String(ws.pageSetup.printArea).split(",")[0]) : null;
  const rows = pa ? Math.min(maxR, pa.r1) : maxR;
  const cols = pa ? Math.min(maxC, pa.c1) : maxC;
  const defW = ws.properties?.defaultColWidth ?? 8.43;
  const colW: number[] = [0];
  const hiddenCols = new Set<number>();
  for (let c = 1; c <= cols; c++) {
    const col = ws.getColumn(c);
    if (col.hidden) hiddenCols.add(c);
    colW[c] = colPt(col.width ?? defW);
  }
  const defH = ws.properties?.defaultRowHeight ?? 15;
  const rowH: number[] = [0];
  const hiddenRows = new Set<number>();
  for (let r = 1; r <= rows; r++) {
    const row = ws.getRow(r);
    if (row.hidden) hiddenRows.add(r);
    let h = row.height ?? defH;
    // Excel auto-fits rows with wrapped text unless a height was set.
    if (!row.height) {
      for (let c = 1; c <= cols; c++) {
        const cm = cells.get(key(r, c));
        if (cm?.wrap && cm.text) {
          const perLine = Math.max(1, Math.floor(colW[c] / (cm.size * 0.5)));
          const lines = cm.text.split("\n").reduce((a, l) => a + Math.max(1, Math.ceil(l.length / perLine)), 0);
          h = Math.max(h, lines * cm.size * 1.25 + 3);
        } else if (cm && cm.size > 11) h = Math.max(h, cm.size * 1.35);
      }
    }
    rowH[r] = h;
  }
  for (const im of images as (ImageModel & { br?: { col: number; row: number } })[]) {
    if (im.br && !im.wPt) {
      const x = (c: number) => colW.slice(1, Math.floor(c)).reduce((a, w) => a + w, 0) + (colW[Math.floor(c)] ?? 0) * (c % 1);
      const y = (r: number) => rowH.slice(1, Math.floor(r)).reduce((a, h) => a + h, 0) + (rowH[Math.floor(r)] ?? 0) * (r % 1);
      im.wPt = x(im.br.col) - x(im.c);
      im.hPt = y(im.br.row) - y(im.r);
    }
  }
  const titles = ws.pageSetup?.printTitlesRow ? parseRange(`A${String(ws.pageSetup.printTitlesRow).replace(/\$/g, "").split(":")[0]}:A${String(ws.pageSetup.printTitlesRow).replace(/\$/g, "").split(":").pop()}`) : null;
  return {
    name: ws.name,
    hidden: ws.state !== "visible",
    rows,
    cols,
    colW,
    rowH,
    hiddenCols,
    hiddenRows,
    cells,
    merges: merges.filter((m) => m.r0 <= rows && m.c0 <= cols),
    images,
    titleRows: titles ? titles.r1 : 0,
    // ExcelJS reports "portrait" by default, so only an explicit landscape setting is meaningful.
    landscape: ws.pageSetup?.orientation === "landscape" ? true : undefined,
    gridlines: !!ws.pageSetup?.showGridLines,
    missingResults,
    conditional: ((ws as unknown as { conditionalFormattings?: unknown[] }).conditionalFormattings ?? []).length > 0,
  };
}

export class SheetError extends Error {}

export async function readWorkbook(bytes: Uint8Array, fileName: string, ExcelJS: typeof import("exceljs")): Promise<WorkbookModel> {
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isCfb = [0xd0, 0xcf, 0x11, 0xe0].every((v, i) => bytes[i] === v);
  if (isCfb) throw new SheetError("This is an older .xls file (or a password-protected workbook). Open it in Excel, Google Sheets or LibreOffice, save it as .xlsx, then try again.");
  if (!isZip) {
    if (/\.(csv|txt|tsv)$/i.test(fileName)) return readCsv(new TextDecoder().decode(bytes), fileName);
    throw new SheetError("This doesn't look like an Excel file. Choose an .xlsx or .csv file.");
  }
  const JSZip = (await import("jszip")).default;
  let zip: import("jszip");
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new SheetError("This file couldn't be opened. It may be damaged or incomplete.");
  }
  if (!zip.file("xl/workbook.xml")) throw new SheetError("This is a zip file but not an Excel workbook. Choose an .xlsx file.");
  const charts = Object.keys(zip.files).some((f) => f.startsWith("xl/charts/"));
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  } catch {
    throw new SheetError("This workbook couldn't be read. It may be damaged, or use features we can't read.");
  }
  const d1904 = !!(wb.properties as { date1904?: boolean }).date1904;
  const sheets = wb.worksheets.map((ws) => readSheet(wb, ws, d1904));
  const warnings: string[] = [];
  if (charts) warnings.push("Charts aren't included in the PDF — only cell data, formatting and pictures.");
  const missing = sheets.reduce((a, s) => a + s.missingResults, 0);
  if (missing) warnings.push(`${missing} formula cell${missing === 1 ? " has" : "s have"} no saved result, so ${missing === 1 ? "it shows" : "they show"} blank. Open and save the file in Excel to store the results.`);
  if (sheets.some((s) => s.conditional)) warnings.push("Conditional formatting (colour scales, data bars, rules) isn't applied.");
  return { sheets, charts, warnings };
}

async function readCsv(text: string, fileName: string): Promise<WorkbookModel> {
  const Papa = (await import("papaparse")).default;
  const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: false });
  const data = res.data.filter((r, i, a) => i < a.length - 1 || r.some((c) => c !== ""));
  const cells = new Map<string, CellModel>();
  let cols = 0;
  const widths: number[] = [];
  data.forEach((row, ri) =>
    row.forEach((v, ci) => {
      if (v === "") return;
      const num = /^-?\d[\d,]*(\.\d+)?$/.test(v.trim());
      cells.set(key(ri + 1, ci + 1), { text: v, isNum: num, bold: false, italic: false, underline: false, strike: false, size: 11, color: "#000000", h: "general", v: "bottom", wrap: false, indent: 0, border: {} });
      cols = Math.max(cols, ci + 1);
      widths[ci + 1] = Math.max(widths[ci + 1] ?? 8.43, Math.min(50, v.length * 1.1 + 1));
    }),
  );
  const rows = data.length;
  return {
    sheets: [{ name: fileName.replace(/\.[^.]+$/, "") || "Sheet1", hidden: false, rows, cols, colW: [0, ...Array.from({ length: cols }, (_, i) => colPt(widths[i + 1] ?? 8.43))], rowH: [0, ...Array(rows).fill(15)], hiddenCols: new Set(), hiddenRows: new Set(), cells, merges: [], images: [], titleRows: 0, gridlines: true, missingResults: 0, conditional: false }],
    charts: false,
    warnings: [],
  };
}
