"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderThumb } from "@/lib/pdf-images";

/**
 * Serial thumbnail renderer: one page at a time (keeps memory flat), object URLs
 * cached per page and revoked when the document changes or the tool unmounts.
 */
export function useThumbQueue(doc: PDFDocumentProxy | null, width = 140) {
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const cache = useRef(new Map<number, Promise<string | null>>());
  useEffect(() => {
    const c = cache.current;
    return () => {
      c.forEach((p) => p.then((u) => u && URL.revokeObjectURL(u)).catch(() => undefined));
      c.clear();
      chain.current = Promise.resolve();
    };
  }, [doc]);
  return useCallback(
    (page: number) => {
      if (!doc) return Promise.resolve(null);
      let p = cache.current.get(page);
      if (!p) {
        p = chain.current.then(() => renderThumb(doc, page, width));
        chain.current = p.catch(() => undefined);
        cache.current.set(page, p);
      }
      return p;
    },
    [doc, width],
  );
}

/** Lazily rendered page image (renders when scrolled near the viewport). */
export function PdfThumb({ page, queue, rotate = 0, className, alt }: { page: number; queue: (p: number) => Promise<string | null>; rotate?: number; className?: string; alt?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const io = new IntersectionObserver(
      (e) => {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        queue(page)
          .then((u) => alive && setSrc(u))
          .catch(() => undefined); // document closed while rendering
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [page, queue]);
  return (
    <div ref={ref} className={clsx("grid aspect-[3/4] place-items-center overflow-hidden bg-ivory", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} className="max-h-full max-w-full object-contain shadow-sm transition-transform duration-200" style={{ transform: rotate ? `rotate(${rotate}deg)${rotate % 180 ? " scale(0.75)" : ""}` : undefined }} />
      ) : (
        <Loader2 aria-hidden className="size-4 animate-spin text-ink-3" />
      )}
    </div>
  );
}
