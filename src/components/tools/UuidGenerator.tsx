"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Download, Eraser, Loader2, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { CopyButton, FieldLabel, Panel, Segmented, Toggle } from "./ui";
import { formatUuid, generateBatch, inspectUuid, type UuidFormat, type UuidVersion } from "@/lib/uuid";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const nf = new Intl.NumberFormat("en-US");

export default function UuidGenerator() {
  const [version, setVersion] = useState<UuidVersion>(4);
  const [qty, setQty] = useState("10");
  const [fmt, setFmt] = useState<UuidFormat>({ uppercase: false, hyphens: true, braces: false });
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(0);
  const [check, setCheck] = useState("");

  const n = Math.max(1, Math.min(1000, Math.floor(Number(qty)) || 1));
  const qtyInvalid = qty !== "" && (!/^\d+$/.test(qty) || Number(qty) < 1 || Number(qty) > 1000);

  const generate = async (count = n) => {
    setBusy(count > 200);
    if (count > 200) await new Promise((r) => setTimeout(r, 30)); // show feedback for big batches
    setIds(generateBatch(count, version));
    setGen((g) => g + 1);
    setBusy(false);
    track("content_generated", { tool: "uuid-generator", count, level: `v${version}` });
  };

  useEffect(() => {
    track("tool_opened", { tool: "uuid-generator" });
    // Generate on the client only, so server HTML never contains IDs.
    setIds(generateBatch(10, 4)); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const shown = useMemo(() => ids.map((u) => formatUuid(u, fmt)), [ids, fmt]);
  const modified = fmt.uppercase || !fmt.hyphens || fmt.braces;
  const info = check.trim() ? inspectUuid(check) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr] [&>*]:min-w-0">
      <div className="grid content-start gap-4">
        <Panel className="p-5 sm:p-6">
          <FieldLabel>Version</FieldLabel>
          <Segmented
            label="UUID version"
            value={String(version)}
            onChange={(v) => setVersion(Number(v) as UuidVersion)}
            options={[
              { value: "4", label: "v4", hint: "random" },
              { value: "7", label: "v7", hint: "time-ordered" },
            ]}
          />
          <div className="mt-5">
            <FieldLabel htmlFor="uuid-qty" hint="max 1,000">
              How many
            </FieldLabel>
            <input
              id="uuid-qty"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
              className="h-12 w-full rounded-[10px] border border-line-strong bg-card px-3.5 font-mono text-lg outline-none focus:border-charcoal"
            />
            {qtyInvalid && <p className="mt-1 text-xs text-error">Choose between 1 and 1,000.</p>}
            <div className="mt-2 flex gap-1.5">
              {[1, 10, 100, 1000].map((v) => (
                <button key={v} type="button" onClick={() => setQty(String(v))} className="rounded-[8px] border border-line px-2.5 py-1 font-mono text-xs text-ink-2 hover:border-charcoal hover:text-charcoal">
                  {nf.format(v)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => generate()}
            disabled={qtyInvalid || busy}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-orange font-medium text-charcoal transition-colors hover:bg-[#ec6a34] disabled:opacity-40"
          >
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <RefreshCw aria-hidden className="size-4" />} Generate {nf.format(n)} UUID{n === 1 ? "" : "s"}
          </button>

          <div className="mt-6 grid gap-2 border-t border-line pt-5">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-2">Display format</p>
            <Toggle checked={fmt.uppercase} onChange={(v) => setFmt((f) => ({ ...f, uppercase: v }))} label="Uppercase" />
            <Toggle checked={!fmt.hyphens} onChange={(v) => setFmt((f) => ({ ...f, hyphens: !v }))} label="Remove hyphens" />
            <Toggle checked={fmt.braces} onChange={(v) => setFmt((f) => ({ ...f, braces: v }))} label="Wrap in {braces}" description="Microsoft GUID style" />
            {modified && <p className="text-xs text-ink-2">Formatting changes only how IDs are written. The standard form is lowercase with hyphens.</p>}
          </div>
        </Panel>
        <p className="flex items-start gap-2 px-1 text-sm text-ink-2">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-ink" />
          UUIDs are identifiers, not secrets. Don&rsquo;t use them as passwords, API keys or session tokens.
        </p>
      </div>

      <div className="grid content-start gap-4">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className="text-sm font-bold" aria-live="polite">
              {nf.format(ids.length)} UUID{ids.length === 1 ? "" : "s"} <span className="font-normal text-ink-2">· v{ids.length ? inspectUuid(ids[0]).version : version} · no duplicates</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              <CopyButton text={() => shown.join("\n")} label="Copy all" className="!h-8" onCopied={() => track("copy_clicked", { tool: "uuid-generator", count: ids.length })} />
              <button
                type="button"
                onClick={() => downloadBlob(new Blob([shown.join("\n") + "\n"], { type: "text/plain" }), `uuids-${ids.length}.txt`)}
                disabled={!ids.length}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35"
              >
                <Download aria-hidden className="size-3.5" /> .txt
              </button>
              <button
                type="button"
                onClick={() => downloadBlob(new Blob(["uuid\n" + shown.join("\n") + "\n"], { type: "text/csv" }), `uuids-${ids.length}.csv`)}
                disabled={!ids.length}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35"
              >
                <Download aria-hidden className="size-3.5" /> .csv
              </button>
              <button type="button" onClick={() => setIds([])} disabled={!ids.length} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[0.84rem] text-ink-2 hover:bg-ivory-2 hover:text-charcoal disabled:opacity-35">
                <Eraser aria-hidden className="size-3.5" /> Clear
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.ol key={gen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="max-h-[520px] divide-y divide-line overflow-y-auto" data-testid="uuid-list">
              {shown.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-ink-2">Press Generate to create UUIDs.</li>
              ) : (
                shown.map((u, i) => (
                  <li key={`${gen}-${i}`} className="flex items-center gap-3 px-3 py-1.5 sm:px-4">
                    <span className="w-9 shrink-0 text-right font-mono text-[0.7rem] text-ink-3">{i + 1}</span>
                    <span className="min-w-0 flex-1 break-all font-mono text-[0.86rem]" translate="no">
                      {u}
                    </span>
                    <CopyButton iconOnly text={() => u} label={`Copy UUID ${i + 1}`} />
                  </li>
                ))
              )}
            </motion.ol>
          </AnimatePresence>
        </Panel>

        <Panel className="p-5">
          <FieldLabel htmlFor="uuid-check">Validate a UUID</FieldLabel>
          <input
            id="uuid-check"
            value={check}
            onChange={(e) => setCheck(e.target.value)}
            placeholder="Paste any UUID or GUID"
            spellCheck={false}
            className="h-11 w-full rounded-[10px] border border-line-strong bg-card px-3 font-mono text-sm outline-none focus:border-charcoal"
          />
          {info && (
            <p className={info.valid ? "mt-2 flex flex-wrap items-center gap-x-3 text-sm text-success" : "mt-2 flex items-center gap-1.5 text-sm text-error"} data-testid="uuid-check">
              {info.valid ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 aria-hidden className="size-4" /> Valid
                  </span>
                  <span className="font-mono text-xs text-charcoal">version {info.version}</span>
                  <span className="font-mono text-xs text-charcoal">{info.variant} variant</span>
                  {info.timestamp && <span className="font-mono text-xs text-charcoal">created {info.timestamp.toISOString()}</span>}
                </>
              ) : (
                <>
                  <XCircle aria-hidden className="size-4" /> Not a valid UUID — expected 32 hex digits, usually as 8-4-4-4-12.
                </>
              )}
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
