// End-to-end tests for tools 21–25 (Color, UUID, Markdown, Invoice, Cropper).
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-5.mts
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const errors: string[] = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const buf = readFileSync((await dl.path())!);
  return { name: dl.suggestedFilename(), text: buf.toString("utf8"), buf };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const settle = (page: Page, ms = 150) => page.waitForTimeout(ms);

async function pdfText(buf: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useWorkerFetch: false }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    pages.push(tc.items.map((it) => ("str" in it ? it.str : "")).join("")); // font-fallback runs (₹) are separate items
  }
  const size = (await doc.getPage(1)).getViewport({ scale: 1 });
  return { pages, w: Math.round(size.width), h: Math.round(size.height) };
}

/* ---------------- 21 Color ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/color-picker/");
  const hex = page.locator("#cp-hex");
  const rgb = page.locator("#cp-rgb");
  const hsl = page.locator("#cp-hsl");
  const typeIn = async (loc: typeof hex, v: string) => {
    await loc.click();
    await loc.fill(v);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await settle(page);
  };
  await typeIn(hex, "#F80");
  check("color: 3-digit HEX → RGB/HSL", (await rgb.inputValue()) === "rgb(255, 136, 0)" && (await hsl.inputValue()) === "hsl(32, 100%, 50%)" && (await hex.inputValue()) === "#FF8800");
  await typeIn(rgb, "rgb(240, 120, 69)");
  check("color: RGB → HEX", (await hex.inputValue()) === "#F07845");
  await typeIn(hsl, "hsl(210, 50%, 40%)");
  check("color: HSL → HEX/RGB", (await hex.inputValue()) === "#336699" && (await rgb.inputValue()) === "rgb(51, 102, 153)");
  await hex.click();
  await hex.fill("#12345");
  check("color: invalid HEX flagged", await page.getByText("Not a valid HEX value.").isVisible());
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  const counts: number[] = [];
  for (const h of ["Complementary", "Analogous", "Triadic", "Split complementary", "Tetradic", "Monochromatic"]) {
    await page.getByRole("radio", { name: h, exact: true }).click();
    counts.push(await page.getByTestId("palette").getByRole("button", { name: /^Use #/ }).count());
  }
  check("color: all six palettes", JSON.stringify(counts) === "[2,3,3,3,4,5]", JSON.stringify(counts));
  check("color: 11 tints & shades", (await page.getByTestId("shades").getByRole("button").count()) === 11);
  await page.getByRole("radio", { name: "Complementary", exact: true }).click();
  const second = page.getByTestId("palette").getByRole("button", { name: /^Use #/ }).nth(1);
  const label = (await second.getAttribute("aria-label"))!.replace("Use ", "").replace(" as the main colour", "");
  await second.click();
  check("color: swatch → main colour", (await hex.inputValue()) === label, label);
  await page.getByTestId("palette").getByRole("button", { name: /^Copy RGB/ }).first().click();
  check("color: copy swatch RGB", (await clip(page)).startsWith("rgb("));
  await typeIn(page.locator("#cp-fg"), "#777777");
  await typeIn(page.locator("#cp-bg"), "#FFFFFF");
  const w = (await page.getByTestId("wcag").innerText()).replace(/\s+/g, " ");
  check("color: #777 on white = 4.47:1, AA fail, AA large pass", (await page.getByTestId("contrast-ratio").innerText()) === "4.47:1" && w.includes("AA · normal text (4.5:1) Fail") && w.includes("AA · large text (3:1) Pass"), w);
  await typeIn(page.locator("#cp-fg"), "#767676");
  check("color: #767676 passes AA", (await page.getByTestId("wcag").innerText()).replace(/\s+/g, " ").includes("AA · normal text (4.5:1) Pass"));
  await typeIn(page.locator("#cp-fg"), "#000000");
  check("color: black/white = 21:1, AAA pass", (await page.getByTestId("contrast-ratio").innerText()) === "21.00:1" && !(await page.getByTestId("wcag").innerText()).includes("Fail"));
  const before = await hex.inputValue();
  await btn(page, "Random").click();
  check("color: random + history", (await hex.inputValue()) !== before && (await page.getByText("Recent (this visit)").isVisible()));
  await btn(page, "Copy share link").click();
  const link = await clip(page);
  check("color: share link", /\/color-picker\/\?c=[0-9a-f]{6}$/.test(link), link);
  const json = await download(page, () => btn(page, "JSON").click());
  check("color: palette JSON", JSON.parse(json.text).palette.length === 2);
  await open(page, "/color-picker/?c=45bdf0");
  check("color: opens shared colour", (await hex.inputValue()) === "#45BDF0");
  await open(page, "/color-picker/?c=%22%3E%3Cscript%3Ealert(1)%3C/script%3E");
  check("color: malicious share param ignored", (await hex.inputValue()) === "#F07845");
  await page.close();
}

/* ---------------- 22 UUID ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/uuid-generator/");
  const rows = () => page.getByTestId("uuid-list").locator("li span[translate=no]");
  check("uuid: 10 generated on load", (await rows().count()) === 10);
  await page.locator("#uuid-qty").fill("1000");
  await page.getByRole("button", { name: /^Generate 1,000 UUIDs$/ }).click();
  await page.waitForFunction(() => document.querySelectorAll("[data-testid=uuid-list] li").length === 1000);
  const v4 = await rows().allInnerTexts();
  const re4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  check("uuid: 1,000 valid v4, unique", v4.length === 1000 && v4.every((u) => re4.test(u)) && new Set(v4).size === 1000);
  await page.getByRole("radio", { name: /v7/ }).click();
  await page.locator("#uuid-qty").fill("200");
  await page.getByRole("button", { name: /^Generate 200 UUIDs$/ }).click();
  await settle(page);
  const v7 = await rows().allInnerTexts();
  check("uuid: v7 version/variant + time-ordered", v7.length === 200 && v7.every((u) => /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab]/.test(u)) && v7.every((u, i) => i === 0 || u > v7[i - 1]));
  await page.getByRole("switch", { name: "Uppercase" }).check({ force: true });
  await page.getByRole("switch", { name: "Remove hyphens" }).check({ force: true });
  const fmt = await rows().first().innerText();
  check("uuid: display formatting", /^[0-9A-F]{32}$/.test(fmt) && (await page.getByText(/standard form is lowercase with hyphens/).isVisible()));
  await page.getByRole("switch", { name: "Uppercase" }).uncheck({ force: true });
  await page.getByRole("switch", { name: "Remove hyphens" }).uncheck({ force: true });
  await btn(page, "Copy all").click();
  check("uuid: copy all", (await clip(page)).split("\n").length === 200);
  await btn(page, "Copy UUID 1").click();
  check("uuid: copy one", (await clip(page)) === v7[0]);
  const txt = await download(page, () => btn(page, ".txt").click());
  const csv = await download(page, () => btn(page, ".csv").click());
  check("uuid: TXT + CSV downloads", txt.text.trim().split("\n").length === 200 && csv.text.startsWith("uuid\n") && csv.text.trim().split("\n").length === 201);
  await page.locator("#uuid-check").fill(v7[0].toUpperCase());
  check("uuid: validator reads v7 timestamp", (await page.getByTestId("uuid-check").innerText()).includes("version 7") && (await page.getByTestId("uuid-check").innerText()).includes("created 20"));
  await page.locator("#uuid-check").fill("not-a-uuid");
  check("uuid: validator rejects", (await page.getByTestId("uuid-check").innerText()).includes("Not a valid UUID"));
  await btn(page, "Clear").click();
  check("uuid: clear", (await rows().count()) === 0);
  await page.close();
}

/* ---------------- 23 Markdown ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/markdown-editor/");
  const input = page.locator("#md-input");
  const preview = page.getByTestId("md-preview");
  await btn(page, "Sample").click();
  await settle(page, 400);
  const html = await preview.innerHTML();
  check(
    "md: headings, emphasis, strike, lists, tasks, quote, code, table, hr, links",
    ["<h1", "<h2", "<strong>", "<em>", "<del>", "<ol>", "<ul>", 'type="checkbox"', "<blockquote>", "<pre><code", "<table>", "<hr>", 'rel="noopener noreferrer nofollow"'].every((s) => html.includes(s)),
  );
  check("md: task checkboxes disabled", (await preview.locator("input[type=checkbox]").count()) === 3 && (await preview.locator("input[type=checkbox]:not([disabled])").count()) === 0);
  check("md: unicode", html.includes("日本語") && html.includes("🎉"));
  check("md: stats", /\d+ words · \d+ chars · \d+ min read/.test(await page.getByText(/words ·/).innerText()));

  const payloads = [
    "<script>window.__xss=1</script>",
    '<img src=x onerror="window.__xss=1">',
    "[a](javascript:window.__xss=1)",
    "[b](JaVaScRiPt:window.__xss=1)",
    "[c](java\tscript:window.__xss=1)",
    '<a href="javascript:window.__xss=1">raw</a>',
    "<iframe src=\"javascript:window.__xss=1\"></iframe>",
    "[d](data:text/html;base64,PHNjcmlwdD53aW5kb3cuX194c3M9MTwvc2NyaXB0Pg==)",
    "![e](javascript:window.__xss=1)",
    '<svg onload="window.__xss=1"></svg>',
    "<details open ontoggle=\"window.__xss=1\">x</details>",
    "[f](vbscript:msgbox)",
  ].join("\n\n");
  await input.fill(payloads);
  await settle(page, 500);
  for (const a of await preview.locator("a").all()) await a.click({ modifiers: ["Alt"], force: true, trial: true }).catch(() => {});
  const xss = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss);
  const bad = await preview.evaluate((el) => {
    const issues: string[] = [];
    el.querySelectorAll("*").forEach((n) => {
      if (["SCRIPT", "IFRAME", "SVG", "OBJECT", "EMBED"].includes(n.tagName)) issues.push(n.tagName);
      for (const at of Array.from(n.attributes)) if (/^on/i.test(at.name) || /^\s*(javascript|vbscript|data:text)/i.test(at.value)) issues.push(`${n.tagName}[${at.name}]`);
    });
    return issues;
  });
  check("md: XSS payloads neutralised", xss === undefined && bad.length === 0, bad.join(","));
  check("md: unsafe links shown as text", (await preview.locator(".md-unsafe").count()) >= 4);

  // Toolbar inserts at cursor without destroying text
  await input.fill("hello world");
  await input.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 11));
  await btn(page, "Bold").click();
  await settle(page, 200);
  check("md: toolbar wraps selection", (await input.inputValue()) === "hello **world**", await input.inputValue());
  await page.keyboard.press("ControlOrMeta+z");
  await settle(page, 200);
  check("md: undo works after toolbar", (await input.inputValue()) === "hello world", await input.inputValue());
  await input.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(11, 11));
  await btn(page, "Table").click();
  await settle(page, 300);
  check("md: table inserted as block + rendered", (await input.inputValue()).startsWith("hello world\n\n| Column |") && (await preview.locator("table").count()) === 1);
  await input.fill("one\ntwo");
  await input.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 7));
  await btn(page, "Numbered list").click();
  await settle(page, 200);
  check("md: list prefix per line", (await input.inputValue()) === "1. one\n2. two");

  await input.fill("# Notes\n\nSome **text**.");
  await settle(page, 300);
  const md = await download(page, () => btn(page, "Download .md").click());
  const ex = await download(page, () => btn(page, "Export HTML").click());
  check("md: download .md", md.name === "notes.md" && md.text === "# Notes\n\nSome **text**.");
  check("md: export standalone HTML", ex.text.startsWith("<!doctype html>") && ex.text.includes("<title>Notes</title>") && ex.text.includes("<strong>text</strong>"));
  await btn(page, "Copy HTML").click();
  check("md: copy HTML", (await clip(page)).includes("<h1>Notes</h1>"));

  await page.getByRole("switch", { name: /Keep draft/ }).check({ force: true });
  await settle(page, 300);
  await page.reload();
  await page.waitForLoadState("networkidle");
  check("md: opt-in local draft restored", (await page.locator("#md-input").inputValue()) === "# Notes\n\nSome **text**.");
  await page.getByRole("switch", { name: /Keep draft/ }).uncheck({ force: true });
  check("md: turning off deletes draft", (await page.evaluate(() => localStorage.getItem("zs-markdown-draft"))) === null);

  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 300);
  const editVisible = await page.locator("#md-input").isVisible();
  await page.getByRole("radio", { name: "Preview" }).click();
  check("md: mobile Edit/Preview toggle", editVisible && (await preview.isVisible()) && !(await page.locator("#md-input").isVisible()));
  await page.close();
}

/* ---------------- 24 Invoice ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/invoice-generator/");
  await btn(page, "Load sample").click();
  await settle(page, 300);
  check("invoice: live totals (sample)", (await page.getByTestId("invoice-due").innerText()) === "₹1,39,594.00");
  const t = (await page.getByTestId("invoice-totals").innerText()).replace(/\s+/g, " ");
  check("invoice: breakdown", t.includes("Item discounts −₹2,200.00") && t.includes("Taxable amount ₹1,18,300.00") && t.includes("CGST @ 9% ₹10,647.00") && t.includes("SGST @ 9% ₹10,647.00"), t);
  let pdf = await download(page, () => btn(page, "Download PDF").click());
  let p = await pdfText(pdf.buf);
  check("invoice: real A4 PDF with ₹ totals", p.pages.length === 1 && p.w === 595 && p.h === 842 && p.pages[0].includes("INVOICE") && p.pages[0].includes("₹1,39,594.00") && p.pages[0].includes("Lumen Retail") && p.pages[0].includes("CGST @ 9%"), `${p.pages.length}p ${p.w}×${p.h}`);

  // Switch to IGST + overall discount + paid
  await page.getByRole("radio", { name: /IGST/ }).click();
  await page.locator("#inv-discount").fill("10");
  await page.locator("#inv-paid").fill("50000");
  await settle(page);
  const t2 = (await page.getByTestId("invoice-totals").innerText()).replace(/\s+/g, " ");
  check("invoice: IGST + invoice discount + balance", t2.includes("Discount (10%) −₹11,830.00") && t2.includes("IGST @ 18% ₹19,164.60") && t2.includes("Balance due ₹75,634.60"), t2);

  // Currency & custom tax
  await page.locator("#inv-currency").selectOption("GBP");
  await page.getByRole("radio", { name: "Custom tax" }).click();
  await page.locator("#inv-taxlabel").fill("VAT");
  await page.locator("#inv-taxrate").fill("20");
  await settle(page);
  check("invoice: currency formatting only (no FX) + VAT", (await page.getByTestId("invoice-totals").innerText()).includes("VAT @ 20%") && (await page.getByTestId("invoice-totals").innerText()).includes("£1,06,470.00") === false && (await page.getByTestId("invoice-totals").innerText()).includes("£106,470.00"));

  // Validation
  await page.getByLabel("Item 1 quantity").fill("-1");
  await settle(page);
  check("invoice: negative quantity rejected + PDF disabled", (await page.getByText("Item 1 quantity must be a number of 0 or more.").isVisible()) && (await btn(page, "Download PDF").isDisabled()));
  await page.getByLabel("Item 1 quantity").fill("1");

  // Reorder + remove
  await btn(page, "Move Hosting setup & 3 months support up").click();
  check("invoice: reorder items", (await page.getByLabel("Item 2 description").inputValue()).startsWith("Hosting"));
  await btn(page, "Remove item 3").click();
  check("invoice: remove item", (await page.getByRole("button", { name: /^Remove item/ }).count()) === 2);

  // Logo + many items → multi-page PDF
  await page.locator('input[aria-label="Upload logo"]').setInputFiles(FX + "quadrants.png");
  await page.getByAltText("Business logo").waitFor();
  for (let i = 0; i < 45; i++) await btn(page, "Add item").click();
  const n = await page.getByRole("button", { name: /^Remove item/ }).count();
  for (let i = 3; i <= n; i++) {
    await page.getByLabel(`Item ${i} description`).fill(`Consulting session ${i} — a deliberately long description to check that wrapping works properly inside the PDF table column`);
    await page.getByLabel(`Item ${i} unit price`).fill("100");
  }
  await settle(page, 300);
  pdf = await download(page, () => btn(page, "Download PDF").click());
  p = await pdfText(pdf.buf);
  const all = p.pages.join(" ");
  check("invoice: multi-page PDF, page numbers, all items", p.pages.length >= 3 && all.includes(`Page 2 of ${p.pages.length}`) && all.includes(`Consulting session ${n}`) && all.includes("VAT @ 20%"), `${p.pages.length} pages`);
  check("invoice: logo embedded", pdf.buf.includes(Buffer.from("/Subtype /Image")));

  // Unsupported script → honest message
  await page.locator("#to-name").fill("अनीता शर्मा");
  await settle(page);
  await download(page, () => btn(page, "Download PDF").click());
  check("invoice: unsupported script explained", await page.getByText(/Use Print → Save as PDF for complex scripts/).isVisible());

  // Print clones only the invoice
  await page.evaluate(() => {
    const w = window as unknown as { __printed: string };
    w.__printed = "";
    window.print = () => {
      w.__printed = `${document.body.dataset.print}|${document.querySelector("#print-root .invoice-sheet") ? "sheet" : "none"}`;
    };
  });
  await btn(page, "Print").click();
  check("invoice: print renders the invoice sheet only", (await page.evaluate(() => (window as unknown as { __printed: string }).__printed)) === "clone|sheet");

  // Draft persistence (opt-in)
  await page.getByRole("switch", { name: /Keep draft/ }).check({ force: true });
  await page.locator("#inv-number").fill("DRAFT-42");
  await settle(page, 300);
  await page.reload();
  await page.waitForLoadState("networkidle");
  check("invoice: opt-in draft restored", (await page.locator("#inv-number").inputValue()) === "DRAFT-42");
  await page.getByRole("switch", { name: /Keep draft/ }).uncheck({ force: true });
  await settle(page, 200);
  check("invoice: draft deleted when turned off", (await page.evaluate(() => localStorage.getItem("zs-invoice-draft"))) === null);
  await btn(page, "Reset").click();
  check("invoice: reset", (await page.getByTestId("invoice-due").innerText()) === "₹0.00");
  await page.close();
}

/* ---------------- 25 Cropper ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-cropper/");
  await page.locator('input[type="file"]').first().setInputFiles(FX + "quadrants.png");
  await page.getByTestId("crop-box").waitFor();
  const setRect = async (x: number, y: number, w: number, h: number) => {
    for (const [k, v] of [["w", w], ["h", h], ["x", x], ["y", y]] as const) await page.locator(`#crop-${k}`).fill(String(v));
    await settle(page, 100);
  };
  const exportPng = async () => {
    await btn(page, "Crop image").click();
    await page.getByTestId("crop-result").waitFor();
    return (await download(page, () => page.getByRole("button", { name: /^Download (PNG|JPG|WEBP)$/ }).click())).buf;
  };
  const pixel = (png: PNG, x: number, y: number) => Array.from(png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4));

  await page.getByRole("radio", { name: "PNG", exact: true }).click();
  await setRect(0, 0, 150, 120);
  let out = PNG.sync.read(await exportPng());
  check("crop: exact region + dimensions (top-left = red)", out.width === 150 && out.height === 120 && JSON.stringify(pixel(out, 75, 60)) === "[255,0,0,255]");
  await setRect(250, 160, 150, 140);
  out = PNG.sync.read(await exportPng());
  check("crop: bottom-right = white", JSON.stringify(pixel(out, 10, 10)) === "[255,255,255,255]");
  await setRect(0, 130, 100, 40);
  out = PNG.sync.read(await exportPng());
  check("crop: PNG keeps transparency", pixel(out, 50, 20)[3] === 0 && pixel(out, 50, 2)[3] === 255);

  await page.getByRole("radio", { name: "JPG", exact: true }).click();
  const jpg = await exportPng();
  const jd = await page.evaluate(async (b64) => {
    const bmp = await createImageBitmap(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "image/jpeg" }));
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const x = c.getContext("2d")!;
    x.drawImage(bmp, 0, 0);
    return Array.from(x.getImageData(50, 20, 1, 1).data);
  }, jpg.toString("base64"));
  check("crop: JPG fills transparency with background", jd[0] > 245 && jd[1] > 245 && jd[2] > 245, JSON.stringify(jd));

  await page.getByRole("radio", { name: "PNG", exact: true }).click();
  await btn(page, "Rotate right").click();
  check("crop: rotate swaps dimensions", (await page.getByText("image 300 × 400 px").isVisible()));
  await setRect(0, 0, 100, 100);
  out = PNG.sync.read(await exportPng());
  check("crop: rotated 90° → top-left is original bottom-left (blue)", JSON.stringify(pixel(out, 50, 50)) === "[0,0,255,255]", JSON.stringify(pixel(out, 50, 50)));
  await btn(page, "Rotate left").click();
  await btn(page, "Flip horizontally").click();
  await setRect(0, 0, 100, 100);
  out = PNG.sync.read(await exportPng());
  check("crop: flip horizontal → top-left is green", JSON.stringify(pixel(out, 50, 50)) === "[0,255,0,255]");
  await btn(page, "Flip horizontally").click();
  await btn(page, "Flip vertically").click();
  await setRect(0, 0, 100, 100);
  out = PNG.sync.read(await exportPng());
  check("crop: flip vertical → top-left is blue", JSON.stringify(pixel(out, 50, 50)) === "[0,0,255,255]");
  await btn(page, "Flip vertically").click();

  const ratios: Record<string, number> = { "1:1": 1, "4:5": 0.8, "3:2": 1.5, "4:3": 4 / 3, "16:9": 16 / 9, "9:16": 9 / 16 };
  let ratioOk = true;
  for (const [label, r] of Object.entries(ratios)) {
    await page.getByRole("radio", { name: label, exact: true }).click();
    await settle(page, 80);
    const w = Number(await page.locator("#crop-w").inputValue());
    const h = Number(await page.locator("#crop-h").inputValue());
    if (Math.abs(w / h - r) > 0.02) ratioOk = false;
  }
  check("crop: every aspect ratio", ratioOk);

  await page.getByRole("button", { name: /YouTube thumbnail/ }).click();
  out = PNG.sync.read(await exportPng());
  check("crop: YouTube preset → 1280 × 720", out.width === 1280 && out.height === 720);
  await page.locator("#crop-outw").fill("500");
  await settle(page);
  out = PNG.sync.read(await exportPng());
  check("crop: custom output width keeps shape", out.width === 500 && out.height === 281);

  await page.getByRole("radio", { name: "Free", exact: true }).click();
  await setRect(50, 50, 100, 80);
  const box = page.getByTestId("crop-box");
  await box.focus();
  await page.keyboard.press("Shift+ArrowRight");
  await page.keyboard.press("ArrowDown");
  check("crop: keyboard nudge", (await page.locator("#crop-x").inputValue()) === "60" && (await page.locator("#crop-y").inputValue()) === "51");
  const bb = (await box.boundingBox())!;
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2 + 60, bb.y + bb.height / 2 + 30, { steps: 5 });
  await page.mouse.up();
  check("crop: drag moves crop box", Number(await page.locator("#crop-x").inputValue()) > 60);

  await page.getByRole("radio", { name: "WebP", exact: true }).click();
  const webp = await exportPng();
  check("crop: WebP export", webp.subarray(8, 12).toString() === "WEBP");
  check("crop: shows original vs exported sizes", (await page.getByText("Exported file").isVisible()) && (await page.getByText("400 × 300").first().isVisible()));

  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 300);
  const mb = (await box.boundingBox())!;
  check("crop: usable on mobile (preview ≥ 300px wide)", (await page.locator(".checker").first().boundingBox())!.width >= 330 && mb.width > 40);
  await page.close();
}

/* ---------------- Search / SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["hex to rgb", "Color Picker"], ["contrast checker", "Color Picker"], ["guid", "UUID"], ["markdown preview", "Markdown"], ["invoice", "Invoice Generator"], ["crop image", "Image Cropper"]]) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const slugs = ["color-picker", "uuid-generator", "markdown-editor", "invoice-generator", "image-cropper"];
  for (const slug of slugs) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
    const types: string[] = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      const j = JSON.parse(m[1]);
      types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
    }
    const ok =
      (h.match(/<h1/g) ?? []).length === 1 &&
      h.includes(`rel="canonical" href="https://tools.zspace.in/${slug}/"`) &&
      h.includes('property="og:title"') &&
      h.includes('name="twitter:card"') &&
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((t) => types.includes(t)) &&
      h.includes("Worked examples") &&
      !/aggregateRating|"review"/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt include all 5", slugs.every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await page.close();
}

const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
