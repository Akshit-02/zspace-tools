/**
 * NPS projection, non-salary TDS, salary-hike maths and CTC → take-home.
 * Statutory values come from ./rules; income tax from ./income-tax.
 */
import { computeTax, type TaxBreakdown } from "./income-tax";
import { EPF_RULES, ESI_RULES, NPS_EXIT, TDS_NO_PAN, TDS_RULES, TAX_YEARS, type AgeBand, type NpsExit, type NpsSector, type Regime, type TaxYearId, type TdsCategory } from "./rules";
import { epfMonth, esiMonth, hraExemption } from "./payroll";

/* ================================================================== */
/* NPS                                                                 */
/* ================================================================== */

export interface NpsInput {
  age: number;
  exitAge: number;
  monthly: number;
  stepUp: number;
  balance: number;
  returnPct: number; // effective annual
  sector: NpsSector;
  exit: NpsExit;
  annuityPct: number; // chosen share for annuity
  annuityRate: number; // % a year
}

export function projectNps(i: NpsInput) {
  const q = Math.pow(1 + i.returnPct / 100, 1 / 12) - 1;
  const months = Math.max(0, (i.exitAge - i.age) * 12);
  let bal = i.balance;
  let contributed = 0;
  const years: { age: number; contributed: number; balance: number }[] = [];
  for (let k = 0; k < months; k++) {
    const c = i.monthly * Math.pow(1 + i.stepUp / 100, Math.floor(k / 12));
    bal = (bal + c) * (1 + q);
    contributed += c;
    if ((k + 1) % 12 === 0) years.push({ age: i.age + (k + 1) / 12, contributed, balance: bal });
  }
  const rule = NPS_EXIT[i.sector][i.exit];
  const fullAllowed = bal <= rule.fullWithdrawalUpTo;
  const minAnnuity = fullAllowed ? 0 : rule.minAnnuityPct;
  const annuityPct = Math.max(minAnnuity, Math.min(100, i.annuityPct));
  const annuityAmount = (bal * annuityPct) / 100;
  return {
    corpus: bal,
    contributed,
    existingBalance: i.balance,
    growth: bal - contributed - i.balance,
    rule,
    fullAllowed,
    minAnnuity,
    annuityPct,
    annuityAmount,
    lumpSum: bal - annuityAmount,
    monthlyPension: (annuityAmount * i.annuityRate) / 1200,
    years,
  };
}

/* ================================================================== */
/* TDS (non-salary)                                                    */
/* ================================================================== */

export interface TdsInput {
  year: TaxYearId;
  category: TdsCategory;
  /** This payment. */
  amount: number;
  /** Earlier payments to the same payee this financial/tax year. */
  paidSoFar: number;
  /** Months covered by a rent payment (threshold is per month or part of a month). */
  rentMonths: number;
  senior: boolean;
  pan: boolean;
}

export function tdsOnPayment(i: TdsInput) {
  const R = TDS_RULES[i.category];
  let applies: boolean;
  let thresholdText: string;
  let base = i.amount;
  if (R.thresholdBasis === "month") {
    const perMonth = i.amount / Math.max(1, i.rentMonths);
    applies = perMonth > R.threshold;
    thresholdText = `₹${R.threshold.toLocaleString("en-IN")} per month or part of a month`;
  } else if (R.thresholdBasis === "single") {
    const agg = R.aggregate ?? Infinity;
    const crossesAggregate = i.paidSoFar <= agg && i.paidSoFar + i.amount > agg;
    applies = i.amount > R.threshold || i.paidSoFar + i.amount > agg;
    thresholdText = `₹${R.threshold.toLocaleString("en-IN")} for a single payment, or ₹${(R.aggregate ?? 0).toLocaleString("en-IN")} in the year`;
    // The payment that takes the year's total over the aggregate limit also carries TDS on the earlier
    // payments (assumed untaxed because each was within the single-payment limit).
    if (crossesAggregate) base = i.paidSoFar + i.amount;
  } else {
    const limit = i.senior && R.seniorThreshold ? R.seniorThreshold : R.threshold;
    applies = i.paidSoFar + i.amount > limit;
    thresholdText = `₹${limit.toLocaleString("en-IN")} in the year${R.seniorThreshold ? (i.senior ? " (senior citizen)" : ` (₹${R.seniorThreshold.toLocaleString("en-IN")} for senior citizens)`) : ""}`;
    // The payment that crosses the limit carries TDS on the whole year's amount so far.
    if (applies && i.paidSoFar <= limit) base = i.paidSoFar + i.amount;
  }
  const rate = applies ? (i.pan ? R.rate : Math.max(R.rate, TDS_NO_PAN.rate)) : 0;
  const tds = Math.round((base * rate) / 100);
  return { rule: R, applies, thresholdText, base, rate, tds, net: i.amount - tds, section: R.section[i.year], noPanSection: TDS_NO_PAN.section[i.year] };
}

/* ================================================================== */
/* Salary hike                                                         */
/* ================================================================== */

export const hikePct = (current: number, next: number) => ((next - current) / current) * 100;
export const applyHike = (current: number, pct: number) => current * (1 + pct / 100);
/** Real (inflation-adjusted) hike: (1 + hike) ÷ (1 + inflation) − 1. */
export const realHike = (pct: number, inflation: number) => ((1 + pct / 100) / (1 + inflation / 100) - 1) * 100;

/* ================================================================== */
/* CTC → take-home                                                     */
/* ================================================================== */

export interface SalaryInput {
  year: TaxYearId;
  regime: Regime;
  age: AgeBand;
  /** Annual amounts. */
  basic: number;
  da: number;
  hra: number;
  special: number;
  otherAllowances: number;
  variable: number;
  /** Employer contributions that are part of CTC. */
  employerPfBasis: "ceiling" | "actual" | "none";
  employerNpsPct: number;
  includeGratuity: boolean;
  /** Employee deductions. */
  professionalTax: number; // annual
  otherDeductions: number; // annual (e.g. canteen, insurance)
  /** Old regime only. */
  rentMonthly: number;
  metro: boolean;
  d80COther: number;
}

export const GRATUITY_PROVISION_PCT = (15 / 26 / 12) * 100; // 4.8077% of basic + DA a year

export function takeHome(i: SalaryInput) {
  const basicDA = i.basic + i.da;
  const monthlyBasicDA = basicDA / 12;
  const fixedGross = basicDA + i.hra + i.special + i.otherAllowances;
  // PF: employee and employer at 12% on the chosen basis.
  const pfM = i.employerPfBasis === "none" ? null : epfMonth(monthlyBasicDA, { basis: i.employerPfBasis, employeePct: EPF_RULES.employeePct, employerPct: EPF_RULES.employerPct, epsMember: true, vpfPct: 0 }, 30);
  const employerPf = pfM ? pfM.employerTotal * 12 : 0;
  const employeePf = pfM ? pfM.employee * 12 : 0;
  const employerNps = (basicDA * i.employerNpsPct) / 100;
  const gratuity = i.includeGratuity ? (basicDA * GRATUITY_PROVISION_PCT) / 100 : 0;
  const ctc = fixedGross + i.variable + employerPf + employerNps + gratuity;
  // ESI on monthly gross wages (fixed), if within the ceiling.
  const monthlyGross = fixedGross / 12;
  const esiCovered = monthlyGross <= ESI_RULES.wageCeiling;
  const esi = esiCovered ? esiMonth(monthlyGross, true) : null;
  const employeeEsi = esi ? esi.employee * 12 : 0;
  const employerEsi = esi ? esi.employer * 12 : 0;
  // HRA exemption (old regime only), on yearly figures.
  const hraExempt = i.regime === "old" && i.rentMonthly > 0 ? hraExemption([{ salary: basicDA, hra: i.hra, rent: i.rentMonthly * 12, metro: i.metro }], i.year).exempt : 0;
  const tax: TaxBreakdown = computeTax({
    year: i.year,
    regime: i.regime,
    age: i.age,
    salary: fixedGross + i.variable,
    exemptAllowances: hraExempt,
    professionalTax: i.professionalTax,
    houseProperty: 0,
    otherIncome: 0,
    // PF and other 80C items only matter (and are only claimed) in the old regime.
    d80C: i.regime === "old" ? employeePf + i.d80COther : 0,
    d80D: 0,
    d80CCD1B: 0,
    otherDeductions: 0,
    employerNps,
    basicDA,
  });
  const employeeDeductions = employeePf + employeeEsi + i.professionalTax + i.otherDeductions;
  const annualInHand = fixedGross + i.variable - employeeDeductions - tax.totalTax;
  const monthlyTax = tax.totalTax / 12;
  const monthlyInHandFixed = (fixedGross - employeeDeductions) / 12 - monthlyTax;
  return {
    ctc,
    fixedGross,
    grossWithVariable: fixedGross + i.variable,
    employerPf,
    employerNps,
    employerEsi,
    gratuity,
    employeePf,
    employeeEsi,
    professionalTax: i.professionalTax,
    otherDeductions: i.otherDeductions,
    esiCovered,
    hraExempt,
    tax,
    employeeDeductions,
    annualInHand,
    monthlyInHandFixed,
    monthlyTax,
    yearLabel: TAX_YEARS[i.year].short,
  };
}

/* ================================================================== */
/* CTC → components (CTC mode)                                         */
/* ================================================================== */

export interface CtcSplit {
  ctc: number;
  basicPct: number; // % of CTC
  hraPct: number; // % of basic
  variable: number;
  otherAllowances: number;
  employerPfBasis: "ceiling" | "actual" | "none";
  employerNpsPct: number;
  includeGratuity: boolean;
}

/**
 * Splits a CTC into salary components. Employer PF, employer NPS and the
 * gratuity provision are carved out of the CTC first; the special allowance
 * is whatever remains, so the parts always add back to the CTC exactly.
 */
export function splitCtc(c: CtcSplit): { basic: number; hra: number; special: number; employerPf: number; employerNps: number; gratuity: number } | { error: string } {
  const basic = (c.ctc * c.basicPct) / 100;
  const hra = (basic * c.hraPct) / 100;
  const m = c.employerPfBasis === "none" ? null : epfMonth(basic / 12, { basis: c.employerPfBasis, employeePct: EPF_RULES.employeePct, employerPct: EPF_RULES.employerPct, epsMember: true, vpfPct: 0 }, 30);
  const employerPf = m ? m.employerTotal * 12 : 0;
  const employerNps = (basic * c.employerNpsPct) / 100;
  const gratuity = c.includeGratuity ? (basic * GRATUITY_PROVISION_PCT) / 100 : 0;
  const special = c.ctc - basic - hra - c.variable - c.otherAllowances - employerPf - employerNps - gratuity;
  if (special < -0.5) return { error: "Basic, HRA, variable pay and employer contributions add up to more than the CTC. Lower the basic % or variable pay." };
  return { basic, hra, special: Math.max(0, special), employerPf, employerNps, gratuity };
}
