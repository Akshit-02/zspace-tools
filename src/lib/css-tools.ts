/**
 * CSS minify / beautify.
 * - Minify: csso (built on the css-tree parser) with restructuring OFF, so rules
 *   are never merged or reordered — only safe, semantics-preserving rewrites.
 * - Beautify and "keep all comments" minify: a character-level tokenizer that
 *   understands strings, comments, url(…) and nested brackets (not regex rewriting).
 * - Checks: css-tree's tolerant parser reports syntax errors with line numbers.
 */

export type Indent = "2" | "4" | "tab";
export type CommentMode = "license" | "all" | "none";

type Tok = { t: "ws" | "comment" | "string" | "url" | "{" | "}" | ";" | ":" | "," | "(" | ")" | "other"; v: string };

export function tokenize(css: string): { tokens: Tok[]; unclosed: string | null } {
  const tokens: Tok[] = [];
  let i = 0;
  let unclosed: string | null = null;
  const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      if (end < 0) unclosed = "A comment is never closed (missing */).";
      tokens.push({ t: "comment", v: css.slice(i, stop) });
      i = stop;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c && css[j] !== "\n") j += css[j] === "\\" ? 2 : 1;
      if (j >= n || css[j] !== c) unclosed = "A quoted string is never closed.";
      tokens.push({ t: "string", v: css.slice(i, Math.min(j + 1, n)) });
      i = j + 1;
    } else if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(css[j])) j++;
      tokens.push({ t: "ws", v: css.slice(i, j) });
      i = j;
    } else if (/^url\(/i.test(css.slice(i, i + 4)) && !/["']/.test(css.slice(i + 4).trimStart()[0] ?? "")) {
      const end = css.indexOf(")", i);
      const stop = end < 0 ? n : end + 1;
      tokens.push({ t: "url", v: css.slice(i, stop) });
      i = stop;
    } else if ("{};:,()".includes(c)) {
      tokens.push({ t: c as Tok["t"], v: c });
      i++;
    } else {
      let j = i;
      while (j < n && !/[\s{};:,()"'/]/.test(css[j]) && !(css[j] === "/" && css[j + 1] === "*")) j++;
      if (j === i) j++; // lone "/" etc.
      tokens.push({ t: "other", v: css.slice(i, j) });
      i = j;
    }
  }
  return { tokens, unclosed };
}

const isLicense = (c: string) => c.startsWith("/*!") || /@license|@preserve/i.test(c);

/** Pretty-prints CSS from tokens. Comments are kept unless `keepComments` is false. */
export function beautify(css: string, indent: Indent, keepComments = true): string {
  const unit = indent === "tab" ? "\t" : " ".repeat(Number(indent));
  const { tokens } = tokenize(css.replace(/^﻿/, ""));
  let out = "";
  let depth = 0;
  let paren = 0;
  let line = "";
  const lines: string[] = [];
  const push = () => {
    const t = line.trim();
    if (t) lines.push(unit.repeat(depth) + t);
    line = "";
  };
  for (let k = 0; k < tokens.length; k++) {
    const tk = tokens[k];
    switch (tk.t) {
      case "comment":
        if (!keepComments && !isLicense(tk.v)) break;
        if (paren > 0 || line.trim()) line += (line.endsWith(" ") ? "" : " ") + tk.v + " ";
        else {
          push();
          lines.push(unit.repeat(depth) + tk.v.split("\n").map((l, i) => (i ? l.replace(/^\s*/, " ") : l)).join("\n" + unit.repeat(depth)));
        }
        break;
      case "ws":
        if (line && !line.endsWith(" ") && !line.endsWith("(")) line += " ";
        break;
      case "{":
        line = line.trimEnd() + " {";
        push();
        depth++;
        break;
      case "}":
        push();
        depth = Math.max(0, depth - 1);
        lines.push(unit.repeat(depth) + "}");
        if (depth === 0) lines.push("");
        break;
      case ";":
        if (paren > 0) line += ";";
        else {
          line = line.trimEnd() + ";";
          push();
        }
        break;
      case ":": {
        // Declarations get "prop: value"; selectors (a:hover, ::before) stay tight.
        const prev = tokens[k - 1];
        const inDeclaration = depth > 0 && paren === 0 && /^-{0,2}[\w-]+$/.test(line.trim()) && !line.trim().startsWith("&");
        line = line.trimEnd() + ":";
        if (inDeclaration && prev?.t !== ":" && tokens[k + 1]?.t !== ":") line += " ";
        break;
      }
      case ",":
        line = line.trimEnd() + (paren === 0 && depth === 0 ? ",\n" : ", ");
        break;
      case "(":
        paren++;
        line += "(";
        break;
      case ")":
        paren = Math.max(0, paren - 1);
        line = line.trimEnd() + ")";
        break;
      default:
        // csso may emit "url(x)no-repeat"; re-insert the space inside declaration values only
        // (in selectors ":not(.a).b" must stay tight).
        if (line.endsWith(")") && paren === 0 && /^\s*-{0,2}[\w-]+: /.test(line) && tk.t !== "string") line += " ";
        line += tk.v;
    }
  }
  push();
  out = lines.join("\n");
  // Split top-level selector lists that were joined with ",\n" onto separate indented lines.
  out = out.replace(/,\n\s*/g, ",\n");
  return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** Whitespace-only minify that keeps every comment (used when the user asks to keep all comments). */
export function minifyKeepComments(css: string): string {
  const { tokens } = tokenize(css);
  let out = "";
  // Only punctuation where surrounding whitespace never matters. "+", "-", ">" and ")" are
  // left alone: calc()/clamp() need spaces around + and -, media queries need ") and (".
  const tight = /[{};,(]$/;
  let depth = 0;
  for (let k = 0; k < tokens.length; k++) {
    const tk = tokens[k];
    if (tk.t === "{") depth++;
    if (tk.t === "}") depth = Math.max(0, depth - 1);
    if (tk.t === "ws") {
      const next = tokens[k + 1];
      if (!out || tight.test(out) || !next || "{};,)".includes(next.v[0] ?? "") || next.t === "comment") continue;
      // "color : red" → "color:red" (declaration only; ".a :hover" in a selector is meaningful).
      if (next.t === ":" && depth > 0 && /[{;]-{0,2}[\w-]+$/.test(out)) continue;
      if (out.endsWith(":") && depth > 0 && /[{;]-{0,2}[\w-]+:$/.test(out)) continue;
      // Keep a space where it matters (descendant selectors, values like "1px solid").
      out += " ";
    } else out += tk.v;
  }
  return out.replace(/;}/g, "}").trim();
}

/** Inserts or removes the final semicolon before each "}" — token-aware, so strings are safe. */
export function setFinalSemicolon(css: string, keep: boolean): string {
  const { tokens } = tokenize(css);
  const out: string[] = [];
  for (let k = 0; k < tokens.length; k++) {
    const tk = tokens[k];
    if (tk.t === "}") {
      let j = out.length - 1;
      while (j >= 0 && /^\s*$/.test(out[j])) j--;
      const last = out[j];
      if (keep && last !== ";" && last !== "{" && last !== "}" && j >= 0) out.splice(j + 1, 0, ";");
      if (!keep && last === ";") out.splice(j, 1);
    }
    out.push(tk.v);
  }
  return out.join("");
}

export interface CssIssue {
  line: number;
  message: string;
}

export interface MinifyResult {
  css: string;
  issues: CssIssue[];
}

/** Minifies with csso (no restructuring) and reports parse errors. */
export async function minifyCss(css: string, opts: { comments: CommentMode; keepFinalSemicolon: boolean }): Promise<MinifyResult> {
  const issues = await checkCss(css);
  let out: string;
  if (opts.comments === "all") out = minifyKeepComments(css);
  else {
    const csso = await import("csso");
    out = csso.minify(css, { restructure: false, comments: opts.comments === "license" ? "exclamation" : false }).css;
  }
  if (opts.keepFinalSemicolon) out = setFinalSemicolon(out, true);
  return { css: out, issues };
}

export async function checkCss(css: string): Promise<CssIssue[]> {
  const issues: CssIssue[] = [];
  const { unclosed } = tokenize(css);
  if (unclosed) issues.push({ line: 0, message: unclosed });
  let depth = 0;
  for (const tk of tokenize(css).tokens) {
    if (tk.t === "{") depth++;
    if (tk.t === "}") depth--;
    if (depth < 0) {
      issues.push({ line: 0, message: "There's a “}” without a matching “{”." });
      depth = 0;
    }
  }
  if (depth > 0) issues.push({ line: 0, message: `${depth} block${depth === 1 ? " is" : "s are"} missing a closing “}”.` });
  try {
    const csso = (await import("csso")) as unknown as { syntax: { parse: (s: string, o: object) => unknown } };
    csso.syntax.parse(css, {
      positions: true,
      onParseError: (e: { message: string; line?: number }) => issues.push({ line: e.line ?? 0, message: e.message }),
    });
  } catch (e) {
    issues.push({ line: 0, message: e instanceof Error ? e.message : String(e) });
  }
  const seen = new Set<string>();
  return issues.filter((i) => (seen.has(i.message + i.line) ? false : (seen.add(i.message + i.line), true))).slice(0, 20);
}

export const bytes = (s: string) => new TextEncoder().encode(s).length;

export const CSS_SAMPLE = `/*! ZSpace theme v2 | MIT licence */
:root {
  --brand:   #F07845;
  --space:   clamp( 1rem , 2vw + .5rem , 2rem );
}

/* Card component */
.card   >   .title , .card:hover::after {
  color : var( --brand ) ;
  margin : 0px 0px 0px 0px ;
  background : url( "img/bg.png" ) no-repeat , linear-gradient( to right , #fff 0% , #F2ECE3 100% ) ;
  content : "a } b" ;
}

@media (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  .card { transition : transform 200ms cubic-bezier( .22 , 1 , .36 , 1 ) ; }
}

@keyframes fade-in { from { opacity : 0 } to { opacity : 1 } }

.grid { display: grid; grid-template-columns: repeat( auto-fit , minmax( 12rem , 1fr ) ); }
`;
