"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Download, Printer, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, Range, Segmented, Toggle } from "./ui";
import { CURRENCIES, LOAN_TYPES, buildSchedule, money, scheduleCsv, validateLoan, yearly, type CurrencyCode, type Prepayment } from "@/lib/emi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

type Tab = "schedule" | "yearly" | "prepay" | "compare";
const num = (s: string) => {
  const v = Number(s.replace(/[,\s_]/g, ""));
  return s.trim() === "" ? NaN : v;
};

function Field({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-lg text-ink-2">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, "").slice(0, 18))}
          className={clsx(
            "h-14 w-full rounded-[12px] border border-line-strong bg-card font-mono text-[1.4rem] tracking-tight outline-none transition-[border-color,box-shadow] focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]",
            prefix ? "pl-11" : "pl-4",
            suffix ? "pr-14" : "pr-4",
          )}
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-2">{suffix}</span>}
      </div>
    </div>
  );
}

function symbolFor(code: CurrencyCode) {
  const c = CURRENCIES.find((x) => x.code === code)!;
  return new Intl.NumberFormat(c.locale, { style: "currency", currency: code }).formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
}

export default function LoanEmiCalculator() {
  const id = useId();
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("10");
  const [tenure, setTenure] = useState("20");
  const [unit, setUnit] = useState<"years" | "months">("years");
  const [fee, setFee] = useState("");
  const [feeType, setFeeType] = useState<"pct" | "flat">("pct");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [tab, setTab] = useState<Tab>("schedule");
  const [pre, setPre] = useState({ monthly: "", from: "1", lump: "", lumpMonth: "12" });
  const [applyPre, setApplyPre] = useState(true);
  const [b, setB] = useState({ amount: "", rate: "", tenure: "" });

  useEffect(() => {
    track("tool_opened", { tool: "emi-calculator" });
  }, []);

  const fmt = useMemo(() => money(currency), [currency]);
  const fmt0 = useMemo(() => money(currency, 0), [currency]);
  const months = unit === "years" ? Math.round(num(tenure) * 12) : num(tenure);
  const P = num(amount);
  const R = num(rate === "" ? "0" : rate);
  const error = validateLoan(P, R, months);

  const base = useMemo(() => (error ? null : buildSchedule({ principal: P, annualRate: R, months })), [error, P, R, months]);
  const prepay: Prepayment = { monthly: num(pre.monthly) || 0, monthlyFrom: Math.max(1, num(pre.from) || 1), lump: num(pre.lump) || 0, lumpMonth: Math.max(1, num(pre.lumpMonth) || 1) };
  const hasPre = prepay.monthly > 0 || prepay.lump > 0;
  const withPre = useMemo(() => (error || !hasPre ? null : buildSchedule({ principal: P, annualRate: R, months }, prepay)), [error, hasPre, P, R, months, prepay.monthly, prepay.monthlyFrom, prepay.lump, prepay.lumpMonth]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = applyPre && withPre ? withPre : base;
  const years = useMemo(() => (shown ? yearly(shown.rows) : []), [shown]);

  const feeAmt = !fee ? 0 : feeType === "pct" ? Math.round(P * (num(fee) || 0)) / 100 : num(fee) || 0;
  const feeInvalid = fee !== "" && (!Number.isFinite(num(fee)) || num(fee) < 0 || (feeType === "pct" && num(fee) > 100));

  // Scenario B (comparison) defaults to A's values.
  const bP = b.amount ? num(b.amount) : P;
  const bR = b.rate ? num(b.rate) : R;
  const bM = b.tenure ? (unit === "years" ? Math.round(num(b.tenure) * 12) : num(b.tenure)) : months;
  const bError = validateLoan(bP, bR, bM);
  const bSched = useMemo(() => (bError ? null : buildSchedule({ principal: bP, annualRate: bR, months: bM })), [bError, bP, bR, bM]);

  const summaryText = base
    ? [
        "EMI estimate — ZSpace Tools",
        `Loan amount: ${fmt(P)}`,
        `Interest rate: ${R}% a year (reducing balance, monthly)`,
        `Tenure: ${months} months`,
        `Monthly EMI: ${fmt(base.emi)}`,
        `Total interest: ${fmt(base.totalInterest)}`,
        `Total repayment: ${fmt(base.totalPaid)}`,
        ...(feeAmt ? [`Processing fee: ${fmt(feeAmt)}`, `Total cost of loan (interest + fee): ${fmt(base.totalInterest + feeAmt)}`] : []),
        ...(withPre ? [`With prepayments: ${withPre.months} months, interest ${fmt(withPre.totalInterest)} (saves ${fmt(base.totalInterest - withPre.totalInterest)})`] : []),
        "Estimate only — actual lender schedules can differ.",
      ].join("\n")
    : "";

  const print = () => {
    document.body.dataset.print = "emi";
    const done = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1000);
  };

  const interestShare = base ? base.totalInterest / (base.totalInterest + P) : 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <Panel className="p-5 sm:p-7">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Loan type examples">
            {LOAN_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setAmount(String(t.amount));
                  setTenure(String(t.years));
                  setUnit("years");
                }}
                className="rounded-full border border-line-strong bg-card px-3 py-1.5 text-sm transition-colors hover:border-charcoal"
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-2">Examples fill in a typical amount and tenure only. Enter the rate from your own loan offer.</p>

          <div className="mt-6 grid gap-5">
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <Field id={`${id}-p`} label="Loan amount" value={amount} onChange={setAmount} prefix={symbolFor(currency)} />
              <div>
                <label htmlFor={`${id}-cur`} className="sr-only">
                  Currency
                </label>
                <select
                  id={`${id}-cur`}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="h-14 cursor-pointer rounded-[12px] border border-line-strong bg-card px-3 text-sm outline-none focus:border-charcoal"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Field id={`${id}-r`} label="Interest rate (per year)" value={rate} onChange={setRate} suffix="%" />
              <div className="mt-2">
                <Range label="Interest rate slider" min={0} max={30} step={0.05} value={Math.min(30, Number.isFinite(R) ? R : 0)} onChange={(v) => setRate(String(Math.round(v * 100) / 100))} />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <Field id={`${id}-n`} label="Loan tenure" value={tenure} onChange={setTenure} hint={Number.isFinite(months) && months > 0 ? `${months} months` : undefined} />
              <Segmented
                label="Tenure unit"
                size="sm"
                className="h-14 w-[136px] sm:w-[170px]"
                value={unit}
                onChange={(v) => {
                  const m = months;
                  setUnit(v as "years" | "months");
                  if (Number.isFinite(m) && m > 0) setTenure(v === "months" ? String(m) : String(Math.round((m / 12) * 100) / 100));
                }}
                options={[
                  { value: "years", label: "Years" },
                  { value: "months", label: "Months" },
                ]}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <Field id={`${id}-fee`} label="Processing fee (optional)" value={fee} onChange={setFee} suffix={feeType === "pct" ? "%" : symbolFor(currency)} />
              <Segmented
                label="Fee type"
                size="sm"
                className="h-14 w-[136px] sm:w-[170px]"
                value={feeType}
                onChange={(v) => setFeeType(v as "pct" | "flat")}
                options={[
                  { value: "pct", label: "Percent" },
                  { value: "flat", label: "Amount" },
                ]}
              />
            </div>
            {feeInvalid && <p className="text-xs text-error">Enter a fee of 0 or more{feeType === "pct" ? " (up to 100%)" : ""}.</p>}
          </div>
        </Panel>

        {/* Results (also the printable summary) */}
        <div aria-live="polite" className="print-area flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8">
          <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
            <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Monthly EMI
          </p>
          {error || !base ? (
            <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
              <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {error}
            </p>
          ) : (
            <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
              <p className="mt-3 break-all font-mono text-[clamp(2.4rem,1.6rem+3.2vw,3.8rem)] leading-none tracking-tight" data-testid="emi-value">
                {fmt(base.emi)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">
                for {months} months at {R}% a year
              </p>
              <div className="mt-6 flex items-center gap-5">
                <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`Principal ${Math.round((1 - interestShare) * 100)}%, interest ${Math.round(interestShare * 100)}% of total repayment`} data-testid="emi-donut">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(250,247,242,0.9)" strokeWidth="16" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#F07845"
                    strokeWidth="16"
                    strokeDasharray={2 * Math.PI * 40}
                    initial={false}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - interestShare) }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="flex items-center gap-2 text-ivory/60">
                      <span className="inline-block size-2.5 rounded-sm bg-ivory" /> Principal
                    </dt>
                    <dd className="font-mono">
                      {fmt(P)} <span className="text-ivory/50">· {Math.round((1 - interestShare) * 100)}%</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-ivory/60">
                      <span className="inline-block size-2.5 rounded-sm bg-orange" /> Interest
                    </dt>
                    <dd className="font-mono text-orange">
                      {fmt(base.totalInterest)} <span className="text-ivory/50">· {Math.round(interestShare * 100)}%</span>
                    </dd>
                  </div>
                </dl>
              </div>
              <dl className="mt-5 divide-y divide-ivory/10" data-testid="emi-totals">
                {[
                  ["Principal amount", fmt(P)],
                  ["Total interest", fmt(base.totalInterest)],
                  ["Total repayment", fmt(base.totalPaid)],
                  ["Annual interest rate", `${R}%`],
                  ["Loan tenure", months % 12 === 0 ? `${months / 12} ${months === 12 ? "year" : "years"} (${months} months)` : `${months} months`],
                  ...(feeAmt > 0 && !feeInvalid
                    ? [
                        ["Processing fee (upfront)", fmt(feeAmt)],
                        ["Total cost (interest + fee)", fmt(base.totalInterest + feeAmt)],
                      ]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-sm text-ivory/70">{k}</dt>
                    <dd className="font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
              {withPre && (
                <p className="mt-3 rounded-[10px] bg-orange/15 px-3.5 py-2.5 text-sm text-ivory">
                  With prepayments: paid off in <span className="font-mono">{withPre.months}</span> months, saving <span className="font-mono">{fmt(base.totalInterest - withPre.totalInterest)}</span> in interest.
                </p>
              )}
              <p className="mt-4 text-xs leading-relaxed text-ivory/50">
                Estimate only, not a lender offer. Actual schedules can differ because of fees, payment dates, rounding, rate changes and lender-specific rules.
              </p>
              <div className="print-hide mt-auto flex flex-wrap gap-2 pt-5">
                <CopyButton text={() => summaryText} variant="primary" label="Copy summary" onCopied={() => track("copy_clicked", { tool: "emi-calculator" })} />
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(new Blob([scheduleCsv(shown!, currency)], { type: "text/csv;charset=utf-8" }), `emi-schedule-${months}m.csv`);
                    track("download_clicked", { tool: "emi-calculator", format: "csv" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60"
                >
                  <Download aria-hidden className="size-4" /> Schedule CSV
                </button>
                <button type="button" onClick={print} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                  <Printer aria-hidden className="size-4" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAmount("1000000");
                    setRate("10");
                    setTenure("20");
                    setUnit("years");
                    setFee("");
                    setPre({ monthly: "", from: "1", lump: "", lumpMonth: "12" });
                    setB({ amount: "", rate: "", tenure: "" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ivory/70 hover:text-ivory"
                >
                  <RotateCcw aria-hidden className="size-4" /> Reset
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {base && shown && (
        <Panel className="overflow-hidden">
          <div role="tablist" aria-label="Loan details" className="flex gap-1 overflow-x-auto border-b border-line bg-ivory p-1.5 [scrollbar-width:none]">
            {(
              [
                ["schedule", "Amortization schedule"],
                ["yearly", "Year-wise summary"],
                ["prepay", "Prepayment"],
                ["compare", "Compare loans"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={clsx(
                  "relative shrink-0 whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[0.9rem] font-medium transition-colors",
                  tab === k ? "border border-line-strong bg-card text-charcoal shadow-[0_1px_2px_rgba(37,37,37,0.08)]" : "text-ink-2 hover:text-charcoal",
                )}
              >
                {label}
                {k === "prepay" && hasPre && <span className="ml-1.5 inline-block size-1.5 rounded-full bg-orange align-middle" />}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {tab === "schedule" && (
              <>
                {withPre && (
                  <div className="mb-3">
                    <Toggle checked={applyPre} onChange={setApplyPre} label="Include prepayments in the schedule" description={applyPre ? `${withPre.months} instalments` : `${base.months} instalments`} />
                  </div>
                )}
                <div className="max-h-[480px] overflow-auto rounded-[12px] border border-line">
                  <table className="w-full min-w-[640px] border-collapse text-right font-mono text-[0.8rem]" data-testid="emi-schedule">
                    <thead className="sticky top-0 bg-ivory font-sans text-xs text-ink-2">
                      <tr>
                        {["Month", "Opening", "EMI", "Principal", "Interest", ...(shown.totalPrepaid ? ["Prepaid"] : []), "Closing"].map((h) => (
                          <th key={h} className="border-b border-line px-3 py-2 font-medium first:text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shown.rows.map((r) => (
                        <tr key={r.month} className="border-b border-line last:border-0 even:bg-ivory/40">
                          <td className="px-3 py-1.5 text-left text-ink-2">{r.month}</td>
                          <td className="px-3 py-1.5">{fmt(r.opening)}</td>
                          <td className="px-3 py-1.5">{fmt(r.emi)}</td>
                          <td className="px-3 py-1.5">{fmt(r.principal)}</td>
                          <td className="px-3 py-1.5 text-orange-ink">{fmt(r.interest)}</td>
                          {shown.totalPrepaid > 0 && <td className="px-3 py-1.5">{r.prepayment ? fmt(r.prepayment) : "—"}</td>}
                          <td className="px-3 py-1.5">{fmt(r.closing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "yearly" && (
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="max-h-[480px] overflow-auto rounded-[12px] border border-line">
                  <table className="w-full min-w-[480px] border-collapse text-right font-mono text-[0.82rem]" data-testid="emi-yearly">
                    <thead className="sticky top-0 bg-ivory font-sans text-xs text-ink-2">
                      <tr>
                        {["Year", "Principal paid", "Interest paid", "Balance at year end"].map((h) => (
                          <th key={h} className="border-b border-line px-3 py-2 font-medium first:text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {years.map((y) => (
                        <tr key={y.year} className="border-b border-line last:border-0">
                          <td className="px-3 py-1.5 text-left text-ink-2">{y.year}</td>
                          <td className="px-3 py-1.5">{fmt0(y.principal + y.prepayment)}</td>
                          <td className="px-3 py-1.5 text-orange-ink">{fmt0(y.interest)}</td>
                          <td className="px-3 py-1.5">{fmt0(y.closing)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <figure aria-label="Principal and interest paid each year" className="rounded-[12px] border border-line bg-ivory/50 p-4">
                  <figcaption className="mb-3 flex gap-4 text-xs text-ink-2">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-sm bg-charcoal" /> Principal
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-sm bg-orange" /> Interest
                    </span>
                  </figcaption>
                  <div className="flex h-48 items-end gap-[2px]">
                    {(() => {
                      const max = Math.max(...years.map((y) => y.principal + y.prepayment + y.interest), 1);
                      return years.map((y) => (
                        <div key={y.year} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`Year ${y.year}`}>
                          <div className="bg-orange" style={{ height: `${(y.interest / max) * 100}%` }} />
                          <div className="bg-charcoal" style={{ height: `${((y.principal + y.prepayment) / max) * 100}%` }} />
                        </div>
                      ));
                    })()}
                  </div>
                  <p className="mt-2 flex justify-between font-mono text-[0.7rem] text-ink-3">
                    <span>Year 1</span>
                    <span>Year {years.length}</span>
                  </p>
                </figure>
              </div>
            )}

            {tab === "prepay" && (
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="grid content-start gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field id={`${id}-pm`} label="Extra every month" value={pre.monthly} onChange={(v) => setPre((p) => ({ ...p, monthly: v }))} prefix={symbolFor(currency)} />
                    <Field id={`${id}-pf`} label="Starting month" value={pre.from} onChange={(v) => setPre((p) => ({ ...p, from: v }))} />
                    <Field id={`${id}-pl`} label="One-time lump sum" value={pre.lump} onChange={(v) => setPre((p) => ({ ...p, lump: v }))} prefix={symbolFor(currency)} />
                    <Field id={`${id}-plm`} label="Paid in month" value={pre.lumpMonth} onChange={(v) => setPre((p) => ({ ...p, lumpMonth: v }))} />
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">
                    Assumption: your EMI stays the same and the loan finishes sooner. Prepayments are applied right after that month&rsquo;s EMI. Some lenders charge prepayment fees or reduce the EMI instead — check your loan terms.
                  </p>
                </div>
                <div className="rounded-[14px] border border-line bg-ivory/50 p-5" data-testid="emi-prepay">
                  {withPre ? (
                    <dl className="grid grid-cols-2 gap-3">
                      {[
                        ["New tenure", `${withPre.months} months`],
                        ["Months saved", `${base.months - withPre.months}`],
                        ["Interest without", fmt(base.totalInterest)],
                        ["Interest with", fmt(withPre.totalInterest)],
                        ["Interest saved", fmt(base.totalInterest - withPre.totalInterest)],
                        ["Total prepaid", fmt(withPre.totalPrepaid)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-[10px] bg-card px-3 py-2.5">
                          <dt className="text-xs text-ink-2">{k}</dt>
                          <dd className={clsx("mt-0.5 font-mono text-[0.95rem]", k === "Interest saved" && "text-success")}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-ink-2">Enter a monthly extra payment or a one-time lump sum to see how much sooner you could be debt-free.</p>
                  )}
                </div>
              </div>
            )}

            {tab === "compare" && (
              <div className="grid gap-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field id={`${id}-ba`} label="Loan B amount" value={b.amount} onChange={(v) => setB((x) => ({ ...x, amount: v }))} prefix={symbolFor(currency)} hint="blank = same as A" />
                  <Field id={`${id}-br`} label="Loan B rate" value={b.rate} onChange={(v) => setB((x) => ({ ...x, rate: v }))} suffix="%" />
                  <Field id={`${id}-bn`} label={`Loan B tenure (${unit})`} value={b.tenure} onChange={(v) => setB((x) => ({ ...x, tenure: v }))} />
                </div>
                {bError ? (
                  <p className="text-sm text-error">Loan B: {bError}</p>
                ) : bSched ? (
                  <div className="overflow-x-auto rounded-[12px] border border-line">
                    <table className="w-full min-w-[520px] border-collapse text-sm" data-testid="emi-compare">
                      <thead className="bg-ivory text-xs text-ink-2">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium" />
                          <th className="px-4 py-2 text-right font-medium">Loan A</th>
                          <th className="px-4 py-2 text-right font-medium">Loan B</th>
                          <th className="px-4 py-2 text-right font-medium">Difference (B − A)</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {(
                          [
                            ["Loan amount", P, bP, true],
                            ["Interest rate", R, bR, false],
                            ["Tenure (months)", months, bM, false],
                            ["Monthly EMI", base.emi, bSched.emi, true],
                            ["Total interest", base.totalInterest, bSched.totalInterest, true],
                            ["Total repayment", base.totalPaid, bSched.totalPaid, true],
                          ] as const
                        ).map(([k, va, vb, isMoney]) => {
                          const d = vb - va;
                          const f = (v: number) => (isMoney ? fmt(v) : k === "Interest rate" ? `${v}%` : String(v));
                          return (
                            <tr key={k} className="border-t border-line">
                              <td className="px-4 py-2 font-sans text-ink-2">{k}</td>
                              <td className="px-4 py-2 text-right">{f(va)}</td>
                              <td className="px-4 py-2 text-right">{f(vb)}</td>
                              <td className={clsx("px-4 py-2 text-right", d > 0.005 ? "text-error" : d < -0.005 ? "text-success" : "text-ink-2")}>
                                {Math.abs(d) < 0.005 ? "—" : `${d > 0 ? "+" : "−"}${isMoney ? fmt(Math.abs(d)) : k === "Interest rate" ? `${Math.round(Math.abs(d) * 100) / 100}%` : Math.abs(d)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
