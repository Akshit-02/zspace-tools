/**
 * Compound interest with optional regular contributions.
 *
 * Initial principal, nominal annual rate R compounded m times a year for t years:
 *   A = P × (1 + R/m)^(m·t)          (t may be fractional)
 *
 * Contributions C are made f times a year, at the start or end of each
 * contribution period. Each deposit is grown individually for the time it is
 * actually invested:
 *   deposit at time tⱼ grows to C × (1 + R/m)^(m·(T − tⱼ))
 * When deposits are more frequent than compounding (e.g. monthly deposits,
 * yearly compounding) this uses the equivalent fractional-period rate, the
 * usual financial-calculator convention; some banks instead pay simple
 * interest between compounding dates, which gives slightly less.
 *
 * Daily compounding uses 365 periods a year. No calendar dates are involved,
 * so leap years don't change the result.
 *
 * Simple interest for comparison: P × (1 + R·t) + Σ C × (1 + R·(T − tⱼ)).
 */
import { parseNum } from "./discount";

export type Frequency = 365 | 12 | 4 | 2 | 1;
export type ContributionFrequency = 12 | 4 | 1;
export type Timing = "begin" | "end";

export const COMPOUNDING: { value: Frequency; label: string }[] = [
  { value: 365, label: "Daily" },
  { value: 12, label: "Monthly" },
  { value: 4, label: "Quarterly" },
  { value: 2, label: "Half-yearly" },
  { value: 1, label: "Yearly" },
];

export interface CiInput {
  principal: number;
  rate: number; // annual %, nominal
  years: number;
  compounding: Frequency;
  contribution: number;
  contributionFrequency: ContributionFrequency;
  timing: Timing;
}

export interface CiYear {
  year: number;
  /** End of this row in years (the last row may be a part-year). */
  to: number;
  start: number;
  contributions: number;
  interest: number;
  end: number;
  simpleEnd: number;
}

export interface CiResult {
  principal: number;
  contributions: number;
  invested: number;
  interest: number;
  final: number;
  growthPct: number | null;
  /** Annual percentage yield: (1 + R/m)^m − 1. */
  effectiveAnnual: number;
  deposits: number;
  simpleFinal: number;
  simpleInterest: number;
  years: CiYear[];
}

export const LIMITS = { maxAmount: 1e12, minRate: -10, maxRate: 100, maxYears: 100 };

/** Times (in years) of every contribution made within [0, t]. */
export function depositTimes(t: number, f: number, timing: Timing) {
  const k = Math.floor(t * f + 1e-9);
  return Array.from({ length: k }, (_, j) => (timing === "begin" ? j : j + 1) / f);
}

/** Growth factor over `dt` years. */
export const growth = (rate: number, m: number, dt: number) => Math.pow(1 + rate / 100 / m, m * dt);

/** Balance at time T: principal plus every deposit made by then (end-of-period deposits at exactly T count; start-of-period deposits at T belong to the next period). */
function balanceAt(i: CiInput, times: number[], T: number, simple = false) {
  const g = (dt: number) => (simple ? 1 + (i.rate / 100) * dt : growth(i.rate, i.compounding, dt));
  let b = i.principal * g(T);
  let deposited = 0;
  for (const tj of times) {
    if (i.timing === "end" ? tj <= T + 1e-12 : tj < T - 1e-12) {
      b += i.contribution * g(T - tj);
      deposited += i.contribution;
    }
  }
  return { b, deposited };
}

export function compound(i: CiInput): CiResult {
  const times = i.contribution > 0 ? depositTimes(i.years, i.contributionFrequency, i.timing) : [];
  const fin = balanceAt(i, times, i.years);
  const sim = balanceAt(i, times, i.years, true);
  const years: CiYear[] = [];
  let prev = { b: i.principal, deposited: 0 };
  for (let y = 1; y - 1 < i.years - 1e-9; y++) {
    const to = Math.min(y, i.years);
    const now = balanceAt(i, times, to);
    const contributions = now.deposited - prev.deposited;
    years.push({ year: y, to, start: prev.b, contributions, interest: now.b - prev.b - contributions, end: now.b, simpleEnd: balanceAt(i, times, to, true).b });
    prev = now;
  }
  const invested = i.principal + fin.deposited;
  return {
    principal: i.principal,
    contributions: fin.deposited,
    invested,
    interest: fin.b - invested,
    final: fin.b,
    growthPct: invested > 0 ? ((fin.b - invested) / invested) * 100 : null,
    effectiveAnnual: growth(i.rate, i.compounding, 1) - 1,
    deposits: times.length,
    simpleFinal: sim.b,
    simpleInterest: sim.b - invested,
    years,
  };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface CiForm {
  principal: string;
  rate: string;
  duration: string;
  unit: "years" | "months";
  compounding: Frequency;
  contribution: string;
  contributionFrequency: ContributionFrequency;
  timing: Timing;
}

export function compoundFromForm(f: CiForm): Outcome<CiResult & { input: CiInput }> {
  const P = parseNum(f.principal);
  const R = parseNum(f.rate);
  const d = parseNum(f.duration);
  const C = f.contribution.trim() ? parseNum(f.contribution) : 0;
  if (P === null || R === null || d === null) return { status: "empty" };
  if (Number.isNaN(P) || P < 0 || P > LIMITS.maxAmount) return { status: "error", field: "principal", message: "Enter an initial amount of 0 or more (up to 1,000,000,000,000)." };
  if (Number.isNaN(R) || R < LIMITS.minRate || R > LIMITS.maxRate) return { status: "error", field: "rate", message: `Enter an interest rate between ${LIMITS.minRate}% and ${LIMITS.maxRate}% a year.` };
  if (Number.isNaN(d) || d <= 0) return { status: "error", field: "duration", message: "Enter a duration greater than 0." };
  if (C === null || Number.isNaN(C) || C < 0 || C > LIMITS.maxAmount) return { status: "error", field: "contribution", message: "The regular contribution must be 0 or more." };
  const years = f.unit === "years" ? d : d / 12;
  if (years > LIMITS.maxYears) return { status: "error", field: "duration", message: `Durations up to ${LIMITS.maxYears} years are supported.` };
  if (P === 0 && C === 0) return { status: "error", field: "principal", message: "Enter an initial amount, a regular contribution, or both." };
  const input: CiInput = { principal: P, rate: R, years, compounding: f.compounding, contribution: C, contributionFrequency: f.contributionFrequency, timing: f.timing };
  const notes: string[] = [];
  if (C > 0 && f.contributionFrequency > f.compounding) notes.push("Contributions are more frequent than compounding, so each deposit earns the equivalent fractional-period rate until the end. Some banks pay simple interest between compounding dates instead, which gives slightly less.");
  if (C > 0 && Math.abs(years * f.contributionFrequency - Math.round(years * f.contributionFrequency)) > 1e-9) notes.push("The duration isn't a whole number of contribution periods, so only contributions made within it are counted.");
  if (R < 0) notes.push("A negative rate means the balance shrinks over time.");
  const result = compound(input);
  if (!Number.isFinite(result.final) || Math.abs(result.final) > 1e15) return { status: "error", message: "The result is too large to show reliably. Reduce the amount, rate or duration." };
  return { status: "ok", result: { ...result, input }, notes };
}

export function compoundCsv(r: CiResult, currency: string) {
  const rows = [`# Compound interest schedule in ${currency}. Estimate at a constant rate.`, "Year,Starting balance,Contributions,Interest earned,Ending balance,Ending balance (simple interest)"];
  for (const y of r.years) rows.push([y.to === y.year ? y.year : `${y.year} (to ${+y.to.toFixed(4)} y)`, y.start.toFixed(2), y.contributions.toFixed(2), y.interest.toFixed(2), y.end.toFixed(2), y.simpleEnd.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}
