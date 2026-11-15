"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileText, GitCompare, Info } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { Figure, Formula, NumberField, ResetButton } from "./calc-ui";
import { BarChart, CHART, Donut, Legend, LineChart, compactMoney } from "./charts";
import { SIP_DISCLAIMER, sip, sipCsv, sipFromForm, type SipForm } from "@/lib/sip";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const DEFAULT: SipForm = { monthly: "10000", annualReturn: "12", duration: "10", unit: "years", timing: "end", stepUp: "", rateMode: "effective" };
const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

export default function SipCalculator() {
  const [f, setF] = useState<SipForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [compare, setCompare] = useState(false);
  const [b, setB] = useState<SipForm>({ ...DEFAULT, monthly: "15000" });
  const set = <K extends keyof SipForm>(k: K, v: SipForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const setBf = <K extends keyof SipForm>(k: K, v: SipForm[K]) => setB((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "sip-calculator" });
  }, []);

  const out = useMemo(() => sipFromForm(f), [f]);
  const outB = useMemo(() => (compare ? sipFromForm({ ...b, unit: f.unit, timing: f.timing, rateMode: f.rateMode }) : null), [compare, b, f.unit, f.timing, f.rateMode]);
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 0), [currency]);
  const fmt2 = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const r = out.status === "ok" ? out.result : null;
  const regular = useMemo(() => (r && r.input.stepUp > 0 ? sip({ ...r.input, stepUp: 0 }) : null), [r]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);

  const summary = () => {
    if (!r) return "";
    const i = r.input;
    return [
      "SIP calculation — ZSpace Tools",
      `Monthly investment: ${fmt2(i.monthly)}${i.stepUp ? ` (rising ${i.stepUp}% every 12 instalments)` : ""}`,
      `Expected return: ${i.annualReturn}% a year (${i.rateMode === "effective" ? "effective annual" : "nominal, ÷ 12"}; monthly rate ${pct(r.monthlyRate, 4)})`,
      `Instalments: ${r.instalments}, ${i.timing === "begin" ? "start" : "end"} of each month`,
      `Total invested: ${fmt(r.invested)}`,
      `Estimated returns: ${fmt(r.returns)}`,
      `Estimated maturity value: ${fmt(r.value)}`,
      "",
      SIP_DISCLAIMER,
    ].join("\n");
  };

  const share = r && r.value > 0 ? Math.max(0, r.returns) / r.value : 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <NumberField id="sip-monthly" label="Monthly investment" prefix={c.label.split(" ")[0]} value={f.monthly} onChange={(v) => set("monthly", v)} error={err("monthly")} size="lg" />
            <div>
              <label htmlFor="sip-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="sip-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="sip-return" label="Expected return" suffix="% a year" value={f.annualReturn} onChange={(v) => set("annualReturn", v)} error={err("annualReturn")} hint="An assumption, not a promise — try a few rates." />
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField id="sip-duration" label="Investment period" value={f.duration} onChange={(v) => set("duration", v)} error={err("duration")} />
            <Segmented label="Period unit" className="mb-px h-11 w-40" size="sm" value={f.unit} onChange={(v) => set("unit", v)} options={[{ value: "years", label: "Years" }, { value: "months", label: "Months" }]} />
          </div>
          <NumberField id="sip-stepup" label="Annual step-up (optional)" suffix="% a year" placeholder="0" value={f.stepUp} onChange={(v) => set("stepUp", v)} error={err("stepUp")} hint="Raise the instalment by this % after every 12 instalments." />
          <div>
            <p className="mb-1.5 text-sm font-medium">Instalment paid</p>
            <Segmented label="Instalment timing" size="sm" value={f.timing} onChange={(v) => set("timing", v)} options={[{ value: "end", label: "End of month" }, { value: "begin", label: "Start of month" }]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Monthly rate from the annual return</p>
            <Segmented
              label="Rate convention"
              size="sm"
              value={f.rateMode}
              onChange={(v) => set("rateMode", v)}
              options={[
                { value: "effective", label: "Effective annual", hint: "(1+R)^(1/12)−1" },
                { value: "nominal", label: "Nominal ÷ 12", hint: "R ÷ 12" },
              ]}
            />
          </div>
          <Toggle checked={compare} onChange={setCompare} label="Compare with another scenario" description="Different amount, return, period or step-up" />
        </Panel>

        <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
            <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Estimated maturity value
          </p>
          {r ? (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.2rem,1.5rem+3vw,3.5rem)] leading-none tracking-tight" data-testid="sip-value">
                {fmt(r.value)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                after {r.instalments} monthly instalments{r.input.stepUp ? `, stepping up ${r.input.stepUp}% a year` : ""}
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Invested ${Math.round((1 - share) * 100)}%, estimated returns ${Math.round(share * 100)}% of the maturity value`} parts={[{ value: r.invested, color: "rgba(250,247,242,0.9)" }, { value: Math.max(0, r.returns), color: CHART.orange }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Total invested" value={fmt(r.invested)} testId="sip-invested" />
                  <Figure label="Estimated returns" value={fmt(r.returns)} testId="sip-returns" />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Instalments" value={`${r.instalments} (${Math.floor(r.instalments / 12)} y ${r.instalments % 12} m)`} />
                <Figure label={r.input.stepUp ? "First → last instalment" : "Monthly investment"} value={r.input.stepUp ? `${fmt(r.input.monthly)} → ${fmt(r.lastInstalment)}` : fmt(r.input.monthly)} />
                <Figure label="Monthly rate used" value={pct(r.monthlyRate, 4)} />
                <Figure label="Effective annual return" value={pct(r.effectiveAnnual)} testId="sip-effective" />
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
                <CopyButton text={summary} label="Copy summary" variant="primary" onCopied={() => track("copy_clicked", { tool: "sip-calculator" })} />
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(new Blob([summary()], { type: "text/plain;charset=utf-8" }), "sip-summary.txt");
                    track("download_clicked", { tool: "sip-calculator", format: "txt" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60"
                >
                  <FileText aria-hidden className="size-4" /> Summary
                </button>
                <ResetButton dark onClick={() => (setF(DEFAULT), setCompare(false))} />
              </div>
            </>
          ) : out.status === "error" ? (
            <>
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {out.message}
              </p>
              <div className="mt-4">
                <ResetButton dark onClick={() => (setF(DEFAULT), setCompare(false))} />
              </div>
            </>
          ) : (
            <p className="mt-6 text-ivory/60">Enter a monthly amount, expected return and period.</p>
          )}
          <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55" data-testid="sip-disclaimer">
            {SIP_DISCLAIMER}
          </p>
        </div>
      </div>

      {compare && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <p className="flex items-center gap-2 font-bold">
            <GitCompare aria-hidden className="size-4" /> Scenario B
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField id="sipb-monthly" label="Monthly investment" prefix={c.label.split(" ")[0]} value={b.monthly} onChange={(v) => setBf("monthly", v)} />
            <NumberField id="sipb-return" label="Expected return" suffix="%" value={b.annualReturn} onChange={(v) => setBf("annualReturn", v)} />
            <NumberField id="sipb-duration" label={`Period (${f.unit})`} value={b.duration} onChange={(v) => setBf("duration", v)} />
            <NumberField id="sipb-stepup" label="Step-up" suffix="%" placeholder="0" value={b.stepUp} onChange={(v) => setBf("stepUp", v)} />
          </div>
          {outB?.status === "error" && <p className="text-sm text-[#8f2f27]" role="alert">{outB.message}</p>}
          {r && outB?.status === "ok" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm" data-testid="sip-compare">
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
                      ["Total invested", r.invested, outB.result.invested],
                      ["Estimated returns", r.returns, outB.result.returns],
                      ["Maturity value", r.value, outB.result.value],
                    ] as const
                  ).map(([l, x, y]) => (
                    <tr key={l} className="border-b border-line last:border-0">
                      <th scope="row" className="py-2 font-sans font-medium">{l}</th>
                      <td className="py-2 text-right">{fmt(x)}</td>
                      <td className="py-2 text-right">{fmt(y)}</td>
                      <td className={clsx("py-2 text-right", y - x >= 0 ? "text-success" : "text-error")}>
                        {y - x >= 0 ? "+" : "−"}
                        {fmt(Math.abs(y - x))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {r && r.years.length > 0 && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Year-by-year growth</h2>
            <Legend items={[{ label: "Invested", color: CHART.charcoal }, { label: "Estimated returns", color: CHART.orange }]} />
          </div>
          <BarChart
            label={`Stacked bars of amount invested and estimated returns at the end of each year; final value ${fmt(r.value)}.`}
            labels={r.years.map((y) => `Y${y.year}`)}
            series={[
              { label: "Invested", color: CHART.charcoal, values: r.years.map((y) => y.invested) },
              { label: "Estimated returns", color: CHART.orange, values: r.years.map((y) => Math.max(0, y.returns)) },
            ]}
            stacked
            format={axis}
          />
          {(regular || (outB?.status === "ok" && outB.result.years.length)) && (
            <div className="grid gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">{regular ? "Step-up SIP vs regular SIP" : "Scenario A vs B"}</h3>
                <Legend
                  items={[
                    { label: regular ? `Step-up ${r.input.stepUp}%` : "Scenario A", color: CHART.orange },
                    ...(regular ? [{ label: "Regular SIP", color: CHART.charcoal, dashed: true }] : []),
                    ...(outB?.status === "ok" ? [{ label: "Scenario B", color: CHART.muted }] : []),
                  ]}
                />
              </div>
              {(() => {
                const n = Math.max(r.years.length, outB?.status === "ok" ? outB.result.years.length : 0);
                const pad = (vals: number[]) => Array.from({ length: n }, (_, i) => vals[Math.min(i, vals.length - 1)] ?? 0);
                return (
                  <LineChart
                    label={regular ? `Step-up SIP reaches ${fmt(r.value)} versus ${fmt(regular.value)} for a regular SIP.` : `Scenario A reaches ${fmt(r.value)}; scenario B reaches ${outB?.status === "ok" ? fmt(outB.result.value) : "—"}.`}
                    labels={Array.from({ length: n }, (_, i) => `Y${i + 1}`)}
                    format={axis}
                    series={[
                      { label: "A", color: CHART.orange, values: pad(r.years.map((y) => y.value)) },
                      ...(regular ? [{ label: "Regular", color: CHART.charcoal, dashed: true, values: pad(regular.years.map((y) => y.value)) }] : []),
                      ...(outB?.status === "ok" ? [{ label: "B", color: CHART.muted, values: pad(outB.result.years.map((y) => y.value)) }] : []),
                    ]}
                  />
                );
              })()}
              {regular && (
                <p className="text-sm text-ink-2" data-testid="sip-stepup-gain">
                  Stepping up adds {fmt(r.invested - regular.invested)} of investment and {fmt(r.value - regular.value)} to the estimated maturity value compared with a regular {fmt(r.input.monthly)} SIP.
                </p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Year-wise table</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([sipCsv(r, currency)], { type: "text/csv;charset=utf-8" }), "sip-year-wise.csv");
                track("download_clicked", { tool: "sip-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[560px] text-right text-sm" data-testid="sip-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Year</th>
                  <th scope="col" className="py-2 font-medium">Monthly</th>
                  <th scope="col" className="py-2 font-medium">Invested (total)</th>
                  <th scope="col" className="py-2 font-medium">Est. returns</th>
                  <th scope="col" className="py-2 font-medium">Est. value</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.years.map((y) => (
                  <tr key={y.year} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {y.year}
                      {y.instalments < 12 && <span className="text-ink-3"> ({y.instalments} m)</span>}
                    </td>
                    <td className="py-2">{fmt(y.monthly)}</td>
                    <td className="py-2">{fmt(y.invested)}</td>
                    <td className="py-2">{fmt(y.returns)}</td>
                    <td className="py-2">{fmt(y.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          Monthly rate: <code>r = (1 + R)^(1/12) − 1</code> with the effective-annual setting (12 months at <code>r</code> compound to exactly R), or <code>r = R ÷ 12</code> with the nominal setting that many fund-house calculators use. The nominal setting gives a slightly higher figure for the same R.
        </p>
        <p>
          Fixed SIP, end of month: <code>FV = P × ((1 + r)^n − 1) ÷ r</code>. Start of month: multiply by <code>(1 + r)</code>. With a 0% return, <code>FV = P × n</code>.
        </p>
        <p>Step-up: the instalment rises by the step-up % after every 12 instalments, and each instalment is compounded for exactly the months it stays invested — the calculation runs month by month rather than approximating.</p>
        <p>Assumes a constant return, no exit loads, expense ratio changes or taxes. Durations are rounded to whole months.</p>
      </Formula>
    </div>
  );
}
