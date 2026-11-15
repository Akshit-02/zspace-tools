"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Info, Printer } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Legend, LineChart, compactMoney } from "./charts";
import { periodsToText, swp, swpCsv, swpFromForm, type SwpForm, type SwpFrequency } from "@/lib/swp";
import { parseNum } from "@/lib/discount";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: SwpForm = { corpus: "5000000", withdrawal: "30000", annualReturn: "8", frequency: 12, timing: "begin", years: "30", stepUp: "", inflation: "", linkToInflation: false };
const PER: Record<SwpFrequency, string> = { 12: "month", 4: "quarter", 1: "year" };
const DISCLAIMER = "An illustration at constant assumed returns. Real returns vary from year to year — and the order of good and bad years can matter as much as the average. Market-linked investments carry risk. Not financial advice.";

function addMonths(ym: string, months: number) {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  return new Date(Date.UTC(Math.floor(total / 12), total % 12, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function SwpCalculator() {
  const [f, setF] = useState<SwpForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [start, setStart] = useState("");
  const [useInflation, setUseInflation] = useState(false);
  const [scen, setScen] = useState({ low: "6", high: "10" });
  const set = <K extends keyof SwpForm>(k: K, v: SwpForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "swp-calculator" });
    const d = new Date();
    setStart(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const form = useMemo(() => ({ ...f, inflation: useInflation ? f.inflation || "6" : "", linkToInflation: useInflation && f.linkToInflation }), [f, useInflation]);
  const out = useMemo(() => swpFromForm(form), [form]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 0), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const per = PER[f.frequency];
  const startOk = /^\d{4}-\d{2}$/.test(start);
  const when = (periods: number) => (startOk ? addMonths(start, Math.round(((periods - 1) * 12) / f.frequency)) : null);

  const scenarios = useMemo(() => {
    if (!r) return null;
    const lo = parseNum(scen.low);
    const hi = parseNum(scen.high);
    const run = (rate: number | null) => (rate === null || Number.isNaN(rate) || rate < -50 || rate > 50 ? null : swp({ ...r.input, annualReturn: rate }));
    return [
      { key: "low", label: "Conservative", rate: lo, res: run(lo) },
      { key: "base", label: "Base", rate: r.input.annualReturn, res: r as ReturnType<typeof swp> },
      { key: "high", label: "Optimistic", rate: hi, res: run(hi) },
    ];
  }, [r, scen]);

  const lasts = (x: ReturnType<typeof swp>) => (x.exhaustedAt ? `Runs out after ${periodsToText(x.exhaustedAt, f.frequency)}` : `Lasts the full ${r?.input.years} years`);

  const rows = (): [string, string][] =>
    r
      ? [
          ["Initial corpus", fmt(r.corpus)],
          [`Withdrawal each ${per}`, `${fmt(r.firstWithdrawal)}${r.input.stepUp ? `, rising ${r.input.stepUp}% a year` : ""} (${f.timing === "begin" ? "start" : "end"} of each ${per})`],
          ["Assumed return", `${r.input.annualReturn}% a year (effective)`],
          ["Total withdrawn", fmt(r.totalWithdrawn)],
          ["Investment growth", fmt(r.totalGrowth)],
          ["Remaining corpus", fmt(r.remaining)],
          ["Result", r.exhaustedAt ? `Corpus exhausted after ${periodsToText(r.exhaustedAt, f.frequency)}${when(r.exhaustedAt) ? ` (${when(r.exhaustedAt)})` : ""}` : `Not exhausted within ${r.input.years} years`],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="swp-corpus" label="Investment corpus" prefix={c.label.split(" ")[0]} value={f.corpus} onChange={(v) => set("corpus", v)} error={err("corpus")} size="lg" />
            <div>
              <label htmlFor="swp-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="swp-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Withdraw every</p>
            <Segmented label="Withdrawal frequency" size="sm" value={String(f.frequency)} onChange={(v) => set("frequency", Number(v) as SwpFrequency)} options={[{ value: "12", label: "Month" }, { value: "4", label: "Quarter" }, { value: "1", label: "Year" }]} />
          </div>
          <NumberField id="swp-withdrawal" label={`Withdrawal each ${per}`} prefix={c.label.split(" ")[0]} value={f.withdrawal} onChange={(v) => set("withdrawal", v)} error={err("withdrawal")} />
          <NumberField id="swp-return" label="Expected annual return" suffix="% a year" value={f.annualReturn} onChange={(v) => set("annualReturn", v)} error={err("annualReturn")} hint="Effective annual rate — converted exactly to a per-period rate." />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="swp-years" label="Project for" suffix="years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} />
            <div>
              <label htmlFor="swp-start" className="mb-1.5 block text-sm font-medium">
                First withdrawal
              </label>
              <input id="swp-start" type="month" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono outline-none focus:border-charcoal" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Withdrawals taken at the</p>
            <Segmented label="Withdrawal timing" size="sm" value={f.timing} onChange={(v) => set("timing", v)} options={[{ value: "begin", label: `Start of each ${per}` }, { value: "end", label: `End of each ${per}` }]} />
          </div>
          <div className="grid gap-2 border-t border-line pt-5">
            {!(useInflation && f.linkToInflation) && <NumberField id="swp-stepup" label="Raise withdrawals each year by (optional)" suffix="%" placeholder="0" value={f.stepUp} onChange={(v) => set("stepUp", v)} error={err("stepUp")} className="max-w-[300px]" />}
            <Toggle checked={useInflation} onChange={setUseInflation} label="Use an inflation assumption" description="Shows values in today's money" />
            {useInflation && (
              <>
                <NumberField id="swp-inflation" label="Inflation" suffix="% a year" placeholder="6" value={f.inflation} onChange={(v) => set("inflation", v)} error={err("inflation")} className="max-w-[240px]" />
                <Toggle checked={f.linkToInflation} onChange={(v) => set("linkToInflation", v)} label="Raise withdrawals with inflation" description="Keeps their buying power the same each year" />
              </>
            )}
          </div>
        </Panel>

        <ResultCard eyebrow={r?.exhaustedAt ? "Your money runs out after" : "Remaining corpus"} state={out.status} error={out.status === "error" ? out.message : undefined} empty="Enter the corpus, withdrawal and expected return." onReset={() => (setF(DEFAULT), setUseInflation(false))} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="swp-main">
                {r.exhaustedAt ? periodsToText(r.exhaustedAt, f.frequency) : fmt(r.remaining)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="swp-status">
                {r.exhaustedAt ? `Last withdrawal around ${when(r.exhaustedAt) ?? "—"}${r.lastPartial ? ` — only ${fmt(r.lastPartial)} of it is left` : ""}.` : `Not exhausted within the ${r.input.years} years modelled.`}
              </p>
              <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Initial corpus" value={fmt(r.corpus)} />
                <Figure label={`Withdrawal each ${per}`} value={r.input.stepUp ? `${fmt(r.firstWithdrawal)} → ${fmt(r.lastFullWithdrawal)}` : fmt(r.firstWithdrawal)} />
                <Figure label={`Withdrawals made`} value={String(r.withdrawals)} />
                <Figure label="Total withdrawn" value={fmt(r.totalWithdrawn)} testId="swp-withdrawn" />
                <Figure label="Investment growth" value={fmt(r.totalGrowth)} testId="swp-growth" />
                <Figure label="Corpus consumed" value={fmt(r.corpus - r.remaining)} />
                <Figure label="Remaining corpus" value={fmt(r.remaining)} strong testId="swp-remaining" />
                {r.realRemaining !== null && <Figure label="Remaining in today's money" value={fmt(r.realRemaining)} />}
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
                <CopyButton text={() => ["SWP projection — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`), "", DISCLAIMER].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "swp-calculator" })} />
                <DarkButton onClick={() => printSummary("Systematic withdrawal plan", rows(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && scenarios && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Remaining corpus over time</h2>
            <Legend items={[{ label: "Conservative", color: CHART.muted, dashed: true }, { label: "Base", color: CHART.orange }, { label: "Optimistic", color: CHART.charcoal, dashed: true }]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField id="swp-low" label="Conservative return" suffix="% a year" value={scen.low} onChange={(v) => setScen((s) => ({ ...s, low: v }))} />
            <NumberField id="swp-high" label="Optimistic return" suffix="% a year" value={scen.high} onChange={(v) => setScen((s) => ({ ...s, high: v }))} />
          </div>
          <LineChart
            label={`Remaining corpus each year at ${scenarios.map((s) => `${s.rate}%`).join(", ")} returns.`}
            labels={["Start", ...Array.from({ length: Math.ceil(r.input.years) }, (_, i) => `Y${i + 1}`)]}
            format={axis}
            series={scenarios
              .filter((s) => s.res)
              .map((s) => ({
                label: s.label,
                color: s.key === "base" ? CHART.orange : s.key === "low" ? CHART.muted : CHART.charcoal,
                dashed: s.key !== "base",
                values: [r.corpus, ...Array.from({ length: Math.ceil(r.input.years) }, (_, i) => s.res!.years[i]?.balance ?? 0)],
              }))}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-sm" data-testid="swp-scenarios">
              <thead className="text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Scenario (assumption)</th>
                  <th scope="col" className="py-2 font-medium">Total withdrawn</th>
                  <th scope="col" className="py-2 font-medium">Remaining</th>
                  <th scope="col" className="py-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => (
                  <tr key={s.key} className={clsx("border-b border-line last:border-0", s.key === "base" && "font-medium")}>
                    <th scope="row" className="py-2 text-left font-normal">
                      {s.label} · <span className="font-mono">{s.rate ?? "—"}%</span>
                    </th>
                    {s.res ? (
                      <>
                        <td className="py-2 font-mono">{fmt(s.res.totalWithdrawn)}</td>
                        <td className="py-2 font-mono">{fmt(s.res.remaining)}</td>
                        <td className="py-2">{lasts(s.res)}</td>
                      </>
                    ) : (
                      <td colSpan={3} className="py-2 text-ink-2">
                        Enter a return between −50% and 50%.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Withdrawals vs investment growth each year</h3>
              <Legend items={[{ label: "Withdrawn", color: CHART.charcoal }, { label: "Growth", color: CHART.orange }]} />
            </div>
            <BarChart label={`Each year's withdrawals and investment growth; total withdrawn ${fmt(r.totalWithdrawn)}, growth ${fmt(r.totalGrowth)}.`} labels={r.years.map((y) => `Y${y.year}`)} series={[{ label: "Withdrawn", color: CHART.charcoal, values: r.years.map((y) => y.withdrawn) }, { label: "Growth", color: CHART.orange, values: r.years.map((y) => Math.max(0, y.growth)) }]} format={axis} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise table</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([swpCsv(r, currency, per[0].toUpperCase() + per.slice(1))], { type: "text/csv;charset=utf-8" }), "swp-schedule.csv");
                track("download_clicked", { tool: "swp-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[480px] text-right text-sm" data-testid="swp-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Withdrawn</th>
                  <th scope="col" className="py-2 font-medium">Growth</th>
                  <th scope="col" className="py-2 font-medium">Balance</th>
                  {r.realRemaining !== null && <th scope="col" className="py-2 font-medium">In today&rsquo;s money</th>}
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">{y.year}</td>
                    <td className="py-2">{fmt(y.withdrawn)}</td>
                    <td className="py-2">{fmt(y.growth)}</td>
                    <td className="py-2">{fmt(y.balance)}</td>
                    {y.realBalance !== null && <td className="py-2">{fmt(y.realBalance)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          The annual return is treated as an effective rate, so each period grows by <code>(1 + R)^(1/f) − 1</code> — <code>f</code> = 12 for monthly, 4 for quarterly, 1 for yearly. It isn&rsquo;t simply divided by 12.
        </p>
        <p>Start-of-period withdrawals are taken before that period&rsquo;s growth; end-of-period withdrawals after it. With an annual increase, every withdrawal in year <code>n</code> is <code>W × (1 + increase)^(n − 1)</code>.</p>
        <p>The simulation stops when the corpus can&rsquo;t cover a withdrawal: the last payment is whatever is left, and the balance never goes below zero. Taxes on withdrawals and exit loads aren&rsquo;t included.</p>
      </Formula>
    </div>
  );
}
