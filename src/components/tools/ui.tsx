"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, UploadCloud } from "lucide-react";
import { clsx } from "clsx";

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-[16px] border border-line bg-card", className)}>{children}</div>;
}

export function ToolSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tool" className="h-[420px] animate-pulse rounded-[16px] border border-line bg-card">
      <div className="m-6 h-full max-h-[372px] rounded-[12px] bg-ivory" />
    </div>
  );
}

export function FieldLabel({ children, htmlFor, hint }: { children: React.ReactNode; htmlFor?: string; hint?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-charcoal">
        {children}
      </label>
      {hint && <span className="font-mono text-xs text-ink-2">{hint}</span>}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-[10px] border border-line-strong bg-card px-3.5 text-[0.98rem] text-charcoal outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]";

/* ------------------------------------------------------------------ */
/* Segmented control                                                   */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: string }[];
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={clsx("flex gap-1 rounded-[12px] border border-line bg-ivory p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              "relative flex-1 rounded-[9px] font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1.5 text-[0.84rem]" : "px-3 py-2 text-[0.92rem]",
              active ? "text-charcoal" : "text-ink-2 hover:text-charcoal",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] border border-line-strong bg-card shadow-[0_1px_2px_rgba(37,37,37,0.08)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex flex-col items-center leading-tight">
              {o.label}
              {o.hint && <span className="mt-0.5 font-mono text-[0.66rem] font-normal text-ink-2">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle / checkbox row                                               */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex cursor-pointer items-center justify-between gap-4 rounded-[12px] border px-4 py-3 transition-colors",
        checked ? "border-charcoal bg-card" : "border-line bg-card hover:border-line-strong",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span>
        <span className="block text-[0.95rem] font-medium text-charcoal">{label}</span>
        {description && <span className="block font-mono text-xs text-ink-2">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className={clsx(
            "h-6 w-10 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-charcoal",
            checked ? "bg-orange" : "bg-line-strong",
          )}
        />
        <span
          aria-hidden
          className={clsx(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform duration-200 ease-[var(--ease-out)]",
            checked && "translate-x-4",
          )}
        />
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Range slider                                                        */
/* ------------------------------------------------------------------ */

export function Range({
  value,
  onChange,
  min,
  max,
  step = 1,
  id,
  label,
  onCommit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  id?: string;
  label?: string;
  onCommit?: () => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      aria-label={label}
      className="range"
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Copy button                                                         */
/* ------------------------------------------------------------------ */

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

export function CopyButton({
  text,
  onCopied,
  label = "Copy",
  className,
  variant = "secondary",
  iconOnly,
}: {
  text: () => string;
  onCopied?: () => void;
  label?: string;
  className?: string;
  variant?: "secondary" | "primary" | "dark";
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <button
      type="button"
      onClick={async () => {
        const value = text();
        if (!value) return;
        if (await copyText(value)) {
          setCopied(true);
          onCopied?.();
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1600);
        }
      }}
      aria-label={iconOnly ? (copied ? "Copied" : label) : undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition-all active:scale-[0.97]",
        iconOnly ? "size-9" : "h-10 px-3.5",
        variant === "primary" && "bg-orange text-charcoal hover:bg-[#ec6a34]",
        variant === "dark" && "bg-charcoal text-ivory hover:bg-black",
        variant === "secondary" && "border border-line-strong bg-card text-charcoal hover:border-charcoal",
        className,
      )}
    >
      {copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4" />}
      {!iconOnly && <span aria-live="polite">{copied ? "Copied" : label}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Drop zone                                                           */
/* ------------------------------------------------------------------ */

export function DropZone({
  accept,
  multiple,
  onFiles,
  title,
  subtitle,
  compact,
  formats,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title: string;
  subtitle: string;
  compact?: boolean;
  formats: string[];
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const id = useId();

  // Files chosen before hydration finished never fired React's onChange — pick them up now.
  useEffect(() => {
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length) {
      onFiles(multiple ? files : files.slice(0, 1));
      if (inputRef.current) inputRef.current.value = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      className={clsx(
        "relative overflow-hidden rounded-[16px] border-2 border-dashed transition-[border-color,background-color] duration-200",
        over ? "border-orange bg-orange-wash" : "border-line-strong bg-card hover:border-ink-3",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={id}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center text-center",
          compact ? "gap-2 px-6 py-7" : "gap-4 px-6 py-14 sm:py-20",
        )}
      >
        <motion.span
          animate={over ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className={clsx(
            "grid place-items-center rounded-[14px] transition-colors",
            compact ? "size-10" : "size-14",
            over ? "bg-orange text-charcoal" : "bg-charcoal text-ivory",
          )}
        >
          <UploadCloud aria-hidden className={compact ? "size-5" : "size-6"} strokeWidth={1.7} />
        </motion.span>
        <span>
          <span className={clsx("block font-medium text-charcoal", compact ? "text-[0.98rem]" : "font-display text-2xl font-semibold tracking-[-0.01em]")}>
            {over ? "Drop to add" : title}
          </span>
          <span className="mt-1 block text-sm text-ink-2">{subtitle}</span>
        </span>
        {!compact && (
          <span className="flex flex-wrap justify-center gap-1.5">
            {formats.map((f) => (
              <span key={f} className="rounded-[6px] border border-line bg-ivory px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">
                {f}
              </span>
            ))}
          </span>
        )}
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notices                                                             */
/* ------------------------------------------------------------------ */

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-[12px] border px-4 py-3 text-sm",
        tone === "error" && "border-error/30 bg-[#fbecea] text-[#8f2f27]",
        tone === "success" && "border-success/30 bg-[#e9f3ed] text-[#245c3d]",
        tone === "info" && "border-line bg-ivory-2 text-charcoal",
      )}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-label={label ?? "Progress"} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full rounded-full bg-orange" animate={{ width: `${pct}%` }} transition={{ ease: "easeOut", duration: 0.3 }} />
      </div>
    </div>
  );
}
