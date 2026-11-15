"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Notice, Panel, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, Select, YearPicker, inr, parseForm, type FieldSpec } from "./india-ui";
import { tdsOnPayment } from "@/lib/india/salary";
import { TAX_YEARS, TDS_NO_PAN, TDS_RULES, TDS_SOURCES, type TaxYearId, type TdsCategory } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "amount" | "paidSoFar" | "rentMonths";
const DEFAULT: Record<K, string> = { amount: "75000", paidSoFar: "", rentMonths: "1" };
const SPECS: Record<K, FieldSpec> = {
  amount: { label: "Payment amount", min: 0, max: 1e11 },
  paidSoFar: { label: "Earlier payments this year", min: 0, max: 1e11, optional: true },
  rentMonths: { label: "Months covered", min: 1, max: 12, integer: true },
};
const CATS = Object.entries(TDS_RULES).map(([value, r]) => ({ value: value as TdsCategory, label: `${r.label} — ${r.rate}%` }));

export default function TdsCalculator() {
  const [year, setYear] = useState<TaxYearId>("2026-27");
  const [cat, setCat] = useState<TdsCategory>("professional");
  const [pan, setPan] = useState(true);
  const [senior, setSenior] = useState(false);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "tds-calculator" }), []);

  const R = TDS_RULES[cat];
  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const r = useMemo(() => (parsed.ok ? tdsOnPayment({ year, category: cat, amount: parsed.v.amount, paidSoFar: parsed.v.paidSoFar, rentMonths: parsed.v.rentMonths, senior, pan }) : null), [parsed, year, cat, senior, pan]);
  const state = r ? "ok" : !parsed.ok && parsed.field ? "error" : "empty";
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);
  const sec = (s: string) => `section ${s}`;

  const summary = (): [string, string][] =>
    r
      ? [
          ["Year", TAX_YEARS[year].label],
          ["Payment type", R.label],
          ["Section", sec(r.section)],
          ["Threshold", r.thresholdText],
          ["TDS applies", r.applies ? "Yes" : "No"],
          ["Amount TDS is worked on", inr(r.base)],
          ["Rate", `${r.rate}%`],
          ["TDS", inr(r.tds)],
          ["Net payment", inr(r.net)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <Notice>
        This calculator is for payments other than salary. For TDS on your salary, your employer spreads your yearly income tax over the months — estimate it with the <Link className="underline" href="/income-tax-calculator/">Income Tax Calculator</Link>.
      </Notice>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <YearPicker value={year} onChange={setYear} />
          <Select id="tds-cat" label="Type of payment" value={cat} onChange={setCat} options={CATS} hint={R.note} />
          <NumberField id="tds-amount" label={R.thresholdBasis === "month" ? "Rent payment" : "This payment"} prefix="₹" value={f.amount} onChange={(v) => set("amount", v)} error={err("amount")} size="lg" />
          {R.thresholdBasis === "month" ? (
            <NumberField id="tds-months" label="Months this payment covers" value={f.rentMonths} onChange={(v) => set("rentMonths", v)} error={err("rentMonths")} integer hint="The ₹50,000 limit is per month or part of a month." />
          ) : (
            <NumberField id="tds-sofar" label="Earlier payments to this payee this year" prefix="₹" value={f.paidSoFar} onChange={(v) => set("paidSoFar", v)} error={err("paidSoFar")} hint="Used to check the yearly threshold." />
          )}
          {cat === "interestBank" && <Toggle checked={senior} onChange={setSenior} label="Payee is a senior citizen" description="Higher ₹1,00,000 threshold" />}
          <Toggle checked={pan} onChange={setPan} label="Payee has given a valid PAN" description={`Without it, TDS is generally at least ${TDS_NO_PAN.rate}%`} />
        </Panel>

        <ResultCard eyebrow="TDS to deduct" state={state} error={!parsed.ok ? parsed.message : undefined} empty="Enter the payment amount." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="tds-amount">
                {inr(r.tds)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="tds-status">
                {r.applies ? `${r.rate}% under ${sec(r.section)}${!pan ? ` (no PAN — ${sec(r.noPanSection)})` : ""}` : `No TDS — within the threshold of ${r.thresholdText}`}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Threshold" value={r.thresholdText} />
                <Figure label="Amount TDS is worked on" value={inr(r.base)} testId="tds-base" />
                <Figure label="Net amount to pay now" value={inr(r.net)} strong testId="tds-net" />
              </dl>
              <DarkNotes
                notes={[
                  ...(r.applies && r.base > (parsed.ok ? parsed.v.amount : 0) ? ["This payment takes the year's total over the limit, so TDS covers the earlier untaxed payments too."] : []),
                  ...(cat === "interestBank" || cat === "interestOther" ? ["A payee whose income is below the taxable limit can give Form 15G (or 15H if a senior citizen) to avoid TDS."] : []),
                  ...(cat === "rentIndividual" ? ["Individuals not liable to audit deduct this TDS once — in the last month of the year or tenancy — using a challan-cum-statement, without needing a TAN."] : []),
                  "Lower-deduction certificates, treaty rates and special cases aren't modelled.",
                ]}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["TDS estimate — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "tds-calculator" })} />
                <DarkButton onClick={() => printSummary("TDS estimate", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <RulesPanel
        effective={`${TAX_YEARS[year].period} (${TAX_YEARS[year].act})`}
        rows={[
          ...Object.values(TDS_RULES).map((x) => ({
            label: x.label,
            value: `${x.rate}% · ${x.thresholdBasis === "month" ? `over ₹${x.threshold.toLocaleString("en-IN")}/month` : x.thresholdBasis === "single" ? `single > ₹${x.threshold.toLocaleString("en-IN")} or year > ₹${(x.aggregate ?? 0).toLocaleString("en-IN")}` : `over ₹${x.threshold.toLocaleString("en-IN")}/year${x.seniorThreshold ? ` (₹${x.seniorThreshold.toLocaleString("en-IN")} senior)` : ""}`} · ${x.section[year]}`,
            status: "secondary" as const,
          })),
          { label: "No PAN", value: `Higher of the normal rate and ${TDS_NO_PAN.rate}% · ${TDS_NO_PAN.section[year]}`, status: "verified" },
        ]}
        sources={TDS_SOURCES}
        notes={year === "2026-27" ? ["From 1 April 2026, TDS provisions are consolidated in section 393 of the Income-tax Act, 2025; the table serial numbers are shown with each rate."] : []}
      />

      <Formula>
        <p>TDS = rate × amount, once the threshold is crossed. For yearly thresholds, the payment that takes the year&rsquo;s total over the limit carries TDS on the total so far; later payments carry TDS on their own amount.</p>
        <p>Contract payments: TDS applies to a single payment above ₹30,000, or once the year&rsquo;s total passes ₹1,00,000. Rent: the ₹50,000 limit is per month or part of a month. TDS is rounded to the nearest rupee.</p>
      </Formula>
    </div>
  );
}
