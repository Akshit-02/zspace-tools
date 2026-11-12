import type { Post } from "@/lib/blog-types";

export const post: Post = {
  slug: "compress-images-without-losing-quality",
  title: "How to Compress Images Without Losing Quality",
  description:
    "Compress images without losing visible quality: the right format, the right quality setting and the right dimensions for JPG, PNG and WebP.",
  excerpt:
    "Most images can lose half their file size with no difference you can see. Here is how to pick the format, quality level and dimensions that get you there.",
  keyword: "compress images without losing quality",
  published: "2026-11-12",
  updated: "2026-11-12",
  tools: ["image-compressor"],
  body: [
    {
      type: "p",
      text: "You can compress images without losing quality that anyone will notice, but it helps to be precise about what that means. Lossy formats like JPEG and WebP always discard some data when they compress; the goal is to discard only the detail the eye does not register. Done well, a photo can often shrink to a fraction of its original size and still look identical on screen. Done carelessly, you get blocky skies, smeared text and halos around edges. This guide covers the three decisions that matter: format, quality setting and pixel dimensions.",
    },
    {
      type: "tool",
      slug: "image-compressor",
      text: "Compress JPG, PNG and WebP images in your browser with a quality slider and a before-and-after comparison — nothing is uploaded.",
    },
    { type: "h2", text: "Lossy vs. lossless: what “without losing quality” really means", id: "lossy-vs-lossless" },
    {
      type: "p",
      text: "**Lossless** compression shrinks a file while keeping every pixel exactly as it was. PNG is the familiar example. It is ideal for screenshots and graphics with flat color, but the savings on photographs are modest, because photos are full of fine noise that lossless methods cannot simplify.",
    },
    {
      type: "p",
      text: "**Lossy** compression, used by JPEG and lossy WebP, throws away information that matters least to human vision — mostly very fine detail and subtle color variation. It produces much smaller files, and at sensible settings the difference is invisible at normal viewing size. So in practice, “compressing without losing quality” means compressing without losing **visible** quality, and checking the result with your own eyes.",
    },
    {
      type: "callout",
      title: "Avoid repeated re-saving",
      text: "Every time a JPEG is decoded and saved again as JPEG, it loses a little more detail. Keep an original master file and always compress from that, rather than compressing an already-compressed copy.",
    },
    { type: "h2", text: "Choose the right format first", id: "choose-the-right-format" },
    {
      type: "p",
      text: "Format often matters more than the quality slider. Saving a photo as PNG can make it several times larger than a good JPEG, and saving a logo as JPEG can add fuzzy artifacts around crisp edges.",
    },
    {
      type: "table",
      head: ["Image type", "Best format", "Why"],
      rows: [
        ["Photos, product shots, hero images", "JPG or WebP", "Lossy compression handles natural gradients and noise efficiently."],
        ["Screenshots with text, UI, diagrams", "PNG (or WebP)", "Sharp edges and flat color stay clean; JPEG adds ringing around text."],
        ["Logos and icons with transparency", "PNG or WebP", "Both support an alpha channel. JPG does not."],
        ["Photos for a modern website", "WebP", "Typically smaller than JPEG at similar visual quality, and supported by all current major browsers."],
        ["Images people will download and edit", "JPG at high quality", "Maximum compatibility with older software and devices."],
      ],
    },
    {
      type: "p",
      text: "One caution about transparency: converting a PNG with transparent areas to JPG fills those areas with a solid color, because JPEG has no alpha channel. The ZSpace [Image Compressor](/image-compressor/) flattens onto white in that case and keeps transparency intact for PNG and WebP output.",
    },
    { type: "h2", text: "Pick a quality setting that matches the job", id: "recommended-quality-settings" },
    {
      type: "p",
      text: "Quality settings are not standardized across apps — 80 in one program is not exactly 80 in another — so treat the numbers below as starting points rather than rules. For most photos, the sweet spot sits between about 70 and 85. Above that, files grow quickly for little visible gain; below about 60, artifacts start to appear in smooth areas such as skies and skin.",
    },
    {
      type: "table",
      head: ["Use case", "Suggested quality", "Notes"],
      rows: [
        ["Website hero or portfolio image", "80–85%", "Large on screen, so artifacts are easier to spot."],
        ["Blog and article images", "70–80%", "A good default; start at 75%."],
        ["Product photos for a shop", "75–85%", "Customers zoom in, so err on the higher side."],
        ["Email attachments and chat", "65–75%", "Viewed small; size matters more than fine detail."],
        ["Thumbnails and previews", "50–65%", "Tiny display size hides most artifacts."],
        ["Archive or print master", "Keep the original", "Don't compress the only copy you have."],
      ],
    },
    {
      type: "p",
      text: "The images that tolerate compression worst are those with large smooth gradients (sunsets, studio backdrops) and those containing small text. Busy, textured photos — foliage, crowds, gravel — hide artifacts well and can often go lower.",
    },
    { type: "h2", text: "Resize before you compress", id: "resize-before-you-compress" },
    {
      type: "p",
      text: "The single biggest saving usually comes from pixel dimensions, not quality. A modern phone photo is often 4,000 pixels or more across. If it will be displayed in a 1,200-pixel-wide content column, most of those pixels are wasted. Halving both width and height cuts the pixel count to a quarter, and the file size falls roughly in proportion.",
    },
    {
      type: "ul",
      items: [
        "**Full-width website images:** around 1,600–2,000 px wide is plenty for most layouts, including high-density screens.",
        "**In-article images:** about twice the displayed width (for example, 1,400 px for a 700 px column) keeps them sharp on high-density displays.",
        "**Email and messaging:** 1,200–1,600 px on the long edge is usually enough.",
      ],
    },
    {
      type: "p",
      text: "The [ZSpace Image Compressor](/image-compressor/) can do both steps at once: set **Max dimension** to a preset such as 1920 px or 1280 px and every image is scaled down (keeping its proportions) before it is compressed. If you need an exact, non-standard size or a crop, resize first in your photo editor or your operating system's built-in tools, then compress the resized copy.",
    },
    { type: "h2", text: "How to compress images with ZSpace Tools", id: "how-to-compress-images" },
    {
      type: "p",
      text: "The [Image Compressor](/image-compressor/) runs entirely in your browser. Your files are decoded, re-encoded and handed back without being uploaded anywhere, which also makes it quick for large batches.",
    },
    {
      type: "ol",
      items: [
        "**Add your images.** Drag JPG, PNG or WebP files onto the drop zone, or click to choose them. You can add up to 30 images at once, each up to 25 MB.",
        "**Set the quality.** Start at 75%. The range runs from 10% to 100%; lower values give smaller files.",
        "**Choose an output format.** Keep the original format, or convert to WebP or JPG. Converting a large PNG photo to WebP or JPG is often the biggest win.",
        "**Compare before and after.** Drag the slider across the preview, paying attention to smooth areas, fine edges and any text.",
        "**Download.** Save images one at a time or all together as a ZIP file.",
      ],
    },
    {
      type: "p",
      text: "Each result shows the original size, the new size and the percentage saved, measured from the actual output file. If an image is already well optimized and re-encoding would make it bigger, the tool keeps your original rather than handing you a larger file.",
    },
    {
      type: "example",
      title: "Example: a phone photo for a blog post",
      text: "Start with a 4,032 × 3,024 JPG straight from a phone. Set Max dimension to 1920 px, then compress at 75% quality, or convert to WebP at the same setting. Check the sky and any edges with the before-and-after slider. If you can't see a difference at the size it will be displayed, you're done — and the file will be a small fraction of the original.",
    },
    { type: "h2", text: "What happens to PNG files", id: "compressing-png-files" },
    {
      type: "p",
      text: "PNG is lossless, so you might expect it to be impossible to shrink without changing anything. The ZSpace tool instead uses **color quantization**: it reduces the image to a smaller palette of colors while keeping transparency. For screenshots, icons and illustrations with limited color, this can cut file size dramatically with no visible change. For photographs saved as PNG, quantization can introduce banding in gradients, and converting to WebP or JPG is usually the better choice.",
    },
    { type: "h2", text: "Metadata: the free saving", id: "strip-metadata" },
    {
      type: "p",
      text: "Photos from cameras and phones carry EXIF metadata: the camera model, exposure settings, a date and time, sometimes a GPS location, and occasionally an embedded thumbnail. Re-encoding through the ZSpace Image Compressor drops this data. That trims a few kilobytes and, more importantly, removes location data you may not want to publish. The tool reads the EXIF orientation before discarding it, so phone photos are not left sideways.",
    },
    { type: "h2", text: "How to check you haven't lost quality", id: "check-quality" },
    {
      type: "ul",
      items: [
        "**View at the real display size.** Judging at 400% zoom will make every setting look bad. Check at the size people will actually see.",
        "**Look at the hard parts.** Smooth gradients, skin tones, fine text and high-contrast edges show artifacts first.",
        "**Compare side by side.** A before-and-after slider makes subtle blocking or color shifts easy to spot.",
        "**Step down gradually.** If 75% looks perfect, try 65%. Stop when you first notice a difference, then go back one step.",
      ],
    },
    { type: "h2", text: "Common mistakes", id: "common-mistakes" },
    {
      type: "ul",
      items: [
        "Uploading a 5,000-pixel image to a site that displays it at 800 pixels.",
        "Saving photographs as PNG because it is “lossless” — the file can be many times larger than necessary.",
        "Saving logos and screenshots as low-quality JPEG, which blurs text and adds halos.",
        "Re-compressing the same JPEG over and over instead of working from the original.",
        "Using 100% quality and expecting a small file. At the top of the scale, size rises steeply for almost no visible benefit.",
      ],
    },
    {
      type: "p",
      text: "If your images end up inside a document, compressing them before you build the PDF is the cleanest way to keep it small. See [How to Reduce PDF File Size Online](/blog/reduce-pdf-file-size/) for the PDF side of the problem.",
    },
  ],
  faqs: [
    {
      q: "Can you compress an image without losing any quality at all?",
      a: "Only with lossless compression, which gives modest savings on photos. Lossy compression at around 70–85% quality removes detail the eye rarely notices, so the image looks the same at normal size while being much smaller.",
    },
    {
      q: "What is the best quality setting for JPEG compression?",
      a: "For most photos, 70–85% is the best balance. Use the higher end for large hero images and product photos, and 65–75% for email attachments and small in-article images.",
    },
    {
      q: "Is WebP better than JPEG?",
      a: "For websites, WebP usually produces smaller files at similar visual quality and also supports transparency. JPEG remains the safer choice when files need to open in older software or be shared widely outside the web.",
    },
    {
      q: "Why did my compressed image get bigger?",
      a: "Images that are already heavily optimized can grow when re-encoded, especially at high quality settings. The ZSpace Image Compressor detects this and keeps your original file instead.",
    },
    {
      q: "Does compressing an image remove its metadata?",
      a: "Re-encoding with the ZSpace Image Compressor removes EXIF metadata, including camera details and GPS location. Orientation is applied to the pixels first, so photos stay the right way up.",
    },
  ],
};
