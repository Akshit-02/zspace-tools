"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Sparkles } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, LineChart, compactMoney } from "./charts";
import { cagrCsv, cagrFromForm, type CagrForm, type CagrMode } from "@/lib/cagr";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: CagrForm = { mode: "rate", start: "100000", end: "250000", rate: "12", years: "5", months: "" };
const EXAMPLE: CagrForm = { mode: "rate", start: "500000", end: "1150000", rate: "12", years: "6", months: "6" };
const pct = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)}%`;

export default function CagrCalculator() {
  const [f, setF] = useState<CagrForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const set = <K extends keyof CagrForm>(k: K, v: CagrForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "cagr-calculator" });
  }, []);

  const out = useMemo(() => cagrFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const durText = r ? `${+r.years.toFixed(4)} ${r.years === 1 ? "year" : "years"}` : "";
  const main = r ? (f.mode === "rate" ? pct(r.cagr) : f.mode === "end" ? fmt(r.end) : fmt(r.start)) : "";
  const eyebrow = f.mode === "rate" ? "Compound annual growth rate" : f.mode === "end" ? "Ending value" : "Starting value needed";

  const rows = (): [string, string][] =>
    r
      ? [
          ["Starting value", fmt(r.start)],
          ["Ending value", fmt(r.end)],
          ["Duration", durText],
          ["CAGR", pct(r.cagr)],
          [r.gain >= 0 ? "Absolute gain" : "Absolute loss", fmt(r.gain)],
          ["Total growth", pct(r.totalGrowthPct)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div>
            <p className="mb-1.5 text-sm font-medium">Calculate</p>
            <Segmented
              label="What to calculate"
              value={f.mode}
              onChange={(v) => set("mode", v as CagrMode)}
              options={[
                { value: "rate", label: "CAGR" },
                { value: "end", label: "End value" },
                { value: "start", label: "Start value" },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            {f.mode !== "start" ? (
              <NumberField id="cagr-start" label="Starting value" prefix={sym} value={f.start} onChange={(v) => set("start", v)} error={err("start")} size="lg" />
            ) : (
              <NumberField id="cagr-end" label="Ending value (target)" prefix={sym} value={f.end} onChange={(v) => set("end", v)} error={err("end")} size="lg" />
            )}
            <div>
              <label htmlFor="cagr-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="cagr-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {f.mode === "rate" ? (
            <NumberField id="cagr-end" label="Ending value" prefix={sym} value={f.end} onChange={(v) => set("end", v)} error={err("end")} hint="A lower ending value gives a negative CAGR." />
          ) : (
            <NumberField id="cagr-rate" label="CAGR" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} />
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium">Duration</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="cagr-years" label="Years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} hint="Decimals allowed" />
              <NumberField id="cagr-months" label="Months" placeholder="0" value={f.months} onChange={(v) => set("months", v)} error={err("months")} integer />
            </div>
          </div>
          <div>
            <button type="button" onClick={() => setF(EXAMPLE)} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal">
              <Sparkles aria-hidden className="size-4" /> Example: ₹5 lakh → ₹11.5 lakh in 6 y 6 m
            </button>
          </div>
        </Panel>

        <ResultCard eyebrow={eyebrow} state={out.status} error={out.status === "error" ? out.message : undefined} empty="Enter the values and duration." onReset={() => setF(DEFAULT)} footer="CAGR is the steady yearly rate that links two values. Real growth is rarely smooth, and CAGR doesn't account for money added or withdrawn in between. Not financial advice.">
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.3rem,1.6rem+3vw,3.5rem)] leading-none tracking-tight" data-testid="cagr-main">
                {main}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                {fmt(r.start)} → {fmt(r.end)} over {durText}
              </p>
              <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="CAGR" value={pct(r.cagr)} testId="cagr-rate-v" />
                <Figure label="Starting value" value={fmt(r.start)} testId="cagr-start-v" />
                <Figure label="Ending value" value={fmt(r.end)} testId="cagr-end-v" />
                <Figure label="Duration" value={durText} />
                <Figure label={r.gain >= 0 ? "Absolute gain" : "Absolute loss"} value={fmt(r.gain)} testId="cagr-gain" />
                <Figure label="Total growth" value={pct(r.totalGrowthPct)} testId="cagr-total" />
              </dl>
              <p className="mt-3 text-xs text-ivory/60">Total growth is the whole change over {durText}; CAGR spreads it into an equivalent yearly rate. ROI is a different measure — it compares a gain with its cost, without annualising.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["CAGR — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "cagr-calculator" })} />
                <DarkButton onClick={() => printSummary("Compound annual growth rate", rows(), ["CAGR assumes smooth growth and ignores money added or withdrawn in between."])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && r.projection.length > 1 && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Smooth growth path at {pct(r.cagr)}</h2>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([cagrCsv(r)], { type: "text/csv;charset=utf-8" }), "cagr-projection.csv");
                track("download_clicked", { tool: "cagr-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <LineChart label={`Value growing smoothly from ${fmt(r.start)} to ${fmt(r.end)} at ${pct(r.cagr)} a year.`} labels={r.projection.map((p) => (p.year === 0 ? "Start" : `Y${p.year}`))} format={axis} series={[{ label: "Value", color: CHART.orange, values: r.projection.map((p) => p.value) }]} />
          <p className="text-xs text-ink-2">An illustration of the equivalent steady path — the real values may have risen and fallen along the way.</p>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full min-w-[320px] text-right text-sm" data-testid="cagr-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Value at {pct(r.cagr)} a year</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.projection.map((p) => (
                  <tr key={p.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {p.year === 0 ? "Start" : p.year}
                      {p.to !== p.year && <span className="text-ink-3"> ({+p.to.toFixed(2)} y)</span>}
                    </td>
                    <td className="py-2">{fmt(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          <code>CAGR = (Ending value ÷ Starting value)^(1 ÷ years) − 1</code>. Reverse: <code>End = Start × (1 + CAGR)^years</code> and <code>Start = End ÷ (1 + CAGR)^years</code>, with CAGR as a decimal (12% = 0.12).
        </p>
        <p>Duration is years + months ÷ 12, so 6 years 6 months = 6.5. Both values must be positive.</p>
        <p>CAGR only uses the first and last values. If money was added or withdrawn along the way, use XIRR; to compare a gain with what it cost, use ROI.</p>
      </Formula>
    </div>
  );
}
