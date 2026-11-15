/**
 * Compound annual growth rate.
 *
 *   CAGR  = (End ÷ Start)^(1/t) − 1
 *   End   = Start × (1 + CAGR)^t
 *   Start = End ÷ (1 + CAGR)^t
 *
 * t is in years (years + months ÷ 12). CAGR is the steady yearly rate that
 * links two values; it says nothing about the actual path in between and
 * doesn't account for money added or withdrawn.
 */
import { parseNum } from "./discount";

export type CagrMode = "rate" | "end" | "start";

export interface CagrForm {
  mode: CagrMode;
  start: string;
  end: string;
  rate: string;
  years: string;
  months: string;
}

export interface CagrResult {
  start: number;
  end: number;
  /** As a percentage. */
  cagr: number;
  years: number;
  gain: number;
  totalGrowthPct: number;
  projection: { year: number; to: number; value: number }[];
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T };

export const cagr = (start: number, end: number, t: number) => (Math.pow(end / start, 1 / t) - 1) * 100;
export const endValue = (start: number, ratePct: number, t: number) => start * Math.pow(1 + ratePct / 100, t);
export const startValue = (end: number, ratePct: number, t: number) => end / Math.pow(1 + ratePct / 100, t);

export function cagrFromForm(f: CagrForm): Outcome<CagrResult> {
  const y = f.years.trim() ? parseNum(f.years) : null;
  const m = f.months.trim() ? parseNum(f.months) : null;
  if (y === null && m === null) return { status: "empty" };
  if (y !== null && (Number.isNaN(y) || y < 0)) return { status: "error", field: "years", message: "Years must be 0 or more." };
  if (m !== null && (Number.isNaN(m) || m < 0 || m >= 12)) return { status: "error", field: "months", message: "Months must be from 0 to 11." };
  const t = (y ?? 0) + (m ?? 0) / 12;
  if (t <= 0) return { status: "error", field: "years", message: "The duration must be longer than 0." };
  if (t > 200) return { status: "error", field: "years", message: "Durations up to 200 years are supported." };

  const num = (raw: string, field: string, label: string) => {
    const v = parseNum(raw);
    if (v === null) return null;
    if (Number.isNaN(v) || v <= 0) return { error: { status: "error" as const, field, message: `${label} must be greater than 0 — CAGR only works between two positive values.` } };
    return v;
  };
  const rateOf = (raw: string) => {
    const v = parseNum(raw);
    if (v === null) return null;
    if (Number.isNaN(v) || v <= -100 || v > 1000) return { error: { status: "error" as const, field: "rate", message: "Enter a CAGR above −100% (and up to 1000%)." } };
    return v;
  };

  let start: number, end: number, rate: number;
  if (f.mode === "rate") {
    const s = num(f.start, "start", "The starting value");
    const e = num(f.end, "end", "The ending value");
    if (s === null || e === null) return { status: "empty" };
    if (typeof s === "object") return s.error;
    if (typeof e === "object") return e.error;
    [start, end, rate] = [s, e, cagr(s, e, t)];
  } else if (f.mode === "end") {
    const s = num(f.start, "start", "The starting value");
    const r = rateOf(f.rate);
    if (s === null || r === null) return { status: "empty" };
    if (typeof s === "object") return s.error;
    if (typeof r === "object") return r.error;
    [start, rate, end] = [s, r, endValue(s, r, t)];
  } else {
    const e = num(f.end, "end", "The ending value");
    const r = rateOf(f.rate);
    if (e === null || r === null) return { status: "empty" };
    if (typeof e === "object") return e.error;
    if (typeof r === "object") return r.error;
    [end, rate, start] = [e, r, startValue(e, r, t)];
  }
  if (![start, end, rate].every(Number.isFinite) || end > 1e18 || start > 1e18) return { status: "error", message: "The result is too large to show reliably. Reduce the values, rate or duration." };
  const projection: CagrResult["projection"] = [{ year: 0, to: 0, value: start }];
  if (t <= 100)
    for (let k = 1; k - 1 < t - 1e-9; k++) {
      const to = Math.min(k, t);
      projection.push({ year: k, to, value: endValue(start, rate, to) });
    }
  return { status: "ok", result: { start, end, cagr: rate, years: t, gain: end - start, totalGrowthPct: ((end - start) / start) * 100, projection } };
}

export function cagrCsv(r: CagrResult) {
  const rows = ["# Smooth growth path at the calculated CAGR — real values may have moved differently.", "Year,Value"];
  for (const p of r.projection) rows.push([p.to === p.year ? p.year : +p.to.toFixed(4), p.value.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}
