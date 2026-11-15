"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, GitCompare, Info, Printer } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Toggle } from "./ui";
import { Chips, DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, LineChart, compactMoney } from "./charts";
import { lumpsumCsv, lumpsumFromForm, type LsForm, type LsFrequency } from "@/lib/lumpsum";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: LsForm = { amount: "100000", rate: "12", years: "10", compounding: 1, inflation: "" };
const FREQ: { value: LsFrequency; label: string }[] = [
  { value: 1, label: "Yearly" },
  { value: 2, label: "Half-yearly" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
];
const DISCLAIMER = "An illustration at a constant assumed return — not a forecast or a guarantee. Market-linked investments can lose value. Not financial advice.";

export default function LumpsumCalculator() {
  const [f, setF] = useState<LsForm>(DEFAULT);
  const [useInflation, setUseInflation] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [compare, setCompare] = useState(false);
  const [b, setB] = useState({ amount: "100000", rate: "8" });
  const set = <K extends keyof LsForm>(k: K, v: LsForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "lumpsum-calculator" });
  }, []);

  const form = useMemo(() => ({ ...f, inflation: useInflation ? f.inflation || "6" : "" }), [f, useInflation]);
  const out = useMemo(() => lumpsumFromForm(form), [form]);
  const outB = useMemo(() => (compare ? lumpsumFromForm({ ...form, amount: b.amount, rate: b.rate, inflation: "" }, "Scenario B") : null), [compare, form, b]);
  const r = out.status === "ok" ? out.result : null;
  const rb = outB?.status === "ok" ? outB.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 0), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const pct = (n: number) => `${n.toFixed(2)}%`;

  const rows = (): [string, string][] =>
    r
      ? [
          ["Initial investment", fmt(r.amount)],
          ["Assumed return", `${r.input.rate}% a year, compounded ${FREQ.find((x) => x.value === r.input.compounding)!.label.toLowerCase()} (effective ${pct(r.effectiveAnnual * 100)})`],
          ["Duration", `${r.input.years} years`],
          ["Estimated future value", fmt(r.value)],
          ["Estimated gain", fmt(r.gain)],
          ["Total return", pct(r.totalReturnPct)],
          ...(r.real !== null ? ([["Value in today's money", `${fmt(r.real)} (inflation ${r.input.inflation}% a year)`]] as [string, string][]) : []),
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="ls-amount" label="Investment amount (one time)" prefix={sym} value={f.amount} onChange={(v) => set("amount", v)} error={err("amount")} size="lg" />
            <div>
              <label htmlFor="ls-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="ls-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="ls-rate" label="Expected return" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint="An assumption, not a promise — try a cautious and an optimistic rate." />
          <NumberField id="ls-years" label="Investment period" suffix="years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} hint="Fractions are fine, e.g. 7.5" />
          <div>
            <p className="mb-1.5 text-sm font-medium">Compounding</p>
            <Chips label="Compounding frequency" value={f.compounding} onChange={(v) => set("compounding", v as LsFrequency)} options={FREQ} />
            <p className="mt-1.5 text-xs text-ink-2">For mutual funds, returns are usually quoted as a yearly (CAGR) figure — use Yearly.</p>
          </div>
          <div className="grid gap-2 border-t border-line pt-5">
            <Toggle checked={useInflation} onChange={setUseInflation} label="Adjust for inflation" description="Shows the future value in today's money" />
            {useInflation && <NumberField id="ls-inflation" label="Inflation" suffix="% a year" placeholder="6" value={f.inflation} onChange={(v) => set("inflation", v)} error={err("inflation")} className="max-w-[240px]" />}
            <Toggle checked={compare} onChange={setCompare} label="Compare two scenarios" description="Same period and compounding, different amount or return" />
          </div>
        </Panel>

        <ResultCard eyebrow="Estimated future value" state={out.status} error={out.status === "error" ? out.message : undefined} empty="Enter an amount, expected return and period." onReset={() => (setF(DEFAULT), setUseInflation(false), setCompare(false))} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-none tracking-tight" data-testid="ls-value">
                {fmt(r.value)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {fmt(r.amount)} invested once, for {r.input.years} years at {r.input.rate}% a year
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Investment ${fmt(r.amount)}, estimated gain ${fmt(Math.max(0, r.gain))}`} parts={[{ value: Math.min(r.amount, r.value), color: "rgba(250,247,242,0.9)" }, { value: Math.max(0, r.gain), color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Invested" value={fmt(r.amount)} />
                  <Figure label="Estimated gain" value={fmt(r.gain)} testId="ls-gain" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Total return" value={pct(r.totalReturnPct)} testId="ls-total" />
                <Figure label="Annual return assumed (effective)" value={pct(r.effectiveAnnual * 100)} />
                {r.real !== null && (
                  <>
                    <Figure label="Value in today's money" value={fmt(r.real)} strong testId="ls-real" />
                    <Figure label="Real annual growth" value={pct(r.realAnnual! * 100)} />
                  </>
                )}
              </dl>
              {r.real !== null && <p className="mt-3 text-xs text-ivory/60">{fmt(r.value)} is the amount you&rsquo;d see; {fmt(r.real)} is roughly what it would buy at today&rsquo;s prices.</p>}
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
                <CopyButton text={() => ["Lumpsum projection — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`), "", DISCLAIMER].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "lumpsum-calculator" })} />
                <DarkButton onClick={() => printSummary("Lumpsum investment projection", rows(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {compare && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <p className="flex items-center gap-2 font-bold">
            <GitCompare aria-hidden className="size-4" /> Scenario B <span className="font-normal text-ink-2">— same {f.years || "—"} years and compounding as A</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="lsb-amount" label="Investment amount" prefix={sym} value={b.amount} onChange={(v) => setB((x) => ({ ...x, amount: v }))} />
            <NumberField id="lsb-rate" label="Expected return" suffix="% a year" value={b.rate} onChange={(v) => setB((x) => ({ ...x, rate: v }))} />
          </div>
          {outB?.status === "error" && (
            <p className="text-sm text-[#8f2f27]" role="alert">
              {outB.message}
            </p>
          )}
          {r && rb && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm" data-testid="ls-compare">
                <thead>
                  <tr className="border-b border-line text-xs text-ink-2">
                    <th scope="col" className="py-2 font-medium" />
                    <th scope="col" className="py-2 text-right font-medium">Scenario A</th>
                    <th scope="col" className="py-2 text-right font-medium">Scenario B</th>
                    <th scope="col" className="py-2 text-right font-medium">B − A</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {(
                    [
                      ["Invested", r.amount, rb.amount],
                      ["Future value", r.value, rb.value],
                      ["Gain", r.gain, rb.gain],
                    ] as const
                  ).map(([l, x, y]) => (
                    <tr key={l} className="border-b border-line">
                      <th scope="row" className="py-2 font-sans font-medium">{l}</th>
                      <td className="py-2 text-right">{fmt(x)}</td>
                      <td className="py-2 text-right">{fmt(y)}</td>
                      <td className={clsx("py-2 text-right", y - x >= 0 ? "text-success" : "text-error")}>
                        {y - x >= 0 ? "+" : "−"}
                        {fmt(Math.abs(y - x))}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="py-2 font-sans font-medium">Future value difference</th>
                    <td colSpan={3} className="py-2 text-right" data-testid="ls-diff-pct">
                      B is {Math.abs(((rb.value - r.value) / r.value) * 100).toFixed(2)}% {rb.value >= r.value ? "higher" : "lower"} than A
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {r && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Growth year by year</h2>
            <Legend items={[{ label: "Initial investment", color: CHART.charcoal }, { label: "Accumulated gain", color: CHART.orange }]} />
          </div>
          {r.gain >= 0 ? (
            <BarChart
              label={`Initial investment and accumulated gain at each year end; future value ${fmt(r.value)}.`}
              labels={r.years.map((y) => `Y${y.year}`)}
              series={[
                { label: "Investment", color: CHART.charcoal, values: r.years.map(() => r.amount) },
                { label: "Gain", color: CHART.orange, values: r.years.map((y) => Math.max(0, y.gain)) },
              ]}
              stacked
              format={axis}
            />
          ) : (
            <LineChart label={`Value falls to ${fmt(r.value)} at a negative return.`} labels={["Start", ...r.years.map((y) => `Y${y.year}`)]} format={axis} series={[{ label: "Value", color: CHART.orange, values: [r.amount, ...r.years.map((y) => y.value)] }]} />
          )}
          {rb && (
            <div className="grid gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">Scenario A vs B</h3>
                <Legend items={[{ label: "A", color: CHART.orange }, { label: "B", color: CHART.charcoal, dashed: true }]} />
              </div>
              <LineChart
                label={`Scenario A reaches ${fmt(r.value)}, scenario B ${fmt(rb.value)}.`}
                labels={["Start", ...r.years.map((y) => `Y${y.year}`)]}
                format={axis}
                series={[
                  { label: "A", color: CHART.orange, values: [r.amount, ...r.years.map((y) => y.value)] },
                  { label: "B", color: CHART.charcoal, dashed: true, values: [rb.amount, ...rb.years.map((y) => y.value)] },
                ]}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise projection</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([lumpsumCsv(r, currency)], { type: "text/csv;charset=utf-8" }), "lumpsum-projection.csv");
                track("download_clicked", { tool: "lumpsum-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[420px] text-right text-sm" data-testid="ls-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Estimated value</th>
                  <th scope="col" className="py-2 font-medium">Gain</th>
                  {r.real !== null && <th scope="col" className="py-2 font-medium">In today&rsquo;s money</th>}
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {y.year}
                      {y.to !== y.year && <span className="text-ink-3"> (part)</span>}
                    </td>
                    <td className="py-2">{fmt(y.value)}</td>
                    <td className="py-2">{fmt(y.gain)}</td>
                    {y.real !== null && <td className="py-2">{fmt(y.real)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          <code>FV = P × (1 + r/m)^(m × t)</code> — <code>P</code> the amount invested once, <code>r</code> the expected annual return, <code>m</code> compounding periods a year and <code>t</code> years. With yearly compounding this is <code>P × (1 + r)^t</code>.
        </p>
        <p>
          Gain = <code>FV − P</code>; total return = <code>(FV − P) ÷ P × 100</code>. Value in today&rsquo;s money = <code>FV ÷ (1 + inflation)^t</code>.
        </p>
        <p>This is for a single, one-time investment. For a monthly investment, use the SIP calculator. Taxes, fund expenses and exit loads aren&rsquo;t deducted.</p>
      </Formula>
    </div>
  );
}
