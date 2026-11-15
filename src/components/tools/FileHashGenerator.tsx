"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, ShieldAlert, Trash2, X, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, DropZone, FieldLabel, Notice, Panel, ProgressBar, RejectionNotice, Segmented, Toggle } from "./ui";
import { ALGOS, HEX_LENGTH, MAX_FILE_BYTES, NATIVE_MAX_BYTES, hashBlob, hashText, nativeSubtle, parseExpected, verify, type Engine, type HashAlgo, type Verdict } from "@/lib/hash";
import { buildCsv } from "@/lib/csv-write";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const MAX_FILES = 50;
const nf = new Intl.NumberFormat("en-US");

interface Item {
  key: number;
  job: number;
  file: File;
  algo: HashAlgo;
  status: "queued" | "hashing" | "done" | "error";
  done: number;
  hex?: string;
  engine?: Engine;
  error?: string;
}

let keySeq = 0;
let jobSeq = 0;

function VerdictBadge({ v }: { v: Verdict }) {
  if (v === "none") return null;
  if (v === "match")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f3ed] px-2.5 py-1 text-xs font-bold text-[#245c3d]">
        <CheckCircle2 aria-hidden className="size-3.5" /> Match
      </span>
    );
  if (v === "mismatch")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbecea] px-2.5 py-1 text-xs font-bold text-[#8f2f27]">
        <XCircle aria-hidden className="size-3.5" /> Does not match
      </span>
    );
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory-2 px-2.5 py-1 text-xs text-ink-2">No expected checksum for this file</span>;
}

export default function FileHashGenerator() {
  const [mode, setMode] = useState<"files" | "text">("files");
  const [algo, setAlgo] = useState<HashAlgo>("SHA-256");
  const [upper, setUpper] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [textHash, setTextHash] = useState<{ hex: string; algo: HashAlgo; text: string } | null>(null);
  const [expectedRaw, setExpectedRaw] = useState("");
  const worker = useRef<Worker | null>(null);
  const active = useRef<number | null>(null);
  const [cryptoOk, setCryptoOk] = useState(true);

  useEffect(() => {
    track("tool_opened", { tool: "file-hash-generator" });
    setCryptoOk(Boolean(nativeSubtle())); // eslint-disable-line react-hooks/set-state-in-effect
    return () => worker.current?.terminate();
  }, []);

  const stopWorker = () => {
    worker.current?.terminate();
    worker.current = null;
    active.current = null;
  };

  const onMessage = (e: MessageEvent<{ type: string; job: number; done?: number; hex?: string; engine?: Engine; error?: string }>) => {
    const m = e.data;
    if (m.job !== active.current) return;
    if (m.type === "progress") setItems((l) => l.map((i) => (i.job === m.job ? { ...i, done: m.done! } : i)));
    else {
      active.current = null;
      setItems((l) => l.map((i) => (i.job === m.job ? (m.type === "done" ? { ...i, status: "done", hex: m.hex, engine: m.engine, done: i.file.size } : { ...i, status: "error", error: m.error }) : i)));
    }
  };

  // Hash queued files one at a time.
  useEffect(() => {
    if (active.current !== null) return;
    const next = items.find((i) => i.status === "queued");
    if (!next) return;
    active.current = next.job;
    setItems((l) => l.map((i) => (i.job === next.job ? { ...i, status: "hashing" } : i))); // eslint-disable-line react-hooks/set-state-in-effect
    try {
      if (!worker.current) {
        worker.current = new Worker(new URL("../../lib/workers/hash.worker.ts", import.meta.url), { type: "module" });
        worker.current.onmessage = onMessage;
        worker.current.onerror = () => {
          const job = active.current;
          stopWorker();
          setItems((l) => l.map((i) => (i.job === job ? { ...i, status: "error", error: "Hashing stopped unexpectedly. The file may be too large for this device's memory." } : i)));
        };
      }
      worker.current.postMessage({ job: next.job, file: next.file, algo: next.algo });
    } catch {
      // No worker support: hash on the main thread (still chunked for large files).
      const job = next.job;
      hashBlob(next.file, next.algo, (done) => setItems((l) => l.map((i) => (i.job === job ? { ...i, done } : i))))
        .then((r) => onMessage({ data: { type: "done", job, hex: r!.hex, engine: r!.engine } } as MessageEvent))
        .catch(() => onMessage({ data: { type: "error", job, error: "This file couldn't be read." } } as MessageEvent));
    }
  }, [items]);

  const addFiles = (files: File[]) => {
    const rej: string[] = [];
    const room = MAX_FILES - items.length;
    const ok: Item[] = [];
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) rej.push(`${f.name} — ${formatBytes(f.size)} is over the ${formatBytes(MAX_FILE_BYTES)} limit`);
      else if (ok.length >= room) rej.push(`${f.name} — up to ${MAX_FILES} files at a time`);
      else ok.push({ key: ++keySeq, job: ++jobSeq, file: f, algo, status: "queued", done: 0 });
    }
    setRejected(rej);
    if (ok.length) {
      setItems((l) => [...l, ...ok]);
      track("file_uploaded", { tool: "file-hash-generator", file_count: ok.length });
    }
  };

  const changeAlgo = (a: HashAlgo) => {
    setAlgo(a);
    if (items.length) {
      stopWorker();
      setItems((l) => l.map((i) => ({ ...i, algo: a, job: ++jobSeq, status: "queued", done: 0, hex: undefined, engine: undefined, error: undefined })));
    }
  };

  const remove = (key: number) => {
    const it = items.find((i) => i.key === key);
    if (it && it.job === active.current) stopWorker();
    setItems((l) => l.filter((i) => i.key !== key));
  };

  const clearAll = () => {
    stopWorker();
    setItems([]);
    setRejected([]);
  };

  // Text hashing (debounced; Web Crypto or the JS fallback).
  useEffect(() => {
    if (mode !== "text") return;
    let alive = true;
    const t = setTimeout(() => {
      hashText(text, algo).then((r) => alive && setTextHash({ hex: r.hex, algo, text }));
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [text, algo, mode]);

  const expected = useMemo(() => parseExpected(expectedRaw, algo), [expectedRaw, algo]);
  const fmt = (hex: string) => (upper ? hex.toUpperCase() : hex);
  const verdictFor = (hex: string, name?: string, onlyOne = false) => verify(hex, expected, name, onlyOne);

  const doneItems = items.filter((i) => i.status === "done");
  const busy = items.some((i) => i.status === "queued" || i.status === "hashing");
  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);
  const doneBytes = items.reduce((s, i) => s + (i.status === "done" ? i.file.size : i.done), 0);

  const exportCsv = () => {
    const rows = [["file_name", "size_bytes", "algorithm", "hash", "expected", "result"]];
    for (const i of doneItems) {
      const v = verdictFor(i.hex!, i.file.name, items.length === 1);
      const exp = expected.kind === "single" ? expected.hex : expected.kind === "list" ? (expected.entries.find((e) => e.name.split(/[\\/]/).pop() === i.file.name)?.hex ?? "") : "";
      rows.push([i.file.name, String(i.file.size), i.algo, fmt(i.hex!), exp, v === "none" ? "" : v]);
    }
    downloadBlob(new Blob([buildCsv(rows)], { type: "text/csv;charset=utf-8" }), `checksums-${algo.toLowerCase().replace("-", "")}.csv`);
    track("download_clicked", { tool: "file-hash-generator", format: "csv", count: doneItems.length });
  };

  const textCurrent = textHash && textHash.algo === algo && textHash.text === text ? textHash : null;
  const textVerdict = textCurrent ? verdictFor(textCurrent.hex, undefined, true) : "none";

  return (
    <div className="grid gap-4">
      <Panel className="grid gap-4 p-4 sm:p-5 md:grid-cols-[auto_1fr_auto] md:items-end">
        <div>
          <FieldLabel>Hash</FieldLabel>
          <Segmented
            label="What to hash"
            className="md:w-[220px]"
            value={mode}
            onChange={setMode}
            options={[
              { value: "files", label: "Files" },
              { value: "text", label: "Text" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Algorithm</FieldLabel>
          <Segmented
            label="Hash algorithm"
            value={algo}
            onChange={changeAlgo}
            options={ALGOS.map((a) => ({ value: a, label: a, hint: a === "SHA-1" ? "legacy" : `${HEX_LENGTH[a] * 4}-bit` }))}
          />
        </div>
        <Toggle checked={upper} onChange={setUpper} label="Uppercase" description={upper ? "A–F" : "a–f"} />
      </Panel>

      {algo === "SHA-1" && (
        <p role="note" className="flex items-start gap-2 rounded-[12px] border border-[#e5c98f] bg-[#fbf3e3] px-4 py-3 text-sm text-[#6b4510]">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          SHA-1 is a legacy algorithm and should not be used for modern cryptographic security. Use it only to check against an existing SHA-1 checksum.
        </p>
      )}
      {!cryptoOk && <Notice tone="info">Your browser doesn&rsquo;t offer the Web Crypto API on this page, so the built-in JavaScript implementation is used instead. Results are identical; it&rsquo;s just slower.</Notice>}

      {mode === "files" ? (
        <>
          <DropZone multiple accept="*/*" onFiles={addFiles} title="Drop files to hash" subtitle={`Any file type · up to ${formatBytes(MAX_FILE_BYTES)} each · ${MAX_FILES} files`} formats={["ISO", "ZIP", "EXE", "DMG", "PDF", "APK", "Any"]} compact={items.length > 0} />
          <RejectionNotice list={rejected} onClose={() => setRejected([])} />
        </>
      ) : (
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <label htmlFor="hash-text" className="text-sm font-bold">
              Text
            </label>
            <span className="font-mono text-xs text-ink-2">{nf.format(new TextEncoder().encode(text).length)} bytes (UTF-8)</span>
          </div>
          <textarea
            id="hash-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            placeholder="Type or paste text to hash…"
            className="min-h-[160px] w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.9rem] outline-none focus-visible:outline-none"
          />
          <div className="border-t border-line bg-ivory px-4 py-3">
            <p className="text-xs text-ink-2">
              {algo} of the text{text ? "" : " (empty input)"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <code data-testid="text-hash" className="min-w-0 flex-1 break-all font-mono text-[0.92rem] text-charcoal">
                {textCurrent ? fmt(textCurrent.hex) : "…"}
              </code>
              <CopyButton text={() => (textCurrent ? fmt(textCurrent.hex) : "")} label="Copy hash" className="!h-9" onCopied={() => track("copy_clicked", { tool: "file-hash-generator", format: "text" })} />
              <VerdictBadge v={textVerdict} />
            </div>
            <p className="mt-2 text-xs text-ink-2">The text is encoded as UTF-8. Line breaks typed here are LF (\n); a file saved on Windows with CRLF line breaks will have a different hash.</p>
          </div>
        </Panel>
      )}

      {/* Expected checksum */}
      <Panel className="p-4 sm:p-5">
        <FieldLabel htmlFor="hash-expected" hint="optional">
          Expected checksum
        </FieldLabel>
        <textarea
          id="hash-expected"
          value={expectedRaw}
          onChange={(e) => setExpectedRaw(e.target.value)}
          spellCheck={false}
          rows={2}
          placeholder={`Paste the ${algo} value published by the source, or a list like “<checksum>  filename”`}
          aria-describedby="hash-expected-help"
          aria-invalid={expected.kind === "invalid"}
          className={clsx("w-full resize-y rounded-[10px] border bg-card px-3.5 py-2.5 font-mono text-[0.88rem] outline-none focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]", expected.kind === "invalid" ? "border-error/60" : "border-line-strong")}
        />
        <div id="hash-expected-help" aria-live="polite" className="mt-2 text-xs text-ink-2">
          {expected.kind === "invalid" ? (
            <span className="flex items-start gap-1.5 text-sm text-[#8f2f27]" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> Invalid expected hash: {expected.message}
            </span>
          ) : expected.kind === "list" ? (
            `Checksum list with ${expected.entries.length} ${expected.entries.length === 1 ? "entry" : "entries"} — files are matched by name.`
          ) : (
            "Letter case and surrounding spaces are ignored. A match proves the file is identical to the one the checksum was made from — it proves authenticity only if the checksum itself came from a source you trust, such as the publisher's official HTTPS website."
          )}
        </div>
      </Panel>

      {/* File results */}
      {mode === "files" && items.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-sm font-bold" aria-live="polite">
              {busy ? "Hashing… " : ""}
              {`${doneItems.length} of ${items.length} ${items.length === 1 ? "file" : "files"} hashed`}
              {expected.kind !== "empty" && expected.kind !== "invalid" && doneItems.length > 0 && (
                <span className="ml-2 font-normal text-ink-2">
                  · {doneItems.filter((i) => verdictFor(i.hex!, i.file.name, items.length === 1) === "match").length} match
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {busy && (
                <button type="button" onClick={() => { stopWorker(); setItems((l) => l.filter((i) => i.status === "done" || i.status === "error")); }} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong px-3 text-sm hover:border-charcoal">
                  <X aria-hidden className="size-4" /> Cancel
                </button>
              )}
              <CopyButton text={() => doneItems.map((i) => `${fmt(i.hex!)}  ${i.file.name}`).join("\n")} label="Copy all" className="!h-9" />
              <button type="button" onClick={exportCsv} disabled={!doneItems.length} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
                <Download aria-hidden className="size-4" /> Export CSV
              </button>
              <button type="button" onClick={clearAll} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                <Trash2 aria-hidden className="size-4" /> Clear
              </button>
            </div>
          </div>
          {busy && totalBytes > 0 && (
            <div className="border-b border-line px-4 py-3">
              <ProgressBar value={(doneBytes / totalBytes) * 100} label={`${formatBytes(doneBytes)} of ${formatBytes(totalBytes)}`} showLabel />
            </div>
          )}
          <ul className="divide-y divide-line" data-testid="hash-results">
            {items.map((i) => {
              const v = i.status === "done" ? verdictFor(i.hex!, i.file.name, items.length === 1) : "none";
              return (
                <li key={i.key} className="grid gap-2 px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex min-w-0 items-center gap-2">
                      <FileText aria-hidden className="size-4 shrink-0 text-ink-2" />
                      <span className="truncate font-medium" title={i.file.name}>
                        {i.file.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-ink-2" title={`${nf.format(i.file.size)} bytes`}>
                        {formatBytes(i.file.size)}
                      </span>
                    </p>
                    <button type="button" onClick={() => remove(i.key)} aria-label={`Remove ${i.file.name}`} className="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                      <X aria-hidden className="size-4" />
                    </button>
                  </div>
                  {i.status === "done" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[6px] bg-ivory px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-2">{i.algo}</span>
                      <code className="min-w-0 flex-1 break-all font-mono text-[0.85rem] text-charcoal" data-testid="file-hash">
                        {fmt(i.hex!)}
                      </code>
                      <CopyButton text={() => fmt(i.hex!)} iconOnly label={`Copy ${i.algo} of ${i.file.name}`} onCopied={() => track("copy_clicked", { tool: "file-hash-generator", format: "file" })} />
                      <VerdictBadge v={v} />
                    </div>
                  ) : i.status === "error" ? (
                    <p className="flex items-center gap-1.5 text-sm text-[#8f2f27]">
                      <XCircle aria-hidden className="size-4" /> {i.error}
                    </p>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-ink-2">
                      {i.status === "hashing" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <span aria-hidden className="size-4" />}
                      <span>{i.status === "hashing" ? (i.file.size > NATIVE_MAX_BYTES ? `Reading in chunks… ${Math.floor((i.done / Math.max(1, i.file.size)) * 100)}%` : "Hashing…") : "Waiting…"}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
