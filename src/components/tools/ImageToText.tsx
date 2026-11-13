"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crop, Download, Eraser, FileText, Loader2, RotateCcw, RotateCw, ScanText, X } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, DropZone, FieldLabel, Notice, Panel, ProgressBar, Range, Segmented, Toggle } from "./ui";
import { DEFAULT_PREP, OCR_LANGS, prepare, recognize, textToDocx, type LangCode, type Layout, type OcrResult, type Prep } from "@/lib/ocr";
import { sniff } from "@/lib/image-convert";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_BYTES = limits.imageMaxMB * 1024 * 1024;
const nf = new Intl.NumberFormat("en-US");

interface Loaded {
  file: File;
  bitmap: HTMLCanvasElement; // decoded original, never modified
  url: string; // preview of the original (PNG rendering for TIFF)
}

async function load(file: File): Promise<Loaded> {
  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const kind = sniff(head);
  if (!kind || kind === "heic" || kind === "avif") {
    throw new Error(kind ? `${kind.toUpperCase()} images aren't supported for OCR yet. Convert it to JPG or PNG with the Image Converter first.` : "This doesn't look like a supported image (JPG, PNG, WebP, BMP, GIF or TIFF).");
  }
  const canvas = document.createElement("canvas");
  if (kind === "tiff") {
    const UTIF = (await import("utif")).default;
    const buf = await file.arrayBuffer();
    const ifds = UTIF.decode(buf);
    if (!ifds.length) throw new Error("This TIFF file couldn't be read.");
    UTIF.decodeImage(buf, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    if (!canvas.width || !canvas.height) throw new Error("This TIFF file couldn't be read.");
    canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(rgba), canvas.width, canvas.height), 0, 0);
  } else {
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      throw new Error("This image couldn't be opened. It may be damaged or in a format your browser can't read.");
    }
    if (bmp.width * bmp.height > 60_000_000) {
      bmp.close();
      throw new Error("This image is too large to process in the browser.");
    }
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0);
    bmp.close();
  }
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  return { file, bitmap: canvas, url: kind === "tiff" && blob ? URL.createObjectURL(blob) : URL.createObjectURL(file) };
}

export default function ImageToText() {
  const [img, setImg] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [langs, setLangs] = useState<LangCode[]>(["eng"]);
  const [layout, setLayout] = useState<Layout>("auto");
  const [prep, setPrep] = useState<Prep>(DEFAULT_PREP);
  const [showPrepared, setShowPrepared] = useState(false);
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<{ label: string; p: number } | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [text, setText] = useState("");
  const [cropping, setCropping] = useState(false);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [rotatedUrl, setRotatedUrl] = useState<string | null>(null);

  useEffect(() => {
    track("tool_opened", { tool: "image-to-text" });
  }, []);
  useEffect(() => () => void (img && URL.revokeObjectURL(img.url)), [img]);

  // Preview of the original at the chosen rotation (downscaled; display only).
  useEffect(() => {
    if (!img || prep.rotation === 0) return;
    const k = Math.min(1, 1600 / Math.max(img.bitmap.width, img.bitmap.height));
    const w = Math.round(img.bitmap.width * k);
    const h = Math.round(img.bitmap.height * k);
    const c = document.createElement("canvas");
    const turned = prep.rotation % 180 !== 0;
    c.width = turned ? h : w;
    c.height = turned ? w : h;
    const ctx = c.getContext("2d")!;
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((prep.rotation * Math.PI) / 180);
    ctx.drawImage(img.bitmap, -w / 2, -h / 2, w, h);
    let url = "";
    c.toBlob((b) => {
      if (b) setRotatedUrl((url = URL.createObjectURL(b)));
      c.width = c.height = 0;
    }, "image/jpeg", 0.9);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [img, prep.rotation]);

  // Processed preview (what OCR will actually read).
  useEffect(() => {
    if (!img || !showPrepared) return;
    const c = prepare(img.bitmap, prep);
    let url = "";
    c.toBlob((b) => {
      if (!b) return;
      url = URL.createObjectURL(b);
      setPreparedUrl(url);
    }, "image/png");
    c.width = c.height = 0;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [img, prep, showPrepared]);

  const open = async (files: File[]) => {
    const file = files[0];
    setError(null);
    if (!file) return;
    if (file.size === 0) return setError(`${file.name} is empty.`);
    if (file.size > MAX_BYTES) return setError(`${file.name} is ${formatBytes(file.size)}. Your file is larger than the current processing limit of ${limits.imageMaxMB} MB.`);
    try {
      const l = await load(file);
      setImg(l);
      setPrep(DEFAULT_PREP);
      setResult(null);
      setText("");
      setShowPrepared(false);
      track("file_uploaded", { tool: "image-to-text", file_count: 1, size_bucket: sizeBucket(file.size) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "This image couldn't be opened.");
    }
  };

  const run = async () => {
    if (!img || !langs.length) return;
    setError(null);
    setResult(null);
    setStatus({ label: "Preparing image…", p: 0 });
    const canvas = prepare(img.bitmap, prep);
    try {
      const r = await recognize(canvas, langs, layout, (label, p) => setStatus({ label, p }));
      setResult(r);
      setText(r.text);
      track("content_generated", { tool: "image-to-text", format: langs.join("+"), count: r.words });
    } catch {
      setError("Text extraction failed. If you're offline, the language data couldn't be downloaded — check your connection and try again.");
    } finally {
      canvas.width = canvas.height = 0;
      setStatus(null);
    }
  };

  const toggleLang = (c: LangCode) =>
    setLangs((cur) => (cur.includes(c) ? (cur.length > 1 ? cur.filter((x) => x !== c) : cur) : cur.length >= 3 ? cur : [...cur, c]));

  // Crop by dragging on the preview; stored in source pixels of the un-rotated image.
  const rel = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return { x: u, y: v };
  };
  const finishCrop = () => {
    if (!drag || !img) return;
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const w = Math.abs(drag.x1 - drag.x0);
    const h = Math.abs(drag.y1 - drag.y0);
    if (w > 0.02 && h > 0.02) {
      const W = img.bitmap.width;
      const H = img.bitmap.height;
      // Undo the display rotation so the crop is stored in original-image pixels.
      const rot = prep.rotation;
      const [sx, sy, sw, sh] = rot === 90 ? [y, 1 - x - w, h, w] : rot === 180 ? [1 - x - w, 1 - y - h, w, h] : rot === 270 ? [1 - y - h, x, h, w] : [x, y, w, h];
      setPrep((p) => ({ ...p, crop: { x: Math.round(sx * W), y: Math.round(sy * H), w: Math.round(sw * W), h: Math.round(sh * H) } }));
    }
    setDrag(null);
    setCropping(false);
  };
  const cropBox = useMemo(() => {
    if (drag) return { left: Math.min(drag.x0, drag.x1), top: Math.min(drag.y0, drag.y1), width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0) };
    if (prep.crop && img) {
      const x = prep.crop.x / img.bitmap.width;
      const y = prep.crop.y / img.bitmap.height;
      const w = prep.crop.w / img.bitmap.width;
      const h = prep.crop.h / img.bitmap.height;
      const r = prep.rotation;
      const [l, t, cw, ch] = r === 90 ? [1 - y - h, x, h, w] : r === 180 ? [1 - x - w, 1 - y - h, w, h] : r === 270 ? [y, 1 - x - w, h, w] : [x, y, w, h];
      return { left: l, top: t, width: cw, height: ch };
    }
    return null;
  }, [drag, prep.crop, prep.rotation, img]);

  if (!img)
    return (
      <div className="grid gap-4">
        <DropZone accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/tiff,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tif,.tiff" onFiles={open} title="Drop an image with text" subtitle="photo, screenshot or scan — read on your device" formats={["JPG", "PNG", "WebP", "BMP", "TIFF", `up to ${limits.imageMaxMB} MB`]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const busy = !!status;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium" title={img.file.name}>
            {img.file.name}{" "}
            <span className="font-mono text-xs font-normal text-ink-2">
              · {nf.format(img.bitmap.width)}×{nf.format(img.bitmap.height)} · {formatBytes(img.file.size)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              setImg(null);
              setResult(null);
              setText("");
              setError(null);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Another image
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button type="button" aria-label="Rotate left" onClick={() => setPrep((p) => ({ ...p, rotation: (((p.rotation + 270) % 360) as Prep["rotation"]) }))} className="grid size-9 place-items-center rounded-[8px] border border-line-strong hover:border-charcoal">
            <RotateCcw className="size-4" />
          </button>
          <button type="button" aria-label="Rotate right" onClick={() => setPrep((p) => ({ ...p, rotation: (((p.rotation + 90) % 360) as Prep["rotation"]) }))} className="grid size-9 place-items-center rounded-[8px] border border-line-strong hover:border-charcoal">
            <RotateCw className="size-4" />
          </button>
          <button type="button" aria-pressed={cropping} onClick={() => setCropping((c) => !c)} disabled={showPrepared} className={clsx("inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-3 text-sm disabled:opacity-40", cropping ? "border-orange bg-orange-wash" : "border-line-strong hover:border-charcoal")}>
            <Crop aria-hidden className="size-4" /> {cropping ? "Drag over the text…" : "Crop"}
          </button>
          {prep.crop && (
            <button type="button" onClick={() => setPrep((p) => ({ ...p, crop: null }))} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2">
              <X aria-hidden className="size-3.5" /> Clear crop
            </button>
          )}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showPrepared} onChange={(e) => setShowPrepared(e.target.checked)} className="size-4 accent-[#F07845]" />
            Show what OCR reads
          </label>
        </div>

        <div className="mt-3 grid place-items-center rounded-[12px] border border-line bg-ivory p-2">
          {showPrepared && preparedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preparedUrl} alt="Processed image used for OCR" className="max-h-[520px] max-w-full object-contain" data-testid="ocr-prepared" />
          ) : (
            <div
              ref={frame}
              className={clsx("relative inline-block max-w-full touch-none select-none", cropping && "cursor-crosshair")}
              onPointerDown={(e) => {
                if (!cropping) return;
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                const p = rel(e);
                setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
              }}
              onPointerMove={(e) => drag && setDrag({ ...drag, ...((p) => ({ x1: p.x, y1: p.y }))(rel(e)) })}
              onPointerUp={finishCrop}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={prep.rotation ? (rotatedUrl ?? img.url) : img.url} alt="Original image" draggable={false} className="block max-h-[520px] max-w-full object-contain" />
              {cropBox && <div aria-hidden className="pointer-events-none absolute border-2 border-orange bg-orange/10 shadow-[0_0_0_9999px_rgba(37,37,37,0.35)]" style={{ left: `${cropBox.left * 100}%`, top: `${cropBox.top * 100}%`, width: `${cropBox.width * 100}%`, height: `${cropBox.height * 100}%` }} />}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-ink-2">Rotation, crop and enhancements only affect a copy used for reading — your original image isn&apos;t changed.</p>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-5 sm:p-6">
          <FieldLabel>Language{langs.length > 1 ? "s" : ""} in the image</FieldLabel>
          <div role="group" aria-label="OCR languages" className="flex flex-wrap gap-1.5">
            {OCR_LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                aria-pressed={langs.includes(l.code)}
                onClick={() => toggleLang(l.code)}
                className={clsx("h-9 rounded-full border px-3.5 text-sm transition-colors", langs.includes(l.code) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-2">Pick up to three. Each language downloads once (about 1–3 MB) from this site, then stays cached in your browser.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Layout</FieldLabel>
              <Segmented
                label="Layout"
                size="sm"
                value={layout}
                onChange={(v) => setLayout(v as Layout)}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "block", label: "One block" },
                  { value: "sparse", label: "Sparse" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Upscale</FieldLabel>
              <Segmented
                label="Upscale"
                size="sm"
                value={String(prep.scale)}
                onChange={(v) => setPrep((p) => ({ ...p, scale: v === "auto" ? "auto" : (Number(v) as 1 | 2) }))}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "1", label: "1×" },
                  { value: "2", label: "2×" },
                ]}
              />
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Toggle checked={prep.grayscale} onChange={(v) => setPrep((p) => ({ ...p, grayscale: v }))} label="Greyscale" />
            <div className="rounded-[12px] border border-line px-4 py-2.5">
              <div className="flex items-baseline justify-between text-sm">
                <label htmlFor="ocr-contrast">Contrast</label>
                <span className="font-mono">+{prep.contrast}</span>
              </div>
              <Range id="ocr-contrast" label="Contrast" min={0} max={80} value={prep.contrast} onChange={(v) => setPrep((p) => ({ ...p, contrast: v }))} />
            </div>
          </div>

          {busy ? (
            <div className="mt-5" role="status" aria-live="polite">
              <ProgressBar value={status!.p * 100} label={status!.label} showLabel />
            </div>
          ) : (
            <button type="button" onClick={run} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34]">
              <ScanText aria-hidden className="size-4" /> {result ? "Extract again" : "Extract text"}
            </button>
          )}
          {error && (
            <div className="mt-3">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </Panel>

        {(result || text) && (
          <div className="flex min-h-[320px] flex-col overflow-hidden rounded-[16px] border border-line bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
              <label htmlFor="ocr-text" className="text-sm font-bold">
                Extracted text
              </label>
              <div className="flex flex-wrap gap-1.5">
                <CopyButton text={() => text} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "image-to-text" })} />
                <button type="button" disabled={!text} onClick={() => downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${baseName(img.file.name)}.txt`)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                  <Download aria-hidden className="size-3.5" /> TXT
                </button>
                <button
                  type="button"
                  disabled={!text}
                  onClick={async () => {
                    downloadBlob(await textToDocx(text, baseName(img.file.name)), `${baseName(img.file.name)}.docx`);
                    track("download_clicked", { tool: "image-to-text", format: "docx" });
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35"
                >
                  <FileText aria-hidden className="size-3.5" /> DOCX
                </button>
                <button type="button" onClick={() => setText("")} disabled={!text} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                  <Eraser aria-hidden className="size-3.5" /> Clear
                </button>
              </div>
            </div>
            <textarea id="ocr-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[260px] flex-1 resize-y bg-transparent px-4 py-3 text-[0.98rem] leading-relaxed outline-none" spellCheck={false} />
            {result && (
              <p className="border-t border-line px-4 py-2 font-mono text-xs text-ink-2" data-testid="ocr-stats" aria-live="polite">
                {nf.format(words)} words · confidence {result.confidence}%{result.lowConfidence ? ` · ${result.lowConfidence} uncertain word${result.lowConfidence === 1 ? "" : "s"}` : ""} · {(result.ms / 1000).toFixed(1)} s
              </p>
            )}
            {result && result.words === 0 && (
              <p className="px-4 pb-3 text-sm text-[#8a5a10]">No text was found. Try cropping to the text, rotating it upright, adding contrast, or choosing the right language.</p>
            )}
            {result && result.words > 0 && result.confidence < 70 && (
              <p className="px-4 pb-3 text-sm text-[#8a5a10]">Low confidence — check the result carefully. Blurry, handwritten or low-contrast text is often misread.</p>
            )}
          </div>
        )}
        {busy && !result && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Loader2 aria-hidden className="size-4 animate-spin" /> The first run downloads the OCR engine (about 4 MB) and language data.
          </p>
        )}
      </div>
    </div>
  );
}
