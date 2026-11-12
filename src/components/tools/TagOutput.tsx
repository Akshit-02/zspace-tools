"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton } from "./ui";
import type { Tag } from "@/lib/meta-tags";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

/** Tabbed list of generated tags: copy one tag, copy the tab, or download an HTML file. */
export default function TagOutput({
  tool,
  tabs,
  download,
}: {
  tool: string;
  tabs: { id: string; label: string; tags: Tag[]; text: string }[];
  download: { name: string; content: () => string };
}) {
  const [active, setActive] = useState(tabs[tabs.length - 1].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-card" data-testid="tag-output">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div role="tablist" aria-label="Output" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              onClick={() => setActive(t.id)}
              className={clsx("h-8 rounded-[8px] px-3 text-[0.84rem] transition-colors", t.id === active ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-ivory-2 hover:text-charcoal")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <CopyButton text={() => tab.text} label={tab.id === tabs[tabs.length - 1].id ? "Copy all" : "Copy tab"} className="!h-8" onCopied={() => track("copy_clicked", { tool, format: tab.id })} />
          <button
            type="button"
            onClick={() => {
              downloadBlob(new Blob([download.content()], { type: "text/html;charset=utf-8" }), download.name);
              track("download_clicked", { tool, format: "html" });
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <Download aria-hidden className="size-3.5" /> HTML
          </button>
        </div>
      </div>
      <ul role="tabpanel" aria-label={tab.label} className="max-h-[420px] overflow-auto bg-ivory/40 py-2 font-mono text-[0.8rem] leading-[1.55]" data-testid="tag-lines">
        {tab.tags.length === 0 && <li className="px-4 py-3 font-sans text-sm text-ink-3">Fill in the form to generate tags.</li>}
        {tab.tags.map((t) => (
          <li key={t.key} className="group flex items-start gap-2 px-4 py-1 hover:bg-ivory-2/60">
            <code className="min-w-0 flex-1 break-all text-charcoal">{t.html}</code>
            <CopyButton iconOnly text={() => t.html} label={`Copy ${t.key} tag`} className="!size-7 shrink-0 opacity-70 group-hover:opacity-100 focus:opacity-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}
