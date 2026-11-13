"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

/** Password input with show/hide. Never autocorrected, spell-checked or sent anywhere. */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  invalid,
  hint,
  id: idProp,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "new-password" | "current-password" | "off";
  invalid?: string | null;
  hint?: React.ReactNode;
  id?: string;
  autoFocus?: boolean;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className={clsx("flex items-center rounded-[10px] border bg-card focus-within:border-charcoal", invalid ? "border-error" : "border-line-strong")}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={127}
          autoFocus={autoFocus}
          aria-invalid={!!invalid}
          aria-describedby={invalid || hint ? `${id}-help` : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono text-[0.95rem] outline-none"
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="grid size-11 shrink-0 place-items-center text-ink-2 hover:text-charcoal">
          {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
      {(invalid || hint) && (
        <p id={`${id}-help`} className={clsx("mt-1 text-xs", invalid ? "text-error" : "text-ink-2")} role={invalid ? "alert" : undefined}>
          {invalid || hint}
        </p>
      )}
    </div>
  );
}
