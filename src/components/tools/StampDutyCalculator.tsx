"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Notice } from "./ui";
import { DarkButton, Figure, Formula, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, StatusBadge, pct } from "./india-ui";
import { CHARGE_DEFAULT, ChargeInputs, CoveragePanel, useChargeInput, type ChargeForm } from "./property-charges-ui";
import { PROPERTY_RULES_VERIFIED, basisValue, fmtDate, stampDuty, unsupportedReason } from "@/lib/loans/property-rules";
import { inr } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

const DISCLAIMER = "Indicative only. The stamp duty payable is decided by the registering authority on the date of registration — confirm it with the sub-registrar's office or a property lawyer before paying.";

export default function StampDutyCalculator() {
  const [f, setF] = useState<ChargeForm>(CHARGE_DEFAULT);
  useEffect(() => track("tool_opened", { tool: "stamp-duty-calculator" }), []);
  const p = useChargeInput(f);
  const res = useMemo(() => (p.ok ? (f.stateId.startsWith("x-") ? { ok: false as const, reason: unsupportedReason(f.stateId) } : stampDuty(p.input)) : null), [p, f.stateId]);
  const manual = p.ok && res && !res.ok && p.manualEntered ? { basis: basisValue(p.input), amount: Math.round((basisValue(p.input) * p.manualPct) / 100) } : null;
  const state: "ok" | "error" | "empty" = res ? "ok" : !p.ok && p.field ? "error" : "empty";
  const err = (k: "value" | "guidance" | "manualPct") => (!p.ok && p.field === k ? p.message : null);

  const summary = (): [string, string][] =>
    res?.ok
      ? [
          ["State / area", `${res.state.name} — ${res.area.label}`],
          ["Basis", `${inr(res.basis)} (${res.state.basis.toLowerCase()})`],
          ...res.lines.map((l) => [`${l.label} (${pct(l.ratePct, 3)})`, inr(l.amount)] as [string, string]),
          ...(res.concession ? ([["Concession versus the standard rate", `− ${inr(res.concession)}`]] as [string, string][]) : []),
          ["Estimated stamp duty", inr(res.total)],
          ["Rule in force from", fmtDate(res.rule.from)],
          ["Rules last checked", fmtDate(PROPERTY_RULES_VERIFIED)],
        ]
      : manual
        ? [["Basis", inr(manual.basis)], ["Rate you entered", `${p.ok ? p.manualPct : 0}%`], ["Your estimate", inr(manual.amount)]]
        : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <ChargeInputs f={f} setF={setF} idp="sd" err={err} manualLabel="Stamp duty rate you've been quoted" showManual={!!res && !res.ok} />

        <ResultCard eyebrow="Estimated stamp duty" state={state} error={!p.ok ? p.message : undefined} empty="Choose a state and enter the property value." onReset={() => setF(CHARGE_DEFAULT)} footer={DISCLAIMER}>
          {res?.ok ? (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="sd-total">
                {inr(res.total)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="sd-rate">
                {pct(res.effectivePct, 3)} of {inr(res.basis)} · {res.state.name}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10" data-testid="sd-lines">
                {res.lines.map((l) => (
                  <Figure key={l.label} label={`${l.label} · ${pct(l.ratePct, 3)}`} value={<span className="inline-flex items-center gap-2">{inr(l.amount)}{l.status !== "verified" && <StatusBadge status={l.status} />}</span>} />
                ))}
                {res.concession > 0 && <Figure label="Concession applied" value={`− ${inr(res.concession)}`} testId="sd-concession" />}
                <Figure label="Calculated on" value={inr(res.basis)} />
                <Figure label="Rule in force from" value={fmtDate(res.rule.from)} />
              </dl>
              <DarkNotes notes={res.rule.notes} />
            </>
          ) : res && !res.ok ? (
            <>
              <p className="mt-4 text-lg text-ivory/85" role="status" data-testid="sd-unsupported">
                Not calculated: {res.reason}
              </p>
              {manual ? (
                <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                  <Figure label="Your estimate at the rate you entered" value={inr(manual.amount)} strong testId="sd-manual" />
                  <Figure label="Calculated on" value={inr(manual.basis)} />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ivory/65">Enter the rate you&rsquo;ve been quoted to work out the amount.</p>
              )}
            </>
          ) : null}
          {(res?.ok || manual) && (
            <div className="mt-6 flex flex-wrap gap-2">
              <CopyButton text={() => ["Stamp duty estimate — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "stamp-duty-calculator" })} />
              <DarkButton onClick={() => printSummary("Stamp duty estimate", summary(), [DISCLAIMER])}>
                <Printer aria-hidden className="size-4" /> Print
              </DarkButton>
            </div>
          )}
        </ResultCard>
      </div>

      <Notice>
        Registration fees are separate from stamp duty — work them out with the <Link className="underline" href="/property-registration-charges-calculator/">Property Registration Charges Calculator</Link>.
      </Notice>

      <CoveragePanel kind="stamp" sources={res?.ok ? res.rule.sources : []} notes={["Stamp duty is charged on the higher of the agreement value and the government's guidance (circle / ready-reckoner) value in the states covered.", "Rates are applied from the date each rule took effect; a transaction dated before our earliest rule isn't priced."]} />

      <Formula>
        <p>Stamp duty = basis × rate, where basis = the higher of the transaction value and the guidance value. Surcharges set as a share of the duty (Rajasthan&rsquo;s 30%) are added on the duty; cesses set as a share of value (Mumbai&rsquo;s 1% metro cess) are added on the basis.</p>
        <p>Concessions shown are the difference from the rate a male buyer would pay under the same rule. The total is rounded to the nearest rupee; registries may round up to the next rupee or ten.</p>
      </Formula>
    </div>
  );
}
