/**
 * Secure password generation.
 * - Randomness: crypto.getRandomValues only (never Math.random).
 * - Unbiased: rejection sampling instead of `rand % n`.
 * - Every selected character set is represented at least once, then the
 *   result is shuffled with an unbiased Fisher–Yates shuffle.
 * Nothing here logs, stores or transmits passwords.
 */

export const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~",
} as const;

/** Characters easily confused when read or handwritten. */
export const AMBIGUOUS = "Il1|O0o`'\"";

export type SetKey = keyof typeof SETS;

export interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("Secure random number generation is not available in this browser.");
  }
  return c;
}

/** Uniform random integer in [0, n) using rejection sampling over 32-bit values. */
export function randomInt(n: number): number {
  if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new RangeError("n out of range");
  const c = getCrypto();
  const buf = new Uint32Array(1);
  const limit = 2 ** 32 - (2 ** 32 % n); // largest multiple of n ≤ 2^32
  for (;;) {
    c.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

export function charsetsFor(opts: PasswordOptions): string[] {
  const filter = (s: string) => (opts.excludeAmbiguous ? [...s].filter((ch) => !AMBIGUOUS.includes(ch)).join("") : s);
  return (Object.keys(SETS) as SetKey[]).filter((k) => opts[k]).map((k) => filter(SETS[k])).filter((s) => s.length > 0);
}

export function poolSize(opts: PasswordOptions) {
  return charsetsFor(opts).reduce((n, s) => n + s.length, 0);
}

export function generatePassword(opts: PasswordOptions): string {
  const sets = charsetsFor(opts);
  if (sets.length === 0) throw new Error("Select at least one character type.");
  const length = Math.max(opts.length, sets.length);
  const pool = sets.join("");
  const chars: string[] = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < length) chars.push(pool[randomInt(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/** Entropy in bits for a uniformly random password of this length over this pool. */
export function entropyBits(length: number, pool: number) {
  return pool > 1 ? length * Math.log2(pool) : 0;
}

export function strengthLabel(bits: number): { label: string; level: 0 | 1 | 2 | 3 | 4 } {
  if (bits < 40) return { label: "Very weak", level: 0 };
  if (bits < 60) return { label: "Weak", level: 1 };
  if (bits < 80) return { label: "Reasonable", level: 2 };
  if (bits < 100) return { label: "Strong", level: 3 };
  return { label: "Very strong", level: 4 };
}

/**
 * Average time to guess at 10^12 guesses/second (a well-funded offline attack
 * against a fast hash). Half the keyspace on average.
 */
export function crackTime(bits: number): string {
  const seconds = 2 ** (bits - 1) / 1e12;
  if (seconds < 1) return "instantly";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31557600;
  if (years < 1e3) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1e3)} thousand years`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`;
  return "longer than the age of the universe";
}
