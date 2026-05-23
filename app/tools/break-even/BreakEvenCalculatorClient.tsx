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

function formatNum(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
}

interface ScenarioRow {
  units: number;
  revenue: number;
  totalVariable: number;
  totalCost: number;
  profit: number;
}

export default function BreakEvenCalculatorClient() {
  const [fixedCosts, setFixedCosts] = useState("200000");
  const [sellingPrice, setSellingPrice] = useState("500");
  const [variableCost, setVariableCost] = useState("300");
  const [targetProfit, setTargetProfit] = useState("100000");
  const [copied, setCopied] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const result = useMemo(() => {
    const fc = parseFloat(fixedCosts) || 0;
    const sp = parseFloat(sellingPrice) || 0;
    const vc = parseFloat(variableCost) || 0;
    const tp = parseFloat(targetProfit) || 0;

    const contributionMargin = sp - vc;
    const contributionMarginRatio =
      sp > 0 ? (contributionMargin / sp) * 100 : 0;

    // Break-even point
    const bepUnits = contributionMargin > 0 ? fc / contributionMargin : 0;
    const bepRevenue = bepUnits * sp;

    // Target profit units
    const targetUnits =
      contributionMargin > 0 ? (fc + tp) / contributionMargin : 0;
    const targetRevenue = targetUnits * sp;

    // Margin of safety (assume current sales = target units for illustration)
    const marginOfSafety =
      targetUnits > 0 ? ((targetUnits - bepUnits) / targetUnits) * 100 : 0;
    const marginOfSafetyUnits = targetUnits - bepUnits;

    // P/V ratio same as CM ratio
    const pvRatio = contributionMarginRatio;

    // Scenario table — multiples of BEP units
    const step = Math.max(1, Math.ceil(bepUnits / 5));
    const maxUnits = Math.ceil((targetUnits * 1.5) / step) * step;
    const scenarioRows: ScenarioRow[] = [];
    for (let u = 0; u <= maxUnits; u += step) {
      const revenue = u * sp;
      const totalVariable = u * vc;
      const totalCost = fc + totalVariable;
      const profit = revenue - totalCost;
      scenarioRows.push({
        units: u,
        revenue,
        totalVariable,
        totalCost,
        profit,
      });
    }

    return {
      contributionMargin,
      contributionMarginRatio,
      bepUnits,
      bepRevenue,
      targetUnits,
      targetRevenue,
      marginOfSafety,
      marginOfSafetyUnits,
      pvRatio,
      scenarioRows,
      isValid: sp > vc && sp > 0 && fc > 0,
    };
  }, [fixedCosts, sellingPrice, variableCost, targetProfit]);

  const hasResult = result.isValid;

  const handleCopy = () => {
    const text = `Break-Even Analysis\nFixed Costs: ${formatINR(parseFloat(fixedCosts))}\nSelling Price/unit: ${formatINR(parseFloat(sellingPrice))}\nVariable Cost/unit: ${formatINR(parseFloat(variableCost))}\nContribution Margin: ${formatINR(result.contributionMargin)}/unit (${result.contributionMarginRatio.toFixed(1)}%)\nBreak-Even Units: ${formatNum(result.bepUnits)}\nBreak-Even Revenue: ${formatINR(result.bepRevenue)}\nTarget Profit Units: ${formatNum(result.targetUnits)}\nMargin of Safety: ${result.marginOfSafety.toFixed(1)}%`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setFixedCosts("200000");
    setSellingPrice("500");
    setVariableCost("300");
    setTargetProfit("100000");
    setShowTable(false);
  };

  // Chart data — normalised bar widths
  const chartItems = hasResult
    ? [
        { label: "BEP", units: result.bepUnits, color: "bg-amber-400" },
        { label: "Target", units: result.targetUnits, color: "bg-zest-500" },
      ]
    : [];
  const maxUnitsChart =
    chartItems.length > 0
      ? Math.max(...chartItems.map((c) => c.units)) * 1.1
      : 1;

  // Visible scenario rows: bracket around BEP
  const previewRows = result.scenarioRows.filter((_, i) =>
    result.scenarioRows.length <= 10
      ? true
      : i < 4 || i > result.scenarioRows.length - 4,
  );

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Business Inputs
          </h2>

          {/* Fixed Costs */}
          <div>
            <label htmlFor="fixed" className="label">
              Total Fixed Costs (per period)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="fixed"
                type="number"
                min="0"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                placeholder="e.g. 200000"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1000"
              max="5000000"
              step="1000"
              value={fixedCosts}
              onChange={(e) => setFixedCosts(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1,000</span>
              <span>₹50L</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Rent, salaries, insurance, depreciation — costs that don't change
              with production.
            </p>
          </div>

          {/* Selling Price */}
          <div>
            <label htmlFor="sp" className="label">
              Selling Price (per unit)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="sp"
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 500"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1"
              max="100000"
              step="10"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          {/* Variable Cost */}
          <div>
            <label htmlFor="vc" className="label">
              Variable Cost (per unit)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="vc"
                type="number"
                min="0"
                value={variableCost}
                onChange={(e) => setVariableCost(e.target.value)}
                placeholder="e.g. 300"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1"
              max="100000"
              step="10"
              value={variableCost}
              onChange={(e) => setVariableCost(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1</span>
              <span>₹1,00,000</span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Raw materials, packaging, commission — costs that vary with each
              unit sold.
            </p>
          </div>

          {/* Target Profit */}
          <div>
            <label htmlFor="tp" className="label">
              Desired Target Profit
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="tp"
                type="number"
                min="0"
                value={targetProfit}
                onChange={(e) => setTargetProfit(e.target.value)}
                placeholder="e.g. 100000"
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Validation warning */}
          {!result.isValid &&
            (parseFloat(sellingPrice) > 0 || parseFloat(variableCost) > 0) && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Selling price must be greater than variable cost to reach
                break-even.
              </div>
            )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Contribution margin live preview */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <p className="label mb-3">Contribution Margin</p>
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-2xl font-display font-extrabold text-zest-500">
                  {formatINR(result.contributionMargin)}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    /unit
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  = Selling Price − Variable Cost
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-display font-bold text-ink-800">
                  {result.contributionMarginRatio.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400">CM Ratio</p>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-zest-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, result.contributionMarginRatio)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}
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
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  Break-Even Analysis
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

              {/* BEP highlights */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-[10px] text-amber-400/70 uppercase tracking-wider font-display mb-1">
                    Break-Even Units
                  </p>
                  <p className="text-3xl font-display font-extrabold text-amber-300">
                    {formatNum(Math.ceil(result.bepUnits))}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">units to sell</p>
                </div>
                <div className="bg-zest-500/10 border border-zest-500/20 rounded-2xl p-4">
                  <p className="text-[10px] text-zest-400/70 uppercase tracking-wider font-display mb-1">
                    Break-Even Revenue
                  </p>
                  <p className="text-2xl font-display font-extrabold text-white">
                    {formatINR(result.bepRevenue)}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">revenue needed</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Contribution Margin/unit
                  </span>
                  <span className="font-display font-semibold text-white">
                    {formatINR(result.contributionMargin)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    CM Ratio (P/V Ratio)
                  </span>
                  <span className="font-display font-semibold text-white">
                    {result.contributionMarginRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Units for Target Profit
                  </span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatNum(Math.ceil(result.targetUnits))} units
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    Revenue for Target Profit
                  </span>
                  <span className="font-display font-semibold text-zest-400">
                    {formatINR(result.targetRevenue)}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Margin of Safety
                  </span>
                  <span className="font-display font-extrabold text-glow text-xl">
                    {result.marginOfSafety.toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-sm text-gray-400">
                Enter your costs and pricing to calculate break-even
              </p>
            </div>
          )}
        </div>

        {/* Visual chart bars */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-5 uppercase tracking-wider">
              Units Required
            </h3>
            <div className="space-y-4">
              {chartItems.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-ink-700">
                      {item.label === "BEP"
                        ? "Break-Even Point"
                        : `Target Profit (${formatINR(parseFloat(targetProfit))})`}
                    </span>
                    <span className="font-display font-bold text-ink-800">
                      {formatNum(Math.ceil(item.units))} units
                    </span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded-xl overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-xl flex items-center px-3 transition-all duration-700`}
                      style={{
                        width: `${Math.max(4, (item.units / maxUnitsChart) * 100)}%`,
                      }}
                    >
                      <span className="text-white text-xs font-bold truncate">
                        {formatINR(item.units * parseFloat(sellingPrice))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Margin of safety */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-ink-700">
                  Margin of Safety
                </span>
                <span className="font-display font-bold text-emerald-600">
                  {formatNum(Math.ceil(result.marginOfSafetyUnits))} units (
                  {result.marginOfSafety.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(2, Math.min(100, result.marginOfSafety))}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                How far sales can drop from target before hitting break-even
              </p>
            </div>
          </div>
        )}

        {/* Key metrics grid */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Fixed Costs",
                  value: formatINR(parseFloat(fixedCosts) || 0),
                  color: "text-ink-800",
                },
                {
                  label: "Variable Cost/unit",
                  value: formatINR(parseFloat(variableCost) || 0),
                  color: "text-ink-800",
                },
                {
                  label: "Selling Price/unit",
                  value: formatINR(parseFloat(sellingPrice) || 0),
                  color: "text-ink-800",
                },
                {
                  label: "Contribution Margin",
                  value: formatINR(result.contributionMargin),
                  color: "text-zest-600",
                },
                {
                  label: "CM Ratio",
                  value: result.contributionMarginRatio.toFixed(1) + "%",
                  color: "text-zest-600",
                },
                {
                  label: "Margin of Safety",
                  value: result.marginOfSafety.toFixed(1) + "%",
                  color: "text-emerald-600",
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

        {/* Scenario table */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <button
              onClick={() => setShowTable(!showTable)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              aria-expanded={showTable}
            >
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Profit/Loss Scenario Table
              </h3>
              <span className="text-xs text-zest-500 font-medium">
                {showTable ? "Hide ↑" : "Show ↓"}
              </span>
            </button>

            {showTable && (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs"
                  aria-label="Break-even scenario table"
                >
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      {[
                        "Units",
                        "Revenue",
                        "Variable Cost",
                        "Total Cost",
                        "Profit/Loss",
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
                    {previewRows.map((row, i) => {
                      const isBep =
                        Math.abs(row.units - result.bepUnits) <
                          (parseFloat(fixedCosts) /
                            (parseFloat(sellingPrice) || 1)) *
                            0.05 ||
                        (previewRows[i - 1]?.profit < 0 && row.profit >= 0);
                      return (
                        <tr
                          key={i}
                          className={`border-b border-gray-50 ${isBep ? "bg-amber-50" : i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                        >
                          <td
                            className={`px-4 py-2.5 font-medium ${isBep ? "text-amber-700" : "text-ink-600"}`}
                          >
                            {formatNum(row.units)}{" "}
                            {isBep && (
                              <span className="ml-1 text-[9px] bg-amber-200 text-amber-800 px-1 py-0.5 rounded font-bold uppercase">
                                BEP
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-ink-700">
                            {formatINR(row.revenue)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {formatINR(row.totalVariable)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500">
                            {formatINR(row.totalCost)}
                          </td>
                          <td
                            className={`px-4 py-2.5 font-semibold ${row.profit >= 0 ? "text-emerald-600" : "text-rose-500"}`}
                          >
                            {row.profit >= 0 ? "+" : ""}
                            {formatINR(row.profit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    Table shows key unit milestones. Rows highlighted in amber
                    indicate the break-even point.
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
