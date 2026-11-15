"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Eraser, FileUp, Info, Play, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Notice, Panel, Segmented, Toggle } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { CSV_SAMPLE, delimiterName, parseCsv, toJson, type CsvOptions, type DelimiterChoice, type Shape } from "@/lib/csv";
import { JSON_CSV_DEFAULTS, JSON_SAMPLE, jsonToCsv, type JsonCsvOptions, type JsonDelimiter } from "@/lib/json-csv";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const MAX_FILE = 20 * 1024 * 1024;
const PREVIEW_ROWS = 8;
/** Inputs larger than this convert on demand (Convert button) instead of on every keystroke. */
const LIVE_LIMIT = 1_000_000;
/** Output larger than this is shown truncated; copy and download always use the full result. */
const SHOW_LIMIT = 1_000_000;
const ACCEPT = ".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json";

type Handoff = { text: string; name: string; nonce: number } | null;

/** Reads a dropped/opened file as UTF-8 text, enforcing the size limit. */
function readText(file: File, onText: (text: string, name: string) => void, onError: (m: string) => void) {
  if (file.size > MAX_FILE) return onError(`That file is ${formatBytes(file.size)}. The limit is 20 MB.`);
  if (!/\.(csv|tsv|txt|json)$/i.test(file.name) && file.type && !/^(text\/|application\/json)/.test(file.type)) {
    return onError(`${file.name} isn't a CSV, TSV, TXT or JSON file.`);
  }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result ?? "");
    if (text.slice(0, 4096).includes("\u0000")) return onError(`${file.name} looks like a binary file, not text.`);
    onText(text, file.name.replace(/\.[^.]+$/, "") || "data");
  };
  reader.onerror = () => onError("That file couldn't be read.");
  reader.readAsText(file, "utf-8");
}

const clip = (s: string) => (s.length > SHOW_LIMIT ? `${s.slice(0, SHOW_LIMIT)}\n…` : s);
const nf = new Intl.NumberFormat("en-US");
const DEFAULTS: CsvOptions = { delimiter: "auto", custom: "", header: true, inferTypes: false, empty: "string", skipEmptyLines: true };

const show = (v: unknown) => (v === null ? "null" : v === "" ? "" : typeof v === "string" ? v : JSON.stringify(v));

function CsvToJsonPanel({ incoming, onJsonFile }: { incoming: Handoff; onJsonFile: (text: string, name: string) => void }) {
  const [csv, setCsv] = useState("");
  const [committed, setCommitted] = useState("");
  const [opts, setOpts] = useState<CsvOptions>(DEFAULTS);
  const [shape, setShape] = useState<Shape>("objects");
  const [pretty, setPretty] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("data");
  const [showAllIssues, setShowAllIssues] = useState(false);
  const deferred = useDeferredValue(csv);
  const live = csv.length <= LIVE_LIMIT;
  const source = live ? deferred : committed;
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof CsvOptions>(k: K, v: CsvOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    if (!incoming) return;
    setCsv(incoming.text); // eslint-disable-line react-hooks/set-state-in-effect
    setCommitted(incoming.text);
    setFileName(incoming.name);
  }, [incoming]);

  // Any non-empty input is parsed, so whitespace-only files get a clear "no data" message.
  const result = useMemo(() => (source ? parseCsv(source, opts) : null), [source, opts]);
  const json = useMemo(() => (result?.ok ? toJson(result, shape, pretty, opts.header) : ""), [result, shape, pretty, opts.header]);

  const loadFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    readText(
      file,
      (text, name) => {
        track("file_uploaded", { tool: "csv-to-json", file_count: 1 });
        // A .json file opened here belongs to the other direction.
        if (/\.json$/i.test(file.name)) return onJsonFile(text, name);
        setCsv(text);
        setCommitted(text);
        setFileName(name);
      },
      setFileError,
    );
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
                accept={ACCEPT}
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
      {!live && csv !== committed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5c98f] bg-[#fbf3e3] px-4 py-3 text-sm text-[#8a5a12]">
          <span>This input is large ({formatBytes(csv.length)}), so it converts when you press Convert.</span>
          <button type="button" onClick={() => setCommitted(csv)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 font-medium text-charcoal hover:bg-[#ec6a34]">
            <Play aria-hidden className="size-4" /> Convert
          </button>
        </div>
      )}

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
        value={clip(json)}
        minHeight={300}
        tone={json ? "success" : "default"}
        placeholder="The JSON appears here."
        meta={json ? `${nf.format(json.length)} chars · ${formatBytes(new Blob([json]).size)}${json.length > SHOW_LIMIT ? " · preview truncated, copy/download is complete" : ""}` : undefined}
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
              setCommitted("");
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

const SEL = "h-11 w-full min-w-0 cursor-pointer rounded-[10px] border border-line-strong bg-card px-3 outline-none focus:border-charcoal";
const DELIMS: { value: JsonDelimiter; label: string }[] = [
  { value: ",", label: "Comma ( , )" },
  { value: ";", label: "Semicolon ( ; )" },
  { value: "\t", label: "Tab (TSV)" },
  { value: "|", label: "Pipe ( | )" },
];

function JsonToCsvPanel({ incoming, onCsvFile }: { incoming: Handoff; onCsvFile: (text: string, name: string) => void }) {
  const [json, setJson] = useState("");
  const [committed, setCommitted] = useState("");
  const [o, setO] = useState<JsonCsvOptions>(JSON_CSV_DEFAULTS);
  const [fileName, setFileName] = useState("data");
  const [fileError, setFileError] = useState<string | null>(null);
  const deferred = useDeferredValue(json);
  const live = json.length <= LIVE_LIMIT;
  const source = live ? deferred : committed;
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof JsonCsvOptions>(k: K, v: JsonCsvOptions[K]) => setO((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!incoming) return;
    setJson(incoming.text); // eslint-disable-line react-hooks/set-state-in-effect
    setCommitted(incoming.text);
    setFileName(incoming.name);
    setO((x) => ({ ...x, path: "" }));
  }, [incoming]);

  const result = useMemo(() => (source ? jsonToCsv(source, o) : null), [source, o]);
  const csv = result?.ok ? result.csv : "";
  const ext = o.delimiter === "\t" ? "tsv" : "csv";

  const loadFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    readText(
      file,
      (text, name) => {
        track("file_uploaded", { tool: "csv-to-json", file_count: 1, format: "json" });
        if (/\.(csv|tsv)$/i.test(file.name)) return onCsvFile(text, name);
        setJson(text);
        setCommitted(text);
        setFileName(name);
        setO((x) => ({ ...x, path: "" }));
      },
      setFileError,
    );
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
        <Editor
          id="json-input"
          label="JSON"
          mono
          value={json}
          onChange={setJson}
          minHeight={300}
          tone={result && !result.ok ? "error" : "default"}
          placeholder={'[\n  { "name": "Amit", "city": "Mumbai" }\n]'}
          meta={json ? `${nf.format(json.length)} chars` : undefined}
          actions={
            <>
              <EditorButton onClick={() => setJson(JSON_SAMPLE)}>
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden className="size-3.5" /> Open file
              </EditorButton>
              <EditorButton onClick={() => setJson("")} disabled={!json}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                aria-label="Open a JSON file"
                onChange={(e) => {
                  loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          }
        />
        <Panel className="grid content-start gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <FieldLabel htmlFor="j2c-delim">Delimiter</FieldLabel>
              <select id="j2c-delim" value={o.delimiter} onChange={(e) => set("delimiter", e.target.value as JsonDelimiter)} className={SEL}>
                {DELIMS.map((d) => (
                  <option key={d.label} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="j2c-path">Records</FieldLabel>
              <select id="j2c-path" value={o.path} onChange={(e) => set("path", e.target.value)} className={SEL} disabled={!result?.ok && !o.path}>
                <option value="">Whole JSON</option>
                {(result?.ok ? result.candidates : o.path ? [o.path] : []).map((c) => (
                  <option key={c} value={c}>
                    “{c}” array
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>Arrays inside records</FieldLabel>
            <Segmented
              label="Arrays inside records"
              size="sm"
              value={o.arrays}
              onChange={(v) => set("arrays", v)}
              options={[
                { value: "json", label: "One JSON cell" },
                { value: "index", label: "Column per item" },
              ]}
            />
          </div>
          <div className="grid gap-2">
            <Toggle checked={o.header} onChange={(v) => set("header", v)} label="Include header row" description="Column names in the first row" />
            <Toggle checked={o.flatten} onChange={(v) => set("flatten", v)} label="Flatten nested objects" description={o.flatten ? "address.city, address.pin…" : "Nested objects kept as JSON text"} />
            <Toggle checked={o.nulls === "null"} onChange={(v) => set("nulls", v ? "null" : "empty")} label="Write null as “null”" description="Otherwise an empty cell" />
            <Toggle checked={o.bom} onChange={(v) => set("bom", v)} label="UTF-8 BOM for Excel" description="Keeps ₹, é, अ readable in Excel" />
            <Toggle checked={o.formulaGuard} onChange={(v) => set("formulaGuard", v)} label="Spreadsheet-safe export" description="Prefix ' to values starting with = + - @" />
            <Toggle checked={o.quoteAll} onChange={(v) => set("quoteAll", v)} label="Quote every field" description="Otherwise only when needed" />
          </div>
          <div>
            <FieldLabel>Line endings</FieldLabel>
            <Segmented
              label="Line endings"
              size="sm"
              value={o.eol}
              onChange={(v) => set("eol", v)}
              options={[
                { value: "crlf", label: "CRLF", hint: "RFC 4180 · Windows" },
                { value: "lf", label: "LF", hint: "macOS · Linux" },
              ]}
            />
          </div>
        </Panel>
      </div>

      {fileError && <Notice tone="error">{fileError}</Notice>}
      {!live && json !== committed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e5c98f] bg-[#fbf3e3] px-4 py-3 text-sm text-[#8a5a12]">
          <span>This input is large ({formatBytes(json.length)}), so it converts when you press Convert.</span>
          <button type="button" onClick={() => setCommitted(json)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 font-medium text-charcoal hover:bg-[#ec6a34]">
            <Play aria-hidden className="size-4" /> Convert
          </button>
        </div>
      )}

      <div aria-live="polite" role="status">
        {!result ? (
          <p className="rounded-[14px] border border-line bg-ivory-2 px-4 py-3 text-sm text-ink-2">Paste JSON, open a .json file or load the sample to convert it to CSV.</p>
        ) : !result.ok ? (
          <p className="flex items-start gap-2 rounded-[14px] border border-error/30 bg-[#fbecea] px-4 py-3 text-sm text-[#8f2f27]">
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              {result.message}
              {result.line ? <span className="ml-1 font-mono text-xs">(line {result.line}, column {result.column})</span> : null}
            </span>
          </p>
        ) : (
          <div className={clsx("rounded-[14px] border px-4 py-3", result.warnings.length || result.formulaCells ? "border-[#e5c98f] bg-[#fbf3e3]" : "border-success/30 bg-[#f1f7f3]")}>
            <p className={clsx("flex items-center gap-2 font-bold", result.warnings.length || result.formulaCells ? "text-[#8a5a12]" : "text-success")}>
              {result.warnings.length || result.formulaCells ? <AlertTriangle aria-hidden className="size-4" /> : <CheckCircle2 aria-hidden className="size-4" />}
              {nf.format(result.rows.length)} {result.rows.length === 1 ? "row" : "rows"}
              {result.headers.length ? ` · ${result.headers.length} ${result.headers.length === 1 ? "column" : "columns"}` : ""}
            </p>
            {(result.warnings.length > 0 || result.formulaCells > 0) && (
              <ul className="mt-2 space-y-1 text-sm text-charcoal" data-testid="j2c-warnings">
                {result.warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-[#b07a1f]" /> {w}
                  </li>
                ))}
                {result.formulaCells > 0 && (
                  <li className="flex gap-2">
                    <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-[#b07a1f]" />
                    <span>
                      {nf.format(result.formulaCells)} {result.formulaCells === 1 ? "value starts" : "values start"} with =, +, -, @ or a tab (e.g. <code className="font-mono text-xs">{result.formulaExamples[0]}</code>), which a spreadsheet may run as a formula.{" "}
                      {o.formulaGuard ? "They were prefixed with an apostrophe (') so they open as plain text." : "Your data was not changed — turn on “Spreadsheet-safe export” to prefix them with an apostrophe."}
                    </span>
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
            <table className="w-full border-collapse text-left text-sm" data-testid="j2c-preview">
              {result.headers.length > 0 && o.header && (
                <thead className="sticky top-0 bg-ivory">
                  <tr>
                    {result.headers.map((h, i) => (
                      <th key={i} scope="col" className="whitespace-nowrap border-b border-line px-3 py-2 font-mono text-xs font-medium text-charcoal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {result.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {r.map((v, j) => (
                      <td key={j} className={clsx("max-w-[260px] whitespace-pre-wrap px-3 py-2 align-top [overflow-wrap:anywhere]", v === "" ? "text-ink-3" : "text-charcoal")}>
                        {v === "" ? <span className="font-mono text-xs">—</span> : v}
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
        id="j2c-output"
        label={ext.toUpperCase()}
        mono
        readOnly
        value={clip(csv)}
        minHeight={260}
        tone={csv ? "success" : "default"}
        placeholder="The CSV appears here."
        meta={csv ? `${formatBytes(new Blob([csv]).size)}${csv.length > SHOW_LIMIT ? " · preview truncated, copy/download is complete" : ""}` : undefined}
        actions={
          <>
            <CopyButton text={() => csv} label="Copy CSV" className="!h-8" onCopied={() => track("copy_clicked", { tool: "csv-to-json", format: "csv" })} />
            <EditorButton
              onClick={() => {
                downloadBlob(new Blob([csv], { type: ext === "tsv" ? "text/tab-separated-values;charset=utf-8" : "text/csv;charset=utf-8" }), `${fileName}.${ext}`);
                track("download_clicked", { tool: "csv-to-json", format: ext });
              }}
              disabled={!csv}
            >
              <Download aria-hidden className="size-3.5" /> Download .{ext}
            </EditorButton>
          </>
        }
      />
    </div>
  );
}

/** CSV ↔ JSON converter: both directions stay mounted so switching keeps each input. */
export default function CsvJsonConverter() {
  const [dir, setDir] = useState<"csv-json" | "json-csv">("csv-json");
  const [toJsonSide, setToJsonSide] = useState<Handoff>(null);
  const [toCsvSide, setToCsvSide] = useState<Handoff>(null);

  useEffect(() => {
    track("tool_opened", { tool: "csv-to-json" });
    if (/[?&]mode=json-to-csv\b/.test(window.location.search)) setDir("json-csv"); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  return (
    <div className="grid gap-4">
      <Segmented
        label="Conversion direction"
        className="w-full sm:w-[360px]"
        value={dir}
        onChange={setDir}
        options={[
          { value: "csv-json", label: "CSV → JSON" },
          { value: "json-csv", label: "JSON → CSV" },
        ]}
      />
      <div className={dir === "csv-json" ? "" : "hidden"}>
        <CsvToJsonPanel
          incoming={toJsonSide}
          onJsonFile={(text, name) => {
            setToCsvSide({ text, name, nonce: Date.now() });
            setDir("json-csv");
          }}
        />
      </div>
      <div className={dir === "json-csv" ? "" : "hidden"}>
        <JsonToCsvPanel
          incoming={toCsvSide}
          onCsvFile={(text, name) => {
            setToJsonSide({ text, name, nonce: Date.now() });
            setDir("csv-json");
          }}
        />
      </div>
    </div>
  );
}
