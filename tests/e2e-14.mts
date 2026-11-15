// End-to-end tests for calculators 41–45: SIP, Compound Interest, BMI, GPA & CGPA, Tip & Bill Split.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-14.mts
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

/* ---------------- 41 SIP ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/sip-calculator/");
  check("sip: default ₹10,000 × 10y @12% (effective, end)", (await tid(page, "sip-value")) === "₹22,19,300" && (await tid(page, "sip-invested")) === "₹12,00,000", await tid(page, "sip-value"));
  check("sip: effective annual shown", (await tid(page, "sip-effective")) === "12.00%");
  await radio(page, /^Start of month/).click();
  await radio(page, /^Nominal ÷ 12/).click();
  check("sip: nominal + start of month = ₹23,23,391", (await tid(page, "sip-value")) === "₹23,23,391", await tid(page, "sip-value"));
  await radio(page, /^End of month/).click();
  await radio(page, /^Effective annual/).click();
  await page.locator("#sip-stepup").fill("10");
  check("sip: step-up 10%", (await tid(page, "sip-value")) === "₹32,38,172" && (await tid(page, "sip-invested")) === "₹19,12,491");
  check("sip: step-up vs regular explained", (await tid(page, "sip-stepup-gain")).includes("₹10,18,872"), await tid(page, "sip-stepup-gain"));
  check("sip: charts drawn with text alternatives", (await page.locator('svg[role="img"]').count()) >= 3);
  check("sip: year-wise table", (await page.getByTestId("sip-table").locator("tbody tr").count()) === 10);
  const csv = await download(page, () => btn(page, "CSV").click());
  const rows = csv.text.trim().split("\n");
  check("sip: CSV export", csv.name === "sip-year-wise.csv" && rows.length === 12 && rows[11].startsWith("10,12,") && rows[11].includes("3238172.14"), rows[11]);
  const sum = await download(page, () => btn(page, "Summary").click());
  check("sip: summary download has values + disclaimer", sum.text.includes("₹32,38,172") && sum.text.includes("subject to market risks"));
  check("sip: disclaimer visible", (await tid(page, "sip-disclaimer")) === "Returns are illustrative estimates based on the selected assumed rate. Mutual fund investments are subject to market risks and actual returns may vary.");
  await page.locator("#sip-stepup").fill("");
  await page.locator("#sip-return").fill("0");
  check("sip: zero return", (await tid(page, "sip-value")) === "₹12,00,000");
  await page.locator("#sip-return").fill("-5");
  check("sip: negative return allowed", (await tid(page, "sip-returns")).startsWith("-₹") || (await tid(page, "sip-returns")).startsWith("−₹"), await tid(page, "sip-returns"));
  await page.locator("#sip-return").fill("12");
  await page.locator("#sip-duration").fill("2.3");
  check("sip: fractional years rounded with note", await page.getByText("was rounded to 28 monthly instalments").isVisible());
  await page.locator("#sip-duration").fill("abc");
  check("sip: invalid input message", await page.getByRole("alert").filter({ hasText: "duration" }).isVisible());
  await page.locator("#sip-duration").fill("10");
  await page.getByRole("switch", { name: /Compare with another scenario/ }).check({ force: true });
  await page.locator("#sipb-monthly").fill("15000");
  const cmp = await page.getByTestId("sip-compare").innerText();
  check("sip: scenario comparison", cmp.includes("₹33,28,951") && cmp.includes("+₹11,09,650"), cmp.replace(/\s+/g, " "));
  await btn(page, "Reset").click();
  check("sip: reset", (await tid(page, "sip-value")) === "₹22,19,300" && (await page.getByTestId("sip-compare").count()) === 0);
  await page.locator("#sip-cur").selectOption("USD");
  check("sip: currency switch", (await tid(page, "sip-value")).startsWith("$"));
  await page.close();
}

/* ---------------- 42 Compound interest ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/compound-interest-calculator/");
  await radio(page, "Yearly").click();
  check("ci: ₹1,00,000 @8% yearly 10y", (await tid(page, "ci-final")) === "₹2,15,892.50" && (await tid(page, "ci-interest")) === "₹1,15,892.50");
  check("ci: simple-interest comparison", (await tid(page, "ci-simple")) === "₹1,80,000.00" && (await page.getByText("₹35,892.50").first().isVisible()));
  check("ci: growth %", (await tid(page, "ci-growth")) === "115.89%");
  await radio(page, "Monthly").click();
  check("ci: monthly compounding", (await tid(page, "ci-final")) === "₹2,21,964.02");
  await radio(page, "Daily").click();
  await page.locator("#ci-duration").fill("1");
  check("ci: daily compounding 1y", (await tid(page, "ci-final")) === "₹1,08,327.76");
  await page.locator("#ci-duration").fill("10");
  await radio(page, "Monthly").click();
  await page.locator("#ci-principal").fill("0");
  await page.locator("#ci-contribution").fill("5000");
  check("ci: monthly deposits, end", (await tid(page, "ci-final")) === "₹9,14,730.18");
  await radio(page, "Start").click();
  check("ci: monthly deposits, start", (await tid(page, "ci-final")) === "₹9,20,828.38");
  check("ci: year-wise table + charts", (await page.getByTestId("ci-table").locator("tbody tr").count()) === 10 && (await page.locator('svg[role="img"]').count()) >= 3);
  const csv = await download(page, () => btn(page, "CSV").click());
  check("ci: CSV export", csv.name === "compound-interest-schedule.csv" && csv.text.trim().split("\n").length === 12);
  await page.locator("#ci-contribution").fill("");
  await page.locator("#ci-principal").fill("100000");
  await page.locator("#ci-duration").fill("30");
  await page.locator("#ci-duration").press("Tab");
  await radio(page, "Months").click();
  check("ci: months unit (30 months, part-year row)", (await page.getByTestId("ci-table").locator("tbody tr").count()) === 3 && (await page.getByTestId("ci-table").innerText()).includes("(part)"));
  await page.locator("#ci-rate").fill("0");
  check("ci: zero interest", (await tid(page, "ci-interest")) === "₹0.00");
  await page.locator("#ci-rate").fill("500");
  check("ci: out-of-range rate rejected", await page.getByText(/between -10% and 100%/).first().isVisible());
  await btn(page, "Reset").click();
  await btn(page, "Copy summary").click();
  check("ci: copy summary", (await clip(page)).includes("Final value: ₹2,20,803.97"), (await clip(page)).split("\n").find((l) => l.startsWith("Final")));
  await page.close();
}

/* ---------------- 43 BMI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/bmi-calculator/");
  await page.locator("#bmi-cm").fill("175");
  await page.locator("#bmi-kg").fill("70");
  check("bmi: metric 175 cm / 70 kg", (await tid(page, "bmi-value")) === "22.9" && (await tid(page, "bmi-category")) === "Healthy weight");
  check("bmi: healthy range", (await tid(page, "bmi-range")) === "56.7 kg – 76.3 kg", await tid(page, "bmi-range"));
  const scaleText = await page.getByTestId("bmi-scale").innerText();
  check("bmi: scale has text labels for every category", ["Underweight", "Healthy weight", "Overweight", "Obesity"].every((c) => scaleText.includes(c)));
  await radio(page, /^Imperial/).click();
  check("bmi: switching units converts the entry", (await page.locator("#bmi-ft").inputValue()) === "5" && (await page.locator("#bmi-in").inputValue()) === "9" && (await page.locator("#bmi-lb").inputValue()) === "154.3" && (await tid(page, "bmi-value")) === "22.8", `${await page.locator("#bmi-ft").inputValue()} ${await page.locator("#bmi-in").inputValue()} ${await page.locator("#bmi-lb").inputValue()}`);
  await page.locator("#bmi-lb").fill("160");
  check("bmi: imperial 5 ft 9 in, 160 lb", (await tid(page, "bmi-value")) === "23.6");
  await radio(page, /^Metric/).click();
  await page.locator("#bmi-cm").fill("180");
  for (const [kg, cat] of [["59.5", "Underweight"], ["81", "Overweight"], ["97.2", "Obesity"]]) {
    await page.locator("#bmi-kg").fill(kg);
    check(`bmi: ${kg} kg at 180 cm → ${cat}`, (await tid(page, "bmi-category")) === cat);
  }
  await page.locator("#bmi-kg").fill("0");
  check("bmi: invalid weight", await page.getByRole("alert").filter({ hasText: /weight in kilograms/ }).isVisible());
  await page.locator("#bmi-kg").fill("70");
  await page.locator("#bmi-cm").fill("400");
  check("bmi: extreme height", (await page.locator("#bmi-cm").getAttribute("aria-invalid")) === "true");
  await btn(page, "170 cm · 65 kg").click();
  const d = await download(page, () => btn(page, "Download").click());
  check("bmi: summary download", d.name === "bmi-result.txt" && d.text.includes("BMI: 22.5 — Healthy weight") && d.text.includes("not a diagnosis"));
  check("bmi: adults-only notice", (await tid(page, "bmi-adults")).includes("adults aged 18 and over"));
  await page.close();
}

/* ---------------- 44 GPA & CGPA ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/gpa-cgpa-calculator/");
  const subj = (i: number, f: string) => page.getByLabel(`Subject ${i} ${f}`, { exact: true });
  await subj(1, "grade").selectOption("A+");
  await subj(1, "credits").fill("4");
  await subj(2, "grade").selectOption("A");
  await subj(2, "credits").fill("3");
  await subj(3, "grade").selectOption("O");
  await subj(3, "credits").fill("2");
  check("gpa: 10-point weighted GPA", (await tid(page, "gpa-value")) === "8.89 / 10");
  await btn(page, "Add subject").click();
  await subj(4, "grade").selectOption("__points");
  await subj(4, "grade points").fill("7.5");
  await subj(4, "credits").fill("0");
  check("gpa: zero-credit subject doesn't change GPA", (await tid(page, "gpa-value")) === "8.89 / 10");
  await btn(page, "Add subject").click();
  await subj(5, "grade").selectOption("B");
  check("gpa: missing credits reported, not counted", (await tid(page, "gpa-skipped")).includes("no credits entered") && (await tid(page, "gpa-value")) === "8.89 / 10");
  await btn(page, "Remove subject 5").click();
  await btn(page, "Remove subject 4").click();
  check("gpa: grade distribution", (await tid(page, "gpa-distribution")).replace(/\s/g, "") === "O1A+1A1");
  const csv = await download(page, () => btn(page, "CSV").click());
  check("gpa: CSV", csv.name === "gpa-results.csv" && csv.text.includes("GPA,,8.89,9,80.00"), csv.text.split("\n").at(-2));
  await radio(page, "4.0").click();
  check("gpa: scale switch re-validates letters", (await tid(page, "gpa-value")) !== "8.89 / 10");
  await radio(page, "10-point").click();
  await radio(page, "Custom").click();
  check("gpa: custom scale editor", await page.getByTestId("gpa-custom-scale").isVisible());
  await page.getByLabel("Grade 1 points").fill("9.5");
  check("gpa: custom mapping applied", (await tid(page, "gpa-value")) === fmt2((9 * 4 + 8 * 3 + 9.5 * 2) / 9) + " / 10", await tid(page, "gpa-value"));
  await radio(page, "10-point").click();
  await page.locator("#gpa-repeat").selectOption("latest");
  await subj(1, "name").fill("Maths");
  await subj(2, "name").fill("maths");
  check("gpa: repeated subject — latest attempt only", (await tid(page, "gpa-value")) === fmt2((8 * 3 + 10 * 2) / 5) + " / 10" && (await tid(page, "gpa-skipped")).includes("Repeated subject"));
  await page.locator("#gpa-repeat").selectOption("all");
  await btn(page, "Add to CGPA").click();
  check("gpa → cgpa: semester added", (await page.getByLabel("Semester 1 GPA").inputValue()) === "8.8889" && (await page.getByLabel("Semester 1 credits").inputValue()) === "9");
  await page.getByLabel("Semester 1 GPA").fill("6");
  await page.getByLabel("Semester 1 credits").fill("10");
  await page.getByLabel("Semester 2 GPA").fill("9");
  await page.getByLabel("Semester 2 credits").fill("30");
  check("cgpa: credit-weighted (not simple average)", (await tid(page, "cgpa-value")) === "8.25 / 10");
  await page.getByRole("switch", { name: /weight semesters equally/ }).check({ force: true });
  check("cgpa: equal weights only when chosen", (await tid(page, "cgpa-value")) === "7.50 / 10");
  await page.getByRole("switch", { name: /weight semesters equally/ }).uncheck({ force: true });
  await btn(page, "Duplicate Semester 2").click();
  check("cgpa: duplicate semester", (await page.getByTestId("cgpa-semesters").locator("li").count()) === 3 && (await tid(page, "cgpa-value")) === fmt2((60 + 270 + 270) / 70) + " / 10");
  await btn(page, "Remove Semester 2 (copy)").click();
  await btn(page, "Convert to %").click();
  check("percent: no result until a formula is chosen", (await page.getByTestId("pct-value").count()) === 0);
  await page.locator("#pct-formula").selectOption("m075");
  check("percent: chosen formula shown with result", (await tid(page, "pct-value")) === "75.00%" && (await tid(page, "pct-formula-shown")).includes("(8.25 − 0.75) × 10 = 75.00%"), await tid(page, "pct-formula-shown"));
  await page.close();
}
function fmt2(n: number) {
  return (Math.round(Number(n.toPrecision(12)) * 100) / 100).toFixed(2);
}

/* ---------------- 45 Tip ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/tip-calculator/");
  await page.locator("#tip-bill").fill("2840");
  await page.locator("#tip-people").fill("4");
  check("tip: ₹2,840, 10%, 4 people", (await tid(page, "tip-per-person")) === "₹781.00" && (await tid(page, "tip-total")) === "₹3,124.00");
  await radio(page, "15%").click();
  check("tip: preset 15%", (await tid(page, "tip-tip-v")) === "₹426.00");
  await page.locator("#tip-pct").fill("12.5");
  check("tip: custom 12.5%", (await tid(page, "tip-tip-v")) === "₹355.00");
  await page.locator("#tip-cur").selectOption("USD");
  await page.locator("#tip-bill").fill("84.50");
  await page.locator("#tip-pct").fill("18");
  await page.locator("#tip-people").fill("3");
  await radio(page, "Tax %").click();
  await page.locator("#tip-tax").fill("8.875");
  check("tip: US tax added, tip before tax", (await tid(page, "tip-tax-v")) === "$7.50" && (await tid(page, "tip-tip-v")) === "$15.21" && (await tid(page, "tip-total")) === "$107.21");
  check("tip: uneven exact split reconciles", (await tid(page, "tip-shares")) === "2 people pay $35.74 1 person pays $35.73", await tid(page, "tip-shares"));
  await radio(page, "Amount after tax").click();
  check("tip: tip after tax", (await tid(page, "tip-tip-v")) === "$16.56");
  await radio(page, "Amount before tax").click();
  await page.getByRole("switch", { name: /already includes tax/ }).check({ force: true });
  check("tip: tax included in bill", (await tid(page, "tip-tax-v")) === "$6.89" && (await tid(page, "tip-total")) === "$98.47", `${await tid(page, "tip-tax-v")} ${await tid(page, "tip-total")}`);
  await page.getByRole("switch", { name: /already includes tax/ }).uncheck({ force: true });
  await radio(page, "No tax").click();
  await page.locator("#tip-bill").fill("100");
  await page.locator("#tip-pct").fill("0");
  await radio(page, "Round up").click();
  check("tip: round up shows the extra", (await tid(page, "tip-per-person")) === "$34.00" && (await tid(page, "tip-collected")) === "$102.00 (+$2.00)");
  await radio(page, "Nearest whole").click();
  check("tip: nearest — remainder to one person", (await tid(page, "tip-shares")) === "2 people pay $33.00 1 person pays $34.00");
  await btn(page, "One fewer person").click();
  await btn(page, "One fewer person").click();
  check("tip: one person", (await tid(page, "tip-per-person")) === "$100.00" && (await btn(page, "One fewer person").isDisabled()));
  await page.locator("#tip-bill").fill("0");
  check("tip: zero bill", (await tid(page, "tip-total")) === "$0.00");
  await page.locator("#tip-bill").fill("-5");
  check("tip: negative bill rejected", await page.getByRole("alert").filter({ hasText: /0 or more/ }).isVisible());
  await page.locator("#tip-bill").fill("100");
  await page.locator("#tip-people").fill("2.5");
  check("tip: fractional people rejected", await page.getByRole("alert").filter({ hasText: /whole number/ }).isVisible());
  await page.locator("#tip-people").fill("3");
  await btn(page, "Copy summary").click();
  check("tip: copy summary", (await clip(page)).includes("1 person pays $34.00") && (await clip(page)).includes("Total: $100.00"));
  await page.close();
}

/* ---------------- SEO, categories, discovery, mobile ---------------- */
{
  const page = await ctx.newPage();
  const expect: Record<string, [string, string]> = {
    "sip-calculator": ["SIP Calculator – Calculate Mutual Fund SIP Returns Online", "UtilitiesApplication"],
    "compound-interest-calculator": ["Compound Interest Calculator – Calculate Interest Online Free", "UtilitiesApplication"],
    "bmi-calculator": ["BMI Calculator – Check Your Body Mass Index Online", "HealthApplication"],
    "gpa-cgpa-calculator": ["GPA &amp; CGPA Calculator – Calculate Your Grades Online Free", "EducationalApplication"],
    "tip-calculator": ["Tip Calculator – Calculate Tips &amp; Split Restaurant Bills", "UtilitiesApplication"],
  };
  const descs = new Set<string>();
  for (const [slug, [title, appCat]] of Object.entries(expect)) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
    const nodes: { "@type": string; applicationCategory?: string; aggregateRating?: unknown }[] = [];
    let ldOk = true;
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      try {
        const j = JSON.parse(m[1]);
        nodes.push(...(j["@graph"] ?? [j]));
      } catch {
        ldOk = false;
      }
    }
    descs.add(h.match(/<meta name="description" content="(.*?)"/)?.[1] ?? "");
    const types = nodes.map((n) => n["@type"]);
    const ok =
      h.includes(`<title>${title}</title>`) &&
      (h.match(/<h1/g) ?? []).length === 1 &&
      new URL(/<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] ?? "x:").pathname === `/${slug}/` &&
      h.includes('property="og:title"') &&
      h.includes('name="twitter:card"') &&
      !/name="robots" content="[^"]*noindex/.test(h) &&
      ldOk &&
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((t) => types.includes(t)) &&
      nodes.find((n) => n["@type"] === "WebApplication")?.applicationCategory === appCat &&
      !/aggregateRating|ratingValue|"review"/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: unique descriptions", descs.size === 5);
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const full = await (await fetch(`${BASE}/llms-full.txt`)).text();
  const slugs = Object.keys(expect);
  check("sitemap: all 5 canonical URLs", slugs.every((s) => sm.includes(`/${s}/</loc>`)));
  check("llms.txt + llms-full.txt: all 5, existing kept", slugs.every((s) => llms.includes(`/${s}/)`) && full.includes(`/${s}/`)) && llms.includes("/rotate-pdf/)") && full.includes("Category: Health & Fitness") && full.includes("Category: Education & Academic"));
  await open(page, "/all-tools/");
  const dir = await page.content();
  check("directory: new categories with their tools", ["Health &amp; Fitness", "Education &amp; Academic", "Everyday &amp; Lifestyle"].every((c) => dir.includes(c)) && slugs.every((s) => dir.includes(`href="/${s}/"`)));
  await open(page, "/");
  const home = await page.content();
  check("home: new categories linked, calculators listed", home.includes('href="/all-tools/#health"') && home.includes('href="/all-tools/#education"') && home.includes('href="/all-tools/#lifestyle"') && slugs.every((s) => home.includes(`href="/${s}/"`)));
  await page.getByPlaceholder("What would you like to do today?").fill("bmi");
  await page.getByRole("option").first().waitFor();
  const firstOpt = async () => (await page.getByRole("option").first().innerText()).split("\n")[0];
  const searches: [string, string][] = [["sip", "SIP Calculator"], ["compound interest", "Compound Interest"], ["bmi", "BMI"], ["cgpa", "GPA & CGPA"], ["split bill", "Tip & Bill Split"]];
  let searchOk = true;
  for (const [q, want] of searches) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    await page.waitForTimeout(150);
    if (!(await firstOpt()).includes(want)) searchOk = false;
  }
  check("search: each calculator found first", searchOk);
  check("related: EMI links to SIP, discount links to tip", (await (await fetch(`${BASE}/emi-calculator/`)).text()).includes('href="/sip-calculator/"') && (await (await fetch(`${BASE}/discount-calculator/`)).text()).includes('href="/tip-calculator/"'));

  await page.setViewportSize({ width: 360, height: 780 });
  for (const s of slugs) {
    await open(page, `/${s}/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile 360px: /${s}/ no horizontal overflow`, overflow <= 0, String(overflow));
  }
  await open(page, "/gpa-cgpa-calculator/");
  await btn(page, "Sample data").click();
  await btn(page, "CGPA").click().catch(() => undefined);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile: GPA with sample data fits", ov <= 0, String(ov));
  await page.close();
}

check("privacy: no requests to other origins", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
