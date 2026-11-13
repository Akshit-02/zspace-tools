/**
 * Page thumbnails via pdf.js (pdf-lib can't render). Loaded lazily so tools
 * only pay for it when a PDF is added. Worker, fonts and CMaps are served from
 * /public/pdfjs (copied by scripts/copy-pdfjs.mjs), keeping CSP 'self'-only.
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

let lib: Promise<typeof import("pdfjs-dist")> | null = null;

export async function pdfjs() {
  if (!lib) {
    lib = import("pdfjs-dist").then((m) => {
      m.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.${m.version}.min.mjs`;
      return m;
    });
  }
  return lib;
}

export interface RenderDoc {
  pageCount: number;
  /** Renders a page to a JPEG object URL, fitting within `width` CSS px (2× for sharpness). */
  thumb: (page: number, width: number) => Promise<string>;
  /** Stop tracking a URL so it survives destroy(); the caller must revoke it. */
  detach: (url: string) => void;
  destroy: () => void;
}

export async function openForRender(bytes: Uint8Array): Promise<RenderDoc> {
  const m = await pdfjs();
  // pdf.js transfers the buffer to its worker, so give it a copy.
  const task = m.getDocument({
    data: bytes.slice(),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    useWasm: false,
    enableXfa: false,
  });
  const doc: PDFDocumentProxy = await task.promise;
  const urls = new Set<string>();
  let chain: Promise<unknown> = Promise.resolve();

  const renderOne = async (pageNumber: number, width: number) => {
    const page = await doc.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(4, (width * 2) / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    page.cleanup();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    canvas.width = canvas.height = 0;
    if (!blob) throw new Error("Thumbnail failed");
    const url = URL.createObjectURL(blob);
    urls.add(url);
    return url;
  };

  return {
    pageCount: doc.numPages,
    // Serialise renders: keeps memory flat and the main thread responsive.
    thumb: (page, width) => {
      const p = chain.then(() => renderOne(page, width));
      chain = p.catch(() => undefined);
      return p;
    },
    detach: (url) => {
      urls.delete(url);
    },
    destroy: () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
      void task.destroy();
    },
  };
}

/** Renders just the first page of a PDF and returns an object URL the caller owns. */
export async function firstPageThumb(bytes: Uint8Array, width: number): Promise<string | null> {
  let doc: RenderDoc | null = null;
  try {
    doc = await openForRender(bytes);
    const url = await doc.thumb(1, width);
    doc.detach(url);
    return url;
  } catch {
    return null; // a missing thumbnail must never block the tool
  } finally {
    doc?.destroy();
  }
}

/**
 * Opens a PDF with pdf.js for page rendering or text extraction, converting
 * failures into clear PdfErrors (password, damaged, not a PDF, empty).
 */
export async function openPdfjs(bytes: Uint8Array, name = "This PDF") {
  const { PdfError, hasPdfHeader } = await import("./pdf-utils");
  if (!hasPdfHeader(bytes)) throw new PdfError("not-pdf", `${name} isn't a PDF. Choose a file that ends in .pdf.`);
  const m = await pdfjs();
  const task = m.getDocument({
    data: bytes.slice(),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    useWasm: false,
    enableXfa: false,
  });
  try {
    const doc = await task.promise;
    if (doc.numPages === 0) throw new PdfError("empty", `${name} has no pages.`);
    return { doc, lib: m, destroy: () => void task.destroy() };
  } catch (e) {
    void task.destroy();
    if (e instanceof PdfError) throw e;
    const n = (e as { name?: string })?.name;
    // Some protected PDFs fail before pdf.js asks for a password; an /Encrypt entry tells us why.
    const encrypted = n === "PasswordException" || /\/Encrypt[\s/<\d]/.test(new TextDecoder("latin1").decode(bytes.subarray(Math.max(0, bytes.length - 4096))) + new TextDecoder("latin1").decode(bytes.subarray(0, 4096)));
    if (encrypted) throw new PdfError("encrypted", `${name} appears to be password protected. Please upload an unlocked copy.`);
    throw new PdfError("damaged", `${name} couldn't be opened. It may be damaged or incomplete.`);
  }
}
