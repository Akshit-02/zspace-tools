import { analyzeJson, printJson } from "../src/lib/json-tools";
import { calculateAge, parseISODate, toISO } from "../src/lib/age";
import { calculateGst, GST_PRESETS, formatINR } from "../src/lib/gst";
import { convert, formatQuantity, UNIT_CATEGORIES } from "../src/lib/units";
import { convertCase, CASES, splitWords } from "../src/lib/case";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};

/* ---------- JSON ---------- */
const j = (s: string) => analyzeJson(s);
const fmt = (s: string, i: "2" | "4" | "tab" | "min") => {
  const r = j(s);
  return r.ok ? printJson(r.tokens, i) : null;
};
eq("json: nested beautify 2", fmt('{"a":[1,{"b":null}],"c":{}}', "2"), '{\n  "a": [\n    1,\n    {\n      "b": null\n    }\n  ],\n  "c": {}\n}');
eq("json: tab indent", fmt('{"a":1}', "tab"), '{\n\t"a": 1\n}');
eq("json: minify", fmt('{ "a" : [ 1 , 2 ] ,\n "b" : "x y" }', "min"), '{"a":[1,2],"b":"x y"}');
eq("json: big int preserved (lossless)", fmt('{"id":12345678901234567890,"f":1.0,"e":1E3}', "min"), '{"id":12345678901234567890,"f":1.0,"e":1E3}');
eq("json: escapes preserved", fmt('["\\u00e9\\n\\"q\\""]', "min"), '["\\u00e9\\n\\"q\\""]');
eq("json: top-level array/scalars", [fmt("[]", "2"), fmt('"x"', "2"), fmt("42", "2")], ["[]", '"x"', "42"]);
eq("json: matches JSON.parse semantics", JSON.parse(fmt('{"a":[1,2,{"b":[true,false,null]}]}', "4")!), { a: [1, 2, { b: [true, false, null] }] });
eq("json: empty", (j("   ") as { empty?: boolean }).empty, true);
const err = (s: string) => {
  const r = j(s);
  return r.ok || "empty" in r ? "ok?" : `${r.error.line}:${r.error.column} ${r.error.message}`;
};
eq("json: trailing comma object", err('{\n  "a": 1,\n}'), '3:1 Trailing comma before }.');
eq("json: trailing comma array", err("[1,2,]"), "1:6 Trailing comma before ].");
eq("json: unquoted key", err("{a:1}"), '1:2 Unexpected word "a".');
eq("json: single quotes", err("{'a':1}"), "1:2 Single quotes aren't allowed.");
eq("json: missing comma", err('{"a":1 "b":2}'), '1:8 Expected "," or "}" but found ""b"".');
eq("json: mismatched brackets", err('{"a":[1,2}'), '1:10 Expected "," or "]" but found "}".');
eq("json: unclosed", err('{"a":{"b":1}'), "1:1 Unclosed object — a closing } is missing.");
eq("json: unterminated string", err('{"a":"x}'), "1:6 Unterminated string — a closing double quote is missing.");
eq("json: comment", err('{"a":1 // c\n}'), "1:8 Comments aren't allowed in JSON.");
eq("json: leading zero", err("[07]"), "1:2 Invalid number.");
eq("json: NaN hint", (() => { const r = j("[NaN]"); return !r.ok && "error" in r ? r.error.hint : ""; })(), "NaN isn't valid JSON. Use null or a string.");
eq("json: extra content", err('{"a":1} {"b":2}'), '1:9 Unexpected "{" after the end of the JSON.');
eq("json: duplicate key warning", (() => { const r = j('{"a":1,"a":2}'); return r.ok ? r.warnings.length : -1; })(), 1);
eq("json: unsafe int warning", (() => { const r = j("[9007199254740993]"); return r.ok ? r.warnings.length : -1; })(), 1);
eq("json: agrees with native on random valid input", (() => {
  const v = { x: [1, -2.5e-3, "é ", { y: [[], {}] }], z: null };
  const s = JSON.stringify(v, null, 3);
  const out = fmt(s, "min")!;
  return JSON.stringify(JSON.parse(out)) === JSON.stringify(v);
})(), true);

/* ---------- Age ---------- */
const d = (s: string) => parseISODate(s)!;
const age = (a: string, b: string, today = b) => {
  const r = calculateAge(d(a), d(b), { today: d(today) });
  return r.ok ? r.result : r.error;
};
const ymd = (a: string, b: string) => { const r = age(a, b); return typeof r === "string" ? r : [r.years, r.months, r.days]; };
eq("age: ordinary", ymd("1990-05-15", "2026-11-12"), [36, 5, 28]);
eq("age: birthday today", (() => { const r = age("2000-11-12", "2026-11-12"); return typeof r === "string" ? r : [r.years, r.months, r.days, r.isBirthday, r.daysToBirthday]; })(), [26, 0, 0, true, 0]);
eq("age: day before birthday", ymd("2000-11-13", "2026-11-12"), [25, 11, 30]);
eq("age: month-end 31 Jan → 28 Feb completes a month (clamped)", ymd("2023-01-31", "2023-02-28"), [0, 1, 0]);
eq("age: 30 Jan → 28 Feb", ymd("2023-01-30", "2023-02-28"), [0, 1, 0]);
eq("age: 28 Feb → 31 Mar", ymd("2023-02-28", "2023-03-31"), [0, 1, 3]);
eq("age: month-end 31 Jan → 1 Mar", ymd("2023-01-31", "2023-03-01"), [0, 1, 1]);
eq("age: 31 Jan → 31 Mar", ymd("2023-01-31", "2023-03-31"), [0, 2, 0]);
eq("age: leapling in common year (28 Feb = birthday)", (() => { const r = age("2000-02-29", "2023-02-28"); return typeof r === "string" ? r : [r.years, r.months, r.days, r.isBirthday]; })(), [23, 0, 0, true]);
eq("age: leapling day before", ymd("2000-02-29", "2023-02-27"), [22, 11, 29]);
eq("age: leapling leap year", ymd("2000-02-29", "2024-02-29"), [24, 0, 0]);
eq("age: leapling next birthday in common year", (() => { const r = age("2000-02-29", "2026-11-12"); return typeof r === "string" ? r : toISO(r.nextBirthday); })(), "2027-02-28");
eq("age: next birthday & countdown", (() => { const r = age("1990-12-25", "2026-11-12"); return typeof r === "string" ? r : [toISO(r.nextBirthday), r.daysToBirthday, r.ageAtNextBirthday]; })(), ["2026-12-25", 43, 36]);
eq("age: total days/weeks/months", (() => { const r = age("2026-01-01", "2026-11-12"); return typeof r === "string" ? r : [r.totalDays, r.totalWeeks, r.weekRemainderDays, r.totalMonths]; })(), [315, 45, 0, 10]);
eq("age: weekday born", (() => { const r = age("2000-01-01", "2026-11-12"); return typeof r === "string" ? r : r.bornOn; })(), "Saturday");
eq("age: future DOB rejected", calculateAge(d("2030-01-01"), d("2031-01-01"), { today: d("2026-11-12") }).ok, false);
eq("age: start after end rejected", calculateAge(d("2020-01-02"), d("2020-01-01"), {}).ok, false);
eq("age: future allowed in date-diff mode", calculateAge(d("2030-01-01"), d("2031-03-01"), { allowFutureStart: true }).ok, true);
eq("age: invalid date rejected", [parseISODate("2023-02-29"), parseISODate("2023-13-01")], [null, null]);
eq("age: same day", ymd("2026-11-12", "2026-11-12"), [0, 0, 0]);
eq("age: century not leap (1900)", ymd("1896-02-29", "1900-02-28"), [4, 0, 0]);

/* ---------- GST ---------- */
const g = (m: "add" | "remove", a: string, r: string, s: "intra" | "inter" = "intra") => {
  const o = calculateGst(m, a, r, s);
  return o.status === "ok" ? [o.result.taxable, o.result.tax, o.result.total, o.result.cgst, o.result.sgst, o.result.igst] : o.status;
};
eq("gst: add 18% intra", g("add", "1000", "18"), [1000, 180, 1180, 90, 90, 0]);
eq("gst: remove 18% (not 18% of inclusive)", g("remove", "1180", "18"), [1000, 180, 1180, 90, 90, 0]);
eq("gst: add 18% inter → IGST", g("add", "1000", "18", "inter"), [1000, 180, 1180, 0, 0, 180]);
for (const r of GST_PRESETS) {
  const add = calculateGst("add", "2499.99", String(r), "intra");
  const back = add.status === "ok" ? calculateGst("remove", String(add.result.total), String(r), "intra") : add;
  eq(`gst: preset ${r}% add→remove round trip`, back.status === "ok" && add.status === "ok" ? Math.abs(back.result.taxable - 2499.99) <= 0.01 && back.result.taxable + back.result.tax === back.result.total : false, true);
}
eq("gst: custom 3%", g("add", "50000", "3"), [50000, 1500, 51500, 750, 750, 0]);
eq("gst: zero amount", g("add", "0", "18"), [0, 0, 0, 0, 0, 0]);
eq("gst: zero rate", g("remove", "999", "0"), [999, 0, 999, 0, 0, 0]);
eq("gst: odd paise split sums", (() => { const o = calculateGst("add", "0.05", "18", "intra"); return o.status === "ok" ? Math.round((o.result.cgst + o.result.sgst) * 100) === Math.round(o.result.tax * 100) : false; })(), true);
eq("gst: decimals & rounding", g("remove", "999.99", "12"), [892.85, 107.14, 999.99, 53.57, 53.57, 0]);
eq("gst: Indian formatting", formatINR(1234567.5), "₹12,34,567.50");
eq("gst: commas accepted", g("add", "1,00,000", "5"), [100000, 5000, 105000, 2500, 2500, 0]);
eq("gst: invalid amount", calculateGst("add", "abc", "18", "intra").status, "error");
eq("gst: negative rejected", calculateGst("add", "-5", "18", "intra").status, "error");
eq("gst: empty", calculateGst("add", "", "18", "intra").status, "empty");

/* ---------- Units ---------- */
const c = (cat: Parameters<typeof convert>[0], v: string, a: string, b: string) => {
  const o = convert(cat, v, a, b);
  return o.status === "ok" ? formatQuantity(o.value) : o.status;
};
eq("unit: 1 in = 2.54 cm", c("length", "1", "in", "cm"), "2.54");
eq("unit: 1 mi = 1.609344 km", c("length", "1", "mi", "km"), "1.609344");
eq("unit: 5 ft → m", c("length", "5", "ft", "m"), "1.524");
eq("unit: 1 lb = 453.59237 g", c("mass", "1", "lb", "g"), "453.59237");
eq("unit: 16 oz = 1 lb", c("mass", "16", "oz", "lb"), "1");
eq("unit: 100 °C = 212 °F", c("temperature", "100", "C", "F"), "212");
eq("unit: -40 °F = -40 °C", c("temperature", "-40", "F", "C"), "-40");
eq("unit: 0 K = -273.15 °C", c("temperature", "0", "K", "C"), "-273.15");
eq("unit: 98.6 °F = 37 °C", c("temperature", "98.6", "F", "C"), "37");
eq("unit: below absolute zero rejected", c("temperature", "-500", "F", "C"), "error");
eq("unit: 1 acre = 43,560 ft²", c("area", "1", "ac", "ft2"), "43,560");
eq("unit: 1 ha = 2.47105381467 ac", c("area", "1", "ha", "ac"), "2.47105381467");
eq("unit: 1 US gal = 128 fl oz", c("volume", "1", "gal", "floz"), "128");
eq("unit: 1 m³ = 1000 L", c("volume", "1", "m3", "L"), "1,000");
eq("unit: 100 km/h → mph", c("speed", "100", "kmh", "mph"), "62.1371192237");
eq("unit: 1 kn = 1.852 km/h", c("speed", "1", "kn", "kmh"), "1.852");
eq("unit: 1 week = 168 h", c("time", "1", "wk", "h"), "168");
eq("unit: 1 GB = 1000 MB", c("data", "1", "GB", "MB"), "1,000");
eq("unit: 1 GiB = 1024 MiB", c("data", "1", "GiB", "MiB"), "1,024");
eq("unit: 1 GB = 0.931322574615 GiB", c("data", "1", "GB", "GiB"), "0.931322574615");
eq("unit: 1 byte = 8 bit", c("data", "1", "B", "bit"), "8");
eq("unit: negative length rejected", c("length", "-3", "m", "ft"), "error");
eq("unit: invalid", c("length", "abc", "m", "ft"), "error");
eq("unit: extreme exponent", c("length", "1e300", "km", "mm"), "1 × 10^306");
eq("unit: overflow → error not Infinity", c("length", "1e308", "km", "mm"), "error");
eq("unit: tiny", c("length", "1", "mm", "mi"), "6.21371192e-7".replace(/e-7/, " × 10^-7"));
eq("unit: zero", c("mass", "0", "kg", "lb"), "0");
// every pair in every category round-trips
let rt = true;
for (const cat of UNIT_CATEGORIES) for (const a of cat.units) for (const b of cat.units) {
  const f = convert(cat.id, "12.5", a.id, b.id);
  const back = f.status === "ok" ? convert(cat.id, String(f.value), b.id, a.id) : f;
  if (back.status !== "ok" || Math.abs(back.value - 12.5) > 1e-9) { rt = false; console.log("  round-trip fail", cat.id, a.id, b.id); }
}
eq("unit: every unit pair round-trips (all categories)", rt, true);

/* ---------- Case ---------- */
const k = (s: string, m: Parameters<typeof convertCase>[1]) => convertCase(s, m);
eq("case: upper unicode", k("straße café", "upper"), "STRASSE CAFÉ");
eq("case: lower", k("ÉCOLE Ünïcode", "lower"), "école ünïcode");
eq("case: title small words", k("the art of war and the lord of the rings", "title"), "The Art of War and the Lord of the Rings");
eq("case: title keeps acronyms/brands, hyphens", k("using NASA data on an iPhone: a self-driving guide", "title"), "Using NASA Data on an iPhone: A Self-Driving Guide");
eq("case: title from ALL CAPS", k("HOW TO WIN FRIENDS", "title"), "How to Win Friends");
eq("case: title last word capitalised", k("what are you looking at", "title"), "What Are You Looking At");
eq("case: title leaves codes/identifiers", k("it's 2x faster with mp3 and user_id v2.0", "title"), "It's 2x Faster with mp3 and user_id v2.0");
eq("case: sentence", k("HELLO WORLD. how are you? i'm fine!\nnew line here", "sentence"), "Hello world. How are you? I'm fine!\nNew line here");
eq("case: sentence keeps acronyms", k("we use the API daily. it works", "sentence"), "We use the API daily. It works");
eq("case: capitalized", k("don't stop — it's 2x fast", "capitalized"), "Don't Stop — It's 2x Fast");
eq("case: camel", k("Hello world, again!", "camel"), "helloWorldAgain");
eq("case: pascal from snake", k("user_first-name", "pascal"), "UserFirstName");
eq("case: snake from camel+acronym", k("XMLHttpRequest parser", "snake"), "xml_http_request_parser");
eq("case: kebab numbers", k("Version 2 beta3 Release", "kebab"), "version-2-beta3-release");
eq("case: constant", k("api base url", "constant"), "API_BASE_URL");
eq("case: dot / path", [k("Hello World", "dot"), k("Hello World", "path")], ["hello.world", "hello/world"]);
eq("case: code cases keep line breaks", k("first line\nsecond line", "snake"), "first_line\nsecond_line");
eq("case: alternating skips punctuation", k("hello, world", "alternating"), "hElLo, WoRlD");
eq("case: inverse", k("Hello WORLD 123", "inverse"), "hELLO world 123");
eq("case: unicode words split", splitWords("naïve café—déjà vu"), ["naïve", "café", "déjà", "vu"]);
eq("case: empty input", CASES.map((m) => convertCase("", m.id)).every((s) => s === ""), true);
eq("case: collapse spaces option", convertCase("a   b\n  c", "lower", { collapseSpaces: true }), "a b\nc");
eq("case: multiple spaces preserved by default", k("a   b", "upper"), "A   B");

if (fails) process.exitCode = 1;
console.log(fails ? `\n${fails} failing` : "\nall passing");
