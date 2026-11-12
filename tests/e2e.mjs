// End-to-end functional tests against a running server (default http://localhost:3100).
// Verifies real outputs: decoded QR codes, re-parsed PDFs, image dimensions/alpha, ZIP contents.
// Usage: npm run build && npm start -- -p 3100 & node tests/e2e.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import jsQR from "jsqr";
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
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
const errors = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
});

async function open(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}

async function downloadBytes(page, trigger) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const path = await dl.path();
  return { name: dl.suggestedFilename(), bytes: readFileSync(path) };
}

function decodePng(buf) {
  const png = PNG.sync.read(buf);
  return { png, qr: jsQR(new Uint8ClampedArray(png.data), png.width, png.height) };
}

/* ---------------- Image Compressor ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/image-compressor/");
  await page.locator('input[type="file"]').first().setInputFiles(
    ["photo-rotated.jpg", "transparent.png", "photo.webp", "tiny.jpg", "not-an-image.png"].map((f) => FX + f),
  );
  await page.getByText(/4 images ready/).waitFor({ timeout: 60000 });
  check("image: unreadable file shows error", await page.getByText(/couldn.t be read/).first().isVisible());
  const rows = await page.locator("li").filter({ has: page.locator('button[aria-label^="Preview"]') }).allInnerTexts();
  console.log("      rows:", rows.map((r) => r.replace(/\s+/g, " ")).join(" | "));

  const dl = async (name) => downloadBytes(page, () => page.getByRole("button", { name: `Download ${name}` }).click());
  const jpg = await dl("photo-rotated.jpg");
  const jpgDims = await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bin], { type: "image/jpeg" }));
    return [bmp.width, bmp.height];
  }, jpg.bytes.toString("base64"));
  check("image: JPG smaller than original", jpg.bytes.length < 4102115, `${jpg.bytes.length} bytes`);
  check("image: EXIF orientation applied (portrait 3000×4000)", jpgDims[0] === 3000 && jpgDims[1] === 4000, jpgDims.join("×"));
  check("image: EXIF stripped", !jpg.bytes.includes(Buffer.from("Exif")));

  const png = await dl("transparent.png");
  const p = PNG.sync.read(png.bytes);
  let transparent = 0;
  for (let i = 3; i < p.data.length; i += 4) if (p.data[i] < 255) transparent++;
  check("image: PNG smaller than original", png.bytes.length < 80036, `${png.bytes.length} bytes`);
  check("image: PNG transparency preserved", transparent > p.width * p.height * 0.3, `${Math.round((transparent / (p.width * p.height)) * 100)}% non-opaque px`);

  check("image: already-optimised file kept", await page.getByText("optimal").first().isVisible().catch(() => false));

  const zip = await downloadBytes(page, () => page.getByRole("button", { name: /Download all/ }).click());
  const entries = Object.keys(unzipSync(new Uint8Array(zip.bytes)));
  check("image: ZIP contains all 4 results", entries.length === 4, entries.join(", "));

  await page.getByRole("radio", { name: "WebP" }).click();
  await page.getByText(/Compressing/).waitFor({ state: "detached", timeout: 60000 }).catch(() => {});
  await page.getByText(/4 images ready/).waitFor({ timeout: 60000 });
  const webp = await dl("photo-rotated.jpg");
  check("image: WebP conversion", webp.name.endsWith(".webp") && webp.bytes.subarray(8, 12).toString() === "WEBP", webp.name);

  await page.getByRole("button", { name: "Remove tiny.jpg" }).click();
  await page.waitForTimeout(500);
  check("image: remove individual", (await page.getByRole("button", { name: /^Preview/ }).count()) === 4);
  await page.getByRole("button", { name: "Clear all" }).click();
  check("image: clear all", await page.getByText("Drop images here").isVisible());
  await page.close();
}

/* ---------------- PDF Compressor ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-compressor/");
  const input = () => page.locator('input[type="file"]').first();

  await input().setInputFiles(FX + "image-heavy.pdf");
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await page.getByText("Compressed successfully").waitFor({ timeout: 90000 });
  const out = await downloadBytes(page, () => page.getByRole("button", { name: "Download compressed PDF" }).click());
  const doc = await PDFDocument.load(out.bytes);
  check("pdf: output smaller", out.bytes.length < 4103822, `${(4103822 / 1048576).toFixed(2)} MB → ${(out.bytes.length / 1048576).toFixed(2)} MB`);
  check("pdf: output valid, 3 pages", doc.getPageCount() === 3);
  const hasFont = doc.getPages()[0].node.Resources()?.toString().includes("Font");
  check("pdf: text/fonts preserved", Boolean(hasFont));

  await page.getByRole("button", { name: "Reset" }).click();
  await input().setInputFiles(FX + "text-only.pdf");
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await page.getByText(/couldn.t be made meaningfully smaller/).waitFor({ timeout: 30000 });
  check("pdf: honest no-gain message for text-only PDF", true);

  await page.getByRole("button", { name: "Reset" }).click();
  await input().setInputFiles(FX + "encrypted.pdf");
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await page.getByText(/password-protected or encrypted/).waitFor({ timeout: 30000 });
  check("pdf: encrypted PDF detected", true);

  await page.getByRole("button", { name: "Reset" }).click();
  await input().setInputFiles(FX + "fake.pdf");
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await page.getByText(/isn't a PDF/).waitFor({ timeout: 30000 });
  check("pdf: invalid file rejected", true);
  await page.close();
}

/* ---------------- QR Code Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/qr-code-generator/");
  await page.getByLabel("Website URL").fill("zspace.in/tools");
  const png = await downloadBytes(page, () => page.getByRole("button", { name: "PNG", exact: true }).click());
  const { png: img, qr } = decodePng(png.bytes);
  check("qr: URL PNG decodes", qr?.data === "https://zspace.in/tools", `${qr?.data} @ ${img.width}px`);
  const svg = await downloadBytes(page, () => page.getByRole("button", { name: "SVG", exact: true }).click());
  check("qr: SVG valid", svg.bytes.toString().startsWith("<svg") && svg.bytes.toString().includes("<path"));

  await page.getByRole("tab", { name: "Wi-Fi" }).click();
  await page.getByLabel("Network name (SSID)").fill("Cafe;Guest");
  await page.getByLabel("Password", { exact: true }).fill('p"ss:1');
  await page.locator('input[aria-label="Upload logo"]').setInputFiles(FX + "transparent.png");
  await page.getByText("locked to H with logo").waitFor();
  await page.getByLabel("Foreground", { exact: true }).fill("#1d3b6e");
  const wifi = await downloadBytes(page, () => page.getByRole("button", { name: "PNG", exact: true }).click());
  const w = decodePng(wifi.bytes).qr;
  check("qr: Wi-Fi + logo + colour decodes", w?.data === 'WIFI:T:WPA;S:Cafe\\;Guest;P:p\\"ss\\:1;;', w?.data);

  await page.getByLabel("Foreground", { exact: true }).fill("#eeeeee");
  check("qr: low-contrast warning", await page.getByText(/Contrast is low/).isVisible());

  for (const [tab, label, value, expected] of [
    ["Email", "Email address", "hi@example.com", "mailto:hi@example.com"],
    ["Phone", "Phone number", "+44 20 7946 0000", "tel:+442079460000"],
    ["Text", "Text", "Hello there", "Hello there"],
  ]) {
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("tab", { name: tab }).click();
    await page.getByLabel(label, { exact: true }).fill(value);
    const b = await downloadBytes(page, () => page.getByRole("button", { name: "PNG", exact: true }).click());
    const r = decodePng(b.bytes).qr;
    check(`qr: ${tab} decodes`, r?.data === expected, r?.data);
  }
  await page.close();
}

/* ---------------- Word Counter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/word-counter/");
  const text = "The quick brown fox jumps over the lazy dog. It's a well-known pangram!\n\nSecond paragraph here? Yes.";
  await page.getByLabel("Your text").fill(text);
  const stat = async (label) => (await page.locator("dt", { hasText: new RegExp(`^${label}$`) }).locator("xpath=following-sibling::dd").innerText()).trim();
  await page.waitForTimeout(200);
  const words = await stat("Words");
  const chars = await stat("Characters");
  const sentences = await stat("Sentences");
  const paras = await stat("Paragraphs");
  check("words: counts", words === "17" && chars === String([...text].length) && sentences === "4" && paras === "2", `${words}w ${chars}c ${sentences}s ${paras}p`);
  check("words: reading time shown", /sec|min/.test(await stat("Reading time")));
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.waitForTimeout(300);
  check("words: clear", (await stat("Words")) === "0");
  await page.close();
}

/* ---------------- Password Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/password-generator/");
  const pw = page.locator("[data-private]").first();
  await page.waitForFunction(() => document.querySelector("[data-private]")?.textContent?.length === 20);
  const first = (await pw.innerText()).trim();
  check("password: default length 20 with all sets", first.length === 20 && /[A-Z]/.test(first) && /[a-z]/.test(first) && /\d/.test(first) && /[^A-Za-z0-9]/.test(first));
  await page.getByRole("button", { name: "Regenerate" }).click();
  await page.waitForTimeout(300);
  check("password: regenerate changes value", (await page.locator("[data-private]").first().innerText()).trim() !== first);
  await page.getByRole("button", { name: "32", exact: true }).click();
  await page.getByRole("switch", { name: /Symbols/ }).uncheck({ force: true });
  await page.getByRole("switch", { name: /Exclude ambiguous/ }).check({ force: true });
  await page.getByRole("radio", { name: "10" }).click();
  await page.waitForTimeout(300);
  const list = (await page.locator("[data-private]").allInnerTexts()).map((s) => s.trim());
  check(
    "password: 10 × 32 chars, no symbols, no ambiguous",
    list.length === 10 && list.every((s) => s.length === 32 && /^[A-Za-z0-9]+$/.test(s) && !/[Il1O0o]/.test(s)),
    list[0],
  );
  check("password: all unique", new Set(list).size === 10);
  const serverHtml = await (await fetch(`${BASE}/password-generator/`)).text();
  check("password: never in server-rendered HTML", !list.some((p) => serverHtml.includes(p)));
  await page.close();
}

/* ---------------- Search ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  await page.getByPlaceholder("What would you like to do today?").fill("make pdf smaller");
  const first = page.getByRole("option").first();
  await first.waitFor();
  check("search: 'make pdf smaller' → PDF Compressor", (await first.innerText()).includes("PDF Compressor"));
  await page.keyboard.press("Enter");
  await page.waitForURL(/pdf-compressor/);
  check("search: enter navigates", page.url().endsWith("/pdf-compressor/"));
  await page.keyboard.press("Meta+k");
  await page.getByRole("dialog").getByRole("combobox").fill("wifi");
  check("search: ⌘K palette finds QR", (await page.getByRole("dialog").getByRole("option").first().innerText()).includes("QR Code"));
  await page.close();
}

const relevantErrors = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevantErrors.length === 0, relevantErrors.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
