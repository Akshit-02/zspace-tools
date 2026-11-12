"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, CheckCircle2, Download, ExternalLink, FilePlus2, Loader2, RotateCcw, X } from "lucide-react";
import { clsx } from "clsx";
import { DownloadButton, DropZone, FieldLabel, Notice, Panel, ProgressBar, RejectionNotice, Segmented } from "./ui";
import { SortableList } from "./SortableList";
import { useBatch } from "./useBatch";
import { buildPdf, layoutPage, type Orientation, type PageSize, type PdfPageSettings, type Placement } from "@/lib/image-pdf";
import { IMAGE_ACCEPT, decodeImage, dims, normaliseType, releaseImage } from "@/lib/image-utils";
import { validateFiles } from "@/lib/files";
import { downloadBlob, formatBytes, openBlob } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

type Dims = { w: number; h: number };

const DEFAULTS: PdfPageSettings = { size: "a4", customW: 210, customH: 297, orientation: "auto", margin: 12, placement: "fit" };
const MAX_BYTES = limits.imageMaxMB * 1024 * 1024;
const cleanName = (n: string) => (n.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\.pdf$/i, "") || "images") + ".pdf";

/** Reads dimensions (orientation-corrected) for layout and preview. */
async function analyse(file: File): Promise<Dims> {
  let src;
  try {
    src = await decodeImage(file);
  } catch {
    throw new Error("This image couldn't be read. It may be damaged or not a real image file.");
  }
  const d = dims(src);
  releaseImage(src);
  return { w: d.width, h: d.height };
}

function PagePreview({ src, d, settings, n }: { src: string; d: Dims; settings: PdfPageSettings; n: number }) {
  const l = layoutPage(d.w, d.h, settings);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <figure className="min-w-0">
      <div className="relative w-full overflow-hidden rounded-[4px] bg-card shadow-[0_1px_0_rgba(37,37,37,0.06),0_8px_20px_-12px_rgba(37,37,37,0.35)] ring-1 ring-line" style={{ aspectRatio: `${l.pageW} / ${l.pageH}` }}>
        <div className="absolute overflow-hidden" style={{ left: pct(l.box.x, l.pageW), bottom: pct(l.box.y, l.pageH), width: pct(l.box.w, l.pageW), height: pct(l.box.h, l.pageH) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="absolute max-w-none"
            style={{ left: pct(l.x - l.box.x, l.box.w), bottom: pct(l.y - l.box.y, l.box.h), width: pct(l.w, l.box.w), height: pct(l.h, l.box.h) }}
          />
        </div>
        {settings.margin > 0 && (
          <div aria-hidden className="pointer-events-none absolute border border-dashed border-orange/40" style={{ left: pct(l.box.x, l.pageW), bottom: pct(l.box.y, l.pageH), width: pct(l.box.w, l.pageW), height: pct(l.box.h, l.pageH) }} />
        )}
      </div>
      <figcaption className="mt-1 text-center font-mono text-[0.68rem] text-ink-2">{n}</figcaption>
    </figure>
  );
}

export default function ImageToPdf() {
  const [settings, setSettings] = useState<PdfPageSettings>(DEFAULTS);
  const [rejections, setRejections] = useState<string[]>([]);
  const [name, setName] = useState("images");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track("tool_opened", { tool: "image-to-pdf" });
  }, []);

  const batch = useBatch<Dims>({ process: analyse });
  const { items } = batch;
  const ready = items.filter((i) => i.status === "done" && i.out);

  const set = (patch: Partial<PdfPageSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setResult(null);
  };

  const addFiles = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files, {
      accept: (f) => Boolean(normaliseType(f)),
      kindLabel: "JPG, PNG or WebP image",
      maxBytes: MAX_BYTES,
      maxCount: limits.maxImages,
      current: items.length,
    });
    setRejections(rejected);
    if (accepted.length) {
      batch.add(accepted);
      setResult(null);
      track("file_uploaded", { tool: "image-to-pdf", file_count: accepted.length });
    }
  };

  const customInvalid = settings.size === "custom" && (!(settings.customW >= 20 && settings.customW <= 2000) || !(settings.customH >= 20 && settings.customH <= 2000));

  const create = async () => {
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const bytes = await buildPdf(
        ready.map((i) => i.file),
        settings,
        cleanName(name).replace(/\.pdf$/, ""),
        (n) => setProgress(n),
      );
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResult({ blob, pages: ready.length });
      track("compression_completed", { tool: "image-to-pdf", file_count: ready.length, size_bucket: sizeBucket(blob.size), level: settings.size });
    } catch (e) {
      setError(e instanceof RangeError ? "Your device ran out of memory. Try fewer or smaller images." : `The PDF couldn't be created. ${e instanceof Error ? e.message : ""}`.trim());
    } finally {
      setProgress(null);
    }
  };

  const reset = () => {
    batch.clear();
    setSettings(DEFAULTS);
    setResult(null);
    setError(null);
    setRejections([]);
    setName("images");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr] [&>*]:min-w-0">
      {/* Images */}
      <div className="grid content-start gap-3">
        <DropZone
          compact={items.length > 0}
          accept={IMAGE_ACCEPT}
          multiple
          onFiles={addFiles}
          title={items.length ? "Add more images" : "Drop images here"}
          subtitle={items.length ? `${items.length} of ${limits.maxImages} images` : `or click to browse · up to ${limits.maxImages} images, ${limits.imageMaxMB} MB each`}
          formats={["JPG", "JPEG", "PNG", "WebP"]}
        />
        <RejectionNotice list={rejections} onClose={() => setRejections([])} />
        {items.length > 0 && (
          <>
            <p className="px-1 text-sm text-ink-2">Drag to reorder — one image per page, top to bottom.</p>
            <SortableList
              items={items}
              onReorder={(next) => {
                batch.reorder(next);
                setResult(null);
              }}
              label="Images in page order"
              itemLabel={(i) => i.file.name}
            >
              {(it, i) => (
                <div className="flex min-w-0 items-center gap-3 py-0.5">
                  <span className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.srcUrl} alt="" className="checker size-12 rounded-[8px] border border-line object-cover" />
                    <span className="absolute -bottom-1 -left-1 rounded-[5px] bg-charcoal px-1 font-mono text-[0.6rem] text-ivory">{i + 1}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-medium">{it.file.name}</p>
                    <p className="font-mono text-[0.72rem] text-ink-2">
                      {it.out ? `${it.out.w}×${it.out.h}` : it.status === "error" ? "" : "reading…"} · {formatBytes(it.file.size)}
                    </p>
                    {it.status === "error" && (
                      <p className="flex items-start gap-1 text-xs text-error">
                        <AlertCircle aria-hidden className="mt-px size-3.5 shrink-0" /> {it.error} It will be skipped.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      batch.remove(it.id);
                      setResult(null);
                    }}
                    aria-label={`Remove ${it.file.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </SortableList>
          </>
        )}
      </div>

      {/* Settings + preview */}
      <div className="grid content-start gap-4">
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Page size</FieldLabel>
              <Segmented
                label="Page size"
                size="sm"
                value={settings.size}
                onChange={(v) => set({ size: v as PageSize })}
                options={[
                  { value: "a4", label: "A4" },
                  { value: "letter", label: "Letter" },
                  { value: "fit", label: "Fit to image" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>
            {settings.size === "custom" && (
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                {(["customW", "customH"] as const).map((k) => (
                  <div key={k}>
                    <FieldLabel htmlFor={`ip-${k}`}>{k === "customW" ? "Width" : "Height"}</FieldLabel>
                    <div className="relative">
                      <input
                        id={`ip-${k}`}
                        inputMode="numeric"
                        value={settings[k] || ""}
                        onChange={(e) => set({ [k]: Number(e.target.value.replace(/[^\d]/g, "").slice(0, 4)) || 0 })}
                        className="h-11 w-full rounded-[10px] border border-line-strong bg-card pl-3 pr-10 font-mono outline-none focus:border-charcoal"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-2">mm</span>
                    </div>
                  </div>
                ))}
                {customInvalid && <p className="col-span-2 text-xs text-error">Use sizes between 20 and 2000 mm.</p>}
              </div>
            )}
            <div>
              <FieldLabel>Orientation</FieldLabel>
              <Segmented
                label="Orientation"
                size="sm"
                value={settings.orientation}
                onChange={(v) => set({ orientation: v as Orientation })}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Margin</FieldLabel>
              <Segmented
                label="Margin"
                size="sm"
                value={String(settings.margin)}
                onChange={(v) => set({ margin: Number(v) })}
                options={[
                  { value: "0", label: "None" },
                  { value: "6", label: "S" },
                  { value: "12", label: "M" },
                  { value: "20", label: "L" },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Image placement</FieldLabel>
              <Segmented
                label="Image placement"
                size="sm"
                value={settings.placement}
                onChange={(v) => set({ placement: v as Placement })}
                options={[
                  { value: "fit", label: "Fit to page" },
                  { value: "fill", label: "Fill page" },
                  { value: "original", label: "Original size" },
                ]}
              />
              <p className="mt-1.5 text-xs text-ink-2">
                {settings.size === "fit"
                  ? "Each page matches its image exactly, so placement doesn't apply."
                  : settings.placement === "fill"
                    ? "Covers the page; edges that overflow are cropped. Never stretched."
                    : settings.placement === "original"
                      ? "Keeps the image's natural size (96 dpi), shrinking only if it's too big."
                      : "Shows the whole image as large as the page allows. Never stretched."}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-sm font-bold">Preview</p>
            <p className="font-mono text-xs text-ink-2">
              {ready.length} {ready.length === 1 ? "page" : "pages"}
            </p>
          </div>
          <div className="dotgrid max-h-[420px] overflow-y-auto bg-ivory p-4">
            {ready.length ? (
              <div className="grid grid-cols-3 items-end gap-3 sm:grid-cols-4">
                {ready.map((it, i) => (
                  <PagePreview key={it.id} src={it.srcUrl} d={it.out!} settings={settings} n={i + 1} />
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-ink-2">Your pages will appear here.</p>
            )}
          </div>
          <div className="border-t border-line p-5">
            <FieldLabel htmlFor="ip-name">File name</FieldLabel>
            <div className="flex h-11 items-center rounded-[10px] border border-line-strong bg-card pr-3 focus-within:border-charcoal">
              <input id="ip-name" value={name} onChange={(e) => setName(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3.5 outline-none" />
              <span className="font-mono text-sm text-ink-2">.pdf</span>
            </div>
            <button
              type="button"
              onClick={create}
              disabled={!ready.length || batch.busy || progress !== null || customInvalid}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
            >
              {progress !== null ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FilePlus2 aria-hidden className="size-4" />} Create PDF
            </button>
            {progress !== null && (
              <div className="mt-4" aria-live="polite">
                <p className="text-sm">
                  Adding page {Math.min(progress + 1, ready.length)} of {ready.length}…
                </p>
                <div className="mt-2">
                  <ProgressBar value={(progress / Math.max(1, ready.length)) * 100} label="PDF creation progress" />
                </div>
              </div>
            )}
            {error && (
              <div className="mt-4">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
            {result && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[14px] border border-success/30 bg-[#f1f7f3] p-4" aria-live="polite">
                <p className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2 aria-hidden className="size-4" /> PDF created
                </p>
                <p className="mt-2 truncate font-medium">{cleanName(name)}</p>
                <p className="font-mono text-sm text-ink-2">
                  {result.pages} {result.pages === 1 ? "page" : "pages"} · {formatBytes(result.blob.size, 2)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DownloadButton
                    onClick={() => {
                      downloadBlob(result.blob, cleanName(name));
                      track("download_clicked", { tool: "image-to-pdf" });
                    }}
                  >
                    <Download aria-hidden className="size-4" /> Download PDF
                  </DownloadButton>
                  <button type="button" onClick={() => openBlob(result.blob)} className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-line-strong bg-card px-4 font-medium hover:border-charcoal">
                    <ExternalLink aria-hidden className="size-4" /> Preview
                  </button>
                </div>
              </motion.div>
            )}
            {items.length > 0 && (
              <button type="button" onClick={reset} className={clsx("mt-3 inline-flex w-full items-center justify-center gap-2 py-2 text-sm text-ink-2 hover:text-charcoal")}>
                <RotateCcw aria-hidden className="size-3.5" /> Reset
              </button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
