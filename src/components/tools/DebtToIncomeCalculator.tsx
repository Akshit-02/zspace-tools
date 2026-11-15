"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER } from "./loan-ui";
import { dti } from "@/lib/loans/borrowing";
import { inr } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

type K = "gross" | "net" | "otherIncome" | "home" | "car" | "personal" | "education" | "cards" | "other" | "proposed" | "target";
const DEFAULT: Record<K, string> = { gross: "150000", net: "120000", otherIncome: "", home: "30000", car: "10000", personal: "", education: "", cards: "5000", other: "", proposed: "", target: "40" };
const SPECS: Record<K, FieldSpec> = {
  gross: { label: "Gross monthly income", min: 0, max: 1e10 },
  net: { label: "Net monthly income", min: 0, max: 1e10 },
  otherIncome: { label: "Other regular income", min: 0, max: 1e10, optional: true },
  home: { label: "Home loan EMI", min: 0, max: 1e9, optional: true },
  car: { label: "Car loan EMI", min: 0, max: 1e9, optional: true },
  personal: { label: "Personal loan EMI", min: 0, max: 1e9, optional: true },
  education: { label: "Education loan EMI", min: 0, max: 1e9, optional: true },
  cards: { label: "Credit card payments", min: 0, max: 1e9, optional: true },
  other: { label: "Other debt payments", min: 0, max: 1e9, optional: true },
  proposed: { label: "Proposed new EMI", min: 0, max: 1e9, optional: true },
  target: { label: "Target ratio", min: 1, max: 100 },
};

/** Plain-language band, so meaning never relies on colour alone. */
function band(v: number | null, target: number) {
  if (v === null) return "—";
  if (v <= target * 0.75) return "well within your target";
  if (v <= target) return "within your target";
  return "above your target";
}

export default function DebtToIncomeCalculator() {
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "debt-to-income-ratio-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.net > v.gross) return { error: "Net income can't be more than gross income.", field: "net" as K };
    return { r: dti({ gross: v.gross, net: v.net, otherIncome: v.otherIncome, housing: v.home, debts: v.car + v.personal + v.education + v.cards + v.other, proposed: v.proposed, target: v.target }), v };
  }, [parsed]);
  const ok = out && !("error" in out) ? out : null;
  const r = ok?.r;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : out && "error" in out && out.field === k ? out.error : null);
  const t = ok?.v.target ?? 40;
  const P = (v: number | null) => (v === null ? "— (no income entered)" : pct(v, 1));

  const summary = (): [string, string][] =>
    r && ok
      ? [
          ["Gross monthly income (incl. other)", inr(r.grossTotal)],
          ["Net monthly income (incl. other)", inr(r.netTotal)],
          ["Monthly debt payments", inr(r.debt)],
          ["Housing ratio (front-end, gross)", P(r.frontEnd)],
          ["Debt-to-income (back-end, gross)", P(r.backEnd)],
          ["Debt ÷ net income", P(r.netRatio)],
          ...(ok.v.proposed ? ([["DTI with the new EMI (gross)", P(r.proposedBackEnd)], ["Debt ÷ net income with the new EMI", P(r.proposedNet)]] as [string, string][]) : []),
          ["Remaining after debt payments", inr(ok.v.proposed ? r.remainingAfter : r.remaining)],
          [`Extra EMI before reaching ${t}%`, inr(r.headroom)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="dti-gross" label="Gross monthly income" prefix="₹" value={f.gross} onChange={(v) => set("gross", v)} error={err("gross")} size="lg" hint="Before tax and deductions." />
            <NumberField id="dti-net" label="Net monthly income" prefix="₹" value={f.net} onChange={(v) => set("net", v)} error={err("net")} size="lg" hint="What reaches your account." />
          </div>
          <NumberField id="dti-oth" label="Other regular income" prefix="₹" value={f.otherIncome} onChange={(v) => set("otherIncome", v)} error={err("otherIncome")} />
          <fieldset className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <legend className="mb-1 text-sm font-medium">Monthly debt payments</legend>
            <NumberField id="dti-home" label="Home loan EMI" prefix="₹" value={f.home} onChange={(v) => set("home", v)} error={err("home")} />
            <NumberField id="dti-car" label="Car loan EMI" prefix="₹" value={f.car} onChange={(v) => set("car", v)} error={err("car")} />
            <NumberField id="dti-pl" label="Personal loan EMI" prefix="₹" value={f.personal} onChange={(v) => set("personal", v)} error={err("personal")} />
            <NumberField id="dti-edu" label="Education loan EMI" prefix="₹" value={f.education} onChange={(v) => set("education", v)} error={err("education")} />
            <NumberField id="dti-cc" label="Credit card payments" prefix="₹" value={f.cards} onChange={(v) => set("cards", v)} error={err("cards")} hint="What you pay each month towards card dues." />
            <NumberField id="dti-other" label="Other debt payments" prefix="₹" value={f.other} onChange={(v) => set("other", v)} error={err("other")} />
          </fieldset>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="dti-new" label="Proposed new EMI (optional)" prefix="₹" value={f.proposed} onChange={(v) => set("proposed", v)} error={err("proposed")} />
            <NumberField id="dti-target" label="Your target ratio" suffix="% of gross" value={f.target} onChange={(v) => set("target", v)} error={err("target")} hint="Your choice — lenders use their own limits." />
          </div>
        </Panel>

        <ResultCard eyebrow="Debt-to-income ratio" state={state} error={errorMsg} empty="Enter your income and debt payments." onReset={() => setF(DEFAULT)} footer={LOAN_DISCLAIMER}>
          {r && ok && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="dti-main">
                {r.backEnd === null ? "—" : pct(r.backEnd, 1)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="dti-band">
                of gross income goes to debt — {band(r.backEnd, t)} of {t}%
              </p>
              <div className="mt-4" aria-hidden>
                <div className="relative h-2.5 rounded-full bg-ivory/15">
                  <div className="h-2.5 rounded-full bg-orange" style={{ width: `${Math.min(100, r.backEnd ?? 0)}%` }} />
                  <div className="absolute -top-1 h-4.5 w-0.5 bg-ivory" style={{ left: `${Math.min(100, t)}%` }} />
                </div>
                <p className="mt-1 text-xs text-ivory/55">Bar: your ratio · line: your {t}% target</p>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Monthly debt payments" value={inr(r.debt)} testId="dti-debt" />
                <Figure label="Housing ratio (front-end)" value={P(r.frontEnd)} testId="dti-front" />
                <Figure label="Debt ÷ net income" value={P(r.netRatio)} testId="dti-net" />
                {ok.v.proposed > 0 && <Figure label="With the new EMI (gross)" value={`${P(r.proposedBackEnd)} — ${band(r.proposedBackEnd, t)}`} strong testId="dti-proposed" />}
                <Figure label="Left after debt payments" value={inr(ok.v.proposed ? r.remainingAfter : r.remaining)} testId="dti-left" />
                <Figure label={`Extra EMI before reaching ${t}%`} value={inr(r.headroom)} testId="dti-headroom" />
              </dl>
              <DarkNotes notes={["No single ratio guarantees a loan. Indian lenders mostly look at EMIs against net income (FOIR) and set their own limits by income, credit score and loan type."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Debt-to-income — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "debt-to-income-ratio-calculator" })} />
                <DarkButton onClick={() => printSummary("Debt-to-income ratio", summary(), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <Formula>
        <p>Back-end DTI = all monthly debt payments ÷ gross monthly income × 100. Front-end (housing) ratio = home-loan EMI ÷ gross income × 100.</p>
        <p>Debt ÷ net income uses take-home pay instead — close to the FOIR many Indian lenders use. Headroom = target % × gross income − current debt payments.</p>
      </Formula>
    </div>
  );
}
