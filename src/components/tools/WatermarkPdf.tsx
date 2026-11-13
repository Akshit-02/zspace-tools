"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ImagePlus, Info, RotateCcw, Stamp } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, Range, Segmented, Toggle } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PageScope } from "./pdf/PageScope";
import { StampPreview } from "./pdf/StampPreview";
import { POSITIONS, WATERMARK_PRESETS, scopePages, watermarkObjects, type Pos, type Scope, type Watermark } from "@/lib/pdf-stamp";
import { exportWithOverlays } from "@/lib/pdf-overlay";
import { prepareImage } from "@/lib/overlay-image";
import { measure, type Family } from "@/lib/pdf-text";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const COLORS = ["#d6342b", "#252525", "#77716B", "#1f6fd1", "#F07845", "#2f8f4e"];

export default function WatermarkPdf() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: 2000 });
  const [wm, setWm] = useState<Watermark>({ kind: "text", text: "CONFIDENTIAL", family: "sans", bold: true, size: 64, color: "#d6342b", opacity: 0.25, rotation: -45, pos: "c", cx: 0.5, cy: 0.5, margin: 36, tile: false, gap: 60, scale: 0.3 });
  const [scope, setScope] = useState<Scope>("all");
  const [range, setRange] = useState("");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  useEffect(() => {
    track("tool_opened", { tool: "watermark-pdf" });
  }, []);
  useEffect(() => () => void (wm.image && URL.revokeObjectURL(wm.image.src)), [wm.image]);

  const set = <K extends keyof Watermark>(k: K, v: Watermark[K]) => {
    setWm((c) => ({ ...c, [k]: v }));
    setDone(null);
  };
  const pages = useMemo(() => (pdf ? scopePages(scope, range, pdf.pages.length) : []), [pdf, scope, range]);
  const pageErr = !Array.isArray(pages) ? pages.error : null;
  const objects = useMemo(() => (pdf && Array.isArray(pages) ? watermarkObjects(wm, pdf.pages, pages, (s, z, f, b) => measure(s, z, f, b)) : []), [pdf, pages, wm]);
  const ready = !!pdf && !pageErr && objects.length > 0;

  const apply = async () => {
    if (!pdf || !ready) return;
    setBusy(true);
    setFail(null);
    try {
      const out = await exportWithOverlays(pdf.bytes, objects);
      const name = `${baseName(pdf.file.name)}-watermarked.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      const n = Array.isArray(pages) ? pages.length : 0;
      setDone(`Saved ${name} — watermark on ${n} page${n === 1 ? "" : "s"}, ${formatBytes(out.byteLength)}.`);
      track("download_clicked", { tool: "watermark-pdf", format: wm.kind, count: n });
    } catch {
      setFail("The watermark couldn't be added. The PDF may be protected or use features we can't write to.");
    } finally {
      setBusy(false);
    }
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (r) {
              setPage(0);
              track("file_uploaded", { tool: "watermark-pdf", file_count: 1, size_bucket: sizeBucket(r.file.size) });
            }
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to watermark"}
          subtitle="or click to choose — watermarked on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const showPage = page;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6">
        <Segmented
          label="Watermark type"
          value={wm.kind}
          onChange={(v) => set("kind", v as Watermark["kind"])}
          options={[
            { value: "text", label: "Text" },
            { value: "image", label: "Image / logo" },
          ]}
        />
        {wm.kind === "text" ? (
          <div className="mt-5 grid gap-4">
            <div>
              <FieldLabel htmlFor="wm-text">Text</FieldLabel>
              <input id="wm-text" value={wm.text} onChange={(e) => set("text", e.target.value)} maxLength={80} className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 text-[0.95rem] outline-none focus:border-charcoal" />
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Presets">
                {WATERMARK_PRESETS.map((p) => (
                  <button key={p} type="button" aria-pressed={wm.text === p} onClick={() => set("text", p)} className={clsx("h-8 rounded-full border px-3 text-xs", wm.text === p ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select aria-label="Font" value={wm.family} onChange={(e) => set("family", e.target.value as Family)} className="h-10 rounded-[8px] border border-line-strong bg-card px-2 text-sm">
                <option value="sans">Helvetica</option>
                <option value="serif">Times</option>
                <option value="mono">Courier</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={wm.bold} onChange={(e) => set("bold", e.target.checked)} className="size-4 accent-[#F07845]" /> Bold
              </label>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <label htmlFor="wm-size">Size</label>
                <span className="font-mono">{wm.size} pt</span>
              </div>
              <Range id="wm-size" label="Font size" min={8} max={160} value={wm.size} onChange={(v) => set("size", v)} />
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Colour">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={wm.color === c} onClick={() => set("color", c)} className={clsx("size-7 rounded-full", wm.color === c && "ring-2 ring-orange ring-offset-2")} style={{ background: c }} />
              ))}
              <input type="color" aria-label="Custom colour" value={wm.color} onChange={(e) => set("color", e.target.value)} className="size-8 cursor-pointer rounded-[6px] border border-line-strong p-0.5" />
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-strong bg-ivory px-4 py-5 text-sm hover:border-charcoal">
              {wm.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wm.image.src} alt="Watermark image" className="checker max-h-20 max-w-[60%] object-contain" />
              ) : (
                <ImagePlus aria-hidden className="size-5" />
              )}
              <span>{wm.image ? "Change image" : "Choose a logo (PNG, JPG or WebP)"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Choose a watermark image"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const img = await prepareImage(f);
                    if (wm.image) URL.revokeObjectURL(wm.image.src);
                    set("image", img);
                  } catch (err) {
                    setFail(err instanceof Error ? err.message : "That image couldn't be used.");
                  }
                }}
              />
            </label>
            <div>
              <div className="flex justify-between text-sm">
                <label htmlFor="wm-scale">Width</label>
                <span className="font-mono">{Math.round(wm.scale * 100)}% of page</span>
              </div>
              <Range id="wm-scale" label="Image width" min={5} max={100} value={Math.round(wm.scale * 100)} onChange={(v) => set("scale", v / 100)} />
              <p className="text-xs text-ink-2">The aspect ratio is always kept. Transparent PNG areas stay transparent.</p>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="wm-opacity">Opacity</label>
              <span className="font-mono">{Math.round(wm.opacity * 100)}%</span>
            </div>
            <Range id="wm-opacity" label="Opacity" min={5} max={100} value={Math.round(wm.opacity * 100)} onChange={(v) => set("opacity", v / 100)} />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="wm-rot">Rotation</label>
              <span className="font-mono">{wm.rotation}°</span>
            </div>
            <Range id="wm-rot" label="Rotation" min={-90} max={90} value={wm.rotation} onChange={(v) => set("rotation", v)} />
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Position</FieldLabel>
          <div className="grid grid-cols-[auto_1fr] items-start gap-4">
            <div role="radiogroup" aria-label="Position" className="grid w-[132px] grid-cols-3 gap-1 rounded-[10px] border border-line bg-ivory p-1.5">
              {POSITIONS.map((p) => (
                <button key={p.value} type="button" role="radio" aria-checked={wm.pos === p.value && !wm.tile} aria-label={p.label} title={p.label} onClick={() => setWm((c) => ({ ...c, pos: p.value as Pos, tile: false }))} className={clsx("grid h-9 place-items-center rounded-[6px]", wm.pos === p.value && !wm.tile ? "bg-charcoal" : "hover:bg-ivory-2")}>
                  <span className={clsx("size-2 rounded-full", wm.pos === p.value && !wm.tile ? "bg-orange" : "bg-line-strong")} />
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <button type="button" aria-pressed={wm.pos === "c" && wm.rotation === -45 && !wm.tile} onClick={() => setWm((c) => ({ ...c, pos: "c", rotation: -45, tile: false }))} className="h-9 rounded-[8px] border border-line-strong bg-card px-3 text-left text-sm hover:border-charcoal">
                Diagonal centre
              </button>
              <button type="button" aria-pressed={wm.pos === "custom"} onClick={() => setWm((c) => ({ ...c, pos: "custom", tile: false }))} className={clsx("h-9 rounded-[8px] border px-3 text-left text-sm", wm.pos === "custom" ? "border-charcoal bg-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
                Custom — drag it on the preview
              </button>
              <Toggle checked={wm.tile} onChange={(v) => set("tile", v)} label="Repeat across the page" />
            </div>
          </div>
          {wm.pos !== "custom" && !wm.tile && wm.pos !== "c" && (
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <label htmlFor="wm-margin">Margin from edges</label>
                <span className="font-mono">{Math.round(wm.margin / 2.835)} mm</span>
              </div>
              <Range id="wm-margin" label="Margin" min={0} max={120} value={wm.margin} onChange={(v) => set("margin", v)} />
            </div>
          )}
        </div>

        <div className="mt-5">
          <PageScope scope={scope} range={range} onScope={setScope} onRange={setRange} error={pageErr} count={Array.isArray(pages) ? pages.length : undefined} />
        </div>

        {fail && (
          <div className="mt-4">
            <Notice tone="error">{fail}</Notice>
          </div>
        )}
        {done && (
          <div className="mt-4">
            <Notice tone="success">{done}</Notice>
          </div>
        )}
        <button type="button" onClick={apply} disabled={!ready || busy} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
          {busy ? (
            "Adding watermark…"
          ) : (
            <>
              <Download aria-hidden className="size-4" /> Add watermark & download
            </>
          )}
        </button>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="flex items-start gap-1.5 text-xs text-ink-2">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" /> A visible mark on the page, not copy protection.
          </p>
          <button type="button" onClick={() => (close(), setDone(null))} className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-2 py-1 text-sm text-ink-2 hover:bg-ivory-2">
            <RotateCcw aria-hidden className="size-3.5" /> Another PDF
          </button>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Stamp aria-hidden className="size-4" /> Preview
          {Array.isArray(pages) && !pages.includes(showPage) && <span className="font-normal text-ink-2">— not watermarked</span>}
        </p>
        <StampPreview pdf={pdf} objects={objects} page={showPage} onPage={setPage} draggable={wm.pos === "custom"} onDrag={(cx, cy) => setWm((c) => ({ ...c, cx: Math.min(1, Math.max(0, cx)), cy: Math.min(1, Math.max(0, cy)) }))} />
      </div>
    </div>
  );
}
