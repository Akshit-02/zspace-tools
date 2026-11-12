"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowDownUp, Crosshair, Download, Eraser, Info, Plus, RotateCcw, ShieldAlert, Sparkles, Trash2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, Toggle } from "./ui";
import { Editor, EditorButton, type EditorHandle } from "./Editor";
import { URL_EXAMPLES, buildQuery, convertUrl, parseQuery, type ParsedUrl, type UrlMode } from "@/lib/url-codec";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const MODES: { id: UrlMode; label: string; fn: string; dir: "encode" | "decode" }[] = [
  { id: "encodeURIComponent", label: "Encode component", fn: "encodeURIComponent", dir: "encode" },
  { id: "encodeURI", label: "Encode full URL", fn: "encodeURI", dir: "encode" },
  { id: "decodeURIComponent", label: "Decode component", fn: "decodeURIComponent", dir: "decode" },
  { id: "decodeURI", label: "Decode full URL", fn: "decodeURI", dir: "decode" },
];

const nf = new Intl.NumberFormat("en-US");
const QUERY_SAMPLE = "https://shop.example/search?q=caf%C3%A9+au+lait&tag=new&tag=sale&utm_source=newsletter#results";

/** Inspect and edit a URL's query parameters; repeated keys are kept as separate rows. */
function QueryHelper() {
  const [url, setUrl] = useState("");
  const [parsed, setParsed] = useState<ParsedUrl | null>(null);
  const load = (v: string) => {
    setUrl(v);
    setParsed(v.trim() ? parseQuery(v) : null);
  };
  const setParam = (i: number, k: "key" | "value", v: string) =>
    setParsed((p) => (p ? { ...p, params: p.params.map((x, j) => (j === i ? { ...x, [k]: v, raw: undefined } : x)) } : p));
  const rebuilt = parsed ? buildQuery(parsed) : "";
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-display text-xl font-semibold">Query parameters</h2>
        <button type="button" onClick={() => load(QUERY_SAMPLE)} className="self-start text-sm text-ink-2 underline decoration-orange underline-offset-4 hover:text-charcoal">
          Load sample URL
        </button>
      </div>
      <p className="mt-1 text-sm text-ink-2">Paste a URL to read its parameters as decoded text, edit them, and get a correctly encoded URL back.</p>
      <div className="mt-4">
        <FieldLabel htmlFor="qp-url">URL or query string</FieldLabel>
        <input id="qp-url" value={url} onChange={(e) => load(e.target.value)} spellCheck={false} placeholder="https://example.com/page?a=1&b=2" className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none focus:border-charcoal" />
      </div>
      {parsed && (
        <>
          <div className="mt-4 overflow-x-auto rounded-[12px] border border-line">
            <table className="w-full min-w-[480px] border-collapse text-sm" data-testid="query-table">
              <thead className="bg-ivory text-xs text-ink-2">
                <tr>
                  <th className="w-8 px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Key</th>
                  <th className="px-3 py-2 text-left font-medium">Value (decoded)</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {parsed.params.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-ink-2">
                      No query parameters.
                    </td>
                  </tr>
                )}
                {parsed.params.map((p, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-1.5 font-mono text-xs text-ink-3">{i + 1}</td>
                    <td className="px-1.5 py-1.5">
                      <input aria-label={`Parameter ${i + 1} key`} value={p.key} onChange={(e) => setParam(i, "key", e.target.value)} className="h-9 w-full rounded-[8px] border border-line bg-card px-2 font-mono text-[0.82rem] outline-none focus:border-charcoal" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input aria-label={`Parameter ${i + 1} value`} value={p.value} onChange={(e) => setParam(i, "value", e.target.value)} className={clsx("h-9 w-full rounded-[8px] border bg-card px-2 font-mono text-[0.82rem] outline-none focus:border-charcoal", p.raw ? "border-[#e5c98f]" : "border-line")} />
                      {p.raw && <p className="mt-0.5 text-[0.7rem] text-[#8a5a12]">Malformed encoding — kept exactly as typed.</p>}
                    </td>
                    <td className="px-1.5">
                      <button type="button" onClick={() => setParsed((x) => (x ? { ...x, params: x.params.filter((_, j) => j !== i) } : x))} aria-label={`Remove parameter ${i + 1}`} className="grid size-8 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => setParsed((x) => (x ? { ...x, params: [...x.params, { key: "", value: "" }] } : x))}
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <Plus aria-hidden className="size-4" /> Add parameter
          </button>
          <div className="mt-3">
            <FieldLabel>Rebuilt URL</FieldLabel>
            <div className="flex gap-2">
              <p className="min-h-11 min-w-0 flex-1 break-all rounded-[10px] border border-success/30 bg-[#f1f7f3] px-3 py-2.5 font-mono text-[0.82rem]" data-testid="query-rebuilt">
                {rebuilt}
              </p>
              <CopyButton iconOnly text={() => rebuilt} label="Copy rebuilt URL" />
            </div>
            <p className="mt-1.5 text-xs text-ink-2">Values are encoded exactly once with encodeURIComponent (spaces become %20). Repeated keys stay as separate parameters, in order.</p>
          </div>
        </>
      )}
    </Panel>
  );
}

export default function UrlEncoder() {
  const [mode, setMode] = useState<UrlMode>("encodeURIComponent");
  const [input, setInput] = useState("");
  const [plus, setPlus] = useState(false);
  const deferred = useDeferredValue(input);
  const result = useMemo(() => convertUrl(deferred, mode, { plusAsSpace: plus }), [deferred, mode, plus]);
  const editor = useRef<EditorHandle>(null);
  const def = MODES.find((m) => m.id === mode)!;
  const output = result.ok ? result.output : "";

  useEffect(() => {
    track("tool_opened", { tool: "url-encoder-decoder" });
  }, []);

  const example = () =>
    setInput(mode === "encodeURI" ? URL_EXAMPLES.encode : mode === "encodeURIComponent" ? URL_EXAMPLES.component : URL_EXAMPLES.decode);

  const swap = () => {
    if (!output) return;
    setInput(output);
    const opposite: Record<UrlMode, UrlMode> = {
      encodeURI: "decodeURI",
      encodeURIComponent: "decodeURIComponent",
      decodeURI: "encodeURI",
      decodeURIComponent: "encodeURIComponent",
    };
    setMode(opposite[mode]);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-[16px] border border-line bg-card p-3 sm:p-4">
        <div role="radiogroup" aria-label="Conversion mode" className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(m.id)}
                className={clsx(
                  "flex flex-col items-start rounded-[10px] border px-3.5 py-2.5 text-left transition-colors",
                  active ? "border-charcoal bg-charcoal text-ivory" : "border-line bg-ivory/60 hover:border-line-strong hover:bg-card",
                )}
              >
                <span className="text-[0.92rem] font-medium">{m.label}</span>
                <span className={clsx("font-mono text-[0.7rem]", active ? "text-ivory/60" : "text-ink-2")}>{m.fn}()</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-start gap-2 border-t border-line px-1 pt-3 text-sm text-ink-2">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-ink" />
          {mode === "encodeURIComponent" && "For a single value — a search term, a parameter, a path segment. Encodes & = ? # / : + too."}
          {mode === "encodeURI" && "For a complete URL. Keeps : / ? # & = so the address still works; encodes spaces, Unicode and other unsafe characters."}
          {mode === "decodeURIComponent" && "Decodes every %XX sequence back to text. Use for parameter values and fully encoded strings."}
          {mode === "decodeURI" && "Decodes a full URL but leaves reserved characters such as %2F, %3F and %26 encoded, so the URL's structure doesn't change."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          ref={editor}
          id="url-input"
          label={def.dir === "encode" ? "Text or URL" : "Encoded text"}
          mono
          value={input}
          onChange={setInput}
          minHeight={280}
          tone={!result.ok ? "error" : "default"}
          placeholder={def.dir === "encode" ? "Paste a URL or text to encode…" : "Paste percent-encoded text to decode…"}
          meta={input ? `${nf.format(Array.from(input).length)} chars` : undefined}
          actions={
            <>
              <EditorButton onClick={example}>
                <Sparkles aria-hidden className="size-3.5" /> Example
              </EditorButton>
              <EditorButton onClick={() => setInput("")} disabled={!input}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
            </>
          }
          footer={def.dir === "decode" ? <Toggle checked={plus} onChange={setPlus} label="+ means space" description="Use for HTML form data (x-www-form-urlencoded)" /> : undefined}
        />
        <Editor
          id="url-output"
          label={def.dir === "encode" ? "Encoded" : "Decoded"}
          mono
          readOnly
          value={output}
          minHeight={280}
          tone={output ? "success" : "default"}
          placeholder="The result appears here as you type."
          meta={output ? `${nf.format(Array.from(output).length)} chars` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "url-encoder-decoder", format: mode })} />
              <EditorButton
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), `${def.dir}d.txt`);
                  track("download_clicked", { tool: "url-encoder-decoder", format: mode });
                }}
                disabled={!output}
              >
                <Download aria-hidden className="size-3.5" /> .txt
              </EditorButton>
              <EditorButton onClick={swap} disabled={!output} label="Use output as input and switch direction">
                <ArrowDownUp aria-hidden className="size-3.5" /> Swap
              </EditorButton>
            </>
          }
        />
      </div>

      <div aria-live="polite" className="grid gap-2">
        {!result.ok && (
          <div role="alert" className="flex flex-col gap-2 rounded-[14px] border border-error/30 bg-[#fbecea] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-[#8f2f27]">
              <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong>Can&rsquo;t decode.</strong> {result.message}
                {result.index !== undefined && <span className="ml-1 font-mono text-xs">(character {result.index + 1})</span>}
              </span>
            </p>
            {result.index !== undefined && (
              <button
                type="button"
                onClick={() => editor.current?.select(result.index!, result.index! + 3)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[10px] border border-error/30 bg-card px-3 text-sm font-medium text-[#8f2f27]"
              >
                <Crosshair aria-hidden className="size-4" /> Show
              </button>
            )}
          </div>
        )}
        {result.ok &&
          result.notes.map((n) => (
            <p key={n} className="flex items-start gap-2 rounded-[12px] border border-line bg-ivory-2 px-4 py-2.5 text-sm text-charcoal">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" /> {n}
            </p>
          ))}
      </div>

      <QueryHelper />

      <p className="flex items-start gap-2 px-1 text-sm text-ink-2">
        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-ink" />
        URL encoding only makes text safe to put in a URL — it isn&rsquo;t encryption. Anyone can decode it, so never rely on it to hide tokens or personal data.
      </p>

      {input && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setInput("");
              setMode("encodeURIComponent");
              setPlus(false);
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
