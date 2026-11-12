"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** Before/after comparison. A native range input drives it, so it's keyboard- and touch-accessible. */
export function CompareSlider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="checker relative aspect-[4/3] w-full select-none overflow-hidden rounded-[12px] border border-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`${alt} — compressed`} className="absolute inset-0 size-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={`${alt} — original`} className="absolute inset-0 size-full object-contain" draggable={false} />
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-[6px] bg-charcoal/85 px-2 py-0.5 font-mono text-[0.68rem] text-ivory">
        Original
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-[6px] bg-orange px-2 py-0.5 font-mono text-[0.68rem] text-charcoal">
        Compressed
      </span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-card shadow-[0_0_0_1px_rgba(37,37,37,0.15)]" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-card text-charcoal shadow-md">
          <MoveHorizontal aria-hidden className="size-4" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare original and compressed image"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
