"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Download, Info, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, Segmented } from "./ui";
import { GST_PRESETS, calculateGst, formatINR, formatRate, gstSummary, type GstMode, type Supply } from "@/lib/gst";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

function Row({ label, value, strong, muted }: { label: React.ReactNode; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-4 py-2.5", strong && "pt-4")}>
      <dt className={clsx("text-sm", muted ? "text-ivory/55" : "text-ivory/80", strong && "text-base font-medium text-ivory")}>{label}</dt>
      <dd className={clsx("font-mono tabular-nums", strong ? "text-[clamp(1.8rem,1.3rem+2vw,2.6rem)] leading-none" : "text-[1.05rem]")}>{value}</dd>
    </div>
  );
}

export default function GstCalculator() {
  const [mode, setMode] = useState<GstMode>("add");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [supply, setSupply] = useState<Supply>("intra");

  useEffect(() => {
    track("tool_opened", { tool: "gst-calculator" });
  }, []);

  const outcome = useMemo(() => calculateGst(mode, amount, rate, supply), [mode, amount, rate, supply]);
  const r = outcome.status === "ok" ? outcome.result : null;
  const isPreset = (GST_PRESETS as readonly number[]).map(String).includes(rate);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <Segmented
          label="Calculation"
          value={mode}
          onChange={(v) => setMode(v as GstMode)}
          options={[
            { value: "add", label: "Add GST", hint: "price excludes GST" },
            { value: "remove", label: "Remove GST", hint: "price includes GST" },
          ]}
        />

        <div className="mt-6">
          <FieldLabel htmlFor="gst-amount">{mode === "add" ? "Amount before GST" : "Amount including GST"}</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-2xl text-ink-2">₹</span>
            <input
              id="gst-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="10,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-16 w-full rounded-[12px] border border-line-strong bg-card pl-11 pr-4 font-mono text-[1.8rem] tracking-tight outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]"
            />
          </div>
        </div>

        <div className="mt-6">
          <FieldLabel>GST rate</FieldLabel>
          <div role="radiogroup" aria-label="GST rate preset" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GST_PRESETS.map((p) => {
              const active = rate === String(p);
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRate(String(p))}
                  className={clsx(
                    "h-11 rounded-[10px] border font-mono text-[0.95rem] transition-colors",
                    active ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal",
                  )}
                >
                  {p}%
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <label htmlFor="gst-custom" className="shrink-0 text-sm text-ink-2">
              Custom rate
            </label>
            <div className="relative w-32">
              <input
                id="gst-custom"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 3"
                value={isPreset ? "" : rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, "").slice(0, 7))}
                className={clsx(
                  "h-10 w-full rounded-[10px] border bg-card pl-3 pr-8 font-mono outline-none focus:border-charcoal",
                  !isPreset && rate ? "border-charcoal" : "border-line-strong",
                )}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-2">%</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <FieldLabel>Supply type</FieldLabel>
          <Segmented
            label="Supply type"
            size="sm"
            value={supply}
            onChange={(v) => setSupply(v as Supply)}
            options={[
              { value: "intra", label: "Intra-state", hint: "CGST + SGST" },
              { value: "inter", label: "Inter-state", hint: "IGST" },
            ]}
          />
        </div>

        <p className="mt-6 flex gap-2 border-t border-dashed border-line-strong pt-5 text-xs leading-relaxed text-ink-2">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          Rate buttons are shortcuts, not a classification of your goods or services. Rates were restructured from 22 September 2025 — verify the applicable rate and
          tax treatment for your transaction. This is a calculation aid, not tax or legal advice.
        </p>
      </Panel>

      <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8">
        <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
          <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Tax breakdown
        </p>
        {r ? (
          <motion.div key={`${mode}-${supply}`} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="flex flex-1 flex-col">
            <dl className="mt-4 divide-y divide-ivory/10" data-testid="gst-breakdown">
              <Row label={mode === "add" ? "Original amount (taxable value)" : "Taxable value (excl. GST)"} value={formatINR(r.taxable)} />
              {supply === "intra" ? (
                <>
                  <Row label={`CGST @ ${formatRate(r.halfRate)}`} value={formatINR(r.cgst)} muted />
                  <Row label={`SGST @ ${formatRate(r.halfRate)}`} value={formatINR(r.sgst)} muted />
                </>
              ) : (
                <Row label={`IGST @ ${formatRate(r.rate)}`} value={formatINR(r.igst)} muted />
              )}
              <Row label={`Total GST @ ${formatRate(r.rate)}`} value={formatINR(r.tax)} />
              <Row label={mode === "add" ? "Final amount incl. GST" : "Invoice total (incl. GST)"} value={formatINR(r.total)} strong />
            </dl>
            {mode === "remove" && (
              <p className="mt-4 rounded-[10px] bg-ivory/[0.06] px-3.5 py-2.5 font-mono text-[0.78rem] text-ivory/75">
                Taxable = {formatINR(r.total)} × 100 ÷ {100 + r.rate} = {formatINR(r.taxable)}
              </p>
            )}
            {mode === "add" && (
              <p className="mt-4 rounded-[10px] bg-ivory/[0.06] px-3.5 py-2.5 font-mono text-[0.78rem] text-ivory/75">
                GST = {formatINR(r.taxable)} × {formatRate(r.rate)} = {formatINR(r.tax)}
              </p>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <CopyButton text={() => gstSummary(r)} variant="primary" label="Copy calculation" onCopied={() => track("copy_clicked", { tool: "gst-calculator" })} />
              <button
                type="button"
                onClick={() => {
                  downloadBlob(new Blob([gstSummary(r)], { type: "text/plain;charset=utf-8" }), `gst-${mode}-${r.rate}pc.txt`);
                  track("download_clicked", { tool: "gst-calculator", format: "txt" });
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium transition-colors hover:border-ivory/60"
              >
                <Download aria-hidden className="size-4" /> Download summary
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount("");
                  setRate("18");
                  setMode("add");
                  setSupply("intra");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ivory/70 transition-colors hover:text-ivory"
              >
                <RotateCcw aria-hidden className="size-4" /> Reset
              </button>
            </div>
          </motion.div>
        ) : outcome.status === "error" ? (
          <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
            <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" />
            {outcome.message}
          </p>
        ) : (
          <div className="mt-5">
            <p className="font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight text-ivory/20">₹ —</p>
            <p className="mt-4 text-ivory/60">Enter an amount to see the taxable value, CGST and SGST or IGST, and the invoice total.</p>
          </div>
        )}
      </div>
    </div>
  );
}
