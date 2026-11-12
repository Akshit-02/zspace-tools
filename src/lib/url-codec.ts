/**
 * URL encoding / decoding with the four standard functions and precise,
 * human-readable errors. Nothing is changed beyond what the chosen function does.
 */

export type UrlMode = "encodeURI" | "encodeURIComponent" | "decodeURI" | "decodeURIComponent";

export interface UrlResult {
  ok: true;
  output: string;
  /** Number of characters that changed form. */
  changes: number;
  notes: string[];
}
export interface UrlError {
  ok: false;
  message: string;
  /** 0-based index of the offending sequence, if known. */
  index?: number;
}

const PCT = /%[0-9A-Fa-f]{2}/;

/** Finds the first malformed percent sequence or invalid UTF-8 byte run. */
export function findMalformed(input: string): { index: number; reason: string } | null {
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== "%") continue;
    const hex = input.slice(i + 1, i + 3);
    if (!/^[0-9A-Fa-f]{2}$/.test(hex)) return { index: i, reason: `"%${hex}" isn't a valid percent sequence — % must be followed by two hex digits (0–9, A–F).` };
    // Validate the UTF-8 run starting here.
    const lead = parseInt(hex, 16);
    const need = lead < 0x80 ? 0 : lead >= 0xc2 && lead <= 0xdf ? 1 : lead >= 0xe0 && lead <= 0xef ? 2 : lead >= 0xf0 && lead <= 0xf4 ? 3 : -1;
    if (need < 0) return { index: i, reason: `"%${hex}" can't start a UTF-8 character.` };
    for (let k = 1; k <= need; k++) {
      const seq = input.slice(i + k * 3, i + k * 3 + 3);
      if (!/^%[89ABab][0-9A-Fa-f]$/.test(seq)) return { index: i, reason: `"${input.slice(i, i + (need + 1) * 3)}" is an incomplete or invalid UTF-8 sequence.` };
    }
    i += need * 3 + 2;
  }
  return null;
}

export function convertUrl(input: string, mode: UrlMode, opts: { plusAsSpace?: boolean } = {}): UrlResult | UrlError {
  const notes: string[] = [];
  try {
    if (mode === "encodeURI" || mode === "encodeURIComponent") {
      if (PCT.test(input)) notes.push("The input already contains percent-encoded sequences (like %20). Encoding again turns each % into %25 — decode first if you didn't mean to double-encode.");
      const output = mode === "encodeURI" ? encodeURI(input) : encodeURIComponent(input);
      if (mode === "encodeURI" && /[&=?#]/.test(input) && !/^[a-z][\w+.-]*:/i.test(input.trim())) {
        notes.push("encodeURI keeps & = ? # / : unchanged. To encode a single parameter value safely, use Encode component.");
      }
      return { ok: true, output, changes: countChanges(input, output), notes };
    }
    const src = opts.plusAsSpace ? input.replace(/\+/g, " ") : input;
    const bad = findMalformed(src);
    if (bad) return { ok: false, message: bad.reason, index: bad.index };
    const output = mode === "decodeURI" ? decodeURI(src) : decodeURIComponent(src);
    if (mode === "decodeURI" && /%(2[346BCFbcf]|3[ABDFabdf]|40)/.test(src)) {
      notes.push("decodeURI leaves reserved characters such as %2F (/), %3F (?) and %26 (&) encoded, so the URL structure isn't changed. Use Decode component to decode everything.");
    }
    if (PCT.test(output)) notes.push("The result still contains percent sequences — the text may have been encoded twice. Decode it again if needed.");
    if (!opts.plusAsSpace && input.includes("+")) notes.push('Plus signs were kept as "+". In form data (application/x-www-form-urlencoded) "+" means a space — turn on "+ means space" if so.');
    return { ok: true, output, changes: countChanges(output, input), notes };
  } catch (e) {
    if (e instanceof URIError) {
      return { ok: false, message: mode.startsWith("encode") ? "The text contains an unpaired surrogate character that can't be encoded as UTF-8." : "The input isn't valid percent-encoded text." };
    }
    throw e;
  }
}

function countChanges(a: string, encoded: string) {
  return (encoded.match(/%[0-9A-Fa-f]{2}/g) ?? []).length - (a.match(/%[0-9A-Fa-f]{2}/g) ?? []).length;
}

export const URL_EXAMPLES = {
  encode: "https://example.com/search?q=café & bakery&city=Dubaï #top",
  component: "rock & roll / 100% fun? ✓",
  decode: "https://example.com/search?q=caf%C3%A9%20%26%20bakery&tag=%F0%9F%8D%B0",
};

/* ---------------- Query-parameter helper ---------------- */

export interface QueryParam {
  key: string;
  value: string;
  /** True if the original text had a malformed %-sequence and was kept as typed. */
  raw?: boolean;
}

export interface ParsedUrl {
  base: string;
  params: QueryParam[];
  hash: string;
}

function lenientDecode(s: string): { text: string; raw: boolean } {
  const plus = s.replace(/\+/g, " "); // in query strings "+" means space (form encoding)
  try {
    return { text: decodeURIComponent(plus), raw: false };
  } catch {
    return { text: plus, raw: true };
  }
}

/** Splits a URL (or bare query string) into base, ordered params (repeated keys kept) and hash. */
export function parseQuery(input: string): ParsedUrl {
  let s = input.trim();
  let hash = "";
  const h = s.indexOf("#");
  if (h >= 0) {
    hash = s.slice(h);
    s = s.slice(0, h);
  }
  const q = s.indexOf("?");
  const base = q >= 0 ? s.slice(0, q) : s.includes("=") && !s.includes("/") ? "" : s;
  const query = q >= 0 ? s.slice(q + 1) : base === "" ? s : "";
  const params: QueryParam[] = [];
  for (const part of query.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const k = lenientDecode(eq >= 0 ? part.slice(0, eq) : part);
    const v = lenientDecode(eq >= 0 ? part.slice(eq + 1) : "");
    params.push({ key: k.text, value: v.text, raw: k.raw || v.raw || undefined });
  }
  return { base, params, hash };
}

/** Rebuilds a URL, encoding each key and value exactly once. */
export function buildQuery(p: ParsedUrl): string {
  const q = p.params
    .filter((x) => x.key !== "" || x.value !== "")
    .map((x) => `${encodeURIComponent(x.key)}${x.value !== "" || x.key === "" ? `=${encodeURIComponent(x.value)}` : "="}`)
    .join("&");
  return `${p.base}${q ? `?${q}` : ""}${p.hash}`;
}
