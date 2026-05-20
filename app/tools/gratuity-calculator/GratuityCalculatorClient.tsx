"use client";
import { useState, useMemo } from "react";
import { IndianRupee, Copy, Check, RotateCcw, Info } from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type EmployeeType = "covered" | "notCovered";

// Gratuity Act covers establishments with 10+ employees
// Formula:
//   Covered     → (Last Salary × 15 × Years) / 26
//   Not Covered → (Last Salary × 15 × Years) / 30
// "Last Salary" = Basic + DA
// Max tax-exempt gratuity = ₹20,00,000 (as of 2023)

const MAX_EXEMPT = 2000000;

export default function GratuityCalculatorClient() {
  const [empType, setEmpType] = useState<EmployeeType>("covered");
  const [basic, setBasic] = useState("50000");
  const [da, setDa] = useState("0");
  const [years, setYears] = useState("5");
  const [months, setMonths] = useState("0");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const basicNum = parseFloat(basic) || 0;
    const daNum = parseFloat(da) || 0;
    const yearsNum = parseFloat(years) || 0;
    const monthsNum = parseFloat(months) || 0;

    const lastSalary = basicNum + daNum;
    // Months ≥ 6 round up to next year per Gratuity Act
    const totalYears =
      monthsNum >= 6
        ? Math.ceil(yearsNum + monthsNum / 12)
        : Math.floor(yearsNum + monthsNum / 12);
    const divisor = empType === "covered" ? 26 : 30;
    const gratuity = (lastSalary * 15 * totalYears) / divisor;
    const taxExempt = Math.min(gratuity, MAX_EXEMPT);
    const taxable = Math.max(0, gratuity - MAX_EXEMPT);
    const perYearAmount = totalYears > 0 ? gratuity / totalYears : 0;

    return {
      gratuity,
      taxExempt,
      taxable,
      lastSalary,
      totalYears,
      perYearAmount,
      divisor,
    };
  }, [basic, da, years, months, empType]);

  const hasResult = result.gratuity > 0;

  const handleCopy = () => {
    const text = `Gratuity Calculation\nEmployee Type: ${empType === "covered" ? "Covered under Gratuity Act" : "Not Covered"}\nBasic + DA: ${formatINR(result.lastSalary)}/month\nYears of Service: ${result.totalYears} years\nGratuity Amount: ${formatINR(result.gratuity)}\nTax Exempt: ${formatINR(result.taxExempt)}\nTaxable Gratuity: ${formatINR(result.taxable)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setEmpType("covered");
    setBasic("50000");
    setDa("0");
    setYears("5");
    setMonths("0");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Employee type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Employee Type</p>
          <div className="space-y-2">
            {(
              [
                [
                  "covered",
                  "🏢 Covered under Gratuity Act",
                  "Organisations with 10 or more employees",
                ],
                [
                  "notCovered",
                  "🏠 Not Covered under Gratuity Act",
                  "Smaller organisations, ex-gratia payment",
                ],
              ] as [EmployeeType, string, string][]
            ).map(([val, lbl, sub]) => (
              <label
                key={val}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  empType === val
                    ? "border-zest-500 bg-zest-500/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="empType"
                  value={val}
                  checked={empType === val}
                  onChange={() => setEmpType(val)}
                  className="accent-zest-500 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-ink-800">{lbl}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              </label>
            ))}
          </div>
          <div
            className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
              empType === "covered"
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {empType === "covered"
              ? "Formula: (Basic + DA) × 15 × Years ÷ 26"
              : "Formula: (Basic + DA) × 15 × Years ÷ 30"}
          </div>
        </div>

        {/* Salary & service inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Employment Details
          </h2>

          {/* Basic Salary */}
          <div>
            <label htmlFor="basic" className="label">
              Basic Salary (per month)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="basic"
                type="number"
                min="0"
                value={basic}
                onChange={(e) => setBasic(e.target.value)}
                placeholder="e.g. 50000"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="5000"
              max="500000"
              step="1000"
              value={basic}
              onChange={(e) => setBasic(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹5,000</span>
              <span>₹5,00,000</span>
            </div>
          </div>

          {/* DA */}
          <div>
            <label htmlFor="da" className="label">
              Dearness Allowance — DA (per month)
              <span className="ml-1 normal-case font-normal text-gray-400">
                (0 for private sector)
              </span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="da"
                type="number"
                min="0"
                value={da}
                onChange={(e) => setDa(e.target.value)}
                placeholder="0"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Years of service */}
          <div>
            <label className="label">Years of Service</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    className="input-field pr-14"
                    placeholder="5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    years
                  </span>
                </div>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="input-field pr-16"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    months
                  </span>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 yr</span>
              <span>40 yrs</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              As per the Gratuity Act, 6+ months rounds up to the next year.
              {parseInt(months) >= 6 && (
                <span className="text-emerald-600 font-medium ml-1">
                  ({months} months → rounded up to{" "}
                  {Math.ceil(parseInt(years) + parseInt(months) / 12)} years)
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* ── RESULT PANEL ── */}
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
                  Gratuity Amount
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
                {formatINR(result.gratuity)}
              </div>
              <p className="text-white/30 text-xs mb-8">
                For {result.totalYears} year{result.totalYears !== 1 ? "s" : ""}{" "}
                of service · Divisor: {result.divisor}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Last Salary (Basic + DA)
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.lastSalary)}/mo
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Years of Service
                  </span>
                  <span className="font-display font-semibold text-white">
                    {result.totalYears} years
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Gratuity per Year
                  </span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatINR(result.perYearAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Tax Exempt (up to ₹20L)
                  </span>
                  <span className="font-display font-semibold text-emerald-400">
                    {formatINR(result.taxExempt)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Taxable Gratuity
                  </span>
                  <span
                    className={`font-display font-extrabold text-xl ${result.taxable > 0 ? "text-rose-400" : "text-glow"}`}
                  >
                    {result.taxable > 0
                      ? formatINR(result.taxable)
                      : "₹0 (Fully Exempt)"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🏦</div>
              <p className="text-sm text-gray-400">
                Enter your salary and service details to calculate gratuity
              </p>
            </div>
          )}
        </div>

        {/* Formula breakdown */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Calculation Breakdown
            </h3>

            {/* Formula visual */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 font-mono text-sm">
              <div className="flex flex-wrap items-center gap-2 text-ink-700">
                <span className="bg-zest-500/10 text-zest-600 px-2 py-1 rounded-lg">
                  {formatINR(result.lastSalary)}
                </span>
                <span className="text-gray-400">×</span>
                <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded-lg">
                  15
                </span>
                <span className="text-gray-400">×</span>
                <span className="bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg">
                  {result.totalYears} yrs
                </span>
                <span className="text-gray-400">÷</span>
                <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-lg">
                  {result.divisor}
                </span>
                <span className="text-gray-400">=</span>
                <span className="bg-ink-800 text-white px-2 py-1 rounded-lg font-bold">
                  {formatINR(result.gratuity)}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {[
                {
                  label: "Basic Salary",
                  value: formatINR(parseFloat(basic) || 0) + "/mo",
                },
                {
                  label: "Dearness Allowance (DA)",
                  value: formatINR(parseFloat(da) || 0) + "/mo",
                },
                {
                  label: "Last Drawn Salary",
                  value: formatINR(result.lastSalary) + "/mo",
                },
                {
                  label: "Service Period",
                  value: `${result.totalYears} complete years`,
                },
                {
                  label: "Divisor (working days)",
                  value: `${result.divisor} days`,
                },
                {
                  label: "Gratuity Formula",
                  value: `Salary × 15 × Years ÷ ${result.divisor}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-ink-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tax exemption info */}
        {hasResult && (
          <div
            className={`rounded-2xl border p-5 ${
              result.taxable > 0
                ? "bg-rose-50 border-rose-100"
                : "bg-emerald-50 border-emerald-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {result.taxable > 0 ? "⚠️" : "✅"}
              </span>
              <div>
                <p
                  className={`font-display font-semibold text-sm mb-1 ${result.taxable > 0 ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {result.taxable > 0
                    ? `₹${(result.taxable / 100000).toFixed(2)}L is taxable`
                    : "Fully Tax Exempt!"}
                </p>
                <p
                  className={`text-xs leading-relaxed ${result.taxable > 0 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {result.taxable > 0
                    ? `Gratuity above ₹20,00,000 is taxable as income. The first ₹20L is exempt. Consult a tax advisor for applicable slab rate.`
                    : `Your gratuity of ${formatINR(result.gratuity)} is below the ₹20,00,000 exemption limit. No tax is payable on this amount.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5-year milestones */}
        {hasResult && result.lastSalary > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Gratuity at Key Milestones
            </h3>
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label="Gratuity at different service years"
              >
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-display font-semibold text-ink-600">
                      Years
                    </th>
                    <th className="text-right pb-3 font-display font-semibold text-ink-600">
                      Gratuity
                    </th>
                    <th className="text-right pb-3 font-display font-semibold text-ink-600 hidden sm:table-cell">
                      Tax Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[5, 10, 15, 20, 25, 30].map((yr) => {
                    const g = (result.lastSalary * 15 * yr) / result.divisor;
                    const exempt = g <= MAX_EXEMPT;
                    const isCurrentYear = yr === result.totalYears;
                    return (
                      <tr
                        key={yr}
                        className={`border-b border-gray-50 last:border-0 ${isCurrentYear ? "bg-zest-500/5" : ""}`}
                      >
                        <td className="py-2.5">
                          <span
                            className={`font-medium ${isCurrentYear ? "text-zest-600" : "text-gray-600"}`}
                          >
                            {yr} years {isCurrentYear && "← you"}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 text-right font-display font-semibold ${isCurrentYear ? "text-zest-600" : "text-ink-700"}`}
                        >
                          {formatINR(g)}
                        </td>
                        <td className="py-2.5 text-right hidden sm:table-cell">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                              exempt
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {exempt ? "Exempt" : "Partly Taxable"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
