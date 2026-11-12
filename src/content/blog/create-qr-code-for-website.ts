import type { Post } from "@/lib/blog-types";

export const post: Post = {
  slug: "create-qr-code-for-website",
  title: "How to Create a QR Code for Your Website",
  description:
    "Create a QR code for your website that scans reliably: static vs. dynamic codes, print size, contrast, logos, testing and tracking with UTM tags.",
  excerpt:
    "A QR code takes seconds to make and is permanent once printed. Here is how to create one for your website that scans first time, every time.",
  keyword: "create a QR code for your website",
  published: "2026-11-12",
  updated: "2026-11-12",
  tools: ["qr-code-generator"],
  body: [
    {
      type: "p",
      text: "To create a QR code for your website, you only need the page's URL and a generator — the code itself takes seconds. The part that deserves care is everything around it: choosing the right URL, sizing the code for where it will be printed, keeping enough contrast to scan, and testing before anything goes to the printer. Once a static code is on a flyer or a shop window, it can't be changed, so it pays to get it right the first time.",
    },
    {
      type: "tool",
      slug: "qr-code-generator",
      text: "Create free, permanent QR codes for links, text, email, phone numbers and Wi-Fi, with custom colors and PNG or SVG download.",
    },
    { type: "h2", text: "Static vs. dynamic QR codes", id: "static-vs-dynamic" },
    {
      type: "p",
      text: "Before you make a QR code, it helps to know which kind you're making.",
    },
    {
      type: "table",
      head: ["", "Static QR code", "Dynamic QR code"],
      rows: [
        ["What it contains", "Your URL or data, directly in the pattern", "A short redirect link controlled by a service"],
        ["Can you change the destination later?", "No", "Yes"],
        ["Scan counts", "Not built in (use analytics on your site)", "Usually provided by the service"],
        ["Expires?", "Never", "Stops working if the service or subscription ends"],
        ["Cost", "Free to generate", "Often a subscription"],
      ],
    },
    {
      type: "p",
      text: "The ZSpace [QR Code Generator](/qr-code-generator/) creates static codes only. That's a deliberate choice: a static code has no middleman, so it will keep working for as long as your website does. The trade-off is that you can't edit it after printing. If you might need to change the destination, point the code at a stable URL on your own site — such as `example.com/menu/` — and update that page, or set up a redirect on your own server.",
    },
    { type: "h2", text: "How to create a QR code for your website", id: "how-to-create-a-qr-code" },
    {
      type: "ol",
      items: [
        "**Choose the URL type.** Open the [QR Code Generator](/qr-code-generator/) and select URL.",
        "**Paste the full address,** including `https://`. Copy it from your browser's address bar to avoid typos.",
        "**Style it.** Set foreground and background colors, and optionally add a logo in the center. The tool warns you if the contrast is too low to scan reliably.",
        "**Pick error correction.** M is a sensible default. Adding a logo automatically raises it to H.",
        "**Test it.** Scan the live preview with your phone's camera and make sure it opens the right page.",
        "**Download.** Choose PNG (256 to 2,048 px) for screens and documents, or SVG for print.",
      ],
    },
    {
      type: "p",
      text: "Everything is generated in your browser. The URLs and any Wi-Fi passwords you enter are not sent to a server.",
    },
    { type: "h2", text: "Choose the URL carefully", id: "choose-the-url" },
    {
      type: "p",
      text: "Because a static code is permanent, the URL is the most important decision you'll make.",
    },
    {
      type: "ul",
      items: [
        "**Use HTTPS.** Modern browsers warn on insecure pages, and that's a poor first impression after someone has made the effort to scan.",
        "**Link to a specific, lasting page,** not a temporary campaign URL you may delete next month.",
        "**Make sure the page works on mobile.** Almost everyone scanning a QR code is on a phone.",
        "**Keep it short where you can.** Longer URLs need more modules (the small squares), producing a denser code that is harder to scan at small sizes.",
      ],
    },
    { type: "h3", text: "Tracking scans with a static code" },
    {
      type: "p",
      text: "Static codes don't count scans themselves, but your website analytics can. Add UTM parameters to the URL so visits from the code appear as their own source:",
    },
    {
      type: "example",
      title: "A URL tagged for tracking",
      text: "`https://example.com/menu/?utm_source=qr&utm_medium=print&utm_campaign=table-card` — visits from this code will show up in most analytics tools under the source “qr” and the campaign “table-card”. The trade-off is a longer URL and a denser code, so test at your intended print size.",
    },
    { type: "h2", text: "Size, contrast and placement", id: "size-contrast-placement" },
    {
      type: "h3",
      text: "Print size",
    },
    {
      type: "p",
      text: "A widely used rule of thumb is that a QR code should be at least about 2 × 2 cm (roughly 0.8 inches) for close-range scanning, and that its width should be around one-tenth of the scanning distance. These are guidelines, not standards — denser codes need more room — so always test a printed proof.",
    },
    {
      type: "table",
      head: ["Where it's used", "Typical scan distance", "Suggested minimum width"],
      rows: [
        ["Business card, product label", "10–20 cm", "2–2.5 cm"],
        ["Flyer, menu, table card", "20–40 cm", "3–4 cm"],
        ["Poster on a wall", "1–2 m", "10–20 cm"],
        ["Shop window or banner", "3 m or more", "30 cm or more"],
      ],
    },
    { type: "h3", text: "Contrast and colors" },
    {
      type: "ul",
      items: [
        "**Dark code on a light background** is the safest choice. Inverted codes (light on dark) aren't read by every scanner app.",
        "**Keep strong contrast.** Brand colors are fine if the foreground is clearly darker than the background. Pale yellow on white will fail.",
        "**Avoid busy backgrounds.** Don't place the code over a photo or pattern.",
      ],
    },
    { type: "h3", text: "The quiet zone" },
    {
      type: "p",
      text: "QR codes need a clear margin around them, called the quiet zone. The QR specification calls for four modules of empty space on every side. Designers often crop this away to save room, and scanning suffers as a result. Leave the margin in place and don't let text or graphics crowd it.",
    },
    { type: "h2", text: "Adding a logo safely", id: "adding-a-logo" },
    {
      type: "p",
      text: "QR codes include error correction: redundant data that lets the code be read even when part of it is damaged or covered. There are four levels, each able to recover roughly this share of the code:",
    },
    {
      type: "table",
      head: ["Level", "Recovery capacity", "Use it when"],
      rows: [
        ["L", "About 7%", "Clean digital display, short content"],
        ["M", "About 15%", "General use — a good default"],
        ["Q", "About 25%", "Printed codes that may get scuffed"],
        ["H", "About 30%", "Codes with a logo in the center"],
      ],
    },
    {
      type: "p",
      text: "A logo works by deliberately covering part of the code and relying on error correction to fill the gap. That's why the generator switches to H when you add one. Keep the logo small and centered, and remember that higher correction also makes the code denser. Test with more than one phone before printing.",
    },
    { type: "h2", text: "Beyond URLs: Wi-Fi, email and phone", id: "other-qr-code-types" },
    {
      type: "p",
      text: "The same generator can encode other content types using standard payload formats that phone cameras recognize:",
    },
    {
      type: "table",
      head: ["Type", "Payload format", "What happens on scan"],
      rows: [
        ["Wi-Fi", "`WIFI:T:WPA;S:MyNetwork;P:secret;;`", "Phone offers to join the network"],
        ["Email", "`mailto:hello@example.com?subject=Hello`", "Opens a new email"],
        ["Phone", "`tel:+15551234567`", "Offers to call the number"],
      ],
    },
    {
      type: "p",
      text: "In the Wi-Fi format, `T` is the security type, `S` is the network name (SSID) and `P` is the password. If you ever write the payload by hand, characters such as `;`, `,`, `:` and `\\` inside the network name or password need a backslash before them. Keep in mind that anyone who scans a Wi-Fi code can read the password, so display it only where you'd share the password anyway — a guest network is a good fit. A [strong random password](/blog/generate-strong-random-password/) is easy to share this way, since nobody needs to type it.",
    },
    { type: "h2", text: "Test before you print", id: "test-before-you-print" },
    {
      type: "ol",
      items: [
        "Scan the on-screen preview with both an iPhone and an Android phone if you can.",
        "Print a proof at the actual size, on the actual paper or material.",
        "Scan the proof from the distance people will really stand, in the lighting it will really have.",
        "Check that the page loads quickly and looks right on mobile.",
        "Only then send the final file to print — SVG if your printer or design software accepts it.",
      ],
    },
    {
      type: "callout",
      title: "Always include a fallback",
      text: "Print a short, readable version of the URL next to the code. Some people can't or won't scan, and it lets everyone see where the code leads before they open it.",
    },
  ],
  faqs: [
    {
      q: "How do I create a QR code for my website for free?",
      a: "Paste your page's URL into a free static QR code generator, such as the ZSpace QR Code Generator, then download the code as PNG or SVG. Static codes have no subscription and never expire.",
    },
    {
      q: "Do QR codes expire?",
      a: "Static QR codes never expire, because the URL is stored in the pattern itself. Dynamic codes can stop working if the redirect service or subscription behind them ends.",
    },
    {
      q: "Can I change where a QR code points after printing it?",
      a: "Not with a static code. Instead, point it at a stable page on your own site and update that page, or set up a redirect on your own server.",
    },
    {
      q: "What size should a printed QR code be?",
      a: "A common rule of thumb is at least about 2 × 2 cm for close scanning, with the width around one-tenth of the scanning distance. Always test a printed proof at the real size.",
    },
    {
      q: "Should I download my QR code as PNG or SVG?",
      a: "Use SVG for print, because it scales to any size without losing sharpness. Use PNG for websites, documents and social posts.",
    },
  ],
};
