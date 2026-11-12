import { clsx } from "clsx";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={clsx("flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ink-2", className)}>
      <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" />
      {children}
    </p>
  );
}
