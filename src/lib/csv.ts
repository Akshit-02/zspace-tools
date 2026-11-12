/**
 * CSV → JSON. Low-level parsing (quotes, escaped quotes, embedded delimiters
 * and line breaks, delimiter detection) is done by Papa Parse; header naming,
 * ragged rows and value handling are done here so no data is silently dropped.
 */
import Papa from "papaparse";

export type DelimiterChoice = "auto" | "," | "\t" | ";" | "|" | "custom";
export type Shape = "objects" | "arrays";

export interface CsvOptions {
  delimiter: DelimiterChoice;
  custom: string;
  header: boolean;
  /** Convert "12", "3.5", "true", "false", "null" to JSON types. Off by default to keep values exact. */
  inferTypes: boolean;
  /** How to represent empty cells. */
  empty: "string" | "null";
  skipEmptyLines: boolean;
}

export interface CsvIssue {
  row: number; // 1-based line of the record in the source (approximate for multiline fields)
  message: string;
}

export interface CsvResult {
  ok: true;
  headers: string[];
  rows: unknown[][];
  objects: Record<string, unknown>[];
  delimiter: string;
  issues: CsvIssue[];
  renamed: string[];
  columnCount: number;
}

export type CsvOutcome = CsvResult | { ok: false; message: string };

const DELIM_NAMES: Record<string, string> = { ",": "comma", "\t": "tab", ";": "semicolon", "|": "pipe" };
export const delimiterName = (d: string) => DELIM_NAMES[d] ?? `"${d}"`;

function infer(v: string): unknown {
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v)) {
    const n = Number(v);
    // Keep as string if the number can't be represented exactly (e.g. long IDs).
    if (Number.isFinite(n) && (!/^-?\d+$/.test(v) || Number.isSafeInteger(n))) return n;
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  return v;
}

/** Makes headers unique and non-empty: "name","name" → "name","name_2"; "" → "column_3". */
export function uniqueHeaders(raw: string[]): { headers: string[]; renamed: string[] } {
  const seen = new Map<string, number>();
  const renamed: string[] = [];
  const headers = raw.map((h, i) => {
    let base = h.trim();
    if (!base) {
      base = `column_${i + 1}`;
      renamed.push(`Column ${i + 1} had no header and was named "${base}".`);
    }
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    if (n === 1) return base;
    let name = `${base}_${n}`;
    while (seen.has(name)) name = `${name}_`;
    seen.set(name, 1);
    renamed.push(`Duplicate header "${base}" in column ${i + 1} was renamed to "${name}".`);
    return name;
  });
  return { headers, renamed };
}

export function parseCsv(text: string, o: CsvOptions): CsvOutcome {
  const src = text.replace(/^﻿/, "");
  if (!src.trim()) return { ok: false, message: "There's no CSV data to convert. Paste some, or open a .csv file." };
  if (o.delimiter === "custom" && !o.custom) return { ok: false, message: "Enter a custom delimiter character." };
  const delimiter = o.delimiter === "auto" ? "" : o.delimiter === "custom" ? o.custom : o.delimiter;

  const res = Papa.parse<string[]>(src, {
    delimiter,
    delimitersToGuess: [",", "\t", ";", "|"],
    skipEmptyLines: o.skipEmptyLines ? "greedy" : false,
    header: false,
    dynamicTyping: false,
  });

  const issues: CsvIssue[] = [];
  for (const e of res.errors) {
    if (e.code === "UndetectableDelimiter") continue; // single-column data is fine
    issues.push({ row: (e.row ?? 0) + 1, message: e.code === "MissingQuotes" ? "A quoted field is never closed — a closing double quote is missing." : e.message });
  }
  let data = res.data;
  if (!o.skipEmptyLines && data.length && data[data.length - 1].length === 1 && data[data.length - 1][0] === "") data = data.slice(0, -1);
  if (!data.length) return { ok: false, message: "No rows were found in this CSV." };

  const cell = (v: string | undefined): unknown => (v === undefined || v === "" ? (o.empty === "null" ? null : "") : o.inferTypes ? infer(v) : v);
  const width = Math.max(...data.map((r) => r.length));

  let headers: string[];
  let body: string[][];
  let renamed: string[] = [];
  if (o.header) {
    const h = uniqueHeaders(data[0]);
    headers = h.headers;
    renamed = h.renamed;
    body = data.slice(1);
    if (!body.length) issues.push({ row: 1, message: "Only a header row was found — there are no data rows." });
    // Extra cells beyond the header get generated names rather than being dropped.
    for (let i = headers.length; i < width; i++) {
      headers.push(`column_${i + 1}`);
      renamed.push(`Some rows have more cells than the header; extra column ${i + 1} was named "column_${i + 1}".`);
    }
  } else {
    headers = Array.from({ length: width }, (_, i) => `column_${i + 1}`);
    body = data;
  }

  const expected = o.header ? data[0].length : width;
  body.forEach((r, i) => {
    if (r.length !== expected && !(r.length === 1 && r[0] === "")) {
      const line = i + 1 + (o.header ? 1 : 0);
      issues.push({ row: line, message: `Row ${line} has ${r.length} ${r.length === 1 ? "cell" : "cells"}; expected ${expected}. ${r.length < expected ? "Missing cells are empty." : "Extra cells were kept."}` });
    }
  });

  const rows = body.map((r) => headers.map((_, i) => cell(r[i])));
  const objects = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return { ok: true, headers, rows, objects, delimiter: res.meta.delimiter, issues, renamed, columnCount: headers.length };
}

export function toJson(r: CsvResult, shape: Shape, pretty: boolean, includeHeaderRow = true) {
  const value = shape === "objects" ? r.objects : includeHeaderRow ? [r.headers, ...r.rows] : r.rows;
  return JSON.stringify(value, null, pretty ? 2 : undefined);
}

export const CSV_SAMPLE = `name,city,role,notes
Amit,Mumbai,Founder,"Loves chai, hates meetings"
Priya,Delhi,Designer,"Says ""less is more"""
Omar,Dubai,Engineer,
Chloé,Paris,Writer,"Two-line
note"`;
