"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, CheckCircle2, ChevronsUpDown, Download, Eraser, FileUp, GitCompare, Info, Loader2, Sparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, Notice, Panel, Segmented } from "./ui";
import { Editor, EditorButton } from "./Editor";
import { DIFF_DEFAULTS, DIFF_SAMPLE_A, DIFF_SAMPLE_B, compareTexts, splitLines, unifiedDiff, type DiffOptions, type DiffResult, type Row, type Segment } from "@/lib/text-diff";
import { downloadBlob, formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

const MAX_CHARS = 5_000_000;
const MAX_FILE = 10 * 1024 * 1024;
const AUTO_LIMIT = 300_000;
const CONTEXT = 3;
const MAX_RENDER = 4000;
const nf = new Intl.NumberFormat("en-US");
const ACCEPT = ".txt,.md,.markdown,.csv,.tsv,.json,.xml,.html,.htm,.css,.scss,.js,.mjs,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.h,.cs,.go,.rs,.rb,.php,.sql,.sh,.yml,.yaml,.toml,.ini,.env,.log,.srt,.vtt,.diff,.patch,text/*";

/** User-perceived characters (grapheme clusters, so 👨‍👩‍👧 counts once); code points for very large texts. */
const graphemes = (s: string) => {
  const S = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<unknown> } }).Segmenter;
  if (!S || s.length > 100_000) return Array.from(s).length;
  let n = 0;
  for (const _ of new S(undefined, { granularity: "grapheme" }).segment(s)) n++; // eslint-disable-line @typescript-eslint/no-unused-vars
  return n;
};

type Status = { state: "idle" } | { state: "working" } | { state: "done"; result: DiffResult; a: string; b: string; opts: DiffOptions } | { state: "error"; message: string };

function Segs({ text, segs, kind }: { text: string; segs?: Segment[]; kind: "del" | "ins" }) {
  if (!segs) return <>{text || " "}</>;
  return (
    <>
      {segs.map(([s, e, ch], i) =>
        ch ? (
          kind === "del" ? (
            <del key={i} className="rounded-[3px] bg-[#f2c4bd] text-[#6d1f18] decoration-[#8f2f27]/70">
              {text.slice(s, e)}
            </del>
          ) : (
            <ins key={i} className="rounded-[3px] bg-[#bfe0c9] text-[#17452b] no-underline [text-decoration:underline_#2f7a4f_1px] [text-underline-offset:3px]">
              {text.slice(s, e)}
            </ins>
          )
        ) : (
          <Fragment key={i}>{text.slice(s, e)}</Fragment>
        ),
      )}
      {!text && " "}
    </>
  );
}

const MARK = {
  del: { sign: "−", label: "Removed", cls: "bg-[#fbecea]" },
  add: { sign: "+", label: "Added", cls: "bg-[#e9f3ed]" },
  eq: { sign: "", label: "", cls: "" },
  skip: { sign: "·", label: "Ignored", cls: "bg-ivory text-ink-3" },
};

function Cell({ n, kind, children }: { n: number; kind: keyof typeof MARK | "empty"; children?: React.ReactNode }) {
  if (kind === "empty") return <div className="col-span-3 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(232,222,210,0.5)_6px_7px)]" aria-hidden />;
  const m = MARK[kind];
  return (
    <>
      <span className={clsx("select-none border-r border-line px-2 text-right text-ink-3", m.cls)}>{n + 1}</span>
      <span className={clsx("select-none px-1 text-center font-bold", m.cls, kind === "del" && "text-[#8f2f27]", kind === "add" && "text-[#245c3d]")}>
        <span aria-hidden>{m.sign}</span>
        {m.label && <span className="sr-only">{m.label}</span>}
      </span>
      <span className={clsx("min-w-0 whitespace-pre-wrap py-px pr-3 [overflow-wrap:anywhere]", m.cls)}>{children}</span>
    </>
  );
}

export default function TextDiffChecker() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [opts, setOpts] = useState<DiffOptions>(DIFF_DEFAULTS);
  const [view, setView] = useState<"split" | "unified">("split");
  const [collapse, setCollapse] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [fileError, setFileError] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);
  const seq = useRef(0);
  const fileA = useRef<HTMLInputElement>(null);
  const fileB = useRef<HTMLInputElement>(null);
  const set = <K extends keyof DiffOptions>(k: K, v: DiffOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "text-diff-checker" });
    return () => worker.current?.terminate();
  }, []);

  const tooBig = a.length > MAX_CHARS || b.length > MAX_CHARS;
  const auto = a.length + b.length <= AUTO_LIMIT;

  const run = useCallback(
    (ta: string, tb: string, o: DiffOptions) => {
      if (!ta && !tb) return setStatus({ state: "idle" });
      if (ta.length > MAX_CHARS || tb.length > MAX_CHARS) return;
      const id = ++seq.current;
      setStatus({ state: "working" });
      setExpanded(new Set());
      const done = (result: DiffResult) => id === seq.current && setStatus({ state: "done", result, a: ta, b: tb, opts: o });
      // A new comparison cancels any running one.
      worker.current?.terminate();
      worker.current = null;
      try {
        const w = new Worker(new URL("../../lib/workers/diff.worker.ts", import.meta.url), { type: "module" });
        worker.current = w;
        w.onmessage = (e) => {
          if (e.data.id !== id) return;
          if (e.data.ok) done(e.data.result);
          else setStatus({ state: "error", message: "The comparison failed. Try smaller texts or line mode." });
          w.terminate();
          if (worker.current === w) worker.current = null;
        };
        w.onerror = () => {
          w.terminate();
          if (worker.current === w) worker.current = null;
          if (id === seq.current) setTimeout(() => done(compareTexts(ta, tb, o)), 0);
        };
        w.postMessage({ id, a: ta, b: tb, opts: o });
      } catch {
        // Workers unavailable: compare on the main thread.
        setTimeout(() => done(compareTexts(ta, tb, o)), 0);
      }
    },
    [],
  );

  // Live comparison for normal-sized texts; large texts wait for the Compare button.
  useEffect(() => {
    if (!auto || tooBig) return;
    const t = setTimeout(() => run(a, b, opts), a.length + b.length > 20_000 ? 350 : 120);
    return () => clearTimeout(t);
  }, [a, b, opts, auto, tooBig, run]);

  const loadFile = async (file: File | undefined, side: "a" | "b") => {
    setFileError(null);
    if (!file) return;
    if (file.size > MAX_FILE) return setFileError(`${file.name} is ${formatBytes(file.size)}. Text files up to ${formatBytes(MAX_FILE)} can be compared.`);
    try {
      const head = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
      if (head.includes(0)) return setFileError(`${file.name} looks like a binary file (it contains null bytes). Only plain-text files can be compared.`);
      const text = (await file.text()).replace(/^﻿/, "");
      (side === "a" ? setA : setB)(text);
      track("file_uploaded", { tool: "text-diff-checker", file_count: 1 });
    } catch {
      setFileError(`${file.name} couldn't be read.`);
    }
  };

  const done = status.state === "done" ? status : null;
  const stale = done && (done.a !== a || done.b !== b || JSON.stringify(done.opts) !== JSON.stringify(opts));
  // Line-ending style is only worth mentioning when the two texts actually use different line endings.
  const eolDiffers = done?.result.notes.some((n) => n.startsWith("Line endings differ")) ?? false;
  const ignoring = done ? ([done.opts.ignoreCase && "letter case", done.opts.ignoreWhitespace ? "all whitespace" : done.opts.trim && "leading/trailing whitespace", done.opts.ignoreBlankLines && "blank lines", done.opts.normalizeEol && eolDiffers && "line-ending style"].filter(Boolean) as string[]) : [];

  const unified = useMemo(() => {
    if (!done) return "";
    const o = done.opts;
    const header = [o.ignoreCase && "case", o.ignoreWhitespace ? "all whitespace" : o.trim && "leading/trailing whitespace", o.ignoreBlankLines && "blank lines"].filter(Boolean);
    return unifiedDiff(done.result, CONTEXT, { a: "original", b: "modified" }, header.length ? [`# Compared ignoring ${header.join(", ")}; unchanged lines show the original text.`] : []);
  }, [done]);

  // Which rows to show: everything, or changes plus context with collapsible gaps.
  const items = useMemo(() => {
    if (!done) return [];
    const rows = done.result.rows;
    const keep = new Uint8Array(rows.length);
    if (!collapse) keep.fill(1);
    else
      rows.forEach((r, i) => {
        if (r.k === "del" || r.k === "add" || r.k === "mod") for (let j = Math.max(0, i - CONTEXT); j <= Math.min(rows.length - 1, i + CONTEXT); j++) keep[j] = 1;
      });
    const out: ({ t: "row"; i: number } | { t: "gap"; from: number; to: number })[] = [];
    for (let i = 0; i < rows.length; ) {
      if (keep[i] || expanded.has(i)) {
        out.push({ t: "row", i });
        i++;
        continue;
      }
      let j = i;
      while (j < rows.length && !keep[j]) j++;
      if (j - i <= 2) for (let k = i; k < j; k++) out.push({ t: "row", i: k });
      else out.push({ t: "gap", from: i, to: j });
      i = j;
    }
    return out;
  }, [done, collapse, expanded]);

  const expand = (from: number, to: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      for (let i = from; i < to; i++) n.add(i);
      return n;
    });

  const renderSplit = (r: Row, key: number) => {
    const { linesA: LA, linesB: LB } = done!.result;
    const left = r.a >= 0 ? <Cell n={r.a} kind={r.k === "eq" ? "eq" : r.k === "skipA" ? "skip" : "del"}>{<Segs text={LA[r.a]} segs={r.sa} kind="del" />}</Cell> : <Cell n={0} kind="empty" />;
    const right = r.b >= 0 ? <Cell n={r.b} kind={r.k === "eq" ? "eq" : r.k === "skipB" ? "skip" : "add"}>{<Segs text={LB[r.b]} segs={r.sb} kind="ins" />}</Cell> : <Cell n={0} kind="empty" />;
    return (
      <div key={key} className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)_3rem_1.5rem_minmax(0,1fr)] border-b border-line/60 last:border-0 max-sm:grid-cols-[2.5rem_1.25rem_minmax(0,1fr)_2.5rem_1.25rem_minmax(0,1fr)]">
        {left}
        <span className="contents [&>*:first-child]:border-l [&>*:first-child]:border-line">{right}</span>
      </div>
    );
  };

  const renderUnifiedBlock = (rows: Row[], key: number) => {
    const { linesA: LA, linesB: LB } = done!.result;
    const lines: React.ReactNode[] = [];
    const minus: React.ReactNode[] = [];
    const plus: React.ReactNode[] = [];
    const line = (k: string, n: number, kind: keyof typeof MARK, content: React.ReactNode) => (
      <div key={k} className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] border-b border-line/60 last:border-0">
        <Cell n={n} kind={kind}>
          {content}
        </Cell>
      </div>
    );
    rows.forEach((r, i) => {
      if (r.k === "eq") {
        lines.push(...minus.splice(0), ...plus.splice(0));
        lines.push(line(`e${i}`, r.a, "eq", LA[r.a] || " "));
      } else if (r.k === "skipA") lines.push(line(`sa${i}`, r.a, "skip", LA[r.a] || " "));
      else if (r.k === "skipB") lines.push(line(`sb${i}`, r.b, "skip", LB[r.b] || " "));
      else {
        if (r.a >= 0) minus.push(line(`d${i}`, r.a, "del", <Segs text={LA[r.a]} segs={r.sa} kind="del" />));
        if (r.b >= 0) plus.push(line(`a${i}`, r.b, "add", <Segs text={LB[r.b]} segs={r.sb} kind="ins" />));
      }
    });
    lines.push(...minus, ...plus);
    return <Fragment key={key}>{lines}</Fragment>;
  };

  let rendered = 0;
  const body: React.ReactNode[] = [];
  if (done) {
    const rows = done.result.rows;
    let block: Row[] = [];
    const flush = (k: number) => {
      if (block.length) body.push(renderUnifiedBlock(block, k));
      block = [];
    };
    for (let idx = 0; idx < items.length && rendered < MAX_RENDER; idx++) {
      const it = items[idx];
      if (it.t === "gap") {
        if (view === "unified") flush(idx);
        body.push(
          <div key={`g${it.from}`} className="border-b border-line/60 bg-ivory-2/60">
            <button type="button" onClick={() => expand(it.from, it.to)} className="flex w-full items-center justify-center gap-2 py-1.5 text-xs font-medium text-ink-2 hover:text-charcoal">
              <ChevronsUpDown aria-hidden className="size-3.5" /> Show {nf.format(it.to - it.from)} unchanged lines
            </button>
          </div>,
        );
        continue;
      }
      rendered++;
      if (view === "split") body.push(renderSplit(rows[it.i], it.i));
      else block.push(rows[it.i]);
    }
    if (view === "unified") flush(-1);
  }
  const hiddenByCap = done ? items.filter((x) => x.t === "row").length - rendered : 0;

  const stats = done?.result.stats;
  const counts = useMemo(() => (done ? [graphemes(done.a), graphemes(done.b)] : [0, 0]), [done]);
  const granularityWord = opts.granularity === "char" ? "characters" : "words";

  return (
    <div className="grid gap-4">
      {/* Options */}
      <Panel className="grid gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 md:flex md:gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium" id="diff-mode-l">
                Compare by
              </p>
              <Segmented
                label="Compare by"
                size="sm"
                className="md:w-[290px]"
                value={opts.granularity}
                onChange={(v) => set("granularity", v)}
                options={[
                  { value: "line", label: "Line" },
                  { value: "word", label: "Word" },
                  { value: "char", label: "Character" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">View</p>
              <Segmented
                label="View"
                size="sm"
                className="md:w-[230px]"
                value={view}
                onChange={setView}
                options={[
                  { value: "split", label: "Side by side" },
                  { value: "unified", label: "Unified" },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setA(b); setB(a); }} disabled={!a && !b} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal disabled:opacity-40">
              <ArrowLeftRight aria-hidden className="size-4" /> Swap
            </button>
            <button type="button" onClick={() => { setA(DIFF_SAMPLE_A); setB(DIFF_SAMPLE_B); }} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal">
              <Sparkles aria-hidden className="size-4" /> Example
            </button>
            <button type="button" onClick={() => { setA(""); setB(""); setStatus({ state: "idle" }); }} disabled={!a && !b} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-40">
              <Eraser aria-hidden className="size-4" /> Clear both
            </button>
            <button type="button" onClick={() => run(a, b, opts)} disabled={(!a && !b) || tooBig} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              <GitCompare aria-hidden className="size-4" /> Compare
            </button>
          </div>
        </div>
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Ignore options</legend>
          {(
            [
              ["ignoreCase", "Ignore case"],
              ["trim", "Ignore leading/trailing spaces"],
              ["ignoreWhitespace", "Ignore all whitespace"],
              ["ignoreBlankLines", "Ignore blank lines"],
              ["normalizeEol", "Normalize line endings"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className={clsx("inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-[0.82rem] transition-colors sm:px-3 sm:py-1.5 sm:text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-charcoal", opts[k] ? "border-charcoal bg-card" : "border-line bg-ivory hover:border-line-strong")}>
              <input type="checkbox" checked={opts[k]} onChange={(e) => set(k, e.target.checked)} className="size-3.5 accent-[#F07845]" />
              {label}
            </label>
          ))}
        </fieldset>
      </Panel>

      {/* Inputs */}
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {(["a", "b"] as const).map((side) => {
          const value = side === "a" ? a : b;
          const setter = side === "a" ? setA : setB;
          const ref = side === "a" ? fileA : fileB;
          return (
            <Editor
              key={side}
              id={`diff-${side}`}
              label={side === "a" ? "Original text" : "Modified text"}
              value={value}
              onChange={setter}
              minHeight={240}
              mono
              placeholder={side === "a" ? "Paste the original version here…" : "Paste the changed version here…"}
              meta={value ? `${nf.format(splitLines(value, true).length)} lines · ${nf.format(graphemes(value))} chars` : undefined}
              tone={value.length > MAX_CHARS ? "error" : "default"}
              actions={
                <>
                  <EditorButton onClick={() => ref.current?.click()}>
                    <FileUp aria-hidden className="size-3.5" /> Open file
                  </EditorButton>
                  <EditorButton onClick={() => setter("")} disabled={!value}>
                    <Eraser aria-hidden className="size-3.5" /> Clear
                  </EditorButton>
                  <input
                    ref={ref}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    aria-label={`Open a text file as the ${side === "a" ? "original" : "modified"} text`}
                    onChange={(e) => {
                      void loadFile(e.target.files?.[0], side);
                      e.target.value = "";
                    }}
                  />
                </>
              }
            />
          );
        })}
      </div>

      {fileError && <Notice tone="error">{fileError}</Notice>}
      {tooBig && <Notice tone="error">Each text can be up to {nf.format(MAX_CHARS)} characters. Split very large documents into parts to compare them.</Notice>}

      {/* Status + stats */}
      <div aria-live="polite" role="status" className="grid gap-3">
        {status.state === "idle" && <p className="rounded-[14px] border border-line bg-ivory-2 px-4 py-3 text-sm text-ink-2">Paste two versions of a text, open files or load the example. {auto ? "Differences appear as you type." : ""}</p>}
        {status.state === "working" && (
          <p className="flex items-center gap-2 rounded-[14px] border border-line bg-card px-4 py-3 text-sm">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Comparing…
          </p>
        )}
        {status.state === "error" && (
          <p className="flex items-center gap-2 rounded-[14px] border border-error/30 bg-[#fbecea] px-4 py-3 text-sm text-[#8f2f27]">
            <XCircle aria-hidden className="size-4" /> {status.message}
          </p>
        )}
        {!auto && !tooBig && (a || b) && (stale || status.state === "idle") && <p className="rounded-[14px] border border-[#e5c98f] bg-[#fbf3e3] px-4 py-3 text-sm text-[#8a5a12]">These texts are large, so they aren&rsquo;t compared on every keystroke. Press Compare to update the result.</p>}
        {done && (
          <div data-testid="diff-summary" className={clsx("rounded-[14px] border px-4 py-3", done.result.same ? "border-success/30 bg-[#f1f7f3]" : "border-line bg-card")}>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold">
              {done.result.identical ? (
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 aria-hidden className="size-4" /> The texts are identical.
                </span>
              ) : done.result.same ? (
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2 aria-hidden className="size-4" /> {ignoring.length ? `No differences when ignoring ${ignoring.join(", ")}.` : "No differences in the compared lines."}
                </span>
              ) : (
                <span>
                  {nf.format(stats!.sections)} changed {stats!.sections === 1 ? "section" : "sections"}
                </span>
              )}
              {ignoring.length > 0 && !done.result.same && <span className="text-sm font-normal text-ink-2">Ignoring {ignoring.join(", ")} — those differences aren&rsquo;t counted.</span>}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" data-testid="diff-stats">
              <div className="rounded-[10px] bg-[#e9f3ed] px-3 py-2">
                <dt className="text-xs text-[#245c3d]">+ Lines added</dt>
                <dd className="font-mono text-[0.95rem]">{nf.format(stats!.added)}</dd>
              </div>
              <div className="rounded-[10px] bg-[#fbecea] px-3 py-2">
                <dt className="text-xs text-[#8f2f27]">− Lines removed</dt>
                <dd className="font-mono text-[0.95rem]">{nf.format(stats!.removed)}</dd>
              </div>
              <div className="rounded-[10px] bg-ivory px-3 py-2">
                <dt className="text-xs text-ink-2">Changed sections</dt>
                <dd className="font-mono text-[0.95rem]">{nf.format(stats!.sections)}</dd>
              </div>
              {done.opts.granularity !== "line" && (
                <div className="rounded-[10px] bg-ivory px-3 py-2">
                  <dt className="text-xs text-ink-2">{done.opts.granularity === "char" ? "Characters" : "Words"} +/− in changed lines</dt>
                  <dd className="font-mono text-[0.95rem]">
                    +{nf.format(stats!.tokensAdded)} / −{nf.format(stats!.tokensRemoved)}
                  </dd>
                </div>
              )}
              <div className="rounded-[10px] bg-ivory px-3 py-2">
                <dt className="text-xs text-ink-2">Original characters</dt>
                <dd className="font-mono text-[0.95rem]">{nf.format(counts[0])}</dd>
              </div>
              <div className="rounded-[10px] bg-ivory px-3 py-2">
                <dt className="text-xs text-ink-2">Modified characters</dt>
                <dd className="font-mono text-[0.95rem]">{nf.format(counts[1])}</dd>
              </div>
            </dl>
            {!done.result.same && <p className="mt-2 text-xs text-ink-2">A changed line counts once as removed and once as added; it&rsquo;s shown as a pair{done.opts.granularity !== "line" ? ` with the changed ${granularityWord} highlighted` : ""}.</p>}
            {[...done.result.notes, ...(done.result.complete ? [] : ["These texts are very different, so part of the comparison was simplified to whole-block changes to finish in time. Every difference is still shown."])].map((n) => (
              <p key={n} className="mt-2 flex gap-2 text-sm text-charcoal">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-ink" /> {n}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Result */}
      {done && (done.result.rows.length > 0 || done.a || done.b) && (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold">Comparison</p>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={collapse} onChange={(e) => setCollapse(e.target.checked)} className="size-3.5 accent-[#F07845]" /> Hide unchanged lines
              </label>
              <span className="hidden items-center gap-3 text-xs text-ink-2 sm:flex" aria-hidden>
                <span>
                  <del className="rounded-[3px] bg-[#f2c4bd] px-1 text-[#6d1f18]">removed</del>
                </span>
                <span>
                  <ins className="rounded-[3px] bg-[#bfe0c9] px-1 text-[#17452b] [text-decoration:underline_#2f7a4f_1px]">added</ins>
                </span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <CopyButton text={() => unified} label="Copy unified diff" className="!h-9" onCopied={() => track("copy_clicked", { tool: "text-diff-checker", format: "diff" })} />
              <CopyButton text={() => done.b} label="Copy modified text" className="!h-9" />
              <button
                type="button"
                onClick={() => {
                  downloadBlob(new Blob([unified], { type: "text/x-diff;charset=utf-8" }), "comparison.diff");
                  track("download_clicked", { tool: "text-diff-checker", format: "diff" });
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
              >
                <Download aria-hidden className="size-4" /> Download .diff
              </button>
              <button type="button" onClick={() => setStatus({ state: "idle" })} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                <XCircle aria-hidden className="size-4" /> Clear comparison
              </button>
            </div>
          </div>
          {view === "split" && (
            <div className="grid grid-cols-2 border-b border-line bg-ivory text-xs font-medium text-ink-2" aria-hidden>
              <span className="px-3 py-1.5">Original</span>
              <span className="border-l border-line px-3 py-1.5">Modified</span>
            </div>
          )}
          <div role="region" tabIndex={0} aria-label={view === "split" ? "Side-by-side comparison" : "Unified comparison"} data-testid="diff-view" className="max-h-[70vh] overflow-auto font-mono text-[0.8rem] leading-[1.55rem]">
            {body.length ? body : <p className="p-4 font-sans text-sm text-ink-2">Nothing to show.</p>}
          </div>
          {hiddenByCap > 0 && <p className="border-t border-line px-4 py-2 text-xs text-ink-2">Showing the first {nf.format(MAX_RENDER)} lines of the comparison. Download the .diff for the complete result.</p>}
        </Panel>
      )}
    </div>
  );
}
