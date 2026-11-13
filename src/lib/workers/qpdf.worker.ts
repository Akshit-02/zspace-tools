/// <reference lib="webworker" />
/**
 * Runs qpdf (compiled to WebAssembly) off the main thread. Each job gets a fresh
 * qpdf instance with its own in-memory file system, so nothing from one job —
 * files or passwords — survives into the next. Passwords are only ever passed
 * as command-line arguments inside this worker; they're never logged.
 */
import createModule from "@neslinesli93/qpdf-wasm";

interface Job {
  id: number;
  args: string[];
  input: ArrayBuffer;
  output: boolean;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let checked: Promise<void> | null = null;

ctx.onmessage = async (e: MessageEvent<Job>) => {
  const { id, args, input, output } = e.data;
  const lines: string[] = [];
  try {
    // The engine is self-hosted; check it's reachable once so a missing file gives a clear error.
    checked ??= fetch("/wasm/qpdf.wasm", { method: "HEAD" }).then((r) => {
      if (!r.ok) throw new Error("engine-unavailable");
    });
    await checked.catch((err) => {
      checked = null;
      throw err;
    });
    // This qpdf build sends output to console.log, bound at load time. Route stdout/stderr
    // to our own buffer instead, so nothing (such as "User password = …") reaches the console.
    let text = "";
    const sink = (c: number | null) => {
      if (c !== null && c !== undefined) text += String.fromCharCode(c);
    };
    type FS = { writeFile: (p: string, d: Uint8Array) => void; readFile: (p: string) => Uint8Array; init: (i: () => null, o: typeof sink, e: typeof sink) => void };
    const q = await (createModule as unknown as (o: object) => Promise<{ callMain: (a: string[]) => number; FS: FS }>)({
      noInitialRun: true,
      noFSInit: true,
      preRun: [(m: { FS: FS }) => m.FS.init(() => null, sink, sink)],
      // This build only supports locateFile (no instantiateWasm/wasmBinary); the HTTP cache
      // makes repeat jobs cheap while each job still gets a fresh instance.
      locateFile: () => new URL("/wasm/qpdf.wasm", ctx.location.origin).href,
    });
    q.FS.writeFile("/in.pdf", new Uint8Array(input));
    let rc: number;
    try {
      rc = q.callMain(args.map((a) => a.replace("{in}", "/in.pdf").replace("{out}", "/out.pdf")));
    } catch (err) {
      // Emscripten throws ExitStatus for non-zero exits.
      rc = typeof (err as { status?: number }).status === "number" ? (err as { status: number }).status : 2;
    }
    lines.push(...text.split("\n").filter(Boolean));
    let out: Uint8Array | null = null;
    if (output && rc !== 2) {
      try {
        out = q.FS.readFile("/out.pdf");
      } catch {
        out = null;
      }
    }
    const buf = out ? out.slice().buffer : null;
    // Never pass password values back, even to the page.
    ctx.postMessage({ id, rc, out: buf, log: lines.filter((l) => !/^\s*(user|owner) password\s*=/i.test(l)) }, buf ? [buf] : []);
  } catch (err) {
    ctx.postMessage({ id, rc: -1, out: null, log: [err instanceof Error && err.message === "engine-unavailable" ? "engine-unavailable" : "engine-failed"] });
  }
};
