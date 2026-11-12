/** Colour conversion, palettes and WCAG contrast. RGB (0–255 integers) is the source of truth. */

export interface RGB {
  r: number;
  g: number;
  b: number;
}
export interface HSL {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function parseHex(input: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

export const toHex = ({ r, g, b }: RGB) => `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/** Accepts "rgb(240, 120, 69)", "240,120,69" or "240 120 69". */
export function parseRgb(input: string): RGB | null {
  const m = /^\s*(?:rgba?\s*\()?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?\s*$/i.exec(input);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map(Number);
  return [r, g, b].every((v) => v <= 255) ? { r, g, b } : null;
}

/** Accepts "hsl(18, 85%, 61%)", "18, 85%, 61%" or "18 85 61". */
export function parseHsl(input: string): HSL | null {
  const m = /^\s*(?:hsla?\s*\()?\s*(-?\d+(?:\.\d+)?)(?:deg)?\s*[,\s]\s*(\d+(?:\.\d+)?)%?\s*[,\s]\s*(\d+(?:\.\d+)?)%?\s*\)?\s*$/i.exec(input);
  if (!m) return null;
  const h = ((Number(m[1]) % 360) + 360) % 360;
  const s = Number(m[2]);
  const l = Number(m[3]);
  return s <= 100 && l <= 100 ? { h, s, l } : null;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === R) h = 60 * (((G - B) / d) % 6);
    else if (max === G) h = 60 * ((B - R) / d + 2);
    else h = 60 * ((R - G) / d + 4);
  }
  return { h: round1((h + 360) % 360), s: round1(s * 100), l: round1(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = L - c / 2;
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
}

export const formatRgb = ({ r, g, b }: RGB) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = (c: RGB) => {
  const { h, s, l } = rgbToHsl(c);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
};

export type Harmony = "complementary" | "analogous" | "triadic" | "split" | "tetradic" | "monochromatic";

export const HARMONIES: { id: Harmony; label: string; hint: string }[] = [
  { id: "complementary", label: "Complementary", hint: "Opposite on the colour wheel (180°) — maximum contrast." },
  { id: "analogous", label: "Analogous", hint: "Neighbours at ±30° — calm and cohesive." },
  { id: "triadic", label: "Triadic", hint: "Three hues evenly spaced at 120° — balanced and vibrant." },
  { id: "split", label: "Split complementary", hint: "The complement's neighbours (150° and 210°) — contrast with less tension." },
  { id: "tetradic", label: "Tetradic", hint: "Four hues at 90° — rich, best with one dominant colour." },
  { id: "monochromatic", label: "Monochromatic", hint: "One hue at different lightness — simple and elegant." },
];

const rotate = (c: RGB, deg: number) => {
  const hsl = rgbToHsl(c);
  return hslToRgb({ ...hsl, h: (hsl.h + deg + 360) % 360 });
};

export function palette(base: RGB, kind: Harmony): RGB[] {
  switch (kind) {
    case "complementary":
      return [base, rotate(base, 180)];
    case "analogous":
      return [rotate(base, -30), base, rotate(base, 30)];
    case "triadic":
      return [base, rotate(base, 120), rotate(base, 240)];
    case "split":
      return [base, rotate(base, 150), rotate(base, 210)];
    case "tetradic":
      return [base, rotate(base, 90), rotate(base, 180), rotate(base, 270)];
    case "monochromatic": {
      const { h, s } = rgbToHsl(base);
      return [20, 35, 50, 65, 80].map((l) => hslToRgb({ h, s, l }));
    }
  }
}

const mix = (a: RGB, b: RGB, t: number): RGB => ({ r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t) });

/** 5 tints (toward white), the colour, 5 shades (toward black), light → dark. */
export function tintsAndShades(c: RGB): RGB[] {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 0, g: 0, b: 0 };
  const steps = [0.15, 0.3, 0.45, 0.6, 0.75];
  return [...steps.slice().reverse().map((t) => mix(c, white, t)), c, ...steps.map((t) => mix(c, black, t))];
}

/** WCAG 2.x relative luminance (sRGB). */
export function luminance({ r, g, b }: RGB) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: RGB, b: RGB) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function wcag(ratio: number) {
  // Compare against thresholds without rounding up (4.49:1 fails AA).
  return { aaNormal: ratio >= 4.5, aaLarge: ratio >= 3, aaaNormal: ratio >= 7, aaaLarge: ratio >= 4.5, ui: ratio >= 3 };
}

/** Readable text colour on top of `c`. */
export const textOn = (c: RGB) => (contrastRatio(c, { r: 37, g: 37, b: 37 }) >= contrastRatio(c, { r: 255, g: 255, b: 255 }) ? "#252525" : "#FFFFFF");

export function randomColor(): RGB {
  const v = new Uint8Array(3);
  crypto.getRandomValues(v);
  return { r: v[0], g: v[1], b: v[2] };
}

/** Strict validation for colours read from a share link (?c=f07845). */
export function fromShareParam(value: string | null): RGB | null {
  if (!value || !/^[0-9a-f]{6}$/i.test(value)) return null;
  return parseHex(value);
}

/* ------------------------------------------------------------------ */
/* Alpha support (HEX 4/8 digits, rgba(), hsla())                      */
/* ------------------------------------------------------------------ */

export interface ColorA {
  rgb: RGB;
  a: number; // 0–1, two decimals
}

const roundA = (a: number) => Math.round(clamp(a, 0, 1) * 100) / 100;

/** #RGB, #RGBA, #RRGGBB or #RRGGBBAA. */
export function parseHexA(input: string): ColorA | null {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
  if (!m) return null;
  const h = m[1].length <= 4 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return {
    rgb: { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) },
    a: h.length === 8 ? roundA(parseInt(h.slice(6, 8), 16) / 255) : 1,
  };
}

/** #RRGGBB when opaque, #RRGGBBAA otherwise. */
export const toHexA = (c: RGB, a: number) => (a >= 1 ? toHex(c) : toHex(c) + Math.round(clamp(a, 0, 1) * 255).toString(16).padStart(2, "0").toUpperCase());

function parseAlpha(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  const pct = raw.endsWith("%");
  const v = Number(pct ? raw.slice(0, -1) : raw);
  if (!Number.isFinite(v) || v < 0 || (pct ? v > 100 : v > 1)) return null;
  return roundA(pct ? v / 100 : v);
}

const NUM = String.raw`(-?\d+(?:\.\d+)?)`;
const SEP = String.raw`\s*[,\s]\s*`;
const ALPHA = String.raw`(?:\s*[,/]\s*(\d*\.?\d+%?))?`;

/** rgb()/rgba() with commas or spaces, optional alpha ("/ 0.5", ", 50%"); also bare "240, 120, 69". */
export function parseRgbA(input: string): ColorA | null {
  const m = new RegExp(String.raw`^\s*(?:rgba?\s*\()?\s*${NUM}${SEP}${NUM}${SEP}${NUM}${ALPHA}\s*\)?\s*$`, "i").exec(input);
  if (!m) return null;
  const [r, g, b] = [m[1], m[2], m[3]].map(Number);
  if (![r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) return null;
  const a = parseAlpha(m[4]);
  return a === null ? null : { rgb: { r, g, b }, a };
}

/** hsl()/hsla() with commas or spaces, optional alpha. */
export function parseHslA(input: string): ColorA | null {
  const m = new RegExp(String.raw`^\s*(?:hsla?\s*\()?\s*${NUM}(?:deg)?${SEP}(\d+(?:\.\d+)?)%?${SEP}(\d+(?:\.\d+)?)%?${ALPHA}\s*\)?\s*$`, "i").exec(input);
  if (!m) return null;
  const h = ((Number(m[1]) % 360) + 360) % 360;
  const s = Number(m[2]);
  const l = Number(m[3]);
  if (s > 100 || l > 100) return null;
  const a = parseAlpha(m[4]);
  return a === null ? null : { rgb: hslToRgb({ h, s, l }), a };
}

export const formatRgbA = (c: RGB, a: number) => (a >= 1 ? formatRgb(c) : `rgba(${c.r}, ${c.g}, ${c.b}, ${roundA(a)})`);
export const formatHslA = (c: RGB, a: number) => {
  if (a >= 1) return formatHsl(c);
  const { h, s, l } = rgbToHsl(c);
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${roundA(a)})`;
};

/** Tailwind-style step names for the 11 tints & shades (index 5 = the colour itself). */
export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Palette as CSS custom properties. Opaque colours only (alpha applies to the base). */
export function paletteCss(base: RGB, a: number, pal: RGB[], shades: RGB[], prefix = "color") {
  const lines = [`:root {`, `  --${prefix}-base: ${toHexA(base, a)};`];
  pal.forEach((c, i) => lines.push(`  --${prefix}-harmony-${i + 1}: ${toHex(c)};`));
  shades.forEach((c, i) => lines.push(`  --${prefix}-${SHADE_STEPS[i]}: ${toHex(c)};`));
  lines.push(`}`);
  return lines.join("\n") + "\n";
}

/** Strict share-link parsing that also accepts an alpha byte (?c=f0784580). */
export function fromShareParamA(value: string | null): ColorA | null {
  if (!value || !/^([0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return null;
  return parseHexA(value);
}
