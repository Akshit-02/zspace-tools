"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, AtSign, Download, Eye, EyeOff, ImagePlus, Link2, Phone, RotateCcw, Type, Wifi, X } from "lucide-react";
import { clsx } from "clsx";
import { FieldLabel, Notice, Panel, Segmented, Toggle, inputClass } from "./ui";
import { LOGO_SCALE, buildPayload, contrast, makeMatrix, toSvg, type Ecc, type QrFields, type QrType } from "@/lib/qr";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const TYPES: { value: QrType; label: string; icon: typeof Link2 }[] = [
  { value: "url", label: "URL", icon: Link2 },
  { value: "text", label: "Text", icon: Type },
  { value: "email", label: "Email", icon: AtSign },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "wifi", label: "Wi-Fi", icon: Wifi },
];

const SIZES = ["256", "512", "1024", "2048"] as const;
const MARGIN = 4; // modules — the standard quiet zone
const HEX = /^#[0-9a-f]{6}$/i;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const initialFields: QrFields = {
  url: "",
  text: "",
  email: "",
  subject: "",
  body: "",
  phone: "",
  ssid: "",
  password: "",
  security: "WPA",
  hidden: false,
};

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setDraft(value);
  }
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex h-11 items-center gap-2 rounded-[10px] border border-line-strong bg-card pl-1.5 pr-2 focus-within:border-charcoal">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-[7px] border border-line bg-transparent p-0 [&::-moz-color-swatch]:rounded-[6px] [&::-webkit-color-swatch]:rounded-[6px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          id={id}
          value={draft}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setDraft(v);
            if (HEX.test(v)) onChange(v.toLowerCase());
          }}
          className="w-full bg-transparent font-mono text-sm uppercase outline-none"
        />
      </div>
    </div>
  );
}

export default function QrGenerator() {
  const [type, setType] = useState<QrType>("url");
  const [fields, setFields] = useState<QrFields>(initialFields);
  const [fg, setFg] = useState("#252525");
  const [bg, setBg] = useState("#ffffff");
  const [size, setSize] = useState<(typeof SIZES)[number]>("1024");
  const [eccChoice, setEccChoice] = useState<Ecc>("M");
  const [logo, setLogo] = useState<{ dataUrl: string; name: string } | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof QrFields>(k: K, v: QrFields[K]) => setFields((f) => ({ ...f, [k]: v }));
  const payload = buildPayload(type, fields);
  // A logo hides part of the code, so the highest error correction is enforced.
  const ecc: Ecc = logo ? "H" : eccChoice;

  const result = useMemo(() => {
    if (!payload) return { svg: null, error: null, modules: 0 };
    try {
      const m = makeMatrix(payload, ecc, Boolean(logo));
      const svg = toSvg(m, { fg, bg, margin: MARGIN, logo: logo ? { dataUrl: logo.dataUrl, scale: LOGO_SCALE } : null });
      return { svg, error: null, modules: m.size, matrix: m };
    } catch {
      return { svg: null, error: "This content is too long to fit in a QR code. Shorten it or lower the error correction level.", modules: 0 };
    }
  }, [payload, ecc, fg, bg, logo]);

  const c = contrast(fg, bg);
  const lowContrast = c.ratio < 4;

  // Report that a code was generated (type only — never the content), debounced.
  const lastTracked = useRef("");
  useEffect(() => {
    if (!result.svg) return;
    const t = setTimeout(() => {
      if (lastTracked.current !== type) {
        lastTracked.current = type;
        track("qr_generated", { tool: "qr-code-generator", qr_type: type });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [result.svg, type]);

  const fileBase = `qr-${type}`;

  const downloadSvg = () => {
    if (!result.svg) return;
    downloadBlob(new Blob([result.svg], { type: "image/svg+xml" }), `${fileBase}.svg`);
    track("download_clicked", { tool: "qr-code-generator", format: "svg", qr_type: type });
  };

  const downloadPng = async () => {
    if (!result.matrix) return;
    const px = Number(size);
    const m = result.matrix;
    const n = m.size + MARGIN * 2;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = fg;
    const unit = px / n;
    for (let y = 0; y < m.size; y++)
      for (let x = 0; x < m.size; x++)
        if (m.get(x, y)) {
          // Snap to whole pixels so neighbouring modules never leave hairline gaps.
          const x0 = Math.round((x + MARGIN) * unit);
          const y0 = Math.round((y + MARGIN) * unit);
          ctx.fillRect(x0, y0, Math.round((x + MARGIN + 1) * unit) - x0, Math.round((y + MARGIN + 1) * unit) - y0);
        }
    if (logo) {
      const img = new Image();
      img.src = logo.dataUrl;
      await img.decode();
      const box = px * LOGO_SCALE;
      const pad = box * 0.12;
      const o = (px - box) / 2;
      ctx.imageSmoothingEnabled = true;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(o - pad, o - pad, box + pad * 2, box + pad * 2, pad * 1.4);
      ctx.fill();
      const ratio = Math.min(box / img.naturalWidth, box / img.naturalHeight) || 1;
      const w = img.naturalWidth * ratio;
      const h = img.naturalHeight * ratio;
      ctx.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
    }
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${fileBase}-${px}.png`);
    }, "image/png");
    track("download_clicked", { tool: "qr-code-generator", format: "png", qr_type: type });
  };

  const onLogo = (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      setLogoError("Use a PNG, JPG, WebP or SVG image for the logo.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo images must be 2 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo({ dataUrl: String(reader.result), name: file.name });
    reader.onerror = () => setLogoError("That image could not be read.");
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setFields(initialFields);
    setFg("#252525");
    setBg("#ffffff");
    setSize("1024");
    setEccChoice("M");
    setLogo(null);
    setLogoError(null);
  };

  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.25fr_1fr]">
      {/* Inputs */}
      <Panel className="p-5 sm:p-7">
        <div role="tablist" aria-label="QR code type" className="grid grid-cols-5 gap-1 rounded-[12px] border border-line bg-ivory p-1">
          {TYPES.map((t) => {
            const active = type === t.value;
            return (
              <button
                key={t.value}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setType(t.value)}
                className={clsx(
                  "relative flex flex-col items-center gap-1 rounded-[9px] px-1 py-2 text-[0.8rem] font-medium transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:text-[0.9rem]",
                  active ? "text-charcoal" : "text-ink-2 hover:text-charcoal",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="qr-type"
                    className="absolute inset-0 rounded-[9px] border border-line-strong bg-card shadow-[0_1px_2px_rgba(37,37,37,0.08)]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <t.icon aria-hidden className={clsx("relative size-4", active && "text-orange-ink")} />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-6 grid gap-4"
          >
            {type === "url" && (
              <div>
                <FieldLabel htmlFor="qr-url">Website URL</FieldLabel>
                <input
                  id="qr-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://example.com"
                  value={fields.url}
                  onChange={(e) => set("url", e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-ink-2">https:// is added automatically if you leave it out.</p>
              </div>
            )}
            {type === "text" && (
              <div>
                <FieldLabel htmlFor="qr-text" hint={`${fields.text.length} chars`}>
                  Text
                </FieldLabel>
                <textarea
                  id="qr-text"
                  rows={4}
                  placeholder="Any text you want people to see when they scan"
                  value={fields.text}
                  onChange={(e) => set("text", e.target.value)}
                  className={clsx(inputClass, "h-auto resize-y py-3")}
                />
              </div>
            )}
            {type === "email" && (
              <>
                <div>
                  <FieldLabel htmlFor="qr-email">Email address</FieldLabel>
                  <input id="qr-email" type="email" autoComplete="email" placeholder="hello@example.com" value={fields.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="qr-subject">Subject (optional)</FieldLabel>
                  <input id="qr-subject" value={fields.subject} onChange={(e) => set("subject", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel htmlFor="qr-body">Message (optional)</FieldLabel>
                  <textarea id="qr-body" rows={3} value={fields.body} onChange={(e) => set("body", e.target.value)} className={clsx(inputClass, "h-auto resize-y py-3")} />
                </div>
              </>
            )}
            {type === "phone" && (
              <div>
                <FieldLabel htmlFor="qr-phone">Phone number</FieldLabel>
                <input id="qr-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+44 20 7946 0000" value={fields.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
                <p className="mt-1.5 text-xs text-ink-2">Include the country code (e.g. +1, +44, +91) so it works internationally.</p>
              </div>
            )}
            {type === "wifi" && (
              <>
                <div>
                  <FieldLabel htmlFor="qr-ssid">Network name (SSID)</FieldLabel>
                  <input id="qr-ssid" autoComplete="off" spellCheck={false} value={fields.ssid} onChange={(e) => set("ssid", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel>Security</FieldLabel>
                  <Segmented
                    label="Wi-Fi security"
                    value={fields.security}
                    onChange={(v) => set("security", v)}
                    options={[
                      { value: "WPA", label: "WPA/WPA2/WPA3" },
                      { value: "WEP", label: "WEP" },
                      { value: "nopass", label: "None" },
                    ]}
                  />
                </div>
                {fields.security !== "nopass" && (
                  <div>
                    <FieldLabel htmlFor="qr-wpass">Password</FieldLabel>
                    <div className="relative">
                      <input
                        id="qr-wpass"
                        type={showPw ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        value={fields.password}
                        onChange={(e) => set("password", e.target.value)}
                        className={clsx(inputClass, "pr-11 font-mono")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
                      >
                        {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <Toggle checked={fields.hidden} onChange={(v) => set("hidden", v)} label="Hidden network" description="Tick if the SSID is not broadcast" />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm font-bold">Style</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ColorField id="qr-fg" label="Foreground" value={fg} onChange={setFg} />
            <ColorField id="qr-bg" label="Background" value={bg} onChange={setBg} />
          </div>
          {lowContrast && (
            <p className="mt-3 flex items-start gap-2 text-sm text-[#8f2f27]">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              Contrast is low ({c.ratio.toFixed(1)}:1). Some phones may not scan this — use a darker foreground.
            </p>
          )}
          {!lowContrast && c.inverted && (
            <p className="mt-3 flex items-start gap-2 text-sm text-ink-2">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[#b07a1f]" />
              Light-on-dark codes are not supported by every scanner. Test before printing.
            </p>
          )}

          <div className="mt-5">
            <FieldLabel hint={logo ? "locked to H with logo" : undefined}>Error correction</FieldLabel>
            <Segmented
              label="Error correction"
              size="sm"
              value={ecc}
              onChange={(v) => setEccChoice(v)}
              options={[
                { value: "L", label: "L", hint: "7%" },
                { value: "M", label: "M", hint: "15%" },
                { value: "Q", label: "Q", hint: "25%" },
                { value: "H", label: "H", hint: "30%" },
              ]}
            />
          </div>

          <div className="mt-5">
            <FieldLabel>Logo (optional)</FieldLabel>
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              aria-label="Upload logo"
              onChange={(e) => {
                onLogo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {logo ? (
              <div className="flex items-center gap-3 rounded-[12px] border border-line bg-ivory p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo.dataUrl} alt="" className="size-10 rounded-[8px] border border-line bg-card object-contain" />
                <span className="min-w-0 flex-1 truncate text-sm">{logo.name}</span>
                <button type="button" onClick={() => setLogo(null)} aria-label="Remove logo" className="grid size-8 place-items-center rounded-[8px] text-ink-2 hover:bg-card hover:text-charcoal">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-strong bg-card py-3 text-sm text-ink-2 transition-colors hover:border-charcoal hover:text-charcoal"
              >
                <ImagePlus aria-hidden className="size-4" /> Add a logo
              </button>
            )}
            {logoError && <p className="mt-2 text-sm text-[#8f2f27]">{logoError}</p>}
          </div>
        </div>
      </Panel>

      {/* Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Panel className="overflow-hidden">
          <div className="dotgrid grid place-items-center border-b border-line bg-ivory p-6 sm:p-10">
            <div className="relative aspect-square w-full max-w-[320px]">
              <AnimatePresence mode="popLayout">
                {result.svg ? (
                  <motion.img
                    key="qr"
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`}
                    alt="QR code preview"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="size-full rounded-[12px] shadow-[0_20px_50px_-30px_rgba(37,37,37,0.5)]"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid size-full place-items-center rounded-[12px] border-2 border-dashed border-line-strong bg-card/70 p-8 text-center text-sm text-ink-2"
                  >
                    {result.error ? "Content too long" : "Your QR code will appear here as you type"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            {result.error && (
              <div className="mb-4">
                <Notice tone="error">{result.error}</Notice>
              </div>
            )}
            <dl className="grid grid-cols-3 gap-3 font-mono text-[0.78rem]">
              <div>
                <dt className="font-sans text-xs text-ink-2">Modules</dt>
                <dd>{result.modules ? `${result.modules}×${result.modules}` : "—"}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs text-ink-2">Correction</dt>
                <dd>{ecc}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs text-ink-2">Type</dt>
                <dd>Static</dd>
              </div>
            </dl>
            <div className="mt-5">
              <FieldLabel>PNG size</FieldLabel>
              <Segmented
                label="PNG size"
                size="sm"
                value={size}
                onChange={setSize}
                options={SIZES.map((s) => ({ value: s, label: <span className="font-mono">{s}</span> }))}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={downloadPng}
                disabled={!result.svg}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal transition-colors hover:bg-[#ec6a34] disabled:opacity-40"
              >
                <Download aria-hidden className="size-4" /> PNG
              </button>
              <button
                type="button"
                onClick={downloadSvg}
                disabled={!result.svg}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory transition-colors hover:bg-black disabled:opacity-40"
              >
                <Download aria-hidden className="size-4" /> SVG
              </button>
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[12px] py-2 text-sm text-ink-2 transition-colors hover:text-charcoal"
            >
              <RotateCcw aria-hidden className="size-3.5" /> Reset
            </button>
            <p className="mt-3 text-xs text-ink-2">Always test-scan with your phone before printing.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
