"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeftRight, Eraser } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel } from "./ui";
import { UNIT_CATEGORIES, convert, formatQuantity, getUnitCategory, plainQuantity, type Unit, type UnitCategory } from "@/lib/units";
import { track } from "@/lib/analytics";

const EXAMPLES: { label: string; cat: UnitCategory; v: string; from: string; to: string }[] = [
  { label: "5 ft → cm", cat: "length", v: "5", from: "ft", to: "cm" },
  { label: "10 km → mi", cat: "length", v: "10", from: "km", to: "mi" },
  { label: "70 kg → lb", cat: "mass", v: "70", from: "kg", to: "lb" },
  { label: "100 °F → °C", cat: "temperature", v: "100", from: "F", to: "C" },
  { label: "1 acre → m²", cat: "area", v: "1", from: "ac", to: "m2" },
  { label: "2 L → US fl oz", cat: "volume", v: "2", from: "L", to: "floz" },
  { label: "60 mph → km/h", cat: "speed", v: "60", from: "mph", to: "kmh" },
  { label: "1 TB → GiB", cat: "data", v: "1", from: "TB", to: "GiB" },
];

function UnitSelect({ id, label, units, value, onChange }: { id: string; label: string; units: Unit[]; value: string; onChange: (v: string) => void }) {
  const groups = [...new Set(units.map((u) => u.group ?? ""))];
  const option = (u: Unit) => (
    <option key={u.id} value={u.id}>
      {u.name} ({u.symbol})
    </option>
  );
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-ink-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full cursor-pointer rounded-[12px] border border-line-strong bg-card px-3 text-[0.98rem] outline-none transition-colors focus:border-charcoal"
      >
        {groups.length > 1 ? groups.map((g) => <optgroup key={g} label={g}>{units.filter((u) => (u.group ?? "") === g).map(option)}</optgroup>) : units.map(option)}
      </select>
    </div>
  );
}

export default function UnitConverter() {
  const [cat, setCat] = useState<UnitCategory>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState("cm");
  const [to, setTo] = useState("in");
  const [spin, setSpin] = useState(0);
  const id = useId();
  const def = getUnitCategory(cat);
  const fromU = def.units.find((u) => u.id === from)!;
  const toU = def.units.find((u) => u.id === to)!;

  useEffect(() => {
    track("tool_opened", { tool: "unit-converter" });
  }, []);

  const outcome = useMemo(() => convert(cat, value, from, to), [cat, value, from, to]);

  const pickCategory = (c: UnitCategory) => {
    const d = getUnitCategory(c);
    setCat(c);
    setFrom(d.defaults[0]);
    setTo(d.defaults[1]);
    if (c === "temperature" && (value === "" || value === "1")) setValue("20");
    else if (c !== "temperature" && value.trim().startsWith("-")) setValue("1");
  };

  const table = useMemo(() => {
    const vals = cat === "temperature" ? ["-40", "0", "20", "37", "100"] : ["1", "5", "10", "25", "100"];
    return vals.map((v) => {
      const o = convert(cat, v, from, to);
      return { v, out: o.status === "ok" ? formatQuantity(o.value) : "—" };
    });
  }, [cat, from, to]);

  return (
    <div className="grid gap-4">
      <Panel className="overflow-hidden">
        <div role="tablist" aria-label="Unit category" className="flex gap-1 overflow-x-auto border-b border-line bg-ivory p-1.5 [scrollbar-width:none]">
          {UNIT_CATEGORIES.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => pickCategory(c.id)}
                className={clsx("relative shrink-0 whitespace-nowrap rounded-[10px] px-3.5 py-2 text-[0.9rem] font-medium transition-colors", active ? "text-charcoal" : "text-ink-2 hover:text-charcoal")}
              >
                {active && (
                  <motion.span layoutId={`${id}-cat`} className="absolute inset-0 rounded-[10px] border border-line-strong bg-card shadow-[0_1px_2px_rgba(37,37,37,0.08)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <span className="relative">{c.name}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0">
            <label htmlFor={`${id}-v`} className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-ink-2">
              Amount
            </label>
            <div className="relative">
              <input
                id={`${id}-v`}
                inputMode="decimal"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="h-16 w-full rounded-[12px] border border-line-strong bg-card pl-4 pr-20 font-mono text-[1.8rem] tracking-tight outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-lg text-ink-2">{fromU.symbol}</span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <UnitSelect id={`${id}-from`} label="From" units={def.units} value={from} onChange={setFrom} />
              <motion.button
                type="button"
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                  setSpin((s) => s + 180);
                }}
                animate={{ rotate: spin }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                aria-label="Swap units"
                className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-card text-charcoal transition-colors hover:border-orange hover:text-orange-ink"
              >
                <ArrowLeftRight className="size-4" />
              </motion.button>
              <UnitSelect id={`${id}-to`} label="To" units={def.units} value={to} onChange={setTo} />
            </div>
            <button
              type="button"
              onClick={() => setValue("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
            >
              <Eraser aria-hidden className="size-3.5" /> Clear
            </button>
          </div>

          <div aria-live="polite" className="flex min-w-0 flex-col rounded-[14px] bg-charcoal p-5 text-ivory sm:p-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ivory/60">Result</p>
            {outcome.status === "ok" ? (
              <>
                <p className="mt-3 break-all font-mono text-[clamp(2rem,1.4rem+2.5vw,3rem)] leading-tight tracking-tight" data-testid="unit-result">
                  {formatQuantity(outcome.value)} <span className="text-[0.55em] text-ivory/70">{toU.symbol}</span>
                </p>
                <p className="mt-3 font-mono text-sm text-ivory/70">
                  {value.trim()} {fromU.symbol} = {formatQuantity(outcome.value)} {toU.symbol}
                  <span className="ml-2 font-sans">
                    ({fromU.name} → {toU.name})
                  </span>
                </p>
                <div className="mt-auto pt-5">
                  <CopyButton
                    text={() => plainQuantity(outcome.value)}
                    variant="primary"
                    label="Copy result"
                    onCopied={() => track("copy_clicked", { tool: "unit-converter", format: cat })}
                  />
                </div>
              </>
            ) : outcome.status === "error" ? (
              <p className="mt-4 flex items-start gap-2 text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-orange" />
                {outcome.message}
              </p>
            ) : (
              <p className="mt-3 font-mono text-[clamp(2rem,1.4rem+2.5vw,3rem)] leading-tight text-ivory/20">—</p>
            )}
          </div>
        </div>

        <div className="grid gap-6 border-t border-line bg-ivory/50 p-5 sm:p-7 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-sm font-bold">Common conversions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setCat(ex.cat);
                    setFrom(ex.from);
                    setTo(ex.to);
                    setValue(ex.v);
                  }}
                  className="rounded-full border border-line-strong bg-card px-3 py-1.5 font-mono text-[0.8rem] transition-colors hover:border-charcoal"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">
              Quick table · {fromU.symbol} → {toU.symbol}
            </p>
            <table className="mt-3 w-full font-mono text-[0.82rem]">
              <tbody>
                {table.map((row) => (
                  <tr key={row.v} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-ink-2">
                      {row.v} {fromU.symbol}
                    </td>
                    <td className="py-1.5 text-right">
                      {row.out} {toU.symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
      {cat === "data" && (
        <p className="px-1 text-sm text-ink-2">
          Decimal units (kB, MB, GB, TB) step by 1,000; binary units (KiB, MiB, GiB, TiB) step by 1,024. Storage makers use decimal units, while many operating
          systems report binary sizes — which is why a 1 TB drive shows about 931 GiB.
        </p>
      )}
      {cat === "volume" && <p className="px-1 text-sm text-ink-2">Gallons and fluid ounces are US customary units. UK imperial gallons (4.546 L) are larger.</p>}
    </div>
  );
}
