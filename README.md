# ZSpace Tools — tools.zspace.in

A premium Next.js 14 (App Router) website with Tailwind CSS, built for hosting free online tools targeting Indian businesses.

## 🚀 Quick Start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Production build
npm start            # Start production server
```

## 📁 Project Structure

```
app/
├── layout.tsx                      # Root layout (SEO metadata, Header, Footer)
├── page.tsx                        # Homepage (Hero, Categories, Featured Tools, FAQ, CTA)
├── globals.css                     # Global styles + Tailwind + Google Fonts
├── sitemap.ts                      # Auto-generated XML sitemap
│
├── components/
│   ├── Header.tsx                  # Sticky nav + dropdown menus + mobile menu
│   ├── Footer.tsx                  # Rich footer with links, trust badges, social
│   └── ToolCard.tsx                # Reusable tool card component
│
└── tools/
    ├── page.tsx                    # All Tools listing page
    └── gst-calculator/
        ├── page.tsx                # GST page (SEO + schema + content)
        └── GSTCalculatorClient.tsx # Interactive calculator (client component)

public/
├── robots.txt
├── site.webmanifest
└── (og-image.png, favicon.svg — add your own)
```

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `font-display` | Syne | Headings, labels, badges |
| `font-body` | DM Sans | Body text, UI |
| `font-mono` | JetBrains Mono | Code, numbers |
| `zest-500` | `#6255e8` | Primary CTA, accent |
| `ink-900` | `#080818` | Dark backgrounds |
| `glow` | `#a8f0d8` | Highlight on dark |

## 📈 SEO Strategy

### What's included:
- **Next.js Metadata API** — per-page titles, descriptions, OG, Twitter cards
- **Canonical URLs** — prevent duplicate content
- **Schema.org JSON-LD** — WebSite, WebApplication, FAQPage schemas
- **XML Sitemap** — auto-generated via `app/sitemap.ts`
- **robots.txt** — allows all crawlers
- **Web Manifest** — PWA support
- **Structured headings** — H1 → H2 → H3 hierarchy on all pages
- **Accessible markup** — ARIA labels, roles, semantic HTML

### Page-specific SEO:
Each tool page should include:
1. Unique title with primary keyword first
2. Meta description with the tool's core value prop
3. `WebApplication` schema with `offers.price: "0"`
4. `FAQPage` schema for common questions
5. Breadcrumb navigation
6. Informational content (how-to, definitions) for long-tail ranking

## ➕ Adding a New Tool

1. Create `app/tools/[tool-slug]/page.tsx` with `export const metadata`
2. Create `app/tools/[tool-slug]/[ToolName]Client.tsx` for interactive logic
3. Add the tool to `app/tools/page.tsx` tools array
4. Add slug to `app/sitemap.ts` tools array
5. Add to `Header.tsx` dropdown if it's a top tool

## 🔧 Performance Tips

- All heavy interactivity is in `'use client'` components
- Static page shells are server-rendered for fast FCP
- Images should use `next/image` with `priority` for above-fold
- Fonts are loaded via Google Fonts with `display=swap`
- Add `next/headers` cache headers for tool pages

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2 | Framework |
| react | ^18.3 | UI |
| tailwindcss | ^3.4 | Styling |
| lucide-react | ^0.383 | Icons |
| clsx | ^2.1 | Conditional classes |
