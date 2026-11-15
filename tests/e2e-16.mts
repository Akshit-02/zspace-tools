// End-to-end tests for calculators 51–55: XIRR, SWP, PPF, Inflation, Retirement.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-16.mts
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

/* ---------------- 51 XIRR ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/xirr-calculator/");
  check("xirr: sample with top-ups and a redemption", (await tid(page, "xirr-value")) === "11.02%" && (await tid(page, "xirr-invested")) === "₹1,00,000.00" && (await tid(page, "xirr-withdrawn")) === "₹1,57,500.00");
  await btn(page, "Paste from spreadsheet").click();
  await page.locator("#xirr-paste").fill("Date\tAmount\n01/01/2008\t-10000\n01/03/2008\t2750\n30/10/2008\t4250\n15/02/2009\t3250\n01/04/2009\t2750");
  await btn(page, "Import rows").click();
  check("xirr: pasted Excel example = 37.34%", (await tid(page, "xirr-value")) === "37.34%" && (await tid(page, "xirr-paste-msg")).includes("Imported 5 transactions"));
  check("xirr: transaction summary table", (await page.getByTestId("xirr-table").locator("tbody tr").count()) === 5);
  await page.locator("#xirr-bench").fill("10");
  check("xirr: benchmark comparison", (await tid(page, "xirr-bench-result")).includes("27.34% points above 10%"));
  await page.getByLabel("Row 2 date").fill("");
  check("xirr: invalid row flagged", await page.getByRole("alert").filter({ hasText: "Row 2: enter a valid date" }).isVisible());
  await page.getByLabel("Row 2 date").fill("2008-03-01");
  for (let i = 0; i < 4; i++) await btn(page, "Remove row 2").click();
  check("xirr: missing withdrawal explained", await page.getByRole("alert").filter({ hasText: /at least one withdrawal/ }).isVisible());
  await btn(page, "Add transaction").click();
  await page.getByLabel("Row 2 date").fill("2009-01-01");
  await page.getByLabel("Row 2 type").selectOption("withdraw");
  await page.getByLabel("Row 2 amount").fill("9000");
  check("xirr: negative XIRR", (await tid(page, "xirr-value")).startsWith("−") && (await tid(page, "xirr-net")).includes("1,000"));
  const csv = await download(page, () => btn(page, "CSV").click());
  check("xirr: CSV export", csv.name === "xirr-transactions.csv" && csv.text.includes("2008-01-01,Invested,-10000.00"));
  await btn(page, "Clear all").click();
  check("xirr: clear all", (await page.getByTestId("xirr-rows").locator("li").count()) === 2);
  await page.setViewportSize({ width: 375, height: 800 });
  await btn(page, "Sample").click();
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("xirr: mobile card rows fit", ov <= 0, String(ov));
  await page.close();
}

/* ---------------- 52 SWP ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/swp-calculator/");
  check("swp: ₹50L, ₹30k/month, 8% — survives with ₹77.8L left", (await tid(page, "swp-main")) === "₹77,84,887" && (await tid(page, "swp-status")).includes("Not exhausted"));
  await page.locator("#swp-stepup").fill("6");
  check("swp: 6% yearly increase — runs out after 16 y 7 m", (await tid(page, "swp-main")) === "16 years 7 months" && (await tid(page, "swp-remaining")) === "₹0");
  await page.locator("#swp-stepup").fill("");
  await page.locator("#swp-withdrawal").fill("40000");
  check("swp: ₹40k/month — runs out after 20 y 11 m", (await tid(page, "swp-main")) === "20 years 11 months");
  check("swp: three scenarios", (await page.getByTestId("swp-scenarios").locator("tbody tr").count()) === 3);
  await page.getByRole("switch", { name: /Use an inflation assumption/ }).check({ force: true });
  await page.locator("#swp-inflation").fill("6");
  await page.getByRole("switch", { name: /Raise withdrawals with inflation/ }).check({ force: true });
  check("swp: inflation-linked withdrawals", (await page.locator("#swp-stepup").count()) === 0 && (await tid(page, "swp-main")).includes("years"));
  await page.getByRole("switch", { name: /Use an inflation assumption/ }).uncheck({ force: true });
  await page.locator("#swp-corpus").fill("1000000");
  await page.locator("#swp-withdrawal").fill("10000");
  await radio(page, "End of each month").click();
  await page.locator("#swp-years").fill("10");
  check("swp: ₹10L, ₹10k, end of month, 10y", (await tid(page, "swp-remaining")) === "₹3,57,682");
  await radio(page, "Quarter").click();
  await page.locator("#swp-withdrawal").fill("30000");
  check("swp: quarterly", (await tid(page, "swp-remaining")) === "₹3,69,222");
  const csv = await download(page, () => btn(page, "CSV").click());
  check("swp: CSV schedule", csv.name === "swp-schedule.csv" && csv.text.trim().split("\n").length === 42);
  await page.locator("#swp-return").fill("-60");
  check("swp: invalid return", await page.getByRole("alert").filter({ hasText: /between -50% and 50%/ }).isVisible());
  await page.close();
}

/* ---------------- 53 PPF ---------------- */
{
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-11-15T10:00:00+05:30"));
  await open(page, "/ppf-calculator/");
  await page.locator("#ppf-om").selectOption("4");
  await page.locator("#ppf-oy").fill("2026");
  check("ppf: opened Apr 2026 — matures 1 April 2042 at ₹45,17,702", (await tid(page, "ppf-maturity")) === "₹45,17,702" && (await tid(page, "ppf-date")).includes("1 April 2042") && (await tid(page, "ppf-deposits")) === "₹24,00,000");
  check("ppf: financial-year table (16 FYs)", (await page.getByTestId("ppf-table").locator("tbody tr").count()) === 16 && (await page.getByTestId("ppf-table").innerText()).includes("2041-42"));
  check("ppf: extension scenarios", (await tid(page, "ppf-extension")).includes("₹72,91,677") && (await tid(page, "ppf-extension")).includes("₹63,65,975"));
  await page.getByRole("switch", { name: /Deposit on or before the 5th/ }).uncheck({ force: true });
  check("ppf: depositing after the 5th earns less", (await tid(page, "ppf-maturity")) !== "₹45,17,702" && (await page.getByText(/Deposits after the 5th don/).isVisible()));
  await page.getByRole("switch", { name: /Deposit on or before the 5th/ }).check({ force: true });
  await page.locator("#ppf-amount").fill("150050");
  check("ppf: annual limit enforced", await page.getByRole("alert").filter({ hasText: /at most ₹1,50,000 per financial year/ }).isVisible());
  await radio(page, "Every month").click();
  await page.locator("#ppf-amount").fill("12525");
  check("ppf: multiples of ₹50", await page.getByRole("alert").filter({ hasText: /multiples of ₹50/ }).isVisible());
  await page.locator("#ppf-amount").fill("12500");
  check("ppf: monthly deposits", (await tid(page, "ppf-maturity")).startsWith("₹"));
  await radio(page, "Existing account").click();
  await page.locator("#ppf-ofy").selectOption("2018");
  await page.locator("#ppf-balance").fill("800000");
  check("ppf: existing account maturity", (await tid(page, "ppf-date")).includes("1 April 2034") && (await page.getByTestId("ppf-table").locator("tbody tr").count()) === 8);
  await radio(page, "+ with deposits").click();
  check("ppf: table includes extension years", (await page.getByTestId("ppf-table").innerText()).includes("extension"));
  const rules = await tid(page, "ppf-rules");
  check("ppf: rules, sources and last-verified date shown", rules.includes("lowest balance") && rules.includes("Last verified 15 November 2026") && (await page.getByTestId("ppf-rules").locator('a[href^="https://www.nsiindia.gov.in"]').count()) >= 2);
  const csv = await download(page, () => btn(page, "CSV").click());
  check("ppf: CSV", csv.name === "ppf-schedule.csv" && csv.text.includes("Financial year,Phase"));
  await page.close();
}

/* ---------------- 54 Inflation ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/inflation-calculator/");
  check("inf: ₹1L at 6% for 10 years", (await tid(page, "inf-main")) === "₹1,79,084.77" && (await tid(page, "inf-pct")) === "79.08%" && (await tid(page, "inf-power")) === "55.84%");
  await radio(page, "Today's value").click();
  check("inf: present value", (await tid(page, "inf-main")) === "₹55,839.48" && (await tid(page, "inf-lost")) === "44.16%");
  await radio(page, "Between years").click();
  check("inf: between years", (await page.getByTestId("inf-table").innerText()).includes("2016") && (await page.getByTestId("inf-table").innerText()).includes("2026"));
  await radio(page, "Future cost").click();
  await page.locator("#inf-years").fill("2.5");
  await page.locator("#inf-amount").fill("50000");
  await page.locator("#inf-rate").fill("7");
  check("inf: fractional years", (await tid(page, "inf-main")) === "₹59,214.69");
  check("inf: three scenarios", (await page.getByTestId("inf-scenarios").locator("tbody tr").count()) === 3);
  await page.locator("#inf-rate").fill("0");
  check("inf: zero inflation", (await tid(page, "inf-main")) === "₹50,000.00");
  await page.locator("#inf-rate").fill("-3");
  check("inf: deflation", (await tid(page, "inf-main")).startsWith("₹46"));
  await page.locator("#inf-rate").fill("-20");
  check("inf: invalid rate", await page.getByRole("alert").filter({ hasText: /between -10% and 100%/ }).isVisible());
  await page.close();
}

/* ---------------- 55 Retirement ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/retirement-calculator/");
  check("ret: default plan", (await tid(page, "ret-required")) === "₹7,48,06,969" && (await tid(page, "ret-projected")) === "₹5,85,06,142" && (await tid(page, "ret-extra")) === "₹4,912" && (await tid(page, "ret-expense")) === "₹2,87,175");
  check("ret: verdict in words, not colour alone", (await tid(page, "ret-verdict")).startsWith("Shortfall of ₹1,63,00,826"));
  check("ret: savings last", (await tid(page, "ret-lasts")) === "to about age 79");
  check("ret: steps + scenarios", (await page.getByTestId("ret-steps").locator("li").count()) === 4 && (await page.getByTestId("ret-scenarios").locator("tbody tr").count()) === 3);
  await page.getByLabel("Conservative return before retirement").fill("7");
  check("ret: editable scenario", (await page.getByTestId("ret-scenarios").innerText()).includes("−₹"));
  await page.locator("#ret-corpus").fill("10000000");
  await page.locator("#ret-monthlyContribution").fill("50000");
  check("ret: surplus", (await tid(page, "ret-verdict")).startsWith("On track — surplus") && (await page.getByTestId("ret-extra").count()) === 0);
  await page.locator("#ret-age").fill("15");
  check("ret: invalid age", await page.getByRole("alert").filter({ hasText: /current age/ }).isVisible());
  await btn(page, "Reset").click();
  await page.locator("#ret-postReturn").fill("4");
  check("ret: post-return below inflation noted", await page.getByText(/below inflation/).first().isVisible());
  await btn(page, "Copy result").click();
  check("ret: copy", (await clip(page)).includes("Required corpus at retirement"));
  await page.close();
}

/* ---------------- Pages, SEO, links, mobile ---------------- */
{
  const page = await ctx.newPage();
  const titles: Record<string, string> = {
    "xirr-calculator": "XIRR Calculator – Calculate Annualised Returns on Irregular Investments",
    "swp-calculator": "SWP Calculator – Systematic Withdrawal Plan &amp; Corpus Life Calculator",
    "ppf-calculator": "PPF Calculator – Public Provident Fund Maturity &amp; Interest Calculator",
    "inflation-calculator": "Inflation Calculator – Future Value of Money &amp; Purchasing Power",
    "retirement-calculator": "Retirement Calculator – How Much Do I Need to Retire? (Corpus Planner)",
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
      ldOk &&
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((t) => types.includes(t)) &&
      !/aggregateRating|ratingValue/i.test(h) &&
      ["What each input means", "How to read the result", "Common mistakes", "Assumptions and limitations", "Worked examples", "How it&#x27;s calculated"].every((s) => h.includes(s));
    check(`page: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: unique descriptions", descs.size === 5);
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const full = await (await fetch(`${BASE}/llms-full.txt`)).text();
  const slugs = Object.keys(titles);
  check("sitemap + llms: all 5", slugs.every((s) => sm.includes(`/${s}/</loc>`) && llms.includes(`/${s}/)`) && full.includes(`/${s}/`)) && full.includes("Common mistakes:"));
  const links: [string, string[]][] = [
    ["xirr-calculator", ["cagr-calculator", "roi-calculator", "sip-calculator", "lumpsum-calculator"]],
    ["swp-calculator", ["sip-calculator", "lumpsum-calculator", "retirement-calculator", "inflation-calculator"]],
    ["ppf-calculator", ["fd-calculator", "rd-calculator", "compound-interest-calculator", "retirement-calculator"]],
    ["inflation-calculator", ["retirement-calculator", "lumpsum-calculator", "compound-interest-calculator", "sip-calculator"]],
    ["retirement-calculator", ["swp-calculator", "inflation-calculator", "sip-calculator", "ppf-calculator", "fd-calculator"]],
  ];
  const bad: string[] = [];
  for (const [a, bs] of links) {
    const h = await (await fetch(`${BASE}/${a}/`)).text();
    for (const b of bs) if (!h.includes(`href="/${b}/"`)) bad.push(`${a}→${b}`);
  }
  check("internal links as specified", bad.length === 0, bad.join(", "));
  await open(page, "/");
  const first = async (q: string) => {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    await page.getByRole("option").first().waitFor();
    await page.waitForTimeout(150);
    return (await page.getByRole("option").first().innerText()).split("\n")[0];
  };
  const s = [await first("xirr"), await first("systematic withdrawal"), await first("ppf"), await first("inflation"), await first("retirement")];
  check("search finds each first", s[0].includes("XIRR") && s[1].includes("SWP") && s[2].includes("PPF") && s[3].includes("Inflation") && s[4].includes("Retirement"), s.join(" | "));
  await page.setViewportSize({ width: 360, height: 780 });
  for (const sl of slugs) {
    await open(page, `/${sl}/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile 360px: /${sl}/ no horizontal overflow`, overflow <= 0, String(overflow));
  }
  await page.close();
}

check("privacy: no requests to other origins", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
