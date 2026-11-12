import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Container, Eyebrow } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Accordion } from "@/components/Accordion";
import { ToolCard } from "@/components/ToolCard";
import { ToolIcon } from "@/components/ToolIcon";
import { JsonLd } from "@/components/JsonLd";
import { ToolRenderer } from "@/components/tools/registry";
import { getCategory, getTool, relatedTools, toolSlugs } from "@/lib/tools";
import { posts } from "@/content/blog";
import { breadcrumbLd, faqLd, graph, howToLd, pageMetadata, toolAppLd, webPageLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return toolSlugs.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: PageProps<"/[tool]">): Promise<Metadata> {
  const tool = getTool((await params).tool);
  if (!tool) return {};
  return pageMetadata({
    title: tool.seo.title,
    description: tool.seo.description,
    path: `/${tool.slug}/`,
    absoluteTitle: true,
  });
}

export default async function ToolPage({ params }: PageProps<"/[tool]">) {
  const tool = getTool((await params).tool);
  if (!tool) notFound();

  const category = getCategory(tool.category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All Tools", path: "/all-tools/" },
    { name: tool.name, path: `/${tool.slug}/` },
  ];
  const guides = posts.filter((p) => p.tools.includes(tool.slug));
  const faqs = [
    { q: `What is the ${tool.name}?`, a: tool.what },
    { q: `How does the ${tool.name} work?`, a: tool.how },
    ...tool.faqs,
  ];

  return (
    <>
      <JsonLd
        data={graph(
          webPageLd({ path: `/${tool.slug}/`, name: tool.seo.title, description: tool.seo.description }),
          breadcrumbLd(crumbs),
          toolAppLd(tool),
          howToLd(tool),
          faqLd(faqs),
        )}
      />

      {/* Header + tool — the tool sits directly under a short intro. */}
      <section className="border-b border-line">
        <Container className="pb-14 pt-8 sm:pt-10">
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <span className="grid size-7 place-items-center rounded-[8px] bg-charcoal text-ivory">
                  <ToolIcon name={tool.icon} className="size-4" />
                </span>
                {category.name}
              </p>
              <h1 className="mt-4 font-display text-tool font-semibold">{tool.name}</h1>
              <p className="mt-4 max-w-2xl text-lg text-ink-2">{tool.intro}</p>
            </div>
            <p className="flex items-center gap-2 self-start rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-charcoal lg:self-end">
              <ShieldCheck aria-hidden className="size-4 text-success" />
              Runs in your browser
            </p>
          </div>
          <div className="mt-10">
            <ToolRenderer slug={tool.slug} />
          </div>
        </Container>
      </section>

      {/* Supporting content */}
      <Container className="py-20">
        <section aria-labelledby="features">
          <Eyebrow>Features</Eyebrow>
          <h2 id="features" className="mt-4 font-display text-h2 font-semibold">
            What you get
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {tool.features.map((f) => (
              <li key={f.title} className="bg-card p-6 sm:p-7">
                <span aria-hidden className="block h-0.5 w-6 rounded-full bg-orange" />
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-[0.97rem] text-ink-2">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-to-use" className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>How to use</Eyebrow>
            <h2 id="how-to-use" className="mt-4 scroll-mt-24 font-display text-h2 font-semibold">
              How to use the {tool.name}
            </h2>
            <p className="mt-4 text-ink-2">{tool.how}</p>
          </div>
          <ol className="space-y-3">
            {tool.steps.map((s, i) => (
              <li key={s.title} className="flex gap-5 rounded-[14px] border border-line bg-card p-6">
                <span className="font-mono text-sm text-orange-ink">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-ink-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-24 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="specs" className="rounded-[14px] border border-line bg-card p-6 sm:p-8">
            <h2 id="specs" className="font-display text-2xl font-semibold">
              Technical specifications
            </h2>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {tool.specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 py-3">
                  <dt className="text-sm text-ink-2">{s.label}</dt>
                  <dd className="font-mono text-[0.82rem] text-charcoal">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="privacy" className="flex flex-col rounded-[14px] bg-charcoal p-6 text-ivory sm:p-8">
            <ShieldCheck aria-hidden className="size-7 text-orange" strokeWidth={1.6} />
            <h2 id="privacy" className="mt-5 font-display text-2xl font-semibold">
              Privacy
            </h2>
            <p className="mt-3 text-ivory/75">{tool.privacy}</p>
            <p className="mt-auto pt-8 text-sm text-ivory/55">
              Read the full{" "}
              <Link href="/privacy-policy/" className="text-ivory underline decoration-orange underline-offset-4">
                privacy policy
              </Link>
              .
            </p>
          </section>
        </div>

        <section aria-labelledby="faq" className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 id="faq" className="mt-4 font-display text-h2 font-semibold">
              {tool.name} questions
            </h2>
            {guides.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-medium text-ink-2">Related guide</p>
                {guides.slice(0, 2).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/blog/${g.slug}/`}
                    className="mt-2 block font-medium text-charcoal underline decoration-orange decoration-2 underline-offset-4 hover:text-orange-ink"
                  >
                    {g.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Accordion items={faqs} />
        </section>

        <section aria-labelledby="related" className="mt-24">
          <h2 id="related" className="font-display text-h2 font-semibold">
            Related tools
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {relatedTools(tool).map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}
