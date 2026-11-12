"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { CopyButton, FieldLabel, Notice, Panel, Range, Segmented, Toggle } from "./ui";
import {
  charsetsFor,
  crackTime,
  entropyBits,
  generatePassword,
  poolSize,
  strengthLabel,
  type PasswordOptions,
} from "@/lib/password";
import { track } from "@/lib/analytics";

const levelColors = ["bg-error", "bg-error", "bg-[#d99a3c]", "bg-success", "bg-success"];

/** Colour-codes characters so passwords are easier to read and transcribe. */
function Colored({ value }: { value: string }) {
  return (
    <>
      {[...value].map((ch, i) => (
        <span
          key={i}
          className={clsx(/[0-9]/.test(ch) ? "text-orange-ink" : /[A-Za-z]/.test(ch) ? "text-charcoal" : "text-[#3d6f9e]")}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function PasswordGenerator() {
  const [opts, setOpts] = useState<PasswordOptions>({
    length: 20,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [count, setCount] = useState("1");
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState(0);

  const pool = poolSize(opts);
  const bits = entropyBits(opts.length, pool);
  const strength = strengthLabel(bits);
  const noneSelected = charsetsFor(opts).length === 0;

  const regenerate = useCallback(
    (o: PasswordOptions, n: number, report = false) => {
      try {
        if (charsetsFor(o).length === 0) {
          setPasswords([]);
          return;
        }
        setPasswords(Array.from({ length: n }, () => generatePassword(o)));
        setError(null);
        setGen((g) => g + 1);
        // Only non-sensitive settings are reported — never the password.
        if (report) track("password_generated", { tool: "password-generator", count: n, length: o.length });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate a password.");
      }
    },
    [],
  );

  useEffect(() => {
    // Generating on the client only (never during SSR) keeps passwords out of the HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate(opts, Number(count));
  }, [opts, count, regenerate]);

  const set = <K extends keyof PasswordOptions>(k: K, v: PasswordOptions[K]) => setOpts((o) => ({ ...o, [k]: v }));
  const primary = passwords[0] ?? "";
  const many = passwords.length > 1;

  const stats = useMemo(
    () => [
      { label: "Entropy", value: `${Math.round(bits)} bits` },
      { label: "Character pool", value: String(pool) },
      { label: "Avg. time to crack*", value: bits ? crackTime(bits) : "—" },
    ],
    [bits, pool],
  );

  return (
    <div className="grid gap-4 [&>*]:min-w-0 lg:grid-cols-[1.35fr_1fr]">
      {/* Output */}
      <Panel className="flex flex-col overflow-hidden">
        <div className="flex-1 p-5 sm:p-7">
          {!many ? (
            <div>
              <p className="text-sm font-medium text-ink-2">Your password</p>
              <div className="mt-3 min-h-[5.5rem] rounded-[12px] border border-line bg-ivory px-4 py-5 sm:px-5">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${gen}-${primary}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="break-all font-mono text-[1.35rem] leading-snug tracking-wide sm:text-[1.6rem]"
                    aria-live="polite"
                    translate="no"
                    data-private
                  >
                    {primary ? <Colored value={primary} /> : <span className="text-ink-3">Select a character type</span>}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <CopyButton
                  text={() => primary}
                  variant="primary"
                  label="Copy password"
                  onCopied={() => track("copy_clicked", { tool: "password-generator" })}
                />
                <button
                  type="button"
                  onClick={() => regenerate(opts, Number(count), true)}
                  disabled={noneSelected}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3.5 text-sm font-medium transition-colors hover:border-charcoal disabled:opacity-40"
                >
                  <RefreshCw aria-hidden className="size-4" /> Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-2">{passwords.length} passwords</p>
                <button
                  type="button"
                  onClick={() => regenerate(opts, Number(count), true)}
                  className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-card px-3 text-sm font-medium hover:border-charcoal"
                >
                  <RefreshCw aria-hidden className="size-4" /> Regenerate all
                </button>
              </div>
              <ul className="mt-3 max-h-[420px] divide-y divide-line overflow-y-auto rounded-[12px] border border-line bg-ivory">
                {passwords.map((p, i) => (
                  <li key={`${gen}-${i}`} className="flex items-center gap-3 px-3 py-2 sm:px-4">
                    <span className="w-5 shrink-0 font-mono text-xs text-ink-3">{i + 1}</span>
                    <span className="min-w-0 flex-1 break-all font-mono text-[0.95rem]" translate="no" data-private>
                      <Colored value={p} />
                    </span>
                    <CopyButton
                      iconOnly
                      text={() => p}
                      label={`Copy password ${i + 1}`}
                      onCopied={() => track("copy_clicked", { tool: "password-generator" })}
                    />
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <CopyButton
                  text={() => passwords.join("\n")}
                  label="Copy all"
                  onCopied={() => track("copy_clicked", { tool: "password-generator", count: passwords.length })}
                />
              </div>
            </div>
          )}
          {!many && (
            <ul className="mt-8 grid gap-2.5 border-t border-dashed border-line-strong pt-6 text-sm text-ink-2">
              {[
                "Save it in a password manager right away — this page keeps nothing.",
                "Use a different password for every account.",
                "Turn on two-factor authentication wherever it’s offered.",
              ].map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-[2px] bg-orange" />
                  {tip}
                </li>
              ))}
            </ul>
          )}
          {error && (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          )}
        </div>

        {/* Strength */}
        <div className="border-t border-line bg-ivory/60 p-5 sm:px-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Strength: <span className="font-bold">{noneSelected ? "—" : strength.label}</span>
            </p>
            <p className="font-mono text-xs text-ink-2">{opts.length} chars</p>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={clsx(
                  "h-1.5 rounded-full transition-colors duration-300",
                  !noneSelected && i <= strength.level ? levelColors[strength.level] : "bg-line",
                )}
              />
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-ink-2">{s.label}</dt>
                <dd className="mt-0.5 font-mono text-[0.85rem] text-charcoal">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-ink-2">
            *Average, assuming an attacker making a trillion guesses per second and knowing your settings.
          </p>
        </div>
      </Panel>

      {/* Controls */}
      <Panel className="p-5 sm:p-7">
        <FieldLabel htmlFor="pw-length" hint={`${opts.length}`}>
          Length
        </FieldLabel>
        <div className="flex items-center gap-3">
          <Range id="pw-length" min={6} max={128} value={opts.length} onChange={(v) => set("length", v)} />
          <input
            type="number"
            min={6}
            max={128}
            aria-label="Password length"
            value={opts.length}
            onChange={(e) => {
              const v = Math.round(Number(e.target.value));
              if (Number.isFinite(v)) set("length", Math.min(128, Math.max(6, v)));
            }}
            className="h-10 w-[4.5rem] rounded-[10px] border border-line-strong bg-card px-2 text-center font-mono text-sm outline-none focus:border-charcoal"
          />
        </div>
        <div className="mt-2 flex gap-1.5">
          {[12, 16, 20, 32].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("length", n)}
              className={clsx(
                "rounded-[8px] border px-2.5 py-1 font-mono text-xs transition-colors",
                opts.length === n ? "border-charcoal bg-charcoal text-ivory" : "border-line text-ink-2 hover:border-charcoal hover:text-charcoal",
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-2">
          <Toggle checked={opts.upper} onChange={(v) => set("upper", v)} label="Uppercase" description="A–Z" />
          <Toggle checked={opts.lower} onChange={(v) => set("lower", v)} label="Lowercase" description="a–z" />
          <Toggle checked={opts.numbers} onChange={(v) => set("numbers", v)} label="Numbers" description="0–9" />
          <Toggle checked={opts.symbols} onChange={(v) => set("symbols", v)} label="Symbols" description="!@#$%^&*()-_=+[]{};:,.<>?/~" />
          <Toggle
            checked={opts.excludeAmbiguous}
            onChange={(v) => set("excludeAmbiguous", v)}
            label="Exclude ambiguous"
            description="I l 1 | O 0 o ` ' &quot;"
          />
        </div>
        {noneSelected && (
          <div className="mt-3">
            <Notice tone="error">Select at least one character type.</Notice>
          </div>
        )}

        <div className="mt-7">
          <FieldLabel>How many</FieldLabel>
          <Segmented
            label="Number of passwords"
            value={count}
            onChange={(v) => {
              setCount(v);
              track("password_generated", { tool: "password-generator", count: Number(v), length: opts.length });
            }}
            options={["1", "5", "10", "20"].map((v) => ({ value: v, label: <span className="font-mono">{v}</span> }))}
          />
        </div>
      </Panel>
    </div>
  );
}
