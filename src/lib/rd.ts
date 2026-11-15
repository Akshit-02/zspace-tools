/**
 * Recurring deposit estimates.
 *
 * Quarterly convention (default, as Indian banks quote RDs): simulated month by
 * month. Each month the instalment is added (at the start of the month by
 * default), interest for that month accrues as simple interest at r/12 on the
 * balance, and accrued interest is credited — compounded — every third month.
 * Interest accrued since the last quarter end is credited at maturity.
 *
 * Monthly approximation: interest compounds every month at i = r/12,
 *   FV = PMT × ((1 + i)^n − 1) ÷ i     (deposits at month end)
 *   × (1 + i)                          (deposits at month start)
 *   FV = PMT × n                       (0% interest)
 *
 * Some calculators use a closed formula that compounds each instalment over
 * fractional quarters; it gives a slightly different figure. Banks also differ
 * in day counts and how they treat the last part-quarter, so these are
 * estimates.
 */
import { parseNum } from "./discount";

export type RdMode = "quarterly" | "monthly";
export type Timing = "begin" | "end";

export interface RdInput {
  monthly: number;
  rate: number;
  months: number;
  mode: RdMode;
  timing: Timing;
}

export interface RdMonth {
  month: number;
  deposited: number;
  interestCredited: number;
  balance: number;
}

export interface RdYear {
  year: number;
  months: number;
  deposited: number;
  interest: number;
  balance: number;
}

export interface RdResult {
  deposited: number;
  interest: number;
  maturity: number;
  instalments: number;
  /** Annual yield on the money actually deposited (IRR), or null if not meaningful. */
  effectiveAnnual: number | null;
  months: RdMonth[];
  years: RdYear[];
}

export function rd(i: RdInput): RdResult {
  const r = i.rate / 100;
  const m = r / 12;
  let bal = 0;
  let accrued = 0;
  let deposited = 0;
  const months: RdMonth[] = [];
  for (let k = 0; k < i.months; k++) {
    let credited = 0;
    if (i.mode === "quarterly") {
      if (i.timing === "begin") bal += i.monthly;
      accrued += bal * m;
      if (i.timing === "end") bal += i.monthly;
      if ((k + 1) % 3 === 0 || k === i.months - 1) {
        credited = accrued;
        bal += accrued;
        accrued = 0;
      }
    } else {
      const before = bal;
      if (i.timing === "begin") bal = (bal + i.monthly) * (1 + m);
      else bal = bal * (1 + m) + i.monthly;
      credited = bal - before - i.monthly;
    }
    deposited += i.monthly;
    months.push({ month: k + 1, deposited, interestCredited: credited, balance: bal });
  }
  const years: RdYear[] = [];
  for (let s = 0; s < months.length; s += 12) {
    const chunk = months.slice(s, s + 12);
    years.push({ year: s / 12 + 1, months: chunk.length, deposited: chunk.at(-1)!.deposited, interest: chunk.reduce((a, x) => a + x.interestCredited, 0), balance: chunk.at(-1)!.balance });
  }
  return { deposited, interest: bal - deposited, maturity: bal, instalments: i.months, effectiveAnnual: i.months && i.monthly > 0 ? irrAnnual(i.monthly, i.months, bal, i.timing) : null, months, years };
}

/** Annual effective yield x such that deposits grown at monthly (1+x)^(1/12)−1 equal the maturity value. */
export function irrAnnual(pmt: number, n: number, fv: number, timing: Timing) {
  const value = (q: number) => {
    let v = 0;
    for (let k = 0; k < n; k++) v += pmt * Math.pow(1 + q, n - k - (timing === "end" ? 1 : 0));
    return v;
  };
  let lo = -0.5;
  let hi = 1;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    if (value(mid) > fv) hi = mid;
    else lo = mid;
  }
  return Math.pow(1 + (lo + hi) / 2, 12) - 1;
}

/** The same total deposited upfront as an FD, quarterly compounding, for the same tenure. */
export function fdEquivalent(total: number, fdRate: number, months: number) {
  return total * Math.pow(1 + fdRate / 400, (4 * months) / 12);
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface RdForm {
  monthly: string;
  rate: string;
  tenure: string;
  unit: "months" | "years";
  mode: RdMode;
  timing: Timing;
}

export const LIMITS = { maxMonthly: 1e9, maxRate: 30, maxMonths: 600 };

export function rdFromForm(f: RdForm): Outcome<RdResult & { input: RdInput }> {
  const P = parseNum(f.monthly);
  const R = parseNum(f.rate);
  const d = parseNum(f.tenure);
  if (P === null || R === null || d === null) return { status: "empty" };
  if (Number.isNaN(P) || P <= 0) return { status: "error", field: "monthly", message: "Enter a monthly deposit greater than 0." };
  if (P > LIMITS.maxMonthly) return { status: "error", field: "monthly", message: "That deposit is larger than this calculator supports." };
  if (Number.isNaN(R) || R < 0 || R > LIMITS.maxRate) return { status: "error", field: "rate", message: `Enter an interest rate from 0% to ${LIMITS.maxRate}% a year.` };
  if (Number.isNaN(d) || d <= 0) return { status: "error", field: "tenure", message: "Enter a tenure greater than 0." };
  const exact = f.unit === "years" ? d * 12 : d;
  const months = Math.round(exact);
  if (months < 1) return { status: "error", field: "tenure", message: "An RD needs at least one monthly instalment." };
  if (months > LIMITS.maxMonths) return { status: "error", field: "tenure", message: `Tenures up to ${LIMITS.maxMonths / 12} years are supported.` };
  const notes: string[] = [];
  if (Math.abs(exact - months) > 1e-9) notes.push(`RDs take one instalment a month, so ${d} ${f.unit} was rounded to ${months} instalments.`);
  if (f.mode === "quarterly" && months % 3 !== 0) notes.push("The tenure ends part-way through a quarter; interest for those last months is credited at maturity.");
  if (R === 0) notes.push("At 0% interest the maturity value equals the total deposited.");
  const input: RdInput = { monthly: P, rate: R, months, mode: f.mode, timing: f.timing };
  return { status: "ok", result: { ...rd(input), input }, notes };
}

export function rdCsv(r: RdResult, currency: string) {
  const rows = [`# Recurring deposit estimate in ${currency}. Bank conventions differ; taxes not deducted.`, "Month,Total deposited,Interest credited this month,Balance"];
  for (const m of r.months) rows.push([m.month, m.deposited.toFixed(2), m.interestCredited.toFixed(2), m.balance.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}
