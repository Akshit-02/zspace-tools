"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Plus, Printer, TrendingDown, TrendingUp, Minus, X } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { CHART, Donut } from "./charts";
import { ROI_EXAMPLES, roiFromForm, type RoiForm, type RoiResult } from "@/lib/roi";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { track } from "@/lib/analytics";

const blank = (n: number): RoiForm => ({ label: `Project ${n}`, cost: "", value: "", entry: "received", expenses: "", years: "", months: "", singleFlow: true });
const DEFAULT: RoiForm = { label: "Project 1", cost: "200000", value: "270000", entry: "received", expenses: "", years: "", months: "", singleFlow: true };
const pct = (n: number) => `${n >= 0 ? "" : "−"}${Math.abs(n).toFixed(2)}%`;

function StatusBadge({ s }: { s: RoiResult["status"] }) {
  const Icon = s === "profit" ? TrendingUp : s === "loss" ? TrendingDown : Minus;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", s === "profit" ? "bg-[#e9f3ed] text-[#245c3d]" : s === "loss" ? "bg-[#fbecea] text-[#8f2f27]" : "bg-ivory-2 text-charcoal")} data-testid="roi-status">
      <Icon aria-hidden className="size-3.5" /> {s === "profit" ? "Profit" : s === "loss" ? "Loss" : "Break-even"}
    </span>
  );
}

export default function RoiCalculator() {
  const [projects, setProjects] = useState<RoiForm[]>([DEFAULT]);
  const [active, setActive] = useState(0);
  const [example, setExample] = useState<string | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const f = projects[active];
  const set = <K extends keyof RoiForm>(k: K, v: RoiForm[K]) => setProjects((l) => l.map((p, i) => (i === active ? { ...p, [k]: v } : p)));

  useEffect(() => {
    track("tool_opened", { tool: "roi-calculator" });
  }, []);

  const outs = useMemo(() => projects.map(roiFromForm), [projects]);
  const out = outs[active];
  const r = out.status === "ok" ? out.result : null;
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const sym = c.label.split(" ")[0];
  const ok = outs.map((o) => (o.status === "ok" ? o.result : null));
  const best = projects.length > 1 ? ok.reduce<number | null>((b, x, i) => (x && (b === null || x.roi > ok[b]!.roi) ? i : b), null) : null;
  const ex = ROI_EXAMPLES.find((e) => e.id === example);

  const rows = (x: RoiResult): [string, string][] => [
    ["Total cost", fmt(x.totalCost)],
    ["Amount received / final value", fmt(x.received)],
    [x.gain >= 0 ? "Net gain" : "Net loss", fmt(x.gain)],
    ["ROI", pct(x.roi)],
    ...(x.years !== null ? ([["Duration", `${+x.years.toFixed(4)} years`]] as [string, string][]) : []),
    ...(x.annualised !== null ? ([["Annualised ROI", pct(x.annualised)]] as [string, string][]) : []),
  ];

  return (
    <div className="grid gap-4">
      <Panel className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <span className="mr-1 text-sm font-medium">Try an example:</span>
        {ROI_EXAMPLES.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => {
              setProjects((l) => l.map((p, i) => (i === active ? { ...blank(i + 1), ...e.form, singleFlow: true } : p)));
              setExample(e.id);
            }}
            className={clsx("rounded-full border px-3 py-1.5 text-sm", example === e.id ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-ivory hover:border-charcoal")}
          >
            {e.label}
          </button>
        ))}
        {ex && (
          <p className="w-full text-xs text-ink-2" data-testid="roi-example-note">
            Illustrative numbers, not a benchmark. {ex.note}
          </p>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Projects">
            {projects.map((p, i) => (
              <span key={i} className="inline-flex items-center">
                <button type="button" aria-pressed={i === active} onClick={() => setActive(i)} className={clsx("h-9 rounded-[8px] border px-3 text-sm", i === active ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
                  {p.label.trim() || `Project ${i + 1}`}
                </button>
                {projects.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove ${p.label.trim() || `project ${i + 1}`}`}
                    onClick={() => {
                      setProjects((l) => l.filter((_, j) => j !== i));
                      setActive((a) => (a >= i && a > 0 ? a - 1 : a));
                    }}
                    className="grid size-8 place-items-center rounded-[8px] text-ink-2 hover:text-error"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
            {projects.length < 3 && (
              <button
                type="button"
                onClick={() => {
                  setProjects((l) => [...l, blank(l.length + 1)]);
                  setActive(projects.length);
                  setExample(null);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-charcoal hover:text-charcoal"
              >
                <Plus aria-hidden className="size-4" /> Compare another
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <label htmlFor="roi-label" className="mb-1.5 block text-sm font-medium">
                Name (optional)
              </label>
              <input id="roi-label" value={f.label} maxLength={40} onChange={(e) => set("label", e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3.5 outline-none focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]" />
            </div>
            <div>
              <label htmlFor="roi-cur" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select id="roi-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
                {CURRENCIES.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <NumberField id="roi-cost" label="Initial investment or cost" prefix={sym} value={f.cost} onChange={(v) => set("cost", v)} error={err("cost")} size="lg" hint="What you put in at the start — purchase price, ad spend, build cost." />
          <div>
            <p className="mb-1.5 text-sm font-medium">What will you enter next?</p>
            <Segmented
              label="Type of return entered"
              value={f.entry}
              onChange={(v) => set("entry", v)}
              options={[
                { value: "received", label: "Amount received", hint: "revenue · final value" },
                { value: "profit", label: "Net profit", hint: "already after costs" },
              ]}
            />
          </div>
          {f.entry === "received" ? (
            <>
              <NumberField id="roi-value" label="Total amount received or final value" prefix={sym} value={f.value} onChange={(v) => set("value", v)} error={err("value")} hint="Everything you got back: sale price, revenue attributed, or the asset's value now. Not profit." />
              <NumberField id="roi-expenses" label="Additional expenses (optional)" prefix={sym} placeholder="0" value={f.expenses} onChange={(v) => set("expenses", v)} error={err("expenses")} hint="Fees, maintenance, taxes paid, agency costs — anything else it cost you." />
            </>
          ) : (
            <NumberField id="roi-value" label="Net profit (use − for a loss)" prefix={sym} value={f.value} onChange={(v) => set("value", v)} error={err("value")} hint="Gain after every cost has been subtracted. ROI = profit ÷ cost." />
          )}
          <div className="grid gap-3 border-t border-line pt-5">
            <p className="text-sm font-medium">
              How long did it take? <span className="font-normal text-ink-2">(optional, for annualised ROI)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="roi-years" label="Years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} integer />
              <NumberField id="roi-months" label="Months" value={f.months} onChange={(v) => set("months", v)} error={err("months")} integer />
            </div>
            <Toggle checked={f.singleFlow} onChange={(v) => set("singleFlow", v)} label="No money added or taken out in between" description="Needed for a meaningful annualised ROI" />
          </div>
        </Panel>

        <ResultCard
          eyebrow={`Return on investment${projects.length > 1 ? ` · ${f.label.trim() || `Project ${active + 1}`}` : ""}`}
          state={out.status}
          error={out.status === "error" ? out.message : undefined}
          empty="Enter the cost and what you received (or the net profit)."
          onReset={() => (setProjects([DEFAULT]), setActive(0), setExample(null))}
          footer="ROI ignores risk and how long the money was tied up unless you annualise it. Examples are illustrative. Not financial advice."
        >
          {r && (
            <>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="font-mono text-[clamp(2.4rem,1.7rem+3vw,3.6rem)] leading-none tracking-tight" data-testid="roi-value">
                  {pct(r.roi)}
                </p>
                <StatusBadge s={r.status} />
              </div>
              <p className="mt-2 text-sm text-ivory/65">
                {r.gain >= 0 ? "gain" : "loss"} of {fmt(Math.abs(r.gain))} on {fmt(r.totalCost)}
              </p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut label={`Total cost ${fmt(r.totalCost)}, ${r.gain >= 0 ? "gain" : "loss"} ${fmt(Math.abs(r.gain))}`} parts={r.gain >= 0 ? [{ value: r.totalCost, color: "rgba(250,247,242,0.9)" }, { value: r.gain, color: CHART.orange }] : [{ value: r.received, color: "rgba(250,247,242,0.9)" }, { value: -r.gain, color: "#E08A6D" }]} />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="Total cost" value={fmt(r.totalCost)} testId="roi-cost" />
                  <Figure label="Received" value={fmt(r.received)} />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label={r.gain >= 0 ? "Net gain" : "Net loss"} value={fmt(r.gain)} strong testId="roi-gain" />
                {r.annualised !== null && <Figure label={`Annualised ROI (${+r.years!.toFixed(2)} years)`} value={pct(r.annualised)} testId="roi-annualised" />}
              </dl>
              {r.annualisedNote && (
                <p className="mt-3 flex gap-2 text-sm text-ivory/75" data-testid="roi-annual-note">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> {r.annualisedNote}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => [`ROI — ${r.label || "ZSpace Tools"}`, ...rows(r).map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "roi-calculator" })} />
                <DarkButton onClick={() => printSummary(`Return on investment${r.label ? ` — ${r.label}` : ""}`, rows(r), ["ROI does not account for risk or the time the money was invested unless annualised."])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {projects.length > 1 && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-right text-sm" data-testid="roi-compare">
              <thead className="text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Project</th>
                  <th scope="col" className="py-2 font-medium">Cost</th>
                  <th scope="col" className="py-2 font-medium">Received</th>
                  <th scope="col" className="py-2 font-medium">Net gain</th>
                  <th scope="col" className="py-2 font-medium">ROI</th>
                  <th scope="col" className="py-2 font-medium">Annualised</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {projects.map((p, i) => {
                  const x = ok[i];
                  return (
                    <tr key={i} className="border-b border-line last:border-0">
                      <th scope="row" className="py-2 text-left font-sans font-medium">
                        {p.label.trim() || `Project ${i + 1}`}
                        {best === i && <span className="ml-2 rounded-full bg-orange-wash px-2 py-0.5 text-xs text-orange-ink">Highest ROI</span>}
                      </th>
                      {x ? (
                        <>
                          <td className="py-2">{fmt(x.totalCost)}</td>
                          <td className="py-2">{fmt(x.received)}</td>
                          <td className="py-2">{fmt(x.gain)}</td>
                          <td className="py-2">{pct(x.roi)}</td>
                          <td className="py-2">{x.annualised !== null ? pct(x.annualised) : "—"}</td>
                        </>
                      ) : (
                        <td colSpan={5} className="py-2 font-sans text-ink-2">
                          {outs[i].status === "error" ? (outs[i] as { message: string }).message : "Not filled in yet"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-2">The highest ROI isn&rsquo;t automatically the best choice: projects can differ in risk, size and how long the money is tied up. Compare annualised ROI when durations differ.</p>
        </Panel>
      )}

      <Formula>
        <p>
          <code>Total cost = initial investment + additional expenses</code>; <code>Net gain = amount received − total cost</code> (or the net profit you enter); <code>ROI = net gain ÷ total cost × 100</code>.
        </p>
        <p>
          Annualised ROI = <code>(amount received ÷ total cost)^(1/years) − 1</code>. It&rsquo;s only valid when the money went in once at the start and came back once at the end. If you added or withdrew money along the way, use a cash-flow method such as XIRR instead.
        </p>
        <p>Revenue is not profit: if you enter revenue as the amount received, make sure every cost of earning it is in the cost or expenses fields.</p>
      </Formula>
    </div>
  );
}
