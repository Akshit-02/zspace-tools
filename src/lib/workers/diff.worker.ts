/// <reference lib="webworker" />
/**
 * Runs text comparisons off the main thread so typing and scrolling stay
 * smooth on large inputs. Receives two strings and options; returns rows.
 */
import { compareTexts, type DiffOptions } from "../text-diff";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<{ id: number; a: string; b: string; opts: DiffOptions }>) => {
  const { id, a, b, opts } = e.data;
  try {
    ctx.postMessage({ id, ok: true, result: compareTexts(a, b, opts) });
  } catch (err) {
    ctx.postMessage({ id, ok: false, error: err instanceof Error ? err.message : "Comparison failed" });
  }
};
