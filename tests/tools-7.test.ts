import { DECODE_SAMPLE, decodeEntities, encodeEntities, type EncodeOptions } from "../src/lib/html-entities";
import { EMPTY_META, advise, buildTags, checkUrl, escAttr, htmlDocument, ogLocale, readMeta, snippet, validHandle } from "../src/lib/meta-tags";
import { MAX_URLS, buildSitemaps, normalizeUrls, parseBase, parseSitemap, sitemapIndex, sitemapsFromRobots, toCsv, urlsFromText, urlset, validLastmod, withDefaults } from "../src/lib/sitemap";
import { blocksAll, generate, group, lint, matches, parse, preset, rule, test, toPath } from "../src/lib/robots";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const ok = (name: string, cond: boolean, info?: unknown) => eq(name + (cond || info === undefined ? "" : ` (${JSON.stringify(info).slice(0, 300)})`), cond, true);

/* ---------------- HTML entities ---------------- */
const E = (s: string, o: Partial<EncodeOptions> = {}) => encodeEntities(s, { scope: "special", format: "named", quotes: true, preserve: false, ...o }).output;
eq("ent: brief example", E("Tom & Jerry < Special Characters >"), "Tom &amp; Jerry &lt; Special Characters &gt;");
eq("ent: quotes", E(`"a" 'b'`), "&quot;a&quot; &#39;b&#39;");
eq("ent: quotes off", E(`"a" 'b'`, { quotes: false }), `"a" 'b'`);
eq("ent: decimal", E("<&>", { format: "decimal" }), "&#60;&#38;&#62;");
eq("ent: hex", E("<'", { format: "hex" }), "&#x3C;&#x27;");
eq("ent: special-only leaves unicode", E("café ₹ 😀"), "café ₹ 😀");
eq("ent: non-ASCII named", E("café © — ’ ₹", { scope: "nonascii" }), "caf&eacute; &copy; &mdash; &rsquo; &#x20B9;");
eq("ent: non-ASCII decimal", E("é😀", { scope: "nonascii", format: "decimal" }), "&#233;&#128512;");
eq("ent: emoji single reference (hex)", E("😀", { scope: "nonascii", format: "hex" }), "&#x1F600;");
eq("ent: ZWJ emoji sequence", E("👩‍💻", { scope: "nonascii", format: "hex" }), "&#x1F469;&#x200D;&#x1F4BB;");
eq("ent: double-encodes by default", E("&amp; &copy;"), "&amp;amp; &amp;copy;");
eq("ent: preserve valid entities", E("&amp; &copy; &#169; &#xA9; & &zzz; &copy", { preserve: true }), "&amp; &copy; &#169; &#xA9; &amp; &amp;zzz; &amp;copy");
eq("ent: empty", encodeEntities("", { scope: "special", format: "named", quotes: true, preserve: false }), { output: "", count: 0 });
eq("ent: count", encodeEntities("a&b<c", { scope: "special", format: "named", quotes: true, preserve: false }).count, 2);
const D = (s: string) => decodeEntities(s);
eq("dec: brief example", D("Tom &amp; Jerry &lt; Special Characters &gt;").output, "Tom & Jerry < Special Characters >");
eq("dec: named/decimal/hex", D("&copy; &#169; &#xA9; &#XA9;").output, "© © © ©");
eq("dec: emoji", D("&#x1F600; &#128512;").output, "😀 😀");
eq("dec: multi-codepoint named", D("&NotEqualTilde;").output, "≂̸");
eq("dec: nbsp", D("a&nbsp;b").output, "a b");
eq("dec: unknown kept", D("&zzz;").output, "&zzz;");
ok("dec: unknown flagged", D("&zzz;").issues[0]?.kind === "unknown");
eq("dec: legacy no-semicolon", D("&copy 2026").output, "© 2026");
ok("dec: no-semicolon flagged", D("&copy 2026").issues[0]?.kind === "no-semicolon");
ok("dec: numeric no-semicolon flagged", D("&#169 x").output === "© x" && D("&#169 x").issues[0]?.kind === "no-semicolon");
eq("dec: invalid code points → U+FFFD", D("&#0; &#xD800; &#x110000;").output, "� � �");
eq("dec: invalid code points flagged", D("&#0; &#xD800; &#x110000;").issues.map((i) => i.kind), ["invalid-codepoint", "invalid-codepoint", "invalid-codepoint"]);
eq("dec: C1 control → Windows-1252", D("&#128;").output, "€");
eq("dec: bare ampersand untouched", D("Fish & Chips").output, "Fish & Chips");
eq("dec: bare ampersand not flagged", D("Fish & Chips").issues.length, 0);
eq("dec: &# without digits", D("&#; &#x;").output, "&#; &#x;");
eq("dec: no double decode", D("&amp;lt;").output, "&lt;");
eq("dec: decoded script is text", D("&lt;script&gt;alert(1)&lt;/script&gt;").output, "<script>alert(1)</script>");
eq("dec: sample counts", [D(DECODE_SAMPLE).issues.length, D(DECODE_SAMPLE).count > 10], [2, true]);
const round = "Ünïcödé “quotes” <tags> & 😀 ₹ ©";
eq("round trip nonascii named", D(E(round, { scope: "nonascii" })).output, round);
eq("round trip hex", D(E(round, { scope: "nonascii", format: "hex" })).output, round);
eq("round trip decimal", D(E(round, { scope: "nonascii", format: "decimal" })).output, round);
const big = "a&b<c> ".repeat(200_000);
const t0 = Date.now();
const bigOut = E(big);
ok("ent: 1.4M chars encode < 3s", Date.now() - t0 < 3000 && D(bigOut).output === big, Date.now() - t0);

/* ---------------- Meta tags ---------------- */
eq("meta: escAttr", escAttr(`Tom & Jerry's "Best" <Deals>`), "Tom &amp; Jerry&#39;s &quot;Best&quot; &lt;Deals&gt;");
const tags = buildTags({ ...EMPTY_META, title: `Tom & Jerry's "Best" <Deals>`, description: "Line one\nline   two", url: "https://example.com/page/", image: "https://example.com/og.jpg", siteName: "Shop", lang: "en-IN", twitterSite: "zspace", twitterCreator: "@bad handle!" });
const all = snippet(tags, "en-IN");
ok("meta: title escaped in text", all.includes("<title>Tom &amp; Jerry's \"Best\" &lt;Deals&gt;</title>"), all);
ok("meta: title escaped in attribute", all.includes('content="Tom &amp; Jerry&#39;s &quot;Best&quot; &lt;Deals&gt;"'));
ok("meta: newline collapsed", all.includes('content="Line one line two"'));
ok("meta: canonical falls back to url", all.includes('<link rel="canonical" href="https://example.com/page/">'));
ok("meta: robots default", all.includes('<meta name="robots" content="index, follow">'));
ok("meta: og tags", ["og:title", "og:description", "og:type", "og:url", "og:image", "og:site_name"].every((k) => all.includes(`property="${k}"`)) && all.includes('content="en_IN"'));
ok("meta: twitter tags", all.includes('name="twitter:card" content="summary_large_image"') && all.includes('name="twitter:site" content="@zspace"') && !all.includes("twitter:creator"));
const bad = snippet(buildTags({ ...EMPTY_META, title: "x", url: "javascript:alert(1)", canonical: "not a url", image: "data:image/png;base64,AAA" }), "en");
ok("meta: invalid URLs left out", !/javascript:|data:|not a url|canonical|og:url|og:image/.test(bad), bad);
ok("meta: empty fields omitted", !snippet(buildTags(EMPTY_META), "en").includes("<title>") && !snippet(buildTags(EMPTY_META), "en").includes("description"));
ok("meta: keywords only when filled", !all.includes("keywords") && snippet(buildTags({ ...EMPTY_META, keywords: "a, b" }), "en").includes('name="keywords" content="a, b"'));
eq("meta: checkUrl", [checkUrl("").ok, checkUrl("https://a.com").ok, checkUrl("ftp://a.com").ok, checkUrl("a.com").ok, checkUrl("https://a b.com").ok, checkUrl("https://localhost:3000").ok], [null, true, false, false, false, true]);
eq("meta: ogLocale", [ogLocale("en-IN"), ogLocale("en"), ogLocale("ar-AE")], ["en_IN", "", "ar_AE"]);
eq("meta: handles", [validHandle(""), validHandle("@zspace"), validHandle("zspace_tools"), validHandle("@bad handle"), validHandle("@waytoolonghandle123")], [true, true, true, false, false]);
const adv = advise({ ...EMPTY_META, title: "x".repeat(80), description: "", robots: "noindex, follow, foo", keywords: "a", url: "https://a.com/x", canonical: "https://a.com/y" });
const advText = adv.map((a) => a.text).join(" | ");
ok("meta: advice", /80 characters/.test(advText) && /noindex/.test(advText) && /foo/.test(advText) && /keywords/.test(advText) && /canonical URL differs/.test(advText) && /No meta description/.test(advText), advText);
ok("meta: advice never promises rankings", !/(improve|boost|guarantee)[^.]*rank/i.test(advText.replace(/doesn't|don't|isn't/g, "")));
const doc = htmlDocument(tags, "en-IN");
ok("meta: html document", doc.startsWith('<!DOCTYPE html>\n<html lang="en-IN">') && doc.includes("    <title>") && !doc.includes("Set the page language"));
const imported = readMeta(`<html><head><title>Fallback &amp; title</title>
<meta property="og:title" content="OG &quot;Title&quot;"><meta name='description' content='Desc'>
<meta property="og:image" content="/img.png"><link rel="canonical" href="https://a.com/p"><meta name="twitter:card" content="summary">
<meta content="Site > name" property="og:site_name"><script>document.title="x"</script></head></html>`);
eq("meta: readMeta", { t: imported.title, d: imported.description, u: imported.url, i: imported.image, s: imported.siteName, c: imported.twitterCard }, { t: 'OG "Title"', d: "Desc", u: "https://a.com/p", i: "/img.png", s: "Site > name", c: "summary" });
eq("meta: readMeta title fallback", readMeta("<title>A &amp; B</title>").title, "A & B");
eq("meta: readMeta nothing", readMeta("<p>hi</p>").found.length, 0);

/* ---------------- Sitemap ---------------- */
const n = normalizeUrls(["https://Example.com/a?x=1&y=2", "/about", "https://example.com/a?x=1&y=2#top", "#x", "ftp://example.com/f", "https://other.com/", "https://example.com/caf é", "not a url", "", "https://user:pw@example.com/", "mailto:a@b.com", "https://example.com/" + "x".repeat(2100)], "example.com");
eq("sm: kept", n.entries.map((e) => e.loc), ["https://example.com/a?x=1&y=2", "https://example.com/about", "https://example.com/caf%20%C3%A9"]);
eq("sm: counts", [n.duplicates, n.fragmentsRemoved, n.encoded, n.rejected.length], [1, 1, 1, 7]);
ok("sm: reasons", n.rejected.some((r) => /Fragment only/.test(r.reason)) && n.rejected.some((r) => /scheme “ftp”/.test(r.reason)) && n.rejected.some((r) => /Different site/.test(r.reason)) && n.rejected.some((r) => /username or password/.test(r.reason)) && n.rejected.some((r) => /2048/.test(r.reason)), n.rejected);
eq("sm: extra origins", normalizeUrls(["https://other.com/x"], "https://example.com", ["other.com"]).entries.length, 1);
eq("sm: relative without base", normalizeUrls(["/x"], "").rejected[0].reason, "Relative path — add the website URL first.");
eq("sm: parseBase", [parseBase("example.com").ok && (parseBase("example.com") as { origin: string }).origin, parseBase("ftp://x.com").ok, parseBase("").ok], ["https://example.com", false, null]);
eq("sm: lastmod formats", ["2026", "2026-11", "2026-11-12", "2026-11-12T10:30Z", "2026-11-12T10:30:00+05:30", "2026-02-29", "2026-13-01", "12/11/2026", "2026-11-12T25:00Z"].map(validLastmod), [true, true, true, true, true, false, false, false, false]);
const d = withDefaults({ loc: "https://e.com/", priority: 0.3 }, { lastmod: "2026-11-12", changefreq: "weekly", priority: "0.8" });
eq("sm: defaults don't override", d, { loc: "https://e.com/", lastmod: "2026-11-12", changefreq: "weekly", priority: 0.3 });
eq("sm: no defaults → only loc", withDefaults({ loc: "https://e.com/" }, { lastmod: "", changefreq: "", priority: "" }), { loc: "https://e.com/", lastmod: undefined, changefreq: undefined, priority: undefined });
const xml = urlset([{ loc: "https://e.com/?a=1&b=<2>'\"" }]);
ok("sm: XML escaping", xml.includes("<loc>https://e.com/?a=1&amp;b=&lt;2&gt;&apos;&quot;</loc>") && xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), xml);
ok("sm: no invented lastmod", !urlset([{ loc: "https://e.com/" }]).includes("lastmod") && !urlset([{ loc: "https://e.com/" }]).includes("priority"));
eq("sm: priority format", urlset([{ loc: "https://e.com/", priority: 1 }]).includes("<priority>1.0</priority>"), true);
const many = Array.from({ length: MAX_URLS + 1 }, (_, i) => ({ loc: `https://e.com/p/${i}` }));
const split = buildSitemaps(many);
eq("sm: split at 50,000", split.map((f) => [f.name, f.count]), [["sitemap-1.xml", 50000], ["sitemap-2.xml", 1]]);
eq("sm: exactly 50,000 = one file", buildSitemaps(many.slice(0, MAX_URLS)).map((f) => f.name), ["sitemap.xml"]);
const bySize = buildSitemaps(Array.from({ length: 30 }, (_, i) => ({ loc: `https://e.com/${i}` })), 50000, 600);
ok("sm: split by size", bySize.length > 1 && bySize.every((f) => f.bytes <= 600) && bySize.reduce((a, f) => a + f.count, 0) === 30, bySize.map((f) => f.bytes));
const idx = sitemapIndex(split, "https://e.com", "/", "2026-11-12");
ok("sm: index", idx.includes("<sitemapindex") && idx.includes("<loc>https://e.com/sitemap-1.xml</loc>") && idx.includes("<loc>https://e.com/sitemap-2.xml</loc>") && idx.includes("<lastmod>2026-11-12</lastmod>"));
const p = parseSitemap(`<?xml version="1.0"?><!-- c --><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="x">
<url><loc><![CDATA[https://e.com/a?x=1&y=2]]></loc><lastmod>2026-01-05</lastmod><changefreq>Weekly</changefreq><priority>0.7</priority><image:image><image:loc>https://e.com/i.png</image:loc></image:image></url>
<url><loc>https://e.com/b?x=1&amp;y=2</loc><lastmod>yesterday</lastmod><priority>7</priority></url><url><lastmod>2026-01-01</lastmod></url></urlset>`);
ok("sm: parse urlset", !("error" in p) && p.kind === "urlset" && JSON.stringify(p.entries) === JSON.stringify([{ loc: "https://e.com/a?x=1&y=2", lastmod: "2026-01-05", changefreq: "weekly", priority: 0.7 }, { loc: "https://e.com/b?x=1&y=2" }]) && p.warnings.length === 3, p);
const pi = parseSitemap(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://e.com/s1.xml</loc></sitemap></sitemapindex>`);
ok("sm: parse index", !("error" in pi) && pi.kind === "sitemapindex" && pi.entries[0].loc === "https://e.com/s1.xml");
ok("sm: parse rejects non-sitemap", "error" in parseSitemap("<html></html>"));
ok("sm: round trip", (() => {
  const r = parseSitemap(buildSitemaps(many.slice(0, 1000))[0].xml);
  return !("error" in r) && r.entries.length === 1000;
})());
eq("sm: urlsFromText csv", urlsFromText('title,url\n"Hello, world",https://a.com/x\nB,https://a.com/y'), ["https://a.com/x", "https://a.com/y"]);
eq("sm: urlsFromText txt", urlsFromText("﻿https://a.com/1\r\nhttps://a.com/2\n"), ["https://a.com/1", "https://a.com/2", ""]);
eq("sm: robots sitemaps", sitemapsFromRobots("User-agent: *\nSitemap: https://a.com/s.xml\nsitemap:https://a.com/t.xml"), ["https://a.com/s.xml", "https://a.com/t.xml"]);
eq("sm: csv", toCsv([{ loc: "https://a.com/?q=a,b", lastmod: "2026-01-01", priority: 0.5 }]), 'loc,lastmod,changefreq,priority\r\n"https://a.com/?q=a,b",2026-01-01,,0.5\r\n');

/* ---------------- Robots ---------------- */
eq("rb: allow all", generate(preset("allow-all", "https://e.com")), "User-agent: *\nAllow: /\n\nSitemap: https://e.com/sitemap.xml\n");
eq("rb: block all", generate(preset("block-all", "")), "# Blocks all compliant crawlers from the whole site\n\nUser-agent: *\nDisallow: /\n");
ok("rb: block all detected", blocksAll(preset("block-all", "")) && lint(preset("block-all", ""))[0].tone === "danger");
ok("rb: allow-all not dangerous", !blocksAll(preset("allow-all", "")) && !lint(preset("allow-all", "https://e.com")).some((l) => l.tone === "danger"));
eq("rb: multiple agents + empty group", generate({ comment: "", groups: [group(["Googlebot", "Bingbot"], [rule("disallow", "/x/")]), group(["GPTBot"], [])], sitemaps: [] }), "User-agent: Googlebot\nUser-agent: Bingbot\nDisallow: /x/\n\nUser-agent: GPTBot\nDisallow:\n");
eq("rb: newline injection stripped", generate({ comment: "", groups: [group(["Bot\nDisallow: /"], [rule("allow", "/a\nDisallow: /")])], sitemaps: [] }), "User-agent: BotDisallow: /\nAllow: /aDisallow: /\n");
eq("rb: crawl-delay & comments", generate({ comment: "Hello\nWorld", groups: [group(["Bingbot"], [rule("disallow", "/a")], { crawlDelay: "5", comment: "slow down" })], sitemaps: ["https://e.com/s.xml"] }), "# Hello\n# World\n\n# slow down\nUser-agent: Bingbot\nDisallow: /a\nCrawl-delay: 5\n\nSitemap: https://e.com/s.xml\n");
const lints = lint({ comment: "", groups: [group(["*"], [rule("disallow", "/assets/app.js"), rule("disallow", "private"), rule("disallow", "https://e.com/x")], { crawlDelay: "abc" }), group([""], []), group(["*"], [])], sitemaps: ["/sitemap.xml"] }).map((l) => l.text).join(" | ");
ok("rb: lint", /rendering/.test(lints) && /should start with \//.test(lints) && /full URL — rules take a path/.test(lints) && /number of seconds/.test(lints) && /Google ignores/.test(lints) && /no user agent/.test(lints) && /appears in 2 groups/.test(lints) && /must be a full URL/.test(lints), lints);
const wp = generate(preset("wordpress", "https://e.com"));
ok("rb: wordpress", wp.includes("Disallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php") && wp.includes("check these paths match your installation"));
const T = `User-agent: *
Disallow: /private
Allow: /private/public$
Disallow: /*.pdf$
Disallow: /search?
Disallow: /fish*.php

User-agent: Googlebot
User-agent: bingbot
Disallow: /g/
Allow: /page
Disallow: /pag

User-agent: googlebot
Disallow: /merged/

Sitemap: https://e.com/sitemap.xml`;
const v = (ua: string, p: string) => test(T, ua, p).allowed;
eq("rb: * group", [v("DuckDuckBot", "/private"), v("DuckDuckBot", "/private/x"), v("DuckDuckBot", "/privateer"), v("DuckDuckBot", "/public")], [false, false, false, true]);
eq("rb: $ anchor", [v("DuckDuckBot", "/private/public"), v("DuckDuckBot", "/private/public/x"), v("DuckDuckBot", "/a/b.pdf"), v("DuckDuckBot", "/a/b.pdf?x=1")], [true, false, false, true]);
eq("rb: * wildcard", [v("x", "/fish.php"), v("x", "/fishheads/cat.php?x"), v("x", "/Fish.php")], [false, false, true]);
eq("rb: query matching", [v("x", "/search?q=1"), v("x", "/search")], [false, true]);
eq("rb: specific group replaces *", [v("Googlebot", "/private"), v("Googlebot", "/g/x")], [true, false]);
eq("rb: case-insensitive UA + merged groups", [v("GOOGLEBOT", "/merged/a"), v("bingbot", "/merged/a")], [false, true]);
eq("rb: longest match", [v("bingbot", "/page"), v("bingbot", "/pages")], [true, true]);
eq("rb: Googlebot-Image falls back to Googlebot", v("Googlebot-Image", "/g/x"), false);
eq("rb: robots.txt always allowed", test("User-agent: *\nDisallow: /", "x", "/robots.txt").allowed, true);
eq("rb: tie → allow", test("User-agent: *\nDisallow: /a\nAllow: /a", "x", "/a").allowed, true);
eq("rb: empty disallow allows", test("User-agent: *\nDisallow:", "x", "/anything").allowed, true);
eq("rb: no matching group", test("User-agent: Googlebot\nDisallow: /", "Bingbot", "/x").allowed, true);
eq("rb: full URL input", test(T, "x", "https://e.com/private?a=1").allowed, false);
eq("rb: percent-encoding", [matches("/caf%c3%a9", "/café"), matches("/café", "/caf%C3%A9")], [true, true]);
eq("rb: toPath", [toPath("https://e.com/a/b?c=1#d"), toPath("a/b"), toPath("")], ["/a/b?c=1", "/a/b", "/"]);
const ps = parse(T);
eq("rb: parse", [ps.groups.length, ps.groups[1].agents, ps.sitemaps], [3, ["Googlebot", "bingbot"], ["https://e.com/sitemap.xml"]]);
ok("rb: verdict cites rule & line", test(T, "x", "/private/x").rule?.line === 2 && /Line 2/.test(test(T, "x", "/private/x").reason));
ok("rb: generated file passes its own tester", !test(generate(preset("ecommerce", "https://e.com")), "Googlebot", "/checkout/step-1").allowed && test(generate(preset("ecommerce", "https://e.com")), "Googlebot", "/products/mug").allowed);

console.log(fails ? `\n${fails} FAILED` : "\nAll tools-7 tests passed");
process.exit(fails ? 1 : 0);
