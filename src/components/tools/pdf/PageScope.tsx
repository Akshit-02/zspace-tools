"use client";

import { clsx } from "clsx";
import type { Scope } from "@/lib/pdf-stamp";

const OPTIONS: { value: Scope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "first", label: "First" },
  { value: "last", label: "Last" },
  { value: "odd", label: "Odd" },
  { value: "even", label: "Even" },
  { value: "range", label: "Custom" },
];

/** Which pages to apply something to. */
export function PageScope({ scope, range, onScope, onRange, error, label = "Pages", count }: { scope: Scope; range: string; onScope: (s: Scope) => void; onRange: (r: string) => void; error?: string | null; label?: string; count?: number }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-charcoal">
        {label}
        {count !== undefined && !error && <span className="ml-2 font-mono text-xs font-normal text-ink-2">{count} selected</span>}
      </legend>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {OPTIONS.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={scope === o.value} onClick={() => onScope(o.value)} className={clsx("h-9 rounded-[8px] border text-sm", scope === o.value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
            {o.label}
          </button>
        ))}
      </div>
      {scope === "range" && (
        <>
          <input aria-label="Page range" value={range} onChange={(e) => onRange(e.target.value)} placeholder="e.g. 1-3, 7, 10-end" className={clsx("mt-2 h-10 w-full rounded-[8px] border bg-card px-3 font-mono text-sm outline-none focus:border-charcoal", error ? "border-error" : "border-line-strong")} />
          {error && <p className="mt-1 text-xs text-error">{error}</p>}
        </>
      )}
    </fieldset>
  );
}
