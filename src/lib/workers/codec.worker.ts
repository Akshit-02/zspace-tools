/// <reference lib="webworker" />
/**
 * Image codecs that browsers don't all have built in, run off the main thread:
 * HEIC/HEIF decoding (libheif, LGPL-3.0) and AVIF decoding/encoding (libavif via
 * @jsquash/avif). Only receives bytes/pixels and returns pixels/bytes.
 */
type Req =
  | { id: number; op: "heic-decode"; buffer: ArrayBuffer }
  | { id: number; op: "avif-decode"; buffer: ArrayBuffer; wasm: string }
  | { id: number; op: "avif-encode"; width: number; height: number; pixels: ArrayBuffer; quality: number; wasm: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

async function wasmModule(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("codec-unavailable");
  return WebAssembly.compile(await res.arrayBuffer());
}

let heif: Promise<{ HeifDecoder: new () => { decode(b: Uint8Array): HeifImage[] } }> | null = null;
interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(target: { data: Uint8ClampedArray; width: number; height: number }, cb: (d: { data: Uint8ClampedArray } | null) => void): void;
  free?: () => void;
}

// The single-threaded libavif builds are imported directly: the package's
// encode entry point also references a multi-threaded build (which needs
// cross-origin isolation we don't have) and confuses bundlers.
type AvifModule = { encode?: (d: Uint8Array, w: number, h: number, o: object) => Uint8Array | null; decode?: (b: ArrayBuffer, bitDepth: number) => ImageData | null };
let avifDec: Promise<AvifModule> | null = null;
let avifEnc: Promise<AvifModule> | null = null;

async function emscripten(factory: Promise<{ default: (o: object) => Promise<AvifModule> }>, wasm: string) {
  const [{ default: make }, mod] = await Promise.all([factory, wasmModule(wasm)]);
  return make({
    noInitialRun: true,
    instantiateWasm: (imports: WebAssembly.Imports, cb: (i: WebAssembly.Instance) => void) => {
      const instance = new WebAssembly.Instance(mod, imports);
      cb(instance);
      return instance.exports;
    },
  });
}

ctx.onmessage = async (e: MessageEvent<Req>) => {
  const m = e.data;
  try {
    if (m.op === "heic-decode") {
      heif ??= import("libheif-js/wasm-bundle").then((x) => ((x as unknown as { default?: unknown }).default ?? x) as never);
      const lib = await heif;
      const images = new lib.HeifDecoder().decode(new Uint8Array(m.buffer));
      if (!images?.length) throw new Error("decode-failed");
      const img = images[0];
      const width = img.get_width();
      const height = img.get_height();
      const data = await new Promise<Uint8ClampedArray>((resolve, reject) =>
        img.display({ data: new Uint8ClampedArray(width * height * 4), width, height }, (d) => (d ? resolve(d.data) : reject(new Error("decode-failed")))),
      );
      images.forEach((i) => i.free?.());
      ctx.postMessage({ id: m.id, ok: true, width, height, pixels: data.buffer, frames: images.length }, [data.buffer]);
    } else if (m.op === "avif-decode") {
      avifDec ??= emscripten(import("@jsquash/avif/codec/dec/avif_dec.js") as never, m.wasm);
      const img = (await avifDec).decode!(m.buffer, 8);
      if (!img) throw new Error("decode-failed");
      const buf = img.data.buffer as ArrayBuffer;
      ctx.postMessage({ id: m.id, ok: true, width: img.width, height: img.height, pixels: buf }, [buf]);
    } else if (m.op === "avif-encode") {
      avifEnc ??= emscripten(import("@jsquash/avif/codec/enc/avif_enc.js") as never, m.wasm);
      const { defaultOptions } = await import("@jsquash/avif/meta.js");
      // quality 0–100; speed 6 is a sensible balance for in-browser encoding.
      const out = (await avifEnc).encode!(new Uint8Array(m.pixels), m.width, m.height, { ...defaultOptions, quality: m.quality, speed: 6 });
      if (!out) throw new Error("encode-failed");
      const bytes = out.slice().buffer;
      ctx.postMessage({ id: m.id, ok: true, bytes }, [bytes]);
    }
  } catch (err) {
    ctx.postMessage({ id: m.id, ok: false, error: err instanceof Error ? err.message : "failed" });
  }
};
