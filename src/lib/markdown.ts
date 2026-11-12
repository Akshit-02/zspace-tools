/**
 * Markdown → sanitised HTML. marked (GFM) parses; DOMPurify sanitises in the
 * browser with a strict URL allow-list. Raw HTML in Markdown is escaped by the
 * parser config, then the output is sanitised again as defence in depth.
 */
import { Marked, type Tokens } from "marked";
import type DOMPurifyType from "dompurify";

const SAFE_LINK = /^(https?:|mailto:|tel:|#|\/(?!\/)|\.{0,2}\/)/i;
const SAFE_IMG = /^(https?:|data:image\/(png|jpe?g|gif|webp|avif);base64,)/i;

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Strips control characters and whitespace that browsers ignore in URL schemes ("java\nscript:"). */
export function isSafeUrl(url: string, kind: "link" | "image") {
  const u = url.replace(/[\u0000- \u007f-\u009f]/g, "");
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return kind === "link" ? /^(https?|mailto|tel):/i.test(u) : SAFE_IMG.test(u);
  return kind === "link" ? SAFE_LINK.test(u) || !u.includes(":") : !u.includes(":");
}

const md = new Marked({ gfm: true, breaks: false });
md.use({
  renderer: {
    // Raw HTML blocks/inline are shown as text, never rendered.
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text);
    },
    link({ href, title, tokens }: Tokens.Link) {
      const inner = this.parser.parseInline(tokens);
      if (!isSafeUrl(href, "link")) return `<span class="md-unsafe" title="Link removed: unsupported protocol">${inner}</span>`;
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      const ext = /^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
      return `<a href="${escapeHtml(href)}"${t}${ext}>${inner}</a>`;
    },
    image({ href, title, text }: Tokens.Image) {
      if (!isSafeUrl(href, "image")) return `<span class="md-unsafe">[image removed: unsupported source]</span>`;
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${t} loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
    },
  },
});

let purifier: typeof DOMPurifyType | null = null;
async function getPurifier() {
  if (!purifier) {
    const { default: DOMPurify } = await import("dompurify");
    // Only GFM task-list checkboxes may survive, and only as disabled checkboxes.
    DOMPurify.addHook("uponSanitizeElement", (node, data) => {
      if (data.tagName === "input") {
        const el = node as Element;
        if (el.getAttribute("type") !== "checkbox") el.parentNode?.removeChild(el);
        else el.setAttribute("disabled", "");
      }
    });
    DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
      if (data.attrName === "href" && !isSafeUrl(data.attrValue, "link")) data.keepAttr = false;
      if (data.attrName === "src" && !isSafeUrl(data.attrValue, "image")) data.keepAttr = false;
    });
    purifier = DOMPurify;
  }
  return purifier;
}

export function markdownToRawHtml(src: string): string {
  return md.parse(src, { async: false }) as string;
}

/** Parses and sanitises. Must run in the browser (DOMPurify needs a DOM). */
export async function renderMarkdown(src: string): Promise<string> {
  const p = await getPurifier();
  return p.sanitize(markdownToRawHtml(src), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "button", "textarea", "select", "svg", "math", "link", "meta", "base"],
    FORBID_ATTR: ["style"],
    ADD_ATTR: ["target", "rel", "loading", "decoding", "referrerpolicy"],
  });
}

export function exportHtml(bodyHtml: string, title: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { max-width: 46rem; margin: 3rem auto; padding: 0 1.25rem; font: 17px/1.7 system-ui, -apple-system, "Segoe UI", sans-serif; color: #252525; background: #fff; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.2; margin: 1.6em 0 .5em; }
  a { color: #b4532a; }
  code { font: .9em ui-monospace, Menlo, monospace; background: #f2ece3; padding: .1em .35em; border-radius: 4px; }
  pre { background: #252525; color: #faf7f2; padding: 1rem; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; color: inherit; }
  blockquote { margin: 1em 0; padding: .25em 1em; border-left: 3px solid #f07845; color: #77716b; }
  table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #e8ded2; padding: .4em .7em; text-align: left; }
  img { max-width: 100%; height: auto; } hr { border: 0; border-top: 1px solid #e8ded2; margin: 2em 0; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

export function markdownStats(src: string) {
  const text = src.replace(/```[\s\S]*?```/g, " ").replace(/[#>*_`~\[\]()!|-]/g, " ");
  const words = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? []).length;
  return { words, characters: Array.from(src).length, minutes: Math.max(words ? 1 : 0, Math.round(words / 238)) };
}

export const MARKDOWN_SAMPLE = `# Project notes

Write in **Markdown**, see it *formatted* instantly — ~~no more fiddly toolbars~~.

## Checklist
- [x] Draft the outline
- [ ] Add screenshots
- [ ] Share with the team

## Steps
1. Install dependencies
2. Run the dev server
3. Open [ZSpace Tools](https://tools.zspace.in/)

> Less effort. More done.

Inline \`code\` and a block:

\`\`\`js
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("world"));
\`\`\`

| Tool | Runs in browser | Price |
| --- | :---: | ---: |
| Markdown Editor | ✓ | Free |
| JSON Formatter | ✓ | Free |

---

Unicode works too: café, naïve, 日本語, emoji 🎉
`;
