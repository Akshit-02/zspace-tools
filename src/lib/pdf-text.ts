/**
 * Text helpers shared by PDF exporters (Editor, Sign, Excel to PDF).
 * - Standard 14 fonts for Latin text (no embedding, small files).
 * - Noto Sans (embedded subset, SIL OFL) for other characters such as ₹ or Cyrillic.
 * - Scripts pdf-lib cannot shape (Devanagari, Gujarati, Arabic, Thai…) are drawn
 *   by the browser onto a canvas and embedded as an image, so they still look right.
 */
import type { PDFDocument, PDFFont } from "pdf-lib";

export type Family = "sans" | "serif" | "mono";

/** Characters that need complex shaping (pdf-lib can't do this). */
const COMPLEX = /[֐-ࣿऀ-෿฀-໿ༀ-࿿က-႟ក-៿יִ-﷿ﹰ-﻿]/;
export const needsShaping = (s: string) => COMPLEX.test(s);

/** CSS font stacks metric-compatible with the PDF standard fonts. */
export const CSS_FAMILY: Record<Family, string> = {
  sans: "Helvetica, Arial, 'Liberation Sans', sans-serif",
  serif: "'Times New Roman', Times, 'Liberation Serif', serif",
  mono: "'Courier New', Courier, 'Liberation Mono', monospace",
};

/** Ascent/descent (em) of the metric-compatible fonts, used to place baselines like CSS does. */
export const METRICS: Record<Family, { asc: number; desc: number }> = {
  sans: { asc: 0.905, desc: 0.212 },
  serif: { asc: 0.891, desc: 0.216 },
  mono: { asc: 0.833, desc: 0.3 },
};
export const LINE_HEIGHT = 1.25;

/** Offset from a line box's top to its baseline, matching CSS half-leading. */
export const baselineOffset = (family: Family, size: number) => {
  const m = METRICS[family];
  return ((LINE_HEIGHT - (m.asc + m.desc)) / 2 + m.asc) * size;
};

let measureCtx: CanvasRenderingContext2D | null = null;
/** Browser text width (pt) with the same metrics as the PDF standard fonts. */
export function measure(text: string, size: number, family: Family, bold = false) {
  if (typeof document === "undefined") return text.length * size * 0.55;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  measureCtx!.font = `${bold ? "bold " : ""}${size}px ${CSS_FAMILY[family]}`;
  return measureCtx!.measureText(text).width;
}

/** Greedy word wrap into lines that fit `width`; honours explicit newlines. */
export function wrap(text: string, width: number, widthOf: (s: string) => number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/(\s+)/)) {
      const next = line + word;
      if (line.trim() && widthOf(next.trimEnd()) > width && word.trim()) {
        out.push(line.trimEnd());
        line = word.trimStart();
      } else line = next;
      // A single word longer than the line: break it by characters.
      while (widthOf(line.trimEnd()) > width && line.trim().length > 1) {
        let k = line.length - 1;
        while (k > 1 && widthOf(line.slice(0, k)) > width) k--;
        out.push(line.slice(0, k));
        line = line.slice(k);
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

export interface FontSet {
  pick(family: Family, bold: boolean, text: string): Promise<PDFFont>;
}

export type FontLoader = (bold: boolean) => Promise<Uint8Array>;
const fetchNoto: FontLoader = async (bold) => {
  const res = await fetch(`/fonts/pdf/NotoSans-${bold ? "Bold" : "Regular"}.ttf`);
  if (!res.ok) throw new Error("font-unavailable");
  return new Uint8Array(await res.arrayBuffer());
};

/** Lazily embeds fonts into `doc`; standard fonts first, Noto Sans when a character isn't in WinAnsi. */
export function fontSet(doc: PDFDocument, loadNoto: FontLoader = fetchNoto): FontSet {
  const cache = new Map<string, Promise<PDFFont>>();
  const get = (key: string, make: () => Promise<PDFFont>) => {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key)!;
  };
  return {
    async pick(family, bold, text) {
      const { StandardFonts } = await import("pdf-lib");
      const std = family === "serif" ? (bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman) : family === "mono" ? (bold ? StandardFonts.CourierBold : StandardFonts.Courier) : bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
      const f = await get(std, () => doc.embedFont(std));
      try {
        f.encodeText(text);
        return f;
      } catch {
        return get(`noto-${bold}`, async () => {
          const fontkit = (await import("@pdf-lib/fontkit")).default;
          doc.registerFontkit(fontkit);
          return doc.embedFont(await loadNoto(bold), { subset: true });
        });
      }
    },
  };
}

/** Draws text with the browser (any script) into a transparent PNG. Returns size in pt. */
export async function textToPng(lines: string[], size: number, family: Family, bold: boolean, color: string, width: number) {
  const k = 4; // render at 4× for print sharpness
  const lh = size * LINE_HEIGHT;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(width * k));
  c.height = Math.max(1, Math.ceil(lh * lines.length * k));
  const ctx = c.getContext("2d")!;
  ctx.scale(k, k);
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.font = `${bold ? "bold " : ""}${size}px ${CSS_FAMILY[family]}`;
  lines.forEach((l, i) => ctx.fillText(l, 0, i * lh + baselineOffset(family, size)));
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  c.width = c.height = 0;
  if (!blob) throw new Error("text-render-failed");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height: lh * lines.length };
}

/** "#rrggbb" → pdf-lib rgb() components 0–1. */
export function hexToRgb01(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
