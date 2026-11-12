"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel } from "./ui";
import { calculate, type PercentMode } from "@/lib/percentage";
import { track } from "@/lib/analytics";

interface ModeDef {
  id: PercentMode;
  tab: string;
  question: string;
  a: { label: string; placeholder: string; suffix?: string; prefix?: string };
  b: { label: string; placeholder: string; suffix?: string; prefix?: string };
  /** Sentence layout: text before A, between A and B, after B. */
  phrase: [string, string, string];
  example: [string, string];
  tip: string;
}

const MODES: ModeDef[] = [
  {
    id: "of",
    tab: "X% of Y",
    question: "What is X% of Y?",
    a: { label: "Percentage", placeholder: "20", suffix: "%" },
    b: { label: "Number", placeholder: "500" },
    phrase: ["What is", "of", "?"],
    example: ["20", "500"],
    tip: 'Use this for tips, tax, commission or any “X percent of” question.',
  },
  {
    id: "what",
    tab: "X is what % of Y",
    question: "X is what percentage of Y?",
    a: { label: "Part (X)", placeholder: "50" },
    b: { label: "Whole (Y)", placeholder: "200" },
    phrase: ["", "is what % of", "?"],
    example: ["50", "200"],
    tip: "Use this for test scores, completion rates or a share of a total.",
  },
  {
    id: "increase",
    tab: "Increase",
    question: "Percentage increase from one value to another",
    a: { label: "Original value", placeholder: "100" },
    b: { label: "New value", placeholder: "150" },
    phrase: ["From", "to", ""],
    example: ["100", "150"],
    tip: "Measures growth from a starting point, such as a price rise or salary increase.",
  },
  {
    id: "decrease",
    tab: "Decrease",
    question: "Percentage decrease from one value to another",
    a: { label: "Original value", placeholder: "200" },
    b: { label: "New value", placeholder: "150" },
    phrase: ["From", "to", ""],
    example: ["200", "150"],
    tip: "Measures a drop from a starting point, such as a price cut or weight loss.",
  },
  {
    id: "difference",
    tab: "Difference",
    question: "Percentage difference between two values",
    a: { label: "Value A", placeholder: "40" },
    b: { label: "Value B", placeholder: "60" },
    phrase: ["Between", "and", ""],
    example: ["40", "60"],
    tip: "Compares two values with neither as the baseline. Measuring change over time? Use Increase or Decrease.",
  },
  {
    id: "discount",
    tab: "Discount",
    question: "Price after a discount",
    a: { label: "Original price", placeholder: "80" },
    b: { label: "Discount", placeholder: "25", suffix: "%" },
    phrase: ["", "with", "off"],
    example: ["80", "25"],
    tip: "Works in any currency. Enter the price before the discount and the percentage off.",
  },
];

const empty = Object.fromEntries(MODES.map((m) => [m.id, ["", ""]])) as Record<PercentMode, [string, string]>;

function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  suffix,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
  autoFocus?: boolean;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-ink-2">{label}</span>
      <span className="group relative block">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={clsx(
            "h-16 w-full rounded-[12px] border border-line-strong bg-card px-4 font-mono text-[1.6rem] tracking-tight text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)] sm:h-[72px] sm:text-[1.9rem]",
            suffix && "pr-11",
          )}
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xl text-ink-2">{suffix}</span>}
      </span>
    </label>
  );
}

export default function PercentageCalculator() {
  const [mode, setMode] = useState<PercentMode>("of");
  const [values, setValues] = useState(empty);
  const id = useId();
  const def = MODES.find((m) => m.id === mode)!;
  const [a, b] = values[mode];
  const outcome = useMemo(() => calculate(mode, a, b), [mode, a, b]);

  useEffect(() => {
    track("tool_opened", { tool: "percentage-calculator" });
  }, []);

  const set = (i: 0 | 1, v: string) => setValues((s) => ({ ...s, [mode]: (i === 0 ? [v, s[mode][1]] : [s[mode][0], v]) as [string, string] }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] [&>*]:min-w-0">
      <Panel className="overflow-hidden">
        <div role="tablist" aria-label="Calculation type" className="flex gap-1 overflow-x-auto border-b border-line bg-ivory p-1.5 [scrollbar-width:none]">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                role="tab"
                type="button"
                id={`${id}-tab-${m.id}`}
                aria-selected={active}
                aria-controls={`${id}-panel`}
                onClick={() => setMode(m.id)}
                className={clsx(
                  "relative shrink-0 whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[0.9rem] font-medium transition-colors",
                  active ? "text-charcoal" : "text-ink-2 hover:text-charcoal",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`${id}-pill`}
                    className="absolute inset-0 rounded-[10px] border border-line-strong bg-card shadow-[0_1px_2px_rgba(37,37,37,0.08)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">{m.tab}</span>
              </button>
            );
          })}
        </div>

        <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${mode}`} className="p-5 sm:p-7">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
              <h2 className="font-display text-[1.45rem] font-semibold tracking-[-0.01em]">{def.question}</h2>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                {def.phrase[0] && <span className="hidden pb-5 text-lg text-ink-2 sm:block">{def.phrase[0]}</span>}
                <NumberField id={`${id}-a`} label={def.a.label} value={a} onChange={(v) => set(0, v)} placeholder={def.a.placeholder} suffix={def.a.suffix} />
                {def.phrase[1] && <span className="hidden whitespace-nowrap pb-5 text-lg text-ink-2 sm:block">{def.phrase[1]}</span>}
                <NumberField id={`${id}-b`} label={def.b.label} value={b} onChange={(v) => set(1, v)} placeholder={def.b.placeholder} suffix={def.b.suffix} />
                {def.phrase[2] && <span className="hidden pb-5 text-lg text-ink-2 sm:block">{def.phrase[2]}</span>}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setValues((s) => ({ ...s, [mode]: [...def.example] as [string, string] }))}
                  className="rounded-full border border-line px-3 py-1 text-ink-2 transition-colors hover:border-charcoal hover:text-charcoal"
                >
                  Try an example: <span className="font-mono">{def.example.join(" , ")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValues((s) => ({ ...s, [mode]: ["", ""] }))}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal"
                >
                  <RotateCcw aria-hidden className="size-3.5" /> Reset
                </button>
              </div>
              <p className="mt-8 border-t border-dashed border-line-strong pt-5 text-sm leading-relaxed text-ink-2">{def.tip}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Panel>

      {/* Result */}
      <div aria-live="polite" className="rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8">
        <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
          <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Result
        </p>
        {outcome.status === "ok" ? (
          <div>
            <motion.p
              key={outcome.result.display}
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-4 break-all font-mono text-[clamp(2.6rem,1.6rem+4vw,4rem)] leading-none tracking-tight"
              data-testid="percent-result"
            >
              {outcome.result.display}
            </motion.p>
            <p className="mt-4 text-lg text-ivory/85">{outcome.result.sentence}.</p>
            {outcome.result.extra && (
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {outcome.result.extra.map((e) => (
                  <div key={e.label} className="rounded-[12px] border border-ivory/15 px-4 py-3">
                    <dt className="text-xs text-ivory/60">{e.label}</dt>
                    <dd className="mt-0.5 font-mono text-xl">{e.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-6 rounded-[12px] bg-ivory/[0.06] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-ivory/55">Formula</p>
              <p className="mt-1.5 font-mono text-[0.88rem] text-ivory">{outcome.result.formula}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-ivory/55">Working</p>
              <ol className="mt-1.5 space-y-1 font-mono text-[0.85rem] text-ivory/85">
                {outcome.result.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-orange">{i + 1}</span>
                    <span className="break-all">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            {outcome.result.note && <p className="mt-4 text-sm text-ivory/65">{outcome.result.note}</p>}
            <div className="mt-6">
              <CopyButton
                text={() => outcome.result.copy}
                variant="primary"
                label="Copy result"
                onCopied={() => track("copy_clicked", { tool: "percentage-calculator", format: mode })}
              />
            </div>
          </div>
        ) : outcome.status === "error" ? (
          <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
            <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" />
            {outcome.message}
          </p>
        ) : (
          <div className="mt-4">
            <p className="font-mono text-[clamp(2.6rem,1.6rem+4vw,4rem)] leading-none tracking-tight text-ivory/20">—</p>
            <p className="mt-4 text-ivory/60">Enter two numbers to see the answer, the formula and every step.</p>
          </div>
        )}
      </div>
    </div>
  );
}
