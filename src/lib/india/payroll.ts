/**
 * EPF, ESI, gratuity, leave encashment and HRA engines. All rates and limits
 * come from ./rules; nothing here is hard-coded.
 */
import { EPF_RULES, ESI_RULES, GRATUITY_RULES, HRA_RULES, LEAVE_RULES, type TaxYearId } from "./rules";

/* ================================================================== */
/* EPF                                                                 */
/* ================================================================== */

export interface EpfInput {
  /** Basic + DA per month now. */
  wages: number;
  age: number;
  retireAge: number;
  balance: number;
  /** Contributions on the statutory ceiling (₹15,000) or on actual wages. */
  basis: "ceiling" | "actual";
  employeePct: number;
  employerPct: number;
  /** EPS member: joined EPF before 1 Sep 2014, or wages were ≤ ₹15,000 when joining. */
  epsMember: boolean;
  vpfPct: number;
  salaryGrowth: number;
  interest: number;
}

export interface EpfMonth {
  wageBase: number;
  employee: number;
  vpf: number;
  employerTotal: number;
  eps: number;
  employerEpf: number;
}

/** One month's split. EPS = 8.33% of wages up to the ceiling (max ₹1,250), only for EPS members under 58. */
export function epfMonth(wages: number, i: Pick<EpfInput, "basis" | "employeePct" | "employerPct" | "epsMember" | "vpfPct">, age: number): EpfMonth {
  const base = i.basis === "ceiling" ? Math.min(wages, EPF_RULES.wageCeiling) : wages;
  const employee = Math.round((base * i.employeePct) / 100);
  const employerTotal = Math.round((base * i.employerPct) / 100);
  const eps = i.epsMember && age < EPF_RULES.epsExitAge ? Math.min(Math.round((Math.min(wages, EPF_RULES.wageCeiling) * EPF_RULES.epsPct) / 100), EPF_RULES.epsMax, employerTotal) : 0;
  const vpf = Math.round((wages * i.vpfPct) / 100);
  return { wageBase: base, employee, vpf, employerTotal, eps, employerEpf: employerTotal - eps };
}

export interface EpfYear {
  year: number;
  age: number;
  wages: number;
  employee: number;
  employerEpf: number;
  eps: number;
  interest: number;
  balance: number;
}

/**
 * Month-by-month projection. Contributions are credited monthly; interest is
 * rate/12 on each month's closing balance (the monthly running balance) and
 * added once every 12 months, like EPFO's yearly credit.
 */
export function projectEpf(i: EpfInput) {
  const months = Math.max(0, (i.retireAge - i.age) * 12);
  let bal = i.balance;
  let accrued = 0;
  const years: EpfYear[] = [];
  let wages = i.wages;
  let t = { employee: 0, employerEpf: 0, eps: 0, interest: 0 };
  let y = { employee: 0, employerEpf: 0, eps: 0, interest: 0 };
  for (let k = 0; k < months; k++) {
    if (k > 0 && k % 12 === 0) wages *= 1 + i.salaryGrowth / 100;
    const age = i.age + Math.floor(k / 12);
    const m = epfMonth(wages, i, age);
    const add = m.employee + m.vpf + m.employerEpf;
    bal += add;
    accrued += (bal * i.interest) / 1200;
    y.employee += m.employee + m.vpf;
    y.employerEpf += m.employerEpf;
    y.eps += m.eps;
    if ((k + 1) % 12 === 0 || k === months - 1) {
      bal += accrued;
      y.interest = accrued;
      accrued = 0;
      years.push({ year: years.length + 1, age: i.age + Math.ceil((k + 1) / 12), wages, ...y, balance: bal });
      t = { employee: t.employee + y.employee, employerEpf: t.employerEpf + y.employerEpf, eps: t.eps + y.eps, interest: t.interest + y.interest };
      y = { employee: 0, employerEpf: 0, eps: 0, interest: 0 };
    }
  }
  return { first: epfMonth(i.wages, i, i.age), years, corpus: bal, totalEmployee: t.employee, totalEmployerEpf: t.employerEpf, totalEps: t.eps, totalInterest: t.interest };
}

/* ================================================================== */
/* ESI                                                                 */
/* ================================================================== */

export interface EsiResult {
  covered: boolean;
  ceiling: number;
  employee: number;
  employer: number;
  total: number;
  reason: string;
}

/** Shares are rounded up to the next whole rupee. Coverage is decided at the start of each contribution period. */
export function esiMonth(wages: number, coveredForPeriod: boolean, disabled = false): EsiResult {
  const ceiling = disabled ? ESI_RULES.wageCeilingDisabled : ESI_RULES.wageCeiling;
  if (!coveredForPeriod) return { covered: false, ceiling, employee: 0, employer: 0, total: 0, reason: `Wages were above ₹${ceiling.toLocaleString("en-IN")} at the start of the contribution period, so ESI doesn't apply.` };
  const employee = Math.ceil((wages * ESI_RULES.employeePct) / 100 - 1e-9);
  const employer = Math.ceil((wages * ESI_RULES.employerPct) / 100 - 1e-9);
  return { covered: true, ceiling, employee, employer, total: employee + employer, reason: wages > ceiling ? `Wages rose above ₹${ceiling.toLocaleString("en-IN")} during the period; contributions continue until the period ends.` : "" };
}

/** Months of one contribution period with possibly changing wages. Coverage depends on the first month's wages. */
export function esiPeriod(wagesByMonth: number[], disabled = false) {
  const ceiling = disabled ? ESI_RULES.wageCeilingDisabled : ESI_RULES.wageCeiling;
  const covered = (wagesByMonth[0] ?? 0) <= ceiling;
  const months = wagesByMonth.map((w) => esiMonth(w, covered, disabled));
  return { covered, months, employee: months.reduce((a, m) => a + m.employee, 0), employer: months.reduce((a, m) => a + m.employer, 0) };
}

/* ================================================================== */
/* Gratuity                                                            */
/* ================================================================== */

/** Code on Social Security / Code on Wages: if excluded allowances exceed 50% of total remuneration, the excess is added to wages. */
export function codeWages(basicDA: number, totalRemuneration: number) {
  const excluded = Math.max(0, totalRemuneration - basicDA);
  const cap = (totalRemuneration * GRATUITY_RULES.wageRulePct) / 100;
  const addBack = Math.max(0, excluded - cap);
  return { wages: basicDA + addBack, addBack };
}

export type GratuityCategory = "permanent" | "fixedTerm" | "notCovered";
export type GratuityEvent = "separation" | "death";

export interface GratuityInput {
  wages: number; // monthly wages counted for gratuity
  years: number;
  months: number;
  category: GratuityCategory;
  event: GratuityEvent;
  govt: boolean;
  /** Actual amount paid, if known (for the tax calculation); defaults to the statutory amount. */
  paid: number | null;
  /** Not covered: average monthly salary of the last 10 months. */
  averageSalary: number;
}

export interface GratuityResult {
  eligible: boolean;
  reason: string;
  serviceYears: number; // years counted
  formula: string;
  amount: number;
  capped: boolean;
  payable: number;
  exempt: number;
  taxable: number;
  exemptBasis: string;
}

export function gratuity(i: GratuityInput): GratuityResult {
  const G = GRATUITY_RULES;
  const totalMonths = i.years * 12 + i.months;
  const completed = Math.floor(totalMonths / 12);
  const extra = totalMonths % 12;
  const rounded = completed + (extra > G.roundUpAfterMonths ? 1 : 0);
  let eligible = true;
  let reason = "";
  if (i.category === "notCovered") reason = "Not covered by the statutory scheme: any gratuity depends on your employer's policy. The statutory formula is shown for reference.";
  else if (i.event === "death") reason = "On death or disablement, gratuity is payable regardless of length of service.";
  else if (i.category === "fixedTerm") {
    eligible = totalMonths >= G.minYearsFixedTerm * 12;
    reason = eligible ? "Fixed-term employees qualify after one year of service, pro rata." : "Fixed-term employees need at least one year of service.";
  } else {
    eligible = totalMonths >= G.minYearsPermanent * 12;
    reason = eligible ? "Five or more years of continuous service." : "At least five years of continuous service is needed (except on death or disablement).";
  }
  // Fixed-term: pro rata on actual service; covered permanent: part year over six months counts as a full year.
  const serviceYears = i.category === "fixedTerm" ? totalMonths / 12 : i.category === "notCovered" ? completed : rounded;
  const amount = eligible ? (i.wages * G.daysPerYear * serviceYears) / G.divisor : 0;
  const capped = i.category !== "notCovered" && amount > G.ceiling;
  const payable = capped ? G.ceiling : amount;
  const paid = i.paid ?? payable;
  let exempt: number;
  let exemptBasis: string;
  if (i.govt) {
    exempt = paid;
    exemptBasis = "Government employees: gratuity is fully exempt.";
  } else if (i.category === "notCovered") {
    const halfMonth = (i.averageSalary / 2) * completed;
    exempt = Math.max(0, Math.min(paid, G.taxExemptLimit, halfMonth));
    exemptBasis = "Not covered: exempt up to the least of the amount received, ₹20 lakh and half a month's average salary for each completed year.";
  } else {
    exempt = Math.max(0, Math.min(paid, G.taxExemptLimit, amount));
    exemptBasis = "Covered employees: exempt up to the least of the amount received, ₹20 lakh and the statutory gratuity.";
  }
  return {
    eligible,
    reason,
    serviceYears,
    formula: `${Math.round(i.wages).toLocaleString("en-IN")} × 15 × ${+serviceYears.toFixed(4)} ÷ 26`,
    amount,
    capped,
    payable: i.category === "notCovered" ? amount : payable,
    exempt,
    taxable: Math.max(0, paid - exempt),
    exemptBasis,
  };
}

/* ================================================================== */
/* Leave encashment                                                    */
/* ================================================================== */

export interface LeaveInput {
  days: number;
  /** Monthly salary used for encashment (per your employer's policy). */
  salary: number;
  divisor: number; // 26, 30 or custom
  event: "service" | "separation";
  govt: boolean;
  /** For the tax exemption (non-government): */
  averageSalary: number; // last 10 months' average (basic + DA + commission on turnover)
  yearsOfService: number; // completed years
  leaveEarnedPerYear: number;
  leaveTaken: number;
}

export function leaveEncashment(i: LeaveInput) {
  const daily = i.salary / i.divisor;
  const gross = daily * i.days;
  const L = LEAVE_RULES;
  let exempt = 0;
  const limits: { label: string; amount: number }[] = [];
  let basis: string;
  if (i.event === "service") basis = "Leave encashed while still in service is fully taxable as salary.";
  else if (i.govt) {
    exempt = gross;
    basis = "Government employees: leave encashment on retirement is fully exempt.";
  } else {
    const credit = Math.max(0, Math.min(i.leaveEarnedPerYear, L.daysPerYearCap) * i.yearsOfService - i.leaveTaken);
    limits.push(
      { label: "Amount received", amount: gross },
      { label: "Statutory limit", amount: L.exemptLimitNonGovt },
      { label: `${L.monthsAverage} months' average salary`, amount: L.monthsAverage * i.averageSalary },
      { label: `Leave credit (${credit} days at up to ${L.daysPerYearCap} days a year) × average daily salary`, amount: (credit * i.averageSalary) / 30 },
    );
    exempt = Math.max(0, Math.min(...limits.map((x) => x.amount)));
    basis = "Non-government employees: exempt up to the least of these four amounts.";
  }
  return { daily, gross, exempt, taxable: Math.max(0, gross - exempt), limits, basis };
}

/* ================================================================== */
/* HRA                                                                 */
/* ================================================================== */

export interface HraMonth {
  salary: number; // basic + DA (+ commission as % of turnover) for the month
  hra: number;
  rent: number;
  metro: boolean;
}

export interface HraMonthResult extends HraMonth {
  limitActual: number;
  limitRent: number;
  limitCity: number;
  exempt: number;
  taxable: number;
  binding: "actual" | "rent" | "city";
}

export function hraExemption(months: HraMonth[], year: TaxYearId) {
  const H = HRA_RULES[year];
  const rows: HraMonthResult[] = months.map((m) => {
    const limitActual = m.hra;
    const limitRent = Math.max(0, m.rent - (m.salary * H.rentLessPct) / 100);
    const limitCity = (m.salary * (m.metro ? H.metroPct : H.otherPct)) / 100;
    const exempt = m.rent > 0 ? Math.max(0, Math.min(limitActual, limitRent, limitCity)) : 0;
    const binding = exempt === limitActual ? "actual" : exempt === limitRent ? "rent" : "city";
    return { ...m, limitActual, limitRent, limitCity, exempt, taxable: m.hra - exempt, binding };
  });
  const sum = (k: keyof HraMonthResult) => rows.reduce((a, r) => a + (r[k] as number), 0);
  return { rows, hra: sum("hra"), rent: sum("rent"), salary: sum("salary"), limitActual: sum("limitActual"), limitRent: sum("limitRent"), limitCity: sum("limitCity"), exempt: sum("exempt"), taxable: sum("taxable") };
}

export const isMetro = (city: string, year: TaxYearId) => HRA_RULES[year].metros.includes(city);
