// Unit tests for calculators 46–50: FD, RD, Lumpsum, ROI, CAGR.
// Expected values computed independently with 50-digit Decimal arithmetic in Python
// (including a separate implementation of the RD quarterly-posting convention).
import { fd, fdCsv, fdFromForm, type FdForm } from "../src/lib/fd";
import { fdEquivalent, irrAnnual, rd, rdCsv, rdFromForm, type RdForm } from "../src/lib/rd";
import { lumpsum, lumpsumCsv, lumpsumFromForm, type LsForm } from "../src/lib/lumpsum";
import { ROI_EXAMPLES, roiFromForm, type RoiForm } from "../src/lib/roi";
import { cagr, cagrCsv, cagrFromForm, endValue, startValue, type CagrForm } from "../src/lib/cagr";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

/* ================= FD ================= */
const F = (o: Partial<Parameters<typeof fd>[0]> = {}) => fd({ principal: 100000, rate: 7, years: 5, compounding: 4, type: "cumulative", payout: 4, ...o });
eq("fd: ₹1L, 7%, quarterly, 5y", [r2(F().maturity), r2(F().interest)], [141477.82, 41477.82]);
eq("fd: monthly compounding 7.5%, 1y", r2(F({ rate: 7.5, compounding: 12, years: 1 }).maturity), 107763.26);
eq("fd: effective annual yield 7% quarterly", r4(F().effectiveAnnual * 100), 7.1859);
eq("fd: zero interest", [F({ rate: 0 }).maturity, F({ rate: 0 }).interest], [100000, 0]);
eq("fd: short tenure (3 months)", r2(F({ principal: 50000, rate: 6, years: 0.25 }).maturity), 50750);
eq("fd: year rows reconcile", (() => { const r = F({ years: 2.5 }); return [r.years.length, r.years.at(-1)!.to, r2(r.years.reduce((a, y) => a + y.interest, 0)) === r2(r.interest)]; })(), [3, 2.5, true]);
{
  const q = F({ principal: 500000, type: "payout", payout: 4 });
  eq("fd payout: quarterly ₹5L at 7%", [q.payoutAmount, q.payouts, q.interest, q.totalReceived, q.maturity], [8750, 20, 175000, 675000, 500000]);
  eq("fd payout: monthly amount", r4(F({ principal: 500000, type: "payout", payout: 12 }).payoutAmount), 2916.6667);
  const broken = F({ rate: 8, years: 2.5, type: "payout", payout: 1 });
  eq("fd payout: broken period paid pro rata", [broken.payouts, r2(broken.brokenInterest), r2(broken.interest)], [2, 4000, 20000]);
  eq("fd payout: yearly rows", broken.years.map((y) => r2(y.interest)), [8000, 8000, 4000]);
  eq("fd payout: no compounding on payouts", F({ type: "payout", payout: 4 }).interest < F().interest, true);
}
const FF = (o: Partial<FdForm> = {}): FdForm => ({ principal: "200000", rate: "6.8", tenure: "3", unit: "years", compounding: 4, type: "cumulative", payout: 4, senior: false, seniorExtra: "0.5", tds: false, tdsRate: "10", ...o });
eq("fd form: senior citizen extra rate", (() => { const r = fdFromForm(FF({ senior: true })); return r.status === "ok" && [r.result.input.rate, r2(r.result.maturity)]; })(), [7.3, 248475.18]);
eq("fd form: months and days units", (() => { const a = fdFromForm(FF({ tenure: "18", unit: "months" })); const b = fdFromForm(FF({ tenure: "365", unit: "days" })); return a.status === "ok" && b.status === "ok" && [a.result.input.years, b.result.input.years]; })(), [1.5, 1]);
eq("fd form: tax estimate only when enabled", (() => { const off = fdFromForm(FF()); const on = fdFromForm(FF({ tds: true })); return off.status === "ok" && on.status === "ok" && [off.result.tax, r2(on.result.tax!), r2(on.result.interest / 10)]; })(), [null, 4483.95, 4483.95]);
eq("fd form: invalid principal/rate/tenure", [fdFromForm(FF({ principal: "0" })).status, fdFromForm(FF({ principal: "-5" })).status, fdFromForm(FF({ rate: "-1" })).status, fdFromForm(FF({ tenure: "0" })).status, fdFromForm(FF({ tenure: "3", unit: "days" })).status, fdFromForm(FF({ rate: "abc" })).status], ["error", "error", "error", "error", "error", "error"]);
eq("fd form: zero rate allowed with note", (() => { const r = fdFromForm(FF({ rate: "0" })); return r.status === "ok" && [r.result.interest, r.notes.length > 0]; })(), [0, true]);
eq("fd form: empty", fdFromForm(FF({ principal: "" })).status, "empty");
eq("fd csv", fdCsv(F({ years: 2 }), "INR").split("\n")[2], "1,7185.90,107185.90");

/* ================= RD ================= */
const R = (o: Partial<Parameters<typeof rd>[0]> = {}) => rd({ monthly: 5000, rate: 7, months: 12, mode: "quarterly", timing: "begin", ...o });
eq("rd: ₹5,000 × 12 @7%, quarterly, start of month", [r2(R().maturity), R().deposited, R().instalments], [62312.05, 60000, 12]);
eq("rd: end of month", r2(R({ timing: "end" }).maturity), 61952.75);
eq("rd: 5 years", r2(R({ months: 60 }).maturity), 359671.95);
eq("rd: part quarter (13 months)", r2(R({ monthly: 2000, rate: 6.5, months: 13 }).maturity), 27003.25);
eq("rd: within ₹2 of the fractional-quarter bank formula", Math.abs(R().maturity - 62310.66) < 2, true);
eq("rd: monthly approximation (closed form)", [r2(R({ mode: "monthly" }).maturity), r2(R({ mode: "monthly", timing: "end" }).maturity)], [62324.38, 61962.93]);
eq("rd: zero interest = PMT × n", [R({ rate: 0 }).maturity, R({ rate: 0, mode: "monthly" }).maturity], [60000, 60000]);
{
  const r = R({ months: 30 });
  eq("rd: schedule consistent with instalments", [r.months.length, r.months.at(-1)!.deposited, r.years.map((y) => y.months)], [30, 150000, [12, 12, 6]]);
  eq("rd: interest credited only at quarter ends + maturity", r.months.filter((m) => m.interestCredited > 0).map((m) => m.month), [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
  eq("rd: credited interest sums to total", r2(r.months.reduce((a, m) => a + m.interestCredited, 0)) === r2(r.interest), true);
}
eq("rd: IRR reproduces maturity (monthly mode = 7.229% effective)", r4(irrAnnual(5000, 12, R({ mode: "monthly" }).maturity, "begin") * 100), r4((Math.pow(1 + 7 / 1200, 12) - 1) * 100));
eq("rd: FD with the same total upfront", r2(fdEquivalent(60000, 7, 12)), 64311.54);
const RF = (o: Partial<RdForm> = {}): RdForm => ({ monthly: "5000", rate: "7", tenure: "1", unit: "years", mode: "quarterly", timing: "begin", ...o });
eq("rd form: years → months, fractional rounded with note", (() => { const r = rdFromForm(RF({ tenure: "1.4" })); return r.status === "ok" && [r.result.instalments, r.notes.some((n) => n.includes("17 instalments"))]; })(), [17, true]);
eq("rd form: validation", [rdFromForm(RF({ monthly: "0" })).status, rdFromForm(RF({ rate: "-2" })).status, rdFromForm(RF({ tenure: "0" })).status, rdFromForm(RF({ tenure: "51" })).status], ["error", "error", "error", "error"]);
eq("rd csv", rdCsv(R({ months: 3 }), "INR").split("\n")[4].startsWith("3,15000.00,"), true);

/* ================= Lumpsum ================= */
const L = (o: Partial<Parameters<typeof lumpsum>[0]> = {}) => lumpsum({ amount: 100000, rate: 12, years: 10, compounding: 1, inflation: null, ...o });
eq("ls: ₹1L, 12%, 10y, yearly", [r2(L().value), r2(L().gain), r2(L().totalReturnPct)], [310584.82, 210584.82, 210.58]);
eq("ls: inflation-adjusted (6%)", [r2(L({ inflation: 6 }).real!), r4(L({ inflation: 6 }).realAnnual! * 100)], [173428.94, r4((1.12 / 1.06 - 1) * 100)]);
eq("ls: monthly compounding, fractional 7.5y", r2(L({ amount: 500000, rate: 10, years: 7.5, compounding: 12 }).value), 1055215.56);
eq("ls: zero return", [L({ rate: 0 }).value, L({ rate: 0 }).gain], [100000, 0]);
eq("ls: negative return", r2(L({ rate: -5, years: 3 }).value), 85737.5);
eq("ls: compounding order (yearly < half-yearly < quarterly < monthly)", (() => { const v = ([1, 2, 4, 12] as const).map((m) => L({ compounding: m }).value); return v.every((x, i) => i === 0 || x > v[i - 1]); })(), true);
eq("ls: year rows end at FV", r2(L({ years: 2.5 }).years.at(-1)!.value) === r2(L({ years: 2.5 }).value), true);
const LF = (o: Partial<LsForm> = {}): LsForm => ({ amount: "100000", rate: "12", years: "10", compounding: 1, inflation: "", ...o });
eq("ls form: validation", [lumpsumFromForm(LF({ amount: "0" })).status, lumpsumFromForm(LF({ rate: "-60" })).status, lumpsumFromForm(LF({ years: "0" })).status, lumpsumFromForm(LF({ inflation: "-1" })).status], ["error", "error", "error", "error"]);
eq("ls form: below-inflation note", (() => { const r = lumpsumFromForm(LF({ rate: "4", inflation: "6" })); return r.status === "ok" && r.notes.some((n) => n.includes("purchasing power")); })(), true);
eq("ls csv with inflation column", lumpsumCsv(L({ inflation: 6, years: 1 }), "INR").split("\n")[1], "Year,Estimated value,Estimated gain,Value in today's money");

/* ================= ROI ================= */
const RO = (o: Partial<RoiForm> = {}): RoiForm => ({ label: "", cost: "200000", value: "270000", entry: "received", expenses: "", years: "", months: "", singleFlow: true, ...o });
const roi = (o: Partial<RoiForm> = {}) => {
  const r = roiFromForm(RO(o));
  return r.status === "ok" ? r.result : r.status;
};
type RR = Exclude<ReturnType<typeof roi>, string>;
eq("roi: positive", [(roi() as RR).gain, (roi() as RR).roi, (roi() as RR).status], [70000, 35, "profit"]);
eq("roi: with additional expenses", [(roi({ expenses: "50000" }) as RR).totalCost, (roi({ expenses: "50000" }) as RR).gain, (roi({ expenses: "50000" }) as RR).roi], [250000, 20000, 8]);
eq("roi: loss", [(roi({ value: "150000" }) as RR).roi, (roi({ value: "150000" }) as RR).status], [-25, "loss"]);
eq("roi: zero gain", [(roi({ value: "200000" }) as RR).roi, (roi({ value: "200000" }) as RR).status], [0, "breakeven"]);
eq("roi: net-profit entry (expenses ignored)", [(roi({ entry: "profit", value: "50000", expenses: "99999" }) as RR).roi, (roi({ entry: "profit", value: "-50000" }) as RR).roi], [25, -25]);
eq("roi: zero investment rejected", roi({ cost: "0" }), "error");
eq("roi: annualised over 3 years", r4((roi({ years: "3" }) as RR).annualised!), 10.5209);
eq("roi: years + months", (roi({ years: "1", months: "6" }) as RR).years, 1.5);
eq("roi: annualised withheld with intermediate cash flows", (() => { const r = roi({ years: "3", singleFlow: false }) as RR; return [r.annualised, Boolean(r.annualisedNote?.includes("XIRR"))]; })(), [null, true]);
eq("roi: invalid duration", [roi({ months: "12" }), roi({ years: "-1" })], ["error", "error"]);
eq("roi: total loss annualises to −100%", (roi({ value: "0", years: "2" }) as RR).annualised, -100);
eq("roi: loss larger than cost rejected", roi({ entry: "profit", value: "-300000" }), "error");
eq("roi: every example fills valid inputs", ROI_EXAMPLES.every((e) => roiFromForm(RO(e.form)).status === "ok"), true);

/* ================= CAGR ================= */
eq("cagr: formula", [r4(cagr(100000, 250000, 5)), r4(cagr(500, 400, 3)), cagr(100, 100, 4)], [20.1124, -7.1682, 0]);
eq("cagr: reverse end/start", [r2(endValue(100000, 12, 7.5)), r2(startValue(1000000, 9, 10))], [233956.53, 422410.81]);
eq("cagr: round trip", r4(cagr(100000, endValue(100000, 13.37, 6.25), 6.25)), 13.37);
const C = (o: Partial<CagrForm> = {}): CagrForm => ({ mode: "rate", start: "100000", end: "250000", rate: "", years: "5", months: "", ...o });
const cf = (o: Partial<CagrForm> = {}) => {
  const r = cagrFromForm(C(o));
  return r.status === "ok" ? r.result : r.status;
};
type CR = Exclude<ReturnType<typeof cf>, string>;
eq("cagr form: rate mode", [r4((cf() as CR).cagr), (cf() as CR).gain, (cf() as CR).totalGrowthPct], [20.1124, 150000, 150]);
eq("cagr form: years + months", (cf({ years: "7", months: "6", mode: "end", rate: "12" }) as CR).years, 7.5);
eq("cagr form: end mode", r2((cf({ mode: "end", rate: "12", years: "7", months: "6" }) as CR).end), 233956.53);
eq("cagr form: start mode", r2((cf({ mode: "start", end: "1000000", rate: "9", years: "10" }) as CR).start), 422410.81);
eq("cagr form: months only (fractional year)", r4((cf({ years: "", months: "6", end: "110000" }) as CR).cagr), r4((Math.pow(1.1, 2) - 1) * 100));
eq("cagr form: invalid values", [cf({ start: "0" }), cf({ end: "-5" }), cf({ years: "0", months: "0" }), cf({ mode: "end", rate: "-100" }), cf({ months: "13" })], ["error", "error", "error", "error", "error"]);
eq("cagr form: empty", cf({ end: "" }), "empty");
eq("cagr: projection ends at end value", (() => { const r = cf({ years: "2", months: "6" }) as CR; return [r.projection.length, r2(r.projection.at(-1)!.value) === r2(r.end)]; })(), [4, true]);
eq("cagr csv", cagrCsv(cf({ years: "1" }) as CR).trim().split("\n").slice(2), ["0,100000.00", "1,250000.00"]);

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
