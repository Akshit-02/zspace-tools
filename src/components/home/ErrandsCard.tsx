"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

// An illustrative to-do list showing the kind of jobs the tools finish.
// Values are example outputs, labelled "Example" — not usage statistics.
const rows = [
  { task: "Shrink holiday photos", meta: "4.2 MB → 860 KB" },
  { task: "Make the lease PDF email-friendly", meta: "18 MB → 3.1 MB" },
  { task: "Wi-Fi QR for guests", meta: "WPA · SVG" },
  { task: "Trim essay to the limit", meta: "1,500 words" },
  { task: "New bank password", meta: "20 chars · 131 bits" },
];

export function ErrandsCard() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-3 -z-10 rounded-[22px] border border-dashed border-line-strong" />
      <motion.div
        initial={{ opacity: 0, y: 18, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[16px] border border-line bg-card p-6 shadow-[0_30px_70px_-40px_rgba(37,37,37,0.45)]"
      >
        <div className="flex items-baseline justify-between border-b border-dashed border-line-strong pb-4">
          <p className="font-display text-xl font-semibold tracking-[-0.01em]">Today&rsquo;s errands</p>
          <p className="font-mono text-[0.72rem] uppercase tracking-wider text-ink-2">Example</p>
        </div>
        <ul className="mt-2">
          {rows.map((r, i) => (
            <li key={r.task} className="flex items-center gap-3 border-b border-line py-3.5 last:border-0">
              <motion.span
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.75 + i * 0.16, type: "spring", stiffness: 420, damping: 22 }}
                className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-charcoal text-ivory"
              >
                <Check aria-hidden className="size-3.5" strokeWidth={3} />
              </motion.span>
              <span className="relative flex-1 text-[0.95rem] text-charcoal">
                {r.task}
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.85 + i * 0.16, duration: 0.35 }}
                  className="absolute left-0 top-1/2 h-px w-full origin-left bg-ink-3/70"
                />
              </span>
              <span className="whitespace-nowrap font-mono text-[0.75rem] text-ink-2">{r.meta}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center justify-between rounded-[10px] bg-ivory-2 px-3.5 py-2.5 font-mono text-[0.72rem] text-ink-2">
          <span>5 of 5 done</span>
          <span className="text-orange-ink">0 files uploaded</span>
        </p>
      </motion.div>
    </div>
  );
}
