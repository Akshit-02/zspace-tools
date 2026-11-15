"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, RulesPanel, Rows, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER } from "./loan-ui";
import { homeLoanEligibility } from "@/lib/loans/borrowing";
import { LTV_RULES } from "@/lib/loans/ltv-rules";
import { inr, lakhCrore } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

type K = "income" | "otherIncome" | "existingEmi" | "obligations" | "coIncome" | "coEmi" | "age" | "retireAge" | "tenureYears" | "rate" | "foirPct" | "propertyValue" | "downPayment" | "maxTenureYears";
const DEFAULT: Record<K, string> = { income: "100000", otherIncome: "", existingEmi: "10000", obligations: "", coIncome: "", coEmi: "", age: "32", retireAge: "60", tenureYears: "20", rate: "8.5", foirPct: "50", propertyValue: "8000000", downPayment: "1600000", maxTenureYears: "30" };
const SPECS: Record<K, FieldSpec> = {
  income: { label: "Monthly net income", min: 0, max: 1e10 },
  otherIncome: { label: "Other monthly income", min: 0, max: 1e10, optional: true },
  existingEmi: { label: "Existing EMIs", min: 0, max: 1e10, optional: true },
  obligations: { label: "Other fixed obligations", min: 0, max: 1e10, optional: true },
  coIncome: { label: "Co-applicant income", min: 0, max: 1e10, optional: true },
  coEmi: { label: "Co-applicant EMIs", min: 0, max: 1e10, optional: true },
  age: { label: "Age", min: 18, max: 80, integer: true },
  retireAge: { label: "Retirement age", min: 40, max: 80, integer: true },
  tenureYears: { label: "Preferred tenure", min: 1, max: 40 },
  rate: { label: "Interest rate", min: 0, max: 30 },
  foirPct: { label: "FOIR", min: 10, max: 90 },
  propertyValue: { label: "Property value", min: 1, max: 1e11 },
  downPayment: { label: "Down payment", min: 0, max: 1e11, optional: true },
  maxTenureYears: { label: "Lender's longest tenure", min: 1, max: 40 },
};

export default function HomeLoanEligibilityCalculator() {
  const [emp, setEmp] = useState<"salaried" | "self">("salaried");
  const [co, setCo] = useState(false);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "home-loan-eligibility-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = { ...parsed.v, coIncome: co ? parsed.v.coIncome : 0, coEmi: co ? parsed.v.coEmi : 0 };
    if (v.downPayment > v.propertyValue) return { error: "The down payment is more than the property value.", field: "downPayment" as K };
    return { v, r: homeLoanEligibility(v) };
  }, [parsed, co]);
  const ok = out && !("error" in out) ? out : null;
  const r = ok?.r;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : out && "error" in out && out.field === k ? out.error : null);
  const why = r ? { capacity: "your repayment capacity", ltv: "the RBI loan-to-value cap", downPayment: "the property value minus your down payment" }[r.binding] : "";

  const steps = (): [string, string, boolean?][] =>
    r && ok
      ? [
          ["Combined monthly income", inr(r.totalIncome)],
          [`× FOIR ${ok.v.foirPct}% (assumption)`, inr(r.foirLimit)],
          ["− Existing EMIs and obligations (both applicants)", `− ${inr(r.obligations)}`],
          ["= EMI you may be eligible for", inr(r.eligibleEmi), true],
          ["Tenure used", `${+r.tenure.toFixed(2)} years${r.tenure < ok.v.tenureYears ? ` (limited by retirement at ${ok.v.retireAge} or the lender's maximum)` : ""}`],
          ...r.limits.map((l) => [`Limit — ${l.label}`, inr(l.amount)] as [string, string]),
          ["Indicative loan (lowest limit)", inr(r.loan), true],
          ["EMI on that loan", inr(r.emi)],
          ["Your own contribution", inr(r.ownContribution)],
          ["Loan-to-value", `${pct(r.ltvPct, 1)} (cap ${r.ltvCap}% for this loan size)`],
          ["Total interest", inr(r.totalInterest)],
          ["Total repayment", inr(r.totalRepayment)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="Employment" value={emp} onChange={setEmp} options={[{ value: "salaried", label: "Salaried" }, { value: "self", label: "Self-employed" }]} />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="el-inc" label={emp === "salaried" ? "Monthly net salary" : "Average monthly income (from ITRs)"} prefix="₹" value={f.income} onChange={(v) => set("income", v)} error={err("income")} size="lg" hint={emp === "self" ? "Lenders usually average the last 2–3 years' returns." : undefined} />
            <NumberField id="el-oth" label="Other monthly income" prefix="₹" value={f.otherIncome} onChange={(v) => set("otherIncome", v)} error={err("otherIncome")} hint="Rent received etc. Lenders may count only part." />
            <NumberField id="el-emi" label="Existing EMIs" prefix="₹" value={f.existingEmi} onChange={(v) => set("existingEmi", v)} error={err("existingEmi")} />
            <NumberField id="el-ob" label="Other fixed obligations" prefix="₹" value={f.obligations} onChange={(v) => set("obligations", v)} error={err("obligations")} hint="e.g. card dues lenders count." />
          </div>
          <Toggle checked={co} onChange={setCo} label="Add a co-applicant" description="Their income and EMIs are added once" />
          {co && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="el-coinc" label="Co-applicant monthly net income" prefix="₹" value={f.coIncome} onChange={(v) => set("coIncome", v)} error={err("coIncome")} />
              <NumberField id="el-coemi" label="Co-applicant existing EMIs" prefix="₹" value={f.coEmi} onChange={(v) => set("coEmi", v)} error={err("coEmi")} />
            </div>
          )}
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="el-age" label="Your age" value={f.age} onChange={(v) => set("age", v)} error={err("age")} integer />
            <NumberField id="el-ret" label="Loan must end by age" value={f.retireAge} onChange={(v) => set("retireAge", v)} error={err("retireAge")} integer hint="Often retirement for salaried, later for self-employed." />
            <NumberField id="el-ten" label="Preferred tenure" suffix="years" value={f.tenureYears} onChange={(v) => set("tenureYears", v)} error={err("tenureYears")} />
            <NumberField id="el-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="el-prop" label="Property value" prefix="₹" value={f.propertyValue} onChange={(v) => set("propertyValue", v)} error={err("propertyValue")} hint="Agreement value, excluding stamp duty and registration." />
            <NumberField id="el-dp" label="Down payment you can make" prefix="₹" value={f.downPayment} onChange={(v) => set("downPayment", v)} error={err("downPayment")} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="el-foir" label="FOIR — share of income for all EMIs" suffix="%" value={f.foirPct} onChange={(v) => set("foirPct", v)} error={err("foirPct")} hint="An assumption. Lenders use roughly 40–65% depending on income and profile." />
            <NumberField id="el-max" label="Lender's longest tenure" suffix="years" value={f.maxTenureYears} onChange={(v) => set("maxTenureYears", v)} error={err("maxTenureYears")} />
          </div>
        </Panel>

        <ResultCard eyebrow="Indicative home loan" state={state} error={errorMsg} empty="Enter your income, EMIs and the property value." onReset={() => { setF(DEFAULT); setCo(false); }} footer={`${LOAN_DISCLAIMER} Approval depends on the lender's policy, your credit history, the property's valuation and documents.`}>
          {r && ok && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="el-loan">
                {inr(r.loan)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="el-binding">
                {r.loan > 0 ? `${lakhCrore(r.loan)} — limited by ${why}` : r.months === 0 ? "No tenure left before the age the loan must end by." : "Your existing EMIs already use the FOIR you've set."}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Estimated EMI" value={inr(r.emi)} testId="el-emi" />
                <Figure label="EMI room at your FOIR" value={inr(r.eligibleEmi)} testId="el-room" />
                <Figure label="Tenure" value={`${+r.tenure.toFixed(2)} years`} testId="el-tenure" />
                <Figure label="Property value" value={inr(ok.v.propertyValue)} />
                <Figure label="Your contribution" value={inr(r.ownContribution)} testId="el-own" />
                <Figure label="Loan-to-value" value={pct(r.ltvPct, 1)} testId="el-ltv" />
                <Figure label="Total interest" value={inr(r.totalInterest)} />
                <Figure label="Total repayment" value={inr(r.totalRepayment)} strong />
              </dl>
              <DarkNotes notes={[`All EMIs together would take ${pct(r.foirUsed, 1)} of your combined income.`, ...(ok.v.downPayment + r.loan < ok.v.propertyValue ? [`Your down payment plus this loan is ${inr(ok.v.propertyValue - ok.v.downPayment - r.loan)} short of the property value.`] : []), "Add stamp duty and registration on top — they're usually paid from your own funds."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Home loan eligibility — ZSpace Tools", ...steps().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "home-loan-eligibility-calculator" })} />
                <DarkButton onClick={() => printSummary("Home loan eligibility estimate", steps().map(([a, b]) => [a, b]), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">How the estimate was worked out</h2>
          <Rows rows={steps()} testId="el-steps" />
        </Panel>
      )}

      <RulesPanel
        title="Rules and assumptions"
        effective="RBI loan-to-value limits for individual housing loans"
        rows={[
          ...LTV_RULES.bands.map((b, k) => ({ label: b.upTo === null ? `Loans above ₹${(LTV_RULES.bands[k - 1].upTo! / 1e5).toFixed(0)} lakh` : `Loans up to ₹${(b.upTo / 1e5).toFixed(0)} lakh`, value: `up to ${b.maxPct}% of property value`, status: LTV_RULES.status })),
          { label: "FOIR", value: `${ok?.v.foirPct ?? 50}% — your assumption, not a rule` },
          { label: "Longest tenure and loan end age", value: "Your assumptions — lender policies differ" },
        ]}
        sources={LTV_RULES.sources}
        notes={[LTV_RULES.note]}
      />

      <Formula>
        <p>EMI room = combined net income × FOIR − existing EMIs and obligations of both applicants. Repayment capacity = EMI room × (1 − (1 + r)^−n) ÷ r, with r = rate ÷ 12 and n = tenure in months (the shorter of your preferred tenure, the lender&rsquo;s maximum and the years left until the loan must end).</p>
        <p>The indicative loan is the lowest of: repayment capacity, the RBI loan-to-value cap for that loan size, and the property value minus your down payment. It&rsquo;s rounded down to the nearest ₹100.</p>
      </Formula>
    </div>
  );
}
