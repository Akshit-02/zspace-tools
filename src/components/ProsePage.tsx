import { Container, Eyebrow } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";
import { JsonLd } from "./JsonLd";
import { breadcrumbLd, graph, webPageLd } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export function ProsePage({
  path,
  eyebrow,
  title,
  intro,
  updated,
  description,
  type,
  children,
}: {
  path: string;
  eyebrow: string;
  title: string;
  intro?: string;
  updated?: string;
  description: string;
  type?: string;
  children: React.ReactNode;
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: eyebrow, path },
  ];
  return (
    <>
      <JsonLd data={graph(webPageLd({ path, name: title, description, type }), breadcrumbLd(crumbs))} />
      <Container className="pt-8 sm:pt-10">
        <Breadcrumbs items={crumbs} />
        <div className="mx-auto mt-12 max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 font-display text-h1 font-semibold">{title}</h1>
          {intro && <p className="mt-5 text-xl leading-relaxed text-ink-2">{intro}</p>}
          {updated && <p className="mt-5 font-mono text-xs text-ink-2">Last updated {formatDate(updated)}</p>}
          <div className="prose-z mt-12">{children}</div>
        </div>
      </Container>
    </>
  );
}
