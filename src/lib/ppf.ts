/**
 * PPF projection following the PPF Scheme, 2019 (rules in ./india/ppf-rules).
 *
 * Month by month through Indian financial years (April–March):
 *  - interest for a month = rate/12 × the lowest balance between the close
 *    of the 5th day and the end of the month. A deposit made on or before the
 *    5th counts for that month; one made after the 5th doesn't.
 *  - the year's monthly interest is added up and credited on 31 March.
 *  - the account matures on completion of 15 financial years from the end of
 *    the year of opening, i.e. on 1 April of (opening FY start year + 16).
 * Calendar dates don't otherwise matter (interest is per month, not per day),
 * so leap years don't change the result. Full precision is kept; banks may
 * round the yearly interest to the rupee.
 */
import { parseNum } from "./discount";
import { PPF_RULES } from "./india/ppf-rules";

/** FY 2026-27 → "2026-27". */
export const fyLabel = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
/** The financial year (start year) a calendar date falls in. */
export const fyOf = (year: number, month: number) => (month >= 4 ? year : year - 1);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthName = (m: number) => MONTHS[m - 1];

export interface PpfSchedule {
  /** Deposit amount each time. */
  amount: number;
  frequency: "monthly" | "yearly";
  /** Calendar month (1–12) of the yearly deposit. */
  depositMonth: number;
  /** Deposits made on or before the 5th of the month. */
  byFifth: boolean;
}

export interface PpfYear {
  fy: number;
  label: string;
  opening: number;
  deposits: number;
  interest: number;
  closing: number;
  phase: "term" | "extension";
}

/** Runs the account from `startFY` to the end of `endFY`, accepting deposits up to `depositUntilFY`. */
export function simulate(opts: { startFY: number; endFY: number; depositUntilFY: number; balance: number; rate: number; schedule: PpfSchedule; firstMonth?: { fy: number; month: number }; maturityFY: number }): PpfYear[] {
  const { schedule: s } = opts;
  const r = opts.rate / 100 / 12;
  let bal = opts.balance;
  const rows: PpfYear[] = [];
  for (let fy = opts.startFY; fy <= opts.endFY; fy++) {
    const opening = bal;
    let interest = 0;
    let deposits = 0;
    let yearlyDone = false;
    for (let mi = 0; mi < 12; mi++) {
      // mi 0 = April … 11 = March; calendar month m maps to (m + 8) % 12.
      const notOpenYet = opts.firstMonth && fy === opts.firstMonth.fy && mi < (opts.firstMonth.month + 8) % 12;
      if (notOpenYet) continue;
      let dep = 0;
      if (fy <= opts.depositUntilFY) {
        if (s.frequency === "monthly") dep = s.amount;
        else if (!yearlyDone) {
          const firstOpenMi = opts.firstMonth && fy === opts.firstMonth.fy ? (opts.firstMonth.month + 8) % 12 : 0;
          const targetMi = Math.max((s.depositMonth + 8) % 12, firstOpenMi);
          if (mi === targetMi) {
            dep = s.amount;
            yearlyDone = true;
          }
        }
      }
      const lowest = s.byFifth ? bal + dep : bal;
      interest += lowest * r;
      bal += dep;
      deposits += dep;
    }
    bal += interest;
    rows.push({ fy, label: fyLabel(fy), opening, deposits, interest, closing: bal, phase: fy > opts.maturityFY ? "extension" : "term" });
  }
  return rows;
}

export interface PpfForm {
  account: "new" | "existing";
  /** New: calendar month and year the account is opened. */
  openMonth: string;
  openYear: string;
  /** Existing: FY start year the account was opened in, and the balance on 1 April of the current FY. */
  openedFY: string;
  balance: string;
  amount: string;
  frequency: "monthly" | "yearly";
  depositMonth: number;
  byFifth: boolean;
  rate: string;
  blocks: number;
}

export interface PpfResult {
  maturityFY: number;
  maturityDate: string; // "1 April 2042"
  alreadyMatured: boolean;
  term: PpfYear[];
  atMaturity: { deposits: number; interest: number; balance: number; openingBalance: number } | null;
  withDeposits: { years: PpfYear[]; balance: number; deposits: number; interest: number };
  withoutDeposits: { years: PpfYear[]; balance: number; interest: number };
  annualDeposit: number;
  startFY: number;
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

/** `today` is injected so tests are deterministic. */
export function ppfFromForm(f: PpfForm, today: { year: number; month: number }): Outcome<PpfResult> {
  const A = parseNum(f.amount);
  const R = parseNum(f.rate);
  if (A === null || R === null) return { status: "empty" };
  const P = PPF_RULES;
  if (Number.isNaN(A) || A <= 0) return { status: "error", field: "amount", message: "Enter the amount of each deposit." };
  if (A % P.depositMultiple !== 0) return { status: "error", field: "amount", message: `PPF deposits must be in multiples of ₹${P.depositMultiple}.` };
  const annual = f.frequency === "monthly" ? A * 12 : A;
  if (annual > P.maxDepositPerFY) return { status: "error", field: "amount", message: `That's ₹${annual.toLocaleString("en-IN")} a year. PPF allows at most ₹${P.maxDepositPerFY.toLocaleString("en-IN")} per financial year (including any minor's account you hold), and excess deposits earn no interest.` };
  if (annual < P.minDepositPerFY) return { status: "error", field: "amount", message: `PPF needs at least ₹${P.minDepositPerFY} in each financial year to keep the account active.` };
  if (Number.isNaN(R) || R < 0 || R > 15) return { status: "error", field: "rate", message: "Enter an interest rate from 0% to 15%." };
  const currentFY = fyOf(today.year, today.month);
  const schedule: PpfSchedule = { amount: A, frequency: f.frequency, depositMonth: f.depositMonth, byFifth: f.byFifth };
  const notes: string[] = [];

  let openingFY: number;
  let startFY: number;
  let balance = 0;
  let firstMonth: { fy: number; month: number } | undefined;
  if (f.account === "new") {
    const m = Number(f.openMonth);
    const y = Number(f.openYear);
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 1990 || y > today.year + 5) return { status: "error", field: "openYear", message: "Choose the month and year you open (or opened) the account." };
    openingFY = fyOf(y, m);
    startFY = openingFY;
    firstMonth = { fy: openingFY, month: m };
    if (f.frequency === "yearly" && ((f.depositMonth + 8) % 12) < ((m + 8) % 12)) notes.push(`The account opens in ${monthName(m)}, after your yearly deposit month, so the first year's deposit is assumed in ${monthName(m)}.`);
  } else {
    const o = Number(f.openedFY);
    const b = parseNum(f.balance);
    if (!Number.isInteger(o) || o < 1968 || o > currentFY) return { status: "error", field: "openedFY", message: "Choose the financial year the account was opened." };
    if (b === null || Number.isNaN(b) || b < 0) return { status: "error", field: "balance", message: `Enter the balance on 1 April ${currentFY} (0 if none).` };
    openingFY = o;
    startFY = currentFY;
    balance = b;
  }
  const maturityFY = openingFY + P.maturityFinancialYears;
  const alreadyMatured = startFY > maturityFY;
  const blocks = Math.max(1, Math.min(4, f.blocks));
  const extEnd = Math.max(maturityFY, startFY - 1) + P.extensionBlockYears * blocks;

  const term = alreadyMatured ? [] : simulate({ startFY, endFY: maturityFY, depositUntilFY: maturityFY, balance, rate: R, schedule, firstMonth, maturityFY });
  const extStart = alreadyMatured ? startFY : maturityFY + 1;
  const extBalance = alreadyMatured ? balance : term[term.length - 1].closing;
  const withDep = simulate({ startFY: extStart, endFY: extEnd, depositUntilFY: extEnd, balance: extBalance, rate: R, schedule, maturityFY });
  const withoutDep = simulate({ startFY: extStart, endFY: extEnd, depositUntilFY: -1, balance: extBalance, rate: R, schedule, maturityFY });
  const sum = (rows: PpfYear[], k: "deposits" | "interest") => rows.reduce((a, x) => a + x[k], 0);
  if (alreadyMatured) notes.push(`This account matured on 1 April ${maturityFY + 1}. Only extension projections are shown, starting from FY ${fyLabel(startFY)}; your current extension block may already be part-way through.`);
  if (f.account === "existing" && !alreadyMatured) notes.push(`Projection starts on 1 April ${currentFY} with the balance you entered; deposits already made this year aren't known, so the full year's deposits are assumed.`);
  if (!f.byFifth) notes.push("Deposits after the 5th don't earn interest for the month they're made in — depositing by the 5th earns more.");

  return {
    status: "ok",
    notes,
    result: {
      maturityFY,
      maturityDate: `1 April ${maturityFY + 1}`,
      alreadyMatured,
      term,
      atMaturity: alreadyMatured ? null : { deposits: sum(term, "deposits"), interest: sum(term, "interest"), balance: term[term.length - 1].closing, openingBalance: balance },
      withDeposits: { years: withDep, balance: withDep[withDep.length - 1].closing, deposits: sum(withDep, "deposits"), interest: sum(withDep, "interest") },
      withoutDeposits: { years: withoutDep, balance: withoutDep[withoutDep.length - 1].closing, interest: sum(withoutDep, "interest") },
      annualDeposit: annual,
      startFY,
    },
  };
}

export function ppfCsv(rows: PpfYear[]) {
  const out = ["# PPF estimate. Interest on the lowest monthly balance after the 5th, credited each 31 March. Rate assumed constant.", "Financial year,Phase,Opening balance,Deposits,Interest credited,Closing balance"];
  for (const r of rows) out.push([r.label, r.phase, r.opening.toFixed(2), r.deposits.toFixed(2), r.interest.toFixed(2), r.closing.toFixed(2)].join(","));
  return out.join("\n") + "\n";
}
