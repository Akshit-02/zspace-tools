/**
 * Indian tax, payroll and benefit rules — the single, versioned source of
 * truth for the salary & tax calculators. UI components never hard-code a rate.
 *
 * Every rule carries its period, source and verification status:
 *   "verified"     — checked against an official or primary source
 *   "secondary"    — consistent across several independent professional sources; official text not retrieved
 *   "carried"      — assumed unchanged from the previous year; not yet confirmed for this year
 * Update this file (and lastVerified) when rules change. Never roll a year forward silently.
 */

export type Status = "verified" | "secondary" | "carried";
export interface Source {
  label: string;
  url: string;
}
export const LAST_VERIFIED = "2026-11-15";

/* ------------------------------------------------------------------ */
/* Income tax                                                          */
/* ------------------------------------------------------------------ */

export type TaxYearId = "2025-26" | "2026-27";
export type Regime = "new" | "old";
export type AgeBand = "below60" | "60to79" | "80plus";

export interface Slab {
  upTo: number | null; // inclusive upper bound of taxable income; null = no limit
  rate: number; // %
}

export interface TaxYearRules {
  id: TaxYearId;
  /** How the year is described under the Act in force. */
  label: string;
  short: string;
  act: string;
  period: string;
  newRegime: { slabs: Slab[]; standardDeduction: number; rebate: { max: number; incomeLimit: number; marginalRelief: boolean }; employerNpsPct: number; section: string };
  oldRegime: { slabs: Record<AgeBand, Slab[]>; standardDeduction: number; rebate: { max: number; incomeLimit: number }; employerNpsPct: number; deductionCaps: { c80: number; ccd1b: number; selfOccupiedInterest: number } };
  /** Surcharge on income above each threshold (%); marginal relief applies at every threshold. */
  surcharge: { new: { above: number; rate: number }[]; old: { above: number; rate: number }[] };
  cess: number;
  status: Record<string, Status>;
  notes: string[];
  sources: Source[];
}

const NEW_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: null, rate: 30 },
];
const OLD_SLABS: Record<AgeBand, Slab[]> = {
  below60: [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 5 },
    { upTo: 1000000, rate: 20 },
    { upTo: null, rate: 30 },
  ],
  "60to79": [
    { upTo: 300000, rate: 0 },
    { upTo: 500000, rate: 5 },
    { upTo: 1000000, rate: 20 },
    { upTo: null, rate: 30 },
  ],
  "80plus": [
    { upTo: 500000, rate: 0 },
    { upTo: 1000000, rate: 20 },
    { upTo: null, rate: 30 },
  ],
};
const SURCHARGE_NEW = [
  { above: 5000000, rate: 10 },
  { above: 10000000, rate: 15 },
  { above: 20000000, rate: 25 },
];
const SURCHARGE_OLD = [...SURCHARGE_NEW, { above: 50000000, rate: 37 }];

const ITD_RATES: Source = { label: "Income Tax Department — salaried individuals, AY 2026-27 (FY 2025-26)", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" };
const BUDGET_2026: Source = { label: "Key features of Budget 2026-27 (no change in income-tax rates)", url: "https://www.indiabudget.gov.in/doc/bh1.pdf" };

export const TAX_YEARS: Record<TaxYearId, TaxYearRules> = {
  "2025-26": {
    id: "2025-26",
    label: "Financial year 2025-26 (assessment year 2026-27)",
    short: "FY 2025-26",
    act: "Income-tax Act, 1961",
    period: "1 April 2025 – 31 March 2026",
    newRegime: { slabs: NEW_SLABS, standardDeduction: 75000, rebate: { max: 60000, incomeLimit: 1200000, marginalRelief: true }, employerNpsPct: 14, section: "section 115BAC" },
    oldRegime: { slabs: OLD_SLABS, standardDeduction: 50000, rebate: { max: 12500, incomeLimit: 500000 }, employerNpsPct: 10, deductionCaps: { c80: 150000, ccd1b: 50000, selfOccupiedInterest: 200000 } },
    surcharge: { new: SURCHARGE_NEW, old: SURCHARGE_OLD },
    cess: 4,
    status: { slabs: "verified", rebate: "verified", surcharge: "verified", cess: "verified", standardDeduction: "secondary", employerNps: "verified" },
    notes: ["Rates as published by the Income Tax Department for AY 2026-27."],
    sources: [ITD_RATES],
  },
  "2026-27": {
    id: "2026-27",
    label: "Tax year 2026-27",
    short: "Tax year 2026-27",
    act: "Income-tax Act, 2025",
    period: "1 April 2026 – 31 March 2027",
    newRegime: { slabs: NEW_SLABS, standardDeduction: 75000, rebate: { max: 60000, incomeLimit: 1200000, marginalRelief: true }, employerNpsPct: 14, section: "section 202" },
    oldRegime: { slabs: OLD_SLABS, standardDeduction: 50000, rebate: { max: 12500, incomeLimit: 500000 }, employerNpsPct: 10, deductionCaps: { c80: 150000, ccd1b: 50000, selfOccupiedInterest: 200000 } },
    surcharge: { new: SURCHARGE_NEW, old: SURCHARGE_OLD },
    cess: 4,
    status: { slabs: "secondary", rebate: "secondary", surcharge: "secondary", cess: "secondary", standardDeduction: "carried", employerNps: "carried" },
    notes: [
      "The Income-tax Act, 2025 replaced the 1961 Act from 1 April 2026; 'tax year' replaces 'previous year' and 'assessment year'.",
      "Budget 2026-27 made no change to income-tax rates. The new regime is under section 202 of the 2025 Act.",
      "The old-regime standard deduction and deduction limits are assumed unchanged from FY 2025-26 — not yet confirmed against the 2025 Act's text.",
    ],
    sources: [BUDGET_2026, ITD_RATES],
  },
};

/* ------------------------------------------------------------------ */
/* HRA                                                                 */
/* ------------------------------------------------------------------ */

export const HRA_RULES: Record<TaxYearId, { metros: string[]; metroPct: number; otherPct: number; rentLessPct: number; status: Status; source: Source; note: string }> = {
  "2025-26": {
    metros: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    metroPct: 50,
    otherPct: 40,
    rentLessPct: 10,
    status: "verified",
    source: { label: "Income-tax Rules, 1962 — rule 2A (section 10(13A))", url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1" },
    note: "Least of: HRA received; rent paid minus 10% of salary; 50% of salary in Mumbai, Delhi, Kolkata or Chennai, otherwise 40%.",
  },
  "2026-27": {
    metros: ["Mumbai", "Delhi", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad"],
    metroPct: 50,
    otherPct: 40,
    rentLessPct: 10,
    status: "secondary",
    source: { label: "Income-tax Rules, 2026 (notified 20 March 2026) — HRA rule", url: "https://www.moneylife.in/article/new-income-tax-rules-from-1st-april-hra-exemption-extended-to-8-cities-fewer-forms-but-landlord-disclosure-now-mandatory/79998.html" },
    note: "From 1 April 2026 the 50% limit covers eight cities: Mumbai, Delhi, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad.",
  },
};

/* ------------------------------------------------------------------ */
/* TDS (non-salary)                                                    */
/* ------------------------------------------------------------------ */

export type TdsCategory = "professional" | "technical" | "rentBuilding" | "rentMachinery" | "rentIndividual" | "interestBank" | "interestOther" | "contractorIndividual" | "contractorOther";

export interface TdsRule {
  label: string;
  rate: number;
  /** Threshold and how it is measured. */
  threshold: number;
  thresholdBasis: "year" | "month" | "single";
  /** Second threshold: aggregate in the year (contractors). */
  aggregate?: number;
  seniorThreshold?: number;
  section: Record<TaxYearId, string>;
  note: string;
}

export const TDS_RULES: Record<TdsCategory, TdsRule> = {
  professional: { label: "Fees for professional services", rate: 10, threshold: 50000, thresholdBasis: "year", section: { "2025-26": "194J", "2026-27": "393(1) Table, sl. 6(iii)" }, note: "Doctors, lawyers, CAs, architects, consultants and similar professions." },
  technical: { label: "Fees for technical services / call-centre", rate: 2, threshold: 50000, thresholdBasis: "year", section: { "2025-26": "194J", "2026-27": "393(1) Table, sl. 6(iii)" }, note: "Technical, managerial or consultancy services that aren't a profession." },
  rentBuilding: { label: "Rent — land, building or furniture", rate: 10, threshold: 50000, thresholdBasis: "month", section: { "2025-26": "194-I", "2026-27": "393(1) Table, sl. 2(ii)" }, note: "Paid by companies, firms and individuals/HUFs who must have their accounts audited." },
  rentMachinery: { label: "Rent — plant, machinery or equipment", rate: 2, threshold: 50000, thresholdBasis: "month", section: { "2025-26": "194-I", "2026-27": "393(1) Table, sl. 2(ii)" }, note: "Hire of machinery, vehicles or equipment." },
  rentIndividual: { label: "Rent paid by an individual/HUF not liable to audit", rate: 2, threshold: 50000, thresholdBasis: "month", section: { "2025-26": "194-IB", "2026-27": "393(1) Table, sl. 2(i)" }, note: "e.g. a salaried tenant paying more than ₹50,000 a month." },
  interestBank: { label: "Interest — bank, co-operative bank or post office deposits", rate: 10, threshold: 50000, seniorThreshold: 100000, thresholdBasis: "year", section: { "2025-26": "194A", "2026-27": "393(1) Table, sl. 5(ii)" }, note: "Fixed and recurring deposits. Savings-account interest is not subject to this TDS." },
  interestOther: { label: "Interest — other payers", rate: 10, threshold: 10000, thresholdBasis: "year", section: { "2025-26": "194A", "2026-27": "393(1) Table, sl. 5(iii)" }, note: "e.g. company deposits or loans from a business." },
  contractorIndividual: { label: "Contract work — contractor is an individual/HUF", rate: 1, threshold: 30000, aggregate: 100000, thresholdBasis: "single", section: { "2025-26": "194C", "2026-27": "393(1) Table, sl. 6(i)" }, note: "TDS applies if one payment exceeds ₹30,000 or the year's total exceeds ₹1,00,000." },
  contractorOther: { label: "Contract work — contractor is a company/firm", rate: 2, threshold: 30000, aggregate: 100000, thresholdBasis: "single", section: { "2025-26": "194C", "2026-27": "393(1) Table, sl. 6(i)" }, note: "TDS applies if one payment exceeds ₹30,000 or the year's total exceeds ₹1,00,000." },
};
export const TDS_NO_PAN = { rate: 20, section: { "2025-26": "206AA", "2026-27": "397(2)" } as Record<TaxYearId, string>, note: "Without the payee's PAN, TDS is generally the higher of the normal rate and 20%." };
export const TDS_SOURCES: Source[] = [
  { label: "Income Tax Department — FAQs on higher rate of TDS under section 397", url: "https://www.incometaxindia.gov.in/documents/d/guest/faqs-on-higher-rate-of-tds-under-section-397" },
  { label: "TDS rates under the Income-tax Act, 2025 (from 1 April 2026) — TaxGuru master sheet", url: "https://taxguru.in/income-tax/tds-rates-income-tax-act-2025-1-april-2026.html" },
];

/* ------------------------------------------------------------------ */
/* EPF / EPS                                                           */
/* ------------------------------------------------------------------ */

export const EPF_RULES = {
  employeePct: 12,
  employerPct: 12,
  /** Reduced rate (10%) applies to notified establishments only. */
  reducedPct: 10,
  epsPct: 8.33,
  /** Statutory wage ceiling for compulsory contributions and EPS (₹ per month). */
  wageCeiling: 15000,
  epsMax: 1250,
  epsExitAge: 58,
  interest: [
    { fy: "2023-24", rate: 8.25, status: "verified" as Status },
    { fy: "2024-25", rate: 8.25, status: "verified" as Status },
    { fy: "2025-26", rate: 8.25, status: "verified" as Status },
  ],
  note: "Interest is calculated on the monthly running balance and credited at the end of each financial year.",
  sources: [
    { label: "Employees' Provident Fund Organisation (EPFO)", url: "https://www.epfindia.gov.in/" },
    { label: "Govt ratifies 8.25% EPF interest for 2025-26 (June 2026)", url: "https://theprint.in/economy/govt-ratifies-8-25-pc-epf-interest-rate-for-fy26-to-be-credited-this-month/2963099/" },
  ] as Source[],
  status: "secondary" as Status,
};

/* ------------------------------------------------------------------ */
/* ESI                                                                 */
/* ------------------------------------------------------------------ */

export const ESI_RULES = {
  employeePct: 0.75,
  employerPct: 3.25,
  wageCeiling: 21000,
  wageCeilingDisabled: 25000,
  /** Contribution periods: April–September and October–March. */
  periods: [
    { label: "April – September", months: [4, 5, 6, 7, 8, 9] },
    { label: "October – March", months: [10, 11, 12, 1, 2, 3] },
  ],
  rounding: "Each share is rounded up to the next whole rupee.",
  statusRates: "secondary" as Status,
  statusCeiling: "carried" as Status,
  note: "ESI now runs under Chapter IV of the Code on Social Security, 2020 (in force from 21 November 2025). The ₹21,000 ceiling (₹25,000 for persons with disability) is the operative limit; a fresh ceiling notification under the Code wasn't found.",
  sources: [
    { label: "Employees' State Insurance Corporation (ESIC)", url: "https://www.esic.gov.in/" },
    { label: "Code on Social Security, 2020 — commencement (21 Nov 2025)", url: "https://www.tribuneindia.com/news/business/code-on-social-security-begins-nationwide-rollout-aiming-for-inclusive-worker-protection" },
  ] as Source[],
};

/* ------------------------------------------------------------------ */
/* Gratuity                                                            */
/* ------------------------------------------------------------------ */

export const GRATUITY_RULES = {
  daysPerYear: 15,
  divisor: 26,
  minYearsPermanent: 5,
  minYearsFixedTerm: 1,
  /** A part year of more than six months counts as a full year. */
  roundUpAfterMonths: 6,
  ceiling: 2000000,
  taxExemptLimit: 2000000,
  /** Wages = basic + DA + retaining allowance; if excluded allowances exceed this share of total remuneration, the excess counts as wages. */
  wageRulePct: 50,
  statusFormula: "secondary" as Status,
  statusTax: "carried" as Status,
  note: "Gratuity now falls under the Code on Social Security, 2020 (from 21 November 2025): the 15/26 formula and ₹20 lakh ceiling continue; fixed-term employees qualify after one year; 'wages' follow the Code's 50% rule.",
  sources: [
    { label: "Gratuity under the Code on Social Security, 2020 — Taxmann", url: "https://www.taxmann.com/post/blog/analysis-gratuity-under-code-on-social-security/" },
    { label: "Section 2(y) Code on Wages — the 50% rule — Taxmann", url: "https://www.taxmann.com/post/blog/definition-of-wages-section-2y-code-on-wages-50-percent-rule/" },
  ] as Source[],
};

/* ------------------------------------------------------------------ */
/* Leave encashment                                                    */
/* ------------------------------------------------------------------ */

export const LEAVE_RULES = {
  exemptLimitNonGovt: 2500000,
  monthsAverage: 10,
  daysPerYearCap: 30,
  status: "secondary" as Status,
  section: { "2025-26": "section 10(10AA)", "2026-27": "section 19 (formerly 10(10AA))" } as Record<TaxYearId, string>,
  note: "Non-government employees: exempt up to the least of the amount received, ₹25 lakh, 10 months' average salary, and leave credit (max 30 days per year of service) × average salary. Government employees' leave encashment on retirement is fully exempt. Encashment while in service is fully taxable.",
  sources: [
    { label: "CBDT Notification 31/2023 — ₹25 lakh limit", url: "https://www.taxheal.com/238-ddn-of-2025.html" },
    { label: "Leave encashment under the Income-tax Act, 2025 — Zoho Payroll", url: "https://www.zoho.com/in/payroll/academy/payroll-administration/leave-encashment-exemption-employers-must-know-2026.html" },
  ] as Source[],
};

/* ------------------------------------------------------------------ */
/* NPS exits                                                           */
/* ------------------------------------------------------------------ */

export type NpsSector = "nonGovt" | "govt";
export type NpsExit = "normal" | "premature";

export const NPS_EXIT: Record<NpsSector, Record<NpsExit, { minAnnuityPct: number; fullWithdrawalUpTo: number }>> = {
  nonGovt: { normal: { minAnnuityPct: 20, fullWithdrawalUpTo: 800000 }, premature: { minAnnuityPct: 80, fullWithdrawalUpTo: 500000 } },
  govt: { normal: { minAnnuityPct: 40, fullWithdrawalUpTo: 800000 }, premature: { minAnnuityPct: 80, fullWithdrawalUpTo: 500000 } },
};
export const NPS_RULES = {
  maxAge: 85,
  status: "secondary" as Status,
  note: "PFRDA (Exits and Withdrawals under NPS) (Amendment) Regulations, 2025, notified 12 December 2025.",
  sources: [
    { label: "PFRDA exit rule changes, December 2025 — Business Standard", url: "https://www.business-standard.com/finance/personal-finance/nps-changes-2025-80-withdrawal-more-lump-sum-less-annuity-exit-relief-125122200156_1.html" },
    { label: "PFRDA NPS exit and withdrawal amendment 2025 — summary", url: "https://www.gconnect.in/nps-2/pfrda-nps-exit-withdrawal-amendment-rules-2025.html" },
  ] as Source[],
};

export const STATUS_TEXT: Record<Status, string> = {
  verified: "Checked against an official source",
  secondary: "Consistent across professional sources; official text not retrieved",
  carried: "Assumed unchanged from the previous year — not yet confirmed",
};
