import { contrastRatio, formatHsl, hslToRgb, palette, parseHex, parseHsl, parseRgb, rgbToHsl, tintsAndShades, toHex, wcag, fromShareParam } from "../src/lib/color";
import { UUID_RE, formatUuid, generateBatch, inspectUuid, uuidV4, uuidV7 } from "../src/lib/uuid";
import { isSafeUrl, markdownToRawHtml, markdownStats } from "../src/lib/markdown";
import { blankInvoice, calculate, formatMoney, newItem, parseNum, type Invoice } from "../src/lib/invoice";
import { applyRatio, clampMove, initialRect, orientedSize, resizeRect, type Handle } from "../src/lib/crop";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};

/* Color */
eq("hex 6-digit", parseHex("#F07845"), { r: 240, g: 120, b: 69 });
eq("hex 3-digit", parseHex("f80"), { r: 255, g: 136, b: 0 });
eq("hex invalid", [parseHex("#ff00"), parseHex("#gg0000"), parseHex("")], [null, null, null]);
eq("rgb → hex", toHex({ r: 240, g: 120, b: 69 }), "#F07845");
eq("rgb parse forms", [parseRgb("rgb(240, 120, 69)"), parseRgb("240 120 69"), parseRgb("256,0,0")], [{ r: 240, g: 120, b: 69 }, { r: 240, g: 120, b: 69 }, null]);
eq("rgb → hsl brand", rgbToHsl({ r: 240, g: 120, b: 69 }), { h: 17.9, s: 85.1, l: 60.6 });
eq("hsl → rgb primaries", [hslToRgb({ h: 0, s: 100, l: 50 }), hslToRgb({ h: 120, s: 100, l: 50 }), hslToRgb({ h: 240, s: 100, l: 50 })], [{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }]);
eq("hsl grey/black/white", [hslToRgb({ h: 0, s: 0, l: 50 }), hslToRgb({ h: 200, s: 50, l: 0 }), hslToRgb({ h: 200, s: 50, l: 100 })], [{ r: 128, g: 128, b: 128 }, { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]);
eq("hsl parse forms", [parseHsl("hsl(18, 85%, 61%)"), parseHsl("-10 50 50"), parseHsl("10, 150%, 50%")], [{ h: 18, s: 85, l: 61 }, { h: 350, s: 50, l: 50 }, null]);
let rt = true;
for (let i = 0; i < 4096; i++) {
  const c = { r: (i * 37) % 256, g: (i * 91) % 256, b: (i * 173) % 256 };
  const back = hslToRgb(rgbToHsl(c));
  if (Math.abs(back.r - c.r) > 1 || Math.abs(back.g - c.g) > 1 || Math.abs(back.b - c.b) > 1) rt = false;
}
eq("rgb ↔ hsl round trip within ±1 (4096 colours)", rt, true);
eq("formatHsl", formatHsl({ r: 240, g: 120, b: 69 }), "hsl(18, 85%, 61%)");
eq("contrast black/white = 21", Math.round(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }) * 100) / 100, 21);
eq("contrast same = 1", contrastRatio({ r: 9, g: 9, b: 9 }, { r: 9, g: 9, b: 9 }), 1);
eq("contrast #777 on white ≈ 4.48 (fails AA)", (() => { const r = contrastRatio(parseHex("#777")!, parseHex("#fff")!); return [Math.round(r * 100) / 100, wcag(r).aaNormal, wcag(r).aaLarge]; })(), [4.48, false, true]);
eq("contrast #767676 on white passes AA", wcag(contrastRatio(parseHex("#767676")!, parseHex("#fff")!)).aaNormal, true);
eq("palettes sizes", ["complementary", "analogous", "triadic", "split", "tetradic", "monochromatic"].map((k) => palette({ r: 240, g: 120, b: 69 }, k as never).length), [2, 3, 3, 3, 4, 5]);
eq("complementary hue +180", Math.round(rgbToHsl(palette(parseHex("#ff0000")!, "complementary")[1]).h), 180);
eq("tints/shades 11, centre = colour", (() => { const t = tintsAndShades(parseHex("#F07845")!); return [t.length, toHex(t[5]), toHex(t[0]) > toHex(t[10])]; })(), [11, "#F07845", true]);
eq("share param strict", [fromShareParam("f07845"), fromShareParam("javascript:alert(1)"), fromShareParam("f784")], [{ r: 240, g: 120, b: 69 }, null, null]);

/* UUID */
const v4 = Array.from({ length: 2000 }, uuidV4);
eq("v4 format + version + variant", v4.every((u) => UUID_RE.test(u) && u[14] === "4" && "89ab".includes(u[19])), true);
const v7 = Array.from({ length: 2000 }, () => uuidV7());
eq("v7 format + version + variant", v7.every((u) => UUID_RE.test(u) && u[14] === "7" && "89ab".includes(u[19])), true);
eq("v7 strictly increasing (sortable)", v7.every((u, i) => i === 0 || u > v7[i - 1]), true);
eq("v7 timestamp", (() => { const t = 1_767_225_600_000; const u = uuidV7(t + 10_000_000); return inspectUuid(u).timestamp!.getTime() >= t; })(), true);
eq("v7 embeds given ms", parseInt(uuidV7(1_800_000_000_000).replace(/-/g, "").slice(0, 12), 16) >= 1_800_000_000_000, true);
eq("batch unique 1000", new Set(generateBatch(1000, 4)).size, 1000);
eq("batch clamps to 1000", generateBatch(5000, 4).length, 1000);
eq("format options", formatUuid("0b8f1e0a-4c3d-4e5f-9a7b-1c2d3e4f5a6b", { uppercase: true, hyphens: false, braces: true }), "{0B8F1E0A4C3D4E5F9A7B1C2D3E4F5A6B}");
eq("inspect", [inspectUuid("0b8f1e0a-4c3d-4e5f-9a7b-1c2d3e4f5a6b").version, inspectUuid("nope").valid, inspectUuid("{0B8F1E0A4C3D4E5F9A7B1C2D3E4F5A6B}").variant], [4, false, "RFC 9562"]);

/* Markdown (parser level; DOMPurify is exercised in the browser e2e) */
const html = (s: string) => markdownToRawHtml(s);
eq("md: headings, emphasis, strike", html("# H1\n###### H6\n**b** *i* ~~s~~").replace(/\n/g, ""), "<h1>H1</h1><h6>H6</h6><p><strong>b</strong> <em>i</em> <del>s</del></p>");
eq("md: task list", html("- [x] done\n- [ ] todo").includes('type="checkbox"'), true);
eq("md: table", /<table>[\s\S]*<th[^>]*>A<\/th>[\s\S]*<td[^>]*>1<\/td>/.test(html("| A | B |\n|---|---|\n| 1 | 2 |")), true);
eq("md: code block escaped", html("```\n<script>x</script>\n```").includes("&lt;script&gt;"), true);
eq("md: raw HTML escaped", html("<img src=x onerror=alert(1)>").includes("<img"), false);
eq("md: javascript: link removed", html("[x](javascript:alert(1))").includes("href"), false);
eq("md: obfuscated scheme removed", html("[x](java\tscript:alert(1))").includes("href"), false);
eq("md: data:text/html link removed", html("[x](data:text/html;base64,PHNjcmlwdD4=)").includes("href"), false);
eq("md: safe links kept, external rel", html("[a](https://x.com) [b](/docs) [c](#top) [d](mailto:a@b.co)").match(/href=/g)?.length === 4 && html("[a](https://x.com)").includes('rel="noopener noreferrer nofollow"'), true);
eq("md: image svg data blocked, png allowed", [html("![](data:image/svg+xml;base64,AAA)").includes("<img"), html("![p](data:image/png;base64,AAA)").includes("<img")], [false, true]);
eq("md: isSafeUrl", [isSafeUrl("JaVaScRiPt:alert(1)", "link"), isSafeUrl(" https://ok.com", "link"), isSafeUrl("vbscript:x", "link")], [false, true, false]);
eq("md: unicode", html("café 日本語 🎉").includes("café 日本語 🎉"), true);
eq("md: stats", markdownStats("# Hello world\n\nTwo more words."), { words: 5, characters: 30, minutes: 1 });

/* Invoice */
const inv = (p: Partial<Invoice>): Invoice => ({ ...blankInvoice("2026-11-12", "2026-11-27"), ...p });
const t1 = calculate(inv({ taxMode: "single", taxLabel: "VAT", taxRate: "20", items: [newItem({ quantity: "2", unitPrice: "50" }), newItem({ quantity: "1", unitPrice: "100", discount: "10" })] }));
eq("inv: subtotal/discount/tax/total", [t1.gross, t1.lineDiscounts, t1.subtotal, t1.tax, t1.grandTotal], [20000, 1000, 19000, 3800, 22800]);
eq("inv: tax row label", t1.taxRows, [{ label: "VAT", rate: 20, amount: 3800 }]);
const t2 = calculate(inv({ taxMode: "gst-intra", taxRate: "18", discount: "10", items: [newItem({ quantity: "1", unitPrice: "1000" }), newItem({ quantity: "3", unitPrice: "333.33", taxRate: "5" })] }));
eq("inv: invoice discount spread + mixed GST rates", [t2.subtotal, t2.invoiceDiscount, t2.taxable, t2.taxRows.map((r) => [r.label, r.rate, r.amount])], [199999, 20000, 179999, [["CGST", 2.5, 2250], ["SGST", 2.5, 2250], ["CGST", 9, 8100], ["SGST", 9, 8100]]]);
eq("inv: totals add up exactly", t2.grandTotal === t2.taxable + t2.tax + t2.charges && t2.taxRows.reduce((s, r) => s + r.amount, 0) === t2.tax, true);
eq("inv: IGST", calculate(inv({ taxMode: "gst-inter", items: [newItem({ quantity: "1", unitPrice: "1000" })] })).taxRows, [{ label: "IGST", rate: 18, amount: 18000 }]);
eq("inv: no tax", calculate(inv({ taxMode: "none", items: [newItem({ quantity: "1", unitPrice: "99.99" })] })).grandTotal, 9999);
const t3 = calculate(inv({ taxMode: "none", charges: "50", paid: "100", discountType: "amount", discount: "25", items: [newItem({ quantity: "2", unitPrice: "100" })] }));
eq("inv: fixed discount, charges, paid, balance", [t3.subtotal, t3.invoiceDiscount, t3.grandTotal, t3.balance], [20000, 2500, 22500, 12500]);
eq("inv: discount capped at line amount", calculate(inv({ taxMode: "none", items: [newItem({ quantity: "1", unitPrice: "10", discount: "50", discountType: "amount" })] })).subtotal, 0);
eq("inv: negative/invalid rejected", calculate(inv({ items: [newItem({ quantity: "-1", unitPrice: "x" })] })).errors.length, 2);
eq("inv: empty items ok", calculate(inv({ items: [newItem()] })).grandTotal, 0);
eq("inv: fractional qty rounding", calculate(inv({ taxMode: "none", items: [newItem({ quantity: "2.5", unitPrice: "19.99" })] })).grandTotal, 4998);
eq("inv: 200 lines sum", calculate(inv({ taxMode: "single", taxRate: "10", items: Array.from({ length: 200 }, () => newItem({ quantity: "1", unitPrice: "0.05" })) })).grandTotal, 1100);
eq("inv: money formats", [formatMoney(123456789, "INR"), formatMoney(123456789, "USD"), formatMoney(123456789, "EUR"), formatMoney(123456789, "AED").replace(/ /g, " ")], ["₹12,34,567.89", "$1,234,567.89", "€1,234,567.89", "AED 1,234,567.89"]);
eq("inv: parseNum", [parseNum("1,250.5"), parseNum(""), parseNum("-3"), parseNum("abc")], [1250.5, 0, null, null]);

/* Crop */
const W = 4000, H = 3000;
eq("crop: initial ratio fits", initialRect(W, H, 1), { x: 650, y: 150, w: 2700, h: 2700 });
eq("crop: initial free", initialRect(W, H, null), { x: 200, y: 150, w: 3600, h: 2700 });
eq("crop: move clamps", clampMove({ x: 3900, y: -50, w: 500, h: 500 }, W, H), { x: 3500, y: 0, w: 500, h: 500 });
let ratioOk = true;
let boundsOk = true;
const handles: Handle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
for (let i = 0; i < 4000; i++) {
  const ratio = [1, 16 / 9, 9 / 16, 4 / 5][i % 4];
  const r0 = initialRect(W, H, ratio, 0.5);
  const r = resizeRect(r0, handles[i % 8], ((i * 977) % 3000) - 1500, ((i * 613) % 3000) - 1500, W, H, ratio);
  if (Math.abs(r.w - r.h * ratio) > 1 && Math.abs(r.h - r.w / ratio) > 1) ratioOk = false; // ±1px rounding
  if (r.x < 0 || r.y < 0 || r.x + r.w > W + 0.5 || r.y + r.h > H + 0.5 || r.w < 1) boundsOk = false;
}
eq("crop: ratio locked under random drags", ratioOk, true);
eq("crop: always inside image", boundsOk, true);
eq("crop: free resize se", resizeRect({ x: 100, y: 100, w: 200, h: 200 }, "se", 50, -20, W, H, null), { x: 100, y: 100, w: 250, h: 180 });
eq("crop: free resize nw keeps opposite corner", resizeRect({ x: 100, y: 100, w: 200, h: 200 }, "nw", 50, 30, W, H, null), { x: 150, y: 130, w: 150, h: 170 });
eq("crop: applyRatio keeps centre", applyRatio({ x: 1000, y: 1000, w: 1000, h: 1000 }, 16 / 9, W, H), { x: 833, y: 1125, w: 1333, h: 750 });
eq("crop: oriented size", [orientedSize(4000, 3000, 90), orientedSize(4000, 3000, 180)], [{ w: 3000, h: 4000 }, { w: 4000, h: 3000 }]);

if (fails) process.exitCode = 1;
console.log(fails ? `\n${fails} failing` : "\nall passing");
