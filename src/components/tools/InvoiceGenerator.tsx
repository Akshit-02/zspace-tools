"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, ImagePlus, Loader2, Plus, Printer, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import { FieldLabel, Notice, Panel, Segmented, Toggle } from "./ui";
import { SortableList } from "./SortableList";
import { CURRENCIES, blankInvoice, calculate, formatMoney, newItem, sampleInvoice, type DiscountType, type Invoice, type LineItem, type Party, type TaxMode, type Template, type Totals } from "@/lib/invoice";
import { formatYMD, parseISODate, toISO, todayLocal } from "@/lib/age";
import { downloadBlob } from "@/lib/format";
import { printElement } from "@/lib/print";
import { track } from "@/lib/analytics";

const DRAFT = "zs-invoice-draft";
const inputCls = "h-10 w-full min-w-0 rounded-[10px] border border-line-strong bg-card px-3 text-[0.92rem] outline-none transition-colors placeholder:text-ink-3 focus:border-charcoal";
const areaCls = "w-full min-w-0 resize-y rounded-[10px] border border-line-strong bg-card px-3 py-2 text-[0.92rem] outline-none placeholder:text-ink-3 focus:border-charcoal";

function TextField({ id, label, value, onChange, placeholder, type = "text", mono }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, mono && "font-mono")} />
    </div>
  );
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        {aside}
      </div>
      {children}
    </Panel>
  );
}

function PartyFields({ who, p, set }: { who: "from" | "to"; p: Party; set: (k: keyof Party, v: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField id={`${who}-name`} label={who === "from" ? "Business name" : "Customer name"} value={p.name} onChange={(v) => set("name", v)} />
      <TextField id={`${who}-company`} label="Company (optional)" value={p.company} onChange={(v) => set("company", v)} />
      <div className="sm:col-span-2">
        <FieldLabel htmlFor={`${who}-address`}>{who === "from" ? "Address" : "Billing address"}</FieldLabel>
        <textarea id={`${who}-address`} rows={3} value={p.address} onChange={(e) => set("address", e.target.value)} className={areaCls} />
      </div>
      <TextField id={`${who}-email`} label="Email" type="email" value={p.email} onChange={(v) => set("email", v)} />
      <TextField id={`${who}-phone`} label="Phone" type="tel" value={p.phone} onChange={(v) => set("phone", v)} />
      {who === "from" && <TextField id="from-website" label="Website" value={p.website} onChange={(v) => set("website", v)} />}
      <TextField id={`${who}-tax`} label="Tax ID (optional)" value={p.taxId} onChange={(v) => set("taxId", v)} placeholder="e.g. GSTIN, VAT no., ABN" />
      {who === "from" && (
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="from-extra">Additional info (optional)</FieldLabel>
          <textarea id="from-extra" rows={2} value={p.extra} onChange={(e) => set("extra", e.target.value)} className={areaCls} placeholder="e.g. Company registration number" />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* HTML preview — mirrors the PDF layout and templates               */
/* ---------------------------------------------------------------- */

function Preview({ inv, t }: { inv: Invoice; t: Totals }) {
  const m = (v: number) => formatMoney(v, inv.currency);
  const d = (s: string) => {
    const p = parseISODate(s);
    return p ? formatYMD(p) : s;
  };
  const pro = inv.template === "professional";
  const modern = inv.template === "modern";
  const accent = inv.template === "minimal" ? "#252525" : "#F07845";
  const showDisc = inv.items.some((i) => (Number(i.discount) || 0) > 0);
  const showTax = inv.taxMode !== "none";
  const from = inv.from;
  const fromLines = [from.company && from.company !== from.name ? from.company : "", ...from.address.split("\n"), from.email, from.phone, from.website, from.taxId, ...from.extra.split("\n")].filter((v) => v.trim());
  const to = inv.to;
  const toLines = [to.company && to.company !== to.name ? to.company : "", ...to.address.split("\n"), to.email, to.phone, to.taxId].filter((v) => v.trim());

  return (
    <div className="invoice-sheet relative bg-white text-[#252525]" style={{ width: 794, minHeight: 1123, fontFamily: "var(--font-satoshi)" }}>
      {modern && <div className="absolute inset-x-0 top-0 h-2 bg-[#F07845]" />}
      <header className={clsx("flex justify-between gap-8 px-16 pb-6 pt-14", pro && "bg-[#252525] text-white")}>
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {inv.logo && <img src={inv.logo} alt="Business logo" className="mb-3 max-h-[60px] max-w-[170px] object-contain" />}
          <p className="text-[20px] font-bold leading-tight">{from.name || from.company || "Your business"}</p>
          {!pro && fromLines.map((l, i) => <p key={i} className="text-[11.5px] leading-[1.55] text-[#77716B]">{l}</p>)}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[32px] font-bold leading-none tracking-wide" style={{ color: pro ? "#fff" : accent }}>
            INVOICE
          </p>
          <dl className="mt-4 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-[11.5px]">
            {(
              [
                ["Invoice no.", inv.number],
                ["Invoice date", d(inv.date)],
                ["Due date", d(inv.dueDate)],
                ["Terms", inv.terms],
                ["Reference", inv.reference],
              ] as const
            )
              .filter(([, v]) => v.trim())
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className={pro ? "text-[#CFC8BF]" : "text-[#77716B]"}>{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </header>
      <div className={clsx("grid gap-8 px-16 pb-5", pro ? "grid-cols-2 pt-6" : "grid-cols-1 border-t border-[#E8DED2] pt-6 mx-16 px-0")}>
        {pro && (
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-[#77716B]">FROM</p>
            {fromLines.map((l, i) => <p key={i} className="text-[11.5px] leading-[1.55] text-[#77716B]">{l}</p>)}
          </div>
        )}
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.12em]" style={{ color: inv.template === "minimal" ? "#77716B" : accent }}>
            BILL TO
          </p>
          <p className="text-[14px] font-bold">{to.name || to.company || "Customer"}</p>
          {toLines.map((l, i) => <p key={i} className="text-[11.5px] leading-[1.55] text-[#77716B]">{l}</p>)}
        </div>
      </div>
      <div className="px-16">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className={clsx(pro && "bg-[#252525] text-white", modern && "bg-[#F2ECE3]", inv.template === "minimal" && "border-b border-[#252525]")}>
              {["#", "Description", "Qty", "Unit price", ...(showDisc ? ["Discount"] : []), ...(showTax ? ["Tax"] : []), "Amount"].map((h, i) => (
                <th key={h} className={clsx("px-2 py-2 text-[9.5px] font-bold tracking-[0.08em]", i < 2 ? "text-left" : "text-right", !pro && "text-[#77716B]")}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.lines.map((l, i) => {
              const it = inv.items[i];
              return (
                <tr key={l.id} className="border-b border-[#E8DED2] align-top">
                  <td className="px-2 py-2.5 text-[#77716B]">{i + 1}</td>
                  <td className="whitespace-pre-wrap px-2 py-2.5 [overflow-wrap:anywhere]">{it.description || "—"}</td>
                  <td className="px-2 py-2.5 text-right">{it.quantity || "0"}</td>
                  <td className="px-2 py-2.5 text-right">{m(Math.round((Number(it.unitPrice.replace(/[,\s]/g, "")) || 0) * 100))}</td>
                  {showDisc && <td className="px-2 py-2.5 text-right">{l.discount ? (it.discountType === "pct" ? `${Number(it.discount)}%` : m(l.discount)) : "—"}</td>}
                  {showTax && <td className="px-2 py-2.5 text-right">{Number(l.rate.toFixed(3))}%</td>}
                  <td className="px-2 py-2.5 text-right">{m(l.net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <dl className="ml-auto mt-5 w-[52%] text-[12px]" data-testid="invoice-totals">
          {[
            ...(t.lineDiscounts ? [["Gross amount", m(t.gross)], ["Item discounts", `−${m(t.lineDiscounts)}`]] : []),
            ["Subtotal", m(t.subtotal)],
            ...(t.invoiceDiscount ? [[`Discount${inv.discountType === "pct" ? ` (${Number(inv.discount)}%)` : ""}`, `−${m(t.invoiceDiscount)}`]] : []),
            ...(showTax ? [["Taxable amount", m(t.taxable)], ...t.taxRows.map((r) => [`${r.label} @ ${Number(r.rate.toFixed(3))}%`, m(r.amount)])] : []),
            ...(t.charges ? [[inv.chargesLabel || "Additional charges", m(t.charges)]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1">
              <dt className="text-[#77716B]">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-[#E8DED2] pt-2 text-[15px] font-bold">
            <dt>Total</dt>
            <dd>{m(t.grandTotal)}</dd>
          </div>
          {t.paid > 0 && (
            <>
              <div className="flex justify-between py-1">
                <dt className="text-[#77716B]">Amount paid</dt>
                <dd>−{m(t.paid)}</dd>
              </div>
              <div className="flex justify-between border-t border-[#E8DED2] pt-2 text-[15px] font-bold" style={{ color: inv.template === "minimal" ? "#252525" : "#F07845" }}>
                <dt>Balance due</dt>
                <dd>{m(t.balance)}</dd>
              </div>
            </>
          )}
        </dl>
        <div className="mt-8 grid gap-4 pb-14 text-[11.5px]">
          {(
            [
              ["Payment instructions", inv.payment],
              ["Notes", inv.notes],
              ["Terms & conditions", inv.conditions],
            ] as const
          )
            .filter(([, v]) => v.trim())
            .map(([k, v]) => (
              <div key={k}>
                <p className="mb-1 text-[10px] font-bold tracking-[0.12em]" style={{ color: inv.template === "minimal" ? "#77716B" : accent }}>
                  {k.toUpperCase()}
                </p>
                <p className="whitespace-pre-wrap text-[#77716B]">{v}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function InvoiceGenerator() {
  const [inv, setInv] = useState<Invoice>(() => blankInvoice("", ""));
  const [ready, setReady] = useState(false);
  const [keep, setKeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdfNote, setPdfNote] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [scale, setScale] = useState(0.6);
  const frame = useRef<HTMLDivElement>(null);
  const totals = useMemo(() => calculate(inv), [inv]);

  const dates = () => {
    const t = todayLocal();
    const due = new Date(Date.UTC(t.y, t.m - 1, t.d + 15));
    return [toISO(t), due.toISOString().slice(0, 10)] as const;
  };

  useEffect(() => {
    let draft: Invoice | null = null;
    try {
      const raw = localStorage.getItem(DRAFT);
      if (raw) draft = JSON.parse(raw) as Invoice;
    } catch {
      draft = null;
    }
    const [today, due] = dates();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (draft && Array.isArray(draft.items)) {
      setInv({ ...blankInvoice(today, due), ...draft });
      setKeep(true);
    } else setInv(blankInvoice(today, due));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    track("tool_opened", { tool: "invoice-generator" });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (keep) localStorage.setItem(DRAFT, JSON.stringify(inv));
      else localStorage.removeItem(DRAFT);
    } catch {
      /* storage unavailable */
    }
  }, [inv, keep, ready]);

  // Scale the 794px-wide A4 sheet to the preview column.
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 794)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((s) => ({ ...s, [k]: v }));
  const setParty = (who: "from" | "to") => (k: keyof Party, v: string) => setInv((s) => ({ ...s, [who]: { ...s[who], [k]: v } }));
  const setItem = (id: string, patch: Partial<LineItem>) => setInv((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  const onLogo = (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setLogoError("Use a PNG, JPG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setLogoError("Logos must be 2 MB or smaller.");
    const reader = new FileReader();
    reader.onload = async () => {
      let url = String(reader.result);
      if (file.type === "image/webp") {
        // PDFs can't embed WebP — convert to PNG once.
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d")!.drawImage(img, 0, 0);
        url = c.toDataURL("image/png");
      }
      set("logo", url);
    };
    reader.readAsDataURL(file);
  };

  const download = async () => {
    setBusy(true);
    setPdfNote(null);
    try {
      const { buildInvoicePdf } = await import("@/lib/invoice-pdf");
      const out = await buildInvoicePdf(inv);
      downloadBlob(new Blob([out.bytes as BlobPart], { type: "application/pdf" }), `invoice-${(inv.number || "draft").replace(/[^\w.-]+/g, "-")}.pdf`);
      track("download_clicked", { tool: "invoice-generator", format: "pdf", count: out.pages });
      if (out.unsupported.length) {
        setPdfNote(`These characters can't be drawn in the PDF and were replaced with “?”: ${out.unsupported.slice(0, 12).join(" ")}. Use Print → Save as PDF for complex scripts such as Devanagari or Arabic.`);
      }
    } catch (e) {
      setPdfNote(`The PDF couldn't be created. ${e instanceof Error ? e.message : ""}`);
    } finally {
      setBusy(false);
    }
  };

  const sheet = useRef<HTMLDivElement>(null);
  const print = () => {
    if (sheet.current) printElement(sheet.current, "a4");
    track("download_clicked", { tool: "invoice-generator", format: "print" });
  };

  const symbol = new Intl.NumberFormat("en", { style: "currency", currency: inv.currency }).formatToParts(0).find((p) => p.type === "currency")?.value ?? inv.currency;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const [a, b] = dates();
              setInv(sampleInvoice(a, b));
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium hover:border-charcoal"
          >
            <Sparkles aria-hidden className="size-4" /> Load sample
          </button>
          <button
            type="button"
            onClick={() => {
              const [a, b] = dates();
              setInv(blankInvoice(a, b));
              setPdfNote(null);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm text-ink-2 hover:bg-ivory-2 hover:text-charcoal"
          >
            <RotateCcw aria-hidden className="size-4" /> Reset
          </button>
          <div className="ml-auto">
            <Toggle checked={keep} onChange={setKeep} label="Keep draft in this browser" description={keep ? "Saved on this device only" : "Off — nothing is saved"} />
          </div>
        </div>

        <Section title="Invoice">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Template</FieldLabel>
              <Segmented
                label="Template"
                size="sm"
                value={inv.template}
                onChange={(v) => set("template", v as Template)}
                options={[
                  { value: "minimal", label: "Minimal" },
                  { value: "modern", label: "Modern" },
                  { value: "professional", label: "Professional" },
                ]}
              />
            </div>
            <TextField id="inv-number" label="Invoice number" value={inv.number} onChange={(v) => set("number", v)} mono />
            <div className="min-w-0">
              <FieldLabel htmlFor="inv-currency">Currency</FieldLabel>
              <select id="inv-currency" value={inv.currency} onChange={(e) => set("currency", e.target.value)} className={clsx(inputCls, "cursor-pointer")}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <TextField id="inv-date" label="Invoice date" type="date" value={inv.date} onChange={(v) => set("date", v)} />
            <TextField id="inv-due" label="Due date" type="date" value={inv.dueDate} onChange={(v) => set("dueDate", v)} />
            <TextField id="inv-terms" label="Payment terms" value={inv.terms} onChange={(v) => set("terms", v)} placeholder="e.g. Net 15" />
            <TextField id="inv-ref" label="Reference / PO (optional)" value={inv.reference} onChange={(v) => set("reference", v)} />
          </div>
          {parseISODate(inv.date) && parseISODate(inv.dueDate) && inv.dueDate < inv.date && <p className="mt-2 text-xs text-error">The due date is before the invoice date.</p>}
        </Section>

        <Section
          title="From"
          aside={
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal">
              <ImagePlus aria-hidden className="size-4" /> {inv.logo ? "Change logo" : "Add logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} aria-label="Upload logo" />
            </label>
          }
        >
          {inv.logo && (
            <div className="mb-3 flex items-center gap-3 rounded-[10px] bg-ivory p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={inv.logo} alt="" className="h-10 max-w-[140px] object-contain" />
              <button type="button" onClick={() => set("logo", null)} className="ml-auto grid size-8 place-items-center rounded-[8px] text-ink-2 hover:bg-card" aria-label="Remove logo">
                <X className="size-4" />
              </button>
            </div>
          )}
          {logoError && <p className="mb-2 text-xs text-error">{logoError}</p>}
          <PartyFields who="from" p={inv.from} set={setParty("from")} />
        </Section>

        <Section title="Bill to">
          <PartyFields who="to" p={inv.to} set={setParty("to")} />
        </Section>

        <Section
          title="Items"
          aside={
            <button type="button" onClick={() => set("items", [...inv.items, newItem()])} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-charcoal px-3 text-sm font-medium text-ivory hover:bg-black">
              <Plus aria-hidden className="size-4" /> Add item
            </button>
          }
        >
          <SortableList items={inv.items} onReorder={(items) => set("items", items)} label="Invoice items" itemLabel={(i) => i.description || "item"}>
            {(it, i) => (
              <div className="grid gap-2 p-1">
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 w-5 shrink-0 font-mono text-xs text-ink-3">{i + 1}</span>
                  <textarea
                    aria-label={`Item ${i + 1} description`}
                    rows={1}
                    value={it.description}
                    placeholder="Description"
                    onChange={(e) => setItem(it.id, { description: e.target.value })}
                    className={clsx(areaCls, "min-h-10")}
                  />
                  <button
                    type="button"
                    onClick={() => set("items", inv.items.length > 1 ? inv.items.filter((x) => x.id !== it.id) : [newItem()])}
                    aria-label={`Remove item ${i + 1}`}
                    className="mt-1 grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-error"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-7 sm:grid-cols-[0.7fr_1fr_1.2fr_0.8fr_0.9fr]">
                  <input aria-label={`Item ${i + 1} quantity`} inputMode="decimal" value={it.quantity} placeholder="Qty" onChange={(e) => setItem(it.id, { quantity: e.target.value })} className={clsx(inputCls, "font-mono")} />
                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-2">{symbol}</span>
                    <input aria-label={`Item ${i + 1} unit price`} inputMode="decimal" value={it.unitPrice} placeholder="Price" onChange={(e) => setItem(it.id, { unitPrice: e.target.value })} className={clsx(inputCls, "pl-8 font-mono")} />
                  </div>
                  <div className="flex min-w-0 gap-1">
                    <input aria-label={`Item ${i + 1} discount`} inputMode="decimal" value={it.discount} placeholder="Disc." onChange={(e) => setItem(it.id, { discount: e.target.value })} className={clsx(inputCls, "font-mono")} />
                    <select aria-label={`Item ${i + 1} discount type`} value={it.discountType} onChange={(e) => setItem(it.id, { discountType: e.target.value as DiscountType })} className="h-10 shrink-0 rounded-[10px] border border-line-strong bg-card px-1.5 text-xs">
                      <option value="pct">%</option>
                      <option value="amount">{symbol}</option>
                    </select>
                  </div>
                  <input
                    aria-label={`Item ${i + 1} tax rate`}
                    inputMode="decimal"
                    value={it.taxRate}
                    disabled={inv.taxMode === "none"}
                    placeholder={inv.taxMode === "none" ? "—" : `${inv.taxRate || 0}%`}
                    onChange={(e) => setItem(it.id, { taxRate: e.target.value })}
                    className={clsx(inputCls, "font-mono disabled:opacity-40")}
                  />
                  <p className="flex h-10 items-center justify-end font-mono text-sm" aria-label={`Item ${i + 1} total`}>
                    {formatMoney(totals.lines[i]?.net ?? 0, inv.currency)}
                  </p>
                </div>
              </div>
            )}
          </SortableList>
          <p className="mt-2 text-xs text-ink-2">Columns: quantity · unit price · discount · tax rate (blank uses the default rate) · line total.</p>
        </Section>

        <Section title="Tax, discounts & payments">
          <div className="grid gap-4">
            <div>
              <FieldLabel>Tax</FieldLabel>
              <Segmented
                label="Tax mode"
                size="sm"
                value={inv.taxMode}
                onChange={(v) => set("taxMode", v as TaxMode)}
                options={[
                  { value: "none", label: "None" },
                  { value: "single", label: "Custom tax" },
                  { value: "gst-intra", label: "GST", hint: "CGST+SGST" },
                  { value: "gst-inter", label: "GST", hint: "IGST" },
                ]}
              />
            </div>
            {inv.taxMode !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                {inv.taxMode === "single" ? (
                  <TextField id="inv-taxlabel" label="Tax label" value={inv.taxLabel} onChange={(v) => set("taxLabel", v)} placeholder="VAT, Sales tax…" />
                ) : (
                  <p className="self-end pb-2 text-sm text-ink-2">{inv.taxMode === "gst-intra" ? "Split equally into CGST and SGST" : "Charged as IGST"}</p>
                )}
                <TextField id="inv-taxrate" label="Default rate (%)" value={inv.taxRate} onChange={(v) => set("taxRate", v)} mono />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <FieldLabel htmlFor="inv-discount">Invoice discount</FieldLabel>
                <div className="flex gap-1">
                  <input id="inv-discount" inputMode="decimal" value={inv.discount} onChange={(e) => set("discount", e.target.value)} className={clsx(inputCls, "font-mono")} />
                  <select aria-label="Invoice discount type" value={inv.discountType} onChange={(e) => set("discountType", e.target.value as DiscountType)} className="h-10 shrink-0 rounded-[10px] border border-line-strong bg-card px-2 text-sm">
                    <option value="pct">%</option>
                    <option value="amount">{symbol}</option>
                  </select>
                </div>
              </div>
              <TextField id="inv-paid" label="Amount paid" value={inv.paid} onChange={(v) => set("paid", v)} mono />
              <TextField id="inv-chlabel" label="Additional charge label" value={inv.chargesLabel} onChange={(v) => set("chargesLabel", v)} placeholder="Shipping" />
              <TextField id="inv-charges" label="Additional charge (not taxed)" value={inv.charges} onChange={(v) => set("charges", v)} mono />
            </div>
          </div>
          {totals.errors.length > 0 && (
            <div className="mt-3">
              <Notice tone="error">
                <ul className="list-disc pl-4">
                  {totals.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Notice>
            </div>
          )}
          <details className="mt-4 text-sm text-ink-2">
            <summary className="cursor-pointer font-medium text-charcoal">How totals are calculated</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Line amount = quantity × unit price, minus any line discount.</li>
              <li>Subtotal = sum of line amounts; the invoice discount is then applied.</li>
              <li>Tax = taxable amount × rate, rounded once per rate (CGST/SGST split equally).</li>
              <li>Total = taxable amount + tax + additional charges.</li>
              <li>Balance due = total − amount paid.</li>
            </ol>
          </details>
        </Section>

        <Section title="Notes & terms">
          <div className="grid gap-3">
            {(
              [
                ["payment", "Payment instructions", "Bank details, UPI ID, payment link…"],
                ["notes", "Notes", "Thank you for your business."],
                ["conditions", "Terms & conditions", "Late payment terms, returns…"],
              ] as const
            ).map(([k, label, ph]) => (
              <div key={k}>
                <FieldLabel htmlFor={`inv-${k}`}>{label}</FieldLabel>
                <textarea id={`inv-${k}`} rows={3} value={inv[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} className={areaCls} />
              </div>
            ))}
          </div>
        </Section>
        <p className="px-1 text-xs leading-relaxed text-ink-2">
          This is an invoice creation tool, not accounting, tax or legal advice. You&rsquo;re responsible for checking the tax rates and the details your invoices must include where you do business.
        </p>
      </div>

      {/* Preview */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[14px] bg-charcoal p-3 text-ivory">
          <div className="mr-auto px-1">
            <p className="text-xs text-ivory/60">{totals.paid ? "Balance due" : "Total"}</p>
            <p className="font-mono text-xl" data-testid="invoice-due">
              {formatMoney(totals.paid ? totals.balance : totals.grandTotal, inv.currency)}
            </p>
          </div>
          <button type="button" onClick={print} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ivory/20 px-3 text-sm font-medium hover:border-ivory/60">
            <Printer aria-hidden className="size-4" /> Print
          </button>
          <button type="button" onClick={download} disabled={busy || totals.errors.length > 0} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-orange px-4 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-50">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Download aria-hidden className="size-4" />} Download PDF
          </button>
        </div>
        {pdfNote && (
          <div className="mb-3">
            <Notice tone="error">
              <span className="flex items-start gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {pdfNote}
              </span>
            </Notice>
          </div>
        )}
        <div ref={frame} className="overflow-hidden rounded-[12px] border border-line bg-ivory-2 p-0 shadow-[0_24px_60px_-40px_rgba(37,37,37,0.5)]" aria-label="Invoice preview">
          <div style={{ height: 1123 * scale, width: 794 * scale }} className="relative">
            <div ref={sheet} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
              <Preview inv={inv} t={totals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
