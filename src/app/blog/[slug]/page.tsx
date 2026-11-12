import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleBody } from "@/components/ArticleBody";
import { Accordion } from "@/components/Accordion";
import { ToolCard } from "@/components/ToolCard";
import { JsonLd } from "@/components/JsonLd";
import { getPost, posts } from "@/content/blog";
import { getTool, type Tool } from "@/lib/tools";
import { formatDate } from "@/lib/format";
import { articleLd, breadcrumbLd, faqLd, graph, pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}/`,
    type: "article",
    publishedTime: post.published,
    modifiedTime: post.updated,
  });
}

function readingMinutes(blocks: { type: string; text?: string; items?: string[]; rows?: string[][] }[]) {
  const words = blocks
    .flatMap((b) => [b.text ?? "", ...(b.items ?? []), ...(b.rows?.flat() ?? [])])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 238));
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog/" },
    { name: post.title, path: `/blog/${post.slug}/` },
  ];
  const toc = post.body.filter((b): b is Extract<typeof b, { type: "h2" }> => b.type === "h2");
  const tools = post.tools.map(getTool).filter((t): t is Tool => Boolean(t));
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={graph(articleLd(post), breadcrumbLd(crumbs), ...(post.faqs?.length ? [faqLd(post.faqs)] : []))} />
      <article>
        <Container className="pt-8 sm:pt-10">
          <Breadcrumbs items={crumbs} />
          <header className="mx-auto mt-12 max-w-[46rem]">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-2">
              <time dateTime={post.published}>{formatDate(post.published)}</time>
              {post.updated !== post.published && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>{readingMinutes(post.body)} min read</span>
            </p>
            <h1 className="mt-5 font-display text-h1 font-semibold">{post.title}</h1>
            <p className="mt-5 text-xl leading-relaxed text-ink-2">{post.excerpt}</p>
          </header>
        </Container>

        <Container className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,46rem)_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-28">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-2">On this page</p>
              <ol className="mt-4 space-y-2.5 border-l border-line">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm leading-snug text-ink-2 transition-colors hover:border-orange hover:text-charcoal">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
          <div className="min-w-0">
            <ArticleBody blocks={post.body} />
            {post.faqs && post.faqs.length > 0 && (
              <section aria-labelledby="article-faq" className="mt-16">
                <h2 id="article-faq" className="mb-6 font-display text-[clamp(1.6rem,1.3rem+1vw,2.1rem)] font-semibold tracking-[-0.02em]">
                  Frequently asked questions
                </h2>
                <Accordion items={post.faqs} defaultOpen={null} />
              </section>
            )}
          </div>
          <div className="hidden lg:block" />
        </Container>
      </article>

      <Container className="mt-24">
        <h2 className="font-display text-h2 font-semibold">Tools from this guide</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
        <div className="mt-20 border-t border-line pt-10">
          <h2 className="font-display text-2xl font-semibold">More guides</h2>
          <ul className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}/`} className="font-medium leading-snug hover:text-orange-ink">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  );
}
