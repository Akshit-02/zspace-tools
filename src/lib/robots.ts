/**
 * robots.txt building, linting, parsing and a simplified rule tester that
 * follows RFC 9309 (Robots Exclusion Protocol): group selection by product
 * token, longest-match wins, Allow wins ties, "*" and "$" wildcards.
 */

export type RuleType = "allow" | "disallow";
export interface Rule {
  id: string;
  type: RuleType;
  path: string;
}
export interface Group {
  id: string;
  agents: string[];
  rules: Rule[];
  crawlDelay: string;
  comment: string;
}
export interface RobotsConfig {
  comment: string;
  groups: Group[];
  sitemaps: string[];
}

let n = 0;
export const uid = () => `r${Date.now().toString(36)}${(n++).toString(36)}`;
export const rule = (type: RuleType, path: string): Rule => ({ id: uid(), type, path });
export const group = (agents: string[], rules: Rule[] = [], extra: Partial<Group> = {}): Group => ({ id: uid(), agents, rules, crawlDelay: "", comment: "", ...extra });

export const AGENTS = [
  { token: "*", label: "All crawlers (*)" },
  { token: "Googlebot", label: "Googlebot" },
  { token: "Bingbot", label: "Bingbot" },
  { token: "Googlebot-Image", label: "Googlebot-Image" },
  { token: "Applebot", label: "Applebot" },
  { token: "DuckDuckBot", label: "DuckDuckBot" },
  { token: "GPTBot", label: "GPTBot" },
] as const;

const clean = (s: string) => s.replace(/[\r\n#]/g, "").trim();

export function generate(c: RobotsConfig): string {
  const out: string[] = [];
  if (c.comment.trim()) out.push(...c.comment.trim().split(/\r?\n/).map((l) => `# ${l.replace(/^#\s?/, "")}`), "");
  for (const g of c.groups) {
    const agents = g.agents.map(clean).filter(Boolean);
    if (!agents.length) continue;
    if (g.comment.trim()) out.push(...g.comment.trim().split(/\r?\n/).map((l) => `# ${l.replace(/^#\s?/, "")}`));
    for (const a of agents) out.push(`User-agent: ${a}`);
    const rules = g.rules.filter((r) => clean(r.path) || r.type === "disallow");
    if (!rules.length) out.push("Disallow:");
    for (const r of rules) out.push(`${r.type === "allow" ? "Allow" : "Disallow"}: ${clean(r.path)}`.trimEnd());
    if (clean(g.crawlDelay)) out.push(`Crawl-delay: ${clean(g.crawlDelay)}`);
    out.push("");
  }
  const maps = c.sitemaps.map(clean).filter(Boolean);
  for (const s of maps) out.push(`Sitemap: ${s}`);
  return out.join("\n").replace(/\n+$/, "") + "\n";
}

export interface Lint {
  tone: "danger" | "warn" | "info";
  text: string;
}

export function blocksAll(c: RobotsConfig) {
  return c.groups.some((g) => g.agents.some((a) => clean(a) === "*") && g.rules.some((r) => r.type === "disallow" && clean(r.path) === "/") && !g.rules.some((r) => r.type === "allow" && clean(r.path)));
}

export function lint(c: RobotsConfig): Lint[] {
  const out: Lint[] = [];
  if (blocksAll(c)) out.push({ tone: "danger", text: "“Disallow: /” for all crawlers asks every compliant crawler to stay off your entire site. Your pages can drop out of search over time." });
  const seen = new Map<string, number>();
  for (const g of c.groups) {
    for (const a of g.agents.map(clean).filter(Boolean)) seen.set(a.toLowerCase(), (seen.get(a.toLowerCase()) ?? 0) + 1);
    if (!g.agents.map(clean).some(Boolean)) out.push({ tone: "warn", text: "A group has no user agent, so it's left out of the file." });
    for (const r of g.rules) {
      const p = clean(r.path);
      if (p && !p.startsWith("/") && !p.startsWith("*")) out.push({ tone: "warn", text: `“${p}” should start with / (paths are matched from the start of the URL path).` });
      if (/\.(css|js)\$?$/i.test(p) && r.type === "disallow") out.push({ tone: "warn", text: `Blocking “${p}” can stop search engines rendering your pages properly.` });
      if (/^https?:/i.test(p)) out.push({ tone: "warn", text: `“${p}” is a full URL — rules take a path such as /private/.` });
    }
    if (clean(g.crawlDelay)) {
      if (!/^\d+(\.\d+)?$/.test(clean(g.crawlDelay))) out.push({ tone: "warn", text: "Crawl-delay should be a number of seconds." });
      out.push({ tone: "info", text: "Crawl-delay isn't part of RFC 9309. Bing and some others honour it; Google ignores it." });
    }
  }
  for (const [a, count] of seen) if (count > 1) out.push({ tone: "info", text: `“${a}” appears in ${count} groups. Crawlers combine them, but one group is easier to maintain.` });
  for (const s of c.sitemaps.map(clean).filter(Boolean)) {
    try {
      const u = new URL(s);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      out.push({ tone: "warn", text: `Sitemap “${s}” must be a full URL, e.g. https://example.com/sitemap.xml.` });
    }
  }
  return out;
}

/* ---------------- Presets ---------------- */

export type PresetId = "allow-all" | "block-all" | "basic" | "wordpress" | "ecommerce" | "custom";

export function preset(id: PresetId, site: string): RobotsConfig {
  const origin = site.replace(/\/+$/, "");
  const sitemaps = origin ? [`${origin}/sitemap.xml`] : [];
  switch (id) {
    case "allow-all":
      return { comment: "", groups: [group(["*"], [rule("allow", "/")])], sitemaps };
    case "block-all":
      return { comment: "Blocks all compliant crawlers from the whole site", groups: [group(["*"], [rule("disallow", "/")])], sitemaps: [] };
    case "basic":
      return { comment: "", groups: [group(["*"], [rule("disallow", "/admin/"), rule("disallow", "/search"), rule("disallow", "/*?sessionid=")])], sitemaps };
    case "wordpress":
      return {
        comment: "Common WordPress example — check these paths match your installation",
        groups: [group(["*"], [rule("disallow", "/wp-admin/"), rule("allow", "/wp-admin/admin-ajax.php"), rule("disallow", "/?s="), rule("disallow", "/search/")])],
        sitemaps: origin ? [`${origin}/wp-sitemap.xml`] : [],
      };
    case "ecommerce":
      return {
        comment: "E-commerce example — adjust paths to your platform",
        groups: [group(["*"], [rule("disallow", "/cart"), rule("disallow", "/checkout"), rule("disallow", "/account"), rule("disallow", "/*?sort="), rule("disallow", "/*?filter="), rule("disallow", "/search")])],
        sitemaps,
      };
    case "custom":
      return { comment: "", groups: [group(["*"], [])], sitemaps };
  }
}

/* ---------------- Parsing & testing (RFC 9309) ---------------- */

export interface ParsedRule {
  type: RuleType;
  path: string;
  line: number;
}
export interface ParsedGroup {
  agents: string[];
  rules: ParsedRule[];
  line: number;
}

export function parse(text: string): { groups: ParsedGroup[]; sitemaps: string[]; ignored: number[] } {
  const groups: ParsedGroup[] = [];
  const sitemaps: string[] = [];
  const ignored: number[] = [];
  let cur: ParsedGroup | null = null;
  let lastWasAgent = false;
  text.split(/\r\n|\r|\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) return;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) {
      ignored.push(i + 1);
      return;
    }
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [], line: i + 1 };
        groups.push(cur);
      }
      cur.agents.push(val);
      lastWasAgent = true;
      return;
    }
    lastWasAgent = false;
    if (key === "sitemap") sitemaps.push(val);
    else if ((key === "allow" || key === "disallow") && cur) cur.rules.push({ type: key, path: val, line: i + 1 });
    else if (key !== "crawl-delay" && key !== "host") ignored.push(i + 1);
  });
  return { groups, sitemaps, ignored };
}

/** Percent-encode characters outside the URI set, normalise %xx to uppercase. */
function norm(s: string) {
  return s.replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase()).replace(/[^\x21-\x7e]|%(?![0-9A-F]{2})/g, (c) => (c === "%" ? "%25" : encodeURIComponent(c)));
}

/** Does an RFC 9309 path pattern match the start of `path`? */
export function matches(pattern: string, path: string) {
  const p = norm(pattern);
  const anchored = p.endsWith("$");
  const body = anchored ? p.slice(0, -1) : p;
  const re = new RegExp("^" + body.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : ""));
  return re.test(norm(path));
}

export interface Verdict {
  allowed: boolean;
  rule: ParsedRule | null;
  agents: string[];
  reason: string;
}

/** Normalises a typed URL or path to path + query. */
export function toPath(input: string) {
  const v = input.trim();
  if (!v) return "/";
  try {
    if (/^https?:\/\//i.test(v)) {
      const u = new URL(v);
      return u.pathname + u.search;
    }
  } catch {
    /* fall through */
  }
  return (v.startsWith("/") ? v : `/${v}`).replace(/#.*$/, "");
}

export function test(text: string, userAgent: string, rawPath: string): Verdict {
  const path = toPath(rawPath);
  const { groups } = parse(text);
  const token = userAgent.trim().toLowerCase().split("/")[0];
  if (path === "/robots.txt") return { allowed: true, rule: null, agents: [], reason: "/robots.txt itself is always allowed." };
  const pick = (t: string) => groups.filter((g) => g.agents.some((a) => a.toLowerCase() === t));
  let chosen = pick(token);
  let via = token;
  // Google documents that its specialised crawlers fall back to Googlebot's rules.
  if (!chosen.length && token.startsWith("googlebot-")) {
    chosen = pick("googlebot");
    via = "googlebot";
  }
  if (!chosen.length) {
    chosen = pick("*");
    via = "*";
  }
  if (!chosen.length) return { allowed: true, rule: null, agents: [], reason: "No group applies to this crawler, so everything is allowed." };
  const rules = chosen.flatMap((g) => g.rules).filter((r) => r.path !== "");
  let best: ParsedRule | null = null;
  let bestLen = -1;
  for (const r of rules) {
    if (!matches(r.path, path)) continue;
    const len = norm(r.path).length;
    if (len > bestLen || (len === bestLen && r.type === "allow" && best?.type === "disallow")) {
      best = r;
      bestLen = len;
    }
  }
  const agents = [...new Set(chosen.flatMap((g) => g.agents))];
  const groupNote = via === token ? `the group for “${agents.join(", ")}”` : via === "googlebot" ? "Googlebot's group (Google's fallback for its specialised crawlers)" : "the “*” group (no group names this crawler)";
  if (!best) return { allowed: true, rule: null, agents, reason: `No rule in ${groupNote} matches this path, so it's allowed.` };
  return {
    allowed: best.type === "allow",
    rule: best,
    agents,
    reason: `Line ${best.line} in ${groupNote} is the longest matching rule${rules.some((r) => r !== best && matches(r.path, path) && norm(r.path).length === bestLen) ? " (Allow wins a tie)" : ""}.`,
  };
}
