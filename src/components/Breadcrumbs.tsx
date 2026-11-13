import Link from "@/components/ui/Link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-charcoal">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="transition-colors hover:text-charcoal">
                    {item.name}
                  </Link>
                  <ChevronRight aria-hidden className="size-3.5 text-ink-3" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
