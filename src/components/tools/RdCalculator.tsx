"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Info, Printer } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, compactMoney } from "./charts";
import { fdEquivalent, rdCsv, rdFromForm, type RdForm } from "@/lib/rd";
import { parseNum } from "@/lib/discount";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: RdForm = { monthly: "5000", rate: "7", tenure: "5", unit: "years", mode: "quarterly", timing: "begin" };

export default function RdCalculator() {
  const [f, setF] = useState<RdForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [view, setView] = useState<"year" | "month">("year");
  const [compare, setCompare] = useState(false);
  const [fdRate, setFdRate] = useState("7");
  const set = <K extends keyof RdForm>(k: K, v: RdForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "rd-calculator" });
  }, []);

  const out = useMemo(() => rdFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const fdR = parseNum(fdRate);
  const fdOk = fdR !== null && !Number.isNaN(fdR) && fdR >= 0 && fdR <= 30;
  const fdValue = r && compare && fdOk ? fdEquivalent(r.deposited, fdR!, r.instalments) : null;

  const rows = (): [string, string][] =>
    r
      ? [
          ["Monthly deposit", fmt(r.input.monthly)],
          ["Interest rate", `${r.input.rate}% a year, ${r.input.mode === "quarterly" ? "compounded quarterly" : "monthly compounding (approximation)"}`],
          ["Instalments", `${r.instalments} (${r.input.timing === "begin" ? "start" : "end"} of each month)`],
          ["Total deposited", fmt(r.deposited)],
          ["Estimated interest", fmt(r.interest)],
          ["Estimated maturity value", fmt(r.maturity)],
          ...(r.effectiveAnnual !== null ? ([["Effective annual yield on deposits", `${(r.effectiveAnnual * 100).toFixed(2)}%`]] as [string, string][]) : []),
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="rd-monthly" label="Monthly deposit" prefix={c.label.split(" ")[0]} value={f.monthly} onChange={(v) => set("monthly", v)} error={err("monthly")} size="lg" />
            <div>
              <label htmlFor="rd-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="rd-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="rd-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="rd-tenure" label="Tenure" value={f.tenure} onChange={(v) => set("tenure", v)} error={err("tenure")} />
            <Segmented label="Tenure unit" className="mb-px h-11 w-40" size="sm" value={f.unit} onChange={(v) => set("unit", v)} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Compounding</p>
            <Segmented
              label="Compounding convention"
              value={f.mode}
              onChange={(v) => set("mode", v)}
              options={[
                { value: "quarterly", label: "Quarterly", hint: "Indian banks" },
                { value: "monthly", label: "Monthly", hint: "approximation" },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Instalment paid</p>
            <Segmented label="Instalment timing" size="sm" value={f.timing} onChange={(v) => set("timing", v)} options={[{ value: "begin", label: "Start of month" }, { value: "end", label: "End of month" }]} />
          </div>
          <div className="grid gap-2 border-t border-line pt-5">
            <Toggle checked={compare} onChange={setCompare} label="Compare with an FD" description="Same total amount deposited upfront instead" />
            {compare && <NumberField id="rd-fdrate" label="FD interest rate (quarterly compounding)" suffix="% a year" value={fdRate} onChange={setFdRate} error={fdRate && !fdOk ? "Enter an FD rate from 0% to 30%." : null} className="max-w-[300px]" />}
          </div>
        </Panel>

        <ResultCard
          eyebrow="Estimated maturity value"
          state={out.status}
          error={out.status === "error" ? out.message : undefined}
          empty="Enter the monthly deposit, interest rate and tenure."
          onReset={() => (setF(DEFAULT), setCompare(false))}
          footer="An estimate. Banks differ in day counts, when instalments count as paid and how the last part-quarter is handled; late-instalment penalties and taxes aren't included. Not financial advice."
        >
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="rd-maturity">
                {fmt(r.maturity)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {r.instalments} monthly instalments of {fmt(r.input.monthly)} at {r.input.rate}%
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Total deposited ${fmt(r.deposited)}, estimated interest ${fmt(r.interest)}`} parts={[{ value: r.deposited, color: "rgba(250,247,242,0.9)" }, { value: r.interest, color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Total deposited" value={fmt(r.deposited)} testId="rd-deposited" />
                  <Figure label="Estimated interest" value={fmt(r.interest)} testId="rd-interest" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Monthly deposit" value={fmt(r.input.monthly)} />
                <Figure label="Instalments" value={String(r.instalments)} />
                {r.effectiveAnnual !== null && <Figure label="Effective annual yield on deposits" value={`${(r.effectiveAnnual * 100).toFixed(2)}%`} testId="rd-yield" />}
              </dl>
              {fdValue !== null && (
                <div className="mt-4 rounded-[12px] bg-ivory/[0.06] p-4 text-sm" data-testid="rd-compare">
                  <p className="font-medium">Same {fmt(r.deposited)} as an FD at {fdR}%</p>
                  <dl className="mt-2 grid gap-1 font-mono">
                    <div className="flex justify-between gap-3">
                      <dt className="font-sans text-ivory/70">RD maturity</dt>
                      <dd>{fmt(r.maturity)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="font-sans text-ivory/70">FD maturity</dt>
                      <dd>{fmt(fdValue)}</dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs leading-relaxed text-ivory/65">An FD needs the whole {fmt(r.deposited)} on day one and earns interest on all of it for the full tenure; an RD collects it a month at a time, so its money is invested for less time on average. The comparison shows the effect of that timing — it doesn&rsquo;t mean one is better for you.</p>
                </div>
              )}
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
                <CopyButton text={() => ["Recurring deposit estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "rd-calculator" })} />
                <DarkButton onClick={() => printSummary("Recurring deposit estimate", rows(), ["Estimate only — bank conventions and taxes differ."])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Deposits vs interest</h2>
            <Legend items={[{ label: "Total deposited", color: CHART.charcoal }, { label: "Interest earned", color: CHART.orange }]} />
          </div>
          <BarChart
            label={`Total deposited and interest earned at the end of each year; maturity ${fmt(r.maturity)}.`}
            labels={r.years.map((y) => `Y${y.year}`)}
            series={[
              { label: "Deposited", color: CHART.charcoal, values: r.years.map((y) => y.deposited) },
              { label: "Interest", color: CHART.orange, values: r.years.map((y) => y.balance - y.deposited) },
            ]}
            stacked
            format={axis}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <Segmented label="Schedule view" size="sm" className="w-52" value={view} onChange={setView} options={[{ value: "year", label: "Yearly" }, { value: "month", label: "Monthly" }]} />
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([rdCsv(r, currency)], { type: "text/csv;charset=utf-8" }), "rd-schedule.csv");
                track("download_clicked", { tool: "rd-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[480px] text-right text-sm" data-testid="rd-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">{view === "year" ? "Year" : "Month"}</th>
                  <th scope="col" className="py-2 font-medium">Total deposited</th>
                  <th scope="col" className="py-2 font-medium">Interest {view === "year" ? "this year" : "credited"}</th>
                  <th scope="col" className="py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {view === "year"
                  ? r.years.map((y) => (
                      <tr key={y.year} className="border-b border-line last:border-0">
                        <td className="py-2 text-left">
                          {y.year}
                          {y.months < 12 && <span className="text-ink-3"> ({y.months} m)</span>}
                        </td>
                        <td className="py-2">{fmt(y.deposited)}</td>
                        <td className="py-2">{fmt(y.interest)}</td>
                        <td className="py-2">{fmt(y.balance)}</td>
                      </tr>
                    ))
                  : r.months.map((m) => (
                      <tr key={m.month} className={clsx("border-b border-line last:border-0", m.interestCredited > 0 && r.input.mode === "quarterly" && "bg-ivory")}>
                        <td className="py-1.5 text-left">{m.month}</td>
                        <td className="py-1.5">{fmt(m.deposited)}</td>
                        <td className="py-1.5">{m.interestCredited ? fmt(m.interestCredited) : "—"}</td>
                        <td className="py-1.5">{fmt(m.balance)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>Quarterly (default): the calculator goes month by month. Each instalment is added (at the start of the month unless you choose the end), interest for the month accrues at <code>r ÷ 12</code> on the balance, and the accrued interest is credited — and starts earning interest itself — every third month. Interest since the last quarter end is credited at maturity.</p>
        <p>
          Monthly approximation: interest compounds every month at <code>i = r ÷ 12</code>: <code>FV = PMT × ((1 + i)^n − 1) ÷ i</code> for end-of-month deposits, multiplied by <code>(1 + i)</code> for start-of-month deposits; <code>FV = PMT × n</code> at 0%.
        </p>
        <p>Some calculators use a closed formula that compounds each instalment over fractional quarters; it gives a figure within a rupee or two of the quarterly result here. The effective annual yield is the rate at which the deposits, at their actual dates, grow to the maturity value.</p>
      </Formula>
    </div>
  );
}
