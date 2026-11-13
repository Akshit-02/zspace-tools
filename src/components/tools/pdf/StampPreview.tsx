"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OverlayObject } from "@/lib/pdf-overlay";
import type { OpenPdf } from "./usePdfFile";
import { PdfPageCanvas } from "./PdfPageCanvas";
import { OverlayLayer } from "./OverlayLayer";

/**
 * Page preview with overlay objects drawn exactly as they'll be exported.
 * Optionally lets one object be dragged (custom placement).
 */
export function StampPreview({ pdf, objects, page, onPage, maxHeight = 640, draggable, onDrag }: { pdf: OpenPdf; objects: OverlayObject[]; page: number; onPage: (p: number) => void; maxHeight?: number; draggable?: boolean; onDrag?: (cx: number, cy: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const info = pdf.pages[page];
  useEffect(() => {
    const el = box.current;
    if (!el || !info) return;
    const fit = () => setScale(Math.max(0.2, Math.min((el.clientWidth - 24) / info.w, (maxHeight - 24) / info.h, 2)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [info, maxHeight]);
  const objs = objects.filter((o) => o.page === page);
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div ref={box} className="grid place-items-center overflow-hidden rounded-[14px] border border-line bg-[#e9e4dc] p-3" data-testid="stamp-preview">
        <div className="relative shadow-md" style={{ width: info.w * scale, height: info.h * scale }} data-testid="stamp-stage" data-page-w={info.w}>
          <PdfPageCanvas doc={pdf.doc} page={page + 1} scale={scale} />
          <OverlayLayer
            objects={objs}
            scale={scale}
            selected={draggable ? sel : null}
            editing={null}
            onSelect={setSel}
            onEdit={() => undefined}
            onPreview={(id, p) => {
              const o = objs.find((x) => x.id === id);
              if (o && onDrag && p.x !== undefined && p.y !== undefined) onDrag((p.x + o.w / 2) / info.w, (p.y + o.h / 2) / info.h);
            }}
            onCommit={() => undefined}
            onRemove={() => undefined}
            interactive={!!draggable}
            noHandles
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-mono text-xs" aria-live="polite">
          Page {page + 1} / {pdf.pages.length}
        </span>
        <button type="button" aria-label="Next page" disabled={page >= pdf.pages.length - 1} onClick={() => onPage(page + 1)} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
