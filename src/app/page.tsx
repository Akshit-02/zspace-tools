import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Gauge, LockKeyhole, MonitorSmartphone, MousePointerClick, UserRoundX } from "lucide-react";
import { Container, Eyebrow } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";
import { HeroHeadline } from "@/components/home/HeroHeadline";
import { HeroSearch } from "@/components/home/HeroSearch";
import { ErrandsCard } from "@/components/home/ErrandsCard";
import { ToolCard } from "@/components/ToolCard";
import { ToolIcon } from "@/components/ToolIcon";
import { Accordion } from "@/components/Accordion";
import { Reveal, Stagger, StaggerItem } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { categories, plannedTools, tools, toolsInCategory } from "@/lib/tools";
import { homeFaqs } from "@/lib/home";
import { faqLd, graph, pageMetadata, webPageLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "ZSpace Tools — Free Online Tools: Compress Images & PDFs, QR Codes, Passwords",
  description:
    "Free, simple online tools: compress images and PDFs, create QR codes, count words and generate strong passwords. Runs in your browser, no sign-up.",
  path: "/",
  absoluteTitle: true,
});

const why = [
  { icon: BadgeCheck, title: "Free to use", body: "Every tool is free. No trials, no watermarks, no daily caps." },
  { icon: UserRoundX, title: "No sign-up", body: "Open a tool and use it. There is no account to create." },
  { icon: MousePointerClick, title: "Simple interfaces", body: "One clear job per page, with sensible defaults already set." },
  { icon: Gauge, title: "Fast results", body: "Work happens on your device, so there is no upload queue to wait in." },
  {
    icon: LockKeyhole,
    title: "Private by design",
    body: "Files, text and passwords are processed in your browser and never uploaded to our servers.",
  },
  { icon: MonitorSmartphone, title: "Works everywhere", body: "Built for phones, tablets and desktops in every modern browser." },
];

const steps = [
  { title: "Choose your tool", body: "Search for what you need, or pick from the collection below." },
  { title: "Add your input", body: "Drop in a file, paste text or fill in a couple of fields." },
  { title: "Get your result", body: "Preview, copy or download. That is the whole process." },
];

export default function HomePage() {
  const [feature, second, ...rest] = tools;
  return (
    <>
      <JsonLd
        data={graph(
          webPageLd({ path: "/", name: site.name, description: site.description }),
          {
            "@type": "ItemList",
            name: "ZSpace Tools",
            itemListElement: tools.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.name,
              url: `${site.url}/${t.slug}/`,
            })),
          },
          faqLd(homeFaqs),
        )}
      />

      {/* ───────────── Hero ───────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="paper-rule pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <Container className="relative grid items-center gap-14 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <Eyebrow>Free online tools · No sign-up</Eyebrow>
            <div className="mt-6">
              <HeroHeadline />
            </div>
            <Reveal delay={0.25} y={10}>
              <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-2 sm:text-xl">
                Simple, useful online tools for everyday tasks. No complicated interfaces. Just get things done.
              </p>
            </Reveal>
            <Reveal delay={0.35} y={10} className="mt-9">
              <HeroSearch />
            </Reveal>
            <Reveal delay={0.45} y={10} className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/all-tools/" size="lg">
                Explore all tools <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink href="#popular" variant="secondary" size="lg">
                Browse popular tools
              </ButtonLink>
            </Reveal>
          </div>
          <div className="hidden lg:block">
            <ErrandsCard />
          </div>
        </Container>
      </section>

      {/* ───────────── Popular tools ───────────── */}
      <section id="popular" className="scroll-mt-20 py-20 sm:py-24">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>The collection</Eyebrow>
              <h2 className="mt-4 font-display text-h2 font-semibold">Popular tools</h2>
            </div>
            <p className="max-w-sm text-ink-2">
              Five tools, each built properly — with real results, honest numbers and nothing uploaded.
            </p>
          </div>
          <Stagger className="mt-12 grid gap-4 md:grid-cols-6 lg:grid-cols-12">
            <StaggerItem className="md:col-span-6 lg:col-span-7 lg:row-span-2">
              <ToolCard tool={feature} index={0} feature />
            </StaggerItem>
            <StaggerItem className="md:col-span-6 lg:col-span-5">
              <ToolCard tool={second} index={1} />
            </StaggerItem>
            <StaggerItem className="md:col-span-6 lg:col-span-5">
              <ToolCard tool={rest[0]} index={2} />
            </StaggerItem>
            {rest.slice(1).map((tool, i) => (
              <StaggerItem key={tool.slug} className="md:col-span-3 lg:col-span-6">
                <ToolCard tool={tool} index={i + 3} />
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* ───────────── Categories ───────────── */}
      <section id="categories" className="border-y border-line bg-ivory-2/50 py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>Categories</Eyebrow>
            <h2 className="mt-4 font-display text-h2 font-semibold">Find tools by what you&rsquo;re working on.</h2>
            <p className="mt-4 max-w-sm text-ink-2">
              New tools are added only when they work properly. {plannedTools.length} more are on the roadmap.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2">
            {categories.map((cat) => {
              const count = toolsInCategory(cat.id).length;
              const live = count > 0;
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        live
                          ? "grid size-10 place-items-center rounded-[10px] bg-charcoal text-ivory transition-colors group-hover:bg-orange group-hover:text-charcoal"
                          : "grid size-10 place-items-center rounded-[10px] border border-line text-ink-3"
                      }
                    >
                      <ToolIcon name={cat.icon} className="size-[18px]" />
                    </span>
                    {live ? (
                      <span className="font-mono text-xs text-ink-2">
                        {count} {count === 1 ? "tool" : "tools"}
                      </span>
                    ) : (
                      <span className="rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-xs text-ink-2">Coming soon</span>
                    )}
                  </div>
                  <h3 className={`mt-8 font-display text-[1.35rem] font-semibold tracking-[-0.01em] ${live ? "" : "text-ink-2"}`}>
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 pr-6 text-[0.95rem] text-ink-2">{cat.description}</p>
                  {live && (
                    <ArrowUpRight
                      aria-hidden
                      className="absolute right-6 bottom-6 size-4 text-ink-3 transition-all group-hover:text-charcoal group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  )}
                </>
              );
              return (
                <li key={cat.id} className="bg-card">
                  {live ? (
                    <Link href={`/all-tools/#${cat.id}`} className="group relative block h-full p-6 transition-colors hover:bg-ivory">
                      {inner}
                    </Link>
                  ) : (
                    <div className="relative h-full bg-[repeating-linear-gradient(135deg,transparent_0_10px,rgba(232,222,210,0.35)_10px_11px)] p-6">
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* ───────────── Why ───────────── */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow>Why ZSpace Tools</Eyebrow>
            <h2 className="mt-4 font-display text-h1 font-semibold">
              Useful tools. Without the <span className="text-ink-3 line-through decoration-orange decoration-[3px]">unnecessary</span> stuff.
            </h2>
          </div>
          <Stagger as="ul" className="mt-14 grid gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {why.map((item) => (
              <StaggerItem
                as="li"
                key={item.title}
                className="bg-ivory py-8 sm:p-8"
              >
                <item.icon aria-hidden strokeWidth={1.6} className="size-6 text-orange" />
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-1.5 text-ink-2">{item.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="pb-20 sm:pb-28">
        <Container>
          <div className="rounded-[18px] bg-charcoal px-6 py-14 text-ivory sm:px-12 sm:py-16">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="flex items-center gap-2 text-[0.8rem] font-medium uppercase tracking-[0.14em] text-ivory/60">
                  <span aria-hidden className="inline-block size-1.5 rounded-[2px] bg-orange" /> How it works
                </p>
                <h2 className="mt-4 font-display text-h2 font-semibold">Three steps. Usually under a minute.</h2>
              </div>
              <ButtonLink href="/all-tools/" size="lg" className="self-start md:self-auto">
                Pick a tool <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
            </div>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((s, i) => (
                <li key={s.title} className="relative">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-orange">{String(i + 1).padStart(2, "0")}</span>
                    <span aria-hidden className="h-px flex-1 bg-ivory/15" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-2 text-ivory/65">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="pb-8">
        <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-h2 font-semibold">Questions, answered.</h2>
            <p className="mt-4 max-w-sm text-ink-2">
              Something else on your mind?{" "}
              <Link href="/contact/" className="font-medium text-charcoal underline decoration-orange decoration-2 underline-offset-4">
                Get in touch
              </Link>
              .
            </p>
          </div>
          <Accordion items={homeFaqs} />
        </Container>
      </section>
    </>
  );
}
