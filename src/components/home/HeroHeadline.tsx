"use client";

import { motion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroHeadline() {
  return (
    <h1 className="font-display text-hero font-semibold text-charcoal">
      <span className="block overflow-hidden pb-[0.06em]">
        <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 0.8, ease }}>
          Less effort.
        </motion.span>
      </span>
      <span className="block overflow-hidden pb-[0.14em]">
        <motion.span
          className="relative inline-block"
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease }}
        >
          More done<span className="text-orange">.</span>
          <svg
            aria-hidden
            viewBox="0 0 300 16"
            preserveAspectRatio="none"
            className="absolute -bottom-[0.08em] left-0 h-[0.16em] w-[92%] overflow-visible"
          >
            <motion.path
              d="M2 11 C 70 3, 160 3, 298 8"
              fill="none"
              stroke="#F07845"
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.65, ease }}
            />
          </svg>
        </motion.span>
      </span>
    </h1>
  );
}
