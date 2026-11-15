/**
 * Fixed deposit estimates.
 *
 * Cumulative (interest reinvested):  A = P × (1 + r/m)^(m·t)
 *   r = annual rate (decimal), m = compounding periods a year, t = years.
 *
 * Non-cumulative (interest paid out): interest isn't reinvested, so it earns
 * nothing further. Each payout = P × r ÷ f for payout frequency f. A final
 * part-period is paid pro rata as simple interest, P × r × (remaining years).
 * Some banks pay monthly-payout deposits a slightly lower, discounted amount;
 * this is noted on the page.
 *
 * Banks differ in day-count rules, how they treat broken periods, and rates by
 * tenure — these are estimates. Tax is never deducted unless the user turns on
 * the separately labelled estimate.
 */
import { parseNum } from "./discount";
import { growth } from "./compound";

export type FdFrequency = 12 | 4 | 2 | 1;
export type TenureUnit = "days" | "months" | "years";
export type FdType = "cumulative" | "payout";

export const FD_FREQUENCIES: { value: FdFrequency; label: string; per: string }[] = [
  { value: 12, label: "Monthly", per: "month" },
  { value: 4, label: "Quarterly", per: "quarter" },
  { value: 2, label: "Half-yearly", per: "half-year" },
  { value: 1, label: "Yearly", per: "year" },
];

export interface FdInput {
  principal: number;
  /** Annual rate in %, including any senior-citizen addition. */
  rate: number;
  years: number;
  compounding: FdFrequency;
  type: FdType;
  payout: FdFrequency;
}

export interface FdYear {
  year: number;
  to: number;
  interest: number;
  balance: number;
}

export interface FdResult {
  principal: number;
  interest: number;
  /** Cumulative: maturity amount. Payout: principal returned at maturity. */
  maturity: number;
  /** Principal + every payout (payout) or the maturity amount (cumulative). */
  totalReceived: number;
  effectiveAnnual: number;
  payoutAmount: number;
  payouts: number;
  brokenInterest: number;
  years: FdYear[];
}

export function fd(i: FdInput): FdResult {
  const r = i.rate / 100;
  const years: FdYear[] = [];
  if (i.type === "cumulative") {
    const at = (t: number) => i.principal * growth(i.rate, i.compounding, t);
    let prev = i.principal;
    for (let y = 1; y - 1 < i.years - 1e-9; y++) {
      const to = Math.min(y, i.years);
      const b = at(to);
      years.push({ year: y, to, interest: b - prev, balance: b });
      prev = b;
    }
    const maturity = at(i.years);
    return { principal: i.principal, interest: maturity - i.principal, maturity, totalReceived: maturity, effectiveAnnual: growth(i.rate, i.compounding, 1) - 1, payoutAmount: 0, payouts: 0, brokenInterest: 0, years };
  }
  const f = i.payout;
  const payoutAmount = (i.principal * r) / f;
  const payouts = Math.floor(i.years * f + 1e-9);
  const rem = Math.max(0, i.years - payouts / f);
  const brokenInterest = i.principal * r * rem;
  const interest = payoutAmount * payouts + brokenInterest;
  // Interest paid in each year: full payouts falling in the year plus any broken period.
  for (let y = 1; y - 1 < i.years - 1e-9; y++) {
    const to = Math.min(y, i.years);
    const paidBy = (t: number) => Math.floor(t * f + 1e-9) * payoutAmount + (t >= i.years - 1e-12 ? brokenInterest : 0);
    years.push({ year: y, to, interest: paidBy(to) - paidBy(y - 1), balance: i.principal });
  }
  return { principal: i.principal, interest, maturity: i.principal, totalReceived: i.principal + interest, effectiveAnnual: r, payoutAmount, payouts, brokenInterest, years };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface FdForm {
  principal: string;
  rate: string;
  tenure: string;
  unit: TenureUnit;
  compounding: FdFrequency;
  type: FdType;
  payout: FdFrequency;
  senior: boolean;
  seniorExtra: string;
  tds: boolean;
  tdsRate: string;
}

export const LIMITS = { maxPrincipal: 1e11, maxRate: 30, minDays: 7, maxYears: 30 };

export function fdFromForm(f: FdForm): Outcome<FdResult & { input: FdInput; tax: number | null; years: FdYear[] }> {
  const P = parseNum(f.principal);
  const R = parseNum(f.rate);
  const d = parseNum(f.tenure);
  if (P === null || R === null || d === null) return { status: "empty" };
  if (Number.isNaN(P) || P <= 0) return { status: "error", field: "principal", message: "Enter a deposit amount greater than 0." };
  if (P > LIMITS.maxPrincipal) return { status: "error", field: "principal", message: "That deposit is larger than this calculator supports." };
  if (Number.isNaN(R) || R < 0 || R > LIMITS.maxRate) return { status: "error", field: "rate", message: `Enter an interest rate from 0% to ${LIMITS.maxRate}% a year.` };
  if (Number.isNaN(d) || d <= 0) return { status: "error", field: "tenure", message: "Enter a tenure greater than 0." };
  let extra = 0;
  if (f.senior) {
    const e = parseNum(f.seniorExtra);
    if (e === null || Number.isNaN(e) || e < 0 || e > 5) return { status: "error", field: "seniorExtra", message: "Enter the senior-citizen extra rate from 0% to 5%." };
    extra = e;
  }
  const years = f.unit === "years" ? d : f.unit === "months" ? d / 12 : d / 365;
  if (f.unit === "days" && d < LIMITS.minDays) return { status: "error", field: "tenure", message: `FDs usually start at ${LIMITS.minDays} days.` };
  if (years > LIMITS.maxYears) return { status: "error", field: "tenure", message: `Tenures up to ${LIMITS.maxYears} years are supported.` };
  let tdsRate: number | null = null;
  if (f.tds) {
    const t = parseNum(f.tdsRate);
    if (t === null || Number.isNaN(t) || t < 0 || t > 50) return { status: "error", field: "tdsRate", message: "Enter a tax rate from 0% to 50% for the estimate." };
    tdsRate = t;
  }
  const input: FdInput = { principal: P, rate: R + extra, years, compounding: f.compounding, type: f.type, payout: f.payout };
  const result = fd(input);
  const notes: string[] = [];
  if (R === 0 && extra === 0) notes.push("At 0% interest the deposit earns nothing — you get back exactly what you put in.");
  if (f.type === "cumulative" && Math.abs(years * f.compounding - Math.round(years * f.compounding)) > 1e-9) notes.push("The tenure isn't a whole number of compounding periods. The last part-period uses the same compound formula; many banks pay simple interest for it, which can differ slightly.");
  if (f.type === "cumulative" && years < 0.5) notes.push("Many banks pay simple interest (no compounding) on deposits shorter than six months, which gives slightly less.");
  if (f.type === "payout" && result.brokenInterest > 0) notes.push("The tenure isn't a whole number of payout periods, so the final part-period's interest is paid pro rata.");
  if (f.type === "payout" && f.payout === 12) notes.push("Some banks pay monthly interest at a slightly discounted amount because their rate is quoted with quarterly compounding.");
  return { status: "ok", result: { ...result, input, tax: tdsRate === null ? null : (result.interest * tdsRate) / 100 }, notes };
}

export function fdCsv(r: FdResult, currency: string) {
  const payout = r.payouts > 0 || r.brokenInterest > 0;
  const rows = [`# Fixed deposit estimate in ${currency}. Banks' conventions differ; taxes not deducted.`, payout ? "Year,Interest paid this year,Principal held" : "Year,Interest this year,Balance at year end"];
  for (const y of r.years) rows.push([y.to === y.year ? y.year : `${y.year} (to ${+y.to.toFixed(4)} y)`, y.interest.toFixed(2), y.balance.toFixed(2)].join(","));
  return rows.join("\n") + "\n";
}
