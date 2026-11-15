/**
 * Central tool registry.
 *
 * Adding a tool:
 *   1. Add an entry to `tools` below (content, SEO, FAQs, related tools).
 *   2. Create its client component in src/components/tools/ and register it
 *      in src/components/tools/registry.tsx under the same slug.
 * Routes (/[slug]/), sitemap, llms.txt, search, OG images, navigation and
 * JSON-LD are all generated from this file.
 */

import { limits } from "./site";

export type CategoryId = "image" | "pdf" | "text" | "seo" | "calculators" | "loans" | "property" | "salary" | "tax" | "payroll" | "benefits" | "health" | "education" | "lifestyle" | "date" | "business" | "design" | "productivity" | "qr" | "developer" | "conversion";

export type IconName =
  | "image"
  | "file-text"
  | "qr"
  | "type"
  | "key"
  | "code"
  | "repeat"
  | "zap"
  | "resize"
  | "merge"
  | "split"
  | "image-pdf"
  | "percent"
  | "braces"
  | "cake"
  | "receipt"
  | "ruler"
  | "case"
  | "link"
  | "binary"
  | "sheet"
  | "calendar"
  | "loan"
  | "clock"
  | "palette"
  | "fingerprint"
  | "markdown"
  | "invoice"
  | "crop"
  | "brush"
  | "briefcase"
  | "slug"
  | "regex"
  | "html"
  | "css"
  | "discount"
  | "meta"
  | "sitemap"
  | "robots"
  | "share"
  | "entity"
  | "globe"
  | "pdf-word"
  | "word-pdf"
  | "pdf-image"
  | "convert-image"
  | "ocr"
  | "pdf-table"
  | "sheet-pdf"
  | "pdf-edit"
  | "pdf-grid"
  | "signature"
  | "lock"
  | "unlock"
  | "stamp"
  | "numbers"
  | "slides"
  | "words"
  | "diff"
  | "hash"
  | "rotate"
  | "trending"
  | "growth"
  | "heart"
  | "graduation"
  | "tip"
  | "piggy"
  | "recurring"
  | "coins"
  | "target"
  | "cagr"
  | "xirr"
  | "swp"
  | "ppf"
  | "inflation"
  | "retirement"
  | "epf"
  | "nps"
  | "gratuity"
  | "income-tax"
  | "take-home"
  | "hra"
  | "tds"
  | "esi"
  | "hike"
  | "leave"
  | "payroll"
  | "benefits"
  | "loan-eligibility"
  | "prepayment"
  | "car-loan"
  | "personal-loan"
  | "affordability"
  | "rent-buy"
  | "stamp-duty"
  | "registration"
  | "down-payment"
  | "dti";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: IconName;
}

export interface ToolFaq {
  q: string;
  a: string;
}

export interface Tool {
  slug: string;
  name: string;
  category: CategoryId;
  /** Extra categories the tool is also listed under (one page, several directory entries). */
  alsoIn?: CategoryId[];
  icon: IconName;
  /** One-line card description. */
  short: string;
  /** Intro under the H1 — one or two sentences, never a wall of text. */
  intro: string;
  /** Definition-style answer to "What is this tool?" (AEO). */
  what: string;
  /** Plain-language explanation of how it works under the hood. */
  how: string;
  seo: {
    title: string;
    description: string;
    keyword: string;
    secondary: string[];
  };
  features: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  specs: { label: string; value: string }[];
  formats: string[];
  privacy: string;
  faqs: ToolFaq[];
  related: string[];
  /** Worked examples with real numbers (rendered on the tool page). */
  examples?: { title: string; body: string }[];
  /** Optional in-depth guide: what each input means, how to read the result, uses and limits. */
  guide?: {
    inputs: { title: string; body: string }[];
    interpret: string[];
    useCases: string[];
    limitations: string[];
    /** Common mistakes people make with this kind of calculation. */
    mistakes?: string[];
  };
  /** Words people type into search that should surface this tool. */
  searchTerms: string[];
  published: string;
  updated: string;
}

export const categories: Category[] = [
  { id: "image", name: "Image Tools", description: "Compress, resize, crop and prepare images.", icon: "image" },
  { id: "pdf", name: "PDF Tools", description: "Compress, merge, split and create PDFs.", icon: "file-text" },
  { id: "text", name: "Text & Writing Tools", description: "Count, convert and tidy writing — from word counts to URL slugs.", icon: "type" },
  { id: "seo", name: "SEO & Website Tools", description: "Meta tags, sitemaps, robots.txt and link previews for your website.", icon: "globe" },
  { id: "calculators", name: "Finance & Calculators", description: "SIP, FD, RD, PPF, XIRR, retirement, inflation, loans, GST and percentages — plus every other calculator, with the working shown.", icon: "percent" },
  { id: "loans", name: "Loan Calculators", description: "EMIs, home-loan eligibility and prepayment, car and personal loans, affordability and debt-to-income — with full schedules.", icon: "loan" },
  { id: "property", name: "Property & Home Buying", description: "Rent vs buy, down payment, stamp duty and registration charges for buying a home in India.", icon: "rent-buy" },
  { id: "salary", name: "Salary Calculators", description: "CTC to in-hand salary, hikes and offer comparisons for Indian payslips.", icon: "take-home" },
  { id: "tax", name: "Income Tax Calculators", description: "Indian income tax under both regimes, HRA exemption and TDS — with the rules and their sources shown.", icon: "income-tax" },
  { id: "payroll", name: "Payroll Calculators", description: "Statutory payroll deductions in India: PF, ESI and leave encashment.", icon: "payroll" },
  { id: "benefits", name: "Employee Benefits", description: "EPF, NPS, gratuity and leave encashment — what you'll build up and what's taxable.", icon: "benefits" },
  { id: "health", name: "Health & Fitness", description: "Body measurements and health screening calculators, with their limits explained.", icon: "heart" },
  { id: "education", name: "Education & Academic", description: "Grades, GPA and CGPA for students on any grading scale.", icon: "graduation" },
  { id: "lifestyle", name: "Everyday & Lifestyle", description: "Quick everyday sums — tips, splitting bills and more.", icon: "tip" },
  { id: "business", name: "Business Tools", description: "Invoices and paperwork for freelancers and small teams.", icon: "briefcase" },
  { id: "design", name: "Design & Color Tools", description: "Pick and convert colours, build palettes and check contrast for screens and print.", icon: "brush" },
  { id: "date", name: "Date & Time", description: "Count days, add months and find working days on the calendar.", icon: "clock" },
  { id: "productivity", name: "Productivity Tools", description: "Small utilities that save everyday minutes.", icon: "zap" },
  { id: "qr", name: "QR Tools", description: "Create QR codes for links, Wi-Fi and contact details.", icon: "qr" },
  { id: "developer", name: "Developer Tools", description: "Format, encode, generate and convert data for your projects.", icon: "code" },
  { id: "conversion", name: "File & Unit Conversion", description: "Convert PDFs, Word documents and images between formats — and units of measurement.", icon: "repeat" },
];

const MAX_IMG = `${limits.imageMaxMB} MB`;
const MAX_PDF = `${limits.pdfMaxMB} MB`;
const MAX_PDFS = limits.maxPdfFiles;

export const tools: Tool[] = [
  {
    slug: "image-compressor",
    name: "Image Compressor",
    category: "image",
    icon: "image",
    short: "Shrink JPG, PNG and WebP files in your browser, with a before-and-after view.",
    intro:
      "Reduce image file size without a visible drop in quality. Compress JPG, PNG and WebP images in bulk — right in your browser, with nothing uploaded.",
    what:
      "An image compressor reduces the number of bytes an image file uses, so it loads faster on websites and is easier to email or upload. ZSpace Tools' Image Compressor re-encodes JPG, PNG and WebP images at a quality level you choose and shows you exactly how much smaller each file becomes.",
    how:
      "Your image is decoded by your browser, drawn onto an off-screen canvas with its orientation corrected, and re-encoded. JPG and WebP use lossy quality settings. PNG files are colour-quantised (reduced to a smaller palette) while keeping transparency intact. If a compressed result is not smaller than your original, the tool keeps the original and tells you.",
    seo: {
      title: "Image Compressor — Compress JPG, PNG & WebP Online Free",
      description:
        "Compress images online free. Reduce JPG, PNG and WebP file size in your browser with a quality slider, before/after preview and ZIP download. No upload.",
      keyword: "image compressor",
      secondary: ["compress image online", "reduce image size", "compress JPG online", "compress PNG online", "image size reducer"],
    },
    features: [
      { title: "Real compression, real numbers", body: "Every result shows the original size, the new size and the exact percentage saved — measured from the output file, not estimated." },
      { title: "Bulk upload", body: `Drop up to ${limits.maxImages} images at once and download them individually or together as a ZIP.` },
      { title: "Before-and-after slider", body: "Drag across the preview to compare the original and compressed image at the same position." },
      { title: "Transparency preserved", body: "PNG and WebP images keep their transparent areas. Only JPG output flattens onto white, because JPG has no alpha channel." },
      { title: "Correct orientation", body: "Photos from phones are rotated according to their EXIF orientation, so nothing comes out sideways." },
      { title: "Optional resizing", body: "Cap the longest side at 4K, 2560, 1920, 1280 or 800 px — usually the biggest saving of all for phone photos." },
      { title: "Metadata removed", body: "Re-encoding drops EXIF data such as camera details and GPS location, which also saves bytes." },
    ],
    steps: [
      { title: "Add your images", body: "Drag JPG, PNG or WebP files onto the drop zone, or click to choose them from your device." },
      { title: "Pick a quality level", body: "Start at 75%. Lower values give smaller files; higher values keep more detail. You can also convert to WebP or JPG." },
      { title: "Check and download", body: "Compare before and after, then download each image or everything as a single ZIP file." },
    ],
    specs: [
      { label: "Input formats", value: "JPG, JPEG, PNG, WebP" },
      { label: "Output formats", value: "Same as input, WebP or JPG" },
      { label: "Max file size", value: `${MAX_IMG} per image` },
      { label: "Max files per batch", value: String(limits.maxImages) },
      { label: "Quality range", value: "10–100%" },
      { label: "Resize presets", value: "Original, 3840, 2560, 1920, 1280, 800 px (longest side)" },
      { label: "Processing", value: "In your browser (Canvas API, UPNG quantiser)" },
    ],
    formats: ["JPG", "JPEG", "PNG", "WebP"],
    privacy:
      "Images are processed entirely on your device. They are never uploaded to ZSpace Tools or any other server, and they are discarded when you close or reload the page.",
    faqs: [
      { q: "Is the Image Compressor free?", a: "Yes. It is completely free with no sign-up, no watermark and no daily limit." },
      { q: "Are my images uploaded to a server?", a: "No. Compression runs inside your browser using the Canvas API. Your images never leave your device, which you can confirm by disconnecting from the internet after the page loads — the tool keeps working." },
      { q: "Which image formats are supported?", a: "JPG/JPEG, PNG and WebP. You can keep the original format or convert the output to WebP or JPG." },
      { q: "Will compression reduce image quality?", a: "Lossy compression removes detail the eye rarely notices. Between 70% and 85% quality most photos look identical to the original while being considerably smaller. Use the before-and-after slider to check." },
      { q: "Why is a compressed file sometimes not smaller?", a: "Images that are already heavily optimised can grow when re-encoded. When that happens the tool keeps your original file and labels it as already optimised, rather than giving you a bigger file." },
      { q: "Does it work on mobile?", a: "Yes. It works in current versions of Safari, Chrome, Firefox and Edge on phones, tablets and computers. Very large images may be slower on older phones." },
      { q: "Do I need to install anything?", a: "No. It runs in your web browser — there is nothing to install." },
    ],
    related: ["image-resizer", "image-to-pdf", "pdf-compressor"],
    searchTerms: ["compress", "image", "photo", "picture", "jpg", "jpeg", "png", "webp", "reduce", "resize", "smaller", "optimize", "size", "kb", "shrink"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-compressor",
    name: "PDF Compressor",
    category: "pdf",
    icon: "file-text",
    short: "Make PDFs smaller by optimising embedded images, without converting text to pictures.",
    intro:
      "Reduce PDF file size by re-compressing the images inside it. Text, vectors and links stay sharp and selectable — and the file never leaves your browser.",
    what:
      "A PDF compressor makes a PDF document smaller so it fits email attachment limits, uploads faster and takes less storage. ZSpace Tools' PDF Compressor finds the photos and scans embedded in your PDF, re-encodes them at a lower resolution and quality, and repacks the document structure more efficiently.",
    how:
      "The PDF is opened in your browser with pdf-lib. Each embedded raster image (JPEG or uncompressed/Flate RGB and greyscale images) is decoded, downscaled to the target resolution for the chosen level, and re-encoded as JPEG — but only replaced if the new version is smaller. Text and vector graphics are not touched. The document is then saved with compressed object streams. The tool compares the final size with your original and only offers the result if it is genuinely smaller.",
    seo: {
      title: "PDF Compressor — Compress PDF Online & Reduce PDF Size Free",
      description:
        "Compress PDF files online free. Reduce PDF size at low, medium or high levels while text stays sharp and selectable. Runs in your browser — no upload.",
      keyword: "PDF compressor",
      secondary: ["compress PDF online", "reduce PDF size", "make PDF smaller", "compress large PDF"],
    },
    features: [
      { title: "Three honest levels", body: "Low, medium and high compression trade image resolution for size. Text and vector content are never rasterised." },
      { title: "Verified results", body: "The output size is measured and compared with the original. If the PDF cannot be made smaller, you are told plainly." },
      { title: "Layout preserved", body: "Pages, fonts, links and text selection stay as they were. Only embedded images are re-encoded." },
      { title: "Large files supported", body: `Handles PDFs up to ${MAX_PDF}, limited only by your device's memory.` },
      { title: "Clear error handling", body: "Password-protected, damaged and non-PDF files are detected and explained instead of failing silently." },
      { title: "Private by design", body: "All processing happens on your device. Your document is never uploaded." },
    ],
    steps: [
      { title: "Add your PDF", body: "Drag a PDF onto the drop zone or click to choose one." },
      { title: "Choose a compression level", body: "Low keeps images close to print quality, medium suits most sharing, high gives the smallest file for on-screen reading." },
      { title: "Compress and download", body: "Press Compress PDF, review the size reduction, then download the smaller file." },
    ],
    specs: [
      { label: "Input format", value: "PDF (unencrypted)" },
      { label: "Max file size", value: MAX_PDF },
      { label: "Low", value: "Images ≤ 2400 px, JPEG quality 80%" },
      { label: "Medium", value: "Images ≤ 1600 px, JPEG quality 65%" },
      { label: "High", value: "Images ≤ 1100 px, JPEG quality 45%" },
      { label: "Processing", value: "In your browser (pdf-lib, Canvas API)" },
    ],
    formats: ["PDF"],
    privacy:
      "Your PDF is opened and compressed entirely in your browser. It is never uploaded to a server, and nothing is stored after you leave the page.",
    faqs: [
      { q: "Is the PDF Compressor free?", a: "Yes, it is free to use with no sign-up and no watermark." },
      { q: "Is it safe to compress confidential PDFs here?", a: "The document is processed locally in your browser and is never sent to a server. That makes it suitable for contracts, statements and other sensitive files, although you should always follow your organisation's own policies." },
      { q: "Why didn't my PDF get smaller?", a: "Most PDF size comes from embedded images. Documents that are mostly text, already optimised, or that store images in formats this tool cannot safely re-encode (such as CMYK or indexed-colour images) may not shrink. In that case the tool tells you and does not offer a larger or identical file." },
      { q: "Will the text in my PDF become blurry?", a: "No. Text and vector graphics are left untouched, so they stay sharp and selectable. Only photos and scanned images are re-compressed." },
      { q: "Can I compress a password-protected PDF?", a: "Not currently. Encrypted PDFs must be unlocked first in the app you used to protect them. The tool will detect encryption and let you know." },
      { q: "Which compression level should I choose?", a: "Medium is the best starting point for email and uploads. Use low for documents you may print, and high when the smallest possible size matters more than image detail." },
      { q: "Does it work on mobile and do I need to install anything?", a: "It runs in any modern mobile or desktop browser with nothing to install. Very large PDFs are faster on a computer." },
    ],
    related: ["pdf-merger", "pdf-splitter", "image-compressor"],
    searchTerms: ["pdf", "compress", "reduce", "shrink", "smaller", "document", "file size", "email", "attachment", "optimize", "mb"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    category: "qr",
    icon: "qr",
    short: "Create static QR codes for links, text, email, phone numbers and Wi-Fi.",
    intro:
      "Create a free, permanent QR code for a URL, text, email, phone number or Wi-Fi network. Customise colours, add a logo and download as PNG or SVG.",
    what:
      "A QR code generator turns information — such as a website address or Wi-Fi login — into a square barcode that phone cameras can scan. ZSpace Tools creates static QR codes: the content is encoded directly in the pattern, so the code works forever, has no scan limits and does not depend on any tracking service.",
    how:
      "Your content is formatted into the standard payload for its type (for example WIFI:T:WPA;S:…; for networks or mailto: for email), then encoded into a QR symbol in your browser using the open-source qrcode library. Error correction adds redundancy so the code still scans if part of it is covered — which is how a logo can sit in the centre.",
    seo: {
      title: "QR Code Generator — Free QR Codes for URL, Wi-Fi, Email & Text",
      description:
        "Free QR code generator for URLs, text, email, phone and Wi-Fi. Custom colours, optional logo, PNG or SVG download. Static codes that never expire.",
      keyword: "QR code generator",
      secondary: ["free QR code generator", "create QR code online", "URL to QR code", "WiFi QR code generator"],
    },
    features: [
      { title: "Five content types", body: "Website links, plain text, email (with subject and message), phone numbers and Wi-Fi networks." },
      { title: "Never expires", body: "These are static QR codes. The data lives inside the code itself, so there is nothing to renew and no redirect that can break." },
      { title: "Your colours, your logo", body: "Set foreground and background colours and place a logo in the centre. The tool warns you if contrast is too low to scan reliably." },
      { title: "Print-ready downloads", body: "PNG up to 2048 px for documents and screens, and SVG for infinitely scalable print." },
      { title: "Error correction control", body: "Choose L, M, Q or H. Adding a logo automatically raises correction to H so the code stays scannable." },
      { title: "Live preview", body: "The code updates as you type, so you always see exactly what you will download." },
    ],
    steps: [
      { title: "Choose a type", body: "Pick URL, Text, Email, Phone or Wi-Fi. The form changes to show the right fields." },
      { title: "Enter your details and style it", body: "Fill in the content, then adjust colours, size, error correction and an optional logo." },
      { title: "Test and download", body: "Scan the preview with your phone camera, then download it as PNG or SVG." },
    ],
    specs: [
      { label: "Content types", value: "URL, Text, Email, Phone, Wi-Fi" },
      { label: "Output formats", value: "PNG, SVG" },
      { label: "PNG sizes", value: "256 – 2048 px" },
      { label: "Error correction", value: "L (7%), M (15%), Q (25%), H (30%)" },
      { label: "Code type", value: "Static (no tracking, no expiry)" },
      { label: "Processing", value: "In your browser (qrcode library)" },
    ],
    formats: ["PNG", "SVG"],
    privacy:
      "QR codes are generated in your browser. The links, text and Wi-Fi passwords you enter are not sent to or stored on any server.",
    faqs: [
      { q: "Are these QR codes free and do they expire?", a: "They are free and never expire. Static QR codes store the content directly in the pattern, so there is no subscription or redirect service that can stop working." },
      { q: "What is the difference between static and dynamic QR codes?", a: "A static QR code contains your data directly and cannot be edited after printing. A dynamic QR code points to a short redirect link that a service controls, which lets you change the destination and count scans — but it stops working if that service shuts down. ZSpace Tools creates static codes only." },
      { q: "How do I make a Wi-Fi QR code?", a: "Choose Wi-Fi, enter the network name (SSID), password and security type, and download the code. Most iPhone and Android cameras will offer to join the network when they scan it." },
      { q: "Will adding a logo stop my QR code from scanning?", a: "Not if it is used carefully. The tool switches to the highest error correction level (H) and keeps the logo small. Always test the code with a phone before printing." },
      { q: "Should I download PNG or SVG?", a: "Use PNG for websites, documents and social posts. Use SVG for print and design software, because it scales to any size without losing sharpness." },
      { q: "Is my Wi-Fi password safe?", a: "It is processed only in your browser and never sent anywhere. Remember that anyone who scans the printed code can read the password, so only display it where you would share the password anyway." },
      { q: "Does it work on mobile?", a: "Yes. You can create and download QR codes on any modern phone, tablet or computer, with nothing to install." },
    ],
    related: ["password-generator", "image-resizer", "word-counter"],
    searchTerms: ["qr", "code", "barcode", "link", "url", "wifi", "wi-fi", "scan", "generate", "create", "make", "menu", "email", "phone"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    category: "text",
    icon: "type",
    short: "Count words, characters, sentences and paragraphs, with reading and speaking time.",
    intro:
      "Count words and characters as you type. See sentences, paragraphs, reading time and speaking time instantly — ideal for essays, posts and scripts.",
    what:
      "A word counter is a tool that measures the length of a piece of writing. ZSpace Tools' Word Counter shows word count, character count (with and without spaces), sentences, paragraphs, and estimated reading and speaking time, updating live as you type or paste.",
    how:
      "Words and sentences are detected with your browser's built-in Intl.Segmenter, which understands punctuation, contractions and many languages better than splitting on spaces. Paragraphs are blocks of text separated by blank lines. Reading and speaking times divide the word count by an adjustable words-per-minute rate.",
    seo: {
      title: "Word Counter — Count Words & Characters Online, Free",
      description:
        "Free online word counter and character counter. Count words, characters, sentences and paragraphs as you type, with reading and speaking time.",
      keyword: "word counter",
      secondary: ["online word counter", "character counter", "count words online", "reading time calculator"],
    },
    features: [
      { title: "Live statistics", body: "Words, characters, characters without spaces, sentences and paragraphs update with every keystroke." },
      { title: "Reading and speaking time", body: "Estimates based on adjustable speeds — 238 words per minute for silent reading and 140 for presenting by default." },
      { title: "Language aware", body: "Uses the Intl.Segmenter standard so contractions, hyphenated words and many non-English scripts are counted properly." },
      { title: "Copy and clear", body: "Copy your text back to the clipboard or start again in one click." },
      { title: "Character limit check", body: "Set a target and watch a progress bar fill — useful for meta descriptions, bios and posts." },
      { title: "Stays on your device", body: "Your writing is never sent anywhere or saved." },
    ],
    steps: [
      { title: "Type or paste your text", body: "Start writing in the editor, or paste text from any document." },
      { title: "Read the statistics", body: "Counts and time estimates update instantly in the panel alongside the editor." },
      { title: "Adjust if needed", body: "Change reading or speaking speed, or set a character limit, to match your use case." },
    ],
    specs: [
      { label: "Counts", value: "Words, characters, characters without spaces, sentences, paragraphs" },
      { label: "Default reading speed", value: "238 wpm (adjustable)" },
      { label: "Default speaking speed", value: "140 wpm (adjustable)" },
      { label: "Word detection", value: "Intl.Segmenter with regex fallback" },
      { label: "Text limit", value: "None (tested beyond 100,000 words)" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Plain text", "Pasted rich text"],
    privacy: "Your text is counted inside your browser. It is not uploaded, logged or stored.",
    faqs: [
      { q: "How does the word counter count words?", a: "It uses the browser's Intl.Segmenter API, which splits text into words the way a language-aware text editor would. Contractions like \"don't\" count as one word, and punctuation is ignored." },
      { q: "How is reading time calculated?", a: "Reading time is the word count divided by your reading speed. The default of 238 words per minute is the average silent reading rate for adults reading English non-fiction, based on a 2019 meta-analysis by Marc Brysbaert. You can change it." },
      { q: "How is speaking time calculated?", a: "Speaking time divides the word count by a speaking rate, 140 words per minute by default, which suits a clear presentation pace. Conversational speech is often faster, so adjust it to match your delivery." },
      { q: "Does it count characters with and without spaces?", a: "Yes. Both are shown, because some platforms and assignments count spaces and others do not." },
      { q: "Is my text saved or sent anywhere?", a: "No. Everything happens in your browser, and your text disappears when you close the page." },
      { q: "Is it free and does it work on mobile?", a: "It is free, needs no account or installation, and works in any modern browser on phones, tablets and computers." },
    ],
    related: ["case-converter", "text-diff-checker", "markdown-editor"],
    searchTerms: ["word", "count", "counter", "character", "characters", "letters", "essay", "reading time", "speaking time", "sentence", "paragraph", "text", "length"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    category: "productivity",
    icon: "key",
    short: "Generate strong, random passwords using cryptographically secure randomness.",
    intro:
      "Create strong, random passwords in one click. Choose the length and character types, generate several at once and copy them instantly — nothing is ever stored or sent.",
    what:
      "A password generator creates random passwords that are hard for people and computers to guess. ZSpace Tools' Password Generator builds each password from a cryptographically secure random source in your browser, and shows its strength as bits of entropy.",
    how:
      "Characters are chosen using crypto.getRandomValues, the Web Crypto API's secure random number generator. Rejection sampling removes modulo bias, so every allowed character is exactly equally likely. When several character types are selected, the password is guaranteed to include at least one of each, and the result is shuffled with an unbiased Fisher–Yates shuffle.",
    seo: {
      title: "Password Generator — Strong, Secure Random Passwords",
      description:
        "Free secure password generator. Create strong random passwords with custom length, numbers and symbols using crypto-secure randomness. Nothing is stored.",
      keyword: "password generator",
      secondary: ["secure password generator", "random password generator", "strong password generator"],
    },
    features: [
      { title: "Cryptographically secure", body: "Uses crypto.getRandomValues — never Math.random — with rejection sampling to avoid bias." },
      { title: "Fully configurable", body: "Lengths from 6 to 128 characters with uppercase, lowercase, numbers and symbols." },
      { title: "Readable when you need it", body: "Exclude look-alike characters such as I, l, 1, O and 0 for passwords you have to type by hand." },
      { title: "Bulk generation", body: "Create up to 20 passwords at once, each with its own copy button." },
      { title: "Strength you can understand", body: "Entropy in bits and an estimated offline cracking time, explained plainly." },
      { title: "Nothing stored, nothing sent", body: "Passwords exist only in this page's memory. They are not logged, saved or included in analytics." },
    ],
    steps: [
      { title: "Set the length", body: "Drag the slider. 16 characters or more is a good default for online accounts." },
      { title: "Choose character types", body: "Toggle uppercase, lowercase, numbers and symbols, and optionally exclude ambiguous characters." },
      { title: "Copy and save it", body: "Copy a password and store it in a password manager straight away." },
    ],
    specs: [
      { label: "Random source", value: "crypto.getRandomValues (Web Crypto API)" },
      { label: "Bias handling", value: "Rejection sampling, unbiased Fisher–Yates shuffle" },
      { label: "Length", value: "6 – 128 characters" },
      { label: "Batch size", value: "1 – 20 passwords" },
      { label: "Symbol set", value: "!@#$%^&*()-_=+[]{};:,.<>?/~" },
      { label: "Network / storage", value: "None — generated and kept in memory only" },
    ],
    formats: ["Plain text"],
    privacy:
      "Passwords are generated in your browser and exist only in the page's memory. They are never sent to a server, written to storage, logged or passed to analytics.",
    faqs: [
      { q: "Is this password generator safe to use?", a: "Yes. Passwords are created in your browser with the Web Crypto API's secure random generator and are never transmitted or saved. You can load the page and then go offline — it keeps working." },
      { q: "How long should a strong password be?", a: "For online accounts, at least 16 random characters using mixed character types. That gives over 100 bits of entropy, far beyond what can be guessed. For a master password you must type often, consider a longer passphrase." },
      { q: "What does entropy mean?", a: "Entropy measures how unpredictable a password is, in bits. Each extra bit doubles the number of guesses an attacker would need. Around 80 bits is strong; 100 bits or more is excellent for random passwords." },
      { q: "Why exclude ambiguous characters?", a: "Characters like I, l, 1, O and 0 look alike in many fonts. Excluding them helps when a password must be read aloud or typed from paper, at the cost of a slightly smaller character set." },
      { q: "Why not use Math.random?", a: "Math.random is not designed for security and its output can be predictable. crypto.getRandomValues is designed for exactly this purpose." },
      { q: "Is it free and does it work on mobile?", a: "It is free, requires no sign-up or installation, and works in every modern mobile and desktop browser." },
    ],
    related: ["uuid-generator", "qr-code-generator", "word-counter"],
    searchTerms: ["password", "generator", "random", "secure", "strong", "passphrase", "secret", "key", "security", "login"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    category: "image",
    icon: "resize",
    short: "Resize JPG, PNG and WebP images by pixels, percentage or social media preset.",
    intro:
      "Resize images to exact pixel dimensions, by percentage or to a social media preset — one image or a whole batch, without stretching, right in your browser.",
    what:
      "An image resizer changes the pixel dimensions of an image — its width and height — so it fits a website, a document or a social media post. ZSpace Tools' Image Resizer resizes JPG, PNG and WebP images by exact pixels, by percentage, or to a preset such as Instagram portrait (1080 × 1350), and keeps the aspect ratio so nothing is stretched.",
    how:
      "Each image is decoded by your browser with its orientation corrected, drawn onto a canvas at the new size using high-quality resampling, and re-encoded in the format you choose. With the aspect ratio locked, height follows width automatically. When a preset's shape differs from your photo, the image is either cropped from the centre to fill the frame or fitted inside it with padding — it is never distorted.",
    seo: {
      title: "Free Image Resizer Online – Resize JPG, PNG and WebP | ZSpace Tools",
      description:
        "Resize images online free. Change JPG, PNG and WebP dimensions by pixels, percentage or social media preset without stretching. Batch ZIP download.",
      keyword: "Image Resizer",
      secondary: [
        "resize image online",
        "image size resizer",
        "resize JPG online",
        "resize PNG online",
        "resize image by pixels",
        "resize multiple images",
        "image dimension changer",
        "social media image resizer",
      ],
    },
    features: [
      { title: "Pixels, percent or preset", body: "Type an exact width and height, scale by a percentage, or pick a social media preset." },
      { title: "No stretching", body: "Lock the aspect ratio so height follows width. Presets crop to fill or fit with padding — never distort." },
      { title: "Batch resizing", body: `Resize up to ${limits.maxImages} images at once with the same settings, then download them individually or as a ZIP.` },
      { title: "Social media presets", body: "Instagram square, portrait and Story, YouTube thumbnail, Facebook cover and LinkedIn post sizes, one click away." },
      { title: "Format and quality control", body: "Keep the original format or convert to JPG, PNG or WebP, with a quality setting for JPG and WebP." },
      { title: "Transparency kept", body: "PNG and WebP output keeps transparent areas. JPG has no transparency, so it is flattened onto white." },
    ],
    steps: [
      { title: "Add your images", body: "Drop JPG, PNG or WebP files onto the upload area, or click to choose them." },
      { title: "Choose the new size", body: "Enter pixels with the aspect ratio locked, set a percentage, or pick a preset." },
      { title: "Check and download", body: "Compare original and new dimensions and file sizes, then download each image or all of them as a ZIP." },
    ],
    specs: [
      { label: "Input formats", value: "JPG, JPEG, PNG, WebP" },
      { label: "Output formats", value: "Original, JPG, PNG, WebP" },
      { label: "Size range", value: "1 – 16,384 px per side, up to 50 MP" },
      { label: "Max file size", value: `${MAX_IMG} per image` },
      { label: "Max files per batch", value: String(limits.maxImages) },
      { label: "Processing", value: "In your browser (createImageBitmap, Canvas API)" },
    ],
    formats: ["JPG", "JPEG", "PNG", "WebP"],
    privacy:
      "Images are resized entirely on your device and are never uploaded. They are discarded when you close or reload the page.",
    faqs: [
      { q: "How do I resize an image online?", a: "Add the image to the Image Resizer, enter the new width in pixels (the height updates automatically while the aspect ratio is locked), or choose a percentage or preset. Then download the resized file. It takes a few seconds and nothing is uploaded." },
      { q: "How do I resize an image without stretching it?", a: "Keep the aspect ratio locked and change only the width or the height — the other side is calculated for you. For presets with a different shape, choose Crop to fill or Fit inside; neither option distorts the image." },
      { q: "Can I resize multiple images at once?", a: `Yes. Add up to ${limits.maxImages} images and they are all resized with the same settings. With the aspect ratio locked, each image keeps its own proportions. Download them one by one or together as a ZIP.` },
      { q: "What dimensions should I use for Instagram?", a: "Commonly used sizes are 1080 × 1080 px for square posts, 1080 × 1350 px for portrait posts and 1080 × 1920 px for Stories and Reels. These are suggestions: platforms change their specifications, so check their current guidance for important campaigns." },
      { q: "Will resizing reduce image quality?", a: "Making an image smaller keeps it sharp. Making it larger than the original cannot add detail, so upscaled images look softer — the tool warns you when that happens." },
      { q: "Is the Image Resizer free and does it work on mobile?", a: "Yes. It is free, needs no account or installation, and works in modern browsers on phones, tablets and computers." },
    ],
    related: ["image-cropper", "image-compressor", "image-to-pdf"],
    searchTerms: ["resize", "resizer", "image", "photo", "picture", "dimensions", "width", "height", "pixels", "px", "scale", "instagram", "youtube", "thumbnail", "facebook", "linkedin", "social", "smaller", "bigger"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-merger",
    name: "PDF Merger",
    category: "pdf",
    icon: "merge",
    short: "Combine multiple PDF files into one document, in the order you choose.",
    intro:
      "Combine PDF files into a single document. Drag them into order, check page counts, and merge — all inside your browser, with nothing uploaded.",
    what:
      "A PDF merger combines several PDF files into one document. ZSpace Tools' PDF Merger joins your PDFs in the order you set, keeping every page exactly as it was, and gives you a single file to download.",
    how:
      "Each PDF is opened in your browser with pdf-lib, which reads its page count and checks that it can be read. When you merge, the pages of each file are copied — not re-rendered — into a new PDF in your chosen order, so text, images and vector graphics stay identical. The result is only offered once a valid PDF has been written and re-opened successfully.",
    seo: {
      title: "Free PDF Merger Online – Combine Multiple PDF Files | ZSpace Tools",
      description:
        "Merge PDF files online free. Combine multiple PDFs into one, reorder them by drag and drop, and download the merged PDF. Runs in your browser — no upload.",
      keyword: "PDF Merger",
      secondary: ["merge PDF online", "combine PDF files", "join PDF files", "merge multiple PDFs", "combine PDF documents into one"],
    },
    features: [
      { title: "Drag to reorder", body: "Arrange files by dragging the handle, or use the move up and down buttons — fully keyboard accessible." },
      { title: "Pages kept exactly", body: "Pages are copied, not converted, so text stays selectable and images keep their original quality." },
      { title: "See before you merge", body: "Every file shows its first page, page count and size. Open any PDF to check it." },
      { title: "Verified output", body: "The merged file is re-opened and its page count checked before it is offered for download." },
      { title: "Clear problem reports", body: "Damaged, empty and password-protected PDFs are flagged and left out, with a reason." },
      { title: "Private by design", body: "Merging happens on your device. Your documents are never uploaded." },
    ],
    steps: [
      { title: "Add your PDFs", body: `Drop up to ${MAX_PDFS} PDF files onto the upload area, or click to choose them.` },
      { title: "Put them in order", body: "Drag files by their handle or use the arrow buttons. The first file's pages come first." },
      { title: "Merge and download", body: "Press Merge PDFs, name the file if you like, then download your combined PDF." },
    ],
    specs: [
      { label: "Input format", value: "PDF (unencrypted)" },
      { label: "Max files", value: String(MAX_PDFS) },
      { label: "Max file size", value: `${MAX_PDF} per file, ${limits.mergeMaxMB} MB combined` },
      { label: "Page handling", value: "Copied unchanged (no re-rendering)" },
      { label: "Output", value: "One PDF, pages in your chosen order" },
      { label: "Processing", value: "In your browser (pdf-lib)" },
    ],
    formats: ["PDF"],
    privacy: "Your PDFs are read and merged entirely in your browser. They are never uploaded to a server, and nothing is kept after you leave the page.",
    faqs: [
      { q: "How do I combine PDF files?", a: "Add your PDFs to the PDF Merger, arrange them in the order you want, and press Merge PDFs. The combined file is ready to download in seconds." },
      { q: "Can I merge multiple PDFs at once?", a: `Yes. You can merge up to ${MAX_PDFS} PDF files in one go, with a combined size of up to ${limits.mergeMaxMB} MB.` },
      { q: "Can I change the order of PDF files?", a: "Yes. Drag each file by its handle, or use the up and down arrow buttons. Pages appear in the merged PDF in exactly that order." },
      { q: "Is PDF merging free?", a: "Yes. The PDF Merger is free with no sign-up, no watermark and no daily limit." },
      { q: "Will merging change my pages?", a: "No. Pages are copied as they are, so text, fonts, images and links on each page are preserved. Bookmarks and form fields from the original files are not carried over." },
      { q: "Can I merge password-protected PDFs?", a: "Not directly. Encrypted PDFs are detected and skipped. Remove the password in the app that created the file, then add it again." },
    ],
    related: ["pdf-splitter", "pdf-compressor", "image-to-pdf"],
    searchTerms: ["merge", "merger", "combine", "join", "pdf", "pdfs", "together", "one file", "append", "documents", "multiple"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-splitter",
    name: "PDF Splitter",
    category: "pdf",
    icon: "split",
    short: "Extract pages or split a PDF into single pages or equal groups.",
    intro:
      "Extract specific pages from a PDF, split every page into its own file, or divide a document into equal groups — with page previews and ZIP download.",
    what:
      "A PDF splitter separates one PDF into smaller documents. ZSpace Tools' PDF Splitter can extract chosen pages and ranges (such as 1, 3, 5-8) into a new PDF, save every page as its own file, or split a document into groups of a set number of pages.",
    how:
      "Your PDF is opened in your browser. pdf.js draws page thumbnails so you can see what you are selecting, and pdf-lib copies the chosen pages into new PDF files without re-rendering them, so content is preserved exactly. Page ranges are checked against the document before anything is created.",
    seo: {
      title: "Free PDF Splitter Online – Extract and Separate PDF Pages | ZSpace Tools",
      description:
        "Split PDF files online free. Extract pages or ranges like 1, 3, 5-8, split every page or divide a PDF into equal groups. Page previews and ZIP download.",
      keyword: "PDF Splitter",
      secondary: ["split PDF online", "extract PDF pages", "separate PDF pages", "split PDF into multiple files", "PDF page extractor", "divide PDF into smaller files"],
    },
    features: [
      { title: "Three ways to split", body: "Extract selected pages, split every page into its own PDF, or split into groups of N pages." },
      { title: "Visual page picker", body: "Click page thumbnails to select them, or type ranges like 1, 3, 5-8 — the two stay in sync." },
      { title: "One file or many", body: "Extract several ranges into a single PDF, or create a separate PDF for each range." },
      { title: "Validated ranges", body: "Ranges are checked before splitting, with plain-language errors for pages that don't exist." },
      { title: "Download how you like", body: "Download each result individually or everything together as a ZIP." },
      { title: "Pages untouched", body: "Pages are copied, not re-rendered, so text and images keep their original quality." },
    ],
    steps: [
      { title: "Add a PDF", body: "Drop one PDF onto the upload area. Page thumbnails appear so you can see the document." },
      { title: "Choose how to split", body: "Select pages or type ranges, split every page, or set a group size." },
      { title: "Split and download", body: "Press Split PDF, then download individual files or a ZIP of all of them." },
    ],
    specs: [
      { label: "Input format", value: "PDF (unencrypted)" },
      { label: "Max file size", value: MAX_PDF },
      { label: "Range syntax", value: "1, 3, 5-8 · open ranges 10- and -3" },
      { label: "Modes", value: "Extract pages · Every page · Groups of N" },
      { label: "Output", value: "PDF files, or a ZIP of several" },
      { label: "Processing", value: "In your browser (pdf-lib, pdf.js previews)" },
    ],
    formats: ["PDF", "ZIP"],
    privacy: "Your PDF is split entirely in your browser. It is never uploaded to a server, and nothing is stored after you leave the page.",
    faqs: [
      { q: "How do I extract pages from a PDF?", a: "Add the PDF, choose Extract pages, then click the page thumbnails you want or type them as ranges, for example 1, 3, 5-8. Press Split PDF to get a new PDF containing only those pages." },
      { q: "Can I split every PDF page into a separate file?", a: "Yes. Choose Every page and each page becomes its own PDF. Download them individually or all together as a ZIP." },
      { q: "How do I extract a specific page range?", a: "Type the range with a hyphen, such as 5-8 for pages 5 to 8. Combine ranges with commas (1-3, 10-12), or use open ranges like 10- for page 10 to the end." },
      { q: "Can I download multiple split PDFs at once?", a: "Yes. When a split produces more than one file, Download all (ZIP) packages them into a single ZIP file." },
      { q: "Will splitting reduce quality?", a: "No. Pages are copied exactly as they are, so text stays selectable and images are not recompressed." },
      { q: "Is the PDF Splitter free and private?", a: "It is free with no sign-up, and your PDF is processed on your own device — it is never uploaded." },
    ],
    related: ["pdf-merger", "pdf-compressor", "image-to-pdf"],
    searchTerms: ["split", "splitter", "extract", "separate", "pages", "page", "pdf", "range", "divide", "cut", "remove pages", "single page"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "image-pdf",
    short: "Turn JPG, PNG and WebP images into one PDF, with page size, margins and order.",
    intro:
      "Convert JPG, PNG and WebP images into a single PDF. Reorder pages, choose A4, Letter or fit-to-image, set margins and orientation — then download.",
    what:
      "An image to PDF converter places one or more pictures onto PDF pages so they can be shared, printed or submitted as a single document. ZSpace Tools' Image to PDF Converter turns JPG, PNG and WebP images into one PDF with your choice of page size, orientation, margins and image placement.",
    how:
      "Images are read in your browser. JPG and PNG files are embedded directly, so their quality is unchanged; JPGs whose camera orientation needs correcting, and WebP files (which PDF does not support natively), are converted on a canvas first. Each image is placed on its page by fitting, filling or keeping its natural size — always preserving its proportions — and the PDF is assembled with pdf-lib.",
    seo: {
      title: "Free Image to PDF Converter Online – Convert JPG and PNG to PDF | ZSpace Tools",
      description:
        "Convert images to PDF online free. Combine JPG, PNG and WebP into one PDF with A4, Letter or custom pages, margins and orientation. Runs in your browser.",
      keyword: "Image to PDF Converter",
      secondary: ["JPG to PDF", "JPEG to PDF", "PNG to PDF", "convert image to PDF online", "multiple images to PDF", "photos to PDF"],
    },
    features: [
      { title: "Many images, one PDF", body: `Combine up to ${limits.maxImages} JPG, PNG and WebP images, one image per page.` },
      { title: "Your page order", body: "Drag images into order or use the arrow buttons. The live preview updates as you go." },
      { title: "Page sizes", body: "A4, US Letter, pages that match each image exactly, or custom dimensions in millimetres." },
      { title: "Orientation and margins", body: "Portrait, landscape or automatic per image, with no, small, medium or large margins." },
      { title: "No distortion", body: "Fit inside the page, fill the page (cropping the overflow), or keep the image at its natural size." },
      { title: "Original quality", body: "JPG and PNG images are embedded without recompression. Phone photos are rotated correctly." },
    ],
    steps: [
      { title: "Add images", body: "Drop JPG, PNG or WebP images onto the upload area, or click to choose them." },
      { title: "Arrange and set up pages", body: "Reorder the images, then choose page size, orientation, margins and how images fit." },
      { title: "Create the PDF", body: "Name your file, press Create PDF and download it." },
    ],
    specs: [
      { label: "Input formats", value: "JPG, JPEG, PNG, WebP" },
      { label: "Page sizes", value: "A4 (210 × 297 mm), Letter (8.5 × 11 in), fit to image, custom" },
      { label: "Orientation", value: "Auto, portrait, landscape" },
      { label: "Margins", value: "0, 6, 12 or 20 mm" },
      { label: "Image placement", value: "Fit, fill (crop), original size (96 dpi)" },
      { label: "Processing", value: "In your browser (pdf-lib, Canvas API for WebP)" },
    ],
    formats: ["JPG", "JPEG", "PNG", "WebP", "PDF"],
    privacy: "Your images are converted to PDF entirely in your browser. They are never uploaded to a server and are discarded when you leave the page.",
    faqs: [
      { q: "How do I convert JPG to PDF?", a: "Add your JPG images to the Image to PDF Converter, choose a page size such as A4, and press Create PDF. Each image becomes a page in one PDF, ready to download." },
      { q: "Can I combine multiple images into one PDF?", a: `Yes. Add up to ${limits.maxImages} images, drag them into the right order, and they are combined into a single PDF with one image per page.` },
      { q: "Can I convert PNG to PDF?", a: "Yes. PNG images are embedded directly, including transparent areas, which appear over the white page. WebP images are supported too." },
      { q: "Can I change the PDF page orientation?", a: "Yes. Choose portrait or landscape for every page, or Auto to match each image's own orientation." },
      { q: "Will my images be stretched or lose quality?", a: "No. Images keep their proportions in every placement mode, and JPG and PNG files are embedded without recompression. Only WebP images and rotated JPGs are re-encoded, at high quality." },
      { q: "Is it free and does it work on my phone?", a: "Yes. It is free, needs no sign-up or installation, and works in modern mobile and desktop browsers — handy for turning photos of receipts or documents into a PDF." },
    ],
    related: ["pdf-merger", "image-resizer", "image-compressor"],
    searchTerms: ["image to pdf", "jpg to pdf", "jpeg to pdf", "png to pdf", "webp to pdf", "photo to pdf", "pictures", "convert", "converter", "images", "scan", "receipt", "pdf"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    category: "calculators",
    icon: "percent",
    short: "Work out percentages, increases, decreases, differences and discounts instantly.",
    intro:
      "Calculate any percentage in seconds: X% of a number, what percentage one number is of another, increases, decreases, percentage difference and discounts — with the formula shown.",
    what:
      "A percentage calculator works out answers to everyday percentage questions without manual maths. ZSpace Tools' Percentage Calculator has six modes — percentage of a number, what percentage X is of Y, percentage increase, percentage decrease, percentage difference and discount — and shows the formula and each step.",
    how:
      "Results update as you type. Each mode applies a standard formula: X% of Y = Y × X ÷ 100; X as a percentage of Y = X ÷ Y × 100; change = (new − original) ÷ |original| × 100; and percentage difference = |A − B| ÷ ((A + B) ÷ 2) × 100. Inputs are validated, so dividing by zero or entering text gives a clear message instead of an error.",
    seo: {
      title: "Free Percentage Calculator Online – Calculate Percentages Easily | ZSpace Tools",
      description:
        "Free percentage calculator: X% of a number, what percent X is of Y, percentage increase, decrease, difference and discounts — with formulas shown.",
      keyword: "Percentage Calculator",
      secondary: [
        "calculate percentage online",
        "percentage increase calculator",
        "percentage decrease calculator",
        "what percentage is X of Y",
        "percentage difference calculator",
        "discount calculator",
        "find percentage of a number",
      ],
    },
    features: [
      { title: "Six calculators in one", body: "X% of Y, X as a percent of Y, increase, decrease, percentage difference and discount." },
      { title: "Instant results", body: "Answers update as you type, in large, easy-to-read numbers." },
      { title: "Formula and steps", body: "Every result shows the formula used and the working, so you can check it or learn it." },
      { title: "Discount breakdown", body: "Enter a price and a discount to see the amount saved and the final price." },
      { title: "Handles edge cases", body: "Decimals, negative numbers and zero are handled properly — you never see NaN or Infinity." },
      { title: "Copy in one click", body: "Copy the result to paste into a spreadsheet, message or document." },
    ],
    steps: [
      { title: "Pick a calculation", body: "Choose the tab that matches your question, such as Increase or Discount." },
      { title: "Enter your numbers", body: "Type the values. Decimals and thousands separators are fine." },
      { title: "Read the answer", body: "See the result, the formula and the working, then copy it if you need it." },
    ],
    specs: [
      { label: "Modes", value: "X% of Y · X is what % of Y · Increase · Decrease · Difference · Discount" },
      { label: "Change formula", value: "(new − original) ÷ |original| × 100" },
      { label: "Difference formula", value: "|A − B| ÷ ((A + B) ÷ 2) × 100" },
      { label: "Precision", value: "Up to 6 decimal places, trailing zeros removed" },
      { label: "Input", value: "Decimals, negatives, thousands separators" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Numbers"],
    privacy: "Calculations happen in your browser. The numbers you enter are not sent or stored anywhere.",
    faqs: [
      { q: "How do I calculate a percentage of a number?", a: "Multiply the number by the percentage and divide by 100. For example, 20% of 500 is 500 × 20 ÷ 100 = 100." },
      { q: "How do I find what percentage one number is of another?", a: "Divide the part by the whole and multiply by 100. For example, 50 is 50 ÷ 200 × 100 = 25% of 200." },
      { q: "How do I calculate percentage increase?", a: "Subtract the original value from the new value, divide by the original value and multiply by 100. From 100 to 150 is (150 − 100) ÷ 100 × 100 = a 50% increase." },
      { q: "How do I calculate percentage decrease?", a: "Subtract the new value from the original, divide by the original and multiply by 100. From 200 to 150 is (200 − 150) ÷ 200 × 100 = a 25% decrease." },
      { q: "What is percentage difference?", a: "Percentage difference compares two values without treating either as the starting point. It is the absolute difference divided by their average, times 100: for 40 and 60, that is 20 ÷ 50 × 100 = 40%." },
      { q: "How do I calculate a discount?", a: "Multiply the price by the discount percentage and divide by 100 to get the amount saved, then subtract it from the price. A 25% discount on 80 saves 20, so you pay 60." },
    ],
    related: ["emi-calculator", "gst-calculator", "unit-converter"],
    searchTerms: ["percent", "percentage", "%", "calculator", "calculate", "increase", "decrease", "difference", "change", "growth", "math", "maths"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter & Validator",
    category: "developer",
    icon: "braces",
    short: "Beautify, minify and validate JSON, with exact line and column for every error.",
    intro:
      "Format, beautify, minify and validate JSON in your browser. Errors are pinpointed by line and column with a plain-language fix — and your data is never altered or uploaded.",
    what:
      "A JSON formatter (or JSON beautifier) adds consistent indentation and line breaks to JSON so it is easy to read, and a JSON validator checks that it follows the JSON standard. ZSpace Tools' JSON Formatter does both, and can also minify JSON by removing all unnecessary whitespace.",
    how:
      "Your JSON is checked by your browser's native JSON parser, and a strict standard-compliant tokenizer finds the exact line and column of any error. Formatting re-prints the original tokens with new whitespace only — numbers, strings and escapes are kept exactly as you wrote them. That matters: converting through JavaScript objects would silently round very large numbers such as IDs and drop duplicate keys.",
    seo: {
      title: "JSON Formatter & Validator Online – Free JSON Beautifier | ZSpace Tools",
      description:
        "Format, beautify, minify and validate JSON online for free. Find JSON syntax errors instantly with a simple, easy-to-use JSON formatter.",
      keyword: "JSON formatter",
      secondary: ["JSON validator", "JSON beautifier online", "free online JSON formatter", "minify JSON", "JSON pretty print", "JSON syntax checker"],
    },
    features: [
      { title: "Beautify, minify, validate", body: "Pretty-print with 2 spaces, 4 spaces or tabs, minify to a single line, or just check validity." },
      { title: "Errors you can act on", body: "Line, column, the offending text and a plain-language hint for trailing commas, single quotes, missing commas and more." },
      { title: "Lossless output", body: "Only whitespace changes. Large integers, decimals like 1.0 and escape sequences are kept exactly as written." },
      { title: "Helpful warnings", body: "Flags duplicate keys and integers too large for JavaScript to represent exactly — valid JSON that often causes bugs." },
      { title: "Files in and out", body: "Open a .json file from your device, copy the result, or download it as a .json file." },
      { title: "Private by design", body: "Validation and formatting run in your browser. Pasted JSON — including API keys or customer data — is never sent anywhere." },
    ],
    steps: [
      { title: "Paste or open JSON", body: "Paste into the editor, open a .json file, or load the sample." },
      { title: "Choose an action", body: "Beautify with your preferred indentation, minify, or validate. Status updates as you type." },
      { title: "Fix, copy or download", body: "Jump to any error, then copy the output or download it as a .json file." },
    ],
    specs: [
      { label: "Standard", value: "RFC 8259 / ECMA-404 JSON" },
      { label: "Indentation", value: "2 spaces, 4 spaces, tab, or minified" },
      { label: "Error location", value: "Line and column, all browsers" },
      { label: "Max file size", value: "10 MB" },
      { label: "Data handling", value: "Tokens re-printed verbatim (lossless)" },
      { label: "Processing", value: "In your browser (native JSON.parse + tokenizer)" },
    ],
    formats: ["JSON"],
    privacy: "Your JSON is validated and formatted entirely in your browser. It is not uploaded, logged or stored.",
    examples: [
      { title: "Trailing comma", body: 'Input {"a": 1,} is invalid. The validator reports "Trailing comma before }" at line 1, column 9 and suggests removing the comma after the last property.' },
      { title: "Big numbers stay exact", body: 'Formatting {"id":9007199254740993} keeps the id exactly. A JSON.parse → JSON.stringify round trip would change it to 9007199254740992.' },
      { title: "Minify", body: 'A 12-line pretty-printed object becomes {"store":"ZSpace Coffee","open":true,…} on one line — ideal for configs, URLs and request bodies.' },
    ],
    faqs: [
      { q: "How do I format JSON online?", a: "Paste your JSON into the editor and press Beautify. Choose 2 spaces, 4 spaces or tabs for indentation, then copy or download the formatted JSON." },
      { q: "How do I check if my JSON is valid?", a: "Paste it in — the status shows Valid JSON or Invalid JSON as you type. If it's invalid, you'll see the line and column of the first error and a suggested fix." },
      { q: "What are the most common JSON errors?", a: "Trailing commas after the last item, single quotes instead of double quotes, unquoted property names, missing commas between items, mismatched brackets, and comments — JSON doesn't allow comments." },
      { q: "Does formatting change my data?", a: "No. Only whitespace changes. Numbers, strings and escape sequences are kept exactly as written, so even very large integer IDs aren't rounded." },
      { q: "What does minify JSON mean?", a: "Minifying removes all spaces and line breaks that aren't inside strings, producing the smallest equivalent JSON — useful for APIs, configs and storage." },
      { q: "Is it safe to paste sensitive JSON here?", a: "Yes. Everything runs in your browser and nothing you paste is uploaded or stored. You can disconnect from the internet after the page loads and it still works." },
    ],
    related: ["csv-to-json", "base64-encoder-decoder", "url-encoder-decoder"],
    searchTerms: ["json", "format", "formatter", "beautify", "beautifier", "pretty", "print", "validate", "validator", "lint", "minify", "parse", "api", "developer", "syntax"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    category: "calculators",
    icon: "cake",
    short: "Find your exact age in years, months and days, plus your next birthday.",
    intro:
      "Calculate your exact age from your date of birth — in years, months and days — with total days lived, your next birthday and the weekday you were born. Works between any two dates, too.",
    what:
      "An age calculator works out the time between a date of birth and another date, usually today. ZSpace Tools' Age Calculator gives your exact age in completed years, months and days, along with totals in months, weeks and days, your next birthday and the day of the week you were born.",
    how:
      "Age is counted on the calendar, not by dividing days by 365. The calculator finds how many whole months fit between the two dates — stepping forward from your birth date one calendar month at a time — then counts the remaining days. If your birth day doesn't exist in a month (for example the 31st, or 29 February), that month is completed on the month's last day. So a 29 February birthday falls on 28 February in common years.",
    seo: {
      title: "Age Calculator Online – Calculate Exact Age in Years, Months & Days",
      description:
        "Calculate your exact age online using your date of birth. Find your age in years, months and days, next birthday and total days lived for free.",
      keyword: "age calculator",
      secondary: ["exact age calculator", "age calculator by date of birth", "how old am I", "date of birth calculator", "days between dates", "birthday calculator"],
    },
    features: [
      { title: "Exact calendar age", body: "Completed years, months and days — calculated on the calendar, not estimated from 365-day years." },
      { title: "Totals that add up", body: "Total months, weeks and days lived, with completed years shown separately so nothing is double-counted." },
      { title: "Next birthday countdown", body: "The date of your next birthday, the age you'll turn and how many days are left." },
      { title: "Leap-year aware", body: "Leap years are counted exactly, and 29 February birthdays are handled consistently." },
      { title: "Any two dates", body: "Switch to date difference mode to measure the time between any two dates, past or future." },
      { title: "Nothing stored", body: "Your date of birth stays in your browser — it isn't sent, saved or tracked." },
    ],
    steps: [
      { title: "Enter your date of birth", body: "Type it or pick it from the calendar." },
      { title: "Check the reference date", body: "It's today by default. Change it to see your age on any other date." },
      { title: "Read your age", body: "See years, months and days, totals, your next birthday and the weekday you were born." },
    ],
    specs: [
      { label: "Method", value: "Calendar months + remaining days" },
      { label: "Month-end rule", value: "Missing days clamp to the month's last day" },
      { label: "29 February", value: "Birthday on 28 Feb in common years" },
      { label: "Calendar", value: "Gregorian, years 1–9999" },
      { label: "Modes", value: "Age from date of birth · Difference between two dates" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Dates"],
    privacy: "Dates are calculated in your browser. Your date of birth is never sent, stored or included in analytics.",
    examples: [
      { title: "An ordinary birthday", body: "Born 15 May 1990, on 12 November 2026: 36 years, 5 months and 28 days old — 13,330 days in total." },
      { title: "29 February", body: "Born 29 February 2000, on 28 February 2023: exactly 23 years old, because a leap-day birthday is celebrated on 28 February in common years." },
      { title: "Month ends", body: "From 31 January to 28 February counts as one full month (February has no 31st). From 31 January to 31 March is two months." },
    ],
    faqs: [
      { q: "How do I calculate my exact age?", a: "Enter your date of birth. The calculator counts the whole calendar months between your birth date and today, then the remaining days, and shows the result as years, months and days." },
      { q: "How is age calculated in years, months and days?", a: "Completed years and months are counted on the calendar from your birth date; leftover days are counted exactly. It doesn't divide by 365, so leap years and different month lengths are handled correctly." },
      { q: "How are 29 February birthdays handled?", a: "In common years, a 29 February birthday is treated as falling on 28 February. Conventions differ between countries and organisations, so check the rule that applies to you for legal purposes." },
      { q: "Can I calculate the time between any two dates?", a: "Yes. Switch to Date difference and enter any start and end dates — including future dates — to get the gap in years, months, days, weeks and total days." },
      { q: "What day of the week was I born?", a: "The calculator shows it automatically below your age." },
      { q: "Is my date of birth stored?", a: "No. The calculation happens in your browser and your date of birth is not sent anywhere." },
    ],
    related: ["days-between-dates", "percentage-calculator", "gst-calculator"],
    searchTerms: ["age", "calculator", "birthday", "date of birth", "dob", "how old", "years", "months", "days", "born", "date difference", "days between", "anniversary"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "gst-calculator",
    name: "GST Calculator",
    category: "calculators",
    icon: "receipt",
    short: "Add or remove GST, with CGST, SGST and IGST breakdowns in Indian rupees.",
    intro:
      "Add GST to a price or remove GST from an inclusive amount in seconds. See the taxable value, CGST and SGST or IGST, and the invoice total — formatted in rupees, ready to copy.",
    what:
      "A GST calculator works out Goods and Services Tax on an amount. ZSpace Tools' GST Calculator adds GST to a GST-exclusive price, or extracts the GST already included in a price, and splits the tax into CGST and SGST for intra-state supplies or shows IGST for inter-state supplies, as used in India.",
    how:
      "To add GST: GST = amount × rate ÷ 100, and the total is the amount plus GST. To remove GST from an inclusive price: taxable value = total × 100 ÷ (100 + rate), and GST is the difference — not the rate applied to the inclusive price, which would overstate the tax. For intra-state supplies the GST is split equally into CGST and SGST; for inter-state supplies it is charged as IGST. Amounts are calculated in paise and rounded to the nearest paisa so every line adds up.",
    seo: {
      title: "GST Calculator India – Calculate GST Inclusive & Exclusive Prices",
      description:
        "Free GST calculator for India. Calculate GST amounts, inclusive and exclusive prices, CGST, SGST and IGST with different GST rates instantly.",
      keyword: "GST calculator",
      secondary: ["GST calculator India", "GST inclusive calculator", "GST exclusive calculator", "reverse GST calculator", "CGST SGST calculator", "IGST calculator", "remove GST from price"],
    },
    features: [
      { title: "Add or remove GST", body: "Work forwards from a GST-exclusive price, or backwards from a GST-inclusive amount." },
      { title: "CGST, SGST or IGST", body: "Switch between intra-state (CGST + SGST, split equally) and inter-state (IGST) supplies." },
      { title: "Rate presets and custom rates", body: "One-tap 0%, 5%, 12%, 18%, 28% and 40% presets, or any custom rate such as 3% or 0.25%." },
      { title: "Indian formatting", body: "Rupee amounts in the Indian numbering system, such as ₹12,34,567.50." },
      { title: "Exact to the paisa", body: "Calculated in whole paise, so taxable value + GST always equals the invoice total." },
      { title: "Copy or download", body: "Copy a clean breakdown or download it as a text summary for your records." },
    ],
    steps: [
      { title: "Choose Add or Remove GST", body: "Add GST to a net price, or remove GST from a price that already includes it." },
      { title: "Enter the amount and rate", body: "Type the amount, then tap a rate preset or enter a custom rate." },
      { title: "Pick the supply type", body: "Intra-state shows CGST and SGST; inter-state shows IGST. Copy or download the breakdown." },
    ],
    specs: [
      { label: "Add GST", value: "GST = amount × rate ÷ 100" },
      { label: "Remove GST", value: "Taxable = total × 100 ÷ (100 + rate)" },
      { label: "Intra-state", value: "CGST = SGST = GST ÷ 2" },
      { label: "Inter-state", value: "IGST = GST" },
      { label: "Rounding", value: "Nearest paisa; components always sum to the total" },
      { label: "Currency", value: "INR, Indian number format" },
    ],
    formats: ["INR"],
    privacy: "Amounts are calculated in your browser and are not sent or stored anywhere.",
    examples: [
      { title: "Add 18% GST", body: "₹1,000 + 18% GST = ₹180 GST, total ₹1,180. Intra-state: CGST ₹90 + SGST ₹90. Inter-state: IGST ₹180." },
      { title: "Remove 18% GST", body: "From ₹1,180 inclusive: taxable value = 1,180 × 100 ÷ 118 = ₹1,000, so GST = ₹180. (Taking 18% of ₹1,180 would wrongly give ₹212.40.)" },
      { title: "Remove 5% GST", body: "From ₹2,100 inclusive: taxable value = 2,100 × 100 ÷ 105 = ₹2,000; GST ₹100 (CGST ₹50 + SGST ₹50)." },
    ],
    faqs: [
      { q: "How do I calculate GST on an amount?", a: "Multiply the amount by the GST rate and divide by 100. For ₹1,000 at 18%, GST is ₹180 and the total is ₹1,180." },
      { q: "How do I remove GST from a GST-inclusive price?", a: "Divide the inclusive price by (100 + rate) and multiply by 100 to get the taxable value; the rest is GST. For ₹1,180 at 18%: 1,180 × 100 ÷ 118 = ₹1,000, so GST is ₹180." },
      { q: "What is the difference between CGST, SGST and IGST?", a: "For a supply within one state, GST is split equally into Central GST (CGST) and State GST (SGST). For a supply between states, the full amount is Integrated GST (IGST). The total tax is the same." },
      { q: "Which GST rate should I use?", a: "It depends on the goods or services and the date of the transaction. India restructured its GST rates from 22 September 2025, moving most items to 5% or 18% and introducing a 40% rate for certain goods; 12% and 28% remain here for checking older invoices. This calculator doesn't decide the applicable rate — confirm it on the official GST portal or with a tax professional." },
      { q: "Can I use a custom GST rate?", a: "Yes. Enter any rate, such as 3% or 0.25%, in the custom rate field." },
      { q: "Is this tax advice?", a: "No. It's a calculation aid. Always verify the applicable rate, place of supply and tax treatment for your transaction." },
    ],
    related: ["invoice-generator", "emi-calculator", "percentage-calculator"],
    searchTerms: ["gst", "tax", "india", "cgst", "sgst", "igst", "inclusive", "exclusive", "invoice", "rupee", "inr", "18%", "remove gst", "add gst", "reverse gst", "calculator", "vat"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    category: "conversion",
    icon: "ruler",
    short: "Convert length, weight, temperature, area, volume, speed, time and data units.",
    intro:
      "Convert between metric and imperial units instantly — length, weight, temperature, area, volume, speed, time and digital storage — using exact conversion factors.",
    what:
      "A unit converter changes a measurement from one unit to another, such as feet to metres or Fahrenheit to Celsius. ZSpace Tools' Unit Converter covers eight categories and over 50 units, and uses the exact definitions behind each unit so results don't drift.",
    how:
      "Most units convert through a base unit using exact factors — for example 1 inch is defined as exactly 2.54 cm, 1 pound as exactly 0.45359237 kg, and 1 US gallon as exactly 3.785411784 litres. Temperature can't be converted by multiplying, so it uses the full formulas: °F = °C × 9/5 + 32 and K = °C + 273.15. Digital storage shows decimal units (1 GB = 1,000 MB) separately from binary units (1 GiB = 1,024 MiB).",
    seo: {
      title: "Unit Converter Online – Free Length, Weight, Temperature & More",
      description:
        "Convert length, weight, temperature, area, volume, speed, time and digital storage units instantly with this free online unit converter.",
      keyword: "unit converter",
      secondary: ["online unit converter", "length and weight converter", "metric converter", "cm to inches", "kg to lbs", "celsius to fahrenheit", "MB to GB"],
    },
    features: [
      { title: "Eight categories", body: "Length, weight, temperature, area, volume, speed, time and digital storage — over 50 units." },
      { title: "Exact constants", body: "Uses the official definitions (1 in = 2.54 cm, 1 lb = 0.45359237 kg), not rounded approximations." },
      { title: "Correct temperature maths", body: "Celsius, Fahrenheit and Kelvin use proper formulas, with a check against absolute zero." },
      { title: "Decimal vs binary storage", body: "kB, MB, GB, TB (×1000) are shown separately from KiB, MiB, GiB, TiB (×1024)." },
      { title: "Instant and clean", body: "Results update as you type, to 12 significant figures without floating-point noise." },
      { title: "Quick reference", body: "Swap units in one tap and see a ready-made table of common values for the current pair." },
    ],
    steps: [
      { title: "Pick a category", body: "Choose length, weight, temperature or another category." },
      { title: "Enter a value and units", body: "Type the amount and choose the units to convert from and to." },
      { title: "Read or copy the result", body: "The answer appears instantly. Swap units or copy the result in one tap." },
    ],
    specs: [
      { label: "Categories", value: "Length, weight, temperature, area, volume, speed, time, data" },
      { label: "Length basis", value: "1 in = 2.54 cm, 1 mi = 1,609.344 m (exact)" },
      { label: "Mass basis", value: "1 lb = 0.45359237 kg (exact)" },
      { label: "Volume basis", value: "1 US gal = 3.785411784 L (exact)" },
      { label: "Precision", value: "12 significant figures" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Numbers"],
    privacy: "Conversions happen in your browser. Nothing you enter is sent or stored.",
    examples: [
      { title: "Height", body: "5 ft 9 in = 69 in = 175.26 cm (69 × 2.54)." },
      { title: "Body temperature", body: "98.6 °F = 37 °C, using (°F − 32) × 5/9." },
      { title: "Storage", body: "A \"1 TB\" drive holds 1,000,000,000,000 bytes, which is about 931.32 GiB — why computers often show less space than the box says." },
    ],
    faqs: [
      { q: "How do I convert centimetres to inches?", a: "Divide by 2.54, because one inch is exactly 2.54 centimetres. For example, 30 cm ÷ 2.54 = 11.81 inches." },
      { q: "How do I convert kg to pounds?", a: "Divide by 0.45359237 (or multiply by about 2.20462). For example, 70 kg is about 154.32 lb." },
      { q: "How do I convert Celsius to Fahrenheit?", a: "Multiply by 9/5 and add 32. For example, 25 °C × 9/5 + 32 = 77 °F. To go back, subtract 32 and multiply by 5/9." },
      { q: "What's the difference between GB and GiB?", a: "A gigabyte (GB) is 1,000,000,000 bytes; a gibibyte (GiB) is 1,073,741,824 bytes (1,024³). Drive makers use GB, while many operating systems report GiB — sometimes still labelled GB." },
      { q: "Are US and UK gallons the same?", a: "No. This converter uses the US gallon (3.785 L). The UK imperial gallon is larger, at 4.546 L." },
      { q: "Is the unit converter free and does it work offline?", a: "Yes. It's free, needs no sign-up, and keeps working once the page has loaded, even without a connection." },
    ],
    related: ["percentage-calculator", "case-converter", "age-calculator"],
    searchTerms: ["unit", "convert", "converter", "conversion", "metric", "imperial", "cm", "inches", "feet", "meters", "kg", "lbs", "pounds", "celsius", "fahrenheit", "kelvin", "mph", "km/h", "liters", "gallons", "acre", "hectare", "mb", "gb", "bytes", "length", "weight", "temperature"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    category: "text",
    icon: "case",
    short: "Convert text to UPPERCASE, lowercase, Title Case, camelCase, snake_case and more.",
    intro:
      "Change text to uppercase, lowercase, Title Case, Sentence case and 10 more styles — including camelCase, snake_case and kebab-case for code — instantly and privately.",
    what:
      "A case converter changes the capitalisation or word style of text. ZSpace Tools' Case Converter handles 14 styles: everyday ones like uppercase, lowercase, Title Case and Sentence case, and programming styles like camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE.",
    how:
      "Writing styles change capitals but keep your spacing, punctuation and line breaks. Title Case follows common style-guide rules: short articles, conjunctions and prepositions stay lowercase unless they start or end the title, and acronyms (NASA) and brand names (iPhone) are left alone. Programming styles split text into words at spaces, punctuation, existing separators and camelCase boundaries, then join the words in the chosen style — line by line, so lists stay lists.",
    seo: {
      title: "Case Converter Online – Uppercase, Lowercase & Title Case",
      description:
        "Convert text to uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case and kebab-case online for free.",
      keyword: "case converter",
      secondary: ["text case converter", "convert uppercase to lowercase", "title case converter", "sentence case converter", "camelCase converter", "snake case converter"],
    },
    features: [
      { title: "14 styles", body: "UPPERCASE, lowercase, Title, Sentence and Capitalized Case, camel, Pascal, snake, kebab, CONSTANT, dot, path, aLtErNaTiNg and InVeRsE." },
      { title: "Smart Title Case", body: "Keeps small words lowercase mid-title, capitalises hyphenated words, and preserves acronyms and brand names." },
      { title: "Code-ready", body: "Splits on spaces, punctuation, existing _ - . separators and camelCase humps, so XMLHttpRequest becomes xml_http_request." },
      { title: "Respects your text", body: "Line breaks are kept, multiple spaces preserved unless you choose to tidy them, and accented letters are converted correctly." },
      { title: "Side by side", body: "See the original and converted text together, with word and character counts." },
      { title: "Copy or download", body: "Copy the result in one click or download it as a .txt file." },
    ],
    steps: [
      { title: "Paste your text", body: "Type or paste into the editor, or load the sample." },
      { title: "Pick a style", body: "Tap any case style — the result updates instantly." },
      { title: "Copy or download", body: "Copy the converted text or save it as a .txt file." },
    ],
    specs: [
      { label: "Styles", value: "14" },
      { label: "Title Case", value: "Style-guide small words, acronyms and brands kept" },
      { label: "Word splitting", value: "Spaces, punctuation, _ - . / and camelCase boundaries" },
      { label: "Unicode", value: "Full letter case mapping (e.g. ß → SS, é → É)" },
      { label: "Line breaks", value: "Preserved in every style" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Plain text", ".txt"],
    privacy: "Your text is converted in your browser. It is never uploaded, logged or stored.",
    examples: [
      { title: "Title Case", body: '"the art of war and the lord of the rings" → "The Art of War and the Lord of the Rings".' },
      { title: "From camelCase", body: '"XMLHttpRequest parser" → snake_case "xml_http_request_parser", kebab-case "xml-http-request-parser".' },
      { title: "Fix Caps Lock", body: '"HELLO WORLD. HOW ARE YOU?" → Sentence case "Hello world. How are you?"' },
    ],
    faqs: [
      { q: "How do I convert uppercase to lowercase?", a: "Paste your text and choose lowercase. Every letter changes to its small form while spacing and punctuation stay the same." },
      { q: "What is Title Case?", a: "Title Case capitalises the main words of a heading. Short articles, conjunctions and prepositions — such as a, and, of, the — stay lowercase unless they are the first or last word." },
      { q: "What's the difference between Title Case and Capitalized Case?", a: "Capitalized Case capitalises the first letter of every word, including small words like \"of\" and \"the\". Title Case keeps those small words lowercase in the middle of a title." },
      { q: "What are camelCase, snake_case and kebab-case?", a: "They're ways of joining words without spaces in code: camelCase capitalises each word after the first (userName), snake_case uses underscores (user_name), and kebab-case uses hyphens (user-name)." },
      { q: "Does it work with accented and non-English letters?", a: "Yes. It uses Unicode case rules, so letters like é, ñ and ü convert correctly, and ß becomes SS in uppercase." },
      { q: "Is my text stored?", a: "No. Conversion happens in your browser and your text is never sent anywhere." },
    ],
    related: ["url-slug-generator", "word-counter", "json-formatter"],
    searchTerms: ["case", "converter", "uppercase", "lowercase", "upper", "lower", "title case", "sentence case", "capitalize", "capitalise", "camelcase", "snake_case", "kebab", "pascal", "constant", "text", "caps"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder & Decoder",
    category: "developer",
    icon: "link",
    short: "Percent-encode or decode URLs and query parameters, including Unicode and emoji.",
    intro:
      "Encode text and URLs into URL-safe form, or decode percent-encoded strings back to readable text. Choose whole-URL or single-component encoding, with clear errors for malformed input.",
    what:
      "URL encoding (percent-encoding) replaces characters that aren't allowed or have special meaning in a URL — such as spaces, &, ? and non-English letters — with a % followed by hexadecimal byte values. ZSpace Tools' URL Encoder & Decoder uses the four standard JavaScript functions: encodeURI, encodeURIComponent, decodeURI and decodeURIComponent.",
    how:
      "Text is first converted to UTF-8 bytes, and each unsafe byte becomes %XX — so é becomes %C3%A9 and a space becomes %20. Encode URL (encodeURI) leaves characters that structure a URL, like : / ? # & =, untouched so the address still works. Encode component (encodeURIComponent) encodes those too, which is what you want for a single query value. Decoding reverses the process and reports the exact position of any malformed % sequence.",
    seo: {
      title: "URL Encoder & Decoder Online – Free URL Encoding Tool",
      description:
        "Encode and decode URLs online for free. Convert special characters, query parameters and text into URL-safe formats instantly with ZSpace Tools.",
      keyword: "URL encoder",
      secondary: ["URL decoder", "URL encode online", "percent encoding", "encodeURIComponent online", "decode URL", "query string encoder"],
    },
    features: [
      { title: "All four standard modes", body: "Encode URL, encode component, decode URL and decode component — the same functions browsers and JavaScript use." },
      { title: "Unicode and emoji", body: "Characters are encoded as UTF-8, so café becomes caf%C3%A9 and 🍰 becomes %F0%9F%8D%B0." },
      { title: "Precise errors", body: "Malformed sequences like %2G or a truncated %C3 are pinpointed instead of failing silently." },
      { title: "No accidental double-encoding", body: "You're warned when input already looks encoded, and when decoded output still contains % sequences." },
      { title: "Query parameter editor", body: "Read a URL's parameters as decoded key–value rows — repeated keys included — edit them, and get a correctly encoded URL back." },
      { title: "Plus sign control", body: "Choose whether + means a literal plus or a space, as in HTML form data." },
      { title: "Copy or download", body: "Copy the result in one click or save it as a .txt file." },
    ],
    steps: [
      { title: "Choose a mode", body: "Encode URL for a whole address, Encode component for one parameter value, or one of the decode modes." },
      { title: "Paste your text", body: "The output updates as you type." },
      { title: "Copy the result", body: "Copy or download it. Any warnings explain what changed and why." },
    ],
    specs: [
      { label: "Modes", value: "encodeURI, encodeURIComponent, decodeURI, decodeURIComponent" },
      { label: "Character encoding", value: "UTF-8" },
      { label: "encodeURI keeps", value: "A–Z a–z 0–9 ; , / ? : @ & = + $ - _ . ! ~ * ' ( ) #" },
      { label: "encodeURIComponent keeps", value: "A–Z a–z 0–9 - _ . ! ~ * ' ( )" },
      { label: "Form data option", value: "+ decoded as space" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Text", "URL", ".txt"],
    privacy: "Text and URLs are encoded and decoded in your browser. Nothing — including tokens in query strings — is sent or stored.",
    examples: [
      { title: "A query value", body: 'Encode component on "rock & roll / 100%" gives rock%20%26%20roll%20%2F%20100%25 — safe to put after ?q=.' },
      { title: "A whole URL", body: "Encode URL on https://a.com/p?q=a b&x=1#top gives https://a.com/p?q=a%20b&x=1#top — the ?, & and # still work." },
      { title: "Decoding", body: "caf%C3%A9%20%26%20%F0%9F%8D%B0 decodes to “café & 🍰”." },
    ],
    faqs: [
      { q: "What is URL encoding?", a: "URL encoding, or percent-encoding, replaces characters that can't appear in a URL with % followed by their byte values in hexadecimal. A space becomes %20 and é becomes %C3%A9." },
      { q: "What's the difference between encodeURI and encodeURIComponent?", a: "encodeURI encodes a complete URL but keeps characters with structural meaning — / ? # & = : — so the URL still works. encodeURIComponent encodes those too, so use it for an individual value, such as a search term placed inside a query string." },
      { q: "Why does a space become %20 or +?", a: "%20 is the standard percent-encoding for a space. HTML forms use an older format (application/x-www-form-urlencoded) where a space is written as +. Turn on “+ means space” when decoding form data." },
      { q: "Why do I get a malformed URI error?", a: "A % must be followed by two hexadecimal digits that form valid UTF-8. Errors usually mean a literal % that wasn't encoded (write it as %25) or a sequence that was cut off. The tool shows where the problem is." },
      { q: "How do I fix double-encoded URLs?", a: "If you see %2520 instead of %20, the text was encoded twice. Decode it once to get %20, then again to get the original text." },
      { q: "Is URL encoding the same as encryption?", a: "No. Anyone can decode it. It only makes text safe to transport in a URL." },
    ],
    related: ["base64-encoder-decoder", "url-slug-generator", "json-formatter"],
    searchTerms: ["query parameters", "query string", "url params", "url", "uri", "encode", "decode", "encoder", "decoder", "percent", "encoding", "%20", "query", "string", "parameter", "escape", "unescape", "encodeuricomponent", "link"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder & Decoder",
    category: "developer",
    icon: "binary",
    short: "Encode text or files to Base64 and decode it back, with full Unicode support.",
    intro:
      "Encode text to Base64 or decode Base64 back to text, with correct UTF-8 handling for every language and emoji. A separate file mode converts images, PDFs and other files.",
    what:
      "Base64 is a way of writing any data — text, images, files — using only 64 safe characters (A–Z, a–z, 0–9, + and /). It's used to put binary data where only text is allowed, such as email attachments, data URLs and JSON. ZSpace Tools' Base64 Encoder & Decoder converts text and files in both directions.",
    how:
      "Text is first converted to UTF-8 bytes with the browser's TextEncoder — so Hindi, Arabic, Chinese and emoji encode correctly, unlike calling btoa() on the raw string. Every 3 bytes become 4 Base64 characters, which is why encoded data is about 33% larger. Decoding validates the alphabet, padding and length, accepts the URL-safe variant (- and _), and only shows text if the bytes are valid UTF-8; otherwise it tells you the data is binary and lets you download it as a file.",
    seo: {
      title: "Base64 Encoder & Decoder Online – Free Text Converter",
      description:
        "Encode text to Base64 and decode Base64 online for free. Convert Unicode text instantly with this simple Base64 encoder and decoder.",
      keyword: "Base64 encoder",
      secondary: ["Base64 decoder", "Base64 encode online", "decode Base64 to text", "Base64 to image", "image to Base64", "Base64 converter"],
    },
    features: [
      { title: "True UTF-8", body: "Every language and emoji round-trips exactly, using TextEncoder and TextDecoder." },
      { title: "Strict validation", body: "Invalid characters, misplaced padding and truncated input are explained, with the position of the problem." },
      { title: "URL-safe and MIME options", body: "Output the URL-safe alphabet (- _ without padding) or wrap lines at 76 characters; decode either, with or without whitespace." },
      { title: "File mode", body: "Encode any file up to 25 MB, or decode Base64 back into a downloadable file — type detected automatically." },
      { title: "Size at a glance", body: "Input and output characters and bytes, so you can see Base64's 33% overhead." },
      { title: "Responsive with large data", body: "Files are processed in chunks so the page stays usable." },
    ],
    steps: [
      { title: "Choose Text or File", body: "Text mode for strings; File mode for images, PDFs and other files." },
      { title: "Encode or decode", body: "Pick a direction and paste or upload your input. Text results update as you type." },
      { title: "Copy or download", body: "Copy the result, download it as text, or download the decoded file." },
    ],
    specs: [
      { label: "Alphabet", value: "RFC 4648 standard and URL-safe" },
      { label: "Text encoding", value: "UTF-8 (TextEncoder / TextDecoder)" },
      { label: "Size overhead", value: "≈ 4/3 of the input (+33%)" },
      { label: "Line wrapping", value: "Optional, 76 characters (MIME)" },
      { label: "File limit", value: "25 MB" },
      { label: "Processing", value: "In your browser, chunked" },
    ],
    formats: ["Text", "Any file", ".txt"],
    privacy: "Text and files are encoded and decoded in your browser. Nothing is uploaded or stored. Remember that Base64 is not encryption.",
    examples: [
      { title: "Plain text", body: '"Hello" encodes to SGVsbG8= — 5 bytes become 8 characters.' },
      { title: "Unicode", body: '"café" encodes to Y2Fmw6k=, because é is two bytes in UTF-8.' },
      { title: "URL-safe", body: '"??>>" is Pz8+Pg== in standard Base64 and Pz8-Pg in the URL-safe variant used in JWTs.' },
    ],
    faqs: [
      { q: "What is Base64 used for?", a: "Embedding images in HTML or CSS as data URLs, sending attachments in email, storing binary data in JSON or XML, and encoding parts of tokens such as JWTs." },
      { q: "Is Base64 encryption?", a: "No. Base64 is an encoding that anyone can reverse instantly. Never use it to protect passwords or confidential data — use proper encryption instead." },
      { q: "Why is Base64 larger than the original?", a: "Base64 uses 4 characters for every 3 bytes, so encoded data is about 33% larger, plus a little padding." },
      { q: "Why does btoa() fail on emoji or accented text?", a: "btoa() only accepts characters with codes up to 255. Text must first be converted to UTF-8 bytes, which this tool does automatically." },
      { q: "What is URL-safe Base64?", a: "A variant that replaces + with - and / with _, and usually omits the = padding, so it can be used in URLs and filenames without further encoding." },
      { q: "Can I convert an image to Base64?", a: "Yes. Use File mode to encode any image and copy the Base64 or a ready-made data URL. You can also paste Base64 to download the image again." },
    ],
    related: ["url-encoder-decoder", "json-formatter", "csv-to-json"],
    searchTerms: ["base64", "base 64", "encode", "decode", "encoder", "decoder", "b64", "btoa", "atob", "data url", "image to base64", "base64 to image", "converter"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "csv-to-json",
    name: "CSV to JSON & JSON to CSV Converter",
    category: "developer",
    alsoIn: ["conversion"],
    icon: "sheet",
    short: "Convert CSV to JSON or JSON to CSV, with delimiter detection, nested-data flattening and a preview.",
    intro:
      "Convert CSV to JSON, or JSON back to CSV. Paste data or open a .csv, .tsv or .json file, preview the result and copy or download it — your data never leaves your browser.",
    what:
      "CSV (comma-separated values) stores a table as plain text, one row per line. JSON stores structured data that apps and APIs read directly. ZSpace Tools' CSV to JSON & JSON to CSV Converter turns each CSV row into a JSON object keyed by the header row, and turns a JSON array of objects into a CSV table with one column per key — reporting anything that doesn't fit instead of dropping it.",
    how:
      "CSV is parsed with Papa Parse, a widely used parser that follows RFC 4180: quoted fields can contain commas, line breaks and doubled quotes (\"\"). Duplicate headers are renamed name, name_2, name_3 and blank headers become column_N; rows with too few or too many cells are listed. For JSON to CSV, the columns are every key found across all records in first-seen order; nested objects become dot-path columns such as address.city, arrays are written as JSON text or one column per item, and fields containing the delimiter, quotes or line breaks are quoted and escaped.",
    seo: {
      title: "CSV to JSON Converter – Convert CSV and JSON Online Free",
      description:
        "Convert CSV to JSON or JSON to CSV online. Upload or paste data, preview results, choose delimiters and download converted files. Free and private.",
      keyword: "CSV to JSON converter",
      secondary: ["JSON to CSV converter", "convert CSV online", "convert JSON to CSV", "TSV to JSON", "CSV file to JSON", "JSON to Excel CSV", "CSV parser online"],
    },
    features: [
      { title: "Both directions", body: "CSV → JSON and JSON → CSV in one place. Each side keeps its own input when you switch, and opening a .json or .csv file switches automatically." },
      { title: "Standards-compliant CSV parsing", body: "Quoted commas, escaped quotes, multi-line cells, BOMs and CRLF or LF line endings are handled — never a naive split on commas." },
      { title: "Any delimiter", body: "Auto-detects comma, tab, semicolon and pipe when reading, and writes any of the four." },
      { title: "Nothing silently lost", body: "Duplicate headers are renamed, ragged rows are reported, missing JSON keys become empty cells, and very large numbers that browsers can't store exactly are flagged." },
      { title: "Nested JSON, flattened", body: "address.city-style columns for nested objects; arrays as JSON text or one column per item (tags.0, tags.1)." },
      { title: "Spreadsheet-friendly output", body: "Optional UTF-8 BOM for Excel, CRLF or LF line endings, and a warning — plus an opt-in apostrophe prefix — for values a spreadsheet could run as formulas." },
    ],
    steps: [
      { title: "Choose a direction", body: "Pick CSV → JSON or JSON → CSV, then paste your data or open a file." },
      { title: "Check the options", body: "Confirm the delimiter, header row and how nested data should be written. Review any notes about rows or values." },
      { title: "Copy or download", body: "Check the preview table, then copy the result or download a .json, .csv or .tsv file." },
    ],
    specs: [
      { label: "CSV parser", value: "Papa Parse 5 (RFC 4180)" },
      { label: "Delimiters", value: "Comma, tab, semicolon, pipe (auto-detect when reading); custom when reading" },
      { label: "JSON input shapes", value: "Array of objects, single object, array of arrays, array of values, or a records array under a top-level key" },
      { label: "Nested JSON", value: "Dot-path columns; arrays as JSON text or indexed columns" },
      { label: "Duplicate headers", value: "name, name_2, name_3 …; blank → column_N" },
      { label: "CSV output", value: "RFC 4180 quoting, CRLF or LF, optional UTF-8 BOM" },
      { label: "Input formats", value: ".csv, .tsv, .txt, .json" },
      { label: "Max file size", value: "20 MB (inputs over 1 MB convert on demand)" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["CSV", "TSV", "JSON"],
    privacy: "CSV and JSON files are read and converted in your browser. Your data is never uploaded or stored, and nothing you paste is sent to analytics.",
    examples: [
      { title: "CSV headers become keys", body: 'name,city / Amit,Mumbai becomes [{"name": "Amit", "city": "Mumbai"}]. "Loves chai, hates meetings" in quotes stays one value.' },
      { title: "Nested JSON to columns", body: '{"id": 1, "address": {"city": "Pune", "pin": "411001"}} becomes the columns id, address.city, address.pin.' },
      { title: "European CSV", body: "name;price / Café;3,50 is detected as semicolon-separated, and 3,50 is kept exactly as written." },
    ],
    faqs: [
      { q: "How do I convert CSV to JSON?", a: "Choose CSV → JSON, paste the data or open the .csv file, confirm the delimiter and whether the first row holds headers, then copy the JSON or download it as a .json file." },
      { q: "How do I convert JSON into CSV?", a: "Choose JSON → CSV and paste or open your JSON. An array of objects becomes one row per object, with a column for every key. Pick the delimiter, then copy the CSV or download a .csv file." },
      { q: "What happens to nested objects and arrays?", a: "With flattening on, a nested object such as address: { city } becomes an address.city column. Arrays are written as JSON text in one cell by default, or as one column per item (tags.0, tags.1) if you choose. Nothing is dropped." },
      { q: "What if my CSV has duplicate or missing headers?", a: "Duplicates are renamed in order — name, name_2, name_3 — and blank headers become column_1, column_2 and so on. Every rename is listed so you can check it." },
      { q: "What if rows have different numbers of columns?", a: "The converter lists every affected row. Missing cells are filled as empty, and extra cells are kept under generated column names so no data is lost." },
      { q: "Why do some CSV values show a formula warning?", a: "Spreadsheet apps may treat a cell starting with =, +, -, @ or a tab as a formula. Your data isn't changed unless you turn on “Spreadsheet-safe export”, which prefixes those values with an apostrophe so they open as text." },
      { q: "Will Excel show accented letters and the ₹ sign correctly?", a: "Turn on “UTF-8 BOM for Excel”. Excel uses the BOM to recognise UTF-8; without it, some versions show characters such as é or ₹ incorrectly." },
      { q: "Is my data uploaded?", a: "No. Parsing and conversion happen entirely in your browser." },
    ],
    related: ["json-formatter", "text-diff-checker", "pdf-to-excel"],
    searchTerms: ["csv", "json", "convert", "converter", "tsv", "spreadsheet", "excel", "table", "parse", "parser", "comma", "delimiter", "data", "json to csv", "csv to json", "export", "flatten"],
    published: "2026-11-12",
    updated: "2026-11-15",
  },
  {
    slug: "days-between-dates",
    name: "Days Between Dates Calculator",
    category: "date",
    icon: "calendar",
    short: "Count days between dates, add or subtract time, count business days and run a countdown.",
    intro:
      "Find the number of days between two dates — with weeks, months, years, hours and the weekday of each date — add or subtract time, count business days with your own holidays, or count down to a future date.",
    what:
      "A days-between-dates calculator works out time on the calendar. ZSpace Tools' Days Between Dates Calculator has four modes: the difference between two dates (in days, weeks, months, years, hours and minutes, with weekdays and weekends), adding or subtracting years, months, weeks and days, counting business days with a Monday–Friday, Monday–Saturday or custom working week and your own holidays, and a countdown to any date.",
    how:
      "Dates are handled as whole calendar days, so time zones and daylight saving can't cause off-by-one errors. Day counts are exact differences. Months and years are added as calendar units — if the day doesn't exist in the target month, the result moves to that month's last day, so 31 January + 1 month = 28 February (29 in leap years). Weeks and days are then added as exact days. Business days count every date from start to end, minus weekend days and the holidays you enter.",
    seo: {
      title: "Days Between Dates Calculator – Calculate Date Difference Online",
      description:
        "Calculate the number of days between two dates instantly. Find weeks, months, years and business days with our free date difference calculator.",
      keyword: "days between dates",
      secondary: ["date difference calculator", "calculate days between dates", "business days calculator", "date calculator online", "add days to date", "countdown calculator", "working days calculator"],
    },
    features: [
      { title: "Days between dates", body: "Elapsed days, weeks, months, weekdays and weekend days — with an inclusive count when you need both ends." },
      { title: "Add or subtract", body: "Combine years, months, weeks and days to find a future or past date and its weekday." },
      { title: "Business days", body: "Choose Sat–Sun, Fri–Sat, Sunday-only or a custom weekend, and exclude your own holiday dates." },
      { title: "Calendar-accurate", body: "Leap years, 29 February, different month lengths and year boundaries are all handled exactly." },
      { title: "No time-zone surprises", body: "Calculations use calendar days, never local times, so results never shift by a day." },
      { title: "Countdown", body: "See how many days, weeks and months remain until a future date — or how long ago a past one was." },
      { title: "Copy or share", body: "Copy a plain-English summary, or share a link that reopens the same calculation (it contains only the dates)." },
    ],
    steps: [
      { title: "Pick a mode", body: "Date difference, Add / subtract, Business days or Countdown." },
      { title: "Enter dates and options", body: "Use the date pickers, then set inclusive counting, the amounts to add, or your weekend and holidays." },
      { title: "Read and copy", body: "Results update instantly; copy the summary if you need it." },
    ],
    specs: [
      { label: "Calendar", value: "Gregorian, years 1–9999" },
      { label: "Month addition", value: "Clamps to month end (31 Jan + 1 month = 28/29 Feb)" },
      { label: "Order of operations", value: "Years & months first, then weeks & days" },
      { label: "Business days", value: "Mon–Fri, Mon–Sat or custom; start and end dates counted" },
      { label: "Hours & minutes", value: "Calendar days × 24 (date-only, ignores clock changes)" },
      { label: "Holidays", value: "Entered manually (YYYY-MM-DD) — no built-in list" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Dates"],
    privacy: "Dates are calculated in your browser and are never sent or stored.",
    examples: [
      { title: "Days in a stretch", body: "1 January to 31 January 2026 is 30 days elapsed, or 31 days counting both dates." },
      { title: "Month ends", body: "31 January 2026 + 1 month = 28 February 2026; 31 January 2024 + 1 month = 29 February 2024." },
      { title: "Working days", body: "1–31 December 2026 with a Saturday–Sunday weekend and 25 December as a holiday: 22 business days." },
    ],
    faqs: [
      { q: "How do I count the days between two dates?", a: "Choose Days between dates and enter both dates. You'll see the elapsed days; switch on “Include end date” to count both the first and last day." },
      { q: "What's the difference between inclusive and exclusive counting?", a: "Exclusive counting gives the time that has passed: Monday to Tuesday is 1 day. Inclusive counting counts both dates as days: Monday to Tuesday is 2 days. Hotel nights use exclusive counting; leave or event days usually use inclusive counting." },
      { q: "Why is adding one month different from adding 30 days?", a: "Months have 28 to 31 days. Adding a month moves to the same day next month (or the last day if that date doesn't exist), while adding 30 days always moves exactly 30 days." },
      { q: "What are business days?", a: "Business days are working days — usually Monday to Friday, excluding public holidays. Many countries in the Middle East use a Friday–Saturday or other weekend, which you can choose here." },
      { q: "Does it include public holidays automatically?", a: "No. Holidays vary by country, region and organisation, so enter the ones that apply to you. The calculator then excludes those that fall on working days." },
      { q: "What if the end date is before the start date?", a: "The calculator still works — it measures the gap between the dates and tells you they were in reverse order." },
      { q: "How are hours and minutes worked out?", a: "For date-only calculations each calendar day counts as 24 hours, so 7 days = 168 hours = 10,080 minutes. Real clock time can differ by an hour across daylight-saving changes." },
      { q: "How many days until a date?", a: "Use Countdown and pick the date. It shows the days remaining from today (your device's date), along with weeks and months." },
    ],
    related: ["age-calculator", "emi-calculator", "percentage-calculator"],
    searchTerms: ["date", "dates", "days", "between", "calculator", "count", "counter", "add days", "subtract", "weeks", "months", "business days", "working days", "weekdays", "holiday", "duration", "deadline", "calendar", "countdown", "until", "how many days", "difference", "hours", "minutes"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "emi-calculator",
    name: "EMI Calculator",
    category: "calculators",
    alsoIn: ["loans"],
    icon: "loan",
    short: "Work out monthly EMI, total interest and a full repayment schedule for any loan.",
    intro:
      "Calculate the monthly EMI, total interest and total repayment for a home, car, personal, business or education loan — with a full amortization schedule, prepayment planner and side-by-side comparison.",
    what:
      "An EMI (equated monthly instalment) is the fixed monthly payment that repays a loan's principal and interest over its tenure. ZSpace Tools' EMI Calculator works out the EMI for a reducing-balance loan, shows how each payment splits between interest and principal, and estimates how prepayments shorten the loan.",
    how:
      "The calculator uses the standard reducing-balance formula: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly rate (annual rate ÷ 12 ÷ 100) and n the number of months. A zero-interest loan is simply P ÷ n. Each month, interest is charged on the outstanding balance and the rest of the EMI repays principal. Amounts are rounded to the nearest paisa or cent, and the last instalment absorbs any rounding so the balance ends at exactly zero.",
    seo: {
      title: "EMI Calculator Online – Calculate Monthly Loan EMI, Interest & Payment",
      description:
        "Calculate your monthly loan EMI instantly. Find your monthly payment, total interest, repayment and amortisation schedule for home, car and personal loans.",
      keyword: "EMI calculator",
      secondary: ["EMI calculator online", "home loan EMI calculator", "car loan EMI calculator", "personal loan EMI calculator", "monthly EMI calculation", "loan interest calculator", "amortisation schedule", "prepayment calculator"],
    },
    features: [
      { title: "Instant EMI and totals", body: "Monthly EMI, total interest and total repayment as you type, with a principal-vs-interest donut chart." },
      { title: "Full amortization schedule", body: "Month-by-month opening balance, EMI, principal, interest and closing balance, plus a year-wise summary." },
      { title: "Prepayment planner", body: "Add a monthly extra payment or a one-time lump sum and see the months and interest saved." },
      { title: "Compare two loans", body: "Put two scenarios side by side to see how rate and tenure change the EMI and total interest." },
      { title: "Fees and currencies", body: "Include a processing fee, and format amounts in INR (with lakh and crore grouping), USD, GBP, EUR, AED, SGD or AUD." },
      { title: "Export and print", body: "Copy the summary, download the schedule as CSV, or print a clean summary." },
    ],
    steps: [
      { title: "Enter the loan", body: "Type the amount, annual interest rate and tenure in years or months — or start from a loan-type example." },
      { title: "Review the results", body: "See the EMI, total interest and repayment, and explore the schedule or year-wise view." },
      { title: "Try scenarios", body: "Add prepayments or a second scenario to compare, then copy, download or print." },
    ],
    specs: [
      { label: "Method", value: "Reducing balance, monthly instalments" },
      { label: "Monthly rate", value: "Annual nominal rate ÷ 12" },
      { label: "Zero interest", value: "EMI = principal ÷ months" },
      { label: "Rounding", value: "Nearest paisa/cent; last instalment adjusts" },
      { label: "Prepayment assumption", value: "EMI unchanged, tenure shortened" },
      { label: "Limits", value: "Up to 10^12, 0–100% p.a., 1–600 months" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CSV"],
    privacy: "Loan details are calculated in your browser. Nothing you enter is sent, stored or included in analytics.",
    examples: [
      { title: "Home loan", body: "₹10,00,000 at 10% a year for 20 years: EMI ₹9,650.22, total interest about ₹13,16,050 and total repayment about ₹23,16,050." },
      { title: "Prepaying", body: "On the same loan, paying ₹2,000 extra every month plus ₹1,00,000 in month 12 clears it in 127 months instead of 240, saving about ₹7.4 lakh in interest." },
      { title: "Zero-interest offer", body: "₹1,20,000 over 12 months at 0% is exactly ₹10,000 a month — though processing fees still add to the real cost." },
    ],
    faqs: [
      { q: "How is EMI calculated?", a: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (annual rate ÷ 12 ÷ 100) and n is the number of monthly instalments." },
      { q: "Why does most of my early EMI go to interest?", a: "Interest is charged on the outstanding balance, which is highest at the start. As the balance falls, the interest part shrinks and more of each EMI repays principal." },
      { q: "Does prepaying a loan save money?", a: "Usually, yes — prepayments reduce the balance that interest is charged on. This calculator assumes your EMI stays the same and the tenure shortens. Check your lender's prepayment charges and rules." },
      { q: "Will my bank's EMI match exactly?", a: "It should be close, but lenders can differ in rounding, the date interest starts, broken-period interest, fees, insurance, rate resets on floating loans, and compounding conventions. Treat this as an estimate, not an offer." },
      { q: "Which interest rate should I use?", a: "Use the rate in your loan offer or agreement. The loan-type buttons only fill in an example amount and tenure — they don't suggest a rate." },
      { q: "Can I use it outside India?", a: "Yes. The maths works for any standard monthly-instalment loan or mortgage. Pick your currency to change the formatting; the calculation is the same." },
    ],
    related: ["sip-calculator", "compound-interest-calculator", "gst-calculator", "home-loan-eligibility-calculator", "home-loan-prepayment-calculator", "car-loan-calculator", "personal-loan-calculator"],
    searchTerms: ["emi", "loan", "calculator", "home loan", "car loan", "personal loan", "mortgage", "interest", "repayment", "amortization", "amortisation", "schedule", "prepayment", "instalment", "installment", "monthly payment", "finance"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "color-picker",
    name: "Color Picker & Converter",
    category: "design",
    icon: "palette",
    short: "Pick colours, convert HEX, RGB(A) and HSL(A), build palettes and check contrast.",
    intro:
      "Pick a colour and get its HEX, RGB and HSL values instantly — with transparency. Fine-tune it with hue, saturation, lightness and alpha sliders, generate harmonious palettes, tints and shades, copy CSS, and check text contrast against WCAG guidelines.",
    what:
      "A colour picker lets you choose a colour visually and read its exact value in the formats designers and developers use. ZSpace Tools' Color Picker & Converter converts between HEX (including 8-digit HEX with alpha), RGB/RGBA and HSL/HSLA, generates palettes from colour theory, creates tints and shades, and calculates the WCAG contrast ratio between two colours.",
    how:
      "Every colour is stored as RGB — red, green and blue from 0 to 255 — and converted to HEX (the same three numbers in hexadecimal) and HSL (hue, saturation and lightness) using the standard sRGB formulas. Palettes rotate the hue around the colour wheel: 180° for complementary, ±30° for analogous, 120° for triadic. Contrast uses the WCAG 2 relative-luminance formula; ratios are compared with the thresholds without rounding up, so 4.49:1 doesn't pass a 4.5:1 requirement.",
    seo: {
      title: "Color Picker Online – HEX, RGB, HSL Color Converter",
      description:
        "Pick colors online, convert HEX, RGB and HSL values, generate color palettes and check contrast ratios with this free online color picker.",
      keyword: "color picker",
      secondary: ["HEX to RGB", "RGB to HEX", "HSL converter", "RGBA color picker", "8-digit HEX", "color palette generator", "contrast checker", "WCAG contrast ratio", "colour picker"],
    },
    features: [
      { title: "HEX, RGB and HSL together", body: "Edit any format — including 3-digit HEX like #F80 — and the others update instantly." },
      { title: "Transparency (alpha)", body: "4- and 8-digit HEX (#F0784580), rgba() and hsla() — with a checkerboard preview so you can see the transparency." },
      { title: "HSL and alpha sliders", body: "Drag hue, saturation, lightness and alpha; the values and preview update live." },
      { title: "Six palette types", body: "Complementary, analogous, triadic, split complementary, tetradic and monochromatic." },
      { title: "Tints and shades", body: "Five lighter and five darker steps of your colour, ready for UI states and backgrounds." },
      { title: "WCAG contrast checker", body: "Contrast ratio with AA and AAA results for normal and large text." },
      { title: "Copy CSS", body: "Ready-made CSS snippets, the palette as CSS custom properties (50–950 steps), or the palette as JSON." },
      { title: "Share a colour", body: "Copy a link that opens the tool with your colour selected. Recent colours stay for this visit only." },
    ],
    steps: [
      { title: "Choose a colour", body: "Use the picker, type a HEX, RGB or HSL value, or press Random." },
      { title: "Explore palettes and shades", body: "Pick a harmony to generate a palette; click any swatch to make it the main colour." },
      { title: "Check contrast and copy", body: "Test text and background colours, then copy values or download the palette." },
    ],
    specs: [
      { label: "Formats", value: "HEX (3/4/6/8-digit), RGB/RGBA, HSL/HSLA" },
      { label: "Alpha", value: "0–100% (2 decimals)" },
      { label: "Colour space", value: "sRGB" },
      { label: "Contrast formula", value: "WCAG 2 relative luminance" },
      { label: "AA / AAA thresholds", value: "4.5:1 / 7:1 (large text 3:1 / 4.5:1)" },
      { label: "Random colours", value: "crypto.getRandomValues" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["HEX", "RGB", "RGBA", "HSL", "HSLA", "CSS", "JSON"],
    privacy: "Colours are calculated in your browser. Nothing is stored except an optional colour in a link you choose to share.",
    examples: [
      { title: "Brand orange", body: "#F07845 = rgb(240, 120, 69) = hsl(18, 85%, 61%). Its complementary colour is a cool blue around #45BDF0." },
      { title: "Grey text on white", body: "#777777 on #FFFFFF is 4.48:1 — just short of AA for body text. #767676 reaches 4.54:1 and passes." },
      { title: "Short HEX", body: "#F80 is shorthand for #FF8800 — each digit is doubled." },
      { title: "50% transparent", body: "#F07845 at 50% alpha = #F0784580 = rgba(240, 120, 69, 0.5). The last HEX pair (80) is the alpha: 128 ÷ 255 ≈ 0.5." },
    ],
    faqs: [
      { q: "What do HEX, RGB and HSL mean?", a: "RGB describes a colour by its red, green and blue light from 0 to 255. HEX writes the same three numbers in hexadecimal (#F07845). HSL describes it as hue (an angle on the colour wheel), saturation and lightness — often easier for creating variations." },
      { q: "What's the difference between RGB and HEX?", a: "None in the colour itself — they're two notations for the same values. rgb(240, 120, 69) and #F07845 are identical." },
      { q: "What contrast ratio do I need?", a: "WCAG 2 level AA asks for at least 4.5:1 for normal text and 3:1 for large text (about 24px, or 19px bold). Level AAA asks for 7:1 and 4.5:1." },
      { q: "Does passing the contrast check make my design accessible?", a: "It's one important part. Accessibility also depends on font size, focus states, not relying on colour alone, and much more, so test with real users and assistive technology too." },
      { q: "How are palettes generated?", a: "By rotating the hue around the colour wheel while keeping saturation and lightness — for example 180° for a complementary colour and 120° steps for a triad. Monochromatic palettes keep the hue and vary lightness." },
      { q: "What is 8-digit HEX?", a: "#RRGGBBAA — the usual six digits plus two for alpha (transparency), from 00 (fully transparent) to FF (opaque). #F0784580 is the brand orange at about 50% opacity. The 4-digit form (#F078) doubles each digit, like 3-digit HEX." },
      { q: "Does the contrast checker use transparency?", a: "No. Contrast is checked between two opaque colours, because a transparent colour's contrast depends on what's behind it." },
      { q: "Is anything saved?", a: "No. Recent colours are kept only while the page is open. A share link contains just the HEX value you choose to share." },
    ],
    related: ["image-cropper", "image-resizer", "qr-code-generator"],
    searchTerms: ["color", "colour", "picker", "hex", "rgb", "rgba", "hsl", "hsla", "alpha", "transparency", "css variables", "converter", "palette", "contrast", "wcag", "accessibility", "shades", "tints", "complementary", "design", "swatch"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    category: "developer",
    icon: "fingerprint",
    short: "Generate secure UUID v4 (and time-ordered v7) identifiers, one or a thousand at a time.",
    intro:
      "Generate random UUID v4 identifiers — or time-ordered UUID v7 — individually or in bulk, using your browser's cryptographic random generator. Copy them or download as TXT or CSV.",
    what:
      "A UUID (universally unique identifier, also called a GUID) is a 128-bit identifier written as 32 hexadecimal digits in five groups, like 0b8f1e0a-4c3d-4e5f-9a7b-1c2d3e4f5a6b. ZSpace Tools' UUID Generator creates standards-compliant version 4 UUIDs, which are random, and version 7 UUIDs, which start with a timestamp so they sort by creation time.",
    how:
      "Version 4 UUIDs come from crypto.randomUUID(), or from crypto.getRandomValues() with the version and variant bits set by hand where that isn't available — never Math.random(). That leaves 122 random bits, so collisions are practically impossible. Version 7 UUIDs (RFC 9562) put a 48-bit Unix-millisecond timestamp first and fill the rest with random bits plus a sequence counter, so IDs made in the same millisecond still sort in order. Every batch is checked for duplicates.",
    seo: {
      title: "UUID Generator Online – Generate Free UUID v4 IDs",
      description:
        "Generate UUIDs online for free. Create secure UUID v4 identifiers in bulk with copy and download options using ZSpace Tools.",
      keyword: "UUID generator",
      secondary: ["UUID v4 generator", "GUID generator", "bulk UUID generator", "random UUID", "UUID v7 generator", "generate unique ID"],
    },
    features: [
      { title: "UUID v4 by default", body: "Random, RFC 9562-compliant version 4 UUIDs from the Web Crypto API." },
      { title: "Optional UUID v7", body: "Time-ordered UUIDs that sort by creation time — great for database primary keys." },
      { title: "Bulk generation", body: "Create up to 1,000 UUIDs at once, with a duplicate check on every batch." },
      { title: "Display formats", body: "Uppercase, no hyphens or {braces} for systems that need them — standard lowercase is the default." },
      { title: "Copy and export", body: "Copy one or all, or download as .txt (one per line) or .csv." },
      { title: "Validator", body: "Paste any UUID to check it and see its version, variant and — for v7 — its timestamp." },
    ],
    steps: [
      { title: "Choose version and quantity", body: "v4 for random IDs, v7 for time-ordered IDs; pick how many." },
      { title: "Generate", body: "IDs appear instantly. Adjust case and hyphens for display if needed." },
      { title: "Copy or download", body: "Copy a single ID or all of them, or download TXT or CSV." },
    ],
    specs: [
      { label: "Standard", value: "RFC 9562 (formerly RFC 4122)" },
      { label: "v4 randomness", value: "122 random bits, crypto.randomUUID()" },
      { label: "v7 layout", value: "48-bit ms timestamp + 74 random/sequence bits" },
      { label: "Batch size", value: "1 – 1,000" },
      { label: "Formats", value: "Standard, uppercase, no hyphens, {braces}" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["TXT", "CSV"],
    privacy: "UUIDs are generated in your browser and are not sent, logged or stored.",
    examples: [
      { title: "Version 4", body: "0b8f1e0a-4c3d-4e5f-9a7b-1c2d3e4f5a6b — the 13th digit (4) is the version; the 17th (8, 9, a or b) marks the RFC variant." },
      { title: "Version 7", body: "A v7 UUID made at 12:00 UTC on 12 November 2026 starts with 01a1cfa1-0a00, so later IDs sort after it." },
      { title: "For a database", body: "Generate 500 v7 UUIDs and download the CSV to seed test data with sortable primary keys." },
    ],
    faqs: [
      { q: "What is a UUID?", a: "A universally unique identifier: a 128-bit value, usually shown as 36 characters (32 hex digits and 4 hyphens), that can be generated anywhere without coordination and is practically guaranteed to be unique." },
      { q: "What is UUID v4?", a: "Version 4 UUIDs are generated from random numbers — 122 of their 128 bits are random. They're the most widely used kind." },
      { q: "Should I use UUID v4 or v7?", a: "Use v4 for general-purpose unique IDs. Use v7 when IDs will be stored in a database index, because v7 sorts by creation time and keeps indexes compact. Note that v7 reveals roughly when the ID was created." },
      { q: "UUID vs auto-increment IDs — which is better?", a: "Auto-increment IDs are small and simple but need a central database and reveal how many records exist. UUIDs can be created anywhere (clients, services, offline) and don't reveal counts, at the cost of more storage." },
      { q: "Can I use a UUID as a password or API key?", a: "No. UUIDs are identifiers, not secrets — they can appear in URLs and logs, and v7 includes a timestamp. For secrets, use a dedicated generator such as our password generator and store them securely." },
      { q: "Can two UUIDs ever be the same?", a: "With v4 the chance is so small it can be ignored in practice. Each batch here is also checked, and any duplicate would be regenerated." },
    ],
    related: ["password-generator", "json-formatter", "base64-encoder-decoder"],
    searchTerms: ["uuid", "guid", "generator", "unique", "id", "identifier", "v4", "v7", "random", "bulk", "primary key", "database"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "markdown-editor",
    name: "Online Markdown Editor",
    category: "developer",
    alsoIn: ["text"],
    icon: "markdown",
    short: "Write Markdown with a live preview, GitHub-style tables and task lists, then export .md or HTML.",
    intro:
      "Write Markdown and see it formatted as you type — headings, lists, task lists, tables and code blocks. Copy the HTML or download .md and .html files. No sign-up, and everything stays in your browser.",
    what:
      "Markdown is a lightweight way to format plain text: **bold**, # headings and - lists become formatted output. ZSpace Tools' Online Markdown Editor shows your Markdown and its rendered result side by side, with a formatting toolbar, keyboard shortcuts, an optional table of contents and exports to Markdown or HTML.",
    how:
      "Your text is parsed with marked, a widely used parser that follows CommonMark and supports GitHub Flavored Markdown tables, task lists and strikethrough. The resulting HTML is sanitised with DOMPurify before it is shown: raw HTML is displayed as text, scripts and event handlers are removed, and links are limited to http, https, mailto and tel, so javascript: links can't run. Code blocks are displayed, never executed.",
    seo: {
      title: "Free Online Markdown Editor with Live Preview",
      description:
        "Write and preview Markdown online with GitHub-style tables, task lists and code blocks. Copy HTML or download your Markdown files. No sign-up required.",
      keyword: "online Markdown editor",
      secondary: ["Markdown live preview", "Markdown previewer", "Markdown to HTML", "GitHub Flavored Markdown editor", "README editor", "Markdown table editor"],
    },
    features: [
      { title: "Live preview", body: "See formatted output as you type — side by side on desktop, with Write and Preview tabs on phones." },
      { title: "Toolbar and shortcuts", body: "Headings, bold, italic, links, images, lists, task lists, quotes, code and tables at your cursor. Ctrl/⌘+B, I and K work too, and undo keeps working." },
      { title: "GitHub Flavored Markdown", body: "Tables with column alignment, task lists, strikethrough, fenced code blocks and nested lists." },
      { title: "Table of contents", body: "Turn on Contents to list every heading, jump to it in the preview, and include the list in your HTML export." },
      { title: "Safe by design", body: "Output is sanitised; raw HTML is shown as text, and scripts, inline event handlers and javascript: links are removed." },
      { title: "Export and local drafts", body: "Download .md or a styled standalone .html file, copy Markdown or HTML, and optionally keep a draft in this browser only." },
    ],
    steps: [
      { title: "Write or paste Markdown", body: "Type in the editor, use the toolbar or shortcuts, or load the example." },
      { title: "Check the preview", body: "The formatted result updates live; turn on Contents for a heading outline. Word count and reading time update too." },
      { title: "Export", body: "Download .md or .html, or copy the Markdown or rendered HTML." },
    ],
    specs: [
      { label: "Parser", value: "marked 18 (CommonMark + GFM)" },
      { label: "Supported syntax", value: "Headings, emphasis, strikethrough, lists, nested lists, task lists, links, images, quotes, inline code, fenced code, tables, horizontal rules" },
      { label: "Sanitiser", value: "DOMPurify 3" },
      { label: "Allowed link protocols", value: "http, https, mailto, tel, relative" },
      { label: "Raw HTML", value: "Shown as text, never rendered" },
      { label: "Shortcuts", value: "Ctrl/⌘+B bold · Ctrl/⌘+I italic · Ctrl/⌘+K link" },
      { label: "Storage", value: "None, or this browser's local storage only (opt-in)" },
    ],
    formats: ["Markdown", ".md", "HTML"],
    privacy: "Your writing stays in your browser and is never sent anywhere. The optional draft is stored only in this browser's local storage and can be deleted at any time with “Delete saved draft”.",
    examples: [
      { title: "A task list", body: "- [x] Draft outline / - [ ] Add screenshots renders as a checklist with one item ticked." },
      { title: "A table", body: "| Tool | Price | / | --- | ---: | / | Editor | Free | renders a table with the price column right-aligned." },
      { title: "Unsafe links", body: "[click](javascript:alert(1)) renders as plain text — the link is removed rather than executed." },
    ],
    faqs: [
      { q: "What is Markdown used for?", a: "Markdown is a simple formatting syntax for plain text, used for README files, documentation, notes, forum posts and blog drafts. Symbols like # for headings and ** for bold are converted to formatted text, so documents stay readable even before rendering." },
      { q: "Does this editor support GitHub Flavored Markdown?", a: "Yes for the common extensions: tables (with alignment), task lists, strikethrough and fenced code blocks. Syntax highlighting inside code blocks, footnotes, emoji shortcodes and diagrams are not supported." },
      { q: "How is Markdown different from HTML?", a: "HTML is the language browsers render, with tags like <h1> and <strong>. Markdown is a shorter way of writing common formatting that's converted to HTML. This editor shows you that HTML and lets you export it." },
      { q: "Can I use HTML inside Markdown here?", a: "For safety, raw HTML is shown as text rather than rendered. Use Markdown syntax for formatting." },
      { q: "How do I export my document?", a: "Use Download .md for the Markdown source, or Export HTML for a styled standalone web page (with a table of contents if Contents is on). You can also copy either to the clipboard." },
      { q: "Is my text saved or uploaded?", a: "It's never uploaded. If you switch on “Keep draft in this browser”, it's saved in this browser's local storage on this device only — use “Delete saved draft” or switch it off to remove it." },
    ],
    related: ["word-counter", "text-diff-checker", "html-formatter"],
    searchTerms: ["markdown", "md", "editor", "preview", "previewer", "live preview", "readme", "github", "gfm", "markdown to html", "writer", "notes", "table", "code", "documentation"],
    published: "2026-11-12",
    updated: "2026-11-15",
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    category: "business",
    icon: "invoice",
    short: "Create professional invoices with taxes, discounts and your logo — download as PDF.",
    intro:
      "Create a professional invoice in minutes: add your business and customer details, line items, discounts and tax — including GST with CGST/SGST or IGST — then download a clean A4 PDF or print it.",
    what:
      "An invoice is a document requesting payment for goods or services, listing what was supplied, the amounts and any taxes. ZSpace Tools' Invoice Generator builds that document from your details, calculates subtotals, discounts, taxes and the balance due, and exports a real, text-based PDF in one of three templates.",
    how:
      "Totals follow a fixed order: each line's quantity × unit price, minus any line discount, gives the subtotal; an invoice-wide discount is then applied; tax is calculated once per tax rate on the discounted amounts; additional charges are added; and any amount paid is subtracted to give the balance due. All money is calculated in whole cents or paise so totals never drift. The PDF is drawn as real vector text with pdf-lib — not a screenshot — so it's sharp, searchable and paginates cleanly on A4.",
    seo: {
      title: "Free Online Invoice Generator – Create & Download PDF Invoices",
      description:
        "Create professional invoices online for free. Add business details, customer information, line items, discounts and taxes, then download your invoice as a PDF.",
      keyword: "invoice generator",
      secondary: ["free invoice generator", "invoice maker", "GST invoice generator", "freelance invoice template", "PDF invoice", "online invoice"],
    },
    features: [
      { title: "Live preview, three templates", body: "Minimal, Modern and Professional designs that update as you type." },
      { title: "Flexible line items", body: "Quantity, unit price, per-line discount and tax rate; add, remove and reorder items." },
      { title: "Taxes your way", body: "GST with CGST + SGST or IGST, or your own label such as VAT or Sales tax — with any rate." },
      { title: "Every total you need", body: "Subtotal, discounts, taxable amount, tax breakdown, charges, amount paid and balance due." },
      { title: "Real PDF export", body: "A4 vector PDF with your logo, page numbers and automatic page breaks for long invoices." },
      { title: "Private, optional drafts", body: "Nothing is uploaded. Optionally keep a draft in this browser and clear it any time." },
    ],
    steps: [
      { title: "Add your details", body: "Your business, your customer, the invoice number, dates and currency — plus an optional logo." },
      { title: "Add line items and tax", body: "Enter items, discounts and the tax setup; totals calculate as you go." },
      { title: "Download or print", body: "Choose a template, preview it, then download the PDF or print." },
    ],
    specs: [
      { label: "Page size", value: "A4 (210 × 297 mm), multi-page" },
      { label: "PDF type", value: "Vector text (pdf-lib), not an image" },
      { label: "Currencies", value: "INR, USD, GBP, EUR, AED, AUD, SGD, CAD" },
      { label: "Tax modes", value: "None · single tax · GST CGST+SGST · GST IGST" },
      { label: "Rounding", value: "Integer cents/paise; tax rounded once per rate" },
      { label: "Logo", value: "PNG, JPG or WebP up to 2 MB" },
    ],
    formats: ["PDF"],
    privacy: "Invoices are created in your browser. Business and customer details are never uploaded; an optional draft is stored only on this device.",
    examples: [
      { title: "Freelance invoice with GST", body: "₹85,000 design + ₹19,800 photography (after 10% off) + 3 × ₹4,500 support = ₹1,18,300 taxable; 18% GST adds ₹10,647 CGST + ₹10,647 SGST for a total of ₹1,39,594." },
      { title: "UK invoice with VAT", body: "Set the tax label to VAT at 20%: £2,000 of consulting becomes £400 VAT and £2,400 due." },
      { title: "Part-paid invoice", body: "Enter an amount already paid (for example a 50% deposit) to show the remaining balance due." },
    ],
    faqs: [
      { q: "Is this invoice generator free?", a: "Yes. Create and download as many invoices as you like with no account, watermark or limit." },
      { q: "Can I create a GST invoice?", a: "Yes. Choose GST, enter your GSTIN and your customer's, set the rate, and pick intra-state (CGST + SGST) or inter-state (IGST). You're responsible for confirming the correct rate, place of supply and any other details your invoice must include." },
      { q: "Is the invoice legally compliant?", a: "The tool helps you lay out a clear invoice, but it can't know every rule that applies to your business or country — such as required wording, sequential numbering or e-invoicing. Check your local requirements or ask an accountant." },
      { q: "Does changing the currency convert my prices?", a: "No. Currency only changes the symbol and number formatting. Enter amounts in the currency you're invoicing in." },
      { q: "Why doesn't my PDF show some characters?", a: "The PDF supports Latin-script text plus symbols like ₹, €, £ and $. Scripts that need complex shaping, such as Devanagari or Arabic, can't be drawn reliably in the PDF — use Print and save as PDF from your browser instead; the tool tells you when this applies." },
      { q: "Is my invoice data stored?", a: "Not unless you choose to keep a draft, which is saved only in this browser. Nothing is ever sent to a server." },
    ],
    related: ["gst-calculator", "number-to-words", "emi-calculator"],
    searchTerms: ["invoice", "generator", "maker", "bill", "billing", "receipt", "gst invoice", "vat invoice", "freelance", "pdf", "template", "quote", "small business", "tax invoice"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "image-cropper",
    name: "Image Cropper",
    category: "image",
    icon: "crop",
    short: "Crop images to any size or aspect ratio, rotate and flip, then export JPG, PNG or WebP.",
    intro:
      "Crop photos to exactly the area you want — freehand, to an aspect ratio, or to a social media size. Rotate, flip and zoom, then download as JPG, PNG or WebP, all in your browser.",
    what:
      "An image cropper removes the parts of a picture outside a rectangle you choose, so you can reframe a photo or fit a required shape. ZSpace Tools' Image Cropper lets you drag and resize a crop box over your image, lock it to aspect ratios such as 1:1 or 16:9, rotate and flip, and export at the exact pixel size you need.",
    how:
      "Your image is decoded with its camera orientation applied. Rotation and flipping are applied to the image first, so the crop box always matches what you see. The selected pixels are then drawn onto a canvas at the output size with high-quality resampling — the aspect ratio is kept, so nothing is stretched — and encoded as JPG, PNG or WebP. PNG and WebP keep transparency; for JPG you choose the background colour that replaces transparent areas.",
    seo: {
      title: "Image Cropper Online – Crop Images Free in Any Size",
      description:
        "Crop images online for free. Upload photos, choose custom dimensions or aspect ratios, rotate and download cropped images in JPG, PNG or WebP format.",
      keyword: "image cropper",
      secondary: ["crop image online", "photo cropper", "crop image to square", "crop image for Instagram", "aspect ratio cropper", "crop picture"],
    },
    features: [
      { title: "Drag, resize, nudge", body: "Move the crop box, drag any edge or corner, or nudge it with the arrow keys." },
      { title: "Aspect ratios", body: "Free, 1:1, 4:5, 3:2, 4:3, 16:9 and 9:16, or lock the current shape." },
      { title: "Social presets", body: "Instagram square, portrait and Story, YouTube thumbnail, LinkedIn and Facebook sizes — editable." },
      { title: "Rotate, flip, zoom", body: "Rotate in 90° steps, flip either way, and zoom for precise framing." },
      { title: "Exact output size", body: "Set the output width or height in pixels; the other follows the crop's shape." },
      { title: "Format and quality", body: "Export JPG, PNG or WebP with a quality slider and a JPG background colour." },
    ],
    steps: [
      { title: "Add an image", body: "Drop a JPG, PNG or WebP image, or click to choose one." },
      { title: "Frame the crop", body: "Pick a ratio or preset, then drag and resize the box; rotate or flip if needed." },
      { title: "Export", body: "Choose format, quality and size, then download the cropped image." },
    ],
    specs: [
      { label: "Input formats", value: "JPG, JPEG, PNG, WebP" },
      { label: "Output formats", value: "JPG, PNG, WebP" },
      { label: "Max file size", value: `${MAX_IMG}` },
      { label: "Max output", value: "16,384 px per side, 50 MP" },
      { label: "Transforms", value: "Rotate 90°, flip H/V, zoom" },
      { label: "Processing", value: "In your browser (Canvas API)" },
    ],
    formats: ["JPG", "JPEG", "PNG", "WebP"],
    privacy: "Images are cropped entirely on your device. They're never uploaded and are discarded when you leave the page.",
    examples: [
      { title: "Square profile photo", body: "Choose 1:1, centre the box on the face, set the width to 800 px and export JPG." },
      { title: "YouTube thumbnail", body: "Pick the YouTube preset to crop at 16:9 and export exactly 1280 × 720." },
      { title: "Transparent logo", body: "Crop a PNG logo tightly and export PNG to keep the transparent background." },
    ],
    faqs: [
      { q: "How do I crop an image online?", a: "Add the image, drag the crop box over the area you want to keep (or choose an aspect ratio), then download. It takes seconds and the image never leaves your device." },
      { q: "How do I crop a photo to a square?", a: "Choose 1:1. The box stays square while you move and resize it." },
      { q: "What size should Instagram images be?", a: "Common sizes are 1080 × 1080 for square posts, 1080 × 1350 for portrait posts and 1080 × 1920 for Stories and Reels. Platforms change their guidelines, so the presets are suggestions you can edit." },
      { q: "Will cropping reduce quality?", a: "Cropping only removes pixels outside the box. Quality is kept unless you enlarge the result or pick a low quality setting for JPG or WebP." },
      { q: "Does cropping make the file smaller?", a: "Often, because there are fewer pixels — but it isn't compression, and the result depends on the format and quality you choose. Use the Image Compressor if size is the goal." },
      { q: "Is my photo uploaded?", a: "No. Cropping happens in your browser and nothing is stored." },
    ],
    related: ["image-resizer", "image-compressor", "color-picker"],
    searchTerms: ["crop", "cropper", "image", "photo", "picture", "aspect ratio", "square", "instagram", "youtube", "thumbnail", "rotate", "flip", "trim", "cut"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "url-slug-generator",
    name: "URL Slug Generator",
    category: "text",
    icon: "slug",
    short: "Turn titles into clean, readable URL slugs — one at a time or in bulk, with CSV export.",
    intro:
      "Convert a blog title, product name or page heading into a clean, readable URL slug. Choose separators and case, drop stop words, cap the length, preview the full URL, or convert a whole list at once.",
    what:
      "A URL slug is the readable part of a web address that identifies a page, such as best-website-practices in example.com/blog/best-website-practices. ZSpace Tools' URL Slug Generator turns any title into a slug by lowercasing it, replacing spaces with hyphens or underscores, transliterating accented and other supported letters, and removing punctuation and symbols.",
    how:
      "The title is normalised, then accents are removed from Latin letters (café → cafe) and supported alphabets are transliterated: German, Nordic and Polish letters (Straße → strasse, Łódź → lodz), Greek, and Russian or Ukrainian Cyrillic (Київ → kyiv). Words are split at anything that isn't a letter or number and joined with your separator, so there are never doubled, leading or trailing separators. Scripts without a reliable transliteration — such as Chinese, Japanese, Hindi or Arabic — are kept as Unicode letters, or removed and listed if you choose ASCII-only slugs. A length limit cuts at a word boundary.",
    seo: {
      title: "URL Slug Generator – Create SEO-Friendly URLs Online",
      description:
        "Generate clean, SEO-friendly URL slugs from titles and text. Convert spaces to hyphens, remove unwanted characters and customise your URL format for free.",
      keyword: "URL slug generator",
      secondary: ["SEO slug generator", "convert title to URL", "blog URL generator", "URL-friendly text converter", "slugify online", "permalink generator"],
    },
    features: [
      { title: "Clean slugs instantly", body: "Lowercase words joined by hyphens, with punctuation, symbols and doubled separators removed as you type." },
      { title: "Your format", body: "Hyphens or underscores, lowercase, uppercase or original case, optional stop-word removal and a maximum length." },
      { title: "Transliteration", body: "Accents, German, Nordic, Polish, Greek and Russian/Ukrainian letters become readable ASCII. Other scripts are kept or clearly listed." },
      { title: "Bulk conversion", body: "Paste a list of titles — one per line — and get a slug for each, with optional numbering to keep them unique." },
      { title: "Full URL preview", body: "Add your site's base URL to see and copy the complete address for each page." },
      { title: "CSV export", body: "Download titles, slugs and full URLs as a CSV for your CMS, spreadsheet or redirect map." },
    ],
    steps: [
      { title: "Enter a title", body: "Type or paste a headline, product name or page title — or a list of them in Bulk mode." },
      { title: "Adjust the options", body: "Pick the separator and case, remove stop words or set a maximum length, and add a base URL to preview." },
      { title: "Copy or export", body: "Copy the slug or full URL, or download everything as a CSV." },
    ],
    specs: [
      { label: "Separators", value: "Hyphen (-) or underscore (_)" },
      { label: "Always applied", value: "Symbols removed; no doubled, leading or trailing separators" },
      { label: "Transliteration", value: "Latin diacritics, ß æ ø ł…, Greek, Russian & Ukrainian Cyrillic" },
      { label: "Other scripts", value: "Kept as Unicode, or removed and listed (ASCII-only)" },
      { label: "Max length", value: "Optional; cuts at a word boundary" },
      { label: "Export", value: "CSV (title, slug, URL)" },
    ],
    formats: ["Text", "CSV"],
    privacy: "Titles are converted in your browser and never sent or stored.",
    examples: [
      { title: "A blog post", body: "“The Best Digital Marketing Strategies for Small Businesses in 2027!” → the-best-digital-marketing-strategies-for-small-businesses-in-2027." },
      { title: "Shorter, without stop words", body: "With stop words removed and a 40-character limit: best-digital-marketing-strategies-small." },
      { title: "With a base URL", body: "Base https://example.com/blog/ + “Best Website Development Practices” → https://example.com/blog/best-website-development-practices." },
    ],
    faqs: [
      { q: "What is a URL slug?", a: "The part of a URL that identifies a specific page in readable words, after the domain and any folders — for example how-to-make-cold-brew in example.com/blog/how-to-make-cold-brew." },
      { q: "Do clean slugs help SEO?", a: "Short, descriptive slugs help people and search engines understand what a page is about, and look more trustworthy when shared. They're a small part of SEO — content quality and relevance matter far more, so a slug alone won't guarantee better rankings." },
      { q: "Should I use hyphens or underscores?", a: "Hyphens are the common choice for web pages, and Google recommends them because they clearly separate words. Underscores are mostly used for file names or systems that require them." },
      { q: "Should I remove stop words like “the” and “of”?", a: "It can make slugs shorter and cleaner, but keep them when they change the meaning or make the slug read oddly. The tool never removes every word." },
      { q: "What happens to accents and non-English letters?", a: "Accented letters become plain letters (é → e), and German, Nordic, Polish, Greek and Russian/Ukrainian letters are transliterated. Chinese, Japanese, Hindi, Arabic and other scripts aren't transliterated — they're kept as Unicode, which modern browsers display correctly, or removed if you choose ASCII-only." },
      { q: "Does the tool check if the URL is available?", a: "No. It generates the slug locally; check your CMS or site for existing pages with the same address." },
    ],
    related: ["case-converter", "url-encoder-decoder", "word-counter"],
    searchTerms: ["slug", "slugify", "url", "seo", "permalink", "title to url", "blog url", "friendly url", "hyphen", "generator", "convert title", "clean url"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    category: "developer",
    icon: "regex",
    short: "Test regular expressions with live highlighting, match details and capture groups.",
    intro:
      "Write a regular expression and see every match highlighted as you type. Toggle flags, inspect capture groups and named groups, start from common examples, and copy or download the results.",
    what:
      "A regex tester lets you try a regular expression — a pattern for finding text — against sample text before you use it in code. ZSpace Tools' Regex Tester uses JavaScript's own regex engine, highlights every match, lists each match's position and capture groups, and explains what went wrong when a pattern is invalid.",
    how:
      "Your pattern and flags are passed to the browser's built-in RegExp, exactly as JavaScript code would use them. Matching runs in a separate Web Worker so the page stays responsive; if a pattern takes longer than 1.5 seconds — usually catastrophic backtracking from nested quantifiers like (a+)+ — the worker is stopped and you're told why. Zero-length matches advance one character so a global search always finishes. The pattern is never evaluated as code.",
    seo: {
      title: "Regex Tester Online – Test Regular Expressions with Live Matching",
      description:
        "Test regular expressions online with live match highlighting, capture groups and regex flags. Debug JavaScript regex patterns instantly with this free tool.",
      keyword: "regex tester",
      secondary: ["regular expression tester", "JavaScript regex tester", "regex checker", "regex debugger", "test regex online", "regex match highlighter"],
    },
    features: [
      { title: "Live highlighting", body: "Matches are highlighted in your text as you type, with alternating colours so neighbours are easy to tell apart." },
      { title: "All JavaScript flags", body: "Global, ignore case, multiline, dot-all, unicode and sticky — toggle them or type them." },
      { title: "Capture groups", body: "Each match lists its position plus numbered and named groups, including groups that didn't take part." },
      { title: "Clear errors", body: "Invalid patterns show the browser's error message instead of failing silently." },
      { title: "Freeze protection", body: "Matching runs in a worker that stops after 1.5 seconds, so a runaway pattern can't lock up the page." },
      { title: "Examples and export", body: "Ten starter patterns with explanations; copy the regex or matches, or download a TXT report." },
    ],
    steps: [
      { title: "Enter a pattern", body: "Type a regular expression between the slashes and pick flags — or load an example." },
      { title: "Add test text", body: "Paste the text to search. Matches highlight instantly and appear in the list." },
      { title: "Inspect and copy", body: "Check positions and groups, then copy the regex, copy the matches or download the report." },
    ],
    specs: [
      { label: "Engine", value: "Your browser's JavaScript RegExp" },
      { label: "Flags", value: "g, i, m, s, u, y" },
      { label: "Time limit", value: "1.5 seconds per run" },
      { label: "Test text limit", value: "200,000 characters" },
      { label: "Match limit", value: "5,000 matches (first 2,000 highlighted)" },
      { label: "Export", value: "TXT report" },
    ],
    formats: ["Text", "TXT"],
    privacy: "Patterns and text are matched in your browser and never sent or stored.",
    examples: [
      { title: "Indian PIN codes", body: String.raw`\b[1-9]\d{2}\s?\d{3}\b with the g flag finds 560001 and 400 013 but not 012345.` },
      { title: "Dates with named groups", body: String.raw`(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}) on “Due 2026-11-12” gives year 2026, month 11, day 12.` },
      { title: "Why the g flag matters", body: String.raw`\d+ on “10 apples, 20 pears” finds only 10 without g, and both 10 and 20 with it.` },
    ],
    faqs: [
      { q: "Which regex flavour does this use?", a: "JavaScript (ECMAScript), via your browser's built-in RegExp. Most syntax is shared with PCRE, Python and Java, but some features differ — for example possessive quantifiers and some inline modifiers aren't supported in JavaScript." },
      { q: "Why does my pattern only find one match?", a: "Without the g (global) flag, JavaScript stops after the first match. Turn on Global to find them all." },
      { q: "What does “stopped after 1.5 seconds” mean?", a: "The pattern took too long, usually because nested or overlapping quantifiers like (a+)+ or (.*)* make the engine try a huge number of combinations. Make the pattern more specific." },
      { q: "What are named groups?", a: "Groups written as (?<name>…). They capture like normal groups but can be referred to by name; the match list shows the name next to the value." },
      { q: "Are the example patterns complete validators?", a: "No. They're practical starting points — for instance, the email pattern accepts common addresses but not every address the standards allow. Test them against your own data." },
      { q: "Is my text uploaded?", a: "No. Everything runs in your browser." },
    ],
    related: ["json-formatter", "url-encoder-decoder", "html-formatter"],
    searchTerms: ["regex", "regexp", "regular expression", "pattern", "match", "test", "javascript", "capture group", "named group", "flags", "debug", "validator"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "html-formatter",
    name: "HTML Formatter & Minifier",
    category: "developer",
    icon: "html",
    short: "Beautify messy HTML with clean indentation, or minify it for production.",
    intro:
      "Paste or open HTML to beautify it with consistent indentation, or minify it to cut file size. Keep or strip comments, see the size difference, check for unclosed tags, and download the result.",
    what:
      "An HTML formatter (or beautifier) re-indents HTML so its structure is easy to read; a minifier removes unnecessary whitespace and comments to make the file smaller. ZSpace Tools' HTML Formatter & Minifier does both, and also points out common structural problems such as unclosed or stray tags.",
    how:
      "The HTML is read by a tokenizer that understands tags, attributes, comments, doctype and void elements like <img> and <br>, and builds a tree — closing <p> and <li> implicitly where HTML allows. Beautify prints that tree with your chosen indentation; short inline content stays on one line. Minify collapses whitespace between tags and inside text. The contents of <pre>, <textarea>, <script> and <style> are always left exactly as written. Your HTML is treated only as text: it's never rendered, and scripts in it never run.",
    seo: {
      title: "HTML Formatter & Minifier Online – Free HTML Beautifier",
      description:
        "Format, beautify and minify HTML code online. Clean messy HTML, improve readability and reduce file size with this free HTML formatter and minifier.",
      keyword: "HTML formatter",
      secondary: ["HTML beautifier", "HTML minifier", "format HTML online", "minify HTML", "HTML pretty print", "clean HTML code"],
    },
    features: [
      { title: "Beautify", body: "Consistent indentation with 2 spaces, 4 spaces or tabs; nested elements on their own lines." },
      { title: "Minify", body: "Removes whitespace between tags and, optionally, comments — with a before/after size comparison." },
      { title: "Safe for code blocks", body: "<pre>, <textarea>, <script> and <style> contents are preserved exactly." },
      { title: "Structure checks", body: "Flags unclosed tags, stray closing tags and closing tags on void elements, with line numbers." },
      { title: "Comments and blank lines", body: "Choose whether to keep <!-- comments --> and the blank lines between sections." },
      { title: "Open, copy, download", body: "Open an .html file, copy the result or download it as index.html or index.min.html." },
    ],
    steps: [
      { title: "Add your HTML", body: "Paste it, open an .html file, or load the sample." },
      { title: "Beautify or minify", body: "Pick an action, indentation and comment options. The output updates as you edit." },
      { title: "Check and export", body: "Review any structure warnings and the size change, then copy or download." },
    ],
    specs: [
      { label: "Indentation", value: "2 spaces, 4 spaces or tab" },
      { label: "Preserved as-is", value: "<pre>, <textarea>, <script>, <style>" },
      { label: "Checks", value: "Unclosed, stray and void-element closing tags" },
      { label: "File types", value: ".html, .htm (up to 5 MB)" },
      { label: "Output", value: "Copy or download .html" },
      { label: "Rendering", value: "Never — input is treated as text" },
    ],
    formats: ["HTML", "HTM"],
    privacy: "HTML is formatted in your browser and never sent, stored, rendered or executed.",
    examples: [
      { title: "One-line markup", body: "<ul><li>One<li>Two</ul> beautifies to a <ul> with two indented <li> lines, each closed properly." },
      { title: "Minify a page", body: "A 3 KB hand-written page with indentation and comments typically shrinks by 15–30% — the exact figure is shown for your file." },
      { title: "Catching mistakes", body: "<div><span>Hi</div> is reported as “<span> opened on line 1 is never closed”." },
    ],
    faqs: [
      { q: "Will beautifying change how my page looks?", a: "It shouldn't for normal block layout, but whitespace between inline elements (like two <a> tags) can matter in HTML. The formatter keeps short inline runs on one line to minimise this; check pages where spacing between inline elements is critical." },
      { q: "Is minified HTML safe to use?", a: "Yes for typical pages — only whitespace between tags, runs of spaces and (optionally) comments are removed, and <pre>, <textarea>, <script> and <style> are untouched. Conditional comments and server templates may need comments kept." },
      { q: "Does it validate HTML?", a: "It checks common structural problems — unclosed tags, stray closing tags and closing tags on void elements. It isn't a full W3C validator and doesn't check attributes or content models." },
      { q: "Does it minify inline CSS and JavaScript?", a: "No. Script and style contents are kept exactly as written. Use the CSS Minifier for stylesheets." },
      { q: "Is it safe to paste HTML containing scripts?", a: "Yes. The tool never renders your HTML or runs its scripts — it's only processed as text." },
      { q: "Is my code uploaded?", a: "No. Formatting happens entirely in your browser." },
    ],
    related: ["css-minifier", "json-formatter", "markdown-editor"],
    searchTerms: ["html", "formatter", "beautifier", "beautify", "minify", "minifier", "pretty print", "indent", "clean", "markup", "htm", "web", "compress html"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "css-minifier",
    name: "CSS Minifier & Beautifier",
    category: "developer",
    icon: "css",
    short: "Minify CSS for production or beautify it into readable, consistently indented rules.",
    intro:
      "Paste or open a stylesheet to minify it for faster pages, or beautify it with clean indentation. Choose how comments are handled, see exactly how much smaller the file gets, and catch syntax errors.",
    what:
      "A CSS minifier removes everything a browser doesn't need — whitespace, comments, redundant zeros and units — to make stylesheets smaller. A beautifier does the opposite, laying the rules out one declaration per line. ZSpace Tools' CSS Minifier & Beautifier does both, and reports syntax errors with line numbers.",
    how:
      "Minification uses csso, an established open-source CSS optimiser built on a full CSS parser, with restructuring turned off — so rules are never merged or reordered, which keeps the cascade exactly as you wrote it. It shortens values safely (0px → 0, #ffffff → #fff) and keeps /*! licence */ comments by default. Beautifying uses a character-level tokenizer that understands strings, comments, url() and brackets, so a } inside a string can't break a rule. Syntax errors are found with the same parser in tolerant mode.",
    seo: {
      title: "CSS Minifier & Beautifier Online – Free CSS Formatter",
      description:
        "Minify, format and beautify CSS code online. Reduce CSS file size, clean messy stylesheets and improve readability with this free CSS minifier and beautifier.",
      keyword: "CSS minifier",
      secondary: ["CSS beautifier", "CSS formatter", "minify CSS online", "compress CSS", "format CSS", "CSS pretty print"],
    },
    features: [
      { title: "Safe minification", body: "Whitespace, comments and redundant values removed — rules are never merged or reordered." },
      { title: "Readable beautify", body: "One declaration per line, consistent indentation, selector lists split, nested @media and @keyframes indented." },
      { title: "Comment control", body: "Keep /*! licence */ comments (default), remove them all, or keep every comment." },
      { title: "Final semicolons", body: "Keep or drop the last semicolon in each rule — handy for diff-friendly output." },
      { title: "Size comparison", body: "Original and output size in bytes with the exact percentage saved." },
      { title: "Syntax checks", body: "Unbalanced braces, unclosed strings or comments and parse errors with line numbers." },
    ],
    steps: [
      { title: "Add your CSS", body: "Paste it, open a .css file, or load the sample." },
      { title: "Minify or beautify", body: "Choose an action, indentation, comment handling and semicolons." },
      { title: "Copy or download", body: "Check the size saved and any warnings, then copy or download styles.min.css." },
    ],
    specs: [
      { label: "Minifier", value: "csso 5 (restructure off)" },
      { label: "Comments", value: "Keep /*! */, remove all or keep all" },
      { label: "Indentation", value: "2 spaces, 4 spaces or tab" },
      { label: "Checks", value: "Braces, strings, comments, parse errors" },
      { label: "File types", value: ".css (up to 5 MB)" },
      { label: "Output", value: "Copy or download .css" },
    ],
    formats: ["CSS"],
    privacy: "CSS is processed in your browser and never sent or stored.",
    examples: [
      { title: "Shorter values", body: "margin: 0px 0px 0px 0px; color: #FFFFFF → margin:0 0 0 0;color:#fff — the meaning is identical." },
      { title: "Licence comments", body: "/*! MIT licence */ is kept by default; ordinary /* notes */ are removed." },
      { title: "Strings are safe", body: "content: \"a } b\" stays intact — the } inside quotes isn't treated as the end of a rule." },
    ],
    faqs: [
      { q: "Will minifying change how my site looks?", a: "It shouldn't. Restructuring is off, so rules keep their order and the cascade is unchanged; only whitespace, comments and equivalent shorter values are changed. As with any build step, check the result before deploying." },
      { q: "What are /*! comments?", a: "A convention for comments that must be kept, usually licences. They're kept by default when minifying; choose Remove to drop them too." },
      { q: "Why is “Keep all” comments less effective?", a: "To keep every comment in place, the tool only collapses whitespace in that mode and doesn't optimise values. Use the default for the smallest file." },
      { q: "Does it support modern CSS?", a: "Yes — custom properties, @media, @supports, @layer, @container, @keyframes and nesting are parsed. Custom property values are kept as written." },
      { q: "Does it add vendor prefixes or remove unused CSS?", a: "No. It doesn't add prefixes, remove unused selectors or merge rules — it only shrinks or formats what's there." },
      { q: "Is my CSS uploaded?", a: "No. Everything runs in your browser." },
    ],
    related: ["html-formatter", "color-picker", "json-formatter"],
    searchTerms: ["css", "minify", "minifier", "beautify", "beautifier", "formatter", "compress css", "stylesheet", "pretty print", "clean css", "optimize css"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "discount-calculator",
    name: "Discount Calculator",
    category: "calculators",
    icon: "discount",
    short: "Sale price, savings, discount %, stacked discounts, original price and markup — in one place.",
    intro:
      "Work out the sale price and how much you save, find the discount percentage between two prices, stack successive discounts, recover the original price, or compare markup and discount for your own pricing.",
    what:
      "A discount calculator works out the price after a percentage off and the amount saved. ZSpace Tools' Discount Calculator also finds the discount between two prices, combines successive discounts correctly, works backwards from a sale price to the original, and shows profit, markup and margin when you mark up a cost price and then offer a discount.",
    how:
      "Sale price = original × (1 − discount ÷ 100). The discount between two prices is (original − final) ÷ original × 100; if the final price is higher, it's shown as an increase instead. Successive discounts are applied one after another, so the effective discount is 1 − (1 − d₁)(1 − d₂)… — 20% then 10% is 28%, not 30%. The original price is sale price ÷ (1 − discount). For pricing, the marked price is cost × (1 + markup), the selling price is the marked price less the discount, markup is profit ÷ cost and margin is profit ÷ selling price. Tax isn't added or removed.",
    seo: {
      title: "Discount Calculator Online – Calculate Sale Price & Savings",
      description:
        "Calculate discount percentage, sale price and total savings instantly. Use this free discount calculator for shopping, offers and business pricing.",
      keyword: "discount calculator",
      secondary: ["sale price calculator", "percentage off calculator", "discount percentage calculator", "successive discount calculator", "markup and discount calculator", "original price calculator"],
    },
    features: [
      { title: "Sale price and savings", body: "Enter a price and a discount — or tap 5% to 60% — to see the final price and what you save." },
      { title: "Find the discount %", body: "Enter the original and the price you paid; if it went up, it's clearly shown as an increase." },
      { title: "Successive discounts", body: "Stack up to five discounts and see each step and the true effective discount." },
      { title: "Original price", body: "Know the sale price and the discount? Get the price before the discount." },
      { title: "Markup vs discount", body: "From cost price to marked price to selling price, with profit or loss, markup achieved and margin." },
      { title: "Any currency", body: "INR, USD, GBP, EUR, AED, SGD or AUD formatting; copy or download a summary." },
    ],
    steps: [
      { title: "Choose a calculation", body: "Sale price, find discount %, successive, original price, or markup & discount." },
      { title: "Enter the numbers", body: "Results update as you type. Use the presets for common discounts." },
      { title: "Copy or download", body: "Copy the summary or download it as a text file." },
    ],
    specs: [
      { label: "Modes", value: "Sale price, find %, successive, original price, markup & discount" },
      { label: "Discount presets", value: "5, 10, 15, 20, 25, 30, 40, 50, 60%" },
      { label: "Successive discounts", value: "Up to 5" },
      { label: "Currencies", value: "INR, USD, GBP, EUR, AED, SGD, AUD" },
      { label: "Tax", value: "Not included" },
      { label: "Display rounding", value: "2 decimals" },
    ],
    formats: ["TXT"],
    privacy: "Calculations run in your browser. Nothing you enter is sent or stored.",
    examples: [
      { title: "30% off ₹2,499", body: "Saving ₹749.70, final price ₹1,749.30." },
      { title: "20% + 10% off ₹10,000", body: "₹10,000 → ₹8,000 → ₹7,200. Effective discount 28%, not 30%." },
      { title: "Original price", body: "Paid ₹750 after 25% off → the original price was ₹750 ÷ 0.75 = ₹1,000." },
      { title: "Markup then discount", body: "Cost ₹500, marked up 40% to ₹700, sold at 10% off for ₹630: profit ₹130, markup achieved 26%, margin 20.63%." },
    ],
    faqs: [
      { q: "How do I calculate a discount?", a: "Multiply the price by the discount percentage and divide by 100 to get the saving, then subtract it. ₹2,499 at 30% off: 2,499 × 30 ÷ 100 = ₹749.70 saved, so you pay ₹1,749.30." },
      { q: "Do successive discounts add up?", a: "No. Each discount applies to the already-reduced price. 20% then 10% is 1 − 0.8 × 0.9 = 28% overall, not 30%." },
      { q: "How do I find the discount percentage?", a: "Subtract the price you paid from the original, divide by the original and multiply by 100. ₹1,000 down to ₹750 is a 25% discount." },
      { q: "What's the difference between markup and margin?", a: "Markup is profit as a percentage of cost; margin is profit as a percentage of the selling price. Selling a ₹500 item for ₹630 is a 26% markup but a 20.63% margin." },
      { q: "Can a discount be more than 100%?", a: "Not for a price — above 100% the seller would be paying you, so the calculator asks for 100% or less." },
      { q: "Is GST included?", a: "No. Prices are used exactly as entered. Use the GST Calculator to add or remove GST." },
    ],
    related: ["percentage-calculator", "gst-calculator", "tip-calculator"],
    searchTerms: ["discount", "sale", "sale price", "price", "percent off", "percentage off", "savings", "offer", "deal", "markup", "margin", "profit", "successive", "original price", "shopping", "mrp"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "meta-tag-generator",
    name: "Meta Tag Generator",
    category: "seo",
    icon: "meta",
    short: "Create title, description, canonical, robots, Open Graph and X tags with live previews.",
    intro:
      "Fill in your page details and get ready-to-paste meta tags — title, description, canonical URL, robots, Open Graph and Twitter/X cards — with a search-result preview and social card previews as you type.",
    what:
      "A meta tag generator writes the HTML tags in a page's <head> that describe it to search engines and social platforms. ZSpace Tools' Meta Tag Generator builds the title tag, meta description, canonical link, robots directive, Open Graph tags and Twitter/X card tags from one form, escapes every value so the HTML stays valid, and shows how the page might look in search results and when shared.",
    how:
      "Each value is cleaned (line breaks collapsed) and escaped for HTML — quotes, ampersands and angle brackets become entities — so a title like Tom & Jerry's “Best” <Deals> can't break the tag. URLs are checked to be absolute http or https addresses; invalid ones are left out rather than written into the tags. Open Graph locale is derived from the language you choose (en-IN → en_IN). The previews are drawn in your browser from the same values and are illustrations: search engines decide the final title and snippet, and truncation depends on pixel width, device and query.",
    seo: {
      title: "Meta Tag Generator Online – Free SEO Meta Tags & HTML Code",
      description:
        "Generate SEO meta tags, title tags, descriptions, canonical URLs, Open Graph and Twitter/X cards instantly. Copy ready-to-use HTML with our free meta tag generator.",
      keyword: "meta tag generator",
      secondary: ["SEO meta tag generator", "HTML meta tags generator", "meta description generator", "title tag generator", "Open Graph tag generator", "Twitter card generator"],
    },
    features: [
      { title: "Every essential tag", body: "Title, description, canonical, robots, author, Open Graph and Twitter/X — from one form." },
      { title: "Live previews", body: "Illustrative search result plus Open Graph and X cards, on desktop or mobile widths." },
      { title: "Safe HTML", body: "Values are escaped and URLs validated, so quotes or ampersands never break your markup." },
      { title: "Helpful checks", body: "Notes on long titles, missing descriptions, noindex, canonical mismatches and invalid X handles." },
      { title: "Four output views", body: "Basic meta tags, Open Graph, Twitter/X or everything combined — copy one tag or all." },
      { title: "HTML download", body: "Download a minimal HTML file with the tags in place, ready to adapt." },
    ],
    steps: [
      { title: "Describe the page", body: "Enter the title, description, URL and, optionally, a social image and site name." },
      { title: "Check the previews", body: "See how the title and description might appear, and adjust anything flagged." },
      { title: "Copy into your <head>", body: "Copy the combined snippet, or individual tags, into your site or CMS." },
    ],
    specs: [
      { label: "Tags", value: "title, description, canonical, robots, author, keywords, OG, Twitter/X" },
      { label: "Robots presets", value: "index/noindex × follow/nofollow, or custom" },
      { label: "X cards", value: "summary, summary_large_image" },
      { label: "Escaping", value: "& < > \" ' → HTML entities" },
      { label: "URL checks", value: "Absolute http(s) only" },
      { label: "Output", value: "Copy or download .html" },
    ],
    formats: ["HTML"],
    privacy: "Everything you type is turned into tags in your browser and never sent or stored. Preview images load directly from the address you enter.",
    examples: [
      { title: "Escaping in action", body: "A title of Tom & Jerry “Deals” becomes <title>Tom &amp; Jerry “Deals”</title> and content=\"Tom &amp; Jerry “Deals”\" in the meta tags." },
      { title: "Language to locale", body: "Choosing English (India) — en-IN — adds <meta property=\"og:locale\" content=\"en_IN\">." },
      { title: "Canonical fallback", body: "Leave Canonical URL empty and the page URL is used: <link rel=\"canonical\" href=\"https://example.com/mugs/\">." },
    ],
    faqs: [
      { q: "How long should a title and meta description be?", a: "There's no fixed limit. Search engines truncate by pixel width, which varies by device and characters, so many people aim for roughly 50–60 characters for titles and 150–160 for descriptions. The counter shows these as guides, not guarantees." },
      { q: "Will meta tags improve my rankings?", a: "Good titles and descriptions help people understand and click your result, and a correct canonical and robots tag prevent problems. They don't guarantee higher rankings — content and relevance matter far more." },
      { q: "Do meta keywords matter?", a: "Google doesn't use the keywords meta tag for ranking. The field is optional and only included if you fill it in." },
      { q: "Why does Google show a different title or description?", a: "Search engines sometimes rewrite titles and pick a snippet from the page that better matches the search. Your tags are a strong suggestion, not a command." },
      { q: "What's a canonical URL?", a: "The preferred address for a page when the same content is reachable at several URLs (for example with tracking parameters). It tells search engines which one to show." },
      { q: "When should I use noindex?", a: "Only for pages you deliberately don't want in search results, such as thank-you pages or internal search results. Normal public pages should use index, follow — the default here." },
    ],
    related: ["open-graph-preview", "robots-txt-generator", "xml-sitemap-generator"],
    searchTerms: ["meta", "meta tags", "seo", "title tag", "meta description", "canonical", "robots meta", "open graph", "og tags", "twitter card", "x card", "head tags", "html meta"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "xml-sitemap-generator",
    name: "XML Sitemap Generator",
    category: "seo",
    icon: "sitemap",
    short: "Build a valid sitemap.xml from a URL list — with dates, splitting and a sitemap index.",
    intro:
      "Paste or upload your page URLs, or import an existing sitemap, and download a valid sitemap.xml. Set last-modified dates, change frequency and priority if you need them; large sites are split automatically with a sitemap index.",
    what:
      "An XML sitemap is a file listing the pages on your site that you want search engines to know about, optionally with when each page last changed. ZSpace Tools' XML Sitemap Generator builds sitemaps that follow the sitemaps.org protocol: it validates and de-duplicates URLs, keeps only your own site's pages, escapes XML correctly and splits lists over 50,000 URLs or 50 MB into several files with an index.",
    how:
      "Each line is parsed as a URL. Paths like /about resolve against your website address; anything that isn't http or https, has a username or password, belongs to another site (unless you add that origin), or is just a #fragment is skipped with a reason. Fragments are removed, spaces and non-ASCII characters are percent-encoded, and duplicates are dropped. Last-modified, change frequency and priority are only written when you provide them — nothing is invented. The XML is escaped (& becomes &amp;) and checked against the protocol limits; the browser's XML parser confirms it's well-formed. Websites aren't crawled: browsers block reading other sites, so you add URLs or import an existing sitemap instead.",
    seo: {
      title: "XML Sitemap Generator Online – Create sitemap.xml for Free",
      description:
        "Generate XML sitemaps online for free. Add website URLs, set last modified dates, priorities and change frequencies, then download a valid sitemap.xml file.",
      keyword: "XML sitemap generator",
      secondary: ["create sitemap.xml", "website sitemap generator", "sitemap builder online", "generate XML sitemap", "sitemap index generator", "sitemap.xml file"],
    },
    features: [
      { title: "Many ways to add URLs", body: "Paste a list, type one at a time, upload TXT or CSV, or import an existing sitemap.xml." },
      { title: "Clean, valid URL list", body: "Duplicates removed, fragments stripped, other sites and malformed entries skipped — with the reason shown." },
      { title: "Honest metadata", body: "lastmod, changefreq and priority are optional, with defaults you choose and per-URL overrides. Nothing is invented." },
      { title: "Large sites handled", body: "Over 50,000 URLs or 50 MB? Files are split and a sitemap index is generated, all downloadable as a ZIP." },
      { title: "Validate and preview", body: "XML preview, a well-formedness check and protocol limits verified before you download." },
      { title: "Edit existing sitemaps", body: "Import sitemap.xml, edit dates, frequency and priority in a table, and regenerate. Export the list as CSV." },
    ],
    steps: [
      { title: "Enter your website", body: "Add your site address so URLs can be checked and paths resolved." },
      { title: "Add URLs", body: "Paste, upload or import them. Set default dates, frequency or priority only if they're meaningful." },
      { title: "Download and upload", body: "Download sitemap.xml (or the ZIP with an index), upload it to your site and reference it in robots.txt or Search Console." },
    ],
    specs: [
      { label: "Protocol", value: "sitemaps.org 0.9" },
      { label: "Limits per file", value: "50,000 URLs and 50 MB (auto-split + index)" },
      { label: "Inputs", value: "Paste, single URL, TXT, CSV, sitemap.xml, sitemap index" },
      { label: "Optional tags", value: "lastmod (W3C date), changefreq, priority 0.0–1.0" },
      { label: "Exports", value: "sitemap.xml, ZIP with index, CSV" },
      { label: "Crawling", value: "None — browsers can't read other sites" },
    ],
    formats: ["XML", "TXT", "CSV", "ZIP"],
    privacy: "URLs are processed in your browser. Nothing is sent, crawled or submitted on your behalf.",
    examples: [
      { title: "Cleaning a pasted list", body: "https://example.com/a, /a (resolved to the same page), https://example.com/a#reviews and https://other.com/ become one entry: https://example.com/a — one duplicate removed and one external URL skipped." },
      { title: "Escaping", body: "https://example.com/search?q=mugs&page=2 is written as <loc>https://example.com/search?q=mugs&amp;page=2</loc>." },
      { title: "A large site", body: "120,000 URLs become sitemap-1.xml and sitemap-2.xml (50,000 each), sitemap-3.xml (20,000) and sitemap-index.xml listing all three." },
    ],
    faqs: [
      { q: "Does this tool crawl my website?", a: "No. Browsers don't allow one website to read another site's pages, and ZSpace Tools doesn't run a crawler on a server. Add your URLs, upload a list exported from your CMS, or import your existing sitemap." },
      { q: "Do I need lastmod, changefreq and priority?", a: "No. Only loc is required. Google ignores changefreq and priority, and uses lastmod only when it's consistently accurate — so leave dates out unless you know when pages really changed." },
      { q: "Will a sitemap get my pages indexed or ranked?", a: "It helps search engines discover your pages, especially new or poorly linked ones, but it doesn't guarantee crawling, indexing or rankings." },
      { q: "How do I submit my sitemap?", a: "Upload it to your site (commonly at /sitemap.xml), add a line like Sitemap: https://example.com/sitemap.xml to robots.txt, and optionally submit it in Google Search Console and Bing Webmaster Tools. This tool doesn't submit anything for you." },
      { q: "What happens with more than 50,000 URLs?", a: "The protocol allows 50,000 URLs or 50 MB per file, so the list is split into several sitemaps plus a sitemap index. Upload all the files and submit the index." },
      { q: "Why were some URLs skipped?", a: "Each skipped entry shows the reason — for example another domain, a non-http scheme, a #fragment-only link or invalid characters. Add an extra origin if you really want another host included." },
    ],
    related: ["robots-txt-generator", "meta-tag-generator", "url-slug-generator"],
    searchTerms: ["sitemap", "sitemap.xml", "xml sitemap", "site map", "sitemap index", "seo", "google search console", "lastmod", "changefreq", "priority", "urls", "crawl"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "robots-txt-generator",
    name: "Robots.txt Generator",
    category: "seo",
    icon: "robots",
    short: "Build robots.txt crawler rules with presets, multiple user agents and a URL tester.",
    intro:
      "Create a robots.txt file without memorising the syntax. Start from a preset, add user-agent groups and Allow or Disallow rules, declare your sitemap, then test whether a URL is blocked before you upload.",
    what:
      "A robots.txt file sits at the root of a website and tells compliant crawlers which paths they may fetch. ZSpace Tools' Robots.txt Generator writes the file from a visual rule builder, warns about risky rules such as blocking the whole site or your CSS, and includes a tester that estimates whether a crawler may fetch a given URL.",
    how:
      "Groups start with one or more User-agent lines followed by Allow and Disallow rules; Sitemap lines are listed at the end with full URLs. The tester follows RFC 9309, the Robots Exclusion Protocol: it picks the group naming the crawler (or the * group if none does), finds every rule whose path matches the start of the URL path, and applies the most specific (longest) one — Allow wins a tie. * matches any characters and $ anchors the end. Google's specialised crawlers such as Googlebot-Image fall back to Googlebot's group, as Google documents. It's a simplified model; individual crawlers can differ.",
    seo: {
      title: "Robots.txt Generator Online – Create Search Engine Crawler Rules",
      description:
        "Generate a robots.txt file online for free. Configure user agents, allow and disallow rules, sitemap locations and crawler directives for your website.",
      keyword: "robots.txt generator",
      secondary: ["create robots.txt", "robots.txt file generator", "search engine crawler rules", "robots.txt for websites", "robots.txt tester", "disallow rules"],
    },
    features: [
      { title: "Presets", body: "Allow all, basic website, WordPress and e-commerce examples, custom — and Block all behind a clear confirmation." },
      { title: "Visual rule builder", body: "Add, edit, reorder and remove Allow and Disallow rules for each user-agent group." },
      { title: "Multiple crawlers", body: "Separate groups for *, Googlebot, Bingbot, Googlebot-Image or any custom user agent." },
      { title: "Sitemap & extras", body: "Sitemap declarations, comments and an optional Crawl-delay with a compatibility note." },
      { title: "Safety warnings", body: "Flags site-wide blocks, blocked CSS/JS, relative sitemap URLs and paths that don't start with /." },
      { title: "URL tester", body: "Enter a crawler and a URL to see Allowed or Blocked, with the exact rule that decided it." },
    ],
    steps: [
      { title: "Pick a starting point", body: "Enter your site and choose a preset, or start from scratch." },
      { title: "Adjust the rules", body: "Add user-agent groups, Allow/Disallow paths and your sitemap URL. Check any warnings." },
      { title: "Test and upload", body: "Test important URLs, then download robots.txt and upload it to your site's root." },
    ],
    specs: [
      { label: "Directives", value: "User-agent, Allow, Disallow, Sitemap, Crawl-delay" },
      { label: "Matching", value: "RFC 9309: longest match, Allow wins ties, * and $" },
      { label: "Presets", value: "6 (incl. WordPress and e-commerce examples)" },
      { label: "Groups", value: "Unlimited, any user agent" },
      { label: "Output", value: "Copy or download robots.txt" },
      { label: "Location", value: "https://yourdomain/robots.txt" },
    ],
    formats: ["TXT"],
    privacy: "Rules are built and tested in your browser. Nothing is sent or stored.",
    examples: [
      { title: "Most specific rule wins", body: "With Disallow: /wp-admin/ and Allow: /wp-admin/admin-ajax.php, the AJAX file is allowed and everything else in /wp-admin/ is blocked." },
      { title: "End anchor", body: "Disallow: /*.php$ blocks /index.php but not /index.php?page=2, because $ requires the URL to end there." },
      { title: "Crawler-specific group", body: "A Googlebot group overrides the * group for Googlebot — its rules are not combined with the * rules." },
    ],
    faqs: [
      { q: "Does robots.txt remove pages from Google?", a: "No. It controls crawling, not indexing. A blocked URL can still appear in results — usually without a description — if other pages link to it. To keep a page out of results, allow crawling and use a noindex tag, or remove or password-protect it." },
      { q: "Can I use robots.txt and noindex together?", a: "Not on the same URL. If robots.txt blocks a page, crawlers can't fetch it, so they never see its noindex tag." },
      { q: "Does Disallow protect private pages?", a: "No. robots.txt is public and only a request — anyone can read it, and badly behaved bots ignore it. Protect private content with authentication." },
      { q: "Where do I put the file?", a: "At the root of each host: https://example.com/robots.txt. A subdomain like shop.example.com needs its own file. It must be plain text named exactly robots.txt." },
      { q: "Should I block CSS and JavaScript?", a: "Usually not. Search engines render pages much like a browser, and blocking CSS or JS files can stop them understanding your layout and content." },
      { q: "Does Google support Crawl-delay?", a: "No. Google ignores Crawl-delay. Bing and some other crawlers honour it. Directive support varies by crawler." },
    ],
    related: ["xml-sitemap-generator", "meta-tag-generator", "open-graph-preview"],
    searchTerms: ["robots", "robots.txt", "crawler", "disallow", "allow", "user-agent", "googlebot", "bingbot", "seo", "block crawlers", "noindex", "tester", "crawl rules"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "open-graph-preview",
    name: "Open Graph Preview",
    category: "seo",
    icon: "share",
    short: "Preview link cards for Facebook, LinkedIn, WhatsApp and X, and generate the tags.",
    intro:
      "See how a link might look when it's shared on Facebook, LinkedIn, WhatsApp and X. Edit the title, description and image, check your image's size, and copy the Open Graph and Twitter/X tags.",
    what:
      "Open Graph tags (og:title, og:image and so on) tell social platforms what title, description and image to show when someone shares a link. ZSpace Tools' Open Graph Preview simulates the link cards of four popular platforms from your values — or from a page's own tags read from its HTML source — and generates the matching tags.",
    how:
      "Previews are drawn in your browser to approximate each platform's card layout: a wide image (about 1.91:1) with the title and domain, or the square image used by X's summary card. Your image loads directly from its URL so the tool can report its real dimensions and whether it loads at all; a local image you pick is previewed from your device and never uploaded. Import reads the <title>, description, og: and twitter: tags from HTML you paste — the page itself isn't fetched, because browsers block reading other sites and ZSpace Tools doesn't fetch pages on a server.",
    seo: {
      title: "Open Graph Preview Tool – Preview Social Media Link Cards",
      description:
        "Preview how your website links appear on Facebook, LinkedIn, WhatsApp and X. Edit Open Graph metadata and generate social sharing tags with this free tool.",
      keyword: "Open Graph preview",
      secondary: ["OG image preview", "Facebook link preview", "LinkedIn preview tool", "social media link preview", "WhatsApp link preview", "Twitter card preview"],
    },
    features: [
      { title: "Four link previews", body: "Facebook-, LinkedIn-, WhatsApp- and X-style cards, side by side, at desktop or mobile widths." },
      { title: "Image check", body: "Shows your image's real dimensions and whether it loads, with crop guidance for common sizes." },
      { title: "Local image preview", body: "Try an image from your device before uploading it — it never leaves your browser." },
      { title: "Import from page source", body: "Paste a page's HTML to read its existing tags; imported fields are clearly marked." },
      { title: "Tag output", body: "og:title, og:description, og:image, og:url, og:type, og:site_name and Twitter/X card tags — copy one or all." },
      { title: "Character counts", body: "Title and description counts with common guide lengths." },
    ],
    steps: [
      { title: "Enter or import details", body: "Type the title, description, URL and image — or paste the page's HTML source to import its tags." },
      { title: "Compare the previews", body: "Check each platform's card on desktop and mobile widths, and the image guidance." },
      { title: "Copy the tags", body: "Copy or download the Open Graph and Twitter/X tags and add them to your page's <head>." },
    ],
    specs: [
      { label: "Previews", value: "Facebook, LinkedIn, WhatsApp, X (simulated)" },
      { label: "Common image size", value: "1200 × 630 px (≈1.91:1) — guidance only" },
      { label: "Local images", value: "PNG, JPG, WebP, GIF — preview only" },
      { label: "Import", value: "From pasted HTML or an .html file" },
      { label: "Tags", value: "6 Open Graph + 4–5 Twitter/X" },
      { label: "Output", value: "Copy or download HTML snippet" },
    ],
    formats: ["HTML"],
    privacy: "Values and local images stay in your browser. Image URLs you enter are loaded directly from their own servers to preview them.",
    examples: [
      { title: "A 1200 × 630 image", body: "Reported as ≈1.91:1 — it fills Facebook-, LinkedIn- and X-style large cards with little cropping." },
      { title: "A square 800 × 800 logo", body: "Large cards crop the top and bottom; X's summary card shows it as a small square thumbnail." },
      { title: "Importing tags", body: "Paste a page's source and og:title, og:description and og:image fill the form, each marked “Imported” until you edit it." },
    ],
    faqs: [
      { q: "Are these exactly how the platforms will look?", a: "No — they're simulations. Each platform has its own layout, cropping and truncation, changes them over time, and may vary by device and app version." },
      { q: "Why does my old preview still show after I changed the tags?", a: "Platforms cache link previews. Facebook's Sharing Debugger and LinkedIn's Post Inspector can refresh their copy; other platforms update on their own schedule." },
      { q: "Why can't the tool fetch my page's tags?", a: "Browsers block one website from reading another's pages, and ZSpace Tools doesn't fetch pages on a server. Open the page, view its source and paste it into Import." },
      { q: "What image size should I use?", a: "1200 × 630 px is a common choice for landscape link cards. Platforms resize and crop differently, so keep important content away from the edges." },
      { q: "Do I need both Open Graph and Twitter tags?", a: "X falls back to Open Graph for title, description and image, but needs twitter:card to choose the card style. Including both is common." },
      { q: "Does adding tags guarantee a preview?", a: "No. Platforms decide whether and how to show a preview, and need to be able to fetch your page and image publicly." },
    ],
    related: ["meta-tag-generator", "image-resizer", "image-cropper"],
    searchTerms: ["open graph", "og", "og image", "og tags", "link preview", "social preview", "facebook preview", "linkedin preview", "whatsapp preview", "twitter card", "x card", "share preview", "social card"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "html-entity-encoder",
    name: "HTML Entity Encoder & Decoder",
    category: "seo",
    icon: "entity",
    short: "Encode special characters as HTML entities, or decode named and numeric entities back to text.",
    intro:
      "Convert characters like &, <, > and quotes into HTML entities, or turn &amp;, &#169; and &#x1F600; back into readable text. Choose named, decimal or hex entities, and see any invalid or unknown entities flagged.",
    what:
      "HTML entities are codes such as &amp; or &#169; that stand for characters which would otherwise be read as HTML, or are hard to type. ZSpace Tools' HTML Entity Encoder & Decoder encodes text into entities and decodes all 2,231 named HTML entities plus decimal and hexadecimal references, following the HTML specification.",
    how:
      "Encoding walks through your text one Unicode character at a time, so an emoji becomes one reference (&#x1F600;) rather than two broken halves. Special characters always encode; you can also encode every non-ASCII character as a named entity where one exists, or as decimal or hex. Decoding uses the HTML standard's rules — including legacy names without a semicolon and the replacement character for invalid code points — and lists anything unusual. Decoded results are only ever shown as plain text, never rendered.",
    seo: {
      title: "HTML Entity Encoder & Decoder Online – Free HTML Character Converter",
      description:
        "Encode and decode HTML entities online for free. Convert special characters into HTML entities and decode HTML character references instantly.",
      keyword: "HTML entity encoder",
      secondary: ["HTML entity decoder", "encode HTML characters", "decode HTML entities", "HTML special character converter", "HTML escape online", "HTML unescape"],
    },
    features: [
      { title: "Encode and decode", body: "Switch direction anytime, or feed the output straight back in." },
      { title: "Named, decimal or hex", body: "&copy;, &#169; or &#xA9; — your choice, with numeric fallbacks for characters without a name." },
      { title: "Flexible scope", body: "Encode just & < > and quotes, or every non-ASCII character too." },
      { title: "No double encoding", body: "Optionally keep existing valid entities so &amp; doesn't become &amp;amp;." },
      { title: "Spec-correct decoding", body: "All 2,231 named entities, numeric references, emoji and the HTML spec's edge cases." },
      { title: "Problems flagged", body: "Unknown names, missing semicolons and invalid code points are listed with explanations." },
    ],
    steps: [
      { title: "Choose a direction", body: "Encode text into entities, or decode entities into text." },
      { title: "Paste your content", body: "The result updates as you type. Adjust the encoding options if needed." },
      { title: "Copy or download", body: "Copy the result or download it as a .txt file." },
    ],
    specs: [
      { label: "Named entities", value: "All 2,231 from the HTML standard" },
      { label: "Numeric", value: "Decimal &#…; and hex &#x…;" },
      { label: "Unicode", value: "Full range incl. emoji (one reference each)" },
      { label: "Apostrophe", value: "&#39; (works in HTML4 and HTML5)" },
      { label: "Max text", value: "5 million characters" },
      { label: "Output", value: "Plain text — never rendered" },
    ],
    formats: ["Text", "TXT"],
    privacy: "Text is converted in your browser and never sent or stored.",
    examples: [
      { title: "Basic encoding", body: "Tom & Jerry < Special Characters > → Tom &amp; Jerry &lt; Special Characters &gt;" },
      { title: "Non-ASCII as named entities", body: "café © 2026 → caf&eacute; &copy; 2026 (or caf&#233; &#169; 2026 as decimal)." },
      { title: "Decoding with problems", body: "&copy 2026 decodes to © 2026 but is flagged for its missing semicolon; &zzz; is unknown and left as it is." },
    ],
    faqs: [
      { q: "Which characters must be encoded in HTML?", a: "In text, & and < must be encoded (> is encoded for safety). Inside attribute values, the quote character you use (\" or ') must be encoded too." },
      { q: "Named or numeric entities — which should I use?", a: "Both work in modern browsers. Named entities like &copy; are easier to read; numeric ones work for every character, including those without a name, such as ₹ (&#8377;)." },
      { q: "Why is ' encoded as &#39; and not &apos;?", a: "&apos; was only added in HTML5 and isn't recognised by some older HTML parsers. &#39; works everywhere." },
      { q: "Does encoding make user input safe from XSS?", a: "It helps when placing text inside HTML content, but it isn't a complete defence. Safe output depends on the context (attributes, URLs, scripts, CSS). Use your framework's context-aware escaping and a sanitiser for untrusted HTML." },
      { q: "What happens to unknown or broken entities?", a: "They're left as written and listed below the output — for example &zzz; or a numeric reference to an invalid code point, which browsers show as �." },
      { q: "Is my text uploaded?", a: "No. Everything runs in your browser." },
    ],
    related: ["html-formatter", "url-encoder-decoder", "base64-encoder-decoder"],
    searchTerms: ["html entity", "html entities", "entity encoder", "entity decoder", "escape html", "unescape html", "special characters", "amp", "&amp;", "nbsp", "character reference", "html encode", "html decode"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "pdf-word",
    short: "Turn a PDF into an editable Word (DOCX) file — with OCR for scanned pages.",
    intro:
      "Convert a PDF into a Word document you can edit. Text, headings, paragraphs, simple tables and images are rebuilt as real Word content, and scanned pages can be read with OCR — all on your own device.",
    what:
      "A PDF to Word converter turns a PDF into an editable .docx file that opens in Microsoft Word, Google Docs, LibreOffice or Pages. ZSpace Tools' PDF to Word Converter reads the text, fonts and images in your PDF and rebuilds them as Word paragraphs, headings, tables and pictures — it doesn't just paste plain text into a document.",
    how:
      "PDFs store each piece of text at an exact position rather than as paragraphs, so the converter reconstructs the structure. It groups text into lines by position, joins lines into paragraphs using spacing and indentation, spots headings from larger or bold type, works out alignment (left, centred, right or justified), finds simple tables where several rows line up in columns, reads two-column pages in the right order, and places images where they appeared. Each PDF page becomes a Word section with the same page size and margins. Pages that are only pictures of text (scans) are detected; you can recognise their text with OCR, or keep them as images so nothing goes missing. Everything runs in your browser using pdf.js, Tesseract and the docx library.",
    seo: {
      title: "PDF to Word Converter – Convert PDF to Editable DOCX Online",
      description:
        "Convert PDF to editable Word (DOCX) online for free. Keeps paragraphs, headings, simple tables and images, with OCR for scanned PDFs. Your file never leaves your device.",
      keyword: "PDF to Word Converter",
      secondary: ["convert PDF to Word", "PDF to DOCX", "free PDF to Word converter", "online PDF to Word", "PDF document to editable Word", "convert PDF file to DOCX"],
    },
    features: [
      { title: "Real, editable Word files", body: "Paragraphs, headings, bold and italic text, alignment and indents become proper Word formatting — not a picture or a single block of text." },
      { title: "Tables and images", body: "Rows of text that line up in columns become Word tables; embedded images are placed where they appeared." },
      { title: "Same page size", body: "Each PDF page becomes a Word page with the same size, orientation and margins." },
      { title: "Scanned PDFs", body: "Scanned pages are detected. Turn on OCR to make their text editable in English, Hindi, Gujarati, Spanish, French or German." },
      { title: "Two-column pages", body: "Newsletter-style columns are read top to bottom, column by column, so sentences stay in order." },
      { title: "Private by design", body: "The PDF is read and converted in your browser. It's never uploaded." },
    ],
    steps: [
      { title: "Add your PDF", body: "Drop it in or choose it. You'll see the first page, the page count and whether any pages look scanned." },
      { title: "Convert", body: "Turn on OCR if the PDF is scanned, then press Convert to Word. Progress is shown page by page." },
      { title: "Download and review", body: "Download the .docx and check it in Word — complex layouts may need small touch-ups." },
    ],
    specs: [
      { label: "Output", value: "DOCX (Word 2007 and later, Google Docs, LibreOffice, Pages)" },
      { label: "Kept", value: "Paragraphs, headings, bold/italic, sizes, alignment, indents, simple tables, images, page size" },
      { label: "Not kept", value: "Text colours, exact fonts not on your computer, complex or merged tables, form fields" },
      { label: "Scanned pages", value: "OCR (6 languages) or kept as images" },
      { label: "Limits", value: "60 MB, 300 pages" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "DOCX"],
    privacy: "Your PDF is converted in your browser and never uploaded. OCR language data is downloaded from this site the first time you use it, then cached by your browser.",
    examples: [
      { title: "A report", body: "A 12-page report with headings, numbered sections and two tables becomes a Word file with Heading styles for the titles, normal paragraphs for the text and two Word tables." },
      { title: "A scanned letter", body: "A 2-page scanned letter has no text layer. With OCR on (English), the letter's text comes back as editable paragraphs; with OCR off, each page is kept as an image." },
      { title: "A brochure", body: "A two-column brochure page is read column by column, with its photos placed between the paragraphs where they appeared." },
    ],
    faqs: [
      { q: "Will my Word file look exactly like the PDF?", a: "Usually close, but not always identical. A PDF records where each letter goes, not paragraphs or tables, so the layout has to be rebuilt. Simple documents convert well; complex layouts, merged table cells, text boxes and colours may need adjusting in Word." },
      { q: "Can it convert scanned PDFs?", a: "Yes, with OCR turned on. Scanned pages are pictures of text, so the text is recognised first. OCR isn't perfect — check names, numbers and dates. Without OCR, scanned pages are kept as images so nothing is lost." },
      { q: "Is my PDF uploaded to a server?", a: "No. The conversion runs entirely in your browser, so the file never leaves your device." },
      { q: "Can I convert a password-protected PDF?", a: "Not directly. Open it with the password in a PDF reader, save or print an unlocked copy, and convert that." },
      { q: "Why are some fonts different?", a: "Fonts embedded in a PDF usually can't be reused in Word. The converter picks the matching common font (for example Arial or Times New Roman) or the original font's name, and Word substitutes if you don't have it." },
      { q: "Is there a size limit?", a: "Up to 60 MB and 300 pages, because everything is processed in your browser's memory. For bigger files, split the PDF first with the PDF Splitter." },
    ],
    related: ["word-to-pdf", "pdf-compressor", "pdf-merger", "pdf-splitter"],
    searchTerms: ["pdf to word", "pdf to docx", "pdf to doc", "convert pdf", "editable pdf", "pdf converter", "word", "docx", "ocr pdf", "scanned pdf", "pdf to editable"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "word-pdf",
    short: "Turn Word (DOCX) documents into PDF with the same page size and margins.",
    intro:
      "Convert Word documents to PDF right in your browser. See a preview of every page first, then save a PDF with the document's own page size, orientation and margins — one file at a time or several combined.",
    what:
      "A Word to PDF converter turns a .docx file into a PDF that looks the same on every device and can't be accidentally edited. ZSpace Tools' Word to PDF Converter renders your document — text, headings, tables, images, headers and footers — in the browser and uses the browser's own PDF engine to save it, so the text in the PDF stays selectable and searchable.",
    how:
      "The .docx file (a zip of XML files) is read with docx-preview, which lays out each section with the page size, margins and orientation stored in the document, along with its styles, tables, images, headers and footers. Any links that aren't web or email links are removed, and embedded HTML or scripts are never displayed. When you save, the pages are sent to your browser's print engine with matching page sizes, and you choose Save as PDF. Documents saved by Word include page-break positions, so each page matches Word's; for other documents the browser decides the page breaks.",
    seo: {
      title: "Word to PDF Converter – Convert DOC and DOCX to PDF Online",
      description:
        "Convert Word DOCX documents to PDF online for free. Keeps page size, margins, tables, images, headers and footers. Preview first — your file never leaves your device.",
      keyword: "Word to PDF Converter",
      secondary: ["Word to PDF", "DOCX to PDF", "DOC to PDF", "convert Word document to PDF", "online Word to PDF converter", "free DOCX to PDF converter"],
    },
    features: [
      { title: "Preview before saving", body: "See every page of the document as it will be saved." },
      { title: "Your page settings", body: "Page size (A4, Letter and others), orientation and margins come from the document itself." },
      { title: "Tables, images, headers", body: "Tables, pictures, headers, footers, footnotes and page breaks are included." },
      { title: "Selectable text", body: "The PDF is made by your browser's PDF engine, so text stays sharp, searchable and copyable." },
      { title: "Several documents", body: "Add up to 10 documents, save each one, or combine them into a single PDF." },
      { title: "Private", body: "Documents are rendered on your device. Nothing is uploaded." },
    ],
    steps: [
      { title: "Add Word documents", body: "Drop in one or more .docx files and check the preview." },
      { title: "Save as PDF", body: "Press Save as PDF. Your browser's print window opens with the right page size." },
      { title: "Choose Save as PDF", body: "Pick Save as PDF (or Microsoft Print to PDF) as the destination and save." },
    ],
    specs: [
      { label: "Input", value: "DOCX (Word 2007 and later). Legacy .doc: re-save as .docx" },
      { label: "Kept", value: "Page size, orientation, margins, styles, tables, images, headers/footers, footnotes, page breaks" },
      { label: "PDF engine", value: "Your browser's (Chrome, Edge, Firefox, Safari)" },
      { label: "Batch", value: "Up to 10 files; save separately or as one PDF" },
      { label: "File size", value: "Up to 30 MB each" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["DOCX", "PDF"],
    privacy: "Documents are rendered and printed to PDF in your browser. They're never uploaded or stored.",
    examples: [
      { title: "A CV", body: "A 2-page A4 CV saved from Word keeps its margins, fonts (where installed) and page break, producing a 2-page A4 PDF with selectable text." },
      { title: "A landscape table", body: "A Letter-size landscape report with a wide table is saved as landscape Letter pages, matching the document's settings." },
      { title: "Combining files", body: "A cover letter and a CV added together can be saved as one PDF, each keeping its own page size." },
    ],
    faqs: [
      { q: "Will the PDF look exactly like my Word document?", a: "For most documents it's very close, but it isn't Microsoft Word, so complex layouts can differ — text boxes, SmartArt, some charts, EMF/WMF drawings and fonts you don't have installed. Always check the preview before saving." },
      { q: "Can I convert .doc files?", a: "Not in the browser. The old .doc format is a different binary format. Open it in Word, Google Docs or LibreOffice, save it as .docx, then convert." },
      { q: "Why does a print window open?", a: "Your browser's print engine is what creates the PDF — it keeps text selectable and handles fonts properly. Choose Save as PDF as the destination." },
      { q: "Are my documents uploaded?", a: "No. Everything happens in your browser, so your document never leaves your device." },
      { q: "Can I change the page size or margins?", a: "The PDF uses the size, orientation and margins saved in the document. To change them, adjust the Page Setup in Word and convert again." },
      { q: "Why do headers appear only on the first page?", a: "If a document wasn't saved by Word, it has no stored page layout, so your browser decides the page breaks and can't repeat headers and footers. Re-saving the document in Word usually fixes this." },
    ],
    related: ["pdf-to-word", "pdf-compressor", "pdf-merger"],
    searchTerms: ["word to pdf", "docx to pdf", "doc to pdf", "convert word", "word converter", "save as pdf", "document to pdf", "pdf", "docx", "microsoft word"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG & PNG Converter",
    category: "pdf",
    alsoIn: ["conversion", "image"],
    icon: "pdf-image",
    short: "Turn PDF pages into JPG or PNG images at 72, 150 or 300 DPI.",
    intro:
      "Convert PDF pages into high-quality JPG or PNG images. Choose the pages, resolution and quality, preview the results, and download single images or everything as a ZIP.",
    what:
      "A PDF to JPG converter turns each page of a PDF into a picture you can post, share or insert anywhere images are accepted. ZSpace Tools' PDF to JPG & PNG Converter renders pages with pdf.js — the same engine Firefox uses to show PDFs — at the resolution you choose, entirely in your browser.",
    how:
      "Each selected page is drawn onto a canvas sized for your DPI (pixels = page size in inches × DPI) and encoded as JPG (with your quality setting) or PNG. Pages are rendered one at a time and each canvas is released straight away, so even long documents don't run out of memory. JPG can't be transparent, so a background colour is always filled; PNG can keep transparent areas where the page has no background. Very large pages are capped to stay inside your browser's canvas limits, and the actual DPI is shown.",
    seo: {
      title: "PDF to JPG & PNG Converter – Convert PDF Pages to Images",
      description:
        "Convert PDF pages to JPG or PNG images online for free. Choose pages, 72–300 DPI and quality, then download images or a ZIP. Converted in your browser — nothing is uploaded.",
      keyword: "PDF to JPG Converter",
      secondary: ["PDF to PNG", "convert PDF to JPG", "PDF pages to images", "convert PDF into pictures", "PDF image converter", "PDF to JPEG online"],
    },
    features: [
      { title: "JPG or PNG", body: "JPG for small files, PNG for lossless quality and optional transparency." },
      { title: "72, 150 or 300 DPI", body: "Screen, balanced or print resolution, with the exact pixel size shown before converting." },
      { title: "Pick your pages", body: "Click thumbnails or type a range like 1-3, 7 — convert all pages or just a few." },
      { title: "Quality and background", body: "JPG quality slider and a background colour for transparent or blank areas." },
      { title: "ZIP download", body: "Download images one by one, or all of them in a single ZIP." },
      { title: "Built for big PDFs", body: "Page-by-page rendering with progress, a Cancel button and large-job warnings." },
    ],
    steps: [
      { title: "Add a PDF", body: "Drop it in. Page thumbnails appear as you scroll." },
      { title: "Choose pages and settings", body: "Select pages, then JPG or PNG, the DPI and the quality." },
      { title: "Convert and download", body: "Download single images or everything as a ZIP." },
    ],
    specs: [
      { label: "Output", value: "JPG or PNG" },
      { label: "Resolution", value: "72, 150 or 300 DPI (A4 at 300 DPI = 2480 × 3508 px)" },
      { label: "JPG quality", value: "40–100%" },
      { label: "Max image", value: "16 megapixels per page (browser canvas limit)" },
      { label: "PDF size", value: "Up to 100 MB" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "JPG", "PNG", "ZIP"],
    privacy: "Your PDF is rendered to images in your browser. Nothing is uploaded or stored.",
    examples: [
      { title: "An A4 page", body: "At 72 DPI an A4 page becomes 595 × 842 px; at 150 DPI 1240 × 1754 px; at 300 DPI 2480 × 3508 px." },
      { title: "Slides for social media", body: "A 20-page slide deck at 150 DPI, JPG quality 85%, gives 20 sharp images — about 200–400 KB each, in one ZIP." },
      { title: "A single page", body: "Type 3 in the range box to convert only page 3, for example to post a chart." },
    ],
    faqs: [
      { q: "Which DPI should I choose?", a: "72 DPI for quick screen previews, 150 DPI for sharing and most uses, and 300 DPI for printing or zooming in. Higher DPI means bigger files." },
      { q: "JPG or PNG?", a: "JPG gives much smaller files and suits photos and scans. PNG is lossless — better for text, diagrams and anything you'll edit — and can keep transparency." },
      { q: "Is my PDF uploaded?", a: "No. Pages are rendered in your browser and never leave your device." },
      { q: "Can it convert password-protected PDFs?", a: "No — please upload an unlocked copy. Open the PDF with its password in a PDF reader and save it without protection first." },
      { q: "Why is my 300 DPI image smaller than expected?", a: "Very large pages would exceed what a browser can draw at once, so they're scaled to fit about 16 megapixels. The actual DPI is shown next to each image." },
      { q: "Will the images look exactly like the PDF?", a: "They're rendered with pdf.js, which is very accurate. Rare features — some blend modes or unusual fonts — can look slightly different from other PDF viewers." },
    ],
    related: ["image-to-pdf", "pdf-splitter", "image-converter"],
    searchTerms: ["pdf to jpg", "pdf to png", "pdf to image", "pdf to jpeg", "pdf pages to images", "convert pdf", "pdf picture", "pages as images", "dpi"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "image-converter",
    name: "Image Converter",
    category: "image",
    alsoIn: ["conversion"],
    icon: "convert-image",
    short: "Convert JPG, PNG, WebP, HEIC, AVIF, BMP and GIF to JPG, PNG, WebP or AVIF.",
    intro:
      "Convert images between formats in seconds — including iPhone HEIC photos and modern AVIF. Convert one image or a whole batch, resize if you like, and download everything as a ZIP.",
    what:
      "An image converter changes a picture from one file format to another — for example HEIC to JPG so an iPhone photo opens everywhere, or PNG to WebP for a faster website. ZSpace Tools' Image Converter reads JPG, PNG, WebP, HEIC/HEIF, AVIF, BMP and GIF, and saves JPG, PNG, WebP or AVIF, entirely on your device.",
    how:
      "Each file's format is identified from its contents, not its name. JPG, PNG, WebP, BMP, GIF and (in most browsers) AVIF are decoded by your browser; HEIC/HEIF photos are decoded with libheif, and AVIF with libavif if your browser can't, both compiled to WebAssembly and run in a background worker. The image is drawn onto a canvas — resized if you asked — and saved in the new format. JPG can't store transparency, so transparent areas are filled with the background colour you choose (white by default). If your browser can't create AVIF files itself, libavif encodes them on your device instead.",
    seo: {
      title: "Image Converter – Convert JPG, PNG, WebP, HEIC & AVIF Online",
      description:
        "Convert images to JPG, PNG, WebP or AVIF online for free — including iPhone HEIC photos. Batch convert, resize and download as ZIP. Images never leave your device.",
      keyword: "Image Converter",
      secondary: ["JPG to PNG", "PNG to JPG", "WebP to JPG", "JPG to WebP", "HEIC to JPG", "AVIF to JPG", "convert image format online", "image format conversion"],
    },
    features: [
      { title: "HEIC and AVIF", body: "Open iPhone HEIC photos and AVIF images even where your browser can't, and create AVIF files." },
      { title: "Batch conversion", body: "Convert up to 30 images at once and download them individually or as a ZIP." },
      { title: "Transparency handled", body: "PNG, WebP and AVIF keep transparency; for JPG you choose the background colour instead of losing it silently." },
      { title: "Quality and size", body: "Quality slider for JPG, WebP and AVIF, plus optional resizing with the aspect ratio kept." },
      { title: "Rename on the way", body: "Name outputs with a pattern such as {name}-web or photo-{n}." },
      { title: "Private", body: "Images are converted on your device. Nothing is uploaded." },
    ],
    steps: [
      { title: "Choose the output format", body: "JPG, PNG, WebP or AVIF, and set quality or size if needed." },
      { title: "Add your images", body: "Drop in one or many. Each is converted straight away with its own status." },
      { title: "Download", body: "Download each image, or all of them as a ZIP." },
    ],
    specs: [
      { label: "Input", value: "JPG, PNG, WebP, HEIC/HEIF, AVIF, BMP, GIF (first frame)" },
      { label: "Output", value: "JPG, PNG, WebP, AVIF" },
      { label: "Batch", value: "Up to 30 images, 25 MB each" },
      { label: "HEIC decoder", value: "libheif (WebAssembly, LGPL-3.0)" },
      { label: "AVIF encoder", value: "Browser, or libavif (WebAssembly) on your device" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["JPG", "PNG", "WebP", "HEIC", "AVIF", "BMP", "GIF"],
    privacy: "Images are converted in your browser and never uploaded. The HEIC and AVIF decoders are downloaded from this site only when needed.",
    examples: [
      { title: "iPhone photo to JPG", body: "IMG_2041.HEIC (2.1 MB, 4032 × 3024) → IMG_2041.jpg at 85% quality, about 2–3 MB, opening on any device." },
      { title: "Logo to JPG", body: "A transparent PNG logo converted to JPG gets a white background (or any colour you pick) instead of black." },
      { title: "Website images", body: "Ten 1.5 MB JPG photos resized to 1600 px wide and saved as WebP at 80% often come out around 150–300 KB each." },
    ],
    faqs: [
      { q: "Can I convert HEIC to JPG?", a: "Yes. HEIC photos from iPhones are decoded on your device with libheif, so it works even in browsers that can't open HEIC themselves." },
      { q: "What happens to transparency when converting to JPG?", a: "JPG can't store transparency, so transparent areas are filled with a background colour — white unless you choose another. PNG, WebP and AVIF keep transparency." },
      { q: "Are animated GIFs supported?", a: "Only the first frame is converted, as a still image. The animation isn't preserved, and the tool tells you when a GIF is animated." },
      { q: "Why is AVIF conversion slower?", a: "Many browsers can't create AVIF files, so a WebAssembly encoder does it on your device. AVIF compresses very well but takes longer to encode." },
      { q: "Are my images uploaded?", a: "No. Everything runs in your browser." },
      { q: "Does converting improve quality?", a: "No — converting can't add detail that isn't there. Converting a JPG to PNG makes the file larger without making it sharper." },
    ],
    related: ["image-compressor", "image-resizer", "image-to-pdf", "image-to-text"],
    searchTerms: ["image converter", "convert image", "heic to jpg", "heic", "avif", "webp to jpg", "jpg to png", "png to jpg", "jpg to webp", "png to webp", "bmp to jpg", "gif to png", "photo format", "iphone photo"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "image-to-text",
    name: "Image to Text (OCR)",
    category: "image",
    alsoIn: ["text"],
    icon: "ocr",
    short: "Extract text from photos, screenshots and scans — English, Hindi, Gujarati and more.",
    intro:
      "Pull the text out of a photo, screenshot or scanned page. Choose the language, tidy the image if needed, then copy the text or download it as TXT or Word — all done on your device.",
    what:
      "An image to text converter uses OCR (optical character recognition) to turn the words in a picture into text you can edit, search and copy. ZSpace Tools' Image to Text converter uses Tesseract, a long-established open-source OCR engine, running in your browser with language models for English, Hindi, Gujarati, Spanish, French and German.",
    how:
      "Tesseract's neural-network (LSTM) recogniser reads the image line by line using the language models you pick. Before reading, a copy of your image can be rotated, cropped to the text, converted to greyscale, given more contrast and enlarged — small text is upscaled automatically because OCR works best at around 300 DPI. The engine and models are served from this site and cached by your browser after the first use. You get an overall confidence score and a count of uncertain words, so you know when to check the result carefully.",
    seo: {
      title: "Image to Text Converter – Extract Text from Images Online",
      description:
        "Extract text from images online for free with OCR. Supports JPG, PNG, WebP, BMP and TIFF in English, Hindi, Gujarati, Spanish, French and German. Runs on your device.",
      keyword: "Image to Text Converter",
      secondary: ["OCR online", "extract text from image", "image to text", "JPG to text", "PNG to text", "photo to text", "screenshot to text", "online OCR tool", "extract text from scanned documents"],
    },
    features: [
      { title: "Six languages", body: "English, Hindi, Gujarati, Spanish, French and German — combine up to three for mixed-language text." },
      { title: "Clean up first", body: "Rotate, crop to the text, greyscale, contrast and upscaling — on a copy, never your original." },
      { title: "Editable result", body: "Text appears in an editor next to the image so you can compare and correct it." },
      { title: "Confidence shown", body: "Overall confidence and the number of uncertain words tell you how carefully to check." },
      { title: "Copy, TXT or Word", body: "Copy the text, or download it as a .txt or .docx file." },
      { title: "Private", body: "Your image is read on your device. Nothing is uploaded." },
    ],
    steps: [
      { title: "Add an image", body: "A photo, screenshot or scan in JPG, PNG, WebP, BMP or TIFF." },
      { title: "Pick the language", body: "Choose the language(s) in the image. Rotate or crop if the text is sideways or surrounded by clutter." },
      { title: "Extract and check", body: "Press Extract text, review the result next to the image, then copy or download it." },
    ],
    specs: [
      { label: "Engine", value: "Tesseract 5 (LSTM) via tesseract.js" },
      { label: "Languages", value: "English, Hindi, Gujarati, Spanish, French, German" },
      { label: "Input", value: "JPG, PNG, WebP, BMP, GIF, TIFF — up to 25 MB" },
      { label: "Output", value: "Editable text, TXT, DOCX" },
      { label: "First use", value: "Downloads ~4 MB engine + 1–3 MB per language (cached)" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["JPG", "PNG", "WebP", "BMP", "TIFF", "TXT", "DOCX"],
    privacy: "Images are read in your browser and never uploaded. The OCR engine and language data are downloaded from this site and cached by your browser.",
    examples: [
      { title: "A screenshot", body: "A screenshot of an email reads almost perfectly — clean digital text usually scores over 90% confidence." },
      { title: "A Hindi notice", body: "Choose Hindi (add English if the notice mixes both) to read a printed Devanagari notice." },
      { title: "A phone photo of a page", body: "Rotate it upright, crop to the page and add a little contrast before extracting — accuracy improves noticeably." },
    ],
    faqs: [
      { q: "How accurate is the OCR?", a: "Very good for clear, printed text and screenshots; lower for blurry photos, low light, small text, unusual fonts and complex layouts. It's never 100% — always check important details like names, numbers and amounts." },
      { q: "Can it read handwriting?", a: "Only poorly. Tesseract is trained on printed text, so handwriting is often misread." },
      { q: "Does it keep tables?", a: "Text in simple tables is read row by row, but the table structure isn't rebuilt. Complex tables may come out out of order." },
      { q: "Which languages are supported?", a: "English, Hindi, Gujarati, Spanish, French and German. Pick every language that appears in the image, up to three." },
      { q: "Are my images uploaded?", a: "No. OCR runs in your browser. Only the OCR engine and language files are downloaded — from this site, not a third party." },
      { q: "Can I extract text from a PDF?", a: "For PDFs, use the PDF to Word Converter — it keeps the PDF's existing text and can OCR scanned pages." },
    ],
    related: ["pdf-to-word", "image-converter", "word-counter"],
    searchTerms: ["ocr", "image to text", "extract text", "photo to text", "picture to text", "screenshot to text", "scan to text", "jpg to text", "png to text", "text recognition", "hindi ocr", "gujarati ocr", "copy text from image"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "pdf-table",
    short: "Pull tables out of PDFs into Excel (XLSX) or CSV — numbers stay numbers, IDs stay exact.",
    intro:
      "Turn tables in a PDF — bank statements, invoices, price lists, reports — into an editable Excel spreadsheet. Preview every table before you download, and keep account numbers, dates and amounts exactly as they were.",
    what:
      "A PDF to Excel converter finds the tables in a PDF and puts each value into its own spreadsheet cell. ZSpace Tools' PDF to Excel Converter detects table rows and columns from the position of text on each page, joins tables that continue across pages, and creates an .xlsx file where amounts are real numbers with their original formatting and identifiers stay as text.",
    how:
      "PDFs don't store tables — only text placed at positions. The converter reads every word's position with pdf.js, splits each line into cells wherever there's a clear gap, and finds runs of lines whose cells line up into columns. Column edges come from where the cells actually sit, so right-aligned amounts and a header spanning two columns are handled. Lines that only continue a cell above (a long description wrapping onto a second line) are joined back into their row, and a table that carries on to the next page under the same header becomes one sheet. Each value is then typed carefully: 1,20,000.50 or $1,234.56 becomes a number formatted to look the same; dates, leading zeros (00123), account numbers longer than 15 digits and Dr/Cr amounts stay text so Excel can't change them. Scanned pages can be read with OCR first.",
    seo: {
      title: "PDF to Excel Converter – Convert PDF to XLSX Online Free",
      description:
        "Convert PDF tables into Excel spreadsheets online. Extract data, preview tables and download XLSX or CSV files with a free PDF to Excel converter.",
      keyword: "PDF to Excel Converter",
      secondary: ["convert PDF to Excel", "PDF to XLSX", "PDF table to Excel", "extract tables from PDF", "PDF to spreadsheet", "online PDF to Excel converter", "convert PDF data to Excel"],
    },
    features: [
      { title: "Real table detection", body: "Rows and columns are worked out from where the text sits, including right-aligned amounts and empty cells." },
      { title: "Multi-page tables", body: "A table that continues on the next page under the same header becomes one sheet, without the repeated header." },
      { title: "Numbers you can sum", body: "1,20,000.50, ₹2,499, $1,234.56, (1,234.00) and 12.5% become Excel numbers that still look the same." },
      { title: "Nothing changed silently", body: "Dates, leading zeros, long account numbers and Dr/Cr amounts are kept as text exactly as printed." },
      { title: "Preview before download", body: "See every table, choose which to include, and pick a sheet per table or one combined sheet." },
      { title: "Scanned PDFs", body: "OCR reads tables in scanned pages (6 languages). Without OCR you're told clearly instead of getting an empty file." },
    ],
    steps: [
      { title: "Add your PDF", body: "Drop it in and choose all pages or a range like 2-5." },
      { title: "Extract tables", body: "Turn on OCR if the PDF is scanned, then press Extract tables." },
      { title: "Check and download", body: "Review the tables, untick any you don't need, and download XLSX or CSV." },
    ],
    specs: [
      { label: "Output", value: "XLSX (Excel 2007+, Google Sheets, LibreOffice) and CSV (UTF-8)" },
      { label: "Detects", value: "Rows, columns, headers, wrapped cells, tables across pages" },
      { label: "Numbers", value: "Indian & Western grouping, currency, negatives, percentages" },
      { label: "Kept as text", value: "Dates, leading zeros, IDs over 15 digits, Dr/Cr, phone numbers" },
      { label: "Limits", value: "60 MB, 300 pages" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "XLSX", "CSV"],
    privacy: "Your PDF is read in your browser and never uploaded. OCR language data, if you use it, is downloaded from this site and cached by your browser.",
    examples: [
      { title: "A bank statement", body: "A 2-page statement with Date, Description, Debit, Credit and Balance columns becomes one sheet; a description wrapped onto two lines stays in one cell, and 1,20,000.00 is a number shown with Indian grouping." },
      { title: "An invoice", body: "The items table and the tax table on the same page become two separate sheets; the thank-you note between them is left out." },
      { title: "Customer codes", body: "00123 and 1234567890123456 stay exactly as printed instead of turning into 123 and 1.23457E+15." },
    ],
    faqs: [
      { q: "How can I convert PDF tables into Excel?", a: "Drop the PDF in, choose all pages or a range, press Extract tables, review the preview, untick any tables you don't need and download XLSX (or CSV). Each table becomes its own sheet, or choose one combined sheet." },
      { q: "Will every PDF table convert perfectly?", a: "Tables with clear columns convert well. Tables with merged cells, multi-line headers, rotated text or no spacing between columns may need tidying in Excel. Always preview — and check totals — before relying on the data." },
      { q: "Why are some values text, not numbers?", a: "To avoid silently changing your data. Dates (formats differ by country), leading zeros, account numbers longer than 15 digits (Excel would round them) and Dr/Cr amounts stay exactly as printed. You can convert them in Excel if you want." },
      { q: "Can it convert scanned PDFs?", a: "Yes, with OCR turned on. Scanned pages are pictures, so the text is recognised first — check numbers carefully afterwards, as OCR can misread digits." },
      { q: "Is my PDF uploaded?", a: "No. Extraction runs entirely in your browser." },
      { q: "What if no table is found?", a: "You'll see the text of each page as rows instead, split into cells at wide gaps — useful for lists that aren't laid out as tables." },
      { q: "Can I get CSV instead of Excel?", a: "Yes. CSV is UTF-8 with a byte-order mark so Excel shows ₹ and accents correctly. Note that Excel may reformat numbers in a CSV when it opens it; XLSX keeps them exact." },
    ],
    related: ["excel-to-pdf", "pdf-to-word", "image-to-text", "csv-to-json"],
    searchTerms: ["pdf to excel", "pdf to xlsx", "pdf to csv", "extract table", "pdf table", "bank statement to excel", "invoice to excel", "pdf to spreadsheet", "convert pdf", "tabula"],
    published: "2026-11-13",
    updated: "2026-11-15",
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "sheet-pdf",
    short: "Turn Excel (XLSX) and CSV files into neat, paginated PDFs with your page settings.",
    intro:
      "Convert a spreadsheet into a clean PDF you can share or print. Choose the worksheets, paper size, orientation and scaling, repeat header rows on every page, and preview the result before you download.",
    what:
      "An Excel to PDF converter turns a workbook into fixed pages that look the same everywhere. ZSpace Tools' Excel to PDF Converter reads your .xlsx file — values, number formats, fonts, colours, borders, merged cells, column widths and pictures — and lays it out on real PDF pages with selectable text, entirely in your browser.",
    how:
      "The workbook is read with ExcelJS. Each cell's displayed text is produced with Excel's own number-format rules (so ₹1,20,000.00, 33.0% and 13 Nov 2026 look as they do in Excel), and formulas show the result Excel saved — they're never recalculated. The sheet is then drawn with pdf-lib: column widths and row heights become points, wrapped rows are sized to fit, text spills into empty neighbouring cells as in Excel, and merged cells, fills and borders are reproduced. If a sheet is wider than the page it's either scaled to fit or split into column bands printed down, then across — like Excel. Header rows can repeat at the top of every page, and page numbers are added in the footer.",
    seo: {
      title: "Excel to PDF Converter – Convert XLSX to PDF Online Free",
      description:
        "Convert Excel XLSX spreadsheets to PDF online. Select worksheets, adjust page size, orientation, margins and scale, then preview and download your PDF.",
      keyword: "Excel to PDF Converter",
      secondary: ["Excel to PDF", "XLSX to PDF", "XLS to PDF", "convert spreadsheet to PDF", "Excel spreadsheet to PDF", "online Excel to PDF converter"],
    },
    features: [
      { title: "Looks like your sheet", body: "Number and date formats, fonts, fill colours, borders, merged cells, column widths and pictures are kept." },
      { title: "Your page settings", body: "A4, A3, Letter or Legal; portrait, landscape or automatic; narrow, normal, wide or custom margins." },
      { title: "Fit wide sheets", body: "Print at actual size or a custom percentage, fit all columns to the page width, or fit a whole sheet on one page. Columns that don't fit continue on extra pages — none are dropped." },
      { title: "Repeat header rows", body: "Use the workbook's Print Titles or repeat the first 1–3 rows on every page." },
      { title: "Choose worksheets", body: "Include all sheets or just the ones you need; hidden sheets are left out by default." },
      { title: "Preview, then download", body: "See every page before downloading a text-selectable PDF with page numbers." },
    ],
    steps: [
      { title: "Add a spreadsheet", body: "Drop in an .xlsx or .csv file." },
      { title: "Set up the pages", body: "Choose worksheets, paper, orientation, scaling and headers — the preview updates as you go." },
      { title: "Download the PDF", body: "Check the preview and download." },
    ],
    specs: [
      { label: "Input", value: "XLSX, XLSM (macros never run), CSV. Old .xls: re-save as .xlsx" },
      { label: "Paper", value: "A4, A3, Letter, Legal — portrait or landscape" },
      { label: "Scaling", value: "Actual size, fit to width, fit to page, custom 10–400%" },
      { label: "Formulas", value: "Saved results shown; not recalculated" },
      { label: "Not included", value: "Charts, shapes, conditional formatting" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["XLSX", "CSV", "PDF"],
    privacy: "Your workbook is read and turned into a PDF in your browser. It's never uploaded or stored.",
    examples: [
      { title: "A wide report", body: "A 30-column sheet is switched to landscape and scaled so every column fits across one page, instead of being cut over several." },
      { title: "A long price list", body: "A 150-row list prints over several A4 pages with the header row repeated at the top of each page and “Page 2 of 4” in the footer." },
      { title: "Currency and dates", body: "Cells formatted as ₹#,##0.00 and dd mmm yyyy appear as ₹1,20,000.00 and 13 Nov 2026, exactly as in Excel." },
    ],
    faqs: [
      { q: "How do I convert multiple Excel sheets into one PDF?", a: "Open the workbook and tick every worksheet you want — all visible sheets are ticked by default. They're added to a single PDF in workbook order, each starting on a new page." },
      { q: "Will the PDF look exactly like Excel?", a: "Close, but not pixel-identical. Text uses an embedded font similar to Calibri rather than Excel's own, and charts, shapes, conditional formatting and text boxes aren't drawn. Check the preview before sharing." },
      { q: "Are formulas recalculated?", a: "No. The PDF shows the result Excel saved in the file. If a formula has no saved result (for example a file created by another program), the cell is blank and you're told — open and save it in Excel first." },
      { q: "Can I convert .xls files?", a: "Not directly. The old .xls format can't be read reliably in the browser. Open it in Excel, Google Sheets or LibreOffice, save as .xlsx, then convert." },
      { q: "How do I fit a wide sheet on the page?", a: "Choose “Fit columns to width” (the default) and, if needed, landscape. For a small sheet you want on one page, choose “Fit sheet on a page”." },
      { q: "Is my spreadsheet uploaded?", a: "No. Everything runs in your browser." },
      { q: "Can the PDF text be copied?", a: "Yes. Text is real PDF text, so it can be searched and copied." },
    ],
    related: ["pdf-to-excel", "word-to-pdf", "pdf-compressor"],
    searchTerms: ["excel to pdf", "xlsx to pdf", "xls to pdf", "csv to pdf", "spreadsheet to pdf", "convert excel", "print excel", "sheet to pdf", "workbook"],
    published: "2026-11-13",
    updated: "2026-11-15",
  },
  {
    slug: "pdf-editor",
    name: "PDF Editor",
    category: "pdf",
    icon: "pdf-edit",
    short: "Add text, images, shapes, drawings, highlights and notes to any PDF — then download it.",
    intro:
      "Edit a PDF right in your browser: type text, place images, draw, add rectangles, circles and arrows, highlight or underline, and leave sticky notes. Move and resize anything, undo freely, then download the edited PDF.",
    what:
      "A PDF editor lets you change a PDF without the original file it was made from. ZSpace Tools' PDF Editor adds new content on top of your pages — text boxes, images, shapes, freehand drawing, highlights, underlines and sticky-note comments — and saves them into the PDF, keeping the original text and graphics exactly as they were.",
    how:
      "Pages are displayed with pdf.js. Everything you add lives in a layer above the page, in the page's own coordinates, so it stays in place at any zoom. When you download, each addition is written into the PDF with pdf-lib using the same coordinates — accounting for the page's size, crop box and rotation — so it appears exactly where you put it. Text is real PDF text (Helvetica, Times or Courier, or an embedded Noto Sans for characters like ₹); highlights use a multiply blend so the text underneath stays readable; notes become real PDF comments that open in any PDF reader. The original page content is never rasterised.",
    seo: {
      title: "Edit PDF Online – Add Text, Images, Shapes and Annotations",
      description:
        "Edit PDF files online for free: add text, images, shapes, arrows, freehand drawing, highlights and notes, then download. Original content stays intact and your file never leaves your device.",
      keyword: "PDF Editor",
      secondary: ["edit PDF online", "free PDF editor", "add text to PDF", "add image to PDF", "annotate PDF", "edit PDF document", "PDF text editor", "PDF annotation tool"],
    },
    features: [
      { title: "Text and text boxes", body: "Type anywhere; choose size, colour, bold and font. Text wraps inside its box and stays real, selectable text." },
      { title: "Images", body: "Add a logo, stamp or photo (PNG, JPG or WebP) and resize it without distortion." },
      { title: "Shapes and drawing", body: "Rectangles, circles, lines, arrows and freehand ink in any colour and thickness." },
      { title: "Highlight, underline, notes", body: "Mark up text and leave sticky-note comments that open in Acrobat, Preview and other readers." },
      { title: "Move, resize, undo", body: "Select anything to move or resize it; undo and redo every step." },
      { title: "Original stays sharp", body: "Your additions are written on top — the page's own text and vector graphics are untouched." },
    ],
    steps: [
      { title: "Open a PDF", body: "Drop it in. Use the thumbnails to move between pages." },
      { title: "Add and arrange", body: "Pick a tool, click or drag on the page, then move, resize and style what you added." },
      { title: "Download", body: "Press Download PDF to save a copy with your edits." },
    ],
    specs: [
      { label: "Add", value: "Text, images, rectangles, circles, lines, arrows, freehand, highlight, underline, notes" },
      { label: "Text fonts", value: "Helvetica, Times, Courier; Noto Sans for other characters" },
      { label: "History", value: "Undo / redo (Ctrl+Z / Ctrl+Shift+Z)" },
      { label: "Pages", value: "Any size and orientation, rotated pages supported" },
      { label: "Editing existing text", value: "Not supported (overlay editing only)" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "PNG", "JPG"],
    privacy: "Your PDF and any images you add stay in your browser. Nothing is uploaded or stored.",
    examples: [
      { title: "Fill in a form by hand", body: "Click the Text tool, click on each blank line and type — the text is placed exactly there in the downloaded PDF." },
      { title: "Review a draft", body: "Highlight a sentence, draw an arrow to it and add a note saying what to change; the note opens as a comment in any PDF reader." },
      { title: "Add a logo", body: "Use the Image tool to place a PNG logo on page 1, drag it to the corner and resize it." },
    ],
    faqs: [
      { q: "Can I change the existing text in my PDF?", a: "No. PDFs store text as positioned glyphs, so rewriting it reliably isn't possible in the browser, and we won't fake it by hiding text under a white box. You can add new text, or cover something with a white filled rectangle — but the original text is still in the file underneath." },
      { q: "Will my edits be in the right place?", a: "Yes. Additions are stored in the page's coordinates and written with the same maths used to display it, including rotated pages and unusual page sizes." },
      { q: "Is the original content preserved?", a: "Yes. Pages aren't turned into images; your additions are drawn on top of the existing content." },
      { q: "Are my files uploaded?", a: "No. Editing and saving happen in your browser." },
      { q: "Can I edit password-protected PDFs?", a: "No — open the PDF with its password in a reader, save an unlocked copy and edit that." },
      { q: "Can I add text in Hindi or other scripts?", a: "Yes. Text in scripts like Devanagari or Gujarati is drawn by your browser and embedded as a sharp image so it looks right, though it won't be selectable text in the PDF." },
    ],
    related: ["sign-pdf", "pdf-organizer", "pdf-merger", "pdf-splitter"],
    searchTerms: ["pdf editor", "edit pdf", "annotate pdf", "add text to pdf", "add image to pdf", "write on pdf", "draw on pdf", "highlight pdf", "pdf comment", "fill pdf", "markup"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "pdf-organizer",
    name: "PDF Page Organizer",
    category: "pdf",
    icon: "pdf-grid",
    short: "Reorder, rotate, delete, duplicate and extract PDF pages with drag and drop.",
    intro:
      "See every page of your PDF as a thumbnail and rearrange it the way you need. Drag pages into order, rotate or delete them, duplicate pages, pull out a selection as a new PDF, and undo anything.",
    what:
      "A PDF page organizer lets you manage the pages of a PDF visually. ZSpace Tools' PDF Page Organizer shows page thumbnails you can drag to reorder, and lets you rotate, delete, duplicate, reverse and extract pages — then builds a real new PDF with exactly those pages, in that order.",
    how:
      "Thumbnails are rendered with pdf.js only when they scroll into view, one at a time, so even long PDFs stay responsive. Your changes are kept as a list of page references with an added rotation — nothing is rebuilt until you download. Then pdf-lib copies each page from the original into a new PDF in your order (copying a page twice for duplicates), adds your rotation to the page's existing /Rotate value, and saves. Page content, links and comments on each page are carried over; the original file isn't changed.",
    seo: {
      title: "Organize PDF Pages – Reorder, Rotate, Delete and Extract Pages",
      description:
        "Organize PDF pages online for free: drag to reorder, rotate, delete, duplicate, reverse and extract pages, with undo. Pages are processed on your device.",
      keyword: "Organize PDF",
      secondary: ["organize PDF pages", "reorder PDF pages", "rearrange PDF pages", "delete PDF pages", "rotate PDF pages", "extract PDF pages", "PDF page organizer", "arrange PDF online"],
    },
    features: [
      { title: "Drag to reorder", body: "Drag a page — or a whole selection — to a new position, or use the arrow buttons from the keyboard." },
      { title: "Rotate", body: "Turn single pages or every selected page by 90°; rotation is saved in the PDF itself." },
      { title: "Delete and duplicate", body: "Remove pages you don't need, or copy a page (for example a form you'll fill twice)." },
      { title: "Extract selection", body: "Save just the selected pages as a separate PDF." },
      { title: "Reverse and reset", body: "Reverse the whole order in one click, or go back to the original." },
      { title: "Undo and redo", body: "Every change can be undone, and nothing touches your file until you download." },
    ],
    steps: [
      { title: "Open a PDF", body: "Drop it in — page thumbnails appear as you scroll." },
      { title: "Rearrange", body: "Drag pages into order; select pages to rotate, delete, duplicate or extract them." },
      { title: "Download", body: "Download the reorganised PDF, or extract the selected pages." },
    ],
    specs: [
      { label: "Actions", value: "Reorder, rotate ±90°, delete, duplicate, reverse, extract" },
      { label: "Selection", value: "Click to select; select all / deselect" },
      { label: "History", value: "Undo, redo, reset order" },
      { label: "Kept", value: "Page content, links and annotations" },
      { label: "Limits", value: "100 MB, 1,000 pages" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF"],
    privacy: "Your PDF is rearranged in your browser and never uploaded.",
    examples: [
      { title: "A scanned document out of order", body: "Drag page 5 to the front, rotate the two sideways pages, delete the blank page and download." },
      { title: "Pull out an annexure", body: "Select pages 12–15 and press Extract to save them as their own PDF." },
      { title: "Back-to-front scan", body: "Press Reverse to flip the page order of a stack scanned from the last page." },
    ],
    faqs: [
      { q: "Does rotating change the actual PDF?", a: "Yes. The rotation is written into each page of the downloaded PDF, so it opens the right way up everywhere." },
      { q: "Are deleted pages really removed?", a: "Yes. The downloaded PDF is built only from the pages you kept, so deleted pages aren't hidden — they're gone from that file." },
      { q: "Is my original file changed?", a: "No. You download a new PDF; the file on your device stays as it was." },
      { q: "How do I move several pages at once?", a: "Select them, then drag any selected page — the whole selection moves together." },
      { q: "Is there a page limit?", a: "Up to 1,000 pages and 100 MB, because everything is processed in your browser's memory." },
      { q: "Are my files uploaded?", a: "No. Everything happens in your browser." },
    ],
    related: ["rotate-pdf", "pdf-splitter", "pdf-merger", "pdf-compressor"],
    searchTerms: ["organize pdf", "reorder pdf", "rearrange pdf", "rotate pdf", "delete pdf pages", "remove pages", "extract selected pages", "duplicate page", "reverse pdf", "sort pdf pages", "move pages"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    category: "pdf",
    icon: "signature",
    short: "Draw, type or upload your signature and place it on any page of a PDF.",
    intro:
      "Sign a PDF without printing it. Draw your signature with a mouse or finger, type it in a handwriting-style font, or upload an image — then place it on the page, add the date, and download the signed PDF.",
    what:
      "Sign PDF adds an image of your signature to a PDF document. ZSpace Tools' Sign PDF lets you create a signature three ways, drag it onto any page, resize, move or rotate it, add a date or your name, and download a PDF with the signature embedded exactly where you placed it. It's a visual signature — not a certificate-based digital signature.",
    how:
      "Your signature becomes a transparent PNG — drawn on a smoothed canvas, typed in a script font, or uploaded with an optional white-background removal — and is trimmed to its edges. On the page it lives in the page's own coordinates, so placement is the same at any zoom. When you download, pdf-lib embeds the image into the PDF at exactly that position, size and angle (accounting for the page's size and rotation), and adds any date or name as text. The rest of the document is untouched. Signatures are kept only in memory while the page is open and are discarded when you leave or start again.",
    seo: {
      title: "Sign PDF Online – Add Your Signature to PDF Documents",
      description:
        "Sign PDF online for free: draw, type or upload your signature, place it on any page, add the date and download. Your signature and file stay on your device.",
      keyword: "Sign PDF",
      secondary: ["sign PDF online", "add signature to PDF", "electronic signature PDF", "sign document online", "PDF signature tool", "insert signature into PDF", "sign PDF without printing"],
    },
    features: [
      { title: "Draw, type or upload", body: "Sign with a mouse, finger or stylus; type your name in one of three handwriting styles; or upload a picture of your signature." },
      { title: "Clean signatures", body: "Drawn and typed signatures are transparent; uploaded ones can have their white background removed and are trimmed." },
      { title: "Place anywhere", body: "Drag onto the page, then move, resize and rotate — on one page or copied to every page." },
      { title: "Date and name", body: "Add today's date in your preferred format, or your name or initials." },
      { title: "Exact placement", body: "What you see is where it's embedded, on any page size or rotation." },
      { title: "Private", body: "Your signature and document never leave your device and aren't stored." },
    ],
    steps: [
      { title: "Open the PDF", body: "Drop in the document you need to sign." },
      { title: "Create your signature", body: "Draw, type or upload it." },
      { title: "Place and download", body: "Drag it into position, add a date if needed, and download the signed PDF." },
    ],
    specs: [
      { label: "Signature input", value: "Draw (mouse, touch, pen), type (3 fonts), upload PNG/JPG/WebP" },
      { label: "Placement", value: "Move, resize, rotate; copy to all pages" },
      { label: "Extras", value: "Date (4 formats), name or initials" },
      { label: "Type", value: "Visual signature (image) — not a certificate-based digital signature" },
      { label: "Storage", value: "None — kept in memory only while the page is open" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "PNG", "JPG"],
    privacy: "Your document and signature stay in your browser. Nothing is uploaded, and signatures are discarded when you start again or leave the page.",
    examples: [
      { title: "A rental agreement", body: "Draw your signature once, place it on the last page above your name, add today's date beside it, and download." },
      { title: "Initialling every page", body: "Type your initials, place them in the bottom corner of page 1, then use Copy to all pages." },
      { title: "A scanned signature", body: "Upload a photo of your signature on white paper; the background is removed so only the ink appears on the page." },
    ],
    faqs: [
      { q: "Is this a legally valid electronic signature?", a: "It depends. This tool adds a visual signature — an image of your signature — to the PDF. Many everyday agreements accept that, but some documents and countries require a certificate-based digital signature, identity verification or a specific signing process. Check what your document needs; for regulated documents use an approved e-signature or digital-signature service." },
      { q: "Is it a digital signature?", a: "No. It doesn't use a certificate, doesn't verify who signed, and doesn't lock the document against changes." },
      { q: "Is my signature stored?", a: "No. It exists only in your browser's memory while the page is open and is discarded when you start again or leave. Nothing is uploaded." },
      { q: "Can I sign on my phone?", a: "Yes. Draw with your finger on the signature pad, then drag the signature into place on the page." },
      { q: "Will the signature stay in the right place?", a: "Yes. It's embedded at the exact position, size and angle shown, on any page size or rotation." },
      { q: "Can I sign several pages?", a: "Yes. Place it on each page you need, or place it once and use Copy to all pages." },
    ],
    related: ["pdf-editor", "pdf-organizer", "pdf-to-word"],
    searchTerms: ["sign pdf", "signature", "e-sign", "esign", "add signature", "electronic signature", "sign document", "initials", "draw signature", "signature pdf", "fill and sign"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "protect-pdf",
    name: "Protect PDF",
    category: "pdf",
    icon: "lock",
    short: "Add a password to a PDF with AES-256 encryption, plus optional print and copy restrictions.",
    intro:
      "Put a password on a PDF so only people who know it can open it. The file is genuinely encrypted with AES-256 and checked before you download it — and it never leaves your device.",
    what:
      "Protect PDF encrypts a PDF so that it can only be opened with the password you choose. ZSpace Tools uses qpdf — a long-established open-source PDF library — running in your browser to apply standard PDF encryption (AES-256, or AES-128 for very old readers), and can optionally restrict printing, copying and editing.",
    how:
      "Your PDF is passed to qpdf, compiled to WebAssembly and running in a background worker on your device. qpdf rewrites the file with the PDF standard's security handler: every stream and string is encrypted with AES, and the key is protected by your opening password. Optional restrictions are stored as permission flags, protected by a separate permissions password (a random one if you don't set your own). Before the download is offered, the new file is reopened with pdf.js to prove it refuses to open without the password and opens correctly with it. Passwords are held only in memory for the operation and cleared afterwards.",
    seo: {
      title: "Protect PDF – Add Password and Encrypt PDF Files Online",
      description:
        "Password protect a PDF online for free with real AES-256 encryption. Optional print, copy and edit restrictions. Encrypted on your device — your file and password are never uploaded.",
      keyword: "Protect PDF",
      secondary: ["password protect PDF", "lock PDF", "add password to PDF", "encrypt PDF online", "secure PDF document", "PDF password protection", "protect PDF from opening"],
    },
    features: [
      { title: "Real encryption", body: "AES-256 by default (or AES-128 for very old readers) using qpdf — not a cosmetic lock." },
      { title: "Checked before download", body: "The protected file is reopened to confirm it needs the password and opens correctly with it." },
      { title: "Optional restrictions", body: "Limit printing, copying text, editing, and comments and forms, with your own permissions password." },
      { title: "Password guidance", body: "See how strong your password is, with simple tips; confirm it so typos don't lock you out." },
      { title: "Nothing stored", body: "Your password is used once in your browser and then cleared. It's never uploaded, saved or logged." },
      { title: "Private", body: "The PDF is encrypted on your device and never uploaded." },
    ],
    steps: [
      { title: "Add your PDF", body: "Drop in the PDF you want to protect." },
      { title: "Choose a password", body: "Type it twice. Optionally restrict printing, copying or editing." },
      { title: "Encrypt and download", body: "Press Encrypt PDF; once it's checked, download the protected file." },
    ],
    specs: [
      { label: "Encryption", value: "AES-256 (PDF 2.0, Acrobat X+) or AES-128 (Acrobat 7+)" },
      { label: "Engine", value: "qpdf (WebAssembly) — Apache-2.0" },
      { label: "Restrictions", value: "Printing (full / low / none), copying, editing, comments & forms" },
      { label: "Verification", value: "Reopened with and without the password before download" },
      { label: "Limit", value: "100 MB" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF"],
    privacy: "Your PDF and password stay in your browser. The password is used once and cleared; it's never uploaded, stored or sent to analytics.",
    examples: [
      { title: "A salary slip", body: "Protect a payslip with a password before emailing it; your colleague types the password to open it." },
      { title: "Print-only report", body: "Allow printing but block copying and editing, with a permissions password only you know." },
      { title: "Sharing with an old system", body: "Choose AES-128 if the recipient uses very old PDF software that doesn't support AES-256." },
    ],
    faqs: [
      { q: "Is the PDF really encrypted?", a: "Yes. The whole file is encrypted with AES using the PDF standard's security handler, so its contents can't be read without the password. We reopen the result to confirm it asks for the password before you can download it." },
      { q: "What if I forget the password?", a: "It can't be recovered — we never store it. Keep it somewhere safe, such as a password manager." },
      { q: "Do printing and copying restrictions stop everything?", a: "No. Mainstream PDF apps respect them, but they aren't DRM: some software ignores them, and anyone who can see the page can photograph or retype it. Use them as a clear signal, not as strong protection." },
      { q: "Which encryption should I choose?", a: "AES-256 is the strongest and works in Acrobat Reader X (2010) and every modern browser and PDF app. Choose AES-128 only if someone needs to open it in very old software." },
      { q: "Is my file or password uploaded?", a: "No. Encryption happens entirely in your browser." },
      { q: "Can I protect a PDF that already has a password?", a: "Unlock it first with Unlock PDF (you'll need its current password), then protect it again with the new one." },
    ],
    related: ["unlock-pdf", "pdf-editor", "sign-pdf"],
    searchTerms: ["protect pdf", "password protect pdf", "lock pdf", "encrypt pdf", "add password to pdf", "secure pdf", "pdf password", "aes-256", "restrict printing", "pdf security"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "unlock-pdf",
    name: "Unlock PDF",
    category: "pdf",
    icon: "unlock",
    short: "Remove the password from a PDF you're allowed to open — using its correct password.",
    intro:
      "Remove the password from a PDF you have the right to open, so it opens without asking every time. Enter the document's password and download an unlocked copy — no guessing, no cracking, nothing uploaded.",
    what:
      "Unlock PDF removes password protection from a PDF when you know its password. ZSpace Tools uses qpdf in your browser to decrypt the document and save an unprotected copy, keeping its pages, text, images, links and form fields exactly as they were.",
    how:
      "PDFs can have two passwords. The opening (user) password is needed to view the file; the permissions (owner) password controls printing, copying and editing. The tool first checks which kind your PDF has. With the permissions password, qpdf decrypts the file completely. With only the opening password, the opening password is removed but the author's restrictions are kept — removing those needs the permissions password. A wrong password is simply refused; the tool never tries other passwords. The unlocked file is reopened with pdf.js to confirm it opens without a password before you download it.",
    seo: {
      title: "Unlock PDF – Remove Password from PDF Online",
      description:
        "Remove the password from a PDF online for free when you know it. Decrypt PDFs with qpdf in your browser — content stays intact, and your file and password are never uploaded.",
      keyword: "Unlock PDF",
      secondary: ["remove PDF password", "unlock PDF online", "remove password protection from PDF", "decrypt PDF", "PDF password remover", "open protected PDF"],
    },
    features: [
      { title: "Uses your password", body: "Enter the PDF's password to remove it. Wrong passwords are refused — nothing is guessed or cracked." },
      { title: "Knows both passwords", body: "Tells opening passwords and permissions passwords apart, and explains what each can remove." },
      { title: "Lossless", body: "Pages, text, images, links, comments and forms are kept — nothing is turned into images." },
      { title: "Checked", body: "The unlocked copy is reopened to confirm it opens without a password." },
      { title: "Clear errors", body: "A wrong password gets a clear message and another try — never a broken file." },
      { title: "Private", body: "Your PDF and password stay in your browser." },
    ],
    steps: [
      { title: "Add the protected PDF", body: "Drop it in; the tool checks what kind of protection it has." },
      { title: "Enter the password", body: "Type the PDF's password — or its permissions password to lift restrictions too." },
      { title: "Download", body: "Download the unlocked copy." },
    ],
    specs: [
      { label: "Supports", value: "RC4 40/128-bit, AES-128, AES-256 PDFs" },
      { label: "Opening password", value: "Removed; existing restrictions kept" },
      { label: "Permissions password", value: "Removes the password and all restrictions" },
      { label: "Password guessing", value: "Never — the correct password is required" },
      { label: "Engine", value: "qpdf (WebAssembly)" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF"],
    privacy: "Your PDF and password stay in your browser. The password is used once and cleared; it's never uploaded, stored or logged.",
    examples: [
      { title: "A bank statement", body: "Statements often open with your date of birth or customer ID. Enter it once here, and the saved copy opens without asking." },
      { title: "A restricted report", body: "A report opens freely but blocks printing. With its permissions password you can remove the restriction; without it, the tool explains why it can't." },
      { title: "Wrong password", body: "Type the wrong password and you'll see “That password isn't correct” — try again; no file is produced." },
    ],
    faqs: [
      { q: "Can this unlock a PDF if I don't know the password?", a: "No. It needs the correct password and never tries to guess, crack or bypass it. Only unlock documents you're entitled to open." },
      { q: "What's the difference between the two PDF passwords?", a: "The opening (user) password is needed to view the PDF. The permissions (owner) password controls restrictions like printing and copying. A PDF can have either or both." },
      { q: "Why are printing restrictions still there?", a: "You entered the opening password. That lets you open the file, but the author's restrictions are tied to the permissions password, so we keep them. Enter the permissions password to remove them too." },
      { q: "Will the unlocked PDF look the same?", a: "Yes. The file is decrypted, not re-rendered, so text, images, links and forms are unchanged." },
      { q: "Is my file or password uploaded?", a: "No. Everything happens in your browser." },
      { q: "My PDF isn't protected — why can't I unlock it?", a: "If it opens without a password and has no restrictions, there's nothing to remove; the tool tells you so." },
    ],
    related: ["protect-pdf", "pdf-editor", "pdf-compressor"],
    searchTerms: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf password remover", "open protected pdf", "remove password", "unlock", "bank statement password"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "watermark-pdf",
    name: "Add Watermark to PDF",
    category: "pdf",
    icon: "stamp",
    short: "Stamp text or a logo across PDF pages — with opacity, rotation, position and tiling.",
    intro:
      "Add a text or logo watermark to your PDF — CONFIDENTIAL, DRAFT, your company logo or anything else. Set the opacity, angle and position, choose the pages, and see exactly how it will look before you download.",
    what:
      "A PDF watermark is text or an image placed on every page (or selected pages) to mark a document as confidential, a draft or yours. ZSpace Tools' Add Watermark to PDF tool adds the watermark on top of your existing pages as real text or a picture, keeping the original content sharp and selectable.",
    how:
      "The watermark is turned into objects placed in each page's coordinates — the same objects drive the live preview (drawn over a pdf.js render) and the final file (written with pdf-lib), so the preview matches the download, including on rotated or odd-sized pages. Text watermarks are real PDF text in Helvetica, Times or Courier; image watermarks keep their transparency. Opacity is applied with PDF transparency, not by fading the page, and the original page content is never turned into an image.",
    seo: {
      title: "Add Watermark to PDF Online – Free Text & Image Watermark",
      description:
        "Add text or image watermarks to PDF files online. Customise transparency, position, rotation and page selection. Download your watermarked PDF for free.",
      keyword: "Watermark PDF",
      secondary: ["add watermark to PDF", "PDF watermark", "insert logo into PDF", "add text watermark", "add image watermark", "stamp PDF", "watermark PDF pages"],
    },
    features: [
      { title: "Text or logo", body: "Presets like CONFIDENTIAL and DRAFT, any custom text, or your PNG, JPG or WebP logo with transparency." },
      { title: "Full control", body: "Font, size, colour, opacity, rotation, nine positions, a diagonal preset, margins — or drag it anywhere." },
      { title: "Tiled watermarks", body: "Repeat the mark across the whole page for documents that must not be reused." },
      { title: "Choose pages", body: "All, all but the first page, first, last, odd, even or a custom range like 2-5, 9." },
      { title: "Accurate preview", body: "The preview uses the same placement as the download." },
      { title: "Content preserved", body: "Pages aren't rasterised — the original text stays selectable and sharp." },
    ],
    steps: [
      { title: "Add a PDF", body: "Drop in the document." },
      { title: "Design the watermark", body: "Pick text or a logo, then adjust opacity, rotation, position and pages while watching the preview." },
      { title: "Download", body: "Press Add watermark & download." },
    ],
    specs: [
      { label: "Text", value: "Helvetica, Times, Courier (regular/bold); 8–160 pt" },
      { label: "Images", value: "PNG (with transparency), JPG, WebP" },
      { label: "Placement", value: "9 positions, diagonal centre, custom drag, tiled" },
      { label: "Pages", value: "All, all but first, first, last, odd, even, custom ranges" },
      { label: "Output", value: "Same pages, content untouched, watermark on top" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "PNG", "JPG", "WebP"],
    privacy: "Your PDF and logo stay in your browser and are never uploaded.",
    examples: [
      { title: "Draft contract", body: "A red “DRAFT” at 25% opacity, rotated −45° across the centre of every page." },
      { title: "Branded proposal", body: "Your logo at 15% of the page width in the bottom-right corner of pages 2 to the end." },
      { title: "Sample document", body: "“SAMPLE” tiled across each page at low opacity so screenshots can't be reused." },
    ],
    faqs: [
      { q: "Does a watermark stop people copying my PDF?", a: "No. It's a visible mark, not protection — someone with the right tools could remove or crop it. Use Protect PDF to control who can open the file." },
      { q: "Will the original text stay selectable?", a: "Yes. The watermark is added on top; the page isn't turned into an image." },
      { q: "Can I use a transparent PNG logo?", a: "Yes — transparent areas stay transparent, and you can lower the opacity further." },
      { q: "Can I watermark only some pages?", a: "Yes: first, last, odd, even, or a custom list such as 1-3, 7, 10-end." },
      { q: "Does the preview match the downloaded file?", a: "Yes. Both use the same coordinates, so the watermark lands exactly where you see it, including on landscape or rotated pages." },
      { q: "Is my PDF uploaded?", a: "No. Watermarking happens in your browser." },
    ],
    related: ["add-page-numbers", "pdf-compressor", "sign-pdf"],
    searchTerms: ["watermark pdf", "add watermark", "pdf watermark", "stamp pdf", "confidential", "draft", "logo on pdf", "add logo to pdf", "text watermark", "image watermark"],
    published: "2026-11-13",
    updated: "2026-11-15",
  },
  {
    slug: "add-page-numbers",
    name: "Add Page Numbers to PDF",
    category: "pdf",
    icon: "numbers",
    short: "Number PDF pages in any corner — 1, 01, Page 1 of 10, Roman numerals — and skip cover pages.",
    intro:
      "Add page numbers to a PDF in a few clicks. Pick the corner and style, leave the cover pages out, start from any number, and add an optional header or footer — with a live preview of every page.",
    what:
      "Add Page Numbers to PDF writes page numbers onto the pages of an existing PDF. ZSpace Tools supports common styles (1, 01, Page 1, Page 1 of 10, 1 / 10, Roman numerals), custom prefixes and suffixes, skipping the first pages, a custom start number and page ranges, plus optional header and footer text.",
    how:
      "For each page that should be numbered, the tool works out the number to show (skipping the pages you leave out and starting from your chosen value) and places it with a margin from the chosen edge of that page — so it lands correctly on portrait, landscape and mixed page sizes. The same placement drives the live preview and the final PDF, written with pdf-lib as real text in Helvetica, Times or Courier. “Page 1 of N” counts only the numbered pages. Existing content isn't touched or rasterised.",
    seo: {
      title: "Add Page Numbers to PDF Online – Free PDF Page Number Tool",
      description:
        "Add page numbers to PDF documents online. Customise position, alignment, starting number and format. Preview and download your numbered PDF for free.",
      keyword: "Add Page Numbers to PDF",
      secondary: ["number PDF pages", "insert page numbers in PDF", "PDF page numbering", "add page numbers online", "PDF footer page numbers", "PDF header and footer", "number pages in a PDF document"],
    },
    features: [
      { title: "Six positions", body: "Top or bottom; left, centre or right — placed the same distance from the edge on every page size." },
      { title: "Seven styles", body: "1, 01, Page 1, Page 1 of 10, 1 / 10, I II III and i ii iii — with any prefix or suffix." },
      { title: "Skip cover pages", body: "Leave the first pages unnumbered and start counting at 1 (or any number) where you want." },
      { title: "Page ranges", body: "Number all pages, all but the first, odd or even pages, or a custom range such as 3-end." },
      { title: "Header & footer", body: "Optional text with {title}, {date}, {page} and {total} placeholders." },
      { title: "Live preview", body: "Flip through pages to check every number before downloading." },
    ],
    steps: [
      { title: "Add a PDF", body: "Drop in your document." },
      { title: "Set up numbering", body: "Choose the position and style, pages to skip and the starting number." },
      { title: "Download", body: "Check the preview and download the numbered PDF." },
    ],
    specs: [
      { label: "Positions", value: "Top/bottom × left/centre/right" },
      { label: "Styles", value: "1 · 01 · Page 1 · Page 1 of N · 1 / N · I · i" },
      { label: "Start / skip", value: "Any start number; skip leading pages" },
      { label: "Fonts", value: "Helvetica, Times, Courier; 6–36 pt; colour & opacity" },
      { label: "Extras", value: "Header and footer text with placeholders" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF"],
    privacy: "Your PDF is numbered in your browser and never uploaded.",
    examples: [
      { title: "Skip the cover", body: "A 20-page report: leave the first 2 pages unnumbered and the third page shows “1”; the last page shows “18”." },
      { title: "Front matter in Roman numerals", body: "Number pages 1–4 as i–iv, then run the tool again on pages 5-end starting at 1." },
      { title: "Formal footer", body: "Bottom right “Page 3 of 12” with the footer “Annual Report · 13 Nov 2026” on the left." },
    ],
    faqs: [
      { q: "How do I start numbering on page 3?", a: "Set “Leave unnumbered first 2 pages” and “Start counting at 1”. Page 3 shows 1, and “of N” counts only the numbered pages." },
      { q: "Will numbers sit correctly on landscape pages?", a: "Yes. Each number is placed relative to its own page, so portrait, landscape and mixed sizes all line up." },
      { q: "Will the numbers cover my content?", a: "They're placed in the margin you choose (28 pt ≈ 10 mm by default). If your pages have content close to the edge, increase the margin or choose another corner — the preview shows the result." },
      { q: "Can I use Roman numerals?", a: "Yes — upper-case (I, II, III) or lower-case (i, ii, iii)." },
      { q: "Is the original PDF changed?", a: "No. You download a new copy with numbers added on top of the existing content." },
      { q: "Is my file uploaded?", a: "No. Everything runs in your browser." },
    ],
    related: ["pdf-merger", "watermark-pdf", "pdf-compressor"],
    searchTerms: ["page numbers", "number pdf pages", "add page numbers", "pdf page numbering", "pagination", "header footer pdf", "roman numerals", "page x of y", "footer"],
    published: "2026-11-13",
    updated: "2026-11-15",
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint Converter",
    category: "pdf",
    alsoIn: ["conversion"],
    icon: "slides",
    short: "Turn PDF pages into PowerPoint slides — picture-perfect or with editable text.",
    intro:
      "Convert a PDF into a PowerPoint presentation. Keep every page looking exactly like the PDF as picture slides, or rebuild the text as editable text boxes — then download a PPTX that opens in PowerPoint, Keynote or Google Slides.",
    what:
      "A PDF to PowerPoint converter turns each PDF page into a slide in a .pptx file. ZSpace Tools offers two honest modes: layout-preserving slides (a high-quality picture of each page — exact, but not editable) and editable slides (text rebuilt as PowerPoint text boxes and tables over the page's graphics).",
    how:
      "In layout mode each page is rendered with pdf.js at the quality you choose and placed on its own slide, centred without stretching. In editable mode the page's text is read with its position, font and size, and grouped into paragraphs, headings and simple tables — the same analysis as our PDF to Word converter — which become PowerPoint text boxes; the page's shapes, colours and pictures can be kept as a background image drawn without the text, so the slide still looks like the page. Scanned pages have no text to extract, so they become picture slides, with OCR text optionally added to the speaker notes. The presentation is built with pptxgenjs and saved as a standard .pptx.",
    seo: {
      title: "PDF to PowerPoint Converter – Convert PDF to PPTX Online",
      description:
        "Convert PDF to PowerPoint (PPTX) online for free. Choose picture-perfect slides or editable text, 16:9, 4:3 or matching slide size, and page ranges. Converted on your device.",
      keyword: "PDF to PowerPoint Converter",
      secondary: ["PDF to PPT", "PDF to PPTX", "convert PDF to PowerPoint", "PDF to editable PowerPoint", "PDF presentation converter", "online PDF to PPT converter"],
    },
    features: [
      { title: "Two clear modes", body: "Picture slides that look exactly like the PDF, or editable text boxes over the page's graphics." },
      { title: "Right slide size", body: "Match the PDF's shape, or use 16:9 or 4:3 — pages are centred, never stretched." },
      { title: "Editable text", body: "Paragraphs, headings, bold/italic, alignment and simple tables become real PowerPoint text." },
      { title: "Choose pages", body: "Convert all pages, odd/even, or a range such as 1-5, 9." },
      { title: "Scanned PDFs", body: "Kept as picture slides; OCR can put their text in the speaker notes." },
      { title: "Private", body: "Converted in your browser — your PDF is never uploaded." },
    ],
    steps: [
      { title: "Add a PDF", body: "Drop it in and choose which pages to convert." },
      { title: "Pick a mode and size", body: "Keep the layout or get editable text; choose the slide size and image quality." },
      { title: "Download the PPTX", body: "Open it in PowerPoint, Keynote or Google Slides." },
    ],
    specs: [
      { label: "Output", value: "PPTX (PowerPoint 2007+, Keynote, Google Slides, LibreOffice)" },
      { label: "Modes", value: "Layout-preserving pictures; editable text boxes & tables" },
      { label: "Slide size", value: "Match PDF, 16:9 (13.33 × 7.5 in), 4:3 (10 × 7.5 in)" },
      { label: "Image quality", value: "110, 150 or 220 DPI" },
      { label: "Limits", value: "60 MB, 300 pages" },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF", "PPTX"],
    privacy: "Your PDF is converted in your browser and never uploaded.",
    examples: [
      { title: "A pitch deck exported as PDF", body: "Layout mode with Match PDF size brings back slides that look identical — perfect for presenting." },
      { title: "A report to adapt", body: "Editable mode on pages 2-4 gives slides whose headings and paragraphs you can rewrite, with the page design behind them." },
      { title: "A portrait PDF on 16:9", body: "Portrait pages are centred on widescreen slides with white space at the sides instead of being squashed." },
    ],
    faqs: [
      { q: "Will the slides be editable?", a: "In editable mode, text becomes PowerPoint text boxes and simple tables. In layout mode each slide is a picture — it looks exact but text can't be edited. We never present picture slides as editable." },
      { q: "Why does my editable slide look slightly different?", a: "Text is re-flowed by PowerPoint with the fonts on your computer, so line breaks can shift. Charts, layered graphics and complex tables may need adjusting." },
      { q: "What about scanned PDFs?", a: "They contain pictures of text, not text, so they become picture slides. Turn on OCR to add the recognised text to each slide's speaker notes." },
      { q: "Will it open in PowerPoint?", a: "Yes — it's a standard .pptx file that opens in PowerPoint 2007 and later, Keynote, Google Slides and LibreOffice Impress. Very old versions may display some features differently." },
      { q: "Is my PDF uploaded?", a: "No. The conversion runs entirely in your browser." },
      { q: "Can I convert only some pages?", a: "Yes — choose first, last, odd, even or a custom range." },
    ],
    related: ["pdf-to-word", "pdf-to-excel", "pdf-to-jpg"],
    searchTerms: ["pdf to powerpoint", "pdf to ppt", "pdf to pptx", "convert pdf to slides", "pdf presentation", "pdf to keynote", "pdf to google slides", "editable powerpoint"],
    published: "2026-11-13",
    updated: "2026-11-13",
  },
  {
    slug: "number-to-words",
    name: "Number to Words Converter",
    category: "calculators",
    alsoIn: ["business"],
    icon: "words",
    short: "Write numbers and amounts in words — Indian lakh and crore or international million and billion, cheque-ready.",
    intro:
      "Convert any number into words in the Indian (lakh, crore) or international (million, billion) system, or write an amount in words for a cheque or invoice — Rupees and Paise, Dollars and Cents and more.",
    what:
      "A number to words converter spells out a figure in English, such as 1,25,000 → One Lakh Twenty Five Thousand. ZSpace Tools' Number to Words Converter supports the Indian and international numbering systems, plain numbers with decimals, and currency amounts with major and minor units (Rupees and Paise, Dollars and Cents), including cheque-style wording such as “Rupees One Lakh Twenty Five Thousand Only”.",
    how:
      "Your input is read as text, not as a floating-point number, so amounts like 0.29 or 10.005 are never distorted. Grouping commas are checked (1,25,000 and 125,000 are both accepted; 3,50 is rejected rather than misread). The whole part is split into Indian groups (crore, lakh, thousand, hundred) or international groups of three (trillion, billion, million, thousand). For currency, extra decimal places are rounded half up — and the tool tells you when that happens.",
    seo: {
      title: "Number to Words Converter – Indian Rupees, Lakh & Crore",
      description:
        "Convert numbers into words in Indian lakh and crore or international million and billion formats. Generate cheque-ready rupee and currency amounts instantly.",
      keyword: "number to words",
      secondary: ["amount in words", "rupees in words", "number to words in Indian rupees", "lakh to words", "crore in words", "cheque amount in words", "number to words converter"],
    },
    features: [
      { title: "Indian and international systems", body: "1,00,00,000 is One Crore in the Indian system and Ten Million internationally. Switch any time — your number stays." },
      { title: "Cheque-ready currency wording", body: "Rupees and Paise, Dollars and Cents, Pounds and Pence, Euros, Dirhams and Fils, plus AUD, CAD, SGD and a custom unit. Singular and plural are handled (One Rupee, One Paisa, One Penny)." },
      { title: "Exact decimals", body: "String-based arithmetic means no floating-point errors. Currency amounts with too many decimals are rounded half up with a visible note, never silently." },
      { title: "Your style", body: "Title Case, Sentence case or UPPERCASE; optional “Only”, “and” and hyphens; currency word before or after; paise in words or as a 50/100 fraction." },
      { title: "Bulk conversion", body: `Paste up to 1,000 amounts, one per line, and download every result as CSV — handy for invoices and payment lists.` },
      { title: "Formatted amount too", body: "See the amount with Indian (1,25,000.00) or international (125,000.00) grouping alongside the words." },
    ],
    steps: [
      { title: "Enter a number or amount", body: "Type 125000, 1,25,000.50 or ₹ 2,500 — commas, spaces and a currency symbol are fine." },
      { title: "Choose the format", body: "Pick Number or Currency, the Indian or international system, the currency and the wording style." },
      { title: "Copy the words", body: "Copy the result in one click, or switch to Bulk list to convert many amounts and download a CSV." },
    ],
    specs: [
      { label: "Range", value: "Up to 999,999,999,999,999 (15 whole digits) and 20 decimal places" },
      { label: "Indian scale", value: "Thousand, lakh, crore (lakh crore, crore crore beyond)" },
      { label: "International scale", value: "Thousand, million, billion, trillion" },
      { label: "Currencies", value: "INR, USD, GBP, EUR, AED, AUD, CAD, SGD, custom" },
      { label: "Rounding", value: "Half up to the currency's decimal places, always reported" },
      { label: "Arithmetic", value: "Decimal string arithmetic (no floating point)" },
      { label: "Bulk", value: "Up to 1,000 lines · CSV export" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["Numbers", "Currency amounts", "CSV"],
    privacy: "Numbers and amounts are converted in your browser. They are never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Indian cheque", body: "125000 → Rupees One Lakh Twenty Five Thousand Only. 2,50,000.50 → Rupees Two Lakh Fifty Thousand and Fifty Paise Only." },
      { title: "International", body: "12,500,000 → Twelve Million Five Hundred Thousand. The same value in the Indian system is One Crore Twenty Five Lakh." },
      { title: "US cheque fraction", body: "1234.50 in USD with the fraction style → One Thousand Two Hundred Thirty Four and 50/100 Dollars." },
    ],
    faqs: [
      { q: "How do I write an amount in words in Indian format?", a: "Group the number into crore, lakh, thousand and hundreds, then add the currency: 12,34,567.50 is “Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Fifty Paise Only”. Enter the amount, choose Currency, INR and the Indian system, and copy the result." },
      { q: "What is 1 lakh and 1 crore in numbers?", a: "One lakh is 1,00,000 (100,000 — one hundred thousand). One crore is 1,00,00,000 (10,000,000 — ten million), which is 100 lakh." },
      { q: "How do I write 10 lakh in words?", a: "10,00,000 is “Ten Lakh” in the Indian system and “One Million” in the international system." },
      { q: "Should I write “Only” at the end of a cheque amount?", a: "In India and many other countries “Only” is commonly added so nothing can be written after the amount, but conventions differ between banks and countries and it isn't universally required. Check your bank's guidance." },
      { q: "How are paise and cents handled?", a: "They are converted exactly from the digits you type. If you enter more decimal places than the currency uses (for example 10.005 rupees), the amount is rounded half up to 10.01 and a note tells you so." },
      { q: "Does it handle negative numbers and decimals?", a: "Yes. Negative values are written with “Minus”. Plain decimals are read digit by digit (12.05 → Twelve Point Zero Five); trailing zeros after the point aren't read out because they don't change the value." },
      { q: "What is the largest number supported?", a: "999,999,999,999,999 — nine hundred ninety-nine trillion, or in the Indian system 9,99,99,999 crore. Larger values show a clear message instead of a wrong result." },
    ],
    related: ["invoice-generator", "gst-calculator", "percentage-calculator"],
    searchTerms: ["number to words", "amount in words", "rupees in words", "words", "spell", "cheque", "check", "lakh", "crore", "million", "billion", "paise", "cents", "currency", "invoice", "inr", "convert number", "numbers to text"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "text-diff-checker",
    name: "Text Diff Checker",
    category: "text",
    alsoIn: ["developer"],
    icon: "diff",
    short: "Compare two texts and see added, removed and changed lines, words or characters — side by side or unified.",
    intro:
      "Compare two versions of a text and see exactly what changed. Paste or open both versions, then view added, removed and changed lines, words or characters side by side or in a unified view.",
    what:
      "A diff checker compares two texts and highlights the differences between them. ZSpace Tools' Text Diff Checker lines the two versions up, marks lines that were added (+) or removed (−), pairs changed lines and highlights the exact words or characters that differ, with options to ignore case, whitespace, blank lines and line-ending style.",
    how:
      "Lines are compared with Myers' O(ND) difference algorithm — the method behind most diff tools — using its linear-memory variant, so large documents don't exhaust memory. Changed line pairs are then compared word by word or character by character; characters are grapheme clusters, so emoji and accented letters are never split. Ignore options only change how lines are compared — your texts are never modified, and the comparison runs in a background worker so the page stays responsive.",
    seo: {
      title: "Text Diff Checker – Compare Two Texts Online Free",
      description:
        "Compare two texts online and instantly find added, removed and changed content. View line, word or character differences side by side or in a unified view.",
      keyword: "text diff checker",
      secondary: ["compare two texts", "text comparison tool", "diff checker online", "compare text online", "find differences between two texts", "compare two documents"],
    },
    features: [
      { title: "Line, word or character", body: "See which lines changed, then exactly which words or characters inside them — down to a single changed letter or emoji." },
      { title: "Side by side or unified", body: "Two aligned columns, or one column with − and + lines like git diff. Unchanged stretches collapse so you can focus on the changes." },
      { title: "Ignore what doesn't matter", body: "Ignore letter case, leading/trailing spaces, all whitespace, blank lines or Windows vs Unix line endings — without changing your text." },
      { title: "Accessible highlighting", body: "Changes are marked with −/+ symbols, strikethrough and underline as well as colour, and labelled for screen readers." },
      { title: "Honest statistics", body: "Lines added and removed, changed sections and character counts — with a note whenever ignore options exclude differences." },
      { title: "Copy and download", body: "Copy a standard unified diff or the modified text, or download the comparison as a .diff file." },
    ],
    steps: [
      { title: "Add both versions", body: "Paste the original on the left and the modified text on the right, or open two text files." },
      { title: "Choose how to compare", body: "Pick line, word or character highlighting and side-by-side or unified view, and any ignore options." },
      { title: "Review and export", body: "Read the highlighted changes and statistics, then copy the unified diff or download it." },
    ],
    specs: [
      { label: "Algorithm", value: "Myers O(ND), linear-space bisection" },
      { label: "Granularity", value: "Line · word (Intl.Segmenter) · character (grapheme clusters)" },
      { label: "Views", value: "Side by side · unified" },
      { label: "Ignore options", value: "Case, leading/trailing whitespace, all whitespace, blank lines, line endings" },
      { label: "Export", value: "Unified diff (.diff), modified text" },
      { label: "Max size", value: "5,000,000 characters per side; text files up to 10 MB" },
      { label: "Live comparison", value: "Up to 300,000 characters combined; larger texts use the Compare button" },
      { label: "Processing", value: "In your browser (Web Worker)" },
    ],
    formats: ["TXT", "MD", "CSV", "JSON", "HTML", "Code"],
    privacy: "Both texts are compared in your browser. Nothing you paste or open is uploaded, stored or sent to analytics, and HTML in your text is shown as text, never rendered.",
    examples: [
      { title: "A changed word", body: "“Shipped in August” → “Shipped in July” shows one changed line with only August and July highlighted." },
      { title: "Formatting-only changes", body: "Re-indented code or a file saved with Windows line endings shows no differences once you ignore whitespace or normalize line endings." },
      { title: "Contract versions", body: "Paste two versions of an agreement, choose word mode and hide unchanged lines to see every edited clause." },
    ],
    faqs: [
      { q: "How can I compare two versions of a document?", a: "Paste the original into the left box and the new version into the right (or open both as text files). Differences appear straight away: removed text is marked −, added text +, and changed words are highlighted inside each line." },
      { q: "What's the difference between line, word and character mode?", a: "All three align the texts line by line. Line mode highlights whole changed lines; word mode also marks the changed words inside them; character mode marks individual characters, which suits codes, IDs and typos." },
      { q: "Do ignore options change my text?", a: "No. They only change how lines are compared. The texts, the copied modified text and the line content in the comparison are always exactly what you entered." },
      { q: "Why do two identical-looking texts show differences?", a: "Usually invisible characters: trailing spaces, tabs instead of spaces, or Windows (CRLF) versus Unix (LF) line endings. Turn on the matching ignore option, or keep it off to find them." },
      { q: "Can I compare Word or PDF files?", a: "Only plain text can be compared here. Copy the text out of the document, or convert it first with the PDF to Word tool, then paste it in." },
      { q: "Is there a size limit?", a: "Each side can hold up to 5 million characters. Texts over 300,000 characters combined are compared when you press Compare rather than on every keystroke, and very long changed lines are highlighted as whole lines." },
      { q: "Is my text uploaded?", a: "No. The comparison runs in a background worker in your browser, so nothing leaves your device." },
    ],
    related: ["word-counter", "case-converter", "markdown-editor"],
    searchTerms: ["diff", "compare", "comparison", "difference", "differences", "text compare", "diff checker", "changes", "version", "document compare", "code compare", "merge", "redline", "track changes"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "file-hash-generator",
    name: "File Hash Generator & Checksum Verifier",
    category: "developer",
    alsoIn: ["productivity"],
    icon: "hash",
    short: "Generate SHA-256, SHA-384 and SHA-512 hashes for files or text and verify downloads against a checksum.",
    intro:
      "Generate SHA-256, SHA-384 or SHA-512 checksums for files and text, and check a download against the checksum its publisher lists. Files are hashed in your browser — nothing is uploaded.",
    what:
      "A hash (or checksum) is a fixed-length fingerprint calculated from a file's contents: change one byte and the hash changes completely. ZSpace Tools' File Hash Generator & Checksum Verifier calculates SHA-256, SHA-384, SHA-512 or legacy SHA-1 hashes for one or many files or a piece of text, and compares them with an expected checksum. Hashing is not encryption — it can't be reversed to recover the file.",
    how:
      "Files up to 64 MB are hashed with the browser's Web Crypto API. Web Crypto needs the whole input in memory and can't stream, so larger files (up to 4 GB) are read in 4 MB chunks and fed to an incremental implementation of the same FIPS 180-4 algorithms; both paths are tested against reference implementations and give identical results. Hashing runs in a background worker, so the page stays responsive and shows progress.",
    seo: {
      title: "SHA256 File Hash Generator & Checksum Verifier Online",
      description:
        "Generate SHA-256, SHA-384 and SHA-512 hashes for text and files. Verify file checksums against expected values with a free browser-based tool.",
      keyword: "SHA256 generator",
      secondary: ["file checksum checker", "SHA-256 checksum", "verify SHA256 checksum", "file hash generator", "SHA-512 hash online", "checksum calculator", "SHA256 hash of a file"],
    },
    features: [
      { title: "SHA-256, SHA-384, SHA-512", body: "The SHA-2 family used by software publishers, plus SHA-1 for checking legacy checksums — clearly labelled as unsuitable for modern security." },
      { title: "Files and text", body: "Hash many files at once, each with its name, size and hash, or hash typed text as UTF-8." },
      { title: "Checksum verification", body: "Paste the expected value — or a whole SHA256SUMS list — and each file shows Match or Does not match. Letter case and spaces are ignored." },
      { title: "Large files, low memory", body: "Files over 64 MB are read in chunks with live progress, up to 4 GB each." },
      { title: "Clear validation", body: "An expected checksum of the wrong length or with invalid characters is flagged — including when it belongs to a different algorithm." },
      { title: "Export", body: "Copy one hash, copy all in sha256sum format, or download a CSV of names, sizes, hashes and results." },
    ],
    steps: [
      { title: "Add files or text", body: "Drop one or more files, or switch to Text and type or paste." },
      { title: "Pick the algorithm", body: "Choose the same algorithm as the checksum you're checking against — usually SHA-256." },
      { title: "Compare and export", body: "Paste the expected checksum to verify it, then copy the hashes or export a CSV." },
    ],
    specs: [
      { label: "Algorithms", value: "SHA-256, SHA-384, SHA-512 · SHA-1 (legacy)" },
      { label: "Engine", value: "Web Crypto (≤ 64 MB) · incremental FIPS 180-4 (larger files, or no Web Crypto)" },
      { label: "Max file size", value: "4 GB per file · 50 files at a time" },
      { label: "Expected-value formats", value: "Hex digest, sha256:<hex>, GNU (sha256sum) and BSD checksum lists" },
      { label: "Text encoding", value: "UTF-8" },
      { label: "Output", value: "Lowercase or uppercase hex · CSV export" },
      { label: "Not included", value: "Password hashing, HMAC, MD5" },
      { label: "Processing", value: "In your browser (Web Worker)" },
    ],
    formats: ["Any file", "Text"],
    privacy: "Files and text are hashed on your device. File contents, names and hashes are never uploaded or sent to analytics.",
    examples: [
      { title: "Empty input", body: "The SHA-256 of an empty file or empty text is always e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855." },
      { title: "One letter changes everything", body: "SHA-256 of “abc” starts ba7816bf…, while “abd” starts a52d159f… — completely different." },
      { title: "Checking a download", body: "Paste the line “<checksum>  setup.exe” from the publisher's SHA256SUMS file, drop setup.exe, and the result shows Match or Does not match." },
    ],
    faqs: [
      { q: "How can I verify a SHA-256 checksum?", a: "Drop the downloaded file here with SHA-256 selected, then paste the checksum from the publisher's website into “Expected checksum”. A Match means your file is byte-for-byte identical to the one the checksum was made from." },
      { q: "Does a matching hash prove a file is safe or authentic?", a: "It proves the file wasn't altered or corrupted relative to the checksum you compared. It only proves authenticity if that checksum came from a source you trust — for example the publisher's official HTTPS site, ideally with a signature — because anyone who can swap a file may also swap a checksum published next to it." },
      { q: "Is hashing the same as encryption?", a: "No. Encryption can be reversed with a key; a hash is a one-way fingerprint and can't be turned back into the file." },
      { q: "Which algorithm should I use?", a: "Use whatever the publisher lists — most use SHA-256. SHA-384 and SHA-512 are also secure. SHA-1 is a legacy algorithm and should not be used for modern cryptographic security; use it only to check an existing SHA-1 checksum." },
      { q: "Why does my text hash differ from a command-line result?", a: "Hashes depend on exact bytes. Text here is UTF-8 with LF (\\n) line breaks; a file with CRLF line breaks, a trailing newline (as echo adds) or a BOM gives a different hash. Hash the file itself for an exact comparison." },
      { q: "Is there a file size limit?", a: "Up to 4 GB per file. Files up to 64 MB use the browser's built-in Web Crypto; larger files are read in 4 MB chunks so memory use stays low, with a progress bar." },
      { q: "Can I use this to hash passwords?", a: "No. Storing passwords needs a slow, salted password-hashing function such as Argon2, scrypt or bcrypt — not a fast checksum like SHA-256. This tool is for file and text integrity checks." },
    ],
    related: ["base64-encoder-decoder", "protect-pdf", "text-diff-checker"],
    searchTerms: ["hash", "checksum", "sha256", "sha-256", "sha384", "sha512", "sha1", "verify", "integrity", "file hash", "digest", "fingerprint", "sha256sum", "download verify", "md5 alternative"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF Pages Online",
    category: "pdf",
    icon: "rotate",
    short: "Rotate one page, selected pages, odd or even pages, or a whole PDF — and download the fixed file.",
    intro:
      "Turn sideways or upside-down pages the right way up. Rotate a single page, a selection, odd or even pages, or the whole PDF by 90° or 180°, see every change in the preview, and download — nothing is uploaded.",
    what:
      "Rotating a PDF page changes the direction it's displayed and printed in, without altering what's on it. ZSpace Tools' Rotate PDF Pages tool sets the rotation of each page you choose in 90° steps — clockwise or anticlockwise — and saves the result as a normal PDF that opens the right way up everywhere.",
    how:
      "The PDF is opened in your browser. Page previews are drawn with pdf.js, and your changes are kept as an added turn per page, relative to the file as you opened it — so rotating right then left gets you back exactly where you started, and turns are never applied twice. On download, pdf-lib adds that turn to each page's existing /Rotate value in the original document. Page order, text, images, links, form fields, bookmarks and document properties are left as they were; pages you didn't rotate aren't touched.",
    seo: {
      title: "Rotate PDF Pages Online – Rotate PDF Free",
      description:
        "Rotate PDF pages online for free. Turn individual pages or your entire PDF clockwise or anticlockwise, preview changes and download your corrected document.",
      keyword: "rotate PDF",
      secondary: ["rotate PDF online", "rotate PDF pages", "rotate individual PDF pages", "rotate one page in PDF", "turn PDF pages", "fix sideways PDF"],
    },
    features: [
      { title: "Any page, any set", body: "Rotate one page with its own buttons, or apply a turn to all, selected, odd, even, landscape or portrait pages." },
      { title: "Left, right or 180°", body: "Clockwise and anticlockwise 90° turns, plus 180° for pages scanned upside down." },
      { title: "Fix sideways scans fast", body: "Choose Landscape (or Portrait) to rotate every page in that orientation at once — ideal for mixed documents." },
      { title: "Live preview", body: "Each thumbnail turns as you click and shows the added angle, so you can check every page before saving." },
      { title: "Nothing else changes", body: "Page order, content, links, form fields, bookmarks and document properties are kept. Only the pages you rotate are modified." },
      { title: "Reset any time", body: "Undo everything with Reset rotations — the file isn't changed until you download." },
    ],
    steps: [
      { title: "Add your PDF", body: "Drop it in or choose it; page thumbnails appear as you scroll." },
      { title: "Rotate pages", body: "Use the buttons under a page, or pick All, Selected, Odd, Even or Landscape and press Left, Right or 180°." },
      { title: "Download", body: "Check the previews and download the corrected PDF." },
    ],
    specs: [
      { label: "Steps", value: "90° clockwise, 90° anticlockwise, 180°" },
      { label: "Apply to", value: "One page, selected, all, odd, even, landscape, portrait" },
      { label: "Method", value: "Sets each page's /Rotate (pdf-lib); content not re-rendered" },
      { label: "Kept", value: "Order, text, images, links, forms, bookmarks, metadata" },
      { label: "Limits", value: `${MAX_PDF}, 1,000 pages` },
      { label: "Processing", value: "In your browser — nothing is uploaded" },
    ],
    formats: ["PDF"],
    privacy: "Your PDF is opened and rotated in your browser. It is never uploaded, and it's discarded when you close the page.",
    examples: [
      { title: "One sideways page", body: "Page 4 of a 12-page report is a landscape chart. Press the clockwise button under page 4 and download — the other 11 pages are untouched." },
      { title: "Double-sided scan", body: "A scanner flipped every back side upside down. Choose Even, press 180°, and the whole document reads correctly." },
      { title: "Mixed orientation", body: "Choose Landscape to select every sideways scanned page at once, then press Left 90°." },
    ],
    faqs: [
      { q: "Can I rotate only one page in a PDF?", a: "Yes. Use the rotate buttons under that page's thumbnail. Only that page changes; every other page stays exactly as it was." },
      { q: "How do I rotate all pages at once?", a: "Leave “Apply to” on All and press Left 90°, Right 90° or 180°." },
      { q: "Is the rotation permanent?", a: "Yes — it's saved in the downloaded PDF, so it opens the right way up in any PDF reader and prints that way. Your original file on your device isn't changed." },
      { q: "Does rotating reduce quality?", a: "No. The page's rotation setting is changed; text and images aren't re-rendered or recompressed, so text stays selectable and sharp." },
      { q: "What if a page was already rotated?", a: "The turn you add is combined with the page's existing rotation, and the preview shows the result. Rotating right and then left returns the page to how it was." },
      { q: "Can I rotate a password-protected PDF?", a: "Not directly. Remove the password first with the Unlock PDF tool (you'll need the password), then rotate the unlocked copy." },
      { q: "How is this different from Organize PDF?", a: "Rotate PDF does one job and keeps everything else in the file as it was. Use Organize PDF Pages if you also need to reorder, delete or duplicate pages." },
    ],
    related: ["pdf-splitter", "pdf-merger", "pdf-organizer"],
    searchTerms: ["rotate", "rotation", "turn", "sideways", "upside down", "landscape", "portrait", "flip page", "rotate pdf", "orientation", "pdf", "fix scan"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "sip-calculator",
    name: "SIP Calculator",
    category: "calculators",
    icon: "trending",
    short: "Estimate mutual fund SIP maturity value, returns and step-up SIP growth, year by year.",
    intro:
      "Estimate what a monthly SIP could grow to. Enter your monthly investment, an assumed return and the period to see the maturity value, total invested and estimated returns — with step-up SIPs, scenario comparison and a year-wise table.",
    what:
      "A SIP (systematic investment plan) invests a fixed amount in a mutual fund every month. ZSpace Tools' SIP Calculator projects how those instalments could grow at a constant assumed annual return, showing the estimated maturity value, how much you put in, and how much of the result is estimated returns. It also handles step-up SIPs, where the instalment rises every year.",
    how:
      "The annual return is converted to a monthly rate — by default the effective rate (1 + R)^(1/12) − 1, so twelve months compound to exactly R, or optionally R ÷ 12 as many fund-house calculators use. A fixed SIP uses the future value of a series of monthly payments, FV = P × ((1 + r)^n − 1) ÷ r, multiplied by (1 + r) if you invest at the start of each month. Step-up SIPs are calculated month by month, so every instalment compounds for exactly the months it's invested.",
    seo: {
      title: "SIP Calculator – Calculate Mutual Fund SIP Returns Online",
      description:
        "Calculate your SIP returns online. Estimate mutual fund investment growth, maturity value, total returns and step-up SIP projections with our free SIP calculator.",
      keyword: "SIP calculator",
      secondary: ["mutual fund SIP returns", "step-up SIP calculator", "monthly SIP calculator", "SIP maturity calculator", "SIP return calculator India"],
    },
    features: [
      { title: "Maturity, invested and returns", body: "See the estimated maturity value split into the amount you invested and estimated returns, with instalments, the monthly rate used and the effective annual return." },
      { title: "Step-up SIP", body: "Raise the instalment by a fixed % every year and see how much more it could grow compared with a regular SIP." },
      { title: "Start or end of month", body: "Choose when each instalment is paid — investing at the start of the month gives every instalment one more month of growth." },
      { title: "Compare two scenarios", body: "Put a second amount, return, period or step-up side by side with the difference in each figure." },
      { title: "Year-wise growth", body: "A chart and table of invested amount and estimated value at the end of every year, exportable as CSV." },
      { title: "Transparent maths", body: "Choose the effective-annual or nominal (÷ 12) monthly rate and see exactly which formula was used." },
    ],
    steps: [
      { title: "Enter your SIP", body: "Monthly amount, the return you want to assume and how many years or months." },
      { title: "Add options", body: "Optionally add an annual step-up, change the payment timing or compare a second scenario." },
      { title: "Review and export", body: "Check the maturity estimate and year-wise table, then copy a summary or download the CSV." },
    ],
    specs: [
      { label: "Monthly rate", value: "(1 + R)^(1/12) − 1 (default) or R ÷ 12" },
      { label: "Fixed SIP", value: "FV = P × ((1 + r)^n − 1) ÷ r, × (1 + r) at start of month" },
      { label: "Step-up", value: "Instalment × (1 + s) after every 12 instalments; month-by-month" },
      { label: "Ranges", value: "Return −50% to 100%; up to 50 years; step-up 0–100%" },
      { label: "Exports", value: "Summary (TXT), year-wise table (CSV)" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Amounts and assumptions stay in your browser. Nothing you enter is uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹10,000 a month for 10 years", body: "At an assumed 12% a year (effective), ₹12,00,000 invested is estimated at about ₹22,19,300. With the R ÷ 12 convention and start-of-month investing — the setting many Indian calculators use — it's about ₹23,23,391." },
      { title: "Step-up SIP", body: "The same ₹10,000 SIP rising 10% each year invests about ₹19,12,491 and is estimated at about ₹32,38,172 after 10 years at 12%." },
      { title: "$500 a month", body: "A US investor putting in $500 a month for 20 years at an assumed 7% invests $120,000; the estimate is about $253,800." },
    ],
    faqs: [
      { q: "How is SIP maturity calculated?", a: "Each monthly instalment grows at the monthly rate for the months it stays invested, and the results are added up. For a fixed SIP that's FV = P × ((1 + r)^n − 1) ÷ r, where P is the instalment, r the monthly rate and n the number of instalments (multiplied by 1 + r if you invest at the start of the month)." },
      { q: "What is a step-up SIP?", a: "A SIP where the monthly instalment increases by a fixed percentage — say 10% — every year, usually to keep pace with a rising income. Because the larger instalments come later, they have less time to compound, which this calculator accounts for month by month." },
      { q: "Are SIP returns guaranteed?", a: "No. Mutual fund returns depend on the market and vary from year to year; they can be negative. This calculator assumes a constant rate purely to illustrate how regular investing and compounding work. Mutual fund investments are subject to market risks." },
      { q: "Why does my result differ from another SIP calculator?", a: "Calculators use different conventions: some divide the annual rate by 12, some use the effective monthly rate, and some assume you invest at the start of the month. Switch the rate convention and timing here to match the one you're comparing with." },
      { q: "What return should I assume?", a: "There's no right answer. Long-term returns of equity, hybrid and debt funds differ widely and past returns don't predict future ones. Try a conservative, a middle and an optimistic rate to see a range." },
      { q: "Are taxes or fund expenses included?", a: "No. The projection doesn't deduct capital-gains tax, exit loads or changes in expense ratio. Fund returns are usually reported after expenses, so use a return assumption that's already net of fees." },
    ],
    related: ["lumpsum-calculator", "rd-calculator", "cagr-calculator"],
    searchTerms: ["sip", "systematic investment plan", "mutual fund", "sip return", "step up sip", "investment", "returns", "maturity", "monthly investment", "wealth", "india", "lumpsum", "sip calculator"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "compound-interest-calculator",
    name: "Compound Interest Calculator",
    category: "calculators",
    icon: "growth",
    short: "Calculate compound interest with daily to yearly compounding, regular deposits and a simple-interest comparison.",
    intro:
      "Work out how savings or an investment grow with compound interest. Choose daily, monthly, quarterly, half-yearly or yearly compounding, add regular contributions, and compare the result with simple interest year by year.",
    what:
      "Compound interest is interest earned on both your original amount and the interest already added to it. ZSpace Tools' Compound Interest Calculator works out the future value of a lump sum and optional regular contributions at a nominal annual rate and any common compounding frequency, and shows how much more that earns than simple interest.",
    how:
      "The lump sum grows as A = P × (1 + r/m)^(m × t), where r is the annual rate, m the number of compounding periods a year and t the time in years — fractional years included. Each regular contribution is grown separately from the date it's paid to the end, so deposits made later earn less interest. The year-wise table recalculates the balance at every year end with the same formula.",
    seo: {
      title: "Compound Interest Calculator – Calculate Interest Online Free",
      description:
        "Calculate compound interest online with flexible compounding frequencies. See your investment growth, total interest earned and future value using our free calculator.",
      keyword: "compound interest calculator",
      secondary: ["compound interest formula", "investment growth calculator", "savings growth calculator", "daily compound interest", "simple vs compound interest"],
    },
    features: [
      { title: "Any compounding frequency", body: "Daily, monthly, quarterly, half-yearly or yearly, with the effective annual rate (APY) shown." },
      { title: "Regular contributions", body: "Add a monthly, quarterly or yearly deposit paid at the start or end of each period; each is grown from the date it's made." },
      { title: "Simple vs compound", body: "See the simple-interest result and exactly how much compounding adds, plus a chart of both over time." },
      { title: "Year-wise breakdown", body: "Starting balance, contributions, interest and ending balance for every year, including a final part-year — export as CSV." },
      { title: "Months or years", body: "Enter the duration in either; fractional years like 2.5 are handled exactly." },
      { title: "Multi-currency", body: "Show results in rupees, dollars, pounds, euros, dirhams and more." },
    ],
    steps: [
      { title: "Enter the amount and rate", body: "Your starting amount, the annual interest rate and how long you'll keep it." },
      { title: "Choose compounding", body: "Pick how often interest is added, and optionally a regular contribution." },
      { title: "Read the result", body: "See the final value, interest earned and the year-wise table, and copy or download it." },
    ],
    specs: [
      { label: "Lump sum", value: "A = P × (1 + r/m)^(m·t)" },
      { label: "Compounding", value: "Daily (365), monthly, quarterly, half-yearly, yearly" },
      { label: "Contributions", value: "Monthly, quarterly or yearly; start or end of period" },
      { label: "Ranges", value: "Rate −10% to 100%; up to 100 years" },
      { label: "Comparison", value: "Simple interest on the same deposits" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Everything is calculated in your browser. Amounts are never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Fixed deposit", body: "₹1,00,000 at 7% compounded quarterly for 5 years grows to about ₹1,41,478 — ₹41,478 of interest, versus ₹35,000 with simple interest." },
      { title: "Compounding frequency", body: "₹1,00,000 at 8% for 10 years: yearly compounding gives ₹2,15,892.50, monthly gives ₹2,21,964.02." },
      { title: "Monthly savings", body: "£200 a month at 4% compounded monthly for 10 years: £24,000 paid in grows to about £29,450." },
    ],
    faqs: [
      { q: "What is compound interest?", a: "Interest calculated on your original amount plus the interest already added. Each period's interest earns interest in later periods, so growth speeds up over time — unlike simple interest, which is only ever paid on the original amount." },
      { q: "How does compounding frequency affect returns?", a: "The more often interest is added, the more it earns on itself, so at the same nominal rate daily or monthly compounding gives slightly more than quarterly or yearly. The difference grows with the rate and the time period; the effective annual rate shows it as a single number." },
      { q: "What is the difference between simple and compound interest?", a: "Simple interest = principal × rate × time, paid on the original amount only. Compound interest adds interest to the balance each period, so later interest is calculated on a larger amount. Over 10 years at 8%, ₹1,00,000 earns ₹80,000 simple but ₹1,15,892 compounded yearly." },
      { q: "What is the compound interest formula?", a: "A = P × (1 + r/m)^(m × t), where P is the principal, r the annual rate as a decimal, m the compounding periods per year and t the number of years. Compound interest is A − P." },
      { q: "How are regular contributions handled?", a: "Each deposit is grown from the date it's paid to the end of the period, at the same compounding rate. When deposits are more frequent than compounding, the equivalent fractional-period rate is used; some banks pay simple interest between compounding dates instead, which gives slightly less." },
      { q: "Is tax on interest included?", a: "No. Interest from deposits is usually taxable (in India, for example, it's added to your income and may have TDS deducted). Reduce the rate to an after-tax figure if you want a post-tax estimate." },
    ],
    related: ["fd-calculator", "lumpsum-calculator", "sip-calculator"],
    searchTerms: ["compound interest", "interest", "ci", "savings", "investment growth", "future value", "apy", "compounding", "simple interest", "daily compounding"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    category: "health",
    alsoIn: ["calculators"],
    icon: "heart",
    short: "Calculate adult BMI from height and weight in metric or imperial units, with your healthy-weight range.",
    intro:
      "Check your body mass index from your height and weight — in centimetres and kilograms or feet, inches and pounds. See your adult BMI category, where you sit on the scale and the healthy-weight range for your height.",
    what:
      "Body mass index (BMI) is your weight in kilograms divided by the square of your height in metres. It's a quick screening measure used to put adults into broad weight categories. ZSpace Tools' BMI Calculator works it out from metric or imperial measurements and shows the standard adult category and the weight range that corresponds to a healthy BMI for your height.",
    how:
      "BMI = weight (kg) ÷ height (m)². Imperial measurements are converted exactly (1 inch = 2.54 cm, 1 lb = 0.45359237 kg). The result is shown to one decimal place, and the category is taken from that shown value so the number and label always agree: under 18.5 underweight, 18.5–24.9 healthy weight, 25–29.9 overweight, 30 or more obesity. The healthy-weight range is the weight that gives a BMI of 18.5 to 24.9 at your height.",
    seo: {
      title: "BMI Calculator – Check Your Body Mass Index Online",
      description:
        "Calculate your BMI using your height and weight. Check your body mass index, understand BMI categories and view your healthy-weight range with our free calculator.",
      keyword: "BMI calculator",
      secondary: ["body mass index calculator", "BMI by height and weight", "BMI calculator kg cm", "BMI calculator feet inches", "healthy weight range", "adult BMI categories"],
    },
    features: [
      { title: "Metric or imperial", body: "Centimetres and kilograms, or feet, inches and pounds — switching converts what you've already entered." },
      { title: "Clear category", body: "Your BMI and adult category with a labelled scale — shown with text as well as colour." },
      { title: "Healthy-weight range", body: "The weight range that corresponds to a BMI of 18.5–24.9 for your height." },
      { title: "Neutral explanations", body: "Plain-language context for each result, without judgement and without diagnosis." },
      { title: "Copy or download", body: "Save a short summary of your result as text." },
      { title: "Private", body: "Your measurements never leave your device." },
    ],
    steps: [
      { title: "Choose units", body: "Metric (cm, kg) or imperial (ft, in, lb)." },
      { title: "Enter height and weight", body: "The result updates as you type." },
      { title: "Read the result", body: "See your BMI, category and healthy-weight range, and copy or download it." },
    ],
    specs: [
      { label: "Formula", value: "kg ÷ m²" },
      { label: "Conversions", value: "1 in = 2.54 cm · 1 lb = 0.45359237 kg (exact)" },
      { label: "Categories", value: "< 18.5 · 18.5–24.9 · 25–29.9 · ≥ 30 (adult, WHO/CDC)" },
      { label: "Precision", value: "Shown to 0.1; category from the shown value" },
      { label: "Accepted range", value: "100–250 cm, 20–400 kg" },
      { label: "For", value: "Adults 18+ (not children, teens or pregnancy)" },
    ],
    formats: ["cm", "kg", "ft", "in", "lb"],
    privacy: "Your height and weight are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Metric", body: "175 cm and 70 kg: 70 ÷ 1.75² = 22.9 — healthy weight. The healthy range at 175 cm is about 56.7–76.3 kg." },
      { title: "Imperial", body: "5 ft 9 in and 160 lb: about 23.6 — healthy weight." },
      { title: "On a boundary", body: "A BMI of 24.96 is shown as 25.0 and labelled Overweight, so the number and the category always match." },
    ],
    faqs: [
      { q: "How is BMI calculated?", a: "Divide your weight in kilograms by your height in metres squared. For 70 kg and 1.75 m: 70 ÷ (1.75 × 1.75) = 22.9. With pounds and inches, the measurements are converted to kilograms and metres first." },
      { q: "What are the adult BMI categories?", a: "Below 18.5 is underweight, 18.5 to 24.9 is healthy weight, 25 to 29.9 is overweight and 30 or above is obesity. These are the standard adult cut-offs used by the WHO and CDC." },
      { q: "Is BMI a complete measure of health?", a: "No. BMI doesn't measure body fat directly, can't tell muscle from fat, and says nothing about fitness, diet, blood pressure or other risk factors. Muscular people may have a high BMI without excess fat. It's a screening tool — a healthcare professional can give a fuller picture." },
      { q: "Can children and teenagers use this calculator?", a: "No. Under-18s need BMI-for-age percentiles that account for age and sex, which this tool doesn't calculate. The adult categories shouldn't be applied to children or teenagers." },
      { q: "Do the categories differ for South Asian adults?", a: "Some health bodies use lower cut-offs for Asian populations because health risks can rise at a lower BMI — for example, Indian guidelines use 23 as the start of overweight. This calculator shows the standard international categories; ask a doctor which applies to you." },
      { q: "Why is my healthy-weight range so wide?", a: "It covers every weight that gives a BMI between 18.5 and 24.9 at your height. Where you sit within it depends on build, muscle and other factors BMI doesn't capture." },
    ],
    related: ["unit-converter", "age-calculator", "percentage-calculator"],
    searchTerms: ["bmi", "body mass index", "weight", "height", "healthy weight", "obesity", "overweight", "underweight", "kg", "lbs", "feet", "health", "fitness"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "gpa-cgpa-calculator",
    name: "GPA & CGPA Calculator",
    category: "education",
    alsoIn: ["calculators"],
    icon: "graduation",
    short: "Calculate semester GPA and overall CGPA on 10-point, 4.0, 5.0 or custom grading scales.",
    intro:
      "Calculate your semester GPA from subject grades and credits, combine semesters into a credit-weighted CGPA, and convert to a percentage using your institution's formula — on a 10-point, 4.0, 5.0 or custom scale.",
    what:
      "GPA (grade point average) is the credit-weighted average of your grade points for one term; CGPA (cumulative GPA) combines all your terms. ZSpace Tools' GPA & CGPA Calculator works out both using the grading scale you choose or define, explains how repeated or ungraded subjects are treated, and only converts to a percentage with a formula you select.",
    how:
      "Semester GPA = Σ(grade points × credits) ÷ Σ credits. CGPA = Σ(semester GPA × semester credits) ÷ Σ credits — a plain average of semester GPAs is only used if you explicitly choose equal weighting. Subjects without a grade or credits are listed and left out rather than counted as zero. Percentage conversion uses (GPA − offset) × multiplier with the formula you pick, shown before the result.",
    seo: {
      title: "GPA & CGPA Calculator – Calculate Your Grades Online Free",
      description:
        "Calculate your GPA and CGPA online using subject grades and credit hours. Add multiple semesters, customise grading scales and calculate your academic performance for free.",
      keyword: "CGPA calculator",
      secondary: ["GPA calculator", "semester GPA calculator", "grade point calculator", "CGPA to percentage", "10 point CGPA calculator", "credit weighted GPA"],
    },
    features: [
      { title: "Semester GPA", body: "Add subjects with a letter grade (or grade points) and credits; optional marks give a weighted average mark too." },
      { title: "Credit-weighted CGPA", body: "Add, duplicate and remove semesters; CGPA is weighted by credits, not a simple average." },
      { title: "Any grading scale", body: "10-point (O, A+ … as in the UGC CBCS model), 4.0, 5.0, or your own letters and points." },
      { title: "Repeated subjects", body: "Choose whether every attempt counts, or only the latest or best — and see which attempts were left out." },
      { title: "Percentage, honestly", body: "Pick the formula your institution uses or enter your own; the formula is always shown with the result." },
      { title: "Export", body: "Copy the result or download a CSV and a text summary." },
    ],
    steps: [
      { title: "Pick your grading scale", body: "10-point, 4.0, 5.0 or custom — edit letters and points to match your institution." },
      { title: "Enter subjects or semesters", body: "Grades and credits for a semester GPA, or each semester's GPA and credits for CGPA." },
      { title: "Read and export", body: "See GPA or CGPA, credits and grade distribution; convert to % with your institution's formula if needed." },
    ],
    specs: [
      { label: "GPA", value: "Σ(points × credits) ÷ Σ credits" },
      { label: "CGPA", value: "Σ(GPA × credits) ÷ Σ credits (equal weights only if chosen)" },
      { label: "Scales", value: "10-point, 4.0, 5.0, custom" },
      { label: "Repeated subjects", value: "All attempts, latest only or best only" },
      { label: "Percentage", value: "(GPA − offset) × multiplier, user-selected" },
      { label: "Exports", value: "CSV, text summary" },
    ],
    formats: ["10-point", "4.0", "5.0", "Custom", "CSV"],
    privacy: "Your grades are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "One semester (10-point)", body: "A+ in a 4-credit subject, A in a 3-credit subject and O in a 2-credit lab: (9×4 + 8×3 + 10×2) ÷ 9 = 8.89." },
      { title: "CGPA with unequal credits", body: "Semester 1: 6.0 over 10 credits; semester 2: 9.0 over 30 credits. CGPA = (60 + 270) ÷ 40 = 8.25 — not 7.5." },
      { title: "4.0 scale", body: "A− (3.7) in a 3-credit course, B+ (3.3) in a 4-credit course and A (4.0) in a 1-credit course: 28.3 ÷ 8 = 3.54." },
    ],
    faqs: [
      { q: "How is GPA calculated?", a: "Multiply each subject's grade points by its credits, add those up, and divide by the total credits. A 4-credit A (8 points) and a 2-credit B (6 points) give (32 + 12) ÷ 6 = 7.33 on a 10-point scale." },
      { q: "What is the difference between GPA and CGPA?", a: "GPA usually refers to one semester or term. CGPA (cumulative GPA) combines every semester so far, weighted by each semester's credits." },
      { q: "Should I average my semester GPAs to get CGPA?", a: "Only if every semester has the same total credits. Otherwise weight each semester GPA by its credits, as this calculator does — a simple average over- or under-weights short semesters." },
      { q: "Is CGPA conversion to percentage universal?", a: "No. Universities and boards use different formulas — for example CGPA × 9.5, CGPA × 10 or (CGPA − 0.75) × 10 — and some have their own tables. Use the formula printed on your marksheet or required by the organisation you're applying to." },
      { q: "How are failed or repeated subjects handled?", a: "A failed grade (usually 0 points) counts with its credits unless your institution says otherwise. If you enter the same subject twice you can count every attempt, only the latest, or only the best — policies differ, so check yours." },
      { q: "What about subjects with zero credits?", a: "Zero-credit (audit or non-credit) subjects don't change a credit-weighted GPA, so they're effectively ignored. If every subject has zero credits, a GPA can't be calculated." },
    ],
    related: ["percentage-calculator", "word-counter", "age-calculator"],
    searchTerms: ["gpa", "cgpa", "sgpa", "grade point", "grades", "semester", "credits", "college", "university", "cgpa to percentage", "gpa calculator", "student", "marks", "4.0", "10 point"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "tip-calculator",
    name: "Tip & Bill Split Calculator",
    category: "lifestyle",
    alsoIn: ["calculators"],
    icon: "tip",
    short: "Work out the tip and split a restaurant bill between friends — with tax, rounding and the remainder handled.",
    intro:
      "Calculate a tip and split the bill between any number of people. Choose a tip percentage, add tax, decide whether to tip before or after tax, and round each share — the amounts always add up to the bill.",
    what:
      "A tip calculator works out the tip on a bill and how much each person owes when you split it. ZSpace Tools' Tip & Bill Split Calculator handles tax added on top or already included, tipping on the pre-tax or post-tax amount, any number of people, and rounding — and shows exactly who pays what so nothing is lost to rounding.",
    how:
      "All amounts are worked in whole cents or paise, so totals reconcile exactly. Tax is added on top (bill × rate), taken from inside a tax-inclusive bill (bill × rate ÷ (100 + rate)) or entered as an amount. The tip is the chosen percentage of the pre-tax or post-tax amount, rounded half up. An exact split gives some people one cent more so shares add up to the total; rounding up shows the extra collected; rounding to the nearest unit lets one person pay the exact remainder.",
    seo: {
      title: "Tip Calculator – Calculate Tips & Split Restaurant Bills",
      description:
        "Calculate restaurant tips and split bills between friends. Choose your tip percentage, divide the total and find out how much each person should pay.",
      keyword: "tip calculator",
      secondary: ["bill splitting calculator", "restaurant tip calculator", "split the bill calculator", "tip and split calculator", "how much to tip"],
    },
    features: [
      { title: "Quick tip buttons", body: "5, 10, 12, 15, 18, 20 and 25% in one tap, or any custom percentage." },
      { title: "Tax done right", body: "Tax added on top or already included in the bill, as a rate or a fixed amount." },
      { title: "Before or after tax", body: "Choose whether the tip is calculated on the amount before tax or after it." },
      { title: "Splits that add up", body: "Exact, rounded up or rounded to the nearest whole unit — the remainder is always shown, never lost." },
      { title: "Any currency", body: "Rupees, dollars, pounds, euros, dirhams, Singapore, Australian and Canadian dollars." },
      { title: "Share the result", body: "Copy a summary or share it straight to your group chat." },
    ],
    steps: [
      { title: "Enter the bill", body: "Type the bill amount and pick your currency." },
      { title: "Choose tip and people", body: "Tap a tip percentage and set how many people are paying; add tax if needed." },
      { title: "Split", body: "See what each person pays and share the summary." },
    ],
    specs: [
      { label: "Tip", value: "0–100%; presets 5–25%" },
      { label: "Tax", value: "None, % added, % included, fixed amount" },
      { label: "Tip base", value: "Before tax or after tax" },
      { label: "Rounding", value: "Exact (to the cent), round up, nearest whole unit" },
      { label: "People", value: "1–200" },
      { label: "Arithmetic", value: "Integer minor units (no floating-point drift)" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Bill amounts are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Dinner for four", body: "₹2,840 with a 10% tip is ₹3,124 in total — ₹781 each." },
      { title: "US restaurant", body: "$84.50 before tax, 8.875% sales tax and an 18% tip on the pre-tax amount: tax $7.50, tip $15.21, total $107.21 — split three ways, two people pay $35.74 and one pays $35.73." },
      { title: "Round numbers", body: "$100 split three ways rounded to the nearest dollar: two people pay $33 and one pays $34, so the total is exactly $100." },
    ],
    faqs: [
      { q: "How much should I tip?", a: "It depends on the country and the venue. In the US 15–20% is common at sit-down restaurants; in the UK and much of Europe 10–12.5% is typical and a service charge is often already on the bill; in India, Japan and many other places tipping is smaller or optional. Check whether service is already included first." },
      { q: "How do I split a restaurant bill?", a: "Add the tip (and tax, if it isn't already included) to get the total, then divide by the number of people. When it doesn't divide evenly, some people pay one cent or paisa more — or round to whole amounts and let one person cover the remainder, as this calculator shows." },
      { q: "Should tips be calculated before or after tax?", a: "Many etiquette guides suggest tipping on the pre-tax amount, since tax isn't part of the service, but plenty of people tip on the total. Both are offered here, and the result shows which base was used." },
      { q: "What if the bill already includes tax?", a: "Turn on “The bill already includes tax”. The tax is then worked out from inside the bill (bill × rate ÷ (100 + rate)) instead of being added again." },
      { q: "Why doesn't everyone pay exactly the same?", a: "A total like ₹100 can't be split into three equal amounts of whole paise. Rather than lose or invent the difference, one person pays one paisa more, so the shares add up to the bill exactly." },
      { q: "What does rounding up do?", a: "Everyone pays the next whole unit (₹34 instead of ₹33.34). The extra collected is shown and could go towards the tip." },
    ],
    related: ["percentage-calculator", "discount-calculator", "gst-calculator"],
    searchTerms: ["tip", "tips", "gratuity", "split bill", "bill split", "restaurant", "dinner", "split", "share bill", "service charge", "per person", "divide bill"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "fd-calculator",
    name: "FD Calculator",
    category: "calculators",
    icon: "piggy",
    short: "Estimate fixed deposit maturity and interest — cumulative or monthly/quarterly payout, with senior-citizen rates.",
    intro:
      "Work out what your fixed deposit will be worth at maturity and how much interest it earns. Choose reinvested (cumulative) or paid-out interest, the compounding or payout frequency, and add a senior-citizen rate if it applies.",
    what:
      "A fixed deposit (FD) locks an amount with a bank or NBFC for a set tenure at a fixed interest rate. ZSpace Tools' FD Calculator estimates the maturity amount and interest for a cumulative FD, where interest is reinvested and compounds, or the regular interest payouts for a non-cumulative FD, where interest is paid to you monthly, quarterly, half-yearly or yearly.",
    how:
      "For a cumulative FD the maturity amount is A = P × (1 + r/m)^(m × t), where P is the deposit, r the annual rate, m the compounding periods a year (quarterly = 4) and t the tenure in years. For a non-cumulative FD interest isn't reinvested, so each payout is P × r ÷ f for payout frequency f, and a final part-period is paid pro rata. Full precision is used throughout and values are rounded only for display.",
    seo: {
      title: "FD Calculator – Fixed Deposit Interest & Maturity Calculator",
      description:
        "Calculate fixed deposit maturity and interest online. Cumulative or monthly and quarterly payout FDs, compounding options, senior-citizen rates and a year-wise table.",
      keyword: "FD calculator",
      secondary: ["fixed deposit calculator", "FD interest calculator", "FD maturity calculator", "fixed deposit interest calculation", "senior citizen FD calculator"],
    },
    features: [
      { title: "Cumulative or payout", body: "Interest reinvested to maturity, or paid out monthly, quarterly, half-yearly or yearly — each calculated the right way." },
      { title: "Compounding choices", body: "Monthly, quarterly (most Indian banks), half-yearly or yearly, with the effective annual yield shown." },
      { title: "Days, months or years", body: "Short deposits from 7 days up to 30-year tenures, including fractional years." },
      { title: "Senior-citizen rate", body: "Add the extra rate your bank offers people aged 60 and above." },
      { title: "Optional tax estimate", body: "Off by default. Turn it on and enter a rate to see a rough estimate of tax on the interest." },
      { title: "Year-wise table and exports", body: "See the balance or payouts each year, copy the result, print a summary or download CSV." },
    ],
    steps: [
      { title: "Enter the deposit", body: "Amount, the bank's interest rate and the tenure." },
      { title: "Choose how interest works", body: "Reinvested (cumulative) with a compounding frequency, or paid out with a payout frequency." },
      { title: "Read the result", body: "See the maturity amount or payout, interest earned and the year-wise table." },
    ],
    specs: [
      { label: "Cumulative", value: "A = P × (1 + r/m)^(m·t)" },
      { label: "Payout", value: "P × r ÷ f per period; part-period pro rata" },
      { label: "Frequencies", value: "Monthly, quarterly, half-yearly, yearly" },
      { label: "Tenure", value: "7 days to 30 years (days ÷ 365)" },
      { label: "Rate", value: "0–30%, plus optional senior-citizen extra" },
      { label: "Exports", value: "Copy, print summary, CSV" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Your deposit details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 lakh for 5 years", body: "At 7% compounded quarterly, ₹1,00,000 grows to ₹1,41,477.82 — ₹41,477.82 of interest. The effective annual yield is 7.186%." },
      { title: "Senior citizen", body: "₹2,00,000 for 3 years at 6.8% + 0.5% senior-citizen extra (7.3%), quarterly: about ₹2,48,475." },
      { title: "Monthly income", body: "₹10,00,000 at 7.25% with monthly payout pays about ₹6,042 a month — ₹2,17,500 over 3 years, with the ₹10 lakh returned at maturity." },
    ],
    guide: {
      inputs: [
        { title: "Deposit amount", body: "The amount you place in the FD once, at the start." },
        { title: "Interest rate", body: "The annual rate your bank quotes for this tenure. Rates usually differ by tenure and for senior citizens." },
        { title: "Tenure", body: "How long the money stays deposited. Days are converted with a 365-day year." },
        { title: "Cumulative vs payout", body: "Cumulative reinvests interest so it compounds and is paid at maturity. Payout (non-cumulative) sends interest to your account regularly and returns the deposit at the end." },
        { title: "Compounding / payout frequency", body: "How often interest is added to the deposit (cumulative) or paid to you (payout). Quarterly is the norm at most Indian banks." },
      ],
      interpret: [
        "Maturity amount is what you receive at the end of a cumulative FD: your deposit plus all compounded interest.",
        "For a payout FD, the headline figure is each payout; the total received adds every payout to the deposit returned at maturity.",
        "Effective annual yield turns quarterly or monthly compounding into one yearly figure, so you can compare FDs with different compounding.",
        "A payout FD earns less in total than a cumulative FD at the same rate because paid-out interest stops earning interest.",
      ],
      useCases: ["Comparing FD rates across banks and tenures", "Planning a monthly income from savings in retirement", "Checking a bank's maturity figure", "Deciding between cumulative and payout options"],
      limitations: [
        "Banks differ in day-count rules, how they handle part-periods and short tenures, and monthly-payout discounting, so figures may differ by a few rupees.",
        "Premature withdrawal penalties and changes in rate aren't included.",
        "Interest is taxable in most countries; tax and TDS are only estimated if you turn it on, and the estimate ignores thresholds and Form 15G/15H.",
      ],
    },
    faqs: [
      { q: "How is FD interest calculated?", a: "For a cumulative FD, maturity = P × (1 + r/m)^(m × t). For ₹1,00,000 at 7% compounded quarterly for 5 years: 1,00,000 × (1 + 0.07/4)^20 = ₹1,41,477.82, so interest is ₹41,477.82." },
      { q: "What is the difference between cumulative and non-cumulative FDs?", a: "A cumulative FD reinvests interest, so it compounds and you get everything at maturity. A non-cumulative FD pays interest out monthly, quarterly, half-yearly or yearly; you get regular income but less total interest because paid-out interest doesn't compound." },
      { q: "Do all banks calculate FD interest the same way?", a: "No. Most Indian banks compound quarterly, but day-count conventions, treatment of short and broken periods and monthly-payout discounting vary. Use this as an estimate and check the bank's own figure." },
      { q: "Is FD interest taxable?", a: "In India FD interest is added to your income and taxed at your slab rate, and banks may deduct TDS above a yearly threshold unless you submit Form 15G/15H. Other countries have their own rules. This calculator only estimates tax if you turn that option on." },
      { q: "What rate do senior citizens get?", a: "Many Indian banks offer people aged 60 and above an extra 0.25% to 0.50% a year, sometimes more on specific schemes. Turn on the senior-citizen option and enter your bank's extra rate." },
      { q: "Can I use this for a bank CD or term deposit outside India?", a: "Yes. Choose your currency and the compounding your bank uses — for example monthly compounding for many US certificates of deposit." },
    ],
    related: ["rd-calculator", "compound-interest-calculator", "ppf-calculator"],
    searchTerms: ["fd", "fixed deposit", "fd interest", "fd maturity", "term deposit", "cd", "certificate of deposit", "bank deposit", "senior citizen fd", "cumulative", "non cumulative", "interest payout"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "rd-calculator",
    name: "RD Calculator",
    category: "calculators",
    icon: "recurring",
    short: "Estimate recurring deposit maturity from a fixed monthly deposit, with quarterly compounding and a month-by-month schedule.",
    intro:
      "See what your recurring deposit will be worth at maturity. Enter the monthly deposit, interest rate and tenure to get the total deposited, interest earned and maturity value — with the quarterly compounding Indian banks use and a full schedule.",
    what:
      "A recurring deposit (RD) lets you save a fixed amount every month for a set tenure, earning a fixed interest rate. ZSpace Tools' RD Calculator estimates the maturity value by following each monthly instalment and crediting interest the way banks do, and can compare the result with putting the same total into an FD upfront.",
    how:
      "By default the calculator goes month by month: each instalment is added (at the start of the month unless you choose otherwise), interest accrues at the annual rate ÷ 12 on the balance, and the accrued interest is credited and compounded every quarter. A monthly-compounding approximation, FV = PMT × ((1 + i)^n − 1) ÷ i, is also available and clearly labelled.",
    seo: {
      title: "RD Calculator – Recurring Deposit Maturity & Interest Calculator",
      description:
        "Calculate recurring deposit maturity and interest online. Monthly deposits, quarterly compounding as banks use, a month-by-month schedule and an FD comparison.",
      keyword: "RD calculator",
      secondary: ["recurring deposit calculator", "RD maturity calculator", "RD interest calculator", "monthly deposit calculator", "post office RD calculator"],
    },
    features: [
      { title: "Quarterly compounding", body: "Interest accrues monthly and is compounded every quarter, the convention Indian banks quote for RDs." },
      { title: "Month-by-month schedule", body: "Every instalment, every quarterly interest credit and the running balance — switch between yearly and monthly views." },
      { title: "Deposit timing", body: "Pay at the start of the month (as most banks require) or the end." },
      { title: "Effective yield", body: "The annual return your deposits actually earn, allowing for when each one was made." },
      { title: "Compare with an FD", body: "See what the same total would earn as an FD paid upfront — with the cash-flow difference explained." },
      { title: "Exports", body: "Copy the result, print a summary or download the full schedule as CSV." },
    ],
    steps: [
      { title: "Enter your RD", body: "Monthly deposit, interest rate and tenure in months or years." },
      { title: "Check the convention", body: "Keep quarterly compounding for a bank RD, or choose the monthly approximation." },
      { title: "Read and export", body: "See maturity, interest and the schedule; optionally compare with an FD." },
    ],
    specs: [
      { label: "Default", value: "Monthly accrual at r/12, credited quarterly" },
      { label: "Approximation", value: "FV = PMT × ((1 + i)^n − 1) ÷ i, i = r/12" },
      { label: "Timing", value: "Start (default) or end of each month" },
      { label: "Tenure", value: "1 month to 50 years (rounded to whole instalments)" },
      { label: "Rate", value: "0–30% a year" },
      { label: "Exports", value: "Copy, print summary, CSV schedule" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Your deposit details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹5,000 a month for a year", body: "At 7% with quarterly compounding, 12 instalments (₹60,000) grow to about ₹62,312 — ₹2,312 of interest." },
      { title: "Five-year RD", body: "₹5,000 a month for 5 years at 7%: ₹3,00,000 deposited, about ₹3,59,672 at maturity — an effective yield of about 7.19% a year on the money deposited." },
      { title: "RD vs FD", body: "The same ₹3,00,000 deposited upfront as a 5-year FD at 7% would grow to about ₹4,24,433 — more, because all of it is invested from the first day." },
    ],
    guide: {
      inputs: [
        { title: "Monthly deposit", body: "The fixed amount you pay into the RD every month." },
        { title: "Interest rate", body: "The annual rate the bank or post office quotes for the RD tenure." },
        { title: "Tenure", body: "How many monthly instalments you'll make. Years are converted to months." },
        { title: "Compounding", body: "Quarterly follows how Indian banks credit RD interest. Monthly is a simpler approximation that gives a slightly higher figure." },
        { title: "Instalment timing", body: "Most banks expect the instalment early in the month, so each one earns interest for that month." },
      ],
      interpret: [
        "Total deposited is simply the monthly amount × the number of instalments.",
        "Interest is everything above that; it's smaller than an FD of the same total because early instalments have more time to grow than later ones.",
        "The effective yield shows the annual return on your deposits allowing for their timing — close to, and slightly above, the quoted rate because of compounding.",
      ],
      useCases: ["Building a habit of saving a fixed amount monthly", "Saving towards a known goal date — fees, a trip, a down payment", "Comparing bank and post-office RD rates", "Checking a bank's RD maturity figure"],
      limitations: [
        "Banks differ in day counts, when an instalment is treated as received and how the last part-quarter is handled, so results may differ by a few rupees.",
        "Penalties for missed instalments and premature closure aren't included.",
        "RD interest is taxable in India (and TDS may apply); tax isn't deducted here.",
      ],
    },
    faqs: [
      { q: "How is RD maturity calculated?", a: "Each monthly instalment earns interest from the month it's paid until maturity. Banks accrue interest monthly and compound it every quarter; this calculator follows that month by month, crediting interest at each quarter end and at maturity." },
      { q: "Why is RD interest lower than FD interest for the same total?", a: "In an FD the whole amount earns interest from day one. In an RD you pay in gradually, so later instalments are invested for only a short time. At the same rate the RD therefore earns less in total — it isn't a worse rate." },
      { q: "Do banks compound RD interest monthly or quarterly?", a: "Most Indian banks and the post office quote RDs with quarterly compounding. The monthly option here is an approximation and gives a slightly higher figure." },
      { q: "What happens if I miss an instalment?", a: "Banks usually charge a small penalty and may close the RD after several missed payments. Penalties aren't included in this calculator." },
      { q: "Is RD interest taxable?", a: "Yes, in India RD interest is taxable at your slab rate and TDS may apply above the threshold. Tax isn't deducted in this estimate." },
    ],
    related: ["fd-calculator", "sip-calculator", "compound-interest-calculator"],
    searchTerms: ["rd", "recurring deposit", "rd interest", "rd maturity", "monthly deposit", "post office rd", "monthly savings", "bank rd", "savings scheme"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "lumpsum-calculator",
    name: "Lumpsum Calculator",
    category: "calculators",
    icon: "coins",
    short: "Project how a one-time investment could grow, with inflation-adjusted value and a two-scenario comparison.",
    intro:
      "Estimate how a single, one-time investment could grow. Enter the amount, an expected annual return and how many years you'll stay invested to see the future value and gain — in today's money too, if you add inflation.",
    what:
      "A lumpsum investment puts all your money in at once, for example into a mutual fund, instead of investing monthly. ZSpace Tools' Lumpsum Calculator projects its future value at a constant assumed return, shows the gain and total return, converts the result into today's purchasing power, and compares two scenarios side by side.",
    how:
      "The projection uses FV = P × (1 + r/m)^(m × t), which with yearly compounding is P × (1 + r)^t. Gain = FV − P and total return = (FV − P) ÷ P × 100. With inflation switched on, the value in today's money is FV ÷ (1 + inflation)^t. Scenario B always uses the same duration and compounding as scenario A, so the comparison is fair.",
    seo: {
      title: "Lumpsum Calculator – One-Time Investment Return Calculator",
      description:
        "Calculate the future value of a lumpsum investment online. See estimated gain, total return and inflation-adjusted value, and compare two one-time investment scenarios.",
      keyword: "lumpsum calculator",
      secondary: ["lumpsum investment calculator", "mutual fund lumpsum calculator", "one-time investment calculator", "lumpsum return calculator", "future value calculator"],
    },
    features: [
      { title: "Future value and gain", body: "The estimated value, gain and total return for a single investment over any period, including fractions of a year." },
      { title: "Inflation-adjusted value", body: "See what the future amount would be worth in today's money, and the real annual growth after inflation." },
      { title: "Compare two scenarios", body: "Different amount or return over the same period — with the absolute and percentage difference." },
      { title: "Compounding options", body: "Yearly (how fund returns are usually quoted), half-yearly, quarterly or monthly." },
      { title: "Year-wise projection", body: "A growth chart and table you can download as CSV." },
      { title: "Clearly an estimate", body: "Every result is labelled as an illustration at a constant assumed return." },
    ],
    steps: [
      { title: "Enter the investment", body: "The one-time amount, an expected annual return and the number of years." },
      { title: "Add context", body: "Optionally adjust for inflation or compare a second scenario." },
      { title: "Read and export", body: "Check the future value and year-wise table, then copy, print or download." },
    ],
    specs: [
      { label: "Formula", value: "FV = P × (1 + r/m)^(m·t)" },
      { label: "Inflation-adjusted", value: "FV ÷ (1 + inflation)^t" },
      { label: "Compounding", value: "Yearly, half-yearly, quarterly, monthly" },
      { label: "Ranges", value: "Return −50% to 100%; up to 60 years" },
      { label: "Comparison", value: "Two scenarios, same duration and compounding" },
      { label: "Exports", value: "Copy, print summary, CSV" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Amounts and assumptions stay in your browser. Nothing is uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 lakh for 10 years", body: "At an assumed 12% a year, ₹1,00,000 is estimated at ₹3,10,585 — a total return of 210.58%." },
      { title: "In today's money", body: "With 6% inflation, that ₹3,10,585 would buy about what ₹1,73,429 buys today." },
      { title: "Two scenarios", body: "₹1,00,000 at 12% vs 8% for 10 years: about ₹3,10,585 vs ₹2,15,892 — the higher-return scenario ends about 44% higher." },
    ],
    guide: {
      inputs: [
        { title: "Investment amount", body: "The single amount you invest at the start. Nothing is added later — for monthly investing use the SIP calculator." },
        { title: "Expected return", body: "The annual return you want to assume. For mutual funds this is usually compared with the fund's CAGR, but past returns don't predict future ones." },
        { title: "Investment period", body: "How many years the money stays invested. Fractions like 7.5 are fine." },
        { title: "Compounding", body: "How often returns are added. Yearly matches how fund returns are quoted." },
        { title: "Inflation", body: "The yearly rise in prices you expect. It converts the future value into today's purchasing power." },
      ],
      interpret: [
        "Future value is the projected amount at the end, before any tax.",
        "Total return is the whole gain as a percentage of what you invested — not a yearly figure.",
        "Value in today's money tells you roughly what the future amount could buy at today's prices; if the return is below inflation, purchasing power falls even though the number grows.",
      ],
      useCases: ["Investing a bonus, inheritance or sale proceeds", "Comparing a fund's assumed return with an FD", "Checking how long money needs to stay invested to reach a goal", "Seeing the effect of inflation on long-term savings"],
      limitations: [
        "Real investments don't grow at a constant rate; returns vary and can be negative.",
        "Taxes, fund expenses and exit loads aren't deducted.",
        "This is an illustration, not financial advice or a forecast.",
      ],
    },
    faqs: [
      { q: "How is lumpsum return calculated?", a: "Future value = P × (1 + r)^t with yearly compounding. ₹1,00,000 at 12% for 10 years: 1,00,000 × 1.12^10 = ₹3,10,585. The gain is ₹2,10,585." },
      { q: "Lumpsum or SIP — which is better?", a: "Neither is always better. A lumpsum is invested immediately, so it gains more if markets rise steadily; a SIP spreads purchases over time, which can reduce the impact of a badly timed entry. Use this and the SIP calculator to compare, but they assume constant returns." },
      { q: "What return should I assume?", a: "There's no correct number. Try a cautious, a middle and an optimistic rate. Long-term returns of equity, hybrid and debt funds differ widely, and past performance doesn't guarantee future results." },
      { q: "What does the inflation-adjusted value mean?", a: "It's the future value expressed in today's money: FV ÷ (1 + inflation)^years. It shows how much the amount could actually buy, which is what matters for goals." },
      { q: "Are taxes included?", a: "No. Capital-gains tax, fund expenses and exit loads aren't deducted. Fund returns are usually reported after expenses, so use a return assumption that is already net of them." },
    ],
    related: ["sip-calculator", "compound-interest-calculator", "cagr-calculator", "swp-calculator"],
    searchTerms: ["lumpsum", "lump sum", "one time investment", "mutual fund lumpsum", "future value", "investment return", "lumpsum return", "inflation adjusted", "growth"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "roi-calculator",
    name: "ROI Calculator",
    category: "calculators",
    alsoIn: ["business"],
    icon: "target",
    short: "Calculate return on investment for investments, campaigns and projects — with annualised ROI and up to three comparisons.",
    intro:
      "Calculate the return on an investment, marketing campaign, website, piece of equipment or any project. Enter what it cost and what you got back — or the net profit — to see the net gain or loss, ROI percentage and, with a duration, annualised ROI.",
    what:
      "Return on investment (ROI) compares what you gained with what it cost: ROI = net gain ÷ total cost × 100. ZSpace Tools' ROI Calculator handles additional expenses, asks clearly whether you're entering money received or net profit, annualises the result only when that's valid, and compares up to three projects.",
    how:
      "Total cost = initial investment + additional expenses. Net gain = amount received − total cost (or the net profit you enter). ROI = net gain ÷ total cost × 100. Annualised ROI = (amount received ÷ total cost)^(1/years) − 1, shown only when you give a duration and confirm that no money was added or withdrawn in between; otherwise a cash-flow method such as XIRR is needed.",
    seo: {
      title: "ROI Calculator – Return on Investment Calculator Online",
      description:
        "Calculate ROI online for investments, marketing campaigns and business projects. Include extra costs, see net gain or loss, annualised ROI, and compare up to three projects.",
      keyword: "ROI calculator",
      secondary: ["return on investment calculator", "marketing ROI calculator", "business ROI calculator", "advertising ROI calculator", "annualised ROI calculator", "investment ROI calculator"],
    },
    features: [
      { title: "Revenue or profit — made clear", body: "Choose whether you're entering the amount received or a net profit, so revenue is never mistaken for profit." },
      { title: "Every cost counted", body: "Add fees, maintenance, agency costs or taxes as additional expenses." },
      { title: "Gains and losses", body: "Positive, zero and negative ROI, labelled as profit, break-even or loss — not by colour alone." },
      { title: "Annualised ROI, when valid", body: "Turns ROI into a yearly rate for single-payment investments; explains when XIRR is needed instead." },
      { title: "Compare up to three", body: "Projects or campaigns side by side, with the highest ROI marked — and a reminder that it isn't automatically the best." },
      { title: "Business examples", body: "Marketing, website, advertising, equipment and project examples with illustrative numbers." },
    ],
    steps: [
      { title: "Enter the cost", body: "The initial investment, plus any additional expenses." },
      { title: "Enter the return", body: "The total amount received or final value — or switch to net profit." },
      { title: "Compare and export", body: "Optionally add a duration or more projects, then copy or print the result." },
    ],
    specs: [
      { label: "ROI", value: "Net gain ÷ total cost × 100" },
      { label: "Total cost", value: "Initial investment + additional expenses" },
      { label: "Annualised", value: "(Received ÷ cost)^(1/years) − 1, single cash flow only" },
      { label: "Duration", value: "Years + months (optional)" },
      { label: "Comparison", value: "Up to 3 projects" },
      { label: "Exports", value: "Copy, print summary" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Marketing campaign", body: "₹1,50,000 ad spend + ₹30,000 agency fee, ₹4,20,000 attributed revenue: net gain ₹2,40,000, ROI 133.33% (on revenue, before product costs)." },
      { title: "Equipment over 3 years", body: "₹6,00,000 machine + ₹40,000 installation, ₹9,10,000 of savings and resale: ROI 42.19%, about 12.45% a year annualised." },
      { title: "A loss", body: "₹2,00,000 invested, ₹1,50,000 back: net loss ₹50,000 and ROI −25%." },
    ],
    guide: {
      inputs: [
        { title: "Initial investment or cost", body: "What you put in at the start — purchase price, ad spend, development cost." },
        { title: "Amount received or final value", body: "Everything you got back: sale proceeds, attributed revenue, savings, or the asset's value now. This is not profit." },
        { title: "Net profit (alternative)", body: "If you already know the gain after all costs, enter it instead; ROI = profit ÷ cost. Use a minus sign for a loss." },
        { title: "Additional expenses", body: "Other costs of the investment: fees, maintenance, agency charges, shipping, taxes paid." },
        { title: "Duration", body: "Optional. Lets you annualise ROI, which is fairer when comparing investments held for different lengths of time." },
      ],
      interpret: [
        "ROI is the total gain or loss as a percentage of cost over the whole period — 50% means you gained half of what you put in.",
        "Annualised ROI spreads that over the years, so a 50% ROI over 5 years (about 8.4% a year) can be compared with one over 1 year.",
        "If you entered revenue as the amount received, the ROI is on revenue; subtract product costs too if you want profit ROI.",
      ],
      useCases: ["Measuring a marketing or advertising campaign", "Judging a website, software or equipment purchase", "Comparing business projects", "Checking the return on a property, gold or shares sold"],
      limitations: [
        "ROI ignores risk and, unless annualised, how long the money was tied up.",
        "Annualised ROI is only valid for one payment in and one payment out; for regular contributions or withdrawals use XIRR.",
        "Example figures are illustrative, not industry benchmarks.",
      ],
    },
    faqs: [
      { q: "How do you calculate ROI?", a: "ROI = (amount received − total cost) ÷ total cost × 100. If you spend ₹2,00,000 and get back ₹2,70,000, the gain is ₹70,000 and ROI is 35%." },
      { q: "What's the difference between ROI and annualised ROI?", a: "ROI is the total return over the whole period. Annualised ROI converts it into an equivalent yearly rate: (received ÷ cost)^(1/years) − 1. A 35% ROI over 3 years is about 10.5% a year." },
      { q: "Should I use revenue or profit?", a: "Either works if you're consistent. If you enter revenue as the amount received, make sure the cost includes everything it took to earn it — otherwise ROI is overstated. If you know net profit, choose that option instead." },
      { q: "Can ROI be negative?", a: "Yes. If you get back less than you spent, ROI is negative; −25% means you lost a quarter of the cost. A total loss is −100%." },
      { q: "What is a good ROI?", a: "It depends on risk, time and alternatives. Compare annualised ROI with what you could earn elsewhere at similar risk — for example a fixed deposit for low-risk money." },
      { q: "How is ROI different from CAGR?", a: "ROI measures the total gain relative to cost. CAGR is the steady yearly growth rate between a start and an end value. For a single investment held for several years, annualised ROI and CAGR are the same number." },
    ],
    related: ["cagr-calculator", "percentage-calculator", "lumpsum-calculator"],
    searchTerms: ["roi", "return on investment", "marketing roi", "ad roi", "roas", "business roi", "profit percentage", "investment return", "annualised roi", "project return", "campaign roi"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "cagr-calculator",
    name: "CAGR Calculator",
    category: "calculators",
    icon: "cagr",
    short: "Calculate compound annual growth rate between two values — or the end or start value from a CAGR.",
    intro:
      "Find the compound annual growth rate between a starting and an ending value, or work backwards: the ending value from a CAGR, or the starting value you'd need. Durations can be in years and months.",
    what:
      "CAGR (compound annual growth rate) is the steady yearly rate that takes a value from where it started to where it ended over a period. ZSpace Tools' CAGR Calculator works it out for investments, revenue, prices or any positive quantity, and can also solve for the ending or starting value — with a smooth year-wise growth path.",
    how:
      "CAGR = (Ending value ÷ Starting value)^(1 ÷ years) − 1. Rearranged, Ending value = Starting value × (1 + CAGR)^years and Starting value = Ending value ÷ (1 + CAGR)^years, with CAGR as a decimal. Duration is years + months ÷ 12. Both values must be positive.",
    seo: {
      title: "CAGR Calculator – Compound Annual Growth Rate Online",
      description:
        "Calculate CAGR between two values online, or find the ending or starting value from a growth rate. Years and months supported, with a growth chart and year-wise table.",
      keyword: "CAGR calculator",
      secondary: ["compound annual growth rate calculator", "CAGR formula calculator", "annualised return calculator", "investment CAGR calculator", "revenue CAGR calculator"],
    },
    features: [
      { title: "Three ways round", body: "Solve for CAGR, the ending value or the starting value." },
      { title: "Years and months", body: "Enter 6 years 6 months directly, or decimal years." },
      { title: "Growth and decline", body: "Positive, zero and negative CAGR, with the absolute gain or loss and total growth." },
      { title: "Smooth growth path", body: "A chart and table of the equivalent steady path, clearly labelled as an illustration." },
      { title: "Not just money", body: "Works for revenue, users, prices or any positive value." },
      { title: "Exports", body: "Copy, print a summary or download the projection as CSV." },
    ],
    steps: [
      { title: "Choose what to calculate", body: "CAGR, end value or start value." },
      { title: "Enter the values and duration", body: "Two of start, end and CAGR, plus years and months." },
      { title: "Read and export", body: "See CAGR, both values, gain and total growth, then copy or download." },
    ],
    specs: [
      { label: "CAGR", value: "(End ÷ Start)^(1/t) − 1" },
      { label: "End value", value: "Start × (1 + CAGR)^t" },
      { label: "Start value", value: "End ÷ (1 + CAGR)^t" },
      { label: "Duration", value: "Years + months ÷ 12, up to 200 years" },
      { label: "Values", value: "Must be greater than 0" },
      { label: "Exports", value: "Copy, print summary, CSV" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Values are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "An investment", body: "₹1,00,000 grew to ₹2,50,000 in 5 years: CAGR = 2.5^(1/5) − 1 = 20.11% a year, though total growth is 150%." },
      { title: "Years and months", body: "₹5,00,000 to ₹11,50,000 in 6 years 6 months: CAGR about 13.67% a year." },
      { title: "Working backwards", body: "To reach ₹10,00,000 in 10 years at 9% a year you'd need about ₹4,22,411 today." },
    ],
    guide: {
      inputs: [
        { title: "Starting value", body: "The value at the beginning — what you invested, or revenue in the first year." },
        { title: "Ending value", body: "The value at the end of the period. If it's lower than the start, CAGR is negative." },
        { title: "CAGR", body: "Used when solving for a value: the steady yearly growth rate to assume." },
        { title: "Duration", body: "The time between the two values, in years and months. Must be more than zero." },
      ],
      interpret: [
        "CAGR is a yearly rate. Total growth is the whole change over the period; CAGR spreads it into an equivalent steady rate per year.",
        "Two investments with the same total growth over different periods have different CAGRs — the shorter one grew faster.",
        "The growth path shows how the value would move at a perfectly steady rate; real values usually go up and down.",
      ],
      useCases: ["Comparing a fund's or stock's growth over different periods", "Measuring business revenue or user growth", "Setting a growth target and the starting amount it needs", "Checking the annual return on property or gold you bought and sold"],
      limitations: [
        "CAGR only looks at the first and last values; it says nothing about volatility in between.",
        "It doesn't account for money added or withdrawn along the way — use XIRR for that.",
        "Both values must be positive; CAGR isn't defined for zero or negative values.",
      ],
    },
    faqs: [
      { q: "What is CAGR?", a: "Compound annual growth rate: the constant yearly rate at which a value would have grown from its starting point to its ending point over the period, if it had grown smoothly." },
      { q: "How is CAGR calculated?", a: "CAGR = (Ending value ÷ Starting value)^(1 ÷ years) − 1. For ₹1,00,000 growing to ₹2,50,000 in 5 years: 2.5^(0.2) − 1 = 0.2011, or 20.11% a year." },
      { q: "What is the difference between CAGR and ROI?", a: "ROI is the total gain relative to cost (150% in the example above). CAGR turns growth into a yearly rate (20.11%). CAGR is better for comparing investments held for different lengths of time." },
      { q: "Can CAGR be negative?", a: "Yes. If the ending value is lower than the starting value, CAGR is negative — for example ₹500 falling to ₹400 over 3 years is about −7.17% a year." },
      { q: "Does CAGR work for SIPs or regular investments?", a: "No. CAGR assumes a single starting amount. With regular contributions or withdrawals, use XIRR, which accounts for the date of every cash flow." },
      { q: "Can I enter a period in months?", a: "Yes. Enter years and months separately — 6 years 6 months is treated as 6.5 years." },
    ],
    related: ["roi-calculator", "lumpsum-calculator", "sip-calculator", "xirr-calculator"],
    searchTerms: ["cagr", "compound annual growth rate", "annual growth", "annualised return", "growth rate", "revenue growth", "investment growth rate", "cagr formula", "xirr"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "xirr-calculator",
    name: "XIRR Calculator",
    category: "calculators",
    icon: "xirr",
    short: "Annualised return for investments with irregular dates and amounts — SIPs, top-ups and partial redemptions.",
    intro:
      "Find the true annual return on investments made on different dates and in different amounts. Enter each investment and withdrawal — or paste them from a spreadsheet — and get the XIRR, the same figure Excel and fund statements use.",
    what:
      "XIRR (extended internal rate of return) is the single annual rate that makes all your dated cash flows balance out. ZSpace Tools' XIRR Calculator works it out from a list of investments and withdrawals with their dates, so it handles SIPs, missed instalments, lump-sum top-ups and partial redemptions that CAGR and simple ROI can't.",
    how:
      "XIRR is the rate r for which Σ CFᵢ ÷ (1 + r)^((dᵢ − d₀) ÷ 365) = 0, using actual days ÷ 365 like Excel. The calculator scans every possible rate for points where that sum changes sign and narrows each one down by bisection, so it never depends on a starting guess and can't run away. If no rate balances the cash flows — or more than one does — it tells you instead of returning a misleading number.",
    seo: {
      title: "XIRR Calculator – Calculate Annualised Returns on Irregular Investments",
      description:
        "Calculate XIRR online for SIPs, top-ups and redemptions on any dates. Excel-compatible annualised return, paste from a spreadsheet, benchmark comparison and a transaction summary.",
      keyword: "XIRR calculator",
      secondary: ["XIRR calculation", "XIRR formula", "mutual fund XIRR", "XIRR vs CAGR", "annualised investment returns", "SIP XIRR calculator"],
    },
    features: [
      { title: "Any dates, any amounts", body: "Add as many investments and withdrawals as you need — monthly SIPs, missed months, top-ups, partial redemptions." },
      { title: "No sign confusion", body: "Pick Invested or Withdrawn for each row instead of typing negative numbers." },
      { title: "Paste from a spreadsheet", body: "Copy date and amount columns from Excel or Google Sheets (negative = invested) and import them in one go." },
      { title: "Excel-compatible", body: "Actual days ÷ 365, the same convention as Excel's XIRR — tested against Microsoft's published example." },
      { title: "Honest when it can't answer", body: "Reports when cash flows have no solution or several, instead of picking one." },
      { title: "Benchmark comparison", body: "Compare with a rate such as an FD or index return, and see the money difference by the last date." },
    ],
    steps: [
      { title: "Enter your transactions", body: "Date, Invested or Withdrawn, and the amount — or paste them from a spreadsheet." },
      { title: "Add today's value", body: "If you still hold the investment, add its current value as a withdrawal on today's date." },
      { title: "Read your XIRR", body: "See the annual return, totals, period and a transaction summary; optionally compare with a benchmark." },
    ],
    specs: [
      { label: "Equation", value: "Σ CFᵢ ÷ (1 + r)^((dᵢ − d₀)/365) = 0" },
      { label: "Day count", value: "Actual days ÷ 365 (Excel XIRR)" },
      { label: "Solver", value: "Full-range sign scan + bisection to 1e-12; multiple/no roots reported" },
      { label: "Transactions", value: "Up to 2,000; same-day entries allowed" },
      { label: "Paste formats", value: "2021-04-05, 05/04/2021, 05-Apr-2021; tab, comma or semicolon" },
      { label: "Exports", value: "Copy, print, CSV" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Your transactions are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Excel's own example", body: "−10,000 on 1 Jan 2008, then +2,750, +4,250, +3,250 and +2,750 on 1 Mar 2008, 30 Oct 2008, 15 Feb 2009 and 1 Apr 2009: XIRR = 37.34% — the same as Excel." },
      { title: "A mutual fund with top-ups", body: "₹50,000 in April 2021, four top-ups totalling ₹50,000, a ₹15,000 redemption in Dec 2022 and a ₹1,42,500 current value in Nov 2026: XIRR about 11.02% a year, though the absolute return is 57.5%." },
      { title: "Why dates matter", body: "₹1,000 a year for three years then ₹3,500 back one year after the last payment is an XIRR of about 7.9% — far from the 16.7% the totals alone might suggest." },
    ],
    guide: {
      inputs: [
        { title: "Date", body: "The day money moved. Each day counts, so use the actual transaction dates from your statement." },
        { title: "Invested", body: "Money you put in: SIP instalments, lump sums, top-ups. Treated as negative cash flow." },
        { title: "Withdrawn", body: "Money you took out — redemptions, dividends paid out — and today's value if you still hold the investment." },
        { title: "Benchmark", body: "Optional annual rate to compare with, such as an FD rate or an index's return." },
      ],
      interpret: [
        "XIRR is a yearly rate: 11% means your money grew as if it earned 11% a year, allowing for when each rupee went in and came out.",
        "The absolute return (total gain ÷ total invested) isn't annualised and ignores timing, so it's usually very different from XIRR.",
        "Periods shorter than a year are annualised too — a small gain over a few weeks can show a very high XIRR.",
      ],
      useCases: ["Checking the real return on a SIP or mutual fund folio", "Comparing your return with an FD or index", "Measuring a portfolio with irregular top-ups and withdrawals", "Verifying the XIRR on a fund statement"],
      limitations: [
        "XIRR assumes the same rate applied throughout; it says nothing about volatility.",
        "When money changes direction several times, there can be more than one valid XIRR — the calculator reports this rather than choosing one.",
        "Taxes and exit loads are only included if they're reflected in the amounts you enter.",
      ],
      mistakes: [
        "Forgetting to add today's value as a withdrawal, which makes the return look like a loss.",
        "Entering investments as positive numbers when pasting — in spreadsheet format, money invested must be negative.",
        "Comparing XIRR with an absolute return or with CAGR over a different period.",
        "Using order dates instead of the dates units were actually allotted or redeemed.",
      ],
    },
    faqs: [
      { q: "What is XIRR?", a: "XIRR is the annualised return on a series of cash flows that happen on irregular dates. It's the single yearly rate at which the present value of all your investments and withdrawals adds up to zero." },
      { q: "How is XIRR calculated?", a: "Each cash flow is discounted by (1 + r) raised to the number of years since the first date (days ÷ 365), and r is found so that the total is zero. There's no direct formula, so it's solved numerically — this calculator searches the full range of rates and refines each solution by bisection." },
      { q: "What is the difference between XIRR and CAGR?", a: "CAGR uses only a starting and an ending value, so it suits a single lump sum. XIRR uses every cash flow and its date, so it's the right measure for SIPs, top-ups and withdrawals." },
      { q: "What is the difference between XIRR and ROI?", a: "ROI is the total gain divided by what you invested, ignoring time. XIRR is an annual rate that accounts for how long each amount was invested." },
      { q: "How do I enter a SIP that I still hold?", a: "Add each instalment as Invested on its date, then add the current market value as Withdrawn on today's date." },
      { q: "Why does XIRR say there's more than one answer?", a: "If money goes in, comes out and goes in again, the equation can have two or more valid rates. No single XIRR describes such cash flows reliably, so the calculator lists them instead of picking one." },
      { q: "Does the calculator match Excel's XIRR?", a: "Yes — it uses Excel's convention of actual days divided by 365 and reproduces Microsoft's documented example (37.34%)." },
    ],
    related: ["cagr-calculator", "roi-calculator", "sip-calculator", "lumpsum-calculator"],
    searchTerms: ["xirr", "irr", "annualised return", "mutual fund return", "sip return", "portfolio return", "internal rate of return", "irregular investments", "excel xirr", "money weighted return"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "swp-calculator",
    name: "SWP Calculator",
    category: "calculators",
    icon: "swp",
    short: "See how long a corpus lasts with regular withdrawals — monthly, quarterly or yearly, with inflation-linked increases.",
    intro:
      "Find out how long your investment can pay you a regular income. Enter the corpus, the withdrawal you want and an expected return to see the remaining balance, when the money would run out and how different return assumptions change the answer.",
    what:
      "A systematic withdrawal plan (SWP) takes a fixed amount out of an investment — usually a mutual fund — every month, quarter or year, while the rest stays invested. ZSpace Tools' SWP Calculator simulates every withdrawal period by period to show how much you'd take out, how much the investment earns along the way, and how long the corpus lasts.",
    how:
      "The expected return is treated as an effective annual rate and converted exactly into a per-period rate: (1 + R)^(1/12) − 1 for monthly withdrawals. Each period the calculator takes the withdrawal (at the start or end of the period, as you choose), applies the period's growth, and raises withdrawals each year if you've set an increase. It stops when the balance can't cover a withdrawal — the last payment is whatever is left, and the balance never goes negative.",
    seo: {
      title: "SWP Calculator – Systematic Withdrawal Plan & Corpus Life Calculator",
      description:
        "Calculate how long your investment will last with an SWP. Monthly, quarterly or yearly withdrawals, inflation-linked increases, three return scenarios and a year-wise table.",
      keyword: "SWP calculator",
      secondary: ["systematic withdrawal plan calculator", "monthly withdrawal calculator", "how long will my money last", "SWP returns", "mutual fund SWP calculator"],
    },
    features: [
      { title: "How long it lasts", body: "Shows the remaining corpus, or the time and month when the money runs out, with the final partial payment." },
      { title: "Monthly, quarterly or yearly", body: "Choose the withdrawal frequency and whether each withdrawal comes at the start or end of the period." },
      { title: "Inflation-linked income", body: "Raise withdrawals by a set % each year — or by the inflation rate to keep their buying power." },
      { title: "Three return scenarios", body: "Compare conservative, base and optimistic returns you choose, side by side and on one chart." },
      { title: "Growth vs withdrawals", body: "See each year's withdrawals and investment growth, and the balance in today's money." },
      { title: "Exports", body: "Copy, print or download the full period-by-period schedule as CSV." },
    ],
    steps: [
      { title: "Enter the corpus and withdrawal", body: "How much is invested, how much you'll take out, and how often." },
      { title: "Set the assumptions", body: "Expected return, projection period, and optionally an annual increase or inflation." },
      { title: "Read the outcome", body: "See whether the corpus lasts, the balance left and the scenarios, then export the schedule." },
    ],
    specs: [
      { label: "Periodic rate", value: "(1 + R)^(1/f) − 1 (effective annual)" },
      { label: "Frequency", value: "Monthly, quarterly, yearly" },
      { label: "Timing", value: "Start or end of each period" },
      { label: "Increase", value: "0–25% a year, or linked to inflation" },
      { label: "Ranges", value: "Return −50% to 50%; up to 60 years" },
      { label: "Exports", value: "Copy, print, CSV schedule" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Your figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹50 lakh, ₹30,000 a month", body: "At an assumed 8% a year with withdrawals at the start of each month, the corpus isn't exhausted in 30 years — about ₹77.8 lakh is left." },
      { title: "With inflation-linked withdrawals", body: "Raising that ₹30,000 by 6% a year, the same corpus runs out after about 16 years 7 months." },
      { title: "A higher withdrawal", body: "Taking ₹40,000 a month instead (no increases), the money lasts about 20 years 11 months." },
    ],
    guide: {
      inputs: [
        { title: "Investment corpus", body: "The amount invested when withdrawals begin." },
        { title: "Withdrawal", body: "The amount you take out each period, before any annual increase." },
        { title: "Expected return", body: "An assumed effective annual return on the money that stays invested." },
        { title: "Timing", body: "Start of period means the money is taken before that period's growth — slightly less lasting than end of period." },
        { title: "Annual increase / inflation", body: "Raising withdrawals each year keeps up with rising costs but uses the corpus up faster." },
      ],
      interpret: [
        "If the corpus survives, the remaining balance is what's left at the end of the period you modelled — not a guarantee it lasts forever.",
        "When growth each year exceeds withdrawals, the corpus can grow even while paying you; when withdrawals are larger, it shrinks faster and faster.",
        "Compare the scenarios: the gap between them shows how sensitive your plan is to returns.",
      ],
      useCases: ["Planning a monthly income in retirement", "Checking a safe withdrawal amount from a mutual fund", "Comparing fixed and inflation-linked withdrawals", "Deciding how much corpus a goal needs"],
      limitations: [
        "Real returns vary; a run of poor years early on (sequence risk) can shorten corpus life even when the average return matches.",
        "Taxes on gains and exit loads aren't deducted.",
        "This is an illustration, not financial advice.",
      ],
      mistakes: [
        "Assuming an equity-like return on money that will actually sit in debt or liquid funds.",
        "Ignoring inflation — a fixed withdrawal buys less every year.",
        "Planning for exactly your expected lifespan, leaving no margin.",
      ],
    },
    faqs: [
      { q: "What is an SWP?", a: "A systematic withdrawal plan redeems a fixed amount from your mutual fund investment at regular intervals and pays it to your bank account, while the rest stays invested." },
      { q: "How long will my investment last?", a: "It depends on the corpus, the withdrawal, the return and any annual increase. Enter them above: the calculator simulates every withdrawal and shows when — or whether — the money runs out." },
      { q: "Does withdrawing at the start or end of the month matter?", a: "Yes. Withdrawing at the start means that money doesn't earn the month's return, so the corpus lasts slightly less than with end-of-month withdrawals." },
      { q: "Why do higher withdrawals shorten corpus life so much?", a: "A bigger withdrawal leaves less invested to earn returns, which reduces next year's growth too. Past a certain point the corpus shrinks faster each year." },
      { q: "How do inflation-linked withdrawals work?", a: "Each year the withdrawal rises by the inflation rate, so it buys about the same amount of goods. It protects your lifestyle but uses the corpus up sooner." },
      { q: "Are SWP returns guaranteed?", a: "No. Mutual fund returns vary and can be negative. The calculator uses a constant assumed rate purely to illustrate; use the scenarios to see a range." },
    ],
    related: ["sip-calculator", "lumpsum-calculator", "retirement-calculator", "inflation-calculator"],
    searchTerms: ["swp", "systematic withdrawal", "withdrawal plan", "monthly income", "how long money last", "corpus", "retirement income", "drawdown", "monthly withdrawal", "pension from mutual fund"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "ppf-calculator",
    name: "PPF Calculator",
    category: "calculators",
    icon: "ppf",
    short: "Estimate your Public Provident Fund maturity using the actual PPF rules — the 5th-of-the-month interest rule and financial-year crediting.",
    intro:
      "Estimate your PPF balance at maturity and after extension. The calculator follows the PPF Scheme, 2019: interest on the lowest monthly balance after the 5th, credited every 31 March, with maturity 15 financial years after the year you open the account.",
    what:
      "The Public Provident Fund (PPF) is a Government of India savings scheme with a 15-year lock-in, a deposit limit of ₹1.5 lakh a year and a rate notified every quarter. ZSpace Tools' PPF Calculator projects your balance month by month through each financial year, the way PPF interest actually works, for new or existing accounts and for both extension options.",
    how:
      "For every month, interest is the rate ÷ 12 on the lowest balance between the close of the 5th day and the end of the month — so a deposit made by the 5th earns for that month and one made later doesn't. The year's monthly interest is added up and credited on 31 March. The account matures on completion of 15 financial years after the end of the year it was opened. Rules and the current rate are kept in one configuration file with their sources and verification date.",
    seo: {
      title: "PPF Calculator – Public Provident Fund Maturity & Interest Calculator",
      description:
        "Calculate PPF maturity and interest using the official rules: lowest balance after the 5th, interest credited each 31 March, 15-year maturity and 5-year extensions. Year-wise table included.",
      keyword: "PPF calculator",
      secondary: ["Public Provident Fund calculator", "PPF maturity calculator", "PPF interest calculator", "PPF contribution calculator", "PPF extension calculator"],
    },
    features: [
      { title: "The real interest rule", body: "Interest on the lowest balance between the 5th and month-end, credited at the end of each financial year — not a generic compound formula." },
      { title: "Deposit timing matters", body: "Monthly or yearly deposits, in any month, on or before the 5th or after — see exactly what timing costs or earns." },
      { title: "Correct maturity date", body: "Maturity on 1 April after 15 complete financial years from the year of opening, with financial-year labels throughout." },
      { title: "New or existing accounts", body: "Start a new account from any month, or project an existing one from this year's opening balance." },
      { title: "Both extension options", body: "Compare 5-year blocks with deposits (Form-4) and without deposits, side by side." },
      { title: "Limits checked", body: "₹500–₹1.5 lakh per financial year, in multiples of ₹50 — with clear messages if a deposit breaks a rule." },
    ],
    steps: [
      { title: "Choose new or existing", body: "Enter when a new account opens, or the year an existing one was opened and this year's opening balance." },
      { title: "Set your deposits", body: "Amount, monthly or yearly, the month, and whether you deposit by the 5th." },
      { title: "Read the projection", body: "See maturity value, interest, the financial-year table and extension scenarios." },
    ],
    specs: [
      { label: "Interest", value: "Rate ÷ 12 × lowest balance (5th–month end), credited 31 March" },
      { label: "Deposits", value: "₹500–₹1,50,000 per FY, multiples of ₹50" },
      { label: "Maturity", value: "15 complete FYs after the year of opening" },
      { label: "Extension", value: "Blocks of 5 years, with or without deposits" },
      { label: "Rate", value: "7.1% (Q3 FY 2026-27), editable" },
      { label: "Rules last verified", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your PPF details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1.5 lakh every April", body: "15 deposits of ₹1,50,000 by 5 April at 7.1% grow to about ₹40,68,209 — the figure most often quoted." },
      { title: "Opened in April 2026", body: "An account opened in April 2026 matures on 1 April 2042 and takes 16 yearly deposits: about ₹45,17,702 at 7.1%, of which ₹21,17,702 is interest." },
      { title: "After the 5th", body: "Making those 15 April deposits after the 5th instead of by it gives about ₹40,45,735 — roughly ₹22,474 less." },
    ],
    guide: {
      inputs: [
        { title: "New or existing", body: "A new account starts from its opening month; an existing one starts from this year's 1 April balance." },
        { title: "Deposit amount and frequency", body: "One deposit a year or one every month. The yearly total must stay within ₹500 and ₹1.5 lakh." },
        { title: "Deposit month and the 5th", body: "Money in by the 5th earns interest for that month; later deposits start earning the next month. Depositing early in the financial year earns the most." },
        { title: "Interest rate", body: "The rate notified for the current quarter. It's revised every three months, and the calculator applies the rate you enter to all future years." },
        { title: "Extension", body: "After maturity you can extend in 5-year blocks, either continuing deposits (by submitting Form-4 within a year) or without deposits." },
      ],
      interpret: [
        "Maturity value is your deposits plus all interest credited up to maturity.",
        "Each year's interest appears on 31 March; between credits, interest is accrued but not yet in the account.",
        "Extension without deposits still earns interest on the whole balance, which is why it keeps growing.",
      ],
      useCases: ["Planning tax-saving deposits under the old tax regime", "Choosing between a lump sum in April and monthly deposits", "Checking an existing account's maturity date and value", "Deciding whether to extend with or without deposits"],
      limitations: [
        "The rate is revised quarterly; real returns will follow the actual notified rates.",
        "Loans, partial withdrawals and missed years (which make an account discontinued) aren't modelled.",
        "Banks and post offices may round yearly interest to the rupee.",
        "Not an official bank or Government statement.",
      ],
      mistakes: [
        "Depositing after the 5th, especially in April, and losing a month's interest.",
        "Exceeding ₹1.5 lakh across your own and a minor's account — the excess earns no interest.",
        "Assuming a 15-calendar-year term: maturity is 15 years after the end of the opening financial year.",
        "Forgetting to submit Form-4 in time if you want to keep depositing after maturity.",
      ],
    },
    faqs: [
      { q: "How is PPF interest calculated?", a: "For each month, interest is the annual rate ÷ 12 on the lowest balance between the close of the 5th day and the end of the month. The year's interest is added up and credited on 31 March, so it compounds once a year." },
      { q: "Why should I deposit before the 5th?", a: "A deposit made on or before the 5th is included in that month's lowest balance and earns interest for the month; one made after the 5th earns nothing until the next month." },
      { q: "When does a PPF account mature?", a: "On completion of 15 financial years from the end of the financial year in which it was opened. An account opened any time in FY 2026-27 matures on 1 April 2042." },
      { q: "How much can I deposit in PPF?", a: "Between ₹500 and ₹1,50,000 in a financial year, in multiples of ₹50 — in one go or in instalments. The ₹1.5 lakh limit includes deposits in any minor's account you hold." },
      { q: "What is the current PPF interest rate?", a: "7.1% a year for October–December 2026 (Q3 FY 2026-27). The Government reviews the rate every quarter, so check the National Savings Institute or Department of Economic Affairs for the latest." },
      { q: "Can I extend PPF after 15 years?", a: "Yes, in blocks of five years. To keep depositing, submit Form-4 within one year of maturity; otherwise the account continues without deposits, still earning interest, with one withdrawal allowed each year." },
      { q: "Is PPF interest taxable?", a: "PPF interest and the maturity amount are exempt from income tax. Under the old tax regime, deposits can be claimed as a deduction within the overall ₹1.5 lakh limit — Section 80C of the Income-tax Act, 1961, which became Section 123 of the Income-tax Act, 2025 from tax year 2026-27. The new regime doesn't allow this deduction." },
    ],
    related: ["fd-calculator", "rd-calculator", "compound-interest-calculator", "retirement-calculator"],
    searchTerms: ["ppf", "public provident fund", "ppf interest", "ppf maturity", "ppf extension", "80c", "section 123", "small savings", "post office ppf", "tax free investment", "ppf calculator"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "inflation-calculator",
    name: "Inflation Calculator",
    category: "calculators",
    icon: "inflation",
    short: "See what today's money will cost in future, what a future amount is worth today, and how much purchasing power you lose.",
    intro:
      "Work out how inflation changes the value of money. See what something costing ₹1 lakh today might cost in 10 years, what a future amount is worth in today's money, and how much buying power you lose — at the rate you choose.",
    what:
      "Inflation is the general rise in prices over time, which means the same money buys less. ZSpace Tools' Inflation Calculator applies an average inflation rate you choose to show future costs, present values and the purchasing power that remains, with low and high scenarios side by side.",
    how:
      "Future cost = amount × (1 + inflation)^years. Value today of a future amount = future amount ÷ (1 + inflation)^years. Purchasing power remaining = 1 ÷ (1 + inflation)^years. The calculator uses a single average rate you enter; it doesn't claim to hold official or historical inflation data.",
    seo: {
      title: "Inflation Calculator – Future Value of Money & Purchasing Power",
      description:
        "Calculate the effect of inflation on money. Future cost of today's expenses, present value of future amounts, purchasing power lost, scenario comparison and a year-wise table.",
      keyword: "inflation calculator",
      secondary: ["inflation rate calculator", "purchasing power calculator", "future value of money", "inflation impact on savings", "cost of living calculator"],
    },
    features: [
      { title: "Three ways to ask", body: "Future cost of today's money, today's value of a future amount, or the change between two years." },
      { title: "Purchasing power", body: "See the percentage increase in cost and how much of your money's buying power remains." },
      { title: "Scenarios", body: "Compare a low, your own and a high inflation rate side by side and on one chart." },
      { title: "Year-wise table", body: "Cost and value every year, downloadable as CSV." },
      { title: "Any currency", body: "Rupees, dollars, pounds, euros, dirhams and more — with your own rate for each." },
      { title: "Honest about data", body: "Uses the rate you enter, never a made-up 'official' figure." },
    ],
    steps: [
      { title: "Choose what to calculate", body: "Future cost, today's value or between two years." },
      { title: "Enter the amount, rate and period", body: "The rate is your assumption of average inflation." },
      { title: "Compare and export", body: "Check the scenarios and the year-wise table, then copy, print or download." },
    ],
    specs: [
      { label: "Future cost", value: "amount × (1 + i)^t" },
      { label: "Present value", value: "future amount ÷ (1 + i)^t" },
      { label: "Purchasing power left", value: "1 ÷ (1 + i)^t" },
      { label: "Rate", value: "−10% to 100% a year (your assumption)" },
      { label: "Period", value: "Up to 100 years; fractions allowed" },
      { label: "Exports", value: "Copy, print, CSV" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Everything is calculated in your browser. Nothing is uploaded, stored or sent to analytics.",
    examples: [
      { title: "Future cost", body: "Things costing ₹1,00,000 today would cost about ₹1,79,085 in 10 years at 6% inflation — a 79% increase." },
      { title: "Today's value", body: "₹1,00,000 received in 10 years is worth about ₹55,839 in today's money at 6% inflation." },
      { title: "Real return", body: "An FD paying 7% when inflation is 6% grows your buying power by only about 0.94% a year." },
    ],
    guide: {
      inputs: [
        { title: "Amount", body: "Today's cost of something (future-cost mode), or an amount you'll have in future (today's-value mode)." },
        { title: "Average inflation", body: "Your assumption of the yearly rise in prices. Headline rates differ by country and period; your own costs (school fees, healthcare, rent) may rise faster or slower." },
        { title: "Years / between years", body: "How far ahead or back. The between-years mode still uses your average rate — it doesn't look up historical data." },
      ],
      interpret: [
        "Future cost is what the same basket of things would cost if prices rose at your rate every year.",
        "Purchasing power remaining is the share of today's buying power your money keeps if it isn't invested.",
        "A return is only real growth if it beats inflation: real return = (1 + return) ÷ (1 + inflation) − 1.",
      ],
      useCases: ["Estimating future costs for goals like education or a home", "Seeing why cash savings lose value", "Turning a future pension or maturity amount into today's money", "Choosing an inflation assumption for retirement planning"],
      limitations: [
        "Uses one average rate; real inflation varies every year.",
        "Category inflation (education, healthcare, property) can be very different from the headline rate.",
        "No historical inflation data is used.",
      ],
      mistakes: [
        "Using the headline rate for costs that rise much faster, like school fees or medical care.",
        "Treating a nominal return as real growth without subtracting inflation.",
        "Comparing amounts from different years without adjusting them to the same year's money.",
      ],
    },
    faqs: [
      { q: "What is inflation?", a: "Inflation is the general increase in prices over time. When prices rise, each rupee buys a little less — that's the fall in purchasing power." },
      { q: "How do I calculate the future cost of something?", a: "Multiply today's cost by (1 + inflation) raised to the number of years. ₹1,00,000 at 6% for 10 years: 1,00,000 × 1.06^10 ≈ ₹1,79,085." },
      { q: "How much will my money be worth in the future?", a: "Divide the amount by (1 + inflation)^years to get its value in today's money. ₹1,00,000 in 10 years at 6% inflation is worth about ₹55,839 today." },
      { q: "What is the difference between nominal and real returns?", a: "Nominal return is the stated growth of your money; real return is growth after inflation, (1 + return) ÷ (1 + inflation) − 1. A 7% FD with 6% inflation has a real return of about 0.94%." },
      { q: "How does inflation affect retirement planning?", a: "Expenses that are ₹50,000 a month today would be about ₹2.87 lakh a month in 30 years at 6% inflation, so a retirement corpus has to be far larger than today's costs suggest." },
      { q: "Is this the official inflation rate?", a: "No. The calculator uses whatever rate you enter. For official figures, check your country's statistics office or central bank." },
    ],
    related: ["retirement-calculator", "lumpsum-calculator", "compound-interest-calculator", "sip-calculator"],
    searchTerms: ["inflation", "purchasing power", "future value of money", "cost of living", "price rise", "real return", "value of rupee", "inflation impact", "present value"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "retirement-calculator",
    name: "Retirement Calculator",
    category: "calculators",
    icon: "retirement",
    short: "Estimate the corpus you'll need to retire, what your savings will grow to, the gap, and the extra monthly investment to close it.",
    intro:
      "Work out how much you need to retire comfortably and whether you're on track. Enter your age, expenses, savings and assumptions to see the corpus you'll need, what your current plan grows to, the gap or surplus, and how much more to invest each month.",
    what:
      "A retirement calculator estimates the money needed at retirement to cover your expenses for the rest of your life, and compares it with what your savings are likely to grow to. ZSpace Tools' Retirement Calculator uses a month-by-month model with inflation-adjusted expenses, separate pre- and post-retirement returns, other income and one-time costs — and shows how long your projected savings would last.",
    how:
      "Today's monthly expenses are grown with inflation to your retirement age and keep rising every year after. The required corpus is the present value, at the post-retirement return, of every month's expenses (less any other income) until the age you plan to, plus any one-time expense. Your savings and monthly contributions are grown at the pre-retirement return. The gap is required minus projected, and the extra monthly investment is that gap divided by what ₹1 a month would grow to on the same plan.",
    seo: {
      title: "Retirement Calculator – How Much Do I Need to Retire? (Corpus Planner)",
      description:
        "Calculate the retirement corpus you need, your projected savings, the gap and the monthly investment to close it. Inflation-adjusted expenses, pre- and post-retirement returns and scenarios.",
      keyword: "retirement calculator",
      secondary: ["retirement corpus calculator", "retirement planning calculator", "how much money do I need to retire", "monthly retirement savings calculator", "pension planning calculator"],
    },
    features: [
      { title: "Corpus you'll need", body: "Calculated month by month from inflation-adjusted expenses — not a 25×-expenses shortcut." },
      { title: "Where your savings get to", body: "Existing savings and monthly contributions with a yearly increase, at your pre-retirement return." },
      { title: "Gap and the fix", body: "The shortfall or surplus, and the extra monthly investment that would close a gap." },
      { title: "How long it lasts", body: "Whether your projected savings last to your planning age, and if not, roughly when they'd run out." },
      { title: "Income and one-time costs", body: "Include a pension or rent (indexed or fixed) and a one-time retirement expense." },
      { title: "Three scenarios", body: "Edit conservative and optimistic returns and inflation and compare all three." },
    ],
    steps: [
      { title: "Enter your ages", body: "Current age, retirement age and the age to plan until." },
      { title: "Enter your money", body: "Monthly expenses today, savings so far, and how much you save each month." },
      { title: "Adjust assumptions", body: "Returns before and after retirement and inflation — then read the result and compare scenarios." },
    ],
    specs: [
      { label: "Expenses", value: "Today × (1 + inflation)^years, rising yearly in retirement" },
      { label: "Required corpus", value: "PV of monthly net needs at the post-retirement return" },
      { label: "Projection", value: "Monthly contributions (start of month), yearly step-up" },
      { label: "Rates", value: "Effective annual → monthly (1 + R)^(1/12) − 1" },
      { label: "Ages", value: "18–90 now; plan to 110" },
      { label: "Exports", value: "Copy, print summary" },
    ],
    formats: ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"],
    privacy: "Your ages, expenses and savings stay in your browser. Nothing is uploaded, stored or sent to analytics.",
    examples: [
      { title: "A 30-year-old today", body: "₹50,000 a month of expenses, ₹5 lakh saved and ₹15,000 a month rising 5% a year; 10% before and 7% after retirement, 6% inflation. Retiring at 60 and planning to 85 needs about ₹7.48 crore; the plan reaches about ₹5.85 crore." },
      { title: "Closing the gap", body: "In that example, investing about ₹4,912 more a month (also rising 5% a year) closes the ₹1.63 crore gap." },
      { title: "The effect of inflation", body: "Those ₹50,000 monthly expenses become about ₹2.87 lakh a month by age 60 at 6% inflation." },
    ],
    guide: {
      inputs: [
        { title: "Ages", body: "Retirement age sets how long you save; the age you plan until sets how long the money must last. Plan beyond your expected lifespan for safety." },
        { title: "Monthly expenses", body: "Your household's current monthly spending. It's grown with inflation to retirement." },
        { title: "Savings and contributions", body: "What you've set aside for retirement and how much you add each month, with an optional yearly increase." },
        { title: "Returns before and after", body: "Expected yearly returns while saving and during retirement. Post-retirement money is usually invested more conservatively." },
        { title: "Inflation", body: "How fast your expenses rise each year." },
        { title: "Other income and one-time expense", body: "A pension or rental income reduces what you need; a one-time cost at retirement adds to it." },
      ],
      interpret: [
        "Required corpus is the amount you'd need on your retirement day to fund the plan to your chosen age under these assumptions.",
        "Projected corpus is what your current savings and contributions are estimated to grow to.",
        "A shortfall shows the extra monthly investment that would close it; the longer you have, the smaller it is.",
        "If your post-retirement return is below inflation, the corpus loses buying power each year and you need more of it.",
      ],
      useCases: ["Setting a retirement savings target", "Checking whether current SIPs and EPF/PPF are enough", "Seeing the cost of retiring earlier", "Testing how sensitive the plan is to returns and inflation"],
      limitations: [
        "Returns and inflation are assumed constant; real ones vary.",
        "Taxes, fees, healthcare shocks and changes in spending aren't modelled.",
        "Not personalised financial advice — consider speaking to a qualified adviser.",
      ],
      mistakes: [
        "Underestimating how long retirement lasts.",
        "Using today's expenses without inflating them to retirement.",
        "Assuming high equity returns on money that will be held in safer investments after retiring.",
        "Forgetting large one-time costs such as healthcare, a home repair or family commitments.",
      ],
    },
    faqs: [
      { q: "How much money do I need to retire?", a: "Enough to cover your inflation-adjusted expenses, less other income, for every month from retirement to the age you plan until — discounted at the return your money earns after retiring. Enter your figures above for an estimate." },
      { q: "What is a retirement corpus?", a: "The total amount of savings and investments you have on the day you retire, which then funds your living expenses." },
      { q: "Why does inflation matter so much?", a: "Over 20–30 years even moderate inflation multiplies costs several times. ₹50,000 a month today is about ₹2.87 lakh a month in 30 years at 6%." },
      { q: "Why does the post-retirement return matter?", a: "Your corpus keeps earning while you draw from it. A higher return means you need a smaller corpus; a return below inflation means you need a larger one." },
      { q: "Why is the required monthly investment higher if I start later?", a: "Each rupee invested has fewer years to grow, so more of the target has to come from contributions rather than compounding." },
      { q: "Is the 25× annual expenses rule enough?", a: "It's a rough shortcut that assumes a particular return and inflation. This calculator models your actual ages, rates and income month by month instead." },
    ],
    related: ["swp-calculator", "inflation-calculator", "sip-calculator", "ppf-calculator", "fd-calculator", "epf-calculator", "nps-calculator"],
    searchTerms: ["retirement", "retirement corpus", "retirement planning", "pension", "how much to retire", "fire", "financial independence", "retire early", "corpus calculator", "retirement savings"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "income-tax-calculator",
    name: "Income Tax Calculator",
    category: "tax",
    alsoIn: ["salary", "calculators"],
    icon: "income-tax",
    short: "Work out Indian income tax under the new and old regimes side by side, with slab-by-slab working, rebate, surcharge and cess.",
    intro:
      "Estimate your income tax for tax year 2026-27 or FY 2025-26 under both regimes at once. Every step — standard deduction, deductions, slabs, rebate, marginal relief, surcharge and cess — is shown, along with the rules used and where they come from.",
    what:
      "An income tax calculator estimates how much tax a resident individual owes for a year from their salary, other income and deductions. ZSpace Tools' Income Tax Calculator applies the slabs and limits for the year you choose, compares the new regime with the old one, and shows which costs less and by how much.",
    how:
      "The calculator subtracts exemptions (old regime only), the standard deduction and professional tax from salary, adds other income and any allowed house-property loss, then takes off deductions. Taxable income is rounded to the nearest ₹10 and taxed slab by slab. The rebate, marginal relief, surcharge (with marginal relief at each threshold) and 4% cess follow, and the total is rounded to the nearest ₹10. All rates live in one versioned rules file with their sources.",
    seo: {
      title: "Income Tax Calculator 2026-27 – New vs Old Regime (India)",
      description:
        "Calculate income tax for tax year 2026-27 and FY 2025-26 under the new and old regimes. See slab-wise working, ₹12 lakh rebate with marginal relief, surcharge, cess and which regime saves more.",
      keyword: "income tax calculator",
      secondary: ["income tax calculator 2026-27", "new vs old tax regime calculator", "income tax calculator India", "salary tax calculator", "tax slab calculator", "87A rebate calculator"],
    },
    features: [
      { title: "Both regimes at once", body: "New and old regime tax side by side, with the cheaper one highlighted and the difference in rupees." },
      { title: "Every step shown", body: "Standard deduction, deductions, each slab, rebate, marginal relief, surcharge and cess, line by line." },
      { title: "Two tax years", body: "Tax year 2026-27 under the Income-tax Act, 2025 and FY 2025-26 under the 1961 Act." },
      { title: "Marginal relief done right", body: "Just above ₹12 lakh in the new regime, and at every surcharge threshold, so tax never jumps by more than the extra income." },
      { title: "Rules you can check", body: "Each rate shows whether it's verified, from secondary sources or not yet confirmed, with links." },
      { title: "Private by design", body: "Your salary and deductions are worked out in your browser and never uploaded." },
    ],
    steps: [
      { title: "Pick the year and your age", body: "Choose 2026-27 or 2025-26; age only affects old-regime slabs." },
      { title: "Enter income and deductions", body: "Gross salary, other income, and — for the old regime — HRA, 80C, 80D and the rest." },
      { title: "Compare and read the working", body: "See both totals, which regime saves more, and the step-by-step calculation." },
    ],
    specs: [
      { label: "Years", value: "Tax year 2026-27 · FY 2025-26" },
      { label: "Regimes", value: "New (default) and old" },
      { label: "Includes", value: "Rebate, marginal relief, surcharge, 4% cess, ₹10 rounding" },
      { label: "Not covered", value: "Capital gains and other special-rate income" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your income and deduction details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹13 lakh salary, new regime", body: "After the ₹75,000 standard deduction, taxable income is ₹12,25,000. Slab tax is ₹63,750, but marginal relief limits it to the ₹25,000 earned above ₹12 lakh; with 4% cess the tax is ₹26,000." },
      { title: "₹12.75 lakh salary, new regime", body: "Taxable income is exactly ₹12,00,000, so the ₹60,000 rebate wipes out the tax: nil." },
      { title: "₹15 lakh salary, new vs old", body: "With ₹1.5 lakh of 80C, ₹25,000 of 80D and ₹2,500 professional tax, the new regime gives ₹97,500 and the old regime ₹2,02,020 — the new regime is cheaper by ₹1,04,520." },
      { title: "When the old regime wins", body: "The same ₹15 lakh salary with ₹2.4 lakh HRA exemption, ₹2 lakh home-loan interest and ₹50,000 in NPS as well brings old-regime tax down to ₹71,760 — below the new regime's ₹97,500." },
    ],
    guide: {
      inputs: [
        { title: "Gross salary", body: "Everything taxable your employer pays in the year — basic, allowances, bonus and perquisites — before exemptions. Don't include your employer's PF; enter employer NPS separately." },
        { title: "Other income", body: "Savings and deposit interest, rent received and similar income taxed at slab rates. Capital gains are taxed at special rates and aren't supported." },
        { title: "Old-regime exemptions and deductions", body: "HRA exemption, professional tax, 80C (max ₹1.5 lakh), 80D, 80CCD(1B) own NPS (max ₹50,000), home-loan interest on a self-occupied home (loss set off up to ₹2 lakh) and other eligible deductions. The new regime ignores these." },
        { title: "Employer NPS", body: "Your employer's NPS contribution is added to salary and then deducted up to 14% of basic + DA in the new regime and 10% in the old." },
        { title: "Age", body: "Senior citizens (60–79) and super seniors (80+) have higher basic exemption limits in the old regime. New-regime slabs are the same for everyone." },
      ],
      interpret: [
        "The highlighted regime is the cheaper one on the figures you entered. If your deductions change, the answer can change too.",
        "Taxable income is after every deduction and is rounded to the nearest ₹10, as the Act requires.",
        "Marginal relief lines show where the law caps tax so that crossing a threshold never costs more than the extra income.",
        "The monthly figure is the year's tax ÷ 12 — roughly what your employer will deduct as TDS if your salary is steady.",
      ],
      useCases: ["Choosing between the new and old regime", "Checking the TDS on your payslip", "Planning 80C and other investments", "Seeing the effect of a raise on your tax", "Estimating tax on a job offer"],
      limitations: [
        "Capital gains, lottery winnings and other special-rate income aren't calculated.",
        "Deductions are applied as you enter them; check each one's own conditions and limits.",
        "Some 2026-27 values are assumed unchanged from 2025-26 and are marked so in the rules panel.",
        "Not for companies, firms, non-residents or HUFs.",
      ],
      mistakes: [
        "Entering CTC instead of gross salary — employer PF and gratuity aren't your taxable salary.",
        "Claiming HRA, 80C or 80D in the new regime, where they aren't allowed.",
        "Forgetting interest income, which is taxable at your slab rate.",
        "Assuming ₹12 lakh is tax-free for any salary — with the standard deduction it's ₹12.75 lakh of salary, and only in the new regime.",
      ],
    },
    faqs: [
      { q: "Which tax regime is better for me?", a: "It depends on your deductions. The new regime has lower rates and a ₹75,000 standard deduction but almost no deductions; the old regime suits people with large HRA, home-loan interest and 80C/80D claims. Enter both sets of figures and the calculator shows which costs less." },
      { q: "Is income up to ₹12 lakh tax-free?", a: "In the new regime, if taxable income is ₹12 lakh or less, the rebate cancels tax of up to ₹60,000, so you pay nothing. With the ₹75,000 standard deduction, that means a salary of up to ₹12.75 lakh. Just above that, marginal relief limits the tax to the income above ₹12 lakh." },
      { q: "What changed with the Income-tax Act, 2025?", a: "From 1 April 2026 the Income-tax Act, 2025 replaced the 1961 Act. 'Tax year' replaces 'previous year' and 'assessment year', and sections are renumbered — but Budget 2026-27 kept the same tax rates and slabs." },
      { q: "What are the new-regime slabs for 2026-27?", a: "Nil up to ₹4 lakh, 5% from ₹4–8 lakh, 10% from ₹8–12 lakh, 15% from ₹12–16 lakh, 20% from ₹16–20 lakh, 25% from ₹20–24 lakh and 30% above ₹24 lakh, plus 4% cess." },
      { q: "How is surcharge calculated?", a: "Surcharge is 10% of tax above ₹50 lakh of income, 15% above ₹1 crore and 25% above ₹2 crore (37% above ₹5 crore in the old regime only). Marginal relief ensures the extra tax at each threshold doesn't exceed the extra income." },
      { q: "Does this include cess?", a: "Yes. A 4% health and education cess is added on tax plus surcharge, and the total is rounded to the nearest ₹10." },
      { q: "Is my data saved?", a: "No. Everything is calculated in your browser; nothing you type is uploaded or stored." },
    ],
    related: ["take-home-salary-calculator", "hra-calculator", "tds-calculator", "salary-hike-calculator"],
    searchTerms: ["income tax", "tax calculator", "new regime", "old regime", "tax slab", "87a", "rebate", "surcharge", "cess", "itr", "salary tax", "tax year 2026-27", "income-tax act 2025", "115bac", "section 202"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "take-home-salary-calculator",
    name: "Take-Home Salary Calculator",
    category: "salary",
    alsoIn: ["payroll", "calculators"],
    icon: "take-home",
    short: "Turn a CTC or salary breakup into monthly in-hand pay — PF, ESI, professional tax and income tax, with each amount counted once.",
    intro:
      "Find out what actually reaches your bank account each month. Start from your CTC or your salary components; the calculator separates what your employer pays on your behalf from what's deducted from your pay, and works out income tax for the regime you choose.",
    what:
      "A take-home (in-hand) salary calculator converts cost to company (CTC) into the net monthly salary you receive. ZSpace Tools' calculator splits CTC into basic, HRA, special allowance, employer PF and gratuity, then subtracts employee PF, ESI, professional tax and income tax to give monthly and yearly in-hand pay — and can compare two offers.",
    how:
      "In CTC mode, basic is a percentage of CTC and HRA a percentage of basic; employer PF, employer NPS and a gratuity provision of 4.81% of basic are carved out, and the special allowance is what's left, so the parts always add back to the CTC. Employee PF (12% on the basis you choose), ESI (if gross pay is within ₹21,000 a month), professional tax and income tax — from the same engine as the Income Tax Calculator — are then deducted.",
    seo: {
      title: "Take-Home Salary Calculator – CTC to In-Hand Salary (India 2026-27)",
      description:
        "Convert CTC to in-hand salary. See monthly take-home after PF, ESI, professional tax and income tax under the new or old regime, with a full CTC breakup and offer comparison.",
      keyword: "take home salary calculator",
      secondary: ["in hand salary calculator", "CTC to in-hand calculator", "salary calculator India", "net salary calculator", "CTC calculator", "salary breakup calculator"],
    },
    features: [
      { title: "CTC or components", body: "Start from a CTC with basic and HRA percentages, or enter the components from your offer letter." },
      { title: "Nothing counted twice", body: "Employer PF, NPS and gratuity sit in CTC only; employee PF, ESI, PT and tax come out of gross pay only." },
      { title: "Real income tax", body: "New or old regime for 2026-27 or 2025-26, with HRA exemption and PF in 80C for the old regime." },
      { title: "PF your way", body: "12% on the ₹15,000 ceiling, on full basic, or no PF — matching what your employer does." },
      { title: "Compare two offers", body: "See the monthly in-hand difference between two CTCs with the same structure." },
      { title: "Line-by-line breakup", body: "Every rupee from CTC to in-hand, printable and copyable." },
    ],
    steps: [
      { title: "Enter CTC or components", body: "Your annual CTC with basic %, or basic, HRA and special allowance." },
      { title: "Set PF, gratuity and tax", body: "Choose the PF basis, whether CTC includes gratuity, your state's professional tax and your regime." },
      { title: "Read your in-hand pay", body: "Monthly in-hand, the year's tax and deductions, and the full breakup." },
    ],
    specs: [
      { label: "Deductions", value: "Employee PF, ESI, professional tax, income tax, others" },
      { label: "Employer side", value: "PF, NPS, gratuity (4.81% of basic)" },
      { label: "Tax", value: "New or old regime, 2026-27 or 2025-26" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your salary details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹12 lakh CTC", body: "With basic at 50% of CTC, HRA at 50% of basic, PF on the ₹15,000 ceiling, gratuity in CTC and ₹2,400 professional tax, gross pay is about ₹11.5 lakh, income tax is nil in the new regime, and in-hand pay is about ₹93,796 a month." },
      { title: "₹18 lakh CTC", body: "The same structure gives income tax of ₹1,37,310 for 2026-27 in the new regime and about ₹1,31,152 a month in hand." },
      { title: "Why in-hand isn't CTC ÷ 12", body: "On a ₹12 lakh CTC, ₹21,600 of employer PF and ₹28,846 of gratuity provision never reach your account, and ₹21,600 of employee PF comes out of your pay." },
    ],
    guide: {
      inputs: [
        { title: "CTC", body: "Total yearly cost to your employer: gross salary, variable pay, employer PF, employer NPS and gratuity provision (if your employer includes it)." },
        { title: "Basic % and HRA %", body: "Basic is usually 40–50% of CTC; HRA 40–50% of basic. Under the Labour Codes, allowances above half of pay count as wages for PF and gratuity, which pushes basic towards 50%." },
        { title: "Employer PF basis", body: "Many employers cap PF at 12% of ₹15,000 (₹1,800 a month); others pay 12% of full basic. Check your payslip." },
        { title: "Professional tax", body: "A state tax of up to ₹2,500 a year, deducted monthly. It varies by state and some states don't levy it, so enter yours." },
        { title: "Regime, rent and 80C", body: "Choose the tax regime. For the old regime, rent and city give the HRA exemption and your PF counts in 80C along with other investments." },
      ],
      interpret: [
        "Monthly in-hand covers fixed pay only; variable pay and bonus are taxed in the year but left out because they're usually paid once.",
        "Employer-side amounts are part of your CTC but not your pay: PF builds your EPF balance and gratuity is paid only when you leave after qualifying service.",
        "Actual payslips may differ slightly because employers spread tax unevenly or round each month.",
      ],
      useCases: ["Understanding a job offer", "Comparing two offers", "Choosing a tax regime at work", "Checking your payslip", "Seeing how a higher basic changes in-hand pay"],
      limitations: [
        "Perquisites, reimbursements, meal cards and other tax-free components aren't modelled.",
        "Employer ESI isn't carved out of CTC; some employers include it.",
        "Professional tax is a single yearly figure you enter, not a state slab table.",
        "Variable pay is assumed to be paid in full.",
      ],
      mistakes: [
        "Dividing CTC by 12 and expecting that in hand.",
        "Comparing an offer's CTC with your current gross pay.",
        "Forgetting that a larger basic raises PF and gratuity but lowers take-home.",
        "Counting gratuity as yearly income — it's paid only on leaving after five years (one for fixed-term staff).",
      ],
    },
    faqs: [
      { q: "How is in-hand salary calculated from CTC?", a: "Take CTC, remove what your employer pays on your behalf (employer PF, employer NPS, gratuity provision), then subtract employee PF, ESI if applicable, professional tax and income tax. What's left, divided by 12, is your monthly in-hand pay." },
      { q: "Why is my in-hand salary so much less than CTC ÷ 12?", a: "CTC includes money that never reaches your account each month: employer PF, gratuity provision and often variable pay. Then employee PF, professional tax and income tax are deducted from what's left." },
      { q: "Is gratuity part of CTC?", a: "Many employers include a gratuity provision of about 4.81% of basic in CTC. It's only paid when you leave after five years of service (one year for fixed-term employees), so it isn't part of monthly pay." },
      { q: "Is PF deducted on full basic or ₹15,000?", a: "The law requires PF on wages up to ₹15,000 a month; many employers contribute on full basic instead. Your payslip shows which — ₹1,800 a month means the ceiling is used." },
      { q: "When is ESI deducted?", a: "If your gross monthly wages are ₹21,000 or less, 0.75% is deducted as your ESI share and your employer pays 3.25%." },
      { q: "Does the new regime change take-home pay?", a: "Yes — with lower slab rates and a ₹75,000 standard deduction it usually means less tax unless you have large HRA, home-loan or 80C claims. Switch the regime to compare." },
    ],
    related: ["income-tax-calculator", "salary-hike-calculator", "epf-calculator", "hra-calculator", "gratuity-calculator", "loan-affordability-calculator"],
    searchTerms: ["take home", "in hand salary", "ctc", "ctc to in hand", "net salary", "salary breakup", "payslip", "monthly salary", "salary calculator", "offer comparison", "gross salary"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "hra-calculator",
    name: "HRA Calculator",
    category: "tax",
    alsoIn: ["salary"],
    icon: "hra",
    short: "Work out how much of your house rent allowance is tax-free under the old regime — including the eight 50% cities from 2026-27.",
    intro:
      "Calculate your HRA exemption from basic salary, HRA and rent. See all three limits, which one applies, and how much HRA stays taxable — month by month if your rent or city changed. For tax year 2026-27 the 50% limit covers eight cities.",
    what:
      "House rent allowance (HRA) exemption is the part of HRA that isn't taxed for salaried employees who pay rent, under the old tax regime. ZSpace Tools' HRA Calculator applies the rule — the least of HRA received, rent minus 10% of salary, and 50% or 40% of salary — for FY 2025-26 or tax year 2026-27.",
    how:
      "For each month, the calculator works out the three limits from your basic + DA, HRA and rent, and takes the smallest. Cities eligible for the 50% limit depend on the year: four metros in FY 2025-26, eight cities (adding Bengaluru, Hyderabad, Pune and Ahmedabad) from 2026-27. The rest of your HRA is taxable salary.",
    seo: {
      title: "HRA Calculator 2026-27 – House Rent Allowance Exemption",
      description:
        "Calculate HRA exemption for tax year 2026-27 and FY 2025-26. Least of HRA received, rent minus 10% of salary and 50%/40% of salary — with the eight 50% cities, month-wise rent and the taxable HRA.",
      keyword: "HRA calculator",
      secondary: ["HRA exemption calculator", "house rent allowance calculator", "HRA tax exemption", "HRA calculation formula", "rent receipt HRA"],
    },
    features: [
      { title: "All three limits shown", body: "HRA received, rent minus 10% of salary and the city limit — with the one that applies highlighted." },
      { title: "Right cities for the year", body: "Four 50% cities for FY 2025-26; eight from 2026-27, including Bengaluru, Hyderabad, Pune and Ahmedabad." },
      { title: "Month by month", body: "Enter different rent or a different city for each month when you moved or your rent changed." },
      { title: "Clear about regimes", body: "Reminds you that the exemption is old-regime only, with a link to compare both regimes." },
      { title: "Taxable HRA too", body: "See how much HRA is added to your taxable salary." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter salary and HRA", body: "Monthly basic, DA (if it counts for retirement benefits) and HRA received." },
      { title: "Enter rent and city", body: "Monthly rent and where you rent — or switch to month-by-month." },
      { title: "Read the exemption", body: "Exempt HRA for the year, the three limits and the taxable part." },
    ],
    specs: [
      { label: "Rule", value: "Least of HRA, rent − 10% of salary, 50%/40% of salary" },
      { label: "50% cities 2026-27", value: "Mumbai, Delhi, Kolkata, Chennai, Bengaluru, Hyderabad, Pune, Ahmedabad" },
      { label: "Regime", value: "Old regime only" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your salary and rent are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Basic ₹50,000, HRA ₹25,000, rent ₹20,000 in Bengaluru", body: "Over 12 months: HRA ₹3,00,000; rent minus 10% of salary ₹1,80,000; 50% of salary ₹3,00,000. Exempt HRA is ₹1,80,000 and ₹1,20,000 is taxable." },
      { title: "Bengaluru, rent ₹30,000 — the 2026-27 change", body: "Rent minus 10% is ₹3,00,000. In FY 2025-26 Bengaluru gets the 40% limit, so the exemption is ₹2,40,000; from 2026-27 it gets 50%, so the exemption is the full ₹3,00,000." },
      { title: "Low rent", body: "If rent is ₹5,000 a month on a ₹50,000 basic, rent is less than 10% of salary, so no HRA is exempt." },
    ],
    guide: {
      inputs: [
        { title: "Basic and DA", body: "'Salary' for HRA is basic plus DA that counts for retirement benefits, plus any commission fixed as a percentage of turnover." },
        { title: "HRA received", body: "The HRA in your payslip, per month." },
        { title: "Rent and city", body: "What you actually pay and where you live. Rent paid to a parent can count if it's genuine and they declare it; rent to a spouse generally doesn't." },
        { title: "Month by month", body: "Use this if you moved cities, changed rent, or rented for only part of the year." },
      ],
      interpret: [
        "Exempt HRA is subtracted from salary in the old regime; enter it in the Income Tax Calculator's HRA field.",
        "If the binding limit is 'rent − 10%', paying more rent would raise the exemption; if it's HRA received or the city limit, it wouldn't.",
        "Taxable HRA is taxed as part of your salary.",
      ],
      useCases: ["Submitting rent proofs to your employer", "Choosing between the old and new regime", "Checking your Form 16", "Seeing the effect of moving cities"],
      limitations: [
        "Old regime only — no HRA exemption is available in the new regime.",
        "Self-employed people can't claim HRA; a separate deduction for rent (80GG in the 1961 Act) isn't covered.",
        "The 2026-27 city list is from secondary sources and marked as such.",
      ],
      mistakes: [
        "Claiming HRA while living in your own home in the same city.",
        "Using gross salary instead of basic + DA as 'salary'.",
        "Not giving your landlord's PAN when rent is more than ₹1 lakh a year.",
        "Expecting HRA exemption in the new regime.",
      ],
    },
    faqs: [
      { q: "How is HRA exemption calculated?", a: "It's the least of: (1) actual HRA received, (2) rent paid minus 10% of salary, and (3) 50% of salary in the listed cities or 40% elsewhere, where salary is basic + DA (if it counts for retirement benefits) + turnover-based commission." },
      { q: "Which cities get the 50% limit in 2026-27?", a: "From 1 April 2026, eight cities: Mumbai, Delhi, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad. In FY 2025-26 only the first four qualified." },
      { q: "Can I claim HRA in the new tax regime?", a: "No. The new regime doesn't allow the HRA exemption; your full HRA is taxable." },
      { q: "Can I claim HRA if I pay rent to my parents?", a: "Generally yes, if you genuinely pay rent, your parent owns the property and declares the rent as income. Rent paid to a spouse is usually not accepted." },
      { q: "Do I need my landlord's PAN?", a: "If your rent is more than ₹1 lakh a year, employers ask for the landlord's PAN before allowing the exemption." },
      { q: "What if I rented only for part of the year?", a: "The exemption is calculated only for the months you paid rent. Use the months field, or the month-by-month table." },
    ],
    related: ["income-tax-calculator", "take-home-salary-calculator", "tds-calculator"],
    searchTerms: ["hra", "house rent allowance", "hra exemption", "rent", "10(13a)", "rule 2a", "metro", "bengaluru hra", "pune hra", "hyderabad hra", "rent receipt"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "tds-calculator",
    name: "TDS Calculator",
    category: "tax",
    alsoIn: ["business"],
    icon: "tds",
    short: "Work out TDS on professional fees, rent, interest and contract payments — thresholds, rates, the no-PAN rate and the right section for the year.",
    intro:
      "Check whether TDS applies to a payment and how much to deduct. Choose the payment type and year; the calculator applies the threshold and rate, handles payments that cross the yearly limit, and shows the section under the 1961 or 2025 Act.",
    what:
      "Tax deducted at source (TDS) is income tax the payer deducts from certain payments and deposits with the government on the payee's behalf. ZSpace Tools' TDS Calculator covers common non-salary payments — professional and technical fees, rent, interest and contract work — for FY 2025-26 and tax year 2026-27.",
    how:
      "The calculator checks the payment against the threshold for its type: per year (fees, interest), per month (rent) or per payment and per year (contracts). When a payment takes the year's total over the limit, TDS is worked out on the total so far. The rate is the normal rate, or at least 20% if the payee hasn't given a PAN.",
    seo: {
      title: "TDS Calculator 2026-27 – TDS on Rent, Professional Fees, Interest & Contracts",
      description:
        "Calculate TDS on professional fees, rent, FD interest and contractor payments for tax year 2026-27 and FY 2025-26. Thresholds, rates, no-PAN rate and sections under the Income-tax Act 2025 (section 393).",
      keyword: "TDS calculator",
      secondary: ["TDS calculator 2026-27", "TDS on rent calculator", "TDS on professional fees", "194J TDS calculator", "194C TDS calculator", "section 393 TDS"],
    },
    features: [
      { title: "Common payment types", body: "Professional and technical fees, rent of buildings and machinery, rent by individuals, interest and contract work." },
      { title: "Thresholds handled", body: "Yearly, monthly and per-payment limits — including the payment that tips the year's total over." },
      { title: "Right section for the year", body: "194-series sections for FY 2025-26; section 393 table entries for 2026-27." },
      { title: "No-PAN rate", body: "Shows the higher TDS when the payee hasn't given a PAN." },
      { title: "Senior-citizen limit", body: "₹1 lakh threshold for bank interest paid to senior citizens." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Choose the payment type", body: "Fees, rent, interest or contract, and the year." },
      { title: "Enter the amounts", body: "This payment and what you've already paid the same payee this year." },
      { title: "Read the TDS", body: "Whether TDS applies, the amount, the net payment and the section." },
    ],
    specs: [
      { label: "Covers", value: "Fees, rent, interest, contracts" },
      { label: "Years", value: "Tax year 2026-27 · FY 2025-26" },
      { label: "Not covered", value: "Salary TDS (use the Income Tax Calculator), non-residents, lower-deduction certificates" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Payment details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "Professional fee of ₹75,000", body: "Above the ₹50,000 yearly threshold, so TDS is 10%: ₹7,500, and ₹67,500 is paid." },
      { title: "Second invoice crosses the limit", body: "A ₹30,000 professional fee after an earlier ₹30,000: the year's total is ₹60,000, so TDS of 10% applies to the full ₹60,000 — ₹6,000 on this payment." },
      { title: "Contractor crossing ₹1 lakh", body: "A ₹25,000 payment to an individual contractor after ₹80,000 earlier takes the year to ₹1,05,000, so 1% TDS on ₹1,05,000 is ₹1,050." },
      { title: "Rent of ₹60,000 a month by a salaried tenant", body: "Above ₹50,000 a month, so 2% TDS: ₹1,200 a month's rent." },
    ],
    guide: {
      inputs: [
        { title: "Type of payment", body: "Each type has its own rate and threshold. Professional fees (doctors, lawyers, CAs) are 10%; technical services 2%." },
        { title: "This payment", body: "The amount being paid now, before GST if GST is shown separately on the invoice." },
        { title: "Earlier payments this year", body: "What you've already paid the same payee in the year, used to check yearly thresholds." },
        { title: "PAN", body: "Without a valid PAN, TDS is generally at least 20%." },
      ],
      interpret: [
        "Amount TDS is worked on can be more than this payment when this payment takes the year over the limit.",
        "Net amount is what you pay the payee now; the TDS goes to the government with the payee's PAN.",
        "The payee claims credit for the TDS in their own tax return.",
      ],
      useCases: ["Paying freelancers and consultants", "Paying rent above ₹50,000 a month", "Checking TDS on fixed-deposit interest", "Paying contractors", "Understanding TDS on your own invoices"],
      limitations: [
        "Doesn't cover salary TDS, payments to non-residents, property purchases, or lower-deduction certificates.",
        "Who must deduct depends on the payer (for example, audit status); check that you're required to.",
        "2026-27 rates and thresholds are from secondary sources and marked as such.",
      ],
      mistakes: [
        "Deducting TDS only on the payment that crosses the limit, not on the year's total so far.",
        "Treating a monthly-rent threshold as yearly.",
        "Deducting at the normal rate when the payee hasn't given a PAN.",
        "Charging TDS on the GST component when GST is shown separately.",
      ],
    },
    faqs: [
      { q: "What is the TDS rate on professional fees?", a: "10% for professional services and 2% for technical services, once payments to the payee exceed ₹50,000 in the year." },
      { q: "When does a tenant have to deduct TDS on rent?", a: "An individual or HUF not liable to audit must deduct 2% when rent exceeds ₹50,000 for a month or part of a month. Businesses that must deduct TDS pay 10% on rent of buildings and 2% on machinery above ₹50,000 a month." },
      { q: "What is the TDS threshold on FD interest?", a: "Banks deduct 10% when interest in the year exceeds ₹50,000, or ₹1 lakh for senior citizens. You can give Form 15G or 15H to avoid TDS if your income is below the taxable limit." },
      { q: "What happens if the payee has no PAN?", a: "TDS is generally deducted at the higher of the normal rate and 20%." },
      { q: "Where is TDS in the Income-tax Act, 2025?", a: "From 1 April 2026 TDS provisions are consolidated in section 393, with a table of payment types replacing the separate 194-series sections. The calculator shows the table entry for each type." },
      { q: "Is TDS the final tax?", a: "No. TDS is an advance; the payee includes the income in their return, claims credit for the TDS and pays any balance or gets a refund." },
    ],
    related: ["income-tax-calculator", "gst-calculator", "invoice-generator", "fd-calculator"],
    searchTerms: ["tds", "tax deducted at source", "194j", "194c", "194i", "194ib", "194a", "section 393", "tds on rent", "tds on fd", "tds rate", "no pan tds", "206aa", "contractor tds"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "epf-calculator",
    name: "EPF Calculator",
    category: "benefits",
    alsoIn: ["payroll", "calculators"],
    icon: "epf",
    short: "Project your Employees' Provident Fund balance with the EPF/EPS split, salary growth, VPF and the declared interest rate.",
    intro:
      "Estimate your EPF balance at retirement. The calculator splits each month's contributions between EPF and the pension scheme (EPS) as EPFO does, grows your salary each year, adds voluntary PF if you like, and credits interest on the monthly running balance.",
    what:
      "The Employees' Provident Fund (EPF) is a retirement savings scheme run by EPFO, where you and your employer each contribute 12% of basic pay plus dearness allowance. ZSpace Tools' EPF Calculator projects your EPF balance year by year and shows separately what goes into the Employees' Pension Scheme.",
    how:
      "Each month, 12% of wages is your contribution; your employer's 12% is split, with 8.33% of wages up to ₹15,000 (at most ₹1,250) going to EPS if you're a member and under 58, and the rest to EPF. Interest is the yearly rate ÷ 12 on each month's closing balance, added up and credited at the end of the year. Wages rise once a year by the increase you enter.",
    seo: {
      title: "EPF Calculator – Provident Fund Balance & Maturity (8.25% Interest)",
      description:
        "Calculate your EPF balance at retirement with the EPF/EPS split, salary growth, VPF and 8.25% interest on the monthly running balance. Year-wise table and contributions included.",
      keyword: "EPF calculator",
      secondary: ["PF calculator", "provident fund calculator", "EPF maturity calculator", "EPF interest calculator", "VPF calculator", "PF balance calculator"],
    },
    features: [
      { title: "EPF and EPS split", body: "8.33% of wages up to ₹15,000 (max ₹1,250) to the pension scheme; the rest to EPF — shown every month." },
      { title: "Ceiling or full basic", body: "Match your employer: PF on the ₹15,000 ceiling or on full basic + DA." },
      { title: "Salary growth and VPF", body: "Yearly increments and voluntary PF on top." },
      { title: "EPFO's interest method", body: "Monthly running balance, credited once a year." },
      { title: "Year-by-year table", body: "Wages, contributions, interest and balance for every year." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter your basic + DA", body: "Monthly wages and whether PF is on full basic or the ₹15,000 ceiling." },
      { title: "Add your details", body: "Age, retirement age, current balance, salary growth and VPF." },
      { title: "Read the projection", body: "Balance at the end, contributions, interest and the yearly table." },
    ],
    specs: [
      { label: "Contributions", value: "12% employee + 12% employer" },
      { label: "EPS", value: "8.33% of wages up to ₹15,000 (max ₹1,250)" },
      { label: "Interest", value: "8.25% (FY 2025-26), editable" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your salary and PF details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹40,000 basic, age 28 to 58", body: "With PF on full basic, 5% yearly raises and 8.25% interest, the EPF balance reaches about ₹2.21 crore: ₹38.27 lakh from you, ₹33.77 lakh from your employer and ₹1.49 crore of interest. ₹4.5 lakh goes to EPS separately." },
      { title: "This month's split on ₹40,000", body: "You contribute ₹4,800; your employer's ₹4,800 splits into ₹1,250 for EPS and ₹3,550 for EPF." },
      { title: "On the ₹15,000 ceiling", body: "₹1,800 from you and ₹550 from your employer go to EPF each month. Over 33 years with no raise, that grows to about ₹45.28 lakh at 8.25%." },
    ],
    guide: {
      inputs: [
        { title: "Basic + DA", body: "PF is calculated on basic pay plus dearness allowance (and retaining allowance), not on HRA or special allowance." },
        { title: "PF basis", body: "The law requires PF on wages up to ₹15,000 a month; many employers contribute on the full amount. EPS is always on the ₹15,000 ceiling." },
        { title: "EPS membership", body: "Members who joined after 1 September 2014 with wages above ₹15,000 aren't in EPS, so the full employer share goes to EPF." },
        { title: "Interest rate", body: "Declared each year by EPFO; 8.25% for 2023-24, 2024-25 and 2025-26. The calculator applies your rate to every future year." },
        { title: "VPF", body: "Voluntary contributions above 12%, earning the same interest. Your employer doesn't match them." },
      ],
      interpret: [
        "The balance is EPF only. EPS builds a monthly pension, not a withdrawable balance, so it's shown separately.",
        "Figures are in future rupees; inflation will reduce what they buy.",
        "Actual interest each year may differ from the rate you enter.",
      ],
      useCases: ["Retirement planning", "Deciding whether to start VPF", "Checking your passbook against expectations", "Seeing the effect of PF on full basic vs the ceiling"],
      limitations: [
        "The EPS pension amount isn't estimated.",
        "Withdrawals, advances and job gaps aren't modelled.",
        "Tax on interest for contributions above ₹2.5 lakh a year isn't deducted.",
        "Establishments on the reduced 10% rate aren't modelled.",
      ],
      mistakes: [
        "Using gross salary or CTC instead of basic + DA.",
        "Adding EPS contributions to the EPF balance.",
        "Assuming the interest rate is fixed for decades.",
        "Withdrawing PF when changing jobs instead of transferring it.",
      ],
    },
    faqs: [
      { q: "How much PF is deducted from salary?", a: "12% of basic pay plus DA. Your employer also contributes 12%, of which up to ₹1,250 a month goes to the pension scheme (EPS) and the rest to your EPF account." },
      { q: "What is the EPF interest rate?", a: "8.25% a year for 2025-26, the same as the two previous years. EPFO declares the rate each financial year after government approval." },
      { q: "How is EPF interest calculated?", a: "Interest is worked out each month at the yearly rate ÷ 12 on the running balance, and the total for the year is credited to your account at the end of the financial year." },
      { q: "Why doesn't all of my employer's contribution show in my EPF passbook?", a: "If you're an EPS member, 8.33% of wages up to ₹15,000 (₹1,250 a month) goes to the Employees' Pension Scheme instead, which pays a monthly pension later." },
      { q: "Is EPF interest taxable?", a: "Interest on your own contributions above ₹2.5 lakh a year (₹5 lakh if your employer doesn't contribute) is taxable. Withdrawals after five years of continuous service are generally tax-free." },
      { q: "What is VPF?", a: "Voluntary Provident Fund lets you contribute more than 12% of basic to EPF. It earns the same interest; your employer doesn't add to it." },
    ],
    related: ["nps-calculator", "gratuity-calculator", "ppf-calculator", "retirement-calculator", "take-home-salary-calculator"],
    searchTerms: ["epf", "pf", "provident fund", "epfo", "eps", "pension scheme", "vpf", "pf interest", "pf balance", "pf maturity", "8.25%", "uan"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "esi-calculator",
    name: "ESI Calculator",
    category: "payroll",
    alsoIn: ["benefits"],
    icon: "esi",
    short: "Work out employee and employer ESI contributions — 0.75% and 3.25% of gross wages — and whether wages are covered.",
    intro:
      "Check whether ESI applies to a salary and how much is deducted. The calculator applies the coverage limit and the April–September / October–March contribution periods, and rounds each share up to the next rupee as the rules require.",
    what:
      "Employees' State Insurance (ESI) is a social security scheme run by ESIC that gives medical care and cash benefits to employees earning up to ₹21,000 a month. ZSpace Tools' ESI Calculator works out the employee's 0.75% and the employer's 3.25% contribution and tells you whether wages fall within the scheme.",
    how:
      "Coverage is decided by wages at the start of each six-month contribution period. If covered, the employee pays 0.75% and the employer 3.25% of gross wages for every month of that period, even if wages rise above the limit during it. Each share is rounded up to the next whole rupee.",
    seo: {
      title: "ESI Calculator – Employee & Employer ESI Contribution (0.75% / 3.25%)",
      description:
        "Calculate ESI contributions: 0.75% employee and 3.25% employer share of gross wages, ₹21,000 coverage limit (₹25,000 for persons with disability), contribution periods and rounding.",
      keyword: "ESI calculator",
      secondary: ["ESIC calculator", "ESI contribution calculator", "ESI deduction calculator", "employee state insurance calculator", "ESI salary limit"],
    },
    features: [
      { title: "Both shares", body: "0.75% employee and 3.25% employer, monthly and for a six-month period." },
      { title: "Coverage checked", body: "₹21,000 a month, or ₹25,000 for employees with a disability." },
      { title: "Contribution periods", body: "Handles a raise above the limit in the middle of a period." },
      { title: "Correct rounding", body: "Each share rounded up to the next rupee." },
      { title: "Rules shown", body: "Rates, limits and their verification status, with sources." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter gross wages", body: "Monthly wages including allowances." },
      { title: "Set special cases", body: "Disability, or wages that changed during the contribution period." },
      { title: "Read the contributions", body: "Employee and employer shares, monthly and for six months." },
    ],
    specs: [
      { label: "Employee", value: "0.75% of gross wages" },
      { label: "Employer", value: "3.25% of gross wages" },
      { label: "Coverage limit", value: "₹21,000 a month (₹25,000 with disability)" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Wages are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹18,000 a month", body: "Employee share 0.75% = ₹135; employer share 3.25% = ₹585; total ₹720 a month." },
      { title: "₹21,000 a month", body: "Exactly at the limit, so covered: ₹157.50 rounds up to ₹158 for the employee and ₹682.50 to ₹683 for the employer." },
      { title: "Raise in the middle of a period", body: "Wages of ₹20,000 in April rising to ₹22,000 in July: ESI continues on ₹22,000 (₹165 employee share) until September, and stops from October." },
    ],
    guide: {
      inputs: [
        { title: "Gross monthly wages", body: "All wages paid in cash for the month, including allowances and overtime, but not employer PF or ESI, gratuity, or annual bonus." },
        { title: "Disability", body: "The coverage limit is ₹25,000 a month for employees with a disability." },
        { title: "Wages at the start of the period", body: "Coverage for April–September is decided by April's wages, and for October–March by October's." },
      ],
      interpret: [
        "The employee share is deducted from salary; the employer share is an extra cost to the employer.",
        "If not covered, no ESI is deducted and medical cover must come from elsewhere.",
      ],
      useCases: ["Running payroll for small businesses", "Checking an ESI deduction on a payslip", "Budgeting staff costs", "Understanding a CTC that includes ESI"],
      limitations: [
        "The exemption from the employee share for average daily wages up to ₹176 isn't modelled.",
        "ESI applies only in notified areas and to establishments with 10 or more employees.",
        "The coverage limit is the long-standing ₹21,000; a fresh notification under the Code on Social Security wasn't found and it's marked unconfirmed.",
      ],
      mistakes: [
        "Calculating ESI on basic pay only — it's on gross wages.",
        "Stopping ESI the month wages cross ₹21,000 instead of at the end of the period.",
        "Rounding to the nearest rupee instead of up.",
      ],
    },
    faqs: [
      { q: "What is the ESI contribution rate?", a: "0.75% of gross wages from the employee and 3.25% from the employer — 4% in total — in effect since 1 July 2019." },
      { q: "What is the ESI salary limit?", a: "Employees earning up to ₹21,000 a month are covered (₹25,000 for persons with a disability)." },
      { q: "What happens if my salary goes above ₹21,000?", a: "You stay covered, and contributions continue, until the end of the current contribution period (September or March). From the next period, ESI stops." },
      { q: "Is ESI calculated on basic or gross salary?", a: "On gross wages — basic plus allowances paid for the month — not on basic alone." },
      { q: "How is ESI rounded?", a: "Each share is rounded up to the next whole rupee." },
      { q: "What benefits does ESI give?", a: "Medical care for you and your family, and cash benefits for sickness, maternity, disablement and dependants. ESIC's website lists the full benefits." },
    ],
    related: ["take-home-salary-calculator", "epf-calculator", "gratuity-calculator"],
    searchTerms: ["esi", "esic", "employees state insurance", "esi contribution", "esi deduction", "0.75%", "3.25%", "esi limit", "21000", "payroll"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "gratuity-calculator",
    name: "Gratuity Calculator",
    category: "benefits",
    alsoIn: ["payroll", "salary"],
    icon: "gratuity",
    short: "Work out gratuity with the 15/26 formula under the Code on Social Security — eligibility, fixed-term rules, the ₹20 lakh cap and the tax-free part.",
    intro:
      "Calculate the gratuity due when you leave a job. Enter last-drawn basic + DA and your length of service; the calculator checks eligibility, rounds service correctly, applies the ₹20 lakh cap and the Labour Code wage rule, and shows how much is tax-free.",
    what:
      "Gratuity is a lump sum an employer pays an employee on leaving after qualifying service, as a reward for long service. ZSpace Tools' Gratuity Calculator applies the formula under the Code on Social Security, 2020 — 15 days' wages for each year of service, with a month counted as 26 days — and works out the tax-free amount.",
    how:
      "Gratuity = last drawn wages × 15 × years of service ÷ 26. For permanent employees, a final part year of more than six months counts as a full year and at least five years' service is needed, except on death or disablement. Fixed-term employees qualify after one year and get gratuity pro rata. The statutory amount is capped at ₹20 lakh. If you choose the Labour Code wage rule, allowances above half your pay are added to wages.",
    seo: {
      title: "Gratuity Calculator 2026 – Gratuity Formula under the New Labour Code",
      description:
        "Calculate gratuity with the 15/26 formula under the Code on Social Security: 5-year and fixed-term eligibility, part-year rounding, ₹20 lakh cap, 50% wage rule and the tax-free amount.",
      keyword: "gratuity calculator",
      secondary: ["gratuity calculation formula", "gratuity calculator new labour code", "gratuity for fixed term employees", "gratuity tax exemption", "gratuity eligibility"],
    },
    features: [
      { title: "Eligibility checked", body: "Five years for permanent staff, one year for fixed-term, none on death or disablement." },
      { title: "Service rounded correctly", body: "More than six months counts as a full year for permanent employees; fixed-term is pro rata." },
      { title: "Dates or years", body: "Enter joining and leaving dates, or years and months." },
      { title: "Labour Code wage rule", body: "Adds back allowances above 50% of pay, as the new definition of wages requires." },
      { title: "Tax-free part", body: "Government, covered and non-covered employees each get the right exemption." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter wages", body: "Last drawn basic + DA, and optionally your total pay for the 50% rule." },
      { title: "Enter service", body: "Years and months, or joining and leaving dates." },
      { title: "Read gratuity and tax", body: "The amount, years counted, and the tax-free and taxable parts." },
    ],
    specs: [
      { label: "Formula", value: "Wages × 15 × years ÷ 26" },
      { label: "Eligibility", value: "5 years · 1 year fixed-term · none on death" },
      { label: "Maximum", value: "₹20,00,000" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your salary and service details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹50,000 basic, 7 years 8 months", body: "The 8 months count as a full year, so 8 years: ₹50,000 × 15 × 8 ÷ 26 = ₹2,30,769, all tax-free." },
      { title: "10 years 6 months", body: "Six months isn't more than six, so 10 years are counted: on ₹50,000, ₹2,88,462." },
      { title: "Fixed-term contract of 2½ years", body: "Pro rata on ₹50,000: ₹50,000 × 15 × 2.5 ÷ 26 = ₹72,115." },
      { title: "The 50% wage rule", body: "Basic ₹40,000 out of total pay of ₹1,00,000: allowances of ₹60,000 exceed half the pay by ₹10,000, so gratuity is worked out on ₹50,000." },
    ],
    guide: {
      inputs: [
        { title: "Last drawn wages", body: "Basic pay plus dearness allowance (and retaining allowance) for the last month." },
        { title: "Total remuneration", body: "For the Labour Code rule: basic plus all allowances. If allowances exceed 50%, the excess is added to wages." },
        { title: "Service", body: "Continuous service with the same employer, including notice period." },
        { title: "Employment type", body: "Permanent employees of covered employers (10 or more employees), fixed-term employees, or employers not covered." },
        { title: "Amount received", body: "If your employer pays more than the formula, enter it to see the taxable part." },
      ],
      interpret: [
        "'Years counted' shows how part years were treated.",
        "The tax-free part depends on whether you're a government employee and whether your employer is covered.",
        "Your employer may pay more than the statutory amount under its own scheme.",
      ],
      useCases: ["Planning a resignation or retirement", "Checking a full-and-final settlement", "Understanding gratuity in CTC", "Fixed-term contracts"],
      limitations: [
        "Seasonal establishments and other special cases aren't modelled.",
        "The ₹20 lakh tax-free limit is assumed to carry over to the Income-tax Act, 2025 and is marked unconfirmed.",
        "Forfeiture for misconduct isn't covered.",
      ],
      mistakes: [
        "Using CTC or gross salary instead of basic + DA.",
        "Assuming 4 years 7 months qualifies — the five-year rule doesn't round up, except on death or disablement.",
        "Dividing by 30 instead of 26 for employers covered by law.",
        "Forgetting that fixed-term employees now qualify after one year.",
      ],
    },
    faqs: [
      { q: "What is the gratuity formula?", a: "Gratuity = last drawn basic + DA × 15 × years of service ÷ 26. It gives 15 days' wages for each year, taking a month as 26 working days." },
      { q: "Who is eligible for gratuity?", a: "Permanent employees with at least five years of continuous service; fixed-term employees after one year; and anyone on death or disablement, regardless of service." },
      { q: "Is 4 years and 8 months counted as 5 years?", a: "For the five-year eligibility, the usual reading is that five completed years are needed, though some court rulings have taken a more lenient view. This calculator requires five completed years. Once eligible, a final part year of more than six months counts as a full year." },
      { q: "What is the maximum gratuity?", a: "The statutory amount is capped at ₹20 lakh. Employers may pay more under their own scheme." },
      { q: "Is gratuity taxable?", a: "For government employees it's fully exempt. For others it's exempt up to the least of the amount received, ₹20 lakh and the statutory amount; anything above is taxed as salary." },
      { q: "What changed under the new Labour Codes?", a: "From 21 November 2025, gratuity comes under the Code on Social Security, 2020: fixed-term employees qualify after one year, and 'wages' follow the rule that allowances above 50% of pay are added back." },
    ],
    related: ["leave-encashment-calculator", "epf-calculator", "take-home-salary-calculator", "income-tax-calculator"],
    searchTerms: ["gratuity", "gratuity formula", "15/26", "payment of gratuity", "labour code", "code on social security", "fixed term gratuity", "gratuity tax", "full and final", "resignation"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "nps-calculator",
    name: "NPS Calculator",
    category: "benefits",
    alsoIn: ["calculators"],
    icon: "nps",
    short: "Project your National Pension System corpus, lump sum and pension under the PFRDA exit rules for private and government subscribers.",
    intro:
      "Estimate your NPS corpus at exit and how it splits into a lump sum and an annuity. The calculator applies the minimum annuity for your exit type — as amended by PFRDA in December 2025 — and estimates the monthly pension from the annuity rate you enter.",
    what:
      "The National Pension System (NPS) is a market-linked retirement scheme regulated by PFRDA. ZSpace Tools' NPS Calculator projects your corpus from monthly contributions and an assumed return, then applies the exit rules to show the lump sum, the annuity purchase and the pension it could buy.",
    how:
      "Your yearly return is converted to a monthly rate; each month's contribution is added and the balance grows. Contributions rise once a year by the step-up you choose. At exit, at least the minimum share for your exit type buys an annuity — unless the corpus is small enough to withdraw in full — and the monthly pension is the annuity amount × annuity rate ÷ 12.",
    seo: {
      title: "NPS Calculator – National Pension System Corpus, Lump Sum & Pension",
      description:
        "Calculate your NPS corpus, lump sum and monthly pension with step-up contributions. Applies the December 2025 PFRDA exit rules: 20% minimum annuity (40% for government), 80% on exit before 60.",
      keyword: "NPS calculator",
      secondary: ["national pension system calculator", "NPS pension calculator", "NPS return calculator", "NPS annuity calculator", "NPS lump sum calculator"],
    },
    features: [
      { title: "Current exit rules", body: "Minimum annuity of 20% (private), 40% (government) or 80% before 60, with full withdrawal for small corpora." },
      { title: "Step-up contributions", body: "Raise your contribution every year." },
      { title: "Lump sum and pension", body: "See the split and the monthly pension from your annuity rate." },
      { title: "Existing balance", body: "Include what's already in your NPS account." },
      { title: "Growth chart", body: "Contributions and growth by age." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter contributions", body: "Monthly amount, yearly increase and current balance." },
      { title: "Set ages and returns", body: "Current age, exit age, expected return and annuity rate." },
      { title: "Choose exit details", body: "Subscriber type, exit type and annuity share." },
    ],
    specs: [
      { label: "Annuity minimum", value: "20% private · 40% govt · 80% before 60" },
      { label: "Full withdrawal", value: "Corpus ≤ ₹8 lakh (₹5 lakh before 60)" },
      { label: "Stay invested", value: "Up to age 85" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your contributions are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹5,000 a month from 30 to 60", body: "With a 5% yearly step-up and 9% returns, about ₹39.86 lakh contributed grows to about ₹1.41 crore. With a 20% annuity, that's a lump sum of about ₹1.13 crore and roughly ₹14,064 a month in pension at a 6% annuity rate." },
      { title: "Small corpus", body: "If the corpus at a normal exit is ₹8 lakh or less, all of it can be withdrawn without buying an annuity." },
    ],
    guide: {
      inputs: [
        { title: "Monthly contribution", body: "Your contribution plus any employer contribution." },
        { title: "Expected return", body: "An assumption. NPS returns depend on markets and your mix of equity, corporate bonds and government securities." },
        { title: "Subscriber type and exit", body: "Private (all-citizen and corporate) and government subscribers have different minimum annuities; exiting before 60 requires 80%." },
        { title: "Annuity share and rate", body: "You can annuitise more than the minimum. Annuity rates are quoted by insurers at exit and depend on age and the option chosen." },
      ],
      interpret: [
        "The corpus is in future rupees — inflation will reduce what it buys.",
        "The pension is an estimate from the annuity rate you enter; actual annuity rates at exit may differ.",
        "If the annuity share is below the minimum for your exit, the calculator raises it.",
      ],
      useCases: ["Retirement planning", "Comparing NPS with EPF or PPF", "Deciding how much to annuitise", "Planning contributions for tax benefits"],
      limitations: [
        "Returns are assumed constant; real returns vary.",
        "Tax on withdrawals and pension isn't calculated.",
        "Partial withdrawals and the systematic lump-sum withdrawal option aren't modelled.",
        "Exit rules are from secondary sources and marked as such.",
      ],
      mistakes: [
        "Treating the expected return as guaranteed.",
        "Ignoring inflation when judging the pension.",
        "Forgetting that exiting before 60 locks 80% into an annuity.",
      ],
    },
    faqs: [
      { q: "How much of my NPS corpus can I withdraw?", a: "Under the PFRDA amendments notified in December 2025, private subscribers must use at least 20% for an annuity at normal exit and can take up to 80% as a lump sum; government subscribers must annuitise at least 40%. A corpus of ₹8 lakh or less can be withdrawn fully." },
      { q: "What if I exit NPS before 60?", a: "At least 80% must buy an annuity, unless the corpus is ₹5 lakh or less, when you can withdraw it all." },
      { q: "What return does NPS give?", a: "It depends on markets and your asset mix. Use a conservative assumption — the calculator doesn't predict returns." },
      { q: "How is NPS pension calculated?", a: "The annuity share of your corpus buys an annuity from an insurer; the pension is roughly the annuity amount × the annuity rate ÷ 12." },
      { q: "Is NPS tax-free?", a: "Employer contributions are deductible in both regimes within limits; own contributions only in the old regime. The pension is taxable, and part of the lump sum has been tax-free. Check current rules for large lump sums." },
    ],
    related: ["epf-calculator", "retirement-calculator", "ppf-calculator", "income-tax-calculator"],
    searchTerms: ["nps", "national pension system", "pension", "annuity", "pfrda", "nps withdrawal", "nps lump sum", "80ccd", "tier 1", "retirement"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "salary-hike-calculator",
    name: "Salary Hike Calculator",
    category: "salary",
    icon: "hike",
    short: "Find your hike percentage from old and new salary, or your new salary from a hike — with the real hike after inflation.",
    intro:
      "Work out a salary hike either way: from your old and new salary to the percentage, or from a percentage to your new salary. Add inflation to see whether the raise actually increases what you can buy.",
    what:
      "A salary hike calculator works out the percentage increase between two salaries, or the new salary after a given increase. ZSpace Tools' Salary Hike Calculator also shows the yearly and monthly difference and the real hike after inflation.",
    how:
      "Hike % = (new − old) ÷ old × 100; new salary = old × (1 + hike ÷ 100). The real hike = (1 + hike) ÷ (1 + inflation) − 1, which is what the raise means in purchasing power.",
    seo: {
      title: "Salary Hike Calculator – Hike Percentage & New Salary",
      description:
        "Calculate your salary hike percentage from old and new salary, or your new salary from a hike %. See the monthly and yearly increase and the real hike after inflation.",
      keyword: "salary hike calculator",
      secondary: ["hike percentage calculator", "salary increment calculator", "appraisal hike calculator", "salary increase calculator", "real salary increase"],
    },
    features: [
      { title: "Both directions", body: "Old and new salary to %, or salary and % to the new salary." },
      { title: "Monthly or yearly", body: "Enter either; see both increases." },
      { title: "Real hike", body: "Adjust for inflation to see the raise in purchasing power." },
      { title: "Pay cuts too", body: "Negative hikes are shown clearly." },
      { title: "Copy and print", body: "Share the numbers in an appraisal discussion." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Choose what you know", body: "Old and new salary, or salary and hike %." },
      { title: "Enter the figures", body: "Yearly or monthly, plus inflation if you like." },
      { title: "Read the result", body: "Hike %, new salary, increase and real hike." },
    ],
    specs: [
      { label: "Hike %", value: "(new − old) ÷ old × 100" },
      { label: "Real hike", value: "(1 + hike) ÷ (1 + inflation) − 1" },
      { label: "Input", value: "Yearly or monthly" },
    ],
    formats: ["INR"],
    privacy: "Your salary figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹10 lakh to ₹11.5 lakh", body: "A 15% hike: ₹1,50,000 more a year, or ₹12,500 a month." },
      { title: "10% on ₹8 lakh", body: "New salary ₹8,80,000 — ₹80,000 more a year." },
      { title: "10% hike with 6% inflation", body: "The real hike is about 3.77%, not 10%." },
    ],
    guide: {
      inputs: [
        { title: "Current and new salary", body: "Compare like with like — CTC with CTC, or fixed pay with fixed pay." },
        { title: "Hike %", body: "The percentage increase offered. Use a negative number for a cut." },
        { title: "Inflation", body: "Optional. Use expected consumer price inflation to see the real hike." },
      ],
      interpret: [
        "A hike on CTC doesn't raise in-hand pay by the same percentage — tax and PF change too.",
        "A real hike below zero means your pay buys less than before.",
      ],
      useCases: ["Evaluating an appraisal", "Negotiating a job offer", "Comparing raises across years", "Checking whether you've kept up with inflation"],
      limitations: ["Doesn't calculate tax or in-hand pay — use the Take-Home Salary Calculator.", "Inflation is an assumption you enter."],
      mistakes: ["Comparing a new CTC with old in-hand pay.", "Including a one-time joining bonus in the hike.", "Ignoring inflation when judging the raise."],
    },
    faqs: [
      { q: "How do I calculate my hike percentage?", a: "Subtract your old salary from your new salary, divide by the old salary and multiply by 100. From ₹10 lakh to ₹11.5 lakh is (11.5 − 10) ÷ 10 × 100 = 15%." },
      { q: "How do I calculate new salary after a hike?", a: "Multiply your current salary by (1 + hike ÷ 100). A 12% hike on ₹9 lakh gives ₹10,08,000." },
      { q: "What is a real salary hike?", a: "Your hike adjusted for inflation: (1 + hike) ÷ (1 + inflation) − 1. A 10% raise with 6% inflation is a 3.77% real increase." },
      { q: "Why didn't my in-hand pay rise by the hike %?", a: "Higher pay can move you into a higher tax slab, and PF rises with basic, so in-hand pay usually rises by less than CTC." },
    ],
    related: ["take-home-salary-calculator", "income-tax-calculator", "inflation-calculator", "percentage-calculator"],
    searchTerms: ["salary hike", "hike percentage", "increment", "appraisal", "raise", "salary increase", "pay rise", "real hike", "new salary"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "leave-encashment-calculator",
    name: "Leave Encashment Calculator",
    category: "benefits",
    alsoIn: ["payroll", "tax"],
    icon: "leave",
    short: "Work out leave encashment and how much is tax-free on retirement or resignation — the ₹25 lakh limit and all four tests.",
    intro:
      "Calculate the value of your unused leave and the part that's tax-free. Enter leave days and salary; for encashment on leaving, the calculator applies the four limits for non-government employees, including the ₹25 lakh ceiling.",
    what:
      "Leave encashment is the payment for earned leave you haven't used, made during service or when you leave. ZSpace Tools' Leave Encashment Calculator works out the amount from your salary and leave days, and the tax exemption under section 10(10AA) of the 1961 Act — carried into the Income-tax Act, 2025.",
    how:
      "Encashment = monthly salary ÷ days in a month (30, 26 or your employer's figure) × leave days. On leaving, non-government employees get an exemption up to the least of the amount received, ₹25 lakh, 10 months' average salary, and unused leave credit (at most 30 days for each year of service) × average daily salary. Government employees are fully exempt on retirement; encashment while in service is fully taxable.",
    seo: {
      title: "Leave Encashment Calculator – Amount & Tax Exemption (₹25 Lakh Limit)",
      description:
        "Calculate leave encashment and the tax-free amount on retirement or resignation: ₹25 lakh limit, 10 months' average salary, 30 days a year leave credit. Government and in-service rules included.",
      keyword: "leave encashment calculator",
      secondary: ["leave encashment tax calculator", "leave encashment exemption", "10(10AA) calculator", "earned leave encashment", "leave salary calculator"],
    },
    features: [
      { title: "Amount and tax", body: "The encashment value and the tax-free and taxable parts." },
      { title: "All four limits", body: "Amount received, ₹25 lakh, 10 months' average salary and leave credit — the least is shown." },
      { title: "Your employer's divisor", body: "30 days, 26 working days or any other figure." },
      { title: "Government and in-service", body: "Fully exempt for government retirees; fully taxable while in service." },
      { title: "Leave credit capped", body: "At most 30 days for each year of service, as the rule requires." },
      { title: "Private", body: "Calculated in your browser; nothing is uploaded." },
    ],
    steps: [
      { title: "Enter leave and salary", body: "Days to encash and the monthly salary your employer uses." },
      { title: "Say when it's paid", body: "On leaving or during service; government or not." },
      { title: "Add service details", body: "Average salary, years of service and leave earned and taken." },
    ],
    specs: [
      { label: "Encashment", value: "Salary ÷ 30 (or 26) × days" },
      { label: "Tax-free limit", value: "₹25,00,000 (non-government, lifetime)" },
      { label: "Leave credit", value: "Up to 30 days per year of service" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your salary and leave details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "120 days at ₹60,000 a month", body: "₹60,000 ÷ 30 × 120 = ₹2,40,000. With 12 years' service, 30 days earned a year and 200 days taken, the leave credit is 160 days (₹3,20,000), so the whole ₹2,40,000 is tax-free." },
      { title: "26-day divisor", body: "10 days on ₹60,000 a month is ₹23,077 with a 26-day month, against ₹20,000 with 30." },
      { title: "Encashed while working", body: "Encashment during service is fully taxable as salary, whatever the amount." },
    ],
    guide: {
      inputs: [
        { title: "Leave days and salary", body: "Your employer's leave policy decides which salary (usually basic + DA) and how many days in a month." },
        { title: "Average salary", body: "For the tax limit: average monthly basic + DA (if part of retirement benefits) + turnover commission over the 10 months before leaving." },
        { title: "Leave earned and taken", body: "Leave earned per year (only 30 days count) × completed years, minus leave taken or encashed during service, gives the leave credit." },
      ],
      interpret: [
        "The tax-free part is the least of the four limits; the rest is taxed as salary.",
        "The ₹25 lakh limit is for your whole career; exemptions claimed with earlier employers reduce it.",
      ],
      useCases: ["Planning retirement or resignation", "Checking a full-and-final settlement", "Deciding whether to encash or use leave", "Understanding Form 16 entries"],
      limitations: [
        "Exemptions used with earlier employers aren't tracked — reduce the limit yourself if needed.",
        "Rules for the Income-tax Act, 2025 are from secondary sources and marked as such.",
        "Leave encashment on death (paid to heirs) isn't covered.",
      ],
      mistakes: [
        "Counting more than 30 days of leave a year in the leave credit.",
        "Assuming encashment during service is tax-free.",
        "Forgetting earlier employers' exemptions count towards the ₹25 lakh limit.",
      ],
    },
    faqs: [
      { q: "How is leave encashment calculated?", a: "Monthly salary (usually basic + DA) ÷ days in a month × unused leave days. Employers use 30 or 26 days per month depending on policy." },
      { q: "Is leave encashment taxable?", a: "During service it's fully taxable. On retirement or resignation, government employees are fully exempt; others are exempt up to the least of the amount received, ₹25 lakh, 10 months' average salary and leave credit × average salary." },
      { q: "What is the leave encashment exemption limit?", a: "₹25 lakh for non-government employees, raised from ₹3 lakh with effect from 1 April 2023. It's a lifetime limit across all employers." },
      { q: "How is leave credit worked out for the exemption?", a: "Leave earned for each completed year of service, counting at most 30 days a year, minus leave taken or encashed during service." },
      { q: "Does resignation count, or only retirement?", a: "The exemption applies on retirement, including resignation, as long as you're leaving the employer." },
    ],
    related: ["gratuity-calculator", "income-tax-calculator", "take-home-salary-calculator", "epf-calculator"],
    searchTerms: ["leave encashment", "earned leave", "privilege leave", "leave salary", "10(10aa)", "25 lakh", "full and final", "resignation", "retirement", "unused leave"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "home-loan-eligibility-calculator",
    name: "Home Loan Eligibility Calculator",
    category: "loans",
    alsoIn: ["property"],
    icon: "loan-eligibility",
    short: "Estimate how much home loan you may get from your income, existing EMIs, age and the property's value — with RBI loan-to-value limits applied.",
    intro:
      "Find out roughly how much a lender might lend you for a home. The calculator works out the EMI your income can support, turns it into a loan amount, then checks it against the RBI loan-to-value cap and your down payment — and shows which limit decides the answer.",
    what:
      "A home loan eligibility calculator estimates the largest housing loan you could qualify for. ZSpace Tools' calculator uses an editable fixed-obligations-to-income ratio (FOIR), your and a co-applicant's income and EMIs, the years left before the loan must end, and the RBI's loan-to-value limits to give an indicative amount, EMI and total cost.",
    how:
      "Combined net income × FOIR gives the most you could spend on all EMIs; existing EMIs of both applicants are subtracted once. That EMI room, over the shorter of your preferred tenure, the lender's longest tenure and the years until the loan must end, is converted into a loan with the present-value formula. The result is capped by the RBI LTV limit for that loan size and by the property value minus your down payment; the lowest figure is the estimate.",
    seo: {
      title: "Home Loan Eligibility Calculator – How Much Home Loan Can I Get?",
      description:
        "Estimate your home loan eligibility from salary, existing EMIs, age and property value. Editable FOIR, co-applicant income, RBI loan-to-value limits, EMI, total interest and the limit that applies.",
      keyword: "home loan eligibility calculator",
      secondary: ["how much home loan can I get", "home loan eligibility by salary", "home loan eligibility India", "FOIR calculator", "joint home loan eligibility"],
    },
    features: [
      { title: "Three limits, one answer", body: "Repayment capacity, the RBI loan-to-value cap and your down payment — the lowest decides, and you see which." },
      { title: "FOIR you control", body: "Lenders use different ratios; set your own instead of trusting one 'rule'." },
      { title: "Co-applicant", body: "Adds a co-applicant's income and EMIs once, never twice." },
      { title: "Age-aware tenure", body: "The tenure stops at the age the loan must end by." },
      { title: "Salaried or self-employed", body: "Guidance for each, with the same transparent maths." },
      { title: "Private", body: "Your income never leaves your browser." },
    ],
    steps: [
      { title: "Enter income and EMIs", body: "Net monthly income, other income and existing EMIs — and a co-applicant's if any." },
      { title: "Add age, rate and property", body: "Your age, the age the loan must end by, the rate, property value and down payment." },
      { title: "Read the estimate", body: "Indicative loan, EMI, LTV, total interest and how it was worked out." },
    ],
    specs: [
      { label: "Method", value: "FOIR → EMI room → present value, capped by LTV and down payment" },
      { label: "LTV caps", value: "90% ≤ ₹30L · 80% ≤ ₹75L · 75% above (RBI)" },
      { label: "FOIR", value: "Editable assumption (default 50%)" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Your income and loan details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 lakh salary, ₹10,000 existing EMI (hypothetical)", body: "At a 50% FOIR the EMI room is ₹40,000. Over 20 years at 8.5% that supports a loan of about ₹46,09,200 — less than the LTV cap on an ₹80 lakh home, so repayment capacity decides. Total interest is about ₹49.9 lakh." },
      { title: "Adding a co-applicant earning ₹60,000", body: "The EMI room rises to ₹70,000, but on an ₹80 lakh home with ₹16 lakh down the loan stops at ₹64 lakh — the 80% LTV cap — with an EMI of about ₹55,541." },
      { title: "Closer to retirement", body: "At 52 with the loan ending by 60, only 8 years are available, so the same EMI supports a much smaller loan." },
    ],
    guide: {
      inputs: [
        { title: "Net income", body: "Take-home pay for salaried applicants; for the self-employed, the average monthly income lenders accept from recent tax returns." },
        { title: "Existing EMIs and obligations", body: "Every EMI you're paying, plus other fixed dues lenders count. They come out of the FOIR room first." },
        { title: "FOIR", body: "The share of income a lender lets all EMIs take. It varies by lender and income — treat it as an assumption." },
        { title: "Age and loan end age", body: "Lenders usually want the loan repaid by retirement for salaried borrowers, later for the self-employed." },
        { title: "Property value and down payment", body: "Use the agreement value. RBI excludes stamp duty and registration from the value for LTV (except for homes up to ₹10 lakh)." },
      ],
      interpret: [
        "The limiting factor tells you what to change: more income or fewer EMIs for capacity; a bigger down payment for LTV.",
        "The estimate isn't an approval — credit score, employer, property valuation and documents all matter.",
        "Total interest is over the full tenure at a constant rate; floating rates change.",
      ],
      useCases: ["Setting a house-hunting budget", "Deciding whether to add a co-applicant", "Seeing how closing a loan raises eligibility", "Comparing tenures"],
      limitations: [
        "FOIR and maximum tenure are assumptions; each lender sets its own.",
        "Housing finance companies follow separate RBI directions that weren't checked here.",
        "Credit score, employer category and property type aren't modelled.",
      ],
      mistakes: [
        "Using gross salary instead of take-home pay.",
        "Forgetting car, personal or credit-card EMIs.",
        "Assuming the bank will fund stamp duty and registration.",
        "Treating the maximum eligible loan as the amount you can comfortably repay.",
      ],
    },
    faqs: [
      { q: "How much home loan can I get on my salary?", a: "Roughly: the EMI you can afford (a share of your take-home pay minus existing EMIs) converted into a loan at the lender's rate and tenure, and then capped by the loan-to-value limit on the property. Enter your figures to see the estimate and which limit applies." },
      { q: "What is FOIR?", a: "Fixed obligations to income ratio — the share of your net income that all EMIs, including the new one, may take. Lenders set it themselves, often depending on income level, so the calculator lets you change it." },
      { q: "What are the RBI loan-to-value limits for home loans?", a: "Banks can lend up to 90% of the property value for loans up to ₹30 lakh, 80% for loans above ₹30 lakh up to ₹75 lakh, and 75% above ₹75 lakh. Stamp duty and registration are excluded from the value, except for homes costing up to ₹10 lakh." },
      { q: "Does a co-applicant increase eligibility?", a: "Usually, because their income is added. Their existing EMIs are subtracted too, so a co-applicant with large EMIs may add little." },
      { q: "Is this an approval?", a: "No. It's an estimate. Lenders also assess your credit history, job or business stability, the property's legal and technical valuation and your documents." },
    ],
    related: ["emi-calculator", "home-loan-prepayment-calculator", "down-payment-calculator", "debt-to-income-ratio-calculator", "loan-affordability-calculator"],
    searchTerms: ["home loan eligibility", "how much home loan", "housing loan eligibility", "foir", "ltv", "loan to value", "joint home loan", "home loan by salary", "co-applicant"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "home-loan-prepayment-calculator",
    name: "Home Loan Prepayment Calculator",
    category: "loans",
    icon: "prepayment",
    short: "See how much interest and time one-time or regular prepayments save on your home loan — cut tenure or cut EMI, with scenarios side by side.",
    intro:
      "Find out what part-prepaying your home loan really saves. Add one-time or recurring prepayments, choose whether they cut your tenure or your EMI, compare up to three scenarios and see the month-wise schedule — with prepayments before or after an EMI handled differently, as they should be.",
    what:
      "A home loan prepayment calculator shows how paying extra towards the principal reduces interest and loan tenure. ZSpace Tools' calculator runs a month-by-month amortisation of your remaining loan with and without your prepayments, and reports interest saved, months saved, the new closure date and, if you choose, the reduced EMI.",
    how:
      "Each month, interest is the outstanding balance × rate ÷ 12, rounded to the paisa, and the rest of the EMI repays principal. A prepayment made before an EMI reduces that month's interest; one made after it saves interest from the next month. To cut tenure, the EMI stays and the loan ends sooner; to cut EMI, it's recalculated over the remaining original term after each prepayment. Any prepayment charge you enter is added on top.",
    seo: {
      title: "Home Loan Prepayment Calculator – Interest Saved & Tenure Reduced",
      description:
        "Calculate how much interest and how many months home loan prepayment saves. One-time or monthly, quarterly and yearly prepayments, reduce tenure or EMI, compare scenarios and download the schedule.",
      keyword: "home loan prepayment calculator",
      secondary: ["home loan interest saving calculator", "how to reduce home loan tenure", "part payment calculator", "home loan foreclosure calculator", "reduce EMI or tenure"],
    },
    features: [
      { title: "Recurring or one-time", body: "Monthly, quarterly, half-yearly, yearly or one-off prepayments — several in one scenario." },
      { title: "Cut tenure or EMI", body: "See both choices; cutting tenure usually saves more interest." },
      { title: "Timing that matters", body: "A prepayment before an EMI saves a little more than one after it — calculated, not assumed." },
      { title: "Up to three scenarios", body: "Compare plans side by side with a balance chart." },
      { title: "Closure date", body: "Original and revised closure month from your next EMI date." },
      { title: "Schedule and CSV", body: "Month-wise or yearly amortisation, downloadable." },
    ],
    steps: [
      { title: "Enter your loan today", body: "Outstanding principal, rate, remaining tenure and your next EMI month." },
      { title: "Add prepayments", body: "Amount, frequency and when they start — and whether they cut tenure or EMI." },
      { title: "Compare", body: "Interest saved, months saved and the new closure date for each scenario." },
    ],
    specs: [
      { label: "Method", value: "Monthly reducing balance, paise rounding" },
      { label: "Prepayments", value: "One-time, monthly, quarterly, half-yearly, yearly" },
      { label: "Outcomes", value: "Reduce tenure or reduce EMI" },
      { label: "Export", value: "CSV schedule, print" },
    ],
    formats: ["INR", "CSV"],
    privacy: "Your loan details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹5 lakh once (hypothetical)", body: "On ₹45 lakh outstanding at 8.5% with 18 years left (EMI ₹40,745.59), a ₹5 lakh prepayment after the 12th EMI cuts interest from ₹43,01,045 to ₹29,97,129 — saving about ₹13.04 lakh — and the loan ends 44 months sooner." },
      { title: "₹10,000 extra every month", body: "Paying ₹10,000 extra from the 12th EMI saves about ₹15.09 lakh of interest and closes the loan 70 months (5 years 10 months) early." },
      { title: "Before or after the EMI", body: "On a ₹50 lakh, 20-year loan at 8.5%, ₹5 lakh paid just before the 12th EMI saves about ₹12,618 more than the same amount paid just after it." },
    ],
    guide: {
      inputs: [
        { title: "Outstanding principal", body: "From your latest statement — not the original loan amount." },
        { title: "Current EMI", body: "Leave blank to use the formula EMI for the balance and remaining tenure; enter it if your lender's EMI differs." },
        { title: "Prepayment plan", body: "Each line has an amount, frequency, the EMI number it starts with and, for recurring ones, an optional last EMI number." },
        { title: "Before or after the EMI", body: "Before: the prepayment lands before that month's interest is charged. After: it lands once the EMI is paid." },
        { title: "Cut tenure or EMI", body: "Lenders usually let you choose. Cutting tenure saves more interest; cutting EMI frees monthly cash." },
      ],
      interpret: [
        "Interest saved is compared with continuing your current EMI with no prepayments.",
        "The revised closure date counts from the next EMI month you chose.",
        "Prepayment charges reduce the net saving; floating-rate home loans to individuals generally don't carry them.",
      ],
      useCases: ["Deciding what to do with a bonus", "Choosing between cutting EMI or tenure", "Planning a regular top-up", "Comparing prepayment with investing"],
      limitations: [
        "The rate is assumed constant for the rest of the loan.",
        "Lenders apply prepayments and recalculations on their own dates and roundings.",
        "Tax effects of home-loan deductions aren't included.",
      ],
      mistakes: [
        "Using the original loan amount instead of the outstanding balance.",
        "Choosing 'reduce EMI' when the aim is to save the most interest.",
        "Prepaying with money set aside for emergencies.",
      ],
    },
    faqs: [
      { q: "Is it better to reduce EMI or tenure after prepayment?", a: "Reducing tenure usually saves more interest because the higher EMI keeps repaying principal faster. Reducing EMI eases monthly cash flow. The calculator shows both." },
      { q: "When should I prepay my home loan?", a: "Earlier is better: in the first years most of each EMI is interest, so every rupee prepaid then saves the most." },
      { q: "Are there charges for prepaying a home loan?", a: "RBI doesn't allow banks to charge foreclosure or prepayment penalties on floating-rate home loans to individual borrowers. Fixed-rate loans may carry a charge — check your agreement and enter it if so." },
      { q: "Does paying before the EMI date make a difference?", a: "A little. Paid before an EMI, the prepayment reduces that month's interest; paid after, it starts saving from the next month." },
      { q: "Can I prepay more than the outstanding amount?", a: "No — the calculator caps a prepayment at what's outstanding and closes the loan that month." },
    ],
    related: ["emi-calculator", "home-loan-eligibility-calculator", "loan-affordability-calculator", "rent-vs-buy-calculator"],
    searchTerms: ["prepayment", "part payment", "home loan prepayment", "foreclosure", "reduce tenure", "reduce emi", "interest saving", "extra emi", "home loan closure"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "car-loan-calculator",
    name: "Car Loan Calculator",
    category: "loans",
    icon: "car-loan",
    short: "Work out your car loan EMI from the on-road price and down payment — with interest, fees and the true total cost of the car.",
    intro:
      "Calculate the EMI and full cost of financing a new or used car. Build the on-road price from ex-showroom, registration, insurance and accessories, subtract your down payment, add the lender's fees, and see the cash you need on day one and what the car really costs.",
    what:
      "A car loan calculator works out the monthly EMI and total interest on a vehicle loan. ZSpace Tools' Car Loan Calculator also adds processing fees and GST, shows the cash needed at purchase and the total cost of the car, and gives a full amortisation schedule.",
    how:
      "On-road price = ex-showroom + registration and road tax + insurance + accessories + other costs. Loan = on-road price − down payment (or enter the loan directly). The EMI uses the reducing-balance formula at the monthly rate. Fees and GST are added to the cash needed at purchase and to the cost of borrowing.",
    seo: {
      title: "Car Loan EMI Calculator – Interest, Down Payment & Total Cost",
      description:
        "Calculate your car loan EMI from on-road price and down payment. See total interest, processing fee with GST, cash needed upfront, the total cost of the car and a full repayment schedule.",
      keyword: "car loan EMI calculator",
      secondary: ["car loan calculator", "car loan interest calculator", "car loan down payment calculator", "used car loan EMI", "vehicle loan calculator"],
    },
    features: [
      { title: "On-road price built up", body: "Ex-showroom, registration, insurance, accessories and other costs." },
      { title: "Price or loan amount", body: "Start from the car's price, or enter the loan you've been offered." },
      { title: "Fees included", body: "Processing fee (amount or %) plus GST, and other loan charges." },
      { title: "True total cost", body: "On-road price + interest + charges, and the cash you need upfront." },
      { title: "Schedule and CSV", body: "Yearly or monthly amortisation with a principal-vs-interest chart." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Enter the price", body: "Ex-showroom and other costs from the dealer's quote, and your down payment." },
      { title: "Enter the loan terms", body: "Rate, tenure and fees from the lender's offer." },
      { title: "Read the cost", body: "EMI, interest, upfront cash and total cost." },
    ],
    specs: [
      { label: "EMI", value: "Reducing balance, monthly" },
      { label: "Fees", value: "Fixed or % processing fee + GST, other charges" },
      { label: "Output", value: "EMI, interest, upfront cash, total cost, schedule" },
    ],
    formats: ["INR", "CSV"],
    privacy: "Your figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹9 lakh car (hypothetical)", body: "With ₹90,000 registration, ₹45,000 insurance and ₹20,000 accessories, the on-road price is ₹10,55,000. After ₹2,50,000 down, the loan is ₹8,05,000; at 9% for 5 years the EMI is ₹16,710.48 and interest about ₹1,97,628." },
      { title: "Fees add up", body: "A ₹5,000 processing fee with 18% GST adds ₹5,900 to the cash you need on the day you buy." },
    ],
    guide: {
      inputs: [
        { title: "Ex-showroom and on-road costs", body: "Take them from the dealer's quote; registration and road tax vary by state." },
        { title: "Down payment", body: "Lenders finance different shares of the price, often less for used cars." },
        { title: "Interest rate", body: "Use the reducing-balance rate. If you're quoted a flat rate, ask for the reducing equivalent — it's higher." },
        { title: "Fees", body: "Processing fee as an amount or a %, GST on it, and any documentation or stamp charges." },
      ],
      interpret: [
        "Total cost of the car is everything you'll pay: on-road price, interest and loan charges.",
        "Cash needed at purchase is the down payment plus loan fees.",
      ],
      useCases: ["Comparing loan offers", "Choosing a down payment", "Deciding on tenure", "Budgeting a used-car purchase"],
      limitations: ["Rates and fees are what you enter — lenders' offers vary.", "Balloon and step-up EMI products aren't modelled.", "Insurance renewals and running costs aren't included."],
      mistakes: ["Comparing a flat rate with a reducing rate.", "Forgetting registration and insurance in the price.", "Choosing the longest tenure without seeing the extra interest."],
    },
    faqs: [
      { q: "How is car loan EMI calculated?", a: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan, r the monthly rate (annual ÷ 12) and n the number of months." },
      { q: "How much down payment do I need for a car?", a: "It depends on the lender and car; lenders finance different shares of the price, often less for used cars. A larger down payment cuts the EMI and total interest." },
      { q: "What's the difference between a flat and reducing rate?", a: "A flat rate charges interest on the original loan for the whole tenure; a reducing rate charges it only on what's outstanding. The same number as a flat rate costs much more." },
      { q: "Should I include insurance and registration in the loan?", a: "Some lenders finance on-road price, others only ex-showroom. Use the price and down payment that match your offer." },
    ],
    related: ["emi-calculator", "down-payment-calculator", "loan-affordability-calculator", "personal-loan-calculator"],
    searchTerms: ["car loan", "vehicle loan", "auto loan", "car emi", "used car loan", "on road price", "car down payment", "car finance"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "personal-loan-calculator",
    name: "Personal Loan Calculator",
    category: "loans",
    icon: "personal-loan",
    short: "Personal loan EMI, interest, processing fee with GST, the amount actually credited and the effective annual rate including fees.",
    intro:
      "Work out the real cost of a personal loan. Enter the amount, rate, tenure and fees to see your EMI, the money that actually reaches your account after deductions, the total you'll repay and the effective annual rate once fees are counted.",
    what:
      "A personal loan calculator estimates the EMI and total cost of an unsecured loan. ZSpace Tools' calculator separates the loan principal, the net amount disbursed after fees and the total repaid, and calculates an effective annual rate from the actual cash flows.",
    how:
      "The EMI uses the reducing-balance formula on the full principal. Processing fee (a % or fixed amount) plus GST and other charges are deducted from the disbursal or paid separately. The effective rate is the monthly rate at which the amount you receive equals the present value of your EMIs, annualised as (1 + i)^12 − 1.",
    seo: {
      title: "Personal Loan EMI Calculator – Interest, Fees & Effective Rate",
      description:
        "Calculate personal loan EMI, total interest, processing fee with GST, net amount credited and the effective annual rate including fees. Full repayment schedule with CSV download.",
      keyword: "personal loan EMI calculator",
      secondary: ["personal loan calculator", "personal loan interest calculator", "personal loan repayment calculator", "processing fee calculator", "effective interest rate personal loan"],
    },
    features: [
      { title: "Net disbursal", body: "Principal, fees deducted and what's actually credited — shown separately." },
      { title: "Fees with GST", body: "Processing fee as % or amount, GST and other charges." },
      { title: "Effective annual rate", body: "From real cash flows, so fees show up in the rate." },
      { title: "Full schedule", body: "Monthly or yearly, with CSV download." },
      { title: "No preset rates", body: "You enter your offer's rate and fees — nothing hard-coded." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Enter the loan", body: "Amount, rate and tenure in months or years." },
      { title: "Enter the fees", body: "Processing fee, GST and other charges, and whether they're deducted." },
      { title: "Read the cost", body: "EMI, net amount, total repaid and effective rate." },
    ],
    specs: [
      { label: "EMI", value: "Reducing balance on full principal" },
      { label: "Effective rate", value: "Monthly IRR of cash flows, annualised" },
      { label: "Output", value: "EMI, net disbursal, interest, fees, schedule" },
    ],
    formats: ["INR", "CSV"],
    privacy: "Your loan details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹5 lakh for 3 years at 12% (hypothetical)", body: "The EMI is ₹16,607.15 and interest about ₹97,857. A 2% fee (₹10,000) plus 18% GST (₹1,800) deducted upfront means ₹4,88,200 is credited, and the effective annual rate rises to about 14.56%." },
      { title: "Same loan, no fees", body: "With no fees, 12% a year charged monthly is an effective 12.68% a year." },
    ],
    guide: {
      inputs: [
        { title: "Rate", body: "The reducing-balance annual rate in your offer." },
        { title: "Fees", body: "Processing fee as a % or amount, GST on it (usually 18%) and other charges such as insurance." },
        { title: "Deducted or paid separately", body: "Most lenders credit the loan minus fees; interest is still charged on the full principal." },
      ],
      interpret: [
        "Net amount credited is what you can actually use.",
        "Effective annual rate lets you compare offers with different fees.",
      ],
      useCases: ["Comparing personal loan offers", "Choosing a tenure", "Checking what will actually be credited", "Budgeting the EMI"],
      limitations: ["Rate assumed fixed.", "Prepayment and late-payment charges aren't modelled.", "EMI dates are assumed one month apart from disbursal."],
      mistakes: ["Comparing offers by rate alone, ignoring fees.", "Borrowing the amount you need without allowing for deducted fees.", "Choosing a long tenure for a short-term need."],
    },
    faqs: [
      { q: "How is personal loan EMI calculated?", a: "With the reducing-balance formula: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), on the full loan amount, where r is the monthly rate." },
      { q: "Why is the amount credited less than my loan?", a: "Lenders usually deduct the processing fee, GST on it and any other charges before crediting the loan. You still repay interest on the full amount." },
      { q: "What is the effective interest rate?", a: "The yearly rate implied by what you actually receive and what you repay. Fees push it above the quoted rate, which makes it the fairer way to compare offers." },
      { q: "Is GST charged on processing fees?", a: "Yes, GST applies to loan processing fees — usually 18%. Enter what your lender shows." },
    ],
    related: ["emi-calculator", "debt-to-income-ratio-calculator", "loan-affordability-calculator", "car-loan-calculator"],
    searchTerms: ["personal loan", "personal loan emi", "processing fee", "apr", "effective rate", "unsecured loan", "loan interest", "instant loan"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "loan-affordability-calculator",
    name: "Loan Affordability Calculator",
    category: "loans",
    icon: "affordability",
    short: "Find a loan you can comfortably repay from your income, expenses and existing debt — with conservative, balanced and higher-commitment scenarios.",
    intro:
      "Work out how much you can borrow without stretching yourself. Enter your income, essential expenses and current debt; choose your own limits for how much of your income all debt repayments may take; and see the EMI, loan amount and money left each month in three scenarios.",
    what:
      "A loan affordability calculator estimates the loan you can repay comfortably, as opposed to the largest loan a lender might approve. ZSpace Tools' calculator works from your budget and your own comfort limits, and shows your current debt-to-income ratio and emergency-savings cover.",
    how:
      "Surplus = income − essential expenses − existing EMIs − card payments − other commitments. For each scenario, the new EMI is your chosen percentage of income minus existing debt payments, never more than the surplus. The EMI is turned into a loan amount with the present-value formula at your rate and tenure.",
    seo: {
      title: "Loan Affordability Calculator – How Much Loan Can I Afford?",
      description:
        "Calculate how much loan you can comfortably afford from income, expenses and existing EMIs. Three editable scenarios, affordable EMI, loan amount, debt-to-income and emergency-fund cover.",
      keyword: "loan affordability calculator",
      secondary: ["how much loan can I afford", "affordable EMI calculator", "loan affordability calculator India", "EMI affordability", "borrowing capacity"],
    },
    features: [
      { title: "Budget first", body: "Starts from what you spend, not from what a bank might lend." },
      { title: "Three scenarios", body: "Conservative, balanced and higher commitment — with limits you set." },
      { title: "Never beyond your surplus", body: "The EMI is capped by what's actually left each month." },
      { title: "Emergency cover", body: "Months of outgoings your savings would cover." },
      { title: "Any loan", body: "Home, car, personal or education — just set the rate and tenure." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Enter income and spending", body: "Take-home income, essential expenses, EMIs and card payments." },
      { title: "Set the loan and limits", body: "Rate, tenure and your three comfort limits." },
      { title: "Compare scenarios", body: "EMI, loan, money left and debt ratio for each." },
    ],
    specs: [
      { label: "Scenarios", value: "30% / 40% / 50% of income for all debt (editable)" },
      { label: "Cap", value: "EMI never above monthly surplus" },
      { label: "Loan", value: "Present value of the EMI at your rate and tenure" },
    ],
    formats: ["INR"],
    privacy: "Your budget is calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 lakh take-home (hypothetical)", body: "With ₹40,000 expenses, ₹10,000 EMIs and ₹2,000 card payments, ₹48,000 is left each month. At 30%, 40% and 50% of income for all debt, the new EMI is ₹18,000, ₹28,000 or ₹38,000 — about ₹8.47 lakh, ₹13.18 lakh or ₹17.88 lakh over 5 years at 10%." },
      { title: "Emergency savings", body: "₹3 lakh of savings covers about 5.8 months of those outgoings." },
    ],
    guide: {
      inputs: [
        { title: "Income", body: "Take-home pay and other regular income you can rely on." },
        { title: "Expenses and obligations", body: "Essentials only — rent, food, utilities, school fees, insurance, support for dependants." },
        { title: "Comfort limits", body: "The share of income you're happy for all debt repayments to take, existing ones included." },
      ],
      interpret: [
        "A lender may approve more than these amounts; that doesn't make it comfortable.",
        "Money left each month should still cover savings goals and surprises.",
      ],
      useCases: ["Setting a budget before applying", "Choosing a tenure", "Checking room for a car loan alongside a home loan"],
      limitations: ["Income and expenses are assumed steady.", "Taxes and future raises aren't modelled.", "Limits are personal choices, not lender rules."],
      mistakes: ["Leaving out irregular but certain costs like insurance premiums.", "Counting bonus income as monthly income.", "Borrowing to the lender's maximum."],
    },
    faqs: [
      { q: "How much loan can I afford?", a: "Start with what's left after essential expenses and current debt, decide what share of income all debt repayments should take, and convert that EMI into a loan at your rate and tenure. The calculator does this for three comfort levels." },
      { q: "What is a safe EMI-to-income ratio?", a: "There's no single safe number — it depends on your expenses, dependants, job security and savings. That's why the limits are yours to set." },
      { q: "Why is this lower than my bank's eligibility?", a: "Lenders look at whether you can repay at all; this looks at whether you can repay comfortably after your actual expenses." },
      { q: "Should I have an emergency fund before borrowing?", a: "Many planners suggest about six months of essential outgoings set aside. The calculator shows how many months your savings cover." },
    ],
    related: ["debt-to-income-ratio-calculator", "emi-calculator", "home-loan-eligibility-calculator", "personal-loan-calculator"],
    searchTerms: ["loan affordability", "how much loan can i afford", "affordable emi", "borrowing capacity", "budget loan", "emi to income"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "rent-vs-buy-calculator",
    name: "Rent vs Buy Calculator",
    category: "property",
    alsoIn: ["loans"],
    icon: "rent-buy",
    short: "Compare buying a home with renting and investing the difference — year by year, with appreciation, rent rises, transaction costs and inflation.",
    intro:
      "See which leaves you better off over time: buying a home or renting and investing. The calculator follows both paths month by month with the same cash, so neither side gets a head start, and shows net worth each year, the year buying pulls ahead (if it does) and the numbers behind it.",
    what:
      "A rent vs buy calculator compares the long-term financial outcome of owning a home with renting one. ZSpace Tools' calculator models the buyer's EMI, maintenance, property tax and appreciation against the renter's rent, deposit and investments, and reports each side's net worth year by year.",
    how:
      "The buyer pays the down payment, stamp duty, registration and other costs upfront; the renter pays a deposit and invests the rest of that money. Each month, whoever spends less invests the difference, so both use the same cash. Both portfolios earn the same return. Net worth = property value − selling costs − loan left + investments for the buyer, and investments + deposit for the renter.",
    seo: {
      title: "Rent vs Buy Calculator India – Should I Rent or Buy a House?",
      description:
        "Compare renting vs buying a home in India year by year. EMI, appreciation, rent increases, stamp duty, maintenance, investment returns and inflation — net worth for both, and when buying pulls ahead.",
      keyword: "rent vs buy calculator India",
      secondary: ["should I rent or buy a house", "renting vs buying comparison", "rent or buy calculator", "buy vs rent home", "is buying a house worth it"],
    },
    features: [
      { title: "Fair, same-cash comparison", body: "Whoever spends less each month invests the difference — no double counting." },
      { title: "Full costs of owning", body: "Stamp duty, registration, maintenance, property tax and selling costs." },
      { title: "Realistic renting", body: "Annual rent increases, security deposit and tenant-paid maintenance." },
      { title: "Year-by-year table and chart", body: "Net worth of both paths in future or today's rupees." },
      { title: "Break-even year", body: "When buying pulls ahead and stays ahead, if it does." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Enter the purchase", body: "Price, down payment, loan, purchase costs and running costs." },
      { title: "Enter the rent", body: "Rent, yearly increase and deposit." },
      { title: "Set assumptions", body: "Appreciation, investment return, inflation and the period." },
    ],
    specs: [
      { label: "Model", value: "Monthly cash flows, reported yearly" },
      { label: "Fairness", value: "Same total cash on both paths" },
      { label: "Views", value: "Future ₹ or today's ₹" },
      { label: "Excludes", value: "Tax effects" },
    ],
    formats: ["INR"],
    privacy: "Your figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 crore flat vs ₹28,000 rent (hypothetical)", body: "With ₹20 lakh down, 8.5% for 20 years, 5% appreciation and rent rising 5% a year, and 9% investment returns, after 20 years buying gives a net worth of about ₹2.60 crore and renting and investing about ₹3.80 crore." },
      { title: "When buying wins", body: "Change appreciation to 7%, rent to ₹35,000 rising 6% a year and investment returns to 8%, and buying pulls ahead from year 5, ending about ₹1.36 crore ahead." },
    ],
    guide: {
      inputs: [
        { title: "Purchase costs", body: "Stamp duty, registration, brokerage and interiors are money the renter keeps invested." },
        { title: "Appreciation and rent increase", body: "Use long-run local figures; small changes make big differences over 20 years." },
        { title: "Investment return", body: "What the renter's — and the buyer's — spare money earns. Be realistic." },
        { title: "Selling costs", body: "Brokerage and other costs if you sold at the end, so both sides are compared in cash." },
      ],
      interpret: [
        "The difference is a result of your assumptions; try a range.",
        "Today's ₹ view removes inflation so long horizons are easier to judge.",
        "Money is one factor — stability, location, flexibility and liquidity matter too.",
      ],
      useCases: ["Deciding whether to buy now", "Testing how sensitive the answer is to appreciation", "Comparing two cities", "Choosing a down payment"],
      limitations: ["Tax deductions, capital-gains tax and tax on investments aren't modelled.", "Constant rates are assumed every year.", "Major repairs and vacancy aren't included."],
      mistakes: ["Comparing EMI with rent and stopping there.", "Ignoring stamp duty, registration and maintenance.", "Assuming the renter spends the difference instead of investing it."],
    },
    faqs: [
      { q: "Is it better to rent or buy a house in India?", a: "It depends on prices, rents, interest rates, how long you'll stay and what your money would earn otherwise. In many cities rent is a small share of property value, which favours renting financially, but your assumptions decide — and money isn't the only factor." },
      { q: "How does this calculator keep the comparison fair?", a: "Both paths use the same cash. The renter invests what the buyer spends upfront, and each month whoever spends less invests the difference." },
      { q: "Does it include tax benefits on home loans?", a: "No. Tax effects depend on your regime and income, so they're left out; they'd modestly favour buying under the old regime." },
      { q: "What is the break-even year?", a: "The first year from which buying's net worth stays above renting's for the rest of the period, if that happens." },
    ],
    related: ["home-loan-eligibility-calculator", "stamp-duty-calculator", "property-registration-charges-calculator", "down-payment-calculator", "home-loan-prepayment-calculator"],
    searchTerms: ["rent vs buy", "rent or buy", "buy a house", "renting vs buying", "home ownership", "should i buy a flat", "property investment"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "stamp-duty-calculator",
    name: "Stamp Duty Calculator",
    category: "property",
    icon: "stamp-duty",
    short: "Estimate stamp duty on a residential property in Maharashtra, Delhi, Rajasthan and Telangana from verified state rules — other states shown as unsupported.",
    intro:
      "Estimate the stamp duty on buying a home. The calculator uses a state-wise rules engine with effective dates and sources, applies verified concessions such as lower rates for women, and refuses to guess where rules couldn't be verified — you can enter a quoted rate instead.",
    what:
      "Stamp duty is a state tax on property transfer documents, charged as a percentage of the property's value. ZSpace Tools' Stamp Duty Calculator estimates it for residential sale deeds in the states whose rates were verified on official sources, showing the rate, the value it's charged on, any concession, the rule's effective date and its source.",
    how:
      "The calculator picks the rule for your state, area and buyer that was in force on the registration date, takes the higher of the agreement value and the guidance (circle / ready-reckoner) value, and applies each component: the duty itself, cesses on value (such as Mumbai's metro cess) and surcharges on the duty (such as Rajasthan's). States, buyers or dates without a verified rule aren't estimated.",
    seo: {
      title: "Stamp Duty Calculator India – State-wise Property Stamp Duty",
      description:
        "Estimate property stamp duty for Maharashtra (Mumbai), Delhi, Rajasthan and Telangana from verified state rules. Women's concessions, circle-rate basis, effective dates and official sources shown.",
      keyword: "stamp duty calculator India",
      secondary: ["state-wise stamp duty calculator", "property stamp duty calculator", "stamp duty in Mumbai", "stamp duty in Delhi", "stamp duty for women"],
    },
    features: [
      { title: "Verified rules only", body: "Calculated only where the base rate was read on an official source." },
      { title: "Effective dates", body: "The rule in force on your registration date is used; older dates aren't guessed." },
      { title: "Concessions", body: "Women's rates in Maharashtra, Delhi and Rajasthan, with their conditions." },
      { title: "Circle-rate basis", body: "Charged on the higher of agreement value and guidance value." },
      { title: "Sources shown", body: "Every result lists its source and status." },
      { title: "Manual mode", body: "For other states, enter the rate you've been quoted." },
    ],
    steps: [
      { title: "Choose the state and area", body: "And property type and buyer." },
      { title: "Enter values and date", body: "Agreement value, guidance value and registration date." },
      { title: "Read the duty", body: "Each component, any concession, and the rule's source." },
    ],
    specs: [
      { label: "Calculated", value: "Maharashtra, Delhi, Rajasthan, Telangana (residential)" },
      { label: "Not calculated", value: "Other states, commercial property and land" },
      { label: "Basis", value: "Higher of agreement and guidance value" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Property details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 crore flat in Mumbai (hypothetical)", body: "5% stamp duty plus 1% metro cess: ₹6,00,000 for a male buyer. A woman buying alone pays 1% less: ₹5,00,000. A man and woman buying jointly pay ₹6,00,000." },
      { title: "₹1 crore in Delhi", body: "6% for a man (₹6,00,000), 4% for a woman (₹4,00,000)." },
      { title: "₹50 lakh in Rajasthan", body: "6% duty plus a surcharge of 30% of the duty: ₹3,90,000 for a man; ₹3,25,000 for a woman." },
    ],
    guide: {
      inputs: [
        { title: "State and area", body: "Rates can differ by area — Mumbai, other urban areas and gram panchayats in Maharashtra; urban and gram panchayat areas in Telangana." },
        { title: "Buyer", body: "Used only where a verified concession depends on it." },
        { title: "Guidance value", body: "The government's minimum value (circle rate, ready reckoner). Duty is charged on whichever is higher." },
        { title: "Registration date", body: "Rules apply from the date they took effect." },
      ],
      interpret: [
        "Components marked 'secondary' come from non-official sources — confirm them.",
        "If a result says 'not calculated', enter the rate your registrar or lawyer quotes.",
        "Registration fees are separate.",
      ],
      useCases: ["Budgeting a home purchase", "Comparing buying in a woman's name", "Checking a builder's cost sheet"],
      limitations: [
        "Residential sale deeds only; gift, lease and other deeds aren't covered.",
        "States without officially verified rates aren't calculated.",
        "Local levies beyond those listed may apply.",
      ],
      mistakes: ["Calculating on the agreement value when the circle rate is higher.", "Assuming a joint purchase gets the women's rate.", "Forgetting registration fees on top."],
    },
    faqs: [
      { q: "How is stamp duty calculated?", a: "As a percentage of the higher of the agreement value and the government guidance value, at the rate for your state, area and buyer on the registration date, plus any cess or surcharge." },
      { q: "Which states does this calculator cover?", a: "Residential purchases in Maharashtra, Delhi, Rajasthan and Telangana, where the base rates were verified on official sources. Other states are shown as not supported rather than estimated." },
      { q: "Do women pay lower stamp duty?", a: "In some states. Maharashtra charges 1% less for women buying alone or with other women; Delhi charges 4% instead of 6%; Rajasthan 5% instead of 6%. Conditions apply." },
      { q: "Is stamp duty included in a home loan?", a: "Generally no. RBI excludes stamp duty and registration from the property value used for loan-to-value, except for homes up to ₹10 lakh, so plan to pay them yourself." },
      { q: "Why isn't my state supported?", a: "We only calculate where the rate could be read on an official source. Rates for some states were available only from secondary sources, so they aren't used." },
    ],
    related: ["property-registration-charges-calculator", "down-payment-calculator", "rent-vs-buy-calculator", "home-loan-eligibility-calculator"],
    searchTerms: ["stamp duty", "stamp duty calculator", "property stamp duty", "stamp duty mumbai", "stamp duty delhi", "stamp duty rajasthan", "stamp duty telangana", "metro cess", "circle rate", "ready reckoner"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "property-registration-charges-calculator",
    name: "Property Registration Charges Calculator",
    category: "property",
    icon: "registration",
    short: "Estimate government registration fees on a home purchase in Delhi, Rajasthan, Telangana, Tamil Nadu and Haryana from verified rules — kept separate from stamp duty.",
    intro:
      "Estimate the registration fee payable when you register a property purchase. Percentage fees, value slabs, caps and concessions are applied only where verified, and the result is combined with stamp duty where both are supported.",
    what:
      "A property registration fee is the charge for registering a sale deed with the sub-registrar, separate from stamp duty. ZSpace Tools' calculator estimates it for residential purchases in states whose fee rules were verified on official sources, with each rule's effective date and source.",
    how:
      "The calculator picks the fee rule in force on the registration date. Percentage states charge the rate on the higher of the agreement and guidance values, then apply any verified minimum, maximum or concession; slab states charge a fixed fee for the value band. Verified fixed charges, like Delhi's pasting fee or Haryana's HARIS charge, are added.",
    seo: {
      title: "Property Registration Charges Calculator – Registration Fee India",
      description:
        "Estimate property registration fees for Delhi, Rajasthan, Telangana, Tamil Nadu and Haryana from verified rules — rates, slabs, caps, women's concessions, effective dates and sources. Separate from stamp duty.",
      keyword: "property registration charges calculator",
      secondary: ["property registration fee India", "house registration charges", "registration fee calculator", "sale deed registration charges", "registration charges for flat"],
    },
    features: [
      { title: "Separate from stamp duty", body: "Government registration charges only, with stamp duty shown alongside where supported." },
      { title: "Rates and slabs", body: "Percentage fees and fixed value-slab fees (Haryana)." },
      { title: "Concessions", body: "Tamil Nadu's 1% for women up to ₹10 lakh, from its effective date." },
      { title: "Effective dates", body: "Rules applied by registration date; older dates aren't guessed." },
      { title: "Sources shown", body: "Every result lists its source." },
      { title: "Manual mode", body: "For other states, enter the quoted rate." },
    ],
    steps: [
      { title: "Choose the state", body: "And area, property type and buyer." },
      { title: "Enter values and date", body: "Agreement value, guidance value and registration date." },
      { title: "Read the fees", body: "Fee, extras, total and the combined government charges." },
    ],
    specs: [
      { label: "Calculated", value: "Delhi, Rajasthan, Telangana, Tamil Nadu, Haryana (residential)" },
      { label: "Not calculated", value: "Maharashtra and other states, commercial property and land" },
      { label: "Excludes", value: "Legal fees, brokerage, loan and society charges" },
      { label: "Rules last checked", value: "15 Nov 2026" },
    ],
    formats: ["INR"],
    privacy: "Property details are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1 crore in Delhi (hypothetical)", body: "1% registration fee plus a ₹100 pasting fee: ₹1,00,100. With 6% stamp duty for a male buyer, government charges total ₹7,00,100." },
      { title: "₹45 lakh in Haryana", body: "A fixed ₹25,000 fee for the ₹40–50 lakh slab plus the ₹200 HARIS charge: ₹25,200." },
      { title: "₹8 lakh in Tamil Nadu bought by a woman", body: "From 1 April 2025 the fee is 1% instead of 2%: ₹8,000." },
    ],
    guide: {
      inputs: [
        { title: "State and area", body: "Telangana's fee differs between urban local bodies and gram panchayats." },
        { title: "Values", body: "The fee is charged on the higher of agreement and guidance value where that's the rule." },
        { title: "Buyer and date", body: "Concessions apply only when every condition is met on the registration date." },
      ],
      interpret: ["Total registration charges include verified fixed charges.", "Stamp duty is separate; the combined table appears when both are supported."],
      useCases: ["Budgeting a purchase", "Checking a cost sheet", "Planning down payment cash"],
      limitations: ["Residential sale deeds only.", "States without verified fee rules aren't calculated.", "Scanning, e-stamping and convenience charges aren't included."],
      mistakes: ["Confusing registration fees with stamp duty.", "Adding legal or brokerage fees to government charges.", "Assuming one fee applies across India."],
    },
    faqs: [
      { q: "What are property registration charges?", a: "The fee paid to the state for registering your sale deed with the sub-registrar. It's separate from stamp duty." },
      { q: "How much is the registration fee in Delhi?", a: "1% of the property value (the higher of agreement and circle-rate value) plus a ₹100 pasting fee." },
      { q: "Is there a cap on registration fees?", a: "Some states cap it; others don't. Haryana uses fixed fees by value slab up to ₹50,000; Rajasthan removed its cap in 2024." },
      { q: "Why isn't Maharashtra calculated?", a: "Its registration fee (widely quoted as 1% up to ₹30,000) couldn't be confirmed on an official source when the rules were last checked, so it isn't used." },
    ],
    related: ["stamp-duty-calculator", "down-payment-calculator", "rent-vs-buy-calculator", "home-loan-eligibility-calculator"],
    searchTerms: ["registration charges", "registration fee", "property registration", "sale deed registration", "sub registrar fee", "haryana registration fee", "tamil nadu registration fee", "delhi registration fee"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "down-payment-calculator",
    name: "Down Payment Calculator",
    category: "property",
    alsoIn: ["loans"],
    icon: "down-payment",
    short: "Work out the down payment and total upfront cash for a home, car or other purchase — with loan-to-value limits, charges and your savings gap.",
    intro:
      "See exactly how much cash you need before the loan kicks in. Enter the price and your down payment, add stamp duty, registration, insurance and fees, and compare the total with your savings after keeping an emergency reserve.",
    what:
      "A down payment calculator works out the part of a purchase you pay yourself and the other upfront costs lenders don't fund. ZSpace Tools' calculator applies the RBI loan-to-value cap for homes and any lender limit you enter, and shows your savings surplus or shortfall and the EMI on the rest.",
    how:
      "Down payment = price × your % (or the amount you enter), raised if needed to keep the loan within the maximum loan-to-value. Total upfront cash = down payment + stamp duty + registration + insurance + fees + other charges. Surplus or shortfall = savings − emergency reserve − total upfront cash.",
    seo: {
      title: "Down Payment Calculator – Home & Car Down Payment and Upfront Cash",
      description:
        "Calculate the down payment and total upfront cash for a home or car: loan-to-value limits, stamp duty, registration, fees, your savings gap and the EMI on the loan.",
      keyword: "down payment calculator",
      secondary: ["home down payment calculator", "car down payment calculator", "how much down payment for a house", "upfront cost of buying a house", "own contribution home loan"],
    },
    features: [
      { title: "% or amount", body: "Enter the down payment either way." },
      { title: "LTV built in", body: "RBI caps for homes, plus any lender limit you enter." },
      { title: "All upfront costs", body: "Stamp duty, registration, insurance, fees and more." },
      { title: "Savings gap", body: "Surplus or shortfall after your emergency reserve." },
      { title: "EMI estimate", body: "On the remaining loan, at your rate and tenure." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Choose what you're buying", body: "Home, car or other." },
      { title: "Enter price and down payment", body: "And any lender limit." },
      { title: "Add costs and savings", body: "Charges, savings and the reserve you want to keep." },
    ],
    specs: [
      { label: "LTV", value: "RBI caps for home loans; your lender limit" },
      { label: "Upfront cash", value: "Down payment + charges" },
      { label: "Output", value: "Upfront cash, loan, EMI, savings gap" },
    ],
    formats: ["INR"],
    privacy: "Your figures are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹80 lakh home with 20% down (hypothetical)", body: "Down payment ₹16 lakh, plus ₹4.8 lakh stamp duty, ₹30,000 registration and ₹10,000 processing fee: ₹21.2 lakh upfront. With ₹25 lakh saved and ₹3 lakh kept aside, that leaves ₹80,000 spare. The ₹64 lakh loan costs about ₹55,541 a month over 20 years at 8.5%." },
      { title: "When 10% isn't enough", body: "On an ₹80 lakh home the RBI cap allows at most an 80% loan, so a 10% down payment is raised to 20% (₹16 lakh)." },
    ],
    guide: {
      inputs: [
        { title: "Price", body: "Agreement value for a home; on-road price for a car." },
        { title: "Maximum loan", body: "Your lender's limit as % of price. For homes the RBI cap applies automatically." },
        { title: "Charges", body: "Stamp duty, registration and similar costs are usually paid from your own money." },
        { title: "Emergency reserve", body: "Savings you don't want to touch for the purchase." },
      ],
      interpret: ["A shortfall means you need more savings, a cheaper purchase or a larger loan within limits.", "The EMI is on the loan after your down payment."],
      useCases: ["Planning savings for a home", "Checking if you can buy now", "Car purchase budgeting"],
      limitations: ["Charges are what you enter.", "Lender limits vary by property, profile and product."],
      mistakes: ["Planning only for the down payment and forgetting stamp duty.", "Using your emergency fund for the purchase.", "Assuming the bank funds 90% of every home."],
    },
    faqs: [
      { q: "How much down payment do I need for a house in India?", a: "At least 10%, 20% or 25% of the property value depending on the loan size under RBI limits — more if your lender lends less — plus stamp duty and registration." },
      { q: "Are stamp duty and registration included in the home loan?", a: "Generally no. RBI excludes them from the property value used for loan-to-value, except for homes up to ₹10 lakh." },
      { q: "What is total upfront cash?", a: "Your down payment plus every charge payable at purchase — stamp duty, registration, insurance, processing fees and similar." },
      { q: "Should I put more down?", a: "A bigger down payment lowers your EMI and interest but uses savings; keep an emergency reserve aside first." },
    ],
    related: ["home-loan-eligibility-calculator", "car-loan-calculator", "stamp-duty-calculator", "property-registration-charges-calculator", "emi-calculator"],
    searchTerms: ["down payment", "downpayment", "upfront cost", "own contribution", "margin money", "home down payment", "car down payment", "ltv"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
  {
    slug: "debt-to-income-ratio-calculator",
    name: "Debt-to-Income Ratio Calculator",
    category: "loans",
    icon: "dti",
    short: "Calculate your debt-to-income ratio on gross and net income, your housing ratio, and how much more EMI fits under a target you choose.",
    intro:
      "See how much of your income already goes to debt. Enter your income and EMIs to get your back-end and front-end ratios, the share of take-home pay going to debt, the effect of a new loan and the extra EMI that fits under your own target.",
    what:
      "The debt-to-income (DTI) ratio is the share of monthly income spent on debt repayments. ZSpace Tools' calculator shows it on gross income (back-end), on take-home income (close to the FOIR Indian lenders use) and for housing alone (front-end), before and after a proposed loan.",
    how:
      "Back-end DTI = all monthly debt payments ÷ gross monthly income × 100. Front-end ratio = housing EMI ÷ gross income × 100. Net ratio = debt payments ÷ take-home income × 100. Headroom = your target % × gross income − current debt payments.",
    seo: {
      title: "Debt-to-Income Ratio Calculator – DTI & EMI-to-Income Ratio",
      description:
        "Calculate your debt-to-income ratio on gross and net income, housing ratio, DTI after a new loan and the extra EMI that fits your target. Clear explanations, no fixed approval rule.",
      keyword: "debt to income ratio calculator",
      secondary: ["calculate debt to income ratio", "EMI to income ratio calculator", "DTI calculator India", "FOIR ratio", "front-end and back-end ratio"],
    },
    features: [
      { title: "Three ratios", body: "Gross (back-end), housing (front-end) and net (FOIR-like)." },
      { title: "Before and after", body: "See the effect of a proposed new EMI." },
      { title: "Your target", body: "Set your own limit and see the headroom." },
      { title: "Not colour alone", body: "Plain-language bands explain where you stand." },
      { title: "Every kind of debt", body: "Home, car, personal, education, cards and others." },
      { title: "Private", body: "Calculated in your browser." },
    ],
    steps: [
      { title: "Enter income", body: "Gross and take-home monthly income, and other income." },
      { title: "Enter debt payments", body: "Each EMI and card payment." },
      { title: "Check the ratios", body: "Current and proposed DTI and your headroom." },
    ],
    specs: [
      { label: "Back-end", value: "All debt ÷ gross income" },
      { label: "Front-end", value: "Housing EMI ÷ gross income" },
      { label: "Net", value: "All debt ÷ take-home income" },
    ],
    formats: ["INR"],
    privacy: "Your income and debts are calculated in your browser and never uploaded, stored or sent to analytics.",
    examples: [
      { title: "₹1.5 lakh gross, ₹1.2 lakh net (hypothetical)", body: "With a ₹30,000 home EMI, ₹10,000 car EMI and ₹5,000 card payments, back-end DTI is 30%, the housing ratio 20% and debt takes 37.5% of take-home pay. Up to a 40% target there's ₹15,000 of headroom." },
    ],
    guide: {
      inputs: [
        { title: "Gross and net income", body: "Gross is before tax and deductions; net is what reaches your account." },
        { title: "Debt payments", body: "Every EMI plus what you pay towards credit cards each month." },
        { title: "Target ratio", body: "Your own comfort limit — lenders set theirs differently." },
      ],
      interpret: ["Lower is better; how low is enough depends on your expenses and savings.", "Indian lenders mostly look at EMIs against net income (FOIR)."],
      useCases: ["Checking before applying for a loan", "Tracking debt over time", "Deciding whether to close a loan first"],
      limitations: ["No ratio guarantees approval.", "Irregular income is treated as steady."],
      mistakes: ["Mixing gross and net income.", "Leaving out card payments.", "Treating a lender's maximum as a comfortable level."],
    },
    faqs: [
      { q: "How do I calculate my debt-to-income ratio?", a: "Add all monthly debt payments, divide by gross monthly income and multiply by 100. ₹45,000 of EMIs on ₹1.5 lakh gross is 30%." },
      { q: "What is a good debt-to-income ratio?", a: "There's no universal threshold that guarantees approval. Lower ratios leave more room for savings and surprises; set a target that fits your budget." },
      { q: "Is DTI the same as FOIR?", a: "Similar. FOIR, used by many Indian lenders, compares fixed obligations including the new EMI with net income; DTI is usually on gross income. The calculator shows both views." },
      { q: "What if my income is zero?", a: "Ratios can't be calculated without income, so they're shown as unavailable rather than as a misleading number." },
    ],
    related: ["loan-affordability-calculator", "personal-loan-calculator", "home-loan-eligibility-calculator", "emi-calculator"],
    searchTerms: ["debt to income", "dti", "emi to income ratio", "foir", "debt ratio", "back end ratio", "front end ratio", "loan ratio"],
    published: "2026-11-15",
    updated: "2026-11-15",
  },
];

/** Ideas on the roadmap — shown as "coming soon", never linked or indexed. */
export const plannedTools: { name: string; category: CategoryId }[] = [
  { name: "Lorem Ipsum Generator", category: "text" },
  { name: "Character Counter", category: "text" },
  { name: "Time Zone Converter", category: "date" },
  { name: "Quotation Generator", category: "business" },
  { name: "Gradient Generator", category: "design" },
];

export const toolSlugs = tools.map((t) => t.slug);

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug);
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

export function toolsInCategory(id: CategoryId) {
  return tools.filter((t) => t.category === id || t.alsoIn?.includes(id));
}

export function toolPath(slug: string) {
  return `/${slug}/`;
}

export function relatedTools(tool: Tool) {
  return tool.related.map(getTool).filter((t): t is Tool => Boolean(t));
}
