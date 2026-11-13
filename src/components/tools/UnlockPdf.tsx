"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Info, KeyRound, Loader2, LockOpen, RotateCcw, ShieldAlert } from "lucide-react";
import { DropZone, Notice, Panel } from "./ui";
import { PasswordField } from "./pdf/PasswordField";
import { SecurityError, inspect, unlock, type Encryption, type Permissions } from "@/lib/pdf-security";
import { openPdfjs } from "@/lib/pdf-render";
import { renderThumb } from "@/lib/pdf-images";
import { hasPdfHeader, isPdfFile } from "@/lib/pdf-utils";
import { baseName, downloadBlob, formatBytes } from "@/lib/format";
import { limits } from "@/lib/site";
import { sizeBucket, track } from "@/lib/analytics";

const permText = (p: Permissions) =>
  [p.print === "none" ? "printing" : p.print === "low" ? "high-quality printing" : "", !p.copy ? "copying text" : "", !p.edit ? "editing" : "", !p.annotate ? "comments and forms" : ""].filter(Boolean).join(", ");

export default function UnlockPdf() {
  const [file, setFile] = useState<{ f: File; bytes: Uint8Array; enc: Encryption } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string; pages: number; thumb: string | null; mode: "full" | "kept"; restrictions: Permissions } | null>(null);

  useEffect(() => {
    track("tool_opened", { tool: "unlock-pdf" });
  }, []);
  useEffect(() => () => void (result?.thumb && URL.revokeObjectURL(result.thumb)), [result]);

  const choose = async (files: File[]) => {
    const f = files[0];
    setError(null);
    setResult(null);
    setWrong(null);
    setPw("");
    if (!f) return;
    if (!isPdfFile(f)) return setError(`${f.name} isn't a PDF. Choose a file that ends in .pdf.`);
    if (f.size === 0) return setError(`${f.name} is empty.`);
    if (f.size > limits.pdfMaxMB * 1048576) return setError(`${f.name} is ${formatBytes(f.size)}. Your file is larger than the current processing limit of ${limits.pdfMaxMB} MB.`);
    const bytes = new Uint8Array(await f.arrayBuffer());
    if (!hasPdfHeader(bytes)) return setError(`${f.name} isn't a PDF. Choose a file that ends in .pdf.`);
    setChecking(true);
    try {
      const enc = await inspect(bytes);
      setFile({ f, bytes, enc });
      track("file_uploaded", { tool: "unlock-pdf", file_count: 1, size_bucket: sizeBucket(f.size) });
    } catch (e) {
      setError(e instanceof SecurityError ? e.message : `${f.name} couldn't be read. It may be damaged.`);
    } finally {
      setChecking(false);
    }
  };

  const run = async () => {
    if (!file || !pw) return;
    setBusy(true);
    setWrong(null);
    try {
      const r = await unlock(file.bytes, pw);
      // Prove it: the result must open without any password.
      const opened = await openPdfjs(r.bytes, "The unlocked PDF");
      const thumb = await renderThumb(opened.doc, 1, 200).catch(() => null);
      const pages = opened.doc.numPages;
      opened.destroy();
      setResult({ blob: new Blob([r.bytes as BlobPart], { type: "application/pdf" }), name: `${baseName(file.f.name)}-unlocked.pdf`, pages, thumb, mode: r.mode, restrictions: r.restrictions });
      setPw("");
      track("content_generated", { tool: "unlock-pdf", format: r.mode });
    } catch (e) {
      if (e instanceof SecurityError && e.code === "wrong-password") setWrong(e.message);
      else setError(e instanceof SecurityError ? e.message : "This PDF couldn't be unlocked. It may be damaged.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setWrong(null);
    setPw("");
  };

  if (!file)
    return (
      <div className="grid gap-4">
        <DropZone accept="application/pdf,.pdf" onFiles={choose} title={checking ? "Checking the PDF…" : "Drop a password-protected PDF"} subtitle="or click to choose — unlocked on your device" formats={["PDF", `up to ${limits.pdfMaxMB} MB`]} />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    );

  const { enc } = file;
  const ownerOnly = enc.encrypted && !enc.needsPassword;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] [&>*]:min-w-0">
      <Panel className="p-5">
        <div className="mx-auto grid h-52 w-40 place-items-center overflow-hidden rounded-[8px] border border-line bg-ivory">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {result?.thumb ? <img src={result.thumb} alt="First page of the unlocked PDF" className="max-h-full max-w-full" /> : enc.needsPassword ? <KeyRound aria-hidden className="size-10 text-ink-3" /> : <FileText aria-hidden className="size-10 text-ink-3" />}
        </div>
        <p className="mt-3 truncate font-medium" title={file.f.name}>
          {file.f.name}
        </p>
        <p className="font-mono text-xs text-ink-2" data-testid="unlock-info">
          {formatBytes(file.f.size)} · {!enc.encrypted ? "not protected" : enc.needsPassword ? "needs a password to open" : "opens freely, has restrictions"}
          {enc.method ? ` · ${enc.method.replace("AESv3", "AES-256").replace("AESv2", "AES-128")}` : ""}
        </p>
        <button type="button" onClick={reset} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
          <RotateCcw aria-hidden className="size-4" /> Unlock another PDF
        </button>
      </Panel>

      <Panel className="p-5 sm:p-6">
        {!enc.encrypted ? (
          <Notice>This PDF isn&apos;t password-protected and has no restrictions, so there&apos;s nothing to unlock. You can open it as it is.</Notice>
        ) : result ? (
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-success" role="status" data-testid="unlock-done">
              <LockOpen aria-hidden className="size-6" /> Unlocked and checked
            </p>
            <p className="mt-2 text-sm text-ink-2">
              We reopened it without a password: all {result.pages} page{result.pages === 1 ? "" : "s"} open.{" "}
              {result.mode === "kept" ? (
                <span data-testid="kept-note">
                  The opening password is gone, but the author&apos;s restrictions ({permText(result.restrictions)}) are kept, because they&apos;re controlled by a separate permissions password. Enter that password instead to remove them as well.
                </span>
              ) : (
                "It has no password and no restrictions."
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                downloadBlob(result.blob, result.name);
                track("download_clicked", { tool: "unlock-pdf", format: "pdf" });
              }}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-charcoal font-medium text-ivory hover:bg-black"
            >
              <Download aria-hidden className="size-4" /> Download {result.name} <span className="font-mono text-sm font-normal text-ivory/70">· {formatBytes(result.blob.size)}</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="grid gap-4"
          >
            {ownerOnly ? (
              <div className="rounded-[12px] border border-[#e5c98f] bg-[#fdf6e7] p-4 text-sm" data-testid="owner-only">
                <p className="flex items-center gap-2 font-bold text-[#7a5310]">
                  <ShieldAlert aria-hidden className="size-4" /> This PDF opens without a password but restricts {permText(enc.permissions) || "some actions"}.
                </p>
                <p className="mt-1 text-charcoal">Those restrictions are set with a permissions (owner) password. Enter it to remove them. Without it, the restrictions can&apos;t be removed here.</p>
              </div>
            ) : (
              <p className="text-sm text-ink-2">Enter the password used to open this PDF. If you also know its permissions (owner) password, use that to remove any printing or copying restrictions too.</p>
            )}
            <PasswordField label={ownerOnly ? "Permissions (owner) password" : "PDF password"} value={pw} onChange={(v) => (setPw(v), setWrong(null))} autoComplete="current-password" invalid={wrong} autoFocus />
            {error && <Notice tone="error">{error}</Notice>}
            <button type="submit" disabled={!pw || busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <LockOpen aria-hidden className="size-4" />} {busy ? "Unlocking…" : "Unlock PDF"}
            </button>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
              <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" /> Only for PDFs you&apos;re allowed to open. You need the correct password — this tool never guesses or cracks passwords. Your file and password stay on your device.
            </p>
          </form>
        )}
      </Panel>
    </div>
  );
}
