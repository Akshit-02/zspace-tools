import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, Eyebrow } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { posts } from "@/content/blog";
import { getTool } from "@/lib/tools";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { breadcrumbLd, graph, pageMetadata, webPageLd } from "@/lib/seo";

const description = "Practical, no-nonsense guides to compressing images and PDFs, making QR codes, counting words and creating strong passwords.";

export const metadata: Metadata = pageMetadata({ title: "Guides & Tutorials", description, path: "/blog/" });

export default function BlogIndex() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog/" },
  ];
  const [lead, ...rest] = posts;
  return (
    <>
      <JsonLd
        data={graph(webPageLd({ path: "/blog/", name: "ZSpace Tools Blog", description, type: "CollectionPage" }), breadcrumbLd(crumbs), {
          "@type": "ItemList",
          itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/blog/${p.slug}/`), name: p.title })),
        })}
      />
      <Container className="pt-8 sm:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 max-w-3xl">
          <Eyebrow>Blog</Eyebrow>
          <h1 className="mt-4 font-display text-h1 font-semibold">Guides for getting everyday things done.</h1>
          <p className="mt-5 text-lg text-ink-2">{description}</p>
        </div>

        <Link href={`/blog/${lead.slug}/`} className="group mt-14 grid overflow-hidden rounded-[16px] border border-line bg-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_24px_60px_-36px_rgba(37,37,37,0.5)] lg:grid-cols-[1fr_1.1fr]">
          <div className="dotgrid relative flex min-h-[220px] items-end bg-ivory-2 p-8">
            <span className="font-display text-[clamp(4rem,10vw,8rem)] font-semibold leading-none tracking-[-0.04em] text-charcoal/10">01</span>
            <span className="absolute left-8 top-8 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium">Latest guide</span>
          </div>
          <div className="flex flex-col p-8 sm:p-10">
            <p className="font-mono text-xs text-ink-2">{formatDate(lead.published)}</p>
            <h2 className="mt-3 font-display text-[clamp(1.6rem,1.3rem+1.2vw,2.3rem)] font-semibold leading-tight tracking-[-0.02em] group-hover:text-orange-ink">{lead.title}</h2>
            <p className="mt-3 text-ink-2">{lead.excerpt}</p>
            <p className="mt-auto flex items-center gap-2 pt-8 text-sm font-medium">
              Read the guide <ArrowUpRight aria-hidden className="size-4 transition-transform group-hover:rotate-45" />
            </p>
          </div>
        </Link>

        <ul className="mt-6 grid gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-2">
          {rest.map((p, i) => {
            const tool = getTool(p.tools[0]);
            return (
              <li key={p.slug} className="bg-card">
                <Link href={`/blog/${p.slug}/`} className="group flex h-full flex-col p-7 transition-colors hover:bg-ivory sm:p-8">
                  <div className="flex items-center justify-between font-mono text-xs text-ink-2">
                    <span>{String(i + 2).padStart(2, "0")}</span>
                    {tool && <span className="font-sans">{tool.name}</span>}
                  </div>
                  <h2 className="mt-6 font-display text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] group-hover:text-orange-ink">{p.title}</h2>
                  <p className="mt-2 text-[0.97rem] text-ink-2">{p.excerpt}</p>
                  <p className="mt-auto pt-6 font-mono text-xs text-ink-2">{formatDate(p.published)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </>
  );
}
