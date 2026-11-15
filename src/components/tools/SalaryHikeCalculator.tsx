"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, inr, parseForm, pct, type FieldSpec } from "./india-ui";
import { applyHike, hikePct, realHike } from "@/lib/india/salary";
import { track } from "@/lib/analytics";

type Mode = "percent" | "amount";
type Period = "year" | "month";
type K = "current" | "next" | "hike" | "inflation";
const DEFAULT: Record<K, string> = { current: "1000000", next: "1150000", hike: "10", inflation: "" };
const SPECS: Record<K, FieldSpec> = {
  current: { label: "Current salary", min: 0, max: 1e11 },
  next: { label: "New salary", min: 0, max: 1e11 },
  hike: { label: "Hike", min: -100, max: 1000 },
  inflation: { label: "Inflation", min: 0, max: 50, optional: true },
};
const pick = (keys: K[]) => Object.fromEntries(keys.map((k) => [k, SPECS[k]])) as Record<K, FieldSpec>;

export default function SalaryHikeCalculator() {
  const [mode, setMode] = useState<Mode>("amount");
  const [period, setPeriod] = useState<Period>("year");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "salary-hike-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, pick(mode === "amount" ? ["current", "next", "inflation"] : ["current", "hike", "inflation"])), [f, mode]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    if (v.current <= 0) return { error: "Current salary must be more than zero.", field: "current" as K };
    const next = mode === "amount" ? v.next : applyHike(v.current, v.hike);
    const pctHike = mode === "amount" ? hikePct(v.current, v.next) : v.hike;
    const k = period === "year" ? 1 : 12;
    return { current: v.current, next, pctHike, diff: next - v.current, yearly: (next - v.current) * k, monthly: ((next - v.current) * k) / 12, real: v.inflation > 0 ? realHike(pctHike, v.inflation) : null, inflation: v.inflation };
  }, [parsed, mode, period]);
  const r = res && !("error" in res) ? res : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : res && "error" in res && res.field === k ? res.error : null);
  const unit = period === "year" ? "a year" : "a month";

  const summary = (): [string, string][] =>
    r
      ? [
          ["Current salary", `${inr(r.current)} ${unit}`],
          ["New salary", `${inr(r.next)} ${unit}`],
          ["Hike", pct(r.pctHike)],
          ["Increase", `${inr(r.yearly)} a year (${inr(r.monthly)} a month)`],
          ...(r.real !== null ? ([["Real hike after inflation", pct(r.real)]] as [string, string][]) : []),
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="What do you know?" value={mode} onChange={setMode} options={[{ value: "amount", label: "Old and new salary", hint: "find the hike %" }, { value: "percent", label: "Salary and hike %", hint: "find the new salary" }]} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Salary entered per</p>
            <Segmented label="Salary period" size="sm" className="w-56" value={period} onChange={setPeriod} options={[{ value: "year", label: "Year" }, { value: "month", label: "Month" }]} />
          </div>
          <NumberField id="hike-current" label={`Current salary (${unit})`} prefix="₹" value={f.current} onChange={(v) => set("current", v)} error={err("current")} size="lg" />
          {mode === "amount" ? (
            <NumberField id="hike-next" label={`New salary (${unit})`} prefix="₹" value={f.next} onChange={(v) => set("next", v)} error={err("next")} size="lg" />
          ) : (
            <NumberField id="hike-pct" label="Hike" suffix="%" value={f.hike} onChange={(v) => set("hike", v)} error={err("hike")} />
          )}
          <NumberField id="hike-infl" label="Inflation (optional)" suffix="% a year" value={f.inflation} onChange={(v) => set("inflation", v)} error={err("inflation")} hint="To see the hike in real terms." />
          <p className="text-sm text-ink-2">
            Compare like with like: CTC with CTC, or fixed pay with fixed pay. For what actually reaches your account, use the <Link className="underline" href="/take-home-salary-calculator/">Take-Home Salary Calculator</Link>.
          </p>
        </Panel>

        <ResultCard eyebrow={mode === "amount" ? "Your hike" : "Your new salary"} state={state} error={errorMsg} empty="Enter your current salary." onReset={() => setF(DEFAULT)} footer="A simple percentage calculation. Tax, PF and other deductions change in-hand pay by a different amount.">
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="hike-main">
                {mode === "amount" ? pct(r.pctHike) : inr(r.next)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">{mode === "amount" ? `from ${inr(r.current)} to ${inr(r.next)} ${unit}` : `${pct(r.pctHike)} on ${inr(r.current)} ${unit}`}</p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Increase a year" value={inr(r.yearly)} testId="hike-year" />
                <Figure label="Increase a month" value={inr(r.monthly)} testId="hike-month" />
                {r.real !== null && <Figure label={`Real hike at ${r.inflation}% inflation`} value={pct(r.real)} strong testId="hike-real" />}
              </dl>
              <DarkNotes notes={[...(r.real !== null && r.real < 0 ? ["The hike is below inflation, so your pay buys less than before."] : []), ...(r.pctHike < 0 ? ["This is a pay cut."] : [])]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Salary hike — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "salary-hike-calculator" })} />
                <DarkButton onClick={() => printSummary("Salary hike", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <Formula>
        <p>
          Hike % = (new − current) ÷ current × 100. New salary = current × (1 + hike ÷ 100). Real hike = (1 + hike) ÷ (1 + inflation) − 1 — for example, a 10% hike with 6% inflation is a 3.77% rise in what your pay can buy.
        </p>
      </Formula>
    </div>
  );
}
