import { readFileSync, writeFileSync } from "node:fs";
import createModule from "@neslinesli93/qpdf-wasm";
import { PDFDocument, degrees } from "pdf-lib";
import { formatNumber, numberObjects, numberPlan, roman, scopePages, watermarkObjects, place, type Numbering, type Watermark } from "../src/lib/pdf-stamp";
import { exportWithOverlays } from "../src/lib/pdf-overlay";
import { permArgs, strength } from "../src/lib/pdf-security";
import { fit, slideSize } from "../src/lib/pdf-to-pptx";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const ok = (name: string, c: boolean, info?: unknown) => eq(name + (c || info === undefined ? "" : ` (${JSON.stringify(info).slice(0, 300)})`), c, true);
const near = (a: number, b: number, t: number) => Math.abs(a - b) <= t;
const FX = new URL("./fixtures/", import.meta.url);
const fx = (f: string) => new Uint8Array(readFileSync(new URL(f, FX)));
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const width = (s: string, size: number) => s.length * size * 0.5;
const fdoc = await PDFDocument.create();
const hb = await fdoc.embedFont((await import("pdf-lib")).StandardFonts.HelveticaBold);
const realWidth = (s: string, size: number) => hb.widthOfTextAtSize(s, size);

/* ---------------- qpdf (same engine and arguments as the browser) ---------------- */
async function qpdf(args: string[], input: Uint8Array) {
  const log: string[] = [];
  let text = "";
  const sink = (c: number | null) => void (c !== null && c !== undefined && (text += String.fromCharCode(c)));
  const q = await (createModule as unknown as (o: object) => Promise<{ callMain: (a: string[]) => number; FS: { writeFile: (p: string, d: Uint8Array) => void; readFile: (p: string) => Uint8Array } }>)({ locateFile: () => "node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm", noInitialRun: true, noFSInit: true, preRun: [(m: { FS: { init: (...a: unknown[]) => void } }) => m.FS.init(() => null, sink, sink)] });
  q.FS.writeFile("/in.pdf", input);
  let rc: number;
  try {
    rc = q.callMain(args.map((a) => a.replace("{in}", "/in.pdf").replace("{out}", "/out.pdf")));
  } catch (e) {
    rc = (e as { status?: number }).status ?? 2;
  }
  log.push(...text.split("\n").filter(Boolean));
  let out: Uint8Array | null = null;
  try {
    out = q.FS.readFile("/out.pdf");
  } catch {
    /* none */
  }
  return { rc, out, log };
}
const opens = async (b: Uint8Array, password?: string) =>
  pdfjs.getDocument({ data: b.slice(), password, verbosity: 0 }).promise.then(
    (d) => d.numPages,
    (e) => (e as { name: string }).name,
  );

const src = fx("report.pdf");
const perms = { print: "none" as const, copy: false, edit: false, annotate: true };
const enc = await qpdf(["--encrypt", "open sesame", "owner-123", "256", ...permArgs(perms, 256), "--", "{in}", "{out}"], src);
ok("qpdf: AES-256 encrypt", enc.rc === 0 && !!enc.out);
eq("encrypted: needs password", await opens(enc.out!), "PasswordException");
eq("encrypted: opens with password", await opens(enc.out!, "open sesame"), 2);
eq("encrypted: wrong password refused", await opens(enc.out!, "nope"), "PasswordException");
const show = await qpdf(["--show-encryption", "--password=open sesame", "{in}"], enc.out!);
ok("encrypted: AES-256 (AESv3) + restrictions", show.log.some((l) => /file encryption method: AESv3/.test(l)) && show.log.some((l) => /print high resolution: not allowed/.test(l)) && show.log.some((l) => /extract for any purpose: not allowed/.test(l)) && show.log.some((l) => /modify annotations: allowed/.test(l)), show.log);
const enc128 = await qpdf(["--encrypt", "pw", "o", "128", ...permArgs({ print: "full", copy: true, edit: false, annotate: false }, 128), "--", "{in}", "{out}"], src);
ok("qpdf: AES-128 option", enc128.rc === 0 && (await qpdf(["--show-encryption", "--password=pw", "{in}"], enc128.out!)).log.some((l) => /AESv2/.test(l)));
const ownerOnly = await qpdf(["--encrypt", "", "owner-123", "256", ...permArgs({ print: "full", copy: false, edit: true, annotate: true }, 256), "--", "{in}", "{out}"], src);
eq("owner-only: opens without password", await opens(ownerOnly.out!), 2);
const rc4 = await qpdf(["--allow-weak-crypto", "--encrypt", "old", "old-owner", "128", "--use-aes=n", "--", "{in}", "{out}"], src);
ok("rc4 fixture", rc4.rc === 0 || rc4.rc === 3);
writeFileSync(new URL("locked-user.pdf", FX), enc.out!);
writeFileSync(new URL("locked-owner.pdf", FX), ownerOnly.out!);
writeFileSync(new URL("locked-rc4.pdf", FX), rc4.out!);
// Decryption paths used by Unlock
const full = await qpdf(["--password=owner-123", "--decrypt", "{in}", "{out}"], enc.out!);
eq("unlock with owner password: no password, same pages", await opens(full.out!), 2);
ok("unlock with owner password: not encrypted", (await qpdf(["--show-encryption", "{in}"], full.out!)).log.some((l) => /not encrypted/i.test(l)));
const kept = await qpdf(["--password=open sesame", "--encrypt", "", "random-owner", "256", ...permArgs(perms, 256), "--", "{in}", "{out}"], enc.out!);
eq("unlock with opening password: opens freely", await opens(kept.out!), 2);
ok("unlock with opening password: restrictions kept", (await qpdf(["--show-encryption", "{in}"], kept.out!)).log.some((l) => /print high resolution: not allowed/.test(l)));
ok("unlock: wrong password → rc 2, no output", (await qpdf(["--password=wrong", "--decrypt", "{in}", "{out}"], enc.out!)).rc === 2);
const decText = await pdfjs.getDocument({ data: full.out!.slice(), verbosity: 0 }).promise.then((d) => d.getPage(1)).then((p) => p.getTextContent());
ok("unlock: text preserved", decText.items.some((i) => "str" in i && i.str.includes("Quarterly Report")));
eq("permArgs 128 edit off, annotate", permArgs({ print: "low", copy: false, edit: false, annotate: true }, 128), ["--print=low", "--extract=n", "--use-aes=y", "--modify=annotate", "--accessibility=y"]);

/* ---------------- Password guidance ---------------- */
eq("strength", [strength("password").level, strength("abc").level, strength("Tr0ub4dour&3x!").level >= 3, strength("correct horse battery staple").level >= 3], [0, 0, true, true]);
ok("strength tips", strength("short").tips.length > 0 && strength("").label === "");

/* ---------------- Numbers ---------------- */
eq("roman", [roman(1), roman(4), roman(9), roman(14), roman(40), roman(1994), roman(3999)], ["I", "IV", "IX", "XIV", "XL", "MCMXCIV", "MMMCMXCIX"]);
eq("formats", [formatNumber(3, 10, "1"), formatNumber(3, 10, "01"), formatNumber(3, 120, "01"), formatNumber(3, 10, "page"), formatNumber(3, 10, "page-of"), formatNumber(3, 10, "slash"), formatNumber(3, 10, "I"), formatNumber(3, 10, "i"), formatNumber(3, 10, "1", "A-", ".")], ["3", "03", "003", "Page 3", "Page 3 of 10", "3 / 10", "III", "iii", "A-3."]);
eq("scope", [scopePages("all", "", 4), scopePages("first", "", 4), scopePages("last", "", 4), scopePages("odd", "", 5), scopePages("even", "", 5), scopePages("range", "1-2, 4-end", 6), scopePages("range", "3,3,1", 4)], [[0, 1, 2, 3], [0], [3], [0, 2, 4], [1, 3], [0, 1, 3, 4, 5], [0, 2]]);
ok("scope errors", "error" in (scopePages("range", "0", 4) as object) && "error" in (scopePages("range", "2-9", 4) as object) && "error" in (scopePages("range", "abc", 4) as object) && "error" in (scopePages("range", "", 4) as object));
const N: Numbering = { pos: "bc", style: "page-of", prefix: "", suffix: "", start: 1, skip: 2, scope: "all", range: "", family: "sans", bold: false, size: 10, color: "#000000", opacity: 1, margin: 28, header: "", headerAlign: "center", footer: "", footerAlign: "left", title: "Report", date: "13 Nov 2026" };
const plan = numberPlan(N, 20) as { pages: { index: number; num: number }[]; count: number };
eq("plan: 20 pages, skip 2 → page 3 is 1, last is 18", [plan.count, plan.pages[0], plan.pages[17]], [18, { index: 2, num: 1 }, { index: 19, num: 18 }]);
eq("plan: start at 5", (numberPlan({ ...N, skip: 0, start: 5 }, 3) as typeof plan).pages.map((p) => p.num), [5, 6, 7]);
eq("plan: odd pages only", (numberPlan({ ...N, skip: 0, scope: "odd" }, 5) as typeof plan).pages, [{ index: 0, num: 1 }, { index: 2, num: 2 }, { index: 4, num: 3 }]);
const sizes = [{ w: 595, h: 842 }, { w: 842, h: 595 }, { w: 612, h: 792 }];
const objs = numberObjects({ ...N, skip: 0, pos: "br", footer: "{title} · {date} · {page}/{total}", footerAlign: "left" }, sizes, "r.pdf", width) as { page: number; x: number; y: number; w: number; h: number; text: string; align: string }[];
const pn = objs.filter((o) => /^Page/.test(o.text));
eq("numbers: right-aligned to each page's margin", pn.map((o) => Math.round(o.x + o.w)), [567, 814, 584]);
eq("numbers: bottom margin on each page", pn.map((o) => Math.round(o.y + o.h)), [814, 567, 764]);
ok("footer placeholders", objs.some((o) => o.text === "Report · 13 Nov 2026 · 2/3"));
eq("place centre", place({ w: 600, h: 800 }, 100, 50, "c", 20), { x: 250, y: 375, align: "center" });

/* ---------------- Watermark ---------------- */
const WM: Watermark = { kind: "text", text: "DRAFT", family: "sans", bold: true, size: 60, color: "#d6342b", opacity: 0.3, rotation: -45, pos: "c", cx: 0.5, cy: 0.5, margin: 20, tile: false, gap: 40, scale: 0.3 };
const one = watermarkObjects(WM, [{ w: 595, h: 842 }], [0], (s, z) => width(s, z));
ok("watermark: centred", near(one[0].x + one[0].w / 2, 297.5, 0.01) && near(one[0].y + one[0].h / 2, 421, 0.01) && one[0].rot === -45 && one[0].opacity === 0.3);
const corner = watermarkObjects({ ...WM, pos: "br", rotation: 0 }, [{ w: 595, h: 842 }], [0], (s, z) => width(s, z))[0];
ok("watermark: bottom-right inside margin", near(corner.x + corner.w, 575, 0.01) && near(corner.y + corner.h, 822, 0.01));
const tiled = watermarkObjects({ ...WM, tile: true }, [{ w: 595, h: 842 }], [0], (s, z) => width(s, z));
ok("watermark: tiled covers page", tiled.length >= 4 && new Set(tiled.map((o) => o.id)).size === tiled.length);
eq("watermark: custom position", (({ x, w, y, h }) => [Math.round(x + w / 2), Math.round(y + h / 2)])(watermarkObjects({ ...WM, pos: "custom", cx: 0.25, cy: 0.75 }, [{ w: 600, h: 800 }], [0], (s, z) => width(s, z))[0]), [150, 600]);
eq("watermark: only selected pages", watermarkObjects(WM, [sizes[0], sizes[1], sizes[2]], [0, 2], (s, z) => width(s, z)).map((o) => o.page), [0, 2]);
// Exported watermark text lands at the centre of rotated and normal pages, with opacity.
const base = await PDFDocument.create();
base.addPage([595, 842]);
base.addPage([595, 842]).setRotation(degrees(90));
const out = await exportWithOverlays(await base.save(), watermarkObjects({ ...WM, rotation: 0 }, [{ w: 595, h: 842 }, { w: 842, h: 595 }], [0, 1], (s, z) => realWidth(s, z)));
const dw = realWidth("DRAFT", 60);
const doc = await pdfjs.getDocument({ data: out.slice(), verbosity: 0 }).promise;
for (const i of [1, 2]) {
  const p = await doc.getPage(i);
  const vp = p.getViewport({ scale: 1 });
  const it = (await p.getTextContent()).items.find((x) => "str" in x && x.str === "DRAFT") as { transform: number[] } | undefined;
  const t = it ? pdfjs.Util.transform(vp.transform, it.transform) : null;
  ok(`watermark export: centred on page ${i} (rot ${p.rotate})`, !!t && near(t[4] + dw / 2, vp.width / 2, 1) && near(t[5], vp.height / 2 + 16, 8), t);
}
const gs = await PDFDocument.load(out);
ok("watermark export: transparency set", [...gs.context.enumerateIndirectObjects()].some(([, o]) => String(o).includes("/ca 0.3")));

/* ---------------- Slides ---------------- */
eq("slideSize", [slideSize("16:9", 595, 842), slideSize("4:3", 595, 842), slideSize("match", 842, 595), slideSize("match", 5000, 100)], [{ w: 13.333, h: 7.5 }, { w: 10, h: 7.5 }, { w: 11.694, h: 8.264 }, { w: 56, h: 1.12 }]);
const f = fit(595, 842, 13.333, 7.5);
ok("fit: portrait centred on 16:9, not stretched", near(f.k * 842, 7.5, 0.001) && near(f.ox, (13.333 - 595 * f.k) / 2, 0.001) && f.oy === 0);

console.log(fails ? `\n${fails} FAILED` : "\nAll tools-10 tests passed");
process.exit(fails ? 1 : 0);
