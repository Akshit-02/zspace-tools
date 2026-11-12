import type { Post } from "@/lib/blog-types";

export const post: Post = {
  slug: "reduce-pdf-file-size",
  title: "How to Reduce PDF File Size Online",
  description:
    "Why PDFs get large and how to reduce PDF file size online — compression levels, scan settings and fixes for text-heavy files that won't shrink.",
  excerpt:
    "A large PDF is almost always a PDF full of images. Learn where the bytes come from, which compression level to choose, and what to do when a file refuses to shrink.",
  keyword: "reduce PDF file size",
  published: "2026-11-12",
  updated: "2026-11-12",
  tools: ["pdf-compressor", "image-compressor"],
  body: [
    {
      type: "p",
      text: "If you need to reduce PDF file size to get under an email limit or an upload form's cap, the first step is understanding where the size comes from. In most oversized PDFs, the answer is embedded images: scanned pages, photos dropped into a report, or high-resolution graphics exported at print quality. Text itself is remarkably compact. That one fact explains why some PDFs shrink dramatically and others barely move, and it tells you which fix to reach for.",
    },
    {
      type: "tool",
      slug: "pdf-compressor",
      text: "Shrink PDFs by re-compressing their embedded images, with text and vectors left sharp and selectable — all in your browser.",
    },
    { type: "h2", text: "Why PDFs get so large", id: "why-pdfs-get-large" },
    {
      type: "p",
      text: "A PDF is a container. It can hold text, fonts, vector drawings, images, form fields and metadata, and each contributes differently to the final size.",
    },
    {
      type: "table",
      head: ["Content", "Typical impact on size", "Can compression help?"],
      rows: [
        ["Scanned pages", "Very large — every page is a full image", "Yes, usually a lot"],
        ["Photos and screenshots", "Large, especially if inserted at full camera resolution", "Yes"],
        ["Embedded fonts", "Small to moderate; larger for many fonts or full character sets", "Rarely, without changing the document"],
        ["Text", "Very small", "Little to gain"],
        ["Vector charts and diagrams", "Usually small; very complex drawings can add up", "Little to gain"],
      ],
    },
    {
      type: "p",
      text: "A 20-page contract typed in a word processor might be a few hundred kilobytes. The same 20 pages printed and scanned back in can easily be many megabytes, because each page is now a photograph of text rather than text.",
    },
    { type: "h2", text: "How to reduce PDF file size with ZSpace Tools", id: "how-to-reduce-pdf-file-size" },
    {
      type: "p",
      text: "The [PDF Compressor](/pdf-compressor/) opens your document in the browser, finds the raster images inside it, downscales and re-encodes them as JPEG, and saves the document with compressed object streams. Text, fonts, links and vector graphics are left untouched, so text stays crisp and selectable.",
    },
    {
      type: "ol",
      items: [
        "**Add your PDF.** Drag it onto the drop zone or click to choose it. Files up to 100 MB are supported, limited mainly by your device's memory.",
        "**Choose a compression level.** Low, medium or high — see the table below.",
        "**Compress and review.** Press Compress PDF. The tool measures the result against your original and only offers the download if the file is genuinely smaller.",
        "**Check the output.** Open the compressed file, zoom in on a photo or scanned page, and confirm it is still clear enough for its purpose.",
      ],
    },
    {
      type: "table",
      head: ["Level", "Image size limit", "JPEG quality", "Best for"],
      rows: [
        ["Low", "Up to 2,400 px", "80%", "Documents you may print; detailed scans"],
        ["Medium", "Up to 1,600 px", "65%", "Email, uploads and most everyday sharing"],
        ["High", "Up to 1,100 px", "45%", "On-screen reading where the smallest file matters most"],
      ],
    },
    {
      type: "p",
      text: "Each image is only replaced if its re-encoded version is smaller, so images that are already small are left alone. Because processing happens locally, the document is never uploaded — useful for contracts, statements and other files you would rather not send to a third-party server.",
    },
    {
      type: "callout",
      title: "What the tool can't compress",
      text: "Password-protected PDFs must be unlocked first in the app that protected them. Images stored as CMYK or indexed color are skipped rather than risk changing their colors, so print-production files may not shrink much.",
    },
    { type: "h2", text: "Choosing the right compression level", id: "choosing-a-compression-level" },
    {
      type: "p",
      text: "Start with **medium**. For a scanned letter or a report with photos, it usually brings the file down substantially while keeping everything readable on screen. If you can see blockiness in photos or small scanned text becomes hard to read, step back to **low**. If you just need to scrape under a size limit and the document will only be read on screens, try **high**.",
    },
    {
      type: "p",
      text: "Be careful with high compression on scans of small print, such as the fine print of a contract or a receipt. With images capped at 1,100 pixels, a full-page scan ends up at roughly 100–130 pixels per inch — fine for normal body text on screen, but marginal for very small type.",
    },
    { type: "h2", text: "Common size limits to aim for", id: "common-size-limits" },
    {
      type: "p",
      text: "Limits change, so check the service you're using, but these are useful reference points at the time of writing:",
    },
    {
      type: "ul",
      items: [
        "**Gmail:** 25 MB for attachments on a single email. Larger files are offered as a Google Drive link instead.",
        "**Other email services and corporate mail servers:** limits vary and are often lower — 10 MB or 20 MB is common. When in doubt, aim well under 10 MB.",
        "**Online forms and portals** (job applications, government and university uploads): often a few megabytes per file. The form itself is the only reliable source.",
      ],
    },
    {
      type: "p",
      text: "Remember that email attachments are encoded for transport, which adds overhead. A file just under the stated limit can still be rejected, so leave some headroom.",
    },
    { type: "h2", text: "When a PDF won't shrink", id: "when-a-pdf-wont-shrink" },
    {
      type: "p",
      text: "If the compressor reports that your PDF can't be made smaller, it is being honest rather than broken. The usual reasons:",
    },
    {
      type: "ul",
      items: [
        "**It's mostly text.** There's little to remove. A text-only PDF is usually already small.",
        "**It's already optimized.** Many apps compress images on export, and compressing again gains nothing.",
        "**Fonts are the bulk.** Documents embedding several large fonts — particularly fonts with big character sets — carry that weight regardless of image settings.",
        "**The images use CMYK or indexed color,** which the tool doesn't re-encode, to avoid altering colors.",
      ],
    },
    { type: "h3", text: "Re-export from the original file" },
    {
      type: "p",
      text: "If you have the source document, re-exporting is often the best fix. On Windows, Microsoft Word's Save As PDF dialog offers an **Optimize for: Minimum size (publishing online)** option. Design apps usually provide export presets with lower image resolution. Exporting fresh avoids compressing images that were already compressed once.",
    },
    { type: "h3", text: "Compress images before they go in" },
    {
      type: "p",
      text: "When you're building a document from photos, compress and resize the images first with the [Image Compressor](/image-compressor/), then insert them. A 1,600-pixel photo at 75% quality is plenty for a page in a report. Our guide to [compressing images without losing quality](/blog/compress-images-without-losing-quality/) covers the settings in detail.",
    },
    { type: "h3", text: "Scan smarter" },
    {
      type: "ul",
      items: [
        "**Resolution:** 150–200 dpi is generally enough for documents read on screen. Use 300 dpi when you need to print the result or run text recognition (OCR) on it.",
        "**Color mode:** scan black-and-white text documents in grayscale or black and white. Color scans of plain text are much larger for no benefit.",
        "**Crop:** trim the scanner bed's empty margins so you aren't storing blank space.",
      ],
    },
    { type: "h3", text: "Send a link instead" },
    {
      type: "p",
      text: "Sometimes the honest answer is that a large document should stay large — an architectural drawing set or a high-resolution portfolio, for example. Upload it to a cloud storage service and share a link rather than degrading it to fit an attachment limit.",
    },
    {
      type: "example",
      title: "Example: a scanned application packet",
      text: "A 12-page application scanned in color at 600 dpi needs to go through a portal with a small upload limit. Running it through the PDF Compressor at medium is a good first step, because every page is an image. If it's still too large, try high and check that the smallest text is legible. Next time, scanning at 200 dpi in grayscale will produce a much smaller file from the start.",
    },
    { type: "h2", text: "A quick checklist", id: "checklist" },
    {
      type: "ol",
      items: [
        "Work out what's in the PDF: scans and photos compress well; text doesn't need to.",
        "Run it through the [PDF Compressor](/pdf-compressor/) at medium.",
        "Open the result and check images and small print at normal zoom.",
        "Adjust the level up or down if needed.",
        "If it won't shrink, re-export from the source, compress images before inserting them, or share a link.",
      ],
    },
  ],
  faqs: [
    {
      q: "How can I reduce PDF file size without losing quality?",
      a: "Compress only the images and leave text and vectors alone. Text stays perfectly sharp, and at low or medium compression most photos and scans look the same on screen while taking far less space.",
    },
    {
      q: "Why won't my PDF get smaller?",
      a: "Most PDF size comes from images, so text-only or already optimized PDFs have little to remove. Large embedded fonts and CMYK or indexed-color images can also limit how much a PDF shrinks.",
    },
    {
      q: "What is the maximum attachment size in Gmail?",
      a: "At the time of writing, Gmail allows up to 25 MB of attachments per email. Larger files are shared as a Google Drive link instead.",
    },
    {
      q: "Will compressing a PDF make the text blurry?",
      a: "Not with the ZSpace PDF Compressor. It re-encodes embedded images only, so text and vector graphics stay sharp and selectable. Text in scanned pages is part of an image, though, so check small print after using high compression.",
    },
    {
      q: "Is it safe to compress a confidential PDF online?",
      a: "With the ZSpace PDF Compressor, the file is processed in your browser and never uploaded to a server. You should still follow your organization's policies for sensitive documents.",
    },
  ],
};
