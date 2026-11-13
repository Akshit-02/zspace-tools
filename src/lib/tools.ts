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

export type CategoryId = "image" | "pdf" | "text" | "seo" | "calculators" | "date" | "business" | "design" | "productivity" | "qr" | "developer" | "conversion";

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
  | "slides";

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
  { id: "calculators", name: "Finance & Calculators", description: "Loans, GST, percentages and age, with the working shown.", icon: "percent" },
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
    related: ["case-converter", "percentage-calculator", "pdf-compressor"],
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
    name: "CSV to JSON Converter",
    category: "developer",
    icon: "sheet",
    short: "Convert CSV or TSV data into JSON objects or arrays, with headers and validation.",
    intro:
      "Turn CSV, TSV or semicolon-separated data into clean JSON. Paste or upload a file, choose how headers and delimiters work, preview the records and download — without any data leaving your browser.",
    what:
      "CSV (comma-separated values) stores a table as plain text, one row per line. JSON stores structured data that apps and APIs read directly. ZSpace Tools' CSV to JSON Converter turns each row of a CSV file into a JSON object keyed by the header row — or into a plain array — and reports any rows that don't fit.",
    how:
      "The CSV is parsed with Papa Parse, a widely used open-source parser that follows the CSV standard: quoted fields can contain commas, line breaks and doubled quotes (\"\"). The delimiter is detected automatically or set by you. Header names are made unique and never left blank, rows with too many or too few cells are reported rather than dropped, and values stay as text unless you choose to convert numbers and true/false.",
    seo: {
      title: "CSV to JSON Converter Online – Free CSV File to JSON Tool",
      description:
        "Convert CSV to JSON online for free. Upload CSV files or paste data, customize delimiters, validate headers and download formatted JSON instantly.",
      keyword: "CSV to JSON",
      secondary: ["CSV to JSON converter", "convert CSV file to JSON", "TSV to JSON", "Excel CSV to JSON", "CSV parser online", "spreadsheet to JSON"],
    },
    features: [
      { title: "Standards-compliant parsing", body: "Quoted commas, escaped quotes and multi-line cells are handled correctly — never a naive split on commas." },
      { title: "Any delimiter", body: "Auto-detects comma, tab, semicolon and pipe, or set a custom delimiter." },
      { title: "Headers handled safely", body: "Duplicate names become name_2, blank headers get a column name, and you can turn headers off entirely." },
      { title: "Nothing silently lost", body: "Rows with missing or extra cells are listed. Extra cells are kept under generated column names." },
      { title: "Your choice of output", body: "Array of objects or array of arrays, pretty-printed or minified, empty cells as \"\" or null." },
      { title: "Preview, copy, download", body: "Check the first records in a table, then copy the JSON or download a .json file." },
    ],
    steps: [
      { title: "Add your CSV", body: "Paste the data or open a .csv / .tsv / .txt file." },
      { title: "Check the options", body: "Confirm the delimiter and whether the first row contains headers. Review any warnings." },
      { title: "Copy or download JSON", body: "Pick objects or arrays and pretty or minified, then copy or download." },
    ],
    specs: [
      { label: "Parser", value: "Papa Parse 5 (RFC 4180)" },
      { label: "Delimiters", value: "Auto, comma, tab, semicolon, pipe, custom" },
      { label: "Output shapes", value: "Array of objects · array of arrays" },
      { label: "Type conversion", value: "Optional: numbers, true/false, null" },
      { label: "Max file size", value: "20 MB" },
      { label: "Processing", value: "In your browser" },
    ],
    formats: ["CSV", "TSV", "JSON"],
    privacy: "CSV files are read and converted in your browser. Your data is never uploaded or stored.",
    examples: [
      { title: "Headers become keys", body: 'name,city,role / Amit,Mumbai,Founder becomes [{"name": "Amit", "city": "Mumbai", "role": "Founder"}].' },
      { title: "Commas inside quotes", body: '"Loves chai, hates meetings" stays one value, because it is quoted. Doubled quotes ("") become a single ".' },
      { title: "European CSV", body: "name;price / Café;3,50 is detected as semicolon-separated, and 3,50 is kept exactly as written." },
    ],
    faqs: [
      { q: "How do I convert a CSV file to JSON?", a: "Open the .csv file (or paste its contents), confirm the delimiter and header settings, then copy the JSON or download it as a .json file." },
      { q: "What happens if my CSV has no header row?", a: "Turn off “First row is headers”. Columns are then named column_1, column_2 and so on, or you can output an array of arrays instead." },
      { q: "Why are some values still strings, like \"007\" or long IDs?", a: "By default every value stays exactly as written. If you turn on number conversion, leading-zero codes and numbers too large to store exactly are still kept as text so nothing changes silently." },
      { q: "What if rows have different numbers of columns?", a: "The converter lists every affected row. Missing cells are filled as empty, and extra cells are kept under generated column names so no data is lost." },
      { q: "Can I convert Excel files?", a: "Save the sheet as CSV (or CSV UTF-8) from Excel, Google Sheets or Numbers first, then convert the CSV here." },
      { q: "Is my data uploaded?", a: "No. Parsing and conversion happen entirely in your browser." },
    ],
    related: ["json-formatter", "base64-encoder-decoder", "url-encoder-decoder"],
    searchTerms: ["csv", "json", "convert", "converter", "tsv", "spreadsheet", "excel", "table", "parse", "parser", "comma", "delimiter", "data"],
    published: "2026-11-12",
    updated: "2026-11-12",
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
    related: ["gst-calculator", "percentage-calculator", "days-between-dates"],
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
    name: "Markdown Editor & Previewer",
    category: "developer",
    icon: "markdown",
    short: "Write Markdown with a formatting toolbar and live preview, then export .md or HTML.",
    intro:
      "Write Markdown and see it formatted as you type — headings, lists, task lists, tables, code blocks and more. Export as .md or a clean HTML file. Everything stays in your browser.",
    what:
      "Markdown is a lightweight way to format plain text: **bold**, # headings and - lists become formatted output. ZSpace Tools' Markdown Editor & Previewer shows your Markdown and its rendered result side by side, with a toolbar for common formatting and exports to Markdown or HTML.",
    how:
      "Your text is parsed with marked, a widely used Markdown parser that supports GitHub Flavored Markdown (tables, task lists, strikethrough). The resulting HTML is sanitised with DOMPurify before it's shown: raw HTML is displayed as text, scripts and event handlers are removed, and links are limited to http, https, mailto and tel, so javascript: links can't run. Toolbar buttons insert syntax at your cursor and keep undo working.",
    seo: {
      title: "Online Markdown Editor – Write, Preview & Export Markdown",
      description:
        "Write and preview Markdown online for free. Format headings, tables, links, lists and code blocks, then download your Markdown or export HTML.",
      keyword: "Markdown editor",
      secondary: ["online Markdown editor", "Markdown previewer", "Markdown to HTML", "live Markdown preview", "README editor", "GitHub Flavored Markdown"],
    },
    features: [
      { title: "Live preview", body: "See formatted output as you type — side by side on desktop, with an Edit/Preview switch on phones." },
      { title: "Formatting toolbar", body: "Headings, bold, italic, links, images, lists, task lists, quotes, code and tables — inserted at your cursor." },
      { title: "GitHub Flavored Markdown", body: "Tables with alignment, task lists, strikethrough and fenced code blocks." },
      { title: "Safe by design", body: "Output is sanitised; scripts, inline event handlers and javascript: links are removed." },
      { title: "Export", body: "Download .md, export a styled standalone .html file, or copy the Markdown or HTML." },
      { title: "Optional local draft", body: "Turn on to keep your draft in this browser only — clear it any time." },
    ],
    steps: [
      { title: "Write or paste Markdown", body: "Type in the editor, use the toolbar, or load the sample." },
      { title: "Check the preview", body: "The formatted result updates live; word count and reading time update too." },
      { title: "Export", body: "Download .md or .html, or copy the Markdown or HTML." },
    ],
    specs: [
      { label: "Parser", value: "marked 18 (GFM)" },
      { label: "Sanitiser", value: "DOMPurify 3" },
      { label: "Allowed link protocols", value: "http, https, mailto, tel, relative" },
      { label: "Images", value: "http(s) and raster data URLs" },
      { label: "Raw HTML", value: "Shown as text, never rendered" },
      { label: "Storage", value: "None, or this browser only (opt-in)" },
    ],
    formats: ["Markdown", ".md", "HTML"],
    privacy: "Your writing stays in your browser. It's never sent anywhere; the optional draft is stored only on this device and can be cleared at any time.",
    examples: [
      { title: "A task list", body: "- [x] Draft outline / - [ ] Add screenshots renders as a checklist with one item ticked." },
      { title: "A table", body: "| Tool | Price | / | --- | ---: | / | Editor | Free | renders a table with the price column right-aligned." },
      { title: "Unsafe links", body: "[click](javascript:alert(1)) renders as plain text — the link is removed rather than executed." },
    ],
    faqs: [
      { q: "What is Markdown?", a: "Markdown is a simple formatting syntax for plain text, created in 2004. Symbols like # for headings and ** for bold are converted to formatted text, so documents stay readable even before rendering." },
      { q: "Why do developers and writers use Markdown?", a: "It's fast to type, works in any text editor, is easy to version-control, and is supported by GitHub, documentation sites, note apps and many CMSs." },
      { q: "How is Markdown different from HTML?", a: "HTML is the language browsers render, with tags like <h1> and <strong>. Markdown is a shorter way of writing common formatting that's converted to HTML. This editor shows you that HTML and lets you export it." },
      { q: "Can I use HTML inside Markdown here?", a: "For safety, raw HTML is shown as text rather than rendered. Use Markdown syntax for formatting." },
      { q: "How do I export my document?", a: "Use Download .md for the Markdown source, or Export HTML for a styled standalone web page. You can also copy either to the clipboard." },
      { q: "Is my text saved or uploaded?", a: "It's never uploaded. If you switch on “Keep draft in this browser”, it's saved in your browser's local storage on this device only — turn it off or clear it whenever you like." },
    ],
    related: ["word-counter", "json-formatter", "case-converter"],
    searchTerms: ["markdown", "md", "editor", "preview", "previewer", "readme", "github", "gfm", "markdown to html", "writer", "notes", "table", "code"],
    published: "2026-11-12",
    updated: "2026-11-12",
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
    related: ["gst-calculator", "emi-calculator", "percentage-calculator"],
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
    related: ["percentage-calculator", "gst-calculator", "emi-calculator"],
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
      title: "PDF to Excel Converter – Convert PDF Tables to XLSX Online",
      description:
        "Convert PDF tables to Excel (XLSX) or CSV online for free. Bank statements, invoices and reports become editable spreadsheets — numbers stay numbers, IDs stay exact. Runs on your device.",
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
    updated: "2026-11-13",
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
      title: "Excel to PDF Converter – Convert XLS and XLSX to PDF Online",
      description:
        "Convert Excel XLSX and CSV to PDF online for free. Pick sheets, paper size, orientation, fit to width, repeated headers and page numbers, then preview. Runs on your device.",
      keyword: "Excel to PDF Converter",
      secondary: ["Excel to PDF", "XLSX to PDF", "XLS to PDF", "convert spreadsheet to PDF", "Excel spreadsheet to PDF", "online Excel to PDF converter"],
    },
    features: [
      { title: "Looks like your sheet", body: "Number and date formats, fonts, fill colours, borders, merged cells, column widths and pictures are kept." },
      { title: "Your page settings", body: "A4, A3, Letter or Legal; portrait, landscape or automatic; narrow, normal, wide or custom margins." },
      { title: "Fit wide sheets", body: "Print at actual size, fit all columns to the page width, or fit a whole sheet on one page." },
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
      { label: "Scaling", value: "Actual size, fit to width, fit to page" },
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
    updated: "2026-11-13",
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
    related: ["pdf-editor", "pdf-splitter", "pdf-merger", "pdf-compressor"],
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
    name: "Watermark PDF",
    category: "pdf",
    icon: "stamp",
    short: "Stamp text or a logo across PDF pages — with opacity, rotation, position and tiling.",
    intro:
      "Add a text or logo watermark to your PDF — CONFIDENTIAL, DRAFT, your company logo or anything else. Set the opacity, angle and position, choose the pages, and see exactly how it will look before you download.",
    what:
      "A PDF watermark is text or an image placed on every page (or selected pages) to mark a document as confidential, a draft or yours. ZSpace Tools' Watermark PDF adds the watermark on top of your existing pages as real text or a picture, keeping the original content sharp and selectable.",
    how:
      "The watermark is turned into objects placed in each page's coordinates — the same objects drive the live preview (drawn over a pdf.js render) and the final file (written with pdf-lib), so the preview matches the download, including on rotated or odd-sized pages. Text watermarks are real PDF text in Helvetica, Times or Courier; image watermarks keep their transparency. Opacity is applied with PDF transparency, not by fading the page, and the original page content is never turned into an image.",
    seo: {
      title: "Add Watermark to PDF – Text and Image Watermark Online",
      description:
        "Add a text or image watermark to PDF online for free. Choose opacity, rotation, position, tiling and pages, with a live preview. Watermarked on your device — nothing is uploaded.",
      keyword: "Watermark PDF",
      secondary: ["add watermark to PDF", "PDF watermark", "insert logo into PDF", "add text watermark", "add image watermark", "stamp PDF", "watermark PDF pages"],
    },
    features: [
      { title: "Text or logo", body: "Presets like CONFIDENTIAL and DRAFT, any custom text, or your PNG, JPG or WebP logo with transparency." },
      { title: "Full control", body: "Font, size, colour, opacity, rotation, nine positions, a diagonal preset, margins — or drag it anywhere." },
      { title: "Tiled watermarks", body: "Repeat the mark across the whole page for documents that must not be reused." },
      { title: "Choose pages", body: "All, first, last, odd, even or a custom range like 2-5, 9." },
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
      { label: "Pages", value: "All, first, last, odd, even, custom ranges" },
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
    related: ["add-page-numbers", "pdf-editor", "sign-pdf"],
    searchTerms: ["watermark pdf", "add watermark", "pdf watermark", "stamp pdf", "confidential", "draft", "logo on pdf", "add logo to pdf", "text watermark", "image watermark"],
    published: "2026-11-13",
    updated: "2026-11-13",
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
      title: "Add Page Numbers to PDF – Number PDF Pages Online",
      description:
        "Add page numbers to PDF online for free. Choose position, style (1, Page 1 of 10, Roman), start number and pages to skip, plus header and footer text. Runs on your device.",
      keyword: "Add Page Numbers to PDF",
      secondary: ["number PDF pages", "insert page numbers in PDF", "PDF page numbering", "add page numbers online", "PDF footer page numbers", "PDF header and footer", "number pages in a PDF document"],
    },
    features: [
      { title: "Six positions", body: "Top or bottom; left, centre or right — placed the same distance from the edge on every page size." },
      { title: "Seven styles", body: "1, 01, Page 1, Page 1 of 10, 1 / 10, I II III and i ii iii — with any prefix or suffix." },
      { title: "Skip cover pages", body: "Leave the first pages unnumbered and start counting at 1 (or any number) where you want." },
      { title: "Page ranges", body: "Number all pages, odd or even pages, or a custom range." },
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
    related: ["watermark-pdf", "pdf-editor", "pdf-organizer"],
    searchTerms: ["page numbers", "number pdf pages", "add page numbers", "pdf page numbering", "pagination", "header footer pdf", "roman numerals", "page x of y", "footer"],
    published: "2026-11-13",
    updated: "2026-11-13",
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
];

/** Ideas on the roadmap — shown as "coming soon", never linked or indexed. */
export const plannedTools: { name: string; category: CategoryId }[] = [
  { name: "Lorem Ipsum Generator", category: "text" },
  { name: "Character Counter", category: "text" },
  { name: "Time Zone Converter", category: "date" },
  { name: "JSON to CSV Converter", category: "developer" },
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
