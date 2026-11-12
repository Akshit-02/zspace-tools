/**
 * Reducing-balance loan maths.
 *
 *   EMI = P × r × (1 + r)^n / ((1 + r)^n − 1),   r = annual nominal rate ÷ 12 ÷ 100
 *
 * Convention: monthly compounding on the nominal annual rate (the usual
 * convention for Indian retail loans and most EMI calculators). The EMI is
 * rounded to the nearest paisa/cent; each month's interest is rounded to the
 * paisa; the final instalment absorbs any rounding so the balance ends at 0.
 * Money is handled in integer minor units (paise) to avoid float drift.
 */

export interface LoanInput {
  principal: number;
  annualRate: number;
  months: number;
}

export interface Row {
  month: number;
  opening: number;
  emi: number;
  interest: number;
  principal: number;
  prepayment: number;
  closing: number;
}

export interface Schedule {
  emi: number;
  rows: Row[];
  totalInterest: number;
  totalPaid: number;
  totalPrepaid: number;
  months: number;
}

export interface Prepayment {
  /** Extra amount paid every month, starting from `monthlyFrom`. */
  monthly: number;
  monthlyFrom: number;
  /** One-time lump sum paid with instalment `lumpMonth`. */
  lump: number;
  lumpMonth: number;
}

const toMinor = (v: number) => Math.round(v * 100);
const fromMinor = (v: number) => v / 100;

export function validateLoan(p: number, rate: number, months: number): string | null {
  if (!Number.isFinite(p) || p <= 0) return "Enter a loan amount greater than zero.";
  if (p > 1e12) return "That loan amount is too large to calculate reliably.";
  if (!Number.isFinite(rate) || rate < 0) return "The interest rate can't be negative.";
  if (rate > 100) return "An annual rate above 100% isn't realistic — check the rate.";
  if (!Number.isFinite(months) || months < 1) return "The tenure must be at least one month.";
  if (!Number.isInteger(months)) return "Use a whole number of months.";
  if (months > 600) return "Tenures longer than 50 years aren't supported.";
  return null;
}

/** Exact (unrounded) EMI. Zero interest is handled separately to avoid 0/0. */
export function emiExact({ principal, annualRate, months }: LoanInput) {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export function emi(input: LoanInput) {
  return fromMinor(toMinor(emiExact(input)));
}

export function buildSchedule(input: LoanInput, pre: Prepayment = { monthly: 0, monthlyFrom: 1, lump: 0, lumpMonth: 1 }): Schedule {
  const r = input.annualRate / 12 / 100;
  const emiMinor = toMinor(emiExact(input));
  let balance = toMinor(input.principal);
  const rows: Row[] = [];
  let totalInterest = 0;
  let totalPaid = 0;
  let totalPrepaid = 0;
  for (let m = 1; balance > 0 && m <= input.months + 1; m++) {
    const interest = Math.round(balance * r);
    let principalPart = emiMinor - interest;
    let payment = emiMinor;
    // Last instalment (or any time the EMI would overpay): clear the balance exactly.
    if (principalPart >= balance || m >= input.months) {
      principalPart = balance;
      payment = balance + interest;
    }
    let after = balance - principalPart;
    let extra = 0;
    if (after > 0) {
      if (pre.monthly > 0 && m >= pre.monthlyFrom) extra += toMinor(pre.monthly);
      if (pre.lump > 0 && m === pre.lumpMonth) extra += toMinor(pre.lump);
      extra = Math.min(extra, after);
      after -= extra;
    }
    rows.push({
      month: m,
      opening: fromMinor(balance),
      emi: fromMinor(payment),
      interest: fromMinor(interest),
      principal: fromMinor(principalPart),
      prepayment: fromMinor(extra),
      closing: fromMinor(after),
    });
    totalInterest += interest;
    totalPaid += payment + extra;
    totalPrepaid += extra;
    balance = after;
  }
  return {
    emi: fromMinor(emiMinor),
    rows,
    totalInterest: fromMinor(totalInterest),
    totalPaid: fromMinor(totalPaid),
    totalPrepaid: fromMinor(totalPrepaid),
    months: rows.length,
  };
}

export interface YearRow {
  year: number;
  principal: number;
  interest: number;
  prepayment: number;
  closing: number;
}

export function yearly(rows: Row[]): YearRow[] {
  const out: YearRow[] = [];
  for (const row of rows) {
    const y = Math.ceil(row.month / 12);
    let cur = out[y - 1];
    if (!cur) cur = out[y - 1] = { year: y, principal: 0, interest: 0, prepayment: 0, closing: 0 };
    cur.principal = fromMinor(toMinor(cur.principal) + toMinor(row.principal));
    cur.interest = fromMinor(toMinor(cur.interest) + toMinor(row.interest));
    cur.prepayment = fromMinor(toMinor(cur.prepayment) + toMinor(row.prepayment));
    cur.closing = row.closing;
  }
  return out;
}

export function scheduleCsv(s: Schedule, currency: string) {
  const head = ["Month", "Opening balance", "EMI", "Principal", "Interest", "Prepayment", "Closing balance"];
  const lines = [`# Amounts in ${currency}. Estimate only — lender schedules can differ.`, head.join(",")];
  for (const r of s.rows) lines.push([String(r.month), ...[r.opening, r.emi, r.principal, r.interest, r.prepayment, r.closing].map((v) => v.toFixed(2))].join(","));
  lines.push(["Total", "", "", "", s.totalInterest.toFixed(2), s.totalPrepaid.toFixed(2), ""].join(","));
  return lines.join("\n");
}

export const CURRENCIES = [
  { code: "INR", locale: "en-IN", label: "₹ INR" },
  { code: "USD", locale: "en-US", label: "$ USD" },
  { code: "GBP", locale: "en-GB", label: "£ GBP" },
  { code: "EUR", locale: "en-IE", label: "€ EUR" },
  { code: "AED", locale: "en-AE", label: "AED" },
  { code: "SGD", locale: "en-SG", label: "S$ SGD" },
  { code: "AUD", locale: "en-AU", label: "A$ AUD" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export function money(code: CurrencyCode, digits = 2) {
  const c = CURRENCIES.find((x) => x.code === code)!;
  const f = new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code, minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (v: number) => f.format(Number.isFinite(v) ? v : 0);
}

/** Example loan types: they set a typical amount and tenure only — never a rate. */
export const LOAN_TYPES = [
  { id: "home", label: "Home loan", amount: 5_000_000, years: 20 },
  { id: "personal", label: "Personal loan", amount: 500_000, years: 3 },
  { id: "car", label: "Car loan", amount: 800_000, years: 5 },
  { id: "business", label: "Business loan", amount: 2_000_000, years: 5 },
  { id: "education", label: "Education loan", amount: 1_500_000, years: 7 },
] as const;
