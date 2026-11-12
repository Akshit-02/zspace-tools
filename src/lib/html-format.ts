/**
 * HTML beautifier, minifier and structural checker. A small tokenizer — not a
 * browser parser — so input is never executed or rendered. Script, style,
 * textarea and title contents are treated as raw text; <pre> keeps its whitespace.
 */

export type Indent = "2" | "4" | "tab";

const VOID = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));
const RAW = new Set(["script", "style", "textarea", "title"]);
const PRESERVE = new Set(["pre", "textarea"]);
/** End tags that HTML lets you omit — not reported as unclosed. */
const OPTIONAL_END = new Set("p li dt dd option optgroup tr td th thead tbody tfoot rt rp colgroup caption html head body".split(" "));
const INLINE = new Set(
  "a abbr b bdi bdo br button cite code data dfn em i img input kbd label mark meter output progress q s samp select small span strong sub sup time u var wbr del ins svg math".split(" "),
);
/** Start tags that implicitly close an open <p>. */
const CLOSES_P = new Set("address article aside blockquote details div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul".split(" "));
const AUTO_CLOSE: Record<string, string[]> = {
  li: ["li"],
  dt: ["dt", "dd"],
  dd: ["dt", "dd"],
  option: ["option"],
  tr: ["tr", "td", "th"],
  td: ["td", "th"],
  th: ["td", "th"],
  thead: ["tbody", "tfoot"],
  tbody: ["thead", "tbody", "tfoot"],
  tfoot: ["thead", "tbody"],
};

type Tok =
  | { t: "text"; v: string; line: number }
  | { t: "comment"; v: string; line: number }
  | { t: "doctype"; v: string; line: number }
  | { t: "open"; name: string; attrs: string[]; selfClose: boolean; line: number; raw?: string }
  | { t: "close"; name: string; line: number };

export interface Issue {
  line: number;
  message: string;
}

function lineAt(src: string, pos: number, cache: number[]) {
  // cache holds positions of newlines
  let lo = 0;
  let hi = cache.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cache[mid] < pos) lo = mid + 1;
    else hi = mid;
  }
  return lo + 1;
}

/** Splits an attribute string into individual attributes, respecting quotes. */
function splitAttrs(s: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let a = "";
    while (i < s.length && !/[\s=]/.test(s[i])) a += s[i++];
    let j = i;
    while (j < s.length && /\s/.test(s[j])) j++;
    if (s[j] === "=") {
      i = j + 1;
      while (i < s.length && /\s/.test(s[i])) i++;
      const q = s[i];
      if (q === '"' || q === "'") {
        const end = s.indexOf(q, i + 1);
        const stop = end < 0 ? s.length : end + 1;
        a += "=" + s.slice(i, stop);
        i = stop;
      } else {
        let v = "";
        while (i < s.length && !/\s/.test(s[i])) v += s[i++];
        a += "=" + v;
      }
    }
    if (a) out.push(a);
  }
  return out;
}

export function tokenize(src: string): { tokens: Tok[]; issues: Issue[] } {
  const nl: number[] = [];
  for (let i = 0; i < src.length; i++) if (src.charCodeAt(i) === 10) nl.push(i);
  const L = (p: number) => lineAt(src, p, nl);
  const tokens: Tok[] = [];
  const issues: Issue[] = [];
  let i = 0;
  let textStart = 0;
  const flushText = (end: number) => {
    if (end > textStart) tokens.push({ t: "text", v: src.slice(textStart, end), line: L(textStart) });
  };
  while (i < src.length) {
    if (src[i] !== "<") {
      i++;
      continue;
    }
    const rest = src.slice(i, i + 9);
    if (rest.startsWith("<!--")) {
      flushText(i);
      const end = src.indexOf("-->", i + 4);
      if (end < 0) {
        issues.push({ line: L(i), message: "Unclosed comment — “-->” is missing." });
        tokens.push({ t: "comment", v: src.slice(i), line: L(i) });
        i = textStart = src.length;
        break;
      }
      tokens.push({ t: "comment", v: src.slice(i, end + 3), line: L(i) });
      i = textStart = end + 3;
      continue;
    }
    if (/^<!doctype/i.test(rest) || rest.startsWith("<![CDATA[")) {
      flushText(i);
      const end = src.indexOf(">", i);
      const stop = end < 0 ? src.length : end + 1;
      tokens.push({ t: "doctype", v: src.slice(i, stop), line: L(i) });
      i = textStart = stop;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][\w:-]*)/.exec(src.slice(i, i + 64));
    if (!m) {
      i++;
      continue; // a literal "<" in text
    }
    flushText(i);
    // Find the end of the tag, skipping quoted attribute values.
    let j = i + m[0].length;
    let q: string | null = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (q) {
        if (c === q) q = null;
      } else if (c === '"' || c === "'") q = c;
      else if (c === ">") break;
      else if (c === "<" && !q) {
        break;
      }
    }
    const name = m[2].toLowerCase();
    if (j >= src.length || src[j] !== ">") {
      issues.push({ line: L(i), message: `Tag <${m[1]}${m[2]}> is never closed with “>”.` });
    }
    const inner = src.slice(i + m[0].length, j);
    const tagEnd = src[j] === ">" ? j + 1 : j;
    if (m[1]) {
      tokens.push({ t: "close", name, line: L(i) });
      i = textStart = tagEnd;
      continue;
    }
    const selfClose = /\/\s*$/.test(inner);
    const attrs = splitAttrs(inner.replace(/\/\s*$/, ""));
    const seen = new Set<string>();
    for (const a of attrs) {
      const n = a.split("=")[0].toLowerCase();
      if (seen.has(n)) issues.push({ line: L(i), message: `Duplicate attribute “${n}” on <${name}>.` });
      seen.add(n);
    }
    const tok: Tok = { t: "open", name, attrs, selfClose, line: L(i) };
    tokens.push(tok);
    i = textStart = tagEnd;
    if (RAW.has(name) && !selfClose) {
      const close = new RegExp(`</${name}\\s*>`, "i").exec(src.slice(i));
      const end = close ? i + close.index : src.length;
      tok.raw = src.slice(i, end);
      if (!close) issues.push({ line: tok.line, message: `<${name}> opened on line ${tok.line} is never closed.` });
      else tokens.push({ t: "close", name, line: L(end) });
      i = textStart = close ? end + close[0].length : src.length;
    }
  }
  flushText(src.length);
  return { tokens, issues };
}

interface El {
  kind: "el";
  name: string;
  attrs: string[];
  children: Node[];
  line: number;
  raw?: string;
  isVoid: boolean;
}
type Node = El | { kind: "text"; v: string } | { kind: "comment"; v: string } | { kind: "doctype"; v: string };

/** Builds a tree with HTML-like implicit closes, and records structural issues. */
export function buildTree(src: string): { root: El; issues: Issue[] } {
  const { tokens, issues } = tokenize(src);
  const root: El = { kind: "el", name: "#root", attrs: [], children: [], line: 0, isVoid: false };
  const stack: El[] = [root];
  const top = () => stack[stack.length - 1];
  for (const tk of tokens) {
    if (tk.t === "text") top().children.push({ kind: "text", v: tk.v });
    else if (tk.t === "comment") top().children.push({ kind: "comment", v: tk.v });
    else if (tk.t === "doctype") top().children.push({ kind: "doctype", v: tk.v });
    else if (tk.t === "open") {
      const closes = AUTO_CLOSE[tk.name];
      if (closes && closes.includes(top().name)) stack.pop();
      if (CLOSES_P.has(tk.name) && top().name === "p") stack.pop();
      const el: El = { kind: "el", name: tk.name, attrs: tk.attrs, children: [], line: tk.line, raw: tk.raw, isVoid: VOID.has(tk.name) || tk.selfClose };
      top().children.push(el);
      if (!el.isVoid && tk.raw === undefined) stack.push(el);
    } else {
      if (VOID.has(tk.name)) {
        issues.push({ line: tk.line, message: `</${tk.name}> isn't needed — <${tk.name}> is a void element.` });
        continue;
      }
      if (RAW.has(tk.name) && top().name !== tk.name) continue; // raw elements were closed by the tokenizer
      const at = stack.map((e) => e.name).lastIndexOf(tk.name);
      if (at <= 0) {
        issues.push({ line: tk.line, message: `Stray closing tag </${tk.name}> — there's no open <${tk.name}>.` });
        continue;
      }
      while (stack.length - 1 > at) {
        const el = stack.pop()!;
        if (!OPTIONAL_END.has(el.name)) issues.push({ line: el.line, message: `<${el.name}> opened on line ${el.line} isn't closed before </${tk.name}> on line ${tk.line}.` });
      }
      stack.pop();
    }
  }
  while (stack.length > 1) {
    const el = stack.pop()!;
    if (!OPTIONAL_END.has(el.name)) issues.push({ line: el.line, message: `<${el.name}> opened on line ${el.line} is never closed.` });
  }
  return { root, issues: issues.sort((a, b) => a.line - b.line) };
}

const openTag = (el: El) => `<${el.name}${el.attrs.length ? " " + el.attrs.join(" ") : ""}${el.isVoid && !VOID.has(el.name) ? " /" : ""}>`;
const isInlineNode = (n: Node): boolean => n.kind === "text" || n.kind === "comment" || (n.kind === "el" && INLINE.has(n.name) && n.children.every(isInlineNode));
const collapse = (s: string) => s.replace(/\s+/g, " ");

export interface FormatOptions {
  indent: Indent;
  keepComments: boolean;
  keepBlankLines: boolean;
}

export function beautify(src: string, o: FormatOptions): string {
  const { root } = buildTree(src);
  const unit = o.indent === "tab" ? "\t" : " ".repeat(Number(o.indent));
  const lines: string[] = [];
  const pad = (d: number) => unit.repeat(d);

  const inline = (n: Node): string => {
    if (n.kind === "text") return collapse(n.v);
    if (n.kind === "comment") return o.keepComments ? n.v : "";
    if (n.kind === "doctype") return n.v;
    if (n.isVoid) return openTag(n);
    if (PRESERVE.has(n.name) || n.raw !== undefined) return `${openTag(n)}${n.raw ?? n.children.map(verbatim).join("")}</${n.name}>`;
    return `${openTag(n)}${n.children.map(inline).join("")}</${n.name}>`;
  };
  const verbatim = (n: Node): string => (n.kind === "el" ? (n.isVoid ? openTag(n) : `${openTag(n)}${n.raw ?? n.children.map(verbatim).join("")}</${n.name}>`) : n.v);

  const block = (nodes: Node[], d: number) => {
    let run: Node[] = [];
    const flush = () => {
      const text = run.map(inline).join("").replace(/^\s+|\s+$/g, "");
      if (text) lines.push(pad(d) + text);
      run = [];
    };
    for (const n of nodes) {
      if (n.kind === "text" && !n.v.trim()) {
        if (o.keepBlankLines && /\n[^\S\n]*\n/.test(n.v) && !run.length && lines.length && lines[lines.length - 1] !== "") {
          flush();
          lines.push("");
        } else if (run.length) run.push(n);
        continue;
      }
      if (n.kind === "comment" && !o.keepComments) continue;
      if (isInlineNode(n)) {
        run.push(n);
        continue;
      }
      flush();
      node(n, d);
    }
    flush();
  };

  const node = (n: Node, d: number) => {
    if (n.kind === "doctype" || n.kind === "comment") {
      lines.push(pad(d) + n.v.trim());
      return;
    }
    if (n.kind === "text") return;
    if (n.isVoid) {
      lines.push(pad(d) + openTag(n));
      return;
    }
    if (n.raw !== undefined && (n.name === "script" || n.name === "style")) {
      const body = n.raw.replace(/^\s*\n|\s+$/g, "");
      if (!body.trim()) {
        lines.push(`${pad(d)}${openTag(n)}</${n.name}>`);
        return;
      }
      // Re-indent the block, keeping its internal relative indentation.
      const ls = body.split("\n");
      const common = Math.min(...ls.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)![0].length));
      lines.push(pad(d) + openTag(n));
      for (const l of ls) lines.push(l.trim() ? pad(d + 1) + l.slice(common) : "");
      lines.push(`${pad(d)}</${n.name}>`);
      return;
    }
    if (PRESERVE.has(n.name) || n.raw !== undefined) {
      lines.push(pad(d) + verbatim(n));
      return;
    }
    const allInline = n.children.every(isInlineNode);
    if (allInline) {
      const inner = n.children.map(inline).join("").replace(/^\s+|\s+$/g, "");
      const one = `${pad(d)}${openTag(n)}${inner}</${n.name}>`;
      if (one.length <= 120 || !inner) {
        lines.push(one);
        return;
      }
    }
    lines.push(pad(d) + openTag(n));
    block(n.children, d + 1);
    lines.push(`${pad(d)}</${n.name}>`);
  };

  block(root.children, 0);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

export function minify(src: string, o: { keepComments: boolean }): string {
  const { root } = buildTree(src);
  const out: string[] = [];
  const isBlock = (n: Node | undefined) => !n || (n.kind === "el" && !isInlineNode(n)) || n.kind === "doctype";
  const emit = (nodes: Node[], parentBlock: boolean) => {
    nodes.forEach((n, i) => {
      if (n.kind === "comment") {
        if (o.keepComments || /^<!--\[if|^<!--\s*\[endif/.test(n.v)) out.push(n.v);
        return;
      }
      if (n.kind === "doctype") {
        out.push(n.v);
        return;
      }
      if (n.kind === "text") {
        let t = collapse(n.v);
        const prev = nodes[i - 1];
        const next = nodes[i + 1];
        if ((i === 0 && parentBlock) || isBlock(prev)) t = t.replace(/^ /, "");
        if ((i === nodes.length - 1 && parentBlock) || isBlock(next)) t = t.replace(/ $/, "");
        if (t) out.push(t);
        return;
      }
      if (n.isVoid) {
        out.push(openTag(n));
        return;
      }
      if (n.raw !== undefined || PRESERVE.has(n.name)) {
        out.push(`${openTag(n)}${n.raw ?? n.children.map((c) => (c.kind === "el" ? "" : c.v)).join("")}</${n.name}>`);
        if (n.raw === undefined && PRESERVE.has(n.name)) {
          // <pre> may contain markup — emit it verbatim.
          out.pop();
          const verb = (x: Node): string => (x.kind === "el" ? (x.isVoid ? openTag(x) : `${openTag(x)}${x.raw ?? x.children.map(verb).join("")}</${x.name}>`) : x.v);
          out.push(verb(n));
        }
        return;
      }
      out.push(openTag(n));
      emit(n.children, !isInlineNode(n));
      out.push(`</${n.name}>`);
    });
  };
  emit(root.children, true);
  return out.join("");
}

export function validate(src: string): Issue[] {
  return buildTree(src).issues;
}

export const bytes = (s: string) => new TextEncoder().encode(s).length;

export const HTML_SAMPLE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>ZSpace   Coffee</title>
<style>
  body { font-family: system-ui; }
</style></head>
<body><!-- Main navigation --><nav class="top"><ul><li><a href="/">Home</a></li><li><a href="/menu?item=1&amp;size=large" class="active">Menu</a></li></ul></nav>
<main><h1>Fresh   coffee,   <em>every</em> morning</h1><p>Open daily from <strong>7am</strong> to <strong>7pm</strong>.
Find us on <a href="https://example.com/map">the map</a>.</p>
<pre>  Espresso    ₹180
  Flat white  ₹220</pre>
<img src="cup.jpg" alt="A cup of coffee"><br>
<button type="button" onclick="order()">Order now</button></main>
<script>
function order() {
  alert("Thanks!");
}
</script></body></html>`;
