/**
 * One-time (lumpsum) investment projection.
 *
 *   FV = P × (1 + r/m)^(m·t)         (annual compounding: P × (1 + r)^t)
 *   Gain = FV − P;  total return % = (FV − P) ÷ P × 100
 *   Inflation-adjusted value = FV ÷ (1 + inflation)^t   (today's money)
 *
 * A constant assumed return is used purely for illustration.
 */
import { parseNum } from "./discount";
import { growth } from "./compound";

export type LsFrequency = 1 | 2 | 4 | 12;

export interface LsInput {
  amount: number;
  rate: number;
  years: number;
  compounding: LsFrequency;
  inflation: number | null;
}

export interface LsYear {
  year: number;
  to: number;
  value: number;
  gain: number;
  real: number | null;
}

export interface LsResult {
  amount: number;
  value: number;
  gain: number;
  totalReturnPct: number;
  effectiveAnnual: number;
  real: number | null;
  realGain: number | null;
  /** Annual growth in purchasing power: (1 + effective) ÷ (1 + inflation) − 1. */
  realAnnual: number | null;
  years: LsYear[];
}

export function lumpsum(i: LsInput): LsResult {
  const fv = (t: number) => i.amount * growth(i.rate, i.compounding, t);
  const deflate = (v: number, t: number) => (i.inflation === null ? null : v / Math.pow(1 + i.inflation / 100, t));
  const years: LsYear[] = [];
  for (let y = 1; y - 1 < i.years - 1e-9; y++) {
    const to = Math.min(y, i.years);
    const v = fv(to);
    years.push({ year: y, to, value: v, gain: v - i.amount, real: deflate(v, to) });
  }
  const value = fv(i.years);
  const effectiveAnnual = growth(i.rate, i.compounding, 1) - 1;
  const real = deflate(value, i.years);
  return {
    amount: i.amount,
    value,
    gain: value - i.amount,
    totalReturnPct: ((value - i.amount) / i.amount) * 100,
    effectiveAnnual,
    real,
    realGain: real === null ? null : real - i.amount,
    realAnnual: i.inflation === null ? null : (1 + effectiveAnnual) / (1 + i.inflation / 100) - 1,
    years,
  };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface LsForm {
  amount: string;
  rate: string;
  years: string;
  compounding: LsFrequency;
  inflation: string;
}

export const LIMITS = { maxAmount: 1e12, minRate: -50, maxRate: 100, maxYears: 60, maxInflation: 50 };

export function lumpsumFromForm(f: LsForm, label = ""): Outcome<LsResult & { input: LsInput }> {
  const P = parseNum(f.amount);
  const R = parseNum(f.rate);
  const t = parseNum(f.years);
  const inf = f.inflation.trim() ? parseNum(f.inflation) : null;
  const L = label ? `${label}: ` : "";
  if (P === null || R === null || t === null) return { status: "empty" };
  if (Number.isNaN(P) || P <= 0) return { status: "error", field: "amount", message: `${L}Enter an investment amount greater than 0.` };
  if (P > LIMITS.maxAmount) return { status: "error", field: "amount", message: `${L}That amount is larger than this calculator supports.` };
  if (Number.isNaN(R) || R < LIMITS.minRate || R > LIMITS.maxRate) return { status: "error", field: "rate", message: `${L}Enter an expected return between ${LIMITS.minRate}% and ${LIMITS.maxRate}% a year.` };
  if (Number.isNaN(t) || t <= 0 || t > LIMITS.maxYears) return { status: "error", field: "years", message: `${L}Enter a duration from more than 0 up to ${LIMITS.maxYears} years.` };
  if (inf !== null && (Number.isNaN(inf) || inf < 0 || inf > LIMITS.maxInflation)) return { status: "error", field: "inflation", message: `Inflation must be between 0% and ${LIMITS.maxInflation}%.` };
  const input: LsInput = { amount: P, rate: R, years: t, compounding: f.compounding, inflation: inf };
  const result = lumpsum(input);
  if (!Number.isFinite(result.value) || result.value > 1e15) return { status: "error", message: "The result is too large to show reliably. Reduce the amount, return or duration." };
  const notes: string[] = [];
  if (R < 0) notes.push("A negative return means the investment is assumed to lose value every year.");
  if (R > 30) notes.push(`${R}% a year is far above long-term returns of broad markets. Treat this projection with caution.`);
  if (inf !== null && result.realAnnual !== null && result.realAnnual < 0) notes.push("The assumed return is below inflation, so the investment loses purchasing power.");
  return { status: "ok", result: { ...result, input }, notes };
}

export function lumpsumCsv(r: LsResult, currency: string) {
  const inf = r.real !== null;
  const rows = [`# Lumpsum projection in ${currency}. Illustrative estimate at a constant assumed return — not guaranteed.`, `Year,Estimated value,Estimated gain${inf ? ",Value in today's money" : ""}`];
  for (const y of r.years) rows.push([y.to === y.year ? y.year : `${y.year} (to ${+y.to.toFixed(4)} y)`, y.value.toFixed(2), y.gain.toFixed(2), ...(inf ? [y.real!.toFixed(2)] : [])].join(","));
  return rows.join("\n") + "\n";
}
