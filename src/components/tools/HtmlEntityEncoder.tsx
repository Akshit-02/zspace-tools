"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, CheckCircle2, Download, Eraser, RotateCcw, Sparkles } from "lucide-react";
import { CopyButton, Notice, Segmented, Toggle } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { DECODE_SAMPLE, DEFAULT_ENCODE, ENTITY_SAMPLE, MAX_TEXT, decodeEntities, encodeEntities, type EncodeOptions } from "@/lib/html-entities";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");
/** Counts code points, so an emoji counts once. */
const chars = (s: string) => Array.from(s).length;

export default function HtmlEntityEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [o, setO] = useState<EncodeOptions>(DEFAULT_ENCODE);
  const deferred = useDeferredValue(input);
  const tooBig = deferred.length > MAX_TEXT;

  useEffect(() => {
    track("tool_opened", { tool: "html-entity-encoder" });
  }, []);

  const result = useMemo(() => {
    if (!deferred || tooBig) return null;
    if (mode === "encode") {
      const r = encodeEntities(deferred, o);
      return { output: r.output, count: r.count, issues: [] as ReturnType<typeof decodeEntities>["issues"] };
    }
    return decodeEntities(deferred);
  }, [deferred, mode, o, tooBig]);
  const output = result?.output ?? "";

  const setOpt = <K extends keyof EncodeOptions>(k: K, v: EncodeOptions[K]) => setO((c) => ({ ...c, [k]: v }));

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-[16px] border border-line bg-card p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            label="Mode"
            className="w-full sm:w-[340px]"
            value={mode}
            onChange={(v) => setMode(v as "encode" | "decode")}
            options={[
              { value: "encode", label: "Encode" },
              { value: "decode", label: "Decode" },
            ]}
          />
          <button
            type="button"
            disabled={!output}
            onClick={() => {
              setInput(output);
              setMode((m) => (m === "encode" ? "decode" : "encode"));
            }}
            className="inline-flex h-10 items-center gap-2 self-start rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal disabled:opacity-40 sm:self-auto"
          >
            <ArrowDownUp aria-hidden className="size-4" /> Use output as input
          </button>
        </div>
        {mode === "encode" && (
          <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-2 rounded-[12px] border border-line p-3">
              <p className="text-sm font-medium">Characters to encode</p>
              <Segmented
                label="Characters to encode"
                size="sm"
                value={o.scope}
                onChange={(v) => setOpt("scope", v as EncodeOptions["scope"])}
                options={[
                  { value: "special", label: "Special only" },
                  { value: "nonascii", label: "+ all non-ASCII" },
                ]}
              />
              <p className="text-sm font-medium">Entity style</p>
              <Segmented
                label="Entity style"
                size="sm"
                value={o.format}
                onChange={(v) => setOpt("format", v as EncodeOptions["format"])}
                options={[
                  { value: "named", label: "Named &copy;" },
                  { value: "decimal", label: "Decimal &#169;" },
                  { value: "hex", label: "Hex &#xA9;" },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Toggle checked={o.quotes} onChange={(v) => setOpt("quotes", v)} label="Encode quotes" description={`" → &quot;   ' → &#39;`} />
              <Toggle checked={o.preserve} onChange={(v) => setOpt("preserve", v)} label="Keep existing entities" description="&amp;copy; stays as is — no double encoding" />
            </div>
          </div>
        )}
      </div>

      {tooBig && <Notice tone="error">The text is {nf.format(input.length)} characters. The limit is {nf.format(MAX_TEXT)}.</Notice>}

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          id="entity-input"
          label={mode === "encode" ? "Text" : "HTML with entities"}
          mono
          value={input}
          onChange={setInput}
          placeholder={mode === "encode" ? "Tom & Jerry < Special Characters >" : "Tom &amp; Jerry &lt; Special Characters &gt;"}
          minHeight={320}
          meta={input ? `${nf.format(chars(input))} chars` : undefined}
          actions={
            <>
              <EditorButton onClick={() => setInput(mode === "encode" ? ENTITY_SAMPLE : DECODE_SAMPLE)}>
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => setInput("")} disabled={!input}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
            </>
          }
        />
        <Editor
          id="entity-output"
          label={mode === "encode" ? "Encoded" : "Decoded text"}
          mono
          readOnly
          value={output}
          tone={output ? "success" : "default"}
          placeholder="The result appears here as you type."
          minHeight={320}
          meta={output ? `${nf.format(chars(output))} chars · ${nf.format(result!.count)} ${mode === "encode" ? "encoded" : "decoded"}` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "html-entity-encoder", format: mode })} />
              <EditorButton
                disabled={!output}
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), mode === "encode" ? "encoded.txt" : "decoded.txt");
                  track("download_clicked", { tool: "html-entity-encoder", format: "txt" });
                }}
              >
                <Download aria-hidden className="size-3.5" /> TXT
              </EditorButton>
            </>
          }
        />
      </div>

      {mode === "decode" && result && (
        <div className={result.issues.length ? "rounded-[14px] border border-[#e5c98f] bg-[#fdf6e7] px-4 py-3" : "rounded-[14px] border border-success/30 bg-[#f1f7f3] px-4 py-3"} data-testid="entity-issues" aria-live="polite">
          {result.issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 aria-hidden className="size-4" /> {result.count ? `${nf.format(result.count)} entities decoded, no problems found.` : "No entities found — the text is unchanged."}
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-bold text-[#7a5310]">
                <AlertTriangle aria-hidden className="size-4" /> {result.issues.length} entit{result.issues.length === 1 ? "y needs" : "ies need"} attention
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {result.issues.slice(0, 20).map((i) => (
                  <li key={i.index} className="break-words">
                    {i.message}
                  </li>
                ))}
                {result.issues.length > 20 && <li className="text-ink-2">…and {result.issues.length - 20} more.</li>}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-xs leading-relaxed text-ink-2">
          Decoded text is shown as plain text and never rendered as HTML. Encoding special characters helps display them safely in HTML text, but it isn&apos;t a complete defence against XSS — use your framework&apos;s context-aware escaping and sanitise untrusted HTML.
        </p>
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setO(DEFAULT_ENCODE);
              setMode("encode");
            }}
            className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-[10px] px-3 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
