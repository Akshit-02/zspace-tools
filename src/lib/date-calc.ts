/**
 * Calendar date arithmetic (UTC day numbers — no time zones, no DST).
 * Builds on the age.ts helpers so both tools share one definition of
 * "adding a month": the day clamps to the target month's last day.
 */
import { addMonths, calculateAge, compare, dayNumber, parseISODate, type YMD } from "./age";

export { parseISODate, type YMD };

/** 0 = Sunday … 6 = Saturday. */
export const dayOfWeek = (d: YMD) => (((dayNumber(d) + 4) % 7) + 7) % 7;
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fromDayNumber(n: number): YMD {
  const t = new Date(n * 86_400_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** Counts days in [start, start+count) whose weekday is in `set`. O(1) per call. */
export function countWeekdays(startDay: number, count: number, set: Set<number>) {
  const full = Math.floor(count / 7);
  let n = full * set.size;
  const startDow = (((startDay + 4) % 7) + 7) % 7;
  for (let i = 0; i < count % 7; i++) if (set.has((startDow + i) % 7)) n++;
  return n;
}

export interface BetweenResult {
  reversed: boolean;
  start: YMD;
  end: YMD;
  elapsedDays: number;
  countedDays: number;
  inclusive: boolean;
  weeks: number;
  weekRemainder: number;
  months: number;
  monthRemainderDays: number;
  years: number;
  ymd: { y: number; m: number; d: number };
  weekdays: number;
  weekendDays: number;
}

const WEEKEND = new Set([0, 6]);

export function daysBetween(a: YMD, b: YMD, inclusive: boolean): BetweenResult {
  const reversed = compare(a, b) > 0;
  const [start, end] = reversed ? [b, a] : [a, b];
  const elapsed = dayNumber(end) - dayNumber(start);
  const counted = elapsed + (inclusive ? 1 : 0);
  const age = calculateAge(start, end, { allowFutureStart: true });
  const r = age.ok ? age.result : null;
  const weekendDays = countWeekdays(dayNumber(start), counted, WEEKEND);
  return {
    reversed,
    start,
    end,
    elapsedDays: elapsed,
    countedDays: counted,
    inclusive,
    weeks: Math.floor(counted / 7),
    weekRemainder: counted % 7,
    months: r?.totalMonths ?? 0,
    monthRemainderDays: r?.days ?? 0,
    years: r?.years ?? 0,
    ymd: { y: r?.years ?? 0, m: r?.months ?? 0, d: r?.days ?? 0 },
    weekdays: counted - weekendDays,
    weekendDays,
  };
}

export interface Offset {
  years: number;
  months: number;
  weeks: number;
  days: number;
}

/**
 * Adds (sign = 1) or subtracts (sign = −1) an offset. Years and months are
 * applied first as calendar months (31 Jan + 1 month = 28/29 Feb), then weeks
 * and days as exact days.
 */
export function shiftDate(date: YMD, o: Offset, sign: 1 | -1): { ok: true; date: YMD } | { ok: false; error: string } {
  for (const [k, v] of Object.entries(o)) {
    if (!Number.isInteger(v) || v < 0) return { ok: false, error: `Enter whole, non-negative numbers (check ${k}).` };
  }
  const months = sign * (o.years * 12 + o.months);
  const afterMonths = addMonths(date, months);
  const n = dayNumber(afterMonths) + sign * (o.weeks * 7 + o.days);
  const out = fromDayNumber(n);
  if (out.y < 1 || out.y > 9999) return { ok: false, error: "The result falls outside the years 1–9999." };
  return { ok: true, date: out };
}

export interface BusinessResult {
  reversed: boolean;
  totalDays: number;
  businessDays: number;
  weekendDays: number;
  holidaysExcluded: number;
  holidaysOnWeekends: number;
  holidaysOutside: number;
}

/** Business days between two dates, counting both the start and end date. */
export function businessDays(a: YMD, b: YMD, weekend: Set<number>, holidays: YMD[]): BusinessResult {
  const reversed = compare(a, b) > 0;
  const [start, end] = reversed ? [b, a] : [a, b];
  const s = dayNumber(start);
  const total = dayNumber(end) - s + 1;
  const weekendDays = countWeekdays(s, total, weekend);
  const unique = [...new Set(holidays.map(dayNumber))];
  let excluded = 0;
  let onWeekend = 0;
  let outside = 0;
  for (const h of unique) {
    if (h < s || h >= s + total) outside++;
    else if (weekend.has((((h + 4) % 7) + 7) % 7)) onWeekend++;
    else excluded++;
  }
  return {
    reversed,
    totalDays: total,
    businessDays: total - weekendDays - excluded,
    weekendDays,
    holidaysExcluded: excluded,
    holidaysOnWeekends: onWeekend,
    holidaysOutside: outside,
  };
}

/** Parses a holiday list: ISO dates (YYYY-MM-DD) separated by commas, spaces or new lines. */
export function parseHolidays(text: string): { dates: YMD[]; invalid: string[] } {
  const dates: YMD[] = [];
  const invalid: string[] = [];
  for (const tok of text.split(/[\s,;]+/).filter(Boolean)) {
    const d = parseISODate(tok);
    if (d) dates.push(d);
    else invalid.push(tok);
  }
  return { dates, invalid };
}

/** Working-week presets, expressed as the days that are weekends. */
export const WEEKEND_PRESETS: { id: string; label: string; hint: string; days: number[] }[] = [
  { id: "mon-fri", label: "Mon–Fri", hint: "Sat & Sun off", days: [6, 0] },
  { id: "mon-sat", label: "Mon–Sat", hint: "Sun off", days: [0] },
  { id: "sun-thu", label: "Sun–Thu", hint: "Fri & Sat off", days: [5, 6] },
  { id: "sat-thu", label: "Sat–Thu", hint: "Fri off", days: [5] },
];

export interface Countdown {
  /** Positive = days remaining, negative = days ago, 0 = today. */
  days: number;
  weeks: number;
  weekRemainder: number;
  months: number;
  monthRemainderDays: number;
  weekday: string;
}

/** Days from `today` to `target` on the calendar (never affected by time of day). */
export function countdown(today: YMD, target: YMD): Countdown {
  const r = daysBetween(today, target, false);
  const days = r.reversed ? -r.elapsedDays : r.elapsedDays;
  const abs = Math.abs(days);
  return { days, weeks: Math.floor(abs / 7), weekRemainder: abs % 7, months: r.months, monthRemainderDays: r.monthRemainderDays, weekday: WEEKDAY_NAMES[dayOfWeek(target)] };
}
