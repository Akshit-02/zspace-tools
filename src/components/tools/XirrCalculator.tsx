"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, Download, Eraser, Info, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Legend, LineChart, compactMoney } from "./charts";
import { MAX_TXNS, XIRR_SAMPLE, benchmarkGap, parsePasted, xirrFromTxns, type Txn } from "@/lib/xirr";
import { buildCsv } from "@/lib/csv-write";
import { parseNum } from "@/lib/discount";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

let seq = 0;
const uid = () => `t${++seq}`;
const blank = (): Txn => ({ id: uid(), date: "", type: "invest", amount: "", note: "" });
const pct = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)}%`;
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const cell = "h-10 w-full min-w-0 rounded-[8px] border bg-card px-2.5 text-sm outline-none focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]";

export default function XirrCalculator() {
  const [txns, setTxns] = useState<Txn[]>(() => XIRR_SAMPLE.map((t) => ({ ...t, id: uid() })));
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [paste, setPaste] = useState<string | null>(null);
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const [bench, setBench] = useState("");

  useEffect(() => {
    track("tool_opened", { tool: "xirr-calculator" });
  }, []);

  const out = useMemo(() => xirrFromTxns(txns), [txns]);
  const r = out.status === "ok" ? out.result : null;
  const badRows = new Set(out.status === "error" ? out.rows ?? [] : []);
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const axis = useMemo(() => compactMoney(c.locale, currency), [c.locale, currency]);
  const set = (id: string, k: keyof Txn, v: string) => setTxns((l) => l.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const b = parseNum(bench);
  const benchOk = b !== null && !Number.isNaN(b) && b > -100 && b < 1000;
  const gap = r && benchOk ? benchmarkGap(r, b!) : null;

  const rows = (): [string, string][] =>
    r
      ? [
          ["XIRR", pct(r.xirr)],
          ["Total invested", fmt(r.invested)],
          ["Total withdrawn / current value", fmt(r.withdrawn)],
          [r.net >= 0 ? "Net gain" : "Net loss", fmt(r.net)],
          ["Absolute return (not annualised)", pct(r.absolutePct)],
          ["Period", `${fmtDate(r.first)} – ${fmtDate(r.last)} (${r.days} days, ${r.years.toFixed(2)} years)`],
          ["Transactions", String(r.count)],
        ]
      : [];

  const importPaste = () => {
    const p = parsePasted(paste ?? "");
    if (!p.txns.length) return setPasteMsg("No rows could be read. Use one transaction per line: date, amount (negative for money invested), optional description.");
    setTxns(p.txns.map((t) => ({ ...t, id: uid() })));
    setPaste(null);
    setPasteMsg(`Imported ${p.txns.length} ${p.txns.length === 1 ? "transaction" : "transactions"}${p.skipped.length ? ` · skipped line${p.skipped.length === 1 ? "" : "s"} ${p.skipped.slice(0, 8).join(", ")}${p.skipped.length > 8 ? "…" : ""}` : ""}.`);
  };

  // Cumulative money in and out over time, for the chart.
  const series = useMemo(() => {
    if (!r) return null;
    let inv = 0;
    let wd = 0;
    const pts = r.rows.map((x) => {
      if (x.type === "invest") inv += x.amount;
      else wd += x.amount;
      return { label: x.date.slice(0, 7), inv, wd };
    });
    return pts;
  }, [r]);

  const actionBtn = "inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2">
              Choose <strong className="text-charcoal">Invested</strong> for money you put in and <strong className="text-charcoal">Withdrawn</strong> for redemptions or today&rsquo;s value. Amounts are always positive.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-medium">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-9 cursor-pointer rounded-[8px] border border-line-strong bg-card px-2">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="hidden grid-cols-[9.5rem_8rem_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium text-ink-2 md:grid" aria-hidden>
            <span>Date</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Description (optional)</span>
            <span />
          </div>
          <ol className="grid gap-3 md:gap-2" data-testid="xirr-rows">
            {txns.map((t, i) => (
              <li key={t.id} className={clsx("grid grid-cols-2 gap-2 rounded-[12px] border p-2.5 md:grid-cols-[9.5rem_8rem_1fr_1fr_2.5rem] md:border-0 md:p-0", badRows.has(i) ? "border-error/60 bg-[#fbecea] md:bg-transparent" : "border-line")}>
                <input type="date" aria-label={`Row ${i + 1} date`} aria-invalid={badRows.has(i)} className={clsx(cell, "font-mono", badRows.has(i) && !t.date ? "border-error/70" : "border-line-strong")} value={t.date} onChange={(e) => set(t.id, "date", e.target.value)} />
                <select aria-label={`Row ${i + 1} type`} className={clsx(cell, "cursor-pointer border-line-strong")} value={t.type} onChange={(e) => set(t.id, "type", e.target.value)}>
                  <option value="invest">Invested</option>
                  <option value="withdraw">Withdrawn</option>
                </select>
                <input aria-label={`Row ${i + 1} amount`} inputMode="decimal" placeholder="Amount" className={clsx(cell, "font-mono", badRows.has(i) ? "border-error/70" : "border-line-strong")} value={t.amount} onChange={(e) => set(t.id, "amount", e.target.value)} />
                <input aria-label={`Row ${i + 1} description`} placeholder="e.g. SIP, top-up" maxLength={60} className={clsx(cell, "border-line-strong")} value={t.note} onChange={(e) => set(t.id, "note", e.target.value)} />
                <button type="button" aria-label={`Remove row ${i + 1}`} onClick={() => setTxns((l) => l.filter((x) => x.id !== t.id))} className="col-span-2 grid h-10 place-items-center justify-self-end rounded-[8px] px-2 text-ink-2 hover:bg-ivory-2 hover:text-error md:col-span-1 md:w-10">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={actionBtn} disabled={txns.length >= MAX_TXNS} onClick={() => setTxns((l) => [...l, blank()])}>
              <Plus aria-hidden className="size-4" /> Add transaction
            </button>
            <button type="button" className={actionBtn} onClick={() => (setPaste(""), setPasteMsg(null))}>
              <ClipboardPaste aria-hidden className="size-4" /> Paste from spreadsheet
            </button>
            <button type="button" className={actionBtn} onClick={() => (setTxns(XIRR_SAMPLE.map((t) => ({ ...t, id: uid() }))), setPasteMsg(null))}>
              <Sparkles aria-hidden className="size-4" /> Sample
            </button>
            <button type="button" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal" onClick={() => (setTxns([blank(), blank()]), setPasteMsg(null))}>
              <Eraser aria-hidden className="size-4" /> Clear all
            </button>
          </div>
          {paste !== null && (
            <div className="grid gap-2 rounded-[12px] border border-line bg-ivory p-3">
              <label htmlFor="xirr-paste" className="text-sm font-medium">
                Paste rows: date, amount, description — negative amounts are investments (as in Excel&rsquo;s XIRR)
              </label>
              <textarea id="xirr-paste" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"05/04/2021\t-50000\tLumpsum\n15/11/2026\t142500\tCurrent value"} className="w-full rounded-[10px] border border-line-strong bg-card p-3 font-mono text-sm outline-none focus:border-charcoal" />
              <p className="text-xs text-ink-2">Dates like 2021-04-05, 05/04/2021 (day first) or 05-Apr-2021. Tabs, commas or semicolons between columns. This replaces the current rows.</p>
              <div className="flex gap-2">
                <button type="button" onClick={importPaste} className="inline-flex h-9 items-center rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]">
                  Import rows
                </button>
                <button type="button" onClick={() => setPaste(null)} className="h-9 rounded-[10px] px-3 text-sm text-ink-2 hover:text-charcoal">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {pasteMsg && (
            <p role="status" className="text-sm text-ink-2" data-testid="xirr-paste-msg">
              {pasteMsg}
            </p>
          )}
        </Panel>

        <ResultCard eyebrow="XIRR — annualised return" state={out.status} error={out.status === "error" ? out.message : undefined} empty="Add at least one investment and one withdrawal or current value." onReset={() => setTxns(XIRR_SAMPLE.map((t) => ({ ...t, id: uid() })))} footer="Based only on the dates and amounts entered. Past returns don't predict future returns. Not financial advice.">
          {r && (
            <>
              <p className="mt-3 font-mono text-[clamp(2.6rem,1.9rem+3vw,3.8rem)] leading-none tracking-tight" data-testid="xirr-value">
                {pct(r.xirr)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                a year, over {r.years.toFixed(2)} years from {fmtDate(r.first)} to {fmtDate(r.last)}
              </p>
              <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Total invested" value={fmt(r.invested)} testId="xirr-invested" />
                <Figure label="Withdrawn / current value" value={fmt(r.withdrawn)} testId="xirr-withdrawn" />
                <Figure label={r.net >= 0 ? "Net gain" : "Net loss"} value={fmt(r.net)} strong testId="xirr-net" />
                <Figure label="Absolute return (not annualised)" value={pct(r.absolutePct)} />
                <Figure label="Transactions" value={String(r.count)} />
              </dl>
              <div className="mt-5 grid gap-2 rounded-[12px] bg-ivory/[0.06] p-4">
                <NumberField id="xirr-bench" label={<span className="text-ivory">Compare with a benchmark (optional)</span>} suffix="% a year" value={bench} onChange={setBench} placeholder="e.g. 7" error={bench && !benchOk ? "Enter a rate above −100%." : null} />
                {gap !== null && (
                  <p className="text-sm text-ivory/80" data-testid="xirr-bench-result">
                    {pct(r.xirr - b!)} points {r.xirr >= b! ? "above" : "below"} {b}% — the same cash flows at {b}% a year would leave you {fmt(Math.abs(gap))} {gap >= 0 ? "worse off" : "better off"} as of {fmtDate(r.last)}. Illustrative only: the benchmark may carry very different risk.
                  </p>
                )}
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
                <CopyButton text={() => ["XIRR — ZSpace Tools", ...rows().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "xirr-calculator" })} />
                <DarkButton onClick={() => printSummary("XIRR calculation", rows(), ["Annualised using actual days ÷ 365 (Excel XIRR convention)."])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {r && series && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Money in and out over time</h2>
            <Legend items={[{ label: "Total invested", color: CHART.charcoal }, { label: "Total withdrawn / value", color: CHART.orange }]} />
          </div>
          <LineChart
            label={`Cumulative investments reach ${fmt(r.invested)} and withdrawals ${fmt(r.withdrawn)} by ${fmtDate(r.last)}.`}
            labels={series.map((p) => p.label)}
            format={axis}
            series={[
              { label: "Invested", color: CHART.charcoal, values: series.map((p) => p.inv) },
              { label: "Withdrawn", color: CHART.orange, values: series.map((p) => p.wd) },
            ]}
          />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <h3 className="font-bold">Transactions in date order</h3>
            <button
              type="button"
              onClick={() => {
                const rowsCsv = [["Date", "Type", "Cash flow", "Years from first date", "Description"], ...r.rows.map((x) => [x.date, x.type === "invest" ? "Invested" : "Withdrawn", (x.type === "invest" ? -x.amount : x.amount).toFixed(2), x.t.toFixed(6), x.note])];
                rowsCsv.push(["", "", "", "", ""], ["XIRR", pct(r.xirr), "", "", ""]);
                downloadBlob(new Blob([buildCsv(rowsCsv)], { type: "text/csv;charset=utf-8" }), "xirr-transactions.csv");
                track("download_clicked", { tool: "xirr-calculator", format: "csv" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
            >
              <Download aria-hidden className="size-4" /> CSV
            </button>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[520px] text-right text-sm" data-testid="xirr-table">
              <thead className="sticky top-0 bg-card text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Date</th>
                  <th scope="col" className="py-2 text-left font-medium">Type</th>
                  <th scope="col" className="py-2 font-medium">Cash flow</th>
                  <th scope="col" className="py-2 font-medium">Years from start</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {r.rows.map((x, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-2 text-left">{fmtDate(x.date)}</td>
                    <td className="py-2 text-left font-sans">
                      {x.type === "invest" ? "Invested" : "Withdrawn"}
                      {x.note && <span className="text-ink-3"> · {x.note}</span>}
                    </td>
                    <td className="py-2">{x.type === "invest" ? `−${fmt(x.amount)}` : `+${fmt(x.amount)}`}</td>
                    <td className="py-2">{x.t.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Formula>
        <p>
          XIRR is the annual rate <code>r</code> for which <code>Σ CFᵢ ÷ (1 + r)^((dᵢ − d₀) ÷ 365) = 0</code>, where <code>CFᵢ</code> is each cash flow (investments negative, withdrawals and current value positive), <code>dᵢ</code> its date and <code>d₀</code> the first date. Days are actual calendar days divided by 365, as in Excel&rsquo;s XIRR.
        </p>
        <p>The calculator scans the whole range of possible rates for every point where the sum changes sign, then narrows each down by bisection to a 0.0000000001 tolerance — no starting guess, no risk of diverging. If no rate balances the cash flows, or more than one does, it says so instead of returning a number.</p>
        <p>Enter today&rsquo;s value of an investment you still hold as a withdrawal on today&rsquo;s date.</p>
      </Formula>
    </div>
  );
}
