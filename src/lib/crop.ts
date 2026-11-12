/** Crop-rectangle geometry (pure). All values are in oriented-image pixels. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const MIN_SIZE = 8;

export interface RatioPreset {
  id: string;
  label: string;
  ratio: number | null; // width / height; null = free
  out?: { w: number; h: number }; // suggested export size
  group: "ratio" | "social";
}

/** Suggested sizes — platforms change their specs; outputs stay editable. */
export const CROP_PRESETS: RatioPreset[] = [
  { id: "free", label: "Free", ratio: null, group: "ratio" },
  { id: "1:1", label: "1:1", ratio: 1, group: "ratio" },
  { id: "4:5", label: "4:5", ratio: 4 / 5, group: "ratio" },
  { id: "3:2", label: "3:2", ratio: 3 / 2, group: "ratio" },
  { id: "4:3", label: "4:3", ratio: 4 / 3, group: "ratio" },
  { id: "16:9", label: "16:9", ratio: 16 / 9, group: "ratio" },
  { id: "9:16", label: "9:16", ratio: 9 / 16, group: "ratio" },
  { id: "ig-square", label: "Instagram square", ratio: 1, out: { w: 1080, h: 1080 }, group: "social" },
  { id: "ig-portrait", label: "Instagram portrait", ratio: 1080 / 1350, out: { w: 1080, h: 1350 }, group: "social" },
  { id: "ig-story", label: "Story / Reel", ratio: 1080 / 1920, out: { w: 1080, h: 1920 }, group: "social" },
  { id: "yt-thumb", label: "YouTube thumbnail", ratio: 1280 / 720, out: { w: 1280, h: 720 }, group: "social" },
  { id: "li-post", label: "LinkedIn post", ratio: 1200 / 627, out: { w: 1200, h: 627 }, group: "social" },
  { id: "fb-cover", label: "Facebook cover", ratio: 820 / 312, out: { w: 820, h: 312 }, group: "social" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Largest centred rect with the given ratio inside W×H (or the whole image when free). */
export function initialRect(W: number, H: number, ratio: number | null, fill = 0.9): Rect {
  if (!ratio) {
    const w = Math.round(W * fill);
    const h = Math.round(H * fill);
    return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
  }
  let w = W * fill;
  let h = w / ratio;
  if (h > H * fill) {
    h = H * fill;
    w = h * ratio;
  }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
}

/** Keeps a rect inside the image without resizing it. */
export function clampMove(r: Rect, W: number, H: number): Rect {
  const w = Math.min(r.w, W);
  const h = Math.min(r.h, H);
  return { x: Math.round(clamp(r.x, 0, W - w)), y: Math.round(clamp(r.y, 0, H - h)), w, h };
}

/** Resizes from a handle by (dx, dy), keeping the opposite edge fixed and the ratio if set. */
export function resizeRect(r: Rect, handle: Handle, dx: number, dy: number, W: number, H: number, ratio: number | null): Rect {
  const right = r.x + r.w;
  const bottom = r.y + r.h;
  if (!ratio) {
    let { x, y, w, h } = r;
    if (handle.includes("e")) w = clamp(w + dx, MIN_SIZE, W - x);
    if (handle.includes("w")) {
      x = clamp(x + dx, 0, right - MIN_SIZE);
      w = right - x;
    }
    if (handle.includes("s")) h = clamp(h + dy, MIN_SIZE, H - y);
    if (handle.includes("n")) {
      y = clamp(y + dy, 0, bottom - MIN_SIZE);
      h = bottom - y;
    }
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
  }
  const min = MIN_SIZE;
  if (handle.length === 2) {
    // Corner: the opposite corner is the anchor.
    const ax = handle.includes("e") ? r.x : right;
    const ay = handle.includes("s") ? r.y : bottom;
    const sx = handle.includes("e") ? 1 : -1;
    const sy = handle.includes("s") ? 1 : -1;
    let w = Math.abs(dx) * r.h >= Math.abs(dy) * r.w ? r.w + sx * dx : (r.h + sy * dy) * ratio;
    const maxW = Math.min(sx > 0 ? W - ax : ax, (sy > 0 ? H - ay : ay) * ratio);
    w = clamp(w, Math.max(min, min * ratio), maxW);
    const h = w / ratio;
    return { x: Math.round(sx > 0 ? ax : ax - w), y: Math.round(sy > 0 ? ay : ay - h), w: Math.round(w), h: Math.round(h) };
  }
  // Edge: grow along one axis, keep the other axis centred.
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  if (handle === "e" || handle === "w") {
    const ax = handle === "e" ? r.x : right;
    let w = handle === "e" ? r.w + dx : r.w - dx;
    const maxW = Math.min(handle === "e" ? W - ax : ax, 2 * Math.min(cy, H - cy) * ratio);
    w = clamp(w, min, maxW);
    const h = w / ratio;
    return { x: Math.round(handle === "e" ? ax : ax - w), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) };
  }
  const ay = handle === "s" ? r.y : bottom;
  let h = handle === "s" ? r.h + dy : r.h - dy;
  const maxH = Math.min(handle === "s" ? H - ay : ay, (2 * Math.min(cx, W - cx)) / ratio);
  h = clamp(h, min, maxH);
  const w = h * ratio;
  return { x: Math.round(cx - w / 2), y: Math.round(handle === "s" ? ay : ay - h), w: Math.round(w), h: Math.round(h) };
}

/** Applies a new ratio to an existing rect, keeping its centre where possible. */
export function applyRatio(r: Rect, ratio: number | null, W: number, H: number): Rect {
  if (!ratio) return r;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const area = r.w * r.h;
  let w = Math.sqrt(area * ratio);
  let h = w / ratio;
  if (w > W) {
    w = W;
    h = w / ratio;
  }
  if (h > H) {
    h = H;
    w = h * ratio;
  }
  return clampMove({ x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w: Math.round(w), h: Math.round(h) }, W, H);
}

/** Dimensions after rotating by a multiple of 90°. */
export const orientedSize = (w: number, h: number, rotation: number) => (rotation % 180 === 0 ? { w, h } : { w: h, h: w });
