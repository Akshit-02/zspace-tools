/** Indian-grouped rupee formatting for the loan tools (whole rupees). */
const f0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const inr = (v: number) => f0.format(Number.isFinite(v) ? (Object.is(Math.round(v), -0) ? 0 : Math.round(v)) : 0);
/** Short lakh / crore form: ₹69.14 L, ₹1.2 Cr. */
export function lakhCrore(v: number) {
  const a = Math.abs(v);
  const s = v < 0 ? "−" : "";
  if (a >= 1e7) return `${s}₹${+(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${s}₹${+(a / 1e5).toFixed(2)} L`;
  return `${s}${inr(a)}`;
}
