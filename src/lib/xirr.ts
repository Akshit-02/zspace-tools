/**
 * XIRR — the annual rate r that makes the dated cash flows' net present value zero:
 *
 *   Σ CFᵢ ÷ (1 + r)^((dᵢ − d₀) ÷ 365) = 0
 *
 * Excel-compatible: actual days between dates ÷ 365, d₀ = earliest date.
 * Investments are negative cash flows, withdrawals/current value positive.
 *
 * Solver: NPV is evaluated on a grid of rates from −99.99% to +100,000% to find
 * every sign change (each brackets a root); each bracket is refined by
 * bisection to 1e-12, so the result never depends on a starting guess and the
 * solver can't diverge. If no sign change exists there's no XIRR; if several
 * do, all are reported rather than one picked arbitrarily.
 */
import { dayNumber, parseISODate } from "./age";

export interface Flow {
  date: string; // YYYY-MM-DD
  amount: number; // signed: − invested, + received
}

export interface XirrSolution {
  rate: number; // decimal (0.12 = 12%)
  roots: number[];
}

const npv = (r: number, flows: { t: number; cf: number }[]) => flows.reduce((a, f) => a + f.cf / Math.pow(1 + r, f.t), 0);

/** Sign changes of the date-ordered, same-day-netted cash flow series (Descartes' bound on the number of roots). */
export function signChanges(cfs: number[]) {
  let n = 0;
  let prev = 0;
  for (const c of cfs) {
    if (c === 0) continue;
    if (prev && Math.sign(c) !== Math.sign(prev)) n++;
    prev = c;
  }
  return n;
}

export function solveXirr(flows: { t: number; cf: number }[]): XirrSolution | null {
  // Grid in log(1 + r) so it is dense near 0 and still reaches extreme rates.
  const xs: number[] = [];
  for (let x = Math.log(1e-4); x <= Math.log(1001); x += 0.01) xs.push(Math.exp(x) - 1);
  const roots: number[] = [];
  let prevR = xs[0];
  let prevV = npv(prevR, flows);
  for (let i = 1; i < xs.length; i++) {
    const r = xs[i];
    const v = npv(r, flows);
    if (!Number.isFinite(v) || !Number.isFinite(prevV)) {
      prevR = r;
      prevV = v;
      continue;
    }
    if (v === 0) roots.push(r);
    else if (prevV !== 0 && Math.sign(v) !== Math.sign(prevV)) {
      let lo = prevR;
      let hi = r;
      let flo = prevV;
      for (let it = 0; it < 200 && hi - lo > 1e-13 * Math.max(1, Math.abs(lo)); it++) {
        const mid = (lo + hi) / 2;
        const fm = npv(mid, flows);
        if (fm === 0) {
          lo = hi = mid;
          break;
        }
        if (Math.sign(fm) === Math.sign(flo)) {
          lo = mid;
          flo = fm;
        } else hi = mid;
      }
      roots.push((lo + hi) / 2);
    }
    prevR = r;
    prevV = v;
  }
  if (!roots.length) return null;
  // Prefer the root closest to 0 for display, but every root is returned.
  const rate = roots.reduce((b, x) => (Math.abs(x) < Math.abs(b) ? x : b), roots[0]);
  return { rate, roots };
}

export interface Txn {
  id: string;
  date: string;
  type: "invest" | "withdraw";
  amount: string;
  note: string;
}

export interface XirrResult {
  xirr: number; // %
  roots: number[]; // %
  invested: number;
  withdrawn: number;
  net: number;
  first: string;
  last: string;
  days: number;
  years: number;
  count: number;
  /** Absolute return (net ÷ invested), not annualised. */
  absolutePct: number;
  rows: { date: string; type: Txn["type"]; amount: number; note: string; t: number }[];
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string; rows?: number[] } | { status: "ok"; result: T; notes: string[] };

export const MAX_TXNS = 2000;

export function xirrFromTxns(txns: Txn[]): Outcome<XirrResult> {
  const filled = txns.map((t, i) => ({ t, i })).filter(({ t }) => t.date.trim() || t.amount.trim());
  if (!filled.length) return { status: "empty" };
  if (filled.length > MAX_TXNS) return { status: "error", message: `Up to ${MAX_TXNS.toLocaleString("en-IN")} transactions are supported.` };
  const bad: number[] = [];
  const parsed: { date: string; dn: number; type: Txn["type"]; amount: number; note: string }[] = [];
  let firstError = "";
  for (const { t, i } of filled) {
    const d = parseISODate(t.date.trim());
    const a = Number(t.amount.replace(/[,\s₹$£€]/g, ""));
    if (!d) {
      bad.push(i);
      firstError ||= `Row ${i + 1}: enter a valid date.`;
      continue;
    }
    if (!t.amount.trim() || !Number.isFinite(a) || a <= 0) {
      bad.push(i);
      firstError ||= `Row ${i + 1}: enter an amount greater than 0 (choose Invested or Withdrawn for the direction).`;
      continue;
    }
    parsed.push({ date: t.date.trim(), dn: dayNumber(d), type: t.type, amount: a, note: t.note.trim() });
  }
  if (bad.length) return { status: "error", message: firstError, rows: bad };
  if (!parsed.some((p) => p.type === "invest")) return { status: "error", message: "Add at least one investment (money going in). XIRR needs cash flowing both ways." };
  if (!parsed.some((p) => p.type === "withdraw")) return { status: "error", message: "Add at least one withdrawal or the current value (money coming back). XIRR needs cash flowing both ways." };
  parsed.sort((a, b) => a.dn - b.dn);
  const d0 = parsed[0].dn;
  const dN = parsed[parsed.length - 1].dn;
  if (dN === d0) return { status: "error", message: "All transactions are on the same date, so there's no time period to annualise over." };
  const flows = parsed.map((p) => ({ t: (p.dn - d0) / 365, cf: p.type === "invest" ? -p.amount : p.amount }));

  // Net same-day flows to count genuine direction changes.
  const byDay = new Map<number, number>();
  parsed.forEach((p, k) => byDay.set(p.dn, (byDay.get(p.dn) ?? 0) + flows[k].cf));
  const changes = signChanges([...byDay.values()]);

  const sol = solveXirr(flows);
  const invested = parsed.filter((p) => p.type === "invest").reduce((a, p) => a + p.amount, 0);
  const withdrawn = parsed.filter((p) => p.type === "withdraw").reduce((a, p) => a + p.amount, 0);
  if (!sol)
    return {
      status: "error",
      message: "No annual rate makes these cash flows balance, so XIRR can't be calculated. Check that the withdrawal or current value is entered and the directions are right.",
    };
  if (sol.roots.length > 1)
    return {
      status: "error",
      message: `These cash flows have more than one valid XIRR (${sol.roots.map((r) => `${(r * 100).toFixed(2)}%`).join(" and ")}), because money changes direction several times. No single rate describes them reliably — consider splitting the period or using NPV at a chosen rate.`,
    };
  const notes: string[] = [];
  if (changes > 1) notes.push("The money changes direction more than once (for example invest, withdraw, invest again). Only one rate solves these cash flows here, but XIRR can be harder to interpret for patterns like this.");
  if ((dN - d0) / 365 < 1) notes.push("The period is under a year, so XIRR annualises a short-term result — a small gain over a few weeks can look like a very high yearly rate.");
  if (Math.abs(sol.rate) > 5) notes.push("This rate is extreme. Check the dates and amounts — a typo in a year or a missing zero is a common cause.");
  return {
    status: "ok",
    notes,
    result: {
      xirr: sol.rate * 100,
      roots: sol.roots.map((r) => r * 100),
      invested,
      withdrawn,
      net: withdrawn - invested,
      first: parsed[0].date,
      last: parsed[parsed.length - 1].date,
      days: dN - d0,
      years: (dN - d0) / 365,
      count: parsed.length,
      absolutePct: ((withdrawn - invested) / invested) * 100,
      rows: parsed.map((p, k) => ({ date: p.date, type: p.type, amount: p.amount, note: p.note, t: flows[k].t })),
    },
  };
}

/**
 * Value of all the cash flows at the last date if they had earned `bench`% a
 * year instead: positive means the actual investment did better than the benchmark.
 */
export function benchmarkGap(r: XirrResult, benchPct: number) {
  const last = r.rows[r.rows.length - 1].t;
  return r.rows.reduce((a, row) => a + (row.type === "invest" ? -row.amount : row.amount) * Math.pow(1 + benchPct / 100, last - row.t), 0);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Accepts 2024-03-15, 15/03/2024, 15-03-2024, 15.03.2024, 15-Mar-2024, 15 Mar 2024. Day-first for numeric dates. */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) [d, mo, y] = [+m[1], +m[2], +m[3]];
  else if ((m = /^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s-,]+(\d{4})$/.exec(s))) {
    const k = MONTHS.indexOf(m[2].toLowerCase());
    if (k < 0) return null;
    [d, mo, y] = [+m[1], k + 1, +m[3]];
  } else return null;
  const iso = `${y}-${pad(mo)}-${pad(d)}`;
  return parseISODate(iso) ? iso : null;
}

/**
 * Parses rows pasted from a spreadsheet: date, amount[, description] separated
 * by tabs, commas or semicolons. Negative amounts are investments (the Excel
 * XIRR convention); positive amounts are withdrawals or the current value.
 */
export function parsePasted(text: string): { txns: Omit<Txn, "id">[]; skipped: number[] } {
  const txns: Omit<Txn, "id">[] = [];
  const skipped: number[] = [];
  text.split(/\r\n|\r|\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const cells = line.includes("\t") ? line.split("\t") : line.split(/[;,](?=(?:[^"]*"[^"]*")*[^"]*$)/);
    // Find the date cell and the amount cell (amounts may contain thousands commas when tab-separated).
    const date = normaliseDate(cells[0] ?? "");
    const amtRaw = (cells[1] ?? "").replace(/["₹$£€\s]/g, "").replace(/,/g, "");
    const neg = /^\(.*\)$/.test(amtRaw) || amtRaw.startsWith("-") || amtRaw.startsWith("−");
    const amt = Number(amtRaw.replace(/[()\-−]/g, ""));
    if (!date || !Number.isFinite(amt) || amt === 0) return skipped.push(i + 1);
    txns.push({ date, type: neg ? "invest" : "withdraw", amount: String(amt), note: cells.slice(2).join(" ").replace(/"/g, "").trim() });
  });
  return { txns, skipped };
}

export const XIRR_SAMPLE: Omit<Txn, "id">[] = [
  { date: "2021-04-05", type: "invest", amount: "50000", note: "Lumpsum" },
  { date: "2021-10-05", type: "invest", amount: "10000", note: "Top-up" },
  { date: "2022-04-05", type: "invest", amount: "10000", note: "Top-up" },
  { date: "2022-12-20", type: "withdraw", amount: "15000", note: "Partial redemption" },
  { date: "2023-06-05", type: "invest", amount: "20000", note: "Top-up" },
  { date: "2024-04-05", type: "invest", amount: "10000", note: "Top-up" },
  { date: "2026-11-15", type: "withdraw", amount: "142500", note: "Current value" },
];
