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

export type CategoryId = "image" | "pdf" | "text" | "productivity" | "developer" | "conversion";

export type IconName =
  | "image"
  | "file-text"
  | "qr"
  | "type"
  | "key"
  | "code"
  | "repeat"
  | "zap";

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
  /** Words people type into search that should surface this tool. */
  searchTerms: string[];
  published: string;
  updated: string;
}

export const categories: Category[] = [
  { id: "image", name: "Image Tools", description: "Compress and prepare images for the web.", icon: "image" },
  { id: "pdf", name: "PDF Tools", description: "Make PDF documents smaller and easier to share.", icon: "file-text" },
  { id: "text", name: "Text Tools", description: "Count, measure and work with writing.", icon: "type" },
  { id: "productivity", name: "Productivity Tools", description: "Small utilities that save everyday minutes.", icon: "zap" },
  { id: "developer", name: "Developer Tools", description: "Formatters, encoders and converters for builders.", icon: "code" },
  { id: "conversion", name: "Conversion Tools", description: "Change files and units from one format to another.", icon: "repeat" },
];

const MAX_IMG = `${limits.imageMaxMB} MB`;
const MAX_PDF = `${limits.pdfMaxMB} MB`;

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
    related: ["pdf-compressor", "qr-code-generator", "word-counter"],
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
    related: ["image-compressor", "word-counter", "qr-code-generator"],
    searchTerms: ["pdf", "compress", "reduce", "shrink", "smaller", "document", "file size", "email", "attachment", "optimize", "mb"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    category: "productivity",
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
    related: ["password-generator", "word-counter", "image-compressor"],
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
    related: ["password-generator", "qr-code-generator", "pdf-compressor"],
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
    related: ["qr-code-generator", "word-counter", "image-compressor"],
    searchTerms: ["password", "generator", "random", "secure", "strong", "passphrase", "secret", "key", "security", "login"],
    published: "2026-11-12",
    updated: "2026-11-12",
  },
];

/** Ideas on the roadmap — shown as "coming soon", never linked or indexed. */
export const plannedTools: { name: string; category: CategoryId }[] = [
  { name: "Image Resizer", category: "image" },
  { name: "Image Cropper", category: "image" },
  { name: "Image Format Converter", category: "conversion" },
  { name: "PDF Merger", category: "pdf" },
  { name: "PDF Splitter", category: "pdf" },
  { name: "PDF to Image", category: "conversion" },
  { name: "Image to PDF", category: "conversion" },
  { name: "Case Converter", category: "text" },
  { name: "Lorem Ipsum Generator", category: "text" },
  { name: "Character Counter", category: "text" },
  { name: "Age Calculator", category: "productivity" },
  { name: "Percentage Calculator", category: "productivity" },
  { name: "GST Calculator", category: "productivity" },
  { name: "Discount Calculator", category: "productivity" },
  { name: "JSON Formatter", category: "developer" },
  { name: "Base64 Encoder/Decoder", category: "developer" },
  { name: "URL Encoder/Decoder", category: "developer" },
  { name: "Time Zone Converter", category: "conversion" },
  { name: "Unit Converter", category: "conversion" },
  { name: "Date Calculator", category: "productivity" },
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
