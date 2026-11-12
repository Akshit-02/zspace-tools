/**
 * Regex tester engine. Matching runs inside a short-lived Web Worker built
 * from a string (no eval of user code: the pattern is only ever passed to
 * `new RegExp`). If a pattern backtracks catastrophically, the worker is
 * terminated after a time limit so the page never freezes.
 */

export const FLAGS = [
  { f: "g", name: "Global", hint: "Find every match, not just the first." },
  { f: "i", name: "Ignore case", hint: "Treat A and a as the same letter." },
  { f: "m", name: "Multiline", hint: "^ and $ match at the start and end of each line." },
  { f: "s", name: "Dot all", hint: "Let . match line breaks too." },
  { f: "u", name: "Unicode", hint: "Handle emoji and other astral characters correctly; enables \\p{…}." },
  { f: "y", name: "Sticky", hint: "Match only at the exact position where the last match ended." },
] as const;

export const MAX_INPUT = 200_000;
export const MAX_MATCHES = 5_000;
export const TIMEOUT_MS = 1_500;

export interface MatchGroup {
  index: number;
  name?: string;
  value: string | undefined;
  start?: number;
  end?: number;
}
export interface Match {
  index: number;
  end: number;
  text: string;
  groups: MatchGroup[];
}
export type RegexResult =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "timeout" }
  | { status: "ok"; matches: Match[]; truncated: boolean; ms: number };

/** Validates without running anything heavy. */
export function compile(pattern: string, flags: string): { ok: true; re: RegExp } | { ok: false; message: string } {
  if (!/^[dgimsuyv]*$/.test(flags)) return { ok: false, message: `Unknown flag in "${flags}". Use g, i, m, s, u or y.` };
  if (new Set(flags).size !== flags.length) return { ok: false, message: "Each flag can only be used once." };
  try {
    return { ok: true, re: new RegExp(pattern, flags) };
  } catch (e) {
    return { ok: false, message: (e instanceof Error ? e.message : String(e)).replace(/^Invalid regular expression: /, "") };
  }
}

/**
 * Collects matches safely: zero-length matches advance the index so loops always end.
 * Must stay self-contained (no outer references) — its source is embedded in the worker.
 */
export function collect(pattern: string, flags: string, text: string, maxMatches = 5000): { matches: Match[]; truncated: boolean } {
  const withIndices = flags.includes("d") ? flags : flags + "d";
  const re = new RegExp(pattern, withIndices);
  const matches: Match[] = [];
  const global = flags.includes("g") || flags.includes("y");
  let m: RegExpExecArray | null;
  let truncated = false;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    const idx = (m as RegExpExecArray & { indices?: [number, number][] & { groups?: Record<string, [number, number] | undefined> } }).indices;
    const names = m.groups ? Object.keys(m.groups) : [];
    const groups: MatchGroup[] = [];
    for (let i = 1; i < m.length; i++) {
      const name = names.find((n) => idx?.groups?.[n] && idx[i] && idx.groups[n]![0] === idx[i][0] && idx.groups[n]![1] === idx[i][1] && m!.groups![n] === m![i]);
      groups.push({ index: i, name, value: m[i], start: idx?.[i]?.[0], end: idx?.[i]?.[1] });
    }
    matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups });
    if (!global) break;
    if (m[0] === "") re.lastIndex = re.lastIndex + (flags.includes("u") && (text.codePointAt(re.lastIndex) ?? 0) > 0xffff ? 2 : 1);
    if (matches.length >= maxMatches) {
      truncated = true;
      break;
    }
  }
  return { matches, truncated };
}

/** Worker source: only receives strings and calls the same logic. */
const WORKER_SRC = `
const collect = (${collect.toString()});
self.onmessage = (e) => {
  const { pattern, flags, text } = e.data;
  const t0 = performance.now();
  try {
    const r = collect(pattern, flags, text, ${MAX_MATCHES});
    self.postMessage({ status: "ok", matches: r.matches, truncated: r.truncated, ms: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ status: "error", message: String(err && err.message || err) });
  }
};`;

let workerUrl: string | null = null;

/** Runs the match in a fresh worker; terminates it after TIMEOUT_MS. */
export function runInWorker(pattern: string, flags: string, text: string): { promise: Promise<RegexResult>; cancel: () => void } {
  if (!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
  const w = new Worker(workerUrl);
  let done = false;
  let cancel = () => {};
  const promise = new Promise<RegexResult>((resolve) => {
    const finish = (r: RegexResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      w.terminate();
      resolve(r);
    };
    const timer = setTimeout(() => finish({ status: "timeout" }), TIMEOUT_MS);
    cancel = () => finish({ status: "empty" });
    w.onmessage = (e: MessageEvent<RegexResult>) => finish(e.data);
    w.onerror = () => finish({ status: "error", message: "The pattern couldn't be run." });
    w.postMessage({ pattern, flags, text });
  });
  return { promise, cancel: () => cancel() };
}

export interface Example {
  id: string;
  label: string;
  pattern: string;
  flags: string;
  sample: string;
  explain: string;
}

/** Illustrative patterns — not complete validators for every real-world format. */
export const EXAMPLES: Example[] = [
  { id: "email", label: "Email", pattern: String.raw`[\w.+-]+@[\w-]+(?:\.[\w-]+)+`, flags: "g", sample: "Write to hello@zspace.example or sales.team+in@mail.co.uk", explain: "One or more word characters, dots, + or -; an @; then a domain with at least one dot." },
  { id: "phone", label: "Phone", pattern: String.raw`\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}`, flags: "g", sample: "Call +91 98765 43210, (020) 7946 0000 or +1-415-555-0132.", explain: "Optional + and country code, an optional area code in brackets, then two or three digit groups separated by spaces or dashes." },
  { id: "url", label: "URL", pattern: String.raw`https?:\/\/[\w.-]+(?:\.[a-z]{2,})(?:[\/?#][^\s]*)?`, flags: "gi", sample: "Docs at https://tools.zspace.example/regex-tester/?q=1 and http://example.org.", explain: "http or https, ://, a host name with a dot, then an optional path, query or fragment up to the next space." },
  { id: "numbers", label: "Numbers only", pattern: String.raw`^\d+$`, flags: "gm", sample: "12345\n12a45\n007", explain: "^ and $ anchor to each line (m flag); \\d+ allows only digits." },
  { id: "letters", label: "Letters only", pattern: String.raw`^\p{L}+$`, flags: "gmu", sample: "Hello\nCafé\nR2D2\nनमस्ते", explain: "\\p{L} matches a letter in any script (needs the u flag)." },
  { id: "alnum", label: "Alphanumeric", pattern: String.raw`^[A-Za-z0-9]+$`, flags: "gm", sample: "abc123\nabc-123\nXYZ", explain: "Only ASCII letters and digits from start to end of the line." },
  { id: "space", label: "Whitespace", pattern: String.raw`\s{2,}`, flags: "g", sample: "Too  many   spaces\there.", explain: "Two or more whitespace characters in a row — handy for finding double spaces." },
  { id: "date", label: "Date (YYYY-MM-DD)", pattern: String.raw`\b(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\d|3[01])\b`, flags: "g", sample: "Due 2026-11-12, shipped 2026-13-01 (invalid month), paid 2027-02-28.", explain: "Named groups capture year, month (01–12) and day (01–31). It doesn't know month lengths — 2026-02-31 still matches." },
  { id: "pin", label: "Indian PIN code", pattern: String.raw`\b[1-9]\d{2}\s?\d{3}\b`, flags: "g", sample: "Bengaluru 560001, Mumbai 400 013, invalid 012345.", explain: "Six digits not starting with 0, with an optional space after the third digit." },
  { id: "password", label: "Password rule", pattern: String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{12,}$`, flags: "gm", sample: "weakpass\nStr0ng!Passw0rd\nNoSymbols12345", explain: "Lookaheads require a lowercase letter, an uppercase letter, a digit and a symbol, with at least 12 characters." },
];
