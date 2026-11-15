/**
 * Rent vs buy and down-payment engines.
 *
 * Rent vs buy — a monthly cash-flow model reported yearly:
 *  - Buyer pays, at the start: down payment + stamp duty/registration + other purchase costs.
 *    Each month: EMI (until the loan ends) + maintenance + property tax ÷ 12.
 *  - Renter pays, at the start: the security deposit. Each month: rent + any tenant-paid
 *    maintenance. Rent rises once a year; maintenance and property tax rise with inflation.
 *  - The renter invests the difference in upfront cash (buyer's upfront − deposit).
 *  - Each month, whoever has the lower outflow invests the difference in their own
 *    portfolio, so both sides spend the same total cash — nothing is counted twice.
 *  - Portfolios earn the investment return (compounded monthly from the annual rate).
 *  - Net worth: buyer = property value − loan balance − selling costs + buyer's portfolio;
 *    renter = portfolio + deposit returned.
 */
import { emiExact } from "../emi";

export interface RentBuyInput {
  price: number;
  appreciation: number; // % a year
  downPayment: number;
  rate: number;
  tenureYears: number;
  stampRegistration: number;
  otherPurchaseCosts: number;
  maintenanceMonthly: number; // owner-paid
  propertyTaxYearly: number;
  sellingCostPct: number;
  rent: number; // monthly now
  rentIncrease: number; // % a year
  deposit: number;
  tenantMaintenance: number; // monthly, paid by the renter
  investReturn: number; // % a year
  inflation: number; // % a year (costs growth + today's-money view)
  years: number;
}

export interface RentBuyYear {
  year: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  buyPortfolio: number;
  buyNetWorth: number;
  rentPortfolio: number;
  rentNetWorth: number;
  rentPaidYear: number;
  interestYear: number;
  principalYear: number;
  ownerCostsYear: number;
}

export function rentVsBuy(i: RentBuyInput) {
  const loan = Math.max(0, i.price - i.downPayment);
  const n = Math.round(i.tenureYears * 12);
  const emi = loan > 0 && n > 0 ? emiExact({ principal: loan, annualRate: i.rate, months: n }) : 0;
  const r = i.rate / 1200;
  const g = Math.pow(1 + i.investReturn / 100, 1 / 12) - 1;
  const upfrontBuy = i.downPayment + i.stampRegistration + i.otherPurchaseCosts;
  let bal = loan;
  let buyPf = 0;
  let rentPf = upfrontBuy - i.deposit; // can be negative if the deposit exceeds the buyer's upfront cash
  let rent = i.rent;
  let maint = i.maintenanceMonthly;
  let tax = i.propertyTaxYearly;
  let tenantMaint = i.tenantMaintenance;
  const years: RentBuyYear[] = [];
  let tRent = 0, tInterest = 0, tOwner = 0, breakEven: number | null = null;
  let y = { rent: 0, interest: 0, principal: 0, owner: 0 };
  for (let m = 1; m <= i.years * 12; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      rent *= 1 + i.rentIncrease / 100;
      maint *= 1 + i.inflation / 100;
      tax *= 1 + i.inflation / 100;
      tenantMaint *= 1 + i.inflation / 100;
    }
    let pay = 0;
    if (bal > 0.005) {
      const interest = bal * r;
      pay = Math.min(emi, bal + interest);
      bal = bal + interest - pay;
      y.interest += interest;
      y.principal += pay - interest;
      tInterest += interest;
    }
    const owner = maint + tax / 12;
    const buyOut = pay + owner;
    const rentOut = rent + tenantMaint;
    buyPf *= 1 + g;
    rentPf *= 1 + g;
    if (buyOut > rentOut) rentPf += buyOut - rentOut;
    else buyPf += rentOut - buyOut;
    y.rent += rent;
    y.owner += owner;
    tRent += rent;
    tOwner += owner;
    if (m % 12 === 0) {
      const yr = m / 12;
      const value = i.price * Math.pow(1 + i.appreciation / 100, yr);
      const loanBal = bal > 0.005 ? bal : 0;
      const buyNW = value * (1 - i.sellingCostPct / 100) - loanBal + buyPf;
      const rentNW = rentPf + i.deposit;
      if (breakEven === null && buyNW >= rentNW) breakEven = yr;
      years.push({ year: yr, propertyValue: value, loanBalance: loanBal, equity: value - loanBal, buyPortfolio: buyPf, buyNetWorth: buyNW, rentPortfolio: rentPf, rentNetWorth: rentNW, rentPaidYear: y.rent, interestYear: y.interest, principalYear: y.principal, ownerCostsYear: y.owner });
      y = { rent: 0, interest: 0, principal: 0, owner: 0 };
    }
  }
  const last = years[years.length - 1];
  const deflator = Math.pow(1 + i.inflation / 100, i.years);
  // Buying "wins from year X" only if it stays ahead after X.
  let favourableFrom: number | null = null;
  for (let k = years.length - 1; k >= 0 && years[k].buyNetWorth >= years[k].rentNetWorth; k--) favourableFrom = years[k].year;
  return {
    loan,
    emi,
    upfrontBuy,
    transactionCosts: i.stampRegistration + i.otherPurchaseCosts,
    years,
    totalRent: tRent,
    totalInterest: tInterest,
    totalOwnerCosts: tOwner,
    buyNetWorth: last?.buyNetWorth ?? 0,
    rentNetWorth: last?.rentNetWorth ?? 0,
    difference: (last?.buyNetWorth ?? 0) - (last?.rentNetWorth ?? 0),
    propertyValue: last?.propertyValue ?? i.price,
    loanBalance: last?.loanBalance ?? loan,
    firstAhead: breakEven,
    favourableFrom,
    realBuy: (last?.buyNetWorth ?? 0) / deflator,
    realRent: (last?.rentNetWorth ?? 0) / deflator,
  };
}

/* ================================================================== */
/* Down payment                                                        */
/* ================================================================== */

export interface DownPaymentInput {
  price: number;
  /** Down payment entered as % of price or as an amount. */
  mode: "pct" | "amount";
  value: number;
  /** Maximum loan as % of price the lender allows (null = no cap entered). */
  maxLtvPct: number | null;
  charges: { label: string; amount: number }[];
  savings: number;
  reserve: number;
  rate: number;
  months: number;
}

export function downPayment(i: DownPaymentInput) {
  const chosen = i.mode === "pct" ? (i.price * i.value) / 100 : i.value;
  const minByLtv = i.maxLtvPct !== null ? Math.round(i.price * (100 - i.maxLtvPct)) / 100 : 0;
  const dp = Math.min(i.price, Math.max(chosen, minByLtv));
  const raisedByLtv = minByLtv > chosen + 0.5;
  const loan = i.price - dp;
  const extra = i.charges.reduce((a, c) => a + c.amount, 0);
  const upfront = dp + extra;
  const available = i.savings - i.reserve;
  const emi = loan > 0 && i.months > 0 && i.rate >= 0 ? emiExact({ principal: loan, annualRate: i.rate, months: i.months }) : 0;
  return {
    downPayment: dp,
    downPct: i.price > 0 ? (dp / i.price) * 100 : 0,
    raisedByLtv,
    minByLtv,
    loan,
    ltvPct: i.price > 0 ? (loan / i.price) * 100 : 0,
    extra,
    upfront,
    available,
    gap: available - upfront, // negative = shortfall
    leftAfter: i.savings - upfront,
    emi,
  };
}
