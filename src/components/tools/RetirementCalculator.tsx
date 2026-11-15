"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, Printer, TriangleAlert } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Legend, LineChart, compactMoney } from "./charts";
import { RET_DEFAULTS, retirementFromForm, type RetForm } from "@/lib/retirement";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { track } from "@/lib/analytics";

const DISCLAIMER = "A planning estimate based on the assumptions you enter — not personalised financial advice. Real returns, inflation, expenses and lifespan will differ, and returns vary from year to year.";
type Scen = { pre: string; post: string; inflation: string };

export default function RetirementCalculator() {
  const [f, setF] = useState<RetForm>(RET_DEFAULTS);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [scen, setScen] = useState<{ low: Scen; high: Scen }>({ low: { pre: "8", post: "6", inflation: "7" }, high: { pre: "12", post: "8", inflation: "5" } });
  const set = <K extends keyof RetForm>(k: K, v: RetForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "retirement-calculator" });
  }, []);

  const out = useMemo(() => retirementFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 0), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const shortfall = r ? r.gap > 0 : false;

  const scenarios = useMemo(() => {
    if (!r) return null;
    const run = (s: Scen) => retirementFromForm({ ...f, preReturn: s.pre, postReturn: s.post, inflation: s.inflation });
    return [
      { label: "Conservative", s: scen.low, out: run(scen.low) },
      { label: "Base", s: { pre: f.preReturn, post: f.postReturn, inflation: f.inflation }, out: out },
      { label: "Optimistic", s: scen.high, out: run(scen.high) },
    ];
  }, [r, f, scen, out]);

  const rows = (): [string, string][] =>
    r
      ? [
          ["Ages", `${r.input.age} now · retire at ${r.input.retireAge} · plan to ${r.input.lifeExpectancy}`],
          ["Monthly expenses", `${fmt(r.input.monthlyExpense)} today → ${fmt(r.expenseAtRetirement)} at retirement`],
          ["Assumptions", `${r.input.preReturn}% before retirement, ${r.input.postReturn}% after, ${r.input.inflation}% inflation`],
          ["Required corpus at retirement", fmt(r.required)],
          ["Projected corpus at retirement", fmt(r.projected)],
          [r.gap > 0 ? "Shortfall" : "Surplus", fmt(Math.abs(r.gap))],
          ...(r.extraMonthly !== null ? ([["Extra monthly investment needed (first year)", fmt(r.extraMonthly)]] as [string, string][]) : []),
          ["Projected corpus lasts", r.runsOutAtAge === null ? `beyond age ${r.input.lifeExpectancy}` : `until about age ${Math.floor(r.runsOutAtAge)}`],
        ]
      : [];

  const field = (k: keyof RetForm, label: string, extra: Partial<Parameters<typeof NumberField>[0]> = {}) => <NumberField id={`ret-${k}`} label={label} value={f[k] as string} onChange={(v) => set(k, v as never)} error={err(k)} {...extra} />;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-bold">You</legend>
            <div className="grid grid-cols-3 gap-3">
              {field("age", "Current age", { integer: true })}
              {field("retireAge", "Retire at", { integer: true })}
              {field("lifeExpectancy", "Plan until age", { integer: true })}
            </div>
          </fieldset>
          <fieldset className="grid gap-3 border-t border-line pt-5">
            <legend className="mb-1 pt-5 text-sm font-bold">Money</legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              {field("monthlyExpense", "Current monthly household expenses", { prefix: sym, hint: "What you spend now; it's grown with inflation to retirement." })}
              <div>
                <label htmlFor="ret-cur" className="mb-1.5 block text-sm font-medium">
                  Currency
                </label>
                <select id="ret-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                  {CURRENCIES.map((x) => (
                    <option key={x.code} value={x.code}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {field("corpus", "Retirement savings so far", { prefix: sym, placeholder: "0" })}
            <div className="grid grid-cols-2 gap-3">
              {field("monthlyContribution", "Saving each month", { prefix: sym, placeholder: "0" })}
              {field("stepUp", "Increase each year", { suffix: "%", placeholder: "0" })}
            </div>
          </fieldset>
          <fieldset className="grid gap-3 border-t border-line pt-5">
            <legend className="mb-1 pt-5 text-sm font-bold">Assumptions (editable estimates)</legend>
            <div className="grid grid-cols-3 gap-3">
              {field("preReturn", "Return before", { suffix: "%" })}
              {field("postReturn", "Return after", { suffix: "%" })}
              {field("inflation", "Inflation", { suffix: "%" })}
            </div>
            <p className="text-xs text-ink-2">Annual rates. &ldquo;After&rdquo; is usually lower because retirement money is often kept in safer, lower-return investments.</p>
          </fieldset>
          <fieldset className="grid gap-3 border-t border-line pt-5">
            <legend className="mb-1 pt-5 text-sm font-bold">Optional</legend>
            {field("otherIncome", "Other monthly income in retirement (pension, rent)", { prefix: sym, placeholder: "0" })}
            <Toggle checked={f.otherIncomeIndexed} onChange={(v) => set("otherIncomeIndexed", v)} label="It rises with inflation" description={f.otherIncomeIndexed ? "Entered in today's money" : "A fixed amount every month"} />
            {field("oneTime", "One-time expense at retirement (today's money)", { prefix: sym, placeholder: "0", hint: "e.g. a home repair, a car or a child's wedding" })}
          </fieldset>
        </Panel>

        <ResultCard eyebrow="Retirement corpus you'll need" state={out.status} error={out.status === "error" ? out.message : undefined} empty="Enter your ages, expenses and assumptions." onReset={() => setF(RET_DEFAULTS)} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-none tracking-tight" data-testid="ret-required">
                {fmt(r.required)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                at age {r.input.retireAge}, to cover {r.yearsInRetirement} years of expenses starting at {fmt(r.expenseAtRetirement)} a month
              </p>
              <div className={clsx("mt-5 flex items-start gap-3 rounded-[12px] p-4", shortfall ? "bg-[#E08A6D]/15" : "bg-[#7FB38F]/15")} data-testid="ret-verdict">
                {shortfall ? <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-[#E08A6D]" /> : <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-[#7FB38F]" />}
                <div className="text-sm">
                  <p className="font-bold">{shortfall ? `Shortfall of ${fmt(r.gap)}` : `On track — surplus of ${fmt(-r.gap)}`}</p>
                  <p className="mt-1 text-ivory/75">
                    {shortfall
                      ? r.extraMonthly !== null
                        ? `Investing about ${fmt(r.extraMonthly)} more a month${r.input.stepUp ? ` (rising ${r.input.stepUp}% a year)` : ""} would close it under these assumptions.`
                        : "With no years left to invest, this would need a lump sum, lower expenses or extra income."
                      : "Your projected savings meet the estimated need under these assumptions — not a guarantee."}
                  </p>
                </div>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Projected corpus at retirement" value={fmt(r.projected)} testId="ret-projected" />
                <Figure label={r.gap > 0 ? "Savings gap" : "Surplus"} value={fmt(Math.abs(r.gap))} testId="ret-gap" />
                {r.extraMonthly !== null && <Figure label="Extra monthly investment needed" value={fmt(r.extraMonthly)} strong testId="ret-extra" />}
                <Figure label="Monthly expenses at retirement" value={fmt(r.expenseAtRetirement)} testId="ret-expense" />
                <Figure label="Yearly expenses at retirement" value={fmt(r.annualExpenseAtRetirement)} />
                <Figure label="Years to retirement · in retirement" value={`${r.yearsToRetire} · ${r.yearsInRetirement}`} />
                <Figure label="Projected savings last" value={r.runsOutAtAge === null ? `beyond ${r.input.lifeExpectancy}` : `to about age ${Math.floor(r.runsOutAtAge)}`} testId="ret-lasts" />
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
                <CopyButton text={() => ["Retirement plan — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`), "", DISCLAIMER].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "retirement-calculator" })} />
                <DarkButton onClick={() => printSummary("Retirement plan estimate", rows(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && (
        <Panel className="grid gap-5 p-5 sm:p-7">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Step by step</h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="ret-steps">
              {[
                ["1 · Expenses at retirement", `${fmt(r.input.monthlyExpense)} today grows at ${r.input.inflation}% for ${r.yearsToRetire} years to ${fmt(r.expenseAtRetirement)} a month.`],
                ["2 · Corpus needed", `Enough to pay those rising expenses${r.input.otherIncome ? " (less other income)" : ""} for ${r.yearsInRetirement} years at ${r.input.postReturn}%: ${fmt(r.required)}.`],
                ["3 · What you're on track for", `${fmt(r.input.corpus)} saved grows to ${fmt(r.existingGrowsTo)}; your monthly savings add ${fmt(r.projected - r.existingGrowsTo)} — ${fmt(r.projected)} in all.`],
                [r.gap > 0 ? "4 · The gap" : "4 · The surplus", r.gap > 0 ? `${fmt(r.gap)} short${r.extraMonthly !== null ? ` — about ${fmt(r.extraMonthly)} more a month closes it` : ""}.` : `${fmt(-r.gap)} more than the estimate.`],
              ].map(([t, b]) => (
                <li key={t} className="rounded-[12px] border border-line bg-ivory p-4">
                  <p className="text-sm font-bold">{t}</p>
                  <p className="mt-1 text-sm text-ink-2">{b}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Savings until retirement</h3>
              <Legend items={[{ label: "Savings + contributions", color: CHART.charcoal }, { label: "Investment growth", color: CHART.orange }]} />
            </div>
            <BarChart
              label={`Projected savings grow to ${fmt(r.projected)} by age ${r.input.retireAge}.`}
              labels={r.accumulation.map((a) => String(a.age))}
              series={[
                { label: "Put in", color: CHART.charcoal, values: r.accumulation.map((a) => r.input.corpus + a.contributed) },
                { label: "Growth", color: CHART.orange, values: r.accumulation.map((a) => Math.max(0, a.balance - r.input.corpus - a.contributed)) },
              ]}
              stacked
              format={axis}
            />
          </div>
          <div className="grid gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold">Your projected savings during retirement</h3>
              <Legend items={[{ label: "Balance", color: CHART.orange }, { label: "Withdrawn that year", color: CHART.charcoal, dashed: true }]} />
            </div>
            <LineChart
              label={r.runsOutAtAge === null ? `The projected corpus lasts beyond age ${r.input.lifeExpectancy}, with ${fmt(r.leftAtEnd)} left.` : `The projected corpus runs out at about age ${Math.floor(r.runsOutAtAge)}.`}
              labels={r.drawdown.map((d) => String(d.age))}
              format={axis}
              series={[
                { label: "Balance", color: CHART.orange, values: r.drawdown.map((d) => d.balance) },
                { label: "Withdrawn", color: CHART.charcoal, dashed: true, values: r.drawdown.map((d) => d.withdrawn) },
              ]}
            />
          </div>
          {scenarios && (
            <div className="grid gap-3 border-t border-line pt-4">
              <h3 className="font-bold">Compare assumptions</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-right text-sm" data-testid="ret-scenarios">
                  <thead className="text-xs text-ink-2">
                    <tr className="border-b border-line">
                      <th scope="col" className="py-2 text-left font-medium">Scenario</th>
                      <th scope="col" className="py-2 font-medium">Return before / after · inflation</th>
                      <th scope="col" className="py-2 font-medium">Required</th>
                      <th scope="col" className="py-2 font-medium">Projected</th>
                      <th scope="col" className="py-2 font-medium">Gap (−) / surplus (+)</th>
                      <th scope="col" className="py-2 font-medium">Extra a month</th>
                      <th scope="col" className="py-2 font-medium">Savings last to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, i) => {
                      const x = s.out.status === "ok" ? s.out.result : null;
                      return (
                        <tr key={s.label} className={clsx("border-b border-line last:border-0", i === 1 && "font-medium")}>
                          <th scope="row" className="py-2 text-left font-normal">
                            {s.label}
                          </th>
                          <td className="py-2">
                            {i === 1 ? (
                              <span className="font-mono">
                                {s.s.pre}% / {s.s.post}% · {s.s.inflation}%
                              </span>
                            ) : (
                              <span className="inline-flex gap-1">
                                {(["pre", "post", "inflation"] as const).map((k) => (
                                  <input key={k} aria-label={`${s.label} ${k === "pre" ? "return before retirement" : k === "post" ? "return after retirement" : "inflation"}`} inputMode="decimal" value={s.s[k]} onChange={(e) => setScen((o) => ({ ...o, [i === 0 ? "low" : "high"]: { ...o[i === 0 ? "low" : "high"], [k]: e.target.value } }))} className="h-8 w-14 rounded-[6px] border border-line-strong bg-card px-1.5 text-right font-mono text-sm" />
                                ))}
                              </span>
                            )}
                          </td>
                          {x ? (
                            <>
                              <td className="py-2 font-mono">{fmt(x.required)}</td>
                              <td className="py-2 font-mono">{fmt(x.projected)}</td>
                              <td className="py-2 font-mono">{x.gap > 0 ? `−${fmt(x.gap)}` : `+${fmt(-x.gap)}`}</td>
                              <td className="py-2 font-mono">{x.extraMonthly !== null ? fmt(x.extraMonthly) : "—"}</td>
                              <td className="py-2">{x.runsOutAtAge === null ? `beyond ${x.input.lifeExpectancy}` : `≈ ${Math.floor(x.runsOutAtAge)}`}</td>
                            </>
                          ) : (
                            <td colSpan={5} className="py-2 text-ink-2">
                              {s.out.status === "error" ? s.out.message : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-ink-2">Scenario names describe the assumptions only — they aren&rsquo;t forecasts or a measure of investment suitability.</p>
            </div>
          )}
        </Panel>
      )}

      <Formula>
        <p>
          Expenses at retirement = <code>today&rsquo;s expenses × (1 + inflation)^years to retirement</code>; they keep rising with inflation once a year in retirement.
        </p>
        <p>Required corpus = the present value, at the post-retirement return, of every month&rsquo;s expenses (less other income) withdrawn at the start of the month until the age you plan to, plus any one-time expense. It is calculated month by month — not a rule of thumb like 25 × annual expenses.</p>
        <p>
          Projected corpus: your savings and monthly contributions (paid at the start of each month, increased once a year) grow at the pre-retirement return. Annual returns are effective rates: monthly = <code>(1 + R)^(1/12) − 1</code>. The extra monthly investment is the gap ÷ the future value of ₹1 a month on the same plan.
        </p>
        <p>Taxes, fees, health shocks and changes in spending aren&rsquo;t modelled.</p>
      </Formula>
    </div>
  );
}
