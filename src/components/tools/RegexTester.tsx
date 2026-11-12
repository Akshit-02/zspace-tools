"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download, Eraser, RotateCcw, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Notice, inputClass } from "./ui";
import { EXAMPLES, FLAGS, MAX_INPUT, MAX_MATCHES, TIMEOUT_MS, compile, runInWorker, type Match, type RegexResult } from "@/lib/regex";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");
const HIGHLIGHT_LIMIT = 2000;

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  // Last worker result, tagged with the inputs it was computed for.
  const [ran, setRan] = useState<{ key: string; result: RegexResult } | null>(null);
  const [exampleId, setExampleId] = useState<string | null>(null);
  const cancelRef = useRef<() => void>(() => {});

  useEffect(() => {
    track("tool_opened", { tool: "regex-tester" });
  }, []);

  const compiled = useMemo(() => (pattern ? compile(pattern, flags) : null), [pattern, flags]);
  const tooLong = text.length > MAX_INPUT;

  const runKey = JSON.stringify([pattern, flags, text]);
  const runnable = !!pattern && !!compiled?.ok && !tooLong;

  useEffect(() => {
    if (!runnable) return;
    const t = setTimeout(() => {
      const job = runInWorker(pattern, flags, text);
      cancelRef.current = job.cancel;
      job.promise.then((r) => {
        if (r.status !== "empty") setRan({ key: runKey, result: r });
      });
    }, 150);
    return () => {
      clearTimeout(t);
      cancelRef.current();
    };
  }, [runnable, runKey, pattern, flags, text]);

  const running = runnable && ran?.key !== runKey;
  const result: RegexResult = useMemo(() => {
    if (!pattern || tooLong) return { status: "empty" };
    if (compiled && !compiled.ok) return { status: "error", message: compiled.message };
    return ran?.key === runKey ? ran.result : { status: "empty" };
  }, [pattern, tooLong, compiled, ran, runKey]);

  const toggleFlag = (f: string) => setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : FLAGS.map((x) => x.f).filter((x) => cur.includes(x) || x === f).join("")));

  const matches: Match[] = useMemo(() => (result.status === "ok" ? result.matches : []), [result]);
  const example = EXAMPLES.find((e) => e.id === exampleId);

  const segments = useMemo(() => {
    const out: { s: string; m?: number }[] = [];
    let pos = 0;
    matches.slice(0, HIGHLIGHT_LIMIT).forEach((m, i) => {
      if (m.index > pos) out.push({ s: text.slice(pos, m.index) });
      out.push({ s: m.text, m: i });
      pos = Math.max(pos, m.end);
    });
    out.push({ s: text.slice(pos) });
    return out;
  }, [matches, text]);

  const regexLiteral = `/${pattern.replace(/(^|[^\\])\//g, "$1\\/")}/${flags}`;
  const matchesText = () => matches.map((m) => m.text).join("\n");
  const report = () => {
    const lines = [`Pattern: ${regexLiteral}`, `Matches: ${matches.length}${result.status === "ok" && result.truncated ? "+ (stopped at limit)" : ""}`, ""];
    matches.forEach((m, i) => {
      lines.push(`#${i + 1}  [${m.index}–${m.end}]  ${JSON.stringify(m.text)}`);
      m.groups.forEach((g) => lines.push(`    ${g.name ? `${g.name} (group ${g.index})` : `group ${g.index}`}: ${g.value === undefined ? "(not matched)" : JSON.stringify(g.value)}`));
    });
    return lines.join("\n") + "\n";
  };

  const loadExample = (id: string) => {
    const e = EXAMPLES.find((x) => x.id === id);
    if (!e) return;
    setExampleId(id);
    setPattern(e.pattern);
    setFlags(e.flags);
    setText(e.sample);
  };

  return (
    <div className="grid gap-4">
      {/* Pattern */}
      <div className="rounded-[16px] border border-line bg-card p-4">
        <label htmlFor="regex-pattern" className="text-sm font-bold">
          Regular expression
        </label>
        <div
          className={clsx(
            "mt-2 flex items-center rounded-[12px] border bg-card font-mono transition-colors focus-within:border-charcoal",
            result.status === "error" ? "border-error/60" : "border-line-strong",
          )}
        >
          <span aria-hidden className="pl-3 text-lg text-ink-3">/</span>
          <input
            id="regex-pattern"
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              setExampleId(null);
            }}
            placeholder="[A-Z]\w+"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="h-12 min-w-0 flex-1 bg-transparent px-1.5 text-[0.95rem] outline-none"
          />
          <span aria-hidden className="text-lg text-ink-3">/</span>
          <label htmlFor="regex-flags" className="sr-only">
            Flags
          </label>
          <input
            id="regex-flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/\s/g, ""))}
            spellCheck={false}
            className="h-12 w-16 shrink-0 bg-transparent pr-3 text-[0.95rem] text-orange-ink outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Flags">
          {FLAGS.map((f) => (
            <button
              key={f.f}
              type="button"
              aria-pressed={flags.includes(f.f)}
              title={f.hint}
              onClick={() => toggleFlag(f.f)}
              className={clsx(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.82rem] transition-colors",
                flags.includes(f.f) ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card text-ink-2 hover:border-charcoal hover:text-charcoal",
              )}
            >
              <span className="font-mono">{f.f}</span> {f.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton text={() => (pattern ? regexLiteral : "")} label="Copy regex" className="!h-9" onCopied={() => track("copy_clicked", { tool: "regex-tester", format: "regex" })} />
          <label htmlFor="regex-example" className="sr-only">
            Load an example
          </label>
          <select
            id="regex-example"
            value={exampleId ?? ""}
            onChange={(e) => loadExample(e.target.value)}
            className={clsx(inputClass, "!h-9 w-auto min-w-0 max-w-full !py-0 text-sm")}
          >
            <option value="" disabled>
              Load an example…
            </option>
            {EXAMPLES.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        {example && <p className="mt-3 rounded-[10px] bg-ivory px-3 py-2 text-sm text-ink-2">{example.explain}</p>}
      </div>

      {/* Status */}
      <div
        role="status"
        aria-live="polite"
        data-testid="regex-status"
        className={clsx(
          "rounded-[14px] border px-4 py-3 text-sm",
          result.status === "error" || result.status === "timeout" ? "border-error/30 bg-[#fbecea]" : result.status === "ok" ? "border-success/30 bg-[#f1f7f3]" : "border-line bg-ivory-2",
        )}
      >
        {tooLong ? (
          <p className="flex items-center gap-2 text-[#8f2f27]">
            <AlertTriangle aria-hidden className="size-4" /> The test text is {nf.format(text.length)} characters. The limit is {nf.format(MAX_INPUT)}.
          </p>
        ) : result.status === "empty" ? (
          <p className="text-ink-2">{running ? "Matching…" : "Type a pattern and some test text — matches update as you type."}</p>
        ) : result.status === "error" ? (
          <p className="flex items-start gap-2 text-[#8f2f27]">
            <XCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Invalid pattern.</b> {result.message}
            </span>
          </p>
        ) : result.status === "timeout" ? (
          <p className="flex items-start gap-2 text-[#8f2f27]">
            <Clock aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Stopped after {TIMEOUT_MS / 1000} seconds.</b> This pattern may backtrack catastrophically (for example nested quantifiers like <code className="font-mono">(a+)+</code>). Try a more specific pattern.
            </span>
          </p>
        ) : matches.length === 0 ? (
          <p className="flex items-center gap-2 text-ink-2">
            <AlertTriangle aria-hidden className="size-4" /> No matches.
          </p>
        ) : (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-2 font-bold text-success">
              <CheckCircle2 aria-hidden className="size-4" /> {nf.format(matches.length)} match{matches.length === 1 ? "" : "es"}
              {result.truncated ? "+" : ""}
            </span>
            <span className="font-mono text-xs text-ink-2">{result.ms.toFixed(1)} ms</span>
            {result.truncated && <span className="text-ink-2">Stopped at {nf.format(MAX_MATCHES)} matches.</span>}
            {!flags.includes("g") && !flags.includes("y") && <span className="text-ink-2">Add the g flag to find every match.</span>}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Test string */}
        <div className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card focus-within:border-charcoal">
          <div className="flex min-h-[52px] items-center justify-between gap-2 border-b border-line px-4 py-2">
            <label htmlFor="regex-text" className="text-sm font-bold">
              Test string
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-2">{nf.format(text.length)} chars</span>
              <button type="button" onClick={() => setText("")} disabled={!text} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                <Eraser aria-hidden className="size-3.5" /> Clear
              </button>
            </div>
          </div>
          <textarea
            id="regex-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the text to test against…"
            spellCheck={false}
            className="min-h-[220px] flex-1 resize-y bg-transparent px-4 py-3 font-mono text-[0.86rem] leading-[1.6rem] outline-none placeholder:text-ink-3"
          />
          <div className="border-t border-line bg-ivory/50">
            <p className="px-4 pt-2 text-xs font-medium text-ink-2">Highlighted</p>
            <pre data-testid="regex-highlight" className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words px-4 pb-3 pt-1 font-mono text-[0.86rem] leading-[1.6rem]">
              {text ? (
                segments.map((seg, i) =>
                  seg.m === undefined ? (
                    <span key={i}>{seg.s}</span>
                  ) : (
                    <mark key={i} className={clsx("rounded-[3px] px-[1px] text-charcoal", seg.m % 2 ? "bg-[#f9c9a8]" : "bg-[#fde3cf]", !seg.s && "inline-block w-[2px] bg-orange")} title={`Match ${seg.m + 1}`}>
                      {seg.s}
                    </mark>
                  ),
                )
              ) : (
                <span className="text-ink-3">Matches will be highlighted here.</span>
              )}
            </pre>
            {matches.length > HIGHLIGHT_LIMIT && <p className="px-4 pb-2 text-xs text-ink-2">Only the first {nf.format(HIGHLIGHT_LIMIT)} matches are highlighted.</p>}
          </div>
        </div>

        {/* Matches */}
        <div className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card">
          <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
            <p className="text-sm font-bold">Matches & groups</p>
            <div className="flex flex-wrap gap-1.5">
              <CopyButton text={matchesText} label="Copy matches" className="!h-8" onCopied={() => track("copy_clicked", { tool: "regex-tester", format: "matches", count: matches.length })} />
              <button
                type="button"
                disabled={!matches.length}
                onClick={() => {
                  downloadBlob(new Blob([report()], { type: "text/plain;charset=utf-8" }), "regex-matches.txt");
                  track("download_clicked", { tool: "regex-tester", format: "txt" });
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35"
              >
                <Download aria-hidden className="size-3.5" /> TXT
              </button>
            </div>
          </div>
          <ol className="max-h-[480px] min-h-[220px] flex-1 divide-y divide-line overflow-auto" data-testid="regex-matches">
            {matches.slice(0, 500).map((m, i) => (
              <li key={i} className="px-4 py-2.5">
                <div className="flex items-baseline gap-3">
                  <span className="w-10 shrink-0 font-mono text-xs text-ink-3">#{i + 1}</span>
                  <code className="min-w-0 break-all rounded bg-[#fde3cf] px-1 font-mono text-[0.86rem]">{m.text || <i className="text-ink-2">empty</i>}</code>
                  <span className="ml-auto shrink-0 font-mono text-xs text-ink-2">
                    {m.index}–{m.end}
                  </span>
                </div>
                {m.groups.length > 0 && (
                  <dl className="ml-[3.25rem] mt-1.5 grid gap-1">
                    {m.groups.map((g) => (
                      <div key={g.index} className="flex gap-2 text-[0.82rem]">
                        <dt className="shrink-0 font-mono text-ink-2">{g.name ? `${g.name}` : `$${g.index}`}</dt>
                        <dd className="min-w-0 break-all font-mono">{g.value === undefined ? <i className="text-ink-3">not matched</i> : g.value || <i className="text-ink-3">empty</i>}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
            {matches.length === 0 && <li className="px-4 py-6 text-sm text-ink-3">No matches yet.</li>}
            {matches.length > 500 && <li className="px-4 py-3 text-sm text-ink-2">…{nf.format(matches.length - 500)} more — download the TXT report for the full list.</li>}
          </ol>
        </div>
      </div>

      <Notice>Patterns run with your browser&apos;s JavaScript regex engine in a separate worker that stops after {TIMEOUT_MS / 1000} seconds. Syntax can differ slightly from PCRE, Python or Java.</Notice>

      {(pattern || text) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPattern("");
              setFlags("g");
              setText("");
              setExampleId(null);
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
