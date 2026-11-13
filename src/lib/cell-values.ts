/**
 * Conservative cell typing for PDF → Excel. Converts a value to a number only
 * when that's unambiguous, and keeps its look via an Excel number format.
 * Never converted (kept as text): leading zeros (00123), more than 15 digits
 * (account/card numbers — Excel would round them), dates, times, phone
 * numbers, Dr/Cr amounts, and anything with letters.
 */

export type Cell = { t: "s"; v: string } | { t: "n"; v: number; fmt: string; raw: string };

const CUR = "₹|\\$|£|€|¥|Rs\\.?|INR|USD|EUR|GBP|AED|SGD|AUD";
const NUM = "\\d+(?:,\\d+)*(?:\\.\\d+)?|\\.\\d+";
const RE = new RegExp(`^(\\()?\\s*(-|−)?\\s*(${CUR})?\\s*(-|−)?\\s*(${NUM})\\s*(%)?\\s*(${CUR})?\\s*(\\))?\\s*(-)?$`, "i");

const westernGroups = (s: string) => /^\d{1,3}(,\d{3})+$/.test(s);
const indianGroups = (s: string) => /^\d{1,2}(,\d{2})*,\d{3}$/.test(s);

const curFmt = (c: string) => {
  const sym = c.replace(/\.$/, "");
  return /^[A-Z]{3}$/i.test(sym) || /^Rs$/i.test(sym) ? `"${sym} "` : `"${sym}"`;
};

export function parseCell(raw: string, convert = true): Cell {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!convert || !text) return { t: "s", v: text };
  const m = RE.exec(text);
  if (!m) return { t: "s", v: text };
  const [, openP, neg1, cur1, neg2, num, pct, cur2, closeP, trailNeg] = m;
  if (!!openP !== !!closeP) return { t: "s", v: text };
  if (cur1 && cur2) return { t: "s", v: text };
  const [intPart, dec = ""] = num.split(".");
  const digits = intPart.replace(/,/g, "");
  if (digits.length > 1 && digits.startsWith("0")) return { t: "s", v: text }; // 00123 — an identifier
  if ((digits + dec).replace(/^0+/, "").length > 15) return { t: "s", v: text }; // beyond Excel's precision
  const grouped = intPart.includes(",");
  const indian = grouped && indianGroups(intPart) && !westernGroups(intPart);
  if (grouped && !westernGroups(intPart) && !indian) return { t: "s", v: text };
  const negative = !!(openP || neg1 || neg2 || trailNeg);
  // Excel can't show negative numbers with Indian grouping reliably, so keep those as text.
  if (indian && negative) return { t: "s", v: text };
  let value = Number(`${digits || "0"}.${dec || "0"}`);
  if (negative) value = -value;
  const places = dec.length;
  const d = places ? `.${"0".repeat(places)}` : "";
  const cur = cur1 || cur2;
  const pre = cur1 ? curFmt(cur1) : "";
  const post = cur2 ? curFmt(cur2).replace(/^"/, '" ').replace(/ "$/, '"') : "";
  let fmt: string;
  if (pct) {
    value /= 100;
    fmt = `${pre}0${d}%${post}`;
  } else if (indian) {
    // Indian grouping (1,00,000 and 1,00,00,000) — currency goes in every section.
    fmt = `[>=10000000]${pre}##\\,##\\,##\\,##0${d}${post};[>=100000]${pre}##\\,##\\,##0${d}${post};${pre}##,##0${d}${post}`;
  } else {
    const body = `${grouped ? "#,##0" : "0"}${d}`;
    fmt = `${pre}${body}${post}`;
    if (openP && closeP) fmt = `${fmt};(${fmt})`;
  }
  void cur;
  return { t: "n", v: value, fmt, raw: text };
}

/** Rough check used to spot header rows: true if the text looks like a number. */
export const looksNumeric = (s: string) => parseCell(s).t === "n";
