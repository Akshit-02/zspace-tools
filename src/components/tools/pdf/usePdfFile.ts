"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { openPdfjs } from "@/lib/pdf-render";
import { PdfError, isPdfFile } from "@/lib/pdf-utils";
import { formatBytes } from "@/lib/format";

export interface PageInfo {
  /** Display size at 100% (pt), with the page's /Rotate applied. */
  w: number;
  h: number;
  rotate: number;
}

export interface OpenPdf {
  file: File;
  bytes: Uint8Array;
  doc: PDFDocumentProxy;
  lib: typeof import("pdfjs-dist");
  pages: PageInfo[];
}

/** Opens one PDF with pdf.js, validates it, and disposes it when replaced or unmounted. */
export function usePdfFile({ maxMB, maxPages }: { maxMB: number; maxPages: number }) {
  const [pdf, setPdf] = useState<OpenPdf | null>(null);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const destroy = useRef<(() => void) | null>(null);

  useEffect(() => () => destroy.current?.(), []);

  const open = useCallback(
    async (file: File | undefined): Promise<OpenPdf | null> => {
      setError(null);
      if (!file) return null;
      if (!isPdfFile(file)) {
        setError(`${file.name} isn't a PDF. Choose a file that ends in .pdf.`);
        return null;
      }
      if (file.size === 0) {
        setError(`${file.name} is empty.`);
        return null;
      }
      if (file.size > maxMB * 1048576) {
        setError(`${file.name} is ${formatBytes(file.size)}. Your file is larger than the current processing limit of ${maxMB} MB.`);
        return null;
      }
      setOpening(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { doc, lib, destroy: d } = await openPdfjs(bytes, file.name);
        if (doc.numPages > maxPages) {
          d();
          throw new PdfError("memory", `${file.name} has ${doc.numPages} pages. The limit here is ${maxPages} pages — split it first with the PDF Splitter.`);
        }
        const pages: PageInfo[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const p = await doc.getPage(i);
          const v = p.getViewport({ scale: 1 });
          pages.push({ w: v.width, h: v.height, rotate: p.rotate });
          p.cleanup();
        }
        destroy.current?.();
        destroy.current = d;
        const next = { file, bytes, doc, lib, pages };
        setPdf(next);
        return next;
      } catch (e) {
        setError(e instanceof PdfError ? e.message : `${file.name} couldn't be opened. It may be damaged.`);
        return null;
      } finally {
        setOpening(false);
      }
    },
    [maxMB, maxPages],
  );

  const close = useCallback(() => {
    destroy.current?.();
    destroy.current = null;
    setPdf(null);
    setError(null);
  }, []);

  return { pdf, open, close, opening, error, setError };
}
