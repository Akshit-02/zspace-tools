/**
 * Month-by-month amortisation with prepayments — the shared engine for the
 * prepayment, car-loan and personal-loan calculators.
 *
 * Conventions (same as src/lib/emi.ts):
 *  - Reducing balance, monthly rest: interest for a month = balance × annual rate ÷ 12.
 *  - Money is kept in integer paise; each month's interest is rounded to the paisa.
 *  - The EMI is rounded to the paisa; the last instalment clears the balance exactly.
 *  - A prepayment "before EMI" is applied at the start of the month, so that month's
 *    interest is charged on the reduced balance. One "after EMI" is applied once the
 *    month's EMI has been paid, so it reduces interest from the next month.
 *  - "Reduce EMI": after each prepayment the EMI is recalculated over the remaining
 *    original months. "Reduce tenure": the EMI stays and the loan ends sooner.
 */
import { emiExact } from "../emi";

export type Timing = "before" | "after";
export type Strategy = "tenure" | "emi";
export type Frequency = "once" | "monthly" | "quarterly" | "half-yearly" | "yearly";

export const FREQ_MONTHS: Record<Exclude<Frequency, "once">, number> = { monthly: 1, quarterly: 3, "half-yearly": 6, yearly: 12 };

export interface PrepaymentPlan {
  amount: number;
  frequency: Frequency;
  /** Month number (1 = the first EMI of the schedule) of the first prepayment. */
  start: number;
  /** Optional last month for recurring prepayments (inclusive). */
  end?: number;
}

export interface AmortInput {
  principal: number;
  annualRate: number;
  months: number;
  /** Optional fixed EMI (e.g. what the lender actually charges); defaults to the formula EMI. */
  emi?: number;
  plans?: PrepaymentPlan[];
  timing?: Timing;
  strategy?: Strategy;
  /** Prepayment charge as % of each prepaid amount (paid on top, not reducing principal). */
  feePct?: number;
}

export interface AmortRow {
  month: number;
  opening: number;
  emi: number;
  interest: number;
  principal: number;
  prepayment: number;
  fee: number;
  closing: number;
}

export interface AmortResult {
  emi: number;
  /** EMI at the end (differs from `emi` when reducing EMI). */
  finalEmi: number;
  rows: AmortRow[];
  months: number;
  totalInterest: number;
  totalEmiPaid: number;
  totalPrepaid: number;
  totalFees: number;
  totalPaid: number;
}

const P = (v: number) => Math.round(v * 100);
const R = (v: number) => v / 100;

/** Prepayment amount (in rupees) planned for a given month. */
export function plannedFor(month: number, plans: PrepaymentPlan[] = []) {
  let sum = 0;
  for (const p of plans) {
    if (!(p.amount > 0) || month < p.start || (p.end !== undefined && month > p.end)) continue;
    if (p.frequency === "once") {
      if (month === p.start) sum += p.amount;
    } else if ((month - p.start) % FREQ_MONTHS[p.frequency] === 0) sum += p.amount;
  }
  return sum;
}

export function amortise(i: AmortInput): AmortResult {
  const r = i.annualRate / 1200;
  let emiP = P(i.emi ?? emiExact({ principal: i.principal, annualRate: i.annualRate, months: i.months }));
  const firstEmi = emiP;
  let bal = P(i.principal);
  const rows: AmortRow[] = [];
  const timing = i.timing ?? "after";
  const strategy = i.strategy ?? "tenure";
  const feePct = i.feePct ?? 0;
  let tI = 0, tE = 0, tPre = 0, tFee = 0;
  let formulaEmi = i.emi === undefined;
  // Safety stop: a fixed EMI that doesn't cover interest would never end.
  const limit = i.months + 1200;
  for (let m = 1; bal > 0 && m <= limit; m++) {
    const opening = bal;
    let pre = 0;
    const planned = P(plannedFor(m, i.plans));
    if (timing === "before" && planned > 0) {
      pre = Math.min(planned, bal);
      bal -= pre;
      if (strategy === "emi" && bal > 0) {
        emiP = P(emiExact({ principal: R(bal), annualRate: i.annualRate, months: Math.max(1, i.months - m + 1) }));
        formulaEmi = true;
      }
    }
    let interest = 0, princ = 0, pay = 0;
    if (bal > 0) {
      interest = Math.round(bal * r);
      princ = emiP - interest;
      pay = emiP;
      // Clear the balance on the last instalment, or at the scheduled final month when the
      // EMI is the formula EMI (any residual there is paise of rounding).
      if (princ >= bal || (formulaEmi && m >= i.months)) {
        princ = bal;
        pay = bal + interest;
      }
      if (princ < 0) throw new Error("EMI_TOO_LOW");
      bal -= princ;
    }
    if (timing === "after" && planned > 0 && bal > 0) {
      pre = Math.min(planned, bal);
      bal -= pre;
      if (strategy === "emi" && bal > 0) {
        emiP = P(emiExact({ principal: R(bal), annualRate: i.annualRate, months: Math.max(1, i.months - m) }));
        formulaEmi = true;
      }
    }
    const fee = Math.round((pre * feePct) / 100);
    rows.push({ month: m, opening: R(opening), emi: R(pay), interest: R(interest), principal: R(princ), prepayment: R(pre), fee: R(fee), closing: R(bal) });
    tI += interest;
    tE += pay;
    tPre += pre;
    tFee += fee;
  }
  return { emi: R(firstEmi), finalEmi: R(emiP), rows, months: rows.length, totalInterest: R(tI), totalEmiPaid: R(tE), totalPrepaid: R(tPre), totalFees: R(tFee), totalPaid: R(tE + tPre + tFee) };
}

/** Months needed to repay `principal` with a fixed `emi` (Infinity if the EMI doesn't cover interest). */
export function monthsToRepay(principal: number, annualRate: number, emi: number) {
  const r = annualRate / 1200;
  if (emi <= 0) return Infinity;
  if (r === 0) return Math.ceil(principal / emi);
  if (emi <= principal * r) return Infinity;
  // A rounded EMI can leave a few paise after the last whole month; ignore residues under 0.1% of a month.
  return Math.ceil(-Math.log(1 - (principal * r) / emi) / Math.log(1 + r) - 1e-3);
}

/** Loan principal that a given EMI repays over `months` (present value of an annuity). */
export function principalFromEmi(emi: number, annualRate: number, months: number) {
  const r = annualRate / 1200;
  if (months <= 0 || emi <= 0) return 0;
  if (r === 0) return emi * months;
  return (emi * (1 - Math.pow(1 + r, -months))) / r;
}

/** Adds `months` to a year/month (month 1–12) and returns a label like "Mar 2041". */
export function addMonths(y: number, m: number, months: number) {
  const t = y * 12 + (m - 1) + months;
  return { y: Math.floor(t / 12), m: (t % 12) + 1 };
}
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (d: { y: number; m: number }) => `${MON[d.m - 1]} ${d.y}`;

/**
 * Annual percentage rate implied by cash flows at monthly intervals
 * (flows[0] at t = 0). Solves the monthly IRR by bisection and annualises it
 * as (1 + i)^12 − 1. Returns null if there's no sign change.
 */
export function effectiveAnnualRate(flows: number[]) {
  const npv = (i: number) => flows.reduce((a, f, t) => a + f / Math.pow(1 + i, t), 0);
  let lo = -0.99, hi = 1;
  let flo = npv(lo), fhi = npv(hi);
  if (!(flo * fhi < 0)) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const f = npv(mid);
    if (Math.abs(f) < 1e-9) { lo = hi = mid; break; }
    if (f * flo < 0) { hi = mid; fhi = f; } else { lo = mid; flo = f; }
  }
  const i = (lo + hi) / 2;
  return { monthly: i * 100, annual: (Math.pow(1 + i, 12) - 1) * 100, nominal: i * 1200 };
}

export function amortCsv(res: AmortResult, title: string) {
  const lines = [`# ${title}. Amounts in INR. Estimate only — lender schedules can differ.`, "Month,Opening balance,EMI,Interest,Principal,Prepayment,Prepayment fee,Closing balance"];
  for (const r of res.rows) lines.push([r.month, r.opening, r.emi, r.interest, r.principal, r.prepayment, r.fee, r.closing].map((v, k) => (k === 0 ? String(v) : (v as number).toFixed(2))).join(","));
  lines.push(`Total,,${res.totalEmiPaid.toFixed(2)},${res.totalInterest.toFixed(2)},,${res.totalPrepaid.toFixed(2)},${res.totalFees.toFixed(2)},`);
  return lines.join("\n");
}
