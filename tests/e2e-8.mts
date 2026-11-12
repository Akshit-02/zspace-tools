// End-to-end tests for the "sixth tool expansion" brief: Meta Tag Generator, XML Sitemap
// Generator, Robots.txt Generator, Open Graph Preview and HTML Entity Encoder & Decoder.
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3100";
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
  p.on("console", (m) => m.type() === "error" && errors.push(`${p.url()} ${m.text()}`));
  p.on("request", (r) => requests.push(r.url()));
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const path = (await dl.path())!;
  return { name: dl.suggestedFilename(), text: readFileSync(path, "utf8"), bytes: readFileSync(path) };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);
const txt = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ");

/* ---------------- Meta Tag Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/meta-tag-generator/");
  const lines = () => page.getByTestId("tag-lines").innerText();
  check("meta: empty state still valid (charset/viewport/robots only)", !(await lines()).includes("<title>") && (await lines()).includes('<meta name="robots" content="index, follow">'));
  await page.locator("#mt-title").fill(`Tom & Jerry's "Best" <Deals>`);
  await page.locator("#mt-description").fill("Line one\nline two — with ₹ and émojis 😀");
  await page.locator("#mt-url").fill("https://shop.example/deals/");
  await page.locator("#mt-site").fill("Shop");
  await page.locator("#mt-lang").selectOption("en-IN");
  await page.locator("#mt-image").fill(`${BASE}/opengraph-image`);
  await page.locator("#mt-xsite").fill("shopexample");
  await settle(page);
  const all = await lines();
  check("meta: title escaped", all.includes("<title>Tom &amp; Jerry's \"Best\" &lt;Deals&gt;</title>") && all.includes('content="Tom &amp; Jerry&#39;s &quot;Best&quot; &lt;Deals&gt;"'), all.slice(0, 200));
  check("meta: description single-line, unicode kept", all.includes('content="Line one line two — with ₹ and émojis 😀"'));
  check("meta: canonical falls back to page URL", all.includes('<link rel="canonical" href="https://shop.example/deals/">'));
  check("meta: OG + locale + X tags", all.includes('property="og:locale" content="en_IN"') && all.includes('property="og:image"') && all.includes('name="twitter:site" content="@shopexample"') && all.includes('name="twitter:card" content="summary_large_image"'));
  check("meta: SERP preview", (await txt(page, "serp-preview")).includes("Tom & Jerry's \"Best\" <Deals>") && (await txt(page, "serp-preview")).includes("shop.example"));
  await page.getByTestId("fb-preview").locator("img").waitFor({ timeout: 5000 });
  check("meta: OG card image loads", (await page.getByTestId("fb-preview").locator("img").count()) === 1);
  await page.locator("#mt-canonical").fill("not-a-url");
  await page.locator("#mt-image").fill("javascript:alert(1)");
  await settle(page);
  const bad = await lines();
  check("meta: invalid URLs flagged and left out", (await page.getByText("Canonical URL must be a full address").first().isVisible()) && (await page.getByText("Image URL must start with http:// or https://").first().isVisible()) && !bad.includes("javascript:") && !bad.includes("not-a-url") && bad.includes('href="https://shop.example/deals/"'));
  await page.locator("#mt-canonical").fill("https://shop.example/deals");
  await page.locator("#mt-robots").selectOption("noindex, follow");
  await settle(page);
  const adv = await txt(page, "meta-advice");
  check("meta: noindex + canonical mismatch notes", adv.includes("noindex asks search engines") && adv.includes("canonical URL differs"));
  await page.locator("#mt-robots").selectOption("custom");
  await page.getByLabel("Custom robots directive").fill("index, follow, max-image-preview:large, bogus");
  await settle(page);
  check("meta: custom robots + unknown directive warning", (await lines()).includes('content="index, follow, max-image-preview:large, bogus"') && (await txt(page, "meta-advice")).includes("Not a recognised robots directive: bogus"));
  await page.locator("#mt-title").fill("x".repeat(75));
  await page.locator("#mt-keywords").fill("mugs, pottery");
  await settle(page);
  check("meta: long title + keywords notes", (await txt(page, "meta-advice")).includes("75 characters") && (await txt(page, "meta-advice")).includes("Google ignores the keywords"));
  await page.locator("#mt-xcreator").fill("@bad handle");
  await settle(page);
  check("meta: invalid X handle", (await txt(page, "meta-advice")).includes("X handles are 1–15") && !(await lines()).includes("twitter:creator"));
  for (const [tab, has, not] of [["HTML meta", "<title>", "og:title"], ["Open Graph", "og:title", "<title>"], ["Twitter / X", "twitter:card", "og:title"]] as const) {
    await page.getByRole("tab", { name: tab }).click();
    const l = await lines();
    check(`meta: tab ${tab}`, l.includes(has) && !l.includes(not));
  }
  await page.getByRole("tab", { name: "Open Graph" }).click();
  await page.getByRole("button", { name: "Copy og:title tag" }).click();
  check("meta: copy individual tag", (await clip(page)) === `<meta property="og:title" content="${"x".repeat(75)}">`);
  await page.getByRole("tab", { name: "All tags" }).click();
  await btn(page, "Copy all").click();
  const copied = await clip(page);
  check("meta: copy all", copied.includes("<!-- Primary meta tags -->") && copied.includes("<!-- Open Graph -->") && copied.includes("<!-- Twitter / X -->"));
  const dl = await download(page, () => btn(page, "HTML").click());
  check("meta: download HTML", dl.name === "meta-tags.html" && dl.text.startsWith('<!DOCTYPE html>\n<html lang="en-IN">') && dl.text.includes("<title>"));
  await btn(page, "Mobile").click();
  check("meta: mobile preview", (await page.getByTestId("serp-preview").getAttribute("class"))!.includes("max-w-[380px]"));
  await btn(page, "Example").click();
  check("meta: example", (await page.locator("#mt-title").inputValue()).includes("Ceramic Mugs"));
  await btn(page, "Reset").click();
  check("meta: reset", (await page.locator("#mt-title").inputValue()) === "" && (await page.locator("#mt-robots").inputValue()) === "index, follow");
  await page.close();
}

/* ---------------- XML Sitemap Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/xml-sitemap-generator/");
  await page.locator("#sm-base").fill("https://example.com");
  await page.locator("#sm-paste").fill(["https://example.com/", "/about/", "https://example.com/about/", "https://example.com/search?q=a&b=<c>", "https://example.com/faq#pricing", "#top", "https://evil.example/", "ftp://example.com/x", "nonsense", "https://example.com/café menu"].join("\n"));
  await btn(page, "Add URLs").click();
  await settle(page);
  const rep = await txt(page, "sm-report");
  check("sm: report counts", rep.includes("5 added") && rep.includes("1 duplicate removed") && rep.includes("4 skipped") && rep.includes("#fragments removed from 1") && rep.includes("1 percent-encoded"), rep);
  check("sm: skip reasons listed", rep.includes("Different site") && rep.includes("Unsupported scheme") && rep.includes("Fragment only") && rep.includes("Not a valid absolute URL"));
  const xml = await page.getByTestId("sm-xml").innerText();
  check("sm: XML escaped", xml.includes("<loc>https://example.com/search?q=a&amp;b=%3Cc%3E</loc>") && xml.includes("<loc>https://example.com/caf%C3%A9%20menu</loc>"), xml.slice(0, 400));
  check("sm: no invented lastmod/priority", !xml.includes("<lastmod>") && !xml.includes("<priority>") && !xml.includes("<changefreq>"));
  await page.locator("#sm-def-lastmod").fill("2026-11-12");
  await page.locator("#sm-def-freq").selectOption("monthly");
  await page.locator("#sm-def-pr").selectOption("0.5");
  await page.getByLabel("Priority for URL 1").selectOption("1.0");
  await page.getByLabel("Change frequency for URL 2").selectOption("yearly");
  await settle(page);
  const xml2 = await page.getByTestId("sm-xml").innerText();
  check("sm: defaults + per-URL overrides", xml2.includes("<lastmod>2026-11-12</lastmod>") && (xml2.match(/<priority>0.5<\/priority>/g) ?? []).length === 4 && xml2.includes("<priority>1.0</priority>") && xml2.includes("<changefreq>yearly</changefreq>"));
  await btn(page, "Validate").click();
  check("sm: validates", (await txt(page, "sm-validate")).includes("Well-formed XML") && (await txt(page, "sm-validate")).includes("5 URLs in 1 file"));
  const dl = await download(page, () => btn(page, "Download sitemap.xml").click());
  check("sm: download sitemap.xml", dl.name === "sitemap.xml" && dl.text.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  const wf = await page.evaluate((x) => new DOMParser().parseFromString(x, "application/xml").getElementsByTagName("parsererror").length, dl.text);
  check("sm: downloaded XML is well-formed", wf === 0);
  await btn(page, "Copy XML").click();
  check("sm: copy XML", (await clip(page)) === dl.text);
  const csv = await download(page, () => btn(page, "CSV").click());
  check("sm: CSV export", csv.name === "sitemap-urls.csv" && csv.text.startsWith("loc,lastmod,changefreq,priority") && csv.text.split("\r\n").length === 7);
  await page.getByRole("button", { name: "Remove URL 5" }).click();
  check("sm: remove URL", (await page.getByTestId("sm-table").locator("tbody tr").count()) === 4);
  // Add a single URL, duplicate check across adds
  await page.locator("#sm-single").fill("/about/");
  await btn(page, "Add").click();
  await settle(page);
  check("sm: duplicate across adds", (await txt(page, "sm-report")).includes("0 added") && (await txt(page, "sm-stats")).includes("2 duplicates removed"));
  // TXT/CSV upload
  await page.locator('input[aria-label="Upload a TXT or CSV list of URLs"]').setInputFiles({ name: "urls.csv", mimeType: "text/csv", buffer: Buffer.from('title,url\n"Mugs, plates",https://example.com/mugs/\nBowls,https://example.com/bowls/\n') });
  await settle(page, 500);
  check("sm: CSV upload", (await txt(page, "sm-report")).includes("2 added"));
  // Import existing sitemap
  await btn(page, "Clear all").click();
  await page.getByRole("radio", { name: /Import sitemap/ }).click();
  await page.locator("#sm-import").fill(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.com/a?x=1&amp;y=2</loc><lastmod>2026-01-05</lastmod><priority>0.8</priority></url><url><loc>https://example.com/b</loc><changefreq>daily</changefreq></url></urlset>`);
  await btn(page, "Import").click();
  await settle(page);
  const xml3 = await page.getByTestId("sm-xml").innerText();
  check("sm: import keeps values", (await page.getByTestId("sm-table").locator("tbody tr").count()) === 2 && xml3.includes("<lastmod>2026-01-05</lastmod>") && xml3.includes("<priority>0.8</priority>") && xml3.includes("<changefreq>daily</changefreq>") && xml3.includes("a?x=1&amp;y=2"));
  await page.getByLabel("Priority for URL 1").selectOption("0.3");
  check("sm: edit imported + regenerate", (await page.getByTestId("sm-xml").innerText()).includes("<priority>0.3</priority>"));
  await page.locator("#sm-import").fill(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/s1.xml</loc></sitemap></sitemapindex>`);
  await btn(page, "Import").click();
  check("sm: sitemap index import explained", (await txt(page, "sm-report")).includes("sitemap index of 1") && (await page.getByTestId("sm-children").innerText()).includes("s1.xml"));
  await page.locator("#sm-import").fill("<html><body>hi</body></html>");
  await btn(page, "Import").click();
  check("sm: non-sitemap rejected", (await txt(page, "sm-report")).includes("doesn't look like a sitemap"));
  // Website mode is honest
  await page.getByRole("radio", { name: /From a website/ }).click();
  const web = await txt(page, "sm-website");
  check("sm: website mode explains no crawl", web.includes("doesn't crawl websites") && web.includes("https://example.com/sitemap.xml") && web.includes("https://example.com/robots.txt"));
  // Split > 50,000
  await btn(page, "Clear all").click();
  await page.getByRole("radio", { name: /Add URLs/ }).click();
  await page.evaluate(() => {
    const el = document.querySelector<HTMLTextAreaElement>("#sm-paste")!;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(el, Array.from({ length: 50_001 }, (_, i) => `/p/${i}`).join("\n"));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const tAdd = Date.now();
  await btn(page, "Add URLs").click();
  await page.getByTestId("sm-split").waitFor({ timeout: 30000 });
  check("sm: 50,001 URLs processed in < 10s", Date.now() - tAdd < 10000, `${Date.now() - tAdd} ms`);
  const split = await txt(page, "sm-split");
  check("sm: 50,001 URLs → 2 files + index", split.includes("50,001 URLs") && split.includes("sitemap-1.xml · 50,000 URLs") && split.includes("sitemap-2.xml · 1 URLs") && split.includes("sitemap-index.xml · 2 sitemaps"), split.slice(0, 200));
  check("sm: index preview", (await page.getByTestId("sm-xml").innerText()).includes("<loc>https://example.com/sitemap-2.xml</loc>"));
  const zip = await download(page, () => btn(page, "Download all (ZIP)").click());
  check("sm: ZIP download", zip.name === "sitemaps.zip" && zip.bytes[0] === 0x50 && zip.bytes[1] === 0x4b && zip.bytes.includes(Buffer.from("sitemap-index.xml")));
  await btn(page, "Validate").click();
  check("sm: split validates", (await txt(page, "sm-validate")).includes("50,001 URLs in 2 files"));
  await page.close();
}

/* ---------------- Robots.txt Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/robots-txt-generator/");
  const out = () => page.getByTestId("robots-output").innerText();
  check("rb: default allow all", (await out()).startsWith("User-agent: *\nAllow: /"));
  await page.locator("#rb-site").fill("https://example.com/");
  await page.getByRole("radio", { name: /WordPress example/ }).click();
  const wp = await out();
  check("rb: WordPress preset", wp.includes("Disallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php") && wp.includes("Sitemap: https://example.com/wp-sitemap.xml") && wp.includes("check these paths"));
  await page.getByRole("radio", { name: /Block all/ }).click();
  check("rb: block-all asks first", (await page.getByTestId("block-confirm").isVisible()) && !(await out()).includes("Disallow: /\n"));
  await btn(page, "Cancel").click();
  check("rb: cancel keeps config", (await out()).includes("wp-admin") && (await page.getByTestId("block-confirm").count()) === 0);
  await page.getByRole("radio", { name: /Block all/ }).click();
  await btn(page, "Yes, block all crawlers").click();
  check("rb: block all applied + danger warning", (await out()).includes("User-agent: *\nDisallow: /") && (await txt(page, "robots-lint")).includes("stay off your entire site"));
  await page.getByRole("radio", { name: /Custom/ }).click();
  const g0 = page.getByTestId("group-0");
  await g0.getByRole("button", { name: "Disallow", exact: true }).click();
  await g0.getByLabel("Rule 1 path").fill("/private/");
  await g0.getByRole("button", { name: "Allow", exact: true }).click();
  await g0.getByLabel("Rule 2 path").fill("/private/press/");
  await g0.getByRole("button", { name: "Disallow", exact: true }).click();
  await g0.getByLabel("Rule 3 path").fill("/assets/app.js");
  await settle(page);
  check("rb: rules added", (await out()).includes("User-agent: *\nDisallow: /private/\nAllow: /private/press/\nDisallow: /assets/app.js"));
  check("rb: CSS/JS warning", (await txt(page, "robots-lint")).includes("can stop search engines rendering"));
  await g0.getByRole("button", { name: "Move rule 2 up" }).click();
  check("rb: reorder", (await out()).includes("Allow: /private/press/\nDisallow: /private/"));
  await g0.getByRole("button", { name: "Remove rule 3" }).click();
  check("rb: remove rule", !(await out()).includes("app.js"));
  await g0.getByLabel("Rule 1 type").selectOption("disallow");
  check("rb: edit rule type", (await out()).includes("Disallow: /private/press/"));
  await g0.getByLabel("Rule 1 type").selectOption("allow");
  await btn(page, "Add user-agent group").click();
  const g1 = page.getByTestId("group-1");
  await g1.getByLabel("Add a known crawler").selectOption("Bingbot");
  await g1.getByLabel("Custom user agent").fill("AhrefsBot");
  await g1.getByRole("button", { name: "Add", exact: true }).click();
  await g1.getByRole("button", { name: "Disallow", exact: true }).click();
  await g1.getByLabel("Rule 1 path").fill("/");
  await g1.locator("summary").click();
  await g1.getByLabel("Crawl-delay (seconds)").fill("10");
  await settle(page);
  const multi = await out();
  check("rb: multiple user-agent groups", multi.includes("User-agent: Googlebot\nUser-agent: Bingbot\nUser-agent: AhrefsBot\nDisallow: /\nCrawl-delay: 10"), multi);
  check("rb: crawl-delay compatibility note", (await txt(page, "robots-lint")).includes("Google ignores it"));
  check("rb: specific block-all is not flagged as site-wide", !(await txt(page, "robots-lint")).includes("entire site"));
  await btn(page, "Add sitemap").click();
  await page.getByLabel("Sitemap 1 URL").fill("/sitemap.xml");
  check("rb: relative sitemap warning", (await txt(page, "robots-lint")).includes("must be a full URL"));
  await page.getByLabel("Sitemap 1 URL").fill("https://example.com/sitemap.xml");
  check("rb: sitemap declaration", (await out()).trimEnd().endsWith("Sitemap: https://example.com/sitemap.xml"));
  // Tester on the generated file
  const verdict = () => txt(page, "robots-verdict");
  await page.locator("#rb-ua").fill("DuckDuckBot");
  await page.locator("#rb-path").fill("/private/press/kit.pdf");
  check("rb: tester allow (longest match)", (await verdict()).startsWith("Allowed") && (await verdict()).includes("Allow: /private/press/"));
  await page.locator("#rb-path").fill("https://example.com/private/x");
  check("rb: tester block", (await verdict()).startsWith("Blocked") && (await verdict()).includes("Disallow: /private/"));
  await page.locator("#rb-ua").fill("bingbot");
  await page.locator("#rb-path").fill("/blog/");
  check("rb: tester uses specific group", (await verdict()).startsWith("Blocked") && (await verdict()).includes("group for"));
  await page.locator("#rb-test-text").fill("User-agent: *\nDisallow: /*.pdf$\nAllow: /a\nDisallow: /a");
  await page.locator("#rb-ua").fill("Googlebot");
  await page.locator("#rb-path").fill("/doc.pdf");
  check("rb: tester on pasted rules ($)", (await verdict()).startsWith("Blocked"));
  await page.locator("#rb-path").fill("/doc.pdf?v=2");
  check("rb: $ anchor respected", (await verdict()).startsWith("Allowed"));
  await page.locator("#rb-path").fill("/a");
  check("rb: tie → Allow", (await verdict()).startsWith("Allowed") && (await verdict()).includes("Allow wins a tie"));
  await page.getByRole("button", { name: "Test the generated file instead" }).click();
  check("rb: back to generated file", (await page.locator("#rb-test-text").inputValue()).includes("AhrefsBot"));
  await btn(page, "Copy").click();
  check("rb: copy", (await clip(page)) === (await out()));
  const dl = await download(page, () => btn(page, "Download").click());
  check("rb: download robots.txt", dl.name === "robots.txt" && dl.text === (await out()));
  check("rb: education section", await page.getByText("It controls crawling, not indexing.").first().isVisible());
  await btn(page, "Reset").click();
  check("rb: reset", (await out()).startsWith("User-agent: *\nAllow: /") && (await page.locator("#rb-site").inputValue()) === "");
  await page.close();
}

/* ---------------- Open Graph Preview ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/open-graph-preview/");
  await page.locator("#og-title").fill("A very long title ".repeat(8));
  await page.locator("#og-desc").fill("Description ".repeat(30));
  await page.locator("#og-url").fill("https://shop.example/mugs/");
  await page.locator("#og-image").fill(`${BASE}/opengraph-image`);
  await page.locator("#og-site").fill("Shop");
  await page.getByTestId("og-image-advice").waitFor({ timeout: 5000 });
  check("og: image dimensions + guidance", (await txt(page, "og-image-advice")).includes("1200 × 630 px (≈1.91:1)"), await txt(page, "og-image-advice"));
  const pv = await txt(page, "og-previews");
  check("og: four platform previews", ["facebook-style", "linkedin-style", "whatsapp-style", "x-style"].every((s) => pv.toLowerCase().includes(s)) && (await page.getByTestId("og-previews").locator("img").count()) === 4, `${pv.slice(0, 120)} imgs=${await page.getByTestId("og-previews").locator("img").count()}`);
  check("og: long title clamped in card", await page.getByTestId("fb-preview").locator(".line-clamp-2").first().isVisible());
  check("og: character counts", (await page.getByText(`${"A very long title ".repeat(8).trim().length} / ~60`).isVisible()) && (await page.getByText(/^359 \/ ~160$/).isVisible()));
  await page.locator("#og-card").selectOption("summary");
  check("og: X summary card layout", (await page.getByTestId("x-preview").locator('[style*="1 / 1"]').count()) === 1);
  await btn(page, "Mobile").click();
  check("og: mobile width", (await page.getByTestId("og-previews").getAttribute("class"))!.includes("max-w-[340px]"));
  const tags = await page.getByTestId("tag-lines").innerText();
  check("og: tags", ["og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name", "twitter:card", "twitter:title", "twitter:description", "twitter:image"].every((k) => tags.includes(`"${k}"`)) && tags.includes('content="summary"'));
  await page.locator("#og-image").fill("https://");
  await page.locator("#og-url").fill("notaurl");
  check("og: invalid URLs flagged", (await page.getByText("Page URL must be a full address").first().isVisible()) && (await page.getByText(/Image URL (must|needs)/).first().isVisible()) && !(await page.getByTestId("tag-lines").innerText()).includes("og:url"));
  await page.locator("#og-image").fill("https://img.invalid/missing.png");
  await page.getByText("Image couldn't load").first().waitFor({ timeout: 8000 });
  check("og: unreachable image reported", (await txt(page, "og-image-advice")).includes("couldn't be loaded"));
  await page.locator("#og-image").fill("");
  check("og: missing image placeholder", (await page.getByTestId("fb-preview").innerText()).includes("No image"));
  await page.locator('input[aria-label="Preview a local image"]').setInputFiles("tests/fixtures/quadrants.png");
  await page.getByTestId("og-local").waitFor();
  await page.getByTestId("og-image-advice").waitFor();
  check("og: local image preview only", (await txt(page, "og-local")).includes("isn't used in the tags") && !(await page.getByTestId("tag-lines").innerText()).includes("og:image") && (await page.getByTestId("fb-preview").locator("img").getAttribute("src"))!.startsWith("blob:"));
  // Import from page source
  await page.getByRole("radio", { name: /Import from page/ }).click();
  check("og: import explains no fetch", (await txt(page, "og-import")).includes("nothing is fetched for you"));
  await page.locator("#og-page").fill("https://news.example/story");
  await page.locator("#og-source").fill(`<head><title>Fallback</title><meta property="og:title" content="Imported &amp; title"><meta name="description" content="Imported description"><meta property="og:image" content="/img/card.png"><meta property="og:site_name" content="News"><script>window.__og=1</script></head>`);
  await btn(page, "Read metadata").click();
  check("og: import fills fields", (await page.locator("#og-title").inputValue()) === "Imported & title" && (await page.locator("#og-desc").inputValue()) === "Imported description" && (await page.locator("#og-image").inputValue()) === "https://news.example/img/card.png");
  check("og: imported fields marked", (await page.getByText("Imported", { exact: true }).count()) >= 4);
  check("og: pasted script never runs", (await page.evaluate(() => (window as unknown as { __og?: number }).__og)) === undefined);
  await page.locator("#og-title").fill("Edited");
  check("og: editing clears imported badge", (await page.getByText("Imported", { exact: true }).count()) >= 3 && !(await page.locator('label[for="og-title"]').innerText()).includes("Imported"));
  await page.locator("#og-source").fill("<p>no tags</p>");
  await btn(page, "Read metadata").click();
  check("og: import with no tags", await page.getByText("No title, description, Open Graph or Twitter tags were found").isVisible());
  await btn(page, "Copy all").click();
  check("og: copy all", (await clip(page)).includes("<!-- Open Graph -->") && (await clip(page)).includes('content="Edited"'));
  const dl = await download(page, () => btn(page, "HTML").click());
  check("og: download snippet", dl.name === "open-graph-tags.html" && dl.text.includes('property="og:title" content="Edited"'));
  await btn(page, "Reset").click();
  check("og: reset", (await page.locator("#og-title").inputValue()) === "" && (await page.getByTestId("og-local").count()) === 0);
  await page.close();
}

/* ---------------- HTML Entity Encoder ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/html-entity-encoder/");
  const input = page.locator("#entity-input");
  const output = page.locator("#entity-output");
  await input.fill("Tom & Jerry < Special Characters >");
  await settle(page);
  check("ent: brief example", (await output.inputValue()) === "Tom &amp; Jerry &lt; Special Characters &gt;");
  await input.fill(`"Hi" it's café © 😀`);
  await settle(page);
  check("ent: quotes, special only", (await output.inputValue()) === "&quot;Hi&quot; it&#39;s café © 😀");
  await page.getByRole("radio", { name: "+ all non-ASCII" }).click();
  check("ent: non-ASCII named", (await output.inputValue()) === "&quot;Hi&quot; it&#39;s caf&eacute; &copy; &#x1F600;");
  await page.getByRole("radio", { name: /Decimal/ }).click();
  check("ent: decimal", (await output.inputValue()) === "&#34;Hi&#34; it&#39;s caf&#233; &#169; &#128512;");
  await page.getByRole("radio", { name: /Hex/ }).click();
  check("ent: hex", (await output.inputValue()) === "&#x22;Hi&#x22; it&#x27;s caf&#xE9; &#xA9; &#x1F600;");
  await page.getByRole("switch", { name: /Encode quotes/ }).uncheck({ force: true });
  check("ent: quotes off", (await output.inputValue()).startsWith(`"Hi" it's`));
  await page.getByRole("radio", { name: /Named/ }).click();
  await page.getByRole("radio", { name: "Special only" }).click();
  await input.fill("&amp; & &copy;");
  await settle(page);
  check("ent: double-encodes by default", (await output.inputValue()) === "&amp;amp; &amp; &amp;copy;");
  await page.getByRole("switch", { name: /Keep existing entities/ }).check({ force: true });
  check("ent: preserve existing", (await output.inputValue()) === "&amp; &amp; &copy;");
  check("ent: emoji counted once", (await page.getByText(/^1 chars$/).count()) === 0 && (await (async () => {
    await input.fill("😀");
    await settle(page);
    return page.getByText("1 chars", { exact: true }).isVisible();
  })()));
  await page.getByRole("radio", { name: "Decode", exact: true }).click();
  await input.fill("Tom &amp; Jerry &lt; Special Characters &gt; &copy; &#169; &#xA9; &#x1F600; &NotEqualTilde;");
  await settle(page);
  check("ent: decode named/decimal/hex/emoji", (await output.inputValue()) === "Tom & Jerry < Special Characters > © © © 😀 ≂̸");
  check("ent: decode no issues", (await txt(page, "entity-issues")).includes("no problems found"));
  await input.fill("&zzz; &copy 2026 &#0; &#x110000; Fish & Chips");
  await settle(page);
  const iss = await txt(page, "entity-issues");
  check("ent: invalid entities flagged", iss.includes("4 entities need attention") && iss.includes("“&zzz;” isn't a known") && iss.includes("missing") === false && iss.includes("“&copy” has no semicolon") && iss.includes("isn't a valid Unicode character"), iss);
  check("ent: invalid decode output", (await output.inputValue()) === "&zzz; © 2026 � � Fish & Chips");
  await input.fill("&lt;img src=x onerror=&quot;window.__ent=1&quot;&gt;&lt;script&gt;window.__ent=2&lt;/script&gt;");
  await settle(page);
  check("ent: decoded HTML shown as text, never run", (await output.inputValue()) === `<img src=x onerror="window.__ent=1"><script>window.__ent=2</script>` && (await page.evaluate(() => (window as unknown as { __ent?: number }).__ent)) === undefined);
  await btn(page, "Use output as input").click();
  check("ent: swap direction", (await page.getByRole("radio", { name: "Encode", exact: true }).getAttribute("aria-checked")) === "true" && (await output.inputValue()).startsWith("&lt;img"));
  await btn(page, "Copy").click();
  check("ent: copy", (await clip(page)) === (await output.inputValue()));
  const dl = await download(page, () => btn(page, "TXT").click());
  check("ent: download TXT", dl.name === "encoded.txt" && dl.text === (await output.inputValue()));
  await page.evaluate(() => {
    const el = document.querySelector<HTMLTextAreaElement>("#entity-input")!;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(el, "a & b < c > d ".repeat(100_000));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(1500);
  check("ent: 1.4M chars handled", (await output.inputValue()).length === "a &amp; b &lt; c &gt; d ".length * 100_000);
  await btn(page, "Clear").click();
  check("ent: empty input", (await output.inputValue()) === "" && (await page.getByText("The result appears here as you type.").count()) === 0 ? true : (await output.getAttribute("placeholder")) === "The result appears here as you type.");
  await btn(page, "Sample").click();
  await settle(page);
  check("ent: sample", (await output.inputValue()).includes("Tom &amp; Jerry"));
  await btn(page, "Reset").click();
  check("ent: reset", (await input.inputValue()) === "");
  await page.close();
}

/* ---------------- Registry, navigation, search & SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/all-tools/");
  const all = await page.locator("main").innerText();
  check("all-tools: SEO & Website Tools category with 5 tools", all.includes("SEO & Website Tools") && ["Meta Tag Generator", "XML Sitemap Generator", "Robots.txt Generator", "Open Graph Preview", "HTML Entity Encoder & Decoder"].every((n) => all.includes(n)));
  check("all-tools: renamed text category", all.includes("Text & Writing Tools") && !all.includes("Text & SEO Tools"));
  await open(page, "/");
  check("home: category listed", (await page.locator("#categories").innerText()).includes("SEO & Website Tools"));
  check("footer: meta tag generator + category", (await page.locator("footer").innerText()).includes("Meta Tag Generator") && (await page.locator("footer").innerText()).includes("SEO & Website Tools"));
  for (const [q, want] of [["meta tags", "Meta Tag Generator"], ["sitemap", "XML Sitemap Generator"], ["robots.txt", "Robots.txt Generator"], ["og image", "Open Graph Preview"], ["linkedin preview", "Open Graph Preview"], ["html entities", "HTML Entity Encoder"], ["&amp;", "HTML Entity Encoder"]] as const) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "meta-tag-generator": "Meta Tag Generator Online – Free SEO Meta Tags &amp; HTML Code",
    "xml-sitemap-generator": "XML Sitemap Generator Online – Create sitemap.xml for Free",
    "robots-txt-generator": "Robots.txt Generator Online – Create Search Engine Crawler Rules",
    "open-graph-preview": "Open Graph Preview Tool – Preview Social Media Link Cards",
    "html-entity-encoder": "HTML Entity Encoder &amp; Decoder Online – Free HTML Character Converter",
  };
  for (const [slug, title] of Object.entries(titles)) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
    const types: string[] = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      const j = JSON.parse(m[1]);
      types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
    }
    const ok =
      h.includes(`<title>${title}</title>`) &&
      (h.match(/<h1/g) ?? []).length === 1 &&
      h.includes(`rel="canonical" href="https://tools.zspace.in/${slug}/"`) &&
      h.includes('property="og:title"') &&
      h.includes('name="twitter:card"') &&
      h.includes('name="description"') &&
      ["BreadcrumbList", "WebApplication", "FAQPage", "HowTo"].every((x) => types.includes(x)) &&
      !/aggregateRating|"review"|ratingValue/i.test(h) &&
      !/<meta[^>]+name="robots"[^>]+noindex/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
    const og = await fetch(`${BASE}/${slug}/opengraph-image`);
    check(`seo: /${slug}/ OG image`, og.status === 200 && (og.headers.get("content-type") ?? "").startsWith("image/"));
    // Tool UI comes before long-form content.
    const toolPos = h.indexOf('id="tool"') >= 0 ? h.indexOf('id="tool"') : h.indexOf("<h1");
    check(`ux: /${slug}/ tool near top`, toolPos > 0 && toolPos < h.indexOf("What you get"));
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check("seo: sitemap + llms.txt list new routes", Object.keys(titles).every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  check("seo: robots.txt allows new routes", !Object.keys(titles).some((s) => robots.includes(`Disallow: /${s}`)));
  await page.close();
}

const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")))];
check("only user-entered image hosts contacted (no analytics, no fetching pages)", external.every((u) => /^https:\/\/([\w-]+\.)*(invalid|example)\//.test(u)), external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon|img\.invalid|ERR_NAME_NOT_RESOLVED/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
