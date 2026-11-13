import Link from "@/components/ui/Link";
import { ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { ToolIcon } from "./ToolIcon";
import { getCategory, toolPath, type Tool } from "@/lib/tools";

export function ToolCard({
  tool,
  index,
  feature = false,
  className,
  headingLevel = "h3",
}: {
  tool: Tool;
  index?: number;
  feature?: boolean;
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  return (
    <Link
      href={toolPath(tool.slug)}
      className={clsx(
        "group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-card p-6 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_22px_50px_-30px_rgba(37,37,37,0.4)] sm:p-7",
        className,
      )}
    >
      {feature && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden sm:block">
          <div className="dotgrid absolute inset-y-0 right-0 w-3/5 opacity-70 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
          <ToolIcon
            name={tool.icon}
            strokeWidth={0.6}
            className="absolute right-[10%] top-[16%] size-44 text-line-strong transition-[color,transform] duration-500 ease-[var(--ease-out)] group-hover:-rotate-3 group-hover:text-orange/50"
          />
        </div>
      )}
      <div className="relative flex items-start justify-between">
        <span
          className={clsx(
            "grid place-items-center rounded-[12px] border border-line bg-ivory text-charcoal transition-colors duration-300 group-hover:border-orange group-hover:bg-orange-wash group-hover:text-orange-ink",
            feature ? "size-14" : "size-12",
          )}
        >
          <ToolIcon name={tool.icon} className={feature ? "size-6" : "size-[22px]"} />
        </span>
        <span className="flex items-center gap-3">
          <span className="text-[0.72rem] font-medium uppercase tracking-[0.12em] text-ink-2">
            {getCategory(tool.category).name.replace(" Tools", "")}
          </span>
          {index !== undefined && <span className="font-mono text-xs text-ink-3">{String(index + 1).padStart(2, "0")}</span>}
        </span>
      </div>
      <div className={clsx("relative mt-auto", feature ? "pt-16 sm:pt-24" : "pt-10")}>
        <H
          className={clsx(
            "font-display font-semibold tracking-[-0.02em] text-charcoal",
            feature ? "text-[2rem] leading-[1.05] sm:text-[2.6rem]" : "text-[1.55rem] leading-tight",
          )}
        >
          {tool.name}
        </H>
        <p className={clsx("mt-2 text-ink-2", feature ? "max-w-md text-[1.02rem]" : "text-[0.95rem]")}>{tool.short}</p>
        <div className="mt-6 flex items-center justify-between">
          <span className="flex flex-wrap gap-1.5">
            {tool.formats.slice(0, 4).map((f) => (
              <span key={f} className="rounded-[6px] border border-line bg-ivory px-1.5 py-0.5 font-mono text-[0.68rem] text-ink-2">
                {f}
              </span>
            ))}
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-charcoal transition-all duration-300 group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-ivory">
            <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}
