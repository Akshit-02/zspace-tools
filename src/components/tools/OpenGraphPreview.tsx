"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, FileUp, ImagePlus, Info, Monitor, RotateCcw, Smartphone, X as XIcon } from "lucide-react";
import { clsx } from "clsx";
import { FieldLabel, Notice, Panel, Segmented, inputClass } from "./ui";
import TagOutput from "./TagOutput";
import { FacebookPreview, LinkedInPreview, PreviewLabel, WhatsAppPreview, XPreview, imageAdvice, useImageInfo } from "./SocialPreviews";
import { EMPTY_META, OG_TYPES, buildTags, checkUrl, clean, readMeta, validHandle, type Tag } from "@/lib/meta-tags";
import { formatBytes } from "@/lib/format";
import { track } from "@/lib/analytics";

interface Fields {
  title: string;
  description: string;
  url: string;
  image: string;
  siteName: string;
  type: string;
  twitterCard: "summary" | "summary_large_image";
  handle: string;
}
const EMPTY: Fields = { title: "", description: "", url: "", image: "", siteName: "", type: "website", twitterCard: "summary_large_image", handle: "" };
type Key = keyof Fields;
const KEEP = new Set(["og:title", "og:description", "og:image", "og:url", "og:type", "og:site_name", "twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:site"]);
const MAX_HTML = 5 * 1024 * 1024;

export default function OpenGraphPreview() {
  const [mode, setMode] = useState<"manual" | "import">("manual");
  const [f, setF] = useState<Fields>(EMPTY);
  const [imported, setImported] = useState<Set<Key>>(new Set());
  const [source, setSource] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [importMsg, setImportMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [local, setLocal] = useState<{ url: string; name: string; size: number } | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const fileRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    track("tool_opened", { tool: "open-graph-preview" });
  }, []);
  useEffect(() => () => void (local && URL.revokeObjectURL(local.url)), [local]);

  const set = (k: Key) => (v: string) => {
    setF((c) => ({ ...c, [k]: v }));
    setImported((s) => {
      if (!s.has(k)) return s;
      const n = new Set(s);
      n.delete(k);
      return n;
    });
  };

  const imgCheck = checkUrl(f.image, "Image URL");
  const urlCheck = checkUrl(f.url, "Page URL");
  const previewImage = local?.url ?? (imgCheck.ok ? imgCheck.url : "");
  const info = useImageInfo(previewImage);
  const advice = imageAdvice(info);
  const d = { title: clean(f.title), description: clean(f.description), url: urlCheck.ok ? urlCheck.url : "", image: previewImage, siteName: clean(f.siteName), twitterCard: f.twitterCard };

  const tags = useMemo(() => {
    const t = buildTags({ ...EMPTY_META, robots: "", title: f.title, description: f.description, url: f.url, image: f.image, siteName: f.siteName, type: f.type, twitterCard: f.twitterCard, twitterSite: f.handle, lang: "" });
    const og = t.og.filter((x) => KEEP.has(x.key));
    const tw = t.twitter.filter((x) => KEEP.has(x.key));
    return { og, tw, all: [...og, ...tw] };
  }, [f]);
  const text = (list: Tag[], head: string) => `<!-- ${head} -->\n${list.map((t) => t.html).join("\n")}\n`;
  const allText = `${text(tags.og, "Open Graph")}\n${text(tags.tw, "Twitter / X")}`;

  const runImport = (html: string) => {
    if (!html.trim()) return setImportMsg({ tone: "error", text: "Paste the page's HTML source first." });
    if (html.length > MAX_HTML) return setImportMsg({ tone: "error", text: "That's more than 5 MB of HTML — paste just the <head> section." });
    const r = readMeta(html);
    if (!r.found.length) return setImportMsg({ tone: "error", text: "No title, description, Open Graph or Twitter tags were found in that HTML." });
    const next: Partial<Fields> = {};
    if (r.title) next.title = r.title;
    if (r.description) next.description = r.description;
    if (r.url) next.url = r.url;
    else if (checkUrl(pageUrl).ok) next.url = pageUrl.trim();
    if (r.image) {
      // Resolve a relative og:image against the page URL (it should be absolute, but often isn't).
      try {
        next.image = new URL(r.image, r.url || pageUrl || undefined).href;
      } catch {
        next.image = r.image;
      }
    }
    if (r.siteName) next.siteName = r.siteName;
    if (r.type && (OG_TYPES as readonly string[]).includes(r.type)) next.type = r.type;
    if (r.twitterCard === "summary" || r.twitterCard === "summary_large_image") next.twitterCard = r.twitterCard;
    if (r.twitterSite) next.handle = r.twitterSite;
    const keys = Object.keys(next) as Key[];
    setF({ ...EMPTY, ...next });
    setImported(new Set(keys.filter((k) => !(k === "url" && !r.url))));
    setLocal(null);
    setImportMsg({ tone: "success", text: `Read ${keys.length} value${keys.length === 1 ? "" : "s"} from the source (${r.found.length} tags found). Fields marked “Imported” came from the HTML; edit anything to preview changes.` });
    track("content_generated", { tool: "open-graph-preview", format: "import", count: keys.length });
  };

  const tag = (k: Key) => (imported.has(k) ? <span className="ml-1.5 rounded-full bg-orange-wash px-1.5 py-0.5 align-middle text-[0.65rem] font-medium uppercase tracking-wide text-orange-ink">Imported</span> : null);
  const count = (v: string, guide: number) => <span className={clsx("font-mono text-xs", clean(v).length > guide ? "text-[#a35a12]" : "text-ink-2")}>{clean(v).length} / ~{guide}</span>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <Segmented
          label="Mode"
          value={mode}
          onChange={(v) => setMode(v as "manual" | "import")}
          options={[
            { value: "manual", label: "Enter details", hint: "type or paste values" },
            { value: "import", label: "Import from page", hint: "read a page's tags" },
          ]}
        />

        {mode === "import" && (
          <div className="mt-5 grid gap-3 rounded-[14px] border border-line bg-ivory p-4" data-testid="og-import">
            <p className="text-sm text-charcoal">
              Browsers don&apos;t let one website read another website&apos;s pages, and ZSpace Tools doesn&apos;t fetch pages on a server — so nothing is fetched for you. Open the page, view its source (<kbd className="font-mono text-xs">Ctrl/⌘ + U</kbd>), and paste it here.
            </p>
            <div className="flex gap-2">
              <label htmlFor="og-page" className="sr-only">
                Page URL to open
              </label>
              <input id="og-page" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://example.com/page/" spellCheck={false} className={clsx(inputClass, "min-w-0 flex-1")} />
              <a
                href={checkUrl(pageUrl).ok ? pageUrl.trim() : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!checkUrl(pageUrl).ok}
                className={clsx("inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium", checkUrl(pageUrl).ok ? "hover:border-charcoal" : "pointer-events-none opacity-40")}
              >
                Open <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </div>
            <label htmlFor="og-source" className="text-sm font-bold">
              Page HTML source
            </label>
            <textarea id="og-source" value={source} onChange={(e) => setSource(e.target.value)} rows={6} spellCheck={false} placeholder={'<head>\n  <meta property="og:title" content="…">'} className={clsx(inputClass, "!h-auto resize-y py-2.5 font-mono text-[0.8rem]")} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => runImport(source)} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-black">
                Read metadata
              </button>
              <button type="button" onClick={() => htmlRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal">
                <FileUp aria-hidden className="size-4" /> Open .html file
              </button>
              <input
                ref={htmlRef}
                type="file"
                accept=".html,.htm,text/html"
                className="sr-only"
                aria-label="Open an HTML file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > MAX_HTML) return setImportMsg({ tone: "error", text: "That file is larger than 5 MB." });
                  const t = await file.text();
                  setSource(t.slice(0, 200_000));
                  runImport(t);
                }}
              />
            </div>
            {importMsg && <Notice tone={importMsg.tone}>{importMsg.text}</Notice>}
          </div>
        )}

        <div className="mt-5 grid gap-4">
          <div>
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="og-title">Title{tag("title")}</FieldLabel>
              {count(f.title, 60)}
            </div>
            <input id="og-title" value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="Handmade Ceramic Mugs" className={inputClass} />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="og-desc">Description{tag("description")}</FieldLabel>
              {count(f.description, 160)}
            </div>
            <textarea id="og-desc" value={f.description} onChange={(e) => set("description")(e.target.value)} rows={3} placeholder="One or two sentences about the page." className={clsx(inputClass, "!h-auto resize-y py-2.5")} />
          </div>
          <div>
            <FieldLabel htmlFor="og-url">Page URL{tag("url")}</FieldLabel>
            <input id="og-url" value={f.url} onChange={(e) => set("url")(e.target.value)} placeholder="https://example.com/page/" spellCheck={false} aria-invalid={urlCheck.ok === false} className={clsx(inputClass, urlCheck.ok === false && "!border-error")} />
            {urlCheck.ok === false && <p className="mt-1 text-xs text-error">{urlCheck.message}</p>}
          </div>
          <div>
            <FieldLabel htmlFor="og-image">Image URL{tag("image")}</FieldLabel>
            <div className="flex gap-2">
              <input id="og-image" value={f.image} onChange={(e) => set("image")(e.target.value)} placeholder="https://example.com/og-image.jpg" spellCheck={false} aria-invalid={imgCheck.ok === false} className={clsx(inputClass, "min-w-0 flex-1", imgCheck.ok === false && "!border-error")} />
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal" title="Preview a local image">
                <ImagePlus aria-hidden className="size-4" /> <span className="hidden sm:inline">Local image</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label="Preview a local image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file || !file.type.startsWith("image/")) return;
                  setLocal({ url: URL.createObjectURL(file), name: file.name, size: file.size });
                  track("file_uploaded", { tool: "open-graph-preview", file_count: 1, file_type: file.type });
                }}
              />
            </div>
            {imgCheck.ok === false && <p className="mt-1 text-xs text-error">{imgCheck.message}</p>}
            {local && (
              <p className="mt-2 flex items-center justify-between gap-2 rounded-[10px] bg-ivory px-3 py-2 text-xs text-ink-2" data-testid="og-local">
                <span className="min-w-0 truncate">
                  Previewing local file <b className="text-charcoal">{local.name}</b> ({formatBytes(local.size)}) — stays on your device and isn&apos;t used in the tags.
                </span>
                <button type="button" onClick={() => setLocal(null)} aria-label="Stop previewing the local image" className="shrink-0">
                  <XIcon className="size-4" />
                </button>
              </p>
            )}
            {advice && (
              <p className={clsx("mt-2 flex items-start gap-1.5 text-xs", advice.tone === "warn" ? "text-[#8a5a10]" : advice.tone === "ok" ? "text-success" : "text-ink-2")} data-testid="og-image-advice">
                {advice.tone === "ok" ? <CheckCircle2 aria-hidden className="mt-px size-3.5 shrink-0" /> : <Info aria-hidden className="mt-px size-3.5 shrink-0" />} {advice.text}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="og-site">Website name{tag("siteName")}</FieldLabel>
              <input id="og-site" value={f.siteName} onChange={(e) => set("siteName")(e.target.value)} className={inputClass} />
            </div>
            <div>
              <FieldLabel htmlFor="og-type">Content type{tag("type")}</FieldLabel>
              <select id="og-type" value={f.type} onChange={(e) => set("type")(e.target.value)} className={inputClass}>
                {OG_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="og-card">X card{tag("twitterCard")}</FieldLabel>
              <select id="og-card" value={f.twitterCard} onChange={(e) => set("twitterCard")(e.target.value)} className={inputClass}>
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="og-handle">X account{tag("handle")}</FieldLabel>
              <input id="og-handle" value={f.handle} onChange={(e) => set("handle")(e.target.value)} placeholder="@yourbrand (optional)" aria-invalid={!validHandle(f.handle)} className={clsx(inputClass, !validHandle(f.handle) && "!border-error")} />
              {!validHandle(f.handle) && <p className="mt-1 text-xs text-error">1–15 letters, numbers or underscores.</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setF(EMPTY);
              setImported(new Set());
              setLocal(null);
              setSource("");
              setImportMsg(null);
            }}
            className="inline-flex items-center gap-1.5 justify-self-end rounded-[10px] px-3 py-1.5 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Reset
          </button>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Link previews</h2>
            <div role="group" aria-label="Preview width" className="flex gap-1">
              {(
                [
                  ["desktop", Monitor, "Desktop"],
                  ["mobile", Smartphone, "Mobile"],
                ] as const
              ).map(([id, Icon, label]) => (
                <button key={id} type="button" aria-pressed={device === id} onClick={() => setDevice(id)} className={clsx("inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem]", device === id ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-ivory-2")}>
                  <Icon aria-hidden className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className={clsx("grid gap-5", device === "desktop" ? "sm:grid-cols-2" : "mx-auto w-full max-w-[340px]")} data-testid="og-previews">
            <div>
              <PreviewLabel>Facebook-style</PreviewLabel>
              <FacebookPreview d={d} info={info} />
            </div>
            <div>
              <PreviewLabel>LinkedIn-style</PreviewLabel>
              <LinkedInPreview d={d} info={info} />
            </div>
            <div>
              <PreviewLabel>WhatsApp-style</PreviewLabel>
              <WhatsAppPreview d={d} info={info} />
            </div>
            <div>
              <PreviewLabel>X-style</PreviewLabel>
              <XPreview d={d} info={info} />
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-2">
            Simulations, not exact reproductions. Each platform crops, truncates and caches previews in its own way, and may keep showing an old preview until its cache refreshes. Images load directly from the address you enter.
          </p>
        </Panel>
        <TagOutput
          tool="open-graph-preview"
          tabs={[
            { id: "og", label: "Open Graph", tags: tags.og, text: text(tags.og, "Open Graph") },
            { id: "twitter", label: "Twitter / X", tags: tags.tw, text: text(tags.tw, "Twitter / X") },
            { id: "all", label: "All tags", tags: tags.all, text: allText },
          ]}
          download={{ name: "open-graph-tags.html", content: () => `<!-- Paste these tags inside <head> -->\n${allText}` }}
        />
      </div>
    </div>
  );
}
