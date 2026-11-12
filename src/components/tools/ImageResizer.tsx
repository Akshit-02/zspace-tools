"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AlertTriangle, Archive, Download, Link2, Loader2, RotateCcw, Unlink, X } from "lucide-react";
import { clsx } from "clsx";
import { DownloadButton, DropZone, FieldLabel, Metric, Notice, Panel, ProgressBar, Range, RejectionNotice, Segmented } from "./ui";
import { useBatch, type BatchItem } from "./useBatch";
import { PRESETS, planResize, resizeImage, type Fit, type ResizeFormat, type ResizeMode, type ResizeOutput, type ResizeSettings } from "@/lib/image-resize";
import { IMAGE_ACCEPT, extensionFor, normaliseType } from "@/lib/image-utils";
import { validateFiles } from "@/lib/files";
import { downloadZip } from "@/lib/zip";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { track } from "@/lib/analytics";

type Out = ResizeOutput & { url: string };
type Item = BatchItem<Out>;

const MAX_BYTES = limits.imageMaxMB * 1024 * 1024;
const DEFAULTS: ResizeSettings = {
  mode: "pixels",
  width: 1200,
  height: null,
  lock: true,
  driver: "width",
  percent: 50,
  preset: "ig-portrait",
  fit: "cover",
  format: "original",
  quality: 0.9,
};

const outName = (it: Item) => `${baseName(it.file.name)}-${it.out!.plan.w}x${it.out!.plan.h}.${extensionFor(it.out!.type)}`;

function DimInput({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="min-w-0 flex-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
          className="h-12 w-full rounded-[10px] border border-line-strong bg-card pl-3.5 pr-9 font-mono text-lg outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-2">px</span>
      </div>
    </div>
  );
}

/** Proportional diagram of original vs new dimensions. */
function SizeDiagram({ srcW, srcH, w, h }: { srcW: number; srcH: number; w: number; h: number }) {
  const max = Math.max(srcW, srcH, w, h);
  const box = 150;
  const s = (n: number) => Math.max(4, (n / max) * box);
  return (
    <div className="relative grid h-[170px] place-items-center rounded-[12px] bg-ivory" aria-hidden>
      <div className="relative" style={{ width: box, height: box }}>
        <div className="absolute bottom-0 left-0 rounded-[3px] border border-dashed border-ink-3" style={{ width: s(srcW), height: s(srcH) }} />
        <motion.div
          className="absolute bottom-0 left-0 rounded-[3px] border-2 border-orange bg-orange/15"
          animate={{ width: s(w), height: s(h) }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <div className="absolute bottom-2 right-3 text-right font-mono text-[0.7rem] leading-tight">
        <p className="text-ink-2">
          <span className="mr-1 inline-block h-0 w-3 border-t border-dashed border-ink-3 align-middle" /> {srcW}×{srcH}
        </p>
        <p className="text-orange-ink">
          <span className="mr-1 inline-block h-0.5 w-3 bg-orange align-middle" /> {w}×{h}
        </p>
      </div>
    </div>
  );
}

export default function ImageResizer() {
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULTS);
  const settingsRef = useRef(settings);
  const [selected, setSelected] = useState<string | null>(null);
  const [rejections, setRejections] = useState<string[]>([]);
  const [zipping, setZipping] = useState(false);
  const rerunTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    track("tool_opened", { tool: "image-resizer" });
  }, []);

  const batch = useBatch<Out>({
    process: async (file) => {
      const res = await resizeImage(file, settingsRef.current);
      return { ...res, url: URL.createObjectURL(res.blob) };
    },
    release: (out) => URL.revokeObjectURL(out.url),
    onResult: (_f, out) => track("compression_completed", { tool: "image-resizer", file_type: out.type }),
  });
  const { items } = batch;
  const current = items.find((i) => i.id === selected) ?? items[0];

  /** Updates settings; re-processes after a short pause so typing stays smooth. */
  const update = (patch: Partial<ResizeSettings>, immediate = false) => {
    settingsRef.current = { ...settingsRef.current, ...patch };
    setSettings(settingsRef.current);
    clearTimeout(rerunTimer.current);
    if (!items.length) return;
    if (immediate) batch.rerun();
    else rerunTimer.current = setTimeout(() => batch.rerun(), 350);
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
      const ids = batch.add(accepted);
      setSelected((s) => s ?? ids[0]);
      track("file_uploaded", { tool: "image-resizer", file_count: accepted.length });
    }
  };

  const reset = () => {
    batch.clear();
    setSelected(null);
    setRejections([]);
    settingsRef.current = DEFAULTS;
    setSettings(DEFAULTS);
  };

  // Live plan for the selected image, so inputs and diagram respond before processing finishes.
  const srcDims = current?.out ? { w: current.out.srcW, h: current.out.srcH } : null;
  const livePlan = useMemo(() => (srcDims ? planResize(srcDims.w, srcDims.h, settings) : null), [srcDims?.w, srcDims?.h, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Locked-ratio display: show the computed counterpart for the selected image.
  const shownW = settings.mode === "pixels" && settings.lock && settings.driver === "height" && livePlan?.ok ? String(livePlan.plan.w) : (settings.width?.toString() ?? "");
  const shownH = settings.mode === "pixels" && settings.lock && settings.driver === "width" && livePlan?.ok ? String(livePlan.plan.h) : (settings.height?.toString() ?? "");

  const done = items.filter((i) => i.status === "done" && i.out);
  const needsQuality = settings.format === "image/jpeg" || settings.format === "image/webp" || (settings.format === "original" && items.some((i) => normaliseType(i.file) !== "image/png"));
  const fixedBox = settings.mode === "preset" || (settings.mode === "pixels" && !settings.lock);

  const controls = (
    <Panel className="p-5 sm:p-6">
      <Segmented
        label="Resize by"
        value={settings.mode}
        onChange={(v) => update({ mode: v as ResizeMode }, true)}
        options={[
          { value: "pixels", label: "Pixels" },
          { value: "percent", label: "Percentage" },
          { value: "preset", label: "Preset" },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={settings.mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-5">
          {settings.mode === "pixels" && (
            <div className="flex items-end gap-2">
              <DimInput
                id="rs-w"
                label="Width"
                value={shownW}
                placeholder="Width"
                onChange={(v) => update({ width: v ? Number(v) : null, driver: "width" })}
              />
              <button
                type="button"
                onClick={() => update({ lock: !settings.lock }, true)}
                aria-pressed={settings.lock}
                aria-label={settings.lock ? "Unlock aspect ratio" : "Lock aspect ratio"}
                title={settings.lock ? "Aspect ratio locked" : "Aspect ratio unlocked"}
                className={clsx(
                  "mb-0.5 grid size-11 shrink-0 place-items-center rounded-[10px] border transition-colors",
                  settings.lock ? "border-orange bg-orange-wash text-orange-ink" : "border-line-strong bg-card text-ink-2 hover:border-charcoal",
                )}
              >
                {settings.lock ? <Link2 className="size-4" /> : <Unlink className="size-4" />}
              </button>
              <DimInput
                id="rs-h"
                label="Height"
                value={shownH}
                placeholder="Height"
                onChange={(v) => update({ height: v ? Number(v) : null, driver: "height" })}
              />
            </div>
          )}
          {settings.mode === "pixels" && (
            <p className="mt-2 text-xs text-ink-2">
              {settings.lock ? "Aspect ratio locked — the other side follows automatically for each image." : "Exact size. If the shape differs from an image, choose how it fits below."}
            </p>
          )}

          {settings.mode === "percent" && (
            <div>
              <FieldLabel htmlFor="rs-pct" hint={`${settings.percent}%`}>
                Scale
              </FieldLabel>
              <Range id="rs-pct" min={5} max={200} step={5} value={settings.percent} onChange={(v) => update({ percent: v })} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[25, 50, 75, 150, 200].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update({ percent: p }, true)}
                    className={clsx(
                      "rounded-[8px] border px-2.5 py-1 font-mono text-xs transition-colors",
                      settings.percent === p ? "border-charcoal bg-charcoal text-ivory" : "border-line text-ink-2 hover:border-charcoal hover:text-charcoal",
                    )}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {settings.mode === "preset" && (
            <div>
              <div role="radiogroup" aria-label="Preset size" className="grid gap-1.5 sm:grid-cols-2">
                {PRESETS.map((p) => {
                  const active = settings.preset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update({ preset: p.id }, true)}
                      className={clsx(
                        "flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                        active ? "border-charcoal bg-card shadow-[0_0_0_3px_rgba(240,120,69,0.15)]" : "border-line bg-card hover:border-line-strong",
                      )}
                    >
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center">
                        <span className={clsx("block rounded-[2px] border", active ? "border-orange bg-orange/20" : "border-ink-3")} style={{ width: (p.w / Math.max(p.w, p.h)) * 26, height: (p.h / Math.max(p.w, p.h)) * 26 }} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{p.label}</span>
                        <span className="block font-mono text-xs text-ink-2">
                          {p.w} × {p.h}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-2">Suggested sizes. Platforms change their specifications, so check current guidance for important posts.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {fixedBox && (
        <div className="mt-5">
          <FieldLabel>When the shape differs</FieldLabel>
          <Segmented
            label="Fit"
            size="sm"
            value={settings.fit}
            onChange={(v) => update({ fit: v as Fit }, true)}
            options={[
              { value: "cover", label: "Crop to fill" },
              { value: "contain", label: "Fit inside (pad)" },
            ]}
          />
        </div>
      )}

      <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Output format</FieldLabel>
          <Segmented
            label="Output format"
            size="sm"
            value={settings.format}
            onChange={(v) => update({ format: v as ResizeFormat }, true)}
            options={[
              { value: "original", label: "Same" },
              { value: "image/jpeg", label: "JPG" },
              { value: "image/png", label: "PNG" },
              { value: "image/webp", label: "WebP" },
            ]}
          />
        </div>
        {needsQuality && (
          <div>
            <FieldLabel htmlFor="rs-q" hint={`${Math.round(settings.quality * 100)}%`}>
              Quality <span className="font-normal text-ink-2">(JPG/WebP)</span>
            </FieldLabel>
            <Range id="rs-q" min={40} max={100} value={Math.round(settings.quality * 100)} onChange={(v) => update({ quality: v / 100 })} />
          </div>
        )}
      </div>
    </Panel>
  );

  if (!items.length) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
        <div className="grid content-start gap-3">
          <DropZone accept={IMAGE_ACCEPT} multiple onFiles={addFiles} title="Drop images here" subtitle={`or click to browse · up to ${limits.maxImages} files, ${limits.imageMaxMB} MB each`} formats={["JPG", "JPEG", "PNG", "WebP"]} />
          <RejectionNotice list={rejections} onClose={() => setRejections([])} />
        </div>
        {controls}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
      {/* Left: files + controls */}
      <div className="grid content-start gap-4">
        <RejectionNotice list={rejections} onClose={() => setRejections([])} />
        <ul className="grid min-w-0 gap-2" aria-label="Images">
          {items.map((it) => {
            const isSel = current?.id === it.id;
            return (
              <li key={it.id} className="min-w-0">
                <div className={clsx("flex items-center gap-2 rounded-[14px] border bg-card p-2 transition-colors sm:gap-3", isSel ? "border-charcoal" : "border-line hover:border-line-strong")}>
                  <button type="button" onClick={() => setSelected(it.id)} aria-pressed={isSel} aria-label={`Preview ${it.file.name}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.srcUrl} alt="" className="checker size-11 shrink-0 rounded-[10px] border border-line object-cover sm:size-12" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.95rem] font-medium">{it.file.name}</span>
                      <span className="mt-0.5 block font-mono text-[0.75rem] text-ink-2">
                        {it.out ? (
                          <>
                            {it.out.srcW}×{it.out.srcH} → <span className="text-charcoal">{it.out.plan.w}×{it.out.plan.h}</span>
                          </>
                        ) : it.status === "error" ? null : (
                          "resizing…"
                        )}
                      </span>
                      {it.status === "error" && <span className="block text-xs text-error">{it.error}</span>}
                    </span>
                  </button>
                  {it.status === "processing" && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-orange" />}
                  {it.status === "error" && <AlertCircle aria-hidden className="size-4 shrink-0 text-error" />}
                  <button
                    type="button"
                    onClick={() => {
                      downloadBlob(it.out!.blob, outName(it));
                      track("download_clicked", { tool: "image-resizer", file_count: 1 });
                    }}
                    disabled={it.status !== "done"}
                    aria-label={`Download ${it.file.name}`}
                    className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line transition-colors hover:border-charcoal disabled:opacity-30"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      batch.remove(it.id);
                      if (selected === it.id) setSelected(items.find((i) => i.id !== it.id)?.id ?? null);
                    }}
                    aria-label={`Remove ${it.file.name}`}
                    className="grid size-9 shrink-0 place-items-center rounded-[10px] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {items.length < limits.maxImages && (
          <DropZone compact accept={IMAGE_ACCEPT} multiple onFiles={addFiles} title="Add more images" subtitle={`${items.length} of ${limits.maxImages} used`} formats={[]} />
        )}
        {controls}
      </div>

      {/* Right: preview + output */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="p-4 sm:p-5">
          {current?.status === "done" && current.out ? (
            <>
              <div className="checker grid aspect-[4/3] place-items-center overflow-hidden rounded-[12px] border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.out.url} alt={`${current.file.name} resized to ${current.out.plan.w} by ${current.out.plan.h} pixels`} className="max-h-full max-w-full object-contain shadow-sm" />
              </div>
              <div className="mt-4">
                <SizeDiagram srcW={current.out.srcW} srcH={current.out.srcH} w={current.out.plan.w} h={current.out.plan.h} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2.5">
                <Metric label="Original size" value={`${current.out.srcW} × ${current.out.srcH}`} />
                <Metric label="New size" value={`${current.out.plan.w} × ${current.out.plan.h}`} />
                <Metric label="Original file" value={formatBytes(current.file.size)} />
                <Metric label="New file" value={formatBytes(current.out.blob.size)} />
              </dl>
              {current.out.plan.upscaled && (
                <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" />
                  This image is being enlarged. Upscaling can&rsquo;t add detail, so it may look softer.
                </p>
              )}
              {(current.out.plan.cropped || current.out.plan.padded) && (
                <p className="mt-2 text-sm text-ink-2">
                  {current.out.plan.cropped ? "Edges were cropped evenly to fill the new shape." : "The image was fitted inside the new shape with padding."} Nothing was stretched.
                </p>
              )}
              <DownloadButton
                className="mt-4 w-full"
                onClick={() => {
                  downloadBlob(current.out!.blob, outName(current));
                  track("download_clicked", { tool: "image-resizer", file_count: 1 });
                }}
              >
                <Download aria-hidden className="size-4" /> Download {extensionFor(current.out.type).toUpperCase()}
              </DownloadButton>
            </>
          ) : current?.status === "error" ? (
            <div className="grid aspect-[4/3] place-items-center rounded-[12px] bg-ivory p-6 text-center">
              <p className="max-w-xs text-sm text-error">{current.error}</p>
            </div>
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-[12px] bg-ivory">
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <Loader2 aria-hidden className="size-4 animate-spin" /> Resizing…
              </p>
            </div>
          )}
        </Panel>

        <div className="mt-4 rounded-[16px] bg-charcoal p-5 text-ivory">
          {batch.busy ? (
            <div>
              <p className="flex items-center gap-2 text-sm">
                <Loader2 aria-hidden className="size-4 animate-spin text-orange" /> Resizing {Math.min(batch.finished + 1, items.length)} of {items.length}…
              </p>
              <div className="mt-3 [&_.bg-line]:bg-ivory/15">
                <ProgressBar value={(batch.finished / items.length) * 100} label="Resize progress" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-ivory/75">
              <span className="font-mono text-ivory">{done.length}</span> of {items.length} {items.length === 1 ? "image" : "images"} resized
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <DownloadButton
              onClick={async () => {
                setZipping(true);
                try {
                  await downloadZip(done.map((it) => ({ name: outName(it), blob: it.out!.blob })), "zspace-resized-images.zip");
                  track("download_clicked", { tool: "image-resizer", format: "zip", file_count: done.length });
                } finally {
                  setZipping(false);
                }
              }}
              disabled={batch.busy || !done.length || zipping}
            >
              {zipping ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Archive aria-hidden className="size-4" />} Download all (ZIP)
            </DownloadButton>
            <button type="button" onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-ivory/20 px-4 font-medium text-ivory transition-colors hover:border-ivory/60">
              <RotateCcw aria-hidden className="size-4" /> Reset
            </button>
          </div>
        </div>
        {livePlan && !livePlan.ok && (
          <div className="mt-3">
            <Notice tone="error">{livePlan.error}</Notice>
          </div>
        )}
      </div>
    </div>
  );
}
