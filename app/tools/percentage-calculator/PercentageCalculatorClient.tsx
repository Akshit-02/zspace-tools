"use client";
import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";

function round(n: number, decimals = 2) {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

function formatNum(n: number) {
  if (!isFinite(n) || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(n);
}

// ── individual calculator types ────────────────────────────────────────────
type CalcType =
  | "whatPercent" // X is what % of Y?
  | "percentOf" // X% of Y = ?
  | "percentChange" // % change from X to Y
  | "addPercent" // Add X% to Y
  | "subtractPercent" // Subtract X% from Y
  | "findOriginal" // After X% increase, result is Y. Find original.
  | "splitPercent" // Split Y into X% and rest
  | "ratioPct"; // X out of Y as percentage

interface CalcConfig {
  id: CalcType;
  title: string;
  description: string;
  emoji: string;
  color: string;
  fields: { id: string; label: string; placeholder: string }[];
  compute: (
    vals: Record<string, number>,
  ) => { label: string; value: string; highlight?: boolean }[];
}

const CALCULATORS: CalcConfig[] = [
  {
    id: "percentOf",
    title: "What is X% of Y?",
    description: "Find the percentage value of a number.",
    emoji: "📊",
    color: "from-violet-500 to-purple-600",
    fields: [
      { id: "pct", label: "Percentage (%)", placeholder: "e.g. 18" },
      { id: "base", label: "Of Number", placeholder: "e.g. 50000" },
    ],
    compute: ({ pct, base }) => [
      {
        label: `${formatNum(pct)}% of ${formatNum(base)}`,
        value: formatNum(round((base * pct) / 100)),
        highlight: true,
      },
      {
        label: "Remaining amount",
        value: formatNum(round(base - (base * pct) / 100)),
      },
    ],
  },
  {
    id: "whatPercent",
    title: "X is what % of Y?",
    description: "Find what percentage one number is of another.",
    emoji: "🔢",
    color: "from-blue-500 to-cyan-600",
    fields: [
      { id: "part", label: "Part (X)", placeholder: "e.g. 25" },
      { id: "whole", label: "Whole (Y)", placeholder: "e.g. 200" },
    ],
    compute: ({ part, whole }) => [
      {
        label: `${formatNum(part)} is __% of ${formatNum(whole)}`,
        value: `${formatNum(round((part / whole) * 100))}%`,
        highlight: true,
      },
      {
        label: "As a fraction",
        value: `${formatNum(part)} / ${formatNum(whole)}`,
      },
    ],
  },
  {
    id: "percentChange",
    title: "Percentage Change",
    description: "Calculate % increase or decrease between two values.",
    emoji: "📈",
    color: "from-emerald-500 to-teal-600",
    fields: [
      { id: "from", label: "From (Old Value)", placeholder: "e.g. 1000" },
      { id: "to", label: "To (New Value)", placeholder: "e.g. 1200" },
    ],
    compute: ({ from, to }) => {
      const change = round(((to - from) / from) * 100);
      const isIncrease = to >= from;
      return [
        {
          label: `${isIncrease ? "Increase" : "Decrease"} %`,
          value: `${change > 0 ? "+" : ""}${formatNum(change)}%`,
          highlight: true,
        },
        { label: "Absolute change", value: formatNum(round(to - from)) },
        {
          label: "Direction",
          value: isIncrease ? "📈 Increase" : "📉 Decrease",
        },
      ];
    },
  },
  {
    id: "addPercent",
    title: "Add Percentage to Number",
    description: "Increase a number by a percentage (e.g. add GST).",
    emoji: "➕",
    color: "from-amber-500 to-orange-600",
    fields: [
      { id: "base", label: "Base Number", placeholder: "e.g. 100000" },
      { id: "pct", label: "Add (%)", placeholder: "e.g. 18" },
    ],
    compute: ({ base, pct }) => {
      const added = round((base * pct) / 100);
      return [
        {
          label: `${formatNum(base)} + ${formatNum(pct)}%`,
          value: formatNum(round(base + added)),
          highlight: true,
        },
        { label: `${formatNum(pct)}% amount`, value: formatNum(added) },
      ];
    },
  },
  {
    id: "subtractPercent",
    title: "Subtract Percentage from Number",
    description: "Decrease a number by a percentage (e.g. apply discount).",
    emoji: "➖",
    color: "from-rose-500 to-pink-600",
    fields: [
      { id: "base", label: "Original Number", placeholder: "e.g. 5000" },
      { id: "pct", label: "Subtract (%)", placeholder: "e.g. 20" },
    ],
    compute: ({ base, pct }) => {
      const removed = round((base * pct) / 100);
      return [
        {
          label: `${formatNum(base)} − ${formatNum(pct)}%`,
          value: formatNum(round(base - removed)),
          highlight: true,
        },
        { label: `${formatNum(pct)}% discount`, value: formatNum(removed) },
        {
          label: "You save",
          value: `${formatNum(removed)} (${formatNum(pct)}%)`,
        },
      ];
    },
  },
  {
    id: "findOriginal",
    title: "Find Original Value",
    description: "After a % increase/decrease, what was the original?",
    emoji: "🔍",
    color: "from-sky-500 to-indigo-600",
    fields: [
      { id: "result", label: "Value After Change", placeholder: "e.g. 11800" },
      { id: "pct", label: "% Change (+ or –)", placeholder: "e.g. 18 or -10" },
    ],
    compute: ({ result, pct }) => {
      const original = round(result / (1 + pct / 100));
      return [
        {
          label: "Original value",
          value: formatNum(original),
          highlight: true,
        },
        { label: "Change amount", value: formatNum(round(result - original)) },
        {
          label: "Verify",
          value: `${formatNum(original)} ${pct >= 0 ? "+" : ""}${formatNum(pct)}% = ${formatNum(result)}`,
        },
      ];
    },
  },
  {
    id: "ratioPct",
    title: "Ratio to Percentage",
    description: "Convert a ratio (X out of Y) to a percentage.",
    emoji: "🎯",
    color: "from-fuchsia-500 to-purple-600",
    fields: [
      { id: "part", label: "X (Got / Part)", placeholder: "e.g. 45" },
      { id: "whole", label: "Y (Total / Whole)", placeholder: "e.g. 60" },
    ],
    compute: ({ part, whole }) => {
      const pct = round((part / whole) * 100);
      return [
        {
          label: `${formatNum(part)} out of ${formatNum(whole)}`,
          value: `${formatNum(pct)}%`,
          highlight: true,
        },
        {
          label: "Grade (if exam)",
          value:
            pct >= 90
              ? "🏆 A+"
              : pct >= 75
                ? "✅ A"
                : pct >= 60
                  ? "👍 B"
                  : pct >= 40
                    ? "⚠️ C"
                    : "❌ Fail",
        },
        {
          label: "Wrong / Missed",
          value: `${formatNum(round(whole - part))} (${formatNum(round(100 - pct))}%)`,
        },
      ];
    },
  },
  {
    id: "splitPercent",
    title: "Split Amount by Percentage",
    description: "Split a total amount into two parts by percentage.",
    emoji: "✂️",
    color: "from-lime-500 to-green-600",
    fields: [
      { id: "total", label: "Total Amount", placeholder: "e.g. 100000" },
      { id: "pct", label: "First Part (%)", placeholder: "e.g. 30" },
    ],
    compute: ({ total, pct }) => {
      const first = round((total * pct) / 100);
      const second = round(total - first);
      return [
        {
          label: `First part (${formatNum(pct)}%)`,
          value: formatNum(first),
          highlight: true,
        },
        {
          label: `Second part (${formatNum(round(100 - pct))}%)`,
          value: formatNum(second),
          highlight: true,
        },
        { label: "Total", value: formatNum(total) },
      ];
    },
  },
];

// ── single calc card ───────────────────────────────────────────────────────
function CalcCard({ config }: { config: CalcConfig }) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const numVals = Object.fromEntries(
    config.fields.map((f) => [f.id, parseFloat(vals[f.id] ?? "") || 0]),
  );
  const allFilled = config.fields.every(
    (f) => vals[f.id] && !isNaN(parseFloat(vals[f.id])),
  );
  const results = allFilled ? config.compute(numVals) : [];

  const handleCopy = () => {
    const text = results.map((r) => `${r.label}: ${r.value}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => setVals({});

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-5`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.emoji}</span>
          <div>
            <h2 className="font-display font-bold text-white text-base leading-tight">
              {config.title}
            </h2>
            <p className="text-white/70 text-xs mt-0.5">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {config.fields.map((field) => (
            <div key={field.id}>
              <label className="label">{field.label}</label>
              <input
                type="number"
                value={vals[field.id] ?? ""}
                onChange={(e) =>
                  setVals((prev) => ({ ...prev, [field.id]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="input-field"
              />
            </div>
          ))}
        </div>

        {/* Results */}
        {allFilled && results.length > 0 ? (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between ${r.highlight ? "pb-2 border-b border-gray-200 last:border-0 last:pb-0" : ""}`}
              >
                <span className="text-xs text-gray-500">{r.label}</span>
                <span
                  className={`font-display font-bold text-sm ${r.highlight ? "text-zest-500 text-base" : "text-ink-700"}`}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400">
            Fill in both fields to see the result
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          {allFilled && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-zest-500 hover:text-zest-600 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy result"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function PercentageCalculatorClient() {
  return (
    <div>
      {/* Quick reference bar */}
      <div className="bg-ink-900 rounded-2xl p-4 mb-8 flex flex-wrap gap-x-6 gap-y-2">
        <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/30 w-full mb-1">
          Quick Formula Reference
        </span>
        {[
          { label: "X% of Y", formula: "(X ÷ 100) × Y" },
          { label: "% Change", formula: "((New − Old) ÷ Old) × 100" },
          { label: "X of Y as %", formula: "(X ÷ Y) × 100" },
          { label: "Add X% to Y", formula: "Y × (1 + X/100)" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            <span className="text-xs text-white/40">{f.label}:</span>
            <span className="font-mono text-xs text-glow">{f.formula}</span>
          </div>
        ))}
      </div>

      {/* Calculator grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-5">
        {CALCULATORS.map((config) => (
          <CalcCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}
