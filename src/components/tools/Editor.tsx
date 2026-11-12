"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { clsx } from "clsx";

export interface EditorHandle {
  focus: () => void;
  /** Selects a character range and scrolls it into view. */
  select: (start: number, end: number) => void;
}

/**
 * Shared plain-text editor for text tools: toolbar slot, counts, optional
 * line-number gutter (with an error line highlight) and read-only output mode.
 */
export const Editor = forwardRef<
  EditorHandle,
  {
    id: string;
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    lineNumbers?: boolean;
    errorLine?: number | null;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    footer?: React.ReactNode;
    mono?: boolean;
    minHeight?: number;
    className?: string;
    tone?: "default" | "error" | "success";
  }
>(function Editor(
  { id, label, value, onChange, placeholder, readOnly, lineNumbers, errorLine, meta, actions, footer, mono, minHeight = 360, className, tone = "default" },
  ref,
) {
  const area = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => (lineNumbers ? Math.max(1, value.split("\n").length) : 0), [value, lineNumbers]);

  useImperativeHandle(ref, () => ({
    focus: () => area.current?.focus(),
    select: (start, end) => {
      const el = area.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
      // Scroll the selection into view: approximate via line height.
      const line = value.slice(0, start).split("\n").length - 1;
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 22;
      el.scrollTop = Math.max(0, line * lh - el.clientHeight / 3);
    },
  }));

  return (
    <div
      className={clsx(
        "flex min-w-0 flex-col overflow-hidden rounded-[16px] border bg-card transition-[border-color,box-shadow]",
        tone === "error" ? "border-error/50" : tone === "success" ? "border-success/40" : "border-line",
        !readOnly && "focus-within:border-charcoal focus-within:shadow-[0_0_0_3px_rgba(240,120,69,0.15)]",
        className,
      )}
    >
      <div className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <label htmlFor={id} className="text-sm font-bold">
            {label}
          </label>
          {meta && <span className="truncate font-mono text-xs text-ink-2">{meta}</span>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
      <div className="relative flex min-w-0 flex-1" style={{ minHeight }}>
        {lineNumbers && (
          <div
            ref={gutter}
            aria-hidden
            className="pointer-events-none w-12 shrink-0 select-none overflow-hidden border-r border-line bg-ivory py-4 pr-2.5 text-right font-mono text-[0.8rem] leading-[1.6rem] text-ink-3"
          >
            {Array.from({ length: Math.min(lines, 20000) }, (_, i) => (
              <div key={i} className={clsx(errorLine === i + 1 && "-mr-2.5 bg-[#fbecea] pr-2.5 font-semibold text-error")}>
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={area}
          id={id}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={(e) => {
            if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
          }}
          placeholder={placeholder}
          spellCheck={!mono && !readOnly}
          autoCapitalize="off"
          autoCorrect="off"
          wrap={lineNumbers ? "off" : "soft"}
          className={clsx(
            "min-w-0 flex-1 resize-none bg-transparent px-4 py-4 text-charcoal outline-none placeholder:text-ink-3 focus-visible:outline-none",
            mono ? "font-mono text-[0.86rem] leading-[1.6rem]" : "text-[1.02rem] leading-[1.7]",
            readOnly && "bg-ivory/40",
          )}
        />
      </div>
      {footer && <div className="border-t border-line px-4 py-2.5">{footer}</div>}
    </div>
  );
});

/** Small toolbar button used inside editors. */
export function EditorButton({ onClick, children, disabled, label }: { onClick: () => void; children: React.ReactNode; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35"
    >
      {children}
    </button>
  );
}
