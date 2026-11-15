"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { Donut, CHART } from "./charts";
import { DISCLAIMER, DarkNotes, RulesPanel, Rows, Select, YearPicker, inr, parseForm, type FieldSpec } from "./india-ui";
import { GRATUITY_PROVISION_PCT, splitCtc, takeHome, type SalaryInput } from "@/lib/india/salary";
import { EPF_RULES, ESI_RULES, HRA_RULES, TAX_YEARS, type AgeBand, type Regime, type TaxYearId } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type Mode = "ctc" | "components";
type K = "ctc" | "basicPct" | "hraPct" | "variable" | "otherAllowances" | "basic" | "hra" | "special" | "employerNpsPct" | "professionalTax" | "otherDeductions" | "rentMonthly" | "d80COther" | "ctc2";
const DEFAULT: Record<K, string> = { ctc: "1200000", basicPct: "50", hraPct: "50", variable: "", otherAllowances: "", basic: "600000", hra: "300000", special: "250000", employerNpsPct: "", professionalTax: "2400", otherDeductions: "", rentMonthly: "", d80COther: "", ctc2: "" };
const SPECS: Record<K, FieldSpec> = {
  ctc: { label: "CTC", min: 0, max: 1e10 },
  basicPct: { label: "Basic %", min: 1, max: 100 },
  hraPct: { label: "HRA % of basic", min: 0, max: 100, optional: true },
  variable: { label: "Variable pay", min: 0, max: 1e10, optional: true },
  otherAllowances: { label: "Other allowances", min: 0, max: 1e10, optional: true },
  basic: { label: "Basic + DA", min: 0, max: 1e10 },
  hra: { label: "HRA", min: 0, max: 1e10, optional: true },
  special: { label: "Special allowance", min: 0, max: 1e10, optional: true },
  employerNpsPct: { label: "Employer NPS %", min: 0, max: 14, optional: true },
  professionalTax: { label: "Professional tax", min: 0, max: 100000, optional: true },
  otherDeductions: { label: "Other deductions", min: 0, max: 1e9, optional: true },
  rentMonthly: { label: "Monthly rent", min: 0, max: 1e8, optional: true },
  d80COther: { label: "Other 80C", min: 0, max: 1e9, optional: true },
  ctc2: { label: "Second offer CTC", min: 0, max: 1e10, optional: true },
};
const pick = (o: Record<K, FieldSpec>, keys: K[]) => Object.fromEntries(keys.map((k) => [k, o[k]])) as Record<K, FieldSpec>;
const COMMON: K[] = ["variable", "otherAllowances", "employerNpsPct", "professionalTax", "otherDeductions", "rentMonthly", "d80COther"];

export default function TakeHomeSalaryCalculator() {
  const [mode, setMode] = useState<Mode>("ctc");
  const [year, setYear] = useState<TaxYearId>("2026-27");
  const [regime, setRegime] = useState<Regime>("new");
  const [age, setAge] = useState<AgeBand>("below60");
  const [pfBasis, setPfBasis] = useState<SalaryInput["employerPfBasis"]>("ceiling");
  const [gratuityIn, setGratuityIn] = useState(true);
  const [metro, setMetro] = useState(true);
  const [f, setF] = useState(DEFAULT);
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "take-home-salary-calculator" }), []);

  const keys: K[] = mode === "ctc" ? ["ctc", "basicPct", "hraPct", "ctc2", ...COMMON] : ["basic", "hra", "special", ...COMMON];
  const parsed = useMemo(() => parseForm(f, pick(SPECS, keys)), [f, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = useMemo(() => {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const base = { year, regime, age, da: 0, otherAllowances: v.otherAllowances, variable: v.variable, employerPfBasis: pfBasis, employerNpsPct: v.employerNpsPct, includeGratuity: gratuityIn, professionalTax: v.professionalTax, otherDeductions: v.otherDeductions, rentMonthly: v.rentMonthly, metro, d80COther: v.d80COther };
    const fromCtc = (ctc: number) => {
      const s = splitCtc({ ctc, basicPct: v.basicPct, hraPct: v.hraPct, variable: v.variable, otherAllowances: v.otherAllowances, employerPfBasis: pfBasis, employerNpsPct: v.employerNpsPct, includeGratuity: gratuityIn });
      if ("error" in s) return s;
      return takeHome({ ...base, basic: s.basic, hra: s.hra, special: s.special });
    };
    if (mode === "ctc") {
      const a = fromCtc(v.ctc);
      if ("error" in a) return a;
      const b = v.ctc2 > 0 ? fromCtc(v.ctc2) : null;
      return { a, b: b && !("error" in b) ? b : null, bError: b && "error" in b ? b.error : null };
    }
    return { a: takeHome({ ...base, basic: v.basic, hra: v.hra, special: v.special }), b: null, bError: null };
  }, [parsed, mode, year, regime, age, pfBasis, gratuityIn, metro]);

  const r = run && !("error" in run) ? run : null;
  const a = r?.a ?? null;
  const state = a ? "ok" : (!parsed.ok && parsed.field) || (run && "error" in run) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : run && "error" in run ? run.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);

  const lines = (x: NonNullable<typeof a>): [string, string, boolean?][] => [
    ["Fixed gross salary", inr(x.fixedGross)],
    ...(x.grossWithVariable > x.fixedGross ? ([["Variable / bonus (if paid in full)", inr(x.grossWithVariable - x.fixedGross)]] as [string, string][]) : []),
    ["Employer PF (in CTC, not paid to you)", inr(x.employerPf)],
    ...(x.employerNps ? ([["Employer NPS (in CTC, not paid to you)", inr(x.employerNps)]] as [string, string][]) : []),
    ...(x.gratuity ? ([["Gratuity provision (in CTC, paid only on exit)", inr(x.gratuity)]] as [string, string][]) : []),
    ["CTC", inr(x.ctc), true],
    ["Employee PF (12%)", `− ${inr(x.employeePf)}`],
    ...(x.esiCovered ? ([["Employee ESI (0.75%)", `− ${inr(x.employeeEsi)}`]] as [string, string][]) : []),
    ...(x.professionalTax ? ([["Professional tax", `− ${inr(x.professionalTax)}`]] as [string, string][]) : []),
    ...(x.otherDeductions ? ([["Other deductions", `− ${inr(x.otherDeductions)}`]] as [string, string][]) : []),
    [`Income tax (${x.tax.regime} regime, incl. cess)`, `− ${inr(x.tax.totalTax)}`],
    ["In-hand for the year (incl. variable)", inr(x.annualInHand), true],
    ["In-hand per month (fixed pay)", inr(x.monthlyInHandFixed), true],
  ];

  const summary = (): [string, string][] => (a ? lines(a).map(([k, v]) => [k, v]) : []);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <Segmented label="Input mode" value={mode} onChange={setMode} options={[{ value: "ctc", label: "From CTC", hint: "basic as % of CTC" }, { value: "components", label: "From salary components", hint: "from your offer letter" }]} />
          {mode === "ctc" ? (
            <>
              <NumberField id="th-ctc" label="Annual CTC" prefix="₹" value={f.ctc} onChange={(v) => set("ctc", v)} error={err("ctc")} size="lg" />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField id="th-basicpct" label="Basic + DA as % of CTC" suffix="%" value={f.basicPct} onChange={(v) => set("basicPct", v)} error={err("basicPct")} hint="Often 40–50%. Labour Codes push it towards 50% of pay." />
                <NumberField id="th-hrapct" label="HRA as % of basic" suffix="%" value={f.hraPct} onChange={(v) => set("hraPct", v)} error={err("hraPct")} hint="Often 40% or 50%." />
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="th-basic" label="Basic + DA (yearly)" prefix="₹" value={f.basic} onChange={(v) => set("basic", v)} error={err("basic")} />
              <NumberField id="th-hra" label="HRA (yearly)" prefix="₹" value={f.hra} onChange={(v) => set("hra", v)} error={err("hra")} />
              <NumberField id="th-special" label="Special allowance (yearly)" prefix="₹" value={f.special} onChange={(v) => set("special", v)} error={err("special")} />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="th-var" label="Variable / bonus (yearly)" prefix="₹" value={f.variable} onChange={(v) => set("variable", v)} error={err("variable")} hint="Assumed paid in full." />
            <NumberField id="th-oth" label="Other taxable allowances (yearly)" prefix="₹" value={f.otherAllowances} onChange={(v) => set("otherAllowances", v)} error={err("otherAllowances")} />
          </div>
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <Select id="th-pf" label="Employer PF" value={pfBasis} onChange={setPfBasis} options={[{ value: "ceiling", label: "12% of ₹15,000 cap" }, { value: "actual", label: "12% of full basic" }, { value: "none", label: "No PF" }]} hint="₹1,800 a month on your payslip means the cap is used." />
            <NumberField id="th-nps" label="Employer NPS (% of basic)" suffix="%" value={f.employerNpsPct} onChange={(v) => set("employerNpsPct", v)} error={err("employerNpsPct")} />
          </div>
          <Toggle checked={gratuityIn} onChange={setGratuityIn} label="CTC includes gratuity" description={`${GRATUITY_PROVISION_PCT.toFixed(2)}% of basic — paid only when you leave after qualifying service`} />
          <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <NumberField id="th-pt" label="Professional tax (yearly)" prefix="₹" value={f.professionalTax} onChange={(v) => set("professionalTax", v)} error={err("professionalTax")} hint="Set by your state; up to ₹2,500 a year. Enter 0 if your state has none." />
            <NumberField id="th-od" label="Other deductions (yearly)" prefix="₹" value={f.otherDeductions} onChange={(v) => set("otherDeductions", v)} error={err("otherDeductions")} hint="Canteen, insurance top-ups, etc." />
          </div>
          <div className="grid gap-4 border-t border-line pt-5">
            <YearPicker value={year} onChange={setYear} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-sm font-medium">Tax regime</p>
                <Segmented label="Tax regime" value={regime} onChange={setRegime} options={[{ value: "new", label: "New" }, { value: "old", label: "Old" }]} />
              </div>
              <Select id="th-age" label="Age" value={age} onChange={setAge} options={[{ value: "below60", label: "Below 60" }, { value: "60to79", label: "60 to 79" }, { value: "80plus", label: "80+" }]} />
            </div>
            {regime === "old" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField id="th-rent" label="Rent paid per month" prefix="₹" value={f.rentMonthly} onChange={(v) => set("rentMonthly", v)} error={err("rentMonthly")} />
                <NumberField id="th-80c" label="Other 80C (besides PF)" prefix="₹" value={f.d80COther} onChange={(v) => set("d80COther", v)} error={err("d80COther")} />
                <Toggle checked={metro} onChange={setMetro} label="Rented home is in a 50% city" description={HRA_RULES[year].metros.join(", ")} />
              </div>
            )}
          </div>
          {mode === "ctc" && <NumberField id="th-ctc2" label="Compare with another offer (CTC)" prefix="₹" value={f.ctc2} onChange={(v) => set("ctc2", v)} error={err("ctc2")} hint="Uses the same structure and assumptions." />}
        </Panel>

        <ResultCard eyebrow="In-hand salary per month" state={state} error={errorMsg} empty="Enter your CTC or salary components." onReset={() => setF(DEFAULT)} footer={DISCLAIMER}>
          {a && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="th-monthly">
                {inr(a.monthlyInHandFixed)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">from a CTC of {inr(a.ctc)} · {regime} regime · {TAX_YEARS[year].short}</p>
              <div className="mt-6 flex flex-col items-start gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-5">
                <Donut
                  label={`In-hand ${inr(a.annualInHand)}, deductions and tax ${inr(a.employeeDeductions + a.tax.totalTax)}, employer contributions ${inr(a.ctc - a.grossWithVariable)}`}
                  parts={[{ value: a.annualInHand, color: "rgba(250,247,242,0.9)" }, { value: a.employeeDeductions + a.tax.totalTax, color: CHART.orange }, { value: a.ctc - a.grossWithVariable, color: CHART.muted }]}
                />
                <dl className="grid w-full flex-1 text-sm">
                  <Figure label="In-hand (year)" value={inr(a.annualInHand)} testId="th-annual" />
                  <Figure label="Tax + deductions" value={inr(a.employeeDeductions + a.tax.totalTax)} />
                  <Figure label="Employer-side (not in pay)" value={inr(a.ctc - a.grossWithVariable)} />
                </dl>
              </div>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="Income tax for the year" value={inr(a.tax.totalTax)} testId="th-tax" />
                <Figure label="Employee PF for the year" value={inr(a.employeePf)} testId="th-pf" />
                {a.esiCovered && <Figure label="Employee ESI for the year" value={inr(a.employeeEsi)} testId="th-esi" />}
                {r?.b && <Figure label={`Offer 2 (CTC ${inr(r.b.ctc)}) in-hand / month`} value={`${inr(r.b.monthlyInHandFixed)} (${r.b.monthlyInHandFixed >= a.monthlyInHandFixed ? "+" : "−"}${inr(Math.abs(r.b.monthlyInHandFixed - a.monthlyInHandFixed))})`} strong testId="th-offer2" />}
              </dl>
              <DarkNotes notes={[...(r?.bError ? [`Offer 2: ${r.bError}`] : []), ...(a.esiCovered ? [`Gross pay is within the ESI wage ceiling, so 0.75% ESI is deducted. Your employer also pays ${inr(a.employerEsi)} a year (3.25%); some employers include it in CTC, which isn't modelled here.`] : []), ...a.tax.notes]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["Take-home salary estimate — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "take-home-salary-calculator" })} />
                <DarkButton onClick={() => printSummary("Take-home salary estimate", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {a && (
        <Panel className="grid gap-4 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">CTC to in-hand, line by line</h2>
          <Rows testId="th-lines" rows={lines(a)} />
          <p className="text-sm text-ink-2">
            Each amount appears once: employer PF, NPS and gratuity are part of CTC but never reach your bank account; employee PF, ESI, professional tax and income tax come out of your gross pay. Full tax working is in the{" "}
            <Link className="underline" href="/income-tax-calculator/">Income Tax Calculator</Link>.
          </p>
        </Panel>
      )}

      <RulesPanel
        effective={`${TAX_YEARS[year].period} (${TAX_YEARS[year].act})`}
        rows={[
          { label: "Employee and employer PF", value: `${EPF_RULES.employeePct}% each of basic + DA (ceiling option ₹${EPF_RULES.wageCeiling.toLocaleString("en-IN")}/month)`, status: EPF_RULES.status },
          { label: "ESI", value: `${ESI_RULES.employeePct}% employee, ${ESI_RULES.employerPct}% employer, if gross ≤ ₹${ESI_RULES.wageCeiling.toLocaleString("en-IN")}/month`, status: ESI_RULES.statusCeiling },
          { label: "Gratuity provision", value: `${GRATUITY_PROVISION_PCT.toFixed(4)}% of basic (15/26 of a month a year)`, status: "secondary" },
          { label: "Income tax", value: "As in the Income Tax Calculator, for the year and regime chosen", status: TAX_YEARS[year].status.slabs },
          { label: "Professional tax", value: "Entered by you (varies by state)" },
        ]}
        sources={[...TAX_YEARS[year].sources, ...EPF_RULES.sources.slice(0, 1), ...ESI_RULES.sources.slice(0, 1)]}
      />

      <Formula>
        <p>
          CTC = fixed gross + variable + employer PF + employer NPS + gratuity provision. In CTC mode, basic is the % of CTC you enter, HRA is a % of basic, and the special allowance is what&rsquo;s left after everything else — so the parts always add back to the CTC.
        </p>
        <p>
          Monthly in-hand = (fixed gross − employee PF − ESI − professional tax − other deductions) ÷ 12 − the year&rsquo;s income tax ÷ 12. Variable pay is taxed in the year but left out of the monthly figure because it&rsquo;s usually paid once.
        </p>
      </Formula>
    </div>
  );
}
