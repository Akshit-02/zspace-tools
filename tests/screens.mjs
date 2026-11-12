// Full-page screenshots at the five QA breakpoints + horizontal overflow detection.
// Usage: node tests/screens.mjs <outDir> [baseUrl]
import { chromium } from "playwright";
const out = process.argv[2];
const BASE = process.argv[3] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const widths = [1440, 1280, 768, 390, 360];
const pages = ["/", "/image-compressor/", "/pdf-compressor/", "/qr-code-generator/", "/word-counter/", "/password-generator/", "/all-tools/", "/blog/", "/blog/create-qr-code-for-website/", "/about/", "/privacy-policy/", "/nope/"];
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
