/**
 * Watermarks, page numbers, headers and footers as overlay objects. The same
 * objects drive the on-screen preview and the exported PDF (pdf-overlay.ts),
 * so what you see is where it's written. Pure — no DOM — apart from the text
 * width function passed in.
 */
import { textHeight, type OverlayObject } from "./pdf-overlay";
import type { Family } from "./pdf-text";

export interface PageSize {
  w: number;
  h: number;
}

/* ---------------- Page scope ---------------- */

export type Scope = "all" | "first" | "last" | "odd" | "even" | "range";

/** 0-based page indexes for a scope. `range` uses 1-based text like "1-3, 7". */
export function scopePages(scope: Scope, range: string, total: number): number[] | { error: string } {
  const all = Array.from({ length: total }, (_, i) => i);
  switch (scope) {
    case "all":
      return all;
    case "first":
      return total ? [0] : [];
    case "last":
      return total ? [total - 1] : [];
    case "odd":
      return all.filter((i) => i % 2 === 0);
    case "even":
      return all.filter((i) => i % 2 === 1);
    case "range": {
      const out = new Set<number>();
      const parts = range.split(",").map((p) => p.trim()).filter(Boolean);
      if (!parts.length) return { error: "Enter pages, for example 1-3, 7." };
      for (const p of parts) {
        const m = /^(\d+)(?:\s*-\s*(\d+|end))?$/i.exec(p);
        if (!m) return { error: `“${p}” isn't a page or range. Use numbers like 2 or 4-9.` };
        const a = Number(m[1]);
        const b = m[2] ? (m[2].toLowerCase() === "end" ? total : Number(m[2])) : a;
        if (a < 1 || b < 1 || a > total || b > total) return { error: `This PDF has ${total} page${total === 1 ? "" : "s"}; “${p}” is outside that.` };
        if (b < a) return { error: `“${p}” runs backwards — write it as ${b}-${a}.` };
        for (let i = a; i <= b; i++) out.add(i - 1);
      }
      return [...out].sort((x, y) => x - y);
    }
  }
}

/* ---------------- Numbers ---------------- */

export function roman(n: number) {
  if (n <= 0 || n >= 4000) return String(n);
  const map: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

export type NumStyle = "1" | "01" | "page" | "page-of" | "slash" | "I" | "i";
export const NUM_STYLES: { value: NumStyle; label: string }[] = [
  { value: "1", label: "1, 2, 3" },
  { value: "01", label: "01, 02, 03" },
  { value: "page", label: "Page 1" },
  { value: "page-of", label: "Page 1 of 10" },
  { value: "slash", label: "1 / 10" },
  { value: "I", label: "I, II, III" },
  { value: "i", label: "i, ii, iii" },
];

export function formatNumber(n: number, total: number, style: NumStyle, prefix = "", suffix = "") {
  const digits = Math.max(2, String(total).length);
  const core =
    style === "01" ? String(n).padStart(digits, "0") : style === "page" ? `Page ${n}` : style === "page-of" ? `Page ${n} of ${total}` : style === "slash" ? `${n} / ${total}` : style === "I" ? roman(n) : style === "i" ? roman(n).toLowerCase() : String(n);
  return `${prefix}${core}${suffix}`;
}

/* ---------------- Placement ---------------- */

export type Pos = "tl" | "tc" | "tr" | "ml" | "c" | "mr" | "bl" | "bc" | "br";
export const POSITIONS: { value: Pos; label: string }[] = [
  { value: "tl", label: "Top left" },
  { value: "tc", label: "Top centre" },
  { value: "tr", label: "Top right" },
  { value: "ml", label: "Middle left" },
  { value: "c", label: "Centre" },
  { value: "mr", label: "Middle right" },
  { value: "bl", label: "Bottom left" },
  { value: "bc", label: "Bottom centre" },
  { value: "br", label: "Bottom right" },
];
const hAlign = (p: Pos) => (p[1] === "l" || p === "ml" ? "left" : p[1] === "r" || p === "mr" ? "right" : "center");
const vAlign = (p: Pos) => (p[0] === "t" ? "top" : p[0] === "b" ? "bottom" : "middle");

/** Top-left of a w×h box at a 9-way position with a margin (display points). */
export function place(page: PageSize, w: number, h: number, pos: Pos, margin: number) {
  const ha = hAlign(pos);
  const va = vAlign(pos);
  return {
    x: ha === "left" ? margin : ha === "right" ? page.w - margin - w : (page.w - w) / 2,
    y: va === "top" ? margin : va === "bottom" ? page.h - margin - h : (page.h - h) / 2,
    align: ha as "left" | "center" | "right",
  };
}

/* ---------------- Watermark ---------------- */

export interface Watermark {
  kind: "text" | "image";
  text: string;
  family: Family;
  bold: boolean;
  size: number; // pt (text)
  color: string;
  opacity: number; // 0–1
  rotation: number; // degrees clockwise
  pos: Pos | "custom";
  cx: number; // custom centre, fraction of page width
  cy: number;
  margin: number;
  tile: boolean;
  gap: number; // tile spacing, pt
  // image
  image?: { src: string; bytes: Uint8Array; mime: "image/png" | "image/jpeg"; width: number; height: number };
  scale: number; // image width as a fraction of page width
}

export const WATERMARK_PRESETS = ["CONFIDENTIAL", "DRAFT", "SAMPLE", "INTERNAL USE ONLY", "COPY"];

/** Rotated bounding box of a w×h rectangle. */
const rotatedBox = (w: number, h: number, deg: number) => {
  const t = (Math.abs(deg) * Math.PI) / 180;
  return { w: Math.abs(w * Math.cos(t)) + Math.abs(h * Math.sin(t)), h: Math.abs(w * Math.sin(t)) + Math.abs(h * Math.cos(t)) };
};

export function watermarkObjects(wm: Watermark, pages: PageSize[], indexes: number[], widthOf: (s: string, size: number, family: Family, bold: boolean) => number): OverlayObject[] {
  const out: OverlayObject[] = [];
  for (const i of indexes) {
    const page = pages[i];
    if (!page) continue;
    let w: number;
    let h: number;
    const base: Partial<OverlayObject> = { page: i, rot: wm.rotation, opacity: wm.opacity, color: wm.color };
    if (wm.kind === "text") {
      if (!wm.text.trim()) continue;
      w = widthOf(wm.text, wm.size, wm.family, wm.bold) * 1.02 + 2;
      h = textHeight(1, wm.size);
      Object.assign(base, { kind: "text", text: wm.text, size: wm.size, family: wm.family, bold: wm.bold, align: "center" });
    } else {
      if (!wm.image) continue;
      w = page.w * wm.scale;
      h = (w * wm.image.height) / wm.image.width;
      Object.assign(base, { kind: "image", src: wm.image.src, bytes: wm.image.bytes, mime: wm.image.mime });
    }
    const rb = rotatedBox(w, h, wm.rotation);
    if (wm.tile) {
      const stepX = rb.w + wm.gap;
      const stepY = rb.h + wm.gap;
      for (let row = 0, y = -stepY / 2; y < page.h + stepY / 2; row++, y += stepY) {
        const shift = row % 2 ? stepX / 2 : 0;
        for (let x = -stepX / 2 + shift; x < page.w + stepX / 2; x += stepX) out.push({ ...(base as OverlayObject), id: `wm-${i}-${out.length}`, x: x - w / 2 + stepX / 2, y: y - h / 2 + stepY / 2, w, h });
      }
      continue;
    }
    let cx: number;
    let cy: number;
    if (wm.pos === "custom") {
      cx = wm.cx * page.w;
      cy = wm.cy * page.h;
    } else {
      // Place the rotated footprint inside the margins, then centre the object in it.
      const p = place(page, rb.w, rb.h, wm.pos, wm.margin);
      cx = p.x + rb.w / 2;
      cy = p.y + rb.h / 2;
    }
    // Stable ids so a dragged watermark stays the same object between renders.
    out.push({ ...(base as OverlayObject), id: `wm-${i}`, x: cx - w / 2, y: cy - h / 2, w, h });
  }
  return out;
}

/* ---------------- Page numbers, header and footer ---------------- */

export interface Numbering {
  pos: Pos;
  style: NumStyle;
  prefix: string;
  suffix: string;
  start: number; // number shown on the first numbered page
  skip: number; // leave this many pages at the start un-numbered
  scope: Scope;
  range: string;
  family: Family;
  bold: boolean;
  size: number;
  color: string;
  opacity: number;
  margin: number;
  header: string;
  headerAlign: "left" | "center" | "right";
  footer: string;
  footerAlign: "left" | "center" | "right";
  title: string; // for {title}
  date: string; // for {date}
}

const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(title|date|page|total|file)\}/g, (_, k) => vars[k] ?? "");

/** Which pages get numbers, and the number each shows. */
export function numberPlan(n: Numbering, total: number): { pages: { index: number; num: number }[]; count: number } | { error: string } {
  const scope = scopePages(n.scope, n.range, total);
  if ("error" in scope) return scope;
  const pages = scope.filter((i) => i >= n.skip).map((index, k) => ({ index, num: n.start + k }));
  return { pages, count: pages.length };
}

export function numberObjects(n: Numbering, sizes: PageSize[], file: string, widthOf: (s: string, size: number, family: Family, bold: boolean) => number): OverlayObject[] | { error: string } {
  const plan = numberPlan(n, sizes.length);
  if ("error" in plan) return plan;
  const out: OverlayObject[] = [];
  const total = plan.count ? plan.pages[plan.pages.length - 1].num : 0;
  const make = (page: number, text: string, pos: Pos, align?: "left" | "center" | "right", tag = "n"): OverlayObject | null => {
    if (!text.trim()) return null;
    const size = sizes[page];
    const w = widthOf(text, n.size, n.family, n.bold) * 1.02 + 2;
    const h = textHeight(1, n.size);
    const p = place(size, w, h, pos, n.margin);
    return { id: `pn-${page}-${tag}`, kind: "text", page, x: p.x, y: p.y, w, h, rot: 0, color: n.color, opacity: n.opacity, text, size: n.size, family: n.family, bold: n.bold, align: align ?? p.align };
  };
  for (const { index, num } of plan.pages) {
    const o = make(index, formatNumber(num, total, n.style, n.prefix, n.suffix), n.pos);
    if (o) out.push(o);
  }
  // Header and footer text go on the numbered pages.
  const vars = (page: number, num: number) => ({ title: n.title, date: n.date, file, page: String(num), total: String(total) });
  for (const { index, num } of plan.pages) {
    const posFor = (row: "t" | "b", a: "left" | "center" | "right") => (`${row}${a === "left" ? "l" : a === "right" ? "r" : "c"}` as Pos);
    const hdr = make(index, fill(n.header, vars(index, num)), posFor("t", n.headerAlign), undefined, "h");
    const ftr = make(index, fill(n.footer, vars(index, num)), posFor("b", n.footerAlign), undefined, "f");
    // Don't stack text on top of the page number if they share a corner.
    for (const extra of [hdr, ftr]) {
      if (!extra) continue;
      const clash = out.find((o) => o.page === index && Math.abs(o.y - extra.y) < 1 && o.x < extra.x + extra.w && extra.x < o.x + o.w);
      if (clash) extra.y += extra.y < sizes[index].h / 2 ? extra.h + 2 : -(extra.h + 2);
      out.push(extra);
    }
  }
  return out;
}
