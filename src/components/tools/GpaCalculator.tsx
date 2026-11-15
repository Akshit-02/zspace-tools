"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Copy as CopyIcon, Download, FileText, Info, Plus, Sparkles, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Panel, Segmented, Toggle } from "./ui";
import { Chips, NumberField, ResetButton } from "./calc-ui";
import { FORMULAS, SAMPLE_SUBJECTS, SCALES, computeCgpa, computeGpa, fixed, toPercent, type RepeatPolicy, type Scale, type Semester, type Subject } from "@/lib/gpa";
import { buildCsv } from "@/lib/csv-write";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

let seq = 0;
const uid = () => `r${++seq}`;
const blankSubject = (): Subject => ({ id: uid(), name: "", grade: "", points: "", credits: "", marks: "" });
const blankSemester = (n: number): Semester => ({ id: uid(), name: `Semester ${n}`, gpa: "", credits: "" });
const cell = "h-10 w-full min-w-0 rounded-[8px] border border-line-strong bg-card px-2.5 text-sm outline-none focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]";

export default function GpaCalculator() {
  const [mode, setMode] = useState<"gpa" | "cgpa" | "percent">("gpa");
  const [scaleId, setScaleId] = useState("10");
  const [custom, setCustom] = useState<Scale>({ ...SCALES[0], id: "custom", label: "Custom", note: "Your own grade letters and points." });
  const [subjects, setSubjects] = useState<Subject[]>([blankSubject(), blankSubject(), blankSubject()]);
  const [repeat, setRepeat] = useState<RepeatPolicy>("all");
  const [pointsMode, setPointsMode] = useState<Set<string>>(new Set());
  const togglePoints = (id: string, on: boolean) =>
    setPointsMode((p) => {
      const n = new Set(p);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });
  const [semesters, setSemesters] = useState<Semester[]>([blankSemester(1), blankSemester(2)]);
  const [equalWeights, setEqualWeights] = useState(false);
  const [pctInput, setPctInput] = useState("");
  const [formulaId, setFormulaId] = useState("");
  const [customFormula, setCustomFormula] = useState({ offset: "0", multiplier: "10" });

  useEffect(() => {
    track("tool_opened", { tool: "gpa-cgpa-calculator" });
  }, []);

  const scale = scaleId === "custom" ? custom : SCALES.find((s) => s.id === scaleId)!;
  const gpa = useMemo(() => computeGpa(subjects, scale, repeat), [subjects, scale, repeat]);
  const cgpa = useMemo(() => computeCgpa(semesters, scale.max, equalWeights), [semesters, scale.max, equalWeights]);
  const g = gpa.status === "ok" ? gpa.result : null;
  const c = cgpa.status === "ok" ? cgpa.result : null;

  const setSub = (id: string, k: keyof Subject, v: string) => setSubjects((l) => l.map((s) => (s.id === id ? { ...s, [k]: v } : s)));
  const setSem = (id: string, k: keyof Semester, v: string) => setSemesters((l) => l.map((s) => (s.id === id ? { ...s, [k]: v } : s)));

  const formulas = FORMULAS.filter((f) => f.max === scale.max);
  const formula = formulaId === "custom" ? { offset: Number(customFormula.offset) || 0, multiplier: Number(customFormula.multiplier) || 0, label: `(GPA − ${customFormula.offset || 0}) × ${customFormula.multiplier || 0}` } : FORMULAS.find((f) => f.id === formulaId);
  const pctValue = Number(pctInput.replace(/,/g, ""));
  const pctValid = pctInput.trim() !== "" && Number.isFinite(pctValue) && pctValue >= 0 && pctValue <= scale.max;

  const gpaSummary = () =>
    g
      ? [
          `Semester GPA — ${scale.label} scale (ZSpace Tools)`,
          `GPA: ${fixed(g.gpa)} / ${scale.max}`,
          `Credits counted: ${g.credits}; grade points × credits: ${fixed(g.qualityPoints)}`,
          `Subjects counted: ${g.counted}${g.skipped.length ? `; not counted: ${g.skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}` : ""}`,
          ...(g.repeatsDropped.length ? [`Repeated attempts not counted (${repeat === "latest" ? "latest kept" : "best kept"}): ${g.repeatsDropped.join(", ")}`] : []),
          ...(g.avgMarks !== null ? [`Credit-weighted average marks: ${fixed(g.avgMarks)}%`] : []),
        ].join("\n")
      : "";
  const cgpaSummary = () =>
    c
      ? [`CGPA — ${scale.label} scale (ZSpace Tools)`, `CGPA: ${fixed(c.cgpa)} / ${scale.max}`, c.equalWeights ? "Semesters weighted equally (credits ignored, as chosen)." : `Total credits: ${c.credits}`, ...c.semesters.map((s) => `${s.name}: GPA ${s.gpa}${c.equalWeights ? "" : `, ${s.credits} credits`}`)].join("\n")
      : "";

  const download = (kind: "gpa" | "cgpa", type: "csv" | "txt") => {
    let blob: Blob;
    if (type === "txt") blob = new Blob([kind === "gpa" ? gpaSummary() : cgpaSummary()], { type: "text/plain;charset=utf-8" });
    else if (kind === "gpa") {
      const rows = [["Subject", "Grade", "Grade points", "Credits", "Points × credits", "Marks %"]];
      subjects.forEach((s, i) => {
        const p = s.grade ? scale.grades.find((x) => x.letter === s.grade)?.points : Number(s.points);
        rows.push([s.name || `Subject ${i + 1}`, s.grade || "(points)", p === undefined || Number.isNaN(p) ? "" : String(p), s.credits, p !== undefined && s.credits ? String(+(p * Number(s.credits)).toFixed(4)) : "", s.marks]);
      });
      if (g) rows.push(["GPA", "", fixed(g.gpa), String(g.credits), fixed(g.qualityPoints), g.avgMarks === null ? "" : fixed(g.avgMarks)]);
      blob = new Blob([buildCsv(rows, { bom: true })], { type: "text/csv;charset=utf-8" });
    } else {
      const rows = [["Semester", "GPA", "Credits"], ...semesters.map((s) => [s.name, s.gpa, s.credits])];
      if (c) rows.push(["CGPA", fixed(c.cgpa), c.equalWeights ? "equal weights" : String(c.credits)]);
      blob = new Blob([buildCsv(rows, { bom: true })], { type: "text/csv;charset=utf-8" });
    }
    downloadBlob(blob, `${kind}-${type === "csv" ? "results.csv" : "summary.txt"}`);
    track("download_clicked", { tool: "gpa-cgpa-calculator", format: type });
  };

  const actionBtn = "inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal";

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
          <div>
            <p className="mb-1.5 text-sm font-medium">Calculate</p>
            <Segmented label="Calculator mode" className="md:w-[380px]" value={mode} onChange={setMode} options={[{ value: "gpa", label: "Semester GPA" }, { value: "cgpa", label: "CGPA" }, { value: "percent", label: "To %" }]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Grading scale</p>
            <Chips
              label="Grading scale"
              value={scaleId}
              onChange={(v) => {
                if (v === "custom" && scaleId !== "custom") setCustom({ ...scale, id: "custom", label: "Custom", note: "Your own grade letters and points.", grades: scale.grades.map((x) => ({ ...x })) });
                setScaleId(v);
                setFormulaId("");
              }}
              options={[...SCALES.map((s) => ({ value: s.id, label: s.label })), { value: "custom", label: "Custom" }]}
            />
          </div>
        </div>
        <p className="flex gap-2 text-sm text-ink-2" data-testid="gpa-scale-note">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" /> {scale.note} Grade points: {scale.grades.map((x) => `${x.letter} ${x.points}`).join(" · ")}.
        </p>
        {scaleId === "custom" && (
          <div className="grid gap-3 rounded-[12px] border border-line bg-ivory p-3" data-testid="gpa-custom-scale">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Highest grade point</span>
                <input className={clsx(cell, "w-24 font-mono")} inputMode="decimal" value={String(custom.max)} onChange={(e) => setCustom((x) => ({ ...x, max: Math.max(1, Number(e.target.value) || 0) }))} aria-label="Highest grade point" />
              </label>
              <button type="button" className={actionBtn} onClick={() => setCustom((x) => ({ ...x, grades: [...x.grades, { letter: `G${x.grades.length + 1}`, points: 0 }] }))}>
                <Plus aria-hidden className="size-4" /> Add grade
              </button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {custom.grades.map((gr, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <input aria-label={`Grade ${i + 1} letter`} className={clsx(cell, "w-20")} value={gr.letter} onChange={(e) => setCustom((x) => ({ ...x, grades: x.grades.map((y, j) => (j === i ? { ...y, letter: e.target.value.slice(0, 6) } : y)) }))} />
                  <input aria-label={`Grade ${i + 1} points`} className={clsx(cell, "w-20 font-mono")} inputMode="decimal" value={String(gr.points)} onChange={(e) => setCustom((x) => ({ ...x, grades: x.grades.map((y, j) => (j === i ? { ...y, points: Math.max(0, Number(e.target.value) || 0) } : y)) }))} />
                  <button type="button" aria-label={`Remove grade ${gr.letter}`} onClick={() => setCustom((x) => ({ ...x, grades: x.grades.filter((_, j) => j !== i) }))} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {mode === "gpa" && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
          <Panel className="grid content-start gap-3 p-4 sm:p-5">
            <div className="hidden grid-cols-[1.6fr_1fr_0.7fr_0.7fr_auto] gap-2 px-1 text-xs font-medium text-ink-2 sm:grid" aria-hidden>
              <span>Subject</span>
              <span>Grade</span>
              <span>Credits</span>
              <span>Marks %</span>
              <span className="w-9" />
            </div>
            <ul className="grid gap-3 sm:gap-2" data-testid="gpa-subjects">
              {subjects.map((s, i) => (
                <li key={s.id} className="grid grid-cols-2 gap-2 rounded-[12px] border border-line p-2.5 sm:grid-cols-[1.6fr_1fr_0.7fr_0.7fr_auto] sm:border-0 sm:p-0">
                  <input aria-label={`Subject ${i + 1} name`} placeholder={`Subject ${i + 1}`} className={clsx(cell, "col-span-2 sm:col-span-1")} value={s.name} onChange={(e) => setSub(s.id, "name", e.target.value)} />
                  {pointsMode.has(s.id) ? (
                    <div className="flex gap-1">
                      <input aria-label={`Subject ${i + 1} grade points`} inputMode="decimal" placeholder={`0–${scale.max}`} className={clsx(cell, "font-mono")} value={s.points} onChange={(e) => setSub(s.id, "points", e.target.value)} />
                      <button type="button" title="Choose a letter grade instead" aria-label={`Use a letter grade for subject ${i + 1}`} onClick={() => (togglePoints(s.id, false), setSub(s.id, "points", ""))} className="shrink-0 rounded-[8px] px-2 text-xs text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                        A–F
                      </button>
                    </div>
                  ) : (
                    <select
                      aria-label={`Subject ${i + 1} grade`}
                      className={clsx(cell, "cursor-pointer")}
                      value={s.grade}
                      onChange={(e) => {
                        if (e.target.value === "__points") {
                          togglePoints(s.id, true);
                          setSub(s.id, "grade", "");
                        } else setSub(s.id, "grade", e.target.value);
                      }}
                    >
                      <option value="">Grade…</option>
                      {scale.grades.map((gr) => (
                        <option key={gr.letter} value={gr.letter}>
                          {gr.letter} ({gr.points})
                        </option>
                      ))}
                      <option value="__points">Type grade points…</option>
                    </select>
                  )}
                  <input aria-label={`Subject ${i + 1} credits`} inputMode="decimal" placeholder="Credits" className={clsx(cell, "font-mono")} value={s.credits} onChange={(e) => setSub(s.id, "credits", e.target.value)} />
                  <input aria-label={`Subject ${i + 1} marks (optional)`} inputMode="decimal" placeholder="Marks %" className={clsx(cell, "font-mono")} value={s.marks} onChange={(e) => setSub(s.id, "marks", e.target.value)} />
                  <button type="button" aria-label={`Remove subject ${i + 1}`} onClick={() => setSubjects((l) => l.filter((x) => x.id !== s.id))} className="grid size-10 place-items-center justify-self-end rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error sm:size-9">
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className={actionBtn} onClick={() => setSubjects((l) => [...l, blankSubject()])}>
                <Plus aria-hidden className="size-4" /> Add subject
              </button>
              <button type="button" className={actionBtn} onClick={() => (setScaleId("10"), setSubjects(SAMPLE_SUBJECTS.map((s) => ({ ...s, id: uid() }))))}>
                <Sparkles aria-hidden className="size-4" /> Sample data
              </button>
              <ResetButton onClick={() => (setSubjects([blankSubject(), blankSubject(), blankSubject()]), setRepeat("all"))} />
            </div>
            <div className="border-t border-line pt-3">
              <label htmlFor="gpa-repeat" className="mb-1.5 block text-sm font-medium">
                Repeated subjects (same name entered more than once)
              </label>
              <select id="gpa-repeat" className={clsx(cell, "cursor-pointer sm:w-auto")} value={repeat} onChange={(e) => setRepeat(e.target.value as RepeatPolicy)}>
                <option value="all">Count every attempt</option>
                <option value="latest">Count only the latest attempt</option>
                <option value="best">Count only the best attempt</option>
              </select>
              <p className="mt-1.5 text-xs text-ink-2">Institutions differ — check whether yours averages all attempts or replaces an earlier grade.</p>
            </div>
          </Panel>

          <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-7 lg:sticky lg:top-24 lg:self-start">
            <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
              <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Semester GPA
            </p>
            {g ? (
              <>
                <p className="mt-3 font-mono text-[clamp(2.6rem,2rem+2.5vw,3.6rem)] leading-none tracking-tight" data-testid="gpa-value">
                  {fixed(g.gpa)}
                  <span className="text-[0.4em] text-ivory/50"> / {scale.max}</span>
                </p>
                <dl className="mt-5 divide-y divide-ivory/10 border-t border-ivory/10 text-sm">
                  {(
                    [
                      ["Credits counted", String(g.credits)],
                      ["Grade points × credits", fixed(g.qualityPoints)],
                      ["Subjects counted", String(g.counted)],
                      ...(g.avgMarks !== null ? [["Weighted average marks", `${fixed(g.avgMarks)}%`]] : []),
                    ] as [string, string][]
                  ).map(([l, v]) => (
                    <div key={l} className="flex justify-between gap-4 py-2.5">
                      <dt className="text-ivory/70">{l}</dt>
                      <dd className="font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-ivory/55">Grade distribution</p>
                  <ul className="mt-2 grid gap-1.5" data-testid="gpa-distribution">
                    {g.distribution.map((d) => (
                      <li key={d.letter} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-sm">
                        <span className="font-mono">{d.letter}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-ivory/10">
                          <span className="block h-full rounded-full bg-orange" style={{ width: `${(d.count / g.counted) * 100}%` }} />
                        </span>
                        <span className="text-right font-mono text-ivory/70">{d.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {(g.skipped.length > 0 || g.repeatsDropped.length > 0) && (
                  <ul className="mt-4 space-y-1.5 text-sm text-ivory/75" data-testid="gpa-skipped">
                    {g.skipped.map((s) => (
                      <li key={s.name + s.reason} className="flex gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> Not counted: {s.name} — {s.reason}.
                      </li>
                    ))}
                    {g.repeatsDropped.map((n, i) => (
                      <li key={n + i} className="flex gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> Repeated subject: an attempt of {n} isn&rsquo;t counted ({repeat === "latest" ? "latest kept" : "best kept"}).
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <CopyButton text={gpaSummary} label="Copy result" variant="primary" onCopied={() => track("copy_clicked", { tool: "gpa-cgpa-calculator" })} />
                  <button type="button" onClick={() => download("gpa", "csv")} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                    <Download aria-hidden className="size-4" /> CSV
                  </button>
                  <button type="button" onClick={() => download("gpa", "txt")} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                    <FileText aria-hidden className="size-4" /> Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSemesters((l) => {
                        const empty = l.findIndex((s) => !s.gpa && !s.credits);
                        const row = { id: uid(), name: empty >= 0 ? l[empty].name : `Semester ${l.length + 1}`, gpa: fixed(g.gpa, 4).replace(/0+$/, "").replace(/\.$/, ""), credits: String(g.credits) };
                        return empty >= 0 ? l.map((s, i) => (i === empty ? row : s)) : [...l, row];
                      });
                      setMode("cgpa");
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ivory/80 hover:text-ivory"
                  >
                    Add to CGPA <ArrowRight aria-hidden className="size-4" />
                  </button>
                </div>
              </>
            ) : gpa.status === "error" ? (
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {gpa.message}
              </p>
            ) : (
              <p className="mt-6 text-ivory/60">Add subjects with a grade and credits.</p>
            )}
            <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55">GPA = Σ(grade points × credits) ÷ Σ credits. Zero-credit (audit) subjects don&rsquo;t change the GPA. Failed grades count with their credits unless your institution says otherwise.</p>
          </div>
        </div>
      )}

      {mode === "cgpa" && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
          <Panel className="grid content-start gap-3 p-4 sm:p-5">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_auto] gap-2 px-1 text-xs font-medium text-ink-2 sm:grid" aria-hidden>
              <span>Semester</span>
              <span>GPA (0–{scale.max})</span>
              <span>Credits</span>
              <span className="w-[4.75rem]" />
            </div>
            <ul className="grid gap-3 sm:gap-2" data-testid="cgpa-semesters">
              {semesters.map((s, i) => (
                <li key={s.id} className="grid grid-cols-2 gap-2 rounded-[12px] border border-line p-2.5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:border-0 sm:p-0">
                  <input aria-label={`Semester ${i + 1} name`} className={clsx(cell, "col-span-2 sm:col-span-1")} value={s.name} onChange={(e) => setSem(s.id, "name", e.target.value)} />
                  <input aria-label={`Semester ${i + 1} GPA`} inputMode="decimal" placeholder="GPA" className={clsx(cell, "font-mono")} value={s.gpa} onChange={(e) => setSem(s.id, "gpa", e.target.value)} />
                  <input aria-label={`Semester ${i + 1} credits`} inputMode="decimal" placeholder={equalWeights ? "not used" : "Credits"} disabled={equalWeights} className={clsx(cell, "font-mono disabled:opacity-40")} value={s.credits} onChange={(e) => setSem(s.id, "credits", e.target.value)} />
                  <span className="col-span-2 flex justify-end gap-1 sm:col-span-1">
                    <button type="button" aria-label={`Duplicate ${s.name || `semester ${i + 1}`}`} onClick={() => setSemesters((l) => [...l.slice(0, i + 1), { ...s, id: uid(), name: `${s.name} (copy)` }, ...l.slice(i + 1)])} className="grid size-10 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 sm:size-9">
                      <CopyIcon aria-hidden className="size-4" />
                    </button>
                    <button type="button" aria-label={`Remove ${s.name || `semester ${i + 1}`}`} onClick={() => setSemesters((l) => l.filter((x) => x.id !== s.id))} className="grid size-10 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error sm:size-9">
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className={actionBtn} onClick={() => setSemesters((l) => [...l, blankSemester(l.length + 1)])}>
                <Plus aria-hidden className="size-4" /> Add semester
              </button>
              <button
                type="button"
                className={actionBtn}
                onClick={() => (setScaleId("10"), setSemesters([{ id: uid(), name: "Semester 1", gpa: "8.2", credits: "22" }, { id: uid(), name: "Semester 2", gpa: "8.75", credits: "24" }, { id: uid(), name: "Semester 3", gpa: "7.9", credits: "20" }, { id: uid(), name: "Semester 4", gpa: "8.6", credits: "23" }]))}
              >
                <Sparkles aria-hidden className="size-4" /> Sample data
              </button>
              <ResetButton onClick={() => (setSemesters([blankSemester(1), blankSemester(2)]), setEqualWeights(false))} />
            </div>
            <div className="border-t border-line pt-3">
              <Toggle checked={equalWeights} onChange={setEqualWeights} label="I don't know the credits — weight semesters equally" description="Only correct if every semester has the same credits" />
            </div>
          </Panel>

          <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-7 lg:sticky lg:top-24 lg:self-start">
            <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
              <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> CGPA
            </p>
            {c ? (
              <>
                <p className="mt-3 font-mono text-[clamp(2.6rem,2rem+2.5vw,3.6rem)] leading-none tracking-tight" data-testid="cgpa-value">
                  {fixed(c.cgpa)}
                  <span className="text-[0.4em] text-ivory/50"> / {scale.max}</span>
                </p>
                <p className="mt-2 text-sm text-ivory/65">{c.equalWeights ? `Simple average of ${c.semesters.length} semesters (equal weights)` : `Credit-weighted over ${c.semesters.length} semesters · ${c.credits} credits`}</p>
                <table className="mt-5 w-full text-sm" data-testid="cgpa-table">
                  <thead className="text-xs text-ivory/55">
                    <tr className="border-b border-ivory/10">
                      <th scope="col" className="py-2 text-left font-medium">Semester</th>
                      <th scope="col" className="py-2 text-right font-medium">GPA</th>
                      {!c.equalWeights && <th scope="col" className="py-2 text-right font-medium">Credits</th>}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {c.semesters.map((s) => (
                      <tr key={s.name} className="border-b border-ivory/10 last:border-0">
                        <td className="py-2 font-sans">{s.name}</td>
                        <td className="py-2 text-right">{s.gpa}</td>
                        {!c.equalWeights && <td className="py-2 text-right">{s.credits}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {c.skipped.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-ivory/75">
                    {c.skipped.map((s) => (
                      <li key={s.name} className="flex gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> Not counted: {s.name} — {s.reason}.
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <CopyButton text={cgpaSummary} label="Copy result" variant="primary" />
                  <button type="button" onClick={() => download("cgpa", "csv")} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                    <Download aria-hidden className="size-4" /> CSV
                  </button>
                  <button type="button" onClick={() => download("cgpa", "txt")} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3.5 text-sm font-medium hover:border-ivory/60">
                    <FileText aria-hidden className="size-4" /> Summary
                  </button>
                  <button type="button" onClick={() => (setPctInput(fixed(c.cgpa)), setMode("percent"))} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ivory/80 hover:text-ivory">
                    Convert to % <ArrowRight aria-hidden className="size-4" />
                  </button>
                </div>
              </>
            ) : cgpa.status === "error" ? (
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" /> {cgpa.message}
              </p>
            ) : (
              <p className="mt-6 text-ivory/60">Add your semesters with their GPA and credits.</p>
            )}
            <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/55">CGPA = Σ(semester GPA × semester credits) ÷ Σ credits. A plain average of semester GPAs is only correct when every semester has the same credits.</p>
          </div>
        </div>
      )}

      {mode === "percent" && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr] [&>*]:min-w-0">
          <Panel className="grid content-start gap-5 p-5 sm:p-7">
            <p className="flex gap-2 rounded-[12px] border border-[#e5c98f] bg-[#fbf3e3] px-4 py-3 text-sm text-[#6b4510]">
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              There&rsquo;s no universal GPA-to-percentage formula. Use the one your university, board or the organisation you&rsquo;re applying to specifies — it&rsquo;s usually printed on the marksheet or transcript.
            </p>
            <NumberField id="pct-gpa" label={`Your GPA / CGPA (0–${scale.max})`} value={pctInput} onChange={setPctInput} error={pctInput && !pctValid ? `Enter a value from 0 to ${scale.max}.` : null} size="lg" hint={c ? `Your CGPA above is ${fixed(c.cgpa)}.` : g ? `Your semester GPA above is ${fixed(g.gpa)}.` : undefined} />
            <div>
              <label htmlFor="pct-formula" className="mb-1.5 block text-sm font-medium">
                Conversion formula
              </label>
              <select id="pct-formula" className={clsx(cell, "h-11 cursor-pointer")} value={formulaId} onChange={(e) => setFormulaId(e.target.value)}>
                <option value="">Choose a formula…</option>
                {formulas.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
                <option value="custom">My institution&rsquo;s formula (custom)</option>
              </select>
              <p className="mt-1.5 text-xs text-ink-2">Presets are common examples for a {scale.max}-point scale, not official rules for any institution.</p>
            </div>
            {formulaId === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="pct-offset" label="Subtract" value={customFormula.offset} onChange={(v) => setCustomFormula((x) => ({ ...x, offset: v }))} />
                <NumberField id="pct-mult" label="Then multiply by" value={customFormula.multiplier} onChange={(v) => setCustomFormula((x) => ({ ...x, multiplier: v }))} />
              </div>
            )}
          </Panel>
          <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-7">
            <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
              <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> Percentage equivalent
            </p>
            {formula && pctValid ? (
              <>
                <p className="mt-3 font-mono text-[clamp(2.6rem,2rem+2.5vw,3.6rem)] leading-none tracking-tight" data-testid="pct-value">
                  {fixed(toPercent(pctValue, formula))}%
                </p>
                <p className="mt-4 rounded-[10px] bg-ivory/[0.06] px-3.5 py-2.5 font-mono text-sm text-ivory/80" data-testid="pct-formula-shown">
                  Formula: {formula.label.replace(/CGPA|GPA/, String(pctValue))} = {fixed(toPercent(pctValue, formula))}%
                </p>
                <div className="mt-6">
                  <CopyButton text={() => `${pctValue} on a ${scale.max}-point scale ≈ ${fixed(toPercent(pctValue, formula))}% using ${formula.label} (institution-specific formula).`} label="Copy result" variant="primary" />
                </div>
              </>
            ) : (
              <p className="mt-6 text-ivory/60">{formula ? "Enter your GPA or CGPA." : "Choose the formula your institution uses to see a percentage."}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
