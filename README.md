# ZSpace Tools

**Everyday tools. Made effortlessly simple.** A free, minimalist collection of online utilities, all running in the browser.

| Tool | Route | Engine |
| --- | --- | --- |
| Image Compressor | `/image-compressor/` | Canvas re-encode (JPG/WebP) · UPNG palette quantisation (PNG, alpha-safe) · fflate ZIP |
| PDF Compressor | `/pdf-compressor/` | pdf-lib: re-encodes embedded raster images only, deflates raw streams, object streams |
| QR Code Generator | `/qr-code-generator/` | `qrcode` matrix → custom SVG/PNG renderer, logo-safe (ECC H, version ≥ 4) |
| Word Counter | `/word-counter/` | `Intl.Segmenter` (words, sentences, graphemes) |
| Password Generator | `/password-generator/` | `crypto.getRandomValues` + rejection sampling + Fisher–Yates |

No file, text or password is ever sent to a server.

## Stack
Next.js 16 (App Router, Turbopack, fully static output) · React 19 · TypeScript · Tailwind CSS 4 · Motion (Framer Motion) · Lucide.
Fonts: Clash Display + Satoshi (self-hosted, ITF Free Font License, `src/fonts/FFL-LICENSE.txt`), JetBrains Mono (`next/font/google`, OFL).

## Develop
```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL at minimum
npm run dev
```

## Verify
```bash
npm run typecheck && npm run lint
npm run test:unit                       # QR decode round-trips, PNG alpha preservation
npm run build && npm start -- -p 3100   # in another terminal:
npm run test:e2e                        # 36 browser checks against real outputs (Playwright)
npm run test:links                      # internal links + anchors
node tests/screens.mjs ./shots          # screenshots at 1440/1280/768/390/360 + overflow check
```
Fixtures live in `tests/fixtures/` (`npm run test:fixtures` regenerates the PDFs).

## Adding a tool
1. Add an entry to `src/lib/tools.ts` (content, SEO, FAQs, specs, related tools).
2. Build the client component in `src/components/tools/` and map its slug in `src/components/tools/registry.tsx`.

Routing (`/[tool]/`), metadata, JSON-LD, OG image, sitemap, `llms.txt`, search, navigation and footer all update automatically.

## Content
Blog posts are typed data in `src/content/blog/` (`Post`/`Block` in `src/lib/blog-types.ts`). Register new posts in `src/content/blog/index.ts`.

## Environment
See `.env.example`. Analytics (GA4 **or** GTM) load only when their IDs are set; the privacy policy adapts to that setting at build time.

## Deploy
Any Node host or Vercel: `npm run build && npm start`. Set `NEXT_PUBLIC_SITE_URL` before building — canonical URLs, sitemap, OG and JSON-LD are baked in at build time.
