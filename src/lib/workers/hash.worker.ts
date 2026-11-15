/// <reference lib="webworker" />
/**
 * Hashes files off the main thread. Files are read here (File objects are
 * passed by reference, not copied), small ones with Web Crypto and large ones
 * in 4 MB chunks with the incremental implementation. Only the digest and
 * progress leave the worker. The page cancels a job by terminating the worker.
 */
import { hashBlob, type HashAlgo } from "../hash";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<{ job: number; file: File; algo: HashAlgo }>) => {
  const { job, file, algo } = e.data;
  let lastPost = 0;
  try {
    const r = await hashBlob(file, algo, (done) => {
      const now = Date.now();
      if (now - lastPost > 100 || done === file.size) {
        lastPost = now;
        ctx.postMessage({ type: "progress", job, done });
      }
    });
    if (r) ctx.postMessage({ type: "done", job, hex: r.hex, engine: r.engine });
  } catch {
    ctx.postMessage({ type: "error", job, error: "This file couldn't be read. It may have been moved or deleted, or the browser denied access." });
  }
};
