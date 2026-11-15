// Unit tests for the PDF/spreadsheet batch: Rotate PDF (new), "all but first"
// page scope (Watermark / Page Numbers) and custom print scale (Excel to PDF).
import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";
import { addTurn, pagesFor, rotatePages } from "../src/lib/pdf-organize";
import { scopePages } from "../src/lib/pdf-stamp";
import { readWorkbook } from "../src/lib/xlsx-read";
import { layout, workbookToPdf } from "../src/lib/xlsx-pdf";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const fx = (f: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${f}`, import.meta.url)));

/* ---------------- Rotation maths ---------------- */
eq("addTurn: clockwise, anticlockwise, wrap", [addTurn(0, 90), addTurn(0, -90), addTurn(270, 90), addTurn(90, 180), addTurn(180, -270)], [90, 270, 0, 270, 270]);
eq("addTurn: right then left returns to start", addTurn(addTurn(90, 90), -90), 90);
eq("addTurn: normalises odd stored values", [addTurn(-90, 0), addTurn(450, 0), addTurn(89, 0)], [270, 90, 90]);

const sizes = [
  { w: 595, h: 842 },
  { w: 842, h: 595 },
  { w: 595, h: 842 },
  { w: 612, h: 792 },
  { w: 792, h: 612 },
];
eq("pagesFor: all/odd/even", [pagesFor("all", sizes, [], []), pagesFor("odd", sizes, [], []), pagesFor("even", sizes, [], [])], [[0, 1, 2, 3, 4], [0, 2, 4], [1, 3]]);
eq("pagesFor: selected (deduped, sorted, in range)", pagesFor("selected", sizes, [], [3, 0, 3, 9, -1]), [0, 3]);
eq("pagesFor: landscape/portrait", [pagesFor("landscape", sizes, [0, 0, 0, 0, 0], []), pagesFor("portrait", sizes, [0, 0, 0, 0, 0], [])], [[1, 4], [0, 2, 3]]);
eq("pagesFor: orientation follows added rotation", pagesFor("landscape", sizes, [0, 90, 0, 0, 0], []), [4]);

/* ---------------- Rotation output ---------------- */
{
  // 4 pages: portrait, landscape, portrait already /Rotate 90, portrait already /Rotate 270.
  const src = await PDFDocument.create();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const dims: [number, number][] = [[595, 842], [842, 595], [612, 792], [420, 595]];
  dims.forEach((d, i) => {
    const p = src.addPage(d);
    p.drawText(`Page ${i + 1} content`, { x: 40, y: 40, size: 14, font });
  });
  src.getPage(2).setRotation(degrees(90));
  src.getPage(3).setRotation(degrees(270));
  src.setTitle("Quarterly report");
  src.setAuthor("Finance team");
  src.setSubject("Q3");
  src.setProducer("Original producer");
  const bytes = new Uint8Array(await src.save());

  const out = await PDFDocument.load(await rotatePages(bytes, [90, 0, 90, -90]), { updateMetadata: false });
  eq("rotate: page count + order kept", out.getPageCount(), 4);
  eq("rotate: final angles add to existing /Rotate", out.getPages().map((p) => p.getRotation().angle), [90, 0, 180, 180]);
  eq("rotate: page sizes unchanged (mixed sizes)", out.getPages().map((p) => [p.getWidth(), p.getHeight()]), dims);
  eq("rotate: metadata preserved", [out.getTitle(), out.getAuthor(), out.getSubject(), out.getProducer()], ["Quarterly report", "Finance team", "Q3", "Original producer"]);

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: await rotatePages(bytes, [90, 0, 0, 0]), verbosity: 0 }).promise;
  const tc = await (await doc.getPage(1)).getTextContent();
  eq("rotate: content preserved (text still extractable)", (tc.items as { str: string }[]).map((i) => i.str).join(""), "Page 1 content");
  const vp = (await doc.getPage(1)).getViewport({ scale: 1 });
  eq("rotate: displayed page is now landscape", [Math.round(vp.width), Math.round(vp.height)], [842, 595]);

  const none = await PDFDocument.load(await rotatePages(bytes, [0, 360, -360, 0]));
  eq("rotate: zero/full turns leave pages untouched", none.getPages().map((p) => p.getRotation().angle), [0, 0, 90, 270]);
  const twice = await PDFDocument.load(await rotatePages(await rotatePages(bytes, [90, 90, 90, 90]), [-90, -90, -90, -90]));
  eq("rotate: rotating back restores the original", twice.getPages().map((p) => p.getRotation().angle), [0, 0, 90, 270]);

  const errs = await Promise.all(["encrypted.pdf", "corrupt.pdf", "fake.pdf"].map((f) => rotatePages(fx(f), [90], f).then(() => "ok", (e: Error) => e.message)));
  eq("rotate: encrypted/corrupt/fake rejected with clear messages", [/password-protected/.test(errs[0]), /couldn't be opened|damaged/.test(errs[1]), /isn't a PDF|couldn't be opened/.test(errs[2])], [true, true, true]);

  const big = await PDFDocument.load(await rotatePages(fx("pages-20.pdf"), Array.from({ length: 20 }, (_, i) => (i % 2 ? 180 : 0))));
  eq("rotate: 20-page file, even pages 180°", big.getPages().map((p) => p.getRotation().angle).join(","), Array.from({ length: 20 }, (_, i) => (i % 2 ? 180 : 0)).join(","));
}

/* ---------------- "All but first" scope ---------------- */
eq("scope: notFirst", [scopePages("notFirst", "", 5), scopePages("notFirst", "", 1), scopePages("notFirst", "", 0)], [[1, 2, 3, 4], [], []]);

/* ---------------- Excel custom scale ---------------- */
{
  const wbm = await readWorkbook(fx("workbook.xlsx"), "workbook.xlsx", ExcelJS);
  const base = { paper: "A4" as const, orientation: "portrait" as const, margin: 36, repeatRows: "auto" as const, pageNumbers: true, gridlines: false, sheets: [1] };
  const actual = layout(wbm, { ...base, fit: "actual" });
  const half = layout(wbm, { ...base, fit: "custom", scalePct: 50 });
  const tiny = layout(wbm, { ...base, fit: "custom", scalePct: 1 });
  const huge = layout(wbm, { ...base, fit: "custom", scalePct: 9999 });
  eq("scale: custom % applied and clamped 10–400", [half[0].scale, tiny[0].scale, huge[0].scale], [0.5, 0.1, 4]);
  eq("scale: 100% custom = actual size", layout(wbm, { ...base, fit: "custom", scalePct: 100 }).length, actual.length);
  eq("scale: smaller scale needs no more pages", half.length <= actual.length, true);
  const colsOf = (L: typeof actual) => [...new Set(L.flatMap((p) => p.cols))].sort((a, b) => a - b).join();
  eq("scale: no columns dropped at 200%", colsOf(layout(wbm, { ...base, fit: "custom", scalePct: 200 })), colsOf(actual));
  const fonts = { reg: new Uint8Array(readFileSync("public/fonts/pdf/NotoSans-Regular.ttf")), bold: new Uint8Array(readFileSync("public/fonts/pdf/NotoSans-Bold.ttf")) };
  const pdf = await workbookToPdf(wbm, { ...base, fit: "custom", scalePct: 75 }, fonts);
  eq("scale: custom-scaled PDF opens", (await PDFDocument.load(pdf.bytes)).getPageCount() > 0, true);
}

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
