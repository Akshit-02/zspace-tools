// Unit tests for calculators 66–75: loans, borrowing and property.
// Expected values from independent Python implementations (Decimal arithmetic,
// paise rounding) and hand workings noted inline.
import { amortise, effectiveAnnualRate, monthsToRepay, plannedFor, principalFromEmi, addMonths, monthLabel } from "../src/lib/loans/amortise";
import { affordability, dti, homeLoanEligibility, loanCost, maxLoanByLtv, ltvCapFor, type EligibilityInput } from "../src/lib/loans/borrowing";
import { downPayment, rentVsBuy, type RentBuyInput } from "../src/lib/loans/property";
import { inr } from "../src/lib/loans/format";
import { registrationFee, stampDuty, type ChargeInput } from "../src/lib/loans/property-rules";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ================= Amortisation & prepayment ================= */
const A = (o: Partial<Parameters<typeof amortise>[0]>) => amortise({ principal: 5000000, annualRate: 8.5, months: 240, ...o });
const base = A({});
eq("amort: ₹50L, 8.5%, 20y → EMI ₹43,391.16, interest ₹54,13,879.44", [base.emi, base.months, base.totalInterest], [43391.16, 240, 5413879.44]);
eq("amort: balance ends at exactly 0", base.rows[base.rows.length - 1].closing, 0);
const lumpAfter = A({ plans: [{ amount: 500000, frequency: "once", start: 12 }], timing: "after" });
eq("prepay: ₹5L after EMI 12 → 192 months, interest ₹38,10,188.54", [lumpAfter.months, lumpAfter.totalInterest], [192, 3810188.54]);
const lumpBefore = A({ plans: [{ amount: 500000, frequency: "once", start: 12 }], timing: "before" });
eq("prepay: ₹5L before EMI 12 → interest ₹37,97,570.64 (differs from after)", [lumpBefore.months, lumpBefore.totalInterest], [192, 3797570.64]);
const yearly = A({ plans: [{ amount: 100000, frequency: "yearly", start: 12 }] });
eq("prepay: ₹1L yearly from month 12 → 168 months, ₹35,58,489.71, ₹13L prepaid", [yearly.months, yearly.totalInterest, yearly.totalPrepaid], [168, 3558489.71, 1300000]);
const reduceEmi = A({ plans: [{ amount: 500000, frequency: "once", start: 12 }], strategy: "emi" });
eq("prepay: reduce EMI → 240 months, EMI ₹38,963.93, interest ₹49,04,472.16", [reduceEmi.months, reduceEmi.finalEmi, reduceEmi.totalInterest], [240, 38963.93, 4904472.16]);
const huge = amortise({ principal: 1000000, annualRate: 9, months: 60, plans: [{ amount: 5000000, frequency: "once", start: 3 }] });
eq("prepay: more than outstanding → capped, closes in month 3", [huge.months, huge.totalPrepaid, huge.totalInterest], [3, 959925.86, 22200.94]);
eq("amort: zero interest → ₹10,000 × 12", (() => { const z = amortise({ principal: 120000, annualRate: 0, months: 12 }); return [z.emi, z.months, z.totalInterest]; })(), [10000, 12, 0]);
eq("amort: one-month loan", (() => { const z = amortise({ principal: 100000, annualRate: 12, months: 1 }); return [z.months, z.totalInterest, z.totalPaid]; })(), [1, 1000, 101000]);
eq("amort: 30-year loan ends in 360 months", amortise({ principal: 10000000, annualRate: 9, months: 360 }).months, 360);
eq("prepay: fee 2% on prepaid amount", A({ plans: [{ amount: 500000, frequency: "once", start: 12 }], feePct: 2 }).totalFees, 10000);
eq("prepay: quarterly schedule months", [3, 4, 6, 9, 12].map((m) => plannedFor(m, [{ amount: 1, frequency: "quarterly", start: 3 }])), [1, 0, 1, 1, 1]);
eq("prepay: recurring with an end month", [12, 24, 36].map((m) => plannedFor(m, [{ amount: 5, frequency: "yearly", start: 12, end: 24 }])), [5, 5, 0]);
eq("prepay: EMI that doesn't cover interest is rejected", (() => { try { amortise({ principal: 1000000, annualRate: 12, months: 12, emi: 5000 }); return "no error"; } catch (e) { return (e as Error).message; } })(), "EMI_TOO_LOW");
eq("months to repay: ₹50L at 8.5% with ₹43,391.16", monthsToRepay(5000000, 8.5, 43391.16), 240);
eq("months to repay: EMI below interest → Infinity", monthsToRepay(1000000, 12, 10000), Infinity);
eq("PV of ₹60,000 EMI, 8.5%, 240m → ₹69,13,850.39", r2(principalFromEmi(60000, 8.5, 240)), 6913850.39);
eq("dates: 239 months after Apr 2026 → Mar 2046", monthLabel(addMonths(2026, 4, 239)), "Mar 2046");

/* ================= Loan cost / effective rate ================= */
const pl = loanCost({ principal: 500000, rate: 12, months: 36, feePct: 2, feeFixed: 0, gstPct: 18, otherCharges: 0, deducted: true });
eq("personal: ₹5L, 12%, 36m → EMI ₹16,607.15, interest ₹97,857.40", [pl.emi, r2(pl.totalInterest)], [16607.15, 97857.4]);
eq("personal: 2% fee + 18% GST → net disbursal ₹4,88,200", [pl.fee, pl.gst, pl.net], [10000, 1800, 488200]);
eq("personal: effective annual rate ≈ 14.5588% (nominal 13.6690%)", [r2(pl.apr!.annual), r2(pl.apr!.nominal)], [14.56, 13.67]);
eq("personal: no fees → APR = (1.01)^12 − 1 = 12.6825%", r2(loanCost({ principal: 100000, rate: 12, months: 12, feePct: 0, feeFixed: 0, gstPct: 18, otherCharges: 0, deducted: true }).apr!.annual), 12.68);
eq("IRR: no sign change → null", effectiveAnnualRate([100, 10, 10]), null);

/* ================= LTV & eligibility ================= */
eq("ltv: caps by loan size", [ltvCapFor(3000000), ltvCapFor(3000001), ltvCapFor(7500000), ltvCapFor(7500001)], [90, 80, 80, 75]);
eq("ltv: max loan on ₹32L → ₹28.8L (90%)", maxLoanByLtv(3200000), 2880000);
eq("ltv: max loan on ₹36L → ₹30L (90% band ceiling beats 80%)", maxLoanByLtv(3600000), 3000000);
eq("ltv: max loan on ₹40L → ₹32L (80%)", maxLoanByLtv(4000000), 3200000);
eq("ltv: max loan on ₹1Cr → ₹75L", maxLoanByLtv(10000000), 7500000);
eq("ltv: max loan on ₹2Cr → ₹1.5Cr (75%)", maxLoanByLtv(20000000), 15000000);
const E = (o: Partial<EligibilityInput>) => homeLoanEligibility({ income: 100000, otherIncome: 0, existingEmi: 10000, obligations: 0, coIncome: 50000, coEmi: 5000, age: 35, retireAge: 60, tenureYears: 20, rate: 8.5, foirPct: 50, propertyValue: 10000000, downPayment: 2000000, maxTenureYears: 30, ...o });
const e1 = E({});
eq("eligibility: joint ₹1.5L, EMIs ₹15k, FOIR 50% → EMI room ₹60,000", e1.eligibleEmi, 60000);
eq("eligibility: capacity ₹69,13,850 binds → loan ₹69,13,800", [e1.binding, e1.loan], ["capacity", 6913800]);
eq("eligibility: EMI on the loan", r2(e1.emi), 59999.56);
eq("eligibility: age 52, retire 60 → tenure 8y, capacity ₹41,68,945.52", (() => { const e = E({ age: 52 }); return [e.tenure, r2(e.limits[0].amount)]; })(), [8, 4168945.52]);
eq("eligibility: LTV binds on a ₹60L home", (() => { const e = E({ propertyValue: 6000000, downPayment: 600000 }); return [e.binding, e.loan]; })(), ["ltv", 4800000]);
eq("eligibility: down payment binds", (() => { const e = E({ propertyValue: 10000000, downPayment: 4000000 }); return [e.binding, e.loan]; })(), ["downPayment", 6000000]);
eq("eligibility: obligations above FOIR → nil", E({ existingEmi: 80000 }).loan, 0);
eq("eligibility: already retired → nil", E({ age: 61 }).loan, 0);

/* ================= DTI ================= */
const d = dti({ gross: 150000, net: 120000, otherIncome: 0, housing: 30000, debts: 15000, proposed: 10000, target: 40 });
eq("dti: front 20%, back 30%, net 37.5%", [d.frontEnd, d.backEnd, d.netRatio], [20, 30, 37.5]);
eq("dti: after new EMI 36.67% (gross)", r2(d.proposedBackEnd!), 36.67);
eq("dti: remaining ₹75,000; headroom ₹15,000 to 40%", [d.remaining, d.headroom], [75000, 15000]);
eq("dti: zero income → ratios unavailable, not Infinity", (() => { const z = dti({ gross: 0, net: 0, otherIncome: 0, housing: 1000, debts: 0, proposed: 0, target: 40 }); return [z.backEnd, z.netRatio]; })(), [null, null]);

/* ================= Affordability ================= */
const af = affordability({ income: 100000, otherIncome: 0, expenses: 40000, existingEmi: 10000, cards: 2000, otherObligations: 0, savings: 300000, rate: 10, months: 60, scenarios: [{ label: "Conservative", pct: 30 }, { label: "Balanced", pct: 40 }, { label: "Higher", pct: 50 }] });
eq("afford: surplus ₹48,000, DTI 12%", [af.surplus, af.dtiNow], [48000, 12]);
eq("afford: EMIs 18k / 28k / 38k", af.scenarios.map((s) => s.emi), [18000, 28000, 38000]);
eq("afford: conservative loan = PV(18k, 10%, 60m) ₹8,47,176.64", r2(af.scenarios[0].loan), 847176.64);
eq("afford: emergency cover 300000 ÷ 52000 = 5.77 months", r2(af.emergencyMonths!), 5.77);
eq("afford: surplus caps the EMI", affordability({ income: 50000, otherIncome: 0, expenses: 40000, existingEmi: 0, cards: 0, otherObligations: 0, savings: 0, rate: 10, months: 60, scenarios: [{ label: "x", pct: 50 }] }).scenarios[0].emi, 10000);

/* ================= Rent vs buy ================= */
const RB = (o: Partial<RentBuyInput>) => rentVsBuy({ price: 10000000, appreciation: 5, downPayment: 2000000, rate: 9, tenureYears: 20, stampRegistration: 700000, otherPurchaseCosts: 0, maintenanceMonthly: 3000, propertyTaxYearly: 0, sellingCostPct: 0, rent: 25000, rentIncrease: 5, deposit: 75000, tenantMaintenance: 0, investReturn: 10, inflation: 0, years: 20, ...o });
const rb = RB({});
eq("rvb: EMI ₹71,978.08", r2(rb.emi), 71978.08);
eq("rvb: year 1 buy ₹26,49,816.83 vs rent ₹35,89,251.90", [r2(rb.years[0].buyNetWorth), r2(rb.years[0].rentNetWorth)], [2649816.83, 3589251.9]);
eq("rvb: year 10", [r2(rb.years[9].buyNetWorth), r2(rb.years[9].rentNetWorth)], [10606875.08, 15819126.7]);
eq("rvb: year 20 and never ahead", [r2(rb.buyNetWorth), r2(rb.rentNetWorth), rb.firstAhead], [26532977.05, 46042041.49, null]);
const rb2 = RB({ appreciation: 6, rate: 8.5, otherPurchaseCosts: 100000, propertyTaxYearly: 5000, sellingCostPct: 2, rent: 30000, deposit: 90000, investReturn: 9, inflation: 5, years: 25 });
eq("rvb: 25-year case with costs, inflation, selling cost", [r2(rb2.buyNetWorth), r2(rb2.rentNetWorth)], [47836934.53, 54018668.86]);
eq("rvb: buying ahead when rents are high and returns low", RB({ rent: 70000, investReturn: 6 }).firstAhead !== null, true);
eq("rvb: cash conservation — loan paid off ends EMI", RB({ years: 25 }).years[24].loanBalance, 0);

/* ================= Down payment ================= */
const dp = downPayment({ price: 8000000, mode: "pct", value: 20, maxLtvPct: 80, charges: [{ label: "Stamp duty", amount: 480000 }, { label: "Registration", amount: 30000 }], savings: 2500000, reserve: 300000, rate: 8.5, months: 240 });
eq("down payment: 20% of ₹80L = ₹16L, loan ₹64L", [dp.downPayment, dp.loan], [1600000, 6400000]);
eq("down payment: upfront ₹21.1L, gap +₹90,000", [dp.upfront, dp.gap], [2110000, 90000]);
eq("down payment: raised to meet LTV cap", (() => { const x = downPayment({ price: 8000000, mode: "pct", value: 10, maxLtvPct: 80, charges: [], savings: 0, reserve: 0, rate: 0, months: 0 }); return [x.downPayment, x.raisedByLtv]; })(), [1600000, true]);
eq("down payment: amount mode and shortfall", (() => { const x = downPayment({ price: 1000000, mode: "amount", value: 200000, maxLtvPct: null, charges: [{ label: "Insurance", amount: 50000 }], savings: 100000, reserve: 0, rate: 9, months: 60 }); return [x.downPct, x.gap, r2(x.emi)]; })(), [20, -150000, 16606.68]);

/* ================= Stamp duty & registration ================= */
const C = (o: Partial<ChargeInput>): ChargeInput => ({ stateId: "maharashtra", areaId: "mumbai", type: "residential", buyer: "male", value: 10000000, guidance: 0, date: "2026-11-15", ...o });
const SD = (o: Partial<ChargeInput>) => { const r = stampDuty(C(o)); return r.ok ? r.total : `X: ${r.reason.slice(0, 30)}`; };
const RG = (o: Partial<ChargeInput>) => { const r = registrationFee(C(o)); return r.ok ? r.total : `X: ${r.reason.slice(0, 30)}`; };
eq("stamp: Mumbai, man, ₹1Cr → 5% + 1% metro cess = ₹6,00,000", SD({}), 600000);
eq("stamp: Mumbai, woman → 4% + 1% = ₹5,00,000, concession ₹1,00,000", [SD({ buyer: "female" }), (stampDuty(C({ buyer: "female" })) as { concession: number }).concession], [500000, 100000]);
eq("stamp: Mumbai, joint man + woman → no concession", SD({ buyer: "jointMF" }), 600000);
eq("stamp: guidance value higher → basis ₹1.2Cr → ₹7,20,000", SD({ guidance: 12000000 }), 720000);
eq("stamp: Maharashtra gram panchayat, ₹50L → 4% = ₹2,00,000", SD({ areaId: "mh-gp", value: 5000000 }), 200000);
eq("stamp: Maharashtra other urban, extra levy entered 1% → 6%", (() => { const r = stampDuty({ ...C({ areaId: "mh-urban" }), extraLevyPct: 1 }); return r.ok ? r.total : 0; })(), 600000);
eq("stamp: Delhi man / woman / joint on ₹1Cr", [SD({ stateId: "delhi", areaId: "delhi" }), SD({ stateId: "delhi", areaId: "delhi", buyer: "female" }), SD({ stateId: "delhi", areaId: "delhi", buyer: "jointMF" })], [600000, 400000, 500000]);
eq("stamp: Rajasthan man ₹50L → 6% + 30% surcharge = ₹3,90,000", SD({ stateId: "rajasthan", areaId: "rajasthan", value: 5000000 }), 390000);
eq("stamp: Rajasthan woman ₹50L → ₹3,25,000; SC/ST/BPL ₹2,60,000", [SD({ stateId: "rajasthan", areaId: "rajasthan", value: 5000000, buyer: "female" }), SD({ stateId: "rajasthan", areaId: "rajasthan", value: 5000000, buyer: "femaleSpecial" })], [325000, 260000]);
eq("stamp: Rajasthan joint → unsupported", String(SD({ stateId: "rajasthan", areaId: "rajasthan", buyer: "jointMF" })).startsWith("X:"), true);
eq("stamp: Telangana ULB ₹80L → 5.5% + 1.5% = ₹5,60,000; GP ₹4,40,000", [SD({ stateId: "telangana", areaId: "ts-ulb", value: 8000000 }), SD({ stateId: "telangana", areaId: "ts-gp", value: 8000000 })], [560000, 440000]);
eq("stamp: date before the earliest rule → unsupported", [String(SD({ stateId: "rajasthan", areaId: "rajasthan", date: "2019-06-01" })).startsWith("X:"), String(SD({ stateId: "delhi", areaId: "delhi", date: "2025-01-01" })).startsWith("X:")], [true, true]);
eq("stamp: commercial and land → unsupported", [String(SD({ type: "commercial" })).startsWith("X:"), String(SD({ type: "land" })).startsWith("X:")], [true, true]);
eq("stamp: Tamil Nadu and Haryana stamp duty not calculated", [String(SD({ stateId: "tamil-nadu", areaId: "tn" })).startsWith("X:"), String(SD({ stateId: "haryana", areaId: "haryana" })).startsWith("X:")], [true, true]);
eq("reg: Delhi ₹1Cr → 1% + ₹100 = ₹1,00,100", RG({ stateId: "delhi", areaId: "delhi" }), 100100);
eq("reg: Rajasthan ₹2Cr → 1%, no cap = ₹2,00,000", RG({ stateId: "rajasthan", areaId: "rajasthan", value: 20000000 }), 200000);
eq("reg: Telangana ULB 0.5% / GP 2% on ₹80L", [RG({ stateId: "telangana", areaId: "ts-ulb", value: 8000000 }), RG({ stateId: "telangana", areaId: "ts-gp", value: 8000000 })], [40000, 160000]);
eq("reg: Tamil Nadu 2% on ₹50L", RG({ stateId: "tamil-nadu", areaId: "tn", value: 5000000 }), 100000);
eq("reg: Tamil Nadu woman ₹8L after 1 Apr 2025 → 1%; before → 2%; ₹12L → 2%", [RG({ stateId: "tamil-nadu", areaId: "tn", value: 800000, buyer: "female", date: "2025-05-01" }), RG({ stateId: "tamil-nadu", areaId: "tn", value: 800000, buyer: "female", date: "2025-03-01" }), RG({ stateId: "tamil-nadu", areaId: "tn", value: 1200000, buyer: "female" })], [8000, 16000, 24000]);
eq("reg: Tamil Nadu before 1 Apr 2023 → unsupported", String(RG({ stateId: "tamil-nadu", areaId: "tn", date: "2023-03-31" })).startsWith("X:"), true);
eq("reg: Haryana slabs (+₹200 HARIS): ₹50k, ₹26L, ₹45L, ₹95L", [RG({ stateId: "haryana", areaId: "haryana", value: 50000 }), RG({ stateId: "haryana", areaId: "haryana", value: 2600000 }), RG({ stateId: "haryana", areaId: "haryana", value: 4500000 }), RG({ stateId: "haryana", areaId: "haryana", value: 9500000 })], [300, 15200, 25200, 50200]);
eq("reg: Maharashtra not calculated (unverified)", String(RG({})).startsWith("X:"), true);

/* ================= Formatting ================= */
eq("format: Indian grouping", [inr(12345678), inr(0), inr(-1500)], ["₹1,23,45,678", "₹0", "-₹1,500"]);

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
