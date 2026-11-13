"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, FileText, Info, RotateCcw, ScanText, Square, Table2 } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, ProgressBar, Segmented, Toggle, inputClass } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { Cancelled, extractFromPdf, type ExcelExtraction } from "@/lib/pdf-to-excel";
import { scanSummary } from "@/lib/pdf-to-docx";
import { parseCell } from "@/lib/cell-values";
import { toCsv, type SheetSpec } from "@/lib/xlsx-build";
import { OCR_LANGS, type LangCode } from "@/lib/ocr";
import { expandRanges, formatPageList, parsePageRanges } from "@/lib/pdf-utils";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { downloadZip } from "@/lib/zip";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_MB = 60;
const MAX_PAGES = 300;
const PREVIEW_ROWS = 200;
type Mode = "tables" | "pages";
type Layout = "per-table" | "one-sheet";

export default function PdfToExcel() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: MAX_MB, maxPages: MAX_PAGES });
  const [scan, setScan] = useState<{ scanned: number; textPages: number; checked: number } | null>(null);
  const [range, setRange] = useState("");
  const [ocr, setOcr] = useState(false);
  const [langs, setLangs] = useState<LangCode[]>(["eng"]);
  const [convert, setConvert] = useState(true);
  const [mode, setMode] = useState<Mode>("tables");
  const [layout, setLayout] = useState<Layout>("per-table");
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<ExcelExtraction | null>(null);
  const [include, setInclude] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const signal = useRef({ cancelled: false });
  const queue = useThumbQueue(pdf?.doc ?? null, 200);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-to-excel" });
  }, []);

  const total = pdf?.pages.length ?? 0;
  const parsed = range.trim() && total ? parsePageRanges(range, total) : null;
  const pages = useMemo(() => (parsed && !("error" in parsed) ? expandRanges(parsed.ranges) : Array.from({ length: total }, (_, i) => i + 1)), [parsed, total]);

  const sheets: SheetSpec[] = useMemo(() => {
    if (!result) return [];
    if (mode === "pages") return result.pages.map((p) => ({ name: `Page ${p.page}`, rows: p.rows, header: false }));
    return result.tables.map((t, i) => ({ name: `Table ${i + 1} (p${t.pages.length > 1 ? `${t.pages[0]}-${t.pages[t.pages.length - 1]}` : t.page})`, rows: t.rows, header: t.header }));
  }, [result, mode]);
  const chosen = sheets.filter((_, i) => include.has(i));
  const exportSheets: SheetSpec[] = layout === "one-sheet" && chosen.length > 1 ? [{ name: "All tables", header: false, rows: chosen.flatMap((s, i) => [...(i ? [[]] : []), [s.name], ...s.rows]) }] : chosen;

  const run = async () => {
    if (!pdf) return;
    signal.current = { cancelled: false };
    setFailure(null);
    setResult(null);
    setProgress({ done: 0, total: pages.length, label: "Starting…" });
    try {
      const r = await extractFromPdf(pdf.doc, pdf.lib, pages, { ocr, langs, signal: signal.current, onProgress: (done, t, label) => setProgress({ done, total: t, label }) });
      const nothing = !r.tables.length && !r.pages.length;
      if (nothing) {
        setFailure(r.scanned.length && !ocr ? "These pages are scanned images with no text layer, so there's nothing to put in a spreadsheet. Turn on OCR and try again." : "No text could be found on the selected pages, so no spreadsheet was created.");
      } else {
        const m: Mode = r.tables.length ? "tables" : "pages";
        setMode(m);
        setResult(r);
        setInclude(new Set((m === "tables" ? r.tables : r.pages).map((_, i) => i)));
        setTab(0);
        track("content_generated", { tool: "pdf-to-excel", count: r.tables.length, format: ocr ? "ocr" : "text" });
      }
    } catch (e) {
      if (!(e instanceof Cancelled)) setFailure("Extraction failed partway through. The PDF may use features we can't read.");
    } finally {
      setProgress(null);
    }
  };

  const downloadXlsx = async () => {
    if (!pdf || !exportSheets.length) return;
    const ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default;
    const { buildXlsx } = await import("@/lib/xlsx-build");
    const buf = await buildXlsx(ExcelJS, exportSheets, convert);
    downloadBlob(new Blob([buf as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${baseName(pdf.file.name)}.xlsx`);
    track("download_clicked", { tool: "pdf-to-excel", format: "xlsx", count: exportSheets.length });
  };
  const downloadCsv = async () => {
    if (!pdf || !chosen.length) return;
    const base = baseName(pdf.file.name);
    if (chosen.length === 1) downloadBlob(new Blob([toCsv(chosen[0].rows)], { type: "text/csv;charset=utf-8" }), `${base}.csv`);
    else await downloadZip(chosen.map((s) => ({ name: `${base} - ${s.name}.csv`.replace(/[\\/:*?"<>|]/g, "-"), blob: new Blob([toCsv(s.rows)], { type: "text/csv" }) })), `${base}-csv.zip`);
    track("download_clicked", { tool: "pdf-to-excel", format: "csv", count: chosen.length });
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
            setRange("");
            setFailure(null);
            const s = await scanSummary(r.doc);
            setScan(s);
            setOcr(s.scanned > 0 && s.scanned >= s.textPages);
            track("file_uploaded", { tool: "pdf-to-excel", file_count: 1, size_bucket: sizeBucket(r.file.size) });
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF with tables"}
          subtitle="or click to choose — extracted on your device"
          formats={["PDF", `up to ${MAX_MB} MB`, `${MAX_PAGES} pages`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const sheet = sheets[tab];
  const busy = !!progress;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr] [&>*]:min-w-0">
        <Panel className="p-5">
          <div className="mx-auto w-40 overflow-hidden rounded-[8px] border border-line">
            <PdfThumb page={1} queue={queue} alt="First page preview" />
          </div>
          <p className="mt-3 truncate font-medium" title={pdf.file.name}>
            {pdf.file.name}
          </p>
          <p className="font-mono text-xs text-ink-2" data-testid="p2x-info">
            {formatBytes(pdf.file.size)} · {total} page{total === 1 ? "" : "s"}
            {scan?.scanned ? ` · ${scan.scanned} scanned` : ""}
          </p>
          <button type="button" onClick={() => (close(), setResult(null), setScan(null))} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <RotateCcw aria-hidden className="size-4" /> Convert another PDF
          </button>
        </Panel>
        <Panel className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="p2x-range">Pages</FieldLabel>
              <input id="p2x-range" value={range} onChange={(e) => setRange(e.target.value)} placeholder={`All (1-${total})`} className={clsx(inputClass, "font-mono")} />
              <p className={clsx("mt-1 text-xs", parsed && "error" in parsed ? "text-error" : "text-ink-2")}>{parsed && "error" in parsed ? parsed.error : `Pages ${formatPageList(pages)}`}</p>
            </div>
            <div>
              <FieldLabel>Spreadsheet layout</FieldLabel>
              <Segmented
                label="Spreadsheet layout"
                size="sm"
                value={layout}
                onChange={(v) => setLayout(v as Layout)}
                options={[
                  { value: "per-table", label: "Sheet per table" },
                  { value: "one-sheet", label: "One sheet" },
                ]}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Toggle checked={convert} onChange={setConvert} label="Convert numbers" description="1,20,000.50 → number; IDs stay text" />
            <Toggle checked={ocr} onChange={setOcr} label="OCR scanned pages" description="Slower · on your device" />
          </div>
          {scan && scan.scanned > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#fdf6e7] px-3 py-2 text-sm text-[#7a5310]" data-testid="p2x-scanned">
              <ScanText aria-hidden className="mt-0.5 size-4 shrink-0" /> {scan.textPages === 0 ? "This PDF looks scanned — it has no text layer." : `${scan.scanned} page${scan.scanned === 1 ? " looks" : "s look"} scanned.`} Turn on OCR to read their tables; check the numbers carefully afterwards.
            </p>
          )}
          {ocr && (
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="OCR languages">
              {OCR_LANGS.map((l) => (
                <button key={l.code} type="button" aria-pressed={langs.includes(l.code)} onClick={() => setLangs((c) => (c.includes(l.code) ? (c.length > 1 ? c.filter((x) => x !== l.code) : c) : c.length >= 3 ? c : [...c, l.code]))} className={clsx("h-8 rounded-full border px-3 text-[0.82rem]", langs.includes(l.code) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card")}>
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
            <button type="button" onClick={run} disabled={!!parsed && "error" in parsed} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              <Table2 aria-hidden className="size-4" /> {result ? "Extract again" : "Extract tables"}
            </button>
          )}
          {failure && (
            <div className="mt-3">
              <Notice tone="error">{failure}</Notice>
            </div>
          )}
        </Panel>
      </div>

      {result && (
        <Panel className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold" role="status" data-testid="p2x-summary">
              <CheckCircle2 aria-hidden className="size-5 text-success" />
              {mode === "tables" ? `${result.tables.length} table${result.tables.length === 1 ? "" : "s"} found` : `${result.pages.length} page${result.pages.length === 1 ? "" : "s"} of text rows`}
              {result.ocrPages.length > 0 && <span className="font-normal text-ink-2">· {result.ocrPages.length} read with OCR</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.tables.length > 0 && (
                <Segmented
                  label="What to export"
                  size="sm"
                  value={mode}
                  onChange={(v) => {
                    setMode(v as Mode);
                    setTab(0);
                    setInclude(new Set(((v as Mode) === "tables" ? result.tables : result.pages).map((_, i) => i)));
                  }}
                  options={[
                    { value: "tables", label: "Detected tables" },
                    { value: "pages", label: "All text" },
                  ]}
                />
              )}
              <button type="button" onClick={downloadXlsx} disabled={!chosen.length} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-black disabled:opacity-40">
                <FileSpreadsheet aria-hidden className="size-4" /> Download XLSX
              </button>
              <button type="button" onClick={downloadCsv} disabled={!chosen.length} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal disabled:opacity-40">
                <Download aria-hidden className="size-4" /> CSV
              </button>
            </div>
          </div>
          {!result.tables.length && (
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" /> No ruled or column-aligned tables were found, so each line of text is a row, split into cells at wide gaps.
            </p>
          )}
          <div role="tablist" aria-label="Sheets" className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {sheets.map((s, i) => (
              <div key={i} className={clsx("flex shrink-0 items-center gap-1.5 rounded-[8px] border px-2", i === tab ? "border-charcoal bg-ivory" : "border-line")}>
                <input type="checkbox" checked={include.has(i)} onChange={(e) => setInclude((c) => (e.target.checked ? new Set([...c, i]) : new Set([...c].filter((x) => x !== i))))} aria-label={`Include ${s.name}`} className="size-3.5 accent-[#F07845]" />
                <button type="button" role="tab" aria-selected={i === tab} onClick={() => setTab(i)} className="h-8 text-[0.82rem]">
                  {s.name} <span className="font-mono text-ink-3">{s.rows.length}×{Math.max(0, ...s.rows.map((r) => r.length))}</span>
                </button>
              </div>
            ))}
          </div>
          {sheet && (
            <div className="mt-3 max-h-[480px] overflow-auto rounded-[10px] border border-line" role="tabpanel" data-testid="p2x-preview">
              <table className="w-full border-collapse text-[0.82rem]">
                <tbody>
                  {sheet.rows.slice(0, PREVIEW_ROWS).map((r, ri) => (
                    <tr key={ri} className={clsx(sheet.header && ri === 0 ? "sticky top-0 bg-ivory-2 font-bold" : ri % 2 ? "bg-ivory/50" : "bg-card")}>
                      <td className="w-10 border-r border-line px-2 py-1 text-right font-mono text-[0.7rem] text-ink-3">{ri + 1}</td>
                      {Array.from({ length: Math.max(0, ...sheet.rows.map((x) => x.length)) }, (_, ci) => {
                        const v = r[ci] ?? "";
                        const num = convert && !(sheet.header && ri === 0) && v && parseCell(v).t === "n";
                        return (
                          <td key={ci} className={clsx("whitespace-nowrap border-r border-line px-2 py-1", num && "text-right font-mono")} title={num ? "Number" : v ? "Text" : undefined}>
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.rows.length > PREVIEW_ROWS && <p className="p-2 text-xs text-ink-2">Showing the first {PREVIEW_ROWS} of {sheet.rows.length} rows — all are included in the download.</p>}
            </div>
          )}
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
            <FileText aria-hidden className="mt-0.5 size-3.5 shrink-0" /> Right-aligned values become Excel numbers with their original formatting (₹1,20,000.50 stays exactly that). Dates, account numbers, leading zeros and Dr/Cr amounts stay as text so nothing changes silently. PDFs don&apos;t store tables, so check merged cells and wrapped text before relying on the data.
          </p>
        </Panel>
      )}
    </div>
  );
}
