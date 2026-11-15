"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, compactMoney } from "./charts";
import { DISCLAIMER, DarkNotes, RulesPanel, Select, inr, parseForm, type FieldSpec } from "./india-ui";
import { projectEpf } from "@/lib/india/payroll";
import { EPF_RULES } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "wages" | "age" | "retireAge" | "balance" | "vpfPct" | "salaryGrowth" | "interest";
const latest = EPF_RULES.interest[EPF_RULES.interest.length - 1];
const DEFAULT: Record<K, string> = { wages: "40000", age: "28", retireAge: "58", balance: "", vpfPct: "", salaryGrowth: "5", interest: String(latest.rate) };
const SPECS: Record<K, FieldSpec> = {
  wages: { label: "Basic + DA", min: 0, max: 1e8 },
  age: { label: "Current age", min: 15, max: 75, integer: true },
  retireAge: { label: "Age you'll stop contributing", min: 16, max: 80, integer: true },
  balance: { label: "Current EPF balance", min: 0, max: 1e10, optional: true },
  vpfPct: { label: "VPF", min: 0, max: 88, optional: true },
  salaryGrowth: { label: "Yearly salary increase", min: 0, max: 30, optional: true },
  interest: { label: "Interest rate", min: 0, max: 15 },
};
const axis = compactMoney("en-IN", "INR");

export default function EpfCalculator() {
  const [basis, setBasis] = useState<"ceiling" | "actual">("actual");
  const [eps, setEps] = useState(true);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "epf-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.retireAge <= v.age) return { error: "Retirement age must be after your current age.", field: "retireAge" as K };
    return projectEpf({ ...v, basis, employeePct: EPF_RULES.employeePct, employerPct: EPF_RULES.employerPct, epsMember: eps });
  }, [parsed, basis, eps]);
  const r = res && !("error" in res) ? res : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : res && "error" in res && res.field === k ? res.error : null);
  const opening = parsed.ok ? parsed.v.balance : 0;

  const summary = (): [string, string][] =>
    r
      ? [
          ["Monthly: your PF (+VPF)", inr(r.first.employee + r.first.vpf)],
          ["Monthly: employer to EPF", inr(r.first.employerEpf)],
          ["Monthly: employer to EPS (pension)", inr(r.first.eps)],
          ["Your contributions (total)", inr(r.totalEmployee)],
          ["Employer EPF contributions (total)", inr(r.totalEmployerEpf)],
          ["Interest (total)", inr(r.totalInterest)],
          ["EPF balance at the end", inr(r.corpus)],
          ["Paid into EPS (not in this balance)", inr(r.totalEps)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="epf-wages" label="Basic + DA per month" prefix="₹" value={f.wages} onChange={(v) => set("wages", v)} error={err("wages")} size="lg" />
          <Select
            id="epf-basis"
            label="PF is calculated on"
            value={basis}
            onChange={setBasis}
            options={[
              { value: "actual", label: "Full basic + DA" },
              { value: "ceiling", label: `Basic + DA up to ₹${EPF_RULES.wageCeiling.toLocaleString("en-IN")} (statutory minimum)` },
            ]}
            hint="Check your payslip: if your PF is ₹1,800 a month, your employer uses the ₹15,000 ceiling."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="epf-age" label="Current age" value={f.age} onChange={(v) => set("age", v)} error={err("age")} integer />
            <NumberField id="epf-ret" label="Contribute until age" value={f.retireAge} onChange={(v) => set("retireAge", v)} error={err("retireAge")} integer />
            <NumberField id="epf-bal" label="Current EPF balance" prefix="₹" value={f.balance} onChange={(v) => set("balance", v)} error={err("balance")} hint="From your EPFO passbook." />
            <NumberField id="epf-int" label="Interest rate" suffix="% a year" value={f.interest} onChange={(v) => set("interest", v)} error={err("interest")} hint={`${latest.rate}% for ${latest.fy}. Declared yearly.`} />
            <NumberField id="epf-growth" label="Yearly salary increase" suffix="%" value={f.salaryGrowth} onChange={(v) => set("salaryGrowth", v)} error={err("salaryGrowth")} />
            <NumberField id="epf-vpf" label="Voluntary PF (VPF)" suffix="% of basic" value={f.vpfPct} onChange={(v) => set("vpfPct", v)} error={err("vpfPct")} />
          </div>
          <Toggle checked={eps} onChange={setEps} label="Member of the pension scheme (EPS)" description="Usually yes if you joined before 1 Sep 2014 or your basic was ≤ ₹15,000 when you joined" />
        </Panel>

        <ResultCard eyebrow="EPF balance at the end" state={state} error={errorMsg} empty="Enter your basic + DA and age." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="epf-corpus">
                {inr(r.corpus)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">at age {parsed.ok ? parsed.v.retireAge : ""}, at {parsed.ok ? parsed.v.interest : ""}% a year · not guaranteed</p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Yours ${inr(r.totalEmployee)}, employer ${inr(r.totalEmployerEpf)}, interest ${inr(r.totalInterest)}`} parts={[{ value: opening, color: CHART.muted }, { value: r.totalEmployee, color: "rgba(250,247,242,0.9)" }, { value: r.totalEmployerEpf, color: CHART.ink2 }, { value: r.totalInterest, color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  {opening > 0 && <Figure label="Opening balance" value={inr(opening)} />}
                  <Figure label="Your contributions" value={inr(r.totalEmployee)} testId="epf-yours" />
                  <Figure label="Employer to EPF" value={inr(r.totalEmployerEpf)} testId="epf-employer" />
                  <Figure label="Interest" value={inr(r.totalInterest)} testId="epf-interest" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="This month: your PF" value={inr(r.first.employee)} testId="epf-m-employee" />
                {r.first.vpf > 0 && <Figure label="This month: VPF" value={inr(r.first.vpf)} />}
                <Figure label="This month: employer → EPF" value={inr(r.first.employerEpf)} testId="epf-m-epf" />
                <Figure label="This month: employer → EPS" value={inr(r.first.eps)} testId="epf-m-eps" />
                <Figure label="Total paid into EPS (pension, separate)" value={inr(r.totalEps)} />
              </dl>
              <DarkNotes notes={["EPS contributions build a pension, not a balance you can see — they're shown separately and not added to the EPF total. The pension amount isn't estimated here.", "Interest on contributions above ₹2.5 lakh a year (₹5 lakh without employer contribution) is taxable; tax isn't deducted here."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["EPF projection — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "epf-calculator" })} />
                <DarkButton onClick={() => printSummary("EPF projection", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && r.years.length > 0 && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Balance year by year</h2>
            <Legend items={[{ label: "Balance", color: CHART.orange }]} />
          </div>
          <BarChart label={`EPF balance at the end of each year; final ${inr(r.corpus)}.`} labels={r.years.map((y) => `${y.age}`)} series={[{ label: "Balance", color: CHART.orange, values: r.years.map((y) => y.balance) }]} format={axis} />
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-right text-sm" data-testid="epf-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Basic / month</th>
                  <th scope="col" className="py-2 font-medium">Yours</th>
                  <th scope="col" className="py-2 font-medium">Employer EPF</th>
                  <th scope="col" className="py-2 font-medium">Interest</th>
                  <th scope="col" className="py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{y.year}</td>
                    <td className="py-1.5">{inr(y.wages)}</td>
                    <td className="py-1.5">{inr(y.employee)}</td>
                    <td className="py-1.5">{inr(y.employerEpf)}</td>
                    <td className="py-1.5">{inr(y.interest)}</td>
                    <td className="py-1.5">{inr(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <RulesPanel
        effective="Current EPF Scheme rules; interest declared each financial year"
        rows={[
          { label: "Employee contribution", value: `${EPF_RULES.employeePct}% of basic + DA`, status: "verified" },
          { label: "Employer contribution", value: `${EPF_RULES.employerPct}% — of which ${EPF_RULES.epsPct}% (max ₹${EPF_RULES.epsMax.toLocaleString("en-IN")}) goes to EPS`, status: "verified" },
          { label: "Wage ceiling", value: `₹${EPF_RULES.wageCeiling.toLocaleString("en-IN")} a month (EPS always on the ceiling)`, status: "verified" },
          { label: "EPS contributions stop", value: `At age ${EPF_RULES.epsExitAge}`, status: "secondary" },
          ...EPF_RULES.interest.map((x) => ({ label: `Interest ${x.fy}`, value: `${x.rate}%`, status: x.status })),
        ]}
        sources={EPF_RULES.sources}
        notes={[EPF_RULES.note, "Some establishments contribute at a reduced 10%; this calculator assumes 12%."]}
      />

      <Formula>
        <p>Each month: your PF = 12% of wages; employer&rsquo;s 12% is split into EPS (8.33% of wages up to ₹15,000, max ₹1,250, if you&rsquo;re an EPS member under 58) and EPF (the rest).</p>
        <p>Interest is rate ÷ 12 on each month&rsquo;s closing balance, added up and credited at the end of each year — the monthly running balance method EPFO uses. Wages rise by the salary increase once a year.</p>
      </Formula>
    </div>
  );
}
