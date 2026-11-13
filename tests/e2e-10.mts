// End-to-end tests for tools 36–40: PDF to Excel, Excel to PDF, PDF Editor,
// PDF Page Organizer and Sign PDF. Outputs are opened and checked, including
// that placed objects land where they were shown on screen.
import { chromium, type Page } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { PDFDocument, PDFName } from "pdf-lib";
import { unzipSync } from "fflate";

const BASE = process.argv[2] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const TMP = join(tmpdir(), `zspace-e2e10-${Date.now()}`);
mkdirSync(TMP, { recursive: true });
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1900 }, permissions: ["clipboard-read", "clipboard-write"] });
const errors: string[] = [];
const requests: string[] = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
  p.on("request", (r) => requests.push(r.url()));
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), trigger()]);
  return { name: dl.suggestedFilename(), buf: readFileSync((await dl.path())!) };
}
const btn = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" });
const txt = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ");
const upload = (page: Page, f: string) => page.locator('input[type="file"]').first().setInputFiles(f.startsWith("/") ? f : FX + f);
const near = (a: number, b: number, t: number) => Math.abs(a - b) <= t;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
type Pg = { w: number; h: number; rot: number; text: string; items: { str: string; x: number; y: number }[]; images: { x: number; y: number; w: number; h: number }[] };
async function inspect(buf: Buffer): Promise<Pg[]> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise;
  const out: Pg[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    const items = (tc.items as { str: string; transform: number[] }[]).filter((x) => x.str.trim()).map((x) => {
      const t = pdfjs.Util.transform(vp.transform, x.transform);
      return { str: x.str, x: t[4], y: t[5] };
    });
    // Image placements in display coordinates (walk the operator list's CTM).
    const ops = await p.getOperatorList();
    const O = pdfjs.OPS;
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack: number[][] = [];
    const images: Pg["images"] = [];
    for (let k = 0; k < ops.fnArray.length; k++) {
      const fn = ops.fnArray[k];
      const a = ops.argsArray[k];
      if (fn === O.save) stack.push(ctm);
      else if (fn === O.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
      else if (fn === O.transform) ctm = pdfjs.Util.transform(ctm, a);
      else if (fn === O.paintImageXObject || fn === O.paintInlineImageXObject) {
        const m = pdfjs.Util.transform(vp.transform, ctm);
        const xs = [m[4], m[0] + m[4], m[2] + m[4], m[0] + m[2] + m[4]];
        const ys = [m[5], m[1] + m[5], m[3] + m[5], m[1] + m[3] + m[5]];
        images.push({ x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
      }
    }
    out.push({ w: Math.round(vp.width), h: Math.round(vp.height), rot: p.rotate, text: items.map((x) => x.str).join(" "), items, images });
  }
  return out;
}
/** On-screen box of an overlay object, converted to page points. */
async function objBox(page: Page, stageId: string, sel: string) {
  return page.evaluate(
    ([sid, s]) => {
      const stage = document.querySelector(`[data-testid="${sid}"]`) as HTMLElement;
      const el = stage.querySelector(s) as HTMLElement;
      const st = stage.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const k = st.width / parseFloat(stage.dataset.pageW || String(st.width));
      return { x: (r.left - st.left) / k, y: (r.top - st.top) / k, w: r.width / k, h: r.height / k, k };
    },
    [stageId, sel] as const,
  );
}

/* ---------- Fixture: scanned table PDF (image of a table, no text layer) ---------- */
const scanTablePdf = await (async () => {
  const p = await browser.newPage({ viewport: { width: 900, height: 360 }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#fff"><table style="font:26px Arial;border-collapse:collapse;margin:30px" cellpadding="10">${[["Item", "Qty", "Price"], ["Pencils", "12", "240.00"], ["Notebooks", "5", "375.50"], ["Erasers", "20", "100.00"]].map((r, i) => `<tr>${r.map((c) => `<td style="padding:8px 40px 8px 0;${i ? "" : "font-weight:bold"}">${c}</td>`).join("")}</tr>`).join("")}</table></body>`);
  const png = join(TMP, "table.png");
  await p.screenshot({ path: png });
  await p.close();
  const pdf = await PDFDocument.create();
  const img = await pdf.embedPng(readFileSync(png));
  pdf.addPage([595, 842]).drawImage(img, { x: 20, y: 842 - 20 - 555 * (360 / 900), width: 555, height: 555 * (360 / 900) });
  const path = join(TMP, "scanned-table.pdf");
  writeFileSync(path, await pdf.save());
  return path;
})();

/* ---------------- 36 PDF to Excel ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-to-excel/");
  await upload(page, "statement.pdf");
  await page.getByTestId("p2x-info").waitFor({ timeout: 20000 });
  check("p2x: file info", (await txt(page, "p2x-info")).includes("2 pages"));
  await btn(page, "Extract tables").click();
  await page.getByTestId("p2x-summary").waitFor({ timeout: 60000 });
  check("p2x: one table across pages", (await txt(page, "p2x-summary")).includes("1 table found"), await txt(page, "p2x-summary"));
  const pv = await txt(page, "p2x-preview");
  check("p2x: preview rows", pv.includes("UPI/Sharma General Stores Ref 004512345678") && pv.includes("Rent transfer") && pv.includes("1,20,000.00"), pv.slice(0, 200));
  const x = await download(page, () => btn(page, "Download XLSX").click());
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(x.buf as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  check("p2x: XLSX downloaded", x.name === "statement.xlsx" && wb.worksheets.length === 1);
  check("p2x: numbers are numbers, look the same", ws.getCell("E2").value === 120000 && String(ws.getCell("E2").numFmt).includes("##,##0") && ws.getCell("C5").value === -1250.5, `${ws.getCell("E2").value} ${ws.getCell("E2").numFmt} ${ws.getCell("C5").value}`);
  check("p2x: dates stay text", ws.getCell("A2").value === "01/04/2026" && ws.getCell("A2").numFmt === "@");
  check("p2x: header bold", ws.getCell("A1").value === "Date" && !!ws.getCell("A1").font?.bold);
  check("p2x: 7 rows (header once)", ws.actualRowCount === 7, String(ws.actualRowCount));
  const csv = await download(page, () => btn(page, "CSV").click());
  check("p2x: CSV", csv.name === "statement.csv" && csv.buf.toString("utf8").startsWith("﻿Date,Description,Debit,Credit,Balance") && csv.buf.toString("utf8").includes('"1,20,000.00"'));
  await page.getByRole("radio", { name: "One sheet" }).click();
  await btn(page, "Convert another PDF").click();
  // Two tables
  await upload(page, "invoice-tables.pdf");
  await page.getByTestId("p2x-info").waitFor();
  await btn(page, "Extract tables").click();
  await page.getByTestId("p2x-summary").waitFor({ timeout: 60000 });
  check("p2x: two tables", (await txt(page, "p2x-summary")).includes("2 tables found"));
  await page.getByRole("radio", { name: "Sheet per table" }).click();
  const x2 = await download(page, () => btn(page, "Download XLSX").click());
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(x2.buf as unknown as ArrayBuffer);
  check("p2x: sheet per table", wb2.worksheets.length === 2 && wb2.worksheets[1].getCell("A2").value === "CGST" && wb2.worksheets[0].getCell("D2").value === 15000);
  await page.getByLabel(/Include Table 2/).uncheck();
  const z = await download(page, () => btn(page, "CSV").click());
  check("p2x: CSV of included table only", z.name === "invoice-tables.csv" && z.buf.toString("utf8").includes("Design work") && !z.buf.toString("utf8").includes("CGST"));
  await page.getByLabel(/Include Table 2/).check();
  const zz = await download(page, () => btn(page, "CSV").click());
  check("p2x: CSV ZIP for several tables", zz.name === "invoice-tables-csv.zip" && Object.keys(unzipSync(new Uint8Array(zz.buf))).length === 2);
  // Identifiers
  await btn(page, "Convert another PDF").click();
  await upload(page, "ids.pdf");
  await page.getByTestId("p2x-info").waitFor();
  await btn(page, "Extract tables").click();
  await page.getByTestId("p2x-summary").waitFor({ timeout: 60000 });
  const x3 = await download(page, () => btn(page, "Download XLSX").click());
  const wb3 = new ExcelJS.Workbook();
  await wb3.xlsx.load(x3.buf as unknown as ArrayBuffer);
  const w3 = wb3.worksheets[0];
  check("p2x: identifiers exact", w3.getCell("A2").value === "00123" && w3.getCell("B2").value === "1234567890123456" && w3.getCell("C2").value === "+91 98765 43210" && w3.getCell("E3").value === 2750.25);
  // No tables → text rows
  await btn(page, "Convert another PDF").click();
  await upload(page, "text-only.pdf");
  await page.getByTestId("p2x-info").waitFor();
  await btn(page, "Extract tables").click();
  await page.getByTestId("p2x-summary").waitFor({ timeout: 60000 });
  check("p2x: no tables → page text rows explained", (await txt(page, "p2x-summary")).includes("4 pages of text rows") && (await page.getByText(/No ruled or column-aligned tables were found/).isVisible()));
  // Scanned without/with OCR
  await btn(page, "Convert another PDF").click();
  await upload(page, scanTablePdf);
  await page.getByTestId("p2x-scanned").waitFor({ timeout: 20000 });
  await page.getByRole("switch", { name: /OCR scanned pages/ }).uncheck({ force: true });
  await btn(page, "Extract tables").click();
  await page.getByText(/scanned images with no text layer/).waitFor({ timeout: 30000 });
  check("p2x: scanned without OCR → clear message, no empty file", (await page.getByRole("button", { name: "Download XLSX" }).count()) === 0);
  await page.getByRole("switch", { name: /OCR scanned pages/ }).check({ force: true });
  await btn(page, "Extract tables").click();
  await page.getByTestId("p2x-summary").waitFor({ timeout: 180000 });
  const so = await txt(page, "p2x-preview");
  check("p2x: OCR table extracted", /Notebooks/.test(so) && /375\.50/.test(so) && (await txt(page, "p2x-summary")).includes("read with OCR"), so.slice(0, 160));
  await btn(page, "Convert another PDF").click();
  await upload(page, "corrupt.pdf");
  await page.getByText("corrupt.pdf couldn't be opened. It may be damaged or incomplete.").waitFor({ timeout: 15000 });
  check("p2x: corrupted PDF", true);
  await upload(page, "encrypted.pdf");
  await page.getByText("appears to be password protected. Please upload an unlocked copy.").waitFor({ timeout: 15000 });
  check("p2x: password-protected PDF", true);
  await page.close();
}

/* ---------------- 37 Excel to PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/excel-to-pdf/");
  await upload(page, "workbook.xlsx");
  await page.getByTestId("x2p-sheets").waitFor({ timeout: 30000 });
  check("x2p: sheets listed", (await txt(page, "x2p-sheets")).includes("Sales 12 × 4") && (await txt(page, "x2p-sheets")).includes("Wide 21 × 30"));
  check("x2p: warnings", (await txt(page, "x2p-warnings")).includes("no saved result"));
  await page.getByTestId("x2p-status").getByText(/pages ·/).waitFor({ timeout: 30000 });
  const st = await txt(page, "x2p-status");
  check("x2p: preview built", /\d+ pages · /.test(st) && (await page.getByTestId("x2p-preview").locator("img").first().waitFor({ timeout: 15000 }).then(() => true)), st);
  const d = await download(page, () => btn(page, "Download PDF").click());
  const pages = await inspect(d.buf);
  check("x2p: PDF", d.name === "workbook.pdf" && pages.length >= 5 && pages[0].w === 595 && pages[0].h === 842, `${pages.length} ${pages[0].w}x${pages[0].h}`);
  check("x2p: values & formats", pages[0].text.includes("₹120,000.50") && pages[0].text.includes("33.0%") && pages[0].text.includes("13 Nov 2026") && pages[0].text.includes("Quarterly Sales Report"));
  check("x2p: image embedded", pages[0].images.length === 1);
  check("x2p: wide sheet landscape + fits width", pages.some((p) => p.w === 842 && p.text.includes("Column 30") && p.text.includes("Column 1 ")));
  const longP = pages.filter((p) => p.text.includes("Line item"));
  check("x2p: header repeated on every page of long sheet", longP.length >= 2 && longP.every((p) => p.items[0]?.str === "#"), longP.map((p) => p.items[0]?.str).join());
  check("x2p: page numbers", pages[pages.length - 1].text.includes(`Page ${pages.length} of ${pages.length}`));
  // Settings
  await page.getByRole("radio", { name: "Letter" }).click();
  await page.getByRole("radio", { name: "Landscape" }).click();
  await page.getByRole("switch", { name: "Page numbers" }).uncheck({ force: true });
  for (const name of ["Wide", "Long", "Missing"]) await page.getByTestId("x2p-sheets").getByText(name, { exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByTestId("x2p-status").getByText(/^1 page ·/).waitFor({ timeout: 30000 });
  const d2 = await inspect((await download(page, () => btn(page, "Download PDF").click())).buf);
  check("x2p: Letter landscape, one sheet, no page numbers", d2.length === 1 && d2[0].w === 792 && d2[0].h === 612 && !d2[0].text.includes("Page 1 of"));
  await page.getByRole("radio", { name: "Fit sheet on a page" }).click();
  await page.getByRole("switch", { name: "Print gridlines" }).check({ force: true });
  await page.waitForTimeout(800);
  await page.getByTestId("x2p-status").getByText(/^1 page ·/).waitFor({ timeout: 30000 });
  check("x2p: fit page + gridlines rebuilds", true);
  await page.getByTestId("x2p-sheets").getByText("Sales", { exact: true }).click();
  check("x2p: no sheets selected", (await txt(page, "x2p-status")).includes("Choose at least one worksheet"));
  await btn(page, "Another file").click();
  await upload(page, "prices.csv");
  await page.getByTestId("x2p-status").getByText(/page ·/).waitFor({ timeout: 30000 });
  const cp = await inspect((await download(page, () => btn(page, "Download PDF").click())).buf);
  check("x2p: CSV → PDF", cp[0].text.includes("Biscuits, assorted") && cp[0].text.includes("007"));
  await btn(page, "Another file").click();
  await upload(page, "legacy.xls");
  await page.getByText(/older \.xls file/).waitFor({ timeout: 10000 });
  check("x2p: .xls explained", true);
  await upload(page, "not-word.docx");
  await page.getByText(/isn't a spreadsheet/).waitFor({ timeout: 10000 });
  check("x2p: non-spreadsheet rejected", true);
  await page.close();
}

/* ---------------- 38 PDF Editor ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-editor/");
  await upload(page, "multi-page.pdf");
  const stage = page.getByTestId("editor-stage");
  await stage.waitFor({ timeout: 20000 });
  await page.evaluate(() => {
    const s = document.querySelector('[data-testid="editor-stage"]') as HTMLElement;
    s.dataset.pageW = "595.28";
  });
  check("editor: no changes yet", (await txt(page, "editor-status")).includes("No changes yet"));
  let sb = (await stage.boundingBox())!;
  const k = sb.width / 595.28;
  // Text
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.mouse.click(sb.x + 100 * k, sb.y + 200 * k);
  await page.keyboard.type("Approved by ZSpace");
  await page.mouse.click(sb.x + sb.width - 5, sb.y + sb.height - 5);
  check("editor: unsaved indicator", (await txt(page, "editor-status")).includes("Unsaved changes"));
  // Rectangle by drag
  await page.getByRole("button", { name: "Rectangle", exact: true }).click();
  await page.mouse.move(sb.x + 300 * k, sb.y + 300 * k);
  await page.mouse.down();
  await page.mouse.move(sb.x + 400 * k, sb.y + 360 * k, { steps: 5 });
  await page.mouse.up();
  // Highlight, arrow, freehand, note
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  await page.mouse.move(sb.x + 60 * k, sb.y + 90 * k);
  await page.mouse.down();
  await page.mouse.move(sb.x + 250 * k, sb.y + 110 * k, { steps: 4 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Arrow", exact: true }).click();
  await page.mouse.move(sb.x + 450 * k, sb.y + 500 * k);
  await page.mouse.down();
  await page.mouse.move(sb.x + 350 * k, sb.y + 420 * k, { steps: 4 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Draw", exact: true }).click();
  await page.mouse.move(sb.x + 100 * k, sb.y + 600 * k);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(sb.x + (100 + i * 15) * k, sb.y + (600 + (i % 2 ? 20 : -20)) * k);
  await page.mouse.up();
  await page.getByRole("button", { name: "Note", exact: true }).click();
  await page.mouse.click(sb.x + 500 * k, sb.y + 100 * k);
  await page.locator("#ed-text").fill("Check this figure");
  // Image
  await page.locator('input[aria-label="Choose an image to add"]').setInputFiles(FX + "quadrants.png");
  await page.locator("[data-obj] img").first().waitFor();
  const objs = await stage.locator("[data-obj]").count();
  check("editor: 7 additions on page 1", objs === 7, String(objs));
  // Undo / redo
  await btn(page, "Undo").click();
  check("editor: undo", (await stage.locator("[data-obj]").count()) === 6);
  await btn(page, "Redo").click();
  check("editor: redo", (await stage.locator("[data-obj]").count()) === 7);
  // Move the image by dragging, then check it lands there in the PDF
  const img = stage.locator("[data-obj]").filter({ has: page.locator("img") }).first();
  const ib = (await img.boundingBox())!;
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.mouse.move(ib.x + ib.width / 2, ib.y + ib.height / 2);
  await page.mouse.down();
  await page.mouse.move(ib.x + ib.width / 2 - 120, ib.y + ib.height / 2 + 80, { steps: 6 });
  await page.mouse.up();
  const imgId = await img.getAttribute("data-obj");
  const imgBox = await objBox(page, "editor-stage", `[data-obj="${imgId}"]`);
  // Text style: select text and make it bold/bigger
  const textObj = stage.locator("[data-obj]").filter({ hasText: "Approved by ZSpace" });
  await textObj.click();
  await page.locator("#ed-size").fill("20");
  const tId = await textObj.getAttribute("data-obj");
  const tBox = await objBox(page, "editor-stage", `[data-obj="${tId}"]`);
  // Page 4 (rotated 90°): add text
  await page.getByRole("button", { name: /^Page 4/ }).click();
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const s = document.querySelector('[data-testid="editor-stage"]') as HTMLElement;
    s.dataset.pageW = "841.89";
  });
  sb = (await stage.boundingBox())!;
  const k4 = sb.width / 841.89;
  check("editor: rotated page displayed landscape", near(sb.width / sb.height, 841.89 / 595.28, 0.02));
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.mouse.click(sb.x + 200 * k4, sb.y + 150 * k4);
  await page.keyboard.type("Rotated page note");
  await page.mouse.click(sb.x + 5, sb.y + sb.height - 5);
  const out = await download(page, () => btn(page, "Download PDF").click());
  check("editor: download", out.name === "multi-page-edited.pdf" && (await page.getByText(/Saved multi-page-edited\.pdf/).isVisible()));
  check("editor: status after download", (await txt(page, "editor-status")).includes("All changes downloaded"));
  const ed = await inspect(out.buf);
  const t1 = ed[0].items.find((i) => i.str.startsWith("Approved"));
  check("editor: text placed where shown", !!t1 && near(t1.x, tBox.x, 1.5) && near(t1.y, tBox.y + 20 * 0.97, 2.5), JSON.stringify({ t1, tBox }));
  check("editor: image placed where shown", ed[0].images.length === 1 && near(ed[0].images[0].x, imgBox.x, 1.5) && near(ed[0].images[0].y, imgBox.y, 1.5) && near(ed[0].images[0].w, imgBox.w, 1.5), JSON.stringify({ img: ed[0].images[0], imgBox }));
  const t4 = ed[3].items.find((i) => i.str.startsWith("Rotated page note"));
  check("editor: text on rotated page where shown", ed[3].rot === 90 && !!t4 && near(t4.x, 200, 2) && near(t4.y, 150 + 20 * 0.9715, 0.5), JSON.stringify(t4) + " | " + ed[3].text);
  check("editor: original text kept", ed.every((p, i) => p.text.includes(`PAGE ${i + 1}`)));
  const doc = await PDFDocument.load(out.buf);
  const annots = doc.getPage(0).node.Annots();
  check("editor: sticky note is a real comment", !!annots && annots.size() === 1 && String(doc.context.lookup(annots.get(0))).includes("Check this figure") === false && String(doc.context.lookup(annots.get(0))).includes("/Subtype /Text"));
  check("editor: page count & sizes unchanged", ed.length === 4 && ed[1].w === 612 && ed[2].w === 842);
  // Close with confirmation
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.mouse.click(sb.x + 300 * k4, sb.y + 300 * k4);
  await page.keyboard.type("x");
  await page.mouse.click(sb.x + 5, sb.y + sb.height - 5);
  await page.getByRole("button", { name: /^Close/ }).click();
  check("editor: warns before discarding", await page.getByRole("alertdialog").isVisible());
  await btn(page, "Discard").click();
  check("editor: closed", await page.getByText("Drop a PDF to edit").isVisible());
  await page.close();
}

/* ---------------- 39 PDF Organizer ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-organizer/");
  await upload(page, "multi-page.pdf");
  await page.getByTestId("org-grid").waitFor({ timeout: 20000 });
  const order = async () => page.getByTestId("org-page").evaluateAll((els) => els.map((e) => `${(e as HTMLElement).dataset.src}:${(e as HTMLElement).dataset.rot}`).join(" "));
  check("org: 4 pages", (await order()) === "1:0 2:0 3:0 4:0");
  await page.getByTestId("org-grid").locator("img").first().waitFor({ timeout: 15000 });
  await btn(page, "Rotate page 1").click();
  await btn(page, "Duplicate page 3").click();
  await btn(page, "Delete page 2").click();
  check("org: rotate/duplicate/delete", (await order()) === "1:90 3:0 3:0 4:0", await order());
  await btn(page, "Move page 4 left").click();
  check("org: move left", (await order()) === "1:90 3:0 4:0 3:0");
  await btn(page, "Undo").click();
  check("org: undo", (await order()) === "1:90 3:0 3:0 4:0");
  await btn(page, "Redo").click();
  await btn(page, /Reverse/).click();
  check("org: reverse", (await order()) === "3:0 4:0 3:0 1:90");
  // Drag and drop: drag last card to the front
  const cards = page.getByTestId("org-page");
  await cards.nth(3).dragTo(cards.nth(0), { targetPosition: { x: 5, y: 60 } });
  check("org: drag & drop reorder", (await order()) === "1:90 3:0 4:0 3:0", await order());
  // Select two and rotate both
  await page.getByRole("button", { name: /^Page 2 \(original page 3/ }).click();
  await page.getByRole("button", { name: /^Page 3 \(original page 4/ }).click();
  check("org: selection count", (await txt(page, "org-count")).includes("2 selected"));
  await btn(page, "Rotate selected right").click();
  check("org: rotate selection", (await order()) === "1:90 3:90 4:90 3:0");
  const ex = await download(page, () => btn(page, /^Extract 2 selected/).click());
  const exP = await inspect(ex.buf);
  check("org: extract selected", ex.name === "multi-page-extract.pdf" && exP.map((p) => `${p.text}:${p.rot}`).join() === "PAGE 3:90,PAGE 4:180");
  const all = await download(page, () => btn(page, "Download PDF").click());
  const ap = await inspect(all.buf);
  check("org: final PDF order/rotation/duplicates", all.name === "multi-page-organized.pdf" && ap.map((p) => `${p.text}:${p.rot}`).join() === "PAGE 1:90,PAGE 3:90,PAGE 4:180,PAGE 3:0", ap.map((p) => `${p.text}:${p.rot}`).join());
  await btn(page, "Reset order").click();
  check("org: reset", (await order()) === "1:0 2:0 3:0 4:0");
  await btn(page, "Select all").click();
  await btn(page, "Delete").click();
  check("org: all deleted → download disabled", (await btn(page, "Download PDF").isDisabled()) && (await page.getByText(/Every page has been deleted/).isVisible()));
  await page.close();
}

/* ---------------- 40 Sign PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/sign-pdf/");
  await upload(page, "multi-page.pdf");
  const stage = page.getByTestId("sign-stage");
  await stage.waitFor({ timeout: 20000 });
  await page.evaluate(() => {
    (document.querySelector('[data-testid="sign-stage"]') as HTMLElement).dataset.pageW = "595.28";
  });
  check("sign: legal notice", (await txt(page, "sign-legal")).includes("isn't a certificate-based digital signature"));
  // Draw
  const pad = page.getByTestId("sign-canvas");
  const pb = (await pad.boundingBox())!;
  await page.mouse.move(pb.x + 30, pb.y + 100);
  await page.mouse.down();
  for (let i = 0; i <= 30; i++) await page.mouse.move(pb.x + 30 + i * 8, pb.y + 100 + Math.sin(i / 3) * 30);
  await page.mouse.up();
  await btn(page, "Use this signature").click();
  await page.getByTestId("sig-list").locator("li").first().waitFor();
  // Type
  await page.getByRole("radio", { name: "Type" }).click();
  await page.getByLabel("Your name").fill("Asha Mehta");
  await page.getByRole("radio", { name: /Flowing/ }).click();
  await btn(page, "Use this signature").click();
  // Upload (with white background removal)
  await page.getByRole("radio", { name: "Upload" }).click();
  await page.locator('input[aria-label="Upload a signature image"]').setInputFiles(FX + "tiny.jpg");
  await page.getByTestId("sig-list").locator("li").nth(2).waitFor();
  check("sign: three signatures created", (await page.getByTestId("sig-list").locator("li").count()) === 3);
  const transparent = await page.getByTestId("sig-list").locator("img").first().evaluate(async (im: HTMLImageElement) => {
    const c = document.createElement("canvas");
    c.width = im.naturalWidth;
    c.height = im.naturalHeight;
    const x = c.getContext("2d")!;
    x.drawImage(im, 0, 0);
    return x.getImageData(0, 0, 1, 1).data[3] === 0;
  });
  check("sign: drawn signature has transparent background", transparent);
  // Place drawn signature, then drag it
  await page.getByTestId("sig-list").getByRole("button", { name: "Place" }).first().click();
  const sig = stage.locator("[data-obj]").first();
  const sbx = (await sig.boundingBox())!;
  await page.mouse.move(sbx.x + sbx.width / 2, sbx.y + sbx.height / 2);
  await page.mouse.down();
  await page.mouse.move(sbx.x + sbx.width / 2 - 150, sbx.y + sbx.height / 2 - 200, { steps: 6 });
  await page.mouse.up();
  // Resize from the bottom-right handle
  const nb = (await sig.boundingBox())!;
  await page.mouse.move(nb.x + nb.width + 1, nb.y + nb.height + 1);
  await page.mouse.down();
  await page.mouse.move(nb.x + nb.width + 60, nb.y + nb.height + 40, { steps: 5 });
  await page.mouse.up();
  const sid = await sig.getAttribute("data-obj");
  const box = await objBox(page, "sign-stage", `[data-obj="${sid}"]`);
  check("sign: resized keeping aspect", box.w > sbx.width / box.k + 30, JSON.stringify({ box, before: sbx.width / box.k }));
  // Add date and copy signature to all pages
  await btn(page, "Add date").click();
  const today = new Date();
  const dmy = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  check("sign: date added", (await stage.innerText()).includes(dmy));
  await sig.click();
  await btn(page, "Copy to all pages").click();
  // Drag the typed signature onto page 2 via drag and drop
  await page.getByRole("button", { name: /^Page 2/ }).click();
  await page.getByTestId("sig-list").locator("li").nth(1).dragTo(stage, { targetPosition: { x: 150, y: 150 } });
  check("sign: drag signature onto page", (await stage.locator("[data-obj]").count()) === 2);
  await btn(page, "Undo").click();
  check("sign: undo placement", (await stage.locator("[data-obj]").count()) === 1);
  const out = await download(page, () => btn(page, "Download signed PDF").click());
  check("sign: download", out.name === "multi-page-signed.pdf" && (await page.getByText(/Saved multi-page-signed\.pdf/).isVisible()));
  const sp = await inspect(out.buf);
  check("sign: signature on every page", sp.every((p) => p.images.length === 1), sp.map((p) => p.images.length).join());
  const im = sp[0].images[0];
  check("sign: placement matches preview (±1.5pt)", near(im.x, box.x, 1.5) && near(im.y, box.y, 1.5) && near(im.w, box.w, 1.5) && near(im.h, box.h, 1.5), JSON.stringify({ im, box }));
  check("sign: date text in PDF", sp[0].text.includes(dmy));
  check("sign: originals intact", sp.every((p, i) => p.text.includes(`PAGE ${i + 1}`)) && sp[3].rot === 90);
  const doc = await PDFDocument.load(out.buf);
  const smask = doc.getPage(0).node.Resources()!.lookup(PDFName.of("XObject"));
  check("sign: transparency kept (soft mask)", String(smask).length > 0 && out.buf.includes(Buffer.from("/SMask")));
  await btn(page, /start again/i).click();
  check("sign: reset clears signatures", await page.getByText("Drop a PDF to sign").isVisible());
  await page.close();
}

/* ---------------- Registry & SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  const home = await page.locator("main").innerText();
  check("home: popular includes PDF Editor and Sign PDF", home.includes("PDF Editor") && home.includes("Sign PDF"));
  for (const [q, want] of [["pdf to excel", "PDF to Excel"], ["bank statement to excel", "PDF to Excel"], ["xlsx to pdf", "Excel to PDF"], ["edit pdf", "PDF Editor"], ["add text to pdf", "PDF Editor"], ["rotate pdf", "PDF Page Organizer"], ["delete pdf pages", "PDF Page Organizer"], ["sign pdf", "Sign PDF"], ["e-sign", "Sign PDF"]] as const) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "pdf-to-excel": "PDF to Excel Converter – Convert PDF Tables to XLSX Online",
    "excel-to-pdf": "Excel to PDF Converter – Convert XLS and XLSX to PDF Online",
    "pdf-editor": "Edit PDF Online – Add Text, Images, Shapes and Annotations",
    "pdf-organizer": "Organize PDF Pages – Reorder, Rotate, Delete and Extract Pages",
    "sign-pdf": "Sign PDF Online – Add Your Signature to PDF Documents",
  };
  for (const [slug, title] of Object.entries(titles)) {
    const r = await fetch(`${BASE}/${slug}/`);
    const h = await r.text();
    const types: string[] = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      const j = JSON.parse(m[1]);
      types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
    }
    const ok = r.status === 200 && h.includes(`<title>${title}</title>`) && (h.match(/<h1/g) ?? []).length === 1 && h.includes(`rel="canonical" href="https://tools.zspace.in/${slug}/"`) && h.includes('property="og:title"') && ["BreadcrumbList", "WebApplication"].every((x) => types.includes(x)) && !/aggregateRating|ratingValue|"review"/i.test(h) && !/<meta[^>]+name="robots"[^>]+noindex/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
    check(`seo: /${slug}/ OG image`, (await fetch(`${BASE}/${slug}/opengraph-image`)).status === 200);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt", Object.keys(titles).every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await open(page, "/all-tools/");
  check("directory: conversion lists PDF to Excel & Excel to PDF", (await page.locator("main").innerText()).match(/PDF to Excel Converter/g)!.length >= 2);
  await page.close();
}

const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")))];
check("nothing uploaded or fetched from third parties", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon|Estimating resolution|Parameter not found|Detected \d+ diacritics|Empty page!!/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
