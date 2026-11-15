// End-to-end tests for calculators 46–50: FD, RD, Lumpsum, ROI, CAGR.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-15.mts
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3100";
const ORIGIN = new URL(BASE).origin;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
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
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  return { name: dl.suggestedFilename(), text: readFileSync((await dl.path())!).toString("utf8") };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const radio = (page: Page, name: string | RegExp) => page.getByRole("radio", { name, exact: typeof name === "string" });
const tid = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ").trim();
/** Stubs window.print so the print summary can be inspected instead of opening a dialog. */
async function printed(page: Page, trigger: () => Promise<unknown>) {
  await page.evaluate(() => {
    (window as unknown as { __printed?: string }).__printed = "";
    window.print = () => {
      (window as unknown as { __printed?: string }).__printed = document.getElementById("print-root")?.innerText ?? "";
    };
  });
  await trigger();
  await page.waitForFunction(() => Boolean((window as unknown as { __printed?: string }).__printed), null, { timeout: 5000 });
  return page.evaluate(() => (window as unknown as { __printed: string }).__printed);
}

/* ---------------- 46 FD ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/fd-calculator/");
  check("fd: ₹1L, 7%, quarterly, 5y", (await tid(page, "fd-main")) === "₹1,41,477.82" && (await tid(page, "fd-interest")) === "₹41,477.82");
  check("fd: effective yield", (await tid(page, "fd-yield")) === "7.186%");
  await radio(page, "Monthly").click();
  await page.locator("#fd-rate").fill("7.5");
  await page.locator("#fd-tenure").fill("1");
  check("fd: monthly compounding", (await tid(page, "fd-main")) === "₹1,07,763.26");
  await radio(page, "Quarterly").click();
  await page.locator("#fd-principal").fill("200000");
  await page.locator("#fd-rate").fill("6.8");
  await page.locator("#fd-tenure").fill("3");
  await page.getByRole("switch", { name: /Senior citizen rate/ }).check({ force: true });
  check("fd: senior-citizen extra rate", (await tid(page, "fd-main")) === "₹2,48,475.18");
  await page.getByRole("switch", { name: /Senior citizen rate/ }).uncheck({ force: true });
  await page.locator("#fd-principal").fill("50000");
  await page.locator("#fd-rate").fill("6");
  await page.locator("#fd-tenure").fill("3");
  await radio(page, "Months").click();
  check("fd: short tenure (3 months)", (await tid(page, "fd-main")) === "₹50,750.00" && (await page.getByText(/shorter than six months/).isVisible()));
  await page.locator("#fd-tenure").fill("90");
  await radio(page, "Days").click();
  check("fd: days unit", (await tid(page, "fd-main")).startsWith("₹50,7"));
  await page.locator("#fd-tenure").fill("3");
  check("fd: below 7 days rejected", await page.getByRole("alert").filter({ hasText: /7 days/ }).isVisible());
  await radio(page, "Years").click();
  await page.locator("#fd-principal").fill("500000");
  await page.locator("#fd-rate").fill("7");
  await page.locator("#fd-tenure").fill("5");
  await radio(page, /^Paid out/).click();
  check("fd payout: quarterly payout ₹8,750", (await tid(page, "fd-main")) === "₹8,750.00" && (await tid(page, "fd-total")) === "₹6,75,000.00" && (await tid(page, "fd-interest")) === "₹1,75,000.00");
  await radio(page, "Monthly").click();
  check("fd payout: monthly", (await tid(page, "fd-main")) === "₹2,916.67");
  await page.getByRole("switch", { name: /Estimate tax on interest/ }).check({ force: true });
  check("fd: optional tax estimate only when enabled", (await tid(page, "fd-tax")) === "₹17,500.00");
  await page.getByRole("switch", { name: /Estimate tax on interest/ }).uncheck({ force: true });
  check("fd: tax hidden when off", (await page.getByTestId("fd-tax").count()) === 0);
  const csv = await download(page, () => btn(page, "CSV").click());
  check("fd: CSV", csv.name === "fd-schedule.csv" && csv.text.includes("Year,Interest paid this year,Principal held") && csv.text.trim().split("\n").length === 7);
  const pr = await printed(page, () => btn(page, "Print").click());
  check("fd: print summary", pr.includes("Fixed deposit estimate") && pr.includes("₹1,75,000.00"));
  await page.locator("#fd-principal").fill("0");
  check("fd: invalid principal", await page.getByRole("alert").filter({ hasText: /greater than 0/ }).isVisible());
  await page.locator("#fd-principal").fill("100000");
  await page.locator("#fd-rate").fill("-1");
  check("fd: negative rate rejected", await page.getByRole("alert").filter({ hasText: /0% to 30%/ }).isVisible());
  await btn(page, "Reset").click();
  check("fd: reset from error state", (await tid(page, "fd-main")) === "₹1,41,477.82");
  await page.locator("#fd-rate").fill("0");
  check("fd: zero interest", (await tid(page, "fd-interest")) === "₹0.00");
  await page.close();
}

/* ---------------- 47 RD ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/rd-calculator/");
  check("rd: ₹5,000 × 5y @7% quarterly", (await tid(page, "rd-maturity")) === "₹3,59,671.95" && (await tid(page, "rd-deposited")) === "₹3,00,000.00");
  check("rd: effective yield", (await tid(page, "rd-yield")) === "7.19%");
  await page.locator("#rd-tenure").fill("12");
  await radio(page, "Months").click();
  check("rd: 1 year", (await tid(page, "rd-maturity")) === "₹62,312.05");
  await radio(page, "End of month").click();
  check("rd: end-of-month timing", (await tid(page, "rd-maturity")) === "₹61,952.75");
  await radio(page, /^Monthly approximation/).click();
  check("rd: monthly approximation", (await tid(page, "rd-maturity")) === "₹61,962.93");
  await radio(page, /^Quarterly/).click();
  await radio(page, "Start of month").click();
  await radio(page, "Monthly").click();
  check("rd: monthly schedule rows = instalments", (await page.getByTestId("rd-table").locator("tbody tr").count()) === 12);
  const credited = await page.getByTestId("rd-table").locator("tbody tr").evaluateAll((rows) => rows.map((r) => r.children[2].textContent?.trim()));
  check("rd: interest credited only at quarter ends", credited.map((c, i) => (c === "—" ? 0 : i + 1)).filter(Boolean).join(",") === "3,6,9,12", credited.join("|"));
  await page.getByRole("switch", { name: /Compare with an FD/ }).check({ force: true });
  check("rd: FD comparison with timing explained", (await tid(page, "rd-compare")).includes("₹64,311.54") && (await tid(page, "rd-compare")).includes("on day one"));
  const csv = await download(page, () => btn(page, "CSV").click());
  check("rd: CSV schedule", csv.name === "rd-schedule.csv" && csv.text.trim().split("\n").length === 14);
  await page.locator("#rd-rate").fill("0");
  check("rd: zero interest = deposits", (await tid(page, "rd-maturity")) === "₹60,000.00");
  await page.locator("#rd-monthly").fill("0");
  check("rd: invalid deposit", await page.getByRole("alert").filter({ hasText: /greater than 0/ }).isVisible());
  await btn(page, "Reset").click();
  await page.locator("#rd-tenure").fill("1.4");
  check("rd: fractional years rounded with note", await page.getByText(/rounded to 17 instalments/).isVisible());
  await page.close();
}

/* ---------------- 48 Lumpsum ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/lumpsum-calculator/");
  check("ls: ₹1L, 12%, 10y", (await tid(page, "ls-value")) === "₹3,10,585" && (await tid(page, "ls-gain")) === "₹2,10,585" && (await tid(page, "ls-total")) === "210.58%");
  await page.getByRole("switch", { name: /Adjust for inflation/ }).check({ force: true });
  await page.locator("#ls-inflation").fill("6");
  check("ls: inflation-adjusted", (await tid(page, "ls-real")) === "₹1,73,429");
  await page.getByRole("switch", { name: /Adjust for inflation/ }).uncheck({ force: true });
  await page.getByRole("switch", { name: /Compare two scenarios/ }).check({ force: true });
  await page.locator("#lsb-rate").fill("8");
  const cmp = await page.getByTestId("ls-compare").innerText();
  check("ls: scenario comparison", cmp.includes("₹2,15,892") && cmp.includes("−₹94,692") && (await tid(page, "ls-diff-pct")) === "B is 30.49% lower than A", `${await tid(page, "ls-diff-pct")}`);
  await radio(page, "Monthly").click();
  await page.locator("#ls-amount").fill("500000");
  await page.locator("#ls-rate").fill("10");
  await page.locator("#ls-years").fill("7.5");
  check("ls: monthly compounding, fractional years", (await tid(page, "ls-value")) === "₹10,55,216");
  check("ls: year table has a part-year row", (await page.getByTestId("ls-table").innerText()).includes("(part)"));
  await page.locator("#ls-rate").fill("-5");
  check("ls: negative return", (await tid(page, "ls-gain")).includes("-") || (await tid(page, "ls-gain")).includes("−"));
  await page.locator("#ls-rate").fill("0");
  check("ls: zero return", (await tid(page, "ls-gain")) === "₹0");
  const csv = await download(page, () => btn(page, "CSV").click());
  check("ls: CSV", csv.name === "lumpsum-projection.csv" && csv.text.trim().split("\n").length === 10);
  await page.locator("#ls-amount").fill("0");
  check("ls: invalid amount", await page.getByRole("alert").filter({ hasText: /greater than 0/ }).isVisible());
  await page.close();
}

/* ---------------- 49 ROI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/roi-calculator/");
  check("roi: ₹2L → ₹2.7L = 35%", (await tid(page, "roi-value")) === "35.00%" && (await tid(page, "roi-status")) === "Profit" && (await tid(page, "roi-gain")) === "₹70,000.00");
  await page.locator("#roi-years").fill("3");
  check("roi: annualised over 3 years", (await tid(page, "roi-annualised")) === "10.52%");
  await page.getByRole("switch", { name: /No money added or taken out/ }).uncheck({ force: true });
  check("roi: annualised withheld, XIRR explained", (await page.getByTestId("roi-annualised").count()) === 0 && (await tid(page, "roi-annual-note")).includes("XIRR"));
  await page.getByRole("switch", { name: /No money added or taken out/ }).check({ force: true });
  await page.locator("#roi-expenses").fill("50000");
  check("roi: additional expenses", (await tid(page, "roi-cost")) === "₹2,50,000.00" && (await tid(page, "roi-value")) === "8.00%");
  await page.locator("#roi-expenses").fill("");
  await page.locator("#roi-value").fill("150000");
  check("roi: loss labelled in text", (await tid(page, "roi-value")) === "−25.00%" && (await tid(page, "roi-status")) === "Loss");
  await page.locator("#roi-value").fill("200000");
  check("roi: break-even", (await tid(page, "roi-value")) === "0.00%" && (await tid(page, "roi-status")) === "Break-even");
  await radio(page, /^Net profit/).click();
  await page.locator("#roi-value").fill("50000");
  check("roi: net-profit entry", (await tid(page, "roi-value")) === "25.00%" && (await page.locator("#roi-expenses").count()) === 0);
  await page.locator("#roi-cost").fill("0");
  check("roi: zero cost rejected", await page.getByRole("alert").filter({ hasText: /greater than 0/ }).isVisible());
  await btn(page, "Marketing campaign").click();
  check("roi: example selector", (await tid(page, "roi-value")) === "133.33%" && (await tid(page, "roi-example-note")).includes("Illustrative numbers"));
  await btn(page, "Compare another").click();
  await page.locator("#roi-cost").fill("640000");
  await page.locator("#roi-value").fill("910000");
  await page.locator("#roi-years").fill("3");
  const tbl = await page.getByTestId("roi-compare").innerText();
  check("roi: comparison of two projects with highest marked", tbl.includes("133.33%") && tbl.includes("42.19%") && tbl.includes("12.45%") && tbl.includes("Highest ROI"), tbl.replace(/\s+/g, " "));
  const pr = await printed(page, () => btn(page, "Print").click());
  check("roi: print summary", pr.includes("Return on investment") && pr.includes("42.19%"));
  await btn(page, "Copy result").click();
  check("roi: copy", (await clip(page)).includes("ROI: 42.19%"));
  await page.close();
}

/* ---------------- 50 CAGR ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/cagr-calculator/");
  check("cagr: ₹1L → ₹2.5L in 5y", (await tid(page, "cagr-main")) === "20.11%" && (await tid(page, "cagr-total")) === "150.00%" && (await tid(page, "cagr-gain")) === "₹1,50,000.00");
  await btn(page, "Example: ₹5 lakh → ₹11.5 lakh in 6 y 6 m").click();
  check("cagr: years + months example", (await tid(page, "cagr-main")) === "13.67%");
  await page.locator("#cagr-end").fill("400000");
  check("cagr: negative CAGR", (await tid(page, "cagr-main")).startsWith("−") && (await tid(page, "cagr-gain")).includes("1,00,000"));
  await page.locator("#cagr-end").fill("500000");
  check("cagr: zero CAGR", (await tid(page, "cagr-main")) === "0.00%");
  await radio(page, "End value").click();
  await page.locator("#cagr-start").fill("100000");
  await page.locator("#cagr-rate").fill("12");
  await page.locator("#cagr-years").fill("7");
  await page.locator("#cagr-months").fill("6");
  check("cagr: ending value", (await tid(page, "cagr-main")) === "₹2,33,956.53");
  await radio(page, "Start value").click();
  await page.locator("#cagr-end").fill("1000000");
  await page.locator("#cagr-rate").fill("9");
  await page.locator("#cagr-years").fill("10");
  await page.locator("#cagr-months").fill("");
  check("cagr: starting value", (await tid(page, "cagr-main")) === "₹4,22,410.81");
  check("cagr: projection table", (await page.getByTestId("cagr-table").locator("tbody tr").count()) === 11);
  const csv = await download(page, () => btn(page, "CSV").click());
  check("cagr: CSV", csv.name === "cagr-projection.csv" && csv.text.includes("10,1000000.00"));
  await radio(page, "CAGR").click();
  await page.locator("#cagr-start").fill("0");
  check("cagr: zero start rejected", await page.getByRole("alert").filter({ hasText: /greater than 0/ }).isVisible());
  await page.locator("#cagr-start").fill("100");
  await page.locator("#cagr-years").fill("0");
  check("cagr: zero duration rejected", await page.getByRole("alert").filter({ hasText: /longer than 0/ }).isVisible());
  await page.close();
}

/* ---------------- Pages, SEO, links, mobile ---------------- */
{
  const page = await ctx.newPage();
  const titles: Record<string, string> = {
    "fd-calculator": "FD Calculator – Fixed Deposit Interest &amp; Maturity Calculator",
    "rd-calculator": "RD Calculator – Recurring Deposit Maturity &amp; Interest Calculator",
    "lumpsum-calculator": "Lumpsum Calculator – One-Time Investment Return Calculator",
    "roi-calculator": "ROI Calculator – Return on Investment Calculator Online",
    "cagr-calculator": "CAGR Calculator – Compound Annual Growth Rate Online",
  };
  const descs = new Set<string>();
  for (const [slug, title] of Object.entries(titles)) {
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
      (h.match(/<h1/g) ?? []).length === 1 &&
      new URL(/<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] ?? "x:").pathname === `/${slug}/` &&
      h.includes('property="og:title"') &&
      !/name="robots" content="[^"]*noindex/.test(h) &&
      ldOk &&
      ["BreadcrumbList", "WebApplication", "FAQPage", "HowTo"].every((t) => types.includes(t)) &&
      !/aggregateRating|ratingValue/i.test(h) &&
      ["What each input means", "How to read the result", "Assumptions and limitations", "Worked examples", "How it&#x27;s calculated"].every((s) => h.includes(s));
    check(`page: /${slug}/ (SEO + guide + formula + examples)`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: unique descriptions", descs.size === 5);
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const full = await (await fetch(`${BASE}/llms-full.txt`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const slugs = Object.keys(titles);
  check("sitemap + llms: all 5", slugs.every((s) => sm.includes(`/${s}/</loc>`) && llms.includes(`/${s}/)`) && full.includes(`/${s}/`)) && full.includes("Assumptions and limitations:") && llms.includes("/tip-calculator/)"));
  const links: [string, string][] = [["fd-calculator", "rd-calculator"], ["rd-calculator", "fd-calculator"], ["fd-calculator", "compound-interest-calculator"], ["compound-interest-calculator", "fd-calculator"], ["rd-calculator", "sip-calculator"], ["sip-calculator", "rd-calculator"], ["lumpsum-calculator", "sip-calculator"], ["sip-calculator", "lumpsum-calculator"], ["lumpsum-calculator", "compound-interest-calculator"], ["compound-interest-calculator", "lumpsum-calculator"], ["roi-calculator", "cagr-calculator"], ["cagr-calculator", "roi-calculator"], ["cagr-calculator", "lumpsum-calculator"], ["lumpsum-calculator", "cagr-calculator"], ["cagr-calculator", "sip-calculator"], ["sip-calculator", "cagr-calculator"]];
  const bad: string[] = [];
  for (const [a, b] of links) if (!(await (await fetch(`${BASE}/${a}/`)).text()).includes(`href="/${b}/"`)) bad.push(`${a}→${b}`);
  check("internal links as specified", bad.length === 0, bad.join(", "));
  await open(page, "/all-tools/");
  check("directory: ROI also listed under Business", (await page.locator('section[id="business"] a[href="/roi-calculator/"]').count()) > 0);
  const dir = await page.content();
  check("directory: all 5 linked", slugs.every((s) => dir.includes(`href="/${s}/"`)));
  await open(page, "/");
  await page.getByPlaceholder("What would you like to do today?").fill("fd");
  const first = async (q: string) => {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    await page.getByRole("option").first().waitFor();
    await page.waitForTimeout(150);
    return (await page.getByRole("option").first().innerText()).split("\n")[0];
  };
  const s = [await first("fixed deposit"), await first("recurring deposit"), await first("lumpsum"), await first("return on investment"), await first("cagr")];
  check("search finds each first", s[0].includes("FD") && s[1].includes("RD") && s[2].includes("Lumpsum") && s[3].includes("ROI") && s[4].includes("CAGR"), s.join(" | "));
  await page.setViewportSize({ width: 360, height: 780 });
  for (const sl of slugs) {
    await open(page, `/${sl}/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile 360px: /${sl}/ no horizontal overflow`, overflow <= 0, String(overflow));
  }
  await open(page, "/roi-calculator/");
  await btn(page, "Compare another").click();
  await btn(page, "Compare another").click();
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile: ROI with 3 projects fits", ov <= 0, String(ov));
  await page.close();
}

check("privacy: no requests to other origins", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
