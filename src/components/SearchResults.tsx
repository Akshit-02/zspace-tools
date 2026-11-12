"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { ToolIcon } from "./ToolIcon";
import { getCategory, toolPath } from "@/lib/tools";
import type { SearchHit } from "@/lib/search";

export function SearchResults({
  hits,
  active,
  onHover,
  onPick,
  idPrefix,
}: {
  hits: SearchHit[];
  active: number;
  onHover: (i: number) => void;
  onPick?: () => void;
  idPrefix: string;
}) {
  return (
    <ul role="listbox" id={`${idPrefix}-list`} className="p-1.5">
      {hits.map((hit, i) => (
        <li key={hit.tool.slug} role="option" id={`${idPrefix}-${i}`} aria-selected={active === i}>
          <Link
            href={toolPath(hit.tool.slug)}
            onMouseEnter={() => onHover(i)}
            onClick={onPick}
            className={clsx(
              "flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors",
              active === i ? "bg-ivory-2" : "hover:bg-ivory-2",
            )}
          >
            <span
              className={clsx(
                "grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors",
                active === i ? "border-orange bg-orange-wash text-orange-ink" : "border-line bg-card text-charcoal",
              )}
            >
              <ToolIcon name={hit.tool.icon} className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-charcoal">{hit.tool.name}</span>
              <span className="block truncate text-sm text-ink-2">{hit.tool.short}</span>
            </span>
            <span className="hidden text-xs text-ink-3 sm:block">{getCategory(hit.tool.category).name}</span>
            <ArrowUpRight aria-hidden className={clsx("size-4 shrink-0", active === i ? "text-orange-ink" : "text-ink-3")} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
