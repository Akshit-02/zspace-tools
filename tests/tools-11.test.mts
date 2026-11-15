// Unit tests for tools 46–50: CSV ↔ JSON (JSON → CSV direction + CSV edge cases),
// Number to Words, Text Diff Checker, Markdown TOC helpers and File Hash Generator.
import { createHash, randomBytes, webcrypto } from "node:crypto";
import { parseCsv, type CsvOptions } from "../src/lib/csv";
import { jsonToCsv, JSON_CSV_DEFAULTS, JSON_SAMPLE, type JsonCsvOptions } from "../src/lib/json-csv";
import { buildCsv, csvField, looksLikeFormula } from "../src/lib/csv-write";
import { convert, convertBulk, CURRENCIES, groupDigits, integerToWords, parseNumber, roundDecimal, type ConvertOptions } from "../src/lib/number-words";
import { compareTexts, diffKeys, diffSequences, DIFF_DEFAULTS, splitLines, tokenize, unifiedDiff, type DiffOptions } from "../src/lib/text-diff";
import { headingSlug } from "../src/lib/markdown";
import { createHasher, hashBlob, hashText, parseExpected, toHex, verify, HEX_LENGTH, type HashAlgo } from "../src/lib/hash";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};

/* ================================================================== */
/* CSV → JSON edge cases (Papa Parse + own header/ragged handling)     */
/* ================================================================== */
const C: CsvOptions = { delimiter: "auto", custom: "", header: true, inferTypes: false, empty: "string", skipEmptyLines: true };
const objs = (csv: string, o: Partial<CsvOptions> = {}) => {
  const r = parseCsv(csv, { ...C, ...o });
  return r.ok ? r.objects : r.message;
};
eq("csv: simple", objs("a,b\n1,2"), [{ a: "1", b: "2" }]);
eq("csv: quoted comma + escaped quote", objs('a,b\n"x, y","say ""hi"""'), [{ a: "x, y", b: 'say "hi"' }]);
eq("csv: newline inside quotes", objs('a,b\n"line1\nline2",z'), [{ a: "line1\nline2", b: "z" }]);
eq("csv: CRLF = LF", objs("a,b\r\n1,2\r\n3,4\r\n"), objs("a,b\n1,2\n3,4\n"));
eq("csv: BOM stripped from first header", Object.keys((objs("﻿name,city\nA,B") as object[])[0]), ["name", "city"]);
eq("csv: empty cells kept", objs("a,b,c\n1,,3"), [{ a: "1", b: "", c: "3" }]);
eq("csv: empty cells as null", objs("a,b\n,2", { empty: "null" }), [{ a: null, b: "2" }]);
eq("csv: empty rows skipped", (objs("a\n1\n\n2\n") as object[]).length, 2);
eq("csv: duplicate headers → name, name_2, name_3", Object.keys((objs("name,name,name\n1,2,3") as object[])[0]), ["name", "name_2", "name_3"]);
{
  const r = parseCsv("a,b,c\n1,2\n1,2,3,4", C);
  eq("csv: missing + extra fields kept and reported", r.ok && [r.objects[0].c, r.objects[1].column_4, r.issues.length], ["", "4", 2]);
}
eq("csv: TSV auto-detect", objs("a\tb\n1\t2"), [{ a: "1", b: "2" }]);
eq("csv: semicolon auto-detect keeps decimal comma", objs("a;b\n1,5;2"), [{ a: "1,5", b: "2" }]);
eq("csv: pipe", objs("a|b\n1|2", { delimiter: "|" }), [{ a: "1", b: "2" }]);
eq("csv: type inference keeps 007 + big ids", objs("n,z,big,t\n3.5,007,12345678901234567890,true", { inferTypes: true }), [{ n: 3.5, z: "007", big: "12345678901234567890", t: true }]);
eq("csv: unicode", objs("नाम,शहर\nअमित,मुंबई"), [{ नाम: "अमित", शहर: "मुंबई" }]);
eq("csv: empty input message", typeof objs("   "), "string");
eq("csv: trailing newline doesn't add a row", (objs("a\n1\n") as object[]).length, 1);

/* ================================================================== */
/* CSV writer                                                          */
/* ================================================================== */
eq("write: quoting rules", [csvField("plain"), csvField("a,b"), csvField('say "hi"'), csvField("two\nlines"), csvField("cr\rx"), csvField("a;b", ";"), csvField("x", ",", true)], ["plain", '"a,b"', '"say ""hi"""', '"two\nlines"', '"cr\rx"', '"a;b"', '"x"']);
eq("write: CRLF + BOM", buildCsv([["a", "b"], ["1", "2"]], { bom: true }), "﻿a,b\r\n1,2\r\n");
eq("write: LF", buildCsv([["a"], ["1"]], { eol: "\n" }), "a\n1\n");
eq("write: formula detection", ["=SUM(A1)", "+1+1", "-2+3", "@cmd", "\tx", "-12.5", "+44", "-1,234.5", "hello", "a=b", ""].map(looksLikeFormula), [true, true, true, true, true, false, false, false, false, false, false]);

/* ================================================================== */
/* JSON → CSV                                                          */
/* ================================================================== */
const J = (json: string, o: Partial<JsonCsvOptions> = {}) => jsonToCsv(json, { ...JSON_CSV_DEFAULTS, eol: "lf", ...o });
const csvOf = (json: string, o: Partial<JsonCsvOptions> = {}) => {
  const r = J(json, o);
  return r.ok ? r.csv : `ERR ${r.message}`;
};
eq("j2c: array of objects", csvOf('[{"a":1,"b":"x"},{"a":2,"b":"y"}]'), "a,b\n1,x\n2,y\n");
eq("j2c: union of keys, first-seen order, missing → empty", csvOf('[{"a":1},{"b":2},{"a":3,"c":4}]'), "a,b,c\n1,,\n,2,\n3,,4\n");
{
  const r = J('[{"a":1},{"b":2}]');
  eq("j2c: missing keys warned", r.ok && r.warnings.some((w) => w.includes("don't have every column")), true);
}
eq("j2c: null, booleans, numbers, empty string", csvOf('[{"n":null,"t":true,"f":false,"x":1.5,"e":""}]'), "n,t,f,x,e\n,true,false,1.5,\n");
eq("j2c: null as text", csvOf('[{"n":null}]', { nulls: "null" }), "n\nnull\n");
eq("j2c: quotes, commas, newlines escaped", csvOf('[{"a":"x, y","b":"say \\"hi\\"","c":"l1\\nl2"}]'), 'a,b,c\n"x, y","say ""hi""","l1\nl2"\n');
eq("j2c: nested objects flattened", csvOf('[{"id":1,"addr":{"pin":"400001","geo":{"lat":19.1}}}]'), "id,addr.pin,addr.geo.lat\n1,400001,19.1\n");
eq("j2c: nested as JSON when flatten off", csvOf('[{"id":1,"addr":{"pin":"1"}}]', { flatten: false }), 'id,addr\n1,"{""pin"":""1""}"\n');
eq("j2c: arrays as JSON text (default)", csvOf('[{"tags":["a","b"]}]'), 'tags\n"[""a"",""b""]"\n');
eq("j2c: arrays one column per item", csvOf('[{"tags":["a","b"]},{"tags":["c"]}]', { arrays: "index" }), "tags.0,tags.1\na,b\nc,\n");
eq("j2c: array of objects inside array, indexed", csvOf('[{"items":[{"sku":"A"},{"sku":"B"}]}]', { arrays: "index" }), "items.0.sku,items.1.sku\nA,B\n");
eq("j2c: single object → one row", csvOf('{"a":1,"b":2}'), "a,b\n1,2\n");
eq("j2c: array of arrays written as rows", csvOf('[["h1","h2"],[1,2]]'), "h1,h2\n1,2\n");
eq("j2c: array of primitives → value column", csvOf("[1,2,3]"), "value\n1\n2\n3\n");
eq("j2c: header off", csvOf('[{"a":1}]', { header: false }), "1\n");
eq("j2c: semicolon + tab delimiters", [csvOf('[{"a":"1;2","b":3}]', { delimiter: ";" }), csvOf('[{"a":1,"b":2}]', { delimiter: "\t" })], ['a;b\n"1;2";3\n', "a\tb\n1\t2\n"]);
eq("j2c: CRLF default + BOM", jsonToCsv('[{"a":1}]', { ...JSON_CSV_DEFAULTS, bom: true }).ok && (jsonToCsv('[{"a":1}]', { ...JSON_CSV_DEFAULTS, bom: true }) as { csv: string }).csv, "﻿a\r\n1\r\n");
{
  const r = J('[{"f":"=HYPERLINK(\\"x\\")","n":"-5","m":"@SUM"}]');
  eq("j2c: formula cells reported, data unchanged by default", r.ok && [r.formulaCells, r.csv.includes('"=HYPERLINK(""x"")"')], [2, true]);
  const g = J('[{"f":"=1+1","n":"-5"}]', { formulaGuard: true });
  eq("j2c: spreadsheet-safe mode prefixes apostrophe", g.ok && g.csv, "f,n\n'=1+1,-5\n");
}
{
  const r = J('{"meta":{"page":1},"data":[{"a":1},{"a":2}]}');
  eq("j2c: wrapped records detected as candidate", r.ok && r.candidates, ["data"]);
  eq("j2c: path selects records", csvOf('{"meta":{"page":1},"data":[{"a":1},{"a":2}]}', { path: "data" }), "a\n1\n2\n");
}
{
  const r = J('[{"id":12345678901234567890}]');
  eq("j2c: unsafe big integers warned", r.ok && r.warnings.some((w) => w.includes("9,007,199,254,740,991")), true);
}
eq("j2c: invalid JSON gives line/column", (() => { const r = J('[{"a":1,}]'); return !r.ok && typeof r.line === "number" && r.message.startsWith("Invalid JSON"); })(), true);
eq("j2c: empty input", (() => { const r = J("  "); return !r.ok && r.message.includes("no JSON"); })(), true);
eq("j2c: primitive rejected", (() => { const r = J("42"); return !r.ok; })(), true);
eq("j2c: empty array rejected", (() => { const r = J("[]"); return !r.ok; })(), true);
eq("j2c: unicode + BOM input", csvOf('﻿[{"नाम":"अमित 🎉"}]'), "नाम\nअमित 🎉\n");
eq("j2c: sample converts", (() => { const r = J(JSON_SAMPLE); return r.ok && r.headers; })(), ["id", "name", "city", "active", "address.pin", "address.state", "tags", "notes"]);
{
  // Round trip: JSON → CSV → JSON with Papa Parse preserves strings exactly.
  const data = [{ a: "x, y", b: 'q"q', c: "l1\nl2", d: "  spaced  " }];
  const back = parseCsv((J(JSON.stringify(data)) as { csv: string }).csv, C);
  eq("j2c: round trip through CSV parser", back.ok && back.objects, data);
}

/* ================================================================== */
/* Number to Words                                                     */
/* ================================================================== */
const N: ConvertOptions = { mode: "number", system: "indian", currency: CURRENCIES[0], unitPosition: "before", minorStyle: "words", only: true, caseStyle: "title", style: { and: false, hyphens: false } };
const w = (n: string, o: Partial<ConvertOptions> = {}) => {
  const r = convert(n, { ...N, ...o });
  return r.ok === true ? r.words : r.ok === false ? `ERR ${r.message}` : "EMPTY";
};
const intl = { system: "international" as const };
eq("n2w: zero, one", [w("0"), w("1")], ["Zero", "One"]);
eq("n2w: teens + tens", [w("13"), w("20"), w("45"), w("99")], ["Thirteen", "Twenty", "Forty Five", "Ninety Nine"]);
eq("n2w: hundreds", [w("100"), w("105"), w("999")], ["One Hundred", "One Hundred Five", "Nine Hundred Ninety Nine"]);
eq("n2w: thousands", [w("1000"), w("12345")], ["One Thousand", "Twelve Thousand Three Hundred Forty Five"]);
eq("n2w: lakh (Indian)", [w("100000"), w("125000"), w("1000000")], ["One Lakh", "One Lakh Twenty Five Thousand", "Ten Lakh"]);
eq("n2w: crore (Indian)", [w("10000000"), w("12345678"), w("1000000000")], ["One Crore", "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight", "One Hundred Crore"]);
eq("n2w: lakh crore", [w("1000000000000"), w("999999999999999")], ["One Lakh Crore", "Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine Crore Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine"]);
eq("n2w: international million/billion/trillion", [w("1000000", intl), w("1000000000", intl), w("1000000000000", intl), w("125000", intl)], ["One Million", "One Billion", "One Trillion", "One Hundred Twenty Five Thousand"]);
eq("n2w: international max", w("999999999999999", intl), "Nine Hundred Ninety Nine Trillion Nine Hundred Ninety Nine Billion Nine Hundred Ninety Nine Million Nine Hundred Ninety Nine Thousand Nine Hundred Ninety Nine");
eq("n2w: gaps in groups", [w("1000001", intl), w("10000005"), w("100000000100", intl)], ["One Million One", "One Crore Five", "One Hundred Billion One Hundred"]);
eq("n2w: Indian vs international differ", [w("12500000"), w("12500000", intl)], ["One Crore Twenty Five Lakh", "Twelve Million Five Hundred Thousand"]);
eq("n2w: negative", [w("-42"), w("−7"), w("-0")], ["Minus Forty Two", "Minus Seven", "Zero"]);
eq("n2w: decimals read digit by digit", [w("12.5"), w("0.05"), w("3.14159")], ["Twelve Point Five", "Zero Point Zero Five", "Three Point One Four One Five Nine"]);
eq("n2w: trailing decimal zeros dropped with a note", (() => { const r = convert("12.500", N); return r.ok === true && [r.words, r.notes.length]; })(), ["Twelve Point Five", 1]);
eq("n2w: grouped input accepted", [w("1,25,000"), w("125,000"), w("1 25 000"), w("₹ 5,000"), w("Rs. 99"), w("$1,000")], ["One Lakh Twenty Five Thousand", "One Lakh Twenty Five Thousand", "One Lakh Twenty Five Thousand", "Five Thousand", "Ninety Nine", "One Thousand"]);
eq("n2w: British 'and' + hyphens", [w("105", { style: { and: true, hyphens: true } }), w("1005", { ...intl, style: { and: true, hyphens: true } }), w("125", { style: { and: true, hyphens: true } })], ["One Hundred and Five", "One Thousand and Five", "One Hundred and Twenty-Five"]);
eq("n2w: invalid inputs rejected", ["abc", "1.2.3", "1e6", "3,50", "1.234,56", "12,34,5", "-"].map((s) => w(s).startsWith("ERR")), [true, true, true, true, true, true, true]);
eq("n2w: too large rejected", w("1000000000000000").startsWith("ERR"), true);
eq("n2w: empty", w("   "), "EMPTY");
eq("n2w: case styles", [w("125", { caseStyle: "upper" }), w("125", { caseStyle: "sentence" })], ["ONE HUNDRED TWENTY FIVE", "One hundred twenty five"]);
eq("n2w: leading zeros", w("000123"), "One Hundred Twenty Three");

const cur = (code: string, o: Partial<ConvertOptions> = {}) => ({ ...N, mode: "currency" as const, currency: CURRENCIES.find((c) => c.code === code)!, ...o });
eq("n2w: INR cheque wording", [w("125000", cur("INR")), w("1", cur("INR")), w("0.01", cur("INR")), w("0.5", cur("INR"))], ["Rupees One Lakh Twenty Five Thousand Only", "Rupee One Only", "One Paisa Only", "Fifty Paise Only"]);
eq("n2w: INR with paise", w("1250.75", cur("INR")), "Rupees One Thousand Two Hundred Fifty and Seventy Five Paise Only");
eq("n2w: unit after", w("1250.75", cur("INR", { unitPosition: "after" })), "One Thousand Two Hundred Fifty Rupees and Seventy Five Paise Only");
eq("n2w: no Only", w("10", cur("INR", { only: false })), "Rupees Ten");
eq("n2w: USD international + cents", w("1234.56", cur("USD", { system: "international", unitPosition: "after" })), "One Thousand Two Hundred Thirty Four Dollars and Fifty Six Cents Only");
eq("n2w: USD cheque fraction", w("1234.5", cur("USD", { system: "international", unitPosition: "after", minorStyle: "fraction", only: false })), "One Thousand Two Hundred Thirty Four and 50/100 Dollars");
eq("n2w: GBP penny/pence", [w("1.01", cur("GBP", { unitPosition: "after" })), w("2.02", cur("GBP", { unitPosition: "after" }))], ["One Pound and One Penny Only", "Two Pounds and Two Pence Only"]);
eq("n2w: EUR, AED, AUD, CAD, SGD", ["EUR", "AED", "AUD", "CAD", "SGD"].map((c) => w("2.01", cur(c, { unitPosition: "after", only: false }))), ["Two Euros and One Cent", "Two Dirhams and One Fils", "Two Dollars and One Cent", "Two Dollars and One Cent", "Two Dollars and One Cent"]);
eq("n2w: zero amount", w("0", cur("INR")), "Rupees Zero Only");
eq("n2w: currency formatted (Indian grouping, 2 dp)", (() => { const r = convert("12500000.5", cur("INR")); return r.ok === true && r.formatted; })(), "₹1,25,00,000.50");
eq("n2w: currency formatted (international)", (() => { const r = convert("12500000.5", cur("USD", { system: "international" })); return r.ok === true && r.formatted; })(), "$12,500,000.50");
eq("n2w: rounding half-up with note", (() => { const r = convert("10.005", cur("INR")); return r.ok === true && [r.words, r.formatted, r.notes.some((n) => n.includes("rounded"))]; })(), ["Rupees Ten and One Paisa Only", "₹10.01", true]);
eq("n2w: rounding carries into rupees", (() => { const r = convert("99.999", cur("INR")); return r.ok === true && r.words; })(), "Rupees One Hundred Only");
eq("n2w: rounding down noted", (() => { const r = convert("1.234", cur("INR")); return r.ok === true && [r.formatted, r.notes.length]; })(), ["₹1.23", 1]);
eq("n2w: classic float trap 0.1+0.2 / 1.005 exact", [w("0.29", cur("INR")), w("1.005", cur("USD", { unitPosition: "after", system: "international" }))], ["Twenty Nine Paise Only", "One Dollar and One Cent Only"]);
eq("n2w: trailing zeros in currency are fine", w("100.50", cur("INR")), "Rupees One Hundred and Fifty Paise Only");
eq("n2w: negative currency noted", (() => { const r = convert("-5", cur("INR")); return r.ok === true && [r.words, r.notes.length]; })(), ["Minus Rupees Five Only", 1]);
eq("n2w: currency uppercase", w("125000", cur("INR", { caseStyle: "upper" })), "RUPEES ONE LAKH TWENTY FIVE THOUSAND ONLY");
eq("n2w: currency sentence case", w("125000", cur("INR", { caseStyle: "sentence" })), "Rupees one lakh twenty five thousand only");
eq("n2w: rounding pushes over limit rejected", w("999999999999999.999", cur("INR")).startsWith("ERR"), true);
eq("n2w: roundDecimal", [roundDecimal("1", "005", 2), roundDecimal("9", "995", 2), roundDecimal("1", "5", 0), roundDecimal("1", "4", 0)], [
  { int: "1", frac: "01", rounded: true },
  { int: "10", frac: "00", rounded: true },
  { int: "2", frac: "", rounded: true },
  { int: "1", frac: "", rounded: true },
]);
eq("n2w: groupDigits", [groupDigits("1234567", "indian"), groupDigits("1234567", "international"), groupDigits("999", "indian"), groupDigits("100000", "indian")], ["12,34,567", "1,234,567", "999", "1,00,000"]);
eq("n2w: parse keeps fraction digits", parseNumber("-1,25,000.50"), { ok: true, value: { negative: true, int: "125000", frac: "50" } });
eq("n2w: integerToWords direct", integerToWords("7", "indian"), "Seven");
{
  const b = convertBulk("100\n\nabc\n1,25,000.5\n", cur("INR"));
  eq("n2w: bulk rows, blank skipped, errors kept per line", b.rows.map((r) => [r.line, r.words || "ERR"]), [
    [1, "Rupees One Hundred Only"],
    [3, "ERR"],
    [4, "Rupees One Lakh Twenty Five Thousand and Fifty Paise Only"],
  ]);
}

/* ================================================================== */
/* Text diff                                                           */
/* ================================================================== */
// Optimality: the number of equal tokens must equal the LCS length (brute force DP).
const lcs = (a: number[], b: number[]) => {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
};
{
  let optimal = true;
  let reconstructs = true;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed / 0x7fffffff);
  for (let t = 0; t < 600; t++) {
    const a = Array.from({ length: Math.floor(rnd() * 40) }, () => Math.floor(rnd() * 5));
    const b = Array.from({ length: Math.floor(rnd() * 40) }, () => Math.floor(rnd() * 5));
    const { runs } = diffSequences(a, b);
    let i = 0, j = 0, same = 0;
    const ra: number[] = [], rb: number[] = [];
    for (const [op, n] of runs)
      for (let k = 0; k < n; k++) {
        if (op === 0) {
          if (a[i] !== b[j]) reconstructs = false;
          ra.push(a[i++]);
          rb.push(b[j++]);
          same++;
        } else if (op === -1) ra.push(a[i++]);
        else rb.push(b[j++]);
      }
    if (JSON.stringify(ra) !== JSON.stringify(a) || JSON.stringify(rb) !== JSON.stringify(b)) reconstructs = false;
    if (same !== lcs(a, b)) optimal = false;
  }
  eq("diff: 600 random cases reconstruct both inputs", reconstructs, true);
  eq("diff: 600 random cases are minimal (equal = LCS length)", optimal, true);
}
eq("diff: skip keys reported in place", diffKeys(["a", null, "b"], ["a", "b", null]).ops.map((o) => o.t), [0, "skipA", 0, "skipB"]);

const D = (a: string, b: string, o: Partial<DiffOptions> = {}) => compareTexts(a, b, { ...DIFF_DEFAULTS, ...o });
const kinds = (a: string, b: string, o: Partial<DiffOptions> = {}) => D(a, b, o).rows.map((r) => r.k);
eq("diff: identical", (() => { const r = D("a\nb", "a\nb"); return [r.identical, r.same, r.stats.added, r.stats.removed]; })(), [true, true, 0, 0]);
eq("diff: completely different", (() => { const r = D("a\nb", "c\nd", { granularity: "line" }); return [r.stats.removed, r.stats.added, r.stats.sections]; })(), [2, 2, 1]);
eq("diff: empty original", (() => { const r = D("", "x\ny"); return [r.stats.added, r.stats.removed, kinds("", "x\ny")]; })(), [2, 0, ["add", "add"]]);
eq("diff: empty modified", D("x\ny", "").stats.removed, 2);
eq("diff: both empty", (() => { const r = D("", ""); return [r.identical, r.rows.length]; })(), [true, 0]);
eq("diff: added line", kinds("a\nc", "a\nb\nc"), ["eq", "add", "eq"]);
eq("diff: removed line", kinds("a\nb\nc", "a\nc"), ["eq", "del", "eq"]);
{
  const r = D("the quick brown fox", "the slow brown fox");
  const row = r.rows[0];
  const changedA = row.sa!.filter((s) => s[2]).map((s) => r.linesA[0].slice(s[0], s[1]));
  const changedB = row.sb!.filter((s) => s[2]).map((s) => r.linesB[0].slice(s[0], s[1]));
  eq("diff: changed word highlighted", [row.k, changedA, changedB, r.stats.tokensAdded, r.stats.tokensRemoved], ["mod", ["quick"], ["slow"], 1, 1]);
}
{
  const r = D("colour", "color", { granularity: "char" });
  const row = r.rows[0];
  eq("diff: character change", [row.sa!.filter((s) => s[2]).map((s) => r.linesA[0].slice(s[0], s[1])), row.sb!.filter((s) => s[2]).length], [["u"], 0]);
}
eq("diff: ignore case", [D("Hello World", "hello world").same, D("Hello World", "hello world", { ignoreCase: true }).same], [false, true]);
eq("diff: ignore leading/trailing whitespace", [D("  a  \nb", "a\nb").same, D("  a  \nb", "a\nb", { trim: true }).same, D("a b", "a  b", { trim: true }).same], [false, true, false]);
eq("diff: ignore all whitespace", [D("a  b\tc", "a b c", { ignoreWhitespace: true }).same, D("ab", "a b", { ignoreWhitespace: true }).same], [true, true]);
eq("diff: ignore blank lines", (() => { const r = D("a\n\nb", "a\nb\n\n", { ignoreBlankLines: true }); return [r.same, r.rows.map((x) => x.k)]; })(), [true, ["eq", "skipA", "eq", "skipB"]]);
eq("diff: blank lines count without option", D("a\n\nb", "a\nb").stats.removed, 1);
eq("diff: inputs are never modified by ignore options", (() => { const r = D("  A  ", "a", { ignoreCase: true, trim: true }); return [r.linesA[0], r.linesB[0]]; })(), ["  A  ", "a"]);
eq("diff: line endings normalised", (() => { const r = D("a\r\nb\r\n", "a\nb\n"); return [r.same, r.identical, r.notes.length]; })(), [true, false, 1]);
eq("diff: line endings compared when not normalised", D("a\r\nb", "a\nb", { normalizeEol: false }).same, false);
eq("diff: trailing newline difference noted", D("a\nb\n", "a\nb").notes.some((n) => n.includes("ends with a line break")), true);
eq("diff: unicode + emoji graphemes intact", (() => {
  const r = D("I ❤️ café 👨‍👩‍👧", "I 💙 café 👨‍👩‍👦", { granularity: "char" });
  const row = r.rows[0];
  return [row.sa!.filter((s) => s[2]).map((s) => r.linesA[0].slice(s[0], s[1])), row.sb!.filter((s) => s[2]).map((s) => r.linesB[0].slice(s[0], s[1]))];
})(), [["❤️", "👨‍👩‍👧"], ["💙", "👨‍👩‍👦"]]);
eq("diff: combining characters kept whole", tokenize("éx", "char"), ["é", "x"]);
eq("diff: word tokens (CJK + Hindi)", tokenize("नमस्ते दुनिया", "word").filter((t) => t.trim()), ["नमस्ते", "दुनिया"]);
eq("diff: splitLines", [splitLines("", true), splitLines("a\n", true), splitLines("a\r\nb\rc\n", true), splitLines("a\r\nb", false)], [[], ["a"], ["a", "b", "c"], ["a\r", "b"]]);
{
  const r = D("a\nb\nc\nd\ne\nf\ng\nh\ni\nj", "a\nb\nc\nd\nE\nf\ng\nh\ni\nj", { granularity: "line" });
  const u = unifiedDiff(r, 3);
  eq("diff: unified diff format", u, "--- original.txt\n+++ modified.txt\n@@ -2,7 +2,7 @@\n b\n c\n d\n-e\n+E\n f\n g\n h\n");
  eq("diff: unified for pure add at start", unifiedDiff(D("b", "a\nb", { granularity: "line" }), 3), "--- original.txt\n+++ modified.txt\n@@ -1 +1,2 @@\n+a\n b\n");
  eq("diff: unified for empty original", unifiedDiff(D("", "x", { granularity: "line" }), 3), "--- original.txt\n+++ modified.txt\n@@ -0,0 +1 @@\n+x\n");
}
{
  // Large input: 20k lines with scattered edits finishes quickly and completely.
  const base = Array.from({ length: 20000 }, (_, i) => `Line ${i} of the document with some text`);
  const mod = base.slice();
  for (let i = 0; i < 20000; i += 997) mod[i] = `${mod[i]} (edited)`;
  mod.splice(5000, 0, "Inserted line");
  const t0 = Date.now();
  const r = D(base.join("\n"), mod.join("\n"));
  const ms = Date.now() - t0;
  eq("diff: 20k lines, scattered edits — complete and correct", [r.complete, r.stats.modified, r.stats.added - r.stats.modified], [true, 21, 1]);
  console.log(`      (20k-line diff took ${ms} ms)`);
  // Pathological: two unrelated large texts hit the deadline and fall back safely.
  const x = Array.from({ length: 30000 }, (_, i) => `a${i}`).join("\n");
  const y = Array.from({ length: 30000 }, (_, i) => `b${i}`).join("\n");
  const t1 = Date.now();
  const p = compareTexts(x, y, { ...DIFF_DEFAULTS, granularity: "line" }, 300);
  eq("diff: unrelated 30k-line texts stay fast", [p.stats.removed, p.stats.added, Date.now() - t1 < 3000], [30000, 30000, true]);
}

/* ================================================================== */
/* Markdown helpers                                                    */
/* ================================================================== */
eq("md: heading slugs", [headingSlug("Getting Started!"), headingSlug("  Café & Crème "), headingSlug("नमस्ते दुनिया"), headingSlug("!!!")], ["getting-started", "café-crème", "नमस्ते-दुनिया", "section"]);

/* ================================================================== */
/* Hashing                                                             */
/* ================================================================== */
const enc = new TextEncoder();
const js = (algo: HashAlgo, data: Uint8Array) => {
  const h = createHasher(algo);
  h.update(data);
  return toHex(h.digest());
};
const node = (algo: HashAlgo, data: Uint8Array) => createHash(algo.replace("-", "").toLowerCase()).update(data).digest("hex");
// FIPS 180-4 / NIST test vectors.
eq("hash: SHA-256 'abc'", js("SHA-256", enc.encode("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
eq("hash: SHA-256 empty", js("SHA-256", new Uint8Array()), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
eq("hash: SHA-256 448-bit", js("SHA-256", enc.encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
eq("hash: SHA-384 'abc'", js("SHA-384", enc.encode("abc")), "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7");
eq("hash: SHA-384 empty", js("SHA-384", new Uint8Array()), "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b");
eq("hash: SHA-512 'abc'", js("SHA-512", enc.encode("abc")), "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f");
eq("hash: SHA-512 empty", js("SHA-512", new Uint8Array()), "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e");
eq("hash: SHA-512 896-bit", js("SHA-512", enc.encode("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu")), "8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909");
eq("hash: SHA-1 'abc'", js("SHA-1", enc.encode("abc")), "a9993e364706816aba3e25717850c26c9cd0d89d");
eq("hash: SHA-256 million 'a'", js("SHA-256", enc.encode("a".repeat(1_000_000))), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
{
  // Every length 0–300 and random chunking must equal OpenSSL for all four algorithms.
  let allMatch = true;
  let chunkMatch = true;
  for (const algo of ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as HashAlgo[]) {
    for (let len = 0; len <= 300; len++) {
      const data = randomBytes(len);
      if (js(algo, data) !== node(algo, data)) allMatch = false;
    }
    for (let t = 0; t < 40; t++) {
      const data = randomBytes(Math.floor(Math.random() * 5000));
      const h = createHasher(algo);
      let off = 0;
      while (off < data.length) {
        const n = Math.floor(Math.random() * 300);
        h.update(data.subarray(off, off + n));
        off += n;
      }
      if (toHex(h.digest()) !== node(algo, data)) chunkMatch = false;
    }
  }
  eq("hash: all lengths 0–300 match OpenSSL (4 algorithms)", allMatch, true);
  eq("hash: random chunk splits match OpenSSL", chunkMatch, true);
}
{
  const big = randomBytes(9 * 1024 * 1024 + 123);
  const blob = new Blob([big]);
  const native = await hashBlob(blob, "SHA-256");
  const streamed = await hashBlob(blob, "SHA-512", undefined, undefined, 0);
  const streamed256 = await hashBlob(blob, "SHA-256", undefined, undefined, 0);
  eq("hash: Blob via Web Crypto matches", [native?.engine, native?.hex === node("SHA-256", big)], ["web-crypto", true]);
  eq("hash: Blob via streaming (chunked) matches", [streamed?.engine, streamed?.hex === node("SHA-512", big), streamed256?.hex === native?.hex], ["streaming", true, true]);
  let last = 0;
  await hashBlob(blob, "SHA-1", (d) => (last = d), undefined, 0);
  eq("hash: progress reaches file size", last, blob.size);
  eq("hash: cancel stops streaming", await hashBlob(blob, "SHA-256", undefined, () => true, 0), null);
}
eq("hash: unicode text (UTF-8)", (await hashText("नमस्ते 🌏", "SHA-256")).hex, node("SHA-256", enc.encode("नमस्ते 🌏")));
eq("hash: empty text", (await hashText("", "SHA-256")).hex, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
{
  // Unsupported Web Crypto falls back to the JS implementation.
  const saved = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { value: {}, configurable: true });
  const r = await hashText("abc", "SHA-384");
  if (saved) Object.defineProperty(globalThis, "crypto", saved);
  else Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  eq("hash: no Web Crypto → JS fallback", [r.engine, r.hex.slice(0, 16)], ["streaming", "cb00753f45a35e8b"]);
}
const e256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
eq("verify: match ignores case + whitespace", verify(e256, parseExpected(`  ${e256.toUpperCase()}  \n`, "SHA-256")), "match");
eq("verify: mismatch", verify(e256, parseExpected("0".repeat(64), "SHA-256")), "mismatch");
eq("verify: invalid characters", parseExpected("xyz!", "SHA-256").kind, "invalid");
eq("verify: wrong length names the other algorithm", (() => { const p = parseExpected("a".repeat(128), "SHA-256"); return p.kind === "invalid" && p.message.includes("SHA-512"); })(), true);
eq("verify: sha256: prefix", parseExpected(`sha256:${e256}`, "SHA-256").kind, "single");
eq("verify: labelled with another algorithm rejected", parseExpected(`sha512:${e256}`, "SHA-256").kind, "invalid");
{
  const list = parseExpected(`${e256}  setup.exe\n${"b".repeat(64)} *notes.txt\nSHA256 (other.iso) = ${"c".repeat(64)}`, "SHA-256");
  eq("verify: GNU + BSD checksum lists", list.kind === "list" && list.entries.map((e) => e.name), ["setup.exe", "notes.txt", "other.iso"]);
  eq("verify: list matched by file name", [verify(e256, list, "setup.exe"), verify(e256, list, "notes.txt"), verify(e256, list, "missing.bin")], ["match", "mismatch", "no-entry"]);
}
eq("verify: empty", parseExpected("   ", "SHA-256").kind, "empty");
eq("hash: hex lengths", HEX_LENGTH, { "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 });

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
