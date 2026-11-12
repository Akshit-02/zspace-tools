// End-to-end tests for the "tools 16–20 (v2)" brief: EMI and Days Between Dates
// (renamed + extended), URL query helper, Base64 whitespace option, URL Slug Generator.
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
  return { name: dl.suggestedFilename(), text: readFileSync((await dl.path())!, "utf8") };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const settle = (page: Page, ms = 150) => page.waitForTimeout(ms);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ---------------- Redirects ---------------- */
for (const [from, to] of [["/loan-emi-calculator/", "/emi-calculator/"], ["/date-calculator/", "/days-between-dates/"]]) {
  const r = await fetch(`${BASE}${from}`, { redirect: "manual" });
  check(`redirect ${from} → ${to}`, r.status === 308 && (r.headers.get("location") ?? "").endsWith(to), `${r.status} ${r.headers.get("location")}`);
}

/* ---------------- EMI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/emi-calculator/");
  const totals = page.getByTestId("emi-totals");
  const set = async (p: string, r: string, n: string, unit: "Years" | "Months") => {
    await page.getByLabel("Loan amount", { exact: true }).fill(p);
    await page.getByLabel("Interest rate (per year)", { exact: true }).fill(r);
    await page.getByRole("radio", { name: unit, exact: true }).click();
    await page.getByLabel("Loan tenure", { exact: true }).fill(n);
    await settle(page);
  };
  await set("1000000", "10", "20", "Years");
  const t = (await totals.innerText()).replace(/\s+/g, " ");
  check("emi: rate + tenure rows", t.includes("Annual interest rate 10%") && t.includes("Loan tenure 20 years (240 months)"), t);
  check("emi: donut chart (principal vs interest)", (await page.getByTestId("emi-donut").getAttribute("aria-label")) === "Principal 43%, interest 57% of total repayment");
  for (const [label, amount] of [["Home loan", "5000000"], ["Car loan", "800000"], ["Personal loan", "500000"]]) {
    await btn(page, label).click();
    check(`emi: ${label} preset fills amount/tenure, not rate`, (await page.getByLabel("Loan amount", { exact: true }).inputValue()) === amount && (await page.getByLabel("Interest rate (per year)", { exact: true }).inputValue()) === "10");
  }
  await set("1000", "12", "3", "Months");
  check("emi: very small principal + short tenure", (await page.getByTestId("emi-value").innerText()) === "₹340.02");
  await set("50000", "9.5", "1", "Months");
  check("emi: one-month loan", (await page.getByTestId("emi-value").innerText()) === "₹50,395.83");
  await set("1000000", "10", "20", "Years");
  const csv = await download(page, () => btn(page, "Schedule CSV").click());
  const rows = csv.text.trim().split("\n").slice(2, -1).map((l) => l.split(",").map(Number));
  const sumPrincipal = Math.round(rows.reduce((a, r) => a + r[3], 0) * 100);
  const sumEmi = Math.round(rows.reduce((a, r) => a + r[2], 0) * 100);
  check("emi: CSV principal sums to loan; instalments sum to total; ends at 0", rows.length === 240 && sumPrincipal === 100000000 && sumEmi === 231605003 && rows.at(-1)![6] === 0, `${sumPrincipal} ${sumEmi}`);
  await page.close();
}

/* ---------------- Days between dates ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/days-between-dates/");
  const main = page.getByTestId("date-main");
  const res = page.getByTestId("date-result");
  const dates = async (a: string, b: string) => {
    await page.getByLabel("Start date", { exact: true }).fill(a);
    await page.getByLabel("End date", { exact: true }).fill(b);
    await settle(page);
    return (await main.innerText()).replace(/\s+/g, " ");
  };
  check("days: same day = 0 / inclusive 1", (await dates("2026-05-05", "2026-05-05")) === "0 days");
  check("days: one-day difference", (await dates("2026-05-05", "2026-05-06")) === "1 day");
  check("days: month boundary", (await dates("2026-01-31", "2026-02-01")) === "1 day");
  check("days: Feb 29 leap", (await dates("2024-02-28", "2024-03-01")) === "2 days" && (await dates("2023-02-28", "2023-03-01")) === "1 day");
  check("days: past dates", (await dates("1999-12-31", "2000-01-01")) === "1 day");
  await dates("2026-01-01", "2026-01-31");
  await page.getByRole("switch", { name: /Include end date/ }).check({ force: true });
  await settle(page);
  const r = await res.innerText();
  check("days: inclusive 31, hours/minutes, weekday of both dates", (await main.innerText()).includes("31") && r.includes("Hours\n744") && r.includes("Minutes\n44,640") && r.includes("Start day\nThursday") && r.includes("End day\nSaturday"));
  await btn(page, "Copy share link").click();
  const link = await clip(page);
  check("days: share link contains only mode/dates/options", /\?m=between&a=2026-01-01&b=2026-01-31&inc=1$/.test(link), link);
  const p2 = await ctx.newPage();
  await open(p2, link.replace(/^https?:\/\/[^/]+/, ""));
  check("days: share link restores calculation", (await p2.getByTestId("date-main").innerText()).replace(/\s+/g, " ") === "31 days");
  await open(p2, "/days-between-dates/?m=evil&a=2026-02-30&b=<script>&wk=9,9&hol=x");
  check("days: invalid share params ignored safely", (await p2.getByTestId("date-main").innerText()).includes("days") && !(await p2.content()).includes("<script>&"));
  await p2.close();

  await page.getByRole("radio", { name: "Business days" }).click();
  await dates("2026-11-02", "2026-11-14");
  await page.getByRole("button", { name: /^Mon–Fri/ }).click();
  await settle(page);
  check("days: business Mon–Fri", (await main.innerText()).replace(/\s+/g, " ") === "10 business days");
  await page.getByRole("button", { name: /^Mon–Sat/ }).click();
  await settle(page);
  check("days: business Mon–Sat", (await main.innerText()).replace(/\s+/g, " ") === "12 business days");
  await page.locator("textarea[id$='-hol']").fill("2026-11-04\n2026-11-08");
  await settle(page);
  check("days: custom holidays excluded (weekday only)", (await main.innerText()).replace(/\s+/g, " ") === "11 business days" && (await res.innerText()).includes("fell on a weekend"));

  await page.getByRole("radio", { name: "Countdown" }).click();
  const today = new Date();
  const t = (n: number) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));
  await page.getByLabel("Count down to", { exact: true }).fill(t(0));
  await settle(page);
  check("days: countdown today", (await main.innerText()) === "Today");
  await page.getByLabel("Count down to", { exact: true }).fill(t(10));
  await settle(page);
  check("days: countdown 10 days to go", (await main.innerText()).replace(/\s+/g, " ") === "10 days" && (await res.innerText()).includes("to go until"));
  await page.getByLabel("Count down to", { exact: true }).fill(t(-3));
  await settle(page);
  check("days: countdown past date", (await main.innerText()).replace(/\s+/g, " ") === "3 days" && (await res.innerText()).includes("since"));
  await btn(page, "Copy result").click();
  check("days: copy countdown summary", (await clip(page)).includes("was 3 days ago"));
  await page.close();
}

/* ---------------- URL query helper ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/url-encoder-decoder/");
  await btn(page, "Load sample URL").click();
  const table = page.getByTestId("query-table");
  const vals = await table.locator("input").evaluateAll((els) => (els as HTMLInputElement[]).map((e) => e.value));
  check("url: query params decoded, repeated keys kept", JSON.stringify(vals) === JSON.stringify(["q", "café au lait", "tag", "new", "tag", "sale", "utm_source", "newsletter"]), JSON.stringify(vals));
  await page.getByLabel("Parameter 4 value").fill("email & social");
  await btn(page, "Remove parameter 3").click();
  await btn(page, "Add parameter").click();
  await page.getByLabel("Parameter 4 key").fill("page");
  await page.getByLabel("Parameter 4 value").fill("2");
  const rebuilt = await page.getByTestId("query-rebuilt").innerText();
  check("url: edited URL rebuilt, encoded once", rebuilt === "https://shop.example/search?q=caf%C3%A9%20au%20lait&tag=new&utm_source=email%20%26%20social&page=2#results", rebuilt);
  await page.locator("#qp-url").fill("https://x.example/?a=100%&b=%20ok");
  check("url: malformed parameter flagged, not crashed", await page.getByText("Malformed encoding — kept exactly as typed.").isVisible());
  check("url: not-encryption notice", await page.getByText(/it isn’t encryption/).isVisible());
  await page.close();
}

/* ---------------- Base64 whitespace option ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/base64-encoder-decoder/");
  await page.getByRole("radio", { name: "Decode from Base64" }).click();
  await page.locator("#b64-input").fill("SGVs\nbG8g\n8J+Riw==");
  await settle(page);
  check("b64: whitespace ignored by default", (await page.locator("#b64-output").inputValue()) === "Hello 👋");
  await page.getByRole("switch", { name: /Ignore whitespace/ }).uncheck({ force: true });
  await settle(page);
  check("b64: whitespace strict mode errors helpfully", await page.getByRole("alert").filter({ hasText: "spaces or line breaks" }).isVisible());
  await page.close();
}

/* ---------------- URL Slug Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/url-slug-generator/");
  const out = page.getByTestId("slug-output");
  const slug = async (t: string) => {
    await page.locator("#slug-title").fill(t);
    await settle(page);
    return (await out.innerText()).trim();
  };
  check("slug: spec example", (await slug("The Best Digital Marketing Strategies for Small Businesses in 2027!")) === "the-best-digital-marketing-strategies-for-small-businesses-in-2027");
  check("slug: punctuation, multiple spaces, duplicates", (await slug("  Hello,,   World!! --  How's it   going?? ")) === "hello-world-hows-it-going");
  check("slug: numbers & symbols", (await slug("Top 10 Tips: 100% Free & Easy")) === "top-10-tips-100-percent-free-and-easy");
  check("slug: transliteration", (await slug("Café Straße Łódź Привет")) === "cafe-strasse-lodz-privet");
  check("slug: Unicode kept", (await slug("東京 travel guide")) === "東京-travel-guide");
  await page.getByRole("switch", { name: /Keep non-Latin letters/ }).uncheck({ force: true });
  await settle(page);
  check("slug: ASCII-only removes + explains", (await out.innerText()).trim() === "travel-guide" && (await page.getByText(/Removed \(no ASCII equivalent\)/).isVisible()));
  await page.getByRole("switch", { name: /Keep non-Latin letters/ }).check({ force: true });
  await page.getByRole("switch", { name: /Remove stop words/ }).check({ force: true });
  check("slug: stop words", (await slug("The Art of War and the Lord of the Rings")) === "art-war-lord-rings");
  await page.getByRole("switch", { name: /Remove stop words/ }).uncheck({ force: true });
  await page.locator("#slug-max").fill("30");
  check("slug: max length at word boundary", (await slug("Best Website Development Practices for 2027")) === "best-website-development");
  await page.locator("#slug-max").fill("");
  await page.getByRole("radio", { name: /underscore/ }).click();
  await page.getByRole("radio", { name: "UPPERCASE" }).click();
  check("slug: underscore + uppercase", (await slug("Hello World")) === "HELLO_WORLD");
  await page.getByRole("radio", { name: /hyphen/ }).click();
  await page.getByRole("radio", { name: "lowercase" }).click();
  await slug("Best Website Development Practices");
  await page.locator("#slug-base").fill("https://example.com/blog/");
  await settle(page);
  check("slug: URL preview", (await page.getByTestId("slug-url").innerText()) === "https://example.com/blog/best-website-development-practices");
  await btn(page, "Copy full URL").click();
  check("slug: copy full URL", (await clip(page)) === "https://example.com/blog/best-website-development-practices");
  await btn(page, "Copy slug").click();
  check("slug: copy slug", (await clip(page)) === "best-website-development-practices");
  await page.locator("#slug-base").fill("not a url");
  check("slug: invalid base flagged", await page.getByText("Enter a web address such as").isVisible());
  await page.locator("#slug-base").fill("https://example.com/blog/");

  await page.getByRole("radio", { name: /Bulk/ }).click();
  await btn(page, "Sample").click();
  await settle(page, 300);
  const rows = await page.getByTestId("slug-table").locator("tr").allInnerTexts();
  check("slug: bulk + unique duplicates", rows.length === 6 && rows[5].includes("how-to-make-cold-brew-at-home-2") && rows[1].includes("10-cafe-ideas-for-small-spaces-2027-edition"), rows.join(" | "));
  const csv = await download(page, () => btn(page, "Download CSV").click());
  const lines = csv.text.trim().split("\n");
  check("slug: CSV export (title, slug, url)", lines[0] === "title,slug,url" && lines.length === 7 && lines[3] === '"Straße, Fjörd & Łódź: A European Road Trip",strasse-fjord-and-lodz-a-european-road-trip,https://example.com/blog/strasse-fjord-and-lodz-a-european-road-trip', lines[3]);
  await btn(page, "Reset").click();
  check("slug: reset", (await page.locator("#slug-bulk").inputValue()) === "");
  await page.close();
}

/* ---------------- Search + SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["slug", "URL Slug Generator"], ["seo url", "URL Slug Generator"], ["emi", "EMI Calculator"], ["countdown", "Days Between Dates"], ["query string", "URL Encoder"]]) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "emi-calculator": "EMI Calculator Online – Calculate Monthly Loan EMI, Interest &amp; Payment",
    "days-between-dates": "Days Between Dates Calculator – Calculate Date Difference Online",
    "url-encoder-decoder": "URL Encoder &amp; Decoder Online – Free URL Encoding Tool",
    "base64-encoder-decoder": "Base64 Encoder &amp; Decoder Online – Free Text Converter",
    "url-slug-generator": "URL Slug Generator – Create SEO-Friendly URLs Online",
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
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((x) => types.includes(x)) &&
      !/aggregateRating|"review"/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap/llms list new routes, not old ones", Object.keys(titles).every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)) && !sm.includes("loan-emi-calculator") && !sm.includes("/date-calculator/"));
  await page.close();
}

const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
