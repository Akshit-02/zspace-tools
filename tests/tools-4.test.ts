import { convertUrl, findMalformed } from "../src/lib/url-codec";
import { decodeText, encodeText, normaliseBase64, bytesToBase64, base64ToBytes, sniffType } from "../src/lib/base64";
import { parseCsv, toJson, uniqueHeaders, type CsvOptions } from "../src/lib/csv";
import { businessDays, countWeekdays, daysBetween, parseHolidays, shiftDate, dayOfWeek, parseISODate } from "../src/lib/date-calc";
import { buildSchedule, emi, emiExact, validateLoan, yearly, scheduleCsv } from "../src/lib/emi";
import { dayNumber, toISO } from "../src/lib/age";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const out = (r: ReturnType<typeof convertUrl>) => (r.ok ? r.output : `ERR ${r.message}`);

/* URL */
eq("url: encodeURI keeps structure", out(convertUrl("https://a.com/p?q=a b&x=1#top", "encodeURI")), "https://a.com/p?q=a%20b&x=1#top");
eq("url: component encodes reserved", out(convertUrl("a b&c=d?e#f/g+h%", "encodeURIComponent")), "a%20b%26c%3Dd%3Fe%23f%2Fg%2Bh%25");
eq("url: unicode + emoji", out(convertUrl("café 🍰", "encodeURIComponent")), "caf%C3%A9%20%F0%9F%8D%B0");
eq("url: decode component", out(convertUrl("caf%C3%A9%20%26%20%F0%9F%8D%B0", "decodeURIComponent")), "café & 🍰");
eq("url: decodeURI keeps reserved", out(convertUrl("a%2Fb%20c", "decodeURI")), "a%2Fb c");
eq("url: plus kept by default", out(convertUrl("a+b", "decodeURIComponent")), "a+b");
eq("url: plus as space option", out(convertUrl("a+b%2B", "decodeURIComponent", { plusAsSpace: true })), "a b+");
eq("url: malformed %", out(convertUrl("100%", "decodeURIComponent")).startsWith("ERR"), true);
eq("url: malformed position", findMalformed("ok%2Gbad")?.index, 2);
eq("url: bad utf-8 run", out(convertUrl("%C3", "decodeURIComponent")).includes("incomplete"), true);
eq("url: double-encode warning", (() => { const r = convertUrl("a%20b", "encodeURIComponent"); return r.ok && r.notes.some((n) => n.includes("%25")) && r.output; })(), "a%2520b");
eq("url: still-encoded hint", (() => { const r = convertUrl("a%2520b", "decodeURIComponent"); return r.ok && r.notes.some((n) => n.includes("encoded twice")); })(), true);
eq("url: lone surrogate", out(convertUrl("\ud800", "encodeURIComponent")).startsWith("ERR"), true);
eq("url: empty", out(convertUrl("", "encodeURIComponent")), "");

/* Base64 */
eq("b64: ascii", encodeText("Hello"), "SGVsbG8=");
eq("b64: unicode", encodeText("नमस्ते"), btoa(String.fromCharCode(...new TextEncoder().encode("नमस्ते"))));
eq("b64: emoji round trip", (() => { const d = decodeText(encodeText("hi 👋🏽\nline2")); return d.ok && d.text; })(), "hi 👋🏽\nline2");
eq("b64: url-safe", encodeText("??>>", { urlSafe: true }), "Pz8-Pg");
eq("b64: decode url-safe w/o padding", (() => { const d = decodeText("Pz8-Pg"); return d.ok && d.text; })(), "??>>");
eq("b64: wrap 76", encodeText("x".repeat(100), { wrap: true }).split("\n").map((l) => l.length), [76, 60]);
eq("b64: whitespace tolerated", (() => { const d = decodeText("SGVs\n bG8="); return d.ok && d.text; })(), "Hello");
eq("b64: invalid char", (decodeText("SGV$bG8=") as { message: string }).message.startsWith('"$" isn'), true);
eq("b64: bad length", decodeText("SGVsb").ok, false);
eq("b64: padding mid-string", decodeText("SG=sbG8=").ok, false);
eq("b64: empty", decodeText("  ").ok, false);
eq("b64: binary detected", (decodeText(bytesToBase64(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0xff, 0xfe]))) as { message: string }).message.includes("PNG"), true);
eq("b64: data URL accepted", (() => { const d = decodeText("data:text/plain;base64,SGVsbG8="); return d.ok && d.text; })(), "Hello");
eq("b64: large text", (() => { const s = "€".repeat(300000); const d = decodeText(encodeText(s)); return d.ok && d.text === s; })(), true);
eq("b64: bytes round trip", (() => { const b = new Uint8Array(1000).map((_, i) => (i * 37) % 256); return bytesToBase64(b) === Buffer.from(b).toString("base64") && base64ToBytes(bytesToBase64(b)).every((v, i) => v === b[i]); })(), true);
eq("b64: sniff pdf", sniffType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))?.ext, "pdf");
eq("b64: normalise mixed alphabets rejected", normaliseBase64("ab+-").ok, false);

/* CSV */
const O: CsvOptions = { delimiter: "auto", custom: "", header: true, inferTypes: false, empty: "string", skipEmptyLines: true };
const csv = (t: string, o: Partial<CsvOptions> = {}) => { const r = parseCsv(t, { ...O, ...o }); return r.ok ? r : { err: r.message }; };
const simple = csv("name,city,role\nAmit,Mumbai,Founder\nPriya,Delhi,Designer");
eq("csv: simple → objects (spec example)", "objects" in simple && toJson(simple, "objects", true), '[\n  {\n    "name": "Amit",\n    "city": "Mumbai",\n    "role": "Founder"\n  },\n  {\n    "name": "Priya",\n    "city": "Delhi",\n    "role": "Designer"\n  }\n]');
eq("csv: arrays + minified", "objects" in simple && toJson(simple, "arrays", false), '[["name","city","role"],["Amit","Mumbai","Founder"],["Priya","Delhi","Designer"]]');
const q = csv('a,b\n"x, y","say ""hi"""\n"multi\nline",z');
eq("csv: quoted commas, escaped quotes, multiline", "objects" in q && q.objects, [{ a: "x, y", b: 'say "hi"' }, { a: "multi\nline", b: "z" }]);
const ragged = csv("a,b,c\n1,2\n3,4,5,6");
eq("csv: ragged rows keep data + report", "objects" in ragged && [ragged.objects, ragged.issues.length, ragged.headers], [[{ a: "1", b: "2", c: "", column_4: "" }, { a: "3", b: "4", c: "5", column_4: "6" }], 2, ["a", "b", "c", "column_4"]]);
eq("csv: missing as null", (() => { const r = csv("a,b\n1,", { empty: "null" }); return "objects" in r && r.objects; })(), [{ a: "1", b: null }]);
eq("csv: duplicate + empty headers", uniqueHeaders(["id", "name", "", "name", "name_2"]).headers, ["id", "name", "column_3", "name_2", "name_2_2"]);
eq("csv: tab auto-detect", (() => { const r = csv("a\tb\n1\t2"); return "objects" in r && [r.delimiter, r.objects]; })(), ["\t", [{ a: "1", b: "2" }]]);
eq("csv: semicolon auto-detect (EU)", (() => { const r = csv("name;price\nCafé;3,50"); return "objects" in r && [r.delimiter, r.objects]; })(), [";", [{ name: "Café", price: "3,50" }]]);
eq("csv: custom delimiter", (() => { const r = csv("a~b\n1~2", { delimiter: "custom", custom: "~" }); return "objects" in r && r.objects; })(), [{ a: "1", b: "2" }]);
eq("csv: no header row", (() => { const r = csv("1,2\n3,4", { header: false }); return "objects" in r && r.objects; })(), [{ column_1: "1", column_2: "2" }, { column_1: "3", column_2: "4" }]);
eq("csv: type inference keeps long ids & leading zeros", (() => { const r = csv("n,id,zip,b\n3.5,12345678901234567890,007,true", { inferTypes: true }); return "objects" in r && r.objects; })(), [{ n: 3.5, id: "12345678901234567890", zip: "007", b: true }]);
eq("csv: empty file", "err" in csv("  \n "), true);
eq("csv: header only reported", (() => { const r = csv("a,b"); return "objects" in r && [r.objects.length, r.issues.length]; })(), [0, 1]);
eq("csv: unicode + BOM", (() => { const r = csv("﻿nom,ville\nChloé,Zürich 🇨🇭"); return "objects" in r && r.objects; })(), [{ nom: "Chloé", ville: "Zürich 🇨🇭" }]);
eq("csv: unclosed quote reported", (() => { const r = csv('a,b\n"open,1'); return "objects" in r && r.issues.some((i) => i.message.includes("never closed")); })(), true);

/* Dates */
const d = (s: string) => parseISODate(s)!;
const bw = (a: string, b: string, inc = false) => { const r = daysBetween(d(a), d(b), inc); return [r.countedDays, r.weekdays, r.weekendDays, r.reversed]; };
eq("date: simple elapsed", bw("2026-01-01", "2026-01-31"), [30, 22, 8, false]);
eq("date: inclusive adds one", bw("2026-01-01", "2026-01-31", true)[0], 31);
eq("date: leap year Feb", bw("2024-02-01", "2024-03-01")[0], 29);
eq("date: non-leap Feb", bw("2023-02-01", "2023-03-01")[0], 28);
eq("date: year boundary", bw("2025-12-31", "2026-01-01")[0], 1);
eq("date: reversed handled", bw("2026-03-01", "2026-01-01"), [59, 42, 17, true]);
eq("date: same day exclusive 0 / inclusive 1", [bw("2026-05-05", "2026-05-05")[0], bw("2026-05-05", "2026-05-05", true)[0]], [0, 1]);
eq("date: months + days", (() => { const r = daysBetween(d("2026-01-15"), d("2026-04-20"), false); return [r.months, r.monthRemainderDays]; })(), [3, 5]);
const sh = (s: string, o: Partial<{ years: number; months: number; weeks: number; days: number }>, sign: 1 | -1 = 1) => { const r = shiftDate(d(s), { years: 0, months: 0, weeks: 0, days: 0, ...o }, sign); return r.ok ? toISO(r.date) : r.error; };
eq("date: +1 month from 31 Jan clamps", sh("2026-01-31", { months: 1 }), "2026-02-28");
eq("date: +1 month leap", sh("2024-01-31", { months: 1 }), "2024-02-29");
eq("date: +1 year from 29 Feb", sh("2024-02-29", { years: 1 }), "2025-02-28");
eq("date: +4 years from 29 Feb", sh("2024-02-29", { years: 4 }), "2028-02-29");
eq("date: +90 days across year", sh("2025-11-15", { days: 90 }), "2026-02-13");
eq("date: -1 month from 31 Mar", sh("2026-03-31", { months: 1 }, -1), "2026-02-28");
eq("date: months then days", sh("2026-01-31", { months: 1, days: 1 }), "2026-03-01");
eq("date: weeks", sh("2026-11-12", { weeks: 2 }), "2026-11-26");
eq("date: invalid negative", sh("2026-11-12", { days: -3 }).startsWith("Enter whole"), true);
eq("date: out of range", sh("9999-12-31", { days: 1 }).includes("outside"), true);
eq("date: weekday", ["2026-11-12", "2000-01-01", "1970-01-01", "1900-01-01"].map((x) => dayOfWeek(d(x))), [4, 6, 4, 1]);
// brute-force cross-check of weekday counting
let ok = true;
for (let s = dayNumber(d("2023-12-20")); s < dayNumber(d("2024-01-10")); s++) for (let n = 0; n < 40; n++) {
  let brute = 0;
  for (let i = 0; i < n; i++) if ([0, 6].includes((((s + i + 4) % 7) + 7) % 7)) brute++;
  if (countWeekdays(s, n, new Set([0, 6])) !== brute) ok = false;
}
eq("date: weekday counting matches brute force", ok, true);
const bd = businessDays(d("2026-12-01"), d("2026-12-31"), new Set([0, 6]), parseHolidays("2026-12-25, 2026-12-26\n2027-01-01 2026-12-25").dates);
eq("date: business days w/ holidays", [bd.totalDays, bd.weekendDays, bd.holidaysExcluded, bd.holidaysOnWeekends, bd.holidaysOutside, bd.businessDays], [31, 8, 1, 1, 1, 22]);
eq("date: Fri–Sat weekend", businessDays(d("2026-11-01"), d("2026-11-07"), new Set([5, 6]), []).businessDays, 5);
eq("date: invalid holidays reported", parseHolidays("2026-02-30 25/12/2026 2026-12-25").invalid, ["2026-02-30", "25/12/2026"]);

/* EMI */
const L = { principal: 1_000_000, annualRate: 10, months: 240 };
eq("emi: formula 10L @10% 20y", emi(L), 9650.22);
eq("emi: matches exact", Math.abs(emiExact(L) - 9650.216) < 0.001, true);
const s = buildSchedule(L);
eq("emi: schedule length + closes to zero", [s.rows.length, s.rows.at(-1)!.closing], [240, 0]);
eq("emi: totals consistent", Math.round((s.totalPaid - L.principal) * 100) / 100 === s.totalInterest, true);
eq("emi: total interest ≈", Math.abs(s.totalInterest - 1316052) < 5, true);
eq("emi: zero interest", [emi({ principal: 120000, annualRate: 0, months: 12 }), buildSchedule({ principal: 120000, annualRate: 0, months: 12 }).totalInterest], [10000, 0]);
eq("emi: zero interest uneven split closes", buildSchedule({ principal: 100000, annualRate: 0, months: 3 }).rows.map((r) => r.emi), [33333.33, 33333.33, 33333.34]);
eq("emi: decimal rate", emi({ principal: 500000, annualRate: 8.75, months: 60 }), 10318.62);
eq("emi: large loan finite", Number.isFinite(emi({ principal: 1e12, annualRate: 12, months: 600 })), true);
const pre = buildSchedule(L, { monthly: 2000, monthlyFrom: 1, lump: 100000, lumpMonth: 12 });
eq("emi: prepayment shortens tenure & saves interest", pre.months < 240 && pre.totalInterest < s.totalInterest && pre.rows.at(-1)!.closing === 0, true);
console.log(`      prepay: ${pre.months} months, interest ${pre.totalInterest} vs ${s.totalInterest}`);
eq("emi: yearly summary sums", (() => { const y = yearly(s.rows); return [y.length, Math.round(y.reduce((a, r) => a + r.principal, 0))]; })(), [20, 1000000]);
eq("emi: validation", [validateLoan(0, 10, 12), validateLoan(1000, -1, 12), validateLoan(1000, 10, 0), validateLoan(1000, 0, 12)].map((v) => v === null), [false, false, false, true]);
eq("emi: csv export", scheduleCsv(buildSchedule({ principal: 1000, annualRate: 12, months: 2 }), "INR").split("\n").slice(1, 3), ["Month,Opening balance,EMI,Principal,Interest,Prepayment,Closing balance", "1,1000.00,507.51,497.51,10.00,0.00,502.49"]);

if (fails) process.exitCode = 1;
console.log(fails ? `\n${fails} failing` : "\nall passing");
