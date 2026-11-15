"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Info } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { Chips, Figure, Formula, NumberField, ResetButton } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, LineChart, compactMoney } from "./charts";
import { COMPOUNDING, compoundCsv, compoundFromForm, type CiForm, type ContributionFrequency, type Frequency } from "@/lib/compound";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: CiForm = { principal: "100000", rate: "8", duration: "10", unit: "years", compounding: 4, contribution: "", contributionFrequency: 12, timing: "end" };
const FREQ_LABEL: Record<number, string> = { 365: "daily", 12: "monthly", 4: "quarterly", 2: "half-yearly", 1: "yearly" };

export default function CompoundInterestCalculator() {
  const [f, setF] = useState<CiForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const set = <K extends keyof CiForm>(k: K, v: CiForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "compound-interest-calculator" });
  }, []);

  const out = useMemo(() => compoundFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];

  const summary = () =>
    r
      ? [
          "Compound interest — ZSpace Tools",
          `Initial amount: ${fmt(r.principal)}`,
          r.input.contribution ? `Contributions: ${fmt(r.input.contribution)} ${FREQ_LABEL[r.input.contributionFrequency]} (${r.input.timing === "begin" ? "start" : "end"} of period) × ${r.deposits} = ${fmt(r.contributions)}` : "Contributions: none",
          `Rate: ${r.input.rate}% a year, compounded ${FREQ_LABEL[r.input.compounding]} (effective ${(r.effectiveAnnual * 100).toFixed(3)}% a year)`,
          `Duration: ${+r.input.years.toFixed(4)} years`,
          `Total invested: ${fmt(r.invested)}`,
          `Interest earned: ${fmt(r.interest)}`,
          `Final value: ${fmt(r.final)}`,
          `With simple interest instead: ${fmt(r.simpleFinal)} (compounding adds ${fmt(r.final - r.simpleFinal)})`,
        ].join("\n")
      : "";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="ci-principal" label="Initial amount" prefix={sym} value={f.principal} onChange={(v) => set("principal", v)} error={err("principal")} size="lg" />
            <div>
              <label htmlFor="ci-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="ci-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="ci-rate" label="Annual interest rate (nominal)" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="ci-duration" label="Duration" value={f.duration} onChange={(v) => set("duration", v)} error={err("duration")} />
            <Segmented label="Duration unit" className="mb-px h-11 w-40" size="sm" value={f.unit} onChange={(v) => set("unit", v)} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Compounding</p>
            <Chips label="Compounding frequency" value={f.compounding} onChange={(v) => set("compounding", v as Frequency)} options={COMPOUNDING} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5">
            <NumberField id="ci-contribution" label="Regular contribution (optional)" prefix={sym} placeholder="0" value={f.contribution} onChange={(v) => set("contribution", v)} error={err("contribution")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-medium">Contribution every</p>
                <Segmented label="Contribution frequency" size="sm" value={String(f.contributionFrequency)} onChange={(v) => set("contributionFrequency", Number(v) as ContributionFrequency)} options={[{ value: "12", label: "Month" }, { value: "4", label: "Quarter" }, { value: "1", label: "Year" }]} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Paid at the</p>
                <Segmented label="Contribution timing" size="sm" value={f.timing} onChange={(v) => set("timing", v)} options={[{ value: "end", label: "End" }, { value: "begin", label: "Start" }]} />
              </div>
            </div>
          </div>
        </Panel>

        <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
            <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Final value
          </p>
          {r ? (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="ci-final">
                {fmt(r.final)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {r.input.rate}% compounded {FREQ_LABEL[r.input.compounding]} for {+r.input.years.toFixed(4)} {r.input.years === 1 ? "year" : "years"}
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Total invested ${fmt(r.invested)}, interest ${fmt(r.interest)}`} parts={[{ value: r.invested, color: "rgba(250,247,242,0.9)" }, { value: Math.max(0, r.interest), color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Total invested" value={fmt(r.invested)} />
                  <Figure label="Interest earned" value={fmt(r.interest)} testId="ci-interest" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Initial amount" value={fmt(r.principal)} />
                <Figure label={`Contributions (${r.deposits})`} value={fmt(r.contributions)} />
                <Figure label="Total growth" value={r.growthPct === null ? "—" : `${r.growthPct.toFixed(2)}%`} testId="ci-growth" />
                <Figure label="Effective annual rate" value={`${(r.effectiveAnnual * 100).toFixed(3)}%`} />
                <Figure label="With simple interest" value={fmt(r.simpleFinal)} testId="ci-simple" />
                <Figure label="Compounding adds" value={fmt(r.final - r.simpleFinal)} strong />
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
                <CopyButton text={summary} label="Copy summary" variant="primary" onCopied={() => track("copy_clicked", { tool: "compound-interest-calculator" })} />
                <ResetButton dark onClick={() => setF(DEFAULT)} />
              </div>
            </>
          ) : out.status === "error" ? (
            <>
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {out.message}
              </p>
              <div className="mt-4">
                <ResetButton dark onClick={() => setF(DEFAULT)} />
              </div>
            </>
          ) : (
            <p className="mt-6 text-ivory/60">Enter an amount, rate and duration.</p>
          )}
        </div>
      </div>

      {r && r.years.length > 0 && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Growth over time</h2>
            <Legend items={[{ label: "Money put in", color: CHART.charcoal }, { label: "Interest", color: CHART.orange }]} />
          </div>
          <BarChart
            label={`Balance at the end of each year split into money put in and interest; final value ${fmt(r.final)}.`}
            labels={r.years.map((y) => `Y${y.year}`)}
            series={(() => {
              let put = r.principal;
              const putIn = r.years.map((y) => (put += y.contributions));
              return [
                { label: "Money put in", color: CHART.charcoal, values: putIn },
                { label: "Interest", color: CHART.orange, values: r.years.map((y, i) => Math.max(0, y.end - putIn[i])) },
              ];
            })()}
            stacked
            format={axis}
          />
          <div className="grid gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Compound vs simple interest</h3>
              <Legend items={[{ label: "Compound", color: CHART.orange }, { label: "Simple", color: CHART.charcoal, dashed: true }]} />
            </div>
            <LineChart
              label={`Compound interest ends at ${fmt(r.final)}, simple interest at ${fmt(r.simpleFinal)}.`}
              labels={["Start", ...r.years.map((y) => `Y${y.year}`)]}
              format={axis}
              series={[
                { label: "Compound", color: CHART.orange, values: [r.principal, ...r.years.map((y) => y.end)] },
                { label: "Simple", color: CHART.charcoal, dashed: true, values: [r.principal, ...r.years.map((y) => y.simpleEnd)] },
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise breakdown</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([compoundCsv(r, currency)], { type: "text/csv;charset=utf-8" }), "compound-interest-schedule.csv");
                track("download_clicked", { tool: "compound-interest-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-right text-sm" data-testid="ci-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Starting balance</th>
                  <th scope="col" className="py-2 font-medium">Contributions</th>
                  <th scope="col" className="py-2 font-medium">Interest</th>
                  <th scope="col" className="py-2 font-medium">Ending balance</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {y.year}
                      {y.to !== y.year && <span className="text-ink-3"> (part)</span>}
                    </td>
                    <td className="py-2">{fmt(y.start)}</td>
                    <td className="py-2">{fmt(y.contributions)}</td>
                    <td className="py-2">{fmt(y.interest)}</td>
                    <td className="py-2">{fmt(y.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          Initial amount: <code>A = P × (1 + r/m)^(m × t)</code>, where <code>r</code> is the annual rate, <code>m</code> the compounding periods per year (daily = 365) and <code>t</code> the time in years — fractional years included. Interest = <code>A − P</code>.
        </p>
        <p>Each regular contribution is grown separately from the date it&rsquo;s paid (start or end of its period) to the end, so contributions are never treated as if they were invested from day one.</p>
        <p>When contributions are more frequent than compounding, the equivalent fractional-period rate is used, as financial calculators do. Some banks pay simple interest between compounding dates instead, which gives slightly less.</p>
        <p>Simple interest for comparison: <code>P × (1 + r × t)</code> plus each contribution × <code>(1 + r × time invested)</code>. No calendar dates are used, so leap years don&rsquo;t change the result. Taxes and fees aren&rsquo;t included.</p>
      </Formula>
    </div>
  );
}
