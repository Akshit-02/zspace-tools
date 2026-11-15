"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Info, Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { BarChart, CHART, Legend, compactMoney } from "./charts";
import { fyLabel, fyOf, monthName, ppfCsv, ppfFromForm, type PpfForm, type PpfYear } from "@/lib/ppf";
import { PPF_RULES } from "@/lib/india/ppf-rules";
import { money } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const fmt = money("INR", 0);
const fmt2 = money("INR", 2);
const axis = compactMoney("en-IN", "INR");
const DISCLAIMER = "An estimate, not a bank or Government statement. Actual interest depends on your real deposit dates, the rate notified each quarter and the PPF rules in force.";

export default function PpfCalculator() {
  const [today, setToday] = useState<{ year: number; month: number } | null>(null);
  const [f, setF] = useState<PpfForm>({ account: "new", openMonth: "4", openYear: "2026", openedFY: "2018", balance: "", amount: "150000", frequency: "yearly", depositMonth: 4, byFifth: true, rate: String(PPF_RULES.rate.value), blocks: 1 });
  const set = <K extends keyof PpfForm>(k: K, v: PpfForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "ppf-calculator" });
    const d = new Date();
    const t = { year: d.getFullYear(), month: d.getMonth() + 1 };
    setToday(t); // eslint-disable-line react-hooks/set-state-in-effect
    setF((x) => ({ ...x, openMonth: String(t.month), openYear: String(t.year) }));
  }, []);

  const out = useMemo(() => (today ? ppfFromForm(f, today) : ({ status: "empty" } as const)), [f, today]);
  const r = out.status === "ok" ? out.result : null;
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const currentFY = today ? fyOf(today.year, today.month) : 2026;
  const [view, setView] = useState<"term" | "with" | "without">("term");
  const tableRows: PpfYear[] = r ? (view === "term" ? r.term : [...r.term, ...(view === "with" ? r.withDeposits.years : r.withoutDeposits.years)]) : [];

  const rows = (): [string, string][] =>
    r
      ? [
          ["Deposit", `${fmt(Number(f.amount))} ${f.frequency === "monthly" ? "every month" : `every year in ${monthName(f.depositMonth)}`}, ${f.byFifth ? "on or before the 5th" : "after the 5th"}`],
          ["Interest rate assumed", `${f.rate}% a year`],
          ["Maturity", r.maturityDate],
          ...(r.atMaturity
            ? ([
                ["Total deposits", fmt(r.atMaturity.deposits)],
                ["Interest earned", fmt(r.atMaturity.interest)],
                ["Balance at maturity", fmt(r.atMaturity.balance)],
              ] as [string, string][])
            : []),
          [`+${f.blocks * 5} years, with deposits`, fmt(r.withDeposits.balance)],
          [`+${f.blocks * 5} years, without deposits`, fmt(r.withoutDeposits.balance)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="Account" value={f.account} onChange={(v) => set("account", v)} options={[{ value: "new", label: "New account" }, { value: "existing", label: "Existing account" }]} />
          {f.account === "new" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ppf-om" className="mb-1.5 block text-sm font-medium">
                  Opening month
                </label>
                <select id="ppf-om" value={f.openMonth} onChange={(e) => set("openMonth", e.target.value)} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {monthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>
              <NumberField id="ppf-oy" label="Opening year" integer value={f.openYear} onChange={(v) => set("openYear", v)} error={err("openYear")} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ppf-ofy" className="mb-1.5 block text-sm font-medium">
                  Opened in financial year
                </label>
                <select id="ppf-ofy" value={f.openedFY} onChange={(e) => set("openedFY", e.target.value)} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 font-mono">
                  {Array.from({ length: currentFY - 1990 + 1 }, (_, i) => currentFY - i).map((y) => (
                    <option key={y} value={y}>
                      FY {fyLabel(y)}
                    </option>
                  ))}
                </select>
              </div>
              <NumberField id="ppf-balance" label={`Balance on 1 April ${currentFY}`} prefix="₹" value={f.balance} onChange={(v) => set("balance", v)} error={err("balance")} />
            </div>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium">Deposits</p>
            <Segmented label="Deposit frequency" size="sm" value={f.frequency} onChange={(v) => set("frequency", v)} options={[{ value: "yearly", label: "Once a year" }, { value: "monthly", label: "Every month" }]} />
          </div>
          <NumberField id="ppf-amount" label={f.frequency === "monthly" ? "Amount each month" : "Amount each year"} prefix="₹" value={f.amount} onChange={(v) => set("amount", v)} error={err("amount")} hint={`₹${PPF_RULES.minDepositPerFY}–₹${PPF_RULES.maxDepositPerFY.toLocaleString("en-IN")} per financial year, in multiples of ₹${PPF_RULES.depositMultiple}.`} size="lg" />
          {f.frequency === "yearly" && (
            <div>
              <label htmlFor="ppf-dm" className="mb-1.5 block text-sm font-medium">
                Deposit month each year
              </label>
              <select id="ppf-dm" value={f.depositMonth} onChange={(e) => set("depositMonth", Number(e.target.value))} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3">
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map((m) => (
                  <option key={m} value={m}>
                    {monthName(m)}
                    {m === 4 ? " (start of the financial year)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Toggle checked={f.byFifth} onChange={(v) => set("byFifth", v)} label="Deposit on or before the 5th" description={f.byFifth ? "Counts for that month's interest" : "Misses that month's interest"} />
          <NumberField id="ppf-rate" label="Interest rate" suffix="% a year" value={f.rate} onChange={(v) => set("rate", v)} error={err("rate")} hint={`${PPF_RULES.rate.value}% for ${PPF_RULES.rate.period}. ${PPF_RULES.rate.note}`} />
          <div>
            <label htmlFor="ppf-blocks" className="mb-1.5 block text-sm font-medium">
              Extension after maturity
            </label>
            <select id="ppf-blocks" value={f.blocks} onChange={(e) => set("blocks", Number(e.target.value))} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3">
              {[1, 2, 3, 4].map((b) => (
                <option key={b} value={b}>
                  {b} block{b > 1 ? "s" : ""} of 5 years ({b * 5} years)
                </option>
              ))}
            </select>
          </div>
        </Panel>

        <ResultCard eyebrow="Estimated balance at maturity" state={out.status === "ok" ? "ok" : out.status === "error" ? "error" : "empty"} error={out.status === "error" ? out.message : undefined} empty="Enter your deposit and interest rate." onReset={() => setF((x) => ({ ...x, account: "new", amount: "150000", frequency: "yearly", depositMonth: 4, byFifth: true, rate: String(PPF_RULES.rate.value), blocks: 1, balance: "" }))} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.4rem)] leading-none tracking-tight" data-testid="ppf-maturity">
                {r.atMaturity ? fmt(r.atMaturity.balance) : "Matured"}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="ppf-date">
                {r.alreadyMatured ? `This account matured on ${r.maturityDate}.` : `Matures on ${r.maturityDate} (end of FY ${fyLabel(r.maturityFY)})`}
              </p>
              {r.atMaturity && (
                <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10">
                  {r.atMaturity.openingBalance > 0 && <Figure label={`Balance on 1 April ${r.startFY}`} value={fmt(r.atMaturity.openingBalance)} />}
                  <Figure label="Total deposits" value={fmt(r.atMaturity.deposits)} testId="ppf-deposits" />
                  <Figure label="Interest earned" value={fmt(r.atMaturity.interest)} testId="ppf-interest" />
                  <Figure label="Deposits per financial year" value={fmt(r.annualDeposit)} />
                  <Figure label="Financial years of deposits" value={String(r.term.length)} />
                </dl>
              )}
              <div className="mt-5 grid gap-2 rounded-[12px] bg-ivory/[0.06] p-4 text-sm" data-testid="ppf-extension">
                <p className="font-medium">After {f.blocks * 5} more years of extension</p>
                <div className="flex justify-between gap-3">
                  <span className="text-ivory/70">With deposits (Form-4 within a year of maturity)</span>
                  <span className="font-mono">{fmt(r.withDeposits.balance)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ivory/70">Without deposits (interest only)</span>
                  <span className="font-mono">{fmt(r.withoutDeposits.balance)}</span>
                </div>
              </div>
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
                <CopyButton text={() => ["PPF estimate — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`), "", DISCLAIMER].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "ppf-calculator" })} />
                <DarkButton onClick={() => printSummary("PPF estimate", rows(), [DISCLAIMER])}>
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
            <h2 className="font-display text-xl font-semibold">Year-by-year growth</h2>
            <Segmented label="Table view" size="sm" className="w-full sm:w-[420px]" value={view} onChange={setView} options={[{ value: "term", label: "To maturity" }, { value: "with", label: "+ with deposits" }, { value: "without", label: "+ without deposits" }]} />
          </div>
          {tableRows.length > 0 && (
            <>
              <Legend items={[{ label: "Total deposited", color: CHART.charcoal }, { label: "Interest earned", color: CHART.orange }]} />
              <BarChart
                label={`Closing balance each financial year split into deposits and interest; final ${fmt(tableRows.at(-1)!.closing)}.`}
                labels={tableRows.map((y) => y.label.slice(2))}
                series={(() => {
                  let dep = r.atMaturity?.openingBalance ?? 0;
                  const deps = tableRows.map((y) => (dep += y.deposits));
                  return [
                    { label: "Deposited", color: CHART.charcoal, values: deps },
                    { label: "Interest", color: CHART.orange, values: tableRows.map((y, i) => Math.max(0, y.closing - deps[i])) },
                  ];
                })()}
                stacked
                format={axis}
              />
            </>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Financial-year table</h3>
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([ppfCsv(tableRows)], { type: "text/csv;charset=utf-8" }), "ppf-schedule.csv");
                track("download_clicked", { tool: "ppf-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[560px] text-right text-sm" data-testid="ppf-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Financial year</th>
                  <th scope="col" className="py-2 font-medium">Opening</th>
                  <th scope="col" className="py-2 font-medium">Deposits</th>
                  <th scope="col" className="py-2 font-medium">Interest (31 Mar)</th>
                  <th scope="col" className="py-2 font-medium">Closing</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {tableRows.map((y) => (
                  <tr key={y.fy} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">
                      {y.label}
                      {y.phase === "extension" && <span className="font-sans text-xs text-ink-3"> · extension</span>}
                    </td>
                    <td className="py-2">{fmt(y.opening)}</td>
                    <td className="py-2">{fmt(y.deposits)}</td>
                    <td className="py-2">{fmt2(y.interest)}</td>
                    <td className="py-2">{fmt(y.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <section aria-labelledby="ppf-rules-h" data-testid="ppf-rules" className="grid gap-3 rounded-[16px] border border-line bg-card p-5 sm:p-7">
        <h2 id="ppf-rules-h" className="font-display text-xl font-semibold">PPF rules used</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-2">
          <li>
            Deposits: ₹{PPF_RULES.minDepositPerFY} to ₹{PPF_RULES.maxDepositPerFY.toLocaleString("en-IN")} per financial year (including any minor&rsquo;s account you hold), in multiples of ₹{PPF_RULES.depositMultiple}, in one go or in instalments.
          </li>
          <li>Interest: for each calendar month, on the lowest balance between the close of the {PPF_RULES.interestCutoffDay}th and the end of the month; credited once a year at the end of the financial year (31 March).</li>
          <li>Maturity: on completion of {PPF_RULES.maturityFinancialYears} financial years from the end of the year the account was opened — so an account opened any time in FY 2026-27 matures on 1 April 2042.</li>
          <li>Extension: in blocks of {PPF_RULES.extensionBlockYears} years. To keep depositing, apply in Form-4 within one year of maturity; otherwise the account continues without deposits and keeps earning interest. Withdrawals during an extension with deposits are capped at {PPF_RULES.extensionWithdrawalCap * 100}% of the balance at the start of the block; without deposits, one withdrawal a year is allowed.</li>
          <li>
            Rate: {PPF_RULES.rate.value}% a year for {PPF_RULES.rate.period}, notified quarterly by the Ministry of Finance.
          </li>
        </ul>
        <p className="text-xs text-ink-2">
          Source: {PPF_RULES.scheme}. Last verified {new Date(`${PPF_RULES.lastVerified}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {PPF_RULES.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-orange underline-offset-2">
                {s.label} <ExternalLink aria-hidden className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Formula>
        <p>
          Each month: <code>interest = lowest balance (after the 5th) × rate ÷ 12</code>. A deposit on or before the 5th is part of that month&rsquo;s lowest balance; one after the 5th starts earning the next month.
        </p>
        <p>The twelve monthly amounts are added up and credited on 31 March, so interest compounds once a year. Depositing the full year&rsquo;s amount by 5 April earns interest on it for all twelve months.</p>
        <p>The rate you enter is applied to every future year; in reality it&rsquo;s revised each quarter. Banks may round the yearly interest to the nearest rupee.</p>
      </Formula>
    </div>
  );
}
