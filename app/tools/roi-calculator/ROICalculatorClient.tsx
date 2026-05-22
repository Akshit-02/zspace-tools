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

function formatPct(n: number) {
  return n.toFixed(2) + "%";
}

type Mode = "basic" | "annualised";
type Period = "days" | "months" | "years";

const PERIOD_LABELS: Record<Period, string> = {
  days: "Days",
  months: "Months",
  years: "Years",
};

// Convert any period to years
function toYears(value: number, period: Period): number {
  if (period === "years") return value;
  if (period === "months") return value / 12;
  return value / 365;
}

export default function ROICalculatorClient() {
  const [mode, setMode] = useState<Mode>("annualised");
  const [initialInvestment, setInitial] = useState("100000");
  const [finalValue, setFinalValue] = useState("150000");
  const [additionalCosts, setCosts] = useState("0");
  const [holdingPeriod, setHolding] = useState("3");
  const [periodUnit, setPeriodUnit] = useState<Period>("years");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const initial = parseFloat(initialInvestment) || 0;
    const final_val = parseFloat(finalValue) || 0;
    const costs = parseFloat(additionalCosts) || 0;
    const period = parseFloat(holdingPeriod) || 1;
    const years = toYears(period, periodUnit);

    const totalInvested = initial + costs;
    const netProfit = final_val - totalInvested;
    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const annualisedROI =
      years > 0
        ? (Math.pow(final_val / totalInvested, 1 / years) - 1) * 100
        : 0;
    const absoluteReturn = final_val - initial;
    const multiplier = totalInvested > 0 ? final_val / totalInvested : 0;

    // Break-even days (if losing)
    const isProfit = netProfit >= 0;

    // Projected values at different ROI horizons (using annualised rate)
    const projections = [1, 2, 3, 5, 10].map((yr) => ({
      years: yr,
      value: totalInvested * Math.pow(1 + annualisedROI / 100, yr),
    }));

    return {
      totalInvested,
      netProfit,
      roi,
      annualisedROI,
      absoluteReturn,
      multiplier,
      isProfit,
      projections,
      years,
    };
  }, [
    initialInvestment,
    finalValue,
    additionalCosts,
    holdingPeriod,
    periodUnit,
  ]);

  const hasResult =
    (parseFloat(initialInvestment) || 0) > 0 &&
    (parseFloat(finalValue) || 0) > 0;

  const handleCopy = () => {
    const text = `ROI Calculation\nInitial Investment: ${formatINR(parseFloat(initialInvestment))}\nFinal Value: ${formatINR(parseFloat(finalValue))}\nAdditional Costs: ${formatINR(parseFloat(additionalCosts) || 0)}\nHolding Period: ${holdingPeriod} ${periodUnit}\nNet Profit/Loss: ${formatINR(result.netProfit)}\nROI: ${formatPct(result.roi)}\nAnnualised ROI: ${formatPct(result.annualisedROI)}\nReturn Multiplier: ${result.multiplier.toFixed(2)}x`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setInitial("100000");
    setFinalValue("150000");
    setCosts("0");
    setHolding("3");
    setPeriodUnit("years");
    setMode("annualised");
  };

  const roiColor = result.roi >= 0 ? "text-emerald-400" : "text-rose-400";
  const roiBg =
    result.roi >= 0
      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
      : "bg-rose-50 border-rose-100 text-rose-700";

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Mode toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Calculation Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["basic", "📊 Basic ROI"],
                ["annualised", "📈 Annualised ROI"],
              ] as [Mode, string][]
            ).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                aria-pressed={mode === val}
                className={`py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                  mode === val
                    ? "bg-zest-500 text-white shadow-glow-sm"
                    : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {mode === "annualised"
              ? "Annualised ROI (CAGR) accounts for the holding period to compare investments fairly."
              : "Basic ROI = Net Profit ÷ Total Cost × 100. Does not factor in time."}
          </p>
        </div>

        {/* Investment inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Investment Details
          </h2>

          {/* Initial Investment */}
          <div>
            <label htmlFor="initial" className="label">
              Initial Investment
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="initial"
                type="number"
                min="0"
                value={initialInvestment}
                onChange={(e) => setInitial(e.target.value)}
                placeholder="e.g. 100000"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1000"
              max="10000000"
              step="1000"
              value={initialInvestment}
              onChange={(e) => setInitial(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1,000</span>
              <span>₹1 Cr</span>
            </div>
          </div>

          {/* Final Value */}
          <div>
            <label htmlFor="final" className="label">
              Final Value / Return
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="final"
                type="number"
                min="0"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                placeholder="e.g. 150000"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1000"
              max="10000000"
              step="1000"
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1,000</span>
              <span>₹1 Cr</span>
            </div>
          </div>

          {/* Additional costs */}
          <div>
            <label htmlFor="costs" className="label">
              Additional Costs
              <span className="ml-1 normal-case font-normal text-gray-400">
                (fees, taxes, charges)
              </span>
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="costs"
                type="number"
                min="0"
                value={additionalCosts}
                onChange={(e) => setCosts(e.target.value)}
                placeholder="0"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Holding period */}
          <div>
            <label className="label">Holding Period</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={holdingPeriod}
                onChange={(e) => setHolding(e.target.value)}
                className="input-field flex-1"
                placeholder="3"
              />
              <div className="flex rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriodUnit(p)}
                    className={`px-3 py-2 text-xs font-display font-semibold transition-colors ${
                      periodUnit === p
                        ? "bg-ink-800 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Quick examples */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label mb-3">Quick Examples</p>
          <div className="space-y-2">
            {[
              {
                label: "SIP 10yr (assumed)",
                initial: "1200000",
                final: "2500000",
                period: "10",
                unit: "years" as Period,
              },
              {
                label: "FD 1yr @ 7%",
                initial: "100000",
                final: "107000",
                period: "1",
                unit: "years" as Period,
              },
              {
                label: "Stock flip 6mo",
                initial: "50000",
                final: "65000",
                period: "6",
                unit: "months" as Period,
              },
              {
                label: "Property 5yr",
                initial: "5000000",
                final: "8500000",
                period: "5",
                unit: "years" as Period,
              },
            ].map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setInitial(ex.initial);
                  setFinalValue(ex.final);
                  setHolding(ex.period);
                  setPeriodUnit(ex.unit);
                  setCosts("0");
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all"
              >
                {ex.label}
                <span className="float-right text-gray-400">
                  {formatINR(parseInt(ex.initial))} →{" "}
                  {formatINR(parseInt(ex.final))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESULT PANEL ── */}
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
                  {mode === "annualised"
                    ? "Annualised ROI (CAGR)"
                    : "Return on Investment"}
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

              {/* Primary ROI */}
              <div className="text-5xl lg:text-6xl font-display font-extrabold mb-1">
                <span className={roiColor}>
                  {formatPct(
                    mode === "annualised" ? result.annualisedROI : result.roi,
                  )}
                </span>
              </div>
              <p className="text-white/30 text-xs mb-8">
                {mode === "annualised"
                  ? `Per year · ${result.years.toFixed(1)} year holding period`
                  : "Total return on your investment"}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Total Invested</span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.totalInvested)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Final Value</span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(parseFloat(finalValue))}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Net Profit / Loss
                  </span>
                  <span className={`font-display font-semibold ${roiColor}`}>
                    {result.netProfit >= 0 ? "+" : ""}
                    {formatINR(result.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Basic ROI</span>
                  <span className={`font-display font-semibold ${roiColor}`}>
                    {formatPct(result.roi)}
                  </span>
                </div>
                {mode === "annualised" && (
                  <div className="flex justify-between py-2.5 border-b border-white/10">
                    <span className="text-sm text-white/50">
                      Annualised ROI (CAGR)
                    </span>
                    <span className={`font-display font-semibold ${roiColor}`}>
                      {formatPct(result.annualisedROI)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Return Multiplier
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {result.multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📈</div>
              <p className="text-sm text-gray-400">
                Enter investment details to calculate ROI
              </p>
            </div>
          )}
        </div>

        {/* Profit/Loss indicator */}
        {hasResult && (
          <div className={`rounded-2xl border p-5 ${roiBg}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{result.isProfit ? "🎯" : "⚠️"}</span>
              <div>
                <p className="font-display font-semibold text-sm mb-1">
                  {result.isProfit
                    ? `You gained ${formatPct(result.roi)} on your investment`
                    : `You lost ${formatPct(Math.abs(result.roi))} on your investment`}
                </p>
                <p className="text-xs leading-relaxed opacity-80">
                  {result.isProfit
                    ? `Every ₹100 invested returned ₹${(100 + result.roi).toFixed(2)}. Your money grew ${result.multiplier.toFixed(2)}x over ${holdingPeriod} ${periodUnit}.`
                    : `Every ₹100 invested returned ₹${(100 + result.roi).toFixed(2)}. Consider reviewing your investment strategy.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats grid */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Investment Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Initial Cost",
                  value: formatINR(parseFloat(initialInvestment) || 0),
                  color: "text-ink-800",
                },
                {
                  label: "Additional Costs",
                  value: formatINR(parseFloat(additionalCosts) || 0),
                  color: "text-ink-800",
                },
                {
                  label: "Total Invested",
                  value: formatINR(result.totalInvested),
                  color: "text-ink-800",
                },
                {
                  label: "Net Gain/Loss",
                  value:
                    (result.netProfit >= 0 ? "+" : "") +
                    formatINR(result.netProfit),
                  color:
                    result.netProfit >= 0
                      ? "text-emerald-600"
                      : "text-rose-600",
                },
                {
                  label: "Multiplier",
                  value: result.multiplier.toFixed(2) + "x",
                  color:
                    result.multiplier >= 1
                      ? "text-emerald-600"
                      : "text-rose-600",
                },
                {
                  label: "Holding Period",
                  value: `${holdingPeriod} ${periodUnit}`,
                  color: "text-ink-800",
                },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                    {item.label}
                  </p>
                  <p className={`text-sm font-display font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Future projections */}
        {hasResult && result.annualisedROI !== 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-1 uppercase tracking-wider">
              Growth Projection
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              If {formatINR(result.totalInvested)} grows at{" "}
              {formatPct(result.annualisedROI)} p.a. (your CAGR):
            </p>
            <div className="space-y-2">
              {result.projections.map((proj) => {
                const barPct = Math.min(
                  100,
                  Math.max(
                    5,
                    (proj.value / (result.projections[4].value || 1)) * 100,
                  ),
                );
                const isGain = proj.value >= result.totalInvested;
                return (
                  <div key={proj.years} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-12 flex-shrink-0">
                      {proj.years} yr{proj.years > 1 ? "s" : ""}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className={`h-full rounded-lg flex items-center pl-2 transition-all duration-500 ${isGain ? "bg-zest-500/20" : "bg-rose-500/20"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-display font-semibold flex-shrink-0 w-28 text-right ${isGain ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {formatINR(proj.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
