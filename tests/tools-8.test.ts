import { readFileSync } from "node:fs";
import { analyzePage, bodySize, findGutter, segments, toLines, toRuns, wordFont, isBoldName, isItalicName, type Item, type ParaBlock, type TableBlock } from "../src/lib/pdf-layout";
import { isAnimatedGif, renameOutput, sniff, targetSize } from "../src/lib/image-convert";
import { outName, planSize } from "../src/lib/pdf-images";
import { pageLabel, sniffWord } from "../src/lib/docx-render";
import { tidy } from "../src/lib/ocr";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const ok = (name: string, c: boolean, info?: unknown) => eq(name + (c || info === undefined ? "" : ` (${JSON.stringify(info).slice(0, 400)})`), c, true);
const fx = (f: string) => new Uint8Array(readFileSync(new URL(`./fixtures/${f}`, import.meta.url)));

/* ---------------- item helpers ---------------- */
const W = 595;
const H = 842;
const it = (str: string, x: number, base: number, size = 11, o: Partial<Item> = {}): Item => ({ str, x, base, top: base - size * 0.8, w: str.length * size * 0.5, size, font: "Arial", bold: false, italic: false, ...o });
const line = (text: string, x: number, base: number, size = 11, o: Partial<Item> = {}) => {
  // split into word items like many PDFs do
  let cx = x;
  return text.split(" ").map((w, i, a) => {
    const s = i < a.length - 1 ? w + " " : w;
    const item = it(s, cx, base, size, o);
    cx += item.w;
    return item;
  });
};
const paras = (b: ReturnType<typeof analyzePage>["blocks"]) => b.filter((x): x is ParaBlock => x.kind === "para");
const text = (p: ParaBlock) => p.runs.map((r) => r.text).join("");

/* ---------------- layout ---------------- */
{
  const items = [
    ...line("Quarterly Report", 56, 60, 26, { bold: true }),
    ...line("This report summarises the results for the quarter and", 56, 100),
    ...line("explains the main changes in revenue across regions.", 56, 115),
    ...line("A second paragraph starts after a gap.", 56, 145),
    ...line("Regional results", 56, 185, 17, { bold: true }),
  ];
  const { blocks, body } = analyzePage(items, [], W, H);
  const ps = paras(blocks);
  eq("layout: body size", body, 11);
  eq("layout: paragraphs", ps.map(text), ["Quarterly Report", "This report summarises the results for the quarter and explains the main changes in revenue across regions.", "A second paragraph starts after a gap.", "Regional results"]);
  eq("layout: heading levels", ps.map((p) => p.heading), [1, 0, 0, 2]);
  ok("layout: bold run kept", ps[0].runs[0].bold && !ps[1].runs[0].bold);
}
{
  const hy = [...line("The quick brown fox jumps over a lazy dog and a well-", 56, 100), ...line("known proverb follows with exam-", 56, 115), ...line("ple text here.", 56, 130)];
  eq("layout: line-end hyphen kept, no space", text(paras(analyzePage(hy, [], W, H).blocks)[0]), "The quick brown fox jumps over a lazy dog and a well-known proverb follows with exam-ple text here.");
eq("layout: soft hyphen removed", text(paras(analyzePage([...line("A long word broken with a soft hy\u00AD", 56, 100), ...line("phen continues.", 56, 115)], [], W, H).blocks)[0]), "A long word broken with a soft hyphen continues.");
}
{
  const centred = line("Thank you", (W - 9 * 5.5) / 2, 300);
  const left = [...line("Left aligned body text that is long enough to set the box", 56, 100), ...line("Right side", W - 56 - 10 * 5.5, 200)];
  const ps = paras(analyzePage([...left, ...centred], [], W, H).blocks);
  eq("layout: alignment", ps.map((p) => p.align), ["left", "right", "center"]);
}
{
  const just = [
    ...line("Justified text fills the whole width of the column on", 56, 100),
    ...line("every line except the last one which is shorter.", 56, 115),
  ].map((i) => i);
  // stretch first line to the right edge
  const right = Math.max(...just.map((i) => i.x + i.w));
  const box = [...just, it("x", right - 5, 130)];
  const p = paras(analyzePage(box, [], W, H).blocks)[0];
  ok("layout: justify detection runs", ["justify", "left"].includes(p.align), p.align);
}
{
  const rows = [
    ["Region", "Revenue", "Growth"],
    ["North", "1,20,000", "12%"],
    ["South", "98,500", "8%"],
  ];
  const items = rows.flatMap((r, ri) => r.map((c, ci) => it(c, 56 + ci * 150, 200 + ri * 18, 11, { bold: ri === 0 })));
  const blocks = analyzePage([...line("Intro paragraph above the table.", 56, 170), ...items], [], W, H).blocks;
  const t = blocks.find((b): b is TableBlock => b.kind === "table");
  ok("layout: table detected", !!t && t.rows.length === 3 && t.rows[0].length === 3, blocks.map((b) => b.kind));
  eq("layout: table cells", t?.rows.map((r) => r.map((c) => c.map((x) => x.text).join(""))), rows);
  ok("layout: header row bold", !!t?.rows[0][0][0].bold && !t?.rows[1][0][0].bold);
  eq("layout: table widths", t?.widths.slice(0, 2), [150, 150]);
}
{
  const single = line("Name:            Akshit", 56, 100);
  eq("layout: one wide-gap line isn't a table", analyzePage(single, [], W, H).blocks.filter((b) => b.kind === "table").length, 0);
}
{
  const items = [...line("Newsletter Title Across Both Columns Here", 56, 60, 20, { bold: true })];
  for (let i = 0; i < 14; i++) {
    items.push(...line(`Left column line ${i + 1} continues`, 56, 100 + i * 14, 10));
    items.push(...line(`Right column line ${i + 1} continues`, 320, 100 + i * 14, 10));
  }
  const lines = toLines(items);
  const g = findGutter(lines, { left: 56, right: 520, top: 40, bottom: 300 });
  ok("layout: gutter found", g !== null && g > 250 && g < 320, g);
  const order = paras(analyzePage(items, [], W, H).blocks).map(text);
  ok("layout: columns read left then right", order[0].startsWith("Newsletter") && order[1].startsWith("Left column line 1") && order[1].includes("Left column line 14") && order[2].startsWith("Right column line 1"), order);
}
{
  const items = [...line("Text above the image.", 56, 100), ...line("Text below the image.", 56, 400)];
  const blocks = analyzePage(items, [{ id: 7, x: 197, top: 150, w: 200, h: 150 }], W, H).blocks;
  eq("layout: image ordered by position", blocks.map((b) => b.kind), ["para", "image", "para"]);
  eq("layout: image centred", (blocks[1] as { align: string }).align, "center");
}
{
  const b = [...line("• First point", 56, 100), ...line("• Second point", 56, 115), ...line("1. Numbered", 56, 130)];
  eq("layout: bullets split paragraphs", paras(analyzePage(b, [], W, H).blocks).length, 3);
}
{
  const ind = [...line("Indented first line of paragraph one goes", 76, 100), ...line("on here flush.", 56, 115), ...line("Second paragraph indented starts here and", 76, 130), ...line("continues flush.", 56, 145)];
  const ps = paras(analyzePage(ind, [], W, H).blocks);
  ok("layout: first-line indent paragraphs", ps.length === 2 && ps[0].firstLine > 15, ps.map((p) => [text(p), p.firstLine]));
}
eq("layout: empty page", analyzePage([], [], W, H).blocks.length, 0);
eq("runs: spaces from gaps", toRuns([it("Hello", 0, 10), it("world", 30, 10)]).map((r) => r.text).join(""), "Hello world");
eq("runs: no extra space for adjacent glyphs", toRuns([it("Hel", 0, 10), it("lo", 16.5, 10)]).map((r) => r.text).join(""), "Hello");
eq("runs: style split", toRuns([it("a ", 0, 10), it("b", 11, 10, 11, { bold: true })]).length, 2);
eq("segments", segments(toLines([it("A", 0, 10), it("B", 100, 10)])[0]).length, 2);
eq("bodySize by chars", bodySize([it("x".repeat(100), 0, 10, 10), it("Big", 0, 30, 30)]), 10);
eq("fonts", [wordFont("ABCDEF+TimesNewRomanPS-BoldMT", "serif"), wordFont("Helvetica-Bold", "sans-serif"), wordFont("CourierNewPSMT", "monospace"), wordFont("XYZABC+OpenSans-Regular", ""), wordFont("g_d0_f1", "sans-serif"), wordFont("", "serif")], ["Times New Roman", "Arial", "Courier New", "Open Sans", "Arial", "Times New Roman"]);
eq("font styles", [isBoldName("Helvetica-Bold"), isBoldName("Arial-SemiboldMT"), isItalicName("Helvetica-Oblique"), isItalicName("Times-Italic"), isBoldName("Helvetica")], [true, true, true, true, false]);

/* ---------------- image convert ---------------- */
eq("sniff", ["tiny.jpg", "quadrants.png", "photo.webp", "quadrants.heic", "quadrants.avif", "animated.gif", "not-an-image.png", "corrupt.jpg"].map((f) => sniff(fx(f))), ["jpeg", "png", "webp", "heic", "avif", "gif", null, "jpeg"]);
eq("sniff bmp/tiff", [sniff(new Uint8Array([0x42, 0x4d, ...new Array(30).fill(0)])), sniff(new Uint8Array([0x49, 0x49, 0x2a, 0]))], ["bmp", "tiff"]);
eq("animated gif", [isAnimatedGif(fx("animated.gif")), isAnimatedGif(fx("animated.gif").slice(0, 46))], [true, false]);
eq("rename", [renameOutput("{name}", "IMG_1.HEIC", 1, "jpg"), renameOutput("{name}-web", "a.b.png", 2, "webp"), renameOutput("photo-{n}", "x.png", 3, "avif"), renameOutput("../../etc/{name}", "x.png", 1, "jpg"), renameOutput("", "x.png", 1, "png"), renameOutput("a:b*c?", "x.png", 1, "png")], ["IMG_1.jpg", "a.b-web.webp", "photo-3.avif", "etc-x.jpg", "x.png", "a-b-c-.png"]);
eq("targetSize", [targetSize(4000, 3000, 1600, null, true), targetSize(4000, 3000, null, 300, true), targetSize(4000, 3000, 1000, 1000, true), targetSize(4000, 3000, 1000, 1000, false), targetSize(400, 300, null, null, true)], [{ width: 1600, height: 1200 }, { width: 400, height: 300 }, { width: 1000, height: 750 }, { width: 1000, height: 1000 }, { width: 400, height: 300 }]);

/* ---------------- pdf images ---------------- */
eq("planSize A4", [72, 150, 300].map((d) => [planSize(595.28, 841.89, d).width, planSize(595.28, 841.89, d).height]), [[595, 842], [1240, 1754], [2480, 3508]]);
const big = planSize(2384, 3370, 300); // A0
ok("planSize caps huge pages", big.capped && big.width * big.height <= 16_000_000 && big.dpi < 300, big);
eq("outName", [outName("report", 3, 120, "image/jpeg"), outName("r", 1, 5, "image/png")], ["report-page-003.jpg", "r-page-1.png"]);

/* ---------------- word ---------------- */
eq("sniffWord", [sniffWord(fx("proposal.docx")), sniffWord(fx("legacy.doc")), sniffWord(fx("report.pdf"))], ["docx", "legacy-doc", "not-word"]);
eq("pageLabel", [pageLabel({ w: 595.3, h: 841.9, margins: [0, 0, 0, 0] }), pageLabel({ w: 792, h: 612, margins: [0, 0, 0, 0] }), pageLabel({ w: 500, h: 500, margins: [0, 0, 0, 0] })], ["A4 portrait", "Letter landscape", "500 × 500 pt portrait"]);

/* ---------------- ocr ---------------- */
eq("tidy", tidy("  Hello   \nworld  \n\n\n\nNext  "), "Hello\nworld\n\nNext");

console.log(fails ? `\n${fails} FAILED` : "\nAll tools-8 tests passed");
process.exit(fails ? 1 : 0);
