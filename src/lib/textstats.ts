export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
}

type Seg = { segment: string; isWordLike?: boolean };
type SegmenterCtor = new (locale?: string, opts?: { granularity: "word" | "sentence" | "grapheme" }) => {
  segment(input: string): Iterable<Seg>;
};

const Segmenter: SegmenterCtor | undefined =
  typeof Intl !== "undefined" ? (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter : undefined;

const wordSeg = Segmenter ? new Segmenter(undefined, { granularity: "word" }) : null;
const sentSeg = Segmenter ? new Segmenter(undefined, { granularity: "sentence" }) : null;
const graphSeg = Segmenter ? new Segmenter(undefined, { granularity: "grapheme" }) : null;

function countGraphemes(text: string) {
  if (!graphSeg) return [...text].length;
  return Array.from(graphSeg.segment(text)).length;
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, characters: countGraphemes(text), charactersNoSpaces: 0, sentences: 0, paragraphs: 0 };

  let words = 0;
  if (wordSeg) {
    // Treat hyphen-joined words ("well-known") as one word, like word processors do.
    let prev2: Seg | null = null;
    let prev: Seg | null = null;
    for (const s of wordSeg.segment(text)) {
      const joined = prev && /^[-‐‑]$/.test(prev.segment) && prev2?.isWordLike;
      if (s.isWordLike && !joined) words++;
      prev2 = prev;
      prev = s;
    }
  } else {
    words = (trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? []).length;
  }

  let sentences = 0;
  if (sentSeg) {
    for (const s of sentSeg.segment(text)) if (/[\p{L}\p{N}]/u.test(s.segment)) sentences++;
  } else {
    sentences = trimmed.split(/(?<=[.!?…])\s+/).filter((s) => /[\p{L}\p{N}]/u.test(s)).length;
  }

  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  return {
    words,
    characters: countGraphemes(text),
    charactersNoSpaces: countGraphemes(text.replace(/\s/g, "")),
    sentences,
    paragraphs,
  };
}

/** "3 min 20 sec", "45 sec", "1 hr 4 min". */
export function formatDuration(minutes: number) {
  const totalSec = Math.round(minutes * 60);
  if (totalSec === 0) return "0 sec";
  if (totalSec < 60) return `${totalSec} sec`;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} hr ${m} min`;
  return s ? `${m} min ${s} sec` : `${m} min`;
}

export function topWords(text: string, limit = 6) {
  const stop = new Set(
    "the a an and or but of to in on at for with is are was were be been it its this that as by from not you your i we they he she our their have has had will would can could do does did so if then than there here what which who".split(
      " ",
    ),
  );
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? []) {
    if (w.length < 3 || stop.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}
