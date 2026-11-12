// End-to-end tests for tools 11–15 (JSON Formatter, Age, GST, Unit Converter, Case Converter).
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-3.mts
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { CASES, convertCase } from "../src/lib/case";

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

/* ---------------- 11 JSON Formatter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/json-formatter/");
  const input = page.locator("#json-input");
  const output = page.locator("#json-output");
  check("json: empty state", await page.getByText("Paste JSON, open a .json file").isVisible());

  await input.fill('{\n  "a": 1,\n}');
  await page.getByRole("status").filter({ hasText: /^\s*Invalid JSON/ }).waitFor();
  check("json: trailing comma → line 3, column 1", (await page.getByText("line 3, column 1").isVisible()) && (await page.getByText("Trailing comma before }.").isVisible()));
  await page.getByRole("button", { name: "Go to error", exact: true }).click();
  const sel = await input.evaluate((el: HTMLTextAreaElement) => [el.selectionStart, document.activeElement === el]);
  check("json: go to error selects position", sel[0] === 12 && sel[1] === true, JSON.stringify(sel));

  for (const [bad, msg] of [
    ["{'a':1}", "Single quotes aren't allowed."],
    ["{a:1}", 'Unexpected word "a".'],
    ['{"a":1 "b":2}', 'Expected "," or "}"'],
    ['{"a":[1,2}', 'Expected "," or "]"'],
    ['{"a":"x', "Unterminated string"],
  ]) {
    await input.fill(bad);
    await page.waitForTimeout(80);
    check(`json: detects ${msg.slice(0, 32)}`, await page.getByText(msg, { exact: false }).first().isVisible());
  }

  await page.getByRole("button", { name: "Sample", exact: true }).click();
  await page.getByRole("status").filter({ hasText: /^\s*Valid JSON/ }).waitFor();
  const pretty = await output.inputValue();
  check("json: beautify (2 spaces), nested + arrays", pretty.includes('\n  "location": {\n    "city"') && pretty.includes('"tags": [\n        "hot"'));
  check("json: lossless big integer", pretty.includes("9007199254740993"));
  check("json: unsafe integer warning shown", await page.getByText(/larger than JavaScript can represent/).isVisible());
  await page.getByRole("radio", { name: "Tab" }).click();
  check("json: tab indentation", (await output.inputValue()).includes('\n\t"store"'));
  await page.getByRole("button", { name: "Minify", exact: true }).click();
  const min = await output.inputValue();
  check("json: minify", !min.includes("\n") && min.startsWith('{"store":"ZSpace Coffee","open":true'), min.slice(0, 40));
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  check("json: copy output", (await clip(page)) === min);
  const dl = await download(page, () => page.getByRole("button", { name: "Download", exact: true }).click());
  check("json: download .json", dl.name === "data.min.json" && dl.text === min, dl.name);

  await page.locator('input[aria-label="Open a JSON file"]').setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('[1,[2,[3,{"deep":true}]]]') });
  await page.getByText("depth 4").waitFor();
  await page.waitForFunction(() => (document.querySelector("#json-output") as HTMLTextAreaElement).value.includes('"deep"'), null, { timeout: 5000 }).catch(() => {});
  check("json: open .json file + beautify", (await output.inputValue()).includes('"deep": true'));
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.waitForTimeout(300);
  check("json: reset", (await input.inputValue()) === "" && (await page.getByText("Paste JSON, open a .json file").isVisible()));
  await page.close();
}

/* ---------------- 12 Age Calculator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/age-calculator/");
  const ymd = page.getByTestId("age-ymd");
  const calc = async (a: string, b: string) => {
    await page.locator("#age-start").fill(a);
    await page.locator("#age-end").fill(b);
    await page.getByRole("button", { name: "Calculate", exact: true }).click();
    await page.waitForTimeout(250);
  };
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  check("age: reference date defaults to today", (await page.locator("#age-end").inputValue()) === iso);

  await calc("1990-05-15", "2026-11-12");
  const t = (await ymd.innerText()).replace(/\s+/g, " ");
  check("age: ordinary 36y 5m 28d", t === "36 years 5 months 28 days", t);
  check("age: total days + weekday", (await page.getByText("13,330", { exact: true }).isVisible()) && (await page.getByText("Tuesday").isVisible()));
  check("age: next birthday", await page.getByText("You’ll turn 37 on 15 May 2027").isVisible());

  await calc("2000-02-29", "2023-02-28");
  check("age: 29 Feb birthday on 28 Feb (common year)", (await ymd.innerText()).replace(/\s+/g, " ") === "23 years 0 months 0 days" && (await page.getByText(/Happy birthday/).isVisible()));
  await calc("2000-02-29", "2024-02-29");
  check("age: leap year exact", (await ymd.innerText()).replace(/\s+/g, " ") === "24 years 0 months 0 days");

  await calc("2099-01-01", "2026-11-12");
  check("age: future DOB rejected", await page.getByRole("alert").filter({ hasText: "in the future" }).isVisible());

  await page.getByRole("radio", { name: "Between two dates" }).click();
  await calc("2023-01-31", "2023-03-01");
  check("age: month-end difference 1m 1d", (await ymd.innerText()).replace(/\s+/g, " ") === "0 years 1 month 1 day");
  await calc("2030-01-01", "2031-06-15");
  check("age: future dates allowed in difference mode", (await ymd.innerText()).replace(/\s+/g, " ") === "1 year 5 months 14 days");
  await calc("2024-05-02", "2024-05-01");
  check("age: invalid range rejected", await page.getByRole("alert").filter({ hasText: "after the second date" }).isVisible());
  await calc("2024-01-01", "2024-12-31");
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  check("age: copy summary", (await clip(page)).startsWith("0 years, 11 months and 30 days (365 days in total)"), await clip(page));
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  check("age: reset", (await page.locator("#age-start").inputValue()) === "");
  await page.close();
}

/* ---------------- 13 GST Calculator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/gst-calculator/");
  const box = page.getByTestId("gst-breakdown");
  const text = async () => (await box.innerText()).replace(/\s+/g, " ");
  await page.locator("#gst-amount").fill("1000");
  let b = await text();
  check("gst: add 18% intra", b.includes("₹1,000.00") && b.includes("CGST @ 9% ₹90.00") && b.includes("SGST @ 9% ₹90.00") && b.includes("₹1,180.00"), b);

  const totals: Record<string, string> = { "0": "₹1,000.00", "5": "₹1,050.00", "12": "₹1,120.00", "18": "₹1,180.00", "28": "₹1,280.00", "40": "₹1,400.00" };
  let presetsOk = true;
  for (const [p, total] of Object.entries(totals)) {
    await page.getByRole("radio", { name: `${p}%`, exact: true }).click();
    if (!(await text()).includes(`Final amount incl. GST ${total}`)) presetsOk = false;
  }
  check("gst: every preset (0/5/12/18/28/40)", presetsOk);
  await page.locator("#gst-custom").fill("3");
  check("gst: custom rate 3%", (await text()).includes("₹1,030.00"));

  await page.getByRole("radio", { name: /Inter-state/ }).click();
  await page.getByRole("radio", { name: "18%", exact: true }).click();
  b = await text();
  check("gst: inter-state IGST", b.includes("IGST @ 18% ₹180.00") && !b.includes("CGST"), b);

  await page.getByRole("radio", { name: /Intra-state/ }).click();
  await page.getByRole("radio", { name: /Remove GST/ }).click();
  await page.locator("#gst-amount").fill("1180");
  b = await text();
  check("gst: remove GST (not 18% of inclusive)", b.includes("Taxable value (excl. GST) ₹1,000.00") && b.includes("Total GST @ 18% ₹180.00"), b);
  await page.getByRole("radio", { name: "12%", exact: true }).click();
  await page.locator("#gst-amount").fill("999.99");
  b = await text();
  check("gst: decimals & rounding to paisa", b.includes("₹892.85") && b.includes("₹53.57") && b.includes("₹999.99"), b);
  await page.locator("#gst-amount").fill("0");
  check("gst: zero amount", (await text()).includes("₹0.00"));
  await page.getByRole("radio", { name: /Add GST/ }).click();
  await page.locator("#gst-amount").fill("12,34,567.50");
  await page.getByRole("radio", { name: "0%", exact: true }).click();
  check("gst: Indian number formatting", (await text()).includes("₹12,34,567.50"));
  await page.locator("#gst-amount").fill("abc");
  check("gst: invalid amount message", await page.getByRole("alert").filter({ hasText: "Enter the amount as a number" }).isVisible());

  await page.locator("#gst-amount").fill("2500");
  await page.getByRole("radio", { name: "18%", exact: true }).click();
  await page.getByRole("button", { name: "Copy calculation", exact: true }).click();
  const c = await clip(page);
  check("gst: copy calculation", c.includes("Taxable value:   ₹2,500.00") && c.includes("Invoice total:   ₹2,950.00") && c.includes("not tax or legal advice"));
  const dl = await download(page, () => page.getByRole("button", { name: "Download summary", exact: true }).click());
  check("gst: download summary", dl.text === c && dl.name.endsWith(".txt"), dl.name);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  check("gst: reset", (await page.locator("#gst-amount").inputValue()) === "");
  check("gst: disclaimer visible", await page.getByText(/not tax or legal advice/).first().isVisible());
  await page.close();
}

/* ---------------- 14 Unit Converter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/unit-converter/");
  const res = page.getByTestId("unit-result");
  const set = async (tab: string, v: string, from: string, to: string) => {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByLabel("From", { exact: true }).selectOption(from);
    await page.getByLabel("To", { exact: true }).selectOption(to);
    await page.getByLabel("Amount").fill(v);
    return (await res.innerText().catch(() => "")).replace(/\s+/g, " ");
  };
  const cases: [string, string, string, string, string][] = [
    ["Length", "5", "ft", "cm", "152.4 cm"],
    ["Weight", "70", "kg", "lb", "154.323583529 lb"],
    ["Temperature", "100", "F", "C", "37.7777777778 °C"],
    ["Area", "1", "ac", "m2", "4,046.8564224 m²"],
    ["Volume", "1", "gal", "L", "3.785411784 L"],
    ["Speed", "60", "mph", "kmh", "96.56064 km/h"],
    ["Time", "1", "wk", "h", "168 h"],
    ["Digital storage", "1", "TB", "GiB", "931.322574615 GiB"],
  ];
  for (const [tab, v, f, t, want] of cases) {
    const got = await set(tab, v, f, t);
    check(`unit: ${tab} ${v} ${f}→${t}`, got === want, got);
  }
  // Every unit in every category produces a finite result.
  let allOk = true;
  for (const tab of ["Length", "Weight", "Temperature", "Area", "Volume", "Speed", "Time", "Digital storage"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    const opts = await page.getByLabel("From", { exact: true }).locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    for (const o of opts) {
      await page.getByLabel("From", { exact: true }).selectOption(o);
      await page.getByLabel("Amount").fill("3");
      const r = await res.innerText().catch(() => "ERR");
      if (r === "ERR" || /NaN|Infinity/.test(r)) {
        allOk = false;
        console.log("   bad", tab, o, r);
      }
    }
  }
  check("unit: every unit in every category converts", allOk);

  await set("Length", "5", "ft", "cm");
  await page.getByRole("button", { name: "Swap units", exact: true }).click();
  check("unit: swap units", (await res.innerText()).replace(/\s+/g, " ") === "0.164041994751 ft");
  check("unit: decimal precision", (await set("Length", "0.1", "m", "cm")) === "10 cm");
  await set("Length", "-2", "m", "ft");
  check("unit: negative length rejected", await page.getByRole("alert").filter({ hasText: "can't be negative" }).isVisible());
  check("unit: negative temperature allowed", (await set("Temperature", "-40", "C", "F")) === "-40 °F");
  await page.getByLabel("Amount").fill("-500");
  check("unit: below absolute zero rejected", await page.getByRole("alert").filter({ hasText: "absolute zero" }).isVisible());
  await set("Length", "abc", "m", "ft");
  check("unit: invalid input", await page.getByRole("alert").filter({ hasText: "Enter a number" }).isVisible());
  check("unit: extreme value formatted", (await set("Length", "1e20", "km", "mm")) === "1 × 10^26 mm");
  await page.getByRole("button", { name: "1 TB → GiB", exact: true }).click();
  check("unit: common example chip", (await res.innerText()).replace(/\s+/g, " ") === "931.322574615 GiB");
  await page.getByRole("button", { name: "Copy result", exact: true }).click();
  check("unit: copy plain value", (await clip(page)) === "931.322574615");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  check("unit: clear", (await page.getByLabel("Amount").inputValue()) === "");
  await page.close();
}

/* ---------------- 15 Case Converter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/case-converter/");
  const input = page.locator("#case-input");
  const output = page.locator("#case-output");
  const samples = [
    "the quick guide to everyday tools: how to get more done\nUse the XMLHttpRequest API on your iPhone — it's 2x faster!",
    "HELLO WORLD. how are you?   i'm fine.\n\nuser_first-name   v2.0",
    "Ünïcödé straße — café déjà vu, naïve résumé",
  ];
  let wiring = true;
  for (const text of samples) {
    await input.fill(text);
    for (const c of CASES) {
      await page.getByRole("radio", { name: c.label, exact: true }).click();
      await page.waitForTimeout(30);
      const got = await output.inputValue();
      const want = convertCase(text, c.id);
      if (got !== want) {
        wiring = false;
        console.log(`   mismatch ${c.id}: ${JSON.stringify(got)} vs ${JSON.stringify(want)}`);
      }
    }
  }
  check("case: all 14 styles × 3 inputs (multi-line, punctuation, numbers, Unicode)", wiring);

  await input.fill("the lord of the rings");
  await page.getByRole("radio", { name: "Title Case", exact: true }).click();
  check("case: title case semantics", (await output.inputValue()) === "The Lord of the Rings");
  await page.getByRole("radio", { name: "snake_case", exact: true }).click();
  await input.fill("first line\nsecond line");
  await page.waitForTimeout(200);
  check("case: line breaks preserved", (await output.inputValue()) === "first_line\nsecond_line");
  await input.fill("");
  await page.waitForTimeout(200);
  check("case: empty input → empty output", (await output.inputValue()) === "");
  await input.fill("a   b");
  await page.getByRole("radio", { name: "UPPERCASE", exact: true }).click();
  const before = await output.inputValue();
  await page.getByRole("switch", { name: /Tidy extra spaces/ }).check({ force: true });
  check("case: spaces kept by default, tidied on request", before === "A   B" && (await output.inputValue()) === "A B");
  check("case: counts shown", await page.getByText("2 words · 5 chars").isVisible());
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  check("case: copy", (await clip(page)) === "A B");
  const dl = await download(page, () => page.getByRole("button", { name: ".txt", exact: true }).click());
  check("case: download .txt", dl.text === "A B" && dl.name === "text-upper.txt", dl.name);
  await page.getByRole("button", { name: "Reset everything", exact: true }).click();
  check("case: reset", (await input.inputValue()) === "");
  await page.close();
}

/* ---------------- Search, directory, SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["json", "JSON Formatter"], ["how old am i", "Age Calculator"], ["gst", "GST Calculator"], ["cm to inches", "Unit Converter"], ["uppercase", "Case Converter"], ["snake case", "Case Converter"], ["celsius", "Unit Converter"]]) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  for (const slug of ["json-formatter", "age-calculator", "gst-calculator", "unit-converter", "case-converter"]) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
    const title = h.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const desc = h.match(/name="description" content="([^"]*)"/)?.[1] ?? "";
    const types: string[] = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      const j = JSON.parse(m[1]);
      types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
    }
    const ok =
      (h.match(/<h1/g) ?? []).length === 1 &&
      h.includes(`rel="canonical" href="https://tools.zspace.in/${slug}/"`) &&
      h.includes('property="og:title"') &&
      h.includes('name="twitter:card"') &&
      ["BreadcrumbList", "WebApplication", "FAQPage", "HowTo"].every((t) => types.includes(t)) &&
      h.includes("Worked examples") &&
      !/aggregateRating|"review"/i.test(h);
    check(`seo: /${slug}/ metadata + JSON-LD + examples`, ok, `${title.slice(0, 50)}… desc ${desc.length}`);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt include all 5", ["json-formatter", "age-calculator", "gst-calculator", "unit-converter", "case-converter"].every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await page.close();
}

const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
