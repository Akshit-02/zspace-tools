"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, FileUp, PenLine, Type } from "lucide-react";
import { clsx } from "clsx";
import "@fontsource/great-vibes/400.css";
import "@fontsource/dancing-script/500.css";
import "@fontsource/caveat/500.css";
import { Segmented } from "./ui";
import { prepareImage, type PlacedImage } from "@/lib/overlay-image";

export const SIGN_FONTS = [
  { id: "great", label: "Elegant", css: "'Great Vibes'", weight: 400 },
  { id: "dancing", label: "Flowing", css: "'Dancing Script'", weight: 500 },
  { id: "caveat", label: "Handwritten", css: "'Caveat'", weight: 500 },
] as const;
const INKS = ["#1a1a1a", "#1f3fa8", "#0b5d3b"];

/** Renders typed text in a script font to a trimmed transparent PNG. */
async function typedSignature(text: string, font: (typeof SIGN_FONTS)[number], ink: string) {
  const size = 96;
  await document.fonts.load(`${font.weight} ${size}px ${font.css}`);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `${font.weight} ${size}px ${font.css}`;
  const w = Math.ceil(ctx.measureText(text).width) + size;
  c.width = Math.max(1, w);
  c.height = Math.round(size * 1.8);
  const ctx2 = c.getContext("2d")!;
  ctx2.font = `${font.weight} ${size}px ${font.css}`;
  ctx2.fillStyle = ink;
  ctx2.textBaseline = "middle";
  ctx2.fillText(text, size / 2, c.height / 2);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  c.width = c.height = 0;
  if (!blob) throw new Error("render-failed");
  return prepareImage(blob, { trim: true });
}

export function SignaturePad({ onCreate, defaultName = "" }: { onCreate: (img: PlacedImage, label: string) => void; defaultName?: string }) {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [ink, setInk] = useState(INKS[0]);
  const [name, setName] = useState(defaultName);
  const [font, setFont] = useState<(typeof SIGN_FONTS)[number]["id"]>("great");
  const [removeBg, setRemoveBg] = useState(true);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number; mx: number; my: number } | null>(null);
  const strokes = useRef(0);

  useEffect(() => {
    if (mode !== "draw") return;
    const c = canvas.current!;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokes.current = 0;
  }, [mode]);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    canvas.current!.setPointerCapture(e.pointerId);
    const p = pos(e);
    last.current = { ...p, mx: p.x, my: p.y };
    const ctx = canvas.current!.getContext("2d")!;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
    ctx.fill();
  };
  const move = (e: React.PointerEvent) => {
    if (!last.current) return;
    const ctx = canvas.current!.getContext("2d")!;
    const p = pos(e);
    const l = last.current;
    // Quadratic smoothing through midpoints; pressure (pens) varies the width a little.
    const mx = (l.x + p.x) / 2;
    const my = (l.y + p.y) / 2;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.6 * (e.pressure && e.pointerType === "pen" ? 0.6 + e.pressure : 1);
    ctx.beginPath();
    ctx.moveTo(l.mx, l.my);
    ctx.quadraticCurveTo(l.x, l.y, mx, my);
    ctx.stroke();
    last.current = { x: p.x, y: p.y, mx, my };
    if (!hasInk) setHasInk(true);
  };
  const up = () => {
    if (last.current) strokes.current++;
    last.current = null;
    if (!hasInk && strokes.current) setHasInk(true);
  };
  const clear = () => {
    const c = canvas.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    strokes.current = 0;
  };

  const applyDrawn = async () => {
    const blob = await new Promise<Blob | null>((r) => canvas.current!.toBlob(r, "image/png"));
    if (!blob) return;
    onCreate(await prepareImage(blob, { trim: true }), "Drawn signature");
    clear();
  };
  const applyTyped = async () => {
    if (!name.trim()) return;
    const f = SIGN_FONTS.find((x) => x.id === font)!;
    onCreate(await typedSignature(name.trim(), f, ink), name.trim());
  };
  const applyUpload = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("Use a PNG, JPG or WebP image of your signature.");
    if (file.size > 10 * 1048576) return setError("That image is larger than 10 MB.");
    try {
      onCreate(await prepareImage(file, { removeWhite: removeBg ? 225 : undefined, trim: removeBg }), "Uploaded signature");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That image couldn't be used.");
    }
  };

  return (
    <div className="grid gap-3" data-testid="signature-pad">
      <Segmented
        label="Signature type"
        size="sm"
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        options={[
          { value: "draw", label: "Draw" },
          { value: "type", label: "Type" },
          { value: "upload", label: "Upload" },
        ]}
      />
      {mode !== "upload" && (
        <div className="flex items-center gap-2 text-xs text-ink-2" role="group" aria-label="Ink colour">
          Ink
          {INKS.map((c) => (
            <button key={c} type="button" aria-label={`Ink ${c}`} aria-pressed={ink === c} onClick={() => setInk(c)} className={clsx("size-6 rounded-full", ink === c && "ring-2 ring-orange ring-offset-1")} style={{ background: c }} />
          ))}
        </div>
      )}
      {mode === "draw" && (
        <>
          <div className="relative rounded-[12px] border border-dashed border-line-strong bg-white">
            <canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="block h-40 w-full cursor-crosshair touch-none" aria-label="Signature drawing area — draw with your mouse, finger or pen" role="img" data-testid="sign-canvas" />
            <span className="pointer-events-none absolute bottom-7 left-6 right-6 border-b border-line" aria-hidden />
            {!hasInk && <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-ink-3">Sign here with your mouse, finger or pen</span>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={clear} disabled={!hasInk} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-line-strong px-3 text-sm disabled:opacity-40">
              <Eraser aria-hidden className="size-4" /> Clear
            </button>
            <button type="button" onClick={applyDrawn} disabled={!hasInk} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-charcoal px-3 text-sm font-medium text-ivory disabled:opacity-40">
              <PenLine aria-hidden className="size-4" /> Use this signature
            </button>
          </div>
        </>
      )}
      {mode === "type" && (
        <>
          <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} className="h-11 rounded-[10px] border border-line-strong px-3" />
          <div className="grid gap-2" role="radiogroup" aria-label="Signature style">
            {SIGN_FONTS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={font === f.id} onClick={() => setFont(f.id)} className={clsx("flex h-14 items-center justify-between rounded-[10px] border px-3 text-left", font === f.id ? "border-charcoal bg-ivory" : "border-line-strong bg-card")}>
                <span className="truncate text-3xl" style={{ fontFamily: f.css, fontWeight: f.weight, color: ink }}>
                  {name || "Your name"}
                </span>
                <span className="shrink-0 text-xs text-ink-2">{f.label}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={applyTyped} disabled={!name.trim()} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-charcoal px-3 text-sm font-medium text-ivory disabled:opacity-40">
            <Type aria-hidden className="size-4" /> Use this signature
          </button>
        </>
      )}
      {mode === "upload" && (
        <>
          <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[12px] border border-dashed border-line-strong bg-ivory px-4 py-6 text-center text-sm hover:border-charcoal">
            <FileUp aria-hidden className="size-5" />
            <span className="font-medium">Choose a signature image</span>
            <span className="text-xs text-ink-2">PNG with a transparent background works best</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Upload a signature image" onChange={(e) => (applyUpload(e.target.files?.[0]), (e.target.value = ""))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="size-4 accent-[#F07845]" /> Remove white background and trim
          </label>
          {error && <p className="text-xs text-error">{error}</p>}
        </>
      )}
    </div>
  );
}
