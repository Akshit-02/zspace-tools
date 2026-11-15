"use client";

/** Shared inputs and rules panel for the Stamp Duty and Registration Charges calculators. */
import { useMemo } from "react";
import { NumberField } from "./calc-ui";
import { Panel } from "./ui";
import { Select, StatusBadge, parseForm, type FieldSpec } from "./india-ui";
import { BUYERS, PROPERTY_RULES_VERIFIED, STATES, STATE_OPTIONS, UNSUPPORTED_STATES, fmtDate, type Buyer, type ChargeInput, type PropertyType } from "@/lib/loans/property-rules";
import type { Source } from "@/lib/india/rules";
import { ExternalLink } from "lucide-react";

export type ChargeForm = { stateId: string; areaId: string; type: PropertyType; buyer: Buyer; value: string; guidance: string; date: string; manualPct: string };
export const CHARGE_DEFAULT: ChargeForm = { stateId: "maharashtra", areaId: "mumbai", type: "residential", buyer: "male", value: "10000000", guidance: "", date: "2026-11-15", manualPct: "" };
const SPECS: Record<"value" | "guidance" | "manualPct", FieldSpec> = {
  value: { label: "Transaction value", min: 1, max: 1e11 },
  guidance: { label: "Guidance / circle-rate value", min: 0, max: 1e11, optional: true },
  manualPct: { label: "Rate", min: 0, max: 20, optional: true },
};

export function useChargeInput(f: ChargeForm) {
  return useMemo(() => {
    const p = parseForm({ value: f.value, guidance: f.guidance, manualPct: f.manualPct }, SPECS);
    if (!p.ok) return p;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) return { ok: false as const, field: null, message: "" };
    const input: ChargeInput = { stateId: f.stateId, areaId: f.areaId, type: f.type, buyer: f.buyer, value: p.v.value, guidance: p.v.guidance, date: f.date };
    return { ok: true as const, input, manualPct: p.v.manualPct, manualEntered: f.manualPct.trim() !== "" };
  }, [f]);
}

export function ChargeInputs({ f, setF, idp, err, manualLabel, showManual }: { f: ChargeForm; setF: (fn: (x: ChargeForm) => ChargeForm) => void; idp: string; err: (k: "value" | "guidance" | "manualPct") => string | null; manualLabel: string; showManual: boolean }) {
  const state = STATES.find((s) => s.id === f.stateId);
  const set = <K extends keyof ChargeForm>(k: K, v: ChargeForm[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Panel className="grid content-start gap-5 p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select id={`${idp}-state`} label="State / union territory" value={f.stateId} onChange={(v) => setF((x) => ({ ...x, stateId: v, areaId: STATES.find((s) => s.id === v)?.areas[0].id ?? "" }))} options={STATE_OPTIONS} />
        {state && state.areas.length > 1 ? <Select id={`${idp}-area`} label="Area" value={f.areaId} onChange={(v) => set("areaId", v)} options={state.areas.map((a) => ({ value: a.id, label: a.label }))} /> : <div className="hidden sm:block" />}
        <Select id={`${idp}-type`} label="Property type" value={f.type} onChange={(v) => set("type", v)} options={[{ value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" }, { value: "land", label: "Land or plot" }]} />
        <Select id={`${idp}-buyer`} label="Buyer" value={f.buyer} onChange={(v) => set("buyer", v)} options={BUYERS} hint="Only used where a verified concession depends on it." />
      </div>
      <NumberField id={`${idp}-value`} label="Transaction (agreement) value" prefix="₹" value={f.value} onChange={(v) => set("value", v)} error={err("value")} size="lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id={`${idp}-guid`} label="Guidance / circle-rate value (optional)" prefix="₹" value={f.guidance} onChange={(v) => set("guidance", v)} error={err("guidance")} hint={state ? `Basis: ${state.basis.toLowerCase()}.` : "Most states use the higher of the two."} />
        <div>
          <label htmlFor={`${idp}-date`} className="mb-1.5 block text-sm font-medium">Registration date</label>
          <input id={`${idp}-date`} type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3" />
          <p className="mt-1.5 text-xs text-ink-2">Rules are applied by the date they took effect.</p>
        </div>
      </div>
      {showManual && <NumberField id={`${idp}-manual`} label={manualLabel} suffix="% of value" value={f.manualPct} onChange={(v) => set("manualPct", v)} error={err("manualPct")} hint="Use the rate your registrar or lawyer gives you — we don't suggest one." />}
    </Panel>
  );
}

export function CoveragePanel({ kind, sources, notes }: { kind: "stamp" | "registration"; sources: Source[]; notes: string[] }) {
  const supported = STATES.filter((s) => (kind === "stamp" ? !s.stampUnsupported && s.areas.some((a) => a.stamp) : !s.registrationUnsupported && s.areas.some((a) => a.registration)));
  const partial = STATES.filter((s) => !supported.includes(s));
  return (
    <Panel className="grid gap-4 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Coverage and sources</h2>
        <p className="text-xs text-ink-2">Rules last checked {fmtDate(PROPERTY_RULES_VERIFIED)} · residential sale deeds only</p>
      </div>
      <dl className="grid gap-2 text-sm" data-testid={`${kind}-coverage`}>
        <div>
          <dt className="font-medium">Calculated (base rate verified on an official source)</dt>
          <dd className="text-ink-2">{supported.map((s) => s.name).join(", ")}</dd>
        </div>
        <div>
          <dt className="font-medium">Not calculated — enter the rate yourself</dt>
          <dd className="text-ink-2">
            {[...partial.map((s) => s.name), ...UNSUPPORTED_STATES.map((s) => s.name)].join(", ")}, and every other state and union territory. Commercial property and land in all states.
          </dd>
        </div>
      </dl>
      {notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {sources.length > 0 && (
        <div className="border-t border-line pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-ink-2">Sources for this result</p>
          <ul className="space-y-1 text-sm">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-line-strong underline-offset-2 hover:decoration-orange">
                  {s.label} <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
        <StatusBadge status="verified" /> read on an official source · <StatusBadge status="secondary" /> from secondary sources — confirm before relying on it
      </p>
    </Panel>
  );
}
