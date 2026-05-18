"use client";
import { useState, useMemo } from "react";
import { RotateCcw, Copy, Check, Info } from "lucide-react";

type Unit = "metric" | "imperial";
type Gender = "male" | "female";

interface BMICategory {
  label: string;
  range: string;
  color: string;
  bg: string;
  border: string;
  tip: string;
}

const BMI_CATEGORIES: BMICategory[] = [
  {
    label: "Underweight",
    range: "< 18.5",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    tip: "Consider consulting a nutritionist to reach a healthy weight.",
  },
  {
    label: "Normal weight",
    range: "18.5 – 24.9",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    tip: "Great job! Maintain your weight through balanced diet and regular exercise.",
  },
  {
    label: "Overweight",
    range: "25 – 29.9",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    tip: "Small lifestyle changes in diet and activity can help reach normal range.",
  },
  {
    label: "Obese (Class I)",
    range: "30 – 34.9",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    tip: "Consider speaking with a healthcare provider about a weight management plan.",
  },
  {
    label: "Obese (Class II)",
    range: "35 – 39.9",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    tip: "Medical guidance is recommended for safe and effective weight management.",
  },
  {
    label: "Obese (Class III)",
    range: "≥ 40",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    tip: "Please consult a doctor. Medical intervention may be necessary.",
  },
];

function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return BMI_CATEGORIES[0];
  if (bmi < 25) return BMI_CATEGORIES[1];
  if (bmi < 30) return BMI_CATEGORIES[2];
  if (bmi < 35) return BMI_CATEGORIES[3];
  if (bmi < 40) return BMI_CATEGORIES[4];
  return BMI_CATEGORIES[5];
}

// Needle position on gauge (0–180 deg)
function bmiToAngle(bmi: number): number {
  const clamped = Math.min(Math.max(bmi, 10), 45);
  return ((clamped - 10) / (45 - 10)) * 180;
}

// Ideal weight range using BMI 18.5–24.9 for given height (cm)
function idealWeightRange(heightCm: number) {
  const h = heightCm / 100;
  return {
    min: Math.round(18.5 * h * h),
    max: Math.round(24.9 * h * h),
  };
}

export default function BMICalculatorClient() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("25");
  // Metric
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("70");
  // Imperial
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("7");
  const [weightLb, setWeightLb] = useState("154");
  const [copied, setCopied] = useState(false);

  const { bmi, heightCmCalc, weightKgCalc } = useMemo(() => {
    let hCm = 0,
      wKg = 0;
    if (unit === "metric") {
      hCm = parseFloat(heightCm) || 0;
      wKg = parseFloat(weightKg) || 0;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      hCm = (ft * 12 + inch) * 2.54;
      wKg = (parseFloat(weightLb) || 0) * 0.453592;
    }
    const hM = hCm / 100;
    const bmi = hM > 0 && wKg > 0 ? wKg / (hM * hM) : 0;
    return { bmi, heightCmCalc: hCm, weightKgCalc: wKg };
  }, [unit, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const category = bmi > 0 ? getBMICategory(bmi) : null;
  const angle = bmiToAngle(bmi);
  const ideal = heightCmCalc > 0 ? idealWeightRange(heightCmCalc) : null;
  const hasResult = bmi > 0;

  const handleCopy = () => {
    const text = `BMI Result\nBMI: ${bmi.toFixed(1)}\nCategory: ${category?.label}\nHeight: ${heightCmCalc.toFixed(0)} cm\nWeight: ${weightKgCalc.toFixed(1)} kg\nIdeal Weight: ${ideal?.min}–${ideal?.max} kg`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setUnit("metric");
    setGender("male");
    setAge("25");
    setHeightCm("170");
    setWeightKg("70");
    setHeightFt("5");
    setHeightIn("7");
    setWeightLb("154");
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Unit toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <p className="label">Unit System</p>
          <div className="grid grid-cols-2 gap-2">
            {(["metric", "imperial"] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                aria-pressed={unit === u}
                className={`py-2.5 rounded-xl text-sm font-display font-semibold capitalize transition-all ${
                  unit === u
                    ? "bg-zest-500 text-white shadow-glow-sm"
                    : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                }`}
              >
                {u === "metric" ? "🌍 Metric (kg/cm)" : "🇺🇸 Imperial (lb/ft)"}
              </button>
            ))}
          </div>
        </div>

        {/* Personal details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Your Details
          </h2>

          {/* Gender */}
          <div>
            <p className="label">Gender</p>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  aria-pressed={gender === g}
                  className={`py-2.5 rounded-xl text-sm font-display font-semibold capitalize transition-all ${
                    gender === g
                      ? "bg-ink-800 text-white"
                      : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {g === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="label">
              Age (years)
            </label>
            <input
              id="age"
              type="number"
              min="2"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="input-field"
              placeholder="e.g. 25"
            />
          </div>

          {/* Height */}
          <div>
            <label className="label">Height</label>
            {unit === "metric" ? (
              <>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="input-field pr-12"
                    placeholder="170"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    cm
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="220"
                  step="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>100 cm</span>
                  <span>220 cm</span>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="input-field pr-10"
                    placeholder="5"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="input-field pr-10"
                    placeholder="7"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    in
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="label">Weight</label>
            {unit === "metric" ? (
              <>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="input-field pr-12"
                    placeholder="70"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    kg
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full mt-3 accent-zest-500 h-1.5 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>20 kg</span>
                  <span>200 kg</span>
                </div>
              </>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="600"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  className="input-field pr-12"
                  placeholder="154"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                  lb
                </span>
              </div>
            )}
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
        {/* BMI Gauge card */}
        <div
          className={`rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
            hasResult
              ? "bg-ink-900 border-ink-700 shadow-glow-sm"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {hasResult && category ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  Your BMI Score
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

              {/* Gauge */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-56 h-28 overflow-hidden">
                  <svg viewBox="0 0 200 110" className="w-full h-full">
                    {/* Track segments */}
                    {[
                      { color: "#3b82f6", start: 0, end: 30 }, // Underweight
                      { color: "#10b981", start: 30, end: 72 }, // Normal
                      { color: "#f59e0b", start: 72, end: 108 }, // Overweight
                      { color: "#f97316", start: 108, end: 140 }, // Obese I
                      { color: "#f43f5e", start: 140, end: 162 }, // Obese II
                      { color: "#dc2626", start: 162, end: 180 }, // Obese III
                    ].map((seg, i) => {
                      const r = 80;
                      const cx = 100,
                        cy = 100;
                      const toRad = (d: number) => ((d - 180) * Math.PI) / 180;
                      const x1 = cx + r * Math.cos(toRad(seg.start));
                      const y1 = cy + r * Math.sin(toRad(seg.start));
                      const x2 = cx + r * Math.cos(toRad(seg.end));
                      const y2 = cy + r * Math.sin(toRad(seg.end));
                      const large = seg.end - seg.start > 90 ? 1 : 0;
                      return (
                        <path
                          key={i}
                          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                          fill={seg.color}
                          opacity="0.85"
                        />
                      );
                    })}
                    {/* Inner circle mask */}
                    <circle cx="100" cy="100" r="54" fill="#080818" />
                    {/* Needle */}
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 52 * Math.cos(((angle - 180) * Math.PI) / 180)}
                      y2={100 + 52 * Math.sin(((angle - 180) * Math.PI) / 180)}
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="100" cy="100" r="5" fill="white" />
                  </svg>
                </div>

                <div className="text-center -mt-2">
                  <div className="text-5xl font-display font-extrabold text-white">
                    {bmi.toFixed(1)}
                  </div>
                  <div
                    className={`text-sm font-display font-semibold mt-1 ${category.color.replace("text-", "text-").replace("600", "400").replace("700", "400")}`}
                  >
                    {category.label}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Height", value: `${heightCmCalc.toFixed(0)} cm` },
                  { label: "Weight", value: `${weightKgCalc.toFixed(1)} kg` },
                  {
                    label: "Ideal Weight",
                    value: ideal ? `${ideal.min}–${ideal.max} kg` : "—",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white/5 rounded-xl p-3 text-center"
                  >
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                      {s.label}
                    </p>
                    <p className="text-sm font-display font-semibold text-white">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">⚖️</div>
              <p className="text-sm text-gray-400">
                Enter your height and weight to calculate BMI
              </p>
            </div>
          )}
        </div>

        {/* Category + tip */}
        {hasResult && category && (
          <div
            className={`rounded-2xl border p-5 ${category.bg} ${category.border}`}
          >
            <div className="flex items-start gap-3">
              <Info
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${category.color}`}
              />
              <div>
                <p
                  className={`font-display font-semibold text-sm mb-1 ${category.color}`}
                >
                  {category.label} · BMI {category.range}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {category.tip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full BMI scale */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              BMI Scale
            </h3>
            <div className="space-y-2">
              {BMI_CATEGORIES.map((cat) => {
                const isActive = category?.label === cat.label;
                return (
                  <div
                    key={cat.label}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
                      isActive
                        ? `${cat.bg} ${cat.border} ring-1 ring-offset-1 ${cat.border}`
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isActive && (
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${cat.color.replace("text-", "bg-")}`}
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${isActive ? cat.color : "text-gray-500"}`}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-display font-semibold ${isActive ? cat.color : "text-gray-400"}`}
                    >
                      {cat.range}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Healthy weight range */}
        {hasResult && ideal && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Healthy Weight Range for Your Height
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">
                  Minimum
                </p>
                <p className="text-2xl font-display font-bold text-emerald-700">
                  {ideal.min} kg
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">BMI 18.5</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-600 mb-1">
                  Maximum
                </p>
                <p className="text-2xl font-display font-bold text-emerald-700">
                  {ideal.max} kg
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">BMI 24.9</p>
              </div>
            </div>
            {weightKgCalc > 0 && (
              <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {weightKgCalc < ideal.min
                  ? `You are ${(ideal.min - weightKgCalc).toFixed(1)} kg below the healthy minimum.`
                  : weightKgCalc > ideal.max
                    ? `You are ${(weightKgCalc - ideal.max).toFixed(1)} kg above the healthy maximum.`
                    : "Your weight is within the healthy range for your height. 🎉"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
