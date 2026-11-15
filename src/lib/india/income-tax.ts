/**
 * Resident individual income tax for the supported tax years (rules in ./rules).
 *
 * 1. Salary income = gross salary − exempt allowances (old regime) − standard
 *    deduction − professional tax (old regime).
 * 2. House property: old regime sets off a loss up to ₹2,00,000; the new
 *    regime doesn't allow a loss to be set off against salary.
 * 3. Deductions: old regime — 80C (₹1.5 lakh), 80CCD(1B) (₹50,000), 80D and
 *    others as entered; both regimes — employer NPS up to 14% (new) or 10%
 *    (old) of basic + DA.
 * 4. Total income rounded to the nearest ₹10; slab tax; rebate (new regime:
 *    up to ₹60,000 if income ≤ ₹12 lakh, with marginal relief just above it;
 *    old regime: up to ₹12,500 if income ≤ ₹5 lakh); surcharge with marginal
 *    relief at each threshold; 4% cess; tax rounded to the nearest ₹10.
 * Special-rate income (capital gains, lottery) isn't supported.
 */
import { TAX_YEARS, type AgeBand, type Regime, type Slab, type TaxYearId } from "./rules";

export interface TaxInput {
  year: TaxYearId;
  regime: Regime;
  age: AgeBand;
  /** Gross salary for the year (all taxable components, before exemptions). */
  salary: number;
  /** Exempt allowances such as HRA — old regime only. */
  exemptAllowances: number;
  professionalTax: number;
  /** Income from house property; negative for a loss (e.g. home-loan interest on a self-occupied home). */
  houseProperty: number;
  otherIncome: number;
  d80C: number;
  d80D: number;
  d80CCD1B: number;
  otherDeductions: number;
  employerNps: number;
  /** Basic + DA for the employer-NPS limit. */
  basicDA: number;
}

export interface TaxBreakdown {
  regime: Regime;
  grossIncome: number;
  exemptions: number;
  standardDeduction: number;
  professionalTax: number;
  salaryIncome: number;
  houseProperty: number;
  otherIncome: number;
  grossTotalIncome: number;
  deductions: { label: string; amount: number }[];
  totalDeductions: number;
  taxableIncome: number;
  slabTax: number;
  slabs: { from: number; to: number | null; rate: number; tax: number }[];
  rebate: number;
  rebateMarginalRelief: number;
  taxAfterRebate: number;
  surchargeRate: number;
  surcharge: number;
  surchargeMarginalRelief: number;
  cess: number;
  totalTax: number;
  effectiveRate: number; // % of gross income
  monthly: number;
  notes: string[];
}

export const round10 = (n: number) => Math.round(n / 10) * 10;

export function slabTax(income: number, slabs: Slab[]) {
  let prev = 0;
  let tax = 0;
  const rows: TaxBreakdown["slabs"] = [];
  for (const s of slabs) {
    const top = s.upTo ?? Infinity;
    const part = Math.max(0, Math.min(income, top) - prev);
    const t = (part * s.rate) / 100;
    rows.push({ from: prev, to: s.upTo, rate: s.rate, tax: t });
    tax += t;
    prev = top;
    if (income <= top) break;
  }
  return { tax, rows };
}

export function computeTax(i: TaxInput): TaxBreakdown {
  const Y = TAX_YEARS[i.year];
  const old = i.regime === "old";
  const R = old ? Y.oldRegime : Y.newRegime;
  const notes: string[] = [];
  const exemptions = old ? Math.min(i.exemptAllowances, i.salary) : 0;
  if (!old && i.exemptAllowances > 0) notes.push("HRA and similar allowance exemptions aren't available in the new regime, so they're ignored here.");
  const afterExempt = i.salary - exemptions;
  const standardDeduction = Math.min(R.standardDeduction, Math.max(0, afterExempt));
  const pt = old ? Math.min(i.professionalTax, Math.max(0, afterExempt - standardDeduction)) : 0;
  if (!old && i.professionalTax > 0) notes.push("Professional tax isn't deductible in the new regime.");
  const salaryIncome = Math.max(0, afterExempt - standardDeduction - pt);
  let hp = i.houseProperty;
  if (hp < 0) {
    if (old) {
      if (hp < -Y.oldRegime.deductionCaps.selfOccupiedInterest) notes.push("A house-property loss can be set off against other income only up to ₹2,00,000 a year; the rest is carried forward.");
      hp = Math.max(hp, -Y.oldRegime.deductionCaps.selfOccupiedInterest);
    } else {
      notes.push("In the new regime a house-property loss can't be set off against salary, so it's taken as zero.");
      hp = 0;
    }
  }
  const grossTotalIncome = Math.max(0, salaryIncome + hp + i.otherIncome);

  const deductions: { label: string; amount: number }[] = [];
  const npsCap = (i.basicDA * R.employerNpsPct) / 100;
  const nps = Math.min(i.employerNps, npsCap);
  if (i.employerNps > npsCap + 0.5) notes.push(`Employer NPS is deductible up to ${R.employerNpsPct}% of basic + DA (₹${Math.round(npsCap).toLocaleString("en-IN")}).`);
  if (nps > 0) deductions.push({ label: `Employer NPS contribution (up to ${R.employerNpsPct}% of basic + DA)`, amount: nps });
  if (old) {
    const c = Math.min(i.d80C, Y.oldRegime.deductionCaps.c80);
    if (c > 0) deductions.push({ label: "80C — PF, PPF, ELSS, life insurance, etc. (max ₹1.5 lakh)", amount: c });
    const b = Math.min(i.d80CCD1B, Y.oldRegime.deductionCaps.ccd1b);
    if (b > 0) deductions.push({ label: "80CCD(1B) — own NPS contribution (max ₹50,000)", amount: b });
    if (i.d80D > 0) deductions.push({ label: "80D — health insurance", amount: i.d80D });
    if (i.otherDeductions > 0) deductions.push({ label: "Other eligible deductions", amount: i.otherDeductions });
  } else if (i.d80C + i.d80D + i.d80CCD1B + i.otherDeductions > 0) notes.push("80C, 80D, 80CCD(1B) and most other deductions aren't available in the new regime.");
  const totalDeductions = Math.min(grossTotalIncome, deductions.reduce((a, d) => a + d.amount, 0));
  const taxableIncome = round10(Math.max(0, grossTotalIncome - totalDeductions));

  const slabs = old ? Y.oldRegime.slabs[i.age] : Y.newRegime.slabs;
  const { tax, rows } = slabTax(taxableIncome, slabs);
  let rebate = 0;
  let rebateMR = 0;
  if (taxableIncome <= R.rebate.incomeLimit) rebate = Math.min(tax, R.rebate.max);
  else if (!old && Y.newRegime.rebate.marginalRelief && tax > taxableIncome - R.rebate.incomeLimit) rebateMR = tax - (taxableIncome - R.rebate.incomeLimit);
  const afterRebate = tax - rebate - rebateMR;

  // Surcharge with marginal relief at each threshold.
  const table = old ? Y.surcharge.old : Y.surcharge.new;
  let surchargeRate = 0;
  let surcharge = 0;
  let surchargeMR = 0;
  const band = [...table].reverse().find((b) => taxableIncome > b.above);
  if (band) {
    surchargeRate = band.rate;
    surcharge = (afterRebate * band.rate) / 100;
    const prevRate = [...table].reverse().find((b) => band.above > b.above)?.rate ?? 0;
    const atThreshold = slabTax(band.above, slabs).tax;
    const limit = atThreshold * (1 + prevRate / 100) + (taxableIncome - band.above);
    if (afterRebate + surcharge > limit) {
      surchargeMR = afterRebate + surcharge - limit;
      surcharge -= surchargeMR;
    }
  }
  const cess = ((afterRebate + surcharge) * Y.cess) / 100;
  const totalTax = round10(afterRebate + surcharge + cess);
  const grossIncome = i.salary + Math.max(0, i.houseProperty) + i.otherIncome;
  return {
    regime: i.regime,
    grossIncome,
    exemptions,
    standardDeduction,
    professionalTax: pt,
    salaryIncome,
    houseProperty: hp,
    otherIncome: i.otherIncome,
    grossTotalIncome,
    deductions,
    totalDeductions,
    taxableIncome,
    slabTax: tax,
    slabs: rows,
    rebate,
    rebateMarginalRelief: rebateMR,
    taxAfterRebate: afterRebate,
    surchargeRate,
    surcharge,
    surchargeMarginalRelief: surchargeMR,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
    monthly: totalTax / 12,
    notes,
  };
}

export const EMPTY_TAX_INPUT: Omit<TaxInput, "year" | "regime" | "age" | "salary"> = {
  exemptAllowances: 0,
  professionalTax: 0,
  houseProperty: 0,
  otherIncome: 0,
  d80C: 0,
  d80D: 0,
  d80CCD1B: 0,
  otherDeductions: 0,
  employerNps: 0,
  basicDA: 0,
};
