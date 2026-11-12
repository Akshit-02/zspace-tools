/**
 * Meta, Open Graph and Twitter/X tag building (shared by the Meta Tag
 * Generator and the Open Graph Preview). Every user value is escaped for an
 * HTML attribute or text context — the output is a string for copying, never DOM.
 */

export const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Collapses whitespace/newlines — meta values are single-line. */
export const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

export type UrlCheck = { ok: true; url: string } | { ok: false; message: string } | { ok: null };

/** Absolute http(s) URL check. Empty → { ok: null }. */
export function checkUrl(raw: string, label = "URL"): UrlCheck {
  const v = raw.trim();
  if (!v) return { ok: null };
  if (/\s/.test(v)) return { ok: false, message: `${label} can't contain spaces.` };
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return { ok: false, message: `${label} must be a full address starting with https://` };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, message: `${label} must start with http:// or https://` };
  if (!u.hostname.includes(".") && u.hostname !== "localhost") return { ok: false, message: `${label} needs a domain name, e.g. example.com.` };
  return { ok: true, url: u.href };
}

export const ROBOTS_PRESETS = ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"] as const;
const ROBOTS_TOKENS = /^(all|none|index|noindex|follow|nofollow|noarchive|nocache|nosnippet|notranslate|noimageindex|indexifembedded|max-snippet:-?\d+|max-video-preview:-?\d+|max-image-preview:(none|standard|large)|unavailable_after:.+)$/i;

export function checkRobots(value: string): string[] {
  const unknown = value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t && !ROBOTS_TOKENS.test(t));
  return unknown.length ? [`Not a recognised robots directive: ${unknown.join(", ")}. Crawlers ignore directives they don't support.`] : [];
}

export const OG_TYPES = ["website", "article", "product", "profile", "book", "video.other", "music.song"] as const;
export const LANGS = [
  { code: "en", label: "English" },
  { code: "en-IN", label: "English (India)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-SG", label: "English (Singapore)" },
  { code: "en-AE", label: "English (UAE)" },
  { code: "hi-IN", label: "Hindi (India)" },
  { code: "ar-AE", label: "Arabic (UAE)" },
  { code: "ar", label: "Arabic" },
  { code: "fr-FR", label: "French (France)" },
  { code: "de-DE", label: "German (Germany)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "it-IT", label: "Italian (Italy)" },
  { code: "nl-NL", label: "Dutch (Netherlands)" },
] as const;

/** BCP 47 (en-IN) → Open Graph locale (en_IN). Language-only codes get no og:locale. */
export const ogLocale = (lang: string) => (/^[a-z]{2,3}-[A-Z]{2}$/.test(lang) ? lang.replace("-", "_") : "");

export interface MetaInput {
  title: string;
  description: string;
  url: string;
  canonical: string;
  robots: string;
  author: string;
  siteName: string;
  lang: string;
  type: string;
  keywords: string;
  image: string;
  imageAlt: string;
  twitterCard: "summary" | "summary_large_image";
  twitterSite: string;
  twitterCreator: string;
}

export const EMPTY_META: MetaInput = {
  title: "",
  description: "",
  url: "",
  canonical: "",
  robots: "index, follow",
  author: "",
  siteName: "",
  lang: "en",
  type: "website",
  keywords: "",
  image: "",
  imageAlt: "",
  twitterCard: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
};

export interface Tag {
  key: string;
  html: string;
}
export interface TagSet {
  basic: Tag[];
  og: Tag[];
  twitter: Tag[];
}

const handle = (s: string) => {
  const v = clean(s).replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "");
  if (!v) return "";
  return v.startsWith("@") ? v : `@${v}`;
};
export const validHandle = (s: string) => !clean(s) || /^@?[A-Za-z0-9_]{1,15}$/.test(handle(s).replace(/^@/, "@"));

const meta = (attr: "name" | "property", key: string, value: string): Tag => ({ key, html: `<meta ${attr}="${key}" content="${escAttr(value)}">` });

export function buildTags(i: MetaInput): TagSet {
  const title = clean(i.title);
  const description = clean(i.description);
  const url = checkUrl(i.url);
  const canonical = checkUrl(i.canonical);
  const image = checkUrl(i.image);
  const pageUrl = url.ok ? url.url : canonical.ok ? canonical.url : "";
  const canonicalUrl = canonical.ok ? canonical.url : url.ok ? url.url : "";

  const basic: Tag[] = [
    { key: "charset", html: `<meta charset="utf-8">` },
    { key: "viewport", html: `<meta name="viewport" content="width=device-width, initial-scale=1">` },
  ];
  if (title) basic.push({ key: "title", html: `<title>${escText(title)}</title>` });
  if (description) basic.push(meta("name", "description", description));
  if (canonicalUrl) basic.push({ key: "canonical", html: `<link rel="canonical" href="${escAttr(canonicalUrl)}">` });
  const robots = clean(i.robots);
  if (robots) basic.push(meta("name", "robots", robots));
  if (clean(i.author)) basic.push(meta("name", "author", clean(i.author)));
  if (clean(i.keywords)) basic.push(meta("name", "keywords", clean(i.keywords)));

  const og: Tag[] = [];
  if (title) og.push(meta("property", "og:title", title));
  if (description) og.push(meta("property", "og:description", description));
  og.push(meta("property", "og:type", clean(i.type) || "website"));
  if (pageUrl) og.push(meta("property", "og:url", pageUrl));
  if (image.ok) {
    og.push(meta("property", "og:image", image.url));
    if (clean(i.imageAlt)) og.push(meta("property", "og:image:alt", clean(i.imageAlt)));
  }
  if (clean(i.siteName)) og.push(meta("property", "og:site_name", clean(i.siteName)));
  const loc = ogLocale(i.lang);
  if (loc) og.push(meta("property", "og:locale", loc));

  const twitter: Tag[] = [meta("name", "twitter:card", i.twitterCard)];
  if (title) twitter.push(meta("name", "twitter:title", title));
  if (description) twitter.push(meta("name", "twitter:description", description));
  if (image.ok) {
    twitter.push(meta("name", "twitter:image", image.url));
    if (clean(i.imageAlt)) twitter.push(meta("name", "twitter:image:alt", clean(i.imageAlt)));
  }
  if (handle(i.twitterSite) && validHandle(i.twitterSite)) twitter.push(meta("name", "twitter:site", handle(i.twitterSite)));
  if (handle(i.twitterCreator) && validHandle(i.twitterCreator)) twitter.push(meta("name", "twitter:creator", handle(i.twitterCreator)));
  return { basic, og, twitter };
}

export function snippet(tags: TagSet, lang: string, parts: ("basic" | "og" | "twitter")[] = ["basic", "og", "twitter"]) {
  const lines: string[] = [];
  if (parts.includes("basic")) {
    lines.push(`<!-- Set the page language on the html element: <html lang="${escAttr(lang || "en")}"> -->`);
    lines.push("<!-- Primary meta tags -->", ...tags.basic.map((t) => t.html));
  }
  if (parts.includes("og")) lines.push("", "<!-- Open Graph -->", ...tags.og.map((t) => t.html));
  if (parts.includes("twitter")) lines.push("", "<!-- Twitter / X -->", ...tags.twitter.map((t) => t.html));
  return lines.join("\n").replace(/^\n/, "") + "\n";
}

export function htmlDocument(tags: TagSet, lang: string) {
  const body = snippet(tags, lang)
    .split("\n")
    .filter((l) => !l.startsWith("<!-- Set the page language"))
    .map((l) => (l ? "    " + l : ""))
    .join("\n");
  return `<!DOCTYPE html>\n<html lang="${escAttr(lang || "en")}">\n  <head>\n${body.trimEnd()}\n  </head>\n  <body>\n  </body>\n</html>\n`;
}

/** Guidance ranges commonly used in SEO practice — not limits set by search engines. */
export const GUIDE = { title: [30, 60], description: [70, 160], ogTitle: [0, 70], ogDescription: [0, 200] } as const;

export interface Advice {
  tone: "error" | "warn" | "info";
  text: string;
}

export function advise(i: MetaInput): Advice[] {
  const out: Advice[] = [];
  const t = clean(i.title);
  const d = clean(i.description);
  if (!t) out.push({ tone: "warn", text: "Add a page title — it's the most visible part of a search result." });
  else if (t.length > GUIDE.title[1]) out.push({ tone: "info", text: `The title is ${t.length} characters. Longer titles are often shortened in results; put the important words first.` });
  if (!d) out.push({ tone: "info", text: "No meta description. Search engines will pick a snippet from the page instead." });
  else if (d.length > GUIDE.description[1]) out.push({ tone: "info", text: `The description is ${d.length} characters and may be shortened, depending on device and query.` });
  for (const [label, raw] of [
    ["Page URL", i.url],
    ["Canonical URL", i.canonical],
    ["Image URL", i.image],
  ] as const) {
    const c = checkUrl(raw, label);
    if (c.ok === false) out.push({ tone: "error", text: `${c.message} It's left out of the tags.` });
  }
  const img = checkUrl(i.image);
  if (img.ok && img.url.startsWith("http:")) out.push({ tone: "info", text: "Use an https:// image URL — some platforms won't load images over plain http." });
  const url = checkUrl(i.url);
  const can = checkUrl(i.canonical);
  if (url.ok && can.ok && url.url !== can.url) out.push({ tone: "info", text: "The canonical URL differs from the page URL — that tells search engines to prefer the canonical page. Make sure that's intended." });
  if (/noindex/i.test(i.robots)) out.push({ tone: "warn", text: "noindex asks search engines not to show this page in results. Use it only for pages you deliberately want kept out." });
  out.push(...checkRobots(i.robots).map((text) => ({ tone: "warn" as const, text })));
  if (clean(i.keywords)) out.push({ tone: "info", text: "Google ignores the keywords meta tag for ranking. It's included only because you filled it in." });
  if (!validHandle(i.twitterSite) || !validHandle(i.twitterCreator)) out.push({ tone: "error", text: "X handles are 1–15 letters, numbers or underscores, like @zspace. Invalid handles are left out." });
  return out;
}

/* ------------------------------------------------------------------ */
/* Reading metadata from pasted page source (Open Graph import)        */
/* ------------------------------------------------------------------ */

import { decodeHTML } from "entities";

function attrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of tag.replace(/^<\w+/, "").replace(/\/?>$/, "").matchAll(re)) out[m[1].toLowerCase()] = decodeHTML(m[2] ?? m[3] ?? m[4] ?? "");
  return out;
}

export interface ImportedMeta {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  siteName?: string;
  type?: string;
  twitterCard?: string;
  twitterSite?: string;
  found: string[];
}

/** Extracts title/description/OG/Twitter values from HTML source text. Never renders it. */
export function readMeta(html: string): ImportedMeta {
  const head = html.slice(0, 2_000_000);
  const m: Record<string, string> = {};
  // Scan tags quote-aware: <meta ...> and <link ...>
  for (const t of head.matchAll(/<(meta|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const a = attrs(t[0]);
    if (t[1].toLowerCase() === "meta") {
      const key = (a.property || a.name || "").toLowerCase();
      if (key && a.content !== undefined && !(key in m)) m[key] = clean(a.content);
    } else if ((a.rel ?? "").toLowerCase().split(/\s+/).includes("canonical") && a.href && !("canonical" in m)) m.canonical = a.href.trim();
  }
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head);
  const r: ImportedMeta = {
    title: m["og:title"] || m["twitter:title"] || (title ? clean(decodeHTML(title[1])) : undefined),
    description: m["og:description"] || m["twitter:description"] || m["description"],
    url: m["og:url"] || m.canonical,
    image: m["og:image"] || m["og:image:url"] || m["og:image:secure_url"] || m["twitter:image"] || m["twitter:image:src"],
    siteName: m["og:site_name"],
    type: m["og:type"],
    twitterCard: m["twitter:card"],
    twitterSite: m["twitter:site"],
    found: Object.keys(m).filter((k) => /^(og:|twitter:|description$|canonical$)/.test(k)),
  };
  if (title) r.found.unshift("title");
  return r;
}
