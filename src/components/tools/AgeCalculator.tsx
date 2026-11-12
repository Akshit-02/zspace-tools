"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CalendarDays, Cake, PartyPopper, RotateCcw } from "lucide-react";
import { CopyButton, FieldLabel, Panel, Segmented } from "./ui";
import { calculateAge, formatYMD, parseISODate, toISO, todayLocal, type AgeOutcome } from "@/lib/age";
import { track } from "@/lib/analytics";

type Mode = "age" | "diff";
const nf = new Intl.NumberFormat("en-US");
const plural = (n: number, w: string) => `${nf.format(n)} ${w}${n === 1 ? "" : "s"}`;

function DateField({ id, label, value, onChange, max, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; max?: string; hint?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="date"
        value={value}
        min="0001-01-01"
        max={max ?? "9999-12-31"}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-[12px] border border-line-strong bg-card px-4 font-mono text-[1.05rem] text-charcoal outline-none transition-[border-color,box-shadow] focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60"
      />
      {hint && <p className="mt-1.5 text-xs text-ink-2">{hint}</p>}
    </div>
  );
}

function Big({ n, unit }: { n: number; unit: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <motion.span key={n} initial={{ opacity: 0.3, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight">
        {n}
      </motion.span>
      <span className="text-lg text-ivory/70">{unit}</span>
    </span>
  );
}

export default function AgeCalculator() {
  const [mode, setMode] = useState<Mode>("age");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [today, setToday] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // "Today" is set on the client only, so server HTML never bakes in a date.
  useEffect(() => {
    const t = toISO(todayLocal());
    setToday(t); // eslint-disable-line react-hooks/set-state-in-effect
    setEnd(t);
    track("tool_opened", { tool: "age-calculator" });
  }, []);

  const outcome: AgeOutcome | null = useMemo(() => {
    if (!submitted) return null;
    const a = parseISODate(start);
    const b = parseISODate(end);
    if (!a) return { ok: false, error: mode === "age" ? "Enter a valid date of birth." : "Enter a valid start date." };
    if (!b) return { ok: false, error: mode === "age" ? "Enter a valid date to calculate age on." : "Enter a valid end date." };
    return calculateAge(a, b, { allowFutureStart: mode === "diff", today: parseISODate(today) ?? undefined });
  }, [submitted, start, end, mode, today]);

  const calculate = () => setSubmitted(true);
  const reset = () => {
    setStart("");
    setEnd(today);
    setSubmitted(false);
  };

  const r = outcome?.ok ? outcome.result : null;
  const summary = r
    ? `${plural(r.years, "year")}, ${plural(r.months, "month")} and ${plural(r.days, "day")} (${nf.format(r.totalDays)} days in total)`
    : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <Segmented
          label="Calculation"
          value={mode}
          onChange={(v) => {
            setMode(v as Mode);
            setSubmitted(false);
          }}
          options={[
            { value: "age", label: "Age from date of birth" },
            { value: "diff", label: "Between two dates" },
          ]}
        />
        <form
          className="mt-6 grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            calculate();
          }}
        >
          <DateField
            id="age-start"
            label={mode === "age" ? "Date of birth" : "Start date"}
            value={start}
            onChange={setStart}
            max={mode === "age" ? today || undefined : undefined}
          />
          <DateField
            id="age-end"
            label={mode === "age" ? "Age on" : "End date"}
            value={end}
            onChange={setEnd}
            hint={mode === "age" ? (end === today ? "Today, by default. Change it to see your age on another date." : undefined) : "Any date — past or future."}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-orange px-6 font-medium text-charcoal transition-colors hover:bg-[#ec6a34] sm:flex-none">
              <CalendarDays aria-hidden className="size-4" /> Calculate
            </button>
            <button type="button" onClick={reset} className="inline-flex h-12 items-center gap-2 rounded-[12px] border border-line-strong bg-card px-5 font-medium transition-colors hover:border-charcoal">
              <RotateCcw aria-hidden className="size-4" /> Reset
            </button>
          </div>
        </form>
        <p className="mt-8 border-t border-dashed border-line-strong pt-5 text-sm leading-relaxed text-ink-2">
          Age is counted in whole calendar months from the start date, then remaining days — never by dividing by 365. If a month has no matching day (the 31st, or
          29 February), that month completes on its last day.
        </p>
      </Panel>

      <div aria-live="polite" className="rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8">
        <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
          <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> {mode === "age" ? "Your age" : "Time between dates"}
        </p>
        <AnimatePresence mode="wait">
          {r ? (
            <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3" data-testid="age-ymd">
                <Big n={r.years} unit={r.years === 1 ? "year" : "years"} />
                <Big n={r.months} unit={r.months === 1 ? "month" : "months"} />
                <Big n={r.days} unit={r.days === 1 ? "day" : "days"} />
              </div>
              {mode === "age" && r.isBirthday && (
                <p className="mt-4 flex items-center gap-2 text-orange">
                  <PartyPopper aria-hidden className="size-5" /> Happy birthday — you turn {r.years} today{r.leapling ? " (celebrating on 28 February this year)" : ""}.
                </p>
              )}
              <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { k: "Total months", v: nf.format(r.totalMonths) },
                  { k: "Total weeks", v: `${nf.format(r.totalWeeks)}${r.weekRemainderDays ? ` + ${r.weekRemainderDays}d` : ""}` },
                  { k: "Total days", v: nf.format(r.totalDays) },
                  ...(mode === "age"
                    ? [
                        { k: "Born on a", v: r.bornOn },
                        { k: "Next birthday", v: formatYMD(r.nextBirthday) },
                        { k: "Days to go", v: r.daysToBirthday === 0 ? "Today 🎉" : nf.format(r.daysToBirthday) },
                      ]
                    : [{ k: "Start day", v: r.bornOn }]),
                ].map((m) => (
                  <div key={m.k} className="rounded-[12px] border border-ivory/15 px-4 py-3">
                    <dt className="text-xs text-ivory/60">{m.k}</dt>
                    <dd className="mt-0.5 font-mono text-[1.05rem]">{m.v}</dd>
                  </div>
                ))}
              </dl>
              {mode === "age" && !r.isBirthday && (
                <p className="mt-5 flex items-center gap-2 text-sm text-ivory/75">
                  <Cake aria-hidden className="size-4 text-orange" /> You&rsquo;ll turn {r.ageAtNextBirthday} on {formatYMD(r.nextBirthday)}
                  {r.leapling ? " — 29 February birthdays fall on 28 February in common years." : "."}
                </p>
              )}
              <div className="mt-6">
                <CopyButton text={() => summary} variant="primary" label="Copy result" onCopied={() => track("copy_clicked", { tool: "age-calculator" })} />
              </div>
            </motion.div>
          ) : outcome && !outcome.ok ? (
            <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
              <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" />
              {outcome.error}
            </motion.p>
          ) : (
            <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
              <p className="font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight text-ivory/20">— y — m — d</p>
              <p className="mt-4 text-ivory/60">Enter {mode === "age" ? "your date of birth" : "two dates"} and press Calculate.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
