import Link from "@/components/ui/Link";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[12px] font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-[var(--ease-out)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange text-charcoal shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] hover:bg-[#ec6a34] hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.12),0_6px_18px_-8px_rgba(240,120,69,0.8)]",
  dark: "bg-charcoal text-ivory hover:bg-black",
  secondary: "border border-line-strong bg-card text-charcoal hover:border-charcoal",
  ghost: "text-charcoal hover:bg-ivory-2",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
