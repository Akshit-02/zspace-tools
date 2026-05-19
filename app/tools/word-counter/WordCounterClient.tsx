"use client";
import { useState, useMemo, useCallback } from "react";
import { Copy, Check, RotateCcw, Upload, FileText } from "lucide-react";

const READING_SPEED_WPM = 238; // avg adult reading speed
const SPEAKING_SPEED_WPM = 130; // avg speaking speed

function formatTime(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

function getTopWords(text: string, n = 10): { word: string; count: number }[] {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "shall",
    "can",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "i",
    "you",
    "he",
    "she",
    "we",
    "they",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "me",
    "him",
    "us",
    "them",
    "not",
    "from",
    "by",
    "as",
    "so",
    "if",
    "then",
    "than",
    "when",
    "where",
    "which",
    "who",
    "what",
    "how",
  ]);
  const words = text.toLowerCase().match(/\b[a-z']{2,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, count]) => ({ word, count }));
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once. Pangrams are often used to display typefaces, test equipment, and develop skills in handwriting, calligraphy, and keyboarding.`;

export default function WordCounterClient() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "keywords">("stats");
  const [isDragging, setIsDragging] = useState(false);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed === "" ? [] : trimmed.split(/\s+/).filter(Boolean);
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const sentences =
      trimmed === "" ? 0 : (trimmed.match(/[.!?]+/g) || []).length;
    const paragraphs =
      trimmed === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const lines = text === "" ? 0 : text.split("\n").length;
    const uniqueWords = new Set(
      words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")),
    ).size;
    const readingTime = words.length / READING_SPEED_WPM;
    const speakingTime = words.length / SPEAKING_SPEED_WPM;
    const topWords = getTopWords(text);

    return {
      words: words.length,
      chars,
      charsNoSpace,
      sentences,
      paragraphs,
      lines,
      uniqueWords,
      readingTime,
      speakingTime,
      topWords,
    };
  }, [text]);

  const maxWordCount = stats.topWords[0]?.count || 1;

  const handleCopy = useCallback(() => {
    const result = `Word Count Results\nWords: ${stats.words}\nCharacters: ${stats.chars}\nCharacters (no spaces): ${stats.charsNoSpace}\nSentences: ${stats.sentences}\nParagraphs: ${stats.paragraphs}\nUnique Words: ${stats.uniqueWords}\nReading Time: ${formatTime(stats.readingTime)}\nSpeaking Time: ${formatTime(stats.speakingTime)}`;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [stats]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("text/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setText((e.target?.result as string) ?? "");
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const primaryStats = [
    {
      label: "Words",
      value: stats.words,
      color: "text-zest-500",
      bg: "bg-zest-500/10",
    },
    {
      label: "Characters",
      value: stats.chars,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Sentences",
      value: stats.sentences,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Paragraphs",
      value: stats.paragraphs,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const secondaryStats = [
    { label: "Chars (no spaces)", value: stats.charsNoSpace },
    { label: "Unique words", value: stats.uniqueWords },
    { label: "Lines", value: stats.lines },
    { label: "Reading time", value: formatTime(stats.readingTime) },
    { label: "Speaking time", value: formatTime(stats.speakingTime) },
    {
      label: "Avg word length",
      value:
        stats.words > 0
          ? (stats.charsNoSpace / stats.words).toFixed(1) + " chars"
          : "—",
    },
  ];

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* ── TEXT AREA PANEL ── */}
      <div className="lg:col-span-3 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setText(SAMPLE_TEXT)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Load Sample
            </button>
            <label className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3 h-3" />
              Upload .txt
              <input
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy Stats"}
            </button>
            <button
              onClick={() => setText("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Textarea with drag-and-drop */}
        <div
          className={`relative rounded-2xl border-2 transition-all duration-200 ${
            isDragging
              ? "border-zest-500 bg-zest-500/5"
              : "border-gray-200 bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here…&#10;&#10;You can also drag & drop a .txt file."
            className="w-full h-80 lg:h-[480px] px-5 py-4 rounded-2xl bg-transparent text-ink-800 text-sm leading-relaxed placeholder-gray-300 resize-none focus:outline-none font-body"
            aria-label="Text input for word counting"
            spellCheck
          />
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none">
              <div className="text-center">
                <FileText className="w-10 h-10 text-zest-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-zest-500">
                  Drop your file here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live word/char counter below textarea */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            {stats.words} words · {stats.chars} characters
          </span>
          {text.length > 0 && (
            <span>
              {stats.readingTime < 1
                ? `${Math.round(stats.readingTime * 60)}s`
                : `${Math.ceil(stats.readingTime)} min`}{" "}
              read
            </span>
          )}
        </div>
      </div>

      {/* ── STATS PANEL ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Primary stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {primaryStats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 text-center"
            >
              <div
                className={`text-3xl font-display font-extrabold ${s.color} mb-0.5`}
              >
                {s.value.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Reading / speaking time highlight */}
        <div className="bg-ink-900 rounded-2xl border border-ink-700 p-5">
          <p className="text-xs font-display font-semibold uppercase tracking-wider text-white/30 mb-4">
            Time Estimates
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">👁️</div>
              <div className="text-xl font-display font-bold text-white">
                {formatTime(stats.readingTime)}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">
                Reading time
              </div>
              <div className="text-[10px] text-white/20 mt-0.5">@ 238 wpm</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">🎙️</div>
              <div className="text-xl font-display font-bold text-white">
                {formatTime(stats.speakingTime)}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">
                Speaking time
              </div>
              <div className="text-[10px] text-white/20 mt-0.5">@ 130 wpm</div>
            </div>
          </div>
        </div>

        {/* Tabs: Detailed stats / Keywords */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(["stats", "keywords"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-display font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? "text-zest-500 border-b-2 border-zest-500 -mb-px bg-zest-500/5"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "stats" ? "Detailed Stats" : "Top Keywords"}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "stats" ? (
              <div className="space-y-2">
                {secondaryStats.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-500">{s.label}</span>
                    <span className="text-sm font-display font-semibold text-ink-800">
                      {typeof s.value === "number"
                        ? s.value.toLocaleString("en-IN")
                        : s.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topWords.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No keywords yet. Start typing!
                  </p>
                ) : (
                  stats.topWords.map(({ word, count }, i) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-300 w-4 text-right font-mono">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium text-ink-700">
                            {word}
                          </span>
                          <span className="text-xs text-gray-400">
                            {count}×
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zest-500/60 transition-all duration-500"
                            style={{
                              width: `${(count / maxWordCount) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Density indicator */}
        {stats.words > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
            <p className="text-xs font-display font-semibold uppercase tracking-wider text-ink-400 mb-3">
              Vocabulary Density
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-zest-500 to-blue-500 transition-all duration-500"
                  style={{
                    width: `${Math.min((stats.uniqueWords / stats.words) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-display font-bold text-ink-800 flex-shrink-0">
                {stats.words > 0
                  ? Math.round((stats.uniqueWords / stats.words) * 100)
                  : 0}
                %
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {stats.uniqueWords} unique of {stats.words} total words
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
