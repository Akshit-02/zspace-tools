import Link from "@/components/ui/Link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ToolIcon } from "@/components/ToolIcon";
import { tools, toolPath } from "@/lib/tools";

export default function NotFound() {
  return (
    <Container className="py-20 sm:py-28">
      <p className="font-mono text-sm text-orange-ink">404</p>
      <h1 className="mt-4 max-w-2xl font-display text-h1 font-semibold">This page took the day off.</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-2">The link may be old or mistyped. Here are the tools people usually come for:</p>
      <ul className="mt-10 grid max-w-3xl gap-2 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.slug}>
            <Link href={toolPath(t.slug)} className="group flex items-center gap-3 rounded-[12px] border border-line bg-card px-4 py-3.5 transition-colors hover:border-charcoal">
              <ToolIcon name={t.icon} className="size-5 text-orange-ink" />
              <span className="flex-1 font-medium">{t.name}</span>
              <ArrowRight aria-hidden className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-charcoal" />
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink href="/" variant="dark" className="mt-10">
        Back to home
      </ButtonLink>
    </Container>
  );
}
