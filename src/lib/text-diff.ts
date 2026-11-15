/**
 * Text comparison engine.
 *
 * Sequences are compared with Myers' O(ND) algorithm using the linear-space
 * "middle snake" bisection (the same approach as diff-match-patch), with a
 * deadline so pathological inputs degrade to a correct-but-coarser result
 * instead of freezing. Lines are compared first; changed line pairs are then
 * compared word-by-word or character-by-character (grapheme clusters, so emoji
 * and combining accents are never split).
 *
 * Ignore options only change the comparison keys — the texts themselves are
 * never modified, and every displayed line is the user's original text.
 */

export type Run = [op: -1 | 0 | 1, count: number];

/** Minimal edit script between two integer sequences. `complete` is false if the deadline cut the search short. */
export function diffSequences(a: ArrayLike<number>, b: ArrayLike<number>, deadline = Infinity): { runs: Run[]; complete: boolean } {
  const runs: Run[] = [];
  let complete = true;
  const push = (op: -1 | 0 | 1, n: number) => {
    if (n <= 0) return;
    const last = runs[runs.length - 1];
    if (last && last[0] === op) last[1] += n;
    else runs.push([op, n]);
  };

  const main = (aLo: number, aHi: number, bLo: number, bHi: number) => {
    let p = 0;
    while (aLo + p < aHi && bLo + p < bHi && a[aLo + p] === b[bLo + p]) p++;
    push(0, p);
    aLo += p;
    bLo += p;
    let s = 0;
    while (aHi - s > aLo && bHi - s > bLo && a[aHi - 1 - s] === b[bHi - 1 - s]) s++;
    aHi -= s;
    bHi -= s;
    if (aLo === aHi) push(1, bHi - bLo);
    else if (bLo === bHi) push(-1, aHi - aLo);
    else if (!complete) {
      push(-1, aHi - aLo);
      push(1, bHi - bLo);
    } else bisect(aLo, aHi, bLo, bHi);
    push(0, s);
  };

  const bisect = (aLo: number, aHi: number, bLo: number, bHi: number) => {
    const n = aHi - aLo;
    const m = bHi - bLo;
    const maxD = Math.ceil((n + m) / 2);
    const vOff = maxD;
    const vLen = 2 * maxD + 2;
    const v1 = new Int32Array(vLen).fill(-1);
    const v2 = new Int32Array(vLen).fill(-1);
    v1[vOff + 1] = 0;
    v2[vOff + 1] = 0;
    const delta = n - m;
    const front = delta % 2 !== 0;
    let k1s = 0, k1e = 0, k2s = 0, k2e = 0;
    for (let d = 0; d < maxD; d++) {
      if ((d & 31) === 0 && Date.now() > deadline) {
        complete = false;
        break;
      }
      for (let k1 = -d + k1s; k1 <= d - k1e; k1 += 2) {
        const k1o = vOff + k1;
        let x1 = k1 === -d || (k1 !== d && v1[k1o - 1] < v1[k1o + 1]) ? v1[k1o + 1] : v1[k1o - 1] + 1;
        let y1 = x1 - k1;
        while (x1 < n && y1 < m && a[aLo + x1] === b[bLo + y1]) {
          x1++;
          y1++;
        }
        v1[k1o] = x1;
        if (x1 > n) k1e += 2;
        else if (y1 > m) k1s += 2;
        else if (front) {
          const k2o = vOff + delta - k1;
          if (k2o >= 0 && k2o < vLen && v2[k2o] !== -1 && x1 >= n - v2[k2o]) {
            main(aLo, aLo + x1, bLo, bLo + y1);
            main(aLo + x1, aHi, bLo + y1, bHi);
            return;
          }
        }
      }
      for (let k2 = -d + k2s; k2 <= d - k2e; k2 += 2) {
        const k2o = vOff + k2;
        let x2 = k2 === -d || (k2 !== d && v2[k2o - 1] < v2[k2o + 1]) ? v2[k2o + 1] : v2[k2o - 1] + 1;
        let y2 = x2 - k2;
        while (x2 < n && y2 < m && a[aHi - 1 - x2] === b[bHi - 1 - y2]) {
          x2++;
          y2++;
        }
        v2[k2o] = x2;
        if (x2 > n) k2e += 2;
        else if (y2 > m) k2s += 2;
        else if (!front) {
          const k1o = vOff + delta - k2;
          if (k1o >= 0 && k1o < vLen && v1[k1o] !== -1) {
            const x1 = v1[k1o];
            const y1 = vOff + x1 - k1o;
            if (x1 >= n - x2) {
              main(aLo, aLo + x1, bLo, bLo + y1);
              main(aLo + x1, aHi, bLo + y1, bHi);
              return;
            }
          }
        }
      }
    }
    // No common subsequence found (or out of time): replace the whole range.
    push(-1, n);
    push(1, m);
  };

  main(0, a.length, 0, b.length);
  return { runs, complete };
}

/* ------------------------------------------------------------------ */
/* Keyed diff with skippable tokens                                    */
/* ------------------------------------------------------------------ */

export type Op = { t: 0 | -1 | 1; a: number; b: number } | { t: "skipA"; a: number; b: -1 } | { t: "skipB"; a: -1; b: number };

/**
 * Diffs two key lists. A `null` key means "ignored": the token takes no part in
 * the comparison and is reported as skipA/skipB in its original position.
 */
export function diffKeys(aKeys: (string | null)[], bKeys: (string | null)[], deadline = Infinity): { ops: Op[]; complete: boolean } {
  const ids = new Map<string, number>();
  const intern = (k: string) => {
    let id = ids.get(k);
    if (id === undefined) ids.set(k, (id = ids.size));
    return id;
  };
  const aIdx: number[] = [];
  const bIdx: number[] = [];
  const aSeq: number[] = [];
  const bSeq: number[] = [];
  aKeys.forEach((k, i) => {
    if (k !== null) {
      aIdx.push(i);
      aSeq.push(intern(k));
    }
  });
  bKeys.forEach((k, i) => {
    if (k !== null) {
      bIdx.push(i);
      bSeq.push(intern(k));
    }
  });
  const { runs, complete } = diffSequences(Int32Array.from(aSeq), Int32Array.from(bSeq), deadline);

  const ops: Op[] = [];
  let ai = 0, bi = 0; // position in original arrays
  let fa = 0, fb = 0; // position in filtered arrays
  const flushSkips = (toA: number, toB: number) => {
    while (ai < toA) ops.push({ t: "skipA", a: ai++, b: -1 });
    while (bi < toB) ops.push({ t: "skipB", a: -1, b: bi++ });
  };
  for (const [op, count] of runs) {
    for (let c = 0; c < count; c++) {
      if (op === 0) {
        flushSkips(aIdx[fa], bIdx[fb]);
        ops.push({ t: 0, a: ai++, b: bi++ });
        fa++;
        fb++;
      } else if (op === -1) {
        flushSkips(aIdx[fa], bi);
        ops.push({ t: -1, a: ai++, b: -1 });
        fa++;
      } else {
        flushSkips(ai, bIdx[fb]);
        ops.push({ t: 1, a: -1, b: bi++ });
        fb++;
      }
    }
  }
  flushSkips(aKeys.length, bKeys.length);
  return { ops, complete };
}

/* ------------------------------------------------------------------ */
/* Tokenising                                                          */
/* ------------------------------------------------------------------ */

export type Granularity = "line" | "word" | "char";

export interface DiffOptions {
  granularity: Granularity;
  ignoreCase: boolean;
  /** Ignore whitespace at the start and end of each line. */
  trim: boolean;
  /** Ignore every whitespace difference, including inside lines. */
  ignoreWhitespace: boolean;
  ignoreBlankLines: boolean;
  /** Treat CRLF, CR and LF as the same line break. */
  normalizeEol: boolean;
}

export const DIFF_DEFAULTS: DiffOptions = {
  granularity: "word",
  ignoreCase: false,
  trim: false,
  ignoreWhitespace: false,
  ignoreBlankLines: false,
  normalizeEol: true,
};

/** Splits into lines. A final line break does not create an extra empty line. */
export function splitLines(text: string, normalizeEol: boolean): string[] {
  if (!text) return [];
  const lines = normalizeEol ? text.split(/\r\n|\r|\n/) : text.split("\n");
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

type Segmenter = { segment: (s: string) => Iterable<{ segment: string }> };
const segmenters: Partial<Record<"word" | "grapheme", Segmenter | null>> = {};
function segmenter(kind: "word" | "grapheme"): Segmenter | null {
  if (!(kind in segmenters)) {
    const S = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => Segmenter }).Segmenter;
    segmenters[kind] = S ? new S(undefined, { granularity: kind }) : null;
  }
  return segmenters[kind]!;
}

export function tokenize(line: string, g: "word" | "char"): string[] {
  const seg = segmenter(g === "word" ? "word" : "grapheme");
  if (seg) return Array.from(seg.segment(line), (s) => s.segment);
  return g === "word" ? (line.match(/\s+|[\p{L}\p{M}\p{N}_]+|[^\s\p{L}\p{M}\p{N}_]/gu) ?? []) : Array.from(line);
}

const isWs = (s: string) => /^\s+$/.test(s);

export function lineKey(line: string, o: DiffOptions): string | null {
  let k = line;
  if (o.ignoreBlankLines && !k.trim()) return null;
  if (o.ignoreWhitespace) k = k.replace(/\s+/g, "");
  else if (o.trim) k = k.trim();
  if (o.ignoreCase) k = k.toLowerCase();
  return k;
}

function tokenKeys(tokens: string[], o: DiffOptions): (string | null)[] {
  let first = 0;
  let last = tokens.length - 1;
  if (o.trim) {
    while (first <= last && isWs(tokens[first])) first++;
    while (last >= first && isWs(tokens[last])) last--;
  }
  return tokens.map((t, i) => {
    if (isWs(t) && (o.ignoreWhitespace || i < first || i > last)) return null;
    return o.ignoreCase ? t.toLowerCase() : t;
  });
}

/* ------------------------------------------------------------------ */
/* Full comparison                                                     */
/* ------------------------------------------------------------------ */

/** [start, end, changed] character ranges within a line. */
export type Segment = [start: number, end: number, changed: 0 | 1];

export type RowKind = "eq" | "del" | "add" | "mod" | "skipA" | "skipB";
export interface Row {
  k: RowKind;
  /** Line index in the original text, or -1. */
  a: number;
  /** Line index in the modified text, or -1. */
  b: number;
  /** Inline segments for "mod" rows (word/char granularity). */
  sa?: Segment[];
  sb?: Segment[];
}

export interface DiffStats {
  added: number;
  removed: number;
  /** Lines shown as a removed/added pair. */
  modified: number;
  /** Separate blocks of change. */
  sections: number;
  /** Tokens (words or characters) added/removed inside changed lines. */
  tokensAdded: number;
  tokensRemoved: number;
}

export interface DiffResult {
  rows: Row[];
  linesA: string[];
  linesB: string[];
  stats: DiffStats;
  /** Raw texts are byte-for-byte identical. */
  identical: boolean;
  /** No differences remain under the chosen ignore options. */
  same: boolean;
  /** False when the time limit made part of the result coarser than minimal. */
  complete: boolean;
  notes: string[];
}

const MAX_INLINE_CHARS = 10_000;

function inline(la: string, lb: string, o: DiffOptions, deadline: number) {
  const g = o.granularity === "char" ? "char" : "word";
  if (la.length > MAX_INLINE_CHARS || lb.length > MAX_INLINE_CHARS) {
    return { sa: [[0, la.length, 1]] as Segment[], sb: [[0, lb.length, 1]] as Segment[], added: 0, removed: 0, complete: true, long: true };
  }
  const ta = tokenize(la, g);
  const tb = tokenize(lb, g);
  const { ops, complete } = diffKeys(tokenKeys(ta, o), tokenKeys(tb, o), Math.min(deadline, Date.now() + 200));
  const sa: Segment[] = [];
  const sb: Segment[] = [];
  const offA: number[] = [];
  const offB: number[] = [];
  ta.reduce((p, t, i) => ((offA[i] = p), p + t.length), 0);
  tb.reduce((p, t, i) => ((offB[i] = p), p + t.length), 0);
  const add = (list: Segment[], start: number, len: number, changed: 0 | 1) => {
    const last = list[list.length - 1];
    if (last && last[2] === changed && last[1] === start) last[1] += len;
    else list.push([start, start + len, changed]);
  };
  let added = 0;
  let removed = 0;
  for (const op of ops) {
    if (op.t === 0) {
      add(sa, offA[op.a], ta[op.a].length, 0);
      add(sb, offB[op.b], tb[op.b].length, 0);
    } else if (op.t === -1) {
      add(sa, offA[op.a], ta[op.a].length, 1);
      if (!isWs(ta[op.a])) removed++;
    } else if (op.t === 1) {
      add(sb, offB[op.b], tb[op.b].length, 1);
      if (!isWs(tb[op.b])) added++;
    } else if (op.t === "skipA") add(sa, offA[op.a], ta[op.a].length, 0);
    else add(sb, offB[op.b], tb[op.b].length, 0);
  }
  return { sa, sb, added, removed, complete, long: false };
}

export function compareTexts(original: string, modified: string, o: DiffOptions, timeLimitMs = 4000): DiffResult {
  const deadline = Date.now() + timeLimitMs;
  const linesA = splitLines(original, o.normalizeEol);
  const linesB = splitLines(modified, o.normalizeEol);
  const { ops, complete: linesComplete } = diffKeys(
    linesA.map((l) => lineKey(l, o)),
    linesB.map((l) => lineKey(l, o)),
    deadline,
  );

  const rows: Row[] = [];
  const stats: DiffStats = { added: 0, removed: 0, modified: 0, sections: 0, tokensAdded: 0, tokensRemoved: 0 };
  let complete = linesComplete;
  let longPairs = 0;
  let dels: number[] = [];
  let adds: number[] = [];
  const flush = () => {
    if (!dels.length && !adds.length) return;
    stats.sections++;
    stats.removed += dels.length;
    stats.added += adds.length;
    const pairs = Math.min(dels.length, adds.length);
    for (let i = 0; i < pairs; i++) {
      const row: Row = { k: "mod", a: dels[i], b: adds[i] };
      if (o.granularity !== "line") {
        const r = inline(linesA[dels[i]], linesB[adds[i]], o, deadline);
        row.sa = r.sa;
        row.sb = r.sb;
        stats.tokensAdded += r.added;
        stats.tokensRemoved += r.removed;
        if (!r.complete) complete = false;
        if (r.long) longPairs++;
      }
      rows.push(row);
    }
    stats.modified += pairs;
    for (let i = pairs; i < dels.length; i++) rows.push({ k: "del", a: dels[i], b: -1 });
    for (let i = pairs; i < adds.length; i++) rows.push({ k: "add", a: -1, b: adds[i] });
    dels = [];
    adds = [];
  };
  for (const op of ops) {
    if (op.t === -1) dels.push(op.a);
    else if (op.t === 1) adds.push(op.b);
    else {
      flush();
      rows.push(op.t === 0 ? { k: "eq", a: op.a, b: op.b } : { k: op.t, a: op.a, b: op.b });
    }
  }
  flush();

  const notes: string[] = [];
  if (longPairs) notes.push(`${longPairs} changed ${longPairs === 1 ? "line is" : "lines are"} longer than ${MAX_INLINE_CHARS.toLocaleString("en-US")} characters, so ${longPairs === 1 ? "it is" : "they are"} highlighted as a whole line rather than ${o.granularity === "char" ? "character" : "word"} by ${o.granularity === "char" ? "character" : "word"}.`);
  const crlf = (s: string) => (/\r\n/.test(s) ? "CRLF (Windows)" : /\r/.test(s) ? "CR (classic Mac)" : /\n/.test(s) ? "LF (macOS/Linux)" : "");
  const ea = crlf(original);
  const eb = crlf(modified);
  if (ea && eb && ea !== eb) notes.push(o.normalizeEol ? `Line endings differ — the original uses ${ea}, the modified text uses ${eb}. They are treated as equal because “Normalize line endings” is on.` : `Line endings differ — the original uses ${ea}, the modified text uses ${eb}. Every affected line is reported as changed; turn on “Normalize line endings” to ignore this.`);
  const endsA = /[\r\n]$/.test(original);
  const endsB = /[\r\n]$/.test(modified);
  if (original && modified && endsA !== endsB) notes.push(`Only the ${endsA ? "original" : "modified"} text ends with a line break.`);

  return {
    rows,
    linesA,
    linesB,
    stats,
    identical: original === modified,
    same: stats.added === 0 && stats.removed === 0,
    complete,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Unified diff                                                        */
/* ------------------------------------------------------------------ */

const isChange = (r: Row) => r.k === "del" || r.k === "add" || r.k === "mod";

/**
 * Standard unified diff (`diff -u` style) with `context` lines around each
 * change. Ignored lines inside a hunk are kept so line counts stay valid.
 */
export function unifiedDiff(d: DiffResult, context = 3, names = { a: "original.txt", b: "modified.txt" }, header: string[] = []) {
  const { rows, linesA, linesB } = d;
  // Line positions before each row.
  const posA: number[] = [];
  const posB: number[] = [];
  let pa = 0, pb = 0;
  for (const r of rows) {
    posA.push(pa);
    posB.push(pb);
    if (r.a >= 0) pa++;
    if (r.b >= 0) pb++;
  }
  const changeIdx = rows.map((r, i) => (isChange(r) ? i : -1)).filter((i) => i >= 0);
  const out = [...header, `--- ${names.a}`, `+++ ${names.b}`];
  if (!changeIdx.length) return out.join("\n") + "\n";

  const hunks: [number, number][] = [];
  for (const i of changeIdx) {
    const start = Math.max(0, i - context);
    const end = Math.min(rows.length - 1, i + context);
    const last = hunks[hunks.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else hunks.push([start, end]);
  }
  for (const [s, e] of hunks) {
    const minus: string[] = [];
    const plus: string[] = [];
    const body: string[] = [];
    let ca = 0, cb = 0;
    const flushPair = () => {
      body.push(...minus, ...plus);
      minus.length = 0;
      plus.length = 0;
    };
    for (let i = s; i <= e; i++) {
      const r = rows[i];
      if (r.k === "eq") {
        flushPair();
        body.push(` ${linesA[r.a]}`);
        ca++;
        cb++;
      } else {
        if (r.a >= 0) {
          minus.push(`-${linesA[r.a]}`);
          ca++;
        }
        if (r.b >= 0) {
          plus.push(`+${linesB[r.b]}`);
          cb++;
        }
      }
    }
    flushPair();
    const startA = ca ? posA[s] + 1 : posA[s];
    const startB = cb ? posB[s] + 1 : posB[s];
    out.push(`@@ -${startA}${ca === 1 ? "" : `,${ca}`} +${startB}${cb === 1 ? "" : `,${cb}`} @@`, ...body);
  }
  return out.join("\n") + "\n";
}

export const DIFF_SAMPLE_A = `Project update — Q3
Our team shipped the new billing page in August.
Customers in India can now pay with UPI.
We fixed 42 bugs and closed 18 support tickets.

Next steps:
- Launch the mobile app
- Hire two engineers
`;

export const DIFF_SAMPLE_B = `Project update — Q3
Our team shipped the new billing page in July.
Customers in India and the UAE can now pay with UPI.
We fixed 47 bugs and closed 18 support tickets.

Next steps:
- Launch the mobile app 🚀
- Hire three engineers
- Translate the help centre
`;
