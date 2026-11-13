"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Hash, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, Range } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PageScope } from "./pdf/PageScope";
import { StampPreview } from "./pdf/StampPreview";
import { NUM_STYLES, numberObjects, numberPlan, type Numbering, type NumStyle, type Pos } from "@/lib/pdf-stamp";
import { exportWithOverlays } from "@/lib/pdf-overlay";
import { measure, type Family } from "@/lib/pdf-text";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const POS6: { value: Pos; label: string }[] = [
  { value: "tl", label: "Top left" },
  { value: "tc", label: "Top centre" },
  { value: "tr", label: "Top right" },
  { value: "bl", label: "Bottom left" },
  { value: "bc", label: "Bottom centre" },
  { value: "br", label: "Bottom right" },
];
const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AddPageNumbers() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: 2000 });
  const [n, setN] = useState<Numbering>({ pos: "bc", style: "1", prefix: "", suffix: "", start: 1, skip: 0, scope: "all", range: "", family: "sans", bold: false, size: 10, color: "#252525", opacity: 1, margin: 28, header: "", headerAlign: "center", footer: "", footerAlign: "left", title: "", date: today() });
  const [extras, setExtras] = useState(false);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  useEffect(() => {
    track("tool_opened", { tool: "add-page-numbers" });
  }, []);

  const set = <K extends keyof Numbering>(k: K, v: Numbering[K]) => {
    setN((c) => ({ ...c, [k]: v }));
    setDone(null);
  };
  const plan = useMemo(() => (pdf ? numberPlan(n, pdf.pages.length) : null), [pdf, n]);
  const objects = useMemo(() => (pdf ? numberObjects(n, pdf.pages, pdf.file.name, (s, z, f, b) => measure(s, z, f, b)) : []), [pdf, n]);
  const err = plan && "error" in plan ? plan.error : !Array.isArray(objects) ? objects.error : null;
  const objs = Array.isArray(objects) ? objects : [];
  const count = plan && !("error" in plan) ? plan.count : 0;

  const apply = async () => {
    if (!pdf || err || !objs.length) return;
    setBusy(true);
    setFail(null);
    try {
      const out = await exportWithOverlays(pdf.bytes, objs);
      const name = `${baseName(pdf.file.name)}-numbered.pdf`;
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), name);
      setDone(`Saved ${name} — ${count} page${count === 1 ? "" : "s"} numbered, ${formatBytes(out.byteLength)}.`);
      track("download_clicked", { tool: "add-page-numbers", format: n.style, count });
    } catch {
      setFail("Page numbers couldn't be added. The PDF may be protected or use features we can't write to.");
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
              setN((c) => ({ ...c, title: baseName(r.file.name) }));
              track("file_uploaded", { tool: "add-page-numbers", file_count: 1, size_bucket: sizeBucket(r.file.size) });
            }
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to number"}
          subtitle="or click to choose — numbered on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`]}
        />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const firstNum = plan && !("error" in plan) && plan.pages[0] ? plan.pages[0] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6">
        <FieldLabel>Position</FieldLabel>
        <div role="radiogroup" aria-label="Position" className="grid grid-cols-3 gap-1.5">
          {POS6.map((p) => (
            <button key={p.value} type="button" role="radio" aria-checked={n.pos === p.value} onClick={() => set("pos", p.value)} className={clsx("h-10 rounded-[8px] border text-[0.82rem]", n.pos === p.value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pn-style">Format</FieldLabel>
            <select id="pn-style" value={n.style} onChange={(e) => set("style", e.target.value as NumStyle)} className="h-10 w-full rounded-[8px] border border-line-strong bg-card px-2 text-sm">
              {NUM_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel htmlFor="pn-prefix">Prefix</FieldLabel>
              <input id="pn-prefix" value={n.prefix} onChange={(e) => set("prefix", e.target.value)} maxLength={30} placeholder="e.g. A-" className="h-10 w-full rounded-[8px] border border-line-strong bg-card px-2 text-sm" />
            </div>
            <div>
              <FieldLabel htmlFor="pn-suffix">Suffix</FieldLabel>
              <input id="pn-suffix" value={n.suffix} onChange={(e) => set("suffix", e.target.value)} maxLength={30} className="h-10 w-full rounded-[8px] border border-line-strong bg-card px-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pn-skip">Leave unnumbered</FieldLabel>
            <div className="flex items-center gap-2 text-sm">
              <span>first</span>
              <input id="pn-skip" type="number" min={0} max={pdf.pages.length - 1} value={n.skip} onChange={(e) => set("skip", Math.max(0, Math.min(pdf.pages.length - 1, Math.floor(Number(e.target.value) || 0))))} className="h-10 w-20 rounded-[8px] border border-line-strong bg-card px-2 font-mono" />
              <span>page{n.skip === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="pn-start">Start counting at</FieldLabel>
            <input id="pn-start" type="number" min={0} max={99999} value={n.start} onChange={(e) => set("start", Math.max(0, Math.min(99999, Math.floor(Number(e.target.value) || 0))))} className="h-10 w-24 rounded-[8px] border border-line-strong bg-card px-2 font-mono" />
          </div>
        </div>
        {firstNum && (
          <p className="mt-2 text-xs text-ink-2" data-testid="pn-summary">
            {count} page{count === 1 ? "" : "s"} numbered — page {firstNum.index + 1} shows “{objs.find((o) => o.page === firstNum.index && o.id.endsWith("-n"))?.text}”.
          </p>
        )}

        <div className="mt-5">
          <PageScope label="Pages to number" scope={n.scope} range={n.range} onScope={(s) => set("scope", s)} onRange={(r) => set("range", r)} error={err} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-2">
            <select aria-label="Font" value={n.family} onChange={(e) => set("family", e.target.value as Family)} className="h-10 min-w-0 flex-1 rounded-[8px] border border-line-strong bg-card px-2 text-sm">
              <option value="sans">Helvetica</option>
              <option value="serif">Times</option>
              <option value="mono">Courier</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={n.bold} onChange={(e) => set("bold", e.target.checked)} className="size-4 accent-[#F07845]" /> Bold
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Text colour" value={n.color} onChange={(e) => set("color", e.target.value)} className="size-10 cursor-pointer rounded-[8px] border border-line-strong p-1" />
            <label className="flex flex-1 items-center gap-2 text-sm">
              Size
              <input aria-label="Font size" type="number" min={6} max={36} value={n.size} onChange={(e) => set("size", Math.max(6, Math.min(36, Number(e.target.value) || 10)))} className="h-10 w-16 rounded-[8px] border border-line-strong bg-card px-2 font-mono" />
            </label>
          </div>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="pn-margin">Margin from edge</label>
              <span className="font-mono">{Math.round(n.margin / 2.835)} mm</span>
            </div>
            <Range id="pn-margin" label="Margin" min={6} max={72} value={n.margin} onChange={(v) => set("margin", v)} />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <label htmlFor="pn-opacity">Opacity</label>
              <span className="font-mono">{Math.round(n.opacity * 100)}%</span>
            </div>
            <Range id="pn-opacity" label="Opacity" min={20} max={100} value={Math.round(n.opacity * 100)} onChange={(v) => set("opacity", v / 100)} />
          </div>
        </div>

        <details className="mt-5 rounded-[12px] border border-line p-3" open={extras} onToggle={(e) => setExtras((e.target as HTMLDetailsElement).open)}>
          <summary className="cursor-pointer text-sm font-medium">Header & footer text (optional)</summary>
          <div className="mt-3 grid gap-3">
            {(["header", "footer"] as const).map((k) => (
              <div key={k} className="grid grid-cols-[1fr_auto] gap-2">
                <input aria-label={`${k === "header" ? "Header" : "Footer"} text`} value={n[k]} onChange={(e) => set(k, e.target.value)} placeholder={k === "header" ? "e.g. {title}" : "e.g. Confidential · {date}"} maxLength={120} className="h-10 rounded-[8px] border border-line-strong bg-card px-2 text-sm" />
                <select aria-label={`${k === "header" ? "Header" : "Footer"} alignment`} value={n[`${k}Align`]} onChange={(e) => set(`${k}Align`, e.target.value as "left" | "center" | "right")} className="h-10 rounded-[8px] border border-line-strong bg-card px-2 text-sm">
                  <option value="left">Left</option>
                  <option value="center">Centre</option>
                  <option value="right">Right</option>
                </select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <input aria-label="Document title for {title}" value={n.title} onChange={(e) => set("title", e.target.value)} placeholder="Title" className="h-10 rounded-[8px] border border-line-strong bg-card px-2 text-sm" />
              <input aria-label="Date for {date}" value={n.date} onChange={(e) => set("date", e.target.value)} className="h-10 rounded-[8px] border border-line-strong bg-card px-2 text-sm" />
            </div>
            <p className="text-xs text-ink-2">
              Placeholders: <code className="font-mono">{"{title}"}</code>, <code className="font-mono">{"{date}"}</code>, <code className="font-mono">{"{page}"}</code>, <code className="font-mono">{"{total}"}</code>, <code className="font-mono">{"{file}"}</code>.
            </p>
          </div>
        </details>

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
        <button type="button" onClick={apply} disabled={!!err || !objs.length || busy} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
          {busy ? (
            "Adding numbers…"
          ) : (
            <>
              <Download aria-hidden className="size-4" /> Add page numbers & download
            </>
          )}
        </button>
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={() => (close(), setDone(null))} className="inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-sm text-ink-2 hover:bg-ivory-2">
            <RotateCcw aria-hidden className="size-3.5" /> Another PDF
          </button>
        </div>
      </Panel>
      <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Hash aria-hidden className="size-4" /> Preview
        </p>
        <StampPreview pdf={pdf} objects={objs} page={page} onPage={setPage} />
      </div>
    </div>
  );
}
