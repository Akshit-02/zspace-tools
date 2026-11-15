/**
 * Hashing for the File Hash Generator.
 *
 * Web Crypto's `crypto.subtle.digest` is fast but needs the whole input in one
 * buffer — it cannot stream. So small inputs use Web Crypto, and large files
 * are fed in chunks to the incremental FIPS 180-4 implementations below (also
 * the fallback where Web Crypto is unavailable, e.g. non-HTTPS pages). The
 * unit tests check both paths against Node's OpenSSL-backed hashes.
 */

export type HashAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
export const ALGOS: HashAlgo[] = ["SHA-256", "SHA-384", "SHA-512", "SHA-1"];
export const HEX_LENGTH: Record<HashAlgo, number> = { "SHA-1": 40, "SHA-256": 64, "SHA-384": 96, "SHA-512": 128 };

export interface Hasher {
  update(data: Uint8Array): void;
  digest(): Uint8Array;
}

/* ------------------------------------------------------------------ */
/* Shared Merkle–Damgård buffering                                     */
/* ------------------------------------------------------------------ */

abstract class BlockHasher implements Hasher {
  protected buf: Uint8Array;
  protected bufLen = 0;
  protected total = 0;
  private done = false;
  constructor(protected blockSize: number) {
    this.buf = new Uint8Array(blockSize);
  }
  protected abstract block(data: Uint8Array, off: number): void;
  protected abstract out(): Uint8Array;

  update(data: Uint8Array) {
    if (this.done) throw new Error("Hasher already finalised");
    let off = 0;
    const len = data.length;
    this.total += len;
    if (this.bufLen) {
      const take = Math.min(len, this.blockSize - this.bufLen);
      this.buf.set(data.subarray(0, take), this.bufLen);
      this.bufLen += take;
      off = take;
      if (this.bufLen < this.blockSize) return;
      this.block(this.buf, 0);
      this.bufLen = 0;
    }
    while (off + this.blockSize <= len) {
      this.block(data, off);
      off += this.blockSize;
    }
    if (off < len) {
      this.buf.set(data.subarray(off), 0);
      this.bufLen = len - off;
    }
  }

  digest() {
    if (this.done) throw new Error("Hasher already finalised");
    this.done = true;
    const lenBytes = this.blockSize === 64 ? 8 : 16;
    const bits = this.total * 8;
    const pad = new Uint8Array(this.blockSize * 2);
    pad.set(this.buf.subarray(0, this.bufLen));
    pad[this.bufLen] = 0x80;
    const padded = this.bufLen + 1 + lenBytes <= this.blockSize ? this.blockSize : this.blockSize * 2;
    // Message length in bits, big-endian, in the last 8 bytes (inputs < 2^53 bits).
    const hi = Math.floor(bits / 0x100000000);
    const lo = bits >>> 0;
    const v = new DataView(pad.buffer);
    v.setUint32(padded - 8, hi);
    v.setUint32(padded - 4, lo);
    for (let o = 0; o < padded; o += this.blockSize) this.block(pad, o);
    return this.out();
  }
}

/* ------------------------------------------------------------------ */
/* SHA-1                                                               */
/* ------------------------------------------------------------------ */

class Sha1 extends BlockHasher {
  private h = new Int32Array([0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476, 0xc3d2e1f0 | 0]);
  private w = new Int32Array(80);
  constructor() {
    super(64);
  }
  protected block(d: Uint8Array, o: number) {
    const w = this.w;
    for (let i = 0; i < 16; i++, o += 4) w[i] = (d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3];
    for (let i = 16; i < 80; i++) {
      const x = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (x << 1) | (x >>> 31);
    }
    let [a, b, c, dd, e] = this.h;
    for (let i = 0; i < 80; i++) {
      let f: number, k: number;
      if (i < 20) {
        f = (b & c) | (~b & dd);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ dd;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & dd) | (c & dd);
        k = 0x8f1bbcdc | 0;
      } else {
        f = b ^ c ^ dd;
        k = 0xca62c1d6 | 0;
      }
      const t = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) | 0;
      e = dd;
      dd = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    const h = this.h;
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + dd) | 0;
    h[4] = (h[4] + e) | 0;
  }
  protected out() {
    const r = new Uint8Array(20);
    const v = new DataView(r.buffer);
    this.h.forEach((x, i) => v.setInt32(i * 4, x));
    return r;
  }
}

/* ------------------------------------------------------------------ */
/* SHA-256                                                             */
/* ------------------------------------------------------------------ */

const K256 = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

class Sha256 extends BlockHasher {
  private h = new Int32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  private w = new Int32Array(64);
  constructor() {
    super(64);
  }
  protected block(d: Uint8Array, o: number) {
    const w = this.w;
    for (let i = 0; i < 16; i++, o += 4) w[i] = (d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3];
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
      const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    const h = this.h;
    let a = h[0], b = h[1], c = h[2], dd = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g;
      g = f;
      f = e;
      e = (dd + t1) | 0;
      dd = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + dd) | 0;
    h[4] = (h[4] + e) | 0;
    h[5] = (h[5] + f) | 0;
    h[6] = (h[6] + g) | 0;
    h[7] = (h[7] + hh) | 0;
  }
  protected out() {
    const r = new Uint8Array(32);
    const v = new DataView(r.buffer);
    this.h.forEach((x, i) => v.setInt32(i * 4, x));
    return r;
  }
}

/* ------------------------------------------------------------------ */
/* SHA-512 / SHA-384 (64-bit words as hi/lo 32-bit pairs)              */
/* ------------------------------------------------------------------ */

// prettier-ignore
const K512 = new Int32Array([
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc, 0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df, 0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c, 0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817,
]);

const IV512 = [0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179];
const IV384 = [0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939, 0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4];

class Sha512 extends BlockHasher {
  private h: Int32Array;
  private w = new Int32Array(160);
  constructor(iv: number[], private outBytes: number) {
    super(128);
    this.h = Int32Array.from(iv, (x) => x | 0);
  }
  protected block(d: Uint8Array, o: number) {
    const w = this.w;
    for (let i = 0; i < 32; i++, o += 4) w[i] = (d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3];
    for (let i = 16; i < 80; i++) {
      // σ0 = ROTR1 ^ ROTR8 ^ SHR7 of w[i-15]
      const xh = w[(i - 15) * 2], xl = w[(i - 15) * 2 + 1];
      const s0h = ((xh >>> 1) | (xl << 31)) ^ ((xh >>> 8) | (xl << 24)) ^ (xh >>> 7);
      const s0l = ((xl >>> 1) | (xh << 31)) ^ ((xl >>> 8) | (xh << 24)) ^ ((xl >>> 7) | (xh << 25));
      // σ1 = ROTR19 ^ ROTR61 ^ SHR6 of w[i-2]
      const yh = w[(i - 2) * 2], yl = w[(i - 2) * 2 + 1];
      const s1h = ((yh >>> 19) | (yl << 13)) ^ ((yl >>> 29) | (yh << 3)) ^ (yh >>> 6);
      const s1l = ((yl >>> 19) | (yh << 13)) ^ ((yh >>> 29) | (yl << 3)) ^ ((yl >>> 6) | (yh << 26));
      // w[i] = w[i-16] + σ0 + w[i-7] + σ1 (64-bit add)
      let lo = (w[(i - 16) * 2 + 1] >>> 0) + (s0l >>> 0) + (w[(i - 7) * 2 + 1] >>> 0) + (s1l >>> 0);
      const hi = (w[(i - 16) * 2] + s0h + w[(i - 7) * 2] + s1h + Math.floor(lo / 0x100000000)) | 0;
      lo = lo | 0;
      w[i * 2] = hi;
      w[i * 2 + 1] = lo;
    }
    const h = this.h;
    let ah = h[0], al = h[1], bh = h[2], bl = h[3], ch = h[4], cl = h[5], dh = h[6], dl = h[7];
    let eh = h[8], el = h[9], fh = h[10], fl = h[11], gh = h[12], gl = h[13], hh = h[14], hl = h[15];
    for (let i = 0; i < 80; i++) {
      // Σ1(e) = ROTR14 ^ ROTR18 ^ ROTR41
      const S1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
      const S1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
      const chh = (eh & fh) ^ (~eh & gh);
      const chl = (el & fl) ^ (~el & gl);
      // t1 = h + Σ1 + ch + K + w
      let t1l = (hl >>> 0) + (S1l >>> 0) + (chl >>> 0) + (K512[i * 2 + 1] >>> 0) + (w[i * 2 + 1] >>> 0);
      const t1h = (hh + S1h + chh + K512[i * 2] + w[i * 2] + Math.floor(t1l / 0x100000000)) | 0;
      t1l = t1l | 0;
      // Σ0(a) = ROTR28 ^ ROTR34 ^ ROTR39
      const S0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
      const S0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
      const majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
      const majl = (al & bl) ^ (al & cl) ^ (bl & cl);
      let t2l = (S0l >>> 0) + (majl >>> 0);
      const t2h = (S0h + majh + Math.floor(t2l / 0x100000000)) | 0;
      t2l = t2l | 0;
      hh = gh; hl = gl;
      gh = fh; gl = fl;
      fh = eh; fl = el;
      let el2 = (dl >>> 0) + (t1l >>> 0);
      eh = (dh + t1h + Math.floor(el2 / 0x100000000)) | 0;
      el = el2 | 0;
      dh = ch; dl = cl;
      ch = bh; cl = bl;
      bh = ah; bl = al;
      el2 = (t1l >>> 0) + (t2l >>> 0);
      ah = (t1h + t2h + Math.floor(el2 / 0x100000000)) | 0;
      al = el2 | 0;
    }
    const add = (i: number, xh: number, xl: number) => {
      const lo = (h[i + 1] >>> 0) + (xl >>> 0);
      h[i] = (h[i] + xh + Math.floor(lo / 0x100000000)) | 0;
      h[i + 1] = lo | 0;
    };
    add(0, ah, al);
    add(2, bh, bl);
    add(4, ch, cl);
    add(6, dh, dl);
    add(8, eh, el);
    add(10, fh, fl);
    add(12, gh, gl);
    add(14, hh, hl);
  }
  protected out() {
    const r = new Uint8Array(64);
    const v = new DataView(r.buffer);
    this.h.forEach((x, i) => v.setInt32(i * 4, x));
    return r.slice(0, this.outBytes);
  }
}

export function createHasher(algo: HashAlgo): Hasher {
  switch (algo) {
    case "SHA-1":
      return new Sha1();
    case "SHA-256":
      return new Sha256();
    case "SHA-384":
      return new Sha512(IV384, 48);
    case "SHA-512":
      return new Sha512(IV512, 64);
  }
}

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/* ------------------------------------------------------------------ */
/* Hashing text and blobs                                              */
/* ------------------------------------------------------------------ */

/** Inputs up to this size use Web Crypto (needs the whole file in memory); larger ones stream in chunks. */
export const NATIVE_MAX_BYTES = 64 * 1024 * 1024;
export const CHUNK_BYTES = 4 * 1024 * 1024;
export const MAX_FILE_BYTES = 4 * 1024 * 1024 * 1024;

type Subtle = { digest: (a: string, d: BufferSource) => Promise<ArrayBuffer> };
export function nativeSubtle(): Subtle | null {
  const c = (globalThis as { crypto?: { subtle?: Subtle } }).crypto;
  return c?.subtle && typeof c.subtle.digest === "function" ? c.subtle : null;
}

export type Engine = "web-crypto" | "streaming";

export async function hashBytes(bytes: Uint8Array, algo: HashAlgo): Promise<{ hex: string; engine: Engine }> {
  const subtle = nativeSubtle();
  if (subtle) {
    try {
      return { hex: toHex(new Uint8Array(await subtle.digest(algo, bytes as BufferSource))), engine: "web-crypto" };
    } catch {
      /* fall through to the JS implementation */
    }
  }
  const h = createHasher(algo);
  h.update(bytes);
  return { hex: toHex(h.digest()), engine: "streaming" };
}

export const hashText = (text: string, algo: HashAlgo) => hashBytes(new TextEncoder().encode(text), algo);

export interface BlobLike {
  size: number;
  slice(start: number, end: number): { arrayBuffer(): Promise<ArrayBuffer> };
  arrayBuffer(): Promise<ArrayBuffer>;
}

/** Hashes a File/Blob. Calls `onProgress(bytesDone)`; stops early if `cancelled()` returns true. */
export async function hashBlob(
  blob: BlobLike,
  algo: HashAlgo,
  onProgress?: (done: number) => void,
  cancelled?: () => boolean,
  nativeMax = NATIVE_MAX_BYTES,
): Promise<{ hex: string; engine: Engine } | null> {
  if (blob.size <= nativeMax && nativeSubtle()) {
    const r = await hashBytes(new Uint8Array(await blob.arrayBuffer()), algo);
    onProgress?.(blob.size);
    return r;
  }
  const h = createHasher(algo);
  for (let off = 0; off < blob.size; off += CHUNK_BYTES) {
    if (cancelled?.()) return null;
    h.update(new Uint8Array(await blob.slice(off, Math.min(blob.size, off + CHUNK_BYTES)).arrayBuffer()));
    onProgress?.(Math.min(blob.size, off + CHUNK_BYTES));
  }
  if (!blob.size) onProgress?.(0);
  return { hex: toHex(h.digest()), engine: "streaming" };
}

/* ------------------------------------------------------------------ */
/* Expected checksums                                                  */
/* ------------------------------------------------------------------ */

export type Expected =
  | { kind: "empty" }
  | { kind: "invalid"; message: string }
  | { kind: "single"; hex: string }
  | { kind: "list"; entries: { name: string; hex: string }[] };

const algoForLength = (n: number) => (Object.keys(HEX_LENGTH) as HashAlgo[]).find((a) => HEX_LENGTH[a] === n);
const ALGO_PREFIX = /^(sha-?(?:1|256|384|512))\s*[:=]\s*/i;
const normAlgo = (s: string) => `SHA-${s.replace(/^sha-?/i, "")}` as HashAlgo;

function checkHex(hex: string, algo: HashAlgo): string | null {
  if (!/^[0-9a-f]+$/i.test(hex)) {
    if (/^[A-Za-z0-9+/]+=*$/.test(hex) && hex.length < HEX_LENGTH[algo]) return "That looks like a Base64 value. Paste the checksum in hexadecimal (0–9 and a–f).";
    return "A checksum may only contain the hexadecimal characters 0–9 and a–f.";
  }
  if (hex.length !== HEX_LENGTH[algo]) {
    const other = algoForLength(hex.length);
    if (other) return `This is ${hex.length} characters long, which matches ${other}, not ${algo}. Choose ${other} to compare it — different algorithms never produce matching values.`;
    return `A ${algo} checksum is ${HEX_LENGTH[algo]} hexadecimal characters; this one has ${hex.length}.`;
  }
  return null;
}

/**
 * Parses what the user pasted as the expected value: a bare hex digest
 * (whitespace and letter case ignored), an "sha256:<hex>" value, or a checksum
 * list in GNU ("<hex>  name" / "<hex> *name") or BSD ("SHA256 (name) = <hex>") format.
 */
export function parseExpected(input: string, algo: HashAlgo): Expected {
  const text = input.trim();
  if (!text) return { kind: "empty" };
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1 && !/\s/.test(lines[0].replace(ALGO_PREFIX, ""))) {
    let v = lines[0];
    const pre = ALGO_PREFIX.exec(v);
    if (pre) {
      const named = normAlgo(pre[1]);
      if (named !== algo) return { kind: "invalid", message: `This value is labelled ${named}, but ${algo} is selected.` };
      v = v.slice(pre[0].length);
    }
    const err = checkHex(v, algo);
    return err ? { kind: "invalid", message: err } : { kind: "single", hex: v.toLowerCase() };
  }
  const entries: { name: string; hex: string }[] = [];
  for (const l of lines) {
    const bsd = /^(SHA-?(?:1|256|384|512))\s*\((.+)\)\s*=\s*([0-9a-fA-F]+)$/i.exec(l);
    const gnu = /^\\?([0-9a-fA-F]+)\s+\*?(.+)$/.exec(l);
    let name: string, hex: string;
    if (bsd) {
      if (normAlgo(bsd[1]) !== algo) return { kind: "invalid", message: `The list uses ${normAlgo(bsd[1])}, but ${algo} is selected.` };
      name = bsd[2];
      hex = bsd[3];
    } else if (gnu) {
      name = gnu[2];
      hex = gnu[1];
    } else {
      return { kind: "invalid", message: `Couldn't read “${l.length > 60 ? `${l.slice(0, 60)}…` : l}”. Paste one checksum, or lines like “<checksum>  filename”.` };
    }
    const err = checkHex(hex, algo);
    if (err) return { kind: "invalid", message: `${name}: ${err}` };
    entries.push({ name: name.trim(), hex: hex.toLowerCase() });
  }
  return { kind: "list", entries };
}

export type Verdict = "match" | "mismatch" | "no-entry" | "none";

/** Compares a computed digest with the parsed expected value for a given file name. */
export function verify(hex: string, expected: Expected, name?: string, onlyOne = false): Verdict {
  if (expected.kind === "single") return expected.hex === hex.toLowerCase() ? "match" : "mismatch";
  if (expected.kind === "list") {
    const base = name?.split(/[\\/]/).pop();
    const entry = expected.entries.find((e) => e.name.split(/[\\/]/).pop() === base) ?? (onlyOne && expected.entries.length === 1 ? expected.entries[0] : undefined);
    if (!entry) return "no-entry";
    return entry.hex === hex.toLowerCase() ? "match" : "mismatch";
  }
  return "none";
}
