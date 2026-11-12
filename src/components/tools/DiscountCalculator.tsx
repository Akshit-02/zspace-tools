"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Info, Minus, Plus, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, inputClass } from "./ui";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { PRESETS, markupDiscount, originalPrice, pct, reverse, standard, successive, type DiscountMode, type Outcome } from "@/lib/discount";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const MODES: { value: DiscountMode; label: string; hint: string }[] = [
  { value: "standard", label: "Sale price", hint: "price − discount %" },
  { value: "reverse", label: "Find discount %", hint: "from two prices" },
  { value: "successive", label: "Successive", hint: "20% + 10% …" },
  { value: "original", label: "Original price", hint: "before the discount" },
  { value: "markup", label: "Markup & discount", hint: "cost → MRP → sale" },
];

type Line = { label: string; value: string; strong?: boolean; tone?: "good" | "bad" };

function MoneyInput({ id, label, value, onChange, symbol, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; symbol: string; placeholder: string }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg text-ink-2">{symbol}</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingLeft: `${Math.max(2.5, symbol.length * 0.62 + 1.6)}rem` }}
          className="h-14 w-full rounded-[12px] border border-line-strong bg-card pr-4 font-mono text-[1.35rem] tracking-tight outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]"
        />
      </div>
    </div>
  );
}

function PctInput({ id, label, value, onChange, presets = true }: { id: string; label: string; value: string; onChange: (v: string) => void; presets?: boolean }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 w-full rounded-[12px] border border-line-strong bg-card pl-4 pr-10 font-mono text-[1.35rem] tracking-tight outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-lg text-ink-2">%</span>
      </div>
      {presets && (
        <div role="group" aria-label={`${label} presets`} className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-9">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={value === String(p)}
              onClick={() => onChange(String(p))}
              className={clsx(
                "h-9 rounded-[8px] border font-mono text-[0.85rem] transition-colors",
                value === String(p) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal",
              )}
            >
              {p}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscountCalculator() {
  const [mode, setMode] = useState<DiscountMode>("standard");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [price, setPrice] = useState("");
  const [percent, setPercent] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [steps, setSteps] = useState<string[]>(["", ""]);
  const [cost, setCost] = useState("");
  const [markup, setMarkup] = useState("");

  useEffect(() => {
    track("tool_opened", { tool: "discount-calculator" });
  }, []);

  const fmt = useMemo(() => money(currency), [currency]);
  const symbol = useMemo(() => {
    const c = CURRENCIES.find((x) => x.code === currency)!;
    return new Intl.NumberFormat(c.locale, { style: "currency", currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;
  }, [currency]);

  const view = useMemo((): Outcome<{ headline: Line; lines: Line[]; note?: string }> => {
    switch (mode) {
      case "standard": {
        const o = standard(price, percent);
        if (o.status !== "ok") return o;
        const r = o.result;
        return {
          status: "ok",
          result: {
            headline: { label: "Final price", value: fmt(r.final) },
            lines: [
              { label: "Original price", value: fmt(r.original) },
              { label: `Discount (${pct(r.percent)})`, value: `− ${fmt(r.saving)}`, tone: "good" },
              { label: "You save", value: fmt(r.saving), tone: "good" },
            ],
          },
        };
      }
      case "reverse": {
        const o = reverse(price, finalPrice);
        if (o.status !== "ok") return o;
        const r = o.result;
        return {
          status: "ok",
          result: {
            headline: { label: r.increase ? "Price increase" : "Discount", value: pct(Math.abs(r.percent)) },
            lines: [
              { label: "Original price", value: fmt(r.original) },
              { label: "Final price", value: fmt(r.final) },
              { label: r.increase ? "Extra paid" : "You save", value: fmt(Math.abs(r.difference)), tone: r.increase ? "bad" : "good" },
            ],
            note: r.increase ? "The final price is higher than the original, so this is a price increase, not a discount." : undefined,
          },
        };
      }
      case "successive": {
        const o = successive(price, steps);
        if (o.status !== "ok") return o;
        const r = o.result;
        return {
          status: "ok",
          result: {
            headline: { label: "Final price", value: fmt(r.final) },
            lines: [
              { label: "Original price", value: fmt(r.original) },
              ...r.steps.map((s, i) => ({ label: `Step ${i + 1}: ${pct(s.percent)} off ${fmt(s.before)}`, value: `− ${fmt(s.saving)}`, tone: "good" as const })),
              { label: "Total saving", value: fmt(r.totalSaving), tone: "good" },
              { label: "Effective discount", value: pct(r.effective), strong: true },
            ],
            note: r.steps.length > 1 ? `Successive discounts don't add up: ${r.steps.map((s) => pct(s.percent)).join(" + ")} is ${pct(r.effective)} overall, not ${pct(r.naiveSum)}.` : undefined,
          },
        };
      }
      case "original": {
        const o = originalPrice(finalPrice, percent);
        if (o.status !== "ok") return o;
        const r = o.result;
        return {
          status: "ok",
          result: {
            headline: { label: "Original price", value: fmt(r.original) },
            lines: [
              { label: "Sale price", value: fmt(r.final) },
              { label: `Discount (${pct(r.percent)})`, value: fmt(r.saving), tone: "good" },
            ],
            note: `Original = sale price ÷ (1 − ${pct(r.percent)}).`,
          },
        };
      }
      case "markup": {
        const o = markupDiscount(cost, markup, percent);
        if (o.status !== "ok") return o;
        const r = o.result;
        const loss = r.profit < 0;
        return {
          status: "ok",
          result: {
            headline: { label: "Selling price", value: fmt(r.selling) },
            lines: [
              { label: "Cost price", value: fmt(r.cost) },
              { label: `Marked price (+${pct(r.markupPct)} markup)`, value: fmt(r.marked) },
              { label: `Discount (${pct(r.discountPct)} of marked price)`, value: `− ${fmt(r.discount)}` },
              { label: loss ? "Loss" : "Profit", value: fmt(Math.abs(r.profit)), tone: loss ? "bad" : "good", strong: true },
              { label: "Profit on cost (markup achieved)", value: pct(r.profitOnCostPct), tone: loss ? "bad" : undefined },
              { label: "Margin on selling price", value: pct(r.marginPct), tone: loss ? "bad" : undefined },
            ],
            note: "Markup is profit ÷ cost. Margin is profit ÷ selling price — the same profit gives a smaller margin than markup.",
          },
        };
      }
    }
  }, [mode, price, percent, finalPrice, steps, cost, markup, fmt]);

  const summary = () => {
    if (view.status !== "ok") return "";
    const r = view.result;
    const title = MODES.find((m) => m.value === mode)!.label;
    return [`Discount calculator — ${title}`, "", ...r.lines.map((l) => `${l.label}: ${l.value}`), `${r.headline.label}: ${r.headline.value}`, ...(r.note ? ["", r.note] : [])].join("\n") + "\n";
  };

  const reset = () => {
    setPrice("");
    setPercent("");
    setFinalPrice("");
    setSteps(["", ""]);
    setCost("");
    setMarkup("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <div role="radiogroup" aria-label="Calculation" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={clsx(
                "rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                mode === m.value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal",
              )}
            >
              <span className="block text-sm font-medium">{m.label}</span>
              <span className={clsx("block font-mono text-[0.7rem]", mode === m.value ? "text-ivory/65" : "text-ink-2")}>{m.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5">
          {(mode === "standard" || mode === "reverse" || mode === "successive") && (
            <MoneyInput id="disc-price" label="Original price" value={price} onChange={setPrice} symbol={symbol} placeholder="2,499" />
          )}
          {mode === "standard" && <PctInput id="disc-pct" label="Discount" value={percent} onChange={setPercent} />}
          {mode === "reverse" && <MoneyInput id="disc-final" label="Final price paid" value={finalPrice} onChange={setFinalPrice} symbol={symbol} placeholder="1,749" />}
          {mode === "original" && (
            <>
              <MoneyInput id="disc-final" label="Sale price (after discount)" value={finalPrice} onChange={setFinalPrice} symbol={symbol} placeholder="1,749" />
              <PctInput id="disc-pct" label="Discount that was applied" value={percent} onChange={setPercent} />
            </>
          )}
          {mode === "successive" && (
            <div className="grid gap-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <PctInput id={`disc-step-${i}`} label={`Discount ${i + 1}`} value={s} onChange={(v) => setSteps((cur) => cur.map((x, j) => (j === i ? v : x)))} presets={false} />
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove discount ${i + 1}`}
                      onClick={() => setSteps((cur) => cur.filter((_, j) => j !== i))}
                      className="inline-flex size-14 shrink-0 items-center justify-center rounded-[12px] border border-line-strong bg-card hover:border-charcoal"
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {steps.length < 5 && (
                <button
                  type="button"
                  onClick={() => setSteps((cur) => [...cur, ""])}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-dashed border-line-strong text-sm text-ink-2 hover:border-charcoal hover:text-charcoal"
                >
                  <Plus aria-hidden className="size-4" /> Add another discount
                </button>
              )}
            </div>
          )}
          {mode === "markup" && (
            <>
              <MoneyInput id="disc-cost" label="Cost price" value={cost} onChange={setCost} symbol={symbol} placeholder="500" />
              <PctInput id="disc-markup" label="Markup on cost" value={markup} onChange={setMarkup} presets={false} />
              <PctInput id="disc-pct" label="Discount on marked price (optional)" value={percent} onChange={setPercent} />
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-2">
              Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={clsx(inputClass, "!h-10 w-auto !py-0")}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
              <RotateCcw aria-hidden className="size-3.5" /> Reset
            </button>
          </div>
        </div>
      </Panel>

      <div className="flex flex-col gap-3">
        <section aria-live="polite" data-testid="discount-result" className="rounded-[20px] bg-charcoal p-5 text-ivory sm:p-7">
          {view.status === "ok" ? (
            <>
              <p className="text-sm text-ivory/70">{view.result.headline.label}</p>
              <p className="mt-1 break-words font-mono text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-none tracking-tight text-orange">{view.result.headline.value}</p>
              <dl className="mt-6 divide-y divide-ivory/10 border-t border-ivory/10">
                {view.result.lines.map((l) => (
                  <div key={l.label} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className={clsx("min-w-0 text-sm", l.strong ? "font-medium text-ivory" : "text-ivory/75")}>{l.label}</dt>
                    <dd className={clsx("shrink-0 font-mono tabular-nums", l.tone === "good" && "text-[#9fd8b4]", l.tone === "bad" && "text-[#f4a69d]", l.strong && "text-[1.1rem]")}>{l.value}</dd>
                  </div>
                ))}
              </dl>
              {view.result.note && (
                <p className="mt-4 flex gap-2 rounded-[12px] bg-ivory/[0.07] px-3 py-2.5 text-sm text-ivory/85">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0" /> {view.result.note}
                </p>
              )}
            </>
          ) : view.status === "error" ? (
            <p className="flex items-start gap-2 text-[#f4a69d]">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" /> {view.message}
            </p>
          ) : (
            <p className="text-ivory/70">Enter the values on the left — the result updates as you type.</p>
          )}
        </section>
        <div className="flex flex-wrap gap-2">
          <CopyButton
            text={summary}
            label="Copy summary"
            onCopied={() => track("copy_clicked", { tool: "discount-calculator", format: mode })}
          />
          <button
            type="button"
            disabled={view.status !== "ok"}
            onClick={() => {
              downloadBlob(new Blob([summary()], { type: "text/plain;charset=utf-8" }), "discount-summary.txt");
              track("download_clicked", { tool: "discount-calculator", format: "txt" });
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal disabled:opacity-40"
          >
            <Download aria-hidden className="size-4" /> Download .txt
          </button>
        </div>
        <p className="text-xs text-ink-2">Prices are treated as given — no GST or other tax is added or removed. Results are rounded to 2 decimals for display.</p>
      </div>
    </div>
  );
}
