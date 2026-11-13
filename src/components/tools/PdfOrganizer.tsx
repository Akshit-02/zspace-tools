"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowLeft, ArrowRight, CheckSquare, Copy, Download, FileOutput, Redo2, RotateCcw, RotateCw, Square, SquareCheck, Trash2, Undo2, X } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { useHistory } from "@/lib/use-history";
import { buildOrganized, type PageItem } from "@/lib/pdf-organize";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

let n = 0;
const pid = () => `p${Date.now().toString(36)}${(n++).toString(36)}`;
const MAX_PAGES = 1000;

export default function PdfOrganizer() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: MAX_PAGES });
  const initial = useMemo(() => (pdf ? pdf.pages.map((_, i) => ({ id: `o${i}`, src: i, rot: 0 as PageItem["rot"] })) : []), [pdf]);
  const hist = useHistory<PageItem[]>([]);
  const items = hist.value;
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const queue = useThumbQueue(pdf?.doc ?? null, 150);
  const live = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    track("tool_opened", { tool: "pdf-organizer" });
  }, []);

  const changed = hist.canUndo;
  useEffect(() => {
    if (!changed) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [changed]);

  const selectedItems = items.filter((i) => sel.has(i.id));
  const targets = (id?: string) => (id && !sel.has(id) ? [id] : [...sel]);
  const rotate = (ids: string[], d: 90 | -90) => hist.set((l) => l.map((i) => (ids.includes(i.id) ? { ...i, rot: (((i.rot + d) % 360) + 360) % 360 as PageItem["rot"] } : i)));
  const del = (ids: string[]) => {
    hist.set((l) => l.filter((i) => !ids.includes(i.id)));
    setSel((s) => new Set([...s].filter((x) => !ids.includes(x))));
  };
  const dup = (ids: string[]) =>
    hist.set((l) => {
      const out: PageItem[] = [];
      for (const i of l) {
        out.push(i);
        if (ids.includes(i.id)) out.push({ ...i, id: pid() });
      }
      return out;
    });
  const moveTo = (ids: string[], index: number) =>
    hist.set((l) => {
      const moving = l.filter((i) => ids.includes(i.id));
      const before = l.slice(0, index).filter((i) => !ids.includes(i.id)).length;
      const rest = l.filter((i) => !ids.includes(i.id));
      return [...rest.slice(0, before), ...moving, ...rest.slice(before)];
    });
  const nudge = (id: string, d: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const to = idx + d;
    if (to < 0 || to >= items.length) return;
    moveTo([id], d > 0 ? to + 1 : to);
    if (live.current) live.current.textContent = `Moved to position ${to + 1}`;
  };

  const download = async (subset: PageItem[], suffix: string) => {
    if (!pdf || !subset.length) return;
    setBusy(suffix);
    setMsg(null);
    try {
      const out = await buildOrganized(pdf.bytes, subset);
      const name = `${baseName(pdf.file.name)}-${suffix}.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      setMsg({ tone: "success", text: `Saved ${name} — ${subset.length} page${subset.length === 1 ? "" : "s"}, ${formatBytes(out.byteLength)}.` });
      track("download_clicked", { tool: "pdf-organizer", format: suffix, count: subset.length });
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof Error ? e.message : "The PDF couldn't be created." });
    } finally {
      setBusy(null);
    }
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (!r) return;
            hist.reset(r.pages.map((_, i) => ({ id: `o${i}`, src: i, rot: 0 as const })));
            setSel(new Set());
            track("file_uploaded", { tool: "pdf-organizer", file_count: 1, size_bucket: sizeBucket(r.file.size) });
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to organise"}
          subtitle="or click to choose — pages stay on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const btn = "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-line-strong bg-card px-2.5 text-[0.82rem] hover:border-charcoal disabled:opacity-35";
  const none = sel.size === 0;

  return (
    <div className="grid gap-3">
      <Panel className="p-3">
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Page actions">
          <span className="mr-1 font-mono text-xs text-ink-2" data-testid="org-count">
            {items.length} page{items.length === 1 ? "" : "s"}
            {sel.size ? ` · ${sel.size} selected` : ""}
          </span>
          <button type="button" className={btn} onClick={() => setSel(new Set(items.map((i) => i.id)))}>
            <CheckSquare aria-hidden className="size-4" /> Select all
          </button>
          <button type="button" className={btn} onClick={() => setSel(new Set())} disabled={none}>
            <Square aria-hidden className="size-4" /> Deselect
          </button>
          <span className="h-6 w-px bg-line" />
          <button type="button" className={btn} disabled={none} onClick={() => rotate([...sel], -90)} aria-label="Rotate selected left">
            <RotateCcw aria-hidden className="size-4" />
          </button>
          <button type="button" className={btn} disabled={none} onClick={() => rotate([...sel], 90)} aria-label="Rotate selected right">
            <RotateCw aria-hidden className="size-4" />
          </button>
          <button type="button" className={btn} disabled={none} onClick={() => dup([...sel])}>
            <Copy aria-hidden className="size-4" /> Duplicate
          </button>
          <button type="button" className={clsx(btn, "text-error")} disabled={none} onClick={() => del([...sel])}>
            <Trash2 aria-hidden className="size-4" /> Delete
          </button>
          <button type="button" className={btn} onClick={() => hist.set((l) => [...l].reverse())} disabled={items.length < 2}>
            <ArrowDownUp aria-hidden className="size-4" /> Reverse
          </button>
          <span className="h-6 w-px bg-line" />
          <button type="button" className={btn} onClick={hist.undo} disabled={!hist.canUndo} aria-label="Undo">
            <Undo2 aria-hidden className="size-4" />
          </button>
          <button type="button" className={btn} onClick={hist.redo} disabled={!hist.canRedo} aria-label="Redo">
            <Redo2 aria-hidden className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => hist.set(initial)} disabled={!changed}>
            Reset order
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className={btn} disabled={none || !!busy} onClick={() => download(selectedItems, "extract")}>
              <FileOutput aria-hidden className="size-4" /> {busy === "extract" ? "Saving…" : `Extract ${sel.size || ""} selected`}
            </button>
            <button type="button" disabled={!items.length || !!busy} onClick={() => download(items, "organized")} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              <Download aria-hidden className="size-4" /> {busy === "organized" ? "Saving…" : "Download PDF"}
            </button>
          </div>
        </div>
      </Panel>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {!items.length && <Notice tone="error">Every page has been deleted. Undo or reset to get pages back.</Notice>}
      <p ref={live} className="sr-only" aria-live="polite" />

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" data-testid="org-grid" aria-label="Pages — drag to reorder, or use the arrow buttons">
        {items.map((it, idx) => {
          const on = sel.has(it.id);
          const moving = dragId && (dragId === it.id || (sel.has(dragId) && on));
          return (
            <li
              key={it.id}
              draggable
              onDragStart={(e) => {
                setDragId(it.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", it.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropAt(null);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                setDropAt(e.clientX < r.left + r.width / 2 ? idx : idx + 1);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dropAt !== null) moveTo(targets(dragId), dropAt);
                setDragId(null);
                setDropAt(null);
              }}
              data-testid="org-page"
              data-src={it.src + 1}
              data-rot={it.rot}
              className={clsx("relative rounded-[12px] border-2 bg-card transition-[border-color,opacity]", on ? "border-orange" : "border-line", moving && "opacity-40")}
            >
              {dropAt === idx && <span aria-hidden className="absolute -left-2 top-2 bottom-2 w-1 rounded-full bg-orange" />}
              {dropAt === idx + 1 && idx === items.length - 1 && <span aria-hidden className="absolute -right-2 top-2 bottom-2 w-1 rounded-full bg-orange" />}
              <button type="button" onClick={() => setSel((s) => (s.has(it.id) ? new Set([...s].filter((x) => x !== it.id)) : new Set([...s, it.id])))} aria-pressed={on} aria-label={`Page ${idx + 1} (original page ${it.src + 1}${it.rot ? `, rotated ${it.rot}°` : ""})${on ? ", selected" : ""}`} className="block w-full cursor-grab overflow-hidden rounded-t-[10px] p-2">
                <PdfThumb page={it.src + 1} queue={queue} rotate={it.rot} className="rounded-[6px]" />
              </button>
              <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-[6px] bg-card/90 text-orange shadow-sm" aria-hidden>
                {on ? <SquareCheck className="size-4" /> : <Square className="size-4 text-ink-3" />}
              </span>
              <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1.5">
                <span className="font-mono text-xs">
                  {idx + 1}
                  {it.src !== idx && <span className="text-ink-3"> · p{it.src + 1}</span>}
                </span>
                <span className="flex">
                  <button type="button" aria-label={`Move page ${idx + 1} left`} disabled={idx === 0} onClick={() => nudge(it.id, -1)} className="grid size-7 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2 disabled:opacity-25">
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Move page ${idx + 1} right`} disabled={idx === items.length - 1} onClick={() => nudge(it.id, 1)} className="grid size-7 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2 disabled:opacity-25">
                    <ArrowRight className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Rotate page ${idx + 1}`} onClick={() => rotate([it.id], 90)} className="grid size-7 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2">
                    <RotateCw className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Duplicate page ${idx + 1}`} onClick={() => dup([it.id])} className="grid size-7 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2">
                    <Copy className="size-3.5" />
                  </button>
                  <button type="button" aria-label={`Delete page ${idx + 1}`} onClick={() => del([it.id])} className="grid size-7 place-items-center rounded-[6px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-end">
        {confirm ? (
          <div role="alertdialog" aria-label="Discard changes?" className="flex flex-wrap items-center gap-2 rounded-[12px] border border-error/40 bg-[#fbecea] p-2.5 text-sm">
            Discard your changes to {pdf.file.name}?
            <button type="button" onClick={() => (close(), setConfirm(false), setMsg(null))} className="h-8 rounded-[8px] bg-error px-3 text-white">
              Discard
            </button>
            <button type="button" autoFocus onClick={() => setConfirm(false)} className="h-8 rounded-[8px] border border-line-strong bg-card px-3">
              Keep
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => (changed ? setConfirm(true) : (close(), setMsg(null)))} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
            <X aria-hidden className="size-4" /> Open another PDF
          </button>
        )}
      </div>
    </div>
  );
}
