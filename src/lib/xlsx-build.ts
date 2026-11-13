/**
 * Builds an .xlsx workbook (ExcelJS) and CSV from extracted tables.
 * Numbers are written as numbers with a format that reproduces their original
 * look; everything else is written as text (format "@") so Excel never turns
 * identifiers into dates or scientific notation.
 */
import { parseCell } from "./cell-values";

export interface SheetSpec {
  name: string;
  rows: string[][];
  header: boolean;
}

/** Excel sheet names: ≤31 chars, no []:*?/\ and unique (case-insensitive). */
export function sheetNames(names: string[]) {
  const used = new Set<string>();
  return names.map((n) => {
    const base = (n.replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim() || "Sheet").slice(0, 31);
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 31 - String(i).length - 1)} ${i}`;
    used.add(name.toLowerCase());
    return name;
  });
}

type ExcelJSModule = typeof import("exceljs");

export async function buildXlsx(ExcelJS: ExcelJSModule, sheets: SheetSpec[], convert: boolean) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ZSpace Tools";
  wb.created = new Date();
  const names = sheetNames(sheets.map((s) => s.name));
  sheets.forEach((spec, si) => {
    const ws = wb.addWorksheet(names[si], spec.header ? { views: [{ state: "frozen", ySplit: 1 }] } : undefined);
    const widths: number[] = [];
    spec.rows.forEach((r, ri) => {
      const row = ws.getRow(ri + 1);
      r.forEach((raw, ci) => {
        const cell = row.getCell(ci + 1);
        const isHeader = spec.header && ri === 0;
        const c = isHeader ? ({ t: "s", v: raw.trim() } as const) : parseCell(raw, convert);
        if (c.t === "n") {
          cell.value = c.v;
          cell.numFmt = c.fmt;
        } else if (c.v !== "") {
          cell.value = c.v;
          cell.numFmt = "@";
        }
        if (isHeader) {
          cell.font = { bold: true };
          cell.border = { bottom: { style: "thin", color: { argb: "FF999999" } } };
        }
        widths[ci] = Math.max(widths[ci] ?? 6, Math.min(60, (c.t === "n" ? c.raw : c.v).length + 2));
      });
      row.commit?.();
    });
    widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  });
  return wb.xlsx.writeBuffer();
}

const csvCell = (s: string) => {
  // Cells starting with = + - @ could run as formulas in spreadsheet apps; neutralise them (numbers are fine).
  const guard = /^[=+\-@\t\r]/.test(s) && !/^-?[\d.,]+$/.test(s);
  return /[",\r\n]/.test(s) || guard ? `"${guard ? "'" : ""}${s.replace(/"/g, '""')}"` : s;
};
/** RFC 4180 CSV with a UTF-8 BOM (so Excel reads ₹ and accents). Formula-like cells are neutralised. */
export const toCsv = (rows: string[][]) => "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
