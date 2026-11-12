// Full-page screenshots at the five QA breakpoints + horizontal overflow detection.
// Usage: node tests/screens.mjs <outDir> [baseUrl]
import { chromium } from "playwright";
const out = process.argv[2];
const BASE = process.argv[3] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const widths = [1440, 1280, 768, 390, 360];
const pages = process.env.PAGES ? process.env.PAGES.split(",") : ["/", "/url-slug-generator/", "/emi-calculator/", "/days-between-dates/", "/color-picker/", "/uuid-generator/", "/markdown-editor/", "/invoice-generator/", "/image-cropper/", "/url-encoder-decoder/", "/base64-encoder-decoder/", "/csv-to-json/", "/days-between-dates/", "/emi-calculator/", "/json-formatter/", "/age-calculator/", "/gst-calculator/", "/unit-converter/", "/case-converter/", "/image-resizer/", "/pdf-merger/", "/pdf-splitter/", "/image-to-pdf/", "/percentage-calculator/", "/image-compressor/", "/pdf-compressor/", "/qr-code-generator/", "/word-counter/", "/password-generator/", "/all-tools/", "/blog/", "/blog/create-qr-code-for-website/", "/about/", "/privacy-policy/", "/nope/"];
const b = await chromium.launch();
const overflow = [];
for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  for (const p of pages) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    if (p === "/image-compressor/") {
      await page.locator('input[type="file"]').first().setInputFiles(["photo-rotated.jpg", "transparent.png", "photo.webp"].map((f) => FX + f));
      await page.getByText(/3 images ready/).waitFor({ timeout: 60000 });
    }
    if (p === "/image-resizer/") {
      await page.locator('input[type="file"]').first().setInputFiles(["photo-rotated.jpg", "transparent.png"].map((f) => FX + f));
      await page.getByText(/2 of 2 images resized/).waitFor({ timeout: 60000 });
    }
    if (p === "/pdf-merger/") {
      await page.locator('input[type="file"]').first().setInputFiles(["pages-20.pdf", "text-only.pdf", "image-heavy.pdf"].map((f) => FX + f));
      await page.getByText(/3 pages ·/).waitFor({ timeout: 60000 });
      await page.waitForTimeout(1500);
    }
    if (p === "/pdf-splitter/") {
      await page.locator('input[type="file"]').first().setInputFiles(FX + "pages-20.pdf");
      await page.getByLabel("Pages to extract").fill("1, 3, 5-8");
      await page.waitForTimeout(1500);
    }
    if (p === "/image-to-pdf/") {
      await page.locator('input[type="file"]').first().setInputFiles(["photo-rotated.jpg", "transparent.png", "photo.webp"].map((f) => FX + f));
      await page.getByText("3 pages", { exact: true }).waitFor({ timeout: 60000 });
    }
    if (p === "/percentage-calculator/") {
      const inputs = page.getByRole("tabpanel").locator("input");
      await inputs.nth(0).fill("20");
      await inputs.nth(1).fill("500");
    }
    if (p === "/json-formatter/") {
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await page.waitForTimeout(300);
    }
    if (p === "/age-calculator/") {
      await page.locator("#age-start").fill("1990-05-15");
      await page.getByRole("button", { name: "Calculate", exact: true }).click();
    }
    if (p === "/gst-calculator/") await page.locator("#gst-amount").fill("25000");
    if (p === "/case-converter/") {
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await page.waitForTimeout(300);
    }
    if (p === "/url-encoder-decoder/" || p === "/base64-encoder-decoder/") {
      await page.getByRole("button", { name: p.startsWith("/url") ? "Example" : "Sample", exact: true }).click();
      await page.waitForTimeout(300);
    }
    if (p === "/csv-to-json/") {
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await page.waitForTimeout(300);
    }
    if (p === "/url-slug-generator/") {
      await page.getByRole("radio", { name: /Bulk/ }).click();
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await page.locator("#slug-base").fill("https://example.com/blog/");
      await page.waitForTimeout(300);
    }
    if (p === "/markdown-editor/") {
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await page.waitForTimeout(400);
    }
    if (p === "/invoice-generator/") {
      await page.getByRole("button", { name: "Load sample", exact: true }).click();
      await page.waitForTimeout(400);
    }
    if (p === "/image-cropper/") {
      await page.locator('input[type="file"]').first().setInputFiles(FX + "photo-rotated.jpg");
      await page.getByTestId("crop-box").waitFor();
    }
    if (p === "/qr-code-generator/") await page.getByLabel("Website URL").fill("https://zspace.in");
    if (p === "/word-counter/") await page.getByLabel("Your text").fill("Less effort. More done. ".repeat(30));
    // Scroll through so in-view animations run before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) {
      const culprits = await page.evaluate((vw) => [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > vw + 1).slice(0, 4).map((e) => `${e.tagName}.${String(e.className).slice(0, 60)}`), w);
      overflow.push(`${w} ${p} scrollWidth=${sw} ${culprits.join(" ; ")}`);
    }
    const name = `${w}${p.replace(/\//g, "_") || "_"}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}
await b.close();
console.log("Overflow:", overflow.length ? "\n" + overflow.join("\n") : "none");
