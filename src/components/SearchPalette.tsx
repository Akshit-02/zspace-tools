"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { searchTools } from "@/lib/search";
import { tools, toolPath } from "@/lib/tools";
import { SearchResults } from "./SearchResults";

/** ⌘K / Ctrl+K command palette for jumping to any tool. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const id = useId();

  const hits = useMemo(
    () => (query.trim() ? searchTools(query) : tools.map((tool) => ({ tool, score: 0 }))),
    [query],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  const close = () => {
    setQuery("");
    setActive(0);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      router.push(toolPath(hits[active].tool.slug));
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-charcoal/25 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search tools"
            className="w-full max-w-xl overflow-hidden rounded-[14px] border border-line bg-card shadow-[0_30px_80px_-20px_rgba(37,37,37,0.35)]"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-[18px] text-ink-2" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="What would you like to do today?"
                aria-label="Search tools"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={hits[active] ? `${id}-${active}` : undefined}
                className="h-14 flex-1 bg-transparent text-[1.02rem] text-charcoal outline-none placeholder:text-ink-3"
              />
              <button
                type="button"
                onClick={close}
                className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>
            {hits.length > 0 ? (
              <SearchResults hits={hits} active={active} onHover={setActive} onPick={close} idPrefix={id} />
            ) : (
              <p className="px-5 py-8 text-center text-sm text-ink-2">
                No tool matches &ldquo;{query}&rdquo; yet. Try &ldquo;compress&rdquo;, &ldquo;QR&rdquo; or &ldquo;password&rdquo;.
              </p>
            )}
            <div className="flex items-center justify-between border-t border-line bg-ivory px-4 py-2 font-mono text-[0.7rem] text-ink-2">
              <span>↑↓ navigate · ↵ open</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
