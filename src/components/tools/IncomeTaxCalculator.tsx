"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, Rows, Select, YearPicker, inr, parseForm, pct, type FieldSpec } from "./india-ui";
import { computeTax, type TaxBreakdown } from "@/lib/india/income-tax";
import { TAX_YEARS, type AgeBand, type Regime, type TaxYearId } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "salary" | "otherIncome" | "homeLoanInterest" | "exemptAllowances" | "professionalTax" | "d80C" | "d80D" | "d80CCD1B" | "otherDeductions" | "employerNps" | "basicDA";
const DEFAULT: Record<K, string> = { salary: "1500000", otherIncome: "", homeLoanInterest: "", exemptAllowances: "", professionalTax: "2500", d80C: "150000", d80D: "25000", d80CCD1B: "", otherDeductions: "", employerNps: "", basicDA: "" };
const SPECS: Record<K, FieldSpec> = {
  salary: { label: "Gross salary", min: 0, max: 1e10 },
  otherIncome: { label: "Other income", min: 0, max: 1e10, optional: true },
  homeLoanInterest: { label: "Home-loan interest", min: 0, max: 1e9, optional: true },
  exemptAllowances: { label: "HRA and other exempt allowances", min: 0, max: 1e9, optional: true },
  professionalTax: { label: "Professional tax", min: 0, max: 100000, optional: true },
  d80C: { label: "80C investments", min: 0, max: 1e9, optional: true },
  d80D: { label: "80D health insurance", min: 0, max: 1e7, optional: true },
  d80CCD1B: { label: "Own NPS contribution", min: 0, max: 1e7, optional: true },
  otherDeductions: { label: "Other deductions", min: 0, max: 1e9, optional: true },
  employerNps: { label: "Employer NPS contribution", min: 0, max: 1e9, optional: true },
  basicDA: { label: "Basic + DA", min: 0, max: 1e10, optional: true },
};

export default function IncomeTaxCalculator() {
  const [year, setYear] = useState<TaxYearId>("2026-27");
  const [age, setAge] = useState<AgeBand>("below60");
  const [show, setShow] = useState<Regime>("new");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "income-tax-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.employerNps > 0 && v.basicDA <= 0) return { error: "Enter your basic + DA so the employer-NPS limit can be applied.", field: "basicDA" as K };
    const base = { year, age, salary: v.salary + v.employerNps, exemptAllowances: v.exemptAllowances, professionalTax: v.professionalTax, houseProperty: -v.homeLoanInterest, otherIncome: v.otherIncome, d80C: v.d80C, d80D: v.d80D, d80CCD1B: v.d80CCD1B, otherDeductions: v.otherDeductions, employerNps: v.employerNps, basicDA: v.basicDA };
    return { new: computeTax({ ...base, regime: "new" }), old: computeTax({ ...base, regime: "old" }) };
  }, [parsed, year, age]);
  const ok = res && !("error" in res) ? res : null;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : res && "error" in res && res.field === k ? res.error : null);
  const Y = TAX_YEARS[year];
  const better: Regime | null = ok ? (ok.new.totalTax < ok.old.totalTax ? "new" : ok.old.totalTax < ok.new.totalTax ? "old" : null) : null;
  const t: TaxBreakdown | null = ok ? ok[show] : null;

  const rowsFor = (b: TaxBreakdown): [string, string, boolean?][] => [
    ["Gross income", inr(b.grossIncome)],
    ...(b.exemptions ? ([["Less: exempt allowances (HRA etc.)", `− ${inr(b.exemptions)}`]] as [string, string][]) : []),
    ["Less: standard deduction", `− ${inr(b.standardDeduction)}`],
    ...(b.professionalTax ? ([["Less: professional tax", `− ${inr(b.professionalTax)}`]] as [string, string][]) : []),
    ...(b.houseProperty < 0 ? ([["House property (loss set off)", `− ${inr(-b.houseProperty)}`]] as [string, string][]) : []),
    ["Gross total income", inr(b.grossTotalIncome), true],
    ...b.deductions.map((d) => [`Less: ${d.label}`, `− ${inr(d.amount)}`] as [string, string]),
    ["Taxable income (rounded to ₹10)", inr(b.taxableIncome), true],
    ...b.slabs.map((s) => [`${inr(s.from)} – ${s.to === null ? "above" : inr(s.to)} at ${s.rate}%`, inr(s.tax)] as [string, string]),
    ["Tax on slabs", inr(b.slabTax)],
    ...(b.rebate ? ([[year === "2026-27" ? "Less: rebate (formerly section 87A)" : "Less: rebate under section 87A", `− ${inr(b.rebate)}`]] as [string, string][]) : []),
    ...(b.rebateMarginalRelief ? ([["Less: marginal relief on rebate", `− ${inr(b.rebateMarginalRelief)}`]] as [string, string][]) : []),
    ...(b.surcharge ? ([[`Surcharge (${b.surchargeRate}%${b.surchargeMarginalRelief ? ", after marginal relief" : ""})`, inr(b.surcharge)]] as [string, string][]) : []),
    [`Health & education cess (${Y.cess}%)`, inr(b.cess)],
    ["Total tax (rounded to ₹10)", inr(b.totalTax), true],
  ];

  const summary = (): [string, string][] =>
    ok
      ? [
          ["Year", `${Y.label} — ${Y.act}`],
          ["Tax — new regime", inr(ok.new.totalTax)],
          ["Tax — old regime", inr(ok.old.totalTax)],
          ["Lower tax", better ? `${better === "new" ? "New" : "Old"} regime, by ${inr(Math.abs(ok.new.totalTax - ok.old.totalTax))}` : "Same in both"],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <YearPicker value={year} onChange={setYear} />
          <Select id="it-age" label="Your age during the year" value={age} onChange={setAge} options={[{ value: "below60", label: "Below 60" }, { value: "60to79", label: "60 to 79 (senior citizen)" }, { value: "80plus", label: "80 or above (super senior)" }]} hint="Age only changes old-regime slabs." />
          <NumberField id="it-salary" label="Gross salary for the year" prefix="₹" value={f.salary} onChange={(v) => set("salary", v)} error={err("salary")} size="lg" hint="All taxable salary: basic, allowances, bonus, before any exemption. Don't include employer PF or NPS here." />
          <NumberField id="it-other" label="Other income (interest, rent received etc.)" prefix="₹" value={f.otherIncome} onChange={(v) => set("otherIncome", v)} error={err("otherIncome")} hint="Taxed at slab rates. Capital gains aren't supported." />
          <details className="group rounded-[12px] border border-line p-4" open>
            <summary className="cursor-pointer text-sm font-bold">Old-regime exemptions and deductions</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField id="it-hra" label="HRA / exempt allowances" prefix="₹" value={f.exemptAllowances} onChange={(v) => set("exemptAllowances", v)} error={err("exemptAllowances")} hint={<Link className="underline" href="/hra-calculator/">Work out HRA exemption</Link>} />
              <NumberField id="it-pt" label="Professional tax paid" prefix="₹" value={f.professionalTax} onChange={(v) => set("professionalTax", v)} error={err("professionalTax")} />
              <NumberField id="it-80c" label="80C (PF, PPF, ELSS, LIC…)" prefix="₹" value={f.d80C} onChange={(v) => set("d80C", v)} error={err("d80C")} hint="Capped at ₹1,50,000." />
              <NumberField id="it-80d" label="80D health insurance" prefix="₹" value={f.d80D} onChange={(v) => set("d80D", v)} error={err("d80D")} hint="Enter the amount you're eligible for." />
              <NumberField id="it-1b" label="80CCD(1B) own NPS" prefix="₹" value={f.d80CCD1B} onChange={(v) => set("d80CCD1B", v)} error={err("d80CCD1B")} hint="Capped at ₹50,000." />
              <NumberField id="it-hl" label="Home-loan interest (self-occupied)" prefix="₹" value={f.homeLoanInterest} onChange={(v) => set("homeLoanInterest", v)} error={err("homeLoanInterest")} hint="Loss set off up to ₹2,00,000." />
              <NumberField id="it-oth" label="Other eligible deductions" prefix="₹" value={f.otherDeductions} onChange={(v) => set("otherDeductions", v)} error={err("otherDeductions")} className="sm:col-span-2" hint="e.g. 80E, 80G, 80TTA — enter the eligible amount after their own limits." />
            </div>
          </details>
          <details className="group rounded-[12px] border border-line p-4">
            <summary className="cursor-pointer text-sm font-bold">Employer NPS (both regimes)</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumberField id="it-enps" label="Employer NPS contribution" prefix="₹" value={f.employerNps} onChange={(v) => set("employerNps", v)} error={err("employerNps")} hint="Added to salary, then deducted up to the limit." />
              <NumberField id="it-basic" label="Basic + DA for the year" prefix="₹" value={f.basicDA} onChange={(v) => set("basicDA", v)} error={err("basicDA")} />
            </div>
          </details>
        </Panel>

        <ResultCard eyebrow={`Income tax · ${Y.short}`} state={state} error={errorMsg} empty="Enter your gross salary for the year." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {ok && (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(["new", "old"] as Regime[]).map((r) => (
                  <div key={r} className={`rounded-[12px] border p-3 ${better === r ? "border-orange" : "border-ivory/15"}`}>
                    <p className="text-xs text-ivory/60">{r === "new" ? "New regime" : "Old regime"}{better === r && <span className="ml-1 text-orange">· lower</span>}</p>
                    <p className="mt-1 break-all font-mono text-[clamp(1.4rem,1rem+2vw,2.1rem)] leading-tight" data-testid={`it-${r}`}>
                      {inr(ok[r].totalTax)}
                    </p>
                    <p className="text-xs text-ivory/55">{inr(ok[r].totalTax / 12)} a month</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-ivory/75" data-testid="it-verdict">
                {better ? `The ${better} regime saves ${inr(Math.abs(ok.new.totalTax - ok.old.totalTax))} on these figures.` : "Both regimes give the same tax on these figures."}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Taxable income — new" value={inr(ok.new.taxableIncome)} />
                <Figure label="Taxable income — old" value={inr(ok.old.taxableIncome)} />
                <Figure label={`Effective rate — ${show}`} value={pct(ok[show].effectiveRate)} />
              </dl>
              <DarkNotes notes={[...new Set([...ok.new.notes, ...ok.old.notes])]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Income tax estimate — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "income-tax-calculator" })} />
                <DarkButton onClick={() => printSummary("Income tax estimate", [...summary(), ...rowsFor(ok[show]).map(([a, b]) => [a, b] as [string, string])], [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {t && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Step-by-step working</h2>
            <Segmented label="Regime to show" size="sm" className="w-56" value={show} onChange={setShow} options={[{ value: "new", label: "New regime" }, { value: "old", label: "Old regime" }]} />
          </div>
          <Rows rows={rowsFor(t)} testId="it-steps" />
        </Panel>
      )}

      <RulesPanel
        effective={`${Y.period} (${Y.act})`}
        rows={[
          { label: "New-regime slabs", value: "0% to ₹4L, then 5/10/15/20/25% per ₹4L, 30% above ₹24L", status: Y.status.slabs },
          { label: "Standard deduction", value: `₹${Y.newRegime.standardDeduction.toLocaleString("en-IN")} new · ₹${Y.oldRegime.standardDeduction.toLocaleString("en-IN")} old`, status: Y.status.standardDeduction },
          { label: "Rebate", value: `Up to ₹60,000 if income ≤ ₹12L (new, with marginal relief) · ₹12,500 if ≤ ₹5L (old)`, status: Y.status.rebate },
          { label: "Surcharge", value: "10% > ₹50L · 15% > ₹1Cr · 25% > ₹2Cr · 37% > ₹5Cr (old only)", status: Y.status.surcharge },
          { label: "Cess", value: `${Y.cess}% of tax + surcharge`, status: Y.status.cess },
          { label: "Employer NPS deduction", value: `${Y.newRegime.employerNpsPct}% of basic + DA (new) · ${Y.oldRegime.employerNpsPct}% (old)`, status: Y.status.employerNps },
        ]}
        sources={Y.sources}
        notes={Y.notes}
      />

      <Formula>
        <p>
          Taxable income = gross income − exemptions (old regime) − standard deduction − professional tax (old) ± house property − deductions, rounded to the nearest ₹10. Tax is charged slab by slab.
        </p>
        <p>
          New-regime rebate: if taxable income is ₹12 lakh or less, tax up to ₹60,000 is rebated. Just above ₹12 lakh, marginal relief limits the tax to the income above ₹12 lakh. Surcharge applies above ₹50 lakh with marginal relief at every threshold, then 4% cess on tax plus surcharge. The total is rounded to the nearest ₹10.
        </p>
      </Formula>
    </div>
  );
}
