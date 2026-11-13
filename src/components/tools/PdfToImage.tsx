"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, Download, FileText, ImageIcon, RotateCcw, Square, X } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, ProgressBar, Range, Segmented, inputClass } from "./ui";
import { DPI_PRESETS, megapixels, outName, planSize, renderPage, type ImageFormat, type PageImage } from "@/lib/pdf-images";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { openPdfjs } from "@/lib/pdf-render";
import { PdfError, expandRanges, formatPageList, isPdfFile, parsePageRanges } from "@/lib/pdf-utils";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { downloadZip } from "@/lib/zip";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";
import type { PDFDocumentProxy } from "pdfjs-dist";

const MAX_BYTES = limits.pdfMaxMB * 1024 * 1024;
const nf = new Intl.NumberFormat("en-US");

interface Loaded {
  file: File;
  doc: PDFDocumentProxy;
  destroy: () => void;
  sizes: { w: number; h: number }[]; // points
}

function Thumb({ page, selected, onToggle, queue, label }: { page: number; selected: boolean; onToggle: () => void; queue: (p: number) => Promise<string | null>; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Page ${page}, ${label}${selected ? ", selected" : ""}`}
      className={clsx("group relative overflow-hidden rounded-[10px] border-2 bg-card text-left transition-colors", selected ? "border-orange" : "border-line hover:border-line-strong")}
    >
      <PdfThumb page={page} queue={queue} />
      <span className="flex items-center justify-between border-t border-line px-2 py-1 font-mono text-[0.7rem] text-ink-2">
        {page}
        <span className={clsx("grid size-4 place-items-center rounded-[4px] border", selected ? "border-orange bg-orange text-charcoal" : "border-line-strong")}>{selected && <Check aria-hidden className="size-3" />}</span>
      </span>
    </button>
  );
}

export default function PdfToImage() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [format, setFormat] = useState<ImageFormat>("image/jpeg");
  const [dpi, setDpi] = useState<number>(150);
  const [quality, setQuality] = useState(90);
  const [bg, setBg] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<(PageImage & { url: string })[]>([]);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);
  const cancelled = useRef(false);
  const queue = useThumbQueue(loaded?.doc ?? null, 120);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-to-jpg" });
  }, []);
  useEffect(() => () => loaded?.destroy(), [loaded]);
  // Revoke preview URLs when results are replaced or the tool unmounts.
  const resultsRef = useRef(results);
  useEffect(() => {
    const prev = resultsRef.current;
    resultsRef.current = results;
    const keep = new Set(results.map((r) => r.url));
    prev.forEach((r) => !keep.has(r.url) && URL.revokeObjectURL(r.url));
  }, [results]);
  useEffect(() => () => resultsRef.current.forEach((r) => URL.revokeObjectURL(r.url)), []);

  const open = async (files: File[]) => {
    const file = files[0];
    setError(null);
    if (!file) return;
    if (!isPdfFile(file)) return setError(`${file.name} isn't a PDF. Choose a file that ends in .pdf.`);
    if (file.size === 0) return setError(`${file.name} is empty.`);
    if (file.size > MAX_BYTES) return setError(`${file.name} is ${formatBytes(file.size)}. Your file is larger than the current processing limit of ${limits.pdfMaxMB} MB.`);
    setOpening(true);
    try {
      const { doc, destroy } = await openPdfjs(new Uint8Array(await file.arrayBuffer()), file.name);
      const sizes: { w: number; h: number }[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        const v = p.getViewport({ scale: 1 });
        sizes.push({ w: v.width, h: v.height });
        p.cleanup();
      }
      loaded?.destroy();
      setLoaded({ file, doc, destroy, sizes });
      setSelected(new Set(Array.from({ length: doc.numPages }, (_, i) => i + 1)));
      setRange("");
      setResults([]);
      setFailures([]);
      track("file_uploaded", { tool: "pdf-to-jpg", file_count: 1, size_bucket: sizeBucket(file.size) });
    } catch (e) {
      setError(e instanceof PdfError ? e.message : `${file.name} couldn't be opened. It may be damaged.`);
    } finally {
      setOpening(false);
    }
  };

  const pages = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);
  const total = loaded?.doc.numPages ?? 0;
  const plans = useMemo(() => (loaded ? pages.map((p) => planSize(loaded.sizes[p - 1].w, loaded.sizes[p - 1].h, dpi)) : []), [loaded, pages, dpi]);
  const totalMp = plans.reduce((a, p) => a + megapixels(p.width, p.height), 0);
  const capped = plans.some((p) => p.capped);
  const dimsLabel = useMemo(() => {
    const uniq = [...new Set(plans.map((p) => `${nf.format(p.width)} × ${nf.format(p.height)}`))];
    return uniq.length === 1 ? `${uniq[0]} px` : uniq.length ? `${uniq.length} different sizes (e.g. ${uniq[0]} px)` : "—";
  }, [plans]);
  const effectiveBg = format === "image/png" && transparent ? "transparent" : bg;
  const busy = !!progress;
  const rangeResult = range.trim() && total ? parsePageRanges(range, total) : null;

  const applyRange = () => {
    if (!rangeResult || "error" in rangeResult) return;
    setSelected(new Set(expandRanges(rangeResult.ranges)));
  };

  const convert = async () => {
    if (!loaded || !pages.length) return;
    cancelled.current = false;
    setWasCancelled(false);
    setResults([]);
    setFailures([]);
    setProgress({ done: 0, total: pages.length });
    const out: (PageImage & { url: string })[] = [];
    const fails: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      if (cancelled.current) break;
      try {
        const img = await renderPage(loaded.doc, pages[i], { dpi, format, quality: quality / 100, background: effectiveBg });
        out.push({ ...img, url: URL.createObjectURL(img.blob) });
        setResults([...out]);
      } catch (e) {
        fails.push(`Page ${pages[i]}: ${e instanceof Error && !/^[A-Z][a-z]+Error/.test(e.message) ? e.message : "couldn't be rendered."}`);
      }
      setProgress({ done: i + 1, total: pages.length });
      await new Promise((r) => setTimeout(r, 0)); // let the UI breathe between pages
    }
    setFailures(fails);
    setWasCancelled(cancelled.current && out.length + fails.length < pages.length);
    setProgress(null);
    track("content_generated", { tool: "pdf-to-jpg", format: format === "image/png" ? "png" : "jpg", count: out.length });
  };

  const base = loaded ? baseName(loaded.file.name) : "page";
  const totalBytes = results.reduce((a, r) => a + r.blob.size, 0);

  const reset = () => {
    cancelled.current = true;
    loaded?.destroy();
    setLoaded(null);
    setResults([]);
    setFailures([]);
    setError(null);
    setSelected(new Set());
  };

  if (!loaded)
    return (
      <div className="grid gap-4">
        <DropZone accept="application/pdf,.pdf" onFiles={open} title={opening ? "Opening PDF…" : "Drop a PDF here"} subtitle="or click to choose — pages are rendered in your browser" formats={["PDF", `up to ${limits.pdfMaxMB} MB`]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
      <Panel className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-ivory-2">
              <FileText aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium" title={loaded.file.name}>
                {loaded.file.name}
              </p>
              <p className="font-mono text-xs text-ink-2" data-testid="pdfimg-info">
                {formatBytes(loaded.file.size)} · {total} page{total === 1 ? "" : "s"} · {pages.length} selected
              </p>
            </div>
          </div>
          <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <RotateCcw aria-hidden className="size-4" /> Another PDF
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <button type="button" onClick={() => setSelected(new Set(Array.from({ length: total }, (_, i) => i + 1)))} className="h-9 rounded-[8px] border border-line-strong bg-card px-3 text-sm hover:border-charcoal">
            Select all
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="h-9 rounded-[8px] border border-line-strong bg-card px-3 text-sm hover:border-charcoal">
            Clear
          </button>
          <div className="flex min-w-0 flex-1 gap-1.5">
            <label htmlFor="pdfimg-range" className="sr-only">
              Page range
            </label>
            <input id="pdfimg-range" value={range} onChange={(e) => setRange(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyRange()} placeholder="Range, e.g. 1-3, 7" className={clsx(inputClass, "!h-9 min-w-0 flex-1 !w-auto font-mono text-sm")} />
            <button type="button" onClick={applyRange} disabled={!rangeResult || "error" in rangeResult} className="h-9 shrink-0 rounded-[8px] bg-charcoal px-3 text-sm text-ivory disabled:opacity-40">
              Select
            </button>
          </div>
        </div>
        {rangeResult && "error" in rangeResult && <p className="mt-1 text-xs text-error">{rangeResult.error}</p>}
        {rangeResult && !("error" in rangeResult) && <p className="mt-1 font-mono text-xs text-ink-2">Pages {formatPageList(expandRanges(rangeResult.ranges))}</p>}

        <div className="mt-4 grid max-h-[560px] grid-cols-3 gap-2.5 overflow-auto pr-1 sm:grid-cols-4 xl:grid-cols-5" data-testid="pdfimg-pages">
          {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
            <Thumb
              key={p}
              page={p}
              queue={queue}
              label={`${Math.round(loaded.sizes[p - 1].w)} × ${Math.round(loaded.sizes[p - 1].h)} pt`}
              selected={selected.has(p)}
              onToggle={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(p)) n.delete(p);
                  else n.add(p);
                  return n;
                })
              }
            />
          ))}
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-5 sm:p-6">
          <FieldLabel>Output format</FieldLabel>
          <Segmented
            label="Output format"
            value={format}
            onChange={(v) => setFormat(v as ImageFormat)}
            options={[
              { value: "image/jpeg", label: "JPG", hint: "smaller files" },
              { value: "image/png", label: "PNG", hint: "lossless" },
            ]}
          />
          <div className="mt-5">
            <FieldLabel>Resolution</FieldLabel>
            <Segmented label="Resolution" value={String(dpi)} onChange={(v) => setDpi(Number(v))} options={DPI_PRESETS.map((d) => ({ value: String(d), label: `${d} DPI`, hint: d === 72 ? "screen" : d === 150 ? "balanced" : "print" }))} />
          </div>
          {format === "image/jpeg" && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor="pdfimg-q">JPG quality</FieldLabel>
                <span className="font-mono text-sm">{quality}%</span>
              </div>
              <Range id="pdfimg-q" label="JPG quality" min={40} max={100} value={quality} onChange={setQuality} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} disabled={format === "image/png" && transparent} className="size-9 cursor-pointer rounded-[8px] border border-line-strong bg-card p-1 disabled:opacity-40" aria-label="Background colour" />
              Background
            </label>
            {format === "image/png" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="size-4 accent-[#F07845]" />
                Transparent where the page has no background
              </label>
            )}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm" data-testid="pdfimg-summary">
            <div className="rounded-[10px] bg-ivory px-3 py-2">
              <dt className="text-xs text-ink-2">Pages</dt>
              <dd className="font-mono">{pages.length ? formatPageList(pages) : "none"}</dd>
            </div>
            <div className="rounded-[10px] bg-ivory px-3 py-2">
              <dt className="text-xs text-ink-2">Output size</dt>
              <dd className="font-mono">{dimsLabel}</dd>
            </div>
          </dl>
          {capped && <p className="mt-2 text-xs text-[#8a5a10]">Some pages are very large at {dpi} DPI, so they&apos;re rendered at a lower resolution to stay within your browser&apos;s canvas limit.</p>}
          {totalMp > 400 && <p className="mt-2 text-xs text-[#8a5a10]">That&apos;s about {nf.format(Math.round(totalMp))} megapixels in total. It may take a while — pages are rendered one at a time to keep memory in check.</p>}
          {busy ? (
            <div className="mt-5 grid gap-2" role="status" aria-live="polite">
              <ProgressBar value={(progress!.done / progress!.total) * 100} label={`Rendering page ${Math.min(progress!.done + 1, progress!.total)} of ${progress!.total}…`} showLabel />
              <button
                type="button"
                onClick={() => {
                  cancelled.current = true;
                }}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-card text-sm font-medium hover:border-charcoal"
              >
                <Square aria-hidden className="size-3.5" /> Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!pages.length}
              onClick={convert}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal transition-colors hover:bg-[#ec6a34] disabled:opacity-40"
            >
              <ImageIcon aria-hidden className="size-4" /> Convert {pages.length} page{pages.length === 1 ? "" : "s"} to {format === "image/png" ? "PNG" : "JPG"}
            </button>
          )}
        </Panel>

        {(results.length > 0 || failures.length > 0) && (
          <Panel className="p-5 sm:p-6" >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold" data-testid="pdfimg-done">
                {results.length} image{results.length === 1 ? "" : "s"} · <span className="font-mono font-normal">{formatBytes(totalBytes)}</span>
              </p>
              <button
                type="button"
                disabled={busy || !results.length}
                onClick={() => {
                  downloadZip(results.map((r) => ({ name: outName(base, r.page, total, format), blob: r.blob })), `${base}-${format === "image/png" ? "png" : "jpg"}.zip`);
                  track("download_clicked", { tool: "pdf-to-jpg", format: "zip", count: results.length });
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-black disabled:opacity-40"
              >
                <Archive aria-hidden className="size-4" /> Download all (ZIP)
              </button>
            </div>
            {failures.length > 0 && (
              <div className="mt-3">
                <Notice tone="error">{failures.join(" ")}</Notice>
              </div>
            )}
            <ul className="mt-3 grid max-h-[420px] gap-2 overflow-auto" data-testid="pdfimg-results">
              {results.map((r) => (
                <li key={r.page} className="flex items-center gap-3 rounded-[10px] border border-line p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={`Page ${r.page} preview`} className="h-14 w-11 shrink-0 rounded-[4px] border border-line bg-[repeating-conic-gradient(#e8ded2_0_25%,#fff_0_50%)] bg-[length:10px_10px] object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs">{outName(base, r.page, total, format)}</p>
                    <p className="font-mono text-[0.7rem] text-ink-2">
                      {nf.format(r.width)} × {nf.format(r.height)} px · {r.dpi} DPI · {formatBytes(r.blob.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Download page ${r.page}`}
                    onClick={() => {
                      downloadBlob(r.blob, outName(base, r.page, total, format));
                      track("download_clicked", { tool: "pdf-to-jpg", format: format === "image/png" ? "png" : "jpg" });
                    }}
                    className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-line-strong hover:border-charcoal"
                  >
                    <Download className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {!busy && wasCancelled && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-2">
                <X aria-hidden className="size-3.5" /> Cancelled after {results.length} of {pages.length} pages.
              </p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
