/**
 * Invoice model and calculations. All money is handled in integer minor units
 * (cents/paise) to avoid floating-point drift.
 *
 * Calculation order (also shown to users):
 *   1. Line amount      = quantity × unit price
 *   2. Line discount    = % of the line amount, or a fixed amount (capped at the line amount)
 *   3. Subtotal         = Σ (line amount − line discount)
 *   4. Invoice discount = % of the subtotal, or a fixed amount, spread across lines in proportion
 *   5. Taxable amount   = subtotal − invoice discount
 *   6. Tax              = for each tax rate, (Σ taxable amount of lines at that rate) × rate, rounded once
 *                         per rate — avoiding the drift of rounding every line. Line rate, else default rate.
 *                         GST intra-state: split equally into CGST + SGST; inter-state: IGST
 *   7. Grand total      = taxable amount + tax + additional charges (charges are not taxed)
 *   8. Balance due      = grand total − amount paid
 */

export type TaxMode = "none" | "single" | "gst-intra" | "gst-inter";
export type DiscountType = "pct" | "amount";
export type Template = "minimal" | "modern" | "professional";

export interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  discountType: DiscountType;
  /** Empty = use the invoice's default tax rate. */
  taxRate: string;
}

export interface Party {
  name: string;
  company: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  extra: string;
}

export interface Invoice {
  template: Template;
  currency: string;
  number: string;
  date: string;
  dueDate: string;
  terms: string;
  reference: string;
  from: Party;
  to: Party;
  logo: string | null; // data URL (PNG/JPEG)
  items: LineItem[];
  discount: string;
  discountType: DiscountType;
  taxMode: TaxMode;
  taxLabel: string;
  taxRate: string;
  charges: string;
  chargesLabel: string;
  paid: string;
  notes: string;
  payment: string;
  conditions: string;
}

export const CURRENCIES = [
  { code: "INR", locale: "en-IN", label: "INR — Indian rupee" },
  { code: "USD", locale: "en-US", label: "USD — US dollar" },
  { code: "GBP", locale: "en-GB", label: "GBP — British pound" },
  { code: "EUR", locale: "en-IE", label: "EUR — Euro" },
  { code: "AED", locale: "en-AE", label: "AED — UAE dirham" },
  { code: "AUD", locale: "en-AU", label: "AUD — Australian dollar" },
  { code: "SGD", locale: "en-SG", label: "SGD — Singapore dollar" },
  { code: "CAD", locale: "en-CA", label: "CAD — Canadian dollar" },
] as const;

export function formatMoney(minor: number, currency: string) {
  const c = CURRENCIES.find((x) => x.code === currency) ?? CURRENCIES[0];
  return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}

/** Parses a non-negative number; returns null for invalid/negative input. Empty → 0. */
export function parseNum(s: string): number | null {
  const t = s.trim().replace(/[,\s_]/g, "");
  if (!t) return 0;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

/** Rounds half away from zero, tolerating binary float error (2.5 × 19.99 = 49.975 → 49.98). */
const roundHalf = (v: number) => Math.sign(v) * Math.round(Math.abs(v) + 1e-9);
const minor = (v: number) => roundHalf(v * 100);

export interface LineResult {
  id: string;
  amount: number; // minor units
  discount: number;
  net: number;
  taxable: number;
  rate: number;
}

export interface TaxRow {
  label: string;
  rate: number;
  amount: number;
}

export interface Totals {
  lines: LineResult[];
  gross: number;
  lineDiscounts: number;
  subtotal: number;
  invoiceDiscount: number;
  taxable: number;
  taxRows: TaxRow[];
  tax: number;
  charges: number;
  grandTotal: number;
  paid: number;
  balance: number;
  errors: string[];
}

export function calculate(inv: Invoice): Totals {
  const errors: string[] = [];
  const num = (s: string, what: string) => {
    const v = parseNum(s);
    if (v === null) {
      errors.push(`${what} must be a number of 0 or more.`);
      return 0;
    }
    return v;
  };
  const defaultRate = inv.taxMode === "none" ? 0 : num(inv.taxRate, "The tax rate");
  if (defaultRate > 100) errors.push("The tax rate can't be above 100%.");

  const lines: LineResult[] = inv.items.map((it, i) => {
    const q = num(it.quantity, `Item ${i + 1} quantity`);
    const p = num(it.unitPrice, `Item ${i + 1} price`);
    const amount = roundHalf(q * minor(p));
    const dv = num(it.discount, `Item ${i + 1} discount`);
    if (it.discountType === "pct" && dv > 100) errors.push(`Item ${i + 1} discount can't be above 100%.`);
    const discount = Math.min(amount, it.discountType === "pct" ? Math.round((amount * dv) / 100) : minor(dv));
    const lineRate = it.taxRate.trim() === "" ? defaultRate : num(it.taxRate, `Item ${i + 1} tax rate`);
    return { id: it.id, amount, discount, net: amount - discount, taxable: 0, rate: inv.taxMode === "none" ? 0 : lineRate };
  });

  const gross = lines.reduce((s, l) => s + l.amount, 0);
  const lineDiscounts = lines.reduce((s, l) => s + l.discount, 0);
  const subtotal = gross - lineDiscounts;
  const dv = num(inv.discount, "The invoice discount");
  if (inv.discountType === "pct" && dv > 100) errors.push("The invoice discount can't be above 100%.");
  const invoiceDiscount = Math.min(subtotal, inv.discountType === "pct" ? Math.round((subtotal * dv) / 100) : minor(dv));

  // Spread the invoice discount across lines proportionally (largest remainder keeps the sum exact).
  let allocated = 0;
  lines.forEach((l, i) => {
    const share = subtotal > 0 ? (i === lines.length - 1 ? invoiceDiscount - allocated : Math.round((invoiceDiscount * l.net) / subtotal)) : 0;
    allocated += share;
    l.taxable = l.net - share;
  });
  const taxable = subtotal - invoiceDiscount;

  // Tax is computed once per rate on the summed taxable amount.
  const taxableByRate = new Map<number, number>();
  for (const l of lines) if (l.rate > 0) taxableByRate.set(l.rate, (taxableByRate.get(l.rate) ?? 0) + l.taxable);
  const byRate = new Map<number, number>([...taxableByRate].map(([rate, base]) => [rate, roundHalf((base * rate) / 100)]));
  const taxRows: TaxRow[] = [];
  const label = inv.taxLabel.trim() || "Tax";
  for (const [rate, amount] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    if (inv.taxMode === "gst-intra") {
      const c = Math.round(amount / 2);
      taxRows.push({ label: "CGST", rate: rate / 2, amount: c }, { label: "SGST", rate: rate / 2, amount: amount - c });
    } else if (inv.taxMode === "gst-inter") taxRows.push({ label: "IGST", rate, amount });
    else if (inv.taxMode === "single") taxRows.push({ label, rate, amount });
  }
  const tax = [...byRate.values()].reduce((s, v) => s + v, 0);
  const charges = minor(num(inv.charges, "Additional charges"));
  const grandTotal = taxable + tax + charges;
  const paid = minor(num(inv.paid, "Amount paid"));
  return { lines, gross, lineDiscounts, subtotal, invoiceDiscount, taxable, taxRows, tax, charges, grandTotal, paid, balance: grandTotal - paid, errors: [...new Set(errors)] };
}

const emptyParty = (): Party => ({ name: "", company: "", address: "", email: "", phone: "", website: "", taxId: "", extra: "" });
let n = 0;
export const newItem = (p: Partial<LineItem> = {}): LineItem => ({ id: `li-${Date.now().toString(36)}-${n++}`, description: "", quantity: "1", unitPrice: "", discount: "", discountType: "pct", taxRate: "", ...p });

export function blankInvoice(today: string, due: string): Invoice {
  return {
    template: "modern",
    currency: "INR",
    number: "INV-0001",
    date: today,
    dueDate: due,
    terms: "Due in 15 days",
    reference: "",
    from: emptyParty(),
    to: emptyParty(),
    logo: null,
    items: [newItem()],
    discount: "",
    discountType: "pct",
    taxMode: "gst-intra",
    taxLabel: "GST",
    taxRate: "18",
    charges: "",
    chargesLabel: "Shipping",
    paid: "",
    notes: "",
    payment: "",
    conditions: "",
  };
}

export function sampleInvoice(today: string, due: string): Invoice {
  return {
    ...blankInvoice(today, due),
    number: "ZS-2026-014",
    reference: "PO-7781",
    from: { ...emptyParty(), name: "Studio North", address: "21 MG Road\nBengaluru, Karnataka 560001\nIndia", email: "billing@studionorth.example", phone: "+91 80 4000 0000", website: "studionorth.example", taxId: "GSTIN 29ABCDE1234F1Z5" },
    to: { ...emptyParty(), name: "Asha Mehta", company: "Lumen Retail Pvt Ltd", address: "4th Floor, Palm Court\nMumbai, Maharashtra 400013", email: "accounts@lumen.example", taxId: "GSTIN 27PQRSX6789K1Z2" },
    items: [
      newItem({ description: "Website design — 8 pages", quantity: "1", unitPrice: "85000" }),
      newItem({ description: "Brand photography (half day)", quantity: "1", unitPrice: "22000", discount: "10" }),
      newItem({ description: "Hosting setup & 3 months support", quantity: "3", unitPrice: "4500" }),
    ],
    notes: "Thank you for your business.",
    payment: "Bank transfer to Studio North\nA/c 0000 1111 2222 · IFSC ABCD0001234",
    conditions: "Payment due within 15 days. Late payments may incur a fee.",
  };
}
