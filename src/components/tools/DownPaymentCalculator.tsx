"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DarkNotes, Rows, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER } from "./loan-ui";
import { downPayment } from "@/lib/loans/property";
import { maxLoanByLtv } from "@/lib/loans/borrowing";
import { inr } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

type Cat = "home" | "car" | "other";
type K = "price" | "dp" | "ltv" | "stamp" | "registration" | "insurance" | "fee" | "other" | "savings" | "reserve" | "rate" | "years";
const DEFAULT: Record<K, string> = { price: "8000000", dp: "20", ltv: "", stamp: "480000", registration: "30000", insurance: "", fee: "10000", other: "", savings: "2500000", reserve: "300000", rate: "8.5", years: "20" };
const SPECS: Record<K, FieldSpec> = {
  price: { label: "Purchase price", min: 1, max: 1e11 },
  dp: { label: "Down payment", min: 0, max: 1e11 },
  ltv: { label: "Maximum loan", min: 0, max: 100, optional: true },
  stamp: { label: "Stamp duty", min: 0, max: 1e10, optional: true },
  registration: { label: "Registration charges", min: 0, max: 1e10, optional: true },
  insurance: { label: "Insurance", min: 0, max: 1e10, optional: true },
  fee: { label: "Processing fee", min: 0, max: 1e10, optional: true },
  other: { label: "Other upfront charges", min: 0, max: 1e10, optional: true },
  savings: { label: "Available savings", min: 0, max: 1e11, optional: true },
  reserve: { label: "Emergency reserve", min: 0, max: 1e11, optional: true },
  rate: { label: "Interest rate", min: 0, max: 60, optional: true },
  years: { label: "Tenure", min: 0, max: 40, optional: true },
};

export default function DownPaymentCalculator() {
  const [cat, setCat] = useState<Cat>("home");
  const [mode, setMode] = useState<"pct" | "amount">("pct");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "down-payment-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (mode === "pct" && v.dp > 100) return { error: "The down payment can't be more than 100%.", field: "dp" as K };
    if (mode === "amount" && v.dp > v.price) return { error: "The down payment can't be more than the price.", field: "dp" as K };
    if (v.reserve > v.savings && v.savings > 0) return { error: "The emergency reserve is more than your savings.", field: "reserve" as K };
    // Home: the RBI cap applies even if no lender limit is entered.
    const rbiPct = cat === "home" ? (maxLoanByLtv(v.price) / v.price) * 100 : null;
    const userLtv = f.ltv.trim() ? v.ltv : null;
    const maxLtvPct = userLtv !== null && rbiPct !== null ? Math.min(userLtv, rbiPct) : userLtv ?? rbiPct;
    const charges = [
      ...(cat === "home" ? [{ label: "Stamp duty", amount: v.stamp }, { label: "Registration charges", amount: v.registration }] : []),
      { label: cat === "car" ? "Insurance and registration" : "Insurance", amount: v.insurance },
      { label: "Loan processing fee", amount: v.fee },
      { label: "Other upfront charges", amount: v.other },
    ].filter((c) => c.amount > 0);
    return { v, rbiPct, r: downPayment({ price: v.price, mode, value: v.dp, maxLtvPct, charges, savings: v.savings, reserve: v.reserve, rate: v.rate, months: Math.round(v.years * 12) }), charges };
  }, [parsed, mode, cat, f.ltv]);
  const ok = out && !("error" in out) ? out : null;
  const r = ok?.r;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : out && "error" in out && out.field === k ? out.error : null);

  const rows = (): [string, string, boolean?][] =>
    r && ok
      ? [
          ["Purchase price", inr(ok.v.price)],
          [`Down payment (${pct(r.downPct, 1)})`, inr(r.downPayment), true],
          ...ok.charges.map((c) => [c.label, inr(c.amount)] as [string, string]),
          ["Total upfront cash", inr(r.upfront), true],
          [`Loan (${pct(r.ltvPct, 1)} of price)`, inr(r.loan)],
          ...(r.emi ? ([["Estimated EMI", inr(r.emi)]] as [string, string][]) : []),
          ["Savings available (after reserve)", inr(r.available)],
          [r.gap >= 0 ? "Surplus" : "Shortfall", inr(Math.abs(r.gap)), true],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="What are you buying?" value={cat} onChange={setCat} options={[{ value: "home", label: "Home" }, { value: "car", label: "Car" }, { value: "other", label: "Other" }]} />
          <NumberField id="dp-price" label={cat === "home" ? "Property price (agreement value)" : cat === "car" ? "On-road price" : "Purchase price"} prefix="₹" value={f.price} onChange={(v) => set("price", v)} error={err("price")} size="lg" />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="dp-dp" label="Down payment" prefix={mode === "amount" ? "₹" : undefined} suffix={mode === "pct" ? "% of price" : undefined} value={f.dp} onChange={(v) => set("dp", v)} error={err("dp")} />
            <Segmented label="Down payment as" className="mb-px h-11 w-32" size="sm" value={mode} onChange={setMode} options={[{ value: "pct", label: "%" }, { value: "amount", label: "₹" }]} />
          </div>
          <NumberField id="dp-ltv" label="Lender's maximum loan (optional)" suffix="% of price" value={f.ltv} onChange={(v) => set("ltv", v)} error={err("ltv")} hint={cat === "home" ? "Your lender may lend less than the RBI cap, which is applied automatically." : "Lenders finance different shares — check your offer."} />
          {cat === "home" && (
            <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <NumberField id="dp-stamp" label="Stamp duty" prefix="₹" value={f.stamp} onChange={(v) => set("stamp", v)} error={err("stamp")} hint={<Link className="underline" href="/stamp-duty-calculator/">Estimate it</Link>} />
              <NumberField id="dp-reg" label="Registration charges" prefix="₹" value={f.registration} onChange={(v) => set("registration", v)} error={err("registration")} hint={<Link className="underline" href="/property-registration-charges-calculator/">Estimate it</Link>} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField id="dp-ins" label="Insurance" prefix="₹" value={f.insurance} onChange={(v) => set("insurance", v)} error={err("insurance")} />
            <NumberField id="dp-fee" label="Processing fee" prefix="₹" value={f.fee} onChange={(v) => set("fee", v)} error={err("fee")} />
            <NumberField id="dp-oth" label="Other charges" prefix="₹" value={f.other} onChange={(v) => set("other", v)} error={err("other")} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="dp-sav" label="Savings available" prefix="₹" value={f.savings} onChange={(v) => set("savings", v)} error={err("savings")} />
            <NumberField id="dp-res" label="Keep aside as emergency reserve" prefix="₹" value={f.reserve} onChange={(v) => set("reserve", v)} error={err("reserve")} />
            <NumberField id="dp-rate" label="Loan rate (for EMI)" suffix="%" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
            <NumberField id="dp-years" label="Loan tenure" suffix="years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} />
          </div>
        </Panel>

        <ResultCard eyebrow="Total upfront cash" state={state} error={errorMsg} empty="Enter the price and down payment." onReset={() => setF(DEFAULT)} footer={LOAN_DISCLAIMER}>
          {r && ok && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="dp-upfront">
                {inr(r.upfront)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">down payment {inr(r.downPayment)} + charges {inr(r.extra)}</p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Down payment" value={`${inr(r.downPayment)} · ${pct(r.downPct, 1)}`} testId="dp-amount" />
                <Figure label="Loan" value={`${inr(r.loan)} · ${pct(r.ltvPct, 1)}`} testId="dp-loan" />
                <Figure label="Additional charges" value={inr(r.extra)} />
                {r.emi > 0 && <Figure label="Estimated EMI" value={inr(r.emi)} testId="dp-emi" />}
                <Figure label={r.gap >= 0 ? "Savings surplus" : "Savings shortfall"} value={inr(Math.abs(r.gap))} strong testId="dp-gap" />
              </dl>
              <DarkNotes
                notes={[
                  ...(r.raisedByLtv ? [`Down payment raised to ${inr(r.downPayment)}: the loan can't be more than ${pct(100 - (r.minByLtv / ok.v.price) * 100, 1)} of the price${ok.rbiPct !== null ? " under the RBI cap or your lender's limit" : ""}.`] : []),
                  ...(cat === "home" ? ["Stamp duty and registration are usually paid from your own money — lenders generally don't fund them in the loan."] : []),
                ]}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Down payment estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "down-payment-calculator" })} />
                <DarkButton onClick={() => printSummary("Down payment estimate", rows().map(([a, b]) => [a, b]), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Cost breakdown</h2>
          <Rows rows={rows()} testId="dp-breakdown" />
        </Panel>
      )}

      <Formula>
        <p>Down payment = price × % (or the amount you enter), raised if needed so the loan stays within the maximum loan-to-value. Loan = price − down payment.</p>
        <p>Total upfront cash = down payment + stamp duty + registration + insurance + processing fee + other charges. Surplus or shortfall = savings − emergency reserve − total upfront cash. EMI uses the standard reducing-balance formula.</p>
      </Formula>
    </div>
  );
}
