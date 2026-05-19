"use client";
import { useState, useMemo } from "react";
import { Copy, Check, RotateCcw, Calendar } from "lucide-react";

function today() {
  return new Date().toISOString().split("T")[0];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthday: { days: number; date: string; weekday: string };
  zodiac: { sign: string; symbol: string };
  birthstone: string;
  season: string;
  dayOfWeek: string;
  isLeapYear: boolean;
  age18Date: string;
  age60Date: string;
}

const ZODIAC = [
  { sign: "Capricorn", symbol: "♑", from: [12, 22], to: [1, 19] },
  { sign: "Aquarius", symbol: "♒", from: [1, 20], to: [2, 18] },
  { sign: "Pisces", symbol: "♓", from: [2, 19], to: [3, 20] },
  { sign: "Aries", symbol: "♈", from: [3, 21], to: [4, 19] },
  { sign: "Taurus", symbol: "♉", from: [4, 20], to: [5, 20] },
  { sign: "Gemini", symbol: "♊", from: [5, 21], to: [6, 20] },
  { sign: "Cancer", symbol: "♋", from: [6, 21], to: [7, 22] },
  { sign: "Leo", symbol: "♌", from: [7, 23], to: [8, 22] },
  { sign: "Virgo", symbol: "♍", from: [8, 23], to: [9, 22] },
  { sign: "Libra", symbol: "♎", from: [9, 23], to: [10, 22] },
  { sign: "Scorpio", symbol: "♏", from: [10, 23], to: [11, 21] },
  { sign: "Sagittarius", symbol: "♐", from: [11, 22], to: [12, 21] },
];

const BIRTHSTONES = [
  "Garnet",
  "Amethyst",
  "Aquamarine",
  "Diamond",
  "Emerald",
  "Pearl",
  "Ruby",
  "Peridot",
  "Sapphire",
  "Opal",
  "Topaz",
  "Turquoise",
];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getZodiac(month: number, day: number) {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm <= tm) {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return z;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return z;
    }
  }
  // Capricorn wraps Dec 22 – Jan 19
  const m = month,
    d = day;
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return ZODIAC[0];
  return ZODIAC[0];
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return "🌸 Spring";
  if (month >= 6 && month <= 8) return "☀️ Summer";
  if (month >= 9 && month <= 11) return "🍂 Autumn";
  return "❄️ Winter";
}

function formatDate(d: Date): string {
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcAge(dob: Date, refDate: Date): AgeResult {
  let years = refDate.getFullYear() - dob.getFullYear();
  let months = refDate.getMonth() - dob.getMonth();
  let days = refDate.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalDays = Math.floor((refDate.getTime() - dob.getTime()) / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;
  const totalHours = totalDays * 24;
  const totalMinutes = totalHours * 60;

  // Next birthday
  const thisYear = refDate.getFullYear();
  let nextBD = new Date(thisYear, dob.getMonth(), dob.getDate());
  if (nextBD <= refDate)
    nextBD = new Date(thisYear + 1, dob.getMonth(), dob.getDate());
  const daysToNextBD = Math.ceil(
    (nextBD.getTime() - refDate.getTime()) / 86400000,
  );

  // 18th and 60th birthdays
  const age18 = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  const age60 = new Date(dob.getFullYear() + 60, dob.getMonth(), dob.getDate());

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours,
    totalMinutes,
    nextBirthday: {
      days: daysToNextBD === 365 || daysToNextBD === 366 ? 0 : daysToNextBD,
      date: formatDate(nextBD),
      weekday: WEEKDAYS[nextBD.getDay()],
    },
    zodiac: getZodiac(dob.getMonth() + 1, dob.getDate()),
    birthstone: BIRTHSTONES[dob.getMonth()],
    season: getSeason(dob.getMonth() + 1),
    dayOfWeek: WEEKDAYS[dob.getDay()],
    isLeapYear:
      (dob.getFullYear() % 4 === 0 && dob.getFullYear() % 100 !== 0) ||
      dob.getFullYear() % 400 === 0,
    age18Date: formatDate(age18),
    age60Date: formatDate(age60),
  };
}

export default function AgeCalculatorClient() {
  const [dob, setDob] = useState("");
  const [refDate, setRef] = useState(today());
  const [copied, setCopied] = useState(false);

  const result = useMemo<AgeResult | null>(() => {
    if (!dob || !refDate) return null;
    const d = new Date(dob);
    const r = new Date(refDate);
    if (isNaN(d.getTime()) || isNaN(r.getTime())) return null;
    if (d > r) return null;
    return calcAge(d, r);
  }, [dob, refDate]);

  const dobObj = dob ? new Date(dob) : null;

  const handleCopy = () => {
    if (!result || !dobObj) return;
    const text = [
      `Age Calculation`,
      `Date of Birth: ${formatDate(dobObj)}`,
      `Age: ${result.years} years, ${result.months} months, ${result.days} days`,
      `Total Days: ${result.totalDays.toLocaleString("en-IN")}`,
      `Total Weeks: ${result.totalWeeks.toLocaleString("en-IN")}`,
      `Total Hours: ${result.totalHours.toLocaleString("en-IN")}`,
      `Next Birthday: ${result.nextBirthday.date} (in ${result.nextBirthday.days} days)`,
      `Zodiac: ${result.zodiac.sign}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── INPUT ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">
          <h2 className="font-display font-bold text-lg text-ink-800">
            Enter Details
          </h2>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="label">
              Date of Birth
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="dob"
                type="date"
                value={dob}
                max={today()}
                onChange={(e) => setDob(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Quick DOB presets */}
          <div>
            <p className="label">Quick Age Check</p>
            <div className="flex flex-wrap gap-2">
              {[1, 5, 10, 18, 25, 30, 40, 50, 60].map((age) => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - age);
                const val = d.toISOString().split("T")[0];
                return (
                  <button
                    key={age}
                    onClick={() => setDob(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      dob === val
                        ? "bg-zest-500 text-white border-zest-500"
                        : "bg-gray-50 text-ink-600 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {age} yrs
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference date */}
          <div>
            <label htmlFor="refDate" className="label">
              Calculate Age As Of
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                id="refDate"
                type="date"
                value={refDate}
                onChange={(e) => setRef(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setRef(today())}
              className="text-xs text-zest-500 mt-2 hover:underline"
            >
              Reset to today
            </button>
          </div>

          {/* DOB info strip */}
          {dobObj && result && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Born on</span>
                <span className="font-medium text-ink-700">
                  {result.dayOfWeek}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Birth month</span>
                <span className="font-medium text-ink-700">
                  {MONTHS[dobObj.getMonth()]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Birth season</span>
                <span className="font-medium text-ink-700">
                  {result.season}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Leap year born</span>
                <span className="font-medium text-ink-700">
                  {result.isLeapYear ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setDob("");
              setRef(today());
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Main age card */}
        <div
          className={`rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
            result
              ? "bg-ink-900 border-ink-700 shadow-glow-sm"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {result ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  Your Age
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-glow" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Big age display */}
              <div className="flex items-end gap-4 mb-8 flex-wrap">
                <div className="text-center">
                  <div className="text-5xl lg:text-6xl font-display font-extrabold text-white leading-none">
                    {result.years}
                  </div>
                  <div className="text-xs text-white/30 mt-1 uppercase tracking-wider">
                    Years
                  </div>
                </div>
                <div className="text-white/20 text-4xl font-light mb-2">·</div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-white/80 leading-none">
                    {result.months}
                  </div>
                  <div className="text-xs text-white/30 mt-1 uppercase tracking-wider">
                    Months
                  </div>
                </div>
                <div className="text-white/20 text-4xl font-light mb-2">·</div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-white/80 leading-none">
                    {result.days}
                  </div>
                  <div className="text-xs text-white/30 mt-1 uppercase tracking-wider">
                    Days
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Total Days",
                    value: result.totalDays.toLocaleString("en-IN"),
                  },
                  {
                    label: "Total Weeks",
                    value: result.totalWeeks.toLocaleString("en-IN"),
                  },
                  {
                    label: "Total Months",
                    value: result.totalMonths.toLocaleString("en-IN"),
                  },
                  {
                    label: "Total Hours",
                    value: result.totalHours.toLocaleString("en-IN"),
                  },
                  {
                    label: "Total Minutes",
                    value: result.totalMinutes.toLocaleString("en-IN"),
                  },
                  {
                    label: "Total Seconds",
                    value: (result.totalDays * 86400).toLocaleString("en-IN"),
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">
                      {s.label}
                    </div>
                    <div className="text-sm font-display font-semibold text-white">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🎂</div>
              <p className="text-sm text-gray-400">
                Enter your date of birth to calculate your age
              </p>
            </div>
          )}
        </div>

        {/* Next birthday + milestones */}
        {result && (
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Next birthday */}
            <div
              className={`rounded-2xl border p-5 ${
                result.nextBirthday.days === 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-white border-gray-100 shadow-card"
              }`}
            >
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-400 mb-3">
                🎉 Next Birthday
              </p>
              {result.nextBirthday.days === 0 ? (
                <div>
                  <p className="text-2xl font-display font-bold text-amber-600">
                    Today! 🥳
                  </p>
                  <p className="text-xs text-amber-500 mt-1">Happy Birthday!</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-display font-bold text-ink-800">
                    {result.nextBirthday.days}{" "}
                    <span className="text-base font-medium text-gray-400">
                      days
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.nextBirthday.weekday}, {result.nextBirthday.date}
                  </p>
                </div>
              )}
            </div>

            {/* Zodiac */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-gray-400 mb-3">
                ✨ Zodiac Sign
              </p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{result.zodiac.symbol}</span>
                <div>
                  <p className="text-xl font-display font-bold text-ink-800">
                    {result.zodiac.sign}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Birthstone: {result.birthstone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Life milestones */}
        {result && dobObj && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 uppercase tracking-wider mb-4">
              Life Milestones
            </h3>
            <div className="space-y-2">
              {[
                {
                  age: 1,
                  emoji: "👶",
                  label: "1st Birthday",
                  date: new Date(
                    dobObj.getFullYear() + 1,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 10,
                  emoji: "🎒",
                  label: "10 — First Decade",
                  date: new Date(
                    dobObj.getFullYear() + 10,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 18,
                  emoji: "🎓",
                  label: "18 — Adulthood",
                  date: new Date(
                    dobObj.getFullYear() + 18,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 21,
                  emoji: "🥂",
                  label: "21 — Coming of Age",
                  date: new Date(
                    dobObj.getFullYear() + 21,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 25,
                  emoji: "🚗",
                  label: "25 — Quarter Century",
                  date: new Date(
                    dobObj.getFullYear() + 25,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 30,
                  emoji: "🏠",
                  label: "30 — Thirty",
                  date: new Date(
                    dobObj.getFullYear() + 30,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 40,
                  emoji: "💼",
                  label: "40 — Forty",
                  date: new Date(
                    dobObj.getFullYear() + 40,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 50,
                  emoji: "🎯",
                  label: "50 — Half Century",
                  date: new Date(
                    dobObj.getFullYear() + 50,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 60,
                  emoji: "🌅",
                  label: "60 — Diamond Jubilee",
                  date: new Date(
                    dobObj.getFullYear() + 60,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
                {
                  age: 100,
                  emoji: "💯",
                  label: "100 — Centenary",
                  date: new Date(
                    dobObj.getFullYear() + 100,
                    dobObj.getMonth(),
                    dobObj.getDate(),
                  ),
                },
              ].map((m) => {
                const now = new Date(refDate);
                const isPast = m.date < now;
                const isToday = formatDate(m.date) === formatDate(now);
                return (
                  <div
                    key={m.age}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors ${
                      isToday
                        ? "bg-amber-50 border border-amber-200"
                        : isPast
                          ? "bg-gray-50"
                          : "bg-white border border-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{m.emoji}</span>
                      <span
                        className={`text-sm font-medium ${isPast ? "text-gray-400" : "text-ink-700"}`}
                      >
                        {m.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${isPast ? "text-gray-300" : "text-gray-500"}`}
                      >
                        {formatDate(m.date)}
                      </span>
                      {isPast && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-medium">
                          Done
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] bg-amber-400/20 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                          Today!
                        </span>
                      )}
                      {!isPast && !isToday && (
                        <span className="text-[10px] bg-zest-500/10 text-zest-500 px-1.5 py-0.5 rounded font-medium">
                          {Math.ceil(
                            (m.date.getTime() - now.getTime()) / 86400000,
                          )}{" "}
                          days
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
