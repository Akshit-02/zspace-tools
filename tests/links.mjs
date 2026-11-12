// Crawls the running site from / and checks every internal link + in-page anchor.
// Usage: node tests/links.mjs [baseUrl]
const base = process.argv[2] ?? "http://localhost:3100";
const seen = new Map();
const queue = ["/"];
const anchors = [];
const pages = new Map();
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  const res = await fetch(base + path, { redirect: "follow" });
  seen.set(path, res.status);
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").includes("text/html")) continue;
  const html = await res.text();
  pages.set(path, html);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(href) || href.startsWith("/_next/")) continue;
    const [p, hash] = href.split("#");
    const target = p === "" ? path : p.split("?")[0];
    if (hash) anchors.push({ from: path, target, hash });
    if (!seen.has(target)) queue.push(target);
  }
}
const bad = [...seen].filter(([, s]) => s !== 200);
const missingAnchors = anchors.filter((a) => pages.has(a.target) && !pages.get(a.target).includes(`id="${a.hash}"`));
console.log(`Checked ${seen.size} internal URLs, ${anchors.length} anchors.`);
console.log("Non-200:", bad.length ? bad : "none");
console.log("Missing anchors:", missingAnchors.length ? [...new Set(missingAnchors.map((a) => `${a.target}#${a.hash}`))] : "none");
process.exitCode = bad.length || missingAnchors.length ? 1 : 0;
