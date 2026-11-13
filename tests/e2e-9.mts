// End-to-end tests for tools 31–35: PDF to Word, Word to PDF, PDF to JPG/PNG,
// Image Converter and Image to Text (OCR). Real files in, real outputs checked.
import { chromium, type Page } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { PDFDocument } from "pdf-lib";

const BASE = process.argv[2] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const TMP = join(tmpdir(), `zspace-e2e9-${Date.now()}`);
mkdirSync(TMP, { recursive: true });
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const errors: string[] = [];
const requests: string[] = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()} @ ${m.location().url}:${m.location().lineNumber}`));
  p.on("request", (r) => requests.push(r.url()));
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), trigger()]);
  const buf = readFileSync((await dl.path())!);
  return { name: dl.suggestedFilename(), buf };
}
const btn = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" });
const txt = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ");
const upload = (page: Page, files: string | string[]) => page.locator('input[type="file"]').first().setInputFiles(Array.isArray(files) ? files.map((f) => (f.startsWith("/") ? f : FX + f)) : files.startsWith("/") ? files : FX + files);
async function pdfInfo(buf: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false }).promise;
  const pages: { w: number; h: number; text: string }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const v = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    pages.push({ w: Math.round(v.width), h: Math.round(v.height), text: tc.items.map((it) => ("str" in it ? it.str : "")).join(" ") });
  }
  return pages;
}
const docxXml = (buf: Buffer) => {
  const z = unzipSync(new Uint8Array(buf));
  return { doc: strFromU8(z["word/document.xml"]), files: Object.keys(z) };
};
const docxText = (xml: string) => [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
/** Image dimensions + whether any pixel is transparent, decoded by the browser. */
async function imgInfo(page: Page, buf: Buffer) {
  return page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes]));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const x = c.getContext("2d")!;
    x.drawImage(bmp, 0, 0);
    const d = x.getImageData(0, 0, bmp.width, bmp.height).data;
    let alpha = false;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 255) {
      alpha = true;
      break;
    }
    return { w: bmp.width, h: bmp.height, alpha, corner: [d[0], d[1], d[2], d[3]] };
  }, buf.toString("base64"));
}

/* ---------- Generate OCR / scanned fixtures with the browser ---------- */
const shot = async (html: string, name: string, w = 1000, h = 420) => {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:#fff">${html}</body></html>`);
  await p.waitForTimeout(150);
  const path = join(TMP, name);
  await p.screenshot({ path });
  await p.close();
  return path;
};
const EN = "The quick brown fox jumps over the lazy dog. Invoice number 4821 is due on 15 March 2026. Please pay the total amount before the due date.";
const enImg = await shot(`<div style="font:28px/1.5 Georgia,serif;padding:30px;color:#111">${EN.replace(". ", ".<br><br>")}</div>`, "english.png");
const hiImg = await shot(`<div style="font:40px/1.6 'Kohinoor Devanagari','Devanagari Sangam MN',sans-serif;padding:30px">नमस्ते दुनिया। यह एक परीक्षण है।</div>`, "hindi.png", 1000, 200);
const guImg = await shot(`<div style="font:40px/1.6 'Gujarati Sangam MN','Gujarati MT',sans-serif;padding:30px">નમસ્તે દુનિયા. આ એક પરીક્ષણ છે.</div>`, "gujarati.png", 1000, 200);
const rotImg = await shot(`<div style="width:420px;height:1000px;position:relative"><div style="position:absolute;left:-290px;top:470px;width:1000px;transform:rotate(90deg);font:30px Georgia,serif">Rotated invoice text reads sideways here</div></div>`, "rotated.png", 420, 1000);
const blurImg = await shot(`<div style="font:30px Georgia,serif;padding:30px;filter:blur(1.2px)">Slightly blurry receipt total 1250 rupees</div>`, "blurry.png", 1000, 160);
// Scanned PDF: page image of English text with no text layer.
const scanPdf = await (async () => {
  const pdf = await PDFDocument.create();
  const img = await pdf.embedPng(readFileSync(enImg));
  const pg = pdf.addPage([595, 842]);
  pg.drawImage(img, { x: 30, y: 842 - 30 - 535 * (420 / 1000), width: 535, height: 535 * (420 / 1000) });
  const path = join(TMP, "scanned.pdf");
  writeFileSync(path, await pdf.save());
  return path;
})();
const blankPdf = await (async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  const path = join(TMP, "blank.pdf");
  writeFileSync(path, await pdf.save());
  return path;
})();

/* ---------------- 33 PDF to JPG / PNG ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-to-jpg/");
  await upload(page, "report.pdf");
  await page.getByTestId("pdfimg-info").waitFor();
  check("pdf2img: file info", (await txt(page, "pdfimg-info")).includes("2 pages · 2 selected"), await txt(page, "pdfimg-info"));
  await page.getByTestId("pdfimg-pages").locator("img").first().waitFor({ timeout: 15000 });
  check("pdf2img: page thumbnails", (await page.getByTestId("pdfimg-pages").locator("button").count()) === 2);
  await page.getByRole("radio", { name: /72 DPI/ }).click();
  check("pdf2img: dimensions at 72 DPI", (await txt(page, "pdfimg-summary")).includes("595 × 842 px"));
  await page.getByRole("radio", { name: /300 DPI/ }).click();
  check("pdf2img: dimensions at 300 DPI", (await txt(page, "pdfimg-summary")).includes("2,480 × 3,508 px"));
  await page.getByRole("radio", { name: /150 DPI/ }).click();
  await btn(page, /^Convert 2 pages to JPG$/).click();
  await page.getByTestId("pdfimg-results").locator("li").nth(1).waitFor({ timeout: 30000 });
  const res = await txt(page, "pdfimg-results");
  check("pdf2img: JPG results", res.includes("report-page-1.jpg") && res.includes("1,240 × 1,754 px · 150 DPI"), res.slice(0, 160));
  const one = await download(page, () => btn(page, "Download page 1").click());
  const i1 = await imgInfo(page, one.buf);
  check("pdf2img: real JPG, right size, white bg", one.buf[0] === 0xff && one.buf[1] === 0xd8 && i1.w === 1240 && i1.h === 1754 && !i1.alpha && i1.corner[0] > 250);
  const zip = await download(page, () => btn(page, "Download all (ZIP)").click());
  const z = unzipSync(new Uint8Array(zip.buf));
  check("pdf2img: ZIP with both pages", zip.name === "report-jpg.zip" && Object.keys(z).sort().join() === "report-page-1.jpg,report-page-2.jpg");
  // PNG, transparent, page range
  await page.getByRole("radio", { name: /^PNG/ }).click();
  await page.getByLabel("Transparent where the page has no background").check();
  await page.locator("#pdfimg-range").fill("2");
  await btn(page, "Select").click();
  check("pdf2img: range selection", (await txt(page, "pdfimg-info")).includes("1 selected"));
  await btn(page, /^Convert 1 page to PNG$/).click();
  await page.getByTestId("pdfimg-results").getByText("report-page-2.png").waitFor({ timeout: 30000 });
  const png = await download(page, () => btn(page, "Download page 2").click());
  const i2 = await imgInfo(page, png.buf);
  check("pdf2img: PNG with transparency", png.buf.subarray(1, 4).toString() === "PNG" && i2.alpha && i2.w === 1240);
  await page.locator("#pdfimg-range").fill("5-9");
  check("pdf2img: invalid range message", (await page.getByText(/only has 2 pages|doesn't exist|out of range|between 1 and 2/i).count()) > 0);
  // Cancel on a longer document
  await btn(page, "Another PDF").click();
  await upload(page, "pages-20.pdf");
  await page.getByTestId("pdfimg-info").waitFor();
  await page.getByRole("radio", { name: /300 DPI/ }).click();
  await btn(page, /^Convert 20 pages to (JPG|PNG)$/).click();
  await page.getByText(/Rendering page [2-9] of 20/).waitFor({ timeout: 15000 });
  await btn(page, "Cancel").click();
  await page.getByText(/Cancelled after \d+ of 20 pages/).waitFor({ timeout: 30000 });
  check("pdf2img: cancel stops early", true);
  // Errors
  await btn(page, "Another PDF").click();
  await upload(page, "encrypted.pdf");
  await page.getByText("appears to be password protected. Please upload an unlocked copy.").waitFor({ timeout: 15000 });
  check("pdf2img: password-protected message", true);
  await upload(page, "corrupt.pdf");
  await page.getByText("corrupt.pdf couldn't be opened. It may be damaged or incomplete.").waitFor({ timeout: 15000 });
  check("pdf2img: corrupted PDF message", true);
  await upload(page, "tiny.jpg");
  check("pdf2img: non-PDF rejected", await page.getByText("isn't a PDF").isVisible());
  await page.close();
}

/* ---------------- 34 Image Converter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-converter/");
  const list = page.getByTestId("ic-list");
  const doneCount = async (n: number) => page.waitForFunction((n) => document.querySelectorAll('[data-testid="ic-list"] li[data-status="done"], [data-testid="ic-list"] li[data-status="error"]').length >= n, n, { timeout: 60000 });
  await upload(page, ["quadrants.png", "transparent.png", "quadrants.heic", "quadrants.avif", "photo.webp", "animated.gif", "corrupt.jpg"]);
  await doneCount(7);
  const t = await list.innerText();
  check("ic: PNG → JPG", t.includes("PNG 400×300") && t.includes("quadrants.jpg"), t.slice(0, 200));
  check("ic: HEIC decoded → JPG", /HEIC 400×300[\s\S]*→ JPG 400×300/.test(t), t);
  check("ic: AVIF decoded → JPG", /AVIF 400×300[\s\S]*→ JPG 400×300/.test(t));
  check("ic: WebP → JPG", /WebP [\d,]+×[\d,]+/.test(t));
  check("ic: transparent PNG flattened, with notice", t.includes("Transparency filled with #ffffff") && (await page.getByTestId("ic-bg").isVisible()));
  check("ic: animated GIF first-frame notice", await page.getByText(/Animated GIFs are converted as a still image of the first frame/).isVisible());
  check("ic: corrupted image error", /corrupt\.jpg[\s\S]*couldn't be read/.test(t));
  check("ic: duplicate names de-duplicated", t.includes("quadrants.jpg") && t.includes("quadrants-1.jpg") && t.includes("quadrants-2.jpg"));
  const heicRow = list.locator("li", { hasText: "quadrants.heic" });
  const heicOut = await download(page, () => heicRow.getByRole("button", { name: /\.jpg$/ }).click());
  const hi = await imgInfo(page, heicOut.buf);
  check("ic: HEIC output is a real JPG", heicOut.buf[0] === 0xff && heicOut.buf[1] === 0xd8 && hi.w === 400 && hi.h === 300 && hi.corner[0] > 200 && hi.corner[1] < 60, JSON.stringify(hi));
  const tRow = list.locator("li", { hasText: "transparent.png" });
  const tOut = await download(page, () => tRow.getByRole("button", { name: /\.jpg$/ }).click());
  check("ic: flattened JPG has no alpha", !(await imgInfo(page, tOut.buf)).alpha);
  // Settings change re-converts: PNG keeps transparency, resize + rename
  await page.getByRole("radio", { name: "PNG", exact: true }).click();
  await page.getByLabel("Width in pixels").fill("200");
  await page.locator("#ic-name").fill("{name}-small");
  await page.waitForTimeout(600);
  await doneCount(7);
  await page.waitForFunction(() => !document.querySelector('[data-testid="ic-list"] li[data-status="processing"], [data-testid="ic-list"] li[data-status="queued"]'), null, { timeout: 60000 });
  const t2 = await list.innerText();
  check("ic: resize keeps aspect ratio", /→ PNG 200×150/.test(t2), t2.slice(0, 300));
  const pRow = list.locator("li", { hasText: "transparent.png" });
  const pOut = await download(page, () => pRow.getByRole("button", { name: /-small\.png$/ }).click());
  check("ic: PNG keeps transparency + renamed", pOut.name === "transparent-small.png" && (await imgInfo(page, pOut.buf)).alpha);
  // WebP and AVIF output
  await page.getByLabel("Width in pixels").fill("");
  await page.getByRole("radio", { name: "WebP", exact: true }).click();
  await page.waitForTimeout(600);
  await page.waitForFunction(() => !document.querySelector('[data-testid="ic-list"] li[data-status="processing"], [data-testid="ic-list"] li[data-status="queued"]'), null, { timeout: 60000 });
  const wOut = await download(page, () => list.locator("li", { hasText: "quadrants.png" }).getByRole("button", { name: /\.webp$/ }).click());
  check("ic: JPG/PNG → WebP", wOut.buf.subarray(0, 4).toString() === "RIFF" && wOut.buf.subarray(8, 12).toString() === "WEBP");
  await page.getByRole("radio", { name: "AVIF", exact: true }).click();
  check("ic: AVIF encoder note", (await page.getByTestId("avif-note").innerText()).length > 10);
  await page.waitForTimeout(600);
  await page.waitForFunction(() => !document.querySelector('[data-testid="ic-list"] li[data-status="processing"], [data-testid="ic-list"] li[data-status="queued"]'), null, { timeout: 120000 });
  const aOut = await download(page, () => list.locator("li", { hasText: "quadrants.png" }).getByRole("button", { name: /\.avif$/ }).click());
  check("ic: → AVIF (real AVIF file)", aOut.buf.subarray(4, 12).toString() === "ftypavif", aOut.buf.subarray(0, 16).toString("hex"));
  const ai = await imgInfo(page, aOut.buf);
  check("ic: AVIF output decodes", ai.w === 400 && ai.h === 300);
  const zip = await download(page, () => btn(page, "Download all (ZIP)").click());
  check("ic: ZIP of converted files", Object.keys(unzipSync(new Uint8Array(zip.buf))).filter((n) => n.endsWith(".avif")).length === 6);
  await upload(page, "not-an-image.png");
  await page.waitForTimeout(800);
  check("ic: fake image rejected by signature", /not-an-image\.png[\s\S]*doesn't look like a supported image/.test(await list.innerText()));
  await btn(page, "Clear").click();
  check("ic: clear", (await page.getByTestId("ic-list").count()) === 0);
  await page.close();
}

/* ---------------- 35 Image to Text (OCR) ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-to-text/");
  await upload(page, enImg);
  await btn(page, "Extract text").click();
  await page.getByTestId("ocr-stats").waitFor({ timeout: 120000 });
  const en = await page.locator("#ocr-text").inputValue();
  check("ocr: English text extracted", /quick brown fox/i.test(en) && /4821/.test(en) && /March 2026/.test(en), en.slice(0, 120));
  check("ocr: multiple paragraphs kept", /\n\s*\n/.test(en) || en.split("\n").length >= 2);
  const stats = await txt(page, "ocr-stats");
  const conf = Number(/confidence (\d+)%/.exec(stats)?.[1] ?? 0);
  check("ocr: confidence shown", conf >= 70, stats);
  const dl = await download(page, () => btn(page, "TXT").click());
  check("ocr: TXT download", dl.name === "english.txt" && dl.buf.toString("utf8") === en);
  const dx = await download(page, () => btn(page, "DOCX").click());
  check("ocr: DOCX download", dx.name === "english.docx" && /quick brown fox/i.test(docxText(docxXml(dx.buf).doc)));
  await page.locator("#ocr-text").fill(en + "\nEdited by me");
  check("ocr: result is editable", (await page.locator("#ocr-text").inputValue()).endsWith("Edited by me"));
  // Hindi
  await btn(page, "Another image").click();
  await upload(page, hiImg);
  await page.getByRole("button", { name: "Hindi", exact: true }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await btn(page, "Extract text").click();
  await page.getByTestId("ocr-stats").waitFor({ timeout: 180000 });
  const hi = await page.locator("#ocr-text").inputValue();
  check("ocr: Hindi (Devanagari)", /नमस्ते/.test(hi) && /परीक्षण/.test(hi), hi);
  // Gujarati
  await btn(page, "Another image").click();
  await upload(page, guImg);
  await page.getByRole("button", { name: "Gujarati", exact: true }).click();
  await page.getByRole("button", { name: "Hindi", exact: true }).click();
  await btn(page, "Extract text").click();
  await page.getByTestId("ocr-stats").waitFor({ timeout: 180000 });
  const gu = await page.locator("#ocr-text").inputValue();
  check("ocr: Gujarati", /નમસ્તે/.test(gu) || /પરીક્ષણ/.test(gu), gu);
  // Rotated: fix with Rotate left, crop not needed
  await btn(page, "Another image").click();
  await upload(page, rotImg);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Gujarati", exact: true }).click();
  await btn(page, "Rotate left").click();
  await btn(page, "Extract text").click();
  await page.getByTestId("ocr-stats").waitFor({ timeout: 120000 });
  const rot = await page.locator("#ocr-text").inputValue();
  check("ocr: rotated image after Rotate", /invoice text reads sideways/i.test(rot), rot);
  await page.getByLabel("Show what OCR reads").check();
  await page.getByTestId("ocr-prepared").waitFor();
  check("ocr: processed preview shown", true);
  await page.getByLabel("Show what OCR reads").uncheck();
  // Crop: drag over the image
  await btn(page, "Crop").click();
  const img = page.getByAltText("Original image");
  const box = (await img.boundingBox())!;
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, { steps: 5 });
  await page.mouse.up();
  check("ocr: crop applied", await btn(page, "Clear crop").isVisible());
  // Blurry
  await btn(page, "Another image").click();
  await upload(page, blurImg);
  await page.locator("#ocr-contrast").fill("40");
  await btn(page, "Extract text").click();
  await page.getByTestId("ocr-stats").waitFor({ timeout: 120000 });
  const bl = await page.locator("#ocr-text").inputValue();
  check("ocr: blurry image still readable", /receipt/i.test(bl) || /1250/.test(bl), bl);
  await btn(page, "Another image").click();
  await upload(page, "quadrants.heic");
  await page.getByText(/HEIC images aren't supported for OCR yet/).waitFor({ timeout: 10000 });
  check("ocr: unsupported format explained", true);
  await page.close();
}

/* ---------------- 31 PDF to Word ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-to-word/");
  await upload(page, "report.pdf");
  await page.getByTestId("p2w-info").waitFor({ timeout: 20000 });
  check("p2w: file info", (await txt(page, "p2w-info")).includes("2 pages"));
  check("p2w: first page preview", await page.getByAltText("First page preview").isVisible());
  await btn(page, "Convert to Word").click();
  await page.getByTestId("p2w-stats").waitFor({ timeout: 60000 });
  const stats = await txt(page, "p2w-stats");
  check("p2w: stats", /Pages 2/.test(stats) && /Tables 1/.test(stats) && /Images 1/.test(stats) && Number(/Headings (\d+)/.exec(stats)?.[1]) >= 3, stats);
  const dl = await download(page, () => btn(page, /^Download report\.docx/).click());
  const { doc, files } = docxXml(dl.buf);
  const t = docxText(doc);
  check("p2w: real DOCX", dl.name === "report.docx" && files.includes("word/document.xml") && files.some((f) => f.startsWith("word/media/")));
  check("p2w: text", t.includes("Quarterly Report") && t.includes("Revenue grew") && t.includes("Next steps"), t.slice(0, 200));
  check("p2w: paragraph re-joined across lines", /Revenue grew steadily across every region, and operating costs stayed within the budget agreed/.test(t.replace(/\s+/g, " ")));
  check("p2w: heading style", /<w:pStyle w:val="Heading1"\/>/.test(doc) && /<w:pStyle w:val="Heading2"\/>/.test(doc));
  check("p2w: bold + italic runs", /<w:b\/>/.test(doc) && /<w:i\/>/.test(doc));
  check("p2w: table with cells", /<w:tbl>/.test(doc) && /1,20,000/.test(doc) && (doc.match(/<w:tr>/g) ?? []).length === 4);
  check("p2w: image", /<w:drawing>/.test(doc));
  check("p2w: centred line", /<w:jc w:val="center"\/>[\s\S]{0,1500}Thank you for reading/.test(doc));
  check("p2w: one section per page, A4", (doc.match(/<w:sectPr/g) ?? []).length === 2 && /w:w="11906" w:h="16838"/.test(doc));
  check("p2w: font kept", /w:ascii="Arial"/.test(doc));
  // Two-column reading order
  await btn(page, "Convert another file").click();
  await upload(page, "two-column.pdf");
  await page.getByTestId("p2w-info").waitFor();
  await btn(page, "Convert to Word").click();
  await page.getByTestId("p2w-stats").waitFor({ timeout: 60000 });
  const tc = docxText(docxXml((await download(page, () => btn(page, /^Download two-column\.docx/).click())).buf).doc).replace(/\s+/g, " ");
  check("p2w: two columns read in order", tc.indexOf("Left column line 14") < tc.indexOf("Right column line 1 ") && tc.indexOf("Newsletter") < tc.indexOf("Left column line 1 "), tc.slice(0, 200));
  // Scanned PDF with OCR
  await btn(page, "Convert another file").click();
  await upload(page, scanPdf);
  await page.getByTestId("p2w-scanned").waitFor({ timeout: 20000 });
  check("p2w: scanned PDF detected, OCR on by default", (await page.getByRole("switch", { name: /Recognise text on scanned pages/ }).isChecked()));
  await btn(page, "Convert to Word").click();
  await page.getByTestId("p2w-stats").waitFor({ timeout: 180000 });
  const so = docxText(docxXml((await download(page, () => btn(page, /^Download scanned\.docx/).click())).buf).doc);
  check("p2w: OCR'd scanned text is editable", /quick brown fox/i.test(so) && /4821/.test(so), so.slice(0, 160));
  await page.getByRole("switch", { name: /Recognise text on scanned pages/ }).uncheck({ force: true });
  await btn(page, "Convert again").click();
  await page.getByText(/scanned page is included as images|scanned pages are included as images|is included as images/).waitFor({ timeout: 60000 });
  const si = docxXml((await download(page, () => btn(page, /^Download scanned\.docx/).click())).buf).doc;
  check("p2w: without OCR the page is kept as an image (not empty)", /<w:drawing>/.test(si));
  // Errors
  await btn(page, "Convert another file").click();
  await upload(page, blankPdf);
  await page.getByTestId("p2w-info").waitFor();
  await btn(page, "Convert to Word").click();
  await page.getByText("No text or images could be found in this PDF").waitFor({ timeout: 30000 });
  check("p2w: empty PDF never produces an empty DOCX", !(await page.getByRole("button", { name: /^Download blank\.docx/ }).count()));
  await btn(page, "Convert another file").click();
  await upload(page, "encrypted.pdf");
  await page.getByText("appears to be password protected. Please upload an unlocked copy.").waitFor({ timeout: 15000 });
  check("p2w: password-protected message", true);
  await upload(page, "corrupt.pdf");
  await page.getByText("corrupt.pdf couldn't be opened. It may be damaged or incomplete.").waitFor({ timeout: 15000 });
  check("p2w: corrupted PDF message", true);
  await page.close();
}

/* ---------------- 32 Word to PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/word-to-pdf/");
  // Stub the print dialog; page.pdf() captures what would be printed.
  await page.evaluate(() => {
    window.print = () => undefined;
  });
  await upload(page, "proposal.docx");
  await page.getByTestId("w2p-info").waitFor({ timeout: 30000 });
  const info = await txt(page, "w2p-info");
  check("w2p: document info", info.includes("Pages 2") && info.includes("A4 portrait") && info.includes("Tables · images 1 · 1"), info);
  const pv = await page.getByTestId("w2p-preview").innerText();
  check("w2p: preview renders content", pv.includes("Project Proposal") && pv.includes("ZSpace Header Text") && pv.includes("₹1,10,000"));
  check("w2p: preview image loaded", await page.getByTestId("w2p-preview").locator("img").first().evaluate((i: HTMLImageElement) => i.naturalWidth > 0));
  await btn(page, "Save as PDF").click();
  check("w2p: print title = file name", (await page.title()) === "proposal");
  const pdf = await pdfInfo(await page.pdf({ preferCSSPageSize: true, printBackground: true }));
  check("w2p: PDF pages + A4 size", pdf.length === 2 && pdf.every((p) => p.w === 595 && p.h === 842), JSON.stringify(pdf.map((p) => [p.w, p.h])));
  const all = pdf.map((p) => p.text).join(" ").replace(/\s+/g, "");
  check("w2p: PDF text selectable incl. header/footer/table", all.includes("ProjectProposal") && all.includes("ZSpaceHeaderText") && all.includes("Confidentialfooter") && all.includes("₹1,10,000") && pdf[1].text.includes("Second Page Heading"), all.slice(0, 200));
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  // Landscape + combined
  await upload(page, "landscape.docx");
  await page.getByText("landscape.docx").waitFor();
  await page.getByRole("button", { name: /^landscape\.docx/ }).click();
  await page.getByTestId("w2p-info").getByText("Letter landscape").waitFor({ timeout: 30000 });
  check("w2p: Letter landscape detected", true);
  await btn(page, "Save as PDF").click();
  const lp = await pdfInfo(await page.pdf({ preferCSSPageSize: true }));
  check("w2p: landscape PDF page", lp.length === 1 && lp[0].w === 792 && lp[0].h === 612, JSON.stringify(lp.map((p) => [p.w, p.h])));
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await btn(page, "Save all 2 as one PDF").click();
  const cp = await pdfInfo(await page.pdf({ preferCSSPageSize: true }));
  check("w2p: combined PDF keeps each page size", cp.length === 3 && cp[0].w === 595 && cp[2].w === 792, JSON.stringify(cp.map((p) => [p.w, p.h])));
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  // Long document without saved layout → flow mode
  await upload(page, "long.docx");
  await page.getByRole("button", { name: /^long\.docx/ }).click();
  await page.getByTestId("w2p-flow").waitFor({ timeout: 30000 });
  await btn(page, "Save as PDF").click();
  const fp = await pdfInfo(await page.pdf({ preferCSSPageSize: true }));
  check("w2p: long document flows over several pages", fp.length >= 3 && fp[fp.length - 1].text.includes("Flowing paragraph number 120"), String(fp.length));
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  // Errors
  await upload(page, "legacy.doc");
  await page.getByRole("button", { name: /^legacy\.doc/ }).click();
  check("w2p: legacy .doc explained", await page.getByText(/older .doc file/).isVisible());
  await upload(page, "not-word.docx");
  await page.getByRole("button", { name: /^not-word\.docx/ }).click();
  await page.getByText(/couldn't be opened|not a Word document/).waitFor({ timeout: 15000 });
  check("w2p: broken .docx explained", true);
  await upload(page, "report.pdf");
  check("w2p: non-Word file rejected", await page.getByText(/not a Word document \(\.docx\)/).isVisible());
  await page.close();
}

/* ---------------- Registry, categories, SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/all-tools/");
  const main = await page.locator("main").innerText();
  check("directory: File & Unit Conversion lists the converters", main.includes("File & Unit Conversion"));
  const convSection = await page.locator("section, div").filter({ hasText: /^File & Unit Conversion/ }).first().innerText().catch(() => main);
  check("directory: tools appear in several categories (one page)", (main.match(/PDF to Word Converter/g) ?? []).length >= 2 && convSection.length > 0);
  check("directory: planned converters removed", !main.includes("Image Format Converter") && !/PDF to Image\b/.test(main));
  await open(page, "/");
  check("home: PDF to Word in popular tools", (await page.locator("main").innerText()).includes("PDF to Word Converter"));
  for (const [q, want] of [["pdf to word", "PDF to Word"], ["docx to pdf", "Word to PDF"], ["pdf to png", "PDF to JPG"], ["heic to jpg", "Image Converter"], ["ocr", "Image to Text"], ["photo to text", "Image to Text"]] as const) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "pdf-to-word": "PDF to Word Converter – Convert PDF to Editable DOCX Online",
    "word-to-pdf": "Word to PDF Converter – Convert DOC and DOCX to PDF Online",
    "pdf-to-jpg": "PDF to JPG &amp; PNG Converter – Convert PDF Pages to Images",
    "image-converter": "Image Converter – Convert JPG, PNG, WebP, HEIC &amp; AVIF Online",
    "image-to-text": "Image to Text Converter – Extract Text from Images Online",
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
    const og = await fetch(`${BASE}/${slug}/opengraph-image`);
    check(`seo: /${slug}/ OG image`, og.status === 200);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt", Object.keys(titles).every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await page.close();
}

const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")))];
check("nothing uploaded or fetched from third parties", external.length === 0, external.slice(0, 3).join(" | "));
// Tesseract's engine prints its own diagnostics (e.g. "Estimating resolution as …") to the console.
const relevant = errors.filter((e) => !/favicon|Estimating resolution|Parameter not found|Detected \d+ diacritics|Empty page!!/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
