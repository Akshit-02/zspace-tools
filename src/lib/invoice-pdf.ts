/**
 * Vector PDF invoices with pdf-lib (real text, not a screenshot).
 * Fonts: Satoshi (brand) with Noto Sans (OFL) as a per-character fallback for
 * glyphs Satoshi lacks, such as ₹. pdf-lib does not shape complex scripts
 * (Devanagari, Arabic…), so such characters are reported instead of being
 * drawn incorrectly — the UI then recommends Print, which the browser shapes.
 */
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { calculate, formatMoney, type Invoice, type Totals } from "./invoice";
import { formatYMD, parseISODate } from "./age";

const A4: [number, number] = [595.28, 841.89];
const M = 48; // margin
const CW = A4[0] - 2 * M; // content width
const hexRgb = (h: string): RGB => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = { ink: hexRgb("#252525"), ink2: hexRgb("#77716B"), line: hexRgb("#E8DED2"), ivory: hexRgb("#FAF7F2"), ivory2: hexRgb("#F2ECE3"), orange: hexRgb("#F07845"), white: rgb(1, 1, 1) };

interface FontSet {
  reg: PDFFont;
  bold: PDFFont;
  fbReg: PDFFont | null;
  fbBold: PDFFont | null;
}

export interface PdfOutcome {
  bytes: Uint8Array;
  pages: number;
  /** Characters no embedded font can draw (replaced with "?" in the PDF). */
  unsupported: string[];
}

async function fetchBytes(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Couldn't load ${url}`);
  return new Uint8Array(await r.arrayBuffer());
}

function invoiceText(inv: Invoice) {
  const parts = [inv.number, inv.reference, inv.terms, inv.notes, inv.payment, inv.conditions, inv.taxLabel, inv.chargesLabel, ...Object.values(inv.from), ...Object.values(inv.to), ...inv.items.map((i) => i.description)];
  return parts.join(" ");
}

export async function buildInvoicePdf(inv: Invoice): Promise<PdfOutcome> {
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Invoice ${inv.number}`);
  doc.setProducer("ZSpace Tools (pdf-lib)");
  doc.setCreator("ZSpace Tools Invoice Generator");

  const [regB, boldB] = await Promise.all([fetchBytes("/fonts/pdf/Satoshi-Regular.ttf"), fetchBytes("/fonts/pdf/Satoshi-Bold.ttf")]);
  const reg = await doc.embedFont(regB, { subset: true });
  const bold = await doc.embedFont(boldB, { subset: true });
  const has = new Set(reg.getCharacterSet());

  // Load the fallback only if the content (or the currency symbol) needs it.
  const totals = calculate(inv);
  const sample = invoiceText(inv) + formatMoney(123456, inv.currency);
  const needsFallback = [...sample].some((ch) => ch.trim() && !has.has(ch.codePointAt(0)!));
  let fbReg: PDFFont | null = null;
  let fbBold: PDFFont | null = null;
  if (needsFallback) {
    const [a, b] = await Promise.all([fetchBytes("/fonts/pdf/NotoSans-Regular.ttf"), fetchBytes("/fonts/pdf/NotoSans-Bold.ttf")]);
    fbReg = await doc.embedFont(a, { subset: true });
    fbBold = await doc.embedFont(b, { subset: true });
  }
  const fbHas = new Set(fbReg ? fbReg.getCharacterSet() : []);
  const fonts: FontSet = { reg, bold, fbReg, fbBold };
  const unsupported = new Set<string>();

  /** Splits text into runs drawable by a single font. */
  const runs = (text: string, isBold: boolean) => {
    const out: { t: string; f: PDFFont }[] = [];
    for (const ch of text.replace(/\t/g, " ")) {
      const cp = ch.codePointAt(0)!;
      let f: PDFFont;
      let c = ch;
      if (has.has(cp) || ch === " ") f = isBold ? fonts.bold : fonts.reg;
      else if (fbHas.has(cp)) f = (isBold ? fonts.fbBold : fonts.fbReg)!;
      else {
        if (ch.trim()) unsupported.add(ch);
        f = isBold ? fonts.bold : fonts.reg;
        c = "?";
      }
      const last = out[out.length - 1];
      if (last && last.f === f) last.t += c;
      else out.push({ t: c, f });
    }
    return out;
  };
  const width = (text: string, size: number, isBold = false) => runs(text, isBold).reduce((w, r) => w + r.f.widthOfTextAtSize(r.t, size), 0);
  const draw = (page: PDFPage, text: string, x: number, y: number, size: number, o: { bold?: boolean; color?: RGB; align?: "left" | "right" | "center"; maxW?: number } = {}) => {
    let t = text;
    if (o.maxW) while (t.length > 1 && width(t, size, o.bold) > o.maxW) t = t.slice(0, -2) + "…";
    const w = width(t, size, o.bold);
    let cx = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    for (const r of runs(t, Boolean(o.bold))) {
      page.drawText(r.t, { x: cx, y, size, font: r.f, color: o.color ?? C.ink });
      cx += r.f.widthOfTextAtSize(r.t, size);
    }
  };
  const wrap = (text: string, size: number, maxW: number, isBold = false) => {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/(\s+)/)) {
        const next = line + word;
        if (width(next.trimEnd(), size, isBold) <= maxW || !line.trim()) {
          if (width(next.trimEnd(), size, isBold) > maxW && !line.trim()) {
            // A single word longer than the line: hard-break it.
            let chunk = "";
            for (const ch of word) {
              if (width(chunk + ch, size, isBold) > maxW) {
                lines.push(chunk);
                chunk = "";
              }
              chunk += ch;
            }
            line = chunk;
          } else line = next;
        } else {
          lines.push(line.trimEnd());
          line = word.trimStart();
        }
      }
      lines.push(line.trimEnd());
    }
    return lines;
  };

  const money = (m: number) => formatMoney(m, inv.currency);
  const date = (s: string) => {
    const d = parseISODate(s);
    return d ? formatYMD(d) : s;
  };
  const tpl = inv.template;
  const accent = tpl === "minimal" ? C.ink : C.orange;

  let page = doc.addPage(A4);
  let y = A4[1] - M;
  const pages: PDFPage[] = [page];
  const bottom = M + 28;
  const newPage = () => {
    page = doc.addPage(A4);
    pages.push(page);
    y = A4[1] - M;
  };

  /* ---------- Header ---------- */
  if (tpl === "professional") {
    page.drawRectangle({ x: 0, y: A4[1] - 118, width: A4[0], height: 118, color: C.ink });
  } else if (tpl === "modern") {
    page.drawRectangle({ x: 0, y: A4[1] - 6, width: A4[0], height: 6, color: C.orange });
  }
  const headInk = tpl === "professional" ? C.white : C.ink;
  const headInk2 = tpl === "professional" ? hexRgb("#CFC8BF") : C.ink2;

  let leftY = y;
  if (inv.logo) {
    try {
      const bytes = Uint8Array.from(atob(inv.logo.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      const img = inv.logo.startsWith("data:image/png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const s = Math.min(130 / img.width, 46 / img.height, 1);
      page.drawImage(img, { x: M, y: leftY - img.height * s, width: img.width * s, height: img.height * s });
      leftY -= img.height * s + 10;
    } catch {
      // An unreadable logo is skipped rather than failing the whole invoice.
    }
  }
  const fromName = inv.from.name || inv.from.company || "Your business";
  draw(page, fromName, M, leftY - 14, 15, { bold: true, color: headInk, maxW: CW * 0.55 });
  leftY -= 22;
  if (tpl !== "professional") {
    for (const l of [inv.from.company && inv.from.company !== fromName ? inv.from.company : "", ...inv.from.address.split("\n"), inv.from.email, inv.from.phone, inv.from.website, inv.from.taxId, ...inv.from.extra.split("\n")].filter((v) => v.trim())) {
      draw(page, l, M, leftY - 10, 8.5, { color: headInk2, maxW: CW * 0.55 });
      leftY -= 12;
    }
  }

  draw(page, "INVOICE", A4[0] - M, y - 22, 24, { bold: true, color: tpl === "professional" ? C.white : accent, align: "right" });
  let rightY = y - 44;
  for (const [k, v] of [
    ["Invoice no.", inv.number],
    ["Invoice date", date(inv.date)],
    ["Due date", date(inv.dueDate)],
    ["Terms", inv.terms],
    ["Reference", inv.reference],
  ] as const) {
    if (!v.trim()) continue;
    draw(page, k, A4[0] - M - 120, rightY, 8.5, { color: headInk2, align: "right" });
    draw(page, v, A4[0] - M, rightY, 8.5, { bold: true, color: headInk, align: "right", maxW: 150 });
    rightY -= 13;
  }

  y = Math.min(leftY, rightY) - (tpl === "professional" ? 34 : 18);
  if (tpl === "professional") {
    y = Math.min(y, A4[1] - 140);
    // Business details below the dark band for the professional template.
    const lines = [inv.from.company && inv.from.company !== fromName ? inv.from.company : "", ...inv.from.address.split("\n"), inv.from.email, inv.from.phone, inv.from.website, inv.from.taxId, ...inv.from.extra.split("\n")].filter((v) => v.trim());
    draw(page, "FROM", M, y, 7.5, { bold: true, color: C.ink2 });
    let fy = y - 13;
    for (const l of lines) {
      draw(page, l, M, fy, 8.5, { color: C.ink2, maxW: CW / 2 - 12 });
      fy -= 12;
    }
    const by = drawBillTo(M + CW / 2, y);
    y = Math.min(fy, by) - 16;
  } else {
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.6, color: C.line });
    y -= 22;
    y = drawBillTo(M, y) - 16;
  }

  function drawBillTo(x: number, top: number) {
    draw(page, "BILL TO", x, top, 7.5, { bold: true, color: tpl === "minimal" ? C.ink2 : accent });
    let by = top - 14;
    const to = inv.to;
    const name = to.name || to.company || "Customer";
    draw(page, name, x, by, 10.5, { bold: true, maxW: CW / 2 - 12 });
    by -= 13;
    for (const l of [to.company && to.company !== name ? to.company : "", ...to.address.split("\n"), to.email, to.phone, to.taxId].filter((v) => v.trim())) {
      draw(page, l, x, by, 8.5, { color: C.ink2, maxW: CW / 2 - 12 });
      by -= 12;
    }
    return by;
  }

  /* ---------- Items table ---------- */
  const showDisc = inv.items.some((i) => (Number(i.discount) || 0) > 0);
  const showTax = inv.taxMode !== "none";
  const cols = [
    { k: "#", w: 22, a: "left" as const },
    { k: "Description", w: 0, a: "left" as const },
    { k: "Qty", w: 44, a: "right" as const },
    { k: "Unit price", w: 78, a: "right" as const },
    ...(showDisc ? [{ k: "Discount", w: 56, a: "right" as const }] : []),
    ...(showTax ? [{ k: "Tax", w: 38, a: "right" as const }] : []),
    { k: "Amount", w: 84, a: "right" as const },
  ];
  cols[1].w = CW - cols.reduce((s, c) => s + c.w, 0);
  const xs: number[] = [];
  cols.reduce((x, c) => (xs.push(x), x + c.w), M);
  const PAD = 6;

  const tableHeader = () => {
    const h = 20;
    if (tpl === "professional") page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: C.ink });
    else if (tpl === "modern") page.drawRectangle({ x: M, y: y - h, width: CW, height: h, color: C.ivory2 });
    else page.drawLine({ start: { x: M, y: y - h }, end: { x: M + CW, y: y - h }, thickness: 0.8, color: C.ink });
    cols.forEach((c, i) => {
      const tx = c.a === "right" ? xs[i] + c.w - PAD : xs[i] + PAD;
      draw(page, c.k.toUpperCase(), tx, y - 13.5, 7, { bold: true, color: tpl === "professional" ? C.white : C.ink2, align: c.a });
    });
    y -= h;
  };
  tableHeader();

  totals.lines.forEach((l, i) => {
    const it = inv.items[i];
    const desc = wrap(it.description || "—", 9, cols[1].w - 2 * PAD);
    const rowH = Math.max(1, desc.length) * 12 + 10;
    if (y - rowH < bottom) {
      newPage();
      tableHeader();
    }
    const base = y - 15;
    const vals: string[] = [
      String(i + 1),
      "",
      it.quantity || "0",
      money(Math.round((Number(it.unitPrice.replace(/[,\s]/g, "")) || 0) * 100)),
      ...(showDisc ? [l.discount ? (it.discountType === "pct" ? `${Number(it.discount)}%` : money(l.discount)) : "—"] : []),
      ...(showTax ? [`${Number(l.rate.toFixed(3))}%`] : []),
      money(l.net),
    ];
    vals.forEach((v, ci) => {
      if (ci === 1) return;
      const c = cols[ci];
      draw(page, v, c.a === "right" ? xs[ci] + c.w - PAD : xs[ci] + PAD, base, 9, { align: c.a, color: ci === 0 ? C.ink2 : C.ink, maxW: c.w - 2 * PAD });
    });
    desc.forEach((line, k) => draw(page, line, xs[1] + PAD, base - k * 12, 9));
    y -= rowH;
    page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.5, color: C.line });
  });

  /* ---------- Totals ---------- */
  const rows: { k: string; v: string; strong?: boolean; accent?: boolean }[] = [];
  if (totals.lineDiscounts) rows.push({ k: "Gross amount", v: money(totals.gross) }, { k: "Item discounts", v: `−${money(totals.lineDiscounts)}` });
  rows.push({ k: "Subtotal", v: money(totals.subtotal) });
  if (totals.invoiceDiscount) rows.push({ k: `Discount${inv.discountType === "pct" ? ` (${Number(inv.discount)}%)` : ""}`, v: `−${money(totals.invoiceDiscount)}` });
  if (showTax) {
    rows.push({ k: "Taxable amount", v: money(totals.taxable) });
    for (const t of totals.taxRows) rows.push({ k: `${t.label} @ ${Number(t.rate.toFixed(3))}%`, v: money(t.amount) });
  }
  if (totals.charges) rows.push({ k: inv.chargesLabel || "Additional charges", v: money(totals.charges) });
  rows.push({ k: "Total", v: money(totals.grandTotal), strong: true });
  if (totals.paid) rows.push({ k: "Amount paid", v: `−${money(totals.paid)}` }, { k: "Balance due", v: money(totals.balance), strong: true, accent: true });

  const blockH = rows.length * 16 + 30;
  if (y - blockH < bottom) newPage();
  y -= 16;
  const tx = M + CW * 0.48;
  for (const r of rows) {
    if (r.strong) {
      page.drawLine({ start: { x: tx, y: y + 11 }, end: { x: M + CW, y: y + 11 }, thickness: 0.6, color: C.line });
      y -= 4;
    }
    draw(page, r.k, tx, y, r.strong ? 10.5 : 9, { bold: r.strong, color: r.strong ? C.ink : C.ink2, maxW: CW * 0.28 });
    draw(page, r.v, M + CW, y, r.strong ? 12 : 9, { bold: r.strong, align: "right", color: r.accent ? (tpl === "minimal" ? C.ink : C.orange) : C.ink });
    y -= r.strong ? 20 : 16;
  }

  /* ---------- Notes, payment, terms ---------- */
  for (const [title, text] of [
    ["Payment instructions", inv.payment],
    ["Notes", inv.notes],
    ["Terms & conditions", inv.conditions],
  ] as const) {
    if (!text.trim()) continue;
    const lines = wrap(text, 8.5, CW);
    if (y - 30 < bottom) newPage();
    y -= 14;
    draw(page, title.toUpperCase(), M, y, 7.5, { bold: true, color: tpl === "minimal" ? C.ink2 : accent });
    y -= 13;
    for (const line of lines) {
      if (y < bottom) {
        newPage();
      }
      draw(page, line, M, y, 8.5, { color: C.ink2 });
      y -= 12;
    }
  }

  /* ---------- Footer on every page ---------- */
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: M + 10 }, end: { x: A4[0] - M, y: M + 10 }, thickness: 0.5, color: C.line });
    draw(p, `${inv.number}`, M, M - 2, 7.5, { color: C.ink2 });
    draw(p, `Page ${i + 1} of ${pages.length}`, A4[0] - M, M - 2, 7.5, { color: C.ink2, align: "right" });
  });

  const bytes = await doc.save();
  return { bytes, pages: pages.length, unsupported: [...unsupported] };
}

export type { Totals };
