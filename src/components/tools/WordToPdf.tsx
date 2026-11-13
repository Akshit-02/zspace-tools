"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Info, Loader2, Printer, Trash2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel, RejectionNotice } from "./ui";
import { WordError, clearDocxPrint, pageLabel, printDocx, renderDocx, type Rendered } from "@/lib/docx-render";
import { validateFiles, fileId } from "@/lib/files";
import { baseName, formatBytes } from "@/lib/format";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_BYTES = 30 * 1024 * 1024;
const MAX_FILES = 10;

interface Doc {
  id: string;
  file: File;
  status: "rendering" | "ready" | "error";
  info?: Rendered;
  error?: string;
}

const isWordName = (f: File) => /\.(docx|doc)$/i.test(f.name) || /officedocument\.wordprocessingml|msword/.test(f.type);

export default function WordToPdf() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const containers = useRef(new Map<string, HTMLDivElement>());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const previewBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("tool_opened", { tool: "word-to-pdf" });
    return () => clearDocxPrint();
  }, []);

  const renderOne = (d: Doc) => {
    queue.current = queue.current.then(async () => {
      const el = containers.current.get(d.id);
      if (!el) return;
      try {
        const info = await renderDocx(new Uint8Array(await d.file.arrayBuffer()), el);
        setDocs((list) => list.map((x) => (x.id === d.id ? { ...x, status: "ready", info } : x)));
        track("content_generated", { tool: "word-to-pdf", count: info.pages.length, size_bucket: sizeBucket(d.file.size) });
      } catch (e) {
        el.replaceChildren();
        setDocs((list) => list.map((x) => (x.id === d.id ? { ...x, status: "error", error: e instanceof WordError ? e.message : "This document couldn't be displayed." } : x)));
      }
    });
  };

  const add = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files, { accept: isWordName, kindLabel: "Word document (.docx)", maxBytes: MAX_BYTES, maxCount: MAX_FILES, current: docs.length });
    setRejected(rejected);
    if (!accepted.length) return;
    const added = accepted.map((file) => ({ id: fileId("w"), file, status: "rendering" as const }));
    setDocs((d) => [...d, ...added]);
    setActive((a) => a ?? added[0].id);
    track("file_uploaded", { tool: "word-to-pdf", file_count: added.length });
  };

  // Render each new document once its container has mounted.
  const started = useRef(new Set<string>());
  useEffect(() => {
    for (const d of docs) {
      if (d.status === "rendering" && !started.current.has(d.id) && containers.current.get(d.id)) {
        started.current.add(d.id);
        renderOne(d);
      }
    }
  }, [docs]);

  const current = docs.find((d) => d.id === active) ?? null;

  // Scale the preview to the panel width.
  useLayoutEffect(() => {
    const box = previewBox.current;
    const p = current?.info?.pages[0];
    if (!box || !p) return;
    const fit = () => setZoom(Math.min(1, (box.clientWidth - 24) / ((p.w * 96) / 72 + 40)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [current?.info]);

  const ready = docs.filter((d) => d.status === "ready" && d.info);
  const save = (list: Doc[]) => {
    const items = list.filter((d) => d.info).map((d) => ({ container: containers.current.get(d.id)!, info: d.info! }));
    if (!items.length) return;
    printDocx(items, list.length === 1 ? baseName(list[0].file.name) : "documents");
    track("download_clicked", { tool: "word-to-pdf", format: "pdf", count: items.length });
  };

  const remove = (id: string) => {
    containers.current.delete(id);
    setDocs((d) => d.filter((x) => x.id !== id));
    setActive((a) => (a === id ? (docs.find((x) => x.id !== id)?.id ?? null) : a));
  };

  return (
    <div className="grid gap-4">
      <DropZone accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" multiple onFiles={add} compact={docs.length > 0} title={docs.length ? "Add more documents" : "Drop Word documents here"} subtitle="or click to choose — rendered on your device" formats={["DOCX", "up to 30 MB", `${MAX_FILES} files`]} />
      {rejected.length > 0 && <RejectionNotice list={rejected} onClose={() => setRejected([])} />}

      {docs.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.4fr] [&>*]:min-w-0">
          <div className="flex min-w-0 flex-col gap-4">
            <Panel className="p-4 sm:p-5">
              <ul className="grid gap-2" data-testid="w2p-list">
                {docs.map((d) => (
                  <li key={d.id}>
                    <div className={clsx("flex items-center gap-3 rounded-[12px] border p-2.5 transition-colors", d.id === active ? "border-charcoal bg-ivory" : "border-line")}>
                      <button type="button" onClick={() => setActive(d.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-current={d.id === active}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-ivory-2">
                          {d.status === "rendering" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : d.status === "error" ? <XCircle aria-hidden className="size-4 text-error" /> : <FileText aria-hidden className="size-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{d.file.name}</span>
                          <span className="block truncate font-mono text-[0.72rem] text-ink-2">
                            {d.status === "ready" && d.info ? `${d.info.pages.length} page${d.info.pages.length === 1 ? "" : "s"} · ${pageLabel(d.info.pages[0])} · ${formatBytes(d.file.size)}` : d.status === "error" ? "Couldn't convert" : "Reading…"}
                          </span>
                        </span>
                      </button>
                      <button type="button" aria-label={`Remove ${d.file.name}`} onClick={() => remove(d.id)} className="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            {current?.status === "error" && <Notice tone="error">{current.error}</Notice>}
            {current?.status === "ready" && current.info && (
              <Panel className="p-5 sm:p-6">
                <dl className="grid grid-cols-2 gap-2 text-sm" data-testid="w2p-info">
                  {(
                    [
                      ["Pages", String(current.info.pages.length)],
                      ["Page size", pageLabel(current.info.pages[0])],
                      ["Words", current.info.words.toLocaleString("en-US")],
                      ["Tables · images", `${current.info.tables} · ${current.info.images}`],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="rounded-[10px] bg-ivory px-3 py-2">
                      <dt className="text-xs text-ink-2">{k}</dt>
                      <dd className="font-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
                {current.info.mode === "flow" && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-[#8a5a10]" data-testid="w2p-flow">
                    <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" /> This document has no saved page layout, so pages are laid out by your browser. Page breaks may differ from Word{current.info.headers ? ", and headers/footers appear on the first page only" : ""}.
                  </p>
                )}
                {current.info.missingImages > 0 && <p className="mt-2 text-xs text-[#8a5a10]">{current.info.missingImages} image(s) couldn&apos;t be displayed (for example EMF/WMF drawings) and won&apos;t appear in the PDF.</p>}
                <button type="button" onClick={() => save([current])} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34]">
                  <Printer aria-hidden className="size-4" /> Save as PDF
                </button>
                {ready.length > 1 && (
                  <button type="button" onClick={() => save(ready)} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-line-strong bg-card text-sm font-medium hover:border-charcoal">
                    Save all {ready.length} as one PDF
                  </button>
                )}
                <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-2">
                  <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  Your browser&apos;s print window opens with the right page size — choose <b className="font-medium text-charcoal">Save as PDF</b> as the destination. On iPhone, use Share → Save to Files.
                </p>
              </Panel>
            )}
          </div>

          <Panel className="p-3 sm:p-4">
            <p className="flex items-center gap-2 px-1 pb-2 text-sm font-bold">
              {current?.status === "ready" ? <CheckCircle2 aria-hidden className="size-4 text-success" /> : null} Preview
            </p>
            <div ref={previewBox} className="max-h-[760px] overflow-auto rounded-[12px] bg-[#e9e4dc]" data-testid="w2p-preview">
              {docs.map((d) => (
                <div
                  key={d.id}
                  ref={(el) => {
                    if (el) containers.current.set(d.id, el);
                  }}
                  className={clsx("w2p-doc", d.id === active ? "" : "pointer-events-none absolute left-[-99999px] top-0 h-0 overflow-hidden")}
                  style={d.id === active ? { zoom } : undefined}
                  aria-hidden={d.id !== active}
                />
              ))}
              {current?.status === "rendering" && (
                <p className="flex items-center gap-2 p-6 text-sm text-ink-2">
                  <Loader2 aria-hidden className="size-4 animate-spin" /> Rendering…
                </p>
              )}
            </div>
            <p className="mt-2 px-1 text-xs text-ink-2">Fonts you don&apos;t have installed are replaced with similar ones. Review the preview before saving.</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
