// Unit tests for calculators 51–55: XIRR, SWP, PPF, Inflation, Retirement.
// Expected values from independent 50-digit Decimal implementations in Python,
// Microsoft's documented Excel XIRR example, and the PPF Scheme 2019 rules.
import { benchmarkGap, normaliseDate, parsePasted, signChanges, solveXirr, xirrFromTxns, XIRR_SAMPLE, type Txn } from "../src/lib/xirr";
import { swp, swpFromForm, periodsToText, type SwpForm } from "../src/lib/swp";
import { fyLabel, fyOf, ppfFromForm, simulate, type PpfForm } from "../src/lib/ppf";
import { PPF_RULES } from "../src/lib/india/ppf-rules";
import { inflation, inflationFromForm, type InflationForm } from "../src/lib/inflation";
import { retirement, retirementFromForm, RET_DEFAULTS, type RetForm } from "../src/lib/retirement";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

/* ================= XIRR ================= */
let id = 0;
const T = (date: string, type: Txn["type"], amount: number | string, note = ""): Txn => ({ id: String(id++), date, type, amount: String(amount), note });
const X = (txns: Txn[]) => {
  const r = xirrFromTxns(txns);
  return r.status === "ok" ? r.result : r.status === "error" ? `ERR ${r.message}` : "empty";
};
type XR = Exclude<ReturnType<typeof X>, string>;
const ms = [T("2008-01-01", "invest", 10000), T("2008-03-01", "withdraw", 2750), T("2008-10-30", "withdraw", 4250), T("2009-02-15", "withdraw", 3250), T("2009-04-01", "withdraw", 2750)];
eq("xirr: leap year counts 366 days (Excel convention)", r6((X([T("2020-01-01", "invest", 100), T("2021-01-01", "withdraw", 110)]) as XR).xirr / 100), r6(Math.pow(1.1, 365 / 366) - 1));
eq("xirr: Microsoft Excel documentation example = 37.3363%", r6((X(ms) as XR).xirr / 100), 0.373363);
eq("xirr: order of rows doesn't matter", r6((X([...ms].reverse()) as XR).xirr), r6((X(ms) as XR).xirr));
eq("xirr: regular annual investment", r6((X([T("2020-01-01", "invest", 1000), T("2021-01-01", "invest", 1000), T("2022-01-01", "invest", 1000), T("2023-01-01", "withdraw", 3500)]) as XR).xirr / 100), 0.079042);
eq("xirr: 365-day year → exactly 10%", r6((X([T("2021-01-01", "invest", 100), T("2022-01-01", "withdraw", 110)]) as XR).xirr), 10);
eq("xirr: negative XIRR", r6((X([T("2020-01-01", "invest", 100), T("2022-01-01", "withdraw", 80)]) as XR).xirr / 100), -0.105436);
eq("xirr: zero XIRR", r6((X([T("2020-01-01", "invest", 100), T("2023-06-01", "withdraw", 100)]) as XR).xirr), 0);
eq("xirr: irregular monthly sample (with a partial redemption)", r6((X(XIRR_SAMPLE.map((t) => ({ ...t, id: String(id++) }))) as XR).xirr / 100), 0.110241);
{
  const same = X([T("2021-01-01", "invest", 600), T("2021-01-01", "invest", 400), T("2022-01-01", "withdraw", 1100)]) as XR;
  eq("xirr: multiple transactions on the same date", [r6(same.xirr), same.count, same.invested], [10, 3, 1000]);
}
{
  const r = X(ms) as XR;
  eq("xirr: summary", [r.invested, r.withdrawn, r.net, r.first, r.last, r.days, r.count], [10000, 13000, 3000, "2008-01-01", "2009-04-01", 456, 5]);
}
eq("xirr: needs an investment", String(X([T("2020-01-01", "withdraw", 100), T("2021-01-01", "withdraw", 100)])).startsWith("ERR Add at least one investment"), true);
eq("xirr: needs a withdrawal", String(X([T("2020-01-01", "invest", 100), T("2021-01-01", "invest", 100)])).startsWith("ERR Add at least one withdrawal"), true);
eq("xirr: invalid date", String(X([T("2021-02-30", "invest", 100), T("2022-01-01", "withdraw", 110)])).includes("Row 1: enter a valid date"), true);
eq("xirr: invalid amount", String(X([T("2021-01-01", "invest", "abc"), T("2022-01-01", "withdraw", 110)])).includes("Row 1"), true);
eq("xirr: same date only", String(X([T("2021-01-01", "invest", 100), T("2021-01-01", "withdraw", 110)])).includes("same date"), true);
eq("xirr: multiple roots reported, not guessed", (() => { const r = String(X([T("2021-01-01", "invest", 100), T("2022-01-01", "withdraw", 230), T("2023-01-01", "invest", 132)])); return r.includes("more than one valid XIRR") && r.includes("10.00%") && r.includes("20.00%"); })(), true);
eq("xirr: no solution reported", String(X([T("2020-01-01", "invest", 100), T("2021-01-01", "withdraw", 50), T("2022-01-01", "invest", 100), T("2023-01-01", "withdraw", 0.0001)])).startsWith("ERR"), true);
eq("xirr: solver returns null when NPV never crosses zero", solveXirr([{ t: 0, cf: -100 }, { t: 1, cf: -5 }]), null);
eq("xirr: sign changes", [signChanges([-1, -1, 2]), signChanges([-1, 2, -1, 3]), signChanges([-1, 0, 2])], [1, 3, 1]);
eq("xirr: benchmark gap positive when beating benchmark", [benchmarkGap(X(ms) as XR, 10) > 0, benchmarkGap(X(ms) as XR, 50) < 0, Math.abs(benchmarkGap(X(ms) as XR, (X(ms) as XR).xirr)) < 1e-6], [true, true, true]);
eq("xirr: date formats", ["2024-03-15", "15/03/2024", "15-03-2024", "15.03.2024", "15-Mar-2024", "15 March 2024", "31/02/2024", "nope"].map(normaliseDate), ["2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15", "2024-03-15", null, null]);
{
  const p = parsePasted("Date\tAmount\n05/04/2021\t-50,000\tLumpsum\n15-Nov-2026\t1,42,500\tValue\n\nbad row");
  eq("xirr: paste from spreadsheet (header + bad rows skipped)", [p.txns.map((t) => [t.date, t.type, t.amount, t.note]), p.skipped], [[["2021-04-05", "invest", "50000", "Lumpsum"], ["2026-11-15", "withdraw", "142500", "Value"]], [1, 5]]);
  eq("xirr: CSV paste with parentheses for negatives", parsePasted("2021-01-01,(1000)\n2022-01-01,1100").txns.map((t) => t.type), ["invest", "withdraw"]);
}
{
  const big = Array.from({ length: 1500 }, (_, k) => T(`20${String(10 + Math.floor(k / 365)).padStart(2, "0")}-01-01`.replace(/-01-01$/, `-${String((k % 12) + 1).padStart(2, "0")}-${String((k % 28) + 1).padStart(2, "0")}`), "invest", 1000));
  big.push(T("2026-11-15", "withdraw", 2_500_000));
  const t0 = Date.now();
  const r = X(big);
  eq("xirr: 1,500 transactions solve quickly", [typeof r === "object", Date.now() - t0 < 3000], [true, true]);
}

/* ================= SWP ================= */
const S = (o: Partial<Parameters<typeof swp>[0]> = {}) => swp({ corpus: 1000000, withdrawal: 10000, annualReturn: 8, frequency: 12, timing: "end", years: 10, stepUp: 0, inflation: null, ...o });
eq("swp: corpus survives (end of month)", [r2(S().remaining), S().totalWithdrawn, S().exhaustedAt, S().withdrawals], [357682.27, 1200000, null, 120]);
eq("swp: beginning of month", r2(S({ timing: "begin" }).remaining), 346093.02);
{
  const r = S({ withdrawal: 20000, years: 30 });
  eq("swp: corpus exhausted (partial last payment)", [r.exhaustedAt, r2(r.totalWithdrawn), r.remaining, r.lastPartial! > 0 && r.lastPartial! < 20000], [61, 1210502.21, 0, true]);
  eq("swp: balance never negative", r.periods.every((p) => p.balance >= 0), true);
}
eq("swp: zero return — exhausted exactly at 60 withdrawals", (() => { const r = S({ corpus: 600000, annualReturn: 0 }); return [r.exhaustedAt, r.totalWithdrawn, r.lastPartial, r.totalGrowth]; })(), [60, 600000, null, 0]);
eq("swp: quarterly", r2(S({ withdrawal: 30000, frequency: 4 }).remaining), 369221.96);
eq("swp: yearly with 6% annual increase", (() => { const r = S({ withdrawal: 60000, frequency: 1, stepUp: 6 }); return [r2(r.remaining), r2(r.totalWithdrawn)]; })(), [1054693.1, 790847.7]);
eq("swp: effective-annual periodic rate", r6(Math.pow(1 + S().periodicRate, 12)), 1.08);
eq("swp: negative return shrinks corpus", S({ annualReturn: -5, withdrawal: 1 }).remaining < 1000000, true);
eq("swp: real (today's money) balance with inflation", r2(S({ inflation: 6 }).realRemaining!), r2(357682.27 / Math.pow(1.06, 10)));
eq("swp: growth + withdrawals reconcile", (() => { const r = S(); return r2(r.corpus + r.totalGrowth - r.totalWithdrawn - r.remaining); })(), 0);
const SF = (o: Partial<SwpForm> = {}): SwpForm => ({ corpus: "1000000", withdrawal: "10000", annualReturn: "8", frequency: 12, timing: "end", years: "10", stepUp: "", inflation: "", linkToInflation: false, ...o });
eq("swp form: inflation-linked increase", (() => { const r = swpFromForm(SF({ inflation: "6", linkToInflation: true })); return r.status === "ok" && r.result.input.stepUp; })(), 6);
eq("swp form: validation", [swpFromForm(SF({ corpus: "0" })).status, swpFromForm(SF({ withdrawal: "-1" })).status, swpFromForm(SF({ annualReturn: "-60" })).status, swpFromForm(SF({ years: "0" })).status, swpFromForm(SF({ linkToInflation: true })).status], ["error", "error", "error", "error", "error"]);
eq("swp: duration text", [periodsToText(61, 12), periodsToText(4, 4), periodsToText(1, 12)], ["5 years 1 month", "1 year", "1 month"]);

/* ================= PPF ================= */
const today = { year: 2026, month: 11 };
eq("ppf: rules from the 2019 scheme", [PPF_RULES.minDepositPerFY, PPF_RULES.maxDepositPerFY, PPF_RULES.depositMultiple, PPF_RULES.maturityFinancialYears, PPF_RULES.extensionBlockYears, PPF_RULES.interestCutoffDay], [500, 150000, 50, 15, 5, 5]);
eq("ppf: financial years", [fyOf(2026, 3), fyOf(2026, 4), fyLabel(2026), fyLabel(1999)], [2025, 2026, "2026-27", "1999-00"]);
const sch = (o = {}) => ({ amount: 150000, frequency: "yearly" as const, depositMonth: 4, byFifth: true, ...o });
eq("ppf: 15 April deposits of ₹1.5L at 7.1% = ₹40,68,209 (annual compounding equivalent)", r2(simulate({ startFY: 2026, endFY: 2040, depositUntilFY: 2040, balance: 0, rate: 7.1, schedule: sch(), maturityFY: 2040 }).at(-1)!.closing), 4068209.22);
{
  const m = simulate({ startFY: 2026, endFY: 2026, depositUntilFY: 2026, balance: 0, rate: 7.1, schedule: sch({ amount: 12500, frequency: "monthly" }), maturityFY: 2040 })[0];
  const late = simulate({ startFY: 2026, endFY: 2026, depositUntilFY: 2026, balance: 0, rate: 7.1, schedule: sch({ amount: 12500, frequency: "monthly", byFifth: false }), maturityFY: 2040 })[0];
  eq("ppf: monthly deposits by the 5th", r2(m.interest), 5768.75);
  eq("ppf: deposits after the 5th miss that month's interest", r2(late.interest), 4881.25);
  eq("ppf: interest credited at FY end only", [m.deposits, r2(m.closing)], [150000, 155768.75]);
}
eq("ppf: yearly deposit after the 5th in April earns 11 months", r2(simulate({ startFY: 2026, endFY: 2026, depositUntilFY: 2026, balance: 0, rate: 7.1, schedule: sch({ byFifth: false }), maturityFY: 2040 })[0].interest), r2((150000 * 0.071 * 11) / 12));
const PF = (o: Partial<PpfForm> = {}): PpfForm => ({ account: "new", openMonth: "4", openYear: "2026", openedFY: "2020", balance: "", amount: "150000", frequency: "yearly", depositMonth: 4, byFifth: true, rate: "7.1", blocks: 1, ...o });
{
  const r = ppfFromForm(PF(), today);
  const res = r.status === "ok" ? r.result : null;
  eq("ppf: account opened Apr 2026 matures 1 April 2042 after 16 financial years", [res?.maturityDate, res?.term.length, res?.term[0].label, res?.term.at(-1)!.label], ["1 April 2042", 16, "2026-27", "2041-42"]);
  eq("ppf: maturity value (16 deposits)", r2(res!.atMaturity!.balance), r2(simulate({ startFY: 2026, endFY: 2041, depositUntilFY: 2041, balance: 0, rate: 7.1, schedule: sch(), maturityFY: 2041 }).at(-1)!.closing));
  eq("ppf: deposits + interest = balance", r2(res!.atMaturity!.deposits + res!.atMaturity!.interest), r2(res!.atMaturity!.balance));
  eq("ppf: extension with deposits (5 more FYs)", [res!.withDeposits.years.length, res!.withDeposits.years[0].label, res!.withDeposits.deposits], [5, "2042-43", 750000]);
  eq("ppf: extension without deposits earns interest only", [res!.withoutDeposits.years.every((y) => y.deposits === 0), r2(res!.withoutDeposits.balance), res!.withDeposits.balance > res!.withoutDeposits.balance], [true, r2(res!.atMaturity!.balance * Math.pow(1.071, 5)), true]);
}
{
  const r = ppfFromForm(PF({ openMonth: "11" }), today);
  const res = r.status === "ok" ? r.result : null;
  eq("ppf: opened mid-year (Nov) — first deposit in November, earns 5 months", [res?.term[0].deposits, r2(res!.term[0].interest)], [150000, r2((150000 * 0.071 * 5) / 12)]);
}
{
  const r = ppfFromForm(PF({ account: "existing", openedFY: "2018", balance: "800000" }), today);
  const res = r.status === "ok" ? r.result : null;
  eq("ppf: existing account with opening balance", [res?.startFY, res?.maturityDate, res?.term.length, res?.atMaturity?.openingBalance], [2026, "1 April 2034", 8, 800000]);
}
eq("ppf: matured account shows extension only", (() => { const r = ppfFromForm(PF({ account: "existing", openedFY: "2005", balance: "2500000" }), today); return r.status === "ok" && [r.result.alreadyMatured, r.result.atMaturity, r.result.withDeposits.years[0].label]; })(), [true, null, "2026-27"]);
eq("ppf: contribution limits", [ppfFromForm(PF({ amount: "150050" }), today).status, ppfFromForm(PF({ amount: "12550", frequency: "monthly" }), today).status, ppfFromForm(PF({ amount: "40", frequency: "monthly" }), today).status, ppfFromForm(PF({ amount: "1025" }), today).status, ppfFromForm(PF({ amount: "450" }), today).status], ["error", "error", "error", "error", "error"]);
eq("ppf: limit message names the rule", (() => { const r = ppfFromForm(PF({ amount: "13000", frequency: "monthly" }), today); return r.status === "error" && r.message.includes("1,50,000"); })(), true);

/* ================= Inflation ================= */
eq("inf: future cost", [r2(inflation("future", 100000, 6, 10).futureCost), r2(inflation("future", 100000, 6, 10).increasePct)], [179084.77, 79.08]);
eq("inf: present value", r2(inflation("present", 100000, 6, 10).presentValue), 55839.48);
eq("inf: purchasing power left", r2(inflation("future", 100, 6, 10).powerLeft * 100), 55.84);
eq("inf: fractional years", r2(inflation("future", 50000, 7, 2.5).futureCost), 59214.69);
eq("inf: zero inflation", inflation("future", 1000, 0, 5).futureCost, 1000);
eq("inf: deflation", inflation("future", 1000, -2, 5).futureCost < 1000, true);
eq("inf: rows", (() => { const r = inflation("future", 100, 10, 2.5); return [r.rows.length, r2(r.rows.at(-1)!.cost)]; })(), [4, r2(100 * Math.pow(1.1, 2.5))]);
const IF = (o: Partial<InflationForm> = {}): InflationForm => ({ mode: "future", amount: "100000", rate: "6", years: "10", fromYear: "2010", toYear: "2026", ...o });
eq("inf form: years mode", (() => { const r = inflationFromForm(IF({ mode: "years" })); return r.status === "ok" && [r.result.years, r.result.rows[0].label, r.result.rows.at(-1)!.label]; })(), [16, "2010", "2026"]);
eq("inf form: validation", [inflationFromForm(IF({ amount: "0" })).status, inflationFromForm(IF({ rate: "-20" })).status, inflationFromForm(IF({ years: "0" })).status, inflationFromForm(IF({ mode: "years", toYear: "2005" })).status], ["error", "error", "error", "error"]);

/* ================= Retirement ================= */
const RF = (o: Partial<RetForm> = {}): RetForm => ({ ...RET_DEFAULTS, ...o });
const R = (o: Partial<RetForm> = {}) => {
  const r = retirementFromForm(RF(o));
  return r.status === "ok" ? r.result : `ERR ${r.status === "error" ? r.message : "empty"}`;
};
type RR = Exclude<ReturnType<typeof R>, string>;
{
  const r = R() as RR;
  eq("ret: default plan (independent model)", [r2(r.required), r2(r.projected), r2(r.extraMonthly!), r2(r.expenseAtRetirement)], [74806968.81, 58506142.36, 4911.72, 287174.56]);
  eq("ret: years", [r.yearsToRetire, r.yearsInRetirement], [30, 25]);
  eq("ret: accumulation reconciles", r2(500000 + r.totalContributions + r.investmentGrowth), r2(r.projected));
  eq("ret: shortfall → corpus runs out before life expectancy", r.runsOutAtAge !== null && r.runsOutAtAge < 85, true);
}
{
  const r = R({ age: "55", retireAge: "60", lifeExpectancy: "80", monthlyExpense: "40000", corpus: "2000000", monthlyContribution: "20000", stepUp: "0", preReturn: "8", postReturn: "5", inflation: "6" }) as RR;
  eq("ret: post-retirement return below inflation", [r2(r.required), r2(r.projected), r2(r.extraMonthly!)], [13768526.45, 4406935.72, 127517.82]);
}
{
  const r = R({ age: "40", retireAge: "60", lifeExpectancy: "80", monthlyExpense: "20000", corpus: "10000000", monthlyContribution: "50000", stepUp: "5", preReturn: "10", postReturn: "7", inflation: "5" }) as RR;
  eq("ret: surplus", [r2(r.required), r2(r.projected), r.gap < 0, r.extraMonthly, r.runsOutAtAge], [10383931.82, 118775102.13, true, null, null]);
}
{
  const r = R({ age: "60", retireAge: "60", lifeExpectancy: "85", monthlyExpense: "50000", corpus: "30000000", monthlyContribution: "0", stepUp: "0", preReturn: "8", postReturn: "7", inflation: "6", otherIncome: "10000", otherIncomeIndexed: true, oneTime: "500000" }) as RR;
  eq("ret: retiring now, other income + one-time expense", [r2(r.required), r.projected, r.extraMonthly, r.yearsToRetire], [10919720.91, 30000000, null, 0]);
}
eq("ret: fixed (non-indexed) income needs a bigger corpus than indexed", (() => { const a = R({ otherIncome: "20000", otherIncomeIndexed: true }) as RR; const b = R({ otherIncome: "20000", otherIncomeIndexed: false }) as RR; return b.required > a.required; })(), true);
eq("ret: contribution increase raises projection", (R({ stepUp: "10" }) as RR).projected > (R({ stepUp: "0" }) as RR).projected, true);
eq("ret: required corpus exactly funds the plan", (() => { const r = retirement({ age: 30, retireAge: 60, lifeExpectancy: 85, monthlyExpense: 50000, corpus: 0, monthlyContribution: 0, stepUp: 0, preReturn: 10, postReturn: 7, inflation: 6, otherIncome: 0, otherIncomeIndexed: true, oneTime: 0 }); const v = retirement({ age: 60, retireAge: 60, lifeExpectancy: 85, monthlyExpense: r.expenseAtRetirement, corpus: r.required, monthlyContribution: 0, stepUp: 0, preReturn: 10, postReturn: 7, inflation: 6, otherIncome: 0, otherIncomeIndexed: true, oneTime: 0 }); return [v.runsOutAtAge, Math.abs(v.leftAtEnd) < 1]; })(), [null, true]);
eq("ret: invalid ages and assumptions", [R({ age: "15" }), R({ retireAge: "25" }), R({ lifeExpectancy: "55" }), R({ monthlyExpense: "0" }), R({ postReturn: "-20" }), R({ inflation: "30" }), R({ corpus: "-1" })].map((x) => typeof x === "string" && x.startsWith("ERR")), [true, true, true, true, true, true, true]);
eq("ret: notes for low post-return", (() => { const r = retirementFromForm(RF({ postReturn: "4" })); return r.status === "ok" && r.notes.some((n) => n.includes("below inflation")); })(), true);

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
