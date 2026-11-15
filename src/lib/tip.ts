/**
 * Tip and bill split. All money is held in integer minor units (cents/paise)
 * so totals and shares always reconcile exactly.
 *
 *   tax  = bill × t%            (tax added on top), or
 *        = bill × t/(100 + t)   (tax already included in the bill), or a fixed amount
 *   tip  = base × p%            base = amount before tax (default) or after tax
 *   total = pre-tax amount + tax + tip
 *
 * Every percentage is applied with integer arithmetic on hundredths of a
 * percent and rounded half up to the minor unit.
 */
import { parseNum } from "./discount";

export const TIP_PRESETS = [5, 10, 12, 15, 18, 20, 25] as const;

export type TaxMode = "none" | "percent" | "amount";
export type Rounding = "exact" | "up" | "nearest";

export interface TipForm {
  bill: string;
  tipPct: string;
  people: string;
  taxMode: TaxMode;
  tax: string;
  /** The bill amount already includes the tax. */
  taxIncluded: boolean;
  /** Calculate the tip on the amount before tax (true) or after tax. */
  tipBeforeTax: boolean;
  rounding: Rounding;
}

export interface Share {
  amount: number; // minor units
  count: number;
}

export interface TipResult {
  bill: number;
  subtotal: number; // before tax
  tax: number;
  tipBase: number;
  tipPct: number;
  tip: number;
  total: number;
  people: number;
  /** Exact per-person amount (may be fractional minor units). */
  perPersonExact: number;
  /** Who pays what, grouped. Always sums to `collected`. */
  shares: Share[];
  collected: number;
  /** collected − total: extra paid (positive) or short (never negative — the last share absorbs it). */
  surplus: number;
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field: string } | { status: "ok"; result: T; notes: string[] };

export const LIMITS = { maxBill: 1_000_000_000, maxPct: 100, maxPeople: 200 };

const toMinor = (v: number) => Math.round(v * 100);
/** Hundredths of a percent as an integer: 12.5 → 1250. */
const pctInt = (p: number) => Math.round(p * 100);
/** amount × pct% rounded half up, all in integers. */
export const pctOf = (minor: number, pct: number) => Math.floor((minor * pctInt(pct) + 5000) / 10000);

export function tip(form: TipForm): Outcome<TipResult> {
  const billN = parseNum(form.bill);
  const pN = form.tipPct.trim() ? parseNum(form.tipPct) : 0;
  const nN = parseNum(form.people);
  if (billN === null || nN === null) return { status: "empty" };
  if (Number.isNaN(billN) || billN < 0) return { status: "error", field: "bill", message: "Enter a bill amount of 0 or more." };
  if (billN > LIMITS.maxBill) return { status: "error", field: "bill", message: "That bill is larger than this calculator supports." };
  if (pN === null || Number.isNaN(pN) || pN < 0 || pN > LIMITS.maxPct) return { status: "error", field: "tipPct", message: `Tip must be between 0% and ${LIMITS.maxPct}%.` };
  if (Number.isNaN(nN) || !Number.isInteger(nN) || nN < 1 || nN > LIMITS.maxPeople) return { status: "error", field: "people", message: `Number of people must be a whole number from 1 to ${LIMITS.maxPeople}.` };

  const bill = toMinor(billN);
  let subtotal = bill;
  let tax = 0;
  if (form.taxMode !== "none") {
    const tN = parseNum(form.tax);
    if (tN === null || Number.isNaN(tN) || tN < 0) return { status: "error", field: "tax", message: form.taxMode === "percent" ? "Enter the tax rate in %, or choose No tax." : "Enter the tax amount, or choose No tax." };
    if (form.taxMode === "percent") {
      if (tN > 100) return { status: "error", field: "tax", message: "Tax rate can't be more than 100%." };
      tax = form.taxIncluded ? Math.floor((bill * pctInt(tN) + (10000 + pctInt(tN)) / 2) / (10000 + pctInt(tN))) : pctOf(bill, tN);
    } else {
      tax = toMinor(tN);
      if (form.taxIncluded && tax > bill) return { status: "error", field: "tax", message: "The tax included can't be more than the bill." };
    }
    subtotal = form.taxIncluded ? bill - tax : bill;
  }
  const afterTax = subtotal + tax;
  const tipBase = form.tipBeforeTax ? subtotal : afterTax;
  const tipAmt = pctOf(tipBase, pN);
  const total = afterTax + tipAmt;
  const n = nN;

  let shares: Share[];
  if (form.rounding === "exact") {
    // Split to the cent; the first `rem` people pay one cent more.
    const base = Math.floor(total / n);
    const rem = total - base * n;
    shares = rem ? [{ amount: base + 1, count: rem }, { amount: base, count: n - rem }] : [{ amount: base, count: n }];
  } else if (form.rounding === "up") {
    const each = Math.ceil(total / n / 100) * 100;
    shares = [{ amount: each, count: n }];
  } else {
    // Nearest whole unit for everyone but one person, who pays the exact remainder.
    const each = Math.round(total / n / 100) * 100;
    const last = total - each * (n - 1);
    if (n === 1) shares = [{ amount: total, count: 1 }];
    else if (last < 0) {
      // Rounded shares would already exceed the bill: fall back to an exact split.
      const base = Math.floor(total / n);
      const rem = total - base * n;
      shares = [{ amount: base + 1, count: rem }, { amount: base, count: n - rem }];
    } else shares = last === each ? [{ amount: each, count: n }] : [{ amount: each, count: n - 1 }, { amount: last, count: 1 }];
  }
  shares = shares.filter((s) => s.count > 0);
  const collected = shares.reduce((a, s) => a + s.amount * s.count, 0);

  const notes: string[] = [];
  if (pN > 30) notes.push(`${pN}% is a very generous tip — check it's what you meant.`);
  if (form.rounding === "up" && collected > total) notes.push("Rounding everyone up collects a little more than the bill; the extra is shown below and could go to the tip.");
  if (form.rounding === "nearest" && n > 1 && shares.length > 1) notes.push("Everyone pays a round amount except one person, who pays the exact remainder so the total matches the bill.");

  return {
    status: "ok",
    notes,
    result: { bill, subtotal, tax, tipBase, tipPct: pN, tip: tipAmt, total, people: n, perPersonExact: total / n, shares, collected, surplus: collected - total },
  };
}

export const fromMinor = (m: number) => m / 100;
