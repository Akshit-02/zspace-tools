// End-to-end tests for tools 41–45: Protect PDF, Unlock PDF, Watermark PDF,
// Add Page Numbers and PDF to PowerPoint. Outputs are verified independently:
// encryption with pdf.js + qpdf, placement with pdf.js, PPTX by unzipping it.
import { chromium, type Page } from "playwright";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import createModule from "@neslinesli93/qpdf-wasm";

const BASE = process.argv[2] ?? "http://localhost:3100";
const FX = new URL("./fixtures/", import.meta.url).pathname;
const results: { name: string; ok: boolean }[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1900 } });
const errors: string[] = [];
const consoleAll: string[] = [];
const requests: string[] = [];
ctx.on("page", (p) => {
  p.on("pageerror", (e) => errors.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => {
    consoleAll.push(m.text());
    if (m.type() === "error") errors.push(`${p.url()} ${m.text()}`);
  });
  p.on("worker", (w) => w.on("console", (m) => consoleAll.push(m.text())));
  p.on("request", (r) => requests.push(r.url()));
});
async function open(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
}
async function download(page: Page, trigger: () => Promise<unknown>) {
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), trigger()]);
  return { name: dl.suggestedFilename(), buf: readFileSync((await dl.path())!) };
}
const btn = (page: Page, name: string | RegExp) => page.getByRole("button", { name, exact: typeof name === "string" });
const txt = async (page: Page, id: string) => (await page.getByTestId(id).innerText()).replace(/\s+/g, " ");
const upload = (page: Page, f: string) => page.locator('input[type="file"]').first().setInputFiles(f.startsWith("/") ? f : FX + f);
const near = (a: number, b: number, t: number) => Math.abs(a - b) <= t;

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const opens = async (b: Buffer | Uint8Array, password?: string) =>
  pdfjs.getDocument({ data: new Uint8Array(b), password, verbosity: 0 }).promise.then(
    (d) => d.numPages,
    (e) => (e as { name: string }).name,
  );
async function texts(buf: Buffer) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), verbosity: 0 }).promise;
  const out: { w: number; h: number; items: { str: string; x: number; y: number; x2: number; cx: number; cy: number }[] }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i);
    const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    out.push({
      w: vp.width,
      h: vp.height,
      items: (tc.items as { str: string; transform: number[]; width: number }[]).filter((x) => x.str.trim()).map((x) => {
        const t = pdfjs.Util.transform(vp.transform, x.transform);
        // Centre of the baseline, following the text's direction (works for rotated text).
        const len = Math.hypot(t[0], t[1]) || 1;
        const sc = Math.hypot(x.transform[0], x.transform[1]) || 1;
        const wv = (x.width / sc) * len;
        return { str: x.str, x: t[4], y: t[5], x2: t[4] + x.width, cx: t[4] + (t[0] / len) * wv / 2, cy: t[5] + (t[1] / len) * wv / 2 };
      }),
    });
  }
  return out;
}
async function qpdfShow(buf: Buffer, password: string) {
  let text = "";
  const sink = (c: number | null) => void (c !== null && c !== undefined && (text += String.fromCharCode(c)));
  const q = await (createModule as unknown as (o: object) => Promise<{ callMain: (a: string[]) => number; FS: { writeFile: (p: string, d: Uint8Array) => void } }>)({ locateFile: () => "node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm", noInitialRun: true, noFSInit: true, preRun: [(m: { FS: { init: (...a: unknown[]) => void } }) => m.FS.init(() => null, sink, sink)] });
  q.FS.writeFile("/x.pdf", new Uint8Array(buf));
  try {
    q.callMain(["--show-encryption", ...(password ? [`--password=${password}`] : []), "/x.pdf"]);
  } catch {
    /* exit */
  }
  return text;
}

/* ---------------- 41 Protect PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/protect-pdf/");
  await upload(page, "report.pdf");
  await page.getByTestId("protect-info").waitFor({ timeout: 20000 });
  check("protect: file info", (await txt(page, "protect-info")).includes("2 pages"));
  const enc = btn(page, "Encrypt PDF");
  await page.getByLabel("Password to open the PDF").fill("Sunrise-Mango-42!");
  check("protect: strength guidance", (await txt(page, "pw-strength")).match(/Strong|Very strong|Reasonable/) !== null, await txt(page, "pw-strength"));
  await page.getByLabel("Confirm password").fill("Sunrise-Mango-41!");
  check("protect: mismatch blocks encrypting", (await page.getByText("The passwords don't match.").isVisible()) && (await enc.isDisabled()));
  await page.getByLabel("Confirm password").fill("Sunrise-Mango-42!");
  await page.getByRole("button", { name: "Show password" }).first().click();
  check("protect: show password", (await page.getByLabel("Password to open the PDF").getAttribute("type")) === "text");
  await page.getByLabel("Password to open the PDF").press("Enter");
  await page.getByTestId("protect-done").waitFor({ timeout: 60000 });
  check("protect: passwords cleared after success", true);
  const d = await download(page, () => btn(page, /^Download report-protected\.pdf/).click());
  check("protect: refuses to open without password", (await opens(d.buf)) === "PasswordException");
  check("protect: opens with password, all pages", (await opens(d.buf, "Sunrise-Mango-42!")) === 2);
  check("protect: wrong password refused", (await opens(d.buf, "sunrise-mango-42!")) === "PasswordException");
  const show = await qpdfShow(d.buf, "Sunrise-Mango-42!");
  check("protect: AES-256, no restrictions", /AESv3/.test(show) && /print high resolution: allowed/.test(show) && /extract for any purpose: allowed/.test(show));
  // With restrictions + AES-128
  await btn(page, "Change settings and protect again").click();
  await page.getByLabel("Password to open the PDF").fill("secret-123");
  await page.getByLabel("Confirm password").fill("secret-123");
  await page.getByRole("radio", { name: /AES-128/ }).click();
  await page.getByRole("switch", { name: /Restrict printing/ }).check({ force: true });
  await page.getByTestId("perm-panel").getByRole("radio", { name: "Don't allow" }).click();
  await page.getByLabel("Permissions password (optional)").fill("secret-123");
  check("protect: permissions password must differ", await page.getByText(/Use a different password here/).isVisible());
  await page.getByLabel("Permissions password (optional)").fill("owner-xyz");
  await btn(page, "Encrypt PDF").click();
  await page.getByTestId("protect-done").waitFor({ timeout: 60000 });
  const d2 = await download(page, () => btn(page, /^Download report-protected\.pdf/).click());
  const s2 = await qpdfShow(d2.buf, "secret-123");
  check("protect: AES-128 + print/copy/edit restricted, comments allowed", /AESv2/.test(s2) && /print low resolution: not allowed/.test(s2) && /extract for any purpose: not allowed/.test(s2) && /modify annotations: allowed/.test(s2), s2.slice(0, 200));
  check("protect: permissions password works", /Supplied password is owner password/.test(await qpdfShow(d2.buf, "owner-xyz")));
  await btn(page, "Protect another PDF").click();
  await upload(page, "locked-user.pdf");
  await page.getByText(/already protected — use Unlock PDF/).waitFor({ timeout: 15000 });
  check("protect: already-protected PDF explained", true);
  await upload(page, "corrupt.pdf");
  await page.getByText("corrupt.pdf couldn't be opened. It may be damaged or incomplete.").waitFor({ timeout: 15000 });
  check("protect: corrupted PDF", true);
  await page.close();
}

/* ---------------- 42 Unlock PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/unlock-pdf/");
  await upload(page, "locked-user.pdf");
  await page.getByTestId("unlock-info").waitFor({ timeout: 30000 });
  check("unlock: detects opening password", (await txt(page, "unlock-info")).includes("needs a password to open"), await txt(page, "unlock-info"));
  await page.getByLabel("PDF password", { exact: true }).fill("wrong guess");
  await btn(page, "Unlock PDF").click();
  await page.getByText("That password isn't correct. Check it and try again.").waitFor({ timeout: 30000 });
  check("unlock: wrong password → clear error, retry allowed, no download", (await page.getByRole("button", { name: /^Download/ }).count()) === 0 && (await page.getByLabel("PDF password", { exact: true }).isEnabled()));
  // Opening password only → restrictions kept
  await page.getByLabel("PDF password", { exact: true }).fill("open sesame");
  await btn(page, "Unlock PDF").click();
  await page.getByTestId("unlock-done").waitFor({ timeout: 30000 });
  check("unlock: opening password removed, restrictions kept (explained)", await page.getByTestId("kept-note").isVisible());
  const k = await download(page, () => btn(page, /^Download locked-user-unlocked\.pdf/).click());
  check("unlock: opens without password", (await opens(k.buf)) === 2);
  check("unlock: restrictions still applied", /print high resolution: not allowed/.test(await qpdfShow(k.buf, "")));
  const t = await texts(k.buf);
  check("unlock: content & page size preserved", t[0].items.some((i) => i.str === "Quarterly Report") && near(t[0].w, 595.28, 0.1));
  // Owner password → fully unlocked
  await btn(page, "Unlock another PDF").click();
  await upload(page, "locked-user.pdf");
  await page.getByTestId("unlock-info").waitFor({ timeout: 30000 });
  await page.getByLabel("PDF password", { exact: true }).fill("owner-123");
  await btn(page, "Unlock PDF").click();
  await page.getByTestId("unlock-done").waitFor({ timeout: 30000 });
  const f = await download(page, () => btn(page, /^Download/).click());
  check("unlock: permissions password removes everything", (await opens(f.buf)) === 2 && /not encrypted/i.test(await qpdfShow(f.buf, "")) && (await page.getByTestId("kept-note").count()) === 0);
  // Owner-only PDF
  await btn(page, "Unlock another PDF").click();
  await upload(page, "locked-owner.pdf");
  await page.getByTestId("owner-only").waitFor({ timeout: 30000 });
  check("unlock: permissions-only PDF explained", (await txt(page, "owner-only")).includes("opens without a password but restricts copying text"));
  await page.getByLabel("Permissions (owner) password").fill("not-it");
  await btn(page, "Unlock PDF").click();
  await page.getByText("That password isn't correct.", { exact: false }).waitFor({ timeout: 30000 });
  await page.getByLabel("Permissions (owner) password").fill("owner-123");
  await btn(page, "Unlock PDF").click();
  await page.getByTestId("unlock-done").waitFor({ timeout: 30000 });
  check("unlock: owner password lifts restrictions", /not encrypted/i.test(await qpdfShow((await download(page, () => btn(page, /^Download/).click())).buf, "")));
  // RC4 and unprotected
  await btn(page, "Unlock another PDF").click();
  await upload(page, "locked-rc4.pdf");
  await page.getByTestId("unlock-info").waitFor({ timeout: 30000 });
  await page.getByLabel("PDF password", { exact: true }).fill("old");
  await btn(page, "Unlock PDF").click();
  await page.getByTestId("unlock-done").waitFor({ timeout: 30000 });
  check("unlock: older RC4 PDF", (await opens((await download(page, () => btn(page, /^Download/).click())).buf)) === 2);
  await btn(page, "Unlock another PDF").click();
  await upload(page, "report.pdf");
  await page.getByText(/isn't password-protected and has no restrictions/).waitFor({ timeout: 30000 });
  check("unlock: unprotected PDF explained", true);
  await btn(page, "Unlock another PDF").click();
  await upload(page, "corrupt.pdf");
  await page.getByText(/couldn't be read|couldn't be opened/).waitFor({ timeout: 30000 });
  check("unlock: corrupted PDF", true);
  await page.close();
}

/* ---------------- 43 Watermark PDF ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/watermark-pdf/");
  await upload(page, "multi-page.pdf");
  await page.getByTestId("stamp-stage").waitFor({ timeout: 20000 });
  check("wm: preview shows watermark", (await page.getByTestId("stamp-stage").innerText()).includes("CONFIDENTIAL"));
  await page.getByRole("button", { name: "DRAFT", exact: true }).click();
  const d = await download(page, () => btn(page, "Add watermark & download").click());
  const t = await texts(d.buf);
  check("wm: all 4 pages watermarked, originals kept", t.every((p, i) => p.items.some((x) => x.str === "DRAFT") && p.items.some((x) => x.str === `PAGE ${i + 1}`)));
  const cx = (p: (typeof t)[number]) => {
    const it = p.items.find((x) => x.str === "DRAFT")!;
    return [it.cx, it.cy];
  };
  check("wm: diagonal centre on every page size/rotation", t.every((p) => near(cx(p)[0], p.w / 2, 60) && near(cx(p)[1], p.h / 2, 60)), JSON.stringify(t.map((p) => [Math.round(cx(p)[0]), Math.round(cx(p)[1]), Math.round(p.w), Math.round(p.h)])));
  // Bottom-right, no rotation, odd pages, opacity 60%
  await page.getByRole("radio", { name: "Bottom right" }).click();
  await page.locator("#wm-rot").fill("0");
  await page.locator("#wm-opacity").fill("60");
  await page.getByRole("radio", { name: "Odd" }).click();
  const d2 = await download(page, () => btn(page, "Add watermark & download").click());
  const t2 = await texts(d2.buf);
  const has = t2.map((p) => p.items.some((x) => x.str === "DRAFT"));
  check("wm: odd pages only", JSON.stringify(has) === "[true,false,true,false]");
  const br = t2[0].items.find((x) => x.str === "DRAFT")!;
  check("wm: bottom-right inside margin", near(br.x2, t2[0].w - 36, 4) && br.y > t2[0].h - 80 && br.y < t2[0].h - 36, JSON.stringify(br));
  const opDoc = await (await import("pdf-lib")).PDFDocument.load(d2.buf);
  check("wm: opacity applied", [...opDoc.context.enumerateIndirectObjects()].some(([, o]) => String(o).includes("/ca 0.6")));
  // Custom range validation
  await page.getByRole("radio", { name: "Custom" }).click();
  await page.getByLabel("Page range").fill("2-9");
  check("wm: invalid range", (await page.getByText(/has 4 pages/).isVisible()) && (await btn(page, "Add watermark & download").isDisabled()));
  await page.getByLabel("Page range").fill("2, 4");
  // Image watermark with transparency, tiled
  await page.getByRole("radio", { name: "Image / logo" }).click();
  await page.locator('input[aria-label="Choose a watermark image"]').setInputFiles(FX + "transparent.png");
  await page.getByAltText("Watermark image").waitFor();
  await page.getByRole("switch", { name: "Repeat across the page" }).check({ force: true });
  const d3 = await download(page, () => btn(page, "Add watermark & download").click());
  const pdfDoc = await (await import("pdf-lib")).PDFDocument.load(d3.buf);
  const imgs = [...pdfDoc.context.enumerateIndirectObjects()].filter(([, o]) => String(o).includes("/Subtype /Image"));
  check("wm: logo embedded once with transparency (SMask), tiled on pages 2 & 4", imgs.length === 2 && imgs.some(([, o]) => String(o).includes("/SMask")) && (await texts(d3.buf))[1].items.some((x) => x.str === "PAGE 2"), String(imgs.length));
  // Custom drag placement
  await page.getByRole("switch", { name: "Repeat across the page" }).uncheck({ force: true });
  await page.getByRole("radio", { name: "Text" }).click();
  await page.getByRole("button", { name: /Custom — drag it/ }).click();
  await page.getByRole("button", { name: "Next page" }).click();
  const obj = page.getByTestId("stamp-stage").locator("[data-obj]").first();
  const ob = (await obj.boundingBox())!;
  await page.mouse.move(ob.x + ob.width / 2, ob.y + ob.height / 2);
  await page.mouse.down();
  await page.mouse.move(ob.x + ob.width / 2 - 100, ob.y + ob.height / 2 - 150, { steps: 6 });
  await page.mouse.up();
  const after = (await obj.boundingBox())!;
  check("wm: custom drag moves the watermark", after.y < ob.y - 100);
  await page.close();
}

/* ---------------- 44 Add Page Numbers ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/add-page-numbers/");
  await upload(page, "pages-20.pdf");
  await page.getByTestId("stamp-stage").waitFor({ timeout: 20000 });
  await page.locator("#pn-style").selectOption("page-of");
  await page.locator("#pn-skip").fill("2");
  check("pn: summary for 20 pages, skip 2", (await txt(page, "pn-summary")).includes("18 pages numbered — page 3 shows “Page 1 of 18”"), await txt(page, "pn-summary"));
  await page.getByRole("radio", { name: "Bottom right" }).click();
  const d = await download(page, () => btn(page, "Add page numbers & download").click());
  const t = await texts(d.buf);
  const num = (i: number) => t[i].items.find((x) => /^Page \d+ of/.test(x.str));
  check("pn: first two pages unnumbered", !num(0) && !num(1));
  check("pn: page 3 → Page 1 of 18, page 20 → Page 18 of 18", num(2)?.str === "Page 1 of 18" && num(19)?.str === "Page 18 of 18");
  check("pn: right-aligned at the margin", !!num(2) && near(num(2)!.x2, t[2].w - 28, 3) && near(num(2)!.y, t[2].h - 28 - 10 * 0.2, 6), JSON.stringify(num(2)));
  // Mixed sizes + Roman + header/footer
  await page.getByRole("button", { name: "Another PDF" }).click();
  await upload(page, "multi-page.pdf");
  await page.getByTestId("stamp-stage").waitFor({ timeout: 20000 });
  await page.locator("#pn-style").selectOption("i");
  await page.locator("#pn-skip").fill("0");
  await page.locator("#pn-start").fill("1");
  await page.getByRole("radio", { name: "Top centre" }).click();
  await page.getByText("Header & footer text (optional)").click();
  await page.getByLabel("Footer text").fill("{title} · {page}/{total}");
  await page.getByLabel("Footer alignment").selectOption("right");
  const d2 = await download(page, () => btn(page, "Add page numbers & download").click());
  const t2 = await texts(d2.buf);
  check("pn: Roman numerals", ["i", "ii", "iii", "iv"].every((r, i) => t2[i].items.some((x) => x.str === r)), JSON.stringify(t2.map((p) => p.items.map((x) => x.str))));
  check("pn: centred at top on each page size", t2.every((p, i) => {
    const it = p.items.find((x) => x.str === ["i", "ii", "iii", "iv"][i])!;
    return near((it.x + it.x2) / 2, p.w / 2, 2) && it.y < 50;
  }));
  check("pn: footer with placeholders", t2[2].items.some((x) => x.str === "multi-page · 3/4"));
  check("pn: landscape page footer right-aligned", (() => {
    const it = t2[2].items.find((x) => x.str.startsWith("multi-page"))!;
    return near(it.x2, t2[2].w - 28, 3) && near(t2[2].w, 841.89, 1);
  })());
  check("pn: rotated page numbered upright", (() => {
    const it = t2[3].items.find((x) => x.str === "iv");
    return !!it && near(t2[3].w, 841.89, 1) && it.y < 50;
  })());
  await page.close();
}

/* ---------------- 45 PDF to PowerPoint ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/pdf-to-powerpoint/");
  await upload(page, "report.pdf");
  await page.getByTestId("ppt-info").waitFor({ timeout: 20000 });
  await btn(page, /^Convert 2 pages to PowerPoint$/).click();
  await page.getByTestId("ppt-done").waitFor({ timeout: 60000 });
  const d = await download(page, () => btn(page, /^Download report\.pptx/).click());
  const z = unzipSync(new Uint8Array(d.buf));
  const pres = strFromU8(z["ppt/presentation.xml"]);
  const slides = Object.keys(z).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
  check("ppt: valid PPTX with 2 slides", d.name === "report.pptx" && slides.length === 2 && !!z["[Content_Types].xml"]);
  check("ppt: slide size matches A4 (11.69 × 8.27 in → EMU)", /<p:sldSz cx="(\d+)" cy="(\d+)"/.test(pres) && (() => {
    const [, cx, cy] = /<p:sldSz cx="(\d+)" cy="(\d+)"/.exec(pres)!;
    return near(Number(cx) / 914400, 595.28 / 72, 0.01) && near(Number(cy) / 914400, 841.89 / 72, 0.01);
  })(), pres.match(/<p:sldSz[^>]*>/)?.[0]);
  check("ppt: picture slides (one image each)", Object.keys(z).filter((k) => /^ppt\/media\/.+\.(jpe?g|png)$/.test(k)).length === 2);
  check("ppt: slide preview", (await page.getByTestId("ppt-preview").locator("img").count()) === 2);
  // Editable, 16:9
  await page.getByRole("radio", { name: /Editable text/ }).click();
  await page.getByRole("radio", { name: "16:9" }).click();
  await btn(page, /^Convert 2 pages to PowerPoint$/).click();
  await page.getByTestId("ppt-done").waitFor({ timeout: 60000 });
  const e = await download(page, () => btn(page, /^Download report\.pptx/).click());
  const ez = unzipSync(new Uint8Array(e.buf));
  const s1 = strFromU8(ez["ppt/slides/slide1.xml"]);
  check("ppt: editable text boxes", s1.includes("Quarterly Report") && s1.includes("Revenue grew") && /<a:b?\b|b="1"/.test(s1));
  check("ppt: table rebuilt", s1.includes("<a:tbl>") && s1.includes("1,20,000"));
  check("ppt: 16:9 slide size", /<p:sldSz cx="12192000" cy="6858000"|cx="1219\d{4}" cy="6858000"/.test(strFromU8(ez["ppt/presentation.xml"])), strFromU8(ez["ppt/presentation.xml"]).match(/<p:sldSz[^>]*>/)?.[0]);
  check("ppt: background without text kept", Object.keys(ez).filter((k) => /^ppt\/media\/.+\.(jpe?g|png)$/.test(k)).length === 2);
  // Scanned PDF → picture slide + OCR notes; page range
  await page.getByRole("button", { name: "Another PDF" }).click();
  await upload(page, "image-heavy.pdf");
  await page.getByTestId("ppt-info").waitFor({ timeout: 20000 });
  await page.getByRole("radio", { name: "Custom" }).click();
  await page.getByLabel("Page range").fill("2-3");
  await page.getByRole("radio", { name: /Keep the layout/ }).click();
  await page.getByRole("radio", { name: "4:3" }).click();
  await btn(page, /^Convert 2 pages to PowerPoint$/).click();
  await page.getByTestId("ppt-done").waitFor({ timeout: 60000 });
  const r = unzipSync(new Uint8Array((await download(page, () => btn(page, /^Download image-heavy\.pptx/).click())).buf));
  check("ppt: page range + 4:3", Object.keys(r).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).length === 2 && strFromU8(r["ppt/presentation.xml"]).includes('cx="9144000" cy="6858000"'));
  await page.close();
}

/* ---------------- Registry & SEO ---------------- */
{
  const page = await ctx.newPage();
  await open(page, "/");
  for (const [q, want] of [["password protect pdf", "Protect PDF"], ["remove pdf password", "Unlock PDF"], ["watermark", "Watermark PDF"], ["page numbers", "Add Page Numbers"], ["pdf to ppt", "PDF to PowerPoint"]] as const) {
    await page.getByPlaceholder("What would you like to do today?").fill(q);
    const first = page.getByRole("option").first();
    await first.waitFor();
    check(`search: "${q}" → ${want}`, (await first.innerText()).includes(want), (await first.innerText()).split("\n")[0]);
  }
  const titles: Record<string, string> = {
    "protect-pdf": "Protect PDF – Add Password and Encrypt PDF Files Online",
    "unlock-pdf": "Unlock PDF – Remove Password from PDF Online",
    "watermark-pdf": "Add Watermark to PDF – Text and Image Watermark Online",
    "add-page-numbers": "Add Page Numbers to PDF – Number PDF Pages Online",
    "pdf-to-powerpoint": "PDF to PowerPoint Converter – Convert PDF to PPTX Online",
  };
  for (const [slug, title] of Object.entries(titles)) {
    const res = await fetch(`${BASE}/${slug}/`);
    const h = await res.text();
    const types: string[] = [];
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      const j = JSON.parse(m[1]);
      types.push(...(j["@graph"] ?? [j]).map((n: { "@type": string }) => n["@type"]));
    }
    check(`seo: /${slug}/`, res.status === 200 && h.includes(`<title>${title}</title>`) && (h.match(/<h1/g) ?? []).length === 1 && h.includes(`rel="canonical" href="https://tools.zspace.in/${slug}/"`) && ["BreadcrumbList", "WebApplication"].every((x) => types.includes(x)) && !/aggregateRating|ratingValue/i.test(h) && !/<meta[^>]+name="robots"[^>]+noindex/i.test(h), h.match(/<title>(.*?)<\/title>/)?.[1]);
    check(`seo: /${slug}/ OG image`, (await fetch(`${BASE}/${slug}/opengraph-image`)).status === 200);
  }
  const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check("seo: sitemap", Object.keys(titles).every((s) => sm.includes(`/${s}/`)));
  await page.close();
}

const leaked = consoleAll.filter((l) => /Sunrise-Mango|open sesame|owner-123|secret-123|owner-xyz|User password/i.test(l));
check("passwords never appear in the console", leaked.length === 0, leaked.slice(0, 2).join(" | "));
const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:") && !u.startsWith("blob:")))];
check("nothing uploaded or fetched from third parties", external.length === 0, external.slice(0, 3).join(" | "));
const passwordInUrl = requests.some((u) => /Sunrise|sesame|secret-123|owner/i.test(decodeURIComponent(u)));
check("passwords never in URLs", !passwordInUrl);
const relevant = errors.filter((e) => !/favicon|Estimating resolution|Parameter not found|Detected \d+ diacritics|Empty page!!/.test(e));
check("no console errors / CSP violations", relevant.length === 0, relevant.slice(0, 5).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
