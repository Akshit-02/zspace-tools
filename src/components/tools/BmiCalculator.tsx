"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Info } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented } from "./ui";
import { NumberField, ResetButton } from "./calc-ui";
import { CATEGORIES, LB_KG, bmiFromForm, cmToFtIn, type BmiForm, type Category } from "@/lib/bmi";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const EMPTY: BmiForm = { system: "metric", cm: "", kg: "", ft: "", inch: "", lb: "" };
const EXAMPLES: { label: string; form: BmiForm }[] = [
  { label: "170 cm · 65 kg", form: { ...EMPTY, cm: "170", kg: "65" } },
  { label: "158 cm · 72 kg", form: { ...EMPTY, cm: "158", kg: "72" } },
  { label: "5 ft 10 in · 180 lb", form: { ...EMPTY, system: "imperial", ft: "5", inch: "10", lb: "180" } },
];

/** Scale shown from BMI 15 to 40; colours plus text labels, never colour alone. */
const SCALE_MIN = 15;
const SCALE_MAX = 40;
const SWATCH: Record<Category, string> = { underweight: "#9CB8D4", healthy: "#7FB38F", overweight: "#E9B872", obesity: "#E08A6D" };

const EXPLAIN: Record<Category, string> = {
  underweight: "Your BMI is below the range usually associated with the lowest health risk for adults. A healthcare professional can help you understand whether that matters for you.",
  healthy: "Your BMI is within the range usually associated with the lowest health risk for adults. BMI doesn't measure body fat, fitness or diet, so it's one indicator among many.",
  overweight: "Your BMI is above the range usually associated with the lowest health risk for adults. BMI can't tell muscle from fat, so it may overestimate this for muscular people — a professional can give context.",
  obesity: "Your BMI is in the range where health risks are generally higher for adults. BMI is a screening measure, not a diagnosis; a healthcare professional can assess your overall health.",
};

export default function BmiCalculator() {
  const [f, setF] = useState<BmiForm>({ ...EMPTY, cm: "170", kg: "65" });
  const set = <K extends keyof BmiForm>(k: K, v: BmiForm[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "bmi-calculator" });
  }, []);

  const out = useMemo(() => bmiFromForm(f), [f]);
  const r = out.status === "ok" ? out.result : null;
  const err = (k: string) => (out.status === "error" && out.field === k ? out.message : null);
  const imperial = f.system === "imperial";
  const w = (kg: number) => (imperial ? `${(kg / LB_KG).toFixed(1)} lb` : `${kg.toFixed(1)} kg`);
  const h = (cm: number) => (imperial ? cmToFtIn(cm) : `${+cm.toFixed(1)} cm`);
  const cat = r ? CATEGORIES.find((c) => c.id === r.category)! : null;
  const pos = r ? Math.min(100, Math.max(0, ((r.bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100)) : 0;

  const switchSystem = (s: "metric" | "imperial") => {
    // Convert what's already entered so switching keeps the same person.
    if (s === f.system) return;
    const cur = bmiFromForm(f);
    if (cur.status === "ok") {
      const totalIn = cur.result.cm / 2.54;
      const ft = Math.floor(Math.round(totalIn) / 12);
      setF(s === "imperial" ? { ...f, system: s, ft: String(ft), inch: String(Math.round(totalIn) - ft * 12), lb: (cur.result.kg / LB_KG).toFixed(1) } : { ...f, system: s, cm: cur.result.cm.toFixed(1), kg: cur.result.kg.toFixed(1) });
    } else setF({ ...f, system: s });
  };

  const summary = () =>
    r && cat
      ? [
          "BMI result — ZSpace Tools",
          `Height: ${h(r.cm)}${imperial ? ` (${r.cm.toFixed(1)} cm)` : ""}`,
          `Weight: ${w(r.kg)}${imperial ? ` (${r.kg.toFixed(1)} kg)` : ""}`,
          `BMI: ${r.shown.toFixed(1)} — ${cat.label} (adult range ${cat.range})`,
          `Healthy-weight range for this height (BMI 18.5–24.9): ${w(r.healthy.min)} – ${w(r.healthy.max)}`,
          "",
          "BMI is a screening measure for adults (18+), not a diagnosis. It doesn't distinguish muscle from fat and isn't valid for children, teenagers or pregnancy.",
        ].join("\n")
      : "";

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="Units" value={f.system} onChange={switchSystem} options={[{ value: "metric", label: "Metric (cm, kg)" }, { value: "imperial", label: "Imperial (ft, lb)" }]} />
          {imperial ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="bmi-ft" label="Height — feet" suffix="ft" integer value={f.ft} onChange={(v) => set("ft", v)} error={err("ft")} size="lg" />
                <NumberField id="bmi-in" label="inches" suffix="in" value={f.inch} onChange={(v) => set("inch", v)} error={err("inch")} placeholder="0" size="lg" />
              </div>
              <NumberField id="bmi-lb" label="Weight" suffix="lb" value={f.lb} onChange={(v) => set("lb", v)} error={err("lb")} size="lg" />
            </>
          ) : (
            <>
              <NumberField id="bmi-cm" label="Height" suffix="cm" value={f.cm} onChange={(v) => set("cm", v)} error={err("cm")} size="lg" />
              <NumberField id="bmi-kg" label="Weight" suffix="kg" value={f.kg} onChange={(v) => set("kg", v)} error={err("kg")} size="lg" />
            </>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium">Examples</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button key={e.label} type="button" onClick={() => setF(e.form)} className="rounded-full border border-line bg-ivory px-3 py-1.5 font-mono text-xs hover:border-charcoal">
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <p className="flex gap-2 rounded-[12px] bg-ivory-2 px-4 py-3 text-sm text-charcoal" data-testid="bmi-adults">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            For adults aged 18 and over. Children and teenagers need age- and sex-specific BMI percentiles, which this calculator doesn&rsquo;t provide. Not intended for pregnancy.
          </p>
        </Panel>

        <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8 lg:sticky lg:top-24 lg:self-start">
          <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
            <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Your BMI
          </p>
          {r && cat ? (
            <>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="font-mono text-[clamp(2.8rem,2rem+3vw,4rem)] leading-none tracking-tight" data-testid="bmi-value">
                  {r.shown.toFixed(1)}
                </p>
                <p className="flex items-center gap-2 text-lg font-medium" data-testid="bmi-category">
                  <span aria-hidden className="inline-block size-3 rounded-full" style={{ background: SWATCH[r.category] }} />
                  {cat.label}
                </p>
              </div>
              <p className="mt-2 text-sm text-ivory/65">
                {h(r.cm)} · {w(r.kg)} · adult range {cat.range}
              </p>

              <div className="mt-6" data-testid="bmi-scale">
                <div className="relative">
                  <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
                    {CATEGORIES.map((c) => {
                      const from = Math.max(SCALE_MIN, c.from);
                      const to = Math.min(SCALE_MAX, c.to ?? SCALE_MAX);
                      return <span key={c.id} style={{ width: `${((to - from) / (SCALE_MAX - SCALE_MIN)) * 100}%`, background: SWATCH[c.id], opacity: c.id === r.category ? 1 : 0.45 }} />;
                    })}
                  </div>
                  <span aria-hidden className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded-full bg-ivory shadow-[0_0_0_2px_#252525] transition-[left] duration-300" style={{ left: `${pos}%` }} />
                </div>
                <ol className="mt-2 grid grid-cols-4 gap-1 text-[0.7rem] text-ivory/60">
                  {CATEGORIES.map((c) => (
                    <li key={c.id} className={clsx(c.id === r.category && "font-bold text-ivory")}>
                      {c.label}
                      <span className="block font-mono">{c.range.replace(" and above", "+").replace("below ", "< ").replace(" to ", "–")}</span>
                    </li>
                  ))}
                </ol>
                <p className="sr-only">
                  BMI {r.shown.toFixed(1)} is in the {cat.label} range ({cat.range}).
                </p>
              </div>

              <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10 text-sm">
                <div className="flex justify-between gap-4 py-2.5">
                  <dt className="text-ivory/70">Healthy-weight range for {h(r.cm)}</dt>
                  <dd className="text-right font-mono" data-testid="bmi-range">
                    {w(r.healthy.min)} – {w(r.healthy.max)}
                  </dd>
                </div>
                {r.toHealthy > 0 && (
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-ivory/70">Difference to that range</dt>
                    <dd className="font-mono">{w(r.toHealthy)}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-ivory/80">{EXPLAIN[r.category]}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={summary} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "bmi-calculator" })} />
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(new Blob([summary()], { type: "text/plain;charset=utf-8" }), "bmi-result.txt");
                    track("download_clicked", { tool: "bmi-calculator", format: "txt" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60"
                >
                  <FileText aria-hidden className="size-4" /> Download
                </button>
                <ResetButton dark onClick={() => setF({ ...EMPTY, system: f.system })} />
              </div>
            </>
          ) : out.status === "error" ? (
            <>
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {out.message}
              </p>
              <div className="mt-4">
                <ResetButton dark onClick={() => setF({ ...EMPTY, system: f.system })} />
              </div>
            </>
          ) : (
            <p className="mt-6 text-ivory/60">Enter your height and weight to see your BMI.</p>
          )}
          <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55">BMI is a screening measure, not a diagnosis. It doesn&rsquo;t distinguish muscle from fat and may not reflect body composition for athletes, older adults or some ethnic groups. Talk to a healthcare professional about your health.</p>
        </div>
      </div>
    </div>
  );
}
