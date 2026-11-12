"use client";

import { Reorder, useDragControls } from "motion/react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { clsx } from "clsx";

/**
 * Drag-to-reorder list (pointer + touch via the grip handle) with explicit
 * move up/down buttons so ordering is fully keyboard and screen-reader accessible.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  label,
  itemLabel,
  children,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  label: string;
  itemLabel: (item: T) => string;
  children: (item: T, index: number) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onReorder(next);
  };
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} as="ol" aria-label={label} className="grid min-w-0 gap-2">
      {items.map((item, i) => (
        <Row key={item.id} item={item} index={i} total={items.length} name={itemLabel(item)} onMove={(d) => move(i, i + d)}>
          {children(item, i)}
        </Row>
      ))}
    </Reorder.Group>
  );
}

function Row<T>({
  item,
  index,
  total,
  name,
  onMove,
  children,
}: {
  item: T;
  index: number;
  total: number;
  name: string;
  onMove: (delta: -1 | 1) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="relative min-w-0 list-none"
      whileDrag={{ scale: 1.015, boxShadow: "0 18px 40px -20px rgba(37,37,37,0.45)", zIndex: 5 }}
      transition={{ type: "spring", stiffness: 600, damping: 40 }}
    >
      <div className="flex items-stretch gap-1.5 rounded-[14px] border border-line bg-card p-1.5 transition-colors hover:border-line-strong">
        <button
          type="button"
          aria-label={`Drag to reorder ${name}`}
          onPointerDown={(e) => {
            e.preventDefault();
            controls.start(e);
          }}
          className="grid w-7 shrink-0 cursor-grab touch-none place-items-center rounded-[10px] text-ink-3 hover:bg-ivory-2 hover:text-charcoal active:cursor-grabbing"
          tabIndex={-1}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 flex-col justify-center gap-0.5">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onMove(d)}
              disabled={d === -1 ? index === 0 : index === total - 1}
              aria-label={`Move ${name} ${d === -1 ? "up" : "down"}`}
              className={clsx("grid size-7 place-items-center rounded-[8px] text-ink-2 transition-colors hover:bg-ivory-2 hover:text-charcoal disabled:opacity-25")}
            >
              {d === -1 ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />}
            </button>
          ))}
        </div>
      </div>
    </Reorder.Item>
  );
}
