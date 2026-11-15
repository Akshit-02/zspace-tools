"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Info, Minus, Plus, Share2 } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle, copyText } from "./ui";
import { Chips, NumberField, ResetButton } from "./calc-ui";
import { TIP_PRESETS, fromMinor, tip, type Rounding, type TaxMode, type TipForm } from "@/lib/tip";
import { CURRENCIES, money, type CurrencyCode } from "@/lib/emi";
import { track } from "@/lib/analytics";

const DEFAULT: TipForm = { bill: "", tipPct: "10", people: "2", taxMode: "none", tax: "", taxIncluded: false, tipBeforeTax: true, rounding: "exact" };

export default function TipCalculator() {
  const [f, setF] = useState<TipForm>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [shared, setShared] = useState(false);
  const set = <K extends keyof TipForm>(k: K, v: TipForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "tip-calculator" });
  }, []);

  const out = useMemo(() => tip(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const fmt = useMemo(() => money(currency, 2), [currency]);
  const m = (minor: number) => fmt(fromMinor(minor));
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const preset = TIP_PRESETS.find((p) => String(p) === f.tipPct.trim());
  const people = Number(f.people) || 0;

  const summary = () => {
    if (!r) return "";
    const lines = [`Bill split — ZSpace Tools`, `Bill: ${m(r.bill)}`];
    if (r.tax) lines.push(`Tax: ${m(r.tax)}${f.taxIncluded ? " (included in the bill)" : ""}`);
    lines.push(`Tip ${r.tipPct}% (${f.tipBeforeTax ? "on the amount before tax" : "on the amount after tax"}): ${m(r.tip)}`, `Total: ${m(r.total)}`, `People: ${r.people}`);
    for (const s of r.shares) lines.push(`${s.count} ${s.count === 1 ? "person pays" : "people pay"} ${m(s.amount)} each`);
    if (r.surplus) lines.push(`Collected ${m(r.collected)} — ${m(r.surplus)} more than the total.`);
    return lines.join("\n");
  };

  const share = async () => {
    const text = summary();
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> };
    try {
      if (nav.share) await nav.share({ title: "Bill split", text });
      else if (await copyText(text)) setShared(true);
    } catch {
      /* user cancelled the share sheet */
    }
    setTimeout(() => setShared(false), 1600);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <Panel className="grid content-start gap-5 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <NumberField id="tip-bill" label="Bill amount" prefix={c.label.split(" ")[0]} placeholder="0.00" value={f.bill} onChange={(v) => set("bill", v)} error={err("bill")} size="lg" />
          <div>
            <label htmlFor="tip-cur" className="mb-1.5 block text-sm font-medium">
              Currency
            </label>
            <select id="tip-cur" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className="h-14 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 sm:w-32">
              {CURRENCIES.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Tip</p>
          <Chips label="Tip percentage" value={preset ?? -1} onChange={(v) => set("tipPct", String(v))} options={TIP_PRESETS.map((p) => ({ value: p, label: `${p}%` }))} />
          <NumberField id="tip-pct" className="mt-2 max-w-[220px]" label="Custom tip" suffix="%" value={f.tipPct} onChange={(v) => set("tipPct", v)} error={err("tipPct")} />
        </div>

        <div>
          <label htmlFor="tip-people" className="mb-1.5 block text-sm font-medium">
            Number of people
          </label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="One fewer person" disabled={people <= 1} onClick={() => set("people", String(Math.max(1, people - 1)))} className="grid size-11 place-items-center rounded-[10px] border border-line-strong bg-card hover:border-charcoal disabled:opacity-35">
              <Minus aria-hidden className="size-4" />
            </button>
            <input id="tip-people" inputMode="numeric" value={f.people} onChange={(e) => set("people", e.target.value)} aria-invalid={Boolean(err("people"))} aria-describedby={err("people") ? "tip-people-err" : undefined} className="h-11 w-20 rounded-[10px] border border-line-strong bg-card text-center font-mono text-lg outline-none focus:border-charcoal" />
            <button type="button" aria-label="One more person" onClick={() => set("people", String(Math.min(200, people + 1)))} className="grid size-11 place-items-center rounded-[10px] border border-line-strong bg-card hover:border-charcoal">
              <Plus aria-hidden className="size-4" />
            </button>
          </div>
          {err("people") && (
            <p id="tip-people-err" className="mt-1.5 text-xs text-[#8f2f27]">
              {err("people")}
            </p>
          )}
        </div>

        <div className="grid gap-3 border-t border-line pt-5">
          <p className="text-sm font-medium">Tax</p>
          <Segmented label="Tax" size="sm" value={f.taxMode} onChange={(v) => set("taxMode", v as TaxMode)} options={[{ value: "none", label: "No tax" }, { value: "percent", label: "Tax %" }, { value: "amount", label: "Tax amount" }]} />
          {f.taxMode !== "none" && (
            <>
              <NumberField id="tip-tax" label={f.taxMode === "percent" ? "Tax rate" : "Tax amount"} suffix={f.taxMode === "percent" ? "%" : undefined} prefix={f.taxMode === "amount" ? c.label.split(" ")[0] : undefined} value={f.tax} onChange={(v) => set("tax", v)} error={err("tax")} className="max-w-[260px]" />
              <Toggle checked={f.taxIncluded} onChange={(v) => set("taxIncluded", v)} label="The bill already includes tax" description={f.taxIncluded ? "Tax is worked out from inside the bill" : "Tax is added on top of the bill"} />
            </>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium">Calculate the tip on</p>
            <Segmented label="Tip base" size="sm" value={f.tipBeforeTax ? "before" : "after"} onChange={(v) => set("tipBeforeTax", v === "before")} options={[{ value: "before", label: "Amount before tax" }, { value: "after", label: "Amount after tax" }]} />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Each person pays</p>
          <Segmented label="Rounding" size="sm" value={f.rounding} onChange={(v) => set("rounding", v as Rounding)} options={[{ value: "exact", label: "Exact" }, { value: "up", label: "Round up" }, { value: "nearest", label: "Nearest whole" }]} />
        </div>
      </Panel>

      <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8 lg:sticky lg:top-24 lg:self-start">
        <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
          <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Per person
        </p>
        {r ? (
          <>
            <p className="mt-3 break-all font-mono text-[clamp(2.4rem,1.7rem+3vw,3.6rem)] leading-none tracking-tight" data-testid="tip-per-person">
              {m(r.shares[0].amount)}
            </p>
            <ul className="mt-2 space-y-0.5 text-sm text-ivory/70" data-testid="tip-shares">
              {r.shares.length > 1 || r.people > 1 ? (
                r.shares.map((s) => (
                  <li key={s.amount}>
                    {s.count} {s.count === 1 ? "person pays" : "people pay"} <span className="font-mono text-ivory">{m(s.amount)}</span>
                  </li>
                ))
              ) : (
                <li>One person pays the whole bill.</li>
              )}
            </ul>
            <dl className="mt-6 divide-y divide-ivory/10 border-t border-ivory/10 text-sm">
              {(
                [
                  ["Bill", m(r.bill), "tip-bill-v"],
                  ...(r.tax ? [[f.taxIncluded ? "Tax (included)" : "Tax", m(r.tax), "tip-tax-v"]] : []),
                  [`Tip ${r.tipPct}% of ${m(r.tipBase)}`, m(r.tip), "tip-tip-v"],
                  ["Total", m(r.total), "tip-total"],
                  ["People", String(r.people), "tip-people-v"],
                  ...(r.surplus ? [["Collected", `${m(r.collected)} (+${m(r.surplus)})`, "tip-collected"]] : []),
                ] as [string, string, string][]
              ).map(([l, v, id]) => (
                <div key={l} className="flex justify-between gap-4 py-2.5">
                  <dt className={l === "Total" ? "font-medium text-ivory" : "text-ivory/70"}>{l}</dt>
                  <dd data-testid={id} className={l === "Total" ? "font-mono text-[1.1rem]" : "font-mono"}>
                    {v}
                  </dd>
                </div>
              ))}
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
              <CopyButton text={summary} label="Copy summary" variant="primary" onCopied={() => track("copy_clicked", { tool: "tip-calculator" })} />
              <button type="button" onClick={share} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                <Share2 aria-hidden className="size-4" /> {shared ? "Copied" : "Share"}
              </button>
              <ResetButton dark onClick={() => setF(DEFAULT)} />
            </div>
          </>
        ) : out.status === "error" ? (
          <>
            <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
              <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {out.message}
            </p>
            <div className="mt-4">
              <ResetButton dark onClick={() => setF(DEFAULT)} />
            </div>
          </>
        ) : (
          <p className="mt-6 text-ivory/60">Enter the bill amount to split it.</p>
        )}
        <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55">Tipping customs differ by country and venue. Check whether a service charge is already on the bill before adding a tip.</p>
      </div>
    </div>
  );
}
