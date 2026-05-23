"use client";
import { useState, useMemo } from "react";
import {
  IndianRupee,
  Copy,
  Check,
  RotateCcw,
  Info,
  ArrowLeftRight,
} from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmt(n: number, dec = 2) {
  return isFinite(n) ? n.toFixed(dec) : "—";
}

type Mode = "costToPrice" | "priceToMarkup" | "targetMargin";

const MODES: { key: Mode; label: string; icon: string }[] = [
  { key: "costToPrice", label: "Cost → Selling Price", icon: "🏷️" },
  { key: "priceToMarkup", label: "Price → Markup %", icon: "🔍" },
  { key: "targetMargin", label: "Target Margin", icon: "🎯" },
];

// Quick preset margins
const PRESETS = [10, 20, 25, 30, 40, 50];

export default function MarkupCalculatorClient() {
  const [mode, setMode] = useState<Mode>("costToPrice");
  const [cost, setCost] = useState("500");
  const [markupPct, setMarkupPct] = useState("40");
  const [sellingPrice, setPrice] = useState("700");
  const [targetMargin, setTgtMargin] = useState("30");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const c = parseFloat(cost) || 0;
    const mp = parseFloat(markupPct) || 0;
    const sp = parseFloat(sellingPrice) || 0;
    const tm = parseFloat(targetMargin) || 0;

    if (mode === "costToPrice") {
      const calcPrice = c * (1 + mp / 100);
      const profit = calcPrice - c;
      const grossMargin = calcPrice > 0 ? (profit / calcPrice) * 100 : 0;
      return {
        calcPrice,
        profit,
        grossMargin,
        markup: mp,
        cost: c,
        sellingPrice: calcPrice,
      };
    }

    if (mode === "priceToMarkup") {
      const profit = sp - c;
      const markup = c > 0 ? (profit / c) * 100 : 0;
      const grossMargin = sp > 0 ? (profit / sp) * 100 : 0;
      return {
        calcPrice: sp,
        profit,
        grossMargin,
        markup,
        cost: c,
        sellingPrice: sp,
      };
    }

    // targetMargin mode: given cost + desired gross margin %
    // gross margin = profit / selling price  →  sp = cost / (1 - margin/100)
    const calcPrice = tm < 100 ? c / (1 - tm / 100) : 0;
    const profit = calcPrice - c;
    const markup = c > 0 ? (profit / c) * 100 : 0;
    return {
      calcPrice,
      profit,
      grossMargin: tm,
      markup,
      cost: c,
      sellingPrice: calcPrice,
    };
  }, [mode, cost, markupPct, sellingPrice, targetMargin]);

  const hasResult = result.cost > 0 && result.calcPrice > 0;

  const handleCopy = () => {
    const text = `Markup Calculation\nMode: ${MODES.find((m) => m.key === mode)?.label}\nCost Price: ${formatINR(result.cost)}\nSelling Price: ${formatINR(result.calcPrice)}\nProfit: ${formatINR(result.profit)}\nMarkup: ${fmt(result.markup)}%\nGross Margin: ${fmt(result.grossMargin)}%`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setCost("500");
    setMarkupPct("40");
    setPrice("700");
    setTgtMargin("30");
    setMode("costToPrice");
  };

  // Comparison table at common markups
  const comparisonRows = [10, 20, 25, 30, 40, 50, 60, 75, 100].map((m) => {
    const c = parseFloat(cost) || 0;
    const sp = c * (1 + m / 100);
    const margin = sp > 0 ? ((sp - c) / sp) * 100 : 0;
    return { markup: m, sellingPrice: sp, profit: sp - c, margin };
  });

  const profitPct =
    hasResult && result.calcPrice > 0
      ? Math.min(100, (result.profit / result.calcPrice) * 100)
      : 0;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Mode selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Calculation Mode</p>
          <div className="space-y-2">
            {MODES.map((m) => (
              <label
                key={m.key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  mode === m.key
                    ? "border-zest-500 bg-zest-500/5"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.key}
                  checked={mode === m.key}
                  onChange={() => setMode(m.key)}
                  className="accent-zest-500"
                />
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-medium text-ink-700">
                  {m.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Pricing Inputs
          </h2>

          {/* Cost price — always shown */}
          <div>
            <label htmlFor="cost" className="label">
              Cost Price (per unit)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="cost"
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 500"
                className="input-field pl-10"
              />
            </div>
            <input
              type="range"
              min="1"
              max="100000"
              step="10"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹1</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          {/* Markup % — shown in costToPrice mode */}
          {mode === "costToPrice" && (
            <div>
              <label htmlFor="markup" className="label">
                Markup Percentage (%)
              </label>
              <div className="relative">
                <input
                  id="markup"
                  type="number"
                  min="0"
                  max="10000"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(e.target.value)}
                  placeholder="e.g. 40"
                  className="input-field pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={markupPct}
                onChange={(e) => setMarkupPct(e.target.value)}
                className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0%</span>
                <span>200%</span>
              </div>
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-3">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setMarkupPct(String(p))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      markupPct === String(p)
                        ? "bg-zest-500 text-white border-zest-500"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selling price — shown in priceToMarkup mode */}
          {mode === "priceToMarkup" && (
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
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 700"
                  className="input-field pl-10"
                />
              </div>
              <input
                type="range"
                min="1"
                max="200000"
                step="10"
                value={sellingPrice}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>₹1</span>
                <span>₹2,00,000</span>
              </div>
            </div>
          )}

          {/* Target margin — shown in targetMargin mode */}
          {mode === "targetMargin" && (
            <div>
              <label htmlFor="tgt" className="label">
                Target Gross Margin (%)
              </label>
              <div className="relative">
                <input
                  id="tgt"
                  type="number"
                  min="0"
                  max="99"
                  value={targetMargin}
                  onChange={(e) => setTgtMargin(e.target.value)}
                  placeholder="e.g. 30"
                  className="input-field pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  %
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="90"
                step="1"
                value={targetMargin}
                onChange={(e) => setTgtMargin(e.target.value)}
                className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>1%</span>
                <span>90%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Gross margin % is profit as a % of selling price. Different from
                markup (% of cost).
              </p>
            </div>
          )}

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
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  {MODES.find((m) => m.key === mode)?.label}
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

              {/* Price → Profit flow */}
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <div className="bg-white/5 rounded-xl px-4 py-3 text-center flex-1 min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
                    Cost Price
                  </p>
                  <p className="text-xl font-display font-bold text-white truncate">
                    {formatINR(result.cost)}
                  </p>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                <div className="bg-zest-500/20 border border-zest-500/30 rounded-xl px-4 py-3 text-center flex-1 min-w-0">
                  <p className="text-[10px] text-zest-400/60 uppercase tracking-wider mb-1">
                    Selling Price
                  </p>
                  <p className="text-xl font-display font-bold text-white truncate">
                    {formatINR(result.calcPrice)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Profit per Unit</span>
                  <span className="font-display font-semibold text-emerald-400">
                    {formatINR(result.profit)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Markup on Cost</span>
                  <span className="font-display font-semibold text-white">
                    {fmt(result.markup)}%
                  </span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Gross Margin</span>
                  <span className="font-display font-semibold text-white">
                    {fmt(result.grossMargin)}%
                  </span>
                </div>
                {/* Margin bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-white/30 mb-2">
                    <span>Cost component</span>
                    <span>Profit component</span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden bg-white/10 flex">
                    <div
                      className="h-full bg-white/20 transition-all duration-500"
                      style={{ width: `${Math.max(0, 100 - profitPct)}%` }}
                    />
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${profitPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/20 mt-1">
                    <span>{fmt(100 - profitPct)}%</span>
                    <span>{fmt(profitPct)}%</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🏷️</div>
              <p className="text-sm text-gray-400">
                Enter cost and markup to calculate selling price
              </p>
            </div>
          )}
        </div>

        {/* Markup vs Margin explainer */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Markup vs Gross Margin — Side by Side
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zest-50 border border-zest-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-zest-600 mb-1">
                  Markup on Cost
                </p>
                <p className="text-3xl font-display font-extrabold text-zest-600">
                  {fmt(result.markup)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Profit ÷ Cost × 100
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Every ₹100 of cost earns ₹{fmt(result.markup)} profit
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">
                  Gross Margin
                </p>
                <p className="text-3xl font-display font-extrabold text-emerald-600">
                  {fmt(result.grossMargin)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Profit ÷ Selling Price × 100
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Every ₹100 of revenue retains ₹{fmt(result.grossMargin)}{" "}
                  profit
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison table */}
        {(parseFloat(cost) || 0) > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Markup Comparison Table
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                For cost price {formatINR(parseFloat(cost) || 0)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table
                className="w-full text-sm"
                aria-label="Markup comparison table"
              >
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Markup %",
                      "Selling Price",
                      "Profit",
                      "Gross Margin",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 font-display font-semibold text-ink-600 whitespace-nowrap text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => {
                    const isActive =
                      mode === "costToPrice" &&
                      String(row.markup) === markupPct;
                    return (
                      <tr
                        key={i}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          isActive ? "bg-zest-500/8" : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setMarkupPct(String(row.markup));
                          setMode("costToPrice");
                        }}
                      >
                        <td
                          className={`px-4 py-3 font-display font-bold ${isActive ? "text-zest-600" : "text-ink-700"}`}
                        >
                          {row.markup}%
                          {isActive && (
                            <span className="ml-2 text-[9px] bg-zest-100 text-zest-600 px-1.5 py-0.5 rounded font-bold uppercase">
                              active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-700">
                          {formatINR(row.sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">
                          {formatINR(row.profit)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {fmt(row.margin)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100">
              💡 Click any row to apply that markup instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
