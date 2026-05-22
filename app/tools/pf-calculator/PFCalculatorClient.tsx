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

// EPF rates (FY 2024-25)
const EMPLOYEE_RATE = 12; // % of Basic + DA
const EMPLOYER_EPF = 3.67; // % to EPF
const EMPLOYER_EPS = 8.33; // % to EPS (Employee Pension Scheme)
const EPF_INTEREST = 8.25; // % p.a. (FY 2023-24 rate)
const EPS_WAGE_CEIL = 15000; // EPS contribution capped at ₹15,000

type ContributionType = "employee" | "both";

interface YearlyRow {
  year: number;
  openingBalance: number;
  employeeContrib: number;
  employerContrib: number;
  interest: number;
  closingBalance: number;
}

export default function PFCalculatorClient() {
  const [basic, setBasic] = useState("30000");
  const [da, setDa] = useState("0");
  const [currentAge, setCurrentAge] = useState("30");
  const [retirementAge, setRetirementAge] = useState("58");
  const [existingBalance, setExistingBalance] = useState("0");
  const [customRate, setCustomRate] = useState(String(EPF_INTEREST));
  const [showSchedule, setShowSchedule] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const basicNum = parseFloat(basic) || 0;
    const daNum = parseFloat(da) || 0;
    const ageNum = parseInt(currentAge) || 30;
    const retireNum = parseInt(retirementAge) || 58;
    const existingBal = parseFloat(existingBalance) || 0;
    const rate = parseFloat(customRate) || EPF_INTEREST;

    const salary = basicNum + daNum;
    const yearsToRetire = Math.max(0, retireNum - ageNum);
    const monthlyRate = rate / 100 / 12;

    // Monthly contributions
    const empMonthly = Math.round((salary * EMPLOYEE_RATE) / 100);
    const epsWage = Math.min(salary, EPS_WAGE_CEIL);
    const epsMonthly = Math.round((epsWage * EMPLOYER_EPS) / 100);
    const epfMonthly = Math.round((salary * EMPLOYER_EPF) / 100);
    const totalMonthly = empMonthly + epfMonthly; // only EPF portion (not EPS) goes to PF account

    // Year-wise schedule
    const schedule: YearlyRow[] = [];
    let balance = existingBal;

    for (let yr = 1; yr <= yearsToRetire; yr++) {
      const opening = balance;
      const empAnnual = empMonthly * 12;
      const epfAnnual = epfMonthly * 12;
      const totalAnnualContrib = empAnnual + epfAnnual;

      // EPF interest is calculated on monthly running balance
      let interest = 0;
      let monthBal = balance;
      for (let m = 1; m <= 12; m++) {
        monthBal += empMonthly + epfMonthly;
        interest += monthBal * (rate / 100 / 12);
      }
      interest = Math.round(interest);

      balance = opening + totalAnnualContrib + interest;
      schedule.push({
        year: yr,
        openingBalance: Math.round(opening),
        employeeContrib: empAnnual,
        employerContrib: epfAnnual,
        interest,
        closingBalance: Math.round(balance),
      });
    }

    const maturityAmount = Math.round(balance);
    const totalEmpContrib = empMonthly * 12 * yearsToRetire;
    const totalEmprContrib = epfMonthly * 12 * yearsToRetire;
    const totalContrib = totalEmpContrib + totalEmprContrib + existingBal;
    const totalInterest = maturityAmount - totalContrib;

    // EPS pension estimate (simplified)
    // Pension = (Pensionable salary × Pensionable service) / 70
    const pensionableSalary = Math.min(salary, EPS_WAGE_CEIL);
    const epsPension = Math.round((pensionableSalary * yearsToRetire) / 70);

    return {
      empMonthly,
      epfMonthly,
      epsMonthly,
      totalMonthly,
      maturityAmount,
      totalEmpContrib,
      totalEmprContrib,
      totalContrib,
      totalInterest,
      yearsToRetire,
      epsPension,
      schedule,
      salary,
      rate,
    };
  }, [basic, da, currentAge, retirementAge, existingBalance, customRate]);

  const hasResult = result.yearsToRetire > 0 && result.salary > 0;

  const handleCopy = () => {
    const text = `EPF Calculation\nBasic + DA: ${formatINR(result.salary)}/month\nYears to Retire: ${result.yearsToRetire}\nEmployee Contribution: ${formatINR(result.empMonthly)}/month\nEmployer EPF: ${formatINR(result.epfMonthly)}/month\nTotal Monthly: ${formatINR(result.totalMonthly)}/month\nMaturity Amount: ${formatINR(result.maturityAmount)}\nTotal Interest Earned: ${formatINR(result.totalInterest)}\nEPS Pension (est.): ${formatINR(result.epsPension)}/month`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setBasic("30000");
    setDa("0");
    setCurrentAge("30");
    setRetirementAge("58");
    setExistingBalance("0");
    setCustomRate(String(EPF_INTEREST));
    setShowSchedule(false);
  };

  // Preview schedule: first 3 + last 3 years
  const previewSchedule =
    result.schedule.length > 6
      ? [...result.schedule.slice(0, 3), null, ...result.schedule.slice(-3)]
      : result.schedule;

  const principalPct =
    result.maturityAmount > 0
      ? Math.round((result.totalContrib / result.maturityAmount) * 100)
      : 0;
  const interestPct = 100 - principalPct;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Salary inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Salary Details
          </h2>

          <div>
            <label htmlFor="basic" className="label">
              Basic Salary (per month)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="basic"
                type="number"
                min="0"
                value={basic}
                onChange={(e) => setBasic(e.target.value)}
                placeholder="e.g. 30000"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="5000"
              max="200000"
              step="1000"
              value={basic}
              onChange={(e) => setBasic(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹5,000</span>
              <span>₹2,00,000</span>
            </div>
          </div>

          <div>
            <label htmlFor="da" className="label">
              Dearness Allowance — DA
              <span className="ml-1 normal-case font-normal text-gray-400">
                (0 for most private)
              </span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

          <div>
            <label htmlFor="existing" className="label">
              Existing EPF Balance
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="existing"
                type="number"
                min="0"
                value={existingBalance}
                onChange={(e) => setExistingBalance(e.target.value)}
                placeholder="0"
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* Age & rate inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Service Details
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="currAge" className="label">
                Current Age
              </label>
              <div className="relative">
                <input
                  id="currAge"
                  type="number"
                  min="18"
                  max="57"
                  value={currentAge}
                  onChange={(e) => setCurrentAge(e.target.value)}
                  className="input-field pr-10"
                  placeholder="30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  yrs
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="retireAge" className="label">
                Retirement Age
              </label>
              <div className="relative">
                <input
                  id="retireAge"
                  type="number"
                  min="50"
                  max="70"
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(e.target.value)}
                  className="input-field pr-10"
                  placeholder="58"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  yrs
                </span>
              </div>
            </div>
          </div>

          {result.yearsToRetire > 0 && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              ✅ {result.yearsToRetire} years of EPF contributions remaining
            </p>
          )}

          <div>
            <label htmlFor="rate" className="label">
              EPF Interest Rate (% p.a.)
              <span className="ml-1 normal-case font-normal text-gray-400">
                Current: {EPF_INTEREST}%
              </span>
            </label>
            <input
              id="rate"
              type="number"
              min="1"
              max="15"
              step="0.05"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              EPFO declared 8.25% for FY 2023-24
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
        {/* Maturity highlight */}
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
                  EPF Maturity Amount
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
                {formatINR(result.maturityAmount)}
              </div>
              <p className="text-white/30 text-xs mb-8">
                At retirement · {result.yearsToRetire} years · {result.rate}%
                p.a.
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Monthly Employee Contribution
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.empMonthly)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Monthly Employer EPF
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.epfMonthly)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Total Contributions
                  </span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatINR(result.totalContrib)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Total Interest Earned
                  </span>
                  <span className="font-display font-semibold text-emerald-400">
                    {formatINR(result.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Est. EPS Pension
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {formatINR(result.epsPension)}/mo
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🏦</div>
              <p className="text-sm text-gray-400">
                Enter your salary and age to calculate EPF maturity
              </p>
            </div>
          )}
        </div>

        {/* Monthly breakdown card */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Monthly Contribution Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: "Employee (12%)",
                  value: result.empMonthly,
                  color: "bg-zest-50 border-zest-100",
                  text: "text-zest-700",
                },
                {
                  label: "Employer EPF (3.67%)",
                  value: result.epfMonthly,
                  color: "bg-blue-50 border-blue-100",
                  text: "text-blue-700",
                },
                {
                  label: "Employer EPS (8.33%)",
                  value: result.epsMonthly,
                  color: "bg-emerald-50 border-emerald-100",
                  text: "text-emerald-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${item.color}`}
                >
                  <p className={`text-lg font-display font-bold ${item.text}`}>
                    {formatINR(item.value)}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">
                Total deducted from CTC
              </span>
              <span className="font-display font-bold text-ink-800">
                {formatINR(
                  result.empMonthly + result.epfMonthly + result.epsMonthly,
                )}
                /mo
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              EPS contribution goes to the pension scheme and does not
              accumulate in your PF account. Only EPF (3.67%) from employer +
              12% from employee earns interest.
            </p>
          </div>
        )}

        {/* Donut breakdown */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-5 uppercase tracking-wider">
              Maturity Composition
            </h3>
            <div className="flex items-center gap-8">
              <div className="relative flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="16"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#6255e8"
                    strokeWidth="16"
                    strokeDasharray={`${principalPct * 3.14} ${(100 - principalPct) * 3.14}`}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={`${interestPct * 3.14} ${(100 - interestPct) * 3.14}`}
                    strokeDashoffset={`${-principalPct * 3.14}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-ink-700">
                    {interestPct}%<br />
                    <span className="font-normal text-gray-400">int.</span>
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  {
                    label: "Total Contributions",
                    value: result.totalContrib,
                    pct: principalPct,
                    dot: "bg-zest-500",
                  },
                  {
                    label: "Interest Earned",
                    value: result.totalInterest,
                    pct: interestPct,
                    dot: "bg-emerald-500",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                      <span className="text-sm text-gray-500">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display font-semibold text-ink-800">
                        {formatINR(item.value)}
                      </p>
                      <p className="text-[10px] text-gray-400">{item.pct}%</p>
                    </div>
                  </div>
                ))}
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-700">
                    Total
                  </span>
                  <span className="text-sm font-display font-bold text-ink-800">
                    {formatINR(result.maturityAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Year-wise schedule */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              aria-expanded={showSchedule}
            >
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Year-wise Growth Schedule
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zest-500 font-medium">
                  {showSchedule ? "Hide ↑" : "Show ↓"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${showSchedule ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {showSchedule && (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  aria-label="EPF year-wise growth"
                >
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      {[
                        "Year",
                        "Opening",
                        "Employee",
                        "Employer",
                        "Interest",
                        "Closing",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-display font-semibold text-ink-600 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewSchedule.map((row, i) =>
                      row === null ? (
                        <tr key="ellipsis">
                          <td
                            colSpan={6}
                            className="text-center py-3 text-gray-300 text-base tracking-widest"
                          >
                            · · ·
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={i}
                          className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                        >
                          <td className="px-4 py-2.5 font-medium text-ink-600">
                            Yr {row.year}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {formatINR(row.openingBalance)}
                          </td>
                          <td className="px-4 py-2.5 text-zest-500">
                            {formatINR(row.employeeContrib)}
                          </td>
                          <td className="px-4 py-2.5 text-blue-500">
                            {formatINR(row.employerContrib)}
                          </td>
                          <td className="px-4 py-2.5 text-emerald-500">
                            {formatINR(row.interest)}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-ink-800">
                            {formatINR(row.closingBalance)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Showing first 3 and last 3 years. Full schedule has{" "}
                    {result.yearsToRetire} rows. Interest calculated on monthly
                    running balance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
