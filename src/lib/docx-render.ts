/**
 * Word (.docx) → PDF in the browser. docx-preview turns the document into
 * HTML/CSS (page size, margins, headers/footers, tables, images); the browser's
 * own print engine then writes a text-selectable PDF. Nothing is uploaded.
 *
 * Two print strategies, chosen per document after measuring the render:
 * - "paged": every rendered page fits its page box (documents saved by Word
 *   include page-break hints) → one rendered page per PDF page, headers and
 *   footers on each.
 * - "flow": some rendered page is taller than the paper → content flows across
 *   pages with the document's margins; headers/footers can only appear once.
 */

export type DocKind = "docx" | "legacy-doc" | "not-word";

export function sniffWord(b: Uint8Array): DocKind {
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return "docx";
  if ([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((v, i) => b[i] === v)) return "legacy-doc";
  return "not-word";
}

export class WordError extends Error {}

/** Checks a .docx zip really contains a Word document (and isn't e.g. an .xlsx renamed). */
export async function checkDocx(bytes: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  let zip: import("jszip");
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new WordError("This file couldn't be opened. It may be damaged or incomplete.");
  }
  if (!zip.file("word/document.xml")) throw new WordError("This file is a zip archive but not a Word document. Choose a .docx file.");
}

const PT_PX = 96 / 72;
const toPt = (v: string) => {
  const m = /^([\d.]+)(pt|px|in|cm|mm)?$/.exec(v.trim());
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] === "px" ? n / PT_PX : m[2] === "in" ? n * 72 : m[2] === "cm" ? (n * 72) / 2.54 : m[2] === "mm" ? (n * 72) / 25.4 : n;
};

export interface PageInfo {
  w: number; // pt
  h: number;
  margins: [number, number, number, number]; // top right bottom left, pt
}

export interface Rendered {
  pages: PageInfo[];
  mode: "paged" | "flow";
  words: number;
  images: number;
  tables: number;
  headers: boolean;
  missingImages: number;
}

/** Removes anything that could run code or navigate somewhere unsafe. */
export function sanitize(root: HTMLElement) {
  root.querySelectorAll("script, iframe, object, embed, link[rel=import], meta, base, form").forEach((n) => n.remove());
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    for (const a of [...el.attributes]) {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      if ((a.name === "href" || a.name === "xlink:href") && !/^(https?:|mailto:|#)/i.test(a.value.trim())) el.removeAttribute(a.name);
      if (a.name === "src" && !/^(data:image\/|blob:)/i.test(a.value.trim())) el.removeAttribute(a.name);
    }
    if (el.tagName === "A") {
      el.setAttribute("rel", "noopener noreferrer nofollow");
      el.setAttribute("target", "_blank");
    }
  });
}

export async function renderDocx(bytes: Uint8Array, container: HTMLElement): Promise<Rendered> {
  const kind = sniffWord(bytes);
  if (kind === "legacy-doc")
    throw new WordError("This is an older .doc file (or a password-protected .docx). Old .doc files can't be converted in the browser — open it in Word, Google Docs or LibreOffice, save it as .docx, then try again.");
  if (kind === "not-word") throw new WordError("This doesn't look like a Word document. Choose a .docx file.");
  await checkDocx(bytes);
  const { renderAsync } = await import("docx-preview");
  container.replaceChildren();
  try {
    await renderAsync(new Blob([bytes as BlobPart]), container, container, {
      className: "docx",
      inWrapper: true,
      hideWrapperOnPrint: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      experimental: false,
      trimXmlDeclaration: true,
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      renderComments: false,
      renderChanges: false,
      renderAltChunks: false, // embedded HTML chunks are never rendered
      debug: false,
    });
  } catch {
    throw new WordError("This Word document couldn't be read. It may be damaged, or use features we can't display.");
  }
  sanitize(container);
  // Wait for images to decode so measurements are right.
  const imgs = [...container.querySelectorAll("img")];
  await Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => ((i.onload = r), (i.onerror = r))))));
  if (document.fonts?.ready) await document.fonts.ready;

  const sections = [...container.querySelectorAll<HTMLElement>("section.docx")];
  if (!sections.length) throw new WordError("This Word document appears to be empty.");
  const pages: PageInfo[] = sections.map((s) => ({
    w: toPt(s.style.width) || 595.3,
    h: toPt(s.style.minHeight || s.style.height) || 841.9,
    margins: [toPt(s.style.paddingTop), toPt(s.style.paddingRight), toPt(s.style.paddingBottom), toPt(s.style.paddingLeft)],
  }));
  const fits = sections.every((s, i) => s.offsetHeight <= pages[i].h * PT_PX + 3);
  const text = sections.map((s) => s.textContent ?? "").join(" ");
  return {
    pages,
    mode: fits ? "paged" : "flow",
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    images: imgs.length,
    missingImages: imgs.filter((i) => !i.naturalWidth).length,
    tables: container.querySelectorAll("table").length,
    headers: !!container.querySelector("header, footer"),
  };
}

/** Prints one or more rendered documents as a single print job (→ "Save as PDF"). */
export function printDocx(docs: { container: HTMLElement; info: Rendered }[], title: string) {
  document.getElementById("docx-print-root")?.remove();
  document.getElementById("docx-print-style")?.remove();
  const root = document.createElement("div");
  root.id = "docx-print-root";
  const rules: string[] = [];
  const sizes = new Map<string, string>();
  docs.forEach(({ container, info }, d) => {
    const clone = container.cloneNode(true) as HTMLElement;
    // Drop the preview's own classes/styles (zoom, off-screen positioning for inactive documents).
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    clone.removeAttribute("aria-hidden");
    const sections = [...clone.querySelectorAll<HTMLElement>("section.docx")];
    sections.forEach((s, i) => {
      const p = info.pages[i] ?? info.pages[0];
      const key = `${p.w.toFixed(1)}x${p.h.toFixed(1)}${info.mode === "flow" ? `-m${p.margins.map((m) => m.toFixed(0)).join("-")}` : ""}`;
      if (!sizes.has(key)) {
        const name = `docx${sizes.size}`;
        sizes.set(key, name);
        rules.push(`@page ${name} { size: ${p.w}pt ${p.h}pt; margin: ${info.mode === "flow" ? p.margins.map((m) => `${m}pt`).join(" ") : "0"}; }`);
      }
      s.style.setProperty("page", sizes.get(key)!);
      if (info.mode === "paged") s.style.height = `${p.h}pt`;
      s.dataset.printMode = info.mode;
      const last = d === docs.length - 1 && i === sections.length - 1;
      s.style.breakAfter = last ? "auto" : "page";
    });
    root.appendChild(clone);
  });
  const style = document.createElement("style");
  style.id = "docx-print-style";
  style.textContent = `
@media screen { #docx-print-root { display: none; } }
@media print {
  ${rules.join("\n  ")}
  body[data-print="docx"] > :not(#docx-print-root) { display: none !important; }
  body[data-print="docx"] { background: #fff !important; }
  /* The site's generic print rules hide everything under body[data-print]; show the document. */
  body[data-print="docx"] #docx-print-root, body[data-print="docx"] #docx-print-root * { visibility: visible !important; }
  #docx-print-root .docx-wrapper { background: none !important; padding: 0 !important; display: block !important; }
  #docx-print-root section.docx { box-shadow: none !important; margin: 0 !important; overflow: hidden; }
  #docx-print-root section.docx[data-print-mode="flow"] { padding: 0 !important; min-height: 0 !important; width: auto !important; overflow: visible; }
}`;
  document.head.appendChild(style);
  document.body.appendChild(root);
  document.body.dataset.print = "docx";
  const oldTitle = document.title;
  document.title = title;
  const cleanup = () => {
    root.remove();
    style.remove();
    if (document.body.dataset.print === "docx") delete document.body.dataset.print;
    document.title = oldTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

/** Removes any print clone left behind (e.g. a browser that never fired afterprint). */
export function clearDocxPrint() {
  document.getElementById("docx-print-root")?.remove();
  document.getElementById("docx-print-style")?.remove();
  if (document.body.dataset.print === "docx") delete document.body.dataset.print;
}

export const pageLabel = (p: PageInfo) => {
  const [a, b] = [Math.min(p.w, p.h), Math.max(p.w, p.h)];
  const near = (x: number, y: number) => Math.abs(a - x) < 4 && Math.abs(b - y) < 4;
  const name = near(595.3, 841.9) ? "A4" : near(612, 792) ? "Letter" : near(612, 1008) ? "Legal" : near(419.5, 595.3) ? "A5" : `${Math.round(p.w)} × ${Math.round(p.h)} pt`;
  return `${name} ${p.w > p.h ? "landscape" : "portrait"}`;
};
