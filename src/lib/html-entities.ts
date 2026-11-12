/**
 * HTML entity encoding/decoding. Decoding follows the WHATWG HTML spec via the
 * `entities` package (all 2,231 named references, legacy semicolon-less names,
 * numeric references with the spec's replacement rules). Output is only ever
 * shown as text — nothing here produces DOM.
 */
import { decodeHTML, decodeHTMLStrict, encodeHTML } from "entities";

export type EntityFormat = "named" | "decimal" | "hex";
export type EncodeScope = "special" | "nonascii";

export interface EncodeOptions {
  scope: EncodeScope;
  format: EntityFormat;
  quotes: boolean;
  preserve: boolean;
}

export const DEFAULT_ENCODE: EncodeOptions = { scope: "special", format: "named", quotes: true, preserve: false };
export const MAX_TEXT = 5 * 1024 * 1024;

/** Familiar names for characters where the spec table lists several aliases. */
const PREFERRED: Record<number, string> = {
  0x22: "&quot;",
  0x26: "&amp;",
  0x3c: "&lt;",
  0x3e: "&gt;",
  0xa0: "&nbsp;",
  0xa9: "&copy;",
  0xae: "&reg;",
  0x2122: "&trade;",
  0x2018: "&lsquo;",
  0x2019: "&rsquo;",
  0x201c: "&ldquo;",
  0x201d: "&rdquo;",
  0x2013: "&ndash;",
  0x2014: "&mdash;",
  0x2026: "&hellip;",
  0x2022: "&bull;",
  0x20ac: "&euro;",
  0xa3: "&pound;",
  0xa5: "&yen;",
  0xa2: "&cent;",
  0xb0: "&deg;",
  0xb1: "&plusmn;",
  0xd7: "&times;",
  0xf7: "&divide;",
  0x2192: "&rarr;",
  0x2190: "&larr;",
  0xab: "&laquo;",
  0xbb: "&raquo;",
  0xa7: "&sect;",
  0xb6: "&para;",
};

const numeric = (cp: number, format: EntityFormat) => (format === "hex" ? `&#x${cp.toString(16).toUpperCase()};` : `&#${cp};`);

function named(ch: string, cp: number): string | null {
  if (PREFERRED[cp]) return PREFERRED[cp];
  const e = encodeHTML(ch);
  return e.startsWith("&") && !e.startsWith("&#") ? e : null;
}

/** Matches a complete, valid-looking character reference at the start of a string. */
const REF = /^&(?:#[0-9]{1,7};|#[xX][0-9a-fA-F]{1,6};|[A-Za-z][A-Za-z0-9]{1,31};)/;

function isValidRef(s: string) {
  const m = REF.exec(s);
  return !!m && decodeHTMLStrict(m[0]) !== m[0] ? m[0] : null;
}

export function encodeEntities(input: string, o: EncodeOptions): { output: string; count: number } {
  let out = "";
  let count = 0;
  for (let i = 0; i < input.length; ) {
    const cp = input.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const step = ch.length;
    if (cp === 0x26 && o.preserve) {
      const ref = isValidRef(input.slice(i, i + 40));
      if (ref) {
        out += ref;
        i += ref.length;
        continue;
      }
    }
    const special = cp === 0x26 || cp === 0x3c || cp === 0x3e || (o.quotes && (cp === 0x22 || cp === 0x27));
    const encode = special || (o.scope === "nonascii" && cp > 0x7e);
    if (!encode) {
      out += ch;
    } else {
      count++;
      if (cp === 0x27) out += o.format === "hex" ? "&#x27;" : "&#39;"; // &apos; is HTML5-only
      else if (o.format === "named") out += named(ch, cp) ?? numeric(cp, "hex");
      else out += numeric(cp, o.format);
    }
    i += step;
  }
  return { output: out, count };
}

export interface DecodeIssue {
  index: number;
  ref: string;
  kind: "unknown" | "no-semicolon" | "invalid-codepoint";
  message: string;
}

const CANDIDATE = /&(#[0-9]+;?|#[xX][0-9a-fA-F]+;?|#[xX]?|[A-Za-z][A-Za-z0-9]*;?)/g;

export function decodeEntities(input: string): { output: string; count: number; issues: DecodeIssue[] } {
  const issues: DecodeIssue[] = [];
  let count = 0;
  for (const m of input.matchAll(CANDIDATE)) {
    const ref = m[0];
    const body = m[1];
    const index = m.index!;
    if (body.startsWith("#")) {
      const hex = /^#[xX]/.test(body);
      const digits = body.replace(/^#[xX]?/, "").replace(/;$/, "");
      if (!digits) {
        issues.push({ index, ref, kind: "unknown", message: `“${ref}” has no digits, so it stays as text.` });
        continue;
      }
      count++;
      const cp = parseInt(digits, hex ? 16 : 10);
      if (!body.endsWith(";")) issues.push({ index, ref, kind: "no-semicolon", message: `“${ref}” is missing its semicolon. Browsers still decode it, but it's an error.` });
      if (cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
        issues.push({ index, ref, kind: "invalid-codepoint", message: `“${ref}” isn't a valid Unicode character, so it decodes to the replacement character �.` });
      else if (cp >= 0x80 && cp <= 0x9f)
        issues.push({ index, ref, kind: "invalid-codepoint", message: `“${ref}” is a control code; browsers map it to the Windows-1252 character instead.` });
    } else if (body.endsWith(";")) {
      if (decodeHTMLStrict(ref) === ref) issues.push({ index, ref, kind: "unknown", message: `“${ref}” isn't a known HTML entity, so it stays as text.` });
      else count++;
    } else {
      const decoded = decodeHTML(ref);
      if (decoded !== ref) {
        count++;
        issues.push({ index, ref, kind: "no-semicolon", message: `“${ref}” has no semicolon; browsers read it as a legacy entity (→ “${decoded}”). Add “;” or write “&amp;” if you meant a literal &.` });
      }
    }
  }
  return { output: decodeHTML(input), count, issues };
}

export const ENTITY_SAMPLE = `Tom & Jerry < Special Characters >
"Quotes" and 'apostrophes' — café, naïve, ₹1,999 © 2026
Emoji: 😀  Arrows: → ←  Maths: 5 × 3 ÷ 2 ≠ 7`;

export const DECODE_SAMPLE = `Tom &amp; Jerry &lt; Special Characters &gt;
&quot;Quotes&quot; &amp; &#39;apostrophes&#39; &mdash; caf&eacute; &#8377;1,999 &copy; 2026
Emoji: &#x1F600; &nbsp;Unknown: &zzz; Missing semicolon: &copy 2026`;
