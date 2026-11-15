"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import { CopyButton, Panel, Segmented, inputClass } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Legend, LineChart } from "./charts";
import { DarkNotes, parseForm, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER, MonthYear, ScheduleSection, axisInr, ym } from "./loan-ui";
import { addMonths, amortise, monthLabel, type AmortResult, type Frequency, type PrepaymentPlan, type Strategy, type Timing } from "@/lib/loans/amortise";
import { parseNum } from "@/lib/discount";
import { inr } from "@/lib/loans/format";
import { validateLoan } from "@/lib/emi";
import { track } from "@/lib/analytics";

type K = "outstanding" | "rate" | "tenure" | "emi" | "feePct";
const DEFAULT: Record<K, string> = { outstanding: "4500000", rate: "8.5", tenure: "18", emi: "", feePct: "" };
const SPECS: Record<K, FieldSpec> = {
  outstanding: { label: "Outstanding principal", min: 1, max: 1e11 },
  rate: { label: "Interest rate", min: 0, max: 30 },
  tenure: { label: "Remaining tenure", min: 1, max: 600 },
  emi: { label: "Current EMI", min: 0, max: 1e10, optional: true },
  feePct: { label: "Prepayment charge", min: 0, max: 10, optional: true },
};
type PlanRow = { amount: string; frequency: Frequency; start: string; end: string };
type Scenario = { plans: PlanRow[]; timing: Timing; strategy: Strategy };
const FREQS: { value: Frequency; label: string }[] = [
  { value: "once", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half-yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
];
const newScenario = (amount = "500000", frequency: Frequency = "once"): Scenario => ({ plans: [{ amount, frequency, start: "12", end: "" }], timing: "after", strategy: "tenure" });
const NAMES = ["A", "B", "C"];
const COLORS = [CHART.orange, CHART.ink2, CHART.muted];

function readPlans(s: Scenario, tenure: number): { plans: PrepaymentPlan[] } | { error: string } {
  const plans: PrepaymentPlan[] = [];
  for (const [k, p] of s.plans.entries()) {
    const amount = parseNum(p.amount);
    const start = parseNum(p.start);
    const end = parseNum(p.end);
    if (amount === null || amount === 0) continue;
    if (Number.isNaN(amount) || amount < 0) return { error: `Prepayment ${k + 1}: the amount must be a positive number.` };
    if (start === null || Number.isNaN(start) || !Number.isInteger(start) || start < 1 || start > tenure) return { error: `Prepayment ${k + 1}: the month must be a whole number from 1 to ${tenure}.` };
    if (end !== null && (Number.isNaN(end) || !Number.isInteger(end) || end < start)) return { error: `Prepayment ${k + 1}: the last month must be a whole number after the first.` };
    plans.push({ amount, frequency: p.frequency, start, end: end ?? undefined });
  }
  return { plans };
}

function computePrepay(parsed: ReturnType<typeof parseForm<K>>, unit: "years" | "months", scen: Scenario[]) {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const months = unit === "years" ? Math.round(v.tenure * 12) : v.tenure;
    const bad = validateLoan(v.outstanding, v.rate, months);
    if (bad) return { error: bad };
    const emi = v.emi > 0 ? v.emi : undefined;
    if (emi !== undefined && emi <= Math.round(v.outstanding * v.rate) / 1200) return { error: "That EMI doesn't cover the monthly interest, so the loan would never be repaid. Check the EMI, rate and balance." };
    const base = amortise({ principal: v.outstanding, annualRate: v.rate, months, emi });
    const results: { name: string; res: AmortResult; s: Scenario }[] = [];
    for (const [k, s] of scen.entries()) {
      const p = readPlans(s, months);
      if ("error" in p) return { error: `Scenario ${NAMES[k]} — ${p.error}` };
      results.push({ name: NAMES[k], res: amortise({ principal: v.outstanding, annualRate: v.rate, months, emi, plans: p.plans, timing: s.timing, strategy: s.strategy, feePct: v.feePct }), s });
    }
    return { months, base, results };
}

export default function HomeLoanPrepaymentCalculator() {
  const [f, setF] = useState(DEFAULT);
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [start, setStart] = useState({ y: 2026, m: 12 });
  const [scen, setScen] = useState<Scenario[]>([newScenario()]);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  const upd = (i: number, fn: (s: Scenario) => Scenario) => setScen((x) => x.map((s, j) => (j === i ? fn(s) : s)));
  useEffect(() => track("tool_opened", { tool: "home-loan-prepayment-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => computePrepay(parsed, unit, scen), [parsed, unit, scen]);
  const ok = out && !("error" in out) ? out : null;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);
  const close = (months: number) => monthLabel(addMonths(start.y, start.m, months - 1));
  const A = ok?.results[0];
  const saved = A ? ok.base.totalInterest - A.res.totalInterest : 0;

  const summary = (): [string, string][] =>
    ok && A
      ? [
          ["Outstanding principal", inr(parsed.ok ? parsed.v.outstanding : 0)],
          ["Current EMI", inr(ok.base.emi)],
          ["Interest without prepayment", inr(ok.base.totalInterest)],
          ["Closes without prepayment", `${close(ok.base.months)} (${ym(ok.base.months)})`],
          ...ok.results.flatMap(({ name, res }) => [
            [`Scenario ${name}: interest`, inr(res.totalInterest)],
            [`Scenario ${name}: interest saved`, inr(ok.base.totalInterest - res.totalInterest)],
            [`Scenario ${name}: closes`, `${close(res.months)} (${ym(res.months)})`],
            [`Scenario ${name}: EMI at the end`, inr(res.finalEmi)],
          ] as [string, string][]),
        ]
      : [];

  // Yearly balance series for the chart.
  const yearsN = ok ? Math.ceil(ok.base.months / 12) : 0;
  const bal = (res: AmortResult) => Array.from({ length: yearsN + 1 }, (_, y) => (y === 0 ? res.rows[0]?.opening ?? 0 : res.rows[Math.min(y * 12, res.rows.length) - 1]?.closing ?? 0)).map((v, y) => (y * 12 > res.months && y > 0 ? 0 : v));

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="pp-out" label="Outstanding principal today" prefix="₹" value={f.outstanding} onChange={(v) => set("outstanding", v)} error={err("outstanding")} size="lg" hint="From your latest loan statement." />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="pp-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
            <NumberField id="pp-emi" label="Current EMI (optional)" prefix="₹" value={f.emi} onChange={(v) => set("emi", v)} error={err("emi")} hint="Leave blank to use the EMI for this balance and tenure." />
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="pp-tenure" label="Remaining tenure" value={f.tenure} onChange={(v) => set("tenure", v)} error={err("tenure")} />
            <Segmented label="Tenure unit" className="mb-px h-11 w-44" size="sm" value={unit} onChange={setUnit} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
          </div>
          <MonthYear id="pp-start" label="Next EMI is due in" y={start.y} m={start.m} onChange={(y, m) => setStart({ y, m })} />

          {scen.map((s, si) => (
            <fieldset key={si} className="grid gap-3 rounded-[12px] border border-line p-4" data-testid={`scenario-${NAMES[si]}`}>
              <legend className="px-1 text-sm font-bold">Scenario {NAMES[si]}</legend>
              {s.plans.map((p, pi) => (
                <div key={pi} className="grid grid-cols-2 gap-2 sm:grid-cols-[1.3fr_1fr_0.7fr_0.7fr_auto] sm:items-end">
                  <div>
                    <label htmlFor={`pp-${si}-${pi}-amt`} className="mb-1 block text-xs text-ink-2">Prepayment ₹</label>
                    <input id={`pp-${si}-${pi}-amt`} inputMode="decimal" className={`${inputClass} h-10`} value={p.amount} onChange={(e) => upd(si, (x) => ({ ...x, plans: x.plans.map((q, j) => (j === pi ? { ...q, amount: e.target.value } : q)) }))} />
                  </div>
                  <div>
                    <label htmlFor={`pp-${si}-${pi}-freq`} className="mb-1 block text-xs text-ink-2">How often</label>
                    <select id={`pp-${si}-${pi}-freq`} className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-2 text-sm" value={p.frequency} onChange={(e) => upd(si, (x) => ({ ...x, plans: x.plans.map((q, j) => (j === pi ? { ...q, frequency: e.target.value as Frequency } : q)) }))}>
                      {FREQS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`pp-${si}-${pi}-start`} className="mb-1 block text-xs text-ink-2">From EMI no.</label>
                    <input id={`pp-${si}-${pi}-start`} inputMode="numeric" className={`${inputClass} h-10`} value={p.start} onChange={(e) => upd(si, (x) => ({ ...x, plans: x.plans.map((q, j) => (j === pi ? { ...q, start: e.target.value } : q)) }))} />
                  </div>
                  <div>
                    <label htmlFor={`pp-${si}-${pi}-end`} className="mb-1 block text-xs text-ink-2">Until no.</label>
                    <input id={`pp-${si}-${pi}-end`} inputMode="numeric" placeholder="end" disabled={p.frequency === "once"} className={`${inputClass} h-10 disabled:opacity-40`} value={p.end} onChange={(e) => upd(si, (x) => ({ ...x, plans: x.plans.map((q, j) => (j === pi ? { ...q, end: e.target.value } : q)) }))} />
                  </div>
                  <button type="button" aria-label={`Remove prepayment ${pi + 1} from scenario ${NAMES[si]}`} disabled={s.plans.length === 1} onClick={() => upd(si, (x) => ({ ...x, plans: x.plans.filter((_, j) => j !== pi) }))} className="grid size-10 place-items-center rounded-[10px] text-ink-2 hover:bg-ivory-2 disabled:opacity-30">
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              ))}
              {s.plans.length < 4 && (
                <button type="button" onClick={() => upd(si, (x) => ({ ...x, plans: [...x.plans, { amount: "", frequency: "yearly", start: "24", end: "" }] }))} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-charcoal underline decoration-line-strong underline-offset-2">
                  <Plus aria-hidden className="size-4" /> Add another prepayment
                </button>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-ink-2">Prepayment is paid</p>
                  <Segmented label={`Scenario ${NAMES[si]} timing`} size="sm" value={s.timing} onChange={(v) => upd(si, (x) => ({ ...x, timing: v }))} options={[{ value: "after", label: "After that EMI" }, { value: "before", label: "Before that EMI" }]} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-ink-2">Use it to</p>
                  <Segmented label={`Scenario ${NAMES[si]} outcome`} size="sm" value={s.strategy} onChange={(v) => upd(si, (x) => ({ ...x, strategy: v }))} options={[{ value: "tenure", label: "Cut tenure" }, { value: "emi", label: "Cut EMI" }]} />
                </div>
              </div>
              {si > 0 && (
                <button type="button" onClick={() => setScen((x) => x.filter((_, j) => j !== si))} className="w-fit text-sm text-ink-2 underline">
                  Remove scenario {NAMES[si]}
                </button>
              )}
            </fieldset>
          ))}
          {scen.length < 3 && (
            <button type="button" onClick={() => setScen((x) => [...x, newScenario("10000", "monthly")])} className="inline-flex h-10 w-fit items-center gap-1.5 rounded-[10px] border border-line-strong px-3 text-sm font-medium hover:border-charcoal">
              <Plus aria-hidden className="size-4" /> Compare another scenario
            </button>
          )}
          <NumberField id="pp-fee" label="Prepayment charge (optional)" suffix="% of amount" value={f.feePct} onChange={(v) => set("feePct", v)} error={err("feePct")} hint="Only if your lender charges one. RBI bars charges on floating-rate home loans to individuals; fixed-rate loans may carry them." />
        </Panel>

        <ResultCard eyebrow="Interest saved — scenario A" state={state} error={errorMsg} empty="Enter your outstanding principal, rate and remaining tenure." onReset={() => { setF(DEFAULT); setScen([newScenario()]); }} footer={LOAN_DISCLAIMER}>
          {ok && A && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="pp-saved">
                {inr(saved)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="pp-sub">
                {A.s.strategy === "tenure" ? `loan ends ${ym(ok.base.months - A.res.months)} sooner, in ${close(A.res.months)}` : `EMI falls to ${inr(A.res.finalEmi)}; loan still ends in ${close(A.res.months)}`}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="EMI" value={inr(ok.base.emi)} testId="pp-emi" />
                <Figure label="Interest without prepayment" value={inr(ok.base.totalInterest)} testId="pp-base-interest" />
                <Figure label="Interest with prepayment" value={inr(A.res.totalInterest)} testId="pp-new-interest" />
                <Figure label="Original closure" value={`${close(ok.base.months)} · ${ym(ok.base.months)}`} />
                <Figure label="Revised closure" value={`${close(A.res.months)} · ${ym(A.res.months)}`} testId="pp-close" />
                <Figure label="Total prepaid" value={inr(A.res.totalPrepaid)} />
                {A.res.totalFees > 0 && <Figure label="Prepayment charges" value={inr(A.res.totalFees)} testId="pp-fees" />}
                <Figure label="Total repayment — original vs revised" value={`${inr(ok.base.totalPaid)} → ${inr(A.res.totalPaid)}`} strong />
              </dl>
              <DarkNotes notes={[...(A.res.totalFees > 0 ? [`Net saving after charges: ${inr(saved - A.res.totalFees)}.`] : []), "Lenders apply prepayments on their own dates and may round differently, so treat the saving as a close estimate."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Home loan prepayment — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "home-loan-prepayment-calculator" })} />
                <DarkButton onClick={() => printSummary("Home loan prepayment", summary(), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {ok && (
        <>
          <Panel className="grid gap-4 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Scenarios compared</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right text-sm" data-testid="pp-compare">
                <thead className="text-xs text-ink-2">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 text-left font-medium">Scenario</th>
                    <th scope="col" className="py-2 font-medium">Interest</th>
                    <th scope="col" className="py-2 font-medium">Saved</th>
                    <th scope="col" className="py-2 font-medium">Tenure</th>
                    <th scope="col" className="py-2 font-medium">Closes</th>
                    <th scope="col" className="py-2 font-medium">Final EMI</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  <tr className="border-b border-line">
                    <td className="py-2 text-left font-sans">No prepayment</td>
                    <td className="py-2">{inr(ok.base.totalInterest)}</td>
                    <td className="py-2">—</td>
                    <td className="py-2">{ym(ok.base.months)}</td>
                    <td className="py-2">{close(ok.base.months)}</td>
                    <td className="py-2">{inr(ok.base.emi)}</td>
                  </tr>
                  {ok.results.map(({ name, res }) => (
                    <tr key={name} className="border-b border-line last:border-0">
                      <td className="py-2 text-left font-sans">Scenario {name}</td>
                      <td className="py-2">{inr(res.totalInterest)}</td>
                      <td className="py-2">{inr(ok.base.totalInterest - res.totalInterest)}</td>
                      <td className="py-2">{ym(res.months)}</td>
                      <td className="py-2">{close(res.months)}</td>
                      <td className="py-2">{inr(res.finalEmi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <h3 className="font-bold">Outstanding balance by year</h3>
              <Legend items={[{ label: "No prepayment", color: CHART.charcoal }, ...ok.results.map((r, k) => ({ label: `Scenario ${r.name}`, color: COLORS[k] }))]} />
            </div>
            <LineChart
              label={`Outstanding balance each year without prepayment and with each scenario.`}
              labels={Array.from({ length: yearsN + 1 }, (_, y) => `Y${y}`)}
              series={[{ label: "No prepayment", color: CHART.charcoal, values: bal(ok.base) }, ...ok.results.map((r, k) => ({ label: `Scenario ${r.name}`, color: COLORS[k], values: bal(r.res) }))]}
              format={axisInr}
            />
          </Panel>
          <ScheduleSection res={A!.res} tool="home-loan-prepayment-calculator" start={start} title="Scenario A — repayment schedule" csvName="prepayment-schedule.csv" />
        </>
      )}

      <Formula>
        <p>EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), with r = annual rate ÷ 12. Each month, interest = balance × r (rounded to the paisa); the rest of the EMI repays principal.</p>
        <p>
          A prepayment <strong>before</strong> an EMI reduces the balance on which that month&rsquo;s interest is charged; one <strong>after</strong> the EMI starts saving interest from the next month. To cut tenure, the EMI stays the same and the loan ends sooner; to cut EMI, the EMI is recalculated over the remaining original months after each prepayment.
        </p>
        <p>Prepayment charges, if you enter them, are added on top and don&rsquo;t reduce the loan.</p>
      </Formula>
    </div>
  );
}
