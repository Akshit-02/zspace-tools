"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Monitor, RotateCcw, Smartphone, Sparkles, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { FieldLabel, Panel, Segmented, inputClass } from "./ui";
import TagOutput from "./TagOutput";
import { FacebookPreview, PreviewLabel, SerpPreview, XPreview, useImageInfo } from "./SocialPreviews";
import { EMPTY_META, GUIDE, LANGS, OG_TYPES, ROBOTS_PRESETS, advise, buildTags, checkUrl, clean, htmlDocument, snippet, type MetaInput } from "@/lib/meta-tags";
import { track } from "@/lib/analytics";

const EXAMPLE: MetaInput = {
  ...EMPTY_META,
  title: "Handmade Ceramic Mugs – Small-Batch Pottery | Kiln & Co.",
  description: "Shop small-batch ceramic mugs, thrown and glazed by hand in Jaipur. Microwave-safe, dishwasher-safe, shipped across India in plastic-free packaging.",
  url: "https://kilnandco.example/mugs/",
  canonical: "https://kilnandco.example/mugs/",
  siteName: "Kiln & Co.",
  author: "Kiln & Co.",
  lang: "en-IN",
  type: "website",
  twitterSite: "@kilnandco",
};

function Counter({ value, range }: { value: string; range: readonly [number, number] }) {
  const n = clean(value).length;
  const over = n > range[1];
  return (
    <span className={clsx("font-mono text-xs", over ? "text-[#a35a12]" : "text-ink-2")} aria-live="polite">
      {n} chars{range[1] ? ` · guide ${range[0]}–${range[1]}` : ""}
    </span>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  area,
  error,
  counter,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  area?: boolean;
  error?: string | null;
  counter?: readonly [number, number];
  optional?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel htmlFor={id}>
          {label}
          {optional && <span className="ml-1.5 font-normal text-ink-3">{optional}</span>}
        </FieldLabel>
        {counter && <Counter value={value} range={counter} />}
      </div>
      {area ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} aria-invalid={!!error} className={clsx(inputClass, "!h-auto resize-y py-2.5", error && "!border-error")} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} aria-invalid={!!error} className={clsx(inputClass, error && "!border-error")} />
      )}
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : hint ? <p className="mt-1 text-xs text-ink-2">{hint}</p> : null}
    </div>
  );
}

export default function MetaTagGenerator() {
  const [m, setM] = useState<MetaInput>(EMPTY_META);
  const [robotsMode, setRobotsMode] = useState<string>("index, follow");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    track("tool_opened", { tool: "meta-tag-generator" });
  }, []);

  const set = (k: keyof MetaInput) => (v: string) => setM((cur) => ({ ...cur, [k]: v }));
  const tags = useMemo(() => buildTags(m), [m]);
  const notes = useMemo(() => advise(m), [m]);
  const urlErr = (raw: string, label: string) => {
    const c = checkUrl(raw, label);
    return c.ok === false ? c.message : null;
  };
  const imageCheck = checkUrl(m.image);
  const info = useImageInfo(imageCheck.ok ? imageCheck.url : "");
  const preview = {
    title: clean(m.title),
    description: clean(m.description),
    url: checkUrl(m.url).ok ? m.url.trim() : checkUrl(m.canonical).ok ? m.canonical.trim() : "",
    image: imageCheck.ok ? imageCheck.url : "",
    siteName: clean(m.siteName),
    twitterCard: m.twitterCard,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">Page details</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setM(EXAMPLE);
                setRobotsMode("index, follow");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
            >
              <Sparkles aria-hidden className="size-4" /> Example
            </button>
            <button
              type="button"
              onClick={() => {
                setM(EMPTY_META);
                setRobotsMode("index, follow");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
            >
              <RotateCcw aria-hidden className="size-4" /> Reset
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <Text id="mt-title" label="Page title" value={m.title} onChange={set("title")} placeholder="Handmade Ceramic Mugs | Kiln & Co." counter={GUIDE.title} />
          <Text id="mt-description" label="Meta description" area value={m.description} onChange={set("description")} placeholder="A one- or two-sentence summary of the page." counter={GUIDE.description} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="mt-url" label="Page URL" value={m.url} onChange={set("url")} placeholder="https://example.com/page/" error={urlErr(m.url, "Page URL")} />
            <Text id="mt-canonical" label="Canonical URL" value={m.canonical} onChange={set("canonical")} placeholder="Same as page URL" error={urlErr(m.canonical, "Canonical URL")} hint="Leave empty to use the page URL." />
          </div>

          <div>
            <FieldLabel htmlFor="mt-robots">Robots</FieldLabel>
            <select
              id="mt-robots"
              value={robotsMode}
              onChange={(e) => {
                setRobotsMode(e.target.value);
                if (e.target.value !== "custom") set("robots")(e.target.value);
              }}
              className={inputClass}
            >
              {ROBOTS_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r}
                  {r === "index, follow" ? " (default for public pages)" : ""}
                </option>
              ))}
              <option value="custom">Custom directive…</option>
            </select>
            {robotsMode === "custom" && (
              <input aria-label="Custom robots directive" value={m.robots} onChange={(e) => set("robots")(e.target.value)} placeholder="index, follow, max-image-preview:large" className={clsx(inputClass, "mt-2 font-mono")} />
            )}
            <p className="mt-1 text-xs text-ink-2">Tells crawlers whether to index the page and follow its links. Compliant crawlers respect it; it isn&apos;t access control.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="mt-site" label="Website or brand name" value={m.siteName} onChange={set("siteName")} placeholder="Kiln & Co." />
            <Text id="mt-author" label="Author" value={m.author} onChange={set("author")} optional="optional" />
            <div>
              <FieldLabel htmlFor="mt-lang">Language</FieldLabel>
              <select id="mt-lang" value={m.lang} onChange={(e) => set("lang")(e.target.value)} className={inputClass}>
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} — {l.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="mt-type">Content type (og:type)</FieldLabel>
              <select id="mt-type" value={m.type} onChange={(e) => set("type")(e.target.value)} className={inputClass}>
                {OG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Text id="mt-image" label="Social sharing image URL" value={m.image} onChange={set("image")} placeholder="https://example.com/og-image.jpg" error={urlErr(m.image, "Image URL")} hint="1200 × 630 px is a common choice for link previews." />
          <Text id="mt-image-alt" label="Image description (alt)" value={m.imageAlt} onChange={set("imageAlt")} optional="optional" />

          <div>
            <FieldLabel>X card type</FieldLabel>
            <Segmented
              label="X card type"
              size="sm"
              value={m.twitterCard}
              onChange={(v) => set("twitterCard")(v)}
              options={[
                { value: "summary_large_image", label: "Large image" },
                { value: "summary", label: "Summary" },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text id="mt-xsite" label="X account for the site" value={m.twitterSite} onChange={set("twitterSite")} placeholder="@yourbrand" optional="optional" />
            <Text id="mt-xcreator" label="X account of the author" value={m.twitterCreator} onChange={set("twitterCreator")} placeholder="@author" optional="optional" />
          </div>
          <Text id="mt-keywords" label="Keywords" value={m.keywords} onChange={set("keywords")} optional="optional · legacy" hint="Google doesn't use the keywords tag for ranking. Leave it empty unless another system needs it." />
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        {notes.length > 0 && (
          <ul className="grid gap-1.5 rounded-[14px] border border-line bg-card p-3.5" aria-live="polite" data-testid="meta-advice">
            {notes.map((n) => (
              <li key={n.text} className="flex items-start gap-2 text-sm">
                {n.tone === "error" ? <XCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-error" /> : n.tone === "warn" ? <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" /> : <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-2" />}
                <span className="min-w-0">{n.text}</span>
              </li>
            ))}
          </ul>
        )}

        <Panel className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Preview</h2>
            <div role="group" aria-label="Preview device" className="flex gap-1">
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
          <PreviewLabel>Search result (illustrative)</PreviewLabel>
          <SerpPreview d={preview} mobile={device === "mobile"} />
          <div className={clsx("mt-5 grid gap-5", device === "desktop" && "sm:grid-cols-2")}>
            <div className={clsx(device === "mobile" && "max-w-[380px]")}>
              <PreviewLabel>Open Graph card</PreviewLabel>
              <FacebookPreview d={preview} info={info} />
            </div>
            <div className={clsx(device === "mobile" && "max-w-[380px]")}>
              <PreviewLabel>X card</PreviewLabel>
              <XPreview d={preview} info={info} />
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-2">
            Simulations only. Search engines may rewrite titles and snippets, and truncation depends on the device, query and pixel width — no character count guarantees how it appears. Images load directly from the address you enter.
          </p>
        </Panel>

        <TagOutput
          tool="meta-tag-generator"
          tabs={[
            { id: "basic", label: "HTML meta", tags: tags.basic, text: snippet(tags, m.lang, ["basic"]) },
            { id: "og", label: "Open Graph", tags: tags.og, text: snippet(tags, m.lang, ["og"]) },
            { id: "twitter", label: "Twitter / X", tags: tags.twitter, text: snippet(tags, m.lang, ["twitter"]) },
            { id: "all", label: "All tags", tags: [...tags.basic, ...tags.og, ...tags.twitter], text: snippet(tags, m.lang) },
          ]}
          download={{ name: "meta-tags.html", content: () => htmlDocument(tags, m.lang) }}
        />
      </div>
    </div>
  );
}
