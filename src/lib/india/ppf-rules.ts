/**
 * Public Provident Fund rules — the single source of truth for the PPF
 * calculator. Update here when the Government notifies changes.
 *
 * Scheme: Public Provident Fund Scheme, 2019 — G.S.R. 915(E), 12 Dec 2019,
 * as amended (interest paragraph substituted w.e.f. 1 Apr 2020).
 */
export const PPF_RULES = {
  scheme: "Public Provident Fund Scheme, 2019 (G.S.R. 915(E), 12 December 2019, as amended)",
  /** Para 4(1): per financial year, across the holder's own and minor accounts (Para 4(2)). */
  minDepositPerFY: 500,
  maxDepositPerFY: 150_000,
  /** Para 5(1): deposits in multiples of ₹50. */
  depositMultiple: 50,
  /** Para 7: interest for a calendar month on the lowest balance between the close of the 5th day and the end of the month; credited at the end of each financial year. */
  interestCutoffDay: 5,
  /** Para 11(1): matures on completion of 15 financial years from the end of the year of opening. */
  maturityFinancialYears: 15,
  /** Para 12: extension in blocks of five years; with deposits only if opted (Form-4) within one year of maturity. */
  extensionBlockYears: 5,
  /** Para 12(4): withdrawals in an extended block with deposits limited to 60% of the balance at the start of the block. */
  extensionWithdrawalCap: 0.6,
  /** Interest is notified quarterly by the Ministry of Finance. */
  rate: {
    value: 7.1,
    period: "1 October – 31 December 2026 (Q3 FY 2026-27)",
    note: "Rates are revised quarterly. The calculator applies the rate you enter to every future year.",
  },
  sources: [
    { label: "PPF Scheme, 2019 — National Savings Institute", url: "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=169" },
    { label: "PPF Scheme, 2019 — Gazette text (India Post)", url: "https://www.indiapost.gov.in/documents/offerings/schemesandservices/posb/PublicProvidentFundScheme2019English.pdf" },
    { label: "Public Provident Fund Account — National Savings Institute", url: "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=55" },
    { label: "National Savings Institute — interest rates on small savings schemes", url: "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=132" },
    { label: "Department of Economic Affairs — small savings", url: "https://dea.gov.in/budget-division/475" },
  ],
  lastVerified: "2026-11-15",
} as const;
