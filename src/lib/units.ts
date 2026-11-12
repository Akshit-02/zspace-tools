/**
 * Unit conversion with exact definitional constants (SI, international yard &
 * pound agreement 1959, US customary volume). Linear units convert through a
 * base unit; temperature uses affine formulas.
 */

export type UnitCategory = "length" | "mass" | "temperature" | "area" | "volume" | "speed" | "time" | "data";

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  /** Size in base units (ignored for temperature). */
  factor: number;
  group?: string;
}

export interface CategoryDef {
  id: UnitCategory;
  name: string;
  base: string;
  units: Unit[];
  /** Whether negative quantities make sense. */
  allowNegative: boolean;
  defaults: [string, string];
}

const u = (id: string, name: string, symbol: string, factor: number, group?: string): Unit => ({ id, name, symbol, factor, group });

export const UNIT_CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    name: "Length",
    base: "m",
    allowNegative: false,
    defaults: ["cm", "in"],
    units: [
      u("mm", "Millimetre", "mm", 0.001),
      u("cm", "Centimetre", "cm", 0.01),
      u("m", "Metre", "m", 1),
      u("km", "Kilometre", "km", 1000),
      u("in", "Inch", "in", 0.0254),
      u("ft", "Foot", "ft", 0.3048),
      u("yd", "Yard", "yd", 0.9144),
      u("mi", "Mile", "mi", 1609.344),
    ],
  },
  {
    id: "mass",
    name: "Weight",
    base: "kg",
    allowNegative: false,
    defaults: ["kg", "lb"],
    units: [
      u("mg", "Milligram", "mg", 1e-6),
      u("g", "Gram", "g", 0.001),
      u("kg", "Kilogram", "kg", 1),
      u("t", "Metric tonne", "t", 1000),
      u("oz", "Ounce", "oz", 0.028349523125),
      u("lb", "Pound", "lb", 0.45359237),
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    base: "C",
    allowNegative: true,
    defaults: ["C", "F"],
    units: [u("C", "Celsius", "°C", 1), u("F", "Fahrenheit", "°F", 1), u("K", "Kelvin", "K", 1)],
  },
  {
    id: "area",
    name: "Area",
    base: "m2",
    allowNegative: false,
    defaults: ["m2", "ft2"],
    units: [
      u("mm2", "Square millimetre", "mm²", 1e-6),
      u("cm2", "Square centimetre", "cm²", 1e-4),
      u("m2", "Square metre", "m²", 1),
      u("km2", "Square kilometre", "km²", 1e6),
      u("ft2", "Square foot", "ft²", 0.09290304),
      u("yd2", "Square yard", "yd²", 0.83612736),
      u("ac", "Acre", "ac", 4046.8564224),
      u("ha", "Hectare", "ha", 10000),
    ],
  },
  {
    id: "volume",
    name: "Volume",
    base: "L",
    allowNegative: false,
    defaults: ["L", "gal"],
    units: [
      u("mL", "Millilitre", "mL", 0.001),
      u("L", "Litre", "L", 1),
      u("cm3", "Cubic centimetre", "cm³", 0.001),
      u("m3", "Cubic metre", "m³", 1000),
      u("gal", "US gallon", "US gal", 3.785411784),
      u("floz", "US fluid ounce", "US fl oz", 0.0295735295625),
    ],
  },
  {
    id: "speed",
    name: "Speed",
    base: "mps",
    allowNegative: false,
    defaults: ["kmh", "mph"],
    units: [
      u("mps", "Metres per second", "m/s", 1),
      u("kmh", "Kilometres per hour", "km/h", 1000 / 3600),
      u("mph", "Miles per hour", "mph", 0.44704),
      u("kn", "Knots", "kn", 1852 / 3600),
    ],
  },
  {
    id: "time",
    name: "Time",
    base: "s",
    allowNegative: false,
    defaults: ["h", "min"],
    units: [
      u("ms", "Millisecond", "ms", 0.001),
      u("s", "Second", "s", 1),
      u("min", "Minute", "min", 60),
      u("h", "Hour", "h", 3600),
      u("d", "Day", "d", 86400),
      u("wk", "Week", "wk", 604800),
    ],
  },
  {
    id: "data",
    name: "Digital storage",
    base: "B",
    allowNegative: false,
    defaults: ["GB", "MB"],
    units: [
      u("bit", "Bit", "bit", 1 / 8, "Basic"),
      u("B", "Byte", "B", 1, "Basic"),
      u("kB", "Kilobyte", "kB", 1e3, "Decimal (SI, ×1000)"),
      u("MB", "Megabyte", "MB", 1e6, "Decimal (SI, ×1000)"),
      u("GB", "Gigabyte", "GB", 1e9, "Decimal (SI, ×1000)"),
      u("TB", "Terabyte", "TB", 1e12, "Decimal (SI, ×1000)"),
      u("KiB", "Kibibyte", "KiB", 1024, "Binary (IEC, ×1024)"),
      u("MiB", "Mebibyte", "MiB", 1024 ** 2, "Binary (IEC, ×1024)"),
      u("GiB", "Gibibyte", "GiB", 1024 ** 3, "Binary (IEC, ×1024)"),
      u("TiB", "Tebibyte", "TiB", 1024 ** 4, "Binary (IEC, ×1024)"),
    ],
  },
];

export const getUnitCategory = (id: UnitCategory) => UNIT_CATEGORIES.find((c) => c.id === id)!;
const ABS_ZERO_C = -273.15;

function toCelsius(v: number, from: string) {
  return from === "C" ? v : from === "F" ? ((v - 32) * 5) / 9 : v - 273.15;
}
function fromCelsius(c: number, to: string) {
  return to === "C" ? c : to === "F" ? (c * 9) / 5 + 32 : c + 273.15;
}

export type ConvertOutcome = { status: "empty" } | { status: "error"; message: string } | { status: "ok"; value: number };

export function parseQuantity(s: string): number | null | "empty" {
  const t = s.trim().replace(/[\s_ ]/g, "").replace(/^−/, "-");
  if (!t) return "empty";
  const norm = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, "") : /^[+-]?\d*,\d+$/.test(t) ? t.replace(",", ".") : t;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(norm)) return null;
  const v = Number(norm);
  return Number.isFinite(v) ? v : null;
}

export function convert(cat: UnitCategory, input: string, from: string, to: string): ConvertOutcome {
  const v = parseQuantity(input);
  if (v === "empty") return { status: "empty" };
  if (v === null) return { status: "error", message: "Enter a number, for example 12.5 or 1,000." };
  const def = getUnitCategory(cat);
  if (cat === "temperature") {
    const c = toCelsius(v, from);
    if (c < ABS_ZERO_C - 1e-9) return { status: "error", message: "That's below absolute zero (−273.15 °C / −459.67 °F / 0 K), which isn't physically possible." };
    const out = fromCelsius(c, to);
    return Number.isFinite(out) ? { status: "ok", value: out } : { status: "error", message: "That number is too large to convert." };
  }
  if (v < 0 && !def.allowNegative) return { status: "error", message: `${def.name} can't be negative.` };
  const f = def.units.find((x) => x.id === from);
  const t = def.units.find((x) => x.id === to);
  if (!f || !t) return { status: "error", message: "Choose units to convert between." };
  // Multiply first or divide first, whichever keeps the result exact for "nice" inputs.
  const out = from === to ? v : (v * f.factor) / t.factor;
  if (!Number.isFinite(out)) return { status: "error", message: "That number is too large to convert." };
  return { status: "ok", value: out };
}

/** Clean display: up to 12 significant figures, no float noise, scientific for extremes. */
export function formatQuantity(v: number) {
  if (v === 0 || Object.is(v, -0)) return "0";
  const abs = Math.abs(v);
  if (abs >= 1e15 || abs < 1e-6) {
    return v.toExponential(8).replace(/\.?0+e/, "e").replace("e+", " × 10^").replace("e-", " × 10^-");
  }
  return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 12 }).format(v);
}

/** Plain value for copying (no grouping separators). */
export const plainQuantity = (v: number) => String(Number(v.toPrecision(12)));
