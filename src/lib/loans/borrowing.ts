/**
 * Borrowing engines: home-loan eligibility (FOIR + LTV), affordability,
 * debt-to-income and the all-in cost of a loan with fees.
 *
 * FOIR (fixed obligations to income ratio) and affordability percentages are
 * lender or personal assumptions, never statutory rules — the UI always lets
 * the user change them. LTV limits come from ./ltv-rules.
 */
import { emiExact } from "../emi";
import { effectiveAnnualRate, principalFromEmi } from "./amortise";
import { LTV_RULES } from "./ltv-rules";

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ================================================================== */
/* LTV                                                                 */
/* ================================================================== */

/** LTV cap (%) for a housing loan of a given size. */
export function ltvCapFor(loan: number) {
  for (const b of LTV_RULES.bands) if (b.upTo === null || loan <= b.upTo) return b.maxPct;
  return LTV_RULES.bands[LTV_RULES.bands.length - 1].maxPct;
}

/**
 * Largest loan the LTV rules allow on a property of value `value`. The cap
 * depends on the loan size, so each band is tried: within a band the loan is
 * at most band% × value and at most the band's upper limit.
 */
export function maxLoanByLtv(value: number) {
  let best = 0;
  let lower = 0;
  for (const b of LTV_RULES.bands) {
    const cap = (value * b.maxPct) / 100;
    const inBand = b.upTo === null ? cap : Math.min(cap, b.upTo);
    if (inBand > lower && inBand > best) best = inBand;
    if (b.upTo !== null) lower = b.upTo;
  }
  return best;
}

/* ================================================================== */
/* Home-loan eligibility                                               */
/* ================================================================== */

export interface EligibilityInput {
  income: number; // applicant net monthly income
  otherIncome: number;
  existingEmi: number;
  obligations: number; // other fixed monthly obligations counted by lenders
  coIncome: number;
  coEmi: number;
  age: number;
  retireAge: number;
  tenureYears: number; // preferred
  rate: number;
  foirPct: number;
  propertyValue: number;
  downPayment: number;
  maxTenureYears: number; // lender's longest tenure, an assumption
}

export function homeLoanEligibility(i: EligibilityInput) {
  const totalIncome = i.income + i.otherIncome + i.coIncome;
  // Each applicant's obligations are counted once, against the combined income.
  const obligations = i.existingEmi + i.obligations + i.coEmi;
  const foirLimit = (totalIncome * i.foirPct) / 100;
  const eligibleEmi = Math.max(0, foirLimit - obligations);
  const yearsToRetire = Math.max(0, i.retireAge - i.age);
  const maxTenure = Math.min(i.maxTenureYears, yearsToRetire);
  const tenure = Math.min(i.tenureYears, maxTenure);
  const months = Math.round(tenure * 12);
  const byCapacity = months > 0 ? principalFromEmi(eligibleEmi, i.rate, months) : 0;
  const byLtv = maxLoanByLtv(i.propertyValue);
  const byDownPayment = Math.max(0, i.propertyValue - i.downPayment);
  const limits = [
    { key: "capacity" as const, label: "Repayment capacity (FOIR)", amount: byCapacity },
    { key: "ltv" as const, label: "Loan-to-value limit on the property", amount: byLtv },
    { key: "downPayment" as const, label: "Property value minus your down payment", amount: byDownPayment },
  ];
  const binding = limits.reduce((a, b) => (b.amount < a.amount ? b : a));
  const loan = Math.max(0, Math.floor(binding.amount / 100) * 100);
  const emi = months > 0 && loan > 0 ? emiExact({ principal: loan, annualRate: i.rate, months }) : 0;
  const totalRepayment = emi * months;
  const ownContribution = Math.max(0, i.propertyValue - loan);
  return {
    totalIncome,
    obligations,
    foirLimit,
    eligibleEmi,
    yearsToRetire,
    maxTenure,
    tenure,
    months,
    limits,
    binding: binding.key,
    loan,
    emi: round2(emi),
    totalRepayment,
    totalInterest: totalRepayment - loan,
    ownContribution,
    ltvPct: i.propertyValue > 0 ? (loan / i.propertyValue) * 100 : 0,
    ltvCap: ltvCapFor(loan),
    foirUsed: totalIncome > 0 ? ((obligations + emi) / totalIncome) * 100 : 0,
  };
}

/* ================================================================== */
/* Debt-to-income                                                      */
/* ================================================================== */

export interface DtiInput {
  gross: number;
  net: number;
  otherIncome: number;
  housing: number; // home-loan EMI or rent counted as housing cost
  debts: number; // all other debt payments (car, personal, education, cards, other)
  proposed: number;
  target: number; // %
}

export function dti(i: DtiInput) {
  const grossTotal = i.gross + i.otherIncome;
  const netTotal = i.net + i.otherIncome;
  const debt = i.housing + i.debts;
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : null);
  const after = debt + i.proposed;
  return {
    grossTotal,
    netTotal,
    debt,
    after,
    frontEnd: pct(i.housing, grossTotal),
    backEnd: pct(debt, grossTotal),
    netRatio: pct(debt, netTotal),
    proposedBackEnd: pct(after, grossTotal),
    proposedNet: pct(after, netTotal),
    remaining: netTotal - debt,
    remainingAfter: netTotal - after,
    /** Extra EMI possible before back-end DTI (gross) reaches the target. */
    headroom: Math.max(0, (grossTotal * i.target) / 100 - debt),
  };
}

/* ================================================================== */
/* Affordability                                                       */
/* ================================================================== */

export interface AffordInput {
  income: number;
  otherIncome: number;
  expenses: number;
  existingEmi: number;
  cards: number;
  otherObligations: number;
  savings: number;
  rate: number;
  months: number;
  scenarios: { label: string; pct: number }[];
}

export function affordability(i: AffordInput) {
  const income = i.income + i.otherIncome;
  const debt = i.existingEmi + i.cards;
  const outgo = i.expenses + debt + i.otherObligations;
  const surplus = income - outgo;
  const essentialMonths = i.expenses + i.otherObligations + debt;
  const scenarios = i.scenarios.map((s) => {
    // EMI limit: the chosen share of income for ALL debt repayments, less existing debt,
    // and never more than the monthly surplus.
    const byPct = Math.max(0, (income * s.pct) / 100 - debt);
    const emi = Math.max(0, Math.min(byPct, surplus));
    const loan = principalFromEmi(emi, i.rate, i.months);
    return { ...s, emi, loan, limitedBySurplus: surplus < byPct, leftover: surplus - emi, dtiAfter: income > 0 ? ((debt + emi) / income) * 100 : null };
  });
  return {
    income,
    debt,
    outgo,
    surplus,
    dtiNow: income > 0 ? (debt / income) * 100 : null,
    emergencyMonths: essentialMonths > 0 ? i.savings / essentialMonths : null,
    scenarios,
  };
}

/* ================================================================== */
/* Loan cost with fees (car and personal loans)                        */
/* ================================================================== */

export interface LoanCostInput {
  principal: number;
  rate: number;
  months: number;
  /** Processing fee: % of principal, or a fixed amount. */
  feePct: number;
  feeFixed: number;
  gstPct: number; // on the processing fee
  /** Other upfront charges deducted from the disbursal (insurance, documentation…). */
  otherCharges: number;
  /** Whether fees are deducted from the disbursed amount (true) or paid separately. */
  deducted: boolean;
}

export function loanCost(i: LoanCostInput) {
  const emi = round2(emiExact({ principal: i.principal, annualRate: i.rate, months: i.months }));
  const fee = (i.principal * i.feePct) / 100 + i.feeFixed;
  const gst = (fee * i.gstPct) / 100;
  const upfront = fee + gst + i.otherCharges;
  const totalRepayment = emi * i.months;
  const net = i.principal - (i.deducted ? upfront : 0);
  // Cash flows from the borrower's side: money received today, EMIs out each month.
  const flows = [i.deducted ? net : i.principal - upfront, ...Array(i.months).fill(-emi)];
  const apr = upfront > 0 || i.rate > 0 ? effectiveAnnualRate(flows) : { monthly: 0, annual: 0, nominal: 0 };
  return {
    emi,
    fee,
    gst,
    upfront,
    net,
    totalInterest: totalRepayment - i.principal,
    totalRepayment,
    totalCost: totalRepayment - i.principal + upfront,
    apr,
  };
}
