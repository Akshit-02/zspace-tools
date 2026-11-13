"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, Image as ImageIcon, Info, Presentation, RotateCcw, ScanText, Square, Type } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, ProgressBar, Segmented, Toggle } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { PageScope } from "./pdf/PageScope";
import { PptCancelled, pdfToPptx, type PptResult, type SlideSize } from "@/lib/pdf-to-pptx";
import { scanSummary } from "@/lib/pdf-to-docx";
import { scopePages, type Scope } from "@/lib/pdf-stamp";
import { OCR_LANGS, type LangCode } from "@/lib/ocr";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_MB = 60;
const MAX_PAGES = 300;

export default function PdfToPowerpoint() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: MAX_MB, maxPages: MAX_PAGES });
  const [mode, setMode] = useState<"layout" | "editable">("layout");
  const [size, setSize] = useState<SlideSize>("match");
  const [dpi, setDpi] = useState(150);
  const [background, setBackground] = useState(true);
  const [ocr, setOcr] = useState(false);
  const [langs, setLangs] = useState<LangCode[]>(["eng"]);
  const [scope, setScope] = useState<Scope>("all");
  const [range, setRange] = useState("");
  const [scan, setScan] = useState<{ scanned: number; textPages: number } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<(PptResult & { blob: Blob }) | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const signal = useRef({ cancelled: false });
  const queue = useThumbQueue(pdf?.doc ?? null, 160);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-to-powerpoint" });
  }, []);

  const pages = useMemo(() => (pdf ? scopePages(scope, range, pdf.pages.length) : []), [pdf, scope, range]);
  const pageErr = !Array.isArray(pages) ? pages.error : null;

  const run = async () => {
    if (!pdf || !Array.isArray(pages) || !pages.length) return;
    signal.current = { cancelled: false };
    setFail(null);
    setResult(null);
    setProgress({ done: 0, total: pages.length, label: "Starting…" });
    try {
      const r = await pdfToPptx(pdf.doc, pdf.lib, pages.map((i) => i + 1), { mode, size, dpi, background, ocr, langs, signal: signal.current, onProgress: (done, total, label) => setProgress({ done, total, label }) });
      setResult({ ...r, blob: new Blob([r.bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }) });
      track("content_generated", { tool: "pdf-to-powerpoint", format: mode, count: r.slides });
    } catch (e) {
      if (!(e instanceof PptCancelled)) setFail("The presentation couldn't be created. The PDF may use features we can't read — try the layout-preserving mode.");
    } finally {
      setProgress(null);
    }
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (!r) return;
            setResult(null);
            const s = await scanSummary(r.doc);
            setScan(s);
            track("file_uploaded", { tool: "pdf-to-powerpoint", file_count: 1, size_bucket: sizeBucket(r.file.size) });
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to convert"}
          subtitle="or click to choose — converted on your device"
          formats={["PDF", `up to ${MAX_MB} MB`, `${MAX_PAGES} pages`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const busy = !!progress;
  const name = `${baseName(pdf.file.name)}.pptx`;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium" title={pdf.file.name}>
              {pdf.file.name}
            </p>
            <p className="font-mono text-xs text-ink-2" data-testid="ppt-info">
              {formatBytes(pdf.file.size)} · {pdf.pages.length} page{pdf.pages.length === 1 ? "" : "s"}
              {scan?.scanned ? ` · ${scan.scanned} scanned` : ""}
            </p>
          </div>
          <button type="button" onClick={() => (close(), setResult(null), setScan(null))} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <RotateCcw aria-hidden className="size-4" /> Another PDF
          </button>
        </div>

        <FieldLabel>Conversion</FieldLabel>
        <div role="radiogroup" aria-label="Conversion mode" className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["layout", ImageIcon, "Keep the layout", "Each page becomes a high-quality picture slide. Looks exactly like the PDF; text isn't editable."],
              ["editable", Type, "Editable text", "Text becomes PowerPoint text boxes you can edit. Complex layouts may need tidying."],
            ] as const
          ).map(([v, Icon, t, d]) => (
            <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)} className={clsx("rounded-[12px] border p-3 text-left", mode === v ? "border-charcoal bg-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
              <span className="flex items-center gap-2 text-sm font-bold">
                <Icon aria-hidden className="size-4" /> {t}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-2">{d}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Slide size</FieldLabel>
            <Segmented
              label="Slide size"
              size="sm"
              value={size}
              onChange={(v) => setSize(v as SlideSize)}
              options={[
                { value: "match", label: "Match PDF" },
                { value: "16:9", label: "16:9" },
                { value: "4:3", label: "4:3" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>{mode === "layout" ? "Image quality" : "Background quality"}</FieldLabel>
            <Segmented
              label="Image quality"
              size="sm"
              value={String(dpi)}
              onChange={(v) => setDpi(Number(v))}
              options={[
                { value: "110", label: "Smaller" },
                { value: "150", label: "Standard" },
                { value: "220", label: "High" },
              ]}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-2">Pages are never stretched — if their shape differs from the slide, they&apos;re centred with white space around them.</p>

        {mode === "editable" && (
          <div className="mt-4 grid gap-2">
            <Toggle checked={background} onChange={setBackground} label="Keep page graphics as a background" description="Shapes, colours and pictures stay; text on top is editable" />
            {scan && scan.scanned > 0 && (
              <>
                <p className="flex items-start gap-2 rounded-[10px] bg-[#fdf6e7] px-3 py-2 text-sm text-[#7a5310]" data-testid="ppt-scanned">
                  <ScanText aria-hidden className="mt-0.5 size-4 shrink-0" /> {scan.scanned} page{scan.scanned === 1 ? " is" : "s are"} scanned. They&apos;ll be picture slides; turn on OCR to put their text in the speaker notes.
                </p>
                <Toggle checked={ocr} onChange={setOcr} label="OCR scanned pages into speaker notes" description="Slower · on your device" />
                {ocr && (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="OCR languages">
                    {OCR_LANGS.map((l) => (
                      <button key={l.code} type="button" aria-pressed={langs.includes(l.code)} onClick={() => setLangs((c) => (c.includes(l.code) ? (c.length > 1 ? c.filter((x) => x !== l.code) : c) : c.length >= 3 ? c : [...c, l.code]))} className={clsx("h-8 rounded-full border px-3 text-[0.82rem]", langs.includes(l.code) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card")}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-5">
          <PageScope scope={scope} range={range} onScope={setScope} onRange={setRange} error={pageErr} count={Array.isArray(pages) ? pages.length : undefined} />
        </div>

        {busy ? (
          <div className="mt-5 grid gap-2" role="status" aria-live="polite">
            <ProgressBar value={(progress!.done / progress!.total) * 100} label={progress!.label} showLabel />
            <button type="button" onClick={() => (signal.current.cancelled = true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-card text-sm font-medium hover:border-charcoal">
              <Square aria-hidden className="size-3.5" /> Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={run} disabled={!!pageErr || !Array.isArray(pages) || !pages.length} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
            <Presentation aria-hidden className="size-4" /> Convert {Array.isArray(pages) ? pages.length : 0} page{Array.isArray(pages) && pages.length === 1 ? "" : "s"} to PowerPoint
          </button>
        )}
        {fail && (
          <div className="mt-3">
            <Notice tone="error">{fail}</Notice>
          </div>
        )}
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        {result ? (
          <Panel className="p-5 sm:p-6">
            <p className="flex items-center gap-2 font-bold text-success" role="status" data-testid="ppt-done">
              <CheckCircle2 aria-hidden className="size-5" /> {result.slides} slide{result.slides === 1 ? "" : "s"} ready
            </p>
            <p className="mt-1 font-mono text-xs text-ink-2">
              {result.slideW}″ × {result.slideH}″{mode === "editable" ? ` · ${result.textBoxes} text boxes & tables` : ""}
              {result.ocrPages.length ? ` · ${result.ocrPages.length} OCR'd into notes` : ""}
            </p>
            <button
              type="button"
              onClick={() => {
                downloadBlob(result.blob, name);
                track("download_clicked", { tool: "pdf-to-powerpoint", format: mode });
              }}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory hover:bg-black"
            >
              <Download aria-hidden className="size-4" /> Download {name} <span className="font-mono text-sm font-normal text-ivory/70">· {formatBytes(result.blob.size)}</span>
            </button>
            {result.previews.length > 0 && (
              <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Slide preview" data-testid="ppt-preview">
                {result.previews.map((src, i) => (
                  <li key={i} className="overflow-hidden rounded-[6px] border border-line bg-white" style={{ aspectRatio: `${result.slideW} / ${result.slideH}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Slide ${i + 1}`} className="size-full object-contain" />
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              {mode === "layout" ? "Picture slides look like the PDF but their text can't be edited — choose Editable text for that." : "Text boxes are rebuilt from the PDF's layout; fonts you don't have are substituted, and tables, charts and layered graphics may need adjusting."}
            </p>
          </Panel>
        ) : (
          <Panel className="p-4">
            <p className="mb-3 text-sm font-bold">Pages</p>
            <ol className="grid max-h-[560px] grid-cols-3 gap-2 overflow-auto sm:grid-cols-4" aria-label="PDF pages">
              {pdf.pages.map((_, i) => (
                <li key={i} className={clsx("overflow-hidden rounded-[6px] border-2", Array.isArray(pages) && pages.includes(i) ? "border-orange" : "border-line opacity-50")}>
                  <PdfThumb page={i + 1} queue={queue} alt={`Page ${i + 1}`} />
                  <p className="border-t border-line px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">{i + 1}</p>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>
    </div>
  );
}
