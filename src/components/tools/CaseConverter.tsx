"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Download, Eraser, RotateCcw, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Toggle } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { CASES, SAMPLE_TEXT, convertCase, type CaseMode } from "@/lib/case";
import { analyzeText } from "@/lib/textstats";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<CaseMode>("title");
  const [collapse, setCollapse] = useState(false);
  const deferred = useDeferredValue(text);
  const output = useMemo(() => convertCase(deferred, mode, { collapseSpaces: collapse }), [deferred, mode, collapse]);
  const stats = useMemo(() => analyzeText(deferred), [deferred]);
  const def = CASES.find((c) => c.id === mode)!;

  useEffect(() => {
    track("tool_opened", { tool: "case-converter" });
  }, []);

  return (
    <div className="grid gap-4">
      {/* Style picker */}
      <div className="rounded-[16px] border border-line bg-card p-3 sm:p-4">
        <div role="radiogroup" aria-label="Case style" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
          {CASES.map((c) => {
            const active = c.id === mode;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(c.id)}
                className={clsx(
                  "h-11 truncate rounded-[10px] border px-2.5 text-[0.86rem] transition-colors",
                  c.code && "font-mono text-[0.8rem]",
                  active ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-ivory/60 text-charcoal hover:border-line-strong hover:bg-card",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-line px-1 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-2">
            <span className="font-medium text-charcoal">{def.label}</span> — {def.description}
          </p>
          <p className="shrink-0 font-mono text-xs text-ink-2">e.g. {def.example}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          id="case-input"
          label="Original"
          value={text}
          onChange={setText}
          placeholder="Type or paste your text here…"
          minHeight={340}
          meta={`${nf.format(stats.words)} words · ${nf.format(stats.characters)} chars`}
          actions={
            <>
              <EditorButton onClick={() => setText(SAMPLE_TEXT)}>
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => setText("")} disabled={!text}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
            </>
          }
          footer={<Toggle checked={collapse} onChange={setCollapse} label="Tidy extra spaces" description="Collapse repeated spaces and trim lines" />}
        />
        <Editor
          id="case-output"
          label={`Converted · ${def.label}`}
          value={output}
          readOnly
          placeholder="Your converted text appears here as you type."
          minHeight={340}
          tone={output ? "success" : "default"}
          meta={output ? `${nf.format(Array.from(output).length)} chars` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "case-converter", format: mode })} />
              <EditorButton
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), `text-${mode}.txt`);
                  track("download_clicked", { tool: "case-converter", format: mode });
                }}
                disabled={!output}
              >
                <Download aria-hidden className="size-3.5" /> .txt
              </EditorButton>
            </>
          }
          footer={
            <button
              type="button"
              onClick={() => {
                setText("");
                setMode("title");
                setCollapse(false);
              }}
              className="inline-flex h-11 items-center gap-1.5 text-sm text-ink-2 hover:text-charcoal"
            >
              <RotateCcw aria-hidden className="size-3.5" /> Reset everything
            </button>
          }
        />
      </div>
    </div>
  );
}
