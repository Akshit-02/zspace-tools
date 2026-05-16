"use client";
import { useState, useMemo } from "react";
import {
  IndianRupee,
  Copy,
  Check,
  RotateCcw,
  Info,
  ChevronDown,
} from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type Regime = "new" | "old";
type AgeGroup = "below60" | "60to80" | "above80";

// ── NEW REGIME SLABS (FY 2024-25) ──────────────────────────────────────────
const NEW_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 5 },
  { min: 700000, max: 1000000, rate: 10 },
  { min: 1000000, max: 1200000, rate: 15 },
  { min: 1200000, max: 1500000, rate: 20 },
  { min: 1500000, max: Infinity, rate: 30 },
];

// ── OLD REGIME SLABS ────────────────────────────────────────────────────────
const OLD_SLABS: Record<
  AgeGroup,
  { min: number; max: number; rate: number }[]
> = {
  below60: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
  ],
  "60to80": [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
  ],
  above80: [
    { min: 0, max: 500000, rate: 0 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
  ],
};

function calcTax(
  income: number,
  slabs: { min: number; max: number; rate: number }[],
) {
  let tax = 0;
  const breakdown: {
    slab: string;
    taxable: number;
    rate: number;
    tax: number;
  }[] = [];
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    const tax_here = (taxable * slab.rate) / 100;
    tax += tax_here;
    breakdown.push({
      slab:
        slab.max === Infinity
          ? `Above ${formatINR(slab.min)}`
          : `${formatINR(slab.min)} – ${formatINR(slab.max)}`,
      taxable,
      rate: slab.rate,
      tax: tax_here,
    });
  }
  return { tax, breakdown };
}

function surcharge(income: number, tax: number) {
  if (income > 50000000) return tax * 0.37;
  if (income > 20000000) return tax * 0.25;
  if (income > 10000000) return tax * 0.15;
  if (income > 5000000) return tax * 0.1;
  return 0;
}

const DEDUCTIONS = [
  { key: "sec80C", label: "80C (PF, LIC, ELSS…)", max: 150000 },
  { key: "sec80D", label: "80D (Health Insurance)", max: 100000 },
  { key: "hra", label: "HRA Exemption", max: null },
  { key: "lta", label: "LTA Exemption", max: null },
  { key: "sec80CCD", label: "80CCD(1B) NPS", max: 50000 },
  { key: "sec80G", label: "80G (Donations)", max: null },
  { key: "homeLoan", label: "Home Loan Interest (24b)", max: 200000 },
  { key: "other", label: "Other Deductions", max: null },
];

type DeductionKey = (typeof DEDUCTIONS)[number]["key"];

export default function IncomeTaxCalculatorClient() {
  const [regime, setRegime] = useState<Regime>("new");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("below60");
  const [grossIncome, setGross] = useState("1200000");
  const [deductions, setDeductions] = useState<Record<string, string>>({});
  const [showDeductions, setShowDeductions] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const gross = parseFloat(grossIncome) || 0;

  const result = useMemo(() => {
    const totalDeductions =
      regime === "old"
        ? Object.values(deductions).reduce(
            (sum, v) => sum + (parseFloat(v) || 0),
            0,
          )
        : 75000; // standard deduction in new regime

    const taxableIncome = Math.max(
      0,
      gross - (regime === "new" ? 75000 : totalDeductions),
    );

    const slabs = regime === "new" ? NEW_SLABS : OLD_SLABS[ageGroup];
    const { tax: baseTax, breakdown } = calcTax(taxableIncome, slabs);

    // Rebate u/s 87A
    let rebate = 0;
    if (regime === "new" && taxableIncome <= 700000)
      rebate = Math.min(baseTax, 25000);
    if (regime === "old" && taxableIncome <= 500000)
      rebate = Math.min(baseTax, 12500);

    const taxAfterRebate = Math.max(0, baseTax - rebate);
    const surchargeAmt = surcharge(gross, taxAfterRebate);
    const cess = (taxAfterRebate + surchargeAmt) * 0.04;
    const totalTax = taxAfterRebate + surchargeAmt + cess;
    const effectiveRate = gross > 0 ? (totalTax / gross) * 100 : 0;
    const takeHome = gross - totalTax;

    return {
      taxableIncome,
      totalDeductions,
      baseTax,
      rebate,
      taxAfterRebate,
      surchargeAmt,
      cess,
      totalTax,
      effectiveRate,
      takeHome,
      breakdown,
    };
  }, [gross, regime, ageGroup, deductions]);

  const handleCopy = () => {
    const t = result;
    const text = `Income Tax FY 2024-25 (${regime === "new" ? "New" : "Old"} Regime)\nGross Income: ${formatINR(gross)}\nTaxable Income: ${formatINR(t.taxableIncome)}\nIncome Tax: ${formatINR(t.baseTax)}\nRebate 87A: ${formatINR(t.rebate)}\nSurcharge: ${formatINR(t.surchargeAmt)}\nHealth & Ed. Cess: ${formatINR(t.cess)}\nTotal Tax: ${formatINR(t.totalTax)}\nEffective Rate: ${t.effectiveRate.toFixed(2)}%\nIn-hand Income: ${formatINR(t.takeHome)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const setDeduction = (key: DeductionKey, val: string) =>
    setDeductions((prev) => ({ ...prev, [key]: val }));

  const hasResult = gross > 0;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ───────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Regime toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Tax Regime (FY 2024-25)</p>
          <div className="grid grid-cols-2 gap-2">
            {(["new", "old"] as Regime[]).map((r) => (
              <button
                key={r}
                onClick={() => setRegime(r)}
                aria-pressed={regime === r}
                className={`py-3 rounded-xl text-sm font-display font-semibold capitalize transition-all ${
                  regime === r
                    ? "bg-zest-500 text-white shadow-glow-sm"
                    : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                {r === "new" ? "🆕 New Regime" : "📋 Old Regime"}
              </button>
            ))}
          </div>
          {regime === "new" && (
            <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              ₹75,000 standard deduction & rebate up to ₹7L taxable income
              automatically applied.
            </p>
          )}
        </div>

        {/* Age (old regime only) */}
        {regime === "old" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <p className="label">Age Group</p>
            <div className="space-y-2">
              {(
                [
                  ["below60", "Below 60 years"],
                  ["60to80", "60 – 80 years (Senior)"],
                  ["above80", "Above 80 years (Super Senior)"],
                ] as [AgeGroup, string][]
              ).map(([val, lbl]) => (
                <label
                  key={val}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    ageGroup === val
                      ? "border-zest-500 bg-zest-500/5"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="age"
                    value={val}
                    checked={ageGroup === val}
                    onChange={() => setAgeGroup(val)}
                    className="accent-zest-500"
                  />
                  <span className="text-sm text-ink-700">{lbl}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Income input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Income Details
          </h2>

          <div>
            <label htmlFor="gross" className="label">
              Annual Gross Income
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="gross"
                type="number"
                min="0"
                step="10000"
                value={grossIncome}
                onChange={(e) => setGross(e.target.value)}
                placeholder="Enter annual income"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="0"
              max="10000000"
              step="50000"
              value={grossIncome}
              onChange={(e) => setGross(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹0</span>
              <span>₹1 Cr</span>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <p className="label">Quick Select</p>
            <div className="flex flex-wrap gap-2">
              {[
                "500000",
                "750000",
                "1000000",
                "1500000",
                "2000000",
                "3000000",
              ].map((v) => (
                <button
                  key={v}
                  onClick={() => setGross(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    grossIncome === v
                      ? "bg-zest-500 text-white border-zest-500"
                      : "bg-gray-50 text-ink-600 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {formatINR(parseInt(v))}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setGross("1200000");
              setDeductions({});
              setRegime("new");
              setAgeGroup("below60");
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Deductions (old regime) */}
        {regime === "old" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowDeductions(!showDeductions)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-display font-semibold text-ink-800 text-sm text-left">
                  Deductions & Exemptions
                </p>
                <p className="text-xs text-gray-400 text-left">
                  Total:{" "}
                  {formatINR(
                    Object.values(deductions).reduce(
                      (s, v) => s + (parseFloat(v) || 0),
                      0,
                    ),
                  )}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showDeductions ? "rotate-180" : ""}`}
              />
            </button>

            {showDeductions && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
                {DEDUCTIONS.map((d) => (
                  <div key={d.key}>
                    <label className="label">
                      {d.label}
                      {d.max ? ` (max ${formatINR(d.max)})` : ""}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={d.max ?? undefined}
                        value={deductions[d.key] ?? ""}
                        onChange={(e) => setDeduction(d.key, e.target.value)}
                        placeholder="0"
                        className="input-field pl-9 text-sm py-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RESULT PANEL ──────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Main result */}
        <div
          className={`rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
            hasResult
              ? "bg-ink-900 border-ink-700 shadow-glow-sm"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {hasResult ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  FY 2024-25 · {regime === "new" ? "New" : "Old"} Regime
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-glow" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="text-4xl lg:text-5xl font-display font-extrabold text-white mb-1">
                {formatINR(result.totalTax)}
              </div>
              <p className="text-white/30 text-xs mb-8">
                Total tax payable · Effective rate{" "}
                {result.effectiveRate.toFixed(2)}%
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Gross Income</span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(gross)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    {regime === "new"
                      ? "Standard Deduction"
                      : "Total Deductions"}
                  </span>
                  <span className="font-display font-semibold text-white">
                    – {formatINR(result.totalDeductions)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Taxable Income</span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.taxableIncome)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Income Tax</span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatINR(result.baseTax)}
                  </span>
                </div>
                {result.rebate > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-white/10">
                    <span className="text-sm text-white/50">
                      Rebate u/s 87A
                    </span>
                    <span className="font-display font-semibold text-emerald-400">
                      – {formatINR(result.rebate)}
                    </span>
                  </div>
                )}
                {result.surchargeAmt > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-white/10">
                    <span className="text-sm text-white/50">Surcharge</span>
                    <span className="font-display font-semibold text-white">
                      {formatINR(result.surchargeAmt)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Health & Ed. Cess (4%)
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.cess)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    In-hand Income
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {formatINR(result.takeHome)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Enter your income to calculate tax
              </p>
            </div>
          )}
        </div>

        {/* Monthly breakdown */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Monthly Estimate
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Gross / mo",
                  value: gross / 12,
                  color: "bg-gray-50 border-gray-100",
                },
                {
                  label: "Tax / mo",
                  value: result.totalTax / 12,
                  color: "bg-rose-50 border-rose-100",
                },
                {
                  label: "In-hand / mo",
                  value: result.takeHome / 12,
                  color: "bg-emerald-50 border-emerald-100",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${item.color}`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    {item.label}
                  </p>
                  <p className="font-display font-bold text-ink-800 text-sm">
                    {formatINR(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slab breakdown */}
        {hasResult && result.breakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              aria-expanded={showBreakdown}
            >
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Slab-wise Tax Breakdown
              </h3>
              <span className="text-xs text-zest-500 font-medium">
                {showBreakdown ? "Hide ↑" : "Show ↓"}
              </span>
            </button>

            {showBreakdown && (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  aria-label="Tax slab breakdown"
                >
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      {["Income Slab", "Taxable Amount", "Rate", "Tax"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 font-display font-semibold text-ink-600 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdown.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                          {row.slab}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {formatINR(row.taxable)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${
                              row.rate === 0
                                ? "bg-gray-100 text-gray-500"
                                : row.rate <= 10
                                  ? "bg-emerald-50 text-emerald-700"
                                  : row.rate <= 20
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {row.rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zest-500 font-semibold">
                          {formatINR(row.tax)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td
                        colSpan={3}
                        className="px-4 py-3 font-display font-semibold text-ink-700"
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 font-display font-bold text-ink-800">
                        {formatINR(result.baseTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Regime comparison tip */}
        {hasResult && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="font-display font-semibold text-amber-800 text-sm mb-1">
                  Switch regime to compare
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The new regime is better for most salaried individuals without
                  major deductions. Switch to the old regime above if you have
                  significant 80C, HRA, or home loan deductions to claim.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
