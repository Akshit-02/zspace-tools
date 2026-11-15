"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Eraser, Info } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Panel, Segmented, Toggle, inputClass } from "./ui";
import { CURRENCIES, MAX_BULK_LINES, convert, convertBulk, type CaseStyle, type ConvertOptions, type Currency, type NumberingSystem } from "@/lib/number-words";
import { buildCsv } from "@/lib/csv-write";
import { downloadBlob } from "@/lib/format";
import { track } from "@/lib/analytics";

const EXAMPLES: { label: string; value: string; mode: "number" | "currency"; code?: string }[] = [
  { label: "₹1,25,000", value: "125000", mode: "currency", code: "INR" },
  { label: "₹2,50,000.50", value: "250000.50", mode: "currency", code: "INR" },
  { label: "₹1.5 crore", value: "15000000", mode: "currency", code: "INR" },
  { label: "$1,234.56", value: "1234.56", mode: "currency", code: "USD" },
  { label: "AED 9,999", value: "9999", mode: "currency", code: "AED" },
  { label: "1,000,000", value: "1000000", mode: "number" },
];

const CUSTOM: Currency = { code: "CUSTOM", symbol: "", major: ["Unit", "Units"], minor: ["Subunit", "Subunits"], digits: 2, system: "international" };
const BULK_PREVIEW = 200;

export default function NumberToWords() {
  const [view, setView] = useState<"single" | "bulk">("single");
  const [input, setInput] = useState("125000");
  const [bulk, setBulk] = useState("");
  const [mode, setMode] = useState<"number" | "currency">("currency");
  const [system, setSystem] = useState<NumberingSystem>("indian");
  const [code, setCode] = useState("INR");
  const [custom, setCustom] = useState<Currency>(CUSTOM);
  const [unitPosition, setUnitPosition] = useState<"before" | "after">("before");
  const [minorStyle, setMinorStyle] = useState<"words" | "fraction">("words");
  const [only, setOnly] = useState(true);
  const [caseStyle, setCaseStyle] = useState<CaseStyle>("title");
  const [and, setAnd] = useState(false);
  const [hyphens, setHyphens] = useState(false);

  useEffect(() => {
    track("tool_opened", { tool: "number-to-words" });
  }, []);

  const currency = code === "CUSTOM" ? custom : CURRENCIES.find((c) => c.code === code)!;
  const opts = useMemo<ConvertOptions>(() => ({ mode, system, currency, unitPosition, minorStyle, only, caseStyle, style: { and, hyphens } }), [mode, system, currency, unitPosition, minorStyle, only, caseStyle, and, hyphens]);
  const result = useMemo(() => convert(input, opts), [input, opts]);
  const bulkResult = useMemo(() => (view === "bulk" && bulk.trim() ? convertBulk(bulk, opts) : null), [view, bulk, opts]);

  const pickCurrency = (c: string) => {
    setCode(c);
    const def = CURRENCIES.find((x) => x.code === c);
    if (def) {
      setSystem(def.system);
      setUnitPosition(c === "INR" ? "before" : "after");
    }
  };

  const downloadBulk = () => {
    if (!bulkResult) return;
    const rows = [["line", "input", "formatted", "words", "error"], ...bulkResult.rows.map((r) => [String(r.line), r.input, r.formatted, r.words, r.error])];
    downloadBlob(new Blob([buildCsv(rows, { bom: true })], { type: "text/csv;charset=utf-8" }), "amounts-in-words.csv");
    track("download_clicked", { tool: "number-to-words", format: "csv", count: bulkResult.rows.length });
  };

  const setCustomField = (k: "symbol" | "maj1" | "maj2" | "min1" | "min2" | "digits", v: string) =>
    setCustom((c) => {
      if (k === "symbol") return { ...c, symbol: v };
      if (k === "digits") return { ...c, digits: Number(v) };
      if (k === "maj1") return { ...c, major: [v, c.major[1]] };
      if (k === "maj2") return { ...c, major: [c.major[0], v] };
      if (k === "min1") return { ...c, minor: [v, c.minor[1]] };
      return { ...c, minor: [c.minor[0], v] };
    });

  const settings = (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Convert as</FieldLabel>
          <Segmented
            label="Convert as"
            value={mode}
            onChange={setMode}
            options={[
              { value: "currency", label: "Currency" },
              { value: "number", label: "Number" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>Numbering system</FieldLabel>
          <Segmented
            label="Numbering system"
            value={system}
            onChange={setSystem}
            options={[
              { value: "indian", label: "Indian", hint: "lakh · crore" },
              { value: "international", label: "International", hint: "million · billion" },
            ]}
          />
        </div>
      </div>

      {mode === "currency" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="ntw-currency">Currency</FieldLabel>
            <select id="ntw-currency" value={code} onChange={(e) => pickCurrency(e.target.value)} className={clsx(inputClass, "cursor-pointer")}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.major[1]} &amp; {c.minor[1]}
                </option>
              ))}
              <option value="CUSTOM">Custom unit…</option>
            </select>
          </div>
          <div>
            <FieldLabel>Currency word</FieldLabel>
            <Segmented
              label="Currency word position"
              value={unitPosition}
              onChange={setUnitPosition}
              options={[
                { value: "before", label: `${currency.major[1] || "Unit"} …` },
                { value: "after", label: `… ${currency.major[1] || "Unit"}` },
              ]}
            />
          </div>
          {code === "CUSTOM" && (
            <fieldset className="grid gap-3 rounded-[12px] border border-line bg-ivory p-4 sm:col-span-2 sm:grid-cols-3">
              <legend className="px-1 text-sm font-medium">Custom currency</legend>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Main unit (one)</span>
                <input className={inputClass} value={custom.major[0]} onChange={(e) => setCustomField("maj1", e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Main unit (many)</span>
                <input className={inputClass} value={custom.major[1]} onChange={(e) => setCustomField("maj2", e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Symbol</span>
                <input className={inputClass} value={custom.symbol} maxLength={6} onChange={(e) => setCustomField("symbol", e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Sub-unit (one)</span>
                <input className={inputClass} value={custom.minor[0]} onChange={(e) => setCustomField("min1", e.target.value)} disabled={!custom.digits} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Sub-unit (many)</span>
                <input className={inputClass} value={custom.minor[1]} onChange={(e) => setCustomField("min2", e.target.value)} disabled={!custom.digits} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-ink-2">Decimal places</span>
                <select className={clsx(inputClass, "cursor-pointer")} value={custom.digits} onChange={(e) => setCustomField("digits", e.target.value)}>
                  <option value={0}>0 (no sub-unit)</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </label>
            </fieldset>
          )}
          {currency.digits > 0 && (
            <div className="sm:col-span-2">
              <FieldLabel>{currency.minor[1] || "Sub-units"} written as</FieldLabel>
              <Segmented
                label="Decimal part style"
                value={minorStyle}
                onChange={setMinorStyle}
                options={[
                  { value: "words", label: `Words (Fifty ${currency.minor[1]})` },
                  { value: "fraction", label: `Fraction (50/1${"0".repeat(currency.digits)})` },
                ]}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <FieldLabel>Letter case</FieldLabel>
        <Segmented
          label="Letter case"
          size="sm"
          value={caseStyle}
          onChange={setCaseStyle}
          options={[
            { value: "title", label: "Title Case" },
            { value: "sentence", label: "Sentence case" },
            { value: "upper", label: "UPPERCASE" },
          ]}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {mode === "currency" && <Toggle checked={only} onChange={setOnly} label="Add “Only”" description="Rupees Ten Only" />}
        <Toggle checked={and} onChange={setAnd} label="Use “and”" description="One Hundred and Five" />
        <Toggle checked={hyphens} onChange={setHyphens} label="Hyphenate" description="Twenty-Five" />
      </div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <Segmented
        label="Single or bulk conversion"
        className="w-full sm:w-[320px]"
        value={view}
        onChange={setView}
        options={[
          { value: "single", label: "Single amount" },
          { value: "bulk", label: "Bulk list" },
        ]}
      />

      {view === "single" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
          <Panel className="p-5 sm:p-7">
            <FieldLabel htmlFor="ntw-input" hint={mode === "currency" ? currency.code : undefined}>
              {mode === "currency" ? "Amount" : "Number"}
            </FieldLabel>
            <div className="relative">
              <input
                id="ntw-input"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="1,25,000.50"
                aria-describedby="ntw-help"
                aria-invalid={result.ok === false}
                className="h-16 w-full rounded-[12px] border border-line-strong bg-card px-4 pr-12 font-mono text-[1.6rem] tracking-tight outline-none transition-[border-color,box-shadow] placeholder:text-line-strong focus:border-charcoal focus:shadow-[0_0_0_4px_rgba(240,120,69,0.18)] sm:text-[1.8rem]"
              />
              {input && (
                <button type="button" onClick={() => setInput("")} aria-label="Clear input" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] text-ink-2 hover:bg-ivory-2 hover:text-charcoal">
                  <Eraser aria-hidden className="size-4" />
                </button>
              )}
            </div>
            <p id="ntw-help" className="mt-2 text-xs text-ink-2">
              Commas are optional (1,25,000 or 125,000). Use a dot for decimals. Negative numbers and up to 15 whole digits are supported.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Examples">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setInput(ex.value);
                    setMode(ex.mode);
                    if (ex.code) pickCurrency(ex.code);
                    else setSystem("international");
                  }}
                  className="rounded-full border border-line bg-ivory px-3 py-1 font-mono text-xs text-charcoal transition-colors hover:border-charcoal"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="mt-6 border-t border-line pt-6">{settings}</div>
          </Panel>

          <div aria-live="polite" className="flex flex-col rounded-[16px] bg-charcoal p-6 text-ivory sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
              <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> {mode === "currency" ? "Amount in words" : "Number in words"}
            </p>
            {result.ok === true ? (
              <>
                <p data-testid="ntw-words" className="mt-5 text-[clamp(1.3rem,1rem+1.2vw,1.85rem)] font-medium leading-snug [overflow-wrap:anywhere]">
                  {result.words}
                </p>
                <dl className="mt-6 grid gap-px overflow-hidden rounded-[12px] bg-ivory/10 sm:grid-cols-2">
                  <div className="bg-charcoal px-4 py-3">
                    <dt className="text-xs text-ivory/55">You entered</dt>
                    <dd className="mt-0.5 font-mono text-[0.95rem] [overflow-wrap:anywhere]">{input.trim()}</dd>
                  </div>
                  <div className="bg-charcoal px-4 py-3">
                    <dt className="text-xs text-ivory/55">{system === "indian" ? "Indian format" : "International format"}</dt>
                    <dd data-testid="ntw-formatted" className="mt-0.5 font-mono text-[0.95rem] [overflow-wrap:anywhere]">
                      {result.formatted}
                    </dd>
                  </div>
                </dl>
                {result.notes.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-sm text-ivory/75" data-testid="ntw-notes">
                    {result.notes.map((n) => (
                      <li key={n} className="flex gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-orange" /> {n}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2 pt-6">
                  <CopyButton text={() => result.words} label="Copy words" variant="primary" onCopied={() => track("copy_clicked", { tool: "number-to-words" })} />
                  <CopyButton text={() => `${result.formatted} — ${result.words}`} label="Copy with amount" className="!border-ivory/20 !bg-transparent !text-ivory hover:!border-ivory/60" />
                </div>
              </>
            ) : result.ok === false ? (
              <p className="mt-6 flex items-start gap-2.5 text-lg text-ivory/85" role="alert">
                <AlertCircle aria-hidden className="mt-1 size-5 shrink-0 text-orange" />
                {result.message}
              </p>
            ) : (
              <div className="mt-5">
                <p className="font-mono text-[clamp(2.2rem,1.6rem+2.5vw,3.4rem)] leading-none tracking-tight text-ivory/20">—</p>
                <p className="mt-4 text-ivory/60">Type a number or amount to see it written in words.</p>
              </div>
            )}
            {mode === "currency" && (
              <p className="mt-6 border-t border-ivory/10 pt-4 text-xs leading-relaxed text-ivory/50">
                Wording conventions differ between banks and countries — some expect “Only”, “and” or a fraction such as 50/100. Check your bank’s guidance before writing a cheque.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr] [&>*]:min-w-0">
          <Panel className="p-5 sm:p-7">
            <FieldLabel htmlFor="ntw-bulk" hint={`up to ${MAX_BULK_LINES.toLocaleString("en-US")} lines`}>
              Amounts — one per line
            </FieldLabel>
            <textarea
              id="ntw-bulk"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={"125000\n2,50,000.50\n99.99"}
              spellCheck={false}
              className="min-h-[220px] w-full resize-y rounded-[12px] border border-line-strong bg-card p-3.5 font-mono text-[0.92rem] leading-relaxed outline-none focus:border-charcoal focus:shadow-[0_0_0_3px_rgba(240,120,69,0.18)]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setBulk("125000\n250000.50\n15000000\n1234.56\n0.75\n100000000")} className="rounded-full border border-line bg-ivory px-3 py-1 text-xs hover:border-charcoal">
                Load example list
              </button>
              {bulk && (
                <button type="button" onClick={() => setBulk("")} className="rounded-full px-3 py-1 text-xs text-ink-2 hover:text-charcoal">
                  Clear
                </button>
              )}
            </div>
            <div className="mt-6 border-t border-line pt-6">{settings}</div>
          </Panel>
          <Panel className="flex min-w-0 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <p className="text-sm font-bold" aria-live="polite">
                {bulkResult ? `${bulkResult.rows.length} ${bulkResult.rows.length === 1 ? "amount" : "amounts"}${bulkResult.rows.some((r) => r.error) ? ` · ${bulkResult.rows.filter((r) => r.error).length} with errors` : ""}` : "Results"}
              </p>
              <div className="flex gap-1.5">
                <CopyButton text={() => bulkResult?.rows.map((r) => r.words || `ERROR: ${r.error}`).join("\n") ?? ""} label="Copy all" className="!h-9" />
                <button type="button" onClick={downloadBulk} disabled={!bulkResult?.rows.length} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-orange px-3 text-sm font-medium text-charcoal hover:bg-[#ec6a34] disabled:opacity-40">
                  <Download aria-hidden className="size-4" /> CSV
                </button>
              </div>
            </div>
            {bulkResult?.truncated && <p className="border-b border-line bg-[#fbf3e3] px-4 py-2 text-sm text-[#8a5a12]">Only the first {MAX_BULK_LINES.toLocaleString("en-US")} amounts were converted.</p>}
            <div className="max-h-[560px] flex-1 overflow-auto">
              {bulkResult?.rows.length ? (
                <table className="w-full border-collapse text-left text-sm" data-testid="ntw-bulk-table">
                  <thead className="sticky top-0 bg-ivory">
                    <tr>
                      <th scope="col" className="border-b border-line px-3 py-2 font-mono text-xs font-normal text-ink-3">#</th>
                      <th scope="col" className="border-b border-line px-3 py-2 text-xs font-medium">Amount</th>
                      <th scope="col" className="border-b border-line px-3 py-2 text-xs font-medium">In words</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkResult.rows.slice(0, BULK_PREVIEW).map((r) => (
                      <tr key={r.line} className="border-b border-line align-top last:border-0">
                        <td className="px-3 py-2 font-mono text-xs text-ink-3">{r.line}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.formatted || r.input}</td>
                        <td className={clsx("px-3 py-2", r.error && "text-[#8f2f27]")}>
                          {r.error ? (
                            <span className="flex gap-1.5">
                              <AlertCircle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                              <span>
                                <span className="sr-only">Error: </span>
                                {r.error}
                              </span>
                            </span>
                          ) : (
                            r.words
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-sm text-ink-2">Paste a list of numbers or amounts, one per line. Results appear here and can be downloaded as CSV.</p>
              )}
              {bulkResult && bulkResult.rows.length > BULK_PREVIEW && <p className="border-t border-line px-4 py-2 text-xs text-ink-2">Showing the first {BULK_PREVIEW} rows — the CSV contains all {bulkResult.rows.length}.</p>}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
