/**
 * Number → words in the Indian (thousand, lakh, crore) and international
 * (thousand, million, billion, trillion) systems, plus cheque-style currency
 * wording. Every step works on the digit string — no floating point — so
 * 0.29, 1,00,00,000.10 and 999 trillion are exact.
 */

export type NumberingSystem = "indian" | "international";
export type CaseStyle = "title" | "upper" | "sentence";

/** Largest supported whole part: 999,999,999,999,999 (15 digits). */
export const MAX_DIGITS = 15;
export const MAX_DECIMALS = 20;

export interface ParsedNumber {
  negative: boolean;
  /** Whole part without leading zeros ("0" for zero). */
  int: string;
  /** Fraction digits exactly as typed (may end in zeros). */
  frac: string;
}

export type ParseOutcome = { ok: true; value: ParsedNumber } | { ok: false; message: string } | { ok: null };

const INDIAN_GROUPS = /^\d{1,2}(,\d{2})*,\d{3}$/;
const INTL_GROUPS = /^\d{1,3}(,\d{3})+$/;

/**
 * Accepts "1,25,000", "125,000", "1 250 000", "-42.50", "₹ 5,000", "Rs. 99", "$1,000.25".
 * Commas must sit between digit groups (Indian or international), so a
 * European decimal comma like "3,50" is rejected instead of misread as 350.
 */
export function parseNumber(raw: string): ParseOutcome {
  let s = raw.trim();
  if (!s) return { ok: null };
  s = s.replace(/[   _' ]/g, "");
  let negative = false;
  if (/^[-−]/.test(s)) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) s = s.slice(1);
  s = s.replace(/^(₹|rs\.?|inr|\$|us\$|£|€|aed|a\$|c\$|s\$)/i, "");
  if (!negative && /^[-−]/.test(s)) {
    negative = true;
    s = s.slice(1);
  }
  if (!s) return { ok: false, message: "Enter a number, for example 125000 or 1,25,000.50." };
  if (/^\d*\.?\d*e[+-]?\d+$/i.test(s)) return { ok: false, message: "Scientific notation (like 1e6) isn't supported — write the number out in full." };
  if (/[^\d.,]/.test(s)) return { ok: false, message: "Only digits, commas and one decimal point can be used." };
  if ((s.match(/\./g) ?? []).length > 1) return { ok: false, message: "Use a single decimal point." };
  const [intRaw, frac = ""] = s.split(".");
  if (frac.includes(",")) return { ok: false, message: "Commas can't appear after the decimal point. Use . for decimals and commas only to group digits." };
  if (!/\d/.test(intRaw + frac)) return { ok: false, message: "Enter a number, for example 125000 or 1,25,000.50." };
  if (intRaw.includes(",") && !INDIAN_GROUPS.test(intRaw) && !INTL_GROUPS.test(intRaw)) {
    return { ok: false, message: "Check the commas — they must separate digit groups, like 1,25,000 (Indian) or 125,000 (international). Use . for decimals." };
  }
  const int = intRaw.replace(/,/g, "").replace(/^0+(?=\d)/, "") || "0";
  if (int.length > MAX_DIGITS) return { ok: false, message: `That number is too large. The whole part can have up to ${MAX_DIGITS} digits (999,999,999,999,999 — 999 trillion, or 99,999 lakh crore).` };
  if (frac.length > MAX_DECIMALS) return { ok: false, message: `Up to ${MAX_DECIMALS} digits after the decimal point are supported.` };
  return { ok: true, value: { negative: negative && /[1-9]/.test(int + frac), int, frac } };
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const DIGITS = ["Zero", ...ONES.slice(1, 10)];
const INTL_SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

export interface WordStyle {
  /** British style: "One Hundred and Five". */
  and: boolean;
  /** "Twenty-Five" instead of "Twenty Five". */
  hyphens: boolean;
}

function below100(n: number, st: WordStyle) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t}${st.hyphens ? "-" : " "}${o}` : t;
}

function below1000(n: number, st: WordStyle) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push((h && st.and ? "and " : "") + below100(r, st));
  return parts.join(" ");
}

/** Joins scale parts; with British "and", a final part under 100 after a higher part gets "and". */
function join(parts: { words: string; value: number }[], st: WordStyle) {
  const out = parts.filter((p) => p.words);
  return out
    .map((p, i) => (st.and && i === out.length - 1 && i > 0 && p.value < 100 ? `and ${p.words}` : p.words))
    .join(" ");
}

function indianParts(int: string, st: WordStyle): { words: string; value: number }[] {
  const parts: { words: string; value: number }[] = [];
  if (int.length > 7) {
    const crore = int.slice(0, -7).replace(/^0+/, "");
    if (crore) parts.push({ words: `${join(indianParts(crore, st), st)} Crore`, value: 1000 });
    int = int.slice(-7);
  }
  const r = Number(int);
  const lakh = Math.floor(r / 100000);
  const thousand = Math.floor((r % 100000) / 1000);
  const rest = r % 1000;
  if (lakh) parts.push({ words: `${below100(lakh, st)} Lakh`, value: 1000 });
  if (thousand) parts.push({ words: `${below100(thousand, st)} Thousand`, value: 1000 });
  if (rest) parts.push({ words: below1000(rest, st), value: rest });
  return parts;
}

function internationalParts(int: string, st: WordStyle) {
  const groups: number[] = [];
  for (let end = int.length; end > 0; end -= 3) groups.unshift(Number(int.slice(Math.max(0, end - 3), end)));
  return groups.map((g, i) => {
    const scale = INTL_SCALES[groups.length - 1 - i];
    return { words: g ? `${below1000(g, st)}${scale ? ` ${scale}` : ""}` : "", value: scale ? 1000 : g };
  });
}

/** Whole number (digit string, ≤ 15 digits) in words, Title Case. */
export function integerToWords(int: string, system: NumberingSystem, st: WordStyle = { and: false, hyphens: false }) {
  const clean = int.replace(/^0+(?=\d)/, "");
  if (/^0*$/.test(clean)) return "Zero";
  return join(system === "indian" ? indianParts(clean, st) : internationalParts(clean, st), st);
}

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

/** "12500000" → "1,25,00,000" (Indian) or "12,500,000" (international). */
export function groupDigits(int: string, system: NumberingSystem) {
  if (int.length <= 3) return int;
  if (system === "international") return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/* ------------------------------------------------------------------ */
/* Currency                                                            */
/* ------------------------------------------------------------------ */

export interface Currency {
  code: string;
  symbol: string;
  major: [singular: string, plural: string];
  minor: [singular: string, plural: string];
  /** Digits after the decimal point (0 for currencies without a minor unit). */
  digits: number;
  system: NumberingSystem;
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "₹", major: ["Rupee", "Rupees"], minor: ["Paisa", "Paise"], digits: 2, system: "indian" },
  { code: "USD", symbol: "$", major: ["Dollar", "Dollars"], minor: ["Cent", "Cents"], digits: 2, system: "international" },
  { code: "GBP", symbol: "£", major: ["Pound", "Pounds"], minor: ["Penny", "Pence"], digits: 2, system: "international" },
  { code: "EUR", symbol: "€", major: ["Euro", "Euros"], minor: ["Cent", "Cents"], digits: 2, system: "international" },
  { code: "AED", symbol: "AED ", major: ["Dirham", "Dirhams"], minor: ["Fils", "Fils"], digits: 2, system: "international" },
  { code: "AUD", symbol: "A$", major: ["Dollar", "Dollars"], minor: ["Cent", "Cents"], digits: 2, system: "international" },
  { code: "CAD", symbol: "C$", major: ["Dollar", "Dollars"], minor: ["Cent", "Cents"], digits: 2, system: "international" },
  { code: "SGD", symbol: "S$", major: ["Dollar", "Dollars"], minor: ["Cent", "Cents"], digits: 2, system: "international" },
];

export const currencyByCode = (code: string) => CURRENCIES.find((c) => c.code === code);

/** Adds one to a non-negative digit string ("0999" → "1000"). */
function incrementDigits(s: string) {
  const d = s.split("");
  let i = d.length - 1;
  while (i >= 0) {
    if (d[i] === "9") {
      d[i] = "0";
      i--;
    } else {
      d[i] = String(Number(d[i]) + 1);
      return d.join("");
    }
  }
  return `1${d.join("")}`;
}

/** Rounds to `digits` decimals, half away from zero, on the digit string. */
export function roundDecimal(int: string, frac: string, digits: number): { int: string; frac: string; rounded: boolean } {
  const padded = frac.padEnd(digits, "0");
  if (frac.length <= digits) return { int, frac: padded, rounded: false };
  const keep = padded.slice(0, digits);
  const dropped = frac.slice(digits);
  if (!/[1-9]/.test(dropped)) return { int, frac: keep, rounded: false };
  if (dropped[0] < "5") return { int, frac: keep, rounded: true };
  const bumped = incrementDigits(int + keep);
  const newInt = digits ? bumped.slice(0, -digits) : bumped;
  return { int: newInt.replace(/^0+(?=\d)/, "") || "0", frac: digits ? bumped.slice(-digits) : "", rounded: true };
}

/* ------------------------------------------------------------------ */
/* Conversion                                                          */
/* ------------------------------------------------------------------ */

export interface ConvertOptions {
  mode: "number" | "currency";
  system: NumberingSystem;
  currency: Currency;
  /** "Rupees One Hundred" (before) or "One Hundred Rupees" (after). */
  unitPosition: "before" | "after";
  /** Minor units in words ("and Fifty Paise") or as a cheque fraction ("and 50/100"). */
  minorStyle: "words" | "fraction";
  only: boolean;
  caseStyle: CaseStyle;
  style: WordStyle;
}

export interface ConvertResult {
  ok: true;
  words: string;
  /** Grouped numeric form, e.g. "₹1,25,000.50" or "-12,500.5". */
  formatted: string;
  notes: string[];
}

export type ConvertOutcome = ConvertResult | { ok: false; message: string } | { ok: null };

export function applyCase(text: string, c: CaseStyle) {
  if (c === "upper") return text.toUpperCase();
  if (c === "sentence") {
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return text;
}

export function convert(raw: string, o: ConvertOptions): ConvertOutcome {
  const p = parseNumber(raw);
  if (p.ok !== true) return p;
  const { negative } = p.value;
  let { int, frac } = p.value;
  const notes: string[] = [];
  const sign = negative ? "Minus " : "";

  if (o.mode === "number") {
    const trimmed = frac.replace(/0+$/, "");
    if (trimmed.length !== frac.length && frac.length) notes.push(`Trailing zeros after the decimal point (${p.value.int}.${frac}) don't change the value, so they aren't read out.`);
    frac = trimmed;
    let words = integerToWords(int, o.system, o.style);
    if (frac) words += ` Point ${frac.split("").map((d) => DIGITS[Number(d)]).join(" ")}`;
    const formatted = `${negative ? "-" : ""}${groupDigits(int, o.system)}${frac ? `.${frac}` : ""}`;
    return { ok: true, words: applyCase(sign + words, o.caseStyle), formatted, notes };
  }

  const c = o.currency;
  const r = roundDecimal(int, frac, c.digits);
  if (r.rounded) {
    notes.push(
      c.digits
        ? `${c.code} amounts have ${c.digits} decimal places, so ${p.value.int}.${frac} was rounded (half up) to ${r.int}.${r.frac}.`
        : `${c.code} amounts have no decimal places, so ${p.value.int}.${frac} was rounded (half up) to ${r.int}.`,
    );
  }
  int = r.int;
  frac = r.frac;
  if (int.length > MAX_DIGITS) return { ok: false, message: `After rounding, the amount exceeds the ${MAX_DIGITS}-digit limit.` };
  if (negative) notes.push("Negative amounts are written with “Minus”. Cheques and payment instructions normally use positive amounts.");

  const minor = c.digits ? Number(frac) : 0;
  const isZero = int === "0" && minor === 0;
  const majorWords = integerToWords(int, o.system, o.style);
  const majorUnit = int === "1" ? c.major[0] : c.major[1];
  let words: string;
  if (o.minorStyle === "fraction" && c.digits) {
    const amount = `${majorWords} and ${frac}/1${"0".repeat(c.digits)}`;
    words = o.unitPosition === "before" ? `${c.major[1]} ${amount}` : `${amount} ${majorUnit}`;
  } else {
    const majorPhrase = o.unitPosition === "before" ? `${majorUnit} ${majorWords}` : `${majorWords} ${majorUnit}`;
    const minorPhrase = minor ? `${integerToWords(String(minor), o.system, o.style)} ${minor === 1 ? c.minor[0] : c.minor[1]}` : "";
    if (int !== "0" && minor) words = `${majorPhrase} and ${minorPhrase}`;
    else if (minor) words = minorPhrase;
    else words = isZero ? (o.unitPosition === "before" ? `${c.major[1]} Zero` : `Zero ${c.major[1]}`) : majorPhrase;
  }
  if (o.only) words += " Only";
  const formatted = `${negative ? "-" : ""}${c.symbol}${groupDigits(int, o.system)}${c.digits ? `.${frac}` : ""}`;
  return { ok: true, words: applyCase(sign + words, o.caseStyle), formatted, notes };
}

export const MAX_BULK_LINES = 1000;

export interface BulkRow {
  line: number;
  input: string;
  formatted: string;
  words: string;
  error: string;
}

/** One amount per line; blank lines are skipped. */
export function convertBulk(text: string, o: ConvertOptions): { rows: BulkRow[]; truncated: boolean } {
  const lines = text.split(/\r\n|\r|\n/);
  const rows: BulkRow[] = [];
  let truncated = false;
  lines.forEach((l, i) => {
    if (!l.trim()) return;
    if (rows.length >= MAX_BULK_LINES) {
      truncated = true;
      return;
    }
    const r = convert(l, o);
    rows.push({ line: i + 1, input: l.trim(), formatted: r.ok === true ? r.formatted : "", words: r.ok === true ? r.words : "", error: r.ok === false ? r.message : "" });
  });
  return { rows, truncated };
}
