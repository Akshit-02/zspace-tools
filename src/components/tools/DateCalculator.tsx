"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeftRight, Check, Link2, Plus, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, Segmented, Toggle, copyText } from "./ui";
import { WEEKDAY_NAMES, WEEKEND_PRESETS, businessDays, countdown, dayOfWeek, daysBetween, parseHolidays, parseISODate, shiftDate, type Offset } from "@/lib/date-calc";
import { formatYMD, toISO, todayLocal } from "@/lib/age";
import { track } from "@/lib/analytics";

type Mode = "between" | "shift" | "business" | "countdown";
const MODES: Mode[] = ["between", "shift", "business", "countdown"];
const nf = new Intl.NumberFormat("en-US");
const pl = (n: number, w: string) => `${nf.format(n)} ${w}${n === 1 ? "" : "s"}`;

function DateInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="min-w-0 flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="date"
        min="0001-01-01"
        max="9999-12-31"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full rounded-[12px] border border-line-strong bg-card px-4 font-mono text-[1.02rem] outline-none transition-[border-color,box-shadow] focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)]"
      />
    </div>
  );
}

function NumField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-ink-2">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        placeholder="0"
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
        className="h-12 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-lg outline-none placeholder:text-line-strong focus:border-charcoal"
      />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[12px] border border-ivory/15 px-4 py-3">
      <dt className="text-xs text-ivory/60">{k}</dt>
      <dd className="mt-0.5 font-mono text-[1.05rem]">{v}</dd>
    </div>
  );
}

export default function DateCalculator() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("between");
  const [today, setToday] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const [sign, setSign] = useState<1 | -1>(1);
  const [off, setOff] = useState({ years: "", months: "", weeks: "", days: "30" });
  const [weekend, setWeekend] = useState<number[]>([6, 0]);
  const [holidays, setHolidays] = useState("");
  const [pick, setPick] = useState("");
  const [target, setTarget] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const t = todayLocal();
    const iso = toISO(t);
    const end = new Date(Date.UTC(t.y, t.m - 1, t.d + 30));
    setToday(iso); // eslint-disable-line react-hooks/set-state-in-effect
    setA(iso);
    const plus30 = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
    setB(plus30);
    setTarget(plus30);
    // Restore a shared calculation. Every value is validated; anything unexpected is ignored.
    const q = new URLSearchParams(window.location.search);
    const m = q.get("m") as Mode | null;
    if (m && MODES.includes(m)) setMode(m);
    const date = (k: string) => {
      const v = q.get(k);
      return v && parseISODate(v) ? v : null;
    };
    const qa = date("a");
    const qb = date("b");
    const qt = date("t");
    if (qa) setA(qa);
    if (qb) setB(qb);
    if (qt) setTarget(qt);
    if (q.get("inc") === "1") setInclusive(true);
    if (q.get("sub") === "1") setSign(-1);
    const num = (k: string) => (/^\d{1,6}$/.test(q.get(k) ?? "") ? q.get(k)! : "");
    if (["y", "mo", "w", "d"].some((k) => q.has(k))) setOff({ years: num("y"), months: num("mo"), weeks: num("w"), days: num("d") });
    const wk = q.get("wk");
    if (wk && /^[0-6](,[0-6]){0,5}$/.test(wk)) setWeekend([...new Set(wk.split(",").map(Number))]);
    const hol = q.get("hol");
    if (hol && /^(\d{4}-\d{2}-\d{2})(,\d{4}-\d{2}-\d{2}){0,60}$/.test(hol)) setHolidays(hol.split(",").join("\n"));
    track("tool_opened", { tool: "days-between-dates" });
  }, []);

  const da = parseISODate(a);
  const db = parseISODate(b);
  const hol = useMemo(() => parseHolidays(holidays), [holidays]);

  const dt = parseISODate(target);
  const dToday = parseISODate(today);
  const result = useMemo(() => {
    if (mode === "countdown") {
      if (!dt || !dToday) return { error: "Choose a valid date to count down to." };
      return { countdown: countdown(dToday, dt) };
    }
    if (mode === "shift") {
      if (!da) return { error: "Choose a valid start date." };
      const o: Offset = { years: +off.years || 0, months: +off.months || 0, weeks: +off.weeks || 0, days: +off.days || 0 };
      const r = shiftDate(da, o, sign);
      return r.ok ? { shift: { date: r.date, o } } : { error: r.error };
    }
    if (!da || !db) return { error: "Choose valid start and end dates." };
    if (mode === "between") return { between: daysBetween(da, db, inclusive) };
    if (weekend.length === 7) return { error: "Every day is marked as a weekend — leave at least one working day." };
    return { business: businessDays(da, db, new Set(weekend), hol.dates) };
  }, [mode, da, db, dt, dToday, inclusive, off, sign, weekend, hol]);

  const summary = (() => {
    if ("between" in result && result.between) {
      const r = result.between;
      return `${formatYMD(r.start)} → ${formatYMD(r.end)}: ${pl(r.countedDays, "day")} (${r.inclusive ? "including the end date" : "elapsed"}), ${pl(r.weekdays, "weekday")} and ${pl(r.weekendDays, "weekend day")}.`;
    }
    if ("shift" in result && result.shift) {
      const { o, date } = result.shift;
      const parts = [o.years && pl(o.years, "year"), o.months && pl(o.months, "month"), o.weeks && pl(o.weeks, "week"), o.days && pl(o.days, "day")].filter(Boolean).join(", ") || "0 days";
      return `${da ? formatYMD(da) : ""} ${sign === 1 ? "+" : "−"} ${parts} = ${WEEKDAY_NAMES[dayOfWeek(date)]}, ${formatYMD(date)}`;
    }
    if ("countdown" in result && result.countdown) {
      const c = result.countdown;
      const when = dt ? `${c.weekday}, ${formatYMD(dt)}` : "";
      return c.days === 0 ? `${when} is today.` : c.days > 0 ? `${pl(c.days, "day")} until ${when}.` : `${when} was ${pl(-c.days, "day")} ago.`;
    }
    if ("business" in result && result.business) {
      const r = result.business;
      return `${pl(r.businessDays, "business day")} from ${da ? formatYMD(da) : ""} to ${db ? formatYMD(db) : ""} (both dates counted), excluding ${pl(r.weekendDays, "weekend day")} and ${pl(r.holidaysExcluded, "holiday")}.`;
    }
    return "";
  })();

  const shareUrl = () => {
    const q = new URLSearchParams({ m: mode });
    if (mode === "countdown") q.set("t", target);
    else q.set("a", a);
    if (mode === "between" || mode === "business") q.set("b", b);
    if (mode === "between" && inclusive) q.set("inc", "1");
    if (mode === "shift") {
      if (sign === -1) q.set("sub", "1");
      (
        [
          ["y", off.years],
          ["mo", off.months],
          ["w", off.weeks],
          ["d", off.days],
        ] as const
      ).forEach(([k, v]) => v && q.set(k, v));
    }
    if (mode === "business") {
      q.set("wk", weekend.join(","));
      if (hol.dates.length) q.set("hol", hol.dates.map(toISO).join(","));
    }
    return `${window.location.origin}${window.location.pathname}?${q.toString()}`;
  };

  const reset = () => {
    setA(today);
    setB(today);
    setInclusive(false);
    setSign(1);
    setOff({ years: "", months: "", weeks: "", days: "30" });
    setWeekend([6, 0]);
    setHolidays("");
    setTarget(today);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <Segmented
          label="Calculator mode"
          size="sm"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          options={[
            { value: "between", label: <><span className="sm:hidden">Diff</span><span className="hidden sm:inline">Difference</span></> },
            { value: "shift", label: <><span className="sm:hidden">Add/sub</span><span className="hidden sm:inline">Add / subtract</span></> },
            { value: "business", label: <><span className="sm:hidden">Business</span><span className="hidden sm:inline">Business days</span></> },
            { value: "countdown", label: "Countdown" },
          ]}
        />

        <div className="mt-6 grid gap-5">
          {mode === "countdown" ? (
            <div>
              <DateInput id={`${id}-t`} label="Count down to" value={target} onChange={setTarget} />
              <p className="mt-2 text-xs text-ink-2">Counted from today ({dToday ? formatYMD(dToday) : "…"}) on your device&rsquo;s calendar.</p>
            </div>
          ) : mode !== "shift" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <DateInput id={`${id}-a`} label="Start date" value={a} onChange={setA} />
              <button
                type="button"
                onClick={() => {
                  setA(b);
                  setB(a);
                }}
                aria-label="Swap dates"
                className="mb-1.5 hidden size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-card hover:border-orange hover:text-orange-ink sm:grid"
              >
                <ArrowLeftRight className="size-4" />
              </button>
              <DateInput id={`${id}-b`} label="End date" value={b} onChange={setB} />
            </div>
          ) : (
            <DateInput id={`${id}-a`} label="Start date" value={a} onChange={setA} />
          )}

          {mode === "between" && (
            <Toggle checked={inclusive} onChange={setInclusive} label="Include end date" description={inclusive ? "Counts both the first and last day" : "Counts elapsed days (Mon → Tue = 1)"} />
          )}

          {mode === "shift" && (
            <>
              <Segmented
                label="Add or subtract"
                value={sign === 1 ? "add" : "sub"}
                onChange={(v) => setSign(v === "add" ? 1 : -1)}
                options={[
                  { value: "add", label: "Add" },
                  { value: "sub", label: "Subtract" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["years", "months", "weeks", "days"] as const).map((k) => (
                  <NumField key={k} id={`${id}-${k}`} label={k} value={off[k]} onChange={(v) => setOff((o) => ({ ...o, [k]: v }))} />
                ))}
              </div>
              <p className="text-xs text-ink-2">Years and months are added on the calendar first, then weeks and days. If the day doesn&rsquo;t exist in the new month, the last day of that month is used.</p>
            </>
          )}

          {mode === "business" && (
            <>
              <div>
                <FieldLabel>Working week</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKEND_PRESETS.map((p) => {
                    const active = p.days.length === weekend.length && p.days.every((d) => weekend.includes(d));
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setWeekend(p.days)}
                        aria-pressed={active}
                        className={clsx("rounded-[10px] border px-3 py-1.5 text-left text-sm transition-colors", active ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
                      >
                        <span className="block font-medium">{p.label}</span>
                        <span className={clsx("block font-mono text-[0.68rem]", active ? "text-ivory/60" : "text-ink-2")}>{p.hint}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Weekend days">
                  {WEEKDAY_NAMES.map((n, i) => {
                    const on = weekend.includes(i);
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${n} is ${on ? "a weekend day" : "a working day"}`}
                        onClick={() => setWeekend((w) => (on ? w.filter((d) => d !== i) : [...w, i]))}
                        className={clsx("h-9 rounded-[8px] border font-mono text-xs transition-colors", on ? "border-orange bg-orange-wash text-orange-ink" : "border-line bg-card text-ink-2 hover:border-line-strong")}
                      >
                        {n.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <FieldLabel htmlFor={`${id}-hol`} hint={hol.dates.length ? `${hol.dates.length} entered` : undefined}>
                  Holidays (optional)
                </FieldLabel>
                <div className="mb-2 flex gap-2">
                  <input
                    type="date"
                    aria-label="Pick a holiday date"
                    value={pick}
                    onChange={(e) => setPick(e.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none focus:border-charcoal"
                  />
                  <button
                    type="button"
                    disabled={!parseISODate(pick)}
                    onClick={() => {
                      setHolidays((h) => (h.trim() ? `${h.trim()}\n${pick}` : pick));
                      setPick("");
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal disabled:opacity-40"
                  >
                    <Plus aria-hidden className="size-4" /> Add
                  </button>
                </div>
                <textarea
                  id={`${id}-hol`}
                  rows={3}
                  value={holidays}
                  onChange={(e) => setHolidays(e.target.value)}
                  placeholder={"2026-12-25\n2027-01-01"}
                  className="w-full resize-y rounded-[10px] border border-line-strong bg-card px-3 py-2 font-mono text-sm outline-none placeholder:text-ink-3 focus:border-charcoal"
                />
                {hol.invalid.length > 0 && (
                  <p className="mt-1 text-xs text-error">
                    Not recognised: {hol.invalid.slice(0, 4).join(", ")}
                    {hol.invalid.length > 4 ? "…" : ""} — use YYYY-MM-DD.
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-2">No public holidays are added automatically — enter the ones that apply to you.</p>
              </div>
            </>
          )}
        </div>
      </Panel>

      <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8">
        <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
          <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Result
        </p>
        <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" data-testid="date-result">
          {"error" in result && result.error ? (
            <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
              <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {result.error}
            </p>
          ) : "between" in result && result.between ? (
            <>
              <p className="mt-4 font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight" data-testid="date-main">
                {nf.format(result.between.countedDays)} <span className="text-[0.4em] text-ivory/70">{result.between.countedDays === 1 ? "day" : "days"}</span>
              </p>
              <p className="mt-3 text-ivory/75">
                {result.between.inclusive ? "Counting both the start and end date" : "Elapsed between the two dates"}
                {result.between.reversed && " · the dates were in reverse order"}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat k="Weeks" v={`${nf.format(result.between.weeks)} + ${result.between.weekRemainder}d`} />
                <Stat k="Calendar months" v={`${nf.format(result.between.months)} + ${result.between.monthRemainderDays}d`} />
                <Stat k="Y · M · D" v={`${result.between.ymd.y} · ${result.between.ymd.m} · ${result.between.ymd.d}`} />
                <Stat k="Weekdays (Mon–Fri)" v={nf.format(result.between.weekdays)} />
                <Stat k="Weekend days" v={nf.format(result.between.weekendDays)} />
                <Stat k="Start day" v={WEEKDAY_NAMES[dayOfWeek(result.between.start)]} />
                <Stat k="End day" v={WEEKDAY_NAMES[dayOfWeek(result.between.end)]} />
                <Stat k="Hours" v={nf.format(result.between.countedDays * 24)} />
                <Stat k="Minutes" v={nf.format(result.between.countedDays * 1440)} />
              </dl>
              <p className="mt-3 text-xs text-ivory/55">Hours and minutes count each calendar day as 24 hours; real clock time can differ by an hour across daylight-saving changes.</p>
            </>
          ) : "shift" in result && result.shift ? (
            <>
              <p className="mt-4 font-display text-[clamp(1.9rem,1.4rem+2vw,2.8rem)] font-semibold leading-tight" data-testid="date-main">
                {formatYMD(result.shift.date)}
              </p>
              <p className="mt-2 font-mono text-orange">{WEEKDAY_NAMES[dayOfWeek(result.shift.date)]}</p>
              <dl className="mt-6 grid grid-cols-2 gap-3">
                <Stat k="Original date" v={da ? formatYMD(da) : "—"} />
                <Stat k="ISO date" v={toISO(result.shift.date)} />
              </dl>
              <p className="mt-5 text-sm text-ivory/70">{summary}</p>
            </>
          ) : "countdown" in result && result.countdown ? (
            <>
              <p className="mt-4 font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight" data-testid="date-main">
                {result.countdown.days === 0 ? "Today" : `${nf.format(Math.abs(result.countdown.days))} ${Math.abs(result.countdown.days) === 1 ? "day" : "days"}`}
              </p>
              <p className="mt-3 text-ivory/75">
                {result.countdown.days > 0 ? "to go until" : result.countdown.days < 0 ? "since" : "It's"} {result.countdown.weekday}, {dt ? formatYMD(dt) : ""}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat k="Weeks" v={`${nf.format(result.countdown.weeks)} + ${result.countdown.weekRemainder}d`} />
                <Stat k="Calendar months" v={`${nf.format(result.countdown.months)} + ${result.countdown.monthRemainderDays}d`} />
                <Stat k="Hours" v={nf.format(Math.abs(result.countdown.days) * 24)} />
              </dl>
            </>
          ) : "business" in result && result.business ? (
            <>
              <p className="mt-4 font-mono text-[clamp(2.6rem,1.8rem+3vw,4rem)] leading-none tracking-tight" data-testid="date-main">
                {nf.format(result.business.businessDays)} <span className="text-[0.4em] text-ivory/70">business {result.business.businessDays === 1 ? "day" : "days"}</span>
              </p>
              <p className="mt-3 text-ivory/75">Start and end dates both counted{result.business.reversed && " · dates were in reverse order"}</p>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat k="Total days" v={nf.format(result.business.totalDays)} />
                <Stat k="Weekend days" v={nf.format(result.business.weekendDays)} />
                <Stat k="Holidays excluded" v={nf.format(result.business.holidaysExcluded)} />
              </dl>
              {(result.business.holidaysOnWeekends > 0 || result.business.holidaysOutside > 0) && (
                <p className="mt-4 text-sm text-ivory/65">
                  {result.business.holidaysOnWeekends > 0 && `${pl(result.business.holidaysOnWeekends, "holiday")} fell on a weekend and didn't change the count. `}
                  {result.business.holidaysOutside > 0 && `${pl(result.business.holidaysOutside, "holiday")} ${result.business.holidaysOutside === 1 ? "is" : "are"} outside the date range.`}
                </p>
              )}
            </>
          ) : null}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <button
              type="button"
              onClick={async () => {
                if (await copyText(shareUrl())) {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 1500);
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60"
            >
              {linkCopied ? <Check aria-hidden className="size-4 text-orange" /> : <Link2 aria-hidden className="size-4" />} {linkCopied ? "Link copied" : "Copy share link"}
            </button>
            <CopyButton text={() => summary} variant="primary" label="Copy result" onCopied={() => track("copy_clicked", { tool: "days-between-dates", format: mode })} />
            <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ivory/70 hover:text-ivory">
              <RotateCcw aria-hidden className="size-4" /> Reset
            </button>
          </div>
        </motion.div>
        {mode === "business" && weekend.length > 0 && (
          <p className="mt-4 text-xs text-ivory/50">
            Weekend: {weekend.slice().sort().map((d) => WEEKDAY_NAMES[d].slice(0, 3)).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
