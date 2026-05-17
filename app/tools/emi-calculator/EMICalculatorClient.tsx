"use client";
import {
  Calendar,
  Check,
  Copy,
  IndianRupee,
  Info,
  Percent,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatINRFull(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

type LoanType = "home" | "car" | "personal" | "education";

const LOAN_PRESETS: Record<
  LoanType,
  { rate: number; tenure: number; max: number; label: string }
> = {
  home: { rate: 8.5, tenure: 240, max: 10000000, label: "Home Loan" },
  car: { rate: 9.0, tenure: 60, max: 2000000, label: "Car Loan" },
  personal: { rate: 12.0, tenure: 60, max: 500000, label: "Personal Loan" },
  education: { rate: 9.5, tenure: 84, max: 2000000, label: "Education Loan" },
};

export default function EMICalculatorClient() {
  const [loanType, setLoanType] = useState<LoanType>("home");
  const [principal, setPrincipal] = useState("2000000");
  const [rate, setRate] = useState("8.5");
  const [tenure, setTenure] = useState("240");
  const [tenureMode, setTenureMode] = useState<"months" | "years">("months");
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const t = parseFloat(tenure) || 0;
  const tenureMonths = tenureMode === "years" ? t * 12 : t;

  const { emi, totalPayment, totalInterest, schedule } = useMemo(() => {
    if (!p || !r || !tenureMonths)
      return { emi: 0, totalPayment: 0, totalInterest: 0, schedule: [] };

    const monthlyRate = r / 12 / 100;
    const emi =
      monthlyRate === 0
        ? p / tenureMonths
        : (p * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - p;

    // Amortisation schedule (first 12 + last 12 months)
    const schedule = [];
    let balance = p;
    for (let i = 1; i <= tenureMonths; i++) {
      const interest = balance * monthlyRate;
      const principal = emi - interest;
      balance = Math.max(0, balance - principal);
      schedule.push({ month: i, emi, principal, interest, balance });
    }

    return { emi, totalPayment, totalInterest, schedule };
  }, [p, r, tenureMonths]);

  const principalPct = totalPayment ? Math.round((p / totalPayment) * 100) : 0;
  const interestPct = 100 - principalPct;

  const handlePreset = (type: LoanType) => {
    setLoanType(type);
    setRate(String(LOAN_PRESETS[type].rate));
    setTenure(String(LOAN_PRESETS[type].tenure));
    setTenureMode("months");
  };

  const handleReset = () => {
    setLoanType("home");
    setPrincipal("2000000");
    setRate("8.5");
    setTenure("240");
    setTenureMode("months");
    setShowSchedule(false);
  };

  const handleCopy = () => {
    const text = `EMI Calculation\nLoan Amount: ${formatINR(p)}\nInterest Rate: ${r}% p.a.\nTenure: ${tenureMonths} months\nMonthly EMI: ${formatINRFull(emi)}\nTotal Interest: ${formatINR(totalInterest)}\nTotal Payment: ${formatINR(totalPayment)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasResult = emi > 0;

  // Show first 6 + last 6 months of schedule for preview
  const previewSchedule =
    schedule.length > 12
      ? [...schedule.slice(0, 6), null, ...schedule.slice(-6)]
      : schedule;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Input Panel */}
      <div className="lg:col-span-2 space-y-4">
        {/* Loan type presets */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Loan Type</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LOAN_PRESETS) as LoanType[]).map((type) => (
              <button
                key={type}
                onClick={() => handlePreset(type)}
                aria-pressed={loanType === type}
                className={`py-2.5 px-3 rounded-xl text-xs font-display font-semibold capitalize transition-all duration-150 text-left ${
                  loanType === type
                    ? "bg-zest-500 text-white shadow-glow-sm"
                    : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                {LOAN_PRESETS[type].label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Loan Details
          </h2>

          {/* Principal */}
          <div>
            <label htmlFor="principal" className="label">
              Loan Amount
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="principal"
                type="number"
                min="0"
                step="10000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="Enter loan amount"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="100000"
              max={LOAN_PRESETS[loanType].max}
              step="50000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              aria-label="Loan amount slider"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1L</span>
              <span>{formatINR(LOAN_PRESETS[loanType].max)}</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="rate" className="label">
              Interest Rate (% p.a.)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Percent className="w-4 h-4" />
              </div>
              <input
                id="rate"
                type="number"
                min="1"
                max="30"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 8.5"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="5"
              max="24"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              aria-label="Interest rate slider"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>5%</span>
              <span>24%</span>
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="tenure" className="label mb-0">
                Loan Tenure
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs">
                {(["months", "years"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (m === "years" && tenureMode === "months") {
                        setTenure(String(Math.round(t / 12)));
                      } else if (m === "months" && tenureMode === "years") {
                        setTenure(String(t * 12));
                      }
                      setTenureMode(m);
                    }}
                    className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                      tenureMode === m
                        ? "bg-ink-800 text-white"
                        : "bg-white text-ink-500 hover:bg-gray-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="tenure"
                type="number"
                min="1"
                max={tenureMode === "years" ? 30 : 360}
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1"
              max={tenureMode === "years" ? 30 : 360}
              step="1"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              aria-label="Tenure slider"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 {tenureMode === "years" ? "yr" : "mo"}</span>
              <span>{tenureMode === "years" ? "30 yrs" : "360 mo"}</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* EMI highlight */}
        <div
          className={`rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
            hasResult
              ? "bg-ink-900 border-ink-700 shadow-glow-sm"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {hasResult ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  Monthly EMI
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                  aria-label="Copy results"
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
                {formatINRFull(emi)}
              </div>
              <p className="text-white/30 text-xs mb-8">
                per month for {tenureMonths} months
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Principal Amount
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(p)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50">Total Interest</span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatINR(totalInterest)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Total Payment
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {formatINR(totalPayment)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Enter loan details to calculate your EMI
              </p>
            </div>
          )}
        </div>

        {/* Donut breakdown */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-5 uppercase tracking-wider">
              Payment Breakdown
            </h3>

            <div className="flex items-center gap-8">
              {/* SVG Donut */}
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
                  {/* Principal arc */}
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
                  {/* Interest arc */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="16"
                    strokeDasharray={`${interestPct * 3.14} ${(100 - interestPct) * 3.14}`}
                    strokeDashoffset={`${-principalPct * 3.14}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-display font-bold text-ink-700">
                    {principalPct}% P
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zest-500" />
                    <span className="text-sm text-gray-500">Principal</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-display font-semibold text-ink-800">
                      {formatINR(p)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {principalPct}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-300" />
                    <span className="text-sm text-gray-500">Interest</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-display font-semibold text-ink-800">
                      {formatINR(totalInterest)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {interestPct}%
                    </div>
                  </div>
                </div>
                <div className="h-px bg-gray-100 my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-700">
                    Total
                  </span>
                  <span className="text-sm font-display font-bold text-ink-800">
                    {formatINR(totalPayment)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amortisation Schedule */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              aria-expanded={showSchedule}
            >
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Amortisation Schedule
              </h3>
              <span className="text-xs text-zest-500 font-medium">
                {showSchedule ? "Hide ↑" : "Show ↓"}
              </span>
            </button>

            {showSchedule && (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  role="table"
                  aria-label="Amortisation schedule"
                >
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      {["Month", "EMI", "Principal", "Interest", "Balance"].map(
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
                    {previewSchedule.map((row, i) =>
                      row === null ? (
                        <tr key="ellipsis">
                          <td
                            colSpan={5}
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
                          <td className="px-4 py-2.5 text-ink-500 font-medium">
                            {row.month}
                          </td>
                          <td className="px-4 py-2.5 text-ink-700">
                            {formatINR(row.emi)}
                          </td>
                          <td className="px-4 py-2.5 text-zest-500">
                            {formatINR(row.principal)}
                          </td>
                          <td className="px-4 py-2.5 text-violet-400">
                            {formatINR(row.interest)}
                          </td>
                          <td className="px-4 py-2.5 text-ink-600">
                            {formatINR(row.balance)}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-start gap-1.5">
                  <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-gray-400">
                    Showing first 6 and last 6 months. Full schedule has{" "}
                    {tenureMonths} rows.
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
