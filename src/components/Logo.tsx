import Link from "next/link";
import { clsx } from "clsx";

/**
 * The Z mark: a charcoal tile with a Z built from two horizontal bars and an
 * orange diagonal — the "space" between the bars is the brand idea.
 */
export function ZMark({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
    >
      <rect width="32" height="32" rx="9" fill="#252525" />
      <rect x="8" y="8" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
      <rect x="8" y="20.6" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
      <path d="M22.4 11.4 9.6 20.6" stroke="#F07845" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={clsx("group inline-flex items-center gap-2.5", className)}
      aria-label="ZSpace Tools — home"
    >
      <ZMark className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:-rotate-6" />
      <span className="font-display text-[1.32rem] font-semibold leading-none tracking-[-0.02em] text-charcoal">
        zspace<span className="font-medium text-ink-2"> tools</span>
      </span>
    </Link>
  );
}
