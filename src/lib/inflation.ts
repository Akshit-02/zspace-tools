/**
 * Inflation and purchasing power.
 *
 *   Future cost     = amount × (1 + i)^t
 *   Present value   = future amount ÷ (1 + i)^t
 *   Purchasing power left = 1 ÷ (1 + i)^t   (share of today's buying power)
 *
 * The rate is the user's assumption — an average over the period, not
 * official data. Negative rates (deflation) down to −10% are allowed.
 */
import { parseNum } from "./discount";

export type InflationMode = "future" | "present" | "years";

export interface InflationForm {
  mode: InflationMode;
  amount: string;
  rate: string;
  years: string;
  fromYear: string;
  toYear: string;
}

export interface InflationRow {
  year: number;
  label: string;
  /** What `amount` (today's money) costs in that year. */
  cost: number;
  /** What `amount` is worth in the starting year's money. */
  value: number;
}

export interface InflationResult {
  mode: InflationMode;
  amount: number;
  rate: number;
  years: number;
  /** future/years modes: equivalent future cost. present mode: the future amount entered. */
  futureCost: number;
  /** present mode: today's value of the future amount; other modes: today's value of `amount` after t years. */
  presentValue: number;
  increase: number;
  increasePct: number;
  /** Share of purchasing power remaining (0–1+). */
  powerLeft: number;
  rows: InflationRow[];
  fromYear: number | null;
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T };

export const LIMITS = { minRate: -10, maxRate: 100, maxYears: 100 };
export const growthFactor = (ratePct: number, t: number) => Math.pow(1 + ratePct / 100, t);

export function inflation(mode: InflationMode, amount: number, rate: number, years: number, fromYear: number | null = null): InflationResult {
  const g = growthFactor(rate, years);
  const futureCost = mode === "present" ? amount : amount * g;
  const presentValue = mode === "present" ? amount / g : amount / g;
  const rows: InflationRow[] = [];
  for (let k = 0; k <= Math.ceil(years - 1e-9) && years <= LIMITS.maxYears; k++) {
    const t = Math.min(k, years);
    rows.push({ year: k, label: fromYear !== null ? String(fromYear + k) : k === 0 ? "Now" : `Year ${+t.toFixed(2)}`, cost: (mode === "present" ? amount / g : amount) * growthFactor(rate, t), value: amount / growthFactor(rate, t) });
  }
  const base = mode === "present" ? amount / g : amount;
  return { mode, amount, rate, years, futureCost, presentValue, increase: futureCost - base, increasePct: (g - 1) * 100, powerLeft: 1 / g, rows, fromYear };
}

export function inflationFromForm(f: InflationForm): Outcome<InflationResult> {
  const A = parseNum(f.amount);
  const R = parseNum(f.rate);
  if (A === null || R === null) return { status: "empty" };
  if (Number.isNaN(A) || A <= 0) return { status: "error", field: "amount", message: "Enter an amount greater than 0." };
  if (Number.isNaN(R) || R < LIMITS.minRate || R > LIMITS.maxRate) return { status: "error", field: "rate", message: `Enter an inflation rate between ${LIMITS.minRate}% and ${LIMITS.maxRate}% a year.` };
  let t: number;
  let from: number | null = null;
  if (f.mode === "years") {
    const a = parseNum(f.fromYear);
    const b = parseNum(f.toYear);
    if (a === null || b === null) return { status: "empty" };
    if (Number.isNaN(a) || Number.isNaN(b) || !Number.isInteger(a) || !Number.isInteger(b) || a < 1800 || b > 2200) return { status: "error", field: "fromYear", message: "Enter whole years between 1800 and 2200." };
    if (b <= a) return { status: "error", field: "toYear", message: "The ending year must be after the starting year." };
    t = b - a;
    from = a;
  } else {
    const y = parseNum(f.years);
    if (y === null) return { status: "empty" };
    if (Number.isNaN(y) || y <= 0) return { status: "error", field: "years", message: "Enter a number of years greater than 0." };
    t = y;
  }
  if (t > LIMITS.maxYears) return { status: "error", field: "years", message: `Up to ${LIMITS.maxYears} years are supported.` };
  const r = inflation(f.mode, A, R, t, from);
  if (!Number.isFinite(r.futureCost) || r.futureCost > 1e18) return { status: "error", message: "The result is too large to show reliably." };
  return { status: "ok", result: r };
}

export function inflationCsv(r: InflationResult) {
  const rows = [`# Inflation at an assumed ${r.rate}% a year — an assumption, not official data.`, "Year,Cost of the same things,Value in starting-year money"];
  for (const x of r.rows) rows.push([x.label, x.cost.toFixed(2), x.value.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}
