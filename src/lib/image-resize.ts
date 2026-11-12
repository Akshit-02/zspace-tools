/** Browser-side image resizing: size planning (pure) + canvas resampling. */
import { MAX_CANVAS_PIXELS, MAX_SIDE, decodeImage, dims, encodeCanvas, normaliseType, releaseImage } from "./image-utils";

export type ResizeMode = "pixels" | "percent" | "preset";
export type Fit = "cover" | "contain";
export type ResizeFormat = "original" | "image/jpeg" | "image/png" | "image/webp";

export interface Preset {
  id: string;
  label: string;
  w: number;
  h: number;
}

/** Suggested sizes — platforms change their specs, which the UI points out. */
export const PRESETS: Preset[] = [
  { id: "ig-square", label: "Instagram square", w: 1080, h: 1080 },
  { id: "ig-portrait", label: "Instagram portrait", w: 1080, h: 1350 },
  { id: "ig-story", label: "Instagram Story / Reel", w: 1080, h: 1920 },
  { id: "yt-thumb", label: "YouTube thumbnail", w: 1280, h: 720 },
  { id: "fb-cover", label: "Facebook cover", w: 820, h: 312 },
  { id: "li-post", label: "LinkedIn post", w: 1200, h: 627 },
];

export interface ResizeSettings {
  mode: ResizeMode;
  width: number | null;
  height: number | null;
  lock: boolean;
  /** Which input the user last edited while locked. */
  driver: "width" | "height";
  percent: number;
  preset: string;
  fit: Fit;
  format: ResizeFormat;
  quality: number; // 0.1–1
}

export interface Plan {
  /** Output canvas size. */
  w: number;
  h: number;
  /** Where the (whole or cropped) source is drawn. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  upscaled: boolean;
  padded: boolean;
  cropped: boolean;
}

export type PlanResult = { ok: true; plan: Plan } | { ok: false; error: string };

const clampInt = (n: number) => Math.max(1, Math.round(n));

export function planResize(srcW: number, srcH: number, s: ResizeSettings): PlanResult {
  let w: number;
  let h: number;
  let fixedBox = false; // both dimensions imposed → needs fit handling

  if (s.mode === "percent") {
    if (!(s.percent > 0)) return { ok: false, error: "Enter a percentage above 0." };
    w = clampInt((srcW * s.percent) / 100);
    h = clampInt((srcH * s.percent) / 100);
  } else if (s.mode === "preset") {
    const p = PRESETS.find((x) => x.id === s.preset);
    if (!p) return { ok: false, error: "Choose a preset." };
    w = p.w;
    h = p.h;
    fixedBox = true;
  } else if (s.lock) {
    const useWidth = s.driver === "width" ? s.width != null : s.height == null;
    if (useWidth) {
      if (!s.width || s.width < 1) return { ok: false, error: "Enter a width of at least 1 px." };
      w = Math.round(s.width);
      h = clampInt((w * srcH) / srcW);
    } else {
      if (!s.height || s.height < 1) return { ok: false, error: "Enter a height of at least 1 px." };
      h = Math.round(s.height);
      w = clampInt((h * srcW) / srcH);
    }
  } else {
    if (!s.width || !s.height || s.width < 1 || s.height < 1) return { ok: false, error: "Enter both a width and a height of at least 1 px." };
    w = Math.round(s.width);
    h = Math.round(s.height);
    fixedBox = true;
  }

  if (w > MAX_SIDE || h > MAX_SIDE) return { ok: false, error: `Each side must be ${MAX_SIDE.toLocaleString("en-US")} px or less.` };
  if (w * h > MAX_CANVAS_PIXELS) return { ok: false, error: "That size is too large for the browser to create (over 50 megapixels)." };

  let plan: Plan = { w, h, sx: 0, sy: 0, sw: srcW, sh: srcH, dx: 0, dy: 0, dw: w, dh: h, upscaled: false, padded: false, cropped: false };

  const sameShape = Math.abs(w / h - srcW / srcH) < 0.005;
  if (fixedBox && !sameShape) {
    if (s.fit === "cover") {
      // Crop the source centrally to the target aspect ratio.
      const target = w / h;
      if (srcW / srcH > target) {
        const sw = srcH * target;
        plan = { ...plan, sx: (srcW - sw) / 2, sw, cropped: true };
      } else {
        const sh = srcW / target;
        plan = { ...plan, sy: (srcH - sh) / 2, sh, cropped: true };
      }
    } else {
      const scale = Math.min(w / srcW, h / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      plan = { ...plan, dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh, padded: true };
    }
  }
  plan.upscaled = plan.dw / plan.sw > 1.001 || plan.dh / plan.sh > 1.001;
  return { ok: true, plan };
}

export interface ResizeOutput {
  blob: Blob;
  type: string;
  srcW: number;
  srcH: number;
  plan: Plan;
}

export async function resizeImage(file: File, s: ResizeSettings): Promise<ResizeOutput> {
  const inType = normaliseType(file);
  if (!inType) throw new Error("Unsupported format. Use JPG, PNG or WebP.");
  let src;
  try {
    src = await decodeImage(file);
  } catch {
    throw new Error("This image couldn't be read. It may be damaged or not a real image file.");
  }
  try {
    const { width: srcW, height: srcH } = dims(src);
    const res = planResize(srcW, srcH, s);
    if (!res.ok) throw new Error(res.error);
    const { plan } = res;
    const outType = s.format === "original" ? inType : s.format;

    const canvas = document.createElement("canvas");
    canvas.width = plan.w;
    canvas.height = plan.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not create a drawing surface.");
    if (outType === "image/jpeg") {
      ctx.fillStyle = "#ffffff"; // JPG has no transparency
      ctx.fillRect(0, 0, plan.w, plan.h);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, plan.sx, plan.sy, plan.sw, plan.sh, plan.dx, plan.dy, plan.dw, plan.dh);
    const blob = await encodeCanvas(canvas, outType, outType === "image/png" ? undefined : s.quality);
    canvas.width = canvas.height = 0;
    return { blob, type: outType, srcW, srcH, plan };
  } finally {
    releaseImage(src);
  }
}
