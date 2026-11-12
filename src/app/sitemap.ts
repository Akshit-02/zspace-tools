import type { MetadataRoute } from "next";
import { absoluteUrl, site } from "@/lib/site";
import { tools } from "@/lib/tools";
import { posts } from "@/content/blog";

// lastModified only where a real content date exists.
export default function sitemap(): MetadataRoute.Sitemap {
  const latestTool = tools.map((t) => t.updated).sort().at(-1) ?? site.launched;
  const latestPost = posts.map((p) => p.updated).sort().at(-1) ?? site.launched;

  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latestTool, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/all-tools/"), lastModified: latestTool, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/blog/"), lastModified: latestPost, changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/about/"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact/"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy-policy/"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms-and-conditions/"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/disclaimer/"), changeFrequency: "yearly", priority: 0.2 },
  ];

  return [
    ...pages,
    ...tools.map((t) => ({
      url: absoluteUrl(`/${t.slug}/`),
      lastModified: t.updated,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}/`),
      lastModified: p.updated,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
