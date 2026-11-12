/**
 * UUID generation (RFC 9562). v4: 122 random bits. v7: 48-bit Unix-ms
 * timestamp + random bits, time-ordered. Only crypto randomness is used.
 */

export type UuidVersion = 4 | 7;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const fmt = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

export function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return fmt(hex(b));
}

let lastMs = -1;
let seq = 0;

/**
 * UUID v7 with a 12-bit sequence in rand_a (RFC 9562 §6.2, method 1) so IDs
 * created in the same millisecond still sort in creation order.
 */
export function uuidV7(now = Date.now()): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  let ms = now;
  if (ms <= lastMs) {
    ms = lastMs;
    seq++;
    if (seq > 0xfff) {
      ms = lastMs + 1; // counter overflow: borrow the next millisecond
      seq = 0;
    }
  } else {
    seq = b[6] & 0x07; // random start, leaves headroom for increments
  }
  lastMs = ms;
  // 48-bit big-endian timestamp
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  b[6] = 0x70 | ((seq >> 8) & 0x0f); // version 7 + top 4 bits of seq
  b[7] = seq & 0xff;
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  return fmt(hex(b));
}

export interface UuidFormat {
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
}

export const formatUuid = (u: string, f: UuidFormat) => {
  let s = f.hyphens ? u : u.replace(/-/g, "");
  s = f.uppercase ? s.toUpperCase() : s.toLowerCase();
  return f.braces ? `{${s}}` : s;
};

/** Generates a batch with no duplicates (collisions are astronomically unlikely, but checked anyway). */
export function generateBatch(count: number, version: UuidVersion): string[] {
  const n = Math.max(1, Math.min(1000, Math.floor(count)));
  const seen = new Set<string>();
  const out: string[] = [];
  while (out.length < n) {
    const id = version === 7 ? uuidV7() : uuidV4();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export interface UuidInfo {
  valid: boolean;
  version?: number;
  variant?: string;
  timestamp?: Date;
}

/** Inspects any pasted UUID (with or without hyphens/braces). */
export function inspectUuid(input: string): UuidInfo {
  const h = input.trim().replace(/^\{|\}$/g, "").replace(/-/g, "").toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h)) return { valid: false };
  const version = parseInt(h[12], 16);
  const v = parseInt(h[16], 16);
  const variant = v >= 8 && v <= 11 ? "RFC 9562" : v < 8 ? "NCS (reserved)" : v < 14 ? "Microsoft (reserved)" : "Future (reserved)";
  const info: UuidInfo = { valid: true, version, variant };
  if (version === 7 && variant === "RFC 9562") info.timestamp = new Date(parseInt(h.slice(0, 12), 16));
  return info;
}
