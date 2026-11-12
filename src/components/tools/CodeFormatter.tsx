"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Eraser, FileUp, Minimize2, RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Notice, Segmented } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

export type Mode = "beautify" | "minify";
export type IndentOpt = "2" | "4" | "tab";
export interface FormatIssue {
  line: number;
  message: string;
}

const MAX_FILE = 5 * 1024 * 1024;
const nf = new Intl.NumberFormat("en-US");
const utf8 = (s: string) => new TextEncoder().encode(s).length;

/**
 * Shared shell for code beautify/minify tools (HTML, CSS): input + output
 * editors, file open, indent, size comparison, issues list, copy & download.
 * Input is only ever treated as text — it is never rendered or executed.
 */
export default function CodeFormatter({
  tool,
  language,
  accept,
  acceptLabel,
  sample,
  fileBase,
  ext,
  mime,
  placeholder,
  options,
  run,
  deps,
}: {
  tool: string;
  language: string;
  accept: string;
  acceptLabel: string;
  sample: string;
  fileBase: string;
  ext: string;
  mime: string;
  placeholder: string;
  options: React.ReactNode;
  run: (input: string, mode: Mode, indent: IndentOpt) => Promise<{ output: string; issues: FormatIssue[] }>;
  deps: unknown[];
}) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [indent, setIndent] = useState<IndentOpt>("2");
  const [res, setRes] = useState<{ key: unknown[]; output: string; issues: FormatIssue[] } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ key: unknown[]; message: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track("tool_opened", { tool });
  }, [tool]);

  // Re-run whenever the input or an option changes (after the first action).
  const key = [input, mode, indent, ...deps];
  const sameKey = (k: unknown[] | undefined) => !!k && k.length === key.length && k.every((v, i) => Object.is(v, key[i]));
  const active = !!mode && !!input.trim();
  useEffect(() => {
    if (!active) return;
    const k = [input, mode, indent, ...deps];
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await run(input, mode!, indent);
        if (live) {
          setRes({ key: k, ...r });
          setFailed(null);
        }
      } catch (e) {
        if (live) setFailed({ key: k, message: e instanceof Error ? e.message : `This ${language} couldn't be processed.` });
      }
    }, 120);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, input, mode, indent, ...deps]);
  // Keep showing the previous output while a new one is computed, but clear it when there's nothing to process.
  const output = active && res && !sameKey(failed?.key) ? res.output : "";
  const issues = active && res ? res.issues : [];
  const failure = active && failed && sameKey(failed.key) ? failed.message : null;

  const loadFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_FILE) return setFileError(`That file is ${formatBytes(file.size)}. The limit is 5 MB.`);
    const reader = new FileReader();
    reader.onload = () => {
      setInput(String(reader.result ?? ""));
      setMode((m) => m ?? "beautify");
      track("file_uploaded", { tool, file_count: 1 });
    };
    reader.onerror = () => setFileError("That file couldn't be read.");
    reader.readAsText(file);
  };

  const before = utf8(input);
  const after = utf8(output);
  const diff = before ? ((before - after) / before) * 100 : 0;
  const empty = !input.trim();

  const download = () => {
    downloadBlob(new Blob([output], { type: `${mime};charset=utf-8` }), mode === "minify" ? `${fileBase}.min.${ext}` : `${fileBase}.${ext}`);
    track("download_clicked", { tool, format: mode ?? "beautify" });
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-3 sm:p-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("beautify")}
            disabled={empty}
            aria-pressed={mode === "beautify"}
            className={clsx(
              "inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-colors disabled:opacity-40",
              mode === "minify" ? "border border-line-strong bg-card hover:border-charcoal" : "bg-orange text-charcoal hover:bg-[#ec6a34]",
            )}
          >
            <WandSparkles aria-hidden className="size-4" /> Beautify
          </button>
          <button
            type="button"
            onClick={() => setMode("minify")}
            disabled={empty}
            aria-pressed={mode === "minify"}
            className={clsx(
              "inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-colors disabled:opacity-40",
              mode === "minify" ? "bg-orange text-charcoal hover:bg-[#ec6a34]" : "bg-charcoal text-ivory hover:bg-black",
            )}
          >
            <Minimize2 aria-hidden className="size-4" /> Minify
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
              setIndent(v as IndentOpt);
              if (!empty) setMode("beautify");
            }}
            options={[
              { value: "2", label: "2 spaces" },
              { value: "4", label: "4 spaces" },
              { value: "tab", label: "Tab" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options}</div>

      {fileError && <Notice tone="error">{fileError}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          id={`${tool}-input`}
          label="Input"
          mono
          lineNumbers
          value={input}
          onChange={setInput}
          placeholder={placeholder}
          minHeight={420}
          meta={input ? `${nf.format(input.length)} chars · ${formatBytes(before)}` : undefined}
          actions={
            <>
              <EditorButton
                onClick={() => {
                  setInput(sample);
                  setMode((m) => m ?? "beautify");
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
                accept={accept}
                className="sr-only"
                aria-label={`Open ${acceptLabel}`}
                onChange={(e) => {
                  loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </>
          }
        />
        <Editor
          id={`${tool}-output`}
          label="Output"
          mono
          lineNumbers={mode !== "minify"}
          readOnly
          tone={output ? "success" : "default"}
          value={output}
          placeholder={empty ? `Paste ${language}, open ${acceptLabel} or load the sample.` : "Press Beautify or Minify."}
          minHeight={420}
          meta={output ? `${nf.format(output.length)} chars · ${formatBytes(after)}` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool })} />
              <EditorButton onClick={download} disabled={!output}>
                <Download aria-hidden className="size-3.5" /> Download
              </EditorButton>
            </>
          }
        />
      </div>

      {output && (
        <div className="grid gap-3 rounded-[16px] border border-line bg-card p-4 sm:grid-cols-3" role="status" aria-live="polite" data-testid="size-summary">
          <div>
            <p className="text-xs text-ink-2">Original</p>
            <p className="font-mono text-lg">{formatBytes(before)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-2">{mode === "minify" ? "Minified" : "Beautified"}</p>
            <p className="font-mono text-lg">{formatBytes(after)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-2">Difference</p>
            <p className={clsx("font-mono text-lg", diff > 0 ? "text-success" : diff < 0 ? "text-ink-2" : "")}>
              {Math.abs(diff) < 0.05 ? "No change" : diff > 0 ? `${diff.toFixed(1)}% smaller` : `${Math.abs(diff).toFixed(1)}% larger`}
            </p>
          </div>
        </div>
      )}

      {mode && !empty && (
        <div className={clsx("rounded-[14px] border px-4 py-3", issues.length ? "border-[#e5c98f] bg-[#fdf6e7]" : "border-success/30 bg-[#f1f7f3]")} data-testid="issues">
          {issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 aria-hidden className="size-4" /> No structural problems found.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-bold text-[#7a5310]">
                <AlertTriangle aria-hidden className="size-4" /> {issues.length} possible issue{issues.length === 1 ? "" : "s"} — output was still produced
              </p>
              <ul className="mt-2 space-y-1 text-sm text-charcoal">
                {issues.slice(0, 12).map((i, k) => (
                  <li key={k} className="flex gap-2">
                    <span className="w-16 shrink-0 font-mono text-xs leading-5 text-ink-2">{i.line ? `line ${i.line}` : "—"}</span>
                    <span className="min-w-0 break-words">{i.message}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {!empty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setInput("");
              setMode(null);
              setIndent("2");
              setFileError(null);
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
