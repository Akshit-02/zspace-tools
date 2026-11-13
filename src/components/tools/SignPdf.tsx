"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Download, Redo2, Scale, Trash2, Type, Undo2, X } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { PdfPageCanvas } from "./pdf/PdfPageCanvas";
import { OverlayLayer, fitText } from "./pdf/OverlayLayer";
import { SignaturePad } from "./SignaturePad";
import { exportWithOverlays, newId, type OverlayObject } from "@/lib/pdf-overlay";
import type { PlacedImage } from "@/lib/overlay-image";
import { useHistory } from "@/lib/use-history";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

interface Sig extends PlacedImage {
  id: string;
  label: string;
}

const DATE_FORMATS = [
  { id: "dmy", label: "13/11/2026", fmt: (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` },
  { id: "mdy", label: "11/13/2026", fmt: (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}` },
  { id: "long", label: "13 Nov 2026", fmt: (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
  { id: "iso", label: "2026-11-13", fmt: (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` },
] as const;

export default function SignPdf() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: 500 });
  const hist = useHistory<OverlayObject[]>([]);
  const objects = hist.value;
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [dateFmt, setDateFmt] = useState<(typeof DATE_FORMATS)[number]["id"]>("dmy");
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const queue = useThumbQueue(pdf?.doc ?? null, 120);
  const info = pdf?.pages[page];
  const scale = fitScale;
  const unsaved = objects.length > 0 && hist.changes !== savedAt;

  useEffect(() => {
    track("tool_opened", { tool: "sign-pdf" });
  }, []);
  useEffect(() => {
    const el = viewport.current;
    if (!el || !info) return;
    const fit = () => setFitScale(Math.max(0.3, Math.min(2, (el.clientWidth - 32) / info.w)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [info]);
  useEffect(() => {
    if (!unsaved) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsaved]);
  // Signatures are never stored: their object URLs are released when you leave.
  const sigRef = useRef(sigs);
  useEffect(() => {
    sigRef.current = sigs;
  }, [sigs]);
  useEffect(() => () => sigRef.current.forEach((s) => URL.revokeObjectURL(s.src)), []);

  const pageObjects = useMemo(() => objects.filter((o) => o.page === page), [objects, page]);
  const sel = objects.find((o) => o.id === selected) ?? null;
  const patch = useCallback((id: string, p: Partial<OverlayObject>) => hist.preview((l) => l.map((o) => (o.id === id ? { ...o, ...p } : o))), [hist]);
  const remove = useCallback(
    (id: string) => {
      hist.set((l) => l.filter((o) => o.id !== id));
      setSelected(null);
    },
    [hist],
  );
  const add = (o: OverlayObject) => {
    hist.set((l) => [...l, o]);
    setSelected(o.id);
    setDone(null);
  };

  const placeSig = (sig: Sig, at?: { x: number; y: number }) => {
    if (!info) return;
    const w = Math.min(info.w * 0.3, 180);
    const h = (w * sig.height) / sig.width;
    const x = at ? at.x - w / 2 : info.w * 0.6 - w / 2;
    const y = at ? at.y - h / 2 : info.h * 0.8 - h / 2;
    add({ id: newId(), kind: "image", page, x: Math.max(0, Math.min(info.w - w, x)), y: Math.max(0, Math.min(info.h - h, y)), w, h, rot: 0, color: "#000000", src: sig.src, bytes: sig.bytes, mime: sig.mime });
    track("content_generated", { tool: "sign-pdf", format: "place" });
  };
  const addText = (text: string, size = 12) => {
    if (!info) return;
    const o: OverlayObject = { id: newId(), kind: "text", page, x: info.w * 0.6 - 60, y: info.h * 0.88, w: 160, h: 0, rot: 0, color: "#1a1a1a", text, size, family: "sans" };
    o.h = fitText(o);
    add(o);
  };
  const copyToAllPages = () => {
    if (!sel || !pdf) return;
    const src = pdf.pages[sel.page];
    const copies: OverlayObject[] = [];
    pdf.pages.forEach((p, i) => {
      if (i === sel.page) return;
      // Same relative position on pages of a different size.
      const kx = p.w / src.w;
      const ky = p.h / src.h;
      const k = Math.min(kx, ky);
      copies.push({ ...sel, id: newId(), page: i, x: sel.x * kx, y: sel.y * ky, w: sel.w * k, h: sel.h * k });
    });
    hist.set((l) => [...l, ...copies]);
    setDone(`Copied to ${copies.length} other page${copies.length === 1 ? "" : "s"}.`);
  };

  const save = async () => {
    if (!pdf) return;
    setBusy(true);
    setExportError(null);
    try {
      const out = await exportWithOverlays(pdf.bytes, objects);
      const name = `${baseName(pdf.file.name)}-signed.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      setSavedAt(hist.changes);
      const pages = new Set(objects.map((o) => o.page)).size;
      setDone(`Saved ${name} (${formatBytes(out.byteLength)}) — ${objects.length} item${objects.length === 1 ? "" : "s"} on ${pages} page${pages === 1 ? "" : "s"}.`);
      track("download_clicked", { tool: "sign-pdf", format: "pdf", count: objects.length });
    } catch {
      setExportError("The signed PDF couldn't be created. The file may be protected or use features we can't write to.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    sigs.forEach((s) => URL.revokeObjectURL(s.src));
    setSigs([]);
    hist.reset([]);
    close();
    setPage(0);
    setDone(null);
    setSavedAt(0);
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (r) {
              hist.reset([]);
              setPage(0);
              track("file_uploaded", { tool: "sign-pdf", file_count: 1, size_bucket: sizeBucket(r.file.size) });
            }
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to sign"}
          subtitle="or click to choose — signed on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  return (
    <div className="grid gap-3 lg:grid-cols-[130px_1fr_300px] [&>*]:min-w-0">
      <Panel className="hidden max-h-[80vh] overflow-auto p-2 lg:block">
        <ol className="grid gap-2" aria-label="Pages">
          {pdf.pages.map((_, i) => {
            const n = objects.filter((o) => o.page === i).length;
            return (
              <li key={i}>
                <button type="button" onClick={() => setPage(i)} aria-current={i === page} aria-label={`Page ${i + 1}${n ? `, ${n} signed items` : ""}`} className={clsx("block w-full overflow-hidden rounded-[8px] border-2", i === page ? "border-orange" : "border-line")}>
                  <PdfThumb page={i + 1} queue={queue} />
                  <span className="flex justify-between px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">
                    {i + 1}
                    {n > 0 && <span className="text-orange-ink">✓{n}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Panel>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 font-mono text-xs" aria-live="polite">
              Page {page + 1} / {pdf.pages.length}
            </span>
            <button type="button" aria-label="Next page" disabled={page >= pdf.pages.length - 1} onClick={() => setPage((p) => p + 1)} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Undo" onClick={hist.undo} disabled={!hist.canUndo} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
              <Undo2 className="size-4" />
            </button>
            <button type="button" aria-label="Redo" onClick={hist.redo} disabled={!hist.canRedo} className="grid size-8 place-items-center rounded-[8px] border border-line-strong disabled:opacity-30">
              <Redo2 className="size-4" />
            </button>
            <button type="button" onClick={save} disabled={busy || !objects.length} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              <Download aria-hidden className="size-4" /> {busy ? "Saving…" : "Download signed PDF"}
            </button>
          </div>
        </div>
        <div ref={viewport} className="max-h-[80vh] overflow-auto rounded-[14px] border border-line bg-[#e9e4dc] p-4">
          <div
            ref={stage}
            data-testid="sign-stage"
            className="relative mx-auto touch-none shadow-md"
            style={{ width: info!.w * scale, height: info!.h * scale }}
            onPointerDown={(e) => !(e.target as HTMLElement).closest("[data-obj]") && setSelected(null)}
            onDragOver={(e) => e.dataTransfer.types.includes("text/x-signature") && e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/x-signature");
              const sig = sigs.find((s) => s.id === id);
              if (!sig) return;
              e.preventDefault();
              const r = stage.current!.getBoundingClientRect();
              placeSig(sig, { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale });
            }}
          >
            <PdfPageCanvas doc={pdf.doc} page={page + 1} scale={scale} />
            <OverlayLayer objects={pageObjects} scale={scale} selected={selected} editing={editing} onSelect={setSelected} onEdit={setEditing} onPreview={patch} onCommit={hist.commit} onRemove={remove} allowRotate lockRatio={(o) => o.kind === "image"} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Panel className="p-4">
          <p className="text-sm font-bold">1 · Create your signature</p>
          <div className="mt-3">
            <SignaturePad onCreate={(img, label) => setSigs((s) => [...s, { ...img, id: newId(), label }])} />
          </div>
        </Panel>
        {sigs.length > 0 && (
          <Panel className="p-4">
            <p className="text-sm font-bold">2 · Place it on the page</p>
            <p className="mt-1 text-xs text-ink-2">Drag onto the page, or press Place. Then move, resize or rotate it.</p>
            <ul className="mt-3 grid gap-2" data-testid="sig-list">
              {sigs.map((s) => (
                <li key={s.id} draggable onDragStart={(e) => (e.dataTransfer.setData("text/x-signature", s.id), (e.dataTransfer.effectAllowed = "copy"))} className="flex items-center gap-2 rounded-[10px] border border-line p-2">
                  <div className="checker grid h-12 min-w-0 flex-1 cursor-grab place-items-center rounded-[6px] px-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.src} alt={s.label} className="max-h-full max-w-full object-contain" />
                  </div>
                  <button type="button" onClick={() => placeSig(s)} className="h-8 shrink-0 rounded-[8px] bg-charcoal px-3 text-xs font-medium text-ivory">
                    Place
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${s.label}`}
                    onClick={() => {
                      URL.revokeObjectURL(s.src);
                      setSigs((l) => l.filter((x) => x.id !== s.id));
                      hist.set((l) => l.filter((o) => o.src !== s.src));
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 hover:text-error"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel className="p-4">
          <p className="text-sm font-bold">Add date or name</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <select aria-label="Date format" value={dateFmt} onChange={(e) => setDateFmt(e.target.value as typeof dateFmt)} className="h-8 rounded-[6px] border border-line-strong px-2 font-mono text-xs">
              {DATE_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => addText(DATE_FORMATS.find((f) => f.id === dateFmt)!.fmt(new Date()))} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 text-xs hover:border-charcoal">
              <CalendarDays aria-hidden className="size-3.5" /> Add date
            </button>
            <button type="button" onClick={() => addText("Your name")} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 text-xs hover:border-charcoal">
              <Type aria-hidden className="size-3.5" /> Add name / initials
            </button>
          </div>
          {sel?.kind === "text" && (
            <div className="mt-3">
              <label htmlFor="sign-text" className="text-xs text-ink-2">
                Text
              </label>
              <input id="sign-text" value={sel.text ?? ""} onChange={(e) => hist.set((l) => l.map((o) => (o.id === sel.id ? { ...o, text: e.target.value, h: fitText({ ...o, text: e.target.value }) } : o)))} className="mt-1 h-9 w-full rounded-[8px] border border-line-strong px-2 text-sm" />
            </div>
          )}
          {sel && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pdf.pages.length > 1 && (
                <button type="button" onClick={copyToAllPages} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 text-xs hover:border-charcoal">
                  <Copy aria-hidden className="size-3.5" /> Copy to all pages
                </button>
              )}
              <button type="button" onClick={() => remove(sel.id)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 text-xs text-error hover:border-error">
                <Trash2 aria-hidden className="size-3.5" /> Remove
              </button>
            </div>
          )}
        </Panel>
        {done && <Notice tone="success">{done}</Notice>}
        {exportError && <Notice tone="error">{exportError}</Notice>}
        <div className="rounded-[12px] border border-line bg-ivory p-3 text-xs leading-relaxed text-ink-2" data-testid="sign-legal">
          <p className="flex items-start gap-2">
            <Scale aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>
              This adds a <b className="text-charcoal">visual signature</b> — an image of your signature on the page. It isn&apos;t a certificate-based digital signature, doesn&apos;t verify your identity, and whether it&apos;s legally valid depends on the document, your country and how it&apos;s signed. For regulated documents, use an approved e-signature service.
            </span>
          </p>
        </div>
        <button type="button" onClick={reset} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
          <X aria-hidden className="size-4" /> {unsaved ? "Discard and start again" : "Start again"}
        </button>
      </div>
    </div>
  );
}
