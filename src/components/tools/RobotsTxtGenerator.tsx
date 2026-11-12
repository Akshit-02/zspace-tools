"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, AlertTriangle, ArrowDown, ArrowUp, Ban, CheckCircle2, Download, Info, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, inputClass } from "./ui";
import { AGENTS, blocksAll, generate, group, lint, preset, rule, test, type Group, type PresetId, type RobotsConfig, type Rule } from "@/lib/robots";
import { parseBase } from "@/lib/sitemap";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const PRESETS: { id: PresetId; label: string; hint: string }[] = [
  { id: "allow-all", label: "Allow all", hint: "Every crawler, every page" },
  { id: "basic", label: "Basic website", hint: "Hide admin & search pages" },
  { id: "wordpress", label: "WordPress example", hint: "Common WP paths" },
  { id: "ecommerce", label: "E-commerce example", hint: "Cart, checkout, filters" },
  { id: "custom", label: "Custom", hint: "Start from scratch" },
  { id: "block-all", label: "Block all", hint: "Keep crawlers off the site" },
];

const small = "inline-grid size-9 shrink-0 place-items-center rounded-[8px] border border-line-strong bg-card text-ink-2 hover:border-charcoal hover:text-charcoal disabled:opacity-30";

function GroupEditor({ g, index, onChange, onRemove, canRemove }: { g: Group; index: number; onChange: (g: Group) => void; onRemove: () => void; canRemove: boolean }) {
  const [custom, setCustom] = useState("");
  const setRules = (rules: Rule[]) => onChange({ ...g, rules });
  const move = (i: number, d: -1 | 1) => {
    const r = [...g.rules];
    [r[i], r[i + d]] = [r[i + d], r[i]];
    setRules(r);
  };
  const addAgent = (a: string) => {
    const v = a.trim().replace(/[\r\n#:]/g, "");
    if (v && !g.agents.some((x) => x.toLowerCase() === v.toLowerCase())) onChange({ ...g, agents: [...g.agents, v] });
  };
  return (
    <div className="rounded-[14px] border border-line bg-card p-4" data-testid={`group-${index}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold">Group {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs text-ink-2 hover:bg-ivory-2 hover:text-error">
            <Trash2 aria-hidden className="size-3.5" /> Remove group
          </button>
        )}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-ink-2">User agents</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {g.agents.map((a) => (
          <span key={a} className="inline-flex h-8 items-center gap-1 rounded-full border border-charcoal bg-charcoal pl-3 pr-1.5 font-mono text-[0.8rem] text-ivory">
            {a}
            <button type="button" aria-label={`Remove user agent ${a}`} onClick={() => onChange({ ...g, agents: g.agents.filter((x) => x !== a) })} className="grid size-5 place-items-center rounded-full hover:bg-white/15">
              <X aria-hidden className="size-3" />
            </button>
          </span>
        ))}
        {g.agents.length === 0 && <span className="text-xs text-error">Add at least one user agent.</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`ua-pick-${g.id}`}>
          Add a known crawler
        </label>
        <select
          id={`ua-pick-${g.id}`}
          value=""
          onChange={(e) => addAgent(e.target.value)}
          className={clsx(inputClass, "!h-9 !w-auto !py-0 text-sm")}
        >
          <option value="">Add crawler…</option>
          {AGENTS.filter((a) => !g.agents.includes(a.token)).map((a) => (
            <option key={a.token} value={a.token}>
              {a.label}
            </option>
          ))}
        </select>
        <div className="flex min-w-0 flex-1 gap-1.5">
          <input
            aria-label="Custom user agent"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addAgent(custom);
                setCustom("");
              }
            }}
            placeholder="Custom, e.g. AhrefsBot"
            className={clsx(inputClass, "!h-9 !w-auto min-w-0 flex-1 font-mono text-sm")}
          />
          <button
            type="button"
            onClick={() => {
              addAgent(custom);
              setCustom("");
            }}
            disabled={!custom.trim()}
            className="h-9 shrink-0 rounded-[8px] border border-line-strong bg-card px-3 text-sm hover:border-charcoal disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.1em] text-ink-2">Rules</p>
      <ol className="mt-2 grid gap-2">
        {g.rules.map((r, i) => (
          <li key={r.id} className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
            <label className="sr-only" htmlFor={`rt-${r.id}`}>
              Rule {i + 1} type
            </label>
            <select id={`rt-${r.id}`} value={r.type} onChange={(e) => setRules(g.rules.map((x) => (x.id === r.id ? { ...x, type: e.target.value as Rule["type"] } : x)))} className={clsx(inputClass, "!h-9 !w-[7.5rem] shrink-0 !py-0 text-sm")}>
              <option value="disallow">Disallow</option>
              <option value="allow">Allow</option>
            </select>
            <input
              aria-label={`Rule ${i + 1} path`}
              value={r.path}
              onChange={(e) => setRules(g.rules.map((x) => (x.id === r.id ? { ...x, path: e.target.value } : x)))}
              placeholder="/private/"
              spellCheck={false}
              className={clsx(inputClass, "!h-9 !w-auto min-w-0 flex-1 basis-40 font-mono text-sm")}
            />
            <button type="button" className={small} aria-label={`Move rule ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" className={small} aria-label={`Move rule ${i + 1} down`} disabled={i === g.rules.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="size-3.5" />
            </button>
            <button type="button" className={small} aria-label={`Remove rule ${i + 1}`} onClick={() => setRules(g.rules.filter((x) => x.id !== r.id))}>
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
        {g.rules.length === 0 && <li className="text-xs text-ink-2">No rules — this group allows everything (written as an empty “Disallow:”).</li>}
      </ol>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setRules([...g.rules, rule("disallow", "")])} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-charcoal hover:text-charcoal">
          <Plus aria-hidden className="size-3.5" /> Disallow
        </button>
        <button type="button" onClick={() => setRules([...g.rules, rule("allow", "")])} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-charcoal hover:text-charcoal">
          <Plus aria-hidden className="size-3.5" /> Allow
        </button>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-charcoal">Advanced: crawl-delay & comment</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_1fr]">
          <input aria-label="Crawl-delay (seconds)" value={g.crawlDelay} onChange={(e) => onChange({ ...g, crawlDelay: e.target.value })} placeholder="Crawl-delay (s)" inputMode="decimal" className={clsx(inputClass, "!h-9 font-mono text-sm")} />
          <input aria-label="Group comment" value={g.comment} onChange={(e) => onChange({ ...g, comment: e.target.value })} placeholder="Comment for this group" className={clsx(inputClass, "!h-9 text-sm")} />
        </div>
        <p className="mt-1 text-xs text-ink-2">Crawl-delay isn&apos;t part of the standard: Bing honours it, Google ignores it.</p>
      </details>
    </div>
  );
}

export default function RobotsTxtGenerator() {
  const [site, setSite] = useState("");
  const [cfg, setCfg] = useState<RobotsConfig>(() => preset("allow-all", ""));
  const [active, setActive] = useState<PresetId>("allow-all");
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [testText, setTestText] = useState<string | null>(null);
  const [ua, setUa] = useState("Googlebot");
  const [path, setPath] = useState("/");

  useEffect(() => {
    track("tool_opened", { tool: "robots-txt-generator" });
  }, []);

  const origin = (() => {
    const b = parseBase(site);
    return b.ok ? b.origin : "";
  })();
  const output = useMemo(() => generate(cfg), [cfg]);
  const notes = useMemo(() => lint(cfg), [cfg]);
  const danger = blocksAll(cfg);
  const tested = testText ?? output;
  const verdict = useMemo(() => (ua.trim() ? test(tested, ua, path) : null), [tested, ua, path]);

  const apply = (id: PresetId) => {
    setActive(id);
    setCfg(preset(id, origin));
    setConfirmBlock(false);
    track("content_generated", { tool: "robots-txt-generator", format: id });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr] [&>*]:min-w-0">
        <div className="grid content-start gap-4">
          <Panel className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <FieldLabel htmlFor="rb-site">Website URL</FieldLabel>
                <input id="rb-site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://example.com" spellCheck={false} className={inputClass} />
                {parseBase(site).ok === false && <p className="mt-1 text-xs text-error">Enter a full domain, e.g. https://example.com</p>}
              </div>
              <button
                type="button"
                disabled={!origin}
                onClick={() => setCfg((c) => ({ ...c, sitemaps: c.sitemaps.includes(`${origin}/sitemap.xml`) ? c.sitemaps : [...c.sitemaps.filter(Boolean), `${origin}/sitemap.xml`] }))}
                className="h-11 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal disabled:opacity-40"
              >
                Add /sitemap.xml
              </button>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.1em] text-ink-2">Start from a preset</p>
            <div role="radiogroup" aria-label="Preset" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active === p.id}
                  onClick={() => (p.id === "block-all" ? setConfirmBlock(true) : apply(p.id))}
                  className={clsx(
                    "rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                    active === p.id ? "border-charcoal bg-charcoal text-ivory" : p.id === "block-all" ? "border-error/40 bg-card hover:border-error" : "border-line-strong bg-card hover:border-charcoal",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {p.id === "block-all" && <Ban aria-hidden className="size-3.5" />}
                    {p.label}
                  </span>
                  <span className={clsx("block text-[0.72rem]", active === p.id ? "text-ivory/65" : "text-ink-2")}>{p.hint}</span>
                </button>
              ))}
            </div>
            {confirmBlock && (
              <div role="alertdialog" aria-labelledby="block-title" aria-describedby="block-desc" className="mt-4 rounded-[14px] border-2 border-error/60 bg-[#fbecea] p-4" data-testid="block-confirm">
                <p id="block-title" className="flex items-center gap-2 font-bold text-[#8f2f27]">
                  <AlertOctagon aria-hidden className="size-5" /> Block every crawler from the whole site?
                </p>
                <p id="block-desc" className="mt-1.5 text-sm text-charcoal">
                  “User-agent: * / Disallow: /” asks all compliant crawlers, including Google and Bing, not to fetch any page. Your site can drop out of search results. It doesn&apos;t make pages private — use passwords or noindex for that.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => apply("block-all")} className="h-10 rounded-[10px] bg-error px-4 text-sm font-medium text-white hover:bg-[#a83f36]">
                    Yes, block all crawlers
                  </button>
                  <button type="button" autoFocus onClick={() => setConfirmBlock(false)} className="h-10 rounded-[10px] border border-line-strong bg-card px-4 text-sm font-medium hover:border-charcoal">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Panel>

          {cfg.groups.map((g, i) => (
            <GroupEditor
              key={g.id}
              g={g}
              index={i}
              canRemove={cfg.groups.length > 1}
              onChange={(ng) => {
                setActive("custom");
                setCfg((c) => ({ ...c, groups: c.groups.map((x) => (x.id === g.id ? ng : x)) }));
              }}
              onRemove={() => setCfg((c) => ({ ...c, groups: c.groups.filter((x) => x.id !== g.id) }))}
            />
          ))}
          <button
            type="button"
            onClick={() => setCfg((c) => ({ ...c, groups: [...c.groups, group(["Googlebot"], [])] }))}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-strong text-sm text-ink-2 hover:border-charcoal hover:text-charcoal"
          >
            <Plus aria-hidden className="size-4" /> Add user-agent group
          </button>

          <Panel className="p-5 sm:p-6">
            <p className="text-sm font-bold">Sitemaps</p>
            <ul className="mt-2 grid gap-2">
              {cfg.sitemaps.map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <input
                    aria-label={`Sitemap ${i + 1} URL`}
                    value={s}
                    onChange={(e) => setCfg((c) => ({ ...c, sitemaps: c.sitemaps.map((x, j) => (j === i ? e.target.value : x)) }))}
                    placeholder="https://example.com/sitemap.xml"
                    spellCheck={false}
                    className={clsx(inputClass, "!h-9 !w-auto min-w-0 flex-1 font-mono text-sm")}
                  />
                  <button type="button" className={small} aria-label={`Remove sitemap ${i + 1}`} onClick={() => setCfg((c) => ({ ...c, sitemaps: c.sitemaps.filter((_, j) => j !== i) }))}>
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setCfg((c) => ({ ...c, sitemaps: [...c.sitemaps, ""] }))} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-dashed border-line-strong px-3 text-sm text-ink-2 hover:border-charcoal hover:text-charcoal">
              <Plus aria-hidden className="size-3.5" /> Add sitemap
            </button>
            <label htmlFor="rb-comment" className="mt-4 block text-sm font-bold">
              Comment at the top <span className="font-normal text-ink-3">optional</span>
            </label>
            <textarea id="rb-comment" value={cfg.comment} onChange={(e) => setCfg((c) => ({ ...c, comment: e.target.value }))} rows={2} className={clsx(inputClass, "mt-2 !h-auto resize-y py-2 text-sm")} />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className={clsx("overflow-hidden rounded-[16px] border bg-card", danger ? "border-error/60" : "border-line")}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2">
              <p className="text-sm font-bold">robots.txt</p>
              <div className="flex gap-1.5">
                <CopyButton text={() => output} label="Copy" className="!h-8" onCopied={() => track("copy_clicked", { tool: "robots-txt-generator" })} />
                <button
                  type="button"
                  onClick={() => {
                    downloadBlob(new Blob([output], { type: "text/plain;charset=utf-8" }), "robots.txt");
                    track("download_clicked", { tool: "robots-txt-generator", format: "txt" });
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                >
                  <Download aria-hidden className="size-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSite("");
                    setTestText(null);
                    apply("allow-all");
                    setCfg(preset("allow-all", ""));
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                >
                  <RotateCcw aria-hidden className="size-3.5" /> Reset
                </button>
              </div>
            </div>
            <pre className="max-h-[440px] overflow-auto bg-ivory/40 px-4 py-3 font-mono text-[0.84rem] leading-[1.6]" data-testid="robots-output">
              {output}
            </pre>
          </div>
          {notes.length > 0 && (
            <ul className="grid gap-1.5" aria-live="polite" data-testid="robots-lint">
              {notes.map((n) => (
                <li key={n.text} className={clsx("flex items-start gap-2 rounded-[12px] border px-3 py-2 text-sm", n.tone === "danger" ? "border-error/40 bg-[#fbecea] font-medium text-[#8f2f27]" : n.tone === "warn" ? "border-[#e5c98f] bg-[#fdf6e7]" : "border-line bg-card text-ink-2")}>
                  {n.tone === "danger" ? <AlertOctagon aria-hidden className="mt-0.5 size-4 shrink-0" /> : n.tone === "warn" ? <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" /> : <Info aria-hidden className="mt-0.5 size-4 shrink-0" />}
                  <span className="min-w-0">{n.text}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs leading-relaxed text-ink-2">
            Upload as <code className="font-mono">robots.txt</code> to the root of your site, so it&apos;s reachable at <code className="font-mono">{origin || "https://example.com"}/robots.txt</code>. Each subdomain needs its own file.
          </p>
        </div>
      </div>

      {/* Tester */}
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold">Test a URL</h2>
            <p className="mt-1 text-sm text-ink-2">Check whether a crawler may fetch a path under these rules.</p>
          </div>
          {testText !== null && (
            <button type="button" onClick={() => setTestText(null)} className="text-sm text-orange-ink underline underline-offset-2">
              Test the generated file instead
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr] [&>*]:min-w-0">
          <div>
            <label htmlFor="rb-test-text" className="text-sm font-bold">
              Rules to test {testText === null && <span className="font-normal text-ink-3">(the generated file — edit or paste your own)</span>}
            </label>
            <textarea id="rb-test-text" value={tested} onChange={(e) => setTestText(e.target.value)} rows={9} spellCheck={false} className={clsx(inputClass, "mt-2 !h-auto resize-y py-2 font-mono text-[0.82rem]")} />
          </div>
          <div className="grid content-start gap-3">
            <div>
              <FieldLabel htmlFor="rb-ua">User agent (product token)</FieldLabel>
              <input id="rb-ua" list="rb-ua-list" value={ua} onChange={(e) => setUa(e.target.value)} spellCheck={false} className={clsx(inputClass, "font-mono")} />
              <datalist id="rb-ua-list">
                {AGENTS.filter((a) => a.token !== "*").map((a) => (
                  <option key={a.token} value={a.token} />
                ))}
              </datalist>
            </div>
            <div>
              <FieldLabel htmlFor="rb-path">URL or path</FieldLabel>
              <input id="rb-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/private/page?id=1" spellCheck={false} className={clsx(inputClass, "font-mono")} />
            </div>
            {verdict && (
              <div className={clsx("rounded-[14px] border p-4", verdict.allowed ? "border-success/30 bg-[#f1f7f3]" : "border-error/30 bg-[#fbecea]")} role="status" aria-live="polite" data-testid="robots-verdict">
                <p className={clsx("flex items-center gap-2 text-lg font-bold", verdict.allowed ? "text-success" : "text-[#8f2f27]")}>
                  {verdict.allowed ? <CheckCircle2 aria-hidden className="size-5" /> : <Ban aria-hidden className="size-5" />} {verdict.allowed ? "Allowed" : "Blocked"}
                </p>
                {verdict.rule && (
                  <p className="mt-1 font-mono text-sm">
                    {verdict.rule.type === "allow" ? "Allow" : "Disallow"}: {verdict.rule.path}
                  </p>
                )}
                <p className="mt-1 text-sm text-ink-2">{verdict.reason}</p>
              </div>
            )}
            <p className="text-xs leading-relaxed text-ink-2">
              An estimate using RFC 9309 matching: the most specific (longest) rule wins, Allow wins a tie, <code className="font-mono">*</code> matches anything and <code className="font-mono">$</code> marks the end. Individual crawlers can behave differently.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-5 sm:p-7">
        <h2 className="font-display text-xl font-semibold">What robots.txt does — and doesn&apos;t</h2>
        <div className="mt-4 grid gap-4 text-sm leading-relaxed md:grid-cols-2">
          <ul className="grid gap-2">
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> <span>Asks compliant crawlers which paths they may fetch, per user agent.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> <span>Tells crawlers where your sitemaps are with <code className="font-mono">Sitemap:</code> lines (full URLs).</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> <span>Lives only at the root of a host: <code className="font-mono">/robots.txt</code>, one file per subdomain and protocol.</span>
            </li>
          </ul>
          <ul className="grid gap-2">
            {[
              "It controls crawling, not indexing. A blocked URL can still appear in results if other sites link to it.",
              "It doesn't replace noindex — a crawler that can't fetch a page never sees its noindex tag.",
              "It doesn't protect private information. The file is public and anyone can ignore it.",
              "Blocking CSS or JavaScript can stop search engines rendering your pages correctly.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" /> <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </div>
  );
}
