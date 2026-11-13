import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy. All tools run in the browser, so the only third
// parties are the optional Google tags. 'unsafe-inline' is required for the
// Next.js inline bootstrap scripts without a nonce-based setup.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  // https: lets users preview their own Markdown images; images cannot execute code.
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "worker-src 'self' blob:",
  "frame-src https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // URLs end with a slash (e.g. /image-compressor/) to match the canonical scheme.
  trailingSlash: true,
  poweredByHeader: false,
  turbopack: {
    // qpdf-wasm's loader has Node-only branches that require fs/path/crypto; in the
    // browser bundle those resolve to an empty module (they're never executed there).
    resolveAlias: {
      fs: { browser: "./src/lib/empty-module.ts" },
      path: { browser: "./src/lib/empty-module.ts" },
      crypto: { browser: "./src/lib/empty-module.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    // Heavy runtime assets (WASM codecs, OCR models, pdf.js, PDF fonts) are tens
    // of MB and only change when a dependency is upgraded. Vercel's default for
    // /public files is `max-age=0, must-revalidate`, so browsers re-request them on
    // every visit. Cache them in the browser for a week and at the CDN for a year
    // (the CDN cache is purged on every deploy, so upgrades still roll out).
    const assetCache = {
      key: "Cache-Control",
      value: "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400",
    };
    return [
      ...["/wasm/:path*", "/ocr/:path*", "/pdfjs/:path*", "/fonts/:path*"].map((source) => ({
        source,
        headers: [assetCache],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // /tools/ and /categories/ are aliases of the single canonical directory page.
      { source: "/tools", destination: "/all-tools/", permanent: true },
      { source: "/categories", destination: "/all-tools/#categories", permanent: true },
      // Renamed tools keep their old URLs working.
      { source: "/loan-emi-calculator", destination: "/emi-calculator/", permanent: true },
      { source: "/date-calculator", destination: "/days-between-dates/", permanent: true },
    ];
  },
};

export default nextConfig;
