"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Donut } from "./charts";
import { DarkNotes, Rows, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER, ScheduleSection } from "./loan-ui";
import { amortise } from "@/lib/loans/amortise";
import { loanCost } from "@/lib/loans/borrowing";
import { inr } from "@/lib/loans/format";
import { validateLoan } from "@/lib/emi";
import { track } from "@/lib/analytics";

type K = "amount" | "rate" | "tenure" | "feePct" | "feeFixed" | "gstPct" | "otherCharges";
const DEFAULT: Record<K, string> = { amount: "500000", rate: "12", tenure: "36", feePct: "2", feeFixed: "", gstPct: "18", otherCharges: "" };
const SPECS: Record<K, FieldSpec> = {
  amount: { label: "Loan amount", min: 1, max: 1e10 },
  rate: { label: "Interest rate", min: 0, max: 60 },
  tenure: { label: "Tenure", min: 1, max: 600 },
  feePct: { label: "Processing fee %", min: 0, max: 10, optional: true },
  feeFixed: { label: "Fixed processing fee", min: 0, max: 1e8, optional: true },
  gstPct: { label: "GST on fee", min: 0, max: 28, optional: true },
  otherCharges: { label: "Other charges", min: 0, max: 1e8, optional: true },
};

export default function PersonalLoanCalculator() {
  const [unit, setUnit] = useState<"months" | "years">("months");
  const [deducted, setDeducted] = useState(true);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "personal-loan-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const months = unit === "years" ? Math.round(v.tenure * 12) : v.tenure;
    const bad = validateLoan(v.amount, v.rate, months);
    if (bad) return { error: bad };
    const cost = loanCost({ principal: v.amount, rate: v.rate, months, feePct: v.feePct, feeFixed: v.feeFixed, gstPct: v.gstPct, otherCharges: v.otherCharges, deducted });
    if (cost.upfront >= v.amount) return { error: "Fees and charges are more than the loan amount." };
    return { v, months, cost, sched: amortise({ principal: v.amount, annualRate: v.rate, months }) };
  }, [parsed, unit, deducted]);
  const r = out && !("error" in out) ? out : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);

  const rows = (): [string, string, boolean?][] =>
    r
      ? [
          ["Loan principal", inr(r.v.amount), true],
          ["Processing fee", inr(r.cost.fee)],
          ["GST on processing fee", inr(r.cost.gst)],
          ...(r.v.otherCharges ? ([["Other charges", inr(r.v.otherCharges)]] as [string, string][]) : []),
          [deducted ? "Net amount credited to you" : "Amount credited (fees paid separately)", inr(deducted ? r.cost.net : r.v.amount), true],
          ["Monthly EMI", inr(r.sched.emi), true],
          ["Total interest", inr(r.sched.totalInterest)],
          ["Total repaid (EMIs)", inr(r.sched.totalEmiPaid)],
          ["Total cost of borrowing (interest + fees)", inr(r.sched.totalInterest + r.cost.upfront), true],
          ["Effective annual rate (incl. fees)", r.cost.apr ? pct(r.cost.apr.annual) : "—"],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="pl-amt" label="Loan amount" prefix="₹" value={f.amount} onChange={(v) => set("amount", v)} error={err("amount")} size="lg" />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="pl-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint="Reducing-balance rate from your offer." />
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <NumberField id="pl-tenure" label="Tenure" value={f.tenure} onChange={(v) => set("tenure", v)} error={err("tenure")} />
              <Segmented label="Tenure unit" className="mb-px h-11 w-36" size="sm" value={unit} onChange={setUnit} options={[{ value: "months", label: "Mths" }, { value: "years", label: "Yrs" }]} />
            </div>
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <NumberField id="pl-feepct" label="Processing fee" suffix="% of loan" value={f.feePct} onChange={(v) => set("feePct", v)} error={err("feePct")} />
            <NumberField id="pl-feefix" label="or a fixed fee" prefix="₹" value={f.feeFixed} onChange={(v) => set("feeFixed", v)} error={err("feeFixed")} />
            <NumberField id="pl-gst" label="GST on fee" suffix="%" value={f.gstPct} onChange={(v) => set("gstPct", v)} error={err("gstPct")} hint="18% is usual on loan fees." />
          </div>
          <NumberField id="pl-oth" label="Insurance or other upfront charges" prefix="₹" value={f.otherCharges} onChange={(v) => set("otherCharges", v)} error={err("otherCharges")} hint="Only if your lender charges them." />
          <Toggle checked={deducted} onChange={setDeducted} label="Fees are deducted from the loan" description="Most lenders credit the loan minus fees" />
        </Panel>

        <ResultCard eyebrow="Personal loan EMI" state={state} error={errorMsg} empty="Enter the loan amount, rate and tenure." onReset={() => setF(DEFAULT)} footer={LOAN_DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="pl-emi">
                {inr(r.sched.emi)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">a month for {r.months} months at {r.v.rate}%</p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Principal ${inr(r.v.amount)}, interest ${inr(r.sched.totalInterest)}, fees ${inr(r.cost.upfront)}`} parts={[{ value: r.v.amount, color: "rgba(250,247,242,0.9)" }, { value: r.sched.totalInterest, color: CHART.orange }, { value: r.cost.upfront, color: CHART.muted }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label={deducted ? "You receive" : "Credited"} value={inr(deducted ? r.cost.net : r.v.amount)} testId="pl-net" />
                  <Figure label="Interest" value={inr(r.sched.totalInterest)} testId="pl-interest" />
                  <Figure label="Fees + GST" value={inr(r.cost.upfront)} testId="pl-fees" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Total repaid" value={inr(r.sched.totalEmiPaid)} testId="pl-total" />
                <Figure label="Total cost of borrowing" value={inr(r.sched.totalInterest + r.cost.upfront)} />
                <Figure label="Effective annual rate (incl. fees)" value={r.cost.apr ? pct(r.cost.apr.annual) : "—"} strong testId="pl-apr" />
              </dl>
              <DarkNotes notes={["The effective rate treats what you actually receive as the loan and your EMIs as repayments, so fees push it above the quoted rate."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Personal loan estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "personal-loan-calculator" })} />
                <DarkButton onClick={() => printSummary("Personal loan estimate", rows().map(([a, b]) => [a, b]), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <>
          <Panel className="grid gap-3 p-5 sm:p-7">
            <h2 className="font-display text-xl font-semibold">Principal, disbursal and repayment</h2>
            <Rows rows={rows()} testId="pl-breakdown" />
          </Panel>
          <ScheduleSection res={r.sched} tool="personal-loan-calculator" csvName="personal-loan-schedule.csv" />
        </>
      )}

      <Formula>
        <p>EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1) on the full principal P — interest is charged on the whole loan even when fees are deducted from it.</p>
        <p>
          Effective annual rate: the monthly rate i that makes (amount received today) equal the present value of all EMIs, found numerically, then annualised as (1 + i)^12 − 1. EMIs are assumed one month apart, starting a month after disbursal.
        </p>
      </Formula>
    </div>
  );
}
