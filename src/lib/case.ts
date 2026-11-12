/** Text case conversions. Pure, Unicode-aware, no network. */

export type CaseMode =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "capitalized"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "dot"
  | "path"
  | "alternating"
  | "inverse";

export interface CaseDef {
  id: CaseMode;
  label: string;
  example: string;
  description: string;
  /** Programming styles join words per line. */
  code?: boolean;
}

export const CASES: CaseDef[] = [
  { id: "upper", label: "UPPERCASE", example: "LESS EFFORT, MORE DONE", description: "Every letter capitalised. Good for headings, labels and emphasis." },
  { id: "lower", label: "lowercase", example: "less effort, more done", description: "Every letter in small letters. Handy for tidying text typed with Caps Lock." },
  { id: "title", label: "Title Case", example: "The Art of Getting Things Done", description: "Major words capitalised; short articles, conjunctions and prepositions stay lowercase unless first or last. Acronyms like NASA and brand names like iPhone are kept." },
  { id: "sentence", label: "Sentence case", example: "Less effort. More done.", description: "First letter of each sentence capitalised, the rest lowercase. Acronyms in all caps are kept." },
  { id: "capitalized", label: "Capitalized Case", example: "Less Effort, More Done", description: "The first letter of every word capitalised, including short words." },
  { id: "camel", label: "camelCase", example: "lessEffortMoreDone", description: "Words joined, first word lowercase, later words capitalised. Common for JavaScript variables.", code: true },
  { id: "pascal", label: "PascalCase", example: "LessEffortMoreDone", description: "Words joined, every word capitalised. Common for class and component names.", code: true },
  { id: "snake", label: "snake_case", example: "less_effort_more_done", description: "Lowercase words joined with underscores. Common in Python and databases.", code: true },
  { id: "kebab", label: "kebab-case", example: "less-effort-more-done", description: "Lowercase words joined with hyphens. Common for URLs and CSS classes.", code: true },
  { id: "constant", label: "CONSTANT_CASE", example: "LESS_EFFORT_MORE_DONE", description: "Uppercase words joined with underscores. Used for constants and environment variables.", code: true },
  { id: "dot", label: "dot.case", example: "less.effort.more.done", description: "Lowercase words joined with dots. Used in some config keys and namespaces.", code: true },
  { id: "path", label: "path/case", example: "less/effort/more/done", description: "Lowercase words joined with slashes, like a file or URL path.", code: true },
  { id: "alternating", label: "aLtErNaTiNg cAsE", example: "lEsS eFfOrT, mOrE dOnE", description: "Letters alternate between lower and upper case, ignoring spaces and punctuation." },
  { id: "inverse", label: "InVeRsE CaSe", example: "lESS eFFORT, mORE dONE", description: "Every letter's case is swapped: capitals become small and small become capitals." },
];

const isUpper = (ch: string) => ch !== ch.toLowerCase() && ch === ch.toUpperCase();
const isLower = (ch: string) => ch !== ch.toUpperCase() && ch === ch.toLowerCase();
const capFirst = (w: string) => {
  const chars = Array.from(w);
  return chars.length ? chars[0].toUpperCase() + chars.slice(1).join("") : w;
};

/**
 * Splits a line into words for programming cases: separators are any
 * non-letter/non-digit characters; camelCase and ACRONYMWord boundaries also
 * split ("XMLHttpRequest" → XML, Http, Request). Digits stay with their word.
 */
export function splitWords(line: string): string[] {
  const words: string[] = [];
  for (const chunk of line.split(/[^\p{L}\p{N}]+/u)) {
    if (!chunk) continue;
    const parts = chunk
      .replace(/(\p{Ll}|\p{N})(\p{Lu})/gu, "$1\u0000$2")
      .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, "$1\u0000$2")
      .split("\u0000");
    words.push(...parts.filter(Boolean));
  }
  return words;
}

const SMALL_WORDS = new Set(
  "a an the and but or nor for so yet as at by in of off on per to up via vs v. vs. from into onto upon with over than".split(" "),
);

/** Words we shouldn't touch in Title/Sentence case: acronyms, mixed case (iPhone), URLs, emails. */
function isSpecial(word: string) {
  if (/^[a-z][\w+.-]*:\/\//i.test(word) || /\S+@\S+\.\S+/.test(word) || /^www\./i.test(word)) return true;
  const letters = word.replace(/[^\p{L}]/gu, "");
  if (letters.length >= 2 && Array.from(letters).every(isUpper)) return true; // ACRONYM
  return Array.from(letters).slice(1).some(isUpper); // iPhone, McDonald, eBay
}

/** All-caps input ("HOW TO WIN") is treated as plain words, not a run of acronyms. */
function unshout(text: string) {
  const letters = text.replace(/[^\p{L}]/gu, "");
  const shouting = letters.length > 3 && Array.from(letters).every((c) => !isLower(c));
  return shouting ? text.toLowerCase() : text;
}

function titleCase(text: string) {
  const src = unshout(text);
  return src
    .split("\n")
    .map((line) => {
      const tokens = line.split(/(\s+)/);
      const wordIdx = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter((i) => i >= 0);
      const first = wordIdx[0];
      const last = wordIdx[wordIdx.length - 1];
      return tokens
        .map((tok, i) => {
          if (!/\S/.test(tok)) return tok;
          if (isSpecial(tok)) return tok;
          // Codes and identifiers (2x, v2.0, mp3, user_id) are left exactly as typed.
          if (/[\p{N}_]/u.test(tok)) return tok;
          const prev = wordIdx[wordIdx.indexOf(i) - 1];
          const afterBreak = prev !== undefined && /[:.!?—–]$/.test(tokens[prev]);
          const core = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();
          const forceCap = i === first || i === last || afterBreak;
          if (!forceCap && SMALL_WORDS.has(core)) return tok.toLowerCase();
          // Capitalise each hyphenated part: "self-driving" → "Self-Driving"
          return tok
            .toLowerCase()
            .split("-")
            .map((part) => part.replace(/\p{L}/u, (c) => c.toUpperCase()))
            .join("-");
        })
        .join("");
    })
    .join("\n");
}

function sentenceCase(text: string) {
  let capNext = true;
  // A whole sentence in capitals ("HELLO WORLD.") is shouting, not acronyms — lower it.
  const src = unshout(text).replace(/[^.!?\n]+[.!?]*/g, (sentence) => {
    const words = sentence.match(/\p{L}+/gu) ?? [];
    return words.length >= 2 && words.every((w) => !Array.from(w).some(isLower)) ? sentence.toLowerCase() : sentence;
  });
  return src.replace(/\S+|\s+/g, (tok) => {
    if (/^\s+$/.test(tok)) {
      if (tok.includes("\n")) capNext = true; // each new line starts a new sentence
      return tok;
    }
    let out = isSpecial(tok) ? tok : tok.toLowerCase();
    if (!isSpecial(tok) && /^i(['’][a-z]+)?[^\p{L}]*$/iu.test(tok)) out = "I" + out.slice(1); // pronoun "I", "I'm"
    if (capNext) {
      out = out.replace(/\p{L}/u, (c) => c.toUpperCase());
      if (/\p{L}/u.test(out)) capNext = false;
    }
    if (/[.!?]["'”’)\]]*$/.test(tok) && !/^(e\.g|i\.e|etc|vs|mr|mrs|ms|dr|st)\.$/i.test(tok)) capNext = true;
    return out;
  });
}

function joinCase(text: string, mode: CaseMode) {
  return text
    .split("\n")
    .map((line) => {
      const words = splitWords(line);
      if (!words.length) return "";
      const lower = words.map((w) => w.toLowerCase());
      switch (mode) {
        case "camel":
          return lower[0] + lower.slice(1).map(capFirst).join("");
        case "pascal":
          return lower.map(capFirst).join("");
        case "snake":
          return lower.join("_");
        case "kebab":
          return lower.join("-");
        case "constant":
          return words.map((w) => w.toUpperCase()).join("_");
        case "dot":
          return lower.join(".");
        case "path":
          return lower.join("/");
        default:
          return line;
      }
    })
    .join("\n");
}

export function convertCase(text: string, mode: CaseMode, opts: { collapseSpaces?: boolean } = {}): string {
  const src = opts.collapseSpaces ? text.replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").trim() : text;
  switch (mode) {
    case "upper":
      return src.toUpperCase();
    case "lower":
      return src.toLowerCase();
    case "title":
      return titleCase(src);
    case "sentence":
      return sentenceCase(src);
    case "capitalized":
      return src.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (_m, pre: string, c: string) => pre + c.toUpperCase());
    case "alternating": {
      let n = 0;
      return Array.from(src)
        .map((ch) => (isUpper(ch) || isLower(ch) ? (n++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch))
        .join("");
    }
    case "inverse":
      return Array.from(src)
        .map((ch) => (isUpper(ch) ? ch.toLowerCase() : isLower(ch) ? ch.toUpperCase() : ch))
        .join("");
    default:
      return joinCase(src, mode);
  }
}

export const SAMPLE_TEXT = `the quick guide to everyday tools: how to get more done with less effort
Use the XMLHttpRequest API on your iPhone — it's 2x faster.
user_first-name   v2.0`;
