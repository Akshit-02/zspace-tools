import { DEFAULT_SLUG, bulkSlugify, previewUrl, slugCsv, slugify, type SlugOptions } from "../src/lib/slug";
import { buildSchedule } from "../src/lib/emi";
let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`}`);
};
const s = (t: string, o: Partial<SlugOptions> = {}) => slugify(t, { ...DEFAULT_SLUG, ...o }).slug;

eq("spec example", s("The Best Digital Marketing Strategies for Small Businesses in 2027!"), "the-best-digital-marketing-strategies-for-small-businesses-in-2027");
eq("punctuation + multiple spaces", s("  Hello,   World!!  How's it — going?  "), "hello-world-hows-it-going");
eq("no duplicate/edge separators", s("--a--b__c--"), "a-b-c");
eq("numbers", s("Top 10 Tips (2026 Edition) v2.0"), "top-10-tips-2026-edition-v2-0");
eq("symbols become words", s("Rock & Roll @ 100% + more"), "rock-and-roll-at-100-percent-plus-more");
eq("diacritics", s("Café Crème Brûlée à la Mode"), "cafe-creme-brulee-a-la-mode");
eq("German/Nordic/Polish", s("Straße Ærø Łódź Œuvre"), "strasse-aero-lodz-oeuvre");
eq("Cyrillic", s("Привет мир"), "privet-mir");
eq("Ukrainian (national romanisation)", s("Київ Харків"), "kyiv-kharkiv");
eq("Greek", s("Καλημέρα κόσμε"), "kalimera-kosme");
eq("CJK kept as Unicode", s("東京 travel guide"), "東京-travel-guide");
eq("Devanagari kept as Unicode", s("नमस्ते दुनिया"), "नमस्ते-दुनिया");
eq("ASCII-only removes + reports", (() => { const r = slugify("東京 travel", { ...DEFAULT_SLUG, keepUnicode: false }); return [r.slug, r.removed]; })(), ["travel", ["東", "京"]]);
eq("no transliteration keeps accents", s("Café Crème", { transliterate: false }), "café-crème");
eq("underscore separator", s("Hello World Again", { separator: "_" }), "hello_world_again");
eq("uppercase", s("Hello World", { case: "upper" }), "HELLO-WORLD");
eq("preserve case", s("iPhone 16 Pro", { case: "preserve" }), "iPhone-16-Pro");
eq("stop words removed", s("The Art of War and the Lord of the Rings", { removeStopWords: true }), "art-war-lord-rings");
eq("stop words never empty", s("The And Of", { removeStopWords: true }), "the-and-of");
eq("max length cuts at word", s("best website development practices for 2027", { maxLength: 30 }), "best-website-development");
eq("max length exact boundary", s("aaaa bbbb", { maxLength: 9 }), "aaaa-bbbb");
eq("max length long single word", s("supercalifragilistic", { maxLength: 10 }), "supercalif");
eq("emoji/special only → empty", s("!!! 🎉 ???"), "");
eq("bulk + unique suffixes", bulkSlugify("Hello World\n\nhello world!\nAnother Post", DEFAULT_SLUG, true), [{ title: "Hello World", slug: "hello-world" }, { title: "hello world!", slug: "hello-world-2" }, { title: "Another Post", slug: "another-post" }]);
eq("preview joins with one slash", [previewUrl("https://example.com/blog/", "best-practices"), previewUrl("example.com/blog", "x"), previewUrl("https://example.com", "x", true)], ["https://example.com/blog/best-practices", "https://example.com/blog/x", "https://example.com/x/"]);
eq("preview rejects invalid base", [previewUrl("not a url", "x"), previewUrl("javascript:alert(1)", "x"), previewUrl("", "x")], [null, null, null]);
eq("csv escaping", slugCsv([{ title: 'Say "hi", world', slug: "say-hi-world", url: "https://e.com/say-hi-world" }], true), 'title,slug,url\n"Say ""hi"", world",say-hi-world,https://e.com/say-hi-world\n');

/* EMI reconciliation (brief requirement) */
for (const [P, r, n] of [[1_000_000, 10, 240], [500_000, 8.75, 60], [800_000, 9.2, 84], [100_000, 0, 7], [1_000, 36, 3], [987_654.32, 11.11, 359]] as const) {
  const sc = buildSchedule({ principal: P, annualRate: r, months: n });
  const sumP = Math.round(sc.rows.reduce((a, x) => a + x.principal, 0) * 100);
  const sumE = Math.round(sc.rows.reduce((a, x) => a + x.emi, 0) * 100);
  eq(`emi reconciles P=${P} r=${r} n=${n}`, [sumP === Math.round(P * 100), sumE === Math.round(sc.totalPaid * 100), sc.rows.at(-1)!.closing, sc.rows.length], [true, true, 0, n]);
}
if (fails) process.exitCode = 1;
console.log(fails ? `\n${fails} failing` : "\nall passing");

/* URL query helper */
import { buildQuery, parseQuery } from "../src/lib/url-codec";
{
  const p = parseQuery("https://shop.example/search?q=caf%C3%A9+au+lait&tag=a&tag=b%26c&empty=&flag#results");
  eq("query: base/hash", [p.base, p.hash], ["https://shop.example/search", "#results"]);
  eq("query: decoded, repeated keys kept in order", p.params.map((x) => [x.key, x.value]), [["q", "café au lait"], ["tag", "a"], ["tag", "b&c"], ["empty", ""], ["flag", ""]]);
  eq("query: rebuild encodes once", buildQuery(p), "https://shop.example/search?q=caf%C3%A9%20au%20lait&tag=a&tag=b%26c&empty=&flag=#results");
  const edited = { ...p, params: [...p.params.slice(0, 2), { key: "page", value: "2 / 3" }] };
  eq("query: edit + add", buildQuery(edited), "https://shop.example/search?q=caf%C3%A9%20au%20lait&tag=a&page=2%20%2F%203#results");
  eq("query: malformed % kept + flagged", parseQuery("?x=100%&y=%E0%A4").params.map((x) => [x.value, Boolean(x.raw)]), [["100%", true], ["%E0%A4", true]]);
  eq("query: bare query string", parseQuery("a=1&b=2").params.length, 2);
  eq("query: round trip stable", buildQuery(parseQuery(buildQuery(p))), buildQuery(p));
}
if (fails) process.exitCode = 1;
eq("preview keeps Unicode readable", previewUrl("https://example.com/blog/", "東京-travel-guide"), "https://example.com/blog/東京-travel-guide");
if (fails) process.exitCode = 1;
