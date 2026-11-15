// End-to-end tests for the PDF/spreadsheet batch: Rotate PDF (new tool),
// "All but 1st" scope on Watermark / Page Numbers, Excel custom scale,
// spec redirects and SEO for /pdf-to-excel/, /excel-to-pdf/, /rotate-pdf/,
// /add-page-numbers/ and /watermark-pdf/.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-13.mts
import { chromium, type Page } from "playwright";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees } from "pdf-lib";

const BASE = process.argv[2] ?? "http://localhost:3100";
const ORIGIN = new URL(BASE).origin;
const FX = new URL("./fixtures/", import.meta.url).pathname;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 1000 } });
const errors: string[] = [];
const external: string[] = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
  p.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(ORIGIN) && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u);
  });
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), trigger()]);
  return { name: dl.suggestedFilename(), buf: readFileSync((await dl.path())!) };
}
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const radio = (page: Page, name: string) => page.getByRole("radio", { name, exact: true });
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
async function pageTexts(buf: Buffer) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) out.push(((await (await doc.getPage(i)).getTextContent()).items as { str: string }[]).map((x) => x.str).join(" "));
  return out;
}

// Mixed fixture: portrait, landscape, portrait with /Rotate 90 (shows landscape), Letter portrait, landscape.
const tmp = mkdtempSync(join(tmpdir(), "zs-e2e13-"));
const mixedPath = join(tmp, "mixed.pdf");
{
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  ([[595, 842], [842, 595], [595, 842], [612, 792], [842, 595]] as [number, number][]).forEach((s, i) => d.addPage(s).drawText(`PAGE ${i + 1}`, { x: 60, y: 60, size: 24, font: f }));
  d.getPage(2).setRotation(degrees(90));
  d.setTitle("Mixed test");
  writeFileSync(mixedPath, await d.save());
}

/* ---------------- 38 Rotate PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/rotate-pdf/");
  check("rotate: H1", (await page.locator("h1").innerText()) === "Rotate PDF Pages Online");
  await page.locator('input[type="file"]').first().setInputFiles(mixedPath);
  const pages = page.getByTestId("rot-page");
  await pages.first().waitFor({ timeout: 20000 });
  check("rotate: thumbnail grid for every page", (await pages.count()) === 5);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="rot-page"] img').length >= 5, null, { timeout: 20000 });
  check("rotate: thumbnails rendered", true);
  check("rotate: download disabled before changes", await btn(page, "Download PDF").isDisabled());

  const attr = async (k: string) => (await pages.evaluateAll((els, key) => els.map((e) => e.getAttribute(key)), `data-${k}`)).join(",");
  await page.getByRole("button", { name: "Rotate page 1 clockwise" }).click();
  check("rotate: single page clockwise", (await attr("added")) === "90,0,0,0,0");
  await page.getByRole("button", { name: "Rotate page 1 anticlockwise" }).click();
  await page.getByRole("button", { name: "Rotate page 1 anticlockwise" }).click();
  check("rotate: anticlockwise wraps to 270", (await attr("added")) === "270,0,0,0,0");
  check("rotate: existing /Rotate combined in final angle", (await attr("final")) === "270,0,90,0,0");
  await btn(page, "Reset rotations").click();
  check("rotate: reset", (await attr("added")) === "0,0,0,0,0" && (await page.getByTestId("rot-status").innerText()) === "No changes yet");

  await radio(page, "Odd").click();
  check("rotate: odd target count", (await page.getByTestId("rot-target-count").innerText()) === "3 of 5 pages");
  await btn(page, "Right 90°").click();
  check("rotate: odd pages rotated", (await attr("added")) === "90,0,90,0,90");
  await radio(page, "Even").click();
  await btn(page, "180°").click();
  check("rotate: even pages 180°", (await attr("added")) === "90,180,90,180,90");
  await btn(page, "Reset rotations").click();

  await radio(page, "Landscape").click();
  check("rotate: landscape detection uses existing rotation", (await page.getByTestId("rot-target-count").innerText()) === "3 of 5 pages");
  await btn(page, "Left 90°").click();
  check("rotate: landscape pages turned upright", (await attr("added")) === "0,270,270,0,270");
  await btn(page, "Reset rotations").click();

  await page.getByRole("button", { name: /^Page 2\b/ }).click();
  await page.getByRole("button", { name: /^Page 4\b/ }).click();
  check("rotate: clicking pages selects them", (await radio(page, "Selected").getAttribute("aria-checked")) === "true" && (await page.getByTestId("rot-target-count").innerText()) === "2 of 5 pages");
  await btn(page, "Right 90°").click();
  check("rotate: selected pages rotated", (await attr("added")) === "0,90,0,90,0");
  await btn(page, "Clear selection").click();
  check("rotate: clear selection", (await radio(page, "All").getAttribute("aria-checked")) === "true");
  await btn(page, "Select all").click();
  check("rotate: select all", (await page.getByTestId("rot-target-count").innerText()) === "5 of 5 pages");

  const dl = await download(page, () => btn(page, "Download PDF").click());
  const doc = await PDFDocument.load(dl.buf, { updateMetadata: false });
  check("rotate: file name", dl.name === "mixed-rotated.pdf", dl.name);
  check("rotate: downloaded angles", doc.getPages().map((p) => p.getRotation().angle).join(",") === "0,90,90,90,0", doc.getPages().map((p) => p.getRotation().angle).join(","));
  check("rotate: order, sizes, metadata kept", doc.getTitle() === "Mixed test" && doc.getPages().map((p) => p.getWidth()).join(",") === "595,842,595,612,842");
  const t = await pageTexts(dl.buf);
  check("rotate: content preserved", t.every((s, i) => s.includes(`PAGE ${i + 1}`)));
  check("rotate: success message", await page.getByText(/Saved mixed-rotated\.pdf — 2 of 5 pages rotated/).isVisible());

  await btn(page, "Open another PDF").click();
  await page.locator('input[type="file"]').first().setInputFiles(FX + "encrypted.pdf");
  check("rotate: password-protected PDF explained", await page.getByRole("alert").filter({ hasText: /password|encrypted/i }).waitFor({ timeout: 10000 }).then(() => true, () => false));
  await page.locator('input[type="file"]').first().setInputFiles(FX + "corrupt.pdf");
  check("rotate: corrupt PDF explained", await page.getByRole("alert").filter({ hasText: /damaged|couldn.t be opened/i }).waitFor({ timeout: 10000 }).then(() => true, () => false));
  await page.locator('input[type="file"]').first().setInputFiles(FX + "fake.pdf");
  check("rotate: non-PDF rejected", await page.getByRole("alert").filter({ hasText: /fake\.pdf/ }).waitFor({ timeout: 10000 }).then(() => true, () => false));
  await page.close();
}

/* ---------------- Watermark: All but 1st ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/watermark-pdf/");
  check("wm: renamed H1", (await page.locator("h1").innerText()) === "Add Watermark to PDF");
  await page.locator('input[type="file"]').first().setInputFiles(FX + "multi-page.pdf");
  await page.getByTestId("stamp-stage").waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "DRAFT", exact: true }).click();
  await radio(page, "All but 1st").click();
  const d = await download(page, () => btn(page, "Add watermark & download").click());
  const t = await pageTexts(d.buf);
  check("wm: all but first page watermarked", JSON.stringify(t.map((s) => s.includes("DRAFT"))) === "[false,true,true,true]", JSON.stringify(t.map((s) => s.includes("DRAFT"))));
  await page.close();
}

/* ---------------- Page numbers: All but 1st ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/add-page-numbers/");
  await page.locator('input[type="file"]').first().setInputFiles(FX + "pages-20.pdf");
  await page.getByTestId("stamp-stage").waitFor({ timeout: 20000 });
  await page.locator("#pn-style").selectOption("page-of");
  await radio(page, "All but 1st").click();
  const d = await download(page, () => btn(page, "Add page numbers & download").click());
  const t = await pageTexts(d.buf);
  const nums = t.map((s) => s.match(/Page \d+ of \d+/)?.[0] ?? "");
  check("pn: cover skipped, numbering starts on page 2", nums[0] === "" && nums[1] === "Page 1 of 19" && nums[19] === "Page 19 of 19", `${nums[0]} | ${nums[1]} | ${nums[19]}`);
  await page.close();
}

/* ---------------- Excel to PDF: custom scale ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/excel-to-pdf/");
  await page.locator('input[type="file"]').first().setInputFiles(FX + "workbook.xlsx");
  await page.getByTestId("x2p-status").getByText(/pages? ·/).waitFor({ timeout: 30000 });
  await radio(page, "Custom %").click();
  await page.locator("#x2p-scale").fill("40");
  await page.waitForTimeout(800);
  await page.getByTestId("x2p-status").getByText(/pages? ·/).waitFor({ timeout: 30000 });
  const small = await download(page, () => btn(page, "Download PDF").click());
  await page.locator("#x2p-scale").fill("150");
  await page.waitForTimeout(800);
  await page.getByTestId("x2p-status").getByText(/pages? ·/).waitFor({ timeout: 30000 });
  const big = await download(page, () => btn(page, "Download PDF").click());
  const [ps, pb] = [await pageTexts(small.buf), await pageTexts(big.buf)];
  check("x2p: custom scale changes pagination", pb.length > ps.length, `${ps.length} vs ${pb.length} pages`);
  check("x2p: no columns lost at 150%", pb.join(" ").includes("Column 1 ") && pb.join(" ").includes("Column 30"));
  await page.close();
}

/* ---------------- Redirects, SEO, discovery, mobile ---------------- */
{
  const page = await ctx.newPage();
  for (const [from, to] of [["/add-page-numbers-to-pdf/", "/add-page-numbers/"], ["/add-watermark-to-pdf/", "/watermark-pdf/"]]) {
    const r = await page.goto(`${BASE}${from}`);
    check(`redirect: ${from} → ${to}`, r?.url() === `${BASE}${to}` && r.status() === 200, r?.url());
  }
  const expect: Record<string, [string, string]> = {
    "pdf-to-excel": ["PDF to Excel Converter – Convert PDF to XLSX Online Free", "PDF to Excel Converter"],
    "excel-to-pdf": ["Excel to PDF Converter – Convert XLSX to PDF Online Free", "Excel to PDF Converter"],
    "rotate-pdf": ["Rotate PDF Pages Online – Rotate PDF Free", "Rotate PDF Pages Online"],
    "add-page-numbers": ["Add Page Numbers to PDF Online – Free PDF Page Number Tool", "Add Page Numbers to PDF"],
    "watermark-pdf": ["Add Watermark to PDF Online – Free Text &amp; Image Watermark", "Add Watermark to PDF"],
  };
  const descs = new Set<string>();
  for (const [slug, [title, h1]] of Object.entries(expect)) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
    const types: string[] = [];
    let ldOk = true;
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      try {
        const j = JSON.parse(m[1]);
        types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
      } catch {
        ldOk = false;
      }
    }
    descs.add(h.match(/<meta name="description" content="(.*?)"/)?.[1] ?? "");
    const ok =
      h.includes(`<title>${title}</title>`) &&
      (h.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] ?? "").includes(h1) &&
      new URL(/<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] ?? "x:").pathname === `/${slug}/` &&
      h.includes('property="og:title"') &&
      h.includes('name="twitter:card"') &&
      ldOk &&
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((x) => types.includes(x)) &&
      !/aggregateRating|ratingValue/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: unique descriptions", descs.size === 5);
  check("seo: Excel to PDF doesn't claim .xls support in meta", !/XLS and XLSX|XLS, XLSX/.test(await (await fetch(`${BASE}/excel-to-pdf/`)).text().then((h) => h.match(/<meta name="description" content="(.*?)"/)?.[1] ?? "")));
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  check("sitemap: canonical URLs only", Object.keys(expect).every((s) => locs.some((l) => l.endsWith(`/${s}/`))) && !locs.some((l) => /-to-pdf\/$/.test(l) && /add-(page-numbers|watermark)-to-pdf/.test(l)));
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("llms.txt: rotate-pdf listed, existing entries kept", llms.includes("/rotate-pdf/)") && llms.includes("/pdf-to-excel/)") && llms.includes("/watermark-pdf/)") && llms.includes("/image-compressor/)"));
  await open(page, "/all-tools/");
  check("directory: rotate-pdf linked", (await page.content()).includes('href="/rotate-pdf/"'));
  check("organizer links to rotate", (await (await fetch(`${BASE}/pdf-organizer/`)).text()).includes('href="/rotate-pdf/"'));

  await page.setViewportSize({ width: 360, height: 780 });
  for (const s of Object.keys(expect)) {
    await open(page, `/${s}/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile 360px: /${s}/ no horizontal overflow`, overflow <= 0, String(overflow));
  }
  await open(page, "/rotate-pdf/");
  await page.locator('input[type="file"]').first().setInputFiles(mixedPath);
  await page.getByTestId("rot-page").first().waitFor({ timeout: 20000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const touch = await page.getByRole("button", { name: "Rotate page 1 clockwise" }).boundingBox();
  check("mobile: rotate grid fits, touch targets ≥ 36px", overflow <= 0 && (touch?.width ?? 0) >= 36 && (touch?.height ?? 0) >= 36, `${overflow} ${touch?.width}x${touch?.height}`);
  await page.close();
}

rmSync(tmp, { recursive: true, force: true });
check("privacy: no requests to other origins", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
