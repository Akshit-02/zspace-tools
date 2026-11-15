"use client";

/** Shared pieces for the Indian salary, tax and payroll calculators. */
import { BadgeCheck, CircleAlert, ExternalLink, Info } from "lucide-react";
import { clsx } from "clsx";
import { parseNum } from "@/lib/discount";
import { money } from "@/lib/emi";
import { LAST_VERIFIED, STATUS_TEXT, TAX_YEARS, type Source, type Status, type TaxYearId } from "@/lib/india/rules";
import { Panel, Segmented } from "./ui";

export const inr = money("INR", 0);
export const inr2 = money("INR", 2);
export const pct = (n: number, d = 2) => `${+n.toFixed(d)}%`;

export const DISCLAIMER = "An estimate based on the rules shown below, not tax, legal or payroll advice. Your employer's policy, payroll software and the final law may differ — check with your employer or a tax professional before acting on it.";

export type FieldSpec = { label: string; min?: number; max?: number; integer?: boolean; optional?: boolean };
export type Parsed<K extends string> = { ok: true; v: Record<K, number> } | { ok: false; field: K | null; message: string };

/**
 * Validates a form of numeric strings. Empty optional fields count as 0; an
 * empty required field gives the "empty" state (field null).
 */
export function parseForm<K extends string>(form: Record<K, string>, specs: Record<K, FieldSpec>): Parsed<K> {
  const v = {} as Record<K, number>;
  for (const k of Object.keys(specs) as K[]) {
    const s = specs[k];
    const n = parseNum(form[k] ?? "");
    if (n === null) {
      if (s.optional) {
        v[k] = 0;
        continue;
      }
      return { ok: false, field: null, message: "" };
    }
    if (Number.isNaN(n) || !Number.isFinite(n)) return { ok: false, field: k, message: `${s.label} must be a number.` };
    if (s.integer && !Number.isInteger(n)) return { ok: false, field: k, message: `${s.label} must be a whole number.` };
    if (s.min !== undefined && n < s.min) return { ok: false, field: k, message: `${s.label} can't be less than ${s.min.toLocaleString("en-IN")}.` };
    if (s.max !== undefined && n > s.max) return { ok: false, field: k, message: `${s.label} can't be more than ${s.max.toLocaleString("en-IN")}.` };
    v[k] = n;
  }
  return { ok: true, v };
}

export function YearPicker({ value, onChange }: { value: TaxYearId; onChange: (v: TaxYearId) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Year</p>
      <Segmented
        label="Tax year"
        value={value}
        onChange={onChange}
        options={[
          { value: "2026-27", label: "2026-27", hint: "Income-tax Act 2025" },
          { value: "2025-26", label: "FY 2025-26", hint: "Income-tax Act 1961" },
        ]}
      />
    </div>
  );
}

const STATUS_STYLE: Record<Status, string> = {
  verified: "bg-[#E4F1E6] text-[#25603A]",
  secondary: "bg-[#F2ECE3] text-charcoal",
  carried: "bg-[#FDE7DC] text-[#9A3D12]",
};
const STATUS_LABEL: Record<Status, string> = { verified: "Verified", secondary: "Secondary sources", carried: "Not yet confirmed" };

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span title={STATUS_TEXT[status]} className={clsx("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-medium", STATUS_STYLE[status])}>
      {status === "verified" ? <BadgeCheck aria-hidden className="size-3.5" /> : status === "carried" ? <CircleAlert aria-hidden className="size-3.5" /> : <Info aria-hidden className="size-3.5" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

/** The rules a calculator used: values, effective period, verification status and sources. */
export function RulesPanel({ title = "Rules used", effective, rows, sources, notes = [] }: { title?: string; effective: string; rows: { label: string; value: string; status?: Status }[]; sources: Source[]; notes?: string[] }) {
  return (
    <Panel className="grid gap-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-xs text-ink-2">
          Effective: {effective} · Rules last checked {new Date(LAST_VERIFIED + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <dl className="divide-y divide-line text-sm" data-testid="rules-panel">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
            <dt className="text-ink-2">{r.label}</dt>
            <dd className="flex flex-wrap items-center gap-2 text-right font-medium">
              {r.value}
              {r.status && <StatusBadge status={r.status} />}
            </dd>
          </div>
        ))}
      </dl>
      {notes.length > 0 && (
        <ul className="space-y-1.5 text-sm text-ink-2">
          {notes.map((n) => (
            <li key={n} className="flex gap-2">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> {n}
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-line pt-3">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-2">Sources</p>
        <ul className="space-y-1 text-sm">
          {sources.map((s) => (
            <li key={s.url + s.label}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-line-strong underline-offset-2 hover:decoration-orange">
                {s.label} <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-2">
          <strong className="font-medium text-charcoal">Status:</strong> Verified — {STATUS_TEXT.verified.toLowerCase()}. Secondary sources — {STATUS_TEXT.secondary.toLowerCase()}. Not yet confirmed — {STATUS_TEXT.carried.toLowerCase()}.
        </p>
      </div>
    </Panel>
  );
}

/** Notes list inside the dark result card. */
export function DarkNotes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <ul className="mt-4 space-y-1.5 text-sm text-ivory/75">
      {notes.map((n) => (
        <li key={n} className="flex gap-2">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> {n}
        </li>
      ))}
    </ul>
  );
}

export const yearMeta = (y: TaxYearId) => TAX_YEARS[y];

export function Select<T extends string>({ id, label, value, onChange, options, hint }: { id: string; label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="h-11 w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

/** Two-column label/value table on a light panel. */
export function Rows({ rows, testId }: { rows: [string, string, boolean?][]; testId?: string }) {
  return (
    <dl className="divide-y divide-line text-sm" data-testid={testId}>
      {rows.map(([k, v, strong]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2">
          <dt className={clsx(strong ? "font-medium" : "text-ink-2")}>{k}</dt>
          <dd className={clsx("text-right font-mono tabular-nums", strong && "font-semibold")}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
