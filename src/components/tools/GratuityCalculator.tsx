"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, Select, inr, inr2, parseForm, type FieldSpec } from "./india-ui";
import { codeWages, gratuity, type GratuityCategory, type GratuityEvent } from "@/lib/india/payroll";
import { parseISODate } from "@/lib/age";
import { GRATUITY_RULES } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "wages" | "total" | "years" | "months" | "paid" | "averageSalary";
const DEFAULT: Record<K, string> = { wages: "50000", total: "", years: "7", months: "8", paid: "", averageSalary: "" };
const SPECS: Record<K, FieldSpec> = {
  wages: { label: "Last drawn basic + DA", min: 0, max: 1e8 },
  total: { label: "Total monthly remuneration", min: 0, max: 1e8, optional: true },
  years: { label: "Years", min: 0, max: 60, integer: true, optional: true },
  months: { label: "Months", min: 0, max: 11, integer: true, optional: true },
  paid: { label: "Gratuity actually received", min: 0, max: 1e9, optional: true },
  averageSalary: { label: "Average monthly salary (last 10 months)", min: 0, max: 1e8, optional: true },
};

/** Completed years and months between two ISO dates. */
function service(from: string, to: string) {
  const a = parseISODate(from);
  const b = parseISODate(to);
  if (!a || !b) return null;
  let m = (b.y - a.y) * 12 + (b.m - a.m);
  if (b.d < a.d) m -= 1;
  return m < 0 ? null : { years: Math.floor(m / 12), months: m % 12 };
}

export default function GratuityCalculator() {
  const [input, setInput] = useState<"dates" | "manual">("manual");
  const [from, setFrom] = useState("2018-04-01");
  const [to, setTo] = useState("2026-11-15");
  const [category, setCategory] = useState<GratuityCategory>("permanent");
  const [event, setEvent] = useState<GratuityEvent>("separation");
  const [govt, setGovt] = useState(false);
  const [wageRule, setWageRule] = useState(false);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "gratuity-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    let years = v.years;
    let months = v.months;
    if (input === "dates") {
      const s = service(from, to);
      if (!s) return { error: "Enter a valid joining date before the leaving date." };
      years = s.years;
      months = s.months;
    }
    if (wageRule && v.total > 0 && v.total < v.wages) return { error: "Total remuneration can't be less than basic + DA." };
    const cw = wageRule && v.total > 0 ? codeWages(v.wages, v.total) : null;
    const wages = cw ? cw.wages : v.wages;
    if (category === "notCovered" && v.averageSalary <= 0) return { error: "Enter your average monthly salary for the last 10 months — it sets the tax-free limit when you're not covered by the Act." };
    return { g: gratuity({ wages, years, months, category, event, govt, paid: v.paid > 0 ? v.paid : null, averageSalary: v.averageSalary }), cw, years, months, wages };
  }, [parsed, input, from, to, category, event, govt, wageRule]);
  const ok = res && !("error" in res) ? res : null;
  const g = ok?.g ?? null;
  const state = g ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);

  const summary = (): [string, string][] =>
    g && ok
      ? [
          ["Service", `${ok.years} years ${ok.months} months`],
          ["Years counted", String(+g.serviceYears.toFixed(4))],
          ["Wages for gratuity", inr(ok.wages)],
          ["Formula", g.formula],
          ["Gratuity", inr2(g.payable)],
          ["Tax-free", inr2(g.exempt)],
          ["Taxable", inr2(g.taxable)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="gr-wages" label="Last drawn basic + DA per month" prefix="₹" value={f.wages} onChange={(v) => set("wages", v)} error={err("wages")} size="lg" />
          <Toggle checked={wageRule} onChange={setWageRule} label="Apply the Labour Code 50% wage rule" description="If allowances are more than half your pay, the excess counts as wages" />
          {wageRule && <NumberField id="gr-total" label="Total monthly remuneration (basic + all allowances)" prefix="₹" value={f.total} onChange={(v) => set("total", v)} error={err("total")} />}
          <div>
            <p className="mb-1.5 text-sm font-medium">Length of service</p>
            <Segmented label="Service input" value={input} onChange={setInput} options={[{ value: "manual", label: "Years and months" }, { value: "dates", label: "Joining and leaving dates" }]} />
          </div>
          {input === "manual" ? (
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="gr-years" label="Years" value={f.years} onChange={(v) => set("years", v)} error={err("years")} integer />
              <NumberField id="gr-months" label="Months" value={f.months} onChange={(v) => set("months", v)} error={err("months")} integer />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="gr-from" className="mb-1.5 block text-sm font-medium">Joining date</label>
                <input id="gr-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3" />
              </div>
              <div>
                <label htmlFor="gr-to" className="mb-1.5 block text-sm font-medium">Leaving date</label>
                <input id="gr-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3" />
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="gr-cat" label="Employment" value={category} onChange={setCategory} options={[{ value: "permanent", label: "Permanent, covered by law" }, { value: "fixedTerm", label: "Fixed-term employee" }, { value: "notCovered", label: "Employer not covered" }]} hint="Covered: establishments with 10 or more employees." />
            <Select id="gr-event" label="Reason for leaving" value={event} onChange={setEvent} options={[{ value: "separation", label: "Resignation / retirement / termination" }, { value: "death", label: "Death or disablement" }]} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5">
            <Toggle checked={govt} onChange={setGovt} label="Government employee" description="Gratuity is fully tax-free" />
            <NumberField id="gr-paid" label="Gratuity actually received (optional)" prefix="₹" value={f.paid} onChange={(v) => set("paid", v)} error={err("paid")} hint="If your employer pays more than the formula, the extra may be taxable." />
            {category === "notCovered" && <NumberField id="gr-avg" label="Average monthly salary, last 10 months" prefix="₹" value={f.averageSalary} onChange={(v) => set("averageSalary", v)} error={err("averageSalary")} />}
          </div>
        </Panel>

        <ResultCard eyebrow="Gratuity" state={state} error={errorMsg} empty="Enter your basic + DA and length of service." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {g && ok && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="gr-amount">
                {inr(g.payable)}
              </p>
              <p className="mt-2 text-sm text-ivory/65" data-testid="gr-reason">
                {g.reason}
              </p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Service" value={`${ok.years}y ${ok.months}m → ${+g.serviceYears.toFixed(2)} years counted`} testId="gr-years" />
                {ok.cw && ok.cw.addBack > 0 && <Figure label="Added to wages (50% rule)" value={inr(ok.cw.addBack)} />}
                <Figure label="Formula" value={g.formula} />
                {g.capped && <Figure label="Capped at" value={inr(GRATUITY_RULES.ceiling)} />}
                <Figure label="Tax-free" value={inr(g.exempt)} testId="gr-exempt" />
                <Figure label="Taxable" value={inr(g.taxable)} strong testId="gr-taxable" />
              </dl>
              <DarkNotes notes={[g.exemptBasis, ...(g.capped ? [`The statutory amount is capped at ₹${GRATUITY_RULES.ceiling.toLocaleString("en-IN")}; your employer may pay more under its own scheme.`] : [])]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Gratuity estimate — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "gratuity-calculator" })} />
                <DarkButton onClick={() => printSummary("Gratuity estimate", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <RulesPanel
        effective="Code on Social Security, 2020 — in force from 21 November 2025"
        rows={[
          { label: "Formula", value: `Wages × ${GRATUITY_RULES.daysPerYear} × years ÷ ${GRATUITY_RULES.divisor}`, status: GRATUITY_RULES.statusFormula },
          { label: "Eligibility", value: `${GRATUITY_RULES.minYearsPermanent} years (permanent) · ${GRATUITY_RULES.minYearsFixedTerm} year (fixed-term) · none on death/disablement`, status: GRATUITY_RULES.statusFormula },
          { label: "Part year", value: "More than 6 months counts as a full year (permanent)", status: GRATUITY_RULES.statusFormula },
          { label: "Maximum gratuity", value: inr(GRATUITY_RULES.ceiling), status: GRATUITY_RULES.statusFormula },
          { label: "Wages", value: `Basic + DA + retaining allowance; allowances above ${GRATUITY_RULES.wageRulePct}% of pay are added back`, status: GRATUITY_RULES.statusFormula },
          { label: "Tax-free limit (non-government)", value: inr(GRATUITY_RULES.taxExemptLimit), status: GRATUITY_RULES.statusTax },
        ]}
        sources={GRATUITY_RULES.sources}
        notes={[GRATUITY_RULES.note, "The ₹20 lakh tax-free limit is assumed to carry over to the Income-tax Act, 2025 — not yet confirmed against its text."]}
      />

      <Formula>
        <p>
          Gratuity = last drawn wages × 15 × completed years of service ÷ 26 (15 days&rsquo; wages per year, a month taken as 26 working days). For permanent staff, a final part year of more than six months counts as a full year; fixed-term employees get it pro rata.
        </p>
        <p>Tax-free amount (non-government): least of the gratuity received, ₹20 lakh, and the statutory amount (or half a month&rsquo;s average salary per completed year if your employer isn&rsquo;t covered).</p>
      </Formula>
    </div>
  );
}
