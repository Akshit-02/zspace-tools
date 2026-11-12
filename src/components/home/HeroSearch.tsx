"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Search, CornerDownLeft } from "lucide-react";
import { searchTools } from "@/lib/search";
import { toolPath } from "@/lib/tools";
import { SearchResults } from "../SearchResults";

const suggestions = ["Compress a photo", "Make a PDF smaller", "Wi-Fi QR code", "Count words", "Strong password"];

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const hits = useMemo(() => searchTools(query, 5), [query]);
  const showResults = focused && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-[620px]">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const hit = hits[active];
          if (hit) router.push(toolPath(hit.tool.slug));
        }}
        className="group relative"
      >
        <label htmlFor={`${id}-input`} className="sr-only">
          Search tools
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-ink-2 transition-colors group-focus-within:text-orange-ink"
        />
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          autoComplete="off"
          enterKeyHint="go"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder="What would you like to do today?"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={`${id}-list`}
          aria-activedescendant={showResults && hits[active] ? `${id}-${active}` : undefined}
          className="h-[62px] w-full rounded-[14px] border border-line-strong bg-card pl-14 pr-4 text-[1.05rem] text-charcoal shadow-[0_1px_0_rgba(37,37,37,0.04),0_12px_32px_-18px_rgba(37,37,37,0.25)] outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18),0_12px_32px_-18px_rgba(37,37,37,0.25)] sm:pr-24"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-line bg-ivory px-2 py-1 font-mono text-[0.7rem] text-ink-2 sm:flex"
        >
          <CornerDownLeft className="size-3" /> enter
        </span>
      </form>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[14px] border border-line bg-card shadow-[0_24px_60px_-24px_rgba(37,37,37,0.35)]"
          >
            {hits.length > 0 ? (
              <SearchResults hits={hits} active={active} onHover={setActive} idPrefix={id} />
            ) : (
              <p className="px-5 py-6 text-sm text-ink-2">
                Nothing for &ldquo;{query}&rdquo; yet — try &ldquo;compress&rdquo;, &ldquo;QR&rdquo; or &ldquo;password&rdquo;.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-ink-2">Try:</span>
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setQuery(s);
              setActive(0);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-line bg-card/70 px-3 py-1 text-sm text-charcoal/80 transition-colors hover:border-charcoal hover:text-charcoal"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
