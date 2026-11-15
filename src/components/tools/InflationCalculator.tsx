"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Legend, LineChart, compactMoney } from "./charts";
import { inflation, inflationCsv, inflationFromForm, type InflationForm, type InflationMode } from "@/lib/inflation";
import { parseNum } from "@/lib/discount";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: InflationForm = { mode: "future", amount: "100000", rate: "6", years: "10", fromYear: "2016", toYear: "2026" };
const pct = (n: number) => `${n.toFixed(2)}%`;

export default function InflationCalculator() {
  const [f, setF] = useState<InflationForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [scen, setScen] = useState({ low: "4", high: "8" });
  const set = <K extends keyof InflationForm>(k: K, v: InflationForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "inflation-calculator" });
  }, []);

  const out = useMemo(() => inflationFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const span = r ? (r.fromYear !== null ? `from ${r.fromYear} to ${r.fromYear + r.years}` : `over ${+r.years.toFixed(2)} ${r.years === 1 ? "year" : "years"}`) : "";

  const scenarios = useMemo(() => {
    if (!r) return null;
    return [
      { label: "Low", rate: parseNum(scen.low) },
      { label: "Your rate", rate: r.rate },
      { label: "High", rate: parseNum(scen.high) },
    ].map((s) => ({ ...s, res: s.rate === null || Number.isNaN(s.rate) || s.rate < -10 || s.rate > 100 ? null : inflation(r.mode, r.amount, s.rate, r.years, r.fromYear) }));
  }, [r, scen]);

  const headline = r ? (f.mode === "present" ? fmt(r.presentValue) : fmt(r.futureCost)) : "";
  const rows = (): [string, string][] =>
    r
      ? f.mode === "present"
        ? [
            ["Future amount", fmt(r.amount)],
            ["Inflation assumed", `${r.rate}% a year ${span}`],
            ["Worth in today's money", fmt(r.presentValue)],
            ["Purchasing power lost", pct((1 - r.powerLeft) * 100)],
          ]
        : [
            ["Amount today", fmt(r.amount)],
            ["Inflation assumed", `${r.rate}% a year ${span}`],
            ["Same things will cost", fmt(r.futureCost)],
            ["Increase", `${fmt(r.increase)} (${pct(r.increasePct)})`],
            ["Purchasing power remaining", `${pct(r.powerLeft * 100)} — ${fmt(r.presentValue)} in today's money`],
          ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div>
            <p className="mb-1.5 text-sm font-medium">What do you want to know?</p>
            <Segmented
              label="Calculation"
              value={f.mode}
              onChange={(v) => set("mode", v as InflationMode)}
              options={[
                { value: "future", label: "Future cost" },
                { value: "present", label: "Today's value" },
                { value: "years", label: "Between years" },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="inf-amount" label={f.mode === "present" ? "Amount in the future" : f.mode === "years" ? "Amount in the starting year" : "Amount today"} prefix={sym} value={f.amount} onChange={(v) => set("amount", v)} error={err("amount")} size="lg" />
            <div>
              <label htmlFor="inf-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="inf-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="inf-rate" label="Average inflation" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint="Your assumption. Inflation differs by country, period and what you buy — this isn't official data." />
          {f.mode === "years" ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="inf-from" label="From year" integer value={f.fromYear} onChange={(v) => set("fromYear", v)} error={err("fromYear")} />
              <NumberField id="inf-to" label="To year" integer value={f.toYear} onChange={(v) => set("toYear", v)} error={err("toYear")} />
            </div>
          ) : (
            <NumberField id="inf-years" label="Years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} hint="Fractions are fine, e.g. 2.5" />
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-line pt-5">
            <NumberField id="inf-low" label="Low scenario" suffix="%" value={scen.low} onChange={(v) => setScen((s) => ({ ...s, low: v }))} />
            <NumberField id="inf-high" label="High scenario" suffix="%" value={scen.high} onChange={(v) => setScen((s) => ({ ...s, high: v }))} />
          </div>
        </Panel>

        <ResultCard eyebrow={f.mode === "present" ? "Worth in today's money" : "The same things will cost"} state={out.status} error={out.status === "error" ? out.message : undefined} empty="Enter an amount, inflation rate and period." onReset={() => setF(DEFAULT)} footer="Uses the single average rate you enter. Real inflation varies year to year and by category (school fees, healthcare and food often differ from the headline rate). Not financial advice.">
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-none tracking-tight" data-testid="inf-main">
                {headline}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {f.mode === "present" ? `${fmt(r.amount)} ${span} at ${r.rate}% inflation, in today's prices` : `${fmt(r.amount)} of things ${span} at ${r.rate}% a year`}
              </p>
              <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10">
                {f.mode === "present" ? (
                  <>
                    <Figure label="Future amount" value={fmt(r.amount)} />
                    <Figure label="Value today" value={fmt(r.presentValue)} testId="inf-pv" />
                    <Figure label="Purchasing power lost" value={pct((1 - r.powerLeft) * 100)} testId="inf-lost" />
                  </>
                ) : (
                  <>
                    <Figure label="Original amount" value={fmt(r.amount)} />
                    <Figure label="Future equivalent cost" value={fmt(r.futureCost)} />
                    <Figure label="Total increase in cost" value={fmt(r.increase)} testId="inf-increase" />
                    <Figure label="Percentage increase" value={pct(r.increasePct)} testId="inf-pct" />
                    <Figure label="Purchasing power remaining" value={pct(r.powerLeft * 100)} testId="inf-power" />
                    <Figure label={`${fmt(r.amount)} kept as cash is worth`} value={fmt(r.presentValue)} strong />
                  </>
                )}
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Inflation — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "inflation-calculator" })} />
                <DarkButton onClick={() => printSummary("Inflation calculation", rows(), ["Based on an assumed average inflation rate, not official data."])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && scenarios && r.rows.length > 1 && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">What {fmt(f.mode === "present" ? r.presentValue : r.amount)} buys over time</h2>
            <Legend items={[{ label: `Low ${scenarios[0].rate ?? "—"}%`, color: CHART.muted, dashed: true }, { label: `${r.rate}%`, color: CHART.orange }, { label: `High ${scenarios[2].rate ?? "—"}%`, color: CHART.charcoal, dashed: true }]} />
          </div>
          <LineChart
            label={`Value of the same money in starting-year terms falls to ${fmt(r.rows.at(-1)!.value)} at ${r.rate}% inflation.`}
            labels={r.rows.map((x) => x.label)}
            format={axis}
            series={scenarios
              .filter((s) => s.res)
              .map((s, i) => ({ label: s.label, color: i === 1 ? CHART.orange : i === 0 ? CHART.muted : CHART.charcoal, dashed: i !== 1, values: s.res!.rows.map((x) => (f.mode === "present" ? x.cost : x.value)) }))}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-right text-sm" data-testid="inf-scenarios">
              <thead className="text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Scenario (assumption)</th>
                  <th scope="col" className="py-2 font-medium">{f.mode === "present" ? "Value today" : "Future cost"}</th>
                  <th scope="col" className="py-2 font-medium">Purchasing power left</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.label} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2 text-left font-normal">
                      {s.label} · <span className="font-mono">{s.rate ?? "—"}%</span>
                    </th>
                    <td className="py-2 font-mono">{s.res ? fmt(f.mode === "present" ? s.res.presentValue : s.res.futureCost) : "—"}</td>
                    <td className="py-2 font-mono">{s.res ? pct(s.res.powerLeft * 100) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise table at {r.rate}%</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([inflationCsv(r)], { type: "text/csv;charset=utf-8" }), "inflation-table.csv");
                track("download_clicked", { tool: "inflation-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[380px] overflow-auto">
            <table className="w-full min-w-[420px] text-right text-sm" data-testid="inf-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Cost of the same things</th>
                  <th scope="col" className="py-2 font-medium">{fmt(r.amount)} is worth (start-year money)</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.rows.map((x) => (
                  <tr key={x.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left font-sans">{x.label}</td>
                    <td className="py-2">{fmt(x.cost)}</td>
                    <td className="py-2">{fmt(x.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          Future cost = <code>amount × (1 + inflation)^years</code>. Value today of a future amount = <code>future amount ÷ (1 + inflation)^years</code>. Purchasing power remaining = <code>1 ÷ (1 + inflation)^years</code>.
        </p>
        <p>
          A real (inflation-adjusted) return is roughly the nominal return minus inflation; exactly, it&rsquo;s <code>(1 + return) ÷ (1 + inflation) − 1</code>. An FD paying 7% when inflation is 6% grows your buying power by only about 0.94% a year.
        </p>
        <p>The Between-years mode uses the average rate you enter for every year; it doesn&rsquo;t look up historical inflation data.</p>
      </Formula>
    </div>
  );
}
