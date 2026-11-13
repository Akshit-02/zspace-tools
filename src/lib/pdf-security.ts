/**
 * PDF encryption and decryption with qpdf (WebAssembly, in a worker).
 * - Protect: AES-256 (PDF 2.0, Acrobat X+) or AES-128 (Acrobat 7+) with
 *   optional permission flags. Output is re-opened with pdf.js to prove it
 *   needs the password.
 * - Unlock: requires the correct password; never guesses. With only the
 *   opening password, existing permission restrictions are re-applied.
 */
import { entropyBits, generatePassword, strengthLabel } from "./password";

export type Print = "full" | "low" | "none";
export interface Permissions {
  print: Print;
  copy: boolean;
  edit: boolean; // modify content and assemble pages
  annotate: boolean; // comments and form filling
}
export const ALL_ALLOWED: Permissions = { print: "full", copy: true, edit: true, annotate: true };

export class SecurityError extends Error {
  constructor(
    public code: "wrong-password" | "not-encrypted" | "needs-owner" | "damaged" | "engine" | "verify",
    message: string,
  ) {
    super(message);
  }
}

/* ---------------- Worker bridge ---------------- */

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (r: { rc: number; out: ArrayBuffer | null; log: string[] }) => void>();

function run(args: string[], input: Uint8Array, output: boolean): Promise<{ rc: number; out: Uint8Array | null; log: string[] }> {
  if (!worker) {
    worker = new Worker(new URL("./workers/qpdf.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e) => {
      const done = pending.get(e.data.id);
      pending.delete(e.data.id);
      done?.(e.data);
    };
    worker.onerror = () => {
      pending.forEach((d) => d({ rc: -1, out: null, log: ["engine-failed"] }));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  }
  const id = ++seq;
  const copy = input.slice().buffer;
  return new Promise((resolve) => {
    pending.set(id, (r) => resolve({ rc: r.rc, out: r.out ? new Uint8Array(r.out) : null, log: r.log }));
    worker!.postMessage({ id, args, input: copy, output }, [copy]);
  });
}

/* ---------------- Inspect ---------------- */

export interface Encryption {
  encrypted: boolean;
  needsPassword: boolean; // an opening (user) password is set
  suppliedIs?: "user" | "owner";
  permissions: Permissions;
  method?: string;
}

function parsePerms(log: string[]): Permissions {
  const get = (label: string) => log.find((l) => l.toLowerCase().startsWith(label))?.toLowerCase().includes("not allowed") === false;
  return {
    print: get("print high resolution") ? "full" : get("print low resolution") ? "low" : "none",
    copy: get("extract for any purpose"),
    edit: get("modify other") && get("modify document assembly"),
    annotate: get("modify annotations") && get("modify forms"),
  };
}

/**
 * Reads a PDF's encryption state.
 * Without `password`: `needsPassword` says whether an opening password is set.
 * With `password`: `suppliedIs` says whether it's the opening (user) or permissions (owner) password.
 */
export async function inspect(bytes: Uint8Array, password = ""): Promise<Encryption> {
  const r = await run(["--show-encryption", ...(password ? [`--password=${password}`] : []), "{in}"], bytes, false);
  if (r.rc === -1) throw new SecurityError("engine", "The PDF engine couldn't start. Check your connection and try again.");
  const text = r.log.join("\n");
  if (/invalid password/i.test(text)) return { encrypted: true, needsPassword: true, permissions: ALL_ALLOWED };
  if (/not encrypted/i.test(text)) return { encrypted: false, needsPassword: false, permissions: ALL_ALLOWED };
  if (r.rc === 2) throw new SecurityError("damaged", "This PDF couldn't be read. It may be damaged or incomplete.");
  const suppliedIs = /Supplied password is owner password/i.test(text) ? "owner" : /Supplied password is user password/i.test(text) ? "user" : undefined;
  return {
    encrypted: true,
    // Opened without a password → no opening password is set.
    needsPassword: !!password,
    suppliedIs: password ? suppliedIs : undefined,
    permissions: parsePerms(r.log),
    method: /file encryption method: (\S+)/i.exec(text)?.[1],
  };
}

export const permArgs = (p: Permissions, bits: 256 | 128) => [
  `--print=${p.print}`,
  `--extract=${p.copy ? "y" : "n"}`,
  ...(bits === 256 ? [`--assemble=${p.edit ? "y" : "n"}`, `--modify-other=${p.edit ? "y" : "n"}`, `--annotate=${p.annotate ? "y" : "n"}`, `--form=${p.annotate ? "y" : "n"}`] : ["--use-aes=y", `--modify=${p.edit ? "all" : p.annotate ? "annotate" : "none"}`]),
  "--accessibility=y",
];

const randomOwner = () => generatePassword({ length: 32, upper: true, lower: true, digits: true, symbols: false, excludeAmbiguous: false } as never);

/** Opens with pdf.js: must refuse without a password and open with it. */
async function verifyLocked(out: Uint8Array, password: string, pages: number) {
  const m = await (await import("./pdf-render")).pdfjs();
  const open = async (pw?: string) => {
    const task = m.getDocument({ data: out.slice(), password: pw, useWasm: false });
    try {
      const d = await task.promise;
      return d.numPages;
    } finally {
      void task.destroy();
    }
  };
  const blocked = await open().then(
    () => false,
    (e) => (e as { name?: string }).name === "PasswordException",
  );
  if (!blocked) throw new SecurityError("verify", "The protected file didn't ask for a password when checked, so it wasn't offered for download.");
  const n = await open(password).catch(() => -1);
  if (n !== pages) throw new SecurityError("verify", "The protected file didn't open correctly with the password, so it wasn't offered for download.");
}

export async function protect(bytes: Uint8Array, opts: { password: string; ownerPassword?: string; bits: 256 | 128; permissions: Permissions; pages: number }) {
  const owner = opts.ownerPassword || randomOwner();
  const r = await run(["--encrypt", opts.password, owner, String(opts.bits), ...permArgs(opts.permissions, opts.bits), "--", "{in}", "{out}"], bytes, true);
  if (r.rc === -1) throw new SecurityError("engine", "The PDF engine couldn't start. Check your connection and try again.");
  if (!r.out || r.rc === 2) {
    if (r.log.some((l) => /invalid password/i.test(l))) throw new SecurityError("wrong-password", "This PDF is already password-protected. Unlock it first, then protect it again.");
    throw new SecurityError("damaged", "This PDF couldn't be encrypted. It may be damaged.");
  }
  await verifyLocked(r.out, opts.password, opts.pages);
  return r.out;
}

export interface UnlockResult {
  bytes: Uint8Array;
  /** "full": no password, no restrictions. "kept": opening password removed, restrictions kept. */
  mode: "full" | "kept";
  restrictions: Permissions;
}

export async function unlock(bytes: Uint8Array, password: string): Promise<UnlockResult> {
  const before = await inspect(bytes);
  if (!before.encrypted) throw new SecurityError("not-encrypted", "This PDF isn't password-protected, so there's nothing to unlock.");
  const info = await inspect(bytes, password);
  if (!info.suppliedIs) throw new SecurityError("wrong-password", "That password isn't correct. Check it and try again.");
  const restricted = !(info.permissions.print === "full" && info.permissions.copy && info.permissions.edit && info.permissions.annotate);
  if (!before.needsPassword && info.suppliedIs !== "owner") {
    // Opens without a password; only restrictions are set — those need the permissions password.
    throw new SecurityError("needs-owner", "This PDF opens without a password but has restrictions (such as printing or copying). Removing them needs the permissions (owner) password.");
  }
  if (info.suppliedIs === "owner" || !restricted) {
    const r = await run([`--password=${password}`, "--decrypt", "{in}", "{out}"], bytes, true);
    if (!r.out || r.rc === 2) throw new SecurityError("damaged", "This PDF couldn't be decrypted. It may be damaged.");
    return { bytes: r.out, mode: "full", restrictions: ALL_ALLOWED };
  }
  // Opening password only: remove it but keep the author's restrictions (re-encrypt with no user password).
  const r = await run([`--password=${password}`, "--encrypt", "", randomOwner(), "256", ...permArgs(info.permissions, 256), "--", "{in}", "{out}"], bytes, true);
  if (!r.out || r.rc === 2) throw new SecurityError("damaged", "This PDF couldn't be decrypted. It may be damaged.");
  return { bytes: r.out, mode: "kept", restrictions: info.permissions };
}

/* ---------------- Password guidance ---------------- */

const COMMON = /^(password|passw0rd|123456|12345678|123456789|qwerty|abc123|111111|iloveyou|admin|welcome|letmein|monkey|dragon|india@123|pass@123)$/i;

export function strength(pw: string) {
  if (!pw) return { label: "", level: 0 as const, bits: 0, tips: [] as string[] };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  let bits = entropyBits([...pw].length, pool);
  if (COMMON.test(pw)) bits = Math.min(bits, 10);
  if (/^(.)\1+$/.test(pw)) bits = Math.min(bits, 8);
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(pw)) bits *= 0.75;
  const tips: string[] = [];
  if ([...pw].length < 12) tips.push("Use at least 12 characters — length matters most.");
  if (pool < 60) tips.push("Mix upper and lower case, numbers and symbols, or use several unrelated words.");
  if (COMMON.test(pw)) tips.push("This is one of the most common passwords — choose something unique.");
  return { ...strengthLabel(bits), bits, tips };
}
