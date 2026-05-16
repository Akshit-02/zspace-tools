import { MetadataRoute } from 'next';

const tools = [
  'gst-calculator',
  'income-tax-calculator',
  'emi-calculator',
  'compound-interest',
  'profit-margin',
  'percentage-calculator',
  'word-counter',
  'unit-converter',
  'age-calculator',
  'bmi-calculator',
  'hra-calculator',
  'markup-calculator',
  'break-even',
  'roi-calculator',
  'gratuity-calculator',
  'pf-calculator',
  'home-loan-emi',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://tools.zspace.in';
  const now = new Date();

  const staticPages = [
    { url: base, lastModified: now, changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${base}/tools`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  const toolPages = tools.map((tool) => ({
    url: `${base}/tools/${tool}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...toolPages];
}
