"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Crop, Download, FlipHorizontal2, FlipVertical2, Link2, Loader2, RotateCcw, RotateCw, Unlink, X, ZoomIn, ZoomOut } from "lucide-react";
import { clsx } from "clsx";
import { DownloadButton, DropZone, FieldLabel, Metric, Notice, Panel, Range, Segmented } from "./ui";
import { CROP_PRESETS, clampMove, initialRect, orientedSize, resizeRect, type Handle, type Rect } from "@/lib/crop";
import { IMAGE_ACCEPT, MAX_CANVAS_PIXELS, MAX_SIDE, decodeImage, dims, encodeCanvas, extensionFor, normaliseType, releaseImage, type Decoded } from "@/lib/image-utils";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { track } from "@/lib/analytics";

type Format = "image/jpeg" | "image/png" | "image/webp";
interface Source {
  file: File;
  bitmap: Decoded;
  url: string;
  w: number;
  h: number;
}
const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const cursor: Record<Handle, string> = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize" };
const handlePos: Record<Handle, string> = {
  nw: "-left-1.5 -top-1.5",
  n: "left-1/2 -top-1.5 -translate-x-1/2",
  ne: "-right-1.5 -top-1.5",
  e: "-right-1.5 top-1/2 -translate-y-1/2",
  se: "-right-1.5 -bottom-1.5",
  s: "left-1/2 -bottom-1.5 -translate-x-1/2",
  sw: "-left-1.5 -bottom-1.5",
  w: "-left-1.5 top-1/2 -translate-y-1/2",
};

export default function ImageCropper() {
  const [src, setSrc] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [presetId, setPresetId] = useState("free");
  const [ratio, setRatio] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 1, h: 1 });
  const [outW, setOutW] = useState<string>("");
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState("#ffffff");
  const [zoom, setZoom] = useState(1);
  const [boxW, setBoxW] = useState(640);
  const [result, setResult] = useState<{ blob: Blob; url: string; w: number; h: number; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | Handle; sx: number; sy: number; start: Rect } | null>(null);

  const O = src ? orientedSize(src.w, src.h, rotation) : { w: 1, h: 1 };
  const fit = Math.min(boxW / O.w, 560 / O.h, 1);
  const scale = fit * zoom;

  useEffect(() => {
    track("tool_opened", { tool: "image-cropper" });
  }, []);
  useEffect(
    () => () => {
      if (src) {
        URL.revokeObjectURL(src.url);
        releaseImage(src.bitmap);
      }
    },
    [src],
  );
  useEffect(() => () => void (result && URL.revokeObjectURL(result.url)), [result]);
  useLayoutEffect(() => {
    const el = stage.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(Math.max(200, el.clientWidth - 32)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [src]);

  const load = async (files: File[]) => {
    const file = files[0];
    setError(null);
    if (!file) return;
    const type = normaliseType(file);
    if (!type) return setError("Choose a JPG, PNG or WebP image.");
    if (file.size > limits.imageMaxMB * 1024 * 1024) return setError(`That image is ${formatBytes(file.size)}. The limit is ${limits.imageMaxMB} MB.`);
    try {
      const bitmap = await decodeImage(file);
      const { width, height } = dims(bitmap);
      if (width * height > MAX_CANVAS_PIXELS) {
        releaseImage(bitmap);
        return setError("That image is over 50 megapixels — too large to crop reliably in a browser. Resize it first.");
      }
      setSrc({ file, bitmap, url: URL.createObjectURL(file), w: width, h: height });
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setPresetId("free");
      setRatio(null);
      setRect(initialRect(width, height, null));
      setFormat(type as Format);
      setOutW("");
      setResult(null);
      track("file_uploaded", { tool: "image-cropper", file_count: 1 });
    } catch {
      setError("This image couldn't be read. It may be damaged or not a real image file.");
    }
  };

  const transform = (deg: number, fh = flipH, fv = flipV) => {
    if (!src) return;
    const nd = ((deg % 360) + 360) % 360;
    const no = orientedSize(src.w, src.h, nd);
    setRotation(nd);
    setFlipH(fh);
    setFlipV(fv);
    setRect(initialRect(no.w, no.h, ratio));
    setResult(null);
  };

  const choosePreset = (id: string) => {
    const p = CROP_PRESETS.find((x) => x.id === id)!;
    setPresetId(id);
    setRatio(p.ratio);
    setRect(p.ratio ? initialRect(O.w, O.h, p.ratio) : rect);
    setOutW(p.out ? String(p.out.w) : "");
    setResult(null);
  };

  const setRectField = (k: keyof Rect, v: number) => {
    if (!Number.isFinite(v)) return;
    let next = { ...rect, [k]: Math.round(v) };
    if (ratio && (k === "w" || k === "h")) next = k === "w" ? { ...next, h: Math.round(next.w / ratio) } : { ...next, w: Math.round(next.h * ratio) };
    next.w = Math.max(1, Math.min(next.w, O.w));
    next.h = Math.max(1, Math.min(next.h, O.h));
    setRect(clampMove(next, O.w, O.h));
    setResult(null);
  };

  // Output size: width is editable; height always follows the crop's shape (never stretched).
  const outWidth = Math.max(1, Math.round(Number(outW) || rect.w));
  // With a locked ratio use it exactly, so presets export e.g. 1280 × 720 rather than a pixel-rounded neighbour.
  const outHeight = Math.max(1, Math.round(outWidth / (ratio ?? rect.w / rect.h)));
  const outInvalid = outWidth > MAX_SIDE || outHeight > MAX_SIDE || outWidth * outHeight > MAX_CANVAS_PIXELS;
  const preset = CROP_PRESETS.find((p) => p.id === presetId);

  const onPointerDown = (e: React.PointerEvent, mode: "move" | Handle) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: rect };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / scale;
    const dy = (e.clientY - d.sy) / scale;
    setRect(d.mode === "move" ? clampMove({ ...d.start, x: d.start.x + dx, y: d.start.y + dy }, O.w, O.h) : resizeRect(d.start, d.mode, dx, dy, O.w, O.h, ratio));
    setResult(null);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const exportCrop = async () => {
    if (!src || outInvalid) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d")!;
      if (format === "image/jpeg") {
        ctx.fillStyle = bg; // JPG has no transparency
        ctx.fillRect(0, 0, outWidth, outHeight);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      // Map oriented-image pixels → output, then original → oriented (same model as the on-screen preview).
      ctx.scale(outWidth / rect.w, outHeight / rect.h);
      ctx.translate(-rect.x, -rect.y);
      ctx.translate(O.w / 2, O.h / 2);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(src.bitmap, -src.w / 2, -src.h / 2);
      const blob = await encodeCanvas(canvas, format, format === "image/png" ? undefined : quality / 100);
      canvas.width = canvas.height = 0;
      setResult({ blob, url: URL.createObjectURL(blob), w: outWidth, h: outHeight, type: format });
      track("compression_completed", { tool: "image-cropper", file_type: format });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image couldn't be cropped.");
    } finally {
      setBusy(false);
    }
  };

  const imgStyle: React.CSSProperties = src
        ? {
            width: src.w * scale,
            height: src.h * scale,
            left: (O.w * scale - src.w * scale) / 2,
            top: (O.h * scale - src.h * scale) / 2,
            transform: `scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1}) rotate(${rotation}deg)`,
          }
        : {};

  if (!src) {
    return (
      <div className="grid gap-3">
        <DropZone accept={IMAGE_ACCEPT} onFiles={load} title="Drop an image to crop" subtitle={`or click to browse · JPG, PNG or WebP up to ${limits.imageMaxMB} MB`} formats={["JPG", "JPEG", "PNG", "WebP"]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );
  }

  const iconBtn = "grid size-10 place-items-center rounded-[10px] border border-line-strong bg-card text-charcoal transition-colors hover:border-charcoal disabled:opacity-35";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={iconBtn} onClick={() => transform(rotation - 90)} aria-label="Rotate left" title="Rotate left">
            <RotateCcw className="size-4" />
          </button>
          <button type="button" className={iconBtn} onClick={() => transform(rotation + 90)} aria-label="Rotate right" title="Rotate right">
            <RotateCw className="size-4" />
          </button>
          <button type="button" className={clsx(iconBtn, flipH && "border-orange bg-orange-wash")} onClick={() => transform(rotation, !flipH, flipV)} aria-pressed={flipH} aria-label="Flip horizontally" title="Flip horizontally">
            <FlipHorizontal2 className="size-4" />
          </button>
          <button type="button" className={clsx(iconBtn, flipV && "border-orange bg-orange-wash")} onClick={() => transform(rotation, flipH, !flipV)} aria-pressed={flipV} aria-label="Flip vertically" title="Flip vertically">
            <FlipVertical2 className="size-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-line" />
          <button type="button" className={iconBtn} onClick={() => setZoom((z) => Math.max(1, z / 1.25))} disabled={zoom <= 1} aria-label="Zoom out">
            <ZoomOut className="size-4" />
          </button>
          <span className="w-12 text-center font-mono text-xs text-ink-2">{Math.round(zoom * 100)}%</span>
          <button type="button" className={iconBtn} onClick={() => setZoom((z) => Math.min(4, z * 1.25))} disabled={zoom >= 4} aria-label="Zoom in">
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRect(initialRect(O.w, O.h, ratio));
              setZoom(1);
              setResult(null);
            }}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Reset crop
          </button>
        </div>

        <div className="checker max-h-[620px] overflow-auto rounded-[16px] border border-line p-4">
          <div ref={stage} className="relative mx-auto select-none" style={{ width: O.w * scale, height: O.h * scale, touchAction: "none" }} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <div className="absolute inset-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src.url} alt="Image being cropped" draggable={false} className="pointer-events-none absolute max-w-none origin-center" style={imgStyle} />
            </div>
            <div
              role="group"
              tabIndex={0}
              aria-label={`Crop area ${rect.w} by ${rect.h} pixels at ${rect.x}, ${rect.y}. Drag to move, use arrow keys to nudge.`}
              data-testid="crop-box"
              onPointerDown={(e) => onPointerDown(e, "move")}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 10 : 1;
                const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
                const m = map[e.key];
                if (!m) return;
                e.preventDefault();
                setRect(clampMove({ ...rect, x: rect.x + m[0], y: rect.y + m[1] }, O.w, O.h));
                setResult(null);
              }}
              className="absolute cursor-move outline-none ring-orange focus-visible:ring-2"
              style={{ left: rect.x * scale, top: rect.y * scale, width: rect.w * scale, height: rect.h * scale, boxShadow: "0 0 0 9999px rgba(37,37,37,0.55)", border: "1.5px solid #fff" }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="border border-white/25" />
                ))}
              </div>
              {HANDLES.map((h) => (
                <span
                  key={h}
                  aria-hidden
                  onPointerDown={(e) => onPointerDown(e, h)}
                  className={clsx("absolute size-3 rounded-[3px] border border-charcoal bg-white shadow", handlePos[h])}
                  style={{ cursor: cursor[h], touchAction: "none" }}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="font-mono text-xs text-ink-2" aria-live="polite">
          Crop {rect.w} × {rect.h} px at ({rect.x}, {rect.y}) · image {O.w} × {O.h} px
        </p>
      </div>

      <div className="grid content-start gap-4">
        <Panel className="p-5">
          <FieldLabel>Aspect ratio</FieldLabel>
          <div role="radiogroup" aria-label="Aspect ratio" className="grid grid-cols-4 gap-1.5">
            {CROP_PRESETS.filter((p) => p.group === "ratio").map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={presetId === p.id}
                onClick={() => choosePreset(p.id)}
                className={clsx("h-9 rounded-[8px] border font-mono text-xs transition-colors", presetId === p.id ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (ratio) {
                  setRatio(null);
                  setPresetId("free");
                } else {
                  setRatio(rect.w / rect.h);
                  setPresetId("custom");
                }
              }}
              aria-pressed={Boolean(ratio)}
              title={ratio ? "Unlock aspect ratio" : "Lock current aspect ratio"}
              className={clsx("inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border text-xs transition-colors", ratio ? "border-orange bg-orange-wash text-orange-ink" : "border-line-strong bg-card hover:border-charcoal")}
            >
              {ratio ? <Link2 aria-hidden className="size-3.5" /> : <Unlink aria-hidden className="size-3.5" />} {ratio ? "Locked" : "Lock"}
            </button>
          </div>
          <p className="mb-2 mt-4 text-sm font-medium">Social presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CROP_PRESETS.filter((p) => p.group === "social").map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choosePreset(p.id)}
                aria-pressed={presetId === p.id}
                className={clsx("rounded-[8px] border px-2.5 py-1.5 text-left transition-colors", presetId === p.id ? "border-charcoal bg-card shadow-[0_0_0_3px_rgba(240,120,69,0.15)]" : "border-line bg-card hover:border-line-strong")}
              >
                <span className="block truncate text-[0.82rem] font-medium">{p.label}</span>
                <span className="block font-mono text-[0.68rem] text-ink-2">
                  {p.out!.w} × {p.out!.h}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-2">Suggested sizes — platforms change their specs, so adjust the output width if needed.</p>
        </Panel>

        <Panel className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["x", "X"],
                ["y", "Y"],
                ["w", "Crop width"],
                ["h", "Crop height"],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <FieldLabel htmlFor={`crop-${k}`}>{label}</FieldLabel>
                <input
                  id={`crop-${k}`}
                  inputMode="numeric"
                  value={rect[k]}
                  onChange={(e) => setRectField(k, Number(e.target.value.replace(/[^\d]/g, "")))}
                  className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none focus:border-charcoal"
                />
              </div>
            ))}
            <div className="col-span-2">
              <FieldLabel htmlFor="crop-outw" hint={`→ ${outWidth} × ${outHeight} px`}>
                Output width (optional)
              </FieldLabel>
              <input
                id="crop-outw"
                inputMode="numeric"
                value={outW}
                placeholder={`${rect.w} (crop size)`}
                onChange={(e) => {
                  setOutW(e.target.value.replace(/[^\d]/g, "").slice(0, 5));
                  setResult(null);
                }}
                className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none placeholder:text-ink-3 focus:border-charcoal"
              />
              {outInvalid && <p className="mt-1 text-xs text-error">That output is too large (max 16,384 px per side, 50 MP).</p>}
              {preset?.out && Math.abs(outHeight - preset.out.h) > 1 && Number(outW) === preset.out.w && <p className="mt-1 text-xs text-ink-2">Height follows the crop shape so nothing is stretched.</p>}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <FieldLabel>Format</FieldLabel>
          <Segmented
            label="Output format"
            size="sm"
            value={format}
            onChange={(v) => {
              setFormat(v as Format);
              setResult(null);
            }}
            options={[
              { value: "image/jpeg", label: "JPG" },
              { value: "image/png", label: "PNG" },
              { value: "image/webp", label: "WebP" },
            ]}
          />
          {format !== "image/png" && (
            <div className="mt-4">
              <FieldLabel htmlFor="crop-q" hint={`${quality}%`}>
                Quality
              </FieldLabel>
              <Range id="crop-q" min={40} max={100} value={quality} onChange={(v) => { setQuality(v); setResult(null); }} />
            </div>
          )}
          {format === "image/jpeg" && (
            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="crop-bg" className="text-sm">
                Background for transparent areas
              </label>
              <input id="crop-bg" type="color" value={bg} onChange={(e) => { setBg(e.target.value); setResult(null); }} className="size-8 cursor-pointer rounded border border-line" />
            </div>
          )}
          <button
            type="button"
            onClick={exportCrop}
            disabled={busy || outInvalid}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
          >
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Crop aria-hidden className="size-4" />} Crop image
          </button>
        </Panel>

        {result && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Panel className="p-5" >
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 aria-hidden className="size-4" /> Cropped
              </p>
              <div className="checker mt-3 grid max-h-56 place-items-center overflow-hidden rounded-[10px] border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="Cropped result" className="max-h-56 object-contain" data-testid="crop-result" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Original" value={`${src.w} × ${src.h}`} />
                <Metric label="Cropped" value={`${result.w} × ${result.h}`} />
                <Metric label="Original file" value={formatBytes(src.file.size)} />
                <Metric label="Exported file" value={formatBytes(result.blob.size)} />
              </dl>
              <DownloadButton
                className="mt-4 w-full"
                onClick={() => {
                  downloadBlob(result.blob, `${baseName(src.file.name)}-cropped-${result.w}x${result.h}.${extensionFor(result.type)}`);
                  track("download_clicked", { tool: "image-cropper", format: result.type });
                }}
              >
                <Download aria-hidden className="size-4" /> Download {extensionFor(result.type).toUpperCase()}
              </DownloadButton>
            </Panel>
          </motion.div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <button
          type="button"
          onClick={() => {
            setSrc(null);
            setResult(null);
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm text-ink-2 hover:text-charcoal"
        >
          <X aria-hidden className="size-3.5" /> Choose a different image
        </button>
      </div>
    </div>
  );
}
