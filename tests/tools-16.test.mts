// Unit tests for calculators 56–65: income tax, take-home, HRA, TDS, EPF, ESI,
// gratuity, leave encashment, NPS and salary hike.
// Expected values come from an independent 50-digit Decimal implementation in
// Python written from the statutory rules (not from this code), plus hand
// workings noted inline.
import { computeTax, EMPTY_TAX_INPUT, type TaxInput } from "../src/lib/india/income-tax";
import { codeWages, epfMonth, esiMonth, esiPeriod, gratuity, hraExemption, isMetro, leaveEncashment, projectEpf, type EpfInput, type GratuityInput, type LeaveInput } from "../src/lib/india/payroll";
import { applyHike, hikePct, projectNps, realHike, takeHome, tdsOnPayment, type SalaryInput, type TdsInput } from "../src/lib/india/salary";
import { TAX_YEARS } from "../src/lib/india/rules";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ================= Income tax ================= */
const tax = (o: Partial<TaxInput>) => computeTax({ year: "2025-26", regime: "new", age: "below60", salary: 0, ...EMPTY_TAX_INPUT, ...o });
const TT = (o: Partial<TaxInput>) => { const t = tax(o); return [t.taxableIncome, t.totalTax]; };

eq("tax: new, salary ₹13L → TI 12.25L, rebate marginal relief → ₹26,000", TT({ salary: 1300000 }), [1225000, 26000]);
eq("tax: new, salary ₹12.75L → TI ₹12L → nil (full rebate)", TT({ salary: 1275000 }), [1200000, 0]);
eq("tax: new, TI ₹12.10L → ₹10,400", TT({ salary: 1210000 + 75000 }), [1210000, 10400]);
eq("tax: new, rebate marginal relief amount", (() => { const t = tax({ salary: 1300000 }); return [t.slabTax, t.rebateMarginalRelief]; })(), [63750, 38750]);
eq("tax: new, TI ₹55L → 10% surcharge, no relief → ₹14,07,120", TT({ salary: 5575000 }), [5500000, 1407120]);
eq("tax: new, TI ₹50.10L → surcharge marginal relief → ₹11,33,600", TT({ salary: 5085000 }), [5010000, 1133600]);
eq("tax: new, TI ₹1.005Cr → 15% band relief → ₹30,03,520", TT({ salary: 10125000 }), [10050000, 3003520]);
eq("tax: old, salary ₹10.5L → TI ₹10L → ₹1,17,000", TT({ regime: "old", salary: 1050000 }), [1000000, 117000]);
eq("tax: old, 60–79, TI ₹6L → ₹31,200", TT({ regime: "old", age: "60to79", salary: 650000 }), [600000, 31200]);
eq("tax: old, 80+, TI ₹6L → ₹20,800", TT({ regime: "old", age: "80plus", salary: 650000 }), [600000, 20800]);
eq("tax: old, TI ₹4.9L → nil (87A)", TT({ regime: "old", salary: 540000 }), [490000, 0]);
eq("tax: old, TI ₹5.2L → no rebate → ₹17,160", TT({ regime: "old", salary: 570000 }), [520000, 17160]);
eq(
  "tax: old with HRA ₹1.8L, PT, 80C, 80D → TI ₹7,92,500 → ₹73,840",
  TT({ regime: "old", salary: 1200000, exemptAllowances: 180000, professionalTax: 2500, d80C: 200000, d80D: 25000 }),
  [792500, 73840],
);
eq("tax: 80C capped at ₹1.5L", tax({ regime: "old", salary: 1200000, d80C: 400000 }).deductions[0].amount, 150000);
eq("tax: new regime ignores HRA, PT, 80C (with notes)", (() => { const t = tax({ salary: 1300000, exemptAllowances: 100000, professionalTax: 2500, d80C: 150000 }); return [t.totalTax, t.notes.length]; })(), [26000, 3]);
eq("tax: new regime employer NPS capped at 14% of basic", (() => { const t = tax({ salary: 1500000, employerNps: 100000, basicDA: 600000 }); return t.deductions[0].amount; })(), 84000);
eq("tax: old regime employer NPS capped at 10%", tax({ regime: "old", salary: 1500000, employerNps: 100000, basicDA: 600000 }).deductions[0].amount, 60000);
eq("tax: old HP loss limited to ₹2L", tax({ regime: "old", salary: 1500000, houseProperty: -300000 }).houseProperty, -200000);
eq("tax: new HP loss on salary ignored", tax({ salary: 1500000, houseProperty: -300000 }).houseProperty, 0);
eq("tax: 2026-27 same slabs (Budget 2026: no change)", TT({ year: "2026-27", salary: 1300000 }), [1225000, 26000]);
eq("tax: 2026-27 uses the Income-tax Act 2025", TAX_YEARS["2026-27"].act, "Income-tax Act, 2025");
eq("tax: zero income", TT({ salary: 0 }), [0, 0]);

/* ================= HRA ================= */
const H = (rent: number, metro: boolean, year: "2025-26" | "2026-27" = "2025-26") => hraExemption([{ salary: 600000, hra: 300000, rent, metro }], year);
eq("hra: metro, rent ₹2.4L → rent − 10% binds → ₹1.8L", [H(240000, true).exempt, H(240000, true).rows[0].binding], [180000, "rent"]);
eq("hra: rent ₹3.6L metro → ₹3L (HRA received)", H(360000, true).exempt, 300000);
eq("hra: rent ₹3.6L non-metro → 40% → ₹2.4L", [H(360000, false).exempt, H(360000, false).rows[0].binding], [240000, "city"]);
eq("hra: no rent → nil", H(0, true).exempt, 0);
eq("hra: rent below 10% of salary → nil", H(50000, true).exempt, 0);
eq("hra: Pune not a metro in 2025-26, metro in 2026-27", [isMetro("Pune", "2025-26"), isMetro("Pune", "2026-27"), isMetro("Bengaluru", "2026-27"), isMetro("Jaipur", "2026-27")], [false, true, true, false]);
eq(
  "hra: month-wise sums (6 months metro, 6 non-metro)",
  hraExemption([...Array(6)].map(() => ({ salary: 50000, hra: 25000, rent: 30000, metro: true })).concat([...Array(6)].map(() => ({ salary: 50000, hra: 25000, rent: 30000, metro: false }))), "2025-26").exempt,
  // metro: min(25000, 25000, 25000) = 25000; non-metro: min(25000, 25000, 20000) = 20000
  6 * 25000 + 6 * 20000,
);

/* ================= TDS ================= */
const tds = (o: Partial<TdsInput>) => tdsOnPayment({ year: "2025-26", category: "professional", amount: 0, paidSoFar: 0, rentMonths: 1, senior: false, pan: true, ...o });
eq("tds: professional ₹60,000 → 10% → ₹6,000", [tds({ amount: 60000 }).tds, tds({ amount: 60000 }).section], [6000, "194J"]);
eq("tds: professional ₹40,000 (within ₹50k) → nil", tds({ amount: 40000 }).applies, false);
eq("tds: crossing ₹50k covers the year's total", [tds({ amount: 30000, paidSoFar: 30000 }).base, tds({ amount: 30000, paidSoFar: 30000 }).tds], [60000, 6000]);
eq("tds: after the limit, only this payment", tds({ amount: 10000, paidSoFar: 70000 }).tds, 1000);
eq("tds: technical 2%", tds({ category: "technical", amount: 100000 }).tds, 2000);
eq("tds: no PAN → 20%", [tds({ amount: 100000, pan: false }).rate, tds({ amount: 100000, pan: false }).noPanSection], [20, "206AA"]);
eq("tds: 2026-27 section labels (Act 2025)", [tds({ year: "2026-27", amount: 60000 }).section, tds({ year: "2026-27", amount: 60000, pan: false }).noPanSection], ["393(1) Table, sl. 6(iii)", "397(2)"]);
eq("tds: rent by individual ₹60k/month → 2% → ₹1,200", tds({ category: "rentIndividual", amount: 60000 }).tds, 1200);
eq("tds: rent ₹45k/month → nil", tds({ category: "rentIndividual", amount: 45000 }).applies, false);
eq("tds: rent ₹1.2L for 3 months (₹40k/month) → nil", tds({ category: "rentBuilding", amount: 120000, rentMonths: 3 }).applies, false);
eq("tds: contractor single ₹35k → 1% → ₹350", tds({ category: "contractorIndividual", amount: 35000 }).tds, 350);
eq("tds: contractor ₹25k with ₹80k earlier → aggregate crossed → 1% of ₹1.05L", tds({ category: "contractorIndividual", amount: 25000, paidSoFar: 80000 }).tds, 1050);
eq("tds: contractor company 2%", tds({ category: "contractorOther", amount: 50000 }).tds, 1000);
eq("tds: bank interest ₹80k senior → nil (₹1L limit)", tds({ category: "interestBank", amount: 80000, senior: true }).applies, false);
eq("tds: bank interest ₹80k non-senior → ₹8,000", tds({ category: "interestBank", amount: 80000 }).tds, 8000);

/* ================= EPF ================= */
const pf = { basis: "ceiling" as const, employeePct: 12, employerPct: 12, epsMember: true, vpfPct: 0 };
eq("epf: ₹50k wages on ceiling → 1800 / 1250 EPS / 550 EPF", (() => { const m = epfMonth(50000, pf, 30); return [m.employee, m.eps, m.employerEpf]; })(), [1800, 1250, 550]);
eq("epf: ₹50k actual → 6000 / 1250 / 4750", (() => { const m = epfMonth(50000, { ...pf, basis: "actual" }, 30); return [m.employee, m.eps, m.employerEpf]; })(), [6000, 1250, 4750]);
eq("epf: not an EPS member → all employer share to EPF", epfMonth(50000, { ...pf, epsMember: false }, 30).employerEpf, 1800);
eq("epf: EPS stops at 58", epfMonth(50000, pf, 58).eps, 0);
eq("epf: ₹10k wages → 1200 / 833 EPS / 367", (() => { const m = epfMonth(10000, pf, 30); return [m.employee, m.eps, m.employerEpf]; })(), [1200, 833, 367]);
eq("epf: VPF 5% on ₹40k → ₹2,000", epfMonth(40000, { ...pf, vpfPct: 5 }, 30).vpf, 2000);
const E = (o: Partial<EpfInput>) => projectEpf({ wages: 15000, age: 30, retireAge: 31, balance: 0, interest: 8.25, salaryGrowth: 0, ...pf, ...o });
eq("epf: one year at ₹15k → ₹29,460.19 (interest ₹1,260.19)", [r2(E({}).corpus), r2(E({}).totalInterest)], [29460.19, 1260.19]);
eq("epf: two years, actual basis, 10% growth, ₹1L opening → ₹2,15,876.95", r2(E({ wages: 20000, retireAge: 32, balance: 100000, basis: "actual", salaryGrowth: 10 }).corpus), 215876.95);
eq("epf: zero years", E({ retireAge: 30 }).corpus, 0);

/* ================= ESI ================= */
eq("esi: ₹21,000 → 158 / 683 (rounded up)", (() => { const e = esiMonth(21000, true); return [e.employee, e.employer]; })(), [158, 683]);
eq("esi: ₹18,000 → 135 / 585", (() => { const e = esiMonth(18000, true); return [e.employee, e.employer]; })(), [135, 585]);
eq("esi: ₹15,500 → 117 / 504", (() => { const e = esiMonth(15500, true); return [e.employee, e.employer]; })(), [117, 504]);
eq("esi: period starting at ₹20k continues after a raise to ₹22k", (() => { const p = esiPeriod([20000, 22000]); return [p.covered, p.employee, p.employer]; })(), [true, 150 + 165, 650 + 715]);
eq("esi: period starting above ₹21k → not covered", esiPeriod([22000, 20000]).covered, false);
eq("esi: disabled ceiling ₹25k", esiPeriod([24000], true).covered, true);

/* ================= Gratuity ================= */
const G = (o: Partial<GratuityInput>) => gratuity({ wages: 50000, years: 10, months: 7, category: "permanent", event: "separation", govt: false, paid: null, averageSalary: 0, ...o });
eq("gratuity: ₹50k, 10y 7m → 11 years → ₹3,17,307.69", [G({}).serviceYears, r2(G({}).amount)], [11, 317307.69]);
eq("gratuity: 10y 6m → 10 years (not over six months)", G({ months: 6 }).serviceYears, 10);
eq("gratuity: 4y 8m permanent → not eligible", G({ years: 4, months: 8 }).eligible, false);
eq("gratuity: 4y 7m on death → 5 years → ₹1,44,230.77", r2(G({ years: 4, months: 7, event: "death" }).amount), 144230.77);
eq("gratuity: fixed-term 2y 6m pro rata → ₹72,115.38", r2(G({ years: 2, months: 6, category: "fixedTerm" }).amount), 72115.38);
eq("gratuity: fixed-term 11 months → not eligible", G({ years: 0, months: 11, category: "fixedTerm" }).eligible, false);
eq("gratuity: ₹3L wages 30y → capped at ₹20L, all exempt", (() => { const g = G({ wages: 300000, years: 30, months: 0 }); return [g.capped, g.payable, g.exempt, g.taxable]; })(), [true, 2000000, 2000000, 0]);
eq("gratuity: paid above statutory → excess taxable", (() => { const g = G({ paid: 400000 }); return [r2(g.exempt), r2(g.taxable)]; })(), [317307.69, 82692.31]);
eq("gratuity: government → fully exempt", G({ govt: true, paid: 2500000 }).taxable, 0);
eq("gratuity: not covered → half month × completed years", (() => { const g = G({ category: "notCovered", averageSalary: 60000, paid: 500000 }); return [g.exempt, g.taxable]; })(), [300000, 200000]);
eq("gratuity: Code wage rule adds back allowances over 50%", codeWages(40000, 100000), { wages: 50000, addBack: 10000 });
eq("gratuity: Code wage rule, basic already ≥ 50%", codeWages(60000, 100000), { wages: 60000, addBack: 0 });

/* ================= Leave encashment ================= */
const L = (o: Partial<LeaveInput>) => leaveEncashment({ days: 100, salary: 60000, divisor: 30, event: "separation", govt: false, averageSalary: 60000, yearsOfService: 10, leaveEarnedPerYear: 30, leaveTaken: 200, ...o });
eq("leave: 100 days at ₹60k/30 → ₹2L, fully exempt", [L({}).gross, L({}).exempt, L({}).taxable], [200000, 200000, 0]);
eq("leave: credit cap at 30 days/year", (() => { const l = L({ leaveEarnedPerYear: 45, days: 200 }); return [l.gross, l.exempt]; })(), [400000, 200000]);
eq("leave: 10 months' average binds", L({ days: 400, leaveTaken: 0, yearsOfService: 20, averageSalary: 50000 }).exempt, 500000);
eq("leave: ₹25L limit binds", L({ days: 600, salary: 300000, averageSalary: 300000, yearsOfService: 30, leaveTaken: 0 }).exempt, 2500000);
eq("leave: in service → fully taxable", L({ event: "service" }).taxable, 200000);
eq("leave: government → fully exempt", L({ govt: true, days: 600, salary: 300000 }).taxable, 0);
eq("leave: divisor 26", r2(L({ divisor: 26, days: 10 }).gross), 23076.92);

/* ================= NPS ================= */
const N = projectNps({ age: 30, exitAge: 60, monthly: 5000, stepUp: 0, balance: 0, returnPct: 10, sector: "nonGovt", exit: "normal", annuityPct: 40, annuityRate: 6 });
eq("nps: ₹5k/month 30y at 10% → ₹1,03,96,463.58", r2(N.corpus), 10396463.58);
eq("nps: 40% annuity → ₹41,58,585.43; pension ₹20,792.93/month", [r2(N.annuityAmount), r2(N.monthlyPension)], [4158585.43, 20792.93]);
eq("nps: annuity below 20% minimum is raised", projectNps({ age: 30, exitAge: 60, monthly: 5000, stepUp: 0, balance: 0, returnPct: 10, sector: "nonGovt", exit: "normal", annuityPct: 0, annuityRate: 6 }).annuityPct, 20);
eq("nps: govt normal exit min 40%", projectNps({ age: 30, exitAge: 60, monthly: 5000, stepUp: 0, balance: 0, returnPct: 10, sector: "govt", exit: "normal", annuityPct: 0, annuityRate: 6 }).annuityPct, 40);
eq("nps: premature exit min 80%", projectNps({ age: 30, exitAge: 45, monthly: 5000, stepUp: 0, balance: 0, returnPct: 10, sector: "nonGovt", exit: "premature", annuityPct: 0, annuityRate: 6 }).annuityPct, 80);
eq("nps: small corpus (≤ ₹8L) → full withdrawal allowed", (() => { const n = projectNps({ age: 55, exitAge: 60, monthly: 5000, stepUp: 0, balance: 0, returnPct: 8, sector: "nonGovt", exit: "normal", annuityPct: 0, annuityRate: 6 }); return [n.fullAllowed, n.annuityPct]; })(), [true, 0]);

/* ================= Salary hike ================= */
eq("hike: ₹10L → ₹11L = 10%", hikePct(1000000, 1100000), 10);
eq("hike: ₹10L + 12.5% = ₹11.25L", applyHike(1000000, 12.5), 1125000);
eq("hike: 10% with 6% inflation → 3.7736% real", Math.round(realHike(10, 6) * 1e4) / 1e4, 3.7736);

/* ================= Take-home ================= */
const S = (o: Partial<SalaryInput>) => takeHome({ year: "2025-26", regime: "new", age: "below60", basic: 600000, da: 0, hra: 300000, special: 300000, otherAllowances: 0, variable: 0, employerPfBasis: "ceiling", employerNpsPct: 0, includeGratuity: true, professionalTax: 2500, otherDeductions: 0, rentMonthly: 0, metro: true, d80COther: 0, ...o });
const s1 = S({});
eq("take-home: CTC = gross + employer PF + gratuity 4.81%", r2(s1.ctc), r2(1200000 + 21600 + 28846.153846));
eq("take-home: new regime ₹12L gross → nil tax (rebate)", s1.tax.totalTax, 0);
eq("take-home: annual in-hand = gross − PF − PT", s1.annualInHand, 1200000 - 21600 - 2500);
eq("take-home: PF/ESI not double counted (no ESI above ₹21k)", [s1.employeePf, s1.employeeEsi, s1.esiCovered], [21600, 0, false]);
const s2 = S({ regime: "old", rentMonthly: 20000 });
eq("take-home: old regime HRA exemption via the HRA engine", s2.hraExempt, 180000);
eq("take-home: old regime tax uses PF in 80C", s2.tax.deductions.find((d) => d.label.startsWith("80C"))?.amount, 21600);
const s3 = S({ basic: 120000, hra: 48000, special: 36000, professionalTax: 0 });
eq("take-home: ₹17k/month gross → ESI 0.75% = ₹128/month", [s3.esiCovered, s3.employeeEsi], [true, 128 * 12]);

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
