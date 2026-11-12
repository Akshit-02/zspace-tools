import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Everything public is crawlable. Parameterised duplicates are handled by
// canonical tags rather than robots rules, because blocking "?" URLs would also
// block the hashed Open Graph image URLs that social crawlers fetch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
