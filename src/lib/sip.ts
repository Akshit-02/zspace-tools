/**
 * SIP (systematic investment plan) projections.
 *
 * Monthly rate, by default the effective-annual convention:
 *   r = (1 + R/100)^(1/12) − 1      (12 months at r compound to exactly R% a year)
 * or, optionally, the nominal convention many fund-house calculators use:
 *   r = R / 12 / 100
 *
 * Fixed SIP, contributions at the end of each month (ordinary annuity):
 *   FV = P × ((1 + r)^n − 1) / r      (FV = P × n when r = 0)
 * Contributions at the start of each month (annuity due): multiply by (1 + r).
 *
 * Step-up SIP: the instalment rises by s% after every 12 instalments, so
 * instalment k (0-based) is P × (1 + s)^⌊k/12⌋. It is simulated month by month
 * — each instalment compounds for exactly the months it is invested — and the
 * fixed-SIP formula is used as a cross-check in the tests.
 *
 * These are projections at a constant assumed rate. Real fund returns vary.
 * Values are plain doubles (≈15 significant digits) and shown rounded to the
 * whole rupee/unit; that precision is far finer than the assumption itself.
 */
import { parseNum } from "./discount";

export type Timing = "begin" | "end";
export type RateMode = "effective" | "nominal";

export interface SipInput {
  monthly: number;
  annualReturn: number;
  months: number;
  timing: Timing;
  stepUp: number;
  rateMode: RateMode;
}

export interface SipYear {
  year: number;
  /** Instalments made this year (12, or fewer in a final part-year). */
  instalments: number;
  monthly: number;
  investedInYear: number;
  invested: number;
  value: number;
  returns: number;
}

export interface SipResult {
  invested: number;
  value: number;
  returns: number;
  instalments: number;
  monthlyRate: number;
  /** The annual rate the monthly rate compounds to. */
  effectiveAnnual: number;
  lastInstalment: number;
  years: SipYear[];
}

export const LIMITS = { maxMonthly: 100_000_000, minReturn: -50, maxReturn: 100, maxMonths: 600, maxStepUp: 100 };

export function monthlyRate(annualReturn: number, mode: RateMode) {
  return mode === "nominal" ? annualReturn / 1200 : Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
}

/** Closed-form future value of a fixed monthly SIP (no step-up). */
export function fixedSipValue(monthly: number, r: number, n: number, timing: Timing) {
  if (n <= 0) return 0;
  const base = r === 0 ? monthly * n : (monthly * (Math.pow(1 + r, n) - 1)) / r;
  return timing === "begin" ? base * (1 + r) : base;
}

export function sip(i: SipInput): SipResult {
  const r = monthlyRate(i.annualReturn, i.rateMode);
  const s = i.stepUp / 100;
  let value = 0;
  let invested = 0;
  let investedInYear = 0;
  let instalment = i.monthly;
  const years: SipYear[] = [];
  for (let k = 0; k < i.months; k++) {
    instalment = i.monthly * Math.pow(1 + s, Math.floor(k / 12));
    if (i.timing === "begin") value = (value + instalment) * (1 + r);
    else value = value * (1 + r) + instalment;
    invested += instalment;
    investedInYear += instalment;
    if ((k + 1) % 12 === 0 || k === i.months - 1) {
      years.push({ year: Math.floor(k / 12) + 1, instalments: (k % 12) + 1, monthly: instalment, investedInYear, invested, value, returns: value - invested });
      investedInYear = 0;
    }
  }
  return {
    invested,
    value,
    returns: value - invested,
    instalments: i.months,
    monthlyRate: r,
    effectiveAnnual: Math.pow(1 + r, 12) - 1,
    lastInstalment: i.months ? instalment : 0,
    years,
  };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface SipForm {
  monthly: string;
  annualReturn: string;
  duration: string;
  unit: "years" | "months";
  timing: Timing;
  stepUp: string;
  rateMode: RateMode;
}

/** Validates raw form strings and runs the projection. */
export function sipFromForm(f: SipForm): Outcome<SipResult & { input: SipInput }> {
  const m = parseNum(f.monthly);
  const R = parseNum(f.annualReturn);
  const d = parseNum(f.duration);
  const st = f.stepUp.trim() ? parseNum(f.stepUp) : 0;
  if (m === null || R === null || d === null) return { status: "empty" };
  if (Number.isNaN(m) || m < 0) return { status: "error", field: "monthly", message: "Enter a monthly investment of 0 or more." };
  if (m > LIMITS.maxMonthly) return { status: "error", field: "monthly", message: `Monthly investment can be at most ${LIMITS.maxMonthly.toLocaleString("en-IN")}.` };
  if (Number.isNaN(R) || R < LIMITS.minReturn || R > LIMITS.maxReturn) return { status: "error", field: "annualReturn", message: `Enter an expected return between ${LIMITS.minReturn}% and ${LIMITS.maxReturn}% a year.` };
  if (Number.isNaN(d) || d <= 0) return { status: "error", field: "duration", message: "Enter a duration greater than 0." };
  if (st === null || Number.isNaN(st) || st < 0 || st > LIMITS.maxStepUp) return { status: "error", field: "stepUp", message: `Annual step-up must be between 0% and ${LIMITS.maxStepUp}%.` };
  const exactMonths = f.unit === "years" ? d * 12 : d;
  const months = Math.round(exactMonths);
  if (months < 1) return { status: "error", field: "duration", message: "The duration must be at least one month." };
  if (months > LIMITS.maxMonths) return { status: "error", field: "duration", message: `Durations up to ${LIMITS.maxMonths / 12} years (${LIMITS.maxMonths} months) are supported.` };
  const notes: string[] = [];
  if (Math.abs(exactMonths - months) > 1e-9) notes.push(`SIPs are monthly, so ${d} ${f.unit} was rounded to ${months} monthly instalments.`);
  if (R < 0) notes.push("A negative return means the investment is assumed to lose value every year.");
  if (R > 30) notes.push(`${R}% a year is far above long-term returns of broad equity markets. Treat this projection with caution.`);
  const input: SipInput = { monthly: m, annualReturn: R, months, timing: f.timing, stepUp: st, rateMode: f.rateMode };
  const result = sip(input);
  if (!Number.isFinite(result.value) || result.value > 1e15) return { status: "error", message: "The result is too large to show reliably. Reduce the amount, return or duration." };
  return { status: "ok", result: { ...result, input }, notes };
}

export function sipCsv(r: SipResult, currency: string) {
  const rows = [`# SIP projection in ${currency}. Illustrative estimate at a constant assumed return — not guaranteed.`, "Year,Instalments,Monthly instalment,Invested this year,Total invested,Estimated value,Estimated returns"];
  for (const y of r.years) rows.push([y.year, y.instalments, y.monthly.toFixed(2), y.investedInYear.toFixed(2), y.invested.toFixed(2), y.value.toFixed(2), y.returns.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}

export const SIP_DISCLAIMER = "Returns are illustrative estimates based on the selected assumed rate. Mutual fund investments are subject to market risks and actual returns may vary.";
