"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, Segmented, Toggle } from "./ui";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { openPdfjs } from "@/lib/pdf-render";
import { SheetError, readWorkbook, type WorkbookModel } from "@/lib/xlsx-read";
import { PAPERS, workbookToPdf, type Fit, type Paper, type PdfOptions } from "@/lib/xlsx-pdf";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { sizeBucket, track } from "@/lib/analytics";
import type { PDFDocumentProxy } from "pdfjs-dist";

const MAX_MB = 30;
const MARGINS = { narrow: 18, normal: 50, wide: 72 } as const;

let fontCache: Promise<{ reg: Uint8Array; bold: Uint8Array }> | null = null;
const loadFonts = () =>
  (fontCache ??= Promise.all(["Regular", "Bold"].map((w) => fetch(`/fonts/pdf/NotoSans-${w}.ttf`).then((r) => r.arrayBuffer().then((b) => new Uint8Array(b))))).then(([reg, bold]) => ({ reg, bold })));

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [wb, setWb] = useState<WorkbookModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheets, setSheets] = useState<Set<number>>(new Set());
  const [paper, setPaper] = useState<Paper>("A4");
  const [orientation, setOrientation] = useState<PdfOptions["orientation"]>("auto");
  const [fit, setFit] = useState<Fit>("width");
  const [margin, setMargin] = useState<keyof typeof MARGINS | "custom">("normal");
  const [customMm, setCustomMm] = useState("15");
  const [repeat, setRepeat] = useState<"auto" | "0" | "1" | "2" | "3">("auto");
  const [pageNumbers, setPageNumbers] = useState(true);
  const [gridlines, setGridlines] = useState(false);
  const [pdf, setPdf] = useState<{ bytes: Uint8Array; pages: number; doc: PDFDocumentProxy; destroy: () => void } | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const queue = useThumbQueue(pdf?.doc ?? null, 220);

  useEffect(() => {
    track("tool_opened", { tool: "excel-to-pdf" });
  }, []);
  useEffect(() => () => pdf?.destroy(), [pdf]);

  const open = async (files: File[]) => {
    const f = files[0];
    setError(null);
    if (!f) return;
    if (!/\.(xlsx|xlsm|xls|csv|tsv|txt)$/i.test(f.name)) return setError(`${f.name} isn't a spreadsheet. Choose an .xlsx or .csv file.`);
    if (f.size === 0) return setError(`${f.name} is empty.`);
    if (f.size > MAX_MB * 1048576) return setError(`${f.name} is ${formatBytes(f.size)}. Your file is larger than the current processing limit of ${MAX_MB} MB.`);
    setLoading(true);
    try {
      const ExcelJS = (await import("exceljs/dist/exceljs.min.js")).default;
      const model = await readWorkbook(new Uint8Array(await f.arrayBuffer()), f.name, ExcelJS);
      if (!model.sheets.some((s) => s.rows && s.cols)) throw new SheetError("This workbook has no data to print.");
      setFile(f);
      setWb(model);
      setSheets(new Set(model.sheets.map((s, i) => (!s.hidden && s.rows && s.cols ? i : -1)).filter((i) => i >= 0)));
      track("file_uploaded", { tool: "excel-to-pdf", file_count: 1, size_bucket: sizeBucket(f.size) });
    } catch (e) {
      setError(e instanceof SheetError ? e.message : "This workbook couldn't be read. It may be damaged or use features we can't read.");
    } finally {
      setLoading(false);
    }
  };

  const options: PdfOptions | null = wb
    ? { paper, orientation, fit, margin: margin === "custom" ? Math.max(0, Math.min(100, Number(customMm) || 0)) * 2.8346 : MARGINS[margin], repeatRows: repeat === "auto" ? "auto" : Number(repeat), pageNumbers, gridlines, sheets: [...sheets].sort((a, b) => a - b) }
    : null;
  const optKey = JSON.stringify(options);

  // (Re)build the PDF whenever settings change.
  useEffect(() => {
    if (!wb || !options || !options.sheets.length) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const fonts = await loadFonts();
        const out = await workbookToPdf(wb, options, fonts);
        if (id !== seq.current) return;
        const opened = await openPdfjs(out.bytes, "The PDF");
        if (id !== seq.current) return opened.destroy();
        setPdf({ bytes: out.bytes, pages: out.pages, doc: opened.doc, destroy: opened.destroy });
        setError(null);
      } catch {
        if (id === seq.current) setError("The PDF couldn't be created from this workbook.");
      } finally {
        if (id === seq.current) setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wb, optKey]);

  const reset = () => {
    seq.current++;
    setWb(null);
    setFile(null);
    setPdf(null);
    setError(null);
  };

  if (!wb || !file)
    return (
      <div className="grid gap-4">
        <DropZone accept=".xlsx,.xlsm,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onFiles={open} title={loading ? "Reading workbook…" : "Drop an Excel file here"} subtitle="or click to choose — converted on your device" formats={["XLSX", "CSV", `up to ${MAX_MB} MB`]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-ivory-2">
              <FileSpreadsheet aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{file.name}</p>
              <p className="font-mono text-xs text-ink-2">
                {formatBytes(file.size)} · {wb.sheets.length} sheet{wb.sheets.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button type="button" onClick={reset} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <RotateCcw aria-hidden className="size-4" /> Another file
          </button>
        </div>

        <FieldLabel>Worksheets</FieldLabel>
        <ul className="grid gap-1.5" data-testid="x2p-sheets">
          {wb.sheets.map((s, i) => (
            <li key={i}>
              <label className={clsx("flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2 text-sm", sheets.has(i) ? "border-charcoal" : "border-line", !s.rows && "opacity-50")}>
                <span className="flex min-w-0 items-center gap-2">
                  <input type="checkbox" disabled={!s.rows} checked={sheets.has(i)} onChange={(e) => setSheets((c) => (e.target.checked ? new Set([...c, i]) : new Set([...c].filter((x) => x !== i))))} className="size-4 accent-[#F07845]" />
                  <span className="truncate">{s.name}</span>
                  {s.hidden && <span className="rounded-full bg-ivory-2 px-1.5 text-[0.65rem] text-ink-2">hidden</span>}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-2">{s.rows ? `${s.rows} × ${s.cols}` : "empty"}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid gap-4">
          <div>
            <FieldLabel>Paper</FieldLabel>
            <Segmented label="Paper size" size="sm" value={paper} onChange={(v) => setPaper(v as Paper)} options={(Object.keys(PAPERS) as Paper[]).map((p) => ({ value: p, label: p }))} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Orientation</FieldLabel>
              <Segmented
                label="Orientation"
                size="sm"
                value={orientation}
                onChange={(v) => setOrientation(v as PdfOptions["orientation"])}
                options={[
                  { value: "auto", label: "Auto" },
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Margins</FieldLabel>
              <div className="flex gap-2">
                <select aria-label="Margins" value={margin} onChange={(e) => setMargin(e.target.value as typeof margin)} className="h-9 min-w-0 flex-1 rounded-[8px] border border-line-strong bg-card px-2 text-sm">
                  <option value="narrow">Narrow (6 mm)</option>
                  <option value="normal">Normal (18 mm)</option>
                  <option value="wide">Wide (25 mm)</option>
                  <option value="custom">Custom…</option>
                </select>
                {margin === "custom" && <input aria-label="Custom margin in millimetres" inputMode="numeric" value={customMm} onChange={(e) => setCustomMm(e.target.value.replace(/[^\d.]/g, ""))} className="h-9 w-16 rounded-[8px] border border-line-strong px-2 font-mono text-sm" />}
              </div>
            </div>
          </div>
          <div>
            <FieldLabel>Scaling</FieldLabel>
            <Segmented
              label="Scaling"
              size="sm"
              value={fit}
              onChange={(v) => setFit(v as Fit)}
              options={[
                { value: "actual", label: "Actual size" },
                { value: "width", label: "Fit columns to width" },
                { value: "page", label: "Fit sheet on a page" },
              ]}
            />
          </div>
          <div>
            <FieldLabel htmlFor="x2p-repeat">Repeat header rows on every page</FieldLabel>
            <select id="x2p-repeat" value={repeat} onChange={(e) => setRepeat(e.target.value as typeof repeat)} className="h-9 w-full rounded-[8px] border border-line-strong bg-card px-2 text-sm">
              <option value="auto">As set in the workbook (Print Titles)</option>
              <option value="0">Don&apos;t repeat</option>
              <option value="1">First row</option>
              <option value="2">First 2 rows</option>
              <option value="3">First 3 rows</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle checked={pageNumbers} onChange={setPageNumbers} label="Page numbers" />
            <Toggle checked={gridlines} onChange={setGridlines} label="Print gridlines" />
          </div>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold" role="status" aria-live="polite" data-testid="x2p-status">
              {!sheets.size ? "Choose at least one worksheet" : busy || !pdf ? (
                <span className="inline-flex items-center gap-2 font-normal text-ink-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" /> Building PDF…
                </span>
              ) : (
                `${pdf.pages} page${pdf.pages === 1 ? "" : "s"} · ${formatBytes(pdf.bytes.byteLength)}`
              )}
            </p>
            <button
              type="button"
              disabled={!pdf || busy || !sheets.size}
              onClick={() => {
                downloadBlob(new Blob([pdf!.bytes as BlobPart], { type: "application/pdf" }), `${baseName(file.name)}.pdf`);
                track("download_clicked", { tool: "excel-to-pdf", format: "pdf", count: pdf!.pages });
              }}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-orange px-4 font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40"
            >
              <Download aria-hidden className="size-4" /> Download PDF
            </button>
          </div>
          {wb.warnings.length > 0 && (
            <ul className="mt-3 grid gap-1 text-sm" data-testid="x2p-warnings">
              {wb.warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 text-[#7a5310]">
                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          )}
          {error && (
            <div className="mt-3">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
          {pdf && sheets.size > 0 && (
            <ol className="mt-4 grid max-h-[620px] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3" data-testid="x2p-preview" aria-label="PDF preview">
              {Array.from({ length: Math.min(pdf.pages, 60) }, (_, i) => (
                <li key={`${optKey}-${i}`} className={clsx("overflow-hidden rounded-[8px] border border-line bg-card transition-opacity", busy && "opacity-50")}>
                  <PdfThumb page={i + 1} queue={queue} className="!aspect-auto min-h-40 bg-white" alt={`Page ${i + 1}`} />
                  <p className="border-t border-line px-2 py-1 font-mono text-[0.7rem] text-ink-2">{i + 1}</p>
                </li>
              ))}
            </ol>
          )}
          {pdf && pdf.pages > 60 && <p className="mt-2 text-xs text-ink-2">Showing the first 60 pages — the download includes all {pdf.pages}.</p>}
        </Panel>
        <p className="text-xs leading-relaxed text-ink-2">
          Cell values, number and date formats, fonts, colours, borders, merged cells, column widths and pictures are reproduced. Formulas aren&apos;t recalculated — the results saved in the file are used. Charts, shapes, conditional formatting and old .xls files aren&apos;t supported.
        </p>
      </div>
    </div>
  );
}
