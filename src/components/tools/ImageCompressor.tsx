"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Archive, Check, Download, Loader2, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, ProgressBar, Range, RejectionNotice, Segmented } from "./ui";
import { useBatch, type BatchItem } from "./useBatch";
import { CompareSlider } from "./CompareSlider";
import { compressImage, extensionFor, normaliseType, type OutputFormat } from "@/lib/image-compress";
import { IMAGE_ACCEPT } from "@/lib/image-utils";
import { validateFiles } from "@/lib/files";
import { downloadZip } from "@/lib/zip";
import { baseName, downloadBlob, formatBytes, formatPercent, percentSaved } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

type Out = { blob: Blob; url: string; type: string; width: number; height: number; keptOriginal: boolean };
type Item = BatchItem<Out>;

interface Settings {
  quality: number; // 10–100
  format: OutputFormat;
  maxDimension: number;
}

const MAX_BYTES = limits.imageMaxMB * 1024 * 1024;
const MAX_FILES = limits.maxImages;

function outName(item: Item) {
  return `${baseName(item.file.name)}-compressed.${extensionFor(item.out?.type ?? item.file.type)}`;
}

export default function ImageCompressor() {
  const [settings, setSettings] = useState<Settings>({ quality: 75, format: "original", maxDimension: 0 });
  const [draftQuality, setDraftQuality] = useState(75);
  const [selected, setSelected] = useState<string | null>(null);
  const [rejections, setRejections] = useState<string[]>([]);
  const [zipping, setZipping] = useState(false);
  const settingsRef = useRef(settings);

  useEffect(() => {
    track("tool_opened", { tool: "image-compressor" });
  }, []);

  const batch = useBatch<Out>({
    process: async (file) => {
      const s = settingsRef.current;
      const res = await compressImage(file, { quality: s.quality / 100, format: s.format, maxDimension: s.maxDimension });
      return { ...res, url: URL.createObjectURL(res.blob) };
    },
    release: (out) => URL.revokeObjectURL(out.url),
    onResult: (file, res) =>
      track("compression_completed", {
        tool: "image-compressor",
        file_type: res.type,
        size_bucket: sizeBucket(file.size),
        reduction_pct: Math.round(percentSaved(file.size, res.blob.size)),
      }),
  });
  const { items } = batch;

  /** Re-run everything when settings change. */
  const applySettings = (patch: Partial<Settings>) => {
    settingsRef.current = { ...settingsRef.current, ...patch };
    setSettings(settingsRef.current);
    batch.rerun();
  };

  const addFiles = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files, {
      accept: (f) => Boolean(normaliseType(f)),
      kindLabel: "JPG, PNG or WebP image",
      maxBytes: MAX_BYTES,
      maxCount: MAX_FILES,
      current: items.length,
    });
    setRejections(rejected);
    if (accepted.length) {
      const ids = batch.add(accepted);
      setSelected((s) => s ?? ids[0]);
      track("file_uploaded", { tool: "image-compressor", file_count: accepted.length });
    }
  };

  const remove = (id: string) => {
    batch.remove(id);
    if (selected === id) setSelected(items.find((i) => i.id !== id)?.id ?? null);
  };

  const clearAll = () => {
    batch.clear();
    setSelected(null);
    setRejections([]);
  };

  const downloadOne = (it: Item) => {
    if (!it.out) return;
    downloadBlob(it.out.blob, outName(it));
    track("download_clicked", { tool: "image-compressor", format: it.out.type, file_count: 1 });
  };

  const downloadAll = async () => {
    const done = items.filter((i) => i.status === "done" && i.out);
    if (!done.length) return;
    setZipping(true);
    try {
      await downloadZip(done.map((it) => ({ name: outName(it), blob: it.out!.blob })), "zspace-compressed-images.zip");
      track("download_clicked", { tool: "image-compressor", format: "zip", file_count: done.length });
    } finally {
      setZipping(false);
    }
  };

  const totals = useMemo(() => {
    const done = items.filter((i) => i.status === "done" && i.out);
    const before = done.reduce((s, i) => s + i.file.size, 0);
    const after = done.reduce((s, i) => s + (i.out?.blob.size ?? 0), 0);
    return { count: done.length, before, after, saved: percentSaved(before, after) };
  }, [items]);

  const processed = batch.finished;
  const busy = batch.busy;
  const current = items.find((i) => i.id === selected) ?? items[0];

  if (items.length === 0) {
    return (
      <div className="grid gap-3">
        <DropZone
          accept={IMAGE_ACCEPT}
          multiple
          onFiles={addFiles}
          title="Drop images here"
          subtitle={`or click to browse · up to ${MAX_FILES} files, ${limits.imageMaxMB} MB each`}
          formats={["JPG", "JPEG", "PNG", "WebP"]}
        />
        {rejections.length > 0 && <RejectionNotice list={rejections} onClose={() => setRejections([])} />}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Settings bar */}
      <Panel className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr_0.9fr] lg:items-end">
        <div>
          <FieldLabel htmlFor="ic-quality" hint={`${draftQuality}%`}>
            Quality
          </FieldLabel>
          <Range
            id="ic-quality"
            min={10}
            max={100}
            value={draftQuality}
            onChange={setDraftQuality}
            onCommit={() => draftQuality !== settings.quality && applySettings({ quality: draftQuality })}
          />
          <div className="mt-1 flex justify-between text-xs text-ink-2">
            <span>Smaller file</span>
            <span>Better quality</span>
          </div>
        </div>
        <div>
          <FieldLabel>Output format</FieldLabel>
          <Segmented
            label="Output format"
            size="sm"
            value={settings.format}
            onChange={(v) => applySettings({ format: v })}
            options={[
              { value: "original", label: "Original" },
              { value: "webp", label: "WebP" },
              { value: "jpeg", label: "JPG" },
            ]}
          />
        </div>
        <div>
          <FieldLabel htmlFor="ic-resize">Max dimension</FieldLabel>
          <select
            id="ic-resize"
            value={settings.maxDimension}
            onChange={(e) => applySettings({ maxDimension: Number(e.target.value) })}
            className="h-[42px] w-full cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 text-sm outline-none focus:border-charcoal"
          >
            <option value={0}>Keep original size</option>
            <option value={3840}>3840 px (4K)</option>
            <option value={2560}>2560 px</option>
            <option value={1920}>1920 px (Full HD)</option>
            <option value={1280}>1280 px</option>
            <option value={800}>800 px</option>
          </select>
        </div>
      </Panel>

      {/* Summary + actions */}
      <div className="flex flex-col gap-4 rounded-[16px] border border-line bg-charcoal p-5 text-ivory sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          {busy ? (
            <div className="max-w-sm">
              <p className="flex items-center gap-2 text-sm">
                <Loader2 aria-hidden className="size-4 animate-spin text-orange" />
                Compressing {Math.min(processed + 1, items.length)} of {items.length}…
              </p>
              <div className="mt-3 [&_.bg-line]:bg-ivory/15">
                <ProgressBar value={(processed / items.length) * 100} label="Compression progress" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <p className="font-mono text-[1.6rem] leading-none sm:text-[2rem]">
                {totals.saved > 0 ? formatPercent(totals.saved) : "0%"}
              </p>
              <p className="font-mono text-sm text-ivory/70">
                {formatBytes(totals.before)} → {formatBytes(totals.after)}
              </p>
              <p className="text-sm text-ivory/70">
                {totals.count} {totals.count === 1 ? "image" : "images"} ready
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadAll}
            disabled={busy || totals.count === 0 || zipping}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-orange px-4 font-medium text-charcoal transition-colors hover:bg-[#ec6a34] disabled:opacity-40"
          >
            {zipping ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Archive aria-hidden className="size-4" />}
            Download all (ZIP)
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-ivory/20 px-4 font-medium text-ivory transition-colors hover:border-ivory/60"
          >
            <Trash2 aria-hidden className="size-4" /> Clear all
          </button>
        </div>
      </div>

      {rejections.length > 0 && <RejectionNotice list={rejections} onClose={() => setRejections([])} />}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        {/* File list */}
        <div className="grid min-w-0 content-start gap-3">
          <ul className="grid min-w-0 gap-2">
            <AnimatePresence initial={false}>
              {items.map((it) => {
                const saved = it.out ? percentSaved(it.file.size, it.out.blob.size) : 0;
                const isSel = current?.id === it.id;
                return (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25 }}
                    className="min-w-0"
                  >
                    <div
                      className={clsx(
                        "flex items-center gap-2 rounded-[14px] border bg-card p-2 pr-2 transition-colors sm:gap-3 sm:p-2.5 sm:pr-3",
                        isSel ? "border-charcoal" : "border-line hover:border-line-strong",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(it.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-pressed={isSel}
                        aria-label={`Preview ${it.file.name}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.srcUrl} alt="" className="checker size-11 shrink-0 rounded-[10px] border border-line object-cover sm:size-14" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.95rem] font-medium">{it.file.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[0.75rem] text-ink-2">
                            <span>{formatBytes(it.file.size)}</span>
                            {it.status === "done" && it.out && (
                              <>
                                <span aria-hidden>→</span>
                                <span className="text-charcoal">{formatBytes(it.out.blob.size)}</span>
                              </>
                            )}
                            {it.status === "processing" && <span className="text-orange-ink">compressing…</span>}
                            {it.status === "queued" && <span>waiting…</span>}
                          </span>
                          {it.status === "error" && <span className="mt-0.5 block text-xs text-error">{it.error}</span>}
                        </span>
                      </button>
                      {it.status === "done" && it.out && (
                        <span
                          className={clsx(
                            "shrink-0 rounded-[8px] px-2 py-1 font-mono text-[0.75rem] font-medium",
                            it.out.keptOriginal ? "bg-ivory-2 text-ink-2" : saved > 0 ? "bg-[#e9f3ed] text-success" : "bg-[#fbecea] text-error",
                          )}
                          title={it.out.keptOriginal ? "Already optimised — the original was kept" : undefined}
                        >
                          {it.out.keptOriginal ? "optimal" : formatPercent(saved)}
                        </span>
                      )}
                      {it.status === "processing" && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-orange" />}
                      {it.status === "error" && <AlertCircle aria-hidden className="size-4 shrink-0 text-error" />}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => downloadOne(it)}
                          disabled={it.status !== "done"}
                          aria-label={`Download ${it.file.name}`}
                          className="grid size-9 place-items-center rounded-[10px] border border-line text-charcoal transition-colors hover:border-charcoal disabled:opacity-30"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(it.id)}
                          aria-label={`Remove ${it.file.name}`}
                          className="grid size-9 place-items-center rounded-[10px] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {items.length < MAX_FILES && (
            <DropZone
              compact
              accept={IMAGE_ACCEPT}
              multiple
              onFiles={addFiles}
              title="Add more images"
              subtitle={`${items.length} of ${MAX_FILES} used`}
              formats={[]}
            />
          )}
        </div>

        {/* Preview */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Panel className="p-4 sm:p-5">
            {current?.status === "done" && current.out ? (
              <>
                <CompareSlider before={current.srcUrl} after={current.out.url} alt={current.file.name} />
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "Original", v: formatBytes(current.file.size) },
                    { k: "Compressed", v: formatBytes(current.out.blob.size) },
                    {
                      k: "Saved",
                      v: current.out.keptOriginal ? "0%" : formatPercent(percentSaved(current.file.size, current.out.blob.size)),
                    },
                    { k: "Dimensions", v: `${current.out.width}×${current.out.height}` },
                  ].map((s) => (
                    <div key={s.k} className="rounded-[10px] bg-ivory px-3 py-2.5">
                      <dt className="text-xs text-ink-2">{s.k}</dt>
                      <dd className="mt-0.5 font-mono text-[0.9rem]">{s.v}</dd>
                    </div>
                  ))}
                </dl>
                {current.out.keptOriginal && (
                  <div className="mt-3">
                    <Notice>
                      <span className="flex items-start gap-2">
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                        This image is already well optimised — re-encoding made it larger, so your original is kept. Try a lower quality or WebP.
                      </span>
                    </Notice>
                  </div>
                )}
                {!current.out.keptOriginal && percentSaved(current.file.size, current.out.blob.size) < 0 && (
                  <div className="mt-3">
                    <Notice tone="error">The converted file is larger than the original. Try a lower quality or a different format.</Notice>
                  </div>
                )}
              </>
            ) : current?.status === "error" ? (
              <div className="grid aspect-[4/3] place-items-center rounded-[12px] bg-ivory p-6 text-center">
                <p className="max-w-xs text-sm text-error">{current.error}</p>
              </div>
            ) : (
              <div className="grid aspect-[4/3] place-items-center rounded-[12px] bg-ivory">
                <p className="flex items-center gap-2 text-sm text-ink-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" /> Preparing preview…
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
