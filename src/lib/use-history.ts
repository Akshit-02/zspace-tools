"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Undo/redo state. `set` records a step; `preview` changes the value without
 * recording (e.g. while dragging) and `commit` records everything since the
 * gesture began as a single step.
 */
export function useHistory<T>(initial: T, limit = 100) {
  const [state, setState] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const gesture = useRef<T | null>(null);

  const set = useCallback(
    (next: T | ((cur: T) => T)) =>
      setState((s) => {
        const value = typeof next === "function" ? (next as (c: T) => T)(s.present) : next;
        if (Object.is(value, s.present)) return s;
        return { past: [...s.past, s.present].slice(-limit), present: value, future: [] };
      }),
    [limit],
  );
  const preview = useCallback(
    (next: T | ((cur: T) => T)) =>
      setState((s) => {
        if (gesture.current === null) gesture.current = s.present;
        const value = typeof next === "function" ? (next as (c: T) => T)(s.present) : next;
        return { ...s, present: value };
      }),
    [],
  );
  const commit = useCallback(
    () =>
      setState((s) => {
        const start = gesture.current;
        gesture.current = null;
        if (start === null || Object.is(start, s.present)) return s;
        return { past: [...s.past, start].slice(-limit), present: s.present, future: [] };
      }),
    [limit],
  );
  const undo = useCallback(() => setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s)), []);
  const redo = useCallback(() => setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)), []);
  const reset = useCallback((value: T) => {
    gesture.current = null;
    setState({ past: [], present: value, future: [] });
  }, []);

  return { value: state.present, set, preview, commit, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0, changes: state.past.length };
}
