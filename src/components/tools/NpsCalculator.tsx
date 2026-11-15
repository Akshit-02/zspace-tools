"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, compactMoney } from "./charts";
import { DISCLAIMER, DarkNotes, RulesPanel, inr, parseForm, type FieldSpec } from "./india-ui";
import { projectNps } from "@/lib/india/salary";
import { NPS_EXIT, NPS_RULES, type NpsExit, type NpsSector } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "age" | "exitAge" | "monthly" | "stepUp" | "balance" | "returnPct" | "annuityPct" | "annuityRate";
const DEFAULT: Record<K, string> = { age: "30", exitAge: "60", monthly: "5000", stepUp: "5", balance: "", returnPct: "9", annuityPct: "20", annuityRate: "6" };
const SPECS: Record<K, FieldSpec> = {
  age: { label: "Current age", min: 18, max: 84, integer: true },
  exitAge: { label: "Exit age", min: 19, max: NPS_RULES.maxAge, integer: true },
  monthly: { label: "Monthly contribution", min: 0, max: 1e8 },
  stepUp: { label: "Yearly increase", min: 0, max: 50, optional: true },
  balance: { label: "Current NPS balance", min: 0, max: 1e10, optional: true },
  returnPct: { label: "Expected return", min: 0, max: 20 },
  annuityPct: { label: "Share used for annuity", min: 0, max: 100 },
  annuityRate: { label: "Annuity rate", min: 0, max: 15 },
};
const axis = compactMoney("en-IN", "INR");

export default function NpsCalculator() {
  const [sector, setSector] = useState<NpsSector>("nonGovt");
  const [exit, setExit] = useState<NpsExit>("normal");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "nps-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.exitAge <= v.age) return { error: "Exit age must be after your current age.", field: "exitAge" as K };
    if (v.monthly <= 0 && v.balance <= 0) return { error: "Enter a monthly contribution or a current balance.", field: "monthly" as K };
    return projectNps({ ...v, sector, exit });
  }, [parsed, sector, exit]);
  const r = res && !("error" in res) ? res : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : res && "error" in res && res.field === k ? res.error : null);
  const rule = NPS_EXIT[sector][exit];
  const chosen = parsed.ok ? parsed.v.annuityPct : 0;

  const summary = (): [string, string][] =>
    r
      ? [
          ["Corpus at exit", inr(r.corpus)],
          ["You contribute", inr(r.contributed)],
          ["Growth", inr(r.growth)],
          [`Annuity (${r.annuityPct}%)`, inr(r.annuityAmount)],
          ["Lump sum", inr(r.lumpSum)],
          ["Estimated pension a month", inr(r.monthlyPension)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="nps-monthly" label="Monthly contribution" prefix="₹" value={f.monthly} onChange={(v) => set("monthly", v)} error={err("monthly")} size="lg" hint="Yours plus your employer's, if any." />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="nps-age" label="Current age" value={f.age} onChange={(v) => set("age", v)} error={err("age")} integer />
            <NumberField id="nps-exit" label="Exit age" value={f.exitAge} onChange={(v) => set("exitAge", v)} error={err("exitAge")} integer hint={`Up to ${NPS_RULES.maxAge}.`} />
            <NumberField id="nps-step" label="Yearly increase in contribution" suffix="%" value={f.stepUp} onChange={(v) => set("stepUp", v)} error={err("stepUp")} />
            <NumberField id="nps-bal" label="Current NPS balance" prefix="₹" value={f.balance} onChange={(v) => set("balance", v)} error={err("balance")} />
            <NumberField id="nps-ret" label="Expected return" suffix="% a year" value={f.returnPct} onChange={(v) => set("returnPct", v)} error={err("returnPct")} hint="An assumption — NPS returns depend on markets and your asset mix." />
            <NumberField id="nps-arate" label="Annuity rate" suffix="% a year" value={f.annuityRate} onChange={(v) => set("annuityRate", v)} error={err("annuityRate")} hint="Quoted by insurers at exit; varies with age and option." />
          </div>
          <div className="grid gap-4 border-t border-line pt-5">
            <div>
              <p className="mb-1.5 text-sm font-medium">Subscriber type</p>
              <Segmented label="Subscriber type" value={sector} onChange={setSector} options={[{ value: "nonGovt", label: "Private / all-citizen" }, { value: "govt", label: "Government" }]} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Exit</p>
              <Segmented label="Exit type" value={exit} onChange={setExit} options={[{ value: "normal", label: "At 60 or later", hint: "normal exit" }, { value: "premature", label: "Before 60", hint: "premature exit" }]} />
            </div>
            <NumberField id="nps-apct" label="Share of corpus to buy an annuity" suffix="%" value={f.annuityPct} onChange={(v) => set("annuityPct", v)} error={err("annuityPct")} hint={`At least ${rule.minAnnuityPct}% for this exit, unless the corpus is ₹${rule.fullWithdrawalUpTo.toLocaleString("en-IN")} or less.`} />
          </div>
        </Panel>

        <ResultCard eyebrow="NPS corpus at exit" state={state} error={errorMsg} empty="Enter your contribution, age and expected return." onReset={() => setF(DEFAULT)} footer={`${DISCLAIMER} Returns are not guaranteed.`}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="nps-corpus">
                {inr(r.corpus)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">at an assumed {parsed.ok ? parsed.v.returnPct : ""}% a year · in future rupees, not today&rsquo;s</p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Lump sum ${inr(r.lumpSum)}, annuity ${inr(r.annuityAmount)}`} parts={[{ value: r.lumpSum, color: "rgba(250,247,242,0.9)" }, { value: r.annuityAmount, color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Lump sum" value={inr(r.lumpSum)} testId="nps-lump" />
                  <Figure label={`Annuity (${r.annuityPct}%)`} value={inr(r.annuityAmount)} testId="nps-annuity" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="You'll contribute" value={inr(r.contributed)} />
                {r.existingBalance > 0 && <Figure label="Current balance" value={inr(r.existingBalance)} />}
                <Figure label="Growth" value={inr(r.growth)} />
                <Figure label="Estimated pension per month" value={inr(r.monthlyPension)} strong testId="nps-pension" />
              </dl>
              <DarkNotes
                notes={[
                  ...(r.fullAllowed ? [`The corpus is within ₹${rule.fullWithdrawalUpTo.toLocaleString("en-IN")}, so you may withdraw it all.`] : []),
                  ...(r.annuityPct > chosen ? [`Annuity raised to the ${r.minAnnuity}% minimum for this exit.`] : []),
                  "Tax isn't worked out here. Pension is taxable as income; a lump sum of up to 60% of the corpus has been tax-free, but how larger lump sums allowed since December 2025 are taxed isn't confirmed here.",
                ]}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["NPS projection — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "nps-calculator" })} />
                <DarkButton onClick={() => printSummary("NPS projection", summary(), [DISCLAIMER])}>
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
            <h2 className="font-display text-xl font-semibold">Corpus by age</h2>
            <Legend items={[{ label: "Contributed", color: CHART.charcoal }, { label: "Growth", color: CHART.orange }]} />
          </div>
          <BarChart
            label={`NPS corpus at each age; ${inr(r.corpus)} at exit.`}
            labels={r.years.map((y) => String(y.age))}
            series={[
              { label: "Contributed", color: CHART.charcoal, values: r.years.map((y) => y.contributed + r.existingBalance) },
              { label: "Growth", color: CHART.orange, values: r.years.map((y) => Math.max(0, y.balance - y.contributed - r.existingBalance)) },
            ]}
            stacked
            format={axis}
          />
        </Panel>
      )}

      <RulesPanel
        effective="PFRDA exit and withdrawal rules as amended in December 2025"
        rows={[
          { label: "Normal exit — private / all-citizen", value: `At least ${NPS_EXIT.nonGovt.normal.minAnnuityPct}% annuity; all as lump sum if corpus ≤ ₹${(NPS_EXIT.nonGovt.normal.fullWithdrawalUpTo / 1e5).toFixed(0)} lakh`, status: NPS_RULES.status },
          { label: "Normal exit — Government", value: `At least ${NPS_EXIT.govt.normal.minAnnuityPct}% annuity; all as lump sum if corpus ≤ ₹${(NPS_EXIT.govt.normal.fullWithdrawalUpTo / 1e5).toFixed(0)} lakh`, status: NPS_RULES.status },
          { label: "Exit before 60", value: `At least ${NPS_EXIT.nonGovt.premature.minAnnuityPct}% annuity; all as lump sum if corpus ≤ ₹${(NPS_EXIT.nonGovt.premature.fullWithdrawalUpTo / 1e5).toFixed(0)} lakh`, status: NPS_RULES.status },
          { label: "Staying invested", value: `Up to age ${NPS_RULES.maxAge}`, status: NPS_RULES.status },
          { label: "Return and annuity rate", value: "Your assumptions — not rules" },
        ]}
        sources={NPS_RULES.sources}
        notes={[NPS_RULES.note]}
      />

      <Formula>
        <p>The yearly return is converted to a monthly rate, <code>(1 + r)^(1/12) − 1</code>. Each month&rsquo;s contribution is added and the balance grows by that rate; contributions rise by the step-up once a year.</p>
        <p>At exit, the annuity share buys a pension: monthly pension ≈ annuity amount × annuity rate ÷ 12. The rest is the lump sum.</p>
      </Formula>
    </div>
  );
}
