"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Archive, Download, Film, Loader2, RotateCcw, Trash2, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, FieldLabel, Notice, Panel, Range, RejectionNotice, inputClass } from "./ui";
import { useBatch } from "./useBatch";
import { ConvertError, INPUT_ACCEPT, INPUT_LABELS, KIND_LABEL, OUTPUTS, canEncode, decode, encode, renameOutput, sniff, targetSize, type InKind, type OutFormat } from "@/lib/image-convert";
import { validateFiles } from "@/lib/files";
import { downloadBlob, formatBytes } from "@/lib/format";
import { downloadZip } from "@/lib/zip";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const MAX_BYTES = limits.imageMaxMB * 1024 * 1024;
const nf = new Intl.NumberFormat("en-US");

interface Out {
  blob: Blob;
  url: string;
  kind: InKind;
  inW: number;
  inH: number;
  outW: number;
  outH: number;
  hadAlpha: boolean;
  flattened: boolean;
  animated: boolean;
  format: OutFormat;
}

interface Settings {
  format: OutFormat;
  quality: number;
  rw: string;
  rh: string;
  keepRatio: boolean;
  background: string;
  pattern: string;
}

const accept = (f: File) => /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(f.name) || /^image\/(jpeg|png|webp|gif|bmp|heic|heif|avif)$/.test(f.type);

export default function ImageConverter() {
  const [s, setS] = useState<Settings>({ format: "image/jpeg", quality: 85, rw: "", rh: "", keepRatio: true, background: "#ffffff", pattern: "{name}" });
  const [support, setSupport] = useState<Record<string, boolean>>({ "image/jpeg": true, "image/png": true });
  const [rejected, setRejected] = useState<string[]>([]);
  const settings = useRef(s);
  useEffect(() => {
    settings.current = s;
  }, [s]);

  useEffect(() => {
    track("tool_opened", { tool: "image-converter" });
    (async () => {
      const [webp, avif] = await Promise.all([canEncode("image/webp"), canEncode("image/avif")]);
      setSupport({ "image/jpeg": true, "image/png": true, "image/webp": webp, "image/avif-native": avif });
    })();
  }, []);

  const batch = useBatch<Out>({
    process: async (file) => {
      const o = settings.current;
      const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
      const kind = sniff(head);
      if (!kind) throw new ConvertError("This doesn't look like a supported image — its contents don't match JPG, PNG, WebP, HEIC, AVIF, BMP or GIF.");
      const src = await decode(file, kind);
      try {
        const n = (v: string) => (v.trim() && Number(v) > 0 ? Math.min(16384, Math.round(Number(v))) : null);
        const size = targetSize(src.width, src.height, n(o.rw), n(o.rh), o.keepRatio);
        if (size.width * size.height > 50_000_000) throw new ConvertError("The requested size is too large to create in the browser.");
        const flattened = src.hasAlpha && o.format === "image/jpeg";
        const blob = await encode(src, { format: o.format, quality: o.quality, width: size.width, height: size.height, background: o.background, flatten: false, nativeAvif: !!support["image/avif-native"] });
        return { blob, url: URL.createObjectURL(blob), kind, inW: src.width, inH: src.height, outW: size.width, outH: size.height, hadAlpha: src.hasAlpha, flattened, animated: src.animated, format: o.format };
      } finally {
        src.canvas.width = src.canvas.height = 0;
      }
    },
    release: (o) => URL.revokeObjectURL(o.url),
    onResult: (file, o) => track("content_generated", { tool: "image-converter", format: OUTPUTS.find((f) => f.value === o.format)!.ext, file_type: file.type || o.kind, size_bucket: sizeBucket(file.size) }),
  });

  // Re-convert everything when settings change (debounced).
  const key = JSON.stringify(s);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!batch.count) return;
    const t = setTimeout(() => batch.rerun(), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const add = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files, { accept, kindLabel: "supported image (JPG, PNG, WebP, HEIC, AVIF, BMP or GIF)", maxBytes: MAX_BYTES, maxCount: limits.maxImages, current: batch.count });
    setRejected(rejected);
    if (accepted.length) {
      batch.add(accepted);
      track("file_uploaded", { tool: "image-converter", file_count: accepted.length });
    }
  };

  const out = OUTPUTS.find((f) => f.value === s.format)!;
  const done = batch.items.filter((i) => i.status === "done" && i.out);
  const anyAlpha = batch.items.some((i) => i.out?.hadAlpha);
  const anyAnimated = batch.items.some((i) => i.out?.animated);
  const names = useMemo(() => {
    const used = new Map<string, number>();
    return new Map(
      batch.items.map((it, idx) => {
        let name = renameOutput(s.pattern, it.file.name, idx + 1, out.ext);
        const k = name.toLowerCase();
        const c = used.get(k) ?? 0;
        used.set(k, c + 1);
        if (c) name = name.replace(/(\.[^.]+)$/, `-${c}$1`);
        return [it.id, name];
      }),
    );
  }, [batch.items, s.pattern, out.ext]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((c) => ({ ...c, [k]: v }));
  const webpUnsupported = support["image/webp"] === false;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.35fr] [&>*]:min-w-0">
      <Panel className="p-5 sm:p-6 lg:sticky lg:top-24 lg:self-start">
        <FieldLabel>Convert to</FieldLabel>
        <div role="radiogroup" aria-label="Output format" className="grid grid-cols-4 gap-2">
          {OUTPUTS.map((f) => {
            const disabled = f.value === "image/webp" && webpUnsupported;
            return (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={s.format === f.value}
                disabled={disabled}
                onClick={() => set("format", f.value)}
                className={clsx("h-12 rounded-[10px] border font-medium transition-colors disabled:opacity-35", s.format === f.value ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {webpUnsupported && <p className="mt-2 text-xs text-ink-2">This browser can&apos;t create WebP files.</p>}
        {s.format === "image/avif" && (
          <p className="mt-2 text-xs text-ink-2" data-testid="avif-note">
            {support["image/avif-native"] ? "Encoded by your browser." : "Your browser can't create AVIF itself, so a WebAssembly encoder runs on your device instead — it's slower, especially for large photos."}
          </p>
        )}

        {out.lossy && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="ic-q">Quality</FieldLabel>
              <span className="font-mono text-sm">{s.quality}%</span>
            </div>
            <Range id="ic-q" label="Quality" min={30} max={100} value={s.quality} onChange={(v) => set("quality", v)} />
          </div>
        )}

        {(s.format === "image/jpeg" || anyAlpha) && (
          <div className={clsx("mt-5 rounded-[12px] border p-3", s.format === "image/jpeg" && anyAlpha ? "border-[#e5c98f] bg-[#fdf6e7]" : "border-line")} data-testid="ic-bg">
            <label className="flex items-center gap-3 text-sm">
              <input type="color" value={s.background} onChange={(e) => set("background", e.target.value)} disabled={s.format !== "image/jpeg"} className="size-9 cursor-pointer rounded-[8px] border border-line-strong bg-card p-1 disabled:opacity-40" aria-label="Background colour for transparent areas" />
              <span>
                <b className="font-medium">Background for transparent areas</b>
                <span className="block text-xs text-ink-2">{s.format === "image/jpeg" ? "JPG can't store transparency, so transparent pixels are filled with this colour." : `${out.label} keeps transparency, so no background is added.`}</span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-5">
          <FieldLabel>Resize (optional)</FieldLabel>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <input aria-label="Width in pixels" inputMode="numeric" placeholder="Width px" value={s.rw} onChange={(e) => set("rw", e.target.value.replace(/\D/g, ""))} className={clsx(inputClass, "font-mono")} />
            <input aria-label="Height in pixels" inputMode="numeric" placeholder="Height px" value={s.rh} onChange={(e) => set("rh", e.target.value.replace(/\D/g, ""))} className={clsx(inputClass, "font-mono")} />
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.keepRatio} onChange={(e) => set("keepRatio", e.target.checked)} className="size-4 accent-[#F07845]" />
            Keep aspect ratio (fit within the size)
          </label>
        </div>

        <div className="mt-5">
          <FieldLabel htmlFor="ic-name">File names</FieldLabel>
          <input id="ic-name" value={s.pattern} onChange={(e) => set("pattern", e.target.value)} className={clsx(inputClass, "font-mono")} />
          <p className="mt-1 text-xs text-ink-2">
            <code className="font-mono">{"{name}"}</code> = original name, <code className="font-mono">{"{n}"}</code> = number. Example: {renameOutput(s.pattern, "holiday.heic", 1, out.ext)}
          </p>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <DropZone accept={INPUT_ACCEPT} multiple onFiles={add} compact={batch.count > 0} title={batch.count ? "Add more images" : "Drop images here"} subtitle="or click to choose — converted on your device" formats={[...INPUT_LABELS, `up to ${limits.imageMaxMB} MB`]} />
        {rejected.length > 0 && <RejectionNotice list={rejected} onClose={() => setRejected([])} />}
        {anyAnimated && (
          <Notice>
            <span className="flex items-start gap-2">
              <Film aria-hidden className="mt-0.5 size-4 shrink-0" /> Animated GIFs are converted as a still image of the first frame — the animation isn&apos;t kept.
            </span>
          </Notice>
        )}

        {batch.count > 0 && (
          <Panel className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold" data-testid="ic-summary">
                {done.length} of {batch.count} converted to {out.label}
                {batch.busy && <Loader2 aria-hidden className="ml-2 inline size-4 animate-spin" />}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={batch.busy || done.length === 0}
                  onClick={() => {
                    downloadZip(done.map((i) => ({ name: names.get(i.id)!, blob: i.out!.blob })), `converted-${out.ext}.zip`);
                    track("download_clicked", { tool: "image-converter", format: "zip", count: done.length });
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-4 text-sm font-medium text-ivory hover:bg-black disabled:opacity-40"
                >
                  <Archive aria-hidden className="size-4" /> Download all (ZIP)
                </button>
                <button type="button" onClick={batch.clear} className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                  <RotateCcw aria-hidden className="size-4" /> Clear
                </button>
              </div>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2" data-testid="ic-list">
              {batch.items.map((it) => {
                const o = it.out;
                const name = names.get(it.id)!;
                return (
                  <li key={it.id} className="flex gap-3 rounded-[12px] border border-line p-2.5" data-status={it.status}>
                    <div className="checker grid size-20 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {o ? <img src={o.url} alt="" className="max-h-full max-w-full object-contain" /> : it.status === "error" ? <XCircle aria-hidden className="size-5 text-error" /> : <Loader2 aria-hidden className="size-5 animate-spin text-ink-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={it.file.name}>
                        {it.file.name}
                      </p>
                      {o ? (
                        <>
                          <p className="truncate font-mono text-[0.72rem] text-ink-2">
                            {KIND_LABEL[o.kind]} {nf.format(o.inW)}×{nf.format(o.inH)} · {formatBytes(it.file.size)}
                          </p>
                          <p className="truncate font-mono text-[0.72rem]">
                            → {OUTPUTS.find((f) => f.value === o.format)!.label} {nf.format(o.outW)}×{nf.format(o.outH)} · {formatBytes(o.blob.size)}
                          </p>
                          {o.flattened && (
                            <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] text-[#8a5a10]">
                              <AlertTriangle aria-hidden className="size-3" /> Transparency filled with {s.background}
                            </p>
                          )}
                        </>
                      ) : it.status === "error" ? (
                        <p className="mt-0.5 text-xs text-error">{it.error}</p>
                      ) : (
                        <p className="font-mono text-[0.72rem] text-ink-2">{it.status === "processing" ? "Converting…" : "Waiting…"}</p>
                      )}
                      <div className="mt-1.5 flex gap-1.5">
                        {o && (
                          <button
                            type="button"
                            onClick={() => {
                              downloadBlob(o.blob, name);
                              track("download_clicked", { tool: "image-converter", format: OUTPUTS.find((f) => f.value === o.format)!.ext });
                            }}
                            className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-[8px] border border-line-strong px-2.5 text-[0.8rem] hover:border-charcoal"
                          >
                            <Download aria-hidden className="size-3.5 shrink-0" /> <span className="truncate">{name}</span>
                          </button>
                        )}
                        <button type="button" aria-label={`Remove ${it.file.name}`} onClick={() => batch.remove(it.id)} className="grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
