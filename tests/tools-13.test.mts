// Unit tests for calculators 41–45: SIP, Compound Interest, BMI, GPA & CGPA, Tip & Bill Split.
// Expected values were computed independently with 50-digit Decimal arithmetic in Python.
import { fixedSipValue, monthlyRate, sip, sipCsv, sipFromForm, type SipForm } from "../src/lib/sip";
import { compound, compoundCsv, compoundFromForm, depositTimes, type CiForm } from "../src/lib/compound";
import { bmiFromForm, category, healthyRange, round1, type BmiForm } from "../src/lib/bmi";
import { SCALES, computeCgpa, computeGpa, toPercent, FORMULAS, fixed, type Subject, type Semester } from "../src/lib/gpa";
import { pctOf, tip, type TipForm } from "../src/lib/tip";

let fails = 0;
let passes = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passes++;
  else fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;

/* ================= SIP ================= */
const S = (o: Partial<Parameters<typeof sip>[0]> = {}) => sip({ monthly: 10000, annualReturn: 12, months: 120, timing: "end", stepUp: 0, rateMode: "effective", ...o });
eq("sip: effective monthly rate compounds to 12%", r2(Math.pow(1 + monthlyRate(12, "effective"), 12) * 100), 112);
eq("sip: 10k/month, 12%, 10y, end", [r2(S().value), S().invested, S().instalments], [2219300.41, 1200000, 120]);
eq("sip: beginning of month", r2(S({ timing: "begin" }).value), 2240358.9);
eq("sip: nominal rate, end", r2(S({ rateMode: "nominal" }).value), 2300386.89);
eq("sip: nominal + beginning = common Indian calculator figure (₹23,23,391)", Math.round(S({ rateMode: "nominal", timing: "begin" }).value), 2323391);
eq("sip: matches closed form (end & begin)", [r2(fixedSipValue(10000, monthlyRate(12, "effective"), 120, "end")), r2(fixedSipValue(10000, monthlyRate(12, "effective"), 120, "begin"))], [2219300.41, 2240358.9]);
eq("sip: zero return = total invested", [S({ monthly: 5000, annualReturn: 0, months: 60 }).value, fixedSipValue(5000, 0, 60, "begin")], [300000, 300000]);
eq("sip: zero investment", [S({ monthly: 0 }).value, S({ monthly: 0 }).returns], [0, 0]);
eq("sip: negative return loses value", [r2(S({ annualReturn: -5, months: 36 }).value), S({ annualReturn: -5, months: 36 }).returns < 0], [334382.98, true]);
{
  const st = S({ stepUp: 10 });
  eq("sip: step-up 10% a year", [r2(st.value), r2(st.invested), r2(st.lastInstalment)], [3238172.14, 1912490.95, r2(10000 * 1.1 ** 9)]);
  eq("sip: step-up year 2 instalment", r2(st.years[1].monthly), 11000);
}
eq("sip: part year (30 months)", [r2(S({ monthly: 1000, months: 30 }).value), S({ monthly: 1000, months: 30 }).years.map((y) => y.instalments)], [34517.79, [12, 12, 6]]);
eq("sip: year rows reconcile", (() => { const r = S({ stepUp: 7 }); const y = r.years.at(-1)!; return [r2(y.value) === r2(r.value), r2(r.years.reduce((a, x) => a + x.investedInYear, 0)) === r2(r.invested)]; })(), [true, true]);
const SF = (o: Partial<SipForm> = {}): SipForm => ({ monthly: "10000", annualReturn: "12", duration: "10", unit: "years", timing: "end", stepUp: "", rateMode: "effective", ...o });
eq("sip form: valid", sipFromForm(SF()).status, "ok");
eq("sip form: empty", sipFromForm(SF({ monthly: "" })).status, "empty");
eq("sip form: invalid inputs", ["abc", "-5"].map((m) => sipFromForm(SF({ monthly: m })).status), ["error", "error"]);
eq("sip form: return bounds", [sipFromForm(SF({ annualReturn: "101" })).status, sipFromForm(SF({ annualReturn: "-60" })).status, sipFromForm(SF({ annualReturn: "100" })).status], ["error", "error", "ok"]);
eq("sip form: fractional years rounded with note", (() => { const r = sipFromForm(SF({ duration: "2.3" })); return r.status === "ok" && [r.result.instalments, r.notes.some((n) => n.includes("28 monthly"))]; })(), [28, true]);
eq("sip form: months unit", (() => { const r = sipFromForm(SF({ duration: "18", unit: "months" })); return r.status === "ok" && r.result.instalments; })(), 18);
eq("sip form: very long period capped", sipFromForm(SF({ duration: "51" })).status, "error");
eq("sip form: very high return noted", (() => { const r = sipFromForm(SF({ annualReturn: "45" })); return r.status === "ok" && r.notes.length > 0; })(), true);
eq("sip form: large values stay finite", (() => { const r = sipFromForm(SF({ monthly: "100000000", annualReturn: "15", duration: "50" })); return r.status; })(), "ok");
eq("sip form: overflow guarded", sipFromForm(SF({ monthly: "100000000", annualReturn: "100", duration: "50" })).status, "error");
eq("sip csv", sipCsv(S({ months: 24 }), "INR").split("\n")[2].startsWith("1,12,10000.00,120000.00,120000.00,"), true);

/* ================= Compound interest ================= */
const C = (o: Partial<Parameters<typeof compound>[0]> = {}) => compound({ principal: 100000, rate: 8, years: 10, compounding: 1, contribution: 0, contributionFrequency: 12, timing: "end", ...o });
eq("ci: annual", r2(C().final), 215892.5);
eq("ci: monthly", r2(C({ compounding: 12 }).final), 221964.02);
eq("ci: quarterly 5y", r2(C({ compounding: 4, years: 5 }).final), 148594.74);
eq("ci: daily 1y", Math.round(C({ compounding: 365, years: 1 }).final * 1e4) / 1e4, 108327.7572);
eq("ci: fractional 2.5y yearly", r2(C({ rate: 10, years: 2.5 }).final), 126905.87);
eq("ci: zero interest", [C({ rate: 0 }).final, C({ rate: 0 }).interest], [100000, 0]);
eq("ci: zero principal + monthly deposits (end/begin)", [r2(C({ principal: 0, compounding: 12, contribution: 5000 }).final), r2(C({ principal: 0, compounding: 12, contribution: 5000, timing: "begin" }).final)], [914730.18, 920828.38]);
eq("ci: yearly deposits, quarterly compounding", r2(C({ principal: 0, rate: 6, years: 5, compounding: 4, contribution: 10000, contributionFrequency: 1 }).final), 56524.6);
eq("ci: deposits counted", [C({ contribution: 100 }).deposits, C({ contribution: 100 }).contributions, C({ contribution: 100, years: 1.5, contributionFrequency: 4 }).deposits], [120, 12000, 6]);
eq("ci: deposit timing", [depositTimes(1, 4, "end"), depositTimes(1, 4, "begin")], [[0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75]]);
eq("ci: simple interest comparison", [r2(C().simpleFinal), r2(C().final - C().simpleFinal)], [180000, 35892.5]);
eq("ci: simple interest with deposits", r2(C({ principal: 0, contribution: 1000, contributionFrequency: 1, years: 2, rate: 10 }).simpleFinal), 2100);
{
  const r = C({ compounding: 12, contribution: 2000, years: 3.5 });
  const last = r.years.at(-1)!;
  eq("ci: year rows reconcile (start + contributions + interest = end)", r.years.every((y) => Math.abs(y.start + y.contributions + y.interest - y.end) < 1e-6), true);
  eq("ci: part-year last row", [r.years.length, last.to, r2(last.end) === r2(r.final)], [4, 3.5, true]);
  eq("ci: contributions per year", r.years.map((y) => y.contributions), [24000, 24000, 24000, 12000]);
}
eq("ci: begin-timing deposit at a year boundary belongs to next year", C({ principal: 0, contribution: 100, contributionFrequency: 1, years: 3, timing: "begin" }).years.map((y) => y.contributions), [100, 100, 100]);
eq("ci: effective annual (APY) monthly 12%", r2(C({ rate: 12, compounding: 12 }).effectiveAnnual * 100), 12.68);
eq("ci: large balance finite", Number.isFinite(C({ principal: 1e12, rate: 15, years: 50 }).final), true);
const CF = (o: Partial<CiForm> = {}): CiForm => ({ principal: "100000", rate: "8", duration: "10", unit: "years", compounding: 1, contribution: "", contributionFrequency: 12, timing: "end", ...o });
eq("ci form: months unit", (() => { const r = compoundFromForm(CF({ duration: "18", unit: "months" })); return r.status === "ok" && r.result.input.years; })(), 1.5);
eq("ci form: negative rate allowed down to −10%", [compoundFromForm(CF({ rate: "-2" })).status, compoundFromForm(CF({ rate: "-11" })).status], ["ok", "error"]);
eq("ci form: nothing to grow", compoundFromForm(CF({ principal: "0" })).status, "error");
eq("ci form: overflow guarded", compoundFromForm(CF({ principal: "1000000000000", rate: "100", duration: "100" })).status, "error");
eq("ci form: frequency note", (() => { const r = compoundFromForm(CF({ contribution: "500" })); return r.status === "ok" && r.notes.length; })(), 1);
eq("ci csv", compoundCsv(C({ years: 2 }), "INR").split("\n")[2], "1,100000.00,0.00,8000.00,108000.00,108000.00");

/* ================= BMI ================= */
const B = (o: Partial<BmiForm> = {}): BmiForm => ({ system: "metric", cm: "175", kg: "70", ft: "", inch: "", lb: "", ...o });
const bmi = (o: Partial<BmiForm> = {}) => {
  const r = bmiFromForm(B(o));
  return r.status === "ok" ? [r.result.shown, r.result.category] : r.status;
};
eq("bmi: metric", bmi(), [22.9, "healthy"]);
eq("bmi: imperial 5 ft 9 in, 160 lb", bmi({ system: "imperial", ft: "5", inch: "9", lb: "160" }), [23.6, "healthy"]);
eq("bmi: imperial equals metric for the same person", (() => { const a = bmiFromForm(B({ system: "imperial", ft: "6", inch: "0", lb: "200" })); const b = bmiFromForm(B({ cm: String(72 * 2.54), kg: String(200 * 0.45359237) })); return a.status === "ok" && b.status === "ok" && Math.abs(a.result.bmi - b.result.bmi) < 1e-12; })(), true);
eq("bmi: boundaries exact", [category(18.44), category(18.45), category(24.94), category(24.95), category(25), category(29.9), category(30), category(29.96)], ["underweight", "healthy", "healthy", "overweight", "overweight", "overweight", "obesity", "obesity"]);
eq("bmi: round1", [round1(24.95), round1(18.449), round1(22.857142)], [25, 18.4, 22.9]);
eq("bmi: categories at 1.80 m", [64.8 / 3.24 - 20, bmi({ cm: "180", kg: "59.5" })[1], bmi({ cm: "180", kg: "81" })[1], bmi({ cm: "180", kg: "97.2" })[1]].slice(1), ["underweight", "overweight", "obesity"]);
eq("bmi: healthy range 175 cm", (() => { const h = healthyRange(175); return [r2(h.min), r2(h.max)]; })(), [56.66, 76.26]);
eq("bmi: zero/invalid inputs", [bmiFromForm(B({ cm: "0" })).status, bmiFromForm(B({ kg: "-70" })).status, bmiFromForm(B({ kg: "abc" })).status], ["error", "error", "error"]);
eq("bmi: extreme values rejected", [bmiFromForm(B({ cm: "400" })).status, bmiFromForm(B({ kg: "900" })).status, bmiFromForm(B({ cm: "60" })).status], ["error", "error", "error"]);
eq("bmi: inches must be < 12", bmiFromForm(B({ system: "imperial", ft: "5", inch: "12", lb: "150" })).status, "error");
eq("bmi: empty", bmiFromForm(B({ kg: "" })).status, "empty");
eq("bmi: distance to healthy range", (() => { const r = bmiFromForm(B({ kg: "80" })); return r.status === "ok" && r2(r.result.toHealthy); })(), 3.74);

/* ================= GPA & CGPA ================= */
let id = 0;
const sub = (name: string, grade: string, credits: string, points = "", marks = ""): Subject => ({ id: String(id++), name, grade, points, credits, marks });
const ten = SCALES.find((s) => s.id === "10")!;
const four = SCALES.find((s) => s.id === "4")!;
const five = SCALES.find((s) => s.id === "5")!;
const gpa = (subs: Subject[], scale = ten, rep: "all" | "latest" | "best" = "all") => {
  const r = computeGpa(subs, scale, rep);
  return r.status === "ok" ? r.result : r.status === "error" ? r.message : "empty";
};
eq("gpa: 10-point weighted", fixed((gpa([sub("A", "A+", "4"), sub("B", "A", "3"), sub("C", "O", "2")]) as { gpa: number }).gpa), fixed((9 * 4 + 8 * 3 + 10 * 2) / 9));
eq("gpa: 4.0 scale", fixed((gpa([sub("A", "A-", "3"), sub("B", "B+", "4"), sub("C", "A", "1")], four) as { gpa: number }).gpa), "3.54");
eq("gpa: 5.0 scale", (gpa([sub("A", "A", "3"), sub("B", "C", "3")], five) as { gpa: number }).gpa, 4);
eq("gpa: unequal credits ≠ simple average", fixed((gpa([sub("A", "O", "1"), sub("B", "P", "5")]) as { gpa: number }).gpa), "5.00");
eq("gpa: custom points entered directly", (gpa([sub("A", "", "4", "8.5"), sub("B", "", "4", "7.5")]) as { gpa: number }).gpa, 8);
eq("gpa: custom scale mapping", (gpa([sub("A", "X", "2"), sub("B", "Y", "2")], { id: "c", label: "Custom", max: 6, note: "", grades: [{ letter: "X", points: 6 }, { letter: "Y", points: 3 }] }) as { gpa: number }).gpa, 4.5);
{
  const r = gpa([sub("A", "A", "4"), sub("B", "", "3"), sub("C", "", "3", "11"), sub("D", "B", "")]) as { gpa: number; skipped: { reason: string }[]; counted: number };
  eq("gpa: missing grade, invalid points, missing credits skipped and reported", [r.gpa, r.counted, r.skipped.map((s) => s.reason)], [8, 1, ["no grade entered", "grade points must be between 0 and 10", "no credits entered"]]);
}
eq("gpa: zero-credit subject doesn't change GPA", (gpa([sub("A", "A", "4"), sub("Audit", "F", "0")]) as { gpa: number }).gpa, 8);
eq("gpa: all zero credits → error", typeof gpa([sub("A", "A", "0")]), "string");
eq("gpa: F counts with its credits", (gpa([sub("A", "O", "3"), sub("B", "F", "3")]) as { gpa: number }).gpa, 5);
{
  const subs = [sub("Maths", "F", "4"), sub("Physics", "A", "4"), sub("maths ", "A+", "4")];
  eq("gpa: repeated subject — all attempts", fixed((gpa(subs) as { gpa: number }).gpa), fixed((0 + 32 + 36) / 12));
  const latest = gpa(subs, ten, "latest") as { gpa: number; repeatsDropped: string[] };
  eq("gpa: repeated subject — latest attempt", [latest.gpa, latest.repeatsDropped], [8.5, ["Maths"]]);
  eq("gpa: repeated subject — best attempt", (gpa([sub("Maths", "A+", "4"), sub("Maths", "B", "4")], ten, "best") as { gpa: number }).gpa, 9);
}
eq("gpa: grade distribution ordered by scale", (gpa([sub("A", "B", "1"), sub("B", "O", "1"), sub("C", "B", "1")]) as { distribution: unknown }).distribution, [{ letter: "O", count: 1 }, { letter: "B", count: 2 }]);
eq("gpa: weighted marks when all present", (gpa([sub("A", "A", "3", "", "80"), sub("B", "A", "1", "", "60")]) as { avgMarks: number }).avgMarks, 75);
eq("gpa: no subjects", gpa([]), "empty");
eq("gpa: decimal precision (half up despite binary error)", [fixed(8.995), fixed(359.8 / 40), fixed(3.5375), fixed(2.675), fixed(7), fixed(-1.005)], ["9.00", "9.00", "3.54", "2.68", "7.00", "-1.01"]);
eq("bmi: displayed value decides the category", [category(18.49), round1(18.49)], ["healthy", 18.5]);

const sem = (name: string, g: string, c: string): Semester => ({ id: String(id++), name, gpa: g, credits: c });
const cg = (s: Semester[], eqw = false) => {
  const r = computeCgpa(s, 10, eqw);
  return r.status === "ok" ? r.result : r.status;
};
eq("cgpa: credit-weighted", fixed((cg([sem("S1", "8", "20"), sem("S2", "9", "24"), sem("S3", "7.5", "22")]) as { cgpa: number }).cgpa), fixed((8 * 20 + 9 * 24 + 7.5 * 22) / 66));
eq("cgpa: differs from simple average with unequal credits", (cg([sem("S1", "6", "10"), sem("S2", "9", "30")]) as { cgpa: number }).cgpa, 8.25);
eq("cgpa: equal weighting only when chosen", (cg([sem("S1", "6", "10"), sem("S2", "9", "30")], true) as { cgpa: number }).cgpa, 7.5);
eq("cgpa: incomplete semesters skipped", (cg([sem("S1", "8", "20"), sem("S2", "", "20"), sem("S3", "11", "20")]) as { skipped: unknown[] }).skipped.length, 2);
eq("cgpa: empty list", cg([]), "empty");
eq("percent: formulas", FORMULAS.map((f) => r2(toPercent(f.max === 10 ? 8.4 : f.max === 4 ? 3.2 : 4, f))), [79.8, 84, 76.5, 80, 80]);
eq("percent: clamped 0–100", [toPercent(0.5, FORMULAS[2]), toPercent(10, { offset: 0, multiplier: 11 })], [0, 100]);

/* ================= Tip ================= */
const T = (o: Partial<TipForm> = {}): TipForm => ({ bill: "100", tipPct: "10", people: "1", taxMode: "none", tax: "", taxIncluded: false, tipBeforeTax: true, rounding: "exact", ...o });
const t = (o: Partial<TipForm> = {}) => {
  const r = tip(T(o));
  return r.status === "ok" ? r.result : r.status;
};
type TR = Exclude<ReturnType<typeof t>, string>;
eq("tip: 10% of 100", [(t() as TR).tip, (t() as TR).total], [1000, 11000]);
eq("tip: 15% of 84.50", (t({ bill: "84.50", tipPct: "15" }) as TR).tip, 1268);
eq("tip: custom 12.5%", (t({ bill: "240", tipPct: "12.5" }) as TR).tip, 3000);
eq("tip: zero tip", (t({ tipPct: "0" }) as TR).total, 10000);
eq("tip: zero bill", (t({ bill: "0" }) as TR).total, 0);
eq("tip: pctOf half-up", [pctOf(1005, 10), pctOf(1, 50), pctOf(3, 50)], [101, 1, 2]);
{
  const ex = t({ taxMode: "percent", tax: "18", tipBeforeTax: true }) as TR;
  eq("tip: tax added, tip before tax", [ex.tax, ex.tip, ex.total], [1800, 1000, 12800]);
  const after = t({ taxMode: "percent", tax: "18", tipBeforeTax: false }) as TR;
  eq("tip: tip after tax", [after.tipBase, after.tip, after.total], [11800, 1180, 12980]);
  const inc = t({ bill: "118", taxMode: "percent", tax: "18", taxIncluded: true }) as TR;
  eq("tip: tax included in bill", [inc.subtotal, inc.tax, inc.tip, inc.total], [10000, 1800, 1000, 12800]);
  const amt = t({ taxMode: "amount", tax: "7.25" }) as TR;
  eq("tip: fixed tax amount", [amt.tax, amt.total], [725, 11725]);
  eq("tip: included tax larger than bill rejected", t({ taxMode: "amount", tax: "200", taxIncluded: true }), "error");
}
{
  const ex = t({ bill: "100", tipPct: "0", people: "3" }) as TR;
  eq("tip: exact uneven split reconciles", [ex.shares, ex.collected, ex.surplus], [[{ amount: 3334, count: 1 }, { amount: 3333, count: 2 }], 10000, 0]);
  const up = t({ bill: "100", tipPct: "0", people: "3", rounding: "up" }) as TR;
  eq("tip: round up shows surplus", [up.shares, up.surplus], [[{ amount: 3400, count: 3 }], 200]);
  const near = t({ bill: "100", tipPct: "0", people: "3", rounding: "nearest" }) as TR;
  eq("tip: nearest — last person pays remainder", [near.shares, near.collected], [[{ amount: 3300, count: 2 }, { amount: 3400, count: 1 }], 10000]);
  const tiny = t({ bill: "1.60", tipPct: "0", people: "3", rounding: "nearest" }) as TR;
  eq("tip: nearest never negative (falls back to exact)", [tiny.shares.every((s) => s.amount >= 0), tiny.collected], [true, 160]);
  const one = t({ bill: "57.30", tipPct: "18", people: "1", rounding: "nearest" }) as TR;
  eq("tip: one person pays exact total", [one.shares, one.total], [[{ amount: 6761, count: 1 }], 6761]);
  const big = t({ bill: "12345.67", tipPct: "15", people: "37" }) as TR;
  eq("tip: large group reconciles to the cent", big.collected === big.total && big.shares.reduce((a, s) => a + s.count, 0) === 37, true);
}
eq("tip: validation", [t({ bill: "-5" }), t({ people: "0" }), t({ people: "2.5" }), t({ tipPct: "150" }), t({ bill: "abc" }), t({ bill: "" })], ["error", "error", "error", "error", "error", "empty"]);
eq("tip: very large % allowed with note", (() => { const r = tip(T({ tipPct: "60" })); return r.status === "ok" && r.notes.length; })(), 1);

console.log(`\n${passes} passed, ${fails} failed`);
if (fails) process.exit(1);
