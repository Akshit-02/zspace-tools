/**
 * JSON → CSV. Accepts an array of objects (the usual API/export shape), a
 * single object, an array of arrays or an array of plain values. Nothing is
 * dropped silently: nested data is either flattened into dot-path columns or
 * written as JSON text, and every lossy or unusual situation is reported.
 */
import { analyzeJson } from "./json-tools";
import { buildCsv, looksLikeFormula } from "./csv-write";

export type JsonDelimiter = "," | "\t" | ";" | "|";

export interface JsonCsvOptions {
  delimiter: JsonDelimiter;
  header: boolean;
  /** Expand nested objects into "parent.child" columns. Off writes them as JSON text. */
  flatten: boolean;
  /** How arrays are written: one JSON text cell, or one column per item ("tags.0", "tags.1"). */
  arrays: "json" | "index";
  nulls: "empty" | "null";
  eol: "crlf" | "lf";
  bom: boolean;
  quoteAll: boolean;
  /** Prefix an apostrophe to values a spreadsheet could run as a formula. */
  formulaGuard: boolean;
  /** Top-level key holding the records, e.g. "data" for { "data": [...] }. Empty = the whole document. */
  path: string;
}

export const JSON_CSV_DEFAULTS: JsonCsvOptions = {
  delimiter: ",",
  header: true,
  flatten: true,
  arrays: "json",
  nulls: "empty",
  eol: "crlf",
  bom: false,
  quoteAll: false,
  formulaGuard: false,
  path: "",
};

export interface JsonCsvResult {
  ok: true;
  csv: string;
  headers: string[];
  /** Data rows (without the header), exactly as written to the CSV. */
  rows: string[][];
  warnings: string[];
  /** Cells (including headers) that start with =, +, -, @, tab or CR. */
  formulaCells: number;
  formulaExamples: string[];
  /** Top-level keys whose value is an array of objects — candidates for `path`. */
  candidates: string[];
}

export type JsonCsvOutcome = JsonCsvResult | { ok: false; message: string; line?: number; column?: number };

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
const isObj = (v: unknown): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);

export function jsonToCsv(text: string, o: JsonCsvOptions): JsonCsvOutcome {
  const src = text.replace(/^﻿/, "");
  if (!src.trim()) return { ok: false, message: "There's no JSON to convert. Paste some, or open a .json file." };
  let data: Json;
  try {
    data = JSON.parse(src);
  } catch {
    const a = analyzeJson(src);
    if (!a.ok && "error" in a) return { ok: false, message: `Invalid JSON: ${a.error.message}${a.error.hint ? ` ${a.error.hint}` : ""}`, line: a.error.line, column: a.error.column };
    return { ok: false, message: "Invalid JSON." };
  }

  const candidates = isObj(data) ? Object.keys(data).filter((k) => Array.isArray(data[k as never]) && (data as Record<string, Json[]>)[k].length > 0 && (data as Record<string, Json[]>)[k].every((x) => isObj(x))) : [];
  const warnings: string[] = [];

  let records: Json = data;
  if (o.path) {
    if (!isObj(data) || !(o.path in data)) return { ok: false, message: `The JSON has no top-level "${o.path}" key.` };
    records = data[o.path];
  }

  if (records === null || typeof records !== "object") {
    return { ok: false, message: "JSON to CSV needs an array (e.g. a list of records) or an object — not a single string, number, true/false or null." };
  }

  let headers: string[] = [];
  let rows: string[][] = [];
  const bigNumbers = { n: 0 };
  const cell = (v: Json): string => {
    if (v === null) return o.nulls === "null" ? "null" : "";
    if (typeof v === "number") {
      if (Number.isInteger(v) && !Number.isSafeInteger(v)) bigNumbers.n++;
      return String(v);
    }
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  };

  const list: Json[] = Array.isArray(records) ? records : [records];
  if (!list.length) return { ok: false, message: "The array is empty — there are no records to convert." };

  if (list.every((r) => Array.isArray(r))) {
    // Array of arrays: written row by row; no header is invented.
    rows = (list as Json[][]).map((r) => r.map(cell));
    const width = Math.max(...rows.map((r) => r.length));
    if (rows.some((r) => r.length !== width)) warnings.push(`Rows have different lengths (up to ${width} values); shorter rows were written with fewer fields.`);
    warnings.push("The input is an array of arrays, so each inner array was written as one CSV row without adding a header row.");
    headers = [];
  } else {
    const columns = new Map<string, true>();
    let nestedAsJson = 0;
    let collisions = 0;
    let nonObjects = 0;
    const flat: Record<string, string>[] = list.map((rec) => {
      const out: Record<string, string> = {};
      const put = (key: string, value: string) => {
        if (key in out) collisions++;
        out[key] = value;
        columns.set(key, true);
      };
      const walk = (v: Json, path: string) => {
        if (Array.isArray(v)) {
          if (o.arrays === "index" && v.length) v.forEach((x, i) => walk(x, `${path}.${i}`));
          else {
            if (v.length) nestedAsJson++;
            put(path, v.length ? JSON.stringify(v) : "");
          }
        } else if (isObj(v)) {
          const keys = Object.keys(v);
          if (o.flatten && keys.length) keys.forEach((k) => walk(v[k], path ? `${path}.${k}` : k));
          else {
            if (keys.length) nestedAsJson++;
            put(path, keys.length ? JSON.stringify(v) : "");
          }
        } else put(path, cell(v));
      };
      if (isObj(rec)) {
        for (const k of Object.keys(rec)) walk(rec[k], k);
      } else {
        nonObjects++;
        if (Array.isArray(rec)) put("value", JSON.stringify(rec));
        else put("value", cell(rec));
      }
      return out;
    });
    headers = [...columns.keys()];
    let incomplete = 0;
    rows = flat.map((r) => {
      if (Object.keys(r).length < headers.length) incomplete++;
      return headers.map((h) => r[h] ?? "");
    });
    if (nonObjects && nonObjects < list.length) warnings.push(`${nonObjects} item${nonObjects === 1 ? " is" : "s are"} not an object; ${nonObjects === 1 ? "it was" : "they were"} written to a "value" column.`);
    if (incomplete) warnings.push(`${incomplete} of ${rows.length} ${rows.length === 1 ? "record doesn't" : "records don't"} have every column; missing values were left empty.`);
    if (nestedAsJson) warnings.push(`${nestedAsJson} nested ${o.flatten ? "array" : "object or array"} value${nestedAsJson === 1 ? " was" : "s were"} written as JSON text. ${o.flatten ? 'Choose "One column per item" to spread arrays across columns.' : "Turn on flattening to expand nested objects into columns."}`);
    if (collisions) warnings.push(`${collisions} value${collisions === 1 ? "" : "s"} had a key that clashed with a flattened path (e.g. a literal "a.b" key next to { "a": { "b": … } }); the later value was kept.`);
    if (headers.length > 1000) warnings.push(`The CSV has ${headers.length} columns — some spreadsheet apps struggle with very wide files.`);
  }

  if (bigNumbers.n) warnings.push(`${bigNumbers.n} number${bigNumbers.n === 1 ? " is" : "s are"} larger than 9,007,199,254,740,991 and can't be read exactly by a browser; the last digits may differ from your file. Store long IDs as strings in the JSON to keep every digit.`);
  if (candidates.length && !o.path && !Array.isArray(data)) warnings.push(`This JSON is an object. Its "${candidates[0]}" key holds a list of records — choose it under "Records" to convert one row per record.`);

  // Formula-injection check (and optional guard) over the header and data cells.
  let formulaCells = 0;
  const formulaExamples: string[] = [];
  const guard = (v: string) => {
    if (!looksLikeFormula(v)) return v;
    formulaCells++;
    if (formulaExamples.length < 3) formulaExamples.push(v.length > 40 ? `${v.slice(0, 40)}…` : v);
    return o.formulaGuard ? `'${v}` : v;
  };
  const outHeaders = o.header && headers.length ? headers.map(guard) : [];
  const outRows = rows.map((r) => r.map(guard));

  const csv = buildCsv(outHeaders.length ? [outHeaders, ...outRows] : outRows, {
    delimiter: o.delimiter,
    eol: o.eol === "crlf" ? "\r\n" : "\n",
    bom: o.bom,
    quoteAll: o.quoteAll,
  });
  return { ok: true, csv, headers, rows: outRows, warnings, formulaCells, formulaExamples, candidates };
}

export const JSON_SAMPLE = `[
  {
    "id": 1,
    "name": "Amit Shah",
    "city": "Mumbai",
    "active": true,
    "address": { "pin": "400001", "state": "Maharashtra" },
    "tags": ["founder", "chai"]
  },
  {
    "id": 2,
    "name": "Chloé Martin",
    "city": "Paris",
    "active": false,
    "address": { "pin": "75001", "state": null },
    "notes": "Said \\"bonjour\\", then left"
  },
  {
    "id": 3,
    "name": "Omar Haddad",
    "city": "Dubai",
    "active": true,
    "notes": "Line one\\nLine two"
  }
]`;
