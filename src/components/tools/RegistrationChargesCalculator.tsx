"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Notice, Panel } from "./ui";
import { DarkButton, Figure, Formula, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, Rows, StatusBadge, pct } from "./india-ui";
import { CHARGE_DEFAULT, ChargeInputs, CoveragePanel, useChargeInput, type ChargeForm } from "./property-charges-ui";
import { PROPERTY_RULES_VERIFIED, basisValue, fmtDate, registrationFee, stampDuty, unsupportedReason } from "@/lib/loans/property-rules";
import { inr } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

const DISCLAIMER = "Indicative government fees only — not legal fees, brokerage, loan charges or society charges. Confirm the payable amount with the sub-registrar's office before paying.";
const DEFAULT: ChargeForm = { ...CHARGE_DEFAULT, stateId: "delhi", areaId: "delhi" };

export default function RegistrationChargesCalculator() {
  const [f, setF] = useState<ChargeForm>(DEFAULT);
  useEffect(() => track("tool_opened", { tool: "property-registration-charges-calculator" }), []);
  const p = useChargeInput(f);
  const unsup = f.stateId.startsWith("x-");
  const res = useMemo(() => (p.ok ? (unsup ? { ok: false as const, reason: unsupportedReason(f.stateId) } : registrationFee(p.input)) : null), [p, unsup, f.stateId]);
  const stamp = useMemo(() => (p.ok && !unsup ? stampDuty(p.input) : null), [p, unsup]);
  const manual = p.ok && res && !res.ok && p.manualEntered ? { basis: basisValue(p.input), amount: Math.round((basisValue(p.input) * p.manualPct) / 100) } : null;
  const state = res ? "ok" : !p.ok && p.field ? "error" : "empty";
  const err = (k: "value" | "guidance" | "manualPct") => (!p.ok && p.field === k ? p.message : null);

  const summary = (): [string, string][] =>
    res?.ok
      ? [
          ["State / area", `${res.state.name} — ${res.area.label}`],
          ["Basis", inr(res.basis)],
          ["Registration fee", `${inr(res.fee)}${res.ratePct !== null ? ` (${pct(res.ratePct)})` : res.slab ? " (value slab)" : ""}`],
          ...res.extras.map((e) => [e.label, inr(e.amount)] as [string, string]),
          ["Total registration charges", inr(res.total)],
          ...(stamp?.ok ? ([["Stamp duty (separate)", inr(stamp.total)], ["Stamp duty + registration", inr(stamp.total + res.total)]] as [string, string][]) : []),
          ["Rule in force from", fmtDate(res.rule.from)],
          ["Rules last checked", fmtDate(PROPERTY_RULES_VERIFIED)],
        ]
      : manual
        ? [["Basis", inr(manual.basis)], ["Rate you entered", `${p.ok ? p.manualPct : 0}%`], ["Your estimate", inr(manual.amount)]]
        : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <ChargeInputs f={f} setF={setF} idp="rg" err={err} manualLabel="Registration fee rate you've been quoted" showManual={!!res && !res.ok} />

        <ResultCard eyebrow="Registration charges" state={state} error={!p.ok ? p.message : undefined} empty="Choose a state and enter the property value." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {res?.ok ? (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="rg-total">
                {inr(res.total)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="rg-rate">
                {res.ratePct !== null ? `${pct(res.ratePct)} of ${inr(res.basis)}` : `fixed fee for the ${res.slab?.upTo ? `value slab up to ${inr(res.slab.upTo)}` : "top value slab"}`} · {res.state.name}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Registration fee" value={inr(res.fee)} testId="rg-fee" />
                {res.extras.map((e) => (
                  <Figure key={e.label} label={e.label} value={<span className="inline-flex items-center gap-2">{inr(e.amount)}{e.status !== "verified" && <StatusBadge status={e.status} />}</span>} />
                ))}
                {res.concessionApplied && <Figure label="Concession" value={`${res.concessionApplied} · saves ${inr(res.concessionSaving)}`} testId="rg-concession" />}
                {res.capped && <Figure label="Maximum applied" value={inr(res.rule.max!)} />}
                {res.minApplied && <Figure label="Minimum applied" value={inr(res.rule.min!)} />}
                <Figure label="Calculated on" value={inr(res.basis)} />
                <Figure label="Rule in force from" value={fmtDate(res.rule.from)} />
              </dl>
              <DarkNotes notes={res.rule.notes} />
            </>
          ) : res && !res.ok ? (
            <>
              <p className="mt-4 text-lg text-ivory/85" role="status" data-testid="rg-unsupported">
                Not calculated: {res.reason}
              </p>
              {manual ? (
                <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                  <Figure label="Your estimate at the rate you entered" value={inr(manual.amount)} strong testId="rg-manual" />
                </dl>
              ) : (
                <p className="mt-3 text-sm text-ivory/65">Enter the fee rate you&rsquo;ve been quoted to work out the amount.</p>
              )}
            </>
          ) : null}
          {(res?.ok || manual) && (
            <div className="mt-6 flex flex-wrap gap-2">
              <CopyButton text={() => ["Property registration charges — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "property-registration-charges-calculator" })} />
              <DarkButton onClick={() => printSummary("Property registration charges", summary(), [DISCLAIMER])}>
                <Printer aria-hidden className="size-4" /> Print
              </DarkButton>
            </div>
          )}
        </ResultCard>
      </div>

      {res?.ok && stamp && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Government charges together</h2>
          {stamp.ok ? (
            <Rows
              testId="rg-combined"
              rows={[
                ["Stamp duty", inr(stamp.total)],
                ["Registration charges", inr(res.total)],
                ["Total government charges", inr(stamp.total + res.total), true],
                ["As a share of the value", pct(((stamp.total + res.total) / res.basis) * 100)],
              ]}
            />
          ) : (
            <p className="text-sm text-ink-2" data-testid="rg-combined-missing">Stamp duty isn&rsquo;t calculated for this selection ({stamp.reason}) — add it from your registrar&rsquo;s figure.</p>
          )}
          <p className="text-sm text-ink-2">
            See the <Link className="underline" href="/stamp-duty-calculator/">Stamp Duty Calculator</Link> for the duty breakdown and the <Link className="underline" href="/down-payment-calculator/">Down Payment Calculator</Link> for the total cash you&rsquo;ll need.
          </p>
        </Panel>
      )}

      <Notice>Legal fees, brokerage, home-loan processing fees and society transfer charges aren&rsquo;t government registration charges and aren&rsquo;t included.</Notice>

      <CoveragePanel kind="registration" sources={res?.ok ? res.rule.sources : []} notes={["Registration fees are charged on the same value as stamp duty in the states covered.", "Some states charge a percentage, others fixed fees by value slab; caps and concessions are applied only where verified."]} />

      <Formula>
        <p>Percentage states: fee = basis × rate, then any verified minimum or maximum, plus fixed charges (Delhi&rsquo;s ₹100 pasting fee). Slab states (Haryana): a fixed fee for the value band, plus the ₹200 HARIS charge.</p>
        <p>Basis = the higher of the transaction value and the guidance value. Concessions (Tamil Nadu&rsquo;s 1% for women up to ₹10 lakh) apply only when every condition is met on the registration date.</p>
      </Formula>
    </div>
  );
}
