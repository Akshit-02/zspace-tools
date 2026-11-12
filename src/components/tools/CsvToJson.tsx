"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Eraser, FileUp, Info, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Notice, Panel, Segmented, Toggle } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { CSV_SAMPLE, delimiterName, parseCsv, toJson, type CsvOptions, type DelimiterChoice, type Shape } from "@/lib/csv";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const MAX_FILE = 20 * 1024 * 1024;
const PREVIEW_ROWS = 8;
const nf = new Intl.NumberFormat("en-US");
const DEFAULTS: CsvOptions = { delimiter: "auto", custom: "", header: true, inferTypes: false, empty: "string", skipEmptyLines: true };

const show = (v: unknown) => (v === null ? "null" : v === "" ? "" : typeof v === "string" ? v : JSON.stringify(v));

export default function CsvToJson() {
  const [csv, setCsv] = useState("");
  const [opts, setOpts] = useState<CsvOptions>(DEFAULTS);
  const [shape, setShape] = useState<Shape>("objects");
  const [pretty, setPretty] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("data");
  const [showAllIssues, setShowAllIssues] = useState(false);
  const deferred = useDeferredValue(csv);
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof CsvOptions>(k: K, v: CsvOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "csv-to-json" });
  }, []);

  // Any non-empty input is parsed, so whitespace-only files get a clear "no data" message.
  const result = useMemo(() => (deferred ? parseCsv(deferred, opts) : null), [deferred, opts]);
  const json = useMemo(() => (result?.ok ? toJson(result, shape, pretty, opts.header) : ""), [result, shape, pretty, opts.header]);

  const loadFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_FILE) return setFileError(`That file is ${formatBytes(file.size)}. The limit is 20 MB.`);
    const reader = new FileReader();
    reader.onload = () => {
      setCsv(String(reader.result ?? ""));
      setFileName(file.name.replace(/\.[^.]+$/, "") || "data");
      track("file_uploaded", { tool: "csv-to-json", file_count: 1 });
    };
    reader.onerror = () => setFileError("That file couldn't be read.");
    reader.readAsText(file, "utf-8");
  };

  const issues = result?.ok ? [...result.renamed.map((m) => ({ row: 0, message: m })), ...result.issues] : [];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
        <Editor
          id="csv-input"
          label="CSV"
          mono
          value={csv}
          onChange={setCsv}
          minHeight={300}
          placeholder={"name,city,role\nAmit,Mumbai,Founder"}
          meta={csv ? `${nf.format(csv.length)} chars` : undefined}
          actions={
            <>
              <EditorButton onClick={() => setCsv(CSV_SAMPLE)}>
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden className="size-3.5" /> Open file
              </EditorButton>
              <EditorButton onClick={() => setCsv("")} disabled={!csv}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                className="sr-only"
                aria-label="Open a CSV file"
                onChange={(e) => {
                  loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          }
        />
        <Panel className="grid content-start gap-5 p-5">
          <div>
            <FieldLabel htmlFor="csv-delim">Delimiter</FieldLabel>
            <div className="flex gap-2">
              <select
                id="csv-delim"
                value={opts.delimiter}
                onChange={(e) => set("delimiter", e.target.value as DelimiterChoice)}
                className="h-11 min-w-0 flex-1 cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 outline-none focus:border-charcoal"
              >
                <option value="auto">Auto-detect</option>
                <option value=",">Comma ( , )</option>
                <option value={"\t"}>Tab</option>
                <option value=";">Semicolon ( ; )</option>
                <option value="|">Pipe ( | )</option>
                <option value="custom">Custom…</option>
              </select>
              {opts.delimiter === "custom" && (
                <input
                  aria-label="Custom delimiter"
                  value={opts.custom}
                  maxLength={1}
                  onChange={(e) => set("custom", e.target.value)}
                  placeholder="~"
                  className="h-11 w-16 rounded-[10px] border border-line-strong bg-card text-center font-mono outline-none focus:border-charcoal"
                />
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Toggle checked={opts.header} onChange={(v) => set("header", v)} label="First row is headers" description={opts.header ? "Headers become JSON keys" : "Columns named column_1, column_2…"} />
            <Toggle checked={opts.inferTypes} onChange={(v) => set("inferTypes", v)} label="Convert numbers & true/false" description="Off keeps every value exactly as text" />
            <Toggle checked={opts.empty === "null"} onChange={(v) => set("empty", v ? "null" : "string")} label="Empty cells as null" description={'Otherwise ""'} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <FieldLabel>Output</FieldLabel>
              <Segmented
                label="Output shape"
                size="sm"
                value={shape}
                onChange={(v) => setShape(v as Shape)}
                options={[
                  { value: "objects", label: "Objects" },
                  { value: "arrays", label: "Arrays" },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Format</FieldLabel>
              <Segmented
                label="JSON format"
                size="sm"
                value={pretty ? "pretty" : "min"}
                onChange={(v) => setPretty(v === "pretty")}
                options={[
                  { value: "pretty", label: "Pretty" },
                  { value: "min", label: "Minified" },
                ]}
              />
            </div>
          </div>
        </Panel>
      </div>

      {fileError && <Notice tone="error">{fileError}</Notice>}

      {/* Status */}
      <div aria-live="polite" role="status">
        {!result ? (
          <p className="rounded-[14px] border border-line bg-ivory-2 px-4 py-3 text-sm text-ink-2">Paste CSV, open a file or load the sample to convert it.</p>
        ) : !result.ok ? (
          <p className="flex items-start gap-2 rounded-[14px] border border-error/30 bg-[#fbecea] px-4 py-3 text-sm text-[#8f2f27]">
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" /> {result.message}
          </p>
        ) : (
          <div className={clsx("rounded-[14px] border px-4 py-3", issues.length ? "border-[#e5c98f] bg-[#fbf3e3]" : "border-success/30 bg-[#f1f7f3]")}>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className={clsx("flex items-center gap-2 font-bold", issues.length ? "text-[#8a5a12]" : "text-success")}>
                {issues.length ? <AlertTriangle aria-hidden className="size-4" /> : <CheckCircle2 aria-hidden className="size-4" />}
                {nf.format(result.rows.length)} {result.rows.length === 1 ? "record" : "records"} · {result.columnCount} {result.columnCount === 1 ? "column" : "columns"}
              </span>
              <span className="font-mono text-xs text-ink-2">
                delimiter: {delimiterName(result.delimiter)}
                {opts.delimiter === "auto" ? " (detected)" : ""}
              </span>
              {issues.length > 0 && <span className="text-sm text-[#8a5a12]">{issues.length} to review</span>}
            </p>
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-charcoal">
                {(showAllIssues ? issues : issues.slice(0, 5)).map((i, k) => (
                  <li key={k} className="flex gap-2">
                    <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-[#b07a1f]" /> {i.message}
                  </li>
                ))}
                {issues.length > 5 && (
                  <li>
                    <button type="button" onClick={() => setShowAllIssues((s) => !s)} className="text-sm font-medium underline decoration-orange underline-offset-2">
                      {showAllIssues ? "Show fewer" : `Show all ${issues.length}`}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {result?.ok && result.rows.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-sm font-bold">Preview</p>
            <p className="font-mono text-xs text-ink-2">
              first {Math.min(PREVIEW_ROWS, result.rows.length)} of {nf.format(result.rows.length)}
            </p>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full border-collapse text-left text-sm" data-testid="csv-preview">
              <thead className="sticky top-0 bg-ivory">
                <tr>
                  <th className="border-b border-line px-3 py-2 font-mono text-xs font-normal text-ink-3">#</th>
                  {result.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs font-medium text-charcoal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-ink-3">{i + 1}</td>
                    {r.map((v, j) => (
                      <td key={j} className={clsx("max-w-[260px] whitespace-pre-wrap px-3 py-2 align-top", v === null || v === "" ? "text-ink-3" : "text-charcoal")}>
                        {v === null ? <span className="font-mono text-xs">null</span> : v === "" ? <span className="font-mono text-xs">—</span> : show(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Editor
        id="csv-output"
        label="JSON"
        mono
        readOnly
        value={json}
        minHeight={300}
        tone={json ? "success" : "default"}
        placeholder="The JSON appears here."
        meta={json ? `${nf.format(json.length)} chars · ${formatBytes(new Blob([json]).size)}` : undefined}
        actions={
          <>
            <CopyButton text={() => json} label="Copy JSON" className="!h-8" onCopied={() => track("copy_clicked", { tool: "csv-to-json" })} />
            <EditorButton
              onClick={() => {
                downloadBlob(new Blob([json], { type: "application/json" }), `${fileName}.json`);
                track("download_clicked", { tool: "csv-to-json", format: shape });
              }}
              disabled={!json}
            >
              <Download aria-hidden className="size-3.5" /> Download .json
            </EditorButton>
          </>
        }
      />
      {csv && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setCsv("");
              setOpts(DEFAULTS);
              setShape("objects");
              setPretty(true);
              setFileName("data");
            }}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Reset
          </button>
        </div>
      )}
    </div>
  );
}
