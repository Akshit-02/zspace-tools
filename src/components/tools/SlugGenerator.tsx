"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Download, Eraser, Info, RotateCcw, Sparkles } from "lucide-react";
import { CopyButton, FieldLabel, Panel, Segmented, Toggle } from "./ui";
import { DEFAULT_SLUG, bulkSlugify, previewUrl, slugCsv, slugify, type SlugCase, type SlugOptions } from "@/lib/slug";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const SAMPLE_ONE = "The Best Digital Marketing Strategies for Small Businesses in 2027!";
const SAMPLE_BULK = `How to Make Cold Brew at Home
10 Café Ideas for Small Spaces — 2027 Edition
Straße, Fjörd & Łódź: A European Road Trip
Привет мир: Getting Started
東京 travel guide
How to Make Cold Brew at Home`;

export default function SlugGenerator() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [title, setTitle] = useState("");
  const [bulk, setBulk] = useState("");
  const [base, setBase] = useState("");
  const [trailing, setTrailing] = useState(false);
  const [unique, setUnique] = useState(true);
  const [o, setO] = useState<SlugOptions>(DEFAULT_SLUG);
  const [maxLen, setMaxLen] = useState("");
  const opts = useMemo(() => ({ ...o, maxLength: Math.min(500, Number(maxLen) || 0) }), [o, maxLen]);
  const dTitle = useDeferredValue(title);
  const dBulk = useDeferredValue(bulk);
  const set = <K extends keyof SlugOptions>(k: K, v: SlugOptions[K]) => setO((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    track("tool_opened", { tool: "url-slug-generator" });
  }, []);

  const single = useMemo(() => slugify(dTitle, opts), [dTitle, opts]);
  const rows = useMemo(() => bulkSlugify(dBulk, opts, unique).map((r) => ({ ...r, url: base.trim() ? previewUrl(base, r.slug, trailing) : null })), [dBulk, opts, unique, base, trailing]);
  const fullUrl = base.trim() && single.slug ? previewUrl(base, single.slug, trailing) : null;
  const baseInvalid = base.trim() !== "" && previewUrl(base, "x") === null;

  const reset = () => {
    setTitle("");
    setBulk("");
    setBase("");
    setTrailing(false);
    setO(DEFAULT_SLUG);
    setMaxLen("");
    setUnique(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
      <div className="grid content-start gap-4">
        <Segmented
          label="Mode"
          className="w-full sm:w-[320px]"
          value={mode}
          onChange={(v) => setMode(v as "single" | "bulk")}
          options={[
            { value: "single", label: "Single title" },
            { value: "bulk", label: "Bulk (one per line)" },
          ]}
        />

        {mode === "single" ? (
          <Panel className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="slug-title">Title or text</FieldLabel>
              <div className="flex gap-1">
                <button type="button" onClick={() => setTitle(SAMPLE_ONE)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                  <Sparkles aria-hidden className="size-3.5" /> Sample
                </button>
                <button type="button" onClick={() => setTitle("")} disabled={!title} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                  <Eraser aria-hidden className="size-3.5" /> Clear
                </button>
              </div>
            </div>
            <textarea
              id="slug-title"
              rows={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10 Café Ideas for Small Spaces — 2027 Edition"
              className="w-full resize-y rounded-[12px] border border-line-strong bg-card px-4 py-3 text-lg outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]"
            />

            <div className="mt-5 rounded-[14px] bg-charcoal p-5 text-ivory" aria-live="polite">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ivory/60">Slug</p>
              <motion.p key={single.slug} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-2 min-h-8 break-all font-mono text-[clamp(1.1rem,0.9rem+0.8vw,1.5rem)]" data-testid="slug-output">
                {single.slug || <span className="text-ivory/30">{title.trim() ? "No letters or numbers to use" : "your-slug-appears-here"}</span>}
              </motion.p>
              <p className="mt-1 font-mono text-xs text-ivory/50">{Array.from(single.slug).length} characters</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton text={() => single.slug} variant="primary" label="Copy slug" onCopied={() => track("copy_clicked", { tool: "url-slug-generator" })} />
                {fullUrl && <CopyButton text={() => fullUrl} label="Copy full URL" />}
              </div>
            </div>
            {single.removed.length > 0 && (
              <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" />
                Removed (no ASCII equivalent): <span className="font-mono">{single.removed.slice(0, 20).join(" ")}</span>. Turn on “Keep non-Latin letters” to keep them.
              </p>
            )}
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <label htmlFor="slug-bulk" className="text-sm font-bold">
                Titles <span className="font-normal text-ink-2">— one per line</span>
              </label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setBulk(SAMPLE_BULK)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                  <Sparkles aria-hidden className="size-3.5" /> Sample
                </button>
                <button type="button" onClick={() => setBulk("")} disabled={!bulk} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                  <Eraser aria-hidden className="size-3.5" /> Clear
                </button>
              </div>
            </div>
            <textarea id="slug-bulk" rows={7} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"First post title\nSecond post title"} className="w-full resize-y bg-transparent px-4 py-3 text-[0.98rem] leading-relaxed outline-none placeholder:text-ink-3" />
            <div className="border-t border-line">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <p className="text-sm font-bold">
                  {rows.length} {rows.length === 1 ? "slug" : "slugs"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <CopyButton text={() => rows.map((r) => r.slug).join("\n")} label="Copy all" className="!h-8" />
                  <button
                    type="button"
                    disabled={!rows.length}
                    onClick={() => {
                      downloadBlob(new Blob([slugCsv(rows, Boolean(base.trim()) && !baseInvalid)], { type: "text/csv;charset=utf-8" }), "slugs.csv");
                      track("download_clicked", { tool: "url-slug-generator", format: "csv", count: rows.length });
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-orange px-2.5 text-[0.84rem] font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40"
                  >
                    <Download aria-hidden className="size-3.5" /> Download CSV
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm" data-testid="slug-table">
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-line align-top">
                        <td className="w-8 px-3 py-2 font-mono text-xs text-ink-3">{i + 1}</td>
                        <td className="px-3 py-2 text-ink-2">{r.title}</td>
                        <td className="px-3 py-2 font-mono text-[0.82rem] [overflow-wrap:anywhere]">{r.url ?? r.slug}</td>
                        <td className="w-10 px-1.5 py-1">
                          <CopyButton iconOnly text={() => r.url ?? r.slug} label={`Copy slug ${i + 1}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        )}

        <Panel className="p-5">
          <FieldLabel htmlFor="slug-base">Base URL for preview (optional)</FieldLabel>
          <input id="slug-base" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com/blog/" spellCheck={false} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none focus:border-charcoal" />
          {baseInvalid ? (
            <p className="mt-1 text-xs text-error">Enter a web address such as https://example.com/blog/</p>
          ) : (
            mode === "single" && (
              <p className="mt-2 break-all font-mono text-sm" data-testid="slug-url">
                {fullUrl ?? <span className="text-ink-3">https://example.com/blog/your-slug</span>}
              </p>
            )
          )}
          <div className="mt-3">
            <Toggle checked={trailing} onChange={setTrailing} label="Add trailing slash" description="…/your-slug/" />
          </div>
          <p className="mt-2 text-xs text-ink-2">The preview doesn&rsquo;t check whether the address is already used on your site.</p>
        </Panel>
      </div>

      <div className="grid content-start gap-4">
        <Panel className="p-5">
          <p className="font-display text-lg font-semibold">Options</p>
          <div className="mt-4 grid gap-4">
            <div>
              <FieldLabel>Separator</FieldLabel>
              <Segmented
                label="Separator"
                size="sm"
                value={o.separator}
                onChange={(v) => set("separator", v as "-" | "_")}
                options={[
                  { value: "-", label: <span className="font-mono">hyphen -</span> },
                  { value: "_", label: <span className="font-mono">underscore _</span> },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Case</FieldLabel>
              <Segmented
                label="Case"
                size="sm"
                value={o.case}
                onChange={(v) => set("case", v as SlugCase)}
                options={[
                  { value: "lower", label: "lowercase" },
                  { value: "upper", label: "UPPERCASE" },
                  { value: "preserve", label: "Keep case" },
                ]}
              />
            </div>
            <div>
              <FieldLabel htmlFor="slug-max" hint="0 = no limit">
                Maximum length
              </FieldLabel>
              <input id="slug-max" inputMode="numeric" value={maxLen} placeholder="No limit" onChange={(e) => setMaxLen(e.target.value.replace(/[^\d]/g, "").slice(0, 3))} className="h-10 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none placeholder:text-ink-3 focus:border-charcoal" />
            </div>
            <div className="grid gap-2">
              <Toggle checked={o.removeStopWords} onChange={(v) => set("removeStopWords", v)} label="Remove stop words" description="the, a, of, and, for, in…" />
              <Toggle checked={o.transliterate} onChange={(v) => set("transliterate", v)} label="Transliterate" description="café → cafe, Привет → privet" />
              <Toggle checked={o.keepUnicode} onChange={(v) => set("keepUnicode", v)} label="Keep non-Latin letters" description="e.g. 東京, हिन्दी — off = ASCII only" />
              {mode === "bulk" && <Toggle checked={unique} onChange={setUnique} label="Make duplicates unique" description="Adds -2, -3… to repeats" />}
            </div>
            <ul className="grid gap-1.5 rounded-[12px] bg-ivory px-4 py-3 text-sm text-ink-2">
              {["Special characters removed", "No doubled separators", "No leading or trailing separators"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check aria-hidden className="size-3.5 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <button type="button" onClick={reset} className="inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-sm text-ink-2 hover:text-charcoal">
          <RotateCcw aria-hidden className="size-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}
