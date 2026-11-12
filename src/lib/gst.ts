/**
 * GST maths for India. All money is handled in integer paise to avoid float
 * drift, and components are derived so that taxable + tax = total exactly.
 *
 * Add GST (exclusive):  tax = amount × rate ÷ 100; total = amount + tax
 * Remove GST (inclusive): taxable = total × 100 ÷ (100 + rate); tax = total − taxable
 * Intra-state: CGST = SGST = tax ÷ 2. Inter-state: IGST = tax.
 */

/** Calculator presets only — this tool does not determine which rate applies to a supply. */
export const GST_PRESETS = [0, 5, 12, 18, 28, 40] as const;

export type GstMode = "add" | "remove";
export type Supply = "intra" | "inter";

export interface GstResult {
  mode: GstMode;
  rate: number;
  supply: Supply;
  taxable: number; // rupees, 2 dp
  tax: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  halfRate: number;
}

export type GstOutcome = { status: "empty" } | { status: "error"; message: string } | { status: "ok"; result: GstResult };

export function parseAmount(s: string): number | null | "empty" {
  const t = s.trim().replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (!t) return "empty";
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

const toPaise = (rupees: number) => Math.round(rupees * 100 + Number.EPSILON * Math.sign(rupees));
const fromPaise = (p: number) => p / 100;

export function calculateGst(mode: GstMode, amountIn: string, rateIn: string, supply: Supply): GstOutcome {
  const amount = parseAmount(amountIn);
  const rate = parseAmount(rateIn);
  if (amount === null) return { status: "error", message: "Enter the amount as a number, for example 1,250 or 999.50." };
  if (rate === null) return { status: "error", message: "Enter the GST rate as a number, for example 18." };
  if (amount === "empty" || rate === "empty") return { status: "empty" };
  if (rate > 100) return { status: "error", message: "A GST rate above 100% isn't realistic — check the rate." };
  if (amount > 1e13) return { status: "error", message: "That amount is too large to calculate reliably." };

  let taxableP: number;
  let totalP: number;
  if (mode === "add") {
    taxableP = toPaise(amount);
    totalP = taxableP + Math.round((taxableP * rate) / 100);
  } else {
    totalP = toPaise(amount);
    taxableP = Math.round((totalP * 100) / (100 + rate));
  }
  const taxP = totalP - taxableP;
  const cgstP = supply === "intra" ? Math.round(taxP / 2) : 0;
  const sgstP = supply === "intra" ? taxP - cgstP : 0;
  return {
    status: "ok",
    result: {
      mode,
      rate,
      supply,
      taxable: fromPaise(taxableP),
      tax: fromPaise(taxP),
      total: fromPaise(totalP),
      cgst: fromPaise(cgstP),
      sgst: fromPaise(sgstP),
      igst: supply === "inter" ? fromPaise(taxP) : 0,
      halfRate: rate / 2,
    },
  };
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatINR = (v: number) => inr.format(v);
export const formatRate = (r: number) => `${Number(r.toFixed(4))}%`;

export function gstSummary(r: GstResult) {
  const lines = [
    "GST calculation — ZSpace Tools",
    "",
    `Calculation:     ${r.mode === "add" ? "Add GST to a GST-exclusive amount" : "Remove GST from a GST-inclusive amount"}`,
    `GST rate:        ${formatRate(r.rate)}`,
    `Supply type:     ${r.supply === "intra" ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}`,
    "",
    `Taxable value:   ${formatINR(r.taxable)}`,
    ...(r.supply === "intra"
      ? [`CGST @ ${formatRate(r.halfRate)}:  ${formatINR(r.cgst)}`, `SGST @ ${formatRate(r.halfRate)}:  ${formatINR(r.sgst)}`]
      : [`IGST @ ${formatRate(r.rate)}:  ${formatINR(r.igst)}`]),
    `Total GST:       ${formatINR(r.tax)}`,
    `Invoice total:   ${formatINR(r.total)}`,
    "",
    "Amounts are rounded to the nearest paisa. Verify the applicable GST rate and tax treatment for your",
    "transaction. This is a calculation aid, not tax or legal advice.",
  ];
  return lines.join("\n");
}
