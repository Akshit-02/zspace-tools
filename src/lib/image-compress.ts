/**
 * In-browser image compression.
 *
 * JPG / WebP: decoded with orientation applied, drawn to a canvas, re-encoded
 *             with the requested quality via canvas.toBlob.
 * PNG:        colour-quantised with UPNG (lossy palette reduction, like
 *             pngquant/TinyPNG), which keeps the alpha channel.
 * Results are measured from the actual output bytes. If the output is not
 * smaller than the input (and nothing else changed), the original is kept.
 */

export type OutputFormat = "original" | "webp" | "jpeg";

export interface CompressOptions {
  /** 0.1 – 1 */
  quality: number;
  format: OutputFormat;
  /** Longest side in px, or 0 for no resizing. */
  maxDimension: number;
}

export interface CompressResult {
  blob: Blob;
  type: string;
  width: number;
  height: number;
  /** True when the original file was kept because re-encoding didn't help. */
  keptOriginal: boolean;
}

import { canvasToBlob, decodeImage, dims, extensionFor, normaliseType, releaseImage, MAX_CANVAS_PIXELS, type Decoded } from "./image-utils";

export { extensionFor, normaliseType };

/**
 * Maps the 10–100 quality slider to a PNG palette size (0 = lossless).
 * Floored at 128 colours: below that the quantiser starts merging fully-opaque
 * pixels with translucent ones (visible as faded edges), while the file-size
 * benefit of smaller palettes is negligible — most of the saving comes from
 * moving to an 8-bit palette at all.
 */
export function pngColours(quality: number) {
  if (quality >= 0.98) return 0;
  return Math.round(2 ** (7 + Math.max(0, Math.min(1, quality))));
}

export async function compressImage(file: File, opts: CompressOptions): Promise<CompressResult> {
  const inType = normaliseType(file);
  if (!inType) throw new Error("Unsupported format. Use JPG, PNG or WebP.");

  let source: Decoded;
  try {
    source = await decodeImage(file);
  } catch {
    throw new Error("This image couldn't be read. It may be damaged or not a real image file.");
  }
  const { width: srcW, height: srcH } = dims(source);
  if (!srcW || !srcH) throw new Error("This image has no readable dimensions.");

  const scale = opts.maxDimension > 0 ? Math.min(1, opts.maxDimension / Math.max(srcW, srcH)) : 1;
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const resized = scale < 1;

  // Browsers cap canvas area (≈16.7 MP on iOS Safari for some versions; larger elsewhere).
  if (width * height > MAX_CANVAS_PIXELS) throw new Error("This image is too large to process in the browser. Resize it first.");

  const outType = opts.format === "original" ? inType : opts.format === "webp" ? "image/webp" : "image/jpeg";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: outType === "image/png" });
  if (!ctx) throw new Error("Your browser could not create a drawing surface.");
  if (outType === "image/jpeg") {
    // JPEG has no alpha: flatten transparency onto white instead of black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  releaseImage(source);

  let blob: Blob;
  if (outType === "image/png") {
    const { default: UPNG } = await import("upng-js");
    const data = ctx.getImageData(0, 0, width, height).data;
    const buf = UPNG.encode([data.buffer as ArrayBuffer], width, height, pngColours(opts.quality));
    blob = new Blob([buf], { type: "image/png" });
  } else {
    blob = await canvasToBlob(canvas, outType, opts.quality);
    if (blob.type !== outType) {
      throw new Error(
        `Your browser can't create ${outType === "image/webp" ? "WebP" : "JPG"} files. Choose a different output format.`,
      );
    }
  }
  canvas.width = canvas.height = 0; // release memory early

  const sameFormat = outType === inType;
  if (sameFormat && !resized && blob.size >= file.size) {
    return { blob: file, type: inType, width, height, keptOriginal: true };
  }
  return { blob, type: outType, width, height, keptOriginal: false };
}
