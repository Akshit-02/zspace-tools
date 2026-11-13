/**
 * OCR with Tesseract.js, fully on-device. The worker, the WebAssembly engine
 * and the language models are served from this site (/public/ocr, copied by
 * scripts/copy-wasm.mjs) — no CDN. Models are Tesseract's 4.0.0 "best_int"
 * LSTM models, cached by the browser after the first download.
 */
import type { Worker as TWorker } from "tesseract.js";

export const OCR_LANGS = [
  { code: "eng", label: "English", script: "Latin", mb: 2.9 },
  { code: "hin", label: "Hindi", script: "Devanagari", mb: 1.4 },
  { code: "guj", label: "Gujarati", script: "Gujarati", mb: 1.2 },
  { code: "spa", label: "Spanish", script: "Latin", mb: 2.1 },
  { code: "fra", label: "French", script: "Latin", mb: 0.7 },
  { code: "deu", label: "German", script: "Latin", mb: 1.3 },
] as const;
export type LangCode = (typeof OCR_LANGS)[number]["code"];

export type Layout = "auto" | "block" | "sparse";
const PSM: Record<Layout, string> = { auto: "3", block: "6", sparse: "11" };

let worker: Promise<TWorker> | null = null;
let current = "";
let progressCb: ((p: { status: string; progress: number }) => void) | null = null;

async function getWorker(langs: string) {
  if (!worker) {
    worker = (async () => {
      const { createWorker, OEM } = await import("tesseract.js");
      return createWorker(langs, OEM.LSTM_ONLY, {
        workerPath: "/ocr/worker.min.js",
        corePath: "/ocr/core",
        langPath: "/ocr/lang",
        gzip: true,
        workerBlobURL: false,
        logger: (m: { status: string; progress: number }) => progressCb?.(m),
        errorHandler: () => undefined,
      });
    })();
    current = langs;
    worker.catch(() => {
      worker = null;
    });
    return worker;
  }
  const w = await worker;
  if (current !== langs) {
    await w.reinitialize(langs, 1);
    current = langs;
  }
  return w;
}

export async function terminateOcr() {
  if (!worker) return;
  const w = worker;
  worker = null;
  current = "";
  try {
    await (await w).terminate();
  } catch {
    /* already gone */
  }
}

export interface OcrResult {
  text: string;
  confidence: number; // 0–100
  words: number;
  lowConfidence: number; // words under 60
  ms: number;
}

export async function recognize(canvas: HTMLCanvasElement, langs: LangCode[], layout: Layout, onProgress?: (label: string, p: number) => void): Promise<OcrResult> {
  const t0 = performance.now();
  progressCb = (m) => {
    const label = /loading|initializ/i.test(m.status) ? "Loading language data…" : /recogniz/i.test(m.status) ? "Reading text…" : m.status;
    onProgress?.(label, m.progress ?? 0);
  };
  try {
    const w = await getWorker(langs.join("+"));
    await w.setParameters({ tessedit_pageseg_mode: PSM[layout] as never, preserve_interword_spaces: "1" });
    const { data } = await w.recognize(canvas, {}, { text: true, blocks: true });
    const words = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
    return {
      text: tidy(data.text ?? ""),
      confidence: Math.round(data.confidence ?? 0),
      words: words.length,
      lowConfidence: words.filter((x) => x.confidence < 60).length,
      ms: performance.now() - t0,
    };
  } finally {
    progressCb = null;
  }
}

/** Trims trailing spaces, collapses 3+ blank lines. */
export const tidy = (s: string) =>
  s
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/* ---------------- Pre-processing (never touches the original) ---------------- */

export interface Prep {
  rotation: 0 | 90 | 180 | 270;
  crop: { x: number; y: number; w: number; h: number } | null; // in source pixels
  grayscale: boolean;
  contrast: number; // 0 = unchanged, up to 100
  scale: "auto" | 1 | 2;
}

export const DEFAULT_PREP: Prep = { rotation: 0, crop: null, grayscale: true, contrast: 0, scale: "auto" };
const MAX_PIXELS = 25_000_000;

export function prepare(src: CanvasImageSource & { width: number; height: number }, p: Prep): HTMLCanvasElement {
  const c = p.crop ?? { x: 0, y: 0, w: src.width, h: src.height };
  let k: number = p.scale === "auto" ? (Math.max(c.w, c.h) < 1400 ? 2 : 1) : p.scale;
  if (c.w * c.h * k * k > MAX_PIXELS) k = Math.sqrt(MAX_PIXELS / (c.w * c.h));
  const w = Math.max(1, Math.round(c.w * k));
  const h = Math.max(1, Math.round(c.h * k));
  const turned = p.rotation % 180 !== 0;
  const out = document.createElement("canvas");
  out.width = turned ? h : w;
  out.height = turned ? w : h;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = "high";
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.drawImage(src, c.x, c.y, c.w, c.h, -w / 2, -h / 2, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (p.grayscale || p.contrast) {
    const img = ctx.getImageData(0, 0, out.width, out.height);
    const d = img.data;
    const f = (259 * (p.contrast * 2.55 + 255)) / (255 * (259 - p.contrast * 2.55));
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];
      if (p.grayscale) r = g = b = 0.299 * r + 0.587 * g + 0.114 * b;
      if (p.contrast) {
        r = f * (r - 128) + 128;
        g = f * (g - 128) + 128;
        b = f * (b - 128) + 128;
      }
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
  }
  return out;
}

/** Editable DOCX from plain text: blank lines start new paragraphs, single newlines become line breaks. */
export async function textToDocx(text: string, title?: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const paras = text.split(/\n{2,}/).map(
    (block) =>
      new Paragraph({
        spacing: { after: 160 },
        children: block.split("\n").map((line, i) => new TextRun({ text: line, break: i ? 1 : undefined })),
      }),
  );
  const doc = new Document({ creator: "ZSpace Tools", title, sections: [{ children: paras.length ? paras : [new Paragraph("")] }] });
  return Packer.toBlob(doc);
}

/**
 * OCR returning positioned words as layout items (PDF points), so scanned
 * tables can go through the same table detection as text PDFs.
 * `pxPerPt` is the canvas pixels per PDF point used when rendering the page.
 */
export async function recognizeItems(canvas: HTMLCanvasElement, langs: LangCode[], pxPerPt: number, onProgress?: (label: string, p: number) => void) {
  progressCb = (m) => onProgress?.(/recogniz/i.test(m.status) ? "Reading text…" : "Loading language data…", m.progress ?? 0);
  try {
    const w = await getWorker(langs.join("+"));
    await w.setParameters({ tessedit_pageseg_mode: "6" as never, preserve_interword_spaces: "1" });
    const { data } = await w.recognize(canvas, {}, { blocks: true });
    const words = (data.blocks ?? []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)));
    return words
      .filter((wd) => wd.text.trim())
      .map((wd) => {
        const h = (wd.bbox.y1 - wd.bbox.y0) / pxPerPt;
        const base = wd.bbox.y1 / pxPerPt;
        return { str: wd.text, x: wd.bbox.x0 / pxPerPt, top: wd.bbox.y0 / pxPerPt, base, w: (wd.bbox.x1 - wd.bbox.x0) / pxPerPt, size: Math.max(4, h * 1.1), font: "Arial", bold: false, italic: false };
      });
  } finally {
    progressCb = null;
  }
}
