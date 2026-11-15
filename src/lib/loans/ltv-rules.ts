/**
 * RBI loan-to-value (LTV) caps for individual housing loans by loan size.
 * Single source of truth for the home-loan eligibility and down-payment tools.
 * Update `lastVerified` and `status` whenever this is re-checked.
 */
import type { Source, Status } from "../india/rules";

export const LTV_RULES = {
  bands: [
    { upTo: 3000000 as number | null, maxPct: 90 },
    { upTo: 7500000 as number | null, maxPct: 80 },
    { upTo: null as number | null, maxPct: 75 },
  ],
  /** Stamp duty, registration and documentation charges are excluded from the property cost for LTV, except where the dwelling costs up to this amount. */
  includeChargesUpTo: 1000000,
  status: "verified" as Status,
  lastVerified: "2026-11-15",
  note: "RBI caps a bank's housing loan at a share of the property's value depending on the loan size, and excludes stamp duty, registration and documentation charges from that value (except for homes costing up to ₹10 lakh). Lenders may lend less. Housing finance companies follow separate RBI directions, not checked here.",
  sources: [
    { label: "RBI (Commercial Banks – Credit Facilities) Directions, 2025 — paras 111 and 113", url: "https://rbi.org.in/SCRIPTs/BS_ViewMasDirections.aspx?id=13156" },
    { label: "RBI Master Circular – Housing Finance (1 April 2025)", url: "https://rbi.org.in/scripts/BS_ViewMasCirculardetails.aspx?id=12824" },
  ] as Source[],
};
