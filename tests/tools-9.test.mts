import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import SSF from "ssf";
import { parseCell } from "../src/lib/cell-values";
import { extractTables, pageRows, pageTables } from "../src/lib/pdf-tables";
import { buildXlsx, sheetNames, toCsv } from "../src/lib/xlsx-build";
import { readWorkbook, color, SheetError } from "../src/lib/xlsx-read";
import { bands, layout, paginate, workbookToPdf } from "../src/lib/xlsx-pdf";
import { apply, displayToUser, exportWithOverlays, localToDisplay, mul, type OverlayObject } from "../src/lib/pdf-overlay";
import { baselineOffset, needsShaping, wrap } from "../src/lib/pdf-text";
import { buildOrganized } from "../src/lib/pdf-organize";
import type { Item } from "../src/lib/pdf-layout";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const ok = (name: string, c: boolean, info?: unknown) => eq(name + (c || info === undefined ? "" : ` (${JSON.stringify(info).slice(0, 400)})`), c, true);
const near = (a: number, b: number, t = 0.05) => Math.abs(a - b) <= t;
const fx = (f: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${f}`, import.meta.url)));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
async function texts(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), verbosity: 0 }).promise;
  const out: { w: number; h: number; rot: number; text: string; items: { str: string; x: number; y: number; a: number; b: number }[] }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    const items = (tc.items as { str: string; transform: number[] }[]).filter((it) => it.str.trim()).map((it) => {
      const t = pdfjs.Util.transform(vp.transform, it.transform);
      return { str: it.str, x: t[4], y: t[5], a: t[0], b: t[1] };
    });
    out.push({ w: Math.round(vp.width), h: Math.round(vp.height), rot: p.rotate, text: items.map((i) => i.str).join(" "), items });
  }
  return out;
}
/** Text items of a PDF in the same shape the browser pipeline produces (for table tests). */
async function itemsOf(bytes: Uint8Array) {
  const doc = await pdfjs.getDocument({ data: bytes.slice(), verbosity: 0 }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    const items: Item[] = [];
    for (const raw of tc.items as { str: string; transform: number[]; width: number; fontName: string }[]) {
      if (!raw.str.trim()) continue;
      const t = pdfjs.Util.transform(vp.transform, raw.transform);
      const size = Math.hypot(t[2], t[3]);
      items.push({ str: raw.str, x: t[4], base: t[5], top: t[5] - size * 0.8, w: raw.width, size, font: "Arial", bold: false, italic: false });
    }
    pages.push({ page: i, items, w: vp.width, h: vp.height });
  }
  return pages;
}

/* ---------------- Cell typing ---------------- */
const fmt = (s: string) => {
  const c = parseCell(s);
  return c.t === "n" ? SSF.format(c.fmt, c.v) : `text:${c.v}`;
};
eq("cells: round-trip display", ["1,20,000.50", "1,00,00,000", "12,345", "(1,234.00)", "1,234.50 €", "₹2,499", "$1,234.56", "12.5%", "-45.5", "0.75", "Rs. 500"].map(fmt), ["1,20,000.50", "1,00,00,000", "12,345", "(1,234.00)", "1,234.50 €", "₹2,499", "$1,234.56", "12.5%", "-45.5", "0.75", "Rs 500"]);
eq("cells: values", ["1,20,000.50", "(1,234.00)", "12.5%", "-₹ 99", "1,234-"].map((s) => (parseCell(s) as { v: number }).v), [120000.5, -1234, 0.125, -99, -1234]);
eq("cells: kept as text", ["00123", "1234567890123456", "12/03/2026", "2026-03-12", "10:30", "+91 98765 43210", "1,234 Dr", "INV-001", "12,34,5", "1.234,56", "-₹1,20,000", "4,500 CR", ""].map((s) => parseCell(s).t), Array(13).fill("s"));
eq("cells: convert off", parseCell("1,500", false).t, "s");
eq("cells: 15 digits ok, 16 not", [parseCell("123456789012345").t, parseCell("1234567890123456").t], ["n", "s"]);

/* ---------------- Tables from real PDFs ---------------- */
const stmt = extractTables(await itemsOf(fx("statement.pdf")));
eq("tables: statement → 1 table across 2 pages", [stmt.length, stmt[0]?.pages], [1, [1, 2]]);
eq("tables: statement header", stmt[0]?.rows[0], ["Date", "Description", "Debit", "Credit", "Balance"]);
eq("tables: wrapped description joined", stmt[0]?.rows[2], ["02/04/2026", "UPI/Sharma General Stores Ref 004512345678", "2,500.00", "", "1,17,500.00"]);
eq("tables: credit in its own column", stmt[0]?.rows[3], ["05/04/2026", "Salary credit April", "", "85,000.00", "2,02,500.00"]);
eq("tables: repeated header dropped, rows continue", [stmt[0]?.rows.length, stmt[0]?.rows[5]?.[1]], [7, "Rent transfer"]);
ok("tables: title/account line not in table", !stmt[0]?.rows.flat().some((c) => /Statement of Account|Account number/.test(c)));
const inv = extractTables(await itemsOf(fx("invoice-tables.pdf")));
eq("tables: invoice → 2 separate tables", inv.map((t) => [t.rows.length, t.cols]), [[4, 4], [3, 3]]);
eq("tables: invoice row", inv[0]?.rows[1], ["Design work", "10", "1,500.00", "15,000.00"]);
ok("tables: paragraph between tables excluded", !inv.flatMap((t) => t.rows.flat()).some((c) => /Thank you/.test(c)));
const ids = extractTables(await itemsOf(fx("ids.pdf")));
eq("tables: identifiers", ids[0]?.rows[1], ["00123", "1234567890123456", "+91 98765 43210", "03/02/2026", "1,500"]);
eq("tables: no tables in prose", pageTables((await itemsOf(fx("text-only.pdf")))[0].items, 1).length, 0);
ok("rows fallback: every line", pageRows((await itemsOf(fx("text-only.pdf")))[0].items).length === 40);

/* ---------------- XLSX build ---------------- */
const xbuf = await buildXlsx(ExcelJS, [{ name: "Statement / April", header: true, rows: stmt[0].rows }, { name: "IDs", header: true, rows: ids[0].rows }], true);
const wbx = new ExcelJS.Workbook();
await wbx.xlsx.load(xbuf as ArrayBuffer);
const s1 = wbx.worksheets[0];
eq("xlsx: sheet names sanitised", wbx.worksheets.map((w) => w.name), ["Statement April", "IDs"]);
eq("xlsx: numbers are numbers", [s1.getCell("E2").value, s1.getCell("C3").value, s1.getCell("C5").value], [120000, 2500, -1250.5]);
eq("xlsx: header text & bold", [s1.getCell("A1").value, s1.getCell("A1").font?.bold], ["Date", true]);
eq("xlsx: date stays text", [s1.getCell("A2").value, s1.getCell("A2").numFmt], ["01/04/2026", "@"]);
eq("xlsx: header row frozen", s1.views[0]?.state, "frozen");
const s2 = wbx.worksheets[1];
eq("xlsx: identifiers kept exactly", [s2.getCell("A2").value, s2.getCell("B2").value, s2.getCell("C2").value], ["00123", "1234567890123456", "+91 98765 43210"]);
eq("sheetNames", sheetNames(["a", "A", "x/y", ""]), ["a", "A 2", "x y", "Sheet"]);
eq("csv: BOM, quoting, formula guard", toCsv([["a,b", '"q"', "=1+1", "-5"]]), '﻿"a,b","""q""","\'=1+1",-5\r\n');

/* ---------------- Excel → PDF ---------------- */
const wbm = await readWorkbook(fx("workbook.xlsx"), "workbook.xlsx", ExcelJS);
eq("xlsx-read: sheets", wbm.sheets.map((s) => [s.name, s.rows, s.cols]), [["Sales", 12, 4], ["Wide", 21, 30], ["Long", 151, 3], ["Missing", 2, 2]]);
const sales = wbm.sheets[0];
eq("xlsx-read: formatted values", ["3,3", "3,4", "6,2", "6,3", "8,2"].map((k) => sales.cells.get(k)?.text), ["₹120,000.50", "33.0%", "355", "₹363,751.25", "13 Nov 2026"]);
eq("xlsx-read: styles", [sales.cells.get("2,1")?.fill, sales.cells.get("2,1")?.color, sales.cells.get("1,1")?.size, sales.cells.get("1,1")?.h, sales.cells.get("3,1")?.border.t?.w], ["#252525", "#FFFFFF", 16, "center", 0.5]);
eq("xlsx-read: merges, image, titles", [sales.merges.length, sales.images.length, sales.titleRows, wbm.sheets[2].titleRows], [2, 1, 2, 1]);
ok("xlsx-read: missing formula result warned", wbm.warnings.some((w) => /no saved result/.test(w)));
eq("colors", [color({ argb: "FF00FF00" }), color({ theme: 1 } as never), color({ theme: 0, tint: -0.5 } as never), color({ indexed: 10 } as never), color(undefined, "#123456")], ["#00FF00", "#000000", "#808080", "#FF0000", "#123456"]);
let xlsErr = "";
try {
  await readWorkbook(fx("legacy.xls"), "legacy.xls", ExcelJS);
} catch (e) {
  xlsErr = e instanceof SheetError ? e.message : "other";
}
ok("xlsx-read: .xls explained", /older \.xls/.test(xlsErr));
const csv = await readWorkbook(fx("prices.csv"), "prices.csv", ExcelJS);
eq("xlsx-read: CSV", [csv.sheets[0].rows, csv.sheets[0].cols, csv.sheets[0].cells.get("4,1")?.text, csv.sheets[0].cells.get("2,3")?.text], [4, 3, "Biscuits, assorted", "007"]);
eq("bands", bands([100, 100, 100, 250, 50], 300), [[0, 1, 2], [3, 4]]);
eq("paginate with repeat", paginate([20, 30, 30, 30, 30, 30], 100, 1), [[0, 1, 2], [0, 3, 4], [0, 5]]);
const fonts = { reg: new Uint8Array(readFileSync("public/fonts/pdf/NotoSans-Regular.ttf")), bold: new Uint8Array(readFileSync("public/fonts/pdf/NotoSans-Bold.ttf")) };
const opts = { paper: "A4" as const, orientation: "auto" as const, margin: 36, fit: "width" as const, repeatRows: "auto" as const, pageNumbers: true, gridlines: false, sheets: [0, 1, 2] };
const L = layout(wbm, opts);
eq("layout: wide sheet goes landscape", L.filter((p) => p.sheet === 1).every((p) => p.pageW > p.pageH), true);
eq("layout: fit width = one column band", new Set(L.filter((p) => p.sheet === 1).map((p) => p.cols.join())).size, 1);
const out = await workbookToPdf(wbm, opts, fonts);
const pages = await texts(out.bytes);
ok("pdf: Sales values", pages[0].text.includes("₹120,000.50") && pages[0].text.includes("Quarterly Sales Report") && pages[0].text.includes("13 Nov 2026"), pages[0].text.slice(0, 200));
ok("pdf: page numbers", pages[pages.length - 1].text.includes(`Page ${pages.length} of ${pages.length}`));
const longPages = pages.filter((p) => p.text.includes("Line item"));
ok("pdf: long sheet over several pages, header repeated", longPages.length >= 2 && longPages.every((p) => p.text.startsWith("#")), longPages.map((p) => p.text.slice(0, 20)));
ok("pdf: wrapped note", pages[0].items.filter((i) => /wrap|should|inside/.test(i.str)).length >= 1);
const actual = layout(wbm, { ...opts, fit: "actual", orientation: "portrait", sheets: [1] });
ok("layout: actual size splits wide columns into bands", new Set(actual.map((p) => p.cols[0])).size > 1);
const letter = await workbookToPdf(wbm, { ...opts, paper: "Letter", orientation: "landscape", sheets: [0], pageNumbers: false }, fonts);
const lp = await texts(letter.bytes);
eq("pdf: Letter landscape", [lp[0].w, lp[0].h], [792, 612]);
ok("pdf: no page numbers when off", !lp[0].text.includes("Page 1 of"));

/* ---------------- Overlays ---------------- */
eq("displayToUser: identity rot 0", apply(displayToUser({ x: 0, y: 0, width: 600, height: 800 }, 0), 100, 200), [100, 600]);
eq("displayToUser: rot 90", apply(displayToUser({ x: 0, y: 0, width: 600, height: 800 }, 90), 100, 200).map(Math.round), [200, 100]);
const lm = localToDisplay({ x: 100, y: 100, w: 40, h: 20, rot: 90 });
// local (right 20, up 10) on an object turned 90° clockwise → screen (+10 right, +20 down) from its centre (120, 110)
eq("localToDisplay: rotated corner", apply(lm, 20, 10).map((v) => Math.round(v * 100) / 100), [130, 130]);
const src = await PDFDocument.create();
const f = await src.embedFont(StandardFonts.Helvetica);
for (const r of [0, 90, 180, 270]) {
  const p = src.addPage([600, 800]);
  p.drawText("ORIGINAL", { x: 50, y: 50, size: 10, font: f });
  p.setRotation(degrees(r));
}
const crop = src.addPage([600, 800]);
crop.setCropBox(50, 100, 400, 500);
const srcBytes = await src.save();
const objs: OverlayObject[] = [0, 1, 2, 3, 4].map((i) => ({ id: `t${i}`, kind: "text", page: i, x: 100, y: 200, w: 300, h: 20, rot: 0, color: "#d6342b", text: `Hello ${i}`, size: 12, family: "sans" }));
objs.push({ id: "v", kind: "text", page: 0, x: 300, y: 300, w: 100, h: 15, rot: 90, color: "#000000", text: "Vertical", size: 12, family: "sans" });
objs.push({ id: "r", kind: "rect", page: 1, x: 10, y: 10, w: 50, h: 30, rot: 0, color: "#000000", stroke: 2 });
objs.push({ id: "p", kind: "path", page: 1, x: 10, y: 60, w: 50, h: 30, rot: 0, color: "#000000", stroke: 2, points: [[0, 0], [0.5, 1], [1, 0]] });
objs.push({ id: "n", kind: "note", page: 2, x: 20, y: 20, w: 24, h: 24, rot: 0, color: "#e6b400", text: "Please check" });
objs.push({ id: "u", kind: "text", page: 3, x: 50, y: 50, w: 200, h: 20, rot: 0, color: "#000000", text: "Price ₹1,999 – naïve", size: 12, family: "sans" });
const outO = await exportWithOverlays(srcBytes, objs, { loadFont: async (bold) => new Uint8Array(readFileSync(`public/fonts/pdf/NotoSans-${bold ? "Bold" : "Regular"}.ttf`)) });
const ot = await texts(outO);
for (let i = 0; i < 5; i++) {
  const it = ot[i].items.find((x) => x.str.startsWith(`Hello ${i}`))!;
  ok(`overlay: page ${i} (rot ${ot[i].rot}) text where placed`, !!it && near(it.x, 100, 0.01) && near(it.y, 200 + baselineOffset("sans", 12), 0.01) && near(it.a, 12, 0.01) && near(it.b, 0, 0.01), it);
}
const v = ot[0].items.find((x) => x.str === "Vertical")!;
ok("overlay: rotated text runs downward", !!v && near(v.a, 0, 0.01) && near(v.b, 12, 0.01), v);
ok("overlay: original text kept", ot.slice(0, 4).every((p) => p.text.includes("ORIGINAL")));
ok("overlay: non-WinAnsi text embedded with Noto Sans", ot[3].text.includes("₹1,999") && ot[3].text.includes("naïve"), ot[3].text);
const od = await PDFDocument.load(outO);
const annots = od.getPage(2).node.Annots();
ok("overlay: sticky note is a real /Text annotation", !!annots && annots.size() === 1 && String(od.context.lookup(annots.get(0))).includes("/Subtype /Text"));
ok("overlay: original bytes untouched", (await texts(srcBytes))[0].items.length === 1);
eq("wrap", wrap("aaa bbb ccc", 7, (s) => s.length), ["aaa bbb", "ccc"]);
eq("wrap long word", wrap("abcdefghij", 4, (s) => s.length), ["abcd", "efgh", "ij"]);
eq("needsShaping", [needsShaping("नमस्ते"), needsShaping("નમસ્તે"), needsShaping("مرحبا"), needsShaping("café ₹ Привет")], [true, true, true, false]);
eq("mul identity", mul([1, 0, 0, 1, 0, 0], [2, 0, 0, 2, 5, 5]), [2, 0, 0, 2, 5, 5]);

/* ---------------- Organizer ---------------- */
const mp = fx("multi-page.pdf");
const org = await buildOrganized(mp, [
  { id: "a", src: 3, rot: 0 },
  { id: "b", src: 0, rot: 90 },
  { id: "c", src: 0, rot: 0 },
  { id: "d", src: 2, rot: 270 },
]);
const og = await texts(org);
eq("organizer: order + duplicate", og.map((p) => p.text), ["PAGE 4", "PAGE 1", "PAGE 1", "PAGE 3"]);
eq("organizer: rotation added to existing", og.map((p) => p.rot), [90, 90, 0, 270]);
eq("organizer: page sizes kept", og.map((p) => [p.w, p.h]), [[842, 595], [842, 595], [595, 842], [595, 842]]);
const ex = await texts(await buildOrganized(mp, [{ id: "x", src: 1, rot: 0 }]));
eq("organizer: extract only selected", ex.map((p) => p.text), ["PAGE 2"]);
let encErr = "";
try {
  await buildOrganized(fx("encrypted.pdf"), [{ id: "a", src: 0, rot: 0 }]);
} catch (e) {
  encErr = (e as Error).message;
}
ok("organizer: encrypted PDF explained", /password-protected|encrypted/.test(encErr), encErr);

console.log(fails ? `\n${fails} FAILED` : "\nAll tools-9 tests passed");
process.exit(fails ? 1 : 0);
