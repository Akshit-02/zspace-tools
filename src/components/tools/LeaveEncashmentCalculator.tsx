"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, Select, inr, parseForm, type FieldSpec } from "./india-ui";
import { leaveEncashment } from "@/lib/india/payroll";
import { LEAVE_RULES, type TaxYearId } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "days" | "salary" | "customDivisor" | "averageSalary" | "yearsOfService" | "leaveEarnedPerYear" | "leaveTaken";
const DEFAULT: Record<K, string> = { days: "120", salary: "60000", customDivisor: "", averageSalary: "60000", yearsOfService: "12", leaveEarnedPerYear: "30", leaveTaken: "200" };
const SPECS: Record<K, FieldSpec> = {
  days: { label: "Leave days to encash", min: 0, max: 10000 },
  salary: { label: "Monthly salary for encashment", min: 0, max: 1e8 },
  customDivisor: { label: "Days in a month", min: 1, max: 31, optional: true },
  averageSalary: { label: "Average monthly salary (last 10 months)", min: 0, max: 1e8, optional: true },
  yearsOfService: { label: "Completed years of service", min: 0, max: 60, integer: true, optional: true },
  leaveEarnedPerYear: { label: "Leave earned per year", min: 0, max: 365, optional: true },
  leaveTaken: { label: "Leave taken or encashed in service", min: 0, max: 20000, optional: true },
};

export default function LeaveEncashmentCalculator() {
  const [divisor, setDivisor] = useState<"30" | "26" | "custom">("30");
  const [event, setEvent] = useState<"service" | "separation">("separation");
  const [govt, setGovt] = useState(false);
  const [year, setYear] = useState<TaxYearId>("2026-27");
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "leave-encashment-calculator" }), []);

  const needTax = event === "separation" && !govt;
  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const d = divisor === "custom" ? v.customDivisor : +divisor;
    if (!d) return { error: "Enter the number of days your employer divides the monthly salary by.", field: "customDivisor" as K };
    if (needTax && v.averageSalary <= 0) return { error: "Enter your average monthly salary for the last 10 months to work out the tax-free part.", field: "averageSalary" as K };
    return leaveEncashment({ days: v.days, salary: v.salary, divisor: d, event, govt, averageSalary: v.averageSalary, yearsOfService: v.yearsOfService, leaveEarnedPerYear: v.leaveEarnedPerYear, leaveTaken: v.leaveTaken });
  }, [parsed, divisor, event, govt, needTax]);
  const r = res && !("error" in res) ? res : null;
  const state = r ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : res && "error" in res && res.field === k ? res.error : null);

  const summary = (): [string, string][] =>
    r
      ? [
          ["Daily rate", inr(r.daily)],
          ["Leave encashment", inr(r.gross)],
          ...r.limits.map((l) => [l.label, inr(l.amount)] as [string, string]),
          ["Tax-free", inr(r.exempt)],
          ["Taxable", inr(r.taxable)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <NumberField id="le-days" label="Leave days to encash" value={f.days} onChange={(v) => set("days", v)} error={err("days")} size="lg" />
          <NumberField id="le-salary" label="Monthly salary used for encashment" prefix="₹" value={f.salary} onChange={(v) => set("salary", v)} error={err("salary")} hint="Usually basic + DA — check your leave policy." />
          <div>
            <p className="mb-1.5 text-sm font-medium">Daily rate = monthly salary ÷</p>
            <Segmented label="Days in a month" value={divisor} onChange={setDivisor} options={[{ value: "30", label: "30 days" }, { value: "26", label: "26 working days" }, { value: "custom", label: "Other" }]} />
          </div>
          {divisor === "custom" && <NumberField id="le-div" label="Days in a month" value={f.customDivisor} onChange={(v) => set("customDivisor", v)} error={err("customDivisor")} />}
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <Select id="le-event" label="When is it paid?" value={event} onChange={setEvent} options={[{ value: "separation", label: "On retirement or resignation" }, { value: "service", label: "While still in service" }]} />
            <Select id="le-year" label="Tax year" value={year} onChange={setYear} options={[{ value: "2026-27", label: "2026-27 (Income-tax Act 2025)" }, { value: "2025-26", label: "FY 2025-26 (Income-tax Act 1961)" }]} />
          </div>
          <Toggle checked={govt} onChange={setGovt} label="Central or State Government employee" description="Encashment on retirement is fully tax-free" />
          {needTax && (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="le-avg" label="Average monthly salary, last 10 months" prefix="₹" value={f.averageSalary} onChange={(v) => set("averageSalary", v)} error={err("averageSalary")} hint="Basic + DA (if part of retirement benefits) + turnover commission." />
              <NumberField id="le-years" label="Completed years of service" value={f.yearsOfService} onChange={(v) => set("yearsOfService", v)} error={err("yearsOfService")} integer />
              <NumberField id="le-earned" label="Leave earned per year" value={f.leaveEarnedPerYear} onChange={(v) => set("leaveEarnedPerYear", v)} error={err("leaveEarnedPerYear")} hint="Only up to 30 days a year counts." />
              <NumberField id="le-taken" label="Leave taken or encashed during service" value={f.leaveTaken} onChange={(v) => set("leaveTaken", v)} error={err("leaveTaken")} />
            </div>
          )}
        </Panel>

        <ResultCard eyebrow="Leave encashment" state={state} error={errorMsg} empty="Enter leave days and monthly salary." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {r && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="le-gross">
                {inr(r.gross)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">{parsed.ok ? parsed.v.days : ""} days × {inr(r.daily)} a day</p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                {r.limits.map((l) => (
                  <Figure key={l.label} label={l.label} value={inr(l.amount)} />
                ))}
                <Figure label="Tax-free" value={inr(r.exempt)} testId="le-exempt" />
                <Figure label="Taxable (added to salary)" value={inr(r.taxable)} strong testId="le-taxable" />
              </dl>
              <DarkNotes notes={[r.basis, ...(needTax ? [`The ₹25 lakh limit is a lifetime limit across all employers, under ${LEAVE_RULES.section[year]}.`] : [])]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Leave encashment — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "leave-encashment-calculator" })} />
                <DarkButton onClick={() => printSummary("Leave encashment", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      <RulesPanel
        effective={`Limit ₹25 lakh from 1 April 2023; ${LEAVE_RULES.section[year]}`}
        rows={[
          { label: "Non-government — tax-free limit", value: `₹${(LEAVE_RULES.exemptLimitNonGovt / 1e5).toFixed(0)} lakh (lifetime)`, status: LEAVE_RULES.status },
          { label: "Average salary", value: `Last ${LEAVE_RULES.monthsAverage} months before retirement or resignation`, status: LEAVE_RULES.status },
          { label: "Leave credit", value: `Up to ${LEAVE_RULES.daysPerYearCap} days for each completed year`, status: LEAVE_RULES.status },
          { label: "Government employees", value: "Fully tax-free on retirement", status: LEAVE_RULES.status },
          { label: "Encashment during service", value: "Fully taxable", status: LEAVE_RULES.status },
          { label: "Days in a month (26 or 30)", value: "Your employer's policy, not a statutory rule" },
        ]}
        sources={LEAVE_RULES.sources}
        notes={[LEAVE_RULES.note]}
      />

      <Formula>
        <p>Encashment = monthly salary ÷ days in a month × leave days.</p>
        <p>
          Tax-free part (non-government, on leaving): least of the amount received, ₹25 lakh, 10 months&rsquo; average salary, and unused leave credit × average salary ÷ 30. Leave credit = (leave earned per year, up to 30) × completed years − leave taken or encashed.
        </p>
      </Formula>
    </div>
  );
}
