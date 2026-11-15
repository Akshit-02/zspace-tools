/**
 * Retirement planning model (monthly cash flows).
 *
 * 1. Expenses: today's monthly expense grows with inflation to retirement,
 *      E_ret = E × (1 + inflation)^(years to retirement),
 *    and keeps rising with inflation once a year during retirement.
 * 2. Required corpus at retirement = one-time expense (inflated) + present
 *    value, at the post-retirement return, of every month's net need
 *    (expense − other income, never below 0), withdrawn at the start of each
 *    month until life expectancy.
 * 3. Projected corpus: today's savings and monthly contributions (start of
 *    month, rising by the step-up % each year) grow at the pre-retirement
 *    return.
 * Annual returns are effective rates: monthly = (1 + R)^(1/12) − 1.
 * 4. Gap = required − projected. The extra monthly investment that closes it
 *    is the gap ÷ the future value of a ₹1/month plan with the same step-up.
 */
import { parseNum } from "./discount";

export interface RetInput {
  age: number;
  retireAge: number;
  lifeExpectancy: number;
  monthlyExpense: number;
  corpus: number;
  monthlyContribution: number;
  stepUp: number;
  preReturn: number;
  postReturn: number;
  inflation: number;
  /** Monthly income in retirement (pension, rent…). */
  otherIncome: number;
  /** Other income rises with inflation (entered in today's money); otherwise a fixed amount. */
  otherIncomeIndexed: boolean;
  /** One-time expense at retirement, in today's money. */
  oneTime: number;
}

const monthly = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

export interface AccYear {
  age: number;
  contributed: number; // cumulative new contributions
  balance: number;
}

export interface DrawYear {
  age: number;
  withdrawn: number; // this year
  balance: number; // at year end
}

export interface RetResult {
  yearsToRetire: number;
  yearsInRetirement: number;
  expenseAtRetirement: number;
  annualExpenseAtRetirement: number;
  oneTimeAtRetirement: number;
  required: number;
  projected: number;
  existingGrowsTo: number;
  totalContributions: number;
  investmentGrowth: number;
  gap: number; // positive = shortfall
  /** Extra monthly investment (first year's amount, rising with the step-up) to close a shortfall; null if none needed or no time left. */
  extraMonthly: number | null;
  /** Age the projected corpus runs out, or null if it lasts to life expectancy. */
  runsOutAtAge: number | null;
  /** Balance left at life expectancy using the projected corpus (0 if it ran out). */
  leftAtEnd: number;
  accumulation: AccYear[];
  drawdown: DrawYear[];
}

/** Future value at retirement of contributions starting at `c` a month (start of month), stepped up yearly. */
function contributionFV(c: number, months: number, q: number, stepUp: number) {
  let bal = 0;
  for (let k = 0; k < months; k++) bal = (bal + c * Math.pow(1 + stepUp / 100, Math.floor(k / 12))) * (1 + q);
  return bal;
}

export function retirement(i: RetInput): RetResult {
  const Y = i.retireAge - i.age;
  const N = i.lifeExpectancy - i.retireAge;
  const q1 = monthly(i.preReturn);
  const q2 = monthly(i.postReturn);
  const infl = 1 + i.inflation / 100;
  const expenseAtRetirement = i.monthlyExpense * Math.pow(infl, Y);
  const oneTimeAtRetirement = i.oneTime * Math.pow(infl, Y);
  const need = (k: number) => {
    const j = Math.floor(k / 12);
    const exp = expenseAtRetirement * Math.pow(infl, j);
    const inc = i.otherIncomeIndexed ? i.otherIncome * Math.pow(infl, Y + j) : i.otherIncome;
    return Math.max(0, exp - inc);
  };
  let pv = 0;
  for (let k = 0; k < N * 12; k++) pv += need(k) / Math.pow(1 + q2, k);
  const required = oneTimeAtRetirement + pv;

  // Accumulation
  const accumulation: AccYear[] = [{ age: i.age, contributed: 0, balance: i.corpus }];
  let bal = i.corpus;
  let contributed = 0;
  for (let k = 0; k < Y * 12; k++) {
    const c = i.monthlyContribution * Math.pow(1 + i.stepUp / 100, Math.floor(k / 12));
    bal = (bal + c) * (1 + q1);
    contributed += c;
    if ((k + 1) % 12 === 0) accumulation.push({ age: i.age + (k + 1) / 12, contributed, balance: bal });
  }
  const projected = bal;
  const existingGrowsTo = i.corpus * Math.pow(1 + q1, Y * 12);
  const gap = required - projected;
  const unit = Y > 0 ? contributionFV(1, Y * 12, q1, i.stepUp) : 0;
  const extraMonthly = gap > 0 && unit > 0 ? gap / unit : null;

  // Drawdown of the projected corpus
  const drawdown: DrawYear[] = [{ age: i.retireAge, withdrawn: oneTimeAtRetirement, balance: Math.max(0, projected - oneTimeAtRetirement) }];
  let d = projected - oneTimeAtRetirement;
  let runsOutAtAge: number | null = d < 0 ? i.retireAge : null;
  d = Math.max(0, d);
  let yearW = 0;
  for (let k = 0; k < N * 12 && runsOutAtAge === null; k++) {
    const w = need(k);
    if (w > d + 1e-9) {
      yearW += d;
      d = 0;
      runsOutAtAge = i.retireAge + k / 12;
    } else {
      d -= w;
      yearW += w;
    }
    d *= 1 + q2;
    if ((k + 1) % 12 === 0 || runsOutAtAge !== null) {
      drawdown.push({ age: i.retireAge + Math.ceil((k + 1) / 12), withdrawn: yearW, balance: d });
      yearW = 0;
    }
  }
  return {
    yearsToRetire: Y,
    yearsInRetirement: N,
    expenseAtRetirement,
    annualExpenseAtRetirement: expenseAtRetirement * 12,
    oneTimeAtRetirement,
    required,
    projected,
    existingGrowsTo,
    totalContributions: contributed,
    investmentGrowth: projected - i.corpus - contributed,
    gap,
    extraMonthly,
    runsOutAtAge,
    leftAtEnd: runsOutAtAge === null ? d : 0,
    accumulation,
    drawdown,
  };
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; field?: string } | { status: "ok"; result: T; notes: string[] };

export interface RetForm {
  age: string;
  retireAge: string;
  lifeExpectancy: string;
  monthlyExpense: string;
  corpus: string;
  monthlyContribution: string;
  stepUp: string;
  preReturn: string;
  postReturn: string;
  inflation: string;
  otherIncome: string;
  otherIncomeIndexed: boolean;
  oneTime: string;
}

export function retirementFromForm(f: RetForm): Outcome<RetResult & { input: RetInput }> {
  const n = (s: string) => (s.trim() ? parseNum(s) : 0);
  const age = parseNum(f.age);
  const ra = parseNum(f.retireAge);
  const le = parseNum(f.lifeExpectancy);
  const E = parseNum(f.monthlyExpense);
  const pre = parseNum(f.preReturn);
  const post = parseNum(f.postReturn);
  const inf = parseNum(f.inflation);
  if ([age, ra, le, E, pre, post, inf].some((v) => v === null)) return { status: "empty" };
  const whole = (v: number | null) => v !== null && !Number.isNaN(v) && Number.isInteger(v);
  if (!whole(age) || age! < 18 || age! > 90) return { status: "error", field: "age", message: "Enter your current age in whole years (18–90)." };
  if (!whole(ra) || ra! < age! || ra! > 90) return { status: "error", field: "retireAge", message: "Retirement age must be a whole number from your current age up to 90." };
  if (!whole(le) || le! <= ra! || le! > 110) return { status: "error", field: "lifeExpectancy", message: "Life expectancy must be after your retirement age (up to 110)." };
  if (Number.isNaN(E!) || E! <= 0) return { status: "error", field: "monthlyExpense", message: "Enter your current monthly expenses." };
  const vals = { corpus: n(f.corpus), monthlyContribution: n(f.monthlyContribution), stepUp: n(f.stepUp), otherIncome: n(f.otherIncome), oneTime: n(f.oneTime) };
  for (const [k, v] of Object.entries(vals)) if (v === null || Number.isNaN(v) || v < 0) return { status: "error", field: k, message: "Amounts can't be negative." };
  if (vals.stepUp! > 25) return { status: "error", field: "stepUp", message: "Annual contribution increase can be at most 25%." };
  if (Number.isNaN(pre!) || pre! < -10 || pre! > 30) return { status: "error", field: "preReturn", message: "Enter a pre-retirement return between −10% and 30%." };
  if (Number.isNaN(post!) || post! < -10 || post! > 30) return { status: "error", field: "postReturn", message: "Enter a post-retirement return between −10% and 30%." };
  if (Number.isNaN(inf!) || inf! < 0 || inf! > 20) return { status: "error", field: "inflation", message: "Enter an inflation rate between 0% and 20%." };
  const input: RetInput = { age: age!, retireAge: ra!, lifeExpectancy: le!, monthlyExpense: E!, corpus: vals.corpus!, monthlyContribution: vals.monthlyContribution!, stepUp: vals.stepUp!, preReturn: pre!, postReturn: post!, inflation: inf!, otherIncome: vals.otherIncome!, otherIncomeIndexed: f.otherIncomeIndexed, oneTime: vals.oneTime! };
  const result = retirement(input);
  const notes: string[] = [];
  if (post! < inf!) notes.push("Your post-retirement return is below inflation, so the corpus loses buying power each year and you need more saved up.");
  if (result.yearsToRetire === 0) notes.push("You're retiring now, so there's no time to invest more — any shortfall would need to be covered by a lump sum, lower expenses or more income.");
  if (!f.otherIncomeIndexed && vals.otherIncome! > 0) notes.push("Other income is treated as a fixed amount that doesn't rise with inflation, so it covers less of your expenses each year.");
  if (result.extraMonthly !== null && vals.stepUp! > 0) notes.push(`The extra monthly investment also rises ${vals.stepUp}% each year, like your current contributions.`);
  return { status: "ok", result: { ...result, input }, notes };
}

export const RET_DEFAULTS: RetForm = {
  age: "30",
  retireAge: "60",
  lifeExpectancy: "85",
  monthlyExpense: "50000",
  corpus: "500000",
  monthlyContribution: "15000",
  stepUp: "5",
  preReturn: "10",
  postReturn: "7",
  inflation: "6",
  otherIncome: "",
  otherIncomeIndexed: true,
  oneTime: "",
};
