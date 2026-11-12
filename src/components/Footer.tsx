import Link from "next/link";
import { ZMark } from "./Logo";
import { site, legalNav } from "@/lib/site";
import { categories, getTool, tools, toolPath, toolsInCategory, type Tool } from "@/lib/tools";
import { footerSlugs } from "@/lib/home";

export function Footer() {
  const liveCategories = categories.filter((c) => toolsInCategory(c.id).length > 0);
  return (
    <footer className="mt-24 border-t border-line bg-ivory-2/60">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ZSpace Tools — home">
              <ZMark size={36} />
              <span className="font-display text-2xl font-semibold tracking-[-0.02em]">
                zspace<span className="font-medium text-ink-2"> tools</span>
              </span>
            </Link>
            <p className="mt-5 text-ink-2">{site.tagline} Free online tools that run in your browser — no sign-up, no clutter.</p>
            <p className="mt-6 text-sm text-ink-2">
              Questions or ideas?{" "}
              <a href={`mailto:${site.contactEmail}`} className="font-medium text-charcoal underline decoration-orange decoration-2 underline-offset-4">
                {site.contactEmail}
              </a>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <FooterCol
              title="Tools"
              links={[
                ...footerSlugs.map(getTool).filter((t): t is Tool => Boolean(t)).map((t) => ({ label: t.name, href: toolPath(t.slug) })),
                { label: `All ${tools.length} tools →`, href: "/all-tools/" },
              ]}
            />
            <FooterCol
              title="Categories"
              links={[
                ...liveCategories.map((c) => ({ label: c.name, href: `/all-tools/#${c.id}` })),
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "About", href: "/about/" },
                { label: "Blog", href: "/blog/" },
                { label: "Contact", href: "/contact/" },
              ]}
            />
            <FooterCol title="Legal" links={[...legalNav]} />
          </div>
        </div>
        <div aria-hidden className="mt-16 select-none overflow-hidden">
          <p className="translate-y-[18%] whitespace-nowrap font-display text-[clamp(4rem,15vw,13.5rem)] font-semibold leading-[0.8] tracking-[-0.045em] text-charcoal/[0.06]">
            less effort<span className="text-orange/40">.</span>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-2 px-4 py-5 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>© {site.launched.slice(0, 4)} {site.name}. All rights reserved.</p>
          <p className="font-mono text-xs">Files processed on your device · No sign-up</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-2">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[0.95rem] text-charcoal/85 transition-colors hover:text-orange-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
