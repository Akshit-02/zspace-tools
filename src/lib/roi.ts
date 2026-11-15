/**
 * Return on investment.
 *
 *   Total cost = initial investment + additional expenses
 *   Net gain   = amount received − total cost      (or the net profit you enter)
 *   ROI %      = net gain ÷ total cost × 100
 *
 * Annualised ROI = ((total cost + net gain) ÷ total cost)^(1/t) − 1, shown only
 * when a duration is given and the money went in once at the start and came
 * back once at the end. With payments in between, a cash-flow method such as
 * XIRR is needed instead.
 */
import { parseNum } from "./discount";

export type RoiEntry = "received" | "profit";

export interface RoiForm {
  label: string;
  cost: string;
  /** Amount received / final value, or net profit, depending on `entry`. */
  value: string;
  entry: RoiEntry;
  expenses: string;
  years: string;
  months: string;
  /** No money added or taken out between the start and the end. */
  singleFlow: boolean;
}

export interface RoiResult {
  label: string;
  totalCost: number;
  received: number;
  gain: number;
  roi: number;
  years: number | null;
  annualised: number | null;
  /** Why annualised ROI isn't shown, when a duration was given. */
  annualisedNote: string | null;
  status: "profit" | "loss" | "breakeven";
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T };

export function roiFromForm(f: RoiForm): Outcome<RoiResult> {
  const cost = parseNum(f.cost);
  const value = parseNum(f.value);
  const exp = f.entry === "received" && f.expenses.trim() ? parseNum(f.expenses) : 0;
  if (cost === null || value === null) return { status: "empty" };
  if (Number.isNaN(cost) || cost < 0) return { status: "error", field: "cost", message: "Enter the initial investment or cost (0 or more)." };
  if (exp === null || Number.isNaN(exp) || exp < 0) return { status: "error", field: "expenses", message: "Additional expenses must be 0 or more." };
  if (Number.isNaN(value)) return { status: "error", field: "value", message: f.entry === "profit" ? "Enter the net profit (use a minus sign for a loss)." : "Enter the total amount received or the final value." };
  if (f.entry === "received" && value < 0) return { status: "error", field: "value", message: "An amount received can't be negative. Choose “Net profit” to enter a loss." };
  const totalCost = cost + exp;
  if (totalCost <= 0) return { status: "error", field: "cost", message: "ROI needs a cost greater than 0 — you can't divide a gain by nothing." };
  const gain = f.entry === "profit" ? value : value - totalCost;
  const received = totalCost + gain;
  if (received < 0) return { status: "error", field: "value", message: "A loss can't be larger than the total cost for ROI." };

  const y = f.years.trim() ? parseNum(f.years) : null;
  const m = f.months.trim() ? parseNum(f.months) : null;
  if (y !== null && (Number.isNaN(y) || y < 0)) return { status: "error", field: "years", message: "Years must be 0 or more." };
  if (m !== null && (Number.isNaN(m) || m < 0 || m >= 12)) return { status: "error", field: "months", message: "Months must be from 0 to 11." };
  const years = y === null && m === null ? null : (y ?? 0) + (m ?? 0) / 12;
  let annualised: number | null = null;
  let annualisedNote: string | null = null;
  if (years !== null) {
    if (years <= 0) annualisedNote = "Enter a duration longer than 0 to annualise.";
    else if (!f.singleFlow) annualisedNote = "With money added or taken out along the way, a simple annualised ROI would be misleading. Use a cash-flow method such as XIRR.";
    else annualised = (Math.pow(received / totalCost, 1 / years) - 1) * 100;
  }
  const roi = (gain / totalCost) * 100;
  return { status: "ok", result: { label: f.label.trim(), totalCost, received, gain, roi, years, annualised, annualisedNote, status: Math.abs(gain) < 1e-9 ? "breakeven" : gain > 0 ? "profit" : "loss" } };
}

/** Illustrative example inputs — not benchmarks. */
export const ROI_EXAMPLES: { id: string; label: string; form: Partial<RoiForm>; note: string }[] = [
  { id: "marketing", label: "Marketing campaign", form: { label: "Festive email + social campaign", cost: "150000", entry: "received", value: "420000", expenses: "30000", years: "0", months: "3" }, note: "Revenue attributed to the campaign is entered as the amount received. If you only know extra profit, choose “Net profit”." },
  { id: "website", label: "Website build", form: { label: "New online store", cost: "250000", entry: "profit", value: "180000", expenses: "", years: "1", months: "0" }, note: "Net profit from online orders in the first year, after product costs." },
  { id: "ads", label: "Advertising", form: { label: "Search ads", cost: "80000", entry: "received", value: "240000", expenses: "12000", years: "0", months: "2" }, note: "Ad spend plus agency fee against revenue from tracked orders." },
  { id: "equipment", label: "Equipment", form: { label: "Packaging machine", cost: "600000", entry: "received", value: "910000", expenses: "40000", years: "3", months: "0" }, note: "Labour savings plus resale value received over three years, against price and installation." },
  { id: "project", label: "Business project", form: { label: "New café outlet", cost: "1800000", entry: "profit", value: "-250000", expenses: "", years: "1", months: "6" }, note: "A project that hasn't paid back yet — ROI can be negative." },
];
