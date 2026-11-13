/**
 * Layout analysis for PDF → Word. Pure functions over positioned text items
 * (PDF points, origin top-left) — no DOM, no pdf.js — so they can be unit-tested.
 *
 * Pipeline per page: items → lines → (two-column split) → segments → tables
 * → paragraphs (with headings, alignment, indents) → blocks ordered by position.
 */

export interface Item {
  str: string;
  x: number; // left
  top: number; // top of the glyph box
  base: number; // baseline (top + ascent)
  w: number;
  size: number; // font size in pt
  font: string; // family for Word
  bold: boolean;
  italic: boolean;
}

export interface Run {
  text: string;
  size: number;
  font: string;
  bold: boolean;
  italic: boolean;
}

export interface Line {
  items: Item[];
  x: number;
  right: number;
  top: number;
  base: number;
  size: number;
}

export type Align = "left" | "center" | "right" | "justify";

export interface ParaBlock {
  kind: "para";
  top: number;
  bottom: number;
  runs: Run[];
  align: Align;
  heading: 0 | 1 | 2 | 3;
  indent: number; // pt from the content's left edge
  firstLine: number; // pt, may be negative (hanging)
  spaceBefore: number; // pt
  size: number;
  /** Horizontal extent of the text column this paragraph sits in (pt). */
  left: number;
  right: number;
}
export interface TableBlock {
  kind: "table";
  top: number;
  bottom: number;
  left: number;
  rows: Run[][][]; // row → cell → runs
  widths: number[]; // pt per column
}
export interface ImageBlock {
  kind: "image";
  top: number;
  bottom: number;
  id: number;
  x: number;
  w: number;
  h: number;
  align: Align;
  spaceBefore: number;
}
export type Block = ParaBlock | TableBlock | ImageBlock;

export interface PageImageRef {
  id: number;
  x: number;
  top: number;
  w: number;
  h: number;
}

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

/** Body text size: the size covering the most characters. */
export function bodySize(items: Item[]) {
  const tally = new Map<number, number>();
  for (const it of items) {
    const k = Math.round(it.size * 2) / 2;
    tally.set(k, (tally.get(k) ?? 0) + it.str.length);
  }
  let best = 11;
  let n = -1;
  for (const [k, v] of tally) if (v > n) [best, n] = [k, v];
  return best;
}

/** Groups items into lines by baseline, then orders each line left → right. */
export function toLines(items: Item[]): Line[] {
  const sorted = [...items].filter((i) => i.str.length).sort((a, b) => a.base - b.base || a.x - b.x);
  const lines: Line[] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    const tol = Math.max(1.5, 0.4 * Math.min(it.size, last?.size ?? it.size));
    if (last && Math.abs(it.base - last.base) <= tol) {
      last.items.push(it);
      last.x = Math.min(last.x, it.x);
      last.right = Math.max(last.right, it.x + it.w);
      last.top = Math.min(last.top, it.top);
      last.size = Math.max(last.size, it.size);
    } else lines.push({ items: [it], x: it.x, right: it.x + it.w, top: it.top, base: it.base, size: it.size });
  }
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines;
}

/** Splits a line where the horizontal gap is large (table cells, tab stops). */
export function segments(line: Line, gapFactor = 2): Item[][] {
  const out: Item[][] = [[line.items[0]]];
  for (let i = 1; i < line.items.length; i++) {
    const prev = line.items[i - 1];
    const it = line.items[i];
    const gap = it.x - (prev.x + prev.w);
    if (gap > Math.max(gapFactor * it.size, 14)) out.push([it]);
    else out[out.length - 1].push(it);
  }
  return out;
}

/** Turns items into styled runs, inserting spaces where glyph gaps imply one and merging same-style neighbours. */
export function toRuns(items: Item[]): Run[] {
  const runs: Run[] = [];
  let prev: Item | null = null;
  for (const it of items) {
    let text = it.str;
    if (prev) {
      const gap = it.x - (prev.x + prev.w);
      if (gap > 0.18 * it.size && !/\s$/.test(prev.str) && !/^\s/.test(text)) text = " " + text;
    }
    const last = runs[runs.length - 1];
    const size = Math.round(it.size * 2) / 2;
    if (last && last.bold === it.bold && last.italic === it.italic && last.font === it.font && last.size === size) last.text += text;
    else runs.push({ text, size, font: it.font, bold: it.bold, italic: it.italic });
    prev = it;
  }
  return runs;
}

/** Finds a vertical gutter splitting the page into two text columns, if there is one. */
export function findGutter(lines: Line[], box: Box): number | null {
  if (lines.length < 8) return null;
  const width = box.right - box.left;
  let best: { x: number; crossed: number } | null = null;
  for (let f = 0.35; f <= 0.65; f += 0.01) {
    const x = box.left + width * f;
    let crossed = 0;
    let left = 0;
    let right = 0;
    for (const l of lines) {
      const crosses = l.items.some((it) => it.x < x - 2 && it.x + it.w > x + 2);
      if (crosses) crossed++;
      else {
        if (l.items.some((it) => it.x + it.w <= x)) left++;
        if (l.items.some((it) => it.x >= x)) right++;
      }
    }
    if (left >= lines.length * 0.3 && right >= lines.length * 0.3 && crossed <= lines.length * 0.15 && (!best || crossed < best.crossed)) best = { x, crossed };
  }
  if (!best) return null;
  // Columns of prose, not a table: text on each side of the gutter should be reasonably long.
  const sideLen = (side: "l" | "r") =>
    median(
      lines
        .map((l) => l.items.filter((it) => (side === "l" ? it.x + it.w <= best!.x : it.x >= best!.x)).map((it) => it.str).join(""))
        .filter((t) => t.trim())
        .map((t) => t.length),
    );
  if (sideLen("l") < 18 || sideLen("r") < 18) return null;
  // Require a real band of whitespace (≥ 10 pt) around the gutter.
  const near = lines.flatMap((l) => l.items).filter((it) => !(it.x < best!.x - 2 && it.x + it.w > best!.x + 2));
  const leftEdge = Math.max(...near.filter((it) => it.x + it.w <= best!.x).map((it) => it.x + it.w), -Infinity);
  const rightEdge = Math.min(...near.filter((it) => it.x >= best!.x).map((it) => it.x), Infinity);
  return rightEdge - leftEdge >= 10 ? (leftEdge + rightEdge) / 2 : null;
}

interface Region {
  lines: Line[];
  box: Box;
}

function regionBox(lines: Line[], fallback: Box): Box {
  if (!lines.length) return fallback;
  return { left: Math.min(...lines.map((l) => l.x)), right: Math.max(...lines.map((l) => l.right)), top: Math.min(...lines.map((l) => l.top)), bottom: Math.max(...lines.map((l) => l.base)) };
}

/** Detects runs of ≥2 consecutive lines whose cell starts line up into ≥2 columns. */
function detectTables(lines: Line[]): { start: number; end: number; anchors: number[] }[] {
  const segs = lines.map((l) => segments(l));
  const found: { start: number; end: number; anchors: number[] }[] = [];
  let i = 0;
  while (i < lines.length) {
    if (segs[i].length < 2) {
      i++;
      continue;
    }
    let anchors = segs[i].map((s) => s[0].x);
    let j = i + 1;
    while (j < lines.length && segs[j].length >= 2) {
      const tol = Math.max(6, lines[j].size);
      const starts = segs[j].map((s) => s[0].x);
      const matched = starts.filter((x) => anchors.some((a) => Math.abs(a - x) <= tol)).length;
      // Rows may leave cells empty, but most of their cells must sit on known columns.
      if (matched < Math.max(2, Math.ceil(starts.length * 0.6))) break;
      const gap = lines[j].top - lines[j - 1].base;
      if (gap > lines[j].size * 2.2) break;
      for (const x of starts) if (!anchors.some((a) => Math.abs(a - x) <= tol)) anchors.push(x);
      j++;
    }
    if (j - i >= 2) {
      anchors = [...anchors].sort((a, b) => a - b).filter((a, k, arr) => k === 0 || a - arr[k - 1] > 6);
      found.push({ start: i, end: j, anchors });
      i = j;
    } else i++;
  }
  return found;
}

function tableBlock(lines: Line[], anchors: number[], right: number): TableBlock {
  const rows = lines.map((l) => {
    const cells: Item[][] = anchors.map(() => []);
    for (const seg of segments(l)) {
      let col = 0;
      for (let k = 0; k < anchors.length; k++) if (seg[0].x >= anchors[k] - Math.max(6, l.size)) col = k;
      cells[col].push(...seg);
    }
    return cells.map((c) => toRuns(c));
  });
  const edges = [...anchors, right];
  return { kind: "table", top: lines[0].top, bottom: lines[lines.length - 1].base, left: anchors[0], rows, widths: anchors.map((a, k) => Math.max(20, edges[k + 1] - a)) };
}

const endsSentence = (s: string) => /[.!?:;。]["')\]]?\s*$/.test(s);
const bulletStart = (s: string) => /^\s*([•◦▪●○■\-–—*]|\(?\d{1,3}[.)]|\(?[a-zA-Z][.)])\s+/.test(s);

function paragraphs(lines: Line[], box: Box, body: number, pageW: number): ParaBlock[] {
  const width = box.right - box.left;
  const out: ParaBlock[] = [];
  let cur: Line[] = [];
  const flush = () => {
    if (!cur.length) return;
    const first = cur[0];
    const runs: Run[] = [];
    cur.forEach((l, k) => {
      const lineRuns = toRuns(l.items);
      if (k > 0 && runs.length) {
        const last = runs[runs.length - 1];
        // Soft hyphens mark a word broken across lines; a visible "-" may be a real compound (well-known), so it's kept.
        if (/\u00AD$/.test(last.text)) last.text = last.text.slice(0, -1);
        else if (/[A-Za-z]-$/.test(last.text) && /^[a-z]/.test(lineRuns[0]?.text ?? "")) {
          /* join without a space */
        } else if (!/\s$/.test(last.text)) last.text += " ";
      }
      for (const r of lineRuns) {
        const prev = runs[runs.length - 1];
        if (prev && prev.bold === r.bold && prev.italic === r.italic && prev.font === r.font && prev.size === r.size) prev.text += r.text;
        else runs.push({ ...r });
      }
    });
    const size = median(cur.map((l) => l.size));
    const lefts = cur.map((l) => l.x);
    const rights = cur.map((l) => l.right);
    const leftGap = Math.min(...lefts) - box.left;
    const rightGap = box.right - Math.max(...rights);
    let align: Align = "left";
    // Centred on the text block or on the page (a short centred line rarely spans the block).
    const centred = (l: Line) => Math.abs(l.x - box.left - (box.right - l.right)) < Math.max(6, width * 0.03) || Math.abs((l.x + l.right) / 2 - pageW / 2) < Math.max(6, pageW * 0.025);
    if (cur.every(centred) && leftGap > width * 0.08) align = "center";
    else if (rightGap < size && leftGap > width * 0.25 && cur.every((l) => Math.abs(box.right - l.right) < size)) align = "right";
    else if (cur.length >= 2 && cur.slice(0, -1).every((l) => box.right - l.right < size * 1.2) && rightGap < size * 1.2) align = "justify";
    const otherLeft = cur.length > 1 ? median(lefts.slice(1)) : first.x;
    const text = runs.map((r) => r.text).join("").trim();
    const allBold = runs.every((r) => r.bold || !r.text.trim());
    let heading: ParaBlock["heading"] = 0;
    if (text.length <= 160 && cur.length <= 3) {
      if (size >= body * 1.6) heading = 1;
      else if (size >= body * 1.3) heading = 2;
      else if (size >= body * 1.12 || (allBold && text.length <= 80 && !endsSentence(text) && cur.length === 1 && !bulletStart(text))) heading = 3;
    }
    out.push({
      kind: "para",
      top: first.top,
      bottom: cur[cur.length - 1].base,
      runs: runs.map((r, k) => (k === runs.length - 1 ? { ...r, text: r.text.replace(/\s+$/, "") } : r)).filter((r) => r.text),
      align,
      heading,
      indent: align === "left" || align === "justify" ? Math.max(0, Math.min(otherLeft, first.x) - box.left) : 0,
      firstLine: cur.length > 1 ? first.x - otherLeft : 0,
      spaceBefore: 0,
      size,
      left: box.left,
      right: box.right,
    });
    cur = [];
  };
  for (const l of lines) {
    const prev = cur[cur.length - 1];
    if (prev) {
      const lead = l.base - prev.base;
      const sizeChange = Math.abs(l.size - prev.size) > Math.max(1, prev.size * 0.15);
      const bigGap = lead > Math.max(prev.size, l.size) * 1.75;
      const shortPrev = prev.right < box.right - Math.max(prev.size * 6, (box.right - box.left) * 0.15) && endsSentence(prev.items.map((i) => i.str).join(""));
      const newBullet = bulletStart(l.items[0].str);
      const outdent = l.x < prev.x - prev.size * 1.5 && cur.length > 1;
      // A line indented past the paragraph's flush-left lines starts a new (first-line-indented) paragraph.
      const indentStart = cur.length > 1 && l.x > prev.x + l.size * 1.2;
      if (sizeChange || bigGap || shortPrev || newBullet || outdent || indentStart) flush();
    }
    cur.push(l);
  }
  flush();
  return out;
}

/**
 * Lays out one page: returns blocks in reading order and the content box
 * (used for margins). `images` are already positioned in page points.
 */
export function analyzePage(items: Item[], images: PageImageRef[], pageW: number, pageH: number): { blocks: Block[]; box: Box; body: number } {
  const page: Box = { left: 0, right: pageW, top: 0, bottom: pageH };
  const lines = toLines(items);
  const body = bodySize(items);
  const all = [...lines.map((l) => ({ left: l.x, right: l.right, top: l.top, bottom: l.base })), ...images.map((i) => ({ left: i.x, right: i.x + i.w, top: i.top, bottom: i.top + i.h }))];
  const box: Box = all.length
    ? { left: Math.max(0, Math.min(...all.map((b) => b.left))), right: Math.min(pageW, Math.max(...all.map((b) => b.right))), top: Math.max(0, Math.min(...all.map((b) => b.top))), bottom: Math.min(pageH, Math.max(...all.map((b) => b.bottom))) }
    : page;

  // Columns: header lines above the column area, then left column, right column, then the rest.
  const gutter = findGutter(lines, box);
  let regions: Region[];
  if (gutter !== null) {
    const crosses = (l: Line) => l.items.some((it) => it.x < gutter - 2 && it.x + it.w > gutter + 2);
    const spanning = lines.filter(crosses);
    const colItems = lines.filter((l) => !crosses(l)).flatMap((l) => l.items);
    const leftCol = toLines(colItems.filter((it) => it.x + it.w / 2 < gutter));
    const rightCol = toLines(colItems.filter((it) => it.x + it.w / 2 >= gutter));
    const colTop = Math.min(...[...leftCol, ...rightCol].map((l) => l.top));
    const header = spanning.filter((l) => l.base <= colTop);
    const footer = spanning.filter((l) => l.base > colTop);
    regions = [
      { lines: header, box },
      { lines: leftCol, box: { ...regionBox(leftCol, box), left: box.left } },
      { lines: rightCol, box: { ...regionBox(rightCol, box), right: box.right } },
      { lines: footer, box },
    ].filter((r) => r.lines.length);
  } else regions = [{ lines, box }];

  const blocks: Block[] = [];
  for (const r of regions) {
    const tables = detectTables(r.lines);
    let i = 0;
    const regionBlocks: Block[] = [];
    for (const t of [...tables, { start: r.lines.length, end: r.lines.length, anchors: [] }]) {
      if (t.start > i) regionBlocks.push(...paragraphs(r.lines.slice(i, t.start), r.box, body, pageW));
      if (t.end > t.start) regionBlocks.push(tableBlock(r.lines.slice(t.start, t.end), t.anchors, r.box.right));
      i = t.end;
    }
    blocks.push(...regionBlocks);
  }

  // Images join the flow by vertical position (within the column order for multi-column pages).
  for (const im of images) {
    const centre = Math.abs(im.x + im.w / 2 - pageW / 2) < Math.max(10, pageW * 0.04);
    const blk: ImageBlock = { kind: "image", id: im.id, top: im.top, bottom: im.top + im.h, x: im.x, w: im.w, h: im.h, align: centre ? "center" : im.x - box.left > (box.right - box.left) * 0.4 ? "right" : "left", spaceBefore: 0 };
    const idx = blocks.findIndex((b) => b.top > im.top + 1 && (gutter === null || (im.x < gutter) === (("x" in b ? (b as ImageBlock).x : 0) < gutter) || b.kind !== "image"));
    if (idx < 0) blocks.push(blk);
    else blocks.splice(idx, 0, blk);
  }

  // Vertical spacing from the gap to the previous block (same column), capped.
  let prevBottom = box.top;
  for (const b of blocks) {
    const gap = b.top - prevBottom;
    const space = Math.max(0, Math.min(48, gap - (b.kind === "para" ? b.size * 0.35 : 0)));
    if (b.kind === "para" || b.kind === "image") b.spaceBefore = prevBottom === box.top ? 0 : Math.round(space);
    prevBottom = Math.max(b.bottom, b.top);
    if (b.bottom < b.top) prevBottom = b.top;
  }
  return { blocks, box, body };
}

/* ---------------- Fonts ---------------- */

const KNOWN: [RegExp, string][] = [
  [/times|tinos|liberation ?serif|nimbus ?rom/i, "Times New Roman"],
  [/arial|helvetica|arimo|liberation ?sans|nimbus ?san/i, "Arial"],
  [/courier|cousine|liberation ?mono|nimbus ?mon/i, "Courier New"],
  [/calibri|carlito/i, "Calibri"],
  [/cambria|caladea/i, "Cambria"],
  [/georgia/i, "Georgia"],
  [/verdana/i, "Verdana"],
  [/garamond/i, "Garamond"],
  [/segoe ?ui/i, "Segoe UI"],
  [/tahoma/i, "Tahoma"],
  [/trebuchet/i, "Trebuchet MS"],
  [/roboto/i, "Roboto"],
  [/open ?sans/i, "Open Sans"],
  [/lato/i, "Lato"],
];

/** Maps an embedded PDF font name to a font family Word users are likely to have. */
export function wordFont(pdfName: string, generic: string): string {
  const raw = pdfName.replace(/^[A-Z]{6}\+/, "");
  if (!raw) return /mono/i.test(generic) ? "Courier New" : /serif/i.test(generic) && !/sans/i.test(generic) ? "Times New Roman" : "Arial";
  for (const [re, name] of KNOWN) if (re.test(raw)) return name;
  const family = raw
    .split(/[-,_]/)[0]
    .replace(/(MT|PS|Std|Pro)$/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  if (family && /^[A-Za-z][A-Za-z ]{1,30}$/.test(family) && !/^(f|font|t|tt)\d*$/i.test(family)) return family;
  return /mono/i.test(generic) ? "Courier New" : /serif/i.test(generic) && !/sans/i.test(generic) ? "Times New Roman" : "Arial";
}

export const isBoldName = (n: string) => /bold|black|heavy|semibold|demi/i.test(n.replace(/^[A-Z]{6}\+/, ""));
export const isItalicName = (n: string) => /italic|oblique|it$|-it\b/i.test(n.replace(/^[A-Z]{6}\+/, ""));
