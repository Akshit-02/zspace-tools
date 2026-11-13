/**
 * Table extraction for PDF → Excel. Works on positioned text items (from pdf.js,
 * or OCR word boxes for scans). Pure functions — no DOM — so they're unit-tested.
 *
 * 1. Lines are split into cells at gaps wider than about one character.
 * 2. Runs of multi-cell lines form a table block; its column boundaries come
 *    from the most common row shape, so a wide header can't merge columns.
 * 3. Every line's cells are assigned to columns by horizontal overlap.
 * 4. Wrapped lines (first column empty, few cells, tight spacing) are joined
 *    into the row above — e.g. long descriptions in bank statements.
 * 5. Tables that continue on the next page with the same columns are joined,
 *    dropping the repeated header.
 */
import { toLines, type Item, type Line } from "./pdf-layout";
import { looksNumeric } from "./cell-values";

export interface ExtractedTable {
  page: number; // 1-based, first page of the table
  pages: number[];
  rows: string[][];
  header: boolean;
  cols: number;
}

export interface PageText {
  page: number;
  items: Item[];
  w: number;
  h: number;
}

interface Seg {
  x0: number;
  x1: number;
  text: string;
  bold: boolean;
}

/** Splits a line into cells where the gap is wider than ~one character. */
export function cellsOf(line: Line): Seg[] {
  const out: Seg[] = [];
  let cur: Seg | null = null;
  let prevEnd = -Infinity;
  for (const it of line.items) {
    const gap = it.x - prevEnd;
    const space = /\s$/.test(cur?.text ?? "") || /^\s/.test(it.str);
    if (!cur || gap > Math.max(0.9 * it.size, 5)) {
      if (cur) out.push(cur);
      cur = { x0: it.x, x1: it.x + it.w, text: it.str.trim(), bold: it.bold };
    } else {
      cur.text += (gap > 0.18 * it.size && !space ? " " : "") + it.str;
      cur.text = cur.text.replace(/\s+/g, " ");
      cur.x1 = Math.max(cur.x1, it.x + it.w);
      cur.bold &&= it.bold;
    }
    prevEnd = it.x + it.w;
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text);
}

interface Block {
  lines: Line[];
  segs: Seg[][];
}

function blocks(lines: Line[]): Block[] {
  const segs = lines.map(cellsOf);
  const out: Block[] = [];
  let cur: Block | null = null;
  let singles = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const s = segs[i];
    const prev = cur?.lines[cur.lines.length - 1];
    const gapOk = prev ? l.base - prev.base <= Math.max(prev.size, l.size) * 2.6 : true;
    if (s.length >= 2 && gapOk) {
      if (!cur) cur = { lines: [], segs: [] };
      cur.lines.push(l);
      cur.segs.push(s);
      singles = 0;
    } else if (cur && s.length === 1 && gapOk && singles === 0) {
      // A single-cell line inside a table may be a wrapped cell — keep it for now.
      cur.lines.push(l);
      cur.segs.push(s);
      singles++;
    } else {
      if (cur) out.push(cur);
      cur = s.length >= 2 ? { lines: [l], segs: [s] } : null;
      singles = 0;
    }
  }
  if (cur) out.push(cur);
  // Drop a trailing single-cell line (likely text after the table).
  for (const b of out) {
    while (b.segs.length && b.segs[b.segs.length - 1].length === 1) {
      b.segs.pop();
      b.lines.pop();
    }
  }
  return out.filter((b) => b.segs.filter((s) => s.length >= 2).length >= 2);
}

/**
 * Column spans by interval clustering: cells are added narrowest first; a cell
 * overlapping one column widens it, overlapping none starts a new column, and
 * one spanning several columns (a merged header) is ignored for the layout.
 */
function columns(b: Block): [number, number][] {
  const cells = b.segs.filter((r) => r.length >= 2).flat().sort((a, z) => a.x1 - a.x0 - (z.x1 - z.x0));
  let spans: [number, number][] = [];
  for (const c of cells) {
    const hits = spans.map((sp, i) => (c.x0 < sp[1] + 1 && c.x1 > sp[0] - 1 ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 0) spans.push([c.x0, c.x1]);
    else if (hits.length === 1) spans[hits[0]] = [Math.min(spans[hits[0]][0], c.x0), Math.max(spans[hits[0]][1], c.x1)];
  }
  spans.sort((a, z) => a[0] - z[0]);
  // Widening can make neighbours touch; merge any that now overlap.
  const merged: [number, number][] = [];
  for (const sp of spans) {
    const last = merged[merged.length - 1];
    if (last && sp[0] < last[1] - 1) last[1] = Math.max(last[1], sp[1]);
    else merged.push([...sp]);
  }
  spans = merged;
  return spans;
}

function assign(segs: Seg[], spans: [number, number][]): string[] {
  const row = spans.map(() => "");
  for (const s of segs) {
    let best = 0;
    let score = -Infinity;
    spans.forEach(([a, z], k) => {
      const overlap = Math.min(z, s.x1) - Math.max(a, s.x0);
      const dist = -Math.abs((a + z) / 2 - (s.x0 + s.x1) / 2);
      const v = overlap > 0 ? overlap : dist - 1000;
      if (v > score) [best, score] = [k, v];
    });
    row[best] = row[best] ? `${row[best]} ${s.text}` : s.text;
  }
  return row;
}

export function pageTables(items: Item[], page: number): ExtractedTable[] {
  const lines = toLines(items.filter((i) => i.str.trim()));
  const out: ExtractedTable[] = [];
  for (const b of blocks(lines)) {
    const spans = columns(b);
    const rows: string[][] = [];
    const bold: boolean[] = [];
    b.lines.forEach((l, i) => {
      const row = assign(b.segs[i], spans);
      const filled = row.filter(Boolean).length;
      const prev = rows[rows.length - 1];
      const tight = i > 0 && l.base - b.lines[i - 1].base <= l.size * 1.45;
      // Wrapped continuation: first column empty, few cells, close to the line above.
      if (prev && tight && !row[0] && filled <= Math.max(1, Math.floor(spans.length / 2)) && !row.some((c, k) => c && looksNumeric(c) && !prev[k])) {
        row.forEach((c, k) => c && (prev[k] = prev[k] ? `${prev[k]} ${c}` : c));
        return;
      }
      rows.push(row);
      bold.push(b.segs[i].every((s) => s.bold));
    });
    if (rows.length < 2) continue;
    const first = rows[0];
    const numericBelow = rows.slice(1).some((r) => r.some((c) => c && looksNumeric(c)));
    const header = bold[0] || (first.every((c) => !c || !looksNumeric(c)) && numericBelow);
    out.push({ page, pages: [page], rows, header, cols: spans.length });
  }
  return out;
}

const sameHeader = (a: string[], b: string[]) => a.length === b.length && a.every((c, i) => c.toLowerCase() === b[i].toLowerCase());

/** Extracts tables from every page and joins tables that continue across pages. */
export function extractTables(pages: PageText[]): ExtractedTable[] {
  const all = pages.flatMap((p) => pageTables(p.items, p.page));
  const out: ExtractedTable[] = [];
  for (const t of all) {
    const prev = out[out.length - 1];
    const continues = prev && t.page === prev.pages[prev.pages.length - 1] + 1 && t.cols === prev.cols && (sameHeader(t.rows[0], prev.rows[0]) || (!t.header && prev.header));
    if (continues) {
      prev.rows.push(...(sameHeader(t.rows[0], prev.rows[0]) ? t.rows.slice(1) : t.rows));
      prev.pages.push(t.page);
    } else out.push({ ...t, pages: [...t.pages], rows: t.rows.map((r) => [...r]) });
  }
  return out;
}

/** Fallback: every text line of each page as a spreadsheet row (cells split at wide gaps). */
export function pageRows(items: Item[]): string[][] {
  const lines = toLines(items.filter((i) => i.str.trim()));
  if (!lines.length) return [];
  const all = lines.map(cellsOf);
  // Page-wide column anchors so cells line up across rows.
  const starts = all.flat().map((s) => s.x0).sort((a, b) => a - b);
  const anchors: number[] = [];
  for (const x of starts) if (!anchors.length || x - anchors[anchors.length - 1] > 12) anchors.push(x);
  return all.map((segs) => {
    const row: string[] = new Array(anchors.length).fill("");
    for (const s of segs) {
      let k = 0;
      for (let i = 0; i < anchors.length; i++) if (s.x0 >= anchors[i] - 6) k = i;
      row[k] = row[k] ? `${row[k]} ${s.text}` : s.text;
    }
    while (row.length && !row[row.length - 1]) row.pop();
    return row;
  });
}

export const tableSize = (t: { rows: string[][] }) => ({ rows: t.rows.length, cols: Math.max(0, ...t.rows.map((r) => r.length)) });
