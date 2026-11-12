/**
 * XML sitemap engine (sitemaps.org protocol 0.9): URL normalisation and
 * validation, generation with XML escaping, splitting at 50,000 URLs / 50 MB
 * with a sitemap index, parsing existing sitemaps, CSV export.
 */
import { decodeXML } from "entities";

export const FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"] as const;
export type Freq = (typeof FREQS)[number];
export const MAX_URLS = 50_000;
export const MAX_BYTES = 50 * 1024 * 1024;
export const MAX_LOC = 2048;
export const NS = "http://www.sitemaps.org/schemas/sitemap/0.9";

export interface Entry {
  loc: string;
  lastmod?: string;
  changefreq?: Freq;
  priority?: number;
}

export interface Rejected {
  input: string;
  reason: string;
}

export interface NormalizeResult {
  entries: Entry[];
  /** The original input for each entry (same order as entries). */
  sources: string[];
  rejected: Rejected[];
  duplicates: number;
  fragmentsRemoved: number;
  encoded: number;
}

export const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Parses the site base URL; returns its origin or an error. */
export function parseBase(raw: string): { ok: true; origin: string; href: string } | { ok: false; message: string } | { ok: null } {
  const v = raw.trim();
  if (!v) return { ok: null };
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, message: "The website URL must use http or https." };
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return { ok: false, message: "Enter a full domain, e.g. https://example.com" };
    return { ok: true, origin: u.origin, href: u.href };
  } catch {
    return { ok: false, message: "That isn't a valid website address." };
  }
}

/** W3C Datetime as used by sitemaps: YYYY, YYYY-MM, YYYY-MM-DD, or a date-time with a time-zone designator. */
export function validLastmod(s: string) {
  const v = s.trim();
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$/.exec(v);
  if (!m) return false;
  const [, , mo, d, h, mi, sec] = m;
  if (mo && (+mo < 1 || +mo > 12)) return false;
  if (d) {
    const dt = new Date(Date.UTC(+m[1], +mo - 1, +d));
    if (dt.getUTCDate() !== +d) return false;
  }
  if (h && (+h > 23 || +mi > 59 || (sec && +sec > 59))) return false;
  return true;
}

/**
 * Cleans a pasted list. Relative paths (/about) resolve against the base URL.
 * URLs from other origins are rejected unless listed in extraOrigins.
 */
export function normalizeUrls(lines: string[], base: string, extraOrigins: string[] = []): NormalizeResult {
  const b = parseBase(base);
  const origin = b.ok ? b.origin : null;
  const allowed = new Set([origin, ...extraOrigins.map((o) => parseBase(o)).flatMap((r) => (r.ok ? [r.origin] : []))].filter(Boolean) as string[]);
  const seen = new Set<string>();
  const res: NormalizeResult = { entries: [], sources: [], rejected: [], duplicates: 0, fragmentsRemoved: 0, encoded: 0 };
  for (const raw of lines) {
    const v = raw.trim();
    if (!v) continue;
    if (v.startsWith("#")) {
      res.rejected.push({ input: v, reason: "Fragment only (#…) — not a separate page." });
      continue;
    }
    let u: URL;
    try {
      if (v.startsWith("/") && !v.startsWith("//")) {
        if (!origin) {
          res.rejected.push({ input: v, reason: "Relative path — add the website URL first." });
          continue;
        }
        u = new URL(v, origin);
      } else u = new URL(v);
    } catch {
      res.rejected.push({ input: v, reason: "Not a valid absolute URL." });
      continue;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      res.rejected.push({ input: v, reason: `Unsupported scheme “${u.protocol.replace(":", "")}” — use http or https.` });
      continue;
    }
    if (u.username || u.password) {
      res.rejected.push({ input: v, reason: "Contains a username or password." });
      continue;
    }
    if (!u.hostname.includes(".") && u.hostname !== "localhost") {
      res.rejected.push({ input: v, reason: "Missing a domain name." });
      continue;
    }
    if (allowed.size && !allowed.has(u.origin)) {
      res.rejected.push({ input: v, reason: `Different site (${u.origin}). Add it as an extra origin to include it.` });
      continue;
    }
    if (u.hash) {
      u.hash = "";
      res.fragmentsRemoved++;
    }
    if (/\s|[^\x21-\x7e]/.test(v.replace(/#.*$/, ""))) res.encoded++;
    const href = u.href;
    if (href.length > MAX_LOC) {
      res.rejected.push({ input: v.slice(0, 80) + "…", reason: `Longer than ${MAX_LOC} characters.` });
      continue;
    }
    if (seen.has(href)) {
      res.duplicates++;
      continue;
    }
    seen.add(href);
    res.entries.push({ loc: href });
    res.sources.push(raw);
  }
  return res;
}

export interface Defaults {
  lastmod: string;
  changefreq: Freq | "";
  priority: string;
}

/** Applies defaults only where an entry has no value of its own. */
export function withDefaults(e: Entry, d: Defaults): Entry {
  const p = d.priority === "" ? undefined : Number(d.priority);
  return {
    loc: e.loc,
    lastmod: e.lastmod ?? (d.lastmod && validLastmod(d.lastmod) ? d.lastmod : undefined),
    changefreq: e.changefreq ?? (d.changefreq || undefined),
    priority: e.priority ?? (p !== undefined && p >= 0 && p <= 1 ? p : undefined),
  };
}

const urlXml = (e: Entry) =>
  [
    "  <url>",
    `    <loc>${escXml(e.loc)}</loc>`,
    e.lastmod ? `    <lastmod>${escXml(e.lastmod)}</lastmod>` : "",
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : "",
    e.priority !== undefined ? `    <priority>${e.priority.toFixed(1)}</priority>` : "",
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

const HEAD = `<?xml version="1.0" encoding="UTF-8"?>\n`;

export function urlset(entries: Entry[]) {
  return `${HEAD}<urlset xmlns="${NS}">\n${entries.map(urlXml).join("\n")}${entries.length ? "\n" : ""}</urlset>\n`;
}

export interface SitemapFile {
  name: string;
  xml: string;
  count: number;
  bytes: number;
}

const enc = new TextEncoder();

/** Splits into files of at most maxUrls and maxBytes each. */
export function buildSitemaps(entries: Entry[], maxUrls = MAX_URLS, maxBytes = MAX_BYTES): SitemapFile[] {
  const overhead = enc.encode(urlset([])).length;
  const files: Entry[][] = [];
  let cur: Entry[] = [];
  let size = overhead;
  for (const e of entries) {
    const b = enc.encode(urlXml(e) + "\n").length;
    if (cur.length && (cur.length >= maxUrls || size + b > maxBytes)) {
      files.push(cur);
      cur = [];
      size = overhead;
    }
    cur.push(e);
    size += b;
  }
  if (cur.length || !files.length) files.push(cur);
  return files.map((f, i) => {
    const xml = urlset(f);
    return { name: files.length === 1 ? "sitemap.xml" : `sitemap-${i + 1}.xml`, xml, count: f.length, bytes: enc.encode(xml).length };
  });
}

export function sitemapIndex(files: SitemapFile[], origin: string, dir = "/", lastmod?: string) {
  const base = origin.replace(/\/$/, "") + (dir.startsWith("/") ? dir : `/${dir}`).replace(/\/?$/, "/");
  const items = files.map((f) =>
    ["  <sitemap>", `    <loc>${escXml(base + f.name)}</loc>`, lastmod ? `    <lastmod>${escXml(lastmod)}</lastmod>` : "", "  </sitemap>"].filter(Boolean).join("\n"),
  );
  return `${HEAD}<sitemapindex xmlns="${NS}">\n${items.join("\n")}\n</sitemapindex>\n`;
}

/* ---------------- Import ---------------- */

const unwrap = (s: string) => decodeXML(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim();
const child = (block: string, name: string) => {
  const m = new RegExp(`<(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "i").exec(block);
  return m ? unwrap(m[1]) : undefined;
};

export interface Parsed {
  kind: "urlset" | "sitemapindex";
  entries: Entry[];
  warnings: string[];
}

/** Reads <url> (or <sitemap>) entries from sitemap XML text. */
export function parseSitemap(xml: string): Parsed | { error: string } {
  const src = xml.replace(/<!--[\s\S]*?-->/g, "");
  const isIndex = /<(?:[\w-]+:)?sitemapindex\b/i.test(src);
  if (!isIndex && !/<(?:[\w-]+:)?urlset\b/i.test(src)) return { error: "This doesn't look like a sitemap — no <urlset> or <sitemapindex> element was found." };
  const tag = isIndex ? "sitemap" : "url";
  const entries: Entry[] = [];
  const warnings: string[] = [];
  let missing = 0;
  for (const m of src.matchAll(new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, "gi"))) {
    const loc = child(m[1], "loc");
    if (!loc) {
      missing++;
      continue;
    }
    const e: Entry = { loc };
    const lm = child(m[1], "lastmod");
    if (lm) {
      if (validLastmod(lm)) e.lastmod = lm;
      else warnings.push(`Ignored invalid lastmod “${lm}” for ${loc}.`);
    }
    const cf = child(m[1], "changefreq")?.toLowerCase();
    if (cf && (FREQS as readonly string[]).includes(cf)) e.changefreq = cf as Freq;
    const pr = child(m[1], "priority");
    if (pr !== undefined && pr !== "") {
      const n = Number(pr);
      if (Number.isFinite(n) && n >= 0 && n <= 1) e.priority = Math.round(n * 10) / 10;
      else warnings.push(`Ignored invalid priority “${pr}” for ${loc}.`);
    }
    entries.push(e);
  }
  if (missing) warnings.push(`${missing} entr${missing === 1 ? "y has" : "ies have"} no <loc> and were skipped.`);
  if (!entries.length) return { error: `No <${tag}> entries with a <loc> were found.` };
  return { kind: isIndex ? "sitemapindex" : "urlset", entries, warnings: warnings.slice(0, 50) };
}

/** Lines from a TXT/CSV upload: takes the first cell of each row (or a "loc"/"url" column if there's a header). */
export function urlsFromText(text: string): string[] {
  const rows = text.replace(/^﻿/, "").split(/\r?\n/);
  const first = rows[0]?.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase()) ?? [];
  const col = Math.max(0, first.findIndex((c) => c === "loc" || c === "url" || c === "urls" || c === "address"));
  const hasHeader = first.some((c) => ["loc", "url", "urls", "address"].includes(c));
  return rows.slice(hasHeader ? 1 : 0).map((r) => {
    if (!/[,;\t]/.test(r)) return r.trim();
    const cells = r.match(/("([^"]|"")*"|[^,;\t]*)/g)?.filter((_, i, a) => i % 2 === 0 || a.length < 2) ?? [r];
    return (cells[col] ?? "").trim().replace(/^"|"$/g, "").replace(/""/g, '"');
  });
}

/** Sitemap lines from a robots.txt (Sitemap: https://…). */
export const sitemapsFromRobots = (text: string) => [...text.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]);

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
export const toCsv = (entries: Entry[]) =>
  "loc,lastmod,changefreq,priority\r\n" + entries.map((e) => [e.loc, e.lastmod ?? "", e.changefreq ?? "", e.priority !== undefined ? e.priority.toFixed(1) : ""].map(csvCell).join(",")).join("\r\n") + "\r\n";

/** Structural checks on generated XML (well-formedness is checked in the browser with DOMParser). */
export function checkSitemap(files: SitemapFile[]): string[] {
  const out: string[] = [];
  for (const f of files) {
    if (f.count > MAX_URLS) out.push(`${f.name} has ${f.count} URLs (limit ${MAX_URLS}).`);
    if (f.bytes > MAX_BYTES) out.push(`${f.name} is larger than 50 MB.`);
  }
  return out;
}
