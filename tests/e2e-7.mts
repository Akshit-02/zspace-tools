// End-to-end tests for the "fifth tool expansion" brief: Regex Tester, HTML Formatter,
// CSS Minifier, Discount Calculator and the Color Picker upgrade (alpha, sliders, CSS).
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
  return { name: dl.suggestedFilename(), text: readFileSync((await dl.path())!, "utf8") };
}
const clip = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
const btn = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const settle = (page: Page, ms = 400) => page.waitForTimeout(ms);
const text = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ");

/* ---------------- Regex Tester ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/regex-tester/");
  const pat = page.locator("#regex-pattern");
  const flags = page.locator("#regex-flags");
  const input = page.locator("#regex-text");
  await pat.fill(String.raw`\d+`);
  await input.fill("10 apples, 20 pears and 300 plums");
  await settle(page);
  check("regex: live matches with g", (await text(page, "regex-status")).includes("3 matches"), await text(page, "regex-status"));
  check("regex: highlighted marks", (await page.getByTestId("regex-highlight").locator("mark").count()) === 3);
  await btn(page, "g Global").click();
  await settle(page);
  check("regex: toggling g off → 1 match + hint", (await flags.inputValue()) === "" && (await text(page, "regex-status")).includes("1 match") && (await text(page, "regex-status")).includes("Add the g flag"));
  await btn(page, "g Global").click();
  await btn(page, "i Ignore case").click();
  check("regex: flag order normalised", (await flags.inputValue()) === "gi");
  await pat.fill("APPLES");
  await settle(page);
  check("regex: i flag", (await text(page, "regex-status")).includes("1 match"));
  await pat.fill("(abc");
  await settle(page);
  check("regex: invalid pattern error", /Invalid pattern\. .*(Unterminated group|missing)/i.test(await text(page, "regex-status")), await text(page, "regex-status"));
  await flags.fill("gq");
  await pat.fill("a");
  await settle(page);
  check("regex: invalid flag error", (await text(page, "regex-status")).includes("Unknown flag"));
  await flags.fill("g");
  await pat.fill("zzz");
  await settle(page);
  check("regex: no matches state", (await text(page, "regex-status")).includes("No matches"));
  // Named groups + group list
  await page.locator("#regex-example").selectOption("date");
  await settle(page);
  const list = await text(page, "regex-matches");
  check("regex: example loads + named groups listed", (await pat.inputValue()).includes("?<year>") && list.includes("year 2026") && list.includes("month 11") && list.includes("day 12"), list.slice(0, 120));
  check("regex: example explanation shown", await page.getByText(/doesn't know month lengths/).isVisible());
  check("regex: invalid month not matched", !list.includes("2026-13-01"));
  await btn(page, "Copy regex").click();
  check("regex: copy regex literal", (await clip(page)) === String.raw`/\b(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])\b/g`, await clip(page));
  await btn(page, "Copy matches").click();
  check("regex: copy matches", (await clip(page)) === "2026-11-12\n2027-02-28");
  const rep = await download(page, () => btn(page, "TXT").click());
  check("regex: TXT report", rep.name === "regex-matches.txt" && rep.text.includes("Matches: 2") && rep.text.includes('year (group 1): "2026"'), rep.text.slice(0, 80));
  // PIN example
  await page.locator("#regex-example").selectOption("pin");
  await settle(page);
  check("regex: Indian PIN example", (await page.getByTestId("regex-highlight").locator("mark").allInnerTexts()).join("|") === "560001|400 013");
  // Multiline / dot-all / sticky / unicode
  await pat.fill(String.raw`^\w+$`);
  await flags.fill("g");
  await input.fill("one\ntwo\nthree");
  await settle(page);
  check("regex: without m no match", (await text(page, "regex-status")).includes("No matches"));
  await btn(page, "m Multiline").click();
  await settle(page);
  check("regex: m flag → 3 matches", (await text(page, "regex-status")).includes("3 matches"));
  await pat.fill("one.two");
  await settle(page);
  check("regex: . doesn't cross newline", (await text(page, "regex-status")).includes("No matches"));
  await btn(page, "s Dot all").click();
  await settle(page);
  check("regex: s flag crosses newline", (await text(page, "regex-status")).includes("1 match"));
  // Zero-length + empty match
  await flags.fill("g");
  await pat.fill("");
  await pat.fill("x*");
  await input.fill("abc");
  await settle(page);
  check("regex: zero-length matches terminate", (await text(page, "regex-status")).includes("4 matches"));
  // Catastrophic backtracking → timeout, page stays responsive
  await pat.fill("^(a+)+$");
  await input.fill("a".repeat(40) + "!");
  await page.waitForTimeout(2300);
  check("regex: catastrophic pattern stopped", (await text(page, "regex-status")).includes("Stopped after 1.5 seconds"), await text(page, "regex-status"));
  await pat.fill("a+");
  await settle(page);
  check("regex: recovers after timeout", (await text(page, "regex-status")).includes("1 match"));
  // Big input
  await page.evaluate(() => {
    const el = document.querySelector<HTMLTextAreaElement>("#regex-text")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(el, "word ".repeat(30000));
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await pat.fill(String.raw`\w+`);
  await page.waitForTimeout(1200);
  const big = await text(page, "regex-status");
  check("regex: 150k chars → stops at 5,000 matches", big.includes("5,000 matches+") && big.includes("Stopped at 5,000"), big);
  check("regex: HTML in text not rendered", await (async () => {
    await input.fill('<img src=x onerror="window.__x=1"><b>bold</b>');
    await pat.fill("b");
    await settle(page);
    return (await page.evaluate(() => (window as unknown as { __x?: number }).__x)) === undefined && (await page.getByTestId("regex-highlight").innerText()).includes("<b>bold</b>");
  })());
  await btn(page, "Reset").click();
  check("regex: reset", (await pat.inputValue()) === "" && (await input.inputValue()) === "" && (await flags.inputValue()) === "g");
  await page.close();
}

/* ---------------- HTML Formatter ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/html-formatter/");
  const input = page.locator("#html-formatter-input");
  const output = page.locator("#html-formatter-output");
  await input.fill("<ul><li>One<li>Two</ul><pre>  keep\n    me  </pre>");
  await btn(page, "Beautify").click();
  await settle(page);
  check("html: beautify", (await output.inputValue()).startsWith("<ul>\n  <li>One</li>\n  <li>Two</li>\n</ul>") && (await output.inputValue()).includes("<pre>  keep\n    me  </pre>"), await output.inputValue());
  await page.getByRole("radio", { name: "4 spaces" }).click();
  await settle(page);
  check("html: 4-space indent", (await output.inputValue()).includes("\n    <li>One</li>"));
  await page.getByRole("radio", { name: "Tab" }).click();
  await settle(page);
  check("html: tab indent", (await output.inputValue()).includes("\n\t<li>One</li>"));
  await input.fill("<div>\n  <!-- note -->\n  <p>Hi   there</p>\n</div>");
  await btn(page, "Minify").click();
  await settle(page);
  check("html: minify keeps comments by default", (await output.inputValue()) === "<div><!-- note --><p>Hi there</p></div>", await output.inputValue());
  await page.getByRole("switch", { name: /Keep comments/ }).uncheck({ force: true });
  await settle(page);
  check("html: minify strips comments", (await output.inputValue()) === "<div><p>Hi there</p></div>");
  const sum = await text(page, "size-summary");
  check("html: size comparison", /Original .* Minified .* Difference \d+(\.\d)?% smaller/.test(sum), sum);
  check("html: no-issue status", (await text(page, "issues")).includes("No structural problems"));
  await input.fill("<div><span>Hi</div>\n</section>");
  await settle(page);
  const iss = await text(page, "issues");
  check("html: issues listed with lines", iss.includes("possible issue") && /span/.test(iss) && /section/.test(iss) && iss.includes("line 2"), iss);
  await input.fill('<script>window.__html=1</script><img src=x onerror="window.__html=2">');
  await settle(page);
  check("html: input never executed", (await page.evaluate(() => (window as unknown as { __html?: number }).__html)) === undefined);
  await page.locator('input[type=file][aria-label="Open an .html file"]').setInputFiles({ name: "page.html", mimeType: "text/html", buffer: Buffer.from("<html><body><h1>Title</h1></body></html>") });
  await settle(page);
  check("html: open .html file", (await input.inputValue()).includes("<h1>Title</h1>") && (await output.inputValue()).length > 0);
  const dl = await download(page, () => btn(page, "Download").click());
  check("html: download .min.html", dl.name === "index.min.html" && dl.text.includes("<h1>Title</h1>"), dl.name);
  await btn(page, "Beautify").click();
  await settle(page);
  const dl2 = await download(page, () => btn(page, "Download").click());
  check("html: download beautified .html", dl2.name === "index.html" && dl2.text.includes("\n"));
  await btn(page, "Copy").click();
  check("html: copy output", (await clip(page)) === (await output.inputValue()));
  await btn(page, "Sample").click();
  await settle(page);
  check("html: sample beautifies", (await output.inputValue()).split("\n").length > 10);
  await btn(page, "Reset").click();
  check("html: reset", (await input.inputValue()) === "" && (await output.inputValue()) === "");
  await page.close();
}

/* ---------------- CSS Minifier ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/css-minifier/");
  const input = page.locator("#css-minifier-input");
  const output = page.locator("#css-minifier-output");
  const css = '/*! MIT */\n/* note */\n.a  >  .b , .c:hover {\n  color : #FFFFFF ;\n  margin : 0px 0px ;\n  content : "a } b" ;\n  width : calc( 100%  -  2px ) ;\n}\n';
  await input.fill(css);
  await btn(page, "Minify").click();
  await settle(page);
  check("css: minify keeps /*! */ only", (await output.inputValue()) === '/*! MIT */\n.a>.b,.c:hover{color:#fff;margin:0 0;content:"a } b";width:calc(100% - 2px)}', await output.inputValue());
  check("css: size saved shown", /\d+(\.\d)?% smaller/.test(await text(page, "size-summary")));
  await page.getByRole("radio", { name: "Remove" }).click();
  await settle(page);
  check("css: remove all comments", !(await output.inputValue()).includes("/*"));
  await page.getByRole("radio", { name: "Keep all" }).click();
  await settle(page);
  check("css: keep all comments", (await output.inputValue()).includes("/* note */") && (await output.inputValue()).includes("calc(100% - 2px)"), await output.inputValue());
  await page.getByRole("radio", { name: "Keep /*! */" }).click();
  await page.getByRole("switch", { name: /Keep final semicolons/ }).check({ force: true });
  await settle(page);
  check("css: final semicolon kept", (await output.inputValue()).endsWith("2px);}"));
  await page.getByRole("switch", { name: /Keep final semicolons/ }).uncheck({ force: true });
  await btn(page, "Beautify").click();
  await settle(page);
  const pretty = await output.inputValue();
  check("css: beautify", pretty.includes(".a > .b,\n.c:hover {\n  color: #FFFFFF;") && pretty.includes('  content: "a } b";'), pretty);
  await page.getByRole("radio", { name: "4 spaces" }).click();
  await settle(page);
  check("css: beautify 4 spaces", (await output.inputValue()).includes("\n    color: #FFFFFF;"));
  await input.fill("a { color: red; \n b { margin: }");
  await settle(page);
  const iss = await text(page, "issues");
  check("css: syntax issues reported", iss.includes("missing a closing") && iss.includes("line 2"), iss);
  check("css: output still produced on errors", (await output.inputValue()).length > 0);
  await page.locator('input[type=file][aria-label="Open a .css file"]').setInputFiles({ name: "site.css", mimeType: "text/css", buffer: Buffer.from(".x { color : red ; }\n") });
  await btn(page, "Minify").click();
  await settle(page);
  check("css: open .css file", (await output.inputValue()) === ".x{color:red}");
  const dl = await download(page, () => btn(page, "Download").click());
  check("css: download styles.min.css", dl.name === "styles.min.css" && dl.text === ".x{color:red}");
  await input.fill("a{b:c}");
  await settle(page);
  check("css: already-minified → honest result", /No change|larger|smaller/.test(await text(page, "size-summary")));
  await btn(page, "Sample").click();
  await settle(page);
  check("css: sample works with no issues", (await output.inputValue()).length > 100 && (await text(page, "issues")).includes("No structural problems"), await text(page, "issues"));
  await page.close();
}

/* ---------------- Discount Calculator ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/discount-calculator/");
  const res = () => text(page, "discount-result");
  await page.locator("#disc-price").fill("2499");
  await btn(page, "30%").click();
  await settle(page, 150);
  let r = await res();
  check("disc: 30% off ₹2,499", r.includes("Final price ₹1,749.30") && r.includes("You save ₹749.70"), r);
  await page.locator("#disc-pct").fill("120");
  check("disc: >100% explained", (await res()).includes("above 100%"));
  await page.locator("#disc-pct").fill("abc");
  check("disc: invalid input", (await res()).includes("must be a number"));
  await page.locator("#disc-pct").fill("0");
  check("disc: 0% discount", (await res()).includes("Final price ₹2,499.00"));
  await page.locator("#disc-pct").fill("100");
  check("disc: 100% discount", (await res()).includes("Final price ₹0.00"));
  await page.getByRole("radio", { name: /Find discount %/ }).click();
  await page.locator("#disc-final").fill("750");
  await page.locator("#disc-price").fill("1000");
  check("disc: reverse → 25%", (await res()).includes("Discount 25%") && (await res()).includes("You save ₹250.00"), await res());
  await page.locator("#disc-final").fill("1200");
  check("disc: reverse increase", (await res()).includes("Price increase 20%") && (await res()).includes("price increase, not a discount"));
  await page.getByRole("radio", { name: /Successive/ }).click();
  await page.locator("#disc-price").fill("10000");
  await page.locator("#disc-step-0").fill("20");
  await page.locator("#disc-step-1").fill("10");
  r = await res();
  check("disc: successive ₹7,200 / 28%", r.includes("Final price ₹7,200.00") && r.includes("Effective discount 28%") && r.includes("not 30%"), r);
  await btn(page, "Add another discount").click();
  await page.locator("#disc-step-2").fill("5");
  check("disc: third successive discount", (await res()).includes("₹6,840.00"));
  await btn(page, "Remove discount 3").click();
  check("disc: remove discount", (await res()).includes("₹7,200.00"));
  await page.getByRole("radio", { name: /Original price/ }).click();
  await page.locator("#disc-final").fill("750");
  await page.locator("#disc-pct").fill("25");
  check("disc: original price ₹1,000", (await res()).includes("Original price ₹1,000.00"));
  await page.getByRole("radio", { name: /Markup & discount/ }).click();
  await page.locator("#disc-cost").fill("500");
  await page.locator("#disc-markup").fill("40");
  await page.locator("#disc-pct").fill("10");
  r = await res();
  check("disc: markup → profit/markup/margin", r.includes("Selling price ₹630.00") && r.includes("Profit ₹130.00") && r.includes("Profit on cost (markup achieved) 26%") && r.includes("Margin on selling price 20.63%"), r);
  await page.locator("#disc-markup").fill("10");
  await page.locator("#disc-pct").fill("20");
  check("disc: loss shown", (await res()).includes("Loss ₹60.00"));
  await page.getByLabel("Currency").selectOption("USD");
  check("disc: currency switch", (await res()).includes("$440.00"));
  await btn(page, "Copy summary").click();
  const s = await clip(page);
  check("disc: copy summary", s.includes("Markup & discount") && s.includes("Selling price: $440.00"), s);
  const dl = await download(page, () => btn(page, "Download .txt").click());
  check("disc: download summary", dl.name === "discount-summary.txt" && dl.text.includes("Loss: $60.00"));
  await btn(page, "Reset").click();
  check("disc: reset", (await page.locator("#disc-cost").inputValue()) === "" && (await res()).includes("Enter the values"));
  await page.close();
}

/* ---------------- Color Picker upgrade ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/color-picker/");
  const hex = page.locator("#cp-hex");
  const rgb = page.locator("#cp-rgb");
  const hsl = page.locator("#cp-hsl");
  const typeIn = async (loc: typeof hex, v: string) => {
    await loc.click();
    await loc.fill(v);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await settle(page, 150);
  };
  await typeIn(hex, "#F0784580");
  check("color: 8-digit HEX → RGBA/HSLA", (await rgb.inputValue()) === "rgba(240, 120, 69, 0.5)" && (await hsl.inputValue()) === "hsla(18, 85%, 61%, 0.5)", `${await rgb.inputValue()} ${await hsl.inputValue()}`);
  check("color: alpha slider follows", (await page.locator("#cp-a").inputValue()) === "50");
  await typeIn(hex, "#F80C");
  check("color: 4-digit HEX", (await hex.inputValue()) === "#FF8800CC" && (await rgb.inputValue()) === "rgba(255, 136, 0, 0.8)");
  await typeIn(rgb, "rgb(51 102 153 / 25%)");
  check("color: modern rgb() with alpha", (await hex.inputValue()) === "#33669940");
  await typeIn(hsl, "hsl(210, 50%, 40%)");
  check("color: opaque HSL resets alpha", (await hex.inputValue()) === "#336699" && (await rgb.inputValue()) === "rgb(51, 102, 153)");
  await page.locator("#cp-h").fill("0");
  await settle(page, 150);
  check("color: hue slider", (await hsl.inputValue()) === "hsl(0, 50%, 40%)" && (await hex.inputValue()) === "#993333", await hex.inputValue());
  await page.locator("#cp-s").fill("0");
  await page.locator("#cp-h").fill("120");
  await settle(page, 150);
  check("color: hue remembered at 0% saturation", (await page.locator("#cp-h").inputValue()) === "120");
  await page.locator("#cp-s").fill("100");
  await page.locator("#cp-l").fill("50");
  await settle(page, 150);
  check("color: saturation & lightness sliders", (await hex.inputValue()) === "#00FF00", await hex.inputValue());
  await page.locator("#cp-a").fill("25");
  await settle(page, 150);
  check("color: alpha slider → HEX8/RGBA", (await hex.inputValue()) === "#00FF0040" && (await rgb.inputValue()) === "rgba(0, 255, 0, 0.25)");
  const snip = await text(page, "css-snippets");
  check("color: CSS snippets", snip.includes("color: #00FF0040;") && snip.includes("background-color: rgba(0, 255, 0, 0.25);"), snip);
  await btn(page, "Copy CSS variables").click();
  const vars = await clip(page);
  check("color: copy CSS variables", vars.startsWith(":root {\n  --color-base: #00FF0040;") && vars.includes("--color-500: #00FF00;") && vars.includes("--color-950:"), vars.slice(0, 80));
  await btn(page, "Copy share link").click();
  const link = await clip(page);
  check("color: share link keeps alpha", /\?c=00ff0040$/.test(link), link);
  const json = await download(page, () => btn(page, "JSON").click());
  const j = JSON.parse(json.text);
  check("color: JSON includes alpha", j.base === "#00FF0040" && j.alpha === 0.25 && j.rgb === "rgba(0, 255, 0, 0.25)");
  check("color: harmony preview", (await page.getByTestId("harmony-preview").innerText()).includes("Sample heading"));
  await open(page, "/color-picker/?c=f0784580");
  check("color: opens shared colour with alpha", (await hex.inputValue()) === "#F0784580");
  await open(page, "/color-picker/?c=javascript:alert(1)");
  check("color: bad share param ignored", (await hex.inputValue()) === "#F07845");
  await page.close();
}

/* ---------------- Registry, search & SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/all-tools/");
  const all = await page.locator("main").innerText();
  check("all-tools lists new tools", ["Regex Tester", "HTML Formatter & Minifier", "CSS Minifier & Beautifier", "Discount Calculator"].every((n) => all.includes(n)));
  check("category renamed", all.includes("Design & Color Tools"));
  await open(page, "/");
  for (const [q, want] of [["regex", "Regex Tester"], ["beautify html", "HTML Formatter"], ["minify css", "CSS Minifier"], ["sale price", "Discount Calculator"], ["rgba", "Color Picker"]] as const) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "regex-tester": "Regex Tester Online – Test Regular Expressions with Live Matching",
    "html-formatter": "HTML Formatter &amp; Minifier Online – Free HTML Beautifier",
    "css-minifier": "CSS Minifier &amp; Beautifier Online – Free CSS Formatter",
    "discount-calculator": "Discount Calculator Online – Calculate Sale Price &amp; Savings",
    "color-picker": "Color Picker Online – HEX, RGB, HSL Color Converter",
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
      ["BreadcrumbList", "WebApplication", "FAQPage", "HowTo"].every((x) => types.includes(x)) &&
      !/aggregateRating|"review"/i.test(h);
    check(`seo: /${slug}/`, ok, h.match(/<title>(.*?)<\/title>/)?.[1]);
    const og = await fetch(`${BASE}/${slug}/opengraph-image`);
    check(`seo: /${slug}/ OG image`, og.status === 200 && (og.headers.get("content-type") ?? "").startsWith("image/"));
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  check("seo: sitemap + llms.txt list new routes", ["regex-tester", "html-formatter", "css-minifier", "discount-calculator"].every((s) => sm.includes(`/${s}/`) && llms.includes(`/${s}/`)));
  await page.close();
}

const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")))];
check("no third-party requests (analytics off in test build)", external.length === 0, external.slice(0, 3).join(" | "));
const relevant = errors.filter((e) => !/favicon/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
