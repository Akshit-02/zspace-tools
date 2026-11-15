"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { CopyButton, Notice, Panel, Toggle, inputClass } from "./ui";
import { DarkButton, Figure, Formula, NumberField, ResultCard, printSummary } from "./calc-ui";
import { DISCLAIMER, DarkNotes, RulesPanel, Select, YearPicker, inr, parseForm, type FieldSpec } from "./india-ui";
import { hraExemption, isMetro, type HraMonth } from "@/lib/india/payroll";
import { parseNum } from "@/lib/discount";
import { HRA_RULES, TAX_YEARS, type TaxYearId } from "@/lib/india/rules";
import { track } from "@/lib/analytics";

type K = "basic" | "da" | "hra" | "rent" | "months";
const DEFAULT: Record<K, string> = { basic: "50000", da: "", hra: "25000", rent: "20000", months: "12" };
const SPECS: Record<K, FieldSpec> = {
  basic: { label: "Basic salary", min: 0, max: 1e9 },
  da: { label: "DA", min: 0, max: 1e9, optional: true },
  hra: { label: "HRA received", min: 0, max: 1e9 },
  rent: { label: "Rent paid", min: 0, max: 1e9 },
  months: { label: "Months", min: 1, max: 12, integer: true },
};
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const OTHER = "Other city";
const CITIES = ["Mumbai", "Delhi", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad", OTHER];
type Row = { rent: string; city: string };

function computeHra(parsed: ReturnType<typeof parseForm<K>>, monthWise: boolean, rows: Row[], city: string, year: TaxYearId) {
    if (!parsed.ok) return null;
    const v = parsed.v;
    const salary = v.basic + v.da;
    let months: HraMonth[];
    if (monthWise) {
      months = [];
      for (const [i, r] of rows.entries()) {
        const rent = parseNum(r.rent);
        if (rent !== null && (Number.isNaN(rent) || rent < 0)) return { error: `Rent for ${MONTHS[i]} must be a positive number.` };
        months.push({ salary, hra: v.hra, rent: rent ?? 0, metro: r.city !== OTHER && isMetro(r.city, year) });
      }
    } else months = Array.from({ length: v.months }, () => ({ salary, hra: v.hra, rent: v.rent, metro: city !== OTHER && isMetro(city, year) }));
    return hraExemption(months, year);
}

export default function HraCalculator() {
  const [year, setYear] = useState<TaxYearId>("2026-27");
  const [city, setCity] = useState("Bengaluru");
  const [f, setF] = useState(DEFAULT);
  const [monthWise, setMonthWise] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => MONTHS.map(() => ({ rent: "20000", city: "Bengaluru" })));
  const set = (k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => track("tool_opened", { tool: "hra-calculator" }), []);

  const parsed = useMemo(() => parseForm(f, SPECS), [f]);
  const res = useMemo(() => computeHra(parsed, monthWise, rows, city, year), [parsed, monthWise, rows, city, year]);
  const ok = res && !("error" in res) ? res : null;
  const state = ok ? "ok" : (!parsed.ok && parsed.field) || (res && "error" in res) ? "error" : "empty";
  const errorMsg = !parsed.ok ? parsed.message : res && "error" in res ? res.error : undefined;
  const err = (k: K) => (!parsed.ok && parsed.field === k ? parsed.message : null);
  const H = HRA_RULES[year];
  const metroNow = city !== OTHER && isMetro(city, year);
  const bindingText = ok ? (ok.exempt === ok.limitActual ? "the HRA you receive" : ok.exempt === ok.limitRent ? "rent paid minus 10% of salary" : `${metroNow ? H.metroPct : H.otherPct}% of salary`) : "";

  const summary = (): [string, string][] =>
    ok
      ? [
          ["Year", TAX_YEARS[year].label],
          ["HRA received", inr(ok.hra)],
          ["Rent paid", inr(ok.rent)],
          ["Basic + DA", inr(ok.salary)],
          ["Limit 1 — HRA received", inr(ok.limitActual)],
          ["Limit 2 — rent − 10% of salary", inr(ok.limitRent)],
          ["Limit 3 — % of salary by city", inr(ok.limitCity)],
          ["Exempt HRA", inr(ok.exempt)],
          ["Taxable HRA", inr(ok.taxable)],
        ]
      : [];

  return (
    <div className="grid gap-4">
      <Notice>
        HRA exemption is available only in the <strong>old tax regime</strong>. In the new regime (the default), all HRA is taxable — compare both in the <Link className="underline" href="/income-tax-calculator/">Income Tax Calculator</Link>.
      </Notice>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
        <Panel className="grid content-start gap-5 p-5 sm:p-7">
          <YearPicker value={year} onChange={setYear} />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="hra-basic" label="Basic salary per month" prefix="₹" value={f.basic} onChange={(v) => set("basic", v)} error={err("basic")} />
            <NumberField id="hra-da" label="DA per month (if part of retirement benefits)" prefix="₹" value={f.da} onChange={(v) => set("da", v)} error={err("da")} />
            <NumberField id="hra-hra" label="HRA received per month" prefix="₹" value={f.hra} onChange={(v) => set("hra", v)} error={err("hra")} />
            {!monthWise && <NumberField id="hra-rent" label="Rent paid per month" prefix="₹" value={f.rent} onChange={(v) => set("rent", v)} error={err("rent")} />}
          </div>
          {!monthWise && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="hra-city" label="City where you rent" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c === OTHER ? "Any other city" : `${c}${isMetro(c, year) ? " (50%)" : " (40%)"}` }))} />
              <NumberField id="hra-months" label="Months rented this year" value={f.months} onChange={(v) => set("months", v)} error={err("months")} integer />
            </div>
          )}
          <Toggle checked={monthWise} onChange={setMonthWise} label="Rent or city changed during the year" description="Work it out month by month" />
          {monthWise && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-sm">
                <thead className="text-xs text-ink-2">
                  <tr>
                    <th scope="col" className="py-1 text-left font-medium">Month</th>
                    <th scope="col" className="py-1 text-left font-medium">Rent paid</th>
                    <th scope="col" className="py-1 text-left font-medium">City</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={MONTHS[i]}>
                      <td className="py-1 pr-2">{MONTHS[i]}</td>
                      <td className="py-1 pr-2">
                        <input aria-label={`Rent for ${MONTHS[i]}`} inputMode="decimal" className={`${inputClass} h-9`} value={r.rent} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, rent: e.target.value } : y)))} />
                      </td>
                      <td className="py-1">
                        <select aria-label={`City for ${MONTHS[i]}`} className="h-9 w-full rounded-[10px] border border-line-strong bg-card px-2" value={r.city} onChange={(e) => setRows((x) => x.map((y, j) => (j === i ? { ...y, city: e.target.value } : y)))}>
                          {CITIES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-ink-2">Leave rent blank or 0 for months you didn&rsquo;t pay rent.</p>
            </div>
          )}
        </Panel>

        <ResultCard eyebrow="Exempt HRA for the year" state={state} error={errorMsg} empty="Enter basic salary, HRA and rent." onReset={() => { setF(DEFAULT); setMonthWise(false); }} footer={DISCLAIMER}>
          {ok && (
            <>
              <p className="mt-3 break-all font-mono text-[clamp(2.1rem,1.4rem+3vw,3.3rem)] leading-none tracking-tight" data-testid="hra-exempt">
                {inr(ok.exempt)}
              </p>
              <p className="mt-2 text-sm text-ivory/65">{ok.exempt > 0 ? (monthWise ? "least of the three limits, month by month" : `limited by ${bindingText}`) : "no exemption on these figures"}</p>
              <dl className="mt-4 divide-y divide-ivory/10 border-t border-ivory/10">
                <Figure label="1. HRA received" value={inr(ok.limitActual)} />
                <Figure label="2. Rent paid − 10% of salary" value={inr(ok.limitRent)} />
                <Figure label={monthWise ? "3. 50% / 40% of salary" : `3. ${metroNow ? H.metroPct : H.otherPct}% of salary (${metroNow ? "listed city" : "other city"})`} value={inr(ok.limitCity)} />
                <Figure label="Exempt HRA (least)" value={inr(ok.exempt)} strong />
                <Figure label="Taxable HRA" value={inr(ok.taxable)} testId="hra-taxable" />
              </dl>
              <DarkNotes notes={[...(ok.rent > 100000 ? ["Rent above ₹1,00,000 a year needs your landlord's PAN for your employer to allow the exemption."] : []), ...(ok.rent === 0 ? ["No rent paid, so no HRA exemption."] : [])]} />
              <div className="mt-6 flex flex-wrap gap-2">
                <CopyButton text={() => ["HRA exemption — ZSpace Tools", ...summary().map(([k, v]) => `${k}: ${v}`)].join("\n")} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "hra-calculator" })} />
                <DarkButton onClick={() => printSummary("HRA exemption", summary(), [DISCLAIMER])}>
                  <Printer aria-hidden className="size-4" /> Print
                </DarkButton>
              </div>
            </>
          )}
        </ResultCard>
      </div>

      {ok && monthWise && (
        <Panel className="grid gap-3 p-5 sm:p-7">
          <h2 className="font-display text-xl font-semibold">Month by month</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-sm" data-testid="hra-months">
              <thead className="text-xs text-ink-2">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 text-left font-medium">Month</th>
                  <th scope="col" className="py-2 font-medium">Rent − 10%</th>
                  <th scope="col" className="py-2 font-medium">City limit</th>
                  <th scope="col" className="py-2 font-medium">Exempt</th>
                  <th scope="col" className="py-2 font-medium">Taxable</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {ok.rows.map((r, i) => (
                  <tr key={MONTHS[i]} className="border-b border-line last:border-0">
                    <td className="py-1.5 text-left">{MONTHS[i]}</td>
                    <td className="py-1.5">{inr(r.limitRent)}</td>
                    <td className="py-1.5">{inr(r.limitCity)}</td>
                    <td className="py-1.5">{inr(r.exempt)}</td>
                    <td className="py-1.5">{inr(r.taxable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <RulesPanel
        effective={`${TAX_YEARS[year].period} (${TAX_YEARS[year].act})`}
        rows={[
          { label: "Exempt HRA", value: "Least of: HRA received; rent − 10% of salary; city % of salary", status: H.status },
          { label: "50% cities", value: H.metros.join(", "), status: H.status },
          { label: "Other cities", value: `${H.otherPct}% of salary`, status: H.status },
          { label: "Salary for HRA", value: "Basic + DA (if it counts for retirement benefits) + turnover-based commission" },
          { label: "New regime", value: "No HRA exemption" },
        ]}
        sources={[H.source, ...(year === "2026-27" ? [HRA_RULES["2025-26"].source] : [])]}
        notes={[H.note]}
      />

      <Formula>
        <p>
          Exempt HRA = least of (a) HRA actually received, (b) rent paid minus 10% of salary, and (c) {H.metroPct}% of salary in {H.metros.join(", ")} or {H.otherPct}% elsewhere. &ldquo;Salary&rdquo; means basic + DA (where DA counts for retirement benefits) + commission based on turnover, for the period you rented.
        </p>
        <p>The rest of your HRA is taxable salary. Each month is worked out separately when rent or city changes.</p>
      </Formula>
    </div>
  );
}
