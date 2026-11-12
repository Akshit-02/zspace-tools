/**
 * Calendar-accurate age / date-difference maths (UTC, no time-of-day or DST).
 * Years and months are counted by stepping the start date forward in whole
 * calendar months from the ORIGINAL date (clamped to month end), so
 * 31 Jan + 1 month = 28/29 Feb and 31 Jan + 2 months = 31 Mar.
 * 29 February birthdays fall on 28 February in common years (stated in the UI).
 */

export interface YMD {
  y: number;
  m: number; // 1–12
  d: number;
}

export function parseISODate(s: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const v = { y: +m[1], m: +m[2], d: +m[3] };
  if (v.y < 1 || v.m < 1 || v.m > 12 || v.d < 1 || v.d > daysInMonth(v.y, v.m)) return null;
  return v;
}

export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInMonth = (y: number, m: number) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

/** Days since 1970-01-01 (proleptic Gregorian, UTC). */
export function dayNumber({ y, m, d }: YMD) {
  const t = new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  t.setUTCHours(0, 0, 0, 0);
  return Math.round(t.getTime() / 86_400_000);
}

export function addMonths(date: YMD, months: number): YMD {
  const total = date.y * 12 + (date.m - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { y, m, d: Math.min(date.d, daysInMonth(y, m)) };
}

export const compare = (a: YMD, b: YMD) => dayNumber(a) - dayNumber(b);

export function weekday(date: YMD) {
  const t = new Date(0);
  t.setUTCFullYear(date.y, date.m - 1, date.d);
  return t.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
}

export function formatYMD(date: YMD) {
  const t = new Date(0);
  t.setUTCFullYear(date.y, date.m - 1, date.d);
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export interface AgeResult {
  years: number;
  months: number; // remaining months after completed years
  days: number; // remaining days after completed months
  totalMonths: number;
  totalWeeks: number;
  weekRemainderDays: number;
  totalDays: number;
  bornOn: string; // weekday of the start date
  nextBirthday: YMD;
  daysToBirthday: number;
  ageAtNextBirthday: number;
  isBirthday: boolean;
  leapling: boolean;
}

export type AgeOutcome = { ok: true; result: AgeResult } | { ok: false; error: string };

export function calculateAge(start: YMD, end: YMD, opts: { allowFutureStart?: boolean; today?: YMD } = {}): AgeOutcome {
  if (!opts.allowFutureStart && opts.today && compare(start, opts.today) > 0) return { ok: false, error: "The date of birth is in the future. Check the year." };
  if (compare(start, end) > 0) return { ok: false, error: "The first date is after the second date. Swap them, or pick an earlier first date." };

  // Largest whole number of months such that start + months <= end.
  let totalMonths = (end.y - start.y) * 12 + (end.m - start.m);
  if (compare(addMonths(start, totalMonths), end) > 0) totalMonths--;
  const anchor = addMonths(start, totalMonths);
  const days = dayNumber(end) - dayNumber(anchor);
  const totalDays = dayNumber(end) - dayNumber(start);
  const years = Math.floor(totalMonths / 12);

  // Next birthday on or after `end` (clamped: 29 Feb → 28 Feb in common years).
  let nextAge = years + (totalMonths % 12 === 0 && days === 0 ? 0 : 1);
  let next = addMonths(start, nextAge * 12);
  if (compare(next, end) < 0) {
    nextAge++;
    next = addMonths(start, nextAge * 12);
  }

  return {
    ok: true,
    result: {
      years,
      months: totalMonths % 12,
      days,
      totalMonths,
      totalWeeks: Math.floor(totalDays / 7),
      weekRemainderDays: totalDays % 7,
      totalDays,
      bornOn: weekday(start),
      nextBirthday: next,
      daysToBirthday: dayNumber(next) - dayNumber(end),
      ageAtNextBirthday: nextAge,
      isBirthday: dayNumber(next) === dayNumber(end) && totalDays > 0,
      leapling: start.m === 2 && start.d === 29,
    },
  };
}

export function todayLocal(): YMD {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}

export const toISO = ({ y, m, d }: YMD) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
