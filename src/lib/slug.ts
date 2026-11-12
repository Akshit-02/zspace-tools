/**
 * URL slug generation. Deterministic and local. Transliteration covers Latin
 * diacritics, German/Nordic/Polish letters, Greek and Russian/Ukrainian
 * Cyrillic; other scripts are kept as Unicode letters or removed (reported).
 */

export type SlugCase = "lower" | "upper" | "preserve";
export type Separator = "-" | "_";

export interface SlugOptions {
  case: SlugCase;
  separator: Separator;
  /** Transliterate supported scripts to ASCII (café → cafe, Привет → privet). */
  transliterate: boolean;
  /** Keep letters/digits from scripts that can't be transliterated (e.g. 日本, हिन्दी). */
  keepUnicode: boolean;
  removeStopWords: boolean;
  /** 0 = no limit. Cuts at a separator, never mid-word unless one word is longer. */
  maxLength: number;
}

export const DEFAULT_SLUG: SlugOptions = { case: "lower", separator: "-", transliterate: true, keepUnicode: true, removeStopWords: false, maxLength: 0 };

const SPECIAL: Record<string, string> = {
  ß: "ss", ẞ: "SS", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE", ø: "o", Ø: "O", đ: "d", Đ: "D", ð: "d", Ð: "D",
  þ: "th", Þ: "TH", ł: "l", Ł: "L", ı: "i", ħ: "h", Ħ: "H", ŋ: "ng", Ŋ: "NG",
  "&": " and ", "@": " at ", "%": " percent ", "+": " plus ", "#": " ",
  "’": "", "'": "", "‘": "", "`": "", "´": "",
};

// ISO 9 / BGN-style practical transliteration for Russian & Ukrainian Cyrillic.
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", ё: "yo", є: "ye", ж: "zh", з: "z", и: "i", і: "i", ї: "yi", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
const GREEK: Record<string, string> = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o",
  π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps", ω: "o",
};

export const STOP_WORDS = new Set(
  "a an the and or but nor so yet of for in on at to by from with as into onto over under is are was were be been being it its this that these those your our their my his her".split(" "),
);

// Ukrainian national romanisation (2010) where it differs from Russian.
const UKRAINIAN: Record<string, string> = { ...CYRILLIC, г: "h", и: "y", і: "i", ї: "i", є: "ie", й: "i" };
const UKRAINIAN_ONLY = /[іїєґІЇЄҐ]/;

function translitChar(ch: string, cyr: Record<string, string>): string {
  if (SPECIAL[ch] !== undefined) return SPECIAL[ch];
  const lower = ch.toLowerCase();
  const table = cyr[lower] !== undefined ? cyr : GREEK[lower] !== undefined ? GREEK : null;
  if (table) {
    const t = table[lower];
    return ch !== lower && t ? t[0].toUpperCase() + t.slice(1) : t;
  }
  return ch;
}

export interface SlugResult {
  slug: string;
  /** Characters dropped because they couldn't be represented (for user feedback). */
  removed: string[];
}

export function slugify(input: string, o: SlugOptions = DEFAULT_SLUG): SlugResult {
  const removed = new Set<string>();
  let s = input.normalize("NFKC");
  if (o.transliterate) {
    s = Array.from(s, (ch) => (SPECIAL[ch] !== undefined ? SPECIAL[ch] : ch)).join("");
    // Strip diacritics from Latin/Greek/Cyrillic only (é → e). Marks in other scripts
    // (e.g. Devanagari vowel signs) are part of the letter and must be kept.
    s = s
      .normalize("NFKD")
      .replace(/([\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}])\p{M}+/gu, "$1")
      .normalize("NFC");
    const cyr = UKRAINIAN_ONLY.test(s) ? UKRAINIAN : CYRILLIC;
    s = Array.from(s, (ch) => translitChar(ch, cyr)).join("");
  } else {
    s = s.replace(/['’‘`´]/g, "");
  }
  // Split into word tokens on anything that isn't a letter or digit.
  const words: string[] = [];
  for (const raw of s.split(/[^\p{L}\p{M}\p{N}]+/u)) {
    if (!raw) continue;
    let w = raw;
    if (!o.keepUnicode) {
      const ascii = w.replace(/[^A-Za-z0-9]/g, "");
      for (const ch of w) if (!/[A-Za-z0-9]/.test(ch)) removed.add(ch);
      w = ascii;
    }
    if (w) words.push(w);
  }
  let kept = o.removeStopWords ? words.filter((w) => !STOP_WORDS.has(w.toLowerCase())) : words;
  if (!kept.length) kept = words; // never strip a title down to nothing
  let slug = kept.join(o.separator);
  if (o.case === "lower") slug = slug.toLowerCase();
  else if (o.case === "upper") slug = slug.toUpperCase();
  if (o.maxLength > 0 && Array.from(slug).length > o.maxLength) {
    const chars = Array.from(slug).slice(0, o.maxLength + 1);
    let cut = chars.join("");
    const last = cut.lastIndexOf(o.separator);
    cut = last > 0 && Array.from(slug)[o.maxLength] !== o.separator ? cut.slice(0, last) : Array.from(cut).slice(0, o.maxLength).join("");
    slug = cut.replace(new RegExp(`\\${o.separator}+$`), "");
  }
  return { slug, removed: [...removed] };
}

/** Bulk: one slug per non-empty line; optional numeric suffixes keep slugs unique. */
export function bulkSlugify(text: string, o: SlugOptions, unique: boolean) {
  const seen = new Map<string, number>();
  return text
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((title) => {
      let { slug } = slugify(title, o);
      if (unique && slug) {
        const n = (seen.get(slug) ?? 0) + 1;
        seen.set(slug, n);
        if (n > 1) slug = `${slug}${o.separator}${n}`;
      }
      return { title, slug };
    });
}

/** Joins a base URL and slug with exactly one slash. Returns null for an invalid base. */
export function previewUrl(base: string, slug: string, trailingSlash = false): string | null {
  const b = base.trim();
  if (!b) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(b) ? b : `https://${b}`);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
    const path = u.pathname.replace(/\/+$/, "");
    // Slugs only contain letters, digits and separators, so show the readable (IRI) form.
    return `${u.origin}${path}/${slug}${trailingSlash && slug ? "/" : ""}`;
  } catch {
    return null;
  }
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export function slugCsv(rows: { title: string; slug: string; url?: string | null }[], withUrl: boolean) {
  const head = withUrl ? "title,slug,url" : "title,slug";
  return [head, ...rows.map((r) => [r.title, r.slug, ...(withUrl ? [r.url ?? ""] : [])].map(csvCell).join(","))].join("\n") + "\n";
}
