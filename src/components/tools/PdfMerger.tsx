"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle2, Combine, Download, ExternalLink, FileText, Loader2, RotateCcw, X } from "lucide-react";
import { DownloadButton, DropZone, FieldLabel, Metric, Notice, Panel, ProgressBar, RejectionNotice } from "./ui";
import { SortableList } from "./SortableList";
import { validateFiles, fileId } from "@/lib/files";
import { PdfError, isPdfFile, loadPdf, setProducer, tick } from "@/lib/pdf-utils";
import { firstPageThumb } from "@/lib/pdf-render";
import { downloadBlob, formatBytes, openBlob } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

interface Entry {
  id: string;
  file: File;
  status: "reading" | "ready" | "error";
  pages?: number;
  error?: string;
  thumb?: string | null;
}

type Result = { blob: Blob; url: string; pages: number; files: number };

const MAX_BYTES = limits.pdfMaxMB * 1024 * 1024;
const MAX_TOTAL = limits.mergeMaxMB * 1024 * 1024;

const cleanName = (n: string) => (n.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\.pdf$/i, "") || "merged") + ".pdf";

export default function PdfMerger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("merged");
  const entriesRef = useRef(entries);
  const resultRef = useRef(result);

  useEffect(() => {
    entriesRef.current = entries;
    resultRef.current = result;
  });
  useEffect(() => {
    track("tool_opened", { tool: "pdf-merger" });
    return () => {
      entriesRef.current.forEach((e) => e.thumb && URL.revokeObjectURL(e.thumb));
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    };
  }, []);

  /** Any change to the file set invalidates a previous merge. */
  const invalidate = () => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    setResult(null);
    setError(null);
  };

  const patch = (id: string, p: Partial<Entry>) => setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const inspect = async (entry: Entry) => {
    try {
      const bytes = new Uint8Array(await entry.file.arrayBuffer());
      const doc = await loadPdf(bytes, `"${entry.file.name}"`);
      patch(entry.id, { status: "ready", pages: doc.getPageCount() });
      const thumb = await firstPageThumb(bytes, 72);
      if (entriesRef.current.some((e) => e.id === entry.id)) patch(entry.id, { thumb });
      else if (thumb) URL.revokeObjectURL(thumb);
    } catch (e) {
      patch(entry.id, { status: "error", error: e instanceof PdfError ? e.message : "This PDF couldn't be read." });
    }
  };

  const addFiles = (files: File[]) => {
    const current = entriesRef.current;
    const { accepted, rejected } = validateFiles(files, {
      accept: isPdfFile,
      kindLabel: "PDF file",
      maxBytes: MAX_BYTES,
      maxCount: limits.maxPdfFiles,
      current: current.length,
    });
    let total = current.reduce((s, e) => s + e.file.size, 0);
    const fit: File[] = [];
    for (const f of accepted) {
      if (total + f.size > MAX_TOTAL) rejected.push(`${f.name}: would take the total over ${limits.mergeMaxMB} MB.`);
      else {
        total += f.size;
        fit.push(f);
      }
    }
    setRejections(rejected);
    if (!fit.length) return;
    invalidate();
    const added: Entry[] = fit.map((file) => ({ id: fileId("pdf"), file, status: "reading" }));
    setEntries((list) => [...list, ...added]);
    track("file_uploaded", { tool: "pdf-merger", file_count: added.length });
    // Inspect one at a time to keep memory steady.
    void (async () => {
      for (const e of added) await inspect(e);
    })();
  };

  const remove = (id: string) => {
    const e = entriesRef.current.find((x) => x.id === id);
    if (e?.thumb) URL.revokeObjectURL(e.thumb);
    setEntries((list) => list.filter((x) => x.id !== id));
    invalidate();
  };

  const reset = () => {
    entriesRef.current.forEach((e) => e.thumb && URL.revokeObjectURL(e.thumb));
    setEntries([]);
    setRejections([]);
    invalidate();
    setName("merged");
  };

  const ready = entries.filter((e) => e.status === "ready");
  const reading = entries.some((e) => e.status === "reading");
  const totalPages = ready.reduce((s, e) => s + (e.pages ?? 0), 0);

  const merge = async () => {
    invalidate();
    const files = ready;
    setProgress({ done: 0, total: files.length });
    try {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const src = await loadPdf(new Uint8Array(await files[i].file.arrayBuffer()), `"${files[i].file.name}"`);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        setProgress({ done: i + 1, total: files.length });
        await tick();
      }
      setProducer(out, cleanName(name).replace(/\.pdf$/, ""));
      const bytes = await out.save({ useObjectStreams: true });
      // Verify before claiming success: the output must re-open with every page.
      const check = await PDFDocument.load(bytes);
      if (check.getPageCount() !== totalPages) throw new Error(`Expected ${totalPages} pages but the merged file has ${check.getPageCount()}.`);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setResult({ blob, url: URL.createObjectURL(blob), pages: check.getPageCount(), files: files.length });
      track("compression_completed", { tool: "pdf-merger", file_count: files.length, size_bucket: sizeBucket(blob.size) });
    } catch (e) {
      setError(
        e instanceof PdfError
          ? e.message
          : e instanceof RangeError
            ? "Your device ran out of memory while merging. Try fewer or smaller files."
            : `The PDFs couldn't be merged. ${e instanceof Error ? e.message : ""}`.trim(),
      );
    } finally {
      setProgress(null);
    }
  };

  const merging = progress !== null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
      <div className="grid content-start gap-3">
        <DropZone
          compact={entries.length > 0}
          accept="application/pdf,.pdf"
          multiple
          onFiles={addFiles}
          title={entries.length ? "Add more PDFs" : "Drop PDF files here"}
          subtitle={entries.length ? `${entries.length} of ${limits.maxPdfFiles} files` : `or click to browse · up to ${limits.maxPdfFiles} files, ${limits.pdfMaxMB} MB each`}
          formats={["PDF"]}
        />
        <RejectionNotice list={rejections} onClose={() => setRejections([])} />
        {entries.length > 0 && (
          <>
            <p className="flex items-center justify-between px-1 text-sm text-ink-2">
              <span>Drag to reorder — pages are merged top to bottom.</span>
              <span className="font-mono text-xs">{entries.length} files</span>
            </p>
            <SortableList
              items={entries}
              onReorder={(next) => {
                setEntries(next);
                invalidate();
              }}
              label="PDF files in merge order"
              itemLabel={(e) => e.file.name}
            >
              {(e, i) => (
                <div className="flex min-w-0 items-center gap-3 py-1">
                  <span className="relative grid h-14 w-11 shrink-0 place-items-center overflow-hidden rounded-[6px] border border-line bg-ivory">
                    {e.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.thumb} alt="" className="size-full object-cover object-top" />
                    ) : (
                      <FileText aria-hidden className="size-5 text-ink-3" strokeWidth={1.5} />
                    )}
                    <span className="absolute bottom-0 left-0 rounded-tr-[5px] bg-charcoal px-1 font-mono text-[0.6rem] text-ivory">{i + 1}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.95rem] font-medium">{e.file.name}</p>
                    <p className="mt-0.5 font-mono text-[0.75rem] text-ink-2">
                      {e.status === "reading" && "reading…"}
                      {e.status === "ready" && `${e.pages} ${e.pages === 1 ? "page" : "pages"} · ${formatBytes(e.file.size)}`}
                      {e.status === "error" && formatBytes(e.file.size)}
                    </p>
                    {e.status === "error" && (
                      <p className="mt-0.5 flex items-start gap-1 text-xs text-error">
                        <AlertCircle aria-hidden className="mt-px size-3.5 shrink-0" /> {e.error} It will be skipped.
                      </p>
                    )}
                  </div>
                  {e.status === "ready" && (
                    <button
                      type="button"
                      onClick={() => openBlob(e.file)}
                      aria-label={`Preview ${e.file.name} in a new tab`}
                      className="hidden size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal sm:grid"
                    >
                      <ExternalLink className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    aria-label={`Remove ${e.file.name}`}
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

      {/* Merge panel */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="p-5 sm:p-6">
          <dl className="grid grid-cols-2 gap-2.5">
            <Metric label="Files ready" value={`${ready.length}${entries.length !== ready.length ? ` / ${entries.length}` : ""}`} />
            <Metric label="Total pages" value={totalPages || "—"} />
          </dl>
          <div className="mt-5">
            <FieldLabel htmlFor="merge-name">File name</FieldLabel>
            <div className="flex h-11 items-center rounded-[10px] border border-line-strong bg-card pr-3 focus-within:border-charcoal">
              <input id="merge-name" value={name} onChange={(e) => setName(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3.5 outline-none" />
              <span className="font-mono text-sm text-ink-2">.pdf</span>
            </div>
          </div>
          <button
            type="button"
            onClick={merge}
            disabled={ready.length < 2 || reading || merging}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
          >
            {merging ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Combine aria-hidden className="size-4" />}
            Merge PDFs
          </button>
          {ready.length < 2 && !merging && <p className="mt-2 text-center text-xs text-ink-2">Add at least two readable PDFs to merge.</p>}

          <AnimatePresence>
            {merging && progress && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5" aria-live="polite">
                <p className="text-sm">
                  Merging file {Math.min(progress.done + 1, progress.total)} of {progress.total}…
                </p>
                <div className="mt-2">
                  <ProgressBar value={(progress.done / progress.total) * 100} label="Merge progress" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-5">
              <Notice tone="error">{error}</Notice>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[14px] border border-success/30 bg-[#f1f7f3] p-4" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 aria-hidden className="size-4" /> Merged successfully
              </p>
              <p className="mt-2 truncate font-medium">{cleanName(name)}</p>
              <p className="mt-0.5 font-mono text-sm text-ink-2">
                {result.pages} pages · {result.files} files · {formatBytes(result.blob.size, 2)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <DownloadButton
                  onClick={() => {
                    downloadBlob(result.blob, cleanName(name));
                    track("download_clicked", { tool: "pdf-merger" });
                  }}
                >
                  <Download aria-hidden className="size-4" /> Download PDF
                </DownloadButton>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-line-strong bg-card px-4 font-medium transition-colors hover:border-charcoal"
                >
                  <ExternalLink aria-hidden className="size-4" /> Preview
                </a>
              </div>
            </motion.div>
          )}

          {entries.length > 0 && (
            <button type="button" onClick={reset} className="mt-4 inline-flex w-full items-center justify-center gap-2 py-2 text-sm text-ink-2 hover:text-charcoal">
              <RotateCcw aria-hidden className="size-3.5" /> Reset
            </button>
          )}
          <p className="mt-3 text-xs leading-relaxed text-ink-2">Pages are copied exactly — text, images and links on each page are kept. Bookmarks and form fields aren&rsquo;t carried over.</p>
        </Panel>
      </div>
    </div>
  );
}
