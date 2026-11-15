"use client";

/** Shared pieces for the loan and property calculators. */
import { useState } from "react";
import { Download } from "lucide-react";
import { Panel, Segmented } from "./ui";
import { BarChart, CHART, Legend, compactMoney } from "./charts";
import { amortCsv, type AmortResult, addMonths, monthLabel } from "@/lib/loans/amortise";
import { inr } from "@/lib/loans/format";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

export const LOAN_DISCLAIMER = "An estimate for planning, not an offer or financial advice. Lenders set their own rates, fees, rounding and eligibility rules, so your actual figures can differ.";
export const axisInr = compactMoney("en-IN", "INR");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month + year picker for the first EMI date. */
export function MonthYear({ id, label, y, m, onChange }: { id: string; label: string; y: number; m: number; onChange: (y: number, m: number) => void }) {
  const years = Array.from({ length: 41 }, (_, k) => 2000 + k);
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <select id={`${id}-m`} aria-label={`${label} — month`} value={m} onChange={(e) => onChange(y, +e.target.value)} className="h-11 rounded-[10px] border border-line-strong bg-card px-3">
          {MONTHS.map((n, k) => (
            <option key={n} value={k + 1}>
              {n}
            </option>
          ))}
        </select>
        <select id={`${id}-y`} aria-label={`${label} — year`} value={y} onChange={(e) => onChange(+e.target.value, m)} className="h-11 rounded-[10px] border border-line-strong bg-card px-3">
          {years.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

/** Principal-vs-interest bars by year plus a month-wise or year-wise table with CSV. */
export function ScheduleSection({ res, tool, start, title = "Repayment schedule", csvName }: { res: AmortResult; tool: string; start?: { y: number; m: number }; title?: string; csvName: string }) {
  const [view, setView] = useState<"year" | "month">("year");
  const years: { label: string; principal: number; interest: number; prepayment: number; closing: number }[] = [];
  for (const r of res.rows) {
    const k = Math.ceil(r.month / 12) - 1;
    years[k] ??= { label: `Y${k + 1}`, principal: 0, interest: 0, prepayment: 0, closing: 0 };
    years[k].principal += r.principal;
    years[k].interest += r.interest;
    years[k].prepayment += r.prepayment;
    years[k].closing = r.closing;
  }
  const when = (month: number) => (start ? monthLabel(addMonths(start.y, start.m, month - 1)) : String(month));
  return (
    <Panel className="grid gap-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <Legend items={[{ label: "Principal", color: CHART.charcoal }, { label: "Interest", color: CHART.orange }, ...(res.totalPrepaid > 0 ? [{ label: "Prepayment", color: CHART.muted }] : [])]} />
      </div>
      <BarChart
        label={`Principal and interest paid each year; total interest ${inr(res.totalInterest)}.`}
        labels={years.map((y) => y.label)}
        series={[
          { label: "Principal", color: CHART.charcoal, values: years.map((y) => y.principal) },
          { label: "Interest", color: CHART.orange, values: years.map((y) => y.interest) },
          ...(res.totalPrepaid > 0 ? [{ label: "Prepayment", color: CHART.muted, values: years.map((y) => y.prepayment) }] : []),
        ]}
        stacked
        format={axisInr}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Segmented label="Schedule view" size="sm" className="w-56" value={view} onChange={setView} options={[{ value: "year", label: "Yearly" }, { value: "month", label: "Monthly" }]} />
        <button
          type="button"
          onClick={() => {
            downloadBlob(new Blob([amortCsv(res, title)], { type: "text/csv;charset=utf-8" }), csvName);
            track("download_clicked", { tool, format: "csv" });
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
        >
          <Download aria-hidden className="size-4" /> CSV
        </button>
      </div>
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full min-w-[520px] text-right text-sm" data-testid="schedule-table">
          <thead className="sticky top-0 bg-card text-xs text-ink-2">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 text-left font-medium">{view === "year" ? "Year" : "Month"}</th>
              <th scope="col" className="py-2 font-medium">Principal</th>
              <th scope="col" className="py-2 font-medium">Interest</th>
              {res.totalPrepaid > 0 && <th scope="col" className="py-2 font-medium">Prepaid</th>}
              <th scope="col" className="py-2 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {view === "year"
              ? years.map((y, k) => (
                  <tr key={y.label} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{k + 1}</td>
                    <td className="py-1.5">{inr(y.principal)}</td>
                    <td className="py-1.5">{inr(y.interest)}</td>
                    {res.totalPrepaid > 0 && <td className="py-1.5">{inr(y.prepayment)}</td>}
                    <td className="py-1.5">{inr(y.closing)}</td>
                  </tr>
                ))
              : res.rows.map((r) => (
                  <tr key={r.month} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{when(r.month)}</td>
                    <td className="py-1.5">{inr(r.principal)}</td>
                    <td className="py-1.5">{inr(r.interest)}</td>
                    {res.totalPrepaid > 0 && <td className="py-1.5">{inr(r.prepayment)}</td>}
                    <td className="py-1.5">{inr(r.closing)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** "x years y months" from a month count. */
export function ym(months: number) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} year${y === 1 ? "" : "s"}` : "", m ? `${m} month${m === 1 ? "" : "s"}` : ""].filter(Boolean).join(" ") || "0 months";
}
