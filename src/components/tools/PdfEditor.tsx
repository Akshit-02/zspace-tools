"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bold,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  Highlighter,
  ImagePlus,
  Info,
  Minus,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { PdfPageCanvas } from "./pdf/PdfPageCanvas";
import { OverlayLayer, fitText } from "./pdf/OverlayLayer";
import { exportWithOverlays, newId, type Kind, type OverlayObject } from "@/lib/pdf-overlay";
import { prepareImage } from "@/lib/overlay-image";
import { useHistory } from "@/lib/use-history";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";
import type { Family } from "@/lib/pdf-text";

type Tool = "select" | "text" | "image" | "path" | "rect" | "ellipse" | "arrow" | "line" | "highlight" | "underline" | "note";

const TOOLS: { id: Tool; label: string; icon: React.ComponentType<{ className?: string }>; key: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, key: "v" },
  { id: "text", label: "Text", icon: Type, key: "t" },
  { id: "image", label: "Image", icon: ImagePlus, key: "i" },
  { id: "path", label: "Draw", icon: PenLine, key: "d" },
  { id: "rect", label: "Rectangle", icon: Square, key: "r" },
  { id: "ellipse", label: "Circle", icon: Circle, key: "o" },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight, key: "a" },
  { id: "line", label: "Line", icon: Minus, key: "l" },
  { id: "highlight", label: "Highlight", icon: Highlighter, key: "h" },
  { id: "underline", label: "Underline", icon: Underline, key: "u" },
  { id: "note", label: "Note", icon: StickyNote, key: "n" },
];
const SWATCHES = ["#252525", "#d6342b", "#F07845", "#e6b400", "#2f8f4e", "#1f6fd1", "#7a3db8", "#ffffff"];
const MAX_MB = 100;
const MAX_PAGES = 500;

export default function PdfEditor() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: Math.min(limits.pdfMaxMB, MAX_MB), maxPages: MAX_PAGES });
  const hist = useHistory<OverlayObject[]>([]);
  const objects = hist.value;
  const [page, setPage] = useState(0);
  const [tool, setTool] = useState<Tool>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [color, setColor] = useState("#d6342b");
  const [stroke, setStroke] = useState(2);
  const [size, setSize] = useState(16);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [fitScale, setFitScale] = useState(1);
  const [savedAt, setSavedAt] = useState(0); // history length at last export
  const [confirmClose, setConfirmClose] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ kind: Tool; x0: number; y0: number; x1: number; y1: number; pts: [number, number][] } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const pendingImagePoint = useRef<{ x: number; y: number } | null>(null);
  const queue = useThumbQueue(pdf?.doc ?? null, 120);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-editor" });
  }, []);

  const info = pdf?.pages[page];
  const scale = zoom === "fit" ? fitScale : zoom;
  const unsaved = objects.length > 0 && hist.changes !== savedAt;

  // Fit page width to the viewport.
  useEffect(() => {
    const el = viewport.current;
    if (!el || !info) return;
    const fit = () => setFitScale(Math.max(0.25, Math.min(2.5, (el.clientWidth - 32) / info.w)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [info]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!unsaved) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsaved]);

  // Free image object URLs on unmount.
  const objRef = useRef(objects);
  useEffect(() => {
    objRef.current = objects;
  }, [objects]);
  useEffect(() => () => objRef.current.forEach((o) => o.src?.startsWith("blob:") && URL.revokeObjectURL(o.src)), []);

  const sel = objects.find((o) => o.id === selected) ?? null;
  const pageObjects = useMemo(() => objects.filter((o) => o.page === page), [objects, page]);

  const patch = useCallback((id: string, p: Partial<OverlayObject>) => hist.preview((list) => list.map((o) => (o.id === id ? { ...o, ...p } : o))), [hist]);
  const add = (o: OverlayObject) => {
    hist.set((list) => [...list, o]);
    setSelected(o.id);
    setDone(null);
  };
  const remove = useCallback(
    (id: string) => {
      hist.set((list) => list.filter((o) => o.id !== id));
      setSelected(null);
      setEditing(null);
    },
    [hist],
  );
  const setProp = (p: Partial<OverlayObject>) => {
    if (!sel) return;
    const next = { ...sel, ...p };
    if (sel.kind === "text" && ("size" in p || "family" in p || "bold" in p || "text" in p)) next.h = fitText(next);
    hist.set((list) => list.map((o) => (o.id === sel.id ? next : o)));
  };

  // Keyboard shortcuts.
  useEffect(() => {
    if (!pdf) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) hist.redo();
        else hist.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        hist.redo();
      } else if (!mod && !e.altKey) {
        const tl = TOOLS.find((x) => x.key === e.key.toLowerCase());
        if (tl && !t.closest("[data-obj]")) {
          if (tl.id === "image") imageInput.current?.click();
          else setTool(tl.id);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pdf, hist]);

  const pointFrom = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: Math.min(info!.w, Math.max(0, (e.clientX - r.left) / scale)), y: Math.min(info!.h, Math.max(0, (e.clientY - r.top) / scale)) };
  };

  const base = { page, rot: 0, color, stroke };
  const onStageDown = (e: React.PointerEvent) => {
    if (!info || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-obj]")) return;
    setEditing(null);
    const p = pointFrom(e);
    if (tool === "select") {
      setSelected(null);
      return;
    }
    // Stop the click from moving focus to the page, so a new text box keeps the caret.
    e.preventDefault();
    if (tool === "text") {
      const o: OverlayObject = { ...base, id: newId(), kind: "text", x: p.x, y: p.y, w: Math.min(260, info.w - p.x - 4), h: 0, text: "", size, family: "sans" as Family };
      o.h = fitText({ ...o, text: "M" });
      add(o);
      setEditing(o.id);
      setTool("select");
      return;
    }
    if (tool === "note") {
      add({ ...base, id: newId(), kind: "note", x: p.x - 12, y: p.y - 12, w: 24, h: 24, color: "#e6b400", text: "" });
      setTool("select");
      return;
    }
    if (tool === "image") {
      pendingImagePoint.current = p;
      imageInput.current?.click();
      return;
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDraft({ kind: tool, x0: p.x, y0: p.y, x1: p.x, y1: p.y, pts: [[p.x, p.y]] });
  };
  const onStageMove = (e: React.PointerEvent) => {
    if (!draft) return;
    const p = pointFrom(e);
    setDraft((d) => (d ? { ...d, x1: p.x, y1: p.y, pts: d.kind === "path" ? [...d.pts, [p.x, p.y]] : d.pts } : d));
  };
  const onStageUp = () => {
    const d = draft;
    setDraft(null);
    if (!d) return;
    let x = Math.min(d.x0, d.x1);
    let y = Math.min(d.y0, d.y1);
    let w = Math.abs(d.x1 - d.x0);
    let h = Math.abs(d.y1 - d.y0);
    const tiny = w < 4 && h < 4;
    if (d.kind === "path") {
      if (d.pts.length < 2) return;
      const xs = d.pts.map((p) => p[0]);
      const ys = d.pts.map((p) => p[1]);
      x = Math.min(...xs);
      y = Math.min(...ys);
      w = Math.max(1, Math.max(...xs) - x);
      h = Math.max(1, Math.max(...ys) - y);
      add({ ...base, id: newId(), kind: "path", x, y, w, h, points: d.pts.map(([px, py]) => [(px - x) / w, (py - y) / h]) });
      return;
    }
    if (d.kind === "underline") {
      if (tiny) w = 120;
      const hh = Math.max(6, stroke * 3);
      add({ ...base, id: newId(), kind: "underline", x: tiny ? d.x0 : x, y: d.y0 - hh / 2, w, h: hh });
      return;
    }
    if (tiny) {
      w = d.kind === "highlight" ? 140 : 120;
      h = d.kind === "highlight" ? 18 : d.kind === "line" || d.kind === "arrow" ? 0.01 : 70;
      x = d.x0;
      y = d.y0;
    }
    const kind = d.kind as Kind;
    const dx = d.x1 - d.x0;
    const dy = d.y1 - d.y0;
    add({
      ...base,
      id: newId(),
      kind,
      x,
      y,
      w,
      h,
      color: kind === "highlight" ? (color === "#252525" ? "#ffe14d" : color) : color,
      opacity: kind === "highlight" ? 0.35 : 1,
      fill: null,
      flip: kind === "line" || kind === "arrow" ? dx * dy < 0 : undefined,
      rev: kind === "line" || kind === "arrow" ? dx < 0 || (dx === 0 && dy < 0) : undefined,
    });
  };

  const onImageFile = async (file: File | undefined) => {
    if (!file || !info) return;
    try {
      const img = await prepareImage(file);
      const maxW = info.w * 0.45;
      const w = Math.min(maxW, (img.width * 72) / 96);
      const h = (w * img.height) / img.width;
      const at = pendingImagePoint.current ?? { x: (info.w - w) / 2, y: (info.h - h) / 2 };
      add({ ...base, id: newId(), kind: "image", x: Math.min(at.x, info.w - w), y: Math.min(at.y, info.h - h), w, h, src: img.src, bytes: img.bytes, mime: img.mime });
      setTool("select");
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "That image couldn't be added.");
    } finally {
      pendingImagePoint.current = null;
    }
  };

  const save = async () => {
    if (!pdf) return;
    setBusy(true);
    setExportError(null);
    try {
      const out = await exportWithOverlays(pdf.bytes, objects);
      const name = `${baseName(pdf.file.name)}-edited.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      setSavedAt(hist.changes);
      setDone(`Saved ${name} (${formatBytes(out.byteLength)}) with ${objects.length} addition${objects.length === 1 ? "" : "s"}.`);
      track("download_clicked", { tool: "pdf-editor", format: "pdf", count: objects.length });
    } catch {
      setExportError("The edited PDF couldn't be created. The file may use features we can't write to — try saving a copy of it first.");
    } finally {
      setBusy(false);
    }
  };

  const reallyClose = () => {
    objects.forEach((o) => o.src?.startsWith("blob:") && URL.revokeObjectURL(o.src));
    hist.reset([]);
    close();
    setPage(0);
    setSelected(null);
    setConfirmClose(false);
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
              track("file_uploaded", { tool: "pdf-editor", file_count: 1, size_bucket: sizeBucket(r.file.size) });
            }
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to edit"}
          subtitle="or click to choose — edited on your device"
          formats={["PDF", `up to ${MAX_MB} MB`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const toolBtn = "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.82rem] transition-colors";
  const drawPreview = draft && draft.kind !== "path" ? { x: Math.min(draft.x0, draft.x1), y: Math.min(draft.y0, draft.y1), w: Math.abs(draft.x1 - draft.x0), h: Math.abs(draft.y1 - draft.y0) } : null;

  return (
    <div className="grid gap-3 [&>*]:min-w-0">
      {/* Toolbar */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-card/95 p-2 backdrop-blur" data-testid="editor-toolbar">
        <div role="toolbar" aria-label="Editing tools" className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto sm:w-auto">
          {TOOLS.map((t) => (
            <button key={t.id} type="button" aria-pressed={tool === t.id} title={`${t.label} (${t.key.toUpperCase()})`} onClick={() => (t.id === "image" ? imageInput.current?.click() : setTool(t.id))} className={clsx(toolBtn, tool === t.id ? "bg-charcoal text-ivory" : "text-ink-2 hover:bg-ivory-2 hover:text-charcoal")}>
              <t.icon className="size-4" /> <span className="hidden xl:inline">{t.label}</span>
              <span className="sr-only xl:hidden">{t.label}</span>
            </button>
          ))}
        </div>
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <div className="flex items-center gap-1" role="group" aria-label="Colour">
          {SWATCHES.map((c) => (
            <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => (sel ? (setColor(c), setProp({ color: c })) : setColor(c))} className={clsx("size-6 rounded-full border", color === c ? "ring-2 ring-orange ring-offset-1" : "border-line-strong")} style={{ background: c }} />
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-ink-2">
          Line
          <select value={stroke} onChange={(e) => (setStroke(Number(e.target.value)), sel && setProp({ stroke: Number(e.target.value) }))} className="h-8 rounded-[6px] border border-line-strong bg-card px-1 font-mono text-xs">
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n} pt
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={clsx(toolBtn, "text-ink-2 hover:bg-ivory-2 disabled:opacity-35")} onClick={hist.undo} disabled={!hist.canUndo} aria-label="Undo">
            <Undo2 className="size-4" />
          </button>
          <button type="button" className={clsx(toolBtn, "text-ink-2 hover:bg-ivory-2 disabled:opacity-35")} onClick={hist.redo} disabled={!hist.canRedo} aria-label="Redo">
            <Redo2 className="size-4" />
          </button>
          <button type="button" onClick={save} disabled={busy || objects.length === 0} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
            <Download aria-hidden className="size-4" /> {busy ? "Saving…" : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[150px_1fr_260px] [&>*]:min-w-0">
        {/* Thumbnails */}
        <Panel className="hidden max-h-[78vh] overflow-auto p-2 lg:block">
          <ol className="grid gap-2" aria-label="Pages">
            {pdf.pages.map((_, i) => {
              const n = objects.filter((o) => o.page === i).length;
              return (
                <li key={i}>
                  <button type="button" onClick={() => setPage(i)} aria-current={i === page} aria-label={`Page ${i + 1}${n ? `, ${n} edits` : ""}`} className={clsx("block w-full overflow-hidden rounded-[8px] border-2 text-left", i === page ? "border-orange" : "border-line hover:border-line-strong")}>
                    <PdfThumb page={i + 1} queue={queue} />
                    <span className="flex justify-between px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">
                      {i + 1}
                      {n > 0 && <span className="text-orange-ink">●{n}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Panel>

        {/* Stage */}
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
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
              <button type="button" aria-label="Zoom out" onClick={() => setZoom(Math.max(0.25, Math.round((scale - 0.25) * 4) / 4))} className="grid size-8 place-items-center rounded-[8px] border border-line-strong">
                <Minus className="size-3.5" />
              </button>
              <button type="button" onClick={() => setZoom("fit")} className="h-8 min-w-14 rounded-[8px] border border-line-strong px-2 font-mono text-xs" aria-label="Fit page width">
                {Math.round(scale * 100)}%
              </button>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom(Math.min(4, Math.round((scale + 0.25) * 4) / 4))} className="grid size-8 place-items-center rounded-[8px] border border-line-strong">
                <Plus className="size-3.5" />
              </button>
            </div>
            <span className={clsx("w-full font-mono text-xs sm:w-auto", unsaved ? "text-orange-ink" : "text-ink-3")} data-testid="editor-status" aria-live="polite">
              {unsaved ? "● Unsaved changes" : objects.length ? "All changes downloaded" : "No changes yet"}
            </span>
          </div>
          <div ref={viewport} className="max-h-[78vh] overflow-auto rounded-[14px] border border-line bg-[#e9e4dc] p-4">
            <div
              ref={stage}
              data-testid="editor-stage"
              onPointerDown={onStageDown}
              onPointerMove={onStageMove}
              onPointerUp={onStageUp}
              className={clsx("relative mx-auto touch-none shadow-md", tool !== "select" && "cursor-crosshair")}
              style={{ width: info!.w * scale, height: info!.h * scale }}
            >
              <PdfPageCanvas doc={pdf.doc} page={page + 1} scale={scale} />
              <OverlayLayer
                objects={pageObjects}
                scale={scale}
                selected={selected}
                editing={editing}
                onSelect={(id) => {
                  setSelected(id);
                  if (id) setTool("select");
                }}
                onEdit={setEditing}
                onPreview={patch}
                onCommit={hist.commit}
                onRemove={remove}
                lockRatio={(o) => o.kind === "image"}
                allowRotate
                interactive={tool === "select"}
              />
              {draft && (
                <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
                  {draft.kind === "path" ? (
                    <polyline points={draft.pts.map(([x, y]) => `${x * scale},${y * scale}`).join(" ")} fill="none" stroke={color} strokeWidth={stroke * scale} strokeLinecap="round" strokeLinejoin="round" />
                  ) : draft.kind === "line" || draft.kind === "arrow" || draft.kind === "underline" ? (
                    <line x1={draft.x0 * scale} y1={draft.y0 * scale} x2={draft.x1 * scale} y2={(draft.kind === "underline" ? draft.y0 : draft.y1) * scale} stroke={color} strokeWidth={stroke * scale} />
                  ) : (
                    drawPreview && (draft.kind === "ellipse" ? <ellipse cx={(drawPreview.x + drawPreview.w / 2) * scale} cy={(drawPreview.y + drawPreview.h / 2) * scale} rx={(drawPreview.w / 2) * scale} ry={(drawPreview.h / 2) * scale} fill="none" stroke={color} strokeWidth={stroke * scale} /> : <rect x={drawPreview.x * scale} y={drawPreview.y * scale} width={drawPreview.w * scale} height={drawPreview.h * scale} fill={draft.kind === "highlight" ? "#ffe14d" : "none"} opacity={draft.kind === "highlight" ? 0.35 : 1} stroke={draft.kind === "highlight" ? "none" : color} strokeWidth={stroke * scale} />)
                  )}
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="flex min-w-0 flex-col gap-3">
          <Panel className="p-4">
            <p className="text-sm font-bold">{sel ? `Selected: ${TOOLS.find((t) => t.id === sel.kind)?.label ?? sel.kind}` : "Properties"}</p>
            {!sel && <p className="mt-1 text-xs text-ink-2">Pick a tool, then click or drag on the page. Select an addition to move, resize or style it.</p>}
            {sel && (sel.kind === "text" || sel.kind === "note") && (
              <div className="mt-3">
                <label htmlFor="ed-text" className="text-xs text-ink-2">
                  {sel.kind === "note" ? "Note text (shown in PDF readers)" : "Text"}
                </label>
                <textarea id="ed-text" value={sel.text ?? ""} rows={3} onChange={(e) => setProp({ text: e.target.value })} className="mt-1 w-full rounded-[8px] border border-line-strong p-2 text-sm" autoFocus={sel.kind === "note" && !sel.text} />
              </div>
            )}
            {sel?.kind === "text" && (
              <div className="mt-3 grid gap-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="ed-size" className="text-xs text-ink-2">
                    Size
                  </label>
                  <input id="ed-size" type="number" min={6} max={96} value={sel.size ?? 16} onChange={(e) => (setSize(Number(e.target.value) || 16), setProp({ size: Math.min(96, Math.max(6, Number(e.target.value) || 16)) }))} className="h-8 w-16 rounded-[6px] border border-line-strong px-2 font-mono text-sm" />
                  <button type="button" aria-pressed={!!sel.bold} aria-label="Bold" onClick={() => setProp({ bold: !sel.bold })} className={clsx("grid size-8 place-items-center rounded-[6px] border", sel.bold ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong")}>
                    <Bold className="size-3.5" />
                  </button>
                </div>
                <select aria-label="Font" value={sel.family ?? "sans"} onChange={(e) => setProp({ family: e.target.value as Family })} className="h-8 rounded-[6px] border border-line-strong px-2 text-sm">
                  <option value="sans">Sans serif (Helvetica)</option>
                  <option value="serif">Serif (Times)</option>
                  <option value="mono">Monospace (Courier)</option>
                </select>
              </div>
            )}
            {sel && (sel.kind === "rect" || sel.kind === "ellipse") && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!sel.fill} onChange={(e) => setProp({ fill: e.target.checked ? color : null })} className="size-4 accent-[#F07845]" /> Fill with colour
              </label>
            )}
            {sel && sel.kind !== "note" && (
              <label className="mt-3 block text-xs text-ink-2">
                Opacity <span className="font-mono">{Math.round((sel.opacity ?? 1) * 100)}%</span>
                <input type="range" min={10} max={100} value={Math.round((sel.opacity ?? 1) * 100)} onChange={(e) => patch(sel.id, { opacity: Number(e.target.value) / 100 })} onPointerUp={hist.commit} onKeyUp={hist.commit} className="range mt-1" aria-label="Opacity" />
              </label>
            )}
            {sel && (
              <button type="button" onClick={() => remove(sel.id)} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] border border-line-strong text-sm text-error hover:border-error">
                <Trash2 aria-hidden className="size-4" /> Delete
              </button>
            )}
          </Panel>
          {done && <Notice tone="success">{done}</Notice>}
          {exportError && <Notice tone="error">{exportError}</Notice>}
          <Panel className="p-4 text-xs leading-relaxed text-ink-2">
            <p className="flex items-start gap-2">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Your additions are drawn on top of the page; the original text and graphics are kept exactly as they are. Changing the PDF&apos;s existing text isn&apos;t supported — to cover something, use a white filled rectangle (it hides it visually, but the text is still in the file).
              </span>
            </p>
          </Panel>
          {confirmClose ? (
            <div role="alertdialog" aria-label="Discard edits?" className="rounded-[12px] border border-error/40 bg-[#fbecea] p-3 text-sm">
              <p className="font-medium text-[#8f2f27]">Discard {objects.length} unsaved edit{objects.length === 1 ? "" : "s"}?</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={reallyClose} className="h-8 rounded-[8px] bg-error px-3 text-white">
                  Discard
                </button>
                <button type="button" autoFocus onClick={() => setConfirmClose(false)} className="h-8 rounded-[8px] border border-line-strong bg-card px-3">
                  Keep editing
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => (unsaved ? setConfirmClose(true) : reallyClose())} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
              <X aria-hidden className="size-4" /> Close {pdf.file.name.length > 24 ? "document" : pdf.file.name}
            </button>
          )}
        </div>
      </div>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose an image to add" onChange={(e) => (onImageFile(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  );
}
