/**
 * Discount maths. Pure functions, no tax. Money is kept as plain numbers and
 * rounded to 2 decimals only for display/summary.
 */

export type DiscountMode = "standard" | "reverse" | "successive" | "original" | "markup";
export const PRESETS = [5, 10, 15, 20, 25, 30, 40, 50, 60] as const;

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string } | { status: "ok"; result: T };

/** Parses "1,23,456.50" style input. Returns null for empty, NaN for invalid. */
export function parseNum(raw: string): number | null {
  const s = raw.replace(/[,\s₹$£€]/g, "").trim();
  if (!s) return null;
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function need(label: string, raw: string, { allowZero = true, max }: { allowZero?: boolean; max?: number } = {}): number | string | null {
  const v = parseNum(raw);
  if (v === null) return null;
  if (Number.isNaN(v)) return `${label} must be a number.`;
  if (v < 0) return `${label} can't be negative.`;
  if (!allowZero && v === 0) return `${label} must be more than 0.`;
  if (max !== undefined && v > max) return `${label} can't be more than ${max}.`;
  return v;
}

export interface StandardResult {
  original: number;
  percent: number;
  saving: number;
  final: number;
}

export function standard(priceRaw: string, pctRaw: string): Outcome<StandardResult> {
  const price = need("Original price", priceRaw);
  const pct = need("Discount", pctRaw);
  for (const v of [price, pct]) if (typeof v === "string") return { status: "error", message: v };
  if (price === null || pct === null) return { status: "empty" };
  const p = price as number;
  const d = pct as number;
  if (d > 100) return { status: "error", message: "A discount above 100% would mean the seller pays you. Enter 100% or less." };
  const saving = (p * d) / 100;
  return { status: "ok", result: { original: p, percent: d, saving, final: p - saving } };
}

export interface ReverseResult {
  original: number;
  final: number;
  difference: number; // positive = saving
  percent: number; // positive = discount, negative = increase
  increase: boolean;
}

/** Given original and final price, find the discount percentage. */
export function reverse(originalRaw: string, finalRaw: string): Outcome<ReverseResult> {
  const o = need("Original price", originalRaw, { allowZero: false });
  const f = need("Final price", finalRaw);
  for (const v of [o, f]) if (typeof v === "string") return { status: "error", message: v };
  if (o === null || f === null) return { status: "empty" };
  const orig = o as number;
  const fin = f as number;
  const difference = orig - fin;
  return { status: "ok", result: { original: orig, final: fin, difference, percent: (difference / orig) * 100, increase: fin > orig } };
}

export interface SuccessiveResult {
  original: number;
  steps: { percent: number; before: number; saving: number; after: number }[];
  final: number;
  totalSaving: number;
  effective: number;
  naiveSum: number;
}

/** Discounts applied one after another: effective = 1 − Π(1 − dᵢ). */
export function successive(priceRaw: string, pctRaws: string[]): Outcome<SuccessiveResult> {
  const price = need("Original price", priceRaw);
  if (typeof price === "string") return { status: "error", message: price };
  const pcts: number[] = [];
  for (let i = 0; i < pctRaws.length; i++) {
    const v = need(`Discount ${i + 1}`, pctRaws[i], { max: 100 });
    if (typeof v === "string") return { status: "error", message: v };
    if (v !== null) pcts.push(v);
  }
  if (price === null || pcts.length === 0) return { status: "empty" };
  let cur = price;
  const steps = pcts.map((p) => {
    const saving = (cur * p) / 100;
    const step = { percent: p, before: cur, saving, after: cur - saving };
    cur -= saving;
    return step;
  });
  const factor = pcts.reduce((acc, p) => acc * (1 - p / 100), 1);
  return {
    status: "ok",
    result: { original: price, steps, final: cur, totalSaving: price - cur, effective: (1 - factor) * 100, naiveSum: pcts.reduce((a, b) => a + b, 0) },
  };
}

export interface OriginalResult {
  final: number;
  percent: number;
  original: number;
  saving: number;
}

/** Given the sale price and the discount %, find the price before discount. */
export function originalPrice(finalRaw: string, pctRaw: string): Outcome<OriginalResult> {
  const f = need("Sale price", finalRaw);
  const p = need("Discount", pctRaw);
  for (const v of [f, p]) if (typeof v === "string") return { status: "error", message: v };
  if (f === null || p === null) return { status: "empty" };
  const fin = f as number;
  const pct = p as number;
  if (pct >= 100) return { status: "error", message: "With a 100% discount every original price ends at 0, so it can't be worked out. Use less than 100%." };
  const original = fin / (1 - pct / 100);
  return { status: "ok", result: { final: fin, percent: pct, original, saving: original - fin } };
}

export interface MarkupResult {
  cost: number;
  markupPct: number;
  marked: number;
  discountPct: number;
  discount: number;
  selling: number;
  profit: number; // negative = loss
  profitOnCostPct: number; // a.k.a. effective markup
  marginPct: number; // profit ÷ selling price
}

/** Cost → marked price (markup on cost) → selling price (discount on marked price). */
export function markupDiscount(costRaw: string, markupRaw: string, discountRaw: string): Outcome<MarkupResult> {
  const c = need("Cost price", costRaw, { allowZero: false });
  const m = need("Markup", markupRaw);
  const d = need("Discount", discountRaw, { max: 100 });
  for (const v of [c, m, d]) if (typeof v === "string") return { status: "error", message: v };
  if (c === null || m === null) return { status: "empty" };
  const cost = c as number;
  const markupPct = m as number;
  const discountPct = (d as number | null) ?? 0;
  const marked = cost * (1 + markupPct / 100);
  const discount = (marked * discountPct) / 100;
  const selling = marked - discount;
  const profit = selling - cost;
  return {
    status: "ok",
    result: { cost, markupPct, marked, discountPct, discount, selling, profit, profitOnCostPct: (profit / cost) * 100, marginPct: selling > 0 ? (profit / selling) * 100 : 0 },
  };
}

/** Formats a percentage for display: up to 2 decimals, no trailing zeros. */
export function pct(n: number) {
  const r = round2(n);
  return `${Object.is(r, -0) ? 0 : r}%`;
}

export { round2 };
