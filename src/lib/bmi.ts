/**
 * Adult body mass index.
 *   BMI = weight (kg) / height (m)²
 * Imperial inputs use exact definitions: 1 in = 2.54 cm, 1 lb = 0.45359237 kg.
 *
 * Categories (WHO / CDC adult cut-offs): < 18.5 underweight, 18.5 to < 25
 * healthy weight, 25 to < 30 overweight, ≥ 30 obesity. The category is decided
 * from the BMI rounded to one decimal — the value shown — so the number and
 * the label always agree (24.96 shows as 25.0 and is "Overweight").
 * Adults (18+) only: children and teenagers need age- and sex-specific
 * percentiles, which this tool does not provide.
 */
import { parseNum } from "./discount";

export const IN_CM = 2.54;
export const LB_KG = 0.45359237;

export type Category = "underweight" | "healthy" | "overweight" | "obesity";
export const CATEGORIES: { id: Category; label: string; from: number; to: number | null; range: string }[] = [
  { id: "underweight", label: "Underweight", from: 0, to: 18.5, range: "below 18.5" },
  { id: "healthy", label: "Healthy weight", from: 18.5, to: 25, range: "18.5 to 24.9" },
  { id: "overweight", label: "Overweight", from: 25, to: 30, range: "25.0 to 29.9" },
  { id: "obesity", label: "Obesity", from: 30, to: null, range: "30.0 and above" },
];

export const round1 = (n: number) => Math.round(n * 10 + 1e-9) / 10;

export function category(bmi: number): Category {
  const b = round1(bmi);
  if (b < 18.5) return "underweight";
  if (b < 25) return "healthy";
  if (b < 30) return "overweight";
  return "obesity";
}

export function bmiValue(kg: number, cm: number) {
  const m = cm / 100;
  return kg / (m * m);
}

/** Weights (kg) that give a BMI of 18.5 and 24.9 at this height. */
export function healthyRange(cm: number) {
  const m2 = (cm / 100) ** 2;
  return { min: 18.5 * m2, max: 24.9 * m2 };
}

export const LIMITS = { minCm: 100, maxCm: 250, minKg: 20, maxKg: 400 };

export interface BmiForm {
  system: "metric" | "imperial";
  cm: string;
  kg: string;
  ft: string;
  inch: string;
  lb: string;
}

export interface BmiResult {
  bmi: number;
  shown: number;
  category: Category;
  cm: number;
  kg: number;
  healthy: { min: number; max: number };
  /** kg to reach the nearest edge of the healthy range (0 when inside it). */
  toHealthy: number;
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field: string } | { status: "ok"; result: T };

export function bmiFromForm(f: BmiForm): Outcome<BmiResult> {
  let cm: number;
  let kg: number;
  if (f.system === "metric") {
    const h = parseNum(f.cm);
    const w = parseNum(f.kg);
    if (h === null || w === null) return { status: "empty" };
    if (Number.isNaN(h) || h <= 0) return { status: "error", field: "cm", message: "Enter your height in centimetres." };
    if (Number.isNaN(w) || w <= 0) return { status: "error", field: "kg", message: "Enter your weight in kilograms." };
    cm = h;
    kg = w;
  } else {
    const ft = parseNum(f.ft);
    const inch = f.inch.trim() ? parseNum(f.inch) : 0;
    const lb = parseNum(f.lb);
    if (ft === null || lb === null) return { status: "empty" };
    if (Number.isNaN(ft) || ft < 0 || !Number.isInteger(ft)) return { status: "error", field: "ft", message: "Enter feet as a whole number, e.g. 5." };
    if (inch === null || Number.isNaN(inch) || inch < 0 || inch >= 12) return { status: "error", field: "inch", message: "Inches must be from 0 to less than 12." };
    if (Number.isNaN(lb) || lb <= 0) return { status: "error", field: "lb", message: "Enter your weight in pounds." };
    cm = (ft * 12 + inch) * IN_CM;
    kg = lb * LB_KG;
  }
  const metric = f.system === "metric";
  if (cm < LIMITS.minCm || cm > LIMITS.maxCm)
    return { status: "error", field: metric ? "cm" : "ft", message: metric ? `Height must be between ${LIMITS.minCm} and ${LIMITS.maxCm} cm.` : "Height must be between 3 ft 4 in and 8 ft 2 in." };
  if (kg < LIMITS.minKg || kg > LIMITS.maxKg)
    return { status: "error", field: metric ? "kg" : "lb", message: metric ? `Weight must be between ${LIMITS.minKg} and ${LIMITS.maxKg} kg.` : "Weight must be between about 44 and 881 lb (20–400 kg)." };
  const bmi = bmiValue(kg, cm);
  const healthy = healthyRange(cm);
  return {
    status: "ok",
    result: { bmi, shown: round1(bmi), category: category(bmi), cm, kg, healthy, toHealthy: kg < healthy.min ? healthy.min - kg : kg > healthy.max ? kg - healthy.max : 0 },
  };
}

export const cmToFtIn = (cm: number) => {
  let inches = Math.round(cm / IN_CM);
  const ft = Math.floor(inches / 12);
  inches -= ft * 12;
  return `${ft} ft ${inches} in`;
};
