"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Legend, LineChart } from "./charts";
import { DarkNotes, parseForm, type FieldSpec } from "./india-ui";
import { LOAN_DISCLAIMER, axisInr } from "./loan-ui";
import { rentVsBuy, type RentBuyInput } from "@/lib/loans/property";
import { inr, lakhCrore } from "@/lib/loans/format";
import { track } from "@/lib/analytics";

type K = Exclude<keyof RentBuyInput, never>;
const DEFAULT: Record<K, string> = {
  price: "10000000", appreciation: "5", downPayment: "2000000", rate: "8.5", tenureYears: "20", stampRegistration: "700000", otherPurchaseCosts: "100000", maintenanceMonthly: "4000", propertyTaxYearly: "6000", sellingCostPct: "2",
  rent: "28000", rentIncrease: "5", deposit: "84000", tenantMaintenance: "",
  investReturn: "9", inflation: "5", years: "20",
};
const SPECS: Record<K, FieldSpec> = {
  price: { label: "Property price", min: 1, max: 1e11 },
  appreciation: { label: "Property appreciation", min: -10, max: 30 },
  downPayment: { label: "Down payment", min: 0, max: 1e11 },
  rate: { label: "Home loan rate", min: 0, max: 30 },
  tenureYears: { label: "Loan tenure", min: 1, max: 40, integer: true },
  stampRegistration: { label: "Stamp duty and registration", min: 0, max: 1e10, optional: true },
  otherPurchaseCosts: { label: "Other purchase costs", min: 0, max: 1e10, optional: true },
  maintenanceMonthly: { label: "Maintenance", min: 0, max: 1e8, optional: true },
  propertyTaxYearly: { label: "Property tax", min: 0, max: 1e8, optional: true },
  sellingCostPct: { label: "Selling costs", min: 0, max: 20, optional: true },
  rent: { label: "Monthly rent", min: 0, max: 1e9 },
  rentIncrease: { label: "Rent increase", min: 0, max: 30 },
  deposit: { label: "Security deposit", min: 0, max: 1e9, optional: true },
  tenantMaintenance: { label: "Maintenance paid by tenant", min: 0, max: 1e8, optional: true },
  investReturn: { label: "Investment return", min: -10, max: 30 },
  inflation: { label: "Inflation", min: 0, max: 30 },
  years: { label: "Comparison period", min: 1, max: 40, integer: true },
};

export default function RentVsBuyCalculator() {
  const [f, setF] = useState(DEFAULT);
  const [view, setView] = useState<"nominal" | "real">("nominal");
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "rent-vs-buy-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const out = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.downPayment > v.price) return { error: "The down payment can't be more than the price.", field: "downPayment" as K };
    return { v, r: rentVsBuy(v) };
  }, [parsed]);
  const ok = out && !("error" in out) ? out : null;
  const r = ok?.r;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (out && "error" in out) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : out && "error" in out ? out.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : out && "error" in out && out.field === k ? out.error : null);
  const defl = (y: number) => (view === "real" && ok ? Math.pow(1 + ok.v.inflation / 100, y) : 1);
  const ahead = r ? (r.difference >= 0 ? "Buying" : "Renting and investing") : "";

  const summary = (): [string, string][] =>
    r && ok
      ? [
          [`Net worth from buying after ${ok.v.years} years`, inr(r.buyNetWorth)],
          [`Net worth from renting and investing`, inr(r.rentNetWorth)],
          ["Difference", `${ahead} ahead by ${inr(Math.abs(r.difference))}`],
          ["Buying ahead from year", r.favourableFrom === null ? "Not within the period" : String(r.favourableFrom)],
          ["Total rent paid", inr(r.totalRent)],
          ["Total home-loan interest", inr(r.totalInterest)],
          ["Property value at the end", inr(r.propertyValue)],
          ["Loan outstanding at the end", inr(r.loanBalance)],
          ["Purchase transaction costs", inr(r.transactionCosts)],
          ["EMI", inr(r.emi)],
        ]
      : [];

  const sec = (t: string) => <p className="text-sm font-bold">{t}</p>;
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          {sec("Buying")}
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="rb-price" label="Property price" prefix="₹" value={f.price} onChange={(v) => set("price", v)} error={err("price")} />
            <NumberField id="rb-app" label="Appreciation" suffix="% a year" value={f.appreciation} onChange={(v) => set("appreciation", v)} error={err("appreciation")} />
            <NumberField id="rb-dp" label="Down payment" prefix="₹" value={f.downPayment} onChange={(v) => set("downPayment", v)} error={err("downPayment")} hint="The rest is the home loan." />
            <NumberField id="rb-rate" label="Home loan rate" suffix="%" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
            <NumberField id="rb-tenure" label="Loan tenure" suffix="years" value={f.tenureYears} onChange={(v) => set("tenureYears", v)} error={err("tenureYears")} integer />
            <NumberField id="rb-stamp" label="Stamp duty + registration" prefix="₹" value={f.stampRegistration} onChange={(v) => set("stampRegistration", v)} error={err("stampRegistration")} hint={<Link className="underline" href="/stamp-duty-calculator/">Estimate stamp duty</Link>} />
            <NumberField id="rb-other" label="Other purchase costs" prefix="₹" value={f.otherPurchaseCosts} onChange={(v) => set("otherPurchaseCosts", v)} error={err("otherPurchaseCosts")} hint="Brokerage, legal, interiors." />
            <NumberField id="rb-maint" label="Maintenance (owner)" prefix="₹" suffix="/month" value={f.maintenanceMonthly} onChange={(v) => set("maintenanceMonthly", v)} error={err("maintenanceMonthly")} />
            <NumberField id="rb-tax" label="Property tax" prefix="₹" suffix="/year" value={f.propertyTaxYearly} onChange={(v) => set("propertyTaxYearly", v)} error={err("propertyTaxYearly")} />
            <NumberField id="rb-sell" label="Selling costs at the end" suffix="% of value" value={f.sellingCostPct} onChange={(v) => set("sellingCostPct", v)} error={err("sellingCostPct")} hint="Brokerage etc., to compare like for like." />
          </div>
          <div className="border-t border-line pt-5">{sec("Renting")}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="rb-rent" label="Monthly rent now" prefix="₹" value={f.rent} onChange={(v) => set("rent", v)} error={err("rent")} />
            <NumberField id="rb-rinc" label="Rent increase" suffix="% a year" value={f.rentIncrease} onChange={(v) => set("rentIncrease", v)} error={err("rentIncrease")} />
            <NumberField id="rb-dep" label="Security deposit" prefix="₹" value={f.deposit} onChange={(v) => set("deposit", v)} error={err("deposit")} hint="Returned at the end; earns nothing meanwhile." />
            <NumberField id="rb-tm" label="Maintenance paid by you as tenant" prefix="₹" suffix="/month" value={f.tenantMaintenance} onChange={(v) => set("tenantMaintenance", v)} error={err("tenantMaintenance")} />
          </div>
          <div className="border-t border-line pt-5">{sec("Assumptions")}</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField id="rb-ret" label="Investment return" suffix="%" value={f.investReturn} onChange={(v) => set("investReturn", v)} error={err("investReturn")} hint="On money not tied up in the home." />
            <NumberField id="rb-infl" label="Inflation" suffix="%" value={f.inflation} onChange={(v) => set("inflation", v)} error={err("inflation")} hint="Raises maintenance and tax." />
            <NumberField id="rb-years" label="Compare over" suffix="years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} integer />
          </div>
        </Panel>

        <ResultCard eyebrow={ok ? `After ${ok.v.years} years` : "Rent vs buy"} state={state} error={errorMsg} empty="Enter the property, rent and assumptions." onReset={() => setF(DEFAULT)} footer={`${LOAN_DISCLAIMER} Returns, appreciation and rents are assumptions, not forecasts.`}>
          {r && ok && (
            <>
              <p className="mt-3 text-[clamp(1.5rem,1.1rem+1.6vw,2.1rem)] font-medium leading-tight" data-testid="rb-verdict">
                {ahead} ahead by <span className="font-mono">{lakhCrore(Math.abs(r.difference))}</span>
              </p>
              <p className="mt-2 text-sm text-ivory/65">on these assumptions — {r.favourableFrom === null ? "buying doesn't pull ahead within the period" : `buying stays ahead from year ${r.favourableFrom}`}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-ivory/15 p-3">
                  <p className="text-xs text-ivory/60">Buy — net worth</p>
                  <p className="mt-1 break-all font-mono text-xl" data-testid="rb-buy">{inr(r.buyNetWorth)}</p>
                </div>
                <div className="rounded-[12px] border border-ivory/15 p-3">
                  <p className="text-xs text-ivory/60">Rent + invest — net worth</p>
                  <p className="mt-1 break-all font-mono text-xl" data-testid="rb-rent">{inr(r.rentNetWorth)}</p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="EMI" value={inr(r.emi)} testId="rb-emi" />
                <Figure label="Total rent paid" value={inr(r.totalRent)} testId="rb-total-rent" />
                <Figure label="Total home-loan interest" value={inr(r.totalInterest)} testId="rb-interest" />
                <Figure label="Property value at the end" value={inr(r.propertyValue)} />
                <Figure label="Loan outstanding at the end" value={inr(r.loanBalance)} />
                <Figure label="Purchase transaction costs" value={inr(r.transactionCosts)} />
                <Figure label="In today's money (buy / rent)" value={`${lakhCrore(r.realBuy)} / ${lakhCrore(r.realRent)}`} />
              </dl>
              <DarkNotes notes={["Money matters, but so do stability, location, flexibility to move and how easily you could sell. This comparison covers only the money."]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Rent vs buy — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "rent-vs-buy-calculator" })} />
                <DarkButton onClick={() => printSummary("Rent vs buy", summary(), [LOAN_DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && ok && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Net worth year by year</h2>
            <Segmented label="Money view" size="sm" className="w-64" value={view} onChange={setView} options={[{ value: "nominal", label: "Future ₹" }, { value: "real", label: "Today's ₹" }]} />
          </div>
          <Legend items={[{ label: "Buy", color: CHART.orange }, { label: "Rent and invest", color: CHART.charcoal }]} />
          <LineChart
            label={`Net worth from buying and from renting and investing over ${ok.v.years} years.`}
            labels={r.years.map((y) => `Y${y.year}`)}
            series={[
              { label: "Buy", color: CHART.orange, values: r.years.map((y) => y.buyNetWorth / defl(y.year)) },
              { label: "Rent and invest", color: CHART.charcoal, values: r.years.map((y) => y.rentNetWorth / defl(y.year)) },
            ]}
            format={axisInr}
          />
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[720px] text-right text-sm" data-testid="rb-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Property value</th>
                  <th scope="col" className="py-2 font-medium">Loan left</th>
                  <th scope="col" className="py-2 font-medium">Buyer&rsquo;s investments</th>
                  <th scope="col" className="py-2 font-medium">Buy net worth</th>
                  <th scope="col" className="py-2 font-medium">Rent paid</th>
                  <th scope="col" className="py-2 font-medium">Rent net worth</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{y.year}</td>
                    <td className="py-1.5">{inr(y.propertyValue / defl(y.year))}</td>
                    <td className="py-1.5">{inr(y.loanBalance / defl(y.year))}</td>
                    <td className="py-1.5">{inr(y.buyPortfolio / defl(y.year))}</td>
                    <td className="py-1.5">{inr(y.buyNetWorth / defl(y.year))}</td>
                    <td className="py-1.5">{inr(y.rentPaidYear / defl(y.year))}</td>
                    <td className="py-1.5">{inr(y.rentNetWorth / defl(y.year))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          <strong>Same cash, two paths.</strong> At the start the buyer pays the down payment, stamp duty, registration and other costs; the renter pays a security deposit and invests the rest of that money. Every month, whichever side spends less (EMI + maintenance + property tax, or rent + tenant maintenance) invests the difference. Both invest at the same return, compounded monthly. Nothing is counted twice.
        </p>
        <p>
          Net worth: buying = property value (appreciating yearly) − selling costs − loan outstanding + the buyer&rsquo;s investments; renting = the renter&rsquo;s investments + the deposit returned. Rent rises once a year; maintenance and property tax rise with inflation. &ldquo;Today&rsquo;s ₹&rdquo; divides by inflation. Tax effects (home-loan deductions, capital gains, tax on investment returns) aren&rsquo;t included.
        </p>
      </Formula>
    </div>
  );
}
