/**
 * Systematic withdrawal plan — period-by-period simulation.
 *
 * The entered return R is an effective annual rate, so each period grows by
 *   p = (1 + R)^(1/f) − 1      f = withdrawals a year (12, 4 or 1)
 * Withdrawal k (0-based) = W × (1 + s)^⌊k/f⌋ for an annual increase s.
 *
 * Start-of-period: withdraw, then the remainder grows for the period.
 * End-of-period:   the balance grows, then the withdrawal is taken.
 * If the balance can't cover a withdrawal, the last payment is whatever is
 * left and the corpus is exhausted — the balance is never negative.
 */
import { parseNum } from "./discount";

export type SwpFrequency = 12 | 4 | 1;
export type Timing = "begin" | "end";

export interface SwpInput {
  corpus: number;
  withdrawal: number;
  annualReturn: number;
  frequency: SwpFrequency;
  timing: Timing;
  years: number;
  stepUp: number;
  inflation: number | null;
}

export interface SwpPeriod {
  period: number; // 1-based
  withdrawal: number; // actually paid
  growth: number;
  balance: number;
}

export interface SwpYear {
  year: number;
  withdrawn: number;
  growth: number;
  balance: number;
  /** Balance in today's money, if inflation was given. */
  realBalance: number | null;
}

export interface SwpResult {
  corpus: number;
  totalWithdrawn: number;
  totalGrowth: number;
  remaining: number;
  /** Withdrawals actually made (the last may be partial). */
  withdrawals: number;
  /** Period index (1-based) in which money ran out, or null if it lasted the projection. */
  exhaustedAt: number | null;
  /** The final partial payment when exhausted. */
  lastPartial: number | null;
  periodicRate: number;
  periods: SwpPeriod[];
  years: SwpYear[];
  firstWithdrawal: number;
  lastFullWithdrawal: number;
  realRemaining: number | null;
}

export function swp(i: SwpInput): SwpResult {
  const f = i.frequency;
  const p = Math.pow(1 + i.annualReturn / 100, 1 / f) - 1;
  const n = Math.round(i.years * f);
  let bal = i.corpus;
  let totalWithdrawn = 0;
  let totalGrowth = 0;
  let exhaustedAt: number | null = null;
  let lastPartial: number | null = null;
  let lastFull = 0;
  const periods: SwpPeriod[] = [];
  for (let k = 0; k < n; k++) {
    const due = i.withdrawal * Math.pow(1 + i.stepUp / 100, Math.floor(k / f));
    let paid = 0;
    let growth = 0;
    const take = () => {
      paid = Math.min(bal, due);
      bal -= paid;
      if (paid < due - 1e-9) {
        exhaustedAt = k + 1;
        lastPartial = paid;
        bal = 0;
      } else {
        lastFull = due;
        // A full withdrawal that empties the corpus exactly also ends the plan.
        if (bal <= 1e-9 * Math.max(1, due)) {
          exhaustedAt = k + 1;
          bal = 0;
        }
      }
    };
    if (i.timing === "begin") {
      take();
      growth = bal * p;
      bal += growth;
    } else {
      growth = bal * p;
      bal += growth;
      take();
    }
    totalWithdrawn += paid;
    totalGrowth += growth;
    periods.push({ period: k + 1, withdrawal: paid, growth, balance: Math.max(0, bal) });
    if (exhaustedAt !== null) break;
  }
  const deflate = (v: number, yearsElapsed: number) => (i.inflation === null ? null : v / Math.pow(1 + i.inflation / 100, yearsElapsed));
  const years: SwpYear[] = [];
  for (let s = 0; s < periods.length; s += f) {
    const chunk = periods.slice(s, s + f);
    const end = chunk[chunk.length - 1];
    const yearsElapsed = (s + chunk.length) / f;
    years.push({ year: s / f + 1, withdrawn: chunk.reduce((a, x) => a + x.withdrawal, 0), growth: chunk.reduce((a, x) => a + x.growth, 0), balance: end.balance, realBalance: deflate(end.balance, yearsElapsed) });
  }
  const remaining = Math.max(0, bal);
  return {
    corpus: i.corpus,
    totalWithdrawn,
    totalGrowth,
    remaining,
    withdrawals: periods.filter((x) => x.withdrawal > 0).length,
    exhaustedAt,
    lastPartial: lastPartial && lastPartial > 0 ? lastPartial : null,
    periodicRate: p,
    periods,
    years,
    firstWithdrawal: i.withdrawal,
    lastFullWithdrawal: lastFull,
    realRemaining: deflate(remaining, periods.length / f),
  };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface SwpForm {
  corpus: string;
  withdrawal: string;
  annualReturn: string;
  frequency: SwpFrequency;
  timing: Timing;
  years: string;
  stepUp: string;
  inflation: string;
  linkToInflation: boolean;
}

export const LIMITS = { maxAmount: 1e12, minReturn: -50, maxReturn: 50, maxYears: 60, maxStep: 25, maxInflation: 25 };

export function swpFromForm(f: SwpForm): Outcome<SwpResult & { input: SwpInput }> {
  const C = parseNum(f.corpus);
  const W = parseNum(f.withdrawal);
  const R = parseNum(f.annualReturn);
  const Y = parseNum(f.years);
  const inf = f.inflation.trim() ? parseNum(f.inflation) : null;
  if (C === null || W === null || R === null || Y === null) return { status: "empty" };
  if (Number.isNaN(C) || C <= 0 || C > LIMITS.maxAmount) return { status: "error", field: "corpus", message: "Enter an investment corpus greater than 0." };
  if (Number.isNaN(W) || W <= 0) return { status: "error", field: "withdrawal", message: "Enter a withdrawal amount greater than 0." };
  if (Number.isNaN(R) || R < LIMITS.minReturn || R > LIMITS.maxReturn) return { status: "error", field: "annualReturn", message: `Enter an annual return between ${LIMITS.minReturn}% and ${LIMITS.maxReturn}%.` };
  if (Number.isNaN(Y) || Y <= 0 || Y > LIMITS.maxYears) return { status: "error", field: "years", message: `Enter a projection period from more than 0 up to ${LIMITS.maxYears} years.` };
  if (inf !== null && (Number.isNaN(inf) || inf < 0 || inf > LIMITS.maxInflation)) return { status: "error", field: "inflation", message: `Inflation must be between 0% and ${LIMITS.maxInflation}%.` };
  let s = 0;
  if (f.linkToInflation) {
    if (inf === null) return { status: "error", field: "inflation", message: "Enter an inflation rate to link withdrawals to it." };
    s = inf;
  } else if (f.stepUp.trim()) {
    const v = parseNum(f.stepUp);
    if (v === null || Number.isNaN(v) || v < 0 || v > LIMITS.maxStep) return { status: "error", field: "stepUp", message: `Annual increase must be between 0% and ${LIMITS.maxStep}%.` };
    s = v;
  }
  const n = Math.round(Y * f.frequency);
  if (n < 1) return { status: "error", field: "years", message: "The projection must include at least one withdrawal." };
  const input: SwpInput = { corpus: C, withdrawal: W, annualReturn: R, frequency: f.frequency, timing: f.timing, years: Y, stepUp: s, inflation: inf };
  const result = swp(input);
  const notes: string[] = [];
  if (Math.abs(Y * f.frequency - n) > 1e-9) notes.push(`The projection was rounded to ${n} whole withdrawal periods.`);
  const yearly = W * f.frequency;
  if (yearly / C > 0.1) notes.push(`You're withdrawing ${((yearly / C) * 100).toFixed(1)}% of the corpus in the first year — a high rate that usually shortens how long the money lasts.`);
  if (R < 0) notes.push("A negative return means the corpus shrinks even before withdrawals.");
  return { status: "ok", result: { ...result, input }, notes };
}

export function swpCsv(r: SwpResult, currency: string, per: string) {
  const rows = [`# SWP projection in ${currency}. Illustrative estimate at a constant assumed return — actual returns vary.`, `${per},Withdrawal,Growth,Balance`];
  for (const p of r.periods) rows.push([p.period, p.withdrawal.toFixed(2), p.growth.toFixed(2), p.balance.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}

/** "3 years 4 months" from a 1-based period count. */
export function periodsToText(periods: number, f: SwpFrequency) {
  const months = Math.round((periods * 12) / f);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} ${y === 1 ? "year" : "years"}` : "", m ? `${m} ${m === 1 ? "month" : "months"}` : ""].filter(Boolean).join(" ") || "0 months";
}
