"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownUp, CheckCircle2, Download, Eraser, FileDown, Loader2, RotateCcw, ShieldAlert, Sparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, DownloadButton, DropZone, FieldLabel, Metric, Notice, Panel, ProgressBar, Segmented, Toggle } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { BASE64_SAMPLE, decodeText, decodeToBytes, encodeFile, encodeText, normaliseBase64, sniffType } from "@/lib/base64";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");
const MAX_FILE = 25 * 1024 * 1024;
const PREVIEW = 20_000;
const utf8Len = (s: string) => new TextEncoder().encode(s).length;

function TextMode() {
  const [dir, setDir] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(true);
  const deferred = useDeferredValue(input);

  const result = useMemo(() => {
    if (!deferred) return { ok: true as const, text: "" };
    if (dir === "encode") return { ok: true as const, text: encodeText(deferred, { urlSafe, wrap }) };
    const d = decodeText(deferred, ignoreWs);
    return d.ok ? { ok: true as const, text: d.text, urlSafe: d.urlSafe } : d;
  }, [deferred, dir, urlSafe, wrap, ignoreWs]);
  const output = result.ok ? result.text : "";

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-[16px] border border-line bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
        <Segmented
          label="Direction"
          className="w-full sm:w-[340px]"
          value={dir}
          onChange={(v) => setDir(v as "encode" | "decode")}
          options={[
            { value: "encode", label: "Encode to Base64" },
            { value: "decode", label: "Decode from Base64" },
          ]}
        />
        {dir === "decode" && (
          <div className="sm:w-[300px]">
            <Toggle checked={ignoreWs} onChange={setIgnoreWs} label="Ignore whitespace" description="Strip spaces & line breaks first" />
          </div>
        )}
        {dir === "encode" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle checked={urlSafe} onChange={setUrlSafe} label="URL-safe" description="- _ and no padding" />
            <Toggle checked={wrap && !urlSafe} onChange={setWrap} disabled={urlSafe} label="Wrap at 76" description="MIME line length" />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Editor
          id="b64-input"
          label={dir === "encode" ? "Text" : "Base64"}
          mono={dir === "decode"}
          value={input}
          onChange={setInput}
          minHeight={300}
          tone={!result.ok ? "error" : "default"}
          placeholder={dir === "encode" ? "Type or paste text — any language or emoji." : "Paste Base64 (standard or URL-safe)…"}
          meta={input ? `${nf.format(Array.from(input).length)} chars · ${formatBytes(utf8Len(input))}` : undefined}
          actions={
            <>
              <EditorButton onClick={() => setInput(dir === "encode" ? BASE64_SAMPLE : encodeText(BASE64_SAMPLE))}>
                <Sparkles aria-hidden className="size-3.5" /> Sample
              </EditorButton>
              <EditorButton onClick={() => setInput("")} disabled={!input}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
            </>
          }
        />
        <Editor
          id="b64-output"
          label={dir === "encode" ? "Base64" : "Decoded text"}
          mono={dir === "encode"}
          readOnly
          value={output}
          minHeight={300}
          tone={output ? "success" : "default"}
          placeholder="The result appears here as you type."
          meta={output ? `${nf.format(Array.from(output).length)} chars · ${formatBytes(utf8Len(output))}` : undefined}
          actions={
            <>
              <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "base64-encoder-decoder", format: dir })} />
              <EditorButton
                onClick={() => {
                  downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), dir === "encode" ? "base64.txt" : "decoded.txt");
                  track("download_clicked", { tool: "base64-encoder-decoder", format: dir });
                }}
                disabled={!output}
              >
                <Download aria-hidden className="size-3.5" /> .txt
              </EditorButton>
              <EditorButton
                onClick={() => {
                  setInput(output);
                  setDir(dir === "encode" ? "decode" : "encode");
                }}
                disabled={!output}
                label="Use output as input and switch direction"
              >
                <ArrowDownUp aria-hidden className="size-3.5" /> Swap
              </EditorButton>
            </>
          }
        />
      </div>

      <div aria-live="polite">
        {!result.ok ? (
          <p role="alert" className="flex items-start gap-2 rounded-[14px] border border-error/30 bg-[#fbecea] px-4 py-3 text-sm text-[#8f2f27]">
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" /> <span>{result.message}</span>
          </p>
        ) : output && dir === "encode" ? (
          <p className="font-mono text-xs text-ink-2">
            {formatBytes(utf8Len(deferred))} → {formatBytes(output.length)} ({Math.round((output.length / Math.max(1, utf8Len(deferred)) - 1) * 100)}% larger)
          </p>
        ) : null}
      </div>
      {input && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setInput("");
              setDir("encode");
              setUrlSafe(false);
              setWrap(false);
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

function FileMode() {
  const [dir, setDir] = useState<"encode" | "decode">("encode");
  const [file, setFile] = useState<File | null>(null);
  const [encoded, setEncoded] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [name, setName] = useState("decoded-file");
  const runId = useRef(0);

  const encode = async (f: File) => {
    setError(null);
    setEncoded(null);
    if (f.size > MAX_FILE) return setError(`That file is ${formatBytes(f.size)}. The limit is 25 MB.`);
    setFile(f);
    const id = ++runId.current;
    setProgress(0);
    try {
      const b64 = await encodeFile(f, (p) => runId.current === id && setProgress(p));
      if (runId.current === id) setEncoded(b64);
      track("file_uploaded", { tool: "base64-encoder-decoder", file_count: 1 });
    } catch {
      setError("That file couldn't be read.");
    } finally {
      if (runId.current === id) setProgress(null);
    }
  };

  const check = useMemo(() => (pasted.trim() ? normaliseBase64(pasted) : null), [pasted]);
  const head = useMemo(() => {
    if (!check?.ok) return null;
    try {
      return sniffType(Uint8Array.from(atob(check.b64.slice(0, 64)), (c) => c.charCodeAt(0)));
    } catch {
      return null;
    }
  }, [check]);
  const estBytes = check?.ok ? Math.floor((check.b64.length * 3) / 4) - (check.b64.endsWith("==") ? 2 : check.b64.endsWith("=") ? 1 : 0) : 0;

  const decodeDownload = async () => {
    if (!check?.ok) return;
    setProgress(0);
    try {
      const bytes = await decodeToBytes(check.b64, (p) => setProgress(p));
      const type = sniffType(bytes);
      const fname = name.replace(/[\\/:*?"<>|]+/g, "-") + (type && !name.includes(".") ? `.${type.ext}` : name.includes(".") ? "" : ".bin");
      downloadBlob(new Blob([bytes as BlobPart], { type: type?.mime ?? "application/octet-stream" }), fname);
      track("download_clicked", { tool: "base64-encoder-decoder", format: "file" });
    } catch {
      setError("This Base64 couldn't be decoded.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="grid gap-4">
      <Segmented
        label="File direction"
        className="w-full sm:w-[380px]"
        value={dir}
        onChange={(v) => {
          setDir(v as "encode" | "decode");
          setError(null);
        }}
        options={[
          { value: "encode", label: "File → Base64" },
          { value: "decode", label: "Base64 → File" },
        ]}
      />
      {dir === "encode" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
          <DropZone accept="*/*" onFiles={(f) => f[0] && encode(f[0])} title="Drop any file" subtitle="or click to browse · up to 25 MB" formats={["Images", "PDF", "Fonts", "Any file"]} compact={Boolean(file)} />
          <Panel className="p-5">
            {progress !== null ? (
              <div aria-live="polite">
                <p className="flex items-center gap-2 text-sm">
                  <Loader2 aria-hidden className="size-4 animate-spin text-orange" /> Encoding {file?.name}…
                </p>
                <div className="mt-3">
                  <ProgressBar value={progress * 100} label="Encoding progress" />
                </div>
              </div>
            ) : encoded && file ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2 aria-hidden className="size-4" /> Encoded {file.name}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2.5">
                  <Metric label="File size" value={formatBytes(file.size)} />
                  <Metric label="Base64 size" value={`${formatBytes(encoded.length)} (+${Math.round((encoded.length / Math.max(1, file.size) - 1) * 100)}%)`} />
                </dl>
                <pre className="mt-3 max-h-36 overflow-hidden whitespace-pre-wrap break-all rounded-[10px] bg-ivory px-3 py-2 font-mono text-[0.72rem] text-ink-2">
                  {encoded.slice(0, 600)}
                  {encoded.length > 600 ? "…" : ""}
                </pre>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CopyButton text={() => encoded} variant="primary" label="Copy Base64" />
                  <CopyButton text={() => `data:${file.type || "application/octet-stream"};base64,${encoded}`} label="Copy data URL" />
                  <DownloadButton variant="secondary" className="!h-10 text-sm" onClick={() => downloadBlob(new Blob([encoded], { type: "text/plain" }), `${file.name}.b64.txt`)}>
                    <Download aria-hidden className="size-4" /> .txt
                  </DownloadButton>
                </div>
              </motion.div>
            ) : (
              <p className="text-sm text-ink-2">Choose a file to encode it. Large files are processed in chunks, so the page stays responsive.</p>
            )}
            {error && (
              <div className="mt-3">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
          <Editor
            id="b64-file-input"
            label="Base64 or data URL"
            mono
            // Huge pastes become a read-only preview so editing can never truncate the real data.
            value={pasted.length > PREVIEW * 5 ? pasted.slice(0, PREVIEW) + "\n… (preview only — the full data is kept; Clear to start again)" : pasted}
            readOnly={pasted.length > PREVIEW * 5}
            onChange={(v) => setPasted(v)}
            minHeight={260}
            tone={check && !check.ok ? "error" : "default"}
            placeholder="Paste Base64 here (data:…;base64, prefixes are fine)"
            meta={pasted ? `${nf.format(pasted.length)} chars` : undefined}
            actions={
              <EditorButton onClick={() => setPasted("")} disabled={!pasted}>
                <Eraser aria-hidden className="size-3.5" /> Clear
              </EditorButton>
            }
          />
          <Panel className="p-5">
            {check && !check.ok ? (
              <Notice tone="error">{check.message}</Notice>
            ) : check?.ok ? (
              <>
                <dl className="grid grid-cols-2 gap-2.5">
                  <Metric label="Decoded size" value={formatBytes(estBytes)} />
                  <Metric label="Detected type" value={head ? head.ext.toUpperCase() : "Unknown"} />
                </dl>
                <div className="mt-4">
                  <FieldLabel htmlFor="b64-name">File name</FieldLabel>
                  <input id="b64-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 outline-none focus:border-charcoal" />
                  <p className="mt-1 text-xs text-ink-2">{head ? `.${head.ext} is added automatically.` : "Add an extension if you know the file type."}</p>
                </div>
                <DownloadButton className="mt-4 w-full" onClick={decodeDownload} disabled={progress !== null}>
                  {progress !== null ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FileDown aria-hidden className="size-4" />} Download file
                </DownloadButton>
              </>
            ) : (
              <p className="text-sm text-ink-2">Paste Base64 to turn it back into a file — images, PDFs and more are recognised automatically.</p>
            )}
            {error && (
              <div className="mt-3">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export default function Base64Tool() {
  const [tab, setTab] = useState<"text" | "file">("text");
  useEffect(() => {
    track("tool_opened", { tool: "base64-encoder-decoder" });
  }, []);
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Input type"
          className="w-full sm:w-[260px]"
          value={tab}
          onChange={(v) => setTab(v as "text" | "file")}
          options={[
            { value: "text", label: "Text" },
            { value: "file", label: "File" },
          ]}
        />
        <p className="flex items-center gap-2 text-sm text-ink-2">
          <ShieldAlert aria-hidden className="size-4 shrink-0 text-orange-ink" />
          Base64 is an encoding, not encryption — anyone can decode it.
        </p>
      </div>
      <div className={clsx(tab !== "text" && "hidden")}>
        <TextMode />
      </div>
      {tab === "file" && <FileMode />}
    </div>
  );
}
