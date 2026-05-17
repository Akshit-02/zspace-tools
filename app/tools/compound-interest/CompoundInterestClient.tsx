"use client";
import { useState, useMemo } from "react";
import {
  IndianRupee,
  Percent,
  Calendar,
  Copy,
  Check,
  RotateCcw,
  Info,
} from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

type Frequency =
  | "annually"
  | "semi-annually"
  | "quarterly"
  | "monthly"
  | "daily";

const FREQUENCIES: { label: string; value: Frequency; n: number }[] = [
  { label: "Annually", value: "annually", n: 1 },
  { label: "Semi-Annual", value: "semi-annually", n: 2 },
  { label: "Quarterly", value: "quarterly", n: 4 },
  { label: "Monthly", value: "monthly", n: 12 },
  { label: "Daily", value: "daily", n: 365 },
];

export default function CompoundInterestClient() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("5");
  const [frequency, setFrequency] = useState<Frequency>("annually");
  const [monthlyAdd, setMonthlyAdd] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const t = parseFloat(years) || 0;
  const mAdd = parseFloat(monthlyAdd) || 0;
  const n = FREQUENCIES.find((f) => f.value === frequency)?.n ?? 1;

  const { totalValue, totalInterest, totalInvested, yearlyData } =
    useMemo(() => {
      if (!p || !r || !t)
        return {
          totalValue: 0,
          totalInterest: 0,
          totalInvested: 0,
          yearlyData: [],
        };

      const ratePerPeriod = r / 100 / n;
      const yearlyData: {
        year: number;
        invested: number;
        interest: number;
        total: number;
      }[] = [];

      for (let yr = 1; yr <= t; yr++) {
        const periods = n * yr;
        // Lump sum compound
        const lumpSum = p * Math.pow(1 + ratePerPeriod, periods);
        // Monthly additions (converted to per-period)
        let addValue = 0;
        if (mAdd > 0) {
          const addPerPeriod = mAdd * (12 / n);
          addValue =
            addPerPeriod *
            ((Math.pow(1 + ratePerPeriod, periods) - 1) / ratePerPeriod);
        }
        const total = lumpSum + addValue;
        const invested = p + mAdd * 12 * yr;
        yearlyData.push({
          year: yr,
          invested,
          interest: total - invested,
          total,
        });
      }

      const last = yearlyData[yearlyData.length - 1] ?? {
        total: 0,
        invested: 0,
        interest: 0,
      };
      return {
        totalValue: last.total,
        totalInterest: last.interest,
        totalInvested: last.invested,
        yearlyData,
      };
    }, [p, r, t, n, mAdd]);

  const growthMultiple = totalInvested > 0 ? totalValue / totalInvested : 0;

  const handleCopy = () => {
    const text = `Compound Interest Summary\nPrincipal: ${formatINR(p)}\nRate: ${r}% p.a. (${frequency})\nTenure: ${t} years\nMonthly Addition: ${formatINR(mAdd)}\nTotal Invested: ${formatINR(totalInvested)}\nTotal Interest: ${formatINR(totalInterest)}\nMaturity Value: ${formatINR(totalValue)}\nGrowth: ${growthMultiple.toFixed(2)}x`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setPrincipal("100000");
    setRate("12");
    setYears("5");
    setFrequency("annually");
    setMonthlyAdd("");
    setShowSchedule(false);
  };

  const hasResult = totalValue > 0;

  // Bar chart max
  const barMax = yearlyData[yearlyData.length - 1]?.total ?? 1;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Investment Details
          </h2>

          {/* Principal */}
          <div>
            <label htmlFor="principal" className="label">
              Principal Amount
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="principal"
                type="number"
                min="0"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="Enter principal amount"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1000"
              max="10000000"
              step="1000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1K</span>
              <span>₹1 Cr</span>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label htmlFor="rate" className="label">
              Annual Interest Rate (%)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Percent className="w-4 h-4" />
              </div>
              <input
                id="rate"
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 12"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <label htmlFor="years" className="label">
              Time Period (Years)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="years"
                type="number"
                min="1"
                max="50"
                step="1"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                placeholder="e.g. 5"
                className="input-field pl-10"
              />
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
          </div>

          {/* Quick year presets */}
          <div>
            <p className="label">Quick Years</p>
            <div className="flex flex-wrap gap-2">
              {["1", "3", "5", "10", "15", "20", "30"].map((y) => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    years === y
                      ? "bg-zest-500 text-white border-zest-500"
                      : "bg-gray-50 text-ink-600 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {y}Y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Compounding frequency */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Compounding Frequency</p>
          <div className="grid grid-cols-1 gap-2">
            {FREQUENCIES.map((f) => (
              <label
                key={f.value}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  frequency === f.value
                    ? "border-zest-500 bg-zest-500/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="freq"
                    value={f.value}
                    checked={frequency === f.value}
                    onChange={() => setFrequency(f.value)}
                    className="accent-zest-500"
                  />
                  <span className="text-sm text-ink-700">{f.label}</span>
                </div>
                <span className="text-xs text-gray-400">{f.n}×/yr</span>
              </label>
            ))}
          </div>
        </div>

        {/* Monthly addition */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <label htmlFor="monthlyAdd" className="label">
            Monthly Addition (optional)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              id="monthlyAdd"
              type="number"
              min="0"
              step="500"
              value={monthlyAdd}
              onChange={(e) => setMonthlyAdd(e.target.value)}
              placeholder="e.g. 5000"
              className="input-field pl-10"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Simulates a SIP-style monthly top-up on top of your principal.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors px-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* ── RESULT PANEL ────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Main result card */}
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
                  Maturity Value · {t} {Number(t) === 1 ? "Year" : "Years"}
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
                {formatINR(totalValue)}
              </div>
              <p className="text-white/30 text-xs mb-8">
                {growthMultiple.toFixed(2)}× your investment · {r}% {frequency}{" "}
                compounding
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Principal Invested
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(p)}
                  </span>
                </div>
                {mAdd > 0 && (
                  <div className="flex justify-between py-2.5 border-b border-white/10">
                    <span className="text-sm text-white/50">
                      Monthly Additions Total
                    </span>
                    <span className="font-display font-semibold text-white">
                      {formatINR(totalInvested - p)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Total Invested</span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Total Interest Earned
                  </span>
                  <span className="font-display font-semibold text-emerald-400">
                    {formatINR(totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Maturity Value
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {formatINR(totalValue)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Enter investment details to see growth
              </p>
            </div>
          )}
        </div>

        {/* Breakdown donut */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-5 uppercase tracking-wider">
              Investment Breakdown
            </h3>
            <div className="flex items-center gap-8">
              {/* Donut */}
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
                  {/* Invested arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#6255e8"
                    strokeWidth="16"
                    strokeDasharray={`${(totalInvested / totalValue) * 314} ${(1 - totalInvested / totalValue) * 314}`}
                    strokeLinecap="round"
                  />
                  {/* Interest arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#a8f0d8"
                    strokeWidth="16"
                    strokeDasharray={`${(totalInterest / totalValue) * 314} ${(1 - totalInterest / totalValue) * 314}`}
                    strokeDashoffset={`${-(totalInvested / totalValue) * 314}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-ink-700">
                    {((totalInterest / totalValue) * 100).toFixed(0)}% gain
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                {[
                  {
                    label: "Total Invested",
                    value: totalInvested,
                    color: "bg-zest-500",
                    pct: ((totalInvested / totalValue) * 100).toFixed(1),
                  },
                  {
                    label: "Interest Earned",
                    value: totalInterest,
                    color: "bg-glow",
                    pct: ((totalInterest / totalValue) * 100).toFixed(1),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${item.color}`}
                      />
                      <span className="text-sm text-gray-500">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-display font-semibold text-ink-800">
                        {formatINR(item.value)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.pct}%
                      </div>
                    </div>
                  </div>
                ))}
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-700">
                    Maturity Value
                  </span>
                  <span className="text-sm font-display font-bold text-ink-800">
                    {formatINR(totalValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bar chart — year by year */}
        {hasResult && yearlyData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-5 uppercase tracking-wider">
              Year-on-Year Growth
            </h3>
            <div className="space-y-2">
              {yearlyData.map((row) => {
                const investedW = (row.invested / barMax) * 100;
                const totalW = (row.total / barMax) * 100;
                return (
                  <div key={row.year} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-10 flex-shrink-0 font-mono">
                      Y{row.year}
                    </span>
                    <div className="flex-1 relative h-6">
                      {/* Total bar (interest) */}
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-100 rounded-lg transition-all duration-500"
                        style={{ width: `${totalW}%` }}
                      />
                      {/* Invested bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-zest-500/80 rounded-lg transition-all duration-500"
                        style={{ width: `${investedW}%` }}
                      />
                    </div>
                    <span className="text-xs font-display font-semibold text-ink-700 w-24 text-right flex-shrink-0">
                      {formatINR(row.total)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-zest-500/80" />
                <span className="text-[10px] text-gray-400">Invested</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100" />
                <span className="text-[10px] text-gray-400">Interest</span>
              </div>
            </div>
          </div>
        )}

        {/* Yearly table */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              aria-expanded={showSchedule}
            >
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Year-wise Schedule
              </h3>
              <span className="text-xs text-zest-500 font-medium">
                {showSchedule ? "Hide ↑" : "Show ↓"}
              </span>
            </button>

            {showSchedule && (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  aria-label="Year-wise compound interest schedule"
                >
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      {[
                        "Year",
                        "Total Invested",
                        "Interest Earned",
                        "Total Value",
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
                    {yearlyData.map((row, i) => (
                      <tr
                        key={row.year}
                        className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-2.5 text-ink-500 font-medium">
                          {row.year}
                        </td>
                        <td className="px-4 py-2.5 text-ink-700">
                          {formatINR(row.invested)}
                        </td>
                        <td className="px-4 py-2.5 text-emerald-600">
                          {formatINR(row.interest)}
                        </td>
                        <td className="px-4 py-2.5 font-display font-semibold text-zest-500">
                          {formatINR(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
