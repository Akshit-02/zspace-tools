"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/**
 * Renders one PDF page at `scale` (CSS px per pt) with device-pixel-ratio
 * sharpness. Cancels in-flight renders when the page or zoom changes.
 */
export function PdfPageCanvas({ doc, page, scale, className }: { doc: PDFDocumentProxy; page: number; scale: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let task: RenderTask | null = null;
    let alive = true;
    (async () => {
      const p = await doc.getPage(page);
      if (!alive || !ref.current) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const vp = p.getViewport({ scale: scale * dpr });
      const c = ref.current;
      // Render offscreen, then swap, so zooming doesn't flash a blank page.
      const off = document.createElement("canvas");
      off.width = Math.floor(vp.width);
      off.height = Math.floor(vp.height);
      const ctx = off.getContext("2d")!;
      task = p.render({ canvas: off, canvasContext: ctx, viewport: vp });
      try {
        await task.promise;
        if (!alive) return;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")!.drawImage(off, 0, 0);
        setReady(true);
      } catch {
        /* cancelled */
      } finally {
        off.width = off.height = 0;
        p.cleanup();
      }
    })().catch(() => undefined);
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [doc, page, scale]);
  return <canvas ref={ref} aria-hidden className={className} style={{ width: "100%", height: "100%", background: "#fff", opacity: ready ? 1 : 0.6 }} />;
}
