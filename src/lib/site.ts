// Single source of truth for brand + environment-driven settings.

const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tools.zspace.in";

export const site = {
  name: "ZSpace Tools",
  shortName: "ZSpace",
  url: rawUrl.replace(/\/+$/, ""),
  tagline: "Everyday tools. Made effortlessly simple.",
  heroTagline: "Less effort. More done.",
  description:
    "ZSpace Tools is a free collection of simple online tools — compress images and PDFs, generate QR codes and strong passwords, and count words. Files are processed in your browser, with no sign-up.",
  shortDescription:
    "Simple, free online tools for everyday tasks — processed in your browser, no sign-up.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "connect@zspace.in",
  locale: "en",
  // Set when content was first published; used as a stable date in metadata.
  launched: "2026-11-12",
} as const;

const mb = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const limits = {
  imageMaxMB: mb(process.env.NEXT_PUBLIC_MAX_IMAGE_MB, 25),
  maxImages: mb(process.env.NEXT_PUBLIC_MAX_IMAGES, 30),
  pdfMaxMB: mb(process.env.NEXT_PUBLIC_MAX_PDF_MB, 100),
} as const;

export const analyticsConfig = {
  gaId: process.env.NEXT_PUBLIC_GA_ID || "",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || "",
  gscVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
} as const;

/** Absolute URL for a site path. Paths get a trailing slash to match canonical URLs. */
export function absoluteUrl(path = "/") {
  if (path === "/" || path === "") return `${site.url}/`;
  const clean = path.startsWith("/") ? path : `/${path}`;
  const withSlash = /\.[a-z0-9]+$/i.test(clean) || clean.endsWith("/") ? clean : `${clean}/`;
  return `${site.url}${withSlash}`;
}

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "All Tools", href: "/all-tools/" },
  { label: "Categories", href: "/all-tools/#categories" },
  { label: "Blog", href: "/blog/" },
  { label: "About", href: "/about/" },
] as const;

export const legalNav = [
  { label: "Privacy Policy", href: "/privacy-policy/" },
  { label: "Terms & Conditions", href: "/terms-and-conditions/" },
  { label: "Disclaimer", href: "/disclaimer/" },
] as const;
