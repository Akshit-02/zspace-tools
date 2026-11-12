"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { clsx } from "clsx";

/**
 * Accessible FAQ accordion. Every answer is always rendered into the HTML
 * (collapsed with a grid-rows transition), so the visible FAQ content and the
 * FAQPage JSON-LD stay identical for crawlers and answer engines.
 */
export function Accordion({ items, defaultOpen = 0 }: { items: { q: string; a: string }[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const id = useId();
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <h3>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="text-[1.05rem] font-medium leading-snug text-charcoal sm:text-lg">{item.q}</span>
                <span
                  className={clsx(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] border transition-all duration-300 ease-[var(--ease-out)]",
                    isOpen
                      ? "rotate-45 border-orange bg-orange text-charcoal"
                      : "border-line bg-card text-ink-2 group-hover:border-charcoal group-hover:text-charcoal",
                  )}
                >
                  <Plus aria-hidden className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-a${i}`}
              role="region"
              aria-labelledby={`${id}-q${i}`}
              className={clsx(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="max-w-3xl pb-6 pr-4 text-ink-2 [overflow-wrap:anywhere] sm:pr-12">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
