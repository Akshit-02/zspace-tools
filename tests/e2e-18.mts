// End-to-end tests for calculators 66–75: loans, borrowing and property.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-18.mts
// Expected figures match the independent fixtures behind tests/tools-17.test.mts.
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
const radio = (page: Page, name: string | RegExp) => page.getByRole("radio", { name, exact: typeof name === "string" });
const sw = (page: Page, name: RegExp) => page.getByRole("switch", { name });
const tid = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ").trim();
const fill = (page: Page, id: string, v: string) => page.locator(`#${id}`).fill(v);
const alert = (page: Page) => page.getByRole("alert").first().innerText();

async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download"), trigger()]);
  return { name: dl.suggestedFilename(), text: readFileSync((await dl.path())!).toString("utf8") };
}
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/* ---------------- 66 Home loan eligibility ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/home-loan-eligibility-calculator/");
  check("elig: default → ₹46,09,200 limited by capacity", (await tid(page, "el-loan")) === "₹46,09,200" && (await tid(page, "el-binding")).includes("repayment capacity"), await tid(page, "el-loan"));
  check("elig: EMI room ₹40,000, EMI ₹40,000", (await tid(page, "el-room")) === "₹40,000" && (await tid(page, "el-emi")) === "₹40,000");
  await sw(page, /co-applicant/).click({ force: true });
  await fill(page, "el-coinc", "60000");
  check("elig: co-applicant → ₹64,00,000, LTV cap binds", (await tid(page, "el-loan")) === "₹64,00,000" && (await tid(page, "el-binding")).includes("loan-to-value") && (await tid(page, "el-ltv")) === "80%");
  check("elig: working table shown", (await tid(page, "el-steps")).includes("FOIR 50% (assumption)"));
  await fill(page, "el-age", "61");
  check("elig: past the end age → nil with reason", (await tid(page, "el-loan")) === "₹0" && (await tid(page, "el-binding")).includes("No tenure left"));
  await fill(page, "el-age", "32");
  await fill(page, "el-dp", "9000000");
  check("elig: down payment above value → error", (await alert(page)).includes("more than the property value"));
  check("elig: RBI rules panel with source", (await page.getByTestId("rules-panel").innerText()).includes("up to 90% of property value"));
  await page.close();
}

/* ---------------- 67 Prepayment ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/home-loan-prepayment-calculator/");
  check("prepay: ₹5L once → saves ₹13,03,916", (await tid(page, "pp-saved")) === "₹13,03,916", await tid(page, "pp-saved"));
  check("prepay: EMI ₹40,746, closes Mar 2041 (44 months sooner)", (await tid(page, "pp-emi")) === "₹40,746" && (await tid(page, "pp-close")).startsWith("Mar 2041") && (await tid(page, "pp-sub")).includes("3 years 8 months sooner"));
  await btn(page, "Compare another scenario").click();
  check("prepay: scenario B ₹10k monthly → saves ₹15,08,700", (await tid(page, "pp-compare")).includes("₹15,08,700") && (await page.getByTestId("pp-compare").locator("tbody tr").count()) === 3);
  const s0 = await tid(page, "pp-saved");
  await page.getByTestId("scenario-A").getByRole("radio", { name: "Before that EMI" }).click();
  check("prepay: before vs after the EMI differ", (await tid(page, "pp-saved")) !== s0);
  await page.getByTestId("scenario-A").getByRole("radio", { name: "Cut EMI" }).click();
  check("prepay: cut EMI → EMI falls, same end", (await tid(page, "pp-sub")).includes("EMI falls to") && (await tid(page, "pp-close")).startsWith("Nov 2044"));
  await fill(page, "pp-fee", "2");
  check("prepay: 2% charge shown", (await tid(page, "pp-fees")) === "₹10,000");
  const csv = await download(page, () => page.getByRole("button", { name: "CSV" }).click());
  check("prepay: CSV schedule", csv.name === "prepayment-schedule.csv" && csv.text.includes("Month,Opening balance,EMI") && csv.text.split("\n").length > 200);
  await fill(page, "pp-emi", "20000");
  check("prepay: EMI below interest → error", (await alert(page)).includes("doesn't cover the monthly interest"));
  await fill(page, "pp-emi", "");
  await page.locator("#pp-0-0-start").fill("999");
  check("prepay: bad prepayment month → error", (await alert(page)).includes("Scenario A"));
  await page.close();
}

/* ---------------- 68 Car loan ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/car-loan-calculator/");
  check("car: loan ₹8,05,000 → EMI ₹16,710", (await tid(page, "car-emi")) === "₹16,710" && (await tid(page, "car-loan-amt")) === "₹8,05,000");
  check("car: interest ₹1,97,628; upfront ₹2,55,900; total ₹12,58,528", (await tid(page, "car-interest")) === "₹1,97,628" && (await tid(page, "car-upfront")) === "₹2,55,900" && (await tid(page, "car-total")) === "₹12,58,528");
  check("car: schedule table", (await page.getByTestId("schedule-table").locator("tbody tr").count()) === 5);
  await radio(page, "Enter directly").click();
  check("car: direct ₹8L → ₹16,607", (await tid(page, "car-emi")) === "₹16,607");
  await radio(page, "From price").click();
  await fill(page, "car-dp", "2000000");
  check("car: down payment above price → error", (await alert(page)).includes("more than the on-road price"));
  await page.close();
}

/* ---------------- 69 Personal loan ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/personal-loan-calculator/");
  check("personal: EMI ₹16,607, net ₹4,88,200, fees ₹11,800", (await tid(page, "pl-emi")) === "₹16,607" && (await tid(page, "pl-net")) === "₹4,88,200" && (await tid(page, "pl-fees")) === "₹11,800");
  check("personal: effective rate 14.56%", (await tid(page, "pl-apr")) === "14.56%");
  await sw(page, /deducted from the loan/).click({ force: true });
  check("personal: fees paid separately → ₹5,00,000 credited", (await tid(page, "pl-net")) === "₹5,00,000" && (await tid(page, "pl-apr")) === "14.56%");
  await fill(page, "pl-feepct", "");
  await fill(page, "pl-gst", "");
  check("personal: no fees → 12.68%", (await tid(page, "pl-apr")) === "12.68%");
  await fill(page, "pl-tenure", "0");
  check("personal: zero tenure → error", (await alert(page)).length > 0);
  await page.close();
}

/* ---------------- 70 Affordability ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/loan-affordability-calculator/");
  check("afford: balanced → ₹13,17,830", (await tid(page, "af-loan")) === "₹13,17,830", await tid(page, "af-loan"));
  check("afford: surplus ₹48,000, DTI 12%, 5.8 months cover", (await tid(page, "af-surplus")) === "₹48,000" && (await tid(page, "af-dti")) === "12%" && (await tid(page, "af-emergency")).startsWith("5.8 months"));
  check("afford: three scenarios", (await tid(page, "af-loan-Conservative")) === "₹8.47 L" && (await tid(page, "af-loan-Higher commitment")) === "₹17.88 L");
  await page.locator("#af-s0").fill("150");
  check("afford: invalid scenario % → error", (await alert(page)).includes("between 0 and 100"));
  await page.locator("#af-s0").fill("30");
  await fill(page, "af-exp", "95000");
  check("afford: no surplus → nil and explained", (await tid(page, "af-loan")) === "₹0" && (await page.getByText("no room for a new EMI").count()) === 1);
  await page.close();
}

/* ---------------- 71 Rent vs buy ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/rent-vs-buy-calculator/");
  check("rvb: default buy ₹2,60,02,318 vs rent ₹3,80,08,192", (await tid(page, "rb-buy")) === "₹2,60,02,318" && (await tid(page, "rb-rent")) === "₹3,80,08,192", `${await tid(page, "rb-buy")} / ${await tid(page, "rb-rent")}`);
  check("rvb: renting ahead, never break-even", (await tid(page, "rb-verdict")).startsWith("Renting and investing ahead") && (await page.getByText("buying doesn't pull ahead").count()) === 1);
  check("rvb: 20-row table", (await page.getByTestId("rb-table").locator("tbody tr").count()) === 20);
  for (const [id, v] of [["rb-app", "7"], ["rb-rent", "35000"], ["rb-rinc", "6"], ["rb-ret", "8"], ["rb-dep", "105000"]] as const) await fill(page, id, v);
  check("rvb: buying pulls ahead from year 5", (await tid(page, "rb-verdict")).startsWith("Buying ahead") && (await page.getByText("buying stays ahead from year 5").count()) === 1);
  const before = await page.getByTestId("rb-table").locator("tbody tr").last().innerText();
  await radio(page, "Today's ₹").click();
  check("rvb: today's ₹ view changes the table", (await page.getByTestId("rb-table").locator("tbody tr").last().innerText()) !== before);
  await fill(page, "rb-dp", "20000000");
  check("rvb: down payment above price → error", (await alert(page)).includes("more than the price"));
  await page.close();
}

/* ---------------- 72 Stamp duty ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/stamp-duty-calculator/");
  check("stamp: Mumbai ₹1Cr man → ₹6,00,000", (await tid(page, "sd-total")) === "₹6,00,000");
  check("stamp: metro cess flagged secondary", (await tid(page, "sd-lines")).includes("Secondary sources"));
  await page.locator("#sd-buyer").selectOption("female");
  check("stamp: woman → ₹5,00,000 with ₹1,00,000 concession", (await tid(page, "sd-total")) === "₹5,00,000" && (await tid(page, "sd-concession")) === "− ₹1,00,000");
  await page.locator("#sd-state").selectOption("delhi");
  check("stamp: Delhi woman → ₹4,00,000", (await tid(page, "sd-total")) === "₹4,00,000");
  await page.locator("#sd-state").selectOption("rajasthan");
  await page.locator("#sd-buyer").selectOption("male");
  await fill(page, "sd-value", "5000000");
  check("stamp: Rajasthan ₹50L man → ₹3,90,000 (7.8%)", (await tid(page, "sd-total")) === "₹3,90,000" && (await tid(page, "sd-rate")).startsWith("7.8%"));
  await page.locator("#sd-date").fill("2019-06-01");
  check("stamp: date before earliest rule → not calculated", (await tid(page, "sd-unsupported")).includes("only hold rules in force from"));
  await page.locator("#sd-date").fill("2026-11-15");
  await page.locator("#sd-state").selectOption("x-Karnataka");
  check("stamp: Karnataka → unsupported", (await tid(page, "sd-unsupported")).includes("secondary sources only"));
  await fill(page, "sd-manual", "5.6");
  check("stamp: manual rate → ₹2,80,000", (await tid(page, "sd-manual")) === "₹2,80,000");
  await page.locator("#sd-state").selectOption("maharashtra");
  await page.locator("#sd-type").selectOption("commercial");
  check("stamp: commercial → unsupported", (await tid(page, "sd-unsupported")).includes("Only residential"));
  check("stamp: coverage lists supported states", (await tid(page, "stamp-coverage")).includes("Delhi, Maharashtra, Rajasthan, Telangana"));
  await page.close();
}

/* ---------------- 73 Registration ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/property-registration-charges-calculator/");
  check("reg: Delhi ₹1Cr → ₹1,00,100; with stamp ₹7,00,100", (await tid(page, "rg-total")) === "₹1,00,100" && (await tid(page, "rg-combined")).includes("₹7,00,100"));
  await page.locator("#rg-state").selectOption("haryana");
  await fill(page, "rg-value", "4500000");
  check("reg: Haryana ₹45L → ₹25,200; stamp duty not calculated", (await tid(page, "rg-total")) === "₹25,200" && (await page.getByTestId("rg-combined-missing").count()) === 1);
  await page.locator("#rg-state").selectOption("tamil-nadu");
  await page.locator("#rg-buyer").selectOption("female");
  await fill(page, "rg-value", "800000");
  check("reg: Tamil Nadu woman ₹8L → ₹8,000 (1%)", (await tid(page, "rg-total")) === "₹8,000" && (await tid(page, "rg-concession")).includes("saves ₹8,000"));
  await page.locator("#rg-state").selectOption("maharashtra");
  check("reg: Maharashtra → not calculated", (await tid(page, "rg-unsupported")).includes("couldn't be confirmed"));
  await page.close();
}

/* ---------------- 74 Down payment ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/down-payment-calculator/");
  check("dp: ₹80L home, 20% → upfront ₹21,20,000, surplus ₹80,000", (await tid(page, "dp-upfront")) === "₹21,20,000" && (await tid(page, "dp-gap")) === "₹80,000");
  check("dp: EMI ₹55,541 on ₹64L", (await tid(page, "dp-emi")) === "₹55,541" && (await tid(page, "dp-loan")).startsWith("₹64,00,000"));
  await fill(page, "dp-dp", "10");
  check("dp: 10% raised to RBI 80% LTV → ₹16,00,000", (await tid(page, "dp-amount")).startsWith("₹16,00,000") && (await page.getByText("Down payment raised to").count()) === 1);
  await radio(page, "Car").click();
  check("dp: car has no stamp duty fields", (await page.locator("#dp-stamp").count()) === 0);
  await fill(page, "dp-res", "9000000");
  check("dp: reserve above savings → error", (await alert(page)).includes("more than your savings"));
  await page.close();
}

/* ---------------- 75 DTI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/debt-to-income-ratio-calculator/");
  check("dti: 30% back-end, 20% front-end, 37.5% net", (await tid(page, "dti-main")) === "30%" && (await tid(page, "dti-front")) === "20%" && (await tid(page, "dti-net")) === "37.5%");
  check("dti: band in words, headroom ₹15,000", (await tid(page, "dti-band")).includes("within your target") && (await tid(page, "dti-headroom")) === "₹15,000");
  await fill(page, "dti-new", "20000");
  check("dti: new EMI → 43.3%, above target", (await tid(page, "dti-proposed")) === "43.3% — above your target" && (await tid(page, "dti-left")) === "₹55,000");
  await fill(page, "dti-gross", "0");
  await fill(page, "dti-net", "0");
  check("dti: zero income → no ratio, not Infinity", (await tid(page, "dti-main")) === "—");
  await fill(page, "dti-gross", "100");
  await fill(page, "dti-net", "200");
  check("dti: net above gross → error", (await alert(page)).includes("Net income can't be more"));
  await page.close();
}

/* ---------------- Pages, SEO, categories, links, mobile ---------------- */
{
  const page = await ctx.newPage();
  const titles: Record<string, string> = {
    "home-loan-eligibility-calculator": "Home Loan Eligibility Calculator – How Much Home Loan Can I Get?",
    "home-loan-prepayment-calculator": "Home Loan Prepayment Calculator – Interest Saved &amp; Tenure Reduced",
    "car-loan-calculator": "Car Loan EMI Calculator – Interest, Down Payment &amp; Total Cost",
    "personal-loan-calculator": "Personal Loan EMI Calculator – Interest, Fees &amp; Effective Rate",
    "loan-affordability-calculator": "Loan Affordability Calculator – How Much Loan Can I Afford?",
    "rent-vs-buy-calculator": "Rent vs Buy Calculator India – Should I Rent or Buy a House?",
    "stamp-duty-calculator": "Stamp Duty Calculator India – State-wise Property Stamp Duty",
    "property-registration-charges-calculator": "Property Registration Charges Calculator – Registration Fee India",
    "down-payment-calculator": "Down Payment Calculator – Home &amp; Car Down Payment and Upfront Cash",
    "debt-to-income-ratio-calculator": "Debt-to-Income Ratio Calculator – DTI &amp; EMI-to-Income Ratio",
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
  check("categories: Loans and Property listed", ["Loan Calculators", "Property & Home Buying"].every((c) => dir.includes(c)));
  const links: [string, string[]][] = [
    ["home-loan-eligibility-calculator", ["emi-calculator", "home-loan-prepayment-calculator", "down-payment-calculator", "debt-to-income-ratio-calculator"]],
    ["home-loan-prepayment-calculator", ["emi-calculator", "home-loan-eligibility-calculator", "loan-affordability-calculator"]],
    ["car-loan-calculator", ["emi-calculator", "down-payment-calculator", "loan-affordability-calculator"]],
    ["personal-loan-calculator", ["emi-calculator", "debt-to-income-ratio-calculator", "loan-affordability-calculator"]],
    ["loan-affordability-calculator", ["debt-to-income-ratio-calculator", "emi-calculator", "home-loan-eligibility-calculator"]],
    ["rent-vs-buy-calculator", ["home-loan-eligibility-calculator", "stamp-duty-calculator", "property-registration-charges-calculator", "down-payment-calculator"]],
    ["stamp-duty-calculator", ["property-registration-charges-calculator", "down-payment-calculator", "rent-vs-buy-calculator"]],
    ["property-registration-charges-calculator", ["stamp-duty-calculator", "down-payment-calculator", "rent-vs-buy-calculator"]],
    ["down-payment-calculator", ["home-loan-eligibility-calculator", "car-loan-calculator", "stamp-duty-calculator"]],
    ["debt-to-income-ratio-calculator", ["loan-affordability-calculator", "personal-loan-calculator", "home-loan-eligibility-calculator"]],
    ["emi-calculator", ["home-loan-eligibility-calculator", "home-loan-prepayment-calculator", "car-loan-calculator", "personal-loan-calculator"]],
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
  const qs: [string, string][] = [["home loan eligibility", "Home Loan Eligibility"], ["prepayment", "Prepayment"], ["car loan", "Car Loan"], ["personal loan", "Personal Loan"], ["loan affordability", "Affordability"], ["rent vs buy", "Rent vs Buy"], ["stamp duty", "Stamp Duty"], ["registration charges", "Registration Charges"], ["down payment", "Down Payment"], ["debt to income", "Debt-to-Income"]];
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
