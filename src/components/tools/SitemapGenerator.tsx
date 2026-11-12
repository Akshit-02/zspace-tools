"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink, FileUp, Info, Plus, Trash2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Notice, Panel, Segmented, inputClass } from "./ui";
import {
  FREQS,
  MAX_URLS,
  buildSitemaps,
  checkSitemap,
  normalizeUrls,
  parseBase,
  parseSitemap,
  sitemapIndex,
  sitemapsFromRobots,
  toCsv,
  urlsFromText,
  validLastmod,
  withDefaults,
  type Defaults,
  type Entry,
  type Freq,
  type Rejected,
} from "@/lib/sitemap";
import { downloadBlob, formatBytes } from "@/lib/format";
import { downloadZip } from "@/lib/zip";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");
const PAGE = 50;
const MAX_FILE = 50 * 1024 * 1024;
const PREVIEW_CHARS = 60_000;
type Mode = "manual" | "website" | "import";

interface Report {
  added: number;
  duplicates: number;
  rejected: Rejected[];
  fragments: number;
  encoded: number;
  note?: string;
}

export default function SitemapGenerator() {
  const [mode, setMode] = useState<Mode>("manual");
  const [base, setBase] = useState("");
  const [extra, setExtra] = useState("");
  const [paste, setPaste] = useState("");
  const [single, setSingle] = useState("");
  const [items, setItems] = useState<Entry[]>([]);
  const [defaults, setDefaults] = useState<Defaults>({ lastmod: "", changefreq: "", priority: "" });
  const [report, setReport] = useState<Report | null>(null);
  const [totals, setTotals] = useState({ duplicates: 0 });
  const [page, setPage] = useState(0);
  const [importText, setImportText] = useState("");
  const [childMaps, setChildMaps] = useState<string[]>([]);
  const [xmlCheck, setXmlCheck] = useState<{ ok: boolean; text: string } | null>(null);
  const listFile = useRef<HTMLInputElement>(null);
  const xmlFile = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track("tool_opened", { tool: "xml-sitemap-generator" });
  }, []);

  const b = parseBase(base);
  const extras = extra.split(/[\s,]+/).filter(Boolean);

  /** Adds URLs (strings or parsed entries), validating against the site origin and skipping ones already listed. */
  const add = (incoming: (string | Entry)[], note?: string) => {
    const byLoc = new Map(incoming.map((x) => (typeof x === "string" ? [x, null] : [x.loc, x])) as [string, Entry | null][]);
    let baseNow = base;
    if (!parseBase(base).ok) {
      // Use the first absolute URL's origin as the website when none is set yet.
      const first = [...byLoc.keys()].find((l) => /^https?:\/\//i.test(l.trim()));
      if (first) {
        try {
          baseNow = new URL(first.trim()).origin;
          setBase(baseNow);
        } catch {
          /* keep empty */
        }
      }
    }
    const r = normalizeUrls([...byLoc.keys()], baseNow, extras);
    const existing = new Set(items.map((i) => i.loc));
    let dup = r.duplicates;
    const fresh: Entry[] = [];
    r.entries.forEach((e, i) => {
      if (existing.has(e.loc)) {
        dup++;
        return;
      }
      // Carry over lastmod/changefreq/priority from an imported sitemap entry.
      const src = byLoc.get(r.sources[i]) ?? null;
      fresh.push(src ? { ...src, loc: e.loc } : e);
    });
    setItems((cur) => [...cur, ...fresh]);
    setTotals((t) => ({ duplicates: t.duplicates + dup }));
    setReport({ added: fresh.length, duplicates: dup, rejected: r.rejected, fragments: r.fragmentsRemoved, encoded: r.encoded, note });
    setXmlCheck(null);
    if (fresh.length) track("content_generated", { tool: "xml-sitemap-generator", count: fresh.length });
  };

  const readFile = async (file: File | undefined, kind: "list" | "xml") => {
    if (!file) return;
    if (file.size > MAX_FILE) return setReport({ added: 0, duplicates: 0, rejected: [], fragments: 0, encoded: 0, note: `That file is ${formatBytes(file.size)}; the limit is 50 MB.` });
    const text = await file.text();
    track("file_uploaded", { tool: "xml-sitemap-generator", file_count: 1, file_type: file.type || kind });
    if (kind === "list") add(urlsFromText(text));
    else importXml(text);
  };

  const importXml = (text: string) => {
    setChildMaps([]);
    const robots = sitemapsFromRobots(text);
    if (robots.length && !/<(?:[\w-]+:)?(urlset|sitemapindex)\b/i.test(text)) {
      setChildMaps(robots);
      setReport({ added: 0, duplicates: 0, rejected: [], fragments: 0, encoded: 0, note: `That's a robots.txt listing ${robots.length} sitemap${robots.length === 1 ? "" : "s"}. Open each one below and paste its XML here.` });
      return;
    }
    const p = parseSitemap(text);
    if ("error" in p) return setReport({ added: 0, duplicates: 0, rejected: [], fragments: 0, encoded: 0, note: p.error });
    if (p.kind === "sitemapindex") {
      setChildMaps(p.entries.map((e) => e.loc));
      setReport({ added: 0, duplicates: 0, rejected: [], fragments: 0, encoded: 0, note: `This is a sitemap index of ${p.entries.length} sitemaps. Open each one below and import its XML to edit the URLs.` });
      return;
    }
    add(p.entries, p.warnings.length ? p.warnings.slice(0, 5).join(" ") : undefined);
  };

  const finalEntries = useMemo(() => items.map((e) => withDefaults(e, defaults)), [items, defaults]);
  const files = useMemo(() => (finalEntries.length ? buildSitemaps(finalEntries) : []), [finalEntries]);
  const issues = useMemo(() => checkSitemap(files), [files]);
  const index = files.length > 1 && b.ok ? sitemapIndex(files, b.origin, "/", defaults.lastmod && validLastmod(defaults.lastmod) ? defaults.lastmod : undefined) : "";
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const shown = items.slice(page * PAGE, page * PAGE + PAGE);
  const lastmodBad = defaults.lastmod !== "" && !validLastmod(defaults.lastmod);
  const prBad = defaults.priority !== "" && !(Number(defaults.priority) >= 0 && Number(defaults.priority) <= 1);

  const update = (loc: string, patch: Partial<Entry>) => {
    setItems((cur) => cur.map((e) => (e.loc === loc ? { ...e, ...patch } : e)));
    setXmlCheck(null);
  };

  const validate = () => {
    const parser = new DOMParser();
    const bad = files.find((f) => parser.parseFromString(f.xml, "application/xml").getElementsByTagName("parsererror").length > 0);
    const idxBad = index && parser.parseFromString(index, "application/xml").getElementsByTagName("parsererror").length > 0;
    if (bad || idxBad) setXmlCheck({ ok: false, text: `${bad?.name ?? "The index"} isn't well-formed XML.` });
    else if (issues.length) setXmlCheck({ ok: false, text: issues.join(" ") });
    else setXmlCheck({ ok: true, text: `Well-formed XML using the sitemaps.org 0.9 namespace · ${nf.format(finalEntries.length)} URLs in ${files.length} file${files.length === 1 ? "" : "s"}, each within 50,000 URLs and 50 MB.` });
  };

  const robotsLinks = b.ok ? ["/sitemap.xml", "/sitemap_index.xml", "/robots.txt"].map((p) => b.origin + p) : [];

  return (
    <div className="grid gap-4">
      <Panel className="p-5 sm:p-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <FieldLabel htmlFor="sm-base">Website URL</FieldLabel>
            <input id="sm-base" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com" spellCheck={false} aria-invalid={b.ok === false} className={clsx(inputClass, b.ok === false && "!border-error")} />
            <p className="mt-1 text-xs text-ink-2">{b.ok === false ? <span className="text-error">{b.message}</span> : "Only URLs on this site are included. Paths like /about are resolved against it."}</p>
          </div>
          <div>
            <FieldLabel htmlFor="sm-extra">
              Extra origins <span className="font-normal text-ink-3">optional</span>
            </FieldLabel>
            <input id="sm-extra" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="https://blog.example.com" spellCheck={false} className={inputClass} />
            <p className="mt-1 text-xs text-ink-2">Other hosts you deliberately want in this sitemap (and have verified ownership of).</p>
          </div>
        </div>

        <div className="mt-6">
          <Segmented
            label="How to add URLs"
            value={mode}
            onChange={(v) => setMode(v as Mode)}
            options={[
              { value: "manual", label: "Add URLs", hint: "paste, type or upload" },
              { value: "website", label: "From a website", hint: "find its sitemap" },
              { value: "import", label: "Import sitemap", hint: "edit existing XML" },
            ]}
          />
        </div>

        {mode === "manual" && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <label htmlFor="sm-paste" className="text-sm font-bold">
                URLs, one per line
              </label>
              <textarea id="sm-paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={7} spellCheck={false} placeholder={"https://example.com/\nhttps://example.com/about/\n/contact/"} className={clsx(inputClass, "mt-2 !h-auto resize-y py-2.5 font-mono text-[0.82rem]")} />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!paste.trim()}
                  onClick={() => {
                    add(paste.split(/\r?\n/));
                    setPaste("");
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40"
                >
                  <Plus aria-hidden className="size-4" /> Add URLs
                </button>
                <button type="button" onClick={() => listFile.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal">
                  <FileUp aria-hidden className="size-4" /> Upload TXT / CSV
                </button>
                <input
                  ref={listFile}
                  type="file"
                  accept=".txt,.csv,text/plain,text/csv"
                  className="sr-only"
                  aria-label="Upload a TXT or CSV list of URLs"
                  onChange={(e) => {
                    readFile(e.target.files?.[0], "list");
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="sm-single" className="text-sm font-bold">
                Add one URL
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="sm-single"
                  value={single}
                  onChange={(e) => setSingle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && single.trim()) {
                      add([single]);
                      setSingle("");
                    }
                  }}
                  placeholder="/pricing/"
                  spellCheck={false}
                  className={clsx(inputClass, "min-w-0 flex-1 font-mono text-sm")}
                />
                <button
                  type="button"
                  disabled={!single.trim()}
                  onClick={() => {
                    add([single]);
                    setSingle("");
                  }}
                  className="h-11 shrink-0 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-2">CSV files can have a header — a “url” or “loc” column is used if present, otherwise the first column.</p>
            </div>
          </div>
        )}

        {mode === "website" && (
          <div className="mt-5 grid gap-3 rounded-[14px] border border-line bg-ivory p-4" data-testid="sm-website">
            <p className="flex items-start gap-2 text-sm">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                ZSpace Tools doesn&apos;t crawl websites: browsers block one site from reading another site&apos;s pages, and we don&apos;t run a crawler on a server. Instead, open your existing sitemap or robots.txt below, then paste or upload it under <b>Import sitemap</b> — or add URLs yourself.
              </span>
            </p>
            {robotsLinks.length ? (
              <ul className="grid gap-1.5">
                {robotsLinks.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-orange-ink underline underline-offset-2">
                      {l} <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-2">Enter the website URL above to get links to its usual sitemap locations.</p>
            )}
            <button type="button" onClick={() => setMode("import")} className="h-10 justify-self-start rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-black">
              Go to import
            </button>
          </div>
        )}

        {mode === "import" && (
          <div className="mt-5">
            <label htmlFor="sm-import" className="text-sm font-bold">
              Existing sitemap XML (or robots.txt)
            </label>
            <textarea id="sm-import" value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} spellCheck={false} placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'} className={clsx(inputClass, "mt-2 !h-auto resize-y py-2.5 font-mono text-[0.8rem]")} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={!importText.trim()} onClick={() => importXml(importText)} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
                Import
              </button>
              <button type="button" onClick={() => xmlFile.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal">
                <FileUp aria-hidden className="size-4" /> Upload sitemap.xml
              </button>
              <input
                ref={xmlFile}
                type="file"
                accept=".xml,.txt,application/xml,text/xml,text/plain"
                className="sr-only"
                aria-label="Upload a sitemap XML file"
                onChange={(e) => {
                  readFile(e.target.files?.[0], "xml");
                  e.target.value = "";
                }}
              />
            </div>
            {childMaps.length > 0 && (
              <ul className="mt-3 grid gap-1" data-testid="sm-children">
                {childMaps.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-orange-ink underline underline-offset-2">
                      {l} <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {report && (
          <div className="mt-4 rounded-[12px] border border-line bg-card px-4 py-3 text-sm" role="status" aria-live="polite" data-testid="sm-report">
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-medium text-success">{nf.format(report.added)} added</span>
              {report.duplicates > 0 && <span>{nf.format(report.duplicates)} duplicate{report.duplicates === 1 ? "" : "s"} removed</span>}
              {report.rejected.length > 0 && <span className="text-[#8f2f27]">{nf.format(report.rejected.length)} skipped</span>}
              {report.fragments > 0 && <span className="text-ink-2">#fragments removed from {report.fragments}</span>}
              {report.encoded > 0 && <span className="text-ink-2">{report.encoded} percent-encoded (spaces or non-ASCII)</span>}
            </p>
            {report.note && <p className="mt-1 text-ink-2">{report.note}</p>}
            {report.rejected.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto rounded-[8px] bg-ivory px-3 py-2 text-xs">
                {report.rejected.slice(0, 100).map((r, i) => (
                  <li key={i} className="flex gap-2 py-0.5">
                    <XCircle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-error" />
                    <span className="min-w-0 break-all">
                      <code className="font-mono">{r.input}</code> — {r.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>

      {items.length > 0 && (
        <>
          <Panel className="p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  {nf.format(items.length)} URL{items.length === 1 ? "" : "s"}
                </h2>
                <p className="mt-1 text-sm text-ink-2" data-testid="sm-stats">
                  {nf.format(totals.duplicates)} duplicate{totals.duplicates === 1 ? "" : "s"} removed so far · {files.length} sitemap file{files.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(new Blob([toCsv(finalEntries)], { type: "text/csv;charset=utf-8" }), "sitemap-urls.csv");
                    track("download_clicked", { tool: "xml-sitemap-generator", format: "csv" });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal"
                >
                  <Download aria-hidden className="size-4" /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItems([]);
                    setReport(null);
                    setTotals({ duplicates: 0 });
                    setPage(0);
                    setChildMaps([]);
                    setXmlCheck(null);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                >
                  <Trash2 aria-hidden className="size-4" /> Clear all
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-[14px] bg-ivory p-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="sm-def-lastmod">Default last modified</FieldLabel>
                <input id="sm-def-lastmod" type="date" value={defaults.lastmod} onChange={(e) => setDefaults((d) => ({ ...d, lastmod: e.target.value }))} className={clsx(inputClass, lastmodBad && "!border-error")} />
              </div>
              <div>
                <FieldLabel htmlFor="sm-def-freq">Default change frequency</FieldLabel>
                <select id="sm-def-freq" value={defaults.changefreq} onChange={(e) => setDefaults((d) => ({ ...d, changefreq: e.target.value as Freq | "" }))} className={inputClass}>
                  <option value="">Leave out</option>
                  {FREQS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="sm-def-pr">Default priority</FieldLabel>
                <select id="sm-def-pr" value={defaults.priority} onChange={(e) => setDefaults((d) => ({ ...d, priority: e.target.value }))} className={clsx(inputClass, prBad && "!border-error")}>
                  <option value="">Leave out</option>
                  {Array.from({ length: 11 }, (_, i) => (i / 10).toFixed(1)).map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs leading-relaxed text-ink-2 sm:col-span-3">
                Defaults apply only to URLs without their own value. Leave dates out unless you know when a page really changed. Google ignores changefreq and priority and uses lastmod only when it&apos;s consistently accurate — none of these guarantee crawling or ranking.
              </p>
            </div>

            <div className="mt-4 overflow-x-auto rounded-[12px] border border-line">
              <table className="w-full min-w-[680px] text-sm" data-testid="sm-table">
                <thead className="bg-ivory text-left text-xs text-ink-2">
                  <tr>
                    <th className="px-3 py-2 font-medium">URL</th>
                    <th className="w-[150px] px-2 py-2 font-medium">Last modified</th>
                    <th className="w-[120px] px-2 py-2 font-medium">Change freq.</th>
                    <th className="w-[92px] px-2 py-2 font-medium">Priority</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((e, i) => {
                    const n = page * PAGE + i + 1;
                    return (
                      <tr key={e.loc}>
                        <td className="max-w-0 px-3 py-1.5">
                          <span className="block truncate font-mono text-[0.8rem]" title={e.loc}>
                            {e.loc}
                          </span>
                        </td>
                        <td className="px-2 py-1.5">
                          <input aria-label={`Last modified for URL ${n}`} type="date" value={e.lastmod && /^\d{4}-\d{2}-\d{2}$/.test(e.lastmod) ? e.lastmod : ""} onChange={(ev) => update(e.loc, { lastmod: ev.target.value || undefined })} className="h-8 w-full rounded-[6px] border border-line bg-card px-1.5 font-mono text-xs" />
                          {e.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(e.lastmod) && <span className="block truncate font-mono text-[0.7rem] text-ink-2">{e.lastmod}</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          <select aria-label={`Change frequency for URL ${n}`} value={e.changefreq ?? ""} onChange={(ev) => update(e.loc, { changefreq: (ev.target.value || undefined) as Freq | undefined })} className="h-8 w-full rounded-[6px] border border-line bg-card px-1 text-xs">
                            <option value="">default</option>
                            {FREQS.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select aria-label={`Priority for URL ${n}`} value={e.priority !== undefined ? e.priority.toFixed(1) : ""} onChange={(ev) => update(e.loc, { priority: ev.target.value === "" ? undefined : Number(ev.target.value) })} className="h-8 w-full rounded-[6px] border border-line bg-card px-1 font-mono text-xs">
                            <option value="">default</option>
                            {Array.from({ length: 11 }, (_, k) => (k / 10).toFixed(1)).map((p) => (
                              <option key={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-1">
                          <button type="button" aria-label={`Remove URL ${n}`} onClick={() => setItems((cur) => cur.filter((x) => x.loc !== e.loc))} className="grid size-8 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="grid size-9 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="font-mono text-xs text-ink-2">
                  {page + 1} / {pages}
                </span>
                <button type="button" aria-label="Next page" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="grid size-9 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </Panel>

          <Panel className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Sitemap XML</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={validate} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal">
                  <CheckCircle2 aria-hidden className="size-4" /> Validate
                </button>
                {files.length === 1 ? (
                  <>
                    <CopyButton text={() => files[0].xml} label="Copy XML" onCopied={() => track("copy_clicked", { tool: "xml-sitemap-generator" })} />
                    <button
                      type="button"
                      onClick={() => {
                        downloadBlob(new Blob([files[0].xml], { type: "application/xml;charset=utf-8" }), "sitemap.xml");
                        track("download_clicked", { tool: "xml-sitemap-generator", format: "xml" });
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34]"
                    >
                      <Download aria-hidden className="size-4" /> Download sitemap.xml
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!index}
                    onClick={() => {
                      downloadZip([...files.map((f) => ({ name: f.name, blob: new Blob([f.xml], { type: "application/xml" }) })), { name: "sitemap-index.xml", blob: new Blob([index], { type: "application/xml" }) }], "sitemaps.zip");
                      track("download_clicked", { tool: "xml-sitemap-generator", format: "zip", count: files.length });
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40"
                  >
                    <Download aria-hidden className="size-4" /> Download all (ZIP)
                  </button>
                )}
              </div>
            </div>
            {xmlCheck && (
              <div className="mt-3" data-testid="sm-validate">
                <Notice tone={xmlCheck.ok ? "success" : "error"}>{xmlCheck.text}</Notice>
              </div>
            )}
            {files.length > 1 && (
              <div className="mt-4 rounded-[14px] border border-line bg-ivory p-4 text-sm" data-testid="sm-split">
                <p>
                  <b>{nf.format(finalEntries.length)} URLs</b> is more than one sitemap can hold ({nf.format(MAX_URLS)} URLs or 50 MB), so they&apos;re split into {files.length} files plus a <b>sitemap index</b> that lists them. Upload every file to your site root and submit only the index.
                </p>
                {!b.ok && <p className="mt-2 text-error">Enter the website URL above — the index needs it to build each file&apos;s full address.</p>}
                <ul className="mt-3 grid gap-1.5">
                  {files.map((f) => (
                    <li key={f.name} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs">
                        {f.name} · {nf.format(f.count)} URLs · {formatBytes(f.bytes)}
                      </span>
                      <button type="button" onClick={() => downloadBlob(new Blob([f.xml], { type: "application/xml;charset=utf-8" }), f.name)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-card hover:text-charcoal">
                        <Download aria-hidden className="size-3.5" /> {f.name}
                      </button>
                    </li>
                  ))}
                  {index && (
                    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                      <span className="font-mono text-xs font-bold">sitemap-index.xml · {files.length} sitemaps</span>
                      <button type="button" onClick={() => downloadBlob(new Blob([index], { type: "application/xml;charset=utf-8" }), "sitemap-index.xml")} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-card hover:text-charcoal">
                        <Download aria-hidden className="size-3.5" /> Index
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-[12px] border border-line bg-ivory/40 px-4 py-3 font-mono text-[0.8rem] leading-[1.55]" data-testid="sm-xml">
              {(files.length > 1 && index ? index : files[0]?.xml ?? "").slice(0, PREVIEW_CHARS)}
              {(files[0]?.xml.length ?? 0) > PREVIEW_CHARS && files.length === 1 && "\n… preview shortened — copy or download for the full file."}
            </pre>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Nothing is submitted for you. Upload the file to your website (usually as /sitemap.xml), add a <code className="font-mono">Sitemap:</code> line to robots.txt, and submit it in Google Search Console or Bing Webmaster Tools if you like.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}
