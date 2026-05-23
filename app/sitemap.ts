import { MetadataRoute } from "next";

const tools = [
  "age-calculator",
  "bmi-calculator",
  "break-even",
  "compound-interest",
  "emi-calculator",
  "gratuity-calculator",
  "gst-calculator",
  "income-tax-calculator",
  "markup-calculator",
  "percentage-calculator",
  "pf-calculator",
  "profit-margin",
  "roi-calculator",
  "unit-converter",
  "word-counter",
  "hra-calculator",
  "home-loan-emi",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tools.zspace.in";
  const now = new Date();

  const staticPages = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${base}/tools`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];

  const toolPages = tools.map((tool) => ({
    url: `${base}/tools/${tool}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...toolPages];
}
