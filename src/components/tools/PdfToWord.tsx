"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, Info, RotateCcw, ScanText, Square, WandSparkles } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel, ProgressBar, Toggle } from "./ui";
import { openPdfjs } from "@/lib/pdf-render";
import { renderThumb } from "@/lib/pdf-images";
import { CancelledError, pdfToDocx, scanSummary, type ConvertStats } from "@/lib/pdf-to-docx";
import { OCR_LANGS, type LangCode } from "@/lib/ocr";
import { PdfError, isPdfFile } from "@/lib/pdf-utils";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";
import type { PDFDocumentProxy } from "pdfjs-dist";

const MAX_BYTES = Math.min(limits.pdfMaxMB, 60) * 1024 * 1024;
const MAX_PAGES = 300;

interface Loaded {
  file: File;
  doc: PDFDocumentProxy;
  lib: typeof import("pdfjs-dist");
  destroy: () => void;
  thumb: string | null;
  scan: { checked: number; textPages: number; scanned: number };
}

export default function PdfToWord() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocr, setOcr] = useState(false);
  const [langs, setLangs] = useState<LangCode[]>(["eng"]);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; stats: ConvertStats } | null>(null);
  const signal = useRef({ cancelled: false });

  useEffect(() => {
    track("tool_opened", { tool: "pdf-to-word" });
  }, []);
  useEffect(
    () => () => {
      if (loaded) {
        loaded.destroy();
        if (loaded.thumb) URL.revokeObjectURL(loaded.thumb);
      }
    },
    [loaded],
  );

  const open = async (files: File[]) => {
    const file = files[0];
    setError(null);
    setResult(null);
    if (!file) return;
    if (!isPdfFile(file)) return setError(`${file.name} isn't a PDF. Choose a file that ends in .pdf.`);
    if (file.size === 0) return setError(`${file.name} is empty.`);
    if (file.size > MAX_BYTES) return setError(`${file.name} is ${formatBytes(file.size)}. Your file is larger than the current processing limit of ${MAX_BYTES / 1048576} MB.`);
    setOpening(true);
    try {
      const { doc, lib, destroy } = await openPdfjs(new Uint8Array(await file.arrayBuffer()), file.name);
      if (doc.numPages > MAX_PAGES) {
        destroy();
        throw new PdfError("memory", `${file.name} has ${doc.numPages} pages. The limit for converting in your browser is ${MAX_PAGES} pages — split it first with the PDF Splitter.`);
      }
      const [thumb, scan] = await Promise.all([renderThumb(doc, 1, 220).catch(() => null), scanSummary(doc)]);
      setLoaded({ file, doc, lib, destroy, thumb, scan });
      setOcr(scan.scanned > 0 && scan.scanned >= scan.textPages);
      track("file_uploaded", { tool: "pdf-to-word", file_count: 1, size_bucket: sizeBucket(file.size) });
    } catch (e) {
      setError(e instanceof PdfError ? e.message : `${file.name} couldn't be opened. It may be damaged.`);
    } finally {
      setOpening(false);
    }
  };

  const convert = async () => {
    if (!loaded) return;
    signal.current = { cancelled: false };
    setError(null);
    setResult(null);
    setProgress({ done: 0, total: loaded.doc.numPages, label: "Starting…" });
    try {
      const r = await pdfToDocx(loaded.doc, loaded.lib, { ocr, ocrLangs: langs, signal: signal.current, onProgress: (done, total, label) => setProgress({ done, total, label }) });
      if (r.stats.chars === 0 && r.stats.images === 0) {
        setError("No text or images could be found in this PDF, so there's nothing to put in a Word document. If it's a scan, turn on OCR and try again.");
      } else {
        setResult(r);
        track("content_generated", { tool: "pdf-to-word", format: ocr ? "docx-ocr" : "docx", count: loaded.doc.numPages });
      }
    } catch (e) {
      if (!(e instanceof CancelledError)) setError("The conversion failed partway through. The PDF may use features we can't read — try another copy, or print it to a new PDF first.");
    } finally {
      setProgress(null);
    }
  };

  const reset = () => {
    signal.current.cancelled = true;
    setLoaded(null);
    setResult(null);
    setError(null);
  };

  if (!loaded)
    return (
      <div className="grid gap-4">
        <DropZone accept="application/pdf,.pdf" onFiles={open} title={opening ? "Opening PDF…" : "Drop a PDF here"} subtitle="or click to choose — converted to Word on your device" formats={["PDF", `up to ${MAX_BYTES / 1048576} MB`, `${MAX_PAGES} pages`]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const s = result?.stats;
  const busy = !!progress;
  const name = `${baseName(loaded.file.name)}.docx`;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6">
        <div className="grid place-items-center rounded-[12px] border border-line bg-ivory p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {loaded.thumb ? <img src={loaded.thumb} alt="First page preview" className="max-h-[300px] rounded-[4px] border border-line bg-white shadow-sm" /> : <FileText aria-hidden className="size-12 text-ink-3" />}
        </div>
        <p className="mt-4 truncate font-medium" title={loaded.file.name}>
          {loaded.file.name}
        </p>
        <p className="font-mono text-xs text-ink-2" data-testid="p2w-info">
          {formatBytes(loaded.file.size)} · {loaded.doc.numPages} page{loaded.doc.numPages === 1 ? "" : "s"}
          {loaded.scan.scanned > 0 && ` · ${loaded.scan.scanned} of ${loaded.scan.checked} checked pages look scanned`}
        </p>
        <button type="button" onClick={reset} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
          <RotateCcw aria-hidden className="size-4" /> Convert another file
        </button>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-5 sm:p-6">
          {loaded.scan.scanned > 0 ? (
            <div className="rounded-[12px] border border-[#e5c98f] bg-[#fdf6e7] p-4 text-sm" data-testid="p2w-scanned">
              <p className="flex items-center gap-2 font-bold text-[#7a5310]">
                <ScanText aria-hidden className="size-4" /> {loaded.scan.textPages === 0 ? "This looks like a scanned PDF" : "Some pages look scanned"}
              </p>
              <p className="mt-1 text-charcoal">Scanned pages are pictures of text, so there&apos;s nothing to edit until the text is recognised (OCR). Without OCR, those pages are kept as images in the Word file.</p>
            </div>
          ) : (
            <p className="flex items-start gap-2 text-sm text-ink-2">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> This PDF has a text layer, so its text, headings and simple tables can be rebuilt as editable Word content.
            </p>
          )}
          <div className="mt-4">
            <Toggle checked={ocr} onChange={setOcr} label="Recognise text on scanned pages (OCR)" description="Slower · runs on your device" />
          </div>
          {ocr && (
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="OCR languages">
              {OCR_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={langs.includes(l.code)}
                  onClick={() => setLangs((c) => (c.includes(l.code) ? (c.length > 1 ? c.filter((x) => x !== l.code) : c) : c.length >= 3 ? c : [...c, l.code]))}
                  className={clsx("h-8 rounded-full border px-3 text-[0.82rem]", langs.includes(l.code) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {busy ? (
            <div className="mt-5 grid gap-2" role="status" aria-live="polite">
              <ProgressBar value={(progress!.done / progress!.total) * 100} label={progress!.label} showLabel />
              <button type="button" onClick={() => (signal.current.cancelled = true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-card text-sm font-medium hover:border-charcoal">
                <Square aria-hidden className="size-3.5" /> Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={convert} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34]">
              <WandSparkles aria-hidden className="size-4" /> {result ? "Convert again" : "Convert to Word"}
            </button>
          )}
          {error && (
            <div className="mt-3">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </Panel>

        {result && s && (
          <Panel className="p-5 sm:p-6">
            <p className="flex items-center gap-2 font-bold text-success" role="status">
              <CheckCircle2 aria-hidden className="size-5" /> Your Word document is ready
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5" data-testid="p2w-stats">
              {(
                [
                  ["Pages", s.pages],
                  ["Paragraphs", s.paragraphs],
                  ["Headings", s.headings],
                  ["Tables", s.tables],
                  ["Images", s.images],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rounded-[10px] bg-ivory px-3 py-2">
                  <dt className="text-xs text-ink-2">{k}</dt>
                  <dd className="font-mono text-lg">{v}</dd>
                </div>
              ))}
            </dl>
            {s.ocrPages.length > 0 && <p className="mt-3 text-sm text-ink-2">Text on {s.ocrPages.length} scanned page{s.ocrPages.length === 1 ? " was" : "s was"} recognised with OCR — check names, numbers and dates carefully.</p>}
            {s.scannedPages.length > 0 && !s.ocrPages.length && <p className="mt-3 text-sm text-[#8a5a10]">{s.scannedPages.length} scanned page{s.scannedPages.length === 1 ? " is" : "s are"} included as images. Turn on OCR to make them editable.</p>}
            <button
              type="button"
              onClick={() => {
                downloadBlob(result.blob, name);
                track("download_clicked", { tool: "pdf-to-word", format: "docx" });
              }}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory hover:bg-black"
            >
              <Download aria-hidden className="size-4" /> Download {name} <span className="font-mono text-sm font-normal text-ivory/70">· {formatBytes(result.blob.size)}</span>
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              PDFs don&apos;t store paragraphs or tables the way Word does, so the layout is rebuilt from text positions. We couldn&apos;t preserve the original layout completely — please review the converted document, especially complex tables, multi-column pages and text colours.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}
