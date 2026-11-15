/**
 * GPA / CGPA.
 *
 *   GPA  = Σ(grade points × credits) / Σ credits          (one semester)
 *   CGPA = Σ(semester GPA × semester credits) / Σ credits  (credit-weighted)
 *
 * Grading scales differ between institutions. The presets below are common
 * examples and are labelled as such; every scale can be edited. There is no
 * universal GPA→percentage formula, so percentage conversion only uses a
 * formula the user picks or enters: % = (GPA − offset) × multiplier.
 */
import { parseNum } from "./discount";

export interface Grade {
  letter: string;
  points: number;
}

export interface Scale {
  id: string;
  label: string;
  max: number;
  grades: Grade[];
  note: string;
}

export const SCALES: Scale[] = [
  {
    id: "10",
    label: "10-point",
    max: 10,
    note: "Letter grades from the UGC Choice Based Credit System model (O, A+, A … F), used by many Indian universities. Check your own university's table.",
    grades: [
      { letter: "O", points: 10 },
      { letter: "A+", points: 9 },
      { letter: "A", points: 8 },
      { letter: "B+", points: 7 },
      { letter: "B", points: 6 },
      { letter: "C", points: 5 },
      { letter: "P", points: 4 },
      { letter: "F", points: 0 },
    ],
  },
  {
    id: "4",
    label: "4.0",
    max: 4,
    note: "A common US-style 4.0 scale with plus/minus grades. Some schools give A+ 4.3 or don't use minus grades — edit it to match yours.",
    grades: [
      { letter: "A+", points: 4 },
      { letter: "A", points: 4 },
      { letter: "A-", points: 3.7 },
      { letter: "B+", points: 3.3 },
      { letter: "B", points: 3 },
      { letter: "B-", points: 2.7 },
      { letter: "C+", points: 2.3 },
      { letter: "C", points: 2 },
      { letter: "C-", points: 1.7 },
      { letter: "D+", points: 1.3 },
      { letter: "D", points: 1 },
      { letter: "F", points: 0 },
    ],
  },
  {
    id: "5",
    label: "5.0",
    max: 5,
    note: "An example 5-point scale (A = 5 down to F = 0). Edit the points to match your institution.",
    grades: [
      { letter: "A", points: 5 },
      { letter: "B", points: 4 },
      { letter: "C", points: 3 },
      { letter: "D", points: 2 },
      { letter: "E", points: 1 },
      { letter: "F", points: 0 },
    ],
  },
];

export interface Subject {
  id: string;
  name: string;
  /** A letter from the scale, or "" to type grade points directly. */
  grade: string;
  points: string;
  credits: string;
  /** Optional marks in % (for the weighted-average-marks figure only). */
  marks: string;
}

export type RepeatPolicy = "all" | "latest" | "best";

export interface GpaResult {
  gpa: number;
  credits: number;
  qualityPoints: number;
  counted: number;
  skipped: { name: string; reason: string }[];
  repeatsDropped: string[];
  distribution: { letter: string; count: number }[];
  /** Credit-weighted average of marks, when every counted subject has marks. */
  avgMarks: number | null;
}

export type Outcome<T> = { status: "empty" } | { status: "error"; message: string } | { status: "ok"; result: T };

const label = (s: Subject, i: number) => s.name.trim() || `Subject ${i + 1}`;

/** Grade points for a subject on a scale, or an error string. */
export function subjectPoints(s: Subject, scale: Scale): number | string | null {
  if (s.grade) {
    const g = scale.grades.find((x) => x.letter === s.grade);
    return g ? g.points : `grade “${s.grade}” isn't on the ${scale.label} scale`;
  }
  const p = parseNum(s.points);
  if (p === null) return null;
  if (Number.isNaN(p) || p < 0 || p > scale.max) return `grade points must be between 0 and ${scale.max}`;
  return p;
}

export function computeGpa(subjects: Subject[], scale: Scale, repeat: RepeatPolicy = "all"): Outcome<GpaResult> {
  if (!subjects.length) return { status: "empty" };
  const skipped: { name: string; reason: string }[] = [];
  const rows: { key: string; name: string; points: number; credits: number; letter: string; marks: number | null; order: number }[] = [];
  subjects.forEach((s, i) => {
    const name = label(s, i);
    const p = subjectPoints(s, scale);
    const c = parseNum(s.credits);
    if (p === null && c === null) return; // untouched row
    if (p === null) return skipped.push({ name, reason: "no grade entered" });
    if (typeof p === "string") return skipped.push({ name, reason: p });
    if (c === null) return skipped.push({ name, reason: "no credits entered" });
    if (Number.isNaN(c) || c < 0 || c > 100) return skipped.push({ name, reason: "credits must be a number from 0 to 100" });
    const m = parseNum(s.marks);
    rows.push({ key: s.name.trim().toLowerCase(), name, points: p, credits: c, letter: s.grade || String(p), marks: m === null || Number.isNaN(m) || m < 0 || m > 100 ? null : m, order: i });
  });

  // Repeated subjects: same (non-empty) name appears more than once.
  const repeatsDropped: string[] = [];
  let counted = rows;
  if (repeat !== "all") {
    const keep = new Map<string, (typeof rows)[number]>();
    for (const r of rows) {
      if (!r.key) continue;
      const prev = keep.get(r.key);
      if (!prev) keep.set(r.key, r);
      else {
        const better = repeat === "latest" ? r : r.points > prev.points ? r : prev;
        repeatsDropped.push((better === r ? prev : r).name);
        keep.set(r.key, better);
      }
    }
    counted = rows.filter((r) => !r.key || keep.get(r.key) === r);
  }

  const credits = counted.reduce((a, r) => a + r.credits, 0);
  if (!counted.length) return { status: "error", message: skipped.length ? "No subject has both a valid grade and credits yet." : "Add at least one subject." };
  if (credits === 0) return { status: "error", message: "Every counted subject has 0 credits, so a credit-weighted GPA can't be calculated." };
  const qualityPoints = counted.reduce((a, r) => a + r.points * r.credits, 0);
  const dist = new Map<string, number>();
  for (const r of counted) dist.set(r.letter, (dist.get(r.letter) ?? 0) + 1);
  const order = scale.grades.map((g) => g.letter);
  const distribution = [...dist.entries()].map(([letter, count]) => ({ letter, count })).sort((a, b) => (order.indexOf(a.letter) + 1 || 99) - (order.indexOf(b.letter) + 1 || 99));
  const withCredits = counted.filter((r) => r.credits > 0);
  const avgMarks = withCredits.length && withCredits.every((r) => r.marks !== null) ? withCredits.reduce((a, r) => a + r.marks! * r.credits, 0) / credits : null;
  return { status: "ok", result: { gpa: qualityPoints / credits, credits, qualityPoints, counted: counted.length, skipped, repeatsDropped, distribution, avgMarks } };
}

export interface Semester {
  id: string;
  name: string;
  gpa: string;
  credits: string;
}

export interface CgpaResult {
  cgpa: number;
  credits: number;
  semesters: { name: string; gpa: number; credits: number }[];
  skipped: { name: string; reason: string }[];
  equalWeights: boolean;
}

export function computeCgpa(semesters: Semester[], max: number, equalWeights = false): Outcome<CgpaResult> {
  if (!semesters.length) return { status: "empty" };
  const ok: { name: string; gpa: number; credits: number }[] = [];
  const skipped: { name: string; reason: string }[] = [];
  semesters.forEach((s, i) => {
    const name = s.name.trim() || `Semester ${i + 1}`;
    const g = parseNum(s.gpa);
    const c = equalWeights ? 1 : parseNum(s.credits);
    if (g === null && (c === null || equalWeights)) return;
    if (g === null || Number.isNaN(g)) return skipped.push({ name, reason: "no GPA entered" });
    if (g < 0 || g > max) return skipped.push({ name, reason: `GPA must be between 0 and ${max}` });
    if (c === null || Number.isNaN(c)) return skipped.push({ name, reason: "no credits entered" });
    if (c <= 0) return skipped.push({ name, reason: "credits must be more than 0" });
    ok.push({ name, gpa: g, credits: c });
  });
  if (!ok.length) return { status: "error", message: "Enter a GPA and credits for at least one semester." };
  const credits = ok.reduce((a, s) => a + s.credits, 0);
  return { status: "ok", result: { cgpa: ok.reduce((a, s) => a + s.gpa * s.credits, 0) / credits, credits: equalWeights ? 0 : credits, semesters: ok, skipped, equalWeights } };
}

export interface Formula {
  id: string;
  label: string;
  offset: number;
  multiplier: number;
  max: number;
}

/** Examples only — always check what your institution or the receiving organisation asks for. */
export const FORMULAS: Formula[] = [
  { id: "x9.5", label: "CGPA × 9.5", offset: 0, multiplier: 9.5, max: 10 },
  { id: "x10", label: "CGPA × 10", offset: 0, multiplier: 10, max: 10 },
  { id: "m075", label: "(CGPA − 0.75) × 10", offset: 0.75, multiplier: 10, max: 10 },
  { id: "of4", label: "GPA ÷ 4 × 100", offset: 0, multiplier: 25, max: 4 },
  { id: "of5", label: "GPA ÷ 5 × 100", offset: 0, multiplier: 20, max: 5 },
];

export const toPercent = (gpa: number, f: { offset: number; multiplier: number }) => Math.min(100, Math.max(0, (gpa - f.offset) * f.multiplier));

/**
 * Rounds half up for display. 8.995 is stored as 8.99499999…, so binary noise
 * is removed first (12 significant digits) and the shift is done in decimal
 * exponent notation — 8.995 → "9.00", 3.5375 → "3.54".
 */
export const fixed = (n: number, d = 2) => {
  if (!Number.isFinite(n)) return "—";
  const clean = Number(n.toPrecision(12));
  return (Math.sign(clean) * Number(`${Math.round(Number(`${Math.abs(clean)}e${d}`))}e-${d}`)).toFixed(d);
};

export const SAMPLE_SUBJECTS: Omit<Subject, "id">[] = [
  { name: "Mathematics", grade: "A+", points: "", credits: "4", marks: "" },
  { name: "Physics", grade: "A", points: "", credits: "4", marks: "" },
  { name: "Programming Lab", grade: "O", points: "", credits: "2", marks: "" },
  { name: "English", grade: "B+", points: "", credits: "3", marks: "" },
  { name: "Environmental Studies", grade: "A", points: "", credits: "2", marks: "" },
];
