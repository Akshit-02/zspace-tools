import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCard } from "@/components/ToolCard";
import { ToolIcon } from "@/components/ToolIcon";
import { JsonLd } from "@/components/JsonLd";
import { categories, plannedTools, tools, toolsInCategory } from "@/lib/tools";
import { absoluteUrl } from "@/lib/site";
import { breadcrumbLd, graph, pageMetadata, webPageLd } from "@/lib/seo";

const description =
  "Browse every free ZSpace tool: image compressor, PDF compressor, QR code generator, word counter and password generator. All run in your browser.";

export const metadata: Metadata = pageMetadata({ title: "All Tools — Free Online Utilities", description, path: "/all-tools/" });

export default function AllToolsPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "All Tools", path: "/all-tools/" },
  ];
  return (
    <>
      <JsonLd
        data={graph(webPageLd({ path: "/all-tools/", name: "All Tools", description, type: "CollectionPage" }), breadcrumbLd(crumbs), {
          "@type": "ItemList",
          itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: absoluteUrl(`/${t.slug}/`) })),
        })}
      />
      <Container className="pt-8 sm:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <Eyebrow>Directory</Eyebrow>
            <h1 className="mt-4 font-display text-h1 font-semibold">All tools</h1>
            <p className="mt-5 text-lg text-ink-2">{description}</p>
          </div>
          <p className="font-mono text-sm text-ink-2">
            {tools.length} live · {plannedTools.length} planned
          </p>
        </div>

        <nav id="categories" aria-label="Categories" className="mt-10 scroll-mt-24">
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const n = toolsInCategory(c.id).length;
              return (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${n ? "border-line-strong bg-card hover:border-charcoal" : "border-dashed border-line-strong text-ink-2 hover:text-charcoal"}`}
                  >
                    <ToolIcon name={c.icon} className="size-4" />
                    {c.name}
                    <span className="font-mono text-xs text-ink-2">{n}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-14 space-y-16">
          {categories.map((c) => {
            const list = toolsInCategory(c.id);
            const planned = plannedTools.filter((p) => p.category === c.id);
            return (
              <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="scroll-mt-24 border-t border-line pt-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 id={`${c.id}-h`} className="font-display text-2xl font-semibold tracking-[-0.01em] sm:text-3xl">
                    {c.name}
                  </h2>
                  <p className="text-ink-2">{c.description}</p>
                </div>
                {list.length > 0 && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {list.map((t) => (
                      <ToolCard key={t.slug} tool={t} />
                    ))}
                  </div>
                )}
                {planned.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-2">Coming soon</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {planned.map((p) => (
                        <li key={p.name} className="rounded-[10px] border border-dashed border-line-strong px-3 py-1.5 text-sm text-ink-2">
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
