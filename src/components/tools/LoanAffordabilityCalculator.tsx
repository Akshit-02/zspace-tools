"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, inputClass } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER } from "./loan-ui";
import { affordability } from "@/lib/loans/borrowing";
import { parseNum } from "@/lib/discount";
import { inr, lakhCrore } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

type K = "income" | "otherIncome" | "expenses" | "existingEmi" | "cards" | "otherObligations" | "savings" | "rate" | "years";
const DEFAULT: Record<K, string> = { income: "100000", otherIncome: "", expenses: "40000", existingEmi: "10000", cards: "2000", otherObligations: "", savings: "300000", rate: "10", years: "5" };
const SPECS: Record<K, FieldSpec> = {
  income: { label: "Monthly take-home income", min: 0, max: 1e9 },
  otherIncome: { label: "Other regular income", min: 0, max: 1e9, optional: true },
  expenses: { label: "Essential expenses", min: 0, max: 1e9, optional: true },
  existingEmi: { label: "Existing EMIs", min: 0, max: 1e9, optional: true },
  cards: { label: "Credit card payments", min: 0, max: 1e9, optional: true },
  otherObligations: { label: "Other obligations", min: 0, max: 1e9, optional: true },
  savings: { label: "Emergency savings", min: 0, max: 1e11, optional: true },
  rate: { label: "Interest rate", min: 0, max: 60 },
  years: { label: "Tenure", min: 0.25, max: 40 },
};
const SCEN = [
  { label: "Conservative", pct: "30" },
  { label: "Balanced", pct: "40" },
  { label: "Higher commitment", pct: "50" },
];

function computeAfford(parsed: ReturnType<typeof parseForm<K>>, sp: string[]) {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.income + v.otherIncome <= 0) return { error: "Enter your monthly income." };
    const scenarios = [];
    for (const [k, s] of sp.entries()) {
      const n = parseNum(s);
      if (n === null || Number.isNaN(n) || n < 0 || n > 100) return { error: `${SCEN[k].label}: enter a percentage between 0 and 100.` };
      scenarios.push({ label: SCEN[k].label, pct: n });
    }
    return affordability({ ...v, months: Math.round(v.years * 12), scenarios });
}

export default function LoanAffordabilityCalculator() {
  const [f, setF] = useState(DEFAULT);
  const [sp, setSp] = useState(SCEN.map((s) => s.pct));
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "loan-affordability-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => computeAfford(parsed, sp), [parsed, sp]);
  const r = out && !("error" in out) ? out : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);
  const bal = r?.scenarios[1];

  const summary = (): [string, string][] =>
    r
      ? [
          ["Total monthly income", inr(r.income)],
          ["Monthly outgoings now", inr(r.outgo)],
          ["Monthly surplus", inr(r.surplus)],
          ["Debt payments ÷ income now", r.dtiNow === null ? "—" : pct(r.dtiNow, 1)],
          ...r.scenarios.flatMap((s) => [[`${s.label} (${s.pct}%): EMI`, inr(s.emi)], [`${s.label}: loan`, inr(s.loan)], [`${s.label}: left each month`, inr(s.leftover)]] as [string, string][]),
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="af-inc" label="Monthly take-home income" prefix="₹" value={f.income} onChange={(v) => set("income", v)} error={err("income")} size="lg" />
            <NumberField id="af-oth" label="Other regular income" prefix="₹" value={f.otherIncome} onChange={(v) => set("otherIncome", v)} error={err("otherIncome")} hint="Rent received, a partner's contribution you rely on." />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="af-exp" label="Essential monthly expenses" prefix="₹" value={f.expenses} onChange={(v) => set("expenses", v)} error={err("expenses")} hint="Rent, food, utilities, school fees, insurance, transport." />
            <NumberField id="af-emi" label="Existing loan EMIs" prefix="₹" value={f.existingEmi} onChange={(v) => set("existingEmi", v)} error={err("existingEmi")} />
            <NumberField id="af-cc" label="Credit card payments" prefix="₹" value={f.cards} onChange={(v) => set("cards", v)} error={err("cards")} hint="What you pay each month to stay on top of card dues." />
            <NumberField id="af-ob" label="Support for dependants, other commitments" prefix="₹" value={f.otherObligations} onChange={(v) => set("otherObligations", v)} error={err("otherObligations")} />
          </div>
          <NumberField id="af-sav" label="Emergency savings" prefix="₹" value={f.savings} onChange={(v) => set("savings", v)} error={err("savings")} />
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="af-rate" label="Loan interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
            <NumberField id="af-years" label="Loan tenure" suffix="years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} />
          </div>
          <fieldset className="grid gap-2 border-t border-line pt-5">
            <legend className="mb-1 text-sm font-medium">All debt repayments as a % of income — your limits</legend>
            <div className="grid grid-cols-3 gap-3">
              {SCEN.map((s, k) => (
                <div key={s.label}>
                  <label htmlFor={`af-s${k}`} className="mb-1 block text-xs text-ink-2">{s.label}</label>
                  <div className="relative">
                    <input id={`af-s${k}`} inputMode="decimal" className={`${inputClass} h-10 pr-7`} value={sp[k]} onChange={(e) => setSp((x) => x.map((y, j) => (j === k ? e.target.value : y)))} />
                    <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-2">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-2">Your own comfort levels, not lender rules. They include the EMIs and card payments you already have.</p>
          </fieldset>
        </Panel>

        <ResultCard eyebrow="Comfortable loan — balanced" state={state} error={errorMsg} empty="Enter your income and outgoings." onReset={() => { setF(DEFAULT); setSp(SCEN.map((s) => s.pct)); }} footer={LOAN_DISCLAIMER}>
          {r && bal && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="af-loan">
                {inr(bal.loan)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">with an EMI of {inr(bal.emi)} — {bal.pct}% of income for all debt</p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Monthly income" value={inr(r.income)} />
                <Figure label="Outgoings now" value={inr(r.outgo)} />
                <Figure label="Surplus now" value={inr(r.surplus)} testId="af-surplus" />
                <Figure label="Debt payments ÷ income now" value={r.dtiNow === null ? "—" : pct(r.dtiNow, 1)} testId="af-dti" />
                <Figure label="Emergency savings cover" value={r.emergencyMonths === null ? "—" : `${r.emergencyMonths.toFixed(1)} months of outgoings`} testId="af-emergency" />
              </dl>
              <DarkNotes
                notes={[
                  ...(r.surplus <= 0 ? ["Your outgoings already use all your income, so there's no room for a new EMI."] : []),
                  ...(r.emergencyMonths !== null && r.emergencyMonths < 6 ? ["Many planners suggest an emergency fund of about six months of outgoings before taking on new debt."] : []),
                  "A lender may approve a bigger EMI than this. What you can comfortably carry is your decision, not the lender's.",
                ]}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Loan affordability — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "loan-affordability-calculator" })} />
                <DarkButton onClick={() => printSummary("Loan affordability", summary(), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Three scenarios</h2>
          <div className="grid gap-3 md:grid-cols-3" data-testid="af-scenarios">
            {r.scenarios.map((s) => (
              <div key={s.label} className="rounded-[12px] border border-line p-4">
                <p className="text-sm font-bold">{s.label}</p>
                <p className="text-xs text-ink-2">{s.pct}% of income for all debt</p>
                <dl className="mt-3 grid gap-1.5 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-ink-2">New EMI</dt><dd className="font-mono">{inr(s.emi)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-2">Loan</dt><dd className="font-mono" data-testid={`af-loan-${s.label}`}>{lakhCrore(s.loan)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-2">Left each month</dt><dd className="font-mono">{inr(s.leftover)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-ink-2">Debt ÷ income after</dt><dd className="font-mono">{s.dtiAfter === null ? "—" : pct(s.dtiAfter, 1)}</dd></div>
                </dl>
                {s.limitedBySurplus && <p className="mt-2 text-xs text-ink-2">Capped by your monthly surplus.</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Formula>
        <p>Surplus = income − essential expenses − existing EMIs − card payments − other commitments. For each scenario, new EMI = (limit % × income − existing debt payments), but never more than the surplus.</p>
        <p>Loan = EMI × (1 − (1 + r)^−n) ÷ r, with r = annual rate ÷ 12 and n = months — the amount that EMI repays exactly over the tenure.</p>
      </Formula>
    </div>
  );
}
