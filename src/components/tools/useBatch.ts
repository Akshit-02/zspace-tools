"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileId } from "@/lib/files";

export type BatchStatus = "queued" | "processing" | "done" | "error";

export interface BatchItem<T> {
  id: string;
  file: File;
  /** Object URL of the original file, for previews. */
  srcUrl: string;
  status: BatchStatus;
  error?: string;
  out?: T;
}

/**
 * Sequential, claim-safe processing queue for multi-file tools.
 * - One file at a time keeps memory flat on phones.
 * - `rerun()` re-queues everything (e.g. after a settings change); results from
 *   a stale run are discarded via a generation counter.
 * - All object URLs are revoked on removal, clear and unmount.
 */
export function useBatch<T>({
  process,
  release,
  onResult,
}: {
  process: (file: File) => Promise<T>;
  /** Free resources held by a result (e.g. revoke its object URL). */
  release?: (out: T) => void;
  onResult?: (file: File, out: T) => void;
}) {
  const [items, setItems] = useState<BatchItem<T>[]>([]);
  const itemsRef = useRef(items);
  const running = useRef(false);
  const generation = useRef(0);
  const claimed = useRef(new Map<string, number>());
  const fns = useRef({ process, release, onResult });

  useEffect(() => {
    fns.current = { process, release, onResult };
  });
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const gen = generation.current;
        const next = itemsRef.current.find((i) => i.status === "queued" && claimed.current.get(i.id) !== gen);
        if (!next) break;
        claimed.current.set(next.id, gen);
        setItems((list) => list.map((i) => (i.id === next.id ? { ...i, status: "processing" } : i)));
        await new Promise((r) => setTimeout(r, 16)); // let the UI paint first
        try {
          const out = await fns.current.process(next.file);
          const stale = gen !== generation.current || !itemsRef.current.some((i) => i.id === next.id);
          if (stale) {
            fns.current.release?.(out);
            continue;
          }
          setItems((list) =>
            list.map((i) => {
              if (i.id !== next.id) return i;
              if (i.out) fns.current.release?.(i.out);
              return { ...i, status: "done", error: undefined, out };
            }),
          );
          fns.current.onResult?.(next.file, out);
        } catch (e) {
          if (gen !== generation.current) continue;
          setItems((list) =>
            list.map((i) => (i.id === next.id ? { ...i, status: "error", error: e instanceof Error ? e.message : "Processing failed." } : i)),
          );
        }
        await new Promise((r) => setTimeout(r, 0)); // let React commit before the next pick
      }
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    if (items.some((i) => i.status === "queued")) void pump();
  }, [items, pump]);

  useEffect(
    () => () => {
      for (const it of itemsRef.current) {
        URL.revokeObjectURL(it.srcUrl);
        if (it.out) fns.current.release?.(it.out);
      }
    },
    [],
  );

  const add = useCallback((files: File[]) => {
    const added = files.map((file) => ({ id: fileId(), file, srcUrl: URL.createObjectURL(file), status: "queued" as const }));
    setItems((list) => [...list, ...added]);
    return added.map((a) => a.id);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((list) => {
      const it = list.find((i) => i.id === id);
      if (it) {
        URL.revokeObjectURL(it.srcUrl);
        if (it.out) fns.current.release?.(it.out);
      }
      return list.filter((i) => i.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    generation.current++;
    for (const it of itemsRef.current) {
      URL.revokeObjectURL(it.srcUrl);
      if (it.out) fns.current.release?.(it.out);
    }
    setItems([]);
  }, []);

  /** Re-process every item with the current settings. */
  const rerun = useCallback(() => {
    generation.current++;
    setItems((list) => list.map((i) => ({ ...i, status: "queued" })));
  }, []);

  /** Replace the order (items must be the same set, e.g. from a drag reorder). */
  const reorder = useCallback((next: BatchItem<T>[]) => setItems(next), []);

  const busy = items.some((i) => i.status === "queued" || i.status === "processing");
  const finished = items.filter((i) => i.status === "done" || i.status === "error").length;

  return { items, add, remove, clear, rerun, reorder, busy, finished, count: items.length };
}
