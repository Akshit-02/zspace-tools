"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Info, Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { Chips, DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, compactMoney } from "./charts";
import { FD_FREQUENCIES, fdCsv, fdFromForm, type FdForm, type FdFrequency } from "@/lib/fd";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: FdForm = { principal: "100000", rate: "7", tenure: "5", unit: "years", compounding: 4, type: "cumulative", payout: 4, senior: false, seniorExtra: "0.5", tds: false, tdsRate: "10" };
const per = (f: number) => FD_FREQUENCIES.find((x) => x.value === f)!.per;
const freqLabel = (f: number) => FD_FREQUENCIES.find((x) => x.value === f)!.label.toLowerCase();

export default function FdCalculator() {
  const [f, setF] = useState<FdForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const set = <K extends keyof FdForm>(k: K, v: FdForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "fd-calculator" });
  }, []);

  const out = useMemo(() => fdFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const cumulative = f.type === "cumulative";
  const tenureText = r ? `${+r.input.years.toFixed(4)} ${r.input.years === 1 ? "year" : "years"}` : "";

  const rows = (): [string, string][] =>
    r
      ? [
          ["Deposit", fmt(r.principal)],
          ["Interest rate", `${r.input.rate}% a year${f.senior ? ` (incl. ${f.seniorExtra}% senior-citizen extra)` : ""}`],
          ["Tenure", tenureText],
          ...(cumulative
            ? ([
                ["Compounding", freqLabel(r.input.compounding)],
                ["Interest earned", fmt(r.interest)],
                ["Maturity amount", fmt(r.maturity)],
                ["Effective annual yield", `${(r.effectiveAnnual * 100).toFixed(3)}%`],
              ] as [string, string][])
            : ([
                ["Interest paid", `${fmt(r.payoutAmount)} every ${per(r.input.payout)} × ${r.payouts}${r.brokenInterest ? ` + ${fmt(r.brokenInterest)} for the last part-period` : ""}`],
                ["Total interest", fmt(r.interest)],
                ["Principal returned at maturity", fmt(r.principal)],
                ["Total received", fmt(r.totalReceived)],
              ] as [string, string][])),
          ...(r.tax !== null ? ([["Estimated tax on interest (your rate)", fmt(r.tax)], ["Interest after estimated tax", fmt(r.interest - r.tax)]] as [string, string][]) : []),
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="fd-principal" label="Deposit amount" prefix={sym} value={f.principal} onChange={(v) => set("principal", v)} error={err("principal")} size="lg" />
            <div>
              <label htmlFor="fd-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="fd-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="fd-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint="The rate your bank quotes for this tenure." />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="fd-tenure" label="Tenure" value={f.tenure} onChange={(v) => set("tenure", v)} error={err("tenure")} />
            <Segmented label="Tenure unit" className="mb-px h-11 w-52" size="sm" value={f.unit} onChange={(v) => set("unit", v)} options={[{ value: "days", label: "Days" }, { value: "months", label: "Months" }, { value: "years", label: "Years" }]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Interest</p>
            <Segmented
              label="Deposit type"
              value={f.type}
              onChange={(v) => set("type", v)}
              options={[
                { value: "cumulative", label: "Reinvested", hint: "cumulative" },
                { value: "payout", label: "Paid out", hint: "non-cumulative" },
              ]}
            />
          </div>
          {cumulative ? (
            <div>
              <p className="mb-1.5 text-sm font-medium">Compounding</p>
              <Chips label="Compounding frequency" value={f.compounding} onChange={(v) => set("compounding", v as FdFrequency)} options={FD_FREQUENCIES} />
              <p className="mt-1.5 text-xs text-ink-2">Most Indian banks compound FDs quarterly.</p>
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-sm font-medium">Interest paid</p>
              <Chips label="Payout frequency" value={f.payout} onChange={(v) => set("payout", v as FdFrequency)} options={FD_FREQUENCIES} />
            </div>
          )}
          <div className="grid gap-2 border-t border-line pt-5">
            <Toggle checked={f.senior} onChange={(v) => set("senior", v)} label="Senior citizen rate" description="Many banks add about 0.25–0.50% for those 60+" />
            {f.senior && <NumberField id="fd-senior" label="Extra rate for senior citizens" suffix="%" value={f.seniorExtra} onChange={(v) => set("seniorExtra", v)} error={err("seniorExtra")} className="max-w-[240px]" />}
            <Toggle checked={f.tds} onChange={(v) => set("tds", v)} label="Estimate tax on interest" description="Optional · uses the rate you enter" />
            {f.tds && (
              <NumberField
                id="fd-tds"
                label="Tax rate to apply to the interest"
                suffix="%"
                value={f.tdsRate}
                onChange={(v) => set("tdsRate", v)}
                error={err("tdsRate")}
                className="max-w-[300px]"
                hint="A rough estimate on the whole interest. Actual TDS depends on yearly thresholds, Form 15G/15H, your PAN and tax slab."
              />
            )}
          </div>
        </Panel>

        <ResultCard
          eyebrow={cumulative ? "Maturity amount" : "Interest payout"}
          state={out.status}
          error={out.status === "error" ? out.message : undefined}
          empty="Enter the deposit amount, interest rate and tenure."
          onReset={() => setF(DEFAULT)}
          footer="An estimate. Banks differ in day-count rules, compounding, broken-period interest and premature-withdrawal penalties, and rates depend on tenure. Not financial advice."
        >
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="fd-main">
                {cumulative ? fmt(r.maturity) : fmt(r.payoutAmount)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {cumulative ? `${r.input.rate}% compounded ${freqLabel(r.input.compounding)} for ${tenureText}` : `every ${per(r.input.payout)} for ${tenureText} at ${r.input.rate}% (${r.payouts} payouts)`}
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Deposit ${fmt(r.principal)}, interest ${fmt(r.interest)}`} parts={[{ value: r.principal, color: "rgba(250,247,242,0.9)" }, { value: r.interest, color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Deposit" value={fmt(r.principal)} />
                  <Figure label={cumulative ? "Interest earned" : "Total interest"} value={fmt(r.interest)} testId="fd-interest" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                {cumulative ? (
                  <>
                    <Figure label="Effective annual yield" value={`${(r.effectiveAnnual * 100).toFixed(3)}%`} testId="fd-yield" />
                    <Figure label="Maturity amount" value={fmt(r.maturity)} strong />
                  </>
                ) : (
                  <>
                    {r.brokenInterest > 0 && <Figure label="Last part-period interest" value={fmt(r.brokenInterest)} />}
                    <Figure label="Principal returned" value={fmt(r.principal)} />
                    <Figure label="Total received" value={fmt(r.totalReceived)} strong testId="fd-total" />
                  </>
                )}
                {r.tax !== null && (
                  <>
                    <Figure label="Estimated tax (your rate)" value={fmt(r.tax)} testId="fd-tax" />
                    <Figure label="Interest after estimated tax" value={fmt(r.interest - r.tax)} />
                  </>
                )}
              </dl>
              {out.status === "ok" && out.notes.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-ivory/75">
                  {out.notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> {n}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Fixed deposit estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "fd-calculator" })} />
                <DarkButton onClick={() => printSummary("Fixed deposit estimate", rows(), ["Estimate only — bank conventions, rates and taxes differ."])}>
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
            <h2 className="font-display text-xl font-semibold">{cumulative ? "Balance year by year" : "Interest paid each year"}</h2>
            <Legend items={cumulative ? [{ label: "Deposit", color: CHART.charcoal }, { label: "Interest earned", color: CHART.orange }] : [{ label: "Interest paid", color: CHART.orange }]} />
          </div>
          <BarChart
            label={cumulative ? `Deposit and accumulated interest at each year end; maturity ${fmt(r.maturity)}.` : `Interest paid out in each year; total ${fmt(r.interest)}.`}
            labels={r.years.map((y) => `Y${y.year}`)}
            series={cumulative ? [{ label: "Deposit", color: CHART.charcoal, values: r.years.map(() => r.principal) }, { label: "Interest", color: CHART.orange, values: r.years.map((y) => y.balance - r.principal) }] : [{ label: "Interest paid", color: CHART.orange, values: r.years.map((y) => y.interest) }]}
            stacked
            format={axis}
          />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise table</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([fdCsv(r, currency)], { type: "text/csv;charset=utf-8" }), "fd-schedule.csv");
                track("download_clicked", { tool: "fd-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[420px] text-right text-sm" data-testid="fd-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">{cumulative ? "Interest this year" : "Interest paid"}</th>
                  <th scope="col" className="py-2 font-medium">{cumulative ? "Balance at year end" : "Principal held"}</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {y.year}
                      {y.to !== y.year && <span className="text-ink-3"> (part)</span>}
                    </td>
                    <td className="py-2">{fmt(y.interest)}</td>
                    <td className="py-2">{fmt(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          Reinvested (cumulative): <code>A = P × (1 + r/m)^(m × t)</code> — <code>P</code> the deposit, <code>r</code> the annual rate, <code>m</code> compounding periods a year (quarterly = 4), <code>t</code> years. Interest = <code>A − P</code>.
        </p>
        <p>
          Paid out (non-cumulative): interest isn&rsquo;t reinvested, so each payout is <code>P × r ÷ f</code> for payout frequency <code>f</code> (monthly = 12). A final part-period is paid pro rata as simple interest. Some banks pay monthly payouts at a slightly discounted amount.
        </p>
        <p>Effective annual yield = <code>(1 + r/m)^m − 1</code>. Days are converted with a 365-day year. Tax is only estimated if you turn it on, using the rate you enter.</p>
      </Formula>
    </div>
  );
}
