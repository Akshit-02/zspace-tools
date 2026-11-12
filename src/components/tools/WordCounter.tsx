"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ClipboardPaste, Eraser, Settings2 } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel } from "./ui";
import { analyzeText, formatDuration, topWords } from "@/lib/textstats";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={clsx("rounded-[12px] border border-line bg-card", big ? "p-5" : "p-4")}>
      <dt className="text-xs font-medium text-ink-2">{label}</dt>
      <motion.dd
        key={value}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={clsx("mt-1 font-mono tracking-tight text-charcoal", big ? "text-[2.4rem] leading-none" : "text-[1.35rem] leading-tight")}
      >
        {value}
      </motion.dd>
    </div>
  );
}

export default function WordCounter() {
  const [text, setText] = useState("");
  const [readWpm, setReadWpm] = useState(238);
  const [speakWpm, setSpeakWpm] = useState(140);
  const [limit, setLimit] = useState<number | "">("");
  const [showSettings, setShowSettings] = useState(false);
  const deferred = useDeferredValue(text);
  const stats = useMemo(() => analyzeText(deferred), [deferred]);
  const keywords = useMemo(() => topWords(deferred), [deferred]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      track("tool_opened", { tool: "word-counter" });
    }
  }, []);

  const readMin = stats.words / Math.max(readWpm, 1);
  const speakMin = stats.words / Math.max(speakWpm, 1);
  const limitPct = limit ? Math.min(100, (stats.characters / limit) * 100) : 0;
  const overLimit = limit !== "" && stats.characters > limit;

  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.5fr_1fr]">
      <Panel className="flex min-h-[460px] flex-col overflow-hidden transition-[border-color,box-shadow] focus-within:border-charcoal focus-within:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
          <p className="font-mono text-xs text-ink-2">
            {nf.format(stats.words)} words · {nf.format(stats.characters)} chars
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                try {
                  const t = await navigator.clipboard.readText();
                  if (t) setText((prev) => (prev ? `${prev}\n${t}` : t));
                } catch {
                  areaRef.current?.focus();
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
            >
              <ClipboardPaste aria-hidden className="size-4" /> <span className="hidden sm:inline">Paste</span>
            </button>
            <CopyButton
              text={() => text}
              label="Copy"
              className="!h-9"
              onCopied={() => track("copy_clicked", { tool: "word-counter" })}
            />
            <button
              type="button"
              onClick={() => {
                setText("");
                areaRef.current?.focus();
              }}
              disabled={!text}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium transition-colors hover:border-charcoal disabled:opacity-40"
            >
              <Eraser aria-hidden className="size-4" /> Clear
            </button>
          </div>
        </div>
        <label htmlFor="wc-text" className="sr-only">
          Your text
        </label>
        <textarea
          id="wc-text"
          ref={areaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing, or paste your text here…"
          spellCheck
          className="min-h-[380px] w-full flex-1 resize-y bg-transparent focus-visible:outline-none px-5 py-5 text-[1.05rem] leading-[1.75] text-charcoal outline-none placeholder:text-ink-3 sm:px-7 sm:py-6"
        />
        {limit !== "" && (
          <div className="border-t border-line px-5 py-3">
            <div className="flex justify-between font-mono text-xs">
              <span className={overLimit ? "text-error" : "text-ink-2"}>
                {nf.format(stats.characters)} / {nf.format(limit)} characters
              </span>
              <span className={overLimit ? "text-error" : "text-ink-2"}>
                {overLimit ? `${nf.format(stats.characters - limit)} over` : `${nf.format(limit - stats.characters)} left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={clsx("h-full rounded-full transition-[width] duration-200", overLimit ? "bg-error" : "bg-orange")}
                style={{ width: `${limitPct}%` }}
              />
            </div>
          </div>
        )}
      </Panel>

      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3" aria-live="polite">
          <div className="col-span-2">
            <Stat big label="Words" value={nf.format(stats.words)} />
          </div>
          <Stat label="Characters" value={nf.format(stats.characters)} />
          <Stat label="Without spaces" value={nf.format(stats.charactersNoSpaces)} />
          <Stat label="Sentences" value={nf.format(stats.sentences)} />
          <Stat label="Paragraphs" value={nf.format(stats.paragraphs)} />
          <Stat label="Reading time" value={formatDuration(readMin)} />
          <Stat label="Speaking time" value={formatDuration(speakMin)} />
        </dl>

        <Panel className="p-4">
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Settings2 aria-hidden className="size-4 text-orange-ink" /> Speeds &amp; limit
            </span>
            <span className="font-mono text-xs text-ink-2">
              {readWpm} / {speakWpm} wpm
            </span>
          </button>
          {showSettings && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div>
                <FieldLabel htmlFor="wc-read">Reading wpm</FieldLabel>
                <input
                  id="wc-read"
                  type="number"
                  min={50}
                  max={1000}
                  value={readWpm}
                  onChange={(e) => setReadWpm(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 w-full rounded-[10px] border border-line-strong px-3 font-mono text-sm outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <FieldLabel htmlFor="wc-speak">Speaking wpm</FieldLabel>
                <input
                  id="wc-speak"
                  type="number"
                  min={50}
                  max={400}
                  value={speakWpm}
                  onChange={(e) => setSpeakWpm(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 w-full rounded-[10px] border border-line-strong px-3 font-mono text-sm outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <FieldLabel htmlFor="wc-limit">Char limit</FieldLabel>
                <input
                  id="wc-limit"
                  type="number"
                  min={1}
                  placeholder="e.g. 160"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value === "" ? "" : Math.max(1, Math.round(Number(e.target.value)) || 1))}
                  className="h-10 w-full rounded-[10px] border border-line-strong px-3 font-mono text-sm outline-none placeholder:text-ink-3 focus:border-charcoal"
                />
              </div>
            </div>
          )}
        </Panel>

        {keywords.length > 0 && (
          <Panel className="p-4">
            <p className="text-sm font-medium">Most used words</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {keywords.map(([w, n]) => (
                <li key={w} className="rounded-[8px] border border-line bg-ivory px-2 py-1 text-sm">
                  {w} <span className="font-mono text-xs text-ink-2">×{n}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
