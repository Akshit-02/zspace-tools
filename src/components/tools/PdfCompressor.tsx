"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Download, FileText, Info, Loader2, RotateCcw, Zap } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel, ProgressBar } from "./ui";
import { LEVELS, PdfError, type PdfLevel, type PdfProgress } from "@/lib/pdf-compress";
import { baseName, downloadBlob, formatBytes, formatPercent, percentSaved } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_BYTES = limits.pdfMaxMB * 1024 * 1024;

type State =
  | { kind: "idle" }
  | { kind: "ready"; file: File }
  | { kind: "working"; file: File; progress: PdfProgress }
  | { kind: "done"; file: File; blob: Blob; pages: number; imagesFound: number; imagesOptimised: number; level: PdfLevel }
  | { kind: "no-gain"; file: File; pages: number; imagesFound: number; imagesOptimised: number; level: PdfLevel; outSize: number }
  | { kind: "error"; file?: File; message: string };

function progressPct(p: PdfProgress) {
  if (p.phase === "reading") return 6;
  if (p.phase === "saving") return 94;
  return 10 + (p.total ? (p.done / p.total) * 80 : 80);
}

function progressText(p: PdfProgress) {
  if (p.phase === "reading") return "Reading document…";
  if (p.phase === "saving") return "Rebuilding PDF…";
  return p.total ? `Optimising image ${Math.min(p.done + 1, p.total)} of ${p.total}…` : "Optimising…";
}

export default function PdfCompressor() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [level, setLevel] = useState<PdfLevel>("medium");
  const runId = useRef(0);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-compressor" });
  }, []);

  const onFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) return setState({ kind: "error", message: `"${file.name}" isn't a PDF. Choose a file that ends in .pdf.` });
    if (file.size > MAX_BYTES) return setState({ kind: "error", message: `This PDF is larger than ${limits.pdfMaxMB} MB. Choose a smaller file.` });
    if (file.size === 0) return setState({ kind: "error", message: "This file is empty." });
    setState({ kind: "ready", file });
    track("file_uploaded", { tool: "pdf-compressor", file_count: 1, size_bucket: sizeBucket(file.size) });
  };

  const run = async (file: File) => {
    const id = ++runId.current;
    setState({ kind: "working", file, progress: { phase: "reading", done: 0, total: 1 } });
    try {
      const { compressPdf } = await import("@/lib/pdf-compress");
      const buffer = await file.arrayBuffer();
      const res = await compressPdf(buffer, level, (progress) => {
        if (runId.current === id) setState({ kind: "working", file, progress });
      });
      if (runId.current !== id) return;
      const common = { file, pages: res.pages, imagesFound: res.imagesFound, imagesOptimised: res.imagesOptimised, level };
      // Honesty check: only offer the result if it is genuinely smaller (≥ 1%).
      if (res.bytes.length >= file.size * 0.99) {
        setState({ kind: "no-gain", ...common, outSize: res.bytes.length });
      } else {
        setState({ kind: "done", ...common, blob: new Blob([res.bytes as BlobPart], { type: "application/pdf" }) });
        track("compression_completed", {
          tool: "pdf-compressor",
          level,
          size_bucket: sizeBucket(file.size),
          reduction_pct: Math.round(percentSaved(file.size, res.bytes.length)),
        });
      }
    } catch (e) {
      if (runId.current !== id) return;
      const message =
        e instanceof PdfError ? e.message : "Something went wrong while compressing this PDF. It may be damaged or too complex for your browser.";
      setState({ kind: "error", file, message });
    }
  };

  const reset = () => {
    runId.current++;
    setState({ kind: "idle" });
  };

  const file = "file" in state ? state.file : undefined;

  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-4">
        <AnimatePresence mode="wait" initial={false}>
          {!file ? (
            <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3">
              <DropZone
                accept="application/pdf,.pdf"
                onFiles={onFiles}
                title="Drop a PDF here"
                subtitle={`or click to browse · up to ${limits.pdfMaxMB} MB`}
                formats={["PDF"]}
              />
              {state.kind === "error" && <Notice tone="error">{state.message}</Notice>}
            </motion.div>
          ) : (
            <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Panel className="overflow-hidden">
                <div className="flex items-center gap-4 p-5 sm:p-6">
                  <span className="grid size-14 shrink-0 place-items-center rounded-[12px] bg-charcoal text-ivory">
                    <FileText aria-hidden className="size-6" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="mt-0.5 font-mono text-sm text-ink-2">{formatBytes(file.size, 2)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                  >
                    <RotateCcw aria-hidden className="size-3.5" /> Reset
                  </button>
                </div>

                <div className="border-t border-line bg-ivory/60 p-5 sm:p-6">
                  {state.kind === "working" && (
                    <div aria-live="polite">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Loader2 aria-hidden className="size-4 animate-spin text-orange" /> {progressText(state.progress)}
                      </p>
                      <div className="mt-3">
                        <ProgressBar value={progressPct(state.progress)} label="PDF compression progress" />
                      </div>
                      <p className="mt-3 text-xs text-ink-2">Large or image-heavy PDFs can take a minute. Everything happens on your device.</p>
                    </div>
                  )}

                  {state.kind === "ready" && (
                    <p className="flex items-center gap-2 text-sm text-ink-2">
                      <Info aria-hidden className="size-4" /> Choose a level, then press Compress PDF.
                    </p>
                  )}

                  {state.kind === "done" && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
                      <p className="flex items-center gap-2 text-sm font-medium text-success">
                        <CheckCircle2 aria-hidden className="size-4" /> Compressed successfully
                      </p>
                      <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
                        <p className="font-mono text-[2.6rem] leading-none tracking-tight">
                          {formatPercent(percentSaved(state.file.size, state.blob.size))}
                        </p>
                        <dl className="grid grid-cols-2 gap-x-6 font-mono text-sm">
                          <dt className="font-sans text-xs text-ink-2">Before</dt>
                          <dt className="font-sans text-xs text-ink-2">After</dt>
                          <dd>{formatBytes(state.file.size, 2)}</dd>
                          <dd className="text-charcoal">{formatBytes(state.blob.size, 2)}</dd>
                        </dl>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
                        <motion.div
                          className="h-full rounded-full bg-charcoal"
                          initial={{ width: "100%" }}
                          animate={{ width: `${(state.blob.size / state.file.size) * 100}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <p className="mt-3 font-mono text-xs text-ink-2">
                        {state.pages} {state.pages === 1 ? "page" : "pages"} · {state.imagesOptimised} of {state.imagesFound} images optimised ·{" "}
                        {LEVELS[state.level].label.toLowerCase()} level
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          downloadBlob(state.blob, `${baseName(state.file.name)}-compressed.pdf`);
                          track("download_clicked", { tool: "pdf-compressor", level: state.level });
                        }}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal transition-colors hover:bg-[#ec6a34] sm:w-auto sm:px-6"
                      >
                        <Download aria-hidden className="size-4" /> Download compressed PDF
                      </button>
                    </motion.div>
                  )}

                  {state.kind === "no-gain" && (
                    <Notice>
                      <p className="font-medium">This PDF couldn&rsquo;t be made meaningfully smaller at the {LEVELS[state.level].label.toLowerCase()} level.</p>
                      <p className="mt-1 text-ink-2">
                        {state.imagesFound === 0
                          ? "It contains no embedded images to optimise — it's mostly text or vector graphics, which are already compact."
                          : state.imagesOptimised === 0
                            ? `Its ${state.imagesFound} image${state.imagesFound === 1 ? " is" : "s are"} already well compressed or stored in a format that can't be safely re-encoded (such as CMYK).`
                            : `The best result was ${formatBytes(state.outSize, 2)}, which isn't smaller than your original.`}{" "}
                        {state.level !== "high" && state.imagesFound > 0 && "You could try the High level."} Your original file is already the best version.
                      </p>
                    </Notice>
                  )}

                  {state.kind === "error" && <Notice tone="error">{state.message}</Notice>}
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level picker */}
      <Panel className="p-5 sm:p-6">
        <p className="text-sm font-bold">Compression level</p>
        <div role="radiogroup" aria-label="Compression level" className="mt-4 grid gap-2">
          {(Object.keys(LEVELS) as PdfLevel[]).map((key) => {
            const l = LEVELS[key];
            const active = level === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={state.kind === "working"}
                onClick={() => setLevel(key)}
                className={clsx(
                  "flex items-center gap-4 rounded-[12px] border px-4 py-3.5 text-left transition-colors disabled:opacity-50",
                  active ? "border-charcoal bg-card shadow-[0_0_0_3px_rgba(240,120,69,0.15)]" : "border-line bg-card hover:border-line-strong",
                )}
              >
                <span className={clsx("grid size-5 shrink-0 place-items-center rounded-full border-2", active ? "border-orange" : "border-line-strong")}>
                  {active && <span className="size-2 rounded-full bg-orange" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {l.label}
                    {key === "medium" && <span className="rounded-[6px] bg-orange-wash px-1.5 py-0.5 text-[0.68rem] font-medium text-orange-ink">{l.hint}</span>}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-2">
                    ≤{l.maxDim}px · JPEG {Math.round(l.quality * 100)}%
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => file && run(file)}
          disabled={!file || state.kind === "working"}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
        >
          {state.kind === "working" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Zap aria-hidden className="size-4" />}
          {state.kind === "done" || state.kind === "no-gain" ? "Compress again" : "Compress PDF"}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-ink-2">
          Only photos and scans inside the PDF are re-compressed. Text, fonts, links and vector graphics stay exactly as they are.
        </p>
      </Panel>
    </div>
  );
}
