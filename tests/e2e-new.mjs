// End-to-end tests for tools 06–10 (Image Resizer, PDF Merger, PDF Splitter,
// Image to PDF, Percentage Calculator). Verifies real outputs: decoded image
// dimensions/alpha, PDF page counts and page order, ZIP contents, clipboard.
// Usage: npm run build && npm start -- -p 3100 & node tests/e2e-new.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";

const BASE = process.argv[2] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const errors = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
});

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page, trigger) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  return { name: dl.suggestedFilename(), bytes: readFileSync(await dl.path()) };
}
/** Decodes any image bytes in the page and returns [w, h]. */
async function imageDims(page, bytes, type) {
  return page.evaluate(
    async ([b64, t]) => {
      const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bmp = await createImageBitmap(new Blob([bin], { type: t }));
      return [bmp.width, bmp.height];
    },
    [bytes.toString("base64"), type],
  );
}
const pageWidths = async (bytes) => (await PDFDocument.load(bytes)).getPages().map((p) => Math.round(p.getWidth()));
const pageSizes = async (bytes) => (await PDFDocument.load(bytes)).getPages().map((p) => [Math.round(p.getWidth()), Math.round(p.getHeight())]);
const numbered = (n) => 300 + 5 * (n - 1);

/* ---------------- 06 Image Resizer ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-resizer/");
  await page.locator('input[type="file"]').first().setInputFiles(["photo-rotated.jpg", "transparent.png", "photo.webp"].map((f) => FX + f));
  await page.getByText("3 of 3 images resized").waitFor({ timeout: 60000 });
  const rows = (await page.getByRole("button", { name: /^Preview / }).allInnerTexts()).map((t) => t.replace(/\s+/g, " "));
  check("resizer: locked 1200px width, aspect kept (incl. EXIF-rotated)", rows[0].includes("3000×4000 → 1200×1600") && rows[1].includes("1600×1200 → 1200×900") && rows[2].includes("2000×1500 → 1200×900"), rows.join(" | "));

  const png = await download(page, () => page.getByRole("button", { name: "Download transparent.png" }).click());
  const p = PNG.sync.read(png.bytes);
  let clear = 0;
  for (let i = 3; i < p.data.length; i += 4) if (p.data[i] === 0) clear++;
  check("resizer: PNG keeps transparency", p.width === 1200 && p.height === 900 && clear > p.width * p.height * 0.2, `${p.width}×${p.height}, ${Math.round((clear / (p.width * p.height)) * 100)}% transparent`);

  await page.getByRole("radio", { name: "Preset" }).click();
  await page.getByRole("radio", { name: /Instagram portrait/ }).click();
  await page.waitForTimeout(400);
  await page.getByText("3 of 3 images resized").waitFor({ timeout: 60000 });
  const zip = await download(page, () => page.getByRole("button", { name: /Download all/ }).click());
  const files = unzipSync(new Uint8Array(zip.bytes));
  const names = Object.keys(files);
  const dimsAll = [];
  for (const n of names) dimsAll.push(await imageDims(page, Buffer.from(files[n]), n.endsWith(".png") ? "image/png" : n.endsWith(".webp") ? "image/webp" : "image/jpeg"));
  check("resizer: preset 1080×1350 (crop to fill) for every image via ZIP", names.length === 3 && dimsAll.every(([w, h]) => w === 1080 && h === 1350), names.join(", "));

  await page.getByRole("radio", { name: "Percentage" }).click();
  await page.getByRole("button", { name: "50%", exact: true }).click();
  await page.getByText("3 of 3 images resized").waitFor({ timeout: 60000 });
  await page.waitForTimeout(300);
  const rowsPct = (await page.getByRole("button", { name: /^Preview / }).allInnerTexts()).join(" ");
  check("resizer: percentage 50%", rowsPct.includes("1600×1200 → 800×600"), rowsPct.replace(/\s+/g, " "));

  await page.getByRole("radio", { name: "Pixels" }).click();
  await page.getByRole("button", { name: "Unlock aspect ratio" }).click();
  await page.getByLabel("Width").fill("500");
  await page.getByLabel("Height").fill("500");
  await page.getByRole("radio", { name: "Fit inside (pad)" }).click();
  await page.waitForTimeout(500);
  await page.getByText("3 of 3 images resized").waitFor({ timeout: 60000 });
  const jpg = await download(page, () => page.getByRole("button", { name: "Download photo-rotated.jpg" }).click());
  const jd = await imageDims(page, jpg.bytes, "image/jpeg");
  check("resizer: unlocked exact 500×500 with padding (no distortion)", jd[0] === 500 && jd[1] === 500 && (await page.getByText(/fitted inside the new shape/).isVisible()), jd.join("×"));

  await page.getByRole("radio", { name: "WebP" }).click();
  await page.waitForTimeout(400);
  await page.getByText("3 of 3 images resized").waitFor({ timeout: 60000 });
  const webp = await download(page, () => page.getByRole("button", { name: "Download photo-rotated.jpg" }).click());
  check("resizer: output format conversion (WebP)", webp.name.endsWith(".webp") && webp.bytes.subarray(8, 12).toString() === "WEBP", webp.name);

  await page.getByLabel("Width").fill("");
  await page.waitForTimeout(600);
  check("resizer: invalid size explained", await page.getByText(/Enter both a width and a height/).first().isVisible());
  await page.getByLabel("Width").fill("500");

  await page.getByRole("button", { name: "Remove photo.webp" }).click();
  check("resizer: remove file", (await page.getByRole("button", { name: /^Preview / }).count()) === 2);
  await page.getByRole("button", { name: "Reset" }).click();
  check("resizer: reset", await page.getByText("Drop images here").isVisible());
  await page.close();
}

/* ---------------- 07 PDF Merger ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-merger/");
  await page.locator('input[type="file"]').first().setInputFiles(["pages-20.pdf", "text-only.pdf", "encrypted.pdf", "fake.pdf"].map((f) => FX + f));
  await page.getByText("20 pages", { exact: false }).first().waitFor({ timeout: 30000 });
  await page.getByText(/4 pages ·/).waitFor({ timeout: 30000 });
  check("merger: page counts and sizes shown", true);
  check("merger: encrypted PDF flagged", await page.getByText(/encrypted.pdf" is password-protected/).isVisible());
  check("merger: invalid PDF flagged", await page.getByText(/fake.pdf" isn't a PDF/).isVisible());
  await page.waitForFunction(() => document.querySelectorAll("ol[aria-label='PDF files in merge order'] img").length >= 2, null, { timeout: 30000 }).catch(() => {});
  check("merger: first-page thumbnails rendered (pdf.js)", (await page.locator("ol[aria-label='PDF files in merge order'] img").count()) >= 2);

  await page.getByRole("button", { name: "Merge PDFs", exact: true }).click();
  await page.getByText("Merged successfully").waitFor({ timeout: 60000 });
  let out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  let widths = await pageWidths(out.bytes);
  check("merger: 24 pages, skips bad files", widths.length === 24, `${widths.length} pages`);
  check("merger: order preserved (20-page file first)", widths[0] === numbered(1) && widths[19] === numbered(20) && widths[20] === 595, widths.slice(18, 22).join(","));

  await page.getByRole("button", { name: "Move text-only.pdf up" }).click();
  check("merger: reorder invalidates old result", !(await page.getByText("Merged successfully").isVisible()));
  await page.getByLabel("File name").fill("my combined");
  await page.getByRole("button", { name: "Merge PDFs", exact: true }).click();
  await page.getByText("Merged successfully").waitFor({ timeout: 60000 });
  out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  widths = await pageWidths(out.bytes);
  check("merger: reordered output (text-only first)", widths[0] === 595 && widths[3] === 595 && widths[4] === numbered(1), widths.slice(0, 6).join(","));
  check("merger: custom filename", out.name === "my combined.pdf", out.name);

  await page.getByRole("button", { name: "Remove pages-20.pdf" }).click();
  check("merger: needs two readable files", await page.getByRole("button", { name: "Merge PDFs", exact: true }).isDisabled());
  await page.getByRole("button", { name: "Reset" }).click();
  check("merger: reset", await page.getByText("Drop PDF files here").isVisible());
  await page.close();
}

/* ---------------- 08 PDF Splitter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-splitter/");
  await page.locator('input[type="file"]').first().setInputFiles(FX + "pages-20.pdf");
  await page.getByText("20 pages ·").waitFor({ timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll("button[aria-label^='Page '] img").length >= 4, null, { timeout: 30000 }).catch(() => {});
  check("splitter: page thumbnails rendered", (await page.locator("button[aria-label^='Page '] img").count()) >= 4);

  const ranges = page.getByLabel("Pages to extract");
  await ranges.fill("1, 3, 5-8");
  await page.getByRole("button", { name: "Split PDF", exact: true }).click();
  await page.getByText("1 PDF created").waitFor({ timeout: 30000 });
  let out = await download(page, () => page.getByRole("button", { name: /^Download .*\.pdf$/ }).first().click());
  let w = await pageWidths(out.bytes);
  check("splitter: extract 1, 3, 5-8 → exact pages", JSON.stringify(w) === JSON.stringify([1, 3, 5, 6, 7, 8].map(numbered)), w.join(","));

  await ranges.fill("25");
  check("splitter: out-of-range error", (await page.getByText(/Page 25 doesn't exist/).isVisible()) && (await page.getByRole("button", { name: "Split PDF", exact: true }).isDisabled()));
  await ranges.fill("8-5");
  check("splitter: backwards range error", await page.getByText(/runs backwards/).isVisible());
  await ranges.fill("abc");
  check("splitter: invalid text error", await page.getByText(/isn't a page number or range/).isVisible());

  await ranges.fill("");
  await page.getByRole("button", { name: "Page 2, not selected" }).click();
  await page.getByRole("button", { name: "Page 4, not selected" }).click();
  check("splitter: clicking thumbnails fills ranges", (await ranges.inputValue()) === "2, 4", await ranges.inputValue());

  await ranges.fill("1-3, 7-9");
  await page.getByRole("switch", { name: /One PDF per range/ }).check({ force: true });
  await page.getByRole("button", { name: "Split PDF", exact: true }).click();
  await page.getByText("2 PDFs created").waitFor({ timeout: 30000 });
  let zip = await download(page, () => page.getByRole("button", { name: /Download all/ }).click());
  let entries = unzipSync(new Uint8Array(zip.bytes));
  const counts = await Promise.all(Object.values(entries).map(async (b) => pageWidths(b)));
  check("splitter: one PDF per range", counts.length === 2 && JSON.stringify(counts) === JSON.stringify([[1, 2, 3].map(numbered), [7, 8, 9].map(numbered)]), Object.keys(entries).join(", "));

  await page.getByRole("radio", { name: "Every page" }).click();
  await page.getByRole("button", { name: "Split PDF", exact: true }).click();
  await page.getByText("20 PDFs created").waitFor({ timeout: 60000 });
  zip = await download(page, () => page.getByRole("button", { name: /Download all/ }).click());
  entries = unzipSync(new Uint8Array(zip.bytes));
  const every = await Promise.all(Object.values(entries).map(pageWidths));
  check("splitter: every page → 20 single-page PDFs in ZIP", every.length === 20 && every.every((x, i) => x.length === 1 && x[0] === numbered(i + 1)));

  await page.getByRole("radio", { name: "Groups of N" }).click();
  await page.getByLabel("Pages per file").fill("6");
  check("splitter: uneven group hint", await page.getByText("The last file will have 2 pages.").isVisible());
  await page.getByRole("button", { name: "Split PDF", exact: true }).click();
  await page.getByText("4 PDFs created").waitFor({ timeout: 30000 });
  zip = await download(page, () => page.getByRole("button", { name: /Download all/ }).click());
  const groups = await Promise.all(Object.values(unzipSync(new Uint8Array(zip.bytes))).map(async (b) => (await pageWidths(b)).length));
  check("splitter: groups of 6 → 6,6,6,2", JSON.stringify(groups) === "[6,6,6,2]", JSON.stringify(groups));
  await page.getByLabel("Pages per file").fill("0");
  check("splitter: invalid group size", await page.getByText(/Enter a group size between 1 and 20/).isVisible());

  await page.getByRole("button", { name: "Reset" }).click();
  await page.locator('input[type="file"]').first().setInputFiles(FX + "encrypted.pdf");
  check("splitter: encrypted PDF message", await page.getByText(/password-protected or encrypted/).isVisible({ timeout: 10000 }).catch(() => false) || (await page.getByText(/password-protected or encrypted/).waitFor({ timeout: 10000 }).then(() => true).catch(() => false)));
  await page.close();
}

/* ---------------- 09 Image to PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-to-pdf/");
  await page.locator('input[type="file"]').first().setInputFiles(["photo-rotated.jpg", "transparent.png", "photo.webp", "not-an-image.png"].map((f) => FX + f));
  await page.getByText(/couldn.t be read/).waitFor({ timeout: 30000 });
  await page.getByText("3 pages", { exact: true }).waitFor({ timeout: 30000 });
  check("img→pdf: preview shows 3 pages, unreadable file skipped", true);

  await page.getByRole("button", { name: "Create PDF", exact: true }).click();
  await page.getByText("PDF created").waitFor({ timeout: 60000 });
  let out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  let sizes = await pageSizes(out.bytes);
  check("img→pdf: A4 auto orientation (portrait for rotated photo, landscape others)", JSON.stringify(sizes) === JSON.stringify([[595, 842], [842, 595], [842, 595]]), JSON.stringify(sizes));

  await page.getByRole("radio", { name: "Landscape" }).click();
  await page.getByRole("button", { name: "Create PDF", exact: true }).click();
  await page.getByText("PDF created").waitFor({ timeout: 60000 });
  out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  sizes = await pageSizes(out.bytes);
  check("img→pdf: forced landscape", sizes.every(([w, h]) => w === 842 && h === 595), JSON.stringify(sizes));

  await page.getByRole("radio", { name: "Fit to image" }).click();
  await page.getByRole("radio", { name: "None" }).click();
  await page.getByRole("button", { name: "Move photo.webp up" }).click();
  await page.getByRole("button", { name: "Move photo.webp up" }).click();
  await page.getByLabel("File name").fill("holiday");
  await page.getByRole("button", { name: "Create PDF", exact: true }).click();
  await page.getByText("PDF created").waitFor({ timeout: 60000 });
  out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  sizes = await pageSizes(out.bytes);
  check("img→pdf: reorder + fit-to-image pages (96 dpi)", JSON.stringify(sizes) === JSON.stringify([[1500, 1125], [2250, 3000], [1200, 900]]), JSON.stringify(sizes));
  check("img→pdf: filename", out.name === "holiday.pdf", out.name);

  await page.getByRole("radio", { name: "Letter" }).click();
  await page.getByRole("radio", { name: "Portrait" }).click();
  await page.getByRole("radio", { name: "M", exact: true }).click();
  await page.getByRole("radio", { name: "Fill page" }).click();
  await page.getByRole("button", { name: "Create PDF", exact: true }).click();
  await page.getByText("PDF created").waitFor({ timeout: 60000 });
  out = await download(page, () => page.getByRole("button", { name: "Download PDF" }).click());
  sizes = await pageSizes(out.bytes);
  check("img→pdf: Letter portrait + fill + margins produces valid PDF", sizes.length === 3 && sizes.every(([w, h]) => w === 612 && h === 792), JSON.stringify(sizes));
  await page.close();
}

/* ---------------- 10 Percentage Calculator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/percentage-calculator/");
  const result = page.getByTestId("percent-result");
  const run = async (tab, a, b) => {
    await page.getByRole("tab", { name: tab }).click();
    await page.waitForTimeout(250);
    const inputs = page.getByRole("tabpanel").locator("input");
    await inputs.nth(0).fill(a);
    await inputs.nth(1).fill(b);
    await page.waitForTimeout(150);
    return (await result.innerText().catch(() => "")).trim();
  };
  check("percent: 20% of 500 = 100", (await run("X% of Y", "20", "500")) === "100");
  await page.getByRole("button", { name: "Copy result" }).click();
  check("percent: copy result to clipboard", (await page.evaluate(() => navigator.clipboard.readText())) === "100");
  check("percent: 50 is 25% of 200", (await run("X is what % of Y", "50", "200")) === "25%");
  check("percent: increase 100→150 = 50%", (await run("Increase", "100", "150")) === "50%");
  check("percent: decrease 200→150 = 25%", (await run("Decrease", "200", "150")) === "25%");
  check("percent: difference 40/60 = 40%", (await run("Difference", "40", "60")) === "40%");
  check("percent: discount 80 @ 25% = 60, saves 20", (await run("Discount", "80", "25")) === "60" && (await page.getByText("You save").locator("xpath=following-sibling::dd").innerText()) === "20");
  check("percent: decimals 12.5% of 80.4", (await run("X% of Y", "12.5", "80.4")) === "10.05");
  await run("X is what % of Y", "5", "0");
  check("percent: divide by zero handled", await page.getByRole("alert").filter({ hasText: "can't be zero" }).isVisible());
  await run("X% of Y", "abc", "5");
  check("percent: invalid input handled", await page.getByRole("alert").filter({ hasText: "numbers only" }).isVisible());
  await run("X% of Y", "15", "200");
  check("percent: formula and steps visible", (await page.getByText("Result = Y × X ÷ 100").isVisible()) && (await page.getByText("200 × 15 = 3,000").isVisible()));
  // Sweep edge-case inputs across every mode and read only the result panel.
  let leaked = "";
  for (const tab of ["X% of Y", "X is what % of Y", "Increase", "Decrease", "Difference", "Discount"])
    for (const [a, b] of [["0", "0"], ["-5", "5"], ["1e308", "1e308"], ["", "3"], ["0.0000001", "3"]]) {
      await run(tab, a, b);
      const t = await page.locator("div[aria-live='polite']").filter({ hasText: "Result" }).innerText();
      if (/NaN|Infinity/.test(t)) leaked += `${tab}(${a},${b}) `;
    }
  check("percent: never shows NaN/Infinity (edge-case sweep)", !leaked, leaked);
  await page.close();
}

/* ---------------- Search + directory ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["merge pdf", "PDF Merger"], ["instagram size", "Image Resizer"], ["discount", "Discount Calculator"], ["percentage increase", "Percentage Calculator"], ["jpg to pdf", "Image to PDF"], ["extract pages", "PDF Splitter"]]) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  await open(page, "/all-tools/");
  check("directory: all 10 tools listed", (await page.locator("main a[href$='/']").filter({ has: page.locator("h3") }).count()) >= 10);
  await page.close();
}

const relevant = errors.filter((e) => !/favicon|google-analytics|googletagmanager/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
