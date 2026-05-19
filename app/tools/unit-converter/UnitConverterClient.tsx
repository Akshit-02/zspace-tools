"use client";
import { useState, useMemo, useCallback } from "react";
import { Copy, Check, RotateCcw, ArrowLeftRight } from "lucide-react";

// ── UNIT DEFINITIONS ────────────────────────────────────────────────────────
type UnitDef = { label: string; factor: number; offset?: number };
type Category = {
  label: string;
  icon: string;
  color: string;
  bg: string;
  units: Record<string, UnitDef>;
};

const CATEGORIES: Record<string, Category> = {
  length: {
    label: "Length",
    icon: "📏",
    color: "text-blue-500",
    bg: "bg-blue-50",
    units: {
      mm: { label: "Millimetre (mm)", factor: 0.001 },
      cm: { label: "Centimetre (cm)", factor: 0.01 },
      m: { label: "Metre (m)", factor: 1 },
      km: { label: "Kilometre (km)", factor: 1000 },
      in: { label: "Inch (in)", factor: 0.0254 },
      ft: { label: "Foot (ft)", factor: 0.3048 },
      yd: { label: "Yard (yd)", factor: 0.9144 },
      mi: { label: "Mile (mi)", factor: 1609.344 },
      nmi: { label: "Nautical Mile", factor: 1852 },
      ly: { label: "Light Year", factor: 9.461e15 },
    },
  },
  weight: {
    label: "Weight / Mass",
    icon: "⚖️",
    color: "text-amber-500",
    bg: "bg-amber-50",
    units: {
      mg: { label: "Milligram (mg)", factor: 0.000001 },
      g: { label: "Gram (g)", factor: 0.001 },
      kg: { label: "Kilogram (kg)", factor: 1 },
      t: { label: "Metric Ton (t)", factor: 1000 },
      oz: { label: "Ounce (oz)", factor: 0.0283495 },
      lb: { label: "Pound (lb)", factor: 0.453592 },
      st: { label: "Stone (st)", factor: 6.35029 },
      quintal: { label: "Quintal", factor: 100 },
    },
  },
  temperature: {
    label: "Temperature",
    icon: "🌡️",
    color: "text-rose-500",
    bg: "bg-rose-50",
    units: {
      c: { label: "Celsius (°C)", factor: 1, offset: 0 },
      f: { label: "Fahrenheit (°F)", factor: 1, offset: 0 },
      k: { label: "Kelvin (K)", factor: 1, offset: 0 },
    },
  },
  area: {
    label: "Area",
    icon: "📐",
    color: "text-violet-500",
    bg: "bg-violet-50",
    units: {
      mm2: { label: "Sq Millimetre (mm²)", factor: 0.000001 },
      cm2: { label: "Sq Centimetre (cm²)", factor: 0.0001 },
      m2: { label: "Sq Metre (m²)", factor: 1 },
      km2: { label: "Sq Kilometre (km²)", factor: 1e6 },
      ha: { label: "Hectare (ha)", factor: 10000 },
      ac: { label: "Acre (ac)", factor: 4046.86 },
      ft2: { label: "Sq Foot (ft²)", factor: 0.092903 },
      in2: { label: "Sq Inch (in²)", factor: 0.00064516 },
      mi2: { label: "Sq Mile (mi²)", factor: 2.59e6 },
      bigha: { label: "Bigha (India)", factor: 1337.8 },
    },
  },
  volume: {
    label: "Volume",
    icon: "🧪",
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    units: {
      ml: { label: "Millilitre (ml)", factor: 0.001 },
      l: { label: "Litre (L)", factor: 1 },
      m3: { label: "Cubic Metre (m³)", factor: 1000 },
      cm3: { label: "Cubic Cm (cm³)", factor: 0.001 },
      tsp: { label: "Teaspoon (tsp)", factor: 0.00492892 },
      tbsp: { label: "Tablespoon", factor: 0.0147868 },
      floz: { label: "Fl Ounce (fl oz)", factor: 0.0295735 },
      cup: { label: "Cup (US)", factor: 0.236588 },
      pt: { label: "Pint (US)", factor: 0.473176 },
      qt: { label: "Quart (US)", factor: 0.946353 },
      gal: { label: "Gallon (US)", factor: 3.78541 },
    },
  },
  speed: {
    label: "Speed",
    icon: "💨",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    units: {
      mps: { label: "Metre/sec (m/s)", factor: 1 },
      kmh: { label: "Kilometre/hr (km/h)", factor: 0.277778 },
      mph: { label: "Mile/hr (mph)", factor: 0.44704 },
      kn: { label: "Knot (kn)", factor: 0.514444 },
      fps: { label: "Foot/sec (fps)", factor: 0.3048 },
      mach: { label: "Mach (at sea lvl)", factor: 340.29 },
    },
  },
  time: {
    label: "Time",
    icon: "⏱️",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    units: {
      ms: { label: "Millisecond (ms)", factor: 0.001 },
      s: { label: "Second (s)", factor: 1 },
      min: { label: "Minute (min)", factor: 60 },
      hr: { label: "Hour (hr)", factor: 3600 },
      day: { label: "Day", factor: 86400 },
      week: { label: "Week", factor: 604800 },
      month: { label: "Month (avg)", factor: 2629800 },
      year: { label: "Year", factor: 31557600 },
    },
  },
  data: {
    label: "Data Storage",
    icon: "💾",
    color: "text-pink-500",
    bg: "bg-pink-50",
    units: {
      b: { label: "Bit (b)", factor: 0.125 },
      B: { label: "Byte (B)", factor: 1 },
      KB: { label: "Kilobyte (KB)", factor: 1024 },
      MB: { label: "Megabyte (MB)", factor: 1048576 },
      GB: { label: "Gigabyte (GB)", factor: 1073741824 },
      TB: { label: "Terabyte (TB)", factor: 1.0995e12 },
      PB: { label: "Petabyte (PB)", factor: 1.1259e15 },
      Kib: { label: "Kibibyte (KiB)", factor: 1024 },
      Mib: { label: "Mebibyte (MiB)", factor: 1048576 },
    },
  },
  pressure: {
    label: "Pressure",
    icon: "🔵",
    color: "text-teal-500",
    bg: "bg-teal-50",
    units: {
      pa: { label: "Pascal (Pa)", factor: 1 },
      kpa: { label: "Kilopascal (kPa)", factor: 1000 },
      mpa: { label: "Megapascal (MPa)", factor: 1e6 },
      bar: { label: "Bar", factor: 100000 },
      atm: { label: "Atmosphere (atm)", factor: 101325 },
      psi: { label: "PSI", factor: 6894.76 },
      mmhg: { label: "mmHg (Torr)", factor: 133.322 },
    },
  },
  energy: {
    label: "Energy",
    icon: "⚡",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    units: {
      j: { label: "Joule (J)", factor: 1 },
      kj: { label: "Kilojoule (kJ)", factor: 1000 },
      cal: { label: "Calorie (cal)", factor: 4.184 },
      kcal: { label: "Kilocalorie (kcal)", factor: 4184 },
      wh: { label: "Watt-hour (Wh)", factor: 3600 },
      kwh: { label: "Kilowatt-hr (kWh)", factor: 3600000 },
      btu: { label: "BTU", factor: 1055.06 },
      ev: { label: "Electronvolt (eV)", factor: 1.602e-19 },
    },
  },
};

// ── TEMPERATURE CONVERSIONS (special case) ──────────────────────────────────
function convertTemp(value: number, from: string, to: string): number {
  // Convert to Celsius first
  let celsius: number;
  if (from === "c") celsius = value;
  else if (from === "f") celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15; // kelvin

  // Celsius to target
  if (to === "c") return celsius;
  if (to === "f") return (celsius * 9) / 5 + 32;
  return celsius + 273.15; // kelvin
}

function convert(
  value: number,
  from: string,
  to: string,
  catKey: string,
): number {
  if (isNaN(value)) return 0;
  if (catKey === "temperature") return convertTemp(value, from, to);
  const cat = CATEGORIES[catKey];
  const fromFactor = cat.units[from].factor;
  const toFactor = cat.units[to].factor;
  return (value * fromFactor) / toFactor;
}

function smartFormat(n: number): string {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toPrecision(6) + " × 10¹²";
  if (abs >= 1e9) return (n / 1e9).toPrecision(6) + " × 10⁹";
  if (abs >= 1e6)
    return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
  if (abs >= 100)
    return n.toLocaleString("en-IN", { maximumFractionDigits: 4 });
  if (abs >= 1) return n.toLocaleString("en-IN", { maximumFractionDigits: 6 });
  if (abs >= 1e-4) return n.toPrecision(6);
  return n.toExponential(4);
}

export default function UnitConverterClient() {
  const [activeCat, setActiveCat] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [inputVal, setInputVal] = useState("1");
  const [copied, setCopied] = useState<string | null>(null);

  const cat = CATEGORIES[activeCat];
  const unitKeys = Object.keys(cat.units);

  // When category changes, reset to first two units
  const handleCatChange = (key: string) => {
    setActiveCat(key);
    const units = Object.keys(CATEGORIES[key].units);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setInputVal("1");
  };

  const numInput = parseFloat(inputVal) || 0;
  const result = useMemo(
    () => convert(numInput, fromUnit, toUnit, activeCat),
    [numInput, fromUnit, toUnit, activeCat],
  );

  // All units converted from input for the reference table
  const allResults = useMemo(() => {
    return unitKeys.map((key) => ({
      key,
      label: cat.units[key].label,
      value: convert(numInput, fromUnit, key, activeCat),
    }));
  }, [numInput, fromUnit, activeCat, unitKeys, cat.units]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputVal(smartFormat(result).replace(/ ×.*/, ""));
  };

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Category tabs — scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            onClick={() => handleCatChange(key)}
            aria-pressed={activeCat === key}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all border ${
              activeCat === key
                ? `${c.bg} ${c.color} border-current/20`
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <span>{c.icon}</span>
            <span className="hidden sm:inline">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── CONVERTER ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">{cat.icon}</span>
              <h2 className="font-display font-bold text-lg text-ink-800">
                {cat.label} Converter
              </h2>
            </div>

            {/* From */}
            <div className="mb-3">
              <label className="label">From</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="input-field flex-1 text-lg font-display font-semibold"
                  placeholder="Enter value"
                  aria-label="Value to convert"
                />
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="input-field w-48 flex-shrink-0 text-sm"
                  aria-label="From unit"
                >
                  {unitKeys.map((k) => (
                    <option key={k} value={k}>
                      {cat.units[k].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex justify-center my-3">
              <button
                onClick={handleSwap}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-ink-700 transition-all"
                aria-label="Swap units"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Swap
              </button>
            </div>

            {/* To */}
            <div className="mb-6">
              <label className="label">To</label>
              <div className="flex gap-3">
                <div className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-display font-semibold text-ink-800 min-h-[48px] flex items-center">
                  {inputVal ? smartFormat(result) : "—"}
                </div>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="input-field w-48 flex-shrink-0 text-sm"
                  aria-label="To unit"
                >
                  {unitKeys.map((k) => (
                    <option key={k} value={k}>
                      {cat.units[k].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result highlight */}
            {inputVal && (
              <div className="bg-ink-900 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-white/30 mb-1 font-display uppercase tracking-wider">
                    Result
                  </p>
                  <p className="text-white font-body text-sm">
                    <span className="font-display font-bold text-xl text-white">
                      {inputVal}
                    </span>
                    <span className="text-white/40 mx-2">
                      {cat.units[fromUnit]?.label}
                    </span>
                    <span className="text-white/40">=</span>
                    <span className="font-display font-bold text-xl text-glow mx-2">
                      {smartFormat(result)}
                    </span>
                    <span className="text-white/40">
                      {cat.units[toUnit]?.label}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleCopy(
                      `${inputVal} ${cat.units[fromUnit].label} = ${smartFormat(result)} ${cat.units[toUnit].label}`,
                      "main",
                    )
                  }
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                >
                  {copied === "main" ? (
                    <Check className="w-3.5 h-3.5 text-glow" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied === "main" ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setInputVal("1");
              }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-4"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* ── REFERENCE TABLE ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider">
                All {cat.label} Units
              </h3>
              <span className="text-xs text-gray-400">
                from {inputVal || "1"} {fromUnit}
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {allResults.map(({ key, label, value }) => {
                const isFrom = key === fromUnit;
                const isTo = key === toUnit;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-5 py-3 transition-colors ${
                      isFrom
                        ? "bg-zest-500/5"
                        : isTo
                          ? "bg-glow/10"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {(isFrom || isTo) && (
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isFrom ? "bg-zest-500" : "bg-emerald-400"}`}
                        />
                      )}
                      <span className="text-xs text-gray-500 truncate">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-sm font-display font-semibold text-ink-800 text-right">
                        {inputVal ? smartFormat(value) : "—"}
                      </span>
                      <button
                        onClick={() => handleCopy(smartFormat(value), key)}
                        className="text-gray-300 hover:text-gray-500 transition-colors"
                        aria-label={`Copy ${label} value`}
                      >
                        {copied === key ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick reference cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider mb-4">
          Common {cat.label} Conversions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {getCommonConversions(activeCat).map((conv, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 ${cat.bg} border border-current/10`}
            >
              <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
                {conv.label}
              </p>
              <p className={`text-sm font-display font-semibold ${cat.color}`}>
                {conv.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quick reference conversions per category
function getCommonConversions(cat: string) {
  const map: Record<string, { label: string; value: string }[]> = {
    length: [
      { label: "1 km", value: "0.621 miles" },
      { label: "1 mile", value: "1.609 km" },
      { label: "1 m", value: "3.281 ft" },
      { label: "1 ft", value: "30.48 cm" },
      { label: "1 inch", value: "2.54 cm" },
      { label: "1 yard", value: "0.914 m" },
      { label: "1 cm", value: "0.394 in" },
      { label: "100 m", value: "328.1 ft" },
    ],
    weight: [
      { label: "1 kg", value: "2.205 lb" },
      { label: "1 lb", value: "453.6 g" },
      { label: "1 oz", value: "28.35 g" },
      { label: "1 ton", value: "1,000 kg" },
      { label: "1 stone", value: "6.35 kg" },
      { label: "100 g", value: "3.527 oz" },
    ],
    temperature: [
      { label: "0°C", value: "32°F / 273.15K" },
      { label: "100°C", value: "212°F / 373.15K" },
      { label: "37°C", value: "98.6°F (body)" },
      { label: "-40°C", value: "-40°F (equal)" },
      { label: "20°C", value: "68°F (room)" },
      { label: "0°F", value: "-17.78°C" },
    ],
    area: [
      { label: "1 acre", value: "0.405 ha" },
      { label: "1 ha", value: "2.471 acres" },
      { label: "1 km²", value: "100 ha" },
      { label: "1 bigha", value: "1,337.8 m²" },
      { label: "1 sq mile", value: "640 acres" },
      { label: "1 m²", value: "10.764 ft²" },
    ],
    volume: [
      { label: "1 L", value: "1,000 ml" },
      { label: "1 gal", value: "3.785 L" },
      { label: "1 cup", value: "236.6 ml" },
      { label: "1 pint", value: "473.2 ml" },
      { label: "1 fl oz", value: "29.57 ml" },
      { label: "1 tbsp", value: "14.79 ml" },
    ],
    speed: [
      { label: "1 km/h", value: "0.278 m/s" },
      { label: "1 mph", value: "1.609 km/h" },
      { label: "1 knot", value: "1.852 km/h" },
      { label: "1 mach", value: "1,235 km/h" },
      { label: "100 km/h", value: "62.14 mph" },
      { label: "60 mph", value: "96.56 km/h" },
    ],
    time: [
      { label: "1 day", value: "86,400 s" },
      { label: "1 week", value: "7 days" },
      { label: "1 month", value: "~30.44 days" },
      { label: "1 year", value: "365.25 days" },
      { label: "1 hr", value: "3,600 s" },
      { label: "1 min", value: "60 s" },
    ],
    data: [
      { label: "1 KB", value: "1,024 B" },
      { label: "1 MB", value: "1,024 KB" },
      { label: "1 GB", value: "1,024 MB" },
      { label: "1 TB", value: "1,024 GB" },
      { label: "1 byte", value: "8 bits" },
      { label: "1 MB", value: "8,388,608 bits" },
    ],
    pressure: [
      { label: "1 atm", value: "101,325 Pa" },
      { label: "1 bar", value: "100,000 Pa" },
      { label: "1 psi", value: "6,894.76 Pa" },
      { label: "1 atm", value: "14.696 psi" },
      { label: "1 kPa", value: "0.145 psi" },
      { label: "1 bar", value: "0.987 atm" },
    ],
    energy: [
      { label: "1 kcal", value: "4,184 J" },
      { label: "1 kWh", value: "3.6 MJ" },
      { label: "1 BTU", value: "1,055 J" },
      { label: "1 cal", value: "4.184 J" },
      { label: "1 kJ", value: "0.239 kcal" },
      { label: "1 Wh", value: "3,600 J" },
    ],
  };
  return map[cat] ?? [];
}
