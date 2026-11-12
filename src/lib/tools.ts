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
  | "globe";

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
  { id: "conversion", name: "Conversion Tools", description: "Convert units and formats in a click.", icon: "repeat" },
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
];

/** Ideas on the roadmap — shown as "coming soon", never linked or indexed. */
export const plannedTools: { name: string; category: CategoryId }[] = [
  { name: "Image Format Converter", category: "conversion" },
  { name: "PDF to Image", category: "conversion" },
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
  return tools.filter((t) => t.category === id);
}

export function toolPath(slug: string) {
  return `/${slug}/`;
}

export function relatedTools(tool: Tool) {
  return tool.related.map(getTool).filter((t): t is Tool => Boolean(t));
}
