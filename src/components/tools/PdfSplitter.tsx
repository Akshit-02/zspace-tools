"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Archive, Check, CheckCircle2, Download, ExternalLink, FileText, Loader2, RotateCcw, Scissors } from "lucide-react";
import { clsx } from "clsx";
import { DownloadButton, DropZone, FieldLabel, Notice, Panel, ProgressBar, Segmented, Toggle } from "./ui";
import { PdfError, expandRanges, extractPages, formatPageList, isPdfFile, loadPdf, parsePageRanges, rangeLabel, setProducer, tick, type PageRange } from "@/lib/pdf-utils";
import { openForRender, type RenderDoc } from "@/lib/pdf-render";
import { baseName, downloadBlob, formatBytes, openBlob } from "@/lib/format";
import { downloadZip } from "@/lib/zip";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";
import type { PDFDocument } from "pdf-lib";

type Mode = "extract" | "every" | "groups";

interface Loaded {
  file: File;
  doc: PDFDocument;
  pageCount: number;
}

interface OutFile {
  name: string;
  label: string;
  pages: number;
  blob: Blob;
}

const MAX_BYTES = limits.pdfMaxMB * 1024 * 1024;

/** Lazily rendered page thumbnail — only draws when scrolled into view. */
function PageThumb({
  render,
  page,
  selected,
  selectable,
  onToggle,
}: {
  render: RenderDoc | null;
  page: number;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!render || !ref.current) return;
    let alive = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        render
          .thumb(page, 120)
          .then((url) => alive && setSrc(url))
          .catch(() => alive && setFailed(true));
      },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [render, page]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      disabled={!selectable}
      aria-pressed={selectable ? selected : undefined}
      aria-label={`Page ${page}${selectable ? (selected ? ", selected" : ", not selected") : ""}`}
      className={clsx(
        "group relative flex flex-col items-center gap-1.5 rounded-[10px] p-1.5 text-center transition-colors disabled:cursor-default",
        selectable && (selected ? "bg-orange-wash" : "hover:bg-ivory-2"),
      )}
    >
      <span
        className={clsx(
          "relative grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-[6px] border bg-card transition-[border-color,box-shadow]",
          selected && selectable ? "border-orange shadow-[0_0_0_2px_rgba(240,120,69,0.5)]" : "border-line",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-contain" />
        ) : failed ? (
          <FileText aria-hidden className="size-6 text-ink-3" strokeWidth={1.4} />
        ) : (
          <span aria-hidden className="size-full animate-pulse bg-ivory" />
        )}
        {selectable && (
          <span
            className={clsx(
              "absolute right-1 top-1 grid size-5 place-items-center rounded-[6px] border transition-colors",
              selected ? "border-orange bg-orange text-charcoal" : "border-line-strong bg-card/90 text-transparent group-hover:border-charcoal",
            )}
          >
            <Check aria-hidden className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={clsx("font-mono text-[0.72rem]", selected && selectable ? "text-orange-ink" : "text-ink-2")}>{page}</span>
    </button>
  );
}

export default function PdfSplitter() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [render, setRender] = useState<RenderDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("extract");
  const [rangeText, setRangeText] = useState("");
  const [separate, setSeparate] = useState(false);
  const [groupSize, setGroupSize] = useState("2");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<OutFile[] | null>(null);
  const [zipping, setZipping] = useState(false);
  const renderRef = useRef(render);

  useEffect(() => {
    renderRef.current = render;
  }, [render]);
  useEffect(() => {
    track("tool_opened", { tool: "pdf-splitter" });
    return () => renderRef.current?.destroy();
  }, []);

  const onFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    setResults(null);
    if (!isPdfFile(file)) return setError(`"${file.name}" isn't a PDF. Choose a file that ends in .pdf.`);
    if (file.size > MAX_BYTES) return setError(`This PDF is larger than ${limits.pdfMaxMB} MB. Choose a smaller file.`);
    if (file.size === 0) return setError("This file is empty.");
    setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await loadPdf(bytes, `"${file.name}"`);
      renderRef.current?.destroy();
      setLoaded({ file, doc, pageCount: doc.getPageCount() });
      setRangeText("");
      track("file_uploaded", { tool: "pdf-splitter", file_count: 1, size_bucket: sizeBucket(file.size) });
      // Thumbnails are a nicety: failure to render must not block splitting.
      openForRender(bytes)
        .then(setRender)
        .catch(() => setRender(null));
    } catch (e) {
      setError(e instanceof PdfError ? e.message : "This PDF couldn't be opened.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    renderRef.current?.destroy();
    setRender(null);
    setLoaded(null);
    setResults(null);
    setError(null);
    setRangeText("");
  };

  const pageCount = loaded?.pageCount ?? 0;
  const parsed = useMemo(() => (loaded && rangeText.trim() ? parsePageRanges(rangeText, pageCount) : null), [rangeText, pageCount, loaded]);
  const selectedPages = useMemo(() => new Set(parsed && "ranges" in parsed ? expandRanges(parsed.ranges) : []), [parsed]);
  const groupN = Math.floor(Number(groupSize));
  const groupValid = Number.isFinite(groupN) && groupN >= 1 && groupN <= Math.max(1, pageCount);

  const togglePage = (p: number) => {
    const next = new Set(selectedPages);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setRangeText(formatPageList([...next]));
    setResults(null);
  };

  /** What the current settings will produce, for the summary and button. */
  const plan: { label: string; pages: number[] }[] | { error: string } = useMemo(() => {
    if (!loaded) return [];
    if (mode === "every") return Array.from({ length: pageCount }, (_, i) => ({ label: `page ${i + 1}`, pages: [i + 1] }));
    if (mode === "groups") {
      if (!groupValid) return { error: `Enter a group size between 1 and ${pageCount}.` };
      const out = [];
      for (let s = 1; s <= pageCount; s += groupN) {
        const e = Math.min(pageCount, s + groupN - 1);
        out.push({ label: rangeLabel([s, e]), pages: Array.from({ length: e - s + 1 }, (_, i) => s + i) });
      }
      return out;
    }
    if (!parsed) return { error: "Select pages above, or type them — for example 1, 3, 5-8." };
    if ("error" in parsed) return { error: parsed.error };
    if (separate) return parsed.ranges.map((r: PageRange) => ({ label: rangeLabel(r), pages: expandRanges([r]) }));
    const pages = expandRanges(parsed.ranges);
    return [{ label: `pages ${formatPageList(pages)}`, pages }];
  }, [loaded, mode, pageCount, groupValid, groupN, parsed, separate]);

  const split = async () => {
    if (!loaded || "error" in plan || !plan.length) return;
    setResults(null);
    setProgress({ done: 0, total: plan.length });
    const base = baseName(loaded.file.name);
    try {
      const out: OutFile[] = [];
      for (let i = 0; i < plan.length; i++) {
        const part = plan[i];
        const doc = await extractPages(loaded.doc, part.pages);
        setProducer(doc);
        const bytes = await doc.save({ useObjectStreams: true });
        if (doc.getPageCount() !== part.pages.length) throw new Error("A split file came out with the wrong number of pages.");
        const suffix =
          mode === "groups" ? `part-${i + 1}-${part.label.replace(/^pages? /, "p")}` : part.pages.length === 1 ? `page-${part.pages[0]}` : part.label.replace(/^pages /, "pages-").replace(/,\s*/g, "_");
        out.push({ name: `${base}-${suffix.replace(/\s+/g, "")}.pdf`, label: part.label, pages: part.pages.length, blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) });
        setProgress({ done: i + 1, total: plan.length });
        if (i % 5 === 4) await tick();
      }
      setResults(out);
      track("compression_completed", { tool: "pdf-splitter", count: out.length, level: mode });
    } catch (e) {
      setError(e instanceof RangeError ? "Your device ran out of memory. Try splitting into fewer files." : `The PDF couldn't be split. ${e instanceof Error ? e.message : ""}`.trim());
    } finally {
      setProgress(null);
    }
  };

  if (!loaded) {
    return (
      <div className="grid gap-3">
        <DropZone accept="application/pdf,.pdf" onFiles={onFiles} title={loading ? "Opening PDF…" : "Drop a PDF here"} subtitle={`or click to browse · up to ${limits.pdfMaxMB} MB`} formats={["PDF"]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );
  }

  const planError = "error" in plan ? plan.error : null;
  const parts = "error" in plan ? [] : plan;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] [&>*]:min-w-0">
      {/* Pages */}
      <Panel className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-charcoal text-ivory">
            <FileText aria-hidden className="size-5" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{loaded.file.name}</p>
            <p className="font-mono text-xs text-ink-2">
              {pageCount} {pageCount === 1 ? "page" : "pages"} · {formatBytes(loaded.file.size, 2)}
            </p>
          </div>
          <button type="button" onClick={() => openBlob(loaded.file)} className="hidden h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal sm:inline-flex">
            <ExternalLink aria-hidden className="size-4" /> Open
          </button>
          <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <RotateCcw aria-hidden className="size-3.5" /> Reset
          </button>
        </div>
        {mode === "extract" && (
          <div className="flex items-center justify-between gap-3 border-b border-line bg-ivory/60 px-4 py-2 text-sm sm:px-5">
            <span className="text-ink-2">Click pages to select them</span>
            <span className="flex gap-1">
              <button type="button" className="rounded-[8px] px-2 py-1 text-ink-2 hover:bg-card hover:text-charcoal" onClick={() => setRangeText(`1-${pageCount}`)}>
                All
              </button>
              <button type="button" className="rounded-[8px] px-2 py-1 text-ink-2 hover:bg-card hover:text-charcoal" onClick={() => setRangeText("")}>
                None
              </button>
            </span>
          </div>
        )}
        <div className="grid max-h-[620px] grid-cols-3 gap-1 overflow-y-auto p-3 sm:grid-cols-4 sm:p-4 xl:grid-cols-5">
          {Array.from({ length: pageCount }, (_, i) => (
            <PageThumb key={i} render={render} page={i + 1} selectable={mode === "extract"} selected={selectedPages.has(i + 1)} onToggle={() => togglePage(i + 1)} />
          ))}
        </div>
      </Panel>

      {/* Controls */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="p-5 sm:p-6">
          <FieldLabel>Split mode</FieldLabel>
          <Segmented
            label="Split mode"
            size="sm"
            value={mode}
            onChange={(v) => {
              setMode(v as Mode);
              setResults(null);
            }}
            options={[
              { value: "extract", label: "Extract pages" },
              { value: "every", label: "Every page" },
              { value: "groups", label: "Groups of N" },
            ]}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="mt-5">
              {mode === "extract" && (
                <div className="grid gap-4">
                  <div>
                    <FieldLabel htmlFor="split-ranges" hint={selectedPages.size ? `${selectedPages.size} selected` : undefined}>
                      Pages to extract
                    </FieldLabel>
                    <input
                      id="split-ranges"
                      value={rangeText}
                      onChange={(e) => {
                        setRangeText(e.target.value);
                        setResults(null);
                      }}
                      placeholder="e.g. 1, 3, 5-8"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={Boolean(parsed && "error" in parsed)}
                      aria-describedby="split-ranges-help"
                      className={clsx(
                        "h-12 w-full rounded-[10px] border bg-card px-3.5 font-mono text-[1.02rem] outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]",
                        parsed && "error" in parsed ? "border-error" : "border-line-strong focus:border-charcoal",
                      )}
                    />
                    <p id="split-ranges-help" className="mt-1.5 text-xs text-ink-2">
                      Commas separate pages, hyphens make ranges. <span className="font-mono">10-</span> means page 10 to the end.
                    </p>
                  </div>
                  <Toggle checked={separate} onChange={setSeparate} label="One PDF per range" description={separate ? "e.g. 1-3, 7-9 → 2 files" : "All selected pages → 1 file"} />
                </div>
              )}
              {mode === "every" && <p className="text-sm text-ink-2">Each of the {pageCount} pages becomes its own PDF file.</p>}
              {mode === "groups" && (
                <div>
                  <FieldLabel htmlFor="split-n">Pages per file</FieldLabel>
                  <input
                    id="split-n"
                    inputMode="numeric"
                    value={groupSize}
                    onChange={(e) => {
                      setGroupSize(e.target.value.replace(/[^\d]/g, "").slice(0, 5));
                      setResults(null);
                    }}
                    className="h-12 w-full rounded-[10px] border border-line-strong bg-card px-3.5 font-mono text-lg outline-none focus:border-charcoal"
                  />
                  {groupValid && pageCount % groupN !== 0 && (
                    <p className="mt-1.5 text-xs text-ink-2">
                      The last file will have {pageCount % groupN} {pageCount % groupN === 1 ? "page" : "pages"}.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 rounded-[12px] bg-ivory px-4 py-3 text-sm">
            {planError ? (
              <p className="text-[#8f2f27]" role="alert">
                {planError}
              </p>
            ) : (
              <p>
                Creates <span className="font-mono font-medium">{parts.length}</span> {parts.length === 1 ? "PDF" : "PDFs"}
                {parts.length === 1 && <span className="text-ink-2"> · {parts[0].pages.length} pages</span>}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={split}
            disabled={Boolean(planError) || !parts.length || progress !== null}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
          >
            {progress ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Scissors aria-hidden className="size-4" />} Split PDF
          </button>

          {progress && (
            <div className="mt-4" aria-live="polite">
              <p className="text-sm">
                Creating file {Math.min(progress.done + 1, progress.total)} of {progress.total}…
              </p>
              <div className="mt-2">
                <ProgressBar value={(progress.done / progress.total) * 100} label="Split progress" />
              </div>
            </div>
          )}
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          {results && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 aria-hidden className="size-4" /> {results.length} {results.length === 1 ? "PDF" : "PDFs"} created
              </p>
              <ul className="mt-3 max-h-64 divide-y divide-line overflow-y-auto rounded-[12px] border border-line">
                {results.map((r) => (
                  <li key={r.name} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="font-mono text-[0.72rem] text-ink-2">
                        {r.pages} {r.pages === 1 ? "page" : "pages"} · {formatBytes(r.blob.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        downloadBlob(r.blob, r.name);
                        track("download_clicked", { tool: "pdf-splitter", file_count: 1 });
                      }}
                      aria-label={`Download ${r.name}`}
                      className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-line transition-colors hover:border-charcoal"
                    >
                      <Download className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {results.length > 1 && (
                <DownloadButton
                  className="mt-3 w-full"
                  disabled={zipping}
                  onClick={async () => {
                    setZipping(true);
                    try {
                      await downloadZip(results.map((r) => ({ name: r.name, blob: r.blob })), `${baseName(loaded.file.name)}-split.zip`);
                      track("download_clicked", { tool: "pdf-splitter", format: "zip", file_count: results.length });
                    } finally {
                      setZipping(false);
                    }
                  }}
                >
                  {zipping ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Archive aria-hidden className="size-4" />} Download all (ZIP)
                </DownloadButton>
              )}
            </motion.div>
          )}
        </Panel>
      </div>
    </div>
  );
}
