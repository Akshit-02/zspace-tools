// End-to-end tests for tools 46–50: CSV ↔ JSON, Number to Words, Text Diff
// Checker, Markdown Editor (TOC/draft additions) and File Hash Generator.
// Usage: NEXT_PUBLIC_GTM_ID= npm run build && npm start -- -p 3100 & npx tsx tests/e2e-12.mts
import { chromium, type Page } from "playwright";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const ORIGIN = new URL(BASE).origin;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1360, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
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
  const buf = readFileSync((await dl.path())!);
  return { name: dl.suggestedFilename(), text: buf.toString("utf8"), buf };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const radio = (page: Page, name: string | RegExp) => page.getByRole("radio", { name });
const settle = (page: Page, ms = 250) => page.waitForTimeout(ms);
const sha = (algo: string, data: Buffer | string) => createHash(algo).update(data).digest("hex");
const tmp = mkdtempSync(join(tmpdir(), "zs-e2e12-"));
/** Sets a large value in one input event (Playwright's fill() types huge strings slowly). */
async function setBig(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate((el: HTMLTextAreaElement, v: string) => {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
// Textarea values read back with LF line breaks; exact bytes (CRLF) are checked via downloads/clipboard.

/* ---------------- 46 CSV ↔ JSON ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/csv-to-json/");
  check("csv: H1 is the bidirectional name", (await page.locator("h1").innerText()) === "CSV to JSON & JSON to CSV Converter");

  // CSV → JSON still works (detailed coverage in e2e-4).
  await page.locator("#csv-input").fill('id\tnote\r\n1\t"tab\tinside"\r\n2\t\r\n');
  await settle(page, 400);
  const tsv = JSON.parse(await page.locator("#csv-output").inputValue());
  check("csv→json: TSV + CRLF + quoted tab + empty cell", tsv.length === 2 && tsv[0].note === "tab\tinside" && tsv[1].note === "");

  // JSON → CSV
  await radio(page, "JSON → CSV").click();
  const jin = page.locator("#json-input");
  const jout = page.locator("#j2c-output");
  check("j2c: switching keeps CSV input", (await page.locator("#csv-input").inputValue()).startsWith("id\tnote"));
  await btn(page, "Sample").click();
  await settle(page, 400);
  const shown = await jout.inputValue();
  check("j2c: sample → header with flattened columns", shown.split("\n")[0] === "id,name,city,active,address.pin,address.state,tags,notes", shown.split("\n")[0]);
  check("j2c: quotes/newlines escaped, arrays as JSON text", shown.includes('"Said ""bonjour"", then left"') && shown.includes('"Line one\nLine two"') && shown.includes('"[""founder"",""chai""]"'));
  check("j2c: preview table rendered", (await page.getByTestId("j2c-preview").locator("tbody tr").count()) === 3);
  check("j2c: missing-keys warning shown", await page.getByTestId("j2c-warnings").getByText(/don't have every column/).isVisible());

  const dl = await download(page, () => btn(page, "Download .csv").click());
  check("j2c: download .csv is CRLF with LF kept inside quoted cell", dl.name === "data.csv" && dl.text.startsWith("id,name,city,active,address.pin,address.state,tags,notes\r\n1,Amit Shah,") && dl.text.includes('"Line one\nLine two"\r\n') && dl.text.replace(/\r\n/g, "\n") === shown, dl.name);
  await btn(page, "Copy CSV").click();
  check("j2c: copy CSV equals download", (await clip(page)) === dl.text);

  await page.locator("#j2c-delim").selectOption(";");
  await page.getByRole("switch", { name: /Include header row/ }).uncheck({ force: true });
  await settle(page);
  check("j2c: semicolon + no header", (await jout.inputValue()).startsWith("1;Amit Shah;Mumbai;true;400001;Maharashtra;"));
  await page.getByRole("switch", { name: /Include header row/ }).check({ force: true });
  await page.locator("#j2c-delim").selectOption("\t");
  await settle(page);
  const tsvDl = await download(page, () => btn(page, "Download .tsv").click());
  check("j2c: tab delimiter downloads .tsv", tsvDl.name === "data.tsv" && tsvDl.text.startsWith("id\tname\t"));
  await page.locator("#j2c-delim").selectOption(",");

  await jin.fill('[{"f":"=SUM(A1:A9)","n":"-5"}]');
  await settle(page);
  check("j2c: formula warning, data unchanged", (await jout.inputValue()).includes("=SUM(A1:A9)") && (await page.getByText(/may run as a formula/).isVisible()));
  await page.getByRole("switch", { name: /Spreadsheet-safe export/ }).check({ force: true });
  await settle(page);
  check("j2c: spreadsheet-safe prefixes apostrophe only on formula", (await jout.inputValue()) === "f,n\n'=SUM(A1:A9),-5\n");
  await page.getByRole("switch", { name: /Spreadsheet-safe export/ }).uncheck({ force: true });

  await page.getByRole("switch", { name: /UTF-8 BOM/ }).check({ force: true });
  await jin.fill('[{"city":"Zürich","amount":"₹500"}]');
  await settle(page);
  const bom = await download(page, () => btn(page, "Download .csv").click());
  check("j2c: UTF-8 BOM in download", bom.buf[0] === 0xef && bom.buf[1] === 0xbb && bom.buf[2] === 0xbf && bom.text.includes("Zürich,₹500"));
  await page.getByRole("switch", { name: /UTF-8 BOM/ }).uncheck({ force: true });

  await jin.fill('{"meta":{"page":1},"data":[{"a":1},{"a":2}]}');
  await settle(page);
  await page.locator("#j2c-path").selectOption("data");
  await settle(page);
  check("j2c: records under a key", (await jout.inputValue()) === "a\n1\n2\n");
  await page.locator("#j2c-path").selectOption("");

  await jin.fill('[{"a": 1,}]');
  await settle(page);
  check("j2c: invalid JSON shows line/column", await page.getByRole("status").filter({ hasText: /Invalid JSON.*line 1, column/ }).isVisible());
  await jin.fill("");

  // A .json file opened on the CSV side switches direction.
  await radio(page, "CSV → JSON").click();
  await page.locator('input[aria-label="Open a CSV file"]').setInputFiles({ name: "people.json", mimeType: "application/json", buffer: Buffer.from('[{"x":"1"}]') });
  await settle(page, 500);
  check("j2c: .json file routes to JSON → CSV", (await radio(page, "JSON → CSV").getAttribute("aria-checked")) === "true" && (await jout.inputValue()) === "x\n1\n");
  await page.locator('input[aria-label="Open a JSON file"]').setInputFiles({ name: "bad.bin", mimeType: "application/octet-stream", buffer: Buffer.from([0, 1, 2, 0]) });
  await settle(page);
  check("j2c: unsupported file rejected", await page.getByText(/isn't a CSV, TSV, TXT or JSON file/).waitFor({ timeout: 5000 }).then(() => true, () => false));

  // Redirects
  const r1 = await page.goto(`${BASE}/csv-json-converter/`);
  check("csv: /csv-json-converter/ redirects to canonical page", r1?.url() === `${BASE}/csv-to-json/` && r1.status() === 200, r1?.url());
  await page.goto(`${BASE}/json-to-csv`);
  await page.waitForLoadState("networkidle");
  check("csv: /json-to-csv opens JSON → CSV", page.url().includes("/csv-to-json/") && (await radio(page, "JSON → CSV").getAttribute("aria-checked")) === "true");
  await page.close();
}

/* ---------------- 47 Number to Words ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/number-to-words/");
  const input = page.locator("#ntw-input");
  const words = () => page.getByTestId("ntw-words").innerText();
  await settle(page);
  check("ntw: default INR example", (await words()) === "Rupees One Lakh Twenty Five Thousand Only", await words());
  check("ntw: Indian grouping shown", (await page.getByTestId("ntw-formatted").innerText()) === "₹1,25,000.00");
  await input.fill("10000000");
  check("ntw: one crore", (await words()) === "Rupees One Crore Only");
  await radio(page, /^International/).click();
  check("ntw: switch system keeps value", (await input.inputValue()) === "10000000" && (await words()) === "Rupees Ten Million Only" && (await page.getByTestId("ntw-formatted").innerText()) === "₹10,000,000.00");
  await radio(page, /^Indian/).click();
  await input.fill("2,50,000.50");
  check("ntw: paise", (await words()) === "Rupees Two Lakh Fifty Thousand and Fifty Paise Only");
  await input.fill("10.005");
  check("ntw: rounding is explained", (await words()) === "Rupees Ten and One Paisa Only" && (await page.getByTestId("ntw-notes").innerText()).includes("rounded"));
  await page.locator("#ntw-currency").selectOption("USD");
  await input.fill("1234.56");
  check("ntw: USD switches to international + unit after", (await words()) === "One Thousand Two Hundred Thirty Four Dollars and Fifty Six Cents Only");
  await radio(page, /^Fraction/).click();
  check("ntw: cheque fraction", (await words()) === "One Thousand Two Hundred Thirty Four and 56/100 Dollars Only");
  await radio(page, /^Words/).click();
  await page.locator("#ntw-currency").selectOption("GBP");
  await input.fill("1.01");
  check("ntw: GBP singular penny", (await words()) === "One Pound and One Penny Only");
  await radio(page, "Number").click();
  await input.fill("-12.50");
  check("ntw: plain number mode, negative + decimals", (await words()) === "Minus Twelve Point Five");
  await radio(page, "UPPERCASE").click();
  check("ntw: uppercase", (await words()) === "MINUS TWELVE POINT FIVE");
  await radio(page, "Title Case").click();
  await input.fill("3,50");
  check("ntw: ambiguous decimal comma rejected", await page.getByRole("alert").filter({ hasText: /Check the commas/ }).isVisible());
  await input.fill("9999999999999999");
  check("ntw: out of range message", await page.getByRole("alert").filter({ hasText: /too large/ }).isVisible());
  await input.fill("100000");
  await btn(page, "Copy words").click();
  check("ntw: copy (system stayed international after USD)", (await clip(page)) === "One Hundred Thousand");
  await btn(page, "Clear input").click();
  check("ntw: clear", (await input.inputValue()) === "");
  await btn(page, "₹1.5 crore").click();
  check("ntw: example chip", (await words()) === "Rupees One Crore Fifty Lakh Only");

  await radio(page, "Bulk list").click();
  await page.locator("#ntw-bulk").fill("100\n\nabc\n1,25,000.5");
  await settle(page);
  check("ntw: bulk table", (await page.getByTestId("ntw-bulk-table").locator("tbody tr").count()) === 3);
  const csv = await download(page, () => btn(page, "CSV").click());
  const rows = csv.text.replace(/^﻿/, "").trim().split("\r\n");
  check("ntw: bulk CSV", csv.name === "amounts-in-words.csv" && rows.length === 4 && rows[0] === "line,input,formatted,words,error" && rows[3].includes("Rupees One Lakh Twenty Five Thousand and Fifty Paise Only") && rows[2].startsWith("3,abc,,,"), rows.join(" | "));
  await page.close();
}

/* ---------------- 48 Text Diff Checker ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/text-diff-checker/");
  const A = page.locator("#diff-a");
  const B = page.locator("#diff-b");
  const summary = page.getByTestId("diff-summary");
  const stat = async (label: RegExp) => Number((await page.getByTestId("diff-stats").locator("div").filter({ hasText: label }).locator("dd").innerText()).replace(/,/g, ""));

  await btn(page, "Example").click();
  await summary.waitFor();
  await settle(page, 400);
  check("diff: example stats", (await stat(/Lines added/)) === 6 && (await stat(/Lines removed/)) === 5 && (await stat(/Changed sections/)) === 2, `${await stat(/Lines added/)} / ${await stat(/Lines removed/)}`);
  const view = page.getByTestId("diff-view");
  const dels = await view.locator("del").allInnerTexts();
  const ins = await view.locator("ins").allInnerTexts();
  check("diff: word-level highlights", dels.includes("August") && ins.includes("July") && ins.some((t) => t.includes("🚀")), `${dels} | ${ins}`);
  check("diff: −/+ markers with screen-reader labels", (await view.getByText("Removed", { exact: true }).count()) > 0 && (await view.getByText("Added", { exact: true }).count()) > 0);

  await radio(page, "Character").click();
  await settle(page, 400);
  check("diff: character mode", (await view.locator("del").allInnerTexts()).includes("2") && (await view.locator("ins").allInnerTexts()).includes("7"));
  await radio(page, "Line").click();
  await settle(page, 400);
  check("diff: line mode has no inline highlights", (await view.locator("del, ins").count()) === 0);

  await radio(page, "Unified").click();
  await btn(page, "Copy unified diff").click();
  const u = await clip(page);
  check("diff: unified diff copied", u.startsWith("--- original\n+++ modified\n@@ ") && u.includes("-Our team shipped the new billing page in August.") && u.includes("+Our team shipped the new billing page in July."));
  const d = await download(page, () => btn(page, "Download .diff").click());
  check("diff: download .diff", d.name === "comparison.diff" && d.text === u);
  await btn(page, "Copy modified text").click();
  check("diff: copy modified text", (await clip(page)) === (await B.inputValue()));

  await A.fill("Hello World\n\nSecond line  ");
  await B.fill("hello world\nSecond line");
  await settle(page, 500);
  check("diff: case + blank + trailing space differ by default", !(await summary.innerText()).includes("No differences"));
  for (const l of ["Ignore case", "Ignore blank lines", "Ignore leading/trailing spaces"]) await page.getByLabel(l).check();
  await settle(page, 500);
  check("diff: ignore options → no differences", (await summary.innerText()).includes("No differences when ignoring"));
  check("diff: inputs untouched by ignore options", (await A.inputValue()) === "Hello World\n\nSecond line  ");
  for (const l of ["Ignore case", "Ignore blank lines", "Ignore leading/trailing spaces"]) await page.getByLabel(l).uncheck();

  await btn(page, "Swap").click();
  check("diff: swap", (await A.inputValue()) === "hello world\nSecond line" && (await B.inputValue()) === "Hello World\n\nSecond line  ");

  await A.fill("same\ntext");
  await B.fill("same\ntext");
  await settle(page, 400);
  check("diff: identical", (await summary.innerText()).includes("The texts are identical"));
  await A.fill("");
  await B.fill("only new");
  await settle(page, 400);
  check("diff: empty original", (await stat(/Lines added/)) === 1 && (await stat(/Lines removed/)) === 0);

  await A.fill('<img src=x onerror="window.__x=1"><script>window.__x=2</script>');
  await B.fill("<b>bold</b>");
  await settle(page, 500);
  check("diff: HTML shown as text, never executed", (await view.locator("img, script, b").count()) === 0 && (await page.evaluate(() => (window as unknown as { __x?: number }).__x)) === undefined && (await view.innerText()).includes("<script>"));

  // Collapsed unchanged lines
  const many = Array.from({ length: 200 }, (_, i) => `line ${i}`);
  await A.fill(many.join("\n"));
  await B.fill(many.map((l, i) => (i === 100 ? "CHANGED" : l)).join("\n"));
  await settle(page, 600);
  const gap = page.getByRole("button", { name: /Show \d+ unchanged lines/ }).first();
  check("diff: unchanged lines collapsed", (await gap.innerText()).includes("Show 97 unchanged lines"));
  await gap.click();
  check("diff: expand collapsed block", (await page.getByRole("button", { name: /Show \d+ unchanged lines/ }).count()) === 1);

  // Large input waits for Compare.
  const big = Array.from({ length: 12000 }, (_, i) => `Paragraph ${i}: the quick brown fox jumps over the lazy dog.`).join("\n");
  await setBig(page, "#diff-a", big);
  await setBig(page, "#diff-b", big.replace("Paragraph 6000:", "Paragraph six thousand:"));
  await settle(page, 600);
  check("diff: large text asks for Compare", await page.getByText(/press Compare to update/i).isVisible());
  await btn(page, "Compare").click();
  await page.getByText("1 changed section").waitFor({ timeout: 20000 });
  check("diff: large compare via worker", (await stat(/Lines added/)) === 1 && (await stat(/Lines removed/)) === 1);

  // File upload (CRLF) vs pasted LF
  await A.fill("");
  await B.fill("");
  await page.locator('input[aria-label="Open a text file as the original text"]').setInputFiles({ name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("one\r\ntwo\r\n") });
  await B.fill("one\ntwo\n");
  await settle(page, 500);
  check("diff: CRLF file vs LF text equal with normalization + note", (await summary.innerText()).includes("No differences") && (await summary.innerText()).includes("Line endings differ"));
  await page.getByLabel("Normalize line endings").uncheck();
  await settle(page, 500);
  check("diff: CRLF reported when not normalized", (await stat(/Lines removed/)) === 2);
  await page.locator('input[aria-label="Open a text file as the modified text"]').setInputFiles({ name: "x.bin", mimeType: "application/octet-stream", buffer: Buffer.from([0x50, 0, 0, 1]) });
  check("diff: binary file rejected", await page.getByText(/looks like a binary file/).waitFor({ timeout: 5000 }).then(() => true, () => false));
  await btn(page, "Clear comparison").click();
  check("diff: clear comparison", (await page.getByTestId("diff-summary").count()) === 0);
  await page.close();
}

/* ---------------- 49 Markdown (additions) ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/markdown-editor/");
  const input = page.locator("#md-input");
  const preview = page.getByTestId("md-preview");
  await input.fill("# Intro\n\n## Setup steps\n\nText\n\n## Setup steps\n\n### नमस्ते\n\n- [ ] task\n  - nested");
  await settle(page, 400);
  await page.getByRole("button", { name: "Contents" }).click();
  await settle(page, 400);
  const toc = page.getByTestId("md-toc");
  check("md: TOC lists headings", (await toc.locator("a").allInnerTexts()).join("|") === "Intro|Setup steps|Setup steps|नमस्ते");
  check("md: unique heading ids", (await preview.locator("h2").evaluateAll((els) => els.map((e) => e.id))).join(",") === "md-setup-steps,md-setup-steps-2");
  check("md: nested list rendered", (await preview.locator("li ul li").count()) === 1);
  await toc.getByRole("link", { name: "नमस्ते" }).click();
  check("md: TOC link doesn't change page URL", !page.url().includes("#"));
  const ex = await download(page, () => btn(page, "Export HTML").click());
  check("md: export includes TOC + anchors", ex.text.includes('<nav aria-label="Table of contents">') && ex.text.includes('href="#md-setup-steps-2"') && ex.text.includes('id="md-setup-steps-2"'));
  await page.getByRole("button", { name: "Contents" }).click();
  await btn(page, "Copy HTML").click();
  check("md: HTML without TOC has no ids", (await clip(page)).includes("<h1>Intro</h1>"));

  await input.fill("x");
  await input.press("ControlOrMeta+a");
  await input.press("ControlOrMeta+b");
  check("md: Ctrl/⌘+B shortcut", (await input.inputValue()) === "**x**");
  await input.fill("[a](javascript:alert(1))");
  await settle(page, 400);
  check("md: javascript: link not rendered", (await preview.locator("a").count()) === 0);

  // Large document is still rendered (debounced).
  const bigMd = Array.from({ length: 3000 }, (_, i) => `## Section ${i}\n\nSome **bold** text.`).join("\n\n");
  await setBig(page, "#md-input", bigMd);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="md-preview"] h2').length === 3000, null, { timeout: 15000 });
  check("md: large document renders", true);

  await page.getByRole("switch", { name: /Keep draft/ }).check({ force: true });
  await settle(page, 300);
  check("md: draft stored locally", (await page.evaluate(() => localStorage.getItem("zs-markdown-draft")))?.startsWith("## Section 0") === true);
  await btn(page, "Delete saved draft").click();
  check("md: delete saved draft", (await page.evaluate(() => [localStorage.getItem("zs-markdown-draft"), localStorage.getItem("zs-markdown-draft-on")])).every((v) => v === null));

  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page, 300);
  check("md: mobile Write/Preview tabs", (await radio(page, "Write").isVisible()) && (await radio(page, "Preview").isVisible()));
  await page.close();
}

/* ---------------- 50 File Hash Generator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/file-hash-generator/");
  await radio(page, "Text").click();
  const th = page.getByTestId("text-hash");
  const text = async () => {
    await settle(page, 350);
    return th.innerText();
  };
  check("hash: empty text SHA-256", (await text()) === sha("sha256", ""));
  await page.locator("#hash-text").fill("abc");
  check("hash: text SHA-256 'abc'", (await text()) === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  await radio(page, /^SHA-384/).click();
  check("hash: SHA-384", (await text()) === sha("sha384", "abc"));
  await radio(page, /^SHA-512/).click();
  check("hash: SHA-512", (await text()) === sha("sha512", "abc"));
  await radio(page, /^SHA-1/).click();
  check("hash: SHA-1 + legacy warning", (await text()) === sha("sha1", "abc") && (await page.getByText("SHA-1 is a legacy algorithm and should not be used for modern cryptographic security.").isVisible()));
  await radio(page, /^SHA-256/).click();
  await page.locator("#hash-text").fill("नमस्ते 🌏");
  check("hash: unicode text as UTF-8", (await text()) === sha("sha256", "नमस्ते 🌏"));
  await page.getByRole("switch", { name: /Uppercase/ }).check({ force: true });
  check("hash: uppercase output", (await text()) === sha("sha256", "नमस्ते 🌏").toUpperCase());
  await page.getByRole("switch", { name: /Uppercase/ }).uncheck({ force: true });
  const exp = page.locator("#hash-expected");
  await exp.fill(`  ${sha("sha256", "नमस्ते 🌏").toUpperCase()}  `);
  await settle(page);
  check("hash: text verify match (case/space-insensitive)", await page.getByText("Match", { exact: true }).isVisible());
  await exp.fill("0".repeat(64));
  await settle(page);
  check("hash: text verify mismatch", await page.getByText("Does not match", { exact: true }).isVisible());
  await exp.fill("z".repeat(64));
  check("hash: invalid expected", await page.getByRole("alert").filter({ hasText: /Invalid expected hash/ }).isVisible());
  await exp.fill("a".repeat(128));
  check("hash: other-algorithm length explained", await page.getByRole("alert").filter({ hasText: /matches SHA-512/ }).isVisible());
  await exp.fill("");

  // Files
  await radio(page, "Files").click();
  const f1 = randomBytes(300_000);
  const f2 = Buffer.from("hello\n");
  await page.locator('input[type="file"]').first().setInputFiles([
    { name: "setup.bin", mimeType: "application/octet-stream", buffer: f1 },
    { name: "notes.txt", mimeType: "text/plain", buffer: f2 },
  ]);
  await page.getByText("2 of 2 files hashed").waitFor({ timeout: 20000 });
  const hashes = await page.getByTestId("file-hash").allInnerTexts();
  check("hash: two files hashed correctly", hashes[0] === sha("sha256", f1) && hashes[1] === sha("sha256", f2));
  await exp.fill(`${sha("sha256", f1)}  setup.bin\n${"b".repeat(64)} *notes.txt`);
  await settle(page);
  const results = page.getByTestId("hash-results");
  check("hash: checksum list verifies per file", (await results.getByText("Match", { exact: true }).count()) === 1 && (await results.getByText("Does not match", { exact: true }).count()) === 1);
  const csv = await download(page, () => btn(page, "Export CSV").click());
  const rows = csv.text.trim().split("\r\n");
  check("hash: CSV export", csv.name === "checksums-sha256.csv" && rows[0] === "file_name,size_bytes,algorithm,hash,expected,result" && rows[1] === `setup.bin,300000,SHA-256,${sha("sha256", f1)},${sha("sha256", f1)},match` && rows[2].endsWith(",mismatch"), rows.join(" | "));
  await radio(page, /^SHA-512/).click();
  await page.getByText("2 of 2 files hashed").waitFor({ timeout: 20000 });
  check("hash: algorithm change re-hashes", (await page.getByTestId("file-hash").allInnerTexts())[1] === sha("sha512", f2));
  check("hash: expected list rejected for other algorithm length", await page.getByRole("alert").filter({ hasText: /Invalid expected hash/ }).isVisible());
  await exp.fill("");
  await radio(page, /^SHA-256/).click();
  await btn(page, "Clear").click();

  // Large file: > 64 MB goes through the streaming implementation.
  const bigPath = join(tmp, "big.bin");
  const big = randomBytes(70 * 1024 * 1024);
  writeFileSync(bigPath, big);
  await page.locator('input[type="file"]').first().setInputFiles(bigPath);
  await page.getByText("1 of 1 file hashed").waitFor({ timeout: 120000 });
  check("hash: 70 MB file streamed in chunks = OpenSSL", (await page.getByTestId("file-hash").innerText()) === sha("sha256", big));
  await btn(page, "Clear").click();

  await page.close();
}

/* ---------------- Unsupported Web Crypto ---------------- */
{
  const page = await ctx.newPage();
  await page.addInitScript(() => Object.defineProperty(window.crypto, "subtle", { value: undefined, configurable: true }));
  await open(page, "/file-hash-generator/");
  check("hash: notice when Web Crypto unavailable", await page.getByText(/doesn.t offer the Web Crypto API/).isVisible());
  await radio(page, "Text").click();
  await page.locator("#hash-text").fill("abc");
  await settle(page, 400);
  check("hash: JS fallback gives same result", (await page.getByTestId("text-hash").innerText()) === sha("sha256", "abc"));
  await page.close();
}

/* ---------------- SEO, discovery, mobile ---------------- */
{
  const page = await ctx.newPage();
  const expect: Record<string, string> = {
    "csv-to-json": "CSV to JSON Converter – Convert CSV and JSON Online Free",
    "number-to-words": "Number to Words Converter – Indian Rupees, Lakh &amp; Crore",
    "text-diff-checker": "Text Diff Checker – Compare Two Texts Online Free",
    "markdown-editor": "Free Online Markdown Editor with Live Preview",
    "file-hash-generator": "SHA256 File Hash Generator &amp; Checksum Verifier Online",
  };
  const descs = new Set<string>();
  for (const [slug, title] of Object.entries(expect)) {
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
    const desc = h.match(/<meta name="description" content="(.*?)"/)?.[1] ?? "";
    descs.add(desc);
    const ok =
      h.includes(`<title>${title}</title>`) &&
      (h.match(/<h1/g) ?? []).length === 1 &&
      new URL(/<link rel="canonical" href="([^"]+)"/.exec(h)?.[1] ?? "x:").pathname === `/${slug}/` &&
      h.includes('property="og:title"') &&
      h.includes('property="og:description"') &&
      h.includes('name="twitter:card"') &&
      !/name="robots" content="[^"]*noindex/.test(h) &&
      ldOk &&
      ["BreadcrumbList", "WebApplication", "FAQPage"].every((t) => types.includes(t)) &&
      !/aggregateRating|"review"/i.test(h) &&
      desc.length > 50;
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
  }
  check("seo: meta descriptions unique", descs.size === 5);
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  const full = await (await fetch(`${BASE}/llms-full.txt`)).text();
  const slugs = Object.keys(expect);
  check("seo: sitemap includes all 5 canonical URLs", slugs.every((s) => sm.includes(`/${s}/</loc>`)));
  const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  check("seo: sitemap has no redirect/query URLs", locs.length > 50 && locs.every((l) => !l.includes("?") && !/csv-json-converter|json-to-csv/.test(l)), `${locs.length} URLs`);
  check("seo: llms.txt + llms-full.txt list all 5", slugs.every((s) => llms.includes(`/${s}/)`) && full.includes(`/${s}/`)) && !llms.includes("JSON to CSV Converter (Developer"));
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check("seo: robots.txt still served with sitemap", robots.includes("Sitemap:"));

  await open(page, "/all-tools/");
  const dir = await page.content();
  check("directory: all 5 linked", slugs.every((s) => dir.includes(`href="/${s}/"`)));
  await open(page, "/");
  const home = await page.content();
  check("home: new tools listed", ["number-to-words", "text-diff-checker", "file-hash-generator"].every((s) => home.includes(`href="/${s}/"`)) && home.includes("Less effort"));
  await open(page, "/gst-calculator/");
  check("related: invoice ↔ number-to-words link exists on invoice page", (await (await fetch(`${BASE}/invoice-generator/`)).text()).includes('href="/number-to-words/"'));

  await page.setViewportSize({ width: 360, height: 780 });
  for (const s of slugs) {
    await open(page, `/${s}/`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`mobile 360px: /${s}/ has no horizontal overflow`, overflow <= 0, String(overflow));
  }
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
