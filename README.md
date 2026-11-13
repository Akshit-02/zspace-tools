# ZSpace Tools

**Everyday tools. Made effortlessly simple.** A free, minimalist collection of online utilities, all running in the browser.

| Tool | Route | Engine |
| --- | --- | --- |
| Image Compressor | `/image-compressor/` | Canvas re-encode (JPG/WebP) · UPNG palette quantisation (PNG, alpha-safe) · fflate ZIP |
| PDF Compressor | `/pdf-compressor/` | pdf-lib: re-encodes embedded raster images only, deflates raw streams, object streams |
| QR Code Generator | `/qr-code-generator/` | `qrcode` matrix → custom SVG/PNG renderer, logo-safe (ECC H, version ≥ 4) |
| Word Counter | `/word-counter/` | `Intl.Segmenter` (words, sentences, graphemes) |
| Password Generator | `/password-generator/` | `crypto.getRandomValues` + rejection sampling + Fisher–Yates |
| Image Resizer | `/image-resizer/` | Pixel / percent / preset planning, canvas resampling, crop-to-fill or pad (never stretch) |
| PDF Merger | `/pdf-merger/` | pdf-lib page copy in user order, output re-opened and verified |
| PDF Splitter | `/pdf-splitter/` | pdf-lib page extraction (ranges, every page, groups of N), pdf.js thumbnails |
| Image to PDF | `/image-to-pdf/` | pdf-lib; JPG/PNG embedded as-is, WebP & rotated JPG re-encoded, clip-path fill |
| Percentage Calculator | `/percentage-calculator/` | Six modes with validated parsing, formula and working |
| JSON Formatter & Validator | `/json-formatter/` | Native `JSON.parse` + strict tokenizer: exact line/column errors, lossless re-printing |
| Age Calculator | `/age-calculator/` | Calendar-month stepping with month-end clamping; 29 Feb → 28 Feb in common years |
| GST Calculator | `/gst-calculator/` | Integer-paise maths, inclusive/exclusive, CGST+SGST or IGST, INR formatting |
| Unit Converter | `/unit-converter/` | Exact definitional constants, affine temperature, decimal vs binary storage |
| Case Converter | `/case-converter/` | 14 styles, style-guide Title Case, Unicode-aware word splitting |
| URL Encoder & Decoder | `/url-encoder-decoder/` | encodeURI/Component + decode, exact malformed-sequence positions, double-encoding warnings |
| Base64 Encoder & Decoder | `/base64-encoder-decoder/` | UTF-8 via TextEncoder, strict validation, URL-safe/MIME, chunked file mode with type sniffing |
| CSV to JSON Converter | `/csv-to-json/` | Papa Parse 5.7.0 (pinned) + own header/ragged-row handling; nothing silently dropped |
| Days Between Dates | `/days-between-dates/` (was `/date-calculator/`, 308) | Difference (incl./excl., hours/minutes), add/subtract with month-end clamping, business days (Mon–Fri, Mon–Sat, custom, holidays), countdown, validated share links |
| Color Picker & Converter | `/color-picker/` | HEX (3/4/6/8-digit)/RGB(A)/HSL(A), HSL + alpha sliders, 6 palette harmonies + preview, tints & shades, CSS snippets & custom properties, WCAG contrast, validated ?c= share links |
| UUID Generator | `/uuid-generator/` | crypto.randomUUID v4 + RFC 9562 v7 (monotonic), bulk 1,000, validator |
| Markdown Editor & Previewer | `/markdown-editor/` | marked 18.1.2 + DOMPurify 3.4.17, URL allow-list, undo-safe toolbar, .md/.html export |
| Invoice Generator | `/invoice-generator/` | Integer-minor-unit totals, GST/VAT, 3 templates, vector A4 PDF via pdf-lib + fontkit (Satoshi + Noto Sans fallback) |
| URL Slug Generator | `/url-slug-generator/` | Script-aware transliteration (Latin, Greek, RU/UK Cyrillic), Unicode keep/remove, stop words, word-boundary max length, bulk + CSV |
| Image Cropper | `/image-cropper/` | Pointer/keyboard crop box, ratio lock, rotate/flip/zoom, exact preset output sizes |
| Regex Tester | `/regex-tester/` | Native RegExp in a blob Web Worker, 1.5 s kill-switch for catastrophic backtracking, `d`-flag group indices, named groups, TXT report |
| HTML Formatter & Minifier | `/html-formatter/` | Own tokenizer + tree (implicit closes, void elements), raw `pre/textarea/script/style`, structure checks; never rendered |
| CSS Minifier & Beautifier | `/css-minifier/` | csso 5.0.5 (restructure off) + own string/comment-aware tokenizer for beautify & keep-all-comments, css-tree error reporting |
| Discount Calculator | `/discount-calculator/` | Sale price, find %, successive (1 − Π(1 − d)), original price, markup vs margin; 7 currencies; no tax |
| Meta Tag Generator | `/meta-tag-generator/` | Escaped title/meta/canonical/robots/OG/Twitter tags, URL + handle validation, illustrative SERP/OG/X previews, HTML download |
| XML Sitemap Generator | `/xml-sitemap-generator/` | Origin-scoped URL normalisation & dedupe, optional lastmod/changefreq/priority (never invented), 50k/50 MB split + index (ZIP), sitemap/robots import, CSV; no crawling |
| Robots.txt Generator | `/robots-txt-generator/` | Presets (block-all behind confirmation), multi-group rule builder, lint warnings, RFC 9309 tester (longest match, Allow ties, `*`/`$`) |
| Open Graph Preview | `/open-graph-preview/` | Facebook/LinkedIn/WhatsApp/X simulations, image size check, local image preview, import from pasted page source (no fetching) |
| HTML Entity Encoder & Decoder | `/html-entity-encoder/` | `entities` 8.1.0 (WHATWG decoding, 2,231 names), named/decimal/hex encoding per code point, issue reporting; output shown as text only |
| PDF to Word Converter | `/pdf-to-word/` | pdf.js text/font/image extraction → layout analysis (`pdf-layout.ts`: lines, paragraphs, headings, alignment, two-column order, simple tables) → `docx` 9.12.0; scanned-page detection with Tesseract OCR or page image fallback |
| Word to PDF Converter | `/word-to-pdf/` | docx-preview 0.4.1 render (sanitised) → browser print engine with per-section `@page` sizes; "paged" vs "flow" mode chosen by measurement; .doc rejected with guidance |
| PDF to JPG & PNG | `/pdf-to-jpg/` | pdf.js page-by-page canvas render at 72/150/300 DPI (16 MP cap), JPG quality, background/transparent PNG, cancel, ZIP |
| Image Converter | `/image-converter/` | Signature sniffing; native decode + libheif-js 1.23.5 (HEIC) and libavif via @jsquash/avif 2.1.1 (AVIF decode/encode) in a Web Worker; JPG flattening colour, resize, rename, ZIP |
| Image to Text (OCR) | `/image-to-text/` | tesseract.js 7 + self-hosted LSTM core and best_int models (eng, hin, guj, spa, fra, deu); rotate/crop/greyscale/contrast/upscale on a copy; TXT/DOCX |
| PDF to Excel Converter | `/pdf-to-excel/` | pdf.js text positions → table detection (`pdf-tables.ts`: gap-split cells, interval-clustered columns, wrapped-cell joining, multi-page stitching) → conservative typing (`cell-values.ts`) → ExcelJS 4.4.0 XLSX / CSV; OCR for scans |
| Excel to PDF Converter | `/excel-to-pdf/` | ExcelJS read (cached formula results, SSF 0.11.2 number formats, fills, borders, merges, images) → pdf-lib renderer (`xlsx-pdf.ts`): paper/orientation/margins, fit width/page, column bands, repeated header rows, page numbers |
| PDF Editor | `/pdf-editor/` | pdf.js page render + DOM overlay layer (`OverlayLayer`) → `pdf-overlay.ts` export with a display→user-space matrix (rotation/crop safe): text, images, shapes, ink, highlight, underline, real /Text notes; undo/redo |
| PDF Page Organizer | `/pdf-organizer/` | Lazy thumbnails; reorder (drag & drop + keyboard), rotate, delete, duplicate, reverse, extract → pdf-lib `copyPages` + `/Rotate` |
| Sign PDF | `/sign-pdf/` | Draw (smoothed canvas), type (self-hosted OFL script fonts), upload (white removal + trim) → overlay placement with rotate/resize, date/name, copy to all pages; visual signature only |
| Protect PDF | `/protect-pdf/` | qpdf 11 (WebAssembly, `@neslinesli93/qpdf-wasm` 0.3.0) in a Web Worker: AES-256 (default) or AES-128, optional print/copy/edit/comment restrictions with an owner password; output reopened with pdf.js to prove the password is required |
| Unlock PDF | `/unlock-pdf/` | qpdf `--show-encryption` inspection → `--decrypt` with the user-supplied password only (no guessing); opening-password-only unlocks keep the author's restrictions; RC4/AES-128/AES-256 |
| Watermark PDF | `/watermark-pdf/` | `pdf-stamp.ts` placement (9 positions, diagonal, custom drag, tiling, page scopes) → `pdf-overlay.ts` export with opacity ExtGState; text or transparent PNG/JPG logo embedded once |
| Add Page Numbers | `/add-page-numbers/` | `pdf-stamp.ts` numbering plan (skip N, start at, ranges, 1/01/Page n/Page n of N/n/N/Roman) + header/footer text with `{page}` `{total}` `{title}` `{date}` `{file}`; rotation and crop-box safe |
| PDF to PowerPoint | `/pdf-to-powerpoint/` | pptxgenjs 4.0.1: "Keep the layout" (pdf.js render per slide) or "Editable text" (`pdf-layout.ts` paragraphs/tables → text boxes over a text-free background); scanned pages → picture slides with OCR text in the notes |
| EMI Calculator | `/emi-calculator/` (was `/loan-emi-calculator/`, 308) | Reducing-balance EMI in integer minor units, amortization, prepayment, comparison, CSV/print, multi-currency |

No file, text, number or password is ever sent to a server. PDF passwords are used once inside a qpdf worker, filtered out of its output, never logged or sent to analytics, and cleared from the form after success.

pdf.js (thumbnails) is served from `/public/pdfjs`, copied from `node_modules` by `scripts/copy-pdfjs.mjs` on install/dev/build — keeps the CSP `self`-only.
The OCR worker, WebAssembly cores and language models (`/public/ocr`) and the AVIF codec and qpdf wasm (`/public/wasm`) are copied by `scripts/copy-wasm.mjs` the same way — no CDN. The CSP allows `'wasm-unsafe-eval'` (WebAssembly compilation only, not `eval`).
Word to PDF uses the browser's own print dialog ("Save as PDF") because no browser library reproduces Word layout reliably and there is deliberately no server.

### Shared building blocks
- `src/components/tools/useBatch.ts` — sequential, claim-safe multi-file queue with object-URL cleanup
- `src/components/tools/SortableList.tsx` — drag handle + keyboard move up/down
- `src/components/tools/Editor.tsx` — text/code editor with toolbar, counts, line gutter and error-line highlight
- `src/components/tools/pdf/` — `usePdfFile`, `PdfThumbs` (lazy serial thumbnails), `PdfPageCanvas`, `OverlayLayer` (select/move/resize/rotate) shared by the PDF tools; `src/lib/use-history.ts` (undo/redo with gesture commits)
- `src/lib/pdf-overlay.ts` + `src/lib/pdf-text.ts` — overlay export and font handling (standard fonts → Noto Sans → canvas image for complex scripts)
- `src/components/tools/SocialPreviews.tsx` + `TagOutput.tsx` — shared link-card simulations and tabbed tag output (Meta Tag Generator, Open Graph Preview)
- `src/components/tools/CodeFormatter.tsx` — shared beautify/minify shell (input/output editors, file open, size comparison, issues list)
- `src/components/tools/ui.tsx` — DropZone, Segmented, Toggle, Range, Notice, ProgressBar, CopyButton, RejectionNotice, Metric, DownloadButton
- `src/lib/image-utils.ts`, `src/lib/pdf-utils.ts`, `src/lib/pdf-render.ts`, `src/lib/files.ts`, `src/lib/zip.ts`

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
npm run test:unit                       # 718 assertions across every calculation and conversion engine
npm run build && npm start -- -p 3100   # in another terminal:
NEXT_PUBLIC_GTM_ID= npm run build      # build WITHOUT analytics so tests don't send hits to GA
npm run test:e2e                        # 939 browser checks against real outputs (Playwright)
npm run test:links                      # internal links + anchors
node tests/screens.mjs ./shots          # screenshots at 1440/1280/768/390/360 + overflow check
```
Fixtures live in `tests/fixtures/` (`npm run test:fixtures` regenerates the PDFs, DOCX and image fixtures; HEIC/AVIF fixtures were made with macOS `sips`; `make-sheet-fixtures.mjs` builds the table PDFs and Excel workbooks). Encrypted fixtures (`locked-*.pdf`) are written by `tests/tools-10.test.mts`. OCR and scanned-PDF fixtures are generated during `tests/e2e-9.mts`.

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

## Fonts in generated PDFs
`public/fonts/pdf/` holds Satoshi (ITF FFL — embedding in documents permitted) and Noto Sans (SIL OFL, licence alongside).
Invoices embed subsets only. Complex scripts (Devanagari, Arabic) can't be shaped by pdf-lib, so the tool detects them and recommends Print → Save as PDF.
