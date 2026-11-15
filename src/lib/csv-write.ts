/**
 * Dependency-free CSV writer (RFC 4180 quoting) shared by every tool that
 * exports CSV. Kept separate from csv.ts so pages that only *write* CSV don't
 * pull in the Papa Parse reader.
 */

export interface CsvWriteOptions {
  delimiter?: string;
  /** RFC 4180 uses CRLF; most tools also read LF. */
  eol?: "\r\n" | "\n";
  /** Prefix a UTF-8 byte order mark so Excel opens UTF-8 text correctly. */
  bom?: boolean;
  /** Quote every field, not only those that need it. */
  quoteAll?: boolean;
}

/** Quotes a field when it contains the delimiter, a double quote or a line break; doubles inner quotes. */
export function csvField(value: string, delimiter = ",", quoteAll = false) {
  if (quoteAll || value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: string[][], o: CsvWriteOptions = {}) {
  const d = o.delimiter ?? ",";
  const eol = o.eol ?? "\r\n";
  const body = rows.map((r) => r.map((v) => csvField(v, d, o.quoteAll)).join(d)).join(eol);
  return (o.bom ? "﻿" : "") + (rows.length ? body + eol : "");
}

/**
 * Values a spreadsheet may run as a formula when the CSV is opened
 * (CSV/formula injection). Plain signed numbers such as "-12.5" are not flagged.
 */
export function looksLikeFormula(v: string) {
  if (!v) return false;
  if (!/^[=+\-@\t\r]/.test(v)) return false;
  return !/^[+-]?(\d+([.,]\d+)*|\.\d+)([eE][+-]?\d+)?%?$/.test(v);
}
