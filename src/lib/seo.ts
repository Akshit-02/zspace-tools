import type { Metadata } from "next";
import { site, absoluteUrl } from "./site";
import type { Tool } from "./tools";
import type { Post } from "./blog-types";

export const ORG_ID = `${site.url}/#organization`;
export const WEBSITE_ID = `${site.url}/#website`;

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Use the title as-is (no " | ZSpace Tools" suffix). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
};

export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const fullTitle = input.absoluteTitle ? input.title : `${input.title} | ${site.name}`;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: site.name,
      title: fullTitle,
      description: input.description,
      locale: "en_US",
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: input.description,
    },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationLd() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: site.name,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl("/icon"), width: 512, height: 512 },
    slogan: site.tagline,
    description: site.description,
    email: site.contactEmail,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: site.contactEmail },
  };
}

export function websiteLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: site.name,
    description: site.shortDescription,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageLd(opts: { path: string; name: string; description: string; type?: string }) {
  return {
    "@type": opts.type ?? "WebPage",
    "@id": `${absoluteUrl(opts.path)}#webpage`,
    url: absoluteUrl(opts.path),
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": WEBSITE_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** WebApplication (a SoftwareApplication subtype). Free offer; no ratings. */
export function toolAppLd(tool: Tool) {
  return {
    "@type": "WebApplication",
    "@id": `${absoluteUrl(`/${tool.slug}/`)}#app`,
    name: tool.name,
    url: absoluteUrl(`/${tool.slug}/`),
    description: tool.what,
    applicationCategory: tool.category === "image" ? "MultimediaApplication" : "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript and a modern browser.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: tool.features.map((f) => f.title),
    publisher: { "@id": ORG_ID },
  };
}

export function howToLd(tool: Tool) {
  return {
    "@type": "HowTo",
    name: `How to use the ${tool.name}`,
    description: tool.intro,
    tool: { "@type": "HowToTool", name: `${site.name} ${tool.name}` },
    step: tool.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
      url: `${absoluteUrl(`/${tool.slug}/`)}#how-to-use`,
    })),
  };
}

export function articleLd(post: Post) {
  const url = absoluteUrl(`/blog/${post.slug}/`);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    datePublished: post.published,
    dateModified: post.updated,
    inLanguage: "en",
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: `${url}opengraph-image/`,
    keywords: post.keyword,
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
