/** Percentage maths with validation — never returns NaN or Infinity to the UI. */

export type PercentMode = "of" | "what" | "increase" | "decrease" | "difference" | "discount";

export type Parsed = { kind: "empty" } | { kind: "invalid" } | { kind: "ok"; value: number };

/**
 * Parses user input. Accepts "1,234.5", "1 234.5", "-3", "+2", ".5", "12%" and
 * a single decimal comma ("12,5"). Groups of exactly three digits after commas
 * are treated as thousands separators.
 */
export function parseNumber(input: string): Parsed {
  let s = input.trim().replace(/[\s_  ]/g, "").replace(/%$/, "").replace(/^−/, "-");
  if (!s) return { kind: "empty" };
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^[+-]?\d*,\d+$/.test(s)) s = s.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return { kind: "invalid" };
  const value = Number(s);
  return Number.isFinite(value) ? { kind: "ok", value } : { kind: "invalid" };
}

/** Rounds away binary float noise (0.1 + 0.2) and formats with up to 6 decimals. */
export function fmt(n: number, maxDecimals = 6) {
  if (!Number.isFinite(n)) return "—";
  const clean = Number(n.toPrecision(12));
  const v = Object.is(clean, -0) ? 0 : clean;
  if (Math.abs(v) >= 1e15 || (v !== 0 && Math.abs(v) < 1e-6)) return v.toExponential(4).replace("e+", "e");
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxDecimals }).format(v);
}

export interface PercentResult {
  /** Main answer as shown, e.g. "100" or "25%". */
  display: string;
  /** Plain value for copying, without grouping. */
  copy: string;
  /** One-sentence answer, e.g. "20% of 500 is 100". */
  sentence: string;
  formula: string;
  steps: string[];
  /** Secondary results (discount breakdown). */
  extra?: { label: string; value: string }[];
  note?: string;
}

export type Outcome = { status: "empty" } | { status: "error"; message: string } | { status: "ok"; result: PercentResult };

const pct = (n: number) => `${fmt(n)}%`;
const raw = (n: number) => String(Number(n.toPrecision(12)));

export function calculate(mode: PercentMode, aIn: string, bIn: string): Outcome {
  const a = parseNumber(aIn);
  const b = parseNumber(bIn);
  if (a.kind === "invalid" || b.kind === "invalid") return { status: "error", message: "Please enter numbers only, for example 250 or 12.5." };
  if (a.kind === "empty" || b.kind === "empty") return { status: "empty" };
  const x = a.value;
  const y = b.value;

  switch (mode) {
    case "of": {
      const r = (y * x) / 100;
      return ok({
        display: fmt(r),
        copy: raw(r),
        sentence: `${pct(x)} of ${fmt(y)} is ${fmt(r)}`,
        formula: "Result = Y × X ÷ 100",
        steps: [`${fmt(y)} × ${fmt(x)} = ${fmt(y * x)}`, `${fmt(y * x)} ÷ 100 = ${fmt(r)}`],
      });
    }
    case "what": {
      if (y === 0) return err("The total (Y) can't be zero — a percentage of nothing isn't defined.");
      const r = (x / y) * 100;
      return ok({
        display: pct(r),
        copy: raw(r),
        sentence: `${fmt(x)} is ${pct(r)} of ${fmt(y)}`,
        formula: "Percentage = X ÷ Y × 100",
        steps: [`${fmt(x)} ÷ ${fmt(y)} = ${fmt(x / y, 8)}`, `${fmt(x / y, 8)} × 100 = ${pct(r)}`],
      });
    }
    case "increase":
    case "decrease": {
      if (x === 0) return err("The original value can't be zero — a percentage change from zero isn't defined.");
      const change = y - x;
      const r = (change / Math.abs(x)) * 100;
      const shown = mode === "increase" ? r : -r;
      const wrongWay = (mode === "increase" && change < 0) || (mode === "decrease" && change > 0);
      const word = mode === "increase" ? "increase" : "decrease";
      return ok({
        display: pct(shown),
        copy: raw(shown),
        sentence:
          change === 0
            ? `No change: both values are ${fmt(x)}`
            : `From ${fmt(x)} to ${fmt(y)} is a ${pct(Math.abs(r))} ${change > 0 ? "increase" : "decrease"}`,
        formula:
          mode === "increase" ? "Increase % = (New − Original) ÷ |Original| × 100" : "Decrease % = (Original − New) ÷ |Original| × 100",
        steps:
          mode === "increase"
            ? [`${fmt(y)} − ${fmt(x)} = ${fmt(change)}`, `${fmt(change)} ÷ ${fmt(Math.abs(x))} × 100 = ${pct(shown)}`]
            : [`${fmt(x)} − ${fmt(y)} = ${fmt(-change)}`, `${fmt(-change)} ÷ ${fmt(Math.abs(x))} × 100 = ${pct(shown)}`],
        note: wrongWay
          ? `The value went ${change > 0 ? "up" : "down"}, so this is actually a ${pct(Math.abs(r))} ${change > 0 ? "increase" : "decrease"} — shown as a negative ${word}.`
          : x < 0
            ? "The original value is negative, so the change is measured against its absolute value."
            : undefined,
      });
    }
    case "difference": {
      const avg = Math.abs((x + y) / 2);
      if (avg === 0) return err("These values average to zero, so percentage difference isn't defined.");
      const diff = Math.abs(x - y);
      const r = (diff / avg) * 100;
      return ok({
        display: pct(r),
        copy: raw(r),
        sentence: `The percentage difference between ${fmt(x)} and ${fmt(y)} is ${pct(r)}`,
        formula: "Difference % = |A − B| ÷ ((A + B) ÷ 2) × 100",
        steps: [`|${fmt(x)} − ${fmt(y)}| = ${fmt(diff)}`, `(${fmt(x)} + ${fmt(y)}) ÷ 2 = ${fmt((x + y) / 2)}`, `${fmt(diff)} ÷ ${fmt(avg)} × 100 = ${pct(r)}`],
        note: "Percentage difference treats both values equally. To measure change from one value to another, use Increase or Decrease.",
      });
    }
    case "discount": {
      if (x < 0) return err("The price can't be negative.");
      if (y < 0) return err("The discount can't be negative.");
      const saved = (x * y) / 100;
      const final = x - saved;
      return ok({
        display: fmt(final, 2),
        copy: raw(Math.round(final * 100) / 100),
        sentence: `${pct(y)} off ${fmt(x, 2)} saves ${fmt(saved, 2)}, so you pay ${fmt(final, 2)}`,
        formula: "Saving = Price × Discount ÷ 100 · Final = Price − Saving",
        steps: [`${fmt(x)} × ${fmt(y)} ÷ 100 = ${fmt(saved)} saved`, `${fmt(x)} − ${fmt(saved)} = ${fmt(final)}`],
        extra: [
          { label: "You save", value: fmt(saved, 2) },
          { label: "Final price", value: fmt(final, 2) },
        ],
        note: y > 100 ? "A discount above 100% means the final price is negative — check the percentage." : undefined,
      });
    }
  }
}

const ok = (result: PercentResult): Outcome => ({ status: "ok", result });
const err = (message: string): Outcome => ({ status: "error", message });
