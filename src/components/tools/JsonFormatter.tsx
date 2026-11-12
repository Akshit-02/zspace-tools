"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Crosshair, Download, Eraser, FileUp, Minimize2, RotateCcw, Sparkles, WandSparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Notice, Segmented } from "./ui";
import { Editor, EditorButton, type EditorHandle } from "./Editor";
import { SAMPLE_JSON, analyzeJson, printJson, type Indent } from "@/lib/json-tools";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const MAX_FILE = 10 * 1024 * 1024;
const nf = new Intl.NumberFormat("en-US");

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<Indent>("2");
  const [action, setAction] = useState<"beautify" | "minify" | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const deferred = useDeferredValue(input);
  const result = useMemo(() => analyzeJson(deferred), [deferred]);
  const editor = useRef<EditorHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track("tool_opened", { tool: "json-formatter" });
  }, []);

  const output = useMemo(() => {
    if (!action || !result.ok) return "";
    return printJson(result.tokens, action === "minify" ? "min" : indent);
  }, [action, result, indent]);

  const error = !result.ok && "error" in result ? result.error : null;
  const empty = !result.ok && "empty" in result;

  const excerpt = useMemo(() => {
    if (!error) return null;
    const line = deferred.split("\n")[error.line - 1] ?? "";
    const start = Math.max(0, error.column - 1 - 40);
    const text = (start > 0 ? "…" : "") + line.slice(start, start + 80).replace(/\t/g, " ");
    const caret = error.column - 1 - start + (start > 0 ? 1 : 0);
    return { text, caret };
  }, [error, deferred]);

  const goToError = () => {
    if (error) editor.current?.select(error.pos, Math.min(error.pos + 1, input.length));
  };

  const loadFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_FILE) return setFileError(`That file is ${formatBytes(file.size)}. The limit is 10 MB.`);
    const reader = new FileReader();
    reader.onload = () => {
      setInput(String(reader.result ?? ""));
      setAction("beautify");
      track("file_uploaded", { tool: "json-formatter", file_count: 1 });
    };
    reader.onerror = () => setFileError("That file couldn't be read.");
    reader.readAsText(file);
  };

  const run = (a: "beautify" | "minify" | "validate") => {
    setPulse((p) => p + 1);
    if (a === "validate") {
      if (error) goToError();
      return;
    }
    setAction(a);
    if (error) goToError();
  };

  const statusTone = empty ? "idle" : error ? "error" : "ok";

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run("beautify")}
            disabled={empty}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal transition-colors hover:bg-[#ec6a34] disabled:opacity-40"
          >
            <WandSparkles aria-hidden className="size-4" /> Beautify
          </button>
          <button
            type="button"
            onClick={() => run("minify")}
            disabled={empty}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
          >
            <Minimize2 aria-hidden className="size-4" /> Minify
          </button>
          <button
            type="button"
            onClick={() => run("validate")}
            disabled={empty}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-4 text-sm font-medium transition-colors hover:border-charcoal disabled:opacity-40"
          >
            <CheckCircle2 aria-hidden className="size-4" /> Validate
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-2">Indent</span>
          <Segmented
            label="Indentation"
            size="sm"
            className="w-full whitespace-nowrap sm:w-[280px]"
            value={indent}
            onChange={(v) => {
              setIndent(v as Indent);
              if (action !== "minify") setAction("beautify");
            }}
            options={[
              { value: "2", label: "2 spaces" },
              { value: "4", label: "4 spaces" },
              { value: "tab", label: "Tab" },
            ]}
          />
        </div>
      </div>

      {/* Status */}
      <motion.div
        key={pulse}
        initial={pulse ? { scale: 0.995 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        role="status"
        aria-live="polite"
        className={clsx(
          "rounded-[14px] border px-4 py-3",
          statusTone === "ok" && "border-success/30 bg-[#f1f7f3]",
          statusTone === "error" && "border-error/30 bg-[#fbecea]",
          statusTone === "idle" && "border-line bg-ivory-2",
        )}
      >
        {empty ? (
          <p className="text-sm text-ink-2">Paste JSON, open a .json file or load the sample to begin.</p>
        ) : error ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-bold text-[#8f2f27]">
                <XCircle aria-hidden className="size-4" /> Invalid JSON
                <span className="font-mono text-xs font-normal">
                  line {error.line}, column {error.column}
                </span>
              </p>
              <p className="mt-1 text-sm text-charcoal">{error.message}</p>
              {error.hint && <p className="mt-0.5 text-sm text-ink-2">{error.hint}</p>}
              {excerpt && excerpt.text.trim() && (
                <pre className="mt-2 overflow-x-auto rounded-[8px] bg-card px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-charcoal">
                  {excerpt.text}
                  {"\n"}
                  <span className="text-error">{" ".repeat(Math.max(0, excerpt.caret))}^</span>
                </pre>
              )}
            </div>
            <button
              type="button"
              onClick={goToError}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[10px] border border-error/30 bg-card px-3 text-sm font-medium text-[#8f2f27] hover:border-error"
            >
              <Crosshair aria-hidden className="size-4" /> Go to error
            </button>
          </div>
        ) : result.ok ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <p className="flex items-center gap-2 font-bold text-success">
              <CheckCircle2 aria-hidden className="size-4" /> Valid JSON
            </p>
            <p className="font-mono text-xs text-ink-2">
              {result.stats.objects} objects · {result.stats.arrays} arrays · {result.stats.keys} keys · depth {result.stats.depth}
            </p>
          </div>
        ) : null}
        {result.ok && result.warnings.length > 0 && (
          <ul className="mt-2 space-y-1">
            {result.warnings.slice(0, 4).map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-ink-2">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" /> {w}
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {fileError && <Notice tone="error">{fileError}</Notice>}

      {/* Editors */}
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          ref={editor}
          id="json-input"
          label="Input"
          mono
          lineNumbers
          errorLine={error?.line ?? null}
          tone={error ? "error" : "default"}
          value={input}
          onChange={setInput}
          placeholder={'{\n  "paste": "your JSON here"\n}'}
          minHeight={420}
          meta={input ? `${nf.format(input.length)} chars` : undefined}
          actions={
            <>
              <EditorButton
                onClick={() => {
                  setInput(SAMPLE_JSON);
                  setAction("beautify");
                }}
              >
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden className="size-3.5" /> Open file
              </EditorButton>
              <EditorButton onClick={() => setInput("")} disabled={!input}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json,text/plain"
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
        <Editor
          id="json-output"
          label="Output"
          mono
          lineNumbers
          readOnly
          tone={output ? "success" : "default"}
          value={output}
          placeholder={error ? "Fix the error to see the formatted output." : "Press Beautify or Minify."}
          minHeight={420}
          meta={output ? `${nf.format(output.length)} chars${action === "minify" ? " · minified" : ""}` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "json-formatter" })} />
              <EditorButton
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "application/json" }), action === "minify" ? "data.min.json" : "data.json");
                  track("download_clicked", { tool: "json-formatter", format: action ?? "beautify" });
                }}
                disabled={!output}
              >
                <Download aria-hidden className="size-3.5" /> Download
              </EditorButton>
            </>
          }
        />
      </div>

      <AnimatePresence>
        {!empty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setInput("");
                setAction(null);
                setIndent("2");
                setFileError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
            >
              <RotateCcw aria-hidden className="size-3.5" /> Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
