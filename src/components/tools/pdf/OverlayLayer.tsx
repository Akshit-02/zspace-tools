"use client";

import { useEffect, useRef } from "react";
import { RotateCw, StickyNote } from "lucide-react";
import { clsx } from "clsx";
import { textHeight, textLines, type OverlayObject } from "@/lib/pdf-overlay";
import { CSS_FAMILY, LINE_HEIGHT, measure } from "@/lib/pdf-text";

type Handle = "nw" | "ne" | "sw" | "se";
const SIGN: Record<Handle, [number, number]> = { nw: [-1, -1], ne: [1, -1], sw: [-1, 1], se: [1, 1] };

/** Height a text object needs for its current width and text. */
export function fitText(o: OverlayObject) {
  const size = o.size ?? 14;
  const lines = textLines(o, (s) => measure(s, size, o.family ?? "sans", !!o.bold));
  return textHeight(lines.length, size);
}

function Shape({ o }: { o: OverlayObject }) {
  const sw = o.stroke ?? 2;
  const w = Math.max(o.w, 0.01);
  const h = Math.max(o.h, 0.01);
  const common = { stroke: o.color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };
  let body: React.ReactNode = null;
  if (o.kind === "rect") body = <rect x={sw / 2} y={sw / 2} width={Math.max(0, w - sw)} height={Math.max(0, h - sw)} fill={o.fill ?? "none"} {...common} />;
  else if (o.kind === "ellipse") body = <ellipse cx={w / 2} cy={h / 2} rx={Math.max(0, w / 2 - sw / 2)} ry={Math.max(0, h / 2 - sw / 2)} fill={o.fill ?? "none"} {...common} />;
  else if (o.kind === "highlight") body = <rect width={w} height={h} fill={o.color} opacity={o.opacity ?? 0.35} style={{ mixBlendMode: "multiply" }} />;
  else if (o.kind === "underline") body = <line x1={0} y1={h / 2} x2={w} y2={h / 2} {...common} />;
  else if (o.kind === "line" || o.kind === "arrow") {
    let [x1, y1, x2, y2] = o.flip ? [0, h, w, 0] : [0, 0, w, h];
    if (o.rev) [x1, y1, x2, y2] = [x2, y2, x1, y1];
    const a = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.max(8, sw * 4);
    body = (
      <>
        <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} />
        {o.kind === "arrow" && [-0.45, 0.45].map((d) => <line key={d} x1={x2} y1={y2} x2={x2 - len * Math.cos(a + d)} y2={y2 - len * Math.sin(a + d)} {...common} />)}
      </>
    );
  } else if (o.kind === "path") {
    body = <polyline points={(o.points ?? []).map(([px, py]) => `${px * w},${py * h}`).join(" ")} fill="none" {...common} />;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" style={{ opacity: o.kind === "highlight" ? 1 : (o.opacity ?? 1) }}>
      {body}
    </svg>
  );
}

export function OverlayLayer({
  objects,
  scale,
  selected,
  editing,
  onSelect,
  onEdit,
  onPreview,
  onCommit,
  onRemove,
  allowRotate,
  lockRatio,
  interactive = true,
  noHandles,
}: {
  objects: OverlayObject[];
  scale: number;
  selected: string | null;
  editing: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string | null) => void;
  onPreview: (id: string, patch: Partial<OverlayObject>) => void;
  onCommit: () => void;
  onRemove: (id: string) => void;
  allowRotate?: boolean;
  lockRatio?: (o: OverlayObject) => boolean;
  interactive?: boolean;
  noHandles?: boolean;
}) {
  const s = scale;
  const drag = useRef<{ id: string; mode: "move" | Handle | "rotate"; sx: number; sy: number; o: OverlayObject; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.sx) / s;
      const dy = (e.clientY - d.sy) / s;
      const o = d.o;
      if (d.mode === "move") onPreview(o.id, { x: o.x + dx, y: o.y + dy });
      else if (d.mode === "rotate") {
        const a = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI + 90;
        let rot = ((a % 360) + 360) % 360;
        if (!e.shiftKey) rot = Math.round(rot / 15) * 15 % 360;
        onPreview(o.id, { rot });
      } else {
        const [sx, sy] = SIGN[d.mode];
        const t = (o.rot * Math.PI) / 180;
        const c = Math.cos(t);
        const sn = Math.sin(t);
        // pointer delta in the object's own (rotated) axes
        const lx = dx * c + dy * sn;
        const ly = -dx * sn + dy * c;
        let w = Math.max(6, o.w + sx * lx);
        let h = Math.max(o.kind === "underline" ? o.h : 6, o.h + sy * ly);
        if (lockRatio?.(o)) {
          const k = Math.max(w / o.w, h / o.h);
          w = Math.max(6, o.w * k);
          h = Math.max(6, o.h * k);
        }
        if (o.kind === "text") h = fitText({ ...o, w });
        // keep the opposite corner where it was
        const cx0 = o.x + o.w / 2;
        const cy0 = o.y + o.h / 2;
        const fx = cx0 + c * (-sx * o.w) / 2 - sn * (-sy * o.h) / 2;
        const fy = cy0 + sn * (-sx * o.w) / 2 + c * (-sy * o.h) / 2;
        const ncx = fx + c * (sx * w) / 2 - sn * (sy * h) / 2;
        const ncy = fy + sn * (sx * w) / 2 + c * (sy * h) / 2;
        onPreview(o.id, { x: ncx - w / 2, y: ncy - h / 2, w, h });
      }
    };
    const up = () => {
      if (drag.current) {
        drag.current = null;
        onCommit();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [s, onPreview, onCommit, lockRatio]);

  const start = (e: React.PointerEvent, o: OverlayObject, mode: "move" | Handle | "rotate") => {
    if (!interactive || editing === o.id) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect(o.id);
    const el = (e.currentTarget as HTMLElement).closest("[data-obj]") as HTMLElement;
    const r = el.getBoundingClientRect();
    drag.current = { id: o.id, mode, sx: e.clientX, sy: e.clientY, o, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  const key = (e: React.KeyboardEvent, o: OverlayObject) => {
    if (editing === o.id) return;
    const step = e.shiftKey ? 10 : 1;
    const nudge: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (nudge[e.key]) {
      e.preventDefault();
      onPreview(o.id, { x: o.x + nudge[e.key][0], y: o.y + nudge[e.key][1] });
      onCommit();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(o.id);
    } else if (e.key === "Enter" && (o.kind === "text" || o.kind === "note")) {
      e.preventDefault();
      onEdit(o.id);
    } else if (e.key === "Escape") onSelect(null);
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {objects.map((o) => {
        const sel = selected === o.id;
        const isText = o.kind === "text";
        const size = (o.size ?? 14) * s;
        const lines = isText ? textLines(o, (t) => measure(t, o.size ?? 14, o.family ?? "sans", !!o.bold)) : [];
        return (
          <div
            key={o.id}
            data-obj={o.id}
            role="button"
            tabIndex={interactive ? 0 : -1}
            aria-label={`${o.kind === "text" ? `Text: ${(o.text ?? "").slice(0, 40)}` : o.kind === "image" ? "Image" : o.kind === "note" ? "Note" : o.kind} — drag to move${interactive ? ", Delete to remove" : ""}`}
            aria-pressed={sel}
            onPointerDown={(e) => start(e, o, "move")}
            onDoubleClick={() => (isText || o.kind === "note") && onEdit(o.id)}
            onKeyDown={(e) => key(e, o)}
            onFocus={() => interactive && onSelect(o.id)}
            className={clsx("pointer-events-auto absolute touch-none outline-none", interactive && "cursor-move", sel && "ring-2 ring-orange ring-offset-0")}
            style={{ left: o.x * s, top: o.y * s, width: o.w * s, height: o.h * s, transform: o.rot ? `rotate(${o.rot}deg)` : undefined }}
          >
            {o.kind === "image" && o.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.src} alt="" draggable={false} className="pointer-events-none size-full select-none" style={{ opacity: o.opacity ?? 1 }} />
            )}
            {isText &&
              (editing === o.id ? (
                <textarea
                  autoFocus
                  value={o.text ?? ""}
                  onChange={(e) => onPreview(o.id, { text: e.target.value, h: fitText({ ...o, text: e.target.value }) })}
                  onBlur={() => {
                    onCommit();
                    onEdit(null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.key === "Escape" && (e.target as HTMLTextAreaElement).blur()}
                  aria-label="Edit text"
                  className="absolute inset-0 resize-none overflow-hidden bg-white/70 p-0 outline-none"
                  style={{ fontFamily: CSS_FAMILY[o.family ?? "sans"], fontSize: size, lineHeight: LINE_HEIGHT, color: o.color, fontWeight: o.bold ? 700 : 400, minHeight: o.h * s }}
                />
              ) : (
                <div className="pointer-events-none size-full select-none" style={{ fontFamily: CSS_FAMILY[o.family ?? "sans"], fontSize: size, lineHeight: LINE_HEIGHT, color: o.color, fontWeight: o.bold ? 700 : 400, opacity: o.opacity ?? 1, textAlign: o.align ?? "left" }}>
                  {lines.map((l, i) => (
                    <div key={i} style={{ whiteSpace: "pre", height: size * LINE_HEIGHT }}>
                      {l || " "}
                    </div>
                  ))}
                </div>
              ))}
            {o.kind === "note" && (
              <div className="pointer-events-none grid size-full place-items-center rounded-[3px] border border-[#c9a227] bg-[#ffe680] text-[#5c4a00] shadow-sm" title={o.text}>
                <StickyNote aria-hidden style={{ width: "70%", height: "70%" }} />
              </div>
            )}
            {!isText && o.kind !== "image" && o.kind !== "note" && <Shape o={o} />}
            {sel && interactive && !noHandles && editing !== o.id && (
              <>
                {(Object.keys(SIGN) as Handle[]).map((h) => (
                  <span
                    key={h}
                    aria-hidden
                    onPointerDown={(e) => start(e, o, h)}
                    className="absolute size-3 rounded-full border-2 border-orange bg-white"
                    style={{ left: SIGN[h][0] < 0 ? -6 : undefined, right: SIGN[h][0] > 0 ? -6 : undefined, top: SIGN[h][1] < 0 ? -6 : undefined, bottom: SIGN[h][1] > 0 ? -6 : undefined, cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize" }}
                  />
                ))}
                {allowRotate && (
                  <span aria-hidden onPointerDown={(e) => start(e, o, "rotate")} className="absolute -top-8 left-1/2 grid size-6 -translate-x-1/2 cursor-grab place-items-center rounded-full border-2 border-orange bg-white text-orange">
                    <RotateCw className="size-3" />
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
