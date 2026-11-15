// End-to-end tests for calculators 56–65: Indian salary, tax and payroll tools.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-17.mts
// Expected figures match the independent Python fixtures behind tests/tools-16.test.mts.
import { chromium, type Page } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3100";
const ORIGIN = new URL(BASE).origin;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 1000 }, permissions: ["clipboard-read", "clipboard-write"] });
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
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const radio = (page: Page, name: string | RegExp) => page.getByRole("radio", { name, exact: typeof name === "string" });
const sw = (page: Page, name: RegExp) => page.getByRole("switch", { name });
const tid = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ").trim();
const fill = (page: Page, id: string, v: string) => page.locator(`#${id}`).fill(v);
const alert = (page: Page) => page.getByRole("alert").first().innerText();

/* ---------------- 56 Income tax ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/income-tax-calculator/");
  check("tax: default ₹15L — new ₹97,500 vs old ₹2,02,020", (await tid(page, "it-new")) === "₹97,500" && (await tid(page, "it-old")) === "₹2,02,020", `${await tid(page, "it-new")} / ${await tid(page, "it-old")}`);
  check("tax: verdict names the cheaper regime", (await tid(page, "it-verdict")).includes("new regime saves ₹1,04,520"));
  for (const id of ["it-80c", "it-80d", "it-pt"]) await fill(page, id, "");
  await fill(page, "it-salary", "1300000");
  check("tax: ₹13L new → ₹26,000 (rebate marginal relief)", (await tid(page, "it-new")) === "₹26,000");
  check("tax: working shows marginal relief and ₹12,25,000", (await tid(page, "it-steps")).includes("marginal relief on rebate") && (await tid(page, "it-steps")).includes("₹12,25,000"));
  await fill(page, "it-salary", "1275000");
  check("tax: ₹12.75L new → nil", (await tid(page, "it-new")) === "₹0");
  await fill(page, "it-salary", "1050000");
  check("tax: ₹10.5L old → ₹1,17,000", (await tid(page, "it-old")) === "₹1,17,000");
  await page.locator("#it-age").selectOption("80plus");
  await fill(page, "it-salary", "650000");
  check("tax: 80+ old, TI ₹6L → ₹20,800", (await tid(page, "it-old")) === "₹20,800");
  await page.locator("#it-age").selectOption("below60");
  await fill(page, "it-salary", "5085000");
  check("tax: ₹50.10L TI → surcharge marginal relief → ₹11,33,600", (await tid(page, "it-new")) === "₹11,33,600");
  await radio(page, /^FY 2025-26/).click();
  check("tax: FY 2025-26 same slabs", (await tid(page, "it-new")) === "₹11,33,600" && (await page.getByTestId("rules-panel").innerText()).includes("Verified"));
  await radio(page, /^2026-27/).click();
  check("tax: 2026-27 rules flag unconfirmed items", (await page.getByTestId("rules-panel").innerText()).includes("Not yet confirmed"));
  await fill(page, "it-salary", "12abc");
  check("tax: invalid input → error", (await alert(page)).includes("must be a number"));
  await fill(page, "it-salary", "1500000");
  await page.getByText("Employer NPS (both regimes)").click();
  await fill(page, "it-enps", "50000");
  check("tax: employer NPS needs basic", (await alert(page)).includes("basic + DA"));
  await fill(page, "it-basic", "600000");
  check("tax: employer NPS deducted", (await tid(page, "it-steps")).includes("Employer NPS"));
  await page.getByRole("button", { name: "Copy result" }).click();
  check("tax: copy result", (await clip(page)).includes("Tax — new regime"));
  await page.close();
}

/* ---------------- 57 Take-home ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/take-home-salary-calculator/");
  check("take-home: ₹12L CTC → ₹93,796 a month", (await tid(page, "th-monthly")) === "₹93,796", await tid(page, "th-monthly"));
  check("take-home: tax nil, PF ₹21,600", (await tid(page, "th-tax")) === "₹0" && (await tid(page, "th-pf")) === "₹21,600");
  const lines = await tid(page, "th-lines");
  check("take-home: each amount once (CTC line = ₹12,00,000)", lines.includes("CTC ₹12,00,000") && (lines.match(/Employee PF/g) ?? []).length === 1 && (lines.match(/Employer PF/g) ?? []).length === 1);
  await fill(page, "th-ctc2", "1800000");
  check("take-home: compare offers → ₹1,31,152", (await tid(page, "th-offer2")).startsWith("₹1,31,152"), await tid(page, "th-offer2"));
  await fill(page, "th-basicpct", "100");
  check("take-home: impossible structure → error", (await alert(page)).includes("more than the CTC"));
  await fill(page, "th-basicpct", "50");
  await radio(page, /^From salary components/).click();
  await fill(page, "th-basic", "120000");
  await fill(page, "th-hra", "48000");
  await fill(page, "th-special", "36000");
  await fill(page, "th-pt", "0");
  check("take-home: ₹17k/month gross → ESI ₹1,536 a year", (await tid(page, "th-esi")) === "₹1,536");
  await fill(page, "th-basic", "600000");
  await fill(page, "th-hra", "300000");
  await fill(page, "th-special", "250000");
  await fill(page, "th-pt", "2400");
  check("take-home: components ₹11.5L → ₹93,833 a month", (await tid(page, "th-monthly")) === "₹93,833");
  await radio(page, "Old").click();
  await fill(page, "th-rent", "20000");
  check("take-home: old regime uses HRA + PF in 80C", (await tid(page, "th-lines")).includes("old regime"));
  await page.close();
}

/* ---------------- 58 HRA ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/hra-calculator/");
  check("hra: Bengaluru, rent ₹20k → ₹1,80,000", (await tid(page, "hra-exempt")) === "₹1,80,000" && (await tid(page, "hra-taxable")) === "₹1,20,000");
  await fill(page, "hra-rent", "30000");
  check("hra: 2026-27 Bengaluru 50% → ₹3,00,000", (await tid(page, "hra-exempt")) === "₹3,00,000");
  await radio(page, /^FY 2025-26/).click();
  check("hra: 2025-26 Bengaluru 40% → ₹2,40,000", (await tid(page, "hra-exempt")) === "₹2,40,000");
  await sw(page, /Rent or city changed/).click({ force: true });
  check("hra: month-wise default (₹20k, 2025-26) → ₹1,80,000", (await tid(page, "hra-exempt")) === "₹1,80,000");
  await page.getByLabel("Rent for Apr").fill("0");
  check("hra: no rent in April → ₹1,65,000", (await tid(page, "hra-exempt")) === "₹1,65,000" && (await page.getByTestId("hra-months").locator("tbody tr").count()) === 12);
  await page.getByLabel("Rent for Apr").fill("-5");
  check("hra: negative rent → error", (await alert(page)).includes("Rent for Apr"));
  check("hra: new-regime warning shown", await page.getByText("available only in the", { exact: false }).isVisible());
  await page.close();
}

/* ---------------- 59 TDS ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/tds-calculator/");
  check("tds: ₹75k professional → ₹7,500, sec 393", (await tid(page, "tds-amount")) === "₹7,500" && (await tid(page, "tds-status")).includes("393(1) Table, sl. 6(iii)"));
  await sw(page, /valid PAN/).click({ force: true });
  check("tds: no PAN → 20% → ₹15,000", (await tid(page, "tds-amount")) === "₹15,000" && (await tid(page, "tds-status")).includes("397(2)"));
  await sw(page, /valid PAN/).click({ force: true });
  await radio(page, /^FY 2025-26/).click();
  check("tds: FY 2025-26 → section 194J", (await tid(page, "tds-status")).includes("194J"));
  await page.locator("#tds-cat").selectOption("contractorIndividual");
  await fill(page, "tds-amount", "25000");
  await fill(page, "tds-sofar", "80000");
  check("tds: contractor crosses ₹1L → ₹1,050 on ₹1,05,000", (await tid(page, "tds-amount")) === "₹1,050" && (await tid(page, "tds-base")) === "₹1,05,000");
  await page.locator("#tds-cat").selectOption("rentIndividual");
  await fill(page, "tds-amount", "45000");
  check("tds: rent ₹45k/month → no TDS", (await tid(page, "tds-amount")) === "₹0" && (await tid(page, "tds-status")).startsWith("No TDS"));
  await fill(page, "tds-amount", "60000");
  check("tds: rent ₹60k/month → ₹1,200", (await tid(page, "tds-amount")) === "₹1,200");
  await page.close();
}

/* ---------------- 60 EPF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/epf-calculator/");
  check("epf: default → ₹2,20,75,690", (await tid(page, "epf-corpus")) === "₹2,20,75,690", await tid(page, "epf-corpus"));
  check("epf: monthly split 4,800 / 3,550 / 1,250", (await tid(page, "epf-m-employee")) === "₹4,800" && (await tid(page, "epf-m-epf")) === "₹3,550" && (await tid(page, "epf-m-eps")) === "₹1,250");
  check("epf: 30-row table", (await page.getByTestId("epf-table").locator("tbody tr").count()) === 30);
  await page.locator("#epf-basis").selectOption("ceiling");
  check("epf: ceiling → ₹1,800 / ₹550", (await tid(page, "epf-m-employee")) === "₹1,800" && (await tid(page, "epf-m-epf")) === "₹550");
  await sw(page, /pension scheme/).click({ force: true });
  check("epf: non-EPS member → EPS ₹0", (await tid(page, "epf-m-eps")) === "₹0" && (await tid(page, "epf-m-epf")) === "₹1,800");
  await fill(page, "epf-ret", "20");
  check("epf: retirement before age → error", (await alert(page)).includes("after your current age") || (await alert(page)).includes("can't be less"));
  await page.close();
}

/* ---------------- 61 ESI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/esi-calculator/");
  check("esi: ₹18,000 → ₹135 / ₹585", (await tid(page, "esi-employee")) === "₹135" && (await tid(page, "esi-employer")) === "₹585");
  await fill(page, "esi-wages", "21000");
  check("esi: ₹21,000 → rounded up ₹158 / ₹683", (await tid(page, "esi-employee")) === "₹158" && (await tid(page, "esi-employer")) === "₹683");
  await fill(page, "esi-wages", "22000");
  check("esi: ₹22,000 → not covered", (await tid(page, "esi-employee")) === "₹0" && (await tid(page, "esi-status")).includes("Not covered"));
  await sw(page, /changed during this contribution period/).click({ force: true });
  await fill(page, "esi-start", "20000");
  check("esi: raise mid-period → still ₹165", (await tid(page, "esi-employee")) === "₹165");
  await sw(page, /changed during this contribution period/).click({ force: true });
  await sw(page, /disability/).click({ force: true });
  check("esi: disability ceiling ₹25,000 → covered", (await tid(page, "esi-employee")) === "₹165");
  check("esi: ceiling marked not yet confirmed", (await page.getByTestId("rules-panel").innerText()).includes("Not yet confirmed"));
  await page.close();
}

/* ---------------- 62 Gratuity ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/gratuity-calculator/");
  check("gratuity: ₹50k, 7y 8m → 8 years → ₹2,30,769", (await tid(page, "gr-amount")) === "₹2,30,769" && (await tid(page, "gr-years")).includes("8 years counted"));
  await fill(page, "gr-years", "4");
  await fill(page, "gr-months", "7");
  check("gratuity: 4y 7m → not eligible", (await tid(page, "gr-amount")) === "₹0" && (await tid(page, "gr-reason")).includes("five years"));
  await page.locator("#gr-event").selectOption("death");
  check("gratuity: on death → ₹1,44,231", (await tid(page, "gr-amount")) === "₹1,44,231");
  await page.locator("#gr-event").selectOption("separation");
  await page.locator("#gr-cat").selectOption("fixedTerm");
  await fill(page, "gr-years", "2");
  await fill(page, "gr-months", "6");
  check("gratuity: fixed-term 2y 6m → ₹72,115", (await tid(page, "gr-amount")) === "₹72,115");
  await page.locator("#gr-cat").selectOption("permanent");
  await fill(page, "gr-years", "10");
  await fill(page, "gr-months", "7");
  await fill(page, "gr-wages", "40000");
  await sw(page, /50% wage rule/).click({ force: true });
  await fill(page, "gr-total", "100000");
  check("gratuity: 50% rule → wages ₹50,000 → ₹3,17,308", (await tid(page, "gr-amount")) === "₹3,17,308");
  await fill(page, "gr-paid", "400000");
  check("gratuity: excess over statutory taxable", (await tid(page, "gr-taxable")) === "₹82,692");
  await radio(page, "Joining and leaving dates").click();
  await page.locator("#gr-from").fill("2016-01-10");
  await page.locator("#gr-to").fill("2026-08-09");
  check("gratuity: from dates → 10y 6m → 10 years", (await tid(page, "gr-years")).startsWith("10y 6m") && (await tid(page, "gr-years")).includes("10 years counted"));
  await page.close();
}

/* ---------------- 63 NPS ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/nps-calculator/");
  check("nps: default → ₹1,40,64,150", (await tid(page, "nps-corpus")) === "₹1,40,64,150", await tid(page, "nps-corpus"));
  check("nps: 20% annuity → pension ₹14,064", (await tid(page, "nps-pension")) === "₹14,064");
  await fill(page, "nps-apct", "0");
  check("nps: annuity raised to 20% minimum", (await tid(page, "nps-annuity")) === "₹28,12,830");
  await radio(page, /^Government/).click();
  check("nps: government minimum 40%", (await tid(page, "nps-annuity")) === "₹56,25,660");
  await radio(page, /^Before 60/).click();
  await fill(page, "nps-exit", "45");
  check("nps: premature exit → 80% annuity", (await page.getByText("Annuity raised to the 80% minimum").count()) === 1);
  await fill(page, "nps-exit", "86");
  check("nps: exit age above 85 → error", (await alert(page)).includes("85"));
  await page.close();
}

/* ---------------- 64 Salary hike ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/salary-hike-calculator/");
  check("hike: ₹10L → ₹11.5L = 15%", (await tid(page, "hike-main")) === "15%" && (await tid(page, "hike-month")) === "₹12,500");
  await fill(page, "hike-infl", "6");
  check("hike: real hike at 6% = 8.49%", (await tid(page, "hike-real")) === "8.49%");
  await radio(page, /^Salary and hike %/).click();
  check("hike: 10% → ₹11,00,000", (await tid(page, "hike-main")) === "₹11,00,000");
  await fill(page, "hike-current", "0");
  check("hike: zero salary → error", (await alert(page)).includes("more than zero"));
  await page.close();
}

/* ---------------- 65 Leave encashment ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/leave-encashment-calculator/");
  check("leave: 120 days → ₹2,40,000, all tax-free", (await tid(page, "le-gross")) === "₹2,40,000" && (await tid(page, "le-exempt")) === "₹2,40,000" && (await tid(page, "le-taxable")) === "₹0");
  await radio(page, "26 working days").click();
  check("leave: 26-day divisor → ₹2,76,923", (await tid(page, "le-gross")) === "₹2,76,923");
  await page.locator("#le-event").selectOption("service");
  check("leave: in service → fully taxable", (await tid(page, "le-taxable")) === "₹2,76,923");
  await page.locator("#le-event").selectOption("separation");
  await fill(page, "le-earned", "45");
  await fill(page, "le-days", "300");
  await radio(page, "30 days").click();
  check("leave: credit capped at 30 days/year → exempt ₹3,20,000", (await tid(page, "le-exempt")) === "₹3,20,000");
  await page.close();
}

/* ---------------- Pages, SEO, categories, links, mobile ---------------- */
{
  const page = await ctx.newPage();
  const titles: Record<string, string> = {
    "income-tax-calculator": "Income Tax Calculator 2026-27 – New vs Old Regime (India)",
    "take-home-salary-calculator": "Take-Home Salary Calculator – CTC to In-Hand Salary (India 2026-27)",
    "hra-calculator": "HRA Calculator 2026-27 – House Rent Allowance Exemption",
    "tds-calculator": "TDS Calculator 2026-27 – TDS on Rent, Professional Fees, Interest &amp; Contracts",
    "epf-calculator": "EPF Calculator – Provident Fund Balance &amp; Maturity (8.25% Interest)",
    "esi-calculator": "ESI Calculator – Employee &amp; Employer ESI Contribution (0.75% / 3.25%)",
    "gratuity-calculator": "Gratuity Calculator 2026 – Gratuity Formula under the New Labour Code",
    "nps-calculator": "NPS Calculator – National Pension System Corpus, Lump Sum &amp; Pension",
    "salary-hike-calculator": "Salary Hike Calculator – Hike Percentage &amp; New Salary",
    "leave-encashment-calculator": "Leave Encashment Calculator – Amount &amp; Tax Exemption (₹25 Lakh Limit)",
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
      ["What each input means", "How to read the result", "Common mistakes", "Assumptions and limitations", "Worked examples"].every((s) => h.includes(s));
    check(`page: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: unique descriptions", descs.size === 10);
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const full = await (await fetch(`${BASE}/llms-full.txt`)).text();
  const slugs = Object.keys(titles);
  check("sitemap + llms: all 10", slugs.every((s) => sm.includes(`/${s}/</loc>`) && llms.includes(`/${s}/)`) && full.includes(`/${s}/`)));
  await open(page, "/all-tools/");
  const dir = await page.locator("main").innerText();
  check("categories: Salary, Income Tax, Payroll, Employee Benefits listed", ["Salary Calculators", "Income Tax Calculators", "Payroll Calculators", "Employee Benefits"].every((c) => dir.includes(c)));
  const links: [string, string[]][] = [
    ["income-tax-calculator", ["take-home-salary-calculator", "hra-calculator", "tds-calculator"]],
    ["take-home-salary-calculator", ["income-tax-calculator", "epf-calculator", "gratuity-calculator"]],
    ["hra-calculator", ["income-tax-calculator", "take-home-salary-calculator"]],
    ["epf-calculator", ["nps-calculator", "gratuity-calculator", "ppf-calculator"]],
    ["gratuity-calculator", ["leave-encashment-calculator", "epf-calculator"]],
    ["nps-calculator", ["epf-calculator", "retirement-calculator"]],
    ["retirement-calculator", ["epf-calculator", "nps-calculator"]],
  ];
  const bad: string[] = [];
  for (const [a, bs] of links) {
    const h = await (await fetch(`${BASE}/${a}/`)).text();
    for (const b of bs) if (!h.includes(`href="/${b}/"`)) bad.push(`${a}→${b}`);
  }
  check("internal links", bad.length === 0, bad.join(", "));
  await open(page, "/");
  const first = async (q: string) => {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    await page.getByRole("option").first().waitFor();
    await page.waitForTimeout(150);
    return (await page.getByRole("option").first().innerText()).split("\n")[0];
  };
  const qs: [string, string][] = [["income tax", "Income Tax"], ["in hand salary", "Take-Home"], ["hra", "HRA"], ["tds", "TDS"], ["epf", "EPF"], ["esi", "ESI"], ["gratuity", "Gratuity"], ["nps", "NPS"], ["salary hike", "Salary Hike"], ["leave encashment", "Leave Encashment"]];
  const got: string[] = [];
  for (const [q] of qs) got.push(await first(q));
  check("search finds each first", qs.every(([, w], i) => got[i].includes(w)), got.join(" | "));
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
