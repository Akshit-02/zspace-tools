"use client";
import { useState, useMemo } from "react";
import { IndianRupee, Copy, Check, RotateCcw, Info } from "lucide-react";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmt(n: number, decimals = 2) {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(decimals);
}

type Mode = "costRevenue" | "marginToPrice" | "markupToMargin";

const MODES: { id: Mode; label: string; desc: string; emoji: string }[] = [
  {
    id: "costRevenue",
    label: "Cost & Revenue",
    desc: "Calculate all margins from cost and selling price",
    emoji: "📊",
  },
  {
    id: "marginToPrice",
    label: "Margin → Price",
    desc: "Find selling price from cost and desired margin",
    emoji: "🎯",
  },
  {
    id: "markupToMargin",
    label: "Markup ↔ Margin",
    desc: "Convert between markup % and margin %",
    emoji: "🔄",
  },
];

export default function ProfitMarginClient() {
  const [mode, setMode] = useState<Mode>("costRevenue");
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // costRevenue inputs
  const [cost, setCost] = useState("");
  const [revenue, setRevenue] = useState("");
  const [opex, setOpex] = useState("");
  const [tax, setTax] = useState("");

  // marginToPrice inputs
  const [mtpCost, setMtpCost] = useState("");
  const [mtpMargin, setMtpMargin] = useState("");

  // markupToMargin inputs
  const [markupVal, setMarkupVal] = useState("");
  const [marginVal, setMarginVal] = useState("");

  // ── costRevenue calculations ─────────────────────────────────────────
  const cr = useMemo(() => {
    const c = parseFloat(cost) || 0;
    const r = parseFloat(revenue) || 0;
    const op = parseFloat(opex) || 0;
    const tx = parseFloat(tax) || 0;

    if (!c || !r) return null;

    const grossProfit = r - c;
    const grossMargin = (grossProfit / r) * 100;
    const markup = (grossProfit / c) * 100;
    const operatingProfit = grossProfit - op;
    const operatingMargin = (operatingProfit / r) * 100;
    const taxAmt = operatingProfit * (tx / 100);
    const netProfit = operatingProfit - taxAmt;
    const netMargin = (netProfit / r) * 100;
    const breakeven = c + op;
    const breakevenUnits = r > 0 ? breakeven / r : 0; // as fraction of revenue

    return {
      c,
      r,
      op,
      tx,
      grossProfit,
      grossMargin,
      markup,
      operatingProfit,
      operatingMargin,
      taxAmt,
      netProfit,
      netMargin,
      breakeven,
    };
  }, [cost, revenue, opex, tax]);

  // ── marginToPrice ────────────────────────────────────────────────────
  const mtp = useMemo(() => {
    const c = parseFloat(mtpCost) || 0;
    const m = parseFloat(mtpMargin) || 0;
    if (!c || !m || m >= 100) return null;
    const sellingPrice = c / (1 - m / 100);
    const profit = sellingPrice - c;
    const markupPct = (profit / c) * 100;
    return { sellingPrice, profit, markupPct, c, m };
  }, [mtpCost, mtpMargin]);

  // ── markupToMargin ───────────────────────────────────────────────────
  const m2m = useMemo(() => {
    const mk = parseFloat(markupVal) || 0;
    const mg = parseFloat(marginVal) || 0;
    const marginFromMarkup = (mk / (100 + mk)) * 100;
    const markupFromMargin = (mg / (100 - mg)) * 100;
    return { marginFromMarkup, markupFromMargin };
  }, [markupVal, marginVal]);

  const handleCopy = () => {
    let text = "";
    if (mode === "costRevenue" && cr) {
      text = `Profit Margin Analysis\nCost: ${formatINR(cr.c)}\nRevenue: ${formatINR(cr.r)}\nGross Profit: ${formatINR(cr.grossProfit)}\nGross Margin: ${fmt(cr.grossMargin)}%\nMarkup: ${fmt(cr.markup)}%\nNet Profit: ${formatINR(cr.netProfit)}\nNet Margin: ${fmt(cr.netMargin)}%`;
    } else if (mode === "marginToPrice" && mtp) {
      text = `Selling Price Calculation\nCost: ${formatINR(mtp.c)}\nTarget Margin: ${mtp.m}%\nSelling Price: ${formatINR(mtp.sellingPrice)}\nProfit: ${formatINR(mtp.profit)}\nMarkup: ${fmt(mtp.markupPct)}%`;
    } else if (mode === "markupToMargin") {
      text = `Markup ↔ Margin\nMarkup ${markupVal}% → Margin: ${fmt(m2m.marginFromMarkup)}%\nMargin ${marginVal}% → Markup: ${fmt(m2m.markupFromMargin)}%`;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setCost("");
    setRevenue("");
    setOpex("");
    setTax("");
    setMtpCost("");
    setMtpMargin("");
    setMarkupVal("");
    setMarginVal("");
    setShowBreakdown(false);
  };

  const marginColor = (pct: number) =>
    pct >= 20
      ? "text-emerald-500"
      : pct >= 10
        ? "text-amber-500"
        : "text-rose-500";

  const marginLabel = (pct: number) =>
    pct >= 20
      ? "🟢 Healthy"
      : pct >= 10
        ? "🟡 Average"
        : pct < 0
          ? "🔴 Loss"
          : "🟠 Low";

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="grid sm:grid-cols-3 gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`p-4 rounded-2xl border text-left transition-all ${
              mode === m.id
                ? "border-zest-500 bg-zest-500/5 shadow-glow-sm"
                : "border-gray-100 bg-white hover:border-gray-200 shadow-card"
            }`}
          >
            <div className="text-xl mb-2">{m.emoji}</div>
            <div className="font-display font-semibold text-sm text-ink-800">
              {m.label}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* ── MODE: Cost & Revenue ─────────────────────────────────────── */}
      {mode === "costRevenue" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
              <h2 className="font-display font-bold text-lg text-ink-800">
                Revenue & Cost
              </h2>

              {[
                {
                  label: "Revenue / Selling Price",
                  val: revenue,
                  set: setRevenue,
                  placeholder: "e.g. 150000",
                  required: true,
                },
                {
                  label: "Cost of Goods Sold (COGS)",
                  val: cost,
                  set: setCost,
                  placeholder: "e.g. 90000",
                  required: true,
                },
              ].map((f) => (
                <div key={f.label}>
                  <label className="label">
                    {f.label}
                    {f.required && (
                      <span className="text-rose-400 ml-1">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
              <h2 className="font-display font-bold text-base text-ink-800">
                Optional: Operating Expenses
              </h2>
              {[
                {
                  label: "Operating Expenses (OPEX)",
                  val: opex,
                  set: setOpex,
                  placeholder: "e.g. 20000",
                  isINR: true,
                },
                {
                  label: "Tax Rate (%)",
                  val: tax,
                  set: setTax,
                  placeholder: "e.g. 25",
                  isINR: false,
                },
              ].map((f) => (
                <div key={f.label}>
                  <label className="label">{f.label}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {f.isINR ? (
                        <IndianRupee className="w-4 h-4" />
                      ) : (
                        <span className="text-sm">%</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={f.val}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                OPEX includes rent, salaries, utilities — everything except
                COGS.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {cr ? (
              <>
                {/* Main dark card */}
                <div className="bg-ink-900 rounded-2xl border border-ink-700 shadow-glow-sm p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                      Margin Analysis
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

                  {/* Three margin metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        label: "Gross Margin",
                        value: cr.grossMargin,
                        profit: cr.grossProfit,
                      },
                      {
                        label: "Operating Margin",
                        value: cr.operatingMargin,
                        profit: cr.operatingProfit,
                      },
                      {
                        label: "Net Margin",
                        value: cr.netMargin,
                        profit: cr.netProfit,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-white/5 rounded-xl p-4 text-center"
                      >
                        <div
                          className={`text-2xl font-display font-extrabold ${marginColor(item.value)}`}
                        >
                          {fmt(item.value)}%
                        </div>
                        <div className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                          {item.label}
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {formatINR(item.profit)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        label: "Revenue",
                        value: formatINR(cr.r),
                        color: "text-white",
                      },
                      {
                        label: "COGS",
                        value: `– ${formatINR(cr.c)}`,
                        color: "text-rose-400",
                      },
                      {
                        label: "Gross Profit",
                        value: formatINR(cr.grossProfit),
                        color: "text-emerald-400",
                      },
                      ...(cr.op > 0
                        ? [
                            {
                              label: "OPEX",
                              value: `– ${formatINR(cr.op)}`,
                              color: "text-orange-400",
                            },
                          ]
                        : []),
                      ...(cr.op > 0
                        ? [
                            {
                              label: "Operating Profit",
                              value: formatINR(cr.operatingProfit),
                              color: "text-emerald-400",
                            },
                          ]
                        : []),
                      ...(cr.tx > 0
                        ? [
                            {
                              label: `Tax (${cr.tx}%)`,
                              value: `– ${formatINR(cr.taxAmt)}`,
                              color: "text-orange-400",
                            },
                          ]
                        : []),
                      {
                        label: "Net Profit",
                        value: formatINR(cr.netProfit),
                        color: "text-glow",
                      },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        className={`flex justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-white/10" : "bg-white/5 rounded-xl px-4 -mx-2"}`}
                      >
                        <span className="text-sm text-white/50">
                          {row.label}
                        </span>
                        <span
                          className={`font-display font-semibold ${row.color}`}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Markup + health */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                    <p className="label">Markup Percentage</p>
                    <div className="text-3xl font-display font-extrabold text-ink-800">
                      {fmt(cr.markup)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Profit as % of cost
                    </p>
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                      Markup = (Revenue − Cost) ÷ Cost × 100
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                    <p className="label">Business Health</p>
                    <div className="text-2xl mb-2">
                      {marginLabel(cr.netMargin).split(" ")[0]}
                    </div>
                    <div
                      className={`text-sm font-semibold ${marginColor(cr.netMargin)}`}
                    >
                      {marginLabel(cr.netMargin).split(" ")[1]} Net Margin
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {cr.netMargin >= 20
                        ? "Excellent profitability. Well above industry average."
                        : cr.netMargin >= 10
                          ? "Decent margin. Room to improve efficiency."
                          : cr.netMargin < 0
                            ? "Operating at a loss. Review costs urgently."
                            : "Thin margins. Optimise costs or increase pricing."}
                    </p>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                  <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
                    Revenue Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "COGS",
                        value: cr.c,
                        pct: (cr.c / cr.r) * 100,
                        color: "bg-rose-400",
                      },
                      {
                        label: "OPEX",
                        value: cr.op,
                        pct: (cr.op / cr.r) * 100,
                        color: "bg-orange-400",
                        skip: !cr.op,
                      },
                      {
                        label: "Tax",
                        value: cr.taxAmt,
                        pct: (cr.taxAmt / cr.r) * 100,
                        color: "bg-amber-400",
                        skip: !cr.taxAmt,
                      },
                      {
                        label: "Net Profit",
                        value: cr.netProfit,
                        pct: (cr.netProfit / cr.r) * 100,
                        color: "bg-emerald-500",
                      },
                    ]
                      .filter((r) => !r.skip && r.value !== 0)
                      .map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                            {row.label}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className={`${row.color} h-2 rounded-full transition-all duration-500`}
                              style={{
                                width: `${Math.max(0, Math.min(100, row.pct))}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-display font-semibold text-ink-700 w-12 text-right">
                            {fmt(row.pct)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm text-gray-400">
                  Enter revenue and cost to calculate margins
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE: Margin → Price ─────────────────────────────────────── */}
      {mode === "marginToPrice" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
              <h2 className="font-display font-bold text-lg text-ink-800">
                Find Selling Price
              </h2>
              <div>
                <label className="label">Cost Price</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={mtpCost}
                    onChange={(e) => setMtpCost(e.target.value)}
                    placeholder="e.g. 80000"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="label">Target Gross Margin (%)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <span className="text-sm">%</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={mtpMargin}
                    onChange={(e) => setMtpMargin(e.target.value)}
                    placeholder="e.g. 40"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["10", "20", "25", "30", "40", "50"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMtpMargin(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      mtpMargin === v
                        ? "bg-zest-500 text-white border-zest-500"
                        : "bg-gray-50 border-gray-100 text-ink-600 hover:bg-gray-100"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            {mtp ? (
              <div className="space-y-4">
                <div className="bg-ink-900 rounded-2xl border border-ink-700 shadow-glow-sm p-6 lg:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                      Selling Price Result
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
                    {formatINR(mtp.sellingPrice)}
                  </div>
                  <p className="text-white/30 text-xs mb-8">
                    Selling price for {mtp.m}% gross margin
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Cost Price",
                        value: formatINR(mtp.c),
                        color: "text-white",
                      },
                      {
                        label: "Profit",
                        value: formatINR(mtp.profit),
                        color: "text-emerald-400",
                      },
                      {
                        label: "Gross Margin",
                        value: `${mtp.m}%`,
                        color: "text-zest-400",
                      },
                      {
                        label: "Markup %",
                        value: `${fmt(mtp.markupPct)}%`,
                        color: "text-white",
                      },
                      {
                        label: "Selling Price",
                        value: formatINR(mtp.sellingPrice),
                        color: "text-glow",
                      },
                    ].map((row, i, arr) => (
                      <div
                        key={row.label}
                        className={`flex justify-between py-2.5 ${i < arr.length - 1 ? "border-b border-white/10" : "bg-white/5 rounded-xl px-4 -mx-2"}`}
                      >
                        <span className="text-sm text-white/50">
                          {row.label}
                        </span>
                        <span
                          className={`font-display font-semibold ${row.color}`}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Selling Price = Cost ÷ (1 − Margin%). A 40% margin means
                  profit is 40% of the selling price, which equals a{" "}
                  {fmt((40 / 60) * 100)}% markup on cost.
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm text-gray-400">
                  Enter cost and target margin to find the ideal selling price
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE: Markup ↔ Margin ────────────────────────────────────── */}
      {mode === "markupToMargin" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Markup → Margin */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h2 className="font-display font-bold text-base text-ink-800">
                Markup % → Margin %
              </h2>
            </div>
            <div>
              <label className="label">Markup Percentage</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <span className="text-sm">%</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={markupVal}
                  onChange={(e) => setMarkupVal(e.target.value)}
                  placeholder="e.g. 25"
                  className="input-field pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["10", "20", "25", "33", "50", "100"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMarkupVal(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      markupVal === v
                        ? "bg-zest-500 text-white border-zest-500"
                        : "bg-gray-50 border-gray-100 text-ink-600 hover:bg-gray-100"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            {markupVal && parseFloat(markupVal) > 0 ? (
              <div className="bg-ink-900 rounded-xl p-5 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Gross Margin
                </p>
                <p className="text-4xl font-display font-extrabold text-glow">
                  {fmt(m2m.marginFromMarkup)}%
                </p>
                <p className="text-white/30 text-xs mt-2">
                  Formula: Markup ÷ (100 + Markup) × 100
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center text-sm text-gray-400">
                Enter markup % above
              </div>
            )}
          </div>

          {/* Margin → Markup */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📉</span>
              <h2 className="font-display font-bold text-base text-ink-800">
                Margin % → Markup %
              </h2>
            </div>
            <div>
              <label className="label">Gross Margin Percentage</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <span className="text-sm">%</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={marginVal}
                  onChange={(e) => setMarginVal(e.target.value)}
                  placeholder="e.g. 20"
                  className="input-field pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {["10", "20", "25", "33", "40", "50"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMarginVal(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      marginVal === v
                        ? "bg-zest-500 text-white border-zest-500"
                        : "bg-gray-50 border-gray-100 text-ink-600 hover:bg-gray-100"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
            {marginVal &&
            parseFloat(marginVal) > 0 &&
            parseFloat(marginVal) < 100 ? (
              <div className="bg-ink-900 rounded-xl p-5 text-center">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Markup Percentage
                </p>
                <p className="text-4xl font-display font-extrabold text-glow">
                  {fmt(m2m.markupFromMargin)}%
                </p>
                <p className="text-white/30 text-xs mt-2">
                  Formula: Margin ÷ (100 − Margin) × 100
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-5 text-center text-sm text-gray-400">
                Enter margin % above
              </div>
            )}
          </div>

          {/* Reference table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                Markup vs Margin Reference Table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Markup %", "Margin %", "Markup %", "Margin %"].map(
                      (h, i) => (
                        <th
                          key={i}
                          className="text-left px-4 py-3 font-display font-semibold text-ink-600"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [5, 10],
                    [15, 20],
                    [25, 30],
                    [33.33, 40],
                    [50, 50],
                    [66.67, 60],
                    [100, 75],
                  ].map(([mk, mg], i) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50/50"}>
                      <td className="px-4 py-2.5 text-ink-700 font-medium">
                        {mk}%
                      </td>
                      <td className="px-4 py-2.5 text-emerald-600">
                        {fmt((mk / (100 + mk)) * 100)}%
                      </td>
                      <td className="px-4 py-2.5 text-ink-700 font-medium">
                        {mg}%
                      </td>
                      <td className="px-4 py-2.5 text-zest-500">
                        {fmt((mg / (100 - mg)) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
