"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Check, Dices, Download, Link2, RotateCcw, X } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, copyText } from "./ui";
import {
  HARMONIES,
  SHADE_STEPS,
  contrastRatio,
  formatHslA,
  formatRgbA,
  fromShareParamA,
  paletteCss,
  parseHexA,
  parseHslA,
  parseRgbA,
  toHexA,
  type ColorA,
  formatHsl,
  formatRgb,
  hslToRgb,
  palette,
  parseHex,
  randomColor,
  rgbToHsl,
  textOn,
  tintsAndShades,
  toHex,
  wcag,
  type Harmony,
  type RGB,
} from "@/lib/color";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const BRAND: RGB = { r: 240, g: 120, b: 69 };
const same = (a: RGB, b: RGB) => a.r === b.r && a.g === b.g && a.b === b.b;

function ValueField<T>({ id, label, value, parse, onValid }: { id: string; label: string; value: string; parse: (s: string) => T | null; onValid: (c: T) => void }) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? draft : value;
  const invalid = focused && draft.trim() !== "" && !parse(draft);
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex gap-1.5">
        <input
          id={id}
          value={shown}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={invalid}
          onFocus={() => {
            setDraft(value);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setDraft(e.target.value);
            const c = parse(e.target.value);
            if (c) onValid(c);
          }}
          className={clsx(
            "h-11 min-w-0 flex-1 rounded-[10px] border bg-card px-3 font-mono text-[0.92rem] outline-none transition-colors",
            invalid ? "border-error" : "border-line-strong focus:border-charcoal",
          )}
        />
        <CopyButton iconOnly text={() => value} label={`Copy ${label}`} />
      </div>
      {invalid && <p className="mt-1 text-xs text-error">Not a valid {label} value.</p>}
    </div>
  );
}

function Swatch({ c, onUse, active, compact }: { c: RGB; onUse: (c: RGB) => void; active?: boolean; compact?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (k: string, v: string) => {
    if (await copyText(v)) {
      setCopied(k);
      setTimeout(() => setCopied(null), 1200);
      track("copy_clicked", { tool: "color-picker", format: k });
    }
  };
  const hex = toHex(c);
  return (
    <div className="group min-w-0">
      <button
        type="button"
        onClick={() => onUse(c)}
        aria-label={`Use ${hex} as the main colour`}
        className={clsx("relative block w-full rounded-[10px] border transition-transform hover:-translate-y-0.5", compact ? "h-14" : "h-20", active ? "border-charcoal ring-2 ring-orange/50" : "border-black/5")}
        style={{ background: hex }}
      >
        {active && <Check aria-hidden className="absolute right-2 top-2 size-4" style={{ color: textOn(c) }} />}
      </button>
      <p className="mt-1.5 truncate font-mono text-[0.72rem] text-charcoal">{hex}</p>
      {!compact && (
        <div className="mt-1 flex gap-1">
          {(
            [
              ["HEX", hex],
              ["RGB", formatRgb(c)],
              ["HSL", formatHsl(c)],
            ] as const
          ).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => copy(k, v)}
              aria-label={`Copy ${k} ${v}`}
              className="rounded-[6px] border border-line px-1.5 py-0.5 font-mono text-[0.62rem] text-ink-2 transition-colors hover:border-charcoal hover:text-charcoal"
            >
              {copied === k ? "✓" : k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GradientSlider({ id, label, value, min, max, unit, track, onChange }: { id: string; label: string; value: number; min: number; max: number; unit: string; track: string; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.5rem] items-center gap-3">
      <label htmlFor={id} className="text-sm text-ink-2">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-gradient"
        style={{ "--track": track } as React.CSSProperties}
      />
      <span className="text-right font-mono text-sm tabular-nums">
        {value}
        {unit}
      </span>
    </div>
  );
}

function Verdict({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={clsx("flex items-center justify-between rounded-[10px] border px-3 py-2.5", pass ? "border-success/30 bg-[#f1f7f3]" : "border-error/25 bg-[#fbecea]")}>
      <span className="text-sm">{label}</span>
      <span className={clsx("flex items-center gap-1 text-sm font-bold", pass ? "text-success" : "text-[#8f2f27]")}>
        {pass ? <Check aria-hidden className="size-4" /> : <X aria-hidden className="size-4" />} {pass ? "Pass" : "Fail"}
      </span>
    </div>
  );
}

export default function ColorPicker() {
  const [color, setColor] = useState<RGB>(BRAND);
  const [alpha, setAlpha] = useState(1);
  // Remembers slider HSL so hue/saturation don't jump when a grey or black is reached.
  const [sliderHsl, setSliderHsl] = useState<{ h: number; s: number; l: number } | null>(null);
  const [harmony, setHarmony] = useState<Harmony>("complementary");
  const [history, setHistory] = useState<RGB[]>([]);
  const [fg, setFg] = useState<RGB>({ r: 37, g: 37, b: 37 });
  const [bg, setBg] = useState<RGB>({ r: 250, g: 247, b: 242 });
  const [linkCopied, setLinkCopied] = useState(false);

  // Read a shared colour (?c=RRGGBB) — strictly validated.
  useEffect(() => {
    const shared = fromShareParamA(new URLSearchParams(window.location.search).get("c"));
    if (shared) {
      setColor(shared.rgb); // eslint-disable-line react-hooks/set-state-in-effect
      setAlpha(shared.a);
    }
    track("tool_opened", { tool: "color-picker" });
  }, []);

  const choose = (c: RGB) => {
    setHistory((h) => (same(h[0] ?? { r: -1, g: -1, b: -1 }, color) ? h : [color, ...h.filter((x) => !same(x, color))].slice(0, 12)));
    setColor(c);
    setSliderHsl(null);
  };
  const setA = (c: ColorA) => {
    setColor(c.rgb);
    setAlpha(c.a);
    setSliderHsl(null);
  };

  const hex = toHex(color);
  const hexA = toHexA(color, alpha);
  const rgbaStr = formatRgbA(color, alpha);
  const hslaStr = formatHslA(color, alpha);
  const hsl = sliderHsl && toHex(hslToRgb(sliderHsl)) === hex ? sliderHsl : rgbToHsl(color);
  const setHslPart = (part: Partial<{ h: number; s: number; l: number }>) => {
    const next = { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l), ...part };
    setSliderHsl(next);
    setColor(hslToRgb(next));
  };
  const opaque = `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%`;
  const snippets: [string, string][] = [
    ["Text colour", `color: ${hexA};`],
    ["Background", `background-color: ${rgbaStr};`],
    ["Border", `border: 1px solid ${hexA};`],
    ["Custom property", `--brand-color: ${hslaStr};`],
  ];
  const pal = useMemo(() => palette(color, harmony), [color, harmony]);
  const shades = useMemo(() => tintsAndShades(color), [color]);
  const ratio = contrastRatio(fg, bg);
  const w = wcag(ratio);
  const def = HARMONIES.find((h) => h.id === harmony)!;

  const paletteJson = () =>
    JSON.stringify(
      {
        base: hexA,
        alpha,
        rgb: rgbaStr,
        hsl: hslaStr,
        harmony,
        palette: pal.map((c) => ({ hex: toHex(c), rgb: formatRgb(c), hsl: formatHsl(c) })),
        tintsAndShades: shades.map(toHex),
      },
      null,
      2,
    );

  return (
    <div className="grid gap-4 [&>*]:min-w-0">
      {/* Main colour */}
      <Panel className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.2fr] [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="checker relative flex min-h-[200px] flex-1 overflow-hidden rounded-[14px] border border-black/5">
          <motion.div
            animate={{ backgroundColor: rgbaStr }}
            transition={{ duration: 0.25 }}
            className="relative grid flex-1 place-items-center"
            data-testid="color-preview"
          >
            <div className="rounded-[10px] px-3 py-1 text-center" style={{ color: textOn(color), background: alpha < 0.6 ? "rgba(255,255,255,0.75)" : undefined, ...(alpha < 0.6 ? { color: "#252525" } : {}) }}>
              <p className="font-mono text-[clamp(1.6rem,1.2rem+1.6vw,2.6rem)] tracking-tight">{hexA}</p>
              <p className="font-mono text-sm opacity-80">{rgbaStr}</p>
            </div>
            <label className="absolute bottom-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full border-2 border-white/70 shadow-md" style={{ background: hex }} title="Open colour picker">
              <span className="sr-only">Pick a colour</span>
              <input type="color" value={hex.toLowerCase()} onChange={(e) => { setColor(parseHex(e.target.value)!); setSliderHsl(null); }} onBlur={() => choose(color)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </motion.div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => choose(randomColor())}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-charcoal px-3.5 text-sm font-medium text-ivory hover:bg-black"
            >
              <Dices aria-hidden className="size-4" /> Random
            </button>
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}${window.location.pathname}?c=${hexA.slice(1).toLowerCase()}`;
                if (await copyText(url)) {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 1500);
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal"
            >
              {linkCopied ? <Check aria-hidden className="size-4 text-success" /> : <Link2 aria-hidden className="size-4" />} {linkCopied ? "Link copied" : "Copy share link"}
            </button>
            <button type="button" onClick={() => { choose(BRAND); setAlpha(1); }} className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
              <RotateCcw aria-hidden className="size-4" /> Reset
            </button>
          </div>
        </div>

        <div className="grid content-start gap-4">
          <ValueField id="cp-hex" label="HEX" value={hexA} parse={parseHexA} onValid={setA} />
          <ValueField id="cp-rgb" label="RGB" value={rgbaStr} parse={parseRgbA} onValid={setA} />
          <ValueField id="cp-hsl" label="HSL" value={hslaStr} parse={parseHslA} onValid={setA} />
          <div className="grid gap-2.5 rounded-[12px] border border-line p-3.5" data-testid="sliders">
            <GradientSlider id="cp-h" label="Hue" value={Math.round(hsl.h)} min={0} max={360} unit="°" onChange={(h) => setHslPart({ h })} track="linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" />
            <GradientSlider id="cp-s" label="Saturation" value={Math.round(hsl.s)} min={0} max={100} unit="%" onChange={(s) => setHslPart({ s })} track={`linear-gradient(to right,hsl(${Math.round(hsl.h)},0%,${Math.round(hsl.l)}%),hsl(${Math.round(hsl.h)},100%,${Math.round(hsl.l)}%))`} />
            <GradientSlider id="cp-l" label="Lightness" value={Math.round(hsl.l)} min={0} max={100} unit="%" onChange={(l) => setHslPart({ l })} track={`linear-gradient(to right,#000,hsl(${opaque},50%),#fff)`} />
            <GradientSlider id="cp-a" label="Alpha" value={Math.round(alpha * 100)} min={0} max={100} unit="%" onChange={(a) => setAlpha(a / 100)} track={`linear-gradient(to right,rgba(${color.r},${color.g},${color.b},0),${hex}),repeating-conic-gradient(#e8ded2 0 25%,#fff 0 50%) 0 0/10px 10px`} />
          </div>
          {history.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-2">Recent (this visit)</p>
              <div className="flex flex-wrap gap-1.5">
                {history.map((c) => (
                  <button key={toHex(c)} type="button" onClick={() => choose(c)} aria-label={`Use ${toHex(c)}`} title={toHex(c)} className="size-7 rounded-[7px] border border-black/10" style={{ background: toHex(c) }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Palette */}
      <Panel className="p-5 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Palette</h2>
            <p className="mt-1 text-sm text-ink-2">{def.hint}</p>
          </div>
          <div className="flex gap-2">
            <CopyButton text={() => pal.map(toHex).join(", ")} label="Copy palette" className="!h-9" />
            <button
              type="button"
              onClick={() => {
                downloadBlob(new Blob([paletteJson()], { type: "application/json" }), `palette-${hex.slice(1).toLowerCase()}-${harmony}.json`);
                track("download_clicked", { tool: "color-picker", format: "json" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal"
            >
              <Download aria-hidden className="size-4" /> JSON
            </button>
          </div>
        </div>
        <div role="radiogroup" aria-label="Palette type" className="mt-4 flex flex-wrap gap-1.5">
          {HARMONIES.map((h) => (
            <button
              key={h.id}
              type="button"
              role="radio"
              aria-checked={harmony === h.id}
              onClick={() => setHarmony(h.id)}
              className={clsx("rounded-full border px-3 py-1.5 text-sm transition-colors", harmony === h.id ? "border-charcoal bg-charcoal text-ivory" : "border-line-strong bg-card hover:border-charcoal")}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="palette">
          {pal.map((c, i) => (
            <Swatch key={`${harmony}-${i}`} c={c} onUse={choose} active={same(c, color)} />
          ))}
        </div>

        <h3 className="mt-8 text-sm font-bold">Tints &amp; shades</h3>
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11" data-testid="shades">
          {shades.map((c, i) => (
            <Swatch key={i} c={c} onUse={choose} active={i === 5} compact />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <div>
            <h3 className="text-sm font-bold">Harmony preview</h3>
            <div className="mt-3 overflow-hidden rounded-[14px] border border-line" data-testid="harmony-preview" style={{ background: toHex(shades[0]) }}>
              <div className="flex h-3">
                {pal.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: toHex(c) }} />
                ))}
              </div>
              <div className="p-5">
                <p className="font-display text-xl font-semibold" style={{ color: toHex(shades[9]) }}>
                  Sample heading
                </p>
                <p className="mt-1 text-sm" style={{ color: toHex(shades[8]) }}>
                  How this palette might look together on a card.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pal.slice(0, 3).map((c, i) => (
                    <span key={i} className="rounded-[9px] px-3 py-1.5 text-sm font-medium" style={{ background: toHex(c), color: textOn(c) }}>
                      {i === 0 ? "Primary" : i === 1 ? "Secondary" : "Accent"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">CSS</h3>
              <CopyButton text={() => paletteCss(color, alpha, pal, shades)} label="Copy CSS variables" className="!h-9" onCopied={() => track("copy_clicked", { tool: "color-picker", format: "css-vars" })} />
            </div>
            <ul className="mt-3 divide-y divide-line rounded-[12px] border border-line" data-testid="css-snippets">
              {snippets.map(([k, v]) => (
                <li key={k} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-28 shrink-0 text-xs text-ink-2">{k}</span>
                  <code className="min-w-0 flex-1 break-all font-mono text-[0.8rem]">{v}</code>
                  <CopyButton iconOnly text={() => v} label={`Copy ${k} CSS`} className="!size-8" />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-2">Variables use {SHADE_STEPS[0]}–{SHADE_STEPS[10]} steps for tints &amp; shades ({SHADE_STEPS[5]} is your colour).</p>
          </div>
        </div>
      </Panel>

      {/* Contrast */}
      <Panel className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_1.1fr] [&>*]:min-w-0">
        <div>
          <h2 className="font-display text-xl font-semibold">Contrast checker</h2>
          <div className="mt-4 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <ValueField id="cp-fg" label="Text" value={toHex(fg)} parse={parseHex} onValid={setFg} />
            </div>
            <button
              type="button"
              onClick={() => {
                setFg(bg);
                setBg(fg);
              }}
              aria-label="Swap text and background"
              className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-card hover:border-orange"
            >
              <ArrowLeftRight className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <ValueField id="cp-bg" label="Background" value={toHex(bg)} parse={parseHex} onValid={setBg} />
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-sm">
            <button type="button" onClick={() => setFg(color)} className="rounded-full border border-line px-3 py-1 hover:border-charcoal">
              Use main colour as text
            </button>
            <button type="button" onClick={() => setBg(color)} className="rounded-full border border-line px-3 py-1 hover:border-charcoal">
              …as background
            </button>
          </div>
          <div className="mt-4 rounded-[12px] border border-line p-5" style={{ background: toHex(bg), color: toHex(fg) }}>
            <p className="text-2xl font-bold">Large text sample</p>
            <p className="mt-1 text-base">Normal body text — less effort, more done.</p>
          </div>
        </div>
        <div aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-2">Contrast ratio</p>
          <p className="mt-1 font-mono text-[clamp(2.4rem,1.8rem+2.5vw,3.4rem)] leading-none tracking-tight" data-testid="contrast-ratio">
            {(Math.floor(ratio * 100) / 100).toFixed(2)}:1
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2" data-testid="wcag">
            <Verdict label="AA · normal text (4.5:1)" pass={w.aaNormal} />
            <Verdict label="AA · large text (3:1)" pass={w.aaLarge} />
            <Verdict label="AAA · normal text (7:1)" pass={w.aaaNormal} />
            <Verdict label="AAA · large text (4.5:1)" pass={w.aaaLarge} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-2">
            Large text means at least 24px, or 18.66px bold. Passing contrast is one part of accessibility — it doesn&rsquo;t guarantee a design is accessible on its own.
          </p>
        </div>
      </Panel>
    </div>
  );
}
