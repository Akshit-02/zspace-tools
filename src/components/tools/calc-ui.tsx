"use client";

import { clsx } from "clsx";
import { RotateCcw } from "lucide-react";

/**
 * Shared calculator form pieces: a labelled numeric field with prefix/suffix,
 * inline validation and help text, plus small result helpers. Calculation
 * logic lives in src/lib/* and never in these components.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  error,
  hint,
  placeholder,
  integer,
  className,
  size = "md",
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  error?: string | null;
  hint?: React.ReactNode;
  placeholder?: string;
  integer?: boolean;
  className?: string;
  size?: "md" | "lg";
}) {
  const describedBy = [error ? `${id}-err` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-ink-2">{prefix}</span>}
        <input
          id={id}
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(
            "w-full rounded-[10px] border bg-card font-mono tabular-nums text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]",
            size === "lg" ? "h-14 text-[1.35rem]" : "h-11 text-[0.98rem]",
            error ? "border-error/70" : "border-line-strong",
            prefix ? (prefix.length > 2 ? "pl-14" : "pl-9") : "pl-3.5",
            suffix ? (suffix.length > 3 ? "pr-20" : "pr-12") : "pr-3.5",
          )}
        />
        {suffix && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-2">{suffix}</span>}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-[#8f2f27]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Choice chips (radiogroup) — wraps on small screens instead of overflowing. */
export function Chips<T extends string | number>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={clsx("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx("h-10 min-w-[3rem] rounded-[10px] border px-3 text-sm font-medium transition-colors", o.value === value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card text-charcoal hover:border-charcoal")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One labelled figure in a dark result card. */
export function Figure({ label, value, strong, testId }: { label: string; value: React.ReactNode; strong?: boolean; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={clsx("text-sm", strong ? "font-medium text-ivory" : "text-ivory/70")}>{label}</dt>
      <dd data-testid={testId} className={clsx("text-right font-mono tabular-nums [overflow-wrap:anywhere]", strong ? "text-[1.2rem]" : "text-[0.98rem]")}>
        {value}
      </dd>
    </div>
  );
}

export function ResetButton({ onClick, dark }: { onClick: () => void; dark?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={clsx("inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm transition-colors", dark ? "text-ivory/70 hover:text-ivory" : "text-ink-2 hover:bg-ivory-2 hover:text-charcoal")}>
      <RotateCcw aria-hidden className="size-4" /> Reset
    </button>
  );
}

/** Formula / assumptions box shown under a calculator. */
export function Formula({ title = "How it's calculated", children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-[14px] border border-line bg-card px-5 py-4 open:pb-5">
      <summary className="cursor-pointer list-none text-sm font-bold marker:hidden">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
        {title}
      </summary>
      <div className="mt-3 space-y-2 text-sm text-ink-2 [&_code]:rounded-[4px] [&_code]:bg-ivory-2 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.82rem] [&_code]:text-charcoal">{children}</div>
    </details>
  );
}

/**
 * Dark result card shared by the calculators: eyebrow, then the result,
 * an error (role=alert) or an empty hint — with Reset available in every state.
 */
export function ResultCard({
  eyebrow,
  state,
  error,
  empty,
  onReset,
  children,
  footer,
  sticky = true,
}: {
  eyebrow: string;
  state: "ok" | "error" | "empty";
  error?: string;
  empty: string;
  onReset: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <div aria-live="polite" className={clsx("flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8", sticky && "lg:sticky lg:top-24 lg:self-start")}>
      <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
        <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> {eyebrow}
      </p>
      {state === "ok" ? (
        children
      ) : (
        <>
          {state === "error" ? (
            <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
              <span aria-hidden className="mt-2 inline-block size-2 shrink-0 rounded-full bg-orange" /> {error}
            </p>
          ) : (
            <p className="mt-6 text-ivory/60">{empty}</p>
          )}
          <div className="mt-4">
            <ResetButton dark onClick={onReset} />
          </div>
        </>
      )}
      {footer && <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55">{footer}</p>}
    </div>
  );
}

export function DarkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
      {children}
    </button>
  );
}

/**
 * Prints a plain calculation summary (title, label/value rows, notes). Built
 * with text nodes only, then printed through the shared print-root mechanism.
 */
export async function printSummary(title: string, rows: [string, string][], notes: string[] = []) {
  const { printElement } = await import("@/lib/print");
  const box = document.createElement("div");
  box.style.cssText = "font-family: system-ui, sans-serif; color: #252525; padding: 24px; max-width: 640px";
  const h = document.createElement("h1");
  h.textContent = title;
  h.style.cssText = "font-size: 22px; margin: 0 0 4px";
  const sub = document.createElement("p");
  sub.textContent = `ZSpace Tools · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  sub.style.cssText = "color: #77716B; font-size: 12px; margin: 0 0 16px";
  const table = document.createElement("table");
  table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 14px";
  for (const [k, v] of rows) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = k;
    th.style.cssText = "text-align: left; font-weight: 500; padding: 7px 0; border-bottom: 1px solid #E8DED2";
    const td = document.createElement("td");
    td.textContent = v;
    td.style.cssText = "text-align: right; padding: 7px 0; border-bottom: 1px solid #E8DED2; font-family: ui-monospace, Menlo, monospace";
    tr.append(th, td);
    table.append(tr);
  }
  box.append(h, sub, table);
  for (const n of notes) {
    const p = document.createElement("p");
    p.textContent = n;
    p.style.cssText = "font-size: 12px; color: #77716B; margin: 12px 0 0";
    box.append(p);
  }
  printElement(box);
}
