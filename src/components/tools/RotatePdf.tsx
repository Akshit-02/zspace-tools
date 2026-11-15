"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare, Download, Loader2, RefreshCw, RotateCcw, RotateCw, Square, SquareCheck, X } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { addTurn, pagesFor, rotatePages, type RotateScope } from "@/lib/pdf-organize";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_PAGES = 1000;
const SCOPES: { value: RotateScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "selected", label: "Selected" },
  { value: "odd", label: "Odd" },
  { value: "even", label: "Even" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
];

export default function RotatePdf() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: MAX_PAGES });
  const [added, setAdded] = useState<number[]>([]);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [scope, setScope] = useState<RotateScope>("all");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const queue = useThumbQueue(pdf?.doc ?? null, 160);

  useEffect(() => {
    track("tool_opened", { tool: "rotate-pdf" });
  }, []);

  const changed = added.some((a) => a % 360 !== 0);
  useEffect(() => {
    if (!changed) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [changed]);

  const announce = (t: string) => {
    if (live.current) live.current.textContent = t;
  };

  const turn = (pages: number[], d: number) => {
    if (!pages.length) return;
    setAdded((a) => a.map((v, i) => (pages.includes(i) ? addTurn(v, d) : v)));
    setMsg(null);
    announce(`Rotated ${pages.length} page${pages.length === 1 ? "" : "s"} ${d === 180 ? "180°" : d > 0 ? "90° clockwise" : "90° anticlockwise"}.`);
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (!r) return;
            setAdded(r.pages.map(() => 0));
            setSel(new Set());
            setScope("all");
            setMsg(null);
            track("file_uploaded", { tool: "rotate-pdf", file_count: 1, size_bucket: sizeBucket(r.file.size) });
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to rotate"}
          subtitle="or click to choose — pages stay on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`, `${MAX_PAGES} pages`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const targets = pagesFor(scope, pdf.pages, added, sel);
  const rotatedCount = added.filter((a) => a % 360 !== 0).length;
  const btn = "inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal disabled:opacity-35";

  const download = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const out = await rotatePages(pdf.bytes, added, pdf.file.name);
      const name = `${baseName(pdf.file.name)}-rotated.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      setMsg({ tone: "success", text: `Saved ${name} — ${rotatedCount} of ${pdf.pages.length} page${pdf.pages.length === 1 ? "" : "s"} rotated, ${formatBytes(out.byteLength)}.` });
      track("download_clicked", { tool: "rotate-pdf", count: rotatedCount });
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof Error ? e.message : "The PDF couldn't be created." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <Panel className="grid gap-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-medium">
              Apply to <span className="ml-1 font-mono text-xs font-normal text-ink-2" data-testid="rot-target-count">{targets.length} of {pdf.pages.length} pages</span>
            </p>
            <div role="radiogroup" aria-label="Pages to rotate" className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:w-[500px]">
              {SCOPES.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={scope === o.value}
                  onClick={() => setScope(o.value)}
                  className={clsx("h-10 rounded-[8px] border text-sm transition-colors", scope === o.value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Rotate the chosen pages">
            <button type="button" className={btn} disabled={!targets.length} onClick={() => turn(targets, -90)}>
              <RotateCcw aria-hidden className="size-4" /> Left 90°
            </button>
            <button type="button" className={btn} disabled={!targets.length} onClick={() => turn(targets, 90)}>
              <RotateCw aria-hidden className="size-4" /> Right 90°
            </button>
            <button type="button" className={btn} disabled={!targets.length} onClick={() => turn(targets, 180)}>
              <RefreshCw aria-hidden className="size-4" /> 180°
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button type="button" className={clsx(btn, "h-9")} onClick={() => (setSel(new Set(pdf.pages.map((_, i) => i))), setScope("selected"))}>
            <CheckSquare aria-hidden className="size-4" /> Select all
          </button>
          <button type="button" className={clsx(btn, "h-9")} disabled={!sel.size} onClick={() => (setSel(new Set()), scope === "selected" && setScope("all"))}>
            <Square aria-hidden className="size-4" /> Clear selection
          </button>
          <button type="button" className={clsx(btn, "h-9")} disabled={!changed} onClick={() => (setAdded(pdf.pages.map(() => 0)), setMsg(null), announce("All rotations reset."))}>
            Reset rotations
          </button>
          <span className="font-mono text-xs text-ink-2" data-testid="rot-status">
            {rotatedCount ? `${rotatedCount} page${rotatedCount === 1 ? "" : "s"} will be rotated` : "No changes yet"}
          </span>
          <button type="button" onClick={download} disabled={!changed || busy} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Download aria-hidden className="size-4" />}
            {busy ? "Saving…" : "Download PDF"}
          </button>
        </div>
      </Panel>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <p ref={live} className="sr-only" aria-live="polite" />

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" data-testid="rot-grid" aria-label="Pages">
        {pdf.pages.map((pg, i) => {
          const on = sel.has(i);
          const a = added[i] ?? 0;
          const final = addTurn(pg.rotate, a);
          const target = targets.includes(i);
          return (
            <li key={i} data-testid="rot-page" data-added={a} data-final={final} className={clsx("relative rounded-[12px] border-2 bg-card transition-colors", on ? "border-orange" : target && scope !== "all" ? "border-charcoal/40" : "border-line")}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`Page ${i + 1}${a ? `, rotated ${a}° clockwise` : ""}${on ? ", selected" : ""}`}
                onClick={() => {
                  setSel((s) => {
                    const n = new Set(s);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  });
                  setScope("selected");
                }}
                className="block w-full overflow-hidden rounded-t-[10px] p-2"
              >
                <PdfThumb page={i + 1} queue={queue} rotate={a} className="rounded-[6px]" alt="" />
              </button>
              <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-[6px] bg-card/90 text-orange shadow-sm" aria-hidden>
                {on ? <SquareCheck className="size-4" /> : <Square className="size-4 text-ink-3" />}
              </span>
              {a !== 0 && <span className="absolute right-2 top-2 rounded-[6px] bg-charcoal px-1.5 py-0.5 font-mono text-[0.68rem] text-ivory">+{a}°</span>}
              <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-1">
                <span className="font-mono text-xs">{i + 1}</span>
                <span className="flex">
                  <button type="button" aria-label={`Rotate page ${i + 1} anticlockwise`} onClick={() => turn([i], -90)} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                    <RotateCcw className="size-4" />
                  </button>
                  <button type="button" aria-label={`Rotate page ${i + 1} clockwise`} onClick={() => turn([i], 90)} className="grid size-9 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                    <RotateCw className="size-4" />
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-end">
        <button type="button" onClick={() => (close(), setMsg(null), setAdded([]), setSel(new Set()))} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
          <X aria-hidden className="size-4" /> Open another PDF
        </button>
      </div>
    </div>
  );
}
