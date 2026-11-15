"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Donut } from "./charts";
import { DarkNotes, Rows, parseForm, pct, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER, ScheduleSection } from "./loan-ui";
import { amortise } from "@/lib/loans/amortise";
import { loanCost } from "@/lib/loans/borrowing";
import { inr } from "@/lib/loans/format";
import { validateLoan } from "@/lib/emi";
import { track } from "@/lib/analytics";

type K = "exShowroom" | "registration" | "insurance" | "accessories" | "otherCosts" | "downPayment" | "loan" | "rate" | "tenure" | "feePct" | "feeFixed" | "gstPct" | "otherCharges";
const DEFAULT: Record<K, string> = { exShowroom: "900000", registration: "90000", insurance: "45000", accessories: "20000", otherCosts: "", downPayment: "250000", loan: "800000", rate: "9", tenure: "5", feePct: "", feeFixed: "5000", gstPct: "18", otherCharges: "" };
const SPECS: Record<K, FieldSpec> = {
  exShowroom: { label: "Ex-showroom price", min: 0, max: 1e10 },
  registration: { label: "Registration and road tax", min: 0, max: 1e9, optional: true },
  insurance: { label: "Insurance", min: 0, max: 1e9, optional: true },
  accessories: { label: "Accessories", min: 0, max: 1e9, optional: true },
  otherCosts: { label: "Other costs", min: 0, max: 1e9, optional: true },
  downPayment: { label: "Down payment", min: 0, max: 1e10, optional: true },
  loan: { label: "Loan amount", min: 0, max: 1e10 },
  rate: { label: "Interest rate", min: 0, max: 40 },
  tenure: { label: "Tenure", min: 1, max: 600 },
  feePct: { label: "Processing fee %", min: 0, max: 10, optional: true },
  feeFixed: { label: "Processing fee", min: 0, max: 1e8, optional: true },
  gstPct: { label: "GST on fee", min: 0, max: 28, optional: true },
  otherCharges: { label: "Other loan charges", min: 0, max: 1e8, optional: true },
};
const pick = (keys: K[]) => Object.fromEntries(keys.map((k) => [k, SPECS[k]])) as Record<K, FieldSpec>;
const LOAN_KEYS: K[] = ["rate", "tenure", "feePct", "feeFixed", "gstPct", "otherCharges"];

export default function CarLoanCalculator() {
  const [mode, setMode] = useState<"price" | "direct">("price");
  const [vehicle, setVehicle] = useState<"new" | "used">("new");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "car-loan-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, pick(mode === "price" ? ["exShowroom", "registration", "insurance", "accessories", "otherCosts", "downPayment", ...LOAN_KEYS] : ["loan", "downPayment", ...LOAN_KEYS])), [f, mode]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const onRoad = mode === "price" ? v.exShowroom + v.registration + v.insurance + v.accessories + v.otherCosts : v.loan + v.downPayment;
    const principal = mode === "price" ? onRoad - v.downPayment : v.loan;
    if (mode === "price" && v.downPayment > onRoad) return { error: "The down payment is more than the on-road price.", field: "downPayment" as K };
    const months = unit === "years" ? Math.round(v.tenure * 12) : v.tenure;
    const bad = validateLoan(principal, v.rate, months);
    if (bad) return { error: bad };
    const cost = loanCost({ principal, rate: v.rate, months, feePct: v.feePct, feeFixed: v.feeFixed, gstPct: v.gstPct, otherCharges: v.otherCharges, deducted: false });
    const sched = amortise({ principal, annualRate: v.rate, months });
    return { onRoad, principal, months, cost, sched, down: v.downPayment, upfrontCash: v.downPayment + cost.upfront, totalCost: onRoad + sched.totalInterest + cost.upfront };
  }, [parsed, mode, unit]);
  const r = out && !("error" in out) ? out : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : out && "error" in out && "field" in out && out.field === k ? out.error : null);

  const rows = (): [string, string, boolean?][] =>
    r
      ? [
          ...(mode === "price" ? ([["On-road price", inr(r.onRoad)]] as [string, string][]) : []),
          ["Down payment", inr(r.down)],
          ["Loan amount", inr(r.principal), true],
          ["Monthly EMI", inr(r.sched.emi), true],
          ["Total interest", inr(r.sched.totalInterest)],
          ["Total EMIs paid", inr(r.sched.totalEmiPaid)],
          ["Processing fee + GST", inr(r.cost.fee + r.cost.gst)],
          ...(r.cost.upfront - r.cost.fee - r.cost.gst > 0 ? ([["Other loan charges", inr(r.cost.upfront - r.cost.fee - r.cost.gst)]] as [string, string][]) : []),
          ["Total borrowing cost (interest + charges)", inr(r.sched.totalInterest + r.cost.upfront)],
          ["Cash needed at purchase", inr(r.upfrontCash), true],
          ["Total cost of the car", inr(r.totalCost), true],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-medium">Vehicle</p>
              <Segmented label="Vehicle type" value={vehicle} onChange={setVehicle} options={[{ value: "new", label: "New" }, { value: "used", label: "Used" }]} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Loan amount</p>
              <Segmented label="Loan amount input" value={mode} onChange={setMode} options={[{ value: "price", label: "From price" }, { value: "direct", label: "Enter directly" }]} />
            </div>
          </div>
          {mode === "price" ? (
            <>
              <NumberField id="car-ex" label={vehicle === "new" ? "Ex-showroom price" : "Purchase price"} prefix="₹" value={f.exShowroom} onChange={(v) => set("exShowroom", v)} error={err("exShowroom")} size="lg" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField id="car-reg" label={vehicle === "new" ? "Registration and road tax" : "RC transfer charges"} prefix="₹" value={f.registration} onChange={(v) => set("registration", v)} error={err("registration")} hint="From the dealer's quote; varies by state." />
                <NumberField id="car-ins" label="Insurance" prefix="₹" value={f.insurance} onChange={(v) => set("insurance", v)} error={err("insurance")} />
                <NumberField id="car-acc" label="Accessories" prefix="₹" value={f.accessories} onChange={(v) => set("accessories", v)} error={err("accessories")} />
                <NumberField id="car-oth" label="Other upfront costs" prefix="₹" value={f.otherCosts} onChange={(v) => set("otherCosts", v)} error={err("otherCosts")} hint="Extended warranty, FASTag, handling." />
              </div>
              <NumberField id="car-dp" label="Down payment" prefix="₹" value={f.downPayment} onChange={(v) => set("downPayment", v)} error={err("downPayment")} hint="Lenders finance different shares of the price — often less for used cars." />
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="car-loan" label="Loan amount" prefix="₹" value={f.loan} onChange={(v) => set("loan", v)} error={err("loan")} size="lg" />
              <NumberField id="car-dp2" label="Down payment (optional)" prefix="₹" value={f.downPayment} onChange={(v) => set("downPayment", v)} error={err("downPayment")} />
            </div>
          )}
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="car-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint="Reducing-balance rate from your lender's offer." />
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <NumberField id="car-tenure" label="Tenure" value={f.tenure} onChange={(v) => set("tenure", v)} error={err("tenure")} />
              <Segmented label="Tenure unit" className="mb-px h-11 w-36" size="sm" value={unit} onChange={setUnit} options={[{ value: "years", label: "Yrs" }, { value: "months", label: "Mths" }]} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField id="car-fee" label="Processing fee" prefix="₹" value={f.feeFixed} onChange={(v) => set("feeFixed", v)} error={err("feeFixed")} />
            <NumberField id="car-feepct" label="or % of loan" suffix="%" value={f.feePct} onChange={(v) => set("feePct", v)} error={err("feePct")} />
            <NumberField id="car-gst" label="GST on fee" suffix="%" value={f.gstPct} onChange={(v) => set("gstPct", v)} error={err("gstPct")} />
          </div>
          <NumberField id="car-charges" label="Other loan charges (documentation, stamp duty on agreement…)" prefix="₹" value={f.otherCharges} onChange={(v) => set("otherCharges", v)} error={err("otherCharges")} />
        </Panel>

        <ResultCard eyebrow="Car loan EMI" state={state} error={errorMsg} empty="Enter the price, down payment, rate and tenure." onReset={() => setF(DEFAULT)} footer={LOAN_DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="car-emi">
                {inr(r.sched.emi)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">a month for {r.months} months on a loan of {inr(r.principal)}</p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Principal ${inr(r.principal)}, interest ${inr(r.sched.totalInterest)}`} parts={[{ value: r.principal, color: "rgba(250,247,242,0.9)" }, { value: r.sched.totalInterest, color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Principal" value={inr(r.principal)} testId="car-loan-amt" />
                  <Figure label="Interest" value={inr(r.sched.totalInterest)} testId="car-interest" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Cash needed at purchase" value={inr(r.upfrontCash)} testId="car-upfront" />
                <Figure label="Total repayment (EMIs)" value={inr(r.sched.totalEmiPaid)} />
                <Figure label="Total cost of the car" value={inr(r.totalCost)} strong testId="car-total" />
                {mode === "price" && <Figure label="Loan as % of on-road price" value={pct((r.principal / r.onRoad) * 100, 1)} />}
              </dl>
              <DarkNotes notes={[...(vehicle === "used" ? ["Used-car loans usually carry higher rates and shorter tenures, and lenders finance a smaller share of the valuation."] : []), "Some lenders quote a flat rate; this calculator uses a reducing-balance rate, which is what the EMI formula needs."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Car loan estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "car-loan-calculator" })} />
                <DarkButton onClick={() => printSummary("Car loan estimate", rows().map(([a, b]) => [a, b]), [LOAN_DISCLAIMER])}>
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
            <h2 className="font-display text-xl font-semibold">Cost breakdown</h2>
            <Rows rows={rows()} testId="car-breakdown" />
          </Panel>
          <ScheduleSection res={r.sched} tool="car-loan-calculator" csvName="car-loan-schedule.csv" />
        </>
      )}

      <Formula>
        <p>On-road price = ex-showroom + registration and road tax + insurance + accessories + other costs. Loan = on-road price − down payment.</p>
        <p>EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), with r = annual rate ÷ 12 and n = months. Cash needed at purchase = down payment + processing fee + GST + other loan charges. Total cost of the car = on-road price + interest + loan charges.</p>
      </Formula>
    </div>
  );
}
