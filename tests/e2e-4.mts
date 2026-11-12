// End-to-end tests for tools 16–20 (URL, Base64, CSV→JSON, Date, Loan EMI).
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-4.mts
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { encodeText } from "../src/lib/base64";

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
  const buf = readFileSync((await dl.path())!);
  return { name: dl.suggestedFilename(), text: buf.toString("utf8"), buf };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const settle = (page: Page) => page.waitForTimeout(150);
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

/* ---------------- 16 URL ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/url-encoder-decoder/");
  const input = page.locator("#url-input");
  const out = page.locator("#url-output");
  const mode = (label: string) => page.getByRole("radio", { name: new RegExp(`^${label}`) }).click();
  const run = async (m: string, text: string) => {
    await mode(m);
    await input.fill(text);
    await settle(page);
    return out.inputValue();
  };
  check("url: component encodes & = ? # / + % space", (await run("Encode component", "a b&c=d?e#f/g+h%")) === "a%20b%26c%3Dd%3Fe%23f%2Fg%2Bh%25");
  check("url: full URL keeps structure", (await run("Encode full URL", "https://a.com/p?q=a b&x=1#top")) === "https://a.com/p?q=a%20b&x=1#top");
  check("url: unicode + emoji", (await run("Encode component", "café 🍰")) === "caf%C3%A9%20%F0%9F%8D%B0");
  check("url: decode component", (await run("Decode component", "caf%C3%A9%20%26%20%F0%9F%8D%B0")) === "café & 🍰");
  check("url: decode full URL keeps %2F", (await run("Decode full URL", "a%2Fb%20c")) === "a%2Fb c");
  check("url: + kept by default", (await run("Decode component", "a+b")) === "a+b");
  await page.getByRole("switch", { name: /\+ means space/ }).check({ force: true });
  await settle(page);
  check("url: + means space option", (await out.inputValue()) === "a b");
  await input.fill("100% sure");
  await settle(page);
  check("url: malformed % reported with position", await page.getByRole("alert").filter({ hasText: /isn't a valid percent sequence/ }).isVisible());
  await input.fill("%C3");
  await settle(page);
  check("url: truncated UTF-8 reported", await page.getByRole("alert").filter({ hasText: /incomplete or invalid UTF-8/ }).isVisible());
  await run("Encode component", "a%20b");
  check("url: double-encode warning (no silent change)", (await out.inputValue()) === "a%2520b" && (await page.getByText(/turns each % into %25/).isVisible()));
  await run("Decode component", "a%2520b");
  check("url: still-encoded hint", await page.getByText(/The result still contains percent sequences/).isVisible());
  await btn(page, "Use output as input and switch direction").click();
  await settle(page);
  check("url: swap switches direction", (await input.inputValue()) === "a%20b" && (await out.inputValue()) === "a%2520b");
  await btn(page, "Copy").click();
  check("url: copy", (await clip(page)) === "a%2520b");
  const dl = await download(page, () => btn(page, ".txt").click());
  check("url: download .txt", dl.text === "a%2520b", dl.name);
  await btn(page, "Reset").click();
  check("url: reset", (await input.inputValue()) === "");
  await page.close();
}

/* ---------------- 17 Base64 ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/base64-encoder-decoder/");
  const input = page.locator("#b64-input");
  const out = page.locator("#b64-output");
  const enc = async (t: string) => {
    await input.fill(t);
    await settle(page);
    return out.inputValue();
  };
  check("b64: ASCII", (await enc("Hello")) === "SGVsbG8=");
  const uni = "नमस्ते · مرحبا · こんにちは 👋🏽\nline two";
  check("b64: Unicode + emoji + multiline", (await enc(uni)) === encodeText(uni));
  await page.getByRole("switch", { name: /URL-safe/ }).check({ force: true });
  check("b64: URL-safe", (await enc("??>>")) === "Pz8-Pg");
  await page.getByRole("switch", { name: /URL-safe/ }).uncheck({ force: true });
  const big = "Less effort. More done. ✓ ".repeat(20000);
  const bigOut = await enc(big);
  check("b64: large text (~520 KB)", bigOut === encodeText(big), `${bigOut.length} chars`);
  check("b64: shows size overhead", await page.getByText(/% larger\)/).isVisible());
  await btn(page, "Use output as input and switch direction").click();
  await page.waitForTimeout(400);
  check("b64: swap → decode round trip", (await out.inputValue()) === big);
  await page.getByRole("radio", { name: "Decode from Base64" }).click();
  for (const [bad, msg] of [["SGV$bG8=", 'isn\'t a Base64 character'], ["SGVsb", "length is invalid"], ["SG=sbG8=", "Padding"]]) {
    await input.fill(bad);
    await settle(page);
    check(`b64: invalid "${bad}" explained`, await page.getByRole("alert").filter({ hasText: msg }).isVisible());
  }
  await input.fill(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0xff]).toString("base64"));
  await settle(page);
  check("b64: binary detected → suggests File mode", await page.getByRole("alert").filter({ hasText: /PNG image/ }).isVisible());
  await input.fill("");
  await settle(page);
  check("b64: empty input → empty output", (await out.inputValue()) === "");
  await input.fill("SGVsbG8=");
  await settle(page);
  await btn(page, "Copy").click();
  check("b64: copy", (await clip(page)) === "Hello");
  const dl = await download(page, () => btn(page, ".txt").click());
  check("b64: download", dl.text === "Hello" && dl.name === "decoded.txt");

  // File mode
  await page.getByRole("radio", { name: "File", exact: true }).click();
  const fileBytes = readFileSync(new URL("./fixtures/transparent.png", import.meta.url));
  await page.locator('input[type="file"]').first().setInputFiles({ name: "t.png", mimeType: "image/png", buffer: fileBytes });
  await page.getByText(/Encoded t\.png/).waitFor({ timeout: 20000 });
  await btn(page, "Copy Base64").click();
  check("b64: file → Base64 exact", (await clip(page)) === fileBytes.toString("base64"));
  await btn(page, "Copy data URL").click();
  check("b64: data URL", (await clip(page)).startsWith("data:image/png;base64,iVBOR"));
  await page.getByRole("radio", { name: "Base64 → File" }).click();
  await page.locator("#b64-file-input").fill(fileBytes.toString("base64"));
  await page.getByText("PNG", { exact: true }).waitFor();
  const back = await download(page, () => btn(page, "Download file").click());
  check("b64: Base64 → file restores bytes + type", back.buf.equals(fileBytes) && back.name === "decoded-file.png", back.name);
  await page.close();
}

/* ---------------- 18 CSV → JSON ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/csv-to-json/");
  const input = page.locator("#csv-input");
  const out = page.locator("#csv-output");
  const json = async (csv: string) => {
    await input.fill(csv);
    await page.waitForTimeout(250);
    return out.inputValue();
  };
  const spec = await json("name,city,role\nAmit,Mumbai,Founder\nPriya,Delhi,Designer");
  check("csv: spec example (objects, pretty)", spec === JSON.stringify([{ name: "Amit", city: "Mumbai", role: "Founder" }, { name: "Priya", city: "Delhi", role: "Designer" }], null, 2));
  await btn(page, "Sample").click();
  await page.waitForTimeout(250);
  const sample = JSON.parse(await out.inputValue());
  check("csv: quoted commas, escaped quotes, multiline, empty, unicode", sample[0].notes === "Loves chai, hates meetings" && sample[1].notes === 'Says "less is more"' && sample[2].notes === "" && sample[3].notes === "Two-line\nnote" && sample[3].name === "Chloé");
  check("csv: preview table", (await page.getByTestId("csv-preview").locator("tbody tr").count()) === 4);
  const ragged = JSON.parse(await json("a,b,c\n1,2\n3,4,5,6"));
  check("csv: missing/extra cells kept + reported", ragged[1].column_4 === "6" && ragged[0].c === "" && (await page.getByText(/Row 2 has 2 cells; expected 3/).isVisible()));
  JSON.parse(await json("id,name,name\n1,A,B"));
  check("csv: duplicate headers renamed safely", (await out.inputValue()).includes('"name_2": "B"') && (await page.getByText(/Duplicate header "name"/).isVisible()));
  await input.fill("  ");
  await page.waitForTimeout(250);
  check("csv: empty file message", await page.getByRole("status").filter({ hasText: "no CSV data" }).isVisible());
  check("csv: semicolon auto-detect", JSON.parse(await json("name;price\nCafé;3,50"))[0].price === "3,50" && (await page.getByText("delimiter: semicolon (detected)").isVisible()));
  await page.locator("#csv-delim").selectOption("custom");
  await page.getByLabel("Custom delimiter").fill("~");
  check("csv: custom delimiter", JSON.parse(await json("a~b\n1~2"))[0].b === "2");
  await page.locator("#csv-delim").selectOption("auto");
  check("csv: tab-separated", JSON.parse(await json("a\tb\n1\t2"))[0].b === "2");
  await page.getByRole("switch", { name: /First row is headers/ }).uncheck({ force: true });
  check("csv: headers off", JSON.parse(await json("1,2\n3,4"))[1].column_2 === "4");
  await page.getByRole("switch", { name: /First row is headers/ }).check({ force: true });
  await page.getByRole("radio", { name: "Arrays" }).click();
  await page.getByRole("radio", { name: "Minified" }).click();
  check("csv: arrays + minified", (await json("a,b\n1,2")) === '[["a","b"],["1","2"]]');
  await page.getByRole("radio", { name: "Objects" }).click();
  await page.getByRole("switch", { name: /Convert numbers/ }).check({ force: true });
  await page.getByRole("switch", { name: /Empty cells as null/ }).check({ force: true });
  check("csv: types + null (keeps 007)", (await json("n,z,e,b\n3.5,007,,true")) === '[{"n":3.5,"z":"007","e":null,"b":true}]');
  await page.locator('input[aria-label="Open a CSV file"]').setInputFiles({ name: "people.csv", mimeType: "text/csv", buffer: Buffer.from("﻿nom,ville\nZoë,Zürich\n") });
  await page.waitForTimeout(400);
  const dl = await download(page, () => btn(page, "Download .json").click());
  check("csv: upload file (BOM, UTF-8) + download", dl.name === "people.json" && JSON.parse(dl.text)[0].nom === "Zoë", dl.name);
  await btn(page, "Copy JSON").click();
  check("csv: copy", (await clip(page)) === dl.text);
  await btn(page, "Reset").click();
  check("csv: reset", (await input.inputValue()) === "");
  await page.close();
}

/* ---------------- 19 Date Calculator ---------------- */
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
  check("date: Jan 2026 elapsed", (await dates("2026-01-01", "2026-01-31")) === "30 days");
  check("date: weekdays/weekends", (await res.innerText()).includes("Weekdays (Mon–Fri)\n22") && (await res.innerText()).includes("Weekend days\n8"));
  check("date: hours, minutes, weekdays of both dates", (await res.innerText()).includes("Hours\n720") && (await res.innerText()).includes("Minutes\n43,200") && (await res.innerText()).includes("End day\nSaturday"));
  await page.getByRole("switch", { name: /Include end date/ }).check({ force: true });
  check("date: inclusive count", (await main.innerText()).replace(/\s+/g, " ") === "31 days");
  await page.getByRole("switch", { name: /Include end date/ }).uncheck({ force: true });
  check("date: leap February", (await dates("2024-02-01", "2024-03-01")) === "29 days");
  check("date: year boundary", (await dates("2025-12-31", "2026-01-01")) === "1 day");
  check("date: reversed range", (await dates("2026-03-01", "2026-01-01")) === "59 days" && (await res.innerText()).includes("reverse order"));

  await page.getByRole("radio", { name: "Add / subtract" }).click();
  const shift = async (start: string, o: Record<string, string>, sub = false) => {
    await page.getByLabel("Start date", { exact: true }).fill(start);
    for (const k of ["years", "months", "weeks", "days"]) await page.getByLabel(k, { exact: true }).fill(o[k] ?? "");
    await page.getByRole("radio", { name: sub ? "Subtract" : "Add", exact: true }).click();
    await settle(page);
    return (await res.innerText()).replace(/\s+/g, " ");
  };
  check("date: 31 Jan + 1 month → 28 Feb", (await shift("2026-01-31", { months: "1" })).includes("28 February 2026 Saturday"));
  check("date: 29 Feb + 1 year → 28 Feb", (await shift("2024-02-29", { years: "1" })).includes("28 February 2025"));
  check("date: +90 days across year", (await shift("2025-11-15", { days: "90" })).includes("13 February 2026"));
  check("date: subtract 1 month from 31 Mar", (await shift("2026-03-31", { months: "1" }, true)).includes("28 February 2026"));
  await btn(page, "Copy result").click();
  check("date: copy summary", (await clip(page)).includes("− 1 month = Saturday, 28 February 2026"), await clip(page));

  await page.getByRole("radio", { name: "Business days" }).click();
  await dates("2026-12-01", "2026-12-31");
  await page.locator("textarea[id$='-hol']").fill("2026-12-25\n2026-12-26\n2027-01-01");
  await settle(page);
  const biz = (await res.innerText()).replace(/\s+/g, " ");
  check("date: business days with holidays", biz.startsWith("RESULT 22 business days") || biz.includes("22 business days"), biz.slice(0, 120));
  check("date: holiday breakdown", biz.includes("Holidays excluded 1") && biz.includes("fell on a weekend") && biz.includes("outside the date range"));
  await page.getByRole("button", { name: /^Sun–Thu/ }).click();
  await dates("2026-11-01", "2026-11-07");
  await page.locator("textarea[id$='-hol']").fill("");
  await settle(page);
  check("date: Fri–Sat weekend", (await main.innerText()).replace(/\s+/g, " ") === "5 business days");
  await page.locator("textarea[id$='-hol']").fill("25/12/2026");
  check("date: invalid holiday flagged", await page.getByText(/Not recognised: 25\/12\/2026/).isVisible());
  await page.close();
}

/* ---------------- 20 Loan EMI ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/emi-calculator/");
  const emi = page.getByTestId("emi-value");
  const totals = page.getByTestId("emi-totals");
  const set = async (p: string, r: string, n: string, unit: "Years" | "Months" = "Years") => {
    await page.getByLabel("Loan amount", { exact: true }).fill(p);
    await page.getByLabel("Interest rate (per year)", { exact: true }).fill(r);
    await page.getByRole("radio", { name: unit, exact: true }).click();
    await page.getByLabel("Loan tenure", { exact: true }).fill(n);
    await settle(page);
  };
  await set("1000000", "10", "20");
  check("emi: 10L @10% 20y = ₹9,650.22", (await emi.innerText()) === "₹9,650.22", await emi.innerText());
  const t = (await totals.innerText()).replace(/\s+/g, " ");
  check("emi: totals in Indian format", t.includes("₹10,00,000.00") && t.includes("Total interest ₹13,16,050.03") && t.includes("Total repayment ₹23,16,050.03"), t);
  check("emi: schedule 240 rows, ends at zero", (await page.getByTestId("emi-schedule").locator("tbody tr").count()) === 240 && (await page.getByTestId("emi-schedule").locator("tbody tr").last().innerText()).trim().endsWith("₹0.00"));
  await set("120000", "0", "12", "Months");
  check("emi: zero interest", (await emi.innerText()) === "₹10,000.00" && (await totals.innerText()).includes("₹0.00"));
  await set("500000", "8.75", "60", "Months");
  check("emi: decimal rate", (await emi.innerText()) === "₹10,318.62");
  await set("1000000000000", "12", "600", "Months");
  check("emi: very large loan finite", /^₹[\d,]+\.\d{2}$/.test(await emi.innerText()) && !(await page.locator("main").innerText()).includes("NaN"));
  await set("0", "10", "5");
  check("emi: zero principal rejected", await page.getByRole("alert").filter({ hasText: "greater than zero" }).isVisible());
  await set("100000", "10", "0");
  check("emi: zero tenure rejected", await page.getByRole("alert").filter({ hasText: "at least one month" }).isVisible());

  await set("1000000", "10", "20");
  await page.getByLabel("Processing fee (optional)", { exact: true }).fill("1");
  await settle(page);
  check("emi: processing fee + total cost", (await totals.innerText()).includes("₹10,000.00") && (await totals.innerText()).includes("₹13,26,050.03"));

  await page.getByRole("tab", { name: "Year-wise summary" }).click();
  check("emi: year-wise 20 rows", (await page.getByTestId("emi-yearly").locator("tbody tr").count()) === 20);

  await page.getByRole("tab", { name: "Prepayment" }).click();
  await page.getByLabel("Extra every month", { exact: true }).fill("2000");
  await page.getByLabel("One-time lump sum", { exact: true }).fill("100000");
  await page.getByLabel("Paid in month", { exact: true }).fill("12");
  await settle(page);
  const pre = (await page.getByTestId("emi-prepay").innerText()).replace(/\s+/g, " ");
  check("emi: prepayment → 127 months, saves interest", pre.includes("New tenure 127 months") && pre.includes("Months saved 113") && pre.includes("Interest with ₹5,75,982.99"), pre);
  await page.getByRole("tab", { name: "Amortization schedule" }).click();
  check("emi: schedule reflects prepayments", (await page.getByTestId("emi-schedule").locator("tbody tr").count()) === 127);
  await page.getByRole("switch", { name: /Include prepayments/ }).uncheck({ force: true });
  check("emi: toggle back to base schedule", (await page.getByTestId("emi-schedule").locator("tbody tr").count()) === 240);

  await page.getByRole("tab", { name: "Compare loans" }).click();
  await page.getByLabel("Loan B rate", { exact: true }).fill("9");
  await settle(page);
  const cmp = (await page.getByTestId("emi-compare").innerText()).replace(/\s+/g, " ");
  check("emi: comparison B @9%", cmp.includes("₹8,997.26") && cmp.includes("−₹652.96"), cmp.slice(0, 200));

  const csv = await download(page, () => btn(page, "Schedule CSV").click());
  const lines = csv.text.trim().split("\n");
  check("emi: CSV export", lines[1].startsWith("Month,Opening balance,EMI") && lines[2].startsWith("1,1000000.00,9650.22,1316.89,8333.33") && lines.length === 243, lines[2]);
  await btn(page, "Copy summary").click();
  check("emi: copy summary", (await clip(page)).includes("Monthly EMI: ₹9,650.22"));
  await page.evaluate(() => {
    (window as unknown as { __printed: boolean }).__printed = false;
    window.print = () => {
      (window as unknown as { __printed: boolean }).__printed = document.body.dataset.print === "emi";
    };
  });
  await btn(page, "Print").click();
  check("emi: print uses summary-only print mode", await page.evaluate(() => (window as unknown as { __printed: boolean }).__printed));
  await page.getByRole("combobox").filter({ hasText: "INR" }).selectOption("USD");
  await settle(page);
  check("emi: currency changes formatting only", (await emi.innerText()) === "$9,650.22");
  await page.close();
}

/* ---------------- Search / SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["url encode", "URL Encoder"], ["base64", "Base64"], ["csv to json", "CSV to JSON"], ["days between dates", "Days Between Dates"], ["home loan emi", "EMI Calculator"], ["working days", "Days Between Dates"]]) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const slugs = ["url-encoder-decoder", "base64-encoder-decoder", "csv-to-json", "days-between-dates", "emi-calculator"];
  for (const slug of slugs) {
    const h = await (await fetch(`${BASE}/${slug}/`)).text();
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
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((t) => types.includes(t)) &&
      h.includes("Worked examples") &&
      !/aggregateRating|"review"/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt include all 5", slugs.every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await page.close();
}

const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
