"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Info, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { DropZone, Notice, Panel, Segmented, Toggle } from "./ui";
import { usePdfFile } from "./pdf/usePdfFile";
import { PdfThumb, useThumbQueue } from "./pdf/PdfThumbs";
import { PasswordField } from "./pdf/PasswordField";
import { ALL_ALLOWED, SecurityError, protect, strength, type Permissions, type Print } from "@/lib/pdf-security";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const BAR = ["bg-error", "bg-error", "bg-[#e6a400]", "bg-success", "bg-success"];

export default function ProtectPdf() {
  const { pdf, open, close, opening, error } = usePdfFile({ maxMB: limits.pdfMaxMB, maxPages: 2000 });
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [bits, setBits] = useState<256 | 128>(256);
  const [restrict, setRestrict] = useState(false);
  const [perms, setPerms] = useState<Permissions>({ print: "full", copy: false, edit: false, annotate: true });
  const [ownerPw, setOwnerPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; bits: number; restricted: boolean } | null>(null);
  const queue = useThumbQueue(pdf?.doc ?? null, 200);

  useEffect(() => {
    track("tool_opened", { tool: "protect-pdf" });
  }, []);

  const s = useMemo(() => strength(pw), [pw]);
  const mismatch = pw2 && pw !== pw2 ? "The passwords don't match." : null;
  const ownerSame = restrict && ownerPw && ownerPw === pw ? "Use a different password here — otherwise anyone who can open the PDF can also change the restrictions." : null;
  const ready = !!pdf && pw.length >= 4 && pw === pw2 && !ownerSame && !busy;

  const run = async () => {
    if (!pdf || !ready) return;
    setBusy(true);
    setFail(null);
    try {
      const out = await protect(pdf.bytes, { password: pw, ownerPassword: restrict ? ownerPw || undefined : undefined, bits, permissions: restrict ? perms : ALL_ALLOWED, pages: pdf.pages.length });
      setResult({ blob: new Blob([out as BlobPart], { type: "application/pdf" }), name: `${baseName(pdf.file.name)}-protected.pdf`, bits, restricted: restrict });
      // Passwords are cleared as soon as they've been used.
      setPw("");
      setPw2("");
      setOwnerPw("");
      track("content_generated", { tool: "protect-pdf", format: `aes${bits}`, size_bucket: sizeBucket(out.byteLength) });
    } catch (e) {
      setFail(e instanceof SecurityError ? e.message : "This PDF couldn't be protected. It may be damaged.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    close();
    setResult(null);
    setFail(null);
    setPw("");
    setPw2("");
    setOwnerPw("");
  };

  if (!pdf)
    return (
      <div className="grid gap-4">
        <DropZone
          accept="application/pdf,.pdf"
          onFiles={async (f) => {
            const r = await open(f[0]);
            if (r) track("file_uploaded", { tool: "protect-pdf", file_count: 1, size_bucket: sizeBucket(r.file.size) });
          }}
          title={opening ? "Opening PDF…" : "Drop a PDF to protect"}
          subtitle="or click to choose — encrypted on your device"
          formats={["PDF", `up to ${limits.pdfMaxMB} MB`]}
        />
        {error && <Notice tone="error">{/password protected/.test(error) ? `${error.replace(" Please upload an unlocked copy.", "")} It's already protected — use Unlock PDF first if you want to change its password.` : error}</Notice>}
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr] [&>*]:min-w-0">
      <Panel className="p-5">
        <div className="mx-auto w-40 overflow-hidden rounded-[8px] border border-line">
          <PdfThumb page={1} queue={queue} alt="First page preview" />
        </div>
        <p className="mt-3 flex items-center gap-2 truncate font-medium" title={pdf.file.name}>
          <FileText aria-hidden className="size-4 shrink-0" /> <span className="truncate">{pdf.file.name}</span>
        </p>
        <p className="font-mono text-xs text-ink-2" data-testid="protect-info">
          {formatBytes(pdf.file.size)} · {pdf.pages.length} page{pdf.pages.length === 1 ? "" : "s"}
        </p>
        <button type="button" onClick={reset} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
          <RotateCcw aria-hidden className="size-4" /> Protect another PDF
        </button>
      </Panel>

      {result ? (
        <Panel className="p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-success" role="status" data-testid="protect-done">
            <ShieldCheck aria-hidden className="size-6" /> Protected and checked
          </p>
          <p className="mt-2 text-sm text-ink-2">
            We reopened the file to confirm it asks for the password before showing anything. It&apos;s encrypted with AES-{result.bits}
            {result.restricted ? " and your restrictions are applied" : ""}. Your password isn&apos;t stored anywhere — keep it safe, because it can&apos;t be recovered.
          </p>
          <button
            type="button"
            onClick={() => {
              downloadBlob(result.blob, result.name);
              track("download_clicked", { tool: "protect-pdf", format: "pdf" });
            }}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory hover:bg-black"
          >
            <Download aria-hidden className="size-4" /> Download {result.name} <span className="font-mono text-sm font-normal text-ivory/70">· {formatBytes(result.blob.size)}</span>
          </button>
          <button type="button" onClick={() => setResult(null)} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] text-sm text-ink-2 hover:bg-ivory-2">
            Change settings and protect again
          </button>
        </Panel>
      ) : (
        <Panel className="p-5 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="grid gap-4"
          >
            <PasswordField label="Password to open the PDF" value={pw} onChange={setPw} autoComplete="new-password" autoFocus />
            {pw && (
              <div aria-live="polite" data-testid="pw-strength">
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className={clsx("h-1.5 flex-1 rounded-full", i <= s.level ? BAR[s.level] : "bg-line")} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-2">
                  <b className="font-medium text-charcoal">{s.label}</b>
                  {s.tips[0] ? ` — ${s.tips[0]}` : ""}
                </p>
              </div>
            )}
            <PasswordField label="Confirm password" value={pw2} onChange={setPw2} autoComplete="new-password" invalid={mismatch} />

            <div>
              <p className="mb-1.5 text-sm font-medium">Encryption</p>
              <Segmented
                label="Encryption"
                size="sm"
                value={String(bits)}
                onChange={(v) => setBits(Number(v) as 256 | 128)}
                options={[
                  { value: "256", label: "AES-256 (recommended)" },
                  { value: "128", label: "AES-128 (older readers)" },
                ]}
              />
              <p className="mt-1 text-xs text-ink-2">AES-256 needs Acrobat Reader X (2010) or any modern viewer. AES-128 also opens in very old readers.</p>
            </div>

            <Toggle checked={restrict} onChange={setRestrict} label="Restrict printing, copying or editing" description="Optional permission settings" />
            {restrict && (
              <div className="grid gap-3 rounded-[12px] border border-line bg-ivory p-4" data-testid="perm-panel">
                <div>
                  <p className="mb-1.5 text-sm">Printing</p>
                  <Segmented
                    label="Printing"
                    size="sm"
                    value={perms.print}
                    onChange={(v) => setPerms((p) => ({ ...p, print: v as Print }))}
                    options={[
                      { value: "full", label: "Allow" },
                      { value: "low", label: "Low quality" },
                      { value: "none", label: "Don't allow" },
                    ]}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Toggle checked={perms.copy} onChange={(v) => setPerms((p) => ({ ...p, copy: v }))} label="Copy text" />
                  <Toggle checked={perms.edit} onChange={(v) => setPerms((p) => ({ ...p, edit: v }))} label="Edit" />
                  <Toggle checked={perms.annotate} onChange={(v) => setPerms((p) => ({ ...p, annotate: v }))} label="Comments & forms" />
                </div>
                <PasswordField label="Permissions password (optional)" value={ownerPw} onChange={setOwnerPw} autoComplete="new-password" invalid={ownerSame} hint="Lets you lift these restrictions later. Leave empty and a random one is used — the restrictions then can't be removed." />
                <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
                  <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" /> Restrictions are honoured by mainstream PDF apps, but they aren&apos;t DRM: some tools ignore them, and anyone who can see a page can still photograph or retype it.
                </p>
              </div>
            )}

            {fail && <Notice tone="error">{fail}</Notice>}
            <button type="submit" disabled={!ready} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              {busy ? (
                "Encrypting and checking…"
              ) : (
                <>
                  <Lock aria-hidden className="size-4" /> Encrypt PDF
                </>
              )}
            </button>
            {pw && pw.length < 4 && <p className="-mt-2 text-xs text-ink-2">Use at least 4 characters (12 or more is much safer).</p>}
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <CheckCircle2 aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" /> Encryption runs on your device with qpdf. Your file and password are never uploaded, stored or logged.
            </p>
          </form>
        </Panel>
      )}
    </div>
  );
}
