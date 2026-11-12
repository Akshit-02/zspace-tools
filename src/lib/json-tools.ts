/**
 * JSON validation and lossless formatting.
 *
 * Validity is decided by the browser's native JSON.parse. Formatting does NOT
 * round-trip through JSON.stringify, because that silently changes data
 * (big integers lose precision, 1.0 → 1, duplicate keys collapse, escapes are
 * rewritten). Instead a strict RFC 8259 tokenizer re-prints the original
 * tokens verbatim — only whitespace changes. The same tokenizer gives reliable
 * line/column error positions in every browser (engines' messages differ).
 */

export type Indent = "2" | "4" | "tab";

type TokType = "{" | "}" | "[" | "]" | ":" | "," | "string" | "number" | "literal";
interface Tok {
  t: TokType;
  v: string;
  pos: number;
}

export interface JsonError {
  message: string;
  /** Plain-language hint for common mistakes. */
  hint?: string;
  pos: number;
  line: number;
  column: number;
}

export interface JsonStats {
  objects: number;
  arrays: number;
  keys: number;
  depth: number;
}

export type JsonResult =
  | { ok: true; tokens: Tok[]; stats: JsonStats; warnings: string[] }
  | { ok: false; error: JsonError }
  | { ok: false; empty: true };

class Fail extends Error {
  constructor(
    message: string,
    public pos: number,
    public hint?: string,
  ) {
    super(message);
  }
}

export function lineCol(text: string, pos: number) {
  let line = 1;
  let last = -1;
  for (let i = 0; i < pos && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      last = i;
    }
  }
  return { line, column: pos - last };
}

const WS = new Set([" ", "\t", "\n", "\r"]);
const describe = (ch: string | undefined) => (ch === undefined ? "the end of the input" : ch === "\n" ? "a line break" : `"${ch}"`);

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (WS.has(c)) {
      i++;
      continue;
    }
    const start = i;
    if ("{}[]:,".includes(c)) {
      toks.push({ t: c as TokType, v: c, pos: i });
      i++;
    } else if (c === '"') {
      i++;
      while (true) {
        if (i >= n) throw new Fail("Unterminated string — a closing double quote is missing.", start, 'Every string must end with ".');
        const ch = src[i];
        if (ch === '"') break;
        if (ch === "\n" || ch === "\r") throw new Fail("Line break inside a string.", i, "Strings can't span lines. Use \\n for a line break, or close the quote.");
        if (ch.charCodeAt(0) < 0x20) throw new Fail("Unescaped control character inside a string.", i, "Tabs and other control characters must be escaped, for example \\t.");
        if (ch === "\\") {
          const e = src[i + 1];
          if (e === "u") {
            if (!/^[0-9a-fA-F]{4}$/.test(src.slice(i + 2, i + 6))) throw new Fail("Invalid \\u escape — it needs exactly four hex digits.", i);
            i += 6;
            continue;
          }
          if (e === undefined || !'"\\/bfnrt'.includes(e)) throw new Fail(`Invalid escape sequence "\\${e ?? ""}".`, i, 'Valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX.');
          i += 2;
          continue;
        }
        i++;
      }
      i++;
      toks.push({ t: "string", v: src.slice(start, i), pos: start });
    } else if (c === "-" || (c >= "0" && c <= "9")) {
      const m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i, i + 400));
      if (!m || m[0] === "-") throw new Fail("Invalid number.", i);
      const after = src[i + m[0].length];
      if (after !== undefined && /[0-9.eE]/.test(after)) {
        throw new Fail("Invalid number.", i, /^-?0\d/.test(src.slice(i, i + 3)) ? "Numbers can't have leading zeros (write 7, not 07)." : undefined);
      }
      toks.push({ t: "number", v: m[0], pos: i });
      i += m[0].length;
    } else if (/[A-Za-z_$]/.test(c)) {
      const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i, i + 100))!;
      const word = m[0];
      if (word === "true" || word === "false" || word === "null") {
        toks.push({ t: "literal", v: word, pos: i });
        i += word.length;
      } else {
        const hints: Record<string, string> = {
          undefined: "undefined isn't valid JSON. Use null instead.",
          NaN: "NaN isn't valid JSON. Use null or a string.",
          Infinity: "Infinity isn't valid JSON. Use null or a string.",
          True: "Literals are lowercase in JSON: true, false and null.",
          False: "Literals are lowercase in JSON: true, false and null.",
          None: "None isn't valid JSON (that's Python). Use null.",
          Null: "Literals are lowercase in JSON: true, false and null.",
        };
        throw new Fail(`Unexpected word "${word}".`, i, hints[word] ?? "Text values and keys must be wrapped in double quotes.");
      }
    } else if (c === "'") {
      throw new Fail("Single quotes aren't allowed.", i, "JSON strings and keys must use double quotes (\").");
    } else if (c === "/" && (src[i + 1] === "/" || src[i + 1] === "*")) {
      throw new Fail("Comments aren't allowed in JSON.", i, "Remove the comment — JSON has no comment syntax.");
    } else {
      throw new Fail(`Unexpected character ${describe(c)}.`, i);
    }
  }
  return toks;
}

/** Recursive-descent check of the token stream; returns structural stats and warnings. */
function parseTokens(toks: Tok[], srcLen: number) {
  let k = 0;
  let depth = 0;
  const stats: JsonStats = { objects: 0, arrays: 0, keys: 0, depth: 0 };
  const warnings = new Set<string>();
  const peek = () => toks[k];
  const at = () => (toks[k] ? toks[k].pos : srcLen);

  const value = (): void => {
    const tk = peek();
    if (!tk) throw new Fail("Unexpected end of input — a value is missing.", srcLen, "Check for an unfinished value or a missing closing bracket.");
    if (tk.t === "{") return object();
    if (tk.t === "[") return array();
    if (tk.t === "string" || tk.t === "literal") {
      k++;
      return;
    }
    if (tk.t === "number") {
      const n = Number(tk.v);
      if (/^-?\d+$/.test(tk.v) && !Number.isSafeInteger(n)) warnings.add("Some integers are larger than JavaScript can represent exactly. They are kept exactly as written here, but other tools may round them.");
      k++;
      return;
    }
    throw new Fail(`Expected a value but found ${describe(tk.v)}.`, tk.pos, tk.t === "," ? "There may be an extra comma." : tk.t === "}" || tk.t === "]" ? "There may be a trailing comma before this bracket." : undefined);
  };

  const enter = () => {
    depth++;
    stats.depth = Math.max(stats.depth, depth);
    if (depth > 5000) throw new Fail("Nesting is too deep to process.", at());
  };

  const object = () => {
    const open = peek();
    k++;
    enter();
    stats.objects++;
    const keys = new Set<string>();
    if (peek()?.t === "}") {
      k++;
      depth--;
      return;
    }
    for (;;) {
      const key = peek();
      if (!key) throw new Fail("Unclosed object — a closing } is missing.", open.pos, "Add } to close the object that starts here.");
      if (key.t !== "string") {
        throw new Fail(
          key.t === "}" ? "Trailing comma before }." : `Expected a property name in double quotes but found ${describe(key.v)}.`,
          key.pos,
          key.t === "}" ? "Remove the comma after the last property." : "Property names must be strings in double quotes.",
        );
      }
      if (keys.has(key.v)) warnings.add(`Duplicate key ${key.v}. It's allowed, but most parsers keep only the last value.`);
      keys.add(key.v);
      stats.keys++;
      k++;
      const colon = peek();
      if (colon?.t !== ":") throw new Fail(`Expected ":" after the property name but found ${describe(colon?.v)}.`, at(), "Each property needs a colon between its name and value.");
      k++;
      value();
      const sep = peek();
      if (sep?.t === ",") {
        k++;
        continue;
      }
      if (sep?.t === "}") {
        k++;
        depth--;
        return;
      }
      if (!sep) throw new Fail("Unclosed object — a closing } is missing.", open.pos, "Add } to close the object that starts here.");
      throw new Fail(`Expected "," or "}" but found ${describe(sep.v)}.`, sep.pos, sep.t === "string" ? "A comma is probably missing between two properties." : sep.t === "]" ? "Brackets don't match — this object was opened with {." : undefined);
    }
  };

  const array = () => {
    const open = peek();
    k++;
    enter();
    stats.arrays++;
    if (peek()?.t === "]") {
      k++;
      depth--;
      return;
    }
    for (;;) {
      if (peek()?.t === "]") throw new Fail("Trailing comma before ].", peek().pos, "Remove the comma after the last item.");
      value();
      const sep = peek();
      if (sep?.t === ",") {
        k++;
        continue;
      }
      if (sep?.t === "]") {
        k++;
        depth--;
        return;
      }
      if (!sep) throw new Fail("Unclosed array — a closing ] is missing.", open.pos, "Add ] to close the array that starts here.");
      throw new Fail(`Expected "," or "]" but found ${describe(sep.v)}.`, sep.pos, sep.t === "}" ? "Brackets don't match — this array was opened with [." : "A comma is probably missing between two items.");
    }
  };

  value();
  if (k < toks.length) throw new Fail(`Unexpected ${describe(toks[k].v)} after the end of the JSON.`, toks[k].pos, "There is extra content, or several JSON values without an enclosing array.");
  return { stats, warnings: [...warnings] };
}

export function analyzeJson(text: string): JsonResult {
  if (!text.trim()) return { ok: false, empty: true };
  // 1) Native parser is the authority on validity.
  let nativeError: unknown = null;
  try {
    JSON.parse(text);
  } catch (e) {
    nativeError = e;
  }
  // 2) Strict tokenizer for lossless output, or for a precise, friendly error.
  try {
    const tokens = tokenize(text.replace(/^﻿/, ""));
    const { stats, warnings } = parseTokens(tokens, text.length);
    if (nativeError) {
      // Shouldn't happen; trust the native parser and report its message.
      return { ok: false, error: { message: String((nativeError as Error).message), pos: 0, line: 1, column: 1 } };
    }
    return { ok: true, tokens, stats, warnings };
  } catch (e) {
    if (!(e instanceof Fail)) throw e;
    const offset = text.startsWith("﻿") ? 1 : 0;
    const pos = Math.min(e.pos + offset, text.length);
    return { ok: false, error: { message: e.message, hint: e.hint, pos, ...lineCol(text, pos) } };
  }
}

/** Re-prints tokens with the chosen indentation (or none). Token text is never changed. */
export function printJson(tokens: Tok[], indent: Indent | "min") {
  const unit = indent === "min" ? "" : indent === "tab" ? "\t" : " ".repeat(Number(indent));
  const pretty = indent !== "min";
  const out: string[] = [];
  let level = 0;
  const nl = () => (pretty ? "\n" + unit.repeat(level) : "");
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    const next = tokens[i + 1];
    switch (tk.t) {
      case "{":
      case "[":
        if (next && (next.t === "}" || next.t === "]")) {
          out.push(tk.v + next.v);
          i++;
        } else {
          level++;
          out.push(tk.v + nl());
        }
        break;
      case "}":
      case "]":
        level--;
        out.push(nl() + tk.v);
        break;
      case ",":
        out.push("," + nl());
        break;
      case ":":
        out.push(pretty ? ": " : ":");
        break;
      default:
        out.push(tk.v);
    }
  }
  return out.join("");
}

export const SAMPLE_JSON = `{
  "store": "ZSpace Coffee",
  "open": true,
  "rating": null,
  "location": { "city": "Bengaluru", "lat": 12.9716, "lng": 77.5946 },
  "menu": [
    { "id": 1, "item": "Flat white", "price": 220, "tags": ["hot", "milk"] },
    { "id": 2, "item": "Cold brew", "price": 260, "tags": ["cold"] }
  ],
  "orderId": 9007199254740993
}`;
