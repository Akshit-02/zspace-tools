"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, inr, parseForm, type FieldSpec } from "./india-ui";
import { esiMonth } from "@/lib/india/payroll";
import { ESI_RULES } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "wages" | "startWages";
const DEFAULT: Record<K, string> = { wages: "18000", startWages: "" };
const SPECS: Record<K, FieldSpec> = {
  wages: { label: "Gross monthly wages", min: 0, max: 1e8 },
  startWages: { label: "Wages at the start of the period", min: 0, max: 1e8, optional: true },
};

export default function EsiCalculator() {
  const [disabled, setDisabled] = useState(false);
  const [raised, setRaised] = useState(false);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "esi-calculator" }), []);

  const ceiling = disabled ? ESI_RULES.wageCeilingDisabled : ESI_RULES.wageCeiling;
  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const start = raised && parsed.v.startWages > 0 ? parsed.v.startWages : parsed.v.wages;
    const covered = start <= ceiling;
    return { m: esiMonth(parsed.v.wages, covered, disabled), start, covered };
  }, [parsed, raised, ceiling, disabled]);
  const r = res?.m ?? null;
  const state = r ? "ok" : !parsed.ok && parsed.field ? "error" : "empty";
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);

  const summary = (): [string, string][] =>
    r
      ? [
          ["Gross monthly wages", inr(parsed.ok ? parsed.v.wages : 0)],
          ["Covered", r.covered ? "Yes" : "No"],
          [`Employee share (${ESI_RULES.employeePct}%)`, inr(r.employee)],
          [`Employer share (${ESI_RULES.employerPct}%)`, inr(r.employer)],
          ["Total per month", inr(r.total)],
          ["Total for a 6-month period", inr(r.total * 6)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="esi-wages" label="Gross monthly wages" prefix="₹" value={f.wages} onChange={(v) => set("wages", v)} error={err("wages")} size="lg" hint="All wages paid in cash for the month, including allowances and overtime — not employer PF/ESI, gratuity or annual bonus." />
          <Toggle checked={disabled} onChange={setDisabled} label="Employee with a disability" description={`Coverage limit ₹${ESI_RULES.wageCeilingDisabled.toLocaleString("en-IN")} instead of ₹${ESI_RULES.wageCeiling.toLocaleString("en-IN")}`} />
          <Toggle checked={raised} onChange={setRaised} label="My wages changed during this contribution period" description="Coverage is decided by wages at the start of April or October" />
          {raised && <NumberField id="esi-start" label="Wages at the start of the period" prefix="₹" value={f.startWages} onChange={(v) => set("startWages", v)} error={err("startWages")} />}
        </Panel>

        <ResultCard eyebrow="Your ESI deduction per month" state={state} error={!parsed.ok ? parsed.message : undefined} empty="Enter gross monthly wages." onReset={() => { setF(DEFAULT); setRaised(false); }} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="esi-employee">
                {inr(r.employee)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="esi-status">
                {r.covered ? `${ESI_RULES.employeePct}% of wages, rounded up` : "Not covered — no ESI deduction"}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label={`Employer share (${ESI_RULES.employerPct}%)`} value={inr(r.employer)} testId="esi-employer" />
                <Figure label="Total per month" value={inr(r.total)} strong testId="esi-total" />
                <Figure label="Employee share for a 6-month period" value={inr(r.employee * 6)} />
                <Figure label="Total for a 6-month period" value={inr(r.total * 6)} />
              </dl>
              <DarkNotes notes={[...(r.reason ? [r.reason] : []), "Employees with average daily wages up to ₹176 don't pay their share; the employer still pays 3.25%. This exemption isn't modelled.", "ESI applies only in notified areas to establishments with 10 or more employees."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["ESI contribution — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "esi-calculator" })} />
                <DarkButton onClick={() => printSummary("ESI contribution", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <RulesPanel
        effective="Rates from 1 July 2019; contribution periods April–September and October–March"
        rows={[
          { label: "Employee share", value: `${ESI_RULES.employeePct}% of gross wages`, status: ESI_RULES.statusRates },
          { label: "Employer share", value: `${ESI_RULES.employerPct}% of gross wages`, status: ESI_RULES.statusRates },
          { label: "Coverage limit", value: `₹${ESI_RULES.wageCeiling.toLocaleString("en-IN")} a month (₹${ESI_RULES.wageCeilingDisabled.toLocaleString("en-IN")} for persons with disability)`, status: ESI_RULES.statusCeiling },
          { label: "Rounding", value: ESI_RULES.rounding, status: ESI_RULES.statusRates },
          { label: "Contribution periods", value: ESI_RULES.periods.map((p) => p.label).join(" · "), status: ESI_RULES.statusRates },
        ]}
        sources={ESI_RULES.sources}
        notes={[ESI_RULES.note]}
      />

      <Formula>
        <p>Employee share = 0.75% × gross monthly wages; employer share = 3.25%. Each is rounded up to the next rupee.</p>
        <p>You&rsquo;re covered for a whole contribution period if your wages were within the limit at its start. If they rise above the limit mid-period, contributions continue until the period ends; from the next period you&rsquo;re out.</p>
      </Formula>
    </div>
  );
}
